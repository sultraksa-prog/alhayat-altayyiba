document.addEventListener('DOMContentLoaded', () => {

// ==================== إعدادات الأذكار ====================
  const SETTINGS_KEY = 'hayat_dhikr_settings';
  const DEFAULT_SETTINGS = {
    displayMode: 'vertical',
    fontSize: 21,
    fontFamily: "'Amiri', serif",
    vibrateOnZero: true,
    vibrateOnClick: false,
    hideOnZero: true,
    tapAnywhere: true,
    confirmExit: true
  };

  let dhikrSettings = JSON.parse(localStorage.getItem(SETTINGS_KEY)) || DEFAULT_SETTINGS;

  function saveSettings() {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(dhikrSettings));
  }
  
  // ==================== 1. نظام عزل المعرفات وحفظ البيانات ====================
  const SAVED_VERSION_KEY = 'hayat_azkar_version';
  const currentVersion = localStorage.getItem(SAVED_VERSION_KEY);

  let azkarState = [];
  if (currentVersion !== AZKAR_DATA_VERSION) {
    const oldData = JSON.parse(localStorage.getItem('hayat_azkar_data') || '[]');
    // استخراج أذكار ومجموعات المستخدم الخاصة فقط (المعزولة ببادئة user_)
    const customUserGroups = oldData.filter(g => g.id.startsWith('user_cat_'));
    
    // دمج أذكار النظام الأصلية مع الحفاظ على أذكار المستخدم
    azkarState = [...DEFAULT_AZKAR_DATA, ...customUserGroups];
    localStorage.setItem('hayat_azkar_data', JSON.stringify(azkarState));
    localStorage.setItem(SAVED_VERSION_KEY, AZKAR_DATA_VERSION);
  } else {
    azkarState = JSON.parse(localStorage.getItem('hayat_azkar_data')) || DEFAULT_AZKAR_DATA;
  }

  function saveAzkarState() {
    localStorage.setItem('hayat_azkar_data', JSON.stringify(azkarState));
  }

  // ==================== 2. نظام المفضلة (مع الخمسة الافتراضية) ====================
  const DEFAULT_FAV_NAMES = [
    'أذكار الصباح',
    'أذكار المساء',
    'تسابيح وأجور عظيمة',
    'أذكار وأدعية الصلاة',
    'أذكار النوم'
  ];

  // جلب معرفات المفضلة الافتراضية
  function getInitialFavIds() {
    const initialIds = [];
    DEFAULT_FAV_NAMES.forEach(name => {
      const found = azkarState.find(c => c.name.includes(name));
      if (found) initialIds.push(found.id);
    });
    return initialIds;
  }

  let favoritesIds = JSON.parse(localStorage.getItem('hayat_fav_categories'));
  if (!favoritesIds || favoritesIds.length === 0) {
    favoritesIds = getInitialFavIds();
    localStorage.setItem('hayat_fav_categories', JSON.stringify(favoritesIds));
  }

  function saveFavorites() {
    localStorage.setItem('hayat_fav_categories', JSON.stringify(favoritesIds));
  }

  // ==================== 3. نظام التنقل بين الشاشات ====================
  const screenHome = document.getElementById('screen-home');

  const screenQibla = document.getElementById('screen-qibla');
  const tabQibla = document.getElementById('tabQibla');
  const backToHomeFromQiblaBtn = document.getElementById('backToHomeFromQiblaBtn');
  
  const screenAzkarCategories = document.getElementById('screen-azkar-categories');
  const screenAzkarFavorites = document.getElementById('screen-azkar-favorites');
  const screenAzkarReader = document.getElementById('screen-azkar-reader');

  const screenGeneralSettings = document.getElementById('screen-general-settings');
  const screenAboutApp = document.getElementById('screen-about-app');
  const tabGeneralSettings = document.getElementById('tabGeneralSettings');
  const openGeneralSettingsBtn = document.getElementById('openGeneralSettingsBtn');
  const backToHomeFromSettingsBtn = document.getElementById('backToHomeFromSettingsBtn');
  const backToSettingsFromAboutBtn = document.getElementById('backToSettingsFromAboutBtn');
  const openDhikrSettingsFromMenu = document.getElementById('openDhikrSettingsFromMenu');
  const openAboutScreenBtn = document.getElementById('openAboutScreenBtn');

  const tabHome = document.getElementById('tabHome');
  const tabAzkar = document.getElementById('tabAzkar');
  const openAzkarTileBtn = document.getElementById('openAzkarTileBtn');
  const openFavoritesBtn = document.getElementById('openFavoritesBtn');
  const openFavTileBtn = document.getElementById('openFavTileBtn');
  const backToHomeBtn = document.getElementById('backToHomeBtn');
  const backToCategoriesBtn = document.getElementById('backToCategoriesBtn');
  const backToCategoriesFromFavBtn = document.getElementById('backToCategoriesFromFavBtn');

  // ==================== نظام التنقل المتوافق مع سحب حافة الجوال (History API) ====================
  // تسجيل الشاشة الرئيسية كنقطة بداية
  if (!history.state) {
    history.replaceState({ screenId: 'screen-home' }, '');
  }

  function showScreen(screen, pushToHistory = true) {
    const activeScreen = document.querySelector('.screen-view.active');
    
    // تسجيل الشاشة في سجل الجوال عند الانتقال للأمام
    if (pushToHistory && activeScreen && activeScreen !== screen) {
      history.pushState({ screenId: screen.id }, '');
    }

    document.querySelectorAll('.screen-view').forEach(s => s.classList.remove('active'));
    screen.classList.add('active');
    window.scrollTo(0, 0);

    document.querySelectorAll('.bottom-nav .nav-item').forEach(i => i.classList.remove('active'));
  if (screen === screenHome) {
    tabHome.classList.add('active');
  } else if (screen === screenAzkarCategories || screen === screenAzkarFavorites || screen === screenAzkarReader) {
    tabAzkar.classList.add('active');
  } else if (screen === screenGeneralSettings || screen === screenAboutApp) {
    if (tabGeneralSettings) tabGeneralSettings.classList.add('active');
  } else if (screen === screenQibla) {
    if (tabQibla) tabQibla.classList.add('active');
  }

  // التقاط إيماءة السحب من حافة الشاشة (أو زر رجوع النظام في الأندرويد والآيفون)
  window.addEventListener('popstate', () => {
    const activeScreen = document.querySelector('.screen-view.active');

    // 1. إذا كانت هناك نافذة منبثقة أو شاشة إعدادات مفتوحة، السحب يغلقها أولاً دون مغادرة الشاشة
    const openModal = document.querySelector('.custom-modal-backdrop.show, .bottom-sheet-backdrop.show');
    if (openModal) {
      openModal.classList.remove('show');
      // الحفاظ على تاريخ الشاشة حتى لا يستهلك السحب خطوة الشاشة
      history.pushState({ screenId: activeScreen ? activeScreen.id : 'screen-home' }, '');
      return;
    }

    // 2. إذا كان المستخدم في الشاشة الرئيسية، اتركه يخرج بشكل طبيعي
    if (!activeScreen || activeScreen === screenHome) {
      return;
    }

    // 3. إذا كان المستخدم في شاشة قراءة الأذكار
    if (activeScreen === screenAzkarReader) {
      const category = azkarState.find(c => c.id === currentActiveCategoryId);
      if (category && category.items && category.items.length > 0) {
        const isAllDone = category.items.every(it => it.currentCount === 0);
        // إذا لم يكمل وخيار تأكيد الخروج مفعل
        if (!isAllDone && dhikrSettings.confirmExit) {
          history.pushState({ screenId: 'screen-azkar-reader' }, '');
          document.getElementById('exitConfirmModal').classList.add('show');
          return;
        }
      }
      showScreen(screenAzkarCategories, false);
      renderAzkarCategories();
      return;
    }

    // 4. إذا كان في شاشة المفضلة، السحب يعيده إلى شاشة مجموعات الأذكار
    if (activeScreen === screenAzkarFavorites) {
      showScreen(screenAzkarCategories, false);
      renderAzkarCategories();
      return;
    }

    // 5. إذا كان في شاشة مجموعات الأذكار، السحب يعيده إلى الشاشة الرئيسية
    if (activeScreen === screenAzkarCategories) {
      showScreen(screenHome, false);
      return;
    }

    // افتراضياً
    showScreen(screenHome, false);
  });

  tabHome.addEventListener('click', (e) => { e.preventDefault(); showScreen(screenHome); });
  
  // فتح شاشة الإعدادات العامة من الهيدر العلوي ومن التبويب السفلي
if (openGeneralSettingsBtn) openGeneralSettingsBtn.addEventListener('click', () => showScreen(screenGeneralSettings));
if (tabGeneralSettings) tabGeneralSettings.addEventListener('click', (e) => { e.preventDefault(); showScreen(screenGeneralSettings); });
if (backToHomeFromSettingsBtn) backToHomeFromSettingsBtn.addEventListener('click', () => showScreen(screenHome));

// فتح إعدادات الأذكار من داخل الإعدادات العامة
if (openDhikrSettingsFromMenu) {
  openDhikrSettingsFromMenu.addEventListener('click', () => {
    syncSettingsUI();
    azkarSettingsModal.classList.add('show');
  });
}

// فتح شاشة حول التطبيق
if (openAboutScreenBtn) openAboutScreenBtn.addEventListener('click', () => showScreen(screenAboutApp));
if (backToSettingsFromAboutBtn) backToSettingsFromAboutBtn.addEventListener('click', () => showScreen(screenGeneralSettings));
  
  tabAzkar.addEventListener('click', (e) => { e.preventDefault(); showScreen(screenAzkarCategories); renderAzkarCategories(); });
  if (tabQibla) {
    tabQibla.addEventListener('click', (e) => {
      e.preventDefault();
      showScreen(screenQibla);
      initQiblaCompass();
    });
  }
  if (backToHomeFromQiblaBtn) {
    backToHomeFromQiblaBtn.addEventListener('click', () => {
      stopQiblaCompass();
      showScreen(screenHome);
    });
  }
  openAzkarTileBtn.addEventListener('click', () => { showScreen(screenAzkarCategories); renderAzkarCategories(); });
  openFavoritesBtn.addEventListener('click', () => { showScreen(screenAzkarFavorites); renderFavorites(); });
  if (openFavTileBtn) {
  openFavTileBtn.addEventListener('click', () => { showScreen(screenAzkarFavorites); renderFavorites(); });
}
  backToHomeBtn.addEventListener('click', () => showScreen(screenHome));
  backToCategoriesBtn.addEventListener('click', () => {
  const category = azkarState.find(c => c.id === currentActiveCategoryId);
  if (category && category.items && category.items.length > 0) {
    const isAllDone = category.items.every(it => it.currentCount === 0);
    // إذا لم يكمل الأذكار بعد، نظهر له نافذة تأكيد الخروج
    // إذا لم يكمل القراءة وخيار تأكيد الخروج مفعل
    if (!isAllDone && dhikrSettings.confirmExit) {
      document.getElementById('exitConfirmModal').classList.add('show');
      return;
    }
  }
  // إذا كانت مكتملة بالفعل، يرجع مباشرة دون إزعاج
  showScreen(screenAzkarCategories);
  renderAzkarCategories();
});
  backToCategoriesFromFavBtn.addEventListener('click', () => { showScreen(screenAzkarCategories); renderAzkarCategories(); });

  // ==================== 4. بناء شبكة مجموعات الأذكار ====================
  const azkarGroupsContainer = document.getElementById('azkarGroupsContainer');
  let currentActiveCategoryId = null;

  function renderAzkarCategories(filterQuery = '') {
  azkarGroupsContainer.innerHTML = '';
  const query = filterQuery.trim().toLowerCase();

  const filteredGroups = azkarState.filter(group => {
    if (!query) return true;
    return group.name.toLowerCase().includes(query);
  });

  if (filteredGroups.length === 0) {
    azkarGroupsContainer.innerHTML = `
      <div style="grid-column: span 2; text-align: center; padding: 40px 20px; color: var(--text-muted);">
        <p style="font-size: 15px;">لا توجد أذكار تطابق: "${filterQuery}"</p>
      </div>
    `;
    return;
  }

  filteredGroups.forEach(group => {
    const card = createCategoryCard(group);
    azkarGroupsContainer.appendChild(card);
  });
}

// أحداث فتح وإغلاق والبحث المباشر
const toggleCategorySearchBtn = document.getElementById('toggleCategorySearchBtn');
const categorySearchBar = document.getElementById('categorySearchBar');
const categorySearchInput = document.getElementById('categorySearchInput');
const clearCategorySearchBtn = document.getElementById('clearCategorySearchBtn');

if (toggleCategorySearchBtn) {
  toggleCategorySearchBtn.addEventListener('click', () => {
    categorySearchBar.classList.toggle('active');
    if (categorySearchBar.classList.contains('active')) {
      categorySearchInput.focus();
    } else {
      categorySearchInput.value = '';
      renderAzkarCategories('');
    }
  });
}

if (categorySearchInput) {
  categorySearchInput.addEventListener('input', (e) => {
    renderAzkarCategories(e.target.value);
  });
}

if (clearCategorySearchBtn) {
  clearCategorySearchBtn.addEventListener('click', () => {
    categorySearchInput.value = '';
    renderAzkarCategories('');
    categorySearchInput.focus();
  });
}

  // بطاقة المجموعة المشتركة
  function createCategoryCard(group) {
    const totalItems = group.items ? group.items.length : 0;
    let completedItems = 0;
    let readItemsCount = 0;

    if (totalItems > 0) {
      completedItems = group.items.filter(it => it.currentCount === 0).length;
      readItemsCount = group.items.filter(it => it.currentCount < it.count).length;
    }

    const progressPercent = totalItems === 0 ? 0 : Math.round((completedItems / totalItems) * 100);
    const isCompleted = totalItems > 0 && progressPercent === 100;
    const isStarted = readItemsCount > 0; // هل بدأ بقراءة جزء منها؟

    const card = document.createElement('div');
    card.className = `azkar-group-card ${isCompleted ? 'completed' : ''}`;
    card.innerHTML = `
      <div class="azkar-group-progress-fill" style="width: ${progressPercent}%;"></div>
      ${isCompleted ? '<div class="group-completed-badge">✓</div>' : ''}
      <span class="azkar-group-title">${group.name}</span>
    `;

    // نظام رصد النقر المطوّل (Long Press)
    let pressTimer = null;
    let isLongPress = false;
    let startX = 0;
    let startY = 0;

    const startPress = (e) => {
      isLongPress = false;
      if (e.type === 'touchstart') {
        startX = e.touches[0].clientX;
        startY = e.touches[0].clientY;
      }
      pressTimer = setTimeout(() => {
        isLongPress = true;
        if (navigator.vibrate) navigator.vibrate(45); // اهتزاز خفيف للتنبيه
        openGroupLongPressModal(group, isStarted);
      }, 550); // نصف ثانية للضغط المطول
    };

    const cancelPress = (e) => {
      if (e.type === 'touchmove') {
        // إذا كان المستخدم يمرر الصفحة بإصبعه يتم إلغاء النقر المطول فوراً
        const diffX = Math.abs(e.touches[0].clientX - startX);
        const diffY = Math.abs(e.touches[0].clientY - startY);
        if (diffX > 10 || diffY > 10) clearTimeout(pressTimer);
        return;
      }
      clearTimeout(pressTimer);
    };

    // أحداث اللمس للجوال
    card.addEventListener('touchstart', startPress, { passive: true });
    card.addEventListener('touchend', cancelPress);
    card.addEventListener('touchmove', cancelPress, { passive: true });

    // أحداث الفأرة للكمبيوتر
    card.addEventListener('mousedown', startPress);
    card.addEventListener('mouseup', cancelPress);
    card.addEventListener('mouseleave', cancelPress);

    // النقر العادي السريع
    card.addEventListener('click', (e) => {
      // إذا كان الحدث نقراً مطولاً نلغي النقر العادي
      if (isLongPress) {
        e.preventDefault();
        e.stopPropagation();
        isLongPress = false;
        return;
      }

      if (isCompleted) {
        targetCompletedCategoryId = group.id;
        document.getElementById('alreadyCompletedModal').classList.add('show');
      } else {
        openCategoryReader(group.id);
      }
    });

    return card;
  }

  // ==================== 5. بناء شاشة المفضلة والترتيب ====================
  const favoritesGroupsContainer = document.getElementById('favoritesGroupsContainer');
  const favMenuBtn = document.getElementById('favMenuBtn');
  const favDropdownMenu = document.getElementById('favDropdownMenu');
  const toggleFavReorderBtn = document.getElementById('toggleFavReorderBtn');
  let isFavReorderMode = false;

  favMenuBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    favDropdownMenu.classList.toggle('show');
  });
  document.addEventListener('click', () => favDropdownMenu.classList.remove('show'));

  toggleFavReorderBtn.addEventListener('click', () => {
    isFavReorderMode = !isFavReorderMode;
    renderFavorites();
  });

  function renderFavorites() {
    favoritesGroupsContainer.innerHTML = '';
    const favGroups = favoritesIds.map(id => azkarState.find(g => g.id === id)).filter(Boolean);

    if (favGroups.length === 0) {
      favoritesGroupsContainer.innerHTML = `
        <div style="grid-column: span 2; text-align: center; padding: 40px 20px; color: var(--text-muted);">
          <p>لا توجد أذكار مضافة للمفضلة حالياً.</p>
        </div>
      `;
      return;
    }

    favGroups.forEach((group, index) => {
      const cardWrap = document.createElement('div');
      cardWrap.style.position = 'relative';

      const card = createCategoryCard(group);
      cardWrap.appendChild(card);

      // أزرار الترتيب إذا كان وضع الترتيب مفعلاً
      if (isFavReorderMode) {
        const reorderBar = document.createElement('div');
        reorderBar.style.cssText = 'position: absolute; top: -6px; left: 4px; display: flex; gap: 4px; z-index: 10;';
        if (index > 0) {
          const upBtn = document.createElement('button');
          upBtn.className = 'reorder-btn';
          upBtn.textContent = '▲';
          upBtn.onclick = (e) => { e.stopPropagation(); moveFavorite(index, -1); };
          reorderBar.appendChild(upBtn);
        }
        if (index < favGroups.length - 1) {
          const downBtn = document.createElement('button');
          downBtn.className = 'reorder-btn';
          downBtn.textContent = '▼';
          downBtn.onclick = (e) => { e.stopPropagation(); moveFavorite(index, 1); };
          reorderBar.appendChild(downBtn);
        }
        cardWrap.appendChild(reorderBar);
      }

      favoritesGroupsContainer.appendChild(cardWrap);
    });
  }

  function moveFavorite(index, dir) {
    const target = index + dir;
    const temp = favoritesIds[index];
    favoritesIds[index] = favoritesIds[target];
    favoritesIds[target] = temp;
    saveFavorites();
    renderFavorites();
  }

  // نافذة البحث واختيار الأذكار للمفضلة
  const searchFavModal = document.getElementById('searchFavModal');
  const openSearchFavModalBtn = document.getElementById('openSearchFavModalBtn');
  const closeSearchFavBtn = document.getElementById('closeSearchFavBtn');
  const favSearchInput = document.getElementById('favSearchInput');
  const favSearchResultsList = document.getElementById('favSearchResultsList');

  openSearchFavModalBtn.addEventListener('click', () => {
    favSearchInput.value = '';
    renderSearchResults('');
    searchFavModal.classList.add('show');
  });

  closeSearchFavBtn.addEventListener('click', () => {
    searchFavModal.classList.remove('show');
    renderFavorites();
  });

  favSearchInput.addEventListener('input', (e) => {
    renderSearchResults(e.target.value.trim());
  });

  function renderSearchResults(query) {
    favSearchResultsList.innerHTML = '';
    const filtered = azkarState.filter(g => g.name.includes(query));

    filtered.forEach(g => {
      const isFav = favoritesIds.includes(g.id);
      const row = document.createElement('div');
      row.className = 'fav-search-item';
      row.innerHTML = `
        <span class="fav-search-item-title">${g.name}</span>
        <button class="fav-toggle-btn ${isFav ? 'active' : ''}">${isFav ? '★' : '☆'}</button>
      `;

      const btn = row.querySelector('.fav-toggle-btn');
      btn.addEventListener('click', () => {
        if (favoritesIds.includes(g.id)) {
          favoritesIds = favoritesIds.filter(id => id !== g.id);
          btn.classList.remove('active');
          btn.textContent = '☆';
        } else {
          favoritesIds.push(g.id);
          btn.classList.add('active');
          btn.textContent = '★';
        }
        saveFavorites();
      });

      favSearchResultsList.appendChild(row);
    });
  }

  // ==================== 6. قراءة وبطاقات الأذكار ====================
  const readerCategoryTitle = document.getElementById('readerCategoryTitle');
  const dhikrCardsContainer = document.getElementById('dhikrCardsContainer');
  let isEditMode = false;
  let isReorderMode = false;

  function openCategoryReader(categoryId, resetCounters = false) {
  currentActiveCategoryId = categoryId;
  const category = azkarState.find(c => c.id === categoryId);
  if (!category) return;

  // إذا طُلب التصفير، يتم تصفير العدادات وحفظها فوراً من داخل نطاق البيانات
  if (resetCounters && category.items) {
    category.items.forEach(it => {
      it.currentCount = it.count;
    });
    saveAzkarState();
    renderAzkarCategories();
  }

  readerCategoryTitle.textContent = category.name;
  isEditMode = false;
  isReorderMode = false;
  renderDhikrCards();
  showScreen(screenAzkarReader);
}
window.openCategoryReader = openCategoryReader;

  function renderDhikrCards() {
    dhikrCardsContainer.innerHTML = '';
    
    if (dhikrSettings.displayMode === 'horizontal') {
    dhikrCardsContainer.classList.add('horizontal-mode');
  } else {
    dhikrCardsContainer.classList.remove('horizontal-mode');
  }
    
    const category = azkarState.find(c => c.id === currentActiveCategoryId);
    if (!category || !category.items || category.items.length === 0) {
      dhikrCardsContainer.innerHTML = `
        <div style="text-align: center; padding: 40px 20px; color: var(--text-muted);">
          <p style="font-size: 16px;">لا توجد أذكار في هذا القسم حالياً.</p>
        </div>
      `;
      return;
    }

    category.items.forEach((item, index) => {
      const card = document.createElement('div');
      card.className = 'dhikr-card';
      const isDone = item.currentCount === 0;

      const hasLongNote = item.fullNote && item.fullNote.length > 70;
      const notePreview = hasLongNote ? item.fullNote.substring(0, 68) + '...' : (item.fullNote || '');

      card.innerHTML = `
        ${isReorderMode ? `
          <div class="dhikr-reorder-controls">
            ${index > 0 ? `<button class="reorder-btn" onclick="moveDhikr(${index}, -1)">▲ لأعلى</button>` : ''}
            ${index < category.items.length - 1 ? `<button class="reorder-btn" onclick="moveDhikr(${index}, 1)">▼ لأسفل</button>` : ''}
          </div>
        ` : ''}

        <div class="dhikr-card-body">
          <div class="dhikr-card-top-actions">
            <button class="dhikr-share-btn" title="مشاركة الذكر" onclick="shareSpecificDhikr('${item.id}')">
              <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/><polyline points="16 6 12 2 8 6"/><line x1="12" y1="2" x2="12" y2="15"/></svg>
            </button>
            ${isEditMode ? `
              <button class="dhikr-edit-btn" onclick="editSpecificDhikr('${item.id}')">
                <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="#1D5D9B" stroke-width="2"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>
              </button>
            ` : ''}
          </div>

          ${item.pre ? `<div class="dhikr-pre-text">${item.pre}</div>` : ''}
          <div class="dhikr-main-text" style="font-size: ${dhikrSettings.fontSize}px; font-family: ${dhikrSettings.fontFamily};">${item.text}</div>

          ${item.fullNote || item.alert ? `
            <div class="dhikr-note-wrapper">
              ${item.fullNote ? `
                <div class="dhikr-note-header">
                  <p class="dhikr-note-preview">${notePreview}</p>
                  ${hasLongNote ? `<button class="virtue-info-btn" onclick="openVirtueModal('${item.id}')" title="عرض الفضل كاملاً">!</button>` : ''}
                </div>
              ` : ''}

              ${item.alert ? `
                <button class="alert-badge-btn" onclick="openAlertModal('${item.id}')">
                  <span>⚠️ تنبيه هام</span>
                </button>
              ` : ''}
            </div>
          ` : ''}
        </div>

        <button class="dhikr-counter-btn ${isDone ? 'done' : ''}" onclick="decrementDhikr('${item.id}')">
          ${isDone ? '✓ تم' : item.currentCount}
        </button>
      `;

      // ميزة إخفاء الذكر عند الصفر
    if (dhikrSettings.hideOnZero && isDone) {
      card.style.display = 'none';
    }

    // ميزة العد بالضغط على أي مكان في البطاقة
    if (dhikrSettings.tapAnywhere && !isDone) {
      card.style.cursor = 'pointer';
      card.addEventListener('click', (e) => {
        // تجنب العد المزدوج إذا ضغط على زر المشاركة أو التعديل
        if (e.target.closest('.dhikr-card-top-actions') || e.target.closest('.dhikr-counter-btn') || e.target.closest('.dhikr-note-wrapper')) return;
        decrementDhikr(item.id);
      });
    }

    dhikrCardsContainer.appendChild(card);
    });
  }

  // تقليص عداد الذكر
  window.decrementDhikr = (itemId) => {
    const category = azkarState.find(c => c.id === currentActiveCategoryId);
    if (!category) return;
    const item = category.items.find(i => i.id === itemId);
    if (!item || item.currentCount <= 0) return;

    item.currentCount--;

  // 1. ارتجاج عند كل ضغطة
  if (dhikrSettings.vibrateOnClick && navigator.vibrate) {
    navigator.vibrate(30);
  }

  // 2. ارتجاج أطول عند وصول العداد للصفر
  if (item.currentCount === 0 && dhikrSettings.vibrateOnZero && navigator.vibrate) {
    navigator.vibrate([120, 60, 150]);
  }

    saveAzkarState();
    renderDhikrCards();

    const allDone = category.items.every(it => it.currentCount === 0);
  if (allDone) {
    // إظهار نافذة التهنئة الأولى "لقد انهيت الأذكار" مع زر "تم"
    setTimeout(() => {
      document.getElementById('finishModal').classList.add('show');
    }, 350);
  }
  };

  // ==================== 7. عزل معرفات الإضافة اليدوية للمستخدم ====================
  // 1. إضافة مجموعة خاصة بمعرف user_cat_
  const addCategoryModal = document.getElementById('addCategoryModal');
  const openAddCategoryModalBtn = document.getElementById('openAddCategoryModalBtn');
  const cancelCategoryBtn = document.getElementById('cancelCategoryBtn');
  const saveCategoryBtn = document.getElementById('saveCategoryBtn');
  const newCategoryNameInput = document.getElementById('newCategoryNameInput');

  openAddCategoryModalBtn.addEventListener('click', () => {
    newCategoryNameInput.value = '';
    addCategoryModal.classList.add('show');
  });
  cancelCategoryBtn.addEventListener('click', () => addCategoryModal.classList.remove('show'));

  saveCategoryBtn.addEventListener('click', () => {
    const name = newCategoryNameInput.value.trim();
    if (!name) return alert('يرجى كتابة اسم المجموعة');

    // بادئة معزولة تمنع أي تضارب مع تحديثات النظام
    const newGroup = {
      id: 'user_cat_' + Date.now(),
      name: name,
      isCustom: true,
      items: []
    };

    azkarState.push(newGroup);
    saveAzkarState();
    addCategoryModal.classList.remove('show');
    renderAzkarCategories();
  });

  // 2. إضافة ذكر خاص بمعرف user_item_
  const dhikrEditModal = document.getElementById('dhikrEditModal');
  const openAddDhikrModalBtn = document.getElementById('openAddDhikrModalBtn');
  const cancelDhikrBtn = document.getElementById('cancelDhikrBtn');
  const saveDhikrBtn = document.getElementById('saveDhikrBtn');
  const dhikrModalTitle = document.getElementById('dhikrModalTitle');
  const inputPreText = document.getElementById('inputPreText');
  const inputText = document.getElementById('inputText');
  const inputNote = document.getElementById('inputNote');
  const inputCount = document.getElementById('inputCount');
  let editingDhikrId = null;

  openAddDhikrModalBtn.addEventListener('click', () => {
    editingDhikrId = null;
    dhikrModalTitle.textContent = 'إضافة ذكر جديد';
    inputPreText.value = '';
    inputText.value = '';
    inputNote.value = '';
    inputCount.value = '1';
    dhikrEditModal.classList.add('show');
  });

  window.editSpecificDhikr = (itemId) => {
    const category = azkarState.find(c => c.id === currentActiveCategoryId);
    const item = category.items.find(i => i.id === itemId);
    if (!item) return;

    editingDhikrId = itemId;
    dhikrModalTitle.textContent = 'تعديل الذكر';
    inputPreText.value = item.pre || '';
    inputText.value = item.text || '';
    inputNote.value = item.fullNote || '';
    inputCount.value = item.count || 1;
    dhikrEditModal.classList.add('show');
  };

  cancelDhikrBtn.addEventListener('click', () => dhikrEditModal.classList.remove('show'));

  saveDhikrBtn.addEventListener('click', () => {
    const text = inputText.value.trim();
    const count = parseInt(inputCount.value);
    if (!text) return alert('حقل نص الذكر إجباري!');
    if (isNaN(count) || count < 1) return alert('العدد يجب أن يكون 1 على الأقل!');

    const category = azkarState.find(c => c.id === currentActiveCategoryId);
    if (!category) return;

    if (editingDhikrId) {
      const item = category.items.find(i => i.id === editingDhikrId);
      if (item) {
        item.pre = inputPreText.value.trim();
        item.text = text;
        item.fullNote = inputNote.value.trim();
        item.count = count;
        item.currentCount = count;
      }
    } else {
      // بادئة معزولة لذكر المستخدم
      category.items.push({
        id: 'user_item_' + Date.now(),
        pre: inputPreText.value.trim(),
        text: text,
        fullNote: inputNote.value.trim(),
        count: count,
        currentCount: count,
        alert: ''
      });
    }

    saveAzkarState();
    dhikrEditModal.classList.remove('show');
    renderDhikrCards();
  });

  // ==================== 8. بقية الوظائف والمودالات ====================
  const virtueModal = document.getElementById('virtueModal');
  const virtueModalContent = document.getElementById('virtueModalContent');
  document.getElementById('closeVirtueModalBtn').addEventListener('click', () => virtueModal.classList.remove('show'));

  window.openVirtueModal = (itemId) => {
    const category = azkarState.find(c => c.id === currentActiveCategoryId);
    const item = category.items.find(i => i.id === itemId);
    if (!item) return;
    virtueModalContent.innerText = item.fullNote;
    virtueModal.classList.add('show');
  };

  const alertModal = document.getElementById('alertModal');
  const alertModalContent = document.getElementById('alertModalContent');
  document.getElementById('closeAlertModalBtn').addEventListener('click', () => alertModal.classList.remove('show'));

  window.openAlertModal = (itemId) => {
    const category = azkarState.find(c => c.id === currentActiveCategoryId);
    const item = category.items.find(i => i.id === itemId);
    if (!item) return;
    alertModalContent.innerText = item.alert;
    alertModal.classList.add('show');
  };

  [virtueModal, alertModal, searchFavModal].forEach(m => {
    m.addEventListener('click', (e) => { if (e.target === m) m.classList.remove('show'); });
  });

  window.shareSpecificDhikr = (itemId) => {
    const category = azkarState.find(c => c.id === currentActiveCategoryId);
    const item = category.items.find(i => i.id === itemId);
    if (!item) return;
    const shareContent = `${item.pre ? item.pre + '\n' : ''}${item.text}\n${item.fullNote ? '\n(الفضل): ' + item.fullNote : ''}\n(تطبيق الحياة الطيبة)`;
    if (navigator.share) {
      navigator.share({ title: category.name, text: shareContent });
    } else {
      navigator.clipboard.writeText(shareContent);
      alert('تم نسخ الذكر بنجاح لمشاركته!');
    }
  };

  window.moveDhikr = (index, dir) => {
    const category = azkarState.find(c => c.id === currentActiveCategoryId);
    if (!category) return;
    const targetIdx = index + dir;
    if (targetIdx < 0 || targetIdx >= category.items.length) return;
    const temp = category.items[index];
    category.items[index] = category.items[targetIdx];
    category.items[targetIdx] = temp;
    saveAzkarState();
    renderDhikrCards();
  };

  const readerMenuBtn = document.getElementById('readerMenuBtn');
  const readerDropdownMenu = document.getElementById('readerDropdownMenu');
  readerMenuBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    readerDropdownMenu.classList.toggle('show');
  });
  
  // فتح وإغلاق شاشة الإعدادات
  const openDhikrSettingsBtn = document.getElementById('openDhikrSettingsBtn');
  const azkarSettingsModal = document.getElementById('azkarSettingsModal');

  if (openDhikrSettingsBtn) {
    openDhikrSettingsBtn.addEventListener('click', () => {
      syncSettingsUI();
      azkarSettingsModal.classList.add('show');
    });
  }

  azkarSettingsModal.addEventListener('click', (e) => {
    if (e.target === azkarSettingsModal) azkarSettingsModal.classList.remove('show');
  });

  // مزامنة واجهة الإعدادات مع القيم المحفوظة
  function syncSettingsUI() {
    if (dhikrSettings.displayMode === 'vertical') {
      document.getElementById('radioVertical').checked = true;
    } else {
      document.getElementById('radioHorizontal').checked = true;
    }
    document.getElementById('fontSizeSlider').value = dhikrSettings.fontSize;
    document.getElementById('fontSizeDisplay').textContent = dhikrSettings.fontSize;
    document.getElementById('fontFamilySelector').value = dhikrSettings.fontFamily;

    document.getElementById('toggleVibrateOnZero').checked = dhikrSettings.vibrateOnZero;
    document.getElementById('toggleVibrateOnClick').checked = dhikrSettings.vibrateOnClick;
    document.getElementById('toggleHideOnZero').checked = dhikrSettings.hideOnZero;
    document.getElementById('toggleTapAnywhere').checked = dhikrSettings.tapAnywhere;
    document.getElementById('toggleConfirmExit').checked = dhikrSettings.confirmExit;
  }

  // التفاعل وتطبيق الإعدادات فوراً
  document.querySelectorAll('input[name="displayModeRadio"]').forEach(r => {
    r.addEventListener('change', (e) => {
      dhikrSettings.displayMode = e.target.value;
      saveSettings();
      renderDhikrCards();
    });
  });

  document.getElementById('fontSizeSlider').addEventListener('input', (e) => {
    dhikrSettings.fontSize = parseInt(e.target.value);
    document.getElementById('fontSizeDisplay').textContent = dhikrSettings.fontSize;
    saveSettings();
    renderDhikrCards();
  });

  document.getElementById('fontFamilySelector').addEventListener('change', (e) => {
    dhikrSettings.fontFamily = e.target.value;
    saveSettings();
    renderDhikrCards();
  });

  document.getElementById('toggleVibrateOnZero').addEventListener('change', (e) => {
    dhikrSettings.vibrateOnZero = e.target.checked;
    saveSettings();
  });

  document.getElementById('toggleVibrateOnClick').addEventListener('change', (e) => {
    dhikrSettings.vibrateOnClick = e.target.checked;
    saveSettings();
  });

  document.getElementById('toggleHideOnZero').addEventListener('change', (e) => {
    dhikrSettings.hideOnZero = e.target.checked;
    saveSettings();
    renderDhikrCards();
  });

  document.getElementById('toggleTapAnywhere').addEventListener('change', (e) => {
    dhikrSettings.tapAnywhere = e.target.checked;
    saveSettings();
    renderDhikrCards();
  });

  document.getElementById('toggleConfirmExit').addEventListener('change', (e) => {
    dhikrSettings.confirmExit = e.target.checked;
    saveSettings();
  });
  
  document.addEventListener('click', () => readerDropdownMenu.classList.remove('show'));

  document.getElementById('toggleEditModeBtn').addEventListener('click', () => {
    isEditMode = !isEditMode;
    isReorderMode = false;
    renderDhikrCards();
  });
  document.getElementById('toggleReorderModeBtn').addEventListener('click', () => {
    isReorderMode = !isReorderMode;
    isEditMode = false;
    renderDhikrCards();
  });

  let targetCompletedCategoryId = null;

// 1. زر "تم" عند إنهاء الأذكار لأول مرة (يرجعه لشاشة المجموعات)
document.getElementById('finishDoneBtn').addEventListener('click', () => {
  document.getElementById('finishModal').classList.remove('show');
  showScreen(screenAzkarCategories);
  renderAzkarCategories();
});

// 2. أزرار المجموعة المكتملة مسبقاً
document.getElementById('resetCompletedCountersBtn').addEventListener('click', () => {
  const category = azkarState.find(c => c.id === targetCompletedCategoryId);
  if (category) {
    category.items.forEach(it => it.currentCount = it.count);
    saveAzkarState();
    renderAzkarCategories();
    openCategoryReader(targetCompletedCategoryId);
  }
  document.getElementById('alreadyCompletedModal').classList.remove('show');
});

document.getElementById('browseCompletedDhikrBtn').addEventListener('click', () => {
  document.getElementById('alreadyCompletedModal').classList.remove('show');
  openCategoryReader(targetCompletedCategoryId);
});

// 3. أزرار تأكيد الخروج قبل الإكمال
document.getElementById('continueReadingBtn').addEventListener('click', () => {
  document.getElementById('exitConfirmModal').classList.remove('show');
});

document.getElementById('confirmExitBtn').addEventListener('click', () => {
  document.getElementById('exitConfirmModal').classList.remove('show');
  showScreen(screenAzkarCategories);
  renderAzkarCategories();
});

  // العداد التنازلي والمشاركة
  // ==================== محرك مواقيت الصلاة والتواريخ الموحد ====================
  const DEFAULT_LOCATION = {
    city: 'مكة المكرمة',
    lat: 21.4225,
    lng: 39.8262
  };

  const PRAYER_KEYS = [
    { key: 'Fajr', name: 'الفجر' },
    { key: 'Sunrise', name: 'الشروق' },
    { key: 'Dhuhr', name: 'الظهر' },
    { key: 'Asr', name: 'العصر' },
    { key: 'Maghrib', name: 'المغرب' },
    { key: 'Isha', name: 'العشاء' }
  ];

  let currentTimings = null;
  let userLocation = JSON.parse(localStorage.getItem('hayat_saved_location')) || DEFAULT_LOCATION;

  let currentDayOffset = 0;
  let currentHijriText = '';
  let currentGregorianText = '';
  let currentDayName = 'الأحد';
  let activeDateMode = 'hijri';

  function formatTo12Hour(timeStr) {
    if (!timeStr) return '';
    const cleanTime = timeStr.split(' ')[0];
    let [hours, minutes] = cleanTime.split(':').map(Number);
    const period = hours >= 12 ? 'م' : 'ص';
    hours = hours % 12 || 12;
    return `${hours}:${String(minutes).padStart(2, '0')} ${period}`;
  }

  function getTargetDateObject() {
    let base = new Date();
    if (userLocation.timezone) {
      try {
        base = new Date(new Date().toLocaleString('en-US', { timeZone: userLocation.timezone }));
      } catch (e) {}
    }
    base.setDate(base.getDate() + currentDayOffset);
    return base;
  }

  // 1. جلب مواقيت الصلاة لليوم المحدد
  async function fetchPrayerTimes() {
    const cityNameEl = document.getElementById('cityNameText');
    if (cityNameEl) cityNameEl.textContent = userLocation.city;

    const targetDate = getTargetDateObject();
    const dStr = `${String(targetDate.getDate()).padStart(2, '0')}-${String(targetDate.getMonth() + 1).padStart(2, '0')}-${targetDate.getFullYear()}`;
    const methodNum = userLocation.method || 4;
    
    let url = `https://api.aladhan.com/v1/timings?latitude=${userLocation.lat}&longitude=${userLocation.lng}&method=${methodNum}`;
    if (currentDayOffset !== 0) {
      const timestamp = Math.floor(targetDate.getTime() / 1000);
      url = `https://api.aladhan.com/v1/timings/${timestamp}?latitude=${userLocation.lat}&longitude=${userLocation.lng}&method=${methodNum}`;
    }

    try {
      const response = await fetch(url);
      const data = await response.json();

      if (data && data.data) {
        currentTimings = data.data.timings;

        if (data.data.meta && data.data.meta.timezone) {
          userLocation.timezone = data.data.meta.timezone;
        }

        if (currentDayOffset === 0) {
          localStorage.setItem('hayat_cached_timings', JSON.stringify({
            timings: currentTimings,
            hijri: data.data.date.hijri,
            timezone: userLocation.timezone
          }));
        }

        updatePrayerUI(data.data);
      }
    } catch (err) {
      console.log('استخدام البيانات المحفوظة...');
      const cached = JSON.parse(localStorage.getItem('hayat_cached_timings'));
      if (cached) {
        currentTimings = cached.timings;
        if (cached.timezone) userLocation.timezone = cached.timezone;
        updatePrayerUI({ timings: cached.timings, date: { hijri: cached.hijri } });
      }
    }
  }

  // 2. تحديث الواجهة والصلوات واسم اليوم
  function updatePrayerUI(apiData) {
    const timings = apiData.timings;

    PRAYER_KEYS.forEach(p => {
      const row = document.querySelector(`.prayer-row[data-prayer="${p.key.toLowerCase()}"]`);
      if (row) {
        const timeEl = row.querySelector('.prayer-time');
        if (timeEl && timings[p.key]) {
          timeEl.textContent = formatTo12Hour(timings[p.key]);
        }
      }
    });

    const targetDate = getTargetDateObject();

    // اسم اليوم
    const dayFormatter = new Intl.DateTimeFormat('ar-SA', { weekday: 'long' });
    currentDayName = dayFormatter.format(targetDate);

    // التاريخ الهجري
    if (apiData.date && apiData.date.hijri) {
      const h = apiData.date.hijri;
      currentHijriText = `${h.day} ${h.month.ar}، ${h.year} هـ`;
    }

    // التاريخ الميلادي
    const gregFormatter = new Intl.DateTimeFormat('ar-EG', { day: 'numeric', month: 'long', year: 'numeric' });
    currentGregorianText = gregFormatter.format(targetDate) + ' م';

    renderDateDisplay();

    const returnTodayBtn = document.getElementById('returnTodayBtn');
    if (returnTodayBtn) {
      returnTodayBtn.style.display = (currentDayOffset !== 0) ? 'inline-block' : 'none';
    }
  }

  function renderDateDisplay() {
    const dateTextDisplay = document.getElementById('dateTextDisplay');
    const dayNameDisplay = document.getElementById('dayNameDisplay');

    if (dayNameDisplay) dayNameDisplay.textContent = currentDayName;
    if (dateTextDisplay) {
      dateTextDisplay.style.opacity = '0';
      setTimeout(() => {
        dateTextDisplay.textContent = (activeDateMode === 'hijri') ? (currentHijriText || '9 ربيع الثاني، 1448 هـ') : currentGregorianText;
        dateTextDisplay.style.opacity = '1';
      }, 100);
    }
  }

  function toggleDateMode() {
    activeDateMode = (activeDateMode === 'hijri') ? 'gregorian' : 'hijri';
    renderDateDisplay();
  }

  // 3. العداد التنازلي التفاعلي المباشر (كل ثانية)
  function startLiveCountdown() {
    setInterval(() => {
      if (!currentTimings) return;

      let now = new Date();
      if (userLocation.timezone) {
        try {
          const tzStr = new Date().toLocaleString('en-US', { timeZone: userLocation.timezone });
          now = new Date(tzStr);
        } catch (e) {
          now = new Date();
        }
      }

      let nextPrayer = null;
      let nextPrayerDate = null;

      for (const p of PRAYER_KEYS) {
        const timeStr = currentTimings[p.key].split(' ')[0];
        const [h, m] = timeStr.split(':').map(Number);
        const pDate = new Date(now.getTime());
        pDate.setHours(h, m, 0, 0);

        if (pDate > now) {
          nextPrayer = p;
          nextPrayerDate = pDate;
          break;
        }
      }

      if (!nextPrayer) {
        nextPrayer = PRAYER_KEYS[0];
        const timeStr = currentTimings['Fajr'].split(' ')[0];
        const [h, m] = timeStr.split(':').map(Number);
        nextPrayerDate = new Date(now.getTime());
        nextPrayerDate.setDate(nextPrayerDate.getDate() + 1);
        nextPrayerDate.setHours(h, m, 0, 0);
      }

      const diffSec = Math.max(0, Math.floor((nextPrayerDate - now) / 1000));
      const hours = Math.floor(diffSec / 3600);
      const minutes = Math.floor((diffSec % 3600) / 60);
      const seconds = diffSec % 60;

      const currentPrayerNameEl = document.getElementById('currentPrayerName');
      const currentPrayerTimeEl = document.getElementById('currentPrayerTime');
      const countdownTimerEl = document.getElementById('countdownTimer');

      if (currentPrayerNameEl) currentPrayerNameEl.textContent = nextPrayer.name;
      if (currentPrayerTimeEl) {
        const formattedFull = formatTo12Hour(currentTimings[nextPrayer.key]);
        currentPrayerTimeEl.textContent = formattedFull.replace(/[صم]/g, '').trim();
        const periodEl = document.getElementById('currentPrayerPeriod');
        if (periodEl) periodEl.textContent = formattedFull.includes('م') ? 'م' : 'ص';
      }
      if (countdownTimerEl) {
        countdownTimerEl.textContent = `${String(hours).padStart(2, '0')} : ${String(minutes).padStart(2, '0')} : ${String(seconds).padStart(2, '0')}`;
      }

      document.querySelectorAll('.prayer-row').forEach(row => row.classList.remove('active-prayer'));
      const activeRow = document.querySelector(`.prayer-row[data-prayer="${nextPrayer.key.toLowerCase()}"]`);
      if (activeRow) activeRow.classList.add('active-prayer');

    }, 1000);
  }

  // أحداث التاريخ والأسهم (محمية من التداخل)
  const prevDayBtn = document.getElementById('prevDayBtn');
  const nextDayBtn = document.getElementById('nextDayBtn');
  const returnTodayBtn = document.getElementById('returnTodayBtn');
  const dateStripContainer = document.getElementById('dateStripContainer');
  const dateFlipBtn = document.getElementById('dateFlipBtn');
  const dateTextClickArea = document.getElementById('dateTextClickArea');

  // السهم الأيمن: اليوم السابق
  if (prevDayBtn) {
    prevDayBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      currentDayOffset--;
      fetchPrayerTimes();
    });
  }

  // السهم الأيسر: اليوم التالي
  if (nextDayBtn) {
    nextDayBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      currentDayOffset++;
      fetchPrayerTimes();
    });
  }

  // زر "اليوم" العائم للعودة لليوم الحالي
  if (returnTodayBtn) {
    returnTodayBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      currentDayOffset = 0;
      fetchPrayerTimes();
    });
  }

  // قلب التاريخ محصور فقط بالنقر على النص أو مؤشر ⇅ (وليس كامل الحاوية)
  if (dateFlipBtn) dateFlipBtn.addEventListener('click', (e) => { e.stopPropagation(); toggleDateMode(); });
  if (dateTextClickArea) dateTextClickArea.addEventListener('click', (e) => { e.stopPropagation(); toggleDateMode(); });

  // السحب العمودي فقط على كرت التاريخ
  if (dateStripContainer) {
    let touchY = 0;
    dateStripContainer.addEventListener('touchstart', (e) => { touchY = e.touches[0].clientY; }, { passive: true });
    dateStripContainer.addEventListener('touchend', (e) => {
      if (Math.abs(e.changedTouches[0].clientY - touchY) > 25) {
        toggleDateMode();
      }
    });
  }

  // 4. قاعدة بيانات المدن المعتمدة مع المغرب والشام والعواصم
  const locationBadge = document.getElementById('locationBadge');
  const cityNameText = document.getElementById('cityNameText');
  const manualLocationModal = document.getElementById('manualLocationModal');
  const quickCitiesGrid = document.getElementById('quickCitiesGrid');
  const manualCityInput = document.getElementById('manualCityInput');
  const closeManualLocationBtn = document.getElementById('closeManualLocationBtn');
  const autoDetectLocationBtn = document.getElementById('autoDetectLocationBtn');
  const countryFilterBar = document.getElementById('countryFilterBar');

  let activeCountryFilter = 'all';

  const REGION_CITIES = [
    // المملكة العربية السعودية
    { name: 'مكة المكرمة', country: 'السعودية', lat: 21.4225, lng: 39.8262 },
    { name: 'المدينة المنورة', country: 'السعودية', lat: 24.4672, lng: 39.6111 },
    { name: 'الرياض', country: 'السعودية', lat: 24.7136, lng: 46.6753 },
    { name: 'جدة', country: 'السعودية', lat: 21.5433, lng: 39.1728 },
    { name: 'الدمام', country: 'السعودية', lat: 26.4207, lng: 50.0888 },
    { name: 'الخبر', country: 'السعودية', lat: 26.2818, lng: 50.1989 },
    { name: 'الظهران', country: 'السعودية', lat: 26.2886, lng: 50.1140 },
    { name: 'الأحساء (الهفوف)', country: 'السعودية', lat: 25.3835, lng: 49.5862 },
    { name: 'الجبيل', country: 'السعودية', lat: 27.0046, lng: 49.6606 },
    { name: 'حفر الباطن', country: 'السعودية', lat: 28.4328, lng: 45.9708 },
    { name: 'بريدة', country: 'السعودية', lat: 26.3260, lng: 43.9750 },
    { name: 'عنيزة', country: 'السعودية', lat: 26.0844, lng: 43.9936 },
    { name: 'حائل', country: 'السعودية', lat: 27.5219, lng: 41.6907 },
    { name: 'تبوك', country: 'السعودية', lat: 28.3835, lng: 36.5662 },
    { name: 'عرعر', country: 'السعودية', lat: 30.9753, lng: 41.0381 },
    { name: 'سكاكا (الجوف)', country: 'السعودية', lat: 29.9697, lng: 40.2064 },
    { name: 'القريات', country: 'السعودية', lat: 31.3318, lng: 37.3428 },
    { name: 'أبها', country: 'السعودية', lat: 18.2164, lng: 42.5053 },
    { name: 'خميس مشيط', country: 'السعودية', lat: 18.3064, lng: 42.7330 },
    { name: 'جازان', country: 'السعودية', lat: 16.8892, lng: 42.5511 },
    { name: 'صبيا', country: 'السعودية', lat: 17.1495, lng: 42.6254 },
    { name: 'نجران', country: 'السعودية', lat: 17.4924, lng: 44.1277 },
    { name: 'الباحة', country: 'السعودية', lat: 20.0129, lng: 41.4677 },
    { name: 'الطائف', country: 'السعودية', lat: 21.2854, lng: 40.4222 },
    { name: 'ينبع', country: 'السعودية', lat: 24.0891, lng: 38.0637 },

    // جمهورية مصر العربية
    { name: 'القاهرة', country: 'مصر', lat: 30.0444, lng: 31.2357 },
    { name: 'الإسكندرية', country: 'مصر', lat: 31.2001, lng: 29.9187 },
    { name: 'الجيزة', country: 'مصر', lat: 30.0131, lng: 31.2089 },
    { name: 'بورسعيد', country: 'مصر', lat: 31.2653, lng: 32.3019 },
    { name: 'السويس', country: 'مصر', lat: 29.9668, lng: 32.5498 },
    { name: 'المنصورة (الدقهلية)', country: 'مصر', lat: 31.0409, lng: 31.3785 },
    { name: 'طنطا (الغربية)', country: 'مصر', lat: 30.7865, lng: 31.0004 },
    { name: 'الزقازيق (الشرقية)', country: 'مصر', lat: 30.5877, lng: 31.5020 },
    { name: 'أسيوط', country: 'مصر', lat: 27.1783, lng: 31.1859 },
    { name: 'سوهاج', country: 'مصر', lat: 26.5590, lng: 31.6957 },
    { name: 'الأقصر', country: 'مصر', lat: 25.6872, lng: 32.6396 },
    { name: 'أسوان', country: 'مصر', lat: 24.0889, lng: 32.8998 },

    // الجمهورية اليمنية
    { name: 'صنعاء', country: 'اليمن', lat: 15.3694, lng: 44.1910 },
    { name: 'عدن', country: 'اليمن', lat: 12.7855, lng: 45.0187 },
    { name: 'تعز', country: 'اليمن', lat: 13.5795, lng: 44.0209 },
    { name: 'الحديدة', country: 'اليمن', lat: 14.7978, lng: 42.9545 },
    { name: 'المكلا (حضرموت)', country: 'اليمن', lat: 14.5425, lng: 49.1242 },
    { name: 'إب', country: 'اليمن', lat: 13.9667, lng: 44.1667 },
    { name: 'ذمار', country: 'اليمن', lat: 14.5428, lng: 44.4051 },
    { name: 'مأرب', country: 'اليمن', lat: 15.4633, lng: 45.3258 },

    // الإمارات
    { name: 'أبوظبي', country: 'الإمارات', lat: 24.4539, lng: 54.3773 },
    { name: 'دبي', country: 'الإمارات', lat: 25.2048, lng: 55.2708 },
    { name: 'الشارقة', country: 'الإمارات', lat: 25.3463, lng: 55.4209 },
    { name: 'عجمان', country: 'الإمارات', lat: 25.4052, lng: 55.5136 },
    { name: 'رأس الخيمة', country: 'الإمارات', lat: 25.6741, lng: 55.9804 },
    { name: 'الفجيرة', country: 'الإمارات', lat: 25.1288, lng: 56.3265 },

    // الكويت وعمان وقطر والبحرين
    { name: 'الكويت (العاصمة)', country: 'الكويت', lat: 29.3759, lng: 47.9774 },
    { name: 'حولي', country: 'الكويت', lat: 29.3328, lng: 48.0282 },
    { name: 'مسقط', country: 'عمان', lat: 23.5880, lng: 58.3829 },
    { name: 'صلالة', country: 'عمان', lat: 17.0151, lng: 54.0924 },
    { name: 'الدوحة', country: 'قطر', lat: 25.2854, lng: 51.5310 },
    { name: 'الريان', country: 'قطر', lat: 25.2919, lng: 51.4244 },
    { name: 'المنامة', country: 'البحرين', lat: 26.2285, lng: 50.5860 },

    // المغرب وفلسطين وعواصم إسلامية
    { name: 'الرباط', country: 'المغرب', lat: 34.0209, lng: -6.8416 },
    { name: 'الدار البيضاء', country: 'المغرب', lat: 33.5731, lng: -7.5898 },
    { name: 'مراكش', country: 'المغرب', lat: 31.6295, lng: -7.9811 },
    { name: 'القدس الشريف', country: 'فلسطين', lat: 31.7683, lng: 35.2137 },
    { name: 'غزة', country: 'فلسطين', lat: 31.5017, lng: 34.4668 },
    { name: 'عمّان', country: 'الأردن', lat: 31.9454, lng: 35.9284 },
    { name: 'دمشق', country: 'سوريا', lat: 33.5138, lng: 36.2765 },
    { name: 'بيروت', country: 'لبنان', lat: 33.8938, lng: 35.5018 },
    { name: 'بغداد', country: 'العراق', lat: 33.3152, lng: 44.3661 },
    { name: 'تونس (العاصمة)', country: 'تونس', lat: 36.8065, lng: 10.1815 },
    { name: 'الجزائر (العاصمة)', country: 'الجزائر', lat: 36.7538, lng: 3.0588 },
    { name: 'إسطنبول', country: 'تركيا', lat: 41.0082, lng: 28.9784 },
    { name: 'لندن', country: 'بريطانيا', lat: 51.5074, lng: -0.1278 },
    { name: 'واشنطن', country: 'أمريكا', lat: 38.9072, lng: -77.0369 }
  ];

  function normalizeArabic(text) {
    if (!text) return '';
    return text.trim().toLowerCase().replace(/[أإآٱ]/g, 'ا').replace(/ة/g, 'ه').replace(/ى/g, 'ي').replace(/[\u064B-\u065F]/g, '').replace(/^ال/, '');
  }

  function getWordSimilarity(s1, s2) {
    const n1 = normalizeArabic(s1);
    const n2 = normalizeArabic(s2);
    if (n1 === n2) return 1.0;
    if (n1.includes(n2) || n2.includes(n1)) return 0.85;

    const len1 = n1.length, len2 = n2.length;
    const track = Array(len2 + 1).fill(null).map(() => Array(len1 + 1).fill(null));
    for (let i = 0; i <= len1; i++) track[0][i] = i;
    for (let j = 0; j <= len2; j++) track[j][0] = j;

    for (let j = 1; j <= len2; j++) {
      for (let i = 1; i <= len1; i++) {
        const indicator = n1[i - 1] === n2[j - 1] ? 0 : 1;
        track[j][i] = Math.min(track[j][i - 1] + 1, track[j - 1][i] + 1, track[j - 1][i - 1] + indicator);
      }
    }
    const distance = track[len2][len1];
    const maxLen = Math.max(len1, len2);
    return maxLen === 0 ? 1 : 1 - distance / maxLen;
  }

  function renderQuickCities(filterText = '') {
    if (!quickCitiesGrid) return;
    quickCitiesGrid.innerHTML = '';
    const rawQuery = filterText.trim();
    const query = normalizeArabic(rawQuery);

    const exactMatches = REGION_CITIES.filter(c => {
      const matchCountry = activeCountryFilter === 'all' || c.country === activeCountryFilter;
      const matchName = !query || normalizeArabic(c.name).includes(query) || normalizeArabic(c.country).includes(query);
      return matchCountry && matchName;
    });

    if (exactMatches.length > 0) {
      exactMatches.forEach(c => {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'quick-city-btn';
        btn.innerHTML = `<span>${c.name}</span><span class="city-sub-country">${c.country}</span>`;
        btn.onclick = () => selectCity(c.name, c.lat, c.lng, c.country);
        quickCitiesGrid.appendChild(btn);
      });
      return;
    }

    if (rawQuery.length >= 2) {
      const fuzzySuggestions = REGION_CITIES.map(c => ({
        city: c,
        score: Math.max(getWordSimilarity(rawQuery, c.name), getWordSimilarity(rawQuery, c.country))
      }))
      .filter(item => item.score >= 0.55)
      .sort((a, b) => b.score - a.score)
      .map(item => item.city);

      if (fuzzySuggestions.length > 0) {
        const hint = document.createElement('div');
        hint.style.cssText = 'grid-column: span 3; font-size: 12.5px; color: #B45309; background: #FEF3C7; padding: 7px 10px; border-radius: 8px; font-weight: 700; text-align: center; margin-bottom: 6px;';
        hint.textContent = 'هل تقصد إحدى هذه المدن القريبة؟';
        quickCitiesGrid.appendChild(hint);

        fuzzySuggestions.slice(0, 6).forEach(c => {
          const btn = document.createElement('button');
          btn.type = 'button';
          btn.className = 'quick-city-btn';
          btn.style.borderColor = '#FCD34D';
          btn.innerHTML = `<span>${c.name}</span><span class="city-sub-country">${c.country}</span>`;
          btn.onclick = () => selectCity(c.name, c.lat, c.lng, c.country);
          quickCitiesGrid.appendChild(btn);
        });
        return;
      }

      const searchOnlineBtn = document.createElement('button');
      searchOnlineBtn.type = 'button';
      searchOnlineBtn.className = 'quick-city-btn';
      searchOnlineBtn.style.gridColumn = 'span 3';
      searchOnlineBtn.textContent = `🔍 بحث عبر الخريطة العالمية عن: "${rawQuery}"`;
      searchOnlineBtn.onclick = () => searchCityOnline(rawQuery);
      quickCitiesGrid.appendChild(searchOnlineBtn);
    }
  }

  async function selectCity(name, lat, lng, country = '') {
    const method = (country === 'مصر' || name.includes('مصر')) ? 5 : 4; 
    userLocation = { city: name, country: country, lat: lat, lng: lng, method: method };
    localStorage.setItem('hayat_saved_location', JSON.stringify(userLocation));

    if (cityNameText) cityNameText.textContent = name;
    if (manualLocationModal) manualLocationModal.classList.remove('show');
    await fetchPrayerTimes();
  }

  async function searchCityOnline(query) {
    const cleanQuery = query.trim();
    if (!quickCitiesGrid) return;

    quickCitiesGrid.innerHTML = `
      <div style="grid-column: span 3; text-align: center; color: var(--text-secondary); padding: 16px; font-size: 13.5px;">
        جاري البحث عن مدن قريبة في الخريطة العالمية... ⏳
      </div>
    `;

    try {
      const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(cleanQuery)}&addressdetails=1&limit=5&accept-language=ar`;
      const res = await fetch(url);
      const data = await res.json();

      quickCitiesGrid.innerHTML = '';

      if (data && data.length > 0) {
        const header = document.createElement('div');
        header.style.cssText = 'grid-column: span 3; font-size: 12.5px; color: #1D5D9B; background: #EEF6FC; border: 1px solid #BCD8F0; padding: 8px 10px; border-radius: 8px; font-weight: 700; text-align: center; margin-bottom: 6px;';
        header.textContent = `📍 مدن قريبة تم العثور عليها للاسم: "${cleanQuery}"`;
        quickCitiesGrid.appendChild(header);

        data.forEach(item => {
          const officialCity = item.name || item.display_name.split(',')[0].trim();
          const country = (item.address && item.address.country) ? item.address.country : '';
          const state = (item.address && (item.address.state || item.address.region)) ? (item.address.state || item.address.region) : '';

          const btn = document.createElement('button');
          btn.type = 'button';
          btn.className = 'quick-city-btn';
          btn.style.cssText = 'border-color: #BCD8F0; padding: 10px 4px;';
          btn.innerHTML = `
            <span style="font-weight: 700;">${officialCity}</span>
            <span class="city-sub-country">${country ? country : state}</span>
          `;
          btn.onclick = () => selectCity(officialCity, parseFloat(item.lat), parseFloat(item.lon), country);
          quickCitiesGrid.appendChild(btn);
        });

      } else {
        quickCitiesGrid.innerHTML = `
          <div style="grid-column: span 3; text-align: center; color: #DC2626; background: #FEF2F2; border: 1px solid #FECACA; padding: 12px; border-radius: 10px; font-size: 13px;">
            ⚠️ لم يتم العثور على أي مدينة مطابقة للاسم: "<strong>${cleanQuery}</strong>"<br>
            <span style="font-size: 12px; color: var(--text-secondary); margin-top: 4px; display: block;">يرجى مراجعة الحروف أو الاختيار من القائمة.</span>
          </div>
        `;
      }
    } catch (err) {
      quickCitiesGrid.innerHTML = `
        <div style="grid-column: span 3; text-align: center; color: var(--text-muted); padding: 14px; font-size: 13px;">
          تعذر الاتصال بالخريطة حالياً، يرجى الاختيار من المدن المتاحة أعلاه.
        </div>
      `;
    }
  }

  if (countryFilterBar) {
    countryFilterBar.querySelectorAll('.country-chip').forEach(chip => {
      chip.addEventListener('click', () => {
        countryFilterBar.querySelectorAll('.country-chip').forEach(c => c.classList.remove('active'));
        chip.classList.add('active');
        activeCountryFilter = chip.getAttribute('data-country');
        renderQuickCities(manualCityInput ? manualCityInput.value : '');
      });
    });
  }

  function openManualLocationModal() {
    renderQuickCities('');
    if (manualCityInput) manualCityInput.value = '';
    if (manualLocationModal) manualLocationModal.classList.add('show');
  }

  if (manualCityInput) {
    manualCityInput.addEventListener('input', (e) => renderQuickCities(e.target.value));
  }
  if (closeManualLocationBtn) {
    closeManualLocationBtn.addEventListener('click', () => manualLocationModal.classList.remove('show'));
  }

  if (locationBadge) {
    locationBadge.style.cursor = 'pointer';
    locationBadge.addEventListener('click', () => {
      openManualLocationModal();
    });
  }

  if (autoDetectLocationBtn) {
    autoDetectLocationBtn.addEventListener('click', () => {
      autoDetectLocationBtn.innerHTML = `<span>جاري التحديد عبر الأقمار والشبكة...</span>`;

      if ('geolocation' in navigator) {
        navigator.geolocation.getCurrentPosition(
          async (pos) => {
            const lat = pos.coords.latitude;
            const lng = pos.coords.longitude;
            let detectedCity = 'موقعي الحالي';

            try {
              const geoRes = await fetch(`https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lng}&localityLanguage=ar`);
              const geoData = await geoRes.json();
              if (geoData.city || geoData.locality || geoData.principalSubdivision) {
                detectedCity = geoData.city || geoData.locality || geoData.principalSubdivision;
              }
            } catch (e) {}

            selectCity(detectedCity, lat, lng, '');
          },
          (err) => {
            alert('تعذر تحديد موقع GPS بدقة، يمكنك اختيار محافظتك من القائمة بالأسفل.');
            autoDetectLocationBtn.innerHTML = `<span>تحديد موقعي الحالي تلقائياً (GPS)</span>`;
          },
          { timeout: 5000, enableHighAccuracy: false, maximumAge: 600000 }
        );
      } else {
        alert('المتصفح لا يدعم تحديد الموقع.');
        autoDetectLocationBtn.innerHTML = `<span>تحديد موقعي الحالي تلقائياً (GPS)</span>`;
      }
    });
  }

  // نظام متابعة أداء الصلوات وحفظ علامات الـ Checkbox يومياً
  function initPrayerChecklist() {
    const todayKey = 'hayat_prayers_' + new Date().toISOString().slice(0, 10);
    const savedChecks = JSON.parse(localStorage.getItem(todayKey) || '{}');

    document.querySelectorAll('.prayer-row').forEach(row => {
      const pKey = row.getAttribute('data-prayer');
      const checkbox = row.querySelector('.prayer-check');

      if (checkbox && pKey) {
        checkbox.checked = !!savedChecks[pKey];
        checkbox.addEventListener('change', () => {
          savedChecks[pKey] = checkbox.checked;
          localStorage.setItem(todayKey, JSON.stringify(savedChecks));
        });
      }
    });
  }

  // مراقبة تمرير الشاشة لتفعيل الهيدر الزجاجي الضبابي
  window.addEventListener('scroll', () => {
    const header = document.querySelector('.app-header');
    if (header) {
      if (window.scrollY > 20) {
        header.classList.add('scrolled');
      } else {
        header.classList.remove('scrolled');
      }
    }
  });
  
  // تشغيل جلب الأوقات وتشغيل العداد الحي وتفعيل مربعات الصلوات
  fetchPrayerTimes();
  startLiveCountdown();
  initPrayerChecklist();

  // ==================== إعدادات وهوية التطبيق المركزية والمشاركة ====================
  const APP_CONFIG = {
    name: 'الحياة الطيبة',
    url: window.location.href.split('#')[0], // رابط التطبيق الحالي تلقائياً
    shortDesc: 'رفيقك اليومي لمواقيت الصلاة والأذكار والعبادات' // وصف التطبيق (6 كلمات)
  };

  const openShareBtn = document.getElementById('openShareBtn');
  const shareModalBackdrop = document.getElementById('shareModalBackdrop');
  const tabShareTimings = document.getElementById('tabShareTimings');
  const tabShareInvite = document.getElementById('tabShareInvite');
  const contentShareTimings = document.getElementById('contentShareTimings');
  const contentShareInvite = document.getElementById('contentShareInvite');

  const shareNextPrayerTitle = document.getElementById('shareNextPrayerTitle');
  const shareCardLocation = document.getElementById('shareCardLocation');
  const shareCardDate = document.getElementById('shareCardDate');
  const inviteAppNameDisplay = document.getElementById('inviteAppNameDisplay');
  const inviteAppDescDisplay = document.getElementById('inviteAppDescDisplay');
  const inviteAppUrlDisplay = document.getElementById('inviteAppUrlDisplay');

  const btnShareAsText = document.getElementById('btnShareAsText');
  const btnShareAsImage = document.getElementById('btnShareAsImage');
  const btnShareInvite = document.getElementById('btnShareInvite');

  // فتح نافذة المشاركة وتجهيز البيانات الحية
  if (openShareBtn && shareModalBackdrop) {
    openShareBtn.addEventListener('click', () => {
      const nextPrayerName = document.getElementById('currentPrayerName')?.textContent || 'الصلاة';
      const nextPrayerTime = document.getElementById('currentPrayerTime')?.textContent || '';
      const cityName = userLocation.city || 'مكة المكرمة';

      if (shareNextPrayerTitle) shareNextPrayerTitle.textContent = `موعد صلاة ${nextPrayerName}: ${nextPrayerTime}`;
      if (shareCardLocation) shareCardLocation.textContent = `${cityName} (${userLocation.country || 'المملكة'})`;
      if (shareCardDate) shareCardDate.textContent = `${currentHijriText} - ${currentGregorianText}`;

      if (inviteAppNameDisplay) inviteAppNameDisplay.textContent = APP_CONFIG.name;
      if (inviteAppDescDisplay) inviteAppDescDisplay.textContent = APP_CONFIG.shortDesc;
      if (inviteAppUrlDisplay) inviteAppUrlDisplay.textContent = APP_CONFIG.url;

      shareModalBackdrop.classList.add('show');
    });

    shareModalBackdrop.addEventListener('click', (e) => {
      if (e.target === shareModalBackdrop) shareModalBackdrop.classList.remove('show');
    });
  }

  // التبديل بين تبويبي: مشاركة التذكير / دعوة الأصدقاء
  if (tabShareTimings && tabShareInvite) {
    tabShareTimings.addEventListener('click', () => {
      tabShareTimings.classList.add('active');
      tabShareInvite.classList.remove('active');
      contentShareTimings.style.display = 'block';
      contentShareInvite.style.display = 'none';
    });

    tabShareInvite.addEventListener('click', () => {
      tabShareInvite.classList.add('active');
      tabShareTimings.classList.remove('active');
      contentShareInvite.style.display = 'block';
      contentShareTimings.style.display = 'none';
    });
  }

  // 1. مشاركة مواقيت اليوم كنص
  if (btnShareAsText) {
    btnShareAsText.addEventListener('click', async () => {
      let timingsText = '';
      if (currentTimings) {
        PRAYER_KEYS.forEach(p => {
          timingsText += `• ${p.name}: ${formatTo12Hour(currentTimings[p.key])}\n`;
        });
      }

      const fullShareMessage = 
`🕌 مواقيت الصلاة - ${userLocation.city}
📅 ${currentHijriText}
📆 ${currentGregorianText}

${timingsText}
✨ تم استخراج المواقيت عبر تطبيق: ${APP_CONFIG.name}
📲 جرّب التطبيق الآن:
${APP_CONFIG.url}`;

      if (navigator.share) {
        try {
          await navigator.share({ title: APP_CONFIG.name, text: fullShareMessage });
        } catch(e) {}
      } else {
        await navigator.clipboard.writeText(fullShareMessage);
        alert('تم نسخ مواقيت الصلاة وبيانات اليوم بنجاح!');
      }
      shareModalBackdrop.classList.remove('show');
    });
  }

  // 2. توليد ومشاركة بطاقة صورة حية عبر Canvas
  if (btnShareAsImage) {
    btnShareAsImage.addEventListener('click', async () => {
      btnShareAsImage.innerHTML = '<span>جاري إنشاء الصورة... 🎨</span>';

      const canvas = document.createElement('canvas');
      canvas.width = 1080;
      canvas.height = 1350;
      const ctx = canvas.getContext('2d');

      const grad = ctx.createLinearGradient(0, 0, 0, canvas.height);
      grad.addColorStop(0, '#09203F');
      grad.addColorStop(0.5, '#113F67');
      grad.addColorStop(1, '#1D5D9B');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      ctx.strokeStyle = '#FCD34D';
      ctx.lineWidth = 8;
      ctx.strokeRect(40, 40, canvas.width - 80, canvas.height - 80);

      ctx.textAlign = 'center';
      ctx.fillStyle = '#FFFFFF';
      ctx.font = 'bold 58px "Cairo", sans-serif';
      ctx.fillText(APP_CONFIG.name, canvas.width / 2, 140);

      ctx.font = '36px "Cairo", sans-serif';
      ctx.fillStyle = '#FCD34D';
      ctx.fillText(`📍 مواقيت الصلاة - ${userLocation.city}`, canvas.width / 2, 215);

      ctx.fillStyle = '#E2E8F0';
      ctx.font = '32px "Cairo", sans-serif';
      ctx.fillText(`${currentHijriText}  |  ${currentGregorianText}`, canvas.width / 2, 280);

      ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(120, 320);
      ctx.lineTo(canvas.width - 120, 320);
      ctx.stroke();

      let startY = 400;
      PRAYER_KEYS.forEach((p, idx) => {
        ctx.fillStyle = (idx % 2 === 0) ? 'rgba(255, 255, 255, 0.08)' : 'rgba(255, 255, 255, 0.14)';
        ctx.beginPath();
        ctx.roundRect(140, startY - 50, canvas.width - 280, 85, 18);
        ctx.fill();

        ctx.font = 'bold 38px "Cairo", sans-serif';
        ctx.fillStyle = '#FFFFFF';
        ctx.textAlign = 'right';
        ctx.fillText(p.name, canvas.width - 190, startY + 8);

        ctx.fillStyle = '#FCD34D';
        ctx.textAlign = 'left';
        ctx.fillText(formatTo12Hour(currentTimings[p.key]), 190, startY + 8);

        startY += 115;
      });

      ctx.textAlign = 'center';
      ctx.fillStyle = '#FFFFFF';
      ctx.font = 'bold 34px "Cairo", sans-serif';
      ctx.fillText(APP_CONFIG.shortDesc, canvas.width / 2, canvas.height - 150);

      ctx.fillStyle = '#93C5FD';
      ctx.font = '30px "Cairo", sans-serif';
      ctx.fillText(APP_CONFIG.url, canvas.width / 2, canvas.height - 95);

      canvas.toBlob(async (blob) => {
        btnShareAsImage.innerHTML = '<span>مشاركة كصورة 🖼️</span>';
        const file = new File([blob], 'prayer-times.png', { type: 'image/png' });

        // 1. تجهيز نص أوقات الصلاة كاملاً
        let timingsText = '';
        if (currentTimings) {
          PRAYER_KEYS.forEach(p => {
            timingsText += `• ${p.name}: ${formatTo12Hour(currentTimings[p.key])}\n`;
          });
        }

        // 2. صياغة الرسالة الكاملة المرفقة مع الصورة
        const fullImageMessage = 
`🕌 مواقيت الصلاة - ${userLocation.city}
📅 ${currentHijriText}
📆 ${currentGregorianText}

${timingsText}
✨ تم استخراج المواقيت عبر تطبيق: ${APP_CONFIG.name}
📲 جرّب التطبيق الآن:
${APP_CONFIG.url}`;

        // 3. إرسال الصورة مدمجاً معها النص الكامل
        if (navigator.canShare && navigator.canShare({ files: [file] })) {
          try {
            await navigator.share({
              files: [file],
              title: `مواقيت الصلاة - ${userLocation.city}`,
              text: fullImageMessage
            });
          } catch(e) {}
        } else {
          const link = document.createElement('a');
          link.download = `مواقيت-${userLocation.city}.png`;
          link.href = canvas.toDataURL();
          link.click();
          alert('تم إنشاء وتنزيل بطاقة المواقيت كصورة بنجاح!');
        }
        shareModalBackdrop.classList.remove('show');
      }, 'image/png');
    });
  }

  // 3. مشاركة رسالة دعوة الأصدقاء (بدون تكرار الرابط)
  if (btnShareInvite) {
    btnShareInvite.addEventListener('click', async () => {
      const inviteMessage = 
`السلام عليكم ورحمة الله وبركاته 🌸
أدعوك لتجربة تطبيق "${APP_CONFIG.name}":
✨ ${APP_CONFIG.shortDesc}

📲 افتح التطبيق مباشرة عبر الرابط:
${APP_CONFIG.url}`;

      if (navigator.share) {
        try {
          await navigator.share({
            title: APP_CONFIG.name,
            text: inviteMessage
          });
        } catch(e) {}
      } else {
        await navigator.clipboard.writeText(inviteMessage);
        alert('تم نسخ رسالة الدعوة والرابط بنجاح لمشاركتها مع أصدقائك!');
      }
      shareModalBackdrop.classList.remove('show');
    });
  }

  // ==================== معالج أزرار النقر المطوّل ====================
  window.handleLongPressAction = function(actionType) {
    const targetId = window.activeLongPressedGroupId;
    const groupLongPressModal = document.getElementById('groupLongPressModal');

    if (actionType === 'start' || actionType === 'resume') {
      if (groupLongPressModal) groupLongPressModal.classList.remove('show');
      if (targetId && window.openCategoryReader) {
        window.openCategoryReader(targetId, false);
      }
    } else if (actionType === 'reset') {
      if (groupLongPressModal) groupLongPressModal.classList.remove('show');
      if (targetId && window.openCategoryReader) {
        window.openCategoryReader(targetId, true);
      }
    } else if (actionType === 'cancel') {
      if (groupLongPressModal) groupLongPressModal.classList.remove('show');
    }
  };

  const groupLongPressModalEl = document.getElementById('groupLongPressModal');
  if (groupLongPressModalEl) {
    groupLongPressModalEl.addEventListener('click', (e) => {
      if (e.target === groupLongPressModalEl) groupLongPressModalEl.classList.remove('show');
    });
  }

  // تسجيل Service Worker
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('./sw.js').catch(err => console.log('SW error:', err));
  }

}); // إغلاق الدالة الرئيسية للتطبيق بشكل صحيح

// ==================== نافذة وخيارات النقر المطوّل (تشغيل مباشر ومضمون) ====================
  const groupLongPressModal = document.getElementById('groupLongPressModal');
  const longPressModalTitle = document.getElementById('longPressModalTitle');
  const longPressModalDesc = document.getElementById('longPressModalDesc');
  const lpNotStartedActions = document.getElementById('lpNotStartedActions');
  const lpStartedActions = document.getElementById('lpStartedActions');

  window.activeLongPressedGroupId = null;

  function openGroupLongPressModal(group, isStarted) {
    window.activeLongPressedGroupId = group.id;
    longPressModalTitle.textContent = group.name;

    if (!isStarted) {
      longPressModalDesc.textContent = `هل ترغب في قراءة ${group.name} الآن؟`;
      lpNotStartedActions.style.display = 'flex';
      lpStartedActions.style.display = 'none';
    } else {
      longPressModalDesc.textContent = 'لقد قرأت جزءاً من هذه الأذكار، هل ترغب في إكمالها أم تصفير العدادات والبدء من جديد؟';
      lpNotStartedActions.style.display = 'none';
      lpStartedActions.style.display = 'flex';
    }

    groupLongPressModal.classList.add('show');
  }

  // المعالج الشامل لأوامر الأزرار
  window.handleLongPressAction = function(actionType) {
  const targetId = window.activeLongPressedGroupId;

  if (actionType === 'start' || actionType === 'resume') {
    // فتح المجموعة فوراً
    if (groupLongPressModal) groupLongPressModal.classList.remove('show');
    if (targetId && window.openCategoryReader) {
      window.openCategoryReader(targetId, false);
    }
  } else if (actionType === 'reset') {
    // إغلاق النافذة وتصفير المجموعة وفتحها بنفس الطريقة المضمونة
    if (groupLongPressModal) groupLongPressModal.classList.remove('show');
    if (targetId && window.openCategoryReader) {
      window.openCategoryReader(targetId, true); // true تعني: صفّر ثم افتح
    }
  } else if (actionType === 'cancel') {
    if (groupLongPressModal) groupLongPressModal.classList.remove('show');
  }
};

  if (groupLongPressModal) {
    groupLongPressModal.addEventListener('click', (e) => {
      if (e.target === groupLongPressModal) groupLongPressModal.classList.remove('show');
    });
  }

// ==================== محرك بوصلة اتجاه القبلة ====================
  const KAABA_LAT = 21.422487;
  const KAABA_LNG = 39.826206;
  let qiblaBearing = 0;
  let isCompassListening = false;
  let hasVibratedForAligned = false;

  function calculateQiblaAngle(userLat, userLng) {
    const phi1 = userLat * (Math.PI / 180);
    const phi2 = KAABA_LAT * (Math.PI / 180);
    const deltaLambda = (KAABA_LNG - userLng) * (Math.PI / 180);

    const y = Math.sin(deltaLambda);
    const x = Math.cos(phi1) * Math.tan(phi2) - Math.sin(phi1) * Math.cos(deltaLambda);
    let qibla = Math.atan2(y, x) * (180 / Math.PI);
    return Math.round((qibla + 360) % 360);
  }

  function initQiblaCompass() {
    const lat = userLocation.lat || 21.4225;
    const lng = userLocation.lng || 39.8262;
    qiblaBearing = calculateQiblaAngle(lat, lng);

    const qiblaCityDisplay = document.getElementById('qiblaCityDisplay');
    const qiblaAngleDisplay = document.getElementById('qiblaAngleDisplay');
    const kaabaTargetNode = document.getElementById('kaabaTargetNode');
    const qiblaPermissionBtn = document.getElementById('qiblaPermissionBtn');

    if (qiblaCityDisplay) qiblaCityDisplay.textContent = userLocation.city || 'مكة المكرمة';
    if (qiblaAngleDisplay) qiblaAngleDisplay.textContent = `${qiblaBearing}°`;
    if (kaabaTargetNode) kaabaTargetNode.style.transform = `rotate(${qiblaBearing}deg)`;

    // طلب الإذن في هواتف آيفون (iOS Safari)
    if (typeof DeviceOrientationEvent !== 'undefined' && typeof DeviceOrientationEvent.requestPermission === 'function') {
      if (qiblaPermissionBtn) {
        qiblaPermissionBtn.style.display = 'block';
        qiblaPermissionBtn.onclick = async () => {
          try {
            const resp = await DeviceOrientationEvent.requestPermission();
            if (resp === 'granted') {
              qiblaPermissionBtn.style.display = 'none';
              startCompassSensors();
            } else {
              alert('تم رفض إذن البوصلة. يمكنك توجيه الهاتف يدوياً بناءً على الدرجة الظاهرة.');
            }
          } catch (e) {
            startCompassSensors();
          }
        };
      }
    } else {
      if (qiblaPermissionBtn) qiblaPermissionBtn.style.display = 'none';
      startCompassSensors();
    }
  }

  function handleOrientation(e) {
    let heading = 0;
    if (e.webkitCompassHeading) {
      // أجهزة Apple iOS
      heading = e.webkitCompassHeading;
    } else if (e.alpha !== null) {
      // أجهزة أندرويد والمتصفحات القياسية
      heading = 360 - e.alpha;
    }

    heading = Math.round(heading);
    const compassDial = document.getElementById('compassDial');
    const qiblaStatusText = document.getElementById('qiblaStatusText');

    if (compassDial) {
      // تدوير القرص بحسب اتجاه الشمال الفعلي للهاتف
      compassDial.style.transform = `rotate(${-heading}deg)`;
    }

    // حساب زاوية الفرق بين وجهة الهاتف والكعبة
    const diff = Math.abs((heading - qiblaBearing + 360) % 360);
    const isAligned = diff <= 4 || diff >= 356;

    if (isAligned) {
      if (compassDial) compassDial.classList.add('aligned');
      if (qiblaStatusText) {
        qiblaStatusText.textContent = '✨ أنت باتجاه القبلة المشرفة الآن! تقبل الله طاعتكم';
        qiblaStatusText.classList.add('aligned');
      }
      if (!hasVibratedForAligned && navigator.vibrate) {
        navigator.vibrate(60);
        hasVibratedForAligned = true;
      }
    } else {
      if (compassDial) compassDial.classList.remove('aligned');
      if (qiblaStatusText) {
        qiblaStatusText.textContent = 'حرّك هاتفك حتى يتطابق السهم مع الكعبة المشرفة';
        qiblaStatusText.classList.remove('aligned');
      }
      hasVibratedForAligned = false;
    }
  }

  function startCompassSensors() {
    if (isCompassListening) return;
    if ('ondeviceorientationabsolute' in window) {
      window.addEventListener('deviceorientationabsolute', handleOrientation, true);
    } else if ('ondeviceorientation' in window) {
      window.addEventListener('deviceorientation', handleOrientation, true);
    }
    isCompassListening = true;
  }

  function stopQiblaCompass() {
    window.removeEventListener('deviceorientationabsolute', handleOrientation, true);
    window.removeEventListener('deviceorientation', handleOrientation, true);
    isCompassListening = false;
  }
