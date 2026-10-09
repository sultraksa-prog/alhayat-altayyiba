// ==================== التقاط حدث التثبيت فوراً في السطر الأول ====================
let deferredPwaPrompt = null;
window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault();
  deferredPwaPrompt = e;
});

document.addEventListener('DOMContentLoaded', () => {

  // ==================== نظام التثبيت الذكي والواجهة المدركة للسياق ====================
      const isRunningStandalone = window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true;
      const userAgent = navigator.userAgent.toLowerCase();
      // دعم متطور يشمل الآيباد المكتبي والآيفون
      const isIOS = /ipad|iphone|ipod/.test(userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
      const isAndroidOS = /android/.test(userAgent);
      
      // التعرف الصارم على بيئة تطبيق الأندرويد أو الآيفون الأصلي (APK / IPA)
      const isNativeAppEnv = !!(
        window.location.protocol === 'capacitor:' || 
        window.location.hostname === 'localhost' || 
        (window.Capacitor && window.Capacitor.isNativePlatform && window.Capacitor.isNativePlatform())
      );

      // الاستماع لاكتمال التثبيت بنجاح (PWA)
      window.addEventListener('appinstalled', () => {
        deferredPwaPrompt = null;
        localStorage.setItem('hayat_pwa_installed', 'true');
        showPwaModal('success', 'تم تثبيت التطبيق بنجاح! 🎉', 'أصبح تطبيق "الحياة الطيبة" الآن مثبتاً على جهازك. يمكنك فتحه مباشرة من شاشة هاتفك الرئيسية كأي تطبيق أصيل والاستمتاع بتجربة كاملة وسريعة بدون إنترنت.');
        updateInstallButtonUI(true);
      });

      // دالة التحكم الذكي بإظهار وإخفاء الأزرار
      function updateInstallButtonUI(installed) {
        const pwaBtn = document.getElementById('installPwaBtn');
        const apkBtn = document.getElementById('downloadAndroidApkBtn');
        const iosBtn = document.getElementById('installIosAppBtn');

        // 1. إذا كان التطبيق مثبتاً (PWA أو APK أصلي) -> إخفاء كل أزرار التثبيت لتنظيف الشاشة
        if (installed || isRunningStandalone || isNativeAppEnv) {
          if (pwaBtn) pwaBtn.style.display = 'none';
          if (apkBtn) apkBtn.style.display = 'none';
          if (iosBtn) iosBtn.style.display = 'none';
          return;
        }

        // 2. إذا كان يعمل في المتصفح -> إظهار ذكي حسب نظام التشغيل
        if (isIOS) {
          if (pwaBtn) pwaBtn.style.display = 'none';
          if (apkBtn) apkBtn.style.display = 'none';
          if (iosBtn) iosBtn.style.display = 'flex'; // إظهار زر الآيفون فقط
        } else if (isAndroidOS) {
          if (pwaBtn) pwaBtn.style.display = 'flex'; // PWA للأندرويد
          if (apkBtn) apkBtn.style.display = 'flex'; // APK للأندرويد
          if (iosBtn) iosBtn.style.display = 'none'; // إخفاء زر الآيفون
        } else {
          // متصفح الكمبيوتر المكتبي (Desktop)
          if (pwaBtn) pwaBtn.style.display = 'flex';
          if (apkBtn) apkBtn.style.display = 'none';
          if (iosBtn) iosBtn.style.display = 'none';
        }
      }

      // تشغيل الفحص الذكي فوراً عند فتح التطبيق
      updateInstallButtonUI(localStorage.getItem('hayat_pwa_installed') === 'true');

      // فحص إضافي للأجهزة المدعومة للتحقق مما إذا كان التطبيق مثبتاً
      if (!isRunningStandalone && !isNativeAppEnv && 'getInstalledRelatedApps' in navigator) {
        navigator.getInstalledRelatedApps().then((relatedApps) => {
          if (relatedApps.length > 0) {
            updateInstallButtonUI(true);
          }
        }).catch(() => {});
      }

  function showPwaModal(type, title, desc) {
    const modal = document.getElementById('pwaInstallModal');
    const modalIcon = document.getElementById('pwaModalIcon');
    const modalTitle = document.getElementById('pwaModalTitle');
    const modalDesc = document.getElementById('pwaModalDesc');
    const iosContainer = document.getElementById('iosStepsContainer');

    if (!modal) return;
    if (modalTitle) modalTitle.textContent = title;
    if (modalDesc) modalDesc.textContent = desc;

    if (type === 'installed') {
      if (modalIcon) modalIcon.textContent = '✓';
      if (iosContainer) iosContainer.style.display = 'none';
    } else if (type === 'ios') {
      if (modalIcon) modalIcon.textContent = '🍎';
      if (iosContainer) iosContainer.style.display = 'flex';
    } else if (type === 'success') {
      if (modalIcon) modalIcon.textContent = '🎉';
      if (iosContainer) iosContainer.style.display = 'none';
    } else {
      if (modalIcon) modalIcon.textContent = '📲';
      if (iosContainer) iosContainer.style.display = 'none';
    }

    modal.classList.add('show');
  }

  const closePwaModalBtn = document.getElementById('closePwaModalBtn');
  if (closePwaModalBtn) {
    closePwaModalBtn.onclick = () => {
      const modal = document.getElementById('pwaInstallModal');
      if (modal) modal.classList.remove('show');
    };
  }

// ==================== إعدادات الأذكار ====================
  const SETTINGS_KEY = 'hayat_dhikr_settings';
  const DEFAULT_SETTINGS = {
    displayMode: 'vertical',
    fontSize: 21,
    fontFamily: "'Amiri', serif",
    vibrateOnZero: true,
    vibrateZeroIntensity: 2, // 1: خفيف | 2: متوسط | 3: قوي
    vibrateOnClick: false,
    hideOnZero: true,
    dismissAnimation: 'slide-up',
    tapAnywhere: true,
    confirmExit: true,
    quickScrollButtons: true,
    autoScrollEnabled: false,
    autoScrollSpeed: 1.0,
    undoButtonEnabled: true
  };

  let dhikrSettings = JSON.parse(localStorage.getItem(SETTINGS_KEY)) || DEFAULT_SETTINGS;
  if (!dhikrSettings.dismissAnimation) dhikrSettings.dismissAnimation = 'slide-up';
  if (dhikrSettings.quickScrollButtons === undefined) dhikrSettings.quickScrollButtons = true;
  if (dhikrSettings.vibrateZeroIntensity === undefined) dhikrSettings.vibrateZeroIntensity = 2;
  if (dhikrSettings.autoScrollEnabled === undefined) dhikrSettings.autoScrollEnabled = false;
  if (dhikrSettings.autoScrollSpeed === undefined) dhikrSettings.autoScrollSpeed = 1.0;
  if (dhikrSettings.undoButtonEnabled === undefined) dhikrSettings.undoButtonEnabled = true;

  function saveSettings() {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(dhikrSettings));
  }
  
  // ==================== 1. نظام عزل المعرفات وحفظ البيانات ====================
  const SAVED_VERSION_KEY = 'hayat_azkar_version';
  const currentVersion = localStorage.getItem(SAVED_VERSION_KEY);

  let azkarState = [];
  if (currentVersion !== AZKAR_DATA_VERSION) {
    const oldData = JSON.parse(localStorage.getItem('hayat_azkar_data') || '[]');
    const customUserGroups = oldData.filter(g => g.id.startsWith('user_cat_'));
    azkarState = [...DEFAULT_AZKAR_DATA, ...customUserGroups];
    localStorage.setItem('hayat_azkar_data', JSON.stringify(azkarState));
    localStorage.setItem(SAVED_VERSION_KEY, AZKAR_DATA_VERSION);
  } else {
    azkarState = JSON.parse(localStorage.getItem('hayat_azkar_data')) || DEFAULT_AZKAR_DATA;
  }
  window.azkarState = azkarState; // ربط دائم للذاكرة الحية

  function saveAzkarState() {
    localStorage.setItem('hayat_azkar_data', JSON.stringify(azkarState));
    window.azkarState = azkarState;
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

  const screenTasbeeh = document.getElementById('screen-tasbeeh');
  const openTasbeehTileBtn = document.getElementById('openTasbeehTileBtn');
  const backToHomeFromTasbeehBtn = document.getElementById('backToHomeFromTasbeehBtn');

  if (openTasbeehTileBtn && screenTasbeeh) {
    openTasbeehTileBtn.addEventListener('click', () => {
      showScreen(screenTasbeeh);
      if (typeof initTasbeehEngine === 'function') initTasbeehEngine();
    });
  }
  if (backToHomeFromTasbeehBtn) {
    backToHomeFromTasbeehBtn.addEventListener('click', () => {
      showScreen(screenHome);
    });
  }

  //

  const screenCalendar = document.getElementById('screen-calendar');
  const openCalendarTileBtn = document.getElementById('openCalendarTileBtn');
  const backToHomeFromCalendarBtn = document.getElementById('backToHomeFromCalendarBtn');

  if (openCalendarTileBtn && screenCalendar) {
    openCalendarTileBtn.addEventListener('click', () => {
      showScreen(screenCalendar);
      if (typeof window.initCalendarEngine === 'function') window.initCalendarEngine();
    });
  }
  if (backToHomeFromCalendarBtn) {
    backToHomeFromCalendarBtn.addEventListener('click', () => showScreen(screenHome));
  }

  const screenOtherSettings = document.getElementById('screen-other-settings');
  const openOtherSettingsBtn = document.getElementById('openOtherSettingsBtn');
  const backToSettingsFromOtherBtn = document.getElementById('backToSettingsFromOtherBtn');

  if (openOtherSettingsBtn && screenOtherSettings) {
    openOtherSettingsBtn.addEventListener('click', () => showScreen(screenOtherSettings));
  }
  if (backToSettingsFromOtherBtn) {
    backToSettingsFromOtherBtn.addEventListener('click', () => showScreen(screenGeneralSettings));
  }

  // فتح شاشة مدير التنبيهات من شبكة الأدوات
  const openAlarmHubTileBtn = document.getElementById('openAlarmHubTileBtn');
  const screenAlarmHub = document.getElementById('screen-alarm-hub');
  const backFromAlarmHubBtn = document.getElementById('backFromAlarmHubBtn');

  if (openAlarmHubTileBtn && screenAlarmHub) {
    openAlarmHubTileBtn.onclick = () => {
      if (typeof syncAllAlarmsToHub === 'function') syncAllAlarmsToHub();
      showScreen(screenAlarmHub);
    };
  }
  if (backFromAlarmHubBtn) {
    backFromAlarmHubBtn.onclick = () => showScreen(screenHome);
  }

  // ربط صفوف الصلوات بالشاشة الرئيسية لفتح إعدادات أذان تلك الصلاة عند النقر
  document.querySelectorAll('.prayer-row').forEach(row => {
    row.style.cursor = 'pointer';
    row.addEventListener('click', (e) => {
      if (e.target.closest('.custom-checkbox')) return; // تجاهل مربع الصح ليبقى مخصصاً للتحقق
      const prayerKeyRaw = row.getAttribute('data-prayer');
      const keyMap = { fajr: 'Fajr', sunrise: 'Sunrise', dhuhr: 'Dhuhr', asr: 'Asr', maghrib: 'Maghrib', isha: 'Isha' };
      const selectedKey = keyMap[prayerKeyRaw] || 'Maghrib';
      if (typeof window.openPrayerAlarmSettings === 'function') {
        window.openPrayerAlarmSettings(selectedKey);
      }
    });
  });

  // شاشات إعدادات مواقيت الصلاة وتعديل الدقائق
  const screenPrayerSettings = document.getElementById('screen-prayer-settings');
  const screenPrayerOffsets = document.getElementById('screen-prayer-offsets');
  const openPrayerSettingsBtn = document.getElementById('openPrayerSettingsBtn');
  const backToGeneralSettingsFromPrayerBtn = document.getElementById('backToGeneralSettingsFromPrayerBtn');
  const openPrayerOffsetsScreenBtn = document.getElementById('openPrayerOffsetsScreenBtn');
  const backToPrayerSettingsFromOffsetsBtn = document.getElementById('backToPrayerSettingsFromOffsetsBtn');

  if (openPrayerSettingsBtn && screenPrayerSettings) {
    openPrayerSettingsBtn.addEventListener('click', () => {
      if (typeof syncPrayerSettingsUI === 'function') syncPrayerSettingsUI();
      showScreen(screenPrayerSettings);
    });
  }
  if (backToGeneralSettingsFromPrayerBtn) {
    backToGeneralSettingsFromPrayerBtn.addEventListener('click', () => showScreen(screenGeneralSettings));
  }
  if (openPrayerOffsetsScreenBtn && screenPrayerOffsets) {
    openPrayerOffsetsScreenBtn.addEventListener('click', () => {
      if (typeof syncPrayerSettingsUI === 'function') syncPrayerSettingsUI();
      showScreen(screenPrayerOffsets);
    });
  }
  if (backToPrayerSettingsFromOffsetsBtn) {
    backToPrayerSettingsFromOffsetsBtn.addEventListener('click', () => showScreen(screenPrayerSettings));
  }

  // تصدير دالة التنقل لتكون متاحة لجميع الملفات
  window.showScreen = showScreen;
  
  //
  
  const openFavTileBtn = document.getElementById('openFavTileBtn');
  const backToHomeBtn = document.getElementById('backToHomeBtn');
  const backToCategoriesBtn = document.getElementById('backToCategoriesBtn');
  const backToCategoriesFromFavBtn = document.getElementById('backToCategoriesFromFavBtn');

  // ==================== نظام التنقل المتكامل ومنطق الخروج المحصور بالرئيسية ====================
  let lastExitAttemptTime = 0;
  let exitToastTimer = null;

  function showExitToast() {
    const toast = document.getElementById('exitToastBanner');
    if (!toast) return;
    toast.classList.add('show');
    clearTimeout(exitToastTimer);
    exitToastTimer = setTimeout(() => {
      hideExitToast();
      // تصفير عداد الوقت فور اختفاء الرسالة ليمنع الخروج المفاجئ بعد مرور الثواني
      lastExitAttemptTime = 0;
    }, 2000);
  }

  function hideExitToast() {
    const toast = document.getElementById('exitToastBanner');
    if (toast) toast.classList.remove('show');
  }

  // تهيئة مصد الأمان عند الفتح
  if (!location.hash || location.hash === '#root') {
    history.replaceState({ screenId: 'screen-home', isRoot: true }, '', '#root');
    history.pushState({ screenId: 'screen-home' }, '', '#app');
  }

  function showScreen(screen, pushToHistory = true) {
    if (!screen) return;
    const activeScreen = document.querySelector('.screen-view.active');
    
    if (pushToHistory && activeScreen && activeScreen !== screen) {
      const hashTag = screen === screenHome ? '#app' : '#' + screen.id.replace('screen-', '');
      // تسجيل كل شاشة في السجل بخطوة مستقلة لتمكين الرجوع السلس إليها
      history.pushState({ screenId: screen.id }, '', hashTag);
    }

    // حفظ الشاشة النشطة
    localStorage.setItem('hayat_last_active_screen_id', screen.id);

    document.querySelectorAll('.screen-view').forEach(s => s.classList.remove('active'));
    screen.classList.add('active');
    
    // تصفير التمرير لتبدأ الشاشة دائماً من الأعلى على الجوال والكمبيوتر
    window.scrollTo(0, 0);
    const appContainer = document.querySelector('.app-container');
    if (appContainer) {
      appContainer.scrollTop = 0;
    }

    // تفريغ مربع بحث المناسبات تلقائياً عند مغادرة شاشة التقويم
    if (screen.id !== 'screen-calendar') {
      const compSearch = document.getElementById('comprehensiveSearchInput');
      if (compSearch && compSearch.value) {
        compSearch.value = '';
        if (typeof renderComprehensiveOccasions === 'function') renderComprehensiveOccasions();
      }
    }

    // إخفاء شريط التبويبات السفلي تلقائياً داخل المسبحة
    const bottomNavEl = document.querySelector('.bottom-nav');
    if (bottomNavEl) {
      if (screen.id === 'screen-tasbeeh') {
        bottomNavEl.classList.add('nav-hidden');
      } else {
        bottomNavEl.classList.remove('nav-hidden');
      }
    }

    // تنشيط التبويب المطابق في شريط التبويب السفلي
    document.querySelectorAll('.bottom-nav .nav-item').forEach(i => i.classList.remove('active'));
    const tabQiblaEl = document.getElementById('tabQibla');

    if (screen === screenHome) {
      if (tabHome) tabHome.classList.add('active');
    } else if (screen === screenAzkarCategories || screen === screenAzkarFavorites || screen === screenAzkarReader) {
      if (tabAzkar) tabAzkar.classList.add('active');
    } else if (screen.id === 'screen-qibla') {
      if (tabQiblaEl) tabQiblaEl.classList.add('active');
    } else if (screen === screenGeneralSettings || screen === screenAboutApp) {
      if (tabGeneralSettings) tabGeneralSettings.classList.add('active');
    }
  }

  // التقاط إيماءة الرجوع (سحب الحافة أو زر العودة في الجوال)
  let isClosingStudioSafely = false;

  window.addEventListener('popstate', () => {
    // 0. إذا كان الرجوع بسبب إغلاق الاستوديو: التوقف فوراً والبقاء في شاشة قراءة الأذكار
    if (isClosingStudioSafely) {
      isClosingStudioSafely = false;
      return;
    }

    // فحص الاستوديو وإغلاقه فورياً بسحب الحافة دون أي تعليق
    const studioModal = document.getElementById('dhikrImageStudioModal');
    if (studioModal && (studioModal.classList.contains('show') || studioModal.style.display === 'flex')) {
      studioModal.classList.remove('show');
      studioModal.style.display = 'none'; // إخفاء صريح ينهي المشكلة تماماً
      return;
    }

    const activeScreen = document.querySelector('.screen-view.active');

    // 1. إذا كانت هناك نافذة منبثقة مفتوحة، الرجوع يغلقها أولاً دون مغادرة الشاشة
    const openModal = document.querySelector('.custom-modal-backdrop.show, .bottom-sheet-backdrop.show');
    if (openModal) {
      openModal.classList.remove('show');
      if (typeof unlockBackgroundScroll === 'function') unlockBackgroundScroll();
      history.pushState({ screenId: activeScreen ? activeScreen.id : 'screen-home' }, '', location.hash || '#app');
      return;
    }

    // 2. إذا كان المستخدم في شاشات الإعدادات الفرعية، الرجوع يعيده للشاشة السابقة بسلاسة
    if (activeScreen === screenAboutApp || (typeof screenOtherSettings !== 'undefined' && activeScreen === screenOtherSettings) || activeScreen === screenPrayerSettings) {
      showScreen(screenGeneralSettings, false);
      return;
    }
    if (activeScreen === screenPrayerOffsets) {
      showScreen(screenPrayerSettings, false);
      return;
    }

    // 3. إذا كان المستخدم في شاشة قراءة الأذكار: الرجوع يعيده للشاشة التي دخل منها (المفضلة أو الأذكار)
    if (activeScreen === screenAzkarReader) {
      const category = azkarState.find(c => c.id === currentActiveCategoryId);
      if (category && category.items && category.items.length > 0) {
        const isAllDone = category.items.every(it => it.currentCount === 0);
        if (!isAllDone && dhikrSettings.confirmExit) {
          history.pushState({ screenId: 'screen-azkar-reader' }, '', '#azkar-reader');
          document.getElementById('exitConfirmModal').classList.add('show');
          return;
        }
      }
      if (typeof readerSourceScreen !== 'undefined' && readerSourceScreen === screenAzkarFavorites) {
        showScreen(screenAzkarFavorites, false);
        renderFavorites();
      } else {
        showScreen(screenAzkarCategories, false);
        renderAzkarCategories();
      }
      return;
    }

    // 4. إذا كان في شاشة المفضلة، الرجوع يعيده للشاشة التي دخل منها (الرئيسية أو أذكار المسلم)
    if (activeScreen === screenAzkarFavorites) {
      if (typeof favoritesSourceScreen !== 'undefined' && favoritesSourceScreen === screenAzkarCategories) {
        showScreen(screenAzkarCategories, false);
        renderAzkarCategories();
      } else {
        showScreen(screenHome, false);
      }
      return;
    }

    // 5. إذا كان المستخدم في أي شاشة أخرى غير الرئيسية (التقويم، المسبحة، القبلة، الأذكار، الإعدادات)، الرجوع يعيده للرئيسية بسلاسة
    if (activeScreen && activeScreen !== screenHome) {
      showScreen(screenHome, false);
      return;
    }

    // 6. إذا كان المستخدم يقف فعلياً داخل "الشاشة الرئيسية": تفعيل خوارزمية الخروج المزدوج
    if (!activeScreen || activeScreen === screenHome) {
      const now = Date.now();
      if (lastExitAttemptTime > 0 && (now - lastExitAttemptTime < 2000)) {
        // الضغطة الثانية المؤكدة خلال ثانيتين: خروج فوري ونهائي
        hideExitToast();
        lastExitAttemptTime = 0;
        try { window.close(); } catch(e) {}
        history.back();
      } else {
        // الضغطة الأولى: إظهار التنبيه + التمرير لأعلى الصفحة + تثبيت مصد الخروج
        lastExitAttemptTime = now;
        history.pushState({ screenId: 'screen-home' }, '', '#app');

        window.scrollTo({ top: 0, behavior: 'smooth' });
        const appContainer = document.querySelector('.app-container');
        if (appContainer) appContainer.scrollTo({ top: 0, behavior: 'smooth' });

        showExitToast();
      }
      return;
    }
  });

  let pendingExitTargetScreen = null;

  // دالة فحص أمان مغادرة الأذكار قبل الخروج عبر أي تبويب سفلي
  function attemptNavigateFromTabs(targetScreen, callback = null) {
    const activeScreen = document.querySelector('.screen-view.active');
    
    // إذا كان المستخدم يقرأ داخل صفحة الأذكار
    if (activeScreen === screenAzkarReader) {
      const allAzkar = window.azkarState || azkarState;
      const category = allAzkar.find(c => c.id === currentActiveCategoryId);

      if (category && category.items && category.items.length > 0) {
        const isAllDone = category.items.every(it => it.currentCount === 0);
        
        // إذا لم ينتهِ من القراءة وخيار تأكيد الخروج مفعّل في الإعدادات
        if (!isAllDone && dhikrSettings.confirmExit) {
          pendingExitTargetScreen = { screen: targetScreen, cb: callback };
          const exitModal = document.getElementById('exitConfirmModal');
          if (exitModal) exitModal.classList.add('show');
          return; // منع الانتقال لحين تأكيد المستخدم
        }
      }
    }

    // الانتقال المباشر إذا لم يكن هناك قراءة غير مكتملة
    showScreen(targetScreen);
    if (callback) callback();
  }

  // 1. تبويب الرئيسية
  if (tabHome) {
    tabHome.addEventListener('click', (e) => {
      e.preventDefault();
      attemptNavigateFromTabs(screenHome);
    });
  }

  // 2. تبويب القبلة
  const tabQiblaBtn = document.getElementById('tabQibla');
  const screenQiblaView = document.getElementById('screen-qibla');
  if (tabQiblaBtn && screenQiblaView) {
    tabQiblaBtn.addEventListener('click', (e) => {
      e.preventDefault();
      attemptNavigateFromTabs(screenQiblaView, () => {
        if (typeof initQiblaCompass === 'function') initQiblaCompass();
      });
    });
  }

  const backFromQiblaBtn = document.getElementById('backToHomeFromQiblaBtn');
  if (backFromQiblaBtn) {
    backFromQiblaBtn.addEventListener('click', () => {
      if (typeof stopQiblaCompass === 'function') stopQiblaCompass();
      showScreen(screenHome);
    });
  }

  // 3. تبويب وشاشة الإعدادات العامة
  if (openGeneralSettingsBtn) openGeneralSettingsBtn.addEventListener('click', () => showScreen(screenGeneralSettings));
  if (tabGeneralSettings) {
    tabGeneralSettings.addEventListener('click', (e) => {
      e.preventDefault();
      attemptNavigateFromTabs(screenGeneralSettings);
    });
  }
  if (backToHomeFromSettingsBtn) backToHomeFromSettingsBtn.addEventListener('click', () => showScreen(screenHome));

  // زر تثبيت التطبيق في شاشة الإعدادات
  const installPwaBtn = document.getElementById('installPwaBtn');
  if (installPwaBtn) {
    installPwaBtn.addEventListener('click', async () => {
      // 1. فحص هل التطبيق مفتوح بالفعل كنسخة مثبتة (Standalone)
      if (isRunningStandalone) {
        showPwaModal('installed', 'التطبيق مثبت بالفعل ✓', 'تطبيق "الحياة الطيبة" مثبت بالفعل على جهازك وأنت تعمل به الآن كنسخة مستقلة وأصلية بكامل المزايا.');
        return;
      }

      // 2. إذا كان الجهاز آيفون أو آيباد (iOS Safari)
      // تفعيل زر تحميل APK للأندرويد
  const downloadAndroidApkBtn = document.getElementById('downloadAndroidApkBtn');
  if (downloadAndroidApkBtn) {
    downloadAndroidApkBtn.addEventListener('click', () => {
      if (APP_CONFIG.apkDownloadUrl && !APP_CONFIG.apkDownloadUrl.includes('your-username')) {
        window.open(APP_CONFIG.apkDownloadUrl, '_blank');
      } else {
        // رسالة إرشادية في حال لم يضع الرابط بعد
        showPwaModal('manual', 'تحميل تطبيق الأندرويد (APK)', 'سيتاح رابط التحميل المباشر لملف APK قريباً عبر تحديثات الـ Releases.');
      }
    });
  }

  // تفعيل زر الآيفون الذكي (يفتح خطوات التثبيت المجاني حالياً أو المتجر مستقبلاً)
  const installIosAppBtn = document.getElementById('installIosAppBtn');
  if (installIosAppBtn) {
    // إذا توفر رابط متجر آبل مستقبلاً يتغير شكل الزر تلقائياً
    if (APP_CONFIG.appStoreUrl) {
      const iosTitle = document.getElementById('iosCardTitle');
      const iosBadge = document.getElementById('iosCardBadge');
      if (iosTitle) iosTitle.textContent = 'تحميل من متجر App Store';
      if (iosBadge) iosBadge.textContent = 'App Store 🍏';
    }

    installIosAppBtn.addEventListener('click', () => {
      if (APP_CONFIG.appStoreUrl) {
        window.open(APP_CONFIG.appStoreUrl, '_blank');
      } else {
        showPwaModal('ios', 'تثبيت التطبيق على الآيفون', 'لتثبيت التطبيق على هاتف الآيفون مجاناً وإضافته للشاشة الرئيسية بجوار تطبيقاتك، اتبع الخطوات البسيطة التالية:');
      }
    });
  }

      // 3. أجهزة أندرويد ومتصفحات الكمبيوتر (Chrome / Edge)
      if (deferredPwaPrompt) {
        // إطلاق نافذة التثبيت الرسمية للنظام بنقرة زر واحدة
        deferredPwaPrompt.prompt();
        const { outcome } = await deferredPwaPrompt.userChoice;
        if (outcome === 'accepted') {
          localStorage.setItem('hayat_pwa_installed', 'true');
          updateInstallButtonUI(true);
        }
        deferredPwaPrompt = null;
      } else {
        // إذا كان مثبتاً مسبقاً أو لم يجهز المتصفح الطلب
        if (localStorage.getItem('hayat_pwa_installed') === 'true') {
          showPwaModal('installed', 'التطبيق مثبت مسبقاً', 'التطبيق مثبت بالفعل على جهازك، يمكنك فتحه مباشرة من شاشة هاتفك الرئيسية أو قائمة التطبيقات.');
        } else {
          showPwaModal('manual', 'تثبيت التطبيق', 'يمكنك تثبيت التطبيق بنقرة واحدة عبر الضغط على خيارات المتصفح (⋮) ثم اختيار "تثبيت التطبيق" أو "إضافة إلى الشاشة الرئيسية".');
        }
      }
    });
  }
  
  if (openAboutScreenBtn) openAboutScreenBtn.addEventListener('click', () => showScreen(screenAboutApp));
  if (backToSettingsFromAboutBtn) backToSettingsFromAboutBtn.addEventListener('click', () => showScreen(screenGeneralSettings));

  // 4. تبويب أذكار المسلم
  if (tabAzkar) {
    tabAzkar.addEventListener('click', (e) => {
      e.preventDefault();
      attemptNavigateFromTabs(screenAzkarCategories, () => renderAzkarCategories());
    });
  }
  
  // تتبع مصدر الدخول لشاشة المفضلة (الرئيسية أم الأذكار)
  let favoritesSourceScreen = screenHome;

  openAzkarTileBtn.addEventListener('click', () => { showScreen(screenAzkarCategories); renderAzkarCategories(); });
  
  // الدخول للمفضلة من شاشة أذكار المسلم (النجمة الذهبية)
  openFavoritesBtn.addEventListener('click', () => { 
    favoritesSourceScreen = screenAzkarCategories;
    showScreen(screenAzkarFavorites); 
    renderFavorites(); 
  });

  // الدخول للمفضلة من الشاشة الرئيسية (الأيقونة في شبكة الأدوات)
  if (openFavTileBtn) {
    openFavTileBtn.addEventListener('click', () => { 
      favoritesSourceScreen = screenHome;
      showScreen(screenAzkarFavorites); 
      renderFavorites(); 
    });
  }

  // تتبع مصدر الدخول لشاشة قراءة الأذكار (شاشة المفضلة أم شاشة مجموعات الأذكار)
  let readerSourceScreen = screenAzkarCategories;

  // دالة العودة الذكية للمصدر الذي فُتحت منه الأذكار مع تحديث نسب الإنجاز
  function exitReaderToSource() {
    if (readerSourceScreen === screenAzkarFavorites) {
      showScreen(screenAzkarFavorites);
      renderFavorites();
    } else {
      showScreen(screenAzkarCategories);
      renderAzkarCategories();
    }
  }

  backToHomeBtn.addEventListener('click', () => showScreen(screenHome));
  
  // زر الرجوع العلوي داخل شاشة قراءة الأذكار: يعود للشاشة التي دخلت منها
  backToCategoriesBtn.addEventListener('click', () => {
    const category = azkarState.find(c => c.id === currentActiveCategoryId);
    if (category && category.items && category.items.length > 0) {
      const isAllDone = category.items.every(it => it.currentCount === 0);
      if (!isAllDone && dhikrSettings.confirmExit) {
        document.getElementById('exitConfirmModal').classList.add('show');
        return;
      }
    }
    exitReaderToSource();
  });

  // زر الرجوع العلوي في المفضلة: يعود بذكاء للشاشة التي دخلت منها
  backToCategoriesFromFavBtn.addEventListener('click', () => { 
    if (favoritesSourceScreen === screenHome) {
      showScreen(screenHome);
    } else {
      showScreen(screenAzkarCategories);
      renderAzkarCategories();
    }
  });

  // ==================== 4. بناء شبكة مجموعات الأذكار ====================
  const azkarGroupsContainer = document.getElementById('azkarGroupsContainer');
  let currentActiveCategoryId = null;

  function renderAzkarCategories(filterQuery = '') {
    // قراءة أحدث بيانات من LocalStorage فوراً لمزامنة أي إضافات تمت من المسبحة
    try {
      azkarState = JSON.parse(localStorage.getItem('hayat_azkar_data')) || DEFAULT_AZKAR_DATA;
      window.azkarState = azkarState;
    } catch (e) {}

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

// ==================== محرك التصفير التلقائي واليدوي لجميع عدادات الأذكار ====================
  
  // 1. دالة التصفير الشامل لجميع عدادات الأذكار
  function performGlobalAzkarReset(updateUI = true) {
    try {
      azkarState = JSON.parse(localStorage.getItem('hayat_azkar_data')) || DEFAULT_AZKAR_DATA;
    } catch (e) {}

    azkarState.forEach(cat => {
      if (cat.items && Array.isArray(cat.items)) {
        cat.items.forEach(it => {
          it.currentCount = it.count;
        });
      }
    });
    saveAzkarState();

    if (updateUI) {
      const activeScreen = document.querySelector('.screen-view.active');
      if (activeScreen === screenAzkarFavorites && typeof renderFavorites === 'function') {
        renderFavorites();
      } else if (typeof renderAzkarCategories === 'function') {
        renderAzkarCategories();
      }
    }
  }

  // 2. فحص وتطبيق التصفير التلقائي عند منتصف الليل بتوقيت مدينة المستخدم (بشكل معزول وآمن 100%)
  function checkAndPerformDailyAzkarReset() {
    let now = new Date();
    try {
      // قراءة آمنة للموقع المحفوظ دون أي تضارب مع متغيرات أخرى
      const savedUserLoc = JSON.parse(localStorage.getItem('hayat_saved_location'));
      if (savedUserLoc && savedUserLoc.timezone) {
        now = new Date(new Date().toLocaleString('en-US', { timeZone: savedUserLoc.timezone }));
      }
    } catch (e) {}

    const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
    const lastResetDay = localStorage.getItem('hayat_last_azkar_reset_day');

    if (lastResetDay !== todayStr) {
      performGlobalAzkarReset(true);
      localStorage.setItem('hayat_last_azkar_reset_day', todayStr);
    }
  }

  // تشغيل فحص منتصف الليل فور فتح التطبيق وكل دقيقة أثناء استخدامه
  checkAndPerformDailyAzkarReset();
  setInterval(checkAndPerformDailyAzkarReset, 60000);
  document.addEventListener('visibilitychange', () => {
    if (!document.hidden) checkAndPerformDailyAzkarReset();
  });

  // ==================== أحداث القائمة المنسدلة (⋮) والبحث وتأكيد التصفير ====================
  const categoryMenuBtn = document.getElementById('categoryMenuBtn');
  const categoryDropdownMenu = document.getElementById('categoryDropdownMenu');
  const menuSearchAzkarBtn = document.getElementById('menuSearchAzkarBtn');
  const menuResetAllAzkarBtn = document.getElementById('menuResetAllAzkarBtn');
  const favResetAllAzkarBtn = document.getElementById('favResetAllAzkarBtn');

  const categorySearchBar = document.getElementById('categorySearchBar');
  const categorySearchInput = document.getElementById('categorySearchInput');
  const clearCategorySearchBtn = document.getElementById('clearCategorySearchBtn');

  const resetAllAzkarConfirmModal = document.getElementById('resetAllAzkarConfirmModal');
  const cancelResetAllAzkarBtn = document.getElementById('cancelResetAllAzkarBtn');
  const confirmResetAllAzkarBtn = document.getElementById('confirmResetAllAzkarBtn');

  // فتح وإغلاق القائمة المنسدلة لشاشة الأذكار
  if (categoryMenuBtn && categoryDropdownMenu) {
    categoryMenuBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      categoryDropdownMenu.classList.toggle('show');
    });
    document.addEventListener('click', () => categoryDropdownMenu.classList.remove('show'));
  }

  // زر البحث من القائمة المنسدلة
  if (menuSearchAzkarBtn && categorySearchBar) {
    menuSearchAzkarBtn.addEventListener('click', () => {
      if (categoryDropdownMenu) categoryDropdownMenu.classList.remove('show');
      categorySearchBar.classList.toggle('active');
      if (categorySearchBar.classList.contains('active') && categorySearchInput) {
        categorySearchInput.focus();
      } else if (categorySearchInput) {
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

  if (clearCategorySearchBtn && categorySearchInput) {
    clearCategorySearchBtn.addEventListener('click', () => {
      categorySearchInput.value = '';
      renderAzkarCategories('');
      categorySearchInput.focus();
    });
  }

  // فتح نافذة تأكيد التصفير من أذكار المسلم أو المفضلة
  const openResetConfirmHandler = () => {
    if (categoryDropdownMenu) categoryDropdownMenu.classList.remove('show');
    const favDropdownMenuEl = document.getElementById('favDropdownMenu');
    if (favDropdownMenuEl) favDropdownMenuEl.classList.remove('show');
    if (resetAllAzkarConfirmModal) resetAllAzkarConfirmModal.classList.add('show');
  };

  if (menuResetAllAzkarBtn) menuResetAllAzkarBtn.addEventListener('click', openResetConfirmHandler);
  if (favResetAllAzkarBtn) favResetAllAzkarBtn.addEventListener('click', openResetConfirmHandler);

  // زر التراجع الافتراضي (إغلاق النافذة والبقاء في نفس المكان)
  if (cancelResetAllAzkarBtn && resetAllAzkarConfirmModal) {
    cancelResetAllAzkarBtn.addEventListener('click', () => {
      resetAllAzkarConfirmModal.classList.remove('show');
    });
  }

  // زر تأكيد التصفير (تصفير جميع العدادات والبقاء في نفس الشاشة)
  if (confirmResetAllAzkarBtn && resetAllAzkarConfirmModal) {
    confirmResetAllAzkarBtn.addEventListener('click', () => {
      performGlobalAzkarReset(true);
      resetAllAzkarConfirmModal.classList.remove('show');
    });
  }

  // دالة استخراج عدد الحروف الخام وتجريد الذكر من التشكيل والمسافات لعموم التطبيق
  function getRawArabicCharCount(text) {
    if (!text) return 0;
    return text.replace(/[\u064B-\u065F\u0670\u0640\s]/g, '').length;
  }

  // بطاقة المجموعة المشتركة بميزان الحروف والتكرار الدقيق
  function createCategoryCard(group) {
    const totalItems = group.items ? group.items.length : 0;
    let totalWeight = 0;
    let completedWeight = 0;
    let isStarted = false;
    let allItemsZero = totalItems > 0;

    // احتساب ميزان القراءة الحقيقي: (حروف الذكر الخام × التكرارات المنجزة فعلياً)
    if (totalItems > 0) {
      group.items.forEach(it => {
        const charCount = Math.max(1, getRawArabicCharCount(it.text));
        const totalReps = it.count || 1;
        const remainingReps = Math.max(0, (typeof it.currentCount !== 'undefined') ? it.currentCount : totalReps);
        const doneReps = Math.max(0, totalReps - remainingReps);

        if (doneReps > 0) isStarted = true;
        if (remainingReps > 0) allItemsZero = false;

        totalWeight += (totalReps * charCount);
        completedWeight += (doneReps * charCount);
      });
    }

    // نسبة التقدم الموزونة مطابقة 100% للشريط الداخلي
    const progressPercent = totalWeight > 0 ? Math.min(100, Math.round((completedWeight / totalWeight) * 100)) : 0;
    const isCompleted = totalItems > 0 && allItemsZero && progressPercent === 100;
    const card = document.createElement('div');
    card.className = `azkar-group-card ${isCompleted ? 'completed' : ''}`;
    card.innerHTML = `
      <div class="azkar-group-progress-fill" style="width: ${progressPercent}%;"></div>
      ${isCompleted ? '<div class="group-completed-badge">✓</div>' : ''}
      <span class="azkar-group-title">${group.name}</span>
    `;

    // نظام رصد النقر المطوّل (مع التجميد التام أثناء وضع ترتيب المفضلة)
    let pressTimer = null;
    let isLongPress = false;
    let startX = 0;
    let startY = 0;

    const startPress = (e) => {
      // 1. تجميد ومنع ظهور نافذة الخيارات المنبثقة أثناء تفعيل وضع ترتيب المفضلة
      const activeScreen = document.querySelector('.screen-view.active');
      if (isFavReorderMode && activeScreen === screenAzkarFavorites) {
        return;
      }

      isLongPress = false;
      if (e.type === 'touchstart') {
        startX = e.touches[0].clientX;
        startY = e.touches[0].clientY;
      }
      pressTimer = setTimeout(() => {
        isLongPress = true;
        if (navigator.vibrate) navigator.vibrate(45);
        openGroupLongPressModal(group, isStarted);
      }, 550);
    };

    const cancelPress = (e) => {
      if (e.type === 'touchmove') {
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

    // النقر العادي (مع تجميد فتح الشاشة أثناء وضع ترتيب المفضلة)
    card.addEventListener('click', (e) => {
      // 2. تجميد النقر العادي ومنع فتح شاشة القراءة بالخطأ أثناء الترتيب
      const activeScreen = document.querySelector('.screen-view.active');
      if (isFavReorderMode && activeScreen === screenAzkarFavorites) {
        e.preventDefault();
        e.stopPropagation();
        return;
      }

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

  // بناء شبكة المفضلة مع دعم السحب الشبكي الرباعي الأبعاد (أعلى، أسفل، يمين، يسار)
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

    if (isFavReorderMode) {
      const hint = document.createElement('div');
      hint.className = 'reorder-hint-banner';
      hint.style.gridColumn = 'span 2';
      hint.innerHTML = '<span>💡 اضغط مطولاً على أي بطاقة واسحبها بأي اتجاه، أو استخدم الأسهم:</span>';
      favoritesGroupsContainer.appendChild(hint);
    }

    favGroups.forEach((group, index) => {
      const cardWrap = document.createElement('div');
      cardWrap.className = 'fav-card-wrapper';
      cardWrap.setAttribute('data-fav-index', index);
      cardWrap.style.cssText = 'position: relative; transition: transform 0.2s ease;';

      const card = createCategoryCard(group);
      cardWrap.appendChild(card);

      if (isFavReorderMode) {
        const reorderBar = document.createElement('div');
        reorderBar.style.cssText = 'position: absolute; top: -8px; left: 4px; display: flex; align-items: center; gap: 4px; z-index: 20;';
        
        // مقبض سحب رباعي الأبعاد
        const grip = document.createElement('span');
        grip.className = 'drag-grip-handle';
        grip.innerHTML = '⠿ سحب';
        reorderBar.appendChild(grip);

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

        // محرك السحب الشبكي التفاعلي باللمس والفأرة في كافة الاتجاهات الأربعة
        setup2DGridDragAndDrop(cardWrap, index);
      }

      favoritesGroupsContainer.appendChild(cardWrap);
    });
  }

  // محرك السحب والإفلات الشبكي للمفضلة (أعلى، أسفل، يمين، يسار)
  function setup2DGridDragAndDrop(el, fromIndex) {
    let pressTimer = null;
    let isDragging = false;
    let startX = 0, startY = 0;

    const onStart = (clientX, clientY) => {
      startX = clientX;
      startY = clientY;
      pressTimer = setTimeout(() => {
        isDragging = true;
        if (navigator.vibrate) navigator.vibrate(35);
        el.classList.add('is-dragging');
      }, 200); // ضغطة مطولة 200ms لبدء السحب
    };

    const onMove = (e, clientX, clientY) => {
      if (!isDragging) {
        if (Math.abs(clientX - startX) > 10 || Math.abs(clientY - startY) > 10) {
          clearTimeout(pressTimer);
        }
        return;
      }
      e.preventDefault(); // منع تمرير الصفحة أثناء سحب البطاقة

      // رصد العنصر المتواجد تحت الإصبع في الشبكة ثنائية الأبعاد
      const targetElement = document.elementFromPoint(clientX, clientY);
      if (!targetElement) return;

      const targetWrapper = targetElement.closest('.fav-card-wrapper');
      if (targetWrapper && targetWrapper !== el) {
        const toIndex = parseInt(targetWrapper.getAttribute('data-fav-index'), 10);
        if (!isNaN(toIndex) && toIndex !== fromIndex) {
          const [movedId] = favoritesIds.splice(fromIndex, 1);
          favoritesIds.splice(toIndex, 0, movedId);
          saveFavorites();
          fromIndex = toIndex;
          renderFavorites();
        }
      }
    };

    const onEnd = () => {
      clearTimeout(pressTimer);
      if (isDragging) {
        isDragging = false;
        el.classList.remove('is-dragging');
        renderFavorites();
      }
    };

    // أحداث لمس الجوال
    el.addEventListener('touchstart', (e) => onStart(e.touches[0].clientX, e.touches[0].clientY), { passive: true });
    window.addEventListener('touchmove', (e) => {
      if (isDragging && e.touches[0]) onMove(e, e.touches[0].clientX, e.touches[0].clientY);
    }, { passive: false });
    window.addEventListener('touchend', onEnd);

    // أحداث الفأرة للكمبيوتر
    el.addEventListener('mousedown', (e) => onStart(e.clientX, e.clientY));
    window.addEventListener('mousemove', (e) => {
      if (isDragging) onMove(e, e.clientX, e.clientY);
    });
    window.addEventListener('mouseup', onEnd);
  }

  function moveFavorite(index, dir) {
    const target = index + dir;
    const temp = favoritesIds[index];
    favoritesIds[index] = favoritesIds[target];
    favoritesIds[target] = temp;
    saveFavorites();
    renderFavorites();
  }

  // نافذة البحث واختيار الأذكار للمفضلة (محمية بشروط أمان دفاعية تمنع أي انهيار)
  const searchFavModal = document.getElementById('searchFavModal');
  const openSearchFavModalBtn = document.getElementById('openSearchFavModalBtn');
  const closeSearchFavBtn = document.getElementById('closeSearchFavBtn');
  const favSearchInput = document.getElementById('favSearchInput');
  const favSearchResultsList = document.getElementById('favSearchResultsList');

  if (openSearchFavModalBtn && searchFavModal) {
    openSearchFavModalBtn.addEventListener('click', () => {
      if (favSearchInput) favSearchInput.value = '';
      renderSearchResults('');
      searchFavModal.classList.add('show');
    });
  }

  if (closeSearchFavBtn && searchFavModal) {
    closeSearchFavBtn.addEventListener('click', () => {
      searchFavModal.classList.remove('show');
      renderFavorites();
    });
  }

  if (favSearchInput) {
    favSearchInput.addEventListener('input', (e) => {
      renderSearchResults(e.target.value.trim());
    });
  }

  function renderSearchResults(query) {
    if (!favSearchResultsList) return;
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
      if (btn) {
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
      }

      favSearchResultsList.appendChild(row);
    });
  }

  // ==================== 6. قراءة وبطاقات الأذكار ====================
  const readerCategoryTitle = document.getElementById('readerCategoryTitle');
  const dhikrCardsContainer = document.getElementById('dhikrCardsContainer');
  let isEditMode = false;
  let isReorderMode = false;

  function openCategoryReader(categoryId, resetCounters = false) {
    // تسجيل الشاشة الحالية كمصدر قبل الانتقال لشاشة القراءة
    const activeCurrentScreen = document.querySelector('.screen-view.active');
    if (activeCurrentScreen && (activeCurrentScreen === screenAzkarFavorites || activeCurrentScreen === screenAzkarCategories)) {
      readerSourceScreen = activeCurrentScreen;
    }

    // مزامنة فورية مع LocalStorage لضمان ظهور الذكر المضاف حديثاً داخل بطاقات القسم
    try {
      azkarState = JSON.parse(localStorage.getItem('hayat_azkar_data')) || DEFAULT_AZKAR_DATA;
      window.azkarState = azkarState;
    } catch (e) {}

    currentActiveCategoryId = categoryId;
    const category = azkarState.find(c => c.id === currentActiveCategoryId);
    if (!category) return;

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

  // دالة استخراج عدد الحروف الخام وتجريد الذكر من التشكيل والمسافات
  function getRawArabicCharCount(text) {
    if (!text) return 0;
    return text.replace(/[\u064B-\u065F\u0670\u0640\s]/g, '').length;
  }

  // تحديث شريط التقدم العلوي بناءً على ميزان: (حروف الذكر الخام × عدد مرات التكرار)
  function updateReaderProgressBar() {
    const category = azkarState.find(c => c.id === currentActiveCategoryId);
    const bar = document.getElementById('readerProgressBar');
    const percentEl = document.getElementById('readerProgressPercent');
    if (!category || !category.items || category.items.length === 0) return;

    let totalWeight = 0;
    let completedWeight = 0;

    category.items.forEach(it => {
      const charCount = Math.max(1, getRawArabicCharCount(it.text));
      const totalReps = it.count || 1;
      const remainingReps = Math.max(0, it.currentCount);
      const doneReps = Math.max(0, totalReps - remainingReps);

      totalWeight += (totalReps * charCount);
      completedWeight += (doneReps * charCount);
    });

    const percent = totalWeight > 0 ? Math.min(100, Math.round((completedWeight / totalWeight) * 100)) : 0;
    if (bar) bar.style.width = `${percent}%`;
    if (percentEl) percentEl.textContent = `${percent}%`;
  }

  function renderDhikrCards() {
    dhikrCardsContainer.innerHTML = '';
    updateReaderProgressBar(); // تحديث فوري لميزان القراءة مع فتح الشاشة
    
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
      card.setAttribute('data-item-id', item.id);
      card.setAttribute('data-card-index', index);
      if (isReorderMode) {
        setupVerticalDhikrDragAndDrop(card, index, category);
      }
      const isDone = item.currentCount === 0;

      const hasLongNote = item.fullNote && item.fullNote.length > 70;
      const notePreview = hasLongNote ? item.fullNote.substring(0, 68) + '...' : (item.fullNote || '');

      card.innerHTML = `
       ${isReorderMode ? `
          <div class="dhikr-reorder-controls" style="display: flex; align-items: center; justify-content: space-between; padding: 6px 12px; background: #F8FAFC; border-bottom: 1px solid #E2E8F0;">
            <span class="drag-grip-handle" data-drag-index="${index}">⠿ اضغط مطولاً واسحب للترتيب</span>
            <div style="display: flex; gap: 6px;">
              ${index > 0 ? `<button type="button" class="reorder-btn" onclick="moveDhikr(${index}, -1)">▲ لأعلى</button>` : ''}
              ${index < category.items.length - 1 ? `<button type="button" class="reorder-btn" onclick="moveDhikr(${index}, 1)">▼ لأسفل</button>` : ''}
            </div>
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

    // ميزة العد بالضغط على أي مكان في البطاقة (شاملة مساحة نص الأجر وفضل الذكر)
    if (dhikrSettings.tapAnywhere && !isDone) {
      card.style.cursor = 'pointer';
      card.addEventListener('click', (e) => {
        // حصر الاستثناء فقط في: أزرار المشاركة والتعديل، زر العداد السفلي، وزر التعجب (!)، وزر التنبيه (⚠️)
        if (
          e.target.closest('.dhikr-card-top-actions') || 
          e.target.closest('.dhikr-counter-btn') ||
          e.target.closest('.virtue-info-btn') ||
          e.target.closest('.alert-badge-btn')
        ) {
          return;
        }

        decrementDhikr(item.id);
      });
    }

    dhikrCardsContainer.appendChild(card);
    });
  }

  // تقليص عداد الذكر (مع تجميد العد تماماً أثناء وضع ترتيب الأذكار)
  window.decrementDhikr = (itemId) => {
    // تجميد العداد كلياً ومنع أي خصم أو اختفاء للكروت أثناء الترتيب
    if (isReorderMode) return;

    const category = azkarState.find(c => c.id === currentActiveCategoryId);
    if (!category) return;
    const item = category.items.find(i => i.id === itemId);
    if (!item || item.currentCount <= 0) return;

    item.currentCount--;

    // تسجيل العملية فوراً في سجل التراجع
    if (typeof pushToUndoStack === 'function') {
      pushToUndoStack(itemId);
    }

    // 1. ارتجاج عند كل ضغطة
    if (dhikrSettings.vibrateOnClick && navigator.vibrate) {
      navigator.vibrate(30);
    }

    // 2. تحديث شريط ميزان الحروف فورياً
    saveAzkarState();
    updateReaderProgressBar();

    // 3. عند وصول العداد للصفر
    if (item.currentCount === 0) {
      if (dhikrSettings.vibrateOnZero && navigator.vibrate) {
        const pattern = VIBRATION_PATTERNS[dhikrSettings.vibrateZeroIntensity || 2] || [120, 60, 150];
        navigator.vibrate(pattern);
      }

      // إذا كان خيار الإخفاء مفعلاً: تشغيل الرسم المتحرك المختار لمدة 440ms
      if (dhikrSettings.hideOnZero) {
        const cardEl = document.querySelector(`.dhikr-card[data-item-id="${itemId}"]`);
        const animStyle = dhikrSettings.dismissAnimation || 'slide-up';
        
        if (cardEl) {
          const btn = cardEl.querySelector('.dhikr-counter-btn');
          if (btn) {
            btn.classList.add('done');
            btn.textContent = '✓ تم';
          }

          // تطبيق رسم الكي-فريم الإجباري
          cardEl.classList.add(`anim-dismiss-${animStyle}`);

          // انتظار اكتمال الحركة بالكامل (440ms) ثم إزالة الكرت وصعود باقي الأذكار بسلاسة
          setTimeout(() => {
            renderDhikrCards();
            checkCategoryCompletion(category);
          }, 440);
          return;
        }
      }
    }

    renderDhikrCards();
    checkCategoryCompletion(category);
  };

  function checkCategoryCompletion(category) {
    const allDone = category.items.every(it => it.currentCount === 0);
    if (allDone) {
      setTimeout(() => {
        const finishModal = document.getElementById('finishModal');
        if (finishModal) finishModal.classList.add('show');
      }, 400);
    }
  }
  
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

  // ==================== استوديو تصميم ومشاركة الأذكار الفردية والجماعية ====================
  let activeDhikrItemForShare = null;
  let activeDhikrCategoryForShare = null;
  let selectedShareFormat = 'image-text'; // 'image-only' | 'image-text' | 'text-tashkeel' | 'text-plain'
  
  // متغيرات المشاركة الجماعية
  let isBatchShareMode = false;
  let batchSelectedDhikrItems = [];

  let studioConfig = {
    ratio: 'square',
    bg: 'royal-navy',
    motif: 'motif-1',
    font: "'AmiriLocal', serif",
    color: '#FFFFFF',
    textHighlight: false,
    fontSize: 48,
    includeCategory: true,
    includeReps: true,
    includeVirtue: true,
    includeCredit: true,
    includeLink: true
  };

  function stripArabicTashkeel(text) {
    if (!text) return '';
    return text.replace(/[\u064B-\u065F\u0670\u0640]/g, '').trim();
  }

  // عناصر واجهة المشاركة
  const dhikrShareModal = document.getElementById('dhikrShareModal');
  const closeDhikrShareBtn = document.getElementById('closeDhikrShareBtn');
  const confirmDhikrShareActionBtn = document.getElementById('confirmDhikrShareActionBtn');
  const shareFormatCards = document.querySelectorAll('.share-format-card');
  const toggleShareIncludeCategory = document.getElementById('toggleShareIncludeCategory');
  const toggleShareIncludeReps = document.getElementById('toggleShareIncludeReps');
  const toggleShareIncludeVirtue = document.getElementById('toggleShareIncludeVirtue');
  const toggleShareIncludeCredit = document.getElementById('toggleShareIncludeCredit');
  const toggleShareIncludeLink = document.getElementById('toggleShareIncludeLink');
  const shareLinkSubRow = document.getElementById('shareLinkSubRow');

  const batchShareRangeContainer = document.getElementById('batchShareRangeContainer');
  const batchShareStartSelect = document.getElementById('batchShareStartSelect');
  const batchShareEndSelect = document.getElementById('batchShareEndSelect');
  const batchSelectedCountBadge = document.getElementById('batchSelectedCountBadge');
  const batchImageLimitNotice = document.getElementById('batchImageLimitNotice');
  const openBatchShareModalBtn = document.getElementById('openBatchShareModalBtn');

  // 1. فتح نافذة المشاركة الفردية لذكر واحد
  window.shareSpecificDhikr = (itemId) => {
    const category = azkarState.find(c => c.id === currentActiveCategoryId);
    if (!category) return;
    const item = category.items.find(i => i.id === itemId);
    if (!item) return;

    isBatchShareMode = false;
    activeDhikrItemForShare = item;
    activeDhikrCategoryForShare = category;
    batchSelectedDhikrItems = [item];

    if (batchShareRangeContainer) batchShareRangeContainer.style.display = 'none';
    showImageShareOptions(true);

    const previewCatText = document.getElementById('shareCatNamePreviewText');
    if (previewCatText) previewCatText.textContent = `مثل: ${category.name}`;

    const virtueRow = document.getElementById('shareVirtueRow');
    if (virtueRow) virtueRow.style.display = (item.fullNote && item.fullNote.trim().length > 0) ? 'flex' : 'none';

    const repsRow = document.getElementById('shareRepsRow');
    if (repsRow) repsRow.style.display = 'flex';

    if (dhikrShareModal) dhikrShareModal.classList.add('show');
  };

  // 2. فتح نافذة المشاركة الجماعية من القائمة العلوية (⋮)
  if (openBatchShareModalBtn) {
    openBatchShareModalBtn.addEventListener('click', () => {
      const readerDropdown = document.getElementById('readerDropdownMenu');
      if (readerDropdown) readerDropdown.classList.remove('show');

      const category = azkarState.find(c => c.id === currentActiveCategoryId);
      if (!category || !category.items || category.items.length === 0) {
        alert('لا توجد أذكار لمشاركتها في هذا القسم.');
        return;
      }

      isBatchShareMode = true;
      activeDhikrCategoryForShare = category;

      if (batchShareStartSelect && batchShareEndSelect) {
        batchShareStartSelect.innerHTML = '';
        batchShareEndSelect.innerHTML = '';

        category.items.forEach((it, idx) => {
          const shortText = it.text.length > 28 ? it.text.slice(0, 26) + '...' : it.text;
          const optText = `${idx + 1} - ${shortText}`;
          batchShareStartSelect.add(new Option(optText, idx));
          batchShareEndSelect.add(new Option(optText, idx));
        });

        batchShareStartSelect.value = 0;
        batchShareEndSelect.value = Math.min(2, category.items.length - 1);
      }

      if (batchShareRangeContainer) batchShareRangeContainer.style.display = 'block';
      updateBatchRangeStatus();

      const previewCatText = document.getElementById('shareCatNamePreviewText');
      if (previewCatText) previewCatText.textContent = `مثل: ${category.name}`;

      const virtueRow = document.getElementById('shareVirtueRow');
      if (virtueRow) virtueRow.style.display = 'flex';

      const repsRow = document.getElementById('shareRepsRow');
      if (repsRow) repsRow.style.display = 'flex';

      if (dhikrShareModal) dhikrShareModal.classList.add('show');
    });
  }

  function updateBatchRangeStatus() {
    if (!isBatchShareMode || !activeDhikrCategoryForShare) return;
    
    let startIdx = parseInt(batchShareStartSelect.value, 10) || 0;
    let endIdx = parseInt(batchShareEndSelect.value, 10) || 0;

    if (startIdx > endIdx) {
      endIdx = startIdx;
      batchShareEndSelect.value = endIdx;
    }

    const count = (endIdx - startIdx) + 1;
    batchSelectedDhikrItems = activeDhikrCategoryForShare.items.slice(startIdx, endIdx + 1);
    activeDhikrItemForShare = batchSelectedDhikrItems[0];

    if (batchSelectedCountBadge) {
      batchSelectedCountBadge.textContent = `المحدد: ${count} ${count <= 2 ? 'أذكار' : (count <= 10 ? 'أذكار' : 'ذكراً')}`;
    }

    if (count <= 3) {
      showImageShareOptions(true);
      if (batchImageLimitNotice) batchImageLimitNotice.style.display = 'none';
    } else {
      showImageShareOptions(false);
      if (batchImageLimitNotice) batchImageLimitNotice.style.display = 'block';
      
      if (selectedShareFormat.includes('image')) {
        selectedShareFormat = 'text-tashkeel';
        shareFormatCards.forEach(c => {
          c.classList.toggle('active', c.getAttribute('data-type') === 'text-tashkeel');
        });
      }
    }
  }

  function showImageShareOptions(show) {
    shareFormatCards.forEach(c => {
      const type = c.getAttribute('data-type');
      if (type && type.includes('image')) {
        c.style.display = show ? 'flex' : 'none';
      }
    });
  }

  if (batchShareStartSelect) batchShareStartSelect.onchange = updateBatchRangeStatus;
  if (batchShareEndSelect) batchShareEndSelect.onchange = updateBatchRangeStatus;
  if (closeDhikrShareBtn && dhikrShareModal) closeDhikrShareBtn.onclick = () => dhikrShareModal.classList.remove('show');

  if (toggleShareIncludeCredit && shareLinkSubRow) {
    toggleShareIncludeCredit.onchange = (e) => {
      shareLinkSubRow.style.display = e.target.checked ? 'flex' : 'none';
      if (!e.target.checked && toggleShareIncludeLink) toggleShareIncludeLink.checked = false;
      else if (e.target.checked && toggleShareIncludeLink) toggleShareIncludeLink.checked = true;
    };
  }

  shareFormatCards.forEach(card => {
    card.onclick = () => {
      shareFormatCards.forEach(c => c.classList.remove('active'));
      card.classList.add('active');
      selectedShareFormat = card.getAttribute('data-type');
    };
  });

  // تأكيد المشاركة مع دعم الروابط وحمايتها من القص
  if (confirmDhikrShareActionBtn) {
    confirmDhikrShareActionBtn.onclick = () => {
      if (!activeDhikrCategoryForShare) return;

      const activeCard = document.querySelector('.share-format-card.active');
      const formatType = (activeCard ? activeCard.getAttribute('data-type') : selectedShareFormat) || 'image-text';
      const isImageChosen = formatType.includes('image');

      studioConfig.includeCategory = toggleShareIncludeCategory ? toggleShareIncludeCategory.checked : true;
      studioConfig.includeReps = toggleShareIncludeReps ? toggleShareIncludeReps.checked : true;
      studioConfig.includeVirtue = toggleShareIncludeVirtue ? toggleShareIncludeVirtue.checked : true;
      studioConfig.includeCredit = toggleShareIncludeCredit ? toggleShareIncludeCredit.checked : true;
      studioConfig.includeLink = toggleShareIncludeLink ? toggleShareIncludeLink.checked : true;

      const itemsToShare = (isBatchShareMode && batchSelectedDhikrItems.length > 0) 
        ? batchSelectedDhikrItems 
        : [activeDhikrItemForShare];

      if (dhikrShareModal) dhikrShareModal.classList.remove('show');

      if (isImageChosen) {
        openDhikrImageStudio(formatType.includes('text'));
      } else {
        const msg = buildBatchDhikrTextMessage(itemsToShare, formatType === 'text-plain');
        
        // تمرير الرابط في خاصية url الرسمية بالمتصفح لمنع قصه حتى في النصوص الطويلة
        const shareData = {
          title: activeDhikrCategoryForShare.name,
          text: msg
        };
        if (studioConfig.includeCredit && studioConfig.includeLink) {
          shareData.url = APP_CONFIG.url;
        }

        if (navigator.share) {
          navigator.share(shareData).catch(() => {});
        } else {
          navigator.clipboard.writeText(msg + (shareData.url ? `\n\n${shareData.url}` : ''));
          alert('تم نسخ الأذكار المحددة بنجاح لمشاركتها!');
        }
      }
    };
  }

  // صياغة الرسالة النصية المدمجة المحمية من القص
  function buildBatchDhikrTextMessage(itemsList, isPlain = false) {
    let msg = '';
    
    // وضع هوية التطبيق في الترويسة لضمان عدم اختفائها إطلاقاً حتى لو قُص ذيل الرسالة
    if (activeDhikrCategoryForShare) {
      msg += `📖 [ ${activeDhikrCategoryForShare.name} • تطبيق الحياة الطيبة ]\n`;
      msg += `━━━━━━━━━━━━━━━━━━━━━\n\n`;
    }

    itemsList.forEach((it, idx) => {
      const bText = isPlain ? stripArabicTashkeel(it.text) : it.text;
      const pText = it.pre ? (isPlain ? stripArabicTashkeel(it.pre) : it.pre) : '';

      if (itemsList.length > 1) {
        msg += `﴿ ${idx + 1} ﴾\n`;
      }
      if (pText) msg += `${pText}\n`;
      msg += `${bText}\n`;

      if (studioConfig.includeReps) {
        const repCount = it.count || 1;
        msg += `(تكرار: ${repCount} مرة)\n`;
      }

      if (studioConfig.includeVirtue && it.fullNote) {
        const note = isPlain ? stripArabicTashkeel(it.fullNote) : it.fullNote;
        msg += `✨ الفضل: ${note}\n`;
      }

      if (idx < itemsList.length - 1) {
        msg += `\n───────────────\n\n`;
      }
    });

    if (studioConfig.includeCredit) {
      msg += `\n━━━━━━━━━━━━━━━━━━━━━\n`;
      msg += `✨ تطبيق الحياة الطيبة • رفيقك في الطاعة 🌙\n`;
      if (studioConfig.includeLink) {
        msg += `📲 الرابط: ${APP_CONFIG.url}`;
      }
    }
    return msg;
  }

  // ==================== استوديو تصميم الصورة المباشر (المرحلة الثانية) ====================
  const dhikrImageStudioModal = document.getElementById('dhikrImageStudioModal');
  const closeDhikrStudioBtn = document.getElementById('closeDhikrStudioBtn');
  const downloadStudioImageBtn = document.getElementById('downloadStudioImageBtn');
  const executeStudioShareBtn = document.getElementById('executeStudioShareBtn');
  const studioLiveCanvas = document.getElementById('studioLiveCanvas');
  const studioFontSizeSlider = document.getElementById('studioFontSizeSlider');
  const studioFontSizeDisplay = document.getElementById('studioFontSizeDisplay');

  let studioAttachTextWhenSharing = true;

  // احتساب الحجم الافتراضي الذكي مع الفحص المسبق لمنع احتساب الفضل المكرر
  function calculateOptimalDefaultFontSize(isStory, withVirtue) {
    const itemsList = (isBatchShareMode && batchSelectedDhikrItems.length > 1)
      ? batchSelectedDhikrItems
      : (activeDhikrItemForShare ? [activeDhikrItemForShare] : []);

    if (!itemsList.length) return 48;

    let totalChars = 0;
    itemsList.forEach((it, idx) => {
      const rawDhikr = stripArabicTashkeel(it.text).replace(/\s/g, '');
      const rawPre = stripArabicTashkeel(it.pre || '').replace(/\s/g, '');
      
      // احتساب الفضل فقط إذا لم يكن مكرراً مع الذكر التالي (لتكبير خط الآيات)
      let shouldCountVirtue = false;
      if (withVirtue && it.fullNote && it.fullNote.trim().length > 0) {
        const currentClean = stripArabicTashkeel(it.fullNote).replace(/\s/g, '');
        const nextItem = itemsList[idx + 1];
        const nextClean = (nextItem && nextItem.fullNote) ? stripArabicTashkeel(nextItem.fullNote).replace(/\s/g, '') : null;
        if (currentClean !== nextClean) {
          shouldCountVirtue = true;
        }
      }

      const rawVirtue = shouldCountVirtue ? stripArabicTashkeel(it.fullNote).replace(/\s/g, '') : '';
      totalChars += (rawDhikr.length + (rawVirtue.length * 0.7) + rawPre.length);
    });

    let size = 48;
    if (isStory) {
      if (totalChars <= 50) size = 78;
      else if (totalChars <= 100) size = 66;
      else if (totalChars <= 180) size = 56;
      else if (totalChars <= 280) size = 46;
      else if (totalChars <= 420) size = 38;
      else size = 30;
    } else {
      if (totalChars <= 50) size = 66;
      else if (totalChars <= 100) size = 56;
      else if (totalChars <= 180) size = 46;
      else if (totalChars <= 280) size = 38;
      else if (totalChars <= 420) size = 30;
      else size = 25;
    }
    return size;
  }

  function openDhikrImageStudio(attachText) {
    studioAttachTextWhenSharing = attachText;
    
    try {
      const autoSize = calculateOptimalDefaultFontSize(studioConfig.ratio === 'story', studioConfig.includeVirtue);
      studioConfig.fontSize = autoSize;
      if (studioFontSizeSlider) studioFontSizeSlider.value = autoSize;
      if (studioFontSizeDisplay) studioFontSizeDisplay.textContent = autoSize;
    } catch(e) {
      studioConfig.fontSize = 48;
    }

    const studioModal = document.getElementById('dhikrImageStudioModal');
    if (studioModal) {
      studioModal.classList.add('show');
      studioModal.style.display = 'flex';
      try {
        history.pushState({ modal: 'studio' }, '', '#studio');
      } catch(e) {}
    }

    setTimeout(() => {
      try { renderStudioLiveCanvas(); } catch(err) {}
    }, 40);
  }

  if (closeDhikrStudioBtn) {
    closeDhikrStudioBtn.onclick = () => {
      isClosingStudioSafely = true;
      const studioModal = document.getElementById('dhikrImageStudioModal');
      if (studioModal) {
        studioModal.classList.remove('show');
        studioModal.style.display = 'none';
      }
      if (location.hash === '#studio') {
        history.back();
      } else {
        isClosingStudioSafely = false;
      }
    };
  }

  if (studioFontSizeSlider) {
    studioFontSizeSlider.oninput = (e) => {
      const val = parseInt(e.target.value, 10);
      studioConfig.fontSize = val;
      if (studioFontSizeDisplay) studioFontSizeDisplay.textContent = val;
      renderStudioLiveCanvas();
    };
  }

  document.querySelectorAll('.ratio-tab').forEach(tab => {
    tab.onclick = () => {
      document.querySelectorAll('.ratio-tab').forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      studioConfig.ratio = tab.getAttribute('data-ratio');

      const autoSize = calculateOptimalDefaultFontSize(studioConfig.ratio === 'story', studioConfig.includeVirtue);
      studioConfig.fontSize = autoSize;
      if (studioFontSizeSlider) studioFontSizeSlider.value = autoSize;
      if (studioFontSizeDisplay) studioFontSizeDisplay.textContent = autoSize;

      renderStudioLiveCanvas();
    };
  });

  document.querySelectorAll('.studio-motif-chip').forEach(chip => {
    chip.onclick = () => {
      document.querySelectorAll('.studio-motif-chip').forEach(c => c.classList.remove('active'));
      chip.classList.add('active');
      studioConfig.motif = chip.getAttribute('data-motif');
      renderStudioLiveCanvas();
    };
  });

  document.querySelectorAll('.studio-bg-thumb').forEach(thumb => {
    thumb.onclick = () => {
      document.querySelectorAll('.studio-bg-thumb').forEach(b => b.classList.remove('active'));
      thumb.classList.add('active');
      studioConfig.bg = thumb.getAttribute('data-bg');

      if (studioConfig.bg === 'ivory-parchment' || studioConfig.bg === 'sand-bronze' || studioConfig.bg === 'emerald-ivory') {
        studioConfig.color = '#1E293B';
      } else {
        studioConfig.color = '#FFFFFF';
      }
      document.querySelectorAll('.color-dot').forEach(d => {
        d.classList.toggle('active', d.getAttribute('data-color') === studioConfig.color);
      });

      renderStudioLiveCanvas();
    };
  });

  document.querySelectorAll('.studio-font-chip').forEach(chip => {
    chip.onclick = () => {
      document.querySelectorAll('.studio-font-chip').forEach(f => f.classList.remove('active'));
      chip.classList.add('active');
      studioConfig.font = chip.getAttribute('data-font');
      renderStudioLiveCanvas();
    };
  });

  document.querySelectorAll('.color-dot').forEach(dot => {
    dot.onclick = () => {
      document.querySelectorAll('.color-dot').forEach(d => d.classList.remove('active'));
      dot.classList.add('active');
      studioConfig.color = dot.getAttribute('data-color');
      renderStudioLiveCanvas();
    };
  });

  const toggleStudioTextHighlight = document.getElementById('toggleStudioTextHighlight');
  if (toggleStudioTextHighlight) {
    toggleStudioTextHighlight.onchange = (e) => {
      studioConfig.textHighlight = e.target.checked;
      renderStudioLiveCanvas();
    };
  }

  // رسم بطاقة الذكر (بدون أرقام مع الفحص الذكي للفضل ومنع التكرار)
  function renderStudioLiveCanvas() {
    const canvas = document.getElementById('studioLiveCanvas');
    if (!canvas || !activeDhikrCategoryForShare) return;

    const itemsToDraw = (isBatchShareMode && batchSelectedDhikrItems.length > 1) 
      ? batchSelectedDhikrItems 
      : (activeDhikrItemForShare ? [activeDhikrItemForShare] : []);

    if (!itemsToDraw.length) return;

    const isStory = studioConfig.ratio === 'story';
    const width = 1080;
    const height = isStory ? 1920 : 1080;
    canvas.width = width;
    canvas.height = height;

    const ctx = canvas.getContext('2d');
    const bg = studioConfig.bg;

    // 1. رسم الخلفية
    let motifColor = '#FCD34D';
    let motifOpacity = 0.08;

    if (bg === 'emerald-ivory') {
      ctx.fillStyle = '#FAF7F0';
      ctx.fillRect(0, 0, width, height);
      ctx.fillStyle = '#064E3B';
      ctx.beginPath();
      ctx.roundRect(0, 0, width, isStory ? 440 : 310, [0, 0, 48, 48]);
      ctx.fill();
      motifColor = '#FEF3C7';
    } else if (bg === 'sand-bronze') {
      ctx.fillStyle = '#FFFDF7';
      ctx.fillRect(0, 0, width, height);
      ctx.fillStyle = '#7C2D12';
      ctx.beginPath();
      ctx.roundRect(0, 0, width, isStory ? 440 : 310, [0, 0, 48, 48]);
      ctx.fill();
      motifColor = '#FED7AA';
    } else if (bg === 'midnight-gold') {
      const g = ctx.createLinearGradient(0, 0, 0, height);
      g.addColorStop(0, '#020408'); g.addColorStop(0.5, '#070C15'); g.addColorStop(1, '#111827');
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, width, height);
      motifColor = '#F59E0B';
    } else if (bg === 'emerald-gold') {
      const g = ctx.createLinearGradient(0, 0, 0, height);
      g.addColorStop(0, '#02231A'); g.addColorStop(0.5, '#064E3B'); g.addColorStop(1, '#0D6D53');
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, width, height);
      motifColor = '#FDE68A';
    } else if (bg === 'ivory-parchment') {
      ctx.fillStyle = '#FAF6ED';
      ctx.fillRect(0, 0, width, height);
      motifColor = '#B45309';
      motifOpacity = 0.06;
    } else {
      const g = ctx.createLinearGradient(0, 0, 0, height);
      g.addColorStop(0, '#06152B'); g.addColorStop(0.4, '#09203F'); g.addColorStop(1, '#1D5D9B');
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, width, height);
      motifColor = '#FCD34D';
    }

    // 2. رسم الزخرفة في العمق
    ctx.save();
    ctx.globalAlpha = motifOpacity;
    renderChosenIslamicMotif(ctx, studioConfig.motif || 'motif-1', width / 2, height * 0.48, isStory ? 280 : 210, motifColor, 3.2);
    ctx.restore();

    ctx.direction = 'rtl';
    ctx.textAlign = 'center';

    // 3. هيدر الشعار المعماري المذهب
    const isLightHeader = (bg === 'emerald-ivory' || bg === 'sand-bronze');
    const emblemCenterY = isStory ? 130 : 95;
    
    drawRealBrandEmblem(ctx, width / 2, emblemCenterY, isStory ? 0.70 : 0.60, '#FCD34D');

    const titleY = emblemCenterY + (isStory ? 108 : 94);
    ctx.font = 'bold 36px "Cairo", sans-serif';
    ctx.fillStyle = isLightHeader ? '#FEF3C7' : (bg === 'ivory-parchment' ? '#B45309' : '#FCD34D');
    ctx.fillText('الحياة الطيبة', width / 2, titleY);

    // 4. شارة اسم مجموعة الأذكار
    let currentHeaderBottomY = titleY + 40;
    if (studioConfig.includeCategory && activeDhikrCategoryForShare) {
      const badgeText = activeDhikrCategoryForShare.name;
      ctx.font = 'bold 34px "Cairo", sans-serif';
      const textW = ctx.measureText(badgeText).width + 80;
      
      const badgeY = titleY + (isStory ? 75 : 65);
      ctx.fillStyle = isLightHeader ? 'rgba(255, 255, 255, 0.22)' : 'rgba(252, 211, 77, 0.16)';
      ctx.beginPath();
      ctx.roundRect(width / 2 - textW / 2, badgeY - 34, textW, 58, 29);
      ctx.fill();

      ctx.fillStyle = isLightHeader ? '#FEF3C7' : (bg === 'ivory-parchment' ? '#92400E' : '#FCD34D');
      ctx.fillText(badgeText, width / 2, badgeY + 6);
      currentHeaderBottomY = badgeY + 45;
    }

    // 5. تجهيز أسطر الأذكار وتطبيق الفحص الذكي للفضل ومنع التكرار
    const baseFontSize = studioConfig.fontSize || 48;
    const lineHeight = baseFontSize * 1.8;
    const maxTextWidth = width - 160;

    let parsedDhikrBlocks = [];
    let totalClusterHeight = 0;

    itemsToDraw.forEach((it, iIdx) => {
      const words = it.text.split(' ');
      let lines = [];
      let curLine = '';

      words.forEach(w => {
        const testLine = curLine ? `${curLine} ${w}` : w;
        ctx.font = `700 ${baseFontSize}px ${studioConfig.font}`;
        if (ctx.measureText(testLine).width > maxTextWidth) {
          lines.push(curLine);
          curLine = w;
        } else {
          curLine = testLine;
        }
      });
      if (curLine) lines.push(curLine);

      // الفحص الذكي للفضل: إذا كان الفضل متطابقاً مع الذكر التالي لا نكرره ونكتفي به في الذكر الأخير
      let vLines = [];
      const vFontSize = Math.max(20, Math.round(baseFontSize * 0.56));
      const vLineHeight = vFontSize * 1.55;

      let shouldRenderVirtue = false;
      if (studioConfig.includeVirtue && it.fullNote && it.fullNote.trim().length > 0) {
        const currentClean = stripArabicTashkeel(it.fullNote).replace(/\s/g, '');
        const nextItem = itemsToDraw[iIdx + 1];
        const nextClean = (nextItem && nextItem.fullNote) ? stripArabicTashkeel(nextItem.fullNote).replace(/\s/g, '') : null;
        
        // يُرسم الفضل فقط إذا كان مختلفاً عن التالي أو كان هو الذكر الأخير
        if (currentClean !== nextClean) {
          shouldRenderVirtue = true;
        }
      }

      if (shouldRenderVirtue) {
        const vWords = it.fullNote.split(' ');
        let vCur = '';
        vWords.forEach(w => {
          const testV = vCur ? `${vCur} ${w}` : w;
          ctx.font = `600 ${vFontSize}px "Cairo", sans-serif`;
          if (ctx.measureText(testV).width > (maxTextWidth - 60)) {
            vLines.push(vCur);
            vCur = w;
          } else {
            vCur = testV;
          }
        });
        if (vCur) vLines.push(vCur);
      }

      const hasPre = !!it.pre;
      const showReps = !!(studioConfig.includeReps && it.count);
      const preH = hasPre ? 46 : 0;
      const bodyH = lines.length * lineHeight;
      const repsH = showReps ? 55 : 0;
      const virtH = vLines.length > 0 ? (vLines.length * vLineHeight + 25) : 0;

      // تم حذف numH نهائياً لتوفير المساحة وإلغاء الأرقام من الصورة
      const blockTotalH = preH + bodyH + repsH + virtH + 25;
      totalClusterHeight += blockTotalH;

      parsedDhikrBlocks.push({
        item: it,
        lines,
        vLines,
        vFontSize,
        vLineHeight,
        hasPre,
        showReps,
        preH,
        bodyH,
        repsH,
        virtH,
        blockTotalH
      });
    });

    // موضع الفوتر
    const footerY = height - (isStory ? 140 : 65);
    const dividerY = height - (isStory ? 200 : 115);

    // توسيط الكتلة رأسياً
    const availableAreaTop = currentHeaderBottomY + 20;
    const availableAreaBottom = dividerY - 30;
    let currentBlockY = availableAreaTop + Math.max(10, ((availableAreaBottom - availableAreaTop) - totalClusterHeight) / 2);

    let finalTextColor = studioConfig.color;
    if ((bg === 'emerald-ivory' || bg === 'sand-bronze' || bg === 'ivory-parchment') && finalTextColor === '#FFFFFF') {
      finalTextColor = (bg === 'sand-bronze') ? '#451A03' : '#1E293B';
    }

    // تظليل الخلفية إن كان مفعلاً
    if (studioConfig.textHighlight) {
      ctx.fillStyle = (studioConfig.color === '#FFFFFF') ? 'rgba(0, 0, 0, 0.42)' : 'rgba(255, 255, 255, 0.82)';
      ctx.beginPath();
      ctx.roundRect(60, currentBlockY - 15, width - 120, totalClusterHeight + 30, 24);
      ctx.fill();
    }

    // رسم الأذكار دون أي أرقام
    parsedDhikrBlocks.forEach((block, bIdx) => {
      // أ) السابقة
      if (block.hasPre) {
        ctx.font = 'bold 28px "Cairo", sans-serif';
        ctx.fillStyle = (bg === 'ivory-parchment' || bg === 'emerald-ivory' || bg === 'sand-bronze') ? '#0284C7' : '#93C5FD';
        ctx.fillText(block.item.pre, width / 2, currentBlockY + 25);
        currentBlockY += block.preH;
      }

      // ب) متن الذكر الشريف
      ctx.font = `700 ${baseFontSize}px ${studioConfig.font}`;
      ctx.fillStyle = finalTextColor;
      let textLineY = currentBlockY + baseFontSize;
      block.lines.forEach((l) => {
        ctx.fillText(l, width / 2, textLineY);
        textLineY += lineHeight;
      });

      // ج) شارة التكرار في الجهة اليسرى
      const dhikrLastLineY = textLineY - (lineHeight - baseFontSize);
      let afterDhikrY = dhikrLastLineY;

      if (block.showReps) {
        const repsText = `${block.item.count} مرة`;
        ctx.font = 'bold 26px "Cairo", sans-serif';
        const repsW = ctx.measureText(repsText).width + 50;
        const repsBadgeY = dhikrLastLineY + 52;
        const badgeLeftX = 105;

        ctx.fillStyle = (bg === 'ivory-parchment' || bg === 'emerald-ivory' || bg === 'sand-bronze') 
          ? 'rgba(0, 0, 0, 0.08)' 
          : 'rgba(252, 211, 77, 0.16)';
        
        ctx.beginPath();
        ctx.roundRect(badgeLeftX, repsBadgeY - 22, repsW, 44, 22);
        ctx.fill();

        ctx.fillStyle = (bg === 'ivory-parchment') 
          ? '#B45309' 
          : ((bg === 'emerald-ivory' || bg === 'sand-bronze') ? '#1E293B' : '#FCD34D');
        
        ctx.fillText(repsText, badgeLeftX + repsW / 2, repsBadgeY + 8);
        afterDhikrY = repsBadgeY + 34;
      }

      // د) فضل الذكر (يُرسم فقط إذا كان غير مكرر)
      if (block.vLines.length > 0) {
        const startVirtueY = afterDhikrY + 22;
        ctx.font = `600 ${block.vFontSize}px "Cairo", sans-serif`;
        ctx.fillStyle = (bg === 'ivory-parchment' || bg === 'emerald-ivory' || bg === 'sand-bronze') ? '#B45309' : '#FCD34D';
        block.vLines.forEach((vl, vIdx) => {
          ctx.fillText((vIdx === 0 ? '✨ ' : '') + vl, width / 2, startVirtueY + (vIdx * block.vLineHeight));
        });
        afterDhikrY = startVirtueY + (block.vLines.length * block.vLineHeight);
      }

      currentBlockY = afterDhikrY + 20;

      // فاصل إسلامي رقيق بين الأذكار
      if (bIdx < parsedDhikrBlocks.length - 1) {
        const divCol = (bg === 'ivory-parchment' || bg === 'emerald-ivory' || bg === 'sand-bronze') ? 'rgba(0,0,0,0.1)' : 'rgba(255,255,255,0.18)';
        drawTaperedDividerWithRosette(ctx, currentBlockY - 6, divCol, 540, 14);
      }
    });

    // 7. الفوتر النهائي والخط الفاصل والشعار اللفظي
    const divColor = (bg === 'ivory-parchment') ? '#D4AF37' : '#E2E8F0';
    drawTaperedDividerWithRosette(ctx, dividerY, divColor, 660, 18);

    if (studioConfig.includeCredit) {
      ctx.font = 'bold 30px "Cairo", sans-serif';
      ctx.fillStyle = (bg === 'ivory-parchment' || bg === 'emerald-ivory' || bg === 'sand-bronze') ? '#1E293B' : '#FFFFFF';
      ctx.fillText('تطبيق الحياة الطيبة • رفيقك في الطاعة', width / 2, footerY);
    }
  }

  // 1. تنزيل وحفظ الصورة (يدعم ذاكرة الأندرويد الأصلية + تنزيل الـ PWA)
  if (downloadStudioImageBtn) {
    downloadStudioImageBtn.onclick = async () => {
      if (!studioLiveCanvas) return;
      const uniqueSuffix = Date.now().toString().slice(-4);
      const catCleanName = activeDhikrCategoryForShare ? activeDhikrCategoryForShare.name.replace(/\s+/g, '-') : 'أذكار';
      const fileName = `ذكر-${catCleanName}-${uniqueSuffix}.png`;

      // خاص بالأندرويد فقط: الحفظ المباشر في الذاكرة
      if (isNativeAppEnv && window.Capacitor?.Plugins?.Filesystem) {
        try {
          const rawBase64 = studioLiveCanvas.toDataURL('image/png').replace(/^data:image\/png;base64,/, '');
          
          await window.Capacitor.Plugins.Filesystem.writeFile({
            path: `Download/${fileName}`,
            data: rawBase64,
            directory: 'DOCUMENTS',
            recursive: true
          });

          const toast = document.getElementById('studioToastBanner');
          if (toast) {
            toast.classList.add('show');
            setTimeout(() => toast.classList.remove('show'), 2600);
          }
          return;
        } catch (err) {
          // بديل للأندرويد في حال تقييد المجلدات
          try {
            const rawBase64 = studioLiveCanvas.toDataURL('image/png').replace(/^data:image\/png;base64,/, '');
            const tempFile = await window.Capacitor.Plugins.Filesystem.writeFile({
              path: fileName,
              data: rawBase64,
              directory: 'CACHE'
            });
            if (window.Capacitor?.Plugins?.Share) {
              await window.Capacitor.Plugins.Share.share({
                title: 'حفظ بطاقة الذكر',
                files: [tempFile.uri],
                dialogTitle: 'حفظ بطاقة الذكر'
              });
            }
            return;
          } catch(e) {}
        }
      }

      // خاص بالـ PWA والمتصفح: الكود الأصلي القديم كما هو دون أي تغيير
      const link = document.createElement('a');
      link.download = fileName;
      link.href = studioLiveCanvas.toDataURL('image/png');
      link.click();

      const toast = document.getElementById('studioToastBanner');
      if (toast) {
        toast.classList.add('show');
        setTimeout(() => toast.classList.remove('show'), 2400);
      }
    };
  }

  // 2. مشاركة صورة الاستوديو (تفرق بذكاء بين الأندرويد والـ PWA)
  if (executeStudioShareBtn) {
    executeStudioShareBtn.onclick = async () => {
      if (!studioLiveCanvas) return;
      executeStudioShareBtn.textContent = 'جاري المشاركة...';

      // شرط صارم جداً للتأكد من أننا داخل تطبيق الأندرويد (APK) فقط وليس المتصفح
      const isStrictAndroid = !!(window.Capacitor && window.Capacitor.isNativePlatform && window.Capacitor.isNativePlatform());

      // ================= 1. كود تطبيق الأندرويد (APK) =================
      if (isStrictAndroid && window.Capacitor?.Plugins?.Share && window.Capacitor?.Plugins?.Filesystem) {
        try {
          const uniqueSuffix = Date.now().toString().slice(-4);
          const fileName = `dhikr-card-${uniqueSuffix}.png`;
          const rawBase64 = studioLiveCanvas.toDataURL('image/png').replace(/^data:image\/png;base64,/, '');

          const tempImage = await window.Capacitor.Plugins.Filesystem.writeFile({
            path: fileName,
            data: rawBase64,
            directory: 'CACHE'
          });

          let textMessage = '';
          if (studioAttachTextWhenSharing) {
            const items = (isBatchShareMode && batchSelectedDhikrItems.length > 0) ? batchSelectedDhikrItems : [activeDhikrItemForShare];
            textMessage = buildBatchDhikrTextMessage(items, false);
          }

          await window.Capacitor.Plugins.Share.share({
            title: activeDhikrCategoryForShare ? activeDhikrCategoryForShare.name : 'الحياة الطيبة',
            text: textMessage,
            files: [tempImage.uri],
            dialogTitle: 'مشاركة بطاقة الذكر'
          });

          executeStudioShareBtn.textContent = 'مشاركة 📤';
          return;
        } catch (err) {
          executeStudioShareBtn.textContent = 'مشاركة 📤';
          return; // إذا ألغى المستخدم المشاركة، نتوقف هنا
        }
      }

      // ================= 2. كود الـ PWA والمتصفح (الطريقة القديمة الناجحة) =================
      studioLiveCanvas.toBlob(async (blob) => {
        executeStudioShareBtn.textContent = 'مشاركة 📤';
        const uniqueSuffix = Date.now().toString().slice(-4);
        const fileName = `ذكر-الحياة-الطيبة-${uniqueSuffix}.png`;
        const file = new File([blob], fileName, { type: 'image/png' });

        const sharePayload = {
          files: [file],
          title: activeDhikrCategoryForShare ? activeDhikrCategoryForShare.name : 'الحياة الطيبة'
        };

        if (studioAttachTextWhenSharing) {
          const items = (isBatchShareMode && batchSelectedDhikrItems.length > 0) ? batchSelectedDhikrItems : [activeDhikrItemForShare];
          sharePayload.text = buildBatchDhikrTextMessage(items, false);
        }

        // إذا كان المتصفح يدعم مشاركة الصورة والنص معاً
        if (navigator.canShare && navigator.canShare(sharePayload)) {
          try {
            await navigator.share(sharePayload);
          } catch(e) {
            // إذا أغلق المستخدم النافذة أو حدث خطأ نتجاهله
          }
        } else {
          // إذا كان المتصفح لا يدعم المشاركة المباشرة للصورة (Fallback)
          const link = document.createElement('a');
          link.download = fileName;
          link.href = studioLiveCanvas.toDataURL('image/png');
          link.click();
          
          // إظهار رسالة احترافية بنفس هوية الاستوديو
          const toast = document.getElementById('studioToastBanner');
          if (toast) {
            toast.innerHTML = '<span>⚠️ متصفحك لا يدعم المشاركة المباشرة.. تم حفظ الصورة لتشاركها من المعرض</span>';
            toast.style.background = 'rgba(245, 158, 11, 0.95)'; // لون تحذيري عنبري متناسق
            toast.classList.add('show');
            setTimeout(() => {
              toast.classList.remove('show');
              // إعادة اللون الأخضر للرسائل القادمة
              setTimeout(() => {
                toast.style.background = 'rgba(16, 185, 129, 0.95)';
                toast.innerHTML = '<span>✨ تم حفظ بطاقة الذكر في جهازك بنجاح!</span>';
              }, 300);
            }, 3500);
          }
        }
      }, 'image/png');
    };
  }
  
  // دالة تحريك الذكر بالأسهم
  window.moveDhikr = (index, dir) => {
    const category = azkarState.find(c => c.id === currentActiveCategoryId);
    if (!category || !category.items) return;
    const targetIdx = index + dir;
    if (targetIdx < 0 || targetIdx >= category.items.length) return;
    const temp = category.items[index];
    category.items[index] = category.items[targetIdx];
    category.items[targetIdx] = temp;
    saveAzkarState();
    renderDhikrCards();
  };

  // محرك السحب والإفلات الرأسي المباشر لكروت الأذكار (بالضغط المطول والسحب للأعلى والأسفل)
  function setupVerticalDhikrDragAndDrop(cardEl, fromIndex, category) {
    let pressTimer = null;
    let isDragging = false;
    let startY = 0;

    const onStart = (clientY) => {
      startY = clientY;
      pressTimer = setTimeout(() => {
        isDragging = true;
        if (navigator.vibrate) navigator.vibrate(35);
        cardEl.classList.add('is-dragging');
      }, 200);
    };

    const onMove = (e, clientY) => {
      if (!isDragging) {
        if (Math.abs(clientY - startY) > 10) clearTimeout(pressTimer);
        return;
      }
      e.preventDefault();

      const targetEl = document.elementFromPoint(window.innerWidth / 2, clientY);
      if (!targetEl) return;

      const targetCard = targetEl.closest('.dhikr-card');
      if (targetCard && targetCard !== cardEl) {
        const toIndex = parseInt(targetCard.getAttribute('data-card-index'), 10);
        if (!isNaN(toIndex) && toIndex !== fromIndex) {
          const [movedItem] = category.items.splice(fromIndex, 1);
          category.items.splice(toIndex, 0, movedItem);
          saveAzkarState();
          fromIndex = toIndex;
          renderDhikrCards();
        }
      }
    };

    const onEnd = () => {
      clearTimeout(pressTimer);
      if (isDragging) {
        isDragging = false;
        cardEl.classList.remove('is-dragging');
        renderDhikrCards();
      }
    };

    cardEl.addEventListener('touchstart', (e) => onStart(e.touches[0].clientY), { passive: true });
    window.addEventListener('touchmove', (e) => {
      if (isDragging && e.touches[0]) onMove(e, e.touches[0].clientY);
    }, { passive: false });
    window.addEventListener('touchend', onEnd);

    cardEl.addEventListener('mousedown', (e) => onStart(e.clientY));
    window.addEventListener('mousemove', (e) => {
      if (isDragging) onMove(e, e.clientY);
    });
    window.addEventListener('mouseup', onEnd);
  }

  const readerMenuBtn = document.getElementById('readerMenuBtn');
  const readerDropdownMenu = document.getElementById('readerDropdownMenu');
  readerMenuBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    readerDropdownMenu.classList.toggle('show');
  });
  
  // فتح وإغلاق شاشة الإعدادات
  const openDhikrSettingsBtn = document.getElementById('openDhikrSettingsBtn');
  const azkarSettingsModal = document.getElementById('azkarSettingsModal');

  // دوال قفل وفك تجميد الشاشة الخلفية لمنع تسريب التمرير
  function lockBackgroundScroll() {
    document.body.classList.add('scroll-locked');
    const container = document.querySelector('.app-container');
    if (container) container.classList.add('scroll-locked');
  }

  function unlockBackgroundScroll() {
    document.body.classList.remove('scroll-locked');
    const container = document.querySelector('.app-container');
    if (container) container.classList.remove('scroll-locked');
  }

  function openDhikrSettingsModalFromTop() {
    syncSettingsUI();
    const sheet = azkarSettingsModal.querySelector('.bottom-sheet');
    if (sheet) sheet.scrollTop = 0; // فتح النافذة دائماً من بدايتها
    azkarSettingsModal.classList.add('show');
    lockBackgroundScroll(); // تجميد الشاشة الخلفية فوراً
  }

  function closeDhikrSettingsModal() {
    azkarSettingsModal.classList.remove('show');
    unlockBackgroundScroll(); // فك تجميد الشاشة الخلفية
  }

  if (openDhikrSettingsFromMenu) {
    openDhikrSettingsFromMenu.addEventListener('click', openDhikrSettingsModalFromTop);
  }

  if (openDhikrSettingsBtn) {
    openDhikrSettingsBtn.addEventListener('click', openDhikrSettingsModalFromTop);
  }

  // إغلاق النافذة وفك التجميد عند النقر على الغطاء المعتم
  azkarSettingsModal.addEventListener('click', (e) => {
    if (e.target === azkarSettingsModal) {
      closeDhikrSettingsModal();
    }
  });

  // منع تحريك الخلفية إطلاقاً عند لمس الغطاء الخارجي المعتم
  azkarSettingsModal.addEventListener('touchmove', (e) => {
    if (e.target === azkarSettingsModal) {
      e.preventDefault();
    }
  }, { passive: false });  

  // مزامنة واجهة الإعدادات مع القيم المحفوظة بما فيها حركة الاختفاء
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

    const intensitySlider = document.getElementById('vibrateZeroIntensitySlider');
    const intensityDisplay = document.getElementById('vibrateZeroIntensityDisplay');
    const intensityBlock = document.getElementById('vibrateZeroIntensityBlock');
    const labelsMap = { 1: 'خفيف', 2: 'متوسط', 3: 'قوي' };

    if (intensitySlider && intensityDisplay) {
      intensitySlider.value = dhikrSettings.vibrateZeroIntensity || 2;
      intensityDisplay.textContent = labelsMap[intensitySlider.value] || 'متوسط';
    }

    if (intensityBlock) {
      intensityBlock.style.opacity = dhikrSettings.vibrateOnZero ? '1' : '0.45';
      intensityBlock.style.pointerEvents = dhikrSettings.vibrateOnZero ? 'auto' : 'none';
    }
    
    document.getElementById('toggleVibrateOnClick').checked = dhikrSettings.vibrateOnClick;
    document.getElementById('toggleHideOnZero').checked = dhikrSettings.hideOnZero;
    document.getElementById('toggleTapAnywhere').checked = dhikrSettings.tapAnywhere;
    document.getElementById('toggleConfirmExit').checked = dhikrSettings.confirmExit;

    const toggleAutoScrollEl = document.getElementById('toggleAutoScrollOption');
    if (toggleAutoScrollEl) {
      toggleAutoScrollEl.checked = !!dhikrSettings.autoScrollEnabled;
    }
    updateAutoScrollHeaderVisibility();

    const toggleUndoEl = document.getElementById('toggleUndoButtonOption');
    if (toggleUndoEl) {
      toggleUndoEl.checked = dhikrSettings.undoButtonEnabled !== false;
    }
    updateUndoButtonVisibility();

    // مزامنة النمط المختار لحركة اختفاء الذكر
    const curAnim = dhikrSettings.dismissAnimation || 'slide-up';
    document.querySelectorAll('.anim-chip-item').forEach(chip => {
      const isSelected = chip.getAttribute('data-anim') === curAnim;
      chip.classList.toggle('active', isSelected);
      const radio = chip.querySelector('input');
      if (radio) radio.checked = isSelected;
    });
  }

  // ربط النقر لاختيار نمط حركة الاختفاء
  document.querySelectorAll('.anim-chip-item').forEach(chip => {
    chip.addEventListener('click', () => {
      document.querySelectorAll('.anim-chip-item').forEach(c => c.classList.remove('active'));
      chip.classList.add('active');
      const val = chip.getAttribute('data-anim');
      dhikrSettings.dismissAnimation = val;
      saveSettings();
    });
  });

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

  const toggleVibrateZeroEl = document.getElementById('toggleVibrateOnZero');
  const intensityBlockEl = document.getElementById('vibrateZeroIntensityBlock');
  const intensitySliderEl = document.getElementById('vibrateZeroIntensitySlider');
  const intensityDisplayEl = document.getElementById('vibrateZeroIntensityDisplay');

  // خريطة أنماط الاهتزاز لدرجات القوة الثلاث
  const VIBRATION_PATTERNS = {
    1: [65],                        // خفيف
    2: [120, 60, 150],              // متوسط
    3: [200, 70, 220, 70, 200]       // قوي
  };

  if (toggleVibrateZeroEl) {
    toggleVibrateZeroEl.addEventListener('change', (e) => {
      dhikrSettings.vibrateOnZero = e.target.checked;
      saveSettings();
      if (intensityBlockEl) {
        intensityBlockEl.style.opacity = e.target.checked ? '1' : '0.45';
        intensityBlockEl.style.pointerEvents = e.target.checked ? 'auto' : 'none';
      }
    });
  }

  if (intensitySliderEl) {
    intensitySliderEl.addEventListener('input', (e) => {
      const val = parseInt(e.target.value, 10);
      const labels = { 1: 'خفيف', 2: 'متوسط', 3: 'قوي' };
      dhikrSettings.vibrateZeroIntensity = val;
      if (intensityDisplayEl) intensityDisplayEl.textContent = labels[val] || 'متوسط';
      saveSettings();

      // إطلاق نبضة تجريبية فورية ليتلمس المستخدم القوة المختارة
      if (navigator.vibrate) {
        navigator.vibrate(VIBRATION_PATTERNS[val] || [120]);
      }
    });
  }

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

  const toggleQuickScrollInput = document.getElementById('toggleQuickScrollButtons');
  if (toggleQuickScrollInput) {
    toggleQuickScrollInput.addEventListener('change', (e) => {
      dhikrSettings.quickScrollButtons = e.target.checked;
      saveSettings();
      updateQuickScrollVisibility();
    });
  }

  // ==================== محرك أزرار الانتقال السريع للأعلى والأسفل ====================
  const btnScrollToTop = document.getElementById('btnScrollToTop');
  const btnScrollToBottom = document.getElementById('btnScrollToBottom');

  function getScrollMetrics() {
    const appContainer = document.querySelector('.app-container');
    if (appContainer && appContainer.scrollHeight > appContainer.clientHeight && window.getComputedStyle(appContainer).overflowY.includes('auto')) {
      return {
        element: appContainer,
        scrollTop: appContainer.scrollTop,
        scrollHeight: appContainer.scrollHeight,
        clientHeight: appContainer.clientHeight,
        isWindow: false
      };
    }
    return {
      element: window,
      scrollTop: window.pageYOffset || document.documentElement.scrollTop || 0,
      scrollHeight: document.documentElement.scrollHeight || document.body.scrollHeight || 0,
      clientHeight: window.innerHeight || document.documentElement.clientHeight || 0,
      isWindow: true
    };
  }

  function hideQuickScrollButtons() {
    if (btnScrollToTop) btnScrollToTop.classList.remove('show');
    if (btnScrollToBottom) btnScrollToBottom.classList.remove('show');
  }

  function updateQuickScrollVisibility() {
    const readerScreen = document.getElementById('screen-azkar-reader');
    if (!readerScreen || !readerScreen.classList.contains('active')) {
      hideQuickScrollButtons();
      return;
    }

    if (dhikrSettings.quickScrollButtons === false) {
      hideQuickScrollButtons();
      return;
    }

    const metrics = getScrollMetrics();
    const maxScroll = metrics.scrollHeight - metrics.clientHeight;

    // حماية القوائم القصيرة: إذا كانت الصفحة لا تتطلب تمريراً كافياً
    if (maxScroll <= 180) {
      hideQuickScrollButtons();
      return;
    }

    const currentScroll = metrics.scrollTop;
    const distanceFromBottom = maxScroll - currentScroll;

    // 1. عند فتح الشاشة أو الوقوف في القمة التامة (< 70px): مخفيان
    if (currentScroll < 70) {
      hideQuickScrollButtons();
      return;
    }

    // 2. زر الهبوط لأسفل: يظهر فقط عندما يكون في الثلث/النصف العلوي وبعيداً عن القاع بـ 250px على الأقل
    if (currentScroll >= 70 && currentScroll < maxScroll * 0.45 && distanceFromBottom > 250) {
      if (btnScrollToBottom) btnScrollToBottom.classList.add('show');
      if (btnScrollToTop) btnScrollToTop.classList.remove('show');
      return;
    }

    // 3. زر الصعود لأعلى: يظهر فقط عندما يتعمق في القراءة (النصف السفلي) ويكون بعيداً عن القمة بـ 200px على الأقل
    if (currentScroll > maxScroll * 0.55 && currentScroll > 200) {
      if (btnScrollToTop) btnScrollToTop.classList.add('show');
      if (btnScrollToBottom) btnScrollToBottom.classList.remove('show');
      return;
    }

    // 4. في المنطقة الوسطى الحرجة أو عدم تحقق الشروط: إخفاء الزرين لصفاء القراءة
    hideQuickScrollButtons();
  }

  function scrollToDhikrTop() {
    const metrics = getScrollMetrics();
    if (!metrics.isWindow) {
      metrics.element.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }

  function scrollToDhikrBottom() {
    const cards = document.querySelectorAll('#dhikrCardsContainer .dhikr-card');
    const visibleCards = Array.from(cards).filter(c => c.style.display !== 'none');
    const lastCard = visibleCards.length > 0 ? visibleCards[visibleCards.length - 1] : null;

    if (lastCard) {
      lastCard.scrollIntoView({ behavior: 'smooth', block: 'end' });
    } else {
      const metrics = getScrollMetrics();
      if (!metrics.isWindow) {
        metrics.element.scrollTo({ top: metrics.scrollHeight, behavior: 'smooth' });
      } else {
        window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
      }
    }
  }

  if (btnScrollToTop) btnScrollToTop.addEventListener('click', scrollToDhikrTop);
  if (btnScrollToBottom) btnScrollToBottom.addEventListener('click', scrollToDhikrBottom);

  // ==================== محرك التمرير التلقائي للأذكار (Auto-Scroll Engine) ====================
  const btnToggleAutoScroll = document.getElementById('btnToggleAutoScroll');
  const autoScrollPlayIcon = document.getElementById('autoScrollPlayIcon');
  const autoScrollPauseIcon = document.getElementById('autoScrollPauseIcon');
  const autoScrollSpeedDock = document.getElementById('autoScrollSpeedDock');
  const autoScrollSpeedSlider = document.getElementById('autoScrollSpeedSlider');
  const speedFloatingBubble = document.getElementById('speedFloatingBubble');

  let isAutoScrolling = false;
  let autoScrollRafId = null;
  let autoScrollFractionalY = 0;

  function updateAutoScrollHeaderVisibility() {
    if (!btnToggleAutoScroll) return;
    if (dhikrSettings.autoScrollEnabled) {
      btnToggleAutoScroll.style.display = 'flex';
    } else {
      btnToggleAutoScroll.style.display = 'none';
      stopAutoScrolling();
    }
  }

  function showGuidanceToast(text) {
    const banner = document.getElementById('guidanceToastBanner');
    const label = document.getElementById('guidanceToastText');
    if (!banner || !label) return;
    label.textContent = text;
    banner.classList.add('show');
    clearTimeout(banner.toastTimer);
    banner.toastTimer = setTimeout(() => {
      banner.classList.remove('show');
    }, 3800);
  }

  const toggleAutoScrollInput = document.getElementById('toggleAutoScrollOption');
  if (toggleAutoScrollInput) {
    toggleAutoScrollInput.addEventListener('change', (e) => {
      dhikrSettings.autoScrollEnabled = e.target.checked;
      saveSettings();
      updateAutoScrollHeaderVisibility();
      if (e.target.checked) {
        showGuidanceToast('✨ تم تفعيل التمرير التلقائي! ستجد أيقونة التشغيل (▶) أعلى يسار شاشة الأذكار لتجربتها 📱');
      }
    });
  }

  const toggleUndoButtonInput = document.getElementById('toggleUndoButtonOption');
  if (toggleUndoButtonInput) {
    toggleUndoButtonInput.addEventListener('change', (e) => {
      dhikrSettings.undoButtonEnabled = e.target.checked;
      saveSettings();
      updateUndoButtonVisibility();
      if (e.target.checked) {
        showGuidanceToast('✨ تم تفعيل زر التراجع! ستجده عائماً ويمكنك سحبه وسيلتصق بحافة الشاشة تلقائياً ↩️');
      }
    });
  }

  function updateFloatingBubblePosition() {
    if (!autoScrollSpeedSlider || !speedFloatingBubble) return;
    const min = parseFloat(autoScrollSpeedSlider.min) || 0.3;
    const max = parseFloat(autoScrollSpeedSlider.max) || 3.5;
    const val = parseFloat(autoScrollSpeedSlider.value) || 1.0;
    const percent = (val - min) / (max - min);

    // حساب إزاحة المؤشر الدقيقة داخل العرض
    const sliderWidth = autoScrollSpeedSlider.offsetWidth;
    const thumbOffset = percent * (sliderWidth - 16) + 8;
    speedFloatingBubble.style.left = `${thumbOffset}px`;
    speedFloatingBubble.textContent = val.toFixed(1);
  }

  if (autoScrollSpeedSlider) {
    autoScrollSpeedSlider.value = dhikrSettings.autoScrollSpeed || 1.0;
    setTimeout(updateFloatingBubblePosition, 50);

    autoScrollSpeedSlider.addEventListener('input', (e) => {
      const val = parseFloat(e.target.value);
      dhikrSettings.autoScrollSpeed = val;
      saveSettings();
      updateFloatingBubblePosition();
    });
  }

  function startAutoScrolling() {
    const readerScreen = document.getElementById('screen-azkar-reader');
    if (!readerScreen || !readerScreen.classList.contains('active')) return;

    isAutoScrolling = true;
    if (btnToggleAutoScroll) btnToggleAutoScroll.classList.add('running');
    if (autoScrollPlayIcon) autoScrollPlayIcon.style.display = 'none';
    if (autoScrollPauseIcon) autoScrollPauseIcon.style.display = 'block';
    if (autoScrollSpeedDock) {
      autoScrollSpeedDock.classList.add('show');
      setTimeout(updateFloatingBubblePosition, 60);
    }

    const metrics = getScrollMetrics();
    autoScrollFractionalY = metrics.scrollTop;

    function scrollStep() {
      if (!isAutoScrolling) return;

      const currentMetrics = getScrollMetrics();
      const maxScroll = currentMetrics.scrollHeight - currentMetrics.clientHeight;

      // الوصول لنهاية الأذكار: إيقاف تلقائي هادئ
      if (currentMetrics.scrollTop >= maxScroll - 2) {
        stopAutoScrolling();
        return;
      }

      // زيادة بمعدل سرعة ناعم (0.8px مضروبة في مضاعف السرعة)
      const speedMultiplier = dhikrSettings.autoScrollSpeed || 1.0;
      autoScrollFractionalY += (0.85 * speedMultiplier);

      if (!currentMetrics.isWindow) {
        currentMetrics.element.scrollTop = autoScrollFractionalY;
      } else {
        window.scrollTo(0, autoScrollFractionalY);
      }

      autoScrollRafId = requestAnimationFrame(scrollStep);
    }

    cancelAnimationFrame(autoScrollRafId);
    autoScrollRafId = requestAnimationFrame(scrollStep);
  }

  function stopAutoScrolling() {
    isAutoScrolling = false;
    cancelAnimationFrame(autoScrollRafId);
    if (btnToggleAutoScroll) btnToggleAutoScroll.classList.remove('running');
    if (autoScrollPlayIcon) autoScrollPlayIcon.style.display = 'block';
    if (autoScrollPauseIcon) autoScrollPauseIcon.style.display = 'none';
    if (autoScrollSpeedDock) autoScrollSpeedDock.classList.remove('show');
  }

  if (btnToggleAutoScroll) {
    btnToggleAutoScroll.addEventListener('click', (e) => {
      e.stopPropagation();
      if (isAutoScrolling) {
        stopAutoScrolling();
      } else {
        startAutoScrolling();
      }
    });
  }

  // ==================== ميزة النقر المطوّل لإيقاف واستئناف التمرير ====================
  let autoScrollLpTimer = null;
  let isAutoScrollLpTriggered = false;
  let lpStartX = 0;
  let lpStartY = 0;

  function onAutoScrollTouchStart(e) {
    // تعمل الميزة فقط إذا كان خيار التمرير التلقائي مفعلاً في الإعدادات
    if (!dhikrSettings.autoScrollEnabled) return;

    // استثناء أزرار الهيدر وشريط السرعة وأزرار القفز والـ FAB
    if (
      e.target.closest('.autoscroll-speed-dock') || 
      e.target.closest('.quick-scroll-container') ||
      e.target.closest('.fab-btn') ||
      e.target.closest('.reader-header-actions') ||
      e.target.closest('.dhikr-card-top-actions') ||
      e.target.closest('.dhikr-counter-btn') ||
      e.target.closest('.virtue-info-btn') ||
      e.target.closest('.alert-badge-btn')
    ) {
      return;
    }

    isAutoScrollLpTriggered = false;
    const pt = e.touches ? e.touches[0] : e;
    lpStartX = pt.clientX;
    lpStartY = pt.clientY;

    // مؤقت النقر المطوّل (500 ملي ثانية)
    autoScrollLpTimer = setTimeout(() => {
      isAutoScrollLpTriggered = true;
      if (navigator.vibrate) navigator.vibrate(45);

      // تبديل حالة التمرير: إيقاف إذا كان يعمل، واستئناف إذا كان متوقفاً
      if (isAutoScrolling) {
        stopAutoScrolling();
      } else {
        startAutoScrolling();
      }
    }, 500);
  }

  function onAutoScrollTouchMove(e) {
    if (!autoScrollLpTimer) return;
    const pt = e.touches ? e.touches[0] : e;
    // إلغاء المؤقت في حال تحريك الإصبع للسحب العادي
    if (Math.abs(pt.clientX - lpStartX) > 10 || Math.abs(pt.clientY - lpStartY) > 10) {
      clearTimeout(autoScrollLpTimer);
      autoScrollLpTimer = null;
    }
  }

  function onAutoScrollTouchEnd() {
    if (autoScrollLpTimer) {
      clearTimeout(autoScrollLpTimer);
      autoScrollLpTimer = null;
    }
    // إعادة ضبط علم النقر المطول بعد انتهاء دورة اللمس
    if (isAutoScrollLpTriggered) {
      setTimeout(() => {
        isAutoScrollLpTriggered = false;
      }, 120);
    }
  }

  const readerContainer = document.getElementById('screen-azkar-reader');
  if (readerContainer) {
    // دعم أجهزة اللمس (الجوال والتابلت)
    readerContainer.addEventListener('touchstart', onAutoScrollTouchStart, { passive: true });
    readerContainer.addEventListener('touchmove', onAutoScrollTouchMove, { passive: true });
    readerContainer.addEventListener('touchend', onAutoScrollTouchEnd);

    // دعم الفأرة للكمبيوتر
    readerContainer.addEventListener('mousedown', onAutoScrollTouchStart);
    readerContainer.addEventListener('mousemove', onAutoScrollTouchMove);
    readerContainer.addEventListener('mouseup', onAutoScrollTouchEnd);
  }

  // منع خصم العداد بالخطأ إذا كان اللمس نقراً مطولاً
  window.addEventListener('click', (e) => {
    if (isAutoScrollLpTriggered) {
      e.stopPropagation();
      e.preventDefault();
    }
  }, true);

  // ==================== محرك زر التراجع والالتصاق المغناطيسي بالحافة المطور ====================
  const floatingUndoBtn = document.getElementById('floatingUndoBtn');
  let undoHistoryStack = [];
  let lastUndoExecutionTimestamp = 0; // حاجز زمني لمنع التكرار المزدوج للأحداث

  function pushToUndoStack(itemId) {
    undoHistoryStack.push({
      itemId: itemId,
      categoryId: currentActiveCategoryId,
      time: Date.now()
    });
    if (undoHistoryStack.length > 30) undoHistoryStack.shift();
    updateUndoButtonState();
  }

  function updateUndoButtonState() {
    if (!floatingUndoBtn) return;
    if (undoHistoryStack.length === 0) {
      floatingUndoBtn.classList.add('dimmed');
    } else {
      floatingUndoBtn.classList.remove('dimmed');
    }
  }

  function updateUndoButtonVisibility() {
    if (!floatingUndoBtn) return;
    const readerScreen = document.getElementById('screen-azkar-reader');
    const isReaderActive = readerScreen && readerScreen.classList.contains('active');
    
    // يظهر الزر فورياً إذا كان مفعلاً وكانت شاشة الأذكار هي النشطة
    if (dhikrSettings.undoButtonEnabled !== false && isReaderActive) {
      floatingUndoBtn.style.display = 'flex';
      initFloatingUndoPosition();
      updateUndoButtonState();
    } else {
      floatingUndoBtn.style.display = 'none';
    }
  }

  function executeUndoAction() {
    // 1. منع التكرار المزدوج: تجاهل أي طلب تراجع ثانٍ يحدث خلال أقل من 320ms
    const now = Date.now();
    if (now - lastUndoExecutionTimestamp < 320) {
      return;
    }
    lastUndoExecutionTimestamp = now;

    // 2. التحقق من وجود عمليات مسجلة
    if (undoHistoryStack.length === 0) return;
    const lastAction = undoHistoryStack.pop();
    updateUndoButtonState();

    const category = azkarState.find(c => c.id === currentActiveCategoryId);
    if (!category || !category.items) return;

    const item = category.items.find(i => i.id === lastAction.itemId);
    if (!item) return;

    // استرجاع تسبيحة واحدة فقط (+1)
    item.currentCount = Math.min(item.count, item.currentCount + 1);
    saveAzkarState();

    // تحديث شريط الإنجاز الموزون
    updateReaderProgressBar();

    // إعادة رسم الكروت لاسترجاع الذكر في حال كان مخفياً
    renderDhikrCards();

    // اهتزاز خفيف لتأكيد التراجع
    if (navigator.vibrate) navigator.vibrate(28);
  }

  // ==================== فيزياء السحب الحر والالتصاق المغناطيسي وفصل اللمس ====================
  let isDraggingUndo = false;
  let undoStartX = 0, undoStartY = 0;
  let undoInitialLeft = 0, undoInitialTop = 0;
  let hasMovedUndo = false;
  let isUndoTouchActive = false; // تتبع أحداث اللمس لمنع محاكاة الفأرة

  function initFloatingUndoPosition() {
    if (!floatingUndoBtn) return;
    const savedPos = JSON.parse(localStorage.getItem('hayat_undo_btn_pos'));
    const container = document.querySelector('.app-container');
    const containerRect = container ? container.getBoundingClientRect() : { left: 0, right: window.innerWidth, width: window.innerWidth, top: 0, height: window.innerHeight };

    if (savedPos && savedPos.side) {
      const top = Math.max(70, Math.min(savedPos.top, window.innerHeight - 140));
      floatingUndoBtn.style.top = `${top}px`;
      if (savedPos.side === 'left') {
        floatingUndoBtn.style.left = `${containerRect.left + 14}px`;
      } else {
        floatingUndoBtn.style.left = `${containerRect.right - 60}px`;
      }
    } else {
      floatingUndoBtn.style.top = `${window.innerHeight * 0.45}px`;
      floatingUndoBtn.style.left = `${containerRect.left + 14}px`;
    }
  }

  function onUndoPointerDown(e) {
    // إذا كان الحدث فأرة بينما المستخدم يستخدم اللمس، يتم تجاهله فوراً
    if (e.type === 'touchstart') isUndoTouchActive = true;
    if (e.type === 'mousedown' && isUndoTouchActive) return;

    isDraggingUndo = true;
    hasMovedUndo = false;
    floatingUndoBtn.classList.remove('snapping');

    const pt = e.touches ? e.touches[0] : e;
    undoStartX = pt.clientX;
    undoStartY = pt.clientY;

    const rect = floatingUndoBtn.getBoundingClientRect();
    undoInitialLeft = rect.left;
    undoInitialTop = rect.top;
  }

  function onUndoPointerMove(e) {
    if (!isDraggingUndo) return;
    const pt = e.touches ? e.touches[0] : e;
    const dx = pt.clientX - undoStartX;
    const dy = pt.clientY - undoStartY;

    if (Math.abs(dx) > 5 || Math.abs(dy) > 5) {
      hasMovedUndo = true;
    }

    const newLeft = undoInitialLeft + dx;
    const newTop = undoInitialTop + dy;

    floatingUndoBtn.style.left = `${newLeft}px`;
    floatingUndoBtn.style.top = `${newTop}px`;
  }

  function onUndoPointerUp(e) {
    if (!isDraggingUndo) return;
    isDraggingUndo = false;

    if (e.type === 'touchend') {
      setTimeout(() => { isUndoTouchActive = false; }, 400);
    }

    // نقرة واحدة بدون سحب: تنفيذ التراجع لخطوة واحدة بدقة
    if (!hasMovedUndo) {
      executeUndoAction();
      return;
    }

    // سحب باليد: الالتصاق المغناطيسي بالحافة
    floatingUndoBtn.classList.add('snapping');
    const container = document.querySelector('.app-container');
    const containerRect = container ? container.getBoundingClientRect() : { left: 0, right: window.innerWidth, width: window.innerWidth, top: 0, height: window.innerHeight };

    const btnRect = floatingUndoBtn.getBoundingClientRect();
    const btnCenterX = btnRect.left + btnRect.width / 2;
    const containerCenterX = containerRect.left + containerRect.width / 2;

    const side = (btnCenterX < containerCenterX) ? 'left' : 'right';
    const targetLeft = (side === 'left') ? (containerRect.left + 14) : (containerRect.right - 60);
    const targetTop = Math.max(68, Math.min(btnRect.top, window.innerHeight - 135));

    floatingUndoBtn.style.left = `${targetLeft}px`;
    floatingUndoBtn.style.top = `${targetTop}px`;

    localStorage.setItem('hayat_undo_btn_pos', JSON.stringify({ side: side, top: targetTop }));
  }

  if (floatingUndoBtn) {
    floatingUndoBtn.addEventListener('touchstart', onUndoPointerDown, { passive: true });
    window.addEventListener('touchmove', onUndoPointerMove, { passive: true });
    window.addEventListener('touchend', onUndoPointerUp);

    floatingUndoBtn.addEventListener('mousedown', onUndoPointerDown);
    window.addEventListener('mousemove', onUndoPointerMove);
    window.addEventListener('mouseup', onUndoPointerUp);
  }

  // ربط التنقل بحيث تظهر/تختفي الميزات فوراً وبشكل مضمون عند الانتقال بين الشاشات
  const originalShowScreen = showScreen;
  showScreen = function(screen, pushToHistory = true) {
    if (screen !== screenAzkarReader) {
      stopAutoScrolling();
    }
    originalShowScreen(screen, pushToHistory);

    // تحديث ظهور زر التراجع فور اكتمال تنشيط الشاشة
    updateUndoButtonVisibility();
  };

  window.addEventListener('scroll', updateQuickScrollVisibility, { passive: true });
  const appContainerElement = document.querySelector('.app-container');
  if (appContainerElement) {
    appContainerElement.addEventListener('scroll', updateQuickScrollVisibility, { passive: true });
  }
  
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

// 1. زر "تم" عند إنهاء الأذكار لأول مرة (يرجعه للشاشة التي بدأ منها بذكاء)
document.getElementById('finishDoneBtn').addEventListener('click', () => {
  document.getElementById('finishModal').classList.remove('show');
  exitReaderToSource();
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

// 3. أزرار تأكيد الخروج والتوجيه الذكي
document.getElementById('continueReadingBtn').addEventListener('click', () => {
  document.getElementById('exitConfirmModal').classList.remove('show');
  pendingExitTargetScreen = null; // إلغاء المغادرة والبقاء في صفحة القراءة
});

document.getElementById('confirmExitBtn').addEventListener('click', () => {
  document.getElementById('exitConfirmModal').classList.remove('show');

  // إذا كان المستخدم قد نقر على أيقونة محددة من التبويب السفلي
  if (pendingExitTargetScreen) {
    showScreen(pendingExitTargetScreen.screen);
    if (pendingExitTargetScreen.cb) pendingExitTargetScreen.cb();
    pendingExitTargetScreen = null;
  } else {
    // الرجوع الذكي للشاشة التي فُتحت منها الأذكار
    exitReaderToSource();
  }
});

  // العداد التنازلي والمشاركة
  // ==================== محرك مواقيت الصلاة والتواريخ الموحد ====================
  const DEFAULT_LOCATION = {
    city: 'مكة المكرمة',
    country: 'المملكة العربية السعودية',
    lat: 21.4225,
    lng: 39.8262,
    method: 4,
    asrMadhab: 0,
    prayerOffsets: { Fajr: 0, Sunrise: 0, Dhuhr: 0, Asr: 0, Maghrib: 0, Isha: 0 }
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

  // 1. المحرك الفلكي الشمسي الاحتياطي (يعمل 100% أوفلاين في حال انقطاع السيرفر أو النت)
  function calculateLocalSolarTimings(targetDate, lat, lng, timezone = 3, methodNum = 4, asrMadhab = 0, offsets = {}) {
    const rad = Math.PI / 180, deg = 180 / Math.PI;
    const d = (targetDate.getTime() / 86400000) + 2440587.5 - 2451545.0;
    const M = (357.529 + 0.98560028 * d) % 360;
    const L = (280.459 + 0.98564736 * d) % 360;
    const lambda = (L + 1.915 * Math.sin(M * rad) + 0.020 * Math.sin(2 * M * rad)) % 360;
    const epsilon = 23.439 - 0.00000036 * d;
    const alpha = Math.atan2(Math.cos(epsilon * rad) * Math.sin(lambda * rad), Math.cos(lambda * rad)) * deg;
    const delta = Math.asin(Math.sin(epsilon * rad) * Math.sin(lambda * rad)) * deg;
    const EqT = (L / 15 - (alpha / 15)) * 60;
    const solarNoon = 12 + timezone - (lng / 15) - (EqT / 60);

    const getH = (alt) => {
      const cosH = (Math.sin(alt * rad) - Math.sin(lat * rad) * Math.sin(delta * rad)) /
                   (Math.cos(lat * rad) * Math.cos(delta * rad));
      if (cosH > 1 || cosH < -1) return null;
      return Math.acos(cosH) * deg / 15;
    };

    let fajrAngle = -18.5;
    let ishaAngle = -17.0;
    let isIshaInterval90 = true;

    if (methodNum === 5) { fajrAngle = -19.5; ishaAngle = -17.5; isIshaInterval90 = false; }
    else if (methodNum === 1) { fajrAngle = -18.0; ishaAngle = -18.0; isIshaInterval90 = false; }
    else if (methodNum === 2) { fajrAngle = -15.0; ishaAngle = -15.0; isIshaInterval90 = false; }
    else if (methodNum === 3) { fajrAngle = -18.0; ishaAngle = -17.0; isIshaInterval90 = false; }
    else if (methodNum === 13) { fajrAngle = -18.0; ishaAngle = -17.0; isIshaInterval90 = false; }
    else if (methodNum === 11) { fajrAngle = -20.0; ishaAngle = -18.0; isIshaInterval90 = false; }

    const fajrH = getH(fajrAngle);
    const sunH = getH(-0.833);

    // تطبيق مذهب العصر: 1 للجمهور، 2 للحنفي
    const shadowFactor = (asrMadhab === 1) ? 2 : 1;
    const asrAlt = Math.atan(1 / (shadowFactor + Math.tan(Math.abs(lat - delta) * rad))) * deg;
    const asrH = getH(asrAlt);
    const maghribDec = solarNoon + (sunH || 1.05);

    // دالة التنسيق المعتمدة على Math.round وتطبيق دقائق التعديل اليدوي
    const fmt = (dec, offsetKey) => {
      if (dec === null || isNaN(dec)) return '00:00';
      dec = (dec + 24) % 24;
      let totalMinutes = Math.round(dec * 60);

      const extraMinutes = (offsets && offsets[offsetKey]) ? parseInt(offsets[offsetKey], 10) : 0;
      totalMinutes += extraMinutes;

      totalMinutes = (totalMinutes + 1440) % 1440;
      const h = Math.floor(totalMinutes / 60);
      const m = totalMinutes % 60;
      return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
    };

    // احتساب العشاء في رمضان بناءً على خيار المستخدم (120د، 90د، أو مخصص)
    let ishaGapHours = 1.5; // الافتراضي 90 دقيقة
    let isRamadanMonth = false;
    try {
      const hf = new Intl.DateTimeFormat('en-u-ca-islamic-umalqura-nu-latn', { month: 'numeric' });
      isRamadanMonth = (parseInt(hf.format(targetDate), 10) === 9);
    } catch(e) {}

    if (isRamadanMonth) {
      const rMode = localStorage.getItem('hayat_ramadan_isha_mode') || '120';
      if (rMode === '120') ishaGapHours = 2.0; // ساعتان
      else if (rMode === '90') ishaGapHours = 1.5; // ساعة ونصف
      else {
        const cMin = parseInt(localStorage.getItem('hayat_ramadan_isha_custom_min'), 10) || 100;
        ishaGapHours = cMin / 60;
      }
    }

    const ishaDec = isIshaInterval90 ? (maghribDec + ishaGapHours) : (solarNoon + (getH(ishaAngle) || ishaGapHours));

    return {
      Fajr: fmt(solarNoon - (fajrH || 1.35), 'Fajr'),
      Sunrise: fmt(solarNoon - (sunH || 1.05), 'Sunrise'),
      Dhuhr: fmt(solarNoon + (2 / 60), 'Dhuhr'),
      Asr: fmt(solarNoon + (asrH || 3.3) + (2 / 60), 'Asr'), // +2 دقيقة احترازية
      Maghrib: fmt(maghribDec + (2 / 60), 'Maghrib'),
      Isha: fmt(ishaDec, 'Isha')
    };
  }

  // جلب مواقيت الصلاة مع المعالجة الأوفلاين الكاملة للتنقل بين الأيام
  async function fetchPrayerTimes() {
    userLocation.lat = userLocation.lat || DEFAULT_LOCATION.lat || 21.4225;
    userLocation.lng = userLocation.lng || DEFAULT_LOCATION.lng || 39.8262;
    userLocation.city = userLocation.city || DEFAULT_LOCATION.city || 'مكة المكرمة';
    userLocation.method = userLocation.method || DEFAULT_LOCATION.method || 4;

    const cityNameEl = document.getElementById('cityNameText');
    if (cityNameEl) cityNameEl.textContent = userLocation.city;

    const targetDate = getTargetDateObject();
    const methodNum = userLocation.method;
    const timestamp = Math.floor(targetDate.getTime() / 1000);
    const url = `https://api.aladhan.com/v1/timings/${timestamp}?latitude=${userLocation.lat}&longitude=${userLocation.lng}&method=${methodNum}`;

    try {
      const response = await fetch(url);
      if (!response.ok) throw new Error('Network response not ok');
      const data = await response.json();

      if (data && data.data) {
        currentTimings = data.data.timings;

        if (data.data.meta && data.data.meta.timezone) {
          userLocation.timezone = data.data.meta.timezone;
        }

        // حفظ كاش اليوم الحالي فقط
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
      console.warn('جاري استخدام المحرك الفلكي الشمسي الأوفلاين لليوم المحدد...');
      const cached = JSON.parse(localStorage.getItem('hayat_cached_timings'));
      
      // 1. استخدام كاش اليوم فقط إذا كان المستخدم واقفاً على اليوم الحالي (currentDayOffset === 0)
      if (currentDayOffset === 0 && cached && cached.timings && cached.hijri) {
        currentTimings = cached.timings;
        if (cached.timezone) userLocation.timezone = cached.timezone;
        updatePrayerUI({ timings: cached.timings, date: { hijri: cached.hijri } });
      } else {
        // 2. عند التنقل لليوم التالي أو السابق بدون إنترنت: تشغيل الحساب الفلكي الشمسي لليوم المستهدف
        const tz = userLocation.timezoneOffset || (userLocation.lng > 40 ? 3 : 2);
        const method = userLocation.method || 4;
        const asrMadhab = userLocation.asrMadhab || 0;
        const offsets = userLocation.prayerOffsets || {};

        currentTimings = calculateLocalSolarTimings(targetDate, userLocation.lat, userLocation.lng, tz, method, asrMadhab, offsets);
        
        // 3. احتساب التاريخ الهجري محلياً لليوم المستهدف مع مراعاة فارق التعديل (+/- يومين)
        const hijriOffsetDays = parseInt(localStorage.getItem('hayat_hijri_offset') || '0', 10);
        const adjustedTargetDate = new Date(targetDate.getTime());
        if (hijriOffsetDays !== 0) {
          adjustedTargetDate.setDate(adjustedTargetDate.getDate() + hijriOffsetDays);
        }

        let localHijriData = null;
        try {
          const hf = new Intl.DateTimeFormat('en-u-ca-islamic-umalqura-nu-latn', { 
            day: 'numeric', 
            month: 'numeric', 
            year: 'numeric' 
          });
          const parts = hf.formatToParts(adjustedTargetDate);
          let hd = 1, hm = 1, hy = 1448;
          parts.forEach(p => {
            if (p.type === 'day') hd = parseInt(p.value, 10);
            if (p.type === 'month') hm = parseInt(p.value, 10);
            if (p.type === 'year') hy = parseInt(p.value, 10);
          });
          const arMonths = ['محرم', 'صفر', 'ربيع الأول', 'ربيع الثاني', 'جمادى الأولى', 'جمادى الآخرة', 'رجب', 'شعبان', 'رمضان', 'شوال', 'ذو القعدة', 'ذو الحجة'];
          localHijriData = { 
            day: hd, 
            month: { ar: arMonths[hm - 1] || 'ربيع الثاني' }, 
            year: hy 
          };
        } catch(e) {
          localHijriData = { day: 19, month: { ar: 'ربيع الثاني' }, year: 1448 };
        }

        updatePrayerUI({ timings: currentTimings, date: { hijri: localHijriData } });
      }
    }
  }

  // دالة ذكية تطبق فروق الدقائق اليدوية على أي توقيت قادم
  function applyPrayerOffset(timeStr, offsetMinutes) {
    if (!timeStr) return '';
    const cleanTime = timeStr.split(' ')[0];
    let [h, m] = cleanTime.split(':').map(Number);
    let totalMinutes = (h * 60) + m + (parseInt(offsetMinutes, 10) || 0);
    totalMinutes = (totalMinutes + 1440) % 1440;
    const finalH = Math.floor(totalMinutes / 60);
    const finalM = totalMinutes % 60;
    return `${String(finalH).padStart(2, '0')}:${String(finalM).padStart(2, '0')}`;
  }

  // 2. تحديث الواجهة والصلوات وتطبيق التعديل اليدوي سواء كان أونلاين أو أوفلاين
  function updatePrayerUI(apiData) {
    const rawTimings = apiData.timings;
    const offsets = userLocation.prayerOffsets || {};

    // تصدير المواقيت المعدلة بعد إضافة الدقائق اليدوية للنطاق العام
    currentTimings = {};
    window.currentTimings = currentTimings;
    PRAYER_KEYS.forEach(p => {
      const baseTime = rawTimings[p.key];
      const offsetVal = offsets[p.key] || 0;
      currentTimings[p.key] = applyPrayerOffset(baseTime, offsetVal);

      const row = document.querySelector(`.prayer-row[data-prayer="${p.key.toLowerCase()}"]`);
      if (row) {
        const timeEl = row.querySelector('.prayer-time');
        if (timeEl) {
          timeEl.textContent = formatTo12Hour(currentTimings[p.key]);
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

  let dateAutoCycleSeconds = 0;

  function renderDateDisplay() {
    const dateTextDisplay = document.getElementById('dateTextDisplay');
    const dayNameDisplay = document.getElementById('dayNameDisplay');

    if (dayNameDisplay) dayNameDisplay.textContent = currentDayName;
    if (dateTextDisplay) {
      dateTextDisplay.style.opacity = '0';
      dateTextDisplay.style.transform = 'translateY(-3px)';
      setTimeout(() => {
        dateTextDisplay.textContent = (activeDateMode === 'hijri') 
          ? (currentHijriText || '19 ربيع الثاني، 1448 هـ') 
          : currentGregorianText;
        dateTextDisplay.style.opacity = '1';
        dateTextDisplay.style.transform = 'translateY(0)';
      }, 160);
    }
  }

  // دالة تقليب التاريخ (تُصفّر عداد الـ 15 ثانية عند النقر اليدوي)
  function toggleDateMode(resetCycle = true) {
    if (resetCycle) dateAutoCycleSeconds = 0;
    activeDateMode = (activeDateMode === 'hijri') ? 'gregorian' : 'hijri';
    renderDateDisplay();
  }

  // متغيرات التناوب الذكي بين الصلاة القادمة ونهاية وقت الصلاة الحالية
  let countdownCycleSeconds = 0;
  let manualCountdownModeOverride = null; // null | 'next' | 'expire'

  // 3. محرك المسار الزمني التفاعلي المتطور (التناوب الذكي + منتصف الليل الشرعي + الجمعة + الإقامة)
  function startLiveCountdown() {
    // تفعيل التبديل اليدوي عند النقر على العداد
    const flipContainer = document.getElementById('countdownFlipContainer');
    if (flipContainer && !flipContainer.hasClickListener) {
      flipContainer.hasClickListener = true;
      flipContainer.addEventListener('click', () => {
        manualCountdownModeOverride = (manualCountdownModeOverride === 'expire') ? 'next' : 'expire';
        countdownCycleSeconds = (manualCountdownModeOverride === 'expire') ? 11 : 0;
      });
    }

    // ربط زر المعلومة الشرعية !
    const openFiqhBtn = document.getElementById('openPrayerFiqhInfoBtn');
    const fiqhModal = document.getElementById('prayerFiqhInfoModal');
    const closeFiqhBtn = document.getElementById('closePrayerFiqhBtn');
    const confirmCloseFiqhBtn = document.getElementById('confirmCloseFiqhModalBtn');

    if (openFiqhBtn && fiqhModal) {
      openFiqhBtn.onclick = (e) => {
        e.stopPropagation();
        fiqhModal.classList.add('show');
      };
    }
    if (closeFiqhBtn && fiqhModal) {
      closeFiqhBtn.onclick = () => fiqhModal.classList.remove('show');
    }
    if (confirmCloseFiqhBtn && fiqhModal) {
      confirmCloseFiqhBtn.onclick = () => fiqhModal.classList.remove('show');
    }

    setInterval(() => {
      if (!currentTimings) return;

      countdownCycleSeconds++;
      let now = new Date();
      // التناوب التلقائي للتاريخ كل 15 ثانية بين الهجري والميلادي
      dateAutoCycleSeconds++;
      if (dateAutoCycleSeconds % 15 === 0) {
        toggleDateMode(false);
      }
      
      if (userLocation.timezone) {
        try {
          now = new Date(new Date().toLocaleString('en-US', { timeZone: userLocation.timezone }));
        } catch (e) {
          now = new Date();
        }
      }

      // 1. كشف يوم الجمعة
      const isFriday = (now.getDay() === 5);
      const dhuhrLabel = document.getElementById('dhuhrPrayerNameDisplay');
      if (dhuhrLabel) {
        dhuhrLabel.textContent = isFriday ? 'صلاة الجمعة' : 'الظهر';
      }

      // 2. كشف شهر رمضان المبارك
      let isRamadan = false;
      try {
        const hf = new Intl.DateTimeFormat('en-u-ca-islamic-umalqura-nu-latn', { month: 'numeric' });
        isRamadan = (parseInt(hf.format(now), 10) === 9);
      } catch(e) {}

      const ramadanPill = document.getElementById('ramadanActivePill');
      if (ramadanPill) {
        ramadanPill.style.display = isRamadan ? 'inline-block' : 'none';
      }

      // 3. بناء تواريخ الصلوات الست بدقة
      const prayerDates = [];
      PRAYER_KEYS.forEach(p => {
        let pName = p.name;
        if (p.key === 'Dhuhr' && isFriday) pName = 'صلاة الجمعة';

        const tStr = currentTimings[p.key] ? currentTimings[p.key].split(' ')[0] : '00:00';
        const [h, m] = tStr.split(':').map(Number);
        const d = new Date(now.getTime());
        d.setHours(h, m, 0, 0);

        if (p.key === 'Dhuhr' && isFriday && localStorage.getItem('hayat_friday_method') === 'hanbali_early') {
          const earlyMins = parseInt(localStorage.getItem('hayat_friday_early_minutes'), 10) || 25;
          d.setMinutes(d.getMinutes() - earlyMins);
        }

        prayerDates.push({ key: p.key, name: pName, date: d, rawTime: currentTimings[p.key] });
      });

      // 4. تحديد الصلاة القادمة والسابقة
      let nextIndex = prayerDates.findIndex(p => p.date > now);
      let prevIndex = -1;

      if (nextIndex === -1) {
        nextIndex = 0;
        prevIndex = prayerDates.length - 1;
        const tomorrowFajr = new Date(prayerDates[0].date.getTime());
        tomorrowFajr.setDate(tomorrowFajr.getDate() + 1);
        prayerDates[0].targetDate = tomorrowFajr;
      } else {
        prevIndex = (nextIndex === 0) ? (prayerDates.length - 1) : (nextIndex - 1);
        prayerDates[nextIndex].targetDate = prayerDates[nextIndex].date;
      }

      const nextP = prayerDates[nextIndex];
      const prevP = prayerDates[prevIndex];
      const targetNextTime = nextP.targetDate || nextP.date;

      // 5. احتساب وقت انتهاء الصلاة الحالية شرعياً
      let currentPrayerEndTime = targetNextTime;
      let expirationLabel = `متبقي على نهاية وقت ${prevP.name}`;
      let hasPrayerEnded = false;
      let endedNoticeLabel = '';

      if (prevP.key === 'Isha') {
        // حساب منتصف الليل الشرعي = منتصف الوقت بين المغرب والفجر
        const maghribDate = prayerDates.find(p => p.key === 'Maghrib').date;
        const fajrTomorrow = targetNextTime;
        const halfNightMs = (fajrTomorrow.getTime() - maghribDate.getTime()) / 2;
        const islamicMidnight = new Date(maghribDate.getTime() + halfNightMs);
        currentPrayerEndTime = islamicMidnight;
        
        if (now >= islamicMidnight) {
          hasPrayerEnded = true;
          endedNoticeLabel = 'انتهى وقت صلاة العشاء';
        } else {
          expirationLabel = 'متبقي على نهاية وقت العشاء';
        }
      } else if (prevP.key === 'Fajr') {
        const sunriseDate = prayerDates.find(p => p.key === 'Sunrise').date;
        currentPrayerEndTime = sunriseDate;
        
        if (now >= sunriseDate) {
          hasPrayerEnded = true;
          endedNoticeLabel = 'انتهى وقت صلاة الفجر (الشروق)';
        } else {
          expirationLabel = 'متبقي على نهاية وقت الفجر (الشروق)';
        }
      }

      // 6. إدارة التناوب التلقائي: 10 ثوانٍ للصلاة القادمة و 5 ثوانٍ لانتهاء الفرض
      const cycleMod = countdownCycleSeconds % 15;
      let showExpirationMode = (cycleMod >= 10);

      if (manualCountdownModeOverride === 'expire') showExpirationMode = true;
      else if (manualCountdownModeOverride === 'next') showExpirationMode = false;

      // 7. مرحلة الأذان والإقامة
      const iqamahDefaults = { Fajr: 20, Dhuhr: 15, Asr: 15, Maghrib: 10, Isha: 15 };
      const savedIqamah = JSON.parse(localStorage.getItem('hayat_iqamah_settings')) || iqamahDefaults;
      const prevIqamahMins = savedIqamah[prevP.key] || 15;
      const diffFromPrevSec = Math.floor((now - prevP.date) / 1000);
      const isDuringIqamah = (diffFromPrevSec >= 0 && diffFromPrevSec < (prevIqamahMins * 60));

      const statusTag = document.getElementById('currentPrayerStatusTag');
      const countdownTimerEl = document.getElementById('countdownTimer');
      const flipBox = document.getElementById('countdownFlipContainer');

      // حساب وقت الصلاة القادمة الثابت
      const diffSec = Math.max(0, Math.floor((targetNextTime - now) / 1000));
      const hours = Math.floor(diffSec / 3600);
      const minutes = Math.floor((diffSec % 3600) / 60);
      const seconds = diffSec % 60;
      const nextPrayerCountdownText = `${String(hours).padStart(2, '0')} : ${String(minutes).padStart(2, '0')} : ${String(seconds).padStart(2, '0')}`;

      // فحص دخول وقت الصلاة عبر المحرك المركزي الموحد
      if (diffFromPrevSec >= 0 && diffFromPrevSec < 60) {
        if (typeof window.handlePrayerTimeEnter === 'function') {
          window.handlePrayerTimeEnter(prevP.key, prevP.name, prevP.rawTime);
        }
      }
      
      if (isDuringIqamah) {
        const remIqamahSec = (prevIqamahMins * 60) - diffFromPrevSec;
        const iM = Math.floor(remIqamahSec / 60);
        const iS = remIqamahSec % 60;
        if (statusTag) statusTag.textContent = `حان الآن أذان ${prevP.name}`;
        if (countdownTimerEl) {
          countdownTimerEl.textContent = `الإقامة: ${String(iM).padStart(2, '0')}:${String(iS).padStart(2, '0')}`;
          countdownTimerEl.style.color = '#86EFAC';
        }
        if (flipBox) flipBox.classList.remove('mode-expiration');
      } else if (showExpirationMode) {
        // إذا كنا في وضع التناوب:
        if (hasPrayerEnded) {
          // أ) وقت الصلاة قد انتهى بالفعل (بعد منتصف الليل أو بعد الشروق)
          if (statusTag) statusTag.textContent = endedNoticeLabel;
          // إبقاء العداد يعد تنازلياً نحو الصلاة القادمة بلون عنبري ليعرف كم تبقّى
          if (countdownTimerEl) {
            countdownTimerEl.textContent = nextPrayerCountdownText;
          }
          if (flipBox) flipBox.classList.add('mode-expiration');
        } else if (currentPrayerEndTime > now) {
          // ب) الصلاة ما زالت في وقتها ويُحسب الوقت المتبقي لانتهائها
          const diffExpSec = Math.max(0, Math.floor((currentPrayerEndTime - now) / 1000));
          const expH = Math.floor(diffExpSec / 3600);
          const expM = Math.floor((diffExpSec % 3600) / 60);
          const expS = diffExpSec % 60;

          if (statusTag) statusTag.textContent = expirationLabel;
          if (countdownTimerEl) {
            countdownTimerEl.textContent = `${String(expH).padStart(2, '0')} : ${String(expM).padStart(2, '0')} : ${String(expS).padStart(2, '0')}`;
          }
          if (flipBox) flipBox.classList.add('mode-expiration');
        }
      } else {
        // وضع الصلاة القادمة المعتاد (اللون الذهبي)
        if (statusTag) statusTag.textContent = `باقي على ${nextP.name}`;
        if (countdownTimerEl) {
          countdownTimerEl.textContent = nextPrayerCountdownText;
        }
        if (flipBox) flipBox.classList.remove('mode-expiration');

        // تنبيه قرب خروج الوقت في آخر 15 دقيقة
        const warnEnabled = localStorage.getItem('hayat_show_expiration_warning') !== 'false';
        const warnBanner = document.getElementById('prayerExpirationBanner');
        const warnText = document.getElementById('prayerExpirationText');
        if (warnBanner) {
          if (warnEnabled && diffSec <= 900 && diffSec > 0 && prevP.key !== 'Sunrise') {
            warnBanner.style.display = 'flex';
            if (warnText) warnText.textContent = `يوشك وقت صلاة ${prevP.name} على الخروج (متبقي ${Math.ceil(diffSec / 60)} د)`;
          } else {
            warnBanner.style.display = 'none';
          }
        }
      }

      // 8. تحريك المسار الزمني وعلامة منتصف الليل الفاصلة
      let prevTimeMs = prevP.date.getTime();
      let nextTimeMs = targetNextTime.getTime();
      if (prevTimeMs > nextTimeMs) {
        prevTimeMs -= (24 * 3600 * 1000);
      }

      const totalSpan = Math.max(1, nextTimeMs - prevTimeMs);
      const elapsed = Math.max(0, now.getTime() - prevTimeMs);
      const progressPercent = Math.min(100, Math.max(0, (elapsed / totalSpan) * 100));

      const trackFill = document.getElementById('timelineTrackProgress');
      const trackThumb = document.getElementById('timelineTrackThumb');
      const midnightMarker = document.getElementById('timelineMidnightMarker');

      const prevNameEl = document.getElementById('prevPrayerNameDisplay');
      const prevTimeEl = document.getElementById('prevPrayerTimeDisplay');
      const nextNameEl = document.getElementById('nextPrayerNameDisplay');
      const nextTimeEl = document.getElementById('nextPrayerTimeDisplay');

      if (trackFill) trackFill.style.width = `${progressPercent}%`;
      if (trackThumb) trackThumb.style.right = `${progressPercent}%`;

      // وضع علامة منتصف الليل الشرعي الفاصلة على المسار ليلاً بين العشاء والفجر
      if (midnightMarker) {
        if (prevP.key === 'Isha' && nextP.key === 'Fajr') {
          const maghribDate = prayerDates.find(p => p.key === 'Maghrib').date;
          const halfNightMs = (targetNextTime.getTime() - maghribDate.getTime()) / 2;
          const midnightMs = maghribDate.getTime() + halfNightMs;
          const midnightPosPercent = Math.min(100, Math.max(0, ((midnightMs - prevTimeMs) / totalSpan) * 100));

          midnightMarker.style.display = 'block';
          midnightMarker.style.right = `${midnightPosPercent}%`;
        } else {
          midnightMarker.style.display = 'none';
        }
      }

      if (prevNameEl) prevNameEl.textContent = prevP.name;
      if (prevTimeEl) prevTimeEl.textContent = formatTo12Hour(prevP.rawTime);
      if (nextNameEl) nextNameEl.textContent = nextP.name;
      if (nextTimeEl) nextTimeEl.textContent = formatTo12Hour(nextP.rawTime);

      document.querySelectorAll('.prayer-row').forEach(row => row.classList.remove('active-prayer'));
      const activeRow = document.querySelector(`.prayer-row[data-prayer="${nextP.key.toLowerCase()}"]`);
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

  // تقليب يدوي فوري للتاريخ عند النقر مع إعادة ضبط عداد الـ 15 ثانية
  if (dateTextClickArea) {
    dateTextClickArea.addEventListener('click', (e) => {
      e.stopPropagation();
      toggleDateMode(true);
    });
  }

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

  // 4. محرك إدارة واختيار الموقع والدول الشامل (مع استبقاء خوارزمية ليفنشتاين)
  const locationBadge = document.getElementById('locationBadge');
  const cityNameText = document.getElementById('cityNameText');
  const manualLocationModal = document.getElementById('manualLocationModal');
  const quickCitiesGrid = document.getElementById('quickCitiesGrid');
  const manualCityInput = document.getElementById('manualCityInput');
  const closeManualLocationBtn = document.getElementById('closeManualLocationBtn');
  const autoDetectLocationBtn = document.getElementById('autoDetectLocationBtn');

  // نافذة اختيار دول العالم
  const countrySelectModal = document.getElementById('countrySelectModal');
  const openCountrySelectModalBtn = document.getElementById('openCountrySelectModalBtn');
  const closeCountrySelectBtn = document.getElementById('closeCountrySelectBtn');
  const countrySearchInput = document.getElementById('countrySearchInput');
  const countriesListScroll = document.getElementById('countriesListScroll');
  const currentSelectedCountryText = document.getElementById('currentSelectedCountryText');
  const countryTriggerFlag = document.getElementById('countryTriggerFlag');

  let activeCountrySelection = 'all';

  // دالة متطورة لتنظيف وتجريد النصوص العربية والإنجليزية
  function normalizeArabic(text) {
    if (!text) return '';
    return text
      .toString()
      .trim()
      .toLowerCase()
      .replace(/[\u064B-\u065F\u0670\u0640]/g, '')
      .replace(/[أإآٱ]/g, 'ا')
      .replace(/ة/g, 'ه')
      .replace(/ى/g, 'ي')
      .replace(/(^|\s)ال/g, '$1') // حذف الـ التعريف من بداية أي كلمة في الجملة
      .replace(/\s+/g, ' ')
      .trim();
  }

  // خوارزمية ليفنشتاين للتشابه الإملائي (محفوظة بالكامل دون أي مساس)
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

  // دالة ذكية تفحص انتماء المدينة للدولة المختارة ثنائياً (عربي وإنجليزي واسم مركب)
  function isCityBelongsToCountry(cityObj, countryTarget) {
    if (!countryTarget || countryTarget === 'all') return true;
    
    const targetNorm = normalizeArabic(countryTarget);
    const cityCountryNorm = normalizeArabic(cityObj.country);

    // 1. فحص التطابق بالاتجاهين
    if (cityCountryNorm.includes(targetNorm) || targetNorm.includes(cityCountryNorm)) {
      return true;
    }

    // 2. فحص عبر مصفوفة WORLD_COUNTRIES إن وُجدت
    if (typeof WORLD_COUNTRIES !== 'undefined') {
      const matched = WORLD_COUNTRIES.find(w => 
        w.code !== 'all' && (
          normalizeArabic(w.nameAr).includes(targetNorm) ||
          targetNorm.includes(normalizeArabic(w.nameAr)) ||
          w.nameEn.toLowerCase().includes(countryTarget.toLowerCase()) ||
          countryTarget.toLowerCase().includes(w.nameEn.toLowerCase())
        )
      );

      if (matched) {
        const ar = normalizeArabic(matched.nameAr);
        const en = matched.nameEn.toLowerCase();
        if (cityCountryNorm.includes(ar) || ar.includes(cityCountryNorm)) return true;
        if (cityObj.country.toLowerCase().includes(en) || en.includes(cityObj.country.toLowerCase())) return true;
      }
    }

    return false;
  }

  function renderQuickCities(filterText = '') {
    if (!quickCitiesGrid) return;
    quickCitiesGrid.innerHTML = '';
    const rawQuery = filterText.trim();
    const query = normalizeArabic(rawQuery);

    // فحص هل كتب المستخدم اسم دولة في مربع البحث
    let matchedCountryFromSearch = null;
    if (typeof WORLD_COUNTRIES !== 'undefined' && rawQuery) {
      matchedCountryFromSearch = WORLD_COUNTRIES.find(c => 
        c.code !== 'all' && (
          normalizeArabic(c.nameAr).includes(query) || 
          query.includes(normalizeArabic(c.nameAr)) ||
          c.nameEn.toLowerCase().includes(rawQuery.toLowerCase())
        )
      );
    }

    // 1. فلترة وتصفية المدن المباشرة
    const exactMatches = REGION_CITIES.filter(c => {
      // أ) فلترة الدولة المختارة من القائمة المنبثقة
      const matchCountryFilter = isCityBelongsToCountry(c, activeCountrySelection);
      if (!matchCountryFilter) return false;

      // إذا لم يكتب أي نص بحث، اعرض كافة مدن هذه الدولة
      if (!rawQuery) return true;

      // ب) مطابقة اسم المدينة
      const cNameNorm = normalizeArabic(c.name);
      if (cNameNorm.includes(query) || query.includes(cNameNorm)) return true;

      // ج) مطابقة في حال كتب المستخدم اسم الدولة في مربع البحث
      if (matchedCountryFromSearch && isCityBelongsToCountry(c, matchedCountryFromSearch.nameAr)) {
        return true;
      }

      // د) مطابقة اسم الدولة المباشر المسجل مع المدينة
      const cCountryNorm = normalizeArabic(c.country);
      if (cCountryNorm.includes(query) || query.includes(cCountryNorm)) return true;

      return false;
    });

    if (exactMatches.length > 0) {
      exactMatches.forEach(c => {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'quick-city-btn';
        btn.innerHTML = `<span>${c.name}</span><span class="city-sub-country">${c.country}</span>`;
        btn.onclick = () => selectCity(c.name, c.lat, c.lng, c.country, c.method);
        quickCitiesGrid.appendChild(btn);
      });
      return;
    }

    // 2. خوارزمية اقتراح الـ 5 مدن عند الخطأ الإملائي (محفوظة وتعمل بدقة)
    if (rawQuery.length >= 2) {
      const targetList = (activeCountrySelection === 'all') 
        ? REGION_CITIES 
        : REGION_CITIES.filter(c => isCityBelongsToCountry(c, activeCountrySelection));

      const fuzzySuggestions = targetList.map(c => ({
        city: c,
        score: Math.max(
          getWordSimilarity(rawQuery, c.name),
          getWordSimilarity(rawQuery, c.country)
        )
      }))
      .filter(item => item.score >= 0.50)
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
          btn.onclick = () => selectCity(c.name, c.lat, c.lng, c.country, c.method);
          quickCitiesGrid.appendChild(btn);
        });
        return;
      }

      // 3. البحث في الخريطة العالمية أونلاين في حال تعذر التطابق الداخلي
      const searchOnlineBtn = document.createElement('button');
      searchOnlineBtn.type = 'button';
      searchOnlineBtn.className = 'quick-city-btn';
      searchOnlineBtn.style.gridColumn = 'span 3';
      searchOnlineBtn.textContent = `🔍 بحث عبر الخريطة العالمية عن: "${rawQuery}"`;
      searchOnlineBtn.onclick = () => searchCityOnline(rawQuery);
      quickCitiesGrid.appendChild(searchOnlineBtn);
    }
  }

  // عرض نافذة دول العالم وقائمتها
  function renderCountriesList(query = '') {
    if (!countriesListScroll || typeof WORLD_COUNTRIES === 'undefined') return;
    countriesListScroll.innerHTML = '';
    const cleanQ = normalizeArabic(query.trim());
    const cleanQEn = query.trim().toLowerCase();

    const filtered = WORLD_COUNTRIES.filter(c => {
      if (!cleanQ) return true;
      if (c.code === 'all') return true;
      const matchAr = normalizeArabic(c.nameAr).includes(cleanQ);
      const matchEn = c.nameEn.toLowerCase().includes(cleanQEn);
      return matchAr || matchEn;
    });

    filtered.forEach(c => {
      const isSelected = (c.code === 'all' && activeCountrySelection === 'all') || (activeCountrySelection === c.nameAr);
      const item = document.createElement('div');
      item.className = `country-select-item ${isSelected ? 'active' : ''}`;
      item.innerHTML = `
        <div class="country-select-item-title">
          <span>${c.flag}</span>
          <span>${c.nameAr}</span>
        </div>
        <span class="country-select-item-en">${c.nameEn}</span>
      `;
      item.onclick = () => {
        if (c.code === 'all') {
          activeCountrySelection = 'all';
          if (currentSelectedCountryText) currentSelectedCountryText.textContent = 'جميع الدول (All Countries)';
          if (countryTriggerFlag) countryTriggerFlag.textContent = '🌐';
        } else {
          activeCountrySelection = c.nameAr;
          if (currentSelectedCountryText) currentSelectedCountryText.textContent = `${c.nameAr} (${c.nameEn})`;
          if (countryTriggerFlag) countryTriggerFlag.textContent = c.flag;
        }

        // تفريغ مربع البحث لتظهر كافة مدن الدولة المختارة فوراً
        if (manualCityInput) manualCityInput.value = '';

        if (countrySelectModal) countrySelectModal.classList.remove('show');
        renderQuickCities('');
      };
      countriesListScroll.appendChild(item);
    });
  }

  // اختيار المدينة مع الحساب الفلكي الفوري أوفلاين
  async function selectCity(name, lat, lng, country = '', manualMethod = null) {
    // جلب الإعداد التلقائي المعتمد لتلك الدولة من الملف المنفصل
    let autoProfile = { method: 4, asrMadhab: 0, tz: 3 };
    if (typeof getAutoCountryPrayerProfile === 'function') {
      autoProfile = getAutoCountryPrayerProfile(country);
    }

    const method = manualMethod || autoProfile.method;
    const asrMadhab = (typeof userLocation.asrMadhab !== 'undefined' && manualMethod) ? userLocation.asrMadhab : autoProfile.asrMadhab;
    const tz = autoProfile.tz;
    const savedOffsets = userLocation.prayerOffsets || { Fajr: 0, Sunrise: 0, Dhuhr: 0, Asr: 0, Maghrib: 0, Isha: 0 };

    userLocation = {
      city: name,
      country: country,
      lat: lat,
      lng: lng,
      method: method,
      asrMadhab: asrMadhab,
      timezoneOffset: tz,
      prayerOffsets: savedOffsets
    };

    localStorage.setItem('hayat_saved_location', JSON.stringify(userLocation));
    localStorage.removeItem('hayat_cached_timings');

    if (cityNameText) cityNameText.textContent = name;
    if (manualLocationModal) manualLocationModal.classList.remove('show');

    // حساب فلكي شمسي فوري للشاشة بدون نت
    const targetDate = getTargetDateObject();
    currentTimings = calculateLocalSolarTimings(targetDate, lat, lng, tz, method, asrMadhab, savedOffsets);

    let localHijriData = null;
    try {
      const hf = new Intl.DateTimeFormat('en-u-ca-islamic-umalqura-nu-latn', { day: 'numeric', month: 'numeric', year: 'numeric' });
      const parts = hf.formatToParts(targetDate);
      let hd = 1, hm = 1, hy = 1448;
      parts.forEach(p => {
        if (p.type === 'day') hd = parseInt(p.value, 10);
        if (p.type === 'month') hm = parseInt(p.value, 10);
        if (p.type === 'year') hy = parseInt(p.value, 10);
      });
      const arMonths = ['محرم', 'صفر', 'ربيع الأول', 'ربيع الثاني', 'جمادى الأولى', 'جمادى الآخرة', 'رجب', 'شعبان', 'رمضان', 'شوال', 'ذو القعدة', 'ذو الحجة'];
      localHijriData = { day: hd, month: { ar: arMonths[hm - 1] || 'رمضان' }, year: hy };
    } catch(e) {}

    updatePrayerUI({ timings: currentTimings, date: { hijri: localHijriData } });
    if (typeof syncPrayerSettingsUI === 'function') syncPrayerSettingsUI();

    if (navigator.onLine) {
      fetchPrayerTimes().catch(() => {});
    }
  }

  // دالة تحديث الحسابات فورياً عند تغيير أي خيار من شاشة إعدادات المواقيت المستقلة
  window.applyPrayerSettingsUpdate = function() {
    let loc = DEFAULT_LOCATION;
    try {
      const saved = JSON.parse(localStorage.getItem('hayat_saved_location'));
      if (saved && saved.lat && saved.lng) loc = Object.assign({}, DEFAULT_LOCATION, saved);
    } catch(e) {}

    userLocation = loc;
    selectCity(loc.city, loc.lat, loc.lng, loc.country, loc.method);
  };

  // تصدير الوقت الفعلي الحالي لنافذة تعديل الدقيقة
  window.getCurrentPrayerTimeString = function(prayerKey) {
    if (currentTimings && currentTimings[prayerKey]) {
      return formatTo12Hour(currentTimings[prayerKey]);
    }
    return '--:--';
  };

  // البحث في الخريطة العالمية أونلاين
  async function searchCityOnline(query) {
    const cleanQuery = query.trim();
    if (!quickCitiesGrid) return;

    quickCitiesGrid.innerHTML = `
      <div style="grid-column: span 3; text-align: center; color: var(--text-secondary); padding: 16px; font-size: 13.5px;">
        جاري البحث في الخريطة العالمية... ⏳
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
        header.textContent = `📍 نتائج تم العثور عليها للاسم: "${cleanQuery}"`;
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
            ⚠️ لم يتم العثور على أي مدينة مطابقة للاسم: "<strong>${cleanQuery}</strong>"
          </div>
        `;
      }
    } catch (err) {
      quickCitiesGrid.innerHTML = `
        <div style="grid-column: span 3; text-align: center; color: var(--text-muted); padding: 14px; font-size: 13px;">
          تعذر الاتصال بالخريطة، يرجى الاختيار من المدن المخزنة.
        </div>
      `;
    }
  }

  if (openCountrySelectModalBtn && countrySelectModal) {
    openCountrySelectModalBtn.onclick = () => {
      if (countrySearchInput) countrySearchInput.value = '';
      renderCountriesList('');
      countrySelectModal.classList.add('show');
      setTimeout(() => { if (countrySearchInput) countrySearchInput.focus(); }, 150);
    };
  }

  if (closeCountrySelectBtn && countrySelectModal) {
    closeCountrySelectBtn.onclick = () => countrySelectModal.classList.remove('show');
  }

  if (countrySearchInput) {
    countrySearchInput.addEventListener('input', (e) => {
      renderCountriesList(e.target.value);
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
    locationBadge.addEventListener('click', openManualLocationModal);
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
            alert('تعذر تحديد موقع GPS بدقة، يمكنك اختيار مدينتك من القائمة.');
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

  // تم إلغاء تثبيت الهيدر ليتحرك وينسحب طبيعياً مع الصفحة
  
  // 0. تشغيل الساعة الرقمية الحية النابضة بالدقائق والوميض اللحظي
  function startLiveClockEngine() {
    const clockDisp = document.getElementById('liveClockDisplay');
    const clockPeriod = document.getElementById('liveClockPeriod');
    if (!clockDisp) return;

    function tick() {
      let now = new Date();
      if (userLocation.timezone) {
        try {
          now = new Date(new Date().toLocaleString('en-US', { timeZone: userLocation.timezone }));
        } catch(e) {}
      }

      let h = now.getHours();
      const m = now.getMinutes();
      const period = (h >= 12) ? 'م' : 'ص';
      h = h % 12 || 12;

      // وميض النقطتين الرأسيتين للدلالة على الساعة اللحظية
      clockDisp.innerHTML = `${String(h).padStart(2, '0')}<span class="clock-colon-blink">:</span>${String(m).padStart(2, '0')}`;
      if (clockPeriod) clockPeriod.textContent = period;
    }
    tick();
    setInterval(tick, 1000);
  }

  /// تشغيل جلب الأوقات والساعة الحية والعداد التنازلي وتفعيل مربعات الصلوات
  startLiveClockEngine();
  fetchPrayerTimes();
  startLiveCountdown();
  initPrayerChecklist();

  // استعادة الشاشة النشطة بأمان تام بعد اكتمال تهيئة كافة عناصر النظام
  const savedScreenId = localStorage.getItem('hayat_last_active_screen_id');
  if (savedScreenId && savedScreenId !== 'screen-home') {
    const targetScreenEl = document.getElementById(savedScreenId);
    if (targetScreenEl) {
      showScreen(targetScreenEl, false);
      if (savedScreenId === 'screen-azkar-categories' && typeof renderAzkarCategories === 'function') renderAzkarCategories();
      if (savedScreenId === 'screen-azkar-favorites' && typeof renderFavorites === 'function') renderFavorites();
      if (savedScreenId === 'screen-tasbeeh' && typeof initTasbeehEngine === 'function') initTasbeehEngine();
      if (savedScreenId === 'screen-calendar' && typeof window.initCalendarEngine === 'function') window.initCalendarEngine();
    }
  }

  // ==================== إعدادات وهوية التطبيق المركزية والمشاركة ====================
  const APP_CONFIG = {
    name: 'الحياة الطيبة',
    version: '2.1.105',
    url: 'https://sultraksa-prog.github.io/alhayat-altayyiba/',
    shortDesc: 'رفيقك اليومي لمواقيت الصلاة والأذكار والعبادات',
    // رابط تحميل الـ APK الحقيقي من Releases بمستودعك
    apkDownloadUrl: 'https://github.com/sultraksa-prog/alhayat-altayyiba/releases/latest/download/alhayat.apk',
    appStoreUrl: null,
    // رابط فحص ملف version.json المباشر من موقعك المنشور
    remoteVersionUrl: 'https://sultraksa-prog.github.io/alhayat-altayyiba/version.json'
  };

  // تحديث رقم الإصدار ديناميكياً في شاشة "حول الحياة الطيبة"
  const aboutVerBadge = document.getElementById('aboutVersionBadge');
  if (aboutVerBadge) {
    aboutVerBadge.textContent = `الإصدار ${APP_CONFIG.version}`;
  }

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

  // 1. مشاركة مواقيت اليوم كنص (يدعم الأندرويد والـ PWA)
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
🗓️ يوم: ${currentDayName || 'السبت'}
📅 التاريخ الهجري: ${currentHijriText}
📆 التاريخ الميلادي: ${currentGregorianText}

${timingsText}
✨ تطبيق الحياة الطيبة • رفيقك في الطاعة
📲 الرابط: ${APP_CONFIG.url}`;

      const isAndroidApp = !!(window.location.protocol === 'capacitor:' || window.location.hostname === 'localhost' || (window.Capacitor && window.Capacitor.isNativePlatform && window.Capacitor.isNativePlatform()));

      // خاص بالأندرويد: فتح نافذة الهاتف الأصلية
      if (isAndroidApp && window.Capacitor?.Plugins?.Share) {
        try {
          await window.Capacitor.Plugins.Share.share({
            title: APP_CONFIG.name,
            text: fullShareMessage,
            dialogTitle: 'مشاركة مواقيت الصلاة'
          });
          shareModalBackdrop.classList.remove('show');
          return;
        } catch(e) {}
      }

      // خاص بالـ PWA والمتصفح: الكود الأصلي
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

  // ==================== محرك تخصيص وتوليد بطاقات المشاركة بالزخارف الإسلامية الأصيلة ====================
  let shareCardSettings = JSON.parse(localStorage.getItem('hayat_share_card_settings')) || {
    template: 'royal-navy',
    motif: 'motif-1', // 'motif-1' | 'motif-2' | 'motif-3' | 'motif-4' | 'motif-5'
    withText: true,
    withBranding: true
  };

  const openShareImageSettingsBtn = document.getElementById('openShareImageSettingsBtn');
  const shareImageSettingsModal = document.getElementById('shareImageSettingsModal');
  const closeShareImageSettingsBtn = document.getElementById('closeShareImageSettingsBtn');
  const saveShareSettingsBtn = document.getElementById('saveShareSettingsBtn');
  const toggleShareWithText = document.getElementById('toggleShareWithText');
  const toggleShareWithBranding = document.getElementById('toggleShareWithBranding');
  const templateCards = document.querySelectorAll('.template-card');
  const motifCards = document.querySelectorAll('.motif-card');

  // فتح وإغلاق ومزامنة واجهة إعدادات القوالب والزخارف
  if (openShareImageSettingsBtn && shareImageSettingsModal) {
    openShareImageSettingsBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      if (toggleShareWithText) toggleShareWithText.checked = shareCardSettings.withText;
      if (toggleShareWithBranding) toggleShareWithBranding.checked = shareCardSettings.withBranding;
      
      templateCards.forEach(c => {
        c.classList.toggle('active', c.getAttribute('data-template') === shareCardSettings.template);
      });

      motifCards.forEach(m => {
        m.classList.toggle('active', m.getAttribute('data-motif') === (shareCardSettings.motif || 'motif-1'));
      });

      shareImageSettingsModal.classList.add('show');
    });

    if (closeShareImageSettingsBtn) {
      closeShareImageSettingsBtn.onclick = () => shareImageSettingsModal.classList.remove('show');
    }

    templateCards.forEach(card => {
      card.onclick = () => {
        templateCards.forEach(c => c.classList.remove('active'));
        card.classList.add('active');
        shareCardSettings.template = card.getAttribute('data-template');
      };
    });

    motifCards.forEach(card => {
      card.onclick = () => {
        motifCards.forEach(m => m.classList.remove('active'));
        card.classList.add('active');
        shareCardSettings.motif = card.getAttribute('data-motif');
      };
    });

    if (saveShareSettingsBtn) {
      saveShareSettingsBtn.onclick = () => {
        if (toggleShareWithText) shareCardSettings.withText = toggleShareWithText.checked;
        if (toggleShareWithBranding) shareCardSettings.withBranding = toggleShareWithBranding.checked;
        localStorage.setItem('hayat_share_card_settings', JSON.stringify(shareCardSettings));
        shareImageSettingsModal.classList.remove('show');
      };
    }
  }

  // ==================== دوال رسم الزخارف الهندسية الإسلامية الخمس المستخلصة من المرجع ====================

  // الزخرفة 1: شمسة سداسية عشرية مشعة (أعلى اليسار في المرجع)
  function drawMotifPattern1(ctx, cx, cy, r, color, strokeW = 2.4) {
    ctx.save();
    ctx.translate(cx, cy);
    ctx.strokeStyle = color;
    ctx.lineWidth = strokeW;

    ctx.beginPath(); ctx.arc(0, 0, r * 0.28, 0, 2 * Math.PI); ctx.stroke();
    ctx.beginPath(); ctx.arc(0, 0, r * 0.58, 0, 2 * Math.PI); ctx.stroke();
    ctx.beginPath(); ctx.arc(0, 0, r * 0.92, 0, 2 * Math.PI); ctx.stroke();

    const rays = 16;
    for (let i = 0; i < rays; i++) {
      ctx.save();
      ctx.rotate((i * 2 * Math.PI) / rays);
      ctx.beginPath();
      ctx.moveTo(0, r * 0.28);
      ctx.lineTo(r * 0.12, r * 0.6);
      ctx.lineTo(0, r * 0.92);
      ctx.lineTo(-r * 0.12, r * 0.6);
      ctx.closePath();
      ctx.stroke();
      ctx.restore();
    }
    ctx.restore();
  }

  // الزخرفة 2: نجمة الفصوص القرآنية (منتصف المرجع)
  function drawMotifPattern2(ctx, cx, cy, r, color, strokeW = 2.4) {
    ctx.save();
    ctx.translate(cx, cy);
    ctx.strokeStyle = color;
    ctx.lineWidth = strokeW;

    const starR = r * 0.45;
    ctx.strokeRect(-starR * 0.65, -starR * 0.65, starR * 1.3, starR * 1.3);
    ctx.save();
    ctx.rotate(45 * Math.PI / 180);
    ctx.strokeRect(-starR * 0.65, -starR * 0.65, starR * 1.3, starR * 1.3);
    ctx.restore();

    const lobes = 8;
    for (let i = 0; i < lobes; i++) {
      ctx.save();
      ctx.rotate((i * 2 * Math.PI) / lobes);
      ctx.beginPath();
      ctx.moveTo(0, r * 0.42);
      ctx.lineTo(r * 0.18, r * 0.68);
      ctx.lineTo(0, r * 0.95);
      ctx.lineTo(-r * 0.18, r * 0.68);
      ctx.closePath();
      ctx.stroke();
      ctx.restore();
    }
    ctx.restore();
  }

  // الزخرفة 3: الخاتم الأندلسي المزدوج (منتصف اليسار في المرجع)
  function drawMotifPattern3(ctx, cx, cy, r, color, strokeW = 2.4) {
    ctx.save();
    ctx.translate(cx, cy);
    ctx.strokeStyle = color;
    ctx.lineWidth = strokeW;

    const r1 = r * 0.85;
    ctx.strokeRect(-r1 * 0.5, -r1 * 0.5, r1, r1);
    ctx.save();
    ctx.rotate(45 * Math.PI / 180);
    ctx.strokeRect(-r1 * 0.5, -r1 * 0.5, r1, r1);
    ctx.restore();

    const r2 = r * 0.55;
    ctx.strokeRect(-r2 * 0.5, -r2 * 0.5, r2, r2);
    ctx.save();
    ctx.rotate(45 * Math.PI / 180);
    ctx.strokeRect(-r2 * 0.5, -r2 * 0.5, r2, r2);
    ctx.restore();

    ctx.beginPath();
    ctx.arc(0, 0, r * 0.18, 0, 2 * Math.PI);
    ctx.stroke();
    ctx.restore();
  }

  // الزخرفة 4: النجمة المرصعة بالمعينات (أعلى الوسط في المرجع)
  function drawMotifPattern4(ctx, cx, cy, r, color, strokeW = 2.4) {
    ctx.save();
    ctx.translate(cx, cy);
    ctx.strokeStyle = color;
    ctx.lineWidth = strokeW;

    ctx.beginPath();
    const starPoints = 8;
    for (let i = 0; i < starPoints * 2; i++) {
      const radius = (i % 2 === 0) ? r * 0.45 : r * 0.22;
      const angle = (i * Math.PI) / starPoints;
      const x = Math.cos(angle) * radius;
      const y = Math.sin(angle) * radius;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.closePath();
    ctx.stroke();

    for (let i = 0; i < 8; i++) {
      ctx.save();
      ctx.rotate((i * 2 * Math.PI) / 8);
      ctx.translate(0, r * 0.72);
      ctx.rotate(45 * Math.PI / 180);
      const dSize = r * 0.16;
      ctx.strokeRect(-dSize / 2, -dSize / 2, dSize, dSize);
      ctx.restore();
    }
    ctx.restore();
  }

  // الزخرفة 5: العقدة الهندسية المتشابكة (أسفل الوسط في المرجع)
  function drawMotifPattern5(ctx, cx, cy, r, color, strokeW = 2.4) {
    ctx.save();
    ctx.translate(cx, cy);
    ctx.strokeStyle = color;
    ctx.lineWidth = strokeW;

    const bSize = r * 0.82;
    ctx.beginPath();
    ctx.roundRect(-bSize / 2, -bSize / 2, bSize, bSize, 8);
    ctx.stroke();

    ctx.save();
    ctx.rotate(45 * Math.PI / 180);
    ctx.beginPath();
    ctx.roundRect(-bSize / 2, -bSize / 2, bSize, bSize, 8);
    ctx.stroke();
    ctx.restore();

    ctx.beginPath();
    ctx.moveTo(0, -r * 0.65);
    ctx.lineTo(r * 0.65, 0);
    ctx.lineTo(0, r * 0.65);
    ctx.lineTo(-r * 0.65, 0);
    ctx.closePath();
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(0, 0, r * 0.2, 0, 2 * Math.PI);
    ctx.stroke();
    ctx.restore();
  }

  // محول رسم الزخرفة المختارة
  function renderChosenIslamicMotif(ctx, motifId, cx, cy, r, color, strokeW = 2.4) {
    if (motifId === 'motif-2') drawMotifPattern2(ctx, cx, cy, r, color, strokeW);
    else if (motifId === 'motif-3') drawMotifPattern3(ctx, cx, cy, r, color, strokeW);
    else if (motifId === 'motif-4') drawMotifPattern4(ctx, cx, cy, r, color, strokeW);
    else if (motifId === 'motif-5') drawMotifPattern5(ctx, cx, cy, r, color, strokeW);
    else drawMotifPattern1(ctx, cx, cy, r, color, strokeW);
  }

  // دالة التوزيع الفني الجديد للزخارف: تناظر قطري بالهيدر + زخرفة كبرى محورية بالصلوات وحليات متفرقة
  function applyCuratedMotifComposition(ctx, motifId, tConfig) {
    // 1. زخارف الهيدر العلوي بنظام التناظر القطري (أعلى اليمين + أسفل اليسار)
    ctx.save();
    const headerColor = tConfig.isTwoTone ? tConfig.headerDayColor : tConfig.motifColor;
    const headerOpacity = tConfig.isTwoTone ? 0.14 : (tConfig.motifOpacity * 1.15);
    ctx.globalAlpha = headerOpacity;

    // أ) الزخرفة الأولى: في أعلى اليمين من الهيدر
    renderChosenIslamicMotif(ctx, motifId, 925, 110, 85, headerColor, 2.5);

    // ب) الزخرفة الثانية: في أسفل اليسار من الهيدر
    renderChosenIslamicMotif(ctx, motifId, 155, 335, 78, headerColor, 2.5);
    ctx.restore();

    // 2. منطقة جدول مواقيت الصلاة (الزخرفة الكبرى وحلياتها المحيطة)
    ctx.save();
    const bodyColor = tConfig.isTwoTone ? tConfig.dividerColor : tConfig.motifColor;
    const bodyOpacity = tConfig.isTwoTone ? 0.08 : tConfig.motifOpacity;

    // أ) الزخرفة الكبرى المحورية: تتوسط خلفية جدول الصلوات بحجم كبير مهيب كعلامة مائية ناعمة
    ctx.globalAlpha = bodyOpacity;
    renderChosenIslamicMotif(ctx, motifId, ctx.canvas.width / 2, 810, 285, bodyColor, 3.2);

    // ب) أربع زخارف متفرقة صغيرة مرافقة حول الزخرفة الكبرى في أركان منطقة الصلوات
    ctx.globalAlpha = bodyOpacity * 0.95;
    // أعلى يمين منطقة الصلوات
    renderChosenIslamicMotif(ctx, motifId, 160, 560, 42, bodyColor, 2.0);
    // أعلى يسار منطقة الصلوات
    renderChosenIslamicMotif(ctx, motifId, ctx.canvas.width - 160, 560, 42, bodyColor, 2.0);
    // أسفل يمين منطقة الصلوات
    renderChosenIslamicMotif(ctx, motifId, 160, 1060, 46, bodyColor, 2.0);
    // أسفل يسار منطقة الصلوات
    renderChosenIslamicMotif(ctx, motifId, ctx.canvas.width - 160, 1060, 46, bodyColor, 2.0);

    ctx.restore();
  }

  // دالة رسم الخطوط الفاصلة الرقيقة التي تتوسطها وردة فاصل الآيات
  function drawTaperedDividerWithRosette(ctx, y, color = '#D4AF37', maxWidth = 700, rosetteRadius = 26) {
    const cx = ctx.canvas.width / 2;
    const gap = rosetteRadius + 6;

    ctx.save();
    const gradRight = ctx.createLinearGradient(cx + gap, y, cx + maxWidth / 2, y);
    gradRight.addColorStop(0, color);
    gradRight.addColorStop(1, 'rgba(255, 255, 255, 0)');
    ctx.strokeStyle = gradRight;
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    ctx.moveTo(cx + gap, y);
    ctx.lineTo(cx + maxWidth / 2, y);
    ctx.stroke();

    const gradLeft = ctx.createLinearGradient(cx - gap, y, cx - maxWidth / 2, y);
    gradLeft.addColorStop(0, color);
    gradLeft.addColorStop(1, 'rgba(255, 255, 255, 0)');
    ctx.strokeStyle = gradLeft;
    ctx.beginPath();
    ctx.moveTo(cx - gap, y);
    ctx.lineTo(cx - maxWidth / 2, y);
    ctx.stroke();
    ctx.restore();

    drawQuranicAyahRosette(ctx, cx, y, rosetteRadius, color);
  }

  // دالة رسم وردة فاصل الآيات
  function drawQuranicAyahRosette(ctx, cx, cy, radius = 26, color = '#FCD34D') {
    ctx.save();
    ctx.translate(cx, cy);
    ctx.strokeStyle = color;
    ctx.fillStyle = color;
    ctx.lineWidth = 1.9;

    ctx.beginPath();
    ctx.arc(0, 0, radius * 0.38, 0, 2 * Math.PI);
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(0, 0, radius * 0.14, 0, 2 * Math.PI);
    ctx.fill();

    const petals = 12;
    for (let i = 0; i < petals; i++) {
      const angle = (i * 2 * Math.PI) / petals;
      const cos = Math.cos(angle);
      const sin = Math.sin(angle);
      const tipX = cos * radius;
      const tipY = sin * radius;

      const baseAngle1 = angle - (Math.PI / petals) * 0.75;
      const baseAngle2 = angle + (Math.PI / petals) * 0.75;
      const b1X = Math.cos(baseAngle1) * (radius * 0.55);
      const b1Y = Math.sin(baseAngle1) * (radius * 0.55);
      const b2X = Math.cos(baseAngle2) * (radius * 0.55);
      const b2Y = Math.sin(baseAngle2) * (radius * 0.55);

      ctx.beginPath();
      ctx.moveTo(b1X, b1Y);
      ctx.quadraticCurveTo(cos * (radius * 0.76), sin * (radius * 0.76), tipX, tipY);
      ctx.quadraticCurveTo(cos * (radius * 0.76), sin * (radius * 0.76), b2X, b2Y);
      ctx.stroke();

      if (i % 2 === 0) {
        ctx.beginPath();
        ctx.arc(tipX * 0.85, tipY * 0.85, 1.8, 0, 2 * Math.PI);
        ctx.fill();
      }
    }
    ctx.restore();
  }

  // رسم الصرح المعماري المذهب الحقيقي للتطبيق في الفوتر
  function drawRealBrandEmblem(ctx, cx, cy, scale = 1, goldColor = '#FCD34D') {
    ctx.save();
    ctx.translate(cx, cy);
    ctx.scale(scale, scale);
    ctx.fillStyle = goldColor;
    ctx.strokeStyle = goldColor;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    ctx.beginPath();
    ctx.arc(0, -60, 9, 0.4 * Math.PI, 1.8 * Math.PI, false);
    ctx.arc(2, -60, 6.5, 1.7 * Math.PI, 0.5 * Math.PI, true);
    ctx.closePath();
    ctx.fill();
    ctx.fillRect(-1.5, -46, 3, 10);

    ctx.beginPath();
    ctx.moveTo(0, -36);
    ctx.bezierCurveTo(12, -26, 20, -14, 18, 0);
    ctx.lineTo(-18, 0);
    ctx.bezierCurveTo(-20, -14, -12, -26, 0, -36);
    ctx.closePath();
    ctx.fill();

    ctx.fillRect(-22, 0, 44, 6);
    ctx.fillRect(-17, 6, 34, 22);

    ctx.fillStyle = 'rgba(0, 0, 0, 0.45)';
    ctx.beginPath(); ctx.arc(0, 16, 3.5, Math.PI, 0); ctx.lineTo(3.5, 28); ctx.lineTo(-3.5, 28); ctx.closePath(); ctx.fill();
    ctx.beginPath(); ctx.arc(-10, 18, 2.5, Math.PI, 0); ctx.lineTo(-7.5, 28); ctx.lineTo(-12.5, 28); ctx.closePath(); ctx.fill();
    ctx.beginPath(); ctx.arc(10, 18, 2.5, Math.PI, 0); ctx.lineTo(12.5, 28); ctx.lineTo(7.5, 28); ctx.closePath(); ctx.fill();

    ctx.fillStyle = goldColor;
    ctx.fillRect(-25, 28, 50, 7);
    ctx.beginPath();
    ctx.moveTo(-23, 35); ctx.lineTo(23, 35); ctx.lineTo(18, 42); ctx.lineTo(-18, 42);
    ctx.closePath(); ctx.fill();

    ctx.fillRect(-18, 42, 36, 24);
    ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
    ctx.beginPath();
    ctx.moveTo(0, 48); ctx.lineTo(4, 54); ctx.lineTo(0, 60); ctx.lineTo(-4, 54);
    ctx.closePath(); ctx.fill();

    ctx.fillStyle = goldColor;
    ctx.fillRect(-26, 66, 52, 6);
    ctx.fillRect(-23, 72, 46, 22);

    ctx.fillStyle = 'rgba(0, 0, 0, 0.55)';
    ctx.beginPath();
    ctx.arc(0, 81, 7, Math.PI, 0);
    ctx.lineTo(7, 94); ctx.lineTo(-7, 94);
    ctx.closePath(); ctx.fill();

    ctx.fillStyle = goldColor;
    ctx.beginPath();
    ctx.moveTo(23, 94);
    ctx.bezierCurveTo(45, 94, 70, 84, 85, 68);
    ctx.bezierCurveTo(74, 62, 62, 70, 56, 78);
    ctx.bezierCurveTo(42, 74, 30, 86, 23, 92);
    ctx.closePath(); ctx.fill();

    ctx.beginPath();
    ctx.moveTo(-23, 94);
    ctx.bezierCurveTo(-45, 94, -70, 84, -85, 68);
    ctx.bezierCurveTo(-74, 62, -62, 70, -56, 78);
    ctx.bezierCurveTo(-42, 74, -30, 86, -23, 92);
    ctx.closePath(); ctx.fill();

    ctx.fillRect(-90, 94, 180, 4);
    ctx.restore();
  }

  // ==================== توليد صورة المشاركة بالتوزيع الجديد ====================
  if (btnShareAsImage) {
    btnShareAsImage.addEventListener('click', async () => {
      btnShareAsImage.innerHTML = '<span>جاري إنشاء البطاقة الفاخرة... 🎨</span>';

      const canvas = document.createElement('canvas');
      canvas.width = 1080;
      canvas.height = 1440;
      const ctx = canvas.getContext('2d');

      const tmpl = shareCardSettings.template;
      const chosenMotif = shareCardSettings.motif || 'motif-1';

      // إعدادات ألوان القوالب الخمسة
      let tConfig = {
        isTwoTone: false,
        bgGradient: ['#06152B', '#09203F', '#113F67', '#1D5D9B'], // 1. الكحلي الملكي
        motifColor: '#FCD34D',
        motifOpacity: 0.08,
        dayColor: '#FDE68A',
        cityColor: '#E2E8F0',
        hijriColor: '#FFFFFF',
        gregColor: '#93C5FD',
        cardRowBg: 'rgba(255, 255, 255, 0.09)',
        cardRowBorder: 'rgba(255, 255, 255, 0.12)',
        prayerNameColor: '#FFFFFF',
        prayerTimeColor: '#FCD34D',
        dividerColor: '#D4AF37',
        emblemGold: '#FCD34D',
        footerTextColor: '#FCD34D',
        footerSubColor: '#E2E8F0'
      };

      if (tmpl === 'emerald-ivory') {
        // 2. الزمردي والعاجي الفاخر
        tConfig = {
          isTwoTone: true,
          headerBg: '#064E3B',
          bodyBg: '#FAF7F0',
          motifColor: '#FEF3C7',
          motifOpacity: 0.08,
          dayColor: '#FEF3C7',
          cityColor: '#D1FAE5',
          hijriColor: '#FFFFFF',
          gregColor: '#A7F3D0',
          cardRowBg: '#FFFFFF',
          cardRowBorder: 'rgba(6, 78, 59, 0.12)',
          prayerNameColor: '#1E293B',
          prayerTimeColor: '#064E3B',
          dividerColor: '#10B981',
          emblemGold: '#064E3B',
          footerTextColor: '#064E3B',
          footerSubColor: '#64748B'
        };
      } else if (tmpl === 'sand-bronze') {
        // 3. العقيق والرملي التراثي
        tConfig = {
          isTwoTone: true,
          headerBg: '#7C2D12',
          bodyBg: '#FFFDF7',
          motifColor: '#FEF3C7',
          motifOpacity: 0.08,
          dayColor: '#FEF3C7',
          cityColor: '#FED7AA',
          hijriColor: '#FFFFFF',
          gregColor: '#FFEDD5',
          cardRowBg: '#FFFFFF',
          cardRowBorder: 'rgba(124, 45, 18, 0.12)',
          prayerNameColor: '#451A03',
          prayerTimeColor: '#C2410C',
          dividerColor: '#EA580C',
          emblemGold: '#7C2D12',
          footerTextColor: '#7C2D12',
          footerSubColor: '#78350F'
        };
      } else if (tmpl === 'midnight-gold') {
        // 4. الأسود الفاحم والذهب الخالص
        tConfig = {
          isTwoTone: false,
          bgGradient: ['#020408', '#070C15', '#0E1726', '#162032'],
          motifColor: '#F59E0B',
          motifOpacity: 0.08,
          dayColor: '#FBBF24',
          cityColor: '#D1D5DB',
          hijriColor: '#FFFFFF',
          gregColor: '#9CA3AF',
          cardRowBg: 'rgba(255, 255, 255, 0.05)',
          cardRowBorder: 'rgba(245, 158, 11, 0.25)',
          prayerNameColor: '#FFFFFF',
          prayerTimeColor: '#F59E0B',
          dividerColor: '#F59E0B',
          emblemGold: '#FBBF24',
          footerTextColor: '#F59E0B',
          footerSubColor: '#9CA3AF'
        };
      } else if (tmpl === 'emerald-gold' || tmpl === 'classic-blue') {
        // 5. الأخضر الزمردي الملكي الكامل
        tConfig = {
          isTwoTone: false,
          bgGradient: ['#02231A', '#043A2B', '#064E3B', '#0D6D53'],
          motifColor: '#FDE68A',
          motifOpacity: 0.08,
          dayColor: '#FDE68A',
          cityColor: '#D1FAE5',
          hijriColor: '#FFFFFF',
          gregColor: '#A7F3D0',
          cardRowBg: 'rgba(255, 255, 255, 0.09)',
          cardRowBorder: 'rgba(253, 230, 138, 0.25)',
          prayerNameColor: '#FFFFFF',
          prayerTimeColor: '#FDE68A',
          dividerColor: '#FDE68A',
          emblemGold: '#FDE68A',
          footerTextColor: '#FDE68A',
          footerSubColor: '#D1FAE5'
        };
      }

      // ==================== 1. رسم الخلفية وتطبيق التوزيع الفني الجديد ====================
      if (tConfig.isTwoTone) {
        ctx.fillStyle = tConfig.bodyBg;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        ctx.fillStyle = tConfig.headerBg;
        ctx.beginPath();
        ctx.roundRect(0, 0, canvas.width, 425, [0, 0, 48, 48]);
        ctx.fill();

        // تطبيق التوزيع الفني الجديد (قطري بالهيدر + مركزي كبير بالصلوات مع الحليات)
        applyCuratedMotifComposition(ctx, chosenMotif, tConfig);
      } else {
        const grad = ctx.createLinearGradient(0, 0, 0, canvas.height);
        tConfig.bgGradient.forEach((color, idx) => {
          grad.addColorStop(idx / (tConfig.bgGradient.length - 1), color);
        });
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // تطبيق التوزيع الفني الجديد
        applyCuratedMotifComposition(ctx, chosenMotif, tConfig);
      }

      ctx.direction = 'rtl';
      ctx.textAlign = 'center';

      // ==================== 2. نصوص الهيدر العلوي ====================
      ctx.font = 'bold 64px "Cairo", sans-serif';
      ctx.fillStyle = tConfig.dayColor;
      ctx.fillText(currentDayName || 'السبت', canvas.width / 2, 115);

      ctx.font = 'bold 36px "Cairo", sans-serif';
      ctx.fillStyle = tConfig.cityColor;
      ctx.fillText(`مواقيت الصلاة - ${userLocation.city}`, canvas.width / 2, 185);

      drawTaperedDividerWithRosette(ctx, 225, tConfig.dividerColor, 340, 10);

      ctx.font = 'bold 36px "Cairo", sans-serif';
      ctx.fillStyle = tConfig.hijriColor;
      const cleanHijri = '\u200F' + (currentHijriText || '').trim();
      ctx.fillText(cleanHijri, canvas.width / 2, 290);

      ctx.font = '600 28px "Cairo", sans-serif';
      ctx.fillStyle = tConfig.gregColor;
      const cleanGreg = '\u200F' + (currentGregorianText || '').trim();
      ctx.fillText(cleanGreg, canvas.width / 2, 345);

      drawTaperedDividerWithRosette(ctx, 425, tConfig.dividerColor, 720, 26);

      // ==================== 3. جدول الصلوات الست بمظهر نقي وصافٍ ====================
      let startY = 495;
      PRAYER_KEYS.forEach((p) => {
        ctx.fillStyle = tConfig.cardRowBg;
        ctx.beginPath();
        ctx.roundRect(100, startY - 48, canvas.width - 200, 84, 18);
        ctx.fill();

        ctx.strokeStyle = tConfig.cardRowBorder;
        ctx.lineWidth = 1.2;
        ctx.stroke();

        ctx.font = 'bold 36px "Cairo", sans-serif';
        ctx.fillStyle = tConfig.prayerNameColor;
        ctx.textAlign = 'right';
        ctx.fillText(p.name, canvas.width - 150, startY + 8);

        ctx.fillStyle = tConfig.prayerTimeColor;
        ctx.textAlign = 'left';
        const formattedT = currentTimings ? formatTo12Hour(currentTimings[p.key]) : '--:--';
        ctx.fillText(formattedT, 150, startY + 8);

        startY += 108;
      });

      // ==================== 4. الفوتر وشعار الصرح المذهب الحقيقي ====================
      if (shareCardSettings.withBranding) {
        drawTaperedDividerWithRosette(ctx, 1175, tConfig.dividerColor, 700, 26);
        drawRealBrandEmblem(ctx, canvas.width / 2, 1245, 0.72, tConfig.emblemGold);

        ctx.textAlign = 'center';
        ctx.font = 'bold 34px "Cairo", sans-serif';
        ctx.fillStyle = tConfig.footerTextColor;
        ctx.fillText('الحياة الطيبة', canvas.width / 2, 1362);

        ctx.font = '600 23px "Cairo", sans-serif';
        ctx.fillStyle = tConfig.footerSubColor;
        ctx.fillText('تطبيق الحياة الطيبة • رفيقك في الطاعة', canvas.width / 2, 1405);
      }

      const isAndroidApp = !!(window.location.protocol === 'capacitor:' || window.location.hostname === 'localhost' || (window.Capacitor && window.Capacitor.isNativePlatform && window.Capacitor.isNativePlatform()));

      // إعداد نص الرسالة المرافقة
      let timingsText = '';
      if (currentTimings) {
        PRAYER_KEYS.forEach(p => {
          timingsText += `• ${p.name}: ${formatTo12Hour(currentTimings[p.key])}\n`;
        });
      }
      const fullShareMessage = `🕌 مواقيت الصلاة - ${userLocation.city}
🗓️ يوم: ${currentDayName || 'السبت'}
📅 التاريخ الهجري: ${currentHijriText}
📆 التاريخ الميلادي: ${currentGregorianText}

${timingsText}
✨ تطبيق الحياة الطيبة • رفيقك في الطاعة
📲 الرابط: ${APP_CONFIG.url}`;

      // خاص بالأندرويد: مشاركة الصورة الأصلية عبر كاباسيتور
      if (isAndroidApp && window.Capacitor?.Plugins?.Share && window.Capacitor?.Plugins?.Filesystem) {
        try {
          const rawBase64 = canvas.toDataURL('image/png').replace(/^data:image\/png;base64,/, '');
          const tempFile = await window.Capacitor.Plugins.Filesystem.writeFile({
            path: `prayer-card-${Date.now()}.png`,
            data: rawBase64,
            directory: 'CACHE'
          });

          await window.Capacitor.Plugins.Share.share({
            title: `مواقيت الصلاة - ${userLocation.city}`,
            text: shareCardSettings.withText ? fullShareMessage : '',
            files: [tempFile.uri],
            dialogTitle: 'مشاركة بطاقة المواقيت'
          });

          btnShareAsImage.innerHTML = '<span>مشاركة كصورة 🖼️</span>';
          shareModalBackdrop.classList.remove('show');
          return;
        } catch(err) {
          console.warn('Native prayer image share error:', err);
        }
      }

      // خاص بالـ PWA والمتصفح: الكود الأصلي دون تغيير
      canvas.toBlob(async (blob) => {
        btnShareAsImage.innerHTML = '<span>مشاركة كصورة 🖼️</span>';
        const file = new File([blob], `مواقيت-${userLocation.city}.png`, { type: 'image/png' });

        const sharePayload = {
          files: [file],
          title: `مواقيت الصلاة - ${userLocation.city}`
        };
        if (shareCardSettings.withText) {
          sharePayload.text = fullShareMessage;
        }

        if (navigator.canShare && navigator.canShare(sharePayload)) {
          try {
            await navigator.share(sharePayload);
          } catch (e) {}
        } else {
          const link = document.createElement('a');
          link.download = `مواقيت-${userLocation.city}.png`;
          link.href = canvas.toDataURL();
          link.click();
          alert('تم إنشاء وتنزيل بطاقة المواقيت الفاخرة بنجاح!');
        }
        shareModalBackdrop.classList.remove('show');
      }, 'image/png');
    });
  }
  
  // 3. مشاركة رسالة دعوة الأصدقاء (يدعم الأندرويد والـ PWA)
  if (btnShareInvite) {
    btnShareInvite.addEventListener('click', async () => {
      const inviteMessage = 
`السلام عليكم ورحمة الله وبركاته 🌸
أدعوك لتجربة تطبيق "${APP_CONFIG.name}":
✨ ${APP_CONFIG.shortDesc}

📲 افتح التطبيق مباشرة عبر الرابط:
${APP_CONFIG.url}`;

      const isAndroidApp = !!(window.location.protocol === 'capacitor:' || window.location.hostname === 'localhost' || (window.Capacitor && window.Capacitor.isNativePlatform && window.Capacitor.isNativePlatform()));

      // خاص بالأندرويد: نافذة الهاتف الأصلية
      if (isAndroidApp && window.Capacitor?.Plugins?.Share) {
        try {
          await window.Capacitor.Plugins.Share.share({
            title: APP_CONFIG.name,
            text: inviteMessage,
            dialogTitle: 'دعوة الأصدقاء'
          });
          shareModalBackdrop.classList.remove('show');
          return;
        } catch(e) {}
      }

      // خاص بالـ PWA والمتصفح: الكود الأصلي
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

  // ==================== تسجيل Service Worker ونظام التحديث الذكي ====================
  const UPDATE_CHECK_INTERVAL_MS = 7 * 24 * 60 * 60 * 1000; // عداد 7 أيام بالملي ثانية

  // 1. فحص حالات اكتمال التحديث أو الإصلاح الإجباري فور الإقلاع
  const forcePurgeSuccess = localStorage.getItem('hayat_force_purge_success');
  const justUpdatedFlag = localStorage.getItem('hayat_just_updated_flag') || localStorage.getItem('hayat_just_updated_version');

  // أ) في حال نجاح التحديث الإجباري وإصلاح الملفات
  if (forcePurgeSuccess) {
    localStorage.removeItem('hayat_force_purge_success');

    setTimeout(() => {
      const modal = document.getElementById('upToDateModal');
      const icon = document.getElementById('modalStatusIcon');
      const title = document.getElementById('modalStatusTitle');
      const text = document.getElementById('modalStatusText');
      const purgeSec = document.getElementById('modalPurgeSection');
      const closeBtn = document.getElementById('closeUpToDateBtn');

      if (modal && title && text) {
        if (icon) icon.textContent = '🛠️';
        title.textContent = 'تم الإصلاح والتحديث';
        text.innerHTML = `تمت عملية التحديث الإجباري وإصلاح ملفات التطبيق بنجاح.<br>نسأل الله أن يوفقكم ويتقبل طاعتكم وصالح أعمالكم 🌙`;
        
        // إخفاء قسم التحديث الإجباري في رسالة النجاح
        if (purgeSec) purgeSec.style.display = 'none';

        // إغلاق النافذة فقط والبقاء في نفس شاشة المستخدم الحالية دون أي توجيه إجباري
        if (closeBtn) {
          closeBtn.onclick = () => {
            modal.classList.remove('show');
          };
        }

        modal.classList.add('show');
      }
    }, 450);
  } 
  // ب) في حال التحديث العادي عبر زر "تحديث الآن"
  else if (justUpdatedFlag) {
    localStorage.removeItem('hayat_just_updated_flag');
    localStorage.removeItem('hayat_just_updated_version');

    setTimeout(() => {
      const modal = document.getElementById('upToDateModal');
      const icon = document.getElementById('modalStatusIcon');
      const title = document.getElementById('modalStatusTitle');
      const text = document.getElementById('modalStatusText');
      const purgeSec = document.getElementById('modalPurgeSection');
      const closeBtn = document.getElementById('closeUpToDateBtn');

      if (modal && title && text) {
        if (icon) icon.textContent = '✨';
        title.textContent = 'تم التحديث بنجاح';
        const newVersionText = (typeof APP_CONFIG !== 'undefined' && APP_CONFIG.version) ? `v${APP_CONFIG.version}` : 'الجديد';
        text.innerHTML = `تم تحديث التطبيق بنجاح إلى الإصدار (<strong>${newVersionText}</strong>).<br>نسأل الله أن يوفقكم ويتقبل طاعتكم وصالح أعمالكم 🌙`;
        
        if (purgeSec) purgeSec.style.display = 'none';

        // إغلاق النافذة فقط والبقاء في نفس شاشة المستخدم الحالية (سواء كان في الأذكار أو الرئيسية أو القبلة)
        if (closeBtn) {
          closeBtn.onclick = () => {
            modal.classList.remove('show');
          };
        }

        modal.classList.add('show');
      }
    }, 600);
  }

  // ==================== أزرار النوافذ المنبثقة للتحديث (متاحة دائماً للأندرويد والويب) ====================
  const upToDateModal = document.getElementById('upToDateModal');
  const closeUpToDateBtn = document.getElementById('closeUpToDateBtn');
  const offlineModal = document.getElementById('offlineUpdateModal');
  const closeOfflineBtn = document.getElementById('closeOfflineModalBtn');
  const openWifiSettingsBtn = document.getElementById('openWifiSettingsBtn');
  const checkUpdateBtn = document.getElementById('manualCheckUpdateBtn');
  const forcePurgeBtn = document.getElementById('forceCachePurgeBtn');

  if (closeUpToDateBtn && upToDateModal) {
    closeUpToDateBtn.onclick = () => upToDateModal.classList.remove('show');
  }

  if (closeOfflineBtn && offlineModal) {
    closeOfflineBtn.onclick = () => offlineModal.classList.remove('show');
  }

  if (openWifiSettingsBtn) {
    openWifiSettingsBtn.onclick = () => {
      if (offlineModal) offlineModal.classList.remove('show');
      if (window.AndroidBridge && typeof window.AndroidBridge.openWifiSettings === 'function') {
        window.AndroidBridge.openWifiSettings();
        return;
      }
      try {
        window.location.href = "intent:#Intent;action=android.settings.WIFI_SETTINGS;end";
      } catch (e) {}
    };
  }

  // دالة موحدة ومتطابقة لإظهار نافذة أحدث إصدار
  function showUpToDateDisplay() {
    if (!upToDateModal) return;
    const icon = document.getElementById('modalStatusIcon');
    const title = document.getElementById('modalStatusTitle');
    const text = document.getElementById('modalStatusText');
    const purgeSec = document.getElementById('modalPurgeSection');

    if (icon) icon.textContent = '✓';
    if (title) title.textContent = 'أنت على أحدث إصدار';
    if (text) {
      text.innerHTML = `أنت تستخدم أحدث إصدار بالفعل (<strong>v${APP_CONFIG.version}</strong>)، ولا يوجد أي تحديث جديد حالياً.<br>نسأل الله أن يوفقكم ويتقبل طاعتكم وصالح أعمالكم 🌙`;
    }
    if (purgeSec) purgeSec.style.display = 'block';
    upToDateModal.classList.add('show');
  }

  // تفعيل زر التحديث الإجباري وإصلاح كاش الملفات (يعمل في PWA وتطبيق الأندرويد)
  if (forcePurgeBtn) {
    forcePurgeBtn.onclick = async () => {
      if (!navigator.onLine) {
        if (upToDateModal) upToDateModal.classList.remove('show');
        if (offlineModal) offlineModal.classList.add('show');
        return;
      }

      const originalPurgeText = forcePurgeBtn.textContent;
      forcePurgeBtn.textContent = 'جاري مسح الكاش وتحديث الملفات... ⏳';

      try {
        if ('caches' in window) {
          const cacheKeys = await caches.keys();
          await Promise.all(cacheKeys.map(key => caches.delete(key)));
        }

        if ('serviceWorker' in navigator) {
          const registrations = await navigator.serviceWorker.getRegistrations();
          await Promise.all(registrations.map(reg => reg.unregister()));
        }

        localStorage.setItem('hayat_force_purge_success', 'true');

        const isAndroid = window.location.protocol === 'capacitor:' || 
                          window.location.hostname === 'localhost' || 
                          (window.Capacitor && window.Capacitor.isNativePlatform && window.Capacitor.isNativePlatform());

        if (isAndroid) {
          window.location.reload();
        } else {
          const cleanUrl = window.location.origin + window.location.pathname + '?cache_cleared=' + Date.now();
          window.location.replace(cleanUrl);
        }
      } catch (err) {
        forcePurgeBtn.textContent = originalPurgeText;
        alert('تعذر إتمام عملية إصلاح الملفات، يرجى المحاولة مرة أخرى.');
      }
    };
  }

  // مقارنة أرقام الإصدارات برمجياً
  function isRemoteNewer(remoteVer, currentVer) {
    const r = (remoteVer || '').replace(/[^0-9.]/g, '').split('.').map(Number);
    const c = (currentVer || '').replace(/[^0-9.]/g, '').split('.').map(Number);
    for (let i = 0; i < Math.max(r.length, c.length); i++) {
      const rv = r[i] || 0;
      const cv = c[i] || 0;
      if (rv > cv) return true;
      if (rv < cv) return false;
    }
    return false;
  }

  // محرك فحص التحديث الذكي المشترك
  let activeSwRegistration = null;

  async function executeUpdateCheck() {
    const titleEl = checkUpdateBtn ? checkUpdateBtn.querySelector('.settings-item-title') : null;
    const originalTitle = titleEl ? titleEl.textContent : 'تحديث التطبيق';

    // 1. الفحص الصارم لوجود الإنترنت
    if (!navigator.onLine) {
      if (offlineModal) offlineModal.classList.add('show');
      return;
    }

    if (titleEl) titleEl.textContent = 'جاري البحث عن تحديثات... ⏳';

    const isAndroidApp = window.location.protocol === 'capacitor:' || 
                         window.location.hostname === 'localhost' || 
                         (window.Capacitor && window.Capacitor.isNativePlatform && window.Capacitor.isNativePlatform());

    // 2. إذا كان التطبيق يعمل داخل APK (أندرويد)
    if (isAndroidApp) {
      try {
        // فحص ملف version.json الحقيقي مباشرة من موقعك على جيت هاب مع كسر الكاش
        const response = await fetch(`${APP_CONFIG.remoteVersionUrl}?t=${Date.now()}`, {
          cache: 'no-store'
        });
        if (!response.ok) throw new Error('Network response not ok');
        const data = await response.json();

        if (titleEl) titleEl.textContent = originalTitle;

        if (data && data.version && isRemoteNewer(data.version, APP_CONFIG.version)) {
          // يوجد إصدار أحدث للأندرويد: إظهار إشعار التحديث مع زر تحميل الـ APK
          const toast = document.getElementById('appUpdateToast');
          const updateBtn = document.getElementById('applyUpdateBtn');
          if (toast && updateBtn) {
            const toastText = toast.querySelector('.update-toast-text p');
            if (toastText) toastText.textContent = `يتوفر الآن الإصدار الجديد (v${data.version}) لتطبيق الأندرويد.`;
            toast.classList.add('show');
            updateBtn.textContent = 'تحميل الـ APK الجديد 📥';
            updateBtn.onclick = () => {
              const downloadUrl = data.apkUrl || APP_CONFIG.apkDownloadUrl;
              window.open(downloadUrl, '_blank');
              toast.classList.remove('show');
            };
          }
        } else {
          showUpToDateDisplay();
        }
      } catch (err) {
        if (titleEl) titleEl.textContent = originalTitle;
        // إذا انقطع النت أو تعذر الوصول لجيت هاب: إظهار نافذة انقطاع الإنترنت بدقة
        if (offlineModal) offlineModal.classList.add('show');
      }
      return;
    }

    // 3. إذا كان التطبيق يعمل كـ PWA / ويب عبر المتصفح
    if (activeSwRegistration) {
      try {
        await activeSwRegistration.update();
        setTimeout(() => {
          if (titleEl) titleEl.textContent = originalTitle;
          if (activeSwRegistration.waiting) {
            showUpdateToast(activeSwRegistration.waiting);
          } else {
            showUpToDateDisplay();
          }
        }, 650);
      } catch (err) {
        if (titleEl) titleEl.textContent = originalTitle;
        if (offlineModal) offlineModal.classList.add('show');
      }
    } else {
      if (titleEl) titleEl.textContent = originalTitle;
      showUpToDateDisplay();
    }
  }

  // ربط زر الفحص ليعمل دائماً وفي كل البيئات
  if (checkUpdateBtn) {
    checkUpdateBtn.addEventListener('click', executeUpdateCheck);
  }

  // ==================== تسجيل Service Worker (لبيئة الويب والـ PWA) ====================
  if ('serviceWorker' in navigator) {
    let refreshing = false;
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      if (!refreshing) {
        refreshing = true;
        window.location.reload();
      }
    });

    navigator.serviceWorker.register('./sw.js').then((registration) => {
      activeSwRegistration = registration;

      registration.addEventListener('updatefound', () => {
        const newWorker = registration.installing;
        if (!newWorker) return;
        newWorker.addEventListener('statechange', () => {
          if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
            showUpdateToast(newWorker);
          }
        });
      });
    }).catch((err) => console.log('SW bypass in native environment:', err));
  }

  function showUpdateToast(newWorker) {
    const toast = document.getElementById('appUpdateToast');
    const updateBtn = document.getElementById('applyUpdateBtn');
    const closeBtn = document.getElementById('closeUpdateToastBtn');

    if (toast && updateBtn) {
      toast.classList.add('show');
      updateBtn.onclick = () => {
        updateBtn.textContent = 'جاري التحديث...';
        localStorage.setItem('hayat_just_updated_flag', 'true');
        if (newWorker && newWorker.postMessage) {
          newWorker.postMessage({ type: 'SKIP_WAITING' });
        } else {
          window.location.reload();
        }
      };
      if (closeBtn) closeBtn.onclick = () => toast.classList.remove('show');
    }
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

// ==================== محرك القبلة المتكامل (GPS + أوفلاين + خريطة حقيقية) ====================
  const KAABA_COORDS = { lat: 21.422487, lng: 39.826206 };
  let qiblaBearingAngle = 0;
  let isCompassActive = false;
  let currentQiblaMode = 'gps';
  let qiblaLeafletMap = null;
  let qiblaPolyline = null;
  let qiblaUserMarker = null;
  let qiblaKaabaMarker = null;
  let qiblaTheme = localStorage.getItem('hayat_qibla_theme') || 'theme-white';

  // جلب موقع المستخدم بأمان سواء كان النت يعمل أم لا
  function getQiblaLocationData() {
    return JSON.parse(localStorage.getItem('hayat_saved_location')) || {
      city: 'مكة المكرمة',
      lat: 21.4225,
      lng: 39.8262
    };
  }

  // 1. حساب زاوية القبلة الفلكية الحقيقية الدقيقة
  function calculateTrueQiblaBearing(lat, lng) {
    const lat1 = lat * (Math.PI / 180);
    const lat2 = KAABA_COORDS.lat * (Math.PI / 180);
    const dLng = (KAABA_COORDS.lng - lng) * (Math.PI / 180);

    const y = Math.sin(dLng) * Math.cos(lat2);
    const x = Math.cos(lat1) * Math.sin(lat2) - Math.sin(lat1) * Math.cos(lat2) * Math.cos(dLng);
    const bearing = Math.atan2(y, x) * (180 / Math.PI);
    return Math.round((bearing + 360) % 360);
  }

  // 2. حساب المسافة بالكيلومتر من مكة
  function calculateDistanceInKm(lat, lng) {
    const R = 6371;
    const dLat = (KAABA_COORDS.lat - lat) * (Math.PI / 180);
    const dLng = (KAABA_COORDS.lng - lng) * (Math.PI / 180);
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
              Math.cos(lat * (Math.PI / 180)) * Math.cos(KAABA_COORDS.lat * (Math.PI / 180)) *
              Math.sin(dLng / 2) * Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return (R * c).toFixed(1);
  }

  // 3. بناء وتحديث الخريطة الجغرافية التفاعلية مع المسار المتقطع
  function initOrUpdateQiblaMap(userLat, userLng) {
    const mapContainer = document.getElementById('qiblaRealMap');
    if (!mapContainer || typeof L === 'undefined') return;

    const userLatLng = [userLat, userLng];
    const kaabaLatLng = [KAABA_COORDS.lat, KAABA_COORDS.lng];

    if (!qiblaLeafletMap) {
      qiblaLeafletMap = L.map('qiblaRealMap', {
        zoomControl: false,
        attributionControl: false
      });

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 18
      }).addTo(qiblaLeafletMap);
    }

    setTimeout(() => {
      if (qiblaLeafletMap) qiblaLeafletMap.invalidateSize();
    }, 250);

    if (qiblaPolyline) qiblaLeafletMap.removeLayer(qiblaPolyline);
    if (qiblaUserMarker) qiblaLeafletMap.removeLayer(qiblaUserMarker);
    if (qiblaKaabaMarker) qiblaLeafletMap.removeLayer(qiblaKaabaMarker);

    qiblaUserMarker = L.circleMarker(userLatLng, {
      radius: 7,
      fillColor: '#16A34A',
      color: '#FFFFFF',
      weight: 2,
      fillOpacity: 1
    }).addTo(qiblaLeafletMap);

    const kaabaIconHtml = L.divIcon({
      html: '<div style="font-size:22px; margin-top:-14px; margin-left:-11px;">🕋</div>',
      className: 'kaaba-leaflet-icon'
    });
    qiblaKaabaMarker = L.marker(kaabaLatLng, { icon: kaabaIconHtml }).addTo(qiblaLeafletMap);

    qiblaPolyline = L.polyline([userLatLng, kaabaLatLng], {
      color: '#16A34A',
      weight: 3.5,
      dashArray: '6, 8',
      opacity: 0.95
    }).addTo(qiblaLeafletMap);

    qiblaLeafletMap.fitBounds([userLatLng, kaabaLatLng], { padding: [30, 30] });
  }

  // 4. الدالة الرئيسية لتشغيل شاشة القبلة
  function initQiblaCompass() {
    const loc = getQiblaLocationData();
    const lat = loc.lat || 21.4225;
    const lng = loc.lng || 39.8262;

    qiblaBearingAngle = calculateTrueQiblaBearing(lat, lng);
    const distanceKm = calculateDistanceInKm(lat, lng);

    const qiblaAngleDisplay = document.getElementById('qiblaAngleDisplay');
    const qiblaDistanceDisplay = document.getElementById('qiblaDistanceDisplay');
    const qiblaLocationName = document.getElementById('qiblaLocationName');
    const kaabaOrbitNode = document.getElementById('kaabaOrbitNode');
    const compassDial = document.getElementById('compassDial');
    const changeCityBtn = document.getElementById('changeCityBtn');

    if (qiblaAngleDisplay) qiblaAngleDisplay.textContent = `${qiblaBearingAngle}°`;
    if (qiblaDistanceDisplay) qiblaDistanceDisplay.textContent = `${distanceKm} كم`;
    if (qiblaLocationName) qiblaLocationName.textContent = loc.city || 'مكة المكرمة';

    if (kaabaOrbitNode) {
      kaabaOrbitNode.style.transform = `rotate(${qiblaBearingAngle}deg)`;
    }

    if (compassDial) {
      compassDial.className = `compass-dial-advanced ${qiblaTheme}`;
    }

    if (changeCityBtn) {
      changeCityBtn.style.display = (currentQiblaMode === 'offline') ? 'inline' : 'none';
      changeCityBtn.onclick = () => {
        if (typeof openManualLocationModal === 'function') openManualLocationModal();
      };
    }

    initOrUpdateQiblaMap(lat, lng);
  }
  window.initQiblaCompass = initQiblaCompass;

  // 5. استقبال وتفسير قراءات البوصلة
  function handleDeviceOrientation(e) {
    let heading = 0;

    if (e.webkitCompassHeading !== undefined && e.webkitCompassHeading !== null) {
      heading = e.webkitCompassHeading;
    } else if (e.alpha !== null) {
      heading = 360 - e.alpha;
    }

    heading = Math.round(heading);
    applyCompassHeading(heading);

    const spiritBubbleDot = document.getElementById('spiritBubbleDot');
    const spiritLevel = document.getElementById('spiritLevel');
    if (e.beta !== null && e.gamma !== null && spiritBubbleDot) {
      const b = Math.max(-14, Math.min(14, e.beta));
      const g = Math.max(-14, Math.min(14, e.gamma));
      spiritBubbleDot.style.transform = `translate(${g * 0.7}px, ${b * 0.7}px)`;

      if (Math.abs(e.beta) < 10 && Math.abs(e.gamma) < 10) {
        if (spiritLevel) spiritLevel.classList.add('level-flat');
      } else {
        if (spiritLevel) spiritLevel.classList.remove('level-flat');
      }
    }
  }

  function applyCompassHeading(heading) {
    const compassDial = document.getElementById('compassDial');
    const kaabaTopBeacon = document.getElementById('kaabaTopBeacon');
    const angleDisplay = document.getElementById('qiblaAngleDisplay');

    if (compassDial) {
      compassDial.style.transform = `rotate(${-heading}deg)`;
    }

    const diff = Math.abs((heading - qiblaBearingAngle + 360) % 360);
    const isAligned = (diff <= 5 || diff >= 355);

    if (angleDisplay) {
      angleDisplay.textContent = `${diff}°`;
    }

    if (isAligned) {
      if (compassDial) compassDial.classList.add('aligned');
      if (kaabaTopBeacon) kaabaTopBeacon.classList.add('aligned');
      if (navigator.vibrate) navigator.vibrate(50);
    } else {
      if (compassDial) compassDial.classList.remove('aligned');
      if (kaabaTopBeacon) kaabaTopBeacon.classList.remove('aligned');
    }
  }

  // 6. زر تفعيل الحساسات البارز
  const startCompassSensorsBtn = document.getElementById('startCompassSensorsBtn');
  const qiblaStartBox = document.getElementById('qiblaStartBox');

  if (startCompassSensorsBtn) {
    startCompassSensorsBtn.addEventListener('click', async () => {
      if (typeof DeviceOrientationEvent !== 'undefined' && typeof DeviceOrientationEvent.requestPermission === 'function') {
        try {
          const res = await DeviceOrientationEvent.requestPermission();
          if (res === 'granted') {
            bindCompassListeners();
            if (qiblaStartBox) qiblaStartBox.style.display = 'none';
          } else {
            alert('تم رفض إذن المستشعر، يرجى السماح بالوصول للبوصلة.');
          }
        } catch (err) {
          bindCompassListeners();
          if (qiblaStartBox) qiblaStartBox.style.display = 'none';
        }
      } else {
        bindCompassListeners();
        if (qiblaStartBox) qiblaStartBox.style.display = 'none';
      }
    });
  }

  function bindCompassListeners() {
    if (isCompassActive) return;
    if ('ondeviceorientationabsolute' in window) {
      window.addEventListener('deviceorientationabsolute', handleDeviceOrientation, true);
    } else if ('ondeviceorientation' in window) {
      window.addEventListener('deviceorientation', handleDeviceOrientation, true);
    }
    isCompassActive = true;
  }

  function stopQiblaCompass() {
    window.removeEventListener('deviceorientationabsolute', handleDeviceOrientation, true);
    window.removeEventListener('deviceorientation', handleDeviceOrientation, true);
    isCompassActive = false;
  }
  window.stopQiblaCompass = stopQiblaCompass;

  // تجربة تدوير البوصلة بالماوس للمطور عند الفحص بالكمبيوتر
  const dialElement = document.getElementById('compassDial');
  if (dialElement) {
    let isMouseDown = false;
    let mouseStartX = 0;
    dialElement.addEventListener('mousedown', (e) => { isMouseDown = true; mouseStartX = e.clientX; });
    window.addEventListener('mousemove', (e) => {
      if (!isMouseDown) return;
      const deg = (e.clientX - mouseStartX) % 360;
      applyCompassHeading(deg);
    });
    window.addEventListener('mouseup', () => { isMouseDown = false; });
  }

  // 7. أزرار اختيار النمط (GPS / بدون إنترنت)
  const modeGpsBtn = document.getElementById('modeGpsBtn');
  const modeOfflineBtn = document.getElementById('modeOfflineBtn');

  if (modeGpsBtn && modeOfflineBtn) {
    modeGpsBtn.addEventListener('click', () => {
      currentQiblaMode = 'gps';
      modeGpsBtn.classList.add('active');
      modeOfflineBtn.classList.remove('active');

      if (navigator.geolocation) {
        modeGpsBtn.innerHTML = '<span>🛰️ جاري التحديد...</span>';
        navigator.geolocation.getCurrentPosition(
          (pos) => {
            const currentSaved = getQiblaLocationData();
            currentSaved.lat = pos.coords.latitude;
            currentSaved.lng = pos.coords.longitude;
            currentSaved.city = 'موقعي الدقيق (GPS)';
            localStorage.setItem('hayat_saved_location', JSON.stringify(currentSaved));
            modeGpsBtn.innerHTML = '<span>🛰️ عبر الموقع الجغرافي (GPS)</span>';
            initQiblaCompass();
          },
          (err) => {
            alert('تعذر الوصول لموقع GPS، تم التثبيت على وضع بدون إنترنت.');
            modeGpsBtn.innerHTML = '<span>🛰️ عبر الموقع الجغرافي (GPS)</span>';
            modeOfflineBtn.click();
          }
        );
      }
    });

    modeOfflineBtn.addEventListener('click', () => {
      currentQiblaMode = 'offline';
      modeOfflineBtn.classList.add('active');
      modeGpsBtn.classList.remove('active');
      initQiblaCompass();
    });
  }

  // 8. نافذة اختيار المظهر والأنماط الثلاثة
  const openQiblaThemeModalBtn = document.getElementById('openQiblaThemeModalBtn');
  const qiblaThemeModal = document.getElementById('qiblaThemeModal');
  const closeQiblaThemeBtn = document.getElementById('closeQiblaThemeBtn');

  if (openQiblaThemeModalBtn && qiblaThemeModal) {
    openQiblaThemeModalBtn.addEventListener('click', () => {
      qiblaThemeModal.classList.add('show');
    });
  }

  if (closeQiblaThemeBtn && qiblaThemeModal) {
    closeQiblaThemeBtn.addEventListener('click', () => {
      qiblaThemeModal.classList.remove('show');
    });
  }

  document.querySelectorAll('.theme-card').forEach(card => {
    card.addEventListener('click', () => {
      document.querySelectorAll('.theme-card').forEach(c => {
        c.classList.remove('active');
        const btn = c.querySelector('.theme-apply-btn');
        if (btn) btn.textContent = 'استخدم';
      });

      card.classList.add('active');
      const activeBtn = card.querySelector('.theme-apply-btn');
      if (activeBtn) activeBtn.textContent = 'مستخدم';

      qiblaTheme = card.getAttribute('data-theme');
      localStorage.setItem('hayat_qibla_theme', qiblaTheme);

      const compass = document.getElementById('compassDial');
      if (compass) {
        compass.className = `compass-dial-advanced ${qiblaTheme}`;
      }

      setTimeout(() => {
        if (qiblaThemeModal) qiblaThemeModal.classList.remove('show');
      }, 200);
    });
  });

// ==================== محرك المسبحة والتسبيح الإلكتروني المطور ====================
let tasbeehTarget = 33;
let tasbeehMode = localStorage.getItem('hayat_tasbeeh_mode') || 'beads';
let tasbeehTheme = localStorage.getItem('hayat_tasbeeh_theme') || 'theme-green';
let tasbeehSound = localStorage.getItem('hayat_tasbeeh_sound') === 'true';
let tasbeehVibrate = localStorage.getItem('hayat_tasbeeh_vibrate') !== 'false';
let tasbeehWakeLock = null;

let tasbeehActiveDhikrId = localStorage.getItem('hayat_active_tasbeeh_id') || null;

let tasbeehStats = JSON.parse(localStorage.getItem('hayat_tasbeeh_stats')) || {
  countsMap: {},
  roundsMap: {},
  total: 0
};

function saveTasbeehStats() {
  localStorage.setItem('hayat_tasbeeh_stats', JSON.stringify(tasbeehStats));
  localStorage.setItem('hayat_tasbeeh_mode', tasbeehMode);
  localStorage.setItem('hayat_tasbeeh_theme', tasbeehTheme);
  localStorage.setItem('hayat_tasbeeh_sound', tasbeehSound);
  localStorage.setItem('hayat_tasbeeh_vibrate', tasbeehVibrate);
  if (tasbeehActiveDhikrId) localStorage.setItem('hayat_active_tasbeeh_id', tasbeehActiveDhikrId);
}

// دالة تجريد النصوص من التشكيل والحركات للبحث السلس
function normalizeArabicText(text) {
  if (!text) return '';
  return text
    .replace(/[\u064B-\u065F\u0670\u0640]/g, '')
    .replace(/[أإآٱ]/g, 'ا')
    .replace(/ة/g, 'ه')
    .replace(/ى/g, 'ي')
    .trim()
    .toLowerCase();
}

function getTasbeehCategory() {
  let allGroups = [];
  try {
    allGroups = JSON.parse(localStorage.getItem('hayat_azkar_data')) || [];
  } catch (e) {}

  if (!allGroups.length && typeof DEFAULT_AZKAR_DATA !== 'undefined') {
    allGroups = DEFAULT_AZKAR_DATA;
  }

  return allGroups.find(c => c.name && c.name.includes('تسابيح وأجور عظيمة'));
}

function getTasbeehCategoryItems() {
  const category = getTasbeehCategory();
  if (category && category.items && category.items.length > 0) {
    return category.items;
  }

  return [
    { id: 't_def_1', text: 'سُبْحَانَ اللَّهِ', count: 33 },
    { id: 't_def_2', text: 'الْحَمْدُ لِلَّهِ', count: 33 },
    { id: 't_def_3', text: 'لَا إِلَهَ إِلَّا اللَّهُ', count: 33 },
    { id: 't_def_4', text: 'اللَّهُ أَكْبَرُ', count: 33 }
  ];
}

function getActiveTasbeehItem() {
  const items = getTasbeehCategoryItems();
  if (!items.length) return { id: 't_def', text: 'سُبْحَانَ اللَّهِ', count: 33 };
  const found = items.find(it => it.id === tasbeehActiveDhikrId);
  if (found) return found;
  tasbeehActiveDhikrId = items[0].id;
  return items[0];
}

function playWoodClickSound() {
  if (!tasbeehSound) return;
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(580, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(100, ctx.currentTime + 0.035);
    gain.gain.setValueAtTime(0.45, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.035);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.04);
  } catch (e) {}
}

// إطلاق تأثير +1 بارتفاع 5 سم (165 بكسل) فوق موضع لمس الإبهام
function showFloatingPlusOne(x, y) {
  const container = document.getElementById('floatingPlusContainer');
  if (!container) return;

  const plusEl = document.createElement('div');
  plusEl.className = 'floating-plus-badge';
  plusEl.textContent = '+1';

  const rect = container.getBoundingClientRect();
  const posX = x ? (x - rect.left) : (rect.width / 2);
  
  // رفع موضع الظهور بمسافة مريحة (~5 سم) فوق موضع اللمس مباشرة
  const offsetAboveFinger = 165;
  const posY = y ? Math.max(35, (y - rect.top) - offsetAboveFinger) : (rect.height * 0.28);

  plusEl.style.left = `${posX}px`;
  plusEl.style.top = `${posY}px`;

  container.appendChild(plusEl);

  plusEl.addEventListener('animationend', () => {
    plusEl.remove();
  });
}

function getWirePoint(fraction) {
  const path = document.getElementById('tasbeehWirePath');
  if (!path) return { x: 180, y: 80 };
  const total = path.getTotalLength();
  const target = Math.max(0, Math.min(total, fraction * total));
  return path.getPointAtLength(target);
}

const BEAD_SLOT_FRACTIONS = [0.04, 0.15, 0.26, 0.37, 0.55, 0.66, 0.77, 0.88, 0.99];
let isBeadAnimating = false;

// زيادة العداد
function incrementTasbeeh(event) {
  const activeItem = getActiveTasbeehItem();
  const id = activeItem.id;

  if (!tasbeehStats.countsMap[id]) tasbeehStats.countsMap[id] = 0;
  if (!tasbeehStats.roundsMap[id]) tasbeehStats.roundsMap[id] = 0;

  tasbeehStats.countsMap[id]++;
  tasbeehStats.total++;

  if (tasbeehVibrate && navigator.vibrate) {
    navigator.vibrate(28);
  }
  playWoodClickSound();

  // إطلاق +1 فوق موضع النقر بـ 5 سم
  if (event && event.clientX) {
    showFloatingPlusOne(event.clientX, event.clientY);
  } else {
    showFloatingPlusOne();
  }

  // إكمال الجولة عند بلوغ الهدف
  if (tasbeehTarget > 0 && tasbeehStats.countsMap[id] >= tasbeehTarget) {
    tasbeehStats.countsMap[id] = 0;
    tasbeehStats.roundsMap[id]++;
    if (navigator.vibrate) navigator.vibrate([70, 40, 90]);
  }

  // حركة الخرز
  animateBeadChainStep();

  saveTasbeehStats();
  updateTasbeehUI();
  updateFloatingPiPContent();
}

function animateBeadChainStep() {
  if (tasbeehMode !== 'beads' || isBeadAnimating) return;
  isBeadAnimating = true;

  const cluster = document.getElementById('beadsCluster');
  if (!cluster) { isBeadAnimating = false; return; }

  const beadEls = cluster.querySelectorAll('.t-curved-bead');
  if (beadEls.length < 7) { renderCurvedBeads(); isBeadAnimating = false; return; }

  const nextTargetSlots = [2, 3, 4, 5, 6, 7, 8];

  beadEls.forEach((el, i) => {
    const slotIdx = nextTargetSlots[i];
    const pt = getWirePoint(BEAD_SLOT_FRACTIONS[slotIdx]);
    el.style.left = `${pt.x}px`;
    el.style.top = `${pt.y}px`;
    if (i === 6) el.style.opacity = '0';
  });

  const newBeadPos = getWirePoint(BEAD_SLOT_FRACTIONS[0]);
  const newBead = document.createElement('div');
  newBead.className = 't-curved-bead';
  newBead.style.left = `${newBeadPos.x}px`;
  newBead.style.top = `${newBeadPos.y}px`;
  newBead.style.opacity = '0';
  cluster.insertBefore(newBead, cluster.firstChild);

  setTimeout(() => {
    const enterPos = getWirePoint(BEAD_SLOT_FRACTIONS[1]);
    newBead.style.left = `${enterPos.x}px`;
    newBead.style.top = `${enterPos.y}px`;
    newBead.style.opacity = '1';
  }, 20);

  setTimeout(() => {
    renderCurvedBeads();
    isBeadAnimating = false;
  }, 225);
}

function updateTasbeehUI() {
  const activeItem = getActiveTasbeehItem();
  const id = activeItem.id;
  const items = getTasbeehCategoryItems();
  const currentIndex = items.findIndex(it => it.id === id);

  const curCount = tasbeehStats.countsMap[id] || 0;
  const rounds = tasbeehStats.roundsMap[id] || 0;
  const targetStr = tasbeehTarget > 0 ? `/ ${tasbeehTarget}` : '/ ∞';

  const mainText = document.getElementById('tasbeehMainText');
  const indexDisp = document.getElementById('tasbeehDhikrIndexDisplay');
  const curDisp = document.getElementById('tasbeehCurrentDisplay');
  const targetDisp = document.getElementById('tasbeehTargetDisplay');
  const roundsDisp = document.getElementById('tasbeehRoundsDisplay');
  const totalDisp = document.getElementById('tasbeehTotalDisplay');
  const digiCount = document.getElementById('digitalCountDisplay');
  const digiTarget = document.getElementById('digitalTargetDisplay');

  if (mainText) mainText.textContent = activeItem.text;
  if (indexDisp) indexDisp.textContent = `${currentIndex !== -1 ? currentIndex + 1 : 1}/${items.length}`;
  if (curDisp) curDisp.textContent = curCount;
  if (targetDisp) targetDisp.textContent = targetStr;
  if (roundsDisp) roundsDisp.textContent = rounds;
  if (totalDisp) totalDisp.textContent = tasbeehStats.total;
  if (digiCount) digiCount.textContent = curCount;
  if (digiTarget) digiTarget.textContent = `الهدف: ${tasbeehTarget > 0 ? tasbeehTarget : 'مفتوح'}`;
}

function renderCurvedBeads() {
  const cluster = document.getElementById('beadsCluster');
  if (!cluster) return;
  cluster.innerHTML = '';

  const defaultSlots = [1, 2, 3, 4, 5, 6, 7];

  defaultSlots.forEach((slotIdx) => {
    const pt = getWirePoint(BEAD_SLOT_FRACTIONS[slotIdx]);
    const bead = document.createElement('div');
    bead.className = 't-curved-bead';
    bead.style.left = `${pt.x}px`;
    bead.style.top = `${pt.y}px`;
    bead.style.opacity = '1';
    cluster.appendChild(bead);
  });
}

function applyTasbeehThemeAndMode() {
  const beadsStage = document.getElementById('tasbeehBeadsStage');
  const buttonStage = document.getElementById('tasbeehButtonStage');

  if (beadsStage && buttonStage) {
    if (tasbeehMode === 'beads') {
      beadsStage.style.display = 'flex';
      buttonStage.style.display = 'none';
      beadsStage.className = `tasbeeh-curved-track-stage ${tasbeehTheme}`;
    } else {
      beadsStage.style.display = 'none';
      buttonStage.style.display = 'flex';
      buttonStage.className = `tasbeeh-digital-button-stage ${tasbeehTheme}`;
    }
  }
}

// ملء قائمة الأذكار مع النزول التلقائي للعدد
function renderTasbeehPickerList(query = '') {
  const container = document.getElementById('tasbeehPickerListContainer');
  if (!container) return;
  container.innerHTML = '';

  const items = getTasbeehCategoryItems();
  const cleanQ = normalizeArabicText(query);

  const filtered = items.filter(it => {
    if (!cleanQ) return true;
    const itemCleanText = normalizeArabicText(it.text);
    return itemCleanText.includes(cleanQ);
  });

  if (filtered.length === 0) {
    container.innerHTML = `<div style="text-align:center; padding:24px; color:var(--text-muted); font-size:14px;">لا توجد تسبيحة مطابقة</div>`;
    return;
  }

  filtered.forEach(it => {
    const isSelected = it.id === tasbeehActiveDhikrId;
    const countBadge = it.count ? ` (${it.count} مرة)` : '';
    const row = document.createElement('div');
    row.className = `tasbeeh-picker-item ${isSelected ? 'active' : ''}`;
    row.innerHTML = `
      <span class="picker-item-text">${it.text}<small style="font-size:12px; color:var(--text-muted);">${countBadge}</small></span>
      ${isSelected ? '<span class="picker-item-check">✓</span>' : ''}
    `;
    row.onclick = () => {
      tasbeehActiveDhikrId = it.id;
      if (it.count && it.count > 0) {
        tasbeehTarget = it.count;
      }
      saveTasbeehStats();
      updateTasbeehUI();
      const modal = document.getElementById('tasbeehDhikrPickerModal');
      if (modal) modal.classList.remove('show');
    };
    container.appendChild(row);
  });
}

function initTasbeehEngine() {
  const active = getActiveTasbeehItem();
  if (active && active.count) {
    tasbeehTarget = active.count;
  }
  renderCurvedBeads();
  applyTasbeehThemeAndMode();
  updateTasbeehUI();
}

// تحديث النافذة العائمة
let pipCanvas = null;
let pipCtx = null;
let activeDesktopPipWindow = null;

function updateFloatingPiPContent() {
  const activeItem = getActiveTasbeehItem();
  const id = activeItem.id;
  const cur = tasbeehStats.countsMap[id] || 0;

  if (activeDesktopPipWindow && !activeDesktopPipWindow.closed) {
    const countEl = activeDesktopPipWindow.document.getElementById('pipTapBtn');
    if (countEl) countEl.textContent = cur;
    return;
  }

  if (!pipCtx) return;
  pipCtx.fillStyle = '#064E3B';
  pipCtx.beginPath();
  pipCtx.roundRect(0, 0, 360, 360, 36);
  pipCtx.fill();

  pipCtx.fillStyle = '#A7F3D0';
  pipCtx.font = 'bold 20px "Cairo", sans-serif';
  pipCtx.textAlign = 'center';
  pipCtx.fillText('الحياة الطيبة • المسبحة', 180, 48);

  pipCtx.fillStyle = '#FFFFFF';
  pipCtx.font = 'bold 24px "Amiri", serif';
  pipCtx.fillText(activeItem.text.slice(0, 24), 180, 105);

  pipCtx.fillStyle = '#FBBF24';
  pipCtx.font = 'bold 88px "Cairo", sans-serif';
  pipCtx.fillText(cur, 180, 215);

  pipCtx.fillStyle = '#D1FAE5';
  pipCtx.font = 'bold 20px "Cairo", sans-serif';
  pipCtx.fillText(`الهدف: ${tasbeehTarget > 0 ? tasbeehTarget : '∞'} | الجولات: ${tasbeehStats.roundsMap[id] || 0}`, 180, 275);

  pipCtx.fillStyle = '#6EE7B7';
  pipCtx.font = '16px "Cairo", sans-serif';
  pipCtx.fillText('اضغط زر ▶️ أو ⏭️ في النافذة للعدّ', 180, 325);
}

// أحداث اللمس والنقر والتفاعل
document.addEventListener('DOMContentLoaded', () => {
  const interactiveZone = document.getElementById('tasbeehInteractiveZone');

  if (interactiveZone) {
    let touchStartX = 0;
    let touchStartY = 0;
    let isSwiping = false;
    let lastSwipeTime = 0;

    interactiveZone.addEventListener('touchstart', (e) => {
      touchStartX = e.touches[0].clientX;
      touchStartY = e.touches[0].clientY;
      isSwiping = false;
    }, { passive: true });

    interactiveZone.addEventListener('touchmove', (e) => {
      const deltaX = e.touches[0].clientX - touchStartX;
      const deltaY = e.touches[0].clientY - touchStartY;
      if (deltaX > 20 && Math.abs(deltaX) > Math.abs(deltaY)) {
        isSwiping = true;
      }
    }, { passive: true });

    interactiveZone.addEventListener('touchend', (e) => {
      if (isSwiping) {
        lastSwipeTime = Date.now();
        incrementTasbeeh(e.changedTouches ? e.changedTouches[0] : null);
      }
    });

    interactiveZone.addEventListener('click', (e) => {
      if (Date.now() - lastSwipeTime < 450) return;
      incrementTasbeeh(e);
    });
  }

  // فتح نافذة اختيار التسبيحة
  const openDhikrArea = document.getElementById('openDhikrPickerArea');
  const dhikrPickerModal = document.getElementById('tasbeehDhikrPickerModal');
  const closeDhikrPicker = document.getElementById('closeDhikrPickerBtn');
  const searchInput = document.getElementById('tasbeehSearchInput');
  const openAddDhikrBtn = document.getElementById('openAddTasbeehDhikrBtn');

  if (openDhikrArea && dhikrPickerModal) {
    openDhikrArea.onclick = () => {
      if (searchInput) searchInput.value = '';
      renderTasbeehPickerList('');
      dhikrPickerModal.classList.add('show');
    };
    if (closeDhikrPicker) closeDhikrPicker.onclick = () => dhikrPickerModal.classList.remove('show');
    if (searchInput) {
      searchInput.oninput = (e) => renderTasbeehPickerList(e.target.value);
    }
  }

  // فتح نافذة إضافة ذكر الأصلية الفاخرة
  if (openAddDhikrBtn) {
    openAddDhikrBtn.onclick = () => {
      const modal = document.getElementById('dhikrEditModal');
      const title = document.getElementById('dhikrModalTitle');
      const pre = document.getElementById('inputPreText');
      const txt = document.getElementById('inputText');
      const note = document.getElementById('inputNote');
      const cnt = document.getElementById('inputCount');

      if (modal) {
        if (title) title.textContent = 'إضافة تسبيحة جديدة';
        if (pre) pre.value = '';
        if (txt) { txt.value = ''; setTimeout(() => txt.focus(), 150); }
        if (note) note.value = '';
        if (cnt) cnt.value = '33';

        modal.style.display = '';
        modal.classList.add('show');
        window.isAddingFromTasbeehScreen = true;
      }
    };
  }

  // معالجة زر الحفظ وإغلاق النوافذ فوراً وتحديث كرت المسبحة
  const saveBtn = document.getElementById('saveDhikrBtn');
  if (saveBtn) {
    saveBtn.addEventListener('click', (e) => {
      if (!window.isAddingFromTasbeehScreen) return;

      e.stopImmediatePropagation();
      e.preventDefault();

      const txtInput = document.getElementById('inputText');
      const cntInput = document.getElementById('inputCount');
      const preInput = document.getElementById('inputPreText');
      const noteInput = document.getElementById('inputNote');

      const text = txtInput ? txtInput.value.trim() : '';
      const count = cntInput ? (parseInt(cntInput.value) || 33) : 33;
      const pre = preInput ? preInput.value.trim() : '';
      const note = noteInput ? noteInput.value.trim() : '';

      if (!text) {
        alert('يرجى كتابة نص الذكر أو التسبيحة أولاً!');
        return;
      }

      // 1. الحفظ في LocalStorage
      let allGroups = [];
      try {
        allGroups = JSON.parse(localStorage.getItem('hayat_azkar_data')) || [];
      } catch (err) {}
      if (!allGroups.length && typeof DEFAULT_AZKAR_DATA !== 'undefined') {
        allGroups = JSON.parse(JSON.stringify(DEFAULT_AZKAR_DATA));
      }

      let targetCat = allGroups.find(c => c.name && c.name.includes('تسابيح وأجور عظيمة'));
      if (!targetCat) {
        targetCat = { id: 'user_cat_tasbeeh', name: 'تسابيح وأجور عظيمة', isCustom: true, items: [] };
        allGroups.push(targetCat);
      }
      if (!targetCat.items) targetCat.items = [];

      const newItem = {
        id: 'user_item_' + Date.now(),
        pre: pre,
        text: text,
        fullNote: note || 'تسبيحة مضافة من شاشة المسبحة',
        count: count,
        currentCount: count,
        alert: ''
      };

      targetCat.items.push(newItem);
      localStorage.setItem('hayat_azkar_data', JSON.stringify(allGroups));

      if (typeof azkarState !== 'undefined' && Array.isArray(azkarState)) {
        const liveCat = azkarState.find(c => c.name && c.name.includes('تسابيح وأجور عظيمة'));
        if (liveCat && liveCat.items) liveCat.items.push(newItem);
      }

      // 2. تحديث وتنزيل الذكر الجديد فوراً في كرت المسبحة وضبط الهدف
      tasbeehActiveDhikrId = newItem.id;
      tasbeehTarget = count;
      if (!tasbeehStats.countsMap) tasbeehStats.countsMap = {};
      if (!tasbeehStats.roundsMap) tasbeehStats.roundsMap = {};
      tasbeehStats.countsMap[newItem.id] = 0;
      tasbeehStats.roundsMap[newItem.id] = 0;

      // تحديث مباشر لعناصر الواجهة بالاسم الجديد
      const mainTextEl = document.getElementById('tasbeehMainText');
      if (mainTextEl) mainTextEl.textContent = text;

      const curDispEl = document.getElementById('tasbeehCurrentDisplay');
      if (curDispEl) curDispEl.textContent = '0';

      const targetDispEl = document.getElementById('tasbeehTargetDisplay');
      if (targetDispEl) targetDispEl.textContent = `/ ${count}`;

      const digiCountEl = document.getElementById('digitalCountDisplay');
      if (digiCountEl) digiCountEl.textContent = '0';

      const digiTargetEl = document.getElementById('digitalTargetDisplay');
      if (digiTargetEl) digiTargetEl.textContent = `الهدف: ${count}`;

      saveTasbeehStats();
      updateTasbeehUI();

      // 3. إغلاق النوافذ المنبثقة بشكل قاطع وفوري
      const editModal = document.getElementById('dhikrEditModal');
      const pickerModal = document.getElementById('tasbeehDhikrPickerModal');
      
      if (editModal) {
        editModal.classList.remove('show');
        editModal.style.display = 'none';
        setTimeout(() => { editModal.style.display = ''; }, 300);
      }
      if (pickerModal) {
        pickerModal.classList.remove('show');
      }

      window.isAddingFromTasbeehScreen = false;
    }, true);
  }

  // إعادة ضبط الحالة عند الإلغاء
  const cancelDhikrBtn = document.getElementById('cancelDhikrBtn');
  if (cancelDhikrBtn) {
    cancelDhikrBtn.addEventListener('click', () => {
      window.isAddingFromTasbeehScreen = false;
      const title = document.getElementById('dhikrModalTitle');
      if (title) title.textContent = 'إضافة ذكر جديد';
      const editModal = document.getElementById('dhikrEditModal');
      if (editModal) {
        editModal.classList.remove('show');
        editModal.style.display = 'none';
        setTimeout(() => { editModal.style.display = ''; }, 300);
      }
    });
  }
  // نافذة تحديد الهدف
  const openTargetBtn = document.getElementById('openTargetModalBtn');
  const targetModal = document.getElementById('tasbeehTargetModal');
  const closeTargetBtn = document.getElementById('closeTargetModalBtn');
  const customTargetInput = document.getElementById('customTargetInput');
  const applyCustomBtn = document.getElementById('applyCustomTargetBtn');

  if (openTargetBtn && targetModal) {
    openTargetBtn.onclick = () => targetModal.classList.add('show');
    if (closeTargetBtn) closeTargetBtn.onclick = () => targetModal.classList.remove('show');

    document.querySelectorAll('.t-target-btn').forEach(btn => {
      btn.onclick = () => {
        document.querySelectorAll('.t-target-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        tasbeehTarget = parseInt(btn.getAttribute('data-val'));
        updateTasbeehUI();
        targetModal.classList.remove('show');
      };
    });

    if (applyCustomBtn && customTargetInput) {
      applyCustomBtn.onclick = () => {
        const val = parseInt(customTargetInput.value);
        if (val && val > 0) {
          tasbeehTarget = val;
          document.querySelectorAll('.t-target-btn').forEach(b => b.classList.remove('active'));
          updateTasbeehUI();
          targetModal.classList.remove('show');
        }
      };
    }
  }

  // نافذة التصفير
  const resetBtn = document.getElementById('tasbeehResetBtn');
  const resetModal = document.getElementById('tasbeehResetModal');
  if (resetBtn && resetModal) {
    resetBtn.onclick = () => resetModal.classList.add('show');
    document.getElementById('cancelResetModalBtn').onclick = () => resetModal.classList.remove('show');
    document.getElementById('resetCurrentDhikrBtn').onclick = () => {
      const id = getActiveTasbeehItem().id;
      tasbeehStats.countsMap[id] = 0;
      tasbeehStats.roundsMap[id] = 0;
      saveTasbeehStats();
      updateTasbeehUI();
      resetModal.classList.remove('show');
    };
    document.getElementById('resetAllAzkarBtn').onclick = () => {
      tasbeehStats = { countsMap: {}, roundsMap: {}, total: 0 };
      saveTasbeehStats();
      updateTasbeehUI();
      resetModal.classList.remove('show');
    };
  }

  // نافذة اختيار المظهر
  const openThemeBtn = document.getElementById('openTasbeehThemeModalBtn');
  const themeModal = document.getElementById('tasbeehThemeModal');
  const closeThemeBtn = document.getElementById('closeTasbeehThemeBtn');
  const tabModeBeads = document.getElementById('tabModeBeads');
  const tabModeButton = document.getElementById('tabModeButton');
  const containerBeads = document.getElementById('themeContainerBeads');
  const containerButton = document.getElementById('themeContainerButton');

  if (openThemeBtn && themeModal) {
    openThemeBtn.onclick = () => themeModal.classList.add('show');
    if (closeThemeBtn) closeThemeBtn.onclick = () => themeModal.classList.remove('show');

    tabModeBeads.onclick = () => {
      tabModeBeads.classList.add('active');
      tabModeButton.classList.remove('active');
      containerBeads.style.display = 'grid';
      containerButton.style.display = 'none';
      tasbeehMode = 'beads';
      tasbeehTheme = 'theme-green';
      saveTasbeehStats();
      applyTasbeehThemeAndMode();
    };

    tabModeButton.onclick = () => {
      tabModeButton.classList.add('active');
      tabModeBeads.classList.remove('active');
      containerButton.style.display = 'grid';
      containerBeads.style.display = 'none';
      tasbeehMode = 'button';
      tasbeehTheme = 'btn-green';
      saveTasbeehStats();
      applyTasbeehThemeAndMode();
    };

    document.querySelectorAll('.t-theme-card').forEach(card => {
      card.onclick = () => {
        const type = card.getAttribute('data-type');
        const theme = card.getAttribute('data-theme');
        tasbeehMode = type;
        tasbeehTheme = theme;

        document.querySelectorAll(`.t-theme-card[data-type="${type}"]`).forEach(c => {
          c.classList.remove('active');
          c.querySelector('.theme-apply-btn').textContent = 'استخدم';
        });

        card.classList.add('active');
        card.querySelector('.theme-apply-btn').textContent = 'مستخدم';
        saveTasbeehStats();
        applyTasbeehThemeAndMode();
        setTimeout(() => themeModal.classList.remove('show'), 200);
      };
    });
  }

  // القائمة العلوية
  const menuBtn = document.getElementById('tasbeehMenuBtn');
  const dropMenu = document.getElementById('tasbeehDropdownMenu');
  if (menuBtn && dropMenu) {
    menuBtn.onclick = (e) => {
      e.stopPropagation();
      dropMenu.classList.toggle('show');
    };
    document.addEventListener('click', () => dropMenu.classList.remove('show'));

    document.getElementById('toggleTasbeehSoundBtn').onclick = () => {
      tasbeehSound = !tasbeehSound;
      document.getElementById('soundStatusText').textContent = tasbeehSound ? 'الصوت: مفعّل 🔊' : 'تشغيل الصوت';
      saveTasbeehStats();
    };

    document.getElementById('toggleTasbeehVibrateBtn').onclick = () => {
      tasbeehVibrate = !tasbeehVibrate;
      document.getElementById('vibrateStatusText').textContent = tasbeehVibrate ? 'الارتجاج: مفعّل' : 'الارتجاج: معطّل';
      saveTasbeehStats();
    };

    document.getElementById('toggleTasbeehWakeLockBtn').onclick = async () => {
      if ('wakeLock' in navigator) {
        try {
          if (!tasbeehWakeLock) {
            tasbeehWakeLock = await navigator.wakeLock.request('screen');
            document.getElementById('wakeLockStatusText').textContent = 'الشاشة: نشطة دائماً ☀️';
          } else {
            await tasbeehWakeLock.release();
            tasbeehWakeLock = null;
            document.getElementById('wakeLockStatusText').textContent = 'إبقاء الشاشة مضاءة';
          }
        } catch (err) {}
      }
    };
  }

  // تشغيل المسبحة خارج التطبيق
  const pipBtn = document.getElementById('startFloatingWidgetBtn');
  const pipPermissionModal = document.getElementById('tasbeehPipPermissionModal');
  const closePipPermBtn = document.getElementById('closePipPermissionBtn');

  if (closePipPermBtn && pipPermissionModal) {
    closePipPermBtn.onclick = () => pipPermissionModal.classList.remove('show');
  }

  if (pipBtn) {
    pipBtn.onclick = async () => {
      const activeItem = getActiveTasbeehItem();

      // أ) بيئة الأندرويد الأصيلة عند تجميع الـ APK
      if (window.AndroidBridge && typeof window.AndroidBridge.showFloatingTasbeeh === 'function') {
        const hasPermission = window.AndroidBridge.hasOverlayPermission ? window.AndroidBridge.hasOverlayPermission() : true;
        if (!hasPermission) {
          window.AndroidBridge.requestOverlayPermission();
          return;
        }
        window.AndroidBridge.showFloatingTasbeeh(activeItem.text, tasbeehStats.countsMap[activeItem.id] || 0, tasbeehTarget);
        return;
      }

      // ب) متصفح الكمبيوتر: نافذة حقيقية تفاعلية
      if ('documentPictureInPicture' in window) {
        try {
          activeDesktopPipWindow = await window.documentPictureInPicture.requestWindow({ width: 340, height: 260 });
          activeDesktopPipWindow.document.body.innerHTML = `
            <style>
              body { margin:0; background:#064E3B; color:#fff; font-family:'Cairo',sans-serif; display:flex; flex-direction:column; align-items:center; justify-content:center; height:100vh; user-select:none; direction:rtl; overflow:hidden; }
              .d-text { font-size:16.5px; color:#A7F3D0; margin-bottom:10px; text-align:center; font-weight:700; padding:0 12px; }
              .d-btn { font-size:52px; font-weight:900; color:#FBBF24; cursor:pointer; background:rgba(255,255,255,0.12); border-radius:50%; width:115px; height:115px; display:flex; align-items:center; justify-content:center; border:2px solid rgba(255,255,255,0.25); transition:transform 0.1s; }
              .d-btn:active { transform:scale(0.92); }
              .d-sub { font-size:11.5px; margin-top:10px; color:#D1FAE5; opacity:0.9; }
            </style>
            <div class="d-text">${activeItem.text}</div>
            <div class="d-btn" id="pipTapBtn">${tasbeehStats.countsMap[activeItem.id] || 0}</div>
            <div class="d-sub">انقر على الرقم للعدّ</div>
          `;

          activeDesktopPipWindow.document.getElementById('pipTapBtn').onclick = () => {
            incrementTasbeeh();
          };
          return;
        } catch (e) {
          console.log('Document PiP fallback...');
        }
      }

      // ج) متصفح الجوال
      try {
        const video = document.getElementById('tasbeehPipVideo');
        if (!video || !document.pictureInPictureEnabled) {
          if (pipPermissionModal) pipPermissionModal.classList.add('show');
          return;
        }

        if (!pipCanvas) {
          pipCanvas = document.createElement('canvas');
          pipCanvas.width = 360;
          pipCanvas.height = 360;
          pipCtx = pipCanvas.getContext('2d');
        }

        updateFloatingPiPContent();

        if (!video.srcObject) {
          video.srcObject = pipCanvas.captureStream(12);
        }

        await video.play();
        await video.requestPictureInPicture();

        if ('mediaSession' in navigator) {
          navigator.mediaSession.metadata = new MediaMetadata({
            title: activeItem.text,
            artist: 'المسبحة الإلكترونية • الحياة الطيبة'
          });
          navigator.mediaSession.setActionHandler('nexttrack', () => incrementTasbeeh());
          navigator.mediaSession.setActionHandler('play', () => incrementTasbeeh());
          navigator.mediaSession.setActionHandler('pause', () => incrementTasbeeh());
        }
      } catch (err) {
        if (pipPermissionModal) pipPermissionModal.classList.add('show');
      }
    };
  }
});  
