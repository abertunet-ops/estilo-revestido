import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

// Crop config for composite catalog images (right-side swatch insert)
const CROP = { sx: 0.60, sy: 0.09, sw: 0.30, sh: 0.83 };
const NEEDS_CROP = new Set([
  'wi-dark','wi-gray','wi-sand','wi-white','wi-walnut','wi-wfine','wi-black',
  'pv-ashdark','pv-ashgray','pv-roble','pv-castano','pv-lgray','pv-obsidian',
  'pv-cotton','pv-marfil','pv-paraiso',
]);
const SKIP_KEYS = new Set([
  'we-almond','we-jade','we-peach','we-maple','pm-carrara','z7-blanco','z10-blanco',
]);

// Surface-type → catalog surfaces[] filter
const SURFACE_FILTER = {
  floor: 'piso',
  ceiling: 'techo',
  'wall-back': 'pared',
  'wall-left': 'pared',
  'wall-right': 'pared',
};

class Sim3D {
  constructor(container) {
    this.container = container;
    this.selectables = [];
    this.selected = null;
    this.activeCat = 'all';

    this._initRenderer();
    this._initScene();
    this._initCamera();
    this._initLights();
    this._buildRoom();
    this._initControls();
    this._initEvents();
    this._animate();
  }

  _initRenderer() {
    this.renderer = new THREE.WebGLRenderer({ antialias: true });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.setSize(this.container.clientWidth, this.container.clientHeight);
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 0.95;
    this.container.appendChild(this.renderer.domElement);
  }

  _initScene() {
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x18181c);
    this.scene.fog = new THREE.Fog(0x18181c, 12, 22);
  }

  _initCamera() {
    const w = this.container.clientWidth;
    const h = this.container.clientHeight;
    this.camera = new THREE.PerspectiveCamera(52, w / h, 0.1, 30);
    this.camera.position.set(0, 1.65, 5.2);
    this.camera.lookAt(0, 1.2, 0);
  }

  _initLights() {
    this.scene.add(new THREE.AmbientLight(0xffffff, 0.55));

    const sun = new THREE.DirectionalLight(0xfff8f0, 1.1);
    sun.position.set(2.5, 5, 3);
    sun.castShadow = true;
    sun.shadow.mapSize.set(1024, 1024);
    const sc = sun.shadow.camera;
    sc.near = 0.5; sc.far = 20;
    sc.left = -7; sc.right = 7; sc.top = 7; sc.bottom = -7;
    this.scene.add(sun);

    const fill = new THREE.PointLight(0xffe0c8, 0.35, 9);
    fill.position.set(-2, 2.4, 1.5);
    this.scene.add(fill);
  }

  _buildRoom() {
    const W = 6, H = 2.75, D = 5;
    const stdMat = (hex) => new THREE.MeshStandardMaterial({
      color: hex, roughness: 0.85, metalness: 0.03,
    });

    // Floor
    this._addSurface(
      new THREE.PlaneGeometry(W, D),
      stdMat(0xc8bfb0),
      { x: -Math.PI / 2, y: 0, z: 0 },
      { x: 0, y: 0, z: 0 },
      'Piso', 'floor',
    );

    // Ceiling
    this._addSurface(
      new THREE.PlaneGeometry(W, D),
      stdMat(0xf2f0eb),
      { x: Math.PI / 2, y: 0, z: 0 },
      { x: 0, y: H, z: 0 },
      'Techo', 'ceiling',
    );

    // Back wall
    this._addSurface(
      new THREE.PlaneGeometry(W, H),
      stdMat(0xe8e2d8),
      { x: 0, y: 0, z: 0 },
      { x: 0, y: H / 2, z: -D / 2 },
      'Pared Fondo', 'wall-back',
    );

    // Left wall
    this._addSurface(
      new THREE.PlaneGeometry(D, H),
      stdMat(0xe4dfd5),
      { x: 0, y: Math.PI / 2, z: 0 },
      { x: -W / 2, y: H / 2, z: 0 },
      'Pared Izquierda', 'wall-left',
    );

    // Right wall
    this._addSurface(
      new THREE.PlaneGeometry(D, H),
      stdMat(0xe4dfd5),
      { x: 0, y: -Math.PI / 2, z: 0 },
      { x: W / 2, y: H / 2, z: 0 },
      'Pared Derecha', 'wall-right',
    );

    this._addFurniture(W, H, D);
  }

  _addSurface(geo, mat, rot, pos, label, id) {
    const mesh = new THREE.Mesh(geo, mat);
    mesh.rotation.set(rot.x, rot.y, rot.z);
    mesh.position.set(pos.x, pos.y, pos.z);
    mesh.receiveShadow = true;
    mesh.userData = { label, id, selectable: true };
    this.scene.add(mesh);
    this.selectables.push(mesh);
    return mesh;
  }

  _addFurniture(W, H, D) {
    const wood = new THREE.MeshStandardMaterial({ color: 0x9a7a40, roughness: 0.65, metalness: 0.08 });
    const stone = new THREE.MeshStandardMaterial({ color: 0xcac4be, roughness: 0.25, metalness: 0.12 });

    const add = (geo, mat, x, y, z, cast = true) => {
      const m = new THREE.Mesh(geo, mat);
      m.position.set(x, y, z);
      if (cast) m.castShadow = true;
      m.receiveShadow = true;
      this.scene.add(m);
    };

    // Lower cabinets along back wall
    add(new THREE.BoxGeometry(W * 0.68, 0.86, 0.54), wood, -0.45, 0.43, -D / 2 + 0.28);
    // Countertop
    add(new THREE.BoxGeometry(W * 0.68 + 0.08, 0.04, 0.60), stone, -0.45, 0.88, -D / 2 + 0.31);
    // Upper cabinets
    add(new THREE.BoxGeometry(W * 0.50, 0.66, 0.34), wood, -0.45, H - 0.38, -D / 2 + 0.18);

    // Island
    add(new THREE.BoxGeometry(1.75, 0.92, 0.92), wood, 1.6, 0.46, 0.4);
    add(new THREE.BoxGeometry(1.88, 0.04, 1.02), stone, 1.6, 0.94, 0.4);
  }

  _initControls() {
    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.07;
    this.controls.minDistance = 1.2;
    this.controls.maxDistance = 8.5;
    this.controls.maxPolarAngle = Math.PI * 0.76;
    this.controls.target.set(0, 1.2, 0);
    this.controls.update();
  }

  _initEvents() {
    this.raycaster = new THREE.Raycaster();
    this.pointer = new THREE.Vector2();
    this._pointerMoved = false;

    const el = this.renderer.domElement;
    el.addEventListener('pointerdown', () => { this._pointerMoved = false; });
    el.addEventListener('pointermove', () => { this._pointerMoved = true; });
    el.addEventListener('pointerup', (e) => {
      if (!this._pointerMoved) this._onPick(e);
    });

    window.addEventListener('resize', () => this._onResize());
  }

  _onPick(e) {
    const rect = this.renderer.domElement.getBoundingClientRect();
    this.pointer.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    this.pointer.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
    this.raycaster.setFromCamera(this.pointer, this.camera);
    const hits = this.raycaster.intersectObjects(this.selectables);
    if (hits.length) this._select(hits[0].object);
    else this._deselect();
  }

  _select(mesh) {
    if (this.selected && this.selected !== mesh) this._setEmissive(this.selected, false);
    this.selected = mesh;
    this._setEmissive(mesh, true);

    const nameEl = document.getElementById('s3d-surface-name');
    if (nameEl) nameEl.textContent = mesh.userData.label;

    const panel = document.getElementById('s3d-panel');
    if (panel) panel.classList.add('s3d-panel--active');

    this._buildGrid();
  }

  _deselect() {
    if (this.selected) this._setEmissive(this.selected, false);
    this.selected = null;
    const panel = document.getElementById('s3d-panel');
    if (panel) panel.classList.remove('s3d-panel--active');
    const nameEl = document.getElementById('s3d-surface-name');
    if (nameEl) nameEl.textContent = '';
  }

  _setEmissive(mesh, on) {
    mesh.material.emissive = new THREE.Color(on ? 0x3377ee : 0x000000);
    mesh.material.emissiveIntensity = on ? 0.18 : 0;
  }

  applyMaterial(key) {
    const mesh = this.selected;
    if (!mesh) return;

    const catalog = window.SIM_CATALOG || {};
    const prod = catalog[key];
    if (!prod) return;

    const tryTex = (src, crop) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        const canvas = document.createElement('canvas');
        if (crop) {
          canvas.width = Math.round(img.width * CROP.sw);
          canvas.height = Math.round(img.height * CROP.sh);
          canvas.getContext('2d').drawImage(
            img,
            img.width * CROP.sx, img.height * CROP.sy,
            img.width * CROP.sw, img.height * CROP.sh,
            0, 0, canvas.width, canvas.height,
          );
        } else {
          canvas.width = img.width;
          canvas.height = img.height;
          canvas.getContext('2d').drawImage(img, 0, 0);
        }
        const tex = new THREE.CanvasTexture(canvas);
        tex.wrapS = THREE.RepeatWrapping;
        tex.wrapT = THREE.RepeatWrapping;
        const id = mesh.userData.id;
        if (id === 'floor') tex.repeat.set(4, 3);
        else if (id === 'ceiling') tex.repeat.set(3, 2);
        else tex.repeat.set(3, 1.5);

        const prevMap = mesh.material.map;
        mesh.material = new THREE.MeshStandardMaterial({
          map: tex, roughness: 0.80, metalness: 0.04,
          emissive: new THREE.Color(0x3377ee), emissiveIntensity: 0.18,
        });
        if (prevMap) prevMap.dispose();
      };
      img.src = src;
    };

    // Try dedicated texture file first
    const texImg = new Image();
    texImg.onload = () => tryTex(texImg.src, false);
    texImg.onerror = () => tryTex(prod.img, NEEDS_CROP.has(key));
    texImg.src = 'textures/' + key + '.jpg';
  }

  _buildGrid() {
    const grid = document.getElementById('s3d-prod-grid');
    if (!grid) return;
    const catalog = window.SIM_CATALOG || {};
    const surfFilter = this.selected ? SURFACE_FILTER[this.selected.userData.id] : null;

    grid.innerHTML = '';

    Object.entries(catalog).forEach(([key, prod]) => {
      if (SKIP_KEYS.has(key)) return;
      if (surfFilter && !prod.surfaces.includes(surfFilter)) return;
      if (this.activeCat !== 'all') {
        const prefix = key.split('-')[0];
        if (prefix !== this.activeCat) return;
      }

      const btn = document.createElement('button');
      btn.className = 's3d-prod-btn';
      btn.title = prod.label;

      const img = document.createElement('img');
      img.src = prod.img;
      img.alt = prod.label;
      img.loading = 'lazy';
      btn.appendChild(img);

      const span = document.createElement('span');
      span.textContent = prod.label;
      btn.appendChild(span);

      btn.addEventListener('click', () => {
        grid.querySelectorAll('.s3d-prod-btn').forEach(b => b.classList.remove('s3d-prod-active'));
        btn.classList.add('s3d-prod-active');
        this.applyMaterial(key);
      });
      grid.appendChild(btn);
    });

    if (!grid.children.length) {
      grid.innerHTML = '<p class="s3d-hint">No hay productos para esta superficie en esta categoría.</p>';
    }
  }

  _animate() {
    requestAnimationFrame(() => this._animate());
    this.controls.update();
    this.renderer.render(this.scene, this.camera);
  }

  _onResize() {
    const w = this.container.clientWidth;
    const h = this.container.clientHeight;
    if (!w || !h) return;
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(w, h);
  }

  resetCamera() {
    this.camera.position.set(0, 1.65, 5.2);
    this.controls.target.set(0, 1.2, 0);
    this.controls.update();
  }
}

// --- Boot ---

let sim3d = null;

function boot() {
  const canvas = document.getElementById('s3d-canvas');
  if (!canvas || sim3d) return;
  sim3d = new Sim3D(canvas);

  // Category bar
  document.querySelectorAll('.s3d-cat-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.s3d-cat-btn').forEach(b => b.classList.remove('s3d-cat-active'));
      btn.classList.add('s3d-cat-active');
      if (sim3d) {
        sim3d.activeCat = btn.dataset.cat || 'all';
        if (sim3d.selected) sim3d._buildGrid();
      }
    });
  });

  document.getElementById('s3d-reset-cam')?.addEventListener('click', () => sim3d?.resetCamera());

  const waNum = '542214374605';
  document.getElementById('s3d-wa-btn')?.addEventListener('click', () => {
    const msg = 'Hola! Me interesa una cotización para los revestimientos que vi en el simulador 3D.';
    window.open(`https://wa.me/${waNum}?text=${encodeURIComponent(msg)}`, '_blank');
  });
}

// Boot immediately — the module is deferred, so DOM is ready
if (document.getElementById('simulador3D')) boot();
