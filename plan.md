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
10. **Kallstart varje timme för översiktssidan.** Frågan `generation cur` tar cirka 1,6 s när cachenyckeln byts varje
    timme. Åtgärd: värm cachen direkt efter jobben för generation och load, och se över index för `generation (period)` i
    fönsterfrågan.
11. **Testa ENTSO-e-parsningen mot riktiga svar.** Spara XML-svar från produktionen (A44 med 15-min-upplösning, A75, A65
    och en zip med A77/A80) under `tests/fixtures/`.
12. **Larm när data saknas.** Lägg till `healthy: true/false` i `/api/v2/status`: imorgons priser ska finnas efter
    14:00 CET och load/generation ska vara högst 3 h gamla. Koppla en extern övervakare till det.

## P2 – Drift och kvalitet

13. **Statistik för HTTP-anrop.** Åtkomstlogg (avstängningsbar) eller sammanfattning per minut: antal anrop, svarstider
    (p50/p95) och 4xx/5xx per route. Kan också visas i `/api/v2/status`.
14. **Backup till en annan maskin.** Dokumentera ett exempel med restic eller rclone i `docs/deployment.md`, och lägg
    gärna till ett `ExecStartPost` i backuptjänsten.
15. **Beroenden och leveranskedja.** Dependabot (cargo och actions), `cargo audit`/`cargo deny` i CI, och actions låsta
    till SHA i `release.yml`.
16. **Städa releaser och taggar.** Ta bort den tomma releasen v2.0.0 och flytta `v1-final` till `45f9513`.
17. **Översätt Custom, Hjälp och Home Assistant**, som i dag är på engelska.
18. **Content-Security-Policy och tillgänglighet.** Ta bort de inline-skript som återstår, sätt en CSP-header och ge
    diagrammen textalternativ.
19. **ETag/304 i API:t.** Det minskar trafiken från Home Assistant-installationer som frågar var tredje minut.

## P3 – Nya funktioner

20. **`/api/v2/cheapest?area=SE3&hours=3`** för automationer.
21. **Fler elområden:** Nederländerna (finns redan som språk) och Baltikum (EE, LV, LT).
22. **Ljust tema** som följer `prefers-color-scheme`.
23. **Docker-image i GHCR**, signerad med cosign.

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

- En binär med inbyggd schemaläggare, SQLite med nycklar, import från 1.x
- Signerade releaser för Linux, macOS och Windows, CI på alla tre plattformarna
- Driftsatt på spot.56k.guru med 2.0.1: 55 MB minne och under 2 % CPU de första 15 minuterna
