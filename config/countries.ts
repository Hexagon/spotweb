import { DBResultSet, SpotApiRow } from "backend/db/index.ts";

interface Area {
  name: string;
  id: string;
  long: string;
  color: number;
}

interface DataCountry extends Country {
  dataToday: SpotApiRow[];
  dataTomorrow: SpotApiRow[];
  dataMonth: SpotApiRow[];
  dataPrevMonth?: SpotApiRow[];
  load: DBResultSet;
  generation: DBResultSet;
}

interface DataArea extends Area {
  dataToday: SpotApiRow[];
  dataTomorrow: SpotApiRow[];
  dataMonth: SpotApiRow[];
  dataPrevMonth?: SpotApiRow[];
}

interface Country {
  name: string;
  id: string;
  cty: string;
  interval: string;
  areas: Area[];
}

const countries = [
  {
    name: "Sverige",
    id: "sv",
    cty: "Sweden (SE)",
    cta: "CTA|SE",
    interval: "PT60M",
    areas: [
      { name: "SE1", "id": "BZN|SE1", "long": "Norra Sverige", color: 1 },
      { name: "SE2", "id": "BZN|SE2", "long": "Norra Mellansverige", color: 2 },
      { name: "SE3", "id": "BZN|SE3", "long": "Södra Mellansverige", color: 3 },
      { name: "SE4", "id": "BZN|SE4", "long": "Södra sverige", color: 4 },
    ],
  },
  {
    name: "Norge",
    cty: "Norway (NO)",
    cta: "CTA|NO",
    interval: "PT60M",
    id: "no",
    areas: [
      { name: "NO1", "id": "IBA|NO1", "long": "Oslo", color: 1 },
      { name: "NO2", "id": "IBA|NO2", "long": "Kristiansand", color: 2 },
      { name: "NO3", "id": "IBA|NO3", "long": "Molde", color: 3 },
      { name: "NO4", "id": "IBA|NO4", "long": "Tromsø", color: 4 },
      { name: "NO5", "id": "IBA|NO5", "long": "Bergen", color: 5 },
    ],
  },
  {
    name: "Finland",
    cty: "Finland (FI)",
    cta: "CTA|FI",
    interval: "PT60M",
    id: "fi",
    areas: [
      { name: "FI", "id": "FI", "long": "Suomi", color: 1 },
    ],
  },
  {
    name: "Danmark",
    cty: "Denmark (DK)",
    cta: "CTA|DK",
    interval: "PT60M",
    id: "dk",
    areas: [
      { name: "DK1", "id": "IBA|DK1", "long": "Jylland", color: 1 },
      { name: "DK2", "id": "IBA|DK2", "long": "Sjaelland", color: 2 },
    ],
  },
  {
    name: "Deutschland",
    cty: "Germany (DE)",
    cta: "CTA|DE",
    interval: "PT15M",
    id: "de",
    areas: [
      { name: "DE-LU", "id": "BZN|DE-LU", "long": "Deutschland", color: 1 },
    ],
  },
  {
    name: "Österreich",
    cty: "Austria (AT)",
    cta: "CTA|AT",
    interval: "PT15M",
    id: "at",
    areas: [
      { name: "AT", "id": "BZN|AT", "long": "Österreich", color: 1 },
    ],
  },
  {
    name: "Belgium",
    id: "be",
    cty: "Belgium (BE)",
    cta: "CTA|BE",
    interval: "PT60M",
    areas: [
      { name: "BE", "id": "BZN|BE", "long": "Belgium", color: 1 },
    ],
  },
  {
    name: "Switzerland",
    cty: "Switzerland (CH)",
    cta: "CTA|CH",
    interval: "PT60M",
    id: "ch",
    areas: [
      { name: "CH", "id": "BZN|CH", "long": "Switzerland", color: 1 },
    ],
  },
  {
    name: "Spain",
    cty: "Spain (ES)",
    cta: "CTA|ES",
    interval: "PT60M",
    id: "es",
    areas: [
      { name: "ES", "id": "BZN|ES", "long": "Spain", color: 1 },
    ],
  },
  {
    name: "France",
    cty: "France (FR)",
    cta: "CTA|FR",
    interval: "PT60M",
    id: "fr",
    areas: [
      { name: "FR", "id": "BZN|FR", "long": "France", color: 1 },
    ],
  },
  {
    name: "Poland",
    cty: "Poland (PL)",
    cta: "CTA|PL",
    interval: "PT60M",
    id: "pl",
    areas: [
      { name: "PL", "id": "BZN|PL", "long": "Poland", color: 1 },
    ],
  },
];

export type { Area, Country, DataArea, DataCountry };
export { countries };
