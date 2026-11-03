// data_loader.js - Загрузка и инициализация игровых данных (JSON v2.2)
window.GAME_DATA = {"config":{"currency":"BYN","zooshansVoucherDebtLimitBYN":1000,"personalCardLimitBYN":6500,"officialFundraiserThresholdBYN":330,"tickSpeeds":{"pause":0,"speed1":2500,"speed2":1200,"speed5":500},"fastForward":{"maxDaysPerClick":15},"prices":{"vetCheckup":50,"vetSpecialist":70,"dewormPill1":26,"dewormPill2":20,"vaccine":60,"pcrProfile":105,"castrateCat":100,"spayCat":160,"spayPregnantCat":225,"spayDog":300,"traumaSurgery":450,"dentalSurgery":115,"icuDaily":140,"suppliesCatPack":65,"suppliesDogPack":120,"babycatMilkCan":105,"cageDisinfectant":16,"paidFosterCatDaily":16,"paidFosterDogDaily":33,"antiEscapeHarness":60,"rabiesVaccineAndChip":80,"rabiesTitersLab":630,"euCertificate":50,"euTransferPaidByAdopter":430,"unvaccinatedCatTreatment":215,"rentDeposit":150,"puppyChewDamage":85,"extraTaxiCost":20,"storytellingFanDonation":85,"noviceFosterExtra":50,"scamPrepay":45,"scamLoss":80,"tickProtectionDog":35,"holdFosterSpotFreeSweets":15,"holdFosterSpotPaidCatWeekly":55,"holdFosterSpotPaidDogWeekly":110,"maneuverAdopterBribe":20},"contacts":{"eripCode":"4346991","eripPath":"Благотворительность, общественные объединения -> Защита животных -> Зоошанс -> Пожертвование","donationSite":"https://zooshans.by/help-us","chat":"https://t.me/zooshans_chat","infoBot":"https://t.me/zooshans_info_bot","channel":"https://t.me/zooshans","petnamesForum":"https://forum.zooshans.by/app.php/petnames"}},"playerAxes":{"incomes":[{"id":"low","label":"ЗП 1650 BYN (свободно 400 BYN/мес)","startingCash":280,"monthlySalary":1650,"monthlyFreeCash":400},{"id":"mid","label":"ЗП 2800 BYN (свободно 825 BYN/мес)","startingCash":600,"monthlySalary":2800,"monthlyFreeCash":825},{"id":"high","label":"ЗП 4600 BYN (свободно 1500 BYN/мес)","startingCash":1120,"monthlySalary":4600,"monthlyFreeCash":1500}],"housing":[{"id":"own_flat","label":"🏠 Своя квартира","landlordRisk":0,"dailyMentalDrain":0},{"id":"rent_strict","label":"🔑 Съемная (строгий запрет на животных)","landlordRisk":0.14,"dailyMentalDrain":1,"depositCost":150},{"id":"with_relatives","label":"👥 С родней (против животных, -2%🧠/д)","landlordRisk":0,"dailyMentalDrain":2}],"family":[{"id":"single","label":"👤 Живу один/одна (+32⚡/д)","energyBonus":32,"mentalBonus":0,"ringwormPanic":1},{"id":"partner_support","label":"💑 Партнер поддерживает (+36⚡/д, +3%🧠/д)","energyBonus":36,"mentalBonus":3,"ringwormPanic":0.8},{"id":"small_kids","label":"👶 Маленький ребенок (+22⚡/д, паника лишая 2.5x)","energyBonus":22,"mentalBonus":-1,"ringwormPanic":2.5}],"ownPets":[{"id":"none","label":"🐾 Своих животных нет","infectionRisk":"none"},{"id":"vaccinated_cat","label":"🛡️ Свой кот (привит)","infectionRisk":"low"},{"id":"unvaccinated_cat","label":"⚠️ Свой кот (НЕ привит!)","infectionRisk":"critical","treatmentCost":215}],"mobility":[{"id":"car","label":"🚗 Личное авто","energyMod":0.75,"extraTaxiCost":0},{"id":"no_car","label":"🚌 Без авто (общественный транспорт / такси)","energyMod":1.2,"extraTaxiCost":20}],"socialCapital":[{"id":"introvert","label":"🤫 Узкий круг (~40 друзей, закрытый профиль)","friendsCount":40,"multiplier":0.6},{"id":"average_social","label":"👥 Обычный круг (~250 друзей и коллег)","friendsCount":250,"multiplier":1},{"id":"wide_circle","label":"🌟 Популярный аккаунт (~1200 подписчиков)","friendsCount":1200,"multiplier":1.6}]},"coats":{"catCoats":{"cow":{"id":"cow","tier":"unpopular","popularity":0.22,"name":"Черно-белый («Коровка» / «Маркиз»)","adjFemale":"черно-белая","adjMale":"черно-белый","adjPlural":"черно-белых","tagColor":"bg-slate-700 text-slate-200"},"tabby":{"id":"tabby","tier":"unpopular","popularity":0.3,"name":"Серо-полосатый («Шпротный» / «Тигровый»)","adjFemale":"серо-полосатая","adjMale":"серо-полосатый","adjPlural":"серо-полосатых","tagColor":"bg-amber-900/60 text-amber-200"},"white_tabby":{"id":"white_tabby","tier":"unpopular","popularity":0.38,"name":"Бело-тигровый","adjFemale":"бело-тигровая","adjMale":"бело-тигровый","adjPlural":"бело-тигровых","tagColor":"bg-amber-800/50 text-amber-100"},"black":{"id":"black","tier":"polarizing","popularity":0.45,"name":"Чисто черный («Пантерка»)","adjFemale":"черная","adjMale":"черный","adjPlural":"черных","tagColor":"bg-zinc-900 text-zinc-300 border border-zinc-600"},"grey":{"id":"grey","tier":"mid_popular","popularity":0.65,"name":"Серый дымчатый («Голубой»)","adjFemale":"серая","adjMale":"серый","adjPlural":"серых","tagColor":"bg-slate-600 text-slate-100"},"calico_spices":{"id":"calico_spices","tier":"popular","popularity":0.78,"name":"Трехцветка / Черепаховый («Специи»)","adjFemale":"трехцветная","adjMale":"трехцветный","adjPlural":"трехцветных","tagColor":"bg-orange-950 text-orange-200 border border-orange-500/50"},"white_ginger":{"id":"white_ginger","tier":"popular","popularity":0.82,"name":"Бело-рыжий","adjFemale":"бело-рыжая","adjMale":"бело-рыжий","adjPlural":"бело-рыжих","tagColor":"bg-amber-700/60 text-amber-100"},"ginger":{"id":"ginger","tier":"hit","popularity":0.95,"name":"Ярко-рыжий («Солнечный»)","adjFemale":"ярко-рыжая","adjMale":"ярко-рыжий","adjPlural":"ярко-рыжих","tagColor":"bg-amber-600 text-slate-950 font-bold"},"colorpoint":{"id":"colorpoint","tier":"high_demand","popularity":1.25,"name":"Голубоглазый Колор-пойнт (Тайский фенотип)","adjFemale":"тайская колор-пойнт","adjMale":"тайский колор-пойнт","adjPlural":"тайских колор-пойнтов","tagColor":"bg-sky-900 text-sky-200 border border-sky-400"},"purebred":{"id":"purebred","tier":"maximum","popularity":2,"name":"Фенотип породы (Шотландец / Британец)","adjFemale":"породистая шотландская","adjMale":"породистый шотландский","adjPlural":"породистых шотландских","tagColor":"bg-purple-900 text-purple-200 border border-purple-400"}},"dogCoats":[{"name":"Черно-подпалый («Овчаристый дворик»)","popularity":0.32,"tagColor":"bg-amber-950 text-amber-300","id":"dark"},{"name":"Рыже-палевый («Лисичка»)","popularity":0.42,"tagColor":"bg-amber-700/80 text-amber-100","id":"foxy"},{"name":"Чепрачный («Зонарный»)","popularity":0.28,"tagColor":"bg-stone-800 text-stone-200","id":"cheprak"},{"name":"Светло-кремовый («Беляк»)","popularity":0.45,"tagColor":"bg-amber-100 text-slate-900 font-bold","id":"cream"}]},"scenarios":[{"id":"dacha_mother_with_kittens","species":"cat","gender":"female","ageDays":25,"speciesLabel":"Мама-кошка + 4 котенка","titleTemplate":"Семейство с закрывающихся дач: {coatName} мама и 4 котенка","visualDescriptionTemplate":"Дачники уехали в город, бросив истощенную кормящую кошку и 4 котят (25 дней). Соска не нужна — кормит мама, но расход корма увеличен в 2.5 раза! Стерилизация мамы возможна только после окончания лактации (45 дней котят).","allowedCoats":["calico_spices","tabby","cow","white_tabby"],"ageCategory":"kitten","count":5,"initialCount":5,"kittensCount":4,"hasMotherCat":true,"motherLactating":true,"motherSterilized":false,"litterTrained":false,"litterTrainDaysDone":0,"visibleState":"Мама кормит котят молоком! Расход корма увеличен в 2.5 раза. Стерилизация мамы откроется на 45-й день котят, когда завершится лактация.","hiddenState":{"isNewborn":false,"ringworm":false,"deadlyVirus":null,"chronicCarrier":null,"isPregnant":false,"hasSevereTrauma":false,"isLostOrPurebred":false,"isKittenSeason":false}},{"id":"healthy_unpopular_kittens","species":"cat","gender":"mixed","ageDays":42,"speciesLabel":"Котята","titleTemplate":"Коробка из {cnt} {coatAdjPlural} котят у рынка","visualDescriptionTemplate":"Активные малыши окраса «{coatName}» (42 дня от роду). Сами едят, бегают, вирусов нет — только блохи, глисты и промахи мимо лотка.","allowedCoats":["cow","tabby","white_tabby"],"ageCategory":"kitten","countRange":[3,4],"litterTrained":false,"litterTrainDaysDone":0,"visibleState":"Здоровые котята! Вакцинация разрешена строго с 60 дней (2 мес.), но с 45 дней можно открыть раннее бронирование.","hiddenState":{"isNewborn":false,"ringworm":false,"deadlyVirus":null,"chronicCarrier":null,"isPregnant":false,"hasSevereTrauma":false,"isLostOrPurebred":false,"isKittenSeason":false}},{"id":"healthy_popular_kittens","species":"cat","gender":"mixed","ageDays":48,"speciesLabel":"Котята","titleTemplate":"Выводок из {cnt} {coatAdjPlural} котят в палисаднике","visualDescriptionTemplate":"Симпатичные пушистые котята окраса «{coatName}» (48 дней). Чумазые, еще путают пеленку и лоток, но бодрые.","allowedCoats":["ginger","white_ginger","calico_spices","grey"],"ageCategory":"kitten","countRange":[2,3],"litterTrained":false,"litterTrainDaysDone":0,"visibleState":"Здоровы! Прививка с 60 дней, уже доступно раннее бронирование (с передачей в 2 мес. под договор стерилизации).","hiddenState":{"isNewborn":false,"ringworm":false,"deadlyVirus":null,"chronicCarrier":null,"isPregnant":false,"hasSevereTrauma":false,"isLostOrPurebred":false,"isKittenSeason":false}},{"id":"newborn_blind_kittens","species":"cat","gender":"mixed","ageDays":3,"speciesLabel":"Слепые котята","titleTemplate":"Завязанный пакет с 4 слепыми котятами у мусорки ({coatName})","visualDescriptionTemplate":"Четыре новорожденных слепыша (3 дня от роду, вес по 90 г), пуповины еще не отпали. Отчаянно пищат и ищут маму.","allowedCoats":["cow","tabby","white_ginger","black"],"ageCategory":"newborn","count":4,"initialCount":4,"litterTrained":true,"litterTrainDaysDone":7,"visibleState":"Слепыши! Вы не знаете, чем их кормить (в холодильнике только коровье молоко). Срочно спросите совета у волонтеров!","hiddenState":{"isNewborn":true,"ringworm":false,"deadlyVirus":null,"chronicCarrier":null,"isPregnant":false,"hasSevereTrauma":false,"isLostOrPurebred":false,"isKittenSeason":false}},{"id":"healthy_adult_cat_marathon","species":"cat","gender":"male","ageDays":730,"speciesLabel":"Взрослый кот (2 года)","titleTemplate":"Бывшедомашний {coatAdjMale} кот в подъезде","visualDescriptionTemplate":"Спокойный упитанный кот окраса «{coatName}», сидит у мусоропровода на коврике. Анализы чистые, микроспории нет, лоток на 5+.","allowedCoats":["cow","black","tabby","white_tabby"],"ageCategory":"adult","count":1,"initialCount":1,"litterTrained":true,"litterTrainDaysDone":7,"visibleState":"Клинически здоров, контактен. Требуется терпеливый марафон системного пиара по сайтам и доскам объявлений.","hiddenState":{"isNewborn":false,"ringworm":false,"deadlyVirus":null,"chronicCarrier":null,"isPregnant":false,"hasSevereTrauma":false,"isLostOrPurebred":false,"isKittenSeason":false}},{"id":"adult_cat_in_kitten_season","species":"cat","gender":"female","ageDays":500,"speciesLabel":"Взрослая кошка","titleTemplate":"Одинокая {coatAdjFemale} кошка у магазина (Июль, разгар «Сезона котят»)","visualDescriptionTemplate":"Милая здоровая кошка окраса «{coatName}». Но на дворе лето: интернет завален бесплатными котятами, взрослые кошки получают -75% к звонкам.","allowedCoats":["tabby","white_tabby","cow"],"ageCategory":"adult","count":1,"initialCount":1,"litterTrained":true,"litterTrainDaysDone":7,"visibleState":"Сезон котят: интерес к взрослым кошкам снижен в 4 раза. Спасут только профи-фото от Зоошанса или выставка!","hiddenState":{"isNewborn":false,"ringworm":false,"deadlyVirus":null,"chronicCarrier":null,"isPregnant":false,"hasSevereTrauma":false,"isLostOrPurebred":false,"isKittenSeason":true}},{"id":"healthy_adult_dog_rehab","species":"dog","gender":"male","ageDays":600,"speciesLabel":"Взрослая собака (18 кг)","titleTemplate":"Дружелюбный контактный пес у проходной завода ({coatName})","visualDescriptionTemplate":"Молодой пес около 18 кг. Тянется к людям, дает лапу. Требует двухразового выгула в любую погоду, анатомической шлейки-антипобег и стерилизации (300 BYN).","dogCoatIndexRange":[0,3],"ageCategory":"adult","count":1,"initialCount":1,"litterTrained":false,"litterTrainDaysDone":0,"visibleState":"Выгул отнимает 25⚡/день. Нужна анатомическая трехремневая шлейка-антипобег, обработка от клещей и стерилизация (300 BYN / 240 BYN по талону).","hiddenState":{"isNewborn":false,"ringworm":false,"deadlyVirus":null,"chronicCarrier":null,"isPregnant":false,"hasSevereTrauma":false,"isLostOrPurebred":false,"isKittenSeason":false}},{"id":"orphan_puppies_litter","species":"dog","gender":"mixed","ageDays":40,"speciesLabel":"Щенки","titleTemplate":"Коробка с 4 щенками в канаве у оживленной трассы","visualDescriptionTemplate":"Крепкие толстолапые бутузы (40 дней от роду). До прививки в 60 дней сидят дома на пеленках (-30⚡/день быта). Грызут обувь и обои, инкубируют парвовирусный энтерит.","dogCoatIndex":0,"ageCategory":"puppy","count":4,"initialCount":4,"litterTrained":false,"litterTrainDaysDone":0,"visibleState":"Пеленки, мытье полов и скулеж (-30⚡/день). Прививка строго с 60 дней! Высокий риск парвовирусного энтерита.","hiddenState":{"isNewborn":false,"ringworm":false,"deadlyVirus":"parvovirus_enteritis","chronicCarrier":null,"isPregnant":false,"hasSevereTrauma":false,"isLostOrPurebred":false,"isKittenSeason":false}},{"id":"healthy_look_fiv_cat","species":"cat","gender":"male","ageDays":1100,"speciesLabel":"Кот","titleTemplate":"Крупный дворовый {coatAdjMale} кот со шрамом на ухе","visualDescriptionTemplate":"Боевой вежливый кот (около 3 лет). Блестящая шерсть, хороший аппетит, лоток знает. Но на улице получил вирус иммунодефицита кошек (ВИК / FIV+).","allowedCoats":["cow","tabby","black","grey"],"ageCategory":"adult","count":1,"initialCount":1,"litterTrained":true,"litterTrainDaysDone":7,"visibleState":"Внешне 100% здоров! Но без сдачи ПЦР вы не узнаете про скрытый иммунодефицит (ВИК — пристраивается строго единственным котом).","hiddenState":{"isNewborn":false,"ringworm":false,"deadlyVirus":null,"chronicCarrier":"FIV","isPregnant":false,"hasSevereTrauma":false,"isLostOrPurebred":false,"isKittenSeason":false}},{"id":"healthy_look_felv_cat","species":"cat","gender":"female","ageDays":400,"speciesLabel":"Кошка","titleTemplate":"Молодая ласковая {coatAdjFemale} кошка у остановки","visualDescriptionTemplate":"Нежная ручная кошечка (~1 год). Спит на коленях, анализы крови в норме. Но она скрытый носитель вирусной лейкемии (FeLV+), которая заразна через слюну и миски.","allowedCoats":["calico_spices","white_ginger","grey"],"ageCategory":"adult","count":1,"initialCount":1,"litterTrained":true,"litterTrainDaysDone":7,"visibleState":"Ласковая и здоровая на вид. ПЦР обязателен! Без него кошка заразит чужих кошек или выдаст анемический криз при стрессе.","hiddenState":{"isNewborn":false,"ringworm":false,"deadlyVirus":null,"chronicCarrier":"FeLV","isPregnant":false,"hasSevereTrauma":false,"isLostOrPurebred":false,"isKittenSeason":false}},{"id":"colorpoint_blue_eyes_cat","species":"cat","gender":"male","ageDays":550,"speciesLabel":"Колор-пойнт","titleTemplate":"Изящный голубоглазый тайский кот в подвале жилого дома","visualDescriptionTemplate":"Красивый кот сиамского/тайского фенотипа с сапфировыми глазами. Чувствительный ЖКТ, притягивает перекупщиков и любителей халявной породы.","coatId":"colorpoint","ageCategory":"adult","count":1,"initialCount":1,"litterTrained":true,"litterTrainDaysDone":7,"visibleState":"Популярный типаж (1.25x звонков). Нужен 10-дневный поиск старых хозяев и строжайший фильтр от разведенцев!","hiddenState":{"isNewborn":false,"ringworm":false,"deadlyVirus":null,"chronicCarrier":null,"isPregnant":false,"hasSevereTrauma":false,"isLostOrPurebred":true,"isKittenSeason":false}},{"id":"dacha_kittens_herpes_eyes","species":"cat","gender":"mixed","ageDays":52,"speciesLabel":"4 котенка с больными глазами","titleTemplate":"Осенний выводок из 4 полуслепых котят в сыром дачном сарае","visualDescriptionTemplate":"Глаза склеены гноем из-за герпесвируса (ринотрахеита), угроза язвы роговицы и слепоты. Плюс скрытая микроспория (лишай 35 дней в клетке).","allowedCoats":["cow","tabby","white_tabby"],"ageCategory":"kitten","count":4,"initialCount":4,"litterTrained":false,"litterTrainDaysDone":0,"visibleState":"Глаза текут гноем, угроза слепоты! Показан ПЦР по симптомам + осмотр офтальмолога и капли каждые 2 часа 10 дней.","hiddenState":{"isNewborn":false,"ringworm":true,"deadlyVirus":"rhinotracheitis_eyes","chronicCarrier":null,"isPregnant":false,"hasSevereTrauma":false,"isLostOrPurebred":false,"isKittenSeason":false}},{"id":"pregnant_stray_cat_timer","species":"cat","gender":"female","ageDays":600,"speciesLabel":"Беременная кошка","titleTemplate":"Круглобокая {coatAdjFemale} кошка во дворе (Таймер до родов!)","visualDescriptionTemplate":"Ласковая кошка с огромным животом, котята шевелятся. Если не успеть сделать экстренную стерилизацию до 8-го дня, родит 5 слепых котят в шкафу.","allowedCoats":["calico_spices","white_ginger","grey","tabby"],"ageCategory":"adult","count":1,"initialCount":1,"litterTrained":true,"litterTrainDaysDone":7,"visibleState":"Глубокая беременность! Экстренная стерилизация по медпоказаниям стоит 225 BYN (180 BYN по талону), иначе на 8-й день появятся 5 слепышей.","hiddenState":{"isNewborn":false,"ringworm":false,"deadlyVirus":null,"chronicCarrier":null,"isPregnant":true,"daysUntilBirth":8,"hasSevereTrauma":false,"isLostOrPurebred":false,"isKittenSeason":false}},{"id":"ginger_kitten_trojan_horse","species":"cat","gender":"male","ageDays":45,"speciesLabel":"Рыжий котенок","titleTemplate":"Солнечный ярко-рыжий котенок с огромными ушами у подъезда","visualDescriptionTemplate":"В первый день бодрый и мурчит. Но внутри инкубирует панлейкопению («кошачью чумку»), которая вспыхнет на 4-й день, а на 5-й вылезет лишай.","coatId":"ginger","ageCategory":"kitten","count":1,"initialCount":1,"litterTrained":false,"litterTrainDaysDone":0,"visibleState":"Ярко-рыжий хит соцсетей! Но уличный анамнез опасен: требуется строгий карантин в клетке и бдительность.","hiddenState":{"isNewborn":false,"ringworm":true,"deadlyVirus":"panleukopenia","virusIncubationDays":4,"ringwormIncubationDays":5,"chronicCarrier":null,"isPregnant":false,"hasSevereTrauma":false,"isLostOrPurebred":false,"isKittenSeason":false}},{"id":"purebred_scam_magnet","species":"cat","gender":"male","ageDays":800,"speciesLabel":"Британец / Шотландец","titleTemplate":"Породистый плюшевый шотландский вислоухий кот у мусорных баков","visualDescriptionTemplate":"Крупный породистый кот с янтарными глазами. Атакуют телефонные мошенники с курьером и перекупщики. Обязательны 10 дней поиска старых хозяев.","coatId":"purebred","ageCategory":"adult","count":1,"initialCount":1,"litterTrained":true,"litterTrainDaysDone":7,"visibleState":"Бешеный шквал звонков (2.0x)! Запрещено отдавать без договора и стерилизации. Сначала 10 дней ищем старых хозяев.","hiddenState":{"isNewborn":false,"ringworm":false,"deadlyVirus":null,"chronicCarrier":null,"isPregnant":false,"hasSevereTrauma":false,"isLostOrPurebred":true,"isKittenSeason":false}},{"id":"severe_trauma_sheri_dog","species":"dog","gender":"female","ageDays":1000,"speciesLabel":"Травмированная собака (Кейс Шери)","titleTemplate":"Сбитая машиной на обочине МКАД крупная собака (Множественные переломы)","visualDescriptionTemplate":"Кровь, переломы таза, внутреннее кровотечение и шок. Жизнь висит на волоске. Требуется реанимация, остеосинтез и собака-донор крови из чата @zooshans_chat.","dogCoatIndex":2,"ageCategory":"adult","count":1,"initialCount":1,"litterTrained":false,"litterTrainDaysDone":0,"visibleState":"Критическое состояние (45% жизни)! Требуется экстренная реанимация, остеосинтез и поиск вакцинированного донора крови.","hiddenState":{"isNewborn":false,"ringworm":false,"deadlyVirus":null,"chronicCarrier":null,"isPregnant":false,"hasSevereTrauma":true,"needsBloodDonor":true,"isLostOrPurebred":false,"isKittenSeason":false}},{"id":"window_fall_jaw_cat","species":"cat","gender":"female","ageDays":650,"speciesLabel":"Кошка «Летунья»","titleTemplate":"Бывшедомашняя {coatAdjFemale} кошка в коробке у бака (Упала с 8 этажа)","visualDescriptionTemplate":"В коробке записка: «Упала с окна, сломана челюсть, денег на операцию нет». Симфизиолиз (разрыв челюсти) и травматический шок.","allowedCoats":["white_ginger","grey","purebred"],"ageCategory":"adult","count":1,"initialCount":1,"litterTrained":true,"litterTrainDaysDone":7,"visibleState":"Требуется операция по шинированию челюсти, а затем 18 дней кормления паштетами через шприц/стому (-20⚡/день дома)!","hiddenState":{"isNewborn":false,"ringworm":false,"deadlyVirus":null,"chronicCarrier":null,"isPregnant":false,"hasSevereTrauma":true,"isJawFracture":true,"syringeDaysLeft":18,"needsBloodDonor":false,"isLostOrPurebred":false,"isKittenSeason":false}},{"id":"hoarder_flat_cats","species":"cat","gender":"female","ageDays":700,"speciesLabel":"2 диковатые кошки","titleTemplate":"Две {coatAdjPlural} кошки из квартиры-накопителя (Угроза отлова)","visualDescriptionTemplate":"В Серебрянке умерла хозяйка 15 кошек. Родственники дали сутки до вызова отлова (Гурского, 42). Кошки в панике шипят и боятся рук.","allowedCoats":["cow","black","grey","calico_spices"],"ageCategory":"adult","count":2,"initialCount":2,"litterTrained":false,"litterTrainDaysDone":0,"visibleState":"Дикий страх человека! Помимо клетки, глистогонки и стерилизации требуется 14 дней терпеливой социализации до начала пиара.","hiddenState":{"isNewborn":false,"ringworm":false,"deadlyVirus":null,"chronicCarrier":"FIV","isPregnant":false,"hasSevereTrauma":false,"isLostOrPurebred":false,"isKittenSeason":false,"needsSocialization":true,"socializationDaysDone":0}},{"id":"chronic_gi_celesta_cat","species":"cat","gender":"female","ageDays":450,"speciesLabel":"Кошка (Хронический ЖКТ)","titleTemplate":"Ласковая {coatAdjFemale} кошка с неукротимой диареей (Кейс Селесты)","visualDescriptionTemplate":"Ручная молодая кошка (~1 год), но с тяжелым хроническим поносом, который не берут смекта и рисовый отвар.","allowedCoats":["calico_spices","tabby","black"],"ageCategory":"adult","count":1,"initialCount":1,"litterTrained":false,"litterTrainDaysDone":0,"visibleState":"Ежедневная уборка отнимает уйму сил (-24⚡/день дома)! Требуется ПЦР на простейших (трихомоноз) и курс ронидазола + диета Gastrointestinal (120 BYN).","hiddenState":{"isNewborn":false,"ringworm":false,"deadlyVirus":null,"chronicCarrier":null,"isPregnant":false,"hasSevereTrauma":false,"isLostOrPurebred":false,"isKittenSeason":false,"hasChronicGI":true}}],"calls":{"scammerCalls":[{"id":"scam_courier_prepay","caller":"Мужской голос с помехами рации («Дальнобойщик»)","dialogue":"«Здорово, куратор! Я на фуре под Барановичами, это точно наш породистый ${petWord}, узнал по пятну! Забрать сам не успеваю — переведите 45 BYN курьеру на страховку доставки, а я вечером верну вам 200 BYN вознаграждения!»","extraQuestionReply":"На просьбу назвать особые приметы или скинуть фото в Вайбер мужчина начинает кричать: «Вы что, на чужом горе нажиться хотите?! У меня роуминг, переводите курьеру быстрей на номер!»","isSafe":false,"isScam":true,"scamLossBYN":80,"consequenceText":"Классический фишинговый развод мошенников! Вы перешли по ссылке «на страховку курьера», с карты списали 80 BYN (-35% Менталки), а номер абонента стал недоступен. Ни курьера, ни хозяина не существовало."},{"id":"scam_breeder_metro","caller":"Деловая женщина без эмоций («Перекупщица»)","dialogue":"«Здравствуйте, видела объявление о породистом животном. Это наш, позавчера убежал. Нет, фотографий нет — телефон сброшен до заводских настроек, ветпаспорт утерян. Стерилизацию делать не разрешаю — нечего портить породу! Выносите к метро через 20 минут, заберу без лишних вопросов».","extraQuestionReply":"На вопрос об адресе и паспорте раздраженно бросает: «Зачем вам мой домашний адрес? Я спешу, отдавайте животное у турникетов или я найду другого!»","isSafe":false,"isScam":true,"consequenceText":"Вы отдали нестерилизованное породистое животное перекупщице. Через 2 дня фото появилось на Куфаре за 300 BYN в разделе «Для вязки и разведения». Животное попало в клеточную плодильню."}],"adopterCalls":[{"id":"call_toddler_toy","caller":"Молодая мама на фоне громкого детского плача","dialogue":"«Здравствуйте! Моему сыночку на 2 годика срочно нужна живая игрушка, он увидел ${singleWord} в мультике и требует! Главное, чтобы питомец терпел, когда малыш тянет за хвост и уши. Если поцарапает — сразу выставим за дверь. И у мужа вроде аллергия была, но надеемся, пронесет!»","extraQuestionReply":"«Сдавать аллергопробы заранее мы не будем — это дорого, проще взять ${singleWord} и проверить на муже вживую».","isSafe":false,"consequenceText":"Вы отдали ${singleWord} как живую игрушку для двухлетнего ребенка. Через 3 дня малыш больно дернул питомца за хвост, испугался реакции, и родители выставили животное на мороз."},{"id":"call_anti_spay_aesthetic","caller":"Интеллигентная женщина из центра Минска","dialogue":"«Добрый день! Какое чудо на фото! Только скажите, вы ведь против варварских операций по стерилизации? Мы хотим обязательно получить потомство хотя бы пару раз для здоровья, а котят раздадим добрым людям на рынке!»","extraQuestionReply":"«Кормить планируем тем, что сами едим: супчиком, вареной колбасой и трубчатыми костями. Паспортных данных для договора я давать не буду».","isSafe":false,"consequenceText":"Отказ от стерилизации привел к плодильничеству, пиометре и новым коробкам с брошенными малышами у мусорных баков."},{"id":"call_compromise_normal_family","caller":"Обычная семья из Малиновки («Средние ручки» — возможен компромисс)","dialogue":"«Здравствуйте! Хотим взять у вас ${singleWord} в двухкомнатную квартиру. Самовыгула не признаем, любить будем всей душой. Кормить планируем обычным Purina One или Brit Care из зоомагазина. ${protectionDetail}, но если подскажете — сделаем по вашим советам!»","extraQuestionReply":"«Мы простые рабочие люди, прошлый питомец прожил у нас 14 лет в тепле и заботе, всегда возили к врачу. Договор подпишем с радостью».","isSafe":true,"isCompromise":true,"consequenceText":"Ваше кураторское сопровождение сработало на 100%! Семья выполнила все рекомендации по безопасности, вы остались на связи и помогли ${singleWord} адаптироваться!"},{"id":"call_compromise_pensioner_grandma","caller":"Добрая пенсионерка Анна Ивановна (64 года, «Средние ручки»)","dialogue":"«Добрый день, деточка! Живу одна в своей квартире, очень тоскливо без живой души. На дачу не езжу, окна закрыты сеткой. Пенсия скромная, но на корм всегда отложу. Если нужно везти в клинику — взрослая дочка живет рядом и во всем помогает!»","extraQuestionReply":"«Дочка прямо сейчас рядом, оформит договор на себя и всегда подстрахует машиной и финансами!»","isSafe":true,"isCompromise":true,"consequenceText":"Идеальный союз заботливой бабушки и надежной страховки взрослой дочки! Питомец живет в тепле и любви."},{"id":"call_compromise_cottage_owners","caller":"Семья из круглогодичного коттеджа в Колодищах («Средние ручки»)","dialogue":"«Добрый день! У нас свой огороженный дом в Колодищах. Ищем любимца строго для проживания внутри дома. Во дворе высокий глухой забор на фундаменте, тамбур с двойными дверями. Сетки металлические».","extraQuestionReply":"«Мы готовы купить анатомическую шлейку с адресником для выгула на участке и присылать фото-приветы каждые выходные».","isSafe":true,"isCompromise":true,"consequenceText":"Отличный частный дом без самовыгула! Хозяева прислали видео счастливого питомца в просторной гостиной у камина."},{"id":"call_village_mice_outdoor","caller":"Мужчина с шумом трактора на заднем плане","dialogue":"«Алло, заберу в деревню под Слуцк ловить мышей! Спать будет на сеновале, кормим кашей с ливеркой. Прошлый кот весной куда-то ушел и не вернулся, вот нового ищем».","extraQuestionReply":"«Какая еще стерилизация и прививки в деревне? Кто за это деньги платит? Заболеет — естественный отбор!»","isSafe":false,"consequenceText":"Самовыгул в деревне без прививок закончился предсказуемо: через 3 месяца питомец погиб под колесами трактора или от зубов диких лис."},{"id":"call_window_fall_fatal","caller":"Молодой человек, 9 этаж в новостройке","dialogue":"«Привет! Заберу кота. Живу один на 9 этаже. Окна летом открываю настежь, свежий воздух нужен! Прошлый кот упал за птицей, но этот же будет умнее, правда?»","extraQuestionReply":"«Сетки-антикошки ставить не собираюсь, это развод маркетологов, животные чувствуют опасность».","isSafe":false,"consequenceText":"Через 4 дня открытое окно на 9 этаже унесло жизнь. Падение с высоты, разрыв внутренних органов, летальный исход."},{"id":"call_dorm_secret","caller":"Шепчущая студентка 1 курса","dialogue":"«Здравствуйте! Мы с соседкой по комнате в общежитии БГУ решили завести ${singleWord}. Будем прятать его в шкафу во время обхода коменданта и вахтерши!»","extraQuestionReply":"«Если комендант заметит — выкинет на улицу за 5 минут, но мы будем осторожны!»","isSafe":false,"consequenceText":"Во время внезапной проверки комендант общежития нашла животное в тумбочке и выставила переноску на улицу в дождь."},{"id":"call_gift_girlfriend_surprise","caller":"Торопящийся парень у метро","dialogue":"«Здорово! Мне срочно нужен ${singleWord} в подарок девушке на годовщину через 2 часа! Она на съемной квартире живет, хозяин вроде не в курсе, но это же сюрприз!»","extraQuestionReply":"«Девушка не знает, я не спрашивал. Если хозяйка квартиры будет против — вернем вам или отдадим кому-нибудь».","isSafe":false,"consequenceText":"Животные в подарок сюрпризом — главный источник выброшенцев. Хозяйка съемного жилья выставила девушку с коробкой на лестницу."},{"id":"call_bones_and_pork","caller":"Мужчина солидного возраста","dialogue":"«День добрый. Мы кормим по старинке натуралкой: жареной свининкой со сковороды, солеными огурцами и вареными трубчатыми костями кур. Прошлый кот до 2.5 лет дожил, потом почему-то от старости умер».","extraQuestionReply":"«К ветеринарам возить не привыкли, химия все это. Бабушка зверобоем лечила и мы так лечим».","isSafe":false,"consequenceText":"Трубчатые куриные кости разорвали кишечник животного. Экстренная операция в клинике не спасла от перитонита."},{"id":"call_dog_chain_village","caller":"Грубоватый голос из райцентра","dialogue":"«Собаку заберу во двор в деревню под Молодечно. Посадим на глухую двухметровую цепь у будки охранять забор. Кормим помоями со школьной столовой».","extraQuestionReply":"«От клещей капли за 30 рублей капать не будем, дегтярным мылом помоем и хватит с нее».","isSafe":false,"consequenceText":"Цепное содержание без обработок привело к заражению пироплазмозом от иксодовых клещей первой же весной. Собака сгорела за 3 дня без лечения."},{"id":"call_fiv_felv_ignorer","caller":"Хозяйка нескольких непривитых котов","dialogue":"«Ой, какой красавец! Возьмем вторым котиком к нашему Ваське. Васька не привит, на улице дрался, но они подружатся, я уверена!»","extraQuestionReply":"«Анализы на ВИК/ВЛК мне не интересны, у нас все коты общие миски облизывают».","isSafe":false,"consequenceText":"Совместное содержание с непривитыми котами привело к драке и фатальному заражению хозяйского питомца ретровирусом."},{"id":"call_fake_breed_colorpoint","caller":"Любительница халявной породы","dialogue":"«Ой, какой тайский красавец! Мы всегда мечтали о породистом котике бесплатно! Будем вязать с кошечкой подруги, а кормить свежей сырой речной рыбкой с рынка».","extraQuestionReply":"«Зачем кастрировать? Природа требует! И форточку на 1 этаже мы не закрываем, пусть гуляет».","isSafe":false,"consequenceText":"Бесконтрольные вязки, гельминтозы от сырой рыбы и гибель на самовыгуле через форточку первого этажа."},{"id":"call_halloween_black_cat","caller":"Мутный парень поздно ночью 30 октября","dialogue":"«Слышь, мне чисто черного кота надо прямо сейчас, ночью 30 октября. Для фотосессии и ритуала с друзьями. Паспортных данных не дам».","extraQuestionReply":"«Какая разница, что мы ночью делать будем? Деньги плачу, отдавай кота!»","isSafe":false,"consequenceText":"Черные коты перед Хэллоуином находятся под строжайшим мораторием волонтеров из-за высокого риска живодерства и ритуальных издевательств."},{"id":"call_good_trial_allergy_return","caller":"Адекватная молодая пара (по договору с испытательным сроком)","dialogue":"«Здравствуйте! Очень хотим забрать у вас ${singleWord}. Мы подготовили миски, лежанку, хороший корм супер-премиум и безопасные окна. С договором согласны! Давайте оговорим честный испытательный срок».","extraQuestionReply":"Ребята прислали видео квартиры и купленного корма. Всё выглядит очень ответственно.","isSafe":true,"isTrialReturn":true,"consequenceText":"На 6-й день ребята позвонили в слезах: у мужа началась острая бронхиальная астма (прислали заключение пульмонолога). По договору об испытательном сроке они бережно привезли ${singleWord} обратно, передали мешок корма и 85 BYN на передержку. Это рабочий момент — продолжаем поиск!"},{"id":"call_ideal_pet_screen_family","caller":"Осознанная молодая семья программистов","dialogue":"«Добрый день! Мы давно следим за деятельностью «Зоошанса». У нас своя квартира, на всех окнах установлены профессиональные металлические сетки «Антикошка» (Pet Screen). Кормим суперпремиумом, договор куратора подпишем и чипируем!»","extraQuestionReply":"«Мы сдали аллергопанель заранее, отложили подушку безопасности на клинику. Если у вас выводок — мы с радостью возьмем сразу парочку котят, чтобы им не было скучно!»","isSafe":true,"canTakePair":true,"consequenceText":"Идеальные хозяева мечты! У питомца свой мягкий домик, когтеточка до потолка, регулярные чекапы и бесконечная любовь."},{"id":"call_felv_aware_single_pet","caller":"Осознанная девушка (ищет строго одного кота)","dialogue":"«Здравствуйте! Увидела ваш пост. Я знаю, что такое вирусный лейкоз (FeLV+), у меня нет других кошек. Я готова обеспечить правильный уход, качественный корм и терапию. Котику нужен дом!»","extraQuestionReply":"«Сетки на окнах стоят, квартира своя. Буду любить и беречь единственного хвостика!»","isSafe":true,"consequenceText":"Прекрасный пример осознанного усыновления FeLV+ кошки в семью без других кошек! Риск передачи нулевой, хвостик в надежных руках."},{"id":"call_gift_new_year_rush","caller":"Торопящийся парень у елочного базара (Новогодний ажиотаж!)","dialogue":"«Здорово! Срочно нужен ${singleWord} под новогоднюю елку девушке/детям в подарок! До боя курантов пару дней, все раскупили, выручайте!»","extraQuestionReply":"«Мы еще не решили, кто будет гулять и убирать, главное — подарок под елочку положить!»","isSafe":false,"consequenceText":"Животные в подарок «под елочку» — лидеры январских выбросов на мороз, когда праздники заканчиваются."}]},"petnames":{"baseNames":["Абрикос","Агата","Агаша","Аглая","Аделя","Аделия","Аиша","Айза","Айс","Акай","Авдотья","Августин","Адмирал","Ёлка","Сема","Барсик","Муся","Кузя","Степа","Черныш","Персик","Матроскин","Бусинка","Дымка","Рыжик","Тимоша","Тошка","Белка","Стрелка","Граф","Маркиз","Шери","Найда","Бим","Рекс","Селеста","Васька","Мурзик","Луна","Кнопка","Плюша","Оскар","Снежок","Пушок","Лаки","Герда","Боня","Лора","Филя","Чарли"],"toponyms":["Рокоссовский","Комаров","72 Прушинских","Ждановичская","Космонавтова","Серебрянская","Пушкинская","Одоевская","Цнянская","Байкальская","Ангарская","Алтайский","Маяковский","Мавровна","Дачный","Заславская","Мядельский","Притыцкий","Немигский","Уручский","Чижовский","Лошицкий","Кунцевщинский","Малиновский","Сухаревский","Грушевский","Каменногорский","Восточный","Тракторозаводской","Шабановский","Степнянский","Веснянский"]},"mentorHints":{"LOW_ENERGY_WARNING":{"id":"LOW_ENERGY_WARNING","type":"advice","category":"Ресурс куратора","title":"Риск эмоционального выгорания","speaker":"Опытный координатор","message":"Ты берешь на себя слишком много рутины. Если силы упадут до нуля, ты просто не сможешь поехать в клинику в критический момент, а животные останутся без помощи.","rule":"Не пытайся тянуть всё в одиночку: вовремя ищи автопомощь в чатах, делегируй бытовые задачи и оставляй запас энергии на экстренные выезды."},"CLINIC_DEBT_HALFWAY":{"id":"CLINIC_DEBT_HALFWAY","type":"advice","category":"Финансы и клиники","title":"Половина лимита долга исчерпана","speaker":"Опытный координатор","message":"Долг по льготным направлениям перевалил за 500 BYN. Партнерские клиники идут нам навстречу, но при достижении порога в 1000 BYN выписка новых талонов будет заблокирована.","rule":"Регулярно публикуй чеки и закрывай промежуточные финотчеты, чтобы открыть новый сбор до того, как клиника остановит прием в долг."},"QUARANTINE_BREACH_RISK":{"id":"QUARANTINE_BREACH_RISK","type":"advice","category":"Ветеринария и безопасность","title":"Угроза перекрестного заражения","speaker":"Опытный координатор","message":"В одной квартире оказались непривитые животные без строгого карантина. Любая скрытая вирусная инфекция новичка за пару дней положит всех твоих подопечных.","rule":"Новое животное с улицы требует строгой изоляции (отдельное помещение или клетка) минимум на 14 дней, первичной обработки и сдачи анализов до контакта с остальными."},"REVACCINATION_OVERDUE":{"id":"REVACCINATION_OVERDUE","type":"post_mortem","category":"Разбор ошибки","title":"Сбит график вакцинации","speaker":"Разбор полетов","message":"Сроки повторной прививки упущены, или вакцинация была проведена без предварительной дегельминтизации. Стойкий иммунитет не сформировался, а подготовка к выставке или переезду затягивается.","rule":"Соблюдай четкий протокол: сначала обработка от паразитов, через 10–14 дней первая вакцинация, и ровно через 21 день — ревакцинация."},"STALE_PR_WARNING":{"id":"STALE_PR_WARNING","type":"advice","category":"Пиар и пристройство","title":"Объявление примелькалось, питомец перерастает","speaker":"Опытный координатор","message":"Котята растут стремительно, а старые мутные фото на фоне пеленок или клеток больше не цепляют взгляд в ленте. Пока пиар стоит на паузе, пушистый малыш превращается в подростка, которого пристроить в разы сложнее.","rule":"Как только животное приведено в порядок, организуй яркую фотосессию при дневном свете, пиши живой текст с характером и обновляй посты каждые 3–5 дней."},"FIRST_TRIAL_STARTED":{"id":"FIRST_TRIAL_STARTED","type":"advice","category":"Пристройство","title":"Начался испытательный срок","speaker":"Опытный координатор","message":"Питомец уехал в новый дом, но не спеши выдыхать и брать новых подопечных на его место. Первые две недели — самые стрессовые и для животного, и для людей.","rule":"Ближайшие 14 дней держи связь с хозяевами, мягко контролируй адаптацию с лотком и будь готов забрать хвостика обратно, если семья не справится."},"ADOPTION_FAILED_POSTMORTEM":{"id":"ADOPTION_FAILED_POSTMORTEM","type":"post_mortem","category":"Разбор ошибки","title":"Срыв пристройства: пропущен красный флаг","speaker":"Разбор полетов","message":"Животное вернулось на кураторство в сильном стрессе. На этапе собеседования были проигнорированы тревожные сигналы в анкете будущих хозяев.","rule":"Отказывай без сомнений, если кандидаты считают нормой самовыгул, отказываются ставить сетки-антикошки на окна, кормят со стола или снимают жилье без твердого согласия арендодателя."},"SCAM_VICTIM_POSTMORTEM":{"id":"SCAM_VICTIM_POSTMORTEM","type":"post_mortem","category":"Разбор ошибки","title":"Уловка мошенников: потеря ресурсов","speaker":"Разбор полетов","message":"Срочный крик о помощи или предложение подозрительно дешевой передержки оказались обманом. В итоге потеряны драгоценное время и деньги, которые были нужны реальным подопечным.","rule":"Всегда проверяй первоисточник, требуй актуальные фото/видео животного, сверяй реквизиты и никогда не переводи предоплату незнакомым кураторам или черным передержкам."}}};

// Функция асинхронной загрузки JSON файлов (если игра запущена через веб-сервер)
async function loadGameDataAsync() {
  try {
    const [cfg, axes, coats, scens, calls, pnames, hints] = await Promise.all([
      fetch('data/config.json').then(r => r.json()),
      fetch('data/player_axes.json').then(r => r.json()),
      fetch('data/coats.json').then(r => r.json()),
      fetch('data/scenarios.json').then(r => r.json()),
      fetch('data/calls.json').then(r => r.json()),
      fetch('data/petnames.json').then(r => r.json()),
      fetch('data/mentor_hints.json').then(r => r.json())
    ]);
    window.GAME_DATA = {
      config: cfg,
      playerAxes: axes,
      coats: coats,
      scenarios: scens,
      calls: calls,
      petnames: pnames,
      mentorHints: hints
    };
    console.log('✓ Game data loaded from external JSON files.');
  } catch (e) {
    console.warn('Using preloaded fallback data (running directly from file:// without web server):', e);
  }
}

function randomItem(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function formatAgeText(days) {
  if (days < 30) return days + ' дн.';
  if (days < 365) return (days / 30).toFixed(1) + ' мес.';
  return (days / 365).toFixed(1) + ' года';
}

function adaptToponymGender(topo, isFemale) {
  if (!topo) return topo;
  if (topo === '72 Прушинских') return topo;

  if (isFemale) {
    if (topo === 'Комаров') return 'Комарова';
    if (topo === 'Космонавтова') return 'Космонавтовская';
    if (topo === 'Мавровна') return 'Мавровская';
    if (topo.endsWith('ский')) return topo.slice(0, -4) + 'ская';
    if (topo.endsWith('цкий')) return topo.slice(0, -4) + 'цкая';
    if (topo.endsWith('ный')) return topo.slice(0, -3) + 'ная';
    if (topo.endsWith('ной')) return topo.slice(0, -3) + 'ная';
    return topo;
  } else {
    if (topo === 'Комарова') return 'Комаров';
    if (topo === 'Космонавтова' || topo === 'Космонавтовская') return 'Космонавтов';
    if (topo === 'Мавровна' || topo === 'Мавровская') return 'Мавров';
    if (topo.endsWith('ская')) return topo.slice(0, -4) + 'ский';
    if (topo.endsWith('цкая')) return topo.slice(0, -4) + 'цкий';
    if (topo.endsWith('ная')) return topo.slice(0, -3) + 'ный';
    return topo;
  }
}

const FEMALE_BASE_NAMES = new Set([
  'Агата', 'Агаша', 'Аглая', 'Аделя', 'Аделия', 'Аиша', 'Айза', 'Авдотья',
  'Ёлка', 'Муся', 'Бусинка', 'Дымка', 'Белка', 'Стрелка', 'Шери', 'Найда',
  'Селеста', 'Луна', 'Кнопка', 'Плюша', 'Герда', 'Боня', 'Лора'
]);

function getRandomPetname(gender) {
  const p = window.GAME_DATA.petnames || { baseNames: ['Барсик'], toponyms: ['Рокоссовский'] };
  let effectiveGender = gender;
  if (!effectiveGender && typeof state !== 'undefined' && state.animal) {
    effectiveGender = state.animal.gender;
  }

  const isFemale = effectiveGender === 'female';
  const isMale = effectiveGender === 'male';

  let candidateNames = p.baseNames;
  if (isFemale) {
    candidateNames = p.baseNames.filter(n => FEMALE_BASE_NAMES.has(n));
  } else if (isMale) {
    candidateNames = p.baseNames.filter(n => !FEMALE_BASE_NAMES.has(n));
  }
  if (!candidateNames || candidateNames.length === 0) candidateNames = p.baseNames;

  const base = randomItem(candidateNames);
  const topo = randomItem(p.toponyms);
  const adaptedTopo = adaptToponymGender(topo, isFemale || (FEMALE_BASE_NAMES.has(base) && !isMale));
  return base + ' ' + adaptedTopo;
}

function getSuggestedUniquePetname(simpleName, gender) {
  const p = window.GAME_DATA.petnames || { toponyms: ['Рокоссовский'] };
  const clean = (simpleName || 'Питомец').trim();

  let effectiveGender = gender;
  if (!effectiveGender && typeof state !== 'undefined' && state.animal) {
    effectiveGender = state.animal.gender;
  }
  let isFemale = effectiveGender === 'female';
  if (!effectiveGender) {
    // Автоопределение по окончанию имени
    const lower = clean.toLowerCase();
    const maleExceptions = ['васька', 'кузя', 'степа', 'сема', 'тошка', 'тимоша', 'филя', 'чарли', 'яша', 'миша'];
    if ((lower.endsWith('а') || lower.endsWith('я')) && !maleExceptions.includes(lower)) {
      isFemale = true;
    }
  }

  const topo = randomItem(p.toponyms);
  const adaptedTopo = adaptToponymGender(topo, isFemale);
  return clean + ' ' + adaptedTopo;
}

function getAnimalGrammar(a) {
  const isDog = a.species === 'dog';
  const isFem = a.gender === 'female';
  const countVal = a.activeCount !== undefined ? a.activeCount : (a.count || 1);
  const isPlural = countVal > 1;

  if (isPlural) {
    return {
      isDog,
      nom: isDog ? 'щенки' : 'котята',
      gen: isDog ? 'щенков' : 'котят',
      acc: isDog ? 'щенков' : 'котят',
      shortNom: isDog ? 'щенки' : 'котята'
    };
  }
  if (isDog) {
    return {
      isDog: true,
      nom: isFem ? 'собака' : 'пес',
      gen: isFem ? 'собаки' : 'пса',
      acc: isFem ? 'собаку' : 'пса',
      shortNom: isFem ? 'собака' : 'пес'
    };
  }
  return {
    isDog: false,
    nom: isFem ? 'кошка' : 'кот',
    gen: isFem ? 'кошки' : 'кота',
    acc: isFem ? 'кошку' : 'кота',
    shortNom: isFem ? 'кошка' : 'кот'
  };
}

function generateRandomAnimalScenario(forcedArchetype = null) {
  const raw = forcedArchetype || randomItem(window.GAME_DATA.scenarios);
  const catCoats = window.GAME_DATA.coats.catCoats;
  const dogCoats = window.GAME_DATA.coats.dogCoats;

  let coat = null;
  let coatLabel = '';
  let coatPopularity = 1.0;
  let coatTier = 'mid_popular';

  if (raw.species === 'dog') {
    let dCoat;
    if (raw.dogCoatIndex !== undefined) {
      dCoat = dogCoats[raw.dogCoatIndex];
    } else if (raw.dogCoatIndexRange && Array.isArray(raw.dogCoatIndexRange)) {
      const minIdx = raw.dogCoatIndexRange[0];
      const maxIdx = raw.dogCoatIndexRange[1];
      const randIdx = Math.floor(Math.random() * (maxIdx - minIdx + 1)) + minIdx;
      dCoat = dogCoats[randIdx] || randomItem(dogCoats);
    } else {
      dCoat = randomItem(dogCoats);
    }
    coat = dCoat;
    coatLabel = dCoat.name + ' (' + dCoat.popularity + 'x)';
    coatPopularity = dCoat.popularity;
    coatTier = 'unpopular';
  } else {
    const coatKey = raw.coatId || (raw.allowedCoats ? randomItem(raw.allowedCoats) : 'tabby');
    const cCoat = catCoats[coatKey] || catCoats.tabby;
    coat = cCoat;
    coatLabel = cCoat.name + ' (' + cCoat.popularity + 'x)';
    coatPopularity = cCoat.popularity;
    coatTier = cCoat.tier;
  }

  let cnt = raw.count || 1;
  if (raw.countRange) {
    cnt = randomInt(raw.countRange[0], raw.countRange[1]);
  }

  const coatAdjFemale = coat.adjFemale || coat.name;
  const coatAdjMale = coat.adjMale || coat.name;
  const coatAdjPlural = coat.adjPlural || coat.name;

  const title = raw.titleTemplate
    .replace(/{cnt}/g, cnt)
    .replace(/{coatName}/g, coat.name)
    .replace(/{coatAdjFemale}/g, coatAdjFemale)
    .replace(/{coatAdjMale}/g, coatAdjMale)
    .replace(/{coatAdjPlural}/g, coatAdjPlural);

  const visualDescription = raw.visualDescriptionTemplate
    .replace(/{cnt}/g, cnt)
    .replace(/{coatName}/g, coat.name)
    .replace(/{coatAdjFemale}/g, coatAdjFemale)
    .replace(/{coatAdjMale}/g, coatAdjMale)
    .replace(/{coatAdjPlural}/g, coatAdjPlural);

  const speciesLabel = raw.speciesLabel.replace(/{cnt}/g, cnt);
  const isLitter = cnt > 1;
  const petName = isLitter ? null : getRandomPetname();

  return {
    id: raw.id,
    species: raw.species,
    gender: raw.gender,
    ageDays: raw.ageDays,
    speciesLabel: speciesLabel,
    title: title,
    visualDescription: visualDescription,
    coat: coat,
    coatTier: coatTier,
    coatLabel: coatLabel,
    coatPopularity: coatPopularity,
    coatId: coat.id || 'coat',
    coatName: coat.name,
    ageCategory: raw.ageCategory,
    count: cnt,
    initialCount: cnt,
    totalCount: cnt,
    activeCount: cnt,
    trialCount: 0,
    savedCount: 0,
    petName: petName,
    kittensCount: raw.kittensCount || (cnt - 1),
    hasMotherCat: raw.hasMotherCat || false,
    motherLactating: raw.motherLactating || false,
    motherSterilized: false,
    litterTrained: raw.litterTrained || false,
    litterTrainDaysDone: raw.litterTrainDaysDone || 0,
    visibleState: raw.visibleState,
    hiddenState: { ...raw.hiddenState }
  };
}
