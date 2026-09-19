document.addEventListener('DOMContentLoaded', () => {

  // 1. فتح وإغلاق نافذة المشاركة السفلية (Bottom Sheet)
  const openShareBtn = document.getElementById('openShareBtn');
  const shareModalBackdrop = document.getElementById('shareModalBackdrop');
  const confirmShareBtn = document.getElementById('confirmShareBtn');

  openShareBtn.addEventListener('click', () => {
    shareModalBackdrop.classList.add('show');
  });

  shareModalBackdrop.addEventListener('click', (e) => {
    if (e.target === shareModalBackdrop) {
      shareModalBackdrop.classList.remove('show');
    }
  });

  confirmShareBtn.addEventListener('click', async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'الحياة الطيبة - تذكير بموعد الصلاة',
          text: 'صلاة العصر بتوقيت الرياض: 3:15 م (07 ربيع الثاني، 1448 هـ)',
          url: window.location.href,
        });
      } catch (err) {
        console.log('User cancelled share');
      }
    } else {
      alert('تم نسخ تفاصيل الصلاة لمشاركتها مع أحبابك!');
    }
    shareModalBackdrop.classList.remove('show');
  });

  // 2. العداد التنازلي التفاعلي المباشر (ينقص بالثواني)
  let remainingSeconds = (12 * 60) + 28;
  const countdownEl = document.getElementById('countdownTimer');

  setInterval(() => {
    if (remainingSeconds > 0) {
      remainingSeconds--;
      const minutes = Math.floor(remainingSeconds / 60);
      const seconds = remainingSeconds % 60;
      countdownEl.textContent = `${String(minutes).padStart(2, '0')} : ${String(seconds).padStart(2, '0')}`;
    }
  }, 1000);

  // 3. حفظ حالة الصلوات المنجزة في ذاكرة المتصفح (localStorage)
  const prayerCheckboxes = document.querySelectorAll('.prayer-check');
  const todayKey = 'alhayat_prayers_' + new Date().toISOString().slice(0, 10);

  // استرجاع الحالات المحفوظة
  const savedState = JSON.parse(localStorage.getItem(todayKey) || '{}');
  prayerCheckboxes.forEach((checkbox, idx) => {
    if (savedState[idx] !== undefined) {
      checkbox.checked = savedState[idx];
    }
    checkbox.addEventListener('change', () => {
      savedState[idx] = checkbox.checked;
      localStorage.setItem(todayKey, JSON.stringify(savedState));
    });
  });
  // تسجيل الـ Service Worker ليعمل التطبيق بدون إنترنت
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('./sw.js').catch(err => console.log('SW error:', err));
  }
});