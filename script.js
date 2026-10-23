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
  'tirante-acanalado':  { name: 'Tirante WPC Acanalado',           price: 168342, ml: 1,     unit: 'm', perMl: true },
  'tirante-elm':        { name: 'Tirante WPC ELM Macizo',          price: 174756, ml: 1,     unit: 'm', perMl: true },
  'tirante-wpc':        { name: 'Tirante WPC 30×40mm',            price: 103849, ml: 1,     unit: 'm', perMl: true },
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
