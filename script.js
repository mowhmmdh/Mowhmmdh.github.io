function switchLang(lang) {
    // کلاس lang-fa یا lang-en را به تگ body اضافه یا حذف می کند
    document.body.className = ''; 
    document.body.classList.add('lang-' + lang);
    
    // جهت صفحه و تنظیمات اصلی سند را تغییر می دهد
    if (lang === 'fa') {
        document.documentElement.setAttribute('lang', 'fa');
        document.documentElement.setAttribute('dir', 'rtl');
    } else {
        document.documentElement.setAttribute('lang', 'en');
        document.documentElement.setAttribute('dir', 'ltr');
    }
}

// زبان پیشفرض را روی فارسی تنظیم می کند
document.addEventListener('DOMContentLoaded', () => {
    switchLang('fa');
});
