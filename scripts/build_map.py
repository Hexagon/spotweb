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

import json
import math
import os
import re
import sys

import shapefile
from shapely.geometry import shape, LineString, MultiPolygon, Polygon
from shapely.ops import linemerge, nearest_points, unary_union

# Coarse lon/lat pre-clip for zones and neighbours, the drawn window is set by VIEW and PAD below
BBOX = (-25.0, 30.0, 45.0, 75.0)
# Wider pre-clip for the background land, so only the padded window cuts it
LAND_BBOX = (-80.0, 0.0, 130.0, 90.0)
# Points that must be inside the drawn window (lon, lat): Portugal, Nordkapp, Finland east, Spain south, ...
VIEW = [(-9.9, 39.0), (25.8, 71.3), (31.8, 63.0), (-5.6, 35.9), (19.0, 36.5), (-10.5, 53.5),
        (29.8, 45.2), (26.5, 34.8)]  # Romania east (Danube delta), Crete
MARGIN = 0.012
# Extra land drawn around VIEW (left, top, right, bottom, in output units), so that a wide screen
# shows land past the view instead of a straight cut
PAD = (700, 250, 900, 250)
# Lambert azimuthal equal-area, centered on the Nordics
LON0, LAT0 = 12.0, 55.0
WIDTH = 1000
SIMPLIFY = 0.8  # in output units
LAND_SIMPLIFY = 1.5  # coarser for the background land

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
    # Italian zones by region (field `region`, the admin 1 units are provinces), 2021 configuration
    "IT-NORD": ["Valle d'Aosta", "Piemonte", "Liguria", "Lombardia", "Trentino-Alto Adige", "Veneto",
                "Friuli-Venezia Giulia", "Emilia-Romagna"],
    "IT-CNOR": ["Toscana", "Umbria", "Marche"],
    "IT-CSUD": ["Lazio", "Abruzzo", "Molise", "Campania"],
    "IT-SUD": ["Apulia", "Basilicata"],
    "IT-CALA": ["Calabria"],
    "IT-SICI": ["Sicily"],
    "IT-SARD": ["Sardegna"],
}
# Admin 1 field that names the units in ADMIN1_ZONES, per country
ADMIN1_COUNTRY = {"SE": "name", "NO": "name", "DK": "name", "IT": "region"}

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
    "EE": ["EST"],
    "LV": ["LVA"],
    "LT": ["LTU"],
    "NL": ["NLD"],
    "CZ": ["CZE"],
    "PT": ["PRT"],
    "SK": ["SVK"],
    "HU": ["HUN"],
    "SI": ["SVN"],
    "HR": ["HRV"],
    "RO": ["ROU"],
    "BG": ["BGR"],
    "GR": ["GRC"],
}
NEIGHBOURS = {
    "GB": ["GBR"],
}

# Where a border arrow sits (lon, lat) when the automatic spot is poor
FLOW_AT = {
    ("NO2", "DK1"): (8.6, 57.75),  # Skagerrak
    ("NO2", "DE-LU"): (6.9, 56.6),  # NordLink, west of Jutland
    ("NO2", "NL"): (5.6, 55.4),  # NorNed
    ("DK1", "NL"): (6.6, 54.5),  # COBRAcable
    ("DK1", "GB"): (4.0, 55.2),  # Viking Link
    ("DK1", "DK2"): (10.95, 55.35),  # Great Belt
    ("DK2", "DE-LU"): (12.35, 54.45),  # Kontek / Kriegers Flak
    ("SE4", "DE-LU"): (13.4, 55.05),  # Baltic Cable
    ("SE4", "PL"): (15.4, 55.2),  # SwePol
    ("FR", "GB"): (0.6, 50.4),  # IFA, the Channel
    ("BE", "GB"): (2.4, 51.55),  # Nemo
    ("IT-CNOR", "IT-SARD"): (9.9, 42.6),  # SACOI, via Corsica
    ("IT-CSUD", "IT-SARD"): (11.2, 41.0),  # SAPEI
    ("IT-SUD", "GR"): (19.4, 39.9),  # GRITA, Strait of Otranto
}

# Label anchors (lon, lat) where the automatic point looks off
ANCHORS = {
    "SE1": (20.3, 66.9), "SE2": (16.2, 63.6), "SE3": (15.0, 59.6), "SE4": (14.2, 56.4),
    "NO1": (10.6, 60.9), "NO2": (7.6, 59.0), "NO3": (10.4, 63.2), "NO4": (16.0, 68.2),
    "NO5": (6.5, 61.0), "DK1": (9.1, 56.2), "DK2": (12.0, 55.45), "FI": (26.0, 63.0),
    "DE-LU": (10.2, 51.1), "PL": (19.3, 52.1), "FR": (2.4, 46.7), "BE": (4.6, 50.6),
    "CH": (8.2, 46.85), "AT": (14.3, 47.6), "ES": (-3.6, 40.2),
    "EE": (25.8, 58.7), "LV": (25.0, 56.85), "LT": (23.9, 55.3), "NL": (5.6, 52.3), "GB": (-1.6, 52.8),
    "CZ": (15.4, 49.8), "PT": (-8.0, 39.8),
    "IT-NORD": (10.0, 45.5), "IT-CNOR": (11.6, 43.4), "IT-CSUD": (13.6, 41.9), "IT-SUD": (16.4, 40.9),
    "IT-CALA": (16.4, 39.0), "IT-SICI": (14.2, 37.5), "IT-SARD": (9.0, 40.1),
    "SK": (19.5, 48.7), "HU": (19.4, 47.1), "SI": (14.8, 46.1), "HR": (16.2, 45.6),
    "RO": (24.9, 45.9), "BG": (25.2, 42.7), "GR": (22.0, 39.6),
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
    # Clip to the padded view in projected space so the edges are straight
    l, t, r, b = PAD
    return g.buffer(0).intersection(Polygon([(-l - 2, -t - 2), (WIDTH + r + 2, -t - 2), (WIDTH + r + 2, HEIGHT + b + 2), (-l - 2, HEIGHT + b + 2)]))


def path(geom, tolerance=SIMPLIFY):
    geom = geom.simplify(tolerance, preserve_topology=True)
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


def clip(geom, bbox=BBOX):
    w, s, e, n = bbox
    return geom.buffer(0).intersection(Polygon([(w, s), (e, s), (e, n), (w, n)]))


def borders():
    """The interconnections in src/flows.rs, so the arrows follow the list of fetched borders."""
    rs = open(os.path.join(os.path.dirname(__file__), "..", "src", "flows.rs"), encoding="utf-8").read()
    body = rs.split("pub static BORDERS", 1)[1].split("];", 1)[0]
    return re.findall(r'\("([^"]+)", "([^"]+)"\)', body)


def flatten(g):
    return [x for p in g.geoms for x in flatten(p)] if hasattr(g, "geoms") else [g]


def flow_spots(shapes, anchors):
    """Arrow position and direction per border: on the shared border for neighbours by land,
    halfway between the closest coasts for sea cables. Keyed "A|B" (sorted), direction A -> B."""
    out = {}
    for a, b in borders():
        if a not in shapes or b not in shapes:
            continue
        a, b = sorted((a, b))
        ga, gb = shapes[a], shapes[b]
        (ax, ay), (bx, by) = anchors[a], anchors[b]
        if (a, b) in FLOW_AT or (b, a) in FLOW_AT:
            x, y = to_svg(*FLOW_AT.get((a, b)) or FLOW_AT[(b, a)])
            ux, uy = bx - ax, by - ay
        else:
            shared = ga.boundary.intersection(gb.buffer(1.5))
            lines = [g for g in flatten(shared) if isinstance(g, LineString) and not g.is_empty]
            merged = linemerge(lines) if lines else None
            parts = [] if merged is None else list(getattr(merged, "geoms", [merged]))
            line = max(parts, key=lambda g: g.length) if parts else None
            if line is not None and line.length > 12:
                # Middle of the longest shared stretch, pointing across it
                m = line.length / 2
                p = line.interpolate(m)
                p0, p1 = line.interpolate(max(0, m - 15)), line.interpolate(min(line.length, m + 15))
                x, y = p.x, p.y
                ux, uy = -(p1.y - p0.y), p1.x - p0.x
                # Point towards b
                if ux * (bx - ax) + uy * (by - ay) < 0:
                    ux, uy = -ux, -uy
            else:
                p, q = nearest_points(ga, gb)
                x, y = (p.x + q.x) / 2, (p.y + q.y) / 2
                ux, uy = q.x - p.x, q.y - p.y
                if math.hypot(ux, uy) < 8:
                    ux, uy = bx - ax, by - ay
        n = math.hypot(ux, uy) or 1
        out[f"{a}|{b}"] = [round(x), round(y), round(ux / n, 3), round(uy / n, 3)]
    return out


def main(src, dst):
    a0 = shapefile.Reader(f"{src}/ne_10m_admin_0_countries")
    f0 = [f[0] for f in a0.fields[1:]]
    countries, world = {}, {}
    for sr in a0.iterShapeRecords():
        d = dict(zip(f0, sr.record))
        iso = d["ADM0_A3"]
        g = shape(sr.shape.__geo_interface__)
        c = clip(g)
        if not c.is_empty:
            countries[iso] = c
        w = clip(g, LAND_BBOX)
        if not w.is_empty:
            world[iso] = w

    a1 = shapefile.Reader(f"{src}/ne_10m_admin_1_states_provinces")
    f1 = [f[0] for f in a1.fields[1:]]
    regions = {}
    for sr in a1.iterShapeRecords():
        d = dict(zip(f1, sr.record))
        field = ADMIN1_COUNTRY.get(d["iso_a2"])
        if field:
            g = clip(shape(sr.shape.__geo_interface__))
            regions[d[field]] = unary_union([regions[d[field]], g]) if d[field] in regions else g

    zones = {}
    for z, names in ADMIN1_ZONES.items():
        missing = [n for n in names if n not in regions]
        assert not missing, missing
        zones[z] = unary_union([regions[n] for n in names])
    for z, isos in COUNTRY_ZONES.items():
        zones[z] = unary_union([countries[i] for i in isos if i in countries])
    neighbours = {z: unary_union([countries[i] for i in isos if i in countries]) for z, isos in NEIGHBOURS.items()}

    used = {i for v in list(COUNTRY_ZONES.values()) + list(NEIGHBOURS.values()) for i in v} | {"SWE", "NOR", "DNK", "ITA"}
    land = unary_union([g for iso, g in world.items() if iso not in used])

    def anchor_xy(z, g):
        lon, lat = ANCHORS.get(z) or (g.representative_point().x, g.representative_point().y)
        return to_svg(lon, lat)

    def anchor(z, g):
        x, y = anchor_xy(z, g)
        return f'data-x="{x:.0f}" data-y="{y:.0f}"'

    every = {**zones, **neighbours}
    spots = flow_spots({z: transform(g) for z, g in every.items()}, {z: anchor_xy(z, g) for z, g in every.items()})

    l, t, r, b = PAD
    out = [
        f'<svg class="zone-map" viewBox="{-l} {-t} {WIDTH + l + r} {HEIGHT + t + b}" preserveAspectRatio="xMidYMin meet" xmlns="http://www.w3.org/2000/svg" role="img" aria-labelledby="map-title">',
        '<title id="map-title">{{ t("map.title") }}</title>',
        f'<path class="land" d="{path(transform(land), LAND_SIMPLIFY)}"/>',
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
    out.append(f"<g class=\"flows\" aria-hidden=\"true\" data-at='{json.dumps(spots, separators=(',', ':'))}'></g>")
    out.append('<g class="labels" aria-hidden="true"></g>')
    out.append("</svg>")
    with open(dst, "w", encoding="utf-8") as fh:
        fh.write("\n".join(out) + "\n")
    print(f"wrote {dst}: {WIDTH}x{HEIGHT}")


if __name__ == "__main__":
    main(sys.argv[1], sys.argv[2])
