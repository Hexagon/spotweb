import { SpotApiRow } from "../backend/db/index.ts";

interface Area {
  name: string;
  id: string;
  long: string;
  color: number;
}

interface DataArea extends Area {
  dataToday: SpotApiParsedRow[];
  dataTomorrow: SpotApiParsedRow[];
  dataMonth: SpotApiParsedRow[];
  dataPrevMonth?: SpotApiParsedRow[];
}

interface Country {
  name: string;
  id: string;
  areas: Area[];
}

const countries = [
  {
    name: "Sverige",
    id: "sv",
    areas: [
      { name: "SE1", "id": "BZN|SE1", "long": "Norra Sverige", color: 1 },
      { name: "SE2", "id": "BZN|SE2", "long": "Norra Mellansverige", color: 2 },
      { name: "SE3", "id": "BZN|SE3", "long": "Södra Mellansverige", color: 3 },
      { name: "SE4", "id": "BZN|SE4", "long": "Södra sverige", color: 4 },
    ],
  },
  {
    name: "Norge",
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
    id: "fi",
    areas: [
      { name: "FI", "id": "FI", "long": "Soumi", color: 1 },
    ],
  },
  {
    name: "Danmark",
    id: "dk",
    areas: [
      { name: "DK1", "id": "IBA|DK1", "long": "Jylland", color: 1 },
      { name: "DK2", "id": "IBA|DK2", "long": "Sjaelland", color: 2 },
    ],
  },
];

export type { Area, Country, DataArea };
export { countries };
