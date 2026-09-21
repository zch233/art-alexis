"""Optional asset maintenance: pip install fonttools brotli, then run this file.
Lossless WOFF2 packaging only; retain all original glyphs and metrics.
Normal JS builds use the committed WOFF2 assets and do not require Python.
"""
from pathlib import Path
from fontTools.ttLib import TTFont

assets = Path(__file__).resolve().parents[1] / 'wordpress/themes/art-alexis/assets'
for name in ('gasoek', 'poppins', 'poppins-500', 'poppins-600', 'poppins-700'):
    original = assets / (name + '.ttf')
    output = assets / (name + '.woff2')
    font = TTFont(original)
    glyphs = font.getGlyphOrder()
    metrics = dict(font['hmtx'].metrics)
    font.flavor = 'woff2'
    font.save(output)
    check = TTFont(output)
    assert check.getGlyphOrder() == glyphs and check['hmtx'].metrics == metrics
    print(f'{name}: {original.stat().st_size} -> {output.stat().st_size} bytes; glyphs/metrics verified')
