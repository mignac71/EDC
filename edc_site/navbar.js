document.addEventListener('DOMContentLoaded', () => {
  const toggle = document.querySelector('.nav-toggle');
  const nav = document.querySelector('.navbar nav');
  if (toggle && nav) {
    toggle.addEventListener('click', () => {
      nav.classList.toggle('open');
    });
  }

  const langSelect = document.getElementById('language-select');
  if (langSelect) {
    const params = new URLSearchParams(window.location.search);
    const currentLang = params.get('lang') || 'en';
    langSelect.value = currentLang;
    document.documentElement.lang = currentLang;

    if (typeof applyTranslations === 'function') {
      applyTranslations(currentLang);
    }

    document.querySelectorAll('a[href]').forEach(link => {
      const href = link.getAttribute('href');
      if (href.startsWith('#') || href.startsWith('mailto:') || href.startsWith('tel:') || href.startsWith('http')) {
        return;
      }
      const url = new URL(href, window.location.href);
      url.searchParams.set('lang', currentLang);
      link.setAttribute('href', url.pathname + url.search + url.hash);
    });

    langSelect.addEventListener('change', (e) => {
      const lang = e.target.value;
      const url = new URL(window.location.href);
      url.searchParams.set('lang', lang);
      window.location.href = url.toString();
    });
  }
});
