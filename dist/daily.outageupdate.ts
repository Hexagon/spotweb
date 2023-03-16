// deno-fmt-ignore-file
// deno-lint-ignore-file
// This code was bundled using `deno bundle` and it's not recommended to edit it manually

const Areas = {
    "10Y1001A1001A016": "CTA|NIE, MBA|SEM(SONI), SCA|NIE",
    "10Y1001A1001A39I": "SCA|EE, MBA|EE, CTA|EE, BZN|EE, Estonia (EE)",
    "10Y1001A1001A44P": "IPA|SE1, BZN|SE1, MBA|SE1, SCA|SE1",
    "10Y1001A1001A45N": "SCA|SE2, MBA|SE2, BZN|SE2, IPA|SE2",
    "10Y1001A1001A46L": "IPA|SE3, BZN|SE3, MBA|SE3, SCA|SE3",
    "10Y1001A1001A47J": "SCA|SE4, MBA|SE4, BZN|SE4, IPA|SE4",
    "10Y1001A1001A48H": "IPA|NO5, IBA|NO5, BZN|NO5, MBA|NO5, SCA|NO5",
    "10Y1001A1001A49F": "SCA|RU, MBA|RU, BZN|RU, CTA|RU",
    "10Y1001A1001A50U": "CTA|RU-KGD, BZN|RU-KGD, MBA|RU-KGD, SCA|RU-KGD",
    "10Y1001A1001A51S": "SCA|BY, MBA|BY, BZN|BY, CTA|BY",
    "10Y1001A1001A59C": "BZN|IE(SEM), MBA|IE(SEM), SCA|IE(SEM), LFB|IE-NIE, SNA|Ireland",
    "10Y1001A1001A63L": "BZN|DE-AT-LU",
    "10Y1001A1001A64J": "BZN|NO1A",
    "10Y1001A1001A65H": "Denmark (DK)",
    "10Y1001A1001A66F": "BZN|IT-GR",
    "10Y1001A1001A67D": "BZN|IT-North-SI",
    "10Y1001A1001A68B": "BZN|IT-North-CH",
    "10Y1001A1001A699": "BZN|IT-Brindisi, SCA|IT-Brindisi, MBA|IT-Z-Brindisi",
    "10Y1001A1001A70O": "MBA|IT-Z-Centre-North, SCA|IT-Centre-North, BZN|IT-Centre-North",
    "10Y1001A1001A71M": "BZN|IT-Centre-South, SCA|IT-Centre-South, MBA|IT-Z-Centre-South",
    "10Y1001A1001A72K": "MBA|IT-Z-Foggia, SCA|IT-Foggia, BZN|IT-Foggia",
    "10Y1001A1001A73I": "BZN|IT-North, SCA|IT-North, MBA|IT-Z-North",
    "10Y1001A1001A74G": "MBA|IT-Z-Sardinia, SCA|IT-Sardinia, BZN|IT-Sardinia",
    "10Y1001A1001A75E": "BZN|IT-Sicily, SCA|IT-Sicily, MBA|IT-Z-Sicily",
    "10Y1001A1001A76C": "MBA|IT-Z-Priolo, SCA|IT-Priolo, BZN|IT-Priolo",
    "10Y1001A1001A77A": "BZN|IT-Rossano, SCA|IT-Rossano, MBA|IT-Z-Rossano",
    "10Y1001A1001A788": "MBA|IT-Z-South, SCA|IT-South, BZN|IT-South",
    "10Y1001A1001A796": "CTA|DK",
    "10Y1001A1001A80L": "BZN|IT-North-AT",
    "10Y1001A1001A81J": "BZN|IT-North-FR",
    "10Y1001A1001A82H": "BZN|DE-LU, IPA|DE-LU, SCA|DE-LU, MBA|DE-LU",
    "10Y1001A1001A83F": "Germany (DE)",
    "10Y1001A1001A84D": "MBA|IT-MACRZONENORTH, SCA|IT-MACRZONENORTH",
    "10Y1001A1001A85B": "SCA|IT-MACRZONESOUTH, MBA|IT-MACRZONESOUTH",
    "10Y1001A1001A869": "SCA|UA-DobTPP, BZN|UA-DobTPP, CTA|UA-DobTPP",
    "10Y1001A1001A877": "BZN|IT-Malta",
    "10Y1001A1001A885": "BZN|IT-SACOAC",
    "10Y1001A1001A893": "BZN|IT-SACODC, SCA|IT-SACODC",
    "10Y1001A1001A91G": "SNA|Nordic, REG|Nordic, LFB|Nordic",
    "10Y1001A1001A92E": "United Kingdom (UK)",
    "10Y1001A1001A93C": "Malta (MT), BZN|MT, CTA|MT, SCA|MT, MBA|MT",
    "10Y1001A1001A990": "MBA|MD, SCA|MD, CTA|MD, BZN|MD, Moldova (MD)",
    "10Y1001A1001B004": "Armenia (AM), BZN|AM, CTA|AM",
    "10Y1001A1001B012": "CTA|GE, BZN|GE, Georgia (GE), SCA|GE, MBA|GE",
    "10Y1001A1001B05V": "Azerbaijan (AZ), BZN|AZ, CTA|AZ",
    "10Y1001C--00003F": "BZN|UA, Ukraine (UA), MBA|UA, SCA|UA",
    "10Y1001C--000182": "SCA|UA-IPS, MBA|UA-IPS, BZN|UA-IPS, CTA|UA-IPS",
    "10Y1001C--00038X": "BZA|CZ-DE-SK-LT-SE4",
    "10Y1001C--00059P": "REG|CORE",
    "10Y1001C--00090V": "REG|AFRR, SCA|AFRR",
    "10Y1001C--00095L": "REG|SWE",
    "10Y1001C--00096J": "SCA|IT-Calabria, MBA|IT-Z-Calabria, BZN|IT-Calabria",
    "10Y1001C--00098F": "BZN|GB(IFA)",
    "10Y1001C--00100H": "BZN|XK, CTA|XK, Kosovo (XK), MBA|XK, LFB|XK, LFA|XK",
    "10Y1001C--00119X": "SCA|IN",
    "10Y1001C--001219": "BZN|NO2A",
    "10Y1001C--00137V": "REG|ITALYNORTH",
    "10Y1001C--00138T": "REG|GRIT",
    "10YAL-KESH-----5": "LFB|AL, LFA|AL, BZN|AL, CTA|AL, Albania (AL), SCA|AL, MBA|AL",
    "10YAT-APG------L": "MBA|AT, SCA|AT, Austria (AT), IPA|AT, CTA|AT, BZN|AT, LFA|AT, LFB|AT",
    "10YBA-JPCC-----D": "LFA|BA, BZN|BA, CTA|BA, Bosnia and Herz. (BA), SCA|BA, MBA|BA",
    "10YBE----------2": "MBA|BE, SCA|BE, Belgium (BE), CTA|BE, BZN|BE, LFA|BE, LFB|BE",
    "10YCA-BULGARIA-R": "LFB|BG, LFA|BG, BZN|BG, CTA|BG, Bulgaria (BG), SCA|BG, MBA|BG",
    "10YCB-GERMANY--8": "SCA|DE_DK1_LU, LFB|DE_DK1_LU",
    "10YCB-JIEL-----9": "LFB|RS_MK_ME",
    "10YCB-POLAND---Z": "LFB|PL",
    "10YCB-SI-HR-BA-3": "LFB|SI_HR_BA",
    "10YCH-SWISSGRIDZ": "LFB|CH, LFA|CH, SCA|CH, MBA|CH, Switzerland (CH), CTA|CH, BZN|CH",
    "10YCS-CG-TSO---S": "BZN|ME, CTA|ME, Montenegro (ME), MBA|ME, SCA|ME, LFA|ME",
    "10YCS-SERBIATSOV": "LFA|RS, SCA|RS, MBA|RS, Serbia (RS), CTA|RS, BZN|RS",
    "10YCY-1001A0003J": "BZN|CY, CTA|CY, Cyprus (CY), MBA|CY, SCA|CY",
    "10YCZ-CEPS-----N": "SCA|CZ, MBA|CZ, Czech Republic (CZ), CTA|CZ, BZN|CZ, LFA|CZ, LFB|CZ",
    "10YDE-ENBW-----N": "LFA|DE(TransnetBW), CTA|DE(TransnetBW), SCA|DE(TransnetBW)",
    "10YDE-EON------1": "SCA|DE(TenneT GER), CTA|DE(TenneT GER), LFA|DE(TenneT GER)",
    "10YDE-RWENET---I": "LFA|DE(Amprion), CTA|DE(Amprion), SCA|DE(Amprion)",
    "10YDE-VE-------2": "SCA|DE(50Hertz), CTA|DE(50Hertz), LFA|DE(50Hertz), BZA|DE(50HzT)",
    "10YDK-1-------AA": "BZN|DK1A",
    "10YDK-1--------W": "IPA|DK1, IBA|DK1, BZN|DK1, SCA|DK1, MBA|DK1, LFA|DK1",
    "10YDK-2--------M": "LFA|DK2, MBA|DK2, SCA|DK2, IBA|DK2, IPA|DK2, BZN|DK2",
    "10YDOM-1001A082L": "CTA|PL-CZ, BZA|PL-CZ",
    "10YDOM-CZ-DE-SKK": "BZA|CZ-DE-SK, BZN|CZ+DE+SK",
    "10YDOM-PL-SE-LT2": "BZA|LT-SE4",
    "10YDOM-REGION-1V": "REG|CWE",
    "10YES-REE------0": "LFB|ES, LFA|ES, BZN|ES, Spain (ES), CTA|ES, SCA|ES, MBA|ES",
    "10YEU-CONT-SYNC0": "SNA|Continental Europe",
    "10YFI-1--------U": "MBA|FI, SCA|FI, CTA|FI, Finland (FI), BZN|FI, IPA|FI, IBA|FI",
    "10YFR-RTE------C": "BZN|FR, France (FR), CTA|FR, SCA|FR, MBA|FR, LFB|FR, LFA|FR",
    "10YGB----------A": "LFA|GB, LFB|GB, SNA|GB, MBA|GB, SCA|GB, CTA|National Grid, BZN|GB",
    "10YGR-HTSO-----Y": "BZN|GR, Greece (GR), CTA|GR, SCA|GR, MBA|GR, LFB|GR, LFA|GR",
    "10YHR-HEP------M": "LFA|HR, MBA|HR, SCA|HR, CTA|HR, Croatia (HR), BZN|HR",
    "10YHU-MAVIR----U": "BZN|HU, Hungary (HU), CTA|HU, SCA|HU, MBA|HU, LFA|HU, LFB|HU",
    "10YIE-1001A00010": "MBA|SEM(EirGrid), SCA|IE, CTA|IE, Ireland (IE)",
    "10YIT-GRTN-----B": "Italy (IT), CTA|IT, SCA|IT, MBA|IT, LFB|IT, LFA|IT",
    "10YLT-1001A0008Q": "MBA|LT, SCA|LT, CTA|LT, Lithuania (LT), BZN|LT",
    "10YLU-CEGEDEL-NQ": "Luxembourg (LU), CTA|LU",
    "10YLV-1001A00074": "CTA|LV, Latvia (LV), BZN|LV, SCA|LV, MBA|LV",
    "10YMK-MEPSO----8": "MBA|MK, SCA|MK, BZN|MK, North Macedonia (MK), CTA|MK, LFA|MK",
    "10YNL----------L": "LFA|NL, LFB|NL, CTA|NL, Netherlands (NL), BZN|NL, SCA|NL, MBA|NL",
    "10YNO-0--------C": "MBA|NO, SCA|NO, Norway (NO), CTA|NO",
    "10YNO-1--------2": "BZN|NO1, IBA|NO1, IPA|NO1, SCA|NO1, MBA|NO1",
    "10YNO-2--------T": "MBA|NO2, SCA|NO2, IPA|NO2, IBA|NO2, BZN|NO2",
    "10YNO-3--------J": "BZN|NO3, IBA|NO3, IPA|NO3, SCA|NO3, MBA|NO3",
    "10YNO-4--------9": "MBA|NO4, SCA|NO4, IPA|NO4, IBA|NO4, BZN|NO4",
    "10YPL-AREA-----S": "BZN|PL, Poland (PL), CTA|PL, SCA|PL, MBA|PL, BZA|PL, LFA|PL",
    "10YPT-REN------W": "LFA|PT, LFB|PT, MBA|PT, SCA|PT, CTA|PT, Portugal (PT), BZN|PT",
    "10YRO-TEL------P": "BZN|RO, Romania (RO), CTA|RO, SCA|RO, MBA|RO, LFB|RO, LFA|RO",
    "10YSE-1--------K": "MBA|SE, SCA|SE, CTA|SE, Sweden (SE)",
    "10YSI-ELES-----O": "Slovenia (SI), BZN|SI, CTA|SI, SCA|SI, MBA|SI, LFA|SI",
    "10YSK-SEPS-----K": "LFA|SK, LFB|SK, MBA|SK, SCA|SK, CTA|SK, BZN|SK, Slovakia (SK)",
    "10YTR-TEIAS----W": "Turkey (TR), BZN|TR, CTA|TR, SCA|TR, MBA|TR, LFB|TR, LFA|TR",
    "10YUA-WEPS-----0": "LFA|UA-BEI, LFB|UA-BEI, MBA|UA-BEI, SCA|UA-BEI, CTA|UA-BEI, BZN|UA-BEI",
    "11Y0-0000-0265-K": "BZN|GB(ElecLink)",
    "17Y0000009369493": "BZN|GB(IFA2)",
    "46Y000000000007M": "BZN|DK1-NO1",
    "50Y0JVU59B4JWQCU": "BZN|NO2NSL",
    "BY": "Belarus (BY)",
    "RU": "Russia (RU)",
    "IS": "Iceland (IS)"
};
const AllAreas = (identifier)=>{
    return Object.entries(Areas).filter(([_key, value])=>value.includes(identifier)).map((e)=>e[0]);
};
const Area = (identifier)=>{
    return AllAreas(identifier)?.[0];
};
const DocumentTypes = {
    A09: "Finalised schedule",
    A11: "Aggregated energy data report",
    A15: "Acquiring system operator reserve schedule",
    A24: "Bid document",
    A25: "Allocation result document",
    A26: "Capacity document",
    A31: "Agreed capacity",
    A37: "Reserve bid document",
    A38: "Reserve allocation result document",
    A44: "Price Document",
    A61: "Estimated Net Transfer Capacity",
    A63: "Redispatch notice",
    A65: "System total load",
    A68: "Installed generation per type",
    A69: "Wind and solar forecast",
    A70: "Load forecast margin",
    A71: "Generation forecast",
    A72: "Reservoir filling information",
    A73: "Actual generation",
    A74: "Wind and solar generation",
    A75: "Actual generation per type",
    A76: "Load unavailability",
    A77: "Production unavailability",
    A78: "Transmission unavailability",
    A79: "Offshore grid infrastructure unavailability",
    A80: "Generation unavailability",
    A81: "Contracted reserves",
    A82: "Accepted offers",
    A83: "Activated balancing quantities",
    A84: "Activated balancing prices",
    A85: "Imbalance prices",
    A86: "Imbalance volume",
    A87: "Financial situation",
    A88: "Cross border balancing",
    A89: "Contracted reserve prices",
    A90: "Interconnection network expansion",
    A91: "Counter trade notice",
    A92: "Congestion costs",
    A93: "DC link capacity",
    A94: "Non EU allocations",
    A95: "Configuration document",
    B11: "Flow-based allocations",
    B17: "Aggregated netted external TSO schedule document",
    B45: "Bid Availability Document"
};
const DocumentType = (name)=>{
    const foundDocumentTypes = Object.entries(DocumentTypes).find(([_key, value])=>value.toLowerCase().trim() == name.toLowerCase().trim());
    return foundDocumentTypes ? foundDocumentTypes[0] : undefined;
};
var x = Object.create;
var u = Object.defineProperty;
var N = Object.getOwnPropertyDescriptor;
var b = Object.getOwnPropertyNames;
var h = Object.getPrototypeOf, p = Object.prototype.hasOwnProperty;
var w = (e, r)=>()=>(r || e((r = {
            exports: {}
        }).exports, r), r.exports);
var m = (e, r, i, f)=>{
    if (r && typeof r == "object" || typeof r == "function") for (let n of b(r))!p.call(e, n) && n !== i && u(e, n, {
        get: ()=>r[n],
        enumerable: !(f = N(r, n)) || f.enumerable
    });
    return e;
};
var Z = (e, r, i)=>(i = e != null ? x(h(e)) : {}, m(r || !e || !e.__esModule ? u(i, "default", {
        value: e,
        enumerable: !0
    }) : i, e));
var d = w((L, o)=>{
    var _ = /^[-+]?0x[a-fA-F0-9]+$/, F = /^([\-\+])?(0*)(\.[0-9]+([eE]\-?[0-9]+)?|[0-9]+(\.[0-9]+([eE]\-?[0-9]+)?)?)$/;
    !Number.parseInt && window.parseInt && (Number.parseInt = window.parseInt);
    !Number.parseFloat && window.parseFloat && (Number.parseFloat = window.parseFloat);
    var I = {
        hex: !0,
        leadingZeros: !0,
        decimalPoint: ".",
        eNotation: !0
    };
    function k(e, r = {}) {
        if (r = Object.assign({}, I, r), !e || typeof e != "string") return e;
        let i = e.trim();
        if (r.skipLike !== void 0 && r.skipLike.test(i)) return e;
        if (r.hex && _.test(i)) return Number.parseInt(i, 16);
        {
            let f = F.exec(i);
            if (f) {
                let n = f[1], a = f[2], s = E(f[3]), g = f[4] || f[6];
                if (!r.leadingZeros && a.length > 0 && n && i[2] !== ".") return e;
                if (!r.leadingZeros && a.length > 0 && !n && i[1] !== ".") return e;
                {
                    let t = Number(i), l = "" + t;
                    return l.search(/[eE]/) !== -1 || g ? r.eNotation ? t : e : i.indexOf(".") !== -1 ? l === "0" && s === "" || l === s || n && l === "-" + s ? t : e : a ? s === l || n + s === l ? t : e : i === l || i === n + l ? t : e;
                }
            } else return e;
        }
    }
    function E(e) {
        return e && e.indexOf(".") !== -1 && (e = e.replace(/0+$/, ""), e === "." ? e = "0" : e[0] === "." ? e = "0" + e : e[e.length - 1] === "." && (e = e.substr(0, e.length - 1))), e;
    }
    o.exports = k;
});
var O = Z(d()), { default: c , ...$ } = O, R = c !== void 0 ? c : $;
var he = Object.create;
var L = Object.defineProperty;
var ge = Object.getOwnPropertyDescriptor;
var pe = Object.getOwnPropertyNames;
var Ne = Object.getPrototypeOf, be = Object.prototype.hasOwnProperty;
((e)=>typeof require < "u" ? require : typeof Proxy < "u" ? new Proxy(e, {
        get: (t, s)=>(typeof require < "u" ? require : t)[s]
    }) : e)(function(e) {
    if (typeof require < "u") return require.apply(this, arguments);
    throw new Error('Dynamic require of "' + e + '" is not supported');
});
var b1 = (e, t)=>()=>(t || e((t = {
            exports: {}
        }).exports, t), t.exports);
var Te = (e, t, s, i)=>{
    if (t && typeof t == "object" || typeof t == "function") for (let r of pe(t))!be.call(e, r) && r !== s && L(e, r, {
        get: ()=>t[r],
        enumerable: !(i = ge(t, r)) || i.enumerable
    });
    return e;
};
var Ae = (e, t, s)=>(s = e != null ? he(Ne(e)) : {}, Te(t || !e || !e.__esModule ? L(s, "default", {
        value: e,
        enumerable: !0
    }) : s, e));
var w1 = b1((E)=>{
    "use strict";
    var M = ":A-Za-z_\\u00C0-\\u00D6\\u00D8-\\u00F6\\u00F8-\\u02FF\\u0370-\\u037D\\u037F-\\u1FFF\\u200C-\\u200D\\u2070-\\u218F\\u2C00-\\u2FEF\\u3001-\\uD7FF\\uF900-\\uFDCF\\uFDF0-\\uFFFD", ye = M + "\\-.\\d\\u00B7\\u0300-\\u036F\\u203F-\\u2040", R = "[" + M + "][" + ye + "]*", Pe = new RegExp("^" + R + "$"), me = function(e, t) {
        let s = [], i = t.exec(e);
        for(; i;){
            let r = [];
            r.startIndex = t.lastIndex - i[0].length;
            let n = i.length;
            for(let f = 0; f < n; f++)r.push(i[f]);
            s.push(r), i = t.exec(e);
        }
        return s;
    }, Ie = function(e) {
        let t = Pe.exec(e);
        return !(t === null || typeof t > "u");
    };
    E.isExist = function(e) {
        return typeof e < "u";
    };
    E.isEmptyObject = function(e) {
        return Object.keys(e).length === 0;
    };
    E.merge = function(e, t, s) {
        if (t) {
            let i = Object.keys(t), r = i.length;
            for(let n = 0; n < r; n++)s === "strict" ? e[i[n]] = [
                t[i[n]]
            ] : e[i[n]] = t[i[n]];
        }
    };
    E.getValue = function(e) {
        return E.isExist(e) ? e : "";
    };
    E.isName = Ie;
    E.getAllMatches = me;
    E.nameRegexp = R;
});
var O1 = b1((G)=>{
    "use strict";
    var C = w1(), we = {
        allowBooleanAttributes: !1,
        unpairedTags: []
    };
    G.validate = function(e, t) {
        t = Object.assign({}, we, t);
        let s = [], i = !1, r = !1;
        e[0] === "\uFEFF" && (e = e.substr(1));
        for(let n = 0; n < e.length; n++)if (e[n] === "<" && e[n + 1] === "?") {
            if (n += 2, n = X(e, n), n.err) return n;
        } else if (e[n] === "<") {
            let f = n;
            if (n++, e[n] === "!") {
                n = k(e, n);
                continue;
            } else {
                let o = !1;
                e[n] === "/" && (o = !0, n++);
                let u = "";
                for(; n < e.length && e[n] !== ">" && e[n] !== " " && e[n] !== "	" && e[n] !== `
` && e[n] !== "\r"; n++)u += e[n];
                if (u = u.trim(), u[u.length - 1] === "/" && (u = u.substring(0, u.length - 1), n--), !$e(u)) {
                    let a;
                    return u.trim().length === 0 ? a = "Invalid space after '<'." : a = "Tag '" + u + "' is an invalid name.", h("InvalidTag", a, p(e, n));
                }
                let l = Se(e, n);
                if (l === !1) return h("InvalidAttr", "Attributes for '" + u + "' have open quote.", p(e, n));
                let d = l.value;
                if (n = l.index, d[d.length - 1] === "/") {
                    let a = n - d.length;
                    d = d.substring(0, d.length - 1);
                    let g = _(d, t);
                    if (g === !0) i = !0;
                    else return h(g.err.code, g.err.msg, p(e, a + g.err.line));
                } else if (o) if (l.tagClosed) {
                    if (d.trim().length > 0) return h("InvalidTag", "Closing tag '" + u + "' can't have attributes or invalid starting.", p(e, f));
                    {
                        let a = s.pop();
                        if (u !== a.tagName) {
                            let g = p(e, a.tagStartPos);
                            return h("InvalidTag", "Expected closing tag '" + a.tagName + "' (opened in line " + g.line + ", col " + g.col + ") instead of closing tag '" + u + "'.", p(e, f));
                        }
                        s.length == 0 && (r = !0);
                    }
                } else return h("InvalidTag", "Closing tag '" + u + "' doesn't have proper closing.", p(e, n));
                else {
                    let a = _(d, t);
                    if (a !== !0) return h(a.err.code, a.err.msg, p(e, n - d.length + a.err.line));
                    if (r === !0) return h("InvalidXml", "Multiple possible root nodes found.", p(e, n));
                    t.unpairedTags.indexOf(u) !== -1 || s.push({
                        tagName: u,
                        tagStartPos: f
                    }), i = !0;
                }
                for(n++; n < e.length; n++)if (e[n] === "<") if (e[n + 1] === "!") {
                    n++, n = k(e, n);
                    continue;
                } else if (e[n + 1] === "?") {
                    if (n = X(e, ++n), n.err) return n;
                } else break;
                else if (e[n] === "&") {
                    let a = ve(e, n);
                    if (a == -1) return h("InvalidChar", "char '&' is not expected.", p(e, n));
                    n = a;
                } else if (r === !0 && !q(e[n])) return h("InvalidXml", "Extra text at the end", p(e, n));
                e[n] === "<" && n--;
            }
        } else {
            if (q(e[n])) continue;
            return h("InvalidChar", "char '" + e[n] + "' is not expected.", p(e, n));
        }
        if (i) {
            if (s.length == 1) return h("InvalidTag", "Unclosed tag '" + s[0].tagName + "'.", p(e, s[0].tagStartPos));
            if (s.length > 0) return h("InvalidXml", "Invalid '" + JSON.stringify(s.map((n)=>n.tagName), null, 4).replace(/\r?\n/g, "") + "' found.", {
                line: 1,
                col: 1
            });
        } else return h("InvalidXml", "Start tag expected.", 1);
        return !0;
    };
    function q(e) {
        return e === " " || e === "	" || e === `
` || e === "\r";
    }
    function X(e, t) {
        let s = t;
        for(; t < e.length; t++)if (e[t] == "?" || e[t] == " ") {
            let i = e.substr(s, t - s);
            if (t > 5 && i === "xml") return h("InvalidXml", "XML declaration allowed only at the start of the document.", p(e, t));
            if (e[t] == "?" && e[t + 1] == ">") {
                t++;
                break;
            } else continue;
        }
        return t;
    }
    function k(e, t) {
        if (e.length > t + 5 && e[t + 1] === "-" && e[t + 2] === "-") {
            for(t += 3; t < e.length; t++)if (e[t] === "-" && e[t + 1] === "-" && e[t + 2] === ">") {
                t += 2;
                break;
            }
        } else if (e.length > t + 8 && e[t + 1] === "D" && e[t + 2] === "O" && e[t + 3] === "C" && e[t + 4] === "T" && e[t + 5] === "Y" && e[t + 6] === "P" && e[t + 7] === "E") {
            let s = 1;
            for(t += 8; t < e.length; t++)if (e[t] === "<") s++;
            else if (e[t] === ">" && (s--, s === 0)) break;
        } else if (e.length > t + 9 && e[t + 1] === "[" && e[t + 2] === "C" && e[t + 3] === "D" && e[t + 4] === "A" && e[t + 5] === "T" && e[t + 6] === "A" && e[t + 7] === "[") {
            for(t += 8; t < e.length; t++)if (e[t] === "]" && e[t + 1] === "]" && e[t + 2] === ">") {
                t += 2;
                break;
            }
        }
        return t;
    }
    var Ce = '"', Oe = "'";
    function Se(e, t) {
        let s = "", i = "", r = !1;
        for(; t < e.length; t++){
            if (e[t] === Ce || e[t] === Oe) i === "" ? i = e[t] : i !== e[t] || (i = "");
            else if (e[t] === ">" && i === "") {
                r = !0;
                break;
            }
            s += e[t];
        }
        return i !== "" ? !1 : {
            value: s,
            index: t,
            tagClosed: r
        };
    }
    var xe = new RegExp(`(\\s*)([^\\s=]+)(\\s*=)?(\\s*(['"])(([\\s\\S])*?)\\5)?`, "g");
    function _(e, t) {
        let s = C.getAllMatches(e, xe), i = {};
        for(let r = 0; r < s.length; r++){
            if (s[r][1].length === 0) return h("InvalidAttr", "Attribute '" + s[r][2] + "' has no space in starting.", P(s[r]));
            if (s[r][3] !== void 0 && s[r][4] === void 0) return h("InvalidAttr", "Attribute '" + s[r][2] + "' is without value.", P(s[r]));
            if (s[r][3] === void 0 && !t.allowBooleanAttributes) return h("InvalidAttr", "boolean attribute '" + s[r][2] + "' is not allowed.", P(s[r]));
            let n = s[r][2];
            if (!Fe(n)) return h("InvalidAttr", "Attribute '" + n + "' is an invalid name.", P(s[r]));
            if (!i.hasOwnProperty(n)) i[n] = 1;
            else return h("InvalidAttr", "Attribute '" + n + "' is repeated.", P(s[r]));
        }
        return !0;
    }
    function Ve(e, t) {
        let s = /\d/;
        for(e[t] === "x" && (t++, s = /[\da-fA-F]/); t < e.length; t++){
            if (e[t] === ";") return t;
            if (!e[t].match(s)) break;
        }
        return -1;
    }
    function ve(e, t) {
        if (t++, e[t] === ";") return -1;
        if (e[t] === "#") return t++, Ve(e, t);
        let s = 0;
        for(; t < e.length; t++, s++)if (!(e[t].match(/\w/) && s < 20)) {
            if (e[t] === ";") break;
            return -1;
        }
        return t;
    }
    function h(e, t, s) {
        return {
            err: {
                code: e,
                msg: t,
                line: s.line || s,
                col: s.col
            }
        };
    }
    function Fe(e) {
        return C.isName(e);
    }
    function $e(e) {
        return C.isName(e);
    }
    function p(e, t) {
        let s = e.substring(0, t).split(/\r?\n/);
        return {
            line: s.length,
            col: s[s.length - 1].length + 1
        };
    }
    function P(e) {
        return e.startIndex + e[1].length;
    }
});
var Y = b1((S)=>{
    var U = {
        preserveOrder: !1,
        attributeNamePrefix: "@_",
        attributesGroupName: !1,
        textNodeName: "#text",
        ignoreAttributes: !0,
        removeNSPrefix: !1,
        allowBooleanAttributes: !1,
        parseTagValue: !0,
        parseAttributeValue: !1,
        trimValues: !0,
        cdataPropName: !1,
        numberParseOptions: {
            hex: !0,
            leadingZeros: !0,
            eNotation: !0
        },
        tagValueProcessor: function(e, t) {
            return t;
        },
        attributeValueProcessor: function(e, t) {
            return t;
        },
        stopNodes: [],
        alwaysCreateTextNode: !1,
        isArray: ()=>!1,
        commentPropName: !1,
        unpairedTags: [],
        processEntities: !0,
        htmlEntities: !1,
        ignoreDeclaration: !1,
        ignorePiTags: !1,
        transformTagName: !1,
        transformAttributeName: !1
    }, Be = function(e) {
        return Object.assign({}, U, e);
    };
    S.buildOptions = Be;
    S.defaultOptions = U;
});
var W = b1((Pt, J)=>{
    "use strict";
    var x = class {
        constructor(t){
            this.tagname = t, this.child = [], this[":@"] = {};
        }
        add(t, s) {
            this.child.push({
                [t]: s
            });
        }
        addChild(t) {
            t[":@"] && Object.keys(t[":@"]).length > 0 ? this.child.push({
                [t.tagname]: t.child,
                [":@"]: t[":@"]
            }) : this.child.push({
                [t.tagname]: t.child
            });
        }
    };
    J.exports = x;
});
var K = b1((mt, z)=>{
    function Le(e, t) {
        let s = {};
        if (e[t + 3] === "O" && e[t + 4] === "C" && e[t + 5] === "T" && e[t + 6] === "Y" && e[t + 7] === "P" && e[t + 8] === "E") {
            t = t + 9;
            let i = 1, r = !1, n = !1, f = !1, o = "";
            for(; t < e.length; t++)if (e[t] === "<" && !f) {
                if (r && e[t + 1] === "!" && e[t + 2] === "E" && e[t + 3] === "N" && e[t + 4] === "T" && e[t + 5] === "I" && e[t + 6] === "T" && e[t + 7] === "Y") t += 7, n = !0;
                else if (r && e[t + 1] === "!" && e[t + 2] === "E" && e[t + 3] === "L" && e[t + 4] === "E" && e[t + 5] === "M" && e[t + 6] === "E" && e[t + 7] === "N" && e[t + 8] === "T") t += 8;
                else if (r && e[t + 1] === "!" && e[t + 2] === "A" && e[t + 3] === "T" && e[t + 4] === "T" && e[t + 5] === "L" && e[t + 6] === "I" && e[t + 7] === "S" && e[t + 8] === "T") t += 8;
                else if (r && e[t + 1] === "!" && e[t + 2] === "N" && e[t + 3] === "O" && e[t + 4] === "T" && e[t + 5] === "A" && e[t + 6] === "T" && e[t + 7] === "I" && e[t + 8] === "O" && e[t + 9] === "N") t += 9;
                else if (e[t + 1] === "!" && e[t + 2] === "-" && e[t + 3] === "-") f = !0;
                else throw new Error("Invalid DOCTYPE");
                i++, o = "";
            } else if (e[t] === ">") {
                if (f ? e[t - 1] === "-" && e[t - 2] === "-" && (f = !1, i--) : (n && (Re(o, s), n = !1), i--), i === 0) break;
            } else e[t] === "[" ? r = !0 : o += e[t];
            if (i !== 0) throw new Error("Unclosed DOCTYPE");
        } else throw new Error("Invalid Tag instead of DOCTYPE");
        return {
            entities: s,
            i: t
        };
    }
    var Me = RegExp(`^\\s([a-zA-z0-0]+)[ 	](['"])([^&]+)\\2`);
    function Re(e, t) {
        let s = Me.exec(e);
        s && (t[s[1]] = {
            regx: RegExp(`&${s[1]};`, "g"),
            val: s[3]
        });
    }
    z.exports = Le;
});
var Z1 = b1((wt, Q)=>{
    "use strict";
    var $ = w1(), m = W(), qe = K(), Xe = R, It = "<((!\\[CDATA\\[([\\s\\S]*?)(]]>))|((NAME:)?(NAME))([^>]*)>|((\\/)(NAME)\\s*>))([^<]*)".replace(/NAME/g, $.nameRegexp), V = class {
        constructor(t){
            this.options = t, this.currentNode = null, this.tagsNodeStack = [], this.docTypeEntities = {}, this.lastEntities = {
                apos: {
                    regex: /&(apos|#39|#x27);/g,
                    val: "'"
                },
                gt: {
                    regex: /&(gt|#62|#x3E);/g,
                    val: ">"
                },
                lt: {
                    regex: /&(lt|#60|#x3C);/g,
                    val: "<"
                },
                quot: {
                    regex: /&(quot|#34|#x22);/g,
                    val: '"'
                }
            }, this.ampEntity = {
                regex: /&(amp|#38|#x26);/g,
                val: "&"
            }, this.htmlEntities = {
                space: {
                    regex: /&(nbsp|#160);/g,
                    val: " "
                },
                cent: {
                    regex: /&(cent|#162);/g,
                    val: "\xA2"
                },
                pound: {
                    regex: /&(pound|#163);/g,
                    val: "\xA3"
                },
                yen: {
                    regex: /&(yen|#165);/g,
                    val: "\xA5"
                },
                euro: {
                    regex: /&(euro|#8364);/g,
                    val: "\u20AC"
                },
                copyright: {
                    regex: /&(copy|#169);/g,
                    val: "\xA9"
                },
                reg: {
                    regex: /&(reg|#174);/g,
                    val: "\xAE"
                },
                inr: {
                    regex: /&(inr|#8377);/g,
                    val: "\u20B9"
                }
            }, this.addExternalEntities = ke, this.parseXml = Je, this.parseTextData = _e, this.resolveNameSpace = Ge, this.buildAttributesMap = Ye, this.isItStopNode = Ke, this.replaceEntitiesValue = We, this.readStopNodeData = Ze, this.saveTextToParentTag = ze;
        }
    };
    function ke(e) {
        let t = Object.keys(e);
        for(let s = 0; s < t.length; s++){
            let i = t[s];
            this.lastEntities[i] = {
                regex: new RegExp("&" + i + ";", "g"),
                val: e[i]
            };
        }
    }
    function _e(e, t, s, i, r, n, f) {
        if (e !== void 0 && (this.options.trimValues && !i && (e = e.trim()), e.length > 0)) {
            f || (e = this.replaceEntitiesValue(e));
            let o = this.options.tagValueProcessor(t, e, s, r, n);
            return o == null ? e : typeof o != typeof e || o !== e ? o : this.options.trimValues ? F(e, this.options.parseTagValue, this.options.numberParseOptions) : e.trim() === e ? F(e, this.options.parseTagValue, this.options.numberParseOptions) : e;
        }
    }
    function Ge(e) {
        if (this.options.removeNSPrefix) {
            let t = e.split(":"), s = e.charAt(0) === "/" ? "/" : "";
            if (t[0] === "xmlns") return "";
            t.length === 2 && (e = s + t[1]);
        }
        return e;
    }
    var Ue = new RegExp(`([^\\s=]+)\\s*(=\\s*(['"])([\\s\\S]*?)\\3)?`, "gm");
    function Ye(e, t) {
        if (!this.options.ignoreAttributes && typeof e == "string") {
            let s = $.getAllMatches(e, Ue), i = s.length, r = {};
            for(let n = 0; n < i; n++){
                let f = this.resolveNameSpace(s[n][1]), o = s[n][4], u = this.options.attributeNamePrefix + f;
                if (f.length) if (this.options.transformAttributeName && (u = this.options.transformAttributeName(u)), o !== void 0) {
                    this.options.trimValues && (o = o.trim()), o = this.replaceEntitiesValue(o);
                    let l = this.options.attributeValueProcessor(f, o, t);
                    l == null ? r[u] = o : typeof l != typeof o || l !== o ? r[u] = l : r[u] = F(o, this.options.parseAttributeValue, this.options.numberParseOptions);
                } else this.options.allowBooleanAttributes && (r[u] = !0);
            }
            if (!Object.keys(r).length) return;
            if (this.options.attributesGroupName) {
                let n = {};
                return n[this.options.attributesGroupName] = r, n;
            }
            return r;
        }
    }
    var Je = function(e) {
        e = e.replace(/\r\n?/g, `
`);
        let t = new m("!xml"), s = t, i = "", r = "";
        for(let n = 0; n < e.length; n++)if (e[n] === "<") if (e[n + 1] === "/") {
            let o = A(e, ">", n, "Closing Tag is not closed."), u = e.substring(n + 2, o).trim();
            if (this.options.removeNSPrefix) {
                let l = u.indexOf(":");
                l !== -1 && (u = u.substr(l + 1));
            }
            this.options.transformTagName && (u = this.options.transformTagName(u)), s && (i = this.saveTextToParentTag(i, s, r)), r = r.substr(0, r.lastIndexOf(".")), s = this.tagsNodeStack.pop(), i = "", n = o;
        } else if (e[n + 1] === "?") {
            let o = v(e, n, !1, "?>");
            if (!o) throw new Error("Pi Tag is not closed.");
            if (i = this.saveTextToParentTag(i, s, r), !(this.options.ignoreDeclaration && o.tagName === "?xml" || this.options.ignorePiTags)) {
                let u = new m(o.tagName);
                u.add(this.options.textNodeName, ""), o.tagName !== o.tagExp && o.attrExpPresent && (u[":@"] = this.buildAttributesMap(o.tagExp, r)), s.addChild(u);
            }
            n = o.closeIndex + 1;
        } else if (e.substr(n + 1, 3) === "!--") {
            let o = A(e, "-->", n + 4, "Comment is not closed.");
            if (this.options.commentPropName) {
                let u = e.substring(n + 4, o - 2);
                i = this.saveTextToParentTag(i, s, r), s.add(this.options.commentPropName, [
                    {
                        [this.options.textNodeName]: u
                    }
                ]);
            }
            n = o;
        } else if (e.substr(n + 1, 2) === "!D") {
            let o = qe(e, n);
            this.docTypeEntities = o.entities, n = o.i;
        } else if (e.substr(n + 1, 2) === "![") {
            let o = A(e, "]]>", n, "CDATA is not closed.") - 2, u = e.substring(n + 9, o);
            if (i = this.saveTextToParentTag(i, s, r), this.options.cdataPropName) s.add(this.options.cdataPropName, [
                {
                    [this.options.textNodeName]: u
                }
            ]);
            else {
                let l = this.parseTextData(u, s.tagname, r, !0, !1, !0);
                l == null && (l = ""), s.add(this.options.textNodeName, l);
            }
            n = o + 2;
        } else {
            let o = v(e, n, this.options.removeNSPrefix), u = o.tagName, l = o.tagExp, d = o.attrExpPresent, a = o.closeIndex;
            this.options.transformTagName && (u = this.options.transformTagName(u)), s && i && s.tagname !== "!xml" && (i = this.saveTextToParentTag(i, s, r, !1)), u !== t.tagname && (r += r ? "." + u : u);
            let g = s;
            if (g && this.options.unpairedTags.indexOf(g.tagname) !== -1 && (s = this.tagsNodeStack.pop()), this.isItStopNode(this.options.stopNodes, r, u)) {
                let c = "";
                if (l.length > 0 && l.lastIndexOf("/") === l.length - 1) n = o.closeIndex;
                else if (this.options.unpairedTags.indexOf(u) !== -1) n = o.closeIndex;
                else {
                    let y = this.readStopNodeData(e, u, a + 1);
                    if (!y) throw new Error(`Unexpected end of ${u}`);
                    n = y.i, c = y.tagContent;
                }
                let N = new m(u);
                u !== l && d && (N[":@"] = this.buildAttributesMap(l, r)), c && (c = this.parseTextData(c, u, r, !0, d, !0, !0)), r = r.substr(0, r.lastIndexOf(".")), N.add(this.options.textNodeName, c), s.addChild(N);
            } else {
                if (l.length > 0 && l.lastIndexOf("/") === l.length - 1) {
                    u[u.length - 1] === "/" ? (u = u.substr(0, u.length - 1), l = u) : l = l.substr(0, l.length - 1), this.options.transformTagName && (u = this.options.transformTagName(u));
                    let c = new m(u);
                    u !== l && d && (c[":@"] = this.buildAttributesMap(l, r)), r = r.substr(0, r.lastIndexOf(".")), s.addChild(c);
                } else {
                    let c = new m(u);
                    this.tagsNodeStack.push(s), u !== l && d && (c[":@"] = this.buildAttributesMap(l, r)), s.addChild(c), s = c;
                }
                i = "", n = a;
            }
        }
        else i += e[n];
        return t.child;
    }, We = function(e) {
        if (this.options.processEntities) {
            for(let t in this.docTypeEntities){
                let s = this.docTypeEntities[t];
                e = e.replace(s.regx, s.val);
            }
            for(let t in this.lastEntities){
                let s = this.lastEntities[t];
                e = e.replace(s.regex, s.val);
            }
            if (this.options.htmlEntities) for(let t in this.htmlEntities){
                let s = this.htmlEntities[t];
                e = e.replace(s.regex, s.val);
            }
            e = e.replace(this.ampEntity.regex, this.ampEntity.val);
        }
        return e;
    };
    function ze(e, t, s, i) {
        return e && (i === void 0 && (i = Object.keys(t.child).length === 0), e = this.parseTextData(e, t.tagname, s, !1, t[":@"] ? Object.keys(t[":@"]).length !== 0 : !1, i), e !== void 0 && e !== "" && t.add(this.options.textNodeName, e), e = ""), e;
    }
    function Ke(e, t, s) {
        let i = "*." + s;
        for(let r in e){
            let n = e[r];
            if (i === n || t === n) return !0;
        }
        return !1;
    }
    function Qe(e, t, s = ">") {
        let i, r = "";
        for(let n = t; n < e.length; n++){
            let f = e[n];
            if (i) f === i && (i = "");
            else if (f === '"' || f === "'") i = f;
            else if (f === s[0]) if (s[1]) {
                if (e[n + 1] === s[1]) return {
                    data: r,
                    index: n
                };
            } else return {
                data: r,
                index: n
            };
            else f === "	" && (f = " ");
            r += f;
        }
    }
    function A(e, t, s, i) {
        let r = e.indexOf(t, s);
        if (r === -1) throw new Error(i);
        return r + t.length - 1;
    }
    function v(e, t, s, i = ">") {
        let r = Qe(e, t + 1, i);
        if (!r) return;
        let n = r.data, f = r.index, o = n.search(/\s/), u = n, l = !0;
        if (o !== -1 && (u = n.substr(0, o).replace(/\s\s*$/, ""), n = n.substr(o + 1)), s) {
            let d = u.indexOf(":");
            d !== -1 && (u = u.substr(d + 1), l = u !== r.data.substr(d + 1));
        }
        return {
            tagName: u,
            tagExp: n,
            closeIndex: f,
            attrExpPresent: l
        };
    }
    function Ze(e, t, s) {
        let i = s, r = 1;
        for(; s < e.length; s++)if (e[s] === "<") if (e[s + 1] === "/") {
            let n = A(e, ">", s, `${t} is not closed`);
            if (e.substring(s + 2, n).trim() === t && (r--, r === 0)) return {
                tagContent: e.substring(i, s),
                i: n
            };
            s = n;
        } else if (e[s + 1] === "?") s = A(e, "?>", s + 1, "StopNode is not closed.");
        else if (e.substr(s + 1, 3) === "!--") s = A(e, "-->", s + 3, "StopNode is not closed.");
        else if (e.substr(s + 1, 2) === "![") s = A(e, "]]>", s, "StopNode is not closed.") - 2;
        else {
            let n = v(e, s, ">");
            n && ((n && n.tagName) === t && n.tagExp[n.tagExp.length - 1] !== "/" && r++, s = n.closeIndex);
        }
    }
    function F(e, t, s) {
        if (t && typeof e == "string") {
            let i = e.trim();
            return i === "true" ? !0 : i === "false" ? !1 : Xe(e, s);
        } else return $.isExist(e) ? e : "";
    }
    Q.exports = V;
});
var D = b1((j)=>{
    "use strict";
    function He(e, t) {
        return H(e, t);
    }
    function H(e, t, s) {
        let i, r = {};
        for(let n = 0; n < e.length; n++){
            let f = e[n], o = je(f), u = "";
            if (s === void 0 ? u = o : u = s + "." + o, o === t.textNodeName) i === void 0 ? i = f[o] : i += "" + f[o];
            else {
                if (o === void 0) continue;
                if (f[o]) {
                    let l = H(f[o], t, u), d = et(l, t);
                    f[":@"] ? De(l, f[":@"], u, t) : Object.keys(l).length === 1 && l[t.textNodeName] !== void 0 && !t.alwaysCreateTextNode ? l = l[t.textNodeName] : Object.keys(l).length === 0 && (t.alwaysCreateTextNode ? l[t.textNodeName] = "" : l = ""), r[o] !== void 0 && r.hasOwnProperty(o) ? (Array.isArray(r[o]) || (r[o] = [
                        r[o]
                    ]), r[o].push(l)) : t.isArray(o, u, d) ? r[o] = [
                        l
                    ] : r[o] = l;
                }
            }
        }
        return typeof i == "string" ? i.length > 0 && (r[t.textNodeName] = i) : i !== void 0 && (r[t.textNodeName] = i), r;
    }
    function je(e) {
        let t = Object.keys(e);
        for(let s = 0; s < t.length; s++){
            let i = t[s];
            if (i !== ":@") return i;
        }
    }
    function De(e, t, s, i) {
        if (t) {
            let r = Object.keys(t), n = r.length;
            for(let f = 0; f < n; f++){
                let o = r[f];
                i.isArray(o, s + "." + o, !0, !0) ? e[o] = [
                    t[o]
                ] : e[o] = t[o];
            }
        }
    }
    function et(e, t) {
        let s = Object.keys(e).length;
        return !!(s === 0 || s === 1 && e[t.textNodeName]);
    }
    j.prettify = He;
});
var te = b1((Ot, ee)=>{
    var { buildOptions: tt  } = Y(), st = Z1(), { prettify: nt  } = D(), rt = O1(), B = class {
        constructor(t){
            this.externalEntities = {}, this.options = tt(t);
        }
        parse(t, s) {
            if (typeof t != "string") if (t.toString) t = t.toString();
            else throw new Error("XML data is accepted in String or Bytes[] form.");
            if (s) {
                s === !0 && (s = {});
                let n = rt.validate(t, s);
                if (n !== !0) throw Error(`${n.err.msg}:${n.err.line}:${n.err.col}`);
            }
            let i = new st(this.options);
            i.addExternalEntities(this.externalEntities);
            let r = i.parseXml(t);
            return this.options.preserveOrder || r === void 0 ? r : nt(r, this.options);
        }
        addEntity(t, s) {
            if (s.indexOf("&") !== -1) throw new Error("Entity value can't have '&'");
            if (t.indexOf("&") !== -1 || t.indexOf(";") !== -1) throw new Error("An entity must be set without '&' and ';'. Eg. use '#xD' for '&#xD;'");
            if (s === "&") throw new Error("An entity with value '&' is not permitted");
            this.externalEntities[t] = s;
        }
    };
    ee.exports = B;
});
var oe = b1((St, ie)=>{
    var it = `
`;
    function ot(e, t) {
        let s = "";
        return t.format && t.indentBy.length > 0 && (s = it), ne(e, t, "", s);
    }
    function ne(e, t, s, i) {
        let r = "", n = !1;
        for(let f = 0; f < e.length; f++){
            let o = e[f], u = ut(o), l = "";
            if (s.length === 0 ? l = u : l = `${s}.${u}`, u === t.textNodeName) {
                let N = o[u];
                ft(l, t) || (N = t.tagValueProcessor(u, N), N = re(N, t)), n && (r += i), r += N, n = !1;
                continue;
            } else if (u === t.cdataPropName) {
                n && (r += i), r += `<![CDATA[${o[u][0][t.textNodeName]}]]>`, n = !1;
                continue;
            } else if (u === t.commentPropName) {
                r += i + `<!--${o[u][0][t.textNodeName]}-->`, n = !0;
                continue;
            } else if (u[0] === "?") {
                let N = se(o[":@"], t), y = u === "?xml" ? "" : i, I = o[u][0][t.textNodeName];
                I = I.length !== 0 ? " " + I : "", r += y + `<${u}${I}${N}?>`, n = !0;
                continue;
            }
            let d = i;
            d !== "" && (d += t.indentBy);
            let a = se(o[":@"], t), g = i + `<${u}${a}`, c = ne(o[u], t, l, d);
            t.unpairedTags.indexOf(u) !== -1 ? t.suppressUnpairedNode ? r += g + ">" : r += g + "/>" : (!c || c.length === 0) && t.suppressEmptyNode ? r += g + "/>" : c && c.endsWith(">") ? r += g + `>${c}${i}</${u}>` : (r += g + ">", c && i !== "" && (c.includes("/>") || c.includes("</")) ? r += i + t.indentBy + c + i : r += c, r += `</${u}>`), n = !0;
        }
        return r;
    }
    function ut(e) {
        let t = Object.keys(e);
        for(let s = 0; s < t.length; s++){
            let i = t[s];
            if (i !== ":@") return i;
        }
    }
    function se(e, t) {
        let s = "";
        if (e && !t.ignoreAttributes) for(let i in e){
            let r = t.attributeValueProcessor(i, e[i]);
            r = re(r, t), r === !0 && t.suppressBooleanAttributes ? s += ` ${i.substr(t.attributeNamePrefix.length)}` : s += ` ${i.substr(t.attributeNamePrefix.length)}="${r}"`;
        }
        return s;
    }
    function ft(e, t) {
        e = e.substr(0, e.length - t.textNodeName.length - 1);
        let s = e.substr(e.lastIndexOf(".") + 1);
        for(let i in t.stopNodes)if (t.stopNodes[i] === e || t.stopNodes[i] === "*." + s) return !0;
        return !1;
    }
    function re(e, t) {
        if (e && e.length > 0 && t.processEntities) for(let s = 0; s < t.entities.length; s++){
            let i = t.entities[s];
            e = e.replace(i.regex, i.val);
        }
        return e;
    }
    ie.exports = ot;
});
var fe = b1((xt, ue)=>{
    "use strict";
    var lt = oe(), dt = {
        attributeNamePrefix: "@_",
        attributesGroupName: !1,
        textNodeName: "#text",
        ignoreAttributes: !0,
        cdataPropName: !1,
        format: !1,
        indentBy: "  ",
        suppressEmptyNode: !1,
        suppressUnpairedNode: !0,
        suppressBooleanAttributes: !0,
        tagValueProcessor: function(e, t) {
            return t;
        },
        attributeValueProcessor: function(e, t) {
            return t;
        },
        preserveOrder: !1,
        commentPropName: !1,
        unpairedTags: [],
        entities: [
            {
                regex: new RegExp("&", "g"),
                val: "&amp;"
            },
            {
                regex: new RegExp(">", "g"),
                val: "&gt;"
            },
            {
                regex: new RegExp("<", "g"),
                val: "&lt;"
            },
            {
                regex: new RegExp("'", "g"),
                val: "&apos;"
            },
            {
                regex: new RegExp('"', "g"),
                val: "&quot;"
            }
        ],
        processEntities: !0,
        stopNodes: []
    };
    function T(e) {
        this.options = Object.assign({}, dt, e), this.options.ignoreAttributes || this.options.attributesGroupName ? this.isAttribute = function() {
            return !1;
        } : (this.attrPrefixLen = this.options.attributeNamePrefix.length, this.isAttribute = ht), this.processTextOrObjNode = ct, this.options.format ? (this.indentate = at, this.tagEndChar = `>
`, this.newLine = `
`) : (this.indentate = function() {
            return "";
        }, this.tagEndChar = ">", this.newLine = "");
    }
    T.prototype.build = function(e) {
        return this.options.preserveOrder ? lt(e, this.options) : (Array.isArray(e) && this.options.arrayNodeName && this.options.arrayNodeName.length > 1 && (e = {
            [this.options.arrayNodeName]: e
        }), this.j2x(e, 0).val);
    };
    T.prototype.j2x = function(e, t) {
        let s = "", i = "";
        for(let r in e)if (!(typeof e[r] > "u")) if (e[r] === null) r[0] === "?" ? i += this.indentate(t) + "<" + r + "?" + this.tagEndChar : i += this.indentate(t) + "<" + r + "/" + this.tagEndChar;
        else if (e[r] instanceof Date) i += this.buildTextValNode(e[r], r, "", t);
        else if (typeof e[r] != "object") {
            let n = this.isAttribute(r);
            if (n) s += this.buildAttrPairStr(n, "" + e[r]);
            else if (r === this.options.textNodeName) {
                let f = this.options.tagValueProcessor(r, "" + e[r]);
                i += this.replaceEntitiesValue(f);
            } else i += this.buildTextValNode(e[r], r, "", t);
        } else if (Array.isArray(e[r])) {
            let n = e[r].length;
            for(let f = 0; f < n; f++){
                let o = e[r][f];
                typeof o > "u" || (o === null ? r[0] === "?" ? i += this.indentate(t) + "<" + r + "?" + this.tagEndChar : i += this.indentate(t) + "<" + r + "/" + this.tagEndChar : typeof o == "object" ? i += this.processTextOrObjNode(o, r, t) : i += this.buildTextValNode(o, r, "", t));
            }
        } else if (this.options.attributesGroupName && r === this.options.attributesGroupName) {
            let n = Object.keys(e[r]), f = n.length;
            for(let o = 0; o < f; o++)s += this.buildAttrPairStr(n[o], "" + e[r][n[o]]);
        } else i += this.processTextOrObjNode(e[r], r, t);
        return {
            attrStr: s,
            val: i
        };
    };
    T.prototype.buildAttrPairStr = function(e, t) {
        return t = this.options.attributeValueProcessor(e, "" + t), t = this.replaceEntitiesValue(t), this.options.suppressBooleanAttributes && t === "true" ? " " + e : " " + e + '="' + t + '"';
    };
    function ct(e, t, s) {
        let i = this.j2x(e, s + 1);
        return e[this.options.textNodeName] !== void 0 && Object.keys(e).length === 1 ? this.buildTextValNode(e[this.options.textNodeName], t, i.attrStr, s) : this.buildObjectNode(i.val, t, i.attrStr, s);
    }
    T.prototype.buildObjectNode = function(e, t, s, i) {
        if (e === "") return t[0] === "?" ? this.indentate(i) + "<" + t + s + "?" + this.tagEndChar : this.indentate(i) + "<" + t + s + this.closeTag(t) + this.tagEndChar;
        {
            let r = "</" + t + this.tagEndChar, n = "";
            return t[0] === "?" && (n = "?", r = ""), s && e.indexOf("<") === -1 ? this.indentate(i) + "<" + t + s + n + ">" + e + r : this.options.commentPropName !== !1 && t === this.options.commentPropName && n.length === 0 ? this.indentate(i) + `<!--${e}-->` + this.newLine : this.indentate(i) + "<" + t + s + n + this.tagEndChar + e + this.indentate(i) + r;
        }
    };
    T.prototype.closeTag = function(e) {
        let t = "";
        return this.options.unpairedTags.indexOf(e) !== -1 ? this.options.suppressUnpairedNode || (t = "/") : this.options.suppressEmptyNode ? t = "/" : t = `></${e}`, t;
    };
    T.prototype.buildTextValNode = function(e, t, s, i) {
        if (this.options.cdataPropName !== !1 && t === this.options.cdataPropName) return this.indentate(i) + `<![CDATA[${e}]]>` + this.newLine;
        if (this.options.commentPropName !== !1 && t === this.options.commentPropName) return this.indentate(i) + `<!--${e}-->` + this.newLine;
        if (t[0] === "?") return this.indentate(i) + "<" + t + s + "?" + this.tagEndChar;
        {
            let r = this.options.tagValueProcessor(t, e);
            return r = this.replaceEntitiesValue(r), r === "" ? this.indentate(i) + "<" + t + s + this.closeTag(t) + this.tagEndChar : this.indentate(i) + "<" + t + s + ">" + r + "</" + t + this.tagEndChar;
        }
    };
    T.prototype.replaceEntitiesValue = function(e) {
        if (e && e.length > 0 && this.options.processEntities) for(let t = 0; t < this.options.entities.length; t++){
            let s = this.options.entities[t];
            e = e.replace(s.regex, s.val);
        }
        return e;
    };
    function at(e) {
        return this.options.indentBy.repeat(e);
    }
    function ht(e) {
        return e.startsWith(this.options.attributeNamePrefix) ? e.substr(this.attrPrefixLen) : !1;
    }
    ue.exports = T;
});
var de = b1((Vt, le)=>{
    "use strict";
    var gt = O1(), pt = te(), Nt = fe();
    le.exports = {
        XMLParser: pt,
        XMLValidator: gt,
        XMLBuilder: Nt
    };
});
var ae = Ae(de()), { XMLParser: vt , XMLValidator: Ft , XMLBuilder: $t  } = ae, { default: ce , ...bt } = ae;
const MAX_BITS = 15;
const D_CODES = 30;
const BL_CODES = 19;
const LITERALS = 256;
const L_CODES = 256 + 1 + 29;
const HEAP_SIZE = 2 * L_CODES + 1;
const END_BLOCK = 256;
const MAX_BL_BITS = 7;
const Buf_size = 8 * 2;
const Z_DEFAULT_COMPRESSION = -1;
const Z_HUFFMAN_ONLY = 2;
const Z_DEFAULT_STRATEGY = 0;
const Z_NO_FLUSH = 0;
const Z_PARTIAL_FLUSH = 1;
const Z_FULL_FLUSH = 3;
const Z_FINISH = 4;
const Z_OK = 0;
const Z_STREAM_END = 1;
const Z_NEED_DICT = 2;
const Z_STREAM_ERROR = -2;
const Z_DATA_ERROR = -3;
const Z_BUF_ERROR = -5;
function extractArray(array) {
    return flatArray(array.map(([length, value])=>new Array(length).fill(value, 0, length)));
}
function flatArray(array) {
    return array.reduce((a, b)=>a.concat(Array.isArray(b) ? flatArray(b) : b), []);
}
const _dist_code = [
    0,
    1,
    2,
    3
].concat(...extractArray([
    [
        2,
        4
    ],
    [
        2,
        5
    ],
    [
        4,
        6
    ],
    [
        4,
        7
    ],
    [
        8,
        8
    ],
    [
        8,
        9
    ],
    [
        16,
        10
    ],
    [
        16,
        11
    ],
    [
        32,
        12
    ],
    [
        32,
        13
    ],
    [
        64,
        14
    ],
    [
        64,
        15
    ],
    [
        2,
        0
    ],
    [
        1,
        16
    ],
    [
        1,
        17
    ],
    [
        2,
        18
    ],
    [
        2,
        19
    ],
    [
        4,
        20
    ],
    [
        4,
        21
    ],
    [
        8,
        22
    ],
    [
        8,
        23
    ],
    [
        16,
        24
    ],
    [
        16,
        25
    ],
    [
        32,
        26
    ],
    [
        32,
        27
    ],
    [
        64,
        28
    ],
    [
        64,
        29
    ]
]));
function Tree() {
    const that = this;
    function gen_bitlen(s) {
        const tree = that.dyn_tree;
        const stree = that.stat_desc.static_tree;
        const extra = that.stat_desc.extra_bits;
        const base = that.stat_desc.extra_base;
        const max_length = that.stat_desc.max_length;
        let h;
        let n, m;
        let bits;
        let xbits;
        let f;
        let overflow = 0;
        for(bits = 0; bits <= 15; bits++)s.bl_count[bits] = 0;
        tree[s.heap[s.heap_max] * 2 + 1] = 0;
        for(h = s.heap_max + 1; h < HEAP_SIZE; h++){
            n = s.heap[h];
            bits = tree[tree[n * 2 + 1] * 2 + 1] + 1;
            if (bits > max_length) {
                bits = max_length;
                overflow++;
            }
            tree[n * 2 + 1] = bits;
            if (n > that.max_code) continue;
            s.bl_count[bits]++;
            xbits = 0;
            if (n >= base) xbits = extra[n - base];
            f = tree[n * 2];
            s.opt_len += f * (bits + xbits);
            if (stree) s.static_len += f * (stree[n * 2 + 1] + xbits);
        }
        if (overflow === 0) return;
        do {
            bits = max_length - 1;
            while(s.bl_count[bits] === 0)bits--;
            s.bl_count[bits]--;
            s.bl_count[bits + 1] += 2;
            s.bl_count[max_length]--;
            overflow -= 2;
        }while (overflow > 0)
        for(bits = max_length; bits !== 0; bits--){
            n = s.bl_count[bits];
            while(n !== 0){
                m = s.heap[--h];
                if (m > that.max_code) continue;
                if (tree[m * 2 + 1] != bits) {
                    s.opt_len += (bits - tree[m * 2 + 1]) * tree[m * 2];
                    tree[m * 2 + 1] = bits;
                }
                n--;
            }
        }
    }
    function bi_reverse(code, len) {
        let res = 0;
        do {
            res |= code & 1;
            code >>>= 1;
            res <<= 1;
        }while (--len > 0)
        return res >>> 1;
    }
    function gen_codes(tree, max_code, bl_count) {
        const next_code = [];
        let code = 0;
        let bits;
        let n;
        let len;
        for(bits = 1; bits <= 15; bits++){
            next_code[bits] = code = code + bl_count[bits - 1] << 1;
        }
        for(n = 0; n <= max_code; n++){
            len = tree[n * 2 + 1];
            if (len === 0) continue;
            tree[n * 2] = bi_reverse(next_code[len]++, len);
        }
    }
    that.build_tree = function(s) {
        const tree = that.dyn_tree;
        const stree = that.stat_desc.static_tree;
        const elems = that.stat_desc.elems;
        let n, m;
        let max_code = -1;
        let node;
        s.heap_len = 0;
        s.heap_max = HEAP_SIZE;
        for(n = 0; n < elems; n++){
            if (tree[n * 2] !== 0) {
                s.heap[++s.heap_len] = max_code = n;
                s.depth[n] = 0;
            } else {
                tree[n * 2 + 1] = 0;
            }
        }
        while(s.heap_len < 2){
            node = s.heap[++s.heap_len] = max_code < 2 ? ++max_code : 0;
            tree[node * 2] = 1;
            s.depth[node] = 0;
            s.opt_len--;
            if (stree) s.static_len -= stree[node * 2 + 1];
        }
        that.max_code = max_code;
        for(n = Math.floor(s.heap_len / 2); n >= 1; n--)s.pqdownheap(tree, n);
        node = elems;
        do {
            n = s.heap[1];
            s.heap[1] = s.heap[s.heap_len--];
            s.pqdownheap(tree, 1);
            m = s.heap[1];
            s.heap[--s.heap_max] = n;
            s.heap[--s.heap_max] = m;
            tree[node * 2] = tree[n * 2] + tree[m * 2];
            s.depth[node] = Math.max(s.depth[n], s.depth[m]) + 1;
            tree[n * 2 + 1] = tree[m * 2 + 1] = node;
            s.heap[1] = node++;
            s.pqdownheap(tree, 1);
        }while (s.heap_len >= 2)
        s.heap[--s.heap_max] = s.heap[1];
        gen_bitlen(s);
        gen_codes(tree, that.max_code, s.bl_count);
    };
}
Tree._length_code = [
    0,
    1,
    2,
    3,
    4,
    5,
    6,
    7
].concat(...extractArray([
    [
        2,
        8
    ],
    [
        2,
        9
    ],
    [
        2,
        10
    ],
    [
        2,
        11
    ],
    [
        4,
        12
    ],
    [
        4,
        13
    ],
    [
        4,
        14
    ],
    [
        4,
        15
    ],
    [
        8,
        16
    ],
    [
        8,
        17
    ],
    [
        8,
        18
    ],
    [
        8,
        19
    ],
    [
        16,
        20
    ],
    [
        16,
        21
    ],
    [
        16,
        22
    ],
    [
        16,
        23
    ],
    [
        32,
        24
    ],
    [
        32,
        25
    ],
    [
        32,
        26
    ],
    [
        31,
        27
    ],
    [
        1,
        28
    ]
]));
Tree.base_length = [
    0,
    1,
    2,
    3,
    4,
    5,
    6,
    7,
    8,
    10,
    12,
    14,
    16,
    20,
    24,
    28,
    32,
    40,
    48,
    56,
    64,
    80,
    96,
    112,
    128,
    160,
    192,
    224,
    0
];
Tree.base_dist = [
    0,
    1,
    2,
    3,
    4,
    6,
    8,
    12,
    16,
    24,
    32,
    48,
    64,
    96,
    128,
    192,
    256,
    384,
    512,
    768,
    1024,
    1536,
    2048,
    3072,
    4096,
    6144,
    8192,
    12288,
    16384,
    24576
];
Tree.d_code = function(dist) {
    return dist < 256 ? _dist_code[dist] : _dist_code[256 + (dist >>> 7)];
};
Tree.extra_lbits = [
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    1,
    1,
    1,
    1,
    2,
    2,
    2,
    2,
    3,
    3,
    3,
    3,
    4,
    4,
    4,
    4,
    5,
    5,
    5,
    5,
    0
];
Tree.extra_dbits = [
    0,
    0,
    0,
    0,
    1,
    1,
    2,
    2,
    3,
    3,
    4,
    4,
    5,
    5,
    6,
    6,
    7,
    7,
    8,
    8,
    9,
    9,
    10,
    10,
    11,
    11,
    12,
    12,
    13,
    13
];
Tree.extra_blbits = [
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    2,
    3,
    7
];
Tree.bl_order = [
    16,
    17,
    18,
    0,
    8,
    7,
    9,
    6,
    10,
    5,
    11,
    4,
    12,
    3,
    13,
    2,
    14,
    1,
    15
];
function StaticTree(static_tree, extra_bits, extra_base, elems, max_length) {
    const that = this;
    that.static_tree = static_tree;
    that.extra_bits = extra_bits;
    that.extra_base = extra_base;
    that.elems = elems;
    that.max_length = max_length;
}
const static_ltree2_first_part = [
    12,
    140,
    76,
    204,
    44,
    172,
    108,
    236,
    28,
    156,
    92,
    220,
    60,
    188,
    124,
    252,
    2,
    130,
    66,
    194,
    34,
    162,
    98,
    226,
    18,
    146,
    82,
    210,
    50,
    178,
    114,
    242,
    10,
    138,
    74,
    202,
    42,
    170,
    106,
    234,
    26,
    154,
    90,
    218,
    58,
    186,
    122,
    250,
    6,
    134,
    70,
    198,
    38,
    166,
    102,
    230,
    22,
    150,
    86,
    214,
    54,
    182,
    118,
    246,
    14,
    142,
    78,
    206,
    46,
    174,
    110,
    238,
    30,
    158,
    94,
    222,
    62,
    190,
    126,
    254,
    1,
    129,
    65,
    193,
    33,
    161,
    97,
    225,
    17,
    145,
    81,
    209,
    49,
    177,
    113,
    241,
    9,
    137,
    73,
    201,
    41,
    169,
    105,
    233,
    25,
    153,
    89,
    217,
    57,
    185,
    121,
    249,
    5,
    133,
    69,
    197,
    37,
    165,
    101,
    229,
    21,
    149,
    85,
    213,
    53,
    181,
    117,
    245,
    13,
    141,
    77,
    205,
    45,
    173,
    109,
    237,
    29,
    157,
    93,
    221,
    61,
    189,
    125,
    253,
    19,
    275,
    147,
    403,
    83,
    339,
    211,
    467,
    51,
    307,
    179,
    435,
    115,
    371,
    243,
    499,
    11,
    267,
    139,
    395,
    75,
    331,
    203,
    459,
    43,
    299,
    171,
    427,
    107,
    363,
    235,
    491,
    27,
    283,
    155,
    411,
    91,
    347,
    219,
    475,
    59,
    315,
    187,
    443,
    123,
    379,
    251,
    507,
    7,
    263,
    135,
    391,
    71,
    327,
    199,
    455,
    39,
    295,
    167,
    423,
    103,
    359,
    231,
    487,
    23,
    279,
    151,
    407,
    87,
    343,
    215,
    471,
    55,
    311,
    183,
    439,
    119,
    375,
    247,
    503,
    15,
    271,
    143,
    399,
    79,
    335,
    207,
    463,
    47,
    303,
    175,
    431,
    111,
    367,
    239,
    495,
    31,
    287,
    159,
    415,
    95,
    351,
    223,
    479,
    63,
    319,
    191,
    447,
    127,
    383,
    255,
    511,
    0,
    64,
    32,
    96,
    16,
    80,
    48,
    112,
    8,
    72,
    40,
    104,
    24,
    88,
    56,
    120,
    4,
    68,
    36,
    100,
    20,
    84,
    52,
    116,
    3,
    131,
    67,
    195,
    35,
    163,
    99,
    227
];
const static_ltree2_second_part = extractArray([
    [
        144,
        8
    ],
    [
        112,
        9
    ],
    [
        24,
        7
    ],
    [
        8,
        8
    ]
]);
StaticTree.static_ltree = flatArray(static_ltree2_first_part.map((value, index)=>[
        value,
        static_ltree2_second_part[index]
    ]));
const static_dtree_first_part = [
    0,
    16,
    8,
    24,
    4,
    20,
    12,
    28,
    2,
    18,
    10,
    26,
    6,
    22,
    14,
    30,
    1,
    17,
    9,
    25,
    5,
    21,
    13,
    29,
    3,
    19,
    11,
    27,
    7,
    23
];
const static_dtree_second_part = extractArray([
    [
        30,
        5
    ]
]);
StaticTree.static_dtree = flatArray(static_dtree_first_part.map((value, index)=>[
        value,
        static_dtree_second_part[index]
    ]));
StaticTree.static_l_desc = new StaticTree(StaticTree.static_ltree, Tree.extra_lbits, LITERALS + 1, L_CODES, MAX_BITS);
StaticTree.static_d_desc = new StaticTree(StaticTree.static_dtree, Tree.extra_dbits, 0, D_CODES, MAX_BITS);
StaticTree.static_bl_desc = new StaticTree(null, Tree.extra_blbits, 0, BL_CODES, MAX_BL_BITS);
const MAX_MEM_LEVEL = 9;
const DEF_MEM_LEVEL = 8;
function Config(good_length, max_lazy, nice_length, max_chain, func) {
    const that = this;
    that.good_length = good_length;
    that.max_lazy = max_lazy;
    that.nice_length = nice_length;
    that.max_chain = max_chain;
    that.func = func;
}
const STORED = 0;
const FAST = 1;
const SLOW = 2;
const config_table = [
    new Config(0, 0, 0, 0, 0),
    new Config(4, 4, 8, 4, 1),
    new Config(4, 5, 16, 8, 1),
    new Config(4, 6, 32, 32, 1),
    new Config(4, 4, 16, 16, 2),
    new Config(8, 16, 32, 32, 2),
    new Config(8, 16, 128, 128, 2),
    new Config(8, 32, 128, 256, 2),
    new Config(32, 128, 258, 1024, 2),
    new Config(32, 258, 258, 4096, 2)
];
const z_errmsg = [
    "need dictionary",
    "stream end",
    "",
    "",
    "stream error",
    "data error",
    "",
    "buffer error",
    "",
    ""
];
const NeedMore = 0;
const BlockDone = 1;
const FinishStarted = 2;
const FinishDone = 3;
const PRESET_DICT = 0x20;
const INIT_STATE = 42;
const BUSY_STATE = 113;
const FINISH_STATE = 666;
const Z_DEFLATED = 8;
const MIN_MATCH = 3;
const MAX_MATCH = 258;
const MIN_LOOKAHEAD = 258 + 3 + 1;
function smaller(tree, n, m, depth) {
    const tn2 = tree[n * 2];
    const tm2 = tree[m * 2];
    return tn2 < tm2 || tn2 == tm2 && depth[n] <= depth[m];
}
function Deflate() {
    const that = this;
    let strm;
    let status;
    let pending_buf_size;
    let last_flush;
    let w_size;
    let w_bits;
    let w_mask;
    let win;
    let window_size;
    let prev;
    let head;
    let ins_h;
    let hash_size;
    let hash_bits;
    let hash_mask;
    let hash_shift;
    let block_start;
    let match_length;
    let prev_match;
    let match_available;
    let strstart;
    let match_start;
    let lookahead;
    let prev_length;
    let max_chain_length;
    let max_lazy_match;
    let level;
    let strategy;
    let good_match;
    let nice_match;
    let dyn_ltree;
    let dyn_dtree;
    let bl_tree;
    const l_desc = new Tree();
    const d_desc = new Tree();
    const bl_desc = new Tree();
    that.depth = [];
    let lit_bufsize;
    let last_lit;
    let matches;
    let last_eob_len;
    let bi_buf;
    let bi_valid;
    that.bl_count = [];
    that.heap = [];
    dyn_ltree = [];
    dyn_dtree = [];
    bl_tree = [];
    function lm_init() {
        window_size = 2 * w_size;
        head[hash_size - 1] = 0;
        for(let i = 0; i < hash_size - 1; i++){
            head[i] = 0;
        }
        max_lazy_match = config_table[level].max_lazy;
        good_match = config_table[level].good_length;
        nice_match = config_table[level].nice_length;
        max_chain_length = config_table[level].max_chain;
        strstart = 0;
        block_start = 0;
        lookahead = 0;
        match_length = prev_length = MIN_MATCH - 1;
        match_available = 0;
        ins_h = 0;
    }
    function init_block() {
        let i;
        for(i = 0; i < L_CODES; i++)dyn_ltree[i * 2] = 0;
        for(i = 0; i < 30; i++)dyn_dtree[i * 2] = 0;
        for(i = 0; i < 19; i++)bl_tree[i * 2] = 0;
        dyn_ltree[END_BLOCK * 2] = 1;
        that.opt_len = that.static_len = 0;
        last_lit = matches = 0;
    }
    function tr_init() {
        l_desc.dyn_tree = dyn_ltree;
        l_desc.stat_desc = StaticTree.static_l_desc;
        d_desc.dyn_tree = dyn_dtree;
        d_desc.stat_desc = StaticTree.static_d_desc;
        bl_desc.dyn_tree = bl_tree;
        bl_desc.stat_desc = StaticTree.static_bl_desc;
        bi_buf = 0;
        bi_valid = 0;
        last_eob_len = 8;
        init_block();
    }
    that.pqdownheap = function(tree, k) {
        const heap = that.heap;
        const v = heap[k];
        let j = k << 1;
        while(j <= that.heap_len){
            if (j < that.heap_len && smaller(tree, heap[j + 1], heap[j], that.depth)) {
                j++;
            }
            if (smaller(tree, v, heap[j], that.depth)) break;
            heap[k] = heap[j];
            k = j;
            j <<= 1;
        }
        heap[k] = v;
    };
    function scan_tree(tree, max_code) {
        let prevlen = -1;
        let curlen;
        let nextlen = tree[0 * 2 + 1];
        let count = 0;
        let max_count = 7;
        let min_count = 4;
        if (nextlen === 0) {
            max_count = 138;
            min_count = 3;
        }
        tree[(max_code + 1) * 2 + 1] = 0xffff;
        for(let n = 0; n <= max_code; n++){
            curlen = nextlen;
            nextlen = tree[(n + 1) * 2 + 1];
            if (++count < max_count && curlen == nextlen) {
                continue;
            } else if (count < min_count) {
                bl_tree[curlen * 2] += count;
            } else if (curlen !== 0) {
                if (curlen != prevlen) bl_tree[curlen * 2]++;
                bl_tree[16 * 2]++;
            } else if (count <= 10) {
                bl_tree[17 * 2]++;
            } else {
                bl_tree[18 * 2]++;
            }
            count = 0;
            prevlen = curlen;
            if (nextlen === 0) {
                max_count = 138;
                min_count = 3;
            } else if (curlen == nextlen) {
                max_count = 6;
                min_count = 3;
            } else {
                max_count = 7;
                min_count = 4;
            }
        }
    }
    function build_bl_tree() {
        let max_blindex;
        scan_tree(dyn_ltree, l_desc.max_code);
        scan_tree(dyn_dtree, d_desc.max_code);
        bl_desc.build_tree(that);
        for(max_blindex = BL_CODES - 1; max_blindex >= 3; max_blindex--){
            if (bl_tree[Tree.bl_order[max_blindex] * 2 + 1] !== 0) break;
        }
        that.opt_len += 3 * (max_blindex + 1) + 5 + 5 + 4;
        return max_blindex;
    }
    function put_byte(p) {
        that.pending_buf[that.pending++] = p;
    }
    function put_short(w) {
        put_byte(w & 0xff);
        put_byte(w >>> 8 & 0xff);
    }
    function putShortMSB(b) {
        put_byte(b >> 8 & 0xff);
        put_byte(b & 0xff & 0xff);
    }
    function send_bits(value, length) {
        let val;
        const len = length;
        if (bi_valid > Buf_size - len) {
            val = value;
            bi_buf |= val << bi_valid & 0xffff;
            put_short(bi_buf);
            bi_buf = val >>> Buf_size - bi_valid;
            bi_valid += len - Buf_size;
        } else {
            bi_buf |= value << bi_valid & 0xffff;
            bi_valid += len;
        }
    }
    function send_code(c, tree) {
        const c2 = c * 2;
        send_bits(tree[c2] & 0xffff, tree[c2 + 1] & 0xffff);
    }
    function send_tree(tree, max_code) {
        let n;
        let prevlen = -1;
        let curlen;
        let nextlen = tree[0 * 2 + 1];
        let count = 0;
        let max_count = 7;
        let min_count = 4;
        if (nextlen === 0) {
            max_count = 138;
            min_count = 3;
        }
        for(n = 0; n <= max_code; n++){
            curlen = nextlen;
            nextlen = tree[(n + 1) * 2 + 1];
            if (++count < max_count && curlen == nextlen) {
                continue;
            } else if (count < min_count) {
                do {
                    send_code(curlen, bl_tree);
                }while (--count !== 0)
            } else if (curlen !== 0) {
                if (curlen != prevlen) {
                    send_code(curlen, bl_tree);
                    count--;
                }
                send_code(16, bl_tree);
                send_bits(count - 3, 2);
            } else if (count <= 10) {
                send_code(17, bl_tree);
                send_bits(count - 3, 3);
            } else {
                send_code(18, bl_tree);
                send_bits(count - 11, 7);
            }
            count = 0;
            prevlen = curlen;
            if (nextlen === 0) {
                max_count = 138;
                min_count = 3;
            } else if (curlen == nextlen) {
                max_count = 6;
                min_count = 3;
            } else {
                max_count = 7;
                min_count = 4;
            }
        }
    }
    function send_all_trees(lcodes, dcodes, blcodes) {
        let rank;
        send_bits(lcodes - 257, 5);
        send_bits(dcodes - 1, 5);
        send_bits(blcodes - 4, 4);
        for(rank = 0; rank < blcodes; rank++){
            send_bits(bl_tree[Tree.bl_order[rank] * 2 + 1], 3);
        }
        send_tree(dyn_ltree, lcodes - 1);
        send_tree(dyn_dtree, dcodes - 1);
    }
    function bi_flush() {
        if (bi_valid == 16) {
            put_short(bi_buf);
            bi_buf = 0;
            bi_valid = 0;
        } else if (bi_valid >= 8) {
            put_byte(bi_buf & 0xff);
            bi_buf >>>= 8;
            bi_valid -= 8;
        }
    }
    function _tr_align() {
        send_bits(1 << 1, 3);
        send_code(256, StaticTree.static_ltree);
        bi_flush();
        if (1 + last_eob_len + 10 - bi_valid < 9) {
            send_bits(1 << 1, 3);
            send_code(256, StaticTree.static_ltree);
            bi_flush();
        }
        last_eob_len = 7;
    }
    function _tr_tally(dist, lc) {
        let out_length, in_length, dcode;
        that.dist_buf[last_lit] = dist;
        that.lc_buf[last_lit] = lc & 0xff;
        last_lit++;
        if (dist === 0) {
            dyn_ltree[lc * 2]++;
        } else {
            matches++;
            dist--;
            dyn_ltree[(Tree._length_code[lc] + 256 + 1) * 2]++;
            dyn_dtree[Tree.d_code(dist) * 2]++;
        }
        if ((last_lit & 0x1fff) === 0 && level > 2) {
            out_length = last_lit * 8;
            in_length = strstart - block_start;
            for(dcode = 0; dcode < 30; dcode++){
                out_length += dyn_dtree[dcode * 2] * (5 + Tree.extra_dbits[dcode]);
            }
            out_length >>>= 3;
            if (matches < Math.floor(last_lit / 2) && out_length < Math.floor(in_length / 2)) return true;
        }
        return last_lit == lit_bufsize - 1;
    }
    function compress_block(ltree, dtree) {
        let dist;
        let lc;
        let lx = 0;
        let code;
        let extra;
        if (last_lit !== 0) {
            do {
                dist = that.dist_buf[lx];
                lc = that.lc_buf[lx];
                lx++;
                if (dist === 0) {
                    send_code(lc, ltree);
                } else {
                    code = Tree._length_code[lc];
                    send_code(code + 256 + 1, ltree);
                    extra = Tree.extra_lbits[code];
                    if (extra !== 0) {
                        lc -= Tree.base_length[code];
                        send_bits(lc, extra);
                    }
                    dist--;
                    code = Tree.d_code(dist);
                    send_code(code, dtree);
                    extra = Tree.extra_dbits[code];
                    if (extra !== 0) {
                        dist -= Tree.base_dist[code];
                        send_bits(dist, extra);
                    }
                }
            }while (lx < last_lit)
        }
        send_code(256, ltree);
        last_eob_len = ltree[END_BLOCK * 2 + 1];
    }
    function bi_windup() {
        if (bi_valid > 8) {
            put_short(bi_buf);
        } else if (bi_valid > 0) {
            put_byte(bi_buf & 0xff);
        }
        bi_buf = 0;
        bi_valid = 0;
    }
    function copy_block(buf, len, header) {
        bi_windup();
        last_eob_len = 8;
        if (header) {
            put_short(len);
            put_short(~len);
        }
        that.pending_buf.set(win.subarray(buf, buf + len), that.pending);
        that.pending += len;
    }
    function _tr_stored_block(buf, stored_len, eof) {
        send_bits((0 << 1) + (eof ? 1 : 0), 3);
        copy_block(buf, stored_len, true);
    }
    function _tr_flush_block(buf, stored_len, eof) {
        let opt_lenb, static_lenb;
        let max_blindex = 0;
        if (level > 0) {
            l_desc.build_tree(that);
            d_desc.build_tree(that);
            max_blindex = build_bl_tree();
            opt_lenb = that.opt_len + 3 + 7 >>> 3;
            static_lenb = that.static_len + 3 + 7 >>> 3;
            if (static_lenb <= opt_lenb) opt_lenb = static_lenb;
        } else {
            opt_lenb = static_lenb = stored_len + 5;
        }
        if (stored_len + 4 <= opt_lenb && buf != -1) {
            _tr_stored_block(buf, stored_len, eof);
        } else if (static_lenb == opt_lenb) {
            send_bits((1 << 1) + (eof ? 1 : 0), 3);
            compress_block(StaticTree.static_ltree, StaticTree.static_dtree);
        } else {
            send_bits((2 << 1) + (eof ? 1 : 0), 3);
            send_all_trees(l_desc.max_code + 1, d_desc.max_code + 1, max_blindex + 1);
            compress_block(dyn_ltree, dyn_dtree);
        }
        init_block();
        if (eof) {
            bi_windup();
        }
    }
    function flush_block_only(eof) {
        _tr_flush_block(block_start >= 0 ? block_start : -1, strstart - block_start, eof);
        block_start = strstart;
        strm.flush_pending();
    }
    function fill_window() {
        let n, m;
        let p;
        let more;
        do {
            more = window_size - lookahead - strstart;
            if (more === 0 && strstart === 0 && lookahead === 0) {
                more = w_size;
            } else if (more == -1) {
                more--;
            } else if (strstart >= w_size + w_size - MIN_LOOKAHEAD) {
                win.set(win.subarray(w_size, w_size + w_size), 0);
                match_start -= w_size;
                strstart -= w_size;
                block_start -= w_size;
                n = hash_size;
                p = n;
                do {
                    m = head[--p] & 0xffff;
                    head[p] = m >= w_size ? m - w_size : 0;
                }while (--n !== 0)
                n = w_size;
                p = n;
                do {
                    m = prev[--p] & 0xffff;
                    prev[p] = m >= w_size ? m - w_size : 0;
                }while (--n !== 0)
                more += w_size;
            }
            if (strm.avail_in === 0) return;
            n = strm.read_buf(win, strstart + lookahead, more);
            lookahead += n;
            if (lookahead >= 3) {
                ins_h = win[strstart] & 0xff;
                ins_h = (ins_h << hash_shift ^ win[strstart + 1] & 0xff) & hash_mask;
            }
        }while (lookahead < MIN_LOOKAHEAD && strm.avail_in !== 0)
    }
    function deflate_stored(flush) {
        let max_block_size = 0xffff;
        let max_start;
        if (max_block_size > pending_buf_size - 5) {
            max_block_size = pending_buf_size - 5;
        }
        while(true){
            if (lookahead <= 1) {
                fill_window();
                if (lookahead === 0 && flush == 0) return 0;
                if (lookahead === 0) break;
            }
            strstart += lookahead;
            lookahead = 0;
            max_start = block_start + max_block_size;
            if (strstart === 0 || strstart >= max_start) {
                lookahead = strstart - max_start;
                strstart = max_start;
                flush_block_only(false);
                if (strm.avail_out === 0) return 0;
            }
            if (strstart - block_start >= w_size - MIN_LOOKAHEAD) {
                flush_block_only(false);
                if (strm.avail_out === 0) return 0;
            }
        }
        flush_block_only(flush == 4);
        if (strm.avail_out === 0) return flush == 4 ? 2 : 0;
        return flush == 4 ? 3 : 1;
    }
    function longest_match(cur_match) {
        let chain_length = max_chain_length;
        let scan = strstart;
        let match;
        let len;
        let best_len = prev_length;
        const limit = strstart > w_size - MIN_LOOKAHEAD ? strstart - (w_size - MIN_LOOKAHEAD) : 0;
        let _nice_match = nice_match;
        const wmask = w_mask;
        const strend = strstart + 258;
        let scan_end1 = win[scan + best_len - 1];
        let scan_end = win[scan + best_len];
        if (prev_length >= good_match) {
            chain_length >>= 2;
        }
        if (_nice_match > lookahead) _nice_match = lookahead;
        do {
            match = cur_match;
            if (win[match + best_len] != scan_end || win[match + best_len - 1] != scan_end1 || win[match] != win[scan] || win[++match] != win[scan + 1]) continue;
            scan += 2;
            match++;
            do {}while (win[++scan] == win[++match] && win[++scan] == win[++match] && win[++scan] == win[++match] && win[++scan] == win[++match] && win[++scan] == win[++match] && win[++scan] == win[++match] && win[++scan] == win[++match] && win[++scan] == win[++match] && scan < strend)
            len = MAX_MATCH - (strend - scan);
            scan = strend - MAX_MATCH;
            if (len > best_len) {
                match_start = cur_match;
                best_len = len;
                if (len >= _nice_match) break;
                scan_end1 = win[scan + best_len - 1];
                scan_end = win[scan + best_len];
            }
        }while ((cur_match = prev[cur_match & wmask] & 0xffff) > limit && --chain_length !== 0)
        if (best_len <= lookahead) return best_len;
        return lookahead;
    }
    function deflate_fast(flush) {
        let hash_head = 0;
        let bflush;
        while(true){
            if (lookahead < MIN_LOOKAHEAD) {
                fill_window();
                if (lookahead < MIN_LOOKAHEAD && flush == 0) {
                    return 0;
                }
                if (lookahead === 0) break;
            }
            if (lookahead >= 3) {
                ins_h = (ins_h << hash_shift ^ win[strstart + (MIN_MATCH - 1)] & 0xff) & hash_mask;
                hash_head = head[ins_h] & 0xffff;
                prev[strstart & w_mask] = head[ins_h];
                head[ins_h] = strstart;
            }
            if (hash_head !== 0 && (strstart - hash_head & 0xffff) <= w_size - MIN_LOOKAHEAD) {
                if (strategy != 2) {
                    match_length = longest_match(hash_head);
                }
            }
            if (match_length >= 3) {
                bflush = _tr_tally(strstart - match_start, match_length - MIN_MATCH);
                lookahead -= match_length;
                if (match_length <= max_lazy_match && lookahead >= 3) {
                    match_length--;
                    do {
                        strstart++;
                        ins_h = (ins_h << hash_shift ^ win[strstart + (MIN_MATCH - 1)] & 0xff) & hash_mask;
                        hash_head = head[ins_h] & 0xffff;
                        prev[strstart & w_mask] = head[ins_h];
                        head[ins_h] = strstart;
                    }while (--match_length !== 0)
                    strstart++;
                } else {
                    strstart += match_length;
                    match_length = 0;
                    ins_h = win[strstart] & 0xff;
                    ins_h = (ins_h << hash_shift ^ win[strstart + 1] & 0xff) & hash_mask;
                }
            } else {
                bflush = _tr_tally(0, win[strstart] & 0xff);
                lookahead--;
                strstart++;
            }
            if (bflush) {
                flush_block_only(false);
                if (strm.avail_out === 0) return 0;
            }
        }
        flush_block_only(flush == 4);
        if (strm.avail_out === 0) {
            if (flush == 4) return 2;
            else return 0;
        }
        return flush == 4 ? 3 : 1;
    }
    function deflate_slow(flush) {
        let hash_head = 0;
        let bflush;
        let max_insert;
        while(true){
            if (lookahead < MIN_LOOKAHEAD) {
                fill_window();
                if (lookahead < MIN_LOOKAHEAD && flush == 0) {
                    return 0;
                }
                if (lookahead === 0) break;
            }
            if (lookahead >= 3) {
                ins_h = (ins_h << hash_shift ^ win[strstart + (MIN_MATCH - 1)] & 0xff) & hash_mask;
                hash_head = head[ins_h] & 0xffff;
                prev[strstart & w_mask] = head[ins_h];
                head[ins_h] = strstart;
            }
            prev_length = match_length;
            prev_match = match_start;
            match_length = MIN_MATCH - 1;
            if (hash_head !== 0 && prev_length < max_lazy_match && (strstart - hash_head & 0xffff) <= w_size - MIN_LOOKAHEAD) {
                if (strategy != 2) {
                    match_length = longest_match(hash_head);
                }
                if (match_length <= 5 && (strategy == 1 || match_length == 3 && strstart - match_start > 4096)) {
                    match_length = MIN_MATCH - 1;
                }
            }
            if (prev_length >= 3 && match_length <= prev_length) {
                max_insert = strstart + lookahead - MIN_MATCH;
                bflush = _tr_tally(strstart - 1 - prev_match, prev_length - MIN_MATCH);
                lookahead -= prev_length - 1;
                prev_length -= 2;
                do {
                    if (++strstart <= max_insert) {
                        ins_h = (ins_h << hash_shift ^ win[strstart + (MIN_MATCH - 1)] & 0xff) & hash_mask;
                        hash_head = head[ins_h] & 0xffff;
                        prev[strstart & w_mask] = head[ins_h];
                        head[ins_h] = strstart;
                    }
                }while (--prev_length !== 0)
                match_available = 0;
                match_length = MIN_MATCH - 1;
                strstart++;
                if (bflush) {
                    flush_block_only(false);
                    if (strm.avail_out === 0) return 0;
                }
            } else if (match_available !== 0) {
                bflush = _tr_tally(0, win[strstart - 1] & 0xff);
                if (bflush) {
                    flush_block_only(false);
                }
                strstart++;
                lookahead--;
                if (strm.avail_out === 0) return 0;
            } else {
                match_available = 1;
                strstart++;
                lookahead--;
            }
        }
        if (match_available !== 0) {
            bflush = _tr_tally(0, win[strstart - 1] & 0xff);
            match_available = 0;
        }
        flush_block_only(flush == 4);
        if (strm.avail_out === 0) {
            if (flush == 4) return 2;
            else return 0;
        }
        return flush == 4 ? 3 : 1;
    }
    function deflateReset(strm) {
        strm.total_in = strm.total_out = 0;
        strm.msg = null;
        that.pending = 0;
        that.pending_out = 0;
        status = BUSY_STATE;
        last_flush = Z_NO_FLUSH;
        tr_init();
        lm_init();
        return 0;
    }
    that.deflateInit = function(strm, _level, bits, _method, memLevel, _strategy) {
        if (!_method) _method = Z_DEFLATED;
        if (!memLevel) memLevel = DEF_MEM_LEVEL;
        if (!_strategy) _strategy = Z_DEFAULT_STRATEGY;
        strm.msg = null;
        if (_level == Z_DEFAULT_COMPRESSION) _level = 6;
        if (memLevel < 1 || memLevel > MAX_MEM_LEVEL || _method != Z_DEFLATED || bits < 9 || bits > 15 || _level < 0 || _level > 9 || _strategy < 0 || _strategy > Z_HUFFMAN_ONLY) {
            return Z_STREAM_ERROR;
        }
        strm.dstate = that;
        w_bits = bits;
        w_size = 1 << w_bits;
        w_mask = w_size - 1;
        hash_bits = memLevel + 7;
        hash_size = 1 << hash_bits;
        hash_mask = hash_size - 1;
        hash_shift = Math.floor((hash_bits + MIN_MATCH - 1) / MIN_MATCH);
        win = new Uint8Array(w_size * 2);
        prev = [];
        head = [];
        lit_bufsize = 1 << memLevel + 6;
        that.pending_buf = new Uint8Array(lit_bufsize * 4);
        pending_buf_size = lit_bufsize * 4;
        that.dist_buf = new Uint16Array(lit_bufsize);
        that.lc_buf = new Uint8Array(lit_bufsize);
        level = _level;
        strategy = _strategy;
        return deflateReset(strm);
    };
    that.deflateEnd = function() {
        if (status != INIT_STATE && status != BUSY_STATE && status != FINISH_STATE) {
            return Z_STREAM_ERROR;
        }
        that.lc_buf = null;
        that.dist_buf = null;
        that.pending_buf = null;
        head = null;
        prev = null;
        win = null;
        that.dstate = null;
        return status == BUSY_STATE ? Z_DATA_ERROR : Z_OK;
    };
    that.deflateParams = function(strm, _level, _strategy) {
        let err = Z_OK;
        if (_level == Z_DEFAULT_COMPRESSION) {
            _level = 6;
        }
        if (_level < 0 || _level > 9 || _strategy < 0 || _strategy > Z_HUFFMAN_ONLY) {
            return Z_STREAM_ERROR;
        }
        if (config_table[level].func != config_table[_level].func && strm.total_in !== 0) {
            err = strm.deflate(Z_PARTIAL_FLUSH);
        }
        if (level != _level) {
            level = _level;
            max_lazy_match = config_table[level].max_lazy;
            good_match = config_table[level].good_length;
            nice_match = config_table[level].nice_length;
            max_chain_length = config_table[level].max_chain;
        }
        strategy = _strategy;
        return err;
    };
    that.deflateSetDictionary = function(_strm, dictionary, dictLength) {
        let length = dictLength;
        let n, index = 0;
        if (!dictionary || status != INIT_STATE) return Z_STREAM_ERROR;
        if (length < MIN_MATCH) return Z_OK;
        if (length > w_size - MIN_LOOKAHEAD) {
            length = w_size - MIN_LOOKAHEAD;
            index = dictLength - length;
        }
        win.set(dictionary.subarray(index, index + length), 0);
        strstart = length;
        block_start = length;
        ins_h = win[0] & 0xff;
        ins_h = (ins_h << hash_shift ^ win[1] & 0xff) & hash_mask;
        for(n = 0; n <= length - MIN_MATCH; n++){
            ins_h = (ins_h << hash_shift ^ win[n + (MIN_MATCH - 1)] & 0xff) & hash_mask;
            prev[n & w_mask] = head[ins_h];
            head[ins_h] = n;
        }
        return Z_OK;
    };
    that.deflate = function(_strm, flush) {
        let i, header, level_flags, old_flush, bstate;
        if (flush > Z_FINISH || flush < 0) {
            return Z_STREAM_ERROR;
        }
        if (!_strm.next_out || !_strm.next_in && _strm.avail_in !== 0 || status == FINISH_STATE && flush != Z_FINISH) {
            _strm.msg = z_errmsg[Z_NEED_DICT - Z_STREAM_ERROR];
            return Z_STREAM_ERROR;
        }
        if (_strm.avail_out === 0) {
            _strm.msg = z_errmsg[Z_NEED_DICT - Z_BUF_ERROR];
            return Z_BUF_ERROR;
        }
        strm = _strm;
        old_flush = last_flush;
        last_flush = flush;
        if (status == INIT_STATE) {
            header = Z_DEFLATED + (w_bits - 8 << 4) << 8;
            level_flags = (level - 1 & 0xff) >> 1;
            if (level_flags > 3) level_flags = 3;
            header |= level_flags << 6;
            if (strstart !== 0) header |= PRESET_DICT;
            header += 31 - header % 31;
            status = BUSY_STATE;
            putShortMSB(header);
        }
        if (that.pending !== 0) {
            strm.flush_pending();
            if (strm.avail_out === 0) {
                last_flush = -1;
                return Z_OK;
            }
        } else if (strm.avail_in === 0 && flush <= old_flush && flush != Z_FINISH) {
            strm.msg = z_errmsg[Z_NEED_DICT - Z_BUF_ERROR];
            return Z_BUF_ERROR;
        }
        if (status == FINISH_STATE && strm.avail_in !== 0) {
            _strm.msg = z_errmsg[Z_NEED_DICT - Z_BUF_ERROR];
            return Z_BUF_ERROR;
        }
        if (strm.avail_in !== 0 || lookahead !== 0 || flush != Z_NO_FLUSH && status != FINISH_STATE) {
            bstate = -1;
            switch(config_table[level].func){
                case STORED:
                    bstate = deflate_stored(flush);
                    break;
                case FAST:
                    bstate = deflate_fast(flush);
                    break;
                case SLOW:
                    bstate = deflate_slow(flush);
                    break;
                default:
            }
            if (bstate == FinishStarted || bstate == FinishDone) {
                status = FINISH_STATE;
            }
            if (bstate == NeedMore || bstate == FinishStarted) {
                if (strm.avail_out === 0) {
                    last_flush = -1;
                }
                return Z_OK;
            }
            if (bstate == BlockDone) {
                if (flush == Z_PARTIAL_FLUSH) {
                    _tr_align();
                } else {
                    _tr_stored_block(0, 0, false);
                    if (flush == Z_FULL_FLUSH) {
                        for(i = 0; i < hash_size; i++)head[i] = 0;
                    }
                }
                strm.flush_pending();
                if (strm.avail_out === 0) {
                    last_flush = -1;
                    return Z_OK;
                }
            }
        }
        if (flush != Z_FINISH) return Z_OK;
        return Z_STREAM_END;
    };
}
function ZStream() {
    const that = this;
    that.next_in_index = 0;
    that.next_out_index = 0;
    that.avail_in = 0;
    that.total_in = 0;
    that.avail_out = 0;
    that.total_out = 0;
}
ZStream.prototype = {
    deflateInit (level, bits) {
        const that = this;
        that.dstate = new Deflate();
        if (!bits) bits = MAX_BITS;
        return that.dstate.deflateInit(that, level, bits);
    },
    deflate (flush) {
        const that = this;
        if (!that.dstate) {
            return Z_STREAM_ERROR;
        }
        return that.dstate.deflate(that, flush);
    },
    deflateEnd () {
        const that = this;
        if (!that.dstate) return Z_STREAM_ERROR;
        const ret = that.dstate.deflateEnd();
        that.dstate = null;
        return ret;
    },
    deflateParams (level, strategy) {
        const that = this;
        if (!that.dstate) return Z_STREAM_ERROR;
        return that.dstate.deflateParams(that, level, strategy);
    },
    deflateSetDictionary (dictionary, dictLength) {
        const that = this;
        if (!that.dstate) return Z_STREAM_ERROR;
        return that.dstate.deflateSetDictionary(that, dictionary, dictLength);
    },
    read_buf (buf, start, size) {
        const that = this;
        let len = that.avail_in;
        if (len > size) len = size;
        if (len === 0) return 0;
        that.avail_in -= len;
        buf.set(that.next_in.subarray(that.next_in_index, that.next_in_index + len), start);
        that.next_in_index += len;
        that.total_in += len;
        return len;
    },
    flush_pending () {
        const that = this;
        let len = that.dstate.pending;
        if (len > that.avail_out) len = that.avail_out;
        if (len === 0) return;
        that.next_out.set(that.dstate.pending_buf.subarray(that.dstate.pending_out, that.dstate.pending_out + len), that.next_out_index);
        that.next_out_index += len;
        that.dstate.pending_out += len;
        that.total_out += len;
        that.avail_out -= len;
        that.dstate.pending -= len;
        if (that.dstate.pending === 0) {
            that.dstate.pending_out = 0;
        }
    }
};
function ZipDeflate(options) {
    const that = this;
    const z = new ZStream();
    const bufsize = getMaximumCompressedSize(options && options.chunkSize ? options.chunkSize : 64 * 1024);
    const flush = 0;
    const buf = new Uint8Array(bufsize);
    let level = options ? options.level : Z_DEFAULT_COMPRESSION;
    if (typeof level == "undefined") level = Z_DEFAULT_COMPRESSION;
    z.deflateInit(level);
    z.next_out = buf;
    that.append = function(data, onprogress) {
        let err, array, lastIndex = 0, bufferIndex = 0, bufferSize = 0;
        const buffers = [];
        if (!data.length) return;
        z.next_in_index = 0;
        z.next_in = data;
        z.avail_in = data.length;
        do {
            z.next_out_index = 0;
            z.avail_out = bufsize;
            err = z.deflate(flush);
            if (err != Z_OK) throw new Error("deflating: " + z.msg);
            if (z.next_out_index) if (z.next_out_index == bufsize) buffers.push(new Uint8Array(buf));
            else buffers.push(buf.slice(0, z.next_out_index));
            bufferSize += z.next_out_index;
            if (onprogress && z.next_in_index > 0 && z.next_in_index != lastIndex) {
                onprogress(z.next_in_index);
                lastIndex = z.next_in_index;
            }
        }while (z.avail_in > 0 || z.avail_out === 0)
        if (buffers.length > 1) {
            array = new Uint8Array(bufferSize);
            buffers.forEach(function(chunk) {
                array.set(chunk, bufferIndex);
                bufferIndex += chunk.length;
            });
        } else {
            array = buffers[0] || new Uint8Array();
        }
        return array;
    };
    that.flush = function() {
        let err, array, bufferIndex = 0, bufferSize = 0;
        const buffers = [];
        do {
            z.next_out_index = 0;
            z.avail_out = bufsize;
            err = z.deflate(Z_FINISH);
            if (err != Z_STREAM_END && err != Z_OK) throw new Error("deflating: " + z.msg);
            if (bufsize - z.avail_out > 0) buffers.push(buf.slice(0, z.next_out_index));
            bufferSize += z.next_out_index;
        }while (z.avail_in > 0 || z.avail_out === 0)
        z.deflateEnd();
        array = new Uint8Array(bufferSize);
        buffers.forEach(function(chunk) {
            array.set(chunk, bufferIndex);
            bufferIndex += chunk.length;
        });
        return array;
    };
}
function getMaximumCompressedSize(uncompressedSize) {
    return uncompressedSize + 5 * (Math.floor(uncompressedSize / 16383) + 1);
}
const MAX_BITS1 = 15;
const Z_OK1 = 0;
const Z_STREAM_END1 = 1;
const Z_NEED_DICT1 = 2;
const Z_STREAM_ERROR1 = -2;
const Z_DATA_ERROR1 = -3;
const Z_MEM_ERROR = -4;
const Z_BUF_ERROR1 = -5;
const inflate_mask = [
    0x00000000,
    0x00000001,
    0x00000003,
    0x00000007,
    0x0000000f,
    0x0000001f,
    0x0000003f,
    0x0000007f,
    0x000000ff,
    0x000001ff,
    0x000003ff,
    0x000007ff,
    0x00000fff,
    0x00001fff,
    0x00003fff,
    0x00007fff,
    0x0000ffff
];
const Z_FINISH1 = 4;
const fixed_bl = 9;
const fixed_bd = 5;
const fixed_tl = [
    96,
    7,
    256,
    0,
    8,
    80,
    0,
    8,
    16,
    84,
    8,
    115,
    82,
    7,
    31,
    0,
    8,
    112,
    0,
    8,
    48,
    0,
    9,
    192,
    80,
    7,
    10,
    0,
    8,
    96,
    0,
    8,
    32,
    0,
    9,
    160,
    0,
    8,
    0,
    0,
    8,
    128,
    0,
    8,
    64,
    0,
    9,
    224,
    80,
    7,
    6,
    0,
    8,
    88,
    0,
    8,
    24,
    0,
    9,
    144,
    83,
    7,
    59,
    0,
    8,
    120,
    0,
    8,
    56,
    0,
    9,
    208,
    81,
    7,
    17,
    0,
    8,
    104,
    0,
    8,
    40,
    0,
    9,
    176,
    0,
    8,
    8,
    0,
    8,
    136,
    0,
    8,
    72,
    0,
    9,
    240,
    80,
    7,
    4,
    0,
    8,
    84,
    0,
    8,
    20,
    85,
    8,
    227,
    83,
    7,
    43,
    0,
    8,
    116,
    0,
    8,
    52,
    0,
    9,
    200,
    81,
    7,
    13,
    0,
    8,
    100,
    0,
    8,
    36,
    0,
    9,
    168,
    0,
    8,
    4,
    0,
    8,
    132,
    0,
    8,
    68,
    0,
    9,
    232,
    80,
    7,
    8,
    0,
    8,
    92,
    0,
    8,
    28,
    0,
    9,
    152,
    84,
    7,
    83,
    0,
    8,
    124,
    0,
    8,
    60,
    0,
    9,
    216,
    82,
    7,
    23,
    0,
    8,
    108,
    0,
    8,
    44,
    0,
    9,
    184,
    0,
    8,
    12,
    0,
    8,
    140,
    0,
    8,
    76,
    0,
    9,
    248,
    80,
    7,
    3,
    0,
    8,
    82,
    0,
    8,
    18,
    85,
    8,
    163,
    83,
    7,
    35,
    0,
    8,
    114,
    0,
    8,
    50,
    0,
    9,
    196,
    81,
    7,
    11,
    0,
    8,
    98,
    0,
    8,
    34,
    0,
    9,
    164,
    0,
    8,
    2,
    0,
    8,
    130,
    0,
    8,
    66,
    0,
    9,
    228,
    80,
    7,
    7,
    0,
    8,
    90,
    0,
    8,
    26,
    0,
    9,
    148,
    84,
    7,
    67,
    0,
    8,
    122,
    0,
    8,
    58,
    0,
    9,
    212,
    82,
    7,
    19,
    0,
    8,
    106,
    0,
    8,
    42,
    0,
    9,
    180,
    0,
    8,
    10,
    0,
    8,
    138,
    0,
    8,
    74,
    0,
    9,
    244,
    80,
    7,
    5,
    0,
    8,
    86,
    0,
    8,
    22,
    192,
    8,
    0,
    83,
    7,
    51,
    0,
    8,
    118,
    0,
    8,
    54,
    0,
    9,
    204,
    81,
    7,
    15,
    0,
    8,
    102,
    0,
    8,
    38,
    0,
    9,
    172,
    0,
    8,
    6,
    0,
    8,
    134,
    0,
    8,
    70,
    0,
    9,
    236,
    80,
    7,
    9,
    0,
    8,
    94,
    0,
    8,
    30,
    0,
    9,
    156,
    84,
    7,
    99,
    0,
    8,
    126,
    0,
    8,
    62,
    0,
    9,
    220,
    82,
    7,
    27,
    0,
    8,
    110,
    0,
    8,
    46,
    0,
    9,
    188,
    0,
    8,
    14,
    0,
    8,
    142,
    0,
    8,
    78,
    0,
    9,
    252,
    96,
    7,
    256,
    0,
    8,
    81,
    0,
    8,
    17,
    85,
    8,
    131,
    82,
    7,
    31,
    0,
    8,
    113,
    0,
    8,
    49,
    0,
    9,
    194,
    80,
    7,
    10,
    0,
    8,
    97,
    0,
    8,
    33,
    0,
    9,
    162,
    0,
    8,
    1,
    0,
    8,
    129,
    0,
    8,
    65,
    0,
    9,
    226,
    80,
    7,
    6,
    0,
    8,
    89,
    0,
    8,
    25,
    0,
    9,
    146,
    83,
    7,
    59,
    0,
    8,
    121,
    0,
    8,
    57,
    0,
    9,
    210,
    81,
    7,
    17,
    0,
    8,
    105,
    0,
    8,
    41,
    0,
    9,
    178,
    0,
    8,
    9,
    0,
    8,
    137,
    0,
    8,
    73,
    0,
    9,
    242,
    80,
    7,
    4,
    0,
    8,
    85,
    0,
    8,
    21,
    80,
    8,
    258,
    83,
    7,
    43,
    0,
    8,
    117,
    0,
    8,
    53,
    0,
    9,
    202,
    81,
    7,
    13,
    0,
    8,
    101,
    0,
    8,
    37,
    0,
    9,
    170,
    0,
    8,
    5,
    0,
    8,
    133,
    0,
    8,
    69,
    0,
    9,
    234,
    80,
    7,
    8,
    0,
    8,
    93,
    0,
    8,
    29,
    0,
    9,
    154,
    84,
    7,
    83,
    0,
    8,
    125,
    0,
    8,
    61,
    0,
    9,
    218,
    82,
    7,
    23,
    0,
    8,
    109,
    0,
    8,
    45,
    0,
    9,
    186,
    0,
    8,
    13,
    0,
    8,
    141,
    0,
    8,
    77,
    0,
    9,
    250,
    80,
    7,
    3,
    0,
    8,
    83,
    0,
    8,
    19,
    85,
    8,
    195,
    83,
    7,
    35,
    0,
    8,
    115,
    0,
    8,
    51,
    0,
    9,
    198,
    81,
    7,
    11,
    0,
    8,
    99,
    0,
    8,
    35,
    0,
    9,
    166,
    0,
    8,
    3,
    0,
    8,
    131,
    0,
    8,
    67,
    0,
    9,
    230,
    80,
    7,
    7,
    0,
    8,
    91,
    0,
    8,
    27,
    0,
    9,
    150,
    84,
    7,
    67,
    0,
    8,
    123,
    0,
    8,
    59,
    0,
    9,
    214,
    82,
    7,
    19,
    0,
    8,
    107,
    0,
    8,
    43,
    0,
    9,
    182,
    0,
    8,
    11,
    0,
    8,
    139,
    0,
    8,
    75,
    0,
    9,
    246,
    80,
    7,
    5,
    0,
    8,
    87,
    0,
    8,
    23,
    192,
    8,
    0,
    83,
    7,
    51,
    0,
    8,
    119,
    0,
    8,
    55,
    0,
    9,
    206,
    81,
    7,
    15,
    0,
    8,
    103,
    0,
    8,
    39,
    0,
    9,
    174,
    0,
    8,
    7,
    0,
    8,
    135,
    0,
    8,
    71,
    0,
    9,
    238,
    80,
    7,
    9,
    0,
    8,
    95,
    0,
    8,
    31,
    0,
    9,
    158,
    84,
    7,
    99,
    0,
    8,
    127,
    0,
    8,
    63,
    0,
    9,
    222,
    82,
    7,
    27,
    0,
    8,
    111,
    0,
    8,
    47,
    0,
    9,
    190,
    0,
    8,
    15,
    0,
    8,
    143,
    0,
    8,
    79,
    0,
    9,
    254,
    96,
    7,
    256,
    0,
    8,
    80,
    0,
    8,
    16,
    84,
    8,
    115,
    82,
    7,
    31,
    0,
    8,
    112,
    0,
    8,
    48,
    0,
    9,
    193,
    80,
    7,
    10,
    0,
    8,
    96,
    0,
    8,
    32,
    0,
    9,
    161,
    0,
    8,
    0,
    0,
    8,
    128,
    0,
    8,
    64,
    0,
    9,
    225,
    80,
    7,
    6,
    0,
    8,
    88,
    0,
    8,
    24,
    0,
    9,
    145,
    83,
    7,
    59,
    0,
    8,
    120,
    0,
    8,
    56,
    0,
    9,
    209,
    81,
    7,
    17,
    0,
    8,
    104,
    0,
    8,
    40,
    0,
    9,
    177,
    0,
    8,
    8,
    0,
    8,
    136,
    0,
    8,
    72,
    0,
    9,
    241,
    80,
    7,
    4,
    0,
    8,
    84,
    0,
    8,
    20,
    85,
    8,
    227,
    83,
    7,
    43,
    0,
    8,
    116,
    0,
    8,
    52,
    0,
    9,
    201,
    81,
    7,
    13,
    0,
    8,
    100,
    0,
    8,
    36,
    0,
    9,
    169,
    0,
    8,
    4,
    0,
    8,
    132,
    0,
    8,
    68,
    0,
    9,
    233,
    80,
    7,
    8,
    0,
    8,
    92,
    0,
    8,
    28,
    0,
    9,
    153,
    84,
    7,
    83,
    0,
    8,
    124,
    0,
    8,
    60,
    0,
    9,
    217,
    82,
    7,
    23,
    0,
    8,
    108,
    0,
    8,
    44,
    0,
    9,
    185,
    0,
    8,
    12,
    0,
    8,
    140,
    0,
    8,
    76,
    0,
    9,
    249,
    80,
    7,
    3,
    0,
    8,
    82,
    0,
    8,
    18,
    85,
    8,
    163,
    83,
    7,
    35,
    0,
    8,
    114,
    0,
    8,
    50,
    0,
    9,
    197,
    81,
    7,
    11,
    0,
    8,
    98,
    0,
    8,
    34,
    0,
    9,
    165,
    0,
    8,
    2,
    0,
    8,
    130,
    0,
    8,
    66,
    0,
    9,
    229,
    80,
    7,
    7,
    0,
    8,
    90,
    0,
    8,
    26,
    0,
    9,
    149,
    84,
    7,
    67,
    0,
    8,
    122,
    0,
    8,
    58,
    0,
    9,
    213,
    82,
    7,
    19,
    0,
    8,
    106,
    0,
    8,
    42,
    0,
    9,
    181,
    0,
    8,
    10,
    0,
    8,
    138,
    0,
    8,
    74,
    0,
    9,
    245,
    80,
    7,
    5,
    0,
    8,
    86,
    0,
    8,
    22,
    192,
    8,
    0,
    83,
    7,
    51,
    0,
    8,
    118,
    0,
    8,
    54,
    0,
    9,
    205,
    81,
    7,
    15,
    0,
    8,
    102,
    0,
    8,
    38,
    0,
    9,
    173,
    0,
    8,
    6,
    0,
    8,
    134,
    0,
    8,
    70,
    0,
    9,
    237,
    80,
    7,
    9,
    0,
    8,
    94,
    0,
    8,
    30,
    0,
    9,
    157,
    84,
    7,
    99,
    0,
    8,
    126,
    0,
    8,
    62,
    0,
    9,
    221,
    82,
    7,
    27,
    0,
    8,
    110,
    0,
    8,
    46,
    0,
    9,
    189,
    0,
    8,
    14,
    0,
    8,
    142,
    0,
    8,
    78,
    0,
    9,
    253,
    96,
    7,
    256,
    0,
    8,
    81,
    0,
    8,
    17,
    85,
    8,
    131,
    82,
    7,
    31,
    0,
    8,
    113,
    0,
    8,
    49,
    0,
    9,
    195,
    80,
    7,
    10,
    0,
    8,
    97,
    0,
    8,
    33,
    0,
    9,
    163,
    0,
    8,
    1,
    0,
    8,
    129,
    0,
    8,
    65,
    0,
    9,
    227,
    80,
    7,
    6,
    0,
    8,
    89,
    0,
    8,
    25,
    0,
    9,
    147,
    83,
    7,
    59,
    0,
    8,
    121,
    0,
    8,
    57,
    0,
    9,
    211,
    81,
    7,
    17,
    0,
    8,
    105,
    0,
    8,
    41,
    0,
    9,
    179,
    0,
    8,
    9,
    0,
    8,
    137,
    0,
    8,
    73,
    0,
    9,
    243,
    80,
    7,
    4,
    0,
    8,
    85,
    0,
    8,
    21,
    80,
    8,
    258,
    83,
    7,
    43,
    0,
    8,
    117,
    0,
    8,
    53,
    0,
    9,
    203,
    81,
    7,
    13,
    0,
    8,
    101,
    0,
    8,
    37,
    0,
    9,
    171,
    0,
    8,
    5,
    0,
    8,
    133,
    0,
    8,
    69,
    0,
    9,
    235,
    80,
    7,
    8,
    0,
    8,
    93,
    0,
    8,
    29,
    0,
    9,
    155,
    84,
    7,
    83,
    0,
    8,
    125,
    0,
    8,
    61,
    0,
    9,
    219,
    82,
    7,
    23,
    0,
    8,
    109,
    0,
    8,
    45,
    0,
    9,
    187,
    0,
    8,
    13,
    0,
    8,
    141,
    0,
    8,
    77,
    0,
    9,
    251,
    80,
    7,
    3,
    0,
    8,
    83,
    0,
    8,
    19,
    85,
    8,
    195,
    83,
    7,
    35,
    0,
    8,
    115,
    0,
    8,
    51,
    0,
    9,
    199,
    81,
    7,
    11,
    0,
    8,
    99,
    0,
    8,
    35,
    0,
    9,
    167,
    0,
    8,
    3,
    0,
    8,
    131,
    0,
    8,
    67,
    0,
    9,
    231,
    80,
    7,
    7,
    0,
    8,
    91,
    0,
    8,
    27,
    0,
    9,
    151,
    84,
    7,
    67,
    0,
    8,
    123,
    0,
    8,
    59,
    0,
    9,
    215,
    82,
    7,
    19,
    0,
    8,
    107,
    0,
    8,
    43,
    0,
    9,
    183,
    0,
    8,
    11,
    0,
    8,
    139,
    0,
    8,
    75,
    0,
    9,
    247,
    80,
    7,
    5,
    0,
    8,
    87,
    0,
    8,
    23,
    192,
    8,
    0,
    83,
    7,
    51,
    0,
    8,
    119,
    0,
    8,
    55,
    0,
    9,
    207,
    81,
    7,
    15,
    0,
    8,
    103,
    0,
    8,
    39,
    0,
    9,
    175,
    0,
    8,
    7,
    0,
    8,
    135,
    0,
    8,
    71,
    0,
    9,
    239,
    80,
    7,
    9,
    0,
    8,
    95,
    0,
    8,
    31,
    0,
    9,
    159,
    84,
    7,
    99,
    0,
    8,
    127,
    0,
    8,
    63,
    0,
    9,
    223,
    82,
    7,
    27,
    0,
    8,
    111,
    0,
    8,
    47,
    0,
    9,
    191,
    0,
    8,
    15,
    0,
    8,
    143,
    0,
    8,
    79,
    0,
    9,
    255
];
const fixed_td = [
    80,
    5,
    1,
    87,
    5,
    257,
    83,
    5,
    17,
    91,
    5,
    4097,
    81,
    5,
    5,
    89,
    5,
    1025,
    85,
    5,
    65,
    93,
    5,
    16385,
    80,
    5,
    3,
    88,
    5,
    513,
    84,
    5,
    33,
    92,
    5,
    8193,
    82,
    5,
    9,
    90,
    5,
    2049,
    86,
    5,
    129,
    192,
    5,
    24577,
    80,
    5,
    2,
    87,
    5,
    385,
    83,
    5,
    25,
    91,
    5,
    6145,
    81,
    5,
    7,
    89,
    5,
    1537,
    85,
    5,
    97,
    93,
    5,
    24577,
    80,
    5,
    4,
    88,
    5,
    769,
    84,
    5,
    49,
    92,
    5,
    12289,
    82,
    5,
    13,
    90,
    5,
    3073,
    86,
    5,
    193,
    192,
    5,
    24577
];
const cplens = [
    3,
    4,
    5,
    6,
    7,
    8,
    9,
    10,
    11,
    13,
    15,
    17,
    19,
    23,
    27,
    31,
    35,
    43,
    51,
    59,
    67,
    83,
    99,
    115,
    131,
    163,
    195,
    227,
    258,
    0,
    0
];
const cplext = [
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    1,
    1,
    1,
    1,
    2,
    2,
    2,
    2,
    3,
    3,
    3,
    3,
    4,
    4,
    4,
    4,
    5,
    5,
    5,
    5,
    0,
    112,
    112
];
const cpdist = [
    1,
    2,
    3,
    4,
    5,
    7,
    9,
    13,
    17,
    25,
    33,
    49,
    65,
    97,
    129,
    193,
    257,
    385,
    513,
    769,
    1025,
    1537,
    2049,
    3073,
    4097,
    6145,
    8193,
    12289,
    16385,
    24577
];
const cpdext = [
    0,
    0,
    0,
    0,
    1,
    1,
    2,
    2,
    3,
    3,
    4,
    4,
    5,
    5,
    6,
    6,
    7,
    7,
    8,
    8,
    9,
    9,
    10,
    10,
    11,
    11,
    12,
    12,
    13,
    13
];
const BMAX = 15;
function InfTree() {
    const that = this;
    let hn;
    let v;
    let c;
    let r;
    let u;
    let x;
    function huft_build(b, bindex, n, s, d, e, t, m, hp, hn, v) {
        let a;
        let f;
        let g;
        let h;
        let i;
        let j;
        let k;
        let l;
        let mask;
        let p;
        let q;
        let w;
        let xp;
        let y;
        let z;
        p = 0;
        i = n;
        do {
            c[b[bindex + p]]++;
            p++;
            i--;
        }while (i !== 0)
        if (c[0] == n) {
            t[0] = -1;
            m[0] = 0;
            return 0;
        }
        l = m[0];
        for(j = 1; j <= 15; j++)if (c[j] !== 0) break;
        k = j;
        if (l < j) {
            l = j;
        }
        for(i = BMAX; i !== 0; i--){
            if (c[i] !== 0) break;
        }
        g = i;
        if (l > i) {
            l = i;
        }
        m[0] = l;
        for(y = 1 << j; j < i; j++, y <<= 1){
            if ((y -= c[j]) < 0) {
                return Z_DATA_ERROR1;
            }
        }
        if ((y -= c[i]) < 0) {
            return Z_DATA_ERROR1;
        }
        c[i] += y;
        x[1] = j = 0;
        p = 1;
        xp = 2;
        while(--i !== 0){
            x[xp] = j += c[p];
            xp++;
            p++;
        }
        i = 0;
        p = 0;
        do {
            if ((j = b[bindex + p]) !== 0) {
                v[x[j]++] = i;
            }
            p++;
        }while (++i < n)
        n = x[g];
        x[0] = i = 0;
        p = 0;
        h = -1;
        w = -l;
        u[0] = 0;
        q = 0;
        z = 0;
        for(; k <= g; k++){
            a = c[k];
            while(a-- !== 0){
                while(k > w + l){
                    h++;
                    w += l;
                    z = g - w;
                    z = z > l ? l : z;
                    if ((f = 1 << (j = k - w)) > a + 1) {
                        f -= a + 1;
                        xp = k;
                        if (j < z) {
                            while(++j < z){
                                if ((f <<= 1) <= c[++xp]) break;
                                f -= c[xp];
                            }
                        }
                    }
                    z = 1 << j;
                    if (hn[0] + z > 1440) {
                        return Z_DATA_ERROR1;
                    }
                    u[h] = q = hn[0];
                    hn[0] += z;
                    if (h !== 0) {
                        x[h] = i;
                        r[0] = j;
                        r[1] = l;
                        j = i >>> w - l;
                        r[2] = q - u[h - 1] - j;
                        hp.set(r, (u[h - 1] + j) * 3);
                    } else {
                        t[0] = q;
                    }
                }
                r[1] = k - w;
                if (p >= n) {
                    r[0] = 128 + 64;
                } else if (v[p] < s) {
                    r[0] = v[p] < 256 ? 0 : 32 + 64;
                    r[2] = v[p++];
                } else {
                    r[0] = e[v[p] - s] + 16 + 64;
                    r[2] = d[v[p++] - s];
                }
                f = 1 << k - w;
                for(j = i >>> w; j < z; j += f){
                    hp.set(r, (q + j) * 3);
                }
                for(j = 1 << k - 1; (i & j) !== 0; j >>>= 1){
                    i ^= j;
                }
                i ^= j;
                mask = (1 << w) - 1;
                while((i & mask) != x[h]){
                    h--;
                    w -= l;
                    mask = (1 << w) - 1;
                }
            }
        }
        return y !== 0 && g != 1 ? Z_BUF_ERROR1 : 0;
    }
    function initWorkArea(vsize) {
        let i;
        if (!hn) {
            hn = [];
            v = [];
            c = new Int32Array(BMAX + 1);
            r = [];
            u = new Int32Array(BMAX);
            x = new Int32Array(BMAX + 1);
        }
        if (v.length < vsize) {
            v = [];
        }
        for(i = 0; i < vsize; i++){
            v[i] = 0;
        }
        for(i = 0; i < 15 + 1; i++){
            c[i] = 0;
        }
        for(i = 0; i < 3; i++){
            r[i] = 0;
        }
        u.set(c.subarray(0, 15), 0);
        x.set(c.subarray(0, 15 + 1), 0);
    }
    that.inflate_trees_bits = function(c, bb, tb, hp, z) {
        let result;
        initWorkArea(19);
        hn[0] = 0;
        result = huft_build(c, 0, 19, 19, null, null, tb, bb, hp, hn, v);
        if (result == Z_DATA_ERROR1) {
            z.msg = "oversubscribed dynamic bit lengths tree";
        } else if (result == Z_BUF_ERROR1 || bb[0] === 0) {
            z.msg = "incomplete dynamic bit lengths tree";
            result = Z_DATA_ERROR1;
        }
        return result;
    };
    that.inflate_trees_dynamic = function(nl, nd, c, bl, bd, tl, td, hp, z) {
        let result;
        initWorkArea(288);
        hn[0] = 0;
        result = huft_build(c, 0, nl, 257, cplens, cplext, tl, bl, hp, hn, v);
        if (result != Z_OK1 || bl[0] === 0) {
            if (result == Z_DATA_ERROR1) {
                z.msg = "oversubscribed literal/length tree";
            } else if (result != Z_MEM_ERROR) {
                z.msg = "incomplete literal/length tree";
                result = Z_DATA_ERROR1;
            }
            return result;
        }
        initWorkArea(288);
        result = huft_build(c, nl, nd, 0, cpdist, cpdext, td, bd, hp, hn, v);
        if (result != Z_OK1 || bd[0] === 0 && nl > 257) {
            if (result == Z_DATA_ERROR1) {
                z.msg = "oversubscribed distance tree";
            } else if (result == Z_BUF_ERROR1) {
                z.msg = "incomplete distance tree";
                result = Z_DATA_ERROR1;
            } else if (result != Z_MEM_ERROR) {
                z.msg = "empty distance tree with lengths";
                result = Z_DATA_ERROR1;
            }
            return result;
        }
        return Z_OK1;
    };
}
InfTree.inflate_trees_fixed = function(bl, bd, tl, td) {
    bl[0] = fixed_bl;
    bd[0] = fixed_bd;
    tl[0] = fixed_tl;
    td[0] = fixed_td;
    return Z_OK1;
};
const START = 0;
const LEN = 1;
const LENEXT = 2;
const DIST = 3;
const DISTEXT = 4;
const COPY = 5;
const LIT = 6;
const WASH = 7;
const END = 8;
const BADCODE = 9;
function InfCodes() {
    const that = this;
    let mode;
    let len = 0;
    let tree;
    let tree_index = 0;
    let need = 0;
    let lit = 0;
    let get = 0;
    let dist = 0;
    let lbits = 0;
    let dbits = 0;
    let ltree;
    let ltree_index = 0;
    let dtree;
    let dtree_index = 0;
    function inflate_fast(bl, bd, tl, tl_index, td, td_index, s, z) {
        let t;
        let tp;
        let tp_index;
        let e;
        let b;
        let k;
        let p;
        let n;
        let q;
        let m;
        let ml;
        let md;
        let c;
        let d;
        let r;
        let tp_index_t_3;
        p = z.next_in_index;
        n = z.avail_in;
        b = s.bitb;
        k = s.bitk;
        q = s.write;
        m = q < s.read ? s.read - q - 1 : s.end - q;
        ml = inflate_mask[bl];
        md = inflate_mask[bd];
        do {
            while(k < 20){
                n--;
                b |= (z.read_byte(p++) & 0xff) << k;
                k += 8;
            }
            t = b & ml;
            tp = tl;
            tp_index = tl_index;
            tp_index_t_3 = (tp_index + t) * 3;
            if ((e = tp[tp_index_t_3]) === 0) {
                b >>= tp[tp_index_t_3 + 1];
                k -= tp[tp_index_t_3 + 1];
                s.win[q++] = tp[tp_index_t_3 + 2];
                m--;
                continue;
            }
            do {
                b >>= tp[tp_index_t_3 + 1];
                k -= tp[tp_index_t_3 + 1];
                if ((e & 16) !== 0) {
                    e &= 15;
                    c = tp[tp_index_t_3 + 2] + (b & inflate_mask[e]);
                    b >>= e;
                    k -= e;
                    while(k < 15){
                        n--;
                        b |= (z.read_byte(p++) & 0xff) << k;
                        k += 8;
                    }
                    t = b & md;
                    tp = td;
                    tp_index = td_index;
                    tp_index_t_3 = (tp_index + t) * 3;
                    e = tp[tp_index_t_3];
                    do {
                        b >>= tp[tp_index_t_3 + 1];
                        k -= tp[tp_index_t_3 + 1];
                        if ((e & 16) !== 0) {
                            e &= 15;
                            while(k < e){
                                n--;
                                b |= (z.read_byte(p++) & 0xff) << k;
                                k += 8;
                            }
                            d = tp[tp_index_t_3 + 2] + (b & inflate_mask[e]);
                            b >>= e;
                            k -= e;
                            m -= c;
                            if (q >= d) {
                                r = q - d;
                                if (q - r > 0 && 2 > q - r) {
                                    s.win[q++] = s.win[r++];
                                    s.win[q++] = s.win[r++];
                                    c -= 2;
                                } else {
                                    s.win.set(s.win.subarray(r, r + 2), q);
                                    q += 2;
                                    r += 2;
                                    c -= 2;
                                }
                            } else {
                                r = q - d;
                                do {
                                    r += s.end;
                                }while (r < 0)
                                e = s.end - r;
                                if (c > e) {
                                    c -= e;
                                    if (q - r > 0 && e > q - r) {
                                        do {
                                            s.win[q++] = s.win[r++];
                                        }while (--e !== 0)
                                    } else {
                                        s.win.set(s.win.subarray(r, r + e), q);
                                        q += e;
                                        r += e;
                                        e = 0;
                                    }
                                    r = 0;
                                }
                            }
                            if (q - r > 0 && c > q - r) {
                                do {
                                    s.win[q++] = s.win[r++];
                                }while (--c !== 0)
                            } else {
                                s.win.set(s.win.subarray(r, r + c), q);
                                q += c;
                                r += c;
                                c = 0;
                            }
                            break;
                        } else if ((e & 64) === 0) {
                            t += tp[tp_index_t_3 + 2];
                            t += b & inflate_mask[e];
                            tp_index_t_3 = (tp_index + t) * 3;
                            e = tp[tp_index_t_3];
                        } else {
                            z.msg = "invalid distance code";
                            c = z.avail_in - n;
                            c = k >> 3 < c ? k >> 3 : c;
                            n += c;
                            p -= c;
                            k -= c << 3;
                            s.bitb = b;
                            s.bitk = k;
                            z.avail_in = n;
                            z.total_in += p - z.next_in_index;
                            z.next_in_index = p;
                            s.write = q;
                            return Z_DATA_ERROR1;
                        }
                    }while (true)
                    break;
                }
                if ((e & 64) === 0) {
                    t += tp[tp_index_t_3 + 2];
                    t += b & inflate_mask[e];
                    tp_index_t_3 = (tp_index + t) * 3;
                    if ((e = tp[tp_index_t_3]) === 0) {
                        b >>= tp[tp_index_t_3 + 1];
                        k -= tp[tp_index_t_3 + 1];
                        s.win[q++] = tp[tp_index_t_3 + 2];
                        m--;
                        break;
                    }
                } else if ((e & 32) !== 0) {
                    c = z.avail_in - n;
                    c = k >> 3 < c ? k >> 3 : c;
                    n += c;
                    p -= c;
                    k -= c << 3;
                    s.bitb = b;
                    s.bitk = k;
                    z.avail_in = n;
                    z.total_in += p - z.next_in_index;
                    z.next_in_index = p;
                    s.write = q;
                    return 1;
                } else {
                    z.msg = "invalid literal/length code";
                    c = z.avail_in - n;
                    c = k >> 3 < c ? k >> 3 : c;
                    n += c;
                    p -= c;
                    k -= c << 3;
                    s.bitb = b;
                    s.bitk = k;
                    z.avail_in = n;
                    z.total_in += p - z.next_in_index;
                    z.next_in_index = p;
                    s.write = q;
                    return Z_DATA_ERROR1;
                }
            }while (true)
        }while (m >= 258 && n >= 10)
        c = z.avail_in - n;
        c = k >> 3 < c ? k >> 3 : c;
        n += c;
        p -= c;
        k -= c << 3;
        s.bitb = b;
        s.bitk = k;
        z.avail_in = n;
        z.total_in += p - z.next_in_index;
        z.next_in_index = p;
        s.write = q;
        return 0;
    }
    that.init = function(bl, bd, tl, tl_index, td, td_index) {
        mode = START;
        lbits = bl;
        dbits = bd;
        ltree = tl;
        ltree_index = tl_index;
        dtree = td;
        dtree_index = td_index;
        tree = null;
    };
    that.proc = function(s, z, r) {
        let j;
        let tindex;
        let e;
        let b = 0;
        let k = 0;
        let p = 0;
        let n;
        let q;
        let m;
        let f;
        p = z.next_in_index;
        n = z.avail_in;
        b = s.bitb;
        k = s.bitk;
        q = s.write;
        m = q < s.read ? s.read - q - 1 : s.end - q;
        while(true){
            switch(mode){
                case START:
                    if (m >= 258 && n >= 10) {
                        s.bitb = b;
                        s.bitk = k;
                        z.avail_in = n;
                        z.total_in += p - z.next_in_index;
                        z.next_in_index = p;
                        s.write = q;
                        r = inflate_fast(lbits, dbits, ltree, ltree_index, dtree, dtree_index, s, z);
                        p = z.next_in_index;
                        n = z.avail_in;
                        b = s.bitb;
                        k = s.bitk;
                        q = s.write;
                        m = q < s.read ? s.read - q - 1 : s.end - q;
                        if (r != Z_OK1) {
                            mode = r == Z_STREAM_END1 ? WASH : BADCODE;
                            break;
                        }
                    }
                    need = lbits;
                    tree = ltree;
                    tree_index = ltree_index;
                    mode = LEN;
                case LEN:
                    j = need;
                    while(k < j){
                        if (n !== 0) r = Z_OK1;
                        else {
                            s.bitb = b;
                            s.bitk = k;
                            z.avail_in = n;
                            z.total_in += p - z.next_in_index;
                            z.next_in_index = p;
                            s.write = q;
                            return s.inflate_flush(z, r);
                        }
                        n--;
                        b |= (z.read_byte(p++) & 0xff) << k;
                        k += 8;
                    }
                    tindex = (tree_index + (b & inflate_mask[j])) * 3;
                    b >>>= tree[tindex + 1];
                    k -= tree[tindex + 1];
                    e = tree[tindex];
                    if (e === 0) {
                        lit = tree[tindex + 2];
                        mode = LIT;
                        break;
                    }
                    if ((e & 16) !== 0) {
                        get = e & 15;
                        len = tree[tindex + 2];
                        mode = LENEXT;
                        break;
                    }
                    if ((e & 64) === 0) {
                        need = e;
                        tree_index = tindex / 3 + tree[tindex + 2];
                        break;
                    }
                    if ((e & 32) !== 0) {
                        mode = WASH;
                        break;
                    }
                    mode = BADCODE;
                    z.msg = "invalid literal/length code";
                    r = Z_DATA_ERROR1;
                    s.bitb = b;
                    s.bitk = k;
                    z.avail_in = n;
                    z.total_in += p - z.next_in_index;
                    z.next_in_index = p;
                    s.write = q;
                    return s.inflate_flush(z, r);
                case LENEXT:
                    j = get;
                    while(k < j){
                        if (n !== 0) r = Z_OK1;
                        else {
                            s.bitb = b;
                            s.bitk = k;
                            z.avail_in = n;
                            z.total_in += p - z.next_in_index;
                            z.next_in_index = p;
                            s.write = q;
                            return s.inflate_flush(z, r);
                        }
                        n--;
                        b |= (z.read_byte(p++) & 0xff) << k;
                        k += 8;
                    }
                    len += b & inflate_mask[j];
                    b >>= j;
                    k -= j;
                    need = dbits;
                    tree = dtree;
                    tree_index = dtree_index;
                    mode = DIST;
                case DIST:
                    j = need;
                    while(k < j){
                        if (n !== 0) r = Z_OK1;
                        else {
                            s.bitb = b;
                            s.bitk = k;
                            z.avail_in = n;
                            z.total_in += p - z.next_in_index;
                            z.next_in_index = p;
                            s.write = q;
                            return s.inflate_flush(z, r);
                        }
                        n--;
                        b |= (z.read_byte(p++) & 0xff) << k;
                        k += 8;
                    }
                    tindex = (tree_index + (b & inflate_mask[j])) * 3;
                    b >>= tree[tindex + 1];
                    k -= tree[tindex + 1];
                    e = tree[tindex];
                    if ((e & 16) !== 0) {
                        get = e & 15;
                        dist = tree[tindex + 2];
                        mode = DISTEXT;
                        break;
                    }
                    if ((e & 64) === 0) {
                        need = e;
                        tree_index = tindex / 3 + tree[tindex + 2];
                        break;
                    }
                    mode = BADCODE;
                    z.msg = "invalid distance code";
                    r = Z_DATA_ERROR1;
                    s.bitb = b;
                    s.bitk = k;
                    z.avail_in = n;
                    z.total_in += p - z.next_in_index;
                    z.next_in_index = p;
                    s.write = q;
                    return s.inflate_flush(z, r);
                case DISTEXT:
                    j = get;
                    while(k < j){
                        if (n !== 0) r = Z_OK1;
                        else {
                            s.bitb = b;
                            s.bitk = k;
                            z.avail_in = n;
                            z.total_in += p - z.next_in_index;
                            z.next_in_index = p;
                            s.write = q;
                            return s.inflate_flush(z, r);
                        }
                        n--;
                        b |= (z.read_byte(p++) & 0xff) << k;
                        k += 8;
                    }
                    dist += b & inflate_mask[j];
                    b >>= j;
                    k -= j;
                    mode = COPY;
                case COPY:
                    f = q - dist;
                    while(f < 0){
                        f += s.end;
                    }
                    while(len !== 0){
                        if (m === 0) {
                            if (q == s.end && s.read !== 0) {
                                q = 0;
                                m = q < s.read ? s.read - q - 1 : s.end - q;
                            }
                            if (m === 0) {
                                s.write = q;
                                r = s.inflate_flush(z, r);
                                q = s.write;
                                m = q < s.read ? s.read - q - 1 : s.end - q;
                                if (q == s.end && s.read !== 0) {
                                    q = 0;
                                    m = q < s.read ? s.read - q - 1 : s.end - q;
                                }
                                if (m === 0) {
                                    s.bitb = b;
                                    s.bitk = k;
                                    z.avail_in = n;
                                    z.total_in += p - z.next_in_index;
                                    z.next_in_index = p;
                                    s.write = q;
                                    return s.inflate_flush(z, r);
                                }
                            }
                        }
                        s.win[q++] = s.win[f++];
                        m--;
                        if (f == s.end) f = 0;
                        len--;
                    }
                    mode = START;
                    break;
                case LIT:
                    if (m === 0) {
                        if (q == s.end && s.read !== 0) {
                            q = 0;
                            m = q < s.read ? s.read - q - 1 : s.end - q;
                        }
                        if (m === 0) {
                            s.write = q;
                            r = s.inflate_flush(z, r);
                            q = s.write;
                            m = q < s.read ? s.read - q - 1 : s.end - q;
                            if (q == s.end && s.read !== 0) {
                                q = 0;
                                m = q < s.read ? s.read - q - 1 : s.end - q;
                            }
                            if (m === 0) {
                                s.bitb = b;
                                s.bitk = k;
                                z.avail_in = n;
                                z.total_in += p - z.next_in_index;
                                z.next_in_index = p;
                                s.write = q;
                                return s.inflate_flush(z, r);
                            }
                        }
                    }
                    r = Z_OK1;
                    s.win[q++] = lit;
                    m--;
                    mode = START;
                    break;
                case WASH:
                    if (k > 7) {
                        k -= 8;
                        n++;
                        p--;
                    }
                    s.write = q;
                    r = s.inflate_flush(z, r);
                    q = s.write;
                    m = q < s.read ? s.read - q - 1 : s.end - q;
                    if (s.read != s.write) {
                        s.bitb = b;
                        s.bitk = k;
                        z.avail_in = n;
                        z.total_in += p - z.next_in_index;
                        z.next_in_index = p;
                        s.write = q;
                        return s.inflate_flush(z, r);
                    }
                    mode = END;
                case END:
                    r = Z_STREAM_END1;
                    s.bitb = b;
                    s.bitk = k;
                    z.avail_in = n;
                    z.total_in += p - z.next_in_index;
                    z.next_in_index = p;
                    s.write = q;
                    return s.inflate_flush(z, r);
                case BADCODE:
                    r = Z_DATA_ERROR1;
                    s.bitb = b;
                    s.bitk = k;
                    z.avail_in = n;
                    z.total_in += p - z.next_in_index;
                    z.next_in_index = p;
                    s.write = q;
                    return s.inflate_flush(z, r);
                default:
                    r = Z_STREAM_ERROR1;
                    s.bitb = b;
                    s.bitk = k;
                    z.avail_in = n;
                    z.total_in += p - z.next_in_index;
                    z.next_in_index = p;
                    s.write = q;
                    return s.inflate_flush(z, r);
            }
        }
    };
    that.free = function() {};
}
const border = [
    16,
    17,
    18,
    0,
    8,
    7,
    9,
    6,
    10,
    5,
    11,
    4,
    12,
    3,
    13,
    2,
    14,
    1,
    15
];
const TYPE = 0;
const LENS = 1;
const STORED1 = 2;
const TABLE = 3;
const BTREE = 4;
const DTREE = 5;
const CODES = 6;
const DRY = 7;
const DONELOCKS = 8;
const BADBLOCKS = 9;
function InfBlocks(z, w) {
    const that = this;
    let mode = 0;
    let left = 0;
    let table = 0;
    let index = 0;
    let blens;
    const bb = [
        0
    ];
    const tb = [
        0
    ];
    const codes = new InfCodes();
    let last = 0;
    let hufts = new Int32Array(1440 * 3);
    const check = 0;
    const inftree = new InfTree();
    that.bitk = 0;
    that.bitb = 0;
    that.win = new Uint8Array(w);
    that.end = w;
    that.read = 0;
    that.write = 0;
    that.reset = function(z, c) {
        if (c) c[0] = check;
        if (mode == CODES) {
            codes.free(z);
        }
        mode = TYPE;
        that.bitk = 0;
        that.bitb = 0;
        that.read = that.write = 0;
    };
    that.reset(z, null);
    that.inflate_flush = function(z, r) {
        let n;
        let p;
        let q;
        p = z.next_out_index;
        q = that.read;
        n = (q <= that.write ? that.write : that.end) - q;
        if (n > z.avail_out) n = z.avail_out;
        if (n !== 0 && r == Z_BUF_ERROR1) r = Z_OK1;
        z.avail_out -= n;
        z.total_out += n;
        z.next_out.set(that.win.subarray(q, q + n), p);
        p += n;
        q += n;
        if (q == that.end) {
            q = 0;
            if (that.write == that.end) that.write = 0;
            n = that.write - q;
            if (n > z.avail_out) n = z.avail_out;
            if (n !== 0 && r == Z_BUF_ERROR1) r = Z_OK1;
            z.avail_out -= n;
            z.total_out += n;
            z.next_out.set(that.win.subarray(q, q + n), p);
            p += n;
            q += n;
        }
        z.next_out_index = p;
        that.read = q;
        return r;
    };
    that.proc = function(z, r) {
        let t;
        let b;
        let k;
        let p;
        let n;
        let q;
        let m;
        let i;
        p = z.next_in_index;
        n = z.avail_in;
        b = that.bitb;
        k = that.bitk;
        q = that.write;
        m = q < that.read ? that.read - q - 1 : that.end - q;
        while(true){
            let bl, bd, tl, td, bl_, bd_, tl_, td_;
            switch(mode){
                case TYPE:
                    while(k < 3){
                        if (n !== 0) {
                            r = Z_OK1;
                        } else {
                            that.bitb = b;
                            that.bitk = k;
                            z.avail_in = n;
                            z.total_in += p - z.next_in_index;
                            z.next_in_index = p;
                            that.write = q;
                            return that.inflate_flush(z, r);
                        }
                        n--;
                        b |= (z.read_byte(p++) & 0xff) << k;
                        k += 8;
                    }
                    t = b & 7;
                    last = t & 1;
                    switch(t >>> 1){
                        case 0:
                            b >>>= 3;
                            k -= 3;
                            t = k & 7;
                            b >>>= t;
                            k -= t;
                            mode = LENS;
                            break;
                        case 1:
                            bl = [];
                            bd = [];
                            tl = [
                                []
                            ];
                            td = [
                                []
                            ];
                            InfTree.inflate_trees_fixed(bl, bd, tl, td);
                            codes.init(bl[0], bd[0], tl[0], 0, td[0], 0);
                            b >>>= 3;
                            k -= 3;
                            mode = CODES;
                            break;
                        case 2:
                            b >>>= 3;
                            k -= 3;
                            mode = TABLE;
                            break;
                        case 3:
                            b >>>= 3;
                            k -= 3;
                            mode = BADBLOCKS;
                            z.msg = "invalid block type";
                            r = Z_DATA_ERROR1;
                            that.bitb = b;
                            that.bitk = k;
                            z.avail_in = n;
                            z.total_in += p - z.next_in_index;
                            z.next_in_index = p;
                            that.write = q;
                            return that.inflate_flush(z, r);
                    }
                    break;
                case LENS:
                    while(k < 32){
                        if (n !== 0) {
                            r = Z_OK1;
                        } else {
                            that.bitb = b;
                            that.bitk = k;
                            z.avail_in = n;
                            z.total_in += p - z.next_in_index;
                            z.next_in_index = p;
                            that.write = q;
                            return that.inflate_flush(z, r);
                        }
                        n--;
                        b |= (z.read_byte(p++) & 0xff) << k;
                        k += 8;
                    }
                    if ((~b >>> 16 & 0xffff) != (b & 0xffff)) {
                        mode = BADBLOCKS;
                        z.msg = "invalid stored block lengths";
                        r = Z_DATA_ERROR1;
                        that.bitb = b;
                        that.bitk = k;
                        z.avail_in = n;
                        z.total_in += p - z.next_in_index;
                        z.next_in_index = p;
                        that.write = q;
                        return that.inflate_flush(z, r);
                    }
                    left = b & 0xffff;
                    b = k = 0;
                    mode = left !== 0 ? STORED1 : last !== 0 ? DRY : TYPE;
                    break;
                case STORED1:
                    if (n === 0) {
                        that.bitb = b;
                        that.bitk = k;
                        z.avail_in = n;
                        z.total_in += p - z.next_in_index;
                        z.next_in_index = p;
                        that.write = q;
                        return that.inflate_flush(z, r);
                    }
                    if (m === 0) {
                        if (q == that.end && that.read !== 0) {
                            q = 0;
                            m = q < that.read ? that.read - q - 1 : that.end - q;
                        }
                        if (m === 0) {
                            that.write = q;
                            r = that.inflate_flush(z, r);
                            q = that.write;
                            m = q < that.read ? that.read - q - 1 : that.end - q;
                            if (q == that.end && that.read !== 0) {
                                q = 0;
                                m = q < that.read ? that.read - q - 1 : that.end - q;
                            }
                            if (m === 0) {
                                that.bitb = b;
                                that.bitk = k;
                                z.avail_in = n;
                                z.total_in += p - z.next_in_index;
                                z.next_in_index = p;
                                that.write = q;
                                return that.inflate_flush(z, r);
                            }
                        }
                    }
                    r = Z_OK1;
                    t = left;
                    if (t > n) t = n;
                    if (t > m) t = m;
                    that.win.set(z.read_buf(p, t), q);
                    p += t;
                    n -= t;
                    q += t;
                    m -= t;
                    if ((left -= t) !== 0) break;
                    mode = last !== 0 ? DRY : TYPE;
                    break;
                case TABLE:
                    while(k < 14){
                        if (n !== 0) {
                            r = Z_OK1;
                        } else {
                            that.bitb = b;
                            that.bitk = k;
                            z.avail_in = n;
                            z.total_in += p - z.next_in_index;
                            z.next_in_index = p;
                            that.write = q;
                            return that.inflate_flush(z, r);
                        }
                        n--;
                        b |= (z.read_byte(p++) & 0xff) << k;
                        k += 8;
                    }
                    table = t = b & 0x3fff;
                    if ((t & 0x1f) > 29 || (t >> 5 & 0x1f) > 29) {
                        mode = BADBLOCKS;
                        z.msg = "too many length or distance symbols";
                        r = Z_DATA_ERROR1;
                        that.bitb = b;
                        that.bitk = k;
                        z.avail_in = n;
                        z.total_in += p - z.next_in_index;
                        z.next_in_index = p;
                        that.write = q;
                        return that.inflate_flush(z, r);
                    }
                    t = 258 + (t & 0x1f) + (t >> 5 & 0x1f);
                    if (!blens || blens.length < t) {
                        blens = [];
                    } else {
                        for(i = 0; i < t; i++){
                            blens[i] = 0;
                        }
                    }
                    b >>>= 14;
                    k -= 14;
                    index = 0;
                    mode = BTREE;
                case BTREE:
                    while(index < 4 + (table >>> 10)){
                        while(k < 3){
                            if (n !== 0) {
                                r = Z_OK1;
                            } else {
                                that.bitb = b;
                                that.bitk = k;
                                z.avail_in = n;
                                z.total_in += p - z.next_in_index;
                                z.next_in_index = p;
                                that.write = q;
                                return that.inflate_flush(z, r);
                            }
                            n--;
                            b |= (z.read_byte(p++) & 0xff) << k;
                            k += 8;
                        }
                        blens[border[index++]] = b & 7;
                        b >>>= 3;
                        k -= 3;
                    }
                    while(index < 19){
                        blens[border[index++]] = 0;
                    }
                    bb[0] = 7;
                    t = inftree.inflate_trees_bits(blens, bb, tb, hufts, z);
                    if (t != Z_OK1) {
                        r = t;
                        if (r == Z_DATA_ERROR1) {
                            blens = null;
                            mode = BADBLOCKS;
                        }
                        that.bitb = b;
                        that.bitk = k;
                        z.avail_in = n;
                        z.total_in += p - z.next_in_index;
                        z.next_in_index = p;
                        that.write = q;
                        return that.inflate_flush(z, r);
                    }
                    index = 0;
                    mode = DTREE;
                case DTREE:
                    while(true){
                        t = table;
                        if (index >= 258 + (t & 0x1f) + (t >> 5 & 0x1f)) {
                            break;
                        }
                        let j, c;
                        t = bb[0];
                        while(k < t){
                            if (n !== 0) {
                                r = Z_OK1;
                            } else {
                                that.bitb = b;
                                that.bitk = k;
                                z.avail_in = n;
                                z.total_in += p - z.next_in_index;
                                z.next_in_index = p;
                                that.write = q;
                                return that.inflate_flush(z, r);
                            }
                            n--;
                            b |= (z.read_byte(p++) & 0xff) << k;
                            k += 8;
                        }
                        t = hufts[(tb[0] + (b & inflate_mask[t])) * 3 + 1];
                        c = hufts[(tb[0] + (b & inflate_mask[t])) * 3 + 2];
                        if (c < 16) {
                            b >>>= t;
                            k -= t;
                            blens[index++] = c;
                        } else {
                            i = c == 18 ? 7 : c - 14;
                            j = c == 18 ? 11 : 3;
                            while(k < t + i){
                                if (n !== 0) {
                                    r = Z_OK1;
                                } else {
                                    that.bitb = b;
                                    that.bitk = k;
                                    z.avail_in = n;
                                    z.total_in += p - z.next_in_index;
                                    z.next_in_index = p;
                                    that.write = q;
                                    return that.inflate_flush(z, r);
                                }
                                n--;
                                b |= (z.read_byte(p++) & 0xff) << k;
                                k += 8;
                            }
                            b >>>= t;
                            k -= t;
                            j += b & inflate_mask[i];
                            b >>>= i;
                            k -= i;
                            i = index;
                            t = table;
                            if (i + j > 258 + (t & 0x1f) + (t >> 5 & 0x1f) || c == 16 && i < 1) {
                                blens = null;
                                mode = BADBLOCKS;
                                z.msg = "invalid bit length repeat";
                                r = Z_DATA_ERROR1;
                                that.bitb = b;
                                that.bitk = k;
                                z.avail_in = n;
                                z.total_in += p - z.next_in_index;
                                z.next_in_index = p;
                                that.write = q;
                                return that.inflate_flush(z, r);
                            }
                            c = c == 16 ? blens[i - 1] : 0;
                            do {
                                blens[i++] = c;
                            }while (--j !== 0)
                            index = i;
                        }
                    }
                    tb[0] = -1;
                    bl_ = [];
                    bd_ = [];
                    tl_ = [];
                    td_ = [];
                    bl_[0] = 9;
                    bd_[0] = 6;
                    t = table;
                    t = inftree.inflate_trees_dynamic(257 + (t & 0x1f), 1 + (t >> 5 & 0x1f), blens, bl_, bd_, tl_, td_, hufts, z);
                    if (t != Z_OK1) {
                        if (t == Z_DATA_ERROR1) {
                            blens = null;
                            mode = BADBLOCKS;
                        }
                        r = t;
                        that.bitb = b;
                        that.bitk = k;
                        z.avail_in = n;
                        z.total_in += p - z.next_in_index;
                        z.next_in_index = p;
                        that.write = q;
                        return that.inflate_flush(z, r);
                    }
                    codes.init(bl_[0], bd_[0], hufts, tl_[0], hufts, td_[0]);
                    mode = CODES;
                case CODES:
                    that.bitb = b;
                    that.bitk = k;
                    z.avail_in = n;
                    z.total_in += p - z.next_in_index;
                    z.next_in_index = p;
                    that.write = q;
                    if ((r = codes.proc(that, z, r)) != Z_STREAM_END1) {
                        return that.inflate_flush(z, r);
                    }
                    r = Z_OK1;
                    codes.free(z);
                    p = z.next_in_index;
                    n = z.avail_in;
                    b = that.bitb;
                    k = that.bitk;
                    q = that.write;
                    m = q < that.read ? that.read - q - 1 : that.end - q;
                    if (last === 0) {
                        mode = TYPE;
                        break;
                    }
                    mode = DRY;
                case DRY:
                    that.write = q;
                    r = that.inflate_flush(z, r);
                    q = that.write;
                    m = q < that.read ? that.read - q - 1 : that.end - q;
                    if (that.read != that.write) {
                        that.bitb = b;
                        that.bitk = k;
                        z.avail_in = n;
                        z.total_in += p - z.next_in_index;
                        z.next_in_index = p;
                        that.write = q;
                        return that.inflate_flush(z, r);
                    }
                    mode = DONELOCKS;
                case DONELOCKS:
                    r = Z_STREAM_END1;
                    that.bitb = b;
                    that.bitk = k;
                    z.avail_in = n;
                    z.total_in += p - z.next_in_index;
                    z.next_in_index = p;
                    that.write = q;
                    return that.inflate_flush(z, r);
                case BADBLOCKS:
                    r = Z_DATA_ERROR1;
                    that.bitb = b;
                    that.bitk = k;
                    z.avail_in = n;
                    z.total_in += p - z.next_in_index;
                    z.next_in_index = p;
                    that.write = q;
                    return that.inflate_flush(z, r);
                default:
                    r = Z_STREAM_ERROR1;
                    that.bitb = b;
                    that.bitk = k;
                    z.avail_in = n;
                    z.total_in += p - z.next_in_index;
                    z.next_in_index = p;
                    that.write = q;
                    return that.inflate_flush(z, r);
            }
        }
    };
    that.free = function(z) {
        that.reset(z, null);
        that.win = null;
        hufts = null;
    };
    that.set_dictionary = function(d, start, n) {
        that.win.set(d.subarray(start, start + n), 0);
        that.read = that.write = n;
    };
    that.sync_point = function() {
        return mode == LENS ? 1 : 0;
    };
}
const PRESET_DICT1 = 0x20;
const Z_DEFLATED1 = 8;
const METHOD = 0;
const FLAG = 1;
const DICT4 = 2;
const DICT3 = 3;
const DICT2 = 4;
const DICT1 = 5;
const DICT0 = 6;
const BLOCKS = 7;
const DONE = 12;
const BAD = 13;
const mark = [
    0,
    0,
    0xff,
    0xff
];
function Inflate() {
    const that = this;
    that.mode = 0;
    that.method = 0;
    that.was = [
        0
    ];
    that.need = 0;
    that.marker = 0;
    that.wbits = 0;
    function inflateReset(z) {
        if (!z || !z.istate) return Z_STREAM_ERROR1;
        z.total_in = z.total_out = 0;
        z.msg = null;
        z.istate.mode = BLOCKS;
        z.istate.blocks.reset(z, null);
        return 0;
    }
    that.inflateEnd = function(z) {
        if (that.blocks) that.blocks.free(z);
        that.blocks = null;
        return Z_OK1;
    };
    that.inflateInit = function(z, w) {
        z.msg = null;
        that.blocks = null;
        if (w < 8 || w > 15) {
            that.inflateEnd(z);
            return Z_STREAM_ERROR1;
        }
        that.wbits = w;
        z.istate.blocks = new InfBlocks(z, 1 << w);
        inflateReset(z);
        return Z_OK1;
    };
    that.inflate = function(z, f) {
        let r;
        let b;
        if (!z || !z.istate || !z.next_in) return Z_STREAM_ERROR1;
        const istate = z.istate;
        f = f == Z_FINISH1 ? Z_BUF_ERROR1 : Z_OK1;
        r = Z_BUF_ERROR1;
        while(true){
            switch(istate.mode){
                case METHOD:
                    if (z.avail_in === 0) return r;
                    r = f;
                    z.avail_in--;
                    z.total_in++;
                    if (((istate.method = z.read_byte(z.next_in_index++)) & 0xf) != Z_DEFLATED1) {
                        istate.mode = BAD;
                        z.msg = "unknown compression method";
                        istate.marker = 5;
                        break;
                    }
                    if ((istate.method >> 4) + 8 > istate.wbits) {
                        istate.mode = BAD;
                        z.msg = "invalid win size";
                        istate.marker = 5;
                        break;
                    }
                    istate.mode = FLAG;
                case FLAG:
                    if (z.avail_in === 0) return r;
                    r = f;
                    z.avail_in--;
                    z.total_in++;
                    b = z.read_byte(z.next_in_index++) & 0xff;
                    if (((istate.method << 8) + b) % 31 !== 0) {
                        istate.mode = BAD;
                        z.msg = "incorrect header check";
                        istate.marker = 5;
                        break;
                    }
                    if ((b & PRESET_DICT1) === 0) {
                        istate.mode = BLOCKS;
                        break;
                    }
                    istate.mode = DICT4;
                case DICT4:
                    if (z.avail_in === 0) return r;
                    r = f;
                    z.avail_in--;
                    z.total_in++;
                    istate.need = (z.read_byte(z.next_in_index++) & 0xff) << 24 & 0xff000000;
                    istate.mode = DICT3;
                case DICT3:
                    if (z.avail_in === 0) return r;
                    r = f;
                    z.avail_in--;
                    z.total_in++;
                    istate.need += (z.read_byte(z.next_in_index++) & 0xff) << 16 & 0xff0000;
                    istate.mode = DICT2;
                case DICT2:
                    if (z.avail_in === 0) return r;
                    r = f;
                    z.avail_in--;
                    z.total_in++;
                    istate.need += (z.read_byte(z.next_in_index++) & 0xff) << 8 & 0xff00;
                    istate.mode = DICT1;
                case DICT1:
                    if (z.avail_in === 0) return r;
                    r = f;
                    z.avail_in--;
                    z.total_in++;
                    istate.need += z.read_byte(z.next_in_index++) & 0xff;
                    istate.mode = DICT0;
                    return Z_NEED_DICT1;
                case DICT0:
                    istate.mode = BAD;
                    z.msg = "need dictionary";
                    istate.marker = 0;
                    return Z_STREAM_ERROR1;
                case BLOCKS:
                    r = istate.blocks.proc(z, r);
                    if (r == Z_DATA_ERROR1) {
                        istate.mode = BAD;
                        istate.marker = 0;
                        break;
                    }
                    if (r == Z_OK1) {
                        r = f;
                    }
                    if (r != Z_STREAM_END1) {
                        return r;
                    }
                    r = f;
                    istate.blocks.reset(z, istate.was);
                    istate.mode = DONE;
                case DONE:
                    z.avail_in = 0;
                    return Z_STREAM_END1;
                case BAD:
                    return Z_DATA_ERROR1;
                default:
                    return Z_STREAM_ERROR1;
            }
        }
    };
    that.inflateSetDictionary = function(z, dictionary, dictLength) {
        let index = 0, length = dictLength;
        if (!z || !z.istate || z.istate.mode != DICT0) return Z_STREAM_ERROR1;
        const istate = z.istate;
        if (length >= 1 << istate.wbits) {
            length = (1 << istate.wbits) - 1;
            index = dictLength - length;
        }
        istate.blocks.set_dictionary(dictionary, index, length);
        istate.mode = BLOCKS;
        return Z_OK1;
    };
    that.inflateSync = function(z) {
        let n;
        let p;
        let m;
        let r, w;
        if (!z || !z.istate) return Z_STREAM_ERROR1;
        const istate = z.istate;
        if (istate.mode != BAD) {
            istate.mode = BAD;
            istate.marker = 0;
        }
        if ((n = z.avail_in) === 0) return Z_BUF_ERROR1;
        p = z.next_in_index;
        m = istate.marker;
        while(n !== 0 && m < 4){
            if (z.read_byte(p) == mark[m]) {
                m++;
            } else if (z.read_byte(p) !== 0) {
                m = 0;
            } else {
                m = 4 - m;
            }
            p++;
            n--;
        }
        z.total_in += p - z.next_in_index;
        z.next_in_index = p;
        z.avail_in = n;
        istate.marker = m;
        if (m != 4) {
            return Z_DATA_ERROR1;
        }
        r = z.total_in;
        w = z.total_out;
        inflateReset(z);
        z.total_in = r;
        z.total_out = w;
        istate.mode = BLOCKS;
        return Z_OK1;
    };
    that.inflateSyncPoint = function(z) {
        if (!z || !z.istate || !z.istate.blocks) return Z_STREAM_ERROR1;
        return z.istate.blocks.sync_point();
    };
}
function ZStream1() {}
ZStream1.prototype = {
    inflateInit (bits) {
        const that = this;
        that.istate = new Inflate();
        if (!bits) bits = MAX_BITS1;
        return that.istate.inflateInit(that, bits);
    },
    inflate (f) {
        const that = this;
        if (!that.istate) return Z_STREAM_ERROR1;
        return that.istate.inflate(that, f);
    },
    inflateEnd () {
        const that = this;
        if (!that.istate) return Z_STREAM_ERROR1;
        const ret = that.istate.inflateEnd(that);
        that.istate = null;
        return ret;
    },
    inflateSync () {
        const that = this;
        if (!that.istate) return Z_STREAM_ERROR1;
        return that.istate.inflateSync(that);
    },
    inflateSetDictionary (dictionary, dictLength) {
        const that = this;
        if (!that.istate) return Z_STREAM_ERROR1;
        return that.istate.inflateSetDictionary(that, dictionary, dictLength);
    },
    read_byte (start) {
        const that = this;
        return that.next_in[start];
    },
    read_buf (start, size) {
        const that = this;
        return that.next_in.subarray(start, start + size);
    }
};
function ZipInflate(options) {
    const that = this;
    const z = new ZStream1();
    const bufsize = options && options.chunkSize ? Math.floor(options.chunkSize * 2) : 128 * 1024;
    const flush = 0;
    const buf = new Uint8Array(bufsize);
    let nomoreinput = false;
    z.inflateInit();
    z.next_out = buf;
    that.append = function(data, onprogress) {
        const buffers = [];
        let err, array, lastIndex = 0, bufferIndex = 0, bufferSize = 0;
        if (data.length === 0) return;
        z.next_in_index = 0;
        z.next_in = data;
        z.avail_in = data.length;
        do {
            z.next_out_index = 0;
            z.avail_out = bufsize;
            if (z.avail_in === 0 && !nomoreinput) {
                z.next_in_index = 0;
                nomoreinput = true;
            }
            err = z.inflate(flush);
            if (nomoreinput && err === Z_BUF_ERROR1) {
                if (z.avail_in !== 0) throw new Error("inflating: bad input");
            } else if (err !== Z_OK1 && err !== Z_STREAM_END1) throw new Error("inflating: " + z.msg);
            if ((nomoreinput || err === Z_STREAM_END1) && z.avail_in === data.length) throw new Error("inflating: bad input");
            if (z.next_out_index) if (z.next_out_index === bufsize) buffers.push(new Uint8Array(buf));
            else buffers.push(buf.slice(0, z.next_out_index));
            bufferSize += z.next_out_index;
            if (onprogress && z.next_in_index > 0 && z.next_in_index != lastIndex) {
                onprogress(z.next_in_index);
                lastIndex = z.next_in_index;
            }
        }while (z.avail_in > 0 || z.avail_out === 0)
        if (buffers.length > 1) {
            array = new Uint8Array(bufferSize);
            buffers.forEach(function(chunk) {
                array.set(chunk, bufferIndex);
                bufferIndex += chunk.length;
            });
        } else {
            array = buffers[0] || new Uint8Array();
        }
        return array;
    };
    that.flush = function() {
        z.inflateEnd();
    };
}
const END_OF_CENTRAL_DIR_LENGTH = 22;
const ZIP64_END_OF_CENTRAL_DIR_LENGTH = 56;
const DIRECTORY_SIGNATURE = "/";
new Date(2107, 11, 31);
new Date(1980, 0, 1);
const UNDEFINED_VALUE = undefined;
const UNDEFINED_TYPE = "undefined";
const FUNCTION_TYPE = "function";
class StreamAdapter {
    constructor(Codec){
        return class extends TransformStream {
            constructor(_format, options){
                const codec = new Codec(options);
                super({
                    transform (chunk, controller) {
                        controller.enqueue(codec.append(chunk));
                    },
                    flush (controller) {
                        const chunk = codec.flush();
                        if (chunk) {
                            controller.enqueue(chunk);
                        }
                    }
                });
            }
        };
    }
}
let maxWorkers = 2;
try {
    if (typeof navigator != UNDEFINED_TYPE && navigator.hardwareConcurrency) {
        maxWorkers = navigator.hardwareConcurrency;
    }
} catch (_error) {}
const DEFAULT_CONFIGURATION = {
    chunkSize: 512 * 1024,
    maxWorkers,
    terminateWorkerTimeout: 5000,
    useWebWorkers: true,
    useCompressionStream: true,
    workerScripts: UNDEFINED_VALUE,
    CompressionStreamNative: typeof CompressionStream != UNDEFINED_TYPE && CompressionStream,
    DecompressionStreamNative: typeof DecompressionStream != UNDEFINED_TYPE && DecompressionStream
};
const config = Object.assign({}, DEFAULT_CONFIGURATION);
function getConfiguration() {
    return config;
}
function getChunkSize(config) {
    return Math.max(config.chunkSize, 64);
}
function configure(configuration) {
    const { baseURL , chunkSize , maxWorkers , terminateWorkerTimeout , useCompressionStream , useWebWorkers , Deflate , Inflate , CompressionStream: CompressionStream1 , DecompressionStream: DecompressionStream1 , workerScripts  } = configuration;
    setIfDefined("baseURL", baseURL);
    setIfDefined("chunkSize", chunkSize);
    setIfDefined("maxWorkers", maxWorkers);
    setIfDefined("terminateWorkerTimeout", terminateWorkerTimeout);
    setIfDefined("useCompressionStream", useCompressionStream);
    setIfDefined("useWebWorkers", useWebWorkers);
    if (Deflate) {
        config.CompressionStream = new StreamAdapter(Deflate);
    }
    if (Inflate) {
        config.DecompressionStream = new StreamAdapter(Inflate);
    }
    setIfDefined("CompressionStream", CompressionStream1);
    setIfDefined("DecompressionStream", DecompressionStream1);
    if (workerScripts !== UNDEFINED_VALUE) {
        const { deflate , inflate  } = workerScripts;
        if (deflate || inflate) {
            if (!config.workerScripts) {
                config.workerScripts = {};
            }
        }
        if (deflate) {
            if (!Array.isArray(deflate)) {
                throw new Error("workerScripts.deflate must be an array");
            }
            config.workerScripts.deflate = deflate;
        }
        if (inflate) {
            if (!Array.isArray(inflate)) {
                throw new Error("workerScripts.inflate must be an array");
            }
            config.workerScripts.inflate = inflate;
        }
    }
}
function setIfDefined(propertyName, propertyValue) {
    if (propertyValue !== UNDEFINED_VALUE) {
        config[propertyName] = propertyValue;
    }
}
const table = {
    "application": {
        "andrew-inset": "ez",
        "annodex": "anx",
        "atom+xml": "atom",
        "atomcat+xml": "atomcat",
        "atomserv+xml": "atomsrv",
        "bbolin": "lin",
        "cap": [
            "cap",
            "pcap"
        ],
        "cu-seeme": "cu",
        "davmount+xml": "davmount",
        "dsptype": "tsp",
        "ecmascript": [
            "es",
            "ecma"
        ],
        "futuresplash": "spl",
        "hta": "hta",
        "java-archive": "jar",
        "java-serialized-object": "ser",
        "java-vm": "class",
        "javascript": "js",
        "m3g": "m3g",
        "mac-binhex40": "hqx",
        "mathematica": [
            "nb",
            "ma",
            "mb"
        ],
        "msaccess": "mdb",
        "msword": [
            "doc",
            "dot"
        ],
        "mxf": "mxf",
        "oda": "oda",
        "ogg": "ogx",
        "pdf": "pdf",
        "pgp-keys": "key",
        "pgp-signature": [
            "asc",
            "sig"
        ],
        "pics-rules": "prf",
        "postscript": [
            "ps",
            "ai",
            "eps",
            "epsi",
            "epsf",
            "eps2",
            "eps3"
        ],
        "rar": "rar",
        "rdf+xml": "rdf",
        "rss+xml": "rss",
        "rtf": "rtf",
        "smil": [
            "smi",
            "smil"
        ],
        "xhtml+xml": [
            "xhtml",
            "xht"
        ],
        "xml": [
            "xml",
            "xsl",
            "xsd"
        ],
        "xspf+xml": "xspf",
        "zip": "zip",
        "vnd.android.package-archive": "apk",
        "vnd.cinderella": "cdy",
        "vnd.google-earth.kml+xml": "kml",
        "vnd.google-earth.kmz": "kmz",
        "vnd.mozilla.xul+xml": "xul",
        "vnd.ms-excel": [
            "xls",
            "xlb",
            "xlt",
            "xlm",
            "xla",
            "xlc",
            "xlw"
        ],
        "vnd.ms-pki.seccat": "cat",
        "vnd.ms-pki.stl": "stl",
        "vnd.ms-powerpoint": [
            "ppt",
            "pps",
            "pot"
        ],
        "vnd.oasis.opendocument.chart": "odc",
        "vnd.oasis.opendocument.database": "odb",
        "vnd.oasis.opendocument.formula": "odf",
        "vnd.oasis.opendocument.graphics": "odg",
        "vnd.oasis.opendocument.graphics-template": "otg",
        "vnd.oasis.opendocument.image": "odi",
        "vnd.oasis.opendocument.presentation": "odp",
        "vnd.oasis.opendocument.presentation-template": "otp",
        "vnd.oasis.opendocument.spreadsheet": "ods",
        "vnd.oasis.opendocument.spreadsheet-template": "ots",
        "vnd.oasis.opendocument.text": "odt",
        "vnd.oasis.opendocument.text-master": "odm",
        "vnd.oasis.opendocument.text-template": "ott",
        "vnd.oasis.opendocument.text-web": "oth",
        "vnd.openxmlformats-officedocument.spreadsheetml.sheet": "xlsx",
        "vnd.openxmlformats-officedocument.spreadsheetml.template": "xltx",
        "vnd.openxmlformats-officedocument.presentationml.presentation": "pptx",
        "vnd.openxmlformats-officedocument.presentationml.slideshow": "ppsx",
        "vnd.openxmlformats-officedocument.presentationml.template": "potx",
        "vnd.openxmlformats-officedocument.wordprocessingml.document": "docx",
        "vnd.openxmlformats-officedocument.wordprocessingml.template": "dotx",
        "vnd.smaf": "mmf",
        "vnd.stardivision.calc": "sdc",
        "vnd.stardivision.chart": "sds",
        "vnd.stardivision.draw": "sda",
        "vnd.stardivision.impress": "sdd",
        "vnd.stardivision.math": [
            "sdf",
            "smf"
        ],
        "vnd.stardivision.writer": [
            "sdw",
            "vor"
        ],
        "vnd.stardivision.writer-global": "sgl",
        "vnd.sun.xml.calc": "sxc",
        "vnd.sun.xml.calc.template": "stc",
        "vnd.sun.xml.draw": "sxd",
        "vnd.sun.xml.draw.template": "std",
        "vnd.sun.xml.impress": "sxi",
        "vnd.sun.xml.impress.template": "sti",
        "vnd.sun.xml.math": "sxm",
        "vnd.sun.xml.writer": "sxw",
        "vnd.sun.xml.writer.global": "sxg",
        "vnd.sun.xml.writer.template": "stw",
        "vnd.symbian.install": [
            "sis",
            "sisx"
        ],
        "vnd.visio": [
            "vsd",
            "vst",
            "vss",
            "vsw"
        ],
        "vnd.wap.wbxml": "wbxml",
        "vnd.wap.wmlc": "wmlc",
        "vnd.wap.wmlscriptc": "wmlsc",
        "vnd.wordperfect": "wpd",
        "vnd.wordperfect5.1": "wp5",
        "x-123": "wk",
        "x-7z-compressed": "7z",
        "x-abiword": "abw",
        "x-apple-diskimage": "dmg",
        "x-bcpio": "bcpio",
        "x-bittorrent": "torrent",
        "x-cbr": [
            "cbr",
            "cba",
            "cbt",
            "cb7"
        ],
        "x-cbz": "cbz",
        "x-cdf": [
            "cdf",
            "cda"
        ],
        "x-cdlink": "vcd",
        "x-chess-pgn": "pgn",
        "x-cpio": "cpio",
        "x-csh": "csh",
        "x-debian-package": [
            "deb",
            "udeb"
        ],
        "x-director": [
            "dcr",
            "dir",
            "dxr",
            "cst",
            "cct",
            "cxt",
            "w3d",
            "fgd",
            "swa"
        ],
        "x-dms": "dms",
        "x-doom": "wad",
        "x-dvi": "dvi",
        "x-httpd-eruby": "rhtml",
        "x-font": "pcf.Z",
        "x-freemind": "mm",
        "x-gnumeric": "gnumeric",
        "x-go-sgf": "sgf",
        "x-graphing-calculator": "gcf",
        "x-gtar": [
            "gtar",
            "taz"
        ],
        "x-hdf": "hdf",
        "x-httpd-php": [
            "phtml",
            "pht",
            "php"
        ],
        "x-httpd-php-source": "phps",
        "x-httpd-php3": "php3",
        "x-httpd-php3-preprocessed": "php3p",
        "x-httpd-php4": "php4",
        "x-httpd-php5": "php5",
        "x-ica": "ica",
        "x-info": "info",
        "x-internet-signup": [
            "ins",
            "isp"
        ],
        "x-iphone": "iii",
        "x-iso9660-image": "iso",
        "x-java-jnlp-file": "jnlp",
        "x-jmol": "jmz",
        "x-killustrator": "kil",
        "x-koan": [
            "skp",
            "skd",
            "skt",
            "skm"
        ],
        "x-kpresenter": [
            "kpr",
            "kpt"
        ],
        "x-kword": [
            "kwd",
            "kwt"
        ],
        "x-latex": "latex",
        "x-lha": "lha",
        "x-lyx": "lyx",
        "x-lzh": "lzh",
        "x-lzx": "lzx",
        "x-maker": [
            "frm",
            "maker",
            "frame",
            "fm",
            "fb",
            "book",
            "fbdoc"
        ],
        "x-ms-wmd": "wmd",
        "x-ms-wmz": "wmz",
        "x-msdos-program": [
            "com",
            "exe",
            "bat",
            "dll"
        ],
        "x-msi": "msi",
        "x-netcdf": [
            "nc",
            "cdf"
        ],
        "x-ns-proxy-autoconfig": [
            "pac",
            "dat"
        ],
        "x-nwc": "nwc",
        "x-object": "o",
        "x-oz-application": "oza",
        "x-pkcs7-certreqresp": "p7r",
        "x-python-code": [
            "pyc",
            "pyo"
        ],
        "x-qgis": [
            "qgs",
            "shp",
            "shx"
        ],
        "x-quicktimeplayer": "qtl",
        "x-redhat-package-manager": "rpm",
        "x-ruby": "rb",
        "x-sh": "sh",
        "x-shar": "shar",
        "x-shockwave-flash": [
            "swf",
            "swfl"
        ],
        "x-silverlight": "scr",
        "x-stuffit": "sit",
        "x-sv4cpio": "sv4cpio",
        "x-sv4crc": "sv4crc",
        "x-tar": "tar",
        "x-tcl": "tcl",
        "x-tex-gf": "gf",
        "x-tex-pk": "pk",
        "x-texinfo": [
            "texinfo",
            "texi"
        ],
        "x-trash": [
            "~",
            "%",
            "bak",
            "old",
            "sik"
        ],
        "x-troff": [
            "t",
            "tr",
            "roff"
        ],
        "x-troff-man": "man",
        "x-troff-me": "me",
        "x-troff-ms": "ms",
        "x-ustar": "ustar",
        "x-wais-source": "src",
        "x-wingz": "wz",
        "x-x509-ca-cert": [
            "crt",
            "der",
            "cer"
        ],
        "x-xcf": "xcf",
        "x-xfig": "fig",
        "x-xpinstall": "xpi",
        "applixware": "aw",
        "atomsvc+xml": "atomsvc",
        "ccxml+xml": "ccxml",
        "cdmi-capability": "cdmia",
        "cdmi-container": "cdmic",
        "cdmi-domain": "cdmid",
        "cdmi-object": "cdmio",
        "cdmi-queue": "cdmiq",
        "docbook+xml": "dbk",
        "dssc+der": "dssc",
        "dssc+xml": "xdssc",
        "emma+xml": "emma",
        "epub+zip": "epub",
        "exi": "exi",
        "font-tdpfr": "pfr",
        "gml+xml": "gml",
        "gpx+xml": "gpx",
        "gxf": "gxf",
        "hyperstudio": "stk",
        "inkml+xml": [
            "ink",
            "inkml"
        ],
        "ipfix": "ipfix",
        "json": "json",
        "jsonml+json": "jsonml",
        "lost+xml": "lostxml",
        "mads+xml": "mads",
        "marc": "mrc",
        "marcxml+xml": "mrcx",
        "mathml+xml": "mathml",
        "mbox": "mbox",
        "mediaservercontrol+xml": "mscml",
        "metalink+xml": "metalink",
        "metalink4+xml": "meta4",
        "mets+xml": "mets",
        "mods+xml": "mods",
        "mp21": [
            "m21",
            "mp21"
        ],
        "mp4": "mp4s",
        "oebps-package+xml": "opf",
        "omdoc+xml": "omdoc",
        "onenote": [
            "onetoc",
            "onetoc2",
            "onetmp",
            "onepkg"
        ],
        "oxps": "oxps",
        "patch-ops-error+xml": "xer",
        "pgp-encrypted": "pgp",
        "pkcs10": "p10",
        "pkcs7-mime": [
            "p7m",
            "p7c"
        ],
        "pkcs7-signature": "p7s",
        "pkcs8": "p8",
        "pkix-attr-cert": "ac",
        "pkix-crl": "crl",
        "pkix-pkipath": "pkipath",
        "pkixcmp": "pki",
        "pls+xml": "pls",
        "prs.cww": "cww",
        "pskc+xml": "pskcxml",
        "reginfo+xml": "rif",
        "relax-ng-compact-syntax": "rnc",
        "resource-lists+xml": "rl",
        "resource-lists-diff+xml": "rld",
        "rls-services+xml": "rs",
        "rpki-ghostbusters": "gbr",
        "rpki-manifest": "mft",
        "rpki-roa": "roa",
        "rsd+xml": "rsd",
        "sbml+xml": "sbml",
        "scvp-cv-request": "scq",
        "scvp-cv-response": "scs",
        "scvp-vp-request": "spq",
        "scvp-vp-response": "spp",
        "sdp": "sdp",
        "set-payment-initiation": "setpay",
        "set-registration-initiation": "setreg",
        "shf+xml": "shf",
        "sparql-query": "rq",
        "sparql-results+xml": "srx",
        "srgs": "gram",
        "srgs+xml": "grxml",
        "sru+xml": "sru",
        "ssdl+xml": "ssdl",
        "ssml+xml": "ssml",
        "tei+xml": [
            "tei",
            "teicorpus"
        ],
        "thraud+xml": "tfi",
        "timestamped-data": "tsd",
        "vnd.3gpp.pic-bw-large": "plb",
        "vnd.3gpp.pic-bw-small": "psb",
        "vnd.3gpp.pic-bw-var": "pvb",
        "vnd.3gpp2.tcap": "tcap",
        "vnd.3m.post-it-notes": "pwn",
        "vnd.accpac.simply.aso": "aso",
        "vnd.accpac.simply.imp": "imp",
        "vnd.acucobol": "acu",
        "vnd.acucorp": [
            "atc",
            "acutc"
        ],
        "vnd.adobe.air-application-installer-package+zip": "air",
        "vnd.adobe.formscentral.fcdt": "fcdt",
        "vnd.adobe.fxp": [
            "fxp",
            "fxpl"
        ],
        "vnd.adobe.xdp+xml": "xdp",
        "vnd.adobe.xfdf": "xfdf",
        "vnd.ahead.space": "ahead",
        "vnd.airzip.filesecure.azf": "azf",
        "vnd.airzip.filesecure.azs": "azs",
        "vnd.amazon.ebook": "azw",
        "vnd.americandynamics.acc": "acc",
        "vnd.amiga.ami": "ami",
        "vnd.anser-web-certificate-issue-initiation": "cii",
        "vnd.anser-web-funds-transfer-initiation": "fti",
        "vnd.antix.game-component": "atx",
        "vnd.apple.installer+xml": "mpkg",
        "vnd.apple.mpegurl": "m3u8",
        "vnd.aristanetworks.swi": "swi",
        "vnd.astraea-software.iota": "iota",
        "vnd.audiograph": "aep",
        "vnd.blueice.multipass": "mpm",
        "vnd.bmi": "bmi",
        "vnd.businessobjects": "rep",
        "vnd.chemdraw+xml": "cdxml",
        "vnd.chipnuts.karaoke-mmd": "mmd",
        "vnd.claymore": "cla",
        "vnd.cloanto.rp9": "rp9",
        "vnd.clonk.c4group": [
            "c4g",
            "c4d",
            "c4f",
            "c4p",
            "c4u"
        ],
        "vnd.cluetrust.cartomobile-config": "c11amc",
        "vnd.cluetrust.cartomobile-config-pkg": "c11amz",
        "vnd.commonspace": "csp",
        "vnd.contact.cmsg": "cdbcmsg",
        "vnd.cosmocaller": "cmc",
        "vnd.crick.clicker": "clkx",
        "vnd.crick.clicker.keyboard": "clkk",
        "vnd.crick.clicker.palette": "clkp",
        "vnd.crick.clicker.template": "clkt",
        "vnd.crick.clicker.wordbank": "clkw",
        "vnd.criticaltools.wbs+xml": "wbs",
        "vnd.ctc-posml": "pml",
        "vnd.cups-ppd": "ppd",
        "vnd.curl.car": "car",
        "vnd.curl.pcurl": "pcurl",
        "vnd.dart": "dart",
        "vnd.data-vision.rdz": "rdz",
        "vnd.dece.data": [
            "uvf",
            "uvvf",
            "uvd",
            "uvvd"
        ],
        "vnd.dece.ttml+xml": [
            "uvt",
            "uvvt"
        ],
        "vnd.dece.unspecified": [
            "uvx",
            "uvvx"
        ],
        "vnd.dece.zip": [
            "uvz",
            "uvvz"
        ],
        "vnd.denovo.fcselayout-link": "fe_launch",
        "vnd.dna": "dna",
        "vnd.dolby.mlp": "mlp",
        "vnd.dpgraph": "dpg",
        "vnd.dreamfactory": "dfac",
        "vnd.ds-keypoint": "kpxx",
        "vnd.dvb.ait": "ait",
        "vnd.dvb.service": "svc",
        "vnd.dynageo": "geo",
        "vnd.ecowin.chart": "mag",
        "vnd.enliven": "nml",
        "vnd.epson.esf": "esf",
        "vnd.epson.msf": "msf",
        "vnd.epson.quickanime": "qam",
        "vnd.epson.salt": "slt",
        "vnd.epson.ssf": "ssf",
        "vnd.eszigno3+xml": [
            "es3",
            "et3"
        ],
        "vnd.ezpix-album": "ez2",
        "vnd.ezpix-package": "ez3",
        "vnd.fdf": "fdf",
        "vnd.fdsn.mseed": "mseed",
        "vnd.fdsn.seed": [
            "seed",
            "dataless"
        ],
        "vnd.flographit": "gph",
        "vnd.fluxtime.clip": "ftc",
        "vnd.framemaker": [
            "fm",
            "frame",
            "maker",
            "book"
        ],
        "vnd.frogans.fnc": "fnc",
        "vnd.frogans.ltf": "ltf",
        "vnd.fsc.weblaunch": "fsc",
        "vnd.fujitsu.oasys": "oas",
        "vnd.fujitsu.oasys2": "oa2",
        "vnd.fujitsu.oasys3": "oa3",
        "vnd.fujitsu.oasysgp": "fg5",
        "vnd.fujitsu.oasysprs": "bh2",
        "vnd.fujixerox.ddd": "ddd",
        "vnd.fujixerox.docuworks": "xdw",
        "vnd.fujixerox.docuworks.binder": "xbd",
        "vnd.fuzzysheet": "fzs",
        "vnd.genomatix.tuxedo": "txd",
        "vnd.geogebra.file": "ggb",
        "vnd.geogebra.tool": "ggt",
        "vnd.geometry-explorer": [
            "gex",
            "gre"
        ],
        "vnd.geonext": "gxt",
        "vnd.geoplan": "g2w",
        "vnd.geospace": "g3w",
        "vnd.gmx": "gmx",
        "vnd.grafeq": [
            "gqf",
            "gqs"
        ],
        "vnd.groove-account": "gac",
        "vnd.groove-help": "ghf",
        "vnd.groove-identity-message": "gim",
        "vnd.groove-injector": "grv",
        "vnd.groove-tool-message": "gtm",
        "vnd.groove-tool-template": "tpl",
        "vnd.groove-vcard": "vcg",
        "vnd.hal+xml": "hal",
        "vnd.handheld-entertainment+xml": "zmm",
        "vnd.hbci": "hbci",
        "vnd.hhe.lesson-player": "les",
        "vnd.hp-hpgl": "hpgl",
        "vnd.hp-hpid": "hpid",
        "vnd.hp-hps": "hps",
        "vnd.hp-jlyt": "jlt",
        "vnd.hp-pcl": "pcl",
        "vnd.hp-pclxl": "pclxl",
        "vnd.hydrostatix.sof-data": "sfd-hdstx",
        "vnd.ibm.minipay": "mpy",
        "vnd.ibm.modcap": [
            "afp",
            "listafp",
            "list3820"
        ],
        "vnd.ibm.rights-management": "irm",
        "vnd.ibm.secure-container": "sc",
        "vnd.iccprofile": [
            "icc",
            "icm"
        ],
        "vnd.igloader": "igl",
        "vnd.immervision-ivp": "ivp",
        "vnd.immervision-ivu": "ivu",
        "vnd.insors.igm": "igm",
        "vnd.intercon.formnet": [
            "xpw",
            "xpx"
        ],
        "vnd.intergeo": "i2g",
        "vnd.intu.qbo": "qbo",
        "vnd.intu.qfx": "qfx",
        "vnd.ipunplugged.rcprofile": "rcprofile",
        "vnd.irepository.package+xml": "irp",
        "vnd.is-xpr": "xpr",
        "vnd.isac.fcs": "fcs",
        "vnd.jam": "jam",
        "vnd.jcp.javame.midlet-rms": "rms",
        "vnd.jisp": "jisp",
        "vnd.joost.joda-archive": "joda",
        "vnd.kahootz": [
            "ktz",
            "ktr"
        ],
        "vnd.kde.karbon": "karbon",
        "vnd.kde.kchart": "chrt",
        "vnd.kde.kformula": "kfo",
        "vnd.kde.kivio": "flw",
        "vnd.kde.kontour": "kon",
        "vnd.kde.kpresenter": [
            "kpr",
            "kpt"
        ],
        "vnd.kde.kspread": "ksp",
        "vnd.kde.kword": [
            "kwd",
            "kwt"
        ],
        "vnd.kenameaapp": "htke",
        "vnd.kidspiration": "kia",
        "vnd.kinar": [
            "kne",
            "knp"
        ],
        "vnd.koan": [
            "skp",
            "skd",
            "skt",
            "skm"
        ],
        "vnd.kodak-descriptor": "sse",
        "vnd.las.las+xml": "lasxml",
        "vnd.llamagraphics.life-balance.desktop": "lbd",
        "vnd.llamagraphics.life-balance.exchange+xml": "lbe",
        "vnd.lotus-1-2-3": "123",
        "vnd.lotus-approach": "apr",
        "vnd.lotus-freelance": "pre",
        "vnd.lotus-notes": "nsf",
        "vnd.lotus-organizer": "org",
        "vnd.lotus-screencam": "scm",
        "vnd.lotus-wordpro": "lwp",
        "vnd.macports.portpkg": "portpkg",
        "vnd.mcd": "mcd",
        "vnd.medcalcdata": "mc1",
        "vnd.mediastation.cdkey": "cdkey",
        "vnd.mfer": "mwf",
        "vnd.mfmp": "mfm",
        "vnd.micrografx.flo": "flo",
        "vnd.micrografx.igx": "igx",
        "vnd.mif": "mif",
        "vnd.mobius.daf": "daf",
        "vnd.mobius.dis": "dis",
        "vnd.mobius.mbk": "mbk",
        "vnd.mobius.mqy": "mqy",
        "vnd.mobius.msl": "msl",
        "vnd.mobius.plc": "plc",
        "vnd.mobius.txf": "txf",
        "vnd.mophun.application": "mpn",
        "vnd.mophun.certificate": "mpc",
        "vnd.ms-artgalry": "cil",
        "vnd.ms-cab-compressed": "cab",
        "vnd.ms-excel.addin.macroenabled.12": "xlam",
        "vnd.ms-excel.sheet.binary.macroenabled.12": "xlsb",
        "vnd.ms-excel.sheet.macroenabled.12": "xlsm",
        "vnd.ms-excel.template.macroenabled.12": "xltm",
        "vnd.ms-fontobject": "eot",
        "vnd.ms-htmlhelp": "chm",
        "vnd.ms-ims": "ims",
        "vnd.ms-lrm": "lrm",
        "vnd.ms-officetheme": "thmx",
        "vnd.ms-powerpoint.addin.macroenabled.12": "ppam",
        "vnd.ms-powerpoint.presentation.macroenabled.12": "pptm",
        "vnd.ms-powerpoint.slide.macroenabled.12": "sldm",
        "vnd.ms-powerpoint.slideshow.macroenabled.12": "ppsm",
        "vnd.ms-powerpoint.template.macroenabled.12": "potm",
        "vnd.ms-project": [
            "mpp",
            "mpt"
        ],
        "vnd.ms-word.document.macroenabled.12": "docm",
        "vnd.ms-word.template.macroenabled.12": "dotm",
        "vnd.ms-works": [
            "wps",
            "wks",
            "wcm",
            "wdb"
        ],
        "vnd.ms-wpl": "wpl",
        "vnd.ms-xpsdocument": "xps",
        "vnd.mseq": "mseq",
        "vnd.musician": "mus",
        "vnd.muvee.style": "msty",
        "vnd.mynfc": "taglet",
        "vnd.neurolanguage.nlu": "nlu",
        "vnd.nitf": [
            "ntf",
            "nitf"
        ],
        "vnd.noblenet-directory": "nnd",
        "vnd.noblenet-sealer": "nns",
        "vnd.noblenet-web": "nnw",
        "vnd.nokia.n-gage.data": "ngdat",
        "vnd.nokia.n-gage.symbian.install": "n-gage",
        "vnd.nokia.radio-preset": "rpst",
        "vnd.nokia.radio-presets": "rpss",
        "vnd.novadigm.edm": "edm",
        "vnd.novadigm.edx": "edx",
        "vnd.novadigm.ext": "ext",
        "vnd.oasis.opendocument.chart-template": "otc",
        "vnd.oasis.opendocument.formula-template": "odft",
        "vnd.oasis.opendocument.image-template": "oti",
        "vnd.olpc-sugar": "xo",
        "vnd.oma.dd2+xml": "dd2",
        "vnd.openofficeorg.extension": "oxt",
        "vnd.openxmlformats-officedocument.presentationml.slide": "sldx",
        "vnd.osgeo.mapguide.package": "mgp",
        "vnd.osgi.dp": "dp",
        "vnd.osgi.subsystem": "esa",
        "vnd.palm": [
            "pdb",
            "pqa",
            "oprc"
        ],
        "vnd.pawaafile": "paw",
        "vnd.pg.format": "str",
        "vnd.pg.osasli": "ei6",
        "vnd.picsel": "efif",
        "vnd.pmi.widget": "wg",
        "vnd.pocketlearn": "plf",
        "vnd.powerbuilder6": "pbd",
        "vnd.previewsystems.box": "box",
        "vnd.proteus.magazine": "mgz",
        "vnd.publishare-delta-tree": "qps",
        "vnd.pvi.ptid1": "ptid",
        "vnd.quark.quarkxpress": [
            "qxd",
            "qxt",
            "qwd",
            "qwt",
            "qxl",
            "qxb"
        ],
        "vnd.realvnc.bed": "bed",
        "vnd.recordare.musicxml": "mxl",
        "vnd.recordare.musicxml+xml": "musicxml",
        "vnd.rig.cryptonote": "cryptonote",
        "vnd.rn-realmedia": "rm",
        "vnd.rn-realmedia-vbr": "rmvb",
        "vnd.route66.link66+xml": "link66",
        "vnd.sailingtracker.track": "st",
        "vnd.seemail": "see",
        "vnd.sema": "sema",
        "vnd.semd": "semd",
        "vnd.semf": "semf",
        "vnd.shana.informed.formdata": "ifm",
        "vnd.shana.informed.formtemplate": "itp",
        "vnd.shana.informed.interchange": "iif",
        "vnd.shana.informed.package": "ipk",
        "vnd.simtech-mindmapper": [
            "twd",
            "twds"
        ],
        "vnd.smart.teacher": "teacher",
        "vnd.solent.sdkm+xml": [
            "sdkm",
            "sdkd"
        ],
        "vnd.spotfire.dxp": "dxp",
        "vnd.spotfire.sfs": "sfs",
        "vnd.stepmania.package": "smzip",
        "vnd.stepmania.stepchart": "sm",
        "vnd.sus-calendar": [
            "sus",
            "susp"
        ],
        "vnd.svd": "svd",
        "vnd.syncml+xml": "xsm",
        "vnd.syncml.dm+wbxml": "bdm",
        "vnd.syncml.dm+xml": "xdm",
        "vnd.tao.intent-module-archive": "tao",
        "vnd.tcpdump.pcap": [
            "pcap",
            "cap",
            "dmp"
        ],
        "vnd.tmobile-livetv": "tmo",
        "vnd.trid.tpt": "tpt",
        "vnd.triscape.mxs": "mxs",
        "vnd.trueapp": "tra",
        "vnd.ufdl": [
            "ufd",
            "ufdl"
        ],
        "vnd.uiq.theme": "utz",
        "vnd.umajin": "umj",
        "vnd.unity": "unityweb",
        "vnd.uoml+xml": "uoml",
        "vnd.vcx": "vcx",
        "vnd.visionary": "vis",
        "vnd.vsf": "vsf",
        "vnd.webturbo": "wtb",
        "vnd.wolfram.player": "nbp",
        "vnd.wqd": "wqd",
        "vnd.wt.stf": "stf",
        "vnd.xara": "xar",
        "vnd.xfdl": "xfdl",
        "vnd.yamaha.hv-dic": "hvd",
        "vnd.yamaha.hv-script": "hvs",
        "vnd.yamaha.hv-voice": "hvp",
        "vnd.yamaha.openscoreformat": "osf",
        "vnd.yamaha.openscoreformat.osfpvg+xml": "osfpvg",
        "vnd.yamaha.smaf-audio": "saf",
        "vnd.yamaha.smaf-phrase": "spf",
        "vnd.yellowriver-custom-menu": "cmp",
        "vnd.zul": [
            "zir",
            "zirz"
        ],
        "vnd.zzazz.deck+xml": "zaz",
        "voicexml+xml": "vxml",
        "widget": "wgt",
        "winhlp": "hlp",
        "wsdl+xml": "wsdl",
        "wspolicy+xml": "wspolicy",
        "x-ace-compressed": "ace",
        "x-authorware-bin": [
            "aab",
            "x32",
            "u32",
            "vox"
        ],
        "x-authorware-map": "aam",
        "x-authorware-seg": "aas",
        "x-blorb": [
            "blb",
            "blorb"
        ],
        "x-bzip": "bz",
        "x-bzip2": [
            "bz2",
            "boz"
        ],
        "x-cfs-compressed": "cfs",
        "x-chat": "chat",
        "x-conference": "nsc",
        "x-dgc-compressed": "dgc",
        "x-dtbncx+xml": "ncx",
        "x-dtbook+xml": "dtb",
        "x-dtbresource+xml": "res",
        "x-eva": "eva",
        "x-font-bdf": "bdf",
        "x-font-ghostscript": "gsf",
        "x-font-linux-psf": "psf",
        "x-font-otf": "otf",
        "x-font-pcf": "pcf",
        "x-font-snf": "snf",
        "x-font-ttf": [
            "ttf",
            "ttc"
        ],
        "x-font-type1": [
            "pfa",
            "pfb",
            "pfm",
            "afm"
        ],
        "x-font-woff": "woff",
        "x-freearc": "arc",
        "x-gca-compressed": "gca",
        "x-glulx": "ulx",
        "x-gramps-xml": "gramps",
        "x-install-instructions": "install",
        "x-lzh-compressed": [
            "lzh",
            "lha"
        ],
        "x-mie": "mie",
        "x-mobipocket-ebook": [
            "prc",
            "mobi"
        ],
        "x-ms-application": "application",
        "x-ms-shortcut": "lnk",
        "x-ms-xbap": "xbap",
        "x-msbinder": "obd",
        "x-mscardfile": "crd",
        "x-msclip": "clp",
        "x-msdownload": [
            "exe",
            "dll",
            "com",
            "bat",
            "msi"
        ],
        "x-msmediaview": [
            "mvb",
            "m13",
            "m14"
        ],
        "x-msmetafile": [
            "wmf",
            "wmz",
            "emf",
            "emz"
        ],
        "x-msmoney": "mny",
        "x-mspublisher": "pub",
        "x-msschedule": "scd",
        "x-msterminal": "trm",
        "x-mswrite": "wri",
        "x-nzb": "nzb",
        "x-pkcs12": [
            "p12",
            "pfx"
        ],
        "x-pkcs7-certificates": [
            "p7b",
            "spc"
        ],
        "x-research-info-systems": "ris",
        "x-silverlight-app": "xap",
        "x-sql": "sql",
        "x-stuffitx": "sitx",
        "x-subrip": "srt",
        "x-t3vm-image": "t3",
        "x-tads": "gam",
        "x-tex": "tex",
        "x-tex-tfm": "tfm",
        "x-tgif": "obj",
        "x-xliff+xml": "xlf",
        "x-xz": "xz",
        "x-zmachine": [
            "z1",
            "z2",
            "z3",
            "z4",
            "z5",
            "z6",
            "z7",
            "z8"
        ],
        "xaml+xml": "xaml",
        "xcap-diff+xml": "xdf",
        "xenc+xml": "xenc",
        "xml-dtd": "dtd",
        "xop+xml": "xop",
        "xproc+xml": "xpl",
        "xslt+xml": "xslt",
        "xv+xml": [
            "mxml",
            "xhvml",
            "xvml",
            "xvm"
        ],
        "yang": "yang",
        "yin+xml": "yin",
        "envoy": "evy",
        "fractals": "fif",
        "internet-property-stream": "acx",
        "olescript": "axs",
        "vnd.ms-outlook": "msg",
        "vnd.ms-pkicertstore": "sst",
        "x-compress": "z",
        "x-compressed": "tgz",
        "x-gzip": "gz",
        "x-perfmon": [
            "pma",
            "pmc",
            "pml",
            "pmr",
            "pmw"
        ],
        "x-pkcs7-mime": [
            "p7c",
            "p7m"
        ],
        "ynd.ms-pkipko": "pko"
    },
    "audio": {
        "amr": "amr",
        "amr-wb": "awb",
        "annodex": "axa",
        "basic": [
            "au",
            "snd"
        ],
        "flac": "flac",
        "midi": [
            "mid",
            "midi",
            "kar",
            "rmi"
        ],
        "mpeg": [
            "mpga",
            "mpega",
            "mp2",
            "mp3",
            "m4a",
            "mp2a",
            "m2a",
            "m3a"
        ],
        "mpegurl": "m3u",
        "ogg": [
            "oga",
            "ogg",
            "spx"
        ],
        "prs.sid": "sid",
        "x-aiff": [
            "aif",
            "aiff",
            "aifc"
        ],
        "x-gsm": "gsm",
        "x-ms-wma": "wma",
        "x-ms-wax": "wax",
        "x-pn-realaudio": "ram",
        "x-realaudio": "ra",
        "x-sd2": "sd2",
        "x-wav": "wav",
        "adpcm": "adp",
        "mp4": "mp4a",
        "s3m": "s3m",
        "silk": "sil",
        "vnd.dece.audio": [
            "uva",
            "uvva"
        ],
        "vnd.digital-winds": "eol",
        "vnd.dra": "dra",
        "vnd.dts": "dts",
        "vnd.dts.hd": "dtshd",
        "vnd.lucent.voice": "lvp",
        "vnd.ms-playready.media.pya": "pya",
        "vnd.nuera.ecelp4800": "ecelp4800",
        "vnd.nuera.ecelp7470": "ecelp7470",
        "vnd.nuera.ecelp9600": "ecelp9600",
        "vnd.rip": "rip",
        "webm": "weba",
        "x-aac": "aac",
        "x-caf": "caf",
        "x-matroska": "mka",
        "x-pn-realaudio-plugin": "rmp",
        "xm": "xm",
        "mid": [
            "mid",
            "rmi"
        ]
    },
    "chemical": {
        "x-alchemy": "alc",
        "x-cache": [
            "cac",
            "cache"
        ],
        "x-cache-csf": "csf",
        "x-cactvs-binary": [
            "cbin",
            "cascii",
            "ctab"
        ],
        "x-cdx": "cdx",
        "x-chem3d": "c3d",
        "x-cif": "cif",
        "x-cmdf": "cmdf",
        "x-cml": "cml",
        "x-compass": "cpa",
        "x-crossfire": "bsd",
        "x-csml": [
            "csml",
            "csm"
        ],
        "x-ctx": "ctx",
        "x-cxf": [
            "cxf",
            "cef"
        ],
        "x-embl-dl-nucleotide": [
            "emb",
            "embl"
        ],
        "x-gamess-input": [
            "inp",
            "gam",
            "gamin"
        ],
        "x-gaussian-checkpoint": [
            "fch",
            "fchk"
        ],
        "x-gaussian-cube": "cub",
        "x-gaussian-input": [
            "gau",
            "gjc",
            "gjf"
        ],
        "x-gaussian-log": "gal",
        "x-gcg8-sequence": "gcg",
        "x-genbank": "gen",
        "x-hin": "hin",
        "x-isostar": [
            "istr",
            "ist"
        ],
        "x-jcamp-dx": [
            "jdx",
            "dx"
        ],
        "x-kinemage": "kin",
        "x-macmolecule": "mcm",
        "x-macromodel-input": [
            "mmd",
            "mmod"
        ],
        "x-mdl-molfile": "mol",
        "x-mdl-rdfile": "rd",
        "x-mdl-rxnfile": "rxn",
        "x-mdl-sdfile": [
            "sd",
            "sdf"
        ],
        "x-mdl-tgf": "tgf",
        "x-mmcif": "mcif",
        "x-mol2": "mol2",
        "x-molconn-Z": "b",
        "x-mopac-graph": "gpt",
        "x-mopac-input": [
            "mop",
            "mopcrt",
            "mpc",
            "zmt"
        ],
        "x-mopac-out": "moo",
        "x-ncbi-asn1": "asn",
        "x-ncbi-asn1-ascii": [
            "prt",
            "ent"
        ],
        "x-ncbi-asn1-binary": [
            "val",
            "aso"
        ],
        "x-pdb": [
            "pdb",
            "ent"
        ],
        "x-rosdal": "ros",
        "x-swissprot": "sw",
        "x-vamas-iso14976": "vms",
        "x-vmd": "vmd",
        "x-xtel": "xtel",
        "x-xyz": "xyz"
    },
    "image": {
        "gif": "gif",
        "ief": "ief",
        "jpeg": [
            "jpeg",
            "jpg",
            "jpe"
        ],
        "pcx": "pcx",
        "png": "png",
        "svg+xml": [
            "svg",
            "svgz"
        ],
        "tiff": [
            "tiff",
            "tif"
        ],
        "vnd.djvu": [
            "djvu",
            "djv"
        ],
        "vnd.wap.wbmp": "wbmp",
        "x-canon-cr2": "cr2",
        "x-canon-crw": "crw",
        "x-cmu-raster": "ras",
        "x-coreldraw": "cdr",
        "x-coreldrawpattern": "pat",
        "x-coreldrawtemplate": "cdt",
        "x-corelphotopaint": "cpt",
        "x-epson-erf": "erf",
        "x-icon": "ico",
        "x-jg": "art",
        "x-jng": "jng",
        "x-nikon-nef": "nef",
        "x-olympus-orf": "orf",
        "x-photoshop": "psd",
        "x-portable-anymap": "pnm",
        "x-portable-bitmap": "pbm",
        "x-portable-graymap": "pgm",
        "x-portable-pixmap": "ppm",
        "x-rgb": "rgb",
        "x-xbitmap": "xbm",
        "x-xpixmap": "xpm",
        "x-xwindowdump": "xwd",
        "bmp": "bmp",
        "cgm": "cgm",
        "g3fax": "g3",
        "ktx": "ktx",
        "prs.btif": "btif",
        "sgi": "sgi",
        "vnd.dece.graphic": [
            "uvi",
            "uvvi",
            "uvg",
            "uvvg"
        ],
        "vnd.dwg": "dwg",
        "vnd.dxf": "dxf",
        "vnd.fastbidsheet": "fbs",
        "vnd.fpx": "fpx",
        "vnd.fst": "fst",
        "vnd.fujixerox.edmics-mmr": "mmr",
        "vnd.fujixerox.edmics-rlc": "rlc",
        "vnd.ms-modi": "mdi",
        "vnd.ms-photo": "wdp",
        "vnd.net-fpx": "npx",
        "vnd.xiff": "xif",
        "webp": "webp",
        "x-3ds": "3ds",
        "x-cmx": "cmx",
        "x-freehand": [
            "fh",
            "fhc",
            "fh4",
            "fh5",
            "fh7"
        ],
        "x-pict": [
            "pic",
            "pct"
        ],
        "x-tga": "tga",
        "cis-cod": "cod",
        "pipeg": "jfif"
    },
    "message": {
        "rfc822": [
            "eml",
            "mime",
            "mht",
            "mhtml",
            "nws"
        ]
    },
    "model": {
        "iges": [
            "igs",
            "iges"
        ],
        "mesh": [
            "msh",
            "mesh",
            "silo"
        ],
        "vrml": [
            "wrl",
            "vrml"
        ],
        "x3d+vrml": [
            "x3dv",
            "x3dvz"
        ],
        "x3d+xml": [
            "x3d",
            "x3dz"
        ],
        "x3d+binary": [
            "x3db",
            "x3dbz"
        ],
        "vnd.collada+xml": "dae",
        "vnd.dwf": "dwf",
        "vnd.gdl": "gdl",
        "vnd.gtw": "gtw",
        "vnd.mts": "mts",
        "vnd.vtu": "vtu"
    },
    "text": {
        "cache-manifest": [
            "manifest",
            "appcache"
        ],
        "calendar": [
            "ics",
            "icz",
            "ifb"
        ],
        "css": "css",
        "csv": "csv",
        "h323": "323",
        "html": [
            "html",
            "htm",
            "shtml",
            "stm"
        ],
        "iuls": "uls",
        "mathml": "mml",
        "plain": [
            "txt",
            "text",
            "brf",
            "conf",
            "def",
            "list",
            "log",
            "in",
            "bas"
        ],
        "richtext": "rtx",
        "scriptlet": [
            "sct",
            "wsc"
        ],
        "texmacs": [
            "tm",
            "ts"
        ],
        "tab-separated-values": "tsv",
        "vnd.sun.j2me.app-descriptor": "jad",
        "vnd.wap.wml": "wml",
        "vnd.wap.wmlscript": "wmls",
        "x-bibtex": "bib",
        "x-boo": "boo",
        "x-c++hdr": [
            "h++",
            "hpp",
            "hxx",
            "hh"
        ],
        "x-c++src": [
            "c++",
            "cpp",
            "cxx",
            "cc"
        ],
        "x-component": "htc",
        "x-dsrc": "d",
        "x-diff": [
            "diff",
            "patch"
        ],
        "x-haskell": "hs",
        "x-java": "java",
        "x-literate-haskell": "lhs",
        "x-moc": "moc",
        "x-pascal": [
            "p",
            "pas"
        ],
        "x-pcs-gcd": "gcd",
        "x-perl": [
            "pl",
            "pm"
        ],
        "x-python": "py",
        "x-scala": "scala",
        "x-setext": "etx",
        "x-tcl": [
            "tcl",
            "tk"
        ],
        "x-tex": [
            "tex",
            "ltx",
            "sty",
            "cls"
        ],
        "x-vcalendar": "vcs",
        "x-vcard": "vcf",
        "n3": "n3",
        "prs.lines.tag": "dsc",
        "sgml": [
            "sgml",
            "sgm"
        ],
        "troff": [
            "t",
            "tr",
            "roff",
            "man",
            "me",
            "ms"
        ],
        "turtle": "ttl",
        "uri-list": [
            "uri",
            "uris",
            "urls"
        ],
        "vcard": "vcard",
        "vnd.curl": "curl",
        "vnd.curl.dcurl": "dcurl",
        "vnd.curl.scurl": "scurl",
        "vnd.curl.mcurl": "mcurl",
        "vnd.dvb.subtitle": "sub",
        "vnd.fly": "fly",
        "vnd.fmi.flexstor": "flx",
        "vnd.graphviz": "gv",
        "vnd.in3d.3dml": "3dml",
        "vnd.in3d.spot": "spot",
        "x-asm": [
            "s",
            "asm"
        ],
        "x-c": [
            "c",
            "cc",
            "cxx",
            "cpp",
            "h",
            "hh",
            "dic"
        ],
        "x-fortran": [
            "f",
            "for",
            "f77",
            "f90"
        ],
        "x-opml": "opml",
        "x-nfo": "nfo",
        "x-sfv": "sfv",
        "x-uuencode": "uu",
        "webviewhtml": "htt"
    },
    "video": {
        "avif": ".avif",
        "3gpp": "3gp",
        "annodex": "axv",
        "dl": "dl",
        "dv": [
            "dif",
            "dv"
        ],
        "fli": "fli",
        "gl": "gl",
        "mpeg": [
            "mpeg",
            "mpg",
            "mpe",
            "m1v",
            "m2v",
            "mp2",
            "mpa",
            "mpv2"
        ],
        "mp4": [
            "mp4",
            "mp4v",
            "mpg4"
        ],
        "quicktime": [
            "qt",
            "mov"
        ],
        "ogg": "ogv",
        "vnd.mpegurl": [
            "mxu",
            "m4u"
        ],
        "x-flv": "flv",
        "x-la-asf": [
            "lsf",
            "lsx"
        ],
        "x-mng": "mng",
        "x-ms-asf": [
            "asf",
            "asx",
            "asr"
        ],
        "x-ms-wm": "wm",
        "x-ms-wmv": "wmv",
        "x-ms-wmx": "wmx",
        "x-ms-wvx": "wvx",
        "x-msvideo": "avi",
        "x-sgi-movie": "movie",
        "x-matroska": [
            "mpv",
            "mkv",
            "mk3d",
            "mks"
        ],
        "3gpp2": "3g2",
        "h261": "h261",
        "h263": "h263",
        "h264": "h264",
        "jpeg": "jpgv",
        "jpm": [
            "jpm",
            "jpgm"
        ],
        "mj2": [
            "mj2",
            "mjp2"
        ],
        "vnd.dece.hd": [
            "uvh",
            "uvvh"
        ],
        "vnd.dece.mobile": [
            "uvm",
            "uvvm"
        ],
        "vnd.dece.pd": [
            "uvp",
            "uvvp"
        ],
        "vnd.dece.sd": [
            "uvs",
            "uvvs"
        ],
        "vnd.dece.video": [
            "uvv",
            "uvvv"
        ],
        "vnd.dvb.file": "dvb",
        "vnd.fvt": "fvt",
        "vnd.ms-playready.media.pyv": "pyv",
        "vnd.uvvu.mp4": [
            "uvu",
            "uvvu"
        ],
        "vnd.vivo": "viv",
        "webm": "webm",
        "x-f4v": "f4v",
        "x-m4v": "m4v",
        "x-ms-vob": "vob",
        "x-smv": "smv"
    },
    "x-conference": {
        "x-cooltalk": "ice"
    },
    "x-world": {
        "x-vrml": [
            "vrm",
            "vrml",
            "wrl",
            "flr",
            "wrz",
            "xaf",
            "xof"
        ]
    }
};
(()=>{
    const mimeTypes = {};
    for(const type in table){
        if (table.hasOwnProperty(type)) {
            for(const subtype in table[type]){
                if (table[type].hasOwnProperty(subtype)) {
                    const value = table[type][subtype];
                    if (typeof value == "string") {
                        mimeTypes[value] = type + "/" + subtype;
                    } else {
                        for(let indexMimeType = 0; indexMimeType < value.length; indexMimeType++){
                            mimeTypes[value[indexMimeType]] = type + "/" + subtype;
                        }
                    }
                }
            }
        }
    }
    return mimeTypes;
})();
const table1 = [];
for(let i = 0; i < 256; i++){
    let t = i;
    for(let j = 0; j < 8; j++){
        if (t & 1) {
            t = t >>> 1 ^ 0xEDB88320;
        } else {
            t = t >>> 1;
        }
    }
    table1[i] = t;
}
class Crc32 {
    constructor(crc){
        this.crc = crc || -1;
    }
    append(data) {
        let crc = this.crc | 0;
        for(let offset = 0, length = data.length | 0; offset < length; offset++){
            crc = crc >>> 8 ^ table1[(crc ^ data[offset]) & 0xFF];
        }
        this.crc = crc;
    }
    get() {
        return ~this.crc;
    }
}
class Crc32Stream extends TransformStream {
    constructor(){
        const crc32 = new Crc32();
        super({
            transform (chunk) {
                crc32.append(chunk);
            },
            flush (controller) {
                const value = new Uint8Array(4);
                const dataView = new DataView(value.buffer);
                dataView.setUint32(0, crc32.get());
                controller.enqueue(value);
            }
        });
    }
}
function encodeText(value) {
    if (typeof TextEncoder == "undefined") {
        value = unescape(encodeURIComponent(value));
        const result = new Uint8Array(value.length);
        for(let i = 0; i < result.length; i++){
            result[i] = value.charCodeAt(i);
        }
        return result;
    } else {
        return new TextEncoder().encode(value);
    }
}
const bitArray = {
    concat (a1, a2) {
        if (a1.length === 0 || a2.length === 0) {
            return a1.concat(a2);
        }
        const last = a1[a1.length - 1], shift = bitArray.getPartial(last);
        if (shift === 32) {
            return a1.concat(a2);
        } else {
            return bitArray._shiftRight(a2, shift, last | 0, a1.slice(0, a1.length - 1));
        }
    },
    bitLength (a) {
        const l = a.length;
        if (l === 0) {
            return 0;
        }
        const x = a[l - 1];
        return (l - 1) * 32 + bitArray.getPartial(x);
    },
    clamp (a, len) {
        if (a.length * 32 < len) {
            return a;
        }
        a = a.slice(0, Math.ceil(len / 32));
        const l = a.length;
        len = len & 31;
        if (l > 0 && len) {
            a[l - 1] = bitArray.partial(len, a[l - 1] & 0x80000000 >> len - 1, 1);
        }
        return a;
    },
    partial (len, x, _end) {
        if (len === 32) {
            return x;
        }
        return (_end ? x | 0 : x << 32 - len) + len * 0x10000000000;
    },
    getPartial (x) {
        return Math.round(x / 0x10000000000) || 32;
    },
    _shiftRight (a, shift, carry, out) {
        if (out === undefined) {
            out = [];
        }
        for(; shift >= 32; shift -= 32){
            out.push(carry);
            carry = 0;
        }
        if (shift === 0) {
            return out.concat(a);
        }
        for(let i = 0; i < a.length; i++){
            out.push(carry | a[i] >>> shift);
            carry = a[i] << 32 - shift;
        }
        const last2 = a.length ? a[a.length - 1] : 0;
        const shift2 = bitArray.getPartial(last2);
        out.push(bitArray.partial(shift + shift2 & 31, shift + shift2 > 32 ? carry : out.pop(), 1));
        return out;
    }
};
const codec = {
    bytes: {
        fromBits (arr) {
            const bl = bitArray.bitLength(arr);
            const byteLength = bl / 8;
            const out = new Uint8Array(byteLength);
            let tmp;
            for(let i = 0; i < byteLength; i++){
                if ((i & 3) === 0) {
                    tmp = arr[i / 4];
                }
                out[i] = tmp >>> 24;
                tmp <<= 8;
            }
            return out;
        },
        toBits (bytes) {
            const out = [];
            let i;
            let tmp = 0;
            for(i = 0; i < bytes.length; i++){
                tmp = tmp << 8 | bytes[i];
                if ((i & 3) === 3) {
                    out.push(tmp);
                    tmp = 0;
                }
            }
            if (i & 3) {
                out.push(bitArray.partial(8 * (i & 3), tmp));
            }
            return out;
        }
    }
};
const hash = {};
hash.sha1 = class {
    constructor(hash){
        const sha1 = this;
        sha1.blockSize = 512;
        sha1._init = [
            0x67452301,
            0xEFCDAB89,
            0x98BADCFE,
            0x10325476,
            0xC3D2E1F0
        ];
        sha1._key = [
            0x5A827999,
            0x6ED9EBA1,
            0x8F1BBCDC,
            0xCA62C1D6
        ];
        if (hash) {
            sha1._h = hash._h.slice(0);
            sha1._buffer = hash._buffer.slice(0);
            sha1._length = hash._length;
        } else {
            sha1.reset();
        }
    }
    reset() {
        const sha1 = this;
        sha1._h = sha1._init.slice(0);
        sha1._buffer = [];
        sha1._length = 0;
        return sha1;
    }
    update(data) {
        const sha1 = this;
        if (typeof data === "string") {
            data = codec.utf8String.toBits(data);
        }
        const b = sha1._buffer = bitArray.concat(sha1._buffer, data);
        const ol = sha1._length;
        const nl = sha1._length = ol + bitArray.bitLength(data);
        if (nl > 9007199254740991) {
            throw new Error("Cannot hash more than 2^53 - 1 bits");
        }
        const c = new Uint32Array(b);
        let j = 0;
        for(let i = sha1.blockSize + ol - (sha1.blockSize + ol & sha1.blockSize - 1); i <= nl; i += sha1.blockSize){
            sha1._block(c.subarray(16 * j, 16 * (j + 1)));
            j += 1;
        }
        b.splice(0, 16 * j);
        return sha1;
    }
    finalize() {
        const sha1 = this;
        let b = sha1._buffer;
        const h = sha1._h;
        b = bitArray.concat(b, [
            bitArray.partial(1, 1)
        ]);
        for(let i = b.length + 2; i & 15; i++){
            b.push(0);
        }
        b.push(Math.floor(sha1._length / 0x100000000));
        b.push(sha1._length | 0);
        while(b.length){
            sha1._block(b.splice(0, 16));
        }
        sha1.reset();
        return h;
    }
    _f(t, b, c, d) {
        if (t <= 19) {
            return b & c | ~b & d;
        } else if (t <= 39) {
            return b ^ c ^ d;
        } else if (t <= 59) {
            return b & c | b & d | c & d;
        } else if (t <= 79) {
            return b ^ c ^ d;
        }
    }
    _S(n, x) {
        return x << n | x >>> 32 - n;
    }
    _block(words) {
        const sha1 = this;
        const h = sha1._h;
        const w = Array(80);
        for(let j = 0; j < 16; j++){
            w[j] = words[j];
        }
        let a = h[0];
        let b = h[1];
        let c = h[2];
        let d = h[3];
        let e = h[4];
        for(let t = 0; t <= 79; t++){
            if (t >= 16) {
                w[t] = sha1._S(1, w[t - 3] ^ w[t - 8] ^ w[t - 14] ^ w[t - 16]);
            }
            const tmp = sha1._S(5, a) + sha1._f(t, b, c, d) + e + w[t] + sha1._key[Math.floor(t / 20)] | 0;
            e = d;
            d = c;
            c = sha1._S(30, b);
            b = a;
            a = tmp;
        }
        h[0] = h[0] + a | 0;
        h[1] = h[1] + b | 0;
        h[2] = h[2] + c | 0;
        h[3] = h[3] + d | 0;
        h[4] = h[4] + e | 0;
    }
};
const cipher = {};
cipher.aes = class {
    constructor(key){
        const aes = this;
        aes._tables = [
            [
                [],
                [],
                [],
                [],
                []
            ],
            [
                [],
                [],
                [],
                [],
                []
            ]
        ];
        if (!aes._tables[0][0][0]) {
            aes._precompute();
        }
        const sbox = aes._tables[0][4];
        const decTable = aes._tables[1];
        const keyLen = key.length;
        let i, encKey, decKey, rcon = 1;
        if (keyLen !== 4 && keyLen !== 6 && keyLen !== 8) {
            throw new Error("invalid aes key size");
        }
        aes._key = [
            encKey = key.slice(0),
            decKey = []
        ];
        for(i = keyLen; i < 4 * keyLen + 28; i++){
            let tmp = encKey[i - 1];
            if (i % keyLen === 0 || keyLen === 8 && i % keyLen === 4) {
                tmp = sbox[tmp >>> 24] << 24 ^ sbox[tmp >> 16 & 255] << 16 ^ sbox[tmp >> 8 & 255] << 8 ^ sbox[tmp & 255];
                if (i % keyLen === 0) {
                    tmp = tmp << 8 ^ tmp >>> 24 ^ rcon << 24;
                    rcon = rcon << 1 ^ (rcon >> 7) * 283;
                }
            }
            encKey[i] = encKey[i - keyLen] ^ tmp;
        }
        for(let j = 0; i; j++, i--){
            const tmp = encKey[j & 3 ? i : i - 4];
            if (i <= 4 || j < 4) {
                decKey[j] = tmp;
            } else {
                decKey[j] = decTable[0][sbox[tmp >>> 24]] ^ decTable[1][sbox[tmp >> 16 & 255]] ^ decTable[2][sbox[tmp >> 8 & 255]] ^ decTable[3][sbox[tmp & 255]];
            }
        }
    }
    encrypt(data) {
        return this._crypt(data, 0);
    }
    decrypt(data) {
        return this._crypt(data, 1);
    }
    _precompute() {
        const encTable = this._tables[0];
        const decTable = this._tables[1];
        const sbox = encTable[4];
        const sboxInv = decTable[4];
        const d = [];
        const th = [];
        let xInv, x2, x4, x8;
        for(let i = 0; i < 256; i++){
            th[(d[i] = i << 1 ^ (i >> 7) * 283) ^ i] = i;
        }
        for(let x = xInv = 0; !sbox[x]; x ^= x2 || 1, xInv = th[xInv] || 1){
            let s = xInv ^ xInv << 1 ^ xInv << 2 ^ xInv << 3 ^ xInv << 4;
            s = s >> 8 ^ s & 255 ^ 99;
            sbox[x] = s;
            sboxInv[s] = x;
            x8 = d[x4 = d[x2 = d[x]]];
            let tDec = x8 * 0x1010101 ^ x4 * 0x10001 ^ x2 * 0x101 ^ x * 0x1010100;
            let tEnc = d[s] * 0x101 ^ s * 0x1010100;
            for(let i = 0; i < 4; i++){
                encTable[i][x] = tEnc = tEnc << 24 ^ tEnc >>> 8;
                decTable[i][s] = tDec = tDec << 24 ^ tDec >>> 8;
            }
        }
        for(let i = 0; i < 5; i++){
            encTable[i] = encTable[i].slice(0);
            decTable[i] = decTable[i].slice(0);
        }
    }
    _crypt(input, dir) {
        if (input.length !== 4) {
            throw new Error("invalid aes block size");
        }
        const key = this._key[dir];
        const nInnerRounds = key.length / 4 - 2;
        const out = [
            0,
            0,
            0,
            0
        ];
        const table = this._tables[dir];
        const t0 = table[0];
        const t1 = table[1];
        const t2 = table[2];
        const t3 = table[3];
        const sbox = table[4];
        let a = input[0] ^ key[0];
        let b = input[dir ? 3 : 1] ^ key[1];
        let c = input[2] ^ key[2];
        let d = input[dir ? 1 : 3] ^ key[3];
        let kIndex = 4;
        let a2, b2, c2;
        for(let i = 0; i < nInnerRounds; i++){
            a2 = t0[a >>> 24] ^ t1[b >> 16 & 255] ^ t2[c >> 8 & 255] ^ t3[d & 255] ^ key[kIndex];
            b2 = t0[b >>> 24] ^ t1[c >> 16 & 255] ^ t2[d >> 8 & 255] ^ t3[a & 255] ^ key[kIndex + 1];
            c2 = t0[c >>> 24] ^ t1[d >> 16 & 255] ^ t2[a >> 8 & 255] ^ t3[b & 255] ^ key[kIndex + 2];
            d = t0[d >>> 24] ^ t1[a >> 16 & 255] ^ t2[b >> 8 & 255] ^ t3[c & 255] ^ key[kIndex + 3];
            kIndex += 4;
            a = a2;
            b = b2;
            c = c2;
        }
        for(let i = 0; i < 4; i++){
            out[dir ? 3 & -i : i] = sbox[a >>> 24] << 24 ^ sbox[b >> 16 & 255] << 16 ^ sbox[c >> 8 & 255] << 8 ^ sbox[d & 255] ^ key[kIndex++];
            a2 = a;
            a = b;
            b = c;
            c = d;
            d = a2;
        }
        return out;
    }
};
const random = {
    getRandomValues (typedArray) {
        const words = new Uint32Array(typedArray.buffer);
        const r = (m_w)=>{
            let m_z = 0x3ade68b1;
            const mask = 0xffffffff;
            return function() {
                m_z = 0x9069 * (m_z & 0xFFFF) + (m_z >> 0x10) & mask;
                m_w = 0x4650 * (m_w & 0xFFFF) + (m_w >> 0x10) & mask;
                const result = ((m_z << 0x10) + m_w & 0xffffffff) / 0x100000000 + .5;
                return result * (Math.random() > .5 ? 1 : -1);
            };
        };
        for(let i = 0, rcache; i < typedArray.length; i += 4){
            const _r = r((rcache || Math.random()) * 0x100000000);
            rcache = _r() * 0x3ade67b7;
            words[i / 4] = _r() * 0x100000000 | 0;
        }
        return typedArray;
    }
};
const mode = {};
mode.ctrGladman = class {
    constructor(prf, iv){
        this._prf = prf;
        this._initIv = iv;
        this._iv = iv;
    }
    reset() {
        this._iv = this._initIv;
    }
    update(data) {
        return this.calculate(this._prf, data, this._iv);
    }
    incWord(word) {
        if ((word >> 24 & 0xff) === 0xff) {
            let b1 = word >> 16 & 0xff;
            let b2 = word >> 8 & 0xff;
            let b3 = word & 0xff;
            if (b1 === 0xff) {
                b1 = 0;
                if (b2 === 0xff) {
                    b2 = 0;
                    if (b3 === 0xff) {
                        b3 = 0;
                    } else {
                        ++b3;
                    }
                } else {
                    ++b2;
                }
            } else {
                ++b1;
            }
            word = 0;
            word += b1 << 16;
            word += b2 << 8;
            word += b3;
        } else {
            word += 0x01 << 24;
        }
        return word;
    }
    incCounter(counter) {
        if ((counter[0] = this.incWord(counter[0])) === 0) {
            counter[1] = this.incWord(counter[1]);
        }
    }
    calculate(prf, data, iv) {
        let l;
        if (!(l = data.length)) {
            return [];
        }
        const bl = bitArray.bitLength(data);
        for(let i = 0; i < l; i += 4){
            this.incCounter(iv);
            const e = prf.encrypt(iv);
            data[i] ^= e[0];
            data[i + 1] ^= e[1];
            data[i + 2] ^= e[2];
            data[i + 3] ^= e[3];
        }
        return bitArray.clamp(data, bl);
    }
};
const misc = {
    importKey (password) {
        return new misc.hmacSha1(codec.bytes.toBits(password));
    },
    pbkdf2 (prf, salt, count, length) {
        count = count || 10000;
        if (length < 0 || count < 0) {
            throw new Error("invalid params to pbkdf2");
        }
        const byteLength = (length >> 5) + 1 << 2;
        let u, ui, i, j, k;
        const arrayBuffer = new ArrayBuffer(byteLength);
        const out = new DataView(arrayBuffer);
        let outLength = 0;
        const b = bitArray;
        salt = codec.bytes.toBits(salt);
        for(k = 1; outLength < (byteLength || 1); k++){
            u = ui = prf.encrypt(b.concat(salt, [
                k
            ]));
            for(i = 1; i < count; i++){
                ui = prf.encrypt(ui);
                for(j = 0; j < ui.length; j++){
                    u[j] ^= ui[j];
                }
            }
            for(i = 0; outLength < (byteLength || 1) && i < u.length; i++){
                out.setInt32(outLength, u[i]);
                outLength += 4;
            }
        }
        return arrayBuffer.slice(0, length / 8);
    }
};
misc.hmacSha1 = class {
    constructor(key){
        const hmac = this;
        const Hash = hmac._hash = hash.sha1;
        const exKey = [
            [],
            []
        ];
        hmac._baseHash = [
            new Hash(),
            new Hash()
        ];
        const bs = hmac._baseHash[0].blockSize / 32;
        if (key.length > bs) {
            key = new Hash().update(key).finalize();
        }
        for(let i = 0; i < bs; i++){
            exKey[0][i] = key[i] ^ 0x36363636;
            exKey[1][i] = key[i] ^ 0x5C5C5C5C;
        }
        hmac._baseHash[0].update(exKey[0]);
        hmac._baseHash[1].update(exKey[1]);
        hmac._resultHash = new Hash(hmac._baseHash[0]);
    }
    reset() {
        const hmac = this;
        hmac._resultHash = new hmac._hash(hmac._baseHash[0]);
        hmac._updated = false;
    }
    update(data) {
        const hmac = this;
        hmac._updated = true;
        hmac._resultHash.update(data);
    }
    digest() {
        const hmac = this;
        const w = hmac._resultHash.finalize();
        const result = new hmac._hash(hmac._baseHash[1]).update(w).finalize();
        hmac.reset();
        return result;
    }
    encrypt(data) {
        if (!this._updated) {
            this.update(data);
            return this.digest(data);
        } else {
            throw new Error("encrypt on already updated hmac called!");
        }
    }
};
const GET_RANDOM_VALUES_SUPPORTED = typeof crypto != "undefined" && typeof crypto.getRandomValues == "function";
const ERR_INVALID_PASSWORD = "Invalid password";
const ERR_INVALID_SIGNATURE = "Invalid signature";
function getRandomValues(array) {
    if (GET_RANDOM_VALUES_SUPPORTED) {
        return crypto.getRandomValues(array);
    } else {
        return random.getRandomValues(array);
    }
}
const BLOCK_LENGTH = 16;
const RAW_FORMAT = "raw";
const PBKDF2_ALGORITHM = {
    name: "PBKDF2"
};
const HASH_ALGORITHM = {
    name: "HMAC"
};
const HASH_FUNCTION = "SHA-1";
const BASE_KEY_ALGORITHM = Object.assign({
    hash: HASH_ALGORITHM
}, PBKDF2_ALGORITHM);
const DERIVED_BITS_ALGORITHM = Object.assign({
    iterations: 1000,
    hash: {
        name: HASH_FUNCTION
    }
}, PBKDF2_ALGORITHM);
const DERIVED_BITS_USAGE = [
    "deriveBits"
];
const SALT_LENGTH = [
    8,
    12,
    16
];
const KEY_LENGTH = [
    16,
    24,
    32
];
const SIGNATURE_LENGTH = 10;
const COUNTER_DEFAULT_VALUE = [
    0,
    0,
    0,
    0
];
const UNDEFINED_TYPE1 = "undefined";
const FUNCTION_TYPE1 = "function";
const CRYPTO_API_SUPPORTED = typeof crypto != UNDEFINED_TYPE1;
const subtle = CRYPTO_API_SUPPORTED && crypto.subtle;
const SUBTLE_API_SUPPORTED = CRYPTO_API_SUPPORTED && typeof subtle != UNDEFINED_TYPE1;
const codecBytes = codec.bytes;
const Aes = cipher.aes;
const CtrGladman = mode.ctrGladman;
const HmacSha1 = misc.hmacSha1;
let IMPORT_KEY_SUPPORTED = CRYPTO_API_SUPPORTED && SUBTLE_API_SUPPORTED && typeof subtle.importKey == FUNCTION_TYPE1;
let DERIVE_BITS_SUPPORTED = CRYPTO_API_SUPPORTED && SUBTLE_API_SUPPORTED && typeof subtle.deriveBits == FUNCTION_TYPE1;
class AESDecryptionStream extends TransformStream {
    constructor({ password , signed , encryptionStrength  }){
        super({
            start () {
                Object.assign(this, {
                    ready: new Promise((resolve)=>this.resolveReady = resolve),
                    password,
                    signed,
                    strength: encryptionStrength - 1,
                    pending: new Uint8Array()
                });
            },
            async transform (chunk, controller) {
                const aesCrypto = this;
                const { password , strength , resolveReady , ready  } = aesCrypto;
                if (password) {
                    await createDecryptionKeys(aesCrypto, strength, password, subarray(chunk, 0, SALT_LENGTH[strength] + 2));
                    chunk = subarray(chunk, SALT_LENGTH[strength] + 2);
                    resolveReady();
                } else {
                    await ready;
                }
                const output = new Uint8Array(chunk.length - 10 - (chunk.length - 10) % 16);
                controller.enqueue(append(aesCrypto, chunk, output, 0, 10, true));
            },
            async flush (controller) {
                const { signed , ctr , hmac , pending , ready  } = this;
                await ready;
                const chunkToDecrypt = subarray(pending, 0, pending.length - 10);
                const originalSignature = subarray(pending, pending.length - 10);
                let decryptedChunkArray = new Uint8Array();
                if (chunkToDecrypt.length) {
                    const encryptedChunk = toBits(codecBytes, chunkToDecrypt);
                    hmac.update(encryptedChunk);
                    const decryptedChunk = ctr.update(encryptedChunk);
                    decryptedChunkArray = fromBits(codecBytes, decryptedChunk);
                }
                if (signed) {
                    const signature = subarray(fromBits(codecBytes, hmac.digest()), 0, 10);
                    for(let indexSignature = 0; indexSignature < 10; indexSignature++){
                        if (signature[indexSignature] != originalSignature[indexSignature]) {
                            throw new Error(ERR_INVALID_SIGNATURE);
                        }
                    }
                }
                controller.enqueue(decryptedChunkArray);
            }
        });
    }
}
class AESEncryptionStream extends TransformStream {
    constructor({ password , encryptionStrength  }){
        let stream;
        super({
            start () {
                Object.assign(this, {
                    ready: new Promise((resolve)=>this.resolveReady = resolve),
                    password,
                    strength: encryptionStrength - 1,
                    pending: new Uint8Array()
                });
            },
            async transform (chunk, controller) {
                const aesCrypto = this;
                const { password , strength , resolveReady , ready  } = aesCrypto;
                let preamble = new Uint8Array();
                if (password) {
                    preamble = await createEncryptionKeys(aesCrypto, strength, password);
                    resolveReady();
                } else {
                    await ready;
                }
                const output = new Uint8Array(preamble.length + chunk.length - chunk.length % 16);
                output.set(preamble, 0);
                controller.enqueue(append(aesCrypto, chunk, output, preamble.length, 0));
            },
            async flush (controller) {
                const { ctr , hmac , pending , ready  } = this;
                await ready;
                let encryptedChunkArray = new Uint8Array();
                if (pending.length) {
                    const encryptedChunk = ctr.update(toBits(codecBytes, pending));
                    hmac.update(encryptedChunk);
                    encryptedChunkArray = fromBits(codecBytes, encryptedChunk);
                }
                stream.signature = fromBits(codecBytes, hmac.digest()).slice(0, SIGNATURE_LENGTH);
                controller.enqueue(concat(encryptedChunkArray, stream.signature));
            }
        });
        stream = this;
    }
}
function append(aesCrypto, input, output, paddingStart, paddingEnd, verifySignature) {
    const { ctr , hmac , pending  } = aesCrypto;
    const inputLength = input.length - paddingEnd;
    if (pending.length) {
        input = concat(pending, input);
        output = expand(output, inputLength - inputLength % BLOCK_LENGTH);
    }
    let offset;
    for(offset = 0; offset <= inputLength - 16; offset += BLOCK_LENGTH){
        const inputChunk = toBits(codecBytes, subarray(input, offset, offset + 16));
        if (verifySignature) {
            hmac.update(inputChunk);
        }
        const outputChunk = ctr.update(inputChunk);
        if (!verifySignature) {
            hmac.update(outputChunk);
        }
        output.set(fromBits(codecBytes, outputChunk), offset + paddingStart);
    }
    aesCrypto.pending = subarray(input, offset);
    return output;
}
async function createDecryptionKeys(decrypt, strength, password, preamble) {
    const passwordVerificationKey = await createKeys(decrypt, strength, password, subarray(preamble, 0, SALT_LENGTH[strength]));
    const passwordVerification = subarray(preamble, SALT_LENGTH[strength]);
    if (passwordVerificationKey[0] != passwordVerification[0] || passwordVerificationKey[1] != passwordVerification[1]) {
        throw new Error(ERR_INVALID_PASSWORD);
    }
}
async function createEncryptionKeys(encrypt, strength, password) {
    const salt = getRandomValues(new Uint8Array(SALT_LENGTH[strength]));
    const passwordVerification = await createKeys(encrypt, strength, password, salt);
    return concat(salt, passwordVerification);
}
async function createKeys(aesCrypto, strength, password, salt) {
    aesCrypto.password = null;
    const encodedPassword = encodeText(password);
    const baseKey = await importKey(RAW_FORMAT, encodedPassword, BASE_KEY_ALGORITHM, false, DERIVED_BITS_USAGE);
    const derivedBits = await deriveBits(Object.assign({
        salt
    }, DERIVED_BITS_ALGORITHM), baseKey, 8 * (KEY_LENGTH[strength] * 2 + 2));
    const compositeKey = new Uint8Array(derivedBits);
    const key = toBits(codecBytes, subarray(compositeKey, 0, KEY_LENGTH[strength]));
    const authentication = toBits(codecBytes, subarray(compositeKey, KEY_LENGTH[strength], KEY_LENGTH[strength] * 2));
    const passwordVerification = subarray(compositeKey, KEY_LENGTH[strength] * 2);
    Object.assign(aesCrypto, {
        keys: {
            key,
            authentication,
            passwordVerification
        },
        ctr: new CtrGladman(new Aes(key), Array.from(COUNTER_DEFAULT_VALUE)),
        hmac: new HmacSha1(authentication)
    });
    return passwordVerification;
}
async function importKey(format, password, algorithm, extractable, keyUsages) {
    if (IMPORT_KEY_SUPPORTED) {
        try {
            return await subtle.importKey(format, password, algorithm, extractable, keyUsages);
        } catch (_error) {
            IMPORT_KEY_SUPPORTED = false;
            return misc.importKey(password);
        }
    } else {
        return misc.importKey(password);
    }
}
async function deriveBits(algorithm, baseKey, length) {
    if (DERIVE_BITS_SUPPORTED) {
        try {
            return await subtle.deriveBits(algorithm, baseKey, length);
        } catch (_error) {
            DERIVE_BITS_SUPPORTED = false;
            return misc.pbkdf2(baseKey, algorithm.salt, DERIVED_BITS_ALGORITHM.iterations, length);
        }
    } else {
        return misc.pbkdf2(baseKey, algorithm.salt, DERIVED_BITS_ALGORITHM.iterations, length);
    }
}
function concat(leftArray, rightArray) {
    let array = leftArray;
    if (leftArray.length + rightArray.length) {
        array = new Uint8Array(leftArray.length + rightArray.length);
        array.set(leftArray, 0);
        array.set(rightArray, leftArray.length);
    }
    return array;
}
function expand(inputArray, length) {
    if (length && length > inputArray.length) {
        const array = inputArray;
        inputArray = new Uint8Array(length);
        inputArray.set(array, 0);
    }
    return inputArray;
}
function subarray(array, begin, end) {
    return array.subarray(begin, end);
}
function fromBits(codecBytes, chunk) {
    return codecBytes.fromBits(chunk);
}
function toBits(codecBytes, chunk) {
    return codecBytes.toBits(chunk);
}
const HEADER_LENGTH = 12;
class ZipCryptoDecryptionStream extends TransformStream {
    constructor({ password , passwordVerification  }){
        super({
            start () {
                Object.assign(this, {
                    password,
                    passwordVerification
                });
                createKeys1(this, password);
            },
            transform (chunk, controller) {
                const zipCrypto = this;
                if (zipCrypto.password) {
                    const decryptedHeader = decrypt(zipCrypto, chunk.subarray(0, 12));
                    zipCrypto.password = null;
                    if (decryptedHeader[12 - 1] != zipCrypto.passwordVerification) {
                        throw new Error(ERR_INVALID_PASSWORD);
                    }
                    chunk = chunk.subarray(HEADER_LENGTH);
                }
                controller.enqueue(decrypt(zipCrypto, chunk));
            }
        });
    }
}
class ZipCryptoEncryptionStream extends TransformStream {
    constructor({ password , passwordVerification  }){
        super({
            start () {
                Object.assign(this, {
                    password,
                    passwordVerification
                });
                createKeys1(this, password);
            },
            transform (chunk, controller) {
                const zipCrypto = this;
                let output;
                let offset;
                if (zipCrypto.password) {
                    zipCrypto.password = null;
                    const header = getRandomValues(new Uint8Array(12));
                    header[HEADER_LENGTH - 1] = zipCrypto.passwordVerification;
                    output = new Uint8Array(chunk.length + header.length);
                    output.set(encrypt(zipCrypto, header), 0);
                    offset = HEADER_LENGTH;
                } else {
                    output = new Uint8Array(chunk.length);
                    offset = 0;
                }
                output.set(encrypt(zipCrypto, chunk), offset);
                controller.enqueue(output);
            }
        });
    }
}
function decrypt(target, input) {
    const output = new Uint8Array(input.length);
    for(let index = 0; index < input.length; index++){
        output[index] = getByte(target) ^ input[index];
        updateKeys(target, output[index]);
    }
    return output;
}
function encrypt(target, input) {
    const output = new Uint8Array(input.length);
    for(let index = 0; index < input.length; index++){
        output[index] = getByte(target) ^ input[index];
        updateKeys(target, input[index]);
    }
    return output;
}
function createKeys1(target, password) {
    const keys = [
        0x12345678,
        0x23456789,
        0x34567890
    ];
    Object.assign(target, {
        keys,
        crcKey0: new Crc32(keys[0]),
        crcKey2: new Crc32(keys[2])
    });
    for(let index = 0; index < password.length; index++){
        updateKeys(target, password.charCodeAt(index));
    }
}
function updateKeys(target, __byte) {
    let [key0, key1, key2] = target.keys;
    target.crcKey0.append([
        __byte
    ]);
    key0 = ~target.crcKey0.get();
    key1 = getInt32(Math.imul(getInt32(key1 + getInt8(key0)), 134775813) + 1);
    target.crcKey2.append([
        key1 >>> 24
    ]);
    key2 = ~target.crcKey2.get();
    target.keys = [
        key0,
        key1,
        key2
    ];
}
function getByte(target) {
    const temp = target.keys[2] | 2;
    return getInt8(Math.imul(temp, temp ^ 1) >>> 8);
}
function getInt8(number) {
    return number & 0xFF;
}
function getInt32(number) {
    return number & 0xFFFFFFFF;
}
const COMPRESSION_FORMAT = "deflate-raw";
class DeflateStream extends TransformStream {
    constructor(options, { chunkSize , CompressionStream: CompressionStream1 , CompressionStreamNative  }){
        super({});
        const { compressed , encrypted , useCompressionStream , zipCrypto , signed , level  } = options;
        const stream = this;
        let crc32Stream, encryptionStream;
        let readable = filterEmptyChunks(super.readable);
        if ((!encrypted || zipCrypto) && signed) {
            [readable, crc32Stream] = readable.tee();
            crc32Stream = pipeThrough(crc32Stream, new Crc32Stream());
        }
        if (compressed) {
            readable = pipeThroughCommpressionStream(readable, useCompressionStream, {
                level,
                chunkSize
            }, CompressionStreamNative, CompressionStream1);
        }
        if (encrypted) {
            if (zipCrypto) {
                readable = pipeThrough(readable, new ZipCryptoEncryptionStream(options));
            } else {
                encryptionStream = new AESEncryptionStream(options);
                readable = pipeThrough(readable, encryptionStream);
            }
        }
        setReadable(stream, readable, async ()=>{
            let signature;
            if (encrypted && !zipCrypto) {
                signature = encryptionStream.signature;
            }
            if ((!encrypted || zipCrypto) && signed) {
                signature = await crc32Stream.getReader().read();
                signature = new DataView(signature.value.buffer).getUint32(0);
            }
            stream.signature = signature;
        });
    }
}
class InflateStream extends TransformStream {
    constructor(options, { chunkSize , DecompressionStream: DecompressionStream1 , DecompressionStreamNative  }){
        super({});
        const { zipCrypto , encrypted , signed , signature , compressed , useCompressionStream  } = options;
        let crc32Stream, decryptionStream;
        let readable = filterEmptyChunks(super.readable);
        if (encrypted) {
            if (zipCrypto) {
                readable = pipeThrough(readable, new ZipCryptoDecryptionStream(options));
            } else {
                decryptionStream = new AESDecryptionStream(options);
                readable = pipeThrough(readable, decryptionStream);
            }
        }
        if (compressed) {
            readable = pipeThroughCommpressionStream(readable, useCompressionStream, {
                chunkSize
            }, DecompressionStreamNative, DecompressionStream1);
        }
        if ((!encrypted || zipCrypto) && signed) {
            [readable, crc32Stream] = readable.tee();
            crc32Stream = pipeThrough(crc32Stream, new Crc32Stream());
        }
        setReadable(this, readable, async ()=>{
            if ((!encrypted || zipCrypto) && signed) {
                const streamSignature = await crc32Stream.getReader().read();
                const dataViewSignature = new DataView(streamSignature.value.buffer);
                if (signature != dataViewSignature.getUint32(0, false)) {
                    throw new Error(ERR_INVALID_SIGNATURE);
                }
            }
        });
    }
}
function filterEmptyChunks(readable) {
    return pipeThrough(readable, new TransformStream({
        transform (chunk, controller) {
            if (chunk && chunk.length) {
                controller.enqueue(chunk);
            }
        }
    }));
}
function setReadable(stream, readable, flush) {
    readable = pipeThrough(readable, new TransformStream({
        flush
    }));
    Object.defineProperty(stream, "readable", {
        get () {
            return readable;
        }
    });
}
function pipeThroughCommpressionStream(readable, useCompressionStream, options, CodecStreamNative, CodecStream) {
    try {
        const CompressionStream1 = useCompressionStream && CodecStreamNative ? CodecStreamNative : CodecStream;
        readable = pipeThrough(readable, new CompressionStream1(COMPRESSION_FORMAT, options));
    } catch (error) {
        if (useCompressionStream) {
            readable = pipeThrough(readable, new CodecStream(COMPRESSION_FORMAT, options));
        } else {
            throw error;
        }
    }
    return readable;
}
function pipeThrough(readable, transformStream) {
    return readable.pipeThrough(transformStream);
}
const MESSAGE_EVENT_TYPE = "message";
const MESSAGE_START = "start";
const MESSAGE_PULL = "pull";
const MESSAGE_DATA = "data";
const MESSAGE_ACK_DATA = "ack";
const MESSAGE_CLOSE = "close";
const CODEC_DEFLATE = "deflate";
const CODEC_INFLATE = "inflate";
class CodecStream extends TransformStream {
    constructor(options, config){
        super({});
        const codec = this;
        const { codecType  } = options;
        let Stream;
        if (codecType.startsWith(CODEC_DEFLATE)) {
            Stream = DeflateStream;
        } else if (codecType.startsWith(CODEC_INFLATE)) {
            Stream = InflateStream;
        }
        let size = 0;
        const stream = new Stream(options, config);
        const readable = super.readable;
        const transformStream = new TransformStream({
            transform (chunk, controller) {
                if (chunk && chunk.length) {
                    size += chunk.length;
                    controller.enqueue(chunk);
                }
            },
            flush () {
                const { signature  } = stream;
                Object.assign(codec, {
                    signature,
                    size
                });
            }
        });
        Object.defineProperty(codec, "readable", {
            get () {
                return readable.pipeThrough(stream).pipeThrough(transformStream);
            }
        });
    }
}
const WEB_WORKERS_SUPPORTED = typeof Worker != UNDEFINED_TYPE;
class CodecWorker {
    constructor(workerData, { readable , writable  }, { options , config , streamOptions , useWebWorkers , transferStreams , scripts  }, onTaskFinished){
        const { signal  } = streamOptions;
        Object.assign(workerData, {
            busy: true,
            readable: readable.pipeThrough(new ProgressWatcherStream(readable, streamOptions, config), {
                signal
            }),
            writable,
            options: Object.assign({}, options),
            scripts,
            transferStreams,
            terminate () {
                const { worker , busy  } = workerData;
                if (worker && !busy) {
                    worker.terminate();
                    workerData.interface = null;
                }
            },
            onTaskFinished () {
                workerData.busy = false;
                onTaskFinished(workerData);
            }
        });
        return (useWebWorkers && WEB_WORKERS_SUPPORTED ? createWebWorkerInterface : createWorkerInterface)(workerData, config);
    }
}
class ProgressWatcherStream extends TransformStream {
    constructor(readableSource, { onstart , onprogress , size , onend  }, { chunkSize  }){
        let chunkOffset = 0;
        super({
            start () {
                if (onstart) {
                    callHandler(onstart, size);
                }
            },
            async transform (chunk, controller) {
                chunkOffset += chunk.length;
                if (onprogress) {
                    await callHandler(onprogress, chunkOffset, size);
                }
                controller.enqueue(chunk);
            },
            flush () {
                readableSource.size = chunkOffset;
                if (onend) {
                    callHandler(onend, chunkOffset);
                }
            }
        }, {
            highWaterMark: 1,
            size: ()=>chunkSize
        });
    }
}
async function callHandler(handler, ...parameters) {
    try {
        await handler(...parameters);
    } catch (_error) {}
}
function createWorkerInterface(workerData, config) {
    return {
        run: ()=>runWorker(workerData, config)
    };
}
function createWebWorkerInterface(workerData, { baseURL , chunkSize  }) {
    if (!workerData.interface) {
        Object.assign(workerData, {
            worker: getWebWorker(workerData.scripts[0], baseURL, workerData),
            interface: {
                run: ()=>runWebWorker(workerData, {
                        chunkSize
                    })
            }
        });
    }
    return workerData.interface;
}
async function runWorker({ options , readable , writable , onTaskFinished  }, config) {
    const codecStream = new CodecStream(options, config);
    try {
        await readable.pipeThrough(codecStream).pipeTo(writable, {
            preventClose: true,
            preventAbort: true
        });
        const { signature , size  } = codecStream;
        return {
            signature,
            size
        };
    } finally{
        onTaskFinished();
    }
}
async function runWebWorker(workerData, config) {
    let resolveResult, rejectResult;
    const result = new Promise((resolve, reject)=>{
        resolveResult = resolve;
        rejectResult = reject;
    });
    Object.assign(workerData, {
        reader: null,
        writer: null,
        resolveResult,
        rejectResult,
        result
    });
    const { readable , options , scripts  } = workerData;
    const { writable , closed  } = watchClosedStream(workerData.writable);
    const streamsTransferred = sendMessage({
        type: MESSAGE_START,
        scripts: scripts.slice(1),
        options,
        config,
        readable,
        writable
    }, workerData);
    if (!streamsTransferred) {
        Object.assign(workerData, {
            reader: readable.getReader(),
            writer: writable.getWriter()
        });
    }
    const resultValue = await result;
    try {
        await writable.close();
    } catch (_error) {}
    await closed;
    return resultValue;
}
function watchClosedStream(writableSource) {
    const writer = writableSource.getWriter();
    let resolveStreamClosed;
    const closed = new Promise((resolve)=>resolveStreamClosed = resolve);
    const writable = new WritableStream({
        async write (chunk) {
            await writer.ready;
            await writer.write(chunk);
        },
        close () {
            writer.releaseLock();
            resolveStreamClosed();
        },
        abort (reason) {
            return writer.abort(reason);
        }
    });
    return {
        writable,
        closed
    };
}
let classicWorkersSupported = true;
let transferStreamsSupported = true;
function getWebWorker(url, baseURL, workerData) {
    const workerOptions = {
        type: "module"
    };
    let scriptUrl, worker;
    if (typeof url == FUNCTION_TYPE) {
        url = url();
    }
    try {
        scriptUrl = new URL(url, baseURL);
    } catch (_error) {
        scriptUrl = url;
    }
    if (classicWorkersSupported) {
        try {
            worker = new Worker(scriptUrl);
        } catch (_error) {
            classicWorkersSupported = false;
            worker = new Worker(scriptUrl, workerOptions);
        }
    } else {
        worker = new Worker(scriptUrl, workerOptions);
    }
    worker.addEventListener(MESSAGE_EVENT_TYPE, (event)=>onMessage(event, workerData));
    return worker;
}
function sendMessage(message, { worker , writer , onTaskFinished , transferStreams  }) {
    try {
        let { value , readable , writable  } = message;
        const transferables = [];
        if (value) {
            const { buffer , length  } = value;
            if (length != buffer.byteLength) {
                value = new Uint8Array(value);
            }
            message.value = value.buffer;
            transferables.push(message.value);
        }
        if (transferStreams && transferStreamsSupported) {
            if (readable) {
                transferables.push(readable);
            }
            if (writable) {
                transferables.push(writable);
            }
        } else {
            message.readable = message.writable = null;
        }
        if (transferables.length) {
            try {
                worker.postMessage(message, transferables);
                return true;
            } catch (_error) {
                transferStreamsSupported = false;
                message.readable = message.writable = null;
                worker.postMessage(message);
            }
        } else {
            worker.postMessage(message);
        }
    } catch (error) {
        if (writer) {
            writer.releaseLock();
        }
        onTaskFinished();
        throw error;
    }
}
async function onMessage({ data  }, workerData) {
    const { type , value , messageId , result , error  } = data;
    const { reader , writer , resolveResult , rejectResult , onTaskFinished  } = workerData;
    try {
        if (error) {
            const { message , stack , code , name  } = error;
            const responseError = new Error(message);
            Object.assign(responseError, {
                stack,
                code,
                name
            });
            close(responseError);
        } else {
            if (type == MESSAGE_PULL) {
                const { value , done  } = await reader.read();
                sendMessage({
                    type: MESSAGE_DATA,
                    value,
                    done,
                    messageId
                }, workerData);
            }
            if (type == MESSAGE_DATA) {
                await writer.ready;
                await writer.write(new Uint8Array(value));
                sendMessage({
                    type: MESSAGE_ACK_DATA,
                    messageId
                }, workerData);
            }
            if (type == MESSAGE_CLOSE) {
                close(null, result);
            }
        }
    } catch (error) {
        close(error);
    }
    function close(error, result) {
        if (error) {
            rejectResult(error);
        } else {
            resolveResult(result);
        }
        if (writer) {
            writer.releaseLock();
        }
        onTaskFinished();
    }
}
let pool = [];
const pendingRequests = [];
let indexWorker = 0;
async function runWorker1(stream, workerOptions) {
    const { options , config  } = workerOptions;
    const { transferStreams , useWebWorkers , useCompressionStream , codecType , compressed , signed , encrypted  } = options;
    const { workerScripts , maxWorkers , terminateWorkerTimeout  } = config;
    workerOptions.transferStreams = transferStreams || transferStreams === UNDEFINED_VALUE;
    const streamCopy = !compressed && !signed && !encrypted && !workerOptions.transferStreams;
    workerOptions.useWebWorkers = !streamCopy && (useWebWorkers || useWebWorkers === UNDEFINED_VALUE && config.useWebWorkers);
    workerOptions.scripts = workerOptions.useWebWorkers && workerScripts ? workerScripts[codecType] : [];
    options.useCompressionStream = useCompressionStream || useCompressionStream === UNDEFINED_VALUE && config.useCompressionStream;
    let worker;
    const workerData = pool.find((workerData)=>!workerData.busy);
    if (workerData) {
        clearTerminateTimeout(workerData);
        worker = new CodecWorker(workerData, stream, workerOptions, onTaskFinished);
    } else if (pool.length < maxWorkers) {
        const workerData = {
            indexWorker
        };
        indexWorker++;
        pool.push(workerData);
        worker = new CodecWorker(workerData, stream, workerOptions, onTaskFinished);
    } else {
        worker = await new Promise((resolve)=>pendingRequests.push({
                resolve,
                stream,
                workerOptions
            }));
    }
    return worker.run();
    function onTaskFinished(workerData) {
        if (pendingRequests.length) {
            const [{ resolve , stream , workerOptions  }] = pendingRequests.splice(0, 1);
            resolve(new CodecWorker(workerData, stream, workerOptions, onTaskFinished));
        } else if (workerData.worker) {
            clearTerminateTimeout(workerData);
            if (Number.isFinite(terminateWorkerTimeout) && terminateWorkerTimeout >= 0) {
                workerData.terminateTimeout = setTimeout(()=>{
                    pool = pool.filter((data)=>data != workerData);
                    workerData.terminate();
                }, terminateWorkerTimeout);
            }
        } else {
            pool = pool.filter((data)=>data != workerData);
        }
    }
}
function clearTerminateTimeout(workerData) {
    const { terminateTimeout  } = workerData;
    if (terminateTimeout) {
        clearTimeout(terminateTimeout);
        workerData.terminateTimeout = null;
    }
}
function e(e) {
    const t = ()=>URL.createObjectURL(new Blob([
            'const{Array:e,Object:t,Number:n,Math:r,Error:s,Uint8Array:i,Uint16Array:o,Uint32Array:c,Int32Array:f,Map:a,DataView:l,Promise:u,TextEncoder:w,crypto:h,postMessage:d,TransformStream:p,ReadableStream:y,WritableStream:m,CompressionStream:b,DecompressionStream:g}=self;class k{constructor(e){return class extends p{constructor(t,n){const r=new e(n);super({transform(e,t){t.enqueue(r.append(e))},flush(e){const t=r.flush();t&&e.enqueue(t)}})}}}}const v=[];for(let e=0;256>e;e++){let t=e;for(let e=0;8>e;e++)1&t?t=t>>>1^3988292384:t>>>=1;v[e]=t}class S{constructor(e){this.t=e||-1}append(e){let t=0|this.t;for(let n=0,r=0|e.length;r>n;n++)t=t>>>8^v[255&(t^e[n])];this.t=t}get(){return~this.t}}class z extends p{constructor(){const e=new S;super({transform(t){e.append(t)},flush(t){const n=new i(4);new l(n.buffer).setUint32(0,e.get()),t.enqueue(n)}})}}const C={concat(e,t){if(0===e.length||0===t.length)return e.concat(t);const n=e[e.length-1],r=C.i(n);return 32===r?e.concat(t):C.o(t,r,0|n,e.slice(0,e.length-1))},l(e){const t=e.length;if(0===t)return 0;const n=e[t-1];return 32*(t-1)+C.i(n)},u(e,t){if(32*e.length<t)return e;const n=(e=e.slice(0,r.ceil(t/32))).length;return t&=31,n>0&&t&&(e[n-1]=C.h(t,e[n-1]&2147483648>>t-1,1)),e},h:(e,t,n)=>32===e?t:(n?0|t:t<<32-e)+1099511627776*e,i:e=>r.round(e/1099511627776)||32,o(e,t,n,r){for(void 0===r&&(r=[]);t>=32;t-=32)r.push(n),n=0;if(0===t)return r.concat(e);for(let s=0;s<e.length;s++)r.push(n|e[s]>>>t),n=e[s]<<32-t;const s=e.length?e[e.length-1]:0,i=C.i(s);return r.push(C.h(t+i&31,t+i>32?n:r.pop(),1)),r}},x={p:{m(e){const t=C.l(e)/8,n=new i(t);let r;for(let s=0;t>s;s++)0==(3&s)&&(r=e[s/4]),n[s]=r>>>24,r<<=8;return n},g(e){const t=[];let n,r=0;for(n=0;n<e.length;n++)r=r<<8|e[n],3==(3&n)&&(t.push(r),r=0);return 3&n&&t.push(C.h(8*(3&n),r)),t}}},_=class{constructor(e){const t=this;t.blockSize=512,t.k=[1732584193,4023233417,2562383102,271733878,3285377520],t.v=[1518500249,1859775393,2400959708,3395469782],e?(t.S=e.S.slice(0),t.C=e.C.slice(0),t._=e._):t.reset()}reset(){const e=this;return e.S=e.k.slice(0),e.C=[],e._=0,e}update(e){const t=this;"string"==typeof e&&(e=x.A.g(e));const n=t.C=C.concat(t.C,e),r=t._,i=t._=r+C.l(e);if(i>9007199254740991)throw new s("Cannot hash more than 2^53 - 1 bits");const o=new c(n);let f=0;for(let e=t.blockSize+r-(t.blockSize+r&t.blockSize-1);i>=e;e+=t.blockSize)t.I(o.subarray(16*f,16*(f+1))),f+=1;return n.splice(0,16*f),t}D(){const e=this;let t=e.C;const n=e.S;t=C.concat(t,[C.h(1,1)]);for(let e=t.length+2;15&e;e++)t.push(0);for(t.push(r.floor(e._/4294967296)),t.push(0|e._);t.length;)e.I(t.splice(0,16));return e.reset(),n}V(e,t,n,r){return e>19?e>39?e>59?e>79?void 0:t^n^r:t&n|t&r|n&r:t^n^r:t&n|~t&r}R(e,t){return t<<e|t>>>32-e}I(t){const n=this,s=n.S,i=e(80);for(let e=0;16>e;e++)i[e]=t[e];let o=s[0],c=s[1],f=s[2],a=s[3],l=s[4];for(let e=0;79>=e;e++){16>e||(i[e]=n.R(1,i[e-3]^i[e-8]^i[e-14]^i[e-16]));const t=n.R(5,o)+n.V(e,c,f,a)+l+i[e]+n.v[r.floor(e/20)]|0;l=a,a=f,f=n.R(30,c),c=o,o=t}s[0]=s[0]+o|0,s[1]=s[1]+c|0,s[2]=s[2]+f|0,s[3]=s[3]+a|0,s[4]=s[4]+l|0}},A={getRandomValues(e){const t=new c(e.buffer),n=e=>{let t=987654321;const n=4294967295;return()=>(t=36969*(65535&t)+(t>>16)&n,(((t<<16)+(e=18e3*(65535&e)+(e>>16)&n)&n)/4294967296+.5)*(r.random()>.5?1:-1))};for(let s,i=0;i<e.length;i+=4){const e=n(4294967296*(s||r.random()));s=987654071*e(),t[i/4]=4294967296*e()|0}return e}},I={importKey:e=>new I.B(x.p.g(e)),M(e,t,n,r){if(n=n||1e4,0>r||0>n)throw new s("invalid params to pbkdf2");const i=1+(r>>5)<<2;let o,c,f,a,u;const w=new ArrayBuffer(i),h=new l(w);let d=0;const p=C;for(t=x.p.g(t),u=1;(i||1)>d;u++){for(o=c=e.encrypt(p.concat(t,[u])),f=1;n>f;f++)for(c=e.encrypt(c),a=0;a<c.length;a++)o[a]^=c[a];for(f=0;(i||1)>d&&f<o.length;f++)h.setInt32(d,o[f]),d+=4}return w.slice(0,r/8)},B:class{constructor(e){const t=this,n=t.K=_,r=[[],[]];t.P=[new n,new n];const s=t.P[0].blockSize/32;e.length>s&&(e=(new n).update(e).D());for(let t=0;s>t;t++)r[0][t]=909522486^e[t],r[1][t]=1549556828^e[t];t.P[0].update(r[0]),t.P[1].update(r[1]),t.U=new n(t.P[0])}reset(){const e=this;e.U=new e.K(e.P[0]),e.N=!1}update(e){this.N=!0,this.U.update(e)}digest(){const e=this,t=e.U.D(),n=new e.K(e.P[1]).update(t).D();return e.reset(),n}encrypt(e){if(this.N)throw new s("encrypt on already updated hmac called!");return this.update(e),this.digest(e)}}},D=void 0!==h&&"function"==typeof h.getRandomValues,V="Invalid password",R="Invalid signature";function B(e){return D?h.getRandomValues(e):A.getRandomValues(e)}const E=16,M={name:"PBKDF2"},K=t.assign({hash:{name:"HMAC"}},M),P=t.assign({iterations:1e3,hash:{name:"SHA-1"}},M),U=["deriveBits"],N=[8,12,16],T=[16,24,32],W=10,H=[0,0,0,0],L="undefined",j="function",F=typeof h!=L,O=F&&h.subtle,q=F&&typeof O!=L,G=x.p,J=class{constructor(e){const t=this;t.T=[[[],[],[],[],[]],[[],[],[],[],[]]],t.T[0][0][0]||t.W();const n=t.T[0][4],r=t.T[1],i=e.length;let o,c,f,a=1;if(4!==i&&6!==i&&8!==i)throw new s("invalid aes key size");for(t.v=[c=e.slice(0),f=[]],o=i;4*i+28>o;o++){let e=c[o-1];(o%i==0||8===i&&o%i==4)&&(e=n[e>>>24]<<24^n[e>>16&255]<<16^n[e>>8&255]<<8^n[255&e],o%i==0&&(e=e<<8^e>>>24^a<<24,a=a<<1^283*(a>>7))),c[o]=c[o-i]^e}for(let e=0;o;e++,o--){const t=c[3&e?o:o-4];f[e]=4>=o||4>e?t:r[0][n[t>>>24]]^r[1][n[t>>16&255]]^r[2][n[t>>8&255]]^r[3][n[255&t]]}}encrypt(e){return this.H(e,0)}decrypt(e){return this.H(e,1)}W(){const e=this.T[0],t=this.T[1],n=e[4],r=t[4],s=[],i=[];let o,c,f,a;for(let e=0;256>e;e++)i[(s[e]=e<<1^283*(e>>7))^e]=e;for(let l=o=0;!n[l];l^=c||1,o=i[o]||1){let i=o^o<<1^o<<2^o<<3^o<<4;i=i>>8^255&i^99,n[l]=i,r[i]=l,a=s[f=s[c=s[l]]];let u=16843009*a^65537*f^257*c^16843008*l,w=257*s[i]^16843008*i;for(let n=0;4>n;n++)e[n][l]=w=w<<24^w>>>8,t[n][i]=u=u<<24^u>>>8}for(let n=0;5>n;n++)e[n]=e[n].slice(0),t[n]=t[n].slice(0)}H(e,t){if(4!==e.length)throw new s("invalid aes block size");const n=this.v[t],r=n.length/4-2,i=[0,0,0,0],o=this.T[t],c=o[0],f=o[1],a=o[2],l=o[3],u=o[4];let w,h,d,p=e[0]^n[0],y=e[t?3:1]^n[1],m=e[2]^n[2],b=e[t?1:3]^n[3],g=4;for(let e=0;r>e;e++)w=c[p>>>24]^f[y>>16&255]^a[m>>8&255]^l[255&b]^n[g],h=c[y>>>24]^f[m>>16&255]^a[b>>8&255]^l[255&p]^n[g+1],d=c[m>>>24]^f[b>>16&255]^a[p>>8&255]^l[255&y]^n[g+2],b=c[b>>>24]^f[p>>16&255]^a[y>>8&255]^l[255&m]^n[g+3],g+=4,p=w,y=h,m=d;for(let e=0;4>e;e++)i[t?3&-e:e]=u[p>>>24]<<24^u[y>>16&255]<<16^u[m>>8&255]<<8^u[255&b]^n[g++],w=p,p=y,y=m,m=b,b=w;return i}},Q=class{constructor(e,t){this.L=e,this.j=t,this.F=t}reset(){this.F=this.j}update(e){return this.O(this.L,e,this.F)}q(e){if(255==(e>>24&255)){let t=e>>16&255,n=e>>8&255,r=255&e;255===t?(t=0,255===n?(n=0,255===r?r=0:++r):++n):++t,e=0,e+=t<<16,e+=n<<8,e+=r}else e+=1<<24;return e}G(e){0===(e[0]=this.q(e[0]))&&(e[1]=this.q(e[1]))}O(e,t,n){let r;if(!(r=t.length))return[];const s=C.l(t);for(let s=0;r>s;s+=4){this.G(n);const r=e.encrypt(n);t[s]^=r[0],t[s+1]^=r[1],t[s+2]^=r[2],t[s+3]^=r[3]}return C.u(t,s)}},X=I.B;let Y=F&&q&&typeof O.importKey==j,Z=F&&q&&typeof O.deriveBits==j;class $ extends p{constructor({password:e,signed:n,encryptionStrength:r}){super({start(){t.assign(this,{ready:new u((e=>this.J=e)),password:e,signed:n,X:r-1,pending:new i})},async transform(e,t){const n=this,{password:r,X:o,J:c,ready:f}=n;r?(await(async(e,t,n,r)=>{const i=await ne(e,t,n,se(r,0,N[t])),o=se(r,N[t]);if(i[0]!=o[0]||i[1]!=o[1])throw new s(V)})(n,o,r,se(e,0,N[o]+2)),e=se(e,N[o]+2),c()):await f;const a=new i(e.length-W-(e.length-W)%E);t.enqueue(te(n,e,a,0,W,!0))},async flush(e){const{signed:t,Y:n,Z:r,pending:o,ready:c}=this;await c;const f=se(o,0,o.length-W),a=se(o,o.length-W);let l=new i;if(f.length){const e=oe(G,f);r.update(e);const t=n.update(e);l=ie(G,t)}if(t){const e=se(ie(G,r.digest()),0,W);for(let t=0;W>t;t++)if(e[t]!=a[t])throw new s(R)}e.enqueue(l)}})}}class ee extends p{constructor({password:e,encryptionStrength:n}){let r;super({start(){t.assign(this,{ready:new u((e=>this.J=e)),password:e,X:n-1,pending:new i})},async transform(e,t){const n=this,{password:r,X:s,J:o,ready:c}=n;let f=new i;r?(f=await(async(e,t,n)=>{const r=B(new i(N[t]));return re(r,await ne(e,t,n,r))})(n,s,r),o()):await c;const a=new i(f.length+e.length-e.length%E);a.set(f,0),t.enqueue(te(n,e,a,f.length,0))},async flush(e){const{Y:t,Z:n,pending:s,ready:o}=this;await o;let c=new i;if(s.length){const e=t.update(oe(G,s));n.update(e),c=ie(G,e)}r.signature=ie(G,n.digest()).slice(0,W),e.enqueue(re(c,r.signature))}}),r=this}}function te(e,t,n,r,s,o){const{Y:c,Z:f,pending:a}=e,l=t.length-s;let u;for(a.length&&(t=re(a,t),n=((e,t)=>{if(t&&t>e.length){const n=e;(e=new i(t)).set(n,0)}return e})(n,l-l%E)),u=0;l-E>=u;u+=E){const e=oe(G,se(t,u,u+E));o&&f.update(e);const s=c.update(e);o||f.update(s),n.set(ie(G,s),u+r)}return e.pending=se(t,u),n}async function ne(n,r,s,o){n.password=null;const c=(e=>{if(void 0===w){const t=new i((e=unescape(encodeURIComponent(e))).length);for(let n=0;n<t.length;n++)t[n]=e.charCodeAt(n);return t}return(new w).encode(e)})(s),f=await(async(e,t,n,r,s)=>{if(!Y)return I.importKey(t);try{return await O.importKey("raw",t,n,!1,s)}catch(e){return Y=!1,I.importKey(t)}})(0,c,K,0,U),a=await(async(e,t,n)=>{if(!Z)return I.M(t,e.salt,P.iterations,n);try{return await O.deriveBits(e,t,n)}catch(r){return Z=!1,I.M(t,e.salt,P.iterations,n)}})(t.assign({salt:o},P),f,8*(2*T[r]+2)),l=new i(a),u=oe(G,se(l,0,T[r])),h=oe(G,se(l,T[r],2*T[r])),d=se(l,2*T[r]);return t.assign(n,{keys:{key:u,$:h,passwordVerification:d},Y:new Q(new J(u),e.from(H)),Z:new X(h)}),d}function re(e,t){let n=e;return e.length+t.length&&(n=new i(e.length+t.length),n.set(e,0),n.set(t,e.length)),n}function se(e,t,n){return e.subarray(t,n)}function ie(e,t){return e.m(t)}function oe(e,t){return e.g(t)}class ce extends p{constructor({password:e,passwordVerification:n}){super({start(){t.assign(this,{password:e,passwordVerification:n}),ue(this,e)},transform(e,t){const n=this;if(n.password){const t=ae(n,e.subarray(0,12));if(n.password=null,t[11]!=n.passwordVerification)throw new s(V);e=e.subarray(12)}t.enqueue(ae(n,e))}})}}class fe extends p{constructor({password:e,passwordVerification:n}){super({start(){t.assign(this,{password:e,passwordVerification:n}),ue(this,e)},transform(e,t){const n=this;let r,s;if(n.password){n.password=null;const t=B(new i(12));t[11]=n.passwordVerification,r=new i(e.length+t.length),r.set(le(n,t),0),s=12}else r=new i(e.length),s=0;r.set(le(n,e),s),t.enqueue(r)}})}}function ae(e,t){const n=new i(t.length);for(let r=0;r<t.length;r++)n[r]=he(e)^t[r],we(e,n[r]);return n}function le(e,t){const n=new i(t.length);for(let r=0;r<t.length;r++)n[r]=he(e)^t[r],we(e,t[r]);return n}function ue(e,n){const r=[305419896,591751049,878082192];t.assign(e,{keys:r,ee:new S(r[0]),te:new S(r[2])});for(let t=0;t<n.length;t++)we(e,n.charCodeAt(t))}function we(e,t){let[n,s,i]=e.keys;e.ee.append([t]),n=~e.ee.get(),s=pe(r.imul(pe(s+de(n)),134775813)+1),e.te.append([s>>>24]),i=~e.te.get(),e.keys=[n,s,i]}function he(e){const t=2|e.keys[2];return de(r.imul(t,1^t)>>>8)}function de(e){return 255&e}function pe(e){return 4294967295&e}const ye="deflate-raw";class me extends p{constructor(e,{chunkSize:t,CompressionStream:n,CompressionStreamNative:r}){super({});const{compressed:s,encrypted:i,useCompressionStream:o,zipCrypto:c,signed:f,level:a}=e,u=this;let w,h,d=ge(super.readable);i&&!c||!f||([d,w]=d.tee(),w=Se(w,new z)),s&&(d=ve(d,o,{level:a,chunkSize:t},r,n)),i&&(c?d=Se(d,new fe(e)):(h=new ee(e),d=Se(d,h))),ke(u,d,(async()=>{let e;i&&!c&&(e=h.signature),i&&!c||!f||(e=await w.getReader().read(),e=new l(e.value.buffer).getUint32(0)),u.signature=e}))}}class be extends p{constructor(e,{chunkSize:t,DecompressionStream:n,DecompressionStreamNative:r}){super({});const{zipCrypto:i,encrypted:o,signed:c,signature:f,compressed:a,useCompressionStream:u}=e;let w,h,d=ge(super.readable);o&&(i?d=Se(d,new ce(e)):(h=new $(e),d=Se(d,h))),a&&(d=ve(d,u,{chunkSize:t},r,n)),o&&!i||!c||([d,w]=d.tee(),w=Se(w,new z)),ke(this,d,(async()=>{if((!o||i)&&c){const e=await w.getReader().read(),t=new l(e.value.buffer);if(f!=t.getUint32(0,!1))throw new s(R)}}))}}function ge(e){return Se(e,new p({transform(e,t){e&&e.length&&t.enqueue(e)}}))}function ke(e,n,r){n=Se(n,new p({flush:r})),t.defineProperty(e,"readable",{get:()=>n})}function ve(e,t,n,r,s){try{e=Se(e,new(t&&r?r:s)(ye,n))}catch(r){if(!t)throw r;e=Se(e,new s(ye,n))}return e}function Se(e,t){return e.pipeThrough(t)}const ze="data";class Ce extends p{constructor(e,n){super({});const r=this,{codecType:s}=e;let i;s.startsWith("deflate")?i=me:s.startsWith("inflate")&&(i=be);let o=0;const c=new i(e,n),f=super.readable,a=new p({transform(e,t){e&&e.length&&(o+=e.length,t.enqueue(e))},flush(){const{signature:e}=c;t.assign(r,{signature:e,size:o})}});t.defineProperty(r,"readable",{get:()=>f.pipeThrough(c).pipeThrough(a)})}}const xe=new a,_e=new a;let Ae=0;async function Ie(e){try{const{options:t,scripts:r,config:s}=e;r&&r.length&&importScripts.apply(void 0,r),self.initCodec&&self.initCodec(),s.CompressionStreamNative=self.CompressionStream,s.DecompressionStreamNative=self.DecompressionStream,self.Deflate&&(s.CompressionStream=new k(self.Deflate)),self.Inflate&&(s.DecompressionStream=new k(self.Inflate));const i={highWaterMark:1,size:()=>s.chunkSize},o=e.readable||new y({async pull(e){const t=new u((e=>xe.set(Ae,e)));De({type:"pull",messageId:Ae}),Ae=(Ae+1)%n.MAX_SAFE_INTEGER;const{value:r,done:s}=await t;e.enqueue(r),s&&e.close()}},i),c=e.writable||new m({async write(e){let t;const r=new u((e=>t=e));_e.set(Ae,t),De({type:ze,value:e,messageId:Ae}),Ae=(Ae+1)%n.MAX_SAFE_INTEGER,await r}},i),f=new Ce(t,s);await o.pipeThrough(f).pipeTo(c,{preventAbort:!0});try{await c.close()}catch(e){}const{signature:a,size:l}=f;De({type:"close",result:{signature:a,size:l}})}catch(e){Ve(e)}}function De(e){let{value:t}=e;if(t)if(t.length)try{t=new i(t),e.value=t.buffer,d(e,[e.value])}catch(t){d(e)}else d(e);else d(e)}function Ve(e){const{message:t,stack:n,code:r,name:s}=e;d({error:{message:t,stack:n,code:r,name:s}})}addEventListener("message",(({data:e})=>{const{type:t,messageId:n,value:r,done:s}=e;try{if("start"==t&&Ie(e),t==ze){const e=xe.get(n);xe.delete(n),e({value:new i(r),done:s})}if("ack"==t){const e=_e.get(n);_e.delete(n),e()}}catch(e){Ve(e)}}));const Re=-2;function Be(t){return Ee(t.map((([t,n])=>new e(t).fill(n,0,t))))}function Ee(t){return t.reduce(((t,n)=>t.concat(e.isArray(n)?Ee(n):n)),[])}const Me=[0,1,2,3].concat(...Be([[2,4],[2,5],[4,6],[4,7],[8,8],[8,9],[16,10],[16,11],[32,12],[32,13],[64,14],[64,15],[2,0],[1,16],[1,17],[2,18],[2,19],[4,20],[4,21],[8,22],[8,23],[16,24],[16,25],[32,26],[32,27],[64,28],[64,29]]));function Ke(){const e=this;function t(e,t){let n=0;do{n|=1&e,e>>>=1,n<<=1}while(--t>0);return n>>>1}e.ne=n=>{const s=e.re,i=e.ie.se,o=e.ie.oe;let c,f,a,l=-1;for(n.ce=0,n.fe=573,c=0;o>c;c++)0!==s[2*c]?(n.ae[++n.ce]=l=c,n.le[c]=0):s[2*c+1]=0;for(;2>n.ce;)a=n.ae[++n.ce]=2>l?++l:0,s[2*a]=1,n.le[a]=0,n.ue--,i&&(n.we-=i[2*a+1]);for(e.he=l,c=r.floor(n.ce/2);c>=1;c--)n.de(s,c);a=o;do{c=n.ae[1],n.ae[1]=n.ae[n.ce--],n.de(s,1),f=n.ae[1],n.ae[--n.fe]=c,n.ae[--n.fe]=f,s[2*a]=s[2*c]+s[2*f],n.le[a]=r.max(n.le[c],n.le[f])+1,s[2*c+1]=s[2*f+1]=a,n.ae[1]=a++,n.de(s,1)}while(n.ce>=2);n.ae[--n.fe]=n.ae[1],(t=>{const n=e.re,r=e.ie.se,s=e.ie.pe,i=e.ie.ye,o=e.ie.me;let c,f,a,l,u,w,h=0;for(l=0;15>=l;l++)t.be[l]=0;for(n[2*t.ae[t.fe]+1]=0,c=t.fe+1;573>c;c++)f=t.ae[c],l=n[2*n[2*f+1]+1]+1,l>o&&(l=o,h++),n[2*f+1]=l,f>e.he||(t.be[l]++,u=0,i>f||(u=s[f-i]),w=n[2*f],t.ue+=w*(l+u),r&&(t.we+=w*(r[2*f+1]+u)));if(0!==h){do{for(l=o-1;0===t.be[l];)l--;t.be[l]--,t.be[l+1]+=2,t.be[o]--,h-=2}while(h>0);for(l=o;0!==l;l--)for(f=t.be[l];0!==f;)a=t.ae[--c],a>e.he||(n[2*a+1]!=l&&(t.ue+=(l-n[2*a+1])*n[2*a],n[2*a+1]=l),f--)}})(n),((e,n,r)=>{const s=[];let i,o,c,f=0;for(i=1;15>=i;i++)s[i]=f=f+r[i-1]<<1;for(o=0;n>=o;o++)c=e[2*o+1],0!==c&&(e[2*o]=t(s[c]++,c))})(s,e.he,n.be)}}function Pe(e,t,n,r,s){const i=this;i.se=e,i.pe=t,i.ye=n,i.oe=r,i.me=s}Ke.ge=[0,1,2,3,4,5,6,7].concat(...Be([[2,8],[2,9],[2,10],[2,11],[4,12],[4,13],[4,14],[4,15],[8,16],[8,17],[8,18],[8,19],[16,20],[16,21],[16,22],[16,23],[32,24],[32,25],[32,26],[31,27],[1,28]])),Ke.ke=[0,1,2,3,4,5,6,7,8,10,12,14,16,20,24,28,32,40,48,56,64,80,96,112,128,160,192,224,0],Ke.ve=[0,1,2,3,4,6,8,12,16,24,32,48,64,96,128,192,256,384,512,768,1024,1536,2048,3072,4096,6144,8192,12288,16384,24576],Ke.Se=e=>256>e?Me[e]:Me[256+(e>>>7)],Ke.ze=[0,0,0,0,0,0,0,0,1,1,1,1,2,2,2,2,3,3,3,3,4,4,4,4,5,5,5,5,0],Ke.Ce=[0,0,0,0,1,1,2,2,3,3,4,4,5,5,6,6,7,7,8,8,9,9,10,10,11,11,12,12,13,13],Ke.xe=[0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,2,3,7],Ke._e=[16,17,18,0,8,7,9,6,10,5,11,4,12,3,13,2,14,1,15];const Ue=Be([[144,8],[112,9],[24,7],[8,8]]);Pe.Ae=Ee([12,140,76,204,44,172,108,236,28,156,92,220,60,188,124,252,2,130,66,194,34,162,98,226,18,146,82,210,50,178,114,242,10,138,74,202,42,170,106,234,26,154,90,218,58,186,122,250,6,134,70,198,38,166,102,230,22,150,86,214,54,182,118,246,14,142,78,206,46,174,110,238,30,158,94,222,62,190,126,254,1,129,65,193,33,161,97,225,17,145,81,209,49,177,113,241,9,137,73,201,41,169,105,233,25,153,89,217,57,185,121,249,5,133,69,197,37,165,101,229,21,149,85,213,53,181,117,245,13,141,77,205,45,173,109,237,29,157,93,221,61,189,125,253,19,275,147,403,83,339,211,467,51,307,179,435,115,371,243,499,11,267,139,395,75,331,203,459,43,299,171,427,107,363,235,491,27,283,155,411,91,347,219,475,59,315,187,443,123,379,251,507,7,263,135,391,71,327,199,455,39,295,167,423,103,359,231,487,23,279,151,407,87,343,215,471,55,311,183,439,119,375,247,503,15,271,143,399,79,335,207,463,47,303,175,431,111,367,239,495,31,287,159,415,95,351,223,479,63,319,191,447,127,383,255,511,0,64,32,96,16,80,48,112,8,72,40,104,24,88,56,120,4,68,36,100,20,84,52,116,3,131,67,195,35,163,99,227].map(((e,t)=>[e,Ue[t]])));const Ne=Be([[30,5]]);function Te(e,t,n,r,s){const i=this;i.Ie=e,i.De=t,i.Ve=n,i.Re=r,i.Be=s}Pe.Ee=Ee([0,16,8,24,4,20,12,28,2,18,10,26,6,22,14,30,1,17,9,25,5,21,13,29,3,19,11,27,7,23].map(((e,t)=>[e,Ne[t]]))),Pe.Me=new Pe(Pe.Ae,Ke.ze,257,286,15),Pe.Ke=new Pe(Pe.Ee,Ke.Ce,0,30,15),Pe.Pe=new Pe(null,Ke.xe,0,19,7);const We=[new Te(0,0,0,0,0),new Te(4,4,8,4,1),new Te(4,5,16,8,1),new Te(4,6,32,32,1),new Te(4,4,16,16,2),new Te(8,16,32,32,2),new Te(8,16,128,128,2),new Te(8,32,128,256,2),new Te(32,128,258,1024,2),new Te(32,258,258,4096,2)],He=["need dictionary","stream end","","","stream error","data error","","buffer error","",""],Le=113,je=666,Fe=262;function Oe(e,t,n,r){const s=e[2*t],i=e[2*n];return i>s||s==i&&r[t]<=r[n]}function qe(){const e=this;let t,n,s,c,f,a,l,u,w,h,d,p,y,m,b,g,k,v,S,z,C,x,_,A,I,D,V,R,B,E,M,K,P;const U=new Ke,N=new Ke,T=new Ke;let W,H,L,j,F,O;function q(){let t;for(t=0;286>t;t++)M[2*t]=0;for(t=0;30>t;t++)K[2*t]=0;for(t=0;19>t;t++)P[2*t]=0;M[512]=1,e.ue=e.we=0,H=L=0}function G(e,t){let n,r=-1,s=e[1],i=0,o=7,c=4;0===s&&(o=138,c=3),e[2*(t+1)+1]=65535;for(let f=0;t>=f;f++)n=s,s=e[2*(f+1)+1],++i<o&&n==s||(c>i?P[2*n]+=i:0!==n?(n!=r&&P[2*n]++,P[32]++):i>10?P[36]++:P[34]++,i=0,r=n,0===s?(o=138,c=3):n==s?(o=6,c=3):(o=7,c=4))}function J(t){e.Ue[e.pending++]=t}function Q(e){J(255&e),J(e>>>8&255)}function X(e,t){let n;const r=t;O>16-r?(n=e,F|=n<<O&65535,Q(F),F=n>>>16-O,O+=r-16):(F|=e<<O&65535,O+=r)}function Y(e,t){const n=2*e;X(65535&t[n],65535&t[n+1])}function Z(e,t){let n,r,s=-1,i=e[1],o=0,c=7,f=4;for(0===i&&(c=138,f=3),n=0;t>=n;n++)if(r=i,i=e[2*(n+1)+1],++o>=c||r!=i){if(f>o)do{Y(r,P)}while(0!=--o);else 0!==r?(r!=s&&(Y(r,P),o--),Y(16,P),X(o-3,2)):o>10?(Y(18,P),X(o-11,7)):(Y(17,P),X(o-3,3));o=0,s=r,0===i?(c=138,f=3):r==i?(c=6,f=3):(c=7,f=4)}}function $(){16==O?(Q(F),F=0,O=0):8>O||(J(255&F),F>>>=8,O-=8)}function ee(t,n){let s,i,o;if(e.Ne[H]=t,e.Te[H]=255&n,H++,0===t?M[2*n]++:(L++,t--,M[2*(Ke.ge[n]+256+1)]++,K[2*Ke.Se(t)]++),0==(8191&H)&&V>2){for(s=8*H,i=C-k,o=0;30>o;o++)s+=K[2*o]*(5+Ke.Ce[o]);if(s>>>=3,L<r.floor(H/2)&&s<r.floor(i/2))return!0}return H==W-1}function te(t,n){let r,s,i,o,c=0;if(0!==H)do{r=e.Ne[c],s=e.Te[c],c++,0===r?Y(s,t):(i=Ke.ge[s],Y(i+256+1,t),o=Ke.ze[i],0!==o&&(s-=Ke.ke[i],X(s,o)),r--,i=Ke.Se(r),Y(i,n),o=Ke.Ce[i],0!==o&&(r-=Ke.ve[i],X(r,o)))}while(H>c);Y(256,t),j=t[513]}function ne(){O>8?Q(F):O>0&&J(255&F),F=0,O=0}function re(t,n,r){X(0+(r?1:0),3),((t,n)=>{ne(),j=8,Q(n),Q(~n),e.Ue.set(u.subarray(t,t+n),e.pending),e.pending+=n})(t,n)}function se(n){((t,n,r)=>{let s,i,o=0;V>0?(U.ne(e),N.ne(e),o=(()=>{let t;for(G(M,U.he),G(K,N.he),T.ne(e),t=18;t>=3&&0===P[2*Ke._e[t]+1];t--);return e.ue+=14+3*(t+1),t})(),s=e.ue+3+7>>>3,i=e.we+3+7>>>3,i>s||(s=i)):s=i=n+5,n+4>s||-1==t?i==s?(X(2+(r?1:0),3),te(Pe.Ae,Pe.Ee)):(X(4+(r?1:0),3),((e,t,n)=>{let r;for(X(e-257,5),X(t-1,5),X(n-4,4),r=0;n>r;r++)X(P[2*Ke._e[r]+1],3);Z(M,e-1),Z(K,t-1)})(U.he+1,N.he+1,o+1),te(M,K)):re(t,n,r),q(),r&&ne()})(0>k?-1:k,C-k,n),k=C,t.We()}function ie(){let e,n,r,s;do{if(s=w-_-C,0===s&&0===C&&0===_)s=f;else if(-1==s)s--;else if(C>=f+f-Fe){u.set(u.subarray(f,f+f),0),x-=f,C-=f,k-=f,e=y,r=e;do{n=65535&d[--r],d[r]=f>n?0:n-f}while(0!=--e);e=f,r=e;do{n=65535&h[--r],h[r]=f>n?0:n-f}while(0!=--e);s+=f}if(0===t.He)return;e=t.Le(u,C+_,s),_+=e,3>_||(p=255&u[C],p=(p<<g^255&u[C+1])&b)}while(Fe>_&&0!==t.He)}function oe(e){let t,n,r=I,s=C,i=A;const o=C>f-Fe?C-(f-Fe):0;let c=E;const a=l,w=C+258;let d=u[s+i-1],p=u[s+i];B>A||(r>>=2),c>_&&(c=_);do{if(t=e,u[t+i]==p&&u[t+i-1]==d&&u[t]==u[s]&&u[++t]==u[s+1]){s+=2,t++;do{}while(u[++s]==u[++t]&&u[++s]==u[++t]&&u[++s]==u[++t]&&u[++s]==u[++t]&&u[++s]==u[++t]&&u[++s]==u[++t]&&u[++s]==u[++t]&&u[++s]==u[++t]&&w>s);if(n=258-(w-s),s=w-258,n>i){if(x=e,i=n,n>=c)break;d=u[s+i-1],p=u[s+i]}}}while((e=65535&h[e&a])>o&&0!=--r);return i>_?_:i}e.le=[],e.be=[],e.ae=[],M=[],K=[],P=[],e.de=(t,n)=>{const r=e.ae,s=r[n];let i=n<<1;for(;i<=e.ce&&(i<e.ce&&Oe(t,r[i+1],r[i],e.le)&&i++,!Oe(t,s,r[i],e.le));)r[n]=r[i],n=i,i<<=1;r[n]=s},e.je=(t,S,x,H,L,G)=>(H||(H=8),L||(L=8),G||(G=0),t.Fe=null,-1==S&&(S=6),1>L||L>9||8!=H||9>x||x>15||0>S||S>9||0>G||G>2?Re:(t.Oe=e,a=x,f=1<<a,l=f-1,m=L+7,y=1<<m,b=y-1,g=r.floor((m+3-1)/3),u=new i(2*f),h=[],d=[],W=1<<L+6,e.Ue=new i(4*W),s=4*W,e.Ne=new o(W),e.Te=new i(W),V=S,R=G,(t=>(t.qe=t.Ge=0,t.Fe=null,e.pending=0,e.Je=0,n=Le,c=0,U.re=M,U.ie=Pe.Me,N.re=K,N.ie=Pe.Ke,T.re=P,T.ie=Pe.Pe,F=0,O=0,j=8,q(),(()=>{w=2*f,d[y-1]=0;for(let e=0;y-1>e;e++)d[e]=0;D=We[V].De,B=We[V].Ie,E=We[V].Ve,I=We[V].Re,C=0,k=0,_=0,v=A=2,z=0,p=0})(),0))(t))),e.Qe=()=>42!=n&&n!=Le&&n!=je?Re:(e.Te=null,e.Ne=null,e.Ue=null,d=null,h=null,u=null,e.Oe=null,n==Le?-3:0),e.Xe=(e,t,n)=>{let r=0;return-1==t&&(t=6),0>t||t>9||0>n||n>2?Re:(We[V].Be!=We[t].Be&&0!==e.qe&&(r=e.Ye(1)),V!=t&&(V=t,D=We[V].De,B=We[V].Ie,E=We[V].Ve,I=We[V].Re),R=n,r)},e.Ze=(e,t,r)=>{let s,i=r,o=0;if(!t||42!=n)return Re;if(3>i)return 0;for(i>f-Fe&&(i=f-Fe,o=r-i),u.set(t.subarray(o,o+i),0),C=i,k=i,p=255&u[0],p=(p<<g^255&u[1])&b,s=0;i-3>=s;s++)p=(p<<g^255&u[s+2])&b,h[s&l]=d[p],d[p]=s;return 0},e.Ye=(r,i)=>{let o,w,m,I,B;if(i>4||0>i)return Re;if(!r.$e||!r.et&&0!==r.He||n==je&&4!=i)return r.Fe=He[4],Re;if(0===r.tt)return r.Fe=He[7],-5;var E;if(t=r,I=c,c=i,42==n&&(w=8+(a-8<<4)<<8,m=(V-1&255)>>1,m>3&&(m=3),w|=m<<6,0!==C&&(w|=32),w+=31-w%31,n=Le,J((E=w)>>8&255),J(255&E)),0!==e.pending){if(t.We(),0===t.tt)return c=-1,0}else if(0===t.He&&I>=i&&4!=i)return t.Fe=He[7],-5;if(n==je&&0!==t.He)return r.Fe=He[7],-5;if(0!==t.He||0!==_||0!=i&&n!=je){switch(B=-1,We[V].Be){case 0:B=(e=>{let n,r=65535;for(r>s-5&&(r=s-5);;){if(1>=_){if(ie(),0===_&&0==e)return 0;if(0===_)break}if(C+=_,_=0,n=k+r,(0===C||C>=n)&&(_=C-n,C=n,se(!1),0===t.tt))return 0;if(C-k>=f-Fe&&(se(!1),0===t.tt))return 0}return se(4==e),0===t.tt?4==e?2:0:4==e?3:1})(i);break;case 1:B=(e=>{let n,r=0;for(;;){if(Fe>_){if(ie(),Fe>_&&0==e)return 0;if(0===_)break}if(3>_||(p=(p<<g^255&u[C+2])&b,r=65535&d[p],h[C&l]=d[p],d[p]=C),0===r||(C-r&65535)>f-Fe||2!=R&&(v=oe(r)),3>v)n=ee(0,255&u[C]),_--,C++;else if(n=ee(C-x,v-3),_-=v,v>D||3>_)C+=v,v=0,p=255&u[C],p=(p<<g^255&u[C+1])&b;else{v--;do{C++,p=(p<<g^255&u[C+2])&b,r=65535&d[p],h[C&l]=d[p],d[p]=C}while(0!=--v);C++}if(n&&(se(!1),0===t.tt))return 0}return se(4==e),0===t.tt?4==e?2:0:4==e?3:1})(i);break;case 2:B=(e=>{let n,r,s=0;for(;;){if(Fe>_){if(ie(),Fe>_&&0==e)return 0;if(0===_)break}if(3>_||(p=(p<<g^255&u[C+2])&b,s=65535&d[p],h[C&l]=d[p],d[p]=C),A=v,S=x,v=2,0!==s&&D>A&&f-Fe>=(C-s&65535)&&(2!=R&&(v=oe(s)),5>=v&&(1==R||3==v&&C-x>4096)&&(v=2)),3>A||v>A)if(0!==z){if(n=ee(0,255&u[C-1]),n&&se(!1),C++,_--,0===t.tt)return 0}else z=1,C++,_--;else{r=C+_-3,n=ee(C-1-S,A-3),_-=A-1,A-=2;do{++C>r||(p=(p<<g^255&u[C+2])&b,s=65535&d[p],h[C&l]=d[p],d[p]=C)}while(0!=--A);if(z=0,v=2,C++,n&&(se(!1),0===t.tt))return 0}}return 0!==z&&(n=ee(0,255&u[C-1]),z=0),se(4==e),0===t.tt?4==e?2:0:4==e?3:1})(i)}if(2!=B&&3!=B||(n=je),0==B||2==B)return 0===t.tt&&(c=-1),0;if(1==B){if(1==i)X(2,3),Y(256,Pe.Ae),$(),9>1+j+10-O&&(X(2,3),Y(256,Pe.Ae),$()),j=7;else if(re(0,0,!1),3==i)for(o=0;y>o;o++)d[o]=0;if(t.We(),0===t.tt)return c=-1,0}}return 4!=i?0:1}}function Ge(){const e=this;e.nt=0,e.rt=0,e.He=0,e.qe=0,e.tt=0,e.Ge=0}function Je(e){const t=new Ge,n=(o=e&&e.chunkSize?e.chunkSize:65536)+5*(r.floor(o/16383)+1);var o;const c=new i(n);let f=e?e.level:-1;void 0===f&&(f=-1),t.je(f),t.$e=c,this.append=(e,r)=>{let o,f,a=0,l=0,u=0;const w=[];if(e.length){t.nt=0,t.et=e,t.He=e.length;do{if(t.rt=0,t.tt=n,o=t.Ye(0),0!=o)throw new s("deflating: "+t.Fe);t.rt&&(t.rt==n?w.push(new i(c)):w.push(c.slice(0,t.rt))),u+=t.rt,r&&t.nt>0&&t.nt!=a&&(r(t.nt),a=t.nt)}while(t.He>0||0===t.tt);return w.length>1?(f=new i(u),w.forEach((e=>{f.set(e,l),l+=e.length}))):f=w[0]||new i,f}},this.flush=()=>{let e,r,o=0,f=0;const a=[];do{if(t.rt=0,t.tt=n,e=t.Ye(4),1!=e&&0!=e)throw new s("deflating: "+t.Fe);n-t.tt>0&&a.push(c.slice(0,t.rt)),f+=t.rt}while(t.He>0||0===t.tt);return t.Qe(),r=new i(f),a.forEach((e=>{r.set(e,o),o+=e.length})),r}}Ge.prototype={je(e,t){const n=this;return n.Oe=new qe,t||(t=15),n.Oe.je(n,e,t)},Ye(e){const t=this;return t.Oe?t.Oe.Ye(t,e):Re},Qe(){const e=this;if(!e.Oe)return Re;const t=e.Oe.Qe();return e.Oe=null,t},Xe(e,t){const n=this;return n.Oe?n.Oe.Xe(n,e,t):Re},Ze(e,t){const n=this;return n.Oe?n.Oe.Ze(n,e,t):Re},Le(e,t,n){const r=this;let s=r.He;return s>n&&(s=n),0===s?0:(r.He-=s,e.set(r.et.subarray(r.nt,r.nt+s),t),r.nt+=s,r.qe+=s,s)},We(){const e=this;let t=e.Oe.pending;t>e.tt&&(t=e.tt),0!==t&&(e.$e.set(e.Oe.Ue.subarray(e.Oe.Je,e.Oe.Je+t),e.rt),e.rt+=t,e.Oe.Je+=t,e.Ge+=t,e.tt-=t,e.Oe.pending-=t,0===e.Oe.pending&&(e.Oe.Je=0))}};const Qe=-2,Xe=-3,Ye=-5,Ze=[0,1,3,7,15,31,63,127,255,511,1023,2047,4095,8191,16383,32767,65535],$e=[96,7,256,0,8,80,0,8,16,84,8,115,82,7,31,0,8,112,0,8,48,0,9,192,80,7,10,0,8,96,0,8,32,0,9,160,0,8,0,0,8,128,0,8,64,0,9,224,80,7,6,0,8,88,0,8,24,0,9,144,83,7,59,0,8,120,0,8,56,0,9,208,81,7,17,0,8,104,0,8,40,0,9,176,0,8,8,0,8,136,0,8,72,0,9,240,80,7,4,0,8,84,0,8,20,85,8,227,83,7,43,0,8,116,0,8,52,0,9,200,81,7,13,0,8,100,0,8,36,0,9,168,0,8,4,0,8,132,0,8,68,0,9,232,80,7,8,0,8,92,0,8,28,0,9,152,84,7,83,0,8,124,0,8,60,0,9,216,82,7,23,0,8,108,0,8,44,0,9,184,0,8,12,0,8,140,0,8,76,0,9,248,80,7,3,0,8,82,0,8,18,85,8,163,83,7,35,0,8,114,0,8,50,0,9,196,81,7,11,0,8,98,0,8,34,0,9,164,0,8,2,0,8,130,0,8,66,0,9,228,80,7,7,0,8,90,0,8,26,0,9,148,84,7,67,0,8,122,0,8,58,0,9,212,82,7,19,0,8,106,0,8,42,0,9,180,0,8,10,0,8,138,0,8,74,0,9,244,80,7,5,0,8,86,0,8,22,192,8,0,83,7,51,0,8,118,0,8,54,0,9,204,81,7,15,0,8,102,0,8,38,0,9,172,0,8,6,0,8,134,0,8,70,0,9,236,80,7,9,0,8,94,0,8,30,0,9,156,84,7,99,0,8,126,0,8,62,0,9,220,82,7,27,0,8,110,0,8,46,0,9,188,0,8,14,0,8,142,0,8,78,0,9,252,96,7,256,0,8,81,0,8,17,85,8,131,82,7,31,0,8,113,0,8,49,0,9,194,80,7,10,0,8,97,0,8,33,0,9,162,0,8,1,0,8,129,0,8,65,0,9,226,80,7,6,0,8,89,0,8,25,0,9,146,83,7,59,0,8,121,0,8,57,0,9,210,81,7,17,0,8,105,0,8,41,0,9,178,0,8,9,0,8,137,0,8,73,0,9,242,80,7,4,0,8,85,0,8,21,80,8,258,83,7,43,0,8,117,0,8,53,0,9,202,81,7,13,0,8,101,0,8,37,0,9,170,0,8,5,0,8,133,0,8,69,0,9,234,80,7,8,0,8,93,0,8,29,0,9,154,84,7,83,0,8,125,0,8,61,0,9,218,82,7,23,0,8,109,0,8,45,0,9,186,0,8,13,0,8,141,0,8,77,0,9,250,80,7,3,0,8,83,0,8,19,85,8,195,83,7,35,0,8,115,0,8,51,0,9,198,81,7,11,0,8,99,0,8,35,0,9,166,0,8,3,0,8,131,0,8,67,0,9,230,80,7,7,0,8,91,0,8,27,0,9,150,84,7,67,0,8,123,0,8,59,0,9,214,82,7,19,0,8,107,0,8,43,0,9,182,0,8,11,0,8,139,0,8,75,0,9,246,80,7,5,0,8,87,0,8,23,192,8,0,83,7,51,0,8,119,0,8,55,0,9,206,81,7,15,0,8,103,0,8,39,0,9,174,0,8,7,0,8,135,0,8,71,0,9,238,80,7,9,0,8,95,0,8,31,0,9,158,84,7,99,0,8,127,0,8,63,0,9,222,82,7,27,0,8,111,0,8,47,0,9,190,0,8,15,0,8,143,0,8,79,0,9,254,96,7,256,0,8,80,0,8,16,84,8,115,82,7,31,0,8,112,0,8,48,0,9,193,80,7,10,0,8,96,0,8,32,0,9,161,0,8,0,0,8,128,0,8,64,0,9,225,80,7,6,0,8,88,0,8,24,0,9,145,83,7,59,0,8,120,0,8,56,0,9,209,81,7,17,0,8,104,0,8,40,0,9,177,0,8,8,0,8,136,0,8,72,0,9,241,80,7,4,0,8,84,0,8,20,85,8,227,83,7,43,0,8,116,0,8,52,0,9,201,81,7,13,0,8,100,0,8,36,0,9,169,0,8,4,0,8,132,0,8,68,0,9,233,80,7,8,0,8,92,0,8,28,0,9,153,84,7,83,0,8,124,0,8,60,0,9,217,82,7,23,0,8,108,0,8,44,0,9,185,0,8,12,0,8,140,0,8,76,0,9,249,80,7,3,0,8,82,0,8,18,85,8,163,83,7,35,0,8,114,0,8,50,0,9,197,81,7,11,0,8,98,0,8,34,0,9,165,0,8,2,0,8,130,0,8,66,0,9,229,80,7,7,0,8,90,0,8,26,0,9,149,84,7,67,0,8,122,0,8,58,0,9,213,82,7,19,0,8,106,0,8,42,0,9,181,0,8,10,0,8,138,0,8,74,0,9,245,80,7,5,0,8,86,0,8,22,192,8,0,83,7,51,0,8,118,0,8,54,0,9,205,81,7,15,0,8,102,0,8,38,0,9,173,0,8,6,0,8,134,0,8,70,0,9,237,80,7,9,0,8,94,0,8,30,0,9,157,84,7,99,0,8,126,0,8,62,0,9,221,82,7,27,0,8,110,0,8,46,0,9,189,0,8,14,0,8,142,0,8,78,0,9,253,96,7,256,0,8,81,0,8,17,85,8,131,82,7,31,0,8,113,0,8,49,0,9,195,80,7,10,0,8,97,0,8,33,0,9,163,0,8,1,0,8,129,0,8,65,0,9,227,80,7,6,0,8,89,0,8,25,0,9,147,83,7,59,0,8,121,0,8,57,0,9,211,81,7,17,0,8,105,0,8,41,0,9,179,0,8,9,0,8,137,0,8,73,0,9,243,80,7,4,0,8,85,0,8,21,80,8,258,83,7,43,0,8,117,0,8,53,0,9,203,81,7,13,0,8,101,0,8,37,0,9,171,0,8,5,0,8,133,0,8,69,0,9,235,80,7,8,0,8,93,0,8,29,0,9,155,84,7,83,0,8,125,0,8,61,0,9,219,82,7,23,0,8,109,0,8,45,0,9,187,0,8,13,0,8,141,0,8,77,0,9,251,80,7,3,0,8,83,0,8,19,85,8,195,83,7,35,0,8,115,0,8,51,0,9,199,81,7,11,0,8,99,0,8,35,0,9,167,0,8,3,0,8,131,0,8,67,0,9,231,80,7,7,0,8,91,0,8,27,0,9,151,84,7,67,0,8,123,0,8,59,0,9,215,82,7,19,0,8,107,0,8,43,0,9,183,0,8,11,0,8,139,0,8,75,0,9,247,80,7,5,0,8,87,0,8,23,192,8,0,83,7,51,0,8,119,0,8,55,0,9,207,81,7,15,0,8,103,0,8,39,0,9,175,0,8,7,0,8,135,0,8,71,0,9,239,80,7,9,0,8,95,0,8,31,0,9,159,84,7,99,0,8,127,0,8,63,0,9,223,82,7,27,0,8,111,0,8,47,0,9,191,0,8,15,0,8,143,0,8,79,0,9,255],et=[80,5,1,87,5,257,83,5,17,91,5,4097,81,5,5,89,5,1025,85,5,65,93,5,16385,80,5,3,88,5,513,84,5,33,92,5,8193,82,5,9,90,5,2049,86,5,129,192,5,24577,80,5,2,87,5,385,83,5,25,91,5,6145,81,5,7,89,5,1537,85,5,97,93,5,24577,80,5,4,88,5,769,84,5,49,92,5,12289,82,5,13,90,5,3073,86,5,193,192,5,24577],tt=[3,4,5,6,7,8,9,10,11,13,15,17,19,23,27,31,35,43,51,59,67,83,99,115,131,163,195,227,258,0,0],nt=[0,0,0,0,0,0,0,0,1,1,1,1,2,2,2,2,3,3,3,3,4,4,4,4,5,5,5,5,0,112,112],rt=[1,2,3,4,5,7,9,13,17,25,33,49,65,97,129,193,257,385,513,769,1025,1537,2049,3073,4097,6145,8193,12289,16385,24577],st=[0,0,0,0,1,1,2,2,3,3,4,4,5,5,6,6,7,7,8,8,9,9,10,10,11,11,12,12,13,13];function it(){let e,t,n,r,s,i;function o(e,t,o,c,f,a,l,u,w,h,d){let p,y,m,b,g,k,v,S,z,C,x,_,A,I,D;C=0,g=o;do{n[e[t+C]]++,C++,g--}while(0!==g);if(n[0]==o)return l[0]=-1,u[0]=0,0;for(S=u[0],k=1;15>=k&&0===n[k];k++);for(v=k,k>S&&(S=k),g=15;0!==g&&0===n[g];g--);for(m=g,S>g&&(S=g),u[0]=S,I=1<<k;g>k;k++,I<<=1)if(0>(I-=n[k]))return Xe;if(0>(I-=n[g]))return Xe;for(n[g]+=I,i[1]=k=0,C=1,A=2;0!=--g;)i[A]=k+=n[C],A++,C++;g=0,C=0;do{0!==(k=e[t+C])&&(d[i[k]++]=g),C++}while(++g<o);for(o=i[m],i[0]=g=0,C=0,b=-1,_=-S,s[0]=0,x=0,D=0;m>=v;v++)for(p=n[v];0!=p--;){for(;v>_+S;){if(b++,_+=S,D=m-_,D=D>S?S:D,(y=1<<(k=v-_))>p+1&&(y-=p+1,A=v,D>k))for(;++k<D&&(y<<=1)>n[++A];)y-=n[A];if(D=1<<k,h[0]+D>1440)return Xe;s[b]=x=h[0],h[0]+=D,0!==b?(i[b]=g,r[0]=k,r[1]=S,k=g>>>_-S,r[2]=x-s[b-1]-k,w.set(r,3*(s[b-1]+k))):l[0]=x}for(r[1]=v-_,o>C?d[C]<c?(r[0]=256>d[C]?0:96,r[2]=d[C++]):(r[0]=a[d[C]-c]+16+64,r[2]=f[d[C++]-c]):r[0]=192,y=1<<v-_,k=g>>>_;D>k;k+=y)w.set(r,3*(x+k));for(k=1<<v-1;0!=(g&k);k>>>=1)g^=k;for(g^=k,z=(1<<_)-1;(g&z)!=i[b];)b--,_-=S,z=(1<<_)-1}return 0!==I&&1!=m?Ye:0}function c(o){let c;for(e||(e=[],t=[],n=new f(16),r=[],s=new f(15),i=new f(16)),t.length<o&&(t=[]),c=0;o>c;c++)t[c]=0;for(c=0;16>c;c++)n[c]=0;for(c=0;3>c;c++)r[c]=0;s.set(n.subarray(0,15),0),i.set(n.subarray(0,16),0)}this.st=(n,r,s,i,f)=>{let a;return c(19),e[0]=0,a=o(n,0,19,19,null,null,s,r,i,e,t),a==Xe?f.Fe="oversubscribed dynamic bit lengths tree":a!=Ye&&0!==r[0]||(f.Fe="incomplete dynamic bit lengths tree",a=Xe),a},this.it=(n,r,s,i,f,a,l,u,w)=>{let h;return c(288),e[0]=0,h=o(s,0,n,257,tt,nt,a,i,u,e,t),0!=h||0===i[0]?(h==Xe?w.Fe="oversubscribed literal/length tree":-4!=h&&(w.Fe="incomplete literal/length tree",h=Xe),h):(c(288),h=o(s,n,r,0,rt,st,l,f,u,e,t),0!=h||0===f[0]&&n>257?(h==Xe?w.Fe="oversubscribed distance tree":h==Ye?(w.Fe="incomplete distance tree",h=Xe):-4!=h&&(w.Fe="empty distance tree with lengths",h=Xe),h):0)}}function ot(){const e=this;let t,n,r,s,i=0,o=0,c=0,f=0,a=0,l=0,u=0,w=0,h=0,d=0;function p(e,t,n,r,s,i,o,c){let f,a,l,u,w,h,d,p,y,m,b,g,k,v,S,z;d=c.nt,p=c.He,w=o.ot,h=o.ct,y=o.write,m=y<o.read?o.read-y-1:o.end-y,b=Ze[e],g=Ze[t];do{for(;20>h;)p--,w|=(255&c.ft(d++))<<h,h+=8;if(f=w&b,a=n,l=r,z=3*(l+f),0!==(u=a[z]))for(;;){if(w>>=a[z+1],h-=a[z+1],0!=(16&u)){for(u&=15,k=a[z+2]+(w&Ze[u]),w>>=u,h-=u;15>h;)p--,w|=(255&c.ft(d++))<<h,h+=8;for(f=w&g,a=s,l=i,z=3*(l+f),u=a[z];;){if(w>>=a[z+1],h-=a[z+1],0!=(16&u)){for(u&=15;u>h;)p--,w|=(255&c.ft(d++))<<h,h+=8;if(v=a[z+2]+(w&Ze[u]),w>>=u,h-=u,m-=k,v>y){S=y-v;do{S+=o.end}while(0>S);if(u=o.end-S,k>u){if(k-=u,y-S>0&&u>y-S)do{o.lt[y++]=o.lt[S++]}while(0!=--u);else o.lt.set(o.lt.subarray(S,S+u),y),y+=u,S+=u,u=0;S=0}}else S=y-v,y-S>0&&2>y-S?(o.lt[y++]=o.lt[S++],o.lt[y++]=o.lt[S++],k-=2):(o.lt.set(o.lt.subarray(S,S+2),y),y+=2,S+=2,k-=2);if(y-S>0&&k>y-S)do{o.lt[y++]=o.lt[S++]}while(0!=--k);else o.lt.set(o.lt.subarray(S,S+k),y),y+=k,S+=k,k=0;break}if(0!=(64&u))return c.Fe="invalid distance code",k=c.He-p,k=k>h>>3?h>>3:k,p+=k,d-=k,h-=k<<3,o.ot=w,o.ct=h,c.He=p,c.qe+=d-c.nt,c.nt=d,o.write=y,Xe;f+=a[z+2],f+=w&Ze[u],z=3*(l+f),u=a[z]}break}if(0!=(64&u))return 0!=(32&u)?(k=c.He-p,k=k>h>>3?h>>3:k,p+=k,d-=k,h-=k<<3,o.ot=w,o.ct=h,c.He=p,c.qe+=d-c.nt,c.nt=d,o.write=y,1):(c.Fe="invalid literal/length code",k=c.He-p,k=k>h>>3?h>>3:k,p+=k,d-=k,h-=k<<3,o.ot=w,o.ct=h,c.He=p,c.qe+=d-c.nt,c.nt=d,o.write=y,Xe);if(f+=a[z+2],f+=w&Ze[u],z=3*(l+f),0===(u=a[z])){w>>=a[z+1],h-=a[z+1],o.lt[y++]=a[z+2],m--;break}}else w>>=a[z+1],h-=a[z+1],o.lt[y++]=a[z+2],m--}while(m>=258&&p>=10);return k=c.He-p,k=k>h>>3?h>>3:k,p+=k,d-=k,h-=k<<3,o.ot=w,o.ct=h,c.He=p,c.qe+=d-c.nt,c.nt=d,o.write=y,0}e.init=(e,i,o,c,f,a)=>{t=0,u=e,w=i,r=o,h=c,s=f,d=a,n=null},e.ut=(e,y,m)=>{let b,g,k,v,S,z,C,x=0,_=0,A=0;for(A=y.nt,v=y.He,x=e.ot,_=e.ct,S=e.write,z=S<e.read?e.read-S-1:e.end-S;;)switch(t){case 0:if(z>=258&&v>=10&&(e.ot=x,e.ct=_,y.He=v,y.qe+=A-y.nt,y.nt=A,e.write=S,m=p(u,w,r,h,s,d,e,y),A=y.nt,v=y.He,x=e.ot,_=e.ct,S=e.write,z=S<e.read?e.read-S-1:e.end-S,0!=m)){t=1==m?7:9;break}c=u,n=r,o=h,t=1;case 1:for(b=c;b>_;){if(0===v)return e.ot=x,e.ct=_,y.He=v,y.qe+=A-y.nt,y.nt=A,e.write=S,e.wt(y,m);m=0,v--,x|=(255&y.ft(A++))<<_,_+=8}if(g=3*(o+(x&Ze[b])),x>>>=n[g+1],_-=n[g+1],k=n[g],0===k){f=n[g+2],t=6;break}if(0!=(16&k)){a=15&k,i=n[g+2],t=2;break}if(0==(64&k)){c=k,o=g/3+n[g+2];break}if(0!=(32&k)){t=7;break}return t=9,y.Fe="invalid literal/length code",m=Xe,e.ot=x,e.ct=_,y.He=v,y.qe+=A-y.nt,y.nt=A,e.write=S,e.wt(y,m);case 2:for(b=a;b>_;){if(0===v)return e.ot=x,e.ct=_,y.He=v,y.qe+=A-y.nt,y.nt=A,e.write=S,e.wt(y,m);m=0,v--,x|=(255&y.ft(A++))<<_,_+=8}i+=x&Ze[b],x>>=b,_-=b,c=w,n=s,o=d,t=3;case 3:for(b=c;b>_;){if(0===v)return e.ot=x,e.ct=_,y.He=v,y.qe+=A-y.nt,y.nt=A,e.write=S,e.wt(y,m);m=0,v--,x|=(255&y.ft(A++))<<_,_+=8}if(g=3*(o+(x&Ze[b])),x>>=n[g+1],_-=n[g+1],k=n[g],0!=(16&k)){a=15&k,l=n[g+2],t=4;break}if(0==(64&k)){c=k,o=g/3+n[g+2];break}return t=9,y.Fe="invalid distance code",m=Xe,e.ot=x,e.ct=_,y.He=v,y.qe+=A-y.nt,y.nt=A,e.write=S,e.wt(y,m);case 4:for(b=a;b>_;){if(0===v)return e.ot=x,e.ct=_,y.He=v,y.qe+=A-y.nt,y.nt=A,e.write=S,e.wt(y,m);m=0,v--,x|=(255&y.ft(A++))<<_,_+=8}l+=x&Ze[b],x>>=b,_-=b,t=5;case 5:for(C=S-l;0>C;)C+=e.end;for(;0!==i;){if(0===z&&(S==e.end&&0!==e.read&&(S=0,z=S<e.read?e.read-S-1:e.end-S),0===z&&(e.write=S,m=e.wt(y,m),S=e.write,z=S<e.read?e.read-S-1:e.end-S,S==e.end&&0!==e.read&&(S=0,z=S<e.read?e.read-S-1:e.end-S),0===z)))return e.ot=x,e.ct=_,y.He=v,y.qe+=A-y.nt,y.nt=A,e.write=S,e.wt(y,m);e.lt[S++]=e.lt[C++],z--,C==e.end&&(C=0),i--}t=0;break;case 6:if(0===z&&(S==e.end&&0!==e.read&&(S=0,z=S<e.read?e.read-S-1:e.end-S),0===z&&(e.write=S,m=e.wt(y,m),S=e.write,z=S<e.read?e.read-S-1:e.end-S,S==e.end&&0!==e.read&&(S=0,z=S<e.read?e.read-S-1:e.end-S),0===z)))return e.ot=x,e.ct=_,y.He=v,y.qe+=A-y.nt,y.nt=A,e.write=S,e.wt(y,m);m=0,e.lt[S++]=f,z--,t=0;break;case 7:if(_>7&&(_-=8,v++,A--),e.write=S,m=e.wt(y,m),S=e.write,z=S<e.read?e.read-S-1:e.end-S,e.read!=e.write)return e.ot=x,e.ct=_,y.He=v,y.qe+=A-y.nt,y.nt=A,e.write=S,e.wt(y,m);t=8;case 8:return m=1,e.ot=x,e.ct=_,y.He=v,y.qe+=A-y.nt,y.nt=A,e.write=S,e.wt(y,m);case 9:return m=Xe,e.ot=x,e.ct=_,y.He=v,y.qe+=A-y.nt,y.nt=A,e.write=S,e.wt(y,m);default:return m=Qe,e.ot=x,e.ct=_,y.He=v,y.qe+=A-y.nt,y.nt=A,e.write=S,e.wt(y,m)}},e.ht=()=>{}}it.dt=(e,t,n,r)=>(e[0]=9,t[0]=5,n[0]=$e,r[0]=et,0);const ct=[16,17,18,0,8,7,9,6,10,5,11,4,12,3,13,2,14,1,15];function ft(e,t){const n=this;let r,s=0,o=0,c=0,a=0;const l=[0],u=[0],w=new ot;let h=0,d=new f(4320);const p=new it;n.ct=0,n.ot=0,n.lt=new i(t),n.end=t,n.read=0,n.write=0,n.reset=(e,t)=>{t&&(t[0]=0),6==s&&w.ht(e),s=0,n.ct=0,n.ot=0,n.read=n.write=0},n.reset(e,null),n.wt=(e,t)=>{let r,s,i;return s=e.rt,i=n.read,r=(i>n.write?n.end:n.write)-i,r>e.tt&&(r=e.tt),0!==r&&t==Ye&&(t=0),e.tt-=r,e.Ge+=r,e.$e.set(n.lt.subarray(i,i+r),s),s+=r,i+=r,i==n.end&&(i=0,n.write==n.end&&(n.write=0),r=n.write-i,r>e.tt&&(r=e.tt),0!==r&&t==Ye&&(t=0),e.tt-=r,e.Ge+=r,e.$e.set(n.lt.subarray(i,i+r),s),s+=r,i+=r),e.rt=s,n.read=i,t},n.ut=(e,t)=>{let i,f,y,m,b,g,k,v;for(m=e.nt,b=e.He,f=n.ot,y=n.ct,g=n.write,k=g<n.read?n.read-g-1:n.end-g;;){let S,z,C,x,_,A,I,D;switch(s){case 0:for(;3>y;){if(0===b)return n.ot=f,n.ct=y,e.He=b,e.qe+=m-e.nt,e.nt=m,n.write=g,n.wt(e,t);t=0,b--,f|=(255&e.ft(m++))<<y,y+=8}switch(i=7&f,h=1&i,i>>>1){case 0:f>>>=3,y-=3,i=7&y,f>>>=i,y-=i,s=1;break;case 1:S=[],z=[],C=[[]],x=[[]],it.dt(S,z,C,x),w.init(S[0],z[0],C[0],0,x[0],0),f>>>=3,y-=3,s=6;break;case 2:f>>>=3,y-=3,s=3;break;case 3:return f>>>=3,y-=3,s=9,e.Fe="invalid block type",t=Xe,n.ot=f,n.ct=y,e.He=b,e.qe+=m-e.nt,e.nt=m,n.write=g,n.wt(e,t)}break;case 1:for(;32>y;){if(0===b)return n.ot=f,n.ct=y,e.He=b,e.qe+=m-e.nt,e.nt=m,n.write=g,n.wt(e,t);t=0,b--,f|=(255&e.ft(m++))<<y,y+=8}if((~f>>>16&65535)!=(65535&f))return s=9,e.Fe="invalid stored block lengths",t=Xe,n.ot=f,n.ct=y,e.He=b,e.qe+=m-e.nt,e.nt=m,n.write=g,n.wt(e,t);o=65535&f,f=y=0,s=0!==o?2:0!==h?7:0;break;case 2:if(0===b)return n.ot=f,n.ct=y,e.He=b,e.qe+=m-e.nt,e.nt=m,n.write=g,n.wt(e,t);if(0===k&&(g==n.end&&0!==n.read&&(g=0,k=g<n.read?n.read-g-1:n.end-g),0===k&&(n.write=g,t=n.wt(e,t),g=n.write,k=g<n.read?n.read-g-1:n.end-g,g==n.end&&0!==n.read&&(g=0,k=g<n.read?n.read-g-1:n.end-g),0===k)))return n.ot=f,n.ct=y,e.He=b,e.qe+=m-e.nt,e.nt=m,n.write=g,n.wt(e,t);if(t=0,i=o,i>b&&(i=b),i>k&&(i=k),n.lt.set(e.Le(m,i),g),m+=i,b-=i,g+=i,k-=i,0!=(o-=i))break;s=0!==h?7:0;break;case 3:for(;14>y;){if(0===b)return n.ot=f,n.ct=y,e.He=b,e.qe+=m-e.nt,e.nt=m,n.write=g,n.wt(e,t);t=0,b--,f|=(255&e.ft(m++))<<y,y+=8}if(c=i=16383&f,(31&i)>29||(i>>5&31)>29)return s=9,e.Fe="too many length or distance symbols",t=Xe,n.ot=f,n.ct=y,e.He=b,e.qe+=m-e.nt,e.nt=m,n.write=g,n.wt(e,t);if(i=258+(31&i)+(i>>5&31),!r||r.length<i)r=[];else for(v=0;i>v;v++)r[v]=0;f>>>=14,y-=14,a=0,s=4;case 4:for(;4+(c>>>10)>a;){for(;3>y;){if(0===b)return n.ot=f,n.ct=y,e.He=b,e.qe+=m-e.nt,e.nt=m,n.write=g,n.wt(e,t);t=0,b--,f|=(255&e.ft(m++))<<y,y+=8}r[ct[a++]]=7&f,f>>>=3,y-=3}for(;19>a;)r[ct[a++]]=0;if(l[0]=7,i=p.st(r,l,u,d,e),0!=i)return(t=i)==Xe&&(r=null,s=9),n.ot=f,n.ct=y,e.He=b,e.qe+=m-e.nt,e.nt=m,n.write=g,n.wt(e,t);a=0,s=5;case 5:for(;i=c,258+(31&i)+(i>>5&31)>a;){let o,w;for(i=l[0];i>y;){if(0===b)return n.ot=f,n.ct=y,e.He=b,e.qe+=m-e.nt,e.nt=m,n.write=g,n.wt(e,t);t=0,b--,f|=(255&e.ft(m++))<<y,y+=8}if(i=d[3*(u[0]+(f&Ze[i]))+1],w=d[3*(u[0]+(f&Ze[i]))+2],16>w)f>>>=i,y-=i,r[a++]=w;else{for(v=18==w?7:w-14,o=18==w?11:3;i+v>y;){if(0===b)return n.ot=f,n.ct=y,e.He=b,e.qe+=m-e.nt,e.nt=m,n.write=g,n.wt(e,t);t=0,b--,f|=(255&e.ft(m++))<<y,y+=8}if(f>>>=i,y-=i,o+=f&Ze[v],f>>>=v,y-=v,v=a,i=c,v+o>258+(31&i)+(i>>5&31)||16==w&&1>v)return r=null,s=9,e.Fe="invalid bit length repeat",t=Xe,n.ot=f,n.ct=y,e.He=b,e.qe+=m-e.nt,e.nt=m,n.write=g,n.wt(e,t);w=16==w?r[v-1]:0;do{r[v++]=w}while(0!=--o);a=v}}if(u[0]=-1,_=[],A=[],I=[],D=[],_[0]=9,A[0]=6,i=c,i=p.it(257+(31&i),1+(i>>5&31),r,_,A,I,D,d,e),0!=i)return i==Xe&&(r=null,s=9),t=i,n.ot=f,n.ct=y,e.He=b,e.qe+=m-e.nt,e.nt=m,n.write=g,n.wt(e,t);w.init(_[0],A[0],d,I[0],d,D[0]),s=6;case 6:if(n.ot=f,n.ct=y,e.He=b,e.qe+=m-e.nt,e.nt=m,n.write=g,1!=(t=w.ut(n,e,t)))return n.wt(e,t);if(t=0,w.ht(e),m=e.nt,b=e.He,f=n.ot,y=n.ct,g=n.write,k=g<n.read?n.read-g-1:n.end-g,0===h){s=0;break}s=7;case 7:if(n.write=g,t=n.wt(e,t),g=n.write,k=g<n.read?n.read-g-1:n.end-g,n.read!=n.write)return n.ot=f,n.ct=y,e.He=b,e.qe+=m-e.nt,e.nt=m,n.write=g,n.wt(e,t);s=8;case 8:return t=1,n.ot=f,n.ct=y,e.He=b,e.qe+=m-e.nt,e.nt=m,n.write=g,n.wt(e,t);case 9:return t=Xe,n.ot=f,n.ct=y,e.He=b,e.qe+=m-e.nt,e.nt=m,n.write=g,n.wt(e,t);default:return t=Qe,n.ot=f,n.ct=y,e.He=b,e.qe+=m-e.nt,e.nt=m,n.write=g,n.wt(e,t)}}},n.ht=e=>{n.reset(e,null),n.lt=null,d=null},n.yt=(e,t,r)=>{n.lt.set(e.subarray(t,t+r),0),n.read=n.write=r},n.bt=()=>1==s?1:0}const at=13,lt=[0,0,255,255];function ut(){const e=this;function t(e){return e&&e.gt?(e.qe=e.Ge=0,e.Fe=null,e.gt.mode=7,e.gt.kt.reset(e,null),0):Qe}e.mode=0,e.method=0,e.vt=[0],e.St=0,e.marker=0,e.zt=0,e.Ct=t=>(e.kt&&e.kt.ht(t),e.kt=null,0),e.xt=(n,r)=>(n.Fe=null,e.kt=null,8>r||r>15?(e.Ct(n),Qe):(e.zt=r,n.gt.kt=new ft(n,1<<r),t(n),0)),e._t=(e,t)=>{let n,r;if(!e||!e.gt||!e.et)return Qe;const s=e.gt;for(t=4==t?Ye:0,n=Ye;;)switch(s.mode){case 0:if(0===e.He)return n;if(n=t,e.He--,e.qe++,8!=(15&(s.method=e.ft(e.nt++)))){s.mode=at,e.Fe="unknown compression method",s.marker=5;break}if(8+(s.method>>4)>s.zt){s.mode=at,e.Fe="invalid win size",s.marker=5;break}s.mode=1;case 1:if(0===e.He)return n;if(n=t,e.He--,e.qe++,r=255&e.ft(e.nt++),((s.method<<8)+r)%31!=0){s.mode=at,e.Fe="incorrect header check",s.marker=5;break}if(0==(32&r)){s.mode=7;break}s.mode=2;case 2:if(0===e.He)return n;n=t,e.He--,e.qe++,s.St=(255&e.ft(e.nt++))<<24&4278190080,s.mode=3;case 3:if(0===e.He)return n;n=t,e.He--,e.qe++,s.St+=(255&e.ft(e.nt++))<<16&16711680,s.mode=4;case 4:if(0===e.He)return n;n=t,e.He--,e.qe++,s.St+=(255&e.ft(e.nt++))<<8&65280,s.mode=5;case 5:return 0===e.He?n:(n=t,e.He--,e.qe++,s.St+=255&e.ft(e.nt++),s.mode=6,2);case 6:return s.mode=at,e.Fe="need dictionary",s.marker=0,Qe;case 7:if(n=s.kt.ut(e,n),n==Xe){s.mode=at,s.marker=0;break}if(0==n&&(n=t),1!=n)return n;n=t,s.kt.reset(e,s.vt),s.mode=12;case 12:return e.He=0,1;case at:return Xe;default:return Qe}},e.At=(e,t,n)=>{let r=0,s=n;if(!e||!e.gt||6!=e.gt.mode)return Qe;const i=e.gt;return s<1<<i.zt||(s=(1<<i.zt)-1,r=n-s),i.kt.yt(t,r,s),i.mode=7,0},e.It=e=>{let n,r,s,i,o;if(!e||!e.gt)return Qe;const c=e.gt;if(c.mode!=at&&(c.mode=at,c.marker=0),0===(n=e.He))return Ye;for(r=e.nt,s=c.marker;0!==n&&4>s;)e.ft(r)==lt[s]?s++:s=0!==e.ft(r)?0:4-s,r++,n--;return e.qe+=r-e.nt,e.nt=r,e.He=n,c.marker=s,4!=s?Xe:(i=e.qe,o=e.Ge,t(e),e.qe=i,e.Ge=o,c.mode=7,0)},e.Dt=e=>e&&e.gt&&e.gt.kt?e.gt.kt.bt():Qe}function wt(){}function ht(e){const t=new wt,n=e&&e.chunkSize?r.floor(2*e.chunkSize):131072,o=new i(n);let c=!1;t.xt(),t.$e=o,this.append=(e,r)=>{const f=[];let a,l,u=0,w=0,h=0;if(0!==e.length){t.nt=0,t.et=e,t.He=e.length;do{if(t.rt=0,t.tt=n,0!==t.He||c||(t.nt=0,c=!0),a=t._t(0),c&&a===Ye){if(0!==t.He)throw new s("inflating: bad input")}else if(0!==a&&1!==a)throw new s("inflating: "+t.Fe);if((c||1===a)&&t.He===e.length)throw new s("inflating: bad input");t.rt&&(t.rt===n?f.push(new i(o)):f.push(o.slice(0,t.rt))),h+=t.rt,r&&t.nt>0&&t.nt!=u&&(r(t.nt),u=t.nt)}while(t.He>0||0===t.tt);return f.length>1?(l=new i(h),f.forEach((e=>{l.set(e,w),w+=e.length}))):l=f[0]||new i,l}},this.flush=()=>{t.Ct()}}wt.prototype={xt(e){const t=this;return t.gt=new ut,e||(e=15),t.gt.xt(t,e)},_t(e){const t=this;return t.gt?t.gt._t(t,e):Qe},Ct(){const e=this;if(!e.gt)return Qe;const t=e.gt.Ct(e);return e.gt=null,t},It(){const e=this;return e.gt?e.gt.It(e):Qe},At(e,t){const n=this;return n.gt?n.gt.At(n,e,t):Qe},ft(e){return this.et[e]},Le(e,t){return this.et.subarray(e,e+t)}},self.initCodec=()=>{self.Deflate=Je,self.Inflate=ht};\n'
        ], {
            type: "text/javascript"
        }));
    e({
        workerScripts: {
            inflate: [
                t
            ],
            deflate: [
                t
            ]
        }
    });
}
const ERR_ITERATOR_COMPLETED_TOO_SOON = "Writer iterator completed too soon";
const HTTP_HEADER_CONTENT_TYPE = "Content-Type";
const DEFAULT_CHUNK_SIZE = 64 * 1024;
const PROPERTY_NAME_WRITABLE = "writable";
class Stream {
    constructor(){
        this.size = 0;
    }
    init() {
        this.initialized = true;
    }
}
class Reader extends Stream {
    get readable() {
        const reader = this;
        const { chunkSize =DEFAULT_CHUNK_SIZE  } = reader;
        const readable = new ReadableStream({
            start () {
                this.chunkOffset = 0;
            },
            async pull (controller) {
                const { offset =0 , size , diskNumberStart  } = readable;
                const { chunkOffset  } = this;
                controller.enqueue(await readUint8Array(reader, offset + chunkOffset, Math.min(chunkSize, size - chunkOffset), diskNumberStart));
                if (chunkOffset + chunkSize > size) {
                    controller.close();
                } else {
                    this.chunkOffset += chunkSize;
                }
            }
        });
        return readable;
    }
}
class BlobReader extends Reader {
    constructor(blob){
        super();
        Object.assign(this, {
            blob,
            size: blob.size
        });
    }
    async readUint8Array(offset, length) {
        const reader = this;
        const offsetEnd = offset + length;
        const blob = offset || offsetEnd < reader.size ? reader.blob.slice(offset, offsetEnd) : reader.blob;
        return new Uint8Array(await blob.arrayBuffer());
    }
}
class BlobWriter extends Stream {
    constructor(contentType){
        super();
        const writer = this;
        const transformStream = new TransformStream();
        const headers = [];
        if (contentType) {
            headers.push([
                HTTP_HEADER_CONTENT_TYPE,
                contentType
            ]);
        }
        Object.defineProperty(writer, PROPERTY_NAME_WRITABLE, {
            get () {
                return transformStream.writable;
            }
        });
        writer.blob = new Response(transformStream.readable, {
            headers
        }).blob();
    }
    getData() {
        return this.blob;
    }
}
class TextWriter extends BlobWriter {
    constructor(encoding){
        super(encoding);
        Object.assign(this, {
            encoding,
            utf8: !encoding || encoding.toLowerCase() == "utf-8"
        });
    }
    async getData() {
        const { encoding , utf8  } = this;
        const blob = await super.getData();
        if (blob.text && utf8) {
            return blob.text();
        } else {
            const reader = new FileReader();
            return new Promise((resolve, reject)=>{
                Object.assign(reader, {
                    onload: ({ target  })=>resolve(target.result),
                    onerror: ()=>reject(reader.error)
                });
                reader.readAsText(blob, encoding);
            });
        }
    }
}
class Uint8ArrayReader extends Reader {
    constructor(array){
        super();
        Object.assign(this, {
            array,
            size: array.length
        });
    }
    readUint8Array(index, length) {
        return this.array.slice(index, index + length);
    }
}
class SplitDataReader extends Reader {
    constructor(readers){
        super();
        this.readers = readers;
    }
    async init() {
        super.init();
        const reader = this;
        const { readers  } = reader;
        reader.lastDiskNumber = 0;
        await Promise.all(readers.map(async (diskReader)=>{
            await diskReader.init();
            reader.size += diskReader.size;
        }));
    }
    async readUint8Array(offset, length, diskNumber = 0) {
        const reader = this;
        const { readers  } = this;
        let result;
        let currentDiskNumber = diskNumber;
        if (currentDiskNumber == -1) {
            currentDiskNumber = readers.length - 1;
        }
        let currentReaderOffset = offset;
        while(currentReaderOffset >= readers[currentDiskNumber].size){
            currentReaderOffset -= readers[currentDiskNumber].size;
            currentDiskNumber++;
        }
        const currentReader = readers[currentDiskNumber];
        const currentReaderSize = currentReader.size;
        if (currentReaderOffset + length <= currentReaderSize) {
            result = await readUint8Array(currentReader, currentReaderOffset, length);
        } else {
            const chunkLength = currentReaderSize - currentReaderOffset;
            result = new Uint8Array(length);
            result.set(await readUint8Array(currentReader, currentReaderOffset, chunkLength));
            result.set(await reader.readUint8Array(offset + chunkLength, length - chunkLength, diskNumber), chunkLength);
        }
        reader.lastDiskNumber = Math.max(currentDiskNumber, reader.lastDiskNumber);
        return result;
    }
}
class SplitDataWriter extends Stream {
    constructor(writerGenerator, maxSize = 4294967295){
        super();
        const zipWriter = this;
        Object.assign(zipWriter, {
            diskNumber: 0,
            diskOffset: 0,
            size: 0,
            maxSize,
            availableSize: maxSize
        });
        let diskSourceWriter, diskWritable, diskWriter;
        const writable = new WritableStream({
            async write (chunk) {
                const { availableSize  } = zipWriter;
                if (!diskWriter) {
                    const { value , done  } = await writerGenerator.next();
                    if (done && !value) {
                        throw new Error(ERR_ITERATOR_COMPLETED_TOO_SOON);
                    } else {
                        diskSourceWriter = value;
                        diskSourceWriter.size = 0;
                        if (diskSourceWriter.maxSize) {
                            zipWriter.maxSize = diskSourceWriter.maxSize;
                        }
                        zipWriter.availableSize = zipWriter.maxSize;
                        await initStream(diskSourceWriter);
                        diskWritable = value.writable;
                        diskWriter = diskWritable.getWriter();
                    }
                    await this.write(chunk);
                } else if (chunk.length >= availableSize) {
                    await writeChunk(chunk.slice(0, availableSize));
                    await closeDisk();
                    zipWriter.diskOffset += diskSourceWriter.size;
                    zipWriter.diskNumber++;
                    diskWriter = null;
                    await this.write(chunk.slice(availableSize));
                } else {
                    await writeChunk(chunk);
                }
            },
            async close () {
                await diskWriter.ready;
                await closeDisk();
            }
        });
        Object.defineProperty(zipWriter, PROPERTY_NAME_WRITABLE, {
            get () {
                return writable;
            }
        });
        async function writeChunk(chunk) {
            const chunkLength = chunk.length;
            if (chunkLength) {
                await diskWriter.ready;
                await diskWriter.write(chunk);
                diskSourceWriter.size += chunkLength;
                zipWriter.size += chunkLength;
                zipWriter.availableSize -= chunkLength;
            }
        }
        async function closeDisk() {
            diskWritable.size = diskSourceWriter.size;
            await diskWriter.close();
        }
    }
}
async function initStream(stream, initSize) {
    if (stream.init && !stream.initialized) {
        await stream.init(initSize);
    }
}
function initReader(reader) {
    if (Array.isArray(reader)) {
        reader = new SplitDataReader(reader);
    }
    if (reader instanceof ReadableStream) {
        reader = {
            readable: reader
        };
    }
    return reader;
}
function initWriter(writer) {
    if (writer.writable === UNDEFINED_VALUE && typeof writer.next == FUNCTION_TYPE) {
        writer = new SplitDataWriter(writer);
    }
    if (writer instanceof WritableStream) {
        writer = {
            writable: writer
        };
    }
    const { writable  } = writer;
    if (writable.size === UNDEFINED_VALUE) {
        writable.size = 0;
    }
    const splitZipFile = writer instanceof SplitDataWriter;
    if (!splitZipFile) {
        Object.assign(writer, {
            diskNumber: 0,
            diskOffset: 0,
            availableSize: Infinity,
            maxSize: Infinity
        });
    }
    return writer;
}
function readUint8Array(reader, offset, size, diskNumber) {
    return reader.readUint8Array(offset, size, diskNumber);
}
const CP437 = "\0☺☻♥♦♣♠•◘○◙♂♀♪♫☼►◄↕‼¶§▬↨↑↓→←∟↔▲▼ !\"#$%&'()*+,-./0123456789:;<=>?@ABCDEFGHIJKLMNOPQRSTUVWXYZ[\\]^_`abcdefghijklmnopqrstuvwxyz{|}~⌂ÇüéâäàåçêëèïîìÄÅÉæÆôöòûùÿÖÜ¢£¥₧ƒáíóúñÑªº¿⌐¬½¼¡«»░▒▓│┤╡╢╖╕╣║╗╝╜╛┐└┴┬├─┼╞╟╚╔╩╦╠═╬╧╨╤╥╙╘╒╓╫╪┘┌█▄▌▐▀αßΓπΣσµτΦΘΩδ∞φε∩≡±≥≤⌠⌡÷≈°∙·√ⁿ²■ ".split("");
const VALID_CP437 = CP437.length == 256;
function decodeCP437(stringValue) {
    if (VALID_CP437) {
        let result = "";
        for(let indexCharacter = 0; indexCharacter < stringValue.length; indexCharacter++){
            result += CP437[stringValue[indexCharacter]];
        }
        return result;
    } else {
        return new TextDecoder().decode(stringValue);
    }
}
function decodeText(value, encoding) {
    if (encoding && encoding.trim().toLowerCase() == "cp437") {
        return decodeCP437(value);
    } else {
        return new TextDecoder(encoding).decode(value);
    }
}
const PROPERTY_NAME_FILENAME = "filename";
const PROPERTY_NAME_RAW_FILENAME = "rawFilename";
const PROPERTY_NAME_COMMENT = "comment";
const PROPERTY_NAME_RAW_COMMENT = "rawComment";
const PROPERTY_NAME_UNCOMPPRESSED_SIZE = "uncompressedSize";
const PROPERTY_NAME_COMPPRESSED_SIZE = "compressedSize";
const PROPERTY_NAME_OFFSET = "offset";
const PROPERTY_NAME_DISK_NUMBER_START = "diskNumberStart";
const PROPERTY_NAME_LAST_MODIFICATION_DATE = "lastModDate";
const PROPERTY_NAME_RAW_LAST_MODIFICATION_DATE = "rawLastModDate";
const PROPERTY_NAME_LAST_ACCESS_DATE = "lastAccessDate";
const PROPERTY_NAME_RAW_LAST_ACCESS_DATE = "rawLastAccessDate";
const PROPERTY_NAME_CREATION_DATE = "creationDate";
const PROPERTY_NAME_RAW_CREATION_DATE = "rawCreationDate";
const PROPERTY_NAME_INTERNAL_FILE_ATTRIBUTE = "internalFileAttribute";
const PROPERTY_NAME_EXTERNAL_FILE_ATTRIBUTE = "externalFileAttribute";
const PROPERTY_NAME_MS_DOS_COMPATIBLE = "msDosCompatible";
const PROPERTY_NAME_ZIP64 = "zip64";
const PROPERTY_NAMES = [
    PROPERTY_NAME_FILENAME,
    PROPERTY_NAME_RAW_FILENAME,
    PROPERTY_NAME_COMPPRESSED_SIZE,
    PROPERTY_NAME_UNCOMPPRESSED_SIZE,
    PROPERTY_NAME_LAST_MODIFICATION_DATE,
    PROPERTY_NAME_RAW_LAST_MODIFICATION_DATE,
    PROPERTY_NAME_COMMENT,
    PROPERTY_NAME_RAW_COMMENT,
    PROPERTY_NAME_LAST_ACCESS_DATE,
    PROPERTY_NAME_CREATION_DATE,
    PROPERTY_NAME_OFFSET,
    PROPERTY_NAME_DISK_NUMBER_START,
    PROPERTY_NAME_DISK_NUMBER_START,
    PROPERTY_NAME_INTERNAL_FILE_ATTRIBUTE,
    PROPERTY_NAME_EXTERNAL_FILE_ATTRIBUTE,
    PROPERTY_NAME_MS_DOS_COMPATIBLE,
    PROPERTY_NAME_ZIP64,
    "directory",
    "bitFlag",
    "encrypted",
    "signature",
    "filenameUTF8",
    "commentUTF8",
    "compressionMethod",
    "version",
    "versionMadeBy",
    "extraField",
    "rawExtraField",
    "extraFieldZip64",
    "extraFieldUnicodePath",
    "extraFieldUnicodeComment",
    "extraFieldAES",
    "extraFieldNTFS",
    "extraFieldExtendedTimestamp"
];
class Entry {
    constructor(data){
        PROPERTY_NAMES.forEach((name)=>this[name] = data[name]);
    }
}
const ERR_BAD_FORMAT = "File format is not recognized";
const ERR_EOCDR_NOT_FOUND = "End of central directory not found";
const ERR_EOCDR_ZIP64_NOT_FOUND = "End of Zip64 central directory not found";
const ERR_EOCDR_LOCATOR_ZIP64_NOT_FOUND = "End of Zip64 central directory locator not found";
const ERR_CENTRAL_DIRECTORY_NOT_FOUND = "Central directory header not found";
const ERR_LOCAL_FILE_HEADER_NOT_FOUND = "Local file header not found";
const ERR_EXTRAFIELD_ZIP64_NOT_FOUND = "Zip64 extra field not found";
const ERR_ENCRYPTED = "File contains encrypted entry";
const ERR_UNSUPPORTED_ENCRYPTION = "Encryption method not supported";
const ERR_UNSUPPORTED_COMPRESSION = "Compression method not supported";
const ERR_SPLIT_ZIP_FILE = "Split zip file";
const CHARSET_UTF8 = "utf-8";
const CHARSET_CP437 = "cp437";
const ZIP64_PROPERTIES = [
    [
        PROPERTY_NAME_UNCOMPPRESSED_SIZE,
        0xffffffff
    ],
    [
        PROPERTY_NAME_COMPPRESSED_SIZE,
        0xffffffff
    ],
    [
        PROPERTY_NAME_OFFSET,
        0xffffffff
    ],
    [
        PROPERTY_NAME_DISK_NUMBER_START,
        0xffff
    ]
];
const ZIP64_EXTRACTION = {
    [0xffff]: {
        getValue: getUint32,
        bytes: 4
    },
    [0xffffffff]: {
        getValue: getBigUint64,
        bytes: 8
    }
};
class ZipReader {
    constructor(reader, options = {}){
        Object.assign(this, {
            reader: initReader(reader),
            options,
            config: getConfiguration()
        });
    }
    async *getEntriesGenerator(options = {}) {
        const zipReader = this;
        let { reader  } = zipReader;
        const { config  } = zipReader;
        await initStream(reader);
        if (reader.size === UNDEFINED_VALUE || !reader.readUint8Array) {
            reader = new BlobReader(await new Response(reader.readable).blob());
            await initStream(reader);
        }
        if (reader.size < 22) {
            throw new Error(ERR_BAD_FORMAT);
        }
        reader.chunkSize = getChunkSize(config);
        const endOfDirectoryInfo = await seekSignature(reader, 0x06054b50, reader.size, 22, 0xffff * 16);
        if (!endOfDirectoryInfo) {
            const signatureArray = await readUint8Array(reader, 0, 4);
            const signatureView = getDataView(signatureArray);
            if (getUint32(signatureView) == 0x08074b50) {
                throw new Error(ERR_SPLIT_ZIP_FILE);
            } else {
                throw new Error(ERR_EOCDR_NOT_FOUND);
            }
        }
        const endOfDirectoryView = getDataView(endOfDirectoryInfo);
        let directoryDataLength = getUint32(endOfDirectoryView, 12);
        let directoryDataOffset = getUint32(endOfDirectoryView, 16);
        const commentOffset = endOfDirectoryInfo.offset;
        const commentLength = getUint16(endOfDirectoryView, 20);
        const appendedDataOffset = commentOffset + 22 + commentLength;
        let lastDiskNumber = getUint16(endOfDirectoryView, 4);
        const expectedLastDiskNumber = reader.lastDiskNumber || 0;
        let diskNumber = getUint16(endOfDirectoryView, 6);
        let filesLength = getUint16(endOfDirectoryView, 8);
        let prependedDataLength = 0;
        let startOffset = 0;
        if (directoryDataOffset == 0xffffffff || directoryDataLength == 0xffffffff || filesLength == 0xffff || diskNumber == 0xffff) {
            const endOfDirectoryLocatorArray = await readUint8Array(reader, endOfDirectoryInfo.offset - 20, 20);
            const endOfDirectoryLocatorView = getDataView(endOfDirectoryLocatorArray);
            if (getUint32(endOfDirectoryLocatorView, 0) != 0x07064b50) {
                throw new Error(ERR_EOCDR_ZIP64_NOT_FOUND);
            }
            directoryDataOffset = getBigUint64(endOfDirectoryLocatorView, 8);
            let endOfDirectoryArray = await readUint8Array(reader, directoryDataOffset, 56, -1);
            let endOfDirectoryView = getDataView(endOfDirectoryArray);
            const expectedDirectoryDataOffset = endOfDirectoryInfo.offset - 20 - 56;
            if (getUint32(endOfDirectoryView, 0) != 0x06064b50 && directoryDataOffset != expectedDirectoryDataOffset) {
                const originalDirectoryDataOffset = directoryDataOffset;
                directoryDataOffset = expectedDirectoryDataOffset;
                prependedDataLength = directoryDataOffset - originalDirectoryDataOffset;
                endOfDirectoryArray = await readUint8Array(reader, directoryDataOffset, ZIP64_END_OF_CENTRAL_DIR_LENGTH, -1);
                endOfDirectoryView = getDataView(endOfDirectoryArray);
            }
            if (getUint32(endOfDirectoryView, 0) != 0x06064b50) {
                throw new Error(ERR_EOCDR_LOCATOR_ZIP64_NOT_FOUND);
            }
            if (lastDiskNumber == 0xffff) {
                lastDiskNumber = getUint32(endOfDirectoryView, 16);
            }
            if (diskNumber == 0xffff) {
                diskNumber = getUint32(endOfDirectoryView, 20);
            }
            if (filesLength == 0xffff) {
                filesLength = getBigUint64(endOfDirectoryView, 32);
            }
            if (directoryDataLength == 0xffffffff) {
                directoryDataLength = getBigUint64(endOfDirectoryView, 40);
            }
            directoryDataOffset -= directoryDataLength;
        }
        if (expectedLastDiskNumber != lastDiskNumber) {
            throw new Error(ERR_SPLIT_ZIP_FILE);
        }
        if (directoryDataOffset < 0 || directoryDataOffset >= reader.size) {
            throw new Error(ERR_BAD_FORMAT);
        }
        let offset = 0;
        let directoryArray = await readUint8Array(reader, directoryDataOffset, directoryDataLength, diskNumber);
        let directoryView = getDataView(directoryArray);
        if (directoryDataLength) {
            const expectedDirectoryDataOffset = endOfDirectoryInfo.offset - directoryDataLength;
            if (getUint32(directoryView, offset) != 0x02014b50 && directoryDataOffset != expectedDirectoryDataOffset) {
                const originalDirectoryDataOffset = directoryDataOffset;
                directoryDataOffset = expectedDirectoryDataOffset;
                prependedDataLength = directoryDataOffset - originalDirectoryDataOffset;
                directoryArray = await readUint8Array(reader, directoryDataOffset, directoryDataLength, diskNumber);
                directoryView = getDataView(directoryArray);
            }
        }
        if (directoryDataOffset < 0 || directoryDataOffset >= reader.size) {
            throw new Error(ERR_BAD_FORMAT);
        }
        const filenameEncoding = getOptionValue(zipReader, options, "filenameEncoding");
        const commentEncoding = getOptionValue(zipReader, options, "commentEncoding");
        for(let indexFile = 0; indexFile < filesLength; indexFile++){
            const fileEntry = new ZipEntry(reader, config, zipReader.options);
            if (getUint32(directoryView, offset) != 0x02014b50) {
                throw new Error(ERR_CENTRAL_DIRECTORY_NOT_FOUND);
            }
            readCommonHeader(fileEntry, directoryView, offset + 6);
            const languageEncodingFlag = Boolean(fileEntry.bitFlag.languageEncodingFlag);
            const filenameOffset = offset + 46;
            const extraFieldOffset = filenameOffset + fileEntry.filenameLength;
            const commentOffset = extraFieldOffset + fileEntry.extraFieldLength;
            const versionMadeBy = getUint16(directoryView, offset + 4);
            const msDosCompatible = (versionMadeBy & 0) == 0;
            const rawFilename = directoryArray.subarray(filenameOffset, extraFieldOffset);
            const commentLength = getUint16(directoryView, offset + 32);
            const endOffset = commentOffset + commentLength;
            const rawComment = directoryArray.subarray(commentOffset, endOffset);
            const filenameUTF8 = languageEncodingFlag;
            const commentUTF8 = languageEncodingFlag;
            const directory = msDosCompatible && (getUint8(directoryView, offset + 38) & 0x10) == 0x10;
            const offsetFileEntry = getUint32(directoryView, offset + 42) + prependedDataLength;
            Object.assign(fileEntry, {
                versionMadeBy,
                msDosCompatible,
                compressedSize: 0,
                uncompressedSize: 0,
                commentLength,
                directory,
                offset: offsetFileEntry,
                diskNumberStart: getUint16(directoryView, offset + 34),
                internalFileAttribute: getUint16(directoryView, offset + 36),
                externalFileAttribute: getUint32(directoryView, offset + 38),
                rawFilename,
                filenameUTF8,
                commentUTF8,
                rawExtraField: directoryArray.subarray(extraFieldOffset, commentOffset)
            });
            const [filename, comment] = await Promise.all([
                decodeText(rawFilename, filenameUTF8 ? CHARSET_UTF8 : filenameEncoding || CHARSET_CP437),
                decodeText(rawComment, commentUTF8 ? CHARSET_UTF8 : commentEncoding || CHARSET_CP437)
            ]);
            Object.assign(fileEntry, {
                rawComment,
                filename,
                comment,
                directory: directory || filename.endsWith(DIRECTORY_SIGNATURE)
            });
            startOffset = Math.max(offsetFileEntry, startOffset);
            await readCommonFooter(fileEntry, fileEntry, directoryView, offset + 6);
            const entry = new Entry(fileEntry);
            entry.getData = (writer, options)=>fileEntry.getData(writer, entry, options);
            offset = endOffset;
            const { onprogress  } = options;
            if (onprogress) {
                try {
                    await onprogress(indexFile + 1, filesLength, new Entry(fileEntry));
                } catch (_error) {}
            }
            yield entry;
        }
        const extractPrependedData = getOptionValue(zipReader, options, "extractPrependedData");
        const extractAppendedData = getOptionValue(zipReader, options, "extractAppendedData");
        if (extractPrependedData) {
            zipReader.prependedData = startOffset > 0 ? await readUint8Array(reader, 0, startOffset) : new Uint8Array();
        }
        zipReader.comment = commentLength ? await readUint8Array(reader, commentOffset + END_OF_CENTRAL_DIR_LENGTH, commentLength) : new Uint8Array();
        if (extractAppendedData) {
            zipReader.appendedData = appendedDataOffset < reader.size ? await readUint8Array(reader, appendedDataOffset, reader.size - appendedDataOffset) : new Uint8Array();
        }
        return true;
    }
    async getEntries(options = {}) {
        const entries = [];
        for await (const entry of this.getEntriesGenerator(options)){
            entries.push(entry);
        }
        return entries;
    }
    async close() {}
}
class ZipEntry {
    constructor(reader, config, options){
        Object.assign(this, {
            reader,
            config,
            options
        });
    }
    async getData(writer, fileEntry, options = {}) {
        const zipEntry = this;
        const { reader , offset , diskNumberStart , extraFieldAES , compressionMethod , config , bitFlag , signature , rawLastModDate , uncompressedSize , compressedSize  } = zipEntry;
        const localDirectory = zipEntry.localDirectory = {};
        const dataArray = await readUint8Array(reader, offset, 30, diskNumberStart);
        const dataView = getDataView(dataArray);
        let password = getOptionValue(zipEntry, options, "password");
        password = password && password.length && password;
        if (extraFieldAES) {
            if (extraFieldAES.originalCompressionMethod != 0x63) {
                throw new Error(ERR_UNSUPPORTED_COMPRESSION);
            }
        }
        if (compressionMethod != 0x00 && compressionMethod != 0x08) {
            throw new Error(ERR_UNSUPPORTED_COMPRESSION);
        }
        if (getUint32(dataView, 0) != 0x04034b50) {
            throw new Error(ERR_LOCAL_FILE_HEADER_NOT_FOUND);
        }
        readCommonHeader(localDirectory, dataView, 4);
        localDirectory.rawExtraField = localDirectory.extraFieldLength ? await readUint8Array(reader, offset + 30 + localDirectory.filenameLength, localDirectory.extraFieldLength, diskNumberStart) : new Uint8Array();
        await readCommonFooter(zipEntry, localDirectory, dataView, 4);
        Object.assign(fileEntry, {
            lastAccessDate: localDirectory.lastAccessDate,
            creationDate: localDirectory.creationDate
        });
        const encrypted = zipEntry.encrypted && localDirectory.encrypted;
        const zipCrypto = encrypted && !extraFieldAES;
        if (encrypted) {
            if (!zipCrypto && extraFieldAES.strength === UNDEFINED_VALUE) {
                throw new Error(ERR_UNSUPPORTED_ENCRYPTION);
            } else if (!password) {
                throw new Error(ERR_ENCRYPTED);
            }
        }
        const dataOffset = offset + 30 + localDirectory.filenameLength + localDirectory.extraFieldLength;
        const readable = reader.readable;
        readable.diskNumberStart = diskNumberStart;
        readable.offset = dataOffset;
        const size = readable.size = compressedSize;
        const signal = getOptionValue(zipEntry, options, "signal");
        writer = initWriter(writer);
        await initStream(writer, uncompressedSize);
        const { writable  } = writer;
        const { onstart , onprogress , onend  } = options;
        const workerOptions = {
            options: {
                codecType: CODEC_INFLATE,
                password,
                zipCrypto,
                encryptionStrength: extraFieldAES && extraFieldAES.strength,
                signed: getOptionValue(zipEntry, options, "checkSignature"),
                passwordVerification: zipCrypto && (bitFlag.dataDescriptor ? rawLastModDate >>> 8 & 0xFF : signature >>> 24 & 0xFF),
                signature,
                compressed: compressionMethod != 0,
                encrypted,
                useWebWorkers: getOptionValue(zipEntry, options, "useWebWorkers"),
                useCompressionStream: getOptionValue(zipEntry, options, "useCompressionStream"),
                transferStreams: getOptionValue(zipEntry, options, "transferStreams")
            },
            config,
            streamOptions: {
                signal,
                size,
                onstart,
                onprogress,
                onend
            }
        };
        writable.size += (await runWorker1({
            readable,
            writable
        }, workerOptions)).size;
        const preventClose = getOptionValue(zipEntry, options, "preventClose");
        if (!preventClose) {
            await writable.close();
        }
        return writer.getData ? writer.getData() : writable;
    }
}
function readCommonHeader(directory, dataView, offset) {
    const rawBitFlag = directory.rawBitFlag = getUint16(dataView, offset + 2);
    const encrypted = (rawBitFlag & 0x01) == 0x01;
    const rawLastModDate = getUint32(dataView, offset + 6);
    Object.assign(directory, {
        encrypted,
        version: getUint16(dataView, offset),
        bitFlag: {
            level: (rawBitFlag & 0x06) >> 1,
            dataDescriptor: (rawBitFlag & 0x0008) == 0x0008,
            languageEncodingFlag: (rawBitFlag & 0x0800) == 0x0800
        },
        rawLastModDate,
        lastModDate: getDate(rawLastModDate),
        filenameLength: getUint16(dataView, offset + 22),
        extraFieldLength: getUint16(dataView, offset + 24)
    });
}
async function readCommonFooter(fileEntry, directory, dataView, offset) {
    const { rawExtraField  } = directory;
    const extraField = directory.extraField = new Map();
    const rawExtraFieldView = getDataView(new Uint8Array(rawExtraField));
    let offsetExtraField = 0;
    try {
        while(offsetExtraField < rawExtraField.length){
            const type = getUint16(rawExtraFieldView, offsetExtraField);
            const size = getUint16(rawExtraFieldView, offsetExtraField + 2);
            extraField.set(type, {
                type,
                data: rawExtraField.slice(offsetExtraField + 4, offsetExtraField + 4 + size)
            });
            offsetExtraField += 4 + size;
        }
    } catch (_error) {}
    const compressionMethod = getUint16(dataView, offset + 4);
    Object.assign(directory, {
        signature: getUint32(dataView, offset + 10),
        uncompressedSize: getUint32(dataView, offset + 18),
        compressedSize: getUint32(dataView, offset + 14)
    });
    const extraFieldZip64 = extraField.get(0x0001);
    if (extraFieldZip64) {
        readExtraFieldZip64(extraFieldZip64, directory);
        directory.extraFieldZip64 = extraFieldZip64;
    }
    const extraFieldUnicodePath = extraField.get(0x7075);
    if (extraFieldUnicodePath) {
        await readExtraFieldUnicode(extraFieldUnicodePath, PROPERTY_NAME_FILENAME, PROPERTY_NAME_RAW_FILENAME, directory, fileEntry);
        directory.extraFieldUnicodePath = extraFieldUnicodePath;
    }
    const extraFieldUnicodeComment = extraField.get(0x6375);
    if (extraFieldUnicodeComment) {
        await readExtraFieldUnicode(extraFieldUnicodeComment, PROPERTY_NAME_COMMENT, PROPERTY_NAME_RAW_COMMENT, directory, fileEntry);
        directory.extraFieldUnicodeComment = extraFieldUnicodeComment;
    }
    const extraFieldAES = extraField.get(0x9901);
    if (extraFieldAES) {
        readExtraFieldAES(extraFieldAES, directory, compressionMethod);
        directory.extraFieldAES = extraFieldAES;
    } else {
        directory.compressionMethod = compressionMethod;
    }
    const extraFieldNTFS = extraField.get(0x000a);
    if (extraFieldNTFS) {
        readExtraFieldNTFS(extraFieldNTFS, directory);
        directory.extraFieldNTFS = extraFieldNTFS;
    }
    const extraFieldExtendedTimestamp = extraField.get(0x5455);
    if (extraFieldExtendedTimestamp) {
        readExtraFieldExtendedTimestamp(extraFieldExtendedTimestamp, directory);
        directory.extraFieldExtendedTimestamp = extraFieldExtendedTimestamp;
    }
}
function readExtraFieldZip64(extraFieldZip64, directory) {
    directory.zip64 = true;
    const extraFieldView = getDataView(extraFieldZip64.data);
    const missingProperties = ZIP64_PROPERTIES.filter(([propertyName, max])=>directory[propertyName] == max);
    for(let indexMissingProperty = 0, offset = 0; indexMissingProperty < missingProperties.length; indexMissingProperty++){
        const [propertyName, max] = missingProperties[indexMissingProperty];
        if (directory[propertyName] == max) {
            const extraction = ZIP64_EXTRACTION[max];
            directory[propertyName] = extraFieldZip64[propertyName] = extraction.getValue(extraFieldView, offset);
            offset += extraction.bytes;
        } else if (extraFieldZip64[propertyName]) {
            throw new Error(ERR_EXTRAFIELD_ZIP64_NOT_FOUND);
        }
    }
}
async function readExtraFieldUnicode(extraFieldUnicode, propertyName, rawPropertyName, directory, fileEntry) {
    const extraFieldView = getDataView(extraFieldUnicode.data);
    const crc32 = new Crc32();
    crc32.append(fileEntry[rawPropertyName]);
    const dataViewSignature = getDataView(new Uint8Array(4));
    dataViewSignature.setUint32(0, crc32.get(), true);
    Object.assign(extraFieldUnicode, {
        version: getUint8(extraFieldView, 0),
        signature: getUint32(extraFieldView, 1),
        [propertyName]: await decodeText(extraFieldUnicode.data.subarray(5)),
        valid: !fileEntry.bitFlag.languageEncodingFlag && extraFieldUnicode.signature == getUint32(dataViewSignature, 0)
    });
    if (extraFieldUnicode.valid) {
        directory[propertyName] = extraFieldUnicode[propertyName];
        directory[propertyName + "UTF8"] = true;
    }
}
function readExtraFieldAES(extraFieldAES, directory, compressionMethod) {
    const extraFieldView = getDataView(extraFieldAES.data);
    const strength = getUint8(extraFieldView, 4);
    Object.assign(extraFieldAES, {
        vendorVersion: getUint8(extraFieldView, 0),
        vendorId: getUint8(extraFieldView, 2),
        strength,
        originalCompressionMethod: compressionMethod,
        compressionMethod: getUint16(extraFieldView, 5)
    });
    directory.compressionMethod = extraFieldAES.compressionMethod;
}
function readExtraFieldNTFS(extraFieldNTFS, directory) {
    const extraFieldView = getDataView(extraFieldNTFS.data);
    let offsetExtraField = 4;
    let tag1Data;
    try {
        while(offsetExtraField < extraFieldNTFS.data.length && !tag1Data){
            const tagValue = getUint16(extraFieldView, offsetExtraField);
            const attributeSize = getUint16(extraFieldView, offsetExtraField + 2);
            if (tagValue == 0x0001) {
                tag1Data = extraFieldNTFS.data.slice(offsetExtraField + 4, offsetExtraField + 4 + attributeSize);
            }
            offsetExtraField += 4 + attributeSize;
        }
    } catch (_error) {}
    try {
        if (tag1Data && tag1Data.length == 24) {
            const tag1View = getDataView(tag1Data);
            const rawLastModDate = tag1View.getBigUint64(0, true);
            const rawLastAccessDate = tag1View.getBigUint64(8, true);
            const rawCreationDate = tag1View.getBigUint64(16, true);
            Object.assign(extraFieldNTFS, {
                rawLastModDate,
                rawLastAccessDate,
                rawCreationDate
            });
            const lastModDate = getDateNTFS(rawLastModDate);
            const lastAccessDate = getDateNTFS(rawLastAccessDate);
            const creationDate = getDateNTFS(rawCreationDate);
            const extraFieldData = {
                lastModDate,
                lastAccessDate,
                creationDate
            };
            Object.assign(extraFieldNTFS, extraFieldData);
            Object.assign(directory, extraFieldData);
        }
    } catch (_error) {}
}
function readExtraFieldExtendedTimestamp(extraFieldExtendedTimestamp, directory) {
    const extraFieldView = getDataView(extraFieldExtendedTimestamp.data);
    const flags = getUint8(extraFieldView, 0);
    const timeProperties = [];
    const timeRawProperties = [];
    if ((flags & 0x1) == 0x1) {
        timeProperties.push(PROPERTY_NAME_LAST_MODIFICATION_DATE);
        timeRawProperties.push(PROPERTY_NAME_RAW_LAST_MODIFICATION_DATE);
    }
    if ((flags & 0x2) == 0x2) {
        timeProperties.push(PROPERTY_NAME_LAST_ACCESS_DATE);
        timeRawProperties.push(PROPERTY_NAME_RAW_LAST_ACCESS_DATE);
    }
    if ((flags & 0x4) == 0x4) {
        timeProperties.push(PROPERTY_NAME_CREATION_DATE);
        timeRawProperties.push(PROPERTY_NAME_RAW_CREATION_DATE);
    }
    let offset = 1;
    timeProperties.forEach((propertyName, indexProperty)=>{
        if (extraFieldExtendedTimestamp.data.length >= offset + 4) {
            const time = getUint32(extraFieldView, offset);
            directory[propertyName] = extraFieldExtendedTimestamp[propertyName] = new Date(time * 1000);
            const rawPropertyName = timeRawProperties[indexProperty];
            extraFieldExtendedTimestamp[rawPropertyName] = time;
        }
        offset += 4;
    });
}
async function seekSignature(reader, signature, startOffset, minimumBytes, maximumLength) {
    const signatureArray = new Uint8Array(4);
    const signatureView = getDataView(signatureArray);
    setUint32(signatureView, 0, signature);
    const maximumBytes = minimumBytes + maximumLength;
    return await seek(minimumBytes) || await seek(Math.min(maximumBytes, startOffset));
    async function seek(length) {
        const offset = startOffset - length;
        const bytes = await readUint8Array(reader, offset, length);
        for(let indexByte = bytes.length - minimumBytes; indexByte >= 0; indexByte--){
            if (bytes[indexByte] == signatureArray[0] && bytes[indexByte + 1] == signatureArray[1] && bytes[indexByte + 2] == signatureArray[2] && bytes[indexByte + 3] == signatureArray[3]) {
                return {
                    offset: offset + indexByte,
                    buffer: bytes.slice(indexByte, indexByte + minimumBytes).buffer
                };
            }
        }
    }
}
function getOptionValue(zipReader, options, name) {
    return options[name] === UNDEFINED_VALUE ? zipReader.options[name] : options[name];
}
function getDate(timeRaw) {
    const date = (timeRaw & 0xffff0000) >> 16, time = timeRaw & 0x0000ffff;
    try {
        return new Date(1980 + ((date & 0xFE00) >> 9), ((date & 0x01E0) >> 5) - 1, date & 0x001F, (time & 0xF800) >> 11, (time & 0x07E0) >> 5, (time & 0x001F) * 2, 0);
    } catch (_error) {}
}
function getDateNTFS(timeRaw) {
    return new Date(Number(timeRaw / BigInt(10000) - BigInt(11644473600000)));
}
function getUint8(view, offset) {
    return view.getUint8(offset);
}
function getUint16(view, offset) {
    return view.getUint16(offset, true);
}
function getUint32(view, offset) {
    return view.getUint32(offset, true);
}
function getBigUint64(view, offset) {
    return Number(view.getBigUint64(offset, true));
}
function setUint32(view, offset, value) {
    view.setUint32(offset, value, true);
}
function getDataView(array) {
    return new DataView(array.buffer);
}
new Uint8Array([
    0x07,
    0x00,
    0x02,
    0x00,
    0x41,
    0x45,
    0x03,
    0x00,
    0x00
]);
const importMeta = {
    url: "https://deno.land/x/zipjs@v2.6.63/lib/zip-fs.js",
    main: false
};
let baseURL;
try {
    baseURL = importMeta.url;
} catch (_error) {}
configure({
    baseURL
});
e(configure);
configure({
    Deflate: ZipDeflate,
    Inflate: ZipInflate
});
const BusinessTypes = {
    A25: "General Capacity Information",
    A29: "Already allocated capacity (AAC)",
    A43: "Requested capacity (without price)",
    A46: "System Operator redispatching",
    A53: "Planned maintenance",
    A54: "Unplanned outage",
    A85: "Internal redispatch",
    A95: "Frequency containment reserve",
    A96: "Automatic frequency restoration reserve",
    A97: "Manual frequency restoration reserve",
    A98: "Replacement reserve",
    B01: "Interconnector network evolution",
    B02: "Interconnector network dismantling",
    B03: "Counter trade",
    B04: "Congestion costs",
    B05: "Capacity allocated (including price)",
    B07: "Auction revenue",
    B08: "Total nominated capacity",
    B09: "Net position",
    B10: "Congestion income",
    B11: "Production unit",
    B33: "Area Control Error",
    B74: "Offer",
    B75: "Need",
    B95: "Procured capacity",
    C22: "Shared Balancing Reserve Capacity",
    C23: "Share of reserve capacity",
    C24: "Actual reserve capacity"
};
const ISO8601DurToSec = (pt)=>{
    pt = pt.toUpperCase().trim();
    switch(pt){
        case "PT60M":
            return 3600;
        case "PT30M":
            return 1800;
        case "PT15M":
            return 900;
        case "PT1M":
            return 60;
        case "P1D":
            return 86400;
    }
    const iso8601DurationRegex = /(-)?P(?:([.,\d]+)Y)?(?:([.,\d]+)M)?(?:([.,\d]+)W)?(?:([.,\d]+)D)?T(?:([.,\d]+)H)?(?:([.,\d]+)M)?(?:([.,\d]+)S)?/;
    const matches = pt.match(iso8601DurationRegex);
    if (matches === null) {
        throw new Error("Could not parse ISO8601 duration string '" + pt + "'");
    } else if (parseFloat(matches[2]) > 0 || parseFloat(matches[3]) > 0 || parseFloat(matches[4]) > 0 || parseFloat(matches[5]) > 0) {
        throw new Error("Could not parse ISO8601 duration string '" + pt + "', only days and smaller specifiers supported in this implementation.");
    } else {
        return ((matches[6] === undefined ? 0 : parseFloat(matches[6]) * 3600) + (matches[7] === undefined ? 0 : parseFloat(matches[7])) * 60 + (matches[8] === undefined ? 0 : parseFloat(matches[8]))) * (matches[1] === undefined ? 1 : -1);
    }
};
const ProcessTypes = {
    A01: "Day ahead",
    A02: "Intra day incremental",
    A16: "Realised",
    A18: "Intraday total",
    A31: "Week ahead",
    A32: "Month ahead",
    A33: "Year ahead",
    A39: "Synchronisation process",
    A40: "Intraday process",
    A46: "Replacement reserve",
    A47: "Manual frequency restoration reserve",
    A51: "Automatic frequency restoration reserve",
    A52: "Frequency containment reserve",
    A56: "Frequency restoration reserve",
    A60: "Scheduled activation mFRR",
    A61: "Direct activation mFRR",
    A67: "Central Selection aFRR",
    A68: "Local Selection aFRR"
};
const ParsePeriod = (period)=>{
    const baseDate = Date.parse(period.timeInterval.start), baseEndDate = Date.parse(period.timeInterval.end), periodLengthS = ISO8601DurToSec(period.resolution), periodLengthSSafe = periodLengthS || 1;
    const outputPeriod = {
        startDate: new Date(baseDate),
        endDate: new Date(baseEndDate),
        points: [],
        resolution: period.resolution,
        resolutionSeconds: periodLengthSSafe
    };
    const points = Array.isArray(period.Point) ? period.Point : [
        period.Point
    ];
    for(let i = 0; i < points.length; i++){
        const currentPos = points[i].position - 1, nextPos = points[i + 1] ? points[i + 1].position - 1 : undefined;
        const outputPoint = {
            startDate: new Date(baseDate + currentPos * periodLengthSSafe * 1000),
            endDate: nextPos ? new Date(baseDate + nextPos * periodLengthSSafe * 1000) : new Date(baseEndDate),
            position: points[i].position,
            constraintTimeSeries: points[i].Constraint_TimeSeries
        };
        if (points[i]["price.amount"]) {
            outputPoint.price = points[i]["price.amount"];
        }
        if (points[i].quantity) {
            outputPoint.quantity = points[i].quantity;
        }
        outputPeriod.points.push(outputPoint);
    }
    return outputPeriod;
};
const ParseBaseDocument = (d)=>{
    const document = {
        mRID: d.mRID,
        revision: d.revisionNumber,
        created: d.createdDateTime ? new Date(Date.parse(d.createdDateTime)) : void 0,
        documentType: d.type,
        documentTypeDescription: d.type ? DocumentTypes[d.type] : void 0,
        processType: d["process.processType"],
        processTypeDescription: d["process.processType"] ? ProcessTypes[d["process.processType"]] : void 0,
        senderMarketParticipantId: d["sender_MarketParticipant.mRID"]?.["#text"],
        senderMarketParticipantRoleType: d["sender_MarketParticipant.marketRole.type"],
        receiverMarketParticipantId: d["receiver_MarketParticipant.mRID"]?.["#text"],
        receiverMarketParticipantRoleType: d["receiver_MarketParticipant.marketRole.type"]
    };
    return document;
};
const ParsePublication = (d)=>{
    if (!d.TimeSeries) {
        throw new Error("Publication document invalid, missing TimeSeries");
    }
    const tsArray = Array.isArray(d.TimeSeries) ? d.TimeSeries : [
        d.TimeSeries
    ];
    let timeInterval = void 0;
    if (d["period.timeInterval"]?.start && d["period.timeInterval"].end) {
        timeInterval = {
            start: new Date(Date.parse(d["period.timeInterval"]?.start)),
            end: new Date(Date.parse(d["period.timeInterval"]?.end))
        };
    }
    const document = Object.assign(ParseBaseDocument(d), {
        rootType: "publication",
        timeInterval,
        timeseries: []
    });
    for (const ts of tsArray){
        const tsEntry = {
            currency: ts["currency_Unit.name"],
            priceMeasureUnit: ts["price_Measure_Unit.name"],
            quantityMeasureUnit: ts["quantity_Measure_Unit.name"],
            curveType: ts.curveType,
            businessType: ts.businessType,
            inDomain: ts["in_Domain.mRID"]?.["#text"],
            outDomain: ts["out_Domain.mRID"]?.["#text"],
            auctionId: ts["auction.mRID"],
            auctionType: ts["auction.type"],
            auctionCategory: ts["auction.category"],
            contractMarketAgreementType: ts["contract_MarketAgreement.type"],
            classificationSequenceAICPosition: ts["classificationSequence_AttributeInstanceComponent.position"],
            businessTypeDescription: ts.businessType ? BusinessTypes[ts.businessType] : void 0,
            periods: []
        };
        const periodArray = Array.isArray(ts.Period) ? ts.Period : ts.Period ? [
            ts.Period
        ] : [];
        for (const inputPeriod of periodArray){
            tsEntry.periods?.push(ParsePeriod(inputPeriod));
        }
        document.timeseries.push(tsEntry);
    }
    return document;
};
const PsrTypes = {
    A03: "Mixed",
    A04: "Generation",
    A05: "Load",
    B01: "Biomass",
    B02: "Fossil Brown coal/Lignite",
    B03: "Fossil Coal-derived gas",
    B04: "Fossil Gas",
    B05: "Fossil Hard coal",
    B06: "Fossil Oil",
    B07: "Fossil Oil shale",
    B08: "Fossil Peat",
    B09: "Geothermal",
    B10: "Hydro Pumped Storage",
    B11: "Hydro Run-of-river and poundage",
    B12: "Hydro Water Reservoir",
    B13: "Marine",
    B14: "Nuclear",
    B15: "Other renewable",
    B16: "Solar",
    B17: "Waste",
    B18: "Wind Offshore",
    B19: "Wind Onshore",
    B20: "Other",
    B21: "AC Link",
    B22: "DC Link",
    B23: "Substation",
    B24: "Transformer"
};
const ParseGL = (d)=>{
    if (!d.TimeSeries) {
        throw new Error("GL document invalid, missing TimeSeries");
    }
    const tsArray = Array.isArray(d.TimeSeries) ? d.TimeSeries : [
        d.TimeSeries
    ];
    let timeInterval = void 0;
    if (d["time_Period.timeInterval"]?.start && d["time_Period.timeInterval"].end) {
        timeInterval = {
            start: new Date(Date.parse(d["time_Period.timeInterval"]?.start)),
            end: new Date(Date.parse(d["time_Period.timeInterval"]?.end))
        };
    }
    const document = Object.assign(ParseBaseDocument(d), {
        rootType: "gl",
        timeInterval,
        timeseries: []
    });
    for (const ts of tsArray){
        const tsEntry = {
            outBiddingZone: ts["outBiddingZone_Domain.mRID"]?.["#text"],
            inBiddingZone: ts["inBiddingZone_Domain.mRID"]?.["#text"],
            curveType: ts.curveType,
            objectAggregation: ts.objectAggregation,
            mktPsrType: ts.MktPSRType?.psrType,
            businessType: ts.businessType,
            businessTypeDescription: ts.businessType ? BusinessTypes[ts.businessType] : void 0,
            mktPsrTypeDescription: ts.MktPSRType?.psrType ? PsrTypes[ts.MktPSRType?.psrType] : void 0,
            quantityMeasureUnit: ts["quantity_Measure_Unit.name"],
            periods: []
        };
        const periodArray = Array.isArray(ts.Period) ? ts.Period : ts.Period ? [
            ts.Period
        ] : [];
        for (const inputPeriod of periodArray){
            tsEntry.periods?.push(ParsePeriod(inputPeriod));
        }
        document.timeseries.push(tsEntry);
    }
    return document;
};
const ParseUnavailability = (d)=>{
    if (!d.TimeSeries) {
        throw new Error("Unavalibility document invalid, missing TimeSeries");
    }
    const tsArray = Array.isArray(d.TimeSeries) ? d.TimeSeries : [
        d.TimeSeries
    ];
    let timeInterval = void 0;
    if (d["unavailability_Time_Period.timeInterval"]?.start && d["unavailability_Time_Period.timeInterval"].end) {
        timeInterval = {
            start: new Date(Date.parse(d["unavailability_Time_Period.timeInterval"]?.start)),
            end: new Date(Date.parse(d["unavailability_Time_Period.timeInterval"]?.end))
        };
    }
    const document = Object.assign(ParseBaseDocument(d), {
        rootType: "unavailability",
        timeInterval,
        timeseries: []
    });
    for (const outage of tsArray){
        let startDate;
        if (outage["start_DateAndOrTime.date"]) {
            if (outage["start_DateAndOrTime.time"]) {
                startDate = new Date(Date.parse(outage["start_DateAndOrTime.date"] + "T" + outage["start_DateAndOrTime.time"]));
            } else {
                startDate = new Date(Date.parse(outage["start_DateAndOrTime.date"] + "T00:00:00Z"));
            }
        }
        let endDate;
        if (outage["end_DateAndOrTime.date"]) {
            if (outage["end_DateAndOrTime.time"]) {
                endDate = new Date(Date.parse(outage["end_DateAndOrTime.date"] + "T" + outage["start_DateAndOrTime.time"]));
            } else {
                endDate = new Date(Date.parse(outage["end_DateAndOrTime.date"] + "T00:00:00Z"));
            }
        }
        const ts = Object.assign(ParseBaseDocument(d), {
            startDate: startDate,
            endDate: endDate,
            rootType: "unavailability",
            resourceName: outage["production_RegisteredResource.name"],
            resourceLocation: outage["production_RegisteredResource.location.name"],
            businessType: outage.businessType,
            businessTypeDescription: outage.businessType ? BusinessTypes[outage.businessType] : void 0,
            psrName: outage["production_RegisteredResource.pSRType.powerSystemResources.name"],
            psrNominalPowerUnit: outage["production_RegisteredResource.pSRType.powerSystemResources.nominalP"] ? outage["production_RegisteredResource.pSRType.powerSystemResources.nominalP"]["@unit"] : void 0,
            psrNominalPower: outage["production_RegisteredResource.pSRType.powerSystemResources.nominalP"] ? outage["production_RegisteredResource.pSRType.powerSystemResources.nominalP"]["#text"] : "0",
            psrType: outage["production_RegisteredResource.pSRType.psrType"] ? PsrTypes[outage["production_RegisteredResource.pSRType.psrType"]] : void 0,
            reasonCode: outage.Reason?.code,
            reasonText: outage.Reason?.text,
            periods: []
        });
        const availablePeriodArray = Array.isArray(outage.Available_Period) ? outage.Available_Period : outage.Available_Period ? [
            outage.Available_Period
        ] : [];
        for (const avail of availablePeriodArray){
            ts.periods?.push(ParsePeriod(avail));
        }
        document.timeseries.push(ts);
    }
    return document;
};
const ParseConfiguration = (d)=>{
    if (!d.TimeSeries) {
        throw new Error("Unavalibility document invalid, missing TimeSeries");
    }
    const tsArray = Array.isArray(d.TimeSeries) ? d.TimeSeries : [
        d.TimeSeries
    ];
    const document = Object.assign(ParseBaseDocument(d), {
        rootType: "configuration",
        timeseries: []
    });
    for (const configuration of tsArray){
        let implementationDate;
        if (configuration["implementation_DateAndOrTime.date"]) {
            if (configuration["implementation_DateAndOrTime.time"]) {
                implementationDate = new Date(Date.parse(configuration["implementation_DateAndOrTime.date"] + "T" + configuration["implementation_DateAndOrTime.time"]));
            } else {
                implementationDate = new Date(Date.parse(configuration["implementation_DateAndOrTime.date"] + "T00:00:00Z"));
            }
        }
        const ts = Object.assign(ParseBaseDocument(d), {
            implementationDate,
            businessType: configuration.businessType,
            businessTypeDescription: configuration.businessType ? BusinessTypes[configuration.businessType] : void 0,
            biddingZoneDomain: configuration["biddingZone_Domain.mRID"]?.["#text"],
            registeredResourceId: configuration["registeredResource.mRID"]?.["#text"],
            registeredResourceName: configuration["registeredResource.name"],
            registeredResourceLocation: configuration["registeredResource.location.name"],
            controlAreaDomain: configuration.ControlArea_Domain?.mRID?.["#text"],
            providerMarketParticipant: configuration["Provider_MarketParticipant"]?.mRID?.["#text"],
            psrType: configuration.MktPSRType?.psrType,
            psrHighvoltageLimit: configuration.MktPSRType?.["production_PowerSystemResources.highVoltageLimit"]?.["#text"],
            psrHighvoltageLimitUnit: configuration.MktPSRType?.["production_PowerSystemResources.highVoltageLimit"]?.["@unit"],
            psrNominalPower: configuration.MktPSRType?.["nominalIP_PowerSystemResources.nominalP"]?.["#text"],
            psrNominalPowerUnit: configuration.MktPSRType?.["nominalIP_PowerSystemResources.nominalP"]?.["@unit"],
            generatingUnit: []
        });
        if (configuration.GeneratingUnit_PowerSystemResources?.length) {
            for (const gu of configuration.GeneratingUnit_PowerSystemResources){
                const guResult = {
                    nominalPower: gu.nominalP?.["#text"],
                    nominalPowerUnit: gu.nominalP?.["@unit"],
                    name: gu.name,
                    locationName: gu["generatingUnit_Location.name"],
                    psrType: gu["generatingUnit_PSRType.psrType"],
                    id: gu.mRID?.["#text"]
                };
                ts.generatingUnit?.push(guResult);
            }
        }
        document.timeseries.push(ts);
    }
    return document;
};
const ParseTransmissionNetwork = (d)=>{
    if (!d.TimeSeries) {
        throw new Error("TransmissionNetwork document invalid, missing TimeSeries");
    }
    const tsArray = Array.isArray(d.TimeSeries) ? d.TimeSeries : [
        d.TimeSeries
    ];
    let timeInterval = void 0;
    if (d["period.timeInterval"]?.start && d["period.timeInterval"].end) {
        timeInterval = {
            start: new Date(Date.parse(d["period.timeInterval"]?.start)),
            end: new Date(Date.parse(d["period.timeInterval"]?.end))
        };
    }
    const document = Object.assign(ParseBaseDocument(d), {
        rootType: "transmissionnetwork",
        timeInterval,
        timeseries: []
    });
    for (const ts of tsArray){
        let endDate;
        if (ts["end_DateAndOrTime.date"]) {
            if (ts["end_DateAndOrTime.time"]) {
                endDate = new Date(Date.parse(ts["end_DateAndOrTime.date"] + "T" + ts["end_DateAndOrTime.time"]));
            } else {
                endDate = new Date(Date.parse(ts["end_DateAndOrTime.date"] + "T00:00:00Z"));
            }
        }
        const tsEntry = {
            endDate: endDate,
            quantityMeasureUnit: ts["quantity_Measure_Unit.name"],
            curveType: ts.curveType,
            businessType: ts.businessType,
            inDomain: ts["in_Domain.mRID"]?.["#text"],
            outDomain: ts["out_Domain.mRID"]?.["#text"],
            businessTypeDescription: ts.businessType ? BusinessTypes[ts.businessType] : void 0,
            assetRegisteredResourceId: ts.Asset_RegisteredResource?.mRID?.["#text"],
            assetRegisteredResourcePsrType: ts.Asset_RegisteredResource?.["pSRType.psrType"],
            assetRegisteredResourcePsrTypeDescription: ts.Asset_RegisteredResource?.["pSRType.psrType"] ? PsrTypes[ts.Asset_RegisteredResource?.["pSRType.psrType"]] : void 0,
            assetRegisteredResourceLocationName: ts.Asset_RegisteredResource?.["location.name"],
            periods: []
        };
        const periodArray = Array.isArray(ts.Period) ? ts.Period : ts.Period ? [
            ts.Period
        ] : [];
        for (const inputPeriod of periodArray){
            tsEntry.periods?.push(ParsePeriod(inputPeriod));
        }
        document.timeseries.push(tsEntry);
    }
    return document;
};
const ParseBalancing = (d)=>{
    if (!d.TimeSeries) {
        throw new Error("Balancing document invalid, missing TimeSeries");
    }
    const tsArray = Array.isArray(d.TimeSeries) ? d.TimeSeries : [
        d.TimeSeries
    ];
    let timeInterval = void 0;
    if (d["period.timeInterval"]?.start && d["period.timeInterval"].end) {
        timeInterval = {
            start: new Date(Date.parse(d["period.timeInterval"]?.start)),
            end: new Date(Date.parse(d["period.timeInterval"]?.end))
        };
    }
    const document = Object.assign(ParseBaseDocument(d), {
        rootType: "balancing",
        areaDomainId: d["area_Domain.mRID"]?.["#text"],
        timeInterval,
        timeseries: []
    });
    for (const ts of tsArray){
        const tsEntry = {
            quantityMeasureUnit: ts["quantity_Measure_Unit.name"],
            curveType: ts.curveType,
            businessType: ts.businessType,
            flowDirection: ts["flowDirection.direction"],
            businessTypeDescription: ts.businessType ? BusinessTypes[ts.businessType] : void 0,
            periods: []
        };
        const periodArray = Array.isArray(ts.Period) ? ts.Period : ts.Period ? [
            ts.Period
        ] : [];
        for (const inputPeriod of periodArray){
            tsEntry.periods?.push(ParsePeriod(inputPeriod));
        }
        document.timeseries.push(tsEntry);
    }
    return document;
};
const ParseCriticalNetworkElement = (d)=>{
    if (!d.TimeSeries) {
        throw new Error("CriticalNetworkElement document invalid, missing TimeSeries");
    }
    const tsArray = Array.isArray(d.TimeSeries) ? d.TimeSeries : [
        d.TimeSeries
    ];
    let timeInterval = void 0;
    if (d["time_Period.timeInterval"]?.start && d["time_Period.timeInterval"].end) {
        timeInterval = {
            start: new Date(Date.parse(d["time_Period.timeInterval"]?.start)),
            end: new Date(Date.parse(d["time_Period.timeInterval"]?.end))
        };
    }
    const document = Object.assign(ParseBaseDocument(d), {
        rootType: "criticalnetworkelement",
        timeInterval,
        timeseries: []
    });
    for (const ts of tsArray){
        const tsEntry = {
            curveType: ts.curveType,
            businessType: ts.businessType,
            businessTypeDescription: ts.businessType ? BusinessTypes[ts.businessType] : void 0,
            periods: []
        };
        const periodArray = Array.isArray(ts.Period) ? ts.Period : ts.Period ? [
            ts.Period
        ] : [];
        for (const inputPeriod of periodArray){
            tsEntry.periods?.push(ParsePeriod(inputPeriod));
        }
        document.timeseries.push(tsEntry);
    }
    return document;
};
const ParseDocument = (xmlDocument)=>{
    const parser = new vt({
        ignoreAttributes: false,
        attributeNamePrefix: "@"
    });
    const doc = parser.parse(xmlDocument);
    if (doc.Publication_MarketDocument) {
        return ParsePublication(doc.Publication_MarketDocument);
    } else if (doc.GL_MarketDocument) {
        return ParseGL(doc.GL_MarketDocument);
    } else if (doc.Unavailability_MarketDocument) {
        return ParseUnavailability(doc.Unavailability_MarketDocument);
    } else if (doc.Configuration_MarketDocument) {
        return ParseConfiguration(doc.Configuration_MarketDocument);
    } else if (doc.TransmissionNetwork_MarketDocument) {
        return ParseTransmissionNetwork(doc.TransmissionNetwork_MarketDocument);
    } else if (doc.Balancing_MarketDocument) {
        return ParseBalancing(doc.Balancing_MarketDocument);
    } else if (doc.CriticalNetworkElement_MarketDocument) {
        return ParseCriticalNetworkElement(doc.CriticalNetworkElement_MarketDocument);
    } else if (doc.Acknowledgement_MarketDocument) {
        const invalidRootNode = doc.Acknowledgement_MarketDocument;
        throw new Error(`Request failed. Code '${invalidRootNode.Reason.code}', Reason '${invalidRootNode.Reason.text}'`);
    } else {
        throw new Error("Unknown XML document structure received");
    }
};
const ENTSOE_ENDPOINT = "https://web-api.tp.entsoe.eu/api";
const ComposeQuery = (securityToken, params, force)=>{
    const query = new URLSearchParams({
        securityToken
    });
    if (!(params.documentType in DocumentTypes) && !force) {
        throw new Error("Invalid document type requested");
    } else {
        query.append("DocumentType", params.documentType);
    }
    if (params.processType !== undefined) {
        if (!(params.processType in ProcessTypes) && !force) {
            throw new Error("Invalid process type requested");
        } else {
            query.append("ProcessType", params.processType);
        }
    }
    if (params.businessType !== undefined) {
        if (!(params.businessType in BusinessTypes) && !force) {
            throw new Error("Invalid business type requested");
        } else {
            query.append("BusinessType", params.businessType);
        }
    }
    if (params.psrType !== undefined) {
        if (!(params.psrType in PsrTypes) && !force) {
            throw new Error("Invalid psr type requested");
        } else {
            query.append("PsrType", params.psrType);
        }
    }
    if (params.inDomain) {
        if (!(params.inDomain in Areas) && !force) {
            throw new Error("inDomain not valid");
        } else {
            query.append("In_Domain", params.inDomain);
        }
    }
    if (params.inBiddingZoneDomain) {
        if (!(params.inBiddingZoneDomain in Areas) && !force) {
            throw new Error("inBiddingZoneDomain not valid");
        } else {
            query.append("InBiddingZone_Domain", params.inBiddingZoneDomain);
        }
    }
    if (params.biddingZoneDomain) {
        if (!(params.biddingZoneDomain in Areas) && !force) {
            throw new Error("biddingZoneDomain not valid");
        } else {
            query.append("BiddingZone_Domain", params.biddingZoneDomain);
        }
    }
    if (params.offset !== void 0) {
        if (params.offset > 5000) {
            throw new Error("Offset too large");
        }
        if (params.offset < 0) {
            throw new Error("Offset too small");
        }
        query.append("offset", params.offset.toString());
    }
    if (params.outDomain) {
        if (!(params.outDomain in Areas) && !force) {
            throw new Error("outDomain not valid");
        } else {
            query.append("Out_Domain", params.outDomain);
        }
    }
    if (params.outBiddingZoneDomain) {
        if (!(params.outBiddingZoneDomain in Areas) && !force) {
            throw new Error("outBiddingZoneDomain not valid");
        } else {
            query.append("OutBiddingZone_Domain", params.outBiddingZoneDomain);
        }
    }
    if (params.contractMarketAgreementType) {
        query.append("Contract_MarketAgreement.Type", params.contractMarketAgreementType);
    }
    if (params.auctionType) {
        query.append("Auction.Type", params.auctionType);
    }
    if (params.classificationSequenceAICPosition) {
        query.append("ClassificationSequence_AttributeInstanceComponent.Position", params.classificationSequenceAICPosition);
    }
    if (params.auctionCategory) {
        query.append("Auction.Category", params.auctionCategory);
    }
    if (params.connectingDomain) {
        query.append("connecting_Domain", params.connectingDomain);
    }
    if (params.standardMarketProduct) {
        query.append("Standard_MarketProduct", params.standardMarketProduct);
    }
    if (params.originalMarketProduct) {
        query.append("Original_MarketProduct", params.originalMarketProduct);
    }
    if (params.registeredResource) {
        query.append("registeredResource", params.registeredResource);
    }
    if (params.acquiringDomain) {
        query.append("Acquiring_Domain", params.acquiringDomain);
    }
    if (params.mRID) {
        query.append("mRID", params.mRID);
    }
    if (params.docStatus) {
        query.append("DocStatus", params.docStatus);
    }
    if (params.startDateTimeUpdate) {
        if (!(params.startDateTimeUpdate instanceof Date && !isNaN(params.startDateTimeUpdate.getTime()))) {
            throw new Error("startDateTimeUpdate not valid, should be Date object");
        }
        if (!(params.endDateTimeUpdate instanceof Date && !isNaN(params.endDateTimeUpdate.getTime()))) {
            throw new Error("endDateTimeUpdate not valid, should be Date object");
        }
        const timeInterval = `${params.startDateTimeUpdate.toISOString()}/${params.endDateTimeUpdate.toISOString()}`;
        query.append("TimeIntervalUpdate", timeInterval);
    }
    if (params.startDateTime) {
        if (!(params.startDateTime instanceof Date && !isNaN(params.startDateTime.getTime()))) {
            throw new Error("startDateTime not valid, should be Date object");
        }
        if (!(params.endDateTime instanceof Date && !isNaN(params.endDateTime.getTime()))) {
            throw new Error("endDateTime not valid, should be Date object");
        }
        const timeInterval = `${params.startDateTime.toISOString()}/${params.endDateTime.toISOString()}`;
        query.append("TimeInterval", timeInterval);
    }
    if (params.implementationDateAndOrTime) {
        if (typeof params.implementationDateAndOrTime !== "string") {
            throw new Error("implementationDateAndOrTime not valid, should be string in ISO8601 format");
        }
        query.append("Implementation_DateAndOrTime", params.implementationDateAndOrTime);
    }
    if (!params.startDateTime && !params.startDateTimeUpdate && !params.implementationDateAndOrTime && !force) {
        throw new Error("startDateTime, startDateTimeUpdate or implementationDateAndOrTime must be specified");
    }
    return query;
};
const Query = async (securityToken, params)=>{
    const query = ComposeQuery(securityToken, params);
    const result = await fetch(`${ENTSOE_ENDPOINT}?${query}`);
    if (result.status === 401) {
        throw new Error("401 Unauthorized. Missing or invalid security token.");
    }
    const documents = [];
    if (result.headers.get("content-type")?.includes("xml") || !result.headers.has("content-type")) {
        documents.push(await ParseDocument(await result.text()));
    } else if (result.headers.get("content-type") === "application/zip") {
        let zipReader;
        try {
            const zipDataReader = new Uint8ArrayReader(new Uint8Array(await result.arrayBuffer()));
            zipReader = new ZipReader(zipDataReader, {
                useWebWorkers: false
            });
            for (const xmlFileEntry of (await zipReader.getEntries())){
                const stringDataWriter = new TextWriter();
                await xmlFileEntry.getData(stringDataWriter);
                const xmlFileData = await stringDataWriter.getData();
                const result = await ParseDocument(xmlFileData);
                if (result) documents.push(result);
            }
        } finally{
            await zipReader?.close();
        }
    }
    return documents;
};
const QueryUnavailability = async (securityToken, params)=>{
    const result = await Query(securityToken, params);
    if (result && Array.isArray(result) && result.length && result[0].rootType === "unavailability") return result;
    if (result && Array.isArray(result) && result.length && result[0].rootType !== "unavailability") {
        throw new Error("Got " + result[0].rootType + " when expecting unavailability document");
    }
    return [];
};
const EntsoeOutages = async (area, startDate, endDate)=>{
    startDate.setHours(0, 0, 0, 0);
    endDate.setHours(23, 0, 0, 0);
    const resultGen = await QueryUnavailability(Deno.env.get("API_TOKEN"), {
        documentType: DocumentType("Generation unavailability") || "",
        biddingZoneDomain: Area(area),
        startDateTime: startDate,
        endDateTime: endDate,
        offset: 0
    });
    const resultPro = await QueryUnavailability(Deno.env.get("API_TOKEN"), {
        documentType: DocumentType("Production unavailability") || "",
        biddingZoneDomain: Area(area),
        startDateTime: startDate,
        endDateTime: endDate,
        offset: 0
    });
    const outageRows = [];
    for (const outageDoc of [
        ...resultGen,
        ...resultPro
    ]){
        for (const outage of outageDoc.timeseries){
            const outageRow = {
                businessType: outage.businessTypeDescription || "",
                documentType: outageDoc.documentTypeDescription || "",
                startDate: outage.startDate,
                endDate: outage.endDate,
                resourceName: outage.resourceName || "",
                mRID: outageDoc.mRID,
                revision: outageDoc.revision,
                location: outage.resourceLocation,
                psrName: outage.psrName,
                psrNominalPowerUnit: outage.psrNominalPowerUnit,
                psrNominalPower: outage.psrNominalPower,
                psrType: outage.psrType,
                reasonCode: outage.reasonCode,
                reasonText: outage.reasonText,
                availablePeriodArray: []
            };
            if (outage.periods) {
                for (const avail of outage.periods){
                    for (const p of avail.points){
                        outageRow.availablePeriodArray.push({
                            start: p.startDate,
                            end: p.endDate,
                            quantity: p.quantity || 0,
                            resolution: avail.resolution
                        });
                    }
                }
            }
            outageRows.push(outageRow);
        }
    }
    return outageRows;
};
const osType = (()=>{
    const { Deno: Deno1  } = globalThis;
    if (typeof Deno1?.build?.os === "string") {
        return Deno1.build.os;
    }
    const { navigator: navigator1  } = globalThis;
    if (navigator1?.appVersion?.includes?.("Win")) {
        return "windows";
    }
    return "linux";
})();
const isWindows = osType === "windows";
const CHAR_FORWARD_SLASH = 47;
function assertPath(path) {
    if (typeof path !== "string") {
        throw new TypeError(`Path must be a string. Received ${JSON.stringify(path)}`);
    }
}
function isPosixPathSeparator(code) {
    return code === 47;
}
function isPathSeparator(code) {
    return isPosixPathSeparator(code) || code === 92;
}
function isWindowsDeviceRoot(code) {
    return code >= 97 && code <= 122 || code >= 65 && code <= 90;
}
function normalizeString(path, allowAboveRoot, separator, isPathSeparator) {
    let res = "";
    let lastSegmentLength = 0;
    let lastSlash = -1;
    let dots = 0;
    let code;
    for(let i = 0, len = path.length; i <= len; ++i){
        if (i < len) code = path.charCodeAt(i);
        else if (isPathSeparator(code)) break;
        else code = CHAR_FORWARD_SLASH;
        if (isPathSeparator(code)) {
            if (lastSlash === i - 1 || dots === 1) {} else if (lastSlash !== i - 1 && dots === 2) {
                if (res.length < 2 || lastSegmentLength !== 2 || res.charCodeAt(res.length - 1) !== 46 || res.charCodeAt(res.length - 2) !== 46) {
                    if (res.length > 2) {
                        const lastSlashIndex = res.lastIndexOf(separator);
                        if (lastSlashIndex === -1) {
                            res = "";
                            lastSegmentLength = 0;
                        } else {
                            res = res.slice(0, lastSlashIndex);
                            lastSegmentLength = res.length - 1 - res.lastIndexOf(separator);
                        }
                        lastSlash = i;
                        dots = 0;
                        continue;
                    } else if (res.length === 2 || res.length === 1) {
                        res = "";
                        lastSegmentLength = 0;
                        lastSlash = i;
                        dots = 0;
                        continue;
                    }
                }
                if (allowAboveRoot) {
                    if (res.length > 0) res += `${separator}..`;
                    else res = "..";
                    lastSegmentLength = 2;
                }
            } else {
                if (res.length > 0) res += separator + path.slice(lastSlash + 1, i);
                else res = path.slice(lastSlash + 1, i);
                lastSegmentLength = i - lastSlash - 1;
            }
            lastSlash = i;
            dots = 0;
        } else if (code === 46 && dots !== -1) {
            ++dots;
        } else {
            dots = -1;
        }
    }
    return res;
}
function _format(sep, pathObject) {
    const dir = pathObject.dir || pathObject.root;
    const base = pathObject.base || (pathObject.name || "") + (pathObject.ext || "");
    if (!dir) return base;
    if (base === sep) return dir;
    if (dir === pathObject.root) return dir + base;
    return dir + sep + base;
}
const WHITESPACE_ENCODINGS = {
    "\u0009": "%09",
    "\u000A": "%0A",
    "\u000B": "%0B",
    "\u000C": "%0C",
    "\u000D": "%0D",
    "\u0020": "%20"
};
function encodeWhitespace(string) {
    return string.replaceAll(/[\s]/g, (c)=>{
        return WHITESPACE_ENCODINGS[c] ?? c;
    });
}
function lastPathSegment(path, isSep, start = 0) {
    let matchedNonSeparator = false;
    let end = path.length;
    for(let i = path.length - 1; i >= start; --i){
        if (isSep(path.charCodeAt(i))) {
            if (matchedNonSeparator) {
                start = i + 1;
                break;
            }
        } else if (!matchedNonSeparator) {
            matchedNonSeparator = true;
            end = i + 1;
        }
    }
    return path.slice(start, end);
}
function stripTrailingSeparators(segment, isSep) {
    if (segment.length <= 1) {
        return segment;
    }
    let end = segment.length;
    for(let i = segment.length - 1; i > 0; i--){
        if (isSep(segment.charCodeAt(i))) {
            end = i;
        } else {
            break;
        }
    }
    return segment.slice(0, end);
}
function stripSuffix(name, suffix) {
    if (suffix.length >= name.length) {
        return name;
    }
    const lenDiff = name.length - suffix.length;
    for(let i = suffix.length - 1; i >= 0; --i){
        if (name.charCodeAt(lenDiff + i) !== suffix.charCodeAt(i)) {
            return name;
        }
    }
    return name.slice(0, -suffix.length);
}
class DenoStdInternalError extends Error {
    constructor(message){
        super(message);
        this.name = "DenoStdInternalError";
    }
}
function assert(expr, msg = "") {
    if (!expr) {
        throw new DenoStdInternalError(msg);
    }
}
const sep = "\\";
const delimiter = ";";
function resolve(...pathSegments) {
    let resolvedDevice = "";
    let resolvedTail = "";
    let resolvedAbsolute = false;
    for(let i = pathSegments.length - 1; i >= -1; i--){
        let path;
        const { Deno: Deno1  } = globalThis;
        if (i >= 0) {
            path = pathSegments[i];
        } else if (!resolvedDevice) {
            if (typeof Deno1?.cwd !== "function") {
                throw new TypeError("Resolved a drive-letter-less path without a CWD.");
            }
            path = Deno1.cwd();
        } else {
            if (typeof Deno1?.env?.get !== "function" || typeof Deno1?.cwd !== "function") {
                throw new TypeError("Resolved a relative path without a CWD.");
            }
            path = Deno1.cwd();
            if (path === undefined || path.slice(0, 3).toLowerCase() !== `${resolvedDevice.toLowerCase()}\\`) {
                path = `${resolvedDevice}\\`;
            }
        }
        assertPath(path);
        const len = path.length;
        if (len === 0) continue;
        let rootEnd = 0;
        let device = "";
        let isAbsolute = false;
        const code = path.charCodeAt(0);
        if (len > 1) {
            if (isPathSeparator(code)) {
                isAbsolute = true;
                if (isPathSeparator(path.charCodeAt(1))) {
                    let j = 2;
                    let last = j;
                    for(; j < len; ++j){
                        if (isPathSeparator(path.charCodeAt(j))) break;
                    }
                    if (j < len && j !== last) {
                        const firstPart = path.slice(last, j);
                        last = j;
                        for(; j < len; ++j){
                            if (!isPathSeparator(path.charCodeAt(j))) break;
                        }
                        if (j < len && j !== last) {
                            last = j;
                            for(; j < len; ++j){
                                if (isPathSeparator(path.charCodeAt(j))) break;
                            }
                            if (j === len) {
                                device = `\\\\${firstPart}\\${path.slice(last)}`;
                                rootEnd = j;
                            } else if (j !== last) {
                                device = `\\\\${firstPart}\\${path.slice(last, j)}`;
                                rootEnd = j;
                            }
                        }
                    }
                } else {
                    rootEnd = 1;
                }
            } else if (isWindowsDeviceRoot(code)) {
                if (path.charCodeAt(1) === 58) {
                    device = path.slice(0, 2);
                    rootEnd = 2;
                    if (len > 2) {
                        if (isPathSeparator(path.charCodeAt(2))) {
                            isAbsolute = true;
                            rootEnd = 3;
                        }
                    }
                }
            }
        } else if (isPathSeparator(code)) {
            rootEnd = 1;
            isAbsolute = true;
        }
        if (device.length > 0 && resolvedDevice.length > 0 && device.toLowerCase() !== resolvedDevice.toLowerCase()) {
            continue;
        }
        if (resolvedDevice.length === 0 && device.length > 0) {
            resolvedDevice = device;
        }
        if (!resolvedAbsolute) {
            resolvedTail = `${path.slice(rootEnd)}\\${resolvedTail}`;
            resolvedAbsolute = isAbsolute;
        }
        if (resolvedAbsolute && resolvedDevice.length > 0) break;
    }
    resolvedTail = normalizeString(resolvedTail, !resolvedAbsolute, "\\", isPathSeparator);
    return resolvedDevice + (resolvedAbsolute ? "\\" : "") + resolvedTail || ".";
}
function normalize(path) {
    assertPath(path);
    const len = path.length;
    if (len === 0) return ".";
    let rootEnd = 0;
    let device;
    let isAbsolute = false;
    const code = path.charCodeAt(0);
    if (len > 1) {
        if (isPathSeparator(code)) {
            isAbsolute = true;
            if (isPathSeparator(path.charCodeAt(1))) {
                let j = 2;
                let last = j;
                for(; j < len; ++j){
                    if (isPathSeparator(path.charCodeAt(j))) break;
                }
                if (j < len && j !== last) {
                    const firstPart = path.slice(last, j);
                    last = j;
                    for(; j < len; ++j){
                        if (!isPathSeparator(path.charCodeAt(j))) break;
                    }
                    if (j < len && j !== last) {
                        last = j;
                        for(; j < len; ++j){
                            if (isPathSeparator(path.charCodeAt(j))) break;
                        }
                        if (j === len) {
                            return `\\\\${firstPart}\\${path.slice(last)}\\`;
                        } else if (j !== last) {
                            device = `\\\\${firstPart}\\${path.slice(last, j)}`;
                            rootEnd = j;
                        }
                    }
                }
            } else {
                rootEnd = 1;
            }
        } else if (isWindowsDeviceRoot(code)) {
            if (path.charCodeAt(1) === 58) {
                device = path.slice(0, 2);
                rootEnd = 2;
                if (len > 2) {
                    if (isPathSeparator(path.charCodeAt(2))) {
                        isAbsolute = true;
                        rootEnd = 3;
                    }
                }
            }
        }
    } else if (isPathSeparator(code)) {
        return "\\";
    }
    let tail;
    if (rootEnd < len) {
        tail = normalizeString(path.slice(rootEnd), !isAbsolute, "\\", isPathSeparator);
    } else {
        tail = "";
    }
    if (tail.length === 0 && !isAbsolute) tail = ".";
    if (tail.length > 0 && isPathSeparator(path.charCodeAt(len - 1))) {
        tail += "\\";
    }
    if (device === undefined) {
        if (isAbsolute) {
            if (tail.length > 0) return `\\${tail}`;
            else return "\\";
        } else if (tail.length > 0) {
            return tail;
        } else {
            return "";
        }
    } else if (isAbsolute) {
        if (tail.length > 0) return `${device}\\${tail}`;
        else return `${device}\\`;
    } else if (tail.length > 0) {
        return device + tail;
    } else {
        return device;
    }
}
function isAbsolute(path) {
    assertPath(path);
    const len = path.length;
    if (len === 0) return false;
    const code = path.charCodeAt(0);
    if (isPathSeparator(code)) {
        return true;
    } else if (isWindowsDeviceRoot(code)) {
        if (len > 2 && path.charCodeAt(1) === 58) {
            if (isPathSeparator(path.charCodeAt(2))) return true;
        }
    }
    return false;
}
function join(...paths) {
    const pathsCount = paths.length;
    if (pathsCount === 0) return ".";
    let joined;
    let firstPart = null;
    for(let i = 0; i < pathsCount; ++i){
        const path = paths[i];
        assertPath(path);
        if (path.length > 0) {
            if (joined === undefined) joined = firstPart = path;
            else joined += `\\${path}`;
        }
    }
    if (joined === undefined) return ".";
    let needsReplace = true;
    let slashCount = 0;
    assert(firstPart != null);
    if (isPathSeparator(firstPart.charCodeAt(0))) {
        ++slashCount;
        const firstLen = firstPart.length;
        if (firstLen > 1) {
            if (isPathSeparator(firstPart.charCodeAt(1))) {
                ++slashCount;
                if (firstLen > 2) {
                    if (isPathSeparator(firstPart.charCodeAt(2))) ++slashCount;
                    else {
                        needsReplace = false;
                    }
                }
            }
        }
    }
    if (needsReplace) {
        for(; slashCount < joined.length; ++slashCount){
            if (!isPathSeparator(joined.charCodeAt(slashCount))) break;
        }
        if (slashCount >= 2) joined = `\\${joined.slice(slashCount)}`;
    }
    return normalize(joined);
}
function relative(from, to) {
    assertPath(from);
    assertPath(to);
    if (from === to) return "";
    const fromOrig = resolve(from);
    const toOrig = resolve(to);
    if (fromOrig === toOrig) return "";
    from = fromOrig.toLowerCase();
    to = toOrig.toLowerCase();
    if (from === to) return "";
    let fromStart = 0;
    let fromEnd = from.length;
    for(; fromStart < fromEnd; ++fromStart){
        if (from.charCodeAt(fromStart) !== 92) break;
    }
    for(; fromEnd - 1 > fromStart; --fromEnd){
        if (from.charCodeAt(fromEnd - 1) !== 92) break;
    }
    const fromLen = fromEnd - fromStart;
    let toStart = 0;
    let toEnd = to.length;
    for(; toStart < toEnd; ++toStart){
        if (to.charCodeAt(toStart) !== 92) break;
    }
    for(; toEnd - 1 > toStart; --toEnd){
        if (to.charCodeAt(toEnd - 1) !== 92) break;
    }
    const toLen = toEnd - toStart;
    const length = fromLen < toLen ? fromLen : toLen;
    let lastCommonSep = -1;
    let i = 0;
    for(; i <= length; ++i){
        if (i === length) {
            if (toLen > length) {
                if (to.charCodeAt(toStart + i) === 92) {
                    return toOrig.slice(toStart + i + 1);
                } else if (i === 2) {
                    return toOrig.slice(toStart + i);
                }
            }
            if (fromLen > length) {
                if (from.charCodeAt(fromStart + i) === 92) {
                    lastCommonSep = i;
                } else if (i === 2) {
                    lastCommonSep = 3;
                }
            }
            break;
        }
        const fromCode = from.charCodeAt(fromStart + i);
        const toCode = to.charCodeAt(toStart + i);
        if (fromCode !== toCode) break;
        else if (fromCode === 92) lastCommonSep = i;
    }
    if (i !== length && lastCommonSep === -1) {
        return toOrig;
    }
    let out = "";
    if (lastCommonSep === -1) lastCommonSep = 0;
    for(i = fromStart + lastCommonSep + 1; i <= fromEnd; ++i){
        if (i === fromEnd || from.charCodeAt(i) === 92) {
            if (out.length === 0) out += "..";
            else out += "\\..";
        }
    }
    if (out.length > 0) {
        return out + toOrig.slice(toStart + lastCommonSep, toEnd);
    } else {
        toStart += lastCommonSep;
        if (toOrig.charCodeAt(toStart) === 92) ++toStart;
        return toOrig.slice(toStart, toEnd);
    }
}
function toNamespacedPath(path) {
    if (typeof path !== "string") return path;
    if (path.length === 0) return "";
    const resolvedPath = resolve(path);
    if (resolvedPath.length >= 3) {
        if (resolvedPath.charCodeAt(0) === 92) {
            if (resolvedPath.charCodeAt(1) === 92) {
                const code = resolvedPath.charCodeAt(2);
                if (code !== 63 && code !== 46) {
                    return `\\\\?\\UNC\\${resolvedPath.slice(2)}`;
                }
            }
        } else if (isWindowsDeviceRoot(resolvedPath.charCodeAt(0))) {
            if (resolvedPath.charCodeAt(1) === 58 && resolvedPath.charCodeAt(2) === 92) {
                return `\\\\?\\${resolvedPath}`;
            }
        }
    }
    return path;
}
function dirname(path) {
    assertPath(path);
    const len = path.length;
    if (len === 0) return ".";
    let rootEnd = -1;
    let end = -1;
    let matchedSlash = true;
    let offset = 0;
    const code = path.charCodeAt(0);
    if (len > 1) {
        if (isPathSeparator(code)) {
            rootEnd = offset = 1;
            if (isPathSeparator(path.charCodeAt(1))) {
                let j = 2;
                let last = j;
                for(; j < len; ++j){
                    if (isPathSeparator(path.charCodeAt(j))) break;
                }
                if (j < len && j !== last) {
                    last = j;
                    for(; j < len; ++j){
                        if (!isPathSeparator(path.charCodeAt(j))) break;
                    }
                    if (j < len && j !== last) {
                        last = j;
                        for(; j < len; ++j){
                            if (isPathSeparator(path.charCodeAt(j))) break;
                        }
                        if (j === len) {
                            return path;
                        }
                        if (j !== last) {
                            rootEnd = offset = j + 1;
                        }
                    }
                }
            }
        } else if (isWindowsDeviceRoot(code)) {
            if (path.charCodeAt(1) === 58) {
                rootEnd = offset = 2;
                if (len > 2) {
                    if (isPathSeparator(path.charCodeAt(2))) rootEnd = offset = 3;
                }
            }
        }
    } else if (isPathSeparator(code)) {
        return path;
    }
    for(let i = len - 1; i >= offset; --i){
        if (isPathSeparator(path.charCodeAt(i))) {
            if (!matchedSlash) {
                end = i;
                break;
            }
        } else {
            matchedSlash = false;
        }
    }
    if (end === -1) {
        if (rootEnd === -1) return ".";
        else end = rootEnd;
    }
    return stripTrailingSeparators(path.slice(0, end), isPosixPathSeparator);
}
function basename(path, suffix = "") {
    assertPath(path);
    if (path.length === 0) return path;
    if (typeof suffix !== "string") {
        throw new TypeError(`Suffix must be a string. Received ${JSON.stringify(suffix)}`);
    }
    let start = 0;
    if (path.length >= 2) {
        const drive = path.charCodeAt(0);
        if (isWindowsDeviceRoot(drive)) {
            if (path.charCodeAt(1) === 58) start = 2;
        }
    }
    const lastSegment = lastPathSegment(path, isPathSeparator, start);
    const strippedSegment = stripTrailingSeparators(lastSegment, isPathSeparator);
    return suffix ? stripSuffix(strippedSegment, suffix) : strippedSegment;
}
function extname(path) {
    assertPath(path);
    let start = 0;
    let startDot = -1;
    let startPart = 0;
    let end = -1;
    let matchedSlash = true;
    let preDotState = 0;
    if (path.length >= 2 && path.charCodeAt(1) === 58 && isWindowsDeviceRoot(path.charCodeAt(0))) {
        start = startPart = 2;
    }
    for(let i = path.length - 1; i >= start; --i){
        const code = path.charCodeAt(i);
        if (isPathSeparator(code)) {
            if (!matchedSlash) {
                startPart = i + 1;
                break;
            }
            continue;
        }
        if (end === -1) {
            matchedSlash = false;
            end = i + 1;
        }
        if (code === 46) {
            if (startDot === -1) startDot = i;
            else if (preDotState !== 1) preDotState = 1;
        } else if (startDot !== -1) {
            preDotState = -1;
        }
    }
    if (startDot === -1 || end === -1 || preDotState === 0 || preDotState === 1 && startDot === end - 1 && startDot === startPart + 1) {
        return "";
    }
    return path.slice(startDot, end);
}
function format(pathObject) {
    if (pathObject === null || typeof pathObject !== "object") {
        throw new TypeError(`The "pathObject" argument must be of type Object. Received type ${typeof pathObject}`);
    }
    return _format("\\", pathObject);
}
function parse(path) {
    assertPath(path);
    const ret = {
        root: "",
        dir: "",
        base: "",
        ext: "",
        name: ""
    };
    const len = path.length;
    if (len === 0) return ret;
    let rootEnd = 0;
    let code = path.charCodeAt(0);
    if (len > 1) {
        if (isPathSeparator(code)) {
            rootEnd = 1;
            if (isPathSeparator(path.charCodeAt(1))) {
                let j = 2;
                let last = j;
                for(; j < len; ++j){
                    if (isPathSeparator(path.charCodeAt(j))) break;
                }
                if (j < len && j !== last) {
                    last = j;
                    for(; j < len; ++j){
                        if (!isPathSeparator(path.charCodeAt(j))) break;
                    }
                    if (j < len && j !== last) {
                        last = j;
                        for(; j < len; ++j){
                            if (isPathSeparator(path.charCodeAt(j))) break;
                        }
                        if (j === len) {
                            rootEnd = j;
                        } else if (j !== last) {
                            rootEnd = j + 1;
                        }
                    }
                }
            }
        } else if (isWindowsDeviceRoot(code)) {
            if (path.charCodeAt(1) === 58) {
                rootEnd = 2;
                if (len > 2) {
                    if (isPathSeparator(path.charCodeAt(2))) {
                        if (len === 3) {
                            ret.root = ret.dir = path;
                            ret.base = "\\";
                            return ret;
                        }
                        rootEnd = 3;
                    }
                } else {
                    ret.root = ret.dir = path;
                    return ret;
                }
            }
        }
    } else if (isPathSeparator(code)) {
        ret.root = ret.dir = path;
        ret.base = "\\";
        return ret;
    }
    if (rootEnd > 0) ret.root = path.slice(0, rootEnd);
    let startDot = -1;
    let startPart = rootEnd;
    let end = -1;
    let matchedSlash = true;
    let i = path.length - 1;
    let preDotState = 0;
    for(; i >= rootEnd; --i){
        code = path.charCodeAt(i);
        if (isPathSeparator(code)) {
            if (!matchedSlash) {
                startPart = i + 1;
                break;
            }
            continue;
        }
        if (end === -1) {
            matchedSlash = false;
            end = i + 1;
        }
        if (code === 46) {
            if (startDot === -1) startDot = i;
            else if (preDotState !== 1) preDotState = 1;
        } else if (startDot !== -1) {
            preDotState = -1;
        }
    }
    if (startDot === -1 || end === -1 || preDotState === 0 || preDotState === 1 && startDot === end - 1 && startDot === startPart + 1) {
        if (end !== -1) {
            ret.base = ret.name = path.slice(startPart, end);
        }
    } else {
        ret.name = path.slice(startPart, startDot);
        ret.base = path.slice(startPart, end);
        ret.ext = path.slice(startDot, end);
    }
    ret.base = ret.base || "\\";
    if (startPart > 0 && startPart !== rootEnd) {
        ret.dir = path.slice(0, startPart - 1);
    } else ret.dir = ret.root;
    return ret;
}
function fromFileUrl(url) {
    url = url instanceof URL ? url : new URL(url);
    if (url.protocol != "file:") {
        throw new TypeError("Must be a file URL.");
    }
    let path = decodeURIComponent(url.pathname.replace(/\//g, "\\").replace(/%(?![0-9A-Fa-f]{2})/g, "%25")).replace(/^\\*([A-Za-z]:)(\\|$)/, "$1\\");
    if (url.hostname != "") {
        path = `\\\\${url.hostname}${path}`;
    }
    return path;
}
function toFileUrl(path) {
    if (!isAbsolute(path)) {
        throw new TypeError("Must be an absolute path.");
    }
    const [, hostname, pathname] = path.match(/^(?:[/\\]{2}([^/\\]+)(?=[/\\](?:[^/\\]|$)))?(.*)/);
    const url = new URL("file:///");
    url.pathname = encodeWhitespace(pathname.replace(/%/g, "%25"));
    if (hostname != null && hostname != "localhost") {
        url.hostname = hostname;
        if (!url.hostname) {
            throw new TypeError("Invalid hostname.");
        }
    }
    return url;
}
const mod = {
    sep: sep,
    delimiter: delimiter,
    resolve: resolve,
    normalize: normalize,
    isAbsolute: isAbsolute,
    join: join,
    relative: relative,
    toNamespacedPath: toNamespacedPath,
    dirname: dirname,
    basename: basename,
    extname: extname,
    format: format,
    parse: parse,
    fromFileUrl: fromFileUrl,
    toFileUrl: toFileUrl
};
const sep1 = "/";
const delimiter1 = ":";
function resolve1(...pathSegments) {
    let resolvedPath = "";
    let resolvedAbsolute = false;
    for(let i = pathSegments.length - 1; i >= -1 && !resolvedAbsolute; i--){
        let path;
        if (i >= 0) path = pathSegments[i];
        else {
            const { Deno: Deno1  } = globalThis;
            if (typeof Deno1?.cwd !== "function") {
                throw new TypeError("Resolved a relative path without a CWD.");
            }
            path = Deno1.cwd();
        }
        assertPath(path);
        if (path.length === 0) {
            continue;
        }
        resolvedPath = `${path}/${resolvedPath}`;
        resolvedAbsolute = isPosixPathSeparator(path.charCodeAt(0));
    }
    resolvedPath = normalizeString(resolvedPath, !resolvedAbsolute, "/", isPosixPathSeparator);
    if (resolvedAbsolute) {
        if (resolvedPath.length > 0) return `/${resolvedPath}`;
        else return "/";
    } else if (resolvedPath.length > 0) return resolvedPath;
    else return ".";
}
function normalize1(path) {
    assertPath(path);
    if (path.length === 0) return ".";
    const isAbsolute = isPosixPathSeparator(path.charCodeAt(0));
    const trailingSeparator = isPosixPathSeparator(path.charCodeAt(path.length - 1));
    path = normalizeString(path, !isAbsolute, "/", isPosixPathSeparator);
    if (path.length === 0 && !isAbsolute) path = ".";
    if (path.length > 0 && trailingSeparator) path += "/";
    if (isAbsolute) return `/${path}`;
    return path;
}
function isAbsolute1(path) {
    assertPath(path);
    return path.length > 0 && isPosixPathSeparator(path.charCodeAt(0));
}
function join1(...paths) {
    if (paths.length === 0) return ".";
    let joined;
    for(let i = 0, len = paths.length; i < len; ++i){
        const path = paths[i];
        assertPath(path);
        if (path.length > 0) {
            if (!joined) joined = path;
            else joined += `/${path}`;
        }
    }
    if (!joined) return ".";
    return normalize1(joined);
}
function relative1(from, to) {
    assertPath(from);
    assertPath(to);
    if (from === to) return "";
    from = resolve1(from);
    to = resolve1(to);
    if (from === to) return "";
    let fromStart = 1;
    const fromEnd = from.length;
    for(; fromStart < fromEnd; ++fromStart){
        if (!isPosixPathSeparator(from.charCodeAt(fromStart))) break;
    }
    const fromLen = fromEnd - fromStart;
    let toStart = 1;
    const toEnd = to.length;
    for(; toStart < toEnd; ++toStart){
        if (!isPosixPathSeparator(to.charCodeAt(toStart))) break;
    }
    const toLen = toEnd - toStart;
    const length = fromLen < toLen ? fromLen : toLen;
    let lastCommonSep = -1;
    let i = 0;
    for(; i <= length; ++i){
        if (i === length) {
            if (toLen > length) {
                if (isPosixPathSeparator(to.charCodeAt(toStart + i))) {
                    return to.slice(toStart + i + 1);
                } else if (i === 0) {
                    return to.slice(toStart + i);
                }
            } else if (fromLen > length) {
                if (isPosixPathSeparator(from.charCodeAt(fromStart + i))) {
                    lastCommonSep = i;
                } else if (i === 0) {
                    lastCommonSep = 0;
                }
            }
            break;
        }
        const fromCode = from.charCodeAt(fromStart + i);
        const toCode = to.charCodeAt(toStart + i);
        if (fromCode !== toCode) break;
        else if (isPosixPathSeparator(fromCode)) lastCommonSep = i;
    }
    let out = "";
    for(i = fromStart + lastCommonSep + 1; i <= fromEnd; ++i){
        if (i === fromEnd || isPosixPathSeparator(from.charCodeAt(i))) {
            if (out.length === 0) out += "..";
            else out += "/..";
        }
    }
    if (out.length > 0) return out + to.slice(toStart + lastCommonSep);
    else {
        toStart += lastCommonSep;
        if (isPosixPathSeparator(to.charCodeAt(toStart))) ++toStart;
        return to.slice(toStart);
    }
}
function toNamespacedPath1(path) {
    return path;
}
function dirname1(path) {
    if (path.length === 0) return ".";
    let end = -1;
    let matchedNonSeparator = false;
    for(let i = path.length - 1; i >= 1; --i){
        if (isPosixPathSeparator(path.charCodeAt(i))) {
            if (matchedNonSeparator) {
                end = i;
                break;
            }
        } else {
            matchedNonSeparator = true;
        }
    }
    if (end === -1) {
        return isPosixPathSeparator(path.charCodeAt(0)) ? "/" : ".";
    }
    return stripTrailingSeparators(path.slice(0, end), isPosixPathSeparator);
}
function basename1(path, suffix = "") {
    assertPath(path);
    if (path.length === 0) return path;
    if (typeof suffix !== "string") {
        throw new TypeError(`Suffix must be a string. Received ${JSON.stringify(suffix)}`);
    }
    const lastSegment = lastPathSegment(path, isPosixPathSeparator);
    const strippedSegment = stripTrailingSeparators(lastSegment, isPosixPathSeparator);
    return suffix ? stripSuffix(strippedSegment, suffix) : strippedSegment;
}
function extname1(path) {
    assertPath(path);
    let startDot = -1;
    let startPart = 0;
    let end = -1;
    let matchedSlash = true;
    let preDotState = 0;
    for(let i = path.length - 1; i >= 0; --i){
        const code = path.charCodeAt(i);
        if (isPosixPathSeparator(code)) {
            if (!matchedSlash) {
                startPart = i + 1;
                break;
            }
            continue;
        }
        if (end === -1) {
            matchedSlash = false;
            end = i + 1;
        }
        if (code === 46) {
            if (startDot === -1) startDot = i;
            else if (preDotState !== 1) preDotState = 1;
        } else if (startDot !== -1) {
            preDotState = -1;
        }
    }
    if (startDot === -1 || end === -1 || preDotState === 0 || preDotState === 1 && startDot === end - 1 && startDot === startPart + 1) {
        return "";
    }
    return path.slice(startDot, end);
}
function format1(pathObject) {
    if (pathObject === null || typeof pathObject !== "object") {
        throw new TypeError(`The "pathObject" argument must be of type Object. Received type ${typeof pathObject}`);
    }
    return _format("/", pathObject);
}
function parse1(path) {
    assertPath(path);
    const ret = {
        root: "",
        dir: "",
        base: "",
        ext: "",
        name: ""
    };
    if (path.length === 0) return ret;
    const isAbsolute = isPosixPathSeparator(path.charCodeAt(0));
    let start;
    if (isAbsolute) {
        ret.root = "/";
        start = 1;
    } else {
        start = 0;
    }
    let startDot = -1;
    let startPart = 0;
    let end = -1;
    let matchedSlash = true;
    let i = path.length - 1;
    let preDotState = 0;
    for(; i >= start; --i){
        const code = path.charCodeAt(i);
        if (isPosixPathSeparator(code)) {
            if (!matchedSlash) {
                startPart = i + 1;
                break;
            }
            continue;
        }
        if (end === -1) {
            matchedSlash = false;
            end = i + 1;
        }
        if (code === 46) {
            if (startDot === -1) startDot = i;
            else if (preDotState !== 1) preDotState = 1;
        } else if (startDot !== -1) {
            preDotState = -1;
        }
    }
    if (startDot === -1 || end === -1 || preDotState === 0 || preDotState === 1 && startDot === end - 1 && startDot === startPart + 1) {
        if (end !== -1) {
            if (startPart === 0 && isAbsolute) {
                ret.base = ret.name = path.slice(1, end);
            } else {
                ret.base = ret.name = path.slice(startPart, end);
            }
        }
        ret.base = ret.base || "/";
    } else {
        if (startPart === 0 && isAbsolute) {
            ret.name = path.slice(1, startDot);
            ret.base = path.slice(1, end);
        } else {
            ret.name = path.slice(startPart, startDot);
            ret.base = path.slice(startPart, end);
        }
        ret.ext = path.slice(startDot, end);
    }
    if (startPart > 0) {
        ret.dir = stripTrailingSeparators(path.slice(0, startPart - 1), isPosixPathSeparator);
    } else if (isAbsolute) ret.dir = "/";
    return ret;
}
function fromFileUrl1(url) {
    url = url instanceof URL ? url : new URL(url);
    if (url.protocol != "file:") {
        throw new TypeError("Must be a file URL.");
    }
    return decodeURIComponent(url.pathname.replace(/%(?![0-9A-Fa-f]{2})/g, "%25"));
}
function toFileUrl1(path) {
    if (!isAbsolute1(path)) {
        throw new TypeError("Must be an absolute path.");
    }
    const url = new URL("file:///");
    url.pathname = encodeWhitespace(path.replace(/%/g, "%25").replace(/\\/g, "%5C"));
    return url;
}
const mod1 = {
    sep: sep1,
    delimiter: delimiter1,
    resolve: resolve1,
    normalize: normalize1,
    isAbsolute: isAbsolute1,
    join: join1,
    relative: relative1,
    toNamespacedPath: toNamespacedPath1,
    dirname: dirname1,
    basename: basename1,
    extname: extname1,
    format: format1,
    parse: parse1,
    fromFileUrl: fromFileUrl1,
    toFileUrl: toFileUrl1
};
const path = isWindows ? mod : mod1;
const { join: join2 , normalize: normalize2  } = path;
const path1 = isWindows ? mod : mod1;
const { basename: basename2 , delimiter: delimiter2 , dirname: dirname2 , extname: extname2 , format: format2 , fromFileUrl: fromFileUrl2 , isAbsolute: isAbsolute2 , join: join3 , normalize: normalize3 , parse: parse2 , relative: relative2 , resolve: resolve2 , sep: sep2 , toFileUrl: toFileUrl2 , toNamespacedPath: toNamespacedPath2  } = path1;
function getFileInfoType(fileInfo) {
    return fileInfo.isFile ? "file" : fileInfo.isDirectory ? "dir" : fileInfo.isSymlink ? "symlink" : undefined;
}
async function ensureDir(dir) {
    try {
        const fileInfo = await Deno.lstat(dir);
        if (!fileInfo.isDirectory) {
            throw new Error(`Ensure path exists, expected 'dir', got '${getFileInfoType(fileInfo)}'`);
        }
    } catch (err) {
        if (err instanceof Deno.errors.NotFound) {
            await Deno.mkdir(dir, {
                recursive: true
            });
            return;
        }
        throw err;
    }
}
new Deno.errors.AlreadyExists("dest already exists.");
var EOL;
(function(EOL) {
    EOL["LF"] = "\n";
    EOL["CRLF"] = "\r\n";
})(EOL || (EOL = {}));
const hexTable = new TextEncoder().encode("0123456789abcdef");
function encode(src) {
    const dst = new Uint8Array(src.length * 2);
    for(let i = 0; i < dst.length; i++){
        const v = src[i];
        dst[i * 2] = hexTable[v >> 4];
        dst[i * 2 + 1] = hexTable[v & 0x0f];
    }
    return dst;
}
const { Deno: Deno1  } = globalThis;
const noColor = typeof Deno1?.noColor === "boolean" ? Deno1.noColor : true;
let enabled = !noColor;
function code(open, close) {
    return {
        open: `\x1b[${open.join(";")}m`,
        close: `\x1b[${close}m`,
        regexp: new RegExp(`\\x1b\\[${close}m`, "g")
    };
}
function run(str, code) {
    return enabled ? `${code.open}${str.replace(code.regexp, code.open)}${code.close}` : str;
}
function green(str) {
    return run(str, code([
        32
    ], 39));
}
new RegExp([
    "[\\u001B\\u009B][[\\]()#;?]*(?:(?:(?:(?:;[-a-zA-Z\\d\\/#&.:=?%@~_]+)*|[a-zA-Z\\d]+(?:;[-a-zA-Z\\d\\/#&.:=?%@~_]*)*)?\\u0007)",
    "(?:(?:\\d{1,4}(?:;\\d{0,4})*)?[\\dA-PR-TZcf-nq-uy=><~]))"
].join("|"), "g");
const encoder = new TextEncoder();
const decoder = new TextDecoder();
function baseUrlToFilename(url) {
    const out = [];
    const protocol = url.protocol.replace(":", "");
    out.push(protocol);
    switch(protocol){
        case "http":
        case "https":
            {
                const host = url.hostname;
                const hostPort = url.port;
                out.push(hostPort ? `${host}_PORT${hostPort}` : host);
                break;
            }
        case "file":
        case "data":
        case "blob":
            break;
        default:
            throw new TypeError(`Don't know how to create cache name for protocol: ${protocol}`);
    }
    return join3(...out);
}
function stringToURL(url) {
    return url.startsWith("file://") || url.startsWith("http://") || url.startsWith("https://") ? new URL(url) : toFileUrl2(resolve2(url));
}
async function hash1(value) {
    return decoder.decode(encode(new Uint8Array(await crypto.subtle.digest("SHA-256", encoder.encode(value)))));
}
async function urlToFilename(url) {
    const cacheFilename = baseUrlToFilename(url);
    const hashedFilename = await hash1(url.pathname + url.search);
    return join3(cacheFilename, hashedFilename);
}
async function isFile(filePath) {
    try {
        const stats = await Deno.lstat(filePath);
        return stats.isFile;
    } catch (err) {
        if (err instanceof Deno.errors.NotFound) {
            return false;
        }
        throw err;
    }
}
function homeDir() {
    switch(Deno.build.os){
        case "windows":
            return Deno.env.get("USERPROFILE");
        case "linux":
        case "darwin":
            return Deno.env.get("HOME");
        default:
            throw Error("unreachable");
    }
}
function cacheDir() {
    if (Deno.build.os === "darwin") {
        const home = homeDir();
        if (home) {
            return join3(home, "Library/Caches");
        }
    } else if (Deno.build.os === "linux") {
        const cacheHome = Deno.env.get("XDG_CACHE_HOME");
        if (cacheHome) {
            return cacheHome;
        } else {
            const home = homeDir();
            if (home) {
                return join3(home, ".cache");
            }
        }
    } else {
        return Deno.env.get("LOCALAPPDATA");
    }
}
function denoCacheDir() {
    const dd = Deno.env.get("DENO_DIR");
    let root;
    if (dd) {
        root = normalize3(isAbsolute2(dd) ? dd : join3(Deno.cwd(), dd));
    } else {
        const cd = cacheDir();
        if (cd) {
            root = join3(cd, "deno");
        } else {
            const hd = homeDir();
            if (hd) {
                root = join3(hd, ".deno");
            }
        }
    }
    return root;
}
const defaultExtensions = {
    darwin: "dylib",
    linux: "so",
    windows: "dll"
};
const defaultPrefixes = {
    darwin: "lib",
    linux: "lib",
    windows: ""
};
function getCrossOption(record) {
    if (record === undefined) {
        return;
    }
    if ("darwin" in record || "linux" in record || "windows" in record) {
        const subrecord = record[Deno.build.os];
        if (subrecord && typeof subrecord === "object" && ("x86_64" in subrecord || "aarch64" in subrecord)) {
            return subrecord[Deno.build.arch];
        } else {
            return subrecord;
        }
    }
    if ("x86_64" in record || "aarch64" in record) {
        const subrecord = record[Deno.build.arch];
        if (subrecord && typeof subrecord === "object" && ("darwin" in subrecord || "linux" in subrecord || "windows" in subrecord)) {
            return subrecord[Deno.build.os];
        } else {
            return subrecord;
        }
    }
}
function createDownloadURL(options) {
    if (typeof options === "string" || options instanceof URL) {
        options = {
            url: options
        };
    }
    options.extensions ??= defaultExtensions;
    options.prefixes ??= defaultPrefixes;
    for(const key in options.extensions){
        const os = key;
        if (options.extensions[os] !== undefined) {
            options.extensions[os] = options.extensions[os].replace(/\.?(.+)/, "$1");
        }
    }
    let url;
    if (options.url instanceof URL) {
        url = options.url;
    } else if (typeof options.url === "string") {
        url = stringToURL(options.url);
    } else {
        const tmpUrl = getCrossOption(options.url);
        if (tmpUrl === undefined) {
            throw new TypeError(`An URL for the "${Deno.build.os}-${Deno.build.arch}" target was not provided.`);
        }
        if (typeof tmpUrl === "string") {
            url = stringToURL(tmpUrl);
        } else {
            url = tmpUrl;
        }
    }
    if ("name" in options && !Object.values(options.extensions).includes(extname2(url.pathname))) {
        if (!url.pathname.endsWith("/")) {
            url.pathname = `${url.pathname}/`;
        }
        const prefix = getCrossOption(options.prefixes) ?? "";
        const suffix = getCrossOption(options.suffixes) ?? "";
        const extension = options.extensions[Deno.build.os];
        if (options.name === undefined) {
            throw new TypeError(`Expected the "name" property for an automatically assembled URL.`);
        }
        const filename = `${prefix}${options.name}${suffix}.${extension}`;
        url = new URL(filename, url);
    }
    return url;
}
async function ensureCacheLocation(location = "deno") {
    if (location === "deno") {
        const dir = denoCacheDir();
        if (dir === undefined) {
            throw new Error("Could not get the deno cache directory, try using another CacheLocation in the plug options.");
        }
        location = join3(dir, "plug");
    } else if (location === "cache") {
        const dir = cacheDir();
        if (dir === undefined) {
            throw new Error("Could not get the cache directory, try using another CacheLocation in the plug options.");
        }
        location = join3(dir, "plug");
    } else if (location === "cwd") {
        location = join3(Deno.cwd(), "plug");
    } else if (location === "tmp") {
        location = await Deno.makeTempDir({
            prefix: "plug"
        });
    } else if (typeof location === "string" && location.startsWith("file://")) {
        location = fromFileUrl2(location);
    } else if (location instanceof URL) {
        if (location?.protocol !== "file:") {
            throw new TypeError("Cannot use any other protocol than file:// for an URL cache location.");
        }
        location = fromFileUrl2(location);
    }
    location = resolve2(normalize3(location));
    await ensureDir(location);
    return location;
}
async function download(options) {
    const location = (typeof options === "object" && "location" in options ? options.location : undefined) ?? "deno";
    const setting = (typeof options === "object" && "cache" in options ? options.cache : undefined) ?? "use";
    const [url, directory] = await Promise.all([
        createDownloadURL(options),
        ensureCacheLocation(location)
    ]);
    const cacheBasePath = join3(directory, await urlToFilename(url));
    const cacheFilePath = `${cacheBasePath}${extname2(url.pathname)}`;
    const cacheMetaPath = `${cacheBasePath}.metadata.json`;
    const cached = setting === "use" ? await isFile(cacheFilePath) : setting === "only" || setting !== "reloadAll";
    await ensureDir(dirname2(cacheBasePath));
    if (!cached) {
        const meta = {
            url
        };
        switch(url.protocol){
            case "http:":
            case "https:":
                {
                    console.log(`${green("Downloading")} ${url}`);
                    const response = await fetch(url.toString());
                    if (!response.ok) {
                        if (response.status === 404) {
                            throw new Error(`Could not find ${url}`);
                        } else {
                            throw new Deno.errors.Http(`${response.status} ${response.statusText}`);
                        }
                    }
                    await Deno.writeFile(cacheFilePath, new Uint8Array(await response.arrayBuffer()));
                    break;
                }
            case "file:":
                {
                    console.log(`${green("Copying")} ${url}`);
                    await Deno.copyFile(fromFileUrl2(url), cacheFilePath);
                    if (Deno.build.os !== "windows") {
                        await Deno.chmod(cacheFilePath, 0o644);
                    }
                    break;
                }
            default:
                {
                    throw new TypeError(`Cannot fetch to cache using the "${url.protocol}" protocol`);
                }
        }
        await Deno.writeTextFile(cacheMetaPath, JSON.stringify(meta));
    }
    if (!await isFile(cacheFilePath)) {
        throw new Error(`Could not find "${url}" in cache.`);
    }
    return cacheFilePath;
}
async function dlopen(options, symbols) {
    return Deno.dlopen(await download(options), symbols);
}
const __default = JSON.parse("{\n  \"name\": \"sqlite3\",\n  \"version\": \"0.8.2\",\n  \"github\": \"https://github.com/denodrivers/sqlite3\",\n\n  \"tasks\": {\n    \"test\": \"deno test --unstable -A test/test.ts\",\n    \"build-sqlite-win\": \"mkdir -p build && cd build && nmake /f ..\\\\sqlite\\\\Makefile.msc sqlite3.dll TOP=..\\\\sqlite\",\n    \"bench-deno\": \"deno run -A --unstable bench/bench_deno.js 50 1000000\",\n    \"bench-deno-ffi\": \"deno run -A --unstable bench/bench_deno_ffi.js 50 1000000\",\n    \"bench-deno-wasm\": \"deno run -A --unstable bench/bench_deno_wasm.js 50 1000000\",\n    \"bench-node\": \"node bench/bench_node.js 50 1000000\",\n    \"bench-bun\": \"bun run bench/bench_bun.js 50 1000000\",\n    \"bench-bun-ffi\": \"bun run bench/bench_bun_ffi.js 50 1000000\",\n    \"bench-c\": \"./bench/bench 50 1000000\",\n    \"bench-python\": \"python ./bench/bench_python.py\",\n    \"bench:northwind\": \"deno bench -A --unstable bench/northwind/deno.js\",\n    \"bench-wasm:northwind\": \"deno run -A --unstable bench/northwind/deno_wasm.js\",\n    \"bench-node:northwind\": \"node bench/northwind/node.mjs\",\n    \"bench-bun:northwind\": \"bun run bench/northwind/bun.js\"\n  },\n\n  \"lint\": {\n    \"rules\": {\n      \"exclude\": [\n        \"camelcase\",\n        \"no-explicit-any\"\n      ],\n      \"include\": [\n        \"explicit-function-return-type\",\n        \"eqeqeq\",\n        \"explicit-module-boundary-types\"\n      ]\n    }\n  }\n}");
const symbols = {
    sqlite3_open_v2: {
        parameters: [
            "buffer",
            "buffer",
            "i32",
            "pointer"
        ],
        result: "i32"
    },
    sqlite3_close_v2: {
        parameters: [
            "pointer"
        ],
        result: "i32"
    },
    sqlite3_changes: {
        parameters: [
            "pointer"
        ],
        result: "i32"
    },
    sqlite3_total_changes: {
        parameters: [
            "pointer"
        ],
        result: "i32"
    },
    sqlite3_last_insert_rowid: {
        parameters: [
            "pointer"
        ],
        result: "i32"
    },
    sqlite3_get_autocommit: {
        parameters: [
            "pointer"
        ],
        result: "i32"
    },
    sqlite3_prepare_v2: {
        parameters: [
            "pointer",
            "buffer",
            "i32",
            "buffer",
            "pointer"
        ],
        result: "i32"
    },
    sqlite3_reset: {
        parameters: [
            "pointer"
        ],
        result: "i32"
    },
    sqlite3_clear_bindings: {
        parameters: [
            "pointer"
        ],
        result: "i32"
    },
    sqlite3_step: {
        parameters: [
            "pointer"
        ],
        result: "i32"
    },
    sqlite3_step_cb: {
        name: "sqlite3_step",
        callback: true,
        parameters: [
            "pointer"
        ],
        result: "i32"
    },
    sqlite3_column_count: {
        parameters: [
            "pointer"
        ],
        result: "i32"
    },
    sqlite3_column_type: {
        parameters: [
            "pointer",
            "i32"
        ],
        result: "i32"
    },
    sqlite3_column_text: {
        parameters: [
            "pointer",
            "i32"
        ],
        result: "pointer"
    },
    sqlite3_finalize: {
        parameters: [
            "pointer"
        ],
        result: "i32"
    },
    sqlite3_exec: {
        parameters: [
            "pointer",
            "buffer",
            "pointer",
            "pointer",
            "buffer"
        ],
        result: "i32"
    },
    sqlite3_free: {
        parameters: [
            "pointer"
        ],
        result: "void"
    },
    sqlite3_column_int: {
        parameters: [
            "pointer",
            "i32"
        ],
        result: "i32"
    },
    sqlite3_column_double: {
        parameters: [
            "pointer",
            "i32"
        ],
        result: "f64"
    },
    sqlite3_column_blob: {
        parameters: [
            "pointer",
            "i32"
        ],
        result: "pointer"
    },
    sqlite3_column_bytes: {
        parameters: [
            "pointer",
            "i32"
        ],
        result: "i32"
    },
    sqlite3_column_name: {
        parameters: [
            "pointer",
            "i32"
        ],
        result: "pointer"
    },
    sqlite3_column_decltype: {
        parameters: [
            "pointer",
            "i32"
        ],
        result: "u64"
    },
    sqlite3_bind_parameter_index: {
        parameters: [
            "pointer",
            "buffer"
        ],
        result: "i32"
    },
    sqlite3_bind_text: {
        parameters: [
            "pointer",
            "i32",
            "buffer",
            "i32",
            "pointer"
        ],
        result: "i32"
    },
    sqlite3_bind_blob: {
        parameters: [
            "pointer",
            "i32",
            "buffer",
            "i32",
            "pointer"
        ],
        result: "i32"
    },
    sqlite3_bind_double: {
        parameters: [
            "pointer",
            "i32",
            "f64"
        ],
        result: "i32"
    },
    sqlite3_bind_int: {
        parameters: [
            "pointer",
            "i32",
            "i32"
        ],
        result: "i32"
    },
    sqlite3_bind_int64: {
        parameters: [
            "pointer",
            "i32",
            "i64"
        ],
        result: "i32"
    },
    sqlite3_bind_null: {
        parameters: [
            "pointer",
            "i32"
        ],
        result: "i32"
    },
    sqlite3_expanded_sql: {
        parameters: [
            "pointer"
        ],
        result: "pointer"
    },
    sqlite3_bind_parameter_count: {
        parameters: [
            "pointer"
        ],
        result: "i32"
    },
    sqlite3_complete: {
        parameters: [
            "buffer"
        ],
        result: "i32"
    },
    sqlite3_sourceid: {
        parameters: [],
        result: "pointer"
    },
    sqlite3_libversion: {
        parameters: [],
        result: "pointer"
    },
    sqlite3_blob_open: {
        parameters: [
            "pointer",
            "buffer",
            "buffer",
            "buffer",
            "i64",
            "i32",
            "buffer"
        ],
        result: "i32"
    },
    sqlite3_blob_read: {
        parameters: [
            "pointer",
            "buffer",
            "i32",
            "i32"
        ],
        result: "i32"
    },
    sqlite3_blob_write: {
        parameters: [
            "pointer",
            "buffer",
            "i32",
            "i32"
        ],
        result: "i32"
    },
    sqlite3_blob_bytes: {
        parameters: [
            "pointer"
        ],
        result: "i32"
    },
    sqlite3_blob_close: {
        parameters: [
            "pointer"
        ],
        result: "i32"
    },
    sqlite3_sql: {
        parameters: [
            "pointer"
        ],
        result: "pointer"
    },
    sqlite3_stmt_readonly: {
        parameters: [
            "pointer"
        ],
        result: "i32"
    },
    sqlite3_bind_parameter_name: {
        parameters: [
            "pointer",
            "i32"
        ],
        result: "pointer"
    },
    sqlite3_errmsg: {
        parameters: [
            "pointer"
        ],
        result: "pointer"
    },
    sqlite3_errstr: {
        parameters: [
            "i32"
        ],
        result: "pointer"
    },
    sqlite3_column_int64: {
        parameters: [
            "pointer",
            "i32"
        ],
        result: "i64"
    },
    sqlite3_backup_init: {
        parameters: [
            "pointer",
            "buffer",
            "pointer",
            "buffer"
        ],
        result: "pointer"
    },
    sqlite3_backup_step: {
        parameters: [
            "pointer",
            "i32"
        ],
        result: "i32"
    },
    sqlite3_backup_finish: {
        parameters: [
            "pointer"
        ],
        result: "i32"
    },
    sqlite3_backup_remaining: {
        parameters: [
            "pointer"
        ],
        result: "i32"
    },
    sqlite3_backup_pagecount: {
        parameters: [
            "pointer"
        ],
        result: "i32"
    },
    sqlite3_create_function: {
        parameters: [
            "pointer",
            "buffer",
            "i32",
            "i32",
            "pointer",
            "pointer",
            "pointer",
            "pointer"
        ],
        result: "i32"
    },
    sqlite3_result_blob: {
        parameters: [
            "pointer",
            "buffer",
            "i32",
            "isize"
        ],
        result: "void"
    },
    sqlite3_result_double: {
        parameters: [
            "pointer",
            "f64"
        ],
        result: "void"
    },
    sqlite3_result_error: {
        parameters: [
            "pointer",
            "buffer",
            "i32"
        ],
        result: "void"
    },
    sqlite3_result_int: {
        parameters: [
            "pointer",
            "i32"
        ],
        result: "void"
    },
    sqlite3_result_int64: {
        parameters: [
            "pointer",
            "i64"
        ],
        result: "void"
    },
    sqlite3_result_null: {
        parameters: [
            "pointer"
        ],
        result: "void"
    },
    sqlite3_result_text: {
        parameters: [
            "pointer",
            "buffer",
            "i32",
            "isize"
        ],
        result: "void"
    },
    sqlite3_value_type: {
        parameters: [
            "pointer"
        ],
        result: "i32"
    },
    sqlite3_value_blob: {
        parameters: [
            "pointer"
        ],
        result: "pointer"
    },
    sqlite3_value_double: {
        parameters: [
            "pointer"
        ],
        result: "f64"
    },
    sqlite3_value_int: {
        parameters: [
            "pointer"
        ],
        result: "i32"
    },
    sqlite3_value_int64: {
        parameters: [
            "pointer"
        ],
        result: "i64"
    },
    sqlite3_value_text: {
        parameters: [
            "pointer"
        ],
        result: "pointer"
    },
    sqlite3_value_bytes: {
        parameters: [
            "pointer"
        ],
        result: "i32"
    },
    sqlite3_aggregate_context: {
        parameters: [
            "pointer",
            "i32"
        ],
        result: "pointer"
    },
    sqlite3_enable_load_extension: {
        parameters: [
            "pointer",
            "i32"
        ],
        result: "i32"
    },
    sqlite3_load_extension: {
        parameters: [
            "pointer",
            "buffer",
            "buffer",
            "buffer"
        ],
        result: "i32"
    }
};
let lib;
try {
    const customPath = Deno.env.get("DENO_SQLITE_PATH");
    if (customPath) {
        lib = Deno.dlopen(customPath, symbols).symbols;
    } else {
        lib = (await dlopen({
            name: __default.name,
            url: `${__default.github}/releases/download/${__default.version}/`,
            suffixes: {
                aarch64: "_aarch64"
            }
        }, symbols)).symbols;
    }
} catch (e) {
    if (e instanceof Deno.errors.PermissionDenied) {
        throw e;
    }
    const error = new Error("Failed to load SQLite3 Dynamic Library");
    error.cause = e;
    throw error;
}
const osType1 = (()=>{
    const { Deno: Deno1  } = globalThis;
    if (typeof Deno1?.build?.os === "string") {
        return Deno1.build.os;
    }
    const { navigator: navigator1  } = globalThis;
    if (navigator1?.appVersion?.includes?.("Win")) {
        return "windows";
    }
    return "linux";
})();
const isWindows1 = osType1 === "windows";
const CHAR_FORWARD_SLASH1 = 47;
function assertPath1(path) {
    if (typeof path !== "string") {
        throw new TypeError(`Path must be a string. Received ${JSON.stringify(path)}`);
    }
}
function isPosixPathSeparator1(code) {
    return code === 47;
}
function isPathSeparator1(code) {
    return isPosixPathSeparator1(code) || code === 92;
}
function isWindowsDeviceRoot1(code) {
    return code >= 97 && code <= 122 || code >= 65 && code <= 90;
}
function normalizeString1(path, allowAboveRoot, separator, isPathSeparator) {
    let res = "";
    let lastSegmentLength = 0;
    let lastSlash = -1;
    let dots = 0;
    let code;
    for(let i = 0, len = path.length; i <= len; ++i){
        if (i < len) code = path.charCodeAt(i);
        else if (isPathSeparator(code)) break;
        else code = CHAR_FORWARD_SLASH1;
        if (isPathSeparator(code)) {
            if (lastSlash === i - 1 || dots === 1) {} else if (lastSlash !== i - 1 && dots === 2) {
                if (res.length < 2 || lastSegmentLength !== 2 || res.charCodeAt(res.length - 1) !== 46 || res.charCodeAt(res.length - 2) !== 46) {
                    if (res.length > 2) {
                        const lastSlashIndex = res.lastIndexOf(separator);
                        if (lastSlashIndex === -1) {
                            res = "";
                            lastSegmentLength = 0;
                        } else {
                            res = res.slice(0, lastSlashIndex);
                            lastSegmentLength = res.length - 1 - res.lastIndexOf(separator);
                        }
                        lastSlash = i;
                        dots = 0;
                        continue;
                    } else if (res.length === 2 || res.length === 1) {
                        res = "";
                        lastSegmentLength = 0;
                        lastSlash = i;
                        dots = 0;
                        continue;
                    }
                }
                if (allowAboveRoot) {
                    if (res.length > 0) res += `${separator}..`;
                    else res = "..";
                    lastSegmentLength = 2;
                }
            } else {
                if (res.length > 0) res += separator + path.slice(lastSlash + 1, i);
                else res = path.slice(lastSlash + 1, i);
                lastSegmentLength = i - lastSlash - 1;
            }
            lastSlash = i;
            dots = 0;
        } else if (code === 46 && dots !== -1) {
            ++dots;
        } else {
            dots = -1;
        }
    }
    return res;
}
function _format1(sep, pathObject) {
    const dir = pathObject.dir || pathObject.root;
    const base = pathObject.base || (pathObject.name || "") + (pathObject.ext || "");
    if (!dir) return base;
    if (dir === pathObject.root) return dir + base;
    return dir + sep + base;
}
const WHITESPACE_ENCODINGS1 = {
    "\u0009": "%09",
    "\u000A": "%0A",
    "\u000B": "%0B",
    "\u000C": "%0C",
    "\u000D": "%0D",
    "\u0020": "%20"
};
function encodeWhitespace1(string) {
    return string.replaceAll(/[\s]/g, (c)=>{
        return WHITESPACE_ENCODINGS1[c] ?? c;
    });
}
class DenoStdInternalError1 extends Error {
    constructor(message){
        super(message);
        this.name = "DenoStdInternalError";
    }
}
function assert1(expr, msg = "") {
    if (!expr) {
        throw new DenoStdInternalError1(msg);
    }
}
const sep3 = "\\";
const delimiter3 = ";";
function resolve3(...pathSegments) {
    let resolvedDevice = "";
    let resolvedTail = "";
    let resolvedAbsolute = false;
    for(let i = pathSegments.length - 1; i >= -1; i--){
        let path;
        const { Deno: Deno1  } = globalThis;
        if (i >= 0) {
            path = pathSegments[i];
        } else if (!resolvedDevice) {
            if (typeof Deno1?.cwd !== "function") {
                throw new TypeError("Resolved a drive-letter-less path without a CWD.");
            }
            path = Deno1.cwd();
        } else {
            if (typeof Deno1?.env?.get !== "function" || typeof Deno1?.cwd !== "function") {
                throw new TypeError("Resolved a relative path without a CWD.");
            }
            path = Deno1.cwd();
            if (path === undefined || path.slice(0, 3).toLowerCase() !== `${resolvedDevice.toLowerCase()}\\`) {
                path = `${resolvedDevice}\\`;
            }
        }
        assertPath1(path);
        const len = path.length;
        if (len === 0) continue;
        let rootEnd = 0;
        let device = "";
        let isAbsolute = false;
        const code = path.charCodeAt(0);
        if (len > 1) {
            if (isPathSeparator1(code)) {
                isAbsolute = true;
                if (isPathSeparator1(path.charCodeAt(1))) {
                    let j = 2;
                    let last = j;
                    for(; j < len; ++j){
                        if (isPathSeparator1(path.charCodeAt(j))) break;
                    }
                    if (j < len && j !== last) {
                        const firstPart = path.slice(last, j);
                        last = j;
                        for(; j < len; ++j){
                            if (!isPathSeparator1(path.charCodeAt(j))) break;
                        }
                        if (j < len && j !== last) {
                            last = j;
                            for(; j < len; ++j){
                                if (isPathSeparator1(path.charCodeAt(j))) break;
                            }
                            if (j === len) {
                                device = `\\\\${firstPart}\\${path.slice(last)}`;
                                rootEnd = j;
                            } else if (j !== last) {
                                device = `\\\\${firstPart}\\${path.slice(last, j)}`;
                                rootEnd = j;
                            }
                        }
                    }
                } else {
                    rootEnd = 1;
                }
            } else if (isWindowsDeviceRoot1(code)) {
                if (path.charCodeAt(1) === 58) {
                    device = path.slice(0, 2);
                    rootEnd = 2;
                    if (len > 2) {
                        if (isPathSeparator1(path.charCodeAt(2))) {
                            isAbsolute = true;
                            rootEnd = 3;
                        }
                    }
                }
            }
        } else if (isPathSeparator1(code)) {
            rootEnd = 1;
            isAbsolute = true;
        }
        if (device.length > 0 && resolvedDevice.length > 0 && device.toLowerCase() !== resolvedDevice.toLowerCase()) {
            continue;
        }
        if (resolvedDevice.length === 0 && device.length > 0) {
            resolvedDevice = device;
        }
        if (!resolvedAbsolute) {
            resolvedTail = `${path.slice(rootEnd)}\\${resolvedTail}`;
            resolvedAbsolute = isAbsolute;
        }
        if (resolvedAbsolute && resolvedDevice.length > 0) break;
    }
    resolvedTail = normalizeString1(resolvedTail, !resolvedAbsolute, "\\", isPathSeparator1);
    return resolvedDevice + (resolvedAbsolute ? "\\" : "") + resolvedTail || ".";
}
function normalize4(path) {
    assertPath1(path);
    const len = path.length;
    if (len === 0) return ".";
    let rootEnd = 0;
    let device;
    let isAbsolute = false;
    const code = path.charCodeAt(0);
    if (len > 1) {
        if (isPathSeparator1(code)) {
            isAbsolute = true;
            if (isPathSeparator1(path.charCodeAt(1))) {
                let j = 2;
                let last = j;
                for(; j < len; ++j){
                    if (isPathSeparator1(path.charCodeAt(j))) break;
                }
                if (j < len && j !== last) {
                    const firstPart = path.slice(last, j);
                    last = j;
                    for(; j < len; ++j){
                        if (!isPathSeparator1(path.charCodeAt(j))) break;
                    }
                    if (j < len && j !== last) {
                        last = j;
                        for(; j < len; ++j){
                            if (isPathSeparator1(path.charCodeAt(j))) break;
                        }
                        if (j === len) {
                            return `\\\\${firstPart}\\${path.slice(last)}\\`;
                        } else if (j !== last) {
                            device = `\\\\${firstPart}\\${path.slice(last, j)}`;
                            rootEnd = j;
                        }
                    }
                }
            } else {
                rootEnd = 1;
            }
        } else if (isWindowsDeviceRoot1(code)) {
            if (path.charCodeAt(1) === 58) {
                device = path.slice(0, 2);
                rootEnd = 2;
                if (len > 2) {
                    if (isPathSeparator1(path.charCodeAt(2))) {
                        isAbsolute = true;
                        rootEnd = 3;
                    }
                }
            }
        }
    } else if (isPathSeparator1(code)) {
        return "\\";
    }
    let tail;
    if (rootEnd < len) {
        tail = normalizeString1(path.slice(rootEnd), !isAbsolute, "\\", isPathSeparator1);
    } else {
        tail = "";
    }
    if (tail.length === 0 && !isAbsolute) tail = ".";
    if (tail.length > 0 && isPathSeparator1(path.charCodeAt(len - 1))) {
        tail += "\\";
    }
    if (device === undefined) {
        if (isAbsolute) {
            if (tail.length > 0) return `\\${tail}`;
            else return "\\";
        } else if (tail.length > 0) {
            return tail;
        } else {
            return "";
        }
    } else if (isAbsolute) {
        if (tail.length > 0) return `${device}\\${tail}`;
        else return `${device}\\`;
    } else if (tail.length > 0) {
        return device + tail;
    } else {
        return device;
    }
}
function isAbsolute3(path) {
    assertPath1(path);
    const len = path.length;
    if (len === 0) return false;
    const code = path.charCodeAt(0);
    if (isPathSeparator1(code)) {
        return true;
    } else if (isWindowsDeviceRoot1(code)) {
        if (len > 2 && path.charCodeAt(1) === 58) {
            if (isPathSeparator1(path.charCodeAt(2))) return true;
        }
    }
    return false;
}
function join4(...paths) {
    const pathsCount = paths.length;
    if (pathsCount === 0) return ".";
    let joined;
    let firstPart = null;
    for(let i = 0; i < pathsCount; ++i){
        const path = paths[i];
        assertPath1(path);
        if (path.length > 0) {
            if (joined === undefined) joined = firstPart = path;
            else joined += `\\${path}`;
        }
    }
    if (joined === undefined) return ".";
    let needsReplace = true;
    let slashCount = 0;
    assert1(firstPart != null);
    if (isPathSeparator1(firstPart.charCodeAt(0))) {
        ++slashCount;
        const firstLen = firstPart.length;
        if (firstLen > 1) {
            if (isPathSeparator1(firstPart.charCodeAt(1))) {
                ++slashCount;
                if (firstLen > 2) {
                    if (isPathSeparator1(firstPart.charCodeAt(2))) ++slashCount;
                    else {
                        needsReplace = false;
                    }
                }
            }
        }
    }
    if (needsReplace) {
        for(; slashCount < joined.length; ++slashCount){
            if (!isPathSeparator1(joined.charCodeAt(slashCount))) break;
        }
        if (slashCount >= 2) joined = `\\${joined.slice(slashCount)}`;
    }
    return normalize4(joined);
}
function relative3(from, to) {
    assertPath1(from);
    assertPath1(to);
    if (from === to) return "";
    const fromOrig = resolve3(from);
    const toOrig = resolve3(to);
    if (fromOrig === toOrig) return "";
    from = fromOrig.toLowerCase();
    to = toOrig.toLowerCase();
    if (from === to) return "";
    let fromStart = 0;
    let fromEnd = from.length;
    for(; fromStart < fromEnd; ++fromStart){
        if (from.charCodeAt(fromStart) !== 92) break;
    }
    for(; fromEnd - 1 > fromStart; --fromEnd){
        if (from.charCodeAt(fromEnd - 1) !== 92) break;
    }
    const fromLen = fromEnd - fromStart;
    let toStart = 0;
    let toEnd = to.length;
    for(; toStart < toEnd; ++toStart){
        if (to.charCodeAt(toStart) !== 92) break;
    }
    for(; toEnd - 1 > toStart; --toEnd){
        if (to.charCodeAt(toEnd - 1) !== 92) break;
    }
    const toLen = toEnd - toStart;
    const length = fromLen < toLen ? fromLen : toLen;
    let lastCommonSep = -1;
    let i = 0;
    for(; i <= length; ++i){
        if (i === length) {
            if (toLen > length) {
                if (to.charCodeAt(toStart + i) === 92) {
                    return toOrig.slice(toStart + i + 1);
                } else if (i === 2) {
                    return toOrig.slice(toStart + i);
                }
            }
            if (fromLen > length) {
                if (from.charCodeAt(fromStart + i) === 92) {
                    lastCommonSep = i;
                } else if (i === 2) {
                    lastCommonSep = 3;
                }
            }
            break;
        }
        const fromCode = from.charCodeAt(fromStart + i);
        const toCode = to.charCodeAt(toStart + i);
        if (fromCode !== toCode) break;
        else if (fromCode === 92) lastCommonSep = i;
    }
    if (i !== length && lastCommonSep === -1) {
        return toOrig;
    }
    let out = "";
    if (lastCommonSep === -1) lastCommonSep = 0;
    for(i = fromStart + lastCommonSep + 1; i <= fromEnd; ++i){
        if (i === fromEnd || from.charCodeAt(i) === 92) {
            if (out.length === 0) out += "..";
            else out += "\\..";
        }
    }
    if (out.length > 0) {
        return out + toOrig.slice(toStart + lastCommonSep, toEnd);
    } else {
        toStart += lastCommonSep;
        if (toOrig.charCodeAt(toStart) === 92) ++toStart;
        return toOrig.slice(toStart, toEnd);
    }
}
function toNamespacedPath3(path) {
    if (typeof path !== "string") return path;
    if (path.length === 0) return "";
    const resolvedPath = resolve3(path);
    if (resolvedPath.length >= 3) {
        if (resolvedPath.charCodeAt(0) === 92) {
            if (resolvedPath.charCodeAt(1) === 92) {
                const code = resolvedPath.charCodeAt(2);
                if (code !== 63 && code !== 46) {
                    return `\\\\?\\UNC\\${resolvedPath.slice(2)}`;
                }
            }
        } else if (isWindowsDeviceRoot1(resolvedPath.charCodeAt(0))) {
            if (resolvedPath.charCodeAt(1) === 58 && resolvedPath.charCodeAt(2) === 92) {
                return `\\\\?\\${resolvedPath}`;
            }
        }
    }
    return path;
}
function dirname3(path) {
    assertPath1(path);
    const len = path.length;
    if (len === 0) return ".";
    let rootEnd = -1;
    let end = -1;
    let matchedSlash = true;
    let offset = 0;
    const code = path.charCodeAt(0);
    if (len > 1) {
        if (isPathSeparator1(code)) {
            rootEnd = offset = 1;
            if (isPathSeparator1(path.charCodeAt(1))) {
                let j = 2;
                let last = j;
                for(; j < len; ++j){
                    if (isPathSeparator1(path.charCodeAt(j))) break;
                }
                if (j < len && j !== last) {
                    last = j;
                    for(; j < len; ++j){
                        if (!isPathSeparator1(path.charCodeAt(j))) break;
                    }
                    if (j < len && j !== last) {
                        last = j;
                        for(; j < len; ++j){
                            if (isPathSeparator1(path.charCodeAt(j))) break;
                        }
                        if (j === len) {
                            return path;
                        }
                        if (j !== last) {
                            rootEnd = offset = j + 1;
                        }
                    }
                }
            }
        } else if (isWindowsDeviceRoot1(code)) {
            if (path.charCodeAt(1) === 58) {
                rootEnd = offset = 2;
                if (len > 2) {
                    if (isPathSeparator1(path.charCodeAt(2))) rootEnd = offset = 3;
                }
            }
        }
    } else if (isPathSeparator1(code)) {
        return path;
    }
    for(let i = len - 1; i >= offset; --i){
        if (isPathSeparator1(path.charCodeAt(i))) {
            if (!matchedSlash) {
                end = i;
                break;
            }
        } else {
            matchedSlash = false;
        }
    }
    if (end === -1) {
        if (rootEnd === -1) return ".";
        else end = rootEnd;
    }
    return path.slice(0, end);
}
function basename3(path, ext = "") {
    if (ext !== undefined && typeof ext !== "string") {
        throw new TypeError('"ext" argument must be a string');
    }
    assertPath1(path);
    let start = 0;
    let end = -1;
    let matchedSlash = true;
    let i;
    if (path.length >= 2) {
        const drive = path.charCodeAt(0);
        if (isWindowsDeviceRoot1(drive)) {
            if (path.charCodeAt(1) === 58) start = 2;
        }
    }
    if (ext !== undefined && ext.length > 0 && ext.length <= path.length) {
        if (ext.length === path.length && ext === path) return "";
        let extIdx = ext.length - 1;
        let firstNonSlashEnd = -1;
        for(i = path.length - 1; i >= start; --i){
            const code = path.charCodeAt(i);
            if (isPathSeparator1(code)) {
                if (!matchedSlash) {
                    start = i + 1;
                    break;
                }
            } else {
                if (firstNonSlashEnd === -1) {
                    matchedSlash = false;
                    firstNonSlashEnd = i + 1;
                }
                if (extIdx >= 0) {
                    if (code === ext.charCodeAt(extIdx)) {
                        if (--extIdx === -1) {
                            end = i;
                        }
                    } else {
                        extIdx = -1;
                        end = firstNonSlashEnd;
                    }
                }
            }
        }
        if (start === end) end = firstNonSlashEnd;
        else if (end === -1) end = path.length;
        return path.slice(start, end);
    } else {
        for(i = path.length - 1; i >= start; --i){
            if (isPathSeparator1(path.charCodeAt(i))) {
                if (!matchedSlash) {
                    start = i + 1;
                    break;
                }
            } else if (end === -1) {
                matchedSlash = false;
                end = i + 1;
            }
        }
        if (end === -1) return "";
        return path.slice(start, end);
    }
}
function extname3(path) {
    assertPath1(path);
    let start = 0;
    let startDot = -1;
    let startPart = 0;
    let end = -1;
    let matchedSlash = true;
    let preDotState = 0;
    if (path.length >= 2 && path.charCodeAt(1) === 58 && isWindowsDeviceRoot1(path.charCodeAt(0))) {
        start = startPart = 2;
    }
    for(let i = path.length - 1; i >= start; --i){
        const code = path.charCodeAt(i);
        if (isPathSeparator1(code)) {
            if (!matchedSlash) {
                startPart = i + 1;
                break;
            }
            continue;
        }
        if (end === -1) {
            matchedSlash = false;
            end = i + 1;
        }
        if (code === 46) {
            if (startDot === -1) startDot = i;
            else if (preDotState !== 1) preDotState = 1;
        } else if (startDot !== -1) {
            preDotState = -1;
        }
    }
    if (startDot === -1 || end === -1 || preDotState === 0 || preDotState === 1 && startDot === end - 1 && startDot === startPart + 1) {
        return "";
    }
    return path.slice(startDot, end);
}
function format3(pathObject) {
    if (pathObject === null || typeof pathObject !== "object") {
        throw new TypeError(`The "pathObject" argument must be of type Object. Received type ${typeof pathObject}`);
    }
    return _format1("\\", pathObject);
}
function parse3(path) {
    assertPath1(path);
    const ret = {
        root: "",
        dir: "",
        base: "",
        ext: "",
        name: ""
    };
    const len = path.length;
    if (len === 0) return ret;
    let rootEnd = 0;
    let code = path.charCodeAt(0);
    if (len > 1) {
        if (isPathSeparator1(code)) {
            rootEnd = 1;
            if (isPathSeparator1(path.charCodeAt(1))) {
                let j = 2;
                let last = j;
                for(; j < len; ++j){
                    if (isPathSeparator1(path.charCodeAt(j))) break;
                }
                if (j < len && j !== last) {
                    last = j;
                    for(; j < len; ++j){
                        if (!isPathSeparator1(path.charCodeAt(j))) break;
                    }
                    if (j < len && j !== last) {
                        last = j;
                        for(; j < len; ++j){
                            if (isPathSeparator1(path.charCodeAt(j))) break;
                        }
                        if (j === len) {
                            rootEnd = j;
                        } else if (j !== last) {
                            rootEnd = j + 1;
                        }
                    }
                }
            }
        } else if (isWindowsDeviceRoot1(code)) {
            if (path.charCodeAt(1) === 58) {
                rootEnd = 2;
                if (len > 2) {
                    if (isPathSeparator1(path.charCodeAt(2))) {
                        if (len === 3) {
                            ret.root = ret.dir = path;
                            return ret;
                        }
                        rootEnd = 3;
                    }
                } else {
                    ret.root = ret.dir = path;
                    return ret;
                }
            }
        }
    } else if (isPathSeparator1(code)) {
        ret.root = ret.dir = path;
        return ret;
    }
    if (rootEnd > 0) ret.root = path.slice(0, rootEnd);
    let startDot = -1;
    let startPart = rootEnd;
    let end = -1;
    let matchedSlash = true;
    let i = path.length - 1;
    let preDotState = 0;
    for(; i >= rootEnd; --i){
        code = path.charCodeAt(i);
        if (isPathSeparator1(code)) {
            if (!matchedSlash) {
                startPart = i + 1;
                break;
            }
            continue;
        }
        if (end === -1) {
            matchedSlash = false;
            end = i + 1;
        }
        if (code === 46) {
            if (startDot === -1) startDot = i;
            else if (preDotState !== 1) preDotState = 1;
        } else if (startDot !== -1) {
            preDotState = -1;
        }
    }
    if (startDot === -1 || end === -1 || preDotState === 0 || preDotState === 1 && startDot === end - 1 && startDot === startPart + 1) {
        if (end !== -1) {
            ret.base = ret.name = path.slice(startPart, end);
        }
    } else {
        ret.name = path.slice(startPart, startDot);
        ret.base = path.slice(startPart, end);
        ret.ext = path.slice(startDot, end);
    }
    if (startPart > 0 && startPart !== rootEnd) {
        ret.dir = path.slice(0, startPart - 1);
    } else ret.dir = ret.root;
    return ret;
}
function fromFileUrl3(url) {
    url = url instanceof URL ? url : new URL(url);
    if (url.protocol != "file:") {
        throw new TypeError("Must be a file URL.");
    }
    let path = decodeURIComponent(url.pathname.replace(/\//g, "\\").replace(/%(?![0-9A-Fa-f]{2})/g, "%25")).replace(/^\\*([A-Za-z]:)(\\|$)/, "$1\\");
    if (url.hostname != "") {
        path = `\\\\${url.hostname}${path}`;
    }
    return path;
}
function toFileUrl3(path) {
    if (!isAbsolute3(path)) {
        throw new TypeError("Must be an absolute path.");
    }
    const [, hostname, pathname] = path.match(/^(?:[/\\]{2}([^/\\]+)(?=[/\\](?:[^/\\]|$)))?(.*)/);
    const url = new URL("file:///");
    url.pathname = encodeWhitespace1(pathname.replace(/%/g, "%25"));
    if (hostname != null && hostname != "localhost") {
        url.hostname = hostname;
        if (!url.hostname) {
            throw new TypeError("Invalid hostname.");
        }
    }
    return url;
}
const mod2 = {
    sep: sep3,
    delimiter: delimiter3,
    resolve: resolve3,
    normalize: normalize4,
    isAbsolute: isAbsolute3,
    join: join4,
    relative: relative3,
    toNamespacedPath: toNamespacedPath3,
    dirname: dirname3,
    basename: basename3,
    extname: extname3,
    format: format3,
    parse: parse3,
    fromFileUrl: fromFileUrl3,
    toFileUrl: toFileUrl3
};
const sep4 = "/";
const delimiter4 = ":";
function resolve4(...pathSegments) {
    let resolvedPath = "";
    let resolvedAbsolute = false;
    for(let i = pathSegments.length - 1; i >= -1 && !resolvedAbsolute; i--){
        let path;
        if (i >= 0) path = pathSegments[i];
        else {
            const { Deno: Deno1  } = globalThis;
            if (typeof Deno1?.cwd !== "function") {
                throw new TypeError("Resolved a relative path without a CWD.");
            }
            path = Deno1.cwd();
        }
        assertPath1(path);
        if (path.length === 0) {
            continue;
        }
        resolvedPath = `${path}/${resolvedPath}`;
        resolvedAbsolute = path.charCodeAt(0) === CHAR_FORWARD_SLASH1;
    }
    resolvedPath = normalizeString1(resolvedPath, !resolvedAbsolute, "/", isPosixPathSeparator1);
    if (resolvedAbsolute) {
        if (resolvedPath.length > 0) return `/${resolvedPath}`;
        else return "/";
    } else if (resolvedPath.length > 0) return resolvedPath;
    else return ".";
}
function normalize5(path) {
    assertPath1(path);
    if (path.length === 0) return ".";
    const isAbsolute = path.charCodeAt(0) === 47;
    const trailingSeparator = path.charCodeAt(path.length - 1) === 47;
    path = normalizeString1(path, !isAbsolute, "/", isPosixPathSeparator1);
    if (path.length === 0 && !isAbsolute) path = ".";
    if (path.length > 0 && trailingSeparator) path += "/";
    if (isAbsolute) return `/${path}`;
    return path;
}
function isAbsolute4(path) {
    assertPath1(path);
    return path.length > 0 && path.charCodeAt(0) === 47;
}
function join5(...paths) {
    if (paths.length === 0) return ".";
    let joined;
    for(let i = 0, len = paths.length; i < len; ++i){
        const path = paths[i];
        assertPath1(path);
        if (path.length > 0) {
            if (!joined) joined = path;
            else joined += `/${path}`;
        }
    }
    if (!joined) return ".";
    return normalize5(joined);
}
function relative4(from, to) {
    assertPath1(from);
    assertPath1(to);
    if (from === to) return "";
    from = resolve4(from);
    to = resolve4(to);
    if (from === to) return "";
    let fromStart = 1;
    const fromEnd = from.length;
    for(; fromStart < fromEnd; ++fromStart){
        if (from.charCodeAt(fromStart) !== 47) break;
    }
    const fromLen = fromEnd - fromStart;
    let toStart = 1;
    const toEnd = to.length;
    for(; toStart < toEnd; ++toStart){
        if (to.charCodeAt(toStart) !== 47) break;
    }
    const toLen = toEnd - toStart;
    const length = fromLen < toLen ? fromLen : toLen;
    let lastCommonSep = -1;
    let i = 0;
    for(; i <= length; ++i){
        if (i === length) {
            if (toLen > length) {
                if (to.charCodeAt(toStart + i) === 47) {
                    return to.slice(toStart + i + 1);
                } else if (i === 0) {
                    return to.slice(toStart + i);
                }
            } else if (fromLen > length) {
                if (from.charCodeAt(fromStart + i) === 47) {
                    lastCommonSep = i;
                } else if (i === 0) {
                    lastCommonSep = 0;
                }
            }
            break;
        }
        const fromCode = from.charCodeAt(fromStart + i);
        const toCode = to.charCodeAt(toStart + i);
        if (fromCode !== toCode) break;
        else if (fromCode === 47) lastCommonSep = i;
    }
    let out = "";
    for(i = fromStart + lastCommonSep + 1; i <= fromEnd; ++i){
        if (i === fromEnd || from.charCodeAt(i) === 47) {
            if (out.length === 0) out += "..";
            else out += "/..";
        }
    }
    if (out.length > 0) return out + to.slice(toStart + lastCommonSep);
    else {
        toStart += lastCommonSep;
        if (to.charCodeAt(toStart) === 47) ++toStart;
        return to.slice(toStart);
    }
}
function toNamespacedPath4(path) {
    return path;
}
function dirname4(path) {
    assertPath1(path);
    if (path.length === 0) return ".";
    const hasRoot = path.charCodeAt(0) === 47;
    let end = -1;
    let matchedSlash = true;
    for(let i = path.length - 1; i >= 1; --i){
        if (path.charCodeAt(i) === 47) {
            if (!matchedSlash) {
                end = i;
                break;
            }
        } else {
            matchedSlash = false;
        }
    }
    if (end === -1) return hasRoot ? "/" : ".";
    if (hasRoot && end === 1) return "//";
    return path.slice(0, end);
}
function basename4(path, ext = "") {
    if (ext !== undefined && typeof ext !== "string") {
        throw new TypeError('"ext" argument must be a string');
    }
    assertPath1(path);
    let start = 0;
    let end = -1;
    let matchedSlash = true;
    let i;
    if (ext !== undefined && ext.length > 0 && ext.length <= path.length) {
        if (ext.length === path.length && ext === path) return "";
        let extIdx = ext.length - 1;
        let firstNonSlashEnd = -1;
        for(i = path.length - 1; i >= 0; --i){
            const code = path.charCodeAt(i);
            if (code === 47) {
                if (!matchedSlash) {
                    start = i + 1;
                    break;
                }
            } else {
                if (firstNonSlashEnd === -1) {
                    matchedSlash = false;
                    firstNonSlashEnd = i + 1;
                }
                if (extIdx >= 0) {
                    if (code === ext.charCodeAt(extIdx)) {
                        if (--extIdx === -1) {
                            end = i;
                        }
                    } else {
                        extIdx = -1;
                        end = firstNonSlashEnd;
                    }
                }
            }
        }
        if (start === end) end = firstNonSlashEnd;
        else if (end === -1) end = path.length;
        return path.slice(start, end);
    } else {
        for(i = path.length - 1; i >= 0; --i){
            if (path.charCodeAt(i) === 47) {
                if (!matchedSlash) {
                    start = i + 1;
                    break;
                }
            } else if (end === -1) {
                matchedSlash = false;
                end = i + 1;
            }
        }
        if (end === -1) return "";
        return path.slice(start, end);
    }
}
function extname4(path) {
    assertPath1(path);
    let startDot = -1;
    let startPart = 0;
    let end = -1;
    let matchedSlash = true;
    let preDotState = 0;
    for(let i = path.length - 1; i >= 0; --i){
        const code = path.charCodeAt(i);
        if (code === 47) {
            if (!matchedSlash) {
                startPart = i + 1;
                break;
            }
            continue;
        }
        if (end === -1) {
            matchedSlash = false;
            end = i + 1;
        }
        if (code === 46) {
            if (startDot === -1) startDot = i;
            else if (preDotState !== 1) preDotState = 1;
        } else if (startDot !== -1) {
            preDotState = -1;
        }
    }
    if (startDot === -1 || end === -1 || preDotState === 0 || preDotState === 1 && startDot === end - 1 && startDot === startPart + 1) {
        return "";
    }
    return path.slice(startDot, end);
}
function format4(pathObject) {
    if (pathObject === null || typeof pathObject !== "object") {
        throw new TypeError(`The "pathObject" argument must be of type Object. Received type ${typeof pathObject}`);
    }
    return _format1("/", pathObject);
}
function parse4(path) {
    assertPath1(path);
    const ret = {
        root: "",
        dir: "",
        base: "",
        ext: "",
        name: ""
    };
    if (path.length === 0) return ret;
    const isAbsolute = path.charCodeAt(0) === 47;
    let start;
    if (isAbsolute) {
        ret.root = "/";
        start = 1;
    } else {
        start = 0;
    }
    let startDot = -1;
    let startPart = 0;
    let end = -1;
    let matchedSlash = true;
    let i = path.length - 1;
    let preDotState = 0;
    for(; i >= start; --i){
        const code = path.charCodeAt(i);
        if (code === 47) {
            if (!matchedSlash) {
                startPart = i + 1;
                break;
            }
            continue;
        }
        if (end === -1) {
            matchedSlash = false;
            end = i + 1;
        }
        if (code === 46) {
            if (startDot === -1) startDot = i;
            else if (preDotState !== 1) preDotState = 1;
        } else if (startDot !== -1) {
            preDotState = -1;
        }
    }
    if (startDot === -1 || end === -1 || preDotState === 0 || preDotState === 1 && startDot === end - 1 && startDot === startPart + 1) {
        if (end !== -1) {
            if (startPart === 0 && isAbsolute) {
                ret.base = ret.name = path.slice(1, end);
            } else {
                ret.base = ret.name = path.slice(startPart, end);
            }
        }
    } else {
        if (startPart === 0 && isAbsolute) {
            ret.name = path.slice(1, startDot);
            ret.base = path.slice(1, end);
        } else {
            ret.name = path.slice(startPart, startDot);
            ret.base = path.slice(startPart, end);
        }
        ret.ext = path.slice(startDot, end);
    }
    if (startPart > 0) ret.dir = path.slice(0, startPart - 1);
    else if (isAbsolute) ret.dir = "/";
    return ret;
}
function fromFileUrl4(url) {
    url = url instanceof URL ? url : new URL(url);
    if (url.protocol != "file:") {
        throw new TypeError("Must be a file URL.");
    }
    return decodeURIComponent(url.pathname.replace(/%(?![0-9A-Fa-f]{2})/g, "%25"));
}
function toFileUrl4(path) {
    if (!isAbsolute4(path)) {
        throw new TypeError("Must be an absolute path.");
    }
    const url = new URL("file:///");
    url.pathname = encodeWhitespace1(path.replace(/%/g, "%25").replace(/\\/g, "%5C"));
    return url;
}
const mod3 = {
    sep: sep4,
    delimiter: delimiter4,
    resolve: resolve4,
    normalize: normalize5,
    isAbsolute: isAbsolute4,
    join: join5,
    relative: relative4,
    toNamespacedPath: toNamespacedPath4,
    dirname: dirname4,
    basename: basename4,
    extname: extname4,
    format: format4,
    parse: parse4,
    fromFileUrl: fromFileUrl4,
    toFileUrl: toFileUrl4
};
const path2 = isWindows1 ? mod2 : mod3;
const { join: join6 , normalize: normalize6  } = path2;
const path3 = isWindows1 ? mod2 : mod3;
const { basename: basename5 , delimiter: delimiter5 , dirname: dirname5 , extname: extname5 , format: format5 , fromFileUrl: fromFileUrl5 , isAbsolute: isAbsolute5 , join: join7 , normalize: normalize7 , parse: parse5 , relative: relative5 , resolve: resolve5 , sep: sep5 , toFileUrl: toFileUrl5 , toNamespacedPath: toNamespacedPath5  } = path3;
const SQLITE3_OPEN_READONLY = 0x00000001;
const SQLITE3_OPEN_READWRITE = 0x00000002;
const SQLITE3_OPEN_CREATE = 0x00000004;
const SQLITE3_OPEN_MEMORY = 0x00000080;
const { sqlite3_errmsg , sqlite3_errstr  } = lib;
const encoder1 = new TextEncoder();
function toCString(str) {
    return encoder1.encode(str + "\0");
}
class SqliteError extends Error {
    name;
    constructor(code = 1, message = "Unknown Error"){
        super(`${code}: ${message}`);
        this.code = code;
        this.name = "SqliteError";
    }
    code;
}
function unwrap(code, db) {
    if (code === 0) return;
    if (code === 21) {
        throw new SqliteError(code, "SQLite3 API misuse");
    } else if (db !== undefined) {
        const errmsg = sqlite3_errmsg(db);
        if (errmsg === null) throw new SqliteError(code);
        throw new Error(Deno.UnsafePointerView.getCString(sqlite3_errmsg(db)));
    } else {
        throw new SqliteError(code, Deno.UnsafePointerView.getCString(sqlite3_errstr(code)));
    }
}
Deno.UnsafePointerView.getArrayBuffer;
const readCstr = Deno.UnsafePointerView.getCString;
const { sqlite3_prepare_v2 , sqlite3_reset , sqlite3_clear_bindings , sqlite3_step , sqlite3_column_count , sqlite3_column_type , sqlite3_column_text , sqlite3_finalize , sqlite3_column_int64 , sqlite3_column_double , sqlite3_column_blob , sqlite3_column_bytes , sqlite3_column_name , sqlite3_expanded_sql , sqlite3_bind_parameter_count , sqlite3_bind_int , sqlite3_bind_int64 , sqlite3_bind_text , sqlite3_bind_blob , sqlite3_bind_double , sqlite3_bind_parameter_index , sqlite3_sql , sqlite3_stmt_readonly , sqlite3_bind_parameter_name , sqlite3_changes , sqlite3_column_int , sqlite3_step_cb  } = lib;
const STATEMENTS = new Map();
const emptyStringBuffer = new Uint8Array(1);
const statementFinalizer = new FinalizationRegistry((ptr)=>{
    if (STATEMENTS.has(ptr)) {
        sqlite3_finalize(ptr);
        STATEMENTS.delete(ptr);
    }
});
function getColumn(handle, i, int64) {
    const ty = sqlite3_column_type(handle, i);
    if (ty === 1 && !int64) return sqlite3_column_int(handle, i);
    switch(ty){
        case 3:
            {
                const ptr = sqlite3_column_text(handle, i);
                if (ptr === null) return null;
                return readCstr(ptr, 0);
            }
        case 1:
            {
                const v = sqlite3_column_int64(handle, i);
                const numv = Number(v);
                if (Number.isSafeInteger(numv)) {
                    return numv;
                } else {
                    return v;
                }
            }
        case 2:
            {
                return sqlite3_column_double(handle, i);
            }
        case 4:
            {
                const ptr = sqlite3_column_blob(handle, i);
                const bytes = sqlite3_column_bytes(handle, i);
                return new Uint8Array(Deno.UnsafePointerView.getArrayBuffer(ptr, bytes).slice(0));
            }
        default:
            {
                return null;
            }
    }
}
class Statement {
    #handle;
    #finalizerToken;
    #bound;
    #hasNoArgs;
    #unsafeConcurrency;
    callback;
    get unsafeHandle() {
        return this.#handle;
    }
    get expandedSql() {
        return readCstr(sqlite3_expanded_sql(this.#handle));
    }
    get sql() {
        return readCstr(sqlite3_sql(this.#handle));
    }
    get readonly() {
        return sqlite3_stmt_readonly(this.#handle) !== 0;
    }
    run(...args) {
        return this.#runWithArgs(...args);
    }
    values(...args) {
        return this.#valuesWithArgs(...args);
    }
    all(...args) {
        return this.#allWithArgs(...args);
    }
    #bindParameterCount;
    get bindParameterCount() {
        return this.#bindParameterCount;
    }
    constructor(db, sql){
        this.db = db;
        this.#bound = false;
        this.#hasNoArgs = false;
        this.callback = false;
        this.#bindRefs = new Set();
        this.#rowObject = {};
        const pHandle = new Uint32Array(2);
        unwrap(sqlite3_prepare_v2(db.unsafeHandle, toCString(sql), sql.length, pHandle, null), db.unsafeHandle);
        this.#handle = Deno.UnsafePointer.create(pHandle[0] + 2 ** 32 * pHandle[1]);
        STATEMENTS.set(this.#handle, db.unsafeHandle);
        this.#unsafeConcurrency = db.unsafeConcurrency;
        this.#finalizerToken = {
            handle: this.#handle
        };
        statementFinalizer.register(this, this.#handle, this.#finalizerToken);
        if ((this.#bindParameterCount = sqlite3_bind_parameter_count(this.#handle)) === 0) {
            this.#hasNoArgs = true;
            this.all = this.#allNoArgs;
            this.values = this.#valuesNoArgs;
            this.run = this.#runNoArgs;
            this.value = this.#valueNoArgs;
            this.get = this.#getNoArgs;
        }
    }
    enableCallback() {
        this.callback = true;
        return this;
    }
    bindParameterName(i) {
        return readCstr(sqlite3_bind_parameter_name(this.#handle, i));
    }
    bindParameterIndex(name) {
        if (name[0] !== ":" && name[0] !== "@" && name[0] !== "$") {
            name = ":" + name;
        }
        return sqlite3_bind_parameter_index(this.#handle, toCString(name));
    }
    #begin() {
        sqlite3_reset(this.#handle);
        if (!this.#bound && !this.#hasNoArgs) {
            sqlite3_clear_bindings(this.#handle);
            this.#bindRefs.clear();
        }
    }
    #bindRefs;
    #bind(i, param) {
        switch(typeof param){
            case "number":
                {
                    if (Number.isInteger(param)) {
                        if (Number.isSafeInteger(param) && param >= -(2 ** 31) && param < 2 ** 31) {
                            unwrap(sqlite3_bind_int(this.#handle, i + 1, param));
                        } else {
                            unwrap(sqlite3_bind_int64(this.#handle, i + 1, BigInt(param)));
                        }
                    } else {
                        unwrap(sqlite3_bind_double(this.#handle, i + 1, param));
                    }
                    break;
                }
            case "string":
                {
                    if (param === "") {
                        unwrap(sqlite3_bind_text(this.#handle, i + 1, emptyStringBuffer, 0, null));
                    } else {
                        const str = new TextEncoder().encode(param);
                        this.#bindRefs.add(str);
                        unwrap(sqlite3_bind_text(this.#handle, i + 1, str, str.byteLength, null));
                    }
                    break;
                }
            case "object":
                {
                    if (param === null) {} else if (param instanceof Uint8Array) {
                        this.#bindRefs.add(param);
                        unwrap(sqlite3_bind_blob(this.#handle, i + 1, param, param.byteLength, null));
                    } else if (param instanceof Date) {
                        const cstring = toCString(param.toISOString());
                        this.#bindRefs.add(cstring);
                        unwrap(sqlite3_bind_text(this.#handle, i + 1, cstring, -1, null));
                    } else {
                        throw new Error(`Value of unsupported type: ${Deno.inspect(param)}`);
                    }
                    break;
                }
            case "bigint":
                {
                    unwrap(sqlite3_bind_int64(this.#handle, i + 1, param));
                    break;
                }
            case "boolean":
                unwrap(sqlite3_bind_int(this.#handle, i + 1, param ? 1 : 0));
                break;
            default:
                {
                    throw new Error(`Value of unsupported type: ${Deno.inspect(param)}`);
                }
        }
    }
    bind(...params) {
        this.#bindAll(params);
        this.#bound = true;
        return this;
    }
    #bindAll(params) {
        if (this.#bound) throw new Error("Statement already bound to values");
        if (typeof params[0] === "object" && params[0] !== null && !(params[0] instanceof Uint8Array) && !(params[0] instanceof Date)) {
            params = params[0];
        }
        if (Array.isArray(params)) {
            for(let i = 0; i < params.length; i++){
                this.#bind(i, params[i]);
            }
        } else {
            for (const [name, param] of Object.entries(params)){
                const i = this.bindParameterIndex(name);
                if (i === 0) {
                    throw new Error(`No such parameter "${name}"`);
                }
                this.#bind(i - 1, param);
            }
        }
    }
    #runNoArgs() {
        this.#begin();
        const step = this.callback ? sqlite3_step_cb : sqlite3_step;
        const status = step(this.#handle);
        if (status !== 100 && status !== 101) {
            unwrap(status, this.db.unsafeHandle);
        }
        sqlite3_reset(this.#handle);
        return sqlite3_changes(this.db.unsafeHandle);
    }
    #runWithArgs(...params1) {
        this.#begin();
        this.#bindAll(params1);
        const step = this.callback ? sqlite3_step_cb : sqlite3_step;
        const status = step(this.#handle);
        if (!this.#hasNoArgs && !this.#bound && params1.length) {
            this.#bindRefs.clear();
        }
        if (status !== 100 && status !== 101) {
            unwrap(status, this.db.unsafeHandle);
        }
        sqlite3_reset(this.#handle);
        return sqlite3_changes(this.db.unsafeHandle);
    }
    #valuesNoArgs() {
        this.#begin();
        const columnCount = sqlite3_column_count(this.#handle);
        const result = [];
        const getRowArray = new Function("getColumn", `
      return function(h) {
        return [${Array.from({
            length: columnCount
        }).map((_, i)=>`getColumn(h, ${i}, ${this.db.int64})`).join(", ")}];
      };
      `)(getColumn);
        const step = this.callback ? sqlite3_step_cb : sqlite3_step;
        let status = step(this.#handle);
        while(status === 100){
            result.push(getRowArray(this.#handle));
            status = step(this.#handle);
        }
        if (status !== 101) {
            unwrap(status, this.db.unsafeHandle);
        }
        sqlite3_reset(this.#handle);
        return result;
    }
    #valuesWithArgs(...params2) {
        this.#begin();
        this.#bindAll(params2);
        const columnCount = sqlite3_column_count(this.#handle);
        const result = [];
        const getRowArray = new Function("getColumn", `
      return function(h) {
        return [${Array.from({
            length: columnCount
        }).map((_, i)=>`getColumn(h, ${i}, ${this.db.int64})`).join(", ")}];
      };
      `)(getColumn);
        const step = this.callback ? sqlite3_step_cb : sqlite3_step;
        let status = step(this.#handle);
        while(status === 100){
            result.push(getRowArray(this.#handle));
            status = step(this.#handle);
        }
        if (!this.#hasNoArgs && !this.#bound && params2.length) {
            this.#bindRefs.clear();
        }
        if (status !== 101) {
            unwrap(status, this.db.unsafeHandle);
        }
        sqlite3_reset(this.#handle);
        return result;
    }
    #rowObjectFn;
    getRowObject() {
        if (!this.#rowObjectFn || !this.#unsafeConcurrency) {
            const columnNames = this.columnNames();
            const getRowObject = new Function("getColumn", `
        return function(h) {
          return {
            ${columnNames.map((name, i)=>`"${name}": getColumn(h, ${i}, ${this.db.int64})`).join(",\n")}
          };
        };
        `)(getColumn);
            this.#rowObjectFn = getRowObject;
        }
        return this.#rowObjectFn;
    }
    #allNoArgs() {
        this.#begin();
        const getRowObject = this.getRowObject();
        const result = [];
        const step = this.callback ? sqlite3_step_cb : sqlite3_step;
        let status = step(this.#handle);
        while(status === 100){
            result.push(getRowObject(this.#handle));
            status = step(this.#handle);
        }
        if (status !== 101) {
            unwrap(status, this.db.unsafeHandle);
        }
        sqlite3_reset(this.#handle);
        return result;
    }
    #allWithArgs(...params3) {
        this.#begin();
        this.#bindAll(params3);
        const getRowObject = this.getRowObject();
        const result = [];
        const step = this.callback ? sqlite3_step_cb : sqlite3_step;
        let status = step(this.#handle);
        while(status === 100){
            result.push(getRowObject(this.#handle));
            status = step(this.#handle);
        }
        if (!this.#hasNoArgs && !this.#bound && params3.length) {
            this.#bindRefs.clear();
        }
        if (status !== 101) {
            unwrap(status, this.db.unsafeHandle);
        }
        sqlite3_reset(this.#handle);
        return result;
    }
    value(...params) {
        const handle = this.#handle;
        const int64 = this.db.int64;
        const arr = new Array(sqlite3_column_count(handle));
        sqlite3_reset(handle);
        if (!this.#hasNoArgs && !this.#bound) {
            sqlite3_clear_bindings(handle);
            this.#bindRefs.clear();
            if (params.length) {
                this.#bindAll(params);
            }
        }
        const step = this.callback ? sqlite3_step_cb : sqlite3_step;
        const status = step(handle);
        if (!this.#hasNoArgs && !this.#bound && params.length) {
            this.#bindRefs.clear();
        }
        if (status === 100) {
            for(let i = 0; i < arr.length; i++){
                arr[i] = getColumn(handle, i, int64);
            }
            sqlite3_reset(this.#handle);
            return arr;
        } else if (status === 101) {
            return;
        } else {
            unwrap(status, this.db.unsafeHandle);
        }
    }
    #valueNoArgs() {
        const handle = this.#handle;
        const int64 = this.db.int64;
        const cc = sqlite3_column_count(handle);
        const arr = new Array(cc);
        sqlite3_reset(handle);
        const step = this.callback ? sqlite3_step_cb : sqlite3_step;
        const status = step(handle);
        if (status === 100) {
            for(let i = 0; i < cc; i++){
                arr[i] = getColumn(handle, i, int64);
            }
            sqlite3_reset(this.#handle);
            return arr;
        } else if (status === 101) {
            return;
        } else {
            unwrap(status, this.db.unsafeHandle);
        }
    }
    #columnNames;
    #rowObject;
    columnNames() {
        if (!this.#columnNames || !this.#unsafeConcurrency) {
            const columnCount = sqlite3_column_count(this.#handle);
            const columnNames = new Array(columnCount);
            for(let i = 0; i < columnCount; i++){
                columnNames[i] = readCstr(sqlite3_column_name(this.#handle, i));
            }
            this.#columnNames = columnNames;
            this.#rowObject = {};
            for (const name of columnNames){
                this.#rowObject[name] = undefined;
            }
        }
        return this.#columnNames;
    }
    get(...params) {
        const handle = this.#handle;
        const int64 = this.db.int64;
        const columnNames = this.columnNames();
        const row = {};
        sqlite3_reset(handle);
        if (!this.#hasNoArgs && !this.#bound) {
            sqlite3_clear_bindings(handle);
            this.#bindRefs.clear();
            if (params.length) {
                this.#bindAll(params);
            }
        }
        const step = this.callback ? sqlite3_step_cb : sqlite3_step;
        const status = step(handle);
        if (!this.#hasNoArgs && !this.#bound && params.length) {
            this.#bindRefs.clear();
        }
        if (status === 100) {
            for(let i = 0; i < columnNames.length; i++){
                row[columnNames[i]] = getColumn(handle, i, int64);
            }
            sqlite3_reset(this.#handle);
            return row;
        } else if (status === 101) {
            return;
        } else {
            unwrap(status, this.db.unsafeHandle);
        }
    }
    #getNoArgs() {
        const handle = this.#handle;
        const int64 = this.db.int64;
        const columnNames = this.columnNames();
        const row = this.#rowObject;
        sqlite3_reset(handle);
        const step = this.callback ? sqlite3_step_cb : sqlite3_step;
        const status = step(handle);
        if (status === 100) {
            for(let i = 0; i < columnNames?.length; i++){
                row[columnNames[i]] = getColumn(handle, i, int64);
            }
            sqlite3_reset(this.#handle);
            return row;
        } else if (status === 101) {
            return;
        } else {
            unwrap(status, this.db.unsafeHandle);
        }
    }
    finalize() {
        if (!STATEMENTS.has(this.#handle)) return;
        this.#bindRefs.clear();
        statementFinalizer.unregister(this.#finalizerToken);
        STATEMENTS.delete(this.#handle);
        unwrap(sqlite3_finalize(this.#handle));
    }
    toString() {
        return readCstr(sqlite3_expanded_sql(this.#handle));
    }
    *[Symbol.iterator]() {
        this.#begin();
        const getRowObject = this.getRowObject();
        const step = this.callback ? sqlite3_step_cb : sqlite3_step;
        let status = step(this.#handle);
        while(status === 100){
            yield getRowObject(this.#handle);
            status = step(this.#handle);
        }
        if (status !== 101) {
            unwrap(status, this.db.unsafeHandle);
        }
        sqlite3_reset(this.#handle);
    }
    db;
}
const { sqlite3_blob_open , sqlite3_blob_bytes , sqlite3_blob_close , sqlite3_blob_read , sqlite3_blob_write  } = lib;
class SQLBlob {
    #handle;
    constructor(db, options){
        options = Object.assign({
            readonly: true,
            db: "main"
        }, options);
        const pHandle = new Uint32Array(2);
        unwrap(sqlite3_blob_open(db.unsafeHandle, toCString(options.db ?? "main"), toCString(options.table), toCString(options.column), options.row, options.readonly === false ? 1 : 0, pHandle));
        this.#handle = Deno.UnsafePointer.create(pHandle[0] + 2 ** 32 * pHandle[1]);
    }
    get byteLength() {
        return sqlite3_blob_bytes(this.#handle);
    }
    readSync(offset, p) {
        unwrap(sqlite3_blob_read(this.#handle, p, p.byteLength, offset));
    }
    writeSync(offset, p) {
        unwrap(sqlite3_blob_write(this.#handle, p, p.byteLength, offset));
    }
    close() {
        unwrap(sqlite3_blob_close(this.#handle));
    }
    get readable() {
        const length = this.byteLength;
        let offset = 0;
        return new ReadableStream({
            type: "bytes",
            pull: (ctx)=>{
                try {
                    const byob = ctx.byobRequest;
                    if (byob) {
                        const toRead = Math.min(length - offset, byob.view.byteLength);
                        this.readSync(offset, byob.view.subarray(0, toRead));
                        offset += toRead;
                        byob.respond(toRead);
                    } else {
                        const toRead = Math.min(length - offset, ctx.desiredSize || 1024 * 16);
                        if (toRead === 0) {
                            ctx.close();
                            return;
                        }
                        const buffer = new Uint8Array(toRead);
                        this.readSync(offset, buffer);
                        offset += toRead;
                        ctx.enqueue(buffer);
                    }
                } catch (e) {
                    ctx.error(e);
                    ctx.byobRequest?.respond(0);
                }
            }
        });
    }
    get writable() {
        const length = this.byteLength;
        let offset = 0;
        return new WritableStream({
            write: (chunk, ctx)=>{
                if (offset + chunk.byteLength > length) {
                    ctx.error(new Error("Write exceeds blob length"));
                    return;
                }
                this.writeSync(offset, chunk);
                offset += chunk.byteLength;
            }
        });
    }
    *[Symbol.iterator]() {
        const length = this.byteLength;
        let offset = 0;
        while(offset < length){
            const toRead = Math.min(length - offset, 1024 * 16);
            const buffer = new Uint8Array(toRead);
            this.readSync(offset, buffer);
            offset += toRead;
            yield buffer;
        }
    }
    [Symbol.for("Deno.customInspect")]() {
        return `SQLite3.Blob(0x${this.byteLength.toString(16)})`;
    }
}
const { sqlite3_open_v2 , sqlite3_close_v2 , sqlite3_changes: sqlite3_changes1 , sqlite3_total_changes , sqlite3_last_insert_rowid , sqlite3_get_autocommit , sqlite3_exec , sqlite3_free , sqlite3_libversion , sqlite3_sourceid , sqlite3_complete , sqlite3_finalize: sqlite3_finalize1 , sqlite3_result_blob , sqlite3_result_double , sqlite3_result_error , sqlite3_result_int64 , sqlite3_result_null , sqlite3_result_text , sqlite3_value_blob , sqlite3_value_bytes , sqlite3_value_double , sqlite3_value_int64 , sqlite3_value_text , sqlite3_value_type , sqlite3_create_function , sqlite3_result_int , sqlite3_aggregate_context , sqlite3_enable_load_extension , sqlite3_load_extension  } = lib;
readCstr(sqlite3_libversion());
readCstr(sqlite3_sourceid());
class Database {
    #path;
    #handle;
    #open = true;
    #enableLoadExtension = false;
    int64;
    unsafeConcurrency;
    get open() {
        return this.#open;
    }
    get unsafeHandle() {
        return this.#handle;
    }
    get path() {
        return this.#path;
    }
    get changes() {
        return sqlite3_changes1(this.#handle);
    }
    get totalChanges() {
        return sqlite3_total_changes(this.#handle);
    }
    get lastInsertRowId() {
        return Number(sqlite3_last_insert_rowid(this.#handle));
    }
    get autocommit() {
        return sqlite3_get_autocommit(this.#handle) === 1;
    }
    get inTransaction() {
        return this.#open && !this.autocommit;
    }
    get enableLoadExtension() {
        return this.#enableLoadExtension;
    }
    set enableLoadExtension(enabled) {
        const result = sqlite3_enable_load_extension(this.#handle, Number(enabled));
        unwrap(result, this.#handle);
        this.#enableLoadExtension = enabled;
    }
    constructor(path, options = {}){
        this.#path = path instanceof URL ? fromFileUrl5(path) : path;
        let flags = 0;
        this.int64 = options.int64 ?? false;
        this.unsafeConcurrency = options.unsafeConcurrency ?? false;
        if (options.flags !== undefined) {
            flags = options.flags;
        } else {
            if (options.memory) {
                flags |= SQLITE3_OPEN_MEMORY;
            }
            if (options.readonly ?? false) {
                flags |= SQLITE3_OPEN_READONLY;
            } else {
                flags |= SQLITE3_OPEN_READWRITE;
            }
            if ((options.create ?? true) && !options.readonly) {
                flags |= SQLITE3_OPEN_CREATE;
            }
        }
        const pHandle = new Uint32Array(2);
        const result = sqlite3_open_v2(toCString(this.#path), pHandle, flags, null);
        this.#handle = Deno.UnsafePointer.create(pHandle[0] + 2 ** 32 * pHandle[1]);
        if (result !== 0) sqlite3_close_v2(this.#handle);
        unwrap(result);
        if (options.enableLoadExtension) {
            this.enableLoadExtension = options.enableLoadExtension;
        }
    }
    prepare(sql) {
        return new Statement(this, sql);
    }
    openBlob(options) {
        return new SQLBlob(this, options);
    }
    exec(sql, ...params) {
        if (params.length === 0) {
            const pErr = new Uint32Array(2);
            sqlite3_exec(this.#handle, toCString(sql), null, null, new Uint8Array(pErr.buffer));
            const errPtr = Deno.UnsafePointer.create(pErr[0] + 2 ** 32 * pErr[1]);
            if (errPtr !== null) {
                const err = readCstr(errPtr);
                sqlite3_free(errPtr);
                throw new Error(err);
            }
            return sqlite3_changes1(this.#handle);
        }
        const stmt = this.prepare(sql);
        stmt.run(...params);
        return sqlite3_changes1(this.#handle);
    }
    run(sql, ...params) {
        return this.exec(sql, ...params);
    }
    transaction(fn) {
        const controller = getController(this);
        const properties = {
            default: {
                value: wrapTransaction(fn, this, controller.default)
            },
            deferred: {
                value: wrapTransaction(fn, this, controller.deferred)
            },
            immediate: {
                value: wrapTransaction(fn, this, controller.immediate)
            },
            exclusive: {
                value: wrapTransaction(fn, this, controller.exclusive)
            },
            database: {
                value: this,
                enumerable: true
            }
        };
        Object.defineProperties(properties.default.value, properties);
        Object.defineProperties(properties.deferred.value, properties);
        Object.defineProperties(properties.immediate.value, properties);
        Object.defineProperties(properties.exclusive.value, properties);
        return properties.default.value;
    }
    #callbacks = new Set();
    function(name, fn, options) {
        const cb = new Deno.UnsafeCallback({
            parameters: [
                "pointer",
                "i32",
                "pointer"
            ],
            result: "void"
        }, (ctx, nArgs, pArgs)=>{
            const argptr = new Deno.UnsafePointerView(pArgs);
            const args = [];
            for(let i = 0; i < nArgs; i++){
                const arg = Deno.UnsafePointer.create(Number(argptr.getBigUint64(i * 8)));
                const type = sqlite3_value_type(arg);
                switch(type){
                    case 1:
                        args.push(sqlite3_value_int64(arg));
                        break;
                    case 2:
                        args.push(sqlite3_value_double(arg));
                        break;
                    case 3:
                        args.push(new TextDecoder().decode(new Uint8Array(Deno.UnsafePointerView.getArrayBuffer(sqlite3_value_text(arg), sqlite3_value_bytes(arg)))));
                        break;
                    case 4:
                        args.push(new Uint8Array(Deno.UnsafePointerView.getArrayBuffer(sqlite3_value_blob(arg), sqlite3_value_bytes(arg))));
                        break;
                    case 5:
                        args.push(null);
                        break;
                    default:
                        throw new Error(`Unknown type: ${type}`);
                }
            }
            let result;
            try {
                result = fn(...args);
            } catch (err) {
                const buf = new TextEncoder().encode(err.message);
                sqlite3_result_error(ctx, buf, buf.byteLength);
                return;
            }
            if (result === undefined || result === null) {
                sqlite3_result_null(ctx);
            } else if (typeof result === "boolean") {
                sqlite3_result_int(ctx, result ? 1 : 0);
            } else if (typeof result === "number") {
                if (Number.isSafeInteger(result)) sqlite3_result_int64(ctx, result);
                else sqlite3_result_double(ctx, result);
            } else if (typeof result === "bigint") {
                sqlite3_result_int64(ctx, result);
            } else if (typeof result === "string") {
                const buffer = new TextEncoder().encode(result);
                sqlite3_result_text(ctx, buffer, buffer.byteLength, 0);
            } else if (result instanceof Uint8Array) {
                sqlite3_result_blob(ctx, result, result.length, -1);
            } else {
                const buffer = new TextEncoder().encode(`Invalid return value: ${Deno.inspect(result)}`);
                sqlite3_result_error(ctx, buffer, buffer.byteLength);
            }
        });
        let flags = 1;
        if (options?.deterministic) {
            flags |= 0x000000800;
        }
        if (options?.directOnly) {
            flags |= 0x000080000;
        }
        if (options?.subtype) {
            flags |= 0x000100000;
        }
        if (options?.directOnly) {
            flags |= 0x000200000;
        }
        const err = sqlite3_create_function(this.#handle, toCString(name), options?.varargs ? -1 : fn.length, flags, null, cb.pointer, null, null);
        unwrap(err, this.#handle);
        this.#callbacks.add(cb);
    }
    aggregate(name, options) {
        const contexts = new Map();
        const cb = new Deno.UnsafeCallback({
            parameters: [
                "pointer",
                "i32",
                "pointer"
            ],
            result: "void"
        }, (ctx, nArgs, pArgs)=>{
            const aggrCtx = sqlite3_aggregate_context(ctx, 8);
            const aggrPtr = Deno.UnsafePointer.value(aggrCtx);
            let aggregate;
            if (contexts.has(aggrPtr)) {
                aggregate = contexts.get(aggrPtr);
            } else {
                aggregate = typeof options.start === "function" ? options.start() : options.start;
                contexts.set(aggrPtr, aggregate);
            }
            const argptr = new Deno.UnsafePointerView(pArgs);
            const args = [];
            for(let i = 0; i < nArgs; i++){
                const arg = Deno.UnsafePointer.create(Number(argptr.getBigUint64(i * 8)));
                const type = sqlite3_value_type(arg);
                switch(type){
                    case 1:
                        args.push(sqlite3_value_int64(arg));
                        break;
                    case 2:
                        args.push(sqlite3_value_double(arg));
                        break;
                    case 3:
                        args.push(new TextDecoder().decode(new Uint8Array(Deno.UnsafePointerView.getArrayBuffer(sqlite3_value_text(arg), sqlite3_value_bytes(arg)))));
                        break;
                    case 4:
                        args.push(new Uint8Array(Deno.UnsafePointerView.getArrayBuffer(sqlite3_value_blob(arg), sqlite3_value_bytes(arg))));
                        break;
                    case 5:
                        args.push(null);
                        break;
                    default:
                        throw new Error(`Unknown type: ${type}`);
                }
            }
            let result;
            try {
                result = options.step(aggregate, ...args);
            } catch (err) {
                const buf = new TextEncoder().encode(err.message);
                sqlite3_result_error(ctx, buf, buf.byteLength);
                return;
            }
            contexts.set(aggrPtr, result);
        });
        const cbFinal = new Deno.UnsafeCallback({
            parameters: [
                "pointer"
            ],
            result: "void"
        }, (ctx)=>{
            const aggrCtx = sqlite3_aggregate_context(ctx, 0);
            const aggrPtr = Deno.UnsafePointer.value(aggrCtx);
            const aggregate = contexts.get(aggrPtr);
            contexts.delete(aggrPtr);
            let result;
            try {
                result = options.final ? options.final(aggregate) : aggregate;
            } catch (err) {
                const buf = new TextEncoder().encode(err.message);
                sqlite3_result_error(ctx, buf, buf.byteLength);
                return;
            }
            if (result === undefined || result === null) {
                sqlite3_result_null(ctx);
            } else if (typeof result === "boolean") {
                sqlite3_result_int(ctx, result ? 1 : 0);
            } else if (typeof result === "number") {
                if (Number.isSafeInteger(result)) sqlite3_result_int64(ctx, result);
                else sqlite3_result_double(ctx, result);
            } else if (typeof result === "bigint") {
                sqlite3_result_int64(ctx, result);
            } else if (typeof result === "string") {
                const buffer = new TextEncoder().encode(result);
                sqlite3_result_text(ctx, buffer, buffer.byteLength, 0);
            } else if (result instanceof Uint8Array) {
                sqlite3_result_blob(ctx, result, result.length, -1);
            } else {
                const buffer = new TextEncoder().encode(`Invalid return value: ${Deno.inspect(result)}`);
                sqlite3_result_error(ctx, buffer, buffer.byteLength);
            }
        });
        let flags = 1;
        if (options?.deterministic) {
            flags |= 0x000000800;
        }
        if (options?.directOnly) {
            flags |= 0x000080000;
        }
        if (options?.subtype) {
            flags |= 0x000100000;
        }
        if (options?.directOnly) {
            flags |= 0x000200000;
        }
        const err = sqlite3_create_function(this.#handle, toCString(name), options?.varargs ? -1 : options.step.length - 1, flags, null, null, cb.pointer, cbFinal.pointer);
        unwrap(err, this.#handle);
        this.#callbacks.add(cb);
        this.#callbacks.add(cbFinal);
    }
    loadExtension(file, entryPoint) {
        if (!this.enableLoadExtension) {
            throw new Error("Extension loading is not enabled");
        }
        const pzErrMsg = new Uint32Array(2);
        const result = sqlite3_load_extension(this.#handle, toCString(file), entryPoint ? toCString(entryPoint) : null, pzErrMsg);
        const pzErrPtr = Deno.UnsafePointer.create(pzErrMsg[0] + 2 ** 32 * pzErrMsg[1]);
        if (pzErrPtr !== null) {
            const pzErr = readCstr(pzErrPtr);
            sqlite3_free(pzErrPtr);
            throw new Error(pzErr);
        }
        unwrap(result, this.#handle);
    }
    close() {
        if (!this.#open) return;
        for (const [stmt, db] of STATEMENTS){
            if (db === this.#handle) {
                sqlite3_finalize1(stmt);
                STATEMENTS.delete(stmt);
            }
        }
        for (const cb of this.#callbacks){
            cb.close();
        }
        unwrap(sqlite3_close_v2(this.#handle));
        this.#open = false;
    }
    [Symbol.for("Deno.customInspect")]() {
        return `SQLite3.Database { path: ${this.path} }`;
    }
}
const controllers = new WeakMap();
const getController = (db)=>{
    let controller = controllers.get(db);
    if (!controller) {
        const shared = {
            commit: db.prepare("COMMIT"),
            rollback: db.prepare("ROLLBACK"),
            savepoint: db.prepare("SAVEPOINT `\t_bs3.\t`"),
            release: db.prepare("RELEASE `\t_bs3.\t`"),
            rollbackTo: db.prepare("ROLLBACK TO `\t_bs3.\t`")
        };
        controllers.set(db, controller = {
            default: Object.assign({
                begin: db.prepare("BEGIN")
            }, shared),
            deferred: Object.assign({
                begin: db.prepare("BEGIN DEFERRED")
            }, shared),
            immediate: Object.assign({
                begin: db.prepare("BEGIN IMMEDIATE")
            }, shared),
            exclusive: Object.assign({
                begin: db.prepare("BEGIN EXCLUSIVE")
            }, shared)
        });
    }
    return controller;
};
const wrapTransaction = (fn, db, { begin , commit , rollback , savepoint , release , rollbackTo  })=>function sqliteTransaction() {
        const { apply  } = Function.prototype;
        let before, after, undo;
        if (db.inTransaction) {
            before = savepoint;
            after = release;
            undo = rollbackTo;
        } else {
            before = begin;
            after = commit;
            undo = rollback;
        }
        before.run();
        try {
            const result = apply.call(fn, this, arguments);
            after.run();
            return result;
        } catch (ex) {
            if (!db.autocommit) {
                undo.run();
                if (undo !== rollback) after.run();
            }
            throw ex;
        }
    };
const osType2 = (()=>{
    const { Deno: Deno1  } = globalThis;
    if (typeof Deno1?.build?.os === "string") {
        return Deno1.build.os;
    }
    const { navigator: navigator1  } = globalThis;
    if (navigator1?.appVersion?.includes?.("Win")) {
        return "windows";
    }
    return "linux";
})();
const isWindows2 = osType2 === "windows";
const CHAR_FORWARD_SLASH2 = 47;
function assertPath2(path) {
    if (typeof path !== "string") {
        throw new TypeError(`Path must be a string. Received ${JSON.stringify(path)}`);
    }
}
function isPosixPathSeparator2(code) {
    return code === 47;
}
function isPathSeparator2(code) {
    return isPosixPathSeparator2(code) || code === 92;
}
function isWindowsDeviceRoot2(code) {
    return code >= 97 && code <= 122 || code >= 65 && code <= 90;
}
function normalizeString2(path, allowAboveRoot, separator, isPathSeparator) {
    let res = "";
    let lastSegmentLength = 0;
    let lastSlash = -1;
    let dots = 0;
    let code;
    for(let i = 0, len = path.length; i <= len; ++i){
        if (i < len) code = path.charCodeAt(i);
        else if (isPathSeparator(code)) break;
        else code = CHAR_FORWARD_SLASH2;
        if (isPathSeparator(code)) {
            if (lastSlash === i - 1 || dots === 1) {} else if (lastSlash !== i - 1 && dots === 2) {
                if (res.length < 2 || lastSegmentLength !== 2 || res.charCodeAt(res.length - 1) !== 46 || res.charCodeAt(res.length - 2) !== 46) {
                    if (res.length > 2) {
                        const lastSlashIndex = res.lastIndexOf(separator);
                        if (lastSlashIndex === -1) {
                            res = "";
                            lastSegmentLength = 0;
                        } else {
                            res = res.slice(0, lastSlashIndex);
                            lastSegmentLength = res.length - 1 - res.lastIndexOf(separator);
                        }
                        lastSlash = i;
                        dots = 0;
                        continue;
                    } else if (res.length === 2 || res.length === 1) {
                        res = "";
                        lastSegmentLength = 0;
                        lastSlash = i;
                        dots = 0;
                        continue;
                    }
                }
                if (allowAboveRoot) {
                    if (res.length > 0) res += `${separator}..`;
                    else res = "..";
                    lastSegmentLength = 2;
                }
            } else {
                if (res.length > 0) res += separator + path.slice(lastSlash + 1, i);
                else res = path.slice(lastSlash + 1, i);
                lastSegmentLength = i - lastSlash - 1;
            }
            lastSlash = i;
            dots = 0;
        } else if (code === 46 && dots !== -1) {
            ++dots;
        } else {
            dots = -1;
        }
    }
    return res;
}
function _format2(sep, pathObject) {
    const dir = pathObject.dir || pathObject.root;
    const base = pathObject.base || (pathObject.name || "") + (pathObject.ext || "");
    if (!dir) return base;
    if (base === sep) return dir;
    if (dir === pathObject.root) return dir + base;
    return dir + sep + base;
}
const WHITESPACE_ENCODINGS2 = {
    "\u0009": "%09",
    "\u000A": "%0A",
    "\u000B": "%0B",
    "\u000C": "%0C",
    "\u000D": "%0D",
    "\u0020": "%20"
};
function encodeWhitespace2(string) {
    return string.replaceAll(/[\s]/g, (c)=>{
        return WHITESPACE_ENCODINGS2[c] ?? c;
    });
}
function lastPathSegment1(path, isSep, start = 0) {
    let matchedNonSeparator = false;
    let end = path.length;
    for(let i = path.length - 1; i >= start; --i){
        if (isSep(path.charCodeAt(i))) {
            if (matchedNonSeparator) {
                start = i + 1;
                break;
            }
        } else if (!matchedNonSeparator) {
            matchedNonSeparator = true;
            end = i + 1;
        }
    }
    return path.slice(start, end);
}
function stripTrailingSeparators1(segment, isSep) {
    if (segment.length <= 1) {
        return segment;
    }
    let end = segment.length;
    for(let i = segment.length - 1; i > 0; i--){
        if (isSep(segment.charCodeAt(i))) {
            end = i;
        } else {
            break;
        }
    }
    return segment.slice(0, end);
}
function stripSuffix1(name, suffix) {
    if (suffix.length >= name.length) {
        return name;
    }
    const lenDiff = name.length - suffix.length;
    for(let i = suffix.length - 1; i >= 0; --i){
        if (name.charCodeAt(lenDiff + i) !== suffix.charCodeAt(i)) {
            return name;
        }
    }
    return name.slice(0, -suffix.length);
}
class DenoStdInternalError2 extends Error {
    constructor(message){
        super(message);
        this.name = "DenoStdInternalError";
    }
}
function assert2(expr, msg = "") {
    if (!expr) {
        throw new DenoStdInternalError2(msg);
    }
}
const sep6 = "\\";
const delimiter6 = ";";
function resolve6(...pathSegments) {
    let resolvedDevice = "";
    let resolvedTail = "";
    let resolvedAbsolute = false;
    for(let i = pathSegments.length - 1; i >= -1; i--){
        let path;
        const { Deno: Deno1  } = globalThis;
        if (i >= 0) {
            path = pathSegments[i];
        } else if (!resolvedDevice) {
            if (typeof Deno1?.cwd !== "function") {
                throw new TypeError("Resolved a drive-letter-less path without a CWD.");
            }
            path = Deno1.cwd();
        } else {
            if (typeof Deno1?.env?.get !== "function" || typeof Deno1?.cwd !== "function") {
                throw new TypeError("Resolved a relative path without a CWD.");
            }
            path = Deno1.cwd();
            if (path === undefined || path.slice(0, 3).toLowerCase() !== `${resolvedDevice.toLowerCase()}\\`) {
                path = `${resolvedDevice}\\`;
            }
        }
        assertPath2(path);
        const len = path.length;
        if (len === 0) continue;
        let rootEnd = 0;
        let device = "";
        let isAbsolute = false;
        const code = path.charCodeAt(0);
        if (len > 1) {
            if (isPathSeparator2(code)) {
                isAbsolute = true;
                if (isPathSeparator2(path.charCodeAt(1))) {
                    let j = 2;
                    let last = j;
                    for(; j < len; ++j){
                        if (isPathSeparator2(path.charCodeAt(j))) break;
                    }
                    if (j < len && j !== last) {
                        const firstPart = path.slice(last, j);
                        last = j;
                        for(; j < len; ++j){
                            if (!isPathSeparator2(path.charCodeAt(j))) break;
                        }
                        if (j < len && j !== last) {
                            last = j;
                            for(; j < len; ++j){
                                if (isPathSeparator2(path.charCodeAt(j))) break;
                            }
                            if (j === len) {
                                device = `\\\\${firstPart}\\${path.slice(last)}`;
                                rootEnd = j;
                            } else if (j !== last) {
                                device = `\\\\${firstPart}\\${path.slice(last, j)}`;
                                rootEnd = j;
                            }
                        }
                    }
                } else {
                    rootEnd = 1;
                }
            } else if (isWindowsDeviceRoot2(code)) {
                if (path.charCodeAt(1) === 58) {
                    device = path.slice(0, 2);
                    rootEnd = 2;
                    if (len > 2) {
                        if (isPathSeparator2(path.charCodeAt(2))) {
                            isAbsolute = true;
                            rootEnd = 3;
                        }
                    }
                }
            }
        } else if (isPathSeparator2(code)) {
            rootEnd = 1;
            isAbsolute = true;
        }
        if (device.length > 0 && resolvedDevice.length > 0 && device.toLowerCase() !== resolvedDevice.toLowerCase()) {
            continue;
        }
        if (resolvedDevice.length === 0 && device.length > 0) {
            resolvedDevice = device;
        }
        if (!resolvedAbsolute) {
            resolvedTail = `${path.slice(rootEnd)}\\${resolvedTail}`;
            resolvedAbsolute = isAbsolute;
        }
        if (resolvedAbsolute && resolvedDevice.length > 0) break;
    }
    resolvedTail = normalizeString2(resolvedTail, !resolvedAbsolute, "\\", isPathSeparator2);
    return resolvedDevice + (resolvedAbsolute ? "\\" : "") + resolvedTail || ".";
}
function normalize8(path) {
    assertPath2(path);
    const len = path.length;
    if (len === 0) return ".";
    let rootEnd = 0;
    let device;
    let isAbsolute = false;
    const code = path.charCodeAt(0);
    if (len > 1) {
        if (isPathSeparator2(code)) {
            isAbsolute = true;
            if (isPathSeparator2(path.charCodeAt(1))) {
                let j = 2;
                let last = j;
                for(; j < len; ++j){
                    if (isPathSeparator2(path.charCodeAt(j))) break;
                }
                if (j < len && j !== last) {
                    const firstPart = path.slice(last, j);
                    last = j;
                    for(; j < len; ++j){
                        if (!isPathSeparator2(path.charCodeAt(j))) break;
                    }
                    if (j < len && j !== last) {
                        last = j;
                        for(; j < len; ++j){
                            if (isPathSeparator2(path.charCodeAt(j))) break;
                        }
                        if (j === len) {
                            return `\\\\${firstPart}\\${path.slice(last)}\\`;
                        } else if (j !== last) {
                            device = `\\\\${firstPart}\\${path.slice(last, j)}`;
                            rootEnd = j;
                        }
                    }
                }
            } else {
                rootEnd = 1;
            }
        } else if (isWindowsDeviceRoot2(code)) {
            if (path.charCodeAt(1) === 58) {
                device = path.slice(0, 2);
                rootEnd = 2;
                if (len > 2) {
                    if (isPathSeparator2(path.charCodeAt(2))) {
                        isAbsolute = true;
                        rootEnd = 3;
                    }
                }
            }
        }
    } else if (isPathSeparator2(code)) {
        return "\\";
    }
    let tail;
    if (rootEnd < len) {
        tail = normalizeString2(path.slice(rootEnd), !isAbsolute, "\\", isPathSeparator2);
    } else {
        tail = "";
    }
    if (tail.length === 0 && !isAbsolute) tail = ".";
    if (tail.length > 0 && isPathSeparator2(path.charCodeAt(len - 1))) {
        tail += "\\";
    }
    if (device === undefined) {
        if (isAbsolute) {
            if (tail.length > 0) return `\\${tail}`;
            else return "\\";
        } else if (tail.length > 0) {
            return tail;
        } else {
            return "";
        }
    } else if (isAbsolute) {
        if (tail.length > 0) return `${device}\\${tail}`;
        else return `${device}\\`;
    } else if (tail.length > 0) {
        return device + tail;
    } else {
        return device;
    }
}
function isAbsolute6(path) {
    assertPath2(path);
    const len = path.length;
    if (len === 0) return false;
    const code = path.charCodeAt(0);
    if (isPathSeparator2(code)) {
        return true;
    } else if (isWindowsDeviceRoot2(code)) {
        if (len > 2 && path.charCodeAt(1) === 58) {
            if (isPathSeparator2(path.charCodeAt(2))) return true;
        }
    }
    return false;
}
function join8(...paths) {
    const pathsCount = paths.length;
    if (pathsCount === 0) return ".";
    let joined;
    let firstPart = null;
    for(let i = 0; i < pathsCount; ++i){
        const path = paths[i];
        assertPath2(path);
        if (path.length > 0) {
            if (joined === undefined) joined = firstPart = path;
            else joined += `\\${path}`;
        }
    }
    if (joined === undefined) return ".";
    let needsReplace = true;
    let slashCount = 0;
    assert2(firstPart != null);
    if (isPathSeparator2(firstPart.charCodeAt(0))) {
        ++slashCount;
        const firstLen = firstPart.length;
        if (firstLen > 1) {
            if (isPathSeparator2(firstPart.charCodeAt(1))) {
                ++slashCount;
                if (firstLen > 2) {
                    if (isPathSeparator2(firstPart.charCodeAt(2))) ++slashCount;
                    else {
                        needsReplace = false;
                    }
                }
            }
        }
    }
    if (needsReplace) {
        for(; slashCount < joined.length; ++slashCount){
            if (!isPathSeparator2(joined.charCodeAt(slashCount))) break;
        }
        if (slashCount >= 2) joined = `\\${joined.slice(slashCount)}`;
    }
    return normalize8(joined);
}
function relative6(from, to) {
    assertPath2(from);
    assertPath2(to);
    if (from === to) return "";
    const fromOrig = resolve6(from);
    const toOrig = resolve6(to);
    if (fromOrig === toOrig) return "";
    from = fromOrig.toLowerCase();
    to = toOrig.toLowerCase();
    if (from === to) return "";
    let fromStart = 0;
    let fromEnd = from.length;
    for(; fromStart < fromEnd; ++fromStart){
        if (from.charCodeAt(fromStart) !== 92) break;
    }
    for(; fromEnd - 1 > fromStart; --fromEnd){
        if (from.charCodeAt(fromEnd - 1) !== 92) break;
    }
    const fromLen = fromEnd - fromStart;
    let toStart = 0;
    let toEnd = to.length;
    for(; toStart < toEnd; ++toStart){
        if (to.charCodeAt(toStart) !== 92) break;
    }
    for(; toEnd - 1 > toStart; --toEnd){
        if (to.charCodeAt(toEnd - 1) !== 92) break;
    }
    const toLen = toEnd - toStart;
    const length = fromLen < toLen ? fromLen : toLen;
    let lastCommonSep = -1;
    let i = 0;
    for(; i <= length; ++i){
        if (i === length) {
            if (toLen > length) {
                if (to.charCodeAt(toStart + i) === 92) {
                    return toOrig.slice(toStart + i + 1);
                } else if (i === 2) {
                    return toOrig.slice(toStart + i);
                }
            }
            if (fromLen > length) {
                if (from.charCodeAt(fromStart + i) === 92) {
                    lastCommonSep = i;
                } else if (i === 2) {
                    lastCommonSep = 3;
                }
            }
            break;
        }
        const fromCode = from.charCodeAt(fromStart + i);
        const toCode = to.charCodeAt(toStart + i);
        if (fromCode !== toCode) break;
        else if (fromCode === 92) lastCommonSep = i;
    }
    if (i !== length && lastCommonSep === -1) {
        return toOrig;
    }
    let out = "";
    if (lastCommonSep === -1) lastCommonSep = 0;
    for(i = fromStart + lastCommonSep + 1; i <= fromEnd; ++i){
        if (i === fromEnd || from.charCodeAt(i) === 92) {
            if (out.length === 0) out += "..";
            else out += "\\..";
        }
    }
    if (out.length > 0) {
        return out + toOrig.slice(toStart + lastCommonSep, toEnd);
    } else {
        toStart += lastCommonSep;
        if (toOrig.charCodeAt(toStart) === 92) ++toStart;
        return toOrig.slice(toStart, toEnd);
    }
}
function toNamespacedPath6(path) {
    if (typeof path !== "string") return path;
    if (path.length === 0) return "";
    const resolvedPath = resolve6(path);
    if (resolvedPath.length >= 3) {
        if (resolvedPath.charCodeAt(0) === 92) {
            if (resolvedPath.charCodeAt(1) === 92) {
                const code = resolvedPath.charCodeAt(2);
                if (code !== 63 && code !== 46) {
                    return `\\\\?\\UNC\\${resolvedPath.slice(2)}`;
                }
            }
        } else if (isWindowsDeviceRoot2(resolvedPath.charCodeAt(0))) {
            if (resolvedPath.charCodeAt(1) === 58 && resolvedPath.charCodeAt(2) === 92) {
                return `\\\\?\\${resolvedPath}`;
            }
        }
    }
    return path;
}
function dirname6(path) {
    assertPath2(path);
    const len = path.length;
    if (len === 0) return ".";
    let rootEnd = -1;
    let end = -1;
    let matchedSlash = true;
    let offset = 0;
    const code = path.charCodeAt(0);
    if (len > 1) {
        if (isPathSeparator2(code)) {
            rootEnd = offset = 1;
            if (isPathSeparator2(path.charCodeAt(1))) {
                let j = 2;
                let last = j;
                for(; j < len; ++j){
                    if (isPathSeparator2(path.charCodeAt(j))) break;
                }
                if (j < len && j !== last) {
                    last = j;
                    for(; j < len; ++j){
                        if (!isPathSeparator2(path.charCodeAt(j))) break;
                    }
                    if (j < len && j !== last) {
                        last = j;
                        for(; j < len; ++j){
                            if (isPathSeparator2(path.charCodeAt(j))) break;
                        }
                        if (j === len) {
                            return path;
                        }
                        if (j !== last) {
                            rootEnd = offset = j + 1;
                        }
                    }
                }
            }
        } else if (isWindowsDeviceRoot2(code)) {
            if (path.charCodeAt(1) === 58) {
                rootEnd = offset = 2;
                if (len > 2) {
                    if (isPathSeparator2(path.charCodeAt(2))) rootEnd = offset = 3;
                }
            }
        }
    } else if (isPathSeparator2(code)) {
        return path;
    }
    for(let i = len - 1; i >= offset; --i){
        if (isPathSeparator2(path.charCodeAt(i))) {
            if (!matchedSlash) {
                end = i;
                break;
            }
        } else {
            matchedSlash = false;
        }
    }
    if (end === -1) {
        if (rootEnd === -1) return ".";
        else end = rootEnd;
    }
    return stripTrailingSeparators1(path.slice(0, end), isPosixPathSeparator2);
}
function basename6(path, suffix = "") {
    assertPath2(path);
    if (path.length === 0) return path;
    if (typeof suffix !== "string") {
        throw new TypeError(`Suffix must be a string. Received ${JSON.stringify(suffix)}`);
    }
    let start = 0;
    if (path.length >= 2) {
        const drive = path.charCodeAt(0);
        if (isWindowsDeviceRoot2(drive)) {
            if (path.charCodeAt(1) === 58) start = 2;
        }
    }
    const lastSegment = lastPathSegment1(path, isPathSeparator2, start);
    const strippedSegment = stripTrailingSeparators1(lastSegment, isPathSeparator2);
    return suffix ? stripSuffix1(strippedSegment, suffix) : strippedSegment;
}
function extname6(path) {
    assertPath2(path);
    let start = 0;
    let startDot = -1;
    let startPart = 0;
    let end = -1;
    let matchedSlash = true;
    let preDotState = 0;
    if (path.length >= 2 && path.charCodeAt(1) === 58 && isWindowsDeviceRoot2(path.charCodeAt(0))) {
        start = startPart = 2;
    }
    for(let i = path.length - 1; i >= start; --i){
        const code = path.charCodeAt(i);
        if (isPathSeparator2(code)) {
            if (!matchedSlash) {
                startPart = i + 1;
                break;
            }
            continue;
        }
        if (end === -1) {
            matchedSlash = false;
            end = i + 1;
        }
        if (code === 46) {
            if (startDot === -1) startDot = i;
            else if (preDotState !== 1) preDotState = 1;
        } else if (startDot !== -1) {
            preDotState = -1;
        }
    }
    if (startDot === -1 || end === -1 || preDotState === 0 || preDotState === 1 && startDot === end - 1 && startDot === startPart + 1) {
        return "";
    }
    return path.slice(startDot, end);
}
function format6(pathObject) {
    if (pathObject === null || typeof pathObject !== "object") {
        throw new TypeError(`The "pathObject" argument must be of type Object. Received type ${typeof pathObject}`);
    }
    return _format2("\\", pathObject);
}
function parse6(path) {
    assertPath2(path);
    const ret = {
        root: "",
        dir: "",
        base: "",
        ext: "",
        name: ""
    };
    const len = path.length;
    if (len === 0) return ret;
    let rootEnd = 0;
    let code = path.charCodeAt(0);
    if (len > 1) {
        if (isPathSeparator2(code)) {
            rootEnd = 1;
            if (isPathSeparator2(path.charCodeAt(1))) {
                let j = 2;
                let last = j;
                for(; j < len; ++j){
                    if (isPathSeparator2(path.charCodeAt(j))) break;
                }
                if (j < len && j !== last) {
                    last = j;
                    for(; j < len; ++j){
                        if (!isPathSeparator2(path.charCodeAt(j))) break;
                    }
                    if (j < len && j !== last) {
                        last = j;
                        for(; j < len; ++j){
                            if (isPathSeparator2(path.charCodeAt(j))) break;
                        }
                        if (j === len) {
                            rootEnd = j;
                        } else if (j !== last) {
                            rootEnd = j + 1;
                        }
                    }
                }
            }
        } else if (isWindowsDeviceRoot2(code)) {
            if (path.charCodeAt(1) === 58) {
                rootEnd = 2;
                if (len > 2) {
                    if (isPathSeparator2(path.charCodeAt(2))) {
                        if (len === 3) {
                            ret.root = ret.dir = path;
                            ret.base = "\\";
                            return ret;
                        }
                        rootEnd = 3;
                    }
                } else {
                    ret.root = ret.dir = path;
                    return ret;
                }
            }
        }
    } else if (isPathSeparator2(code)) {
        ret.root = ret.dir = path;
        ret.base = "\\";
        return ret;
    }
    if (rootEnd > 0) ret.root = path.slice(0, rootEnd);
    let startDot = -1;
    let startPart = rootEnd;
    let end = -1;
    let matchedSlash = true;
    let i = path.length - 1;
    let preDotState = 0;
    for(; i >= rootEnd; --i){
        code = path.charCodeAt(i);
        if (isPathSeparator2(code)) {
            if (!matchedSlash) {
                startPart = i + 1;
                break;
            }
            continue;
        }
        if (end === -1) {
            matchedSlash = false;
            end = i + 1;
        }
        if (code === 46) {
            if (startDot === -1) startDot = i;
            else if (preDotState !== 1) preDotState = 1;
        } else if (startDot !== -1) {
            preDotState = -1;
        }
    }
    if (startDot === -1 || end === -1 || preDotState === 0 || preDotState === 1 && startDot === end - 1 && startDot === startPart + 1) {
        if (end !== -1) {
            ret.base = ret.name = path.slice(startPart, end);
        }
    } else {
        ret.name = path.slice(startPart, startDot);
        ret.base = path.slice(startPart, end);
        ret.ext = path.slice(startDot, end);
    }
    ret.base = ret.base || "\\";
    if (startPart > 0 && startPart !== rootEnd) {
        ret.dir = path.slice(0, startPart - 1);
    } else ret.dir = ret.root;
    return ret;
}
function fromFileUrl6(url) {
    url = url instanceof URL ? url : new URL(url);
    if (url.protocol != "file:") {
        throw new TypeError("Must be a file URL.");
    }
    let path = decodeURIComponent(url.pathname.replace(/\//g, "\\").replace(/%(?![0-9A-Fa-f]{2})/g, "%25")).replace(/^\\*([A-Za-z]:)(\\|$)/, "$1\\");
    if (url.hostname != "") {
        path = `\\\\${url.hostname}${path}`;
    }
    return path;
}
function toFileUrl6(path) {
    if (!isAbsolute6(path)) {
        throw new TypeError("Must be an absolute path.");
    }
    const [, hostname, pathname] = path.match(/^(?:[/\\]{2}([^/\\]+)(?=[/\\](?:[^/\\]|$)))?(.*)/);
    const url = new URL("file:///");
    url.pathname = encodeWhitespace2(pathname.replace(/%/g, "%25"));
    if (hostname != null && hostname != "localhost") {
        url.hostname = hostname;
        if (!url.hostname) {
            throw new TypeError("Invalid hostname.");
        }
    }
    return url;
}
const mod4 = {
    sep: sep6,
    delimiter: delimiter6,
    resolve: resolve6,
    normalize: normalize8,
    isAbsolute: isAbsolute6,
    join: join8,
    relative: relative6,
    toNamespacedPath: toNamespacedPath6,
    dirname: dirname6,
    basename: basename6,
    extname: extname6,
    format: format6,
    parse: parse6,
    fromFileUrl: fromFileUrl6,
    toFileUrl: toFileUrl6
};
const sep7 = "/";
const delimiter7 = ":";
function resolve7(...pathSegments) {
    let resolvedPath = "";
    let resolvedAbsolute = false;
    for(let i = pathSegments.length - 1; i >= -1 && !resolvedAbsolute; i--){
        let path;
        if (i >= 0) path = pathSegments[i];
        else {
            const { Deno: Deno1  } = globalThis;
            if (typeof Deno1?.cwd !== "function") {
                throw new TypeError("Resolved a relative path without a CWD.");
            }
            path = Deno1.cwd();
        }
        assertPath2(path);
        if (path.length === 0) {
            continue;
        }
        resolvedPath = `${path}/${resolvedPath}`;
        resolvedAbsolute = isPosixPathSeparator2(path.charCodeAt(0));
    }
    resolvedPath = normalizeString2(resolvedPath, !resolvedAbsolute, "/", isPosixPathSeparator2);
    if (resolvedAbsolute) {
        if (resolvedPath.length > 0) return `/${resolvedPath}`;
        else return "/";
    } else if (resolvedPath.length > 0) return resolvedPath;
    else return ".";
}
function normalize9(path) {
    assertPath2(path);
    if (path.length === 0) return ".";
    const isAbsolute = isPosixPathSeparator2(path.charCodeAt(0));
    const trailingSeparator = isPosixPathSeparator2(path.charCodeAt(path.length - 1));
    path = normalizeString2(path, !isAbsolute, "/", isPosixPathSeparator2);
    if (path.length === 0 && !isAbsolute) path = ".";
    if (path.length > 0 && trailingSeparator) path += "/";
    if (isAbsolute) return `/${path}`;
    return path;
}
function isAbsolute7(path) {
    assertPath2(path);
    return path.length > 0 && isPosixPathSeparator2(path.charCodeAt(0));
}
function join9(...paths) {
    if (paths.length === 0) return ".";
    let joined;
    for(let i = 0, len = paths.length; i < len; ++i){
        const path = paths[i];
        assertPath2(path);
        if (path.length > 0) {
            if (!joined) joined = path;
            else joined += `/${path}`;
        }
    }
    if (!joined) return ".";
    return normalize9(joined);
}
function relative7(from, to) {
    assertPath2(from);
    assertPath2(to);
    if (from === to) return "";
    from = resolve7(from);
    to = resolve7(to);
    if (from === to) return "";
    let fromStart = 1;
    const fromEnd = from.length;
    for(; fromStart < fromEnd; ++fromStart){
        if (!isPosixPathSeparator2(from.charCodeAt(fromStart))) break;
    }
    const fromLen = fromEnd - fromStart;
    let toStart = 1;
    const toEnd = to.length;
    for(; toStart < toEnd; ++toStart){
        if (!isPosixPathSeparator2(to.charCodeAt(toStart))) break;
    }
    const toLen = toEnd - toStart;
    const length = fromLen < toLen ? fromLen : toLen;
    let lastCommonSep = -1;
    let i = 0;
    for(; i <= length; ++i){
        if (i === length) {
            if (toLen > length) {
                if (isPosixPathSeparator2(to.charCodeAt(toStart + i))) {
                    return to.slice(toStart + i + 1);
                } else if (i === 0) {
                    return to.slice(toStart + i);
                }
            } else if (fromLen > length) {
                if (isPosixPathSeparator2(from.charCodeAt(fromStart + i))) {
                    lastCommonSep = i;
                } else if (i === 0) {
                    lastCommonSep = 0;
                }
            }
            break;
        }
        const fromCode = from.charCodeAt(fromStart + i);
        const toCode = to.charCodeAt(toStart + i);
        if (fromCode !== toCode) break;
        else if (isPosixPathSeparator2(fromCode)) lastCommonSep = i;
    }
    let out = "";
    for(i = fromStart + lastCommonSep + 1; i <= fromEnd; ++i){
        if (i === fromEnd || isPosixPathSeparator2(from.charCodeAt(i))) {
            if (out.length === 0) out += "..";
            else out += "/..";
        }
    }
    if (out.length > 0) return out + to.slice(toStart + lastCommonSep);
    else {
        toStart += lastCommonSep;
        if (isPosixPathSeparator2(to.charCodeAt(toStart))) ++toStart;
        return to.slice(toStart);
    }
}
function toNamespacedPath7(path) {
    return path;
}
function dirname7(path) {
    if (path.length === 0) return ".";
    let end = -1;
    let matchedNonSeparator = false;
    for(let i = path.length - 1; i >= 1; --i){
        if (isPosixPathSeparator2(path.charCodeAt(i))) {
            if (matchedNonSeparator) {
                end = i;
                break;
            }
        } else {
            matchedNonSeparator = true;
        }
    }
    if (end === -1) {
        return isPosixPathSeparator2(path.charCodeAt(0)) ? "/" : ".";
    }
    return stripTrailingSeparators1(path.slice(0, end), isPosixPathSeparator2);
}
function basename7(path, suffix = "") {
    assertPath2(path);
    if (path.length === 0) return path;
    if (typeof suffix !== "string") {
        throw new TypeError(`Suffix must be a string. Received ${JSON.stringify(suffix)}`);
    }
    const lastSegment = lastPathSegment1(path, isPosixPathSeparator2);
    const strippedSegment = stripTrailingSeparators1(lastSegment, isPosixPathSeparator2);
    return suffix ? stripSuffix1(strippedSegment, suffix) : strippedSegment;
}
function extname7(path) {
    assertPath2(path);
    let startDot = -1;
    let startPart = 0;
    let end = -1;
    let matchedSlash = true;
    let preDotState = 0;
    for(let i = path.length - 1; i >= 0; --i){
        const code = path.charCodeAt(i);
        if (isPosixPathSeparator2(code)) {
            if (!matchedSlash) {
                startPart = i + 1;
                break;
            }
            continue;
        }
        if (end === -1) {
            matchedSlash = false;
            end = i + 1;
        }
        if (code === 46) {
            if (startDot === -1) startDot = i;
            else if (preDotState !== 1) preDotState = 1;
        } else if (startDot !== -1) {
            preDotState = -1;
        }
    }
    if (startDot === -1 || end === -1 || preDotState === 0 || preDotState === 1 && startDot === end - 1 && startDot === startPart + 1) {
        return "";
    }
    return path.slice(startDot, end);
}
function format7(pathObject) {
    if (pathObject === null || typeof pathObject !== "object") {
        throw new TypeError(`The "pathObject" argument must be of type Object. Received type ${typeof pathObject}`);
    }
    return _format2("/", pathObject);
}
function parse7(path) {
    assertPath2(path);
    const ret = {
        root: "",
        dir: "",
        base: "",
        ext: "",
        name: ""
    };
    if (path.length === 0) return ret;
    const isAbsolute = isPosixPathSeparator2(path.charCodeAt(0));
    let start;
    if (isAbsolute) {
        ret.root = "/";
        start = 1;
    } else {
        start = 0;
    }
    let startDot = -1;
    let startPart = 0;
    let end = -1;
    let matchedSlash = true;
    let i = path.length - 1;
    let preDotState = 0;
    for(; i >= start; --i){
        const code = path.charCodeAt(i);
        if (isPosixPathSeparator2(code)) {
            if (!matchedSlash) {
                startPart = i + 1;
                break;
            }
            continue;
        }
        if (end === -1) {
            matchedSlash = false;
            end = i + 1;
        }
        if (code === 46) {
            if (startDot === -1) startDot = i;
            else if (preDotState !== 1) preDotState = 1;
        } else if (startDot !== -1) {
            preDotState = -1;
        }
    }
    if (startDot === -1 || end === -1 || preDotState === 0 || preDotState === 1 && startDot === end - 1 && startDot === startPart + 1) {
        if (end !== -1) {
            if (startPart === 0 && isAbsolute) {
                ret.base = ret.name = path.slice(1, end);
            } else {
                ret.base = ret.name = path.slice(startPart, end);
            }
        }
        ret.base = ret.base || "/";
    } else {
        if (startPart === 0 && isAbsolute) {
            ret.name = path.slice(1, startDot);
            ret.base = path.slice(1, end);
        } else {
            ret.name = path.slice(startPart, startDot);
            ret.base = path.slice(startPart, end);
        }
        ret.ext = path.slice(startDot, end);
    }
    if (startPart > 0) {
        ret.dir = stripTrailingSeparators1(path.slice(0, startPart - 1), isPosixPathSeparator2);
    } else if (isAbsolute) ret.dir = "/";
    return ret;
}
function fromFileUrl7(url) {
    url = url instanceof URL ? url : new URL(url);
    if (url.protocol != "file:") {
        throw new TypeError("Must be a file URL.");
    }
    return decodeURIComponent(url.pathname.replace(/%(?![0-9A-Fa-f]{2})/g, "%25"));
}
function toFileUrl7(path) {
    if (!isAbsolute7(path)) {
        throw new TypeError("Must be an absolute path.");
    }
    const url = new URL("file:///");
    url.pathname = encodeWhitespace2(path.replace(/%/g, "%25").replace(/\\/g, "%5C"));
    return url;
}
const mod5 = {
    sep: sep7,
    delimiter: delimiter7,
    resolve: resolve7,
    normalize: normalize9,
    isAbsolute: isAbsolute7,
    join: join9,
    relative: relative7,
    toNamespacedPath: toNamespacedPath7,
    dirname: dirname7,
    basename: basename7,
    extname: extname7,
    format: format7,
    parse: parse7,
    fromFileUrl: fromFileUrl7,
    toFileUrl: toFileUrl7
};
const path4 = isWindows2 ? mod4 : mod5;
const { join: join10 , normalize: normalize10  } = path4;
const path5 = isWindows2 ? mod4 : mod5;
const { basename: basename8 , delimiter: delimiter8 , dirname: dirname8 , extname: extname8 , format: format8 , fromFileUrl: fromFileUrl8 , isAbsolute: isAbsolute8 , join: join11 , normalize: normalize11 , parse: parse8 , relative: relative8 , resolve: resolve8 , sep: sep8 , toFileUrl: toFileUrl8 , toNamespacedPath: toNamespacedPath8  } = path5;
async function openDatabase(options) {
    const path = resolve8(Deno.cwd(), "./db/"), fileName = resolve8(path, "main.db");
    await Deno.mkdir(path, {
        recursive: true
    });
    const database = new Database(fileName, options);
    return database;
}
let level = "normal";
const log = (type, t)=>{
    if (type == "debug" && level != "debug") return;
    let fn;
    if (type === "log") fn = console.log;
    else if (type === "info") fn = console.info;
    else if (type === "error") fn = console.error;
    else if (type === "debug") fn = console.debug;
    else throw new Error("Invalid log type, cannot log: " + t);
    if (fn) {
        if (false) {
            fn(new Date().toLocaleString("sv-SE"), "Backend:", t);
        } else {
            fn(t);
        }
    }
};
const countries = [
    {
        name: "Sverige",
        id: "sv",
        cty: "Sweden (SE)",
        cta: "CTA|SE",
        interval: "PT60M",
        areas: [
            {
                name: "SE1",
                "id": "BZN|SE1",
                "long": "Norra Sverige",
                color: 1
            },
            {
                name: "SE2",
                "id": "BZN|SE2",
                "long": "Norra Mellansverige",
                color: 2
            },
            {
                name: "SE3",
                "id": "BZN|SE3",
                "long": "Södra Mellansverige",
                color: 3
            },
            {
                name: "SE4",
                "id": "BZN|SE4",
                "long": "Södra sverige",
                color: 4
            }
        ]
    },
    {
        name: "Norge",
        cty: "Norway (NO)",
        cta: "CTA|NO",
        interval: "PT60M",
        id: "no",
        areas: [
            {
                name: "NO1",
                "id": "IBA|NO1",
                "long": "Oslo",
                color: 1
            },
            {
                name: "NO2",
                "id": "IBA|NO2",
                "long": "Kristiansand",
                color: 2
            },
            {
                name: "NO3",
                "id": "IBA|NO3",
                "long": "Molde",
                color: 3
            },
            {
                name: "NO4",
                "id": "IBA|NO4",
                "long": "Tromsø",
                color: 4
            },
            {
                name: "NO5",
                "id": "IBA|NO5",
                "long": "Bergen",
                color: 5
            }
        ]
    },
    {
        name: "Finland",
        cty: "Finland (FI)",
        cta: "CTA|FI",
        interval: "PT60M",
        id: "fi",
        areas: [
            {
                name: "FI",
                "id": "FI",
                "long": "Suomi",
                color: 1
            }
        ]
    },
    {
        name: "Danmark",
        cty: "Denmark (DK)",
        cta: "CTA|DK",
        interval: "PT60M",
        id: "dk",
        areas: [
            {
                name: "DK1",
                "id": "IBA|DK1",
                "long": "Jylland",
                color: 1
            },
            {
                name: "DK2",
                "id": "IBA|DK2",
                "long": "Sjaelland",
                color: 2
            }
        ]
    },
    {
        name: "Deutschland",
        cty: "Germany (DE)",
        cta: "CTA|DE",
        interval: "PT15M",
        id: "de",
        areas: [
            {
                name: "DE-LU",
                "id": "BZN|DE-LU",
                "long": "Deutschland",
                color: 1
            }
        ]
    },
    {
        name: "Österreich",
        cty: "Austria (AT)",
        cta: "CTA|AT",
        interval: "PT15M",
        id: "at",
        areas: [
            {
                name: "AT",
                "id": "BZN|AT",
                "long": "Österreich",
                color: 1
            }
        ]
    },
    {
        name: "Switzerland",
        cty: "Switzerland (CH)",
        cta: "CTA|CH",
        interval: "PT60M",
        id: "ch",
        areas: [
            {
                name: "CH",
                "id": "BZN|CH",
                "long": "Switzerland",
                color: 1
            }
        ]
    },
    {
        name: "Spain",
        cty: "Spain (ES)",
        cta: "CTA|ES",
        interval: "PT60M",
        id: "es",
        areas: [
            {
                name: "ES",
                "id": "BZN|ES",
                "long": "Spain",
                color: 1
            }
        ]
    },
    {
        name: "France",
        cty: "France (FR)",
        cta: "CTA|FR",
        interval: "PT60M",
        id: "fr",
        areas: [
            {
                name: "FR",
                "id": "BZN|FR",
                "long": "France",
                color: 1
            }
        ]
    },
    {
        name: "Poland",
        cty: "Poland (PL)",
        cta: "CTA|PL",
        interval: "PT60M",
        id: "pl",
        areas: [
            {
                name: "PL",
                "id": "BZN|PL",
                "long": "Poland",
                color: 1
            }
        ]
    }
];
const sleep = (ms)=>new Promise((r)=>setTimeout(r, ms));
const database = await openDatabase({
    int64: true
});
const DailyOutageUpdate = async ()=>{
    log("info", `Scheduled data update started`);
    try {
        const dateStart = new Date(), dateEnd = new Date();
        dateStart.setDate(dateStart.getDate() - 30);
        dateEnd.setDate(dateEnd.getDate() + 30);
        const preparedQueryOutage = database.prepare(`INSERT INTO outage (
        mrid,
        revision,
        business_type,
        start_date,
        end_date,
        resource_name,
        location,
        country,
        psr_name,
        psr_nominal_power_unit,
        psr_nominal_power,
        psr_type,
        reason_code,
        reason_text) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?);`), preparedQueryOutageAvailability = database.prepare(`INSERT INTO outage_availability (
        mrid,
        start_date,
        end_date,
        quantity) VALUES (?,?,?,?);`), preparedQueryOutageDelete = database.prepare(`DELETE FROM outage WHERE mrid=(?);`), preparedQueryOutageAvailabilityDelete = database.prepare(`DELETE FROM outage_availability WHERE mrid=(?);`);
        for (const country of countries){
            try {
                log("info", `Getting outages for ${country.name}`);
                const dataPast = await EntsoeOutages(country.cta, dateStart, dateEnd);
                await sleep(3);
                log("info", `Got ${dataPast.length} outages.`);
                for (const dpEntry of [
                    ...dataPast
                ]){
                    preparedQueryOutageDelete.run(dpEntry.mRID);
                    preparedQueryOutageAvailabilityDelete.run(dpEntry.mRID);
                    preparedQueryOutage.run(dpEntry.mRID, dpEntry.revision, dpEntry.businessType, dpEntry.startDate?.getTime(), dpEntry.endDate?.getTime(), dpEntry.resourceName, dpEntry.location, country.id, dpEntry.psrName || "undefined", dpEntry.psrNominalPowerUnit, dpEntry.psrNominalPower, dpEntry.psrType, dpEntry.reasonCode, dpEntry.reasonText);
                    for (const apEntry of dpEntry.availablePeriodArray){
                        preparedQueryOutageAvailability.run(dpEntry.mRID, apEntry.start.getTime(), apEntry.end.getTime(), apEntry.quantity);
                    }
                    await sleep(1);
                }
            } catch (e) {
                log("error", `Error occured while updating outage data for '${country.name}', skipping. Error: ${e}`);
            }
            await sleep(3);
        }
    } catch (e) {
        log("error", `Error occured while updating data, skipping. Error: ${e}`);
    }
    log("info", `Scheduled data update done`);
    database.close();
};
DailyOutageUpdate();
