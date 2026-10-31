// adopters.js - Пул звонков ручек, собеседования, фильтрация и пристройство (v2.0)

function getDynamicScammerCalls(a) {
  const g = getAnimalGrammar(a);
  return [
    {
      id: 'scam_courier_prepayment',
      caller: 'Мужской голос с помехами рации («Дальнобойщик»)',
      dialogue: `«Здорово, куратор! Я на фуре под Барановичами, это точно наш породистый кот, узнал по пятну! Забрать сам не успеваю — переведите 45 BYN курьеру на страховку доставки, а я вечером верну вам 200 BYN вознаграждения!»`,
      extraQuestionReply: `На просьбу назвать особые приметы или скинуть фото в Вайбер мужчина начинает кричать: «Вы что, на чужом горе нажиться хотите?! У меня роуминг, переводите курьеру быстрей на номер!»`,
      isSafe: false,
      isScam: true,
      scamLossBYN: 80,
      consequenceText: `Классический фишинговый развод мошенников! Вы перешли по ссылке «на страховку курьера», с карты списали 80 BYN (-35% Менталки), а номер абонента стал недоступен. Ни курьера, ни хозяина не существовало.`
    },
    {
      id: 'scam_reseller_no_proof',
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
      consequenceText: `Вы отдали ${singleWord} как живую игрушку для двухлетнего ребенка. Через 2 дня малыш больно дернул питомца за хвост, испугался реакции, и родители выставили животное на мороз.`
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

    // 3. Съемная комната / подарок сюрпризом
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

    // 6. Игнорирование ВИК/ВЛК
    {
      id: 'call_fiv_felv_ignorer',
      caller: 'Хозяйка нескольких непривитых котов',
      dialogue: `«Ой, какой красавец! Возьмем вторым котиком к нашему Ваське. Васька не привит, на улице дрался, но они подружатся, я уверена!»`,
      extraQuestionReply: '«Анализы на ВИК/ВЛК мне не интересны, у нас все коты общие миски облизывают».',
      isSafe: false,
      consequenceText: 'Совместное содержание с непривитыми котами привело к драке и фатальному заражению хозяйского питомца ретровирусом.'
    },

    // 7. СРЕДНИЕ РУЧКИ А: Обычная семья из Малиновки (Компромисс)
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
      id: 'call_compromise_pensioner_with_daughter',
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

    // 10. Честный возврат с испытательного срока (астма)
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
      id: 'call_perfect_forever_home',
      caller: 'Осознанная молодая семья программистов',
      dialogue: `«Добрый день! Мы давно следим за деятельностью «Зоошанса». У нас своя квартира, на всех окнах установлены профессиональные металлические сетки «Антикошка» (Pet Screen). Кормим суперпремиумом, договор куратора подпишем и чипируем!»`,
      extraQuestionReply: '«Мы сдали аллергопанель заранее, отложили подушку безопасности на клинику. Если у вас выводок — мы с радостью возьмем сразу парочку котят, чтобы им не было скучно!»',
      isSafe: true,
      isTrialReturn: false,
      canTakePair: a.count >= 2 && a.species === 'cat',
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
    // Специфические для кошек
    pool.push(
      {
        id: 'call_village_mousetrap',
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
        consequenceText: 'Через 3 недели открытое окно на 9 этаже унесло жизнь. Падение с высоты, разрыв внутренних органов, летальный исход.'
      },
      {
        id: 'call_fake_breed_colorpoint',
        caller: 'Любительница халявной породы',
        dialogue: '«Ой, какой тайский красавец! Мы всегда мечтали о породистом котике бесплатно! Будем вязать с кошечкой подруги, а кормить свежей сырой речной рыбкой с рынка».',
        extraQuestionReply: '«Зачем кастрировать? Природа требует! И форточку на 1 этаже мы не закрываем, пусть гуляет».',
        isSafe: false,
        consequenceText: 'Бесконтрольные вязки, гельминтозы от сырой рыбы и гибель на самовыгуле через форточку первого этажа.'
      },
      {
        id: 'call_halloween_black_cat',
        caller: 'Мутный парень поздно ночью 30 октября',
        dialogue: '«Слышь, мне чисто черного кота надо прямо сейчас, ночью 30 октября. Для фотосессии и ритуала с друзьями. Паспортных данных не дам».',
        extraQuestionReply: '«Какая разница, что мы ночью делать будем? Деньги плачу, отдавай кота!»',
        isSafe: false,
        consequenceText: 'Черные коты перед Хэллоуином находятся под строжайшим мораторием волонтеров из-за высокого риска живодерства и ритуальных издевательств.'
      }
    );
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
  if (callData.isCompromise) {
    // Механика Компромисса (GDD 8.4)
    const btnCompromise = document.createElement('button');
    btnCompromise.className = 'px-3.5 py-2.5 rounded-lg text-xs sm:text-sm bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-extrabold transition text-left col-span-1 sm:col-span-2';
    btnCompromise.textContent = '🤝 Пойти на компромисс + Кураторское сопровождение (-15⚡, 95% успеха)';
    btnCompromise.onclick = () => {
      if (!spendEnergy(15)) return;
      // 95% успех
      if (Math.random() < 0.95) {
        completeOneOrPairAdoption(false, callData.consequenceText);
      } else {
        // 5% редкий возврат
        state.cash = +(state.cash + 50).toFixed(1);
        addLog(`День ${state.day}: Бытовой возврат: у хозяев возникли непредвиденные обстоятельства. Они честно привезли питомца обратно с кормом и 50 BYN. Продолжаем пиар!`, 'warn');
        closeEventModal();
      }
    };
    choicesDiv.appendChild(btnCompromise);

    const btnDirectGive = document.createElement('button');
    btnDirectGive.className = 'px-3.5 py-2.5 rounded-lg text-xs sm:text-sm bg-amber-600 hover:bg-amber-500 text-slate-950 font-bold transition text-left';
    btnDirectGive.textContent = 'Отдать без сопровождения (Риск возврата 35%)';
    btnDirectGive.onclick = () => {
      if (Math.random() < 0.65) {
        completeOneOrPairAdoption(false, 'Семья справилась сама, питомец прижился в новом доме!');
      } else {
        state.mental = Math.max(0, state.mental - 15);
        addLog(`День ${state.day}: ↩️ Бытовой возврат! Без вашего кураторского сопровождения семья не справилась с адаптацией и вернула питомца через неделю (-15% Менталки).`, 'danger');
        closeEventModal();
      }
    };
    choicesDiv.appendChild(btnDirectGive);

  } else if (callData.canTakePair) {
    // Идеальные ручки могут забрать парочку (22% шанс, GDD 8.4)
    const btnPair = document.createElement('button');
    btnPair.className = 'px-3.5 py-2.5 rounded-lg text-xs sm:text-sm bg-purple-600 hover:bg-purple-500 text-white font-extrabold transition text-left';
    btnPair.textContent = '😻 Отдать сразу парочку котят вместе (2 хвостика в один дом!)';
    btnPair.onclick = () => {
      completeOneOrPairAdoption(true, 'Чудо пристройства: отличная семья забрала сразу двоих котят вместе! Малыши не разлучаются и счастливы в новом доме.');
    };
    choicesDiv.appendChild(btnPair);

    const btnSingle = document.createElement('button');
    btnSingle.className = 'px-3.5 py-2.5 rounded-lg text-xs sm:text-sm bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-extrabold transition text-left';
    btnSingle.textContent = '✅ Отдать одного котенка по договору куратора';
    btnSingle.onclick = () => {
      completeOneOrPairAdoption(false, callData.consequenceText);
    };
    choicesDiv.appendChild(btnSingle);

  } else {
    // Обычное согласие
    const btnGive = document.createElement('button');
    btnGive.className = 'px-3.5 py-2.5 rounded-lg text-xs sm:text-sm bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-extrabold transition text-left col-span-1 sm:col-span-2';
    btnGive.textContent = '✅ Согласиться и передать животное';
    btnGive.onclick = () => {
      if (!callData.isSafe) {
        if (callData.isScam) {
          state.cash = Math.max(0, +(state.cash - (callData.scamLossBYN || 80)).toFixed(1));
          state.mental = Math.max(0, state.mental - 35);
          showEventModal('ФИШИНГОВЫЙ РАЗВОД МОШЕННИКОВ', callData.consequenceText, [
            { label: 'Горький урок (Продолжить партию)', style: 'danger', action: () => closeEventModal() }
          ]);
        } else {
          state.fatalMistakeReason = callData.id;
          triggerEndGame(false, 'ТРАГЕДИЯ: Питомец погиб или пострадал у плохих хозяев', callData.consequenceText);
        }
      } else if (callData.isTrialReturn) {
        state.cash = +(state.cash + 85).toFixed(1);
        state.supplies.daysLeft += 10;
        showEventModal('ЧЕСТНЫЙ ВОЗВРАТ С ИСПЫТАТЕЛЬНОГО СРОКА', callData.consequenceText, [
          { label: 'Понимаем ситуацию (Продолжить поиск дома)', style: 'primary', action: () => closeEventModal() }
        ]);
      } else {
        completeOneOrPairAdoption(false, callData.consequenceText);
      }
    };
    choicesDiv.appendChild(btnGive);
  }
}

function completeOneOrPairAdoption(isPair, successStoryText) {
  const a = state.animal;
  const g = getAnimalGrammar(a);

  if (isPair && a.count >= 2) {
    a.count -= 2;
  } else {
    a.count -= 1;
  }

  // Если это семейство с мамой-кошкой (GDD 4.2): победа только когда пристроены котята И стерилизована и пристроена сама мама!
  if (a.hasMotherCat) {
    if (a.count > 1) {
      addLog(`День ${state.day}: 🏠 Ура! ${isPair ? 'Два котенка' : 'Один из котят'} обрел(и) семью! Осталось пристроить: ${a.count - 1} котят и маму-кошку.`, 'success');
      closeEventModal();
      return;
    } else if (a.count === 1) {
      if (!a.motherSterilized) {
        addLog(`День ${state.day}: 🏠 Все котята пристроены! Теперь осталась мама-кошка: необходимо завершить лактацию, стерилизовать ее и найти ей постоянный дом.`, 'info');
        a.speciesLabel = 'Мама-кошка (ждет стерилизации и дома)';
        closeEventModal();
        return;
      }
    }
  }

  if (a.count > 0) {
    addLog(`День ${state.day}: 🏠 Ура! ${isPair ? 'Два хвостика' : 'Один из подопечных'} обрел(и) семью! Осталось найти дом еще для ${a.count} хвостиков.`, 'success');
    closeEventModal();
    return;
  }

  // Все подопечные пристроены — ПОБЕДА!
  triggerEndGame(
    true,
    'ПОБЕДА: Все подопечные обрели любящий дом!',
    `${successStoryText}\n\nВы прошли весь путь от растерянного человека с улицы до опытного куратора: преодолели карантин, ветеринарию, дезинфекцию, ночные подъемы, отсеяли мошенников и нашли ответственных хозяев!`
  );
}
