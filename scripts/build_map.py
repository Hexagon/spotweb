#!/usr/bin/env python3
"""Build the bidding zone map used on the start page (templates/partials/map.svg).

Source: Natural Earth 1:10m admin 0 (countries) and admin 1 (states/provinces), public domain.
Swedish, Norwegian and Danish bidding zones are approximated by dissolving counties/regions,
so the zone borders are schematic, not the exact grid borders.

    pip install shapely pyshp
    curl -O https://naturalearth.s3.amazonaws.com/10m_cultural/ne_10m_admin_0_countries.zip
    curl -O https://naturalearth.s3.amazonaws.com/10m_cultural/ne_10m_admin_1_states_provinces.zip
    unzip ne_10m_admin_0_countries.zip; unzip ne_10m_admin_1_states_provinces.zip
    python3 scripts/build_map.py <dir with the shapefiles> templates/partials/map.svg
"""

import math
import sys

import shapefile
from shapely.geometry import shape, Point, MultiPolygon, Polygon
from shapely.ops import unary_union

# Coarse lon/lat pre-clip, the drawn window is set by VIEW below
BBOX = (-25.0, 30.0, 45.0, 75.0)
# Points that must be inside the drawn window (lon, lat): Portugal, Nordkapp, Finland east, Spain south
VIEW = [(-9.9, 39.0), (25.8, 71.3), (31.8, 63.0), (-5.6, 35.9), (19.0, 36.5), (-10.5, 53.5)]
MARGIN = 0.012
# Lambert azimuthal equal-area, centered on the Nordics
LON0, LAT0 = 12.0, 55.0
WIDTH = 1000
SIMPLIFY = 0.8  # in output units

# Bidding zones built from admin 1 regions
ADMIN1_ZONES = {
    "SE1": ["Norrbotten"],
    "SE2": ["Västerbotten", "Jämtland", "Västernorrland", "Gävleborg"],
    "SE3": ["Dalarna", "Värmland", "Uppsala", "Stockholm", "Västmanland", "Orebro", "Södermanland",
            "Östergötland", "Västra Götaland", "Jönköping", "Gotland", "Kalmar"],
    "SE4": ["Skåne", "Blekinge", "Halland", "Kronoberg"],
    "NO1": ["Oslo", "Akershus", "Østfold", "Hedmark", "Oppland", "Buskerud", "Vestfold"],
    "NO2": ["Telemark", "Aust-Agder", "Vest-Agder", "Rogaland"],
    "NO3": ["Møre og Romsdal", "Sør-Trøndelag", "Nord-Trøndelag"],
    "NO4": ["Nordland", "Troms", "Finnmark"],
    "NO5": ["Hordaland", "Sogn og Fjordane"],
    "DK1": ["Nordjylland", "Midtjylland", "Syddanmark"],
    "DK2": ["Hovedstaden", "Sjaælland"],
}
ADMIN1_COUNTRY = {"SE": "SE", "NO": "NO", "DK": "DK"}

# Bidding zones (and neighbours with flows) built from whole countries, by ISO A3
COUNTRY_ZONES = {
    "FI": ["FIN", "ALA"],
    "DE-LU": ["DEU", "LUX"],
    "AT": ["AUT"],
    "BE": ["BEL"],
    "CH": ["CHE"],
    "ES": ["ESP"],
    "FR": ["FRA"],
    "PL": ["POL"],
}
NEIGHBOURS = {
    "EE": ["EST"],
    "LT": ["LTU"],
    "NL": ["NLD"],
    "GB": ["GBR"],
    "CZ": ["CZE"],
    "IT": ["ITA"],
    "PT": ["PRT"],
}

# Label anchors (lon, lat) where the automatic point looks off
ANCHORS = {
    "SE1": (20.3, 66.9), "SE2": (16.2, 63.6), "SE3": (15.0, 59.6), "SE4": (14.2, 56.4),
    "NO1": (10.6, 60.9), "NO2": (7.6, 59.0), "NO3": (10.4, 63.2), "NO4": (16.0, 68.2),
    "NO5": (6.5, 61.0), "DK1": (9.1, 56.2), "DK2": (12.0, 55.45), "FI": (26.0, 63.0),
    "DE-LU": (10.2, 51.1), "PL": (19.3, 52.1), "FR": (2.4, 46.7), "BE": (4.6, 50.6),
    "CH": (8.2, 46.85), "AT": (14.3, 47.6), "ES": (-3.6, 40.2),
    "EE": (25.8, 58.7), "LT": (23.9, 55.3), "NL": (5.6, 52.3), "GB": (-1.6, 52.8),
    "CZ": (15.4, 49.8), "IT": (11.0, 44.6), "PT": (-8.0, 39.8),
}

d2r = math.radians


def project(lon, lat):
    l, p, l0, p0 = d2r(lon), d2r(lat), d2r(LON0), d2r(LAT0)
    k = math.sqrt(2 / (1 + math.sin(p0) * math.sin(p) + math.cos(p0) * math.cos(p) * math.cos(l - l0)))
    x = k * math.cos(p) * math.sin(l - l0)
    y = k * (math.cos(p0) * math.sin(p) - math.sin(p0) * math.cos(p) * math.cos(l - l0))
    return x, y


def window():
    """Projected extent of VIEW plus a margin."""
    pts = [project(lon, lat) for lon, lat in VIEW]
    xs, ys = [p[0] for p in pts], [p[1] for p in pts]
    return min(xs) - MARGIN, min(ys) - MARGIN, max(xs) + MARGIN, max(ys) + MARGIN


X0, Y0, X1, Y1 = window()
SCALE = WIDTH / (X1 - X0)
HEIGHT = round((Y1 - Y0) * SCALE)


def to_svg(lon, lat):
    x, y = project(lon, lat)
    return (x - X0) * SCALE, (Y1 - y) * SCALE


def transform(geom):
    def ring(coords):
        return [to_svg(lon, lat) for lon, lat in coords]

    polys = [geom] if isinstance(geom, Polygon) else list(getattr(geom, "geoms", []))
    out = []
    for p in polys:
        if not isinstance(p, Polygon) or p.is_empty:
            continue
        out.append(Polygon(ring(p.exterior.coords), [ring(i.coords) for i in p.interiors]))
    g = MultiPolygon(out) if out else MultiPolygon()
    # Clip to the view in projected space so the edges are straight
    return g.buffer(0).intersection(Polygon([(-2, -2), (WIDTH + 2, -2), (WIDTH + 2, HEIGHT + 2), (-2, HEIGHT + 2)]))


def path(geom):
    geom = geom.simplify(SIMPLIFY, preserve_topology=True)
    polys = [geom] if isinstance(geom, Polygon) else list(getattr(geom, "geoms", []))
    parts = []
    for p in polys:
        if p.area < 1.5:  # drop tiny islands
            continue
        for r in [p.exterior] + list(p.interiors):
            pts = list(r.coords)[:-1]
            if len(pts) < 3:
                continue
            s = "M" + "L".join(f"{x:.1f} {y:.1f}" for x, y in pts) + "Z"
            parts.append(s.replace(".0 ", " ").replace(".0L", "L").replace(".0Z", "Z"))
    return "".join(parts)


def clip(geom):
    w, s, e, n = BBOX
    return geom.buffer(0).intersection(Polygon([(w, s), (e, s), (e, n), (w, n)]))


def main(src, dst):
    a0 = shapefile.Reader(f"{src}/ne_10m_admin_0_countries")
    f0 = [f[0] for f in a0.fields[1:]]
    countries = {}
    for sr in a0.iterShapeRecords():
        d = dict(zip(f0, sr.record))
        iso = d["ADM0_A3"]
        g = clip(shape(sr.shape.__geo_interface__))
        if not g.is_empty:
            countries[iso] = g

    a1 = shapefile.Reader(f"{src}/ne_10m_admin_1_states_provinces")
    f1 = [f[0] for f in a1.fields[1:]]
    regions = {}
    for sr in a1.iterShapeRecords():
        d = dict(zip(f1, sr.record))
        if d["iso_a2"] in ADMIN1_COUNTRY:
            regions[d["name"]] = clip(shape(sr.shape.__geo_interface__))

    zones = {}
    for z, names in ADMIN1_ZONES.items():
        missing = [n for n in names if n not in regions]
        assert not missing, missing
        zones[z] = unary_union([regions[n] for n in names])
    for z, isos in COUNTRY_ZONES.items():
        zones[z] = unary_union([countries[i] for i in isos if i in countries])
    neighbours = {z: unary_union([countries[i] for i in isos if i in countries]) for z, isos in NEIGHBOURS.items()}

    used = {i for v in list(COUNTRY_ZONES.values()) + list(NEIGHBOURS.values()) for i in v} | {"SWE", "NOR", "DNK"}
    land = unary_union([g for iso, g in countries.items() if iso not in used])

    def anchor(z, g):
        lon, lat = ANCHORS.get(z) or (g.representative_point().x, g.representative_point().y)
        x, y = to_svg(lon, lat)
        return f'data-x="{x:.0f}" data-y="{y:.0f}"'

    out = [
        f'<svg class="zone-map" viewBox="0 0 {WIDTH} {HEIGHT}" preserveAspectRatio="xMidYMin meet" xmlns="http://www.w3.org/2000/svg" role="img" aria-labelledby="map-title">',
        '<title id="map-title">{{ t("map.title") }}</title>',
        f'<path class="land" d="{path(transform(land))}"/>',
        '<g class="neighbours">',
    ]
    for z, g in neighbours.items():
        out.append(f'<path class="neighbour" data-ext="{z}" {anchor(z, g)} d="{path(transform(g))}"/>')
    out.append("</g>")
    out.append('<g class="zones">')
    for z, g in zones.items():
        out.append(
            f'<path class="zone" data-area="{z}" {anchor(z, g)} tabindex="0" role="button" aria-label="{z}" d="{path(transform(g))}"/>'
        )
    out.append("</g>")
    out.append('<g class="flows" aria-hidden="true"></g>')
    out.append('<g class="labels" aria-hidden="true"></g>')
    out.append("</svg>")
    with open(dst, "w", encoding="utf-8") as fh:
        fh.write("\n".join(out) + "\n")
    print(f"wrote {dst}: {WIDTH}x{HEIGHT}")


if __name__ == "__main__":
    main(sys.argv[1], sys.argv[2])
