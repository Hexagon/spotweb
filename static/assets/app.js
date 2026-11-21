/* spotweb 2 client. No build step, no framework.
 * Settings are stored in localStorage with the same keys as spotweb 1.x. */
(() => {
  "use strict";

  const bootEl = document.getElementById("sw-boot");
  if (!bootEl) return;
  const boot = JSON.parse(bootEl.textContent);
  const lang = boot.lang;
  const LOCALES = { sv: "sv-SE", nl: "nl-NL", no: "nb-NO", fi: "fi-FI", dk: "da-DK", es: "es-ES", fr: "fr-FR", de: "de-DE", en: "en-GB" };
  const locale = LOCALES[lang] || "en-GB";
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));

  const t = (key) => {
    const k = key.startsWith("common.") ? key : "common." + key;
    let v = boot.i18n;
    for (const p of k.split(".")) v = v && v[p];
    return typeof v === "string" ? v : key;
  };

  // ---------------------------------------------------------------- settings
  const store = {
    get: (k) => { try { return localStorage.getItem(k); } catch (_e) { return null; } },
    set: (k, v) => { try { localStorage.setItem(k, v); } catch (_e) { /* private mode */ } },
  };
  const defaultCurrency = (l) => ({ sv: "öre", no: "NOK", dk: "DKK", pl: "PLN" })[l] || "EUR";
  const defaultDecimals = (c) => (c === "öre" ? 1 : c === "EUR" ? 3 : 2);
  const num = (v, d) => { const n = parseFloat(v); return Number.isFinite(n) ? n : d; };

  const prefs = {};
  const loadPrefs = () => {
    prefs.currency = store.get("sw_currency") || defaultCurrency(lang);
    prefs.multiplier = num(store.get("sw_multiplier"), 1);
    prefs.factor = num(store.get("sw_factor"), 1);
    prefs.extra = num(store.get("sw_extra"), 0);
    prefs.decimals = Math.max(0, Math.min(10, Math.round(num(store.get("sw_decimals"), defaultDecimals(prefs.currency)))));
    prefs.pricefactor = store.get("sw_pricefactor") === "true";
  };
  loadPrefs();

  const rate = (cur) => {
    const c = cur === "öre" ? "SEK" : cur;
    if (c === "EUR") return 1;
    const r = boot.er && boot.er.entries ? boot.er.entries[c] : undefined;
    return r === undefined ? NaN : r;
  };

  /** EUR/MWh -> formatted price per kWh in the selected currency (same math as 1.x processPrice) */
  const priceNum = (eurMwh) => {
    if (eurMwh === null || eurMwh === undefined || Number.isNaN(eurMwh)) return null;
    let p = (eurMwh * rate(prefs.currency)) / 1000;
    if (prefs.pricefactor) p = (p * prefs.multiplier + prefs.extra) * prefs.factor;
    if (prefs.currency === "öre") p *= 100;
    return Number.isFinite(p) ? p : null;
  };
  const price = (eurMwh) => {
    const p = priceNum(eurMwh);
    return p === null ? "-" : p.toFixed(prefs.decimals);
  };
  const priceRounded = (eurMwh) => {
    const p = priceNum(eurMwh);
    return p === null ? null : Number(p.toFixed(prefs.decimals));
  };
  const unit = () => prefs.currency + "/kWh";
  const mwFmt = new Intl.NumberFormat(locale, { maximumFractionDigits: 0 });
  const mw = (v) => (v === null || v === undefined || Number.isNaN(v) ? "" : mwFmt.format(v));
  const timeFmt = new Intl.DateTimeFormat(locale, { hour: "2-digit", minute: "2-digit" });
  const dayFmt = new Intl.DateTimeFormat(locale, { weekday: "short", day: "numeric", month: "short" });
  const hhmm = (ms) => timeFmt.format(new Date(ms));

  // --------------------------------------------------------------- rendering
  const renderStatic = () => {
    $$("[data-eur]").forEach((el) => { el.textContent = price(parseFloat(el.dataset.eur)); });
    $$("[data-unit]").forEach((el) => { el.textContent = unit(); });
    $$("[data-unit-currency]").forEach((el) => { el.textContent = prefs.currency === "öre" ? "SEK" : prefs.currency; });
    $$("[data-er-rate]").forEach((el) => { const r = rate(prefs.currency); el.textContent = Number.isFinite(r) ? r : "-"; });
    $$("[data-pref-show]").forEach((el) => { el.textContent = prefs[el.dataset.prefShow]; });
    document.body.classList.toggle("pricefactor", prefs.pricefactor);
    document.body.classList.toggle("currency-eur", prefs.currency === "EUR");
    const warn = $("#pricefactor-warning");
    if (warn) {
      const show = prefs.pricefactor && !prefs.extra && (prefs.factor === 1 || !prefs.factor) && store.get("sw_warning_dismissed") !== "yes";
      warn.classList.toggle("hidden", !show);
    }
  };

  /** Rows `[[time, price, duration]]` for an area, used to roll "now" forward without reloading */
  const nowFromRows = (rows, now) => {
    const r = (rows || []).find((x) => x[0] <= now && x[0] + x[2] > now);
    return r ? r[1] : null;
  };
  const areaRows = (a) => (a && a.today ? a.today.points.map((p) => [p[0], p[1], a.today.interval]) : []);

  const renderNow = () => {
    const now = Date.now();
    const areas = boot.areas || (boot.area ? [boot.area] : []);
    const byArea = {};
    for (const a of areas) byArea[a.name] = nowFromRows(areaRows(a), now);
    if (boot.upcoming) for (const [k, rows] of Object.entries(boot.upcoming)) {
      const v = nowFromRows(rows, now);
      if (v !== null) byArea[k] = v;
    }
    $$("[data-now-area]").forEach((el) => {
      const v = byArea[el.dataset.nowArea];
      if (v !== undefined && v !== null) el.innerHTML = `<span class="p" data-eur="${v}">${price(v)}</span>`;
    });
    if (boot.upcoming) {
      $$("[data-now-country]").forEach((el) => {
        const c = boot.countries.find((x) => x.id === el.dataset.nowCountry);
        if (!c) return;
        const vals = c.areas.map((a) => byArea[a.name]).filter((v) => v !== undefined && v !== null);
        if (vals.length) {
          const v = vals.reduce((a, b) => a + b, 0) / vals.length;
          el.innerHTML = `<span class="p" data-eur="${v}">${price(v)}</span>`;
        }
      });
    }
  };

  // ------------------------------------------------------------------ charts
  const charts = {};
  const COLORS = ["rgba(224,255,24,.85)", "rgba(24,255,124,.85)", "rgba(24,144,255,.9)", "rgba(232,24,255,.85)", "rgba(224,24,71,.9)"];
  const PSR_COLORS = {
    nuclear_0: "#f6c344", water_0: "#1890ff", water_1: "#0b4d8c", wind_0: "#7fd8ff", wind_1: "#3d8aa8", solar_0: "#ffe14d",
    gas_0: "#ff8a3d", coal_0: "#8d6e63", oil_0: "#6d4c41", peat_0: "#a1887f", other_0: "#9e9e9e", other_1: "#616161",
  };
  const baseChart = () => ({
    chart: { foreColor: "#c7cbd6", toolbar: { show: false }, height: 330, animations: { enabled: false }, background: "transparent", zoom: { enabled: false } },
    theme: { mode: "dark" },
    yaxis: { forceNiceScale: true, labels: { formatter: (v) => (v === null || v === undefined ? "" : Number(v).toFixed(Math.min(prefs.decimals, 2))) } },
    xaxis: { type: "datetime", labels: { datetimeUTC: false } },
    legend: { show: true },
    stroke: { width: 3, curve: "stepline" },
    dataLabels: { enabled: false },
    tooltip: { theme: "dark", x: { format: "yyyy-MM-dd HH:mm" } },
    grid: { borderColor: "#2a3145" },
  });
  const nowAnnotation = (x) => ({
    xaxis: [{ x, borderColor: "#ff7da0", label: { style: { color: "#eee", background: "#234" }, text: t("chart.now") } }],
  });
  const minY = (series) => {
    let m = 0;
    for (const s of series) for (const p of s.data) if (p.y !== null && p.y < m) m = p.y;
    return m;
  };
  const draw = (id, options) => {
    const el = $(`[data-chart="${id}"]`);
    if (!el || typeof ApexCharts === "undefined") return;
    if (charts[id]) { charts[id].destroy(); delete charts[id]; }
    el.innerHTML = "";
    const hasData = (options.series || []).some((s) => s.data && s.data.length);
    if (!hasData) { el.innerHTML = `<div class="chart-empty muted">-</div>`; return; }
    charts[id] = new ApexCharts(el, options);
    charts[id].render();
  };
  const toSeries = (points, shift = 0) => points.map((p) => ({ x: p[0] + shift, y: priceRounded(p[1]) }));
  const unitTooltip = (o) => { o.tooltip.y = { formatter: (v) => (v === null || v === undefined ? "-" : `${Number(v).toFixed(prefs.decimals)} ${unit()}`) }; return o; };

  const currentSlot = (a) => {
    const now = Date.now();
    const r = areaRows(a).find((x) => x[0] <= now && x[0] + x[2] > now);
    return r ? r[0] : now;
  };

  const chartAreaToday = () => {
    const a = boot.area;
    if (!a) return;
    const day = 24 * 3600 * 1000;
    const series = [{ name: t("chart.today"), data: toSeries(a.today.points) }];
    if (a.tomorrow.points.length) {
      // Overlay tomorrow on today's axis, like 1.x
      const shift = a.today.points.length ? a.today.points[0][0] - a.tomorrow.points[0][0] : -day;
      series.push({ name: t("chart.tomorrow"), data: toSeries(a.tomorrow.points, shift) });
    }
    const o = unitTooltip(baseChart());
    o.series = series;
    o.colors = ["rgba(24,255,124,1)", "rgba(110,120,230,1)"];
    o.yaxis.min = minY(series);
    o.xaxis.labels.format = "HH:mm";
    o.tooltip.x.format = "HH:mm";
    o.annotations = nowAnnotation(currentSlot(a));
    draw("area-today", o);
  };

  const chartAllAreas = (which) => {
    if (!boot.areas) return;
    const series = boot.areas.map((a) => ({ name: a.name, data: toSeries(a[which].points) }));
    const o = unitTooltip(baseChart());
    o.series = series;
    o.colors = boot.areas.map((a) => COLORS[(a.color - 1) % COLORS.length]);
    o.yaxis.min = minY(series);
    o.xaxis.labels.format = "HH:mm";
    if (which === "today") o.annotations = nowAnnotation(currentSlot(boot.areas[0]));
    draw("all-" + which, o);
  };

  const chartProduction = () => {
    const p = boot.production;
    if (!p) return;
    const o = baseChart();
    o.chart.type = "bar";
    o.chart.stacked = true;
    o.plotOptions = { bar: { columnWidth: "95%" } };
    o.stroke = { width: 0 };
    o.fill = { opacity: 0.85 };
    o.series = p.series.map((s) => ({ name: t("generation.psr_" + s.key), data: s.data.map((v, i) => ({ x: p.times[i], y: v })) }));
    o.colors = p.series.map((s) => PSR_COLORS[s.key] || "#9e9e9e");
    o.yaxis = { labels: { formatter: (v) => mw(v) } };
    o.tooltip.y = { formatter: (v) => (mw(v) ? `${mw(v)} MW` : "") };
    o.annotations = { yaxis: [{ y: 0, borderColor: "#ccc", strokeDashArray: 0 }] };
    draw("production", o);
  };

  const chartNet = () => {
    if (!boot.net) return;
    const o = baseChart();
    o.chart.type = "bar";
    o.stroke = { width: 0 };
    o.plotOptions = { bar: { columnWidth: "95%", colors: { ranges: [{ from: -1e9, to: 0, color: "#ff5c6c" }, { from: 0, to: 1e9, color: "#33d17a" }] } } };
    o.series = [{ name: t("chart.net_production"), data: boot.net.map((r) => ({ x: r[0], y: r[1] })) }];
    o.yaxis = { labels: { formatter: (v) => mw(v) } };
    o.tooltip.y = { formatter: (v) => (mw(v) ? `${mw(v)} MW` : "") };
    o.legend = { show: false };
    draw("net", o);
  };

  // API helpers
  const isoDate = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  const apiCache = {};
  const fetchSpot = (area, period, start, end) => {
    const url = `/api/v2/spot?${new URLSearchParams({ area, period, startDate: start, endDate: end })}`;
    if (!apiCache[url]) apiCache[url] = fetch(url).then((r) => r.json()).then((j) => (j.status === "ok" ? j.data : []));
    return apiCache[url];
  };
  const tomorrowIso = () => { const d = new Date(); d.setDate(d.getDate() + 1); return isoDate(d); };
  const monthName = (ms) => { const d = new Date(ms); return `${t("months." + d.getMonth())} ${d.getFullYear()}`; };

  const chartLongTermArea = async () => {
    const a = boot.area;
    if (!a || !$('[data-chart="longterm-area"]')) return;
    const data = await fetchSpot(a.name, "monthly", "2021-01-01", tomorrowIso());
    const o = unitTooltip(baseChart());
    o.series = [{ name: a.name, data: data.map((r) => ({ x: r.time, y: priceRounded(r.price) })) }];
    o.stroke = { width: 2, curve: "smooth" };
    o.colors = ["rgba(24,255,124,1)"];
    o.tooltip.x.format = "MMM yyyy";
    o.yaxis.min = minY(o.series);
    draw("longterm-area", o);
    // Months as rows, years as columns
    const years = [...new Set(data.map((r) => new Date(r.time).getFullYear()))].sort();
    const cell = (y, m) => { const r = data.find((d) => { const x = new Date(d.time); return x.getFullYear() === y && x.getMonth() === m; }); return r ? price(r.price) : "-"; };
    let html = `<thead><tr><th>${t("longtermchart.month")}</th>${years.map((y) => `<th class="num">${y}</th>`).join("")}</tr></thead><tbody>`;
    for (let m = 0; m < 12; m++) html += `<tr><td>${t("months." + m)}</td>${years.map((y) => `<td class="num">${cell(y, m)}</td>`).join("")}</tr>`;
    $("#longterm-table").innerHTML = html + "</tbody>";
  };

  const chartLongTermCountry = async () => {
    if (!boot.areas || !$('[data-chart="longterm-country"]')) return;
    const sets = await Promise.all(boot.areas.map((a) => fetchSpot(a.name, "monthly", "2021-01-01", tomorrowIso())));
    const o = unitTooltip(baseChart());
    o.series = boot.areas.map((a, i) => ({ name: a.name, data: sets[i].map((r) => ({ x: r.time, y: priceRounded(r.price) })) }));
    o.colors = boot.areas.map((a) => COLORS[(a.color - 1) % COLORS.length]);
    o.stroke = { width: 2, curve: "smooth" };
    o.tooltip.x.format = "MMM yyyy";
    o.yaxis.min = minY(o.series);
    draw("longterm-country", o);
    const months = [...new Set(sets.flat().map((r) => r.time))].sort((a, b) => b - a);
    let html = `<thead><tr><th>${t("longtermchart.month")}</th>${boot.areas.map((a) => `<th class="num">${a.name}</th>`).join("")}</tr></thead><tbody>`;
    for (const m of months) {
      html += `<tr><td>${monthName(m)}</td>${sets.map((s) => { const r = s.find((x) => x.time === m); return `<td class="num">${r ? price(r.price) : "-"}</td>`; }).join("")}</tr>`;
    }
    $("#longterm-table").innerHTML = html + "</tbody>";
  };

  const chartThirtyDays = async () => {
    const a = boot.area;
    if (!a || !$('[data-chart="thirty-days"]')) return;
    const start = new Date(Date.now() - 30 * 24 * 3600 * 1000);
    const compare = $("#compare-select") ? $("#compare-select").value : "";
    const names = [a.name].concat(compare ? [compare] : []);
    const sets = await Promise.all(names.map((n) => fetchSpot(n, "daily", isoDate(start), tomorrowIso())));
    const o = unitTooltip(baseChart());
    o.series = names.map((n, i) => ({ name: n, data: sets[i].map((r) => ({ x: r.time, y: priceRounded(r.price) })) }));
    o.stroke = { width: 2, curve: "smooth" };
    o.colors = ["rgba(24,255,124,1)", "rgba(79,96,255,.9)"];
    o.tooltip.x.format = "yyyy-MM-dd";
    o.yaxis.min = minY(o.series);
    const midnight = new Date(); midnight.setHours(0, 0, 0, 0);
    o.annotations = nowAnnotation(midnight.getTime());
    draw("thirty-days", o);
  };

  /** Today/tomorrow table with bars, plus the cheapest periods ahead */
  const priceTable = () => {
    const a = boot.area;
    const table = $("#price-table");
    if (!a || !table) return;
    const rows = areaRows(a).concat(a.tomorrow.points.map((p) => [p[0], p[1], a.tomorrow.interval]));
    if (!rows.length) { table.innerHTML = ""; return; }
    const vals = rows.map((r) => r[1]);
    const lo = Math.min(...vals), hi = Math.max(...vals);
    const now = Date.now();
    let html = `<thead><tr><th>${t("chart.time")}</th><th class="num">${t("chart.price")} <small>(${unit()})</small></th><th></th></tr></thead><tbody>`;
    let lastDay = "";
    for (const r of rows) {
      const day = dayFmt.format(new Date(r[0]));
      if (day !== lastDay) { html += `<tr><th colspan="3">${day}</th></tr>`; lastDay = day; }
      const frac = hi > lo ? (r[1] - lo) / (hi - lo) : 0.5;
      const hue = Math.round(120 - 120 * frac);
      const cur = r[0] <= now && r[0] + r[2] > now ? ' class="current"' : "";
      html += `<tr${cur}><td>${hhmm(r[0])}&ndash;${hhmm(r[0] + r[2])}</td><td class="num">${price(r[1])}</td><td style="width:40%"><span class="bar" style="width:${Math.max(2, frac * 100)}%;background:hsl(${hue},70%,50%)"></span></td></tr>`;
    }
    table.innerHTML = html + "</tbody>";
    const curRow = $("tr.current", table);
    if (curRow && table.parentElement) table.parentElement.scrollTop = Math.max(0, curRow.offsetTop - 60);

    const box = $("#cheapest");
    if (!box) return;
    const ahead = rows.filter((r) => r[0] + r[2] > now);
    const cheapest = (hours) => {
      const ms = hours * 3600 * 1000;
      let best = null;
      for (let i = 0; i < ahead.length; i++) {
        let sum = 0, dur = 0, j = i;
        while (j < ahead.length && dur < ms) {
          if (j > i && ahead[j][0] !== ahead[j - 1][0] + ahead[j - 1][2]) break;
          sum += ahead[j][1] * ahead[j][2]; dur += ahead[j][2]; j++;
        }
        if (dur >= ms && (!best || sum / dur < best.avg)) best = { start: ahead[i][0], end: ahead[i][0] + dur, avg: sum / dur };
      }
      return best;
    };
    const parts = [[1, "overview.cheapest_hour"], [3, "overview.cheapest_3h"]].map(([h, key]) => {
      const b = cheapest(h);
      return b ? `${t(key)}: <strong>${dayFmt.format(new Date(b.start))} ${hhmm(b.start)}&ndash;${hhmm(b.end)}</strong> (${price(b.avg)} ${unit()})` : "";
    }).filter(Boolean);
    box.innerHTML = parts.join("<br>");
  };

  // ----------------------------------------------------------- custom page
  const custom = async () => {
    const form = $("#custom-form");
    if (!form) return;
    const run = async () => {
      const fd = new FormData(form);
      const params = new URLSearchParams({ area: fd.get("area"), period: fd.get("period"), startDate: fd.get("startDate"), endDate: fd.get("endDate") });
      const res = await fetch(`/api/v2/spot?${params}`).then((r) => r.json());
      const data = res.status === "ok" ? res.data : [];
      $("#custom-result").classList.remove("hidden");
      $("#custom-permalink").href = `/custom?${params}`;
      $("#custom-json").href = `/api/v2/spot?${params}`;
      const avg = data.length ? data.reduce((a, r) => a + r.price, 0) / data.length : null;
      $("#custom-avg").textContent = `${price(avg)} ${unit()}`;
      $("#custom-min").textContent = `${price(data.length ? Math.min(...data.map((r) => r.min)) : null)} ${unit()}`;
      $("#custom-max").textContent = `${price(data.length ? Math.max(...data.map((r) => r.max)) : null)} ${unit()}`;
      const fmt = (ms) => (ms === null ? "Total" : new Date(ms).toLocaleString(locale));
      let html = `<thead><tr><th>Date/Time</th><th class="num">Price</th><th class="num">Min</th><th class="num">Max</th><th>Unit</th></tr></thead><tbody>`;
      const shown = data.slice(0, 5000);
      for (const r of shown) html += `<tr><td>${fmt(r.time)}</td><td class="num">${price(r.price)}</td><td class="num">${price(r.min)}</td><td class="num">${price(r.max)}</td><td>${unit()}</td></tr>`;
      $("#custom-table").innerHTML = html + "</tbody>";
      const csv = ["time,price,min,max,unit"].concat(data.map((r) => [r.time === null ? "" : new Date(r.time).toISOString(), price(r.price), price(r.min), price(r.max), unit()].join(","))).join("\n");
      $("#custom-csv").href = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
      const o = unitTooltip(baseChart());
      o.series = [{ name: fd.get("area"), data: data.filter((r) => r.time !== null).map((r) => ({ x: r.time, y: priceRounded(r.price) })) }];
      o.stroke = { width: 2, curve: fd.get("period") === "hourly" ? "stepline" : "smooth" };
      o.colors = ["#54ef54"];
      o.yaxis.min = minY(o.series);
      draw("custom", o);
    };
    form.addEventListener("submit", (e) => { e.preventDefault(); history.replaceState(null, "", `/custom?${new URLSearchParams(new FormData(form))}`); run(); });
    customRun = run;
    if (boot.form && boot.form.auto) run();
  };
  let customRun = null;

  // ---------------------------------------------------- home assistant page
  const hass = () => {
    const el = $("#hass-conf");
    if (!el) return;
    const sel = $("#ha-area");
    const area = sel.value;
    const interval = sel.selectedOptions[0].dataset.interval;
    const cur = prefs.currency === "öre" ? "SEK" : prefs.currency;
    const extra = prefs.pricefactor ? prefs.extra : 0;
    const factor = prefs.pricefactor ? prefs.factor : 1;
    const multiplier = prefs.pricefactor ? prefs.multiplier : 1;
    const decimals = Math.max(prefs.decimals, 3);
    el.textContent = `rest:
  - scan_interval: 180
    resource: ${el.dataset.base}/api/v2/hass?currency=${cur}&area=${area}&multiplier=${multiplier}&extra=${extra}&factor=${factor}&decimals=${decimals}&interval=${interval}
    sensor:
      - name: "Spotprice Now"
        unique_id: "56k_spotprice_now"
        value_template: "{{ value_json.now }}"
        unit_of_measurement: "${cur}/kWh"
        device_class: "monetary"
        json_attributes:
          - data
          - avg
          - min
          - max
          - avg_tomorrow
          - min_tomorrow
          - max_tomorrow
          - avg_yesterday
          - min_yesterday
          - max_yesterday`;
    $("#apex-conf").textContent = `type: custom:apexcharts-card
experimental:
  color_threshold: true
graph_span: 2day
update_interval: 2m
now:
  show: true
  label: Now
  color: gray
span:
  offset: '+0day'
  start: day
yaxis:
  - id: primary
    decimals: 0
    min: 0
header:
  show: true
  title: Electricity Price - Today and tomorrow
  show_states: true
  colorize_states: true
all_series_config:
  color_threshold:
    - value: 0
      color: green
    - value: 75
      color: orange
    - value: 130
      color: red
  unit: 'c/kWh'
  type: line
  stroke_width: 0
  show:
    legend_value: false
    in_header: true
    header_color_threshold: true
series:
  - entity: sensor.spotprice_now
    type: column
    name: Right now
    show:
      extremas: true
      in_header: before_now
    data_generator: >
      return entity.attributes.data.map(e => [Date.parse(e.st), parseFloat(e.p) * 100]);
  - entity: sensor.spotprice_now
    name: Today (avg)
    data_generator: >
      return [[new Date(), entity.attributes.avg * 100]]
  - entity: sensor.spotprice_now
    name: Tomorrow (avg)
    data_generator: >
      return [[new Date(), entity.attributes.avg_tomorrow * 100]]`;
  };

  // ------------------------------------------------------------ settings UI
  const settingsUi = () => {
    const drawer = $("#settings");
    const backdrop = $(".drawer-backdrop");
    const open = () => { drawer.hidden = false; backdrop.hidden = false; $("#pref-pricefactor").focus(); };
    const close = () => { drawer.hidden = true; backdrop.hidden = true; };
    $$("[data-open-settings]").forEach((b) => b.addEventListener("click", open));
    $$("[data-close-settings]").forEach((b) => b.addEventListener("click", close));
    document.addEventListener("keydown", (e) => { if (e.key === "Escape" && !drawer.hidden) close(); });

    const fill = () => {
      $("#pref-pricefactor").checked = prefs.pricefactor;
      $("#pref-currency").value = prefs.currency;
      $("#pref-extra").value = prefs.extra;
      $("#pref-multiplier").value = prefs.multiplier;
      $("#pref-factor").value = prefs.factor;
      $("#pref-decimals").value = prefs.decimals;
      ["extra", "multiplier", "factor"].forEach((k) => { $("#pref-" + k).disabled = !prefs.pricefactor; });
    };
    fill();
    const bind = (id, key, parse) => {
      $(id).addEventListener("change", (e) => {
        const v = parse(e.target);
        if (v === null) { fill(); return; }
        store.set(key, String(v));
        if (key === "sw_currency" && store.get("sw_decimals") === null) { /* keep currency default decimals */ }
        loadPrefs();
        fill();
        rerender();
      });
    };
    bind("#pref-pricefactor", "sw_pricefactor", (el) => (el.checked ? "true" : "false"));
    bind("#pref-currency", "sw_currency", (el) => el.value);
    const parseNum = (el) => { const n = parseFloat(String(el.value).replace(",", ".")); return Number.isFinite(n) ? n : null; };
    bind("#pref-extra", "sw_extra", parseNum);
    bind("#pref-multiplier", "sw_multiplier", parseNum);
    bind("#pref-factor", "sw_factor", parseNum);
    bind("#pref-decimals", "sw_decimals", (el) => { const n = parseInt(el.value, 10); return n >= 0 && n <= 10 ? n : null; });

    $$("[data-dismiss-warning]").forEach((b) => b.addEventListener("click", () => { store.set("sw_warning_dismissed", "yes"); renderStatic(); }));
    if ($("#ha-area")) $("#ha-area").addEventListener("change", hass);
    if ($("#compare-select")) $("#compare-select").addEventListener("change", chartThirtyDays);
    $$("[data-copy]").forEach((b) => b.addEventListener("click", () => {
      const txt = $("#" + b.dataset.copy).textContent;
      if (navigator.clipboard) navigator.clipboard.writeText(txt).then(() => { b.textContent = "Copied"; setTimeout(() => { b.textContent = "Copy"; }, 1500); });
    }));
  };

  // -------------------------------------------------------------- lifecycle
  const safe = (fn) => { try { const r = fn(); if (r && r.catch) r.catch((e) => console.error(e)); } catch (e) { console.error(e); } };
  const rerender = () => {
    renderStatic();
    renderNow();
    [chartAreaToday, () => chartAllAreas("today"), () => chartAllAreas("tomorrow"), chartProduction, chartNet,
      chartLongTermArea, chartLongTermCountry, chartThirtyDays, priceTable, hass].forEach(safe);
    if (customRun && !$("#custom-result").classList.contains("hidden")) safe(customRun);
    renderStatic();
  };

  settingsUi();
  safe(custom);
  rerender();

  // Ads
  $$("ins.adsbygoogle").forEach(() => { try { (window.adsbygoogle = window.adsbygoogle || []).push({}); } catch (_e) { /* blocked */ } });

  // Roll the "now" price forward every 30 seconds, re-mark the chart on new intervals
  let lastSlot = boot.area ? currentSlot(boot.area) : null;
  setInterval(() => {
    renderNow();
    renderStatic();
    if (boot.area) {
      const s = currentSlot(boot.area);
      if (s !== lastSlot) { lastSlot = s; safe(chartAreaToday); safe(priceTable); }
    }
  }, 30000);

  // Reload at each full hour to pick up new data (if the page has been open for more than two minutes)
  const loaded = Date.now();
  const scheduleReload = () => {
    const next = new Date(); next.setMinutes(60, 0, 0);
    const jitter = 10000 + Math.random() * 50000;
    setTimeout(() => {
      if (Date.now() - loaded < 120000) { scheduleReload(); return; }
      if (document.visibilityState === "visible") location.reload();
      else document.addEventListener("visibilitychange", () => location.reload(), { once: true });
    }, next.getTime() - Date.now() + jitter);
  };
  if (["index"].includes(boot.page) || boot.area || boot.areas) scheduleReload();
})();
