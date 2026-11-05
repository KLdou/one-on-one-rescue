// events.js - Медицинские кризисы, триггеры, бытовые ЧП и сюжетные события (v2.0)

function checkMedicalAndCrisisTriggers() {
  const a = state.animal;
  const h = a.hiddenState;
  const g = getAnimalGrammar(a);

  // Самовосстановление: если квест побега с передержки был ошибочно активирован для пациента в стационаре или на долечивании/реабилитации, сбрасываем его
  const isMedRestricted = Boolean(
    (a.inStationaryDaysLeft && a.inStationaryDaysLeft > 0) ||
    (a.virusRecoveryDaysLeft && a.virusRecoveryDaysLeft > 0) ||
    (a.traumaRehabDaysLeft && a.traumaRehabDaysLeft > 0)
  );
  if (state.escapeQuest && state.escapeQuest.active && isMedRestricted) {
    state.escapeQuest.active = false;
    state.escapeQuest.daysRemaining = 0;
    state.escapeQuest.searchProgress = 0;
    state.triggeredEvents.windowEscape = false;
  }

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
            if (!payVetBill(70, true, 'Прием офтальмолога и схема спасения зрения', false)) return;
            a.eyeDropsDaysDone = 1;
            addLog(`День ${state.day}: 👁️ Начат 10-дневный интенсивный курс капель по схеме офтальмолога.`, 'success');
            closeEventModal();
            renderAll();
          }
        },
        {
          label: 'Не ехать к офтальмологу (котята потеряют зрение, популярность упадет в 3 раза)',
          style: 'danger',
          action: () => {
            a.eyeDropsCompleted = true;
            a.coatPopularity = +(a.coatPopularity * 0.33).toFixed(2);
            state.mental = Math.max(0, state.mental - 25);
            checkMentalHealth();
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
    a.health = Math.max(25, a.health - 45); // Критическое падение здоровья
    state.mental = Math.max(0, state.mental - 25);
    checkMentalHealth();

    const vTitle = h.deadlyVirus === 'parvovirus_enteritis'
      ? 'ЖИЗНЕУГРОЖАЮЩЕЕ СОСТОЯНИЕ: Парвовирусный энтерит у щенков!'
      : 'ЖИЗНЕУГРОЖАЮЩЕЕ СОСТОЯНИЕ: Панлейкопения (чумка котят)!';
    let vDesc = `Инкубационный период закончился! У ${g.gen} неукротимая рвота, профузный понос с кровью, отказ от еды и стремительное обезвоживание. Это смертельно опасное состояние, требующее круглосуточного инфекционного стационара и инфузоматов (140 BYN/сут | 112 BYN по талону)!\n\nДаже в ОРИТ есть риск гибели, а после стабилизации потребуется не менее 2 недель (14 дней) долечивания и диеты — пристройство будет отложено.`;

    // Заражение непривитого домашнего кота при нарушении карантина (GDD 3.4)
    if (!g.isDog && state.player.ownPets.id === 'unvaccinated_cat' && state.zooshans.locationStatus === 'home_floor') {
      state.cash = Math.max(0, +(state.cash - 215).toFixed(1));
      state.personalMoneySpent = +(state.personalMoneySpent + 215).toFixed(1);
      state.mental = Math.max(0, state.mental - 30);
      vDesc += '\n\n💥 КАТАСТРОФА КАРАНТИНА: Поскольку найденыш жил дома на полу без клетки «Зоошанса», заразился ваш собственный непривитый кот (-215 BYN на лечение, -30% Менталки)!';
    }

    showEventModal(vTitle, vDesc, [
      {
        label: 'Согласовать с Колл-центром и поместить в инфекционный ОРИТ на 3 суток (336 BYN по талону)',
        style: 'primary',
        action: () => {
          if (!payVetBill(420, true, '3 суток реанимации в инфекционном ОРИТ', true)) return;
          state.zooshans.expensiveApproved = true;
          a.inStationaryDaysLeft = 3;
          a.stationaryReason = 'virus';
          a.health = 45; // В ОРИТ, тяжелое но под контролем врачей
          a.knownVirus = 'В инфекционном ОРИТ (капельницы)';

          // Если подопечный был на передержке у новичка или платной передержке:
          if (state.zooshans.locationStatus === 'social_foster_novice') {
            state.zooshans.socialFosterDaysElapsed = 0;
            state.zooshans.locationStatus = state.zooshans.hasCage ? 'home_cage' : 'home_floor';
            addLog(`День ${state.day}: 🏠 Девушка с бесплатной передержки в панике отказалась брать тяжелобольного назад. После стационара выхаживание ложится на вас!`, 'warn');
          } else if (state.zooshans.locationStatus === 'paid_foster') {
            state.zooshans.locationStatus = state.zooshans.hasCage ? 'home_cage' : 'home_floor';
            addLog(`День ${state.day}: ⚠️ Платная передержка категорически отказалась принимать больного с опасной вирусной инфекцией.`, 'warn');
          }

          addLog(`День ${state.day}: 🏥 ${g.nom} экстренно госпитализирован(а) в инфекционный ОРИТ под инфузоматы. Врачи борются за жизнь!`, 'warn');
          closeEventModal();
          renderAll();
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
          checkAnimalHealth();
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
    if (a.felvAntiviralActive || a.felvInfectiousConsultDone) {
      addLog(`День ${state.day}: 🛡️ Благодаря назначенной инфекционистом противовирусной терапии (Ралтегравир) кошка благополучно миновала критический 10-й день без анемического криза! Вирусная нагрузка под контролем.`, 'success');
      return false;
    }
    if (Math.random() < 0.35) {
      a.health -= 35;
      state.mental = Math.max(0, state.mental - 20);
      checkMentalHealth();
      showEventModal(
        'КРИЗИС ВЛК: Острая гемолитическая анемия!',
        `У кошки побелели десны, температура упала, тяжелое дыхание. Вирусная лейкемия (FeLV+) перешла в фазу подавления костного мозга. Требуется срочная реанимация и переливание крови!`,
        [
          {
            label: 'Экстренно везти в круглосуточный ветцентр на переливание (280 BYN / 224 BYN по талону)',
            style: 'primary',
            action: () => {
              if (!payVetBill(280, true, 'Реанимация и переливание эритроцитарной массы при ВЛК', true)) return;
              state.zooshans.expensiveApproved = true;
              a.health = 80;
              addLog(`День ${state.day}: 🩸 Переливание крови стабилизировало кошку при ВЛК-кризисе!`, 'success');
              closeEventModal();
              renderAll();
            }
          },
          {
            label: 'Отказаться от дорогой реанимации (ведет к гибели)',
            style: 'danger',
            action: () => {
              a.health -= 50;
              closeEventModal();
              checkAnimalHealth();
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
    a.totalCount = 6;
    a.activeCount = 6;
    a.ageDays = 1;
    a.speciesLabel = 'Мама-кошка + 5 новорожденных котят';
    a.visibleState = 'Кошка родила 5 котят! Расход корма увеличен в 2.5 раза. Стерилизация возможна через 45 дней лактации.';
    state.mental = Math.max(0, state.mental - 20);
    checkMentalHealth();
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
  const isDogConfined = a.traumaOperated || h.hasSevereTrauma || a.id === 'severe_trauma_sheri_dog' || (a.inStationaryDaysLeft && a.inStationaryDaysLeft > 0);
  if (a.species === 'dog' && a.ageCategory === 'adult' && !a.hasAntiEscapeHarness && state.day === 4 && isAnimalAtPlayerHome() && !state.triggeredEvents.dogEscape) {
    if (isDogConfined) {
      if (!state.triggeredEvents.dogEscapeLogged) {
        state.triggeredEvents.dogEscapeLogged = true;
        addLog(`День ${state.day}: 🏥 Собака восстанавливается после операции (стационар/покой). Прогулки на поводке исключены — риск срыва и побега отсутствует.`, 'info');
      }
    } else {
      state.triggeredEvents.dogEscape = true;
      state.escapeQuest.active = true;
      state.escapeQuest.daysRemaining = 4;
      state.escapeQuest.searchProgress = 0;
      state.escapeQuest.reason = 'Срыв с ошейника от рева мотоцикла';
      state.mental = Math.max(0, state.mental - 25);
      checkMentalHealth();
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
  }

  // З) Побег на недобросовестной передержке у новичка на 7-й день (GDD 7.3)
  const isConfinedOrStationary = Boolean(
    (a.inStationaryDaysLeft && a.inStationaryDaysLeft > 0) ||
    (a.virusRecoveryDaysLeft && a.virusRecoveryDaysLeft > 0) ||
    (a.traumaRehabDaysLeft && a.traumaRehabDaysLeft > 0) ||
    a.traumaOperated ||
    h.hasSevereTrauma
  );
  if (!isConfinedOrStationary && state.zooshans.locationStatus === 'social_foster_novice' && state.zooshans.socialFosterDaysElapsed === 7 && !state.triggeredEvents.windowEscape) {
    state.triggeredEvents.windowEscape = true;
    state.escapeQuest.active = true;
    state.escapeQuest.daysRemaining = 4;
    state.escapeQuest.searchProgress = 0;
    state.mental = Math.max(0, state.mental - 25);
    checkMentalHealth();

    const isPuppy = a.species === 'dog' && (a.ageCategory === 'puppy' || a.ageDays < 180 || (a.count && a.count > 1));
    const isDog = a.species === 'dog';
    let escTitle = '';
    let escDesc = '';
    let escLog = '';

    if (isPuppy) {
      escTitle = '🚨 ЧП НА ПЕРЕДЕРЖКЕ: Щенок выскочил через незапертую дверь на улицу!';
      escDesc = `Девушка с бесплатной передержки в слезах звонит вам: «Я открыла дверь вынести мусор, не заметила, как один щенок проскользнул в подъезд, а дверь на улицу была распахнута настежь! Он выбежал во двор и спрятался под машинами, я не смогла его догнать!»\n\nЗапущен 4-ДНЕВНЫЙ ЭКСТРЕННЫЙ КВЕСТ ПОИСКА! Срочно бросайте силы на расклейку макетов и опрос местных жителей во дворах!`;
      state.escapeQuest.reason = 'Побег щенка через незапертую дверь';
      escLog = `День ${state.day}: 🚨 ЭКСТРЕННО: Щенок потерян передержкой через незапертую дверь подъезда! Ищите беглеца во дворах и под машинами!`;
    } else if (isDog) {
      escTitle = '🚨 ЧП НА ПЕРЕДЕРЖКЕ: Собака сорвалась с ошейника на прогулке!';
      escDesc = `Девушка с бесплатной передержки в слезах звонит вам: «Мы вышли на прогулку, резко засигналила машина — собака рванула от испуга, вывернулась из обычного ошейника и убежала во дворы! Я бегала, звала, но не нашла!»\n\nЗапущен 4-ДНЕВНЫЙ ЭКСТРЕННЫЙ КВЕСТ ПОИСКА! Срочно бросайте силы на расклейку макетов и опрос собачников!`;
      state.escapeQuest.reason = 'Срыв собаки с ошейника на передержке';
      escLog = `День ${state.day}: 🚨 ЭКСТРЕННО: Собака сорвалась с ошейника на передержке! Ищите беглеца во дворах и гаражах!`;
    } else {
      escTitle = '🚨 ЧП НА ПЕРЕДЕРЖКЕ: Кот выпрыгнул в открытое окно без сетки!';
      escDesc = `Девушка с бесплатной передержки в слезах звонит вам: «Я открыла окно проветрить, он увидел воробья и выпрыгнул со 2 этажа в кусты! Я его не нашла!»\n\nЗапущен 4-ДНЕВНЫЙ ЭКСТРЕННЫЙ КВЕСТ ПОИСКА! Бросайте силы на расклейку макетов и ночной прочес подвалов!`;
      state.escapeQuest.reason = 'Побег из открытого окна на передержке';
      escLog = `День ${state.day}: 🚨 ЭКСТРЕННО: Кот потерян передержкой через окно без сеток! Ищите беглеца в подвалах!`;
    }

    showEventModal(
      escTitle,
      escDesc,
      [
        {
          label: 'Мчаться на место и начать поисковую операцию!',
          style: 'danger',
          action: () => {
            addLog(escLog, 'danger');
            closeEventModal();
          }
        }
      ]
    );
    return true;
  }

  // И) Подозрение на ФИП на 14-й день (апатия, жидкость в брюшной полости) — 40% шанс при здоровье < 65%
  if (state.day >= 14 && a.health < 65 && !a.fipTreatment && !a.fipCured && !state.triggeredEvents.fipAlert && a.species === 'cat') {
    state.triggeredEvents.fipAlert = true;
    if (Math.random() < 0.40) {
      showEventModal(
        'ПОДОЗРЕНИЕ НА ФИП (Инфекционный перитонит кошек): Жидкость в брюшной полости!',
        `У кота волнообразная температура, апатия и округлившийся живот (выпот в брюшную полость). До появления препарата GS-441524 это был 100% смертный приговор.\n\nСегодня ФИП успешно лечится протоколом GS-441524 (84 дня ежедневных уколов или таблеток). Стоимость стартового флакона — 215 BYN (или сбор в чате волонтеров).`,
        [
          {
            label: 'Начать 84-дневный протокол GS-441524 (-215 BYN со старта)',
            style: 'primary',
            action: () => {
              if (!payVetBill(215, false, 'Старт протокола GS-441524 против ФИП', true)) return;
              a.fipTreatment = true;
              a.fipDaysLeft = 84;
              a.health = 75;
              addLog(`День ${state.day}: 💉 Начат 84-дневный курс GS-441524. Каждый день шансы на ремиссию растут!`, 'success');
              closeEventModal();
              renderAll();
            }
          },
          {
            label: 'Отказаться от терапии GS-441524 (фатальный исход)',
            style: 'danger',
            action: () => {
              a.health -= 50;
              state.fatalMistakeReason = 'fip_no_treatment';
              closeEventModal();
              checkAnimalHealth();
            }
          }
        ]
      );
      return true;
    } else {
      addLog(`День ${state.day}: 🩺 Контроль состояния (14-й день): несмотря на сниженный иммунитет (${a.health}%), выпота в брюшную полость нет — подозрение на ФИП не подтвердилось (кризис миновал)!`, 'info');
    }
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
    'ВОЗВРАТ С КАРАНТИНА И СТАБИЛИЗАЦИИ: 14 дней перехвата волонтером истекли!',
    `Опытная волонтер Таня звонит вам:\n\n«Привет! 14 дней карантина и стабилизации прошло, я сняла острый кризис, стабилизировала ${g.acc} и выкормила соской. Но сегодня вечером мне привозят нового тяжелого сбитыша. Как мы и договаривались, забирай ${g.acc} обратно до пристройства!»`,
    [
      {
        label: `Забрать ${g.acc} домой (Бытовая нагрузка возвращается к вам)`,
        style: 'primary',
        action: () => {
          state.zooshans.locationStatus = state.zooshans.hasCage ? 'home_cage' : 'home_floor';
          addLog(`День ${state.day}: 🏠 14 дней карантина и стабилизации подошли к концу — ${g.nom} вернулся(лась) к вам домой здоровым(ой) и окрепшим(ей)!`, 'info');
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
    `Прошло ровно 7 дней с момента сбора пожертвований на вашу личную банковскую карту. В сообществе волонтеров и доноров действуют строгие правила прозрачности!\n\nЕсли вы не сведете баланс и не выложите чеки (-20⚡), подписчики обвинят вас в токсичном сборе («токсосборщик»), Менталка упадет на -35%, а модераторы навсегда заблокируют сбор пожертвований!`,
    [
      {
        label: 'Свести чеки, выписки и опубликовать финотчет в соцсетях (-20⚡)',
        style: 'primary',
        action: () => {
          if (!spendEnergy(20)) {
            addLog(`День ${state.day}: Не хватило энергии (20⚡) на финотчет — сделайте это в первую очередь завтра!`, 'warn');
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
          if (state.cash < 50) {
            const shortBYN = +(50 - state.cash).toFixed(1);
            state.personalMoneySpent = +(state.personalMoneySpent + state.cash).toFixed(1);
            state.cash = 0;
            addLog(`День ${state.day}: ⚠️ На оформление евросертификата не хватало ${shortBYN} BYN — недостающую сумму одолжили друзья по чату @zooshans_chat!`, 'warn');
          } else {
            state.cash = +(state.cash - 50).toFixed(1);
            state.personalMoneySpent = +(state.personalMoneySpent + 50).toFixed(1);
          }
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
  const choices = [];
  const isExperienced = getSavedAlbum().length > 0;

  if (isExperienced) {
    choices.push({
      label: '🎓 Я уже опытный куратор: пропустить памятку и начать спасение (0⚡)',
      style: 'primary',
      action: () => {
        state.onboarding.day1ChoiceMade = true;
        closeEventModal();
        state.onboarding.googleDone = true;
        addLog(`День ${state.day}: 🎓 Опытный куратор: вы уже знаете правила зоозащиты! Переходим к осмотру подопечного.`, 'success');
        switchTab('vet');
      }
    });
  } else {
    choices.push({
      label: '🏥 Сразу заняться спасением: перейти к осмотру в клинике (0⚡)',
      style: 'primary',
      action: () => {
        state.onboarding.day1ChoiceMade = true;
        closeEventModal();
        switchTab('vet');
      }
    });
  }

  choices.push(
    {
      label: '🔍 Погуглить: «Нашел животное в Минске, что делать?» (-5⚡)',
      style: 'info',
      action: () => {
        state.onboarding.day1ChoiceMade = true;
        closeEventModal();
        actionGoogleSearch();
      }
    },
    {
      label: '🏛 Позвонить в «государственный приют» (Фауна города, Гурского, 42) (-5⚡)',
      style: 'info',
      action: () => {
        state.onboarding.day1ChoiceMade = true;
        closeEventModal();
        actionCallGurskogo();
      }
    },
    {
      label: '📦 Подбросить коробку под двери ветклиники или зоомагазина',
      style: 'danger',
      action: () => {
        state.onboarding.day1ChoiceMade = true;
        closeEventModal();
        actionDumpBoxTrap();
      }
    }
  );

  showEventModal(
    'ОДИН НА ОДИН: ВЫ НАШЛИ БЕЗДОМНОЕ ЖИВОТНОЕ!',
    `Вы обыкновенный человек, который просто не смог пройти мимо нуждающегося животного. Нет оборудования и понимания что делать.\n\nПЕРВЫЕ 3 ДНЯ («Острая фаза») проходят в ПОШАГОВОМ режиме: автоматический таймер отключен, чтобы вы спокойно разобрались в ситуации, узнали правду о зоозащите и наметили план.\n\nЧто будете делать в первый же час?`,
    choices
  );
}

function triggerRedFlagDelayedStrikeModal(trialItem) {
  stopTimer();
  if (typeof checkMentorTriggers === 'function') {
    checkMentorTriggers('ADOPTION_FAILED_POSTMORTEM');
  }
  state.fatalMistakeReason = trialItem.callData ? trialItem.callData.id : null;
  state.fatalCandidateData = trialItem.callData || null;
  const consequence = trialItem.callData ? trialItem.callData.consequenceText : '';
  showEventModal(
    '💔 ТРАГЕДИЯ НА ИСПЫТАТЕЛЬНОМ СРОКЕ: КРАСНЫЙ ФЛАГ',
    `Прошло 4 дня тишины. Вы набрали номер абонента («${trialItem.adopterSummary}»)... Ваш номер заблокирован, либо хозяева буднично сообщили о трагедии:\n\n${consequence}\n\nВы отдали животное ненадежным ручкам, понадеявшись на русский авось. Опасные сигналы в разговоре были проигнорированы.`,
    [
      {
        label: 'Горький финал (Перейти к разбору ошибок)',
        style: 'danger',
        action: () => {
          closeEventModal();
          triggerEndGame(false, 'ТРАГЕДИЯ: Питомец погиб или пострадал у плохих хозяев', consequence);
        }
      }
    ]
  );
}

function triggerEarlyBookedTransferModal() {
  stopTimer();
  const a = state.animal;
  const isBeforeVaccine = !a.parasitesAndVaccinated;
  const ageDays = a.ageDays || 45;

  const desc = isBeforeVaccine
    ? `Семья, забронировавшая малыша («${a.petName || a.title}»), готова принять его в свой дом прямо сейчас (возраст: ${ageDays} дн., до вакцинации)!\n\nОни подписывают официальный кураторский договор «Зоошанса» с обязательством сделать первую комплексную прививку по достижении 60 дней и стерилизацию по возрасту.`
    : `Подопечный («${a.petName || a.title}») готов к переезду в забронировавшую его семью!\n\nСемья приехала с переноской и подписывает официальный договор куратора.`;

  showEventModal(
    '🎉 РАННЯЯ БРОНЬ: Передача малыша в семью!',
    desc,
    [
      {
        label: '🏠 Передать по договору на 14-дневный испытательный срок',
        style: 'primary',
        action: () => {
          closeEventModal();
          state.pr.earlyBookedAdopterWaiting = false;
          if (state.pr.earlyBooking) state.pr.earlyBooking.active = false;
          initiateAnimalTransferWithTrial(false, {
            id: 'call_early_booked_adopter',
            caller: 'Семья по ранней брони',
            candidateName: 'Семья по ранней брони',
            housing: 'Своя квартира (Минск)',
            source: 'Соцсети (Сторителлинг)',
            dialogue: isBeforeVaccine
              ? '«Мы так полюбили малыша по вашим фото! Заберем домой прямо сейчас, окружим теплом, а прививки в 2 месяца сделаем сами в ветклинике по договору!»'
              : '«Мы так ждали встречи с малышом! Все готово к его приезду».',
            isSafe: true,
            slot1: { title: 'Безопасность и окна', text: 'Сетки-антикошки установлены, квартира полностью подготовлена к малышу.', flag: 'green' },
            slot2: { title: 'Кормление и бюджет на ветеринара', text: 'Закуплен суперпремиум корм, бюджет на клинику отложен.', flag: 'green' },
            slot3: { title: 'Мотивация и договор', text: 'Подписание договора куратора с обязательством вакцинации в 60 дней и стерилизации.', flag: 'green' }
          }, { successChance: 0.95 });
        }
      },
      {
        label: '⏳ Подождать (оставить пока у себя)',
        style: 'info',
        action: () => {
          closeEventModal();
          addLog(`День ${state.day}: 📝 Малыш остается на брони у семьи. Вы можете передать его в любой день во вкладке «Быт и Пиар» (до вакцинации по договору).`, 'info');
        }
      }
    ]
  );
}

function triggerTrialSuccessModal(trialItem) {
  stopTimer();
  const isPair = (trialItem.count || 1) > 1;
  const isDog = trialItem.species === 'dog';
  const petHappyText = isDog
    ? (isPair
      ? `«${trialItem.petName}» полностью освоились, с удовольствием бегают на прогулках в парке, виляют хвостиками и радуют всю семью!`
      : `«${trialItem.petName}» полностью освоился, с удовольствием гуляет на поводке в парке, виляет хвостом при встрече и радует всю семью!`)
    : (isPair
      ? `«${trialItem.petName}» полностью освоились, спят в обнимку на мягких подушках, мурчат на руках и радуют всю семью!`
      : `«${trialItem.petName}» полностью освоился, спит на мягких подушках, мурчит на руках и радует всю семью!`);

  const desc = isPair
    ? `Семья («${trialItem.adopterSummary}») прислала долгожданный фото-привет с дивана:\n\n${petHappyText} 14-дневный испытательный срок успешно завершен (+15% Менталки)!\n\nОба хвостика официально занесены в ваш личный «Альбом спасенных хвостиков»!`
    : `Семья («${trialItem.adopterSummary}») прислала долгожданный фото-привет с дивана:\n\n${petHappyText} 14-дневный испытательный срок успешно завершен (+15% Менталки)!\n\nХвостик официально занесен в ваш личный «Альбом спасенных хвостиков»!`;

  showEventModal(
    '🎉 ИСПЫТАТЕЛЬНЫЙ СРОК УСПЕШНО ПРОЙДЕН!',
    desc,
    [
      {
        label: 'Какое счастье! (Продолжить партию)',
        style: 'primary',
        action: () => {
          closeEventModal();
          const logMsg = isPair
            ? `День ${state.day}: 🎉 «${trialItem.petName}» успешно пристроены в одну семью! В альбоме куратора пополнение сразу на два хвостика.`
            : `День ${state.day}: 🎉 «${trialItem.petName}» успешно пристроен! В альбоме куратора пополнение.`;
          addLog(logMsg, 'success');
          if (state.animal.savedCount >= (state.animal.totalCount || state.animal.count || 1)) {
            if (state.animal.hasMotherCat && !state.animal.motherSterilized) {
              addLog(`День ${state.day}: 🐾 Все котята благополучно пристроены! Но мама-кошка еще не стерилизована — завершите операцию до победы!`, 'info');
            } else {
              triggerEndGame(
                true,
                'ПОБЕДА: Все подопечные обрели любящий дом!',
                `Поздравляем! Все ваши подопечные (${state.animal.savedCount} хвостиков) благополучно прошли испытательный срок и навсегда обрели семью!\n\nВы проявили стойкость, терпение и ответственность настоящего куратора МБООПЖ «Зоошанс»!`
              );
            }
          }
        }
      }
    ]
  );
}

function triggerTrialReturnModal(trialItem) {
  stopTimer();
  if (typeof checkMentorTriggers === 'function') {
    checkMentorTriggers('ADOPTION_FAILED_POSTMORTEM');
  }
  const isPair = (trialItem.count || 1) > 1;
  if (trialItem.fosterSpotHeld) {
    state.mental = Math.max(0, state.mental - 10);
    state.zooshans.locationStatus = trialItem.fosterLocation || 'home_floor';
    const returnMsg = isPair
      ? `Семья не справилась с адаптацией и вернула «${trialItem.petName}». К счастью, вы предусмотрительно придержали места на передержке — малыши вернулись в знакомый бокс (-10% Менталки)!\n\nПродолжаем поиск подходящих хозяев.`
      : `Семья не справилась с адаптацией и вернула «${trialItem.petName}». К счашьтю, вы предусмотрительно придержали место на передержке — питомец вернулся в знакомый бокс (-10% Менталки)!\n\nПродолжаем поиск подходящих хозяев.`;
    showEventModal(
      '↩️ БЫТОВОЙ ВОЗВРАТ С ИСПЫТАТЕЛЬНОГО СРОКА',
      returnMsg,
      [
        {
          label: 'Принять возврат и продолжить пиар',
          style: 'primary',
          action: () => {
            closeEventModal();
            const logMsg = isPair
              ? `День ${state.day}: ↩️ Малыши («${trialItem.petName}») вернулись на придержанную передержку. Пиар продолжается!`
              : `День ${state.day}: ↩️ Питомец вернулся на придержанную передержку. Пиар продолжается!`;
            addLog(logMsg, 'warn');
          }
        }
      ]
    );
  } else {
    state.mental = Math.max(0, state.mental - 20);
    const ultimatumMsg = isPair
      ? `Хозяева позвонили с ультиматумом: «Забирайте «${trialItem.petName}» сегодня же, мы больше не можем!»\n\nПоскольку места на передержке не были придержаны, их уже заняли! Что будете делать? (-20% Менталки)`
      : `Хозяева позвонили с ультиматумом: «Забирайте «${trialItem.petName}» сегодня же, мы больше не можем!»\n\nПоскольку место на передержке не было придержано, его уже заняли! Что будете делать? (-20% Менталки)`;
    showEventModal(
      '🚨 УЛЬТИМАТИВНЫЙ ВОЗВРАТ: МЕСТО НА ПЕРЕДЕРЖКЕ НЕ ПРИДЕРЖАНО!',
      ultimatumMsg,
      [
        {
          label: '⏳ Попытаться договориться на 3 дня для маневра (-15⚡, 65% шанс)',
          style: 'primary',
          action: () => {
            if (!spendEnergy(15)) return;
            if (Math.random() < 0.65) {
              state.maneuver = { active: true, daysRemaining: 3, petData: trialItem };
              state.zooshans.locationStatus = 'maneuver_adopters';
              const logMsg = isPair
                ? `День ${state.day}: ⏳ Ручки согласились потерпеть 3 дня! Подопечные временно у них. Срочно найдите новую передержку в соцсетях или оплатите платную.`
                : `День ${state.day}: ⏳ Ручки согласились потерпеть 3 дня! Подопечный временно у них. Срочно найдите новую передержку в соцсетях или оплатите платную.`;
              addLog(logMsg, 'success');
              closeEventModal();
            } else {
              state.zooshans.locationStatus = state.zooshans.hasCage ? 'home_cage' : 'home_floor';
              const logMsg = isPair
                ? `День ${state.day}: ❌ Ручки наотрез отказались ждать — малыши прямо сейчас возвращены к вам в квартиру!`
                : `День ${state.day}: ❌ Ручки наотрез отказались ждать — питомец прямо сейчас возвращен к вам в квартиру!`;
              addLog(logMsg, 'danger');
              closeEventModal();
            }
          }
        },
        {
          label: '⏳ Перевести 20 BYN на корм/пеленки + договориться на 3 дня (-15⚡, -20 BYN, 90% шанс)',
          style: 'info',
          action: () => {
            if (state.cash < 20) {
              addLog(`День ${state.day}: Не хватает 20 BYN на компенсацию ручкам!`, 'warn');
              return;
            }
            if (!spendEnergy(15)) return;
            state.cash = +(state.cash - 20).toFixed(1);
            state.personalMoneySpent = +(state.personalMoneySpent + 20).toFixed(1);
            if (Math.random() < 0.90) {
              state.maneuver = { active: true, daysRemaining: 3, petData: trialItem };
              state.zooshans.locationStatus = 'maneuver_adopters';
              const logMsg = isPair
                ? `День ${state.day}: ⏳ Компенсация 20 BYN помогла! Ручки согласились подержать малышей еще 3 дня. Ищите передержку!`
                : `День ${state.day}: ⏳ Компенсация 20 BYN помогла! Ручки согласились подержать питомца еще 3 дня. Ищите передержку!`;
              addLog(logMsg, 'success');
              closeEventModal();
            } else {
              state.zooshans.locationStatus = state.zooshans.hasCage ? 'home_cage' : 'home_floor';
              const logMsg = isPair
                ? `День ${state.day}: Ручки все равно отказались — малыши возвращены к вам в квартиру.`
                : `День ${state.day}: Ручки все равно отказались — питомец возвращен к вам в квартиру.`;
              addLog(logMsg, 'danger');
              closeEventModal();
            }
          }
        },
        {
          label: 'Забрать немедленно к себе домой (-15⚡)',
          style: 'danger',
          action: () => {
            if (!spendEnergy(15)) return;
            state.zooshans.locationStatus = state.zooshans.hasCage ? 'home_cage' : 'home_floor';
            const logMsg = isPair
              ? `День ${state.day}: Вы привезли малышей обратно к себе домой. Бытовой резерв энергии снова отнимает силы.`
              : `День ${state.day}: Вы привезли питомца обратно к себе домой. Бытовой резерв энергии снова отнимает силы.`;
            addLog(logMsg, 'info');
            closeEventModal();
          }
        }
      ]
    );
  }
}

function triggerTrialAsthmaReturnModal(trialItem) {
  stopTimer();
  if (typeof checkMentorTriggers === 'function') {
    checkMentorTriggers('ADOPTION_FAILED_POSTMORTEM');
  }
  state.cash = +(state.cash + 85).toFixed(1);
  state.supplies.daysLeft += 10;
  state.animal.trialCount = Math.max(0, state.animal.trialCount - trialItem.count);
  state.animal.activeCount += trialItem.count;
  if (trialItem.fosterSpotHeld) {
    state.zooshans.locationStatus = trialItem.fosterLocation || 'home_floor';
  } else {
    state.zooshans.locationStatus = state.zooshans.hasCage ? 'home_cage' : 'home_floor';
  }
  const isPair = (trialItem.count || 1) > 1;
  const desc = isPair
    ? `На 6-й день семья позвонила в слезах: у мужа началась острая бронхиальная астма (прислали заключение пульмонолога).\n\nПо договору об испытательном сроке они бережно привезли «${trialItem.petName}» обратно, передали мешок корма (+10 дней) и 85 BYN на передержку/клинику.\n\nЭто обычный рабочий момент зоозащиты — продолжаем поиск любящего дома!`
    : `На 6-й день семья позвонила в слезах: у мужа началась острая бронхиальная астма (прислали заключение пульмонолога).\n\nПо договору об испытательном сроке они бережно привезли «${trialItem.petName}» обратно, передали мешок корма (+10 дней) и 85 BYN на передержку/клинику.\n\nЭто обычный рабочий момент зоозащиты — продолжаем поиск любящего дома!`;
  showEventModal(
    'ЧЕСТНЫЙ ВОЗВРАТ С ИСПЫТАТЕЛЬНОГО СРОКА (АСТМА)',
    desc,
    [
      {
        label: 'Поблагодарить за честность и продолжить пиар',
        style: 'primary',
        action: () => closeEventModal()
      }
    ]
  );
}

function triggerChameleonReturnModal(trialItem) {
  if (typeof stopTimer === 'function') {
    stopTimer();
  }
  if (typeof checkMentorTriggers === 'function') {
    checkMentorTriggers('ADOPTION_FAILED_POSTMORTEM');
  }

  const evt = (trialItem && trialItem.returnEvent) ? trialItem.returnEvent : {};
  const title = evt.title || '🚨 ЭКСТРЕННЫЙ ВОЗВРАТ С ИСПЫТАТЕЛЬНОГО СРОКА';
  const desc = evt.description || `Подопечный «${trialItem?.petName || 'хвостик'}» срочно возвращен куратору из-за нарушений условий содержания и скрытых рисков безопасности!`;

  if (typeof addLog === 'function') {
    addLog(`День ${state?.day || 1}: ⚠️ Урок куратора: проверка сеток-антикошек по фото — обязательное правило безопасности, защищающее от экстренных возвратов и падений!`, 'warn');
  }

  const singleWord = trialItem?.species === 'dog' ? 'собаку' : 'кота';
  const choices = [
    {
      label: `Забрать ${singleWord} и начать всё заново`,
      style: 'danger',
      action: () => {
        if (typeof closeEventModal === 'function') {
          closeEventModal();
        }
        if (typeof renderAll === 'function') {
          renderAll();
        }
      }
    }
  ];

  showEventModal(title, desc, choices);
}

function triggerPiroplasmosisCrisisModal() {
  stopTimer();
  state.mental = Math.max(0, state.mental - 25);
  state.animal.health -= 35;
  showEventModal(
    '🚨 ЭКСТРЕННАЯ СИТУАЦИЯ: Пироплазмоз у собаки от укуса клеща!',
    `На прогулке в парке собаку укусил иксодовый клещ (обработка не была сделана вовремя!).\n\nСимптомы развились стремительно: темная бурая моча, отказ от еды, тяжелое дыхание и температура 40.5°C. Без экстренной капельницы и препарата «Пиро-стоп» собака погибнет за 48 часов!`,
    [
      {
        label: 'Экстренно в ветклинику: капельницы и Пиро-стоп (-80 BYN)',
        style: 'primary',
        action: () => {
          if (!payVetBill(80, true, 'Экстренная терапия пироплазмоза (Пиро-стоп + инфузия)', false)) return;
          state.animal.health = Math.min(100, state.animal.health + 30);
          state.animal.tickProtectionDaysLeft = 30;
          addLog(`День ${state.day}: 💉 Собаку спасли от пироплазмоза! Введены антидот и капельницы, сделана защита от клещей на 30 дней.`, 'success');
          closeEventModal();
          renderAll();
        }
      }
    ]
  );
}

function triggerPetNamingModal() {
  if (state.gameOver) return;
  stopTimer();
  const a = state.animal;
  const isLitter = (a.count > 1 || a.initialCount > 1);
  const defName = a.petName || (isLitter ? 'Без клички' : getRandomPetname(a.gender));
  const animModal = document.getElementById('animalModal');
  const isModalOpen = animModal && !animModal.classList.contains('hidden');

  if (isModalOpen) {
    const custom = prompt(isLitter
      ? `Введите общее имя для выводка из ${a.activeCount || a.count} малышей (или оставьте пустым):`
      : 'Введите имя подопечного (например, «Барсик» — по правилам картотеки Зоошанса будет добавлен район Минска):',
      a.petName || ''
    );
    if (custom && custom.trim()) {
      actionSetPetName(custom);
    }
    return;
  }

  const currentNameText = a.petName
    ? `Текущая кличка: «${a.petName}»`
    : (isLitter ? `Выводок из ${a.activeCount || a.count} малышей (без индивидуальной клички)` : 'Пока без клички');

  const promptIntro = isLitter
    ? `У вас на руках выводок из ${a.activeCount || a.count} малышей. Малышам индивидуальные клички дают будущие хозяева при усыновлении. Но вы можете дать общее имя всему выводку (например, «Малыши Рокоссовские»):\n\n${currentNameText}`
    : `По традиции «Зоошанса», кличка подопечного должна быть уникальной, чтобы в ветклиниках не путали талоны и анализы. К обычному имени добавляется минский район или топоним находки (например, «Абрикос Рокоссовский», «Агата Ждановичская»).\n\n${currentNameText}\n\nВы можете изменить кличку или сгенерировать новую из реальной картотеки форума:`;

  showEventModal(
    'КАРТОТЕКА КЛИЧЕК «ЗООШАНСА» (forum.zooshans.by/app.php/petnames)',
    promptIntro,
    [
      {
        label: '✏️ Ввести свое имя (кличка + район Минска)',
        style: 'primary',
        action: () => {
          closeEventModal();
          const custom = prompt('Введите имя подопечного (например, «Барсик»):', a.petName || '');
          if (custom && custom.trim()) {
            actionSetPetName(custom);
          }
        }
      },
      {
        label: '🎲 Сгенерировать случайную из картотеки Зоошанса',
        style: 'info',
        action: () => {
          actionRollRandomPetName();
          closeEventModal();
        }
      },
      {
        label: a.petName ? `Оставить кличку «${a.petName}»` : (isLitter ? 'Оставить без клички (выводок)' : 'Оставить без клички'),
        style: 'info',
        action: () => {
          closeEventModal();
        }
      }
    ]
  );
}

function triggerSuppliesLowModal(isZero) {
  stopTimer();
  if (typeof switchMobileTab === 'function') {
    switchMobileTab('actions');
  }

  const a = state.animal || {};
  const g = typeof getAnimalGrammar === 'function' ? getAnimalGrammar(a) : { isDog: a.species === 'dog' };
  const isLitter = Boolean((a.count > 1) || (a.totalCount > 1));
  const cost = (g.isDog || isLitter) ? 120 : 65;
  const supplyName = g.isDog ? 'корм и пеленки' : (isLitter ? 'корм и наполнитель для выводка' : 'корм и наполнитель');

  const title = isZero
    ? '🚨 ЗАКОНЧИЛСЯ КОРМ И НАПОЛНИТЕЛЬ!'
    : '⚠️ ЗАКАНЧИВАЕТСЯ КОРМ И НАПОЛНИТЕЛЬ!';

  const bodyText = isZero
    ? `У подопечного полностью закончился запас корма и расходников (${supplyName})! Животное голодает (-8% жизни, -10% менталки каждый день). Срочно закупите рацион на 14 дней!`
    : `У подопечного остался запас корма и расходников (${supplyName}) менее чем на 1 день! Если запасы не пополнить, завтра начнется вынужденное голодание и стресс.`;

  showEventModal(
    title,
    bodyText,
    [
      {
        label: `Купить корм и наполнитель на 14 дней (-${cost} BYN)`,
        style: 'primary',
        action: () => {
          if (state.cash < cost) {
            addLog(`День ${state.day}: ❌ Не хватает средств на покупку корма на 14 дней (${cost} BYN)! Пополните баланс через сборы или выберите другой вариант.`, 'danger');
            closeEventModal();
            return;
          }
          state.cash = +(state.cash - cost).toFixed(1);
          state.personalMoneySpent = +(state.personalMoneySpent + cost).toFixed(1);
          state.supplies.daysLeft = (state.supplies.daysLeft || 0) + 14;
          addLog(`День ${state.day}: 🛒 Вы экстренно закупили ${supplyName} на 14 дней (-${cost} BYN).`, 'success');
          closeEventModal();
        }
      },
      {
        label: 'Перейти в зоомагазин (Быт и Пиар)',
        style: 'info',
        action: () => {
          if (typeof switchTab === 'function') {
            switchTab('care');
          }
          closeEventModal();
        }
      },
      {
        label: 'Отложить (куплю позже)',
        style: 'secondary',
        action: () => {
          closeEventModal();
        }
      }
    ]
  );
}
window.triggerSuppliesLowModal = triggerSuppliesLowModal;

function triggerFormulaLowModal(isZero) {
  stopTimer();
  if (typeof switchMobileTab === 'function') {
    switchMobileTab('actions');
  }

  const cost = 105;
  const title = isZero
    ? '🚨 ЗАКОНЧИЛАСЬ СМЕСЬ ДЛЯ СЛЕПЫШЕЙ!'
    : '🍼 ЗАКАНЧИВАЕТСЯ СМЕСЬ ДЛЯ СЛЕПЫШЕЙ!';

  const bodyText = isZero
    ? 'У передержки полностью закончилась специализированная смесь для выкорма слепышей! Без смеси новорожденные котята голодают (-25% жизни каждый день). Срочно закупите банку Royal Canin Babycat Milk (105 BYN)!'
    : 'У передержки со слепышами осталось специализированной смеси менее чем на 1 день! Чтобы малыши не голодали, необходимо заблаговременно закупить новую банку Royal Canin Babycat Milk (105 BYN).';

  showEventModal(
    title,
    bodyText,
    [
      {
        label: `Купить смесь Royal Canin Babycat Milk на 14 дней (-${cost} BYN)`,
        style: 'primary',
        action: () => {
          if (state.cash < cost) {
            addLog(`День ${state.day}: ❌ Не хватает средств на покупку смеси Royal Canin Babycat Milk (${cost} BYN)!`, 'danger');
            closeEventModal();
            return;
          }
          state.cash = +(state.cash - cost).toFixed(1);
          state.personalMoneySpent = +(state.personalMoneySpent + cost).toFixed(1);
          state.newborn.milkDaysLeft = (state.newborn.milkDaysLeft || 0) + 14;
          state.newborn.knowsAboutFormula = true;
          addLog(`День ${state.day}: 🍼 Вы экстренно закупили банку специализированной смеси Royal Canin Babycat Milk (-${cost} BYN, +14 дней рациона).`, 'success');
          closeEventModal();
        }
      },
      {
        label: 'Перейти в зоомагазин (Быт и Пиар)',
        style: 'info',
        action: () => {
          if (typeof switchTab === 'function') {
            switchTab('care');
          }
          closeEventModal();
        }
      },
      {
        label: 'Отложить (куплю позже)',
        style: 'secondary',
        action: () => {
          closeEventModal();
        }
      }
    ]
  );
}
window.triggerFormulaLowModal = triggerFormulaLowModal;

// --- КРИЗИСЫ СЕРЕДИНЫ ИГРЫ (ДНИ 5–20) И ДИЛЕММЫ «РЕАЛЬНОЙ ПРАКТИКИ» (GDD v2.3) ---

const MIDGAME_CRISES = [
  {
    id: 'crisis_incubation_ringworm',
    dayMin: 6,
    dayMax: 10,
    title: '🔦 Сюрприз инкубационного периода',
    description: 'Инкубационный период (1–2 недели) подошел к концу: при вечернем осмотре под ультрафиолетовой лампой Вуда на ушах и мордочке котенка обнаружено изумрудное свечение спор микроспории (лишая)! Чтобы грибок не распространился по всей шерсти и споры не заселили квартиру, требуется немедленное решение по протоколу лечения.',
    condition: (st) => {
      const a = st?.animal;
      if (!a) return false;
      const isCat = !a.species || a.species === 'cat';
      const isStable = !a.fipTreatment && !a.traumaOperated && (!a.hiddenState || !a.hiddenState.hasSevereTrauma) && !a.knownRingworm;
      return isCat && isStable;
    },
    choiceA: {
      label: 'Начать схему лечения (Итраконазол + мази + дезинфекция) (-45 BYN, -25⚡, -15🧠)',
      style: 'primary',
      action: (st) => {
        const a = st.animal;
        st.cash = Math.max(0, +(st.cash - 45).toFixed(1));
        st.personalMoneySpent = +(st.personalMoneySpent + 45).toFixed(1);
        st.energy = Math.max(0, st.energy - 25);
        st.mental = Math.max(0, st.mental - 15);
        if (a) {
          a.health = Math.max(0, a.health - 5);
          a.vaccinationDelayDays = (a.vaccinationDelayDays || 0) + 14;
          a.vaccineDelayDays = (a.vaccineDelayDays || 0) + 14;
        }
        if (st.pr) {
          st.pr.feedProgress = 0;
          st.pr.views = 0;
        }
        if (typeof addLog === 'function') {
          addLog(`День ${st.day}: 🔦 Начата системная терапия микроспории: капсулы Итраконазола, мази и дезинфекция (-45 BYN, -25⚡, -15🧠, вакцинация отложена на 14 дн.).`, 'info');
        }
      }
    },
    choiceB: {
      label: 'Мазать только местно (Экономия) (-10 BYN, -10⚡, -5🧠)',
      style: 'danger',
      action: (st) => {
        const a = st.animal;
        st.cash = Math.max(0, +(st.cash - 10).toFixed(1));
        st.personalMoneySpent = +(st.personalMoneySpent + 10).toFixed(1);
        st.energy = Math.max(0, st.energy - 10);
        st.mental = Math.max(0, st.mental - 5);
        if (a) {
          a.health = Math.max(0, a.health - 15);
          a.vaccinationDelayDays = (a.vaccinationDelayDays || 0) + 21;
          a.vaccineDelayDays = (a.vaccineDelayDays || 0) + 21;
        }
        if (!Array.isArray(st.pendingMentalEvents)) st.pendingMentalEvents = [];
        st.pendingMentalEvents.push({ day: st.day + 4, amount: -20, label: 'Осложнение лишая' });
        if (typeof addLog === 'function') {
          addLog(`День ${st.day}: ⚠️ Местная обработка не сдержала генерализацию спор: поражение кожи усилилось (-10 BYN, -10⚡, -5🧠, здоровье -15%, вакцинация отложена на 21 дн., через 4 дня грозит спад менталки).`, 'warn');
        }
      }
    }
  },
  {
    id: 'crisis_adaptation_rebellion',
    dayMin: 8,
    dayMax: 14,
    title: '🌙 Ночной тыгыдык и бойкот лотка',
    description: 'После недели на новом месте подопечный освоился и начал устанавливать свои порядки: ночные забеги по шторам, громкие серенады в 4 утра и категорический бойкот лотка — лужи на коврике в коридоре! Волонтерский опыт подсказывает: животное либо стрессует от древесного наполнителя, либо требует обогащения среды и внимания.',
    condition: (st) => {
      const loc = st?.zooshans?.locationStatus || '';
      return loc === 'home_floor' || loc.includes('foster');
    },
    choiceA: {
      label: 'Подобрать комкующийся наполнитель, поставить 2-й лоток и купить игрушки (-40 BYN, -30⚡, +5🧠)',
      style: 'primary',
      action: (st) => {
        st.cash = Math.max(0, +(st.cash - 40).toFixed(1));
        st.personalMoneySpent = +(st.personalMoneySpent + 40).toFixed(1);
        st.energy = Math.max(0, st.energy - 30);
        st.mental = Math.min(100, st.mental + 5);
        if (typeof addLog === 'function') {
          addLog(`День ${st.day}: 🌙 Проблема решена грамотно: подобран мягкий комкующийся наполнитель, добавлен второй лоток и игрушки (-40 BYN, -30⚡, +5🧠). Подопечный спокоен!`, 'success');
        }
      }
    },
    choiceB: {
      label: 'Терпеть и убирать лужи с хлоркой (0 BYN, -15⚡, -25🧠)',
      style: 'danger',
      action: (st) => {
        st.energy = Math.max(0, st.energy - 15);
        st.mental = Math.max(0, st.mental - 25);
        if (!Array.isArray(st.dailyMentalDrains)) st.dailyMentalDrains = [];
        st.dailyMentalDrains.push({ id: 'chlorine_drain', amount: 8, daysRemaining: 4, label: 'Бойкот лотка' });
        if (typeof addLog === 'function') {
          addLog(`День ${st.day}: 🧴 Уборка хлоркой только усилила запах меток: питомец протестует (-15⚡, -25🧠, -8🧠/день в течение 4 дней).`, 'danger');
        }
      }
    }
  },
  {
    id: 'crisis_foster_ultimatum',
    dayMin: 10,
    dayMax: 18,
    title: '⚡ Ультиматум: «Забирайте до завтра!»',
    description: 'Звонок в панике: на передержке (или хозяин съемной квартиры) обнаружил содранные обои и затяжки на любимом тюле. Звучит жесткий ультиматум: «У вас ровно 24 часа, чтобы всё исправить или забрать животное на улицу!» Действовать нужно решительно.',
    condition: (st) => {
      const loc = st?.zooshans?.locationStatus || '';
      const housingId = st?.player?.housing?.id || '';
      return loc.includes('foster') || housingId.includes('rent');
    },
    choiceA: {
      label: 'Компенсировать тюль и привезти большую складную клетку (-65 BYN, -20⚡, -10🧠)',
      style: 'primary',
      action: (st) => {
        st.cash = Math.max(0, +(st.cash - 65).toFixed(1));
        st.personalMoneySpent = +(st.personalMoneySpent + 65).toFixed(1);
        st.energy = Math.max(0, st.energy - 20);
        st.mental = Math.max(0, st.mental - 10);
        if (typeof addLog === 'function') {
          addLog(`День ${st.day}: ⚡ Конфликт урегулирован: куплен новый тюль и привезена надежная волонтерская клетка для изоляции во время отсутствия людей (-65 BYN, -20⚡, -10🧠). Передержка спасена!`, 'success');
        }
      }
    },
    choiceB: {
      label: 'Экстренно забрать к себе «в ванную / на балкон» (0 BYN, -35⚡, -20🧠)',
      style: 'danger',
      action: (st) => {
        st.energy = Math.max(0, st.energy - 35);
        st.mental = Math.max(0, st.mental - 20);
        st.householdEnergyLock = Math.max(st.householdEnergyLock || 0, 15);
        if (st.zooshans && st.zooshans.locationStatus && st.zooshans.locationStatus.includes('foster')) {
          st.zooshans.locationStatus = st.zooshans.hasCage ? 'home_cage' : 'home_floor';
        }
        if (typeof addLog === 'function') {
          addLog(`День ${st.day}: 📦 Животное экстренно эвакуировано в вашу ванную комнату (-35⚡, -20🧠). Бытовой замок энергии заблокировал 15⚡/день!`, 'warn');
        }
      }
    }
  },
  {
    id: 'crisis_zooshans_chat_sos',
    dayMin: 12,
    dayMax: 16,
    title: '🆘 СОС в чате @zooshans_chat',
    description: 'В волонтерском чате @zooshans_chat вспыхивает экстренное сообщение: в районе Каменной Горки под проливным дождем у магазина сидит промокший месячный котенок, его гоняют вороны. Никто из кураторов не может выехать. Либо кто-то перехватит его на 4 дня до освобождения места у постоянного волонтера, либо малыш не переживет ночь.',
    condition: (st) => true,
    choiceA: {
      label: 'Перехватить в отдельную комнату/ванную на 4 дня (Карантин) (-25 BYN, -25⚡)',
      style: 'primary',
      action: (st) => {
        st.cash = Math.max(0, +(st.cash - 25).toFixed(1));
        st.personalMoneySpent = +(st.personalMoneySpent + 25).toFixed(1);
        st.energy = Math.max(0, st.energy - 25);
        if (!Array.isArray(st.tempEnergyLocks)) st.tempEnergyLocks = [];
        st.tempEnergyLocks.push({ id: 'sos_kitten_lock', amount: 15, daysRemaining: 4, label: 'Перехват котенка из чата' });
        if (!Array.isArray(st.pendingMentalEvents)) st.pendingMentalEvents = [];
        st.pendingMentalEvents.push({ day: st.day + 4, amount: 25, label: 'Спасенный котенок из чата уехал на передержку' });
        if (typeof addLog === 'function') {
          addLog(`День ${st.day}: 🆘 Вы спасли малыша из-под дождя и изолировали в ванной (-25 BYN, -25⚡, -15⚡ резерва на 4 дня). Через 4 дня он уедет к волонтеру (+25🧠)!`, 'success');
        }
      }
    },
    choiceB: {
      label: 'Пройти мимо и сделать репост (Ресурсов впритык) (0 BYN, -5⚡, -18🧠)',
      style: 'secondary',
      action: (st) => {
        st.energy = Math.max(0, st.energy - 5);
        st.mental = Math.max(0, st.mental - 18);
        if (typeof addLog === 'function') {
          addLog(`День ${st.day}: 😔 Вы сделали репост, но осадок вины волонтера давит камнем на душу (-5⚡, -18% Менталки). Берегите собственные силы!`, 'warn');
        }
      }
    }
  }
];

function triggerMidgameCrisisModal(crisis) {
  if (!crisis) return;
  if (typeof crisis === 'string') {
    const list = (typeof window !== 'undefined' && window.MIDGAME_CRISES) ? window.MIDGAME_CRISES : MIDGAME_CRISES;
    crisis = list.find(c => c.id === crisis);
    if (!crisis) return;
  }

  stopTimer();
  if (typeof switchMobileTab === 'function') {
    switchMobileTab('actions');
  }

  if (state && state.triggeredEvents) {
    state.triggeredEvents[crisis.id] = true;
  }

  const choices = [
    {
      label: crisis.choiceA.label,
      style: crisis.choiceA.style || 'primary',
      action: () => {
        if (typeof crisis.choiceA.action === 'function') {
          crisis.choiceA.action(state);
        }
        if (typeof closeEventModal === 'function') {
          closeEventModal();
        }
        if (typeof renderAll === 'function') {
          renderAll();
        }
      }
    },
    {
      label: crisis.choiceB.label,
      style: crisis.choiceB.style || 'danger',
      action: () => {
        if (typeof crisis.choiceB.action === 'function') {
          crisis.choiceB.action(state);
        }
        if (typeof closeEventModal === 'function') {
          closeEventModal();
        }
        if (typeof renderAll === 'function') {
          renderAll();
        }
      }
    }
  ];

  showEventModal(crisis.title, crisis.description, choices);
}

if (typeof window !== 'undefined') {
  window.MIDGAME_CRISES = MIDGAME_CRISES;
  window.triggerMidgameCrisisModal = triggerMidgameCrisisModal;
  window.triggerChameleonReturnModal = triggerChameleonReturnModal;
}
if (typeof global !== 'undefined') {
  global.MIDGAME_CRISES = MIDGAME_CRISES;
  global.triggerMidgameCrisisModal = triggerMidgameCrisisModal;
  global.triggerChameleonReturnModal = triggerChameleonReturnModal;
}

