const DBUpdates = [
    {
        name: "add_consumption_to_generation",
        sql: "ALTER TABLE generation ADD consumption INTEGER DEFAULT(0);"
    },
    {
        name: "add_interval_to_spotprice",
        sql: "ALTER TABLE spotprice ADD interval TEXT DEFAULT \"PT60M\";"
    },
    {
        name: "create_spotprice_area_period_index",
        sql: "CREATE INDEX spotprice_area_period ON spotprice (area,period);"
    },
    {
        name: "create_load_area_period_index",
        sql: "CREATE INDEX load_area_period ON load (area,period);"
    },
    {
        name: "create_generation_area_period_index",
        sql: "CREATE INDEX generation_area_period ON generation (area, period);"
    },
    {
        name: "delete_spotprice_date_column",
        sql: "ALTER TABLE spotprice DROP COLUMN date"
    },
    {
        name: "delete_german_and_austrian_history",
        sql: "DELETE FROM spotprice WHERE country='de' OR country='at'"
    }
];

export { DBUpdates };