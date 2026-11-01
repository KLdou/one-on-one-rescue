# UI/UX Design & Frontend Architecture Guide (Vanilla JS + HTML5 + CSS3)
**Проект:** «Один на один: Симулятор спасения» (v2.2) — МБООПЖ «Зоошанс», г. Минск  
**Целевой стек:** Native JavaScript (ES6+ Modules), Semantic HTML5, Modern CSS3 (CSS Grid, Flexbox, Custom Properties). **БЕЗ ФРЕЙМВОРКОВ (No React/Vue).**  
**Хостинг:** Cloudflare Pages (Static Assets) + Telegram WebApp совместимость.

---

## 1. Инструкции для локального ИИ-агента (Core Rules)

1. **Никаких фронтенд-фреймворков и тяжелых зависимостей:** Пиши чистый, модульный Vanilla JS (`type="module"`).
2. **Архитектура State-Driven UI:**
   * Все состояние игры хранится в едином объекте `GameState` (с автосохранением в `localStorage`).
   * Любое изменение состояния вызывает точечные функции обновления DOM: `renderHUD()`, `renderPetStage()`, `renderActiveTab()`, `renderDeadlines()`, `renderLog()`.
   * Для интерактивных кнопок используй делегирование событий (`document.addEventListener('click', ...)` через `data-action="..."`), чтобы не терять обработчики при перерисовке `innerHTML`.
3. **Безусловная Автопауза (Auto-Pause):**
   * Функция `openModal(modalId, payload)` **обязана** первым действием ставить игровой таймер на паузу (`GameState.time.speed = 0; stopGameLoop();`).
4. **Единый HTML-шаблон для Mobile и Desktop:**
   * Не дублируй разметку под телефон и ПК. Используй единый адаптивный CSS Grid-каркас, который перестраивается медиа-запросом `@media (min-width: 1024px)`.

---

## 2. Дизайн-система и CSS-переменные (Эстетика «Теплый крафт»)

Интерфейс должен вызывать ощущение уютного блокнота/папки куратора, не утомлять глаза при чтении длинных диалогов и динамически менять акценты при смене времен года в календаре.

### 2.1. Базовые токены и Сезонные темы (`:root` и `[data-season]`)

```css
:root {
  /* Базовая палитра «Теплый крафт» */
  --bg-app: #FAF6EE;
  --bg-card: #FFFDF9;
  --bg-muted: #F4EFE4;
  --bg-elevated: #EFE8DA;
  --border-subtle: #E5DEC9;
  --border-strong: #D4CBB4;

  /* Типографика */
  --text-primary: #2C302E;
  --text-secondary: #5C605D;
  --text-muted: #78756F;
  --text-inverse: #FAF7F2;

  /* Семантические цвета шкал */
  --color-budget: #15803D;      /* BYN */
  --color-mental: #7E22CE;      /* Менталка % */
  --color-energy-free: #059669; /* Доступная энергия ⚡ */
  --color-energy-lock: #D97706; /* Резерв на быт 🔒 */
  --color-health: #E11D48;      /* Жизнь питомца % */
  --color-danger: #DC2626;
  --color-warning: #D97706;

  /* Сезонный акцент по умолчанию (Осень) */
  --season-accent: #C2410C;
  --season-badge-bg: #FFEDD5;
  --season-badge-text: #9A3412;

  /* Геометрия и тени */
  --radius-sm: 8px;
  --radius-md: 12px;
  --radius-lg: 16px;
  --radius-xl: 24px;
  --shadow-card: 0 2px 6px rgba(44, 48, 46, 0.05);
  --shadow-modal: 0 20px 40px rgba(28, 30, 29, 0.25);

  /* Системный шрифт с отличной читаемостью кириллицы */
  --font-sans: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
}

/* Динамическое переключение сезонов на теге <body data-season="..."> */
body[data-season="summer"] {
  --bg-app: #FAF6EE;
  --season-accent: #D97706;
  --season-badge-bg: #FEF3C7;
  --season-badge-text: #92400E;
}

body[data-season="autumn"] {
  --bg-app: #F9F5F0;
  --season-accent: #C2410C;
  --season-badge-bg: #FFEDD5;
  --season-badge-text: #9A3412;
}

body[data-season="winter"] {
  --bg-app: #F3F7FA;
  --bg-card: #FFFFFF;
  --bg-muted: #EAF0F6;
  --border-subtle: #DCE5EE;
  --season-accent: #0284C7;
  --season-badge-bg: #E0F2FE;
  --season-badge-text: #075985;
}

body[data-season="spring"] {
  --bg-app: #F4F8F4;
  --season-accent: #15803D;
  --season-badge-bg: #DCFCE7;
  --season-badge-text: #166534;
}
```

---

## 3. Адаптивная сетка: Mobile-First SPA vs 3-Column Desktop

### 3.1. Мобильный режим (`< 1024px`, Telegram WebApp / Смартфон)
* **Никакого скролла всей страницы:** `body { height: 100dvh; overflow: hidden; display: flex; flex-direction: column; }`.
* Экран жестко разделен по вертикали на 4 секции:
  1. **Верхний компактный хедер + HUD (`flex-shrink: 0`):** День, сезон, кнопки времени (`🌙 Завершить день` в дни 1–3 или `Пауза / 1x / 2x / 5x / ⏩` с 4-го дня), кнопки вызова шторок `[👤 Профиль]` и `[📋 Дневник]`, а также сетка `2x2` из 4 главных шкал.
  2. **Сцена питомца (`flex-shrink: 0`):** Компактный блок (SVG-аватар 96x96px слева, кличка, счетчик выводка и бейджи статусов справа).
  3. **Скроллируемый контейнер активной вкладки (`flex: 1; overflow-y: auto`):** Карточки действий выбранной категории (`Быт`, `Клиника`, `Зоошанс`, `Пиар`, `Чат`).
  4. **Нижний Таб-бар под большой палец (`height: 60px; flex-shrink: 0`):** 5 иконок с подписями. В 1-й день при активном «Тумане войны» вкладки `Зоошанс`, `Пиар` и `Чат` имеют атрибут `disabled` и иконку `🔒`.
* **Левая и правая колонки на мобильном** превращаются в выдвижные оверлейные шторки (`position: fixed; inset: 48px 0 60px 0; z-index: 20; transform: translateY(...)`), открывающиеся по тапу на кнопки в шапке.

### 3.2. Десктопный режим (`@media (min-width: 1024px)`)
* Снимается ограничение `overflow: hidden` с `body`.
* Контейнер `.app-layout` становится **3-колоночным CSS Grid**:
  ```css
  @media (min-width: 1024px) {
    .app-layout {
      display: grid;
      grid-template-columns: 320px minmax(0, 1fr) 350px;
      gap: 20px;
      max-width: 1440px;
      margin: 0 auto;
      padding: 20px;
      align-items: start;
    }
    .mobile-bottom-nav,
    .mobile-drawer-triggers {
      display: none !important;
    }
  }
  ```
* **Левая колонка (`320px`):** Всегда видна. Содержит карточку «Профиль куратора» (6 осей, прогресс-бары долга по талонам `до 1000 BYN` и годового лимита сборов `до 6500 BYN`), карточку «Инвентарь снабжения» (кнопка выручки от своего кота `+4 дня корма за 0 BYN` при остатке `<= 2 дней`, покупка пакета на 14 дней) и кнопку «Альбом спасенных хвостиков».
* **Центральная колонка (`1fr`):** Верхний HUD (4 шкалы в 1 ряд `grid-template-columns: repeat(4, 1fr)`), Сцена питомца, горизонтальные табы навигации и сетка карточек действий (`grid-template-columns: repeat(2, 1fr)`).
* **Правая колонка (`350px`):** Всегда видна. Сверху — «Радар дедлайнов (Автостоп ⏩)», снизу — прокручиваемый «Дневник куратора».

---

## 4. Спецификация ключевых UI-компонентов (HTML + CSS паттерны)

### 4.1. Двухсегментная шкала Энергии (`⚡ Доступно` + `🔒 Резерв на быт`)
Это важнейший элемент интерфейса. Игрок должен визуально понимать, какая часть его потолка энергии заблокирована домашним уходом за животными.

**HTML-разметка:**
```html
<div class="stat-card energy-card" id="energy-widget" title="Нажмите для расшифровки резерва">
  <div class="stat-header">
    <span class="stat-label">⚡ Энергия</span>
    <span class="stat-value">
      <strong id="energy-free-val" class="text-free">52⚡</strong>
      <span class="divider">/</span>
      <strong id="energy-lock-val" class="text-lock">24🔒</strong>
    </span>
  </div>
  <div class="dual-progress-track">
    <!-- Доступная энергия растет слева направо -->
    <div id="energy-free-bar" class="bar-free" style="width: 52%;"></div>
    <!-- Зарезервированная на быт энергия прижата к правому краю -->
    <div id="energy-lock-bar" class="bar-lock" style="width: 24%;"></div>
  </div>
  <!-- Всплывающий тултип с разбивкой быта -->
  <div id="energy-tooltip" class="energy-tooltip" hidden>
    <strong>🔒 Резерв на домашний быт: -24⚡/день</strong>
    <p id="energy-breakdown-text">Лоток: -12⚡, Обработка лишая в клетке: -12⚡. Передача на передержку освободит шкалу до 0🔒.</p>
  </div>
</div>
```

**CSS-стили двухцветного бара:**
```css
.dual-progress-track {
  width: 100%;
  height: 10px;
  background: #E2D9C8;
  border-radius: 999px;
  overflow: hidden;
  display: flex;
  justify-content: space-between;
}
.bar-free {
  height: 100%;
  background-color: var(--color-energy-free);
  transition: width 0.3s ease;
}
.bar-lock {
  height: 100%;
  background-color: var(--color-energy-lock);
  background-image: repeating-linear-gradient(
    45deg,
    transparent,
    transparent 4px,
    rgba(255, 255, 255, 0.28) 4px,
    rgba(255, 255, 255, 0.28) 8px
  );
  border-left: 1px solid rgba(255, 255, 255, 0.7);
  transition: width 0.3s ease;
}
```

### 4.2. Модульный SVG-конструктор питомца (Без внешних картинок)
Чтобы игра загружалась мгновенно и поддерживала 14 окрасов + оверлеи состояний, рендери питомца через inline SVG функцию `buildPetSVG(petState)`:
* **Слой 1 (Фон):** Если `petState.hasRingworm === true`, добавляй радиальный зеленый градиент свечения лампы Вуда (`#4ADE80`).
* **Слой 2 (Силуэт кота/собаки):** Цвета подставляются напрямую из `COAT_CATALOG[petState.coatId]` (`primary`, `secondary`, `stripes`, `eye`). При микроспории на ухе рисуется изумрудный кружок очага. При ринотрахеите (`hasEyeDrops`) у глаза рисуется голубая капля.
* **Слой 3 (Передний план — Клетка карантина):** Если `petState.inCage === true`, поверх SVG накладывается `div.cage-overlay` с полупрозрачными вертикальными прутьями и бейджем `Клетка со склада`.

### 4.3. Сцена питомца и Счетчик выводка
В карточке питомца обязательно присутствуют:
1. Кличка + кнопка `🎲 Кличка из картотеки Зоошанса` (берет случайное уникальное имя с топонимом из массива `PETNAMES_POOL` и дает ссылку на `https://forum.zooshans.by/app.php/petnames`).
2. Плашка счетчика выводка (для одиночных животных и для выводков):
   `На руках: X | На испытательном: Z | Дома: W из Y`.
3. Горизонтальный флекс-контейнер бейджей активных состояний (`🔦 Микроспория: день 8/35`, `💊 2-я глистогонка через 7 дн.`, `🧾 Финотчет через 5 дн.`).

### 4.4. Модальные окна (`<dialog>` или `.modal-backdrop`)
Все модальные окна используют единый паттерн с обязательным бейджем `⏸ Автопауза` в темной шапке:
1. **Модалка звонка «Ручек» (`#modal-caller`):**
   * Верстается как экран мессенджера/входящего звонка.
   * Реплики собеседника — белые бабблы слева.
   * Никаких цветовых подсказок («хороший/плохой человек») быть не должно!
   * Кнопка `🔍 Задать уточняющие вопросы (-5⚡)` списывает энергию и рендерит в чат дополнительные сообщения (ответы про сетки на окнах, этаж, корм, прошлых котов или курьерскую ссылку).
   * В подвале 3 кнопки решения: `✅ Отдать на испытательный`, `🤝 Компромисс + сопровождение (-15⚡)`, `❌ Отказать`.
2. **Модалка Ветклиники (`#modal-clinic`):**
   * Вверху — крупные радио-карточки переключения режима Колл-центра:
     * `Вариант А: Небольшая партнерская клиника (-20% сразу на месте, без долга)` — для базовых процедур.
     * `Вариант Б: Крупный круглосуточный ветцентр (Разовый талон -20% в долг на 30 дней, лимит до 1000 BYN)`.
   * **Правило честных блокировок:** Кнопки адресных процедур (ПЦР котятам без симптомов, Итраконазол без просвета на лишай, реанимационный стационар без угрозы жизни) **не скрываются**, а рендерятся со статусом `disabled` и понятным текстом на кнопке: `🔒 Нет диагноза Лишай` или `🔒 Симптомов нет`.
3. **Модалка Альбома и Story Card 9:16 (`#modal-album`):**
   * Сетка полароидных карточек спасенных животных из `localStorage` со штампом `ДОМА!`.
   * Блок прямых ссылок на инфраструктуру «Зоошанса» (ЕРИП `4346991`, `@zooshans_chat`, `@zooshans_info_bot`, `petnames`).
   * Генератор вертикальной карточки `1080x1920` через `<canvas id="story-canvas" width="1080" height="1920">` с кнопками `Скачать PNG` и `Поделиться (Web Share API)`.

---

## 5. Рекомендуемая файловая структура для Cloudflare Pages

Никаких сборщиков не требуется — чистая статика, готовая к деплою из корня:

```text
/
├── index.html              # Единый адаптивный каркас (Mobile + 3-col Desktop) + <dialog> модалки
├── css/
│   ├── variables.css       # Токены «Теплый крафт» и сезонные темы [data-season]
│   ├── layout.css          # Адаптивная сетка (100dvh Mobile SPA -> 3-col Desktop Grid)
│   └── components.css      # Шкалы, двухцветный бар энергии, карточки, бабблы чата, модалки
└── js/
    ├── main.js             # Точка входа, инициализация, делегирование кликов data-action
    ├── state.js            # Единый объект GameState, формулы пересчета выводка, localStorage
    ├── timer.js            # Игровой цикл (1x/2x/5x), пошаговые дни 1–3, автопауза и «⏩ Промотать штиль»
    ├── data/
    │   ├── coats.js        # COAT_CATALOG (10 кошачьих + 4 собачьих окраса) и PETNAMES_POOL
    │   ├── archetypes.js   # 19 архетипов животных из GDD
    │   └── callers.js      # Пул диалогов «ручек», мошенников и красных флагов
    └── ui/
        ├── render.js       # Функции обновления DOM (renderHUD, renderPetStage, renderTabs)
        ├── petSvg.js       # Генератор чистого SVG кота/собаки с клеткой и лампой Вуда
        └── storyCanvas.js  # Отрисовка карточки 9:16 на HTML5 Canvas для репоста в соцсети
```