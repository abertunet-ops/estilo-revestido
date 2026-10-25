/* ===== INDEX — inicio ===== */

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

/* ===== FRAME SCROLL SCRUB ===== */
function initFrameScrub() {
  // Skip on mobile: 122 frames (~11 MB) would crush mobile network performance
  if (window.matchMedia('(max-width: 768px)').matches) return;
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
  let sectionTop = 0, sectionScrollable = 0;

  function cacheGeometry() {
    sectionTop        = section.getBoundingClientRect().top + window.scrollY;
    sectionScrollable = section.offsetHeight - window.innerHeight;
  }

  function resize() {
    // Leer antes de escribir para evitar forced reflow
    const w = canvas.offsetWidth  || window.innerWidth;
    const h = canvas.offsetHeight || window.innerHeight;
    W = canvas.width  = w;
    H = canvas.height = h;
    cacheGeometry();
    render();
  }

  function getProgress() {
    if (sectionScrollable <= 0) return 0;
    return Math.max(0, Math.min(1, (window.scrollY - sectionTop) / sectionScrollable));
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

  window.addEventListener('resize', resize, { passive: true });

  // Cargar frames en lotes cuando la sección se acerque al viewport
  const observer = new IntersectionObserver((entries) => {
    if (entries[0].isIntersecting) {
      observer.disconnect();
      const BATCH = 8;
      let i = 0;
      function loadBatch() {
        const end = Math.min(i + BATCH, TOTAL);
        for (; i < end; i++) {
          const n = String(i + 1).padStart(3, '0');
          const img = new Image();
          img.onload = () => { loaded++; if (loaded === 1) { resize(); } else { render(); } };
          img.src = `${BASE}${n}.jpg`;
          imgs[i] = img;
        }
        if (i < TOTAL) setTimeout(loadBatch, 0);
      }
      loadBatch();
    }
  }, { rootMargin: '150px' });
  observer.observe(section);

  resize();
}

/* ===== SHOWCASE PARALLAX ===== */
function initShowcaseParallax() {
  const items = document.querySelectorAll('.showcase-item');
  if (!items.length) return;

  items.forEach(item => {
    item._mx = 0;
    item._my = 0;
    item._bg = item.querySelector('.showcase-bg');
  });

  function getScrollY(rect) {
    const viewH = window.innerHeight;
    const progress = 1 - (rect.bottom / (viewH + rect.height));
    return (progress - 0.5) * 110;
  }

  function applyTransform(item, rect) {
    if (!item._bg) return;
    const r = rect || item.getBoundingClientRect();
    item._bg.style.transform = `translate(${item._mx}px, ${getScrollY(r) + item._my}px)`;
  }

  function onScroll() {
    // Primero todos los reads (un solo flush de layout)
    const rects = Array.from(items).map(item => item.getBoundingClientRect());
    // Luego todos los writes (sin forzar layout)
    items.forEach((item, i) => {
      const rect = rects[i];
      if (rect.bottom < 0 || rect.top > window.innerHeight) return;
      applyTransform(item, rect);
    });
  }

  items.forEach(item => {
    item.addEventListener('mousemove', e => {
      const rect = item.getBoundingClientRect();
      const x = (e.clientX - rect.left) / rect.width - 0.5;
      const y = (e.clientY - rect.top) / rect.height - 0.5;
      item._mx = x * 22;
      item._my = y * 14;
      applyTransform(item, rect);
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

document.addEventListener('DOMContentLoaded', () => {
  initSlideshow();
  initFrameScrub();
  initShowcaseParallax();
  initSimulator();
});
