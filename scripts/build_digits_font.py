#!/usr/bin/env python3
"""Build the seven-segment font of the big "right now" price (static/assets/fonts/spotweb-digits.woff2).

Source: DSEG7 Classic Bold by keshikan (https://www.keshikan.net/fonts-e.html), SIL OFL 1.1.
The bold weight reads best at this size (thicker segments, a larger decimal point). It is
subset to what that price can show (digits, period, comma, minus, space), so it stays
at a few KB. The OFL reserves the name "DSEG" for the original, so the subset is renamed
"Spotweb Digits". A comma draws like the period and U+2212 like the hyphen, in case a locale
formats the number that way.

    pip install fonttools brotli
    curl -fsSLO https://registry.npmjs.org/dseg/-/dseg-0.46.0.tgz && tar xzf dseg-0.46.0.tgz
    python3 scripts/build_digits_font.py package/fonts/DSEG7-Classic/DSEG7Classic-Bold.ttf \
        static/assets/fonts/spotweb-digits.woff2
    cp package/DSEG-LICENSE.txt static/assets/fonts/spotweb-digits.LICENSE.txt
"""

import sys

from fontTools import subset
from fontTools.ttLib import TTFont

FAMILY = "Spotweb Digits"
TEXT = "0123456789.,-\u2212 "


def main(src: str, dst: str) -> None:
    font = TTFont(src)
    for table in font["cmap"].tables:
        if table.isUnicode():
            table.cmap[ord(",")] = table.cmap[ord(".")]
            table.cmap[0x2212] = table.cmap[ord("-")]
    opts = subset.Options()
    opts.flavor = "woff2"
    opts.layout_features = []
    opts.name_IDs = [0, 1, 2, 3, 4, 5, 6, 13, 14]
    opts.notdef_outline = False
    opts.hinting = False
    sub = subset.Subsetter(opts)
    sub.populate(text=TEXT)
    sub.subset(font)
    names = {
        1: FAMILY,
        2: "Regular",
        3: f"{FAMILY} Regular; subset of DSEG7 Classic Bold",
        4: f"{FAMILY} Regular",
        5: "Version 0.46; subset of DSEG7 Classic Bold",
        6: "SpotwebDigits-Regular",
    }
    for rec in font["name"].names:
        if rec.nameID in names:
            rec.string = names[rec.nameID]
    font.flavor = "woff2"
    font.save(dst)


if __name__ == "__main__":
    if len(sys.argv) != 3:
        sys.exit(f"usage: {sys.argv[0]} <DSEG7Classic-Bold.ttf> <out.woff2>")
    main(sys.argv[1], sys.argv[2])
