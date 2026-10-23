/* ===== HERO SLIDESHOW ===== */
function initSlideshow() {
  const slides = document.querySelectorAll('.hero-slide');
  const counter = document.querySelector('.slide-current');
  if (!slides.length) return;
  let current = 0;

  function next() {
    slides[current].classList.remove('active');
    current = (current + 1) % slides.length;
    slides[current].classList.add('active');
    if (counter) counter.textContent = String(current + 1).padStart(2, '0');
  }

  setInterval(next, 5000);
}

/* ===== NAV SCROLL ===== */
function initNav() {
  const nav = document.querySelector('.nav');
  window.addEventListener('scroll', () => {
    nav.classList.toggle('scrolled', window.scrollY > 60);
  }, { passive: true });

  const menuBtn = document.querySelector('.nav-menu-btn');
  const mobileMenu = document.querySelector('.mobile-menu');
  const mobileClose = document.querySelector('.mobile-close');

  if (menuBtn && mobileMenu) {
    menuBtn.addEventListener('click', () => mobileMenu.classList.toggle('open'));
    mobileClose && mobileClose.addEventListener('click', () => mobileMenu.classList.remove('open'));
    mobileMenu.querySelectorAll('a').forEach(a => {
      a.addEventListener('click', () => mobileMenu.classList.remove('open'));
    });
  }
}

/* ===== 3D CARD TILT ===== */
function initTilt() {
  document.querySelectorAll('.product-card').forEach(card => {
    card.addEventListener('mousemove', e => {
      const r = card.getBoundingClientRect();
      const x = (e.clientX - r.left) / r.width - 0.5;
      const y = (e.clientY - r.top) / r.height - 0.5;
      card.style.transform = `perspective(600px) rotateY(${x * 10}deg) rotateX(${-y * 10}deg) translateZ(8px)`;
    });
    card.addEventListener('mouseleave', () => {
      card.style.transform = '';
    });
  });
}

/* ===== SCROLL REVEAL ===== */
function initReveal() {
  const io = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (e.isIntersecting) {
        e.target.classList.add('visible');
        io.unobserve(e.target);
      }
    });
  }, { threshold: 0.1 });
  document.querySelectorAll('.reveal').forEach(el => io.observe(el));
}

/* ===== FILTER BAR ===== */
function initFilters() {
  const btns = document.querySelectorAll('.filter-btn');
  const cards = document.querySelectorAll('.product-card[data-category]');

  btns.forEach(btn => {
    btn.addEventListener('click', () => {
      btns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      const cat = btn.dataset.filter;
      cards.forEach(card => {
        const show = cat === 'all' || card.dataset.category === cat;
        card.style.display = show ? '' : 'none';
      });
    });
  });
}

/* ===== CART ===== */
let cart = [];

function cartTotal() {
  return cart.reduce((s, i) => s + i.price * i.qty, 0);
}

function formatPrice(n) {
  return '$' + n.toLocaleString('es-AR', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
}

function renderCart() {
  const cartItems = document.querySelector('.cart-items');
  const cartEmpty = document.querySelector('.cart-empty');
  const totalEl = document.querySelector('.cart-total strong');
  const countEl = document.querySelector('.cart-count');

  const total = cartTotal();
  if (countEl) {
    const totalQty = cart.reduce((s, i) => s + i.qty, 0);
    countEl.textContent = totalQty;
    countEl.classList.toggle('has-items', totalQty > 0);
  }
  if (totalEl) totalEl.textContent = formatPrice(total);

  if (!cartItems) return;
  cartItems.innerHTML = '';

  if (cart.length === 0) {
    cartItems.innerHTML = '<div class="cart-empty">🛒<span>Tu carrito está vacío</span></div>';
    return;
  }

  cart.forEach((item, i) => {
    const div = document.createElement('div');
    div.className = 'cart-item';
    div.innerHTML = `
      <img class="cart-item-img" src="${item.img}" alt="${item.name}" onerror="this.src='portada.webp'">
      <div class="cart-item-info">
        <div class="cart-item-name">${item.name}</div>
        <div class="cart-item-price">${formatPrice(item.price)} c/u</div>
        <div class="cart-item-qty">
          <button class="qty-btn" data-idx="${i}" data-action="dec">−</button>
          <span class="qty-val">${item.qty}</span>
          <button class="qty-btn" data-idx="${i}" data-action="inc">+</button>
        </div>
      </div>
      <button class="cart-item-remove" data-idx="${i}">✕</button>
    `;
    cartItems.appendChild(div);
  });

  cartItems.querySelectorAll('.qty-btn').forEach(btn => {
    btn.addEventListener('click', e => {
      const idx = +btn.dataset.idx;
      if (btn.dataset.action === 'inc') cart[idx].qty++;
      else if (cart[idx].qty > 1) cart[idx].qty--;
      else { cart.splice(idx, 1); }
      renderCart();
    });
  });

  cartItems.querySelectorAll('.cart-item-remove').forEach(btn => {
    btn.addEventListener('click', () => {
      cart.splice(+btn.dataset.idx, 1);
      renderCart();
    });
  });
}

function addToCart(name, price, img, unit) {
  const existing = cart.find(i => i.name === name);
  if (existing) existing.qty++;
  else cart.push({ name, price, img, unit, qty: 1 });
  renderCart();
  showToast(`✦ ${name} agregado al carrito`);
}

function showToast(msg) {
  const toast = document.getElementById('toast');
  if (!toast) return;
  toast.querySelector('.toast-msg').textContent = msg;
  toast.classList.add('show');
  setTimeout(() => toast.classList.remove('show'), 2800);
}

function initCart() {
  const overlay = document.querySelector('.cart-overlay');
  const cartBtn = document.querySelector('.cart-btn');
  const closeBtn = document.querySelector('.cart-close');
  const clearBtn = document.querySelector('.btn-clear-cart');
  const waBtn = document.querySelector('.btn-cart-wa');

  if (cartBtn) cartBtn.addEventListener('click', () => overlay.classList.add('open'));
  if (closeBtn) closeBtn.addEventListener('click', () => overlay.classList.remove('open'));
  if (overlay) overlay.addEventListener('click', e => {
    if (e.target === overlay) overlay.classList.remove('open');
  });
  if (clearBtn) clearBtn.addEventListener('click', () => {
    cart = []; renderCart();
  });
  if (waBtn) waBtn.addEventListener('click', () => {
    if (cart.length === 0) return;
    const lines = cart.map(i => `• ${i.name} x${i.qty} = ${formatPrice(i.price * i.qty)}`).join('\n');
    const total = formatPrice(cartTotal());
    const msg = `Hola, quisiera consultar presupuesto para:\n${lines}\n\n*Total material: ${total}*\n\n¿Incluyen colocación?`;
    window.open(`https://wa.me/542214374605?text=${encodeURIComponent(msg)}`, '_blank');
  });

  document.querySelectorAll('.card-add-btn').forEach(btn => {
    btn.addEventListener('click', e => {
      e.stopPropagation();
      const card = btn.closest('.product-card');
      const name = card.querySelector('.card-title')?.textContent || 'Producto';
      const priceText = card.querySelector('.card-price')?.textContent?.replace(/[$,.]/g, '') || '0';
      const price = parseInt(priceText) || 0;
      const img = card.querySelector('.card-image-wrap img')?.src || '';
      addToCart(name, price, img);
    });
  });
}

/* ===== CALCULATOR ===== */
const PRODUCTS_CALC = {
  // Wall Panel Interior
  'wall-interior':      { name: 'Wall Panel PVC Interior',        price: 22699,  m2: 0.36,  unit: 'tira' },
  'wall-wpc-acanalado': { name: 'Wall Panel WPC Acanalado',       price: 98432,  m2: 1,     unit: 'm²' },
  'siding-wpc':         { name: 'Siding Panel WPC',               price: 92828,  m2: 1,     unit: 'm²' },
  // Wall Panel Exterior
  'wall-exterior':      { name: 'Wall Panel Exterior PVC',        price: 66767,  m2: 0.36,  unit: 'unidad' },
  // Placas PVC
  'placa-marmol':       { name: 'Placa PVC Simil Mármol',         price: 81238,  m2: 3.42,  unit: 'placa' },
  'placa-piedra':       { name: 'Placa PVC Simil Piedra',         price: 101908, m2: 3.42,  unit: 'placa' },
  'piedra-flexible':    { name: 'Piedra Natural Flexible',         price: 57030,  m2: 0.72,  unit: 'placa' },
  'autoadhesivo':       { name: 'Placa Autoadhesiva PVC',         price: 16507,  m2: 1,     unit: 'm²' },
  // Placas 3D
  'placa-3d':           { name: 'Placa 3D PVC',                   price: 6895,   m2: 0.25,  unit: 'unidad' },
  // Pisos SPC
  'piso-vinilico':      { name: 'Piso Vinílico SPC Click',        price: 36381,  m2: 1,     unit: 'm²' },
  'piso-porcelanato':   { name: 'Piso SPC Simil Porcelanato',     price: 36375,  m2: 1,     unit: 'm²' },
  'piso-wpc':           { name: 'Piso Vinílico WPC Premium',      price: 51020,  m2: 1,     unit: 'm²' },
  'piso-pegar':         { name: 'Piso Vinílico para Pegar',       price: 25953,  m2: 1,     unit: 'm²' },
  // Pisos flotantes
  'piso-flotante':      { name: 'Piso Flotante Laminado',         price: 29020,  m2: 1,     unit: 'm²' },
  'piso-brilloso':      { name: 'Piso Flotante Alto Brillo',      price: 37383,  m2: 1,     unit: 'm²' },
  'flooran':            { name: 'Flooran Art Piso Flotante',      price: 25341,  m2: 1,     unit: 'm²' },
  // Deck WPC (precio por metro lineal)
  'deck-wpc':           { name: 'Deck WPC Tablas',                price: 168342, ml: 1,     unit: 'm', perMl: true },
  'deck-kit':           { name: 'Deck WPC Kit ELM',               price: 174756, ml: 1,     unit: 'm', perMl: true },
  'deck-baldosa':       { name: 'Deck WPC Baldosas',              price: 103849, ml: 1,     unit: 'm', perMl: true },
  // Zócalos (precio por metro lineal)
  'zocalo-7':           { name: 'Zócalo EPS 7cm + Clips',         price: 6005,   ml: 1,     unit: 'm', perMl: true },
  'zocalo-10':          { name: 'Zócalo EPS 10cm + Clips',        price: 9968,   ml: 1,     unit: 'm', perMl: true },
  'zocalo-led':         { name: 'Zócalo EPS LED 10cm',            price: 18904,  ml: 1,     unit: 'm', perMl: true },
  // Molduras (precio por metro lineal)
  'moldura-peq':        { name: 'Moldura EPS Pequeña',            price: 1207,   ml: 1,     unit: 'm', perMl: true },
  'moldura-grande':     { name: 'Moldura EPS Grande',             price: 5186,   ml: 1,     unit: 'm', perMl: true },
  // Césped
  'cesped-premium':     { name: 'Césped Sintético Premium',       price: 28526,  m2: 1,     unit: 'm²' },
  'cesped-luxe':        { name: 'Césped Sintético Luxe',          price: 36490,  m2: 1,     unit: 'm²' },
};

const COLOCACION_M2 = { pared: 8000, piso: 7500, cielorraso: 9500 };

function initCalculator() {
  const form = document.getElementById('calc-form');
  if (!form) return;

  const productSel = form.querySelector('#calc-product');
  const surfaceSel = form.querySelector('#calc-surface');
  const widthInput = form.querySelector('#calc-width');
  const heightInput = form.querySelector('#calc-height');
  const areaInput = form.querySelector('#calc-area');
  const areaLabel = form.querySelector('label[for="calc-area"]');
  const calcBtn = form.querySelector('#calc-btn');
  const result = document.getElementById('calc-result');

  productSel?.addEventListener('change', () => {
    const prod = PRODUCTS_CALC[productSel.value];
    if (!prod) return;
    if (prod.perMl) {
      if (areaLabel) areaLabel.textContent = 'Metros lineales totales';
      if (areaInput) areaInput.placeholder = 'Ej: 12';
      if (widthInput) widthInput.closest('.form-group').style.display = 'none';
      if (heightInput) heightInput.closest('.form-group').style.display = 'none';
    } else {
      if (areaLabel) areaLabel.textContent = 'Área total (m²) — o completá ancho × alto arriba';
      if (areaInput) areaInput.placeholder = 'Ej: 8.4';
      if (widthInput) widthInput.closest('.form-group').style.display = '';
      if (heightInput) heightInput.closest('.form-group').style.display = '';
    }
  });

  function calcArea() {
    const w = parseFloat(widthInput?.value) || 0;
    const h = parseFloat(heightInput?.value) || 0;
    if (w && h) {
      if (areaInput) areaInput.value = (w * h).toFixed(2);
    }
  }
  widthInput?.addEventListener('input', calcArea);
  heightInput?.addEventListener('input', calcArea);

  calcBtn?.addEventListener('click', () => {
    const pid = productSel?.value;
    const surf = surfaceSel?.value || 'pared';
    const area = parseFloat(areaInput?.value) || 0;
    if (!pid || area <= 0) {
      showToast('Completá el área o las dimensiones');
      return;
    }
    const prod = PRODUCTS_CALC[pid];
    if (!prod) return;

    let units, matTotal;
    if (prod.perMl) {
      units = Math.ceil((area / prod.ml) * 1.05);
      matTotal = units * prod.price;
    } else {
      const areaConWaste = area * 1.1;
      units = Math.ceil(areaConWaste / prod.m2);
      matTotal = units * prod.price;
    }

    const colPrice = (COLOCACION_M2[surf] || 8000) * area;
    const total = matTotal + colPrice;

    result.innerHTML = `
      <div class="result-row"><span>Área ingresada</span><span>${area} m²</span></div>
      <div class="result-row"><span>${prod.unit}s necesarias (+10% desperdicio)</span><span>${units} ${prod.unit}s</span></div>
      <div class="result-row"><span>Costo material</span><span>${formatPrice(matTotal)}</span></div>
      <div class="result-row"><span>Colocación estimada</span><span>${formatPrice(colPrice)}</span></div>
      <div class="result-row total"><span>Total estimado</span><span>${formatPrice(total)}</span></div>
    `;
    result.classList.add('visible');

    const waBtn = document.getElementById('calc-wa-btn');
    if (waBtn) {
      waBtn.onclick = () => {
        const msg = `Hola, quisiera un presupuesto para:\n• Producto: ${prod.name}\n• Superficie: ${surf}\n• Área: ${area} m²\n• Unidades: ${units} ${prod.unit}s\n• Material estimado: ${formatPrice(matTotal)}\n\n¿Pueden darme precio final con colocación?`;
        window.open(`https://wa.me/542214374605?text=${encodeURIComponent(msg)}`, '_blank');
      };
    }
  });
}

/* ===== LENIS SMOOTH SCROLL ===== */
let lenisInstance = null;

function initLenis() {
  if (typeof Lenis === 'undefined') return;
  lenisInstance = new Lenis({
    duration: 1.25,
    easing: t => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
    smoothWheel: true,
  });
  function raf(time) {
    lenisInstance.raf(time);
    requestAnimationFrame(raf);
  }
  requestAnimationFrame(raf);
}

/* ===== SHOWCASE PARALLAX ===== */
function initShowcaseParallax() {
  const items = document.querySelectorAll('.showcase-item');
  if (!items.length) return;

  items.forEach(item => {
    item._mx = 0;
    item._my = 0;
  });

  function getScrollY(item) {
    const rect = item.getBoundingClientRect();
    const viewH = window.innerHeight;
    const progress = 1 - (rect.bottom / (viewH + rect.height));
    return (progress - 0.5) * 110;
  }

  function applyTransform(item) {
    const bg = item.querySelector('.showcase-bg');
    if (!bg) return;
    const sy = getScrollY(item);
    bg.style.transform = `translate(${item._mx}px, ${sy + item._my}px)`;
  }

  function onScroll() {
    items.forEach(item => {
      const rect = item.getBoundingClientRect();
      if (rect.bottom < 0 || rect.top > window.innerHeight) return;
      applyTransform(item);
    });
  }

  items.forEach(item => {
    item.addEventListener('mousemove', e => {
      const rect = item.getBoundingClientRect();
      const x = (e.clientX - rect.left) / rect.width - 0.5;
      const y = (e.clientY - rect.top) / rect.height - 0.5;
      item._mx = x * 22;
      item._my = y * 14;
      applyTransform(item);
    });

    item.addEventListener('mouseleave', () => {
      const bg = item.querySelector('.showcase-bg');
      if (bg) bg.style.transition = 'transform 0.7s ease';
      item._mx = 0;
      item._my = 0;
      applyTransform(item);
      setTimeout(() => { if (bg) bg.style.transition = ''; }, 700);
    });

    item.addEventListener('click', e => {
      const target = item.dataset.filterTarget;
      if (target) {
        const btn = document.querySelector(`[data-filter="${target}"]`);
        if (btn) btn.click();
      }
    });
  });

  // Integrate with Lenis if available, fallback to native scroll
  if (lenisInstance) {
    lenisInstance.on('scroll', onScroll);
  } else {
    window.addEventListener('scroll', onScroll, { passive: true });
  }
  onScroll();
}

/* ===== PRODUCT DETAIL MODAL ===== */
function initProductModal() {
  const overlay = document.getElementById('productModal');
  if (!overlay) return;

  const pmClose  = document.getElementById('pmClose');
  const pmImg    = document.getElementById('pmImg');
  const pmCat    = document.getElementById('pmCategory');
  const pmName   = document.getElementById('pmName');
  const pmDesc   = document.getElementById('pmDesc');
  const pmSpecs  = document.getElementById('pmSpecs');
  const pmColors = document.getElementById('pmColors');
  const pmPrice  = document.getElementById('pmPrice');
  const pmUnit   = document.getElementById('pmUnit');
  const pmAdd    = document.getElementById('pmAddBtn');
  const pmWa     = document.getElementById('pmWaBtn');

  function parseCoverage(card) {
    const specs = [...card.querySelectorAll('.card-spec')].map(s => s.textContent.trim());
    const priceUnit = card.querySelector('.card-price-unit')?.textContent?.trim() || '';

    // Match "X.XX m² / unit" anywhere in a spec
    for (const spec of specs) {
      const m = spec.match(/~?([\d.,]+)\s*m[²2]\s*\/\s*(\w+)/i);
      if (m) {
        const coverage = parseFloat(m[1].replace(',', '.'));
        const rawUnit = m[2]; // tira, placa, caja, unidad…
        const plural = rawUnit.endsWith('a') ? rawUnit + 's' : rawUnit.endsWith('ión') ? rawUnit.replace('ión', 'iones') : rawUnit + 's';
        return { type: 'm2', coverage, unit: rawUnit, plural };
      }
    }
    // "Precio por m²" or price unit "/ m²"
    if (specs.some(s => /precio por m[²2]/i.test(s)) || priceUnit === '/ m²') {
      return { type: 'm2', coverage: 1, unit: 'm²', plural: 'm²' };
    }
    // "Precio por metro" or price unit "/ m"
    if (specs.some(s => /precio por metro/i.test(s)) || priceUnit === '/ m') {
      return { type: 'ml', coverage: 1, unit: 'm', plural: 'm' };
    }
    return null;
  }

  function setupMiniCalc(card) {
    const calcBox   = document.getElementById('pmCalc');
    const m2Inputs  = document.getElementById('pmCalcM2Inputs');
    const mlInputs  = document.getElementById('pmCalcMlInputs');
    const wInput    = document.getElementById('pmCalcW');
    const hInput    = document.getElementById('pmCalcH');
    const areaInput = document.getElementById('pmCalcArea');
    const mlInput   = document.getElementById('pmCalcMl');
    const calcBtn   = document.getElementById('pmCalcBtn');
    const calcRes   = document.getElementById('pmCalcResult');

    const cov = parseCoverage(card);
    if (!cov) { calcBox.style.display = 'none'; return; }
    calcBox.style.display = '';

    const priceEl = card.querySelector('.card-price');
    const priceRaw = (priceEl?.textContent || '').replace(/[$.\s]/g, '').replace(/,/g, '');
    const unitPrice = parseInt(priceRaw) || 0;
    const title = card.querySelector('.card-title')?.textContent || 'Producto';
    const imgSrc = card.querySelector('.card-image-wrap img')?.src || '';

    // Show correct inputs
    if (cov.type === 'ml') {
      m2Inputs.style.display = 'none';
      mlInputs.style.display = '';
    } else {
      m2Inputs.style.display = '';
      mlInputs.style.display = 'none';
    }

    // Clear previous state
    [wInput, hInput, areaInput, mlInput].forEach(inp => { if (inp) inp.value = ''; });
    calcRes.innerHTML = '';
    calcRes.classList.remove('show');

    // Auto-fill area from width × height
    function syncArea() {
      const w = parseFloat(wInput?.value) || 0;
      const h = parseFloat(hInput?.value) || 0;
      if (w > 0 && h > 0 && areaInput) areaInput.value = (w * h).toFixed(2);
    }
    wInput?.removeEventListener('input', syncArea);
    hInput?.removeEventListener('input', syncArea);
    wInput?.addEventListener('input', syncArea);
    hInput?.addEventListener('input', syncArea);

    calcBtn.onclick = () => {
      let quantity;
      if (cov.type === 'ml') {
        const ml = parseFloat(mlInput?.value) || 0;
        if (!ml) return;
        quantity = Math.ceil(ml / cov.coverage * 1.05);
      } else {
        const area = parseFloat(areaInput?.value) || 0;
        if (!area) return;
        quantity = cov.coverage === 1
          ? Math.ceil(area * 1.1)
          : Math.ceil((area / cov.coverage) * 1.1);
      }

      const total = quantity * unitPrice;
      const inputVal = cov.type === 'ml'
        ? `${parseFloat(mlInput?.value).toFixed(1)} m`
        : `${parseFloat(areaInput?.value).toFixed(2)} m²`;

      calcRes.innerHTML = `
        <div class="pm-calc-res-row"><span>${cov.type === 'ml' ? 'Metros a cubrir' : 'Área a cubrir'}</span><span>${inputVal}</span></div>
        <div class="pm-calc-res-row"><span>${cov.plural} necesarias (+10%)</span><span>${quantity} ${cov.plural}</span></div>
        <div class="pm-calc-res-row total"><span>Total material</span><span>${formatPrice(total)}</span></div>
        <button class="pm-calc-add-qty" id="pmCalcAddQty">+ Agregar ${quantity} ${cov.plural} al carrito</button>
      `;
      calcRes.classList.add('show');

      document.getElementById('pmCalcAddQty')?.addEventListener('click', () => {
        const existing = cart.find(it => it.name === title);
        if (existing) {
          existing.qty = quantity;
        } else {
          cart.push({ name: title, price: unitPrice, img: imgSrc, unit: cov.unit, qty: quantity });
        }
        renderCart();
        showToast(`✦ ${quantity} ${cov.plural} de "${title}" agregadas`);
        closeModal();
      });
    };
  }

  function openModal(card) {
    const img      = card.querySelector('.card-image-wrap img');
    const category = card.querySelector('.card-category')?.textContent || '';
    const title    = card.querySelector('.card-title')?.textContent || '';
    const desc     = card.querySelector('.card-desc')?.textContent || '';
    const priceEl  = card.querySelector('.card-price');
    const unitEl   = card.querySelector('.card-price-unit');

    pmImg.src = img ? img.src : '';
    pmImg.alt = title;
    pmCat.textContent  = category;
    pmName.textContent = title;
    pmDesc.textContent = desc;
    pmPrice.textContent = priceEl ? priceEl.textContent : '';
    pmUnit.textContent  = unitEl  ? unitEl.textContent  : '';

    pmSpecs.innerHTML = '';
    card.querySelectorAll('.card-spec').forEach(s => {
      const el = document.createElement('span');
      el.className = 'pm-spec-chip';
      el.textContent = s.textContent;
      pmSpecs.appendChild(el);
    });

    pmColors.innerHTML = '';
    card.querySelectorAll('.color-chip').forEach(c => {
      const el = document.createElement('span');
      el.className = 'pm-color-chip';
      el.textContent = c.textContent;
      pmColors.appendChild(el);
    });

    pmAdd.onclick = () => {
      const priceRaw = (priceEl?.textContent || '').replace(/[$.,\s]/g, '');
      const price = parseInt(priceRaw) || 0;
      addToCart(title, price, img ? img.src : '');
      closeModal();
    };

    const waMsg = `Hola, me interesa el producto:\n• ${title}\n• Precio: ${priceEl?.textContent || ''} ${unitEl?.textContent || ''}\n\n¿Pueden darme más información y precio de colocación?`;
    pmWa.href = `https://wa.me/542214374605?text=${encodeURIComponent(waMsg)}`;

    setupMiniCalc(card);

    overlay.setAttribute('aria-hidden', 'false');
    overlay.classList.add('open');
    document.body.style.overflow = 'hidden';
  }

  function closeModal() {
    overlay.classList.remove('open');
    overlay.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
  }

  pmClose?.addEventListener('click', closeModal);
  overlay.addEventListener('click', e => { if (e.target === overlay) closeModal(); });
  document.addEventListener('keydown', e => { if (e.key === 'Escape') closeModal(); });

  document.querySelectorAll('.product-card').forEach(card => {
    card.addEventListener('click', e => {
      if (e.target.closest('.card-add-btn')) return;
      openModal(card);
    });
  });
}

/* ===== INIT ===== */
document.addEventListener('DOMContentLoaded', () => {
  initLenis();
  initSlideshow();
  initNav();
  initReveal();
  initFilters();
  initCart();
  initCalculator();
  initProductModal();
  initShowcaseParallax();
  setTimeout(initTilt, 200);
});
