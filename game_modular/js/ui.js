// ui.js - Отрисовка интерфейса, карточек, табов, логов, модалок, альбома и карточки 9:16 (v2.2)

// activeTab инициализируется в state.js
activeTab = 'vet';

// ================= 0. МОДУЛЬНЫЙ SVG-КОНСТРУКТОР ПИТОМЦА =================
function buildPetSVG(a, showCage = true) {
  if (!a) return '';
  const isDog = a.species === 'dog';
  const coatId = a.coatId || 'cow';
  const hasRingworm = a.knownRingworm === true;
  const inCage = showCage && ((state.zooshans && state.zooshans.hasCage && isAnimalAtPlayerHome()) || (state.zooshans && state.zooshans.locationStatus === 'home_cage'));
  const hasEyeIssue = (a.hiddenState && ((a.hiddenState.deadlyVirus && a.hiddenState.deadlyVirus.includes('rhinotracheitis')) || a.hiddenState.hasEyeDrops)) || a.health < 60;

  // Cat coat palette mapping (10 окрасов)
  const catPalette = {
    cow: { primary: '#27272A', secondary: '#F8FAFC', eye: '#F59E0B' },
    tabby: { primary: '#78716C', secondary: '#44403C', eye: '#10B981' },
    white_tabby: { primary: '#F5F5F4', secondary: '#78716C', eye: '#10B981' },
    black: { primary: '#18181B', secondary: '#27272A', eye: '#FBBF24' },
    grey: { primary: '#64748B', secondary: '#94A3B8', eye: '#10B981' },
    calico_spices: { primary: '#EA580C', secondary: '#F8FAFC', accent: '#18181B', eye: '#F59E0B' },
    white_ginger: { primary: '#F8FAFC', secondary: '#EA580C', eye: '#F59E0B' },
    ginger: { primary: '#EA580C', secondary: '#C2410C', eye: '#F59E0B' },
    colorpoint: { primary: '#FEF3C7', secondary: '#3F3F46', eye: '#0284C7' },
    purebred: { primary: '#475569', secondary: '#334155', eye: '#D97706' }
  };

  // Dog coat palette mapping (4 окраса)
  const dogPalette = {
    dark: { primary: '#27272A', secondary: '#B45309', eye: '#78350F' },
    foxy: { primary: '#D97706', secondary: '#FEF3C7', eye: '#78350F' },
    cheprak: { primary: '#57534E', secondary: '#A8A29E', eye: '#78350F' },
    cream: { primary: '#FEF9C3', secondary: '#E2E8F0', eye: '#78350F' }
  };

  const pal = isDog
    ? (dogPalette[coatId] || (a.coatName && a.coatName.includes('Лисичка') ? dogPalette.foxy : (a.coatName && a.coatName.includes('Чепрачный') ? dogPalette.cheprak : (a.coatName && (a.coatName.includes('Беляк') || a.coatName.includes('кремовый')) ? dogPalette.cream : dogPalette.dark))))
    : (catPalette[coatId] || catPalette.cow);

  let svg = `<svg viewBox="0 0 100 100" class="w-full h-full" xmlns="http://www.w3.org/2000/svg">`;

  svg += `<defs>
    <radialGradient id="ringwormGlow" cx="50%" cy="50%" r="50%">
      <stop offset="0%" stop-color="#4ADE80" stop-opacity="0.8"/>
      <stop offset="70%" stop-color="#22C55E" stop-opacity="0.3"/>
      <stop offset="100%" stop-color="#15803D" stop-opacity="0"/>
    </radialGradient>
  </defs>`;

  // Слой 1: Свечение лампы Вуда при лишае
  if (hasRingworm) {
    svg += `<circle cx="50" cy="50" r="46" fill="url(#ringwormGlow)" />`;
  }

  if (!isDog) {
    // КОТ
    svg += `<ellipse cx="50" cy="74" rx="28" ry="20" fill="${pal.primary}" />`;
    if (pal.secondary && pal.secondary !== pal.primary) {
      svg += `<ellipse cx="50" cy="76" rx="16" ry="14" fill="${pal.secondary}" />`;
    }
    // Уши
    svg += `<polygon points="26,44 34,16 46,36" fill="${pal.primary}" />`;
    svg += `<polygon points="30,40 35,22 43,35" fill="#F472B6" opacity="0.65" />`;
    svg += `<polygon points="74,44 66,16 54,36" fill="${pal.primary}" />`;
    svg += `<polygon points="70,40 65,22 57,35" fill="#F472B6" opacity="0.65" />`;

    // Голова
    svg += `<circle cx="50" cy="46" r="24" fill="${pal.primary}" />`;
    if (coatId === 'colorpoint') {
      svg += `<ellipse cx="50" cy="50" rx="14" ry="12" fill="${pal.secondary}" />`;
    } else if (pal.secondary && coatId !== 'black' && coatId !== 'grey' && coatId !== 'purebred') {
      svg += `<ellipse cx="50" cy="54" rx="10" ry="8" fill="${pal.secondary}" />`;
    }

    // Глаза
    svg += `<ellipse cx="40" cy="42" rx="4.5" ry="5.5" fill="${pal.eye}" />`;
    svg += `<ellipse cx="60" cy="42" rx="4.5" ry="5.5" fill="${pal.eye}" />`;
    svg += `<ellipse cx="40" cy="42" rx="1.8" ry="4.5" fill="#18181B" />`;
    svg += `<ellipse cx="60" cy="42" rx="1.8" ry="4.5" fill="#18181B" />`;
    svg += `<circle cx="41.5" cy="40" r="1.2" fill="#FFFFFF" />`;
    svg += `<circle cx="61.5" cy="40" r="1.2" fill="#FFFFFF" />`;

    // Носик и ротик
    svg += `<polygon points="48,51 52,51 50,54" fill="#F472B6" />`;
    svg += `<path d="M47,56 Q50,58 53,56" stroke="#52525B" stroke-width="1.2" fill="none" stroke-linecap="round" />`;

    // Усы
    svg += `<line x1="34" y1="52" x2="16" y2="49" stroke="#E4E4E7" stroke-width="1.2" stroke-linecap="round" />`;
    svg += `<line x1="34" y1="55" x2="18" y2="57" stroke="#E4E4E7" stroke-width="1.2" stroke-linecap="round" />`;
    svg += `<line x1="66" y1="52" x2="84" y2="49" stroke="#E4E4E7" stroke-width="1.2" stroke-linecap="round" />`;
    svg += `<line x1="66" y1="55" x2="82" y2="57" stroke="#E4E4E7" stroke-width="1.2" stroke-linecap="round" />`;

  } else {
    // СОБАКА
    svg += `<ellipse cx="50" cy="74" rx="30" ry="20" fill="${pal.primary}" />`;
    if (pal.secondary) {
      svg += `<ellipse cx="50" cy="76" rx="16" ry="14" fill="${pal.secondary}" />`;
    }
    // Висячие уши
    svg += `<ellipse cx="26" cy="38" rx="9" ry="16" fill="${pal.primary}" transform="rotate(-15 26 38)" />`;
    svg += `<ellipse cx="74" cy="38" rx="9" ry="16" fill="${pal.primary}" transform="rotate(15 74 38)" />`;

    // Морда
    svg += `<ellipse cx="50" cy="48" rx="24" ry="22" fill="${pal.primary}" />`;
    if (pal.secondary) {
      svg += `<ellipse cx="50" cy="56" rx="13" ry="10" fill="${pal.secondary}" />`;
    }

    // Глаза
    svg += `<circle cx="40" cy="44" r="4.5" fill="${pal.eye}" />`;
    svg += `<circle cx="60" cy="44" r="4.5" fill="${pal.eye}" />`;
    svg += `<circle cx="40" cy="44" r="2.5" fill="#18181B" />`;
    svg += `<circle cx="60" cy="44" r="2.5" fill="#18181B" />`;
    svg += `<circle cx="41" cy="42.5" r="1.2" fill="#FFFFFF" />`;
    svg += `<circle cx="61" cy="42.5" r="1.2" fill="#FFFFFF" />`;

    // Носик и язычок
    svg += `<ellipse cx="50" cy="55" rx="5" ry="3.5" fill="#18181B" />`;
    svg += `<path d="M48,58 Q50,62 52,58" stroke="#18181B" stroke-width="1.2" fill="none" />`;
    svg += `<ellipse cx="50" cy="62" rx="3" ry="4" fill="#FB7185" />`;
  }

  // Очаг лишая на ушке (с учетом анатомии ушей кота и висячих ушей собаки)
  if (hasRingworm) {
    const earX = isDog ? 25 : 33;
    const earY = isDog ? 34 : 22;
    svg += `<circle cx="${earX}" cy="${earY}" r="4.5" fill="#4ADE80" stroke="#16A34A" stroke-width="1.5" />`;
    svg += `<circle cx="${earX}" cy="${earY}" r="2" fill="#86EFAC" />`;
  }

  // Капля у глаза при ринотрахеите / проблемах
  if (hasEyeIssue) {
    svg += `<path d="M43,47 C43,47 45,51 45,53 C45,54.5 43.8,55.5 42.5,55.5 C41.2,55.5 40,54.5 40,53 C40,51 43,47 43,47 Z" fill="#38BDF8" stroke="#0284C7" stroke-width="0.8" />`;
  }

  svg += `</svg>`;

  // Слой 3: Оверлей клетки
  if (inCage) {
    svg += `<div class="cage-overlay-grid"></div>`;
    svg += `<div class="cage-badge-label">🛡️ Клетка со склада</div>`;
  }

  return svg;
}

function switchTab(tabName) {
  activeTab = tabName;
  if (typeof closeAllResourceTooltips === 'function') {
    closeAllResourceTooltips();
  }
  ['vet', 'zooshans', 'care'].forEach(t => {
    const content = document.getElementById('tabContent_' + t);
    const btn = document.getElementById('tabBtn_' + t);
    if (!content || !btn) return;
    if (t === tabName) {
      content.classList.remove('hidden');
      btn.className = 'px-3 py-1.5 rounded-lg text-xs font-mono font-bold bg-emerald-600 text-white transition shadow-sm';
    } else {
      content.classList.add('hidden');
      btn.className = 'px-3 py-1.5 rounded-lg text-xs font-mono font-semibold bg-[var(--bg-muted)] hover:bg-[var(--bg-elevated)] text-[var(--text-primary)] border border-[var(--border-subtle)] transition';
    }
  });
}

function renderAll() {
  renderTopBar();
  renderPlayerAndAnimalCards();
  renderActionTabs();
  renderDeadlines();
  renderLog();
  updateHeaderMentorCounter();
  updateResourceTooltips();
}

function renderTopBar() {
  const a = state.animal;
  const isAcute = state.onboarding && state.onboarding.acutePhase;

  // Динамическая сезонная тема на <body>
  document.body.setAttribute('data-season', state.currentSeason || 'summer');

  // Счетчик игрового дня
  document.getElementById('dayCounter').textContent = state.day;

  // Календарная дата (GDD 2.2)
  const calBadge = document.getElementById('calendarDateBadge');
  if (calBadge && state.calendarDate) {
    calBadge.textContent = `📅 ${formatCalendarDate(state.calendarDate)}`;
  }

  // Бейдж острой фазы (Дни 1-3)
  const acuteBadge = document.getElementById('acutePhaseBadge');
  if (acuteBadge) {
    if (isAcute) {
      acuteBadge.classList.remove('hidden');
      acuteBadge.textContent = `🌙 Острая фаза (День ${state.day}/3)`;
    } else {
      acuteBadge.classList.add('hidden');
    }
  }

  // Обновление кнопок скорости
  updateSpeedButtonsUI();

  // Фото и кличка подопечного в хедере
  const headerAvatarEl = document.getElementById('headerPetAvatar');
  if (headerAvatarEl && a) {
    headerAvatarEl.innerHTML = buildPetSVG(a, false);
    if (a.knownRingworm) headerAvatarEl.classList.add('ringworm-glow');
    else headerAvatarEl.classList.remove('ringworm-glow');
  }
  const headerNameEl = document.getElementById('headerPetName');
  if (headerNameEl && a) {
    if (a.petName) {
      headerNameEl.textContent = `«${a.petName}»`;
    } else if (a.count > 1 || a.initialCount > 1) {
      const cnt = a.activeCount !== undefined ? a.activeCount : a.count;
      const word = a.species === 'dog' ? 'щенков' : 'котят';
      headerNameEl.textContent = `Выводок ${word} (${cnt} шт.)`;
    } else {
      headerNameEl.textContent = '«Найденыш»';
    }
  }

  // Возраст питомца
  const ageBadgeEl = document.getElementById('animalAgeBadge');
  if (ageBadgeEl && a) {
    ageBadgeEl.textContent = `Возраст: ${formatAgeText(a.ageDays)}`;
  }

  // Сезонный бейдж (GDD 2.2)
  const seasonBadge = document.getElementById('seasonBadge');
  if (seasonBadge && state.currentSeason) {
    const seasonInfoMap = {
      summer: { label: '☀️ Лето: Сезон котят (-75% звонков)' },
      autumn: { label: '🍂 Осень: +25% звонков / Хэллоуин' },
      winter: { label: '❄️ Зима: Спрос к НГ / Мороз' },
      spring: { label: '🌱 Весна: Сезон клещей и кошек' }
    };
    const sInfo = seasonInfoMap[state.currentSeason] || { label: getSeasonLabelRu(state.currentSeason) };
    seasonBadge.textContent = sInfo.label;
    seasonBadge.classList.remove('hidden');
  }

  // Счетчик сохраненных хвостов в хедере
  const headerAlbumEl = document.getElementById('headerAlbumCount');
  if (headerAlbumEl) {
    headerAlbumEl.textContent = getSavedAlbum().length;
  }

  // Бюджет в BYN
  const cashEl = document.getElementById('cashValue');
  cashEl.textContent = `${state.cash} BYN`;
  cashEl.className = state.cash < 60
    ? 'font-mono font-extrabold text-base sm:text-lg text-rose-700'
    : 'font-mono font-extrabold text-base sm:text-lg text-emerald-700';

  // Запас расходников
  const totalSup = state.supplies.daysLeft + state.zooshans.giftedFoodDaysLeft;
  const supEl = document.getElementById('supplyDaysBadge');
  supEl.textContent = `Корм: ${totalSup} дн.`;
  supEl.className = totalSup <= 2
    ? 'craft-badge text-[11px] font-bold text-rose-800 bg-rose-50 border-rose-400 animate-pulse'
    : 'craft-badge text-[11px] font-bold text-emerald-800 bg-emerald-50 border-emerald-300';

  // Долг по талону (лимит 1000 BYN)
  const vDebtEl = document.getElementById('voucherDebtText');
  const vTimerEl = document.getElementById('voucherTimerText');
  vDebtEl.textContent = `${state.zooshans.voucherDebt} / 1000 BYN`;
  vDebtEl.className = state.zooshans.voucherDebt >= 800 ? 'font-bold text-rose-700' : (state.zooshans.voucherDebt > 0 ? 'font-bold text-amber-700' : 'font-bold text-[var(--text-secondary)]');
  vTimerEl.textContent = state.zooshans.voucherDebt > 0
    ? (state.zooshans.voucherBlocked ? '⚠️ ТАЛОНЫ ЗАБЛОКИРОВАНЫ' : `Срок: ${state.zooshans.voucherDaysLeft} дн.`)
    : 'Срок: 30 дней';

  const voucherBar = document.getElementById('voucherDebtBar');
  if (voucherBar) {
    const vPct = Math.min(100, Math.round((state.zooshans.voucherDebt / 1000) * 100));
    voucherBar.style.width = `${vPct}%`;
  }

  // Менталка
  document.getElementById('mentalValue').textContent = `${state.mental}%`;
  document.getElementById('mentalBar').style.width = `${state.mental}%`;

  // Двухсегментная шкала Энергии (доступно + резерв быта дома)
  const drain = calculateDailyHouseholdEnergyDrain();
  const resLabel = document.getElementById('energyReserveLabel');
  if (resLabel) {
    resLabel.textContent = isAnimalAtPlayerHome()
      ? `-${drain}⚡/д`
      : '0⚡/д';
  }
  document.getElementById('energyValue').textContent = `${state.energy}⚡`;

  const freeVal = Math.max(0, state.energy - (isAnimalAtPlayerHome() ? drain : 0));
  const lockVal = isAnimalAtPlayerHome() ? drain : 0;
  const freeValEl = document.getElementById('energy-free-val');
  const lockValEl = document.getElementById('energy-lock-val');
  if (freeValEl) freeValEl.textContent = `${freeVal}⚡`;
  if (lockValEl) lockValEl.textContent = `${lockVal}🔒`;

  const barAvail = document.getElementById('energyBarAvailable');
  const barRes = document.getElementById('energyBarReserved');
  if (barAvail && barRes) {
    const energyPct = Math.min(100, Math.max(0, state.energy));
    const reservedPct = isAnimalAtPlayerHome() ? Math.min(65, drain) : 0;
    const availPct = Math.max(0, energyPct - reservedPct);
    barAvail.style.width = `${availPct}%`;
    barRes.style.width = `${reservedPct}%`;
  }

  // Расшифровка быта для тултипа энергии (GDD 4.1)
  const energyTooltipTitle = document.getElementById('energyTooltipTitle');
  const energyBreakdownText = document.getElementById('energy-breakdown-text');
  if (energyBreakdownText) {
    if (isAnimalAtPlayerHome()) {
      if (energyTooltipTitle) energyTooltipTitle.textContent = `🔒 Резерв быта дома: -${drain}⚡/день`;
      const details = [];
      if (state.newborn && state.newborn.active) {
        details.push('Выкармливание слепышей каждые 2 ч (-30⚡)');
      } else if (a.totalCount > 1) {
        details.push(`Выводок (${a.activeCount || a.totalCount}/${a.totalCount} шт.)`);
      } else {
        details.push(a.species === 'dog' ? 'Выгул и уход за собакой (-16⚡)' : 'Лоток и кормление кота (-10⚡)');
      }
      if (a.knownRingworm === true) details.push('Обработки очагов лишая (-12⚡)');
      if (a.hiddenState && a.hiddenState.hasSevereTrauma && !a.traumaOperated) details.push('Уход за травмой (-10⚡)');
      if (state.pr && state.pr.lostSearchActive) details.push('Расклейка объявлений (-10⚡)');
      energyBreakdownText.textContent = details.length > 0 ? details.join(', ') : 'Ежедневный базовый уход';
    } else {
      if (energyTooltipTitle) energyTooltipTitle.textContent = '🔒 Быт дома: 0⚡/день';
      energyBreakdownText.textContent = 'Питомец находится на передержке, бытовая энергия дома не резервируется.';
    }
  }

  // Жизнь питомца и счетчик хвостов в шапке (GDD 7.1, 8.4)
  const tailsBadge = document.getElementById('headerTailsStatusBadge');
  if (tailsBadge) {
    const act = a.activeCount !== undefined ? a.activeCount : (a.count || 1);
    const tri = (state.trialAnimals || []).reduce((sum, item) => sum + (item.count || 1), 0);
    const sav = state.savedTails ? state.savedTails.length : 0;
    const tot = a.totalCount || a.initialCount || 1;

    let text = `На руках: ${act}`;
    if (tri > 0) text += ` • Испытание: ${tri}`;
    if (tot > 1 && sav > 0) text += ` • Дома: ${sav}/${tot}`;
    tailsBadge.textContent = `🐾 ${text}`;
    tailsBadge.classList.remove('hidden');
  }

  document.getElementById('animalHealthValue').textContent = `${a.health}%`;
  document.getElementById('healthBar').style.width = `${a.health}%`;

  // Баннер беглеца
  const escBanner = document.getElementById('escapeUrgentBanner');
  if (escBanner) {
    if (state.escapeQuest && state.escapeQuest.active) {
      escBanner.classList.remove('hidden');
      document.getElementById('escapeDaysLeftTag').textContent = `Осталось ${state.escapeQuest.daysRemaining} дн.`;
      document.getElementById('escapeProgressTag').textContent = `Шкала поиска: ${state.escapeQuest.searchProgress}% / 100% (${state.escapeQuest.reason})`;
    } else {
      escBanner.classList.add('hidden');
    }
  }

  // Баннер выкорма слепышей
  const nbBanner = document.getElementById('newbornUrgentBanner');
  if (state.newborn.active && nbBanner) {
    nbBanner.classList.remove('hidden');
    const btnCow = document.getElementById('btnCowMilkTrap');
    const btnBuy = document.getElementById('btnBuyFormula');
    const btnFeed = document.getElementById('btnFeedNewborns');

    if (state.gameOver) {
      if (btnCow) {
        btnCow.disabled = true;
        btnCow.classList.add('cursor-not-allowed', 'opacity-50');
        btnCow.title = 'Партия окончена: только просмотр';
      }
      if (btnBuy) {
        btnBuy.disabled = true;
        btnBuy.classList.add('cursor-not-allowed', 'opacity-50');
        btnBuy.title = 'Партия окончена: только просмотр';
      }
      if (btnFeed) {
        btnFeed.disabled = true;
        btnFeed.classList.add('cursor-not-allowed', 'opacity-50');
        btnFeed.title = 'Партия окончена: только просмотр';
      }
    } else if (!isAnimalAtPlayerHome()) {
      document.getElementById('milkSupplyTag').textContent = `Котята на передержке. Запас смеси: ${state.newborn.milkDaysLeft} дн. (Куратор обеспечивает питание!)`;
      if (btnCow) btnCow.classList.add('hidden');
      if (btnBuy) btnBuy.classList.remove('hidden');
      if (btnFeed) btnFeed.classList.add('hidden');
    } else {
      if (!state.newborn.knowsAboutFormula) {
        document.getElementById('milkSupplyTag').textContent = 'Чем кормить: Неизвестно (Позвоните в Колл-центр «Зоошанса»!)';
        if (btnCow) btnCow.classList.remove('hidden');
        if (btnBuy) btnBuy.classList.add('hidden');
      } else {
        document.getElementById('milkSupplyTag').textContent = `Запас смеси: ${state.newborn.milkDaysLeft} дн. (Паштет Babycat с 21 дн., сейчас ${a.ageDays} дн.)`;
        if (btnCow) btnCow.classList.add('hidden');
        if (btnBuy) btnBuy.classList.remove('hidden');
      }

      if (btnFeed) {
        btnFeed.classList.remove('hidden');
        if (state.newborn.fedToday) {
          btnFeed.disabled = true;
          btnFeed.className = 'flex-1 sm:flex-initial px-3 py-1.5 rounded-lg bg-slate-800 text-slate-400 font-bold text-xs cursor-not-allowed';
          btnFeed.textContent = '✓ Покормлен(ы) сегодня';
        } else {
          btnFeed.disabled = false;
          btnFeed.className = 'urgent-btn flex-1 sm:flex-initial px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs transition';
          btnFeed.textContent = '🍼 Покормить из соски (-15⚡)';
        }
      }
    }
  } else if (nbBanner) {
    nbBanner.classList.add('hidden');
  }
}

function renderPlayerAndAnimalCards() {
  const p = state.player;
  const a = state.animal;
  const h = a.hiddenState || {};

  // Лимит сбора на карту (6500 BYN)
  document.getElementById('cardLimitBadge').textContent = `${state.zooshans.personalCardCollectedBYN} / 6500 BYN`;

  const salaryDays = 30 - (state.day % 30);
  document.getElementById('salaryCountdown').textContent = salaryDays === 30 ? 'ЗП сегодня!' : `ЗП через ${salaryDays} дн.`;

  const drain = calculateDailyHouseholdEnergyDrain();
  document.getElementById('dailyExpenseLabel').textContent = isAnimalAtPlayerHome() ? `Быт дома: -${drain}⚡/д` : 'Быт: 0⚡/д (на передержке)';

  // Кнопка переключения передержки в снабжении
  const btnFosterToggle = document.getElementById('btnTogglePaidFoster');
  if (btnFosterToggle) {
    const g = getAnimalGrammar(a);
    const costDaily = g.isDog ? 33 : 16;
    if (state.gameOver) {
      btnFosterToggle.disabled = true;
      btnFosterToggle.className = 'px-2 py-0.5 rounded text-[10px] font-bold font-mono transition bg-slate-100 text-slate-400 border border-slate-300 opacity-50 cursor-not-allowed';
      btnFosterToggle.title = 'Партия окончена: только просмотр';
    } else if (state.zooshans.locationStatus === 'paid_foster') {
      btnFosterToggle.disabled = false;
      btnFosterToggle.textContent = '🏠 Забрать домой';
      btnFosterToggle.className = 'px-2 py-0.5 rounded text-[10px] font-bold font-mono bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 transition cursor-pointer';
      btnFosterToggle.title = 'Вернуть питомца с передержки домой';
    } else {
      btnFosterToggle.disabled = false;
      btnFosterToggle.textContent = `🏡 На платную (${costDaily} BYN/д)`;
      btnFosterToggle.className = 'px-2 py-0.5 rounded text-[10px] font-bold font-mono bg-emerald-50 hover:bg-emerald-100 text-emerald-900 border border-emerald-300 transition cursor-pointer';
      btnFosterToggle.title = `Перевезти на платную передержку (${costDaily} BYN/сут + ваш корм)`;
    }
  }

  // Строка запаса спецсмеси для котят
  const milkBox = document.getElementById('milkSupplyBox');
  if (milkBox) {
    const isUnder2Months = a && a.species === 'cat' && a.ageDays < 60 && a.ageCategory !== 'adult';
    const hasRemainingMilk = state.newborn && (state.newborn.milkDaysLeft || 0) > 0;
    if (isUnder2Months || hasRemainingMilk) {
      milkBox.classList.remove('hidden');
      document.getElementById('milkSupplyLabel').textContent = `🍼 Смесь: ${state.newborn.milkDaysLeft || 0} дн.`;
    } else {
      milkBox.classList.add('hidden');
    }
  }

  const btnSidebarFormula = document.getElementById('btnSidebarBuyFormula');
  if (btnSidebarFormula) {
    const isPast2Months = a && (a.ageDays >= 60 || a.ageCategory === 'adult');
    if (state.gameOver) {
      btnSidebarFormula.disabled = true;
      btnSidebarFormula.className = 'px-2 py-0.5 rounded text-[10px] font-bold font-mono transition bg-slate-100 text-slate-400 border border-slate-300 opacity-50 cursor-not-allowed';
      btnSidebarFormula.title = 'Партия окончена: только просмотр';
    } else if (isPast2Months) {
      btnSidebarFormula.disabled = true;
      btnSidebarFormula.className = 'px-2 py-0.5 rounded text-[10px] font-bold font-mono transition bg-slate-100 text-slate-400 border border-slate-300 opacity-50 cursor-not-allowed';
      btnSidebarFormula.title = 'Котята старше 2 месяцев переведены на влажный/сухой корм (смесь не требуется)';
    } else {
      btnSidebarFormula.disabled = false;
      btnSidebarFormula.className = 'px-2 py-0.5 rounded text-[10px] font-bold font-mono transition bg-indigo-50 text-indigo-800 border border-indigo-300 hover:bg-indigo-100 cursor-pointer';
      btnSidebarFormula.title = 'Купить банку смеси Babycat Milk (105 BYN)';
    }
  }

  // Статус заявления в Зоошанс
  const appBadge = document.getElementById('applicationStatusBadge');
  if (appBadge) {
    if (state.zooshans.applicationSubmitted) {
      appBadge.textContent = '✓ Зарегистрирован (Скидка -20% активна)';
      appBadge.className = 'text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-100 text-emerald-900 border border-emerald-300 font-semibold cursor-default';
      appBadge.title = 'Скидка 20% активна во всех ветцентрах';
    } else {
      appBadge.textContent = 'Заявление не подано (скидка 0%, талон закрыт)';
      appBadge.className = 'text-[10px] font-mono px-2 py-0.5 rounded bg-amber-100 hover:bg-amber-200 text-amber-900 border border-amber-300 font-semibold cursor-pointer transition';
      appBadge.title = 'Нажмите, чтобы перейти во 2-ю вкладку и подать заявление';
    }
  }

  // Шкала лимита карты
  const cardBar = document.getElementById('cardLimitBar');
  if (cardBar) {
    const cardPct = Math.min(100, Math.round((state.zooshans.personalCardCollectedBYN / 6500) * 100));
    cardBar.style.width = `${cardPct}%`;
  }

  // Кнопки выбора клиники
  const btnClinicPartner = document.getElementById('btnClinicPartner');
  const btnClinicMajor = document.getElementById('btnClinicMajor');
  if (btnClinicPartner && btnClinicMajor) {
    if (state.gameOver) {
      btnClinicPartner.disabled = true;
      btnClinicMajor.disabled = true;
      btnClinicPartner.className = 'p-2 rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-muted)] text-left font-mono text-[10px] text-[var(--text-muted)] opacity-50 cursor-not-allowed transition';
      btnClinicMajor.className = 'p-2 rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-muted)] text-left font-mono text-[10px] text-[var(--text-muted)] opacity-50 cursor-not-allowed transition';
      btnClinicPartner.title = 'Партия окончена: только просмотр';
      btnClinicMajor.title = 'Партия окончена: только просмотр';
    } else if (!state.zooshans.applicationSubmitted) {
      btnClinicPartner.disabled = false;
      btnClinicPartner.className = 'p-2 rounded-lg border-2 border-emerald-600 bg-emerald-50 text-left font-mono text-[10px] text-emerald-950 transition';
      btnClinicPartner.title = 'Оплата сразу (из бюджета)';
      
      btnClinicMajor.disabled = true;
      btnClinicMajor.className = 'p-2 rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-muted)] text-left font-mono text-[10px] text-[var(--text-muted)] opacity-50 cursor-not-allowed transition';
      btnClinicMajor.title = '🔒 Требуется регистрация в Колл-центре «Зоошанса» (вкладка 2)';
    } else {
      btnClinicPartner.disabled = false;
      btnClinicMajor.disabled = false;
      btnClinicMajor.title = 'В долг Зоошанса (до 1000 BYN на 30 дней)';

      if (state.zooshans.clinicMode === 'partner_cash') {
        btnClinicPartner.className = 'p-2 rounded-lg border-2 border-emerald-600 bg-emerald-50 text-left font-mono text-[10px] text-emerald-950 transition cursor-pointer';
        btnClinicMajor.className = 'p-2 rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-muted)] text-left font-mono text-[10px] text-[var(--text-secondary)] transition hover:bg-[var(--bg-elevated)] cursor-pointer';
      } else {
        btnClinicPartner.className = 'p-2 rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-muted)] text-left font-mono text-[10px] text-[var(--text-secondary)] transition hover:bg-[var(--bg-elevated)] cursor-pointer';
        btnClinicMajor.className = 'p-2 rounded-lg border-2 border-sky-600 bg-sky-50 text-left font-mono text-[10px] text-sky-950 transition cursor-pointer';
      }
    }
  }

  const giftFoodEl = document.getElementById('giftedFoodBadge');
  if (state.zooshans.giftedFoodDaysLeft > 0) {
    giftFoodEl.classList.remove('hidden');
    giftFoodEl.textContent = `🎁 Подаренный корм: ${state.zooshans.giftedFoodDaysLeft} дн.`;
  } else {
    giftFoodEl.classList.add('hidden');
  }

  const giftBanner = document.getElementById('giftThankYouBanner');
  if (state.zooshans.pendingGiftThankYou) giftBanner.classList.remove('hidden');
  else giftBanner.classList.add('hidden');

  const locMap = {
    'home_floor': '⚠️ Живет у вас дома на полу (без клетки)',
    'home_cage': '🛡️ У вас дома в клетке «Зоошанса»',
    'paid_foster': '🏡 На коммерческой передержке (быт снят)',
    'temp_volunteer_14d': `⏳ У волонтера на карантине/стабилизации (${state.zooshans.tempVolunteerDaysLeft} дн., быт снят)`,
    'temp_volunteer_10d': `⏳ У волонтера на карантине/стабилизации (${state.zooshans.tempVolunteerDaysLeft} дн., быт снят)`,
    'full_volunteer_fincuration': '🤝 У волонтера (Вы — финкуратор и снабженец)',
    'social_foster_volunteer': '🤝 На передержке у опытного волонтера (быт снят)',
    'social_foster_novice': `🏠 Бесплатно у человека из соцсетей (${state.zooshans.socialFosterDaysElapsed} дн.)`,
    'maneuver_adopters': '⏳ Временно у несостоявшихся ручек (маневр 3 дня)'
  };
  document.getElementById('fosterStatusBadge').textContent = locMap[state.zooshans.locationStatus] || 'Дома';

  // Теги профиля игрока (включая 6-ю ось Социального капитала, GDD 3.0)
  const playerTags = [
    p.income.label, p.housing.label, p.family.label, p.ownPets.label, p.mobility.label
  ];
  if (p.socialCapital) playerTags.push(p.socialCapital.label);
  document.getElementById('playerTagsContainer').innerHTML = playerTags
    .map(t => `<span class="craft-badge text-[10px]">${t}</span>`).join('');

  // Модульный SVG-аватар питомца
  const svgBox = document.getElementById('petSvgContainer');
  if (svgBox) {
    svgBox.innerHTML = buildPetSVG(a);
    if (a.knownRingworm) svgBox.classList.add('ringworm-glow');
    else svgBox.classList.remove('ringworm-glow');
  }

  // Карточка животного: кличка по канону Зоошанса + архетип (GDD 4.1)
  const actCount = a.activeCount !== undefined ? a.activeCount : (a.count || 1);
  document.getElementById('animalSpeciesBadge').textContent = actCount > 1 ? `${a.speciesLabel} [Осталось: ${actCount}]` : a.speciesLabel;
  const petDisplayName = a.petName
    ? `«${a.petName}»`
    : (actCount > 1 ? `Выводок (${actCount} малышей, без клички)` : '«Найденыш»');
  const renameButtons = state.gameOver ? '' : ` <button onclick="actionRollRandomPetName()" title="Сгенерировать кличку из картотеки Зоошанса" class="ml-1 text-xs hover:scale-125 transition">🎲</button> <button onclick="triggerPetNamingModal()" title="Уникальная кличка по правилам Зоошанса" class="text-xs hover:scale-125 transition">✏️</button>`;
  document.getElementById('animalTitle').innerHTML = `${petDisplayName}${renameButtons} — ${a.title}`;
  document.getElementById('coatPopularityBadge').textContent = `Окрас: ${a.coatLabel}`;
  document.getElementById('animalDescription').textContent = a.visualDescription;
  document.getElementById('visibleStateText').textContent = `Статус: ${a.visibleState}`;

  // Живой чек-лист подготовки
  const qDone = a.quarantineDaysDone >= 14;
  const qTag = {
    t: qDone ? '✓ Карантин: 14/14 дн.' : `⏳ Карантин: ${a.quarantineDaysDone}/14 дн.`,
    c: qDone ? 'bg-emerald-50 text-emerald-800 border-emerald-300' : 'bg-amber-50 text-amber-800 border-amber-300'
  };

  let dwTag = { t: '💊 Глистогонка: 0/2', c: 'bg-rose-50 text-rose-800 border-rose-300' };
  if (a.dewormStage === 1) {
    const waitLeft = Math.max(0, 10 - a.daysSinceDeworm1);
    dwTag = waitLeft > 0
      ? { t: `⏳ Глистогонка: 1/2 (2-я через ${waitLeft} дн.)`, c: 'bg-amber-50 text-amber-800 border-amber-300' }
      : { t: '🔔 Глистогонка: 1/2 (ДАЙТЕ 2-Ю ТАБЛЕТКУ!)', c: 'bg-amber-500 text-slate-950 font-bold border-amber-600 animate-pulse' };
  } else if (a.dewormStage === 2) {
    const validLeft = Math.max(0, 180 - a.daysSinceDeworm2);
    dwTag = { t: `✓ Глистогонка: 2/2 (еще ${validLeft}/180 дн.)`, c: 'bg-emerald-50 text-emerald-800 border-emerald-300' };
  }

  const isOrphanBaby = !a.hasMotherCat && (a.ageCategory === 'kitten' || a.ageCategory === 'puppy');
  const ageWait = Math.max(0, 60 - a.ageDays);
  const vacTag = {
    t: a.parasitesAndVaccinated
      ? '✓ Вакцинация: Да'
      : (isOrphanBaby && a.ageDays < 60
          ? `💉 Вакцинация: с 60 дн. (малышей без мамы отдают до 60 дн. по договору)`
          : (ageWait > 0 ? `💉 Вакцинация с 60 дн. (ждем ${ageWait} дн.)` : '💉 Вакцинация: Ждет 2/2 глистогонки')),
    c: a.parasitesAndVaccinated ? 'bg-emerald-50 text-emerald-800 border-emerald-300' : 'bg-[var(--bg-muted)] text-[var(--text-secondary)] border-[var(--border-subtle)]'
  };

  const isPuppy = a.species === 'dog' && (a.ageCategory === 'puppy' || a.ageDays < 180);
  const toiletTypeLabel = isPuppy ? 'Пеленка' : (a.species === 'dog' ? 'Выгул' : 'Лоток');
  const litterTag = {
    t: a.litterTrained
      ? `✓ ${toiletTypeLabel}: ${isPuppy ? '5+' : (a.species === 'dog' ? 'Приучен' : '5+')}`
      : `🚽 ${toiletTypeLabel}: ${a.litterTrainDaysDone || 0}/8 дн.`,
    c: a.litterTrained ? 'bg-emerald-50 text-emerald-800 border-emerald-300' : 'bg-amber-50 text-amber-800 border-amber-300'
  };

  const checklistArr = [qTag, dwTag, vacTag, litterTag];
  if (a.knownRingworm === true) {
    checklistArr.push({
      t: `🍄 Лечение лишая в клетке: ${a.ringwormDaysDone}/35 дн.`,
      c: 'bg-rose-100 text-rose-900 border-rose-400 font-bold'
    });
  }
  if (a.hiddenState.needsSocialization) {
    checklistArr.push({
      t: `💛 Социализация: ${a.hiddenState.socializationDaysDone}/14 дн.`,
      c: 'bg-amber-100 text-amber-900 border-amber-400 font-semibold'
    });
  }
  if (a.hiddenState.isJawFracture && a.hiddenState.syringeDaysLeft > 0) {
    checklistArr.push({
      t: `🥣 Кормление через шприц/стому: ${a.hiddenState.syringeDaysLeft} дн.`,
      c: 'bg-sky-100 text-sky-900 border-sky-400 font-semibold'
    });
  }

  // Защита собаки от иксодовых клещей (GDD 6.3)
  if (a.species === 'dog') {
    if (a.tickProtectionDaysLeft > 0) {
      checklistArr.push({
        t: `🛡️ Защита от клещей: ${a.tickProtectionDaysLeft}/30 дн.`,
        c: 'bg-emerald-50 text-emerald-800 border-emerald-300'
      });
    } else {
      checklistArr.push({
        t: `⚠️ Без защиты от клещей (капли 35 BYN)`,
        c: 'bg-rose-100 text-rose-900 border-rose-400 font-bold animate-pulse'
      });
    }
  }

  document.getElementById('animalChecklistTags').innerHTML = checklistArr
    .map(item => `<span class="craft-badge text-[11px] ${item.c}">${item.t}</span>`).join('');

  // Подсказка следующего шага
  let nextHint = 'Готов к пиару на сайтах!';
  const isDogConfined = a.traumaOperated || (h && h.hasSevereTrauma) || a.id === 'severe_trauma_sheri_dog' || (a.inStationaryDaysLeft && a.inStationaryDaysLeft > 0);
  if (a.inStationaryDaysLeft && a.inStationaryDaysLeft > 0) {
    nextHint = `Животное на интенсивном лечении в стационаре клиники (осталось ${a.inStationaryDaysLeft} дн.). Обработку можно провести позже, после стационара.`;
  } else if (a.virusRecoveryDaysLeft && a.virusRecoveryDaysLeft > 0) {
    nextHint = `Восстановление после вируса: щадящая диета и карантин (осталось ${a.virusRecoveryDaysLeft} дн. до пиара)`;
  } else if (a.traumaRehabDaysLeft && a.traumaRehabDaysLeft > 0) {
    nextHint = `Реабилитация после перелома: покой и сращение костей (осталось ${a.traumaRehabDaysLeft} дн. до пиара)`;
  } else if (state.pr.earlyBookedAdopterWaiting) nextHint = 'Малыш забронирован! Передайте его семье по договору (вкладка 3) до вакцинации.';
  else if (h.hasSevereTrauma && !a.traumaOperated) {
    nextHint = !state.zooshans.applicationSubmitted
      ? 'Подайте заявление в Колл-центр «Зоошанса» (вкладка 2), чтобы согласовать талон на экстренную операцию!'
      : 'Экстренно согласуйте и проведите операцию в реанимационном стационаре (вкладка 1)!';
  }
  else if (!state.zooshans.applicationSubmitted) nextHint = 'Подайте заявление в Колл-центр «Зоошанса» (вкладка 2) для клетки и скидки 20%';
  else if (a.traumaOperated && isDogConfined && a.dewormStage === 0) nextHint = 'Собака на реабилитации после операции (стационар/покой). Обработку от паразитов можно провести позже, после стационара.';
  else if (!a.examinedWood) nextHint = 'Сделайте первичный осмотр и просвет лампой Вуда (вкладка 1)';
  else if (a.dewormStage === 0) nextHint = 'Дайте 1-ю таблетку от глистов (26 BYN)';
  else if (a.dewormStage === 1 && a.daysSinceDeworm1 < 10) nextHint = `Подождите ${10 - a.daysSinceDeworm1} дн. до 2-й глистогонки`;
  else if (a.dewormStage === 1 && a.daysSinceDeworm1 >= 10) nextHint = 'Пора дать 2-ю таблетку от глистов (20 BYN)!';
  else if (a.species === 'dog' && !isDogConfined && (!a.tickProtectionDaysLeft || a.tickProtectionDaysLeft <= 0)) nextHint = 'Обработайте собаку каплями от клещей (35 BYN, вкладка 1), чтобы избежать пироплазмоза!';
  else if (isOrphanBaby && a.ageDays >= 40 && !state.pr.prActive) nextHint = 'Малыши без мамы: можно отдавать в семью до 60 дней (вакцинацию сделают хозяева)! Запустите ПИАР во вкладке 3.';
  else if (a.ageDays < 60 && a.ageDays >= 40 && !state.pr.prActive) nextHint = 'С 40–45 дней можно открыть ПИАР на раннее бронирование (вкладка 3)!';
  else if (a.ageDays >= 60 && !a.parasitesAndVaccinated) nextHint = 'Сделайте комплексную вакцинацию (60 BYN)';
  else if (a.ageCategory === 'adult' && !a.isSterilized) nextHint = 'Проведите обязательную стерилизацию/кастрацию';
  document.getElementById('checklistHintText').textContent = nextHint;

  // Диагностические теги
  const woodText = !a.examinedWood
    ? 'Просвет Вуда: ???'
    : (a.knownRingworm === true ? `Лишай: день ${a.ringwormDaysDone}/35` : 'Просвет Вуда: Чисто ✓');
  const woodClass = !a.examinedWood
    ? 'bg-[var(--bg-muted)] text-[var(--text-secondary)] border-[var(--border-subtle)]'
    : (a.knownRingworm === true ? 'bg-rose-100 text-rose-900 border-rose-400' : 'bg-emerald-50 text-emerald-800 border-emerald-300');

  let pcrText = 'ПЦР ВИК/ВЛК: ???';
  let pcrClass = 'bg-[var(--bg-muted)] text-[var(--text-secondary)] border-[var(--border-subtle)]';
  if (a.pcrTested || a.knownCarrier || a.knownVirus) {
    const parts = [];
    if (a.knownCarrier) parts.push(`${a.knownCarrier}+`);
    if (a.knownVirus) parts.push(`${a.knownVirus}`);
    pcrText = parts.length === 0 ? 'ПЦР: Чисто ✓' : `ПЦР: ${parts.join(', ')}`;
    pcrClass = parts.length === 0 ? 'bg-emerald-50 text-emerald-800 border-emerald-300' : 'bg-amber-100 text-amber-900 border-amber-400';
  }

  const cageText = !state.zooshans.hasCage
    ? 'Клетка: Нет'
    : (state.zooshans.cageReturnedClean ? 'Клетка: Сдана чистой ✓' : 'Клетка «Зоошанса»: На руках');
  const cageClass = state.zooshans.cageReturnedClean ? 'bg-emerald-50 text-emerald-800 border-emerald-300' : 'bg-[var(--bg-muted)] text-[var(--text-secondary)] border-[var(--border-subtle)]';

  let photoText = 'Фото: Нет фото';
  let photoClass = 'bg-[var(--bg-muted)] text-[var(--text-muted)] border-[var(--border-subtle)]';
  if (state.zooshans.hasProPhotos) {
    photoText = 'Фото: ПРОФИ «Зоошанс» (x2.6)';
    photoClass = 'bg-sky-100 text-sky-900 border-sky-400';
  } else if (state.photos && state.photos.hasFriendsPhotos) {
    photoText = 'Фото: От друзей (x1.5)';
    photoClass = 'bg-indigo-100 text-indigo-900 border-indigo-400';
  } else if (state.photos && state.photos.hasSelfPhotos) {
    photoText = 'Фото: С телефона (x1.2)';
    photoClass = 'bg-[var(--bg-muted)] text-[var(--text-primary)] border-[var(--border-subtle)]';
  }

  if (a.pcrPending) {
    pcrText = `ПЦР: В лаборатории (${a.pcrDaysRemaining} дн.)`;
    pcrClass = 'bg-amber-100 text-amber-900 border-amber-400 animate-pulse';
  } else if (a.pcrResultDoubtful) {
    pcrText = 'ПЦР: Сомнительный титр ⚠️';
    pcrClass = 'bg-amber-100 text-amber-900 border-amber-400';
  }

  const allStatusTags = [
    { t: woodText, c: woodClass },
    { t: pcrText, c: pcrClass },
    { t: cageText, c: cageClass },
    { t: photoText, c: photoClass }
  ];

  if (a.inStationaryDaysLeft && a.inStationaryDaysLeft > 0) {
    allStatusTags.unshift({ t: `🏥 Стационар ОРИТ: ${a.inStationaryDaysLeft} дн.`, c: 'bg-rose-100 text-rose-900 border-rose-400 font-bold animate-pulse' });
  } else if (a.virusRecoveryDaysLeft && a.virusRecoveryDaysLeft > 0) {
    allStatusTags.unshift({ t: `💊 Восстановление: ${14 - a.virusRecoveryDaysLeft}/14 дн.`, c: 'bg-amber-100 text-amber-900 border-amber-400 font-semibold' });
  } else if (a.traumaRehabDaysLeft && a.traumaRehabDaysLeft > 0) {
    allStatusTags.unshift({ t: `🦴 Сращение перелома: ${45 - a.traumaRehabDaysLeft}/45 дн.`, c: 'bg-blue-100 text-blue-900 border-blue-400 font-semibold' });
  }

  if (a.species === 'dog' && a.hasAntiEscapeHarness) {
    allStatusTags.push({ t: 'Шлейка-антипобег ✓', c: 'bg-emerald-50 text-emerald-800 border-emerald-300' });
  }
  if (a.fipTreatment) {
    allStatusTags.push({ t: `Терапия ФИП: ${a.fipDaysLeft} дн.`, c: 'bg-rose-100 text-rose-900 border-rose-400 animate-pulse' });
  }
  if (a.teethCrisis && !a.teethOperated) {
    allStatusTags.push({ t: 'Санация ротовой полости', c: 'bg-rose-100 text-rose-900 border-rose-400' });
  }
  if (a.hasMotherCat && a.motherLactating) {
    allStatusTags.push({ t: `Кормящая мама (${Math.max(0, 45 - a.ageDays)} дн.)`, c: 'bg-sky-100 text-sky-900 border-sky-400' });
  }

  document.getElementById('animalStatusTags').innerHTML = allStatusTags
    .map(item => `<span class="craft-badge text-[11px] ${item.c}">${item.t}</span>`).join('');

  let prLabel = 'Пиар на сайтах: Не запущен';
  if (a.inStationaryDaysLeft && a.inStationaryDaysLeft > 0) {
    prLabel = `🏥 В стационаре клиники (${a.inStationaryDaysLeft} дн. — пиар приостановлен)`;
  } else if (a.virusRecoveryDaysLeft && a.virusRecoveryDaysLeft > 0) {
    prLabel = `💊 Восстановление после вируса (${a.virusRecoveryDaysLeft} дн. — пиар отложен)`;
  } else if (a.traumaRehabDaysLeft && a.traumaRehabDaysLeft > 0) {
    prLabel = `🦴 Сращение перелома (${a.traumaRehabDaysLeft} дн. — пиар отложен)`;
  } else if (state.pr.lostSearchActive) prLabel = `🔎 Поиск старых хозяев: ${state.pr.lostSearchDaysDone}/10 дн.`;
  else if (state.pr.earlyBookedAdopterWaiting) prLabel = '📝 ЗАБРОНИРОВАН! Готов к переезду в семью по договору до вакцинации (вкладка 3)';
  else if (state.pr.prActive) prLabel = `📢 Пиар на сайтах (${state.pr.daysInPr} дн., обновление через ${Math.max(0, 6 - state.pr.daysSinceAdRefresh)} дн.)`;
  document.getElementById('prProgressText').textContent = prLabel;
}

function escapeHtml(str) {
  if (str === null || str === undefined) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function renderActionTabs() {
  const dash = document.getElementById('actionsDashboard');
  const isIntroActive = Boolean(state.onboarding && state.onboarding.day1ChoiceMade === false);

  if (isIntroActive) {
    if (dash) dash.classList.add('hidden');
  }

  const btnTabZoo = document.getElementById('tabBtn_zooshans');
  const btnTabCare = document.getElementById('tabBtn_care');
  const mBtnVet = document.getElementById('mobileTabBtn_vet');
  const mBtnZoo = document.getElementById('mobileTabBtn_zooshans');
  const mBtnCare = document.getElementById('mobileTabBtn_care');
  const mIconZoo = document.getElementById('mobileTabIcon_zooshans');
  const mIconCare = document.getElementById('mobileTabIcon_care');

  if (btnTabZoo) {
    btnTabZoo.textContent = '🤝 2. Помощь «Зоошанса» и Сборы';
    btnTabZoo.classList.remove('opacity-40');
  }
  if (btnTabCare) {
    btnTabCare.textContent = '📸 3. Быт и Пиар';
    btnTabCare.classList.remove('opacity-40');
  }
  if (isIntroActive) {
    if (mBtnVet) mBtnVet.classList.add('opacity-40', 'pointer-events-none');
    if (mBtnZoo) mBtnZoo.classList.add('opacity-40', 'pointer-events-none');
    if (mBtnCare) mBtnCare.classList.add('opacity-40', 'pointer-events-none');
  } else {
    if (mBtnVet) mBtnVet.classList.remove('opacity-40', 'pointer-events-none');
    if (mBtnZoo) {
      mBtnZoo.classList.remove('opacity-40', 'pointer-events-none');
      if (mIconZoo) mIconZoo.textContent = '🤝';
    }
    if (mBtnCare) {
      mBtnCare.classList.remove('opacity-40', 'pointer-events-none');
      if (mIconCare) mIconCare.textContent = '📸';
    }
  }

  const a = state.animal;
  const h = a.hiddenState;
  const g = getAnimalGrammar(a);
  const hasDiscount = Boolean(state.zooshans.applicationSubmitted);

  // ================= 1. ВКЛАДКА: ВЕТЕРИНАРИЯ =================
  const vetButtons = [];

  // 1.1. Первичный осмотр + лампа Вуда
  const baseCheckup = 50;
  const checkupCost = hasDiscount ? Math.round(baseCheckup * 0.8) : baseCheckup;
  vetButtons.push({
    icon: '🔦',
    title: 'Первичный осмотр и просвет Вуда',
    badge: a.examinedWood ? 'Сделано' : 'Клиника',
    sub: 'Осмотр ветеринара, диагностика микроспории (лишая) и беременности.',
    costBYN: a.examinedWood ? 0 : checkupCost,
    baseCostBYN: a.examinedWood ? null : (hasDiscount ? baseCheckup : null),
    costEnergy: a.examinedWood ? 0 : 12,
    isVoucherEligible: true,
    state: a.examinedWood ? 'completed' : 'active',
    statusText: a.examinedWood ? '✓ Осмотр и просвет проведены' : '',
    onClick: () => {
      if (!payVetBill(50, true, 'Первичный прием и просвет лампой Вуда', false, 12)) return;
      a.examinedWood = true;
      a.knownRingworm = h.ringworm === true;
      a.knownPregnant = h.isPregnant === true;
      if (a.knownRingworm) {
        a.ringwormDaysDone = 0;
        addLog(`День ${state.day}: 🔦 Лампа Вуда выявила микроспорию (лишай)! Стационаров для лишая нет — лечим 35 дней в клетке до двух чистых просветов.`, 'warn');
      } else if (a.knownPregnant) {
        addLog(`День ${state.day}: 🩺 Кошка глубоко беременна (родит на ${h.daysUntilBirth || 8}-й день)! Выбор: экстренная стерилизация по показаниям или роды.`, 'warn');
      } else {
        addLog(`День ${state.day}: 🔦 Просвет лампой Вуда чистый!`, 'success');
      }
      renderAll();
    }
  });

  // 1.2. Прием узкого специалиста (Терапевт / Инфекционист / Хирург)
  // Заблокирован условием (locked), пока нет показаний/назначений врача
  const hasDoctorReferral = Boolean(
    a.fipTreatment ||
    (a.teethCrisis && !a.teethOperated) ||
    (h.hasSevereTrauma && !a.traumaOperated) ||
    a.health < 75
  );
  const baseSpec = 70;
  const specCost = hasDiscount ? Math.round(baseSpec * 0.8) : baseSpec;
  vetButtons.push({
    icon: '🩺',
    title: 'Прием узкого специалиста',
    badge: 'Терапевт/Хирург',
    sub: 'Углубленная консультация профильного врача при осложнениях или травмах.',
    costBYN: specCost,
    baseCostBYN: hasDiscount ? baseSpec : null,
    costEnergy: 10,
    isVoucherEligible: true,
    state: hasDoctorReferral ? 'active' : 'locked',
    statusText: hasDoctorReferral ? '' : '🔒 Только по назначению (при ухудшении)',
    onClick: () => {
      if (!payVetBill(70, true, 'Консультация узкого специалиста', false, 10)) return;
      if (a.fipTreatment) {
        addLog(`День ${state.day}: 🩺 Инфекционист проверил биохимию крови и скорректировал дозировку GS-441524. Терапия ФИП идет по плану!`, 'success');
      } else if (a.teethCrisis && !a.teethOperated) {
        addLog(`День ${state.day}: 🩺 Хирург-стоматолог подтвердил необходимость санации ротовой полости.`, 'warn');
      } else {
        a.health = Math.min(100, a.health + 8);
        addLog(`День ${state.day}: 🩺 Врач провел углубленный осмотр, скорректировал терапию (+8% здоровья).`, 'success');
      }
      renderAll();
    }
  });

  // 1.3. Обработка от глистов (Этап 1/2 или 2/2)
  const pillCost1 = state.zooshans.hasGiftedDewormPill ? 0 : 26;
  const pillCost2 = state.zooshans.hasGiftedDewormPill ? 0 : 20;
  const isDogConfined = a.traumaOperated || (h && h.hasSevereTrauma) || a.id === 'severe_trauma_sheri_dog' || (a.inStationaryDaysLeft && a.inStationaryDaysLeft > 0);

  if (a.dewormStage === 0) {
    vetButtons.push({
      icon: '💊',
      title: '1-я обработка от паразитов',
      badge: isDogConfined ? 'После стац.' : 'Этап 1/2',
      sub: isDogConfined
        ? 'Уничтожает взрослых гельминтов и блох. При тяжелых травмах обработку можно провести после стационара и стабилизации.'
        : 'Уничтожает взрослых гельминтов и блох. Повтор строго через 10 дней!',
      costBYN: pillCost1,
      costEnergy: 5,
      isVoucherEligible: false,
      state: state.newborn.active ? 'locked' : 'active',
      statusText: state.newborn.active
        ? '🔒 Слепышам до 3 нед. запрещено'
        : (isDogConfined ? 'ℹ️ Можно после стационара' : ''),
      onClick: () => {
        if (!spendEnergy(5)) return;
        if (state.zooshans.hasGiftedDewormPill) {
          state.zooshans.hasGiftedDewormPill = false;
          addLog(`День ${state.day}: 💊 Использована подаренная волонтерами таблетка Мильбемакса (0 BYN)!`, 'success');
        } else {
          state.cash = +(state.cash - pillCost1).toFixed(1);
          state.personalMoneySpent = +(state.personalMoneySpent + pillCost1).toFixed(1);
        }
        a.dewormStage = 1;
        a.daysSinceDeworm1 = 0;
        addLog(`День ${state.day}: 💊 Дана 1-я таблетка от паразитов (-${pillCost1} BYN). Вторая таблетка строго через 10 дней!`, 'info');
        renderAll();
      }
    });
  } else if (a.dewormStage === 1) {
    const waitLeft = Math.max(0, 10 - a.daysSinceDeworm1);
    const volunteerNote = a.volunteerHandlesDeworming ? 'Передержка контролирует график: даст вторую таблетку сама.' : 'Обязательна перед вакцинацией! Защита действует 6 месяцев (180 дн.).';
    const volunteerStatus = a.volunteerHandlesDeworming ? (waitLeft > 0 ? `⏳ Волонтер даст через ${waitLeft} дн.` : 'Волонтер дает сегодня!') : (waitLeft > 0 ? `⏳ Повтор через ${waitLeft} дн.` : 'Пора дать сегодня!');
    vetButtons.push({
      icon: '💊',
      title: '2-я обработка от паразитов',
      badge: a.volunteerHandlesDeworming ? 'Передержка' : (waitLeft > 0 ? `${waitLeft} дн.` : 'Этап 2/2'),
      sub: volunteerNote,
      costBYN: waitLeft > 0 ? 0 : pillCost2,
      costEnergy: waitLeft > 0 ? 0 : 5,
      isVoucherEligible: false,
      state: waitLeft > 0 ? 'cooldown' : 'active',
      statusText: volunteerStatus,
      onClick: () => {
        if (!spendEnergy(5)) return;
        if (state.zooshans.hasGiftedDewormPill) {
          state.zooshans.hasGiftedDewormPill = false;
          addLog(`День ${state.day}: 💊 Использована подаренная волонтерами таблетка Мильбемакса (0 BYN)!`, 'success');
        } else {
          state.cash = +(state.cash - pillCost2).toFixed(1);
          state.personalMoneySpent = +(state.personalMoneySpent + pillCost2).toFixed(1);
        }
        a.dewormStage = 2;
        a.daysSinceDeworm2 = 0;
        addLog(`День ${state.day}: ✅ Проведена 2-я глистогонка! Обработка действует 6 месяцев (180 дней).`, 'success');
        renderAll();
      }
    });
  } else {
    const validLeft = Math.max(0, 180 - a.daysSinceDeworm2);
    vetButtons.push({
      icon: '💊',
      title: 'Обработка от паразитов',
      badge: '2/2 готово',
      sub: 'Двукратная дегельминтизация проведена успешно.',
      costBYN: 0,
      costEnergy: 0,
      isVoucherEligible: false,
      state: 'completed',
      statusText: `✓ Двукратно обработан (${validLeft} дн.)`,
      onClick: null
    });
  }

  // 1.4. Комплексная вакцинация с ветпаспортом
  let vacState = 'active';
  let vacStatusText = '';
  if (a.parasitesAndVaccinated) {
    vacState = 'completed';
    vacStatusText = '✓ Привит с ветпаспортом';
  } else if (a.ageDays < 60) {
    vacState = 'locked';
    vacStatusText = `🔒 С 60 дней (сейчас ${a.ageDays} дн.)`;
  } else if (a.dewormStage < 2) {
    vacState = 'locked';
    vacStatusText = '🔒 Требуется 2/2 глистогонка';
  }

  vetButtons.push({
    icon: '💉',
    title: 'Комплексная вакцинация',
    badge: a.parasitesAndVaccinated ? 'Привит' : (a.ageDays < 60 ? `${a.ageDays}/60 дн.` : 'Ветпаспорт'),
    sub: 'Защита от панлейкопении, калицивироза, ринотрахеита / парвовируса и чумы.',
    costBYN: vacState === 'completed' ? 0 : 60,
    costEnergy: vacState === 'completed' ? 0 : 10,
    isVoucherEligible: false,
    state: vacState,
    statusText: vacStatusText,
    onClick: () => {
      if (typeof actionVaccinate === 'function') {
        actionVaccinate();
      } else {
        if (!payVetBill(60, false, 'Комплексная вакцинация с ветпаспортом', false, 10)) return;
        a.parasitesAndVaccinated = true;
        a.daysSinceVaccine1 = 0;
        if (a.dewormStage < 2) {
          a.vaccineDewormLapse = true;
        }
        a.health = Math.min(100, a.health + 10);
        addLog(`День ${state.day}: 💉 Проведена вакцинация по возрасту, оформлен официальный ветпаспорт!`, 'success');
        if (state.pr && state.pr.earlyBookedAdopterWaiting) {
          triggerEarlyBookedTransferModal();
        }
        if (typeof checkMentorTriggers === 'function') {
          checkMentorTriggers();
        }
        renderAll();
      }
    }
  });

  // 1.5. ПЦР-профиль инфекций
  let pcrState = 'active';
  let pcrStatusText = '';
  if (a.pcrPending) {
    pcrState = 'cooldown';
    pcrStatusText = `⏳ В лаборатории (${a.pcrDaysRemaining} дн.)`;
  } else if (a.pcrTested && !a.pcrResultDoubtful) {
    pcrState = 'completed';
    pcrStatusText = '✓ ПЦР-профиль исследован';
  } else if (!a.pcrTested && (a.ageCategory === 'kitten' || a.ageCategory === 'puppy') && !a.knownVirus && !h.deadlyVirus && !h.hasChronicGI && a.health >= 80) {
    pcrState = 'locked';
    pcrStatusText = '🔒 Без симптомов не показан';
  }
  const basePcr = 105;
  const isPcrFinished = pcrState === 'completed' || pcrState === 'cooldown';
  const pcrCost = isPcrFinished ? 0 : (hasDiscount ? Math.round(basePcr * 0.8) : basePcr);

  vetButtons.push({
    icon: '🧬',
    title: a.pcrPending ? 'ПЦР в лаборатории' : (a.pcrTested && a.pcrResultDoubtful ? 'Повторный ПЦР-профиль' : 'ПЦР-профиль инфекций'),
    badge: a.pcrPending ? `${a.pcrDaysRemaining} дн.` : (a.pcrTested ? 'Сдан' : 'Лаборатория'),
    sub: a.pcrPending
      ? 'Биоматериал исследуется в лаборатории. Результат через 7 дней.'
      : 'Диагностика скрытых инфекций (ВИК, ВЛК, панлейкопения, коронавирус).',
    costBYN: pcrCost,
    baseCostBYN: isPcrFinished ? null : (hasDiscount ? basePcr : null),
    costEnergy: isPcrFinished ? 0 : 10,
    isVoucherEligible: true,
    state: pcrState,
    statusText: pcrStatusText,
    onClick: () => {
      if (!payVetBill(105, true, 'ПЦР-профиль инфекций', false, 10)) return;
      a.pcrPending = true;
      a.pcrDaysRemaining = 7;
      a.pcrResultDoubtful = false;
      addLog(`День ${state.day}: 🧬 Биоматериал отправлен в лабораторию на ПЦР-диагностику. Результат будет готов через 7 дней.`, 'info');
      renderAll();
    }
  });

  // 1.5b. Для подопечных с вирусным лейкозом кошек (FeLV+): Подтверждающий тест и Консультация инфекциониста
  if (a.knownCarrier === 'FeLV') {
    // Подтверждающий тест (провирусная ДНК FeLV / ИФА p27)
    const baseFelvTest = 75;
    const isFelvTestDone = a.felvConfirmed;
    const felvTestCost = isFelvTestDone ? 0 : (hasDiscount ? Math.round(baseFelvTest * 0.8) : baseFelvTest);

    vetButtons.push({
      icon: '🧪',
      title: isFelvTestDone ? 'FeLV-провирус подтвержден' : 'Подтверждающий тест FeLV',
      badge: isFelvTestDone ? 'Сдано' : 'ИФА / ДНК',
      sub: isFelvTestDone
        ? 'Форма лейкоза верифицирована лабораторией (количественный титр провируса).'
        : 'Уточняющий тест на ДНК провируса FeLV для дифференциации латентной и прогрессивной формы.',
      costBYN: felvTestCost,
      baseCostBYN: isFelvTestDone ? null : (hasDiscount ? baseFelvTest : null),
      costEnergy: isFelvTestDone ? 0 : 8,
      isVoucherEligible: true,
      state: isFelvTestDone ? 'completed' : 'active',
      statusText: isFelvTestDone ? '✓ Форма подтверждена' : '',
      onClick: () => {
        if (!payVetBill(baseFelvTest, true, 'Подтверждающий тест FeLV (провирусная ДНК)', false, 8)) return;
        a.felvConfirmed = true;
        addLog(`День ${state.day}: 🧪 Сдан подтверждающий тест на провирус FeLV. Диагноз верифицирован лабораторией!`, 'info');
        renderAll();
      }
    });

    // Консультация инфекциониста и противовирусная терапия (Ралтегравир)
    const baseInfectCost = 90;
    const isAntiviralDone = a.felvAntiviralActive;
    const infectCost = isAntiviralDone ? 0 : (hasDiscount ? Math.round(baseInfectCost * 0.8) : baseInfectCost);

    vetButtons.push({
      icon: '🩺',
      title: isAntiviralDone ? 'Противовирусная терапия начата' : 'Консультация инфекциониста',
      badge: isAntiviralDone ? 'Схема дана' : 'Специалист',
      sub: isAntiviralDone
        ? 'Курс ингибиторов интегразы (Ралтегравир) защищает костный мозг и предотвращает криз.'
        : 'Прием вет-инфекциониста, расшифровка титров FeLV и назначение противовирусной схемы (Ралтегравир).',
      costBYN: infectCost,
      baseCostBYN: isAntiviralDone ? null : (hasDiscount ? baseInfectCost : null),
      costEnergy: isAntiviralDone ? 0 : 12,
      isVoucherEligible: true,
      state: isAntiviralDone ? 'completed' : 'active',
      statusText: isAntiviralDone ? '✓ Терапия назначена' : '',
      onClick: () => {
        if (!payVetBill(baseInfectCost, true, 'Консультация инфекциониста и схема терапии FeLV (Ралтегравир)', false, 12)) return;
        a.felvInfectiousConsultDone = true;
        a.felvAntiviralActive = true;
        a.felvAntiviralDaysLeft = 30;
        a.health = Math.min(100, a.health + 10);
        addLog(`День ${state.day}: 💊 Вет-инфекционист провел консультацию и назначил противовирусную терапию (Ралтегравир). Организм защищен от гемолитического криза!`, 'success');
        renderAll();
      }
    });
  }

  // 1.6. Стерилизация / Кастрация
  const baseSpayCost = g.isDog ? 300 : (h.isPregnant ? 225 : 160);
  const spayCost = hasDiscount ? Math.round(baseSpayCost * 0.8) : baseSpayCost;

  let spayState = 'active';
  let spayStatusText = '';
  if (a.isSterilized) {
    spayState = 'completed';
    spayStatusText = '✓ Стерилизован(а)';
  } else if (a.hasMotherCat && a.motherLactating) {
    spayState = 'locked';
    spayStatusText = `🔒 Кормящая мама (${a.ageDays}/45 дн.)`;
  } else if (!h.isPregnant && a.quarantineDaysDone < 14) {
    spayState = 'locked';
    spayStatusText = `🔒 После карантина (${a.quarantineDaysDone}/14 дн.)`;
  } else if (!a.hasMotherCat && a.ageCategory !== 'adult') {
    spayState = 'not-needed';
    spayStatusText = '✓ Отдается под договор по возрасту';
  } else if (h.isLostOrPurebred && state.pr.lostSearchDaysDone < 10) {
    spayState = 'locked';
    spayStatusText = `🔒 Поиск хозяев (${state.pr.lostSearchDaysDone}/10 дн.)`;
  }

  vetButtons.push({
    icon: '✂️',
    title: h.isPregnant ? 'Экстренная стерилизация' : `Стерилизация (${g.shortNom})`,
    badge: h.isPregnant ? 'Срочно' : (a.isSterilized ? 'Сделано' : (g.isDog ? 'Собака' : 'Кошка')),
    sub: h.isPregnant ? 'Экстренное прерывание беременности по медицинским показаниям.' : 'Обязательная процедура перед пристройством взрослого подопечного.',
    costBYN: spayState === 'completed' ? 0 : spayCost,
    baseCostBYN: spayState === 'completed' ? null : (hasDiscount ? baseSpayCost : null),
    costEnergy: spayState === 'completed' ? 0 : 20,
    isVoucherEligible: true,
    state: spayState,
    statusText: spayStatusText,
    onClick: () => {
      if (!payVetBill(baseSpayCost, true, `Хирургическая стерилизация (${g.shortNom})`, false, 20)) return;
      a.isSterilized = true;
      a.motherSterilized = true;
      h.isPregnant = false;
      addLog(`День ${state.day}: ✂️ Стерилизация проведена успешно! (На плановую стерилизацию р/с «Зоошанса» не открывается — гасим своими средствами или сбором на карту).`, 'success');
      if (a.hasMotherCat && a.savedCount >= (a.totalCount || a.initialCount || 1)) {
        triggerEndGame(
          true,
          'ПОБЕДА: Все подопечные обрели любящий дом!',
          'Мама-кошка успешно стерилизована, а все котята благополучно пристроены в заботливые семьи!'
        );
        return;
      }
      renderAll();
    }
  });

  // 1.7. Остеосинтез / Реанимация
  const isLifeThreatening = (h.hasSevereTrauma && !a.traumaOperated) || h.deadlyVirus === 'panleukopenia' || h.deadlyVirus === 'parvovirus_enteritis' || a.health < 55;
  let icuState = 'active';
  let icuStatusText = '';
  if (a.knownRingworm === true) {
    icuState = 'locked';
    icuStatusText = '🔒 Стационаров для лишая нет';
  } else if (a.traumaOperated) {
    icuState = 'completed';
    icuStatusText = '✓ Операция проведена';
  } else if (!isLifeThreatening) {
    icuState = 'not-needed';
    icuStatusText = 'Не требуется (травм нет)';
  }

  const baseIcu = 450;
  const icuCost = !state.zooshans.expensiveApproved && isLifeThreatening
    ? 0
    : (hasDiscount ? Math.round(baseIcu * 0.8) : baseIcu);
  const icuEnergy = !state.zooshans.expensiveApproved && isLifeThreatening ? 10 : 25;
  const isIcuFinished = icuState === 'completed' || icuState === 'not-needed';

  vetButtons.push({
    icon: '🏥',
    title: a.traumaOperated
      ? 'Операция проведена'
      : (!state.zooshans.expensiveApproved && isLifeThreatening
          ? 'Согласование операции'
          : 'Остеосинтез и реанимация'),
    badge: a.traumaOperated ? 'Сделано' : (!isLifeThreatening ? 'Не требуется' : 'Стационар'),
    sub: a.traumaOperated
      ? 'Экстренная хирургия успешно проведена, кости сопоставлены.'
      : (!isLifeThreatening
          ? 'Скелетных травм и переломов нет. Экстренная операция не требуется.'
          : (!state.zooshans.expensiveApproved
              ? 'Согласование гарантийного талона с Колл-центром фонда.'
              : 'Экстренная хирургия переломов и суточный мониторинг в реанимации.')),
    costBYN: isIcuFinished ? 0 : icuCost,
    baseCostBYN: (isIcuFinished || !state.zooshans.expensiveApproved) ? null : (hasDiscount ? baseIcu : null),
    costEnergy: isIcuFinished ? 0 : icuEnergy,
    isVoucherEligible: true,
    state: icuState,
    statusText: icuStatusText,
    onClick: () => {
      if (!state.zooshans.expensiveApproved) {
        if (!spendEnergy(10)) return;
        state.zooshans.applicationSubmitted = true;
        state.zooshans.expensiveApproved = true;
        state.zooshans.clinicMode = 'major_voucher';
        addLog(`День ${state.day}: ☎️ Координатор Колл-центра согласовал проведение дорогостоящей операции и стационара по гарантийному талону!`, 'success');
        renderAll();
        return;
      }
      if (!payVetBill(450, true, 'Экстренная хирургия (остеосинтез/челюсть) и реанимационный стационар', true, 25)) return;
      a.traumaOperated = true;
      h.hasSevereTrauma = false;
      h.deadlyVirus = null;
      a.health = 75;
      a.inStationaryDaysLeft = 3;
      a.stationaryReason = 'trauma';
      a.traumaRehabDaysLeft = 45;
      a.visibleState = h.isJawFracture
        ? 'Челюсть зашинирована! В стационаре ОРИТ (3 дня), впереди 18 дней кормления через шприц.'
        : 'Остеосинтез успешно проведен! В стационаре (3 дня), впереди 1.5 мес. (45 дн.) сращения перелома.';
      addLog(`День ${state.day}: 🏥 Проведена тяжелая операция и реанимация! Животное под наблюдением в стационаре. Пристройство отложено на 1.5 месяца до сращения костей. Открыт доступ к официальному сбору на р/с «Зоошанса».`, 'success');
      renderAll();
    }
  });

  // 1.8. Курс терапии лишая
  let ringState = 'not-needed';
  let ringStatusText = '✓ Показаний нет (лампа чистая)';
  if (a.knownRingworm === 'Пролечен (2 чистых просвета)') {
    ringState = 'completed';
    ringStatusText = '✓ Лишай излечен (2 просвета)';
  } else if (a.knownRingworm === true) {
    ringState = 'active';
    ringStatusText = '';
  }

  vetButtons.push({
    icon: '🍄',
    title: 'Курс терапии лишая',
    badge: a.knownRingworm === true ? `${a.ringwormDaysDone}/35 дн.` : (ringState === 'completed' ? '2 просвета' : '35 дней'),
    sub: a.knownRingworm === true
      ? `Идет курс лечения в изолированной клетке (${a.ringwormDaysDone}/35 дн., быт -12⚡/д).`
      : 'Назначается врачом строго при свечении лампы Вуда.',
    costBYN: 0,
    costEnergy: 0,
    isVoucherEligible: false,
    state: ringState,
    statusText: ringStatusText,
    onClick: () => {
      addLog(`День ${state.day}: 🍄 Терапия лишая проводится ежедневно дома в изолированной клетке (-12⚡/день). Необходим карантин 35 дней до 2 чистых просветов Вуда!`, 'info');
      renderAll();
    }
  });

  // 1.9. Обработка собаки от клещей
  if (a.species === 'dog') {
    const isDogConfined = a.traumaOperated || (h && h.hasSevereTrauma) || a.id === 'severe_trauma_sheri_dog' || (a.inStationaryDaysLeft && a.inStationaryDaysLeft > 0);
    const tickProtected = a.tickProtectionDaysLeft > 5;
    vetButtons.push({
      icon: '🐕',
      title: 'Капли от иксодовых клещей',
      badge: a.tickProtectionDaysLeft > 0 ? `${a.tickProtectionDaysLeft}/30 дн.` : (isDogConfined ? 'После стац.' : '30 дней'),
      sub: isDogConfined
        ? 'Собака после тяжелой травмы/операции находится в стационаре или на покое. Прогулок нет — обработку каплями можно провести после стационара перед выходом на улицу.'
        : 'Защита собаки от смертельного пироплазмоза в парках и на выгуле.',
      costBYN: 35,
      costEnergy: 5,
      state: tickProtected ? 'not-needed' : 'active',
      statusText: tickProtected ? `✓ Защищен (${a.tickProtectionDaysLeft} дн.)` : (isDogConfined ? 'ℹ️ Не к спеху: прогулок нет' : ''),
      onClick: actionBuyTickProtection
    });
  }

  // 1.10. Терапия ЖКТ и диета Gastrointestinal (для хроников ЖКТ / кейс Селесты)
  if (h.hasChronicGI || !a.giProtocolCompleted) {
    const isGiDone = a.giProtocolCompleted;
    let giState = 'active';
    let giStatusText = '';
    if (isGiDone) {
      giState = 'completed';
      giStatusText = '✓ В ремиссии (пролечен)';
    } else if (!a.pcrTested) {
      giState = 'locked';
      giStatusText = '🔒 Сначала сдайте ПЦР-профиль';
    }

    vetButtons.push({
      icon: '🥣',
      title: isGiDone ? 'Терапия ЖКТ завершена' : 'Курс Ронидазола и гастро-диета',
      badge: isGiDone ? 'Ремиссия' : 'ЖКТ-диарея',
      sub: isGiDone
        ? 'Хронический трихомоноз купирован Ронидазолом и спецдиетой. Ежедневный дебафф снят.'
        : 'Курс препарата Ронидазол и лечебный корм Gastrointestinal (120 BYN) для элиминации простейших и нормализации стула.',
      costBYN: isGiDone ? 0 : 120,
      costEnergy: isGiDone ? 0 : 10,
      isVoucherEligible: false,
      state: giState,
      statusText: giStatusText,
      onClick: () => {
        if (!a.pcrTested) {
          addLog(`День ${state.day}: 🔒 Сначала необходимо сдать ПЦР-профиль инфекций, чтобы верифицировать возбудителя диареи!`, 'warn');
          return;
        }
        if (state.cash < 120) {
          addLog(`День ${state.day}: ❌ Не хватает средств (120 BYN) на покупку препарата Ронидазол и лечебного корма Gastrointestinal!`, 'danger');
          return;
        }
        if (!spendEnergy(10)) return;
        state.cash = +(state.cash - 120).toFixed(1);
        state.personalMoneySpent = +(state.personalMoneySpent + 120).toFixed(1);
        a.giProtocolCompleted = true;
        a.litterTrained = true;
        a.knownVirus = 'Трихомоноз пролечен';
        a.health = Math.min(100, a.health + 12);
        h.hasChronicGI = false;
        a.visibleState = 'Курс Ронидазола завершен! Стул оформлен, лоток освоен на 100%, дебафф снят.';
        addLog(`День ${state.day}: 🥣 Курс Ронидазола и гастро-диеты успешно пройден! Простейшие элиминированы, стул оформился, кошка аккуратно ходит в лоток. Хронический дебафф ЖКТ (-12⚡/день) снят!`, 'success');
        renderAll();
      }
    });
  }

  // 1.11. Стоматологическая санация (больные зубы / санация ротовой полости)
  if (a.teethCrisis || a.teethOperated || (a.species === 'cat' && a.ageDays >= 1400)) {
    const isTeethDone = a.teethOperated;
    const baseTeethCost = 115;
    const teethCost = isTeethDone ? 0 : (hasDiscount ? Math.round(baseTeethCost * 0.8) : baseTeethCost);
    vetButtons.push({
      icon: '🦷',
      title: isTeethDone ? 'Санация зубов проведена' : 'Стоматологическая санация',
      badge: isTeethDone ? 'Здоровы' : 'Хирургия',
      sub: isTeethDone
        ? 'Удалены пораженные зубы и зубной камень. Воспаление десен купировано.'
        : 'Удаление разрушенных зубов и санация ротовой полости (115 BYN).',
      costBYN: teethCost,
      baseCostBYN: isTeethDone ? null : (hasDiscount ? baseTeethCost : null),
      costEnergy: isTeethDone ? 0 : 12,
      isVoucherEligible: true,
      state: isTeethDone ? 'completed' : 'active',
      statusText: isTeethDone ? '✓ Зубы санированы' : '',
      onClick: () => {
        if (!payVetBill(115, true, 'Стоматологическая санация и удаление разрушенных зубов', false, 12)) return;
        a.teethOperated = true;
        a.teethCrisis = false;
        a.health = Math.min(100, a.health + 15);
        addLog(`День ${state.day}: 🦷 Проведена санация ротовой полости и удаление нежизнеспособных зубов. Воспаление десен снято, аппетит в норме!`, 'success');
        renderAll();
      }
    });
  }

  // ================= 2. ВКЛАДКА: ЗООШАНС И СБОРЫ =================
  const zooButtons = [];
  const canOpenOfficialRsFundraiser = state.zooshans.voucherDebt >= 330 || state.zooshans.expensiveApproved;

  // 2.1. Подать заявление в Колл-центр «Зоошанса»
  zooButtons.push({
    icon: '☎️',
    title: 'Заявление в Колл-центр',
    badge: state.zooshans.applicationSubmitted ? 'Принято' : 'Скидка 20%',
    sub: 'Регистрация подопечного, скидка 20% в клиниках и клетка со склада.',
    costBYN: 0,
    costEnergy: state.zooshans.applicationSubmitted ? 0 : 10,
    state: state.zooshans.applicationSubmitted ? 'completed' : 'active',
    statusText: state.zooshans.applicationSubmitted ? '✓ Заявление принято фондом' : '',
    onClick: actionAskZooshansTakeover
  });

  // 2.2. Опубликовать SOS-пост: поиск бесплатной передержки
  const atHome = isAnimalAtPlayerHome();
  zooButtons.push({
    icon: '📢',
    title: 'SOS-пост: Поиск передержки',
    badge: !atHome ? 'На передержке' : 'Соцсети',
    sub: 'Поиск добровольца в соцсетях для бесплатной передержки (шанс ~30%).',
    costBYN: 0,
    costEnergy: !atHome ? 0 : 15,
    state: !atHome ? 'completed' : 'active',
    statusText: !atHome ? '✓ Подопечный на передержке' : '',
    onClick: actionSearchSocialFosterPost
  });

  // 2.3. Волонтерская барахолка @zooshans_chat
  zooButtons.push({
    icon: '💬',
    title: 'Волонтерская барахолка',
    badge: '@zooshans_chat',
    sub: 'Запрос в чате помощи: волонтеры бесплатно поделятся лекарствами или амуницией.',
    costBYN: 0,
    costEnergy: 10,
    state: 'active',
    statusText: '',
    onClick: actionBarakholkaVolunteerChat
  });

  // 2.4. Сбор на р/с «Зоошанса»
  let rsState = 'active';
  let rsStatusText = '';
  if (state.zooshans.officialFundraiserActive) {
    rsState = 'completed';
    rsStatusText = '✓ Официальный сбор открыт';
  } else if (!canOpenOfficialRsFundraiser) {
    rsState = 'locked';
    rsStatusText = '🔒 Только при операциях / долге >330 BYN';
  }

  zooButtons.push({
    icon: '🏦',
    title: 'Сбор на р/с «Зоошанса»',
    badge: state.zooshans.officialFundraiserActive ? 'Р/С открыт' : 'Официальный',
    sub: 'Официальный сбор фонда при тяжелых операциях, травмах или долге от 330 BYN.',
    costBYN: 0,
    costEnergy: state.zooshans.officialFundraiserActive ? 0 : 15,
    state: rsState,
    statusText: rsStatusText,
    onClick: () => {
      if (!spendEnergy(15)) return;
      state.zooshans.officialFundraiserActive = true;
      addLog(`День ${state.day}: 🏦 Колл-центр открыл официальный сбор на р/с «Зоошанса» для погашения долга за операцию/стационар!`, 'success');
      renderAll();
    }
  });

  // 2.5. Сбор на личную банковскую карту
  let cardState = 'active';
  let cardStatusText = '';
  if (state.zooshans.personalDonationsBanned) {
    cardState = 'locked';
    cardStatusText = '🔒 Заблокирован за просрочку';
  } else if (state.zooshans.personalFundraiserActive) {
    cardState = 'completed';
    cardStatusText = '✓ Сбор на карту активен';
  } else if (state.zooshans.personalCardCollectedBYN >= 6500) {
    cardState = 'locked';
    cardStatusText = '🔒 Лимит 6500 BYN исчерпан';
  }

  zooButtons.push({
    icon: '💳',
    title: 'Сбор на личную карту',
    badge: state.zooshans.personalFundraiserActive ? 'Активен' : 'До 6500 BYN',
    sub: 'Сбор средств на питание, смеси, анализы и приемы в соцсетях.',
    costBYN: 0,
    costEnergy: state.zooshans.personalFundraiserActive ? 0 : 15,
    state: cardState,
    statusText: cardStatusText,
    onClick: () => {
      if (!spendEnergy(15)) return;
      state.zooshans.personalFundraiserActive = true;
      addLog(`День ${state.day}: 💳 Открыт сбор на личную карту (в пределах лимита 6500 BYN/год). Обязательно выкладывайте чеки каждые 7 дней!`, 'success');
      renderAll();
    }
  });

  // 2.6. Мимими-пост со сторителлингом
  const storytellingDoneToday = (state.pr.lastStorytellingDay === state.day);
  zooButtons.push({
    icon: '✍️',
    title: 'Пост со сторителлингом',
    badge: storytellingDoneToday ? '1 раз/день' : '+0.06x пиар',
    sub: 'Искренняя история о спасенном хвостике: привлекает подписчиков и помощь.',
    costBYN: 0,
    costEnergy: storytellingDoneToday ? 0 : 10,
    state: storytellingDoneToday ? 'cooldown' : 'active',
    statusText: storytellingDoneToday ? '⏳ Повтор через 1 дн.' : '',
    onClick: actionWriteStorytellingPost
  });

  // 2.7. 7-дневный финотчет сборов
  const finReportActive = state.zooshans.personalFundraiserActive;
  const finReportDays = Math.max(0, 7 - (state.zooshans.daysSinceLastFinReport || 0));
  let finState = 'active';
  let finStatus = '';
  if (!finReportActive) {
    finState = 'not-needed';
    finStatus = '✓ Нет сбора на карту';
  } else if (state.zooshans.daysSinceLastFinReport === 0) {
    finState = 'cooldown';
    finStatus = '⏳ Повтор через 7 дн.';
  } else {
    finState = 'active';
    finStatus = finReportDays <= 2 ? `⚠️ Срочно (${finReportDays} дн.)` : `Осталось ${finReportDays} дн.`;
  }

  zooButtons.push({
    icon: '🧾',
    title: '7-дневный финотчет сборов',
    badge: finReportActive ? (finState === 'cooldown' ? 'Опубликован' : `${finReportDays}/7 дн.`) : 'Чеки',
    sub: 'Публикация чеков и выписок в соцсетях для защиты сбора от блокировки.',
    costBYN: 0,
    costEnergy: finState === 'active' ? 20 : 0,
    state: finState,
    statusText: finStatus,
    onClick: () => {
      if (!spendEnergy(20)) return;
      state.zooshans.daysSinceLastFinReport = 0;
      state.mental = Math.min(100, state.mental + 5);
      addLog(`День ${state.day}: 📊 Опубликован честный финотчет с чеками во всех группах (+5% Менталки)! Сбор в безопасности.`, 'success');
      renderAll();
    }
  });

  // 2.8. Погасить долг по талону своими деньгами
  const hasDebt = state.zooshans.voucherDebt > 0;
  zooButtons.push({
    icon: '💰',
    title: 'Погасить долг по талону',
    badge: hasDebt ? `${state.zooshans.voucherDebt} BYN` : '0 BYN',
    sub: hasDebt
      ? 'Погашение накопленного долга перед клиникой личными средствами.'
      : 'Задолженностей по гарантийным талонам фонда нет.',
    costBYN: hasDebt ? state.zooshans.voucherDebt : 0,
    costEnergy: 0,
    state: !hasDebt ? 'completed' : 'active',
    statusText: !hasDebt ? '✓ Долгов по талонам нет' : '',
    onClick: payVoucherDebtWithOwnMoney
  });

  // ================= 3. ВКЛАДКА: БЫТ И ПИАР =================
  const careButtons = [];
  const supplyPackCost = (g.isDog || a.count > 1) ? 120 : 65;
  const supplyItemName = g.isDog
    ? (a.ageCategory === 'puppy' ? 'корм и пеленки' : 'корм, пеленки и пакеты для выгула')
    : 'корм и древесный/комкующийся наполнитель';
  const canReturnCage = state.zooshans.hasCage && !state.zooshans.cageReturnedClean && (a.quarantineDaysDone >= 14 && a.knownRingworm !== true);

  // Допуск к пиару (раннее бронирование котят/щенков с 40 дней, малышей без мамы можно отдавать до 60 дн.)
  const isMedicallyRestricted = (a.inStationaryDaysLeft && a.inStationaryDaysLeft > 0) ||
                               (a.virusRecoveryDaysLeft && a.virusRecoveryDaysLeft > 0) ||
                               (a.traumaRehabDaysLeft && a.traumaRehabDaysLeft > 0);
  const isOrphanBaby = !a.hasMotherCat && (a.ageCategory === 'kitten' || a.ageCategory === 'puppy');
  const isOrphanBabyEligible = isOrphanBaby && a.ageDays >= 40 && a.dewormStage >= 1;
  const isKittenEarlyBookEligible = (a.ageCategory === 'kitten' || a.ageCategory === 'puppy') && a.ageDays >= 40 && a.dewormStage >= 1;
  const isAdultReadyForPr = a.parasitesAndVaccinated && (a.ageCategory !== 'adult' || a.isSterilized);
  const canStartPr = !isMedicallyRestricted && a.examinedWood && a.knownRingworm !== true && !state.newborn.active && (!h.hasSevereTrauma || a.traumaOperated) && !h.needsSocialization && (!h.isLostOrPurebred || state.pr.lostSearchDaysDone >= 10) && (isAdultReadyForPr || isKittenEarlyBookEligible || isOrphanBabyEligible);

  const nActiveNow = a.activeCount !== undefined ? a.activeCount : (a.count || 0);

  // 3.0. Передать по ранней брони до вакцинации по договору
  if (state.pr.earlyBookedAdopterWaiting && nActiveNow > 0) {
    let earlyState = 'active';
    let earlyStatus = 'Семья ждет!';
    if (isMedicallyRestricted) {
      earlyState = 'locked';
      earlyStatus = a.inStationaryDaysLeft > 0
        ? '🔒 В стационаре'
        : (a.virusRecoveryDaysLeft > 0 ? '🔒 Долечивание вируса' : '🔒 Реабилитация перелома');
    }
    careButtons.push({
      icon: '🎉',
      title: 'Передать по ранней брони',
      badge: 'Договор',
      sub: isMedicallyRestricted
        ? 'Передача отложена до полного выздоровления и окончания реабилитации!'
        : 'Передать забронированного малыша семье по договору куратора до вакцинации.',
      costBYN: 0,
      costEnergy: isMedicallyRestricted ? 0 : 5,
      state: earlyState,
      statusText: earlyStatus,
      onClick: isMedicallyRestricted ? () => {} : triggerEarlyBookedTransferModal
    });
  }

  // 3.1. Проверить подопечного на испытательном сроке (если есть)
  if (state.trialAnimals && state.trialAnimals.length > 0) {
    const activeTrial = state.trialAnimals[0];
    const isPair = (activeTrial.count || 1) > 1;
    careButtons.push({
      icon: '📱',
      title: isPair ? 'Проверить малышей у ручек' : 'Проверить хвостика у ручек',
      badge: `${activeTrial.daysPassed}/${activeTrial.trialDaysTotal || 14} дн.`,
      sub: isPair
        ? `Узнать, как освоились «${activeTrial.petName}» (+5% Менталки).`
        : `Узнать, как освоился(лась) «${activeTrial.petName}» (+5% Менталки).`,
      costBYN: 0,
      costEnergy: 5,
      state: 'active',
      statusText: '',
      onClick: actionCheckTrialPetStatus
    });
  }

  // 3.2. Закупка запаса расходников на 14 дней
  careButtons.push({
    icon: '🛒',
    title: g.isDog ? 'Запас корма и пеленок' : 'Запас корма и наполнителя',
    badge: '14 дн.',
    sub: 'Обеспечение подопечного питанием и гигиеной дома или на передержке.',
    costBYN: supplyPackCost,
    costEnergy: 10,
    state: 'active',
    statusText: '',
    onClick: () => {
      if (state.cash < supplyPackCost) {
        addLog(`День ${state.day}: Не хватает денег на пакет расходников (${supplyPackCost} BYN)!`, 'danger');
        return;
      }
      if (!spendEnergy(10)) return;
      state.cash = +(state.cash - supplyPackCost).toFixed(1);
      state.personalMoneySpent = +(state.personalMoneySpent + supplyPackCost).toFixed(1);
      state.supplies.daysLeft += 14;
      addLog(`День ${state.day}: 🛒 Вы закупили в зоомагазине ${supplyItemName} на 14 дней (-${supplyPackCost} BYN).`, 'success');
      renderAll();
    }
  });

  // 3.2b. Спецпитание и смесь для котят (Royal Canin Babycat Milk / Mousse)
  const isKittenGrowing = (a.species === 'cat' && a.ageCategory !== 'adult' && a.ageDays < 60);
  if (isKittenGrowing) {
    careButtons.push({
      icon: '🍼',
      title: 'Смесь Babycat Milk для котят',
      badge: '+7 дн.',
      sub: 'Банка спецсмеси Royal Canin Babycat Milk / паштет для выкорма и роста котят до 2 месяцев.',
      costBYN: 105,
      costEnergy: 5,
      state: 'active',
      statusText: `Запас: ${state.newborn.milkDaysLeft || 0} дн.`,
      onClick: buyBabycatFormula
    });
  }

  // 3.2c. Анатомическая шлейка-антипобег для собак (GDD 7.3, config: 60 BYN)
  if (a.species === 'dog') {
    careButtons.push({
      icon: '🦮',
      title: 'Шлейка-антипобег с адресником',
      badge: a.hasAntiEscapeHarness ? 'Надета' : 'Защита',
      sub: 'Анатомическая трехремневая шлейка исключает срыв собаки от испуга на прогулке.',
      costBYN: a.hasAntiEscapeHarness ? 0 : 60,
      costEnergy: a.hasAntiEscapeHarness ? 0 : 5,
      state: a.hasAntiEscapeHarness ? 'completed' : 'active',
      statusText: a.hasAntiEscapeHarness ? '✓ Надета на собаку' : '',
      onClick: () => {
        if (a.hasAntiEscapeHarness) return;
        if (state.cash < 60) {
          addLog(`День ${state.day}: ❌ Не хватает средств (60 BYN) на покупку анатомической шлейки-антипобег!`, 'danger');
          return;
        }
        if (!spendEnergy(5)) return;
        state.cash = +(state.cash - 60).toFixed(1);
        state.personalMoneySpent = +(state.personalMoneySpent + 60).toFixed(1);
        a.hasAntiEscapeHarness = true;
        addLog(`День ${state.day}: 🦮 Куплена и подогнана анатомическая трехремневая шлейка-антипобег с адресником (-60 BYN, -5⚡). Теперь срыв на прогулке от испуга невозможен!`, 'success');
        renderAll();
      }
    });
  }

  // 3.3. Выручка кормом от своего домашнего кота в безденежье (только если подопечный — кот)
  const hasOwnCat = state.player.ownPets && (state.player.ownPets.id === 'vaccinated_cat' || state.player.ownPets.id === 'unvaccinated_cat');
  if (hasOwnCat && state.animal.species === 'cat') {
    const daysSinceShare = state.day - (state.lastOwnPetFoodShareDay || -999);
    const canShare = (state.supplies.daysLeft <= 2 || state.cash < 65) && (daysSinceShare >= 14);
    let catState = 'active';
    let catStatusText = '';
    if (daysSinceShare < 14) {
      catState = 'cooldown';
      catStatusText = `⏳ Повтор через ${14 - daysSinceShare} дн.`;
    } else if (!canShare) {
      catState = 'not-needed';
      catStatusText = '✓ Корма пока хватает';
    }

    careButtons.push({
      icon: '🥣',
      title: 'Занять корм у своего кота',
      badge: daysSinceShare < 14 ? `${14 - daysSinceShare} дн.` : '4 дня',
      sub: 'Экстренная мера в безденежье раз в 14 дней (-2% менталки).',
      costBYN: 0,
      costEnergy: 0,
      state: catState,
      statusText: catStatusText,
      onClick: actionShareFoodWithOwnCat
    });
  }

  // 3.4. Любительская фотосессия (прогрессивный слот: съемка на телефон -> помощь друзей)
  const homePhotosDone = state.zooshans.hasProPhotos || (state.photos.hasSelfPhotos && state.photos.hasFriendsPhotos);
  if (!state.photos.hasSelfPhotos && !state.photos.hasFriendsPhotos && !state.zooshans.hasProPhotos) {
    careButtons.push({
      icon: '📸',
      title: 'Съемка на телефон',
      badge: 'Этап 1/2',
      sub: 'Базовые фото при хорошем свете для старта пиара (отклик x1.2).',
      costBYN: 0,
      costEnergy: 5,
      state: 'active',
      statusText: '',
      onClick: actionTakeSelfPhotos
    });
  } else if (state.photos.hasSelfPhotos && !state.photos.hasFriendsPhotos && !state.zooshans.hasProPhotos) {
    careButtons.push({
      icon: '📸',
      title: 'Фотосессия с друзьями',
      badge: 'Этап 2/2',
      sub: 'Портретный объектив и красивый фон от друзей (отклик x1.5).',
      costBYN: 0,
      costEnergy: 8,
      state: 'active',
      statusText: '',
      onClick: actionAskFriendsPhotos
    });
  } else {
    careButtons.push({
      icon: '📸',
      title: 'Любительские фото',
      badge: 'x1.5',
      sub: 'Качественные фото для объявлений уже подготовлены.',
      costBYN: 0,
      costEnergy: 0,
      state: 'completed',
      statusText: '✓ Домашние фото готовы',
      onClick: null
    });
  }

  // 3.5. Профессиональная фотосессия «Зоошанса»
  let proState = 'active';
  let proStatusText = '';
  if (state.zooshans.hasProPhotos) {
    proState = 'completed';
    proStatusText = '✓ Профи-фото готовы (x2.6)';
  } else if (a.quarantineDaysDone < 14) {
    proState = 'locked';
    proStatusText = `🔒 После карантина (${a.quarantineDaysDone}/14)`;
  } else if (a.health < 70 || h.needsSocialization || a.knownRingworm === true) {
    proState = 'locked';
    proStatusText = '🔒 Требуется стабилизация';
  }

  careButtons.push({
    icon: '🌟',
    title: 'Профи-фото «Зоошанса»',
    badge: 'x2.6',
    sub: 'Бесплатная съемка волонтером фонда после 14 дней карантина.',
    costBYN: 0,
    costEnergy: state.zooshans.hasProPhotos ? 0 : 15,
    state: proState,
    statusText: proStatusText,
    onClick: () => {
      if (!spendEnergy(15)) return;
      state.zooshans.hasProPhotos = true;
      addLog(`День ${state.day}: 📸 Волонтер-фотограф «Зоошанса» провела потрясающую съемку! Отклик на сайтах вырастет в 2.6 раза!`, 'success');
      renderAll();
    }
  });

  // 3.6. Приучение к лотку/пеленкам/выгулу / Сдать клетку Вирконом
  const isPuppy = a.species === 'dog' && (a.ageCategory === 'puppy' || a.ageDays < 180);
  let litterState = 'active';
  let litterStatusText = '';
  if (a.litterTrained) {
    if (state.zooshans.cageReturnedClean) {
      litterState = 'completed';
      litterStatusText = '✓ Клетка сдана на склад';
    } else if (!canReturnCage) {
      litterState = 'locked';
      litterStatusText = '🔒 Возврат после карантина';
    } else {
      litterState = 'active';
    }
  }

  const toiletIcon = !a.litterTrained ? (isPuppy ? '🧻' : '🚽') : '🧼';
  const toiletTitle = !a.litterTrained
    ? (isPuppy ? 'Приучение к пеленкам' : (g.isDog ? 'Приучение к выгулу' : 'Приучение к лотку'))
    : 'Сдать клетку на склад';
  const toiletBadge = !a.litterTrained
    ? (isPuppy ? 'Пеленки' : (g.isDog ? 'Режим' : 'Чистота'))
    : 'Виркон';
  const toiletSub = !a.litterTrained
    ? (isPuppy
        ? 'Впитывающие одноразовые пеленки и энзимный спрей против луж на полу.'
        : (g.isDog ? 'Режим выгула и энзимный спрей.' : 'Специальный наполнитель и энзимный спрей против промахов.'))
    : 'Дезинфекция Вирконом и возврат чистой клетки фонду (+8%🧠).';

  careButtons.push({
    icon: toiletIcon,
    title: toiletTitle,
    badge: toiletBadge,
    sub: toiletSub,
    costBYN: litterState === 'completed' ? 0 : (!a.litterTrained ? 26 : 16),
    costEnergy: litterState === 'completed' ? 0 : 15,
    state: litterState,
    statusText: litterStatusText,
    onClick: () => {
      const cost = !a.litterTrained ? 26 : 16;
      if (state.cash < cost) {
        addLog(`День ${state.day}: ❌ Не хватает средств (${state.cash} BYN из требуемых ${cost} BYN) на покупку необходимых средств!`, 'danger');
        return;
      }
      if (!spendEnergy(15)) return;
      state.cash = +(state.cash - cost).toFixed(1);
      state.personalMoneySpent = +(state.personalMoneySpent + cost).toFixed(1);
      if (!a.litterTrained) {
        a.litterTrained = true;
        const toiletSuccessMsg = isPuppy
          ? `Вы застелили пол впитывающими пеленками и применили энзимный спрей — ${g.nom} теперь ходят строго на пеленку!`
          : (g.isDog
              ? `Вы наладили режим выгула — ${g.nom} теперь терпит до улицы!`
              : `Вы подобрали правильный наполнитель и энзимный спрей — ${g.nom} теперь ходит в лоток без промахов!`);
        addLog(`День ${state.day}: ${isPuppy ? '🧻' : '🚽'} ${toiletSuccessMsg}`, 'success');
      } else {
        state.zooshans.cageReturnedClean = true;
        state.mental = Math.min(100, state.mental + 8);
        addLog(`День ${state.day}: 🧼 Вы купили дезсредство Виркон (-16 BYN), тщательно отмыли и вернули клетку на склад «Зоошанса»! (+8% Менталки).`, 'success');
      }
      renderAll();
    }
  });

  // 3.7. Оставить питомца себе
  let keepState = 'active';
  let keepStatusText = '';
  if (state.keptForSelfUsed) {
    keepState = 'completed';
    keepStatusText = '✓ Использовано в партии';
  } else if (!canStartPr) {
    keepState = 'locked';
    keepStatusText = '🔒 Выполните базовый чек-лист';
  }

  careButtons.push({
    icon: '❤️',
    title: 'Оставить питомца себе',
    badge: state.keptForSelfUsed ? 'Дома' : '1 раз',
    sub: 'Усыновление в свою семью или близким после всех процедур.',
    costBYN: 0,
    costEnergy: 0,
    state: keepState,
    statusText: keepStatusText,
    onClick: actionKeepPetForSelf
  });

  // 3.8. Системный ПИАР / Поднять в топ
  let prState = 'active';
  let prStatusText = '';
  if (a.inStationaryDaysLeft && a.inStationaryDaysLeft > 0) {
    prState = 'locked';
    prStatusText = '🔒 В стационаре ветклиники';
  } else if (a.virusRecoveryDaysLeft && a.virusRecoveryDaysLeft > 0) {
    prState = 'locked';
    prStatusText = `🔒 Долечивание (${a.virusRecoveryDaysLeft} дн.)`;
  } else if (a.traumaRehabDaysLeft && a.traumaRehabDaysLeft > 0) {
    prState = 'locked';
    prStatusText = `🔒 Сращение перелома (${a.traumaRehabDaysLeft} дн.)`;
  } else if (h.isLostOrPurebred && state.pr.lostSearchDaysDone < 10) {
    prState = 'locked';
    prStatusText = `🔒 Поиск хозяев (${state.pr.lostSearchDaysDone}/10 дн.)`;
  } else if (!state.pr.prActive && !canStartPr) {
    prState = 'locked';
    prStatusText = '🔒 Выполните чек-лист подготовки';
  } else if (state.pr.prActive && state.pr.daysSinceAdRefresh < 6) {
    const refreshWait = 6 - state.pr.daysSinceAdRefresh;
    prState = 'cooldown';
    prStatusText = `⏳ Поднятие через ${refreshWait} дн.`;
  }

  const prTitle = !state.pr.prActive
    ? (isOrphanBaby ? 'ПИАР: малыши без мамы' : (a.ageDays < 60 ? 'Раннее бронирование' : 'Системный ПИАР'))
    : 'Поднять объявления в топ';
  const prBadge = !state.pr.prActive
    ? (isOrphanBaby ? 'Отдача до 60 дн.' : (a.ageDays < 60 ? '40+ дн.' : 'Куфар / Сайт'))
    : `${state.pr.daysSinceAdRefresh}/6 дн.`;
  const prSub = !state.pr.prActive
    ? (isOrphanBaby
        ? 'Малышей без мамы можно отдавать в семью до 60 дней по договору (прививки сделают хозяева).'
        : (a.ageDays < 60 ? 'Размещение анкеты на раннюю бронь до вакцинации.' : 'Размещение анкеты на Куфаре, zooshans.by и в группах.'))
    : 'Обновление анкет для восстановления максимального потока звонков.';

  careButtons.push({
    icon: !state.pr.prActive ? '🚀' : '🔄',
    title: prTitle,
    badge: prBadge,
    sub: prSub,
    costBYN: 0,
    costEnergy: prState === 'cooldown' ? 0 : (!state.pr.prActive ? 12 : 10),
    state: prState,
    statusText: prStatusText,
    onClick: () => {
      if (h.isLostOrPurebred && state.pr.lostSearchDaysDone < 10 && !state.pr.lostSearchActive) {
        if (!spendEnergy(10)) return;
        state.pr.lostSearchActive = true;
        addLog(`День ${state.day}: 🔎 Запущен 10-дневный поиск старых хозяев по группам потеряшек.`, 'info');
        renderAll();
        return;
      }
      if (!state.pr.prActive) {
        if (!spendEnergy(12)) return;
        state.pr.prActive = true;
        state.pr.daysSinceAdRefresh = 0;
        addLog(`День ${state.day}: 🚀 Объявления опубликованы на Куфаре, zooshans.by и в соцсетях! Не забывайте поднимать их каждые 6 дней.`, 'success');
      } else {
        if (!spendEnergy(10)) return;
        state.pr.daysSinceAdRefresh = 0;
        addLog(`День ${state.day}: 🔄 Вы обновили и подняли объявления на всех сайтах! Поток звонков восстановлен.`, 'success');
      }
      renderAll();
    }
  });

  // 3.9. Подготовка в ЕС (Чип + Бешенство / Титры)
  let euState = 'active';
  let euStatusText = '';
  let euTitle = 'Подготовка в ЕС: Чип + Бешенство';
  let euBadge = 'Шаг 1';
  let euSub = 'Чипирование и старт 30-дневного карантина антител к бешенству.';
  let euCost = 80;
  let euEnergy = 12;

  if (a.ageDays < 60 || a.dewormStage < 2) {
    euState = 'locked';
    euStatusText = '🔒 С 60 дней и 2/2 глистогонки';
    euCost = 80;
    euEnergy = 12;
  } else if (!state.abroad.rabiesVaccineAndChipDone) {
    euState = 'active';
    euCost = 80;
    euEnergy = 12;
  } else if (state.abroad.daysSinceRabiesVaccine < 30) {
    const rabiesWait = 30 - state.abroad.daysSinceRabiesVaccine;
    euTitle = 'Титры антител к бешенству';
    euBadge = `${state.abroad.daysSinceRabiesVaccine}/30 дн.`;
    euSub = 'Лабораторный анализ крови и старт 90 дней карантина ЕС.';
    euCost = 0;
    euEnergy = 0;
    euState = 'cooldown';
    euStatusText = `⏳ Ждем 30 дн. (${rabiesWait} дн.)`;
  } else if (!state.abroad.titerBloodTaken) {
    euTitle = 'Титры антител к бешенству';
    euBadge = 'Шаг 2';
    euSub = 'Лабораторный анализ крови и старт 90 дней карантина ЕС.';
    euCost = 630;
    euEnergy = 15;
    euState = 'active';
  } else {
    euTitle = 'Карантин ЕС активен';
    euBadge = 'Карантин ЕС';
    euSub = 'Идет 90-дневный карантин до вылета в Европу.';
    euCost = 0;
    euEnergy = 0;
    euState = 'completed';
    euStatusText = `✓ Карантин ЕС (${state.abroad.daysInEuQuarantine}/90 дн.)`;
  }

  careButtons.push({
    icon: '🌍',
    title: euTitle,
    badge: euBadge,
    sub: euSub,
    costBYN: euCost,
    costEnergy: euEnergy,
    isVoucherEligible: false,
    state: euState,
    statusText: euStatusText,
    onClick: () => {
      if (!state.abroad.rabiesVaccineAndChipDone) {
        if (!payVetBill(80, false, 'Чипирование + вакцина от бешенства для ЕС', false, 12)) return;
        state.abroad.rabiesVaccineAndChipDone = true;
        state.abroad.daysSinceRabiesVaccine = 0;
        a.parasitesAndVaccinated = true;
        a.daysSinceVaccine1 = 0;
        if (a.dewormStage < 2) {
          a.vaccineDewormLapse = true;
        }
        if (typeof checkMentorTriggers === 'function') {
          checkMentorTriggers();
        }
        addLog(`День ${state.day}: 🌍 Поставлен микрочип и вакцина от бешенства (-80 BYN)! Ждем 30 дней выработки антител.`, 'success');
      } else {
        if (state.cash < 630) {
          addLog(`День ${state.day}: На титры антител нужно 630 BYN (оплачивает куратор). Откройте целевой сбор соседней кнопкой!`, 'warn');
          return;
        }
        if (!spendEnergy(15)) return;
        state.cash = +(state.cash - 630).toFixed(1);
        state.personalMoneySpent = +(state.personalMoneySpent + 630).toFixed(1);
        state.abroad.titerBloodTaken = true;
        state.abroad.daysInEuQuarantine = 0;
        addLog(`День ${state.day}: 🧪 Оплачены лабораторные титры антител к бешенству (-630 BYN)! Начался честный 90-дневный карантин ЕС.`, 'success');
      }
      renderAll();
    }
  });

  if (state.abroad.rabiesVaccineAndChipDone && !state.abroad.titerBloodTaken) {
    careButtons.push({
      icon: '🌍',
      title: 'Сбор на титры в Европу',
      badge: '630 BYN',
      sub: 'Целевой сбор на оплату анализов в лаборатории ЕС.',
      costBYN: 0,
      costEnergy: 15,
      state: state.abroad.titerFundraiserActive ? 'completed' : 'active',
      statusText: state.abroad.titerFundraiserActive ? '✓ Сбор на титры открыт' : '',
      onClick: () => {
        if (!spendEnergy(15)) return;
        state.abroad.titerFundraiserActive = true;
        addLog(`День ${state.day}: 🌍 Открыт целевой сбор на титры бешенства (630 BYN)!`, 'info');
        renderAll();
      }
    });
  }

  renderButtonGrid('tabContent_vet', vetButtons);
  renderButtonGrid('tabContent_zooshans', zooButtons);
  renderButtonGrid('tabContent_care', careButtons);
}

function finalizeActionButton(b) {
  // Если кнопка уже завершена, в кулдауне, не требуется или заблокирована условием/сюжетом:
  if (b.state === 'completed' || b.state === 'cooldown' || b.state === 'not-needed' || b.state === 'locked') {
    return;
  }

  const costBYN = b.costBYN || 0;
  const costEnergy = b.costEnergy || 0;

  let availableMoney = state.cash;
  let isVoucherPay = false;

  if (b.isVoucherEligible && state.zooshans.clinicMode === 'major_voucher' && !state.zooshans.voucherBlocked) {
    isVoucherPay = true;
    availableMoney = Math.max(0, +(1000 - state.zooshans.voucherDebt).toFixed(1));
  }
  b.isVoucherPay = isVoucherPay;

  const missingMoney = costBYN > availableMoney;
  const missingEnergy = costEnergy > state.energy;

  if (missingMoney || missingEnergy) {
    b.state = 'insufficient';
    b.missingMoney = missingMoney;
    b.missingEnergy = missingEnergy;

    if (missingMoney && missingEnergy) {
      if (isVoucherPay) {
        b.statusText = 'Лимит талона и мало энергии';
      } else {
        const shortBYN = Math.ceil(costBYN - availableMoney);
        b.statusText = `Не хватает ${shortBYN} BYN и ⚡`;
      }
    } else if (missingMoney) {
      if (isVoucherPay) {
        b.statusText = 'Лимит талона исчерпан';
      } else {
        const shortBYN = Math.ceil(costBYN - availableMoney);
        b.statusText = `Не хватает ${shortBYN} BYN`;
      }
    } else if (missingEnergy) {
      b.statusText = 'Мало энергии';
    }
  } else {
    b.state = 'active';
  }
}

function renderButtonGrid(containerId, buttons) {
  const container = document.getElementById(containerId);
  if (!container) return;
  container.innerHTML = '';

  buttons.forEach(b => {
    finalizeActionButton(b);

    const btn = document.createElement('button');
    const st = b.state || 'active';
    let stateClass = 'action-active';
    if (st === 'locked') stateClass = 'action-locked';
    else if (st === 'not-needed') stateClass = 'action-not-needed';
    else if (st === 'insufficient') stateClass = 'action-insufficient action-card--insufficient';
    else if (st === 'completed') stateClass = 'action-completed action-card--completed';
    else if (st === 'cooldown') stateClass = 'action-cooldown action-card--cooldown';

    btn.className = `action-card ${stateClass}`;

    // Полный тултип для подсказки (название, описание, статус)
    const tooltipParts = [b.title, b.sub];
    if (b.statusText) tooltipParts.push(`[${b.statusText}]`);
    const fullTooltip = tooltipParts.filter(Boolean).join(' — ');
    btn.setAttribute('title', fullTooltip);

    if (state.gameOver) {
      btn.disabled = true;
      btn.onclick = null;
      btn.classList.add('cursor-not-allowed', 'opacity-60');
      btn.title = `Партия окончена — ${fullTooltip}`;
    } else if (st !== 'active') {
      btn.disabled = true;
      btn.title = fullTooltip;
    } else {
      btn.onclick = b.onClick;
    }

    // Бейдж стоимости BYN / статус выполнения
    let bynBadge = '';
    if (st === 'completed') {
      bynBadge = `<span class="badge-status-completed">✅ Выполнено</span>`;
    } else if (st === 'cooldown') {
      bynBadge = `<span class="badge-status-cooldown">${escapeHtml(b.statusText || '⏳ Ожидание')}</span>`;
    } else if (b.costBYN !== undefined && b.costBYN !== null) {
      const isFree = b.costBYN === 0;
      const isGain = b.isGain === true;
      const sign = isFree ? '' : (isGain ? '+' : '-');
      
      let priceText = '';
      if (b.baseCostBYN && b.baseCostBYN > b.costBYN) {
        priceText = `<s>${b.baseCostBYN}</s> ${b.costBYN} BYN`;
      } else {
        priceText = `${sign}${b.costBYN} BYN`;
      }

      let badgeCls = 'badge-resource-byn';
      if (b.missingMoney) {
        badgeCls = 'badge-resource-insufficient';
      } else if (b.isVoucherPay) {
        badgeCls = 'badge-resource-voucher';
      } else if (isFree) {
        badgeCls = 'badge-resource-muted';
      } else if (st !== 'active' && st !== 'insufficient') {
        badgeCls = 'badge-resource-muted';
      }

      const prefix = b.isVoucherPay ? '🎫 ' : '';
      const suffix = b.isVoucherPay ? ' (в талон)' : '';
      bynBadge = `<span class="badge-resource ${badgeCls}">${prefix}${priceText}${suffix}</span>`;
    }

    // Бейдж стоимости Энергии
    let energyBadge = '';
    if (st !== 'completed' && st !== 'cooldown' && b.costEnergy !== undefined && b.costEnergy !== null) {
      if (b.costEnergy > 0) {
        let badgeCls = 'badge-resource-energy';
        if (b.missingEnergy) {
          badgeCls = 'badge-resource-insufficient';
        } else if (st !== 'active' && st !== 'insufficient') {
          badgeCls = 'badge-resource-muted';
        }
        energyBadge = `<span class="badge-resource ${badgeCls}">-${b.costEnergy} ⚡</span>`;
      } else if (b.costEnergy === 0 && b.showZeroEnergy) {
        energyBadge = `<span class="badge-resource badge-resource-muted">0 ⚡</span>`;
      }
    }

    // Бейдж статуса в правой части футера
    let statusBadge = '';
    if (state.gameOver) {
      if (st === 'completed') {
        statusBadge = '';
      } else {
        statusBadge = `<span class="badge-status-locked font-mono text-[9.5px]">🔒 Просмотр</span>`;
      }
    } else if (st === 'completed') {
      // Подвал слева уже содержит бейдж «✅ Выполнено» (bynBadge)
      statusBadge = '';
    } else if (st === 'cooldown') {
      statusBadge = '';
    } else if (st === 'insufficient' && b.statusText) {
      statusBadge = `<span class="badge-status-insufficient" title="${escapeHtml(b.statusText)}">${escapeHtml(b.statusText)}</span>`;
    } else if (st === 'locked' && b.statusText) {
      statusBadge = `<span class="badge-status-locked" title="${escapeHtml(b.statusText)}">${escapeHtml(b.statusText)}</span>`;
    } else if (st === 'not-needed' && b.statusText) {
      statusBadge = `<span class="badge-status-done" title="${escapeHtml(b.statusText)}">${escapeHtml(b.statusText)}</span>`;
    }

    btn.innerHTML = `
      <div class="action-card__header">
        <div class="flex items-start gap-1.5 min-w-0">
          <span class="text-xs shrink-0 leading-tight mt-0.5">${b.icon || '📌'}</span>
          <span class="action-card__title">${escapeHtml(b.title)}</span>
        </div>
        ${b.badge ? `<span class="badge-stage-pill shrink-0">${escapeHtml(b.badge)}</span>` : ''}
      </div>

      <div class="action-card__body" title="${escapeHtml(b.sub || '')}">
        ${escapeHtml(b.sub || '')}
      </div>

      <div class="action-card__footer">
        <div class="action-card__cost-group">
          ${bynBadge}
          ${energyBadge}
        </div>
        ${statusBadge ? `<div class="action-card__status-group">${statusBadge}</div>` : ''}
      </div>
    `;

    container.appendChild(btn);
  });
}

function renderLog() {
  const box = document.getElementById('chronicleLog');
  if (!box) return;
  document.getElementById('logCountInfo').textContent = `Записей: ${state.logs.length}`;
  const colorMap = {
    info: 'text-[var(--text-secondary)] border-l-2 border-sky-500 pl-2',
    success: 'text-emerald-800 border-l-2 border-emerald-500 pl-2 font-medium',
    warn: 'text-amber-800 border-l-2 border-amber-500 pl-2',
    danger: 'text-rose-800 border-l-2 border-rose-500 pl-2 font-bold'
  };
  box.innerHTML = state.logs.map(item =>
    `<div class="py-1 ${colorMap[item.type] || colorMap.info}">${item.text}</div>`
  ).join('');
}

function renderDeadlines() {
  const container = document.getElementById('deadlinesRadarList');
  if (!container) return;

  const a = state.animal;
  const nActive = a.activeCount !== undefined ? a.activeCount : (a.count || 0);
  const isOrphanBaby = !a.hasMotherCat && (a.ageCategory === 'kitten' || a.ageCategory === 'puppy');
  const items = [];

  // 0. Запас корма (при остатке <= 3 дн. и когда подопечный на руках)
  const totalFood = (state.supplies.daysLeft || 0) + (state.zooshans.giftedFoodDaysLeft || 0);
  if (nActive > 0 && totalFood <= 3) {
    items.push({
      icon: '🛒',
      title: 'Запас корма',
      days: totalFood,
      sub: totalFood === 0 ? 'Миска пуста!' : `Осталось на ${totalFood} дн.`,
      urgent: totalFood <= 3 && totalFood > 1,
      danger: totalFood <= 1
    });
  }

  // 1. Долг по талону Зоошанса (30 дней)
  if (state.zooshans.voucherDebt > 0) {
    const left = state.zooshans.voucherDaysLeft;
    items.push({
      icon: '🎫',
      title: 'Срок талона «Зоошанса»',
      days: left,
      sub: `${state.zooshans.voucherDebt} / 1000 BYN`,
      urgent: left <= 3,
      danger: left <= 1
    });
  }

  // 2. 7-дневный финотчет сборов на карту
  if (state.zooshans.personalFundraiserActive || state.zooshans.personalCardCollectedBYN > 0) {
    const daysSince = state.zooshans.daysSinceLastFinReport || 0;
    const left = Math.max(0, 7 - daysSince);
    items.push({
      icon: '🧾',
      title: 'Финотчет по сбору',
      days: left,
      sub: `Собрано: ${state.zooshans.personalCardCollectedBYN} BYN`,
      urgent: left <= 2,
      danger: left === 0
    });
  }

  // 3. Ранняя бронь усыновителями (готовы забрать до вакцинации)
  if (state.pr.earlyBookedAdopterWaiting && nActive > 0) {
    items.push({
      icon: '🎉',
      title: 'Ранняя бронь ждет',
      days: 'Готов',
      sub: 'Можно отдать до вакцинации!',
      urgent: true,
      danger: false
    });
  }

  // 4. 2-я таблетка глистогонки (через 10 дней, когда животное на руках)
  if (nActive > 0 && a.dewormStage === 1) {
    const left = Math.max(0, 10 - a.daysSinceDeworm1);
    items.push({
      icon: '💊',
      title: '2-я таблетка глистогонки',
      days: left,
      sub: left === 0 ? 'Пора дать сегодня!' : 'Строго через 10 дней',
      urgent: left <= 1,
      danger: left === 0
    });
  }

  // 5. Вакцинация с 60 дней возраста (только когда животное на руках)
  if (nActive > 0 && a.ageDays < 60 && a.dewormStage >= 2 && !a.parasitesAndVaccinated) {
    const left = Math.max(0, 60 - a.ageDays);
    items.push({
      icon: '💉',
      title: 'Прививка по возрасту',
      days: left,
      sub: isOrphanBaby ? 'Или отдача до 60 дн. по договору' : 'Ждем 60 дней возраста',
      urgent: left <= 3,
      danger: false
    });
  }

  // 6. Испытательный срок «ручек» (14 дней)
  if (state.trialAnimals && state.trialAnimals.length > 0) {
    state.trialAnimals.forEach(t => {
      const totalTrialDays = t.trialDaysTotal || 14;
      const trialDaysLeft = Math.max(0, totalTrialDays - (t.daysPassed || 0));
      items.push({
        icon: '🏡',
        title: `Испытание: ${t.petName || 'Питомец'}`,
        days: trialDaysLeft,
        sub: `Контроль ${totalTrialDays} дней`,
        urgent: trialDaysLeft <= 2,
        danger: trialDaysLeft <= 1
      });
    });
  }

  // 6. Переговоры «Время для маневра» (3 дня)
  if (state.maneuver && state.maneuver.active) {
    items.push({
      icon: '⏳',
      title: 'Маневр у ручек (3 дня)',
      days: state.maneuver.daysRemaining,
      sub: 'Срочно найти передержку!',
      urgent: true,
      danger: state.maneuver.daysRemaining <= 1
    });
  }

  // 7. ПЦР в лаборатории (7 дней)
  if (a.pcrPending) {
    items.push({
      icon: '🔬',
      title: 'ПЦР-профиль (лаборатория)',
      days: a.pcrDaysRemaining,
      sub: 'ВИК, ВЛК, панлейкопения',
      urgent: a.pcrDaysRemaining <= 1,
      danger: false
    });
  }

  // 8. Лишай в клетке (35 дней)
  if (a.knownRingworm === true) {
    const left = Math.max(0, 35 - a.ringwormDaysDone);
    items.push({
      icon: '🍄',
      title: 'Курс лечения лишая',
      days: left,
      sub: '2 чистых просветов Вуда',
      urgent: left <= 5,
      danger: false
    });
  }

  // 9. Терапия ФИП GS-441524 (84 дня)
  if (a.fipTreatment) {
    items.push({
      icon: '🧬',
      title: 'Терапия ФИП (GS-441524)',
      days: a.fipDaysLeft,
      sub: 'Ежедневные уколы',
      urgent: a.fipDaysLeft <= 5,
      danger: false
    });
  }

  // 9.1. Стационар, долечивание вируса и сращение перелома
  if (a.inStationaryDaysLeft && a.inStationaryDaysLeft > 0) {
    items.push({
      icon: '🏥',
      title: 'Стационар клиники',
      days: a.inStationaryDaysLeft,
      sub: a.stationaryReason === 'virus' ? 'ОРИТ инфузоматы' : 'После операции',
      urgent: true,
      danger: true
    });
  }
  if (a.virusRecoveryDaysLeft && a.virusRecoveryDaysLeft > 0) {
    items.push({
      icon: '💊',
      title: 'Долечивание вируса',
      days: a.virusRecoveryDaysLeft,
      sub: 'Карантин и диета',
      urgent: false,
      danger: false
    });
  }
  if (a.traumaRehabDaysLeft && a.traumaRehabDaysLeft > 0) {
    items.push({
      icon: '🦴',
      title: 'Сращение перелома',
      days: a.traumaRehabDaysLeft,
      sub: 'Покой до консолидации',
      urgent: false,
      danger: false
    });
  }

  // 10. Поиск беглеца (4 дня)
  if (state.escapeQuest && state.escapeQuest.active) {
    items.push({
      icon: '🚨',
      title: 'Поиск беглеца',
      days: state.escapeQuest.daysRemaining,
      sub: `Шкала: ${state.escapeQuest.searchProgress}%`,
      urgent: true,
      danger: state.escapeQuest.daysRemaining <= 1
    });
  }

  // 11. Защита собаки от клещей (30 дней, только когда собака на руках)
  if (nActive > 0 && a.species === 'dog') {
    const isDogConfined = a.traumaOperated || (a.hiddenState && a.hiddenState.hasSevereTrauma) || a.id === 'severe_trauma_sheri_dog' || (a.inStationaryDaysLeft && a.inStationaryDaysLeft > 0);
    if (a.tickProtectionDaysLeft > 0) {
      items.push({
        icon: '🛡️',
        title: 'Капли от клещей',
        days: a.tickProtectionDaysLeft,
        sub: 'Против пироплазмоза',
        urgent: a.tickProtectionDaysLeft <= 5,
        danger: a.tickProtectionDaysLeft <= 2
      });
    } else if (isDogConfined) {
      items.push({
        icon: '🏥',
        title: 'Капли от клещей',
        days: 'После стац.',
        sub: 'На покое (без прогулок)',
        urgent: false,
        danger: false
      });
    } else {
      items.push({
        icon: '⚠️',
        title: 'Защита от клещей истекла!',
        days: 0,
        sub: 'Срочно нанесите капли!',
        urgent: true,
        danger: true
      });
    }
  }

  // 12. Зарплата игрока (каждые 30 дней)
  const salaryDays = 30 - (state.day % 30);
  const freeSalary = state.player.income.monthlyFreeCash || state.player.income.monthlySalary || 400;
  items.push({
    icon: '💵',
    title: 'Зарплата куратора',
    days: salaryDays === 30 ? 0 : salaryDays,
    sub: `+${freeSalary} BYN`,
    urgent: salaryDays <= 2,
    danger: false
  });

  // Sort by days ascending
  items.sort((x, y) => {
    const xVal = typeof x.days === 'number' ? x.days : 999;
    const yVal = typeof y.days === 'number' ? y.days : 999;
    return xVal - yVal;
  });

  if (items.length === 0) {
    container.innerHTML = `
      <div class="text-[11px] font-mono text-[var(--text-muted)] text-center py-2">
        Дедлайнов нет — штиль ⛵
      </div>
    `;
    return;
  }

  container.innerHTML = items.map(item => {
    let badgeClass = 'bg-[var(--bg-card)] text-[var(--text-primary)] border-[var(--border-subtle)]';
    if (item.danger) {
      badgeClass = 'bg-rose-600 text-white font-bold border-rose-500 animate-pulse';
    } else if (item.urgent) {
      badgeClass = 'bg-amber-100 text-amber-900 border-amber-300 font-bold';
    }

    const daysText = typeof item.days === 'string'
      ? item.days
      : (item.days === 0 ? 'СЕГОДНЯ!' : `${item.days} дн.`);

    return `
      <div class="flex items-center justify-between p-2 rounded-lg bg-[var(--bg-muted)] border border-[var(--border-subtle)] text-xs font-mono transition hover:border-[var(--season-accent)]">
        <div class="flex items-center gap-2 min-w-0">
          <span class="text-sm shrink-0">${item.icon}</span>
          <div class="min-w-0">
            <div class="font-bold text-[var(--text-primary)] truncate" title="${escapeHtml(item.title || '')}">${item.title}</div>
            <div class="text-[10px] text-[var(--text-secondary)] truncate" title="${escapeHtml(item.sub || '')}">${item.sub}</div>
          </div>
        </div>
        <span class="shrink-0 text-[11px] px-2 py-0.5 rounded border ${badgeClass}">
          ${daysText}
        </span>
      </div>
    `;
  }).join('');
}

function toggleDrawer(side) {
  const left = document.getElementById('drawerLeft');
  const right = document.getElementById('drawerRight');
  const backdrop = document.getElementById('drawerBackdrop');

  if (side === 'left') {
    if (left.classList.contains('open')) {
      left.classList.remove('open');
      backdrop.classList.remove('active');
    } else {
      left.classList.add('open');
      right.classList.remove('open');
      backdrop.classList.add('active');
    }
  } else if (side === 'right') {
    if (right.classList.contains('open')) {
      right.classList.remove('open');
      backdrop.classList.remove('active');
    } else {
      right.classList.add('open');
      left.classList.remove('open');
      backdrop.classList.add('active');
    }
  }
}

function closeDrawers() {
  const left = document.getElementById('drawerLeft');
  const right = document.getElementById('drawerRight');
  const backdrop = document.getElementById('drawerBackdrop');
  if (left) left.classList.remove('open');
  if (right) right.classList.remove('open');
  if (backdrop) backdrop.classList.remove('active');
}

function showEventModal(title, bodyText, choices) {
  stopTimer();
  const overlay = document.getElementById('eventOverlayBox');
  const dash = document.getElementById('actionsDashboard');
  const extraBox = document.getElementById('extraQuestionBox');

  overlay.classList.remove('hidden');
  overlay.classList.add('flex');
  dash.classList.add('hidden');
  if (extraBox) extraBox.classList.add('hidden');

  document.getElementById('eventBadge').textContent = '⚡ СОБЫТИЕ (ИГРА НА ПАУЗЕ)';
  document.getElementById('eventBadge').className = 'craft-badge text-xs font-mono uppercase font-bold bg-amber-500 text-slate-950';
  document.getElementById('eventTitle').textContent = title;
  document.getElementById('eventBody').textContent = bodyText;

  const choicesDiv = document.getElementById('eventChoicesContainer');
  choicesDiv.innerHTML = '';

  choices.forEach(c => {
    const btn = document.createElement('button');
    let styleClass = 'bg-[var(--bg-muted)] hover:bg-[var(--bg-elevated)] text-[var(--text-primary)] border border-[var(--border-subtle)]';
    if (c.style === 'primary') styleClass = 'bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold';
    if (c.style === 'info') styleClass = 'bg-sky-600 hover:bg-sky-500 text-white font-bold';
    if (c.style === 'danger') styleClass = 'bg-rose-600 hover:bg-rose-500 text-white font-bold';

    btn.className = `px-3.5 py-2.5 rounded-lg text-xs sm:text-sm transition text-left ${styleClass}`;
    btn.textContent = c.label;
    btn.onclick = c.action;
    choicesDiv.appendChild(btn);
  });
}

function closeEventModal() {
  document.getElementById('eventOverlayBox').classList.add('hidden');
  document.getElementById('eventOverlayBox').classList.remove('flex');
  if (!state.onboarding || state.onboarding.day1ChoiceMade !== false) {
    document.getElementById('actionsDashboard').classList.remove('hidden');
  }
  renderAll();
  if (typeof checkMentorTriggers === 'function') {
    setTimeout(() => checkMentorTriggers(), 50);
  }
}

// 4. ФИНАЛЬНЫЙ ЭКРАН, РАЗБОР ОШИБОК, АЛЬБОМ И КАРТОЧКА 9:16 (GDD 9.1, 9.2, 9.3)

function triggerEndGame(isVictory, title, description) {
  stopTimer();
  closeAnimalModal();
  state.gameOver = true;
  state.victory = isVictory;

  const modal = document.getElementById('endGameModal');
  const badge = document.getElementById('endModalBadge');
  modal.classList.remove('hidden');

  if (isVictory) {
    badge.textContent = '🏆 МИССИЯ ВЫПОЛНЕНА: ЖИЗНЬ СПАСЕНА!';
    badge.className = 'text-xs font-mono uppercase px-2.5 py-1 rounded font-bold bg-emerald-500 text-slate-950';
  } else {
    badge.textContent = '💔 ПАРТИЯ ОКОНЧЕНА: СУРОВАЯ РЕАЛЬНОСТЬ';
    badge.className = 'text-xs font-mono uppercase px-2.5 py-1 rounded font-bold bg-rose-600 text-white';
  }

  document.getElementById('endModalTitle').textContent = title;
  document.getElementById('endModalDescription').textContent = description;

  // Обучающий блок «Работа над ошибками» (GDD 9.1)
  const mistakesBox = document.getElementById('endModalMistakesCard');
  const mistakesText = document.getElementById('endModalMistakesText');
  if (!isVictory && state.fatalMistakeReason) {
    mistakesBox.classList.remove('hidden');
    mistakesText.textContent = getMistakeEducationalText(state.fatalMistakeReason);
  } else {
    mistakesBox.classList.add('hidden');
  }

  // Обновление статистики партии
  document.getElementById('statDays').textContent = state.day;
  document.getElementById('statPersonalSpent').textContent = `${state.personalMoneySpent} BYN`;
  document.getElementById('statVoucherUsed').textContent = `${ +(state.voucherFundsUsed + state.zooshans.voucherDebt).toFixed(1) } BYN`;
  document.getElementById('statFilteredCalls').textContent = state.filteredBadCalls;

  // Заполнение карточки 9:16 для репоста в соцсети (GDD 9.2, 9.3)
  const a = state.animal;
  const isDog = a.species === 'dog';
  const savedAlbumLen = getSavedAlbum().length;
  document.getElementById('storyCardEmoji').textContent = isDog ? '🐕' : '🐈';
  document.getElementById('storyCardTitle').textContent = isVictory
    ? `Я и «${a.petName || a.title}»: ${state.day} дней от улицы до дома`
    : `История «${a.petName || a.title}»: ${state.day} дней борьбы за жизнь`;
  document.getElementById('storyCardSubtitle').textContent = `Окрас: ${a.coatLabel || 'Спасенный'}`;
  document.getElementById('storyCardStatDays').textContent = state.day;
  document.getElementById('storyCardStatPersonal').textContent = `${state.personalMoneySpent} BYN`;
  document.getElementById('storyCardStatVoucher').textContent = `${ +(state.voucherFundsUsed + state.zooshans.voucherDebt).toFixed(1) } BYN`;
  document.getElementById('storyCardStatFiltered').textContent = state.filteredBadCalls;
  const storyAlbumEl = document.getElementById('storyCardStatAlbum');
  if (storyAlbumEl) storyAlbumEl.textContent = savedAlbumLen;

  // Обновление баннера обзора итогов
  const endBanner = document.getElementById('endGameOverviewBanner');
  if (endBanner) {
    const bannerTitle = document.getElementById('endBannerTitle');
    const bannerSub = document.getElementById('endBannerSubtitle');
    if (bannerTitle) bannerTitle.textContent = isVictory ? '🏆 Миссия выполнена: Жизнь спасена!' : '💔 Партия окончена';
    if (bannerSub) bannerSub.textContent = `Пройдено ${state.day} дн. с «${a.petName || a.title}». Вы можете изучить дневник куратора и состояние.`;
  }
}

function closeEndGameModal() {
  const modal = document.getElementById('endGameModal');
  if (modal) modal.classList.add('hidden');
  const banner = document.getElementById('endGameOverviewBanner');
  if (banner) banner.classList.remove('hidden');
  stopTimer();
  renderAll();
}

function reopenEndGameModal() {
  const modal = document.getElementById('endGameModal');
  if (modal) modal.classList.remove('hidden');
}

function getMistakeEducationalText(reason) {
  const mistakesMap = {
    // 1. Питание слепышей
    'cow_milk_blind_kittens': 'Коровье молоко категорически не подходит для выкорма новорожденных котят из-за высокой концентрации казеина и лактозы. ЖКТ малышей не способен его расщепить, что приводит к острому вздутию (тимпаниту), профузной диарее и быстрой гибели от обезвоживания.\n\nЗапомните: слепышей поят исключительно специализированным заменителем кошачьего молока (Royal Canin Babycat Milk) каждые 2–3 часа, а «Зоошанс» бесплатно выдает первый стартовый пакетик смеси всем обратившимся!',
    'cow_milk_or_starvation': 'Слепые новорожденные котята не имеют запаса гликогена в печени. Без регулярного теплого питания каждые 2–3 часа температура их тела падает, наступает критическая гипогликемия и кома. Куратор должен кормить по будильнику даже ночью или вовремя передать малышей опытному волонтеру на стабилизацию!',

    // 2. Ловушки обывателя
    'gurskogo_trap': 'В Беларуси нет государственных приютов. Предприятие на ул. Гурского, 42 («Фауна города») является коммунальной службой отлова и временного содержания. Из-за колоссальной скученности там бушуют инфекции, а срок нахождения ограничен законом, после чего невостребованных животных усыпляют. Спасти жизнь можно только личным кураторством!',
    'dumped_box_trap': 'Подбросить коробку к клинике или зоомагазину — ловушка малодушия. Ветеринарные клиники — это медицинские учреждения без бюджета и мест для содержания бездомных. Подброшенные животные погибают от инфекций от входящих пациентов либо выставляются персоналом на улицу.',
    'landlord_eviction_no_vet': 'При строгом запрете на животных в съемном жилье куратор обязан с первого дня обследовать подопечного в клинике (просвет лампой Вуда и обработка от паразитов). Без первичных анализов ни одна проверенная передержка не пустит животное на порог из соображений биобезопасности!',

    // 3. Бытовые опасности
    'call_window_fall_fatal': 'Кошки не умеют безопасно приземляться с высоты. Даже со 2–3 этажа падение чревато разрывом внутренних органов, переломом неба и параличом. Обычные москитные сетки легко выдавливаются кошачьим весом, а вертикальное клиновидное проветривание — смертельный капкан, где кошки гибнут от удушья и сдавливания почек. Безопасность гарантируют только сварные сетки «Антикошка» (Pet Screen) и гребенки-ограничители!',
    'call_toddler_toy': 'Маленькие дети (до 4–5 лет) не контролируют силу и могут причинить животному боль (тянуть за уши, сдавливать). В целях самообороны питомец пускает в ход когти, после чего родители в панике выставляют «агрессора» на улицу. Отдавать животных в семьи с малышами можно только при постоянном контроле взрослых!',
    'call_anti_spay_aesthetic': 'Миф о «радости материнства» и «родах для здоровья» ежегодно убивает тысячи животных. Роды изнашивают организм, а некастрированные питомцы страдают от онкологии и пиометры. Раздача котят «по знакомым» — самообман: большинство из них и их потомства окажется на улице. Стерилизация — единственный законный и гуманный способ остановить конвейер смертей!',
    'call_village_mice_outdoor': 'Самовыгул в деревне или частном секторе — это короткая жизнь: коты на улице живут в среднем 2–3 года вместо 15 лет дома (гибнут под колесами, от зубов собак, яда для крыс и капканов). Кошка должна жить в тепле и безопасности внутри дома!',
    'call_dorm_secret': 'В студенческих общежитиях содержание животных строго запрещено уставом. Рано или поздно комендант находит питомца во время проверки, и студент под угрозой выселения выставляет животное на улицу посреди зимы.',
    'call_gift_girlfriend_surprise': 'Животное в подарок-сюрприз без ведома человека — опасный жест. Питомец — это 15 лет ежедневных расходов и ухода. Если человек не готов брать такую ответственность, спасенный хвостик быстро оказывается на улице.',
    'call_bones_and_pork': 'Трубчатые птичьи кости раскалываются на острые осколки, протыкающие желудок и кишечник собаки, вызывая перитонит и мучительную гибель. Жареная свинина гарантирует острый панкреатит. Собаке требуется сбалансированный видовой рацион!',
    'call_dog_chain_village': 'Короткая цепь — пытка для собаки. Без движения деформируются суставы, а без обработки каплями от клещей цепные собаки в Беларуси массово погибают от весеннего пироплазмоза за 48 часов.',
    'call_fiv_felv_ignorer': 'Вирусный лейкоз кошек (FeLV / ВЛК) смертелен и передается через общую слюну, миски и вылизывание. Подселять FeLV-положительную кошку к здоровым непривитым животным недопустимо!',
    'call_fake_breed_colorpoint': '«Черные разведенцы» охотятся за породистыми фенотипами колор-пойнтов для коммерческих вязок без вакцин. Животное запирают в тесной клетке как станок для пложения, а затем выбрасывают. Отдавать животных можно только после стерилизации!',
    'call_halloween_black_cat': 'Перед Хэллоуином (конец октября) волонтеры вводят жесткий мораторий на отдачу черных котов из-за риска садистских ритуалов и жестоких подростковых розыгрышей. Черных кошек отдают только по паспорту и договору!',

    // 4. Мошенники
    'scam_courier_prepay': 'Мошенники мониторят объявления о животных. Ссылка на «страховку доставки курьером» — типичный фишинг для списания денег с карты. Никогда не переходите по сторонним платежным ссылкам!',
    'scam_breeder_metro': 'Коробочницы у метро принимают животных «на пристройство», держат их в тесных грязных коробках до первого вируса, а непроданных к вечеру выбрасывают в мусорные баки или лесополосы.',

    // 5. Болезни и побеги
    'piroplasmosis': 'Пироплазмоз (бабезиоз) собак передается иксодовыми клещами и разрушает эритроциты за считанные дни. Темная моча и отказ от еды — повод немедленно бежать в клинику за уколом антидота! Единственная профилактика — капли на холку каждые 30 дней.',
    'escape_lost_forever': 'Если испуганное животное сорвалось с поводка, счет идет на часы. В первые 4 дня спасает только тотальная расклейка бумажных объявлений и ночные поиски с фонарем в 4–5 утра в подвалах.',
    'fip_no_treatment': 'Инфекционный перитонит кошек (ФИП) сегодня излечим препаратом GS-441524 (84 дня терапии). Усыплять кота с ФИП без попытки терапии — трагическая потеря шанса на спасение!',
    'abandoned_on_foster': 'Человек из соцсетей, взявший подопечного бесплатно — не профессионал. Если бросить его без связи и снабжения кормом, он выставит животное во двор. Куратор обязан контролировать условия и быть на связи!',
    'virus_no_icu': 'Панлейкопения кошек и парвовирусный энтерит щенков требуют интенсивной терапии в круглосуточном стационаре с инфузоматами. Домашними каплями такие вирусы не лечатся!',
    'icu_virus_fatal': 'Даже в лучших инфекционных ОРИТ Минска летальность от панлейкопении и парвовирусного энтерита у непривитых малышей доходит до 20–30%. Врачи боролись до последнего, но организм не справился с интоксикацией. Единственная гарантия защиты — своевременная вакцинация!',
    'icu_trauma_fatal': 'Тяжелая политравма и разрывы внутренних органов после наезда автомобиля могут приводить к летальному травматическому шоку даже при проведении экстренной операции.',
    'burnout': 'Эмоциональное выгорание — тяжелейшая проблема в зоозащите. Не оставайтесь со своими переживаниями один на один: волонтерский чат @zooshans_chat создан именно для того, чтобы делиться трудностями и находить поддержку!'
  };

  return mistakesMap[reason] || 'Главное правило спасения: животное не может защитить себя само. Каждый шаг куратора (от карантина и сеток на окнах до договора с паспортными данными) должен исключать любые риски!';
}

function copyStoryCardToClipboard() {
  const a = state.animal;
  const isVic = state.victory;
  const albumCount = getSavedAlbum().length;
  const seasonsStr = (state.seasonsPassed && state.seasonsPassed.length > 0)
    ? state.seasonsPassed.map(s => {
        const seasonLabels = { summer: '☀️ Лето', autumn: '🍂 Осень', winter: '❄️ Зима', spring: '🌱 Весна' };
        return seasonLabels[s] || s;
      }).join(' → ')
    : (state.currentSeason ? getSeasonLabelRu(state.currentSeason) : 'Минск');

  const text = `🐾 ИСТОРИЯ СПАСЕНИЯ: ${isVic ? 'ОТ УЛИЦЫ ДО ДОМА!' : 'БОРЬБА ЗА ЖИЗНЬ'}\n` +
    `Я и подопечный: «${a.petName || a.title}» (${a.speciesLabel}, ${a.coatLabel || 'спасенный'})\n` +
    `⏳ Прожито дней в симуляторе: ${state.day} (${seasonsStr})\n` +
    `💰 Потрачено личных средств: ${state.personalMoneySpent} BYN\n` +
    `🎫 Привлечено по талонам и сборам: ${ +(state.voucherFundsUsed + state.zooshans.voucherDebt).toFixed(1) } BYN\n` +
    `🛡️ Отсеяно опасных «ручек»: ${state.filteredBadCalls}\n` +
    `🏆 В моем личном альбоме спасенных жизней: ${albumCount}\n\n` +
    `В Беларуси нет государственных приютов. Вся реальная помощь держится только на волонтерах МБООПЖ «Зоошанс»:\n` +
    `💳 Помочь «Зоошансу» (Код ЕРИП: 4346991): https://zooshans.by/help-us\n` +
    `💬 Чат волонтеров и проверка ручек: https://t.me/zooshans_chat\n` +
    `🤖 Справочный бот-памятка: https://t.me/zooshans_info_bot\n` +
    `🏷️ Картотека кличек Зоошанса: https://forum.zooshans.by/app.php/petnames`;

  navigator.clipboard.writeText(text).then(() => {
    const btn = document.getElementById('btnCopyStoryCard');
    const oldText = btn.textContent;
    btn.textContent = '✓ Текст скопирован!';
    btn.className = 'px-2.5 py-1 rounded bg-emerald-600 text-slate-950 text-[11px] font-mono font-bold transition';
    setTimeout(() => {
      btn.textContent = oldText;
      btn.className = 'px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-sky-300 border border-slate-600 text-[11px] font-mono font-semibold transition';
    }, 2500);
  }).catch(() => {
    alert('Не удалось скопировать в буфер обмена. Скопируйте текст вручную.');
  });
}

// 5. АЛЬБОМ СПАСЕННЫХ ХВОСТОВ И ОПЫТ КУРАТОРА (СЕКЦИЯ 7, GDD 9.2)

let currentAlbumTab = 'trial';

function switchAlbumTab(tabName) {
  currentAlbumTab = tabName;
  const btnTrial = document.getElementById('btnAlbumTabTrial');
  const btnAdopted = document.getElementById('btnAlbumTabAdopted');
  const contentTrial = document.getElementById('albumTabContent_trial');
  const contentAdopted = document.getElementById('albumTabContent_adopted');

  if (tabName === 'trial') {
    if (btnTrial) btnTrial.classList.add('active');
    if (btnAdopted) btnAdopted.classList.remove('active');
    if (contentTrial) contentTrial.classList.remove('hidden');
    if (contentAdopted) contentAdopted.classList.add('hidden');
  } else {
    if (btnTrial) btnTrial.classList.remove('active');
    if (btnAdopted) btnAdopted.classList.add('active');
    if (contentTrial) contentTrial.classList.add('hidden');
    if (contentAdopted) contentAdopted.classList.remove('hidden');
  }
}

function showAlbumModal() {
  stopTimer();
  window.isAlbumModalOpen = true;
  const modal = document.getElementById('savedAlbumModal');
  const trialList = document.getElementById('albumTrialList');
  const adoptedList = document.getElementById('savedAlbumList');
  const trialCountEl = document.getElementById('albumTrialCount');
  const adoptedCountEl = document.getElementById('albumAdoptedCount');
  const totalCountEl = document.getElementById('albumTotalCountText');
  const headerAlbumEl = document.getElementById('headerAlbumCount');

  const album = getSavedAlbum();
  const trials = state.trialAnimals || [];

  if (trialCountEl) trialCountEl.textContent = trials.length;
  if (adoptedCountEl) adoptedCountEl.textContent = album.length;
  if (totalCountEl) totalCountEl.textContent = `Всего спасено жизней: ${album.length}`;
  if (headerAlbumEl) headerAlbumEl.textContent = album.length;

  // Автоматический выбор вкладки: если на испытательном никого нет, а дома есть — открываем «Дома навсегда»
  if (trials.length === 0 && album.length > 0) {
    switchAlbumTab('adopted');
  } else {
    switchAlbumTab(currentAlbumTab);
  }

  // 1. РЕНДЕРИНГ ВКЛАДКИ: НА ИСПЫТАТЕЛЬНОМ (14 ДН.)
  if (trialList) {
    if (trials.length === 0) {
      trialList.innerHTML = `
        <div class="col-span-1 sm:col-span-2 p-6 text-center bg-[var(--bg-muted)] border border-[var(--border-subtle)] rounded-xl">
          <div class="text-3xl mb-2">⏳</div>
          <div class="text-sm font-semibold text-[var(--text-primary)]">Сейчас ни один подопечный не находится на испытательном сроке</div>
          <p class="text-xs text-[var(--text-secondary)] mt-1">
            Когда вы пройдете собеседование со звонящими ручками и передадите хвостика в семью — он появится в этом списке на 14 дней с возможностью контроля.
          </p>
        </div>
      `;
    } else {
      trialList.innerHTML = trials.map(t => {
        const isDog = t.species === 'dog';
        const icon = isDog ? '🐕' : '🐈';
        const totalDays = t.trialDaysTotal || 14;
        const daysPassed = t.daysPassed || 1;
        const progressPct = Math.min(100, Math.round((daysPassed / totalDays) * 100));

        let flagClass = 'flag--green';
        let flagText = '✓ Надежная семья';
        if (t.reliabilityFlag === 'red' || t.isRedFlag) {
          flagClass = 'flag--red';
          flagText = '🚨 Высокий риск возврата';
        } else if (t.reliabilityFlag === 'yellow' || (t.callData && t.callData.isCompromise)) {
          flagClass = 'flag--yellow';
          flagText = '⚠️ Кураторское сопровождение';
        }

        return `
          <div class="bg-[var(--bg-card)] border border-[var(--border-subtle)] hover:border-[var(--season-accent)] rounded-xl p-3 flex flex-col justify-between transition shadow-xs">
            <div>
              <div class="flex items-start justify-between gap-2 pb-2 border-b border-[var(--border-subtle)]">
                <div class="flex items-center gap-2 min-w-0">
                  <span class="text-xl p-1.5 rounded-lg bg-[var(--bg-muted)] border border-[var(--border-subtle)] shrink-0">${icon}</span>
                  <div class="min-w-0">
                    <h4 class="font-bold text-[var(--text-primary)] text-xs sm:text-sm truncate">«${t.petName || 'Подопечный'}»</h4>
                    <div class="text-[10px] text-[var(--text-secondary)] truncate">Источник: ${t.prChannel || 'Куфар'}</div>
                  </div>
                </div>
                <span class="craft-badge text-[9.5px] font-bold ${flagClass} shrink-0">
                  ${flagText}
                </span>
              </div>

              <div class="text-[11px] text-[var(--text-secondary)] mt-2 leading-tight">
                <span class="font-medium text-[var(--text-primary)]">Семья:</span> ${escapeHtml(t.adopterSummary || 'Семья усыновителей')}
              </div>

              <!-- Шкала прогресса испытательного срока (День X из 14) -->
              <div class="mt-2.5">
                <div class="flex items-center justify-between text-[10px] font-mono mb-1">
                  <span class="text-[var(--text-secondary)] font-semibold">Прогресс срока:</span>
                  <span class="text-emerald-700 font-bold">День ${daysPassed} из ${totalDays}</span>
                </div>
                <div class="w-full bg-[var(--bg-muted)] border border-[var(--border-subtle)] h-2 rounded-full overflow-hidden">
                  <div class="bg-emerald-500 h-full transition-all" style="width: ${progressPct}%"></div>
                </div>
              </div>
            </div>

            <!-- Кнопка принудительного возврата -->
            <button onclick="actionCancelTrialReturn(${t.id})" class="mt-3 w-full py-1.5 px-2 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-900 border border-rose-300 text-[10.5px] font-bold transition flex items-center justify-center gap-1 cursor-pointer">
              ⚠️ Забрать обратно (принудительный возврат)
            </button>
          </div>
        `;
      }).join('');
    }
  }

  // 2. РЕНДЕРИНГ ВКЛАДКИ: ДОМА НАВСЕГДА
  if (adoptedList) {
    if (album.length === 0) {
      adoptedList.innerHTML = `
        <div class="col-span-1 sm:col-span-2 p-6 text-center bg-[var(--bg-muted)] border border-[var(--border-subtle)] rounded-xl">
          <div class="text-3xl mb-2">🐾</div>
          <div class="text-sm font-semibold text-[var(--text-primary)]">Пока в альбоме нет спасенных хвостиков</div>
          <p class="text-xs text-[var(--text-secondary)] mt-1">
            Пройдите путь куратора до конца, чтобы успешно пристроить подопечного (или оставить себе) — и его памятная карточка навсегда сохранится здесь!
          </p>
        </div>
      `;
    } else {
      adoptedList.innerHTML = album.map(tail => {
        const isDog = tail.species === 'dog';
        const icon = isDog ? '🐕' : '🐈';
        const seasonsStr = (tail.seasonsPassed && tail.seasonsPassed.length > 0)
          ? tail.seasonsPassed.map(s => {
              const seasonLabels = { summer: '☀️ Лето', autumn: '🍂 Осень', winter: '❄️ Зима', spring: '🌱 Весна' };
              return seasonLabels[s] || s;
            }).join(' → ')
          : 'Сезон спасения';

        const greetingBtn = tail.greetingReceived
          ? `<span class="craft-badge text-[9.5px] font-bold bg-emerald-50 text-emerald-800 border-emerald-300">✓ Привет получен</span>`
          : `<button onclick="actionReceiveGreetingFromHome('${tail.id}')" class="px-2 py-1 rounded-lg bg-pink-50 hover:bg-pink-100 text-pink-900 border border-pink-300 font-bold text-[10px] transition cursor-pointer flex items-center gap-1 shadow-xs">
              💌 Привет из дома (+5% 🧠)
            </button>`;

        return `
          <div class="bg-[var(--bg-card)] border border-[var(--border-subtle)] hover:border-[var(--season-accent)] rounded-xl p-3 flex flex-col justify-between transition shadow-xs">
            <div>
              <div class="flex items-start justify-between gap-2 pb-2 border-b border-[var(--border-subtle)]">
                <div class="flex items-center gap-2 min-w-0">
                  <span class="text-xl p-1.5 rounded-lg bg-[var(--bg-muted)] border border-[var(--border-subtle)] shrink-0">${icon}</span>
                  <div class="min-w-0">
                    <h4 class="font-bold text-[var(--text-primary)] text-xs sm:text-sm truncate">«${tail.petName || 'Найденыш'}»</h4>
                    <span class="craft-badge text-[9px] bg-emerald-50 text-emerald-800 border-emerald-300">
                      ${tail.archetypeTitle || 'Подопечный'}
                    </span>
                  </div>
                </div>
                <span class="craft-badge font-bold text-[9.5px] text-emerald-800 bg-emerald-50 border-emerald-300 shrink-0">
                  ✓ ДОМА!
                </span>
              </div>

              <div class="text-[11px] text-[var(--text-secondary)] mt-2 space-y-0.5 leading-tight">
                <div>Окрас: <span class="font-mono font-semibold">${tail.coatName || 'Уличный'}</span></div>
                <div>Семья: <span class="text-sky-800 font-medium">${escapeHtml(tail.adopterSummary || 'Любящий дом')}</span></div>
                <div class="text-[10px] font-mono text-[var(--text-muted)] mt-1">
                  ⏳ Кураторство: ${tail.daysSpent || 18} дн. (${seasonsStr})
                </div>
                <div class="text-[10px] font-mono text-[var(--text-muted)]">
                  💰 Личных: ${tail.personalSpent || 0} BYN • Пиар: ${tail.prChannel || 'zooshans.by'}
                </div>
              </div>
            </div>

            <div class="mt-3 pt-2 border-t border-[var(--border-subtle)] flex items-center justify-between">
              <span class="text-[9.5px] font-mono text-[var(--text-muted)]">${tail.dateSaved || 'Минск'}</span>
              ${greetingBtn}
            </div>
          </div>
        `;
      }).join('');
    }
  }

  modal.classList.remove('hidden');
}

function closeAlbumModal() {
  window.isAlbumModalOpen = false;
  const modal = document.getElementById('savedAlbumModal');
  if (modal) modal.classList.add('hidden');
}

function actionCancelTrialReturn(trialId) {
  if (state.gameOver) return;
  const idx = state.trialAnimals.findIndex(t => t.id === trialId);
  if (idx === -1) return;
  const trial = state.trialAnimals[idx];
  state.trialAnimals.splice(idx, 1);
  state.animal.activeCount = (state.animal.activeCount || 0) + trial.count;
  state.animal.count = state.animal.activeCount;
  state.animal.trialCount = Math.max(0, (state.animal.trialCount || 0) - trial.count);
  const isPair = (trial.count || 1) > 1;
  const cancelMsg = isPair
    ? `День ${state.day}: ⚠️ Куратор решил забрать подопечных («${trial.petName}») обратно с испытательного срока из-за сомнений в семье. Хвостики снова под вашим бытовым попечением.`
    : `День ${state.day}: ⚠️ Куратор решил забрать подопечного («${trial.petName}») обратно с испытательного срока из-за сомнений в семье. Хвостик снова под вашим бытовым попечением.`;
  addLog(cancelMsg, 'warn');
  renderAll();
  showAlbumModal();
}

function actionReceiveGreetingFromHome(tailId) {
  if (state.gameOver) return;
  const album = getSavedAlbum();
  const tail = album.find(t => String(t.id) === String(tailId));
  if (!tail) return;
  if (tail.greetingReceived) {
    addLog(`День ${state.day}: 💌 Вы уже получили недавний привет от семьи («${tail.petName}»)! Хозяева передают искреннюю благодарность.`, 'info');
    return;
  }
  tail.greetingReceived = true;
  savePetToAlbum(tail);
  state.mental = Math.min(100, state.mental + 5);
  const isPair = tail.petName && tail.petName.includes(' и ');
  const greetingText = isPair
    ? `Теплый фото-привет из дома от подопечных («${tail.petName}»)! Счастливые мордочки на пушистом коврике восстанавливают душевные силы куратора (+5% 🧠).`
    : `Теплый фото-привет из дома от подопечного («${tail.petName}»)! Счастливая мордочка на пушистом коврике восстанавливает душевные силы куратора (+5% 🧠).`;
  addLog(`День ${state.day}: 💌 ${greetingText}`, 'success');
  renderAll();
  showAlbumModal();
}

window.switchAlbumTab = switchAlbumTab;
window.actionCancelTrialReturn = actionCancelTrialReturn;
window.actionReceiveGreetingFromHome = actionReceiveGreetingFromHome;


// 6. МОДАЛЬНОЕ ОКНО КАРТОЧКИ ПОДОПЕЧНОГО
function showAnimalModal() {
  stopTimer();
  window.isAnimalModalOpen = true;
  const modal = document.getElementById('animalModal');
  if (modal) {
    modal.classList.remove('hidden');
  }
}

function closeAnimalModal() {
  window.isAnimalModalOpen = false;
  const modal = document.getElementById('animalModal');
  if (modal) {
    modal.classList.add('hidden');
  }
}

document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    closeAnimalModal();
    closeAlbumModal();
    closeEndGameModal();
    closeScenarioPickerModal();
    if (typeof closeMentorModal === 'function') closeMentorModal();
    if (typeof closeMentorArchiveModal === 'function') closeMentorArchiveModal();
    if (typeof closeCandidateModal === 'function') closeCandidateModal();
  }
});

let currentScenarioFilter = 'all';

function openScenarioPickerModal() {
  stopTimer();
  window.isScenarioPickerOpen = true;
  const modal = document.getElementById('scenarioPickerModal');
  if (!modal) return;
  modal.classList.remove('hidden');
  renderScenarioCards(currentScenarioFilter);
}

function closeScenarioPickerModal() {
  window.isScenarioPickerOpen = false;
  const modal = document.getElementById('scenarioPickerModal');
  if (modal) {
    modal.classList.add('hidden');
  }
}

function filterScenarioPicker(category) {
  currentScenarioFilter = category;
  // Update button active styles
  const buttons = document.querySelectorAll('.scenario-filter-btn');
  buttons.forEach(btn => {
    if (btn.dataset.category === category) {
      btn.className = 'scenario-filter-btn px-3 py-1 rounded-lg text-xs font-mono font-bold bg-emerald-600 text-white transition';
    } else {
      btn.className = 'scenario-filter-btn px-3 py-1 rounded-lg text-xs font-mono font-bold bg-[var(--bg-muted)] hover:bg-[var(--bg-elevated)] text-[var(--text-secondary)] border border-[var(--border-subtle)] transition';
    }
  });
  renderScenarioCards(category);
}

function renderScenarioCards(filter = 'all') {
  const container = document.getElementById('scenarioCardsContainer');
  if (!container) return;

  const scenarios = (window.GAME_DATA && window.GAME_DATA.scenarios) ? window.GAME_DATA.scenarios : [];
  
  const filtered = scenarios.filter(sc => {
    if (filter === 'all') return true;
    if (filter === 'cats') return sc.species === 'cat' && sc.ageCategory !== 'kitten' && !sc.kittensCount && !sc.countRange;
    if (filter === 'dogs') return sc.species === 'dog';
    if (filter === 'litters') return sc.ageCategory === 'kitten' || sc.kittensCount || sc.countRange || sc.count > 1;
    if (filter === 'hard') {
      const h = sc.hiddenState || {};
      return h.hasSevereTrauma || h.isNewborn || h.isPregnant || h.deadlyVirus || h.chronicCarrier || sc.id === 'purebred_scam_magnet' || sc.id === 'dacha_kittens_herpes_eyes';
    }
    return true;
  });

  if (filtered.length === 0) {
    container.innerHTML = '<div class="col-span-full text-center py-8 text-xs text-[var(--text-secondary)]">В этой категории сценариев не найдено.</div>';
    return;
  }

  container.innerHTML = filtered.map((sc, idx) => {
    const isDog = sc.species === 'dog';
    const isLitter = sc.count > 1 || sc.countRange || sc.kittensCount;
    const emoji = isDog ? (isLitter ? '🐶🐾' : '🐶') : (isLitter ? '🐱🍼' : '🐱');

    let badgeText = 'Стандарт';
    let badgeClass = 'bg-slate-100 text-slate-800 border-slate-300';

    const h = sc.hiddenState || {};
    if (h.hasSevereTrauma) {
      badgeText = '🚨 Тяжелая травма';
      badgeClass = 'bg-rose-100 text-rose-900 border-rose-300';
    } else if (h.isNewborn) {
      badgeText = '🍼 Слепыши (бутылочка)';
      badgeClass = 'bg-purple-100 text-purple-900 border-purple-300';
    } else if (h.isPregnant) {
      badgeText = '⏳ Срочная стерилизация';
      badgeClass = 'bg-amber-100 text-amber-900 border-amber-300';
    } else if (h.deadlyVirus) {
      badgeText = '⚠️ Острый вирус (ПЦР)';
      badgeClass = 'bg-orange-100 text-orange-900 border-orange-300';
    } else if (h.chronicCarrier) {
      badgeText = `🧬 Хроник (${h.chronicCarrier.toUpperCase()})`;
      badgeClass = 'bg-indigo-100 text-indigo-900 border-indigo-300';
    } else if (sc.id === 'purebred_scam_magnet') {
      badgeText = '💎 Породистый (мошенники)';
      badgeClass = 'bg-cyan-100 text-cyan-900 border-cyan-300';
    } else if (sc.id === 'dacha_kittens_herpes_eyes') {
      badgeText = '👁️ Глазной герпес';
      badgeClass = 'bg-red-100 text-red-900 border-red-300';
    } else if (isLitter) {
      badgeText = '👨‍👩‍👧‍👦 Выводок';
      badgeClass = 'bg-emerald-100 text-emerald-900 border-emerald-300';
    }

    const cleanTitle = (sc.titleTemplate || sc.id)
      .replace(/{cnt}/g, sc.count || (sc.countRange ? `${sc.countRange[0]}-${sc.countRange[1]}` : '3'))
      .replace(/{coatName}/g, 'окрас')
      .replace(/{coatAdjFemale}/g, 'окраса')
      .replace(/{coatAdjMale}/g, 'окраса')
      .replace(/{coatAdjPlural}/g, 'окраса');

    const cleanDesc = (sc.visualDescriptionTemplate || '')
      .replace(/{cnt}/g, sc.count || (sc.countRange ? `${sc.countRange[0]}-${sc.countRange[1]}` : '3'))
      .replace(/{coatName}/g, 'типичного окраса')
      .replace(/{coatAdjFemale}/g, 'типичного окраса')
      .replace(/{coatAdjMale}/g, 'типичного окраса')
      .replace(/{coatAdjPlural}/g, 'типичного окраса');

    return `
      <div onclick="selectScenarioAndStart('${sc.id}')" class="group relative p-3 sm:p-3.5 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-card)] hover:border-emerald-500 hover:shadow-md cursor-pointer transition flex flex-col justify-between text-left">
        <div>
          <div class="flex items-center justify-between gap-1 mb-1.5 flex-wrap">
            <span class="inline-flex items-center gap-1 text-xs font-mono font-bold text-[var(--text-primary)]">
              <span>${emoji}</span>
              <span>${sc.speciesLabel || (isDog ? 'Пес' : 'Кот')}</span>
            </span>
            <span class="text-[10px] font-mono px-2 py-0.5 rounded-full border font-bold ${badgeClass}">
              ${badgeText}
            </span>
          </div>

          <h4 class="font-extrabold text-xs sm:text-sm text-[var(--text-primary)] group-hover:text-emerald-700 dark:group-hover:text-emerald-400 transition leading-snug mb-1.5">
            ${cleanTitle}
          </h4>

          <p class="text-[11px] text-[var(--text-secondary)] leading-relaxed line-clamp-3">
            ${cleanDesc}
          </p>
        </div>

        <div class="mt-3 pt-2 border-t border-[var(--border-subtle)] flex items-center justify-between text-[11px]">
          <span class="text-[10px] font-mono text-[var(--text-secondary)]">ID: ${sc.id}</span>
          <span class="font-bold text-emerald-700 dark:text-emerald-400 flex items-center gap-0.5 group-hover:translate-x-0.5 transition">
            Выбрать ▶
          </span>
        </div>
      </div>
    `;
  }).join('');
}

function selectScenarioAndStart(scenarioId) {
  const scenarios = (window.GAME_DATA && window.GAME_DATA.scenarios) ? window.GAME_DATA.scenarios : [];
  const found = scenarios.find(s => s.id === scenarioId);
  closeScenarioPickerModal();
  if (found) {
    startNewRun(false, found);
    if (typeof addLog === 'function') {
      addLog(`📋 Запущен сценарий: «${state.animal.title}» (${state.animal.speciesLabel}). Удачи в спасении!`, 'info');
    }
  } else {
    startNewRun(false);
  }
}

window.openScenarioPickerModal = openScenarioPickerModal;
window.closeScenarioPickerModal = closeScenarioPickerModal;
window.filterScenarioPicker = filterScenarioPicker;
window.selectScenarioAndStart = selectScenarioAndStart;

// ================= ИНТЕРАКТИВНЫЕ ПОДСКАЗКИ РЕСУРСОВ (HUD И СНАБЖЕНИЕ) =================

function getResourceTooltipData(st = window.state) {
  if (!st) return null;
  const a = st.animal || {};
  const p = st.player || {};
  const z = st.zooshans || {};
  const f = st.fundraising || {};
  const isHome = typeof isAnimalAtPlayerHome === 'function' ? isAnimalAtPlayerHome() : true;
  const nActive = a.activeCount !== undefined ? a.activeCount : (a.count || 1);
  const nTotal = a.totalCount || a.count || 1;

  // 1. БЮДЖЕТ (BYN)
  const currentCash = +(st.cash || 0).toFixed(1);
  const monthlySalary = p.income?.monthlyFreeCash || 400;
  const daysInCycle = st.day ? (st.day % 30) : 1;
  const isSalaryToday = st.day ? (st.day % 30 === 0) : false;
  const daysUntilSalary = isSalaryToday ? 0 : (30 - daysInCycle);
  const cardRaised = f.personalCardRaisedYear || 0;
  const cardLimit = 6500;
  const cardPercent = Math.min(100, Math.round((cardRaised / cardLimit) * 100));
  const socialMultiplier = p.socialCapital?.multiplier || 1.0;
  const socialLabel = p.socialCapital?.label || 'Обычный круг';
  const taxiExtra = p.mobility?.extraTaxiCost || 0;

  // 2. МЕНТАЛКА (%)
  const currentMental = Math.round(st.mental || 0);
  const familyMentalBonus = p.family?.mentalBonus || 0;
  const familyLabel = p.family?.label || 'Семья';
  const housingDrain = (isHome && nActive > 0) ? (p.housing?.dailyMentalDrain || 0) : 0;
  const housingLabel = p.housing?.label || 'Свое жилье';
  const litterDrain = (isHome && nActive > 0 && !a.litterTrained) ? 3 : 0;
  const netDailyMental = familyMentalBonus - (housingDrain + litterDrain);

  // 3. ЭНЕРГИЯ (⚡)
  const totalEnergy = Math.round(st.energy || 0);
  const householdDrain = (typeof calculateDailyHouseholdEnergyDrain === 'function') ? calculateDailyHouseholdEnergyDrain() : 0;
  const lockedEnergy = isHome ? householdDrain : 0;
  const freeEnergy = Math.max(0, totalEnergy - lockedEnergy);
  const morningEnergyBonus = p.family?.energyBonus || 32;
  const netMorningEnergy = morningEnergyBonus - householdDrain;

  const householdItems = [];
  if (isHome && nActive > 0) {
    if (st.newborn && st.newborn.active) {
      householdItems.push('Выкармливание слепышей каждые 2 ч (-30⚡)');
    } else if (nTotal > 1) {
      householdItems.push(`Выводок (${nActive}/${nTotal} шт.)`);
    } else {
      householdItems.push(a.species === 'dog' ? 'Выгул и уход за собакой (-16..25⚡)' : 'Лоток и кормление кота (-10⚡)');
    }
    if (!a.litterTrained) householdItems.push('Уборка луж до приучения (-12⚡)');
    if (a.knownRingworm === true) householdItems.push('Обработки очагов лишая (-12⚡)');
    if (a.hiddenState?.isJawFracture && a.hiddenState.syringeDaysLeft > 0) householdItems.push('Шприцевой докорм челюсти (-20⚡)');
    if (!a.eyeDropsCompleted) householdItems.push('Капли в глаза каждые 2 ч (-15⚡)');
    if (!a.giProtocolCompleted) householdItems.push('Лечение диареи/ЖКТ (-12⚡)');
    if (st.pr && st.pr.lostSearchActive) householdItems.push('Поиск беглеца (-10⚡)');
  }

  // 4. ЗДОРОВЬЕ ПИТОМЦА (%)
  const currentHealth = Math.round(a.health || 0);
  const inStationary = (a.inStationaryDaysLeft || 0) > 0;
  const stationaryDaysLeft = a.inStationaryDaysLeft || 0;
  const stationaryRecoveryRate = a.stationaryReason === 'virus' ? 12 : 8;
  const foodDaysLeft = a.foodDaysLeft !== undefined ? a.foodDaysLeft : 4;
  const isStarving = foodDaysLeft <= 0 && nActive > 0;

  // 5. ЛИМИТ СБОРА НА КАРТУ
  const cardRemaining = Math.max(0, cardLimit - cardRaised);

  // 6. ТАЛОН ЗООШАНСА
  const voucherDebt = +(z.debt || 0).toFixed(1);
  const voucherLimit = 1000;
  const voucherPercent = Math.min(100, Math.round((voucherDebt / voucherLimit) * 100));
  const voucherDaysLeft = z.voucherDaysLeft !== undefined ? z.voucherDaysLeft : 30;
  const isSubmitted = !!z.applicationSubmitted;
  const hasDiscount = z.clinicMode === 'partner_cash';

  // 7. СНАБЖЕНИЕ
  const milkDaysLeft = st.newborn?.milkDaysLeft || 0;
  const isNewborn = !!(st.newborn && st.newborn.active);
  const locationStatus = z.locationStatus || 'home_floor';
  const isPaidFoster = locationStatus === 'paid_foster';
  const paidFosterDailyCost = isPaidFoster ? (a.species === 'dog' ? 33 : 16) : 0;

  return {
    cash: {
      current: currentCash,
      monthlySalary,
      daysUntilSalary,
      isSalaryToday,
      cardRaisedYear: cardRaised,
      cardLimit,
      cardPercent,
      socialMultiplier,
      socialLabel,
      taxiExtra
    },
    mental: {
      current: currentMental,
      familyBonus: familyMentalBonus,
      familyLabel,
      housingDrain,
      housingLabel,
      litterDrain,
      netDailyChange: netDailyMental
    },
    energy: {
      total: totalEnergy,
      free: freeEnergy,
      locked: lockedEnergy,
      morningBonus: morningEnergyBonus,
      householdDrain,
      householdItems,
      netMorningChange: netMorningEnergy
    },
    health: {
      current: currentHealth,
      species: a.species || 'cat',
      title: a.title || 'Найденыш',
      inStationary,
      stationaryDaysLeft,
      stationaryRecoveryRate,
      foodDaysLeft,
      isStarving,
      hasTrauma: !!(a.hiddenState?.hasSevereTrauma && !a.traumaOperated),
      hasRingworm: a.knownRingworm === true
    },
    cardLimit: {
      raised: cardRaised,
      limit: cardLimit,
      percent: cardPercent,
      remaining: cardRemaining,
      socialMultiplier,
      socialLabel
    },
    voucher: {
      debt: voucherDebt,
      limit: voucherLimit,
      percent: voucherPercent,
      daysLeft: voucherDaysLeft,
      isSubmitted,
      hasDiscount
    },
    supply: {
      foodDaysLeft,
      milkDaysLeft,
      isNewborn,
      locationStatus,
      isPaidFoster,
      dailyCost: paidFosterDailyCost
    }
  };
}

function updateResourceTooltips() {
  if (typeof document === 'undefined') return;
  const data = getResourceTooltipData(window.state);
  if (!data) return;

  // 1. Тултип Бюджета (#tooltip-cash)
  const elCash = document.getElementById('tooltip-cash');
  if (elCash) {
    elCash.innerHTML = `
      <div class="resource-tooltip-header">
        <span class="text-emerald-700 font-extrabold">💰 Бюджет: ${data.cash.current} BYN</span>
        <span class="resource-tooltip-badge ${data.cash.isSalaryToday ? 'bg-amber-100 text-amber-900 border border-amber-300' : 'bg-emerald-50 text-emerald-800 border border-emerald-300'}">
          ${data.cash.isSalaryToday ? 'ЗП сегодня!' : `ЗП через ${data.cash.daysUntilSalary} дн.`}
        </span>
      </div>
      <div>
        <div class="resource-tooltip-title text-emerald-700">🟢 Как пополняется:</div>
        <div class="resource-tooltip-item"><span class="bullet text-emerald-600">+</span><span>Зарплата раз в 30 дн.: <b>+${data.cash.monthlySalary} BYN</b></span></div>
        <div class="resource-tooltip-item"><span class="bullet text-emerald-600">+</span><span>Сборы на карту: вкладка 3 («Пиар», до 6500 BYN)</span></div>
        <div class="resource-tooltip-item"><span class="bullet text-emerald-600">+</span><span>Посылки добра и помощь подписчиков</span></div>
      </div>
      <div class="resource-tooltip-section">
        <div class="resource-tooltip-title text-rose-700">🔴 Основные траты:</div>
        <div class="resource-tooltip-item"><span class="bullet text-rose-600">-</span><span>Ветклиника: приемы, анализы, операции, вакцины</span></div>
        <div class="resource-tooltip-item"><span class="bullet text-rose-600">-</span><span>Корм: 65 BYN (кот) / 120 BYN (собака) на 14 дн.</span></div>
        <div class="resource-tooltip-item"><span class="bullet text-rose-600">-</span><span>Платная передержка: 16/33 BYN в сутки</span></div>
        ${data.cash.taxiExtra > 0 ? `<div class="resource-tooltip-item"><span class="bullet text-amber-600">🚕</span><span>Такси без авто: <b>+${data.cash.taxiExtra} BYN</b> к поездкам</span></div>` : ''}
      </div>
    `;
  }

  // 2. Тултип Менталки (#tooltip-mental)
  const elMental = document.getElementById('tooltip-mental');
  if (elMental) {
    elMental.innerHTML = `
      <div class="resource-tooltip-header">
        <span class="text-purple-700 font-extrabold">🧠 Менталка: ${data.mental.current}%</span>
        <span class="resource-tooltip-badge ${data.mental.netDailyChange >= 0 ? 'bg-emerald-50 text-emerald-800 border border-emerald-300' : 'bg-rose-50 text-rose-800 border border-rose-300'}">
          Сутки: ${data.mental.netDailyChange >= 0 ? `+${data.mental.netDailyChange}` : data.mental.netDailyChange}%/д
        </span>
      </div>
      <div>
        <div class="resource-tooltip-title text-emerald-700">🟢 Как восполнять:</div>
        <div class="resource-tooltip-item"><span class="bullet text-emerald-600">+</span><span>Семья: <b>${data.mental.familyBonus >= 0 ? `+${data.mental.familyBonus}` : data.mental.familyBonus}%/д</b> (${data.mental.familyLabel})</span></div>
        <div class="resource-tooltip-item"><span class="bullet text-emerald-600">+</span><span>Отдых: чай с котом (+8%), фотосессии (+5%)</span></div>
        <div class="resource-tooltip-item"><span class="bullet text-emerald-600">+</span><span>Успехи: лоток (+10%), выздоровление (+15%), пристройство (+25%)</span></div>
        <div class="resource-tooltip-item"><span class="bullet text-emerald-600">+</span><span>Передержка: переезд снимает бытовой стресс дома</span></div>
      </div>
      <div class="resource-tooltip-section">
        <div class="resource-tooltip-title text-rose-700">🔴 От чего падает:</div>
        ${data.mental.litterDrain > 0 ? `<div class="resource-tooltip-item"><span class="bullet text-rose-600">-</span><span>Лужи и промахи лотка: <b>-${data.mental.litterDrain}%/день</b></span></div>` : '<div class="resource-tooltip-item"><span class="bullet text-emerald-600">✓</span><span>Питомец приучен к лотку (стресса нет)</span></div>'}
        ${data.mental.housingDrain > 0 ? `<div class="resource-tooltip-item"><span class="bullet text-rose-600">-</span><span>Давление жилья: <b>-${data.mental.housingDrain}%/день</b> (${data.mental.housingLabel})</span></div>` : '<div class="resource-tooltip-item"><span class="bullet text-emerald-600">✓</span><span>Свое жилье: претензий хозяев нет</span></div>'}
        <div class="resource-tooltip-item"><span class="bullet text-rose-600">-</span><span>Кризисы: возврат с испытательного, долги, ЧП</span></div>
      </div>
    `;
  }

  // 3. Тултип Энергии (#energy-tooltip)
  const elEnergy = document.getElementById('energy-tooltip');
  if (elEnergy) {
    elEnergy.innerHTML = `
      <div class="resource-tooltip-header">
        <span class="text-amber-700 font-extrabold">⚡ Энергия: ${data.energy.free}⚡ / ${data.energy.locked}🔒</span>
        <span class="resource-tooltip-badge bg-amber-50 text-amber-900 border border-amber-300">
          Сон: +${data.energy.morningBonus}⚡/д
        </span>
      </div>
      <div>
        <div class="resource-tooltip-title text-emerald-700">🟢 Как восстанавливается:</div>
        <div class="resource-tooltip-item"><span class="bullet text-emerald-600">+</span><span>Сон в начале дня: базовое от семьи <b>+${data.energy.morningBonus}⚡/д</b></span></div>
        <div class="resource-tooltip-item"><span class="bullet text-emerald-600">+</span><span>Передержка/стационар: быт дома = <b>0⚡</b></span></div>
      </div>
      <div class="resource-tooltip-section">
        <div class="resource-tooltip-title text-amber-800">🔒 Резерв быта дома: -${data.energy.locked}⚡/день</div>
        ${data.energy.householdItems.length > 0 
          ? data.energy.householdItems.map(item => `<div class="resource-tooltip-item"><span class="bullet text-amber-700">•</span><span>${item}</span></div>`).join('') 
          : '<div class="resource-tooltip-item"><span class="bullet text-emerald-600">✓</span><span>Бытовой резерв дома: 0⚡</span></div>'}
      </div>
      <div class="resource-tooltip-section">
        <div class="resource-tooltip-title text-slate-700">⚡ Расход на действия куратора:</div>
        <div class="resource-tooltip-item"><span class="bullet text-slate-600">-</span><span>Клиника: -5..20⚡ (зависит от авто/такси)</span></div>
        <div class="resource-tooltip-item"><span class="bullet text-slate-600">-</span><span>Посты и пиар: -5..10⚡</span></div>
        <div class="resource-tooltip-item"><span class="bullet text-slate-600">-</span><span>Выкорм слепышей: -15⚡ из соски</span></div>
      </div>
    `;
  }

  // 4. Тултип Здоровья (#tooltip-health)
  const elHealth = document.getElementById('tooltip-health');
  if (elHealth) {
    elHealth.innerHTML = `
      <div class="resource-tooltip-header">
        <span class="text-rose-700 font-extrabold">❤️ Здоровье питомца: ${data.health.current}%</span>
        <span class="resource-tooltip-badge ${data.health.current > 70 ? 'bg-emerald-50 text-emerald-800 border border-emerald-300' : 'bg-rose-50 text-rose-800 border border-rose-300'}">
          ${data.health.inStationary ? `ОРИТ +${data.health.stationaryRecoveryRate}%/д` : (data.health.current > 70 ? 'Стабильно' : (data.health.current > 40 ? 'Средняя тяжесть' : 'Критическое'))}
        </span>
      </div>
      <div>
        <div class="resource-tooltip-title text-emerald-700">🟢 Как восстанавливать:</div>
        <div class="resource-tooltip-item"><span class="bullet text-emerald-600">+</span><span>Ветклиника: первичный осмотр, противошоковая терапия</span></div>
        <div class="resource-tooltip-item"><span class="bullet text-emerald-600">+</span><span>Стационар ОРИТ: капельницы и инфузоматы (+8..12%/сутки)</span></div>
        <div class="resource-tooltip-item"><span class="bullet text-emerald-600">+</span><span>Лечение дома: капли для глаз (2 ч), ЖКТ-протокол, антибиотики</span></div>
        <div class="resource-tooltip-item"><span class="bullet text-emerald-600">+</span><span>Питание: качественный корм, спецсмесь Babycat</span></div>
      </div>
      <div class="resource-tooltip-section">
        <div class="resource-tooltip-title text-rose-700">🔴 Опасности и риски:</div>
        <div class="resource-tooltip-item"><span class="bullet text-rose-600">⚠️</span><span>${data.health.isStarving ? '<b class="text-rose-700">ГОЛОД! Корм закончился (урон здоровью)!</b>' : `Запас корма: ${data.health.foodDaysLeft} дн. (при 0 дн. — голодание)`}</span></div>
        <div class="resource-tooltip-item"><span class="bullet text-rose-600">-</span><span>Клещи весной/осенью: смертельный пироплазмоз без капель</span></div>
        <div class="resource-tooltip-item"><span class="bullet text-rose-600">-</span><span>Побег на улицу (зимой урон от мороза x2)</span></div>
        <div class="resource-tooltip-item"><span class="bullet text-rose-600">-</span><span>Коровье молоко: диарея и гибель подсосных котят</span></div>
      </div>
    `;
  }

  // 5. Тултип Лимита карты (#tooltip-card-limit)
  const elCard = document.getElementById('tooltip-card-limit');
  if (elCard) {
    elCard.innerHTML = `
      <div class="resource-tooltip-header">
        <span class="text-emerald-700 font-extrabold">💳 Сбор на карту физлица</span>
        <span class="resource-tooltip-badge bg-emerald-50 text-emerald-800 border border-emerald-300">
          ${data.cardLimit.raised} / 6500 BYN
        </span>
      </div>
      <div>
        <div class="resource-tooltip-title text-slate-700">ℹ️ Закон РБ о дарении (ст. 208 НК РБ):</div>
        <div class="resource-tooltip-item"><span class="bullet text-slate-600">•</span><span>Безналоговый лимит на личную карту: <b>6500 BYN в год</b>.</span></div>
        <div class="resource-tooltip-item"><span class="bullet text-slate-600">•</span><span>Остаток лимита в этом году: <b>${data.cardLimit.remaining} BYN</b> (${data.cardLimit.percent}% исчерпано).</span></div>
        <div class="resource-tooltip-item"><span class="bullet text-slate-600">•</span><span>Посты со сбором запускаются во вкладке 3 («Быт и Пиар»).</span></div>
        <div class="resource-tooltip-item"><span class="bullet text-slate-600">•</span><span>Множитель соцкапитала: <b>${data.cardLimit.socialMultiplier}x</b> (${data.cardLimit.socialLabel}).</span></div>
        <div class="resource-tooltip-item"><span class="bullet text-amber-700">⚠️</span><span>При исчерпании лимита сборы переводятся на счета «Зоошанса».</span></div>
      </div>
    `;
  }

  // 6. Тултип Талона Зоошанса (#tooltip-voucher)
  const elVoucher = document.getElementById('tooltip-voucher');
  if (elVoucher) {
    elVoucher.innerHTML = `
      <div class="resource-tooltip-header">
        <span class="text-amber-800 font-extrabold">🏥 Талон «Зоошанса»</span>
        <span class="resource-tooltip-badge bg-amber-50 text-amber-900 border border-amber-300">
          Долг: ${data.voucher.debt} / 1000 BYN
        </span>
      </div>
      <div>
        <div class="resource-tooltip-title text-slate-700">ℹ️ Программа поддержки кураторов:</div>
        <div class="resource-tooltip-item"><span class="bullet text-emerald-600">✓</span><span><b>Скидка 20%</b> на базовые услуги в клинике-партнере («Клиника А»).</span></div>
        <div class="resource-tooltip-item"><span class="bullet text-slate-600">•</span><span>Лимит лечения в долг: <b>до 1000 BYN</b> на срок до <b>30 дней</b>.</span></div>
        <div class="resource-tooltip-item"><span class="bullet text-slate-600">•</span><span>Оставшийся срок действия: <b>${data.voucher.daysLeft} дн.</b></span></div>
        <div class="resource-tooltip-item"><span class="bullet text-slate-600">•</span><span>Активируется регистрацией заявления во вкладке 2 («Зоошанс»).</span></div>
        <div class="resource-tooltip-item"><span class="bullet text-rose-600">⚠️</span><span>Долг необходимо погасить до истечения 30 дней.</span></div>
      </div>
    `;
  }

  // 7. Тултип Снабжения (#tooltip-supply)
  const elSupply = document.getElementById('tooltip-supply');
  if (elSupply) {
    elSupply.innerHTML = `
      <div class="resource-tooltip-header">
        <span class="text-sky-800 font-extrabold">🛒 Снабжение и передержка</span>
        <span class="resource-tooltip-badge bg-sky-50 text-sky-800 border border-sky-300">
          Корм: ${data.supply.foodDaysLeft} дн.
        </span>
      </div>
      <div>
        <div class="resource-tooltip-title text-slate-700">ℹ️ Правила снабжения:</div>
        <div class="resource-tooltip-item"><span class="bullet text-slate-600">•</span><span>1 пачка корма рассчитана ровно на <b>14 дней</b> ухода.</span></div>
        <div class="resource-tooltip-item"><span class="bullet text-slate-600">•</span><span>Покупка корма: <b>65 BYN</b> (кот) / <b>120 BYN</b> (собака) во вкладке 3.</span></div>
        ${data.supply.isNewborn ? `<div class="resource-tooltip-item"><span class="bullet text-amber-600">🍼</span><span>Запас спецсмеси Babycat: <b>${data.supply.milkDaysLeft} дн.</b> (105 BYN/банка)</span></div>` : ''}
        <div class="resource-tooltip-item"><span class="bullet text-slate-600">•</span><span>${data.supply.isPaidFoster ? `Платная передержка: <b>${data.supply.dailyCost} BYN/сутки</b> (быт дома = 0⚡).` : 'Питомец дома: требует ежедневного расхода энергии на уход.'}</span></div>
        <div class="resource-tooltip-item"><span class="bullet text-rose-600">⚠️</span><span>При 0 дней корма питомец голодает и ежедневно теряет здоровье!</span></div>
      </div>
    `;
  }
}

function toggleResourceTooltip(tooltipId) {
  if (typeof document === 'undefined') return;
  const target = document.getElementById(tooltipId);
  if (!target) return;
  const isShown = target.classList.contains('show');
  closeAllResourceTooltips();
  if (!isShown) {
    target.classList.add('show');
  }
}

function closeAllResourceTooltips() {
  if (typeof document === 'undefined') return;
  const list = document.querySelectorAll('.resource-tooltip.show');
  if (list && list.forEach) {
    list.forEach(el => el.classList.remove('show'));
  }
}

function toggleEnergyTooltip() {
  toggleResourceTooltip('energy-tooltip');
}

function setupResourceTooltipsEvents() {
  if (typeof window !== 'undefined' && window._resourceTooltipsEventsInitialized) return;
  if (typeof window !== 'undefined') window._resourceTooltipsEventsInitialized = true;

  if (typeof document === 'undefined') return;

  // Автозакрытие при клике вне виджета
  document.addEventListener('click', (e) => {
    if (!e.target.closest || !e.target.closest('.resource-widget')) {
      closeAllResourceTooltips();
    }
  });

  // Автозакрытие по нажатию Escape
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      closeAllResourceTooltips();
    }
  });
}

window.getResourceTooltipData = getResourceTooltipData;
window.updateResourceTooltips = updateResourceTooltips;
window.toggleResourceTooltip = toggleResourceTooltip;
window.closeAllResourceTooltips = closeAllResourceTooltips;
window.toggleEnergyTooltip = toggleEnergyTooltip;
window.setupResourceTooltipsEvents = setupResourceTooltipsEvents;

// 7. МОДАЛЬНОЕ ОКНО ПОДСКАЗКИ НАСТАВНИКА (#mentorModal) И ОЧЕРЕДЬ
let isMentorModalOpen = false;
let currentMentorCallback = null;
const mentorHintQueue = [];

function triggerMentorHint(hintId, onDismissCallback, forceShow = false) {
  if (!forceShow) {
    if (typeof isMentorHintUnlocked === 'function' && isMentorHintUnlocked(hintId)) {
      if (typeof onDismissCallback === 'function') {
        try { onDismissCallback(); } catch (e) { console.error(e); }
      }
      return false;
    }
    if (window.state && window.state.shownHints && window.state.shownHints[hintId]) {
      if (typeof onDismissCallback === 'function') {
        try { onDismissCallback(); } catch (e) { console.error(e); }
      }
      return false;
    }
  }

  const hints = (window.GAME_DATA && window.GAME_DATA.mentorHints) ? window.GAME_DATA.mentorHints : null;
  const hintData = hints ? hints[hintId] : null;
  if (!hintData) {
    console.warn(`Mentor hint ${hintId} not found in GAME_DATA.mentorHints`);
    return false;
  }

  // Record shownHint cooldown in state and mentor history
  if (window.state) {
    if (!window.state.shownHints) window.state.shownHints = {};
    window.state.shownHints[hintId] = window.state.day || 1;
    if (!Array.isArray(window.state.mentorHistory)) window.state.mentorHistory = [];
    if (!window.state.mentorHistory.includes(hintId)) window.state.mentorHistory.push(hintId);
  }

  // Timer Guard (Rule 6.4 from AGENTS.md)
  if (typeof stopTimer === 'function') {
    stopTimer();
  }

  // Unlock hint in state / meta-progress
  if (typeof unlockMentorHint === 'function') {
    unlockMentorHint(hintId);
  }
  if (typeof updateHeaderMentorCounter === 'function') {
    updateHeaderMentorCounter();
  }

  const modal = typeof document !== 'undefined' ? document.getElementById('mentorModal') : null;
  const isModalActive = isMentorModalOpen || (modal && typeof modal.classList?.contains === 'function' && !modal.classList.contains('hidden'));

  // If a mentor modal is already open, push to FIFO queue
  if (isModalActive) {
    mentorHintQueue.push({ hintId, onDismissCallback });
    return true;
  }

  isMentorModalOpen = true;
  currentMentorCallback = (typeof onDismissCallback === 'function') ? onDismissCallback : null;

  const isAdvice = (hintData.type === 'advice');

  // Populate content & styling
  const catElem = document.getElementById('mentorModalCategory');
  if (catElem) catElem.textContent = hintData.category || (isAdvice ? 'Совет' : 'Разбор полетов');

  const badgeElem = document.getElementById('mentorModalBadge');
  if (badgeElem) {
    badgeElem.textContent = isAdvice ? '💡 Совет координатора' : '⚠️ Разбор полетов';
    badgeElem.className = isAdvice
      ? 'craft-badge text-[10px] font-mono uppercase font-bold px-2 py-0.5 rounded-full bg-emerald-600 text-white'
      : 'craft-badge text-[10px] font-mono uppercase font-bold px-2 py-0.5 rounded-full bg-rose-600 text-white';
  }

  const titleElem = document.getElementById('mentorModalTitle');
  if (titleElem) titleElem.textContent = hintData.title || '';

  const speakerElem = document.getElementById('mentorModalSpeaker');
  if (speakerElem) speakerElem.textContent = hintData.speaker || (isAdvice ? 'Опытный координатор' : 'Разбор полетов');

  const speakerIcon = document.getElementById('mentorModalSpeakerIcon');
  if (speakerIcon) speakerIcon.textContent = isAdvice ? '👤' : '🔍';

  const msgElem = document.getElementById('mentorModalMessage');
  if (msgElem) msgElem.textContent = hintData.message || '';

  const ruleElem = document.getElementById('mentorModalRule');
  if (ruleElem) ruleElem.textContent = hintData.rule || '';

  const ruleBox = document.getElementById('mentorModalRuleBox');
  if (ruleBox) {
    ruleBox.className = isAdvice
      ? 'p-3 sm:p-3.5 rounded-xl text-xs leading-relaxed mb-4 bg-emerald-50 text-emerald-950 border border-emerald-200 transition-colors'
      : 'p-3 sm:p-3.5 rounded-xl text-xs leading-relaxed mb-4 bg-amber-50 text-amber-950 border border-amber-300 transition-colors';
  }

  const cardElem = document.getElementById('mentorModalCard');
  if (cardElem) {
    cardElem.className = isAdvice
      ? 'modal-card-custom max-w-lg w-full p-4 sm:p-6 my-auto flex flex-col border-2 border-emerald-500/60 shadow-xl transition-all'
      : 'modal-card-custom max-w-lg w-full p-4 sm:p-6 my-auto flex flex-col border-2 border-rose-500/80 shadow-xl transition-all';
  }

  const btnElem = document.getElementById('btnMentorDismiss');
  if (btnElem) {
    btnElem.className = isAdvice
      ? 'w-full sm:w-auto px-5 py-2.5 rounded-xl font-bold text-xs transition shadow-sm cursor-pointer bg-emerald-600 hover:bg-emerald-500 text-white'
      : 'w-full sm:w-auto px-5 py-2.5 rounded-xl font-bold text-xs transition shadow-sm cursor-pointer bg-rose-600 hover:bg-rose-500 text-white';
  }

  if (modal) {
    modal.classList.remove('hidden');
  }

  return true;
}

function closeMentorModal() {
  const modal = typeof document !== 'undefined' ? document.getElementById('mentorModal') : null;
  if (modal) {
    modal.classList.add('hidden');
  }
  isMentorModalOpen = false;

  const cb = currentMentorCallback;
  currentMentorCallback = null;
  if (typeof cb === 'function') {
    try {
      cb();
    } catch (e) {
      console.error('Error executing mentor dismiss callback:', e);
    }
  }

  if (mentorHintQueue.length > 0) {
    const next = mentorHintQueue.shift();
    triggerMentorHint(next.hintId, next.onDismissCallback, true);
  }

  if (typeof updateHeaderMentorCounter === 'function') {
    updateHeaderMentorCounter();
  }
}

window.mentorHintQueue = mentorHintQueue;
window.triggerMentorHint = triggerMentorHint;
window.closeMentorModal = closeMentorModal;

// 8. Памятка куратора: архив подсказок наставника (#mentorArchiveModal)
function updateHeaderMentorCounter() {
  const counterEl = typeof document !== 'undefined' ? document.getElementById('headerMentorCount') : null;
  if (!counterEl) return;
  const hints = (window.GAME_DATA && window.GAME_DATA.mentorHints) ? window.GAME_DATA.mentorHints : {};
  const totalCount = Object.keys(hints).length || 8;
  const unlocked = typeof getUnlockedMentorHints === 'function' ? getUnlockedMentorHints() : [];
  counterEl.textContent = `${unlocked.length}/${totalCount}`;
}

function openMentorArchiveModal() {
  if (typeof stopTimer === 'function') {
    stopTimer();
  }
  window.isMentorArchiveOpen = true;
  renderMentorArchive();
  const modal = typeof document !== 'undefined' ? document.getElementById('mentorArchiveModal') : null;
  if (modal) {
    modal.classList.remove('hidden');
  }
}

function closeMentorArchiveModal() {
  window.isMentorArchiveOpen = false;
  const modal = typeof document !== 'undefined' ? document.getElementById('mentorArchiveModal') : null;
  if (modal) {
    modal.classList.add('hidden');
  }
}

function renderMentorArchive() {
  updateHeaderMentorCounter();

  const listEl = typeof document !== 'undefined' ? document.getElementById('mentorArchiveList') : null;
  if (!listEl) return;

  const hintsObj = (window.GAME_DATA && window.GAME_DATA.mentorHints) ? window.GAME_DATA.mentorHints : {};
  const unlocked = typeof getUnlockedMentorHints === 'function' ? getUnlockedMentorHints() : [];
  const hintKeys = Object.keys(hintsObj);

  if (hintKeys.length === 0) {
    listEl.innerHTML = '<div class="text-xs text-[var(--text-secondary)] text-center py-4">Нет доступных памяток.</div>';
    return;
  }

  listEl.innerHTML = hintKeys.map(key => {
    const hint = hintsObj[key];
    const isUnlocked = unlocked.includes(key);
    const isAdvice = hint.type === 'advice';

    if (isUnlocked) {
      const typeBadgeCls = isAdvice ? 'bg-emerald-600 text-white' : 'bg-rose-600 text-white';
      const typeBadgeText = isAdvice ? '💡 Совет координатора' : '⚠️ Разбор полетов';
      const borderCls = isAdvice ? 'border-2 border-emerald-500/60 bg-[var(--bg-card)]' : 'border-2 border-rose-500/60 bg-[var(--bg-card)]';
      const ruleBoxCls = isAdvice 
        ? 'p-3 rounded-lg text-xs leading-relaxed bg-emerald-50 text-emerald-950 border border-emerald-200' 
        : 'p-3 rounded-lg text-xs leading-relaxed bg-amber-50 text-amber-950 border border-amber-300';
      const speakerIcon = isAdvice ? '👤' : '🔍';

      return `
        <div class="rounded-xl p-4 shadow-sm ${borderCls}">
          <div class="flex items-center justify-between gap-2 mb-2 flex-wrap">
            <span class="text-[10px] font-mono uppercase tracking-wider text-[var(--text-secondary)] font-bold">
              ${hint.category || (isAdvice ? 'Совет' : 'Разбор ошибки')}
            </span>
            <span class="craft-badge text-[10px] font-mono uppercase font-bold px-2 py-0.5 rounded-full ${typeBadgeCls}">
              ${typeBadgeText}
            </span>
          </div>

          <h3 class="text-sm font-extrabold text-[var(--text-primary)] mb-1 leading-snug">
            ${hint.title || ''}
          </h3>

          <div class="flex items-center gap-1.5 text-xs text-[var(--text-secondary)] mb-2 font-medium">
            <span>${speakerIcon}</span>
            <span>${hint.speaker || (isAdvice ? 'Опытный координатор' : 'Разбор полетов')}</span>
          </div>

          <p class="text-xs text-[var(--text-secondary)] leading-relaxed mb-3">
            ${hint.message || ''}
          </p>

          <div class="${ruleBoxCls}">
            <div class="font-bold flex items-center gap-1 mb-1 text-[11px] font-mono uppercase">
              <span>💡 Золотое правило:</span>
            </div>
            <p class="font-medium">
              ${hint.rule || ''}
            </p>
          </div>
        </div>
      `;
    } else {
      return `
        <div class="rounded-xl p-4 border-2 border-dashed border-[var(--border-subtle)] bg-[var(--bg-muted)]/40 opacity-60">
          <div class="flex items-center justify-between gap-2 mb-1.5 flex-wrap">
            <span class="text-[10px] font-mono uppercase tracking-wider text-[var(--text-secondary)] font-bold">
              ${hint.category || 'Памятка куратора'}
            </span>
            <span class="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-[var(--bg-muted)] text-[var(--text-secondary)] border border-[var(--border-subtle)]">
              🔒 Закрыто
            </span>
          </div>
          <h3 class="text-xs sm:text-sm font-bold text-[var(--text-secondary)] mb-1 flex items-center gap-1.5">
            <span>🔒</span> <span>Карточка еще не открыта</span>
          </h3>
          <p class="text-[11px] text-[var(--text-secondary)] italic">
            Сработает автоматически в игре при возникновении ситуации
          </p>
        </div>
      `;
    }
  }).join('');
}

function confirmResetMentorProgress() {
  const confirmed = typeof confirm === 'function' ? confirm('Вы уверены, что хотите сбросить прогресс обучения? Все открытые карточки снова станут закрытыми.') : true;
  if (confirmed) {
    if (typeof resetMentorProgress === 'function') {
      resetMentorProgress();
    }
    if (typeof addLog === 'function') {
      addLog('Прогресс обучения сброшен.', 'info');
    }
    renderMentorArchive();
    updateHeaderMentorCounter();
  }
}

window.updateHeaderMentorCounter = updateHeaderMentorCounter;
window.openMentorArchiveModal = openMentorArchiveModal;
window.closeMentorArchiveModal = closeMentorArchiveModal;
window.renderMentorArchive = renderMentorArchive;
window.confirmResetMentorProgress = confirmResetMentorProgress;
