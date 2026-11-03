// engine.js - Игровой цикл, пошаговая острая фаза, перемотка времени и дедлайны (v2.2)

function isModalActive() {
  if (typeof document === 'undefined') return false;

  const evBox = document.getElementById('eventOverlayBox');
  if (evBox && !evBox.classList.contains('hidden')) return true;

  if (window.currentCandidateCall) {
    const candModal = document.getElementById('candidateInterviewModal');
    if (candModal && !candModal.classList.contains('hidden')) return true;
  }

  if (typeof isMentorModalOpen !== 'undefined' && isMentorModalOpen) {
    const mentModal = document.getElementById('mentorModal');
    if (mentModal && !mentModal.classList.contains('hidden')) return true;
  }

  if (typeof window.isMentorArchiveOpen !== 'undefined' && window.isMentorArchiveOpen) {
    const archModal = document.getElementById('mentorArchiveModal');
    if (archModal && !archModal.classList.contains('hidden')) return true;
  }

  if (typeof window.isScenarioPickerOpen !== 'undefined' && window.isScenarioPickerOpen) {
    const scenModal = document.getElementById('scenarioPickerModal');
    if (scenModal && !scenModal.classList.contains('hidden')) return true;
  }

  if (typeof window.isAlbumModalOpen !== 'undefined' && window.isAlbumModalOpen) {
    const albModal = document.getElementById('savedAlbumModal');
    if (albModal && !albModal.classList.contains('hidden')) return true;
  }

  if (typeof window.isAnimalModalOpen !== 'undefined' && window.isAnimalModalOpen) {
    const animModal = document.getElementById('animalModal');
    if (animModal && !animModal.classList.contains('hidden')) return true;
  }

  return false;
}
window.isModalActive = isModalActive;

function setSpeed(speed) {
  if (state.gameOver) return;
  if (isModalActive() && speed > 0) return;

  // В первые 3 дня активна пошаговая «Острая фаза» (GDD 2.1)
  if (state.onboarding && state.onboarding.acutePhase && speed > 0) {
    addLog(`День ${state.day}: 🛑 Дни 1–3 — это пошаговая «Острая фаза»! Спокойно изучите обстановку, посетите клинику и завершите день кнопкой «🌙 Завершить день».`, 'warn');
    return;
  }

  if (tickTimer) {
    clearInterval(tickTimer);
    tickTimer = null;
  }
  currentSpeed = speed;
  const delays = { 1: 2500, 2: 1200, 5: 500 };
  if (speed > 0 && delays[speed]) {
    tickTimer = setInterval(processDayTick, delays[speed]);
  }
  updateSpeedButtonsUI();
}

function stopTimer() {
  currentSpeed = 0;
  if (tickTimer) {
    clearInterval(tickTimer);
    tickTimer = null;
  }
  updateSpeedButtonsUI();
}

function advanceAcuteDay() {
  if (state.gameOver) return;
  if (!document.getElementById('eventOverlayBox').classList.contains('hidden')) return;
  if (window.currentCandidateCall) {
    const candModal = document.getElementById('candidateInterviewModal');
    if (candModal && !candModal.classList.contains('hidden')) return;
  }
  if (typeof isMentorModalOpen !== 'undefined' && isMentorModalOpen) return;

  processDayTick();

  if (state.day >= 4 && state.onboarding && state.onboarding.acutePhase) {
    state.onboarding.acutePhase = false;
    addLog(`День 4: 🌅 Острая фаза позади! Разблокирован автоматический таймер и режимы скорости (1x, 2x, 5x, Промотать штиль).`, 'success');
  }
  renderAll();
}

function updateSpeedButtonsUI() {
  const isAcute = state.onboarding && state.onboarding.acutePhase;
  const btnAcute = document.getElementById('btnAdvanceAcuteDay');
  if (btnAcute) {
    if (isAcute) {
      btnAcute.classList.remove('hidden');
    } else {
      btnAcute.classList.add('hidden');
    }
    if (state.gameOver) {
      btnAcute.disabled = true;
      btnAcute.classList.add('cursor-not-allowed', 'opacity-50');
      btnAcute.title = 'Партия окончена: режим просмотра истории';
    } else {
      btnAcute.disabled = false;
      btnAcute.classList.remove('cursor-not-allowed', 'opacity-50');
      btnAcute.title = '';
    }
  }

  const speedControls = document.getElementById('speedButtonsGroup');
  if (speedControls) {
    if (isAcute) {
      speedControls.classList.add('hidden');
      speedControls.classList.remove('flex');
    } else {
      speedControls.classList.remove('hidden');
      speedControls.classList.add('flex');
    }
  }

  const mapping = [
    { id: 'btnSpeed0', s: 0 },
    { id: 'btnSpeed1', s: 1 },
    { id: 'btnSpeed2', s: 2 },
    { id: 'btnSpeed5', s: 5 }
  ];
  mapping.forEach(item => {
    const el = document.getElementById(item.id);
    if (!el) return;
    if (state.gameOver) {
      el.disabled = true;
      el.className = 'px-2 py-1 rounded-lg text-xs font-mono font-semibold bg-[var(--bg-muted)] text-[var(--text-muted)] border border-[var(--border-subtle)] cursor-not-allowed opacity-50';
      el.title = 'Партия окончена';
    } else {
      el.disabled = false;
      el.title = '';
      el.className = currentSpeed === item.s
        ? 'px-2 py-1 rounded-lg text-xs font-mono font-bold bg-emerald-600 text-white transition shadow-sm'
        : 'px-2 py-1 rounded-lg text-xs font-mono font-semibold bg-[var(--bg-muted)] hover:bg-[var(--bg-elevated)] text-[var(--text-primary)] border border-[var(--border-subtle)] transition';
    }
  });

  const btnFastForward = document.getElementById('btnFastForward');
  if (btnFastForward) {
    if (isAcute) {
      btnFastForward.classList.add('hidden');
    } else {
      btnFastForward.classList.remove('hidden');
    }
    if (state.gameOver) {
      btnFastForward.disabled = true;
      btnFastForward.className = 'px-2.5 py-1 rounded-lg text-xs font-mono font-bold bg-indigo-950/40 text-indigo-300/40 border border-indigo-900/40 cursor-not-allowed opacity-50';
      btnFastForward.title = 'Партия окончена';
    } else {
      btnFastForward.disabled = false;
      btnFastForward.className = 'px-2.5 py-1 rounded-lg text-xs font-mono font-bold bg-indigo-600 hover:bg-indigo-500 text-white transition shadow-sm';
      btnFastForward.title = 'Промотать спокойные дни (авто-стоп за 1 день до любого дедлайна)';
    }
  }

  const dot = document.getElementById('tickIndicator');
  if (dot) {
    if (state.gameOver) {
      dot.className = 'inline-flex items-center justify-center w-2.5 h-2.5 rounded-full bg-slate-400';
    } else {
      dot.className = currentSpeed === 0
        ? 'inline-flex items-center justify-center w-2.5 h-2.5 rounded-full bg-amber-400'
        : 'inline-flex items-center justify-center w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping';
    }
  }
}

function fastForwardCalmDays() {
  if (state.gameOver) return;
  if (isModalActive()) return;
  stopTimer();

  if (state.onboarding && state.onboarding.acutePhase) {
    addLog(`День ${state.day}: ⛔ В первые 3 дня идет пошаговая острая фаза — завершайте дни вручную!`, 'warn');
    return;
  }

  if (state.newborn.active && isAnimalAtPlayerHome()) {
    addLog(`День ${state.day}: ⛔ Нельзя включить быструю перемотку, пока слепые котята живут у вас дома на ежедневном ручном выкорме!`, 'warn');
    return;
  }

  if (state.escapeQuest && state.escapeQuest.active) {
    addLog(`День ${state.day}: ⛔ Нельзя перематывать штиль во время экстренного поиска беглеца! Срочно прочесывайте подвалы.`, 'warn');
    return;
  }

  let skipped = 0;
  const maxSkip = 15;
  let stopReason = '';

  while (skipped < maxSkip && !state.gameOver) {
    const stopCheck = getTomorrowDeadlineWarning();
    if (stopCheck) {
      stopReason = stopCheck;
      break;
    }
    processDayTick();
    skipped += 1;
    if (!document.getElementById('eventOverlayBox').classList.contains('hidden') || state.gameOver) {
      break;
    }
  }

  if (skipped > 0 && document.getElementById('eventOverlayBox').classList.contains('hidden')) {
    const msg = stopReason
      ? `⏩ Промотано ${skipped} дн. Авто-стоп за 1 день до события: ${stopReason}`
      : `⏩ Промотано ${skipped} спокойных дней.`;
    addLog(`День ${state.day}: ${msg}`, 'info');
  } else if (skipped === 0 && stopReason && document.getElementById('eventOverlayBox').classList.contains('hidden')) {
    addLog(`День ${state.day}: ⛔ Авто-стоп перемотки: ${stopReason}`, 'warn');
  }
  renderAll();
}

// Умная перемотка: 13 правил автоматической остановки за 1 день (GDD 2.1)
function getTomorrowDeadlineWarning() {
  const a = state.animal;

  // 1. За 1 день до окончания запаса корма/наполнителя (daysLeft <= 2)
  const nActive = a.activeCount !== undefined ? a.activeCount : (a.count || 0);
  if (nActive > 0 && !(state.newborn.active && isAnimalAtPlayerHome())) {
    const totalFood = state.supplies.daysLeft + (state.zooshans.giftedFoodDaysLeft || 0);
    if (totalFood <= 2) {
      return 'завтра заканчивается запас корма и расходников (нужно закупить пакет в зоомагазине)!';
    }
  }

  // 2. За 1 день до окончания смеси у слепышей на передержке
  if (state.newborn.active && !isAnimalAtPlayerHome() && state.newborn.milkDaysLeft <= 2) {
    return 'у передержки заканчивается специализированная смесь для слепышей (105 BYN)!';
  }

  // 3. За 1 день до предупреждения или блокировки талона Зоошанса (при debt > 0)
  if (state.zooshans.voucherDebt > 0 && (state.zooshans.voucherDaysLeft === 4 || state.zooshans.voucherDaysLeft === 1)) {
    return state.zooshans.voucherDaysLeft === 1
      ? 'завтра истекает срок талона «Зоошанса» (грозит блокировка)!'
      : 'завтра остается 3 дня до истечения срока оплаты талона «Зоошанса»!';
  }

  // 4. За 1 день до обязательного 7-дневного финотчета по сбору на личную карту (на 6-й день)
  if (state.zooshans.personalFundraiserActive && !state.zooshans.personalDonationsBanned && state.zooshans.daysSinceLastFinReport === 6) {
    return 'завтра истекает 7-дневный срок обязательного финотчета по личному сбору!';
  }

  // 5. За 1 день до 2-й таблетки глистогонки (на 9-й день после первой)
  if (a.dewormStage === 1 && a.daysSinceDeworm1 === 9) {
    return 'завтра (10-й день) пора давать вторую таблетку глистогонки!';
  }

  // 6. За 1 день до истечения 180 дней действия глистогонки (на 179-й день)
  if (a.dewormStage === 2 && a.daysSinceDeworm2 === 179) {
    return 'завтра истекает 6 месяцев (180 дней) действия обработки от паразитов!';
  }

  // 7. За 1 день до окончания лактации у мамы-кошки (на 44-й день возраста котят)
  if (a.hasMotherCat && a.motherLactating && a.ageDays === 44) {
    return 'завтра заканчивается лактация у мамы-кошки (на 45-й день — открытие стерилизации)!';
  }

  // 8. За 1 день до исполнения котятам/щенкам 2 месяцев (на 59-й день — открытие вакцинации и ранней брони)
  if (a.ageDays === 59 && !a.parasitesAndVaccinated) {
    return 'завтра малышам исполняется 2 месяца (60 дней) — открывается вакцинация и передача по ранней брони!';
  }

  // 9. За 1 день до полового созревания в 6 месяцев (на 179-й день — блокировка пристройства без стерилизации)
  if ((a.ageCategory === 'kitten' || a.ageCategory === 'puppy') && a.ageDays === 179 && !a.isSterilized) {
    return 'завтра питомцу исполняется 6 месяцев (180 дней) — половое созревание и блокировка пристройства без стерилизации!';
  }

  // 10. За 1 день до контрольных просветов лампой Вуда при лечении лишая (на 24-й и 34-й день)
  if (a.knownRingworm === true && (a.ringwormDaysDone === 24 || a.ringwormDaysDone === 34)) {
    return 'завтра контрольный просвет лампой Вуда по лечению микроспории!';
  }

  // 11. За 1 день до падения объявлений на сайтах пиара (на 5-й день после обновления)
  if (state.pr.prActive && state.pr.daysSinceAdRefresh === 5) {
    return 'завтра объявления на сайтах опустятся в ленте — нужно обновить пиар!';
  }

  // 12. За 1 день до сдачи крови на титры (29-й день) и за 1 день до конца 90-дневного карантина ЕС (89-й день)
  if (state.abroad.rabiesVaccineAndChipDone && !state.abroad.titerBloodTaken && state.abroad.daysSinceRabiesVaccine === 29) {
    return 'завтра 30 дней после прививки от бешенства — можно сдавать кровь на титры для ЕС!';
  }
  if (state.abroad.titerBloodTaken && state.abroad.daysInEuQuarantine === 89) {
    return 'завтра завершается 90-дневный карантин ЕС!';
  }

  // 13. NEW in v2.2: За 1 день до окончания 14-дневного испытательного срока или развязки красных флагов
  if (state.trialAnimals && state.trialAnimals.length > 0) {
    for (const t of state.trialAnimals) {
      if (t.isRedFlag && t.daysPassed === 3) {
        return `завтра 4-й день у новых хозяев подопечного («${t.petName}»)!`;
      }
      const totalDays = t.trialDaysTotal || 14;
      if (!t.isRedFlag && t.daysPassed === totalDays - 1) {
        return `завтра (${totalDays}-й день) завершается испытательный срок у новых хозяев («${t.petName}»)!`;
      }
    }
  }

  if (state.maneuver && state.maneuver.active && state.maneuver.daysRemaining === 1) {
    return 'завтра истекает срок маневра для поиска новой передержки!';
  }

  if (a.pcrPending && a.pcrDaysRemaining === 1) {
    return 'завтра приходит результат лабораторного ПЦР-исследования!';
  }
  if (a.fipTreatment && a.fipDaysLeft === 1) {
    return 'завтра завершается 84-дневный протокол лечения ФИП!';
  }
  if (state.escapeQuest && state.escapeQuest.active && state.escapeQuest.daysRemaining === 1) {
    return 'завтра истекает последний день экстренного поиска беглеца!';
  }

  // За 1 день до истечения защиты собаки от клещей (капли на 30 дней)
  const isDogConfinedFF = a.traumaOperated || (a.hiddenState && a.hiddenState.hasSevereTrauma) || a.id === 'severe_trauma_sheri_dog' || (a.inStationaryDaysLeft && a.inStationaryDaysLeft > 0);
  if (a.species === 'dog' && a.tickProtectionDaysLeft === 1 && !isDogConfinedFF) {
    return 'завтра истекает 30-дневная защита собаки от иксодовых клещей (риск пироплазмоза)!';
  }

  // За 1 день до ежемесячной зарплаты
  if (state.day % 30 === 29) {
    return 'завтра начисление ежемесячной зарплаты куратора!';
  }

  return null;
}

// Проверка триггеров наставника (GDD Реактивный ментор)
function checkMentorTriggers(directHintId = null) {
  if (state.gameOver) return;

  function fireMentorHint(id) {
    if (typeof triggerMentorHint === 'function') {
      triggerMentorHint(id);
    } else if (typeof unlockMentorHint === 'function') {
      unlockMentorHint(id);
    }
  }

  function canShowHint(id) {
    if (state.shownHints && state.shownHints[id]) return false;
    if (typeof isMentorHintUnlocked === 'function' && isMentorHintUnlocked(id)) return false;
    return true;
  }

  if (directHintId) {
    if (canShowHint(directHintId)) {
      fireMentorHint(directHintId);
    }
    return;
  }

  // 1. LOW_ENERGY_WARNING: state.energy <= 25
  if (state.energy <= 25 && canShowHint('LOW_ENERGY_WARNING')) {
    fireMentorHint('LOW_ENERGY_WARNING');
  }

  // 2. CLINIC_DEBT_HALFWAY: state.zooshans && state.zooshans.voucherDebt >= 500
  if (state.zooshans && state.zooshans.voucherDebt >= 500 && canShowHint('CLINIC_DEBT_HALFWAY')) {
    fireMentorHint('CLINIC_DEBT_HALFWAY');
  }

  // 3. QUARANTINE_BREACH_RISK: unvax cat on floor with quarantine < 14 days
  if (
    state.player &&
    state.player.ownPets &&
    state.player.ownPets.id === 'unvaccinated_cat' &&
    state.zooshans &&
    state.zooshans.locationStatus === 'home_floor' &&
    state.animal &&
    state.animal.quarantineDaysDone < 14 &&
    canShowHint('QUARANTINE_BREACH_RISK')
  ) {
    fireMentorHint('QUARANTINE_BREACH_RISK');
  }

  // 4. REVACCINATION_OVERDUE: past 28 days or vaccine without deworming
  if (
    state.animal &&
    ((state.animal.parasitesAndVaccinated && state.animal.daysSinceVaccine1 > 28) || state.animal.vaccineDewormLapse) &&
    canShowHint('REVACCINATION_OVERDUE')
  ) {
    fireMentorHint('REVACCINATION_OVERDUE');
  }

  // 5. STALE_PR_WARNING: stale ads > 14 days or animal reached 180 days without sterilization
  if (
    state.pr &&
    state.pr.prActive &&
    ((state.pr.daysSinceAdRefresh > 14) || (state.animal && state.animal.ageDays >= 180 && !state.animal.isSterilized)) &&
    canShowHint('STALE_PR_WARNING')
  ) {
    fireMentorHint('STALE_PR_WARNING');
  }
}
window.checkMentorTriggers = checkMentorTriggers;

function processDayTick() {
  if (state.gameOver) {
    stopTimer();
    return;
  }

  if (typeof checkMentorTriggers === 'function') {
    checkMentorTriggers();
  }

  const a = state.animal;
  const g = getAnimalGrammar(a);

  // 1. Продвижение календаря дат и сезонов (GDD 2.2)
  state.calendarDate.setDate(state.calendarDate.getDate() + 1);
  const newSeason = getSeasonFromMonth(state.calendarDate.getMonth());
  if (newSeason !== state.currentSeason) {
    state.currentSeason = newSeason;
    if (!state.seasonsPassed.includes(newSeason)) {
      state.seasonsPassed.push(newSeason);
    }
    const sLabel = getSeasonLabelRu(newSeason);
    addLog(`День ${state.day}: 🍂 Наступил новый сезон — ${sLabel}! Условия пристройства и сезонные риски обновились.`, 'info');
  }

  // 2. Выкорм слепышей (GDD 7.1)
  if (state.newborn.active) {
    if (isAnimalAtPlayerHome()) {
      if (!state.newborn.fedToday) {
        a.health -= 38;
        state.mental -= 18;
        addLog(`День ${state.day}: 🚨 ПРОПУЩЕНО КОРМЛЕНИЕ СЛЕПЫШЕЙ ДОМА! Котята кричат от голода и переохлаждения (-38% жизни)!`, 'danger');
        if (a.health <= 0) {
          state.fatalMistakeReason = 'cow_milk_or_starvation';
          triggerEndGame(false, 'ТРАГЕДИЯ: Слепые котята не пережили пропуск кормления', 'Новорожденные котята погибают от гипогликемии уже через несколько часов без теплой смеси.');
          return;
        }
      }
      state.newborn.fedToday = false;
      state.mental -= 8; // Недосып дома со слепышами
    } else {
      // На передержке быт не на игроке, но игрок обеспечивает смесь!
      if (state.newborn.milkDaysLeft > 0) {
        state.newborn.milkDaysLeft -= 1;
      } else {
        a.health -= 25;
        state.mental -= 15;
        addLog(`День ${state.day}: 🚨 У ПЕРЕДЕРЖКИ ЗАКОНЧИЛАСЬ СМЕСЬ ДЛЯ СЛЕПЫШЕЙ! Вы не обеспечили расходники — котята голодают! Купите банку смеси (105 BYN)!`, 'danger');
      }
    }

    // В 21 день (3 недели) слепыши открывают глаза и переходят на паштет Babycat (GDD 6.3)
    if (a.ageDays >= 21) {
      state.newborn.active = false;
      a.ageCategory = 'kitten';
      a.litterTrained = false;
      a.visibleState = 'Котята открыли глазки (3 недели) и перешли с соски на паштет Babycat! Вакцинация откроется в 60 дней.';
      addLog(`День ${state.day}: 🎉 Слепыши подросли до 3 недель, открыли глаза и с аппетитом кушают паштет Babycat! Кормление из соски завершено.`, 'success');
    }
  }

  // 3. Динамический расход пакета корма/наполнителя с учетом остатка выводка (GDD 7.1)
  const nActive = a.activeCount !== undefined ? a.activeCount : a.count;
  const nTotal = a.totalCount || a.count || 1;
  let foodConsumptionRate = nActive > 0 ? (nActive / nTotal) : 0;
  // Слепыши на ручном выкорме дома питаются специализированной смесью из соски, а не сухим кормом
  if (state.newborn.active && isAnimalAtPlayerHome()) {
    foodConsumptionRate = 0;
  }
  if (a.hasMotherCat && a.motherLactating) {
    foodConsumptionRate *= 2.5; // Кормящая мама ест в 2.5 раза больше
  }

  if (foodConsumptionRate > 0) {
    if (state.zooshans.giftedFoodDaysLeft > 0) {
      state.zooshans.giftedFoodDaysLeft = Math.max(0, +(state.zooshans.giftedFoodDaysLeft - foodConsumptionRate).toFixed(2));
    } else if (state.supplies.daysLeft > 0) {
      state.supplies.daysLeft = Math.max(0, +(state.supplies.daysLeft - foodConsumptionRate).toFixed(2));
    } else {
      a.health = Math.max(0, a.health - 8);
      state.mental = Math.max(0, state.mental - 10);
      checkMentalHealth();
      if (!isAnimalAtPlayerHome()) {
        addLog(`День ${state.day}: 🚨 СКАНДАЛ С ПЕРЕДЕРЖКОЙ: Закончился корм и наполнитель! Срочно закупите пакет в зоомагазине (вкладка 3)!`, 'danger');
      } else {
        addLog(`День ${state.day}: 🚨 ДОМА ЗАКОНЧИЛСЯ КОРМ И НАПОЛНИТЕЛЬ! Срочно закупите пакет в зоомагазине (вкладка 3)!`, 'danger');
      }
    }
  }

  // Переход к новому дню и взросление
  state.day += 1;
  a.ageDays += 1;
  if (a && a.parasitesAndVaccinated) {
    a.daysSinceVaccine1 = (a.daysSinceVaccine1 || 0) + 1;
  }

  // Окончание лактации у мамы-кошки на 45-й день
  if (a.hasMotherCat && a.motherLactating && a.ageDays >= 45) {
    a.motherLactating = false;
    a.visibleState = 'Котята подросли и кушают сами! Лактация завершена — открыта стерилизация мамы-кошки и раннее бронирование.';
    addLog(`День ${state.day}: 🍼 Лактация у мамы-кошки завершена! Теперь маму можно стерилизовать, а котят передавать по ранней брони!`, 'success');
  }

  // Подростковый возраст в 120 дней (4 мес.) — угловатые подростки, -35% к популярности (GDD 6.3)
  if ((a.ageCategory === 'kitten' || a.ageCategory === 'puppy') && a.ageDays === 120) {
    a.coatPopularity = +(a.coatPopularity * 0.65).toFixed(2);
    addLog(`День ${state.day}: 🐾 Подопечный вытянулся в угловатого подростка (4 месяца). Умиление «малышами» спало — интерес потенциальных хозяев снизился на 35%.`, 'info');
  }

  // Половое созревание в 6 месяцев (180 дней) — блокировка пристройства без стерилизации (GDD 6.3)
  if ((a.ageCategory === 'kitten' || a.ageCategory === 'puppy') && a.ageDays >= 180 && !a.isSterilized) {
    a.ageCategory = 'adult';
    a.visibleState = 'Половое созревание! Дальнейшее пристройство заблокировано до проведения обязательной стерилизации.';
    addLog(`День ${state.day}: ⚠️ Питомцу исполнилось 6 месяцев (180 дней)! Половое созревание — пристройство заблокировано до обязательной стерилизации/кастрации.`, 'warn');
  }

  // Защита от клещей у собак весной/летом (GDD 2.2, 6.3)
  if (a.species === 'dog') {
    if (a.tickProtectionDaysLeft > 0) {
      a.tickProtectionDaysLeft -= 1;
    } else if ((state.currentSeason === 'spring' || state.currentSeason === 'summer') && isAnimalAtPlayerHome()) {
      const isDogConfined = a.traumaOperated || (a.hiddenState && a.hiddenState.hasSevereTrauma) || a.id === 'severe_trauma_sheri_dog' || (a.inStationaryDaysLeft && a.inStationaryDaysLeft > 0);
      if (!isDogConfined && Math.random() < 0.08 && !state.triggeredEvents.piroplasmosisOutbreak) {
        state.triggeredEvents.piroplasmosisOutbreak = true;
        triggerPiroplasmosisCrisisModal();
        renderAll();
        return;
      }
    }
  }

  // Ожидание результатов лабораторного ПЦР (7 дней)
  if (a.pcrPending) {
    a.pcrDaysRemaining -= 1;
    if (a.pcrDaysRemaining <= 0) {
      a.pcrPending = false;
      a.pcrTested = true;
      if (a.hiddenState.chronicCarrier) {
        a.knownCarrier = a.hiddenState.chronicCarrier;
        if (a.hiddenState.chronicCarrier === 'FeLV') {
          addLog(`День ${state.day}: 🧬 РЕЗУЛЬТАТ ПЦР ИЗ ЛАБОРАТОРИИ: Обнаружен вирусный лейкоз кошек (FeLV+)! Сдайте подтверждающий тест на провирус и пройдите консультацию инфекциониста для назначения противовирусной терапии (вкладка «Клиника»). Звонки на пристройство будут идти реже (-60%).`, 'danger');
        } else {
          addLog(`День ${state.day}: 🧬 РЕЗУЛЬТАТ ПЦР ИЗ ЛАБОРАТОРИИ: Обнаружен скрытый ${a.hiddenState.chronicCarrier}+! Пристраивается строго одним котом в семью.`, 'warn');
        }
      } else if (a.hiddenState.deadlyVirus) {
        a.knownVirus = a.hiddenState.deadlyVirus;
        addLog(`День ${state.day}: 🧬 РЕЗУЛЬТАТ ПЦР ИЗ ЛАБОРАТОРИИ: Обнаружен вирус (${a.hiddenState.deadlyVirus})! Требуется терапия в изоляции.`, 'danger');
      } else if (a.hiddenState.hasChronicGI) {
        a.knownVirus = 'Трихомоноз (простейшие ЖКТ)';
        addLog(`День ${state.day}: 🧬 РЕЗУЛЬТАТ ПЦР: Обнаружен трихомоноз кошек (Tritrichomonas foetus)! Требуется курс Ронидазола и гастро-диета (вкладка «Клиника»).`, 'warn');
      } else if (Math.random() < 0.15) {
        a.pcrResultDoubtful = true;
        addLog(`День ${state.day}: ⚠️ РЕЗУЛЬТАТ ПЦР: Сомнительный / пограничный титр (по правилам ветлаборатории рекомендуется пересдать через 14 дней).`, 'warn');
      } else {
        addLog(`День ${state.day}: 🧬 РЕЗУЛЬТАТ ПЦР ИЗ ЛАБОРАТОРИИ: Анализ чистый ✓ (ВИК/ВЛК и респираторный профиль отрицательно)!`, 'success');
      }
    }
  }

  // Курс GS-441524 при ФИП
  if (a.fipTreatment) {
    a.fipDaysLeft -= 1;
    if (a.fipDaysLeft <= 0) {
      a.fipTreatment = false;
      a.fipCured = true;
      a.health = 95;
      state.mental = Math.min(100, state.mental + 25);
      addLog(`День ${state.day}: 🎉 ВЕЛИКАЯ ПОБЕДА НАД ФИП! 84-дневный курс GS-441524 полностью завершен! Животное вышло в стойкую пожизненную ремиссию!`, 'success');
    }
  }

  // Поддерживающая противовирусная терапия FeLV (Ралтегравир)
  if (a.felvAntiviralActive && a.felvAntiviralDaysLeft > 0) {
    a.felvAntiviralDaysLeft -= 1;
    if (a.health < 88 && Math.random() < 0.25) {
      a.health = Math.min(100, a.health + 1);
    }
  }

  // Экстренный 4-дневный поиск беглеца (GDD 7.3)
  if (state.escapeQuest && state.escapeQuest.active) {
    state.escapeQuest.daysRemaining -= 1;
    // Уличный урон беглецу (зимой мороз наносит двойной урон: -16 HP вместо -8 HP)
    const escapeDmg = state.currentSeason === 'winter' ? 16 : 8;
    a.health = Math.max(0, a.health - escapeDmg);
    if (a.health <= 0) {
      state.fatalMistakeReason = 'escape_lost_forever';
      triggerEndGame(
        false,
        'ТРАГЕДИЯ: Питомец погиб во время побега на улице...',
        state.currentSeason === 'winter'
          ? 'Потерявшееся животное замерзло насмерть на минском морозе...\n\nЗимой шансы выжить на улице у неприспособленного домашнего питомца тают с каждым часом. Надевайте трехремневые шлейки-антипобег!'
          : 'Потерявшееся испуганное животное погибло на улице под колесами машин или от зубов бродячих стай.\n\nШлейки-антипобег и сетки Pet Screen спасают жизни!'
      );
      return;
    }
    if (state.escapeQuest.daysRemaining <= 0 && state.escapeQuest.searchProgress < 100) {
      state.fatalMistakeReason = 'escape_lost_forever';
      triggerEndGame(
        false,
        'ТРАГЕДИЯ: Питомец пропал без вести...',
        'Истекли 4 суток экстренного поиска. Опрос дворников и поиски в подвалах не принесли результата. Питомец потерян навсегда...\n\nВолонтеры «Зоошанса» всегда настаивают на трехремневых шлейках-антипобег для собак и сетках-антикошках на окнах.'
      );
      return;
    } else {
      addLog(`День ${state.day}: ⏳ ПОИСК БЕГЛЕЦА: Осталось ${state.escapeQuest.daysRemaining} дн.! Прогресс: ${state.escapeQuest.searchProgress}%. Клейте макеты и ведите активный поиск!`, 'warn');
    }
  }

  if (a.ageDays === 45 && (a.ageCategory === 'kitten' || a.ageCategory === 'puppy')) {
    if (!a.hasMotherCat) {
      addLog(`День ${state.day}: 📌 Малышам 45 дней! Малышей без мамы уже можно отдавать в семьи по договору куратора (хозяева сделают прививки по возрасту)!`, 'success');
    } else {
      addLog(`День ${state.day}: 📌 Котятам исполнилось 1.5 месяца (45 дней)! Вакцинация доступна с 60 дней, но уже можно запустить пиар на РАННЕЕ БРОНИРОВАНИЕ!`, 'info');
    }
  }

  if (a.ageDays === 60 && (a.ageCategory === 'kitten' || a.ageCategory === 'puppy')) {
    addLog(`День ${state.day}: 🎂 Малышам исполнилось 2 месяца (60 дней)! Разблокирована комплексная вакцинация!`, 'success');
    if (state.pr.earlyBookedAdopterWaiting && nActive > 0) {
      triggerEarlyBookedTransferModal();
      renderAll();
      return;
    }
  }

  // 4. Таймеры карантина (14 дней), двукратной глистогонки (1+10) и полугодового повтора (180 дней)
  if (a.quarantineDaysDone < 14) {
    a.quarantineDaysDone += 1;
    if (a.quarantineDaysDone === 14 && !a.quarantineCompletedNotified) {
      a.quarantineCompletedNotified = true;
      addLog(`День ${state.day}: ✅ Первичный карантин (14 дней) пройден! Если клетка «Зоошанса» больше не нужна — продезинфицируйте и верните ее на склад.`, 'success');
    }
  }

  if (a.dewormStage === 1) {
    a.daysSinceDeworm1 += 1;
    if (a.volunteerHandlesDeworming && a.daysSinceDeworm1 >= 10) {
      a.dewormStage = 2;
      a.daysSinceDeworm2 = 0;
      a.volunteerHandlesDeworming = false;
      addLog(`День ${state.day}: 💊 Опытный волонтер строго по графику (на 10-й день) дала 2-ю таблетку от паразитов! Курс дегельминтизации успешно завершен без расхода ваших сил.`, 'success');
    } else if (a.daysSinceDeworm1 === 10) {
      addLog(`День ${state.day}: 📌 НАПОМИНАНИЕ: Прошло 10 дней после 1-й глистогонки! Пора дать вторую таблетку от паразитов (20 BYN).`, 'warn');
    }
  } else if (a.dewormStage === 2) {
    a.daysSinceDeworm2 += 1;
    if (a.daysSinceDeworm2 >= 180) {
      a.dewormStage = 1;
      a.daysSinceDeworm1 = 10;
      a.daysSinceDeworm2 = 0;
      addLog(`День ${state.day}: ⚠️ ПРОШЛО 6 МЕСЯЦЕВ (180 дней) долгого пристройства! Срок действия глистогонки истек — необходимо повторить обработку!`, 'danger');
    }
  }

  // 5. Лечение микроспории (лишая) в клетке — 35 дней (контрольные просветы на 24/25 и 34/35 день)
  if (a.knownRingworm === true) {
    a.ringwormDaysDone += 1;
    if (a.ringwormDaysDone === 25) {
      addLog(`День ${state.day}: 🔦 25-й день лечения микроспории в клетке: первый контрольный просвет Вуда показал затухание грибка. Продолжаем обработки до 35-го дня!`, 'info');
    } else if (a.ringwormDaysDone >= 35) {
      a.knownRingworm = 'Пролечен (2 чистых просвета)';
      a.hiddenState.ringworm = false;
      addLog(`День ${state.day}: 🎉 ПОБЕДА НАД ЛИШАЕМ! Спустя 35 дней лечения в клетке получены 2 чистых просвета лампой Вуда! Не забудьте продезинфицировать и вернуть клетку «Зоошансу».`, 'success');
    }
  }

  // 6. Приучение к лотку/пеленкам/выгулу, шприцевое кормление челюсти (18 дн.) и социализация (14 дн.)
  if (!a.litterTrained && nActive > 0) {
    a.litterTrainDaysDone += 1;
    if (isAnimalAtPlayerHome()) state.mental = Math.max(0, state.mental - 3);
    if (a.litterTrainDaysDone >= 8) {
      a.litterTrained = true;
      const isPuppy = a.species === 'dog' && (a.ageCategory === 'puppy' || a.ageDays < 180);
      const targetPlace = isPuppy ? 'пеленке без промахов' : (g.isDog ? 'терпению до выгула' : 'лотку без промахов');
      addLog(`День ${state.day}: ${isPuppy ? '🧻' : '🚽'} Ура! ${g.nom} наконец-то приучен(ы) к ${targetPlace}! Бытовая нагрузка снизилась.`, 'success');
    }
  }

  if (a.hiddenState.isJawFracture && a.traumaOperated && a.hiddenState.syringeDaysLeft > 0) {
    a.hiddenState.syringeDaysLeft -= 1;
    if (a.hiddenState.syringeDaysLeft === 0) {
      addLog(`День ${state.day}: 🥣 18 дней шприцевого кормления позади! Челюсть срослась, кошка снова ест сама!`, 'success');
    }
  }

  let justDischargedFromStationary = false;
  if (a.inStationaryDaysLeft && a.inStationaryDaysLeft > 0) {
    // Риск гибели в стационаре при критическом состоянии
    if (a.stationaryReason === 'virus') {
      const icuDeathChance = a.health < 40 ? 0.16 : 0.08;
      if (Math.random() < icuDeathChance) {
        state.fatalMistakeReason = 'icu_virus_fatal';
        triggerEndGame(
          false,
          'ТРАГЕДИЯ В СТАЦИОНАРЕ: Организм не справился с инфекцией...',
          `Несмотря на круглосуточную инфузионную терапию, противовирусную поддержку и инфузоматы в инфекционном ОРИТ, инфекция нанесла несовместимый с жизнью урон внутренним органам...\n\nУ непривитых малышей смертность от панлейкопении и парвовируса даже в лучших клиниках Минска достигает 20–30%. Врачи боролись за ${g.acc} до последней секунды.\n\nГлавный урок зоозащиты: только своевременная вакцинация способна гарантированно защитить жизнь!`
        );
        return;
      }
      a.health = Math.min(80, a.health + 12);
      addLog(`День ${state.day}: 🏥 Инфекционный стационар: ${g.nom} под инфузоматами в ОРИТ. Врачи ведут мониторинг показателей крови (осталось ${a.inStationaryDaysLeft - 1} дн. стационара).`, 'info');
    } else if (a.stationaryReason === 'trauma') {
      if (a.health < 25 && Math.random() < 0.12) {
        state.fatalMistakeReason = 'icu_trauma_fatal';
        triggerEndGame(
          false,
          'ТРАГЕДИЯ В РЕАНИМАЦИИ: Травматический шок...',
          `Тяжелые множественные переломы и скрытые повреждения внутренних органов привели к полиорганной недостаточности...\n\nВрачи реанимации боролись за ${g.acc}, но последствия автотравмы оказались фатальными.`
        );
        return;
      }
      a.health = Math.min(85, a.health + 8);
      addLog(`День ${state.day}: 🏥 Хирургический стационар: ${g.nom} под наблюдением после остеосинтеза. Боль купирована, раны затягиваются (осталось ${a.inStationaryDaysLeft - 1} дн. стационара).`, 'info');
    }

    a.inStationaryDaysLeft -= 1;
    if (a.inStationaryDaysLeft === 0) {
      justDischargedFromStationary = true;
      if (a.stationaryReason === 'virus') {
        a.virusRecoveryDaysLeft = 14; // 2 недели восстановления
        a.knownVirus = 'Выжил (долечивание 14 дн.)';
        a.hiddenState.deadlyVirus = null;
        addLog(`День ${state.day}: 🌿 ${g.nom} успешно выписан(а) из инфекционного стационара! Кризис миновал, но впереди 2 недели (14 дней) долечивания, щадящей диеты Gastrointestinal и карантина. Вакцинация и пристройство строго отложены!`, 'success');
      } else if (a.stationaryReason === 'trauma') {
        a.traumaRehabDaysLeft = 45; // 1.5 месяца покоя
        a.visibleState = 'Реабилитация после операции: сращение перелома (45 дн. покоя).';
        addLog(`День ${state.day}: 🦴 ${g.nom} выписан(а) из послеоперационного хирургического стационара на домашний покой! Операция позади, но для полного сращения костей требуется 1.5 месяца (45 дней) покоя. Пристройство отложено до снятия спиц и ограничений!`, 'success');
      } else {
        addLog(`День ${state.day}: 🏥 ${g.nom} успешно выписан(а) из послеоперационного стационара!`, 'success');
      }
    }
  }

  // Ежедневный прогресс восстановления после вируса (14 дней)
  if (!justDischargedFromStationary && a.virusRecoveryDaysLeft && a.virusRecoveryDaysLeft > 0) {
    a.virusRecoveryDaysLeft -= 1;
    if (a.health < 95) a.health = Math.min(95, a.health + 2);
    if (a.virusRecoveryDaysLeft === 0) {
      a.knownVirus = 'Полностью здоров (переболел)';
      addLog(`День ${state.day}: 🎉 2-недельный период восстановления после вируса завершен! Организм окреп, вирус элиминирован — подопечный готов к вакцинации и началу пиара!`, 'success');
    }
  }

  // Ежедневный прогресс реабилитации перелома (45 дней)
  if (!justDischargedFromStationary && a.traumaRehabDaysLeft && a.traumaRehabDaysLeft > 0) {
    a.traumaRehabDaysLeft -= 1;
    if (a.health < 98) a.health = Math.min(100, a.health + 1);
    if (a.traumaRehabDaysLeft === 0) {
      a.visibleState = 'Перелом полностью сросся, собака здорова!';
      addLog(`День ${state.day}: 🎉 1.5 месяца реабилитации позади! Контрольный рентген подтвердил полное сращение костей. Ограничения сняты, собака готова к пиару и переезду в любящую семью!`, 'success');
    }
  }

  if (a.hiddenState.needsSocialization && a.hiddenState.socializationDaysDone < 14) {
    a.hiddenState.socializationDaysDone += 1;
    if (a.hiddenState.socializationDaysDone === 14) {
      a.hiddenState.needsSocialization = false;
      addLog(`День ${state.day}: 💛 14 дней адаптации прошли успешно: пугливые кошки из накопителя перестали шипеть и начали мурчать на руках!`, 'success');
    }
  }

  if (!a.eyeDropsCompleted && a.eyeDropsDaysDone > 0) {
    a.eyeDropsDaysDone += 1;
    if (a.eyeDropsDaysDone >= 10) {
      a.eyeDropsCompleted = true;
      a.hiddenState.deadlyVirus = null;
      addLog(`День ${state.day}: 👁️ 10-дневный курс капель каждые 2 часа завершен! Язва роговицы зажила, зрение котят спасено!`, 'success');
    }
  }

  // 7. Подготовка в ЕС (30 дней до титров + 90 дней карантина)
  if (state.abroad.rabiesVaccineAndChipDone && !state.abroad.titerBloodTaken) {
    state.abroad.daysSinceRabiesVaccine += 1;
    if (state.abroad.daysSinceRabiesVaccine === 30) {
      addLog(`День ${state.day}: 🌍 ЕВРОПА: Прошло 30 дней после вакцинации от бешенства! Теперь можно сдать кровь на титры антител (630 BYN).`, 'success');
    }
  }
  if (state.abroad.titerBloodTaken && state.abroad.daysInEuQuarantine < 90) {
    state.abroad.daysInEuQuarantine += 1;
    if (state.abroad.daysInEuQuarantine === 90) {
      triggerEuAdoptionReadyModal();
      renderAll();
      return;
    }
  }
  if (state.abroad.titerFundraiserActive && state.abroad.titerCollectedAmount < 630) {
    const tDon = randomInt(25, 65);
    state.abroad.titerCollectedAmount = Math.min(630, state.abroad.titerCollectedAmount + tDon);
    state.cash = +(state.cash + tDon).toFixed(1);
    if (state.abroad.titerCollectedAmount >= 630) {
      state.abroad.titerFundraiserActive = false;
      addLog(`День ${state.day}: 🎉 Целевой сбор на титры бешенства (630 BYN) закрыт! Можно сдавать кровь.`, 'success');
    }
  }

  // 8. Зарплата каждые 30 дней (GDD 3.1)
  if (state.day % 30 === 0) {
    const sal = state.player.income.monthlyFreeCash;
    state.cash = +(state.cash + sal).toFixed(1);
    addLog(`День ${state.day}: 💰 Начислена зарплата! Свободный остаток +${sal} BYN добавлен в бюджет.`, 'success');
  }

  // 9. Энергия и Менталка
  const householdDrain = calculateDailyHouseholdEnergyDrain();
  const netEnergyChange = state.player.family.energyBonus - householdDrain;
  state.energy = Math.min(100, Math.max(5, state.energy + netEnergyChange));

  const housingMentalDrain = isAnimalAtPlayerHome() && nActive > 0 ? state.player.housing.dailyMentalDrain : 0;
  state.mental = Math.min(100, Math.max(0, state.mental + state.player.family.mentalBonus - housingMentalDrain));

  // 10. Оплата коммерческой платной передержки (16 BYN/сут кот | 33 BYN/сут собака, GDD 7.2)
  if (state.zooshans.locationStatus === 'paid_foster' && nActive > 0) {
    const fCost = a.species === 'dog' ? 33 : 16;
    if (state.cash >= fCost) {
      state.cash = +(state.cash - fCost).toFixed(1);
      state.personalMoneySpent = +(state.personalMoneySpent + fCost).toFixed(1);
    } else {
      state.zooshans.locationStatus = state.zooshans.hasCage ? 'home_cage' : 'home_floor';
      state.mental -= 15;
      addLog(`День ${state.day}: ⚠️ Не хватило средств на коммерческую передержку (${fCost} BYN/сут) — ${g.acc} вернули вам домой!`, 'danger');
    }
  }

  // 11. Внезапный визит арендодателя на 9-й день для съемной квартиры (rent_strict, GDD 3.2)
  if (state.player.housing.id === 'rent_strict' && state.day === 9 && isAnimalAtPlayerHome() && nActive > 0 && !state.triggeredEvents.landlordVisit) {
    state.triggeredEvents.landlordVisit = true;
    triggerLandlordVisitModal();
    renderAll();
    return;
  }

  // 12. Щенки грызут обувь и обои на 8-й день (orphan_puppies_litter, GDD 4.2)
  if (a.id === 'orphan_puppies_litter' && state.day === 8 && isAnimalAtPlayerHome() && nActive > 0 && !state.triggeredEvents.puppyChew) {
    state.triggeredEvents.puppyChew = true;
    state.cash = Math.max(0, +(state.cash - 85).toFixed(1));
    state.personalMoneySpent = +(state.personalMoneySpent + 85).toFixed(1);
    state.mental = Math.max(0, state.mental - 10);
    addLog(`День ${state.day}: 👞 Щенки в ваше отсутствие разгрызли хозяйскую обувь и обои в коридоре (-85 BYN на ремонт, -10% Менталки)!`, 'warn');
  }

  // 13. Конфликт с передержкой у новичка из соцсетей на 12-й день (GDD 7.2)
  if (state.zooshans.locationStatus === 'social_foster_novice' && nActive > 0) {
    state.zooshans.socialFosterDaysElapsed += 1;
    if (state.zooshans.socialFosterDaysElapsed === 12 && !state.zooshans.socialFosterConflictTriggered) {
      state.zooshans.socialFosterConflictTriggered = true;
      triggerSocialFosterConflictModal();
      renderAll();
      return;
    }
  }

  // 14. Окончание 14-дневного перехвата волонтером на карантин (GDD 7.2)
  if ((state.zooshans.locationStatus === 'temp_volunteer_14d' || state.zooshans.locationStatus === 'temp_volunteer_10d') && nActive > 0) {
    state.zooshans.tempVolunteerDaysLeft -= 1;
    if (state.zooshans.tempVolunteerDaysLeft <= 0) {
      triggerReturnFromTempVolunteerModal();
      renderAll();
      return;
    }
  }

  // 15. Сборы на р/с «Зоошанса» и сборы на личную карту (Формула DramаBase * Multiplier, GDD 5.2)
  if (state.zooshans.officialFundraiserActive && state.zooshans.voucherDebt > 0) {
    const donation = Math.min(state.zooshans.voucherDebt, randomInt(30, 60));
    state.zooshans.voucherDebt = +(state.zooshans.voucherDebt - donation).toFixed(1);
    state.voucherFundsUsed = +(state.voucherFundsUsed + donation).toFixed(1);
    if (state.zooshans.voucherDebt <= 0) {
      state.zooshans.officialFundraiserActive = false;
      state.zooshans.voucherBlocked = false;
      state.zooshans.voucherDaysLeft = 30;
      addLog(`День ${state.day}: 🎉 Официальный сбор на р/с «Зоошанса» полностью закрыл долг за операцию/стационар! Талоны разблокированы.`, 'success');
    }
  }

  if (state.zooshans.personalFundraiserActive && !state.zooshans.personalDonationsBanned) {
    state.zooshans.daysSinceLastFinReport += 1;

    // Расчет драматичности случая (DramaBase, GDD 5.2)
    let dramaMin = 35;
    let dramaMax = 65;
    const isHighDramaVirus = a.knownVirus === 'Панлейкопения' || a.knownVirus === 'Парвовирусный энтерит' ||
                             a.knownVirus === 'panleukopenia' || a.knownVirus === 'parvovirus_enteritis' ||
                             a.hiddenState.deadlyVirus === 'panleukopenia' || a.hiddenState.deadlyVirus === 'parvovirus_enteritis';

    const isTraumaOrCrisis = a.hiddenState.hasSevereTrauma || a.hiddenState.isJawFracture ||
                             state.triggeredEvents.felvCrisis || (a.id === 'severe_trauma_sheri_dog' && state.zooshans.voucherDebt > 0);

    if (state.newborn.active || isHighDramaVirus || isTraumaOrCrisis) {
      dramaMin = 190;
      dramaMax = 340;
    } else if (a.totalCount > 1 || a.knownRingworm === true || !a.eyeDropsCompleted || a.hiddenState.hasChronicGI) {
      dramaMin = 85;
      dramaMax = 140;
    }

    const socMult = state.player.socialCapital ? state.player.socialCapital.multiplier : 1.0;
    if (state.zooshans.personalCardCollectedBYN < 6500 && Math.random() < 0.50) {
      const baseDon = randomInt(dramaMin, dramaMax);
      const cardDon = Math.min(6500 - state.zooshans.personalCardCollectedBYN, Math.round(baseDon * socMult));
      if (cardDon > 0) {
        state.cash = +(state.cash + cardDon).toFixed(1);
        state.zooshans.personalCardCollectedBYN += cardDon;
      }
    }
  }

  let pendingFinAudit = false;
  if (state.zooshans.cardFundraiserActive && state.zooshans.daysSinceLastFinReport === 7) {
    pendingFinAudit = true;
  }

  // 16. Таймер талона «Зоошанса» (30 дней, лимит 1000 BYN)
  let pendingVoucherWarn = false;
  if (state.zooshans.voucherDebt > 0) {
    state.zooshans.voucherDaysLeft -= 1;
    if (state.zooshans.voucherDaysLeft === 3 && !state.triggeredEvents.voucherWarn) {
      state.triggeredEvents.voucherWarn = true;
      pendingVoucherWarn = true;
    }
    if (state.zooshans.voucherDaysLeft <= 0 && !state.zooshans.voucherBlocked) {
      state.zooshans.voucherBlocked = true;
      state.mental -= 25;
      addLog(`День ${state.day}: ⛔ Просрочен 30-дневный долг по талону «Зоошанса» (${state.zooshans.voucherDebt} BYN)! Выдача новых талонов заблокирована.`, 'danger');
    }
  }

  // 17. Проверка медицинских и бытовых кризисов
  if (checkMedicalAndCrisisTriggers()) {
    renderAll();
    return;
  }

  // 18. Продвижение 7-дневного испытательного срока и отложенный удар красных флагов (GDD 8.4, 8.5)
  if (state.trialAnimals && state.trialAnimals.length > 0) {
    for (let i = state.trialAnimals.length - 1; i >= 0; i--) {
      const item = state.trialAnimals[i];
      item.daysPassed += 1;

      // Красные флаги: отложенный удар на 4-й день (или при звонке куратора)
      if (item.isRedFlag) {
        if (item.daysPassed >= 4) {
          state.trialAnimals.splice(i, 1);
          state.fatalMistakeReason = item.callData.id;
          triggerRedFlagDelayedStrikeModal(item);
          renderAll();
          return;
        }
      } else {
        // Обычные ручки: развязка на 14-й день (или trialDaysTotal)
        const totalTrialDays = item.trialDaysTotal || 14;
        if (item.daysPassed >= totalTrialDays) {
          state.trialAnimals.splice(i, 1);

          // Проверка астмы / аллергии (8% у идеальных)
          if (item.isAsthmaReturn) {
            triggerTrialAsthmaReturnModal(item);
            renderAll();
            return;
          }

          // Проверка успеха по шансу
          const roll = Math.random();
          if (roll < item.successChance) {
            // УСПЕШНОЕ ПРИСТРОЙСТВО!
            state.animal.trialCount = Math.max(0, state.animal.trialCount - item.count);
            state.animal.savedCount += item.count;
            state.mental = Math.min(100, state.mental + 15);

            const names = (item.petNames && item.petNames.length > 0)
              ? item.petNames
              : (item.count > 1 && item.petName.includes(' и ')
                  ? item.petName.split(' и ')
                  : [item.petName]);

            names.forEach((petName, idx) => {
              const tailRecord = {
                id: Date.now() + Math.floor(Math.random() * 10000) + idx,
                petName: petName.trim(),
                species: a.species,
                archetypeId: a.id,
                archetypeTitle: a.title,
                coatName: a.coatName,
                coatTier: a.coatTier,
                daysSpent: state.day,
                seasonsPassed: [...state.seasonsPassed],
                adopterSummary: item.adopterSummary || 'Любящая семья',
                dateSaved: formatCalendarDate(state.calendarDate),
                personalSpent: state.personalMoneySpent || 0,
                prChannel: item?.prChannel || (state.zooshans.hasProPhotos ? 'Профи-пиар Зоошанса' : 'Куфар / Соцсети')
              };
              state.savedTails.push(tailRecord);
              savePetToAlbum(tailRecord);
            });

            triggerTrialSuccessModal(item);
            renderAll();
            return;
          } else {
            // Бытовой возврат
            state.animal.trialCount = Math.max(0, state.animal.trialCount - item.count);
            state.animal.activeCount += item.count;
            triggerTrialReturnModal(item);
            renderAll();
            return;
          }
        }
      }
    }
  }

  // 18б. Продвижение 3 дней для маневра при возврате
  if (state.maneuver && state.maneuver.active) {
    state.maneuver.daysRemaining -= 1;
    if (state.maneuver.daysRemaining <= 0) {
      state.maneuver.active = false;
      if (state.zooshans.locationStatus === 'maneuver_adopters') {
        state.zooshans.locationStatus = state.zooshans.hasCage ? 'home_cage' : 'home_floor';
        addLog(`День ${state.day}: ⏳ 3 дня маневра истекли! Подопечный возвращен к вам в квартиру.`, 'warn');
      }
    }
  }

  // 18в. Проверка финальной победы (все подопечные благополучно дома!)
  if (a.savedCount >= (a.totalCount || a.count || 1)) {
    if (a.hasMotherCat && !a.motherSterilized) {
      // ждем стерилизации мамы
    } else {
      triggerEndGame(
        true,
        'ПОБЕДА: Все подопечные обрели любящий дом!',
        `Поздравляем! Все ваши подопечные (${a.savedCount} хвостиков) благополучно прошли испытательный срок и официально занесены в ваш «Альбом спасенных хвостиков»!\n\nВы проявили стойкость, терпение и ответственность настоящего волонтера МБООПЖ «Зоошанс»!`
      );
      return;
    }
  }

  // 19. 10-дневный карантин поиска старых хозяев (породистые / колор-пойнты, GDD 4.1)
  if (state.pr.lostSearchActive && state.pr.lostSearchDaysDone < 10) {
    state.pr.lostSearchDaysDone += 1;
    if ((state.pr.lostSearchDaysDone === 3 || state.pr.lostSearchDaysDone === 6) && !state.triggeredEvents['scam_' + state.pr.lostSearchDaysDone]) {
      state.triggeredEvents['scam_' + state.pr.lostSearchDaysDone] = true;
      const scams = getDynamicScammerCalls(a);
      triggerIncomingCallModal(state.pr.lostSearchDaysDone === 3 ? scams[0] : scams[1], true);
      renderAll();
      return;
    }
    if (state.pr.lostSearchDaysDone === 10) {
      state.pr.lostSearchActive = false;
      if (Math.random() < 0.30) {
        const tailRecord = {
          id: Date.now() + Math.random(),
          petName: a.petName,
          species: a.species,
          archetypeId: a.id,
          archetypeTitle: a.title,
          coatName: a.coatName,
          coatTier: a.coatTier,
          daysSpent: state.day,
          seasonsPassed: [...state.seasonsPassed],
          adopterSummary: 'Вернулся к прежним хозяевам (старый ветпаспорт)',
          dateSaved: formatCalendarDate(state.calendarDate),
          personalSpent: state.personalMoneySpent || 0,
          prChannel: 'Поиск потеряшек'
        };
        state.savedTails.push(tailRecord);
        savePetToAlbum(tailRecord);
        triggerEndGame(
          true,
          'ЧУДО ПОИСКА: Настоящие хозяева нашлись!',
          `Ваши объявления в группах потеряшек сработали! На 10-й день приехала настоящая хозяйка со старым ветпаспортом и фото ${g.gen}. Семья возместила ваши расходы и сделала пожертвование в «Зоошанс»!`
        );
        return;
      } else {
        addLog(`День ${state.day}: 10 дней поиска старых хозяев позади. Прежние владельцы не нашлись — теперь открыта стерилизация и поиск новой семьи!`, 'info');
      }
    }
  }

  // 20. Полное финкураторство у волонтера (GDD 7.2)
  if (state.zooshans.locationStatus === 'full_volunteer_fincuration' && state.day >= 22 && state.supplies.daysLeft > 0) {
    if (Math.random() < 0.10) {
      const tailRecord = {
        id: Date.now() + Math.random(),
        petName: a.petName,
        species: a.species,
        archetypeId: a.id,
        archetypeTitle: a.title,
        coatName: a.coatName,
        coatTier: a.coatTier,
        daysSpent: state.day,
        seasonsPassed: [...state.seasonsPassed],
        adopterSummary: 'Пристроен опытной передержкой по договору',
        dateSaved: formatCalendarDate(state.calendarDate),
        personalSpent: state.personalMoneySpent || 0,
        prChannel: 'Волонтерская сеть Зоошанса'
      };
      state.savedTails.push(tailRecord);
      savePetToAlbum(tailRecord);
      triggerEndGame(
        true,
        'ПОБЕДА ФИНКУРАТОРА: Подопечный обрел дом!',
        `Опытная передержка «Зоошанса», приютившая ${g.acc} под ваше полное финансовое обеспечение, провела собеседования и нашла замечательную семью по договору!`
      );
      return;
    }
  }

  // 21. Выставки-пристройства «Зоошанса» (5 раз в год — каждые 72 дня: Дни 25, 97, 169..., GDD 8.2)
  if ((state.day === 25 || (state.day > 25 && (state.day - 25) % 72 === 0)) && !state.triggeredEvents['fest_' + state.day]) {
    state.triggeredEvents['fest_' + state.day] = true;
    if (nActive > 0) {
      if (a.parasitesAndVaccinated && (a.ageCategory !== 'adult' || a.isSterilized) && a.knownRingworm !== true) {
        triggerFestivalModal();
        renderAll();
        return;
      } else {
        addLog(`День ${state.day}: 🎪 Сегодня в Минске проходит выставка «Зоошанса» (бывает 5 раз в год), но ${g.nom} еще не готов(ы) по прививкам/стерилизации. Основа — системный пиар по сайтам!`, 'info');
      }
    }
  }

  // 22. Системный ПИАР по сайтам (требует поднятия каждые 6 дней! GDD 8.2)
  const isMedicallyRestricted = (a.inStationaryDaysLeft && a.inStationaryDaysLeft > 0) ||
                               (a.virusRecoveryDaysLeft && a.virusRecoveryDaysLeft > 0) ||
                               (a.traumaRehabDaysLeft && a.traumaRehabDaysLeft > 0);
  if (state.pr.prActive && nActive > 0 && !isMedicallyRestricted) {
    state.pr.daysInPr += 1;
    state.pr.daysSinceAdRefresh += 1;

    if (state.pr.daysSinceAdRefresh === 6) {
      addLog(`День ${state.day}: 📉 Объявления на сайтах опустились вниз ленты! Поднимите объявления во вкладке 3 (-10⚡), иначе звонков почти не будет.`, 'warn');
    }

    let callChance = 0.24 * (a.coatPopularity + (state.pr.storytellingBoost || 0));
    let photoMult = 1.0;
    if (state.zooshans.hasProPhotos) photoMult = 2.6;
    else if (state.photos && state.photos.hasFriendsPhotos) photoMult = 1.5;
    else if (state.photos && state.photos.hasSelfPhotos) photoMult = 1.2;
    callChance *= photoMult;
    callChance += ((state.pr.storytellingCallBonus || 0) * 0.01);

    // Сезонные модификаторы звонков (GDD 2.2)
    if (state.currentSeason === 'summer' && a.species === 'cat' && a.ageCategory === 'adult' && !state.zooshans.hasProPhotos) {
      callChance *= 0.25; // Летом -75% к звонкам на взрослых кошек
    }
    if (state.currentSeason === 'autumn') {
      callChance *= 1.25; // Осенью +25% к звонкам после дач
    }
    if (state.pr.daysSinceAdRefresh >= 6) {
      callChance *= 0.20; // Без обновления звонки падают на 80%
    }

    // Снижение спроса на кошек с вирусным лейкозом (FeLV+)
    if (a.knownCarrier === 'FeLV') {
      callChance *= 0.40; // Лейкоз: пристройство строго единственной кошкой в дом (-60% звонков)
    }

    if (Math.random() < callChance) {
      triggerRandomAdopterCall();
      renderAll();
      return;
    }
  }

  // Запрос на обеспечение таблетками от передержки, если еще не начата дегельминтизация
  const isWithExpVolunteer = state.zooshans && (
    state.zooshans.locationStatus === 'temp_volunteer_14d' ||
    state.zooshans.locationStatus === 'full_volunteer_fincuration' ||
    state.zooshans.locationStatus === 'social_foster_volunteer'
  );
  if (isWithExpVolunteer && a.dewormStage === 0 && !a.volunteerHandlesDeworming && state.day >= 2 && (state.day % 3 === 0)) {
    const vName = state.zooshans.locationStatus === 'social_foster_volunteer' ? 'Катя' : 'Таня';
    if (typeof promptVolunteerDewormingRequest === 'function') {
      promptVolunteerDewormingRequest(vName);
      renderAll();
      return;
    }
  }

  if (a.health <= 0) {
    triggerEndGame(false, 'ПОРАЖЕНИЕ: Спасти жизнь не удалось', 'Без своевременного лечения и ухода организм животного не справился.');
    return;
  }

  // Ментальное выгорание и механика «Второго дыхания» в @zooshans_chat (GDD 2.3)
  if (state.mental <= 0) {
    if (!state.secondWindUsed) {
      triggerSecondWindModal();
      renderAll();
      return;
    } else {
      state.fatalMistakeReason = 'burnout';
      triggerBurnoutModal();
      renderAll();
      return;
    }
  }

  // Информационные напоминания в конце дня (чтобы не сбивать ежедневные счетчики)
  if (pendingFinAudit) {
    triggerFinReportAuditModal();
    renderAll();
    return;
  }

  if (pendingVoucherWarn) {
    triggerVoucherDeadlineModal();
    renderAll();
    return;
  }

  if (typeof checkMentorTriggers === 'function') {
    checkMentorTriggers();
  }

  renderAll();
}
