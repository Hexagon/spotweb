const DBUpdates = [
  {
    name: "add_consumption_to_generation",
    sql: "ALTER TABLE generation ADD consumption INTEGER DEFAULT(0);",
  },
  {
    name: "add_interval_to_spotprice",
    sql: 'ALTER TABLE spotprice ADD interval TEXT DEFAULT "PT60M";',
  },
  {
    name: "create_spotprice_area_period_index",
    sql: "CREATE INDEX spotprice_area_period ON spotprice (area,period);",
  },
  {
    name: "create_load_area_period_index",
    sql: "CREATE INDEX load_area_period ON load (area,period);",
  },
  {
    name: "create_generation_area_period_index",
    sql: "CREATE INDEX generation_area_period ON generation (area, period);",
  },
  {
    name: "delete_spotprice_date_column",
    sql: "ALTER TABLE spotprice DROP COLUMN date",
  },
  {
    name: "delete_german_and_austrian_history",
    sql: "DELETE FROM spotprice WHERE country='de' OR country='at'",
  },
  {
    name: "insert_psr_groups",
    sql: `INSERT INTO psr
        (psr,psr_group)
        VALUES
        ('B01','other'),
        ('B02','coal'),
        ('B03','gas'),
        ('B04','gas'),
        ('B05','coal'),
        ('B06','oil'),
        ('B07','oil'),
        ('B08','peat'),
        ('B09','other'),
        ('B10','water'),
        ('B11','water'),
        ('B12','water'),
        ('B13','water'),
        ('B14','nuclear'),
        ('B15','other'),
        ('B16','solar'),
        ('B17','other'),
        ('B18','wind'),
        ('B19','wind'),
        ('B20','other');`,
  },
  {
    name: "bugfix_biomass_psr",
    sql: `UPDATE psr SET psr_group='other' WHERE psr='B01';`,
  },
  {
    name: "add_generation_period_index",
    sql: `CREATE INDEX period ON generation (
      period
    );`,
  },
  {
    name: "add_spotprice_period_index",
    sql: `CREATE INDEX spotprice_period ON spotprice (
      period
    );`,
  },
];

export { DBUpdates };
