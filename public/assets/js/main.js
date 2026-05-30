(function () {
  const nav = document.querySelector('.navbar');
  const navToggle = document.querySelector('.nav-toggle');
  if (nav && navToggle) {
    navToggle.addEventListener('click', () => {
      const open = nav.classList.toggle('open');
      navToggle.setAttribute('aria-expanded', String(open));
    });
  }

  const slider = document.querySelector('[data-stock-slider]');
  if (slider) {
    const slides = Array.from(slider.querySelectorAll('.stock-slide'));
    let index = 0;
    if (slides.length > 1) {
      setInterval(() => {
        slides[index].classList.remove('active');
        index = (index + 1) % slides.length;
        slides[index].classList.add('active');
      }, 4500);
    }
  }

  function galleryThumbs(gallery) {
    return Array.from(gallery.querySelectorAll('[data-photo]'));
  }

  function updateGalleryCounter(gallery, index) {
    const counter = gallery.querySelector('[data-gallery-counter]');
    const total = galleryThumbs(gallery).length;
    if (counter && total) counter.textContent = `${index + 1} / ${total}`;
  }

  function showGalleryPhoto(gallery, index) {
    const thumbs = galleryThumbs(gallery);
    if (!thumbs.length) return;
    const safeIndex = (index + thumbs.length) % thumbs.length;
    const button = thumbs[safeIndex];
    const src = button.getAttribute('data-photo');
    const mainPhoto = gallery.querySelector('[data-main-photo]');

    if (mainPhoto && src) mainPhoto.src = src;
    thumbs.forEach(t => t.classList.remove('active'));
    button.classList.add('active');
    gallery.dataset.currentIndex = String(safeIndex);
    updateGalleryCounter(gallery, safeIndex);
    button.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
  }

  function ensureGalleryControls(gallery) {
    const mainPhotoBox = gallery.querySelector('.main-photo');
    if (mainPhotoBox && !gallery.querySelector('.main-photo-wrap')) {
      const wrap = document.createElement('div');
      wrap.className = 'main-photo-wrap';
      mainPhotoBox.parentNode.insertBefore(wrap, mainPhotoBox);
      wrap.appendChild(mainPhotoBox);
    }

    const mainWrap = gallery.querySelector('.main-photo-wrap');
    if (mainWrap && !mainWrap.querySelector('[data-gallery-action="prev"]')) {
      mainWrap.insertAdjacentHTML('beforeend', `
        <button type="button" class="gallery-main-nav gallery-main-prev" data-gallery-action="prev" aria-label="Previous photo">‹</button>
        <button type="button" class="gallery-main-nav gallery-main-next" data-gallery-action="next" aria-label="Next photo">›</button>
        <span class="gallery-counter" data-gallery-counter></span>
      `);
    }

    const thumbRow = gallery.querySelector('[data-thumb-row]');
    if (thumbRow && !gallery.querySelector('.thumb-scroller')) {
      const scroller = document.createElement('div');
      scroller.className = 'thumb-scroller';
      scroller.setAttribute('aria-label', 'Vehicle photos');
      thumbRow.parentNode.insertBefore(scroller, thumbRow);
      scroller.innerHTML = '<button type="button" class="thumb-scroll" data-thumb-scroll="prev" aria-label="Scroll thumbnails left">‹</button>';
      scroller.appendChild(thumbRow);
      scroller.insertAdjacentHTML('beforeend', '<button type="button" class="thumb-scroll" data-thumb-scroll="next" aria-label="Scroll thumbnails right">›</button>');
    }
  }

  function setupGallery(gallery) {
    ensureGalleryControls(gallery);
    if (gallery.dataset.galleryReady === '1') return;
    gallery.dataset.galleryReady = '1';
    gallery.dataset.currentIndex = gallery.dataset.currentIndex || '0';

    gallery.addEventListener('click', event => {
      const photoButton = event.target.closest('[data-photo]');
      if (photoButton && gallery.contains(photoButton)) {
        const index = galleryThumbs(gallery).indexOf(photoButton);
        showGalleryPhoto(gallery, index);
        return;
      }

      const actionButton = event.target.closest('[data-gallery-action]');
      if (actionButton && gallery.contains(actionButton)) {
        const direction = actionButton.getAttribute('data-gallery-action') === 'prev' ? -1 : 1;
        const current = Number(gallery.dataset.currentIndex || 0);
        showGalleryPhoto(gallery, current + direction);
        return;
      }

      const scrollButton = event.target.closest('[data-thumb-scroll]');
      if (scrollButton && gallery.contains(scrollButton)) {
        const row = gallery.querySelector('[data-thumb-row]');
        if (!row) return;
        const direction = scrollButton.getAttribute('data-thumb-scroll') === 'prev' ? -1 : 1;
        row.scrollBy({ left: direction * Math.max(220, row.clientWidth * 0.75), behavior: 'smooth' });
      }
    });

    gallery.addEventListener('keydown', event => {
      if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return;
      const direction = event.key === 'ArrowLeft' ? -1 : 1;
      const current = Number(gallery.dataset.currentIndex || 0);
      showGalleryPhoto(gallery, current + direction);
    });

    showGalleryPhoto(gallery, Number(gallery.dataset.currentIndex || 0));
  }

  function imageExists(src) {
    return new Promise(resolve => {
      const img = new Image();
      img.onload = () => resolve(true);
      img.onerror = () => resolve(false);
      img.src = src;
    });
  }

  async function enhanceGallery(gallery) {
    setupGallery(gallery);
    const vrm = gallery.dataset.vrm;
    const expected = Number(gallery.dataset.expectedImageCount || 0);
    const thumbRow = gallery.querySelector('[data-thumb-row]');
    if (!vrm || !thumbRow) return;

    const existing = new Set(galleryThumbs(gallery).map(button => button.getAttribute('data-photo')));
    const extensions = ['jpg', 'jpeg', 'png', 'webp'];
    const pad = n => String(n).padStart(2, '0');
    const maxToCheck = Math.max(expected, existing.size, 40);

    for (let i = 1; i <= Math.min(maxToCheck, 60); i += 1) {
      const already = Array.from(existing).some(src => src.includes(`/vehicles/${vrm}/${pad(i)}.`));
      if (already) continue;

      for (const ext of extensions) {
        const src = `/assets/img/vehicles/${vrm}/${pad(i)}.${ext}`;
        // eslint-disable-next-line no-await-in-loop
        if (await imageExists(src)) {
          existing.add(src);
          const button = document.createElement('button');
          button.type = 'button';
          button.className = 'thumb';
          button.setAttribute('data-photo', src);
          button.innerHTML = `<img src="${src}" alt="${vrm} photo ${i}">`;
          thumbRow.appendChild(button);
          updateGalleryCounter(gallery, Number(gallery.dataset.currentIndex || 0));
          break;
        }
      }
    }
  }

  document.querySelectorAll('[data-gallery]').forEach(enhanceGallery);

  const cookieBanner = document.querySelector('[data-cookie-banner]');
  const cookieAccept = document.querySelector('[data-cookie-accept]');
  if (cookieBanner && !localStorage.getItem('cars25CookieOk')) cookieBanner.hidden = false;
  if (cookieAccept) cookieAccept.addEventListener('click', () => {
    localStorage.setItem('cars25CookieOk', '1');
    cookieBanner.hidden = true;
  });

  const stockGrid = document.getElementById('stockGrid');
  if (stockGrid) {
    const cards = Array.from(stockGrid.querySelectorAll('.vehicle-card, .vehicle-result-card'));
    const filters = {
      search: document.getElementById('stockSearch'),
      make: document.getElementById('makeFilter'),
      fuel: document.getElementById('fuelFilter'),
      body: document.getElementById('bodyFilter'),
      transmission: document.getElementById('transmissionFilter'),
      sort: document.getElementById('stockSort')
    };
    const count = document.getElementById('stockCount');
    const empty = document.getElementById('emptyState');
    const reset = document.getElementById('resetFilters');

    const normalise = value => String(value || '')
      .replace(/&amp;/g, '&')
      .toLowerCase()
      .normalize('NFKD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, ' ')
      .trim();

    const setSelectFromParam = (select, value) => {
      if (!select || !value) return;
      const target = normalise(value);
      const exact = Array.from(select.options).find(option => normalise(option.value) === target || normalise(option.textContent) === target);
      if (exact) select.value = exact.value;
    };

    const params = new URLSearchParams(window.location.search);
    if (params.get('search') && filters.search) filters.search.value = params.get('search');
    setSelectFromParam(filters.make, params.get('make'));
    setSelectFromParam(filters.fuel, params.get('fuel'));
    setSelectFromParam(filters.body, params.get('body'));
    setSelectFromParam(filters.transmission, params.get('transmission'));
    setSelectFromParam(filters.sort, params.get('sort'));

    const updateUrl = () => {
      const next = new URLSearchParams();
      if (filters.search?.value.trim()) next.set('search', filters.search.value.trim());
      if (filters.make?.value) next.set('make', filters.make.value);
      if (filters.fuel?.value) next.set('fuel', filters.fuel.value);
      if (filters.body?.value) next.set('body', filters.body.value);
      if (filters.transmission?.value) next.set('transmission', filters.transmission.value);
      if (filters.sort?.value && filters.sort.value !== 'price-desc') next.set('sort', filters.sort.value);
      const query = next.toString();
      const newUrl = `${window.location.pathname}${query ? `?${query}` : ''}`;
      history.replaceState({}, '', newUrl);
    };

    const apply = (shouldUpdateUrl = false) => {
      const q = normalise(filters.search?.value || '');
      const qTokens = q ? q.split(' ').filter(Boolean) : [];
      const make = normalise(filters.make?.value || '');
      const fuel = normalise(filters.fuel?.value || '');
      const body = normalise(filters.body?.value || '');
      const transmission = normalise(filters.transmission?.value || '');
      const sort = filters.sort?.value || 'price-desc';

      cards.sort((a, b) => {
        const ap = Number(a.dataset.price || 0);
        const bp = Number(b.dataset.price || 0);
        const am = Number(a.dataset.mileage || 0);
        const bm = Number(b.dataset.mileage || 0);
        const ay = Number(a.dataset.year || 0);
        const by = Number(b.dataset.year || 0);
        if (sort === 'price-asc') return ap - bp;
        if (sort === 'mileage-asc') return am - bm;
        if (sort === 'year-desc') return by - ay;
        return bp - ap;
      }).forEach(card => stockGrid.appendChild(card));

      let visible = 0;
      cards.forEach(card => {
        const title = normalise(card.dataset.title || card.textContent || '');
        const matchSearch = !qTokens.length || qTokens.every(token => title.includes(token));
        const match = matchSearch &&
          (!make || normalise(card.dataset.make) === make) &&
          (!fuel || normalise(card.dataset.fuel) === fuel) &&
          (!body || normalise(card.dataset.body) === body) &&
          (!transmission || normalise(card.dataset.transmission) === transmission);

        card.hidden = !match;
        card.classList.toggle('is-filtered-out', !match);
        card.setAttribute('aria-hidden', match ? 'false' : 'true');
        if (match) visible += 1;
      });

      if (count) count.textContent = visible;
      if (empty) empty.hidden = visible !== 0;
      if (shouldUpdateUrl) updateUrl();
    };

    Object.entries(filters).forEach(([name, input]) => {
      if (!input) return;
      const eventName = name === 'search' ? 'input' : 'change';
      input.addEventListener(eventName, () => apply(true));
    });

    if (reset) reset.addEventListener('click', () => {
      Object.entries(filters).forEach(([name, input]) => {
        if (!input) return;
        input.value = name === 'sort' ? 'price-desc' : '';
      });
      apply(true);
    });

    apply(false);
  }

  function attachForm(form) {
    const status = form.querySelector('.form-status');
    const setStatus = (message, type) => {
      if (!status) return;
      status.textContent = message;
      status.className = `form-status ${type || ''}`.trim();
    };

    const submit = () => {
      setStatus('Sending enquiry...', '');
      const payload = Object.fromEntries(new FormData(form).entries());
      fetch(form.getAttribute('action') || '/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })
        .then(async response => {
          const data = await response.json().catch(() => ({}));
          if (!response.ok || data.ok === false) throw new Error(data.message || 'Unable to send enquiry.');
          form.reset();
          setStatus('Thanks. Your enquiry has been sent to Cars25.', 'success');
        })
        .catch(error => {
          setStatus(error.message || 'There was a problem sending the enquiry. Please call Cars25.', 'error');
        });
    };

    if (window.jQuery && window.jQuery.fn.validate) {
      window.jQuery(form).validate({
        rules: {
          name: { required: true, minlength: 2 },
          phone: { required: true, minlength: 8 },
          email: { email: true },
          message: { required: true, minlength: 10 }
        },
        messages: {
          name: 'Please enter your name.',
          phone: 'Please enter a valid phone number.',
          email: 'Please enter a valid email address.',
          message: 'Please enter your enquiry.'
        },
        submitHandler: function () { submit(); return false; }
      });
    } else {
      form.addEventListener('submit', event => {
        event.preventDefault();
        if (!form.checkValidity()) {
          form.reportValidity();
          return;
        }
        submit();
      });
    }
  }

  document.querySelectorAll('.contact-form').forEach(attachForm);
})();
