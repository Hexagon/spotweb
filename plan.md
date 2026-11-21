# Förbättringsplan för spotweb 2

Prioriterad lista efter lanseringen av 2.0.1 (21 nov 2026). Den bygger på genomgång av koden och av de första
driftloggarna från spot.56k.guru. P0 är fel som påverkar data, P1 bör göras snart, P3 när det finns tid.
Varje punkt är tänkt att bli en egen PR.

## P0 – Fel

1. ✅ ~~**Dagens valutakurser hoppas över efter importen.**~~ 1.x sparade kursen med *hämtningsdatum* i `date`
   (21 nov för ECB:s kurs från 20 nov). 2.0 kontrollerar om ECB-datumet redan finns. Därför tror jobbet kl 16:20 att
   ECB:s kurs för 21 nov redan är sparad, och sajten räknar om med gårdagens kurs tills nästa bankdag. Det förklarar
   också varför statusen visar `exchange_rate_date: 2026-11-21` medan jobbet säger "rates for 2026-11-20 already stored".
   Åtgärd: kontrollera dubbletter på `period` (midnatt UTC för ECB-datumet) i stället för på `date`, och visa
   ECB-datumet i statusen.
2. ✅ ~~**Loggen har färgkoder i journalen.**~~ `^[[32m INFO^[[0m` gör `journalctl` och `grep` sämre. Åtgärd: stäng av ANSI när
   utskriften inte går till en terminal (`JOURNAL_STREAM` eller `!isatty`).
3. ✅ ~~**Unit-filen ger varningar på systemd < 247.**~~ `ProtectProc` och `ProcSubset` stöds inte på Ubuntu 20.04
   (systemd 245). Åtgärd: ta bort dem eller lägg dem i ett drop-in, och dokumentera vilken systemd-version som krävs.

## P1 – Prisjobbet

4. ✅ ~~**Hämta inte om kompletta dygn.**~~ Varje timme hämtas morgondagen igen för alla 20 områden, vilket ger 20 anrop och
   3,5–6,5 minuter även när allt redan finns. Åtgärd: hoppa över ett område när det senaste sparade intervallet täcker
   slutet av morgondagen. Hämta bara det som saknas.
5. ✅ ~~**Nya försök per område.**~~ Ett område som felar (t.ex. SE2 med HTTP 599) hämtas inte igen förrän nästa timme. Det
   spelar roll runt publiceringen 12:45–13:45. Åtgärd: 1–2 nya försök per område med kort väntan (10–30 s), och längre
   väntan vid 429/503.
6. ✅ ~~**Status för delvis lyckade körningar.**~~ Status visar `ok: true` och bara antalet fel. Åtgärd: lägg till ett tillstånd
   `partial` och en lista över de områden som felade, med orsak, i `job_run` och `/api/v2/status`.
7. ✅ ~~**Begränsad parallellitet och timeout per anrop.**~~ Anropen tar 18–28 s styck. Kör 2–3 samtidigt (ENTSO-e tillåter
   400 anrop/min) och sätt en timeout per anrop på cirka 60 s i stället för klientens 120 s.
8. ✅ ~~**Tydligare nätverksfel i loggen.**~~ HTTP 599 kommer från ENTSO-e:s gateway, inte från spotweb. Det är en
   icke-standardiserad statuskod för timeout uppströms. Logga den som "upstream timeout (599)" och skilj den från egna
   timeouts och anslutningsfel.

## P1 – Övriga jobb och prestanda

9. ✅ ~~**Förlopp i loggen för load och production.**~~ Logga per område på info-nivå (antal rader och tid), som prisjobbet gör,
   och en sammanfattning per körning.
10. ✅ ~~**Kallstart varje timme för översiktssidan.** Frågan `generation cur` tar cirka 1,6 s när cachenyckeln byts varje
    timme. Åtgärd: värm cachen direkt efter jobben för generation och load, och se över index för `generation (period)` i
    fönsterfrågan.~~
11. **Testa ENTSO-e-parsningen mot riktiga svar.** Spara XML-svar från produktionen (A44 med 15-min-upplösning, A75, A65
    och en zip med A77/A80) under `tests/fixtures/`.
12. ✅ ~~**Larm när data saknas.** Lägg till `healthy: true/false` i `/api/v2/status`: imorgons priser ska finnas efter
    14:00 CET och load/generation ska vara högst 3 h gamla. Koppla en extern övervakare till det.~~

## P2 – Drift och kvalitet

13. ✅ ~~**Statistik för HTTP-anrop.** Åtkomstlogg (avstängningsbar) eller sammanfattning per minut: antal anrop, svarstider
    (p50/p95) och 4xx/5xx per route. Kan också visas i `/api/v2/status`.~~
14. ✅ ~~**Backup till en annan maskin.** Dokumentera ett exempel med restic eller rclone i `docs/deployment.md`, och lägg
    gärna till ett `ExecStartPost` i backuptjänsten.~~
15. Delvis klart: ~~**Beroenden och leveranskedja.** Dependabot (cargo och actions), `cargo audit`/`cargo deny` i CI~~.
    Kvar: actions låsta till SHA i `release.yml` (SHA:erna behöver slås upp i respektive actions-repo).
16. **Städa releaser och taggar.** Ta bort den tomma releasen v2.0.0 och flytta `v1-final` till `45f9513`.
17. ✅ ~~**Översätt Custom, Hjälp och Home Assistant**, som i dag är på engelska.~~
18. ✅ ~~**Content-Security-Policy och tillgänglighet.** Ta bort de inline-skript som återstår, sätt en CSP-header och ge
    diagrammen textalternativ.~~
19. ✅ ~~**ETag/304 i API:t.** Det minskar trafiken från Home Assistant-installationer som frågar var tredje minut.~~

24. ✅ ~~**Byt chrono/chrono-tz mot jiff.** RustSec markerar båda som ounderhållna (RUSTSEC-2026-0543/0555, inga kända
    sårbarheter). Undantagna i `deny.toml` tills bytet är gjort.~~

## P3 – Nya funktioner

20. **`/api/v2/cheapest?area=SE3&hours=3`** för automationer.
21. **Fler elområden:** Nederländerna (finns redan som språk) och Baltikum (EE, LV, LT).
22. **Ljust tema** som följer `prefers-color-scheme`.
23. **Docker-image i GHCR**, signerad med cosign.

## Ny startsida

- ✅ Startsidan är en karta över elområdena med pris just nu (färgskala billigt–dyrt) och pilar för fysiskt nettoflöde
  mellan områdena. Klick på ett område visar en panel med pris nu, snitt idag/imorgon, diagram för idag och imorgon,
  produktion och förbrukning samt import/export per granne. Vyerna Norden och Europa; valt område sparas i
  webbläsaren och i adressen (`/#SE3`). Tabellen över alla elområden finns kvar under kartan.
- ✅ Nytt jobb `flows` (varje timme :25) hämtar ENTSO-e A11 för 52 gränser, båda riktningarna, till tabellen `flow`
  (migration 3). Nytt API `/api/v2/flows`, och `latest_flow` i `/api/v2/status`.
- Följ upp: att A11 svarar för alla gränser med zonkoderna som används (särskilt DE-LU, IT-Nord och GB), och jobbets
  körtid med 104 anrop.

## Att följa upp i driften

- Produktionsjobbet (:50) och avbrottsjobbet (08:05) hade inte körts när loggarna lästes.
- Publiceringen av priser runt 13:00 har inte observerats ännu. Kontrollera att morgondagens priser kommer inom
  12:45–13:45 för alla områden.
- Första nattliga backupen 03:26.

## Klart i 2.0.x

- Punkt 1–9 ovan (branch `ccr-5e82d998-flq6kz`): valutakursen kontrolleras på `period`, ingen ANSI i journalen,
  `ProtectProc`/`ProcSubset` i ett drop-in för systemd ≥ 247, prisjobbet hoppar över kompletta dygn, 2 nya försök per
  område (15 s, 60 s vid 429/503), status `partial` med `failures` i `job_run` och `/api/v2/status`, 3 samtidiga områden
  (`SPOTWEB_ENTSOE_CONCURRENCY`) och 60 s timeout per anrop (`SPOTWEB_ENTSOE_TIMEOUT_SECS`), 599 loggas som
  "upstream timeout", och alla ENTSO-e-jobb loggar per område och en sammanfattning med tid.

- Punkt 10: orsaken var att databasen saknade planerarstatistik (`sqlite_stat1`). Utan den skannar frågan hela
  `generation` och `load` (220 ms på 5 miljoner testrader, mot 7 ms med statistik). Nu körs `PRAGMA optimize` (med
  `analysis_limit`) när databasen öppnas och efter varje datajobb. Cachenyckeln för översikten byts inte längre varje
  timme, och jobben värmer cachen för översikt, priser och flöden direkt efter att de skrivit data. Migration 4 lägger
  till index på `load (period)`.
- Punkt 12: `healthy` och `problems` i `/api/v2/status`, och `/healthz/data` som svarar 503 när data saknas (för
  övervakare som bara ser statuskoden). Kraven: dagens priser för alla områden, efter 14:00 CET även morgondagens,
  och load/generation högst 3 h gamla.
- Delning: delningsknapp på kartpanelen (`/#SE3`), på varje elområdeskort på lands- och områdessidorna
  (`/sv/SE3`) och på resultatet i Custom (`/custom?period=…&area=…&startDate=…&endDate=…`). På mobil öppnas
  telefonens delningsmeny; på dator en meny med kopiera länk, e-post, WhatsApp, Facebook, X och LinkedIn (vanliga
  länkar, inga tredjepartsskript). Texten tar med aktuellt pris. Alla sidor har `rel=canonical` och Open Graph-taggar,
  utan språkparameter, så att mottagaren får sidan på sitt eget språk.
- Punkt 15: `cargo deny` (sårbarheter, licenser, källor) i CI vid push, PR och varje måndag, och Dependabot för cargo
  och actions. Första körningen hittade 9 sårbarheter: quick-xml 0.37 (två DoS, rättat i 0.41), zip 2.6 (sex, rättat i
  9.0.5) och den inbyggda SQLite-versionen (rättat i libsqlite3-sys 0.39). Uppgraderat till quick-xml 0.42, zip 9,
  rusqlite 0.42 och r2d2_sqlite 0.37. XML-parsern hanterar nu entiteter som egna händelser (ändrat i quick-xml 0.38),
  och zip-uppackningen har fått ett test. spotweb var i praktiken lite utsatt: zip används bara för att läsa svar i
  minnet och databasen skrivs bara av spotweb, men XML-felen gäller svar från ENTSO-e.
- Punkt 14: drop-ins för backuptjänsten som kopierar nattens backup med restic (7 dagliga, 4 veckovisa, 6 månatliga)
  eller speglar katalogen med rclone, plus instruktioner i `docs/deployment.md`.
- Punkt 19: svag `ETag` på alla lyckade GET under `/api/` och `304` vid `If-None-Match`. För `/api/v2/hass` räknas
  taggen utan `updated`, som annars ändras vid varje anrop. Home Assistants inbyggda REST-sensor skickar inte
  `If-None-Match`, så vinsten gäller främst egna integrationer och proxyer/CDN framför sajten.
- Punkt 13: statistik per route i minnet (antal, p50/p95 ur fasta tidsintervall, 4xx/5xx), sedan start och för
  senaste minuten, under `http` i `/api/v2/status`. En sammanfattning loggas varje minut
  (`SPOTWEB_HTTP_SUMMARY_SECS`, `0` stänger av) och `SPOTWEB_ACCESS_LOG=1` loggar varje anrop utan IP och query.
  Filer grupperas som `static` och okända sökvägar som `not found`, så att antalet routes inte växer. Felaktiga
  parametrar till API:t räknas som 5xx eftersom de svarar 500 som i 1.x.
- Punkt 17: Custom, Hjälp och Home Assistant (även sidtitlar, tabellrubriker och kopieringsknappar) på alla nio språk.
  Sidtexterna ligger under `pages` i `locales/*.json` och skickas inte med i sidornas boot-JSON, så sidorna blir inte
  tyngre. Texter med HTML (länkar, `<code>`) renderas som betrodda, eftersom de bara kommer från våra egna filer.
- Punkt 18: sidorna har en strikt CSP med nonce per svar och `'strict-dynamic'` (Googles rekommendation, som fungerar
  med AdSense, Analytics och Webpulse utan att lista deras värdar), `object-src 'none'`, `base-uri`, `form-action` och
  `frame-ancestors 'self'`. Det sista inline-skriptet (Google Analytics) ligger nu i `/assets/ga.js`. `SPOTWEB_CSP`
  (`on`, `report-only`, `off`). Diagrammen har `role="img"` och en `aria-label` med rubrik, lägsta–högsta värde och
  medel per serie, och knapparna Stäng/Tillbaka och huvudmenyn har översatta etiketter. Kontrollerat i Chromium utan
  CSP-fel; tredjepartsskripten kunde inte laddas härifrån, så titta i konsolen efter driftsättning.
- Punkt 24: all datum- och tidshantering använder jiff, med tidszonsdatabasen inbyggd i binären. tokio-cron-scheduler
  drog också in chrono och chrono-tz, så den är ersatt av en egen liten schemaläggare (fasta minuter/timmar per jobb i
  `SPOTWEB_SCHEDULE_TZ`). Den går minut för minut i verklig tid, så sommartid behöver inte längre hanteras genom att
  registrera om jobben. chrono finns inte kvar i beroendeträdet och undantagen i `deny.toml` är borttagna. Kontrollerat
  att gamla och nya binären ger identiska svar för 28 adresser (alla grupperingar, Portugal/Finland, sidor).

- En binär med inbyggd schemaläggare, SQLite med nycklar, import från 1.x
- Signerade releaser för Linux, macOS och Windows, CI på alla tre plattformarna
- Driftsatt på spot.56k.guru med 2.0.1: 55 MB minne och under 2 % CPU de första 15 minuterna
