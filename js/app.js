document.addEventListener('DOMContentLoaded', () => {

  // 1. فحص الترقية وتثبيت بيانات المستخدم الكاملة
  const SAVED_VERSION_KEY = 'hayat_azkar_version';
  const currentVersion = localStorage.getItem(SAVED_VERSION_KEY);

  let azkarState = [];
  if (currentVersion !== AZKAR_DATA_VERSION) {
    const oldData = JSON.parse(localStorage.getItem('hayat_azkar_data') || '[]');
    const customUserGroups = oldData.filter(g => g.isCustom);
    azkarState = [...DEFAULT_AZKAR_DATA, ...customUserGroups];
    localStorage.setItem('hayat_azkar_data', JSON.stringify(azkarState));
    localStorage.setItem(SAVED_VERSION_KEY, AZKAR_DATA_VERSION);
  } else {
    azkarState = JSON.parse(localStorage.getItem('hayat_azkar_data')) || DEFAULT_AZKAR_DATA;
  }

  function saveAzkarState() {
    localStorage.setItem('hayat_azkar_data', JSON.stringify(azkarState));
  }

  // 2. التنقل بين الشاشات
  const screenHome = document.getElementById('screen-home');
  const screenAzkarCategories = document.getElementById('screen-azkar-categories');
  const screenAzkarReader = document.getElementById('screen-azkar-reader');

  const tabHome = document.getElementById('tabHome');
  const tabAzkar = document.getElementById('tabAzkar');
  const openAzkarTileBtn = document.getElementById('openAzkarTileBtn');
  const backToHomeBtn = document.getElementById('backToHomeBtn');
  const backToCategoriesBtn = document.getElementById('backToCategoriesBtn');

  function showScreen(screen) {
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

  tabHome.addEventListener('click', (e) => { e.preventDefault(); showScreen(screenHome); });
  tabAzkar.addEventListener('click', (e) => { e.preventDefault(); showScreen(screenAzkarCategories); renderAzkarCategories(); });
  openAzkarTileBtn.addEventListener('click', () => { showScreen(screenAzkarCategories); renderAzkarCategories(); });
  backToHomeBtn.addEventListener('click', () => showScreen(screenHome));
  backToCategoriesBtn.addEventListener('click', () => { showScreen(screenAzkarCategories); renderAzkarCategories(); });

  // 3. عرض مجموعات الأذكار (الـ 60+ قسم المنفصلة)
  const azkarGroupsContainer = document.getElementById('azkarGroupsContainer');
  let currentActiveCategoryId = null;

  function renderAzkarCategories() {
    azkarGroupsContainer.innerHTML = '';

    azkarState.forEach(group => {
      const totalItems = group.items ? group.items.length : 0;
      let completedItems = 0;
      if (totalItems > 0) {
        completedItems = group.items.filter(it => it.currentCount === 0).length;
      }
      const progressPercent = totalItems === 0 ? 0 : Math.round((completedItems / totalItems) * 100);
      const isCompleted = totalItems > 0 && progressPercent === 100;

      const card = document.createElement('div');
      card.className = `azkar-group-card ${isCompleted ? 'completed' : ''}`;
      card.innerHTML = `
        <div class="azkar-group-progress-fill" style="width: ${progressPercent}%;"></div>
        ${isCompleted ? '<div class="group-completed-badge">✓</div>' : ''}
        <span class="azkar-group-title">${group.name}</span>
      `;

      card.addEventListener('click', () => openCategoryReader(group.id));
      azkarGroupsContainer.appendChild(card);
    });
  }

  // 4. قراءة الأذكار وعرض البطاقات
  const readerCategoryTitle = document.getElementById('readerCategoryTitle');
  const dhikrCardsContainer = document.getElementById('dhikrCardsContainer');
  let isEditMode = false;
  let isReorderMode = false;

  function openCategoryReader(categoryId) {
    currentActiveCategoryId = categoryId;
    const category = azkarState.find(c => c.id === categoryId);
    if (!category) return;

    readerCategoryTitle.textContent = category.name;
    isEditMode = false;
    isReorderMode = false;
    renderDhikrCards();
    showScreen(screenAzkarReader);
  }

  function renderDhikrCards() {
    dhikrCardsContainer.innerHTML = '';
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

      // فحص طول نص الفضل
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
          <div class="dhikr-main-text">${item.text}</div>

          ${item.fullNote || item.alert ? `
            <div class="dhikr-note-wrapper">
              ${item.fullNote ? `
                <div class="dhikr-note-header">
                  <p class="dhikr-note-preview">${notePreview}</p>
                  ${hasLongNote ? `<button class="virtue-info-btn" onclick="openVirtueModal('${item.id}')" title="عرض الفضل والأحاديث كاملة">!</button>` : ''}
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
    if (navigator.vibrate) navigator.vibrate(35);

    saveAzkarState();
    renderDhikrCards();

    const allDone = category.items.every(it => it.currentCount === 0);
    if (allDone) {
      setTimeout(() => document.getElementById('completionModal').classList.add('show'), 400);
    }
  };

  // فتح نافذة الفضل والحديث الكامل عند الضغط على (!)
  const virtueModal = document.getElementById('virtueModal');
  const virtueModalContent = document.getElementById('virtueModalContent');
  const closeVirtueModalBtn = document.getElementById('closeVirtueModalBtn');

  window.openVirtueModal = (itemId) => {
    const category = azkarState.find(c => c.id === currentActiveCategoryId);
    const item = category.items.find(i => i.id === itemId);
    if (!item) return;

    virtueModalContent.innerText = item.fullNote;
    virtueModal.classList.add('show');
  };

  closeVirtueModalBtn.addEventListener('click', () => virtueModal.classList.remove('show'));

  // فتح نافذة التنبيه عند الضغط على زر التنبيه
  const alertModal = document.getElementById('alertModal');
  const alertModalContent = document.getElementById('alertModalContent');
  const closeAlertModalBtn = document.getElementById('closeAlertModalBtn');

  window.openAlertModal = (itemId) => {
    const category = azkarState.find(c => c.id === currentActiveCategoryId);
    const item = category.items.find(i => i.id === itemId);
    if (!item) return;

    alertModalContent.innerText = item.alert;
    alertModal.classList.add('show');
  };

  closeAlertModalBtn.addEventListener('click', () => alertModal.classList.remove('show'));

  // إغلاق النوافذ عند النقر على الخلفية المعتمة
  [virtueModal, alertModal].forEach(m => {
    m.addEventListener('click', (e) => {
      if (e.target === m) m.classList.remove('show');
    });
  });

  // مشاركة الذكر
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

  // ترتيب الأذكار
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

  // خيارات القائمة
  const readerMenuBtn = document.getElementById('readerMenuBtn');
  const readerDropdownMenu = document.getElementById('readerDropdownMenu');
  readerMenuBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    readerDropdownMenu.classList.toggle('show');
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

  // تصفير العدادات
  document.getElementById('resetCountersBtn').addEventListener('click', () => {
    const category = azkarState.find(c => c.id === currentActiveCategoryId);
    if (category) {
      category.items.forEach(it => it.currentCount = it.count);
      saveAzkarState();
      renderDhikrCards();
    }
    document.getElementById('completionModal').classList.remove('show');
  });
  document.getElementById('reviewDhikrBtn').addEventListener('click', () => {
    document.getElementById('completionModal').classList.remove('show');
  });

  // مشاركة مواقيت الصلاة والعداد التنازلي
  const openShareBtn = document.getElementById('openShareBtn');
  const shareModalBackdrop = document.getElementById('shareModalBackdrop');
  if (openShareBtn) {
    openShareBtn.addEventListener('click', () => shareModalBackdrop.classList.add('show'));
    shareModalBackdrop.addEventListener('click', (e) => {
      if (e.target === shareModalBackdrop) shareModalBackdrop.classList.remove('show');
    });
    document.getElementById('confirmShareBtn').addEventListener('click', () => {
      if (navigator.share) {
        navigator.share({ title: 'الحياة الطيبة', text: 'صلاة العصر بتوقيت الرياض: 3:15 م', url: window.location.href });
      }
      shareModalBackdrop.classList.remove('show');
    });
  }

  let remainingSeconds = (12 * 60) + 28;
  const countdownEl = document.getElementById('countdownTimer');
  if (countdownEl) {
    setInterval(() => {
      if (remainingSeconds > 0) {
        remainingSeconds--;
        const m = Math.floor(remainingSeconds / 60);
        const s = remainingSeconds % 60;
        countdownEl.textContent = `${String(m).padStart(2, '0')} : ${String(s).padStart(2, '0')}`;
      }
    }, 1000);
  }

  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('./sw.js').catch(err => console.log('SW error:', err));
  }

});
