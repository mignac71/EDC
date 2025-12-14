// Load CMS-managed content for the public site
(function () {
  const CONTENT_URL = 'api/cms-save.php';

  function applyHeroCopy(hero) {
    if (!hero) return;
    const titleEl = document.querySelector('.hero h1');
    const subtitleEl = document.querySelector('.hero p');
    if (titleEl && hero.title) {
      titleEl.textContent = hero.title;
    }
    if (subtitleEl && hero.subtitle) {
      subtitleEl.textContent = hero.subtitle;
    }
  }

  function buildNewsItem(item) {
    const article = document.createElement('article');
    article.className = 'news-item';

    const gallery = Array.isArray(item.gallery) ? item.gallery.filter(Boolean) : [];
    const hasSlideshow = gallery.length > 1;
    const mainImage = item.image || gallery[0];

    if (hasSlideshow) {
      const slideshow = document.createElement('div');
      slideshow.className = 'slideshow';
      gallery.forEach((src) => {
        const img = document.createElement('img');
        img.src = src;
        slideshow.appendChild(img);
      });
      article.appendChild(slideshow);
    } else if (mainImage) {
      const img = document.createElement('img');
      img.src = mainImage;
      img.alt = item.alt || item.title || 'News image';
      article.appendChild(img);
    }

    if (item.title) {
      const heading = document.createElement('h3');
      heading.textContent = item.title;
      article.appendChild(heading);
    }

    if (item.date) {
      const time = document.createElement('time');
      time.dateTime = item.date;
      time.textContent = new Date(item.date).toLocaleDateString(undefined, {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
      article.appendChild(time);
    }

    if (item.summary) {
      const summary = document.createElement('p');
      summary.textContent = item.summary;
      article.appendChild(summary);
    }

    return article;
  }

  function renderNews(newsItems) {
    const container = document.getElementById('news-grid');
    if (!container) return; // May be on a page without news

    // Filter out hidden items
    const visibleItems = newsItems.filter(item => item.visible !== false);

    if (visibleItems.length === 0) {
      container.innerHTML = '<p>No news at the moment.</p>';
      return;
    }

    container.innerHTML = ''; // Clear existing content
    visibleItems.forEach((item) => {
      container.appendChild(buildNewsItem(item));
    });

    const refreshEvent = new Event('slideshows:refresh');
    document.dispatchEvent(refreshEvent);
  }

  async function loadContent() {
    try {
      const response = await fetch(CONTENT_URL, { cache: 'no-cache' });
      if (!response.ok) return;
      const data = await response.json();
      applyHeroCopy(data.hero);
      if (data.mission) applyMissionCopy(data.mission);
      if (data.presidium) applyPresidiumCopy(data.presidium);
      renderNews(data.news);
    } catch (err) {
      console.error('Unable to load CMS content', err);
    }
  }

  function applyMissionCopy(mission) {
    if (!mission) return;
    const titleEl = document.querySelector('.mission h2');
    const leadEl = document.querySelector('.mission .lead');
    if (titleEl && mission.title) {
      titleEl.textContent = mission.title;
      // Also update i18n text content to avoid overwrite race conditions if any
      titleEl.removeAttribute('data-i18n');
    }
    if (leadEl && mission.lead) {
      leadEl.textContent = mission.lead;
      leadEl.removeAttribute('data-i18n');
    }
  }

  function applyPresidiumCopy(presidium) {
    // Future implementation if specific fields are editable
  }

  document.addEventListener('DOMContentLoaded', loadContent);
})();
