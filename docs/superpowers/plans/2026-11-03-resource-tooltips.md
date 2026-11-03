# Интерактивные всплывающие подсказки ресурсов (HUD и Снабжение) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Реализовать интерактивные всплывающие подсказки (тултипы) для всех ключевых ресурсов игры (Бюджет, Менталка, Энергия, Здоровье питомца, Сбор на карту, Талон Зоошанса, Запас корма) при наведении курсора на десктопе и клике на мобильных устройствах, с объяснением правил восполнения/расхода и живыми динамическими данными.

**Architecture:** 
- Верстка карточек HUD и боковой панели обогащается семантическими контейнерами тултипов с абсолютным позиционированием и адаптивным выравниванием.
- Стили CSS в `css/styles.css` обеспечивают красивый вид карточек с размытием фона (`backdrop-blur`), z-index, анимацией появления и мобильной адаптацией.
- В `js/ui.js` создается модуль динамической сборки данных подсказок (`updateResourceTooltips`), который рассчитывает актуальные параметры игрока (дни до зарплаты, семейный баланс энергии/менталки, бытовую нагрузку) и обновляет содержимое подсказок в общем цикле `renderAll()`.
- Обработчики событий поддерживают как hover на десктопе, так и toggle по клику/тапу с закрытием при клике вне тултипа.

**Tech Stack:** Vanilla JavaScript (ES6+), HTML5, CSS3, Tailwind CSS (CDN).

**Spec:** [`docs/superpowers/specs/2026-11-03-resource-tooltips-design.md`](file:///d:/projects/volontiers/docs/superpowers/specs/2026-11-03-resource-tooltips-design.md)

## Global Constraints
- Валюта: строго **BYN** (никаких `$` или `USD`).
- Zero-build: без npm/webpack/Vite/React; полная работоспособность через `file://` и локальный сервер.
- Мобильная адаптивность: подсказки не должны выходить за границы экрана (overflow) на узких дисплеях (320px–420px).
- Сохранение целостности: таймер останавливается при модальных окнах, тултипы не должны блокировать кнопки и элементы управления.

## Review Focus
1. Дни до зарплаты на 30-й день: `state.day % 30 === 0` должно показывать получение ЗП сегодня («ЗП сегодня!»), а не «через 0 дн.».
2. Расчет чистой менталки и энергии при отсутствии животного дома (на передержке или в стационаре): бытовой расход дома должен быть равен 0, штрафы жилья от питомца не начисляются.
3. Отображение тултипа на мобильных устройствах: клик по виджету открывает тултип, повторный клик или клик мимо закрывает его без дергания страницы.
4. Предотвращение выхода тултипа за пределы экрана: правые виджеты выравнивают тултипы по правому краю (`right-0 sm:right-auto sm:left-0`).
5. Корректность строгой проверки типов: отсутствие `undefined` или `NaN` при начальном старте игры до выбора клички/породы.

---

### Task 1: DOM-структура и CSS-стили для тултипов ресурсов

**Files:**
- Modify: `game_modular/index.html:257-316` (HUD карточки)
- Modify: `game_modular/index.html:143-176` (Левая колонка: Сбор на карту, Талон, Корм)
- Modify: `game_modular/css/styles.css` (Стили тултипов `.resource-tooltip`, анимации, стрелки)

**Interfaces:**
- Produces: DOM элементы `#widget-cash`, `#widget-mental`, `#energy-widget`, `#widget-health`, `#widget-card-limit`, `#widget-voucher`, `#widget-supply` с соответствующими контейнерами тултипов (`#tooltip-cash`, `#tooltip-mental`, `#energy-tooltip`, `#tooltip-health`, `#tooltip-card-limit`, `#tooltip-voucher`, `#tooltip-supply`).

- [ ] **Step 1: Оформить CSS стили для `.resource-tooltip` в `game_modular/css/styles.css`**
  - Создать правила для плавающего тултипа: `position: absolute`, `z-index: 40`, стилизация под карточку темы (`background: var(--bg-card)`, `border: 1px solid var(--border-strong)`, тень `box-shadow`, `border-radius: 0.75rem`).
  - Добавить эффекты появления (transition opacity/transform), стрелочки-указатели при необходимости, а также правила для hover на десктопе (`@media (hover: hover)`: `.resource-widget:hover > .resource-tooltip`).
  - Обеспечить адаптивную ширину (`w-[280px] sm:w-[320px] max-w-[90vw]`).

- [ ] **Step 2: Обновить разметку 4 шкал HUD в `game_modular/index.html`**
  - Обернуть каждую шкалу в контейнер с классом `resource-widget relative cursor-pointer`:
    - `#widget-cash` с тултипом `#tooltip-cash`
    - `#widget-mental` с тултипом `#tooltip-mental`
    - `#energy-widget` (интегрировать расширенный `#energy-tooltip`)
    - `#widget-health` с тултипом `#tooltip-health`
  - Добавить иконку подсказки `ℹ️` или тактильный индикатор в заголовок карточки.

- [ ] **Step 3: Обновить разметку виджетов снабжения в левой колонке `game_modular/index.html`**
  - Добавить контейнеры тултипов для:
    - `#widget-card-limit` -> `#tooltip-card-limit`
    - `#widget-voucher` -> `#tooltip-voucher`
    - `#widget-supply` -> `#tooltip-supply`

- [ ] **Step 4: Проверить синтаксис HTML и CSS**
  - Убедиться в отсутствии незакрытых тегов и корректности классов Tailwind.

- [ ] **Step 5: Commit**
  - `git add game_modular/index.html game_modular/css/styles.css`
  - `git commit -m "feat(ui): add DOM containers and CSS styles for resource tooltips"`

---

### Task 2: Модуль формирования и обновления данных тултипов в `js/ui.js`

**Files:**
- Modify: `game_modular/js/ui.js`

**Interfaces:**
- Produces:
  - `updateResourceTooltips()`: рассчитывает живые данные и наполняет HTML всех 7 тултипов.
  - `toggleResourceTooltip(tooltipId)`: переключает видимость для touch/click устройств.
  - `setupResourceTooltipsEvents()`: навешивает слушатели `mouseenter`/`mouseleave`, `click` и глобальный клик вне тултипа.
- Consumes:
  - `state` (cash, mental, energy, animal, player, zooshans, fundraising, day).
  - `calculateDailyHouseholdEnergyDrain()`, `isAnimalAtPlayerHome()`.

- [ ] **Step 1: Реализовать функцию генерации динамических данных `getResourceTooltipData()`**
  - **Бюджет:** текущие BYN, свободный остаток ЗП, дней до ЗП (с учетом `day % 30 === 0` -> «сегодня»), годовой сбор на карту / 6500 BYN.
  - **Менталка:** текущий %, семейный бонус (+3% партнер, 0% один, -1% ребенок), штраф жилья (0 своя, -1% аренда, -2% родня), штраф лотка (-3% если не приучен), итоговое сальдо в сутки.
  - **Энергия:** свободно / быт, утреннее восстановление от семьи, детальный список быта, стоимость типовых действий.
  - **Здоровье питомца:** текущий %, клинический статус, стационар ОРИТ (+8..12%/д), дней запаса корма/смеси, ключевые угрозы (голод, клещи).
  - **Сбор на карту:** лимит 6500 BYN/год, текущий прогресс, коэффициент соцкапитала.
  - **Талон «Зоошанса»:** задолженность / 1000 BYN, дней до закрытия (30 дн.), статус скидки 20%.
  - **Снабжение:** запас корма и смеси в днях, расход, стоимость пополнения.

- [ ] **Step 2: Реализовать `updateResourceTooltips()` и встроить в `renderAll()`**
  - Наполнить innerHTML каждого `#tooltip-*` структурированным контентом с иконками, зелеными плюсами восполнения и красными минусами расхода.
  - Гарантировать безопасное выполнение при первом запуске (защита от null/undefined).

- [ ] **Step 3: Реализовать интерактивные обработчики `setupResourceTooltipsEvents()`**
  - Поддержка hover на десктопе (`mouseenter` / `mouseleave`).
  - Поддержка клика/тапа для мобильных (`click` на виджет переключает тултип).
  - Глобальный обработчик `document.addEventListener('click')` для автоматического скрытия открытого тултипа при клике в любое другое место страницы.
  - Закрытие тултипов при открытии любых модальных окон.

- [ ] **Step 4: Проверить синтаксис JS через `node --check`**
  - `node --check game_modular/js/ui.js`

- [ ] **Step 5: Commit**
  - `git add game_modular/js/ui.js`
  - `git commit -m "feat(ui): implement dynamic resource tooltips rendering and interaction logic"`

---

### Task 3: Тестирование и верификация логики расчетов подсказок

**Files:**
- Create: `tests/test_resource_tooltips.js`

**Interfaces:**
- Produces: Автоматический тест для валидации всех формул и динамических значений в подсказках.

- [ ] **Step 1: Написать тест `tests/test_resource_tooltips.js`**
  - Проверить расчет дней до зарплаты при `day = 1`, `day = 15`, `day = 30`, `day = 31`.
  - Проверить расчет суточного баланса менталки для разных комбинаций: партнер + своя квартира; ребенок + съемная квартира + неприученный щенок; один + передержка.
  - Проверить расчет восстановления энергии и бытового резерва: дома на полу vs на платной передержке vs в стационаре.
  - Проверить форматирование и отсутствие `NaN` и `undefined` во всех формируемых блоках текста.

- [ ] **Step 2: Запустить тест и убедиться в успешном прохождении**
  - `node tests/test_resource_tooltips.js`

- [ ] **Step 3: Commit**
  - `git add tests/test_resource_tooltips.js`
  - `git commit -m "test(tooltips): add automated test suite for resource tooltip calculations"`

---

### Task 4: Сквозная верификация, регрессионное тестирование и финализация

**Files:**
- Verify: весь проект `game_modular/`

- [ ] **Step 1: Выполнить автоматическую проверку синтаксиса всех файлов проекта**
  - PowerShell:
    ```powershell
    Get-ChildItem -Path "game_modular/js/*.js" | ForEach-Object { node --check $_.FullName }
    Get-ChildItem -Path "game_modular/data/*.json" | ForEach-Object { $null = Get-Content $_.FullName -Raw | ConvertFrom-Json }
    ```

- [ ] **Step 2: Запустить существующие тесты проекта**
  - `node tests/test_mentor_system.js`
  - `node tests/test_pair_adoption.js`
  - `node tests/test_volunteer_mechanics.js`

- [ ] **Step 3: Проверить инварианты валюты (BYN only, no `$`)**
  - `Select-String -Path "game_modular/index.html", "game_modular/js/*.js" -Pattern "\$"`

- [ ] **Step 4: Итоговый коммит**
  - `git status`
  - `git commit -m "feat(resources): complete interactive resource tooltips with live data"`
