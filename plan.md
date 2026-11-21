# Förbättringsplan för spotweb 2

Prioriterad lista efter lanseringen av 2.0.1 (21 nov 2026). P1 bör göras först, P3 när det finns tid.
Varje punkt är tänkt att bli en egen PR.

## P1 – Driftsäkerhet och verifiering

1. **Testa ENTSO-e-parsningen mot riktiga svar.** Spara anonymiserade XML-svar från produktionen (A44 med 15-min-upplösning,
   A75, A65 och en zip med A77/A80) under `tests/fixtures/` och testa parsern mot dem. Testerna bygger i dag på exempel som
   skrivits för hand utifrån 1.x-klientens kod.
2. **Larm när data saknas.** Lägg till ett fält `healthy: true/false` i `/api/v2/status`, beräknat utifrån datans färskhet:
   imorgons priser ska finnas efter 14:00 CET och förbrukning och produktion ska vara högst 3 timmar gamla. Koppla en extern
   övervakare (t.ex. UptimeRobot eller Healthchecks) till det.
3. **Backoff vid 429 och 503 från ENTSO-e.** Vänta längre vid rate limiting i stället för att gå vidare till nästa område,
   och logga hur många förfrågningar som görs per körning.
4. **Städa releaser och taggar.** Ta bort den tomma releasen v2.0.0 och flytta `v1-final` till sista 1.x-commiten
   (`45f9513`).
5. **Beroendeuppdateringar.** Inför Dependabot (cargo och GitHub Actions), `cargo audit` eller `cargo deny` i CI, och lås
   actions till commit-SHA i `release.yml`, eftersom det jobbet har rätt att signera och publicera.

## P2 – Kvalitet och användbarhet

6. **Översätt de sidor som bara finns på engelska.** Custom, Hjälp och Home Assistant är hårdkodade på engelska. Flytta
   texterna till `locales/` (1.x var lika på den punkten, men 2.0 har stöd för det).
7. **Content-Security-Policy.** Ta bort de inline-skript som återstår (gtag-konfigurationen) och sätt en strikt CSP-header.
8. **Tillgänglighet.** Ge diagrammen textalternativ (tabellerna finns redan), synliga fokusmarkeringar i navigeringen och
   en kontrastgranskning.
9. **Villkorliga API-svar.** Skicka `ETag` och svara `304 Not Modified` på `/api/v2/spot` och `/api/v2/hass`. Det minskar
   trafiken från Home Assistant-installationer som frågar var tredje minut.
10. **Endpoint för billigaste perioder.** Lägg till `/api/v2/cheapest?area=SE3&hours=3` med samma logik som "billigaste
    3 timmarna" på områdessidan. Det är användbart för automationer i Home Assistant.

## P3 – Nya funktioner

11. **Fler elområden.** Nederländerna finns som språk men inte som land. Lägg också till Baltikum (EE, LV, LT) och
    eventuellt Italiens zoner. Det kräver bara poster i `src/countries.rs` och översättningar.
12. **Ljust tema.** Följ `prefers-color-scheme`, med ett val i inställningarna.
13. **Docker-image i GHCR.** Bygg för flera arkitekturer i release-flödet, signera med cosign och dokumentera i
    `docs/deployment.md`.
14. **Statistiksida.** Visa månadsvis medelpris per område för flera år i en tabell, och jämför spotpris med viktat
    månadspris.

## Klart i 2.0.x (för referens)

- En binär med inbyggd schemaläggare, SQLite med nycklar, import från 1.x
- Signerade releaser för Linux, macOS och Windows, CI på alla tre plattformarna
- Driftsatt på spot.56k.guru med version 2.0.1
