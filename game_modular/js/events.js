// events.js - Медицинские кризисы, триггеры, бытовые ЧП и сюжетные события (v2.0)

function checkMedicalAndCrisisTriggers() {
  const a = state.animal;
  const h = a.hiddenState;
  const g = getAnimalGrammar(a);

  // А) Сбитыш / тяжелая травма таза + поиск донора крови в чате @zooshans_chat (GDD 4.2)
  if (h.hasSevereTrauma && !a.traumaOperated) {
    a.health -= 18;
    addLog(`День ${state.day}: 🚨 ${g.nom} в тяжелом травматическом шоке (-18% жизни)! Согласуйте операцию в Колл-центре и проведите остеосинтез!`, 'danger');
    if (state.day === 2 && h.needsBloodDonor && !state.triggeredEvents.donorAlert) {
      state.triggeredEvents.donorAlert = true;
      triggerBloodDonorModal();
      return true;
    }
  }

  // Б) Язва роговицы у дачных котят (офтальмолог + капли каждые 2 часа, GDD 4.2)
  if (h.deadlyVirus === 'rhinotracheitis_eyes' && state.day >= 3 && !state.triggeredEvents.eyesCrisis) {
    state.triggeredEvents.eyesCrisis = true;
    a.knownVirus = 'Язва роговицы (герпесвирус)';
    showEventModal(
      'УГРОЗА СЛЕПОТЫ: Гнойный ринотрахеит и язва роговицы у котят!',
      'У дачных котят стремительно мутнеет роговица глаз из-за герпесвируса. Обычная заварка чая не поможет — нужен срочный осмотр ветеринарного офтальмолога и схема закапывания трех видов капель каждые 2 часа в течение 10 дней!',
      [
        {
          label: 'Свозить к офтальмологу, купить капли Флоксал/Корнерегель и капать по будильнику (-70 BYN)',
          style: 'primary',
          action: () => {
            payVetBill(70, true, 'Прием офтальмолога и схема спасения зрения', false);
            a.eyeDropsDaysDone = 1;
            addLog(`День ${state.day}: 👁️ Начат 10-дневный интенсивный курс капель по схеме офтальмолога.`, 'success');
            closeEventModal();
          }
        },
        {
          label: 'Не ехать к офтальмологу (котята потеряют зрение, популярность упадет в 3 раза)',
          style: 'danger',
          action: () => {
            a.eyeDropsCompleted = true;
            a.coatPopularity = +(a.coatPopularity * 0.33).toFixed(2);
            state.mental -= 25;
            a.visibleState = 'Котята частично потеряли зрение из-за нелеченой язвы роговицы.';
            addLog(`День ${state.day}: 💔 Без офтальмолога котята ослепли на один глаз. Пристроить особенных малышей будет в 3 раза сложнее.`, 'danger');
            closeEventModal();
          }
        }
      ]
    );
    return true;
  }

  // В) Жизнеугрожающие вирусы: Панлейкопения у котят / Парвовирусный энтерит у щенков (GDD 6.1)
  if ((h.deadlyVirus === 'panleukopenia' || h.deadlyVirus === 'parvovirus_enteritis') && state.day >= (h.virusIncubationDays || 4) && !state.triggeredEvents.virusOutbreak) {
    state.triggeredEvents.virusOutbreak = true;
    a.knownVirus = h.deadlyVirus === 'parvovirus_enteritis' ? 'Парвовирусный энтерит' : 'Панлейкопения';
    a.health -= 32;
    state.mental -= 25;

    const vTitle = h.deadlyVirus === 'parvovirus_enteritis'
      ? 'ЖИЗНЕУГРОЖАЮЩЕЕ СОСТОЯНИЕ: Парвовирусный энтерит у щенков!'
      : 'ЖИЗНЕУГРОЖАЮЩЕЕ СОСТОЯНИЕ: Панлейкопения (чумка котят)!';
    let vDesc = `Инкубационный период закончился! У ${g.gen} неукротимая рвота, отказ от еды и стремительное обезвоживание. Это прямое показание для круглосуточного инфекционного стационара и инфузоматов (140 BYN/сут | 112 BYN по талону)!`;

    // Заражение непривитого домашнего кота при нарушении карантина (GDD 3.4)
    if (!g.isDog && state.player.ownPets.id === 'unvaccinated_cat' && state.zooshans.locationStatus === 'home_floor') {
      state.cash = Math.max(0, +(state.cash - 215).toFixed(1));
      state.personalMoneySpent = +(state.personalMoneySpent + 215).toFixed(1);
      state.mental = Math.max(0, state.mental - 30);
      vDesc += '\n\n💥 КАТАСТРОФА КАРАНТИНА: Поскольку найденыш жил дома на полу без клетки «Зоошанса», заразился ваш собственный непривитый кот (-215 BYN на лечение, -30% Менталки)!';
    }

    showEventModal(vTitle, vDesc, [
      {
        label: 'Согласовать с Колл-центром и поместить в инфекционный стационар на 2 суток (280 BYN / 224 BYN по талону)',
        style: 'primary',
        action: () => {
          state.zooshans.expensiveApproved = true;
          payVetBill(280, true, '2 суток реанимации в инфекционном стационаре', true);
          a.health = Math.min(100, a.health + 45);
          h.deadlyVirus = null;
          a.knownVirus = 'Выжил после стационара';
          closeEventModal();
        }
      },
      {
        label: 'Пытаться отпаивать дома из шприца без стационара (0 BYN — смертельный риск)',
        style: 'danger',
        action: () => {
          a.health -= 50;
          state.fatalMistakeReason = 'virus_no_icu';
          addLog(`День ${state.day}: Отказ от стационара при смертельном вирусе привел к критическому состоянию!`, 'danger');
          closeEventModal();
        }
      }
    ]);
    return true;
  }

  // Г) Микроспория (Лишай) на 4–5 день: СТАЦИОНАРОВ ДЛЯ ЛИШАЯ НЕТ! Нудное лечение 35 дней в клетке! (GDD 6.1)
  if (h.ringworm && state.day >= (h.ringwormIncubationDays || 4) && !a.knownRingworm && !state.triggeredEvents.ringwormExplosion) {
    state.triggeredEvents.ringwormExplosion = true;
    a.knownRingworm = true;
    a.ringwormDaysDone = 0;

    const panicMod = state.player.family.ringwormPanic || 1.0;
    const mentalHit = Math.round(18 * panicMod);
    state.mental = Math.max(0, state.mental - mentalHit);

    let desc = `На шерсти появились залысины с серыми чешуйками. Просвет лампой Вуда дал изумрудное свечение: микроспория (лишай)!\n\nВАЖНЕЙШЕЕ ПРАВИЛО: Ни одна ветклиника не берет лишай в стационар! Лишай лечится нудно 35 дней дома или на передержке СТРОГО В КЛЕТКЕ (Итраконазол + наружные обработки Имаверолом) до получения 2 чистых просветов Вуда (на 25 и 35 день).`;

    if (state.player.family.id === 'small_kids') {
      desc += '\n\n👶 ПАНИКА ДОМА: Домашние в шоке из-за маленького ребенка! Множитель паники 2.5x (-' + mentalHit + '% Менталки). Животное необходимо срочно изолировать в клетку!';
    } else {
      desc += `\n\nСтресс куратора (-${mentalHit}% Менталки). Попросите клетку в «Зоошансе» или остатки Итраконазола в чате волонтеров!`;
    }

    showEventModal('ДИАГНОЗ: Микроспория (Лишай) — 35 дней в клетке!', desc, [
      {
        label: 'Посадить в клетку и начать системное лечение (капсулы + Имаверол)',
        style: 'primary',
        action: () => {
          if (state.zooshans.locationStatus === 'home_floor') {
            state.zooshans.locationStatus = state.zooshans.hasCage ? 'home_cage' : 'home_floor';
          }
          addLog(`День ${state.day}: 🍄 Начат 35-дневный курс лечения микроспории в клетке. Первые контрольные просветы на 25 и 35 день.`, 'warn');
          closeEventModal();
        }
      }
    ]);
    return true;
  }

  // Д) Острая гемолитическая анемия при скрытом ВЛК на 10-й день (healthy_look_felv_cat, GDD 4.2)
  if (h.chronicCarrier === 'FeLV' && state.day >= 10 && !state.triggeredEvents.felvCrisis) {
    state.triggeredEvents.felvCrisis = true;
    if (Math.random() < 0.35) {
      a.health -= 35;
      state.mental -= 20;
      showEventModal(
        'КРИЗИС ВЛК: Острая гемолитическая анемия!',
        `У кошки побелели десны, температура упала, тяжелое дыхание. Вирусная лейкемия (FeLV+) перешла в фазу подавления костного мозга. Требуется срочная реанимация и переливание крови!`,
        [
          {
            label: 'Экстренно везти в круглосуточный ветцентр на переливание (280 BYN / 224 BYN по талону)',
            style: 'primary',
            action: () => {
              state.zooshans.expensiveApproved = true;
              payVetBill(280, true, 'Реанимация и переливание эритроцитарной массы при ВЛК', true);
              a.health = 80;
              addLog(`День ${state.day}: 🩸 Переливание крови стабилизировало кошку при ВЛК-кризисе!`, 'success');
              closeEventModal();
            }
          },
          {
            label: 'Отказаться от дорогой реанимации (ведет к гибели)',
            style: 'danger',
            action: () => {
              a.health -= 50;
              closeEventModal();
            }
          }
        ]
      );
      return true;
    }
  }

  // Е) Внезапные роды беременной кошки на 8-й день (pregnant_stray_cat_timer, GDD 4.2)
  if (h.isPregnant && state.day >= (h.daysUntilBirth || 8) && !a.isSterilized && !state.triggeredEvents.birthEvent) {
    state.triggeredEvents.birthEvent = true;
    h.isPregnant = false;
    a.hasMotherCat = true;
    a.motherLactating = true;
    a.count = 6;
    a.initialCount = 6;
    a.ageDays = 1;
    a.speciesLabel = 'Мама-кошка + 5 новорожденных котят';
    a.visibleState = 'Кошка родила 5 котят! Расход корма увеличен в 2.5 раза. Стерилизация возможна через 45 дней лактации.';
    state.mental -= 20;
    showEventModal(
      'НОВОРОЖДЕННЫЕ В ШКАФУ: Кошка родила 5 котят!',
      `Вы не успели сделать экстренную стерилизацию до 8-го дня. Ночью кошка родила 5 пищащих слепых котят в вашем шкафу!\n\nТеперь у вас на руках 6 хвостов! Мама кормит молоком сама (соска не нужна), но расход корма вырос в 2.5 раза, а стерилизовать кошку нельзя до окончания 45 дней лактации. Пристроить нужно всех шестерых!`,
      [
        {
          label: 'Принять судьбу: заботиться о маме и выводке из 6 хвостиков',
          style: 'primary',
          action: () => {
            addLog(`День ${state.day}: 🐾 В доме прибавление: 5 новорожденных котят и кормящая мама. Спасательная операция усложнилась в 6 раз!`, 'warn');
            closeEventModal();
          }
        }
      ]
    );
    return true;
  }

  // Ж) Срыв взрослой собаки на прогулке на 4-й день (если нет шлейки-антипобег, GDD 7.3)
  if (a.species === 'dog' && a.ageCategory === 'adult' && !a.hasAntiEscapeHarness && state.day === 4 && isAnimalAtPlayerHome() && !state.triggeredEvents.dogEscape) {
    state.triggeredEvents.dogEscape = true;
    state.escapeQuest.active = true;
    state.escapeQuest.daysRemaining = 4;
    state.escapeQuest.searchProgress = 0;
    state.escapeQuest.reason = 'Срыв с ошейника от рева мотоцикла';
    state.mental -= 25;
    showEventModal(
      '🚨 ПОБЕГ СОБАКИ! Срыв с обычного ошейника на прогулке!',
      `Во время вечерней прогулки рядом с ревом пронесся мотоцикл. Собака в панике вывернулась из обычного ошейника и умчалась в темные дворы!\n\nЗапущен 4-ДНЕВНЫЙ ЭКСТРЕННЫЙ КВЕСТ ПОИСКА: нужно расклеивать макеты (-15⚡), прочесывать теплотрассы и подвалы в 4 утра с фонариком (-20⚡) и опрашивать районные чаты (-10⚡), чтобы довести шкалу поиска до 100% за 4 дня!\n\nВолонтеры «Зоошанса» всегда предупреждают: собакам с улицы жизненно необходима анатомическая трехремневая шлейка-антипобег с адресником (60 BYN в магазине или бесплатно б/у в чате)!`,
      [
        {
          label: 'Срочно бежать искать собаку!',
          style: 'danger',
          action: () => {
            addLog(`День ${state.day}: 🚨 ЭКСТРЕННО: Собака сбежала! До окончания 4 дней доведите шкалу поиска до 100%!`, 'danger');
            closeEventModal();
          }
        }
      ]
    );
    return true;
  }

  // З) Открытое окно на недобросовестной передержке у новичка на 7-й день (GDD 7.3)
  if (state.zooshans.locationStatus === 'social_foster_novice' && state.zooshans.socialFosterDaysElapsed === 7 && !state.triggeredEvents.windowEscape) {
    state.triggeredEvents.windowEscape = true;
    state.escapeQuest.active = true;
    state.escapeQuest.daysRemaining = 4;
    state.escapeQuest.searchProgress = 0;
    state.escapeQuest.reason = 'Побег из открытого окна на передержке';
    state.mental -= 25;
    showEventModal(
      '🚨 ЧП НА ПЕРЕДЕРЖКЕ: Кот выпрыгнул в открытое окно без сетки!',
      `Девушка с бесплатной передержки в слезах звонит вам: «Я открыла окно проветрить, он увидел воробья и выпрыгнул со 2 этажа в кусты! Я его не нашла!»\n\nЗапущен 4-ДНЕВНЫЙ ЭКСТРЕННЫЙ КВЕСТ ПОИСКА! Бросайте силы на расклейку макетов и ночной прочес подвалов!`,
      [
        {
          label: 'Мчаться на место и начать поисковую операцию!',
          style: 'danger',
          action: () => {
            addLog(`День ${state.day}: 🚨 ЭКСТРЕННО: Кот потерян передержкой через окно без сеток! Ищите беглеца в подвалах!`, 'danger');
            closeEventModal();
          }
        }
      ]
    );
    return true;
  }

  // И) Подозрение на ФИП на 14-й день (апатия, жидкость в брюшной полости)
  if (state.day >= 14 && a.health < 65 && !a.fipTreatment && !a.fipCured && !state.triggeredEvents.fipAlert && a.species === 'cat') {
    state.triggeredEvents.fipAlert = true;
    showEventModal(
      'ПОДОЗРЕНИЕ НА ФИП (Инфекционный перитонит кошек): Жидкость в брюшной полости!',
      `У кота волнообразная температура, апатия и округлившийся живот (выпот в брюшную полость). До появления препарата GS-441524 это был 100% смертный приговор.\n\nСегодня ФИП успешно лечится протоколом GS-441524 (84 дня ежедневных уколов или таблеток). Стоимость стартового флакона — 215 BYN (или сбор в чате волонтеров).`,
      [
        {
          label: 'Начать 84-дневный протокол GS-441524 (-215 BYN со старта)',
          style: 'primary',
          action: () => {
            payVetBill(215, false, 'Старт протокола GS-441524 против ФИП', true);
            a.fipTreatment = true;
            a.fipDaysLeft = 84;
            a.health = 75;
            addLog(`День ${state.day}: 💉 Начат 84-дневный курс GS-441524. Каждый день шансы на ремиссию растут!`, 'success');
            closeEventModal();
          }
        },
        {
          label: 'Отказаться от терапии GS-441524 (фатальный исход)',
          style: 'danger',
          action: () => {
            a.health -= 50;
            state.fatalMistakeReason = 'fip_no_treatment';
            closeEventModal();
          }
        }
      ]
    );
    return true;
  }

  return false;
}

function triggerBloodDonorModal() {
  stopTimer();
  showEventModal(
    '🩸 ЭКСТРЕННО: Требуется собака-донор крови для переливания!',
    `Сбитыш потерял критический объем крови из-за перелома таза. Гематокрит упал до 12%. Без переливания собака погибнет до утра прямо на операционном столе!\n\nВ Минске нет централизованного банка крови для животных. Доноров ищут через волонтерский чат «Зоошанса» среди домашних привитых собак весом от 25 кг!`,
    [
      {
        label: 'Кинуть SOS-клич в чат волонтеров @zooshans_chat (-10⚡)',
        style: 'primary',
        action: () => {
          if (!spendEnergy(10)) return;
          state.animal.bloodDonorFound = true;
          state.animal.health = Math.min(100, state.animal.health + 30);
          state.mental = Math.min(100, state.mental + 15);
          addLog(`День ${state.day}: 🐕 ЧАТ ВЫРУЧИЛ: Волонтер Лена примчалась в клинику с крупным лабрадором! Кровь совместима, переливание спасло жизнь!`, 'success');
          closeEventModal();
        }
      },
      {
        label: 'Не искать донора (продолжать операцию без крови)',
        style: 'danger',
        action: () => {
          state.animal.health -= 35;
          addLog(`День ${state.day}: Без донора крови операция прошла с тяжелейшими осложнениями.`, 'danger');
          closeEventModal();
        }
      }
    ]
  );
}

function triggerLandlordVisitModal() {
  stopTimer();
  const a = state.animal;
  const g = getAnimalGrammar(a);
  showEventModal(
    'ВНЕЗАПНЫЙ ВИЗИТ ХОЗЯИНА КВАРТИРЫ: «Животных не потерплю!»',
    `Хозяин квартиры пришел с квитанциями за ЖКУ и услышал шорох. Обнаружив ${g.acc}, он устроил грандиозный скандал:\n\n«В договоре черным по белому написано: без животных! Либо вы прямо сейчас платите 150 BYN залога за клининг и риск порчи обоев, либо животное убирается отсюда до вечера!»`,
    [
      {
        label: 'Заплатить залог 150 BYN хозяину квартиры (-150 BYN)',
        style: 'primary',
        action: () => {
          if (state.cash < 150) {
            addLog(`День ${state.day}: У вас нет 150 BYN на залог! Пришлось срочно искать передержку.`, 'warn');
            closeEventModal();
            triggerLandlordMoveToFosterModal();
            return;
          }
          state.cash = +(state.cash - 150).toFixed(1);
          state.personalMoneySpent = +(state.personalMoneySpent + 150).toFixed(1);
          state.mental = Math.max(0, state.mental - 15);
          addLog(`День ${state.day}: 🔑 Вы заплатили хозяину квартиры залог 150 BYN. Животное осталось дома.`, 'warn');
          closeEventModal();
        }
      },
      {
        label: `Срочно вывезти ${g.acc} на платную передержку (16 BYN/сут кот | 33 BYN/сут собака)`,
        style: 'info',
        action: () => {
          closeEventModal();
          triggerLandlordMoveToFosterModal();
        }
      }
    ]
  );
}

function triggerLandlordMoveToFosterModal() {
  const a = state.animal;
  const g = getAnimalGrammar(a);
  if (!a.examinedWood || a.dewormStage < 1) {
    state.fatalMistakeReason = 'landlord_eviction_no_vet';
    triggerEndGame(
      false,
      'БЕЗВЫХОДНОСТЬ: Хозяин квартиры выставил вас на улицу',
      `Поскольку вы вовремя не обследовали ${g.acc} в клинике (нет осмотра Вуда и глистогонки), ни одна платная передержка не согласилась взять животное с улицы вслепую.\n\nХозяин съемного жилья расторг договор аренды. Учитесь обследовать найденышей в первые же дни!`
    );
    return;
  }
  state.zooshans.locationStatus = 'paid_foster';
  state.mental = Math.max(0, state.mental - 15);
  addLog(`День ${state.day}: 🚗 ${g.nom} экстренно перевезен(а) на платную передержку из-за ультиматума арендодателя. Быт снят, но не забывайте оплачивать дни и снабжать кормом!`, 'info');
  renderAll();
}

function triggerSocialFosterConflictModal() {
  stopTimer();
  const a = state.animal;
  const g = getAnimalGrammar(a);
  showEventModal(
    'УЛЬТИМАТУМ ПЕРЕДЕРЖКИ: «Забирайте сегодня же!» (12-й день)',
    `Девушка из соцсетей, согласившаяся бесплатно передержать ${g.acc}, позвонила на взводе:\n\n«Я не знала, что волонтерство — это так тяжело! Он дерет диван, лоток нужно мыть дважды в день, а мне нужно уехать к парню на выходные. Забирайте ${g.acc} до 20:00, или я выпущу во двор!»`,
    [
      {
        label: `Забрать ${g.acc} обратно к себе домой (Бытовая нагрузка снова на вас)`,
        style: 'primary',
        action: () => {
          state.zooshans.locationStatus = state.zooshans.hasCage ? 'home_cage' : 'home_floor';
          state.mental = Math.max(0, state.mental - 15);
          addLog(`День ${state.day}: 🏠 Передержка не справилась с бытом — вы честно забрали ${g.acc} обратно домой.`, 'warn');
          closeEventModal();
        }
      },
      {
        label: 'Предложить передержке доплату 50 BYN за терпение до пристройства (-50 BYN)',
        style: 'info',
        action: () => {
          if (state.cash < 50) {
            addLog(`День ${state.day}: У вас нет 50 BYN — пришлось забрать животное домой.`, 'warn');
            state.zooshans.locationStatus = state.zooshans.hasCage ? 'home_cage' : 'home_floor';
            closeEventModal();
            return;
          }
          state.cash = +(state.cash - 50).toFixed(1);
          state.personalMoneySpent = +(state.personalMoneySpent + 50).toFixed(1);
          addLog(`День ${state.day}: 🤝 Вы договорились с передержкой: компенсация 50 BYN сгладила конфликт, животное остается у нее.`, 'success');
          closeEventModal();
        }
      },
      {
        label: 'Заблокировать номер и бросить подопечного на чужого человека (Малодушие)',
        style: 'danger',
        action: () => {
          state.fatalMistakeReason = 'abandoned_on_foster';
          triggerEndGame(
            false,
            'ПРЕДАТЕЛЬСТВО КУРАТОРА: Вы бросили животное',
            'Вы заблокировали номер человека, согласившегося вам помочь. Девушка не смогла держать чужое животное и выставила коробку на улицу.\n\nКуратор несет пожизненную персональную ответственность за подопечного. Никогда не бросайте людей, которые протянули вам руку помощи!'
          );
        }
      }
    ]
  );
}

function triggerReturnFromTempVolunteerModal() {
  stopTimer();
  const a = state.animal;
  const g = getAnimalGrammar(a);
  showEventModal(
    'ВОЗВРАТ СО СТАБИЛИЗАЦИИ: 10 дней перехвата волонтером истекли!',
    `Опытная волонтер Таня звонит вам:\n\n«Привет! 10 дней прошло, я сняла острый кризис, стабилизировала ${g.acc} и выкормила соской. Но сегодня вечером мне привозят нового тяжелого сбитыша. Как мы и договаривались, забирай ${g.acc} обратно до пристройства!»`,
    [
      {
        label: `Забрать ${g.acc} домой (Бытовая нагрузка возвращается к вам)`,
        style: 'primary',
        action: () => {
          state.zooshans.locationStatus = state.zooshans.hasCage ? 'home_cage' : 'home_floor';
          addLog(`День ${state.day}: 🏠 10 дней стабилизации подошли к концу — ${g.nom} вернулся(лась) к вам домой здоровым(ой) и окрепшим(ей)!`, 'info');
          closeEventModal();
        }
      }
    ]
  );
}

function triggerFinReportAuditModal() {
  stopTimer();
  showEventModal(
    'ОБЯЗАТЕЛЬНЫЙ ФИНОТЧЕТ ПО СБОРУ НА КАРТУ (Прошло 7 дней!)',
    `Прошло ровно 7 дней с момента сбора пожертвований на вашу личную банковскую карту. В сообществе волонтеров и доноров действуют строгие правила прозрачности!\n\nЕсли вы не сведете баланс и не выложите чеки (-15⚡), подписчики обвинят вас в токсичном сборе («токсосборщик»), Менталка упадет на -35%, а модераторы навсегда заблокируют сбор пожертвований!`,
    [
      {
        label: 'Свести чеки, выписки и опубликовать финотчет в соцсетях (-15⚡)',
        style: 'primary',
        action: () => {
          if (!spendEnergy(15)) {
            addLog(`День ${state.day}: Не хватило энергии на финотчет — сделайте это в первую очередь завтра!`, 'warn');
            closeEventModal();
            return;
          }
          state.zooshans.daysSinceLastFinReport = 0;
          state.mental = Math.min(100, state.mental + 5);
          addLog(`День ${state.day}: 📊 Прозрачный 7-дневный финотчет с чеками опубликован! Доверие подписчиков на высоте (+5% Менталки).`, 'success');
          closeEventModal();
        }
      },
      {
        label: 'Проигнорировать отчет («Я никому ничего не должен, у меня нет сил»)',
        style: 'danger',
        action: () => {
          state.zooshans.personalDonationsBanned = true;
          state.mental = Math.max(0, state.mental - 35);
          addLog(`День ${state.day}: 🚫 СКАНДАЛ В КОММЕНТАРИЯХ: Вас обвинили в присвоении средств без чеков (-35% Менталки)! Сбор на личную карту заблокирован модераторами.`, 'danger');
          closeEventModal();
        }
      }
    ]
  );
}

function triggerVoucherDeadlineModal() {
  stopTimer();
  showEventModal(
    'ПРЕДУПРЕЖДЕНИЕ: До истечения 30-дневного талона «Зоошанса» осталось 3 дня!',
    `Координатор Колл-центра напоминает: по вашему гарантийному талону в клинику висит долг ${state.zooshans.voucherDebt} BYN. До истечения 30 дней осталось 3 суток!\n\nЕсли долг не будет погашен (личными деньгами или сбором), талоны в клиники для вас будут заблокированы.`,
    [
      {
        label: 'Понятно! Буду гасить долг (личными средствами или сбором на карту)',
        style: 'primary',
        action: () => closeEventModal()
      }
    ]
  );
}

function triggerFestivalModal() {
  stopTimer();
  const a = state.animal;
  const g = getAnimalGrammar(a);
  showEventModal(
    '🎪 БЛАГОТВОРИТЕЛЬНАЯ ВЫСТАВКА-ПРИСТРОЙСТВО «ЗООШАНСА»!',
    `Сегодня в минском торговом центре проходит грандиозная выставка-пристройство (проводится 5 раз в год — каждые 72 дня)!\n\n${g.nom} полностью готов(а): есть прививка, паспорт, карантин пройден и стерилизация проведена. Из-за квоты боксов отбор анкет проходят 48% участников. Участие требует провести весь день в ТЦ (-40⚡), а шанс найти ответственных хозяев прямо на выставке — 38%!`,
    [
      {
        label: 'Подать заявку и поехать на весь день на выставку (-40⚡)',
        style: 'primary',
        action: () => {
          if (!spendEnergy(40)) {
            addLog(`День ${state.day}: Не хватило сил на поездку на выставку (нужно 40⚡).`, 'warn');
            closeEventModal();
            return;
          }
          if (Math.random() < 0.48) {
            if (Math.random() < 0.38) {
              completeOneOrPairAdoption(false, 'Счастливый день! Прямо на выставке «Зоошанса» ваш хвостик покорил сердце молодой семьи с договором и паспортом!');
            } else {
              state.supplies.daysLeft += 10;
              state.mental = Math.min(100, state.mental + 15);
              addLog(`День ${state.day}: 🎪 Выставка прошла ярко! Дом пока не нашли, но вам подарили мешок суперпремиум корма (+10 дн. расходников) и взяли контакты.`, 'success');
              closeEventModal();
            }
          } else {
            addLog(`День ${state.day}: 🎪 Квота боксов на выставку была переполнена — анкета не прошла отбор. Продолжаем системный пиар по сайтам!`, 'info');
            closeEventModal();
          }
        }
      },
      {
        label: 'Пропустить выставку (сосредоточиться на пиаре по сайтам)',
        style: 'info',
        action: () => closeEventModal()
      }
    ]
  );
}

function triggerEuAdoptionReadyModal() {
  stopTimer();
  const a = state.animal;
  const g = getAnimalGrammar(a);
  showEventModal(
    '🌍 ЕВРОПА: 90-дневный карантин завершен! Хвостик летит в новый дом!',
    `Срок в 90 дней после сдачи титров на антитела к бешенству успешно истек! Куратор в Германии полностью проверил условия у будущих хозяев.\n\nБудущая семья из Европы полностью оплатила официальный трансфер через границу (430 BYN)! Вам остается лишь оформить выездной ветеринарный сертификат на ул. Минина (50 BYN).`,
    [
      {
        label: 'Оформить евросертификат (-50 BYN) и отправить в семью!',
        style: 'primary',
        action: () => {
          state.cash = +(state.cash - 50).toFixed(1);
          state.personalMoneySpent = +(state.personalMoneySpent + 50).toFixed(1);
          completeOneOrPairAdoption(false, `Невероятное международное спасение! ${g.nom} успешно пересек(ла) границу и уже спит на мягком пледе в уютном доме в Европе. Семья прислала видео с восторженными приветствиями!`);
        }
      }
    ]
  );
}

function triggerSecondWindModal() {
  stopTimer();
  state.secondWindUsed = true;
  showEventModal(
    '💔 МОРАЛЬНОЕ ИСТОЩЕНИЕ: Попросить поддержки в чате @zooshans_chat',
    `Ваш ресурс Менталки упал до нуля. Опускаются руки: недосып, бесконечные уборки, траты и тревога за жизнь найденыша.\n\nВ реальности волонтеры часто оказываются в такой же яме. Один раз за партию вы можете написать честный крик души в живой чат волонтеров «Зоошанса» (@zooshans_chat). Кураторы поддержат вас добрым словом, поделятся опытом и дадут второе дыхание!`,
    [
      {
        label: 'Написать в чат @zooshans_chat: «Ребята, поддержите, я на грани...» (+45% Менталки)',
        style: 'primary',
        action: () => {
          state.mental = 45;
          addLog(`День ${state.day}: 💬 ВТОРОЕ ДЫХАНИЕ: Десятки кураторов в чате @zooshans_chat написали вам слова поддержки, поделились своими историями и напомнили: вы спасаете жизнь! Менталка восстановлена до 45%.`, 'success');
          closeEventModal();
        }
      }
    ]
  );
}

function triggerBurnoutModal() {
  stopTimer();
  state.fatalMistakeReason = 'burnout';
  triggerEndGame(
    false,
    'ПОРАЖЕНИЕ: Эмоциональное выгорание куратора',
    'Ваш психологический ресурс повторно упал до 0%. Хронический стресс, недосып и изоляция привели к тяжелейшему выгоранию.\n\nВолонтерство — это марафон, а не спринт. Главное правило опытного спасателя: спасать нужно не в ущерб собственному здоровью. Вступайте в чат взаимопомощи @zooshans_chat, чтобы не оставаться один на один с бедой!'
  );
}

function triggerDay1IntroModal() {
  stopTimer();
  showEventModal(
    'ОДИН НА ОДИН: ВЫ НАШЛИ БЕЗДОМНОЕ ЖИВОТНОЕ!',
    `Вы — обычный минчанин, который шел по своим делам и наткнулся на беду. Вы не волонтер с 10-летним стажем, у вас нет подвала с клетками и волшебного номера приюта.\n\nПЕРВЫЕ 3 ДНЯ («Острая фаза») проходят в ПОШАГОВОМ режиме: автоматический таймер отключен, чтобы вы спокойно разобрались в ситуации, узнали правду о зоозащите и наметили план.\n\nЧто будете делать в первый же час?`,
    [
      {
        label: '🔍 Погуглить: «Нашел животное в Минске, что делать?» (-5⚡)',
        style: 'primary',
        action: () => {
          closeEventModal();
          actionGoogleSearch();
        }
      },
      {
        label: '🏛 Позвонить в «государственный приют» (Фауна города, Гурского, 42) (-5⚡)',
        style: 'info',
        action: () => {
          closeEventModal();
          actionCallGurskogo();
        }
      },
      {
        label: '📦 Подбросить коробку под двери ветклиники или зоомагазина',
        style: 'danger',
        action: () => {
          closeEventModal();
          actionDumpBoxTrap();
        }
      }
    ]
  );
}
