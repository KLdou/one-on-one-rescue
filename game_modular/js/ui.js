// ui.js - Отрисовка интерфейса, карточек, табов, логов, модалок, альбома и карточки 9:16 (v2.2)

let activeTab = 'vet';

function switchTab(tabName) {
  // Если «туман войны» еще не развеян гуглением, блокируем переход во 2 и 3 табы
  if (!state.onboarding.googleDone && (tabName === 'zooshans' || tabName === 'care')) {
    addLog(`День ${state.day}: 🔒 Вкладка скрыта туманом войны! Сначала погуглите, что делать обычному человеку при находке животного.`, 'warn');
    return;
  }

  activeTab = tabName;
  ['vet', 'zooshans', 'care'].forEach(t => {
    const content = document.getElementById('tabContent_' + t);
    const btn = document.getElementById('tabBtn_' + t);
    if (!content || !btn) return;
    if (t === tabName) {
      content.classList.remove('hidden');
      btn.className = 'px-3 py-1.5 rounded-lg text-xs font-mono font-bold bg-emerald-500 text-slate-950 transition';
    } else {
      content.classList.add('hidden');
      btn.className = 'px-3 py-1.5 rounded-lg text-xs font-mono font-semibold bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-700 transition';
    }
  });
}

function renderAll() {
  renderTopBar();
  renderPlayerAndAnimalCards();
  renderActionTabs();
  renderLog();
}

function renderTopBar() {
  const a = state.animal;
  const isAcute = state.onboarding && state.onboarding.acutePhase;

  // Счетчик игрового дня
  document.getElementById('dayCounter').textContent = state.day;

  // Календарная дата (GDD 2.2)
  const calBadge = document.getElementById('calendarDateBadge');
  if (calBadge && state.calendarDate) {
    calBadge.textContent = `📅 ${formatCalendarDate(state.calendarDate)}`;
  }

  // Бейдж острой фазы (Дни 1-3)
  const acuteBadge = document.getElementById('acutePhaseBadge');
  if (acuteBadge) {
    if (isAcute) {
      acuteBadge.classList.remove('hidden');
      acuteBadge.textContent = `🌙 Острая фаза (День ${state.day}/3)`;
    } else {
      acuteBadge.classList.add('hidden');
    }
  }

  // Обновление кнопок скорости
  updateSpeedButtonsUI();

  // Возраст питомца
  document.getElementById('animalAgeBadge').textContent = `Возраст: ${formatAgeText(a.ageDays)}`;

  // Сезонный бейдж (GDD 2.2)
  const seasonBadge = document.getElementById('seasonBadge');
  if (seasonBadge && state.currentSeason) {
    const seasonInfoMap = {
      summer: { label: '☀️ Лето: Сезон котят (-75% звонков)', class: 'bg-amber-500/20 text-amber-300 border-amber-500/40' },
      autumn: { label: '🍂 Осень: +25% звонков / Хэллоуин', class: 'bg-orange-500/20 text-orange-300 border-orange-500/40' },
      winter: { label: '❄️ Зима: Импульсный спрос к НГ / Мороз', class: 'bg-sky-500/20 text-sky-300 border-sky-500/40' },
      spring: { label: '🌱 Весна: Сезон клещей и беременных кошек', class: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40' }
    };
    const sInfo = seasonInfoMap[state.currentSeason] || { label: getSeasonLabelRu(state.currentSeason), class: 'bg-slate-800 text-slate-300 border-slate-700' };
    seasonBadge.textContent = sInfo.label;
    seasonBadge.className = `font-mono text-[11px] px-2 py-0.5 rounded border ${sInfo.class}`;
    seasonBadge.classList.remove('hidden');
  }

  // Счетчик сохраненных хвостов в хедере
  const headerAlbumEl = document.getElementById('headerAlbumCount');
  if (headerAlbumEl) {
    headerAlbumEl.textContent = getSavedAlbum().length;
  }

  // Бюджет в BYN
  const cashEl = document.getElementById('cashValue');
  cashEl.textContent = `${state.cash} BYN`;
  cashEl.className = state.cash < 60
    ? 'font-mono font-bold text-sm sm:text-base text-rose-400'
    : 'font-mono font-bold text-sm sm:text-base text-emerald-400';

  // Запас расходников
  const totalSup = state.supplies.daysLeft + state.zooshans.giftedFoodDaysLeft;
  const supEl = document.getElementById('supplyDaysBadge');
  supEl.textContent = `Корм: ${totalSup} дн.`;
  supEl.className = totalSup <= 2
    ? 'font-mono text-[11px] px-1.5 py-0.5 rounded bg-rose-950 text-rose-300 border border-rose-500 animate-pulse'
    : 'font-mono text-[11px] px-1.5 py-0.5 rounded bg-slate-800 text-emerald-300 border border-slate-700';

  // Долг по талону (лимит 1000 BYN)
  const vDebtEl = document.getElementById('voucherDebtText');
  const vTimerEl = document.getElementById('voucherTimerText');
  vDebtEl.textContent = `Долг: ${state.zooshans.voucherDebt} / 1000 BYN`;
  vDebtEl.className = state.zooshans.voucherDebt >= 800 ? 'text-rose-400 font-bold' : (state.zooshans.voucherDebt > 0 ? 'text-amber-300 font-semibold' : 'text-slate-400');
  vTimerEl.textContent = state.zooshans.voucherDebt > 0
    ? (state.zooshans.voucherBlocked ? 'ТАЛОНЫ ЗАБЛОКИРОВАНЫ' : `Срок талона: ${state.zooshans.voucherDaysLeft} дн.`)
    : 'Лимит: 1000 BYN';

  // Менталка
  document.getElementById('mentalValue').textContent = `${state.mental}%`;
  document.getElementById('mentalBar').style.width = `${state.mental}%`;

  // Двухсегментная шкала Энергии (доступно + резерв быта дома)
  const drain = calculateDailyHouseholdEnergyDrain();
  const resLabel = document.getElementById('energyReserveLabel');
  if (resLabel) {
    resLabel.textContent = isAnimalAtPlayerHome()
      ? `⚡ Энергия (Быт дома: -${drain}⚡/д)`
      : '⚡ Энергия (Быт на передержке: 0⚡)';
  }
  document.getElementById('energyValue').textContent = `${state.energy}⚡`;

  const barAvail = document.getElementById('energyBarAvailable');
  const barRes = document.getElementById('energyBarReserved');
  if (barAvail && barRes) {
    const energyPct = Math.min(100, Math.max(0, state.energy));
    const reservedPct = isAnimalAtPlayerHome() ? Math.min(45, drain) : 0;
    const availPct = Math.max(0, energyPct - reservedPct);
    barAvail.style.width = `${availPct}%`;
    barRes.style.width = `${reservedPct}%`;
  }

  // Жизнь питомца и счетчик хвостов (GDD 7.1, 8.4)
  const countHeader = document.getElementById('animalCountHeader');
  const act = a.activeCount !== undefined ? a.activeCount : (a.count || 1);
  const tri = (state.trialAnimals || []).reduce((sum, item) => sum + (item.count || 1), 0);
  const sav = state.savedTails ? state.savedTails.length : 0;
  const tot = a.totalCount || a.initialCount || 1;

  if (tot > 1) {
    countHeader.textContent = `🐾 На руках: ${act} | Испытание: ${tri} | Дома: ${sav}/${tot}`;
  } else if (tri > 0) {
    countHeader.textContent = `🐾 На испытательном сроке (7 дн.)`;
  } else {
    countHeader.textContent = '❤️ Жизнь питомца';
  }

  document.getElementById('animalHealthValue').textContent = `${a.health}%`;
  document.getElementById('healthBar').style.width = `${a.health}%`;

  // Баннер беглеца
  const escBanner = document.getElementById('escapeUrgentBanner');
  if (escBanner) {
    if (state.escapeQuest && state.escapeQuest.active) {
      escBanner.classList.remove('hidden');
      document.getElementById('escapeDaysLeftTag').textContent = `Осталось ${state.escapeQuest.daysRemaining} дн.`;
      document.getElementById('escapeProgressTag').textContent = `Шкала поиска: ${state.escapeQuest.searchProgress}% / 100% (${state.escapeQuest.reason})`;
    } else {
      escBanner.classList.add('hidden');
    }
  }

  // Баннер выкорма слепышей
  const nbBanner = document.getElementById('newbornUrgentBanner');
  if (state.newborn.active && isAnimalAtPlayerHome()) {
    nbBanner.classList.remove('hidden');
    const btnCow = document.getElementById('btnCowMilkTrap');
    const btnBuy = document.getElementById('btnBuyFormula');

    if (!state.newborn.knowsAboutFormula) {
      document.getElementById('milkSupplyTag').textContent = 'Чем кормить: Неизвестно (Позвоните в Колл-центр «Зоошанса»!)';
      btnCow.classList.remove('hidden');
      btnBuy.classList.add('hidden');
    } else {
      document.getElementById('milkSupplyTag').textContent = `Запас смеси: ${state.newborn.milkDaysLeft} дн. (Паштет Babycat с 21 дн., сейчас ${a.ageDays} дн.)`;
      btnCow.classList.add('hidden');
      btnBuy.classList.remove('hidden');
    }

    const btnFeed = document.getElementById('btnFeedNewborns');
    if (state.newborn.fedToday) {
      btnFeed.disabled = true;
      btnFeed.className = 'flex-1 sm:flex-initial px-3 py-1.5 rounded-lg bg-slate-800 text-slate-400 font-bold text-xs cursor-not-allowed';
      btnFeed.textContent = '✓ Покормлен(ы) сегодня';
    } else {
      btnFeed.disabled = false;
      btnFeed.className = 'urgent-btn flex-1 sm:flex-initial px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs transition';
      btnFeed.textContent = '🍼 Покормить из соски (-15⚡)';
    }
  } else if (nbBanner) {
    nbBanner.classList.add('hidden');
  }
}

function renderPlayerAndAnimalCards() {
  const p = state.player;
  const a = state.animal;

  // Лимит сбора на карту (6500 BYN)
  document.getElementById('cardLimitBadge').textContent = `Сбор на карту: ${state.zooshans.personalCardCollectedBYN} / 6500 BYN`;

  const salaryDays = 30 - (state.day % 30);
  document.getElementById('salaryCountdown').textContent = salaryDays === 30 ? 'ЗП сегодня!' : `ЗП через ${salaryDays} дн.`;

  const drain = calculateDailyHouseholdEnergyDrain();
  document.getElementById('dailyExpenseLabel').textContent = isAnimalAtPlayerHome() ? `Быт дома: -${drain}⚡/д` : 'Быт: 0⚡/д (на передержке)';

  // Статус заявления в Зоошанс
  const appBadge = document.getElementById('applicationStatusBadge');
  if (state.zooshans.applicationSubmitted) {
    appBadge.textContent = 'Заявление принято ✓ (-20%)';
    appBadge.className = 'text-[10px] font-mono px-1.5 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-500/40';
  } else {
    appBadge.textContent = 'Заявление не подано (0% скидки)';
    appBadge.className = 'text-[10px] font-mono px-1.5 py-0.5 rounded bg-rose-950 text-rose-300 border border-rose-500/40';
  }

  // Кнопки выбора клиники
  const btnClinicPartner = document.getElementById('btnClinicPartner');
  const btnClinicMajor = document.getElementById('btnClinicMajor');
  if (state.zooshans.clinicMode === 'partner_cash') {
    btnClinicPartner.className = 'p-1.5 rounded border border-emerald-400 bg-emerald-950/80 text-left font-mono text-[10px] text-emerald-200 transition';
    btnClinicMajor.className = 'p-1.5 rounded border border-slate-700 bg-slate-900/60 text-left font-mono text-[10px] text-slate-400 transition hover:bg-slate-800';
  } else {
    btnClinicPartner.className = 'p-1.5 rounded border border-slate-700 bg-slate-900/60 text-left font-mono text-[10px] text-slate-400 transition hover:bg-slate-800';
    btnClinicMajor.className = 'p-1.5 rounded border border-sky-400 bg-sky-950/80 text-left font-mono text-[10px] text-sky-200 transition';
  }

  const giftFoodEl = document.getElementById('giftedFoodBadge');
  if (state.zooshans.giftedFoodDaysLeft > 0) {
    giftFoodEl.classList.remove('hidden');
    giftFoodEl.textContent = `🎁 Подаренный корм: ${state.zooshans.giftedFoodDaysLeft} дн.`;
  } else {
    giftFoodEl.classList.add('hidden');
  }

  const giftBanner = document.getElementById('giftThankYouBanner');
  if (state.zooshans.pendingGiftThankYou) giftBanner.classList.remove('hidden');
  else giftBanner.classList.add('hidden');

  const locMap = {
    'home_floor': '⚠️ Живет у вас дома на полу (без клетки)',
    'home_cage': '🛡️ У вас дома в клетке «Зоошанса»',
    'paid_foster': '🏡 На коммерческой передержке (быт снят)',
    'temp_volunteer_10d': `⏳ У волонтера на стабилизации (${state.zooshans.tempVolunteerDaysLeft} дн., быт снят)`,
    'full_volunteer_fincuration': '🤝 У волонтера (Вы — финкуратор и снабженец)',
    'social_foster_volunteer': '🤝 На передержке у опытного волонтера (быт снят)',
    'social_foster_novice': `🏠 Бесплатно у человека из соцсетей (${state.zooshans.socialFosterDaysElapsed} дн.)`,
    'maneuver_adopters': '⏳ Временно у несостоявшихся ручек (маневр 3 дня)'
  };
  document.getElementById('fosterStatusBadge').textContent = locMap[state.zooshans.locationStatus] || 'Дома';

  // Теги профиля игрока (включая 6-ю ось Социального капитала, GDD 3.0)
  const playerTags = [
    p.income.label, p.housing.label, p.family.label, p.ownPets.label, p.mobility.label
  ];
  if (p.socialCapital) playerTags.push(p.socialCapital.label);
  document.getElementById('playerTagsContainer').innerHTML = playerTags
    .map(t => `<span class="px-2 py-0.5 rounded bg-slate-950 border border-slate-700 text-slate-200">${t}</span>`).join('');

  // Карточка животного: кличка по канону Зоошанса + архетип (GDD 4.1)
  const actCount = a.activeCount !== undefined ? a.activeCount : (a.count || 1);
  document.getElementById('animalSpeciesBadge').textContent = actCount > 1 ? `${a.speciesLabel} [Осталось: ${actCount}]` : a.speciesLabel;
  document.getElementById('animalTitle').innerHTML = `«${a.petName || 'Найденыш'}» <button onclick="actionRollRandomPetName()" title="Сгенерировать другую кличку из картотеки Зоошанса" class="ml-1 text-xs hover:scale-125 transition">🎲</button> <button onclick="triggerPetNamingModal()" title="Уникальная кличка по правилам Зоошанса" class="text-xs hover:scale-125 transition">✏️</button> — ${a.title}`;
  document.getElementById('coatPopularityBadge').textContent = `Окрас: ${a.coatLabel}`;
  document.getElementById('animalDescription').textContent = a.visualDescription;
  document.getElementById('visibleStateText').textContent = `Статус: ${a.visibleState}`;

  // Живой чек-лист подготовки
  const qDone = a.quarantineDaysDone >= 14;
  const qTag = {
    t: qDone ? '✓ Карантин: 14/14 дн.' : `⏳ Карантин: ${a.quarantineDaysDone}/14 дн.`,
    c: qDone ? 'bg-emerald-950/70 text-emerald-300 border-emerald-500/50' : 'bg-slate-800 text-amber-300 border-amber-500/40'
  };

  let dwTag = { t: '💊 Глистогонка: 0/2', c: 'bg-rose-950/60 text-rose-300 border-rose-500/40' };
  if (a.dewormStage === 1) {
    const waitLeft = Math.max(0, 10 - a.daysSinceDeworm1);
    dwTag = waitLeft > 0
      ? { t: `⏳ Глистогонка: 1/2 (2-я через ${waitLeft} дн.)`, c: 'bg-amber-950/70 text-amber-300 border-amber-500/50' }
      : { t: '🔔 Глистогонка: 1/2 (ДАЙТЕ 2-Ю ТАБЛЕТКУ!)', c: 'bg-amber-500 text-slate-950 font-bold border-amber-300 animate-pulse' };
  } else if (a.dewormStage === 2) {
    const validLeft = Math.max(0, 180 - a.daysSinceDeworm2);
    dwTag = { t: `✓ Глистогонка: 2/2 (еще ${validLeft}/180 дн.)`, c: 'bg-emerald-950/70 text-emerald-300 border-emerald-500/50' };
  }

  const ageWait = Math.max(0, 60 - a.ageDays);
  const vacTag = {
    t: a.parasitesAndVaccinated
      ? '✓ Вакцинация: Да'
      : (ageWait > 0 ? `💉 Вакцинация с 60 дн. (ждем ${ageWait} дн.)` : '💉 Вакцинация: Ждет 2/2 глистогонки'),
    c: a.parasitesAndVaccinated ? 'bg-emerald-950/70 text-emerald-300 border-emerald-500/50' : 'bg-slate-800 text-slate-400 border-slate-700'
  };

  const litterTag = {
    t: a.litterTrained ? (a.species === 'dog' ? '✓ Выгул: Приучен' : '✓ Лоток: 5+') : `🚽 Приучение: ${a.litterTrainDaysDone}/8 дн.`,
    c: a.litterTrained ? 'bg-emerald-950/70 text-emerald-300 border-emerald-500/50' : 'bg-amber-950/70 text-amber-300 border-amber-500/50'
  };

  const checklistArr = [qTag, dwTag, vacTag, litterTag];
  if (a.knownRingworm === true) {
    checklistArr.push({
      t: `🍄 Лечение лишая в клетке: ${a.ringwormDaysDone}/35 дн.`,
      c: 'bg-rose-950 text-rose-200 border-rose-500 font-bold'
    });
  }
  if (a.hiddenState.needsSocialization) {
    checklistArr.push({
      t: `💛 Социализация: ${a.hiddenState.socializationDaysDone}/14 дн.`,
      c: 'bg-amber-950 text-amber-200 border-amber-500'
    });
  }
  if (a.hiddenState.isJawFracture && a.hiddenState.syringeDaysLeft > 0) {
    checklistArr.push({
      t: `🥣 Кормление через шприц/стому: ${a.hiddenState.syringeDaysLeft} дн.`,
      c: 'bg-sky-950 text-sky-200 border-sky-500'
    });
  }

  // Защита собаки от иксодовых клещей (GDD 6.3)
  if (a.species === 'dog') {
    if (a.tickProtectionDaysLeft > 0) {
      checklistArr.push({
        t: `🛡️ Защита от клещей: ${a.tickProtectionDaysLeft}/30 дн.`,
        c: 'bg-emerald-950/70 text-emerald-300 border-emerald-500/50'
      });
    } else {
      checklistArr.push({
        t: `⚠️ Без защиты от клещей (капли 35 BYN)`,
        c: 'bg-rose-950 text-rose-300 border-rose-500 font-bold animate-pulse'
      });
    }
  }

  document.getElementById('animalChecklistTags').innerHTML = checklistArr
    .map(item => `<span class="text-[11px] font-mono px-2 py-0.5 rounded border ${item.c}">${item.t}</span>`).join('');

  // Подсказка следующего шага
  let nextHint = 'Готов к пиару на сайтах!';
  if (!state.onboarding.googleDone) nextHint = 'Погуглите «Нашел животное в Минске», чтобы развеять туман войны';
  else if (!state.zooshans.applicationSubmitted) nextHint = 'Подайте заявление в Колл-центр «Зоошанса» (вкладка 2) для клетки и скидки 20%';
  else if (!a.examinedWood) nextHint = 'Сделайте первичный осмотр и просвет лампой Вуда (вкладка 1)';
  else if (a.dewormStage === 0) nextHint = 'Дайте 1-ю таблетку от глистов (26 BYN)';
  else if (a.dewormStage === 1 && a.daysSinceDeworm1 < 10) nextHint = `Подождите ${10 - a.daysSinceDeworm1} дн. до 2-й глистогонки`;
  else if (a.dewormStage === 1 && a.daysSinceDeworm1 >= 10) nextHint = 'Пора дать 2-ю таблетку от глистов (20 BYN)!';
  else if (a.species === 'dog' && (!a.tickProtectionDaysLeft || a.tickProtectionDaysLeft <= 0)) nextHint = 'Обработайте собаку каплями от клещей (35 BYN, вкладка 1), чтобы избежать пироплазмоза!';
  else if (a.ageDays < 60 && a.ageDays >= 45 && !state.pr.prActive) nextHint = 'С 45 дней можно открыть ПИАР на раннее бронирование (вкладка 3)!';
  else if (a.ageDays >= 60 && !a.parasitesAndVaccinated) nextHint = 'Сделайте комплексную вакцинацию (60 BYN)';
  else if (a.ageCategory === 'adult' && !a.isSterilized) nextHint = 'Проведите обязательную стерилизацию/кастрацию';
  document.getElementById('checklistHintText').textContent = nextHint;

  // Диагностические теги
  const woodText = !a.examinedWood
    ? 'Просвет Вуда: ???'
    : (a.knownRingworm === true ? `Лишай: день ${a.ringwormDaysDone}/35` : 'Просвет Вуда: Чисто ✓');
  const woodClass = !a.examinedWood
    ? 'bg-slate-800 text-slate-400 border-slate-700'
    : (a.knownRingworm === true ? 'bg-rose-950 text-rose-300 border-rose-500' : 'bg-emerald-950/60 text-emerald-300 border-emerald-500/40');

  let pcrText = 'ПЦР ВИК/ВЛК: ???';
  let pcrClass = 'bg-slate-800 text-slate-400 border-slate-700';
  if (a.pcrTested || a.knownCarrier || a.knownVirus) {
    const parts = [];
    if (a.knownCarrier) parts.push(`${a.knownCarrier}+`);
    if (a.knownVirus) parts.push(`${a.knownVirus}`);
    pcrText = parts.length === 0 ? 'ПЦР: Чисто ✓' : `ПЦР: ${parts.join(', ')}`;
    pcrClass = parts.length === 0 ? 'bg-emerald-950/60 text-emerald-300 border-emerald-500/40' : 'bg-amber-950/80 text-amber-300 border-amber-500/60';
  }

  const cageText = !state.zooshans.hasCage
    ? 'Клетка: Нет'
    : (state.zooshans.cageReturnedClean ? 'Клетка: Продезинфицирована и сдана ✓' : 'Клетка «Зоошанса»: На руках (вернуть чистой!)');
  const cageClass = state.zooshans.cageReturnedClean ? 'bg-emerald-950/60 text-emerald-300 border-emerald-500/40' : 'bg-slate-800 text-slate-300 border-slate-700';

  let photoText = 'Фото: Нет фото';
  let photoClass = 'bg-slate-800 text-slate-500 border-slate-700';
  if (state.zooshans.hasProPhotos) {
    photoText = 'Фото: ПРОФИ «Зоошанс» (x2.6)';
    photoClass = 'bg-sky-950 text-sky-300 border-sky-500/50';
  } else if (state.photos && state.photos.hasFriendsPhotos) {
    photoText = 'Фото: От друзей (x1.5)';
    photoClass = 'bg-indigo-950 text-indigo-300 border-indigo-500/50';
  } else if (state.photos && state.photos.hasSelfPhotos) {
    photoText = 'Фото: С телефона (x1.2)';
    photoClass = 'bg-slate-800 text-slate-200 border-slate-600';
  }

  if (a.pcrPending) {
    pcrText = `ПЦР: В лаборатории (${a.pcrDaysRemaining} дн.)`;
    pcrClass = 'bg-amber-950 text-amber-300 border-amber-500 animate-pulse';
  } else if (a.pcrResultDoubtful) {
    pcrText = 'ПЦР: Сомнительный титр ⚠️';
    pcrClass = 'bg-amber-950 text-amber-200 border-amber-500';
  }

  const allStatusTags = [
    { t: woodText, c: woodClass },
    { t: pcrText, c: pcrClass },
    { t: cageText, c: cageClass },
    { t: photoText, c: photoClass }
  ];

  if (a.species === 'dog' && a.hasAntiEscapeHarness) {
    allStatusTags.push({ t: 'Шлейка-антипобег ✓', c: 'bg-emerald-950/60 text-emerald-300 border-emerald-500/40' });
  }
  if (a.fipTreatment) {
    allStatusTags.push({ t: `Терапия ФИП: ${a.fipDaysLeft} дн. (GS-441524)`, c: 'bg-rose-950 text-rose-300 border-rose-500 animate-pulse' });
  }
  if (a.teethCrisis && !a.teethOperated) {
    allStatusTags.push({ t: 'Зубной камень / Санация', c: 'bg-rose-950 text-rose-300 border-rose-500' });
  }
  if (a.hasMotherCat && a.motherLactating) {
    allStatusTags.push({ t: `Кормящая мама (${Math.max(0, 45 - a.ageDays)} дн. лактации)`, c: 'bg-sky-950 text-sky-300 border-sky-500' });
  }

  document.getElementById('animalStatusTags').innerHTML = allStatusTags
    .map(item => `<span class="text-[11px] font-mono px-2 py-0.5 rounded border ${item.c}">${item.t}</span>`).join('');

  let prLabel = 'Пиар на сайтах: Не запущен';
  if (state.pr.lostSearchActive) prLabel = `🔎 Поиск старых хозяев: ${state.pr.lostSearchDaysDone}/10 дн.`;
  else if (state.pr.earlyBookedAdopterWaiting) prLabel = `📝 ЗАБРОНИРОВАН! Ждем 60 дней возраста (сейчас ${a.ageDays} дн.)`;
  else if (state.pr.prActive) prLabel = `📢 Пиар на сайтах (${state.pr.daysInPr} дн., обновление через ${Math.max(0, 6 - state.pr.daysSinceAdRefresh)} дн.)`;
  document.getElementById('prProgressText').textContent = prLabel;
}

function renderActionTabs() {
  const onbBox = document.getElementById('onboardingDashboard');
  const btnTabZoo = document.getElementById('tabBtn_zooshans');
  const btnTabCare = document.getElementById('tabBtn_care');
  const expLabel = document.getElementById('experiencedCuratorLabel');

  // Чекбокс опытного куратора доступен, если в альбоме есть хотя бы 1 спасенный питомец (GDD 9.2)
  if (expLabel) {
    if (getSavedAlbum().length > 0) {
      expLabel.classList.remove('hidden');
    } else {
      expLabel.classList.add('hidden');
    }
  }

  // Онбординг: если игрок еще не погуглил, скрываем вкладки волонтерства
  if (!state.onboarding.googleDone) {
    if (onbBox) onbBox.classList.remove('hidden');
    if (btnTabZoo) {
      btnTabZoo.textContent = '🔒 2. Помощь «Зоошанса» (Закрыто)';
      btnTabZoo.classList.add('opacity-40');
    }
    if (btnTabCare) {
      btnTabCare.textContent = '🔒 3. Передержка и Пиар (Закрыто)';
      btnTabCare.classList.add('opacity-40');
    }
  } else {
    if (onbBox) onbBox.classList.add('hidden');
    if (btnTabZoo) {
      btnTabZoo.textContent = '🤝 2. Помощь «Зоошанса» и Сборы';
      btnTabZoo.classList.remove('opacity-40');
    }
    if (btnTabCare) {
      btnTabCare.textContent = '📸 3. Быт, Передержка и Пиар';
      btnTabCare.classList.remove('opacity-40');
    }
  }

  const a = state.animal;
  const h = a.hiddenState;
  const g = getAnimalGrammar(a);
  const hasDiscount = state.zooshans.applicationSubmitted && (!state.zooshans.voucherBlocked || state.zooshans.clinicMode === 'partner_cash');
  const modeNote = state.zooshans.clinicMode === 'partner_cash' ? 'сразу на кассе' : 'в талон на 30 дн.';
  const priceLabel = (base, eligible) => eligible && hasDiscount ? `${Math.round(base * 0.8)} BYN (${modeNote})` : `${base} BYN`;

  const pillCost1 = state.zooshans.hasGiftedDewormPill ? 0 : 26;
  const pillCost2 = state.zooshans.hasGiftedDewormPill ? 0 : 20;
  let dewormTitle = `1-я обработка от блох и глистов (${pillCost1 === 0 ? '0 BYN дар!' : '26 BYN'})`;
  let dewormSub = 'Этап 1/2: убивает взрослых гельминтов. Повтор строго через 10 дней!';
  let dewormDisabled = false;
  let dewormDoneText = '';

  if (state.newborn.active) {
    dewormDisabled = true;
    dewormDoneText = 'Слепышам до 3 недель глистогонка запрещена';
  } else if (a.dewormStage === 1 && a.daysSinceDeworm1 < 10) {
    dewormDisabled = true;
    dewormDoneText = `⏳ Ждем ${10 - a.daysSinceDeworm1} дн. до 2-й таблетки`;
  } else if (a.dewormStage === 1 && a.daysSinceDeworm1 >= 10) {
    dewormTitle = `🔔 2-я глистогонка через 10 дней (${pillCost2 === 0 ? '0 BYN дар!' : '20 BYN'})`;
    dewormSub = 'Этап 2/2: обязателен перед прививкой! Действует 6 месяцев (180 дней).';
  } else if (a.dewormStage === 2) {
    dewormDisabled = true;
    dewormDoneText = `✓ Двукратно обработан (повтор через ${180 - a.daysSinceDeworm2} дн.)`;
  }

  // Стационар показан ТОЛЬКО в жизнеугрожающих ситуациях (GDD 6.1)
  const isLifeThreatening = (h.hasSevereTrauma && !a.traumaOperated) || h.deadlyVirus === 'panleukopenia' || h.deadlyVirus === 'parvovirus_enteritis' || a.health < 55;

  // 1. Вкладка ВЕТЕРИНАРИЯ
  const vetButtons = [
    {
      title: 'Первичный осмотр + лампа Вуда',
      sub: `${priceLabel(50, true)} | -12⚡ | Доступна в Клинике А и Б`,
      disabled: a.examinedWood,
      doneText: '✓ Осмотр и просвет проведены',
      onClick: () => {
        if (!spendEnergy(12)) return;
        payVetBill(50, true, 'Первичный прием и просвет лампой Вуда', false);
        a.examinedWood = true;
        a.knownRingworm = h.ringworm === true;
        a.knownPregnant = h.isPregnant === true;
        if (a.knownRingworm) {
          a.ringwormDaysDone = 0;
          addLog(`День ${state.day}: 🔦 Лампа Вуда выявила микроспорию (лишай)! Стационаров для лишая нет — лечим 35 дней в клетке до двух чистых просветов.`, 'warn');
        } else if (a.knownPregnant) {
          addLog(`День ${state.day}: 🩺 Кошка глубоко беременна (родит на ${h.daysUntilBirth || 8}-й день)! Выбор: экстренная стерилизация по показаниям или роды.`, 'warn');
        } else {
          addLog(`День ${state.day}: 🔦 Просвет лампой Вуда чистый!`, 'success');
        }
        renderAll();
      }
    },
    {
      title: 'Прием узкого специалиста (Терапевт / Инфекционист / Хирург)',
      sub: `${priceLabel(70, true)} | -10⚡ | Назначается врачом при ухудшении или перед операцией`,
      disabled: false,
      doneText: '',
      onClick: () => {
        if (!spendEnergy(10)) return;
        payVetBill(70, true, 'Консультация узкого специалиста', false);
        if (a.fipTreatment) {
          addLog(`День ${state.day}: 🩺 Инфекционист проверил биохимию крови и скорректировал дозировку GS-441524. Терапия ФИП идет по плану!`, 'success');
        } else if (a.teethCrisis && !a.teethOperated) {
          addLog(`День ${state.day}: 🩺 Хирург-стоматолог подтвердил необходимость санации ротовой полости.`, 'warn');
        } else {
          a.health = Math.min(100, a.health + 8);
          addLog(`День ${state.day}: 🩺 Врач провел углубленный осмотр, скорректировал терапию (+8% здоровья).`, 'success');
        }
        renderAll();
      }
    },
    {
      title: dewormTitle,
      sub: dewormSub,
      disabled: dewormDisabled,
      doneText: dewormDoneText,
      onClick: () => {
        if (!spendEnergy(5)) return;
        const cost = a.dewormStage === 0 ? 26 : 20;
        if (state.zooshans.hasGiftedDewormPill) {
          state.zooshans.hasGiftedDewormPill = false;
          addLog(`День ${state.day}: 💊 Использована подаренная волонтерами таблетка Мильбемакса (0 BYN)!`, 'success');
        } else {
          state.cash = +(state.cash - cost).toFixed(1);
          state.personalMoneySpent = +(state.personalMoneySpent + cost).toFixed(1);
        }
        if (a.dewormStage === 0) {
          a.dewormStage = 1;
          a.daysSinceDeworm1 = 0;
          addLog(`День ${state.day}: 💊 Дана 1-я таблетка от паразитов (-${cost} BYN). Вторая таблетка строго через 10 дней!`, 'info');
        } else {
          a.dewormStage = 2;
          a.daysSinceDeworm2 = 0;
          addLog(`День ${state.day}: ✅ Проведена 2-я глистогонка! Обработка действует 6 месяцев (180 дней).`, 'success');
        }
        renderAll();
      }
    },
    {
      title: 'Комплексная вакцинация с ветпаспортом',
      sub: '60 BYN | -10⚡ | Строго с 2 месяцев (60 дней) и после 2/2 глистогонки!',
      disabled: a.parasitesAndVaccinated || a.dewormStage < 2 || a.ageDays < 60,
      doneText: a.parasitesAndVaccinated
        ? '✓ Привит с ветпаспортом'
        : (a.ageDays < 60 ? `🔒 Заблокировано по возрасту: ждем 60 дней (сейчас ${a.ageDays} дн.)` : 'Сначала сделайте 2/2 глистогонку!'),
      onClick: () => {
        if (!spendEnergy(10)) return;
        payVetBill(60, false, 'Комплексная вакцинация с ветпаспортом', false);
        a.parasitesAndVaccinated = true;
        a.health = Math.min(100, a.health + 10);
        addLog(`День ${state.day}: 💉 Проведена вакцинация по возрасту, оформлен официальный ветпаспорт!`, 'success');
        if (state.pr.earlyBookedAdopterWaiting) {
          triggerEarlyBookedTransferModal();
        }
        renderAll();
      }
    },
    {
      title: a.pcrPending
        ? `⏳ ПЦР в лаборатории (осталось ${a.pcrDaysRemaining} дн.)`
        : (a.pcrTested ? (a.pcrResultDoubtful ? 'Повторный ПЦР-профиль' : 'ПЦР-профиль сдан') : 'ПЦР-профиль (ВИК, ВЛК, Инфекции)'),
      sub: a.pcrPending
        ? 'Биоматериал исследуется в лаборатории. Результат через 7 дней.'
        : (a.pcrTested
            ? (a.pcrResultDoubtful ? 'Пограничный результат — показана пересдача через 14 дней' : '✓ Результаты занесены в карточку')
            : `${priceLabel(105, true)} | -10⚡ | Взрослым сразу, малышам — только при симптомах!`),
      disabled: a.pcrPending || (a.pcrTested && !a.pcrResultDoubtful) || (!a.pcrTested && (a.ageCategory === 'kitten' || a.ageCategory === 'puppy') && !a.knownVirus && !h.deadlyVirus && !h.hasChronicGI && a.health >= 80),
      doneText: a.pcrPending
        ? `⏳ ПЦР в лаборатории (${a.pcrDaysRemaining} дн.)`
        : (a.pcrTested
            ? (a.pcrResultDoubtful ? '⚠️ Сомнительный титр (нужен повтор)' : '✓ ПЦР-профиль исследован')
            : '🔒 Котятам/щенкам без клинических симптомов дорогой ПЦР не назначают'),
      onClick: () => {
        if (!spendEnergy(10)) return;
        payVetBill(105, true, 'ПЦР-профиль инфекций', false);
        a.pcrPending = true;
        a.pcrDaysRemaining = 7;
        a.pcrResultDoubtful = false;
        addLog(`День ${state.day}: 🧬 Биоматериал отправлен в лабораторию на ПЦР-диагностику. Результат будет готов через 7 дней.`, 'info');
        renderAll();
      }
    },
    {
      title: h.isPregnant ? 'Экстренная стерилизация беременной' : `Стерилизация / Кастрация (${g.shortNom})`,
      sub: `${priceLabel(g.isDog ? 300 : (h.isPregnant ? 225 : 160), true)} | -20⚡ | Оплачивает куратор или сбор на карту`,
      disabled: a.isSterilized || (!a.hasMotherCat && a.ageCategory !== 'adult') || (h.isLostOrPurebred && state.pr.lostSearchDaysDone < 10) || (a.hasMotherCat && a.motherLactating) || (!h.isPregnant && a.quarantineDaysDone < 14),
      doneText: a.isSterilized
        ? '✓ Стерилизован(а)'
        : (a.hasMotherCat && a.motherLactating
            ? `🔒 Кормящую маму нельзя стерилизовать до 45 дней котят (${a.ageDays}/45 дн.)`
            : (!h.isPregnant && a.quarantineDaysDone < 14
                ? `🔒 Стерилизация проводится после 14 дней карантина (${a.quarantineDaysDone}/14 дн.)`
                : (!a.hasMotherCat && a.ageCategory !== 'adult' ? 'Котята/щенки отдаются под договор стерилизации по возрасту' : 'Сначала 10 дней поиска старых хозяев!'))),
      onClick: () => {
        if (!spendEnergy(20)) return;
        const cost = g.isDog ? 300 : (h.isPregnant ? 225 : 160);
        payVetBill(cost, true, `Хирургическая стерилизация (${g.shortNom})`, false);
        a.isSterilized = true;
        a.motherSterilized = true;
        h.isPregnant = false;
        addLog(`День ${state.day}: ✂️ Стерилизация проведена успешно! (На плановую стерилизацию р/с «Зоошанса» не открывается — гасим своими средствами или сбором на карту).`, 'success');
        renderAll();
      }
    },
    {
      title: !state.zooshans.expensiveApproved && isLifeThreatening
        ? '☎️ Согласовать дорогую операцию/стационар с Колл-центром (-10⚡)'
        : 'Остеосинтез / Реанимационный стационар (Только угроза жизни!)',
      sub: !state.zooshans.expensiveApproved && isLifeThreatening
        ? 'Обязательное предварительное согласование перед тяжелой хирургией'
        : `${hasDiscount ? '360 BYN по талону Ветцентра' : '450 BYN'} | Лишай в стационар НЕ берут!`,
      disabled: !isLifeThreatening,
      doneText: a.knownRingworm === true
        ? '🚫 Стационаров для лишая нет! Лечите 35 дн. в клетке'
        : '✓ Жизнеугрожающих состояний нет (стационар не показан)',
      onClick: () => {
        if (!state.zooshans.expensiveApproved) {
          if (!spendEnergy(10)) return;
          state.zooshans.applicationSubmitted = true;
          state.zooshans.expensiveApproved = true;
          state.zooshans.clinicMode = 'major_voucher';
          addLog(`День ${state.day}: ☎️ Координатор Колл-центра согласовал проведение дорогостоящей операции и стационара по гарантийному талону!`, 'success');
          renderAll();
          return;
        }
        if (!spendEnergy(25)) return;
        payVetBill(450, true, 'Экстренная хирургия (остеосинтез/челюсть) и реанимационный стационар', true);
        a.traumaOperated = true;
        h.hasSevereTrauma = false;
        h.deadlyVirus = null;
        a.health = 92;
        a.visibleState = h.isJawFracture
          ? 'Челюсть зашинирована! Осталось 18 дней кормления паштетами через шприц/стому.'
          : 'Жизнь спасена в реанимации!';
        addLog(`День ${state.day}: 🏥 Проведена тяжелая операция и реанимация! Теперь вы имеете право открыть официальный сбор на р/с «Зоошанса» (вкладка 2).`, 'success');
        renderAll();
      }
    }
  ];

  // Кнопка обработки от клещей для собак (GDD 6.3)
  if (a.species === 'dog') {
    vetButtons.push({
      title: '🐕 Обработка от иксодовых клещей (капли 35 BYN)',
      sub: '35 BYN | -5⚡ | Защита от смертельного пироплазмоза на 30 дней в парках Минска',
      disabled: a.tickProtectionDaysLeft > 5,
      doneText: `✓ Защищен от клещей (еще ${a.tickProtectionDaysLeft} дн.)`,
      onClick: actionBuyTickProtection
    });
  }

  // 2. Вкладка КОЛЛ-ЦЕНТР «ЗООШАНСА», СБОРЫ И СОЦСЕТИ
  // Сбор на р/с «Зоошанса» открывается ТОЛЬКО при долге от 330 BYN+ или согласованной тяжелой хирургии (GDD 5.2)
  const canOpenOfficialRsFundraiser = state.zooshans.voucherDebt >= 330 || state.zooshans.expensiveApproved;

  const zooButtons = [
    {
      title: 'Подать заявление в Колл-центр «Зоошанса» и попросить поддержки',
      sub: '-10⚡ | Регистрирует животное, дает клетку со склада и открывает скидку 20%',
      disabled: state.zooshans.applicationSubmitted,
      doneText: '✓ Заявление подано, Колл-центр на связи',
      onClick: actionAskZooshansTakeover
    },
    {
      title: 'Опубликовать SOS-пост: искать бесплатную передержку в соцсетях',
      sub: '-15⚡ | Шанс отклика ~30% за публикацию — если не нашли, публикуйте повторно!',
      disabled: !isAnimalAtPlayerHome(),
      doneText: '✓ Подопечный уже передан на передержку (быт снят с вас)',
      onClick: actionSearchSocialFosterPost
    },
    {
      title: '💬 Барахолка лекарств и амуниции в волонтерском чате @zooshans_chat',
      sub: '-10⚡ | Шанс 60%: другие кураторы бесплатно поделятся таблетками или шлейкой-антипобег!',
      disabled: false,
      doneText: '',
      onClick: actionBarakholkaVolunteerChat
    },
    {
      title: 'Запустить сбор на р/с «Зоошанса» (ТОЛЬКО тяжелые операции/травмы!)',
      sub: 'Требуется согласованная операция/стационар или долг по талону от 330 BYN+',
      disabled: state.zooshans.officialFundraiserActive || !canOpenOfficialRsFundraiser,
      doneText: state.zooshans.officialFundraiserActive
        ? '✓ Официальный сбор на р/с Зоошанса открыт'
        : 'Доступно только при тяжелых операциях/травмах (обычные приемы и стерилизация — сами или на карту)',
      onClick: () => {
        if (!spendEnergy(15)) return;
        state.zooshans.officialFundraiserActive = true;
        addLog(`День ${state.day}: 🏦 Колл-центр открыл официальный сбор на р/с «Зоошанса» для погашения долга за операцию/стационар!`, 'success');
        renderAll();
      }
    },
    {
      title: 'Открыть сбор на личную банковскую карту (Лимит до 6500 BYN в год)',
      sub: `На корм, смесь, лекарства и обычные талоны (-15⚡) | Собрано: ${state.zooshans.personalCardCollectedBYN}/6500 BYN`,
      disabled: state.zooshans.personalFundraiserActive || state.zooshans.personalDonationsBanned || state.zooshans.personalCardCollectedBYN >= 6500,
      doneText: state.zooshans.personalDonationsBanned ? '🚫 Заблокировано модераторами за отсутствие отчетов' : '✓ Сбор на личную карту активен (отчет каждые 7 дн.)',
      onClick: () => {
        if (!spendEnergy(15)) return;
        state.zooshans.personalFundraiserActive = true;
        addLog(`День ${state.day}: 💳 Открыт сбор на личную карту (в пределах лимита 6500 BYN/год). Обязательно выкладывайте чеки каждые 7 дней!`, 'success');
        renderAll();
      }
    },
    {
      title: 'Написать живой мимими-пост со сторителлингом (-10⚡)',
      sub: 'Гарантирует +0.06x к пиару и +5% к звонкам | Шанс подарков и брони от подписчиков!',
      disabled: false,
      doneText: '',
      onClick: actionWriteStorytellingPost
    },
    {
      title: 'Свести чеки: Опубликовать 7-дневный финотчет по сбору на карту',
      sub: 'Выложить фото чеков и скриншоты трат (-20⚡, защищает сбор от блокировки)',
      disabled: !state.zooshans.personalFundraiserActive,
      doneText: 'Нет активного сбора на личную карту',
      onClick: () => {
        if (!spendEnergy(20)) return;
        state.zooshans.daysSinceLastFinReport = 0;
        state.mental = Math.min(100, state.mental + 5);
        addLog(`День ${state.day}: 📊 Опубликован честный финотчет с чеками во всех группах (+5% Менталки)! Сбор в безопасности.`, 'success');
        renderAll();
      }
    },
    {
      title: '💰 Погасить долг по талону своими деньгами (без сборов и отчетов)',
      sub: state.zooshans.voucherDebt > 0 ? `Погасить ${state.zooshans.voucherDebt} BYN своими деньгами и сэкономить силы на отчетах` : 'Долга по талонам «Зоошанса» нет (0 BYN)',
      disabled: state.zooshans.voucherDebt <= 0,
      doneText: '✓ Долгов по талонам нет',
      onClick: payVoucherDebtWithOwnMoney
    }
  ];

  // 3. Вкладка БЫТ, ЗАКУПКА РАСХОДНИКОВ, ВОЗВРАТ КЛЕТКИ, САЙТЫ И ЕВРОПА
  const supplyPackCost = (g.isDog || a.count > 1) ? 120 : 65; // GDD 7.1
  const supplyItemName = g.isDog
    ? (a.ageCategory === 'puppy' ? 'корм и пеленки' : 'корм, пеленки и пакеты для выгула')
    : 'корм и древесный/комкующийся наполнитель';
  const canReturnCage = state.zooshans.hasCage && !state.zooshans.cageReturnedClean && (a.quarantineDaysDone >= 14 && a.knownRingworm !== true);

  // Допуск к пиару (раннее бронирование котят/щенков с 45 дней, GDD 6.3)
  const isKittenEarlyBookEligible = (a.ageCategory === 'kitten' || a.ageCategory === 'puppy') && a.ageDays >= 45 && a.dewormStage === 2;
  const isAdultReadyForPr = a.parasitesAndVaccinated && (a.ageCategory !== 'adult' || a.isSterilized);
  const canStartPr = a.examinedWood && a.knownRingworm !== true && !state.newborn.active && a.traumaOperated && !h.needsSocialization && (!h.isLostOrPurebred || state.pr.lostSearchDaysDone >= 10) && (isAdultReadyForPr || isKittenEarlyBookEligible);

  let abroadBtnTitle = '🌍 Шаг 1 в ЕС: Чипирование + Вакцина от бешенства (80 BYN)';
  let abroadBtnSub = 'С 60 дней возраста! Запускает 30-дневный отсчет выработки иммунитета';
  let abroadDisabled = false;
  let abroadDoneText = '';

  if (a.ageDays < 60 || a.dewormStage < 2) {
    abroadDisabled = true;
    abroadDoneText = 'Требуется возраст 60+ дней и 2/2 глистогонка';
  } else if (!state.abroad.rabiesVaccineAndChipDone) {
    abroadDisabled = false;
  } else if (state.abroad.daysSinceRabiesVaccine < 30) {
    abroadDisabled = true;
    abroadDoneText = `⏳ Ждем 30 дн. после прививки: ${state.abroad.daysSinceRabiesVaccine}/30 дн.`;
  } else if (!state.abroad.titerBloodTaken) {
    abroadBtnTitle = '🌍 Шаг 2 в ЕС: Сдать титры на бешенство (630 BYN за счет куратора)';
    abroadBtnSub = 'Затем 90 дней карантина ЕС (трансфер 430 BYN оплатит хозяин из Европы)';
    abroadDisabled = false;
  } else {
    abroadDisabled = true;
    abroadDoneText = `🌍 Карантин ЕС: ${state.abroad.daysInEuQuarantine}/90 дн.`;
  }

  const careButtons = [];

  // Кнопка проверки подопечного на испытательном сроке (GDD 8.4)
  if (state.trialAnimals && state.trialAnimals.length > 0) {
    const activeTrial = state.trialAnimals[0];
    careButtons.push({
      title: `📱 Написать хозяевам «${activeTrial.petName}» (испытательный срок: ${activeTrial.daysPassed}/7 дн.)`,
      sub: '-5⚡ | Запросить фото-привет и узнать, как дела (+5% Менталки)',
      disabled: false,
      doneText: '',
      onClick: actionCheckTrialPetStatus
    });
  }

  // Закупка расходников на 14 дней
  careButtons.push({
    title: `🛒 Закупить в зоомагазине ${supplyItemName} на 14 дней (-${supplyPackCost} BYN)`,
    sub: `-10⚡ | Куратор обязан обеспечивать расходники и дома, и на передержке!`,
    disabled: false,
    doneText: '',
    onClick: () => {
      if (state.cash < supplyPackCost) {
        addLog(`День ${state.day}: Не хватает денег на пакет расходников (${supplyPackCost} BYN)!`, 'danger');
        return;
      }
      if (!spendEnergy(10)) return;
      state.cash = +(state.cash - supplyPackCost).toFixed(1);
      state.personalMoneySpent = +(state.personalMoneySpent + supplyPackCost).toFixed(1);
      state.supplies.daysLeft += 14;
      addLog(`День ${state.day}: 🛒 Вы закупили в зоомагазине ${supplyItemName} на 14 дней (-${supplyPackCost} BYN).`, 'success');
      renderAll();
    }
  });

  // Выручка кормом от своего домашнего кота в безденежье (GDD 3.0, 7.1)
  const hasOwnCat = state.player.ownPets && (state.player.ownPets.id === 'vaccinated_cat' || state.player.ownPets.id === 'unvaccinated_cat');
  if (hasOwnCat) {
    const daysSinceShare = state.day - (state.lastOwnPetFoodShareDay || -999);
    const canShare = (state.supplies.daysLeft <= 2 || state.cash < 65) && (daysSinceShare >= 14);
    careButtons.push({
      title: '🥣 Взять 4 дня корма у своего домашнего кота (0 BYN)',
      sub: '-2% Менталки | Спасение в безденежье раз в 14 дней (домашний кот будет недоволен!)',
      disabled: !canShare,
      doneText: daysSinceShare < 14
        ? `⏳ Кот еще не простил (ждем ${14 - daysSinceShare} дн.)`
        : 'Активируется при корме <= 2 дн. или нехватке денег',
      onClick: actionShareFoodWithOwnCat
    });
  }

  // Фотосессии
  careButtons.push(
    {
      title: '📸 Сфотографировать самому на телефон при хорошем свете',
      sub: '-5⚡ | Базовые фото для первого пиара (увеличивает звонки в 1.2 раза)',
      disabled: state.photos.hasSelfPhotos || state.photos.hasFriendsPhotos || state.zooshans.hasProPhotos,
      doneText: '✓ Фото с телефона сделаны',
      onClick: actionTakeSelfPhotos
    },
    {
      title: '📸 Попросить друзей помочь с домашней фотосессией',
      sub: '-8⚡ | Друзья снимут на портретный объектив (увеличивает звонки в 1.5 раза)',
      disabled: state.photos.hasFriendsPhotos || state.zooshans.hasProPhotos,
      doneText: '✓ Фото от друзей готовы',
      onClick: actionAskFriendsPhotos
    },
    {
      title: '🌟 Профессиональная фотосессия от фотографа «Зоошанса» (0 BYN)',
      sub: '0 BYN | -15⚡ | Доступна ПОСЛЕ 14 дней карантина (увеличивает звонки в 2.6 раза!)',
      disabled: state.zooshans.hasProPhotos || a.quarantineDaysDone < 14 || a.health < 70 || h.needsSocialization || a.knownRingworm === true,
      doneText: state.zooshans.hasProPhotos
        ? '✓ Профи-фото «Зоошанса» готовы (x2.6)'
        : (a.quarantineDaysDone < 14 ? `🔒 Доступно после 14 дней карантина (${a.quarantineDaysDone}/14 дн.)` : 'Сначала долечите лишай и социализируйте'),
      onClick: () => {
        if (!spendEnergy(15)) return;
        state.zooshans.hasProPhotos = true;
        addLog(`День ${state.day}: 📸 Волонтер-фотограф «Зоошанса» провела потрясающую съемку! Отклик на сайтах вырастет в 2.6 раза!`, 'success');
        renderAll();
      }
    },
    {
      title: !a.litterTrained
        ? `🚽 Ускорить приучение к ${g.isDog ? 'выгулу' : 'лотку'} (-15⚡, -26 BYN)`
        : '🧼 Продезинфицировать Вирконом и вернуть клетку на склад «Зоошанса» (-15⚡, -16 BYN)',
      sub: !a.litterTrained
        ? 'Снимает промахи мимо лотка и снижает ежедневную трату сил дома'
        : 'Клетку обязательно возвращают чистой и обработанной дезсредством!',
      disabled: a.litterTrained && !canReturnCage,
      doneText: state.zooshans.cageReturnedClean ? '✓ Лоток 5+, обработанная клетка сдана на склад Зоошанса' : '✓ К лотку приучен (возврат клетки после карантина/лишая)',
      onClick: () => {
        if (!a.litterTrained) {
          if (!spendEnergy(15)) return;
          state.cash = +(state.cash - 26).toFixed(1);
          state.personalMoneySpent = +(state.personalMoneySpent + 26).toFixed(1);
          a.litterTrained = true;
          addLog(`День ${state.day}: 🚽 Вы подобрали правильный наполнитель и энзимный спрей — ${g.nom} теперь ходит в туалет без промахов!`, 'success');
        } else {
          if (!spendEnergy(15)) return;
          state.cash = +(state.cash - 16).toFixed(1);
          state.personalMoneySpent = +(state.personalMoneySpent + 16).toFixed(1);
          state.zooshans.cageReturnedClean = true;
          state.mental = Math.min(100, state.mental + 8);
          addLog(`День ${state.day}: 🧼 Вы купили дезсредство Виркон (-16 BYN), тщательно отмыли и вернули клетку на склад «Зоошанса»! (+8% Менталки).`, 'success');
        }
        renderAll();
      }
    },
    {
      title: '❤️ Оставить себе, родителям или близким друзьям!',
      sub: 'Честные условия: макс. 1 раз, после всех процедур и стерилизации, менталка >= 50%',
      disabled: state.keptForSelfUsed || !canStartPr,
      doneText: state.keptForSelfUsed ? '✓ Использовано в этой партии' : 'Выполните первичный чек-лист подготовки',
      onClick: actionKeepPetForSelf
    },
    {
      title: !state.pr.prActive
        ? (a.ageDays < 60 ? '🚀 Запустить ПИАР на сайтах (Раннее бронирование с 45 дн.)' : '🚀 Запустить системный ПИАР по сайтам (Куфар, zooshans.by)')
        : `🔄 Поднять и обновить объявления на сайтах (прошло ${state.pr.daysSinceAdRefresh}/6 дн.)`,
      sub: !state.pr.prActive
        ? (h.isLostOrPurebred && state.pr.lostSearchDaysDone < 10 ? 'Сначала 10 дней поиска старых хозяев!' : (canStartPr ? '-12⚡ | Куфар, каталог zooshans.by и соцсети' : 'Сначала выполните первичный чек-лист подготовки'))
        : '-10⚡ | Каждые 6 дней объявления падают в поиске — системное поднятие обязательно!',
      disabled: (!state.pr.prActive && !canStartPr && (!h.isLostOrPurebred || state.pr.lostSearchDaysDone >= 10)) || (state.pr.prActive && state.pr.daysSinceAdRefresh < 6),
      doneText: h.isLostOrPurebred && state.pr.lostSearchDaysDone < 10
        ? `🔎 Идет поиск старых хозяев (${state.pr.lostSearchDaysDone}/10 дн.)`
        : (state.pr.prActive && state.pr.daysSinceAdRefresh < 6 ? `✓ Объявления в топе (поднятие через ${6 - state.pr.daysSinceAdRefresh} дн.)` : 'Выполните чек-лист (просвет, 2/2 глистогонка, с 45 дн. бронь / с 60 дн. прививка)'),
      onClick: () => {
        if (h.isLostOrPurebred && state.pr.lostSearchDaysDone < 10 && !state.pr.lostSearchActive) {
          if (!spendEnergy(10)) return;
          state.pr.lostSearchActive = true;
          addLog(`День ${state.day}: 🔎 Запущен 10-дневный поиск старых хозяев по группам потеряшек.`, 'info');
          renderAll();
          return;
        }
        if (!state.pr.prActive) {
          if (!spendEnergy(12)) return;
          state.pr.prActive = true;
          state.pr.daysSinceAdRefresh = 0;
          addLog(`День ${state.day}: 🚀 Объявления опубликованы на Куфаре, zooshans.by и в соцсетях! Не забывайте поднимать их каждые 6 дней.`, 'success');
        } else {
          if (!spendEnergy(10)) return;
          state.pr.daysSinceAdRefresh = 0;
          addLog(`День ${state.day}: 🔄 Вы обновили и подняли объявления на всех сайтах! Поток звонков восстановлен.`, 'success');
        }
        renderAll();
      }
    },
    {
      title: abroadBtnTitle,
      sub: abroadBtnSub,
      disabled: abroadDisabled,
      doneText: abroadDoneText,
      onClick: () => {
        if (!state.abroad.rabiesVaccineAndChipDone) {
          if (!spendEnergy(12)) return;
          payVetBill(80, false, 'Чипирование + вакцина от бешенства для ЕС', false);
          state.abroad.rabiesVaccineAndChipDone = true;
          state.abroad.daysSinceRabiesVaccine = 0;
          a.parasitesAndVaccinated = true;
          addLog(`День ${state.day}: 🌍 Поставлен микрочип и вакцина от бешенства (-80 BYN)! Ждем 30 дней выработки антител.`, 'success');
        } else {
          if (state.cash < 630) {
            addLog(`День ${state.day}: На титры антител нужно 630 BYN (оплачивает куратор). Откройте целевой сбор соседней кнопкой!`, 'warn');
            return;
          }
          if (!spendEnergy(15)) return;
          state.cash = +(state.cash - 630).toFixed(1);
          state.personalMoneySpent = +(state.personalMoneySpent + 630).toFixed(1);
          state.abroad.titerBloodTaken = true;
          state.abroad.daysInEuQuarantine = 0;
          addLog(`День ${state.day}: 🧪 Оплачены лабораторные титры антител к бешенству (-630 BYN)! Начался честный 90-дневный карантин ЕС.`, 'success');
        }
        renderAll();
      }
    },
    {
      title: `Перевезти на коммерческую передержку (${g.isDog ? 33 : 16} BYN/сутки + ваш корм)`,
      sub: 'Полностью снимает домашний быт, но корм и оплата за ваш счет!',
      disabled: state.zooshans.locationStatus === 'paid_foster',
      doneText: '✓ Уже на платной передержке',
      onClick: () => {
        if (!a.examinedWood || a.dewormStage < 1) {
          addLog(`День ${state.day}: ⚠️ На платную передержку не берут с улицы вслепую! Сначала сделайте первичный осмотр Вуда и 1-ю обработку от паразитов.`, 'warn');
          return;
        }
        state.zooshans.locationStatus = 'paid_foster';
        if (state.maneuver) state.maneuver.active = false;
        addLog(`День ${state.day}: Подопечный переехал на платную передержку (${g.isDog ? 33 : 16} BYN/сут). Домашний быт снят, но следите за запасом корма!`, 'info');
        renderAll();
      }
    }
  );

  if (state.abroad.rabiesVaccineAndChipDone && !state.abroad.titerBloodTaken) {
    careButtons.push({
      title: 'Целевой сбор на оплату титров ЕС (630 BYN)',
      sub: '-15⚡ | Помогает собрать 630 BYN на лабораторию',
      disabled: state.abroad.titerFundraiserActive,
      doneText: '✓ Сбор на титры ЕС открыт',
      onClick: () => {
        if (!spendEnergy(15)) return;
        state.abroad.titerFundraiserActive = true;
        addLog(`День ${state.day}: 🌍 Открыт целевой сбор на титры бешенства (630 BYN)!`, 'info');
        renderAll();
      }
    });
  }

  renderButtonGrid('tabContent_vet', vetButtons);
  renderButtonGrid('tabContent_zooshans', zooButtons);
  renderButtonGrid('tabContent_care', careButtons);
}

function renderButtonGrid(containerId, buttons) {
  const container = document.getElementById(containerId);
  if (!container) return;
  container.innerHTML = '';
  buttons.forEach(b => {
    const btn = document.createElement('button');
    if (b.disabled) {
      btn.className = 'p-3 rounded-xl bg-slate-900/60 border border-slate-800 text-left flex flex-col justify-between opacity-60 cursor-not-allowed';
      btn.innerHTML = `
        <div class="text-xs font-bold text-slate-400">${b.title}</div>
        <div class="text-[11px] font-mono text-emerald-400/90 mt-1.5">${b.doneText}</div>
      `;
    } else {
      btn.className = 'p-3 rounded-xl bg-slate-900 hover:bg-slate-800/90 border border-slate-700 hover:border-emerald-500/60 text-left flex flex-col justify-between transition group shadow-sm';
      btn.innerHTML = `
        <div class="text-xs sm:text-sm font-bold text-white group-hover:text-emerald-400 transition">${b.title}</div>
        <div class="text-[11px] font-mono text-slate-400 mt-1.5">${b.sub}</div>
      `;
      btn.onclick = b.onClick;
    }
    container.appendChild(btn);
  });
}

function renderLog() {
  const box = document.getElementById('chronicleLog');
  if (!box) return;
  document.getElementById('logCountInfo').textContent = `Записей: ${state.logs.length}`;
  const colorMap = {
    info: 'text-slate-300 border-l-2 border-sky-500 pl-2',
    success: 'text-emerald-300 border-l-2 border-emerald-500 pl-2',
    warn: 'text-amber-300 border-l-2 border-amber-500 pl-2',
    danger: 'text-rose-300 border-l-2 border-rose-500 pl-2 font-semibold'
  };
  box.innerHTML = state.logs.map(item =>
    `<div class="py-1 ${colorMap[item.type] || colorMap.info}">${item.text}</div>`
  ).join('');
}

function showEventModal(title, bodyText, choices) {
  stopTimer();
  const overlay = document.getElementById('eventOverlayBox');
  const dash = document.getElementById('actionsDashboard');
  const extraBox = document.getElementById('extraQuestionBox');

  overlay.classList.remove('hidden');
  overlay.classList.add('flex');
  dash.classList.add('hidden');
  extraBox.classList.add('hidden');

  document.getElementById('eventBadge').textContent = '⚡ СОБЫТИЕ (ИГРА НА ПАУЗЕ)';
  document.getElementById('eventBadge').className = 'text-xs font-mono uppercase px-2 py-0.5 rounded bg-amber-500 text-slate-950 font-bold';
  document.getElementById('eventTitle').textContent = title;
  document.getElementById('eventBody').textContent = bodyText;

  const choicesDiv = document.getElementById('eventChoicesContainer');
  choicesDiv.innerHTML = '';

  choices.forEach(c => {
    const btn = document.createElement('button');
    let styleClass = 'bg-slate-800 hover:bg-slate-700 text-white border border-slate-600';
    if (c.style === 'primary') styleClass = 'bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-extrabold';
    if (c.style === 'info') styleClass = 'bg-sky-600 hover:bg-sky-500 text-white font-bold';
    if (c.style === 'danger') styleClass = 'bg-rose-600 hover:bg-rose-500 text-white font-bold';

    btn.className = `px-3.5 py-2.5 rounded-lg text-xs sm:text-sm transition text-left ${styleClass}`;
    btn.textContent = c.label;
    btn.onclick = c.action;
    choicesDiv.appendChild(btn);
  });
}

function closeEventModal() {
  document.getElementById('eventOverlayBox').classList.add('hidden');
  document.getElementById('eventOverlayBox').classList.remove('flex');
  document.getElementById('actionsDashboard').classList.remove('hidden');
  renderAll();
}

// 4. ФИНАЛЬНЫЙ ЭКРАН, РАЗБОР ОШИБОК, АЛЬБОМ И КАРТОЧКА 9:16 (GDD 9.1, 9.2, 9.3)

function triggerEndGame(isVictory, title, description) {
  stopTimer();
  state.gameOver = true;
  state.victory = isVictory;

  const modal = document.getElementById('endGameModal');
  const badge = document.getElementById('endModalBadge');
  modal.classList.remove('hidden');

  if (isVictory) {
    badge.textContent = '🏆 МИССИЯ ВЫПОЛНЕНА: ЖИЗНЬ СПАСЕНА!';
    badge.className = 'text-xs font-mono uppercase px-2.5 py-1 rounded font-bold bg-emerald-500 text-slate-950';
  } else {
    badge.textContent = '💔 ПАРТИЯ ОКОНЧЕНА: СУРОВАЯ РЕАЛЬНОСТЬ';
    badge.className = 'text-xs font-mono uppercase px-2.5 py-1 rounded font-bold bg-rose-600 text-white';
  }

  document.getElementById('endModalTitle').textContent = title;
  document.getElementById('endModalDescription').textContent = description;

  // Обучающий блок «Работа над ошибками» (GDD 9.1)
  const mistakesBox = document.getElementById('endModalMistakesCard');
  const mistakesText = document.getElementById('endModalMistakesText');
  if (!isVictory && state.fatalMistakeReason) {
    mistakesBox.classList.remove('hidden');
    mistakesText.textContent = getMistakeEducationalText(state.fatalMistakeReason);
  } else {
    mistakesBox.classList.add('hidden');
  }

  // Обновление статистики партии
  document.getElementById('statDays').textContent = state.day;
  document.getElementById('statPersonalSpent').textContent = `${state.personalMoneySpent} BYN`;
  document.getElementById('statVoucherUsed').textContent = `${ +(state.voucherFundsUsed + state.zooshans.voucherDebt).toFixed(1) } BYN`;
  document.getElementById('statFilteredCalls').textContent = state.filteredBadCalls;

  // Заполнение карточки 9:16 для репоста в соцсети (GDD 9.2, 9.3)
  const a = state.animal;
  const isDog = a.species === 'dog';
  const savedAlbumLen = getSavedAlbum().length;
  document.getElementById('storyCardEmoji').textContent = isDog ? '🐕' : '🐈';
  document.getElementById('storyCardTitle').textContent = isVictory
    ? `Я и «${a.petName || a.title}»: ${state.day} дней от улицы до дома`
    : `История «${a.petName || a.title}»: ${state.day} дней борьбы за жизнь`;
  document.getElementById('storyCardSubtitle').textContent = `Окрас: ${a.coatLabel || 'Спасенный'}`;
  document.getElementById('storyCardStatDays').textContent = state.day;
  document.getElementById('storyCardStatPersonal').textContent = `${state.personalMoneySpent} BYN`;
  document.getElementById('storyCardStatVoucher').textContent = `${ +(state.voucherFundsUsed + state.zooshans.voucherDebt).toFixed(1) } BYN`;
  document.getElementById('storyCardStatFiltered').textContent = state.filteredBadCalls;
  const storyAlbumEl = document.getElementById('storyCardStatAlbum');
  if (storyAlbumEl) storyAlbumEl.textContent = savedAlbumLen;
}

function getMistakeEducationalText(reason) {
  const mistakesMap = {
    // 1. Питание слепышей
    'cow_milk_blind_kittens': 'Коровье молоко категорически не подходит для выкорма новорожденных котят из-за высокой концентрации казеина и лактозы. ЖКТ малышей не способен его расщепить, что приводит к острому вздутию (тимпаниту), профузной диарее и быстрой гибели от обезвоживания.\n\nЗапомните: слепышей поят исключительно специализированным заменителем кошачьего молока (Royal Canin Babycat Milk) каждые 2–3 часа, а «Зоошанс» бесплатно выдает первый стартовый пакетик смеси всем обратившимся!',
    'cow_milk_or_starvation': 'Слепые новорожденные котята не имеют запаса гликогена в печени. Без регулярного теплого питания каждые 2–3 часа температура их тела падает, наступает критическая гипогликемия и кома. Куратор должен кормить по будильнику даже ночью или вовремя передать малышей опытному волонтеру на стабилизацию!',

    // 2. Ловушки обывателя
    'gurskogo_trap': 'В Беларуси нет государственных приютов. Предприятие на ул. Гурского, 42 («Фауна города») является коммунальной службой отлова и временного содержания. Из-за колоссальной скученности там бушуют инфекции, а срок нахождения ограничен законом, после чего невостребованных животных усыпляют. Спасти жизнь можно только личным кураторством!',
    'dumped_box_trap': 'Подбросить коробку к клинике или зоомагазину — ловушка малодушия. Ветеринарные клиники — это медицинские учреждения без бюджета и мест для содержания бездомных. Подброшенные животные погибают от инфекций от входящих пациентов либо выставляются персоналом на улицу.',
    'landlord_eviction_no_vet': 'При строгом запрете на животных в съемном жилье куратор обязан с первого дня обследовать подопечного в клинике (просвет лампой Вуда и обработка от паразитов). Без первичных анализов ни одна проверенная передержка не пустит животное на порог из соображений биобезопасности!',

    // 3. Бытовые опасности
    'call_window_fall_fatal': 'Кошки не умеют безопасно приземляться с высоты. Даже со 2–3 этажа падение чревато разрывом внутренних органов, переломом неба и параличом. Обычные москитные сетки легко выдавливаются кошачьим весом, а вертикальное клиновидное проветривание — смертельный капкан, где кошки гибнут от удушья и сдавливания почек. Безопасность гарантируют только сварные сетки «Антикошка» (Pet Screen) и гребенки-ограничители!',
    'call_toddler_toy': 'Маленькие дети (до 4–5 лет) не контролируют силу и могут причинить животному боль (тянуть за уши, сдавливать). В целях самообороны питомец пускает в ход когти, после чего родители в панике выставляют «агрессора» на улицу. Отдавать животных в семьи с малышами можно только при постоянном контроле взрослых!',
    'call_anti_spay_aesthetic': 'Миф о «радости материнства» и «родах для здоровья» ежегодно убивает тысячи животных. Роды изнашивают организм, а некастрированные питомцы страдают от онкологии и пиометры. Раздача котят «по знакомым» — самообман: большинство из них и их потомства окажется на улице. Стерилизация — единственный законный и гуманный способ остановить конвейер смертей!',
    'call_village_mice_outdoor': 'Самовыгул в деревне или частном секторе — это короткая жизнь: коты на улице живут в среднем 2–3 года вместо 15 лет дома (гибнут под колесами, от зубов собак, яда для крыс и капканов). Кошка должна жить в тепле и безопасности внутри дома!',
    'call_dorm_secret': 'В студенческих общежитиях содержание животных строго запрещено уставом. Рано или поздно комендант находит питомца во время проверки, и студент под угрозой выселения выставляет животное на улицу посреди зимы.',
    'call_gift_girlfriend_surprise': 'Животное в подарок-сюрприз без ведома человека — опасный жест. Питомец — это 15 лет ежедневных расходов и ухода. Если человек не готов брать такую ответственность, спасенный хвостик быстро оказывается на улице.',
    'call_bones_and_pork': 'Трубчатые птичьи кости раскалываются на острые осколки, протыкающие желудок и кишечник собаки, вызывая перитонит и мучительную гибель. Жареная свинина гарантирует острый панкреатит. Собаке требуется сбалансированный видовой рацион!',
    'call_dog_chain_village': 'Короткая цепь — пытка для собаки. Без движения деформируются суставы, а без обработки каплями от клещей цепные собаки в Беларуси массово погибают от весеннего пироплазмоза за 48 часов.',
    'call_fiv_felv_ignorer': 'Вирусный лейкоз кошек (FeLV / ВЛК) смертелен и передается через общую слюну, миски и вылизывание. Подселять FeLV-положительную кошку к здоровым непривитым животным недопустимо!',
    'call_fake_breed_colorpoint': '«Черные разведенцы» охотятся за породистыми фенотипами колор-пойнтов для коммерческих вязок без вакцин. Животное запирают в тесной клетке как станок для пложения, а затем выбрасывают. Отдавать животных можно только после стерилизации!',
    'call_halloween_black_cat': 'Перед Хэллоуином (конец октября) волонтеры вводят жесткий мораторий на отдачу черных котов из-за риска садистских ритуалов и жестоких подростковых розыгрышей. Черных кошек отдают только по паспорту и договору!',

    // 4. Мошенники
    'scam_courier_prepay': 'Мошенники мониторят объявления о животных. Ссылка на «страховку доставки курьером» — типичный фишинг для списания денег с карты. Никогда не переходите по сторонним платежным ссылкам!',
    'scam_breeder_metro': 'Коробочницы у метро принимают животных «на пристройство», держат их в тесных грязных коробках до первого вируса, а непроданных к вечеру выбрасывают в мусорные баки или лесополосы.',

    // 5. Болезни и побеги
    'piroplasmosis': 'Пироплазмоз (бабезиоз) собак передается иксодовыми клещами и разрушает эритроциты за считанные дни. Темная моча и отказ от еды — повод немедленно бежать в клинику за уколом антидота! Единственная профилактика — капли на холку каждые 30 дней.',
    'escape_lost_forever': 'Если испуганное животное сорвалось с поводка, счет идет на часы. В первые 4 дня спасает только тотальная расклейка бумажных объявлений и ночные поиски с фонарем в 4–5 утра в подвалах.',
    'fip_no_treatment': 'Инфекционный перитонит кошек (ФИП) сегодня излечим препаратом GS-441524 (84 дня терапии). Усыплять кота с ФИП без попытки терапии — трагическая потеря шанса на спасение!',
    'abandoned_on_foster': 'Человек из соцсетей, взявший подопечного бесплатно — не профессионал. Если бросить его без связи и снабжения кормом, он выставит животное во двор. Куратор обязан контролировать условия и быть на связи!',
    'virus_no_icu': 'Панлейкопения кошек и парвовирусный энтерит щенков требуют интенсивной терапии в круглосуточном стационаре с инфузоматами. Домашними каплями такие вирусы не лечатся!',
    'burnout': 'Эмоциональное выгорание — тяжелейшая проблема в зоозащите. Не оставайтесь со своими переживаниями один на один: волонтерский чат @zooshans_chat создан именно для того, чтобы делиться трудностями и находить поддержку!'
  };

  return mistakesMap[reason] || 'Главное правило спасения: животное не может защитить себя само. Каждый шаг куратора (от карантина и сеток на окнах до договора с паспортными данными) должен исключать любые риски!';
}

function copyStoryCardToClipboard() {
  const a = state.animal;
  const isVic = state.victory;
  const albumCount = getSavedAlbum().length;
  const seasonsStr = (state.seasonsPassed && state.seasonsPassed.length > 0)
    ? state.seasonsPassed.map(s => {
        const seasonLabels = { summer: '☀️ Лето', autumn: '🍂 Осень', winter: '❄️ Зима', spring: '🌱 Весна' };
        return seasonLabels[s] || s;
      }).join(' → ')
    : (state.currentSeason ? getSeasonLabelRu(state.currentSeason) : 'Минск');

  const text = `🐾 ИСТОРИЯ СПАСЕНИЯ: ${isVic ? 'ОТ УЛИЦЫ ДО ДОМА!' : 'БОРЬБА ЗА ЖИЗНЬ'}\n` +
    `Я и подопечный: «${a.petName || a.title}» (${a.speciesLabel}, ${a.coatLabel || 'спасенный'})\n` +
    `⏳ Прожито дней в симуляторе: ${state.day} (${seasonsStr})\n` +
    `💰 Потрачено личных средств: ${state.personalMoneySpent} BYN\n` +
    `🎫 Привлечено по талонам и сборам: ${ +(state.voucherFundsUsed + state.zooshans.voucherDebt).toFixed(1) } BYN\n` +
    `🛡️ Отсеяно опасных «ручек»: ${state.filteredBadCalls}\n` +
    `🏆 В моем личном альбоме спасенных жизней: ${albumCount}\n\n` +
    `В Беларуси нет государственных приютов. Вся реальная помощь держится только на волонтерах МБООПЖ «Зоошанс»:\n` +
    `💳 Помочь «Зоошансу» (Код ЕРИП: 4346991): https://zooshans.by/help-us\n` +
    `💬 Чат волонтеров и проверка ручек: https://t.me/zooshans_chat\n` +
    `🤖 Справочный бот-памятка: https://t.me/zooshans_info_bot\n` +
    `🏷️ Картотека кличек Зоошанса: https://forum.zooshans.by/app.php/petnames`;

  navigator.clipboard.writeText(text).then(() => {
    const btn = document.getElementById('btnCopyStoryCard');
    const oldText = btn.textContent;
    btn.textContent = '✓ Текст скопирован!';
    btn.className = 'px-2.5 py-1 rounded bg-emerald-600 text-slate-950 text-[11px] font-mono font-bold transition';
    setTimeout(() => {
      btn.textContent = oldText;
      btn.className = 'px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-sky-300 border border-slate-600 text-[11px] font-mono font-semibold transition';
    }, 2500);
  }).catch(() => {
    alert('Не удалось скопировать в буфер обмена. Скопируйте текст вручную.');
  });
}

// 5. АЛЬБОМ СПАСЕННЫХ ХВОСТИКОВ И ОПЫТ КУРАТОРА (GDD 9.2)

function showAlbumModal() {
  stopTimer();
  const modal = document.getElementById('savedAlbumModal');
  const list = document.getElementById('savedAlbumList');
  const totalCountEl = document.getElementById('albumTotalCountText');
  const album = getSavedAlbum();

  if (totalCountEl) {
    totalCountEl.textContent = `Всего спасено жизней в альбоме: ${album.length}`;
  }

  if (!album || album.length === 0) {
    list.innerHTML = `
      <div class="p-6 text-center text-slate-400 bg-slate-900/60 border border-slate-800 rounded-xl">
        <div class="text-3xl mb-2">🐾</div>
        <div class="text-sm font-semibold text-slate-300">Пока в альбоме нет спасенных хвостиков</div>
        <p class="text-xs text-slate-500 mt-1">
          Пройдите путь куратора до конца, чтобы успешно пристроить подопечного (или оставить себе) — и его памятная карточка навсегда сохранится здесь!
        </p>
      </div>
    `;
  } else {
    list.innerHTML = album.map(tail => {
      const isDog = tail.species === 'dog';
      const icon = isDog ? '🐕' : '🐈';
      const seasonsStr = (tail.seasonsPassed && tail.seasonsPassed.length > 0)
        ? tail.seasonsPassed.map(s => {
            const seasonLabels = { summer: '☀️ Лето', autumn: '🍂 Осень', winter: '❄️ Зима', spring: '🌱 Весна' };
            return seasonLabels[s] || s;
          }).join(' → ')
        : 'Сезон спасения';

      return `
        <div class="bg-slate-900/80 border border-slate-800 hover:border-amber-500/50 rounded-xl p-3.5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 transition">
          <div class="flex items-center gap-3">
            <span class="text-2xl sm:text-3xl p-2 rounded-xl bg-slate-800/80 border border-slate-700">${icon}</span>
            <div>
              <div class="flex items-center gap-2">
                <h4 class="font-bold text-white text-sm sm:text-base">«${tail.petName || 'Найденыш'}»</h4>
                <span class="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-500/40">
                  ${tail.archetypeTitle || 'Подопечный'}
                </span>
              </div>
              <div class="text-xs text-slate-400 mt-0.5">
                Окрас: <span class="text-amber-300 font-mono">${tail.coatName || 'Уличный'}</span> • 
                Семья: <span class="text-sky-300">${tail.adopterSummary || 'Любящий дом'}</span>
              </div>
              <div class="text-[11px] font-mono text-slate-500 mt-1">
                ⏳ Спасен за ${tail.daysSpent} дн. (${seasonsStr}) • Дата: ${tail.dateSaved || 'Минск'}
              </div>
            </div>
          </div>
          <div class="self-end sm:self-center shrink-0 text-right">
            <span class="text-xs font-mono font-bold text-emerald-400">✓ Дома</span>
          </div>
        </div>
      `;
    }).join('');
  }

  modal.classList.remove('hidden');
}

function closeAlbumModal() {
  const modal = document.getElementById('savedAlbumModal');
  if (modal) modal.classList.add('hidden');
}

function toggleExperiencedCurator(checked) {
  if (checked) {
    state.onboarding.googleDone = true;
    addLog(`День ${state.day}: 🎓 Режим опытного куратора активирован! Туман войны развеян, контакты «Зоошанса» открыты.`, 'success');
  } else {
    state.onboarding.googleDone = false;
    addLog(`День ${state.day}: 🌫️ Режим новичка включен. Сделайте поиск в Google.`, 'info');
  }
  renderAll();
}
