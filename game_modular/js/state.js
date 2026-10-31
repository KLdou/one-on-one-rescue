// state.js - Глобальное состояние игры и управление ресурсами (v2.0)
var state = {};
var tickTimer = null;
var currentSpeed = 0;
var activeTab = 'vet';

function startNewRun() {
  stopTimer();
  document.getElementById('endGameModal').classList.add('hidden');
  document.getElementById('eventOverlayBox').classList.add('hidden');
  document.getElementById('actionsDashboard').classList.remove('hidden');

  const inc = randomItem(window.GAME_DATA.playerAxes.incomes);
  const hous = randomItem(window.GAME_DATA.playerAxes.housing);
  const fam = randomItem(window.GAME_DATA.playerAxes.family);
  const pets = randomItem(window.GAME_DATA.playerAxes.ownPets);
  const mob = randomItem(window.GAME_DATA.playerAxes.mobility);

  // Предохранитель генерации (GDD 3.6):
  // При комбинации low доход (280 BYN) + rent_strict + small_kids блокируем спавн тяжелых выводков
  let arch = generateRandomAnimalScenario();
  const isHighRiskProfile = inc.id === 'low' && hous.id === 'rent_strict' && fam.id === 'small_kids';
  if (isHighRiskProfile) {
    let retries = 0;
    while ((arch.id === 'orphan_puppies_litter' || arch.id === 'dacha_mother_with_kittens') && retries < 15) {
      arch = generateRandomAnimalScenario();
      retries++;
    }
  }

  state = {
    day: 1,
    gameOver: false,
    victory: false,
    fatalMistakeReason: null, // Для обучающего экрана «Работа над ошибками» (GDD 9.1)
    secondWindUsed: false,    // «Второе дыхание» в @zooshans_chat (+45% менталки при первом падении до 0%)
    keptForSelfUsed: false,   // Кнопка «Оставить себе» не более 1 раза за партию

    // Онбординг новичка и Острая фаза (Дни 1-3)
    onboarding: {
      acutePhase: true,       // Первые 3 дня — пошаговый режим без таймера (кнопка «Завершить день»)
      googleDone: false,      // «Погуглить» — открывает вкладки Колл-центра и Пиара
      gurskogoCalled: false,
      dumpBoxAttempted: false
    },

    cash: inc.startingCash, // 280 / 600 / 1120 BYN
    personalMoneySpent: 0,
    voucherFundsUsed: 0,
    mental: 100,
    energy: 100,
    filteredBadCalls: 0,

    player: {
      income: inc,
      housing: hous,
      family: fam,
      ownPets: pets,
      mobility: mob,
      isHighRiskProfile: isHighRiskProfile
    },

    animal: {
      ...arch,
      health: arch.hiddenState.hasSevereTrauma ? 45 : 88,
      quarantineDaysDone: 0,
      quarantineCompletedNotified: false,
      examinedWood: false,
      pcrTested: false,
      pcrPending: false,
      pcrDaysRemaining: 0,
      pcrResultDoubtful: false,
      knownRingworm: false,
      ringwormDaysDone: 0, // 35 дней в клетке (контрольные просветы на 24/25 и 34/35 дн.)
      knownVirus: null,
      knownCarrier: null,
      knownPregnant: false,

      dewormStage: 0, // 0 -> 1 (ждем 10 дн.) -> 2 (действует 180 дн.)
      daysSinceDeworm1: 0,
      daysSinceDeworm2: 0,

      parasitesAndVaccinated: false,
      isSterilized: false,
      traumaOperated: !arch.hiddenState.hasSevereTrauma,
      bloodDonorFound: !arch.hiddenState.needsBloodDonor,
      eyeDropsCompleted: arch.hiddenState.deadlyVirus !== 'rhinotracheitis_eyes',
      eyeDropsDaysDone: 0,
      giProtocolCompleted: !arch.hiddenState.hasChronicGI,

      hasAntiEscapeHarness: false,
      hasMotherCat: arch.hasMotherCat || false,
      motherLactating: arch.motherLactating || false,
      motherSterilized: false,
      fipTreatment: false,
      fipDaysLeft: 0,
      fipCured: false,
      teethCrisis: false,
      teethOperated: false,
      hasFreeEyeDrops: false
    },

    // Экстренный 4-дневный квест поиска беглеца (срыв собаки или окно на передержке)
    escapeQuest: {
      active: false,
      daysRemaining: 4,
      searchProgress: 0,
      reason: ''
    },

    photos: {
      hasSelfPhotos: false,
      hasFriendsPhotos: false,
      hasProPhotos: false
    },

    // Новорожденные слепыши
    newborn: {
      active: arch.hiddenState.isNewborn === true,
      daysFedCount: 0,
      fedToday: false,
      milkDaysLeft: 0,
      knowsAboutFormula: false,
      receivedFreeStarterPacket: false
    },

    // Расходники (в днях) — пакеты на 14 дней в зоомагазине
    supplies: {
      daysLeft: 4
    },

    // Колл-центр «Зоошанса», Лимит долга 1000 BYN и Лимит карты 6500 BYN
    zooshans: {
      applicationSubmitted: false,
      clinicMode: 'major_voucher', // 'partner_cash' vs 'major_voucher'
      expensiveApproved: false,
      askedToTakeAnimal: false,
      tempVolunteerChance: isHighRiskProfile ? 0.60 : 0.20,
      locationStatus: 'home_floor', // 'home_floor', 'home_cage', 'paid_foster', 'temp_volunteer_10d', 'full_volunteer_fincuration', 'social_foster_volunteer', 'social_foster_novice'
      tempVolunteerDaysLeft: 0,
      socialFosterDaysElapsed: 0,
      socialFosterConflictTriggered: false,
      hasCage: false,
      cageReturnedClean: false,
      voucherBlocked: false,
      voucherDebt: 0, // Макс. 1000 BYN
      voucherDaysLeft: 30,
      officialFundraiserActive: false,
      personalFundraiserActive: false,
      personalCardCollectedBYN: 0, // Лимит 6500 BYN в год
      daysSinceLastFinReport: 0,
      personalDonationsBanned: false,
      hasProPhotos: false,

      giftedFoodDaysLeft: 0,
      hasGiftedDewormPill: false,
      hasGiftedItraconazole: false,
      pendingGiftThankYou: false,
      storytellingTrustBonus: 0
    },

    // Пристройство в ЕС / Грузию
    abroad: {
      rabiesVaccineAndChipDone: false,
      daysSinceRabiesVaccine: 0,
      titerBloodTaken: false,
      daysInEuQuarantine: 0,
      titerFundraiserActive: false,
      titerCollectedAmount: 0
    },

    // Системный пиар (обновление каждые 6 дней) и раннее бронирование с 45 дней
    pr: {
      lostSearchActive: false,
      lostSearchDaysDone: 0,
      prActive: false,
      daysInPr: 0,
      daysSinceAdRefresh: 0,
      earlyBookedAdopterWaiting: false,
      storytellingBoost: 0,
      storytellingCallBonus: 0
    },

    triggeredEvents: {},
    logs: []
  };

  addLog(`День 1: Вы нашли подопечного — «${state.animal.title}». Вы — обычный человек и пока не знаете правил зоозащиты.`, 'info');
  addLog(`День 1: Началась пошаговая острая фаза (Дни 1–3). Таймер отключен. Изучайте обстановку и завершайте дни вручную.`, 'info');
  renderAll();
  triggerDay1IntroModal();
}

function isAnimalAtPlayerHome() {
  return state.zooshans.locationStatus === 'home_floor' || state.zooshans.locationStatus === 'home_cage';
}

function calculateDailyHouseholdEnergyDrain() {
  // На передержке весь быт снят с игрока (0⚡/день)
  if (!isAnimalAtPlayerHome()) return 0;

  const a = state.animal;
  let drain = a.species === 'dog' ? 25 : 10; // Выгул взрослой собаки 2x/день (-25⚡) или базовый кот (-10⚡)
  if (a.count > 1) drain += 8;
  if (!a.litterTrained) drain += 12; // Мытье луж, приучение к лотку/выгулу
  if (a.ageCategory === 'puppy') drain += 20; // Щенки на пеленках дома (-20⚡)
  if (a.knownRingworm === true) drain += 12; // Обработки при лишае (-12⚡)
  if (a.hiddenState.isJawFracture && a.hiddenState.syringeDaysLeft > 0) drain += 20; // Кормление через шприц/стому (-20⚡)
  if (!a.eyeDropsCompleted) drain += 15; // Капли каждые 2 часа (-15⚡)
  if (!a.giProtocolCompleted) drain += 12; // Диарея и дача лекарств
  return Math.min(65, drain);
}

function spendEnergy(amount) {
  if (state.energy < amount) {
    addLog(`День ${state.day}: ⚡ Не хватает энергии (нужно ${amount}⚡)! Отдохните до следующего дня.`, 'warn');
    return false;
  }
  state.energy -= amount;
  return true;
}

function addLog(text, type = 'info') {
  state.logs.unshift({ text, type });
  renderLog();
}

function selectClinicMode(mode) {
  state.zooshans.clinicMode = mode;
  renderAll();
}
