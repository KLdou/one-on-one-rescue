// actions.js - Действия игрока: клиника, онбординг, зоошанс, передержки, пиар (v2.0)

// 1. ОНБОРДИНГ НОВИЧКА: Базовые действия обывателя на 1-й день (GDD 2.2)

function actionGoogleSearch() {
  if (!spendEnergy(5)) return;
  state.onboarding.googleDone = true;
  addLog(`День ${state.day}: 🔍 Вы загуглили «Нашел животное в Минске, что делать?» и открыли памятку МБООПЖ «Зоошанс».`, 'success');
  addLog(`День ${state.day}: 💡 Вы узнали правду: государственных приютов в Беларуси нет! Все волонтеры — такие же обычные люди с семьями и работой. Разблокированы вкладки «Колл-центр Зоошанса» и «Пиар»!`, 'info');

  showEventModal(
    'ПАМЯТКА МБООПЖ «ЗООШАНС»: «ВЫ НАШЛИ ЖИВОТНОЕ»',
    `Поиск привел вас на официальный сайт МБООПЖ «Зоошанс» (zooshans.by). Вы открыли для себя суровую реальность минской зоозащиты:\n\n1. Приютов, куда можно «сдать» животное, в Беларуси не существует.\n2. Волонтеры — не государственная служба, у них нет зарплат и финансирования. Это обычные люди, у которых дома уже сидит от 5 до 15 спасенных животных.\n3. Организация не забирает животных «на баланс», но помогает кураторам: выдает клетки со склада, смеси для слепышей, дает скидки 20% по талонам в клиники, помогает в поиске доноров и пиаре.\n\nВам открыт доступ к вкладкам «2. Помощь Зоошанса и Сборы» и «3. Быт, Передержка и Пиар», а также справочный бот @zooshans_info_bot и чат @zooshans_chat!`,
    [
      {
        label: 'Принять ответственность: я стану куратором этого животного!',
        style: 'primary',
        action: () => closeEventModal()
      }
    ]
  );
  renderAll();
}

function actionCallGurskogo() {
  if (!spendEnergy(5)) return;
  state.onboarding.gurskogoCalled = true;
  showEventModal(
    'ЗВОНОК НА УЛ. ГУРСКОГО, 42 («Фауна города»)',
    `Вы набрали номер предприятия на ул. Гурского, 42 в надежде, что это государственный приют.\n\nХолодный голос диспетчера объясняет:\n«Женщина/мужчина, у нас НЕ приют! Мы государственное предприятие отлова и временного содержания. Животные сидят в бетонных боксах, бушуют инфекции, никакого лечения у нас нет. По закону срок содержания короткий — невостребованных животных подвергают эвтаназии (усыпляют). Привозить будете?»`,
    [
      {
        label: 'Категорически отказаться! Я не отдам животное на смерть',
        style: 'primary',
        action: () => {
          state.mental = Math.min(100, state.mental + 5);
          addLog(`День ${state.day}: 🏛 Вы узнали правду о Гурского, 42 и отказались отдавать подопечного на усыпление (+5% Менталки за твердость духа)!`, 'success');
          closeEventModal();
        }
      },
      {
        label: 'Все равно отвезти на Гурского, 42 («Сделка с совестью»)',
        style: 'danger',
        action: () => {
          state.fatalMistakeReason = 'gurskogo_trap';
          triggerEndGame(
            false,
            'ПОРАЖЕНИЕ: Сделка с совестью (Гурского, 42)',
            'Вы сдали животное на Гурского, 42, надеясь переложить заботу на чужие плечи. Через несколько дней непривитый найденыш погиб от вспышки инфекции в переполненном боксе.\n\nВ Беларуси нет государственных приютов — пункт на ул. Гурского, 42 является предприятием отлова. Спасти жизнь можно только личным участием куратора!'
          );
        }
      }
    ]
  );
}

function actionDumpBoxTrap() {
  state.fatalMistakeReason = 'dumped_box_trap';
  triggerEndGame(
    false,
    'ПОРАЖЕНИЕ: Ловушка малодушия',
    'Вы оставили коробку под дверями ветклиники и убежали. Врачи — медицинский персонал, у них нет жилых помещений, вольеров и бюджета на содержание уличных животных.\n\nПодброшенная коробка на холодном крыльце инфицировалась вирусами от входящих пациентов или была выставлена персоналом обратно на улицу.\n\nСпасение чужими руками не работает: у каждого спасенного хвостика должен быть конкретный человек-куратор!'
  );
}

// 2. ВЕТЕРИНАРНЫЕ РАСЧЕТЫ И ЛОГИСТИКА В BYN (GDD 3.5, 5.1)

function canAffordVetBill(baseCostBYN, voucherEligible, isExpensiveProcedure = false) {
  if (state.gameOver) return false;
  const hasDiscount = state.zooshans.applicationSubmitted && voucherEligible;
  const discounted = hasDiscount ? Math.round(baseCostBYN * 0.8) : baseCostBYN;

  if (hasDiscount) {
    if (state.zooshans.clinicMode === 'partner_cash' && !isExpensiveProcedure) {
      return state.cash >= discounted;
    }
    if (state.zooshans.clinicMode === 'major_voucher' || isExpensiveProcedure) {
      return !state.zooshans.voucherBlocked && (state.zooshans.voucherDebt + discounted <= 1000);
    }
  }
  return state.cash >= baseCostBYN;
}

function payVetBill(baseCostBYN, voucherEligible, serviceTitle, isExpensiveProcedure = false, energyCost = 0) {
  if (state.gameOver) return false;

  // 1. Проверка энергии
  if (energyCost > 0 && state.energy < energyCost) {
    addLog(`День ${state.day}: ❌ Недостаточно энергии для визита в клинику (требуется ${energyCost}⚡, осталось ${state.energy}⚡)!`, 'warn');
    return false;
  }

  const hasDiscount = state.zooshans.applicationSubmitted && voucherEligible;
  const discounted = hasDiscount ? Math.round(baseCostBYN * 0.8) : baseCostBYN;

  // 2. Проверка платежеспособности ДО списаний
  if (hasDiscount) {
    if (state.zooshans.clinicMode === 'partner_cash' && !isExpensiveProcedure) {
      if (state.cash < discounted) {
        addLog(`День ${state.day}: ❌ Не хватает средств на оплату процедуры (${state.cash} BYN из требуемых ${discounted} BYN со скидкой 20%)! Переключитесь на Ветцентр Б (талон в долг) или откройте сбор на карту.`, 'danger');
        return false;
      }
    } else if (state.zooshans.clinicMode === 'major_voucher' || isExpensiveProcedure) {
      if (state.zooshans.voucherBlocked || (state.zooshans.voucherDebt + discounted > 1000)) {
        addLog(`День ${state.day}: ⚠️ Превышен лимит долга 1000 BYN перед «Зоошансом» (доступно ${Math.max(0, 1000 - state.zooshans.voucherDebt)} BYN из ${discounted} BYN) или талоны заблокированы!`, 'warn');
        return false;
      }
    }
  } else {
    if (state.cash < baseCostBYN) {
      addLog(`День ${state.day}: ❌ Не хватает средств на оплату процедуры (${state.cash} BYN из требуемых ${baseCostBYN} BYN)! Откройте сбор на карту во вкладке «Зоошанс».`, 'danger');
      return false;
    }
  }

  // 3. Списание энергии только после успешной верификации платежа
  if (energyCost > 0) {
    if (!spendEnergy(energyCost)) return false;
  }

  // 4. Логистика: Без авто — 35% шанс отказа таксиста и поиск попутки в чатах (GDD 3.5)
  if (state.player.mobility.id === 'no_car' && isAnimalAtPlayerHome() && Math.random() < 0.35 && !state.triggeredEvents['taxi_' + state.day]) {
    state.triggeredEvents['taxi_' + state.day] = true;
    if (Math.random() < 0.5) {
      addLog(`День ${state.day}: 🚗 Таксист отказался сажать с переноской/клеткой! Вы кинули клич в районный чат — выручил сосед и подвез бесплатно!`, 'info');
    } else {
      const taxiFee = Math.min(state.cash, 20);
      state.cash = Math.max(0, +(state.cash - taxiFee).toFixed(1));
      state.personalMoneySpent = +(state.personalMoneySpent + taxiFee).toFixed(1);
      state.mental = Math.max(0, state.mental - 8);
      addLog(`День ${state.day}: 🚌 Знакомые заняты, таксист отказал — пришлось трястись в переполненном троллейбусе и доплачивать зоотакси (-${taxiFee} BYN, -8% Менталки).`, 'warn');
    }
  }

  // 5. Проведение оплаты
  if (hasDiscount) {
    if (state.zooshans.clinicMode === 'partner_cash' && !isExpensiveProcedure) {
      state.cash = +(state.cash - discounted).toFixed(1);
      state.personalMoneySpent = +(state.personalMoneySpent + discounted).toFixed(1);
      addLog(`День ${state.day}: 🏥 ${serviceTitle} — партнерская клиника А подтвердила скидку 20%. Оплачено на месте сразу -${discounted} BYN (без накопления долга).`, 'success');
      return true;
    }

    if (state.zooshans.clinicMode === 'major_voucher' || isExpensiveProcedure) {
      state.zooshans.voucherDebt = +(state.zooshans.voucherDebt + discounted).toFixed(1);
      addLog(`День ${state.day}: 🎫 ${serviceTitle} — выписан гарантийный талон ветцентра (-20%, +${discounted} BYN в долг на 30 дней. Общий долг: ${state.zooshans.voucherDebt}/1000 BYN).`, 'info');
      return true;
    }
  }

  // Оплата по полному прайсу (без скидки)
  state.cash = +(state.cash - baseCostBYN).toFixed(1);
  state.personalMoneySpent = +(state.personalMoneySpent + baseCostBYN).toFixed(1);
  addLog(`День ${state.day}: 🏥 ${serviceTitle} — оплачено по полному прайсу (-${baseCostBYN} BYN). Подайте заявление в «Зоошанс» для скидки 20%!`, 'info');
  return true;
}

// 3. КОЛЛ-ЦЕНТР «ЗООШАНСА»: Заявление, клетка со склада, стартовая смесь (GDD 5.1, 7.1)

function actionAskZooshansTakeover() {
  if (!spendEnergy(10)) return;
  const g = getAnimalGrammar(state.animal);
  state.zooshans.askedToTakeAnimal = true;
  state.zooshans.applicationSubmitted = true;
  state.zooshans.hasCage = true;

  let milkBonusText = '';
  if (state.newborn.active && !state.newborn.receivedFreeStarterPacket) {
    state.newborn.knowsAboutFormula = true;
    state.newborn.receivedFreeStarterPacket = true;
    state.newborn.milkDaysLeft += 3;
    milkBonusText = '\n\n🍼 ПОМОЩЬ СЛЕПЫШАМ: Волонтеры объяснили, что коровье молоко смертельно для котят! Вам бесплатно выдали 1 стартовый пакетик смеси Royal Canin Babycat Milk (100 г) и соску на первые 3 дня!';
  }

  // 35% шанс бонуса корма от волонтеров (GDD 6.2)
  if (Math.random() < 0.35) {
    state.supplies.daysLeft += 6;
    milkBonusText += '\n\n🎁 ПОДГОН ОТ ВОЛОНТЕРОВ: Сердобольные волонтеры из своих запасов передали пакет корма и наполнителя на 6 дней («Держите на первое время, сами через это проходили!»)';
  }

  const roll = Math.random();
  const tempChance = state.zooshans.tempVolunteerChance || 0.20;

  if (roll < (1.0 - tempChance - 0.05)) {
    // 75% (или меньше при предохранителе) — мест нет, но дают клетку, талон и смесь
    if (state.zooshans.locationStatus === 'home_floor') {
      state.zooshans.locationStatus = 'home_cage';
    }
    showEventModal(
      'КОЛЛ-ЦЕНТР «ЗООШАНСА»: Заявление принято, выдана клетка и открыты талоны!',
      `Вы зарегистрировали заявление на ${g.acc} у координатора. Приютов у организации нет — у всех волонтеров дома уже живут от 5 до 15 животных.\n\nЗабрать некуда, НО заявление принято: вам бесплатно выдали чистую карантинную клетку со склада (под обязательный возврат после дезинфекции!) и открыли талоны со скидкой 20% в клиники-партнеры (лимит долга до 1000 BYN)!` + milkBonusText,
      [
        {
          label: 'Принять помощь (Заявление зарегистрировано, Клетка получена)',
          style: 'primary',
          action: () => {
            addLog(`День ${state.day}: 📝 Заявление в «Зоошанс» зарегистрировано! Получена клетка со склада, открыты направления клиник (-20%).`, 'success');
            closeEventModal();
          }
        }
      ]
    );
  } else if (roll < 0.95) {
    // 20% (или 60% при предохранителе баланса) — перехват на 14 дней карантина и стабилизации
    state.zooshans.locationStatus = 'temp_volunteer_14d';
    state.zooshans.tempVolunteerDaysLeft = 14;
    showEventModal(
      'ВРЕМЕННЫЙ ПЕРЕХВАТ НА 14 ДНЕЙ: Опытный волонтер берет на карантин и стабилизацию!',
      `Координатор Колл-центра нашла окно: опытная волонтер Таня согласилась выручить вас на первые 14 дней (стандартный срок карантина):\n\n«Я заберу ${g.acc} к себе на 14 дней: выдержу карантин, сниму острое состояние, выкормлю и сделаю уколы. Но ты отвечаешь за покупку корма/смеси и через 14 дней ОБЯЗАН(А) забрать ${g.acc} обратно до пристройства!»` + milkBonusText,
      [
        {
          label: `Передать ${g.acc} на 14 дней (Быт и карантин сняты с вас, следите за расходниками!)`,
          style: 'primary',
          action: () => {
            addLog(`День ${state.day}: ⏳ Волонтер забрала ${g.acc} на 14 дней карантина и стабилизации с возвратом! Ежедневный быт полностью снят с вас.`, 'success');
            closeEventModal();
          }
        }
      ]
    );
  } else {
    // 5% — редкое чудо: волонтер забирает до пристройства под финкураторство
    state.zooshans.locationStatus = 'full_volunteer_fincuration';
    showEventModal(
      'РЕДКОЕ ЧУДО (5%): Волонтер забрал питомца под ваше полное финкураторство!',
      `Невероятная удача: у волонтера освободилось место, и ${g.acc} забрали на постоянную передержку до пристройства!\n\nВесь ежедневный быт снят с вас, но вы обязаны бесперебойно оплачивать корм, расходники и лечение по талонам.` + milkBonusText,
      [
        {
          label: 'Стать финкуратором (Обеспечивать закупку расходников)',
          style: 'primary',
          action: () => {
            addLog(`День ${state.day}: 🎉 Волонтеры приютили ${g.acc} насовсем под ваше финансовое обеспечение и снабжение!`, 'success');
            closeEventModal();
          }
        }
      ]
    );
  }
  renderAll();
}

// 4. ПОИСК БЕСПЛАТНОЙ ПЕРЕДЕРЖКИ В СОЦСЕТЯХ (GDD 7.2)

function actionSearchSocialFosterPost() {
  if (!spendEnergy(15)) return;
  const g = getAnimalGrammar(state.animal);
  const roll = Math.random();

  // Летом сезон отпусков — шанс падает с 30% до 20% (GDD 2.2, 7.2)
  const fosterChance = state.currentSeason === 'summer' ? 0.20 : 0.30;
  if (roll > fosterChance) {
    addLog(`День ${state.day}: 📱 SOS-пост о передержке для ${g.gen} собрал 40 репостов и сочувствие, но взять к себе никто не решился${state.currentSeason === 'summer' ? ' (летом сезон отпусков — люди в разъездах)' : ''}. Опубликуйте повторно через пару дней!`, 'warn');
    renderAll();
    return;
  }

  if (Math.random() < 0.30) {
    // 30% — опытный волонтер
    state.zooshans.locationStatus = 'social_foster_volunteer';
    state.zooshans.hasCage = true;
    if (state.maneuver) state.maneuver.active = false;
    showEventModal(
      'ОТКЛИК В СОЦСЕТЯХ: Опытный волонтер берет на передержку!',
      `Ваш пост заметила опытная волонтер Катя:\n\n«Я возьму ${g.acc} в свою карантинную клетку! Быт, уборка и капли — на мне. Но вы остаетесь куратором: снабжаете кормом/наполнителем, оплачиваете клинику и ведете пиар!»`,
      [
        {
          label: `Передать ${g.acc} волонтеру (Быт снят с вас, следите за расходниками!)`,
          style: 'primary',
          action: () => {
            addLog(`День ${state.day}: 🤝 Со-кураторство с волонтером! Быт снят, но не забывайте вовремя пополнять запас корма!`, 'success');
            closeEventModal();
          }
        }
      ]
    );
  } else {
    // 70% — обычный человек из соцсетей (риск конфликта на 12-й день)
    state.zooshans.locationStatus = 'social_foster_novice';
    state.zooshans.socialFosterDaysElapsed = 0;
    if (state.maneuver) state.maneuver.active = false;
    showEventModal(
      'ОТКЛИК В СОЦСЕТЯХ: Подписчица согласна бесплатно приютить найденыша!',
      `На пост откликнулась девушка Алина — не волонтер, просто эмоциональный человек из соцсетей:\n\n«Мне так жалко ${g.acc}! Я возьму к себе бесплатно на время поиска дома. Только привозите корм, наполнитель и лоток!»`,
      [
        {
          label: `Передать ${g.acc} на бесплатную передержку (Следите за запасом расходников!)`,
          style: 'primary',
          action: () => {
            addLog(`День ${state.day}: 🏠 Подписчица приютила ${g.acc}! Быт снят с вас, но обеспечивайте передержку кормом.`, 'success');
            closeEventModal();
          }
        }
      ]
    );
  }
  renderAll();
}

// 5. БАРАХОЛКА ВЗАИМОПОМОЩИ В ЧАТЕ ВОЛОНТЕРОВ (GDD 6.2)

function actionBarakholkaVolunteerChat() {
  if (!spendEnergy(10)) return;
  const a = state.animal;
  const roll = Math.random();
  if (roll < 0.60) {
    if (a.species === 'dog' && !a.hasAntiEscapeHarness) {
      a.hasAntiEscapeHarness = true;
      state.mental = Math.min(100, state.mental + 8);
      addLog(`День ${state.day}: 💬 БАРАХОЛКА КУРАТОРОВ: Волонтеры в чате @zooshans_chat бесплатно отдали б/у анатомическую шлейку-антипобег с адресником (0 BYN)! Срыв на прогулке исключен.`, 'success');
    } else if (a.knownRingworm || a.dewormStage < 2 || !a.eyeDropsCompleted || a.hiddenState.hasChronicGI) {
      state.zooshans.hasGiftedDewormPill = true;
      state.zooshans.hasGiftedItraconazole = true;
      a.hasFreeEyeDrops = true;
      state.mental = Math.min(100, state.mental + 8);
      addLog(`День ${state.day}: 💬 БАРАХОЛКА КУРАТОРОВ: Другие волонтеры бесплатно передали остатки Итраконазола, Мильбемакса и глазных капель (0 BYN)! Целые пачки покупать не пришлось.`, 'success');
    } else {
      state.supplies.daysLeft += 6;
      state.mental = Math.min(100, state.mental + 6);
      addLog(`День ${state.day}: 💬 БАРАХОЛКА КУРАТОРОВ: Волонтеры выручили — передали полмешка корма и пеленки (+6 дней расходников бесплатно)!`, 'success');
    }
  } else {
    addLog(`День ${state.day}: 💬 БАРАХОЛКА: В чате волонтеров сейчас нет свободных остатков нужных препаратов — закупаем в обычной аптеке или зоомагазине.`, 'info');
  }

  // 35% шанс дополнительного подгона корма от кураторов (GDD 6.2)
  if (Math.random() < 0.35) {
    state.supplies.daysLeft += 6;
    addLog(`День ${state.day}: 🎁 ПОДГОН ОТ КУРАТОРОВ: Сердобольные волонтеры дополнительно передали пакет корма на 6 дней («Держите, сами через это проходили!»).`, 'success');
  }
  renderAll();
}

// 6. СТОРИТЕЛЛИНГ («МИМИМИ-ПОСТЫ», GDD 8.1)

function actionWriteStorytellingPost() {
  if (!spendEnergy(10)) return;
  state.pr.storytellingBoost = +(state.pr.storytellingBoost + 0.06).toFixed(2);
  state.pr.storytellingCallBonus = +(state.pr.storytellingCallBonus + 5);
  state.pr.lastStorytellingDay = state.day;
  addLog(`День ${state.day}: 📱 Живой мимими-пост опубликован! Пиар-охват гарантированно вырос (+0.06x к популярности, +5% к шансу звонка).`, 'info');

  const roll = Math.random();
  if (roll < 0.12) {
    // 12% шанс: подписчик влюбляется в сторис, переводит 85 BYN и бронирует
    state.cash = +(state.cash + 85).toFixed(1);
    state.pr.earlyBookedAdopterWaiting = true;
    state.mental = Math.min(100, state.mental + 15);
    addLog(`День ${state.day}: 💖 ЧУДО СТОРИТЕЛЛИНГА: Подписчица влюбилась в хвостика по вашим сторис! Она перевела 85 BYN помощи и забронировала питомца себе домой!`, 'success');
    renderAll();
    triggerEarlyBookedTransferModal();
    return;
  } else if (roll < 0.47) {
    // 35% шанс: вещественная «посылка добра»
    const gRoll = Math.random();
    if (gRoll < 0.4) {
      state.supplies.daysLeft += 14;
      document.getElementById('giftBannerText').textContent = 'Подписчица прислала посылку: большой мешок корма и наполнитель/пеленки (+14 дней бесплатных расходников!).';
    } else if (gRoll < 0.75) {
      state.zooshans.hasGiftedDewormPill = true;
      state.zooshans.hasGiftedItraconazole = true;
      document.getElementById('giftBannerText').textContent = 'В чате передали упаковку Мильбемакса и капсулы Итраконазола (0 BYN)!';
    } else {
      const cashGift = randomInt(35, 75);
      state.cash = +(state.cash + cashGift).toFixed(1);
      state.supplies.daysLeft += 6;
      document.getElementById('giftBannerText').textContent = `Подписчики заказали пачку расходников (+6 дн.) и пожертвовали ${cashGift} BYN!`;
    }
    state.zooshans.pendingGiftThankYou = true;
    addLog(`День ${state.day}: 🎁 ВЕЩЕСТВЕННАЯ ПОМОЩЬ: Получена посылка добра от неравнодушных подписчиков!`, 'success');
  } else {
    state.mental = Math.min(100, state.mental + 8);
    addLog(`День ${state.day}: 💬 Пост собрал десятки теплых комментариев и репостов со словами поддержки (+8% Менталки).`, 'success');
  }
  renderAll();
}

function thankForMaterialGift() {
  if (!spendEnergy(5)) return;
  state.zooshans.pendingGiftThankYou = false;
  state.zooshans.storytellingTrustBonus += 1;
  state.mental = Math.min(100, state.mental + 6);
  addLog(`День ${state.day}: 📸 Вы опубликовали фото-благодарность с подарком (+6% Менталки)! Доверие аудитории выросло.`, 'success');
  renderAll();
}

function payVoucherDebtWithOwnMoney() {
  if (state.zooshans.voucherDebt <= 0) return;
  if (state.cash < state.zooshans.voucherDebt) {
    addLog(`День ${state.day}: Не хватает личных средств (${state.cash} BYN), чтобы закрыть долг ${state.zooshans.voucherDebt} BYN! Гасите сбором на карту или копите с зарплаты.`, 'warn');
    return;
  }
  const paid = state.zooshans.voucherDebt;
  state.cash = +(state.cash - paid).toFixed(1);
  state.personalMoneySpent = +(state.personalMoneySpent + paid).toFixed(1);
  state.zooshans.voucherDebt = 0;
  state.zooshans.voucherBlocked = false;
  state.zooshans.voucherDaysLeft = 30;
  state.mental = Math.min(100, state.mental + 10);
  addLog(`День ${state.day}: 💰 Вы полностью закрыли долг по талону ${paid} BYN своими деньгами! Это избавило вас от сборов, чеков и отчетов в соцсетях.`, 'success');
  renderAll();
}

function actionTakeSelfPhotos() {
  if (!spendEnergy(5)) return;
  state.photos.hasSelfPhotos = true;
  addLog(`День ${state.day}: 📸 Вы сфотографировали питомца на телефон при хорошем дневном свете (+20% к звонкам)!`, 'success');
  renderAll();
}

function actionAskFriendsPhotos() {
  if (!spendEnergy(8)) return;
  state.photos.hasFriendsPhotos = true;
  addLog(`День ${state.day}: 📸 Друзья устроили домашнюю фотосессию с портретным объективом (+50% к звонкам)!`, 'success');
  renderAll();
}

// 7. ЭКСТРЕННЫЙ ПОИСК БЕГЛЕЦА (4 дня, GDD 7.3)

function escapeSearchAction(actionType) {
  if (state.gameOver || !state.escapeQuest || !state.escapeQuest.active) return;
  const a = state.animal;
  const isPuppy = a.species === 'dog' && (a.ageCategory === 'puppy' || a.ageDays < 180 || (a.count && a.count > 1));
  const isDog = a.species === 'dog';
  const g = getAnimalGrammar(a);

  if (actionType === 'posters') {
    if (!spendEnergy(15)) return;
    state.escapeQuest.searchProgress = Math.min(100, state.escapeQuest.searchProgress + 35);
    const audience = isDog ? 'дворников и собачников' : 'дворников и жителей окрестных домов';
    addLog(`День ${state.day}: 📋 Вы расклеили 50 макетов с цветным фото и опросили ${audience} (+35% к поиску, всего ${state.escapeQuest.searchProgress}%).`, 'info');
  } else if (actionType === 'night') {
    if (!spendEnergy(20)) return;
    state.escapeQuest.searchProgress = Math.min(100, state.escapeQuest.searchProgress + 45);
    state.mental = Math.max(0, state.mental - 5);
    const searchArea = isPuppy
      ? 'дворов, приямков и пространства под машинами'
      : (isDog ? 'дворов, гаражных кооперативов и теплотрасс' : 'подвалов и теплотрасс');
    addLog(`День ${state.day}: 🔦 Ночной и утренний прочес ${searchArea} в 4 утра с фонариком (+45% к поиску, всего ${state.escapeQuest.searchProgress}%).`, 'info');
  } else if (actionType === 'social') {
    if (!spendEnergy(10)) return;
    state.escapeQuest.searchProgress = Math.min(100, state.escapeQuest.searchProgress + 25);
    addLog(`День ${state.day}: 📢 Пост о пропаже распространен по районным чатам и каналам (+25% к поиску, всего ${state.escapeQuest.searchProgress}%).`, 'info');
  }

  if (state.escapeQuest.searchProgress >= 100) {
    state.escapeQuest.active = false;
    state.animal.hasAntiEscapeHarness = true;
    state.mental = Math.min(100, state.mental + 20);

    let foundDesc = '';
    if (isPuppy) {
      foundDesc = `Вы нашли испуганного щенка, забившегося под припаркованную машину в соседнем дворе! Малыш жив, согрет и накормлен.\n\nПередержка получила строжайший наказ всегда запирать вторую дверь в тамбуре и контролировать щенков.`;
    } else if (isDog) {
      foundDesc = `Вы нашли беглеца испуганным в гаражном кооперативе! Собака жива, согрета и накормлена.\n\nТеперь выгул будет производиться строго в трехремневой шлейке-антипобег!`;
    } else {
      foundDesc = `Вы нашли беглеца испуганным, забившимся под балкон на первом этаже! Питомец жив, накормлен и возвращен в безопасность.\n\nНа окна передержки установлены прочные сетки Pet Screen!`;
    }

    showEventModal(
      '🎉 ПИТОМЕЦ НАЙДЕН И СПАСЕН!',
      foundDesc,
      [{ label: 'Какое облегчение! (Продолжить спасение)', style: 'primary', action: () => closeEventModal() }]
    );
  }
  renderAll();
}

// 8. СЛЕПЫШИ: КОРМЛЕНИЕ И ЛОВУШКА КОРОВЬЕГО МОЛОКА (GDD 7.1, 9.1)

function feedCowMilkTrap() {
  if (state.gameOver) return;
  state.fatalMistakeReason = 'cow_milk_blind_kittens';
  triggerEndGame(
    false,
    'ТРАГИЧЕСКАЯ ОШИБКА: Коровье молоко погубило котят',
    'По незнанию вы напоили новорожденных котят магазинным коровьим молоком. Высокая лактоза и казеин вызвали фатальное вздутие и обезвоживание за сутки.\n\nКоровье молоко непригодно для выкорма слепышей! Если бы вы обратились в «Зоошанс», вам бы бесплатно передали стартовый пакетик смеси Royal Canin Babycat Milk.'
  );
}

function buyBabycatFormula() {
  if (state.gameOver) return;
  if (state.cash < 105) {
    addLog(`День ${state.day}: Не хватает средств на банку спецсмеси Royal Canin Babycat Milk (105 BYN)!`, 'danger');
    return;
  }
  state.cash = +(state.cash - 105).toFixed(1);
  state.personalMoneySpent = +(state.personalMoneySpent + 105).toFixed(1);
  state.newborn.milkDaysLeft = (state.newborn.milkDaysLeft || 0) + 7;
  state.newborn.knowsAboutFormula = true;
  addLog(`День ${state.day}: 🍼 Куплена банка специализированной смеси/питания для котят Royal Canin Babycat Milk (-105 BYN, +7 дней рациона).`, 'success');
  renderAll();
}

function feedNewbornKittens() {
  if (state.gameOver) return;
  if (state.newborn.fedToday) return;
  if (!state.newborn.knowsAboutFormula) {
    showEventModal(
      'ЧЕМ КОРМИТЬ СЛЕПЫХ КОТЯТ?',
      'Котята слепые и отчаянно пищат. В холодильнике только пакет коровьего молока, но вы не знаете, подойдет ли оно.',
      [
        {
          label: 'Позвонить в Колл-центр «Зоошанса» за советом (-10⚡)',
          style: 'primary',
          action: () => {
            closeEventModal();
            actionAskZooshansTakeover();
          }
        },
        {
          label: 'Напоить коровьим молоком из магазина (0 BYN)',
          style: 'danger',
          action: () => {
            closeEventModal();
            feedCowMilkTrap();
          }
        }
      ]
    );
    return;
  }
  if (state.newborn.milkDaysLeft <= 0) {
    addLog(`День ${state.day}: 🚨 Закончилась спецсмесь! Срочно купите банку смеси за 105 BYN!`, 'danger');
    return;
  }
  if (!spendEnergy(15)) return;
  state.newborn.milkDaysLeft -= 1;
  state.newborn.fedToday = true;
  state.newborn.daysFedCount += 1;
  state.animal.health = Math.min(100, state.animal.health + 4);
  addLog(`День ${state.day}: 🍼 Вы покормили слепышей теплой смесью из соски и помассировали животики (запас смеси: ${state.newborn.milkDaysLeft} дн.).`, 'success');
  renderAll();
}

// 9. ОСТАВИТЬ СЕБЕ ИЛИ ДРУЗЬЯМ (ЧЕСТНЫЕ ОГРАНИЧЕНИЯ, GDD 8.4)

function actionKeepPetForSelf() {
  if (state.gameOver) return;
  const a = state.animal;
  const p = state.player;

  // Ограничение 1: Не более 1 раза за партию
  if (state.keptForSelfUsed) {
    addLog(`День ${state.day}: ⚠️ Вы уже оставили себе одного хвостика из этой партии! Остальным нужно найти новые семьи.`, 'warn');
    return;
  }

  // Ограничение 2: Завершение лечения, прививок и стерилизации
  const isKitten = a.ageCategory === 'kitten' || a.ageCategory === 'puppy';
  const ready = a.quarantineDaysDone >= 14 && a.examinedWood && a.knownRingworm !== true && a.dewormStage === 2 && a.parasitesAndVaccinated && (isKitten || a.isSterilized);
  if (!ready) {
    addLog(`День ${state.day}: ⚠️ Оставить питомца можно только ПОСЛЕ полного завершения лечения, карантина, прививок и стерилизации по возрасту!`, 'warn');
    return;
  }

  // Ограничение 3: Менталка >= 50%
  if (state.mental < 50) {
    addLog(`День ${state.day}: ⚠️ Ваша Менталка ниже 50% (${state.mental}%)! В состоянии стресса и истощения нельзя принимать долгосрочные решения. Восстановите ресурс.`, 'warn');
    return;
  }

  // Ограничение 4: Запрет при rent_strict
  if (p.housing.id === 'rent_strict') {
    addLog(`День ${state.day}: 🚫 Вы живете на съемной квартире со строгим запретом на животных! Оставить питомца себе невозможно из-за риска выселения.`, 'danger');
    return;
  }

  // Ограничение 5: Блокировка FeLV+ при наличии своего кота
  if (a.knownCarrier === 'FeLV' && (p.ownPets.id === 'vaccinated_cat' || p.ownPets.id === 'unvaccinated_cat')) {
    addLog(`День ${state.day}: 🚫 Питомец — носитель вирусной лейкемии (FeLV+)! Оставлять его в доме, где уже живет свой кот, смертельно опасно (вирус передается через миски и слюну).`, 'danger');
    return;
  }

  state.keptForSelfUsed = true;
  completeOneOrPairAdoption(false, 'Вы приняли осознанное решение оставить подопечного в своей семье или передать родителям/близким друзьям! Питомец обрел самый надежный и любящий дом на свете.');
}

// 10. ВЫРУЧКА ОТ СВОЕГО КОТА В БЕЗДЕНЕЖЬЕ (GDD 3.4, 9.5)
function actionShareFoodWithOwnCat() {
  if (state.gameOver) return;
  const p = state.player;
  if (!p.ownPets || (p.ownPets.id !== 'vaccinated_cat' && p.ownPets.id !== 'unvaccinated_cat')) {
    addLog(`День ${state.day}: У вас нет своего домашнего кота, не у кого просить корм!`, 'warn');
    return;
  }
  if (state.animal.species !== 'cat') {
    addLog(`День ${state.day}: ⚠️ Кошачий корм не подходит для собак из-за избытка белка и риска панкреатита! Занять корм у домашнего кота можно только для кошек.`, 'warn');
    return;
  }
  if (state.supplies.daysLeft > 2 || state.cash >= 65) {
    addLog(`День ${state.day}: Выручка от своего кота активируется только в безденежье (при корме <= 2 дней и нехватке денег)!`, 'info');
    return;
  }
  if (state.day - state.lastOwnPetFoodShareDay < 14) {
    const daysWait = 14 - (state.day - state.lastOwnPetFoodShareDay);
    addLog(`День ${state.day}: Домашний кот уже делился кормом недавно! Подождите еще ${daysWait} дн.`, 'warn');
    return;
  }

  state.supplies.daysLeft += 4;
  state.lastOwnPetFoodShareDay = state.day;
  state.mental = Math.max(0, state.mental - 2);
  addLog(`День ${state.day}: 🥣 ВЫРУЧКА ОТ СВОЕГО КОТА: Домашний кот с глубочайшим презрением наблюдал, как вы отсыпали 4-дневную порцию из его пачки (-2% Менталки, +4 дня снабжения!).`, 'success');
  renderAll();
}

// 11. ЗАЩИТА ОТ КЛЕЩЕЙ ДЛЯ СОБАК (GDD 2.2, 6.3)
function actionBuyTickProtection() {
  if (state.gameOver) return;
  if (state.animal.species !== 'dog') {
    addLog(`День ${state.day}: Капли от клещей требуются только собакам перед прогулками!`, 'info');
    return;
  }
  if (state.cash < 35) {
    addLog(`День ${state.day}: Не хватает средств на капли от клещей (35 BYN)!`, 'danger');
    return;
  }
  state.cash = +(state.cash - 35).toFixed(1);
  state.personalMoneySpent = +(state.personalMoneySpent + 35).toFixed(1);
  state.animal.tickProtectionDaysLeft = 30;
  addLog(`День ${state.day}: 🐕 Куплены капли от иксодовых клещей (-35 BYN). Собака защищена от пироплазмоза на 30 дней!`, 'success');
  renderAll();
}

// 12. ПРОВЕРКА ПОДОПЕЧНОГО НА ИСПЫТАТЕЛЬНОМ СРОКЕ («Написать хозяевам: как дела?», GDD 8.4)
function actionCheckTrialPetStatus() {
  if (state.gameOver) return;
  if (!state.trialAnimals || state.trialAnimals.length === 0) {
    addLog(`День ${state.day}: Сейчас ни один из подопечных не проходит испытательный срок.`, 'info');
    return;
  }
  const item = state.trialAnimals[0];
  if (item.isRedFlag) {
    state.trialAnimals.splice(0, 1);
    state.fatalMistakeReason = item.callData.id;
    triggerRedFlagDelayedStrikeModal(item);
  } else {
    state.mental = Math.min(100, state.mental + 5);
    addLog(`День ${state.day}: 📱 Вы написали хозяевам «${item.petName}». Прислали фото-привет: хвостик сладко спит на диване, аппетит отличный! Испытательный срок: день ${item.daysPassed}/${item.trialDaysTotal || 14} (+5% Менталки).`, 'success');
  }
  renderAll();
}

// 13. ПЕРЕКЛЮЧЕНИЕ НА ПЛАТНУЮ ПЕРЕДЕРЖКУ И ОБРАТНО (v2.2)
function actionTogglePaidFoster() {
  if (state.gameOver) return;
  const a = state.animal;
  const g = getAnimalGrammar(a);
  const costDaily = g.isDog ? 33 : 16;

  if (state.zooshans.locationStatus === 'paid_foster') {
    state.zooshans.locationStatus = state.zooshans.hasCage ? 'home_cage' : 'home_floor';
    addLog(`День ${state.day}: 🏠 Подопечный вернулся с платной передержки домой (${state.zooshans.hasCage ? 'в клетку' : 'на пол'}). Быт снова дома.`, 'info');
    renderAll();
    return;
  }

  if (!a.examinedWood || a.dewormStage < 1) {
    addLog(`День ${state.day}: ⚠️ На платную передержку не берут с улицы вслепую! Сначала проведите первичный осмотр Вуда и 1-ю обработку от паразитов (вкладка 1).`, 'warn');
    return;
  }

  state.zooshans.locationStatus = 'paid_foster';
  if (state.maneuver) state.maneuver.active = false;
  addLog(`День ${state.day}: 🏡 Подопечный переехал на платную передержку (${costDaily} BYN/сут). Домашний быт снят, но не забывайте закупать корм!`, 'info');
  renderAll();
}

// 14. ИМЕНОВАНИЕ ПИТОМЦА ИЗ КАРТОТЕКИ С ДЕДУПЛИКАЦИЕЙ (GDD 4.1)
function logPetNameChange(text) {
  const fullText = `День ${state.day}: ${text}`;
  // Если в этот же игровой день уже была смена клички — обновляем последнюю запись, чтобы не спамить лог
  const existingIndex = state.logs.findIndex(item => item.isPetRename && item.day === state.day);
  if (existingIndex !== -1) {
    state.logs[existingIndex].text = fullText;
    state.logs[existingIndex].type = 'success';
  } else {
    state.logs.unshift({ text: fullText, type: 'success', isPetRename: true, day: state.day });
  }
  renderLog();
}

function actionRollRandomPetName() {
  if (state.gameOver) return;
  state.animal.petName = getRandomPetname();
  logPetNameChange(`🏷️ Подопечному присвоена кличка из картотеки «Зоошанса»: «${state.animal.petName}».`);
  renderAll();
}

function actionSetPetName(customName) {
  if (state.gameOver) return;
  if (!customName || !customName.trim()) return;
  let clean = customName.trim();
  const parts = clean.split(/\s+/);
  let districtAdded = false;
  if (parts.length === 1) {
    clean = getSuggestedUniquePetname(clean);
    districtAdded = true;
  }
  state.animal.petName = clean;
  const msg = districtAdded
    ? `🏷️ Подопечному присвоена кличка: «${clean}» (к имени добавлен район по правилам картотеки).`
    : `🏷️ Кличка подопечного обновлена: «${clean}».`;
  logPetNameChange(msg);
  renderAll();
}

window.canAffordVetBill = canAffordVetBill;
window.payVetBill = payVetBill;
