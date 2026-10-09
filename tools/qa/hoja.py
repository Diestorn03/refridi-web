# Hoja de contacto del recorrido del home: lee .shots/v2/secuencia.json (node tools/qa/v2.mjs secuencia) y arma una hoja por dispositivo,
# en orden, con número, scrollY y escena bajo cada cuadro. Uso: python tools/qa/hoja.py  →  .shots/v2/hoja-desktop.png, hoja-movil.png
import json
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont

DIR = Path(__file__).resolve().parents[2] / '.shots' / 'v2'
LAYOUT = {'d': ('desktop', 360, 5), 'm': ('movil', 195, 8)}  # perfil: (nombre, ancho de la miniatura, columnas)
GAP, LABEL = 12, 22
try:
    font = ImageFont.truetype('arial.ttf', 13)
except OSError:
    font = ImageFont.load_default()

meta = json.loads((DIR / 'secuencia.json').read_text(encoding='utf-8'))
for perfil, (nombre, tw, cols) in LAYOUT.items():
    frames = [m for m in meta if m['perfil'] == perfil]
    if not frames:
        continue
    w0, h0 = Image.open(DIR / frames[0]['f']).size
    th = round(tw * h0 / w0)
    rows = -(-len(frames) // cols)
    sheet = Image.new('RGB', (GAP + cols * (tw + GAP), GAP + rows * (th + LABEL + GAP)), (232, 236, 240))
    draw = ImageDraw.Draw(sheet)
    for i, m in enumerate(frames):
        x, y = GAP + (i % cols) * (tw + GAP), GAP + (i // cols) * (th + LABEL + GAP)
        sheet.paste(Image.open(DIR / m['f']).convert('RGB').resize((tw, th), Image.LANCZOS), (x, y))
        draw.text((x + 2, y + th + 4), f"{i:02d} · y {m['y']} · {m['escena']}", fill=(16, 22, 29), font=font)
    out = DIR / f'hoja-{nombre}.png'
    sheet.save(out, optimize=True)
    print(out, f'{len(frames)} cuadros')
