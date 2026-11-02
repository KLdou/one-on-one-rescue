# Технический аудит проекта «Один на один: Симулятор спасения (v2.2)» и Промпт для локального агента

---

## ЧАСТЬ 1. Обнаруженные проблемы, баги и точки оптимизации

### 1. Критические ошибки (Bugs & Runtime Errors)
1. **`ReferenceError: getGrammar is not defined` (`js/actions.js`, строка 310):**
   В функции `escapeSearchAction` вызывается несуществующая функция `getGrammar(a)` вместо `getAnimalGrammar(a)`. При попытке нажать любую кнопку поиска сбежавшего питомца игра падает с ошибкой.
2. **Списание энергии без проверки оплаты в `payVetBill` (`js/ui.js`, `js/events.js`, `js/actions.js`):**
   Во всех ветеринарных действиях сначала вызывается `if (!spendEnergy(X)) return;`, а затем `payVetBill(...)`, но возвращаемое значение `payVetBill` (`true` / `false`) **нигде не проверяется**! Если у игрока нет денег или превышен лимит талона, `payVetBill` возвращает `false`, но энергия уже списана, а процедура (осмотр Вуда, вакцинация, ПЦР, стерилизация, операция, лечение пироплазмоза и т.д.) засчитывается как **выполненная бесплатно**.
   *Кроме того:* при отказе таксиста внутри `payVetBill` списывается 20 BYN еще до проверки того, хватит ли оставшихся денег на саму ветпроцедуру.
3. **Дублирование карточек питомцев в `localStorage` при получении «Привета из дома» (`js/ui.js` и `js/state.js`):**
   Функция `savePetToAlbum(record)` всегда делает `album.unshift(record)`. Когда игрок нажимает кнопку «💌 Привет из дома» в `actionReceiveGreetingFromHome(tailId)`, вызывается `savePetToAlbum(tail)`, что не обновляет существующую запись, а **создает дубликат** питомца в альбоме!
4. **Невозможность легально закрыть партию со сценарием `dacha_mother_with_kittens` (`js/adopters.js`, `js/engine.js`):**
   В сценарии «Мама-кошка + 4 котенка» `count: 5`, `kittensCount: 4`, `hasMotherCat: true`. Когда игрок стерилизует маму-кошку, `a.motherSterilized` становится `true`, но `activeCount` и `savedCount` не меняются (либо непонятно, пристраивается ли мама как 5-й хвост после стерилизации, или остается 5-м хвостом). При этом в `completeOneOrPairAdoption` (`js/adopters.js`) проверка `a.hasMotherCat && !a.motherSterilized` вообще отсутствует — победа засчитывается без проверки стерилизации мамы.
5. **Кнопка «Ясно» при предупреждении о дедлайне талона (`js/engine.js` и `js/events.js`):**
   Когда `processDayTick()` вызывает `triggerVoucherDeadlineModal()` (или любое другое прерывающее событие в середине тика) и делает `return`, шаги 17–22 текущего дня (триггеры кризисов, продвижение испытательного срока, пиар, проверка смерти/выгорания) **пропускаются** для этого дня!

### 2. Логические несоответствия (Logic Mismatches)
1. **Рассинхрон длительности испытательного срока (7 дней vs 14 дней):**
   В `finishTransferToTrial` задается `trialDaysTotal: 14`. Но в `actionCheckTrialPetStatus` (`js/actions.js`, строка 493) захардкожено `день ${item.daysPassed}/7`, в `triggerHoldFosterSpotModal` (`js/adopters.js`) и `triggerTrialSuccessModal` (`js/events.js`) написано «7-дневный испытательный срок». Нужно привести все тексты и переменные к единому стандарту (14 дней или 7 дней из конфига).
2. **Потеря статистики в Альбоме спасенных хвостов (`js/ui.js`, `js/engine.js`, `js/adopters.js`):**
   В `showAlbumModal()` (`js/ui.js`, строка 1599) выводятся поля `tail.personalSpent` и `tail.prChannel`, но при создании объекта `tailRecord` в `engine.js` и `adopters.js` эти поля **не записываются** (всегда отображается `0 BYN` и `zooshans.by`).
3. **Застревание таймера автоперемотки (`fastForwardCalmDays` в `js/engine.js`):**
   В `getTomorrowDeadlineWarning()` проверяется `totalFood <= 2`, а для финотчета `daysSinceLastFinReport === 6`. Но если у игрока корм уже равен `1` или `0`, или игрок нажал «⏩ Штиль» после срабатывания предупреждения, `getTomorrowDeadlineWarning()` возвращает строку-блокировку и `skipped` равен `0` — в итоге кнопка «⏩ Штиль» молча ничего не делает и даже не пишет в лог причину остановки!
4. **Неиспользуемые сценарии из `data_loader.js`:**
   В `scenarios` у `healthy_adult_dog_rehab` указано `dogCoatIndexRange: [0, 3]`, но в `generateRandomAnimalScenario` (`js/data_loader.js`, строка 106) проверяется только `raw.dogCoatIndex !== undefined`, а `dogCoatIndexRange` игнорируется.
5. **Хронический ЖКТ (`chronic_gi_celesta_cat`) и Больные зубы (`teethCrisis`):**
   В `state.js` есть флаги `giProtocolCompleted: !arch.hiddenState.hasChronicGI`, `teethCrisis: false`, `teethOperated: false`, а в `data_loader.js` есть цена `dentalSurgery: 115`, но в игре **нет ни одной кнопки или события**, которые бы лечили `hasChronicGI` (переводили `giProtocolCompleted` в `true`) или активировали/лечили `teethCrisis`. Из-за этого кошка из кейса Селесты вечно отнимает `-12⚡/д` без возможности вылечить ЖКТ.

### 3. Лишний и дублирующийся код (Dead Code & Redundancy)
1. **Дублирование пулов звонков (`js/data_loader.js` vs `js/adopters.js`):**
   В `window.GAME_DATA.calls` (`data_loader.js`) лежат `scammerCalls` и `adopterCalls`, но они **вообще не используются** — вместо них вызываются функции `getDynamicScammerCalls(a)` и `getDynamicAdopterCalls(a)` в `adopters.js`, где те же самые тексты продублированы вручную.
2. **Мертвый код в `index.html` и `js/ui.js`:**
   - В `index.html` блок `#extraQuestionBox` внутри `#eventOverlayBox` больше не используется (система вопросов переехала в `#candidateInterviewModal`).
   - В `js/ui.js` ищутся несуществующие в DOM элементы `#chkExperiencedCurator`, `#animalCountHeader`, `#sidebarAlbumCount`, а функция `toggleExperiencedCurator` нигде не вызывается.

---

## ЧАСТЬ 2. ПРОМПТ ДЛЯ ЛОКАЛЬНОГО АГЕНТА

Скопируйте блок ниже и отправьте вашему локальному агенту (Cursor, Windsurf, Claude Code, Aider и т.п.):

---

### Задача для ИИ-агента

Ты — Senior JavaScript-разработчик. Проведи рефакторинг и исправление багов в проекте «Один на один: Симулятор спасения (v2.2)». Работа ведется строго в рамках текущей архитектуры (Vanilla JS без сборщиков, глобальный стейт). Не ломай существующую верстку и CSS-классы.

Выполни следующие исправления по шагам:

#### Шаг 1. Исправление `ReferenceError` и логики `escapeSearchAction` (`js/actions.js`)
1. В функции `escapeSearchAction(actionType)` (`js/actions.js`, около строки 310) замени вызов несуществующей функции `const g = getGrammar(a);` на `const g = getAnimalGrammar(a);` (или удали переменную `g`, если она не используется в теле функции).

#### Шаг 2. Исправление транзакционности `payVetBill` и списания энергии (`js/actions.js`, `js/ui.js`, `js/events.js`)
Сейчас во всех вызовах `payVetBill(...)` энергия списывается через `spendEnergy(...)` ДО проверки платежеспособности, а результат `payVetBill(...)` (`true`/`false`) игнорируется, из-за чего при нехватке денег процедура выполняется бесплатно, а энергия сгорает.
1. В `js/actions.js` обнови `payVetBill(baseCostBYN, voucherEligible, serviceTitle, isExpensiveProcedure = false, energyCost = 0)`:
   - Сначала проверяй наличие энергии: если `energyCost > 0 && state.energy < energyCost`, логируй нехватку энергии и возвращай `false`.
   - Затем проверяй, хватает ли денег (или лимита талона) на саму процедуру (и на возможное зоотакси +20 BYN при `no_car`).
   - Только если оплата процедуры гарантированно проходит — списывай `energyCost`, обрабатывай событие с такси и списывай деньги/талон, после чего возвращай `true`.
2. Во всех местах вызова `payVetBill` в `js/ui.js` (осмотр Вуда, узкий специалист, вакцинация, ПЦР, тесты и терапия FeLV, стерилизация, остеосинтез, чип+бешенство в ЕС) и `js/events.js` (офтальмолог, ОРИТ при вирусе, переливание при ВЛК, старт протокола ФИП, лечение пироплазмоза):
   - Передавай стоимость энергии в `payVetBill` (или проверяй `if (!payVetBill(...)) return;` перед изменением статусов животного).
   - Убедись, что при возврате `false` из `payVetBill` медицинский статус животного НЕ меняется и модальное окно кризиса НЕ закрывается как успешно оплаченное.

#### Шаг 3. Исправление дубликатов в `localStorage` и сохранение полной статистики в Альбоме (`js/state.js`, `js/ui.js`, `js/engine.js`, `js/adopters.js`)
1. В `js/state.js` в функции `savePetToAlbum(record)` проверь, есть ли уже в массиве `album` запись с таким же `String(item.id) === String(record.id)`:
   - Если запись найдена — обнови её на месте (`album[idx] = record`).
   - Если не найдена — добавь в начало (`album.unshift(record)`).
2. При формировании объекта `tailRecord` во всех 4 местах (`js/engine.js` — успешный испытательный срок, возврат старым хозяевам, финкураторство; `js/adopters.js` — `completeOneOrPairAdoption`) обязательно добавляй поля:
   - `personalSpent: state.personalMoneySpent || 0`
   - `prChannel: item?.prChannel || (state.zooshans.hasProPhotos ? 'Профи-пиар Зоошанса' : 'Куфар / Соцсети')`

#### Шаг 4. Исправление механики «Хронический ЖКТ» (`chronic_gi_celesta_cat`) и «Стоматология» (`js/ui.js`, `js/events.js`)
1. В `js/ui.js` (вкладка 1 «Клиника», функция `renderActionTabs`):
   - Если у животного `a.hiddenState.hasChronicGI`: после сдачи ПЦР (`a.pcrTested`) или при наличии симптомов разблокируй действие лечения ЖКТ (или интегрируй его в кнопку «Прием узкого специалиста» / отдельную карточку «Курс терапии ЖКТ и диета Gastrointestinal» за `115 BYN` / `-10⚡`), которое переводит `a.giProtocolCompleted = true`, убирает штраф `-12⚡/д` и обновляет `a.visibleState`.
2. Проверь выбор окраса собак в `generateRandomAnimalScenario` (`js/data_loader.js`):
   - Добавь поддержку `raw.dogCoatIndexRange`: если он задан, выбирай случайный индекс из диапазона `randomInt(raw.dogCoatIndexRange[0], raw.dogCoatIndexRange[1])`.

#### Шаг 5. Исправление логики `processDayTick` и `fastForwardCalmDays` (`js/engine.js`, `js/adopters.js`, `js/actions.js`)
1. **Порядок выполнения в `processDayTick()` (`js/engine.js`):**
   - Не прерывай выполнение всего тика через `return` при показе информационных модалок (`triggerVoucherDeadlineModal`, `triggerFinReportAuditModal`), либо перенеси вызов всех модальных окон в конец `processDayTick()`, чтобы ежедневные счетчики (испытательный срок, пиар, карантин) не пропускали день.
2. **Обратная связь кнопки «⏩ Штиль» (`fastForwardCalmDays` в `js/engine.js`):**
   - Если цикл `while` остановился сразу на 0-й итерации (`skipped === 0 && stopReason`), обязательно выводи лог: `addLog('День ' + state.day + ': ⛔ Авто-стоп перемотки: ' + stopReason, 'warn');`, чтобы игрок понимал, почему время не промоталось.
3. **Единый стандарт длительности испытательного срока (14 дней):**
   - Замени упоминания «7 дней» / «7-дневный испытательный срок» на `14 дней` (или `${item.trialDaysTotal || 14}`) в:
     - `js/actions.js` (`actionCheckTrialPetStatus`: `день ${item.daysPassed}/${item.trialDaysTotal || 14}`)
     - `js/adopters.js` (`triggerHoldFosterSpotModal`)
     - `js/events.js` (`triggerTrialSuccessModal`)
4. **Условие победы со стерилизацией мамы-кошки (`js/adopters.js` и `js/engine.js`):**
   - В `completeOneOrPairAdoption` (`js/adopters.js`) добавь проверку `if (a.hasMotherCat && !a.motherSterilized)`, аналогичную `engine.js`, чтобы партия не завершалась победой, пока мама-кошка не стерилизована.
   - Когда игрок стерилизует маму-кошку во вкладке «Клиника» (`js/ui.js`), если все котята уже пристроены (`a.savedCount >= a.totalCount`), вызывай проверку победы.

#### Шаг 6. Очистка мертвого кода (`js/ui.js`, `index.html`)
1. В `js/ui.js` удали обращения к несуществующим DOM-элементам (`#chkExperiencedCurator`, `#animalCountHeader`, `#sidebarAlbumCount`) и неиспользуемую функцию `toggleExperiencedCurator`.
2. Убедись, что после всех правок нет синтаксических ошибок и все функции в глобальной области видимости доступны для `onclick`-обработчиков в `index.html`.