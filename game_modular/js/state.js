// state.js - Глобальное состояние игры и управление ресурсами (v2.2)
var state = {};
var tickTimer = null;
var currentSpeed = 0;
var activeTab = 'vet';

const MONTH_NAMES_RU = [
  'января', 'февраля', 'марта', 'апреля', 'мая', 'июня',
  'июля', 'августа', 'сентября', 'октября', 'ноября', 'декабря'
];

function getSeasonFromMonth(month) {
  if (month === 11 || month === 0 || month === 1) return 'winter';
  if (month >= 2 && month <= 4) return 'spring';
  if (month >= 5 && month <= 7) return 'summer';
  return 'autumn';
}

function getSeasonLabelRu(season) {
  switch (season) {
    case 'winter': return '❄️ Зима';
    case 'spring': return '🌱 Весна';
    case 'summer': return '☀️ Лето';
    case 'autumn': return '🍂 Осень';
    default: return season;
  }
}

function formatCalendarDate(d) {
  d = d || (window.state && window.state.calendarDate) || new Date();
  return `${d.getDate()} ${MONTH_NAMES_RU[d.getMonth()]}`;
}

function getSavedAlbum() {
  try {
    const raw = localStorage.getItem('zooshans_saved_album');
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    return [];
  }
}

function savePetToAlbum(record) {
  try {
    const album = getSavedAlbum();
    const existingIndex = album.findIndex(item => String(item.id) === String(record.id));
    if (existingIndex >= 0) {
      album[existingIndex] = { ...album[existingIndex], ...record };
    } else {
      album.unshift(record);
    }
    localStorage.setItem('zooshans_saved_album', JSON.stringify(album));
  } catch (e) {
    console.error('Failed to save pet to album:', e);
  }
}

function saveRescueAlbum(record) {
  if (record) savePetToAlbum(record);
}
window.saveRescueAlbum = saveRescueAlbum;

const MENTOR_STORAGE_KEY = 'zooshans_unlocked_mentor_hints';

function getUnlockedMentorHints() {
  try {
    const raw = localStorage.getItem(MENTOR_STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch (e) {
    return [];
  }
}

function unlockMentorHint(id) {
  if (!id) return false;
  try {
    const hints = getUnlockedMentorHints();
    if (hints.includes(id)) {
      return false;
    }
    hints.push(id);
    localStorage.setItem(MENTOR_STORAGE_KEY, JSON.stringify(hints));
    return true;
  } catch (e) {
    console.error('Failed to unlock mentor hint:', e);
    return false;
  }
}

function isMentorHintUnlocked(id) {
  if (!id) return false;
  const hints = getUnlockedMentorHints();
  return hints.includes(id);
}

function resetMentorProgress() {
  try {
    localStorage.removeItem(MENTOR_STORAGE_KEY);
    if (window.state) {
      window.state.shownHints = {};
      window.state.mentorHistory = [];
    }
  } catch (e) {
    console.error('Failed to reset mentor progress:', e);
  }
}

function ensureStateBackwardCompatibility(st = window.state) {
  if (!st) return st;

  // 1. playerAxes & player fields
  if (!st.playerAxes && window.GAME_DATA && window.GAME_DATA.playerAxes) {
    st.playerAxes = window.GAME_DATA.playerAxes;
  }
  if (!st.player) {
    st.player = {};
  }
  if (window.GAME_DATA && window.GAME_DATA.playerAxes) {
    const axes = window.GAME_DATA.playerAxes;
    if (!st.player.income) st.player.income = axes.incomes ? axes.incomes[0] : null;
    if (!st.player.housing) st.player.housing = axes.housing ? axes.housing[0] : null;
    if (!st.player.family) st.player.family = axes.family ? axes.family[0] : null;
    if (!st.player.ownPets) st.player.ownPets = axes.ownPets ? axes.ownPets[0] : null;
    if (!st.player.mobility) st.player.mobility = axes.mobility ? axes.mobility[0] : null;
    if (!st.player.socialCapital) st.player.socialCapital = axes.socialCapital ? axes.socialCapital[1] : { multiplier: 1.0 };
  }

  // 2. Mentor history & shownHints
  if (!st.shownHints || typeof st.shownHints !== 'object') {
    st.shownHints = {};
  }
  if (!Array.isArray(st.mentorHistory)) {
    st.mentorHistory = [];
  }

  // 3. Volunteer timers & flags
  if (st.animal) {
    if (typeof st.animal.volunteerHandlesDeworming !== 'boolean') {
      st.animal.volunteerHandlesDeworming = false;
    }
    if (typeof st.animal.quarantineDaysDone !== 'number') {
      st.animal.quarantineDaysDone = 0;
    }
    if (typeof st.animal.dewormStage !== 'number') {
      st.animal.dewormStage = 0;
    }
    if (typeof st.animal.daysSinceDeworm1 !== 'number') {
      st.animal.daysSinceDeworm1 = 0;
    }
    if (typeof st.animal.daysSinceDeworm2 !== 'number') {
      st.animal.daysSinceDeworm2 = 0;
    }
  }

  if (st.zooshans) {
    if (typeof st.zooshans.tempVolunteerDaysLeft !== 'number') {
      st.zooshans.tempVolunteerDaysLeft = 0;
    }
    if (typeof st.zooshans.socialFosterDaysElapsed !== 'number') {
      st.zooshans.socialFosterDaysElapsed = 0;
    }
    if (typeof st.zooshans.hasGiftedDewormPill !== 'boolean') {
      st.zooshans.hasGiftedDewormPill = false;
    }
    if (typeof st.zooshans.personalFundraiserActive !== 'boolean') {
      st.zooshans.personalFundraiserActive = false;
    }
  }

  if (st.onboarding) {
    if (typeof st.onboarding.day1ChoiceMade !== 'boolean') {
      st.onboarding.day1ChoiceMade = true;
    }
  }

  if (st.pr) {
    if (typeof st.pr.lostSearchActive !== 'boolean') {
      st.pr.lostSearchActive = Boolean(st.animal?.hiddenState?.isLostOrPurebred && (st.pr.lostSearchDaysDone || 0) < 10);
    }
    if (typeof st.pr.lostSearchDaysDone !== 'number') {
      st.pr.lostSearchDaysDone = 0;
    }
    if (!st.pr.earlyBooking) {
      st.pr.earlyBooking = {
        active: Boolean(st.pr.earlyBookedAdopterWaiting),
        bookedOnDay: st.day || 1,
        candidateName: 'Семья по ранней брони',
        notifiedReady: false
      };
    }
  }

  if (!st.supplies) {
    st.supplies = { daysLeft: 4, lastWarningDay: -1 };
  } else if (typeof st.supplies.lastWarningDay !== 'number') {
    st.supplies.lastWarningDay = -1;
  }
  if (st.newborn && typeof st.newborn.lastFormulaWarningDay !== 'number') {
    st.newborn.lastFormulaWarningDay = -1;
  }

  return st;
}
window.ensureStateBackwardCompatibility = ensureStateBackwardCompatibility;

function startNewRun(experiencedCurator = false, forcedScenario = null) {
  stopTimer();
  document.getElementById('endGameModal').classList.add('hidden');
  const endBanner = document.getElementById('endGameOverviewBanner');
  if (endBanner) endBanner.classList.add('hidden');
  const animModal = document.getElementById('animalModal');
  if (animModal) animModal.classList.add('hidden');
  const scenModal = document.getElementById('scenarioPickerModal');
  if (scenModal) scenModal.classList.add('hidden');
  const mentModal = document.getElementById('mentorModal');
  if (mentModal) mentModal.classList.add('hidden');
  const mentArchModal = document.getElementById('mentorArchiveModal');
  if (mentArchModal) mentArchModal.classList.add('hidden');
  const candModal = document.getElementById('candidateInterviewModal');
  if (candModal) candModal.classList.add('hidden');
  if (typeof window !== 'undefined') window.currentCandidateCall = null;
  if (typeof closeCandidateModal === 'function') closeCandidateModal();
  if (typeof closeMobileSettingsMenu === 'function') closeMobileSettingsMenu();
  if (typeof mentorHintQueue !== 'undefined' && Array.isArray(mentorHintQueue)) mentorHintQueue.length = 0;
  if (typeof closeMentorModal === 'function') closeMentorModal();
  if (typeof closeMentorArchiveModal === 'function') closeMentorArchiveModal();
  document.getElementById('eventOverlayBox').classList.add('hidden');
  document.getElementById('actionsDashboard').classList.add('hidden');

  const inc = randomItem(window.GAME_DATA.playerAxes.incomes);
  let hous = randomItem(window.GAME_DATA.playerAxes.housing);
  let fam = randomItem(window.GAME_DATA.playerAxes.family);

  // Фикс генерации взаимоисключающих перков (GDD v2.2):
  // «С родней» и «Живу один/одна» не могут выпадать одновременно
  if (hous.id === 'with_relatives' && fam.id === 'single') {
    const nonSingleFam = window.GAME_DATA.playerAxes.family.filter(f => f.id !== 'single');
    fam = randomItem(nonSingleFam);
  }

  const pets = randomItem(window.GAME_DATA.playerAxes.ownPets);
  const mob = randomItem(window.GAME_DATA.playerAxes.mobility);
  const soc = randomItem(window.GAME_DATA.playerAxes.socialCapital);

  // Предохранитель генерации (GDD 3.7):
  // При опасной комбинации low доход (280 BYN) + rent_strict + small_kids блокируем спавн тяжелых выводков
  let arch = forcedScenario ? (forcedScenario.coat ? forcedScenario : generateRandomAnimalScenario(forcedScenario)) : generateRandomAnimalScenario();
  const isHighRiskProfile = inc.id === 'low' && hous.id === 'rent_strict' && fam.id === 'small_kids';
  if (isHighRiskProfile && !forcedScenario) {
    let retries = 0;
    while ((arch.id === 'orphan_puppies_litter' || arch.id === 'dacha_mother_with_kittens') && retries < 15) {
      arch = generateRandomAnimalScenario();
      retries++;
    }
  }

  // Динамический календарь дат и сезонов (GDD 2.2)
  const defaultStarts = [
    new Date(2025, 4, 12),  // 12 мая (весна)
    new Date(2025, 6, 18),  // 18 июля (лето)
    new Date(2025, 8, 25),  // 25 сентября (осень)
    new Date(2025, 11, 10)  // 10 декабря (зима)
  ];
  let startDate = randomItem(defaultStarts);
  if (arch.hiddenState.isKittenSeason) {
    startDate = new Date(2025, 6, 15); // Июль
  } else if (arch.id === 'dacha_kittens_herpes_eyes') {
    startDate = new Date(2025, 8, 20); // Сентябрь
  } else if (arch.id === 'pregnant_stray_cat_timer') {
    startDate = new Date(2025, 3, 8);  // Апрель
  }

  const initialSeason = getSeasonFromMonth(startDate.getMonth());

  // Если у игрока есть сохраненные подопечные в альбоме, опция опыта
  const hasPastExperience = getSavedAlbum().length > 0;
  const isExperienced = experiencedCurator || (hasPastExperience && document.getElementById('chkExperiencedCurator') && document.getElementById('chkExperiencedCurator').checked);

  state = {
    day: 1,
    calendarDate: startDate,
    currentSeason: initialSeason,
    seasonsPassed: [initialSeason],
    gameOver: false,
    victory: false,
    fatalMistakeReason: null, // Для обучающего экрана «Работа над ошибками» (GDD 9.1)
    secondWindUsed: false,    // «Второе дыхание» в @zooshans_chat (+45% менталки при первом падении до 0%)
    keptForSelfUsed: false,   // Кнопка «Оставить себе» не более 1 раза за партию
    lastOwnPetFoodShareDay: -999, // Кулдаун 14 дней на выручку кормом от своего кота
    shownHints: {},           // Флаги показанных подсказок ментора в текущем забеге
    mentorHistory: [],        // История показанных подсказок
    playerAxes: (window.GAME_DATA && window.GAME_DATA.playerAxes) ? window.GAME_DATA.playerAxes : null,

    // Онбординг новичка и Острая фаза (Дни 1-3)
    onboarding: {
      acutePhase: true,       // Первые 3 дня — пошаговый режим без таймера (кнопка «Завершить день»)
      day1ChoiceMade: false,  // Выбор на экране «ОДИН НА ОДИН: ВЫ НАШЛИ БЕЗДОМНОЕ ЖИВОТНОЕ!»
      googleDone: true,       // Доступ ко всем вкладкам открыт сразу (без тумана войны)
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
      socialCapital: soc,
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
      volunteerHandlesDeworming: false, // Опытный волонтер сам контролирует дачи таблеток

      daysSinceVaccine1: 0,
      vaccineDewormLapse: false,

      tickProtectionDaysLeft: 0, // Защита от клещей для собак весной/летом (35 BYN / 30 дн.)
      parasitesAndVaccinated: false,
      isSterilized: false,
      traumaOperated: false, // true только после фактического проведения операции
      inStationaryDaysLeft: 0, // дни нахождения в стационаре после операции/реанимации
      stationaryReason: null, // 'virus' или 'trauma'
      virusRecoveryDaysLeft: 0, // 14 дней восстановления после выписки из инфекционного ОРИТ
      traumaRehabDaysLeft: 0, // 45 дней (1.5 мес) сращения костей после остеосинтеза
      felvConfirmed: false, // сдан ли подтверждающий тест на провирус FeLV
      felvInfectiousConsultDone: false, // консультация инфекциониста
      felvAntiviralActive: false, // противовирусная терапия (Ралтегравир)
      felvAntiviralDaysLeft: 0,
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

    // Очередь животных на 7-дневном испытательном сроке (GDD 8.4, 8.5)
    trialAnimals: [],

    // 3 дня для маневра при возврате без придержанного места
    maneuver: {
      active: false,
      daysRemaining: 0,
      petData: null
    },

    // Спасенные хвостики в текущей партии
    savedTails: [],
    rescuedPets: [],

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
      receivedFreeStarterPacket: false,
      lastFormulaWarningDay: -1
    },

    // Расходники (в днях) — пакеты на 14 дней в зоомагазине
    supplies: {
      daysLeft: 4,
      lastWarningDay: -1
    },

    // Колл-центр «Зоошанса», Лимит долга 1000 BYN и Лимит карты 6500 BYN
    zooshans: {
      applicationSubmitted: false,
      clinicMode: 'partner_cash', // 'partner_cash' (по умолчанию до подачи заявления) vs 'major_voucher'
      expensiveApproved: false,
      askedToTakeAnimal: false,
      tempVolunteerChance: isHighRiskProfile ? 0.60 : 0.20,
      locationStatus: 'home_floor', // 'home_floor', 'home_cage', 'paid_foster', 'temp_volunteer_14d', 'full_volunteer_fincuration', 'social_foster_volunteer', 'social_foster_novice'
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
      lostSearchActive: Boolean((arch && arch.hiddenState && arch.hiddenState.isLostOrPurebred) || (forcedScenario && (forcedScenario.isLostOrPurebred || forcedScenario.hiddenState?.isLostOrPurebred))),
      lostSearchDaysDone: 0,
      prActive: false,
      daysInPr: 0,
      daysSinceAdRefresh: 0,
      earlyBookedAdopterWaiting: false,
      earlyBooking: {
        active: false,
        bookedOnDay: 0,
        candidateName: 'Семья по ранней брони',
        notifiedReady: false
      },
      storytellingBoost: 0,
      storytellingCallBonus: 0,
      lastStorytellingDay: -999
    },

    triggeredEvents: {},
    logs: []
  };

  const calStr = formatCalendarDate(state.calendarDate);
  const sLabel = getSeasonLabelRu(state.currentSeason);
  const initialPetNameText = state.animal.petName
    ? `«${state.animal.petName}»`
    : (state.animal.count > 1 ? `Выводок (${state.animal.count} малышей, без клички)` : '«Найденыш»');
  addLog(`День 1 (${calStr}, ${sLabel}): Вы нашли подопечных — ${initialPetNameText} (${state.animal.title}).`, 'info');
  addLog(`День 1: Началась пошаговая острая фаза (Дни 1–3). Таймер отключен. Изучайте обстановку и завершайте дни вручную.`, 'info');
  if (state.animal && state.animal.hiddenState && state.animal.hiddenState.isLostOrPurebred) {
    state.pr.lostSearchActive = true;
  }
  ensureStateBackwardCompatibility(state);
  renderAll();
  triggerDay1IntroModal();
}

function isAnimalInStationary() {
  return Boolean(state.animal && state.animal.inStationaryDaysLeft && state.animal.inStationaryDaysLeft > 0);
}

function isAnimalAtPlayerHome() {
  if (isAnimalInStationary()) return false;
  return state.zooshans.locationStatus === 'home_floor' || state.zooshans.locationStatus === 'home_cage';
}

function isAnimalMedicallyRestricted() {
  const a = state.animal;
  if (!a) return false;
  return Boolean(
    (a.inStationaryDaysLeft && a.inStationaryDaysLeft > 0) ||
    (a.virusRecoveryDaysLeft && a.virusRecoveryDaysLeft > 0) ||
    (a.traumaRehabDaysLeft && a.traumaRehabDaysLeft > 0) ||
    (a.knownRingworm === true) ||
    (a.hiddenState && a.hiddenState.hasSevereTrauma && !a.traumaOperated) ||
    (a.teethCrisis && !a.teethOperated) ||
    (a.fipTreatment && a.fipDaysLeft > 0)
  );
}

function getEarlyBookingWaitDays() {
  if (!state.pr || !state.pr.earlyBooking || !state.pr.earlyBooking.active) return 0;
  const bookedDay = state.pr.earlyBooking.bookedOnDay || state.day;
  return Math.max(0, state.day - bookedDay);
}

function calculateEarlyBookingDropChance(waitDays) {
  if (waitDays <= 3) return 0.10;
  if (waitDays <= 7) return 0.18;
  if (waitDays <= 14) return 0.25;
  if (waitDays <= 25) return 0.35;
  return 0.45;
}

function calculateDailyHouseholdEnergyDrain() {
  // На передержке, в стационаре ветклиники или когда все животные на испытательном сроке/дома — быт = 0⚡/день
  if (!isAnimalAtPlayerHome() || isAnimalInStationary()) return 0;
  const a = state.animal;
  const nActive = a.activeCount !== undefined ? a.activeCount : a.count;
  if (nActive <= 0) return 0;

  let baseDrain = (a.species === 'dog' && a.ageCategory !== 'puppy') ? 25 : 10; // Выгул взрослой собаки 2x/день (-25⚡) или базовый кот/щенок (-10⚡)
  if (!a.litterTrained) baseDrain += 12; // Мытье луж, приучение к лотку/пеленкам
  if (a.ageCategory === 'puppy') baseDrain += 20; // Щенки на пеленках дома (-20⚡)
  if (a.knownRingworm === true) baseDrain += 12; // Обработки при лишае (-12⚡)
  if (a.hiddenState.isJawFracture && a.hiddenState.syringeDaysLeft > 0) baseDrain += 20; // Кормление через шприц/стому (-20⚡)
  if (!a.eyeDropsCompleted) baseDrain += 15; // Капли каждые 2 часа (-15⚡)
  if (!a.giProtocolCompleted) baseDrain += 12; // Диарея и дача лекарств

  // Динамический пересчет нагрузки при частичной раздаче выводка (GDD 7.1)
  const nTotal = a.totalCount || a.count || 1;
  let finalDrain = baseDrain;
  if (nTotal > 1) {
    finalDrain = Math.ceil(baseDrain * (0.4 + 0.6 * (nActive / nTotal)));
  }

  return Math.min(65, finalDrain);
}

function spendEnergy(amount) {
  if (state.gameOver) return false;
  if (state.energy < amount) {
    addLog(`День ${state.day}: ⚡ Не хватает энергии (нужно ${amount}⚡)! Отдохните до следующего дня.`, 'warn');
    return false;
  }
  state.energy -= amount;
  if (typeof checkMentorTriggers === 'function') {
    checkMentorTriggers();
  }
  return true;
}

function addLog(text, type = 'info') {
  if (!state.logs) state.logs = [];
  state.logs.unshift({ text, type });
  if (typeof renderLog === 'function') renderLog();
}

function selectClinicMode(mode) {
  if (state.gameOver) return;
  if (mode === 'major_voucher' && !state.zooshans.applicationSubmitted) {
    if (typeof addLog === 'function') {
      addLog(`День ${state.day}: 🔒 Ветцентр Б (Талон) недоступен: сначала подайте заявление в Колл-центр «Зоошанса» (вкладка 2).`, 'warn');
    }
    return;
  }
  state.zooshans.clinicMode = mode;
  renderAll();
}

function checkMentalHealth() {
  if (state.mental <= 0 && !state.gameOver) {
    if (!state.secondWindUsed) {
      triggerSecondWindModal();
    } else {
      state.fatalMistakeReason = 'burnout';
      triggerBurnoutModal();
    }
  }
}

function checkAnimalHealth() {
  if (state.animal && state.animal.health <= 0 && !state.gameOver) {
    state.fatalMistakeReason = state.fatalMistakeReason || 'health_failure';
    triggerEndGame(
      false,
      'ПОРАЖЕНИЕ: Спасти жизнь не удалось',
      'Без своевременной интенсивной терапии и ухода организм животного не справился с критической нагрузкой.\n\nВ реальности волонтеры МБООПЖ «Зоошанс» не остаются с бедой один на один — всегда обращайтесь за советом и помощью в чат взаимопомощи @zooshans_chat!'
    );
    return true;
  }
  return false;
}

