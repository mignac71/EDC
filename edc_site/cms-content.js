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
    if (hero.image) {
      const heroSection = document.querySelector('.hero');
      if (heroSection) heroSection.style.backgroundImage = `url('${hero.image}')`;
    }
  }

  function buildNewsItem(item) {
    const article = document.createElement('article');
    article.className = 'news-item';

    // Fix: Show only single image (Main or First form gallery)
    const mainImage = item.image || (Array.isArray(item.gallery) && item.gallery.length > 0 ? item.gallery[0] : null);

    if (mainImage) {
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
      if (data.mission) {
        applyMissionCopy(data.mission);
        if (data.mission.cards) applyMissionCards(data.mission.cards);
      }
      // Pass the whole data object to specific render functions
      if (Array.isArray(data.presidium)) renderPresidium(data.presidium);
      if (Array.isArray(data.partners)) renderPartners(data.partners);
      if (data.contact) renderContact(data.contact);
      if (Array.isArray(data.news)) renderNews(data.news);
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
      titleEl.removeAttribute('data-i18n');
    }
    if (leadEl && mission.lead) {
      leadEl.textContent = mission.lead;
      leadEl.removeAttribute('data-i18n');
    }
  }

  function applyMissionCards(cards) {
    const container = document.getElementById('mission-cards-container');
    if (!container) return;

    // Support both Array (New) and Object (Legacy)
    let cardsArray = [];
    if (Array.isArray(cards)) {
      cardsArray = cards;
    } else if (cards && typeof cards === 'object') {
      Object.keys(cards).forEach(key => cardsArray.push(cards[key]));
    }

    container.innerHTML = '';
    cardsArray.forEach(card => {
      const div = document.createElement('div');
      div.className = 'card';
      div.innerHTML = `<h3>${card.title || ''}</h3><p>${card.text || ''}</p>`;
      container.appendChild(div);
    });
  }

  function renderPresidium(members) {
    if (!members || members.length === 0) return;
    const grid = document.querySelector('.presidium .team-grid');
    if (!grid) return;

    grid.innerHTML = '';
    members.forEach(m => {
      const div = document.createElement('div');
      div.className = 'team-member';
      div.innerHTML = `
          <img src="${m.image}" alt="${m.name}">
          <h3>${m.name}</h3>
          <p class="role">${m.role}</p>
          <p class="country">${m.country}</p>
        `;
      grid.appendChild(div);
    });
  }

  function renderPartners(partners) {
    if (!partners || partners.length === 0) return;
    const grid = document.querySelector('.partners-grid');
    if (!grid) return;

    grid.innerHTML = '';
    partners.forEach(url => {
      const img = document.createElement('img');
      img.src = url;
      grid.appendChild(img);
    });
  }

  function renderContact(contact) {
    if (!contact) return;
    const footer = document.querySelector('footer#contact .container');
    if (!footer) return;

    // We can't easily target paragraphs without classes, so I'll try to find them or rewrite innerHTML of specific parts.
    // Index.html has structure:
    // <p><strong>European Dealer Council ...</strong></p>
    // <p>Address</p>
    // <p>Phone</p>
    // <p>Email</p>

    // Let's try to update by content or structure if stable.
    const ps = footer.querySelectorAll('p');
    if (ps.length >= 4) {
      if (contact.name) ps[0].innerHTML = `<strong>${contact.name}</strong>`;
      if (contact.address) ps[1].textContent = contact.address;
      if (contact.phone) ps[2].querySelector('a').textContent = contact.phone;
      if (contact.phone) ps[2].querySelector('a').href = `tel:${contact.phone.replace(/[^0-9+]/g, '')}`;
      if (contact.email) ps[3].querySelector('a').textContent = contact.email;
      if (contact.email) ps[3].querySelector('a').href = `mailto:${contact.email}`;
    }
  }

  document.addEventListener('DOMContentLoaded', loadContent);
})();
