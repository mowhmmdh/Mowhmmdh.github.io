function switchLang(lang) {
    // 1. حذف کلاس زبان قبلی و اضافه کردن کلاس زبان جدید به body
    document.body.className = 'lang-' + lang;

    // 2. تنظیم جهت‌گیری صفحه (rtl برای فارسی و ltr برای انگلیسی)
    if (lang === 'fa') {
        document.documentElement.setAttribute('lang', 'fa');
        document.documentElement.setAttribute('dir', 'rtl');
    } else {
        document.documentElement.setAttribute('lang', 'en');
        document.documentElement.setAttribute('dir', 'ltr');
    }
    
    // 3. فعال کردن دکمه‌های سوئیچر (اختیاری: برای نشان دادن دکمه فعال)
    document.getElementById('lang-fa-btn').style.fontWeight = (lang === 'fa' ? 'bold' : 'normal');
    document.getElementById('lang-en-btn').style.fontWeight = (lang === 'en' ? 'bold' : 'normal');
}

// تنظیم زبان پیشفرض روی فارسی هنگام بارگذاری صفحه
// ما از DOMContentLoaded استفاده می‌کنیم چون حالا مطمئنیم که JS اجرا می‌شود
document.addEventListener('DOMContentLoaded', () => {
    switchLang('fa');
});
