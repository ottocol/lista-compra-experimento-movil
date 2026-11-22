"""Genera las miniaturas de las fotos de producto para srcset.

Uso:  python scripts/miniaturas.py
Lee  public/fotos/originales/*.jpg  y escribe  public/fotos/{64,128,192}/*.jpg
(recorte cuadrado centrado). Se puede sustituir cualquier original por una
foto hecha con el móvil, manteniendo el nombre del fichero, y volver a
ejecutarlo. Necesita Pillow:  pip install pillow
"""
from pathlib import Path
from PIL import Image, ImageOps

RAIZ = Path(__file__).resolve().parent.parent / "public" / "fotos"
TAMANYOS = [64, 128, 192]   # 1x, 2x y 3x de una miniatura de 64 px CSS

for original in sorted((RAIZ / "originales").glob("*.jpg")):
    with Image.open(original) as im:
        im = ImageOps.exif_transpose(im).convert("RGB")   # respeta la orientación del móvil
        for lado in TAMANYOS:
            destino = RAIZ / str(lado) / original.name
            destino.parent.mkdir(parents=True, exist_ok=True)
            ImageOps.fit(im, (lado, lado), Image.LANCZOS).save(destino, quality=82, optimize=True, progressive=True)
    print("ok", original.name)
