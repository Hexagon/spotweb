const sv = {
  "common": {
    "page": {
      "title": "Elpriset just nu",
    },
    "months": {
      "0": "januari",
      "1": "februari",
      "2": "mars",
      "3": "april",
      "4": "maj",
      "5": "juni",
      "6": "juli",
      "7": "augusti",
      "8": "september",
      "9": "oktober",
      "10": "november",
      "11": "december",
    },
    "months_short": {
      "0": "jan",
      "1": "feb",
      "2": "mar",
      "3": "apr",
      "4": "maj",
      "5": "jun",
      "6": "jul",
      "7": "aug",
      "8": "sep",
      "9": "okt",
      "10": "nov",
      "11": "dec",
    },
    "header": {
      "title": "Aktuellt elpris, nu och historiskt",
      "avg_today": "Genomsnittligt spotpris idag",
      "avg_month": "Rörligt pris hittills i månaden",
      "avg_today_short": "Medelspotpris",
    },
    "warning": {
      "actual_price": "Faktiskt elpris",
      "actual_price_text":
        "Du har för närvarande faktiskt elpris aktiverat, men har inte gjort några inställningar för skatter och avgifter. Klicka på kugghjulet och fyll i Faktor (t.ex. 1.25 för 25% moms) och din avgift (t.ex. 0.095 för 9.5 öre/kWh innan moms).",
    },
    "information": {
      "title": "Information och användningsvillkor",
      "all_history": "All statistik hämtas från",
      "currency_fetched_from": "Aktuell valutakurs hämtas från",
      "all_values_from": "Alla värden, inklusive historiska, är konverterade från EUR med aktuell kurs",
      "disclaimer_and_private_use":
        "Siffrorna som visas bör stämma med verkligheten, men levereras utan garantier. Sidan och tillhörande tjänster tillhandahålls för privat bruk, på egen risk.",
      "open_source_software": "Källkoden till sidan är helt öppen och finns tillgänglig på ",
      "bugs_and_issues": "Buggar och problem rapporteras genom 'Issues' på GitHub. Kontakt kan även ske via mail till hexagon{a}56k.guru.",
    },
    "overview": {
      "thirty_day_chart": "30 dagars historik",
      "all_areas_today": "Alla elområden - Idag",
      "all_areas_tomorrow": "Alla elområden - Imorgon",
      "average_today": "Snitt idag",
      "average_tomorrow": "imorgon",
      "right_now": "just nu",
      "more_about": "Mer om",
      "span": "Spann:",
      "so_far": "Hittills i",
    },
    "nav": {
      "actual_price_instead": "Faktiskt timpris i stället för spotpris",
      "all_of": "Hela",
      "index": "Översikt",
      "table": "Tabell",
      "country": "Land",
      "area": "Elområde",
      "help": "Hjälp",
    },
    "customize": {
      "title": "Anpassa faktiskt pris",
      "unit": "Enhet",
      "currency": "Valuta",
      "fees": "Avgifter",
      "factor": "Faktor",
      "decimals": "Decimaler",
      "multiplier": "Multiplikator",
    },
    "countries": {
      "sv": "Sverige",
      "no": "Norge",
      "fi": "Finland",
      "dk": "Danmark",
      "de": "Tyskland",
      "at": "Österrike",
      "be": "Belgien",
      "ch": "Schweiz",
      "es": "Spanien",
      "fr": "Frankrike",
      "pl": "Polen",
    },
    "chart": {
      "today_and_tomorrow": "Idag och imorgon",
      "outstanding_hours": "Utmärkande timmar",
      "today": "Idag",
      "tomorrow": "Imorgon",
      "compare_to": "Jämför med",
      "net_production": "Nettoproduktion",
      "yesterday_and_today": "Igår och idag",
    },
    "generation": {
      "current_production": "Produktion och förbrukning",
      "production_method": "Metod",
      "production_share": "Andel",
      "production": "Produktion",
      "consumption": "Förbrukning",
      "last_updated": "Senast uppdaterat",
      "excess": "Överskott",
      "deficit": "Underskott",
      "psr_coal_0": "Kol",
      "psr_oil_0": "Olja",
      "psr_gas_0": "Gas",
      "psr_peat_0": "Torv",
      "psr_water_0": "Vatten",
      "psr_water_1": "Vatten - Förb.",
      "psr_nuclear_0": "Kärnkraft",
      "psr_solar_0": "Sol",
      "psr_wind_0": "Vind",
      "psr_wind_1": "Vind - Förb.",
      "psr_other_0": "Övrigt",
      "primary_source": "Huvudsaklig kraftkälla",
    },
    "outage": {
      "title": "Driftstörningar i ",
      "ongoing_planned": "Pågående planerade",
      "ongoing_unplanned": "Pågående oplanerade",
      "upcoming": "Kommande",
      "description": "Här nedanför ser du aktuella driftstörningar, avbrott och driftstopp som berör elproduktionen i ",
      "details": "Vill du inkludera kommande planerade driftstörningar, klicka här.",
      "capacity_ongoing": "Kapacitet under avbrottet",
      "capacity_total": "Total kapacitet",
      "planned_maintenance": "Planerat underhåll",
      "unplanned_outage": "Oplanerad driftstörning",
      "started_unplanned_outage": "påverkas av en oplanerad driftstörning som startade ",
      "started_planned_maintenance": "påverkas av ett planerat underhåll som startar ",
      "done": " och beräknas vara klart ",
    },
    "longtermchart": {
      "title": "Elpris per månad - ",
      "countryDescriptionPart1": "I tabellen nedan presenteras genomsnittspriset för varje elområde i",
      "countryDescriptionPart2": ", månadsvis sedan 2021. Observera att den senaste månaden kan vara ofullständig.",
      "areaDescriptionPart1": "I tabellen nedan presenteras genomsnittspriset för elområde ",
      "areaDescriptionIn": " i ",
      "areaDescriptionPart2": ", månadsvis sedan 2021. Observera att den senaste månaden kan vara ofullständig.",
      "priceFactorDescriptionPart1": "Elpriset som visas i tabellen baseras på följande formel: ([spotpris] +",
      "priceFactorDescriptionPart2": "(avgifter)) *",
      "priceFactorDescriptionPart3": "(moms). Detta är justerat efter dina nuvarande inställningar.",
      "nonPriceFactorDescription":
        "Elpriset i tabellen representerar det aktuella spotpriset. Tänk på att ytterligare avgifter och moms kan tillkomma. Du kan välja mellan att visa spotpris eller faktiskt pris genom inställningarna på sidan.",
    },
  },
};
export { sv };
