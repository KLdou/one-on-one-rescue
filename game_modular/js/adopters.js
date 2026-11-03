// adopters.js - Пул звонков ручек, собеседования, фильтрация и пристройство (v2.2)

function getDynamicScammerCalls(a) {
  const g = getAnimalGrammar(a);
  const isDog = g.isDog;
  const singleWord = isDog ? (a.ageCategory === 'puppy' ? 'щенка' : 'собаку') : (a.ageCategory !== 'adult' ? 'котенка' : (a.gender === 'female' ? 'кошку' : 'кота'));
  const petWord = isDog ? 'пес' : (a.gender === 'female' ? 'кошка' : 'кот');

  const rawScam = (window.GAME_DATA && window.GAME_DATA.calls && window.GAME_DATA.calls.scammerCalls) || [];

  if (!rawScam.length) {
    return [
      {
        id: 'scam_courier_prepay',
        caller: 'Мужской голос с помехами рации («Дальнобойщик»)',
        dialogue: `«Здорово, куратор! Я на фуре под Барановичами, это точно наш породистый ${petWord}, узнал по пятну! Забрать сам не успеваю — переведите 45 BYN курьеру на страховку доставки, а я вечером верну вам 200 BYN вознаграждения!»`,
        extraQuestionReply: `На просьбу назвать особые приметы или скинуть фото в Вайбер мужчина начинает кричать: «Вы что, на чужом горе нажиться хотите?! У меня роуминг, переводите курьеру быстрей на номер!»`,
        isSafe: false,
        isScam: true,
        scamLossBYN: 80,
        consequenceText: `Классический фишинговый развод мошенников! Вы перешли по ссылке «на страховку курьера», с карты списали 80 BYN (-35% Менталки), а номер абонента стал недоступен. Ни курьера, ни хозяина не существовало.`
      },
      {
        id: 'scam_breeder_metro',
        caller: 'Деловая женщина без эмоций («Перекупщица»)',
        dialogue: `«Здравствуйте, видела объявление о породистом животном. Это наш, позавчера убежал. Нет, фотографий нет — телефон сброшен до заводских настроек, ветпаспорт утерян. Стерилизацию делать не разрешаю — нечего портить породу! Выносите к метро через 20 минут, заберу без лишних вопросов».`,
        extraQuestionReply: 'На вопрос об адресе и паспорте раздраженно бросает: «Зачем вам мой домашний адрес? Я спешу, отдавайте животное у турникетов или я найду другого!»',
        isSafe: false,
        isScam: true,
        consequenceText: `Вы отдали нестерилизованное породистое животное перекупщице. Через 2 дня фото появилось на Куфаре за 300 BYN в разделе «Для вязки и разведения». Животное попало в клеточную плодильню.`
      }
    ];
  }

  const pool = [];
  for (const callTemplate of rawScam) {
    const item = JSON.parse(JSON.stringify(callTemplate));
    const interpolate = (txt) => {
      if (!txt) return txt;
      return txt
        .replace(/\$\{singleWord\}/g, singleWord)
        .replace(/\{singleWord\}/g, singleWord)
        .replace(/\$\{petWord\}/g, petWord)
        .replace(/\{petWord\}/g, petWord);
    };
    item.dialogue = interpolate(item.dialogue);
    item.extraQuestionReply = interpolate(item.extraQuestionReply);
    item.consequenceText = interpolate(item.consequenceText);
    pool.push(item);
  }
  return pool;
}

function getDynamicAdopterCalls(a) {
  const g = getAnimalGrammar(a);
  const isDog = g.isDog;
  const singleWord = isDog ? (a.ageCategory === 'puppy' ? 'щенка' : 'собаку') : (a.ageCategory !== 'adult' ? 'котенка' : (a.gender === 'female' ? 'кошку' : 'кота'));
  const petWord = isDog ? 'пес' : (a.gender === 'female' ? 'кошка' : 'кот');
  const protectionDetail = isDog ? 'Адресник еще не заказали' : 'Сетки-антикошки пока не ставили, пользуемся гребенками';

  const rawPool = (window.GAME_DATA && window.GAME_DATA.calls && window.GAME_DATA.calls.adopterCalls) || [];

  const calMonth = (window.state && window.state.calendarDate) ? window.state.calendarDate.getMonth() : new Date().getMonth();
  const calDay = (window.state && window.state.calendarDate) ? window.state.calendarDate.getDate() : new Date().getDate();

  const isHalloweenSeason = (calMonth === 9 && calDay >= 15 && calDay <= 31); // 15-31 октября
  const isNewYearSeason = (calMonth === 11 && calDay >= 15 && calDay <= 31); // 15-31 декабря

  const pool = [];

  for (const callTemplate of rawPool) {
    const id = callTemplate.id;

    // Специфика собаки vs кошки
    if (id === 'call_dog_chain_village') {
      if (!isDog) continue;
    }
    if (id === 'call_village_mice_outdoor' || id === 'call_window_fall_fatal' || id === 'call_fiv_felv_ignorer') {
      if (isDog) continue;
    }

    // FeLV звонок — только для подтвержденных носителей FeLV
    if (id === 'call_felv_aware_single_pet') {
      if (isDog || a.knownCarrier !== 'FeLV') continue;
    }

    // Колор-пойнт / породистая разведенка — только для колор-пойнтов или породистых кошек
    if (id === 'call_fake_breed_colorpoint') {
      if (isDog) continue;
      const isPurebredOrPoint = (a.coatId === 'colorpoint' || a.coatId === 'purebred' || (a.hiddenState && a.hiddenState.isLostOrPurebred));
      if (!isPurebredOrPoint) continue;
    }

    // Черный кот на Хэллоуин (15-31 октября)
    if (id === 'call_halloween_black_cat') {
      if (isDog || a.coatId !== 'black' || !isHalloweenSeason) continue;
    }

    // Новогодний ажиотаж (15-31 декабря)
    if (id === 'call_gift_new_year_rush') {
      if (!isNewYearSeason) continue;
    }

    // Глубокое клонирование для защиты от мутации GAME_DATA
    const item = JSON.parse(JSON.stringify(callTemplate));

    const interpolate = (txt) => {
      if (!txt) return txt;
      return txt
        .replace(/\$\{singleWord\}/g, singleWord)
        .replace(/\{singleWord\}/g, singleWord)
        .replace(/\$\{petWord\}/g, petWord)
        .replace(/\{petWord\}/g, petWord)
        .replace(/\$\{protectionDetail\}/g, protectionDetail)
        .replace(/\{protectionDetail\}/g, protectionDetail);
    };

    item.dialogue = interpolate(item.dialogue);
    item.extraQuestionReply = interpolate(item.extraQuestionReply);
    item.consequenceText = interpolate(item.consequenceText);

    // Динамические флаги
    if (item.id === 'call_ideal_pet_screen_family') {
      item.canTakePair = (a.activeCount >= 2 && a.species === 'cat');
    }

    pool.push(item);
  }

  // Если вдруг пул пуст (например, при экстремальной фильтрации), отдаем безопасный дефолт
  if (!pool.length) {
    pool.push({
      id: 'call_compromise_normal_family',
      caller: 'Обычная семья из Малиновки («Средние ручки» — возможен компромисс)',
      dialogue: `«Здравствуйте! Хотим взять у вас ${singleWord} в двухкомнатную квартиру. Самовыгула не признаем, любить будем всей душой. Кормить планируем обычным Purina One или Brit Care из зоомагазина. ${protectionDetail}, но если подскажете — сделаем по вашим советам!»`,
      extraQuestionReply: '«Мы простые рабочие люди, прошлый питомец прожил у нас 14 лет в тепле и заботе, всегда возили к врачу. Договор подпишем с радостью».',
      isSafe: true,
      isCompromise: true,
      consequenceText: `Ваше кураторское сопровождение сработало на 100%! Семья выполнила все рекомендации по безопасности, вы остались на связи и помогли ${singleWord} адаптироваться!`
    });
  }

  return pool;
}

function triggerRandomAdopterCall() {
  const calls = getDynamicAdopterCalls(state.animal);
  const picked = randomItem(calls);
  triggerIncomingCallModal(picked, false);
}

function ensureCandidateCallSlots(call, a) {
  const g = getAnimalGrammar(a);
  const isDog = g.isDog;
  const singleWord = isDog ? (a.ageCategory === 'puppy' ? 'щенка' : 'собаку') : (a.ageCategory !== 'adult' ? 'котенка' : (a.gender === 'female' ? 'кошку' : 'кота'));

  if (!call.candidateName) {
    if (call.id === 'call_window_fall_fatal') call.candidateName = 'Артем, 24 года';
    else if (call.id === 'call_village_mice_outdoor') call.candidateName = 'Василий, 48 лет';
    else if (call.id === 'call_toddler_toy') call.candidateName = 'Ольга, 27 лет';
    else if (call.id === 'call_anti_spay_aesthetic') call.candidateName = 'Валентина, 52 года';
    else if (call.id === 'call_dorm_secret') call.candidateName = 'Алина, 18 лет (студентка)';
    else if (call.id === 'call_bones_and_pork') call.candidateName = 'Геннадий, 56 лет';
    else if (call.id === 'call_dog_chain_village') call.candidateName = 'Николай, 44 года';
    else if (call.id === 'call_fiv_felv_ignorer') call.candidateName = 'Екатерина, 35 лет';
    else if (call.id === 'call_fake_breed_colorpoint') call.candidateName = 'Светлана, 33 года';
    else if (call.id === 'call_halloween_black_cat') call.candidateName = 'Неизвестный абонент';
    else if (call.id === 'call_compromise_normal_family') call.candidateName = 'Сергей и Елена (Ивановы)';
    else if (call.id === 'call_compromise_pensioner_grandma') call.candidateName = 'Анна Ивановна, 67 лет';
    else if (call.id === 'call_compromise_cottage_owners') call.candidateName = 'Максим и Татьяна';
    else if (call.id === 'call_ideal_pet_screen_family') call.candidateName = 'Дмитрий и Алина (IT-специалисты)';
    else if (call.id === 'call_good_trial_allergy_return') call.candidateName = 'Павел и Виктория, 26 лет';
    else if (call.id === 'call_felv_aware_single_pet') call.candidateName = 'Наталья, 29 лет';
    else if (call.id === 'call_gift_new_year_rush') call.candidateName = 'Кирилл, 21 год (срочно к празднику)';
    else if (call.id === 'call_gift_girlfriend_surprise') call.candidateName = 'Влад, 20 лет';
    else if (call.id === 'scam_courier_prepay') call.candidateName = 'Абонент с трассы («Дальнобойщик»)';
    else if (call.id === 'scam_breeder_metro') call.candidateName = 'Женщина без адреса («Перекупщица»)';
    else call.candidateName = call.caller || 'Кандидат';
  }

  if (!call.housing) {
    if (call.id === 'call_window_fall_fatal') call.housing = '9 этаж, новостройка (Каменная Горка)';
    else if (call.id === 'call_village_mice_outdoor') call.housing = 'Частный сектор (под Слуцком)';
    else if (call.id === 'call_dorm_secret') call.housing = 'Общежитие БГУ (комната на 4 чел.)';
    else if (call.id === 'call_dog_chain_village') call.housing = 'Двор с цепью (Молодечненский р-н)';
    else if (call.id === 'call_compromise_cottage_owners') call.housing = 'Коттедж с огороженным периметром (Колодищи)';
    else if (call.id === 'call_compromise_pensioner_grandma') call.housing = 'Своя 1-комн. кв. (Чижовка)';
    else if (call.id === 'call_ideal_pet_screen_family') call.housing = 'Своя кв. с сетками «Антикошка» (Новая Боровая)';
    else if (call.id === 'call_gift_girlfriend_surprise' || call.id === 'call_gift_new_year_rush') call.housing = 'Съемная квартира (без ведома хозяина)';
    else if (call.id === 'scam_courier_prepay') call.housing = 'Кабина фуры (трасса М1)';
    else if (call.id === 'scam_breeder_metro') call.housing = 'Скрывает домашний адрес (встреча у турникетов)';
    else call.housing = 'Своя квартира (Минск)';
  }

  if (!call.source) {
    if (call.id.includes('ideal') || call.id.includes('felv')) call.source = 'zooshans.by';
    else if (call.id.includes('dorm') || call.id.includes('halloween') || call.id.includes('allergy')) call.source = 'Соцсети';
    else call.source = 'Куфар';
  }

  if (!call.slot1) {
    if (call.id === 'call_window_fall_fatal') {
      call.slot1 = { title: 'Безопасность и окна', text: 'Окна на 9 этаже открываются нараспашку. «Сетки-антикошки ставить не буду, это развод маркетологов. Прошлый кот сорвался за птицей».', flag: 'red' };
    } else if (call.id === 'call_village_mice_outdoor') {
      call.slot1 = { title: 'Безопасность и окна', text: 'Полный самовыгул в деревне. Спит на сеновале или в сарае. Забора нет.', flag: 'red' };
    } else if (call.id === 'call_fake_breed_colorpoint') {
      call.slot1 = { title: 'Безопасность и окна', text: 'Форточка на 1 этаже всегда открыта: «Пусть гуляет по палисаднику».', flag: 'red' };
    } else if (call.id === 'call_ideal_pet_screen_family') {
      call.slot1 = { title: 'Безопасность и окна', text: 'На всех окнах профессиональные стальные сетки «Антикошка» (Pet Screen). Самовыгул исключен.', flag: 'green' };
    } else if (call.id === 'call_felv_aware_single_pet') {
      call.slot1 = { title: 'Безопасность и окна', text: 'Сетки на всех окнах, своя квартира, строгий квартирный режим без контакта с улицей.', flag: 'green' };
    } else if (call.id === 'call_compromise_cottage_owners') {
      call.slot1 = { title: 'Безопасность и окна', text: 'Двойной тамбур на входе, глухой высокий забор на участке, металлические сетки. Выгул на закрытой территории.', flag: 'green' };
    } else if (call.id.includes('compromise')) {
      call.slot1 = { title: 'Безопасность и окна', text: 'Обычные москитные сетки на окнах. «Если подскажете проверенных мастеров — с радостью закажем решетку-антикошку!»', flag: 'yellow' };
    } else if (call.isSafe) {
      call.slot1 = { title: 'Безопасность и окна', text: 'Безопасные окна, сетки установлены, полное понимание опасности падений и побегов.', flag: 'green' };
    } else {
      call.slot1 = { title: 'Безопасность и окна', text: 'Слабые москитные сетки, щелевое проветривание без ограничителей или риск самовыгула.', flag: 'red' };
    }
  }

  if (!call.slot2) {
    if (call.id === 'call_bones_and_pork') {
      call.slot2 = { title: 'Кормление и бюджет на ветеринара', text: '«Кормим жареной свининкой и вареными трубчатыми костями кур. К врачам не возим — химия».', flag: 'red' };
    } else if (call.id === 'call_dog_chain_village') {
      call.slot2 = { title: 'Кормление и бюджет на ветеринара', text: '«Кормим помоями со школьной столовой. Капли от клещей за 35 рублей капать не будем».', flag: 'red' };
    } else if (call.id === 'call_toddler_toy') {
      call.slot2 = { title: 'Кормление и бюджет на ветеринара', text: '«Сдавать аллергопробы заранее не будем — это дорого, проверим на муже вживую».', flag: 'red' };
    } else if (call.id === 'call_ideal_pet_screen_family') {
      call.slot2 = { title: 'Кормление и бюджет на ветеринара', text: 'Корм класса холистик (Grandorf, Farmina). Отложена финансовая подушка безопасности на ветклинику.', flag: 'green' };
    } else if (call.id === 'call_felv_aware_single_pet') {
      call.slot2 = { title: 'Кормление и бюджет на ветеринара', text: 'Знает протокол терапии FeLV, готова закупать супер-премиум корм и Ралтегравир при обострении, наблюдаться у врача.', flag: 'green' };
    } else if (call.id === 'call_compromise_pensioner_grandma') {
      call.slot2 = { title: 'Кормление и бюджет на ветеринара', text: 'Пенсия скромная, но взрослая дочка живет в соседнем подъезде и берет на себя премиум-корм и ветеринарные чекапы.', flag: 'green' };
    } else if (call.isCompromise) {
      call.slot2 = { title: 'Кормление и бюджет на ветеринара', text: 'Качественный корм из зоомагазина (Brit Care / Purina One), прошлый питомец прожил 14 лет при регулярных чекапах.', flag: 'green' };
    } else if (call.isSafe) {
      call.slot2 = { title: 'Кормление и бюджет на ветеринара', text: 'Готовы покупать специализированный корм и оплачивать необходимые ветпроцедуры.', flag: 'green' };
    } else {
      call.slot2 = { title: 'Кормление и бюджет на ветеринара', text: 'Эконом-корма с красителями, остатки со стола, категорический отказ оплачивать ветеринара.', flag: 'red' };
    }
  }

  if (!call.slot3) {
    if (call.id === 'call_anti_spay_aesthetic') {
      call.slot3 = { title: 'Мотивация и договор', text: '«Категорически против стерилизации! Хотим получить потомство для здоровья, а котят раздадим на рынке. Договор не подпишем».', flag: 'red' };
    } else if (call.id === 'call_halloween_black_cat') {
      call.slot3 = { title: 'Мотивация и договор', text: '«Нужен чисто черный кот ночью 30 октября для съемки и ночного ритуала с друзьями. Паспортных данных не дам».', flag: 'red' };
    } else if (call.id === 'call_gift_girlfriend_surprise') {
      call.slot3 = { title: 'Мотивация и договор', text: '«Подарок-сюрприз девушке на съемную квартиру, хозяйка жилья не в курсе. Если будет против — вернем».', flag: 'red' };
    } else if (call.id === 'call_dorm_secret') {
      call.slot3 = { title: 'Мотивация и договор', text: '«Будем прятать животное в тумбочке общежития от коменданта. Если найдут — выбросят».', flag: 'red' };
    } else if (call.id === 'call_ideal_pet_screen_family') {
      call.slot3 = { title: 'Мотивация и договор', text: 'Осознанное решение всей семьи. Сдали аллерготесты заранее. Готовы подписать договор Зоошанса с паспортом и взять сразу парочку!', flag: 'green' };
    } else if (call.id === 'call_good_trial_allergy_return') {
      call.slot3 = { title: 'Мотивация и договор', text: 'Очень хотят помочь бездомышу, подготовили лежанку и ветпаспорт, но честно просят испытательный срок из-за риска аллергии.', flag: 'green' };
    } else if (call.isCompromise) {
      call.slot3 = { title: 'Мотивация и договор', text: 'Ищут верного друга для души. Согласны на официальный договор куратора с паспортными данными и фото-приветы.', flag: 'green' };
    } else if (call.isSafe) {
      call.slot3 = { title: 'Мотивация и договор', text: 'Подписание договора куратора «Зоошанса», согласие на чипирование и ненавязчивое отслеживание судьбы.', flag: 'green' };
    } else {
      call.slot3 = { title: 'Мотивация и договор', text: 'Отказ от кураторского договора, нежелание показывать паспорт, импульсивное решение без подготовки.', flag: 'red' };
    }
  }
}

function triggerIncomingCallModal(callData, isOldOwnerSearch = false) {
  stopTimer();
  ensureCandidateCallSlots(callData, state.animal);
  window.currentCandidateCall = callData;
  callData.slot2Inspected = false;
  callData.slot3Inspected = false;

  const modal = document.getElementById('candidateInterviewModal');
  if (!modal) return;

  // Шапка
  const badgeEl = document.getElementById('candidateBadge');
  if (badgeEl) {
    badgeEl.textContent = isOldOwnerSearch ? '📞 ЗВОНОК ПО ОБЪЯВЛЕНИЮ О НАХОДКЕ' : '📞 ВХОДЯЩИЙ ЗВОНОК «РУЧЕК»';
    badgeEl.className = isOldOwnerSearch
      ? 'craft-badge text-[10px] font-mono uppercase font-bold bg-sky-600 text-white'
      : 'craft-badge text-[10px] font-mono uppercase font-bold bg-emerald-600 text-white';
  }

  const srcEl = document.getElementById('candidateSourceTag');
  if (srcEl) srcEl.textContent = callData.source || 'Куфар';

  const nameHousingEl = document.getElementById('candidateNameHousing');
  if (nameHousingEl) nameHousingEl.textContent = `${callData.candidateName} • ${callData.housing}`;

  // Цитата / диалог
  const dialogueEl = document.getElementById('candidateDialogueText');
  if (dialogueEl) dialogueEl.textContent = callData.dialogue;

  // Слот 1: Безопасность и окна (открыт сразу)
  const slot1Box = document.getElementById('candidateSlot1Box');
  const slot1Text = document.getElementById('candidateSlot1Text');
  const slot1Flag = document.getElementById('candidateSlot1Flag');
  if (slot1Text) slot1Text.textContent = callData.slot1.text;
  if (slot1Flag) {
    const f = callData.slot1.flag;
    slot1Flag.className = `craft-badge text-[10px] font-bold flag--${f}`;
    slot1Flag.textContent = f === 'green' ? '✓ Надежно (+0%)' : (f === 'yellow' ? '⚠️ Компромисс (+15%)' : '🚨 Красный флаг (+75%)');
  }
  if (slot1Box) {
    slot1Box.className = `p-3 rounded-xl border transition flag--${callData.slot1.flag}`;
  }

  // Слот 2: Кормление и бюджет (скрыт по умолчанию)
  const s2Closed = document.getElementById('slot2ClosedView');
  const s2Open = document.getElementById('slot2OpenView');
  const s2Box = document.getElementById('candidateSlot2Box');
  const s2Text = document.getElementById('candidateSlot2Text');
  const s2Flag = document.getElementById('candidateSlot2Flag');
  if (s2Closed) s2Closed.classList.remove('hidden');
  if (s2Open) s2Open.classList.add('hidden');
  if (s2Box) s2Box.className = 'p-3 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-card)] transition';
  if (s2Text) s2Text.textContent = callData.slot2.text;
  if (s2Flag) {
    const f = callData.slot2.flag;
    s2Flag.className = `craft-badge text-[10px] font-bold flag--${f}`;
    s2Flag.textContent = f === 'green' ? '✓ Надежно (+0%)' : (f === 'yellow' ? '⚠️ Компромисс (+15%)' : '🚨 Красный флаг (+75%)');
  }

  // Слот 3: Мотивация и договор (скрыт по умолчанию)
  const s3Closed = document.getElementById('slot3ClosedView');
  const s3Open = document.getElementById('slot3OpenView');
  const s3Box = document.getElementById('candidateSlot3Box');
  const s3Text = document.getElementById('candidateSlot3Text');
  const s3Flag = document.getElementById('candidateSlot3Flag');
  if (s3Closed) s3Closed.classList.remove('hidden');
  if (s3Open) s3Open.classList.add('hidden');
  if (s3Box) s3Box.className = 'p-3 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-card)] transition';
  if (s3Text) s3Text.textContent = callData.slot3.text;
  if (s3Flag) {
    const f = callData.slot3.flag;
    s3Flag.className = `craft-badge text-[10px] font-bold flag--${f}`;
    s3Flag.textContent = f === 'green' ? '✓ Надежно (+0%)' : (f === 'yellow' ? '⚠️ Компромисс (+15%)' : '🚨 Красный флаг (+75%)');
  }

  // Действия в подвале окна
  renderCandidateActionButtons(callData);

  modal.classList.remove('hidden');
}

function renderCandidateActionButtons(callData) {
  const container = document.getElementById('candidateActionButtons');
  if (!container) return;
  container.innerHTML = '';

  const a = state.animal;
  const nActive = a ? (a.activeCount !== undefined ? a.activeCount : (a.count || 1)) : 0;
  const isIntercepted = !!(callData && (callData.intercepted || callData.interceptedByVolunteer));
  const isUnavailable = isIntercepted || nActive <= 0 || (state.zooshans && state.zooshans.locationStatus === 'full_volunteer_fincuration');

  if (isUnavailable) {
    const btnBlocked = document.createElement('button');
    btnBlocked.className = 'px-3.5 py-2 rounded-xl bg-slate-700 text-slate-300 font-bold text-xs opacity-60 cursor-not-allowed border border-slate-600 flex items-center gap-1';
    btnBlocked.disabled = true;
    btnBlocked.textContent = isIntercepted
      ? '❌ Заявка перехвачена другим волонтером'
      : '❌ Животное уже на кураторстве у волонтеров';
    container.appendChild(btnBlocked);
    return;
  }

  if (callData.isScam) {
    const btn = document.createElement('button');
    btn.className = 'px-3.5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs transition cursor-pointer shadow-sm';
    btn.textContent = '✅ Выполнить требование абонента';
    btn.onclick = () => actionAcceptCandidate(false);
    container.appendChild(btn);
  } else if (callData.isCompromise) {
    const btnCompromise = document.createElement('button');
    btnCompromise.className = 'px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs transition cursor-pointer shadow-sm';
    btnCompromise.textContent = '🤝 Компромисс + Сопровождение (-15⚡, 95% успеха)';
    btnCompromise.onclick = () => {
      if (!spendEnergy(15)) return;
      actionAcceptCandidate(false, { isCompromise: true, withSupport: true, successChance: 0.95 });
    };
    container.appendChild(btnCompromise);

    const btnDirect = document.createElement('button');
    btnDirect.className = 'px-3 py-2 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 font-semibold text-xs transition cursor-pointer';
    btnDirect.textContent = 'Отдать без поддержки (Риск возврата 35%)';
    btnDirect.onclick = () => {
      actionAcceptCandidate(false, { isCompromise: true, withSupport: false, successChance: 0.65 });
    };
    container.appendChild(btnDirect);
  } else if (callData.canTakePair) {
    const btnPair = document.createElement('button');
    btnPair.className = 'px-3.5 py-2 rounded-xl bg-purple-700 hover:bg-purple-600 text-white font-extrabold text-xs transition cursor-pointer shadow-sm';
    btnPair.textContent = '😻 Отдать сразу парочку котят на испытательный (14 дн.)';
    btnPair.onclick = () => actionAcceptCandidate(true, { successChance: 0.92 });
    container.appendChild(btnPair);

    const btnSingle = document.createElement('button');
    btnSingle.className = 'px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition cursor-pointer';
    btnSingle.textContent = '✅ Отдать одного на испытательный (14 дн.)';
    btnSingle.onclick = () => actionAcceptCandidate(false, { successChance: 0.92 });
    container.appendChild(btnSingle);
  } else {
    const btnGive = document.createElement('button');
    btnGive.className = 'px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs transition cursor-pointer shadow-sm';
    btnGive.textContent = '🏠 Отдать на испытательный (14 дн.)';
    btnGive.onclick = () => {
      if (!callData.isSafe) {
        actionAcceptCandidate(false, { isRedFlag: true });
      } else if (callData.isTrialReturn) {
        actionAcceptCandidate(false, { isAsthmaReturn: true });
      } else {
        actionAcceptCandidate(false, { successChance: 0.92 });
      }
    };
    container.appendChild(btnGive);
  }
}

function actionInspectCandidateSlot(slotIndex) {
  if (state.gameOver) return;
  const call = window.currentCandidateCall;
  if (!call) return;
  if (!spendEnergy(2)) {
    addLog(`День ${state.day}: Не хватает 2⚡ для уточнения вопросов у кандидата!`, 'warn');
    return;
  }

  if (slotIndex === 2) {
    call.slot2Inspected = true;
    const closed = document.getElementById('slot2ClosedView');
    const open = document.getElementById('slot2OpenView');
    const box = document.getElementById('candidateSlot2Box');
    if (closed) closed.classList.add('hidden');
    if (open) open.classList.remove('hidden');
    if (box) box.className = `p-3 rounded-xl border transition flag--${call.slot2.flag}`;
    addLog(`День ${state.day}: 🔍 Собеседование (-2⚡): уточнены вопросы кормления и ветклиники.`, 'info');
  } else if (slotIndex === 3) {
    call.slot3Inspected = true;
    const closed = document.getElementById('slot3ClosedView');
    const open = document.getElementById('slot3OpenView');
    const box = document.getElementById('candidateSlot3Box');
    if (closed) closed.classList.add('hidden');
    if (open) open.classList.remove('hidden');
    if (box) box.className = `p-3 rounded-xl border transition flag--${call.slot3.flag}`;
    addLog(`День ${state.day}: 🔍 Собеседование (-2⚡): уточнены мотивы и согласие на договор «Зоошанса».`, 'info');
  }
  renderAll();
}

function actionRefuseCandidate() {
  if (state.gameOver) return;
  const call = window.currentCandidateCall;
  closeCandidateModal();
  if (!call) return;

  const hasRevealedRedFlag =
    (call.slot1 && call.slot1.flag === 'red') ||
    (call.slot2Inspected && call.slot2 && call.slot2.flag === 'red') ||
    (call.slot3Inspected && call.slot3 && call.slot3.flag === 'red');

  if (hasRevealedRedFlag) {
    state.filteredBadCalls = (state.filteredBadCalls || 0) + 1;
    state.mental = Math.min(100, state.mental + 3);
    addLog(`День ${state.day}: 🛡️ Бдительность куратора спасла жизнь подопечного: вы вовремя распознали опасный красный флаг и отказали ненадежным ручкам (+3% 🧠)!`, 'success');
  } else {
    state.mental = Math.min(100, state.mental + 1);
    addLog(`День ${state.day}: 🚫 Вы отказали кандидату («${call.candidateName || call.caller}») и решили продолжить поиск более надежной семьи (+1% 🧠).`, 'info');
  }
  renderAll();
}

function actionAcceptCandidate(isPair, options = {}) {
  if (state.gameOver) return;
  const call = window.currentCandidateCall;
  if (!call) return;

  if (call.intercepted || call.interceptedByVolunteer) {
    closeCandidateModal();
    addLog(`День ${state.day}: ⚠️ Заявка уже была перехвачена другим волонтером! Животное передано под опеку «Зоошанса».`, 'warn');
    renderAll();
    return;
  }

  closeCandidateModal();

  if (call.isScam) {
    state.cash = Math.max(0, +(state.cash - (call.scamLossBYN || 80)).toFixed(1));
    state.mental = Math.max(0, state.mental - 35);
    if (typeof checkMentorTriggers === 'function') {
      checkMentorTriggers('SCAM_VICTIM_POSTMORTEM');
    }
    showEventModal('ФИШИНГОВЫЙ РАЗВОД МОШЕННИКОВ', call.consequenceText, [
      { label: 'Горький урок (Продолжить партию)', style: 'danger', action: () => closeEventModal() }
    ]);
    renderAll();
    return;
  }

  const a = state.animal;
  const nActive = a ? (a.activeCount !== undefined ? a.activeCount : (a.count || 1)) : 0;
  if (nActive <= 0 || (state.zooshans && state.zooshans.locationStatus === 'full_volunteer_fincuration')) {
    addLog(`День ${state.day}: ⚠️ Подопечный уже находится под полным кураторством волонтеров «Зоошанса»!`, 'warn');
    renderAll();
    return;
  }

  initiateAnimalTransferWithTrial(isPair, call, options);
}

function markCandidateCallIntercepted(callId = null) {
  const current = window.currentCandidateCall;
  if (current && (!callId || current.id === callId)) {
    current.intercepted = true;
    current.interceptedByVolunteer = true;
    renderCandidateActionButtons(current);
  }
}

function closeCandidateModal() {
  const modal = document.getElementById('candidateInterviewModal');
  if (modal) modal.classList.add('hidden');
}

window.actionInspectCandidateSlot = actionInspectCandidateSlot;
window.actionRefuseCandidate = actionRefuseCandidate;
window.closeCandidateModal = closeCandidateModal;
window.actionAcceptCandidate = actionAcceptCandidate;
window.markCandidateCallIntercepted = markCandidateCallIntercepted;


// 7-ДНЕВНЫЙ ИСПЫТАТЕЛЬНЫЙ СРОК: Передача животного и бронь места на передержке (GDD 8.4, 8.5)
function initiateAnimalTransferWithTrial(isPair, callData, options = {}) {
  if (state.gameOver) return;
  const a = state.animal;
  if (a.inStationaryDaysLeft > 0 || (a.virusRecoveryDaysLeft && a.virusRecoveryDaysLeft > 0) || (a.traumaRehabDaysLeft && a.traumaRehabDaysLeft > 0)) {
    addLog(`День ${state.day}: ⚠️ Животное находится в стационаре или на этапе долечивания/реабилитации перелома! Передача в семью строго отложена до выздоровления.`, 'warn');
    return;
  }
  const countToGive = (isPair && a.activeCount >= 2) ? 2 : 1;

  // Если животное на передержке — предлагаем выбор брони места на время испытательного срока
  const loc = state.zooshans?.locationStatus || '';
  if (!isAnimalAtPlayerHome() && (loc === 'paid_foster' || loc.includes('foster') || loc.includes('volunteer'))) {
    triggerHoldFosterSpotModal(countToGive, callData, options);
  } else {
    finishTransferToTrial(countToGive, callData, options, false);
  }
}

function triggerHoldFosterSpotModal(countToGive, callData, options) {
  stopTimer();
  const a = state.animal;
  const isPaid = state.zooshans.locationStatus === 'paid_foster';
  const isDog = a.species === 'dog';
  const weeklyPaidFee = isDog ? 110 : 55;

  let desc = `Подопечный уезжает на 14-дневный испытательный срок. В реальности передержка не держит пустое место просто так: если питомца вернут, бокс уже займет следующее животное!\n\nЧто делаем с местом на передержке?`;

  const choices = [];

  if (isPaid) {
    choices.push({
      label: `🙏 Придержать место (Оплатить 50% недели простоя: ${weeklyPaidFee} BYN)`,
      style: 'primary',
      action: () => {
        if (state.cash < weeklyPaidFee) {
          addLog(`День ${state.day}: Не хватает личных средств (${state.cash} BYN) на бронь платной передержки (${weeklyPaidFee} BYN)! Место отпущено.`, 'warn');
          finishTransferToTrial(countToGive, callData, options, false);
          return;
        }
        state.cash = +(state.cash - weeklyPaidFee).toFixed(1);
        state.personalMoneySpent = +(state.personalMoneySpent + weeklyPaidFee).toFixed(1);
        addLog(`День ${state.day}: 🤝 Оплачена бронь места на платной передержке на время испытательного срока (-${weeklyPaidFee} BYN). Гарантия возврата сохранена!`, 'info');
        finishTransferToTrial(countToGive, callData, options, true);
      }
    });
  } else {
    choices.push({
      label: '🎁 Подарить коробку конфет / благодарность передержке (15 BYN — 100% бронь места)',
      style: 'primary',
      action: () => {
        if (state.cash < 15) {
          addLog(`День ${state.day}: Не хватает средств на знак благодарности (15 BYN).`, 'warn');
          return;
        }
        state.cash = +(state.cash - 15).toFixed(1);
        state.personalMoneySpent = +(state.personalMoneySpent + 15).toFixed(1);
        addLog(`День ${state.day}: 🍫 Передержка тронута заботой и согласилась придержать бокс на время испытательного срока (100% бронь)!`, 'success');
        finishTransferToTrial(countToGive, callData, options, true);
      }
    });

    choices.push({
      label: '🙏 Попросить передержку словами (-10⚡, 60% шанс согласия)',
      style: 'info',
      action: () => {
        if (!spendEnergy(10)) return;
        if (Math.random() < 0.60) {
          addLog(`День ${state.day}: 🤝 Передержка пошла навстречу и согласилась придержать бокс на время испытательного срока бесплатно!`, 'success');
          finishTransferToTrial(countToGive, callData, options, true);
        } else {
          addLog(`День ${state.day}: ⚠️ У передержки очередь — держать пустое место отказались. Место отпущено.`, 'warn');
          finishTransferToTrial(countToGive, callData, options, false);
        }
      }
    });
  }

  choices.push({
    label: 'Отпустить место на передержке (0 BYN — надеемся на лучшее)',
    style: 'danger',
    action: () => {
      addLog(`День ${state.day}: Место на передержке освобождено для других подопечных.`, 'info');
      finishTransferToTrial(countToGive, callData, options, false);
    }
  });

  showEventModal('БРОНЬ МЕСТА НА ПЕРЕДЕРЖКЕ НА ВРЕМЯ ИСПЫТАТЕЛЬНОГО СРОКА (14 ДНЕЙ)', desc, choices);
}

function finishTransferToTrial(countToGive, callData, options, fosterSpotHeld) {
  const a = state.animal;
  a.activeCount = Math.max(0, a.activeCount - countToGive);
  a.count = a.activeCount;
  a.trialCount = (a.trialCount || 0) + countToGive;

  let assignedPetNames = [];
  const getLitterGender = () => (a.gender === 'mixed' ? (Math.random() < 0.5 ? 'male' : 'female') : a.gender);
  if (countToGive > 1) {
    const n1 = getRandomPetname(getLitterGender());
    let n2 = getRandomPetname(getLitterGender());
    while (n2 === n1) {
      n2 = getRandomPetname(getLitterGender());
    }
    assignedPetNames = [n1, n2];
    addLog(`День ${state.day}: 🏷️ Уезжающим в семью малышам присвоены индивидуальные клички из картотеки «Зоошанса»: «${n1}» и «${n2}»!`, 'info');
  } else {
    let singleName = a.petName;
    if (!singleName || (a.totalCount > 1 || a.initialCount > 1)) {
      singleName = getRandomPetname(getLitterGender());
      addLog(`День ${state.day}: 🏷️ Уезжающему в семью малышу присвоена индивидуальная кличка из картотеки «Зоошанса»: «${singleName}»!`, 'info');
    }
    assignedPetNames = [singleName];
  }

  const assignedPetName = countToGive > 1
    ? `${assignedPetNames[0]} и ${assignedPetNames[1]}`
    : assignedPetNames[0];

  const trialItem = {
    id: Date.now() + Math.floor(Math.random() * 10000),
    petName: assignedPetName,
    petNames: assignedPetNames,
    species: a.species,
    count: countToGive,
    daysPassed: 0,
    trialDaysTotal: 14,
    targetDays: options.isRedFlag ? 4 : 14,
    isRedFlag: !!options.isRedFlag,
    reliabilityFlag: options.isRedFlag ? 'red' : (callData.isCompromise ? 'yellow' : 'green'),
    reliabilityLabel: options.isRedFlag ? '🚨 Высокий риск возврата' : (callData.isCompromise ? '⚠️ Кураторское сопровождение' : '✓ Надежная семья'),
    avatarSvg: typeof buildPetSVG === 'function' ? buildPetSVG(a) : null,
    callData: callData,
    adopterSummary: callData.candidateName ? `${callData.candidateName} (${callData.housing || 'Минск'})` : callData.caller,
    prChannel: callData.source || 'Куфар',
    successChance: options.successChance !== undefined ? options.successChance : 0.92,
    isAsthmaReturn: !!options.isAsthmaReturn,
    fosterSpotHeld: !!fosterSpotHeld,
    fosterLocation: state.zooshans.locationStatus,
    dateStarted: typeof formatCalendarDate === 'function' ? formatCalendarDate(state.calendarDate) : 'Минск'
  };

  state.trialAnimals.push(trialItem);
  if (typeof checkMentorTriggers === 'function') {
    checkMentorTriggers('FIRST_TRIAL_STARTED');
  }

  const displayTarget = countToGive > 1 ? `«${assignedPetName}» (парочка котят)` : `«${assignedPetName}» (подопечный)`;
  addLog(`День ${state.day}: 🚚 ${displayTarget} отправлен(ы) в новый дом на 14-дневный испытательный срок! Бытовой расход корма и энергии снят.`, 'success');

  closeEventModal();
  renderAll();
}

// Завершение спасения (прямой финал без испытательного срока: "Оставить себе")
function completeOneOrPairAdoption(isPair, successStoryText) {
  const a = state.animal;
  const countSaved = (isPair && a.activeCount >= 2) ? 2 : 1;
  a.activeCount = Math.max(0, a.activeCount - countSaved);
  a.count = a.activeCount;
  a.savedCount = (a.savedCount || 0) + countSaved;

  let assignedNames = [];
  const getSaveGender = () => (a.gender === 'mixed' ? (Math.random() < 0.5 ? 'male' : 'female') : a.gender);
  if (countSaved > 1) {
    const n1 = getRandomPetname(getSaveGender());
    let n2 = getRandomPetname(getSaveGender());
    while (n2 === n1) n2 = getRandomPetname(getSaveGender());
    assignedNames = [n1, n2];
  } else {
    assignedNames = [a.petName || getRandomPetname(getSaveGender())];
  }

  assignedNames.forEach((savedPetName, idx) => {
    const tailRecord = {
      id: Date.now() + Math.floor(Math.random() * 10000) + idx,
      petName: savedPetName,
      species: a.species,
      archetypeId: a.id,
      archetypeTitle: a.title,
      coatName: a.coatName,
      coatTier: a.coatTier,
      daysSpent: state.day,
      seasonsPassed: [...state.seasonsPassed],
      adopterSummary: 'Оставлен себе / близким друзьям',
      dateSaved: formatCalendarDate(state.calendarDate),
      personalSpent: state.personalMoneySpent || 0,
      prChannel: 'Личные контакты'
    };
    state.savedTails.push(tailRecord);
    savePetToAlbum(tailRecord);
  });

  const namesStr = assignedNames.map(n => `«${n}»`).join(' и ');
  if (a.savedCount >= (a.totalCount || a.initialCount || 1)) {
    if (a.hasMotherCat && !a.motherSterilized) {
      addLog(`День ${state.day}: ℹ️ Все котята благополучно обрели дом! Но мама-кошка еще не стерилизована — проведите операцию во вкладке «Клиника» для завершения кураторства!`, 'info');
      closeEventModal();
      renderAll();
    } else {
      triggerEndGame(
        true,
        'ПОБЕДА: Подопечный обрел любящий дом навсегда!',
        `${successStoryText}\n\nВы прошли весь путь от растерянного человека с улицы до опытного куратора!`
      );
    }
  } else {
    const logMsg = countSaved > 1
      ? `День ${state.day}: 🏠 Подопечные (${namesStr}) обрели постоянный дом! На руках осталось: ${a.activeCount}.`
      : `День ${state.day}: 🏠 Подопечный (${namesStr}) обрел постоянный дом! На руках осталось: ${a.activeCount}.`;
    addLog(logMsg, 'success');
    closeEventModal();
    renderAll();
  }
}
