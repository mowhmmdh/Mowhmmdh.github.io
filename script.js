function switchLang(lang) {
    // 1. حذف کلاس زبان قبلی و اضافه کردن کلاس زبان جدید به body
    document.body.className = 'lang-' + lang;

    // 2. تنظیم جهت‌گیری صفحه (rtl برای فارسی و ltr برای انگلیسی)
    document.documentElement.setAttribute('lang', lang);
    document.documentElement.setAttribute('dir', (lang === 'fa' ? 'rtl' : 'ltr'));

    // 3. **************** کد ایمن شده برای رفع خطا ****************
    // قبل از تغییر استایل، مطمئن می‌شویم دکمه‌ها وجود دارند
    const faBtn = document.getElementById('lang-fa-btn');
    const enBtn = document.getElementById('lang-en-btn');

    if (faBtn && enBtn) {
        faBtn.style.fontWeight = (lang === 'fa' ? 'bold' : 'normal');
        enBtn.style.fontWeight = (lang === 'en' ? 'bold' : 'normal');
    }
}

// تنظیم زبان پیشفرض روی فارسی هنگام بارگذاری صفحه
document.addEventListener('DOMContentLoaded', () => {
    switchLang('fa');
});
