/* ===== HERO VIDEO SCROLL SCRUB ===== */
function initHeroVideoScrub() {
  const video = document.querySelector('.hero-video');
  const section = document.getElementById('heroScroll');
  if (!video || !section) return;

  function getProgress() {
    const top = section.getBoundingClientRect().top;
    const scrollable = section.offsetHeight - window.innerHeight;
    if (scrollable <= 0) return 0;
    return Math.max(0, Math.min(1, -top / scrollable));
  }

  function update() {
    if (!video.duration) return;
    const target = getProgress() * video.duration;
    if (Math.abs(video.currentTime - target) > 0.033) {
      video.currentTime = target;
    }
  }

  video.addEventListener('loadedmetadata', update);
  window.__heroUpdate = update;
  window.addEventListener('scroll', () => requestAnimationFrame(update), { passive: true });
}

/* ===== FRAME SCROLL SCRUB ===== */
function initFrameScrub() {
  const section  = document.getElementById('procesoReel');
  const canvas   = document.getElementById('procesoCanvas');
  const bar      = document.getElementById('fscrubBar');
  if (!section || !canvas) return;
  const ctx = canvas.getContext('2d');

  const TOTAL = 122;
  const BASE  = 'obras/frames/frame';
  const imgs  = new Array(TOTAL);
  let loaded  = 0;
  let W = 0, H = 0;

  function resize() {
    W = canvas.width  = canvas.offsetWidth  || window.innerWidth;
    H = canvas.height = canvas.offsetHeight || window.innerHeight;
    render();
  }

  function getProgress() {
    const top = section.getBoundingClientRect().top + window.scrollY;
    const scrollable = section.offsetHeight - window.innerHeight;
    if (scrollable <= 0) return 0;
    return Math.max(0, Math.min(1, (window.scrollY - top) / scrollable));
  }

  function drawFrame(img) {
    if (!img || !img.complete || !W || !H) return;
    const iAR = img.naturalWidth / img.naturalHeight;
    const cAR = W / H;
    let dw, dh;
    if (iAR > cAR) { dw = W; dh = dw / iAR; }
    else            { dh = H; dw = dh * iAR; }
    ctx.fillStyle = '#060504';
    ctx.fillRect(0, 0, W, H);
    ctx.drawImage(img, (W - dw) / 2, (H - dh) / 2, dw, dh);
  }

  function render() {
    if (!W || !H) return;
    const p = getProgress();
    const idx = Math.min(Math.round(p * (TOTAL - 1)), TOTAL - 1);
    if (bar) bar.style.transform = `scaleX(${p})`;
    const img = imgs[idx];
    if (img && img.complete && img.naturalWidth) {
      drawFrame(img);
    } else if (idx > 0) {
      // fallback al frame anterior cargado
      for (let i = idx - 1; i >= 0; i--) {
        if (imgs[i] && imgs[i].complete && imgs[i].naturalWidth) { drawFrame(imgs[i]); break; }
      }
    }
  }

  let queued = false;
  function schedule() {
    if (!queued) { queued = true; requestAnimationFrame(() => { queued = false; render(); }); }
  }
  window.__fsSchedule = schedule;

  // Precargar todos los frames
  for (let i = 0; i < TOTAL; i++) {
    const n = String(i + 1).padStart(3, '0');
    const img = new Image();
    img.onload = () => { loaded++; if (loaded === 1) { resize(); } else { render(); } };
    img.src = `${BASE}${n}.jpg`;
    imgs[i] = img;
  }

  window.addEventListener('resize', resize, { passive: true });
  resize();
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
  'wall-interior':      { name: 'Wall Panel PVC Interior',        price: 18122,  m2: 0.36,  unit: 'tira' },
  'wall-wpc-acanalado': { name: 'Wall Panel WPC Acanalado',       price: 73577,  m2: 1,     unit: 'm²' },
  'siding-wpc':         { name: 'Siding Panel WPC',               price: 73577,  m2: 1,     unit: 'm²' },
  // Wall Panel Exterior
  'wall-exterior':      { name: 'Wall Panel Exterior WPC',        price: 48119,  m2: 0.654, unit: 'tira' },
  // Placas PVC
  'placa-marmol':       { name: 'Placa PVC Simil Mármol',         price: 66759,  m2: 3.42,  unit: 'placa' },
  'placa-piedra':       { name: 'Placa PVC Simil Piedra',         price: 101908, m2: 3.42,  unit: 'placa' },
  // Placas 3D
  'placa-3d':           { name: 'Placa 3D PVC',                   price: 6895,   m2: 0.25,  unit: 'unidad' },
  // Pisos SPC (precio por m²)
  'piso-vinilico':      { name: 'Piso Vinílico SPC Click',        price: 32733,  m2: 1,     unit: 'm²' },
  // Perfiles WPC (precio por metro lineal)
  'tirante-acanalado':  { name: 'Tirante WPC 90×40mm',            price: 16258,  ml: 1,     unit: 'm', perMl: true },
  'tirante-elm':        { name: 'Tirante WPC ELM Macizo',         price: 16258,  ml: 1,     unit: 'm', perMl: true },
  'tirante-wpc':        { name: 'Tirante WPC 30×40mm',            price: 6209,   ml: 1,     unit: 'm', perMl: true },
  // Zócalos (precio por metro lineal)
  'zocalo-7':           { name: 'Zócalo EPS 7cm + Clips',         price: 4310,   ml: 1,     unit: 'm', perMl: true },
  'zocalo-10':          { name: 'Zócalo EPS 10cm + Clips',        price: 7862,   ml: 1,     unit: 'm', perMl: true },
  'zocalo-led':         { name: 'Zócalo EPS LED 10cm',            price: 6301,   ml: 1,     unit: 'm', perMl: true },
  // Molduras (precio por metro lineal)
  'moldura-peq':        { name: 'Moldura EPS Pequeña',            price: 1594,   ml: 1,     unit: 'm', perMl: true },
  'moldura-grande':     { name: 'Moldura EPS Grande',             price: 5186,   ml: 1,     unit: 'm', perMl: true },
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
    window.__fsSchedule && window.__fsSchedule();
    window.__heroUpdate && window.__heroUpdate();
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

/* ===== PRODUCT DESCRIPTIONS (CB Group) ===== */
const PRODUCT_DESCRIPTIONS = {
  'wall-panel-interior': {
    text: [
      'Revestimiento para pared y techo Wall Panel desarrollado por la marca Kolertech.',
      'Ultima tendencia mundial, decora tu casa de forma rapida y dale el look que se merece!',
      'Podes decorar todos los ambientes, hasta podes ponerlo en el baño dejandolo super top!',
      'El precio corresponde a 1 tira.'
    ],
    specs: [
      ['Material', 'EPS (plástico de alta calidad)'],
      ['Largo', '3 m'],
      ['Ancho', '12 cm'],
      ['Superficie', '0,36 m² / tira'],
      ['Peso', '1,4 kg / unidad'],
      ['Tipo de uso', 'Interior'],
      ['Alistonado', '1,4 cm × 1,2 cm × 1 cm'],
      ['x Caja', '10 unidades'],
    ]
  },
  'wall-panel-interior-black': {
    base: 'wall-panel-interior',
    textExtra: ['Variante Black: elegancia en negro intenso. Ideal para TV walls y ambientes modernos.']
  },
  'wall-panel-interior-wallnut': {
    base: 'wall-panel-interior',
    textExtra: ['Variante Wallnut Fine: textura nogal fina. Calidez natural con practicidad del PVC.']
  },
  'wall-panel-interior-white': {
    base: 'wall-panel-interior',
    textExtra: ['Variante White: blanco puro luminoso. Amplía visualmente los espacios y combina con cualquier decoración. Ideal para cocinas, baños y livinges.']
  },
  'wall-panel-interior-gray-panel': {
    base: 'wall-panel-interior',
    textExtra: ['Variante Gray Panel: gris cemento versátil. Ideal para estilos industriales, nórdicos y minimalistas. Combina con maderas claras y oscuras.']
  },
  'wall-panel-interior-sand': {
    base: 'wall-panel-interior',
    textExtra: ['Variante Sand: tono arena cálido y natural. Aporta calidez a livinges, comedores y habitaciones. Combina perfecto con tonos tierra y madera clara.']
  },
  'wall-panel-interior-wallnut-panel': {
    base: 'wall-panel-interior',
    textExtra: ['Variante Wallnut Panel: veta de nogal pronunciada y profunda. Textura rústica con elegancia natural. Sin mantenimiento, sin humedad, sin problemas.']
  },
  'wall-panel-interior-wallnut-black': {
    base: 'wall-panel-interior',
    textExtra: ['Variante Wallnut Black: nogal en tono oscuro profundo. La combinación perfecta entre la textura natural de la madera y la sofisticación contemporánea.']
  },
  'wall-panel-exterior': {
    text: [
      'Revestimiento exterior de PVC de alta resistencia desarrollado por la marca Kolertech.',
      'Resistente a la intemperie, rayos UV y lluvia. No requiere pintura ni mantenimiento.',
      'Simil madera con sistema machimbre. Apto para fachadas, balcones y espacios exteriores.',
      'El precio corresponde a 1 unidad.'
    ],
    specs: [
      ['Material', 'PVC premium anti-UV'],
      ['Largo', '3 m'],
      ['Ancho', '12 cm'],
      ['Superficie', '0,36 m² / unidad'],
      ['Tipo de uso', 'Exterior'],
      ['Ambientes', 'Fachadas, balcones, exteriores'],
      ['Colores', '5 disponibles'],
    ]
  },
  'placa-pvc-simil-marmol': {
    text: [
      'Placa simil marmol con una increible terminacion. Un revestimiento para exigentes en la decoracion!',
      'El tamaño es de 1,22M × 2,44M × 3,3MM. Tienen la altura ideal para que no tengan uniones hasta el techo.',
      'Antialeérgicos · Anti-humedad, anti-manchas, anti-termitas · Buen confort térmico · Fácil de instalar.',
      'La instalacion se realiza de forma sencilla por personas capacitadas y se pega con adhesivos.'
    ],
    specs: [
      ['Material', 'PVC (Baseboard + UV coating)'],
      ['Largo', '2.440 mm'],
      ['Ancho', '1.220 mm'],
      ['Espesor', '3,3 mm'],
      ['Superficie', '2,93 m² / placa'],
      ['Acabado', 'Brillo'],
      ['Peso', '30 kg'],
      ['Tipo de uso', 'Interior'],
    ]
  },
  'placa-marmol-blanco': {
    base: 'placa-pvc-simil-marmol',
    textExtra: ['Diseño mármol blanco con vetas suaves. Transforma cualquier pared en una pieza de diseño.']
  },
  'placa-pvc-simil-piedra': {
    text: [
      'Placa de gran formato simil piedra natural desarrollada por la marca Kolertech.',
      'Textura piedra de alta definición con apariencia rústica y la practicidad del PVC.',
      'Para interiores y exteriores cubiertos. No se deforma, no se mancha.',
      'El precio corresponde a 1 placa.'
    ],
    specs: [
      ['Material', 'PVC alto impacto'],
      ['Largo', '2.800 mm'],
      ['Ancho', '1.220 mm'],
      ['Superficie', '3,42 m² / placa'],
      ['Espesor', '4 mm'],
      ['Tipo de uso', 'Interior / Exterior cubierto'],
      ['Resistente a', 'Humedad, manchas'],
    ]
  },
  'piedra-natural-flexible': {
    text: [
      'La Piedra Natural Flexible es un revestimiento de alta gama fabricado con una fina capa de piedra natural, conservando su textura, vetas y relieve originales.',
      'Cada placa es única, refleja las características propias de la piedra aportando un acabado exclusivo y de gran impacto visual.',
      'Formato 60×120 cm para crear superficies continuas con menos juntas: ambientes más amplios, modernos y elegantes.',
      'Aplicaciones: living, comedor, hall de ingreso, muros de TV, recepciones, hoteles, restaurantes y más.'
    ],
    specs: [
      ['Material', 'Piedra natural auténtica'],
      ['Largo', '1.200 mm'],
      ['Ancho', '600 mm'],
      ['Superficie', '0,72 m² / placa'],
      ['Característica', 'Liviana y flexible'],
      ['Mantenimiento', 'Bajo'],
      ['Instalación', 'Adhesivo directo'],
      ['Uso', 'Residencial y comercial'],
    ]
  },
  'placa-3d': {
    text: [
      'Placa 3D de PVC con relieve decorativo de alta definición.',
      'Crea efectos de luz y sombra únicos. Ideal para paredes de acento, TV walls y ambientes modernos.',
      'Liviana, impermeable y pintable. Sistema de instalación simple con pegamento.',
      'El precio corresponde a 1 unidad (50×50 cm).'
    ],
    specs: [
      ['Material', 'PVC liviano'],
      ['Largo', '500 mm'],
      ['Ancho', '500 mm'],
      ['Superficie', '0,25 m² / unidad'],
      ['Pintable', 'Sí'],
      ['Tipo de uso', 'Interior'],
      ['Instalación', 'Adhesivo o tornillos'],
    ]
  },
  'piso-vinilico-spc-click': {
    text: [
      'Piso Vinílico SPC Kolertech 4.8mm - Tecnología Alemana. La evolución definitiva del piso flotante.',
      'Gracias a su núcleo de polímero de piedra y PVC, ofrece una dureza extrema y estabilidad dimensional superior a cualquier vinílico tradicional.',
      'Sistema CLICK (colocación en seco, sin pegamentos) · 100% Resistente al Agua · Hipoalergénico · Ignífugo · Alto Tránsito.',
      'El precio corresponde a 1 caja (2,23 m², 10 tablas).'
    ],
    specs: [
      ['Material', 'SPC (Piedra + Plástico)'],
      ['Espesor total', '4,8 mm'],
      ['Capa de uso', '0,3 mm'],
      ['Rendimiento', '2,23 m² / caja (10 tablas)'],
      ['Sistema', 'Click de alta precisión'],
      ['Resistencia al agua', '100%'],
      ['Colores', '13+ disponibles'],
    ]
  },
  'piso-spc-click-simil-porcelanato': {
    text: [
      'Piso vinílico SPC con diseño y textura de porcelanato de la marca Kolertech.',
      'Resistente al agua 100%, sin obra ni demolición. Ideal para baños y cocinas.',
      'Aspecto cerámico con la practicidad y calidez del vinílico.',
      'El precio corresponde a 1 m².'
    ],
    specs: [
      ['Material', 'SPC (Piedra + Plástico)'],
      ['Espesor', '4 mm'],
      ['Sistema', 'Click flotante'],
      ['Resistencia al agua', '100%'],
      ['Diseño', 'Simil porcelanato'],
      ['Tipo de uso', 'Interior'],
    ]
  },
  'piso-vinilico-wpc-click-premium': {
    text: [
      'Piso vinílico de alta gama con núcleo WPC (Madera + Plástico) de Kolertech.',
      'La mejor opción en pisos vinílicos: 6mm de espesor con espuma integrada, ultra resistente.',
      'Apto para calefacción radiante. Máximo confort bajo los pies.',
      'El precio corresponde a 1 m².'
    ],
    specs: [
      ['Material', 'WPC (Madera + Plástico)'],
      ['Espesor', '6 mm'],
      ['Espuma', 'Integrada'],
      ['Sistema', 'Click flotante'],
      ['Radiant Heat', 'Compatible'],
      ['Tipo de uso', 'Interior premium'],
    ]
  },
  'piso-vinilico-para-pegar': {
    text: [
      'Piso vinílico en plancha para pegado directo de Kolertech.',
      'Ideal para instalar sobre piso existente sin demolición. Reforma rápida y económica.',
      'Resistente al agua y al tráfico intenso. Para comercios y hogares.',
      'El precio corresponde a 1 m².'
    ],
    specs: [
      ['Material', 'Vinílico flexible'],
      ['Espesor', '2 mm'],
      ['Sistema', 'Pegado directo'],
      ['Sin demolición', 'Sí'],
      ['Tipo de uso', 'Interior comercial/residencial'],
    ]
  },
  'piso-flotante-laminado': {
    text: [
      'Pisos flotantes AC4 8,3MM con sistema de encastre DOUBLE CLICK. La ecuación justa de precio y calidad.',
      '880kg de presión en la compactación. Lámina BROWNCORE anti-humedad y película OVERLAY anti-desgaste y altos impactos, con protección UV.',
      'Apropiado para casas y locales comerciales. No requiere pegamento. Apto para alérgicos.',
      'El precio corresponde a 1 m².'
    ],
    specs: [
      ['Material', 'HDF melamínico'],
      ['Espesor', '8,3 mm'],
      ['Sistema', 'DOUBLE CLICK'],
      ['Norma', 'ISO 9001 / AC4'],
      ['Anti-humedad', 'BROWNCORE integrado'],
      ['Colores', '23+ disponibles'],
      ['Tipo de uso', 'Interior residencial y comercial'],
    ]
  },
  'piso-flotante-alto-brillo': {
    text: [
      'Piso flotante con acabado laqueado ultra brilloso de Kolertech.',
      'Efecto lacado elegante de alta gama. Resistente al rayado (capa AC4).',
      'Fácil limpieza, refleja la luz creando ambientes luminosos y modernos.',
      'El precio corresponde a 1 m².'
    ],
    specs: [
      ['Material', 'HDF melamínico brilloso'],
      ['Capa de uso', 'AC4'],
      ['Acabado', 'Alto brillo laqueado'],
      ['Sistema', 'Click flotante'],
      ['Tipo de uso', 'Interior residencial'],
    ]
  },
  'flooran-art-piso-flotante': {
    text: [
      'Piso flotante melamínico Flooran Art de excelente relación precio/calidad.',
      'Sistema click con espuma acústica incorporada. Amplia gama de vetas y colores.',
      'Apto para ambientes secos: living, dormitorios y oficinas.',
      'El precio corresponde a 1 m².'
    ],
    specs: [
      ['Material', 'HDF melamínico'],
      ['Sistema', 'Click + espuma integrada'],
      ['Tipo de uso', 'Interior seco'],
      ['Marca', 'Flooran Art'],
    ]
  },
  'zocalo-eps-7cm': {
    text: [
      'Zócalo EPS Kolertech. EL PRECIO CORRESPONDE A 1 TIRA. Especialmente desarrollado para facilitar las reformas por su practicidad.',
      'Se puede aplicar sobre el zócalo anterior, sin remover el ya instalado.',
      'De color blanco mate. Sin obra, sin clavos ni pegamento. Sistema de clips incluidos.',
      'El precio corresponde a 1 tira de 2,25 m.'
    ],
    specs: [
      ['Material', 'EPS (foam expandido)'],
      ['Alto', '7 cm (70 mm)'],
      ['Espesor', '22 mm'],
      ['Largo tira', '2.250 mm (2,25 m)'],
      ['Color', 'Blanco mate'],
      ['x Envase', '10 tiras'],
      ['Sistema', 'Clips incluidos'],
    ]
  },
  'zocalo-eps-10cm': {
    text: [
      'Zócalo EPS Kolertech de 10 cm. EL PRECIO CORRESPONDE A 1 TIRA.',
      'Especialmente desarrollado para facilitar las reformas. Se puede aplicar sobre el zócalo anterior sin remover el ya instalado.',
      'Mayor altura para ambientes con cielorrasos altos. Sin obra, sin clavos ni pegamento.',
      'El precio corresponde a 1 tira de 2,25 m.'
    ],
    specs: [
      ['Material', 'EPS (foam expandido)'],
      ['Alto', '10 cm (100 mm)'],
      ['Espesor', '22 mm'],
      ['Largo tira', '2.250 mm (2,25 m)'],
      ['Color', 'Blanco mate'],
      ['x Envase', '10 tiras'],
      ['Sistema', 'Clips incluidos'],
    ]
  },
  'zocalo-eps-led-10cm': {
    text: [
      'Zócalo EPS de 10 cm con canal interno para tira LED de Kolertech.',
      'Iluminación ambiental rasante en piso. Efecto moderno único sin instalación eléctrica compleja.',
      'El precio corresponde a 1 metro lineal.'
    ],
    specs: [
      ['Material', 'EPS (foam expandido)'],
      ['Alto', '10 cm'],
      ['Canal LED', 'Incluido'],
      ['Color', 'Blanco'],
      ['Sistema', 'Clips'],
    ]
  },
  'wall-panel-wpc-acanalado': {
    text: [
      'Revestimiento premium WPC acanalado. EL PRECIO CORRESPONDE A 1 TIRA. Medidas: 24,5×218×3000mm.',
      'Fabricado en WPC (madera reciclada + polímeros): dureza, estabilidad y calidez con capa Co-Extrusion simil madera en todas sus caras.',
      'No requiere mantenimiento · No se decolora con el sol · No se mancha · No se pudre · Resistente a la intemperie.',
      'Se puede cortar con sierras para madera. Se coloca clavándolos o con pegamento. No necesita clips.'
    ],
    specs: [
      ['Material', 'WPC (madera reciclada + polímeros)'],
      ['Acabado', 'Co-Extrusion simil madera'],
      ['Largo', '3.000 mm'],
      ['Ancho tira', '218 mm (21,8 cm)'],
      ['Espesor', '24,5 mm'],
      ['Anti-UV', 'Sí'],
      ['Tipo de uso', 'Interior y Exterior'],
    ]
  },
  'siding-panel-wpc-revestimiento': {
    text: [
      'Paneles de siding WPC para revestimiento de fachadas y paredes exteriores.',
      'Efecto madera natural con acabado premium. Instalación horizontal tipo siding americano.',
      'Resistente a la intemperie, lluvia y radiación solar. Cero mantenimiento.',
      'El precio corresponde a 1 m².'
    ],
    specs: [
      ['Material', 'WPC (Madera + Plástico)'],
      ['Instalación', 'Horizontal (siding)'],
      ['Tipo de uso', 'Exterior / Fachadas'],
      ['Anti-UV', 'Sí'],
    ]
  },
  'placa-autoadhesiva-pvc': {
    text: [
      'Placa de PVC con dorso adhesivo 3M de alta resistencia.',
      'Sin pegamento extra, sin herramientas. Instalación en minutos. Ideal para reformas rápidas.',
      'Apto para baños, cocinas y comercios. Textura mármol y madera.',
      'El precio corresponde a 1 m².'
    ],
    specs: [
      ['Material', 'PVC flexible'],
      ['Adhesivo', '3M dorso'],
      ['Tipo de uso', 'Interior'],
      ['Instalación', 'Sin herramientas'],
      ['Diseños', 'Múltiples'],
    ]
  },
  'tirante-wpc-acanalado': {
    text: [
      'Perfil estructural WPC acanalado de Kolertech. La opción más resistente y fuerte del mercado para subestructura de decks y revestimientos.',
      'Combina la calidez estética de la madera natural con la durabilidad extrema del compuesto madera-plástico.',
      'Resistencia total UV y temperaturas extremas · Bajo mantenimiento (solo agua y jabón) · No genera astillas · Sustentable (fibras recicladas).',
      'El precio corresponde a 1 metro lineal.'
    ],
    specs: [
      ['Material', 'WPC acanalado Co-Extrusion'],
      ['Anti-UV', 'Sí'],
      ['Resistencia al agua', '100%'],
      ['Anti-hongos / pudrición', 'Sí'],
      ['Tipo de uso', 'Estructura / Exterior'],
      ['Colores', 'Almond, Jade, Peach, Black'],
    ]
  },
  'tirante-wpc-elm-macizo': {
    text: [
      'Perfil WPC macizo línea ELM de Kolertech, con clips y accesorios de fijación.',
      'La opción más robusta y duradera para estructura de terrazas con tráfico intenso.',
      'Kit completo que incluye tirantes, clips de fijación y terminaciones.',
      'El precio corresponde a 1 metro lineal.'
    ],
    specs: [
      ['Material', 'WPC macizo ELM'],
      ['Tipo', 'Perfil estructural'],
      ['Incluye', 'Tirantes + clips + accesorios'],
      ['Resistencia al agua', '100%'],
      ['Tipo de uso', 'Estructura / Terrazas premium'],
    ]
  },
  'tirante-wpc-30x40mm': {
    text: [
      'Perfil estructural hueco de WPC (Wood Plastic Composite) de sección 30×40 mm, marca Kolertech.',
      'Ideal para armar la subestructura de decks, revestimientos de fachada y cielorrasos.',
      'Resistente al agua, hongos y pudrición. Sin mantenimiento. Se corta a medida con sierra común.',
      'El precio corresponde a 1 metro lineal.'
    ],
    specs: [
      ['Material', 'WPC (madera + plástico)'],
      ['Sección', '30 × 40 mm'],
      ['Tipo', 'Perfil hueco estructural'],
      ['Resistencia al agua', '100%'],
      ['Anti-hongos / pudrición', 'Sí'],
      ['Tipo de uso', 'Estructura / Exterior'],
      ['Colores', 'Jade, Chocolate, Basic'],
    ]
  },
  'cesped-sintetico-premium': {
    text: [
      'Césped Sintético PREMIUM Garden Style. Calidad premium de 20mm de altura de fibra.',
      'Aspecto natural, no requiere riego ni corte. Resistente a rayos UV, lluvia y tráfico intenso.',
      'Ideal para jardines, balcones, terrazas, jardines de infantes y espacios comerciales.',
      'El precio corresponde a 1 m². Se vende en rollos desde 0,5m de largo hasta 25m.'
    ],
    specs: [
      ['Marca', 'Garden Style'],
      ['Altura de fibra', '20 mm'],
      ['Ancho rollo', '2 m'],
      ['Largo mínimo', '0,5 m'],
      ['Largo máximo', '25 m (sin unión)'],
      ['Tipo de uso', 'Interior / Exterior'],
      ['Anti-UV', 'Sí'],
    ]
  },

  // ── Placas PVC – colores ──────────────────────────────────────────────────
  'placa-pvc-carrara': {
    base: 'placa-pvc-simil-marmol',
    textExtra: ['Color Carrara: mármol clásico blanco con vetas grises naturales. El diseño más elegante y atemporal de la línea. Perfecto para baños, cocinas y living.']
  },
  'placa-pvc-carrara-black': {
    base: 'placa-pvc-simil-marmol',
    textExtra: ['Color Carrara Black: fondo oscuro profundo con vetas doradas y grises. Sofisticación máxima para ambientes de lujo y locales premium.']
  },
  'placa-pvc-marmol-blanco': {
    base: 'placa-pvc-simil-marmol',
    textExtra: ['Color Mármol Blanco: blanco nacarado con vetas sutiles. Luminoso y atemporal. Amplía visualmente cualquier espacio.']
  },
  'placa-pvc-marmol-negro': {
    base: 'placa-pvc-simil-marmol',
    textExtra: ['Color Mármol Negro: negro profundo con vetas doradas. Elegancia absoluta para TV walls, fondos de cama y locales de alto impacto.']
  },
  'placa-pvc-all-white': {
    base: 'placa-pvc-simil-marmol',
    textExtra: ['Color All White: blanco liso y puro, sin vetas. Minimalismo total. Ideal para diseños donde el color es protagonista o para espacios reducidos.']
  },
  'placa-pvc-all-black': {
    base: 'placa-pvc-simil-marmol',
    textExtra: ['Color All Black: negro liso y mate. Contraste dramático para TV walls, locales y ambientes modernos de alto impacto visual.']
  },
  'placa-pvc-gray': {
    base: 'placa-pvc-simil-marmol',
    textExtra: ['Color Gray: gris cemento liso. Estilo industrial y contemporáneo. Combina perfecto con maderas, metales y cualquier paleta de color.']
  },
  'placa-pvc-jura-beige': {
    base: 'placa-pvc-simil-piedra',
    textExtra: ['Color Jura Beige: piedra Jura en tono beige cálido. Textura natural con vetas pronunciadas. Ideal para paredes de acento y baños con estilo rústico-moderno.']
  },
  'placa-pvc-jura-gray': {
    base: 'placa-pvc-simil-piedra',
    textExtra: ['Color Jura Gray: piedra Jura en gris frío. Textura rústica con elegancia contemporánea. Sin juntas visibles, impermeable, fácil instalación.']
  },
  'placa-pvc-mica': {
    base: 'placa-pvc-simil-marmol',
    textExtra: ['Color Mica: efecto mica con destellos metalizados sutiles. Único y exclusivo. Para ambientes que buscan un look diferente y lujoso sin perder sobriedad.']
  },

  // ── Placas 3D ────────────────────────────────────────────────────────────
  'placa-3d': {
    text: [
      'Placa 3D de PVC Kolertech. Diseño en relieve que crea efectos de luz y sombra únicos según el ángulo de la iluminación.',
      'Se instala fácil con adhesivo sobre cualquier pared lisa. Liviana y pintable con pintura látex de cualquier color.',
      'Transforma cualquier pared en minutos. Sin obra, sin humedad, sin olor. El precio corresponde a 1 unidad de 50 × 50 cm.'
    ],
    specs: [
      ['Material', 'PVC de alta calidad'],
      ['Medidas', '50 × 50 cm'],
      ['Superficie', '0,25 m² / unidad'],
      ['Espesor relieve', '~5 mm'],
      ['Pintable', 'Sí - pintura látex cualquier color'],
      ['Instalación', 'Adhesivo Atenneas o Sika'],
      ['Tipo de uso', 'Interior'],
    ]
  },

  // ── Piso Vinílico SPC Click ───────────────────────────────────────────────
  'spc-click': {
    text: [
      'Piso Vinílico SPC Click Kolertech. Núcleo de piedra (Stone Plastic Composite) de 4,8 mm. Tecnología alemana.',
      '100% impermeable, flotante, sin adhesivo. Sistema de click europeo de alta resistencia. Apto para calefacción por piso radiante.',
      'Resistente a rayados, manchas y tráfico intenso. Sin VOC ni formaldehído. El precio corresponde a 1 caja (~2,2 m²).'
    ],
    specs: [
      ['Material núcleo', 'SPC (Stone Plastic Composite)'],
      ['Espesor total', '4,8 mm'],
      ['Capa de desgaste', '0,3 mm'],
      ['Dimensión tablón', '1220 × 183 mm'],
      ['Por caja', '~2,2 m²'],
      ['Instalación', 'Click flotante - sin adhesivo'],
      ['Apto baños', 'Sí (100% impermeable)'],
      ['Radiant heat', 'Sí'],
      ['Clase', 'AC4 / Residencial / Comercial ligero'],
    ]
  },

  // ── Tirantes WPC nuevos ───────────────────────────────────────────────────
  'tirante-wpc-90-40mm': {
    text: [
      'Perfil WPC acanalado de sección 90×40 mm de Kolertech. La opción más resistente para decks y revestimientos de fachada.',
      'WPC (Wood Plastic Composite): madera + plástico. Simil madera, no se astilla, no se pudre, no requiere pintura.',
      'Resistente a rayos UV, lluvia, humedad y sal. Apto uso exterior. Incluye tapas terminales y clips de fijación.'
    ],
    specs: [
      ['Material', 'WPC (Wood Plastic Composite)'],
      ['Sección', '90 × 40 mm'],
      ['Largo', '3 metros'],
      ['Superficie acanalada', 'Sí (doble cara)'],
      ['Colores disponibles', 'Almond, Jade, Peach, Black'],
      ['Instalación', 'Clips ocultos + tornillo'],
      ['Tipo de uso', 'Exterior / Interior'],
      ['Mantenimiento', 'Nulo - no pinta ni trata'],
    ]
  },
  'tirante-wpc-30-40mm': {
    base: 'tirante-wpc-30x40mm'
  },

  // ── Molduras ─────────────────────────────────────────────────────────────
  'moldura': {
    text: [
      'Moldura decorativa de EPS (poliestireno expandido) para la unión techo-pared. Marca Bliss.',
      'Liviana, fácil de instalar con adhesivo Atenneas o Sika. Se puede pintar del color que quieras con pintura látex.',
      'Da terminación profesional a cualquier ambiente. No requiere experiencia — la instala cualquier persona. El precio es por metro lineal.'
    ],
    specs: [
      ['Material', 'EPS (Poliestireno Expandido)'],
      ['Pintable', 'Sí - pintura látex cualquier color'],
      ['Instalación', 'Adhesivo Atenneas o Sika'],
      ['Tipo de uso', 'Interior'],
    ]
  },
};

function getProductDescription(title) {
  const key = title
    .toLowerCase()
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
  // Direct match
  if (PRODUCT_DESCRIPTIONS[key]) return PRODUCT_DESCRIPTIONS[key];
  // Partial match
  const found = Object.entries(PRODUCT_DESCRIPTIONS).find(([k]) => key.includes(k) || k.includes(key));
  if (found) return found[1];
  return null;
}

function renderFullDesc(descData, fallbackText) {
  if (!descData) return `<p>${fallbackText}</p>`;
  const base = descData.base ? PRODUCT_DESCRIPTIONS[descData.base] : descData;
  const texts = [...(base.text || []), ...(descData.textExtra || [])];
  const specs = base.specs || [];

  let html = texts.map(t => `<p>${t}</p>`).join('');
  if (specs.length) {
    html += '<ul class="pm-specs-list">' +
      specs.map(([k, v]) => `<li><strong>${k}:</strong> ${v}</li>`).join('') +
      '</ul>';
  }
  return html;
}

/* ===== PRODUCT DETAIL MODAL ===== */
function initProductModal() {
  const overlay = document.getElementById('productModal');
  if (!overlay) return;

  const pmClose    = document.getElementById('pmClose');
  const pmImg      = document.getElementById('pmImg');
  const pmCat      = document.getElementById('pmCategory');
  const pmName     = document.getElementById('pmName');
  const pmFullDesc = document.getElementById('pmFullDesc');
  const pmSpecs    = document.getElementById('pmSpecs');
  const pmColors   = document.getElementById('pmColors');
  const pmPrice    = document.getElementById('pmPrice');
  const pmUnit     = document.getElementById('pmUnit');
  const pmAdd      = document.getElementById('pmAddBtn');
  const pmWa       = document.getElementById('pmWaBtn');

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
    const wLabel    = document.getElementById('pmCalcWLabel');
    const hLabel    = document.getElementById('pmCalcHLabel');
    const areaLabel = document.getElementById('pmCalcAreaLabel');
    const calcBtn   = document.getElementById('pmCalcBtn');
    const calcRes   = document.getElementById('pmCalcResult');

    const cat       = card.dataset.category || '';
    const priceEl   = card.querySelector('.card-price');
    const priceRaw  = (priceEl?.textContent || '').replace(/[$.\s]/g, '').replace(/,/g, '');
    const unitPrice = parseInt(priceRaw) || 0;
    const title     = card.querySelector('.card-title')?.textContent || 'Producto';
    const imgSrc    = card.querySelector('.card-image-wrap img')?.src || '';

    // Determine calc mode by category
    let mode, cov = null;
    if (cat.startsWith('tirante')) {
      mode = 'tirante';
    } else if (cat === 'zocalos' || cat === 'molduras') {
      mode = 'perimetro';
      cov  = parseCoverage(card);
    } else if (cat === 'pisos' || cat === 'pisos-flotantes') {
      mode = 'piso';
      cov  = parseCoverage(card);
    } else {
      cov = parseCoverage(card);
      if (!cov) { calcBox.style.display = 'none'; return; }
      mode = cov.type === 'ml' ? 'ml' : 'pared';
    }

    calcBox.style.display = '';
    [wInput, hInput, areaInput, mlInput].forEach(inp => { if (inp) inp.value = ''; });
    calcRes.innerHTML = '';
    calcRes.classList.remove('show');

    // Show/hide input groups and set labels
    if (mode === 'ml') {
      m2Inputs.style.display = 'none';
      mlInputs.style.display = '';
    } else {
      m2Inputs.style.display = '';
      mlInputs.style.display = 'none';
      const LABELS = {
        tirante:   ['Ancho de superficie (m)', 'Alto / Largo (m)', 'Área aprox.'],
        perimetro: ['Largo del ambiente (m)',  'Ancho del ambiente (m)', 'Perímetro (m)'],
        piso:      ['Largo del ambiente (m)',  'Ancho del ambiente (m)', 'm² totales'],
        pared:     ['Ancho de pared (m)',      'Alto de pared (m)',      'm² totales'],
      };
      const [wl, hl, al] = LABELS[mode] || LABELS.pared;
      if (wLabel) wLabel.textContent = wl;
      if (hLabel) hLabel.textContent = hl;
      if (areaLabel) areaLabel.textContent = al;
    }

    // Auto-fill third field from the two inputs
    function syncArea() {
      const w = parseFloat(wInput?.value) || 0;
      const h = parseFloat(hInput?.value) || 0;
      if (w > 0 && h > 0 && areaInput)
        areaInput.value = mode === 'perimetro'
          ? (2 * (w + h)).toFixed(2)
          : (w * h).toFixed(2);
    }
    wInput?.removeEventListener('input', syncArea);
    hInput?.removeEventListener('input', syncArea);
    wInput?.addEventListener('input', syncArea);
    hInput?.addEventListener('input', syncArea);

    function pushCart(qty, unit, plural) {
      const existing = cart.find(it => it.name === title);
      if (existing) existing.qty = qty;
      else cart.push({ name: title, price: unitPrice, img: imgSrc, unit, qty });
      renderCart();
      showToast(`✦ ${qty} ${plural} de "${title}" agregadas`);
      closeModal();
    }

    calcBtn.onclick = () => {
      const w    = parseFloat(wInput?.value)    || 0;
      const h    = parseFloat(hInput?.value)    || 0;
      const area = parseFloat(areaInput?.value) || 0;
      const ml   = parseFloat(mlInput?.value)   || 0;

      if (mode === 'tirante') {
        if (!w || !h) return;
        const tw     = 0.04; // 40 mm tirante width
        const rows   = Math.ceil(h / (tw * 2));
        const rawMl  = rows * w;
        const orderMl = Math.ceil(rawMl * 1.05 * 10) / 10;
        const total   = Math.ceil(orderMl) * unitPrice;
        calcRes.innerHTML = `
          <div class="pm-calc-res-row"><span>Ancho × Alto</span><span>${w} × ${h} m</span></div>
          <div class="pm-calc-res-row"><span>Filas de tirantes</span><span>${rows} filas</span></div>
          <div class="pm-calc-res-row"><span>Metros lineales (+5%)</span><span>${orderMl} m</span></div>
          <div class="pm-calc-res-row total"><span>Total material</span><span>${formatPrice(total)}</span></div>
          <button class="pm-calc-add-qty" id="pmCalcAddQty">+ Agregar ${orderMl} m al carrito</button>`;
        calcRes.classList.add('show');
        document.getElementById('pmCalcAddQty')?.addEventListener('click', () =>
          pushCart(Math.ceil(orderMl), 'm', 'm'));

      } else if (mode === 'perimetro') {
        if (!w || !h) return;
        const perim  = 2 * (w + h);
        const unitMl = cov?.coverage || 1;
        const qty    = Math.ceil((perim / unitMl) * 1.1);
        const total  = qty * unitPrice;
        const pl     = cov?.plural || 'm';
        calcRes.innerHTML = `
          <div class="pm-calc-res-row"><span>Largo × Ancho</span><span>${w} × ${h} m</span></div>
          <div class="pm-calc-res-row"><span>Perímetro del ambiente</span><span>${perim.toFixed(2)} m</span></div>
          <div class="pm-calc-res-row"><span>${pl} necesarias (+10%)</span><span>${qty} ${pl}</span></div>
          <div class="pm-calc-res-row total"><span>Total material</span><span>${formatPrice(total)}</span></div>
          <button class="pm-calc-add-qty" id="pmCalcAddQty">+ Agregar ${qty} ${pl} al carrito</button>`;
        calcRes.classList.add('show');
        document.getElementById('pmCalcAddQty')?.addEventListener('click', () =>
          pushCart(qty, cov?.unit || 'm', pl));

      } else if (mode === 'piso' || mode === 'pared') {
        if (!area) return;
        const coverage = cov?.coverage || 1;
        const qty      = coverage === 1
          ? Math.ceil(area * 1.1)
          : Math.ceil((area / coverage) * 1.1);
        const total  = qty * unitPrice;
        const pl     = cov?.plural || 'm²';
        const label  = mode === 'piso' ? 'Área del ambiente' : 'Área de pared';
        calcRes.innerHTML = `
          <div class="pm-calc-res-row"><span>${label}</span><span>${area} m²</span></div>
          <div class="pm-calc-res-row"><span>${pl} necesarias (+10%)</span><span>${qty} ${pl}</span></div>
          <div class="pm-calc-res-row total"><span>Total material</span><span>${formatPrice(total)}</span></div>
          <button class="pm-calc-add-qty" id="pmCalcAddQty">+ Agregar ${qty} ${pl} al carrito</button>`;
        calcRes.classList.add('show');
        document.getElementById('pmCalcAddQty')?.addEventListener('click', () =>
          pushCart(qty, cov?.unit || 'm²', pl));

      } else if (mode === 'ml') {
        if (!ml) return;
        const coverage = cov?.coverage || 1;
        const qty      = Math.ceil((ml / coverage) * 1.05);
        const total    = qty * unitPrice;
        const pl       = cov?.plural || 'm';
        calcRes.innerHTML = `
          <div class="pm-calc-res-row"><span>Metros a cubrir</span><span>${ml} m</span></div>
          <div class="pm-calc-res-row"><span>${pl} necesarias (+5%)</span><span>${qty} ${pl}</span></div>
          <div class="pm-calc-res-row total"><span>Total material</span><span>${formatPrice(total)}</span></div>
          <button class="pm-calc-add-qty" id="pmCalcAddQty">+ Agregar ${qty} ${pl} al carrito</button>`;
        calcRes.classList.add('show');
        document.getElementById('pmCalcAddQty')?.addEventListener('click', () =>
          pushCart(qty, cov?.unit || 'm', pl));
      }
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
    pmPrice.textContent = priceEl ? priceEl.textContent : '';
    pmUnit.textContent  = unitEl  ? unitEl.textContent  : '';

    // Full description from CB Group data or fallback to card desc
    const descData = getProductDescription(title);
    pmFullDesc.innerHTML = renderFullDesc(descData, desc);

    // Specs chips (only show if no full desc with built-in specs)
    pmSpecs.innerHTML = '';
    if (!descData) {
      card.querySelectorAll('.card-spec').forEach(s => {
        const el = document.createElement('span');
        el.className = 'pm-spec-chip';
        el.textContent = s.textContent;
        pmSpecs.appendChild(el);
      });
    }

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
    if (lenisInstance) lenisInstance.stop();
  }

  function closeModal() {
    overlay.classList.remove('open');
    overlay.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
    if (lenisInstance) lenisInstance.start();
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

/* ===== SIMULADOR DE AMBIENTES ===== */

const SIM_CATALOG = {
  // --- Paredes interiores ---
  'wi-dark':    { label: 'Wall Panel Oscuro',     img: 'Wall panel interior/dark panel.jpg',   price: 22699, m2: 0.36, surfaces: ['pared','techo'] },
  'wi-gray':    { label: 'Wall Panel Gris',        img: 'Wall panel interior/gray panel.jpg',   price: 22699, m2: 0.36, surfaces: ['pared','techo'] },
  'wi-sand':    { label: 'Wall Panel Arena',       img: 'Wall panel interior/sand.jpg',         price: 22699, m2: 0.36, surfaces: ['pared','techo'] },
  'wi-white':   { label: 'Wall Panel Blanco',      img: 'Wall panel interior/White.jpg',        price: 22699, m2: 0.36, surfaces: ['pared','techo'] },
  'wi-walnut':  { label: 'Wall Panel Nogal',       img: 'Wall panel interior/wallnut panel.jpg',price: 22699, m2: 0.36, surfaces: ['pared','techo'] },
  'wi-wfine':   { label: 'Wall Panel Nogal Fino',  img: 'Wall panel interior/Wallnut Fine.jpg', price: 22699, m2: 0.36, surfaces: ['pared','techo'] },
  'wi-black':   { label: 'Wall Panel Negro',       img: 'Wall panel interior/Black new.jpg',    price: 22699, m2: 0.36, surfaces: ['pared','techo'] },
  // --- Paredes exteriores ---
  'we-almond':  { label: 'Ext. Almond',            img: 'Wall panel Exterior/Almond.jpg',       price: 66767, m2: 0.36, surfaces: ['pared'] },
  'we-jade':    { label: 'Ext. Jade',              img: 'Wall panel Exterior/Jade.jpg',         price: 66767, m2: 0.36, surfaces: ['pared'] },
  'we-peach':   { label: 'Ext. Peach',             img: 'Wall panel Exterior/Peach.jpg',        price: 66767, m2: 0.36, surfaces: ['pared'] },
  'we-maple':   { label: 'Ext. Maple Wood',        img: 'Wall panel Exterior/Maple Wood.jpg',   price: 66767, m2: 0.36, surfaces: ['pared'] },
  // --- Placas PVC ---
  'pm-mblanco': { label: 'Mármol Blanco',          img: 'Placas de pvc/marmol blanco.jpg',      price: 81238, m2: 3.42, surfaces: ['pared','techo'] },
  'pm-mnegro':  { label: 'Mármol Negro',           img: 'Placas de pvc/marmol negro.jpg',       price: 81238, m2: 3.42, surfaces: ['pared','techo'] },
  'pm-carrara': { label: 'Mármol Carrara',         img: 'Placas de pvc/carrara.jpg',            price: 81238, m2: 3.42, surfaces: ['pared','techo'] },
  'pm-gray':    { label: 'Placa Gris',             img: 'Placas de pvc/gray.jpg',               price: 81238, m2: 3.42, surfaces: ['pared','techo'] },
  'pm-white':      { label: 'Placa All White',     img: 'Placas de pvc/all white.jpg',          price: 81238, m2: 3.42, surfaces: ['pared','techo'] },
  'pm-ablack':     { label: 'Placa All Black',     img: 'Placas de pvc/All Black.jpg',          price: 81238, m2: 3.42, surfaces: ['pared','techo'] },
  'pm-travertino': { label: 'Travertino',          img: 'Placas de pvc/jura beige.jpg',         price: 81238, m2: 3.42, surfaces: ['pared','techo'] },
  // --- Placas 3D ---
  'p3-ondas':   { label: '3D Ondas',               img: 'Placas 3D/ondas.jpg',                  price:  6895, m2: 0.25, surfaces: ['pared'] },
  'p3-rombo':   { label: '3D Rombo',               img: 'Placas 3D/rombo.jpg',                  price:  6895, m2: 0.25, surfaces: ['pared'] },
  'p3-lineas':  { label: '3D Líneas',              img: 'Placas 3D/LINEAS.jpg',                 price:  6895, m2: 0.25, surfaces: ['pared'] },
  // --- Pisos ---
  'pv-ashdark': { label: 'Piso Ash Dark',          img: 'Pisos Vinilicos/ash dark.jpg',         price: 36381, m2: 1, surfaces: ['piso'] },
  'pv-ashgray': { label: 'Piso Ash Gray',          img: 'Pisos Vinilicos/ash gray.jpg',         price: 36381, m2: 1, surfaces: ['piso'] },
  'pv-roble':   { label: 'Piso Roble Classic',     img: 'Pisos Vinilicos/Roble classic.jpg',    price: 36381, m2: 1, surfaces: ['piso'] },
  'pv-castano': { label: 'Piso Castaño Matiz',     img: 'Pisos Vinilicos/castaño matiz.jpg',    price: 36381, m2: 1, surfaces: ['piso'] },
  'pv-lgray':   { label: 'Piso Light Gray',        img: 'Pisos Vinilicos/Light Gray.jpg',       price: 36381, m2: 1, surfaces: ['piso'] },
  'pv-obsidian':{ label: 'Piso Obsidian White',    img: 'Pisos Vinilicos/Obsidian White.jpg',   price: 36381, m2: 1, surfaces: ['piso'] },
  'pv-cotton':  { label: 'Piso Soft Cotton',       img: 'Pisos Vinilicos/Soft Cotton.jpg',      price: 36381, m2: 1, surfaces: ['piso'] },
  'pv-marfil':  { label: 'Piso Marfil White',      img: 'Pisos Vinilicos/marfil White.jpg',     price: 36381, m2: 1, surfaces: ['piso'] },
  'pv-paraiso': { label: 'Piso Paraíso',           img: 'Pisos Vinilicos/paraiso.jpg',          price: 36381, m2: 1, surfaces: ['piso'] },
  // --- Zócalos ---
  'z7-blanco':  { label: 'Zócalo EPS 7cm Blanco',  img: 'Zocalos eps/Zocalo Eps Blanco 7 cm + clip.jpg', price: 6005,  ml: 1, perMl: true, surfaces: ['zocalo'] },
  'z10-blanco': { label: 'Zócalo EPS 10cm Blanco', img: 'Zocalos eps/Zocalo Eps Blanco 7 cm + clip.jpg', price: 9968,  ml: 1, perMl: true, surfaces: ['zocalo'] },
};

const SIM_COMBOS = [
  { name: 'Moderno Oscuro',   pared: 'wi-dark',    techo: 'wi-black',    piso: 'pv-ashdark', zocalo: 'z7-blanco'  },
  { name: 'Natural Madera',   pared: 'wi-walnut',  techo: 'wi-wfine',    piso: 'pv-roble',   zocalo: 'z7-blanco'  },
  { name: 'Lujo Mármol',      pared: 'pm-mnegro',  techo: 'pm-mblanco',  piso: 'pv-obsidian',zocalo: 'z10-blanco' },
  { name: 'Minimalista',      pared: 'wi-white',   techo: 'pm-white',    piso: 'pv-lgray',   zocalo: 'z7-blanco'  },
  { name: 'Nórdico Gris',     pared: 'wi-gray',    techo: 'wi-gray',     piso: 'pv-cotton',  zocalo: 'z7-blanco'  },
];

function initSimulator() {
  const overlay   = document.getElementById('simOverlay');
  const openBtn   = document.getElementById('simOpenBtn');
  const closeBtn  = document.getElementById('simClose');
  if (!overlay || !openBtn) return;

  const selParedes  = document.getElementById('selParedes');
  const selTecho    = document.getElementById('selTecho');
  const selPiso     = document.getElementById('selPiso');
  const selZocalo   = document.getElementById('selZocalo');
  const thumbParedes = document.getElementById('thumbParedes');
  const thumbTecho   = document.getElementById('thumbTecho');
  const thumbPiso    = document.getElementById('thumbPiso');
  const thumbZocalo  = document.getElementById('thumbZocalo');
  const budget       = document.getElementById('simBudget');
  const combosList   = document.getElementById('simCombosList');
  const waBtn        = document.getElementById('simWaBtn');
  const cartBtn      = document.getElementById('simCartBtn');

  const anchoIn = document.getElementById('simAncho');
  const largoIn = document.getElementById('simLargo');
  const altoIn  = document.getElementById('simAlto');

  // --- populate selects ---
  function buildSelect(sel, surfaces) {
    sel.innerHTML = '<option value="">— Sin revestimiento</option>';
    const groups = {
      'Wall Panel Interior': [],
      'Wall Panel Exterior': [],
      'Placas PVC': [],
      'Placas 3D': [],
      'Pisos Vinílicos': [],
      'Zócalos': [],
    };
    Object.entries(SIM_CATALOG).forEach(([key, p]) => {
      if (!p.surfaces.some(s => surfaces.includes(s))) return;
      if (key.startsWith('wi-') || key.startsWith('we-')) {
        const g = key.startsWith('wi-') ? 'Wall Panel Interior' : 'Wall Panel Exterior';
        groups[g].push({ key, label: p.label });
      } else if (key.startsWith('pm-') || key.startsWith('p3-')) {
        groups['Placas PVC'].push({ key, label: p.label });
      } else if (key.startsWith('pv-')) {
        groups['Pisos Vinílicos'].push({ key, label: p.label });
      } else if (key.startsWith('z')) {
        groups['Zócalos'].push({ key, label: p.label });
      }
    });
    Object.entries(groups).forEach(([gname, items]) => {
      if (!items.length) return;
      const og = document.createElement('optgroup');
      og.label = gname;
      items.forEach(({ key, label }) => {
        const opt = document.createElement('option');
        opt.value = key;
        opt.textContent = label;
        og.appendChild(opt);
      });
      sel.appendChild(og);
    });
  }

  buildSelect(selParedes, ['pared']);
  buildSelect(selTecho,   ['techo']);
  buildSelect(selPiso,    ['piso']);
  buildSelect(selZocalo,  ['zocalo']);

  // --- combo buttons ---
  SIM_COMBOS.forEach((combo, i) => {
    const btn = document.createElement('button');
    btn.className = 'sim-combo-btn';
    btn.textContent = combo.name;
    btn.addEventListener('click', () => {
      selParedes.value  = combo.pared  || '';
      selTecho.value    = combo.techo  || '';
      selPiso.value     = combo.piso   || '';
      selZocalo.value   = combo.zocalo || '';
      document.querySelectorAll('.sim-combo-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      updateRoom();
      updateBudget();
    });
    combosList.appendChild(btn);
  });

  // --- Canvas image cache & renderer ---
  const _imgCache = {};
  function simGetImg(src) {
    if (!src) return null;
    if (_imgCache[src]) return _imgCache[src].complete ? _imgCache[src] : null;
    const img = new Image();
    _imgCache[src] = img;
    img.onload  = () => renderSimCanvas(simCanvas, ancho(), largo(), alto(), selParedes.value, selTecho.value, selPiso.value);
    img.onerror = () => {};
    img.src = src;
    return null;
  }

  const simCanvas = document.getElementById('simCanvas');

  function ancho() { return parseFloat(anchoIn.value) || 4; }
  function largo() { return parseFloat(largoIn.value) || 5; }
  function alto()  { return parseFloat(altoIn.value)  || 2.6; }

  function updateRoom() {
    renderSimCanvas(simCanvas, ancho(), largo(), alto(), selParedes.value, selTecho.value, selPiso.value);

    // Thumbnails
    const applyThumb = (thumb, key) => {
      const prod = SIM_CATALOG[key];
      if (prod && prod.img) {
        thumb.style.backgroundImage = `url('${prod.img}')`;
        thumb.style.backgroundColor = '';
      } else {
        thumb.style.backgroundImage = 'none';
        thumb.style.backgroundColor = '#181510';
      }
    };
    applyThumb(thumbParedes, selParedes.value);
    applyThumb(thumbTecho,   selTecho.value);
    applyThumb(thumbPiso,    selPiso.value);
    applyThumb(thumbZocalo,  selZocalo.value);
  }

  function renderSimCanvas(cv, aw, dpt, ht, wallKey, ceilKey, floorKey) {
    if (!cv) return;
    const ctx = cv.getContext('2d');
    const W = cv.width, H = cv.height;

    const wallProd  = SIM_CATALOG[wallKey];
    const ceilProd  = SIM_CATALOG[ceilKey];
    const floorProd = SIM_CATALOG[floorKey];
    const wallImg  = wallProd  ? simGetImg(wallProd.img)  : null;
    const ceilImg  = ceilProd  ? simGetImg(ceilProd.img)  : null;
    const floorImg = floorProd ? simGetImg(floorProd.img) : null;

    // Clear
    ctx.fillStyle = '#090805';
    ctx.fillRect(0, 0, W, H);

    // Back wall rect — size proportional to room dimensions
    const maxBwW = W * 0.52, maxBwH = H * 0.60;
    const s = Math.min(maxBwW / aw, maxBwH / ht);
    const bwW = aw * s, bwH = ht * s;
    const bwL = (W - bwW) / 2;
    const bwR = bwL + bwW;
    const bwT = (H - bwH) * 0.38;   // slightly above centre (eye level ~38%)
    const bwB = bwT + bwH;

    // One-point perspective faces
    // Floor — back edge = back wall bottom, front edge = canvas bottom
    const floor    = [{x:bwL,y:bwB},{x:bwR,y:bwB},{x:W*1.05,y:H*1.05},{x:-W*0.05,y:H*1.05}];
    // Left wall — inner edge = back wall left, outer edge = canvas left
    const leftWall = [{x:0,y:0},{x:bwL,y:bwT},{x:bwL,y:bwB},{x:0,y:H}];
    // Right wall — inner edge = back wall right, outer edge = canvas right
    const rightWall= [{x:bwR,y:bwT},{x:W,y:0},{x:W,y:H},{x:bwR,y:bwB}];
    // Ceiling — back edge = back wall top, front edge = canvas top
    const ceiling  = [{x:0,y:0},{x:W,y:0},{x:bwR,y:bwT},{x:bwL,y:bwT}];
    // Back wall — straight rectangle
    const backWall = [{x:bwL,y:bwT},{x:bwR,y:bwT},{x:bwR,y:bwB},{x:bwL,y:bwB}];

    // Darken side faces slightly vs back wall
    const _fill = (poly, img, dark) => simFillQuad(ctx, poly, img, dark);
    _fill(ceiling,   ceilImg,  '#0f0e0c');
    _fill(leftWall,  wallImg,  '#141210');
    _fill(rightWall, wallImg,  '#161412');
    _fill(backWall,  wallImg,  '#1d1a15');
    _fill(floor,     floorImg, '#0c0b09');

    // Gold edge lines
    ctx.strokeStyle = 'rgba(201,162,94,0.22)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.strokeRect(bwL + 0.5, bwT + 0.5, bwW, bwH);
    ctx.moveTo(bwL, bwT); ctx.lineTo(0, 0);
    ctx.moveTo(bwR, bwT); ctx.lineTo(W, 0);
    ctx.moveTo(bwL, bwB); ctx.lineTo(0, H);
    ctx.moveTo(bwR, bwB); ctx.lineTo(W, H);
    ctx.stroke();

    // Dim overlay on side faces for depth feel
    const grad = ctx.createLinearGradient(0, 0, W * 0.28, 0);
    grad.addColorStop(0, 'rgba(0,0,0,0.35)');
    grad.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = grad;
    ctx.beginPath();
    [{x:0,y:0},{x:bwL,y:bwT},{x:bwL,y:bwB},{x:0,y:H}].forEach((p,i)=>i?ctx.lineTo(p.x,p.y):ctx.moveTo(p.x,p.y));
    ctx.closePath(); ctx.fill();

    const grad2 = ctx.createLinearGradient(W, 0, W * 0.72, 0);
    grad2.addColorStop(0, 'rgba(0,0,0,0.20)');
    grad2.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = grad2;
    ctx.beginPath();
    [{x:bwR,y:bwT},{x:W,y:0},{x:W,y:H},{x:bwR,y:bwB}].forEach((p,i)=>i?ctx.lineTo(p.x,p.y):ctx.moveTo(p.x,p.y));
    ctx.closePath(); ctx.fill();
  }

  function simFillQuad(ctx, poly, img, fallback) {
    ctx.save();
    ctx.beginPath();
    poly.forEach((p,i) => i ? ctx.lineTo(p.x,p.y) : ctx.moveTo(p.x,p.y));
    ctx.closePath();
    if (img && img.complete && img.naturalWidth > 0) {
      ctx.clip();
      const iW = img.naturalWidth, iH = img.naturalHeight;
      simTexTri(ctx, img, poly[0],poly[1],poly[2], 0,0, iW,0, iW,iH);
      simTexTri(ctx, img, poly[0],poly[2],poly[3], 0,0, iW,iH, 0,iH);
    } else {
      ctx.fillStyle = fallback;
      ctx.fill();
    }
    ctx.restore();
  }

  function simTexTri(ctx, img, p0,p1,p2, u0,v0, u1,v1, u2,v2) {
    const d = (u1-u0)*(v2-v0)-(u2-u0)*(v1-v0);
    if (Math.abs(d) < 0.001) return;
    const a = ((p1.x-p0.x)*(v2-v0)-(p2.x-p0.x)*(v1-v0))/d;
    const b = ((p2.x-p0.x)*(u1-u0)-(p1.x-p0.x)*(u2-u0))/d;
    const c = p0.x - a*u0 - b*v0;
    const dd= ((p1.y-p0.y)*(v2-v0)-(p2.y-p0.y)*(v1-v0))/d;
    const e = ((p2.y-p0.y)*(u1-u0)-(p1.y-p0.y)*(u2-u0))/d;
    const f = p0.y - dd*u0 - e*v0;
    ctx.save();
    ctx.transform(a, dd, b, e, c, f);
    ctx.drawImage(img, 0, 0);
    ctx.restore();
  }

  // --- budget ---
  function fmt(n) {
    return '$ ' + Math.round(n).toLocaleString('es-AR');
  }

  function updateBudget() {
    const ancho = parseFloat(anchoIn.value) || 4;
    const largo = parseFloat(largoIn.value) || 5;
    const alto  = parseFloat(altoIn.value)  || 2.6;

    const paredKey  = selParedes.value;
    const techoKey  = selTecho.value;
    const pisoKey   = selPiso.value;
    const zocaloKey = selZocalo.value;

    const rows = [];

    if (paredKey && SIM_CATALOG[paredKey]) {
      const p = SIM_CATALOG[paredKey];
      const m2Paredes = 2 * (ancho + largo) * alto;
      const unidades  = Math.ceil(m2Paredes / p.m2) * (1 + 0.1);
      const total     = Math.ceil(m2Paredes / p.m2 * 1.1) * p.price;
      rows.push({ surface: 'Paredes', label: p.label, qty: m2Paredes.toFixed(1) + ' m²', total });
    }

    if (techoKey && SIM_CATALOG[techoKey]) {
      const p = SIM_CATALOG[techoKey];
      const m2Techo = ancho * largo;
      const total   = Math.ceil(m2Techo / p.m2 * 1.05) * p.price;
      rows.push({ surface: 'Techo', label: p.label, qty: m2Techo.toFixed(1) + ' m²', total });
    }

    if (pisoKey && SIM_CATALOG[pisoKey]) {
      const p = SIM_CATALOG[pisoKey];
      const m2Piso = ancho * largo;
      const total  = Math.ceil(m2Piso / p.m2 * 1.05) * p.price;
      rows.push({ surface: 'Piso', label: p.label, qty: m2Piso.toFixed(1) + ' m²', total });
    }

    if (zocaloKey && SIM_CATALOG[zocaloKey]) {
      const p = SIM_CATALOG[zocaloKey];
      const perim = 2 * (ancho + largo);
      const total = Math.ceil(perim * 1.05) * p.price;
      rows.push({ surface: 'Zócalo', label: p.label, qty: perim.toFixed(1) + ' m', total });
    }

    if (!rows.length) {
      budget.innerHTML = '<p class="sim-budget-empty">Seleccioná productos para ver el presupuesto</p>';
      return;
    }

    const grandTotal = rows.reduce((sum, r) => sum + r.total, 0);

    let html = '<table class="sim-budget-table"><thead><tr><th>Superficie</th><th>Cant.</th><th>Subtotal</th></tr></thead><tbody>';
    rows.forEach(r => {
      html += `<tr>
        <td>
          <div style="font-weight:600">${r.surface}</div>
          <div class="sim-budget-row-surface">${r.label}</div>
        </td>
        <td style="white-space:nowrap;padding-right:8px">${r.qty}</td>
        <td>${fmt(r.total)}</td>
      </tr>`;
    });
    html += '</tbody></table>';
    html += `<div class="sim-budget-total">
      <span class="sim-budget-total-label">Total estimado</span>
      <span class="sim-budget-total-val">${fmt(grandTotal)}</span>
    </div>`;
    budget.innerHTML = html;
  }

  // --- event listeners ---
  [selParedes, selTecho, selPiso, selZocalo].forEach(sel => {
    sel.addEventListener('change', () => {
      document.querySelectorAll('.sim-combo-btn').forEach(b => b.classList.remove('active'));
      updateRoom();
      updateBudget();
    });
  });

  [anchoIn, largoIn, altoIn].forEach(inp => {
    inp.addEventListener('input', () => {
      updateRoom();
      updateBudget();
    });
  });

  // --- WhatsApp ---
  waBtn.addEventListener('click', () => {
    const ancho = parseFloat(anchoIn.value) || 4;
    const largo = parseFloat(largoIn.value) || 5;
    const alto  = parseFloat(altoIn.value)  || 2.6;
    const lines = [
      `Hola Estilo Revestido! Estoy usando el simulador y me gustaría un presupuesto para mi ambiente:`,
      `📐 Medidas: ${ancho}m × ${largo}m × ${alto}m`,
    ];
    const pKeys = [
      ['Paredes', selParedes.value],
      ['Techo',   selTecho.value],
      ['Piso',    selPiso.value],
      ['Zócalo',  selZocalo.value],
    ];
    pKeys.forEach(([surf, key]) => {
      if (key && SIM_CATALOG[key]) lines.push(`${surf}: ${SIM_CATALOG[key].label}`);
    });
    const msg = encodeURIComponent(lines.join('\n'));
    window.open(`https://wa.me/5492215551234?text=${msg}`, '_blank');
  });

  // --- Add to cart ---
  cartBtn.addEventListener('click', () => {
    const ancho = parseFloat(anchoIn.value) || 4;
    const largo = parseFloat(largoIn.value) || 5;
    const alto  = parseFloat(altoIn.value)  || 2.6;

    const additions = [
      { key: selParedes.value,  qty: Math.ceil(2*(ancho+largo)*alto / (SIM_CATALOG[selParedes.value]?.m2||1) * 1.1) },
      { key: selTecho.value,    qty: Math.ceil(ancho*largo / (SIM_CATALOG[selTecho.value]?.m2||1) * 1.05) },
      { key: selPiso.value,     qty: Math.ceil(ancho*largo / (SIM_CATALOG[selPiso.value]?.m2||1) * 1.05) },
      { key: selZocalo.value,   qty: Math.ceil(2*(ancho+largo) * 1.05) },
    ];

    let added = 0;
    additions.forEach(({ key, qty }) => {
      if (!key || !SIM_CATALOG[key]) return;
      // find matching PRODUCT_PRICES key (best effort by label match)
      const simProd = SIM_CATALOG[key];
      // Map sim keys to cart product keys
      const simToCart = {
        'wi-dark':'wall-interior','wi-gray':'wall-interior','wi-sand':'wall-interior',
        'wi-white':'wall-interior','wi-walnut':'wall-interior','wi-wfine':'wall-interior','wi-black':'wall-interior',
        'we-almond':'wall-exterior','we-jade':'wall-exterior','we-peach':'wall-exterior','we-maple':'wall-exterior',
        'pm-mblanco':'placa-marmol','pm-mnegro':'placa-marmol','pm-carrara':'placa-marmol',
        'pm-gray':'placa-marmol','pm-white':'placa-marmol','pm-ablack':'placa-marmol',
        'p3-ondas':'placa-3d','p3-rombo':'placa-3d','p3-lineas':'placa-3d',
        'pv-ashdark':'piso-vinilico','pv-ashgray':'piso-vinilico','pv-roble':'piso-vinilico',
        'pv-castano':'piso-vinilico','pv-lgray':'piso-vinilico','pv-obsidian':'piso-vinilico',
        'pv-cotton':'piso-vinilico','pv-marfil':'piso-vinilico','pv-paraiso':'piso-vinilico',
        'z7-blanco':'zocalo-7','z10-blanco':'zocalo-10',
      };
      const cartKey = simToCart[key];
      if (cartKey && typeof addToCart === 'function') {
        addToCart(cartKey, qty);
        added++;
      }
    });
    if (added > 0) {
      cartBtn.textContent = '✓ Agregado';
      setTimeout(() => { cartBtn.textContent = '+ Carrito'; }, 2000);
    }
  });

  // --- open / close ---
  function openSim() {
    overlay.classList.add('active');
    overlay.setAttribute('aria-hidden', 'false');
    if (lenisInstance) lenisInstance.stop();
    updateRoom();
    updateBudget();
  }
  function closeSim() {
    overlay.classList.remove('active');
    overlay.setAttribute('aria-hidden', 'true');
    if (lenisInstance) lenisInstance.start();
  }

  // Prevent Lenis from intercepting wheel events inside the panel
  const simPanel = overlay.querySelector('.sim-panel');
  simPanel.addEventListener('wheel', e => e.stopPropagation(), { passive: true });
  simPanel.addEventListener('touchmove', e => e.stopPropagation(), { passive: true });

  openBtn.addEventListener('click', openSim);
  closeBtn.addEventListener('click', closeSim);
  overlay.addEventListener('click', e => { if (e.target === overlay) closeSim(); });
  document.addEventListener('keydown', e => { if (e.key === 'Escape' && overlay.classList.contains('active')) closeSim(); });

  // default render
  updateRoom();
}


/* ===== SIMULA TU FOTO ===== */
function initPhotoSim() {

  /* ---- Texture config per product ---- */
  const SF_CFG = {
    'wi-dark':    { crop:true },  'wi-gray':    { crop:true },
    'wi-sand':    { crop:true },  'wi-white':   { crop:true },
    'wi-walnut':  { crop:true },  'wi-wfine':   { crop:true },
    'wi-black':   { crop:true },
    'we-almond':  { skip:true },  'we-jade':    { skip:true },
    'we-peach':   { skip:true },  'we-maple':   { skip:true },
    'pm-mblanco': { crop:false }, 'pm-mnegro':  { crop:false },
    'pm-carrara': { skip:true },  'pm-gray':    { crop:false },
    'pm-white':      { crop:false }, 'pm-ablack':     { crop:false },
    'pm-travertino': { crop:false },
    'p3-ondas':   { crop:false }, 'p3-rombo':   { crop:false },
    'p3-lineas':  { crop:false },
    'pv-ashdark': { crop:true },  'pv-ashgray': { crop:true },
    'pv-roble':   { crop:true },  'pv-castano': { crop:true },
    'pv-lgray':   { crop:true },  'pv-obsidian':{ crop:true },
    'pv-cotton':  { crop:true },  'pv-marfil':  { crop:true },
    'pv-paraiso': { crop:true },
    'z7-blanco':  { skip:true },  'z10-blanco': { skip:true },
  };
  // Standard insert crop for composite images (right ~30% in white box)
  const CROP = { sx:0.60, sy:0.09, sw:0.30, sh:0.83 };

  /* ---- DOM refs ---- */
  const dropZone    = document.getElementById('sfDropZone');
  const fileInput   = document.getElementById('sfFileInput');
  const uploadBtn   = document.getElementById('sfUploadBtn');
  const canvasWrap  = document.getElementById('sfCanvasWrap');
  const canvas      = document.getElementById('sfCanvas');
  const ctx         = canvas.getContext('2d');
  const instrEl     = document.getElementById('sfInstruction');
  const undoBtn     = document.getElementById('sfUndoBtn');
  const resetPoly   = document.getElementById('sfResetPoly');
  const newPhotoBtn = document.getElementById('sfNewPhoto');
  const prodCol     = document.getElementById('sfProdCol');
  const catBar      = document.getElementById('sfCatBar');
  const prodGrid    = document.getElementById('sfProdGrid');
  const opacityRow  = document.getElementById('sfOpacityRow');
  const opacitySlider = document.getElementById('sfOpacity');
  const opacityValEl  = document.getElementById('sfOpacityVal');
  const resultBar   = document.getElementById('sfResultBar');
  const zonesList   = document.getElementById('sfZonesList');
  const addZoneBtn  = document.getElementById('sfBtnAddZone');
  const changeBtn   = document.getElementById('sfBtnChange');
  const repolyBtn   = document.getElementById('sfBtnNewPoly');
  const dlBtn       = document.getElementById('sfBtnDownload');
  const sfWaBtn     = document.getElementById('sfBtnWa');
  const stepEls     = [0,1,2,3].map(i => document.getElementById('sfBar'+i));

  /* ---- State ---- */
  let photoImg  = null;
  // Completed zones: [{pts:[{x,y}*4], key:string, tex:HTMLCanvasElement|null}]
  let layers    = [];
  let draftPts  = [];        // polygon being drawn (0-4 pts)
  let editLayer = -1;        // index of layer whose pts we're dragging (-1 = draft)
  let dragPtIdx = -1;        // which point is being dragged
  let activeLayer = -1;      // which layer is "selected" in zones list
  const N = 16;

  /* ---- Step bar ---- */
  function setPhase(p) {
    stepEls.forEach((el,i) => el.classList.toggle('sf-step-active', i === p));
  }

  /* ---- Upload ---- */
  uploadBtn.addEventListener('click', e => { e.stopPropagation(); fileInput.click(); });
  dropZone.addEventListener('click', () => fileInput.click());
  dropZone.addEventListener('dragover', e => { e.preventDefault(); dropZone.classList.add('sf-drag-over'); });
  dropZone.addEventListener('dragleave', () => dropZone.classList.remove('sf-drag-over'));
  dropZone.addEventListener('drop', e => {
    e.preventDefault(); dropZone.classList.remove('sf-drag-over');
    const f = e.dataTransfer.files[0];
    if (f && f.type.startsWith('image/')) loadFile(f);
  });
  fileInput.addEventListener('change', () => { if (fileInput.files[0]) loadFile(fileInput.files[0]); });

  function loadFile(file) {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      photoImg = img; URL.revokeObjectURL(url);
      layers = []; draftPts = []; editLayer = -1; dragPtIdx = -1; activeLayer = -1;
      setupCanvas();
      dropZone.classList.add('sf-hidden');
      canvasWrap.classList.remove('sf-hidden');
      prodCol.classList.remove('sf-hidden');
      resultBar.classList.add('sf-hidden');
      zonesList.classList.add('sf-hidden');
      opacityRow.classList.add('sf-hidden');
      setPhase(1); updateInstr(); render();
      buildProdGrid('all');
    };
    img.src = url;
  }

  function setupCanvas() {
    const maxW = canvasWrap.clientWidth || 700;
    canvas.width  = maxW;
    canvas.height = Math.round(maxW * photoImg.naturalHeight / photoImg.naturalWidth);
    canvas.style.height = canvas.height + 'px';
  }

  newPhotoBtn.addEventListener('click', () => {
    photoImg = null; layers = []; draftPts = [];
    canvasWrap.classList.add('sf-hidden');
    prodCol.classList.add('sf-hidden');
    resultBar.classList.add('sf-hidden');
    zonesList.classList.add('sf-hidden');
    opacityRow.classList.add('sf-hidden');
    dropZone.classList.remove('sf-hidden');
    setPhase(0); fileInput.value = '';
  });

  undoBtn.addEventListener('click', () => {
    if (!draftPts.length) return;
    draftPts.pop(); render(); updateInstr();
  });
  resetPoly.addEventListener('click', () => {
    draftPts = []; editLayer = -1; dragPtIdx = -1;
    render(); updateInstr(); setPhase(layers.length ? 3 : 1);
  });

  /* ---- Texture prep ---- */
  const _imgCache = {};
  function loadImg(src) {
    if (_imgCache[src]) return _imgCache[src];
    const im = new Image();
    _imgCache[src] = im;
    im.src = src;
    return im;
  }

  function makeCroppedCanvas(img, needsCrop) {
    if (!needsCrop || !img.complete || !img.naturalWidth) return null;
    const c = CROP;
    const sw = Math.round(img.naturalWidth  * c.sw);
    const sh = Math.round(img.naturalHeight * c.sh);
    if (sw < 1 || sh < 1) return null;
    const tmp = document.createElement('canvas');
    tmp.width = sw; tmp.height = sh;
    tmp.getContext('2d').drawImage(img,
      Math.round(img.naturalWidth  * c.sx),
      Math.round(img.naturalHeight * c.sy),
      sw, sh, 0, 0, sw, sh);
    return tmp;
  }

  /* ---- Product grid ---- */
  function buildProdGrid(cat) {
    prodGrid.innerHTML = '';
    const activeKey = activeLayer >= 0 ? layers[activeLayer].key : null;
    Object.entries(SIM_CATALOG).forEach(([key, prod]) => {
      const cfg = SF_CFG[key] || {};
      if (cfg.skip) return;
      if (cat !== 'all' && !prod.surfaces.includes(cat)) return;
      const thumb = document.createElement('div');
      thumb.className = 'sf-prod-thumb' + (key === activeKey ? ' sf-prod-selected' : '');
      const img = document.createElement('img');
      img.src = prod.img; img.alt = prod.label; img.loading = 'lazy';
      const lbl = document.createElement('div');
      lbl.className = 'sf-prod-thumb-label';
      lbl.textContent = prod.label;
      thumb.appendChild(img); thumb.appendChild(lbl);
      thumb.addEventListener('click', () => selectProduct(key));
      prodGrid.appendChild(thumb);
    });
  }
  buildProdGrid('all');

  catBar.addEventListener('click', e => {
    const btn = e.target.closest('.sf-cat-btn');
    if (!btn) return;
    catBar.querySelectorAll('.sf-cat-btn').forEach(b => b.classList.remove('sf-cat-active'));
    btn.classList.add('sf-cat-active');
    buildProdGrid(btn.dataset.cat);
  });

  // Try loading textures/[key].jpg → .png → .webp in order; calls cb(img) or cb(null)
  function tryLoadTexture(key, cb) {
    const exts = ['jpg', 'png', 'webp'];
    let i = 0;
    function next() {
      if (i >= exts.length) { cb(null); return; }
      const img = new Image();
      img.onload = () => cb(img);
      img.onerror = () => { i++; next(); };
      img.src = 'textures/' + key + '.' + exts[i++];
    }
    next();
  }

  function selectProduct(key) {
    if (draftPts.length < 4 && activeLayer < 0) {
      instrEl.style.color = 'var(--gold)';
      instrEl.textContent = 'Primero marcá los 4 rincones de la superficie';
      setTimeout(() => { instrEl.style.color = ''; updateInstr(); }, 2500);
      return;
    }
    const cfg  = SF_CFG[key] || {};
    const prod = SIM_CATALOG[key];

    const applyTex = (im) => {
      if (activeLayer >= 0) {
        layers[activeLayer].key = key;
        layers[activeLayer].tex = im;
      } else {
        layers.push({ pts: draftPts.slice(), key, tex: im });
        draftPts = [];
        activeLayer = layers.length - 1;
      }
      opacityRow.classList.remove('sf-hidden');
      resultBar.classList.remove('sf-hidden');
      zonesList.classList.remove('sf-hidden');
      setPhase(3);
      updateZonesList();
      buildProdGrid(catBar.querySelector('.sf-cat-active')?.dataset.cat || 'all');
      render();
    };

    // 1. Try dedicated flat texture image first (textures/[key].jpg|png|webp)
    tryLoadTexture(key, (texImg) => {
      if (texImg) {
        applyTex(texImg);
        return;
      }
      // 2. Fall back to catalog image + auto-crop
      const rawImg = loadImg(prod.img);
      const finalize = (im) => {
        const cropped = makeCroppedCanvas(im, cfg.crop);
        applyTex(cropped || im);
      };
      if (rawImg.complete && rawImg.naturalWidth) finalize(rawImg);
      else { rawImg.onload = () => finalize(rawImg); rawImg.onerror = () => finalize(rawImg); }
    });
  }

  /* ---- Zones list ---- */
  function updateZonesList() {
    zonesList.innerHTML = '';
    layers.forEach((layer, idx) => {
      const prod = SIM_CATALOG[layer.key];
      const chip = document.createElement('div');
      chip.className = 'sf-zone-chip' + (idx === activeLayer ? ' sf-zone-active' : '');
      const sw = document.createElement('img');
      sw.className = 'sf-zone-swatch';
      sw.src = prod ? prod.img : '';
      sw.alt = '';
      const nm = document.createElement('span');
      nm.className = 'sf-zone-name';
      nm.textContent = (idx+1) + '. ' + (prod ? prod.label : '?');
      const del = document.createElement('button');
      del.className = 'sf-zone-del';
      del.textContent = '✕';
      del.title = 'Eliminar zona';
      del.addEventListener('click', e => {
        e.stopPropagation();
        layers.splice(idx, 1);
        if (activeLayer >= layers.length) activeLayer = layers.length - 1;
        if (!layers.length) {
          activeLayer = -1;
          resultBar.classList.add('sf-hidden');
          zonesList.classList.add('sf-hidden');
          opacityRow.classList.add('sf-hidden');
          setPhase(1);
        }
        updateZonesList();
        buildProdGrid(catBar.querySelector('.sf-cat-active')?.dataset.cat || 'all');
        render();
      });
      chip.appendChild(sw); chip.appendChild(nm); chip.appendChild(del);
      chip.addEventListener('click', () => {
        activeLayer = idx;
        updateZonesList();
        buildProdGrid(catBar.querySelector('.sf-cat-active')?.dataset.cat || 'all');
        render();
      });
      zonesList.appendChild(chip);
    });
  }

  /* ---- Canvas pointer ---- */
  function canvasPos(e) {
    const r = canvas.getBoundingClientRect();
    const sx = canvas.width  / r.width;
    const sy = canvas.height / r.height;
    const src = e.touches ? e.touches[0] : e;
    return { x: (src.clientX - r.left) * sx, y: (src.clientY - r.top) * sy };
  }

  function hitLayerPoint(pos) {
    const r = canvas.getBoundingClientRect();
    const R = 16 * (canvas.width / r.width);
    for (let li = layers.length-1; li >= 0; li--) {
      for (let pi = 0; pi < layers[li].pts.length; pi++) {
        const p = layers[li].pts[pi];
        const dx = p.x - pos.x, dy = p.y - pos.y;
        if (dx*dx + dy*dy < R*R) return { li, pi };
      }
    }
    return null;
  }

  function hitDraftPoint(pos) {
    const r = canvas.getBoundingClientRect();
    const R = 16 * (canvas.width / r.width);
    for (let i = 0; i < draftPts.length; i++) {
      const p = draftPts[i];
      const dx = p.x - pos.x, dy = p.y - pos.y;
      if (dx*dx + dy*dy < R*R) return i;
    }
    return -1;
  }

  canvas.addEventListener('mousedown', e => {
    const pos = canvasPos(e);
    // Try dragging a completed layer's point
    const lhit = hitLayerPoint(pos);
    if (lhit) {
      editLayer = lhit.li; dragPtIdx = lhit.pi;
      activeLayer = lhit.li;
      updateZonesList();
      buildProdGrid(catBar.querySelector('.sf-cat-active')?.dataset.cat || 'all');
      return;
    }
    // Try dragging a draft point
    const dhit = hitDraftPoint(pos);
    if (dhit >= 0) { editLayer = -1; dragPtIdx = dhit; return; }
    // Add new draft point
    if (draftPts.length < 4) {
      draftPts.push(pos); render(); updateInstr();
      if (draftPts.length === 4) { setPhase(2); instrEl.textContent = 'Ahora elegí un material de la lista'; }
    }
  });

  canvas.addEventListener('mousemove', e => {
    if (dragPtIdx < 0) return;
    const pos = canvasPos(e);
    if (editLayer >= 0 && editLayer < layers.length) {
      layers[editLayer].pts[dragPtIdx] = pos;
    } else {
      draftPts[dragPtIdx] = pos;
    }
    render();
  });

  const endDrag = () => { dragPtIdx = -1; editLayer = -1; };
  canvas.addEventListener('mouseup',    endDrag);
  canvas.addEventListener('mouseleave', endDrag);

  canvas.addEventListener('touchstart', e => {
    e.preventDefault();
    const pos = canvasPos(e);
    const lhit = hitLayerPoint(pos);
    if (lhit) { editLayer = lhit.li; dragPtIdx = lhit.pi; activeLayer = lhit.li; updateZonesList(); return; }
    const dhit = hitDraftPoint(pos);
    if (dhit >= 0) { editLayer = -1; dragPtIdx = dhit; return; }
    if (draftPts.length < 4) {
      draftPts.push(pos); render(); updateInstr();
      if (draftPts.length === 4) { setPhase(2); instrEl.textContent = 'Ahora elegí un material de la lista'; }
    }
  }, { passive: false });

  canvas.addEventListener('touchmove', e => {
    e.preventDefault();
    if (dragPtIdx < 0) return;
    const pos = canvasPos(e);
    if (editLayer >= 0 && editLayer < layers.length) layers[editLayer].pts[dragPtIdx] = pos;
    else draftPts[dragPtIdx] = pos;
    render();
  }, { passive: false });

  canvas.addEventListener('touchend', endDrag);

  opacitySlider.addEventListener('input', () => {
    opacityValEl.textContent = opacitySlider.value + '%';
    render();
  });

  /* ---- Render ---- */
  function render() {
    if (!photoImg) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(photoImg, 0, 0, canvas.width, canvas.height);
    const alpha = parseInt(opacitySlider.value) / 100;
    layers.forEach(layer => {
      if (layer.tex && layer.pts.length === 4) applyTex(ctx, layer.tex, layer.pts, alpha);
    });
    // Overlay for all layers
    layers.forEach((layer, idx) => drawPolyOverlay(layer.pts, idx === activeLayer, idx+1));
    // Draft overlay
    if (draftPts.length) drawPolyOverlay(draftPts, false, layers.length+1, true);
  }

  function applyTex(tCtx, texImg, poly, alpha) {
    const iW = texImg.naturalWidth || texImg.width;
    const iH = texImg.naturalHeight || texImg.height;

    // Pass 1: render stretched texture to offscreen canvas (source-over — correctly covers dark objects)
    const tmp = document.createElement('canvas');
    tmp.width = tCtx.canvas.width;
    tmp.height = tCtx.canvas.height;
    const tc2 = tmp.getContext('2d');
    tc2.imageSmoothingEnabled = true;
    tc2.imageSmoothingQuality = 'high';

    for (let j = 0; j < N; j++) {
      for (let i = 0; i < N; i++) {
        const s0=i/N, t0=j/N, s1=(i+1)/N, t1=(j+1)/N;
        const p00=sfBilerp(poly,s0,t0), p10=sfBilerp(poly,s1,t0);
        const p11=sfBilerp(poly,s1,t1), p01=sfBilerp(poly,s0,t1);
        sfTexTri(tc2, texImg, p00,p10,p11, s0*iW,t0*iH, s1*iW,t0*iH, s1*iW,t1*iH);
        sfTexTri(tc2, texImg, p00,p11,p01, s0*iW,t0*iH, s1*iW,t1*iH, s0*iW,t1*iH);
      }
    }

    // Pass 2: apply room luminance to texture via 'luminosity' blend
    // Texture keeps its hue+saturation (its color identity); room photo provides the brightness.
    // This adapts the material to room lighting without burning dark areas to black.
    tc2.save();
    tc2.beginPath();
    poly.forEach((p, i) => i ? tc2.lineTo(p.x, p.y) : tc2.moveTo(p.x, p.y));
    tc2.closePath();
    tc2.clip();
    // Fade luminosity blend to 0 as opacity reaches 100% — at full intensity show pure texture color.
    // Below 80% stays at 0.60 (existing look); above 80% ramps down to 0 at 100%.
    const lumAlpha = Math.min(0.60, Math.max(0, 0.60 * (1 - alpha) / 0.20));
    tc2.globalAlpha = lumAlpha;
    tc2.globalCompositeOperation = 'luminosity';
    tc2.drawImage(photoImg, 0, 0, tmp.width, tmp.height);
    tc2.restore();

    // Composite final result onto main canvas at user-chosen opacity
    tCtx.save();
    tCtx.globalAlpha = alpha;
    tCtx.drawImage(tmp, 0, 0);
    tCtx.restore();
  }

  function sfBilerp(poly, s, t) {
    const top = { x: poly[0].x + s*(poly[1].x-poly[0].x), y: poly[0].y + s*(poly[1].y-poly[0].y) };
    const bot = { x: poly[3].x + s*(poly[2].x-poly[3].x), y: poly[3].y + s*(poly[2].y-poly[3].y) };
    return { x: top.x + t*(bot.x-top.x), y: top.y + t*(bot.y-top.y) };
  }

  function sfTexTri(tCtx, img, p0,p1,p2, u0,v0,u1,v1,u2,v2) {
    const d = (u1-u0)*(v2-v0)-(u2-u0)*(v1-v0);
    if (Math.abs(d) < 0.001) return;
    const a  = ((p1.x-p0.x)*(v2-v0)-(p2.x-p0.x)*(v1-v0))/d;
    const b  = ((p2.x-p0.x)*(u1-u0)-(p1.x-p0.x)*(u2-u0))/d;
    const c  = p0.x - a*u0 - b*v0;
    const dd = ((p1.y-p0.y)*(v2-v0)-(p2.y-p0.y)*(v1-v0))/d;
    const ee = ((p2.y-p0.y)*(u1-u0)-(p1.y-p0.y)*(u2-u0))/d;
    const ff = p0.y - dd*u0 - ee*v0;
    tCtx.save();
    tCtx.beginPath();
    tCtx.moveTo(p0.x,p0.y); tCtx.lineTo(p1.x,p1.y); tCtx.lineTo(p2.x,p2.y);
    tCtx.closePath(); tCtx.clip();
    tCtx.transform(a,dd,b,ee,c,ff);
    tCtx.drawImage(img,0,0);
    tCtx.restore();
  }

  function drawPolyOverlay(pts, isActive, zoneNum, isDraft) {
    if (!pts.length) return;
    ctx.save();
    const gold = 'rgba(201,162,94,' + (isActive ? '0.95' : '0.6') + ')';
    if (pts.length === 4 && !isDraft) {
      ctx.beginPath();
      pts.forEach((p,i) => i ? ctx.lineTo(p.x,p.y) : ctx.moveTo(p.x,p.y));
      ctx.closePath();
      ctx.strokeStyle = gold;
      ctx.lineWidth = isActive ? 2.5 : 1.5;
      ctx.setLineDash(isDraft ? [6,4] : []);
      ctx.stroke();
      ctx.setLineDash([]);
    } else {
      ctx.beginPath();
      pts.forEach((p,i) => i ? ctx.lineTo(p.x,p.y) : ctx.moveTo(p.x,p.y));
      ctx.setLineDash([6,4]);
      ctx.strokeStyle = gold;
      ctx.lineWidth = 2;
      ctx.stroke();
      ctx.setLineDash([]);
    }
    pts.forEach((p, i) => {
      ctx.beginPath();
      ctx.arc(p.x, p.y, isActive ? 8 : 5, 0, Math.PI*2);
      ctx.fillStyle = isActive ? '#C9A25E' : 'rgba(201,162,94,0.7)';
      ctx.fill();
      if (isActive) {
        ctx.strokeStyle = '#fff'; ctx.lineWidth = 1.5; ctx.stroke();
        ctx.fillStyle = '#080705';
        ctx.font = 'bold 9px Inter,sans-serif';
        ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.fillText(i+1, p.x, p.y);
      }
    });
    if (pts.length === 4 && !isDraft) {
      const cx = pts.reduce((s,p)=>s+p.x,0)/4, cy = pts.reduce((s,p)=>s+p.y,0)/4;
      ctx.fillStyle = isActive ? 'rgba(201,162,94,0.9)' : 'rgba(201,162,94,0.5)';
      ctx.font = `bold ${isActive?13:10}px Inter,sans-serif`;
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText('Z'+zoneNum, cx, cy);
    }
    ctx.restore();
  }

  function updateInstr() {
    const msgs = [
      'Click en el rincón superior-izquierdo de la pared',
      'Ahora el rincón superior-derecho',
      'Ahora el rincón inferior-derecho',
      'Por último el rincón inferior-izquierdo',
    ];
    instrEl.style.color = '';
    if (draftPts.length < 4) instrEl.textContent = msgs[draftPts.length];
    else instrEl.textContent = 'Elegí un material a la derecha · Arrastrá puntos para ajustar';
  }

  /* ---- Buttons ---- */
  addZoneBtn.addEventListener('click', () => {
    draftPts = []; editLayer = -1; activeLayer = -1;
    buildProdGrid(catBar.querySelector('.sf-cat-active')?.dataset.cat || 'all');
    setPhase(1); updateInstr(); render();
  });

  changeBtn.addEventListener('click', () => {
    // Re-select product for active layer
    if (activeLayer < 0 && layers.length) activeLayer = layers.length-1;
    buildProdGrid(catBar.querySelector('.sf-cat-active')?.dataset.cat || 'all');
  });

  repolyBtn.addEventListener('click', () => {
    if (activeLayer >= 0) {
      // Remove the active layer's polygon to redraw it
      draftPts = layers[activeLayer].pts.slice();
      layers.splice(activeLayer, 1);
      activeLayer = -1;
      if (!layers.length) { resultBar.classList.add('sf-hidden'); zonesList.classList.add('sf-hidden'); }
      updateZonesList();
    } else {
      draftPts = [];
    }
    editLayer = -1;
    setPhase(1); render(); updateInstr();
  });

  /* ---- Download ---- */
  function renderFinal(tgt) {
    const tc = tgt.getContext('2d');
    tc.drawImage(photoImg, 0, 0, tgt.width, tgt.height);
    const alpha = parseInt(opacitySlider.value)/100;
    // Scale layers pts to tgt size
    const sx = tgt.width / canvas.width, sy = tgt.height / canvas.height;
    layers.forEach(layer => {
      if (!layer.tex || layer.pts.length < 4) return;
      const scaledPts = layer.pts.map(p => ({x:p.x*sx, y:p.y*sy}));
      applyTex(tc, layer.tex, scaledPts, alpha);
    });
  }

  dlBtn.addEventListener('click', () => {
    const tmp = document.createElement('canvas');
    tmp.width = canvas.width; tmp.height = canvas.height;
    renderFinal(tmp);
    const a = document.createElement('a');
    a.href = tmp.toDataURL('image/jpeg', 0.92);
    a.download = 'estilo-revestido-simulacion.jpg';
    a.click();
  });

  sfWaBtn.addEventListener('click', () => {
    const names = layers.map(l => SIM_CATALOG[l.key]?.label).filter(Boolean);
    const prodNames = names.length ? names.join(' + ') : 'un revestimiento';
    const msg = `Hola! Usé el simulador de Estilo Revestido y me interesa: ${prodNames}. ¿Podrían asesorarme?`;
    window.open('https://wa.me/542214374605?text='+encodeURIComponent(msg), '_blank');
  });

  /* ---- Resize ---- */
  window.addEventListener('resize', () => {
    if (!photoImg || canvasWrap.classList.contains('sf-hidden')) return;
    const prevW = canvas.width, newW = canvasWrap.clientWidth;
    if (Math.abs(newW - prevW) < 2) return;
    const scale = newW / prevW;
    layers.forEach(l => { l.pts = l.pts.map(p => ({x:p.x*scale,y:p.y*scale})); });
    draftPts = draftPts.map(p => ({x:p.x*scale,y:p.y*scale}));
    setupCanvas(); render();
  });

  setPhase(0);
}

/* ===== INIT ===== */
document.addEventListener('DOMContentLoaded', () => {
  initLenis();
  initHeroVideoScrub();
  initFrameScrub();
  initNav();
  initReveal();
  initFilters();
  initCart();
  initCalculator();
  initProductModal();
  initShowcaseParallax();
  initSimulator();
  initPhotoSim();
  setTimeout(initTilt, 200);
});
