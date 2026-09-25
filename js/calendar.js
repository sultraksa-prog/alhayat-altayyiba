// ==================== محرك التقويم الإسلامي الشامل والمناسبات ====================
(function () {
  const HIJRI_MONTH_NAMES = [
    'محرم', 'صفر', 'ربيع الأول', 'ربيع الثاني', 'جمادى الأولى', 'جمادى الآخرة',
    'رجب', 'شعبان', 'رمضان', 'شوال', 'ذو القعدة', 'ذو الحجة'
  ];

  const GREG_MONTH_NAMES = [
    'يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو',
    'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'
  ];

  // 1. قاعدة بيانات المناسبات الدينية الإسلامية العامة الثابتة
  const ISLAMIC_RELIGIOUS_EVENTS = [
    { name: 'رأس السنة الهجرية', month: 1, day: 1, type: 'religious' },
    { name: 'يوم عاشوراء', month: 1, day: 10, type: 'religious' },
    { name: 'المولد النبوي الشريف', month: 3, day: 12, type: 'religious' },
    { name: 'ليلة الإسراء والمعراج', month: 7, day: 27, type: 'religious' },
    { name: 'ليلة النصف من شعبان', month: 8, day: 15, type: 'religious' },
    { name: 'غُرّة شهر رمضان المبارك', month: 9, day: 1, type: 'religious' },
    { name: 'ليلة القدر (المتحرّاة)', month: 9, day: 27, type: 'religious' },
    { name: 'عيد الفطر المبارك', month: 10, day: 1, type: 'religious' },
    { name: 'بداية عشر ذي الحجة', month: 12, day: 1, type: 'religious' },
    { name: 'يوم التروية (الحج)', month: 12, day: 8, type: 'religious' },
    { name: 'يوم عرفة', month: 12, day: 9, type: 'religious' },
    { name: 'عيد الأضحى المبارك', month: 12, day: 10, type: 'religious' },
    { name: 'أيام التشريق', month: 12, day: 11, type: 'religious' }
  ];

  // 2. قاعدة بيانات المناسبات الوطنية للدول العربية والإسلامية (تعمل 100% أوفلاين)
  const NATIONAL_EVENTS_DATABASE = {
    'السعودية': [
      { name: 'اليوم الوطني للمملكة العربية السعودية', isGreg: true, gMonth: 9, gDay: 23, type: 'national' },
      { name: 'يوم التأسيس السعودي', isGreg: true, gMonth: 2, gDay: 22, type: 'national' },
      { name: 'يوم العلم السعودي', isGreg: true, gMonth: 3, gDay: 11, type: 'national' }
    ],
    'مصر': [
      { name: 'عيد تحرير سيناء', isGreg: true, gMonth: 4, gDay: 25, type: 'national' },
      { name: 'ثورة 30 يونيو', isGreg: true, gMonth: 6, gDay: 30, type: 'national' },
      { name: 'ثورة 23 يوليو', isGreg: true, gMonth: 7, gDay: 23, type: 'national' },
      { name: 'عيد القوات المسلحة (نصر أكتوبر)', isGreg: true, gMonth: 10, gDay: 6, type: 'national' }
    ],
    'السودان': [
      { name: 'عيد الاستقلال السوداني', isGreg: true, gMonth: 1, gDay: 1, type: 'national' },
      { name: 'ثورة 6 أبريل', isGreg: true, gMonth: 4, gDay: 6, type: 'national' },
      { name: 'ثورة 19 ديسمبر', isGreg: true, gMonth: 12, gDay: 19, type: 'national' }
    ],
    'اليمن': [
      { name: 'عيد الوحدة اليمنية', isGreg: true, gMonth: 5, gDay: 22, type: 'national' },
      { name: 'ثورة 26 سبتمبر', isGreg: true, gMonth: 9, gDay: 26, type: 'national' },
      { name: 'ثورة 14 أكتوبر', isGreg: true, gMonth: 10, gDay: 14, type: 'national' },
      { name: 'عيد الاستقلال 30 نوفمبر', isGreg: true, gMonth: 11, gDay: 30, type: 'national' }
    ],
    'الإمارات': [
      { name: 'يوم الشهيد الإماراتي', isGreg: true, gMonth: 11, gDay: 30, type: 'national' },
      { name: 'عيد الاتحاد (اليوم الوطني)', isGreg: true, gMonth: 12, gDay: 2, type: 'national' }
    ],
    'الكويت': [
      { name: 'العيد الوطني الكويتي', isGreg: true, gMonth: 2, gDay: 25, type: 'national' },
      { name: 'عيد التحرير الكويتي', isGreg: true, gMonth: 2, gDay: 26, type: 'national' }
    ],
    'عمان': [
      { name: 'اليوم الوطني العُماني', isGreg: true, gMonth: 11, gDay: 18, type: 'national' }
    ],
    'قطر': [
      { name: 'اليوم الرياضي للدولة', isGreg: true, gMonth: 2, gDay: 10, type: 'national' },
      { name: 'اليوم الوطني لقطر', isGreg: true, gMonth: 12, gDay: 18, type: 'national' }
    ],
    'البحرين': [
      { name: 'اليوم الوطني البحريني', isGreg: true, gMonth: 12, gDay: 16, type: 'national' }
    ],
    'الأردن': [
      { name: 'عيد استقلال المملكة الأردنية', isGreg: true, gMonth: 5, gDay: 25, type: 'national' }
    ],
    'فلسطين': [
      { name: 'يوم الأرض الفلسطيني', isGreg: true, gMonth: 3, gDay: 30, type: 'national' },
      { name: 'يوم الاستقلال الفلسطيني', isGreg: true, gMonth: 11, gDay: 15, type: 'national' }
    ],
    'المغرب': [
      { name: 'عيد العرش المغربي', isGreg: true, gMonth: 7, gDay: 30, type: 'national' },
      { name: 'ذكرى ثورة الملك والشعب', isGreg: true, gMonth: 8, gDay: 20, type: 'national' },
      { name: 'ذكرى المسيرة الخضراء', isGreg: true, gMonth: 11, gDay: 6, type: 'national' },
      { name: 'عيد الاستقلال المغربي', isGreg: true, gMonth: 11, gDay: 18, type: 'national' }
    ],
    'الجزائر': [
      { name: 'عيد الاستقلال الجزائري', isGreg: true, gMonth: 7, gDay: 5, type: 'national' },
      { name: 'ذكرى الثورة التحريرية', isGreg: true, gMonth: 11, gDay: 1, type: 'national' }
    ],
    'تونس': [
      { name: 'عيد الاستقلال التونسي', isGreg: true, gMonth: 3, gDay: 20, type: 'national' },
      { name: 'عيد الجمهورية التونسية', isGreg: true, gMonth: 7, gDay: 25, type: 'national' }
    ]
  };

  // حالة التقويم
  let calPerspective = localStorage.getItem('hayat_cal_perspective') || 'hijri';
  let hijriOffset = parseInt(localStorage.getItem('hayat_hijri_offset') || '0', 10);
  let activeSelectedDate = new Date();
  
  let currentViewingYear = 1448;
  let currentViewingMonth = 4;
  let currentViewingGregYear = 2026;
  let currentViewingGregMonth = 8;
  let currentOccFilter = 'all';

  // تجريد التشكيل للبحث السلس
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

  function getAdjustedDate(baseDate) {
    const d = new Date(baseDate);
    if (hijriOffset !== 0) {
      d.setDate(d.getDate() + hijriOffset);
    }
    return d;
  }

  // مستخرج الأرقام الفلكية القياسي الحصين ضد NaN
  function getHijriDetails(dateObj) {
    const adjusted = getAdjustedDate(dateObj);
    try {
      const formatter = new Intl.DateTimeFormat('en-u-ca-islamic-umalqura-nu-latn', {
        day: 'numeric',
        month: 'numeric',
        year: 'numeric'
      });
      const parts = formatter.formatToParts(adjusted);
      let day = 1, month = 1, year = 1448;
      parts.forEach(p => {
        if (p.type === 'day') day = parseInt(p.value, 10);
        if (p.type === 'month') month = parseInt(p.value, 10);
        if (p.type === 'year') year = parseInt(p.value, 10);
      });

      if (isNaN(day)) day = 1;
      if (isNaN(month)) month = 1;
      if (isNaN(year)) year = 1448;

      return {
        day,
        month,
        year,
        monthName: HIJRI_MONTH_NAMES[month - 1] || 'محرم'
      };
    } catch (e) {
      return { day: 1, month: 4, year: 1448, monthName: 'ربيع الثاني' };
    }
  }

  // الدالة الأساسية لتشغيل التقويم وضمان حقن البيانات
  window.initCalendarEngine = function () {
    const today = new Date();
    activeSelectedDate = new Date(today);
    const todayH = getHijriDetails(today);
    
    currentViewingYear = todayH.year;
    currentViewingMonth = todayH.month;
    currentViewingGregYear = today.getFullYear();
    currentViewingGregMonth = today.getMonth();

    updatePerspectiveUI();
    renderCalendar();
    renderIslamicEvents();
    renderSelectedDayPrayers(activeSelectedDate);
    updateHijriAdjustmentStatusUI();
  };

  function updatePerspectiveUI() {
    const btnText = document.getElementById('perspectiveModeText');
    if (btnText) {
      btnText.textContent = (calPerspective === 'hijri') ? 'الميلادي' : 'الهجري';
    }
  }

  function renderCalendar() {
    const grid = document.getElementById('calDaysGrid');
    const mainTitle = document.getElementById('calCurrentMonthTitle');
    const subTitle = document.getElementById('calSubMonthTitle');
    if (!grid) return;
    grid.innerHTML = '';

    if (calPerspective === 'hijri') {
      if (mainTitle) mainTitle.textContent = `${HIJRI_MONTH_NAMES[currentViewingMonth - 1]}، ${currentViewingYear} هـ`;
      if (subTitle) subTitle.textContent = 'التقويم الهجري (أم القرى)';
      renderHijriMonthGrid(currentViewingYear, currentViewingMonth);
    } else {
      if (mainTitle) mainTitle.textContent = `${GREG_MONTH_NAMES[currentViewingGregMonth]}، ${currentViewingGregYear} م`;
      if (subTitle) subTitle.textContent = 'التقويم الميلادي';
      renderGregorianMonthGrid(currentViewingGregYear, currentViewingGregMonth);
    }
  }

  function findFirstDayOfHijriMonth(hYear, hMonth) {
    const today = new Date();
    const todayH = getHijriDetails(today);
    
    const monthDiff = (hYear - todayH.year) * 12 + (hMonth - todayH.month);
    const estDays = Math.round(monthDiff * 29.53058) - (todayH.day - 1);
    
    let cursor = new Date(today);
    cursor.setDate(cursor.getDate() + estDays);

    for (let step = 0; step < 8; step++) {
      const h = getHijriDetails(cursor);
      if (h.year === hYear && h.month === hMonth && h.day === 1) {
        return cursor;
      }
      if (h.year < hYear || (h.year === hYear && h.month < hMonth)) {
        cursor.setDate(cursor.getDate() + 1);
      } else if (h.day > 1) {
        cursor.setDate(cursor.getDate() - (h.day - 1));
      } else {
        cursor.setDate(cursor.getDate() - 1);
      }
    }
    return cursor;
  }

  // فحص أيام الصيام المستحب
  function isRecommendedFasting(dateObj, hDay, hMonth) {
    const dayOfWeek = dateObj.getDay();
    if (hMonth === 10 && hDay === 1) return false;
    if (hMonth === 12 && (hDay >= 10 && hDay <= 13)) return false;

    if (dayOfWeek === 1 || dayOfWeek === 4) return true;
    if (hDay === 13 || hDay === 14 || hDay === 15) return true;
    if (hMonth === 1 && (hDay === 9 || hDay === 10)) return true;
    if (hMonth === 12 && hDay === 9) return true;
    if (hMonth === 10 && hDay >= 2 && hDay <= 7) return true;

    return false;
  }

  // جلب كافة المناسبات المعتمدة للدولة
  function getAllOccasionsList() {
    let country = 'السعودية';
    try {
      const userLoc = JSON.parse(localStorage.getItem('hayat_saved_location'));
      if (userLoc && userLoc.country) country = userLoc.country;
    } catch (e) {}

    let nationalEvents = NATIONAL_EVENTS_DATABASE[country];
    if (!nationalEvents) {
      const cachedCustom = localStorage.getItem(`hayat_national_events_${country}`);
      if (cachedCustom) {
        try { nationalEvents = JSON.parse(cachedCustom); } catch (e) {}
      }
    }
    return [...ISLAMIC_RELIGIOUS_EVENTS, ...(nationalEvents || [])];
  }

  function renderHijriMonthGrid(hYear, hMonth) {
    const grid = document.getElementById('calDaysGrid');
    if (!grid) return;
    const firstDate = findFirstDayOfHijriMonth(hYear, hMonth);
    const firstDayIndex = firstDate.getDay();

    for (let f = 0; f < firstDayIndex; f++) {
      const empty = document.createElement('div');
      empty.className = 'cal-day-cell other-month';
      grid.appendChild(empty);
    }

    const allEvents = getAllOccasionsList();

    for (let day = 1; day <= 30; day++) {
      const cellDate = new Date(firstDate);
      cellDate.setDate(cellDate.getDate() + (day - 1));
      
      const hCheck = getHijriDetails(cellDate);
      if (hCheck.month !== hMonth) break;

      const cell = document.createElement('div');
      const isSelected = cellDate.toDateString() === activeSelectedDate.toDateString();
      cell.className = `cal-day-cell ${isSelected ? 'selected' : ''}`;

      const hasEvent = allEvents.some(ev => !ev.isGreg && ev.month === hMonth && ev.day === day);
      const isFasting = isRecommendedFasting(cellDate, day, hMonth);

      cell.innerHTML = `
        <span class="cal-day-primary">${day}</span>
        <span class="cal-day-secondary">${cellDate.getDate()}</span>
        <div class="cal-cell-dots-row">
          ${hasEvent ? '<span class="cell-dot dot-event" title="مناسبة"></span>' : ''}
          ${isFasting ? '<span class="cell-dot dot-fasting" title="صيام مستحب"></span>' : ''}
        </div>
      `;

      cell.onclick = () => {
        activeSelectedDate = new Date(cellDate);
        renderCalendar();
        renderSelectedDayPrayers(activeSelectedDate);
      };

      grid.appendChild(cell);
    }
  }

  function renderGregorianMonthGrid(gYear, gMonth) {
    const grid = document.getElementById('calDaysGrid');
    if (!grid) return;
    const firstDate = new Date(gYear, gMonth, 1);
    const firstDayIndex = firstDate.getDay();
    const daysInMonth = new Date(gYear, gMonth + 1, 0).getDate();

    for (let f = 0; f < firstDayIndex; f++) {
      const empty = document.createElement('div');
      empty.className = 'cal-day-cell other-month';
      grid.appendChild(empty);
    }

    const allEvents = getAllOccasionsList();

    for (let day = 1; day <= daysInMonth; day++) {
      const cellDate = new Date(gYear, gMonth, day);
      const hDetails = getHijriDetails(cellDate);
      const isSelected = cellDate.toDateString() === activeSelectedDate.toDateString();

      const cell = document.createElement('div');
      cell.className = `cal-day-cell ${isSelected ? 'selected' : ''}`;

      const hasEvent = allEvents.some(ev => 
        (ev.isGreg && ev.gMonth === (gMonth + 1) && ev.gDay === day) ||
        (!ev.isGreg && ev.month === hDetails.month && ev.day === hDetails.day)
      );
      const isFasting = isRecommendedFasting(cellDate, hDetails.day, hDetails.month);

      cell.innerHTML = `
        <span class="cal-day-primary">${day}</span>
        <span class="cal-day-secondary">${hDetails.day}</span>
        <div class="cal-cell-dots-row">
          ${hasEvent ? '<span class="cell-dot dot-event" title="مناسبة"></span>' : ''}
          ${isFasting ? '<span class="cell-dot dot-fasting" title="صيام مستحب"></span>' : ''}
        </div>
      `;

      cell.onclick = () => {
        activeSelectedDate = new Date(cellDate);
        renderCalendar();
        renderSelectedDayPrayers(activeSelectedDate);
      };

      grid.appendChild(cell);
    }
  }

  // ==================== محرك الحساب الفلكي الشمسي لمواقيت الصلاة ====================
  function calculateDailyPrayerTimes(dateObj, lat, lng, timezone = 3) {
    const rad = Math.PI / 180;
    const deg = 180 / Math.PI;

    const d = (dateObj.getTime() / 86400000) + 2440587.5 - 2451545.0;
    const M = (357.529 + 0.98560028 * d) % 360;
    const L = (280.459 + 0.98564736 * d) % 360;
    const lambda = (L + 1.915 * Math.sin(M * rad) + 0.020 * Math.sin(2 * M * rad)) % 360;
    const epsilon = 23.439 - 0.00000036 * d;

    const alpha = Math.atan2(Math.cos(epsilon * rad) * Math.sin(lambda * rad), Math.cos(lambda * rad)) * deg;
    const delta = Math.asin(Math.sin(epsilon * rad) * Math.sin(lambda * rad)) * deg;
    const EqT = (L / 15 - (alpha / 15)) * 60;

    const solarNoon = 12 + timezone - (lng / 15) - (EqT / 60);

    function getHourAngle(altitude) {
      const cosH = (Math.sin(altitude * rad) - Math.sin(lat * rad) * Math.sin(delta * rad)) /
                   (Math.cos(lat * rad) * Math.cos(delta * rad));
      if (cosH > 1 || cosH < -1) return null;
      return Math.acos(cosH) * deg / 15;
    }

    const noonZenith = Math.abs(lat - delta);
    const asrAltitude = Math.atan(1 / (1 + Math.tan(noonZenith * rad))) * deg;

    const fajrH = getHourAngle(-18.5);
    const sunH = getHourAngle(-0.833);
    const asrH = getHourAngle(asrAltitude);

    function formatTime(decHour) {
      if (decHour === null || isNaN(decHour)) return '--:--';
      decHour = (decHour + 24) % 24;
      let h = Math.floor(decHour);
      let m = Math.floor((decHour - h) * 60);
      const period = h >= 12 ? 'م' : 'ص';
      h = h % 12 || 12;
      return `${h}:${String(m).padStart(2, '0')} ${period}`;
    }

    const maghribDec = solarNoon + (sunH || 1.05);

    return {
      Fajr: formatTime(solarNoon - (fajrH || 1.35)),
      Sunrise: formatTime(solarNoon - (sunH || 1.05)),
      Dhuhr: formatTime(solarNoon + (2 / 60)),
      Asr: formatTime(solarNoon + (asrH || 3.3)),
      Maghrib: formatTime(maghribDec),
      Isha: formatTime(maghribDec + 1.5)
    };
  }

  function renderSelectedDayPrayers(dateObj) {
    const list = document.getElementById('calDayPrayersList');
    const hijriFull = document.getElementById('selectedDayHijriFull');
    const gregFull = document.getElementById('selectedDayGregFull');
    if (!list) return;

    const h = getHijriDetails(dateObj);
    if (hijriFull) hijriFull.textContent = `${h.day} ${h.monthName}، ${h.year} هـ`;
    if (gregFull) {
      const gFormatter = new Intl.DateTimeFormat('ar-EG', { day: 'numeric', month: 'long', year: 'numeric' });
      gregFull.textContent = gFormatter.format(dateObj) + ' م';
    }

    const userLoc = JSON.parse(localStorage.getItem('hayat_saved_location')) || { lat: 21.4225, lng: 39.8262 };
    const tz = (userLoc.lng > 40) ? 3 : 2;
    const dayTimings = calculateDailyPrayerTimes(dateObj, userLoc.lat, userLoc.lng, tz);

    const prayers = [
      { name: 'الفجر', key: 'Fajr' },
      { name: 'الشروق', key: 'Sunrise' },
      { name: 'الظهر', key: 'Dhuhr' },
      { name: 'العصر', key: 'Asr' },
      { name: 'المغرب', key: 'Maghrib' },
      { name: 'العشاء', key: 'Isha' }
    ];

    list.innerHTML = '';
    prayers.forEach(p => {
      const row = document.createElement('div');
      row.className = 'cal-prayer-row';
      row.innerHTML = `
        <span class="cal-prayer-name">${p.name}</span>
        <span class="cal-prayer-time">${dayTimings[p.key]}</span>
      `;
      list.appendChild(row);
    });
  }

  const DAY_NAMES = ['الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];

  // كتابة التاريخ الميلادي بصيغة رقمية مريحة وموجزة: DD/MM/YYYYم
  function formatGregorianNumeric(dateObj) {
    const d = String(dateObj.getDate()).padStart(2, '0');
    const m = String(dateObj.getMonth() + 1).padStart(2, '0');
    const y = dateObj.getFullYear();
    return `${d}/${m}/${y}م`;
  }

  // فحص وحصر عبارات التهنئة في المواسم الكبرى الثلاثة فقط عند حلول موعدها اليوم
  function getSpecialCelebrationMessage(eventName, diffDays) {
    if (diffDays !== 0) return null;
    if (eventName.includes('رمضان')) return 'مبارك عليكم الشهر الكريم 🌙';
    if (eventName.includes('الفطر')) return 'عيدكم مبارك، تقبل الله طاعتكم 🎉';
    if (eventName.includes('الأضحى')) return 'عيد أضحى مبارك، تقبل الله طاعتكم 🐑';
    return null;
  }

  // 1. عرض تبويب "المناسبات القريبة" (الشهر المعروض أو ضمن نطاق ±30 يوماً من اليوم)
  function renderIslamicEvents() {
    const container = document.getElementById('calEventsListContainer');
    if (!container) return;
    container.innerHTML = '';

    const today = new Date();
    const todayH = getHijriDetails(today);
    const allEvents = getAllOccasionsList();

    let countShown = 0;

    allEvents.forEach(ev => {
      let targetDate = new Date();
      let hDay = 1, hMonth = 1, hYear = currentViewingYear;

      if (ev.isGreg) {
        targetDate = new Date(today.getFullYear(), ev.gMonth - 1, ev.gDay);
        const hEq = getHijriDetails(targetDate);
        hDay = hEq.day;
        hMonth = hEq.month;
        hYear = hEq.year;
      } else {
        hDay = ev.day;
        hMonth = ev.month;
        const monthDiff = ev.month - todayH.month;
        const dayDiff = ev.day - todayH.day;
        targetDate = new Date(today);
        targetDate.setDate(targetDate.getDate() + Math.round((monthDiff * 29.53) + dayDiff));
      }

      const diffTime = targetDate.setHours(0,0,0,0) - today.setHours(0,0,0,0);
      const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));

      // الشرط: إما تقع في الشهر المعروض حالياً أو ضمن نطاق ±30 يوماً
      const isInCurrentMonth = ev.isGreg 
        ? (calPerspective === 'gregorian' && ev.gMonth === (currentViewingGregMonth + 1))
        : (ev.month === currentViewingMonth);

      const isWithin30DaysRange = (diffDays >= -30 && diffDays <= 30);

      if (isInCurrentMonth || isWithin30DaysRange) {
        countShown++;
        const cardHtml = createEventCardElement(ev, targetDate, hDay, hMonth, hYear, diffDays);
        container.appendChild(cardHtml);
      }
    });

    if (countShown === 0) {
      container.innerHTML = `<div style="text-align:center; padding:20px; color:var(--text-muted); font-size:13px;">لا توجد مناسبات قريبة (الشهر الحالي أو ±30 يوماً)</div>`;
    }

    renderComprehensiveOccasions();
  }

  // 2. عرض كرت المناسبات الشامل مع التصفية والبحث
  let currentOccFilter = 'all';
  function renderComprehensiveOccasions() {
    const listEl = document.getElementById('comprehensiveEventsList');
    const badgeEl = document.getElementById('calCountryBadgeDisplay');
    const searchInput = document.getElementById('comprehensiveSearchInput');
    const nextTitle = document.getElementById('nextEventTitleDisplay');
    const nextBadge = document.getElementById('nextEventCountdownDisplay');

    if (!listEl) return;
    listEl.innerHTML = '';

    let country = 'السعودية';
    try {
      const userLoc = JSON.parse(localStorage.getItem('hayat_saved_location'));
      if (userLoc && userLoc.country) country = userLoc.country;
    } catch (e) {}

    if (badgeEl) badgeEl.textContent = country;

    const query = searchInput ? normalizeArabicText(searchInput.value) : '';
    const today = new Date();
    const todayH = getHijriDetails(today);
    const allEvents = getAllOccasionsList();

    let nextUpcoming = null;
    let minDays = Infinity;
    let matchedCount = 0;

    allEvents.forEach(ev => {
      if (currentOccFilter !== 'all' && ev.type !== currentOccFilter) return;

      const cleanName = normalizeArabicText(ev.name);
      if (query && !cleanName.includes(query)) return;

      let targetDate = new Date();
      let hDay = 1, hMonth = 1, hYear = currentViewingYear;

      if (ev.isGreg) {
        targetDate = new Date(today.getFullYear(), ev.gMonth - 1, ev.gDay);
        const hEq = getHijriDetails(targetDate);
        hDay = hEq.day;
        hMonth = hEq.month;
        hYear = hEq.year;
      } else {
        hDay = ev.day;
        hMonth = ev.month;
        const monthDiff = ev.month - todayH.month;
        const dayDiff = ev.day - todayH.day;
        targetDate = new Date(today);
        targetDate.setDate(targetDate.getDate() + Math.round((monthDiff * 29.53) + dayDiff));
      }

      const diffTime = targetDate.setHours(0,0,0,0) - today.setHours(0,0,0,0);
      const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));

      if (diffDays >= 0 && diffDays < minDays) {
        minDays = diffDays;
        nextUpcoming = { name: ev.name, days: diffDays };
      }

      matchedCount++;
      const cardHtml = createEventCardElement(ev, targetDate, hDay, hMonth, hYear, diffDays);
      listEl.appendChild(cardHtml);
    });

    if (matchedCount === 0) {
      listEl.innerHTML = `<div style="text-align:center; padding:18px; color:var(--text-muted); font-size:13px;">لا توجد مناسبات مطابقة للبحث أو التصفية</div>`;
    }

    if (nextTitle && nextBadge && nextUpcoming) {
      nextTitle.textContent = nextUpcoming.name;
      nextBadge.textContent = nextUpcoming.days === 0 ? 'اليوم' : `بعد ${nextUpcoming.days} يوماً`;
    }
  }

  // بناء كرت المناسبة بحالاته الثلاث والتواريخ المتكاملة
  function createEventCardElement(ev, targetDate, hDay, hMonth, hYear, diffDays) {
    const item = document.createElement('div');
    const dayName = DAY_NAMES[targetDate.getDay()];
    const hijriDateStr = `${hDay} ${HIJRI_MONTH_NAMES[hMonth - 1]}، ${hYear} هـ`;
    const gregNumericStr = formatGregorianNumeric(targetDate);
    const celebrationMsg = getSpecialCelebrationMessage(ev.name, diffDays);

    let stateClass = 'upcoming';
    let badgeText = '';

    if (celebrationMsg) {
      stateClass = 'active-celebration';
      badgeText = 'اليوم 🎉';
    } else if (diffDays === 0) {
      stateClass = 'upcoming';
      badgeText = 'اليوم 📍';
    } else if (diffDays < 0) {
      stateClass = 'past';
      badgeText = diffDays === -1 ? 'أمس' : `منذ ${Math.abs(diffDays)} أيام`;
    } else {
      stateClass = 'upcoming';
      badgeText = `بعد ${diffDays} أيام`;
    }

    item.className = `cal-event-item ${stateClass}`;
    item.innerHTML = `
      <div class="event-top-row">
        <h4>${ev.name} ${ev.type === 'national' ? '📍' : '🌙'}</h4>
        <span class="event-countdown-badge ${diffDays < 0 ? 'past' : (diffDays === 0 ? 'today' : '')}">${badgeText}</span>
      </div>
      <div class="event-details-bar">
        <span class="event-day-badge">${dayName}</span>
        <span class="event-date-text">${hijriDateStr}</span>
        <span>•</span>
        <span class="event-greg-num">${gregNumericStr}</span>
      </div>
      ${celebrationMsg ? `<div class="event-celebration-banner">${celebrationMsg}</div>` : ''}
    `;
    return item;
  }

  function updateHijriAdjustmentStatusUI() {
    const textEl = document.getElementById('hijriAdjustmentStatusText');
    if (!textEl) return;
    if (hijriOffset === 0) {
      textEl.textContent = 'لم يتم تحديدها';
    } else if (hijriOffset > 0) {
      textEl.textContent = `+${hijriOffset} يوم`;
    } else {
      textEl.textContent = `${hijriOffset} يوم`;
    }

    document.querySelectorAll('.adjust-opt-item').forEach(btn => {
      const val = parseInt(btn.getAttribute('data-offset'), 10);
      btn.classList.toggle('active', val === hijriOffset);
    });
  }

  // ربط جميع أحداث الشاشة
  document.addEventListener('DOMContentLoaded', () => {
    const prevBtn = document.getElementById('calPrevMonthBtn');
    const nextBtn = document.getElementById('calNextMonthBtn');

    if (prevBtn) {
      prevBtn.onclick = () => {
        if (calPerspective === 'hijri') {
          if (currentViewingMonth === 1) {
            currentViewingMonth = 12;
            currentViewingYear--;
          } else {
            currentViewingMonth--;
          }
        } else {
          if (currentViewingGregMonth === 0) {
            currentViewingGregMonth = 11;
            currentViewingGregYear--;
          } else {
            currentViewingGregMonth--;
          }
        }
        renderCalendar();
      };
    }

    if (nextBtn) {
      nextBtn.onclick = () => {
        if (calPerspective === 'hijri') {
          if (currentViewingMonth === 12) {
            currentViewingMonth = 1;
            currentViewingYear++;
          } else {
            currentViewingMonth++;
          }
        } else {
          if (currentViewingGregMonth === 11) {
            currentViewingGregMonth = 0;
            currentViewingGregYear++;
          } else {
            currentViewingGregMonth++;
          }
        }
        renderCalendar();
      };
    }

    const togglePerspBtn = document.getElementById('toggleCalendarPerspectiveBtn');
    if (togglePerspBtn) {
      togglePerspBtn.onclick = () => {
        calPerspective = (calPerspective === 'hijri') ? 'gregorian' : 'hijri';
        localStorage.setItem('hayat_cal_perspective', calPerspective);
        updatePerspectiveUI();
        renderCalendar();
      };
    }

    const todayBtn = document.getElementById('calReturnTodayBtn');
    if (todayBtn) {
      todayBtn.onclick = () => {
        activeSelectedDate = new Date();
        const t = getHijriDetails(activeSelectedDate);
        currentViewingYear = t.year;
        currentViewingMonth = t.month;
        currentViewingGregYear = activeSelectedDate.getFullYear();
        currentViewingGregMonth = activeSelectedDate.getMonth();
        renderCalendar();
        renderSelectedDayPrayers(activeSelectedDate);
      };
    }

    const tabPrayers = document.getElementById('tabCalPrayerTimes');
    const tabEvents = document.getElementById('tabCalEvents');
    const contentPrayers = document.getElementById('contentCalPrayerTimes');
    const contentEvents = document.getElementById('contentCalEvents');

    if (tabPrayers && tabEvents) {
      tabPrayers.onclick = () => {
        tabPrayers.classList.add('active');
        tabEvents.classList.remove('active');
        contentPrayers.style.display = 'block';
        contentEvents.style.display = 'none';
      };
      tabEvents.onclick = () => {
        tabEvents.classList.add('active');
        tabPrayers.classList.remove('active');
        contentEvents.style.display = 'block';
        contentPrayers.style.display = 'none';
        renderIslamicEvents();
      };
    }

    const compSearch = document.getElementById('comprehensiveSearchInput');
    if (compSearch) {
      compSearch.oninput = () => renderComprehensiveOccasions();
    }

    document.querySelectorAll('.comp-chip').forEach(chip => {
      chip.onclick = () => {
        document.querySelectorAll('.comp-chip').forEach(c => c.classList.remove('active'));
        chip.classList.add('active');
        currentOccFilter = chip.getAttribute('data-type');
        renderComprehensiveOccasions();
      };
    });

    const openAdjustBtn = document.getElementById('openHijriAdjustModalBtn');
    const adjustModal = document.getElementById('hijriAdjustModal');
    const closeAdjustBtn = document.getElementById('closeHijriAdjustBtn');

    if (openAdjustBtn && adjustModal) {
      openAdjustBtn.onclick = () => adjustModal.classList.add('show');
      if (closeAdjustBtn) closeAdjustBtn.onclick = () => adjustModal.classList.remove('show');

      document.querySelectorAll('.adjust-opt-item').forEach(btn => {
        btn.onclick = () => {
          hijriOffset = parseInt(btn.getAttribute('data-offset'), 10);
          localStorage.setItem('hayat_hijri_offset', hijriOffset.toString());
          updateHijriAdjustmentStatusUI();
          renderCalendar();
          adjustModal.classList.remove('show');
          if (typeof fetchPrayerTimes === 'function') fetchPrayerTimes();
        };
      });
    }

    const openPickerBtn = document.getElementById('openMonthPickerBtn');
    const pickerModal = document.getElementById('calendarMonthPickerModal');
    const closePickerBtn = document.getElementById('closeCalMonthPickerBtn');
    const confirmPickerBtn = document.getElementById('confirmMonthPickerBtn');

    if (openPickerBtn && pickerModal) {
      openPickerBtn.onclick = () => {
        populatePickerWheels();
        pickerModal.classList.add('show');
      };
      if (closePickerBtn) closePickerBtn.onclick = () => pickerModal.classList.remove('show');
      if (confirmPickerBtn) {
        confirmPickerBtn.onclick = () => {
          pickerModal.classList.remove('show');
          renderCalendar();
        };
      }
    }

    function populatePickerWheels() {
      const monthCol = document.getElementById('pickerMonthCol');
      const yearCol = document.getElementById('pickerYearCol');
      if (!monthCol || !yearCol) return;
      monthCol.innerHTML = '';
      yearCol.innerHTML = '';

      const months = (calPerspective === 'hijri') ? HIJRI_MONTH_NAMES : GREG_MONTH_NAMES;
      const curMonth = (calPerspective === 'hijri') ? currentViewingMonth : (currentViewingGregMonth + 1);

      months.forEach((m, idx) => {
        const item = document.createElement('div');
        item.className = `wheel-item ${idx + 1 === curMonth ? 'active' : ''}`;
        item.textContent = m;
        item.onclick = () => {
          if (calPerspective === 'hijri') {
            currentViewingMonth = idx + 1;
          } else {
            currentViewingGregMonth = idx;
          }
          populatePickerWheels();
        };
        monthCol.appendChild(item);
      });

      const startYear = (calPerspective === 'hijri') ? 1445 : 2024;
      const endYear = (calPerspective === 'hijri') ? 1453 : 2032;
      const curYear = (calPerspective === 'hijri') ? currentViewingYear : currentViewingGregYear;

      for (let y = startYear; y <= endYear; y++) {
        const item = document.createElement('div');
        item.className = `wheel-item ${y === curYear ? 'active' : ''}`;
        item.textContent = y;
        item.onclick = () => {
          if (calPerspective === 'hijri') {
            currentViewingYear = y;
          } else {
            currentViewingGregYear = y;
          }
          populatePickerWheels();
        };
        yearCol.appendChild(item);
      }
    }
  });
})();
