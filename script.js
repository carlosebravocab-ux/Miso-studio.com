document.addEventListener('DOMContentLoaded', () => {
  document.addEventListener('click', (event) => {
    const target = event.target;
    if (!(target instanceof Element)) return;
    const whatsappLink = target.closest('a[data-whatsapp-link][data-whatsapp-app]');
    if (!(whatsappLink instanceof HTMLAnchorElement)) return;

    event.preventDefault();
    let appHandoffStarted = false;
    const markAppHandoff = () => {
      appHandoffStarted = true;
    };
    const clearHandoffListeners = () => {
      window.removeEventListener('blur', markAppHandoff);
      window.removeEventListener('pagehide', markAppHandoff);
      document.removeEventListener('visibilitychange', markAppHandoff);
    };

    window.addEventListener('blur', markAppHandoff, { once: true });
    window.addEventListener('pagehide', markAppHandoff, { once: true });
    document.addEventListener('visibilitychange', markAppHandoff, { once: true });
    window.location.href = whatsappLink.dataset.whatsappApp;
    window.setTimeout(() => {
      clearHandoffListeners();
      if (!appHandoffStarted && document.visibilityState === 'visible') {
        window.location.href = whatsappLink.href;
      }
    }, 1500);
  });

  const header = document.getElementById('siteHeader');
  const searchButton = document.getElementById('searchButton');
  const searchModal = document.getElementById('searchModal');
  const closeSearch = document.getElementById('closeSearch');
  const heroNameInput = document.getElementById('heroNameInput');
  const heroNamePreview = document.getElementById('heroNamePreview');
  const cookieBanner = document.getElementById('cookieBanner');
  const cookieButtons = document.querySelectorAll('[data-cookie]');
  const cookiePreferencesPanel = document.getElementById('cookiePreferencesPanel');
  const analyticsConsent = document.getElementById('analyticsConsent');
  const personalizationConsent = document.getElementById('personalizationConsent');
  const themeSelect = document.getElementById('themeSelect');
  const productGrid = document.getElementById('productGrid');
  const productDetail = document.getElementById('productDetail');
  const resultCount = document.getElementById('resultCount');
  const filterButtons = document.querySelectorAll('.filter-chip');
  const sortButton = document.getElementById('sortButton');
  const searchInput = document.getElementById('searchInput');
  const searchSuggestions = document.querySelectorAll('.search-suggestions button');
  const cartButton = document.getElementById('cartButton');
  const cartDrawer = document.getElementById('cartDrawer');
  const closeCart = document.getElementById('closeCart');
  const checkoutButton = document.getElementById('checkoutButton');
  const cartItems = document.getElementById('cartItems');
  const cartSubtotal = document.getElementById('cartSubtotal');
  const cartCount = document.getElementById('cartCount');
  const checkoutDrawer = document.getElementById('checkoutDrawer');
  const closeCheckout = document.getElementById('closeCheckout');
  const checkoutForm = document.getElementById('checkoutForm');
  const checkoutItems = document.getElementById('checkoutItems');
  const checkoutShipping = document.getElementById('checkoutShipping');
  const checkoutDiscount = document.getElementById('checkoutDiscount');
  const checkoutTotal = document.getElementById('checkoutTotal');
  const applyCoupon = document.getElementById('applyCoupon');
  const couponInput = document.getElementById('couponInput');
  const couponStatus = document.getElementById('couponStatus');
  const postalCodeInput = document.getElementById('postalCode');
  const shippingZoneInput = document.getElementById('shippingZone');
  const averageRating = document.getElementById('averageRating');
  const ratingSummary = document.getElementById('ratingSummary');
  const ratingNote = document.getElementById('ratingNote');
  const ratingButtons = document.querySelectorAll('[data-rating]');

  const themePreferences = new Set(['auto', 'light', 'dark']);
  const darkModeQuery = typeof window.matchMedia === 'function'
    ? window.matchMedia('(prefers-color-scheme: dark)')
    : null;
  let themePreference = document.documentElement.dataset.themePreference || 'auto';
  const applyThemePreference = (preference) => {
    themePreference = preference;
    document.documentElement.dataset.themePreference = preference;
    document.documentElement.dataset.theme = preference === 'auto'
      ? (darkModeQuery && darkModeQuery.matches ? 'dark' : 'light')
      : preference;
    if (themeSelect) themeSelect.value = preference;
  };

  if (themeSelect) {
    applyThemePreference(themePreference);
    themeSelect.addEventListener('change', () => {
      const nextPreference = themeSelect.value;
      if (!themePreferences.has(nextPreference)) {
        console.error(`Preferencia de tema no válida: ${nextPreference}`);
        return;
      }

      applyThemePreference(nextPreference);
      try {
        window.localStorage.setItem('nova-theme', nextPreference);
      } catch (error) {
        console.warn('No se pudo guardar la preferencia del tema en este dispositivo.', error);
      }
    });
  }

  if (darkModeQuery) {
    const updateAutomaticTheme = () => {
      if (themePreference === 'auto') applyThemePreference('auto');
    };
    if (typeof darkModeQuery.addEventListener === 'function') {
      darkModeQuery.addEventListener('change', updateAutomaticTheme);
    } else if (typeof darkModeQuery.addListener === 'function') {
      darkModeQuery.addListener(updateAutomaticTheme);
    }
  }

  const ratingStorageKey = 'miso-local-rating-v1';
  let ratingStorageAvailable = true;
  const loadLocalRating = () => {
    try {
      const storage = globalThis.localStorage;
      if (!storage) {
        ratingStorageAvailable = false;
        return 0;
      }
      const savedRating = Number(storage.getItem(ratingStorageKey));
      return Number.isInteger(savedRating) && savedRating >= 1 && savedRating <= 5
        ? savedRating
        : 0;
    } catch (error) {
      ratingStorageAvailable = false;
      console.warn('No se pudo leer la calificación en este dispositivo.', error);
      return 0;
    }
  };
  const saveLocalRating = (rating) => {
    try {
      const storage = globalThis.localStorage;
      if (!storage) {
        ratingStorageAvailable = false;
        return;
      }
      storage.setItem(ratingStorageKey, String(rating));
    } catch (error) {
      ratingStorageAvailable = false;
      console.warn('No se pudo guardar la calificación en este dispositivo.', error);
    }
  };
  const renderLocalRating = (rating) => {
    if (averageRating) {
      averageRating.textContent = `${rating}/5`;
    }
    if (ratingSummary) {
      ratingSummary.textContent = rating === 0
        ? 'Sé la primera persona en calificar.'
        : 'Calificación local · 1 voto';
    }
    if (ratingNote) {
      ratingNote.textContent = ratingStorageAvailable
        ? 'Una calificación por navegador; puedes cambiarla.'
        : 'No se pudo guardar la calificación en este navegador.';
    }
    ratingButtons.forEach((button) => {
      const value = Number(button.dataset.rating);
      button.textContent = value <= rating ? '★' : '☆';
      button.setAttribute('aria-pressed', String(value === rating));
    });
  };
  let localRating = loadLocalRating();
  renderLocalRating(localRating);
  ratingButtons.forEach((button) => {
    button.addEventListener('click', () => {
      const value = Number(button.dataset.rating);
      if (!Number.isInteger(value) || value < 1 || value > 5) {
        console.error(`Calificación no válida: ${button.dataset.rating}`);
        return;
      }

      localRating = value;
      saveLocalRating(localRating);
      renderLocalRating(localRating);
    });
  });

  const products = [
    {
      id: 'camisa-core',
      category: 'camisas',
      name: 'Camisa Core',
      label: 'Camisas',
      price: 580,
      originalPrice: 680,
      tag: 'Best seller',
      description: 'Algodón premium con corte unisex y acabado suave para regalos y equipos.',
      keywords: ['camisa', 'playera', 'camiseta', 'regalo', 'equipo'],
      sizes: ['XS', 'S', 'M', 'L', 'XL', 'XXL'],
      colors: ['#d9c6b3', '#3d4f4d', '#1d1a1a', '#a65e4b', '#f1e8dc', '#526a8a'],
      features: ['Corte unisex', 'Tejido premium 185 gr', 'Impresión con alta definición']
    },
    {
      id: 'taza-ritmo',
      category: 'tazas',
      name: 'Taza Ritmo',
      label: 'Tazas',
      price: 399,
      originalPrice: 490,
      tag: 'Popular',
      description: 'Cerámica esmaltada de 11 oz para fotos, mensajes personalizados y branding.',
      keywords: ['taza', 'mug', 'regalo', 'personalizada'],
      sizes: ['11 oz', '15 oz'],
      colors: ['#f3e9df', '#d7b28b', '#72947d', '#c97868', '#607b91', '#343b3c'],
      features: ['Perfecta para foto o logo', 'Cerámica esmaltada', 'Regalo listo para entregar']
    },
    {
      id: 'vaso-sky',
      category: 'vasos',
      name: 'Vaso Sky',
      label: 'Vasos',
      price: 550,
      originalPrice: 650,
      tag: 'Premium',
      description: 'Termo de doble pared ideal para cafés, eventos y merch corporativo.',
      keywords: ['vaso', 'termo', 'tumbler', 'empresa', 'evento'],
      sizes: ['350 ml', '500 ml'],
      colors: ['#d3b494', '#3e4d5f', '#17191a', '#a65e4b', '#d7ded8', '#79918d'],
      features: ['Doble pared', 'Acero inoxidable', 'Sin fugas']
    },
    {
      id: 'camisa-boda',
      category: 'camisas',
      name: 'Camisa Boda',
      label: 'Camisas',
      price: 620,
      originalPrice: 760,
      tag: 'Evento',
      description: 'Perfecta para bodas, eventos familiares y regalos con detalle emocional.',
      keywords: ['camisa', 'boda', 'evento', 'familia', 'regalo'],
      sizes: ['XS', 'S', 'M', 'L', 'XL'],
      colors: ['#d4c0ac', '#f1f1ef', '#5c4f4a', '#a65e4b', '#81918b', '#526a8a'],
      features: ['Diseño elegante', 'Hecho para eventos', 'Entrega rápida']
    },
    {
      id: 'taza-familia',
      category: 'tazas',
      name: 'Taza Familia',
      label: 'Tazas',
      price: 430,
      originalPrice: 520,
      tag: 'Nuevo',
      description: 'Ideal para aniversarios, recuerdos familiares y mensajes con personalidad.',
      keywords: ['taza', 'familia', 'cumpleaños', 'recordatorio', 'personalizada'],
      sizes: ['11 oz', '15 oz'],
      colors: ['#f8e9d9', '#b38a62', '#838f7f', '#c97868', '#667f92', '#383b3c'],
      features: ['Gran detalle', 'Fácil de personalizar', 'Acabado premium']
    },
    {
      id: 'vaso-team',
      category: 'vasos',
      name: 'Vaso Team',
      label: 'Vasos',
      price: 610,
      originalPrice: 720,
      tag: 'Equipo',
      description: 'Opción premium para staff, equipos y promociones con logo o frase.',
      keywords: ['vaso', 'equipo', 'empresa', 'merch', 'staff'],
      sizes: ['350 ml', '500 ml'],
      colors: ['#ceb38a', '#324d52', '#dddfdc', '#9c604e', '#687b91', '#343638'],
      features: ['Merch confiable', 'Diseño corporativo', 'Aislante térmico']
    }
  ];

  const state = {
    category: 'all',
    query: '',
    sortOrder: 'featured',
    selectedId: products[0].id,
    cart: [],
    couponCode: '',
    shippingMethod: 'domicilio',
    variantSelections: {},
    customizations: {}
  };

  const sortModes = [
    { value: 'featured', label: 'Destacados' },
    { value: 'price-asc', label: 'Precio menor a mayor' },
    { value: 'price-desc', label: 'Precio mayor a menor' }
  ];

  const formatMoney = (value) => `$${value.toLocaleString('es-MX')} MXN`;
  const getContrastingPrintColor = (backgroundColor) => {
    const hex = backgroundColor.replace('#', '');
    const channels = [0, 2, 4].map((offset) => parseInt(hex.slice(offset, offset + 2), 16));
    const luminance = (channels[0] * 0.299) + (channels[1] * 0.587) + (channels[2] * 0.114);
    return luminance > 160 ? '#643b25' : '#fffaf4';
  };
  const escapeHTML = (value) => String(value).replace(/[&<>"']/g, (character) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;'
  })[character]);
  const getPrintScale = (text) => Math.max(0.82, 1 - Math.max(0, text.length - 12) * 0.012);

  const getCustomizationForProduct = (productId) => {
    const product = getProductById(productId);
    if (!product) {
      return { text: 'Tu diseño', placement: 'Centro', accent: '#8a5b3d', saved: false };
    }

    const existing = state.customizations[productId] || {};
    const defaultText = product.category === 'camisas'
      ? 'Mara & Leo'
      : product.category === 'tazas'
        ? 'Gracias por todo'
        : 'Tu marca';
    const productColor = state.variantSelections[productId]?.color || product.colors[0];

    return {
      text: existing.text === undefined ? defaultText : existing.text,
      placement: existing.placement || 'Centro',
      accent: existing.accentChosen
        ? existing.accent
        : getContrastingPrintColor(productColor),
      accentChosen: Boolean(existing.accentChosen),
      saved: Boolean(existing.saved)
    };
  };

  const shippingRates = {
    express: 240
  };
  const freeShippingThreshold = 1200;

  const shippingZones = [
    { name: 'Centro', pattern: /^0[1-4]|^0[6-9]|^1[0-9]|^2[0-9]|^3[0-9]/, fee: 120 },
    { name: 'Norte', pattern: /^4[0-9]|^5[0-9]|^6[0-9]/, fee: 180 },
    { name: 'Sur', pattern: /^7[0-9]|^8[0-9]|^9[0-9]/, fee: 220 },
    { name: 'Internacional', pattern: /^\d{5}$/, fee: 320 }
  ];

  const couponRules = {
    MISO10: 0.1,
    NOVA10: 0.1,
    BODA25: 0.25,
    ENVIOFREE: 0
  };

  const printColors = ['#643b25', '#fffaf4', '#1d1a1a', '#a65e4b', '#d9a85d', '#526a8a'];
  let productArtRenderId = 0;

  const getProductById = (id) => products.find((product) => product.id === id);

  const getSelectionForProduct = (productId) => {
    const product = getProductById(productId);
    if (!product) return { size: '', color: '' };

    const existing = state.variantSelections[productId] || {};
    return {
      size: existing.size || product.sizes[0],
      color: existing.color || product.colors[0]
    };
  };

  const getCartCustomization = (item) => (
    item.customization || getCustomizationForProduct(item.id)
  );
  const getCartItemDetails = (item) => {
    const customization = getCartCustomization(item);
    const designText = customization.text.trim() || 'Sin texto';
    return `${item.label} · ${item.size} · ${item.colorName} · Diseño: ${escapeHTML(designText)} · ${escapeHTML(customization.placement)}`;
  };

  const renderProductArt = (product, selection, customization) => {
    const artType = {
      camisas: 'shirt',
      tazas: 'mug',
      vasos: 'tumbler'
    }[product.category] || 'shirt';
    const selectedColor = selection.color || product.colors[0];
    const customText = customization.text.trim() || 'Tu diseño';
    const printScale = getPrintScale(customText);
    const illustrationId = `nova-product-art-${++productArtRenderId}`;

    const illustrations = {
      shirt: `
        <svg class="art-illustration" viewBox="0 0 260 290" aria-hidden="true">
          <defs>
            <linearGradient id="${illustrationId}-fabric" x1="0" y1="0" x2="1" y2="0.8">
              <stop offset="0" stop-color="color-mix(in srgb, var(--product-color), white 22%)" />
              <stop offset="0.42" stop-color="var(--product-color)" />
              <stop offset="1" stop-color="color-mix(in srgb, var(--product-color), #372920 18%)" />
            </linearGradient>
            <linearGradient id="${illustrationId}-shine" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0" stop-color="white" stop-opacity=".42" />
              <stop offset=".42" stop-color="white" stop-opacity=".02" />
              <stop offset="1" stop-color="#372920" stop-opacity=".1" />
            </linearGradient>
          </defs>
          <path
            d="M82 34 111 22Q130 43 149 22L178 34 222 68 199 105 179 91 179 253Q130 268 81 253L81 91 61 105 38 68Z"
            fill="url(#${illustrationId}-fabric)"
            stroke="#49382d"
            stroke-opacity=".16"
            stroke-width="1.5"
            stroke-linejoin="round"
          />
          <path d="M82 34 111 22Q130 43 149 22L178 34 222 68 199 105 179 91 179 253Q130 268 81 253L81 91 61 105 38 68Z" fill="url(#${illustrationId}-shine)" />
          <path d="M111 23Q130 48 149 23" fill="none" stroke="#49382d" stroke-opacity=".28" stroke-width="2.5" />
          <path d="M81 91 99 100M179 91 161 100M88 245Q130 258 172 245" fill="none" stroke="#49382d" stroke-opacity=".2" stroke-width="1.5" />
          <path d="M61 105 78 96M199 105 182 96" fill="none" stroke="white" stroke-opacity=".45" stroke-width="2" />
          <path d="M93 112V236M167 112V236" fill="none" stroke="white" stroke-opacity=".13" stroke-width="1" />
        </svg>
      `,
      mug: `
        <svg class="art-illustration" viewBox="0 0 240 250" aria-hidden="true">
          <defs>
            <linearGradient id="${illustrationId}-ceramic" x1="0" y1="0" x2="1" y2=".2">
              <stop offset="0" stop-color="color-mix(in srgb, var(--product-color), #5a4536 22%)" />
              <stop offset=".2" stop-color="color-mix(in srgb, var(--product-color), white 28%)" />
              <stop offset=".68" stop-color="var(--product-color)" />
              <stop offset="1" stop-color="color-mix(in srgb, var(--product-color), #5a4536 25%)" />
            </linearGradient>
            <linearGradient id="${illustrationId}-handle" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0" stop-color="color-mix(in srgb, var(--product-color), #5a4536 35%)" />
              <stop offset=".45" stop-color="color-mix(in srgb, var(--product-color), white 18%)" />
              <stop offset="1" stop-color="color-mix(in srgb, var(--product-color), #5a4536 30%)" />
            </linearGradient>
          </defs>
          <path d="M174 81H194Q220 81 218 112L215 159Q213 188 187 186H173" fill="none" stroke="#49382d" stroke-opacity=".14" stroke-width="28" stroke-linecap="round" />
          <path d="M174 81H194Q220 81 218 112L215 159Q213 188 187 186H173" fill="none" stroke="url(#${illustrationId}-handle)" stroke-width="21" stroke-linecap="round" />
          <path d="M58 48H174Q181 48 181 58L173 208Q172 222 158 224H77Q63 222 62 208L52 58Q51 48 58 48Z" fill="url(#${illustrationId}-ceramic)" stroke="#49382d" stroke-opacity=".16" stroke-width="1.5" />
          <ellipse cx="116.5" cy="52" rx="63" ry="9" fill="#fffaf4" fill-opacity=".92" />
          <ellipse cx="116.5" cy="54" rx="54" ry="5" fill="#d6c9bc" fill-opacity=".38" />
          <path d="M67 71 74 194Q75 207 84 212" fill="none" stroke="white" stroke-opacity=".52" stroke-width="4" stroke-linecap="round" />
          <path d="M163 72 157 199" fill="none" stroke="#49382d" stroke-opacity=".1" stroke-width="2" />
          <path d="M71 218Q116 231 164 218" fill="none" stroke="white" stroke-opacity=".34" stroke-width="2" />
        </svg>
      `,
      tumbler: `
        <svg class="art-illustration" viewBox="0 0 180 300" aria-hidden="true">
          <defs>
            <linearGradient id="${illustrationId}-steel" x1="0" y1="0" x2="1" y2=".2">
              <stop offset="0" stop-color="color-mix(in srgb, var(--product-color), #372920 24%)" />
              <stop offset=".18" stop-color="color-mix(in srgb, var(--product-color), white 25%)" />
              <stop offset=".48" stop-color="var(--product-color)" />
              <stop offset=".76" stop-color="color-mix(in srgb, var(--product-color), white 10%)" />
              <stop offset="1" stop-color="color-mix(in srgb, var(--product-color), #372920 28%)" />
            </linearGradient>
            <linearGradient id="${illustrationId}-lid" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stop-color="#68635e" />
              <stop offset="1" stop-color="#252321" />
            </linearGradient>
          </defs>
          <path d="M50 54H130L119 256Q118 267 107 270H73Q62 267 61 256Z" fill="url(#${illustrationId}-steel)" stroke="#372920" stroke-opacity=".2" stroke-width="1.5" />
          <path d="M61 82 69 246Q70 255 76 258" fill="none" stroke="white" stroke-opacity=".45" stroke-width="4" stroke-linecap="round" />
          <path d="M121 82 111 254" fill="none" stroke="#372920" stroke-opacity=".12" stroke-width="2" />
          <path d="M48 51Q48 43 56 43H124Q132 43 132 51V64H48Z" fill="url(#${illustrationId}-lid)" />
          <path d="M52 48H128" stroke="#fffaf4" stroke-opacity=".38" stroke-width="2" />
          <path d="M84 43V13Q84 8 90 8Q96 8 96 13V43" fill="none" stroke="#282624" stroke-width="5" stroke-linecap="round" />
          <path d="M87 16V40" stroke="#fffaf4" stroke-opacity=".52" stroke-width="1.5" stroke-linecap="round" />
          <path d="M65 263Q90 270 115 263" fill="none" stroke="#372920" stroke-opacity=".22" stroke-width="2" />
        </svg>
      `
    };

    return `
      <div
        class="product-art product-art--${artType}"
        style="--product-color:${selectedColor};--print-color:${customization.accent};--print-scale:${printScale};"
        data-placement="${escapeHTML(customization.placement)}"
      >
        ${illustrations[artType]}
        <span class="art-print">${escapeHTML(customText)}</span>
      </div>
    `;
  };

  const fitProductArtPrint = (container) => {
    if (!(container instanceof HTMLElement)) return;

    const productArts = container.matches('.product-art')
      ? [container]
      : Array.from(container.querySelectorAll('.product-art'));

    productArts.forEach((art) => {
      const print = art.querySelector('.art-print');
      if (!print || print.getClientRects().length === 0) return;

      let scale = Number(art.style.getPropertyValue('--print-scale')) || 1;
      let attempts = 0;
      while (print.scrollHeight > print.clientHeight && scale > 0.45 && attempts < 12) {
        scale = Math.max(0.45, scale * 0.92);
        art.style.setProperty('--print-scale', scale.toFixed(3));
        attempts += 1;
      }
    });
  };

  const getShippingZoneByPostalCode = (postalCode) => {
    const cleanCode = `${postalCode || ''}`.trim();
    if (!/^\d{5}$/.test(cleanCode)) {
      return null;
    }

    return shippingZones.find((zone) => zone.pattern.test(cleanCode)) || null;
  };

  const getShippingFee = () => {
    const zone = getShippingZoneByPostalCode(postalCodeInput ? postalCodeInput.value : '');
    if (!zone) return null;
    if (state.shippingMethod === 'tienda') return 0;
    if (state.shippingMethod === 'express') return shippingRates.express;

    const subtotal = state.cart.reduce((sum, item) => sum + item.quantity * item.price, 0);
    if (subtotal >= freeShippingThreshold) return 0;
    return zone.fee;
  };

  const getFilteredProducts = () => {
    const q = state.query.trim().toLowerCase();
    const filtered = products.filter((product) => {
      const matchesCategory = state.category === 'all' || product.category === state.category;
      const haystack = `${product.name} ${product.description} ${product.keywords.join(' ')}`.toLowerCase();
      const matchesQuery = !q || haystack.includes(q);
      return matchesCategory && matchesQuery;
    });

    if (state.sortOrder === 'price-asc') {
      filtered.sort((first, second) => first.price - second.price);
    } else if (state.sortOrder === 'price-desc') {
      filtered.sort((first, second) => second.price - first.price);
    }

    return filtered;
  };

  const renderProducts = () => {
    const filtered = getFilteredProducts();
    if (!filtered.length) {
      if (productGrid) {
        productGrid.innerHTML = `
          <div class="empty-state">
            <h3>No encontramos coincidencias</h3>
            <p>Prueba otra búsqueda o cambia el filtro.</p>
          </div>
        `;
      }
      if (productDetail) {
        productDetail.hidden = true;
        productDetail.innerHTML = '';
      }
      if (resultCount) {
        resultCount.textContent = '0 productos';
      }
      return;
    }

    if (productDetail) {
      productDetail.hidden = false;
    }

    if (!filtered.some((product) => product.id === state.selectedId)) {
      state.selectedId = filtered[0].id;
    }

    if (resultCount) {
      resultCount.textContent = `${filtered.length} ${filtered.length === 1 ? 'producto' : 'productos'}`;
    }

    if (productGrid) {
      productGrid.innerHTML = filtered.map((product) => {
        const selection = getSelectionForProduct(product.id);
        const customization = getCustomizationForProduct(product.id);
        return `
          <article class="catalog-product">
            <div class="product-media">
              <span class="product-tag">${product.tag}</span>
              ${renderProductArt(product, selection, customization)}
            </div>
            <div class="product-content">
              <div class="product-meta">
                <span>${product.label}</span>
              </div>
              <h3>${product.name}</h3>
              <p>${product.description}</p>
              <div class="product-price-row">
                <strong>${formatMoney(product.price)}</strong>
                <span>${formatMoney(product.originalPrice)}</span>
              </div>
              <div class="product-actions">
                <button class="secondary-button" type="button" data-action="detail" data-id="${product.id}">Ver producto</button>
                <button class="primary-button" type="button" data-action="customize" data-id="${product.id}">Personalizar</button>
              </div>
            </div>
          </article>
        `;
      }).join('');
    }

    const selected = filtered.find((product) => product.id === state.selectedId) || filtered[0];
    renderDetail(selected);
    fitProductArtPrint(productGrid);
    fitProductArtPrint(productDetail);
  };

  const renderDetail = (product) => {
    if (!productDetail) return;

    const selection = getSelectionForProduct(product.id);
    const customization = getCustomizationForProduct(product.id);
    const swatches = product.colors.map((color) => `
      <button
        class="detail-swatch ${selection.color === color ? 'is-selected' : ''}"
        type="button"
        data-action="select-color"
        data-id="${product.id}"
        data-color="${color}"
        style="background:${color};"
        aria-label="Color ${color}"
      ></button>
    `).join('');

    const customSwatches = printColors.map((color) => `
      <button
        class="custom-swatch ${customization.accent === color ? 'is-selected' : ''}"
        type="button"
        data-action="custom-color"
        data-id="${product.id}"
        data-color="${color}"
        style="background:${color};"
        aria-label="Estampado en ${color}"
      ></button>
    `).join('');

    const customStatus = customization.saved
      ? '<span class="custom-status">Diseño guardado</span>'
      : '<span class="custom-status is-muted">Pendiente</span>';

    productDetail.innerHTML = `
      <span class="detail-badge">${product.label}</span>
      <div class="detail-header">
        <h3>${product.name}</h3>
        <div class="detail-price">${formatMoney(product.price)}</div>
      </div>
      <div class="detail-visual" aria-hidden="true">
        ${renderProductArt(product, selection, customization)}
      </div>
      <div class="variant-picker">
        <label>
          <span>Talla</span>
          <select class="detail-size-select" data-action="select-size" data-id="${product.id}">
            ${product.sizes.map((size) => `
              <option value="${size}" ${selection.size === size ? 'selected' : ''}>${size}</option>
            `).join('')}
          </select>
        </label>
      </div>
      <div class="detail-swatches">${swatches}</div>

      <div class="detail-customizer">
        <div class="customizer-header">
          <span>Personalización</span>
          ${customStatus}
        </div>

        <label class="customizer-field">
          <span>Texto para impresión</span>
          <input
            type="text"
            class="customizer-input"
            data-action="custom-text"
            data-id="${product.id}"
            value="${escapeHTML(customization.text)}"
            maxlength="24"
            aria-label="Texto para impresión"
          />
        </label>

        <div class="customizer-row">
          <label class="customizer-field">
            <span>Ubicación</span>
            <select data-action="custom-location" data-id="${product.id}">
              ${['Centro', 'Frontal', 'Manga', 'Espalda'].map((placement) => `
                <option value="${placement}" ${customization.placement === placement ? 'selected' : ''}>${placement}</option>
              `).join('')}
            </select>
          </label>
        </div>

        <div class="customizer-field">
          <span>Color del estampado</span>
          <div class="custom-swatch-row">${customSwatches}</div>
        </div>
      </div>

      <ul class="detail-list">
        <li>Tallas: ${product.sizes.join(', ')}</li>
        <li>Entrega estimada: 5 a 7 días hábiles</li>
        <li>Impresión disponible: ${product.features.join(' · ')}</li>
      </ul>
      <div class="detail-actions">
        <button class="primary-button" type="button" data-action="add-cart" data-id="${product.id}">Agregar al carrito</button>
        <button class="secondary-button" type="button" data-action="save-custom" data-id="${product.id}">Guardar diseño</button>
      </div>
    `;
  };

  const renderCart = () => {
    if (!cartItems || !cartSubtotal || !cartCount) return;

    const totalItems = state.cart.reduce((sum, item) => sum + item.quantity, 0);
    const totalPrice = state.cart.reduce((sum, item) => sum + item.quantity * item.price, 0);

    cartCount.textContent = String(totalItems);
    cartSubtotal.textContent = formatMoney(totalPrice);

    if (!state.cart.length) {
      cartItems.innerHTML = `
        <div class="cart-empty">
          <h4>Tu carrito está vacío</h4>
          <p>Añade productos para continuar con tu pedido.</p>
        </div>
      `;
      return;
    }

    cartItems.innerHTML = state.cart.map((item) => {
      const customization = getCartCustomization(item);
      return `
        <div class="cart-item">
          <div class="cart-item-visual" aria-hidden="true">
            ${renderProductArt(
              getProductById(item.id),
              { color: item.colorName },
              customization
            )}
          </div>
          <div class="cart-item-copy">
            <div class="cart-item-top">
              <strong>${item.name}</strong>
              <button type="button" class="cart-remove" data-action="remove-cart" data-id="${item.id}" data-cart-key="${item.cartKey}" aria-label="Quitar ${item.name}">×</button>
            </div>
            <span>${getCartItemDetails(item)}</span>
            <div class="cart-item-bottom">
              <span>Cantidad: ${item.quantity}</span>
              <strong>${formatMoney(item.quantity * item.price)}</strong>
            </div>
          </div>
        </div>
      `;
    }).join('');
  };

  const addToCart = (productId) => {
    const product = getProductById(productId);
    if (!product) return;

    const selection = getSelectionForProduct(productId);
    const customization = getCustomizationForProduct(productId);
    const cartKey = [
      productId,
      selection.size,
      selection.color,
      customization.text,
      customization.placement,
      customization.accent
    ].map((value) => encodeURIComponent(String(value))).join('|');
    const found = state.cart.find((item) => item.cartKey === cartKey);
    if (found) {
      found.quantity += 1;
    } else {
      state.cart.push({
        id: product.id,
        cartKey,
        name: product.name,
        label: product.label,
        price: product.price,
        quantity: 1,
        size: selection.size,
        colorName: selection.color,
        customization: { ...customization }
      });
    }

    renderCart();
    renderCheckoutSummary();
    if (cartDrawer) {
      cartDrawer.classList.add('is-open');
      cartDrawer.setAttribute('aria-hidden', 'false');
    }
  };

  const removeFromCart = (productId, cartKey) => {
    state.cart = state.cart.filter((item) => {
      if (cartKey) {
        return item.id !== productId || item.cartKey !== cartKey;
      }
      return item.id !== productId;
    });
    renderCart();
    renderCheckoutSummary();
  };

  const openCart = () => {
    if (!cartDrawer) return;
    cartDrawer.classList.add('is-open');
    cartDrawer.setAttribute('aria-hidden', 'false');
  };

  const closeCartDrawer = () => {
    if (!cartDrawer) return;
    cartDrawer.classList.remove('is-open');
    cartDrawer.setAttribute('aria-hidden', 'true');
  };

  const renderCheckoutSummary = () => {
    if (!checkoutItems || !checkoutTotal || !checkoutShipping || !checkoutDiscount) return;

    const subtotal = state.cart.reduce((sum, item) => sum + item.quantity * item.price, 0);
    const shippingFee = getShippingFee();
    const discountPercent = couponRules[state.couponCode] || 0;
    const shippingDiscount = state.couponCode === 'ENVIOFREE' && shippingFee !== null
      ? shippingFee
      : 0;
    const discountAmount = (subtotal * discountPercent) + shippingDiscount;
    const payableShippingFee = shippingFee === null ? null : shippingFee - shippingDiscount;
    const total = payableShippingFee === null
      ? null
      : Math.max(0, subtotal + payableShippingFee - (subtotal * discountPercent));

    if (shippingZoneInput) {
      const zone = getShippingZoneByPostalCode(postalCodeInput ? postalCodeInput.value : '');
      shippingZoneInput.value = zone ? zone.name : 'Código postal inválido';
    }

    checkoutShipping.textContent = payableShippingFee === null ? '—' : formatMoney(payableShippingFee);
    checkoutDiscount.textContent = `-${formatMoney(discountAmount)}`;
    checkoutTotal.textContent = total === null ? '—' : formatMoney(total);

    if (!state.cart.length) {
      checkoutItems.innerHTML = `
        <div class="checkout-empty">
          <p>Tu carrito está vacío.</p>
        </div>
      `;
      return;
    }

    checkoutItems.innerHTML = state.cart.map((item) => `
      <div class="checkout-row">
        <div>
          <strong>${item.name}</strong>
          <span>${getCartItemDetails(item)} · x${item.quantity}</span>
        </div>
        <strong>${formatMoney(item.quantity * item.price)}</strong>
      </div>
    `).join('');
  };

  const openCheckout = () => {
    if (!checkoutDrawer) return;
    if (!state.cart.length) {
      openCart();
      return;
    }
    renderCheckoutSummary();
    closeCartDrawer();
    checkoutDrawer.classList.add('is-open');
    checkoutDrawer.setAttribute('aria-hidden', 'false');
  };

  const closeCheckoutDrawer = () => {
    if (!checkoutDrawer) return;
    checkoutDrawer.classList.remove('is-open');
    checkoutDrawer.setAttribute('aria-hidden', 'true');
  };

  const setHeaderState = () => {
    if (!header) return;
    if (window.scrollY > 20) {
      header.classList.add('is-scrolled');
    } else {
      header.classList.remove('is-scrolled');
    }
  };

  const openSearch = () => {
    if (!searchModal) return;
    searchModal.classList.add('is-open');
    searchModal.setAttribute('aria-hidden', 'false');
    if (searchInput) {
      setTimeout(() => searchInput.focus(), 50);
    }
  };

  const closeSearchModal = () => {
    if (!searchModal) return;
    searchModal.classList.remove('is-open');
    searchModal.setAttribute('aria-hidden', 'true');
  };

  if (searchButton) {
    searchButton.addEventListener('click', openSearch);
  }

  if (closeSearch) {
    closeSearch.addEventListener('click', closeSearchModal);
  }

  if (searchModal) {
    searchModal.addEventListener('click', (event) => {
      const target = event.target;
      if (target instanceof HTMLElement && target.dataset.closeSearch === 'true') {
        closeSearchModal();
      }
    });
  }

  if (checkoutForm) {
    const shippingField = checkoutForm.querySelector('select[name="shipping"]');
    const deliveryAddressField = document.getElementById('deliveryAddressField');
    const deliveryAddressInput = checkoutForm.querySelector('input[name="address"]');
    const updateDeliveryAddressRequirement = () => {
      const pickup = shippingField && shippingField.value === 'tienda';
      if (deliveryAddressInput) {
        deliveryAddressInput.required = !pickup;
        deliveryAddressInput.disabled = Boolean(pickup);
      }
      if (deliveryAddressField) {
        deliveryAddressField.hidden = Boolean(pickup);
      }
    };

    if (shippingField) {
      shippingField.addEventListener('change', (event) => {
        state.shippingMethod = event.target.value;
        updateDeliveryAddressRequirement();
        renderCheckoutSummary();
      });
    }
    updateDeliveryAddressRequirement();

    if (postalCodeInput) {
      postalCodeInput.addEventListener('input', () => {
        if (!/^\d{0,5}$/.test(postalCodeInput.value)) {
          postalCodeInput.value = postalCodeInput.value.replace(/\D/g, '').slice(0, 5);
        }
        postalCodeInput.setCustomValidity(
          getShippingZoneByPostalCode(postalCodeInput.value)
            ? ''
            : 'Ingresa un código postal reconocido de 5 dígitos.'
        );
        renderCheckoutSummary();
      });
    }

  }

  if (cartButton) {
    cartButton.addEventListener('click', openCart);
  }

  if (closeCart) {
    closeCart.addEventListener('click', closeCartDrawer);
  }

  if (checkoutButton) {
    checkoutButton.addEventListener('click', openCheckout);
  }

  if (closeCheckout) {
    closeCheckout.addEventListener('click', closeCheckoutDrawer);
  }

  if (cartDrawer) {
    cartDrawer.addEventListener('click', (event) => {
      const target = event.target;
      if (target instanceof HTMLElement && target.dataset.closeCart === 'true') {
        closeCartDrawer();
      }
    });
  }

  if (checkoutDrawer) {
    checkoutDrawer.addEventListener('click', (event) => {
      const target = event.target;
      if (target instanceof HTMLElement && target.dataset.closeCheckout === 'true') {
        closeCheckoutDrawer();
      }
    });
  }

  if (applyCoupon) {
    applyCoupon.addEventListener('click', () => {
      const nextCode = (couponInput?.value || '').trim().toUpperCase();
      if (!nextCode) {
        state.couponCode = '';
        if (couponStatus) {
          couponStatus.textContent = 'Ingresa un código para aplicar un descuento.';
          couponStatus.classList.remove('is-success');
        }
        renderCheckoutSummary();
        return;
      }

      if (couponRules[nextCode] !== undefined) {
        state.couponCode = nextCode;
        if (couponStatus) {
          couponStatus.textContent = `Cupón ${nextCode} aplicado correctamente.`;
          couponStatus.classList.add('is-success');
        }
      } else {
        state.couponCode = '';
        if (couponStatus) {
          couponStatus.textContent = 'Cupón no válido. Prueba MISO10, BODA25 o ENVIOFREE.';
          couponStatus.classList.remove('is-success');
        }
      }

      renderCheckoutSummary();
    });
  }

  if (postalCodeInput && shippingZoneInput) {
    postalCodeInput.value = '06700';
    shippingZoneInput.value = getShippingZoneByPostalCode(postalCodeInput.value).name;
  }

  if (checkoutForm) {
    const checkoutNotice = checkoutForm.querySelector('.checkout-payment-notice');
    const checkoutSubmit = checkoutForm.querySelector('.checkout-submit');
    let checkoutSubmitting = false;

    checkoutForm.addEventListener('submit', async (event) => {
      event.preventDefault();
      if (checkoutSubmitting) return;

      const formData = new FormData(checkoutForm);
      const customer = {
        name: formData.get('name'),
        email: formData.get('email'),
        phone: formData.get('phone'),
        city: formData.get('city'),
        address: formData.get('address'),
        postalCode: formData.get('postalCode'),
        shippingMethod: formData.get('shipping'),
        notes: formData.get('notes')
      };
      const items = state.cart.map((item) => ({
        id: item.id,
        quantity: item.quantity,
        size: item.size,
        color: item.colorName,
        customization: {
          text: item.customization.text,
          placement: item.customization.placement
        }
      }));

      checkoutSubmitting = true;
      if (checkoutSubmit) {
        checkoutSubmit.disabled = true;
        checkoutSubmit.textContent = 'Conectando con Mercado Pago...';
      }
      if (checkoutNotice) {
        checkoutNotice.textContent = 'Estamos preparando tu pago seguro. No ingreses datos de tarjeta en esta página.';
      }

      try {
        const paymentResponse = await fetch('/api/create-preference', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            customer,
            items,
            couponCode: state.couponCode
          })
        });
        let result;
        try {
          result = await paymentResponse.json();
        } catch (error) {
          throw new Error('El servidor no respondió correctamente. No se realizó ningún cobro.');
        }
        if (!paymentResponse.ok || typeof result.checkoutUrl !== 'string') {
          throw new Error(result.error || 'No se pudo iniciar el pago.');
        }

        const checkoutUrl = new URL(result.checkoutUrl);
        const isMercadoPagoUrl = checkoutUrl.protocol === 'https:'
          && (
            checkoutUrl.hostname === 'mercadopago.com.mx'
            || checkoutUrl.hostname.endsWith('.mercadopago.com.mx')
            || checkoutUrl.hostname === 'mercadopago.com'
            || checkoutUrl.hostname.endsWith('.mercadopago.com')
          );
        if (!isMercadoPagoUrl) {
          throw new Error('El enlace de pago no pertenece a Mercado Pago.');
        }

        window.location.assign(checkoutUrl.href);
      } catch (error) {
        console.error('No se pudo iniciar el pago con Mercado Pago.', error);
        if (checkoutNotice) {
          checkoutNotice.textContent = error instanceof Error
            ? error.message
            : 'No se pudo iniciar el pago. Inténtalo de nuevo más tarde.';
        }
        checkoutSubmitting = false;
        if (checkoutSubmit) {
          checkoutSubmit.disabled = false;
          checkoutSubmit.textContent = 'Continuar a Mercado Pago';
        }
      }
    });
  }

  if (searchInput) {
    searchInput.addEventListener('input', (event) => {
      state.query = event.target.value;
      renderProducts();
    });
  }

  searchSuggestions.forEach((suggestion) => {
    suggestion.addEventListener('click', () => {
      const value = suggestion.textContent.trim();
      if (searchInput) {
        searchInput.value = value;
      }
      state.query = value;
      renderProducts();
      closeSearchModal();
    });
  });

  filterButtons.forEach((button) => {
    button.addEventListener('click', () => {
      filterButtons.forEach((item) => item.classList.remove('active'));
      button.classList.add('active');
      state.category = button.dataset.category || 'all';
      renderProducts();
    });
  });

  if (sortButton) {
    sortButton.addEventListener('click', () => {
      const currentIndex = sortModes.findIndex((mode) => mode.value === state.sortOrder);
      const nextMode = sortModes[(currentIndex + 1) % sortModes.length];
      state.sortOrder = nextMode.value;
      sortButton.textContent = `Orden: ${nextMode.label}`;
      renderProducts();
    });
  }

  document.addEventListener('click', (event) => {
    const target = event.target;
    if (!(target instanceof HTMLElement)) return;

    const action = target.closest('[data-action]');
    if (!action) return;

    const id = action.dataset.id;
    const actionName = action.dataset.action;

    if (actionName === 'detail' && id) {
      state.selectedId = id;
      renderProducts();
      const productDetailTarget = document.getElementById('productDetail');
      productDetailTarget?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      return;
    }

    if (actionName === 'customize' && id) {
      state.selectedId = id;
      renderProducts();
      const productDetailTarget = document.getElementById('productDetail');
      productDetailTarget?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      return;
    }

    if (actionName === 'save-custom' && id) {
      const customization = { ...getCustomizationForProduct(id), saved: true };
      state.customizations[id] = customization;
      renderProducts();
      return;
    }

    if (actionName === 'custom-color' && id) {
      const color = action.dataset.color;
      if (!color) return;
      state.customizations[id] = {
        ...getCustomizationForProduct(id),
        accent: color,
        accentChosen: true,
        saved: false
      };
      renderProducts();
      return;
    }

    if (actionName === 'select-color' && id) {
      const color = action.dataset.color;
      if (!color) return;
      state.variantSelections[id] = {
        ...getSelectionForProduct(id),
        color
      };
      if (state.customizations[id]) {
        state.customizations[id].saved = false;
      }
      renderProducts();
      return;
    }

    if (actionName === 'add-cart' && id) {
      addToCart(id);
      return;
    }

    if (actionName === 'remove-cart' && id) {
      const cartKey = action.dataset.cartKey || '';
      removeFromCart(id, cartKey || undefined);
    }
  });

  document.addEventListener('change', (event) => {
    const target = event.target;
    if (!(target instanceof HTMLSelectElement)) return;

    const action = target.dataset.action;
    const id = target.dataset.id;
    if (!action || !id) return;

    if (action === 'select-size') {
      const size = target.value;
      state.variantSelections[id] = {
        ...getSelectionForProduct(id),
        size
      };
      renderProducts();
      return;
    }

    if (action === 'custom-location') {
      state.customizations[id] = {
        ...getCustomizationForProduct(id),
        placement: target.value,
        saved: false
      };
      const preview = productDetail?.querySelector('.product-art');
      if (preview) preview.dataset.placement = target.value;
      fitProductArtPrint(preview);
      const status = productDetail?.querySelector('.custom-status');
      if (status) {
        status.textContent = 'Pendiente';
        status.classList.add('is-muted');
      }
    }
  });

  document.addEventListener('input', (event) => {
    const target = event.target;
    if (!(target instanceof HTMLInputElement)) return;

    const action = target.dataset.action;
    const id = target.dataset.id;
    if (!action || !id) return;

    if (action === 'custom-text') {
      const preview = productDetail?.querySelector('.product-art');
      const nextText = target.value.slice(0, 24);
      const previewText = nextText.trim() || 'Tu diseño';
      state.customizations[id] = {
        ...getCustomizationForProduct(id),
        text: nextText,
        saved: false
      };
      if (preview) {
        preview.style.setProperty('--print-scale', String(getPrintScale(previewText)));
      }
      const printPreview = preview?.querySelector('.art-print');
      if (printPreview) printPreview.textContent = previewText;
      fitProductArtPrint(preview);
      const status = productDetail?.querySelector('.custom-status');
      if (status) {
        status.textContent = 'Pendiente';
        status.classList.add('is-muted');
      }
    }
  });

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && searchModal && searchModal.classList.contains('is-open')) {
      closeSearchModal();
    }

    if (event.key === 'Escape' && cartDrawer && cartDrawer.classList.contains('is-open')) {
      closeCartDrawer();
    }

    if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k') {
      event.preventDefault();
      openSearch();
    }
  });

  if (heroNameInput && heroNamePreview) {
    heroNameInput.addEventListener('input', () => {
      const nextValue = heroNameInput.value.trim() || 'MISO';
      heroNamePreview.textContent = nextValue;
    });
  }

  const cookieConsentKey = 'nova-cookie-consent';
  const readCookieConsent = () => {
    try {
      return globalThis.localStorage?.getItem(cookieConsentKey) || null;
    } catch (error) {
      console.warn('No se pudo leer el consentimiento de cookies en este dispositivo.', error);
      return null;
    }
  };
  const saveCookieConsent = (value) => {
    try {
      globalThis.localStorage?.setItem(cookieConsentKey, value);
    } catch (error) {
      console.warn('No se pudo guardar el consentimiento de cookies en este dispositivo.', error);
    }
  };

  const applyCookieState = () => {
    if (!cookieBanner) return;
    const saved = readCookieConsent();
    const customPreferences = saved && saved.match(/^custom:([01]):([01])$/);
    const hasDecision = saved === 'accept' || saved === 'reject' || Boolean(customPreferences);

    if (analyticsConsent) {
      analyticsConsent.checked = saved === 'accept' || Boolean(customPreferences && customPreferences[1] === '1');
    }
    if (personalizationConsent) {
      personalizationConsent.checked = saved === 'accept' || Boolean(customPreferences && customPreferences[2] === '1');
    }

    if (!hasDecision) {
      cookieBanner.classList.add('is-visible');
      if (saved === 'manage' && cookiePreferencesPanel) {
        cookiePreferencesPanel.hidden = false;
      }
    } else {
      cookieBanner.classList.remove('is-visible');
      if (cookiePreferencesPanel) cookiePreferencesPanel.hidden = true;
    }
  };

  cookieButtons.forEach((button) => {
    button.addEventListener('click', () => {
      const choice = button.dataset.cookie || 'accept';
      if (choice === 'manage') {
        if (cookiePreferencesPanel) cookiePreferencesPanel.hidden = false;
        if (analyticsConsent) analyticsConsent.focus();
        return;
      }

      if (choice === 'save') {
        const analytics = analyticsConsent && analyticsConsent.checked ? '1' : '0';
        const personalization = personalizationConsent && personalizationConsent.checked ? '1' : '0';
        saveCookieConsent(`custom:${analytics}:${personalization}`);
      } else {
        saveCookieConsent(choice);
      }

      if (cookieBanner) {
        cookieBanner.classList.remove('is-visible');
      }
      if (cookiePreferencesPanel) cookiePreferencesPanel.hidden = true;
    });
  });

  setHeaderState();
  window.addEventListener('scroll', setHeaderState, { passive: true });
  applyCookieState();
  renderCheckoutSummary();
  renderCart();
  renderProducts();
});
