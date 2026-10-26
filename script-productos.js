/* ===== PRODUCTOS — catálogo y herramientas ===== */

/* ===== FILTER BAR ===== */
function initFilters() {
  const btns = document.querySelectorAll('.filter-btn');
  const cards = document.querySelectorAll('.product-card[data-category]');

  function applyFilter(cat) {
    btns.forEach(b => b.classList.remove('active'));
    const active = document.querySelector(`.filter-btn[data-filter="${cat}"]`);
    if (active) active.classList.add('active');
    cards.forEach(card => {
      const show = cat === 'all' || card.dataset.category === cat;
      card.style.display = show ? '' : 'none';
    });
  }

  btns.forEach(btn => {
    btn.addEventListener('click', () => applyFilter(btn.dataset.filter));
  });

  // Activar filtro desde query param (ej: productos/?filtro=wall-interior)
  const filtro = new URLSearchParams(window.location.search).get('filtro');
  if (filtro && document.querySelector(`.filter-btn[data-filter="${filtro}"]`)) {
    applyFilter(filtro);
    const section = document.getElementById('productos');
    if (section) setTimeout(() => section.scrollIntoView({ behavior: 'smooth' }), 100);
  }
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
  'piedra-flexible':    { name: 'Piedra Natural Flexible',        price: 57030,  m2: 0.72,  unit: 'placa' },
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
    textExtra: ['Color Carrara: mármol clásico blanco con vetas grises naturales. El diseño más elegante y atemporal de la línea. Perfecto para baños, cocinas y living.'],
    specExtra: [['Color', 'Carrara']]
  },
  'placa-pvc-carrara-black': {
    base: 'placa-pvc-simil-marmol',
    textExtra: ['Color Carrara Black: fondo oscuro profundo con vetas doradas y grises. Sofisticación máxima para ambientes de lujo y locales premium.'],
    specExtra: [['Color', 'Carrara Black']]
  },
  'placa-pvc-marmol-blanco': {
    base: 'placa-pvc-simil-marmol',
    textExtra: ['Color Mármol Blanco: blanco nacarado con vetas sutiles. Luminoso y atemporal. Amplía visualmente cualquier espacio.'],
    specExtra: [['Color', 'Mármol Blanco']]
  },
  'placa-pvc-marmol-negro': {
    base: 'placa-pvc-simil-marmol',
    textExtra: ['Color Mármol Negro: negro profundo con vetas doradas. Elegancia absoluta para TV walls, fondos de cama y locales de alto impacto.'],
    specExtra: [['Color', 'Mármol Negro']]
  },
  'placa-pvc-all-white': {
    base: 'placa-pvc-simil-marmol',
    textExtra: ['Color All White: blanco liso y puro, sin vetas. Minimalismo total. Ideal para diseños donde el color es protagonista o para espacios reducidos.'],
    specExtra: [['Color', 'All White']]
  },
  'placa-pvc-all-black': {
    base: 'placa-pvc-simil-marmol',
    textExtra: ['Color All Black: negro liso y mate. Contraste dramático para TV walls, locales y ambientes modernos de alto impacto visual.'],
    specExtra: [['Color', 'All Black']]
  },
  'placa-pvc-gray': {
    base: 'placa-pvc-simil-marmol',
    textExtra: ['Color Gray: gris cemento liso. Estilo industrial y contemporáneo. Combina perfecto con maderas, metales y cualquier paleta de color.'],
    specExtra: [['Color', 'Gray']]
  },
  'placa-pvc-jura-beige': {
    base: 'placa-pvc-simil-piedra',
    textExtra: ['Color Jura Beige: piedra Jura en tono beige cálido. Textura natural con vetas pronunciadas. Ideal para paredes de acento y baños con estilo rústico-moderno.'],
    specExtra: [['Color', 'Jura Beige']]
  },
  'placa-pvc-jura-gray': {
    base: 'placa-pvc-simil-piedra',
    textExtra: ['Color Jura Gray: piedra Jura en gris frío. Textura rústica con elegancia contemporánea. Sin juntas visibles, impermeable, fácil instalación.'],
    specExtra: [['Color', 'Jura Gray']]
  },
  'placa-pvc-mica': {
    base: 'placa-pvc-simil-marmol',
    textExtra: ['Color Mica: efecto mica con destellos metalizados sutiles. Único y exclusivo. Para ambientes que buscan un look diferente y lujoso sin perder sobriedad.'],
    specExtra: [['Color', 'Mica']]
  },

  // ── Piedra Natural Flexible – colores ─────────────────────────────────────
  'piedra-natural-flexible-travertino': {
    base: 'piedra-natural-flexible',
    specExtra: [['Color', 'Travertino Beige']]
  },
  'piedra-natural-flexible-travertino-roma': {
    base: 'piedra-natural-flexible',
    textExtra: ['Travertino Roma: tonos cálidos terrosos con vetas naturales intensas. Cada placa es única e irrepetible.'],
    specExtra: [['Color', 'Travertino Roma']]
  },
  'piedra-natural-flexible-rust-gray': {
    base: 'piedra-natural-flexible',
    textExtra: ['Rust Gray: gris oxidado con tonalidades frías y textura rugosa auténtica. Ideal para ambientes industriales y modernos.'],
    specExtra: [['Color', 'Rust Gray']]
  },

  // ── Tirantes WPC 90×40 – colores ──────────────────────────────────────────
  'tirante-wpc-90-40mm-almond': {
    base: 'tirante-wpc-90-40mm',
    specExtra: [['Color', 'Almond']]
  },
  'tirante-wpc-90-40mm-jade': {
    base: 'tirante-wpc-90-40mm',
    specExtra: [['Color', 'Jade']]
  },
  'tirante-wpc-90-40mm-peach': {
    base: 'tirante-wpc-90-40mm',
    specExtra: [['Color', 'Peach']]
  },
  'tirante-wpc-90-40mm-black': {
    base: 'tirante-wpc-90-40mm',
    specExtra: [['Color', 'Black']]
  },

  // ── Tirantes WPC 30×40 – colores ──────────────────────────────────────────
  'tirante-wpc-30-40mm-jade': {
    base: 'tirante-wpc-30x40mm',
    specExtra: [['Color', 'Jade']]
  },
  'tirante-wpc-30-40mm-peach': {
    base: 'tirante-wpc-30x40mm',
    specExtra: [['Color', 'Peach']]
  },
  'tirante-wpc-30-40mm-almond': {
    base: 'tirante-wpc-30x40mm',
    specExtra: [['Color', 'Almond']]
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
  const specs = [...(base.specs || []), ...(descData.specExtra || [])];

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

/* ===== SIMULADOR DE AMBIENTES — SIM_CATALOG, SIM_COMBOS e initSimulator en script-shared.js ===== */

// stub — no-op; real initSimulator is in script-shared.js
function _initSimulatorStubProductos() {
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
  initFilters();
  initCalculator();
  initProductModal();
  initSimulator();
});
