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
  let calPerspective = localStorage.getItem('hayat_cal_perspective') || 'hijri';
  let hijriOffset = parseInt(localStorage.getItem('hayat_hijri_offset') || '0', 10);
  let activeSelectedDate = new Date();
  
  let currentViewingYear = 1448;
  let currentViewingMonth = 4;
  let currentViewingGregYear = 2026;
  let currentViewingGregMonth = 8; // سبتمبر (0-indexed)

  // محول فلكي هجري مع ضمان إرجاع أرقام إنجليزية ليفهمها parseInt بدون خطأ NaN
  function getAdjustedDate(baseDate) {
    const d = new Date(baseDate);
    if (hijriOffset !== 0) {
      d.setDate(d.getDate() + hijriOffset);
    }
    return d;
  }

  function getHijriDetails(dateObj) {
    const adjusted = getAdjustedDate(dateObj);
    try {
      // إجبار المتصفح على إرجاع أرقام قياسية nu-latn حتى لا تصبح NaN
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

  // الدالة الرئيسية لتشغيل التقويم
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

  // رسم شبكة التقويم
  function renderCalendar() {
    const grid = document.getElementById('calDaysGrid');
    const mainTitle = document.getElementById('calCurrentMonthTitle');
    const subTitle = document.getElementById('calSubMonthTitle');
    if (!grid) return;
    grid.innerHTML = '';

    if (calPerspective === 'hijri') {
      mainTitle.textContent = `${HIJRI_MONTH_NAMES[currentViewingMonth - 1]}، ${currentViewingYear} هـ`;
      subTitle.textContent = 'التقويم الهجري (أم القرى)';
      renderHijriMonthGrid(currentViewingYear, currentViewingMonth);
    } else {
      mainTitle.textContent = `${GREG_MONTH_NAMES[currentViewingGregMonth]}، ${currentViewingGregYear} م`;
      subTitle.textContent = 'التقويم الميلادي';
      renderGregorianMonthGrid(currentViewingGregYear, currentViewingGregMonth);
    }
  }

  // البحث الرياضي الدقيق عن أول يوم في الشهر الهجري
  function findFirstDayOfHijriMonth(hYear, hMonth) {
    const today = new Date();
    const todayH = getHijriDetails(today);
    
    // حساب الفرق التقريبي بالأيام
    const monthDiff = (hYear - todayH.year) * 12 + (hMonth - todayH.month);
    const estDays = Math.round(monthDiff * 29.53058) - (todayH.day - 1);
    
    let cursor = new Date(today);
    cursor.setDate(cursor.getDate() + estDays);

    // ضبط دقيق حتى نصل لليوم الأول من نفس الشهر والسنة
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

  // عرض مناسبات الشهر المعروض وحساب كرت المناسبة القادمة بدقة
  function renderIslamicEvents() {
    const container = document.getElementById('calEventsListContainer');
    const nextTitle = document.getElementById('nextEventTitleDisplay');
    const nextBadge = document.getElementById('nextEventCountdownDisplay');
    if (!container) return;
    container.innerHTML = '';

    const today = new Date();
    const todayH = getHijriDetails(today);

    let nextUpcomingEvent = null;
    let minDaysLeft = Infinity;
    let monthEventsCount = 0;

    ISLAMIC_EVENTS.forEach(ev => {
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

      // البحث عن أقرب مناسبة قادمة لكرت الأسفل
      if (diffDays >= 0 && diffDays < minDaysLeft) {
        minDaysLeft = diffDays;
        nextUpcomingEvent = { name: ev.name, days: diffDays };
      }

      // فحص هل المناسبة تقع في الشهر المعروض حالياً
      const isEventInCurrentMonth = ev.isGreg 
        ? (calPerspective === 'gregorian' && ev.gMonth === (currentViewingGregMonth + 1))
        : (ev.month === currentViewingMonth);

      if (isEventInCurrentMonth) {
        monthEventsCount++;
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
      }
    });

    if (monthEventsCount === 0) {
      container.innerHTML = `<div style="text-align:center; padding:22px; color:var(--text-muted); font-size:13.5px;">لا توجد مناسبات في هذا الشهر</div>`;
    }

    // تحديث كرت المناسبة القادمة
    if (nextTitle && nextBadge && nextUpcomingEvent) {
      nextTitle.textContent = nextUpcomingEvent.name;
      nextBadge.textContent = nextUpcomingEvent.days === 0 ? 'اليوم' : `بعد ${nextUpcomingEvent.days} يوماً`;
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

    // 4. التبديل بين تبويبي (مواقيت الصلاة / الأعياد الإسلامية)
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
