// adopters.js - Пул звонков ручек, собеседования, фильтрация и пристройство (v2.2)

function getDynamicScammerCalls(a) {
  const g = getAnimalGrammar(a);
  return [
    {
      id: 'scam_courier_prepay',
      caller: 'Мужской голос с помехами рации («Дальнобойщик»)',
      dialogue: `«Здорово, куратор! Я на фуре под Барановичами, это точно наш породистый кот, узнал по пятну! Забрать сам не успеваю — переведите 45 BYN курьеру на страховку доставки, а я вечером верну вам 200 BYN вознаграждения!»`,
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

function getDynamicAdopterCalls(a) {
  const g = getAnimalGrammar(a);
  const isDog = g.isDog;
  const singleWord = isDog ? (a.ageCategory === 'puppy' ? 'щенка' : 'собаку') : (a.ageCategory !== 'adult' ? 'котенка' : (a.gender === 'female' ? 'кошку' : 'кота'));

  const pool = [
    // 1. Игрушка для ребенка 2 лет
    {
      id: 'call_toddler_toy',
      caller: 'Молодая мама на фоне громкого детского плача',
      dialogue: `«Здравствуйте! Моему сыночку на 2 годика срочно нужна живая игрушка, он увидел ${singleWord} в мультике и требует! Главное, чтобы питомец терпел, когда малыш тянет за хвост и уши. Если поцарапает — сразу выставим за дверь. И у мужа вроде аллергия была, но надеемся, пронесет!»`,
      extraQuestionReply: `«Сдавать аллергопробы заранее мы не будем — это дорого, проще взять ${singleWord} и проверить на муже вживую».`,
      isSafe: false,
      consequenceText: `Вы отдали ${singleWord} как живую игрушку для двухлетнего ребенка. Через 3 дня малыш больно дернул питомца за хвост, испугался реакции, и родители выставили животное на мороз.`
    },

    // 2. Противники стерилизации
    {
      id: 'call_anti_spay_aesthetic',
      caller: 'Интеллигентная женщина из центра Минска',
      dialogue: `«Добрый день! Какое чудо на фото! Только скажите, вы ведь против варварских операций по стерилизации? Мы хотим обязательно получить потомство хотя бы пару раз для здоровья, а котят раздадим добрым людям на рынке!»`,
      extraQuestionReply: '«Кормить планируем тем, что сами едим: супчиком, вареной колбасой и трубчатыми костями. Паспортных данных для договора я давать не буду».',
      isSafe: false,
      consequenceText: 'Отказ от стерилизации привел к плодильничеству, пиометре и новым коробкам с брошенными малышами у мусорных баков.'
    },

    // 3. Съемная комната / подарок сюрпризом (перед Новым годом риск выше!)
    {
      id: 'call_gift_girlfriend_surprise',
      caller: 'Торопящийся парень у метро',
      dialogue: `«Здорово! Мне срочно нужен ${singleWord} в подарок девушке на годовщину через 2 часа! Она на съемной квартире живет, хозяин вроде не в курсе, но это же сюрприз!»`,
      extraQuestionReply: '«Девушка не знает, я не спрашивал. Если хозяйка квартиры будет против — вернем вам или отдадим кому-нибудь».',
      isSafe: false,
      consequenceText: 'Животные в подарок сюрпризом — главный источник выброшенцев. Хозяйка съемного жилья выставила девушку с коробкой на лестницу.'
    },

    // 4. Студенческое общежитие
    {
      id: 'call_dorm_secret',
      caller: 'Шепчущая студентка 1 курса',
      dialogue: `«Здравствуйте! Мы с соседкой по комнате в общежитии БГУ решили завести ${singleWord}. Будем прятать его в шкафу во время обхода коменданта и вахтерши!»`,
      extraQuestionReply: '«Если комендант заметит — выкинет на улицу за 5 минут, но мы будем осторожны!»',
      isSafe: false,
      consequenceText: 'Во время внезапной проверки комендант общежития нашла животное в тумбочке и выставила переноску на улицу в дождь.'
    },

    // 5. Трубчатые кости и свинина
    {
      id: 'call_bones_and_pork',
      caller: 'Мужчина солидного возраста',
      dialogue: `«День добрый. Мы кормим по старинке натуралкой: жареной свининкой со сковороды, солеными огурцами и вареными трубчатыми костями кур. Прошлый кот до 2.5 лет дожил, потом почему-то от старости умер».`,
      extraQuestionReply: '«К ветеринарам возить не привыкли, химия все это. Бабушка зверобоем лечила и мы так лечим».',
      isSafe: false,
      consequenceText: 'Трубчатые куриные кости разорвали кишечник животного. Экстренная операция в клинике не спасла от перитонита.'
    },

    // 6. СРЕДНИЕ РУЧКИ А: Обычная семья из Малиновки (Компромисс)
    {
      id: 'call_compromise_normal_family',
      caller: 'Обычная семья из Малиновки («Средние ручки» — возможен компромисс)',
      dialogue: `«Здравствуйте! Хотим взять у вас ${singleWord} в двухкомнатную квартиру. Самовыгула не признаем, любить будем всей душой. Кормить планируем обычным Purina One или Brit Care из зоомагазина. ${isDog ? 'Адресник еще не заказали' : 'Сетки-антикошки пока не ставили, пользуемся гребенками'}, но если подскажете — сделаем по вашим советам!»`,
      extraQuestionReply: '«Мы простые рабочие люди, прошлый питомец прожил у нас 14 лет в тепле и заботе, всегда возили к врачу. Договор подпишем с радостью».',
      isSafe: true,
      isCompromise: true,
      consequenceText: `Ваше кураторское сопровождение сработало на 100%! Семья выполнила все рекомендации по безопасности, вы остались на связи и помогли ${singleWord} адаптироваться!`
    },

    // 8. СРЕДНИЕ РУЧКИ Б: Пенсионерка Анна Ивановна (Компромисс)
    {
      id: 'call_compromise_pensioner_grandma',
      caller: 'Добрая пенсионерка Анна Ивановна (64 года, «Средние ручки»)',
      dialogue: `«Добрый день, деточка! Живу одна в своей квартире, очень тоскливо без живой души. На дачу не езжу, окна закрыты сеткой. Пенсия скромная, но на корм всегда отложу. Если нужно везти в клинику — взрослая дочка живет рядом и во всем помогает!»`,
      extraQuestionReply: '«Дочка прямо сейчас рядом, оформит договор на себя и всегда подстрахует машиной и финансами!»',
      isSafe: true,
      isCompromise: true,
      consequenceText: 'Идеальный союз заботливой бабушки и надежной страховки взрослой дочки! Питомец живет в тепле и любви.'
    },

    // 9. СРЕДНИЕ РУЧКИ В: Коттедж в Колодищах (Компромисс)
    {
      id: 'call_compromise_cottage_owners',
      caller: 'Семья из круглогодичного коттеджа в Колодищах («Средние ручки»)',
      dialogue: `«Добрый день! У нас свой огороженный дом в Колодищах. Ищем любимца строго для проживания внутри дома. Во дворе высокий глухой забор на фундаменте, тамбур с двойными дверями. Сетки металлические».`,
      extraQuestionReply: '«Мы готовы купить анатомическую шлейку с адресником для выгула на участке и присылать фото-приветы каждые выходные».',
      isSafe: true,
      isCompromise: true,
      consequenceText: 'Отличный частный дом без самовыгула! Хозяева прислали видео счастливого питомца в просторной гостиной у камина.'
    },

    // 10. Честный возврат с испытательного срока (астма, 8% у идеальных)
    {
      id: 'call_good_trial_allergy_return',
      caller: 'Адекватная молодая пара (по договору с испытательным сроком)',
      dialogue: `«Здравствуйте! Очень хотим забрать у вас ${singleWord}. Мы подготовили миски, лежанку, хороший корм супер-премиум и безопасные окна. С договором согласны! Давайте оговорим честный испытательный срок».`,
      extraQuestionReply: 'Ребята прислали видео квартиры и купленного корма. Всё выглядит очень ответственно.',
      isSafe: true,
      isTrialReturn: true,
      consequenceText: `На 6-й день ребята позвонили в слезах: у мужа началась острая бронхиальная астма (прислали заключение пульмонолога). По договору об испытательном сроке они бережно привезли ${singleWord} обратно, передали мешок корма и 85 BYN на передержку. Это рабочий момент — продолжаем поиск!`
    },

    // 11. Идеальные ручки мечты (Pet Screen, могут взять пару)
    {
      id: 'call_ideal_pet_screen_family',
      caller: 'Осознанная молодая семья программистов',
      dialogue: `«Добрый день! Мы давно следим за деятельностью «Зоошанса». У нас своя квартира, на всех окнах установлены профессиональные металлические сетки «Антикошка» (Pet Screen). Кормим суперпремиумом, договор куратора подпишем и чипируем!»`,
      extraQuestionReply: '«Мы сдали аллергопанель заранее, отложили подушку безопасности на клинику. Если у вас выводок — мы с радостью возьмем сразу парочку котят, чтобы им не было скучно!»',
      isSafe: true,
      isTrialReturn: false,
      canTakePair: a.activeCount >= 2 && a.species === 'cat',
      consequenceText: 'Идеальные хозяева мечты! У питомца свой мягкий домик, когтеточка до потолка, регулярные чекапы и бесконечная любовь.'
    }
  ];

  // Специфические для собак звонки
  if (isDog) {
    pool.push({
      id: 'call_dog_chain_village',
      caller: 'Грубоватый голос из райцентра',
      dialogue: '«Собаку заберу во двор в деревню под Молодечно. Посадим на глухую двухметровую цепь у будки охранять забор. Кормим помоями со школьной столовой».',
      extraQuestionReply: '«От клещей капли за 30 рублей капать не будем, дегтярным мылом помоем и хватит с нее».',
      isSafe: false,
      consequenceText: 'Цепное содержание без обработок привело к заражению пироплазмозом от иксодовых клещей первой же весной. Собака сгорела за 3 дня без лечения.'
    });
  } else {
    // Специфические для кошек звонки
    pool.push(
      {
        id: 'call_village_mice_outdoor',
        caller: 'Мужчина с шумом трактора на заднем плане',
        dialogue: `«Алло, заберу в деревню под Слуцк ловить мышей! Спать будет на сеновале, кормим кашей с ливеркой. Прошлый кот весной куда-то ушел и не вернулся, вот нового ищем».`,
        extraQuestionReply: '«Какая еще стерилизация и прививки в деревне? Кто за это деньги платит? Заболеет — естественный отбор!»',
        isSafe: false,
        consequenceText: `Самовыгул в деревне без прививок закончился предсказуемо: через 3 месяца питомец погиб под колесами трактора или от зубов диких лис.`
      },
      {
        id: 'call_window_fall_fatal',
        caller: 'Молодой человек, 9 этаж в новостройке',
        dialogue: `«Привет! Заберу кота. Живу один на 9 этаже. Окна летом открываю настежь, свежий воздух нужен! Прошлый кот упал за птицей, но этот же будет умнее, правда?»`,
        extraQuestionReply: '«Сетки-антикошки ставить не собираюсь, это развод маркетологов, животные чувствуют опасность».',
        isSafe: false,
        consequenceText: 'Через 4 дня открытое окно на 9 этаже унесло жизнь. Падение с высоты, разрыв внутренних органов, летальный исход.'
      },
      {
        id: 'call_fiv_felv_ignorer',
        caller: 'Хозяйка нескольких непривитых котов',
        dialogue: `«Ой, какой красавец! Возьмем вторым котиком к нашему Ваське. Васька не привит, на улице дрался, но они подружатся, я уверена!»`,
        extraQuestionReply: '«Анализы на ВИК/ВЛК мне не интересны, у нас все коты общие миски облизывают».',
        isSafe: false,
        consequenceText: 'Совместное содержание с непривитыми котами привело к драке и фатальному заражению хозяйского питомца ретровирусом.'
      }
    );

    // Колор-пойнт / породистая разведенка (только для фенотипов пойнтов и породистых)
    if (a.coatId === 'colorpoint' || a.coatId === 'purebred') {
      pool.push({
        id: 'call_fake_breed_colorpoint',
        caller: 'Любительница халявной породы',
        dialogue: '«Ой, какой тайский красавец! Мы всегда мечтали о породистом котике бесплатно! Будем вязать с кошечкой подруги, а кормить свежей сырой речной рыбкой с рынка».',
        extraQuestionReply: '«Зачем кастрировать? Природа требует! И форточку на 1 этаже мы не закрываем, пусть гуляет».',
        isSafe: false,
        consequenceText: 'Бесконтрольные вязки, гельминтозы от сырой рыбы и гибель на самовыгуле через форточку первого этажа.'
      });
    }

    // С 15 по 31 октября для чисто черных котов — триггер сектантов/Хэллоуина (GDD 2.2, 8.4)
    const calMonth = state.calendarDate.getMonth();
    const calDay = state.calendarDate.getDate();
    if (a.coatId === 'black' && calMonth === 9 && calDay >= 15 && calDay <= 31) {
      pool.push({
        id: 'call_halloween_black_cat',
        caller: 'Мутный парень поздно ночью 30 октября',
        dialogue: '«Слышь, мне чисто черного кота надо прямо сейчас, ночью 30 октября. Для фотосессии и ритуала с друзьями. Паспортных данных не дам».',
        extraQuestionReply: '«Какая разница, что мы ночью делать будем? Деньги плачу, отдавай кота!»',
        isSafe: false,
        consequenceText: 'Черные коты перед Хэллоуином находятся под строжайшим мораторием волонтеров из-за высокого риска живодерства и ритуальных издевательств.'
      });
    }
  }

  // С 15 по 31 декабря — всплеск импульсивных звонков к Новому году (GDD 2.2)
  const cMonth = state.calendarDate.getMonth();
  const cDay = state.calendarDate.getDate();
  if (cMonth === 11 && cDay >= 15 && cDay <= 31) {
    pool.push({
      id: 'call_gift_girlfriend_surprise',
      caller: 'Торопящийся парень у елочного базара (Новогодний ажиотаж!)',
      dialogue: `«Здорово! Срочно нужен ${singleWord} под новогоднюю елку девушке/детям в подарок! До боя курантов пару дней, все раскупили, выручайте!»`,
      extraQuestionReply: '«Мы еще не решили, кто будет гулять и убирать, главное — подарок под елочку положить!»',
      isSafe: false,
      consequenceText: 'Животные в подарок «под елочку» — лидеры январских выбросов на мороз, когда праздники заканчиваются.'
    });
  }

  return pool;
}

function triggerRandomAdopterCall() {
  const calls = getDynamicAdopterCalls(state.animal);
  const picked = randomItem(calls);
  triggerIncomingCallModal(picked, false);
}

function triggerIncomingCallModal(callData, isOldOwnerSearch = false) {
  stopTimer();
  const overlay = document.getElementById('eventOverlayBox');
  const dash = document.getElementById('actionsDashboard');
  const extraBox = document.getElementById('extraQuestionBox');

  overlay.classList.remove('hidden');
  overlay.classList.add('flex');
  dash.classList.add('hidden');
  extraBox.classList.add('hidden');

  document.getElementById('eventBadge').textContent = isOldOwnerSearch ? '📞 ЗВОНОК ПО ОБЪЯВЛЕНИЮ О НАХОДКЕ' : '📞 ВХОДЯЩИЙ ЗВОНОК «РУЧЕК»';
  document.getElementById('eventBadge').className = isOldOwnerSearch ? 'text-xs font-mono uppercase px-2 py-0.5 rounded bg-sky-500 text-slate-950 font-bold' : 'text-xs font-mono uppercase px-2 py-0.5 rounded bg-emerald-500 text-slate-950 font-bold';
  document.getElementById('eventTitle').textContent = callData.caller;
  document.getElementById('eventBody').textContent = callData.dialogue;

  const choicesDiv = document.getElementById('eventChoicesContainer');
  choicesDiv.innerHTML = '';

  // 1. Кнопка «Задать уточняющие вопросы (-5⚡)»
  const btnAsk = document.createElement('button');
  btnAsk.className = 'px-3.5 py-2.5 rounded-lg text-xs sm:text-sm bg-slate-800 hover:bg-slate-700 text-white border border-slate-600 transition text-left';
  btnAsk.textContent = '🔍 Задать уточняющие вопросы (-5⚡)';
  btnAsk.onclick = () => {
    if (!spendEnergy(5)) return;
    extraBox.classList.remove('hidden');
    extraBox.innerHTML = `<strong>Ответ абонента на уточнения:</strong><br>${callData.extraQuestionReply}`;
    btnAsk.disabled = true;
    btnAsk.classList.add('opacity-50', 'cursor-not-allowed');
  };
  choicesDiv.appendChild(btnAsk);

  // 2. Кнопка «Отказать (Красный флаг / Подозрительно)»
  const btnRefuse = document.createElement('button');
  btnRefuse.className = 'px-3.5 py-2.5 rounded-lg text-xs sm:text-sm bg-rose-900/80 hover:bg-rose-800 text-rose-200 border border-rose-500 transition text-left font-bold';
  btnRefuse.textContent = '❌ Отказать (Красный флаг / Подозрительно)';
  btnRefuse.onclick = () => {
    state.filteredBadCalls += 1;
    state.mental = Math.min(100, state.mental + 2);
    addLog(`День ${state.day}: 🚫 Вы вежливо отказали подозрительному абоненту («${callData.caller}»). Интуиция куратора не подвела (+2% Менталки)!`, 'info');
    closeEventModal();
  };
  choicesDiv.appendChild(btnRefuse);

  // 3. Варианты согласия
  if (callData.isScam) {
    const btnScam = document.createElement('button');
    btnScam.className = 'px-3.5 py-2.5 rounded-lg text-xs sm:text-sm bg-amber-600 hover:bg-amber-500 text-slate-950 font-bold transition text-left col-span-1 sm:col-span-2';
    btnScam.textContent = '✅ Согласиться и выполнить требование абонента';
    btnScam.onclick = () => {
      state.cash = Math.max(0, +(state.cash - (callData.scamLossBYN || 80)).toFixed(1));
      state.mental = Math.max(0, state.mental - 35);
      showEventModal('ФИШИНГОВЫЙ РАЗВОД МОШЕННИКОВ', callData.consequenceText, [
        { label: 'Горький урок (Продолжить партию)', style: 'danger', action: () => closeEventModal() }
      ]);
    };
    choicesDiv.appendChild(btnScam);

  } else if (callData.isCompromise) {
    // Механика Компромисса (GDD 8.4)
    const btnCompromise = document.createElement('button');
    btnCompromise.className = 'px-3.5 py-2.5 rounded-lg text-xs sm:text-sm bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-extrabold transition text-left col-span-1 sm:col-span-2';
    btnCompromise.textContent = '🤝 Пойти на компромисс + Кураторское сопровождение (-15⚡, 95% успеха)';
    btnCompromise.onclick = () => {
      if (!spendEnergy(15)) return;
      initiateAnimalTransferWithTrial(false, callData, { isCompromise: true, withSupport: true, successChance: 0.95 });
    };
    choicesDiv.appendChild(btnCompromise);

    const btnDirectGive = document.createElement('button');
    btnDirectGive.className = 'px-3.5 py-2.5 rounded-lg text-xs sm:text-sm bg-amber-600 hover:bg-amber-500 text-slate-950 font-bold transition text-left';
    btnDirectGive.textContent = 'Отдать без сопровождения (Риск возврата 35%)';
    btnDirectGive.onclick = () => {
      initiateAnimalTransferWithTrial(false, callData, { isCompromise: true, withSupport: false, successChance: 0.65 });
    };
    choicesDiv.appendChild(btnDirectGive);

  } else if (callData.canTakePair) {
    // Идеальные ручки могут забрать парочку (22% шанс, GDD 8.4)
    const btnPair = document.createElement('button');
    btnPair.className = 'px-3.5 py-2.5 rounded-lg text-xs sm:text-sm bg-purple-600 hover:bg-purple-500 text-white font-extrabold transition text-left';
    btnPair.textContent = '😻 Отдать сразу парочку котят вместе (2 хвостика в один дом!)';
    btnPair.onclick = () => {
      initiateAnimalTransferWithTrial(true, callData, { successChance: 0.92 });
    };
    choicesDiv.appendChild(btnPair);

    const btnSingle = document.createElement('button');
    btnSingle.className = 'px-3.5 py-2.5 rounded-lg text-xs sm:text-sm bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-extrabold transition text-left';
    btnSingle.textContent = '✅ Отдать одного котенка по договору куратора';
    btnSingle.onclick = () => {
      initiateAnimalTransferWithTrial(false, callData, { successChance: 0.92 });
    };
    choicesDiv.appendChild(btnSingle);

  } else {
    // Обычное согласие (для надежных или красных флагов)
    const btnGive = document.createElement('button');
    btnGive.className = 'px-3.5 py-2.5 rounded-lg text-xs sm:text-sm bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-extrabold transition text-left col-span-1 sm:col-span-2';
    btnGive.textContent = '✅ Согласиться и передать животное';
    btnGive.onclick = () => {
      if (!callData.isSafe) {
        // Красный флаг: отложенный удар через 4 дня тишины (GDD 8.4)
        initiateAnimalTransferWithTrial(false, callData, { isRedFlag: true });
      } else if (callData.isTrialReturn) {
        // Честный сценарий с аллергией
        initiateAnimalTransferWithTrial(false, callData, { isAsthmaReturn: true });
      } else {
        initiateAnimalTransferWithTrial(false, callData, { successChance: 0.92 });
      }
    };
    choicesDiv.appendChild(btnGive);
  }
}

// 7-ДНЕВНЫЙ ИСПЫТАТЕЛЬНЫЙ СРОК: Передача животного и бронь места на передержке (GDD 8.4, 8.5)
function initiateAnimalTransferWithTrial(isPair, callData, options = {}) {
  const a = state.animal;
  const countToGive = (isPair && a.activeCount >= 2) ? 2 : 1;

  // Если животное на передержке — предлагаем выбор брони места на время испытательного срока
  if (!isAnimalAtPlayerHome() && (state.zooshans.locationStatus === 'paid_foster' || state.zooshans.locationStatus.includes('foster') || state.zooshans.locationStatus.includes('volunteer'))) {
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

  let desc = `Подопечный уезжает на 7-дневный испытательный срок. В реальности передержка не держит пустое место просто так: если питомца вернут, бокс уже займет следующее животное!\n\nЧто делаем с местом на передержке?`;

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
        addLog(`День ${state.day}: 🤝 Оплачена бронь места на платной передержке на 7 дней (-${weeklyPaidFee} BYN). Гарантия возврата сохранена!`, 'info');
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
        addLog(`День ${state.day}: 🍫 Передержка тронута заботой и согласилась придержать бокс на 7 дней (100% бронь)!`, 'success');
        finishTransferToTrial(countToGive, callData, options, true);
      }
    });

    choices.push({
      label: '🙏 Попросить передержку словами (-10⚡, 60% шанс согласия)',
      style: 'info',
      action: () => {
        if (!spendEnergy(10)) return;
        if (Math.random() < 0.60) {
          addLog(`День ${state.day}: 🤝 Передержка пошла навстречу и согласилась придержать бокс на 7 дней бесплатно!`, 'success');
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

  showEventModal('БРОНЬ МЕСТА НА ПЕРЕДЕРЖКЕ НА 7 ДНЕЙ ИСПЫТАТЕЛЬНОГО СРОКА', desc, choices);
}

function finishTransferToTrial(countToGive, callData, options, fosterSpotHeld) {
  const a = state.animal;
  a.activeCount = Math.max(0, a.activeCount - countToGive);
  a.count = a.activeCount;
  a.trialCount = (a.trialCount || 0) + countToGive;

  const trialItem = {
    id: Date.now() + Math.random(),
    petName: a.petName,
    species: a.species,
    count: countToGive,
    daysPassed: 0,
    targetDays: options.isRedFlag ? 4 : 7,
    isRedFlag: !!options.isRedFlag,
    callData: callData,
    adopterSummary: callData.caller,
    successChance: options.successChance !== undefined ? options.successChance : 0.92,
    isAsthmaReturn: !!options.isAsthmaReturn,
    fosterSpotHeld: !!fosterSpotHeld,
    fosterLocation: state.zooshans.locationStatus
  };

  state.trialAnimals.push(trialItem);

  addLog(`День ${state.day}: 🚚 «${a.petName}» (${countToGive > 1 ? 'парочка котят' : 'подопечный'}) отправлен(ы) в новый дом на 7-дневный испытательный срок! Быт временно снят.`, 'success');

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
    adopterSummary: 'Оставлен себе / близким друзьям',
    dateSaved: formatCalendarDate(state.calendarDate)
  };
  state.savedTails.push(tailRecord);
  savePetToAlbum(tailRecord);

  if (a.savedCount >= (a.totalCount || a.initialCount || 1)) {
    triggerEndGame(
      true,
      'ПОБЕДА: Подопечный обрел любящий дом навсегда!',
      `${successStoryText}\n\nВы прошли весь путь от растерянного человека с улицы до опытного куратора!`
    );
  } else {
    addLog(`День ${state.day}: 🏠 Подопечный («${a.petName}») обрел постоянный дом! На руках осталось: ${a.activeCount}.`, 'success');
    closeEventModal();
    renderAll();
  }
}
