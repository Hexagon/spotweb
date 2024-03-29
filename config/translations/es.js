const es = {
  "common": {
    "page": {
      "title": "El precio de la electricidad ahora mismo",
    },
    "months": {
      "0": "enero",
      "1": "febrero",
      "2": "marzo",
      "3": "abril",
      "4": "mayo",
      "5": "junio",
      "6": "julio",
      "7": "agosto",
      "8": "septiembre",
      "9": "octubre",
      "10": "noviembre",
      "11": "diciembre",
    },
    "months_short": {
      "0": "ene",
      "1": "feb",
      "2": "mar",
      "3": "abr",
      "4": "may",
      "5": "jun",
      "6": "jul",
      "7": "ago",
      "8": "sep",
      "9": "oct",
      "10": "nov",
      "11": "dic",
    },
    "header": {
      "title": "Precio actual de la electricidad, ahora e históricamente",
      "avg_today": "Precio spot promedio hoy",
      "avg_month": "Precio variable en lo que va del mes",
      "avg_today_short": "Precio spot promedio",
    },
    "warning": {
      "actual_price": "Precio actual de la electricidad",
      "actual_price_text":
        "Actualmente tiene activado el precio de la electricidad, pero no ha realizado ninguna configuración para impuestos y tarifas. Haga clic en el engranaje y complete el Factor (por ejemplo, 1,25 para el 25 % de IVA) y su tarifa (por ejemplo, 0,095 para 9,5 öre/kWh antes del IVA )",
    },
    "information": {
      "title": "Información y Condiciones de Uso",
      "all_history": "Todas las estadísticas se recuperan de",
      "currency_fetched_from": "Tipo de cambio actual obtenido de",
      "all_values_from": "Todos los valores, incluidos los históricos, se convierten de EUR al tipo de cambio actual",
      "disclaimer_and_private_use":
        "Las cifras que se muestran deben ser correctas, pero se proporcionan sin garantías. El sitio y los servicios relacionados se proporcionan para uso privado, bajo su propio riesgo",
      "open_source_software": "El código fuente de la página es completamente abierto y está disponible en ",
      "bugs_and_issues":
        "Los errores y problemas se informan a través de 'Issues' en GitHub. También se puede contactar por correo electrónico a hexagon{a}56k.guru.",
    },
    "overview": {
      "thirty_day_chart": "Historial de 30 días",
      "all_areas_today": "Todas las áreas de electricidad - Hoy",
      "all_areas_tomorrow": "Todas las áreas de electricidad - Mañana",
      "average_today": "Promedio de hoy",
      "average_tomorrow": "mañana",
      "right_now": "ahora mismo",
      "more_about": "Más sobre",
      "span": "Intervalo:",
      "so_far": "Hasta ahora",
    },
    "nav": {
      "actual_price_instead": "Precio real por hora en lugar de precio al contado",
      "all_of": "Entero",
      "index": "Resumen",
      "table": "Mesa",
      "country": "País",
      "area": "Área",
      "help": "Ayuda",
    },
    "customize": {
      "title": "Ajustar precio actual",
      "unit": "Unidad",
      "currency": "Moneda",
      "fees": "Tarifas",
      "factor": "Factor",
      "decimals": "decimales",
      "multiplier": "Multiplicador",
    },
    "countries": {
      "sv": "Suecia",
      "no": "Noruega",
      "fi": "Finlandia",
      "dk": "Dinamarca",
      "de": "Alemania",
      "at": "Austria",
      "be": "Bélgica",
      "ch": "Suiza",
      "es": "España",
      "fr": "Francia",
      "pl": "Polonia",
    },
    "chart": {
      "today_and_tomorrow": "Hoy y mañana",
      "outstanding_hours": "Horas pendientes",
      "today": "Hoy",
      "tomorrow": "Mañana",
      "compare_to": "Comparar con",
      "net_production": "Producción neta",
      "yesterday_and_today": "Ayer y hoy",
    },
    "generation": {
      "current_production": "Producción y consumo",
      "production_method": "Método",
      "production_share": "Compartir",
      "production": "Producción",
      "consumption": "Consumo",
      "last_updated": "Última actualización",
      "excess": "Exceso",
      "deficit": "Déficit",
      "psr_coal_0": "Carbón",
      "psr_oil_0": "Aceite",
      "psr_gas_0": "Gasolina",
      "psr_peat_0": "Turba",
      "psr_water_0": "Agua",
      "psr_water_1": "Agua - Cons.",
      "psr_nuclear_0": "Nuclear",
      "psr_solar_0": "Solar",
      "psr_wind_0": "Viento",
      "psr_wind_1": "Viento - Cons.",
      "psr_other_0": "Otro",
      "primary_source": "Fuente de alimentación principal",
    },
    "outage": {
      "title": "Interrupciones en ",
      "ongoing_planned": "En curso planificadas",
      "ongoing_unplanned": "En curso no planificadas",
      "upcoming": "Próximas",
      "description": "A continuación, puedes ver las interrupciones actuales que afectan la producción eléctrica en ",
      "details": "Si quieres incluir interrupciones planificadas próximas, haz clic aquí.",
      "capacity_ongoing": "Capacidad durante la interrupción",
      "capacity_total": "Capacidad total",
      "planned_maintenance": "Mantenimiento planificado",
      "unplanned_outage": "Interrupción no planificada",
      "started_unplanned_outage": "afectado por una interrupción no planificada que comenzó ",
      "started_planned_maintenance": "afectado por un mantenimiento planificado que comienza ",
      "done": " y se estima que finalizará ",
    },
    "longtermchart": {
      "title": "Precio de la electricidad por mes - ",
      "countryDescriptionPart1": "La tabla a continuación muestra el precio promedio para cada área eléctrica en",
      "countryDescriptionPart2": ", mensualmente desde 2021. Ten en cuenta que el último mes puede no estar completo.",
      "areaDescriptionPart1": "La tabla a continuación muestra el precio promedio para el área eléctrica ",
      "areaDescriptionIn": " en ",
      "areaDescriptionPart2": ", mensualmente desde 2021. Ten en cuenta que el último mes puede no estar completo.",
      "priceFactorDescriptionPart1": "El precio de la electricidad mostrado en la tabla se basa en la siguiente fórmula: ([precio spot] +",
      "priceFactorDescriptionPart2": "(tarifas)) *",
      "priceFactorDescriptionPart3": "(impuesto). Esto se ha ajustado según tus configuraciones actuales.",
      "nonPriceFactorDescription":
        "El precio de la electricidad en la tabla representa el precio spot actual. Tenga en cuenta que pueden aplicarse cargos adicionales e impuestos. Puede elegir mostrar el precio spot o el precio real a través de las configuraciones en la página.",
    },
  },
};
export { es };
