document.addEventListener('DOMContentLoaded', () => {
  const toggle = document.querySelector('.nav-toggle');
  const nav = document.querySelector('.navbar nav');
  if (toggle && nav) {
    const updateExpanded = () => {
      toggle.setAttribute('aria-expanded', nav.classList.contains('open'));
    };

    toggle.addEventListener('click', () => {
      nav.classList.toggle('open');
      updateExpanded();
    });

    nav.querySelectorAll('a').forEach(link => {
      link.addEventListener('click', () => {
        if (nav.classList.contains('open')) {
          nav.classList.remove('open');
          updateExpanded();
        }
      });
    });

    updateExpanded();
  }


});
