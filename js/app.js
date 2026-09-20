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
  const screenAzkarCategories = document.getElementById('screen-azkar-categories');
  const screenAzkarFavorites = document.getElementById('screen-azkar-favorites');
  const screenAzkarReader = document.getElementById('screen-azkar-reader');

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

    if (screen === screenHome) {
      tabHome.classList.add('active');
      tabAzkar.classList.remove('active');
    } else {
      tabHome.classList.remove('active');
      tabAzkar.classList.add('active');
    }
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
  tabAzkar.addEventListener('click', (e) => { e.preventDefault(); showScreen(screenAzkarCategories); renderAzkarCategories(); });
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
  // ==================== محرك مواقيت الصلاة والموقع الحي (أم القرى) ====================
  // الموقع الافتراضي: مكة المكرمة
  const DEFAULT_LOCATION = {
    city: 'مكة المكرمة',
    lat: 21.4225,
    lng: 39.8262
  };

  // أسماء الصلوات بالعربية ومطابقتها مع مفاتيح API
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

  // تحويل الوقت من نظام 24 إلى نظام 12 ساعة بالعربية (ص/م)
  function formatTo12Hour(timeStr) {
    if (!timeStr) return '';
    const cleanTime = timeStr.split(' ')[0]; // إزالة أي رموز إضافية
    let [hours, minutes] = cleanTime.split(':').map(Number);
    const period = hours >= 12 ? 'م' : 'ص';
    hours = hours % 12 || 12;
    return `${hours}:${String(minutes).padStart(2, '0')} ${period}`;
  }

  // 1. جلب مواقيت الصلاة من AlAdhan API مع الحفظ المؤقت
  async function fetchPrayerTimes() {
    const cityNameEl = document.getElementById('cityNameText');
    if (cityNameEl) cityNameEl.textContent = userLocation.city;

    const url = `https://api.aladhan.com/v1/timings?latitude=${userLocation.lat}&longitude=${userLocation.lng}&method=4`;

    try {
      const response = await fetch(url);
      const data = await response.json();

      if (data && data.data) {
        currentTimings = data.data.timings;
        localStorage.setItem('hayat_cached_timings', JSON.stringify({
          timings: currentTimings,
          hijri: data.data.date.hijri
        }));

        updatePrayerUI(data.data);
      }
    } catch (err) {
      console.log('استخدام البيانات المحفوظة محلياً...');
      const cached = JSON.parse(localStorage.getItem('hayat_cached_timings'));
      if (cached) {
        currentTimings = cached.timings;
        updatePrayerUI({ timings: cached.timings, date: { hijri: cached.hijri } });
      }
    }
  }

  // 2. تحديث نصوص المواعيد والتاريخ الهجري في الواجهة
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

    if (apiData.date && apiData.date.hijri) {
      const h = apiData.date.hijri;
      const hijriText = `${h.day} ${h.month.ar}، ${h.year} هـ`;
      const dateDisplay = document.getElementById('hijriDateDisplay');
      if (dateDisplay) dateDisplay.textContent = hijriText;
    }
  }

  // 3. حساب الصلاة القادمة والعداد التنازلي التفاعلي المباشر (كل ثانية)
  function startLiveCountdown() {
    setInterval(() => {
      if (!currentTimings) return;

      const now = new Date();
      let nextPrayer = null;
      let nextPrayerDate = null;

      for (const p of PRAYER_KEYS) {
        const timeStr = currentTimings[p.key].split(' ')[0];
        const [h, m] = timeStr.split(':').map(Number);
        const pDate = new Date();
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
        nextPrayerDate = new Date();
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
      if (currentPrayerTimeEl) currentPrayerTimeEl.textContent = formatTo12Hour(currentTimings[nextPrayer.key]).replace(/[صم]/g, '').trim();
      if (countdownTimerEl) {
        countdownTimerEl.textContent = `${String(hours).padStart(2, '0')} : ${String(minutes).padStart(2, '0')} : ${String(seconds).padStart(2, '0')}`;
      }

      document.querySelectorAll('.prayer-row').forEach(row => row.classList.remove('active-prayer'));
      const activeRow = document.querySelector(`.prayer-row[data-prayer="${nextPrayer.key.toLowerCase()}"]`);
      if (activeRow) activeRow.classList.add('active-prayer');

    }, 1000);
  }

  // 4. نظام تحديد الموقع اليدوي والسريع (متوافق مع هواوي وكافة الجوالات)
  const locationBadge = document.getElementById('locationBadge');
  const cityNameText = document.getElementById('cityNameText');
  const manualLocationModal = document.getElementById('manualLocationModal');
  const quickCitiesGrid = document.getElementById('quickCitiesGrid');
  const manualCityInput = document.getElementById('manualCityInput');
  const closeManualLocationBtn = document.getElementById('closeManualLocationBtn');

  const SAUDI_CITIES = [
    { name: 'مكة المكرمة', lat: 21.4225, lng: 39.8262 },
    { name: 'المدينة المنورة', lat: 24.4672, lng: 39.6111 },
    { name: 'الرياض', lat: 24.7136, lng: 46.6753 },
    { name: 'جدة', lat: 21.5433, lng: 39.1728 },
    { name: 'الدمام', lat: 26.4207, lng: 50.0888 },
    { name: 'الخبر', lat: 26.2818, lng: 50.1989 },
    { name: 'بريدة', lat: 26.3260, lng: 43.9750 },
    { name: 'عنيزة', lat: 26.0844, lng: 43.9936 },
    { name: 'تبوك', lat: 28.3835, lng: 36.5662 },
    { name: 'أبها', lat: 18.2164, lng: 42.5053 },
    { name: 'خميس مشيط', lat: 18.3064, lng: 42.7330 },
    { name: 'الطائف', lat: 21.2854, lng: 40.4222 },
    { name: 'حائل', lat: 27.5219, lng: 41.6907 },
    { name: 'جازان', lat: 16.8892, lng: 42.5511 },
    { name: 'نجران', lat: 17.4924, lng: 44.1277 },
    { name: 'الجبيل', lat: 27.0046, lng: 49.6606 },
    { name: 'ينبع', lat: 24.0891, lng: 38.0637 },
    { name: 'الأحساء (الهفوف)', lat: 25.3835, lng: 49.5862 }
  ];

  function renderQuickCities(filter = '') {
    if (!quickCitiesGrid) return;
    quickCitiesGrid.innerHTML = '';
    const filtered = SAUDI_CITIES.filter(c => c.name.includes(filter.trim()));

    filtered.forEach(cityObj => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'quick-city-btn';
      btn.textContent = cityObj.name;
      btn.onclick = () => selectCity(cityObj.name, cityObj.lat, cityObj.lng);
      quickCitiesGrid.appendChild(btn);
    });

    if (filtered.length === 0 && filter.trim().length > 2) {
      const searchOnlineBtn = document.createElement('button');
      searchOnlineBtn.type = 'button';
      searchOnlineBtn.className = 'quick-city-btn';
      searchOnlineBtn.style.gridColumn = 'span 3';
      searchOnlineBtn.textContent = `🔍 بحث عبر الإنترنت عن: "${filter}"`;
      searchOnlineBtn.onclick = () => searchCityOnline(filter.trim());
      quickCitiesGrid.appendChild(searchOnlineBtn);
    }
  }

  async function selectCity(name, lat, lng) {
    userLocation = { city: name, lat: lat, lng: lng };
    localStorage.setItem('hayat_saved_location', JSON.stringify(userLocation));
    if (cityNameText) cityNameText.textContent = name;
    if (manualLocationModal) manualLocationModal.classList.remove('show');
    await fetchPrayerTimes();
  }

  async function searchCityOnline(query) {
    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=1`);
      const data = await res.json();
      if (data && data.length > 0) {
        selectCity(query, parseFloat(data[0].lat), parseFloat(data[0].lon));
      } else {
        alert('لم يتم العثور على المدينة، يرجى كتابة الاسم بدقة.');
      }
    } catch (e) {
      alert('تعذر البحث عبر الإنترنت، يرجى اختيار إحدى المدن المتاحة.');
    }
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
      if (cityNameText) cityNameText.textContent = 'جاري التحديد...';
      locationBadge.style.opacity = '0.7';

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

            locationBadge.style.opacity = '1';
            selectCity(detectedCity, lat, lng);
          },
          (err) => {
            locationBadge.style.opacity = '1';
            if (cityNameText) cityNameText.textContent = userLocation.city;
            openManualLocationModal();
          },
          { timeout: 4000, enableHighAccuracy: false, maximumAge: 600000 }
        );
      } else {
        locationBadge.style.opacity = '1';
        openManualLocationModal();
      }
    });
  }

  // تشغيل جلب الأوقات وتشغيل العداد الحي التنازلي
  fetchPrayerTimes();
  startLiveCountdown();

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
