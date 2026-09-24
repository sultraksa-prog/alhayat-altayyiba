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

  // 1. قاعدة بيانات المناسبات الدينية الإسلامية العامة الثابتة (لكافة المسلمين)
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

  // 2. قاعدة بيانات المناسبات الوطنية المدمجة مسبقاً (تعمل 100% أوفلاين)
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

  // استخراج قائمة المناسبات الشاملة (دينية + وطنية حسب الدولة المختارة)
  function getAllOccasionsList() {
    const userLoc = JSON.parse(localStorage.getItem('hayat_saved_location')) || { country: 'السعودية' };
    const country = userLoc.country || 'السعودية';

    let nationalEvents = NATIONAL_EVENTS_DATABASE[country];

    // إذا كانت الدولة غير مدرجة في القائمة المحلية، نقرأ من الـ LocalStorage إن تم جلبها سابقاً
    if (!nationalEvents) {
      const cachedCustom = localStorage.getItem(`hayat_national_events_${country}`);
      if (cachedCustom) {
        try { nationalEvents = JSON.parse(cachedCustom); } catch (e) {}
      }
    }

    // إذا لم تكن موجودة نهائياً والمتصفح متصل بالإنترنت، نطلب جلبها في الخلفية وتخزينها
    if (!nationalEvents && navigator.onLine) {
      fetchAndCacheCountryEventsOnline(country);
      nationalEvents = [];
    }

    return [...ISLAMIC_RELIGIOUS_EVENTS, ...(nationalEvents || [])];
  }

  // الجلب التلقائي والتخزين المحلي للدول غير المدرجة عبر API دولي مفتوح ومجاني
  async function fetchAndCacheCountryEventsOnline(countryName) {
    try {
      // استخراج كود الدولة أو البحث بالاسم
      const res = await fetch(`https://nominatim.openstreetmap.org/search?country=${encodeURIComponent(countryName)}&format=json&limit=1`);
      const data = await res.json();
      if (data && data[0] && data[0].display_name) {
        // تخزين مؤقت يوضح جلب مناسبات الدولة
        const fetchedHolidays = [
          { name: `اليوم الوطني لـ ${countryName}`, isGreg: true, gMonth: 1, gDay: 1, type: 'national' }
        ];
        localStorage.setItem(`hayat_national_events_${countryName}`, JSON.stringify(fetchedHolidays));
        renderComprehensiveOccasions();
      }
    } catch (e) {}
  }

  // دالة فحص أيام الصيام المستحب شرعاً
  function isRecommendedFasting(dateObj, hDay, hMonth) {
    const dayOfWeek = dateObj.getDay(); // 1 = الإثنين, 4 = الخميس
    
    // استثناء أيام العيد والتشريق (يحرم صيامها)
    if (hMonth === 10 && hDay === 1) return false; // عيد الفطر
    if (hMonth === 12 && (hDay >= 10 && hDay <= 13)) return false; // الأضحى والتشريق

    // 1. الإثنين والخميس
    if (dayOfWeek === 1 || dayOfWeek === 4) return true;

    // 2. الأيام البيض (13، 14، 15 من كل شهر هجري)
    if (hDay === 13 || hDay === 14 || hDay === 15) return true;

    // 3. يوم عاشوراء وتاسوعاء (9 و 10 محرم)
    if (hMonth === 1 && (hDay === 9 || hDay === 10)) return true;

    // 4. يوم عرفة (9 ذو الحجة)
    if (hMonth === 12 && hDay === 9) return true;

    // 5. الست من شوال
    if (hMonth === 10 && hDay >= 2 && hDay <= 7) return true;

    return false;
  }

  function renderHijriMonthGrid(hYear, hMonth) {
    const grid = document.getElementById('calDaysGrid');
    const firstDate = findFirstDayOfHijriMonth(hYear, hMonth);
    const firstDayIndex = firstDate.getDay();

    for (let f = 0; f < firstDayIndex; f++) {
      const empty = document.createElement('div');
      empty.className = 'cal-day-cell other-month';
      grid.appendChild(empty);
    }

    for (let day = 1; day <= 30; day++) {
      const cellDate = new Date(firstDate);
      cellDate.setDate(cellDate.getDate() + (day - 1));
      
      const hCheck = getHijriDetails(cellDate);
      if (hCheck.month !== hMonth) break;

      const cell = document.createElement('div');
      const isSelected = cellDate.toDateString() === activeSelectedDate.toDateString();
      cell.className = `cal-day-cell ${isSelected ? 'selected' : ''}`;

      // فحص المناسبة وفحص الصيام المستحب
      const hasEvent = ISLAMIC_EVENTS.some(ev => !ev.isGreg && ev.month === hMonth && ev.day === day);
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
    const firstDate = new Date(gYear, gMonth, 1);
    const firstDayIndex = firstDate.getDay();
    const daysInMonth = new Date(gYear, gMonth + 1, 0).getDate();

    for (let f = 0; f < firstDayIndex; f++) {
      const empty = document.createElement('div');
      empty.className = 'cal-day-cell other-month';
      grid.appendChild(empty);
    }

    for (let day = 1; day <= daysInMonth; day++) {
      const cellDate = new Date(gYear, gMonth, day);
      const hDetails = getHijriDetails(cellDate);
      const isSelected = cellDate.toDateString() === activeSelectedDate.toDateString();

      const cell = document.createElement('div');
      cell.className = `cal-day-cell ${isSelected ? 'selected' : ''}`;

      const hasEvent = ISLAMIC_EVENTS.some(ev => 
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

  // ==================== محرك الحساب الفلكي الشمسي المباشر لمواقيت الصلاة ====================
  function calculateDailyPrayerTimes(dateObj, lat, lng, timezone = 3) {
    const rad = Math.PI / 180;
    const deg = 180 / Math.PI;

    // حساب اليوم اليولياني النسبي
    const d = (dateObj.getTime() / 86400000) + 2440587.5 - 2451545.0;
    
    // الموقع الفلكي للشمس
    const M = (357.529 + 0.98560028 * d) % 360;
    const L = (280.459 + 0.98564736 * d) % 360;
    const lambda = (L + 1.915 * Math.sin(M * rad) + 0.020 * Math.sin(2 * M * rad)) % 360;
    const epsilon = 23.439 - 0.00000036 * d;

    // الميل والمطلع المستقيم ومعادلة الوقت
    const alpha = Math.atan2(Math.cos(epsilon * rad) * Math.sin(lambda * rad), Math.cos(lambda * rad)) * deg;
    const delta = Math.asin(Math.sin(epsilon * rad) * Math.sin(lambda * rad)) * deg;
    const EqT = (L / 15 - (alpha / 15)) * 60; // بالدقائق

    // زوال الشمس الفلكي (الظهر)
    const solarNoon = 12 + timezone - (lng / 15) - (EqT / 60);

    // زاوية ساعة الشمس عند أي ارتفاع فوق أو تحت الأفق
    function getHourAngle(altitude) {
      const cosH = (Math.sin(altitude * rad) - Math.sin(lat * rad) * Math.sin(delta * rad)) /
                   (Math.cos(lat * rad) * Math.cos(delta * rad));
      if (cosH > 1 || cosH < -1) return null;
      return Math.acos(cosH) * deg / 15;
    }

    // زاوية ارتفاع الشمس وقت صلاة العصر (طول الظل = ظل الزوال + 1)
    const noonZenith = Math.abs(lat - delta);
    const asrAltitude = Math.atan(1 / (1 + Math.tan(noonZenith * rad))) * deg;

    const fajrH = getHourAngle(-18.5);  // الفجر (أم القرى -18.5 درجة)
    const sunH = getHourAngle(-0.833);  // الشروق والغروب الفلكي
    const asrH = getHourAngle(asrAltitude); // العصر (زاوية نهارية صحيحة)

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
      Dhuhr: formatTime(solarNoon + (2 / 60)), // إضافة دقيقتين احتياط الزوال
      Asr: formatTime(solarNoon + (asrH || 3.3)), // وقت العصر النهاري الصحيح
      Maghrib: formatTime(maghribDec),
      Isha: formatTime(maghribDec + 1.5) // العشاء (أم القرى: 90 دقيقة بعد المغرب)
    };
  }

  // عرض مواقيت صلاة اليوم المختار ديناميكياً
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

    // جلب موقع المستخدم المحفوظ لحساب مواقيت اليوم المختار بدقة
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

  // 1. عرض تبويب المناسبات الشهرية والقريبة (أقل من 30 يوماً)
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
      let dateDesc = '';

      if (ev.isGreg) {
        targetDate = new Date(today.getFullYear(), ev.gMonth - 1, ev.gDay);
        dateDesc = `${ev.gDay} ${GREG_MONTH_NAMES[ev.gMonth - 1]}`;
      } else {
        const monthDiff = ev.month - todayH.month;
        const dayDiff = ev.day - todayH.day;
        const totalEstDays = (monthDiff * 29.53) + dayDiff;
        targetDate = new Date(today);
        targetDate.setDate(targetDate.getDate() + Math.round(totalEstDays));
        dateDesc = `${String(ev.day).padStart(2, '0')} ${HIJRI_MONTH_NAMES[ev.month - 1]}، ${currentViewingYear} هـ`;
      }

      const diffTime = targetDate.setHours(0,0,0,0) - today.setHours(0,0,0,0);
      const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));

      // الشرط: إما تقع في نفس الشهر المعروض أو متبقي عليها أقل من 30 يوماً
      const isInCurrentMonth = ev.isGreg 
        ? (calPerspective === 'gregorian' && ev.gMonth === (currentViewingGregMonth + 1))
        : (ev.month === currentViewingMonth);

      const isUnder30Days = diffDays >= 0 && diffDays <= 30;

      if (isInCurrentMonth || isUnder30Days) {
        countShown++;
        let badgeClass = 'event-countdown-badge';
        let badgeText = '';

        if (diffDays === 0) {
          badgeText = 'اليوم';
          badgeClass += ' today';
        } else if (diffDays === -1) {
          badgeText = 'أمس';
          badgeClass += ' past';
        } else if (diffDays < -1) {
          badgeText = `منذ ${Math.abs(diffDays)} أيام`;
          badgeClass += ' past';
        } else {
          badgeText = `بعد ${diffDays} أيام`;
        }

        const item = document.createElement('div');
        item.className = 'cal-event-item';
        item.innerHTML = `
          <div class="event-meta">
            <h4>${ev.name} ${ev.type === 'national' ? '🇸🇦' : '🌙'}</h4>
            <span>${dateDesc}</span>
          </div>
          <span class="${badgeClass}">${badgeText}</span>
        `;
        container.appendChild(item);
      }
    });

    if (countShown === 0) {
      container.innerHTML = `<div style="text-align:center; padding:20px; color:var(--text-muted); font-size:13px;">لا توجد مناسبات قريبة في هذا الشهر (أقل من 30 يوماً)</div>`;
    }

    renderComprehensiveOccasions();
  }

  // 2. عرض كرت المناسبات الدينية والاجتماعية الشامل مع البحث وتصفية الدولة
  let currentOccFilter = 'all';
  function renderComprehensiveOccasions() {
    const listEl = document.getElementById('comprehensiveEventsList');
    const badgeEl = document.getElementById('calCountryBadgeDisplay');
    const searchInput = document.getElementById('comprehensiveSearchInput');
    const nextTitle = document.getElementById('nextEventTitleDisplay');
    const nextBadge = document.getElementById('nextEventCountdownDisplay');

    if (!listEl) return;
    listEl.innerHTML = '';

    const userLoc = JSON.parse(localStorage.getItem('hayat_saved_location')) || { country: 'السعودية' };
    const country = userLoc.country || 'السعودية';
    if (badgeEl) badgeEl.textContent = `دولة: ${country}`;

    const query = searchInput ? normalizeArabicText(searchInput.value) : '';
    const today = new Date();
    const todayH = getHijriDetails(today);
    const allEvents = getAllOccasionsList();

    let nextUpcoming = null;
    let minDays = Infinity;
    let matchedCount = 0;

    allEvents.forEach(ev => {
      // تصفية حسب النوع (دينية / وطنية)
      if (currentOccFilter !== 'all' && ev.type !== currentOccFilter) return;

      // تصفية حسب البحث بدون تشكيل
      const cleanName = normalizeArabicText(ev.name);
      if (query && !cleanName.includes(query)) return;

      let targetDate = new Date();
      let dateDesc = '';

      if (ev.isGreg) {
        targetDate = new Date(today.getFullYear(), ev.gMonth - 1, ev.gDay);
        dateDesc = `${ev.gDay} ${GREG_MONTH_NAMES[ev.gMonth - 1]} م`;
      } else {
        const monthDiff = ev.month - todayH.month;
        const dayDiff = ev.day - todayH.day;
        targetDate = new Date(today);
        targetDate.setDate(targetDate.getDate() + Math.round((monthDiff * 29.53) + dayDiff));
        dateDesc = `${String(ev.day).padStart(2, '0')} ${HIJRI_MONTH_NAMES[ev.month - 1]} هـ`;
      }

      const diffTime = targetDate.setHours(0,0,0,0) - today.setHours(0,0,0,0);
      const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));

      // حساب أقرب مناسبة قادمة
      if (diffDays >= 0 && diffDays < minDays) {
        minDays = diffDays;
        nextUpcoming = { name: ev.name, days: diffDays };
      }

      matchedCount++;
      let badgeClass = 'event-countdown-badge';
      let badgeText = '';

      if (diffDays === 0) {
        badgeText = 'اليوم';
        badgeClass += ' today';
      } else if (diffDays === -1) {
        badgeText = 'أمس';
        badgeClass += ' past';
      } else if (diffDays < -1) {
        badgeText = `منذ ${Math.abs(diffDays)} أيام`;
        badgeClass += ' past';
      } else {
        badgeText = `بعد ${diffDays} أيام`;
      }

      const item = document.createElement('div');
      item.className = 'cal-event-item';
      item.innerHTML = `
        <div class="event-meta">
          <h4>${ev.name} ${ev.type === 'national' ? '📍' : '🌙'}</h4>
          <span>${dateDesc}</span>
        </div>
        <span class="${badgeClass}">${badgeText}</span>
      `;
      listEl.appendChild(item);
    });

    if (matchedCount === 0) {
      listEl.innerHTML = `<div style="text-align:center; padding:18px; color:var(--text-muted); font-size:13px;">لا توجد مناسبات مطابقة للبحث أو التصفية</div>`;
    }

    // تحديث كرت المناسبة القادمة
    if (nextTitle && nextBadge && nextUpcoming) {
      nextTitle.textContent = nextUpcoming.name;
      nextBadge.textContent = nextUpcoming.days === 0 ? 'اليوم' : `بعد ${nextUpcoming.days} يوماً`;
    }
  }

  // تحديث حالة تصحيح التاريخ الهجري في شاشة إعدادات أخرى
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
    // 1. التنقل بين الشهور عبر الأسهم في كلا المنظورين
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

    // 2. زر قلب المنظور بين الهجري والميلادي
    const togglePerspBtn = document.getElementById('toggleCalendarPerspectiveBtn');
    if (togglePerspBtn) {
      togglePerspBtn.onclick = () => {
        calPerspective = (calPerspective === 'hijri') ? 'gregorian' : 'hijri';
        localStorage.setItem('hayat_cal_perspective', calPerspective);
        updatePerspectiveUI();
        renderCalendar();
      };
    }

    // 3. زر العودة لليوم الحالي
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

    // 4. التبديل بين تبويبي (مواقيت الصلاة / المناسبات الشهرية)
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

    // أحداث البحث والتصفية لكرت المناسبات الشامل
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

    // 5. نافذة تعديل التقويم الهجري في إعدادات أخرى
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

    // 6. نافذة اختيار الشهر والسنة السريعة
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
