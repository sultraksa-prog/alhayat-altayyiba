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

  // قاعدة بيانات المناسبات الإسلامية والوطنية
  const ISLAMIC_EVENTS = [
    { name: 'رأس السنة الهجرية', month: 1, day: 1 },
    { name: 'يوم عاشوراء', month: 1, day: 10 },
    { name: 'المولد النبوي الشريف', month: 3, day: 12 },
    { name: 'اليوم الوطني للمملكة العربية السعودية', isGreg: true, gMonth: 9, gDay: 23 },
    { name: 'يوم التأسيس السعودي', isGreg: true, gMonth: 2, gDay: 22 },
    { name: 'ليلة الإسراء والمعراج', month: 7, day: 27 },
    { name: 'ليلة النصف من شعبان', month: 8, day: 15 },
    { name: 'بداية شهر رمضان المبارك', month: 9, day: 1 },
    { name: 'ليلة القدر (المتحرّاة)', month: 9, day: 27 },
    { name: 'عيد الفطر المبارك', month: 10, day: 1 },
    { name: 'بداية عشر ذي الحجة', month: 12, day: 1 },
    { name: 'يوم التروية (الحج)', month: 12, day: 8 },
    { name: 'يوم عرفة', month: 12, day: 9 },
    { name: 'عيد الأضحى المبارك', month: 12, day: 10 },
    { name: 'أيام التشريق', month: 12, day: 11 }
  ];

  // حالة التقويم
  let calPerspective = localStorage.getItem('hayat_cal_perspective') || 'hijri'; // 'hijri' or 'gregorian'
  let hijriOffset = parseInt(localStorage.getItem('hayat_hijri_offset') || '0', 10);
  let activeSelectedDate = new Date();
  let currentViewingYear = 1448;
  let currentViewingMonth = 4; // ربيع الثاني افتراضياً

  // محول فلكي هجري أم القرى عالي الدقة بدون إنترنت
  function getAdjustedDate(baseDate) {
    const d = new Date(baseDate);
    if (hijriOffset !== 0) {
      d.setDate(d.getDate() + hijriOffset);
    }
    return d;
  }

  function getHijriDetails(dateObj) {
    const adjusted = getAdjustedDate(dateObj);
    const formatter = new Intl.DateTimeFormat('ar-SA-u-ca-islamic-umalqura', {
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
    return { day, month, year, monthName: HIJRI_MONTH_NAMES[month - 1] };
  }

  // تهيئة شاشتي التقويم وإعدادات أخرى
  window.initCalendarEngine = function () {
    const todayHijri = getHijriDetails(new Date());
    currentViewingYear = todayHijri.year;
    currentViewingMonth = todayHijri.month;
    renderCalendar();
    renderIslamicEvents();
    renderSelectedDayPrayers(activeSelectedDate);
    updateHijriAdjustmentStatusUI();
  };

  // رسم شبكة التقويم
  function renderCalendar() {
    const grid = document.getElementById('calDaysGrid');
    const mainTitle = document.getElementById('calCurrentMonthTitle');
    const subTitle = document.getElementById('calSubMonthTitle');
    if (!grid) return;
    grid.innerHTML = '';

    if (calPerspective === 'hijri') {
      mainTitle.textContent = `${HIJRI_MONTH_NAMES[currentViewingMonth - 1]}، ${currentViewingYear} هـ`;
      subTitle.textContent = 'انقر لقلب المنظور أو اختيار شهر';
      renderHijriMonthGrid(currentViewingYear, currentViewingMonth);
    } else {
      const gMonth = activeSelectedDate.getMonth();
      const gYear = activeSelectedDate.getFullYear();
      mainTitle.textContent = `${GREG_MONTH_NAMES[gMonth]}، ${gYear} م`;
      subTitle.textContent = 'منظور ميلادي';
      renderGregorianMonthGrid(gYear, gMonth);
    }
  }

  function renderHijriMonthGrid(hYear, hMonth) {
    const grid = document.getElementById('calDaysGrid');
    
    // تقدير بداية الشهر الهجري فلكياً
    let tempDate = new Date();
    // البحث عن أول يوم في الشهر الهجري
    for (let i = -40; i <= 40; i++) {
      const d = new Date();
      d.setDate(d.getDate() + i);
      const h = getHijriDetails(d);
      if (h.year === hYear && h.month === hMonth && h.day === 1) {
        tempDate = d;
        break;
      }
    }

    const firstDayIndex = tempDate.getDay(); // 0 = الأحد, 6 = السبت
    
    // خلايا فارغة لبداية الأسبوع
    for (let f = 0; f < firstDayIndex; f++) {
      const empty = document.createElement('div');
      empty.className = 'cal-day-cell other-month';
      grid.appendChild(empty);
    }

    // رسم 29 أو 30 يوماً للشهر
    for (let day = 1; day <= 30; day++) {
      const cellDate = new Date(tempDate);
      cellDate.setDate(cellDate.getDate() + (day - 1));
      const hCheck = getHijriDetails(cellDate);
      if (hCheck.month !== hMonth) break; // انتهاء الشهر عند 29 يوماً

      const cell = document.createElement('div');
      const isSelected = cellDate.toDateString() === activeSelectedDate.toDateString();
      cell.className = `cal-day-cell ${isSelected ? 'selected' : ''}`;

      // فحص وجود مناسبة
      const hasEvent = ISLAMIC_EVENTS.some(ev => !ev.isGreg && ev.month === hMonth && ev.day === day);

      cell.innerHTML = `
        ${hasEvent ? '<div class="cal-event-dot"></div>' : ''}
        <span class="cal-day-primary">${day}</span>
        <span class="cal-day-secondary">${cellDate.getDate()}</span>
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

      cell.innerHTML = `
        <span class="cal-day-primary">${day}</span>
        <span class="cal-day-secondary">${hDetails.day}</span>
      `;

      cell.onclick = () => {
        activeSelectedDate = new Date(cellDate);
        renderCalendar();
        renderSelectedDayPrayers(activeSelectedDate);
      };

      grid.appendChild(cell);
    }
  }

  // حساب وعرض مواقيت صلاة اليوم المختار
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

    // جلب المواقيت المحفوظة أو حسابها تقديرياً
    const cached = JSON.parse(localStorage.getItem('hayat_cached_timings')) || {};
    const timings = cached.timings || {
      Fajr: '04:54', Sunrise: '06:10', Dhuhr: '12:13', Asr: '15:38', Maghrib: '18:15', Isha: '19:45'
    };

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
        <span class="cal-prayer-time">${timings[p.key] || '--:--'}</span>
      `;
      list.appendChild(row);
    });
  }

  // عرض الأعياد والمناسبات مع العداد التنازلي الذكي
  function renderIslamicEvents() {
    const container = document.getElementById('calEventsListContainer');
    if (!container) return;
    container.innerHTML = '';

    const today = new Date();
    const todayH = getHijriDetails(today);

    ISLAMIC_EVENTS.forEach(ev => {
      let targetDate = new Date();
      let dateDesc = '';

      if (ev.isGreg) {
        targetDate = new Date(today.getFullYear(), ev.gMonth - 1, ev.gDay);
        dateDesc = `${ev.gDay} ${GREG_MONTH_NAMES[ev.gMonth - 1]}`;
      } else {
        // تقدير موعد المناسبة الهجرية
        const monthDiff = ev.month - todayH.month;
        const dayDiff = ev.day - todayH.day;
        const totalEstDays = (monthDiff * 29.5) + dayDiff;
        targetDate = new Date();
        targetDate.setDate(targetDate.getDate() + Math.round(totalEstDays));
        dateDesc = `${String(ev.day).padStart(2, '0')} ${HIJRI_MONTH_NAMES[ev.month - 1]}، ${currentViewingYear} هـ`;
      }

      // حساب فارق الأيام الحقيقي
      const diffTime = targetDate.setHours(0,0,0,0) - today.setHours(0,0,0,0);
      const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));

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
          <h4>${ev.name}</h4>
          <span>${dateDesc}</span>
        </div>
        <span class="${badgeClass}">${badgeText}</span>
      `;
      container.appendChild(item);
    });
  }

  // تحديث حالة نص تصحيح التاريخ الهجري في إعدادات أخرى
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

  // ربط أحداث التقويم عند تشغيل الصفحة
  document.addEventListener('DOMContentLoaded', () => {
    // 1. التنقل بين الشهور
    const prevBtn = document.getElementById('calPrevMonthBtn');
    const nextBtn = document.getElementById('calNextMonthBtn');
    if (prevBtn) {
      prevBtn.onclick = () => {
        if (currentViewingMonth === 1) {
          currentViewingMonth = 12;
          currentViewingYear--;
        } else {
          currentViewingMonth--;
        }
        renderCalendar();
      };
    }
    if (nextBtn) {
      nextBtn.onclick = () => {
        if (currentViewingMonth === 12) {
          currentViewingMonth = 1;
          currentViewingYear++;
        } else {
          currentViewingMonth++;
        }
        renderCalendar();
      };
    }

    // 2. زر قلب المنظور
    const togglePerspBtn = document.getElementById('toggleCalendarPerspectiveBtn');
    if (togglePerspBtn) {
      togglePerspBtn.onclick = () => {
        calPerspective = (calPerspective === 'hijri') ? 'gregorian' : 'hijri';
        localStorage.setItem('hayat_cal_perspective', calPerspective);
        document.getElementById('perspectiveModeText').textContent = (calPerspective === 'hijri') ? 'الميلادي' : 'الهجري';
        renderCalendar();
      };
    }

    // 3. زر اليوم
    const todayBtn = document.getElementById('calReturnTodayBtn');
    if (todayBtn) {
      todayBtn.onclick = () => {
        activeSelectedDate = new Date();
        const t = getHijriDetails(activeSelectedDate);
        currentViewingYear = t.year;
        currentViewingMonth = t.month;
        renderCalendar();
        renderSelectedDayPrayers(activeSelectedDate);
      };
    }

    // 4. التبديل بين تبويبي (مواقيت الصلاة / الأعياد)
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

    // 5. نافذة تعديل التقويم الهجري
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
          // تحديث شريط تاريخ الشاشة الرئيسية فوراً
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

      HIJRI_MONTH_NAMES.forEach((m, idx) => {
        const item = document.createElement('div');
        item.className = `wheel-item ${idx + 1 === currentViewingMonth ? 'active' : ''}`;
        item.textContent = m;
        item.onclick = () => {
          currentViewingMonth = idx + 1;
          populatePickerWheels();
        };
        monthCol.appendChild(item);
      });

      for (let y = 1445; y <= 1452; y++) {
        const item = document.createElement('div');
        item.className = `wheel-item ${y === currentViewingYear ? 'active' : ''}`;
        item.textContent = y;
        item.onclick = () => {
          currentViewingYear = y;
          populatePickerWheels();
        };
        yearCol.appendChild(item);
      }
    }
  });
})();
