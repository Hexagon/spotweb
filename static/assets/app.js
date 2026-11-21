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
  // Text alternative for a chart: per series lowest-highest value and average
  const chartSummary = (el, series, fmt) => {
    const head = el.closest("section");
    const title = head && head.querySelector("h1, h2, h3") ? head.querySelector("h1, h2, h3").textContent.trim() : "";
    const parts = series.map((s) => {
      const ys = (s.data || []).map((p) => p.y).filter((v) => typeof v === "number" && Number.isFinite(v));
      if (!ys.length) return "";
      const avg = ys.reduce((a, v) => a + v, 0) / ys.length;
      return `${s.name}: ${fmt(Math.min(...ys))} – ${fmt(Math.max(...ys))}, ${t("a11y.average")} ${fmt(avg)}`;
    }).filter(Boolean);
    return [title, ...parts].filter(Boolean).join(". ");
  };
  const priceFmt = (v) => `${new Intl.NumberFormat(locale, { minimumFractionDigits: prefs.decimals, maximumFractionDigits: prefs.decimals }).format(v)} ${unit()}`;
  const mwText = (v) => `${mw(v)} MW`;
  const draw = (id, options, fmt = priceFmt) => {
    const el = $(`[data-chart="${id}"]`);
    if (!el || typeof ApexCharts === "undefined") return;
    if (charts[id]) { charts[id].destroy(); delete charts[id]; }
    el.innerHTML = "";
    const hasData = (options.series || []).some((s) => s.data && s.data.length);
    el.setAttribute("role", "img");
    if (!hasData) { el.innerHTML = `<div class="chart-empty muted">-</div>`; el.setAttribute("aria-label", t("a11y.no_data")); return; }
    el.setAttribute("aria-label", chartSummary(el, options.series, fmt));
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
    draw("production", o, mwText);
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
    draw("net", o, mwText);
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
      const err = $("#custom-error");
      if (err) { err.textContent = res.status === "ok" ? "" : res.details || t("custom.error"); err.classList.toggle("hidden", res.status === "ok"); }
      $("#custom-result").classList.remove("hidden");
      $("#custom-permalink").href = `/custom?${params}`;
      $("#custom-json").href = `/api/v2/spot?${params}`;
      const avg = data.length ? data.reduce((a, r) => a + r.price, 0) / data.length : null;
      $("#custom-avg").textContent = `${price(avg)} ${unit()}`;
      $("#custom-min").textContent = `${price(data.length ? Math.min(...data.map((r) => r.min)) : null)} ${unit()}`;
      $("#custom-max").textContent = `${price(data.length ? Math.max(...data.map((r) => r.max)) : null)} ${unit()}`;
      const fmt = (ms) => (ms === null ? t("custom.total") : new Date(ms).toLocaleString(locale));
      let html = `<thead><tr><th>${t("custom.datetime")}</th><th class="num">${t("chart.price")}</th><th class="num">${t("custom.min")}</th><th class="num">${t("custom.max")}</th><th>${t("customize.unit")}</th></tr></thead><tbody>`;
      const shown = data.slice(0, 5000);
      for (const r of shown) html += `<tr><td>${fmt(r.time)}</td><td class="num">${price(r.price)}</td><td class="num">${price(r.min)}</td><td class="num">${price(r.max)}</td><td>${unit()}</td></tr>`;
      $("#custom-table").innerHTML = html + "</tbody>";
      const csv = [`# Source: ${res.source || "ENTSO-E Transparency Platform (https://transparency.entsoe.eu/)"}. Converted to ${unit()} with ECB reference rates by spotweb`, "time,price,min,max,unit"].concat(data.map((r) => [r.time === null ? "" : new Date(r.time).toISOString(), price(r.price), price(r.min), price(r.max), unit()].join(","))).join("\n");
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

  // ------------------------------------------------------------- start page map
  // Sequential ramp (one hue, dark = cheap, light = expensive) on the dark surface
  const RAMP = ["#2b2418", "#5a3d12", "#8f5a0e", "#c47a12", "#eea23a", "#ffd58a"];
  const hexRgb = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
  const rampColor = (f) => {
    const x = Math.max(0, Math.min(1, f)) * (RAMP.length - 1);
    const i = Math.min(RAMP.length - 2, Math.floor(x));
    const a = hexRgb(RAMP[i]), b = hexRgb(RAMP[i + 1]), k = x - i;
    return `rgb(${a.map((v, j) => Math.round(v + (b[j] - v) * k)).join(",")})`;
  };
  const SVG_NS = "http://www.w3.org/2000/svg";
  const svgEl = (tag, attrs, parent) => {
    const el = document.createElementNS(SVG_NS, tag);
    for (const [k, v] of Object.entries(attrs || {})) el.setAttribute(k, v);
    if (parent) parent.appendChild(el);
    return el;
  };
  const esc = (s) => String(s === null || s === undefined ? "" : s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
  const NORDIC = ["sv", "no", "fi", "dk"];

  const map = { ready: false, selected: null, view: null };
  const zoneNow = (name) => {
    const z = boot.zones[name];
    const v = boot.upcoming ? nowFromRows(boot.upcoming[name], Date.now()) : null;
    return v !== null && v !== undefined ? v : z ? z.now : null;
  };
  const zoneLabel = (name) => (boot.zones[name] ? `${name} – ${boot.zones[name].long}` : `${name} – ${(boot.neighbours || {})[name] || ""}`);

  const mapSetup = () => {
    const app = $("#map-app");
    if (!app || !boot.zones) return false;
    const svg = $("svg.zone-map", app);
    map.app = app;
    map.svg = svg;
    map.tip = $(".map-tooltip", app);
    map.anchor = {};
    $$("[data-x]", svg).forEach((p) => { map.anchor[p.dataset.area || p.dataset.ext] = [Number(p.dataset.x), Number(p.dataset.y)]; });
    // Arrow spot and direction per border, from scripts/build_map.py: {"A|B": [x, y, ux, uy]} pointing A -> B
    try { map.flowAt = JSON.parse($("g.flows", svg).dataset.at || "{}"); } catch (_) { map.flowAt = {}; }
    map.full = svg.getAttribute("viewBox").split(" ").map(Number);
    // Nordic view: bounding box of the Nordic zones, padded to show the Baltic zones
    // Europe view: bounding box of all our zones
    const bbox = (keep) => {
      let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
      $$(".zone", svg).forEach((p) => {
        const z = boot.zones[p.dataset.area];
        if (!z || !keep(z)) return;
        const b = p.getBBox();
        x0 = Math.min(x0, b.x); y0 = Math.min(y0, b.y); x1 = Math.max(x1, b.x + b.width); y1 = Math.max(y1, b.y + b.height);
      });
      return Number.isFinite(x0) ? [x0, y0, x1 - x0, y1 - y0] : null;
    };
    const n = bbox((z) => NORDIC.includes(z.country));
    const e = bbox(() => true);
    map.nordic = n ? [n[0] - 70, n[1] - 15, n[2] + 120, n[3] + 75] : map.full;
    map.europe = e ? [e[0] - 60, e[1] - 15, e[2] + 100, e[3] + 30] : map.full;

    const select = (name, focus) => {
      if (!boot.zones[name]) return;
      map.selected = name;
      store.set("sw_map_area", name);
      if (location.hash !== "#" + name) history.replaceState(null, "", "#" + name);
      $("#zone-select").value = name;
      mapRender();
      if (focus && window.matchMedia("(max-width: 1000px)").matches) $("#zone-panel").scrollIntoView({ behavior: "smooth", block: "start" });
    };
    map.select = select;
    $$(".zone", svg).forEach((p) => {
      p.addEventListener("click", () => select(p.dataset.area, true));
      p.addEventListener("keydown", (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); select(p.dataset.area, true); } });
    });
    $("#zone-select").addEventListener("change", (e) => select(e.target.value, false));

    // Tooltip for zones, neighbours and arrows
    const showTip = (e, html) => {
      const wrap = map.tip.parentElement.getBoundingClientRect();
      map.tip.innerHTML = html;
      map.tip.hidden = false;
      const w = map.tip.offsetWidth, h = map.tip.offsetHeight;
      let x = e.clientX - wrap.left + 14, y = e.clientY - wrap.top + 14;
      if (x + w > wrap.width) x = e.clientX - wrap.left - w - 14;
      if (y + h > wrap.height) y = e.clientY - wrap.top - h - 14;
      map.tip.style.transform = `translate(${Math.max(0, x)}px, ${Math.max(0, y)}px)`;
    };
    svg.addEventListener("pointermove", (e) => {
      const target = e.target.closest("[data-area],[data-ext],[data-flow]");
      if (!target || e.pointerType === "touch") { map.tip.hidden = true; return; }
      if (target.dataset.flow) {
        const f = boot.flows.borders[Number(target.dataset.flow)];
        showTip(e, `<strong>${esc(f.from)} &rarr; ${esc(f.to)}</strong><br>${mw(f.value)} MW`);
      } else if (target.dataset.area) {
        const n = target.dataset.area;
        showTip(e, `<strong>${esc(zoneLabel(n))}</strong><br>${price(zoneNow(n))} ${esc(unit())}`);
      } else {
        showTip(e, `<strong>${esc(zoneLabel(target.dataset.ext))}</strong>`);
      }
    });
    svg.addEventListener("pointerleave", () => { map.tip.hidden = true; });

    // View toggle
    const setView = (v, animate) => {
      map.view = v;
      store.set("sw_map_view", v);
      $$("[data-map-view]", app).forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.mapView === v)));
      const to = v === "nordic" ? map.nordic : map.europe;
      const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      const from = svg.getAttribute("viewBox").split(" ").map(Number);
      map.to = to;
      scale();
      if (map.ready) mapRender();
      if (!animate || reduce) { svg.setAttribute("viewBox", to.join(" ")); return; }
      const t0 = performance.now(), dur = 450;
      const step = (now) => {
        const k = Math.min(1, (now - t0) / dur), e = 1 - Math.pow(1 - k, 3);
        svg.setAttribute("viewBox", from.map((f, i) => (f + (to[i] - f) * e).toFixed(1)).join(" "));
        if (k < 1) requestAnimationFrame(step);
      };
      requestAnimationFrame(step);
    };
    // Text and arrows grow when the map is drawn small (zoomed out or on a phone) so they stay readable
    const scale = () => {
      const to = map.to || map.full;
      const ppu = Math.min(svg.clientWidth / to[2], svg.clientHeight / to[3]) || 1;
      const k = Math.max(0.9, Math.min(2.4, Math.pow(1 / ppu, 0.8)));
      const changed = Math.abs(k - (map.k || 0)) > 0.02;
      map.k = k;
      svg.style.setProperty("--k", k.toFixed(3));
      return changed;
    };
    let resizeTimer = null;
    window.addEventListener("resize", () => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(() => { if (scale() && map.ready) safe(mapRender); }, 150);
    });
    $$("[data-map-view]", app).forEach((b) => b.addEventListener("click", () => setView(b.dataset.mapView, true)));
    setView(store.get("sw_map_view") || (NORDIC.includes(lang) ? "nordic" : "europe"), false);

    const fromHash = decodeURIComponent(location.hash.slice(1)).toUpperCase();
    const initial = [fromHash, store.get("sw_map_area"), app.dataset.defaultArea].find((n) => n && boot.zones[n]);
    map.selected = initial || Object.keys(boot.zones)[0];
    $("#zone-select").value = map.selected;
    window.addEventListener("hashchange", () => { const n = decodeURIComponent(location.hash.slice(1)).toUpperCase(); if (boot.zones[n]) select(n, false); });
    map.ready = true;
    return true;
  };

  const flowArrow = (g, f, i, selected) => {
    const a = map.anchor[f.from], b = map.anchor[f.to];
    if (!a || !b) return;
    const dx = b[0] - a[0], dy = b[1] - a[1], len = Math.hypot(dx, dy) || 1;
    let ux = dx / len, uy = dy / len, mid = [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];
    const spot = map.flowAt[[f.from, f.to].sort().join("|")];
    if (spot) {
      const s = f.from < f.to ? 1 : -1;
      mid = [spot[0], spot[1]];
      ux = spot[2] * s; uy = spot[3] * s;
    }
    const px = -uy, py = ux;
    const touches = selected && (f.from === selected || f.to === selected);
    const cls = "flow" + (touches ? " active" : selected ? " dim" : "");
    const grp = svgEl("g", { class: cls, "data-flow": i }, g);
    if (f.value < 1) {
      svgEl("circle", { cx: mid[0], cy: mid[1], r: 3, class: "flow-zero" }, grp);
      return;
    }
    const k = map.k || 1;
    const L = Math.min(34 * k, len * 0.55);
    const w = Math.min(10, 1.6 + Math.sqrt(f.value) / 7) * k;
    const hw = w + 4.5 * k, hl = Math.min(12 * k, 6 * k + w * 0.6);
    const tail = [mid[0] - ux * L / 2, mid[1] - uy * L / 2];
    const tip = [mid[0] + ux * L / 2, mid[1] + uy * L / 2];
    const base = [tip[0] - ux * hl, tip[1] - uy * hl];
    const pt = (p, s) => `${(p[0] + px * s).toFixed(1)},${(p[1] + py * s).toFixed(1)}`;
    const points = [pt(tail, w / 2), pt(base, w / 2), pt(base, hw / 2), `${tip[0].toFixed(1)},${tip[1].toFixed(1)}`, pt(base, -hw / 2), pt(base, -w / 2), pt(tail, -w / 2)];
    svgEl("polygon", { points: points.join(" "), class: "flow-arrow" }, grp);
    // Wider invisible hit target
    svgEl("line", { x1: tail[0], y1: tail[1], x2: tip[0], y2: tip[1], class: "flow-hit" }, grp);
    if (touches) {
      const off = hw / 2 + 9 * k;
      const side = py > 0 ? -1 : 1;
      const txt = svgEl("text", { x: (mid[0] + px * off * side).toFixed(1), y: (mid[1] + py * off * side + 4).toFixed(1), class: "flow-label", "text-anchor": "middle" }, grp);
      txt.setAttribute("y", (mid[1] + py * off * side + 4 * k).toFixed(1));
      txt.textContent = mw(f.value);
    }
  };

  const mapRender = () => {
    if (!map.ready && !mapSetup()) return;
    const svg = map.svg;
    const sel = map.selected;
    // Colors
    const prices = Object.keys(boot.zones).map((n) => [n, zoneNow(n)]).filter((x) => x[1] !== null && x[1] !== undefined);
    const vals = prices.map((x) => x[1]);
    const lo = vals.length ? Math.min(...vals) : 0, hi = vals.length ? Math.max(...vals) : 1;
    $$(".zone", svg).forEach((p) => {
      const v = zoneNow(p.dataset.area);
      p.style.fill = v === null || v === undefined ? "" : rampColor(hi > lo ? (v - lo) / (hi - lo) : 0.5);
      p.classList.toggle("no-data", v === null || v === undefined);
      p.classList.toggle("selected", p.dataset.area === sel);
      p.setAttribute("aria-label", `${zoneLabel(p.dataset.area)}: ${price(v)} ${unit()}`);
      p.setAttribute("aria-pressed", String(p.dataset.area === sel));
    });
    // Keep the selected outline on top
    const selPath = $(`.zone[data-area="${sel}"]`, svg);
    if (selPath) selPath.parentNode.appendChild(selPath);
    $("[data-legend-min]").textContent = price(lo);
    $("[data-legend-max]").textContent = price(hi);
    $(".legend-ramp").style.background = `linear-gradient(90deg, ${RAMP.join(",")})`;

    // Flows
    const fg = $("g.flows", svg);
    fg.textContent = "";
    const borders = (boot.flows && boot.flows.borders) || [];
    borders.forEach((f, i) => { if (!(sel && (f.from === sel || f.to === sel))) flowArrow(fg, f, i, sel); });
    borders.forEach((f, i) => { if (sel && (f.from === sel || f.to === sel)) flowArrow(fg, f, i, sel); });
    const upd = boot.flows && boot.flows.updated;
    $("[data-flows-updated]").textContent = upd ? `${t("map.flows_updated")} ${dayFmt.format(new Date(upd))} ${hhmm(upd)}` : t("map.no_flows");

    // Labels
    const lg = $("g.labels", svg);
    lg.textContent = "";
    for (const name of Object.keys(boot.zones)) {
      const a = map.anchor[name];
      if (!a) continue;
      const g = svgEl("g", { class: "zone-label" + (name === sel ? " selected" : "") }, lg);
      const k = map.k || 1;
      svgEl("text", { x: a[0], y: a[1] - 6 * k, class: "zl-name", "text-anchor": "middle" }, g).textContent = name;
      svgEl("text", { x: a[0], y: a[1] + 10 * k, class: "zl-price", "text-anchor": "middle" }, g).textContent = price(zoneNow(name));
    }
    for (const name of Object.keys(boot.neighbours || {})) {
      const a = map.anchor[name];
      if (a) svgEl("text", { x: a[0], y: a[1] + 4, class: "zl-ext", "text-anchor": "middle" }, lg).textContent = name;
    }
    zonePanel();
  };

  const zonePanel = () => {
    const name = map.selected;
    const z = boot.zones[name];
    if (!z) return;
    const panel = $("#zone-panel");
    $("[data-zone-title]", panel).textContent = `${z.name} – ${z.long}`;
    $("[data-zone-sub]", panel).textContent = t("countries." + z.country);
    $("[data-zone-name]", panel).textContent = z.name;
    $("[data-zone-link]", panel).href = `/${z.country}/${encodeURIComponent(z.name)}`;
    $("[data-zone-now]", panel).textContent = price(zoneNow(name));
    $("[data-zone-avg-today]", panel).textContent = price(z.avg_today);
    $("[data-zone-span-today]", panel).textContent = z.min_today === null ? "" : `${t("overview.span")} ${price(z.min_today)} – ${price(z.max_today)}`;
    $("[data-zone-avg-tomorrow]", panel).textContent = z.avg_tomorrow === null ? t("map.not_published") : price(z.avg_tomorrow);
    $("[data-zone-avg-tomorrow]", panel).classList.toggle("muted", z.avg_tomorrow === null);
    $("[data-zone-span-tomorrow]", panel).textContent = z.min_tomorrow === null ? "" : `${price(z.min_tomorrow)} – ${price(z.max_tomorrow)}`;

    // Generation and load
    const gl = z.gl;
    const row = (k, v, cls) => `<div class="kv-row${cls ? " " + cls : ""}"><dt>${k}</dt><dd>${v}</dd></div>`;
    let html = "";
    if (gl) {
      if (gl.generation !== null) html += row(t("generation.production"), `${mw(gl.generation)} MW`);
      if (gl.load !== null) html += row(t("generation.consumption"), `${mw(gl.load)} MW`);
      if (gl.net !== null && gl.load !== null) html += row(gl.net < 0 ? t("generation.deficit") : t("generation.excess"), `${mw(gl.net)} MW`, gl.net < 0 ? "text-danger" : "text-success");
      if (gl.primary) html += row(t("generation.primary_source"), `${esc(t("generation.psr_" + gl.primary + "_0"))}${gl.primary_share !== null ? ` <span class="muted">(${gl.primary_share} %)</span>` : ""}`);
    }
    $("[data-zone-gl]", panel).innerHTML = html || `<div class="muted">-</div>`;

    // Flows touching the zone
    const list = ((boot.flows && boot.flows.borders) || []).filter((f) => f.from === name || f.to === name)
      .map((f) => ({ other: f.from === name ? f.to : f.from, value: f.value, import: f.to === name && f.value >= 1 }))
      .sort((a, b) => b.value - a.value);
    let net = 0;
    const max = Math.max(1, ...list.map((f) => f.value));
    $("[data-zone-flows]", panel).innerHTML = list.length ? list.map((f) => {
      net += f.import ? -f.value : f.value;
      const dir = f.value < 1 ? "" : f.import ? t("map.import") : t("map.export");
      const link = boot.zones[f.other] ? `<a href="#${esc(f.other)}" data-goto="${esc(f.other)}">${esc(f.other)}</a>` : `<span>${esc(f.other)}</span>`;
      return `<li class="${f.value < 1 ? "" : f.import ? "is-import" : "is-export"}"><span class="flow-dir" aria-hidden="true">${f.value < 1 ? "·" : f.import ? "&larr;" : "&rarr;"}</span>${link}<span class="muted small">${esc(dir)}</span><span class="flow-bar"><span style="width:${(f.value / max) * 50}%"></span></span><span class="num">${mw(f.value)} MW</span></li>`;
    }).join("") : `<li class="muted">${t("map.no_flows")}</li>`;
    $("[data-zone-flow-total]", panel).textContent = list.length ? `· ${net < 0 ? t("map.net_import") : t("map.net_export")} ${mw(Math.abs(net))} MW` : "";
    $$("[data-goto]", panel).forEach((a) => a.addEventListener("click", (e) => { e.preventDefault(); map.select(a.dataset.goto, false); }));

    // Today and tomorrow chart
    const pts = z.today.points.concat(z.tomorrow.points);
    const o = unitTooltip(baseChart());
    o.chart.height = 190;
    o.chart.type = "area";
    o.series = [{ name: z.name, data: toSeries(pts) }];
    o.colors = ["#eea23a"];
    o.fill = { type: "gradient", gradient: { shadeIntensity: 0, opacityFrom: 0.35, opacityTo: 0.02 } };
    o.stroke = { width: 2, curve: "stepline" };
    o.legend = { show: false };
    o.yaxis.min = minY(o.series);
    o.xaxis.labels.format = "HH:mm";
    o.tooltip.x.format = "ddd HH:mm";
    o.annotations = nowAnnotation(currentSlot(z));
    draw("zone", o);
  };

  // ------------------------------------------------------------------- share
  // Buttons with [data-share]. Touch devices get the system share sheet, others a small menu.
  // Links are resolved against the address the visitor uses and carry no language, so the
  // recipient sees the page in their own language.
  const shareUi = () => {
    const abs = (u) => new URL(u, location.origin).href;
    const nowText = (v) => (v && v !== "-" ? `${v} ${unit()} ${t("overview.right_now")}` : "");
    const info = (btn) => {
      if (btn.hasAttribute("data-share-zone")) {
        const z = boot.zones && boot.zones[map.selected];
        if (!z) return null;
        const v = zoneNow(map.selected);
        return { url: abs(`/#${encodeURIComponent(z.name)}`), title: `${z.name} – ${z.long}`, text: nowText(v === null || v === undefined ? "" : price(v)) };
      }
      if (btn.dataset.shareFrom) {
        const a = $(btn.dataset.shareFrom);
        return { url: abs(a ? a.getAttribute("href") : location.pathname + location.search), title: document.title, text: "" };
      }
      const card = btn.closest(".card");
      const now = card && $("[data-now-area]", card);
      return {
        url: abs(btn.dataset.shareUrl || location.pathname),
        title: btn.dataset.shareTitle || document.title,
        text: nowText(now ? now.textContent.trim() : ""),
      };
    };
    const message = (s) => (s.text ? `${s.title}: ${s.text}` : s.title);

    let toastEl = null;
    let toastTimer = 0;
    const toast = (msg) => {
      if (!toastEl) {
        toastEl = document.createElement("div");
        toastEl.className = "toast";
        toastEl.setAttribute("role", "status");
        document.body.append(toastEl);
      }
      toastEl.textContent = msg;
      toastEl.hidden = false;
      clearTimeout(toastTimer);
      toastTimer = setTimeout(() => { toastEl.hidden = true; }, 2200);
    };
    const copy = async (url) => {
      try {
        await navigator.clipboard.writeText(url);
      } catch (_e) {
        const ta = document.createElement("textarea");
        ta.value = url;
        document.body.append(ta);
        ta.select();
        try { document.execCommand("copy"); } catch (_e2) { /* nothing more to try */ }
        ta.parentNode.removeChild(ta);
      }
      toast(t("share.copied"));
    };

    let menu = null;
    let current = null;
    const close = (refocus) => {
      if (!menu || menu.hidden) return;
      menu.hidden = true;
      if (current) {
        current.setAttribute("aria-expanded", "false");
        if (refocus) current.focus();
      }
      current = null;
    };
    const open = (btn, s) => {
      if (!menu) {
        menu = document.createElement("div");
        menu.className = "share-menu";
        menu.setAttribute("role", "menu");
        menu.hidden = true;
        document.body.append(menu);
      }
      const e = encodeURIComponent;
      const msg = message(s);
      const links = [
        [t("share.email"), `mailto:?subject=${e(s.title)}&body=${e(`${msg}\n${s.url}`)}`],
        ["WhatsApp", `https://wa.me/?text=${e(`${msg} ${s.url}`)}`],
        ["Facebook", `https://www.facebook.com/sharer/sharer.php?u=${e(s.url)}`],
        ["X", `https://x.com/intent/post?text=${e(msg)}&url=${e(s.url)}`],
        ["LinkedIn", `https://www.linkedin.com/sharing/share-offsite/?url=${e(s.url)}`],
      ];
      menu.innerHTML =
        `<input class="share-url" readonly value="${esc(s.url)}" aria-label="${esc(t("share.copy"))}">` +
        `<button type="button" role="menuitem" data-act="copy">${esc(t("share.copy"))}</button>` +
        (navigator.share ? `<button type="button" role="menuitem" data-act="native">${esc(t("share.more"))}</button>` : "") +
        links.map(([n, h]) => `<a role="menuitem" href="${esc(h)}" target="_blank" rel="noopener noreferrer">${esc(n)}</a>`).join("");
      $("[data-act=copy]", menu).addEventListener("click", () => { copy(s.url); close(true); });
      const nat = $("[data-act=native]", menu);
      if (nat) nat.addEventListener("click", () => { close(true); navigator.share({ title: s.title, text: msg, url: s.url }).catch(() => {}); });
      $$("a", menu).forEach((a) => a.addEventListener("click", () => close(false)));
      $(".share-url", menu).addEventListener("focus", (ev) => ev.target.select());

      menu.hidden = false;
      const r = btn.getBoundingClientRect();
      const w = menu.offsetWidth;
      const left = Math.min(Math.max(8, r.right - w), document.documentElement.clientWidth - w - 8);
      menu.style.left = `${left + window.scrollX}px`;
      menu.style.top = `${r.bottom + window.scrollY + 6}px`;
      current = btn;
      btn.setAttribute("aria-expanded", "true");
      $("[data-act=copy]", menu).focus();
    };

    document.addEventListener("click", (ev) => {
      const btn = ev.target.closest("[data-share]");
      if (btn) {
        ev.preventDefault();
        if (current === btn) { close(false); return; }
        close(false);
        const s = info(btn);
        if (!s) return;
        if (navigator.share && window.matchMedia("(pointer: coarse)").matches) {
          navigator.share({ title: s.title, text: message(s), url: s.url }).catch(() => {});
          return;
        }
        open(btn, s);
        return;
      }
      if (menu && !menu.hidden && !menu.contains(ev.target)) close(false);
    });
    document.addEventListener("keydown", (ev) => { if (ev.key === "Escape" && menu && !menu.hidden) close(true); });
    window.addEventListener("resize", () => close(false));
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
      if (navigator.clipboard) navigator.clipboard.writeText(txt).then(() => { const was = b.textContent; b.textContent = t("custom.copied"); setTimeout(() => { b.textContent = was; }, 1500); });
    }));
  };

  // -------------------------------------------------------------- lifecycle
  const safe = (fn) => { try { const r = fn(); if (r && r.catch) r.catch((e) => console.error(e)); } catch (e) { console.error(e); } };
  const rerender = () => {
    renderStatic();
    renderNow();
    [chartAreaToday, () => chartAllAreas("today"), () => chartAllAreas("tomorrow"), chartProduction, chartNet,
      chartLongTermArea, chartLongTermCountry, chartThirtyDays, priceTable, hass, mapRender].forEach(safe);
    if (customRun && !$("#custom-result").classList.contains("hidden")) safe(customRun);
    renderStatic();
  };

  settingsUi();
  safe(shareUi);
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
    if (map.ready) {
      const q = Math.floor(Date.now() / 900000);
      if (q !== map.slot) { map.slot = q; safe(mapRender); }
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
