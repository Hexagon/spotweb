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
15. ✅ ~~**Beroenden och leveranskedja.** Dependabot (cargo och actions), `cargo audit`/`cargo deny` i CI, actions låsta
    till SHA i `release.yml`.~~ (#65)
16. ✅ ~~**Städa releaser och taggar.** Ta bort den tomma releasen v2.0.0 och flytta `v1-final` till `45f9513`.~~ Klart: v2.0.0 och
    `v1-final` är borttagna.
17. ✅ ~~**Översätt Custom, Hjälp och Home Assistant**, som i dag är på engelska.~~
18. ✅ ~~**Content-Security-Policy och tillgänglighet.** Ta bort de inline-skript som återstår, sätt en CSP-header och ge
    diagrammen textalternativ.~~
19. ✅ ~~**ETag/304 i API:t.** Det minskar trafiken från Home Assistant-installationer som frågar var tredje minut.~~

24. ✅ ~~**Byt chrono/chrono-tz mot jiff.** RustSec markerar båda som ounderhållna (RUSTSEC-2026-0543/0555, inga kända
    sårbarheter). Undantagna i `deny.toml` tills bytet är gjort.~~

## P3 – Nya funktioner

20. ✅ ~~**`/api/v2/cheapest?area=SE3&hours=3`** för automationer.~~
21. ✅ ~~**Fler elområden:** Nederländerna (finns redan som språk) och Baltikum (EE, LV, LT).~~ Klart i #47.
22. ✅ ~~**Ljust tema** som följer `prefers-color-scheme`.~~
23. ✅ ~~**Docker-image i GHCR**, signerad med cosign.~~ (#65)

## Nya punkter efter 2.2.0 (genomgång 21 nov 2026)

Alla punkter med PR (#58–#65) är sammanslagna (22 nov). Kvar: 11 (kräver riktiga svar från produktionen) och 42
(större ändring, se även punkt 46).

Bygget, clippy och de 72 testerna är gröna. Punkterna nedan kommer från en genomgång av koden.

### P1 – Fel och risker

25. ✅ (#60) **Webpulse-skriptet är hårdkodat för alla installationer.** `templates/base.html` laddar alltid
    `track.webpulseanalytics.com/client/653eb4…`, oavsett konfiguration. Den som kör en egen spotweb skickar alltså
    besöksdata till spot.56k.gurus konto. Åtgärd: `SPOTWEB_WEBPULSE_ID` som `SPOTWEB_GA_ID`, utan skriptet när den
    saknas. Dokumentera variabeln i `deploy/spotweb.env.example`.
26. ✅ (#63) **Avbrutna jobb står som `running`.** Körningarna startas med `tokio::spawn` och avbryts när processen stängs
    (omstart, driftsättning). Raden i `job_run` får aldrig `finished`, och `/api/v2/status` visar `running` tills
    jobbet körs nästa gång. För avbrottsjobbet (08:05) kan det dröja ett dygn. Åtgärd: markera rader utan `finished`
    som `interrupted` när servern startar, och låt avstängningen vänta en kort stund på pågående jobb.
27. ✅ (#62) **Avbrott: återkallade dokument och flera TimeSeries.** `parse_unavailability` läser inte `docStatus`, så avbrott
    som ENTSO-e har återkallat (A13) eller avbokat (A09) kan visas som pågående. Dessutom får varje TimeSeries i ett
    dokument samma `mrid`. `replace_outages` hoppar därför över alla utom den första, eftersom revisionen redan är
    sparad. Sidbläddringen slutar också tyst efter 10 sidor (2 000 dokument). Åtgärd: filtrera eller markera på
    `docStatus`, lägg till TimeSeries-index i nyckeln (ny migration), och logga en varning när sidgränsen nås.
28. ✅ (#62) **Gamla avbrott rensas aldrig.** `outage` och `outage_availability` växer för alltid, medan `job_run` rensas
    efter 30 dagar. Åtgärd: ta bort avbrott som slutade för mer än cirka 90 dagar sedan, i samma transaktion som
    `replace_outages`.
29. ✅ (#63) **`panic = "abort"` i release.** En panik i en enda request (t.ex. en `expect` i `pages.rs` eller ett oväntat
    kantfall i jiff/minijinja) tar ner hela processen, med pågående jobb. Systemd startar om, men det ger avbrott och
    leder till punkt 26. Åtgärd: byt till `unwind` (binären blir lite större). Tokio och axum fångar då paniken per
    request och task.

### P2 – Prestanda och drift

30. ✅ (#58) **Ingen gemensam laddning i cachen.** `Cache::get_or_load` släpper låset medan frågan körs. När en nyckel går ut
    kör därför alla samtidiga anrop samma fråga (t.ex. när många flikar laddas om på hel timme). Dessutom tömmer
    `MAX_ENTRIES_PER_REALM` hela realmen när den är full, så en crawler med många olika datumintervall tömmer cachen
    för alla. Åtgärd: en delad laddning per nyckel (`tokio::sync::OnceCell` eller en `Shared`-future), och ta bort de
    äldsta posterna i stället för att tömma allt.
31. ✅ (#61) **Ingen begränsning av anrop till API:t.** Varken spotweb eller exemplen för nginx och Caddy begränsar antalet anrop
    per klient. Åtgärd: `limit_req` i `deploy/nginx/spotweb.conf` och `rate_limit` (plugin) eller en kommentar i
    Caddyfile. Alternativt en enkel token bucket per IP i spotweb för `/api/`, som svarar 429.
32. ✅ (#64) **ApexCharts (540 kB, cirka 150 kB komprimerat) laddas på varje sida**, även där inga diagram ritas (Hjälp,
    Home Assistant, 404). Version 3.54.1 är vendrad och följs inte av Dependabot. Åtgärd: ladda biblioteket bara på
    sidor med diagram, gärna först när diagrammet syns. Lägg till en notering eller ett skript för att uppdatera det.
33. ✅ (#64) **Statiska filer cachas med `?v={version}`.** Två driftsättningar med samma version ger gammal `app.js` och
    `spotweb.css` i upp till en vecka (`max-age=604800`). Åtgärd: använd filens hash (finns redan i rust-embed för
    ETag) som `?v=`, och sätt `immutable` på `/assets/`.
34. ✅ (#65) **musl-binärerna använder musl:s malloc**, som är känd för att vara långsam med många trådar. Det gäller både
    release och Docker-imagen. Åtgärd: mimalloc som global allokator, åtminstone för musl-målen. Mät minne och
    svarstider före och efter.
35. ✅ (#59) **Backupen kontrolleras inte.** `backup_to` skriver en kopia men läser den aldrig. Åtgärd: kör
    `PRAGMA quick_check` på den okomprimerade kopian innan den komprimeras eller döps om, och låt tjänsten misslyckas
    om kontrollen inte går igenom. Lägg gärna till ett återläsningstest i dokumentationen.
36. ✅ (#60) **Varning när `SPOTWEB_PUBLIC_URL` saknas.** Då byggs canonical, Open Graph, sitemap och robots från
    `Host` och `X-Forwarded-Proto` i anropet. Det är escapat, men en felkonfigurerad proxy ger fel adresser i
    sökmotorerna. Åtgärd: logga en varning vid start, som för `API_TOKEN`.
37. ✅ (#65) **Docker-bygget cachar inte beroenden.** `COPY . .` före `cargo build` gör att varje kodändring bygger om alla
    crates. Åtgärd: bygg beroendena i ett eget lager, eller använd `--mount=type=cache` för `~/.cargo` och `target`.
    Hör ihop med punkt 23.

### P3 – Kvalitet och små förbättringar

38. ✅ (#64) **Misslyckade API-anrop i klienten cachas för alltid.** `fetchSpot` i `app.js` sparar promisen, även när den
    misslyckas. Ett tillfälligt nätverksfel ger tomma diagram tills sidan laddas om. Åtgärd: ta bort posten ur
    `apiCache` när anropet misslyckas.
39. ✅ (#59) **Okänt elområde i `/api/v2/spot` svarar `ok` med tom data.** Ett stavfel (`area=SE5`) går inte att skilja från
    data som saknas. Åtgärd: svara `"Unknown area"` som för okänd valuta. Kontrollera först att 1.x inte accepterade
    andra namn.
40. ✅ (#60) **Odokumenterade variabler.** `SPOTWEB_NO_SCHEDULER`, `SPOTWEB_ENTSOE_ENDPOINT`, `SPOTWEB_ECB_ENDPOINT` och
    `SPOTWEB_API_TOKEN` (alias för `API_TOKEN`) nämns inte i README eller `docs/deployment.md`.
41. ✅ (#59) **Timeout-svaret är 408.** `TimeoutLayer` svarar `408 Request Timeout` när servern är långsam, men 408 betyder att
    klienten var för långsam. Proxyer och klienter kan då göra om anropet automatiskt. Åtgärd: 503 eller 504.
42. ✅ ~~**Timvis omladdning av hela sidan.** Klienten laddar om sidan varje hel timme för att få ny data. Det ger ny
    sidvisning, laddar om annonserna och ritar om allt. Åtgärd (större): hämta bara ny boot-data som JSON och rita om.~~
    Klart (variant): en timer vid varje kvartsgräns flyttar fram priset nu, nu-linjen i diagrammen, pristabellen och
    kartan med data som sidan redan har (idag och imorgon per område, inte bara de närmaste två timmarna). Ny data
    hämtas genom att klienten hämtar sidan själv med `fetch` och byter boot-JSON:en och de serverrenderade delarna
    som är märkta `data-live` (statistiken i områdeskorten, produktionskortet och tabellen på startsidan). Det sker
    1–3 minuter efter varje hel timme, vid nytt dygn, och högst en gång per kvart när priset för aktuellt intervall
    saknas eller när morgondagens priser väntas (12:45–20:00 svensk tid). Ingen omladdning, så annonser, analys och
    scrollläge lämnas i fred. Dolda flikar uppdateras när de visas igen.

## Nya punkter: karta, elområdessidan och mer data (genomgång 22 nov 2026)

Genomgången gällde vad besökare kan tycka är intressant men inte ser, vad som kan visas bättre, och vad som saknas från
ENTSO-e. I dag hämtas priser (A44), faktisk produktion (A75), faktisk förbrukning (A65/A16), fysiska flöden (A11) och
avbrott (A77/A80). Ordningen nedan är förslaget till ordning för PR:erna. Punkt 43–46 bygger på data som redan finns.

### P1 – Snabba vinster med data som redan finns

43. ✅ **Import/export på elområdessidan och landssidan.** Kartpanelen visar flöde per granne, men inte `/sv/SE3`. Tabellen
    `flow` sparar redan historik per gräns och riktning, men bara det senaste värdet används (`flows::latest`).
    Åtgärd:
    - Gör om panelens lista (`zonePanel` i `app.js`) till en delad funktion och visa den som kort på områdessidan:
      granne, riktning, MW och nettoimport.
    - Lägg till ett diagram för igår och idag, likt produktion och nettoproduktion: nettoflöde per granne som staplade
      ytor, med import under nollan och export över, plus en linje för summan.
    - Ny datafunktion `area_flows(area, from, to)` och `/api/v2/flows?area=SE3&start=…&end=…`, cachad som de andra.
    - På landssidan: flöden mot andra länder (gränser inom landet räknas inte), t.ex. Sveriges nettoexport till FI, NO,
      DK, DE, PL och LT.
    - Gärna en sparkline för nettoimporten de senaste 24 timmarna i kartpanelen.
44. ✅ **Tydligare riktning på pilarna.** I dag är alla pilar likadana och grå, och riktningen syns bara på spetsen. Åtgärd,
    i den här ordningen:
    - (a) *Övertoning.* En `linearGradient` per pil (`gradientUnits="userSpaceOnUse"`, från svans till spets) från cirka
      15 % till 100 % täckning, så att pilen "tonar in" i flödesriktningen. Den är statisk, billig och fungerar i alla
      webbläsare och för utskrift.
    - (b) *Diskret rörelse.* 2–3 korta ljusa streck som glider från svans till spets (`stroke-dasharray` och en CSS-animation
      av `stroke-dashoffset`), med fart efter MW, t.ex. 0,8–3 s per varv. För att det inte ska bli rörigt: animera bara
      pilarna för valt område och låt de andra vara statiska. Stäng av vid `prefers-reduced-motion` och när fliken är dold
      (`visibilitychange`). Ungefär 60 element, så det är inget prestandaproblem.
    - (c) *Färg efter valt område.* Import och export får samma färger som listan i panelen (`is-import`/`is-export`).
    - Tooltip på en pil: pris på båda sidor och skillnaden ("SE3 41 → SE4 98 öre, +57"). Det förklarar flaskhalsar,
      vilket ofta efterfrågas.
45. ✅ **Fri zoom, och etiketter som anpassar sig.** Kartan har två fasta vyer (Norden/Europa). `--k` räknas bara om när
    vyn byts eller fönstret ändrar storlek, och etiketterna ritas om helt. Åtgärd:
    - Zooma med hjulet (med Ctrl/⌘, eller när kartan har fokus, så att sidan fortfarande scrollar), med två fingrar
      på mobil och med dubbelklick, och panorera genom att dra. Begränsa till `map.full`. En knapp för att återställa
      vyn. Norden och Europa blir förinställningar som animeras som i dag.
    - Lägg varje etikett och pil i en `<g transform="translate(x y) scale(k)">`, så att bara `k` uppdateras per bildruta
      (rAF) i stället för att `mapRender` körs om.
    - Detaljnivå efter skärmytan per zon: utzoomat visas bara namnet, eller inget för små zoner (DK2, NO1/NO5,
      Baltikum, NL). Inzoomat visas namn och pris, och på riktigt nära håll även flödets MW på alla pilar. Enkel
      kollisionskontroll: rita etiketterna i ordning efter zonens storlek och hoppa över en etikett som skulle överlappa
      en som redan är ritad. Den valda zonens etikett visas alltid.
    - Fel att rätta samtidigt: grannetiketterna (GB, IT) skalas inte med `k` (`y: a[1] + 4` och fast teckenstorlek).
    - Tillgänglighet: `+`/`-`-knappar och piltangenter när kartan har fokus.
46. ✅ **Tidsreglage på kartan.** Sidopanelen visar fortfarande läget just nu, och omladdningen varje timme (punkt 42) är kvar. Priserna för idag och imorgon finns redan i boot-datan (`z.today`, `z.tomorrow`), så kartan
    kan visa valfri kvart eller timme utan nya anrop. Åtgärd: ett reglage under kartan (idag 00 till imorgon 24) med
    uppspelningsknapp. Färger, etiketter och färgskala följer vald tidpunkt, och "nu" markeras. Flöden finns bara bakåt i
    tiden: visa flödet för vald tidpunkt upp till nu (kräver `flows` per timme i boot eller ett anrop), och dölj pilarna
    för framtiden tills punkt 52 finns. Gör att man ser hur prisskillnaderna rör sig över dygnet, t.ex. kvällstopp i
    söder och jämna priser i norr. Hör ihop med punkt 42: när reglaget finns kan klienten hämta ny JSON varje timme i
    stället för att ladda om sidan.

### P2 – Bättre visning

47. ✅ **Färgskalan överdriver små skillnader.** Löst med minsta spännvidd (30 EUR/MWh), ingen valbar fast skala. Skalan går från lägsta till högsta pris just nu. När alla områden ligger
    mellan 30 och 33 öre ser kartan lika dramatisk ut som vid 5–300 öre. Åtgärd: en minsta spännvidd (eller en fast
    skala per valuta, som går att välja i inställningarna), egen färg för negativa priser, och en text i
    teckenförklaringen när alla priser är lika ("alla områden kopplade").
48. ✅ **Mer i kartpanelen.** Panelen är också kompaktare: pris nu, snitt idag och imorgon på en rad. Nu visas bara huvudkällan för produktionen. Åtgärd: produktionsmixen som en liten staplad
    stapel (vatten, kärnkraft, vind, sol, fossilt), den billigaste perioden idag och imorgon (samma logik som
    `/api/v2/cheapest`), och skillnaden mot igår eller samma dag förra veckan.
49. **Notiser om ovanliga priser.** (Ingår nu i nyhetsspalten, punkt 59, som dess första del.) En rad överst på startsidan och områdessidan när morgondagen har negativa priser,
    ovanligt höga toppar eller ett nytt rekord för månaden ("Negativa priser imorgon 11–15 i SE3"). Allt beräknas ur
    data som redan finns.

### P2 – Ny data från ENTSO-e

50. **Prognoser för imorgon:** förbrukningsprognos day-ahead (A65, processType A01) och vind- och solprognos (A69,
    processType A01), eventuellt även den totala produktionsprognosen (A71). Det är det som förklarar morgondagens
    priser: lite vind och hög förbrukning ger dyrt. Åtgärd: nytt jobb efter publiceringen (cirka 18:00 CET), nya
    tabeller, och ett diagram på områdessidan med morgondagens pris mot prognosen för vind+sol och förbrukning
    (residuallast). Ungefär 2–3 anrop per område och dygn.
51. ✅ Klart: jobbet `reservoirs` (10:35) hämtar A72 för alla elområden, de senaste 8 veckorna (ett anrop per
    område; områden utan magasin svarar "no data"), och första gången ett område har data hela historiken sedan 2015
    ett år per anrop. Tabellen `reservoir` (migration 6). Kort med diagram på områdes- och landssidan (landet är
    summan av områdena, bara veckor där alla har värden): lagrad energi i TWh, ändring sedan förra veckan, samma
    vecka i fjol, median och lägsta–högsta för veckan tidigare år, en mening om läget mot normalt, och veckokurvor
    för i år, i fjol, median och spridning. `/api/v2/reservoirs?area=NO2` eller `?country=no`, dokumenterat i
    README, på API-sidan och i `llms.txt`. ENTSO-e publicerar lagrad energi, inte fyllnadsgrad i procent, så
    andelen visas mot högsta sparade värde. Följ upp: vilka av våra områden som faktiskt svarar, och att veckorna
    hamnar rätt (ISO-vecka efter veckans mitt). Ursprunglig beskrivning:
    **Vattenmagasin (A72, veckovis)** för SE, NO och FI, per elområde där det finns: fyllnadsgrad mot samma vecka
    tidigare år (min, max, median). Det är troligen det mest efterfrågade i Norden när priserna stiger på hösten. Få
    anrop (en gång i veckan), liten tabell. Ett kort på lands- och områdessidan.
52. ✅ Klart (behöver kontrolleras mot riktiga svar): jobbet `schedules` (13:10 och 15:10) hämtar day-ahead
    scheduled commercial exchanges (A09, `contract_MarketAgreement.Type=A01`) och day-ahead-kapacitet (A61, A01)
    för båda riktningarna av alla gränser, idag och imorgon, och hoppar över det som redan är komplett. Tabellen
    `border_plan` (migration 7), rensas efter 90 dagar. Kartans tidsreglage visar planerat nettoflöde för tider
    efter nu (streckade pilar, "Planerat flöde (day-ahead)"), och verktygstipset på en pil visar planerat flöde,
    kapacitet, hur stor del som används och "Flaskhals" när priserna skiljer sig åt (minst 0,5 EUR/MWh).
    `/api/v2/flows?planned=true`. Följ upp i driften: vilka gränser som svarar på A09 och A61 efter införandet av
    flödesbaserad kapacitetsberäkning (Norden och Core har troligen ingen A61, då visas bara planerat flöde), och
    om A09 behöver `A05` (total) i stället för `A01` för någon gräns. Ursprunglig beskrivning:
    **Planerade flöden och kapacitet.** Kommersiella flöden day-ahead (A09) visar planerad import och export imorgon. Då
    fungerar import/export-vyn (punkt 43) och tidsreglaget (punkt 46) även framåt i tiden. Kapacitet per gräns (A61
    eller flödesbaserade parametrar där det gäller) visar om en gräns är full, alltså varför priserna skiljer sig.
    Kontrollera först vad som finns för Norden efter införandet av flödesbaserad kapacitetsberäkning (oktober 2024),
    eftersom NTC-dokumenten inte längre finns för alla gränser där.
53. ✅ Klart: `src/emissions.rs` räknar andel förnybart, andel fossilfritt (förnybart, kärnkraft, pumpkraft) och
    CO₂-intensitet per `psrType` (livscykelvärden, IPCC AR5-medianer, avrundade; avfall och övrigt räknas som varken
    eller, energilager räknas inte). Visas i kartpanelen, i produktionskortet på område och land med en förklaring,
    och som kartlager (Elpris, Förnybart, Fossilfritt, CO₂, Över-/underskott) med egna färgskalor och fasta
    skalor (0–100 %, 0–700 g/kWh). Lagren visar senast uppmätta produktion oavsett tidsreglaget, vilket står i
    teckenförklaringen. Valet sparas i webbläsaren. Ursprunglig beskrivning:
    **Härledda mått utan nya anrop:** andel förnybart och fossilfritt per område, och uppskattad CO₂-intensitet (g/kWh)
    med fasta emissionsfaktorer per `psr_group`. Visa tydligt att det gäller produktionen i området, inte förbrukningen
    med import. Det blir ett kartlager: pris, förnybart, CO₂ eller nettobalans (val i kartans huvud).
54. **Installerad effekt (A68, årligen) och kärnkraft tillgänglig.** Med installerad effekt kan utnyttjandet visas (t.ex.
    "vind 3,1 av 16 GW"). Avbrotten som redan hämtas räcker för en sammanfattning: "Kärnkraft: 5,9 av 7,0 GW
    tillgänglig, Forsmark 3 i revision".

### P3 – Drift och mindre

55. ✅ **`flow` växer utan gräns.** Löst med full upplösning i 90 dagar och timmedel därefter. Cirka 104 riktningar × 24–96 punkter per dygn. Bestäm hur länge historiken ska sparas
    innan punkt 43 och 46 börjar använda den: t.ex. full upplösning i 90 dagar och timmedel därefter, eller rensning som
    för avbrotten (punkt 28).
56. **Obalanspriser (A85) och reglerkraft**, för den som vill fördjupa sig. Nischat, men lätt att lägga till som eget
    kort när jobbinfrastrukturen ändå byggs ut för punkt 50.
57. **Spara kartan som bild**, för delning (PNG från SVG:n i klienten, med teckenförklaring och tidpunkt).
58. ✅ **Kompaktare huvud på mobil.** Under 800 px ligger Home Assistant, Tabell, Hjälp och Inställningar i en meny (⋯),
    så att toppraden blir en rad även på områdessidorna (kortare knappar, områdena rullar i sidled om de inte får plats).
    Kartans rubrik blir kortare ("Elpris just nu") och delar rad med Norden/Europa. Menyerna stängs vid klick utanför
    och med Escape.

**Förslag till ordning:** 44 (liten, syns direkt) → 43 → 45 → 46 → 47/48 → 53 → 50 → 51 → 52 → 54 → 49. Punkt 55 bör
avgöras innan 43 slås samman.

## Automatisk nyhetsspalt (plan 26 nov 2026)

Syftet är fler besökare: nytt, indexerbart innehåll varje dag med datum och elområde i rubriken (det folk söker på:
"negativa elpriser imorgon", "elpris rekord november", "vattenmagasin under normalt"), något att dela, och ett skäl att
komma tillbaka. Allt beräknas ur data som redan hämtas. Ingen text skrivs av en språkmodell: varje nyhet är en regel
som har slagit till, med siffror, och texten kommer från mallar i `locales/*.json`, så att den blir korrekt på alla
nio språk. Punkt 49 (notisraden) blir den första delen av det här.

59. **Nyhetsspalt.**
    - **Regler (detektorer)** som körs efter jobben och ger händelser med typ, område, datum, prioritet och siffror:
      | Regel | Källa | När den slår till (startvärden, justeras efter backtest) |
      | ----- | ----- | ------------------------------------------------------- |
      | Negativa priser imorgon | priser | minst en kvart under 0 i ett område; anger timmar och lägsta pris |
      | Pristopp imorgon | priser | dygnets högsta ≥ 2 × medianen av de senaste 30 dagarnas högsta, och över en fast nivå |
      | Rekord | priser sedan 2021 | högsta/lägsta dygnsmedel i månaden, året eller sedan 2021 för ett område |
      | Stor förändring | priser | morgondagens medel ±50 % mot idag och minst 20 EUR/MWh |
      | Norr–söder | priser, flöden (52) | stor prisskillnad inom ett land (SE1–SE4, NO), med gränsen som är flaskhals |
      | Samma pris överallt | priser | alla nordiska områden inom 0,5 EUR/MWh under större delen av dygnet |
      | Vattenmagasin | 51 | ny vecka: under lägsta/över högsta för veckan, eller långt från medianen; ändring mot förra veckan |
      | Kärnkraft | avbrott, (54) | oplanerat avbrott ≥ 400 MW börjar eller slutar; tillgänglig kärnkraft i ett land under en nivå |
      | Förnybart och CO₂ | 53 | rekordandel förnybart/fossilfritt eller ovanligt hög CO₂ för ett land |
      | Veckosammanfattning | alla | måndag morgon: förra veckans medelpris per område mot veckan innan, och veckans händelser |
    - **Gruppering och tak:** samma regel för flera områden samma dag blir en nyhet ("Negativa elpriser imorgon i SE3, SE4
      och DK1"). Varje händelse har en nyckel (regel, område/grupp, datum) och sparas bara en gång, men uppdateras om
      siffrorna ändras (till exempel när fler områden får negativa priser). Högst cirka 5 nyheter per dygn, efter prioritet.
    - **Lagring:** tabellen `news` (id, regel, nyckel unik, datum, skapad, uppdaterad, prioritet, områden och siffror som
      JSON). Ingen text sparas: rubrik och brödtext renderas när sidan visas, på besökarens språk och i dess valuta.
    - **Jobb:** `news` körs efter prisjobbet (13:30 och 14:15 för morgondagen), efter avbrotten (08:30), efter magasinen
      (onsdag–fredag) och måndag 07:00 för veckosammanfattningen. Det är idempotent och gör inga anrop till ENTSO-e.
    - **Var nyheterna syns:**
      - En rad överst på startsidan och på områdes- och landssidorna med de 1–3 viktigaste nyheterna för området (punkt 49).
      - Sidan `/news` (rubrik "Nyheter" på alla språk) med alla nyheter, filtrerbar per land, sidor per månad.
      - En egen sida per nyhet, `/news/2026-11-28-negativa-elpriser-se3`, med rubrik och beskrivning som innehåller datum
        och område, ett litet diagram, länk till områdessidan, `NewsArticle` i JSON-LD, canonical och Open Graph. Bara
        nyheter över en prioritetsgräns får en egen sida, så att det inte blir tunna sidor; de andra finns bara i listan.
      - RSS/Atom per språk (`/news.xml?lang=sv`), JSON i `/api/v2/news?area=SE3` (för Home Assistant och andra), och
        nyhetssidorna i `sitemap.xml` med `lastmod`.
      - Delningsknappen (finns redan) på varje nyhet. Senare: en bild för delning per nyhet (kartan eller diagrammet som
        PNG, renderad på servern), som hänger ihop med punkt 57.
    - **Språk:** en mall per regel och språk med platshållare, till exempel `news.negative_tomorrow`: "Negativa elpriser
      imorgon i {areas}: under noll {from}–{to}, lägst {min} {unit}". Siffror och datum formateras som på resten av
      sajten. Rubrikerna hålls korta och sakliga.
    - **Kvalitet:** tester per regel med konstruerad data, och `spotweb news --from 2025-01-01 --dry-run` som kör
      reglerna mot historiken och skriver ut vad som skulle ha blivit nyheter. Med det sätts gränserna så att det blir
      cirka 1–3 nyheter per dag i snitt och inga dagar med tio. Historiken kan också fylla arkivet bakåt vid lansering,
      vilket ger sidor att indexera direkt.
    - **Mät:** visningar och klick för `/news` i Search Console, och antal delningar per nyhet.
    - **Ordning för PR:erna:** (a) tabell, jobb och prisreglerna (negativa priser, topp, rekord, förändring) och raden
      på sidorna, alltså punkt 49; (b) `/news`, sidor per nyhet, RSS, API och sitemap; (c) reglerna för magasin,
      kärnkraft, förnybart/CO₂ och flaskhalsar; (d) veckosammanfattningen; (e) bilder för delning.

### Status 28 nov 2026 (2.8.0)

- ✅ (a) och (b) i en första version: tabellen `news` (migration 8), jobbet `news` (varje timme :10, efter varje
  prisjobb och vid start), reglerna för priser och sidorna `/news`, `/news/{land}`, `/news/{id}`, Atom-flöden,
  `/api/v2/news`, sitemap, nyhetsrutor på start-, lands- och områdessidorna, länk i menyn. Text på alla tolv språk.
- Skillnader mot planen ovan:
  - En rapport per område och dag (`day`) där rubriken väljer det mest anmärkningsvärda (negativa priser, rekord,
    stor förändring), i stället för en nyhet per regel. Gruppering av flera områden återstår.
  - Plus `europe` (billigast/dyrast per dag) och `month` (månadssammanfattning per område).
  - Rutinrapporter (prioritet 1) får en egen sida men `noindex, follow` och är inte med i sitemap.
  - **Globala nyheter och nyheter per land är skilda:** `/news` och startsidan visar bara nyheter utan land.
  - **Extern skribent:** nyheter kan laddas in lokalt på servern (`SPOTWEB_NEWS_BIND`, bara loopback), till exempel
    från en AI-agent. De visas bara på de språk de skickats med. Se `docs/news.md`.
- Återstår: gruppering av områden, reglerna i (c), veckosammanfattning (d), bilder för delning (e),
  `spotweb news --dry-run` mot historiken för att justera gränserna, och mätning i Search Console.

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

- Punkt 20: `/api/v2/cheapest?area=SE3&hours=3` ger den billigaste sammanhängande perioden (eller med
  `consecutive=false` de billigaste enskilda intervallen) från nu till slutet av imorgon, eller mellan `from` och
  `to` (högst 7 dagar). Svaret har `start`, `end`, tidsviktat snittpris, `windows`, intervallen i `data` och
  `active`, som är `true` medan ett av de valda intervallen pågår, så att en automation kan fråga och slå på efter
  det. `found: false` när priserna inte räcker ännu. Valfri `currency` och `interval`. Dokumenterat i README, på
  hjälpsidan (alla nio språk) och i `llms.txt`.
- Punkt 21: Nederländerna, Estland, Lettland och Litauen lades till i #47 (tillsammans med Tjeckien och Portugal).
- Punkt 22: ljust tema via `prefers-color-scheme`. Alla färger i CSS:en är variabler med ljusa värden i ett
  media-block, och app.js läser diagrammens och kartans färger (även prisskalan, som går från ljust till mörkt i
  det ljusa temat) från samma variabler och ritar om när systemets tema byts medan sidan är öppen. `theme-color`
  finns för båda temana. Inget manuellt val i inställningarna ännu.

- En binär med inbyggd schemaläggare, SQLite med nycklar, import från 1.x
- Signerade releaser för Linux, macOS och Windows, CI på alla tre plattformarna
- Driftsatt på spot.56k.guru med 2.0.1: 55 MB minne och under 2 % CPU de första 15 minuterna
