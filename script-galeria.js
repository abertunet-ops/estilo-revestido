/* ===== GALERIA — simulá tu foto ===== */

/* ===== SIMULA TU FOTO ===== */
function initPhotoSim() {
  if (!document.getElementById('sfCanvas')) return;

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
  initSlideshow();
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

document.addEventListener('DOMContentLoaded', () => {
  initPhotoSim();
});
