#!/usr/bin/env python3
"""
Agente generador de texturas — Estilo Revestido
================================================
Analiza cada foto de producto del catálogo e identifica la región correcta
de textura según el tipo de material, luego guarda una imagen optimizada
en textures/<key>.jpg lista para usar en el simulador.

Tipos de procesamiento detectados automáticamente:
  inset    — foto compuesta (lifestyle + recuadro con borde blanco a la derecha)
  flat     — foto plana de la textura, se usa directamente
  white_bg — producto sobre fondo blanco, se recorta el fondo automáticamente

Uso:
  python generar_texturas.py              # todos los productos
  python generar_texturas.py wi-dark      # solo ese producto
  python generar_texturas.py pv-roble pv-ashdark wi-gray   # varios
"""

import os, sys
from PIL import Image, ImageFilter, ImageOps

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
BASE       = SCRIPT_DIR
OUT_DIR    = os.path.join(SCRIPT_DIR, 'textures')
OUT_SIZE   = 1024   # tamaño de textura de salida (px)

# ─── Catálogo: clave → (ruta relativa de imagen, tipo) ────────────────────────
#
# 'inset'    = foto compuesta, extraer recuadro derecho con borde blanco
# 'flat'     = foto plana de material, usar completa
# 'white_bg' = producto sobre fondo blanco/claro, recortar automáticamente
#
CATALOG = {
    # Wall panels interior (composite con inset a la derecha)
    'wi-dark':    ('Wall panel interior/dark panel.jpg',     'inset'),
    'wi-gray':    ('Wall panel interior/gray panel.jpg',     'inset'),
    'wi-sand':    ('Wall panel interior/sand.jpg',           'white_bg'),
    'wi-white':   ('Wall panel interior/White.jpg',          'inset'),
    'wi-walnut':  ('Wall panel interior/wallnut panel.jpg',  'inset'),
    'wi-wfine':   ('Wall panel interior/Wallnut Fine.jpg',   'inset'),
    'wi-black':   ('Wall panel interior/Black new.jpg',      'inset'),

    # Wall panels exterior (perfil WPC sobre fondo blanco)
    'we-almond':  ('Wall panel Exterior/Almond.jpg',         'white_bg'),
    'we-jade':    ('Wall panel Exterior/Jade.jpg',           'white_bg'),
    'we-peach':   ('Wall panel Exterior/Peach.jpg',          'white_bg'),
    'we-maple':   ('Wall panel Exterior/Maple Wood.jpg',     'white_bg'),

    # Placas PVC (fotos planas de la textura del material)
    'pm-mblanco':    ('Placas de pvc/marmol blanco.jpg',        'flat'),
    'pm-mnegro':     ('Placas de pvc/marmol negro.jpg',         'flat'),
    'pm-carrara':    ('Placas de pvc/carrara.jpg',              'flat'),
    'pm-gray':       ('Placas de pvc/gray.jpg',                 'flat'),
    'pm-white':      ('Placas de pvc/all white.jpg',            'flat'),
    'pm-ablack':     ('Placas de pvc/All Black.jpg',            'white_bg'),
    'pm-travertino': ('Placas de pvc/jura beige.jpg',           'flat'),

    # Placas 3D (producto sobre fondo blanco/claro, frontal)
    'p3-ondas':   ('Placas 3D/ondas.jpg',                    'white_bg'),
    'p3-rombo':   ('Placas 3D/rombo.jpg',                    'white_bg'),
    'p3-lineas':  ('Placas 3D/LINEAS.jpg',                   'white_bg'),

    # Pisos vinílicos (composite con inset del tablón a la derecha)
    'pv-ashdark': ('Pisos Vinilicos/ash dark.jpg',           'inset'),
    'pv-ashgray': ('Pisos Vinilicos/ash gray.jpg',           'inset'),
    'pv-roble':   ('Pisos Vinilicos/Roble classic.jpg',      'inset'),
    'pv-castano': ('Pisos Vinilicos/castaño matiz.jpg',      'inset'),
    'pv-lgray':   ('Pisos Vinilicos/Light Gray.jpg',         'inset'),
    'pv-obsidian':('Pisos Vinilicos/Obsidian White.jpg',     'inset'),
    'pv-cotton':  ('Pisos Vinilicos/Soft Cotton.jpg',        'inset'),
    'pv-marfil':  ('Pisos Vinilicos/marfil White.jpg',       'inset'),
    'pv-paraiso': ('Pisos Vinilicos/paraiso.jpg',            'inset'),
}

# Nombres alternativos para archivos que pueden tener mayúsculas distintas
ALT_NAMES = {
    'Placas 3D/LINEAS.jpg': [
        'Placas 3D/LINEAS 1.jpg', 'Placas 3D/Lineas.jpg', 'Placas 3D/lineas.jpg',
    ],
    'Placas de pvc/All Black.jpg': ['Placas de pvc/all black.jpg', 'Placas de pvc/All black.jpg'],
    'Placas de pvc/all white.jpg': ['Placas de pvc/All White.jpg', 'Placas de pvc/all White.jpg'],
}


# ─── Utilidades ───────────────────────────────────────────────────────────────

def open_image(rel_path):
    """Abre la imagen, probando nombres alternativos si no existe el principal."""
    primary = os.path.join(BASE, rel_path)
    if os.path.exists(primary):
        return Image.open(primary)

    for alt in ALT_NAMES.get(rel_path, []):
        path = os.path.join(BASE, alt)
        if os.path.exists(path):
            return Image.open(path)

    raise FileNotFoundError(f'No se encontró: {rel_path}')


def to_rgb(img):
    """Convierte a RGB eliminando canal alfa si lo hay."""
    if img.mode in ('RGBA', 'LA', 'P'):
        bg = Image.new('RGB', img.size, (255, 255, 255))
        if img.mode == 'P':
            img = img.convert('RGBA')
        if 'A' in img.mode:
            bg.paste(img, mask=img.split()[-1])
        else:
            bg.paste(img)
        return bg
    return img.convert('RGB')


def col_brightness(gray, x, h, y_start=0.15, y_end=0.85, step=20):
    """Brillo promedio de una columna (muestreado)."""
    samples = [gray.getpixel((x, y)) for y in range(int(h * y_start), int(h * y_end), step)]
    return sum(samples) / max(len(samples), 1)


# ─── Extracción de inset ──────────────────────────────────────────────────────

def find_inset_crop(img):
    """
    Detecta el recuadro con borde blanco en el lado derecho de una foto compuesta
    y devuelve (x1, y1, x2, y2) en píxeles del contenido interior del inset.

    Las fotos compuestas tienen la forma:
      [lifestyle: pared/piso instalado] | [borde blanco] [producto close-up] [borde blanco]

    El inset ocupa aproximadamente el 13-14% de ancho centrado en el 75-90% derecho.
    Los bordes blancos son franjas verticales (6-10px) donde >70% de los píxeles > 245.
    """
    w, h = img.size
    gray = img.convert('L')

    # Paso 1: hallar franjas verticales blancas en el 55-100% derecho.
    # Una franja blanca = columna donde >70% de las filas muestreadas son > 245.
    y_step = max(10, h // 60)
    ys = list(range(int(h * 0.10), int(h * 0.90), y_step))

    white_xs = []
    for x in range(int(w * 0.55), w):
        bright = sum(1 for y in ys if gray.getpixel((x, y)) > 245)
        if bright / len(ys) > 0.70:
            white_xs.append(x)

    # Agrupar columnas consecutivas en "franjas"
    stripes = []
    if white_xs:
        start = prev = white_xs[0]
        for x in white_xs[1:]:
            if x - prev > 5:
                stripes.append((start, prev))
                start = x
            prev = x
        stripes.append((start, prev))

    # Necesitamos al menos 2 franjas (borde izquierdo y derecho del inset).
    # Si hay más, usamos las dos más a la derecha (las más cercanas al borde derecho).
    if len(stripes) < 2:
        # Fallback con posición conocida para imágenes 1772x1772
        return (int(w * 0.758), int(h * 0.092), int(w * 0.895), int(h * 0.918))

    left_stripe  = stripes[-2]
    right_stripe = stripes[-1]
    x_left  = left_stripe[1] + 1    # primer píxel DESPUÉS del borde blanco izq.
    x_right = right_stripe[0] - 1   # último píxel ANTES del borde blanco der.

    # Paso 2: hallar bordes horizontales (top/bottom) dentro del rango x del inset.
    x_step = max(1, (x_right - x_left) // 20)

    # Top: escanear de arriba hacia abajo; encontrar franja blanca y luego su fin.
    y_top = int(h * 0.03)
    found_top_white = False
    for y in range(0, int(h * 0.40)):
        xs = range(x_left, x_right, x_step)
        bright = sum(1 for x in xs if gray.getpixel((x, y)) > 245) / len(xs)
        if not found_top_white and bright > 0.70:
            found_top_white = True
        elif found_top_white and bright < 0.30:
            y_top = y
            break

    # Bottom: escanear de abajo hacia arriba; ídem.
    y_bot = int(h * 0.97)
    found_bot_white = False
    for y in range(h - 1, int(h * 0.60), -1):
        xs = range(x_left, x_right, x_step)
        bright = sum(1 for x in xs if gray.getpixel((x, y)) > 245) / len(xs)
        if not found_bot_white and bright > 0.70:
            found_bot_white = True
        elif found_bot_white and bright < 0.30:
            y_bot = y
            break

    return (x_left, y_top, x_right, y_bot)


# ─── Recorte de fondo blanco ──────────────────────────────────────────────────

def crop_white_background(img):
    """
    Elimina el fondo blanco/muy claro de una foto de producto.
    Usa PIL's getbbox() sobre una máscara umbral para encontrar el contenido.
    """
    rgb = img.convert('RGB')
    gray = rgb.convert('L')

    # Máscara: píxeles < 248 son contenido (no blanco)
    mask = gray.point(lambda p: 0 if p > 247 else 255)
    bbox = mask.getbbox()

    if not bbox:
        return rgb  # no se encontró fondo blanco → devuelve imagen completa

    x1, y1, x2, y2 = bbox
    w_content = x2 - x1
    h_content = y2 - y1

    # Pequeño margen interior (2%) para no cortar bordes del material
    pad = int(min(w_content, h_content) * 0.02)
    x1 = max(0, x1 - pad)
    y1 = max(0, y1 - pad)
    x2 = min(rgb.width, x2 + pad)
    y2 = min(rgb.height, y2 + pad)

    return rgb.crop((x1, y1, x2, y2))


# ─── Normalización a textura cuadrada ────────────────────────────────────────

def to_square_texture(img, size=OUT_SIZE):
    """
    Convierte la región extraída a una textura cuadrada de `size × size` px.

    Lógica:
    - Si la imagen es apaisada (ancho > alto): escala a width=size, crop vertical centrado.
    - Si es retrato (tablón de piso, alto > ancho): repite horizontalmente hasta llenar el cuadrado.
      Esto simula cómo se vería el piso con múltiples tablones.
    - Si ya es (casi) cuadrada: solo redimensiona.
    """
    img = img.convert('RGB')
    w, h = img.size

    if w == 0 or h == 0:
        return Image.new('RGB', (size, size), (180, 180, 180))

    aspect = w / h

    if aspect >= 0.8:
        # Apaisada o cuadrada: escalar para que el ancho sea `size`
        scale  = size / w
        nw, nh = size, max(1, int(h * scale))
        img    = img.resize((nw, nh), Image.LANCZOS)
        if nh >= size:
            cy  = (nh - size) // 2
            img = img.crop((0, cy, size, cy + size))
        else:
            # Rellenar verticalmente repitiendo la textura
            canvas = Image.new('RGB', (size, size))
            y = 0
            while y < size:
                canvas.paste(img, (0, y))
                y += nh
            img = canvas
    else:
        # Retrato (tablón angosto): escalar altura a `size` y repetir horizontalmente
        scale  = size / h
        nw, nh = max(1, int(w * scale)), size
        img    = img.resize((nw, nh), Image.LANCZOS)
        if nw >= size:
            cx  = (nw - size) // 2
            img = img.crop((cx, 0, cx + size, size))
        else:
            # Repetir horizontalmente para simular múltiples tablones
            canvas = Image.new('RGB', (size, size))
            x = 0
            while x < size:
                canvas.paste(img, (x, 0))
                x += nw
            img = canvas

    return img


# ─── Postprocesamiento final ──────────────────────────────────────────────────

def finalize(img):
    """Aplica sharpening suave y normalización de contraste."""
    # Unsharp mask suave: realza detalles de la textura sin exagerar
    img = img.filter(ImageFilter.UnsharpMask(radius=1.0, percent=115, threshold=3))
    # Autocontraste muy suave (0.3% de recorte) para normalizar rangos de brillo
    img = ImageOps.autocontrast(img, cutoff=0.3)
    return img


# ─── Pipeline principal ───────────────────────────────────────────────────────

def process_one(key, source_rel, kind, verbose=True):
    """Procesa un producto y guarda la textura. Devuelve True si tuvo éxito."""
    # Abrir imagen
    try:
        img = to_rgb(open_image(source_rel))
    except FileNotFoundError:
        print(f'  NO {key:<14} archivo no encontrado: {source_rel}')
        return False
    except Exception as e:
        print(f'  NO {key:<14} error al abrir imagen: {e}')
        return False

    # Extraer región según tipo
    try:
        if kind == 'inset':
            box    = find_inset_crop(img)
            region = img.crop(box)
            detail = f'inset {box[0]},{box[1]}-{box[2]},{box[3]}'
        elif kind == 'white_bg':
            region = crop_white_background(img)
            detail = f'white_bg {region.size[0]}×{region.size[1]}'
        else:  # flat
            region = img
            detail = f'flat {img.size[0]}×{img.size[1]}'
    except Exception as e:
        print(f'  NO {key:<14} error en extraccion ({kind}): {e}')
        return False

    # Validar que la región tiene contenido mínimo
    rw, rh = region.size
    if rw < 20 or rh < 20:
        print(f'  NO {key:<14} region extraida muy pequena: {rw}x{rh}')
        return False

    # Normalizar a textura cuadrada + postprocesar
    texture = to_square_texture(region)
    texture = finalize(texture)

    # Guardar
    out_path = os.path.join(OUT_DIR, f'{key}.jpg')
    texture.save(out_path, 'JPEG', quality=92, optimize=True)

    if verbose:
        print(f'  OK {key:<14} ({detail}) -> textures/{key}.jpg')
    return True


# ─── Entry point ──────────────────────────────────────────────────────────────

def main():
    os.makedirs(OUT_DIR, exist_ok=True)

    # Si se pasan argumentos, procesar solo esos keys
    requested = sys.argv[1:]
    if requested:
        unknown = [k for k in requested if k not in CATALOG]
        if unknown:
            print(f'Productos desconocidos: {unknown}')
            print(f'Disponibles: {sorted(CATALOG.keys())}')
            sys.exit(1)
        keys = requested
    else:
        keys = list(CATALOG.keys())

    print(f'\nGenerando {len(keys)} textura(s)...\n')
    ok = fail = 0
    for key in keys:
        src, kind = CATALOG[key]
        if process_one(key, src, kind):
            ok += 1
        else:
            fail += 1

    print(f'\n{"-"*50}')
    print(f'OK  {ok} textura(s) generadas en textures/')
    if fail:
        print(f'!!  {fail} error(es) -- revisar rutas o agregar las imagenes faltantes')
    print()


if __name__ == '__main__':
    main()
