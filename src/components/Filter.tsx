interface FilterProps {
    period: string;
    currency: string;
    date: string;
    area: string;
    unit: string;
    extra: string;
    factor: string;
}

export type { FilterProps };

export function Filter(props: FilterProps) {
  return (
    <section id="form">
        <form>          
        <div class="grid">
            <select name="period" value={props.period} required>
                <option value="hourly">Hourly</option>
                <option value="daily">Daily</option>
                <option value="weekly">Weekly</option>
                <option value="monthly">Monthly</option>
                <option value="yearly">Yearly</option>
            </select>
            <select name="currency" value={props.currency} required>
                <option value="SEK">SEK</option>
                <option value="NOK">NOK</option>
                <option value="EUR">EUR</option>
            </select>
            <select name="area" value={props.area} required>
                <option value="SE1">SE1</option>
                <option value="SE2">SE2</option>
                <option value="SE3">SE3</option>
                <option value="SE4">SE4</option>
            </select>
            <select name="unit" value={props.unit} required>
                <option value="MWh">MWh</option>
                <option value="KWh">KWh</option>
            </select>
            <input type="text" name="extra" value={props.extra} placeholder="Extra fees"></input>
            <input type="text" name="factor" value={props.factor}  placeholder="Factor (e.g. 1.25 for 25% VAT)"></input>
            <input type="date" name="date" value={props.date}></input>
            <button id="ok">Go</button>
        </div>
        </form>
    </section>
  );
}