import { SpotApiResult } from "../routes/api/spot.ts";

interface TableProps {
    unit: string,
    extra: string,
    factor: string,
    resultSet: SpotApiResult;
}

export function Table(props: TableProps) {

    const
        unit = props.unit || "",
        extra = props.extra || "",
        factor = props.factor || "";

    // Validate unit
    const validUnits = ["kWh", "MWh"];
    if (!validUnits.includes(unit)) {
        return new Response(JSON.stringify({status: "Error", details: "Unit not valid"}), { status: 500});
    }

    // Validate extra
    const parsedExtra = parseFloat(extra);
    if (isNaN(parsedExtra)) {
        return new Response(JSON.stringify({status: "Error", details: "Extra not valid"}), { status: 500});
    }

    // Validate factor
    const parsedFactor = parseFloat(factor);
    if (isNaN(parsedFactor)) {
        return new Response(JSON.stringify({status: "Error", details: "Factor not valid"}), { status: 500});
    }

    // Modify result
    for(const e of props.resultSet) {
        // Update value
        if (isNaN(parseInt(e.spotPrice.toString(), 10))) {
            // Do not change empty entries
        } else {
            // Convert between MWh and kWh
            if(e.unit.includes("MWh") && unit.includes("kWh")) {
                e.spotPrice = e.spotPrice / 1000;
            } else if (e.unit.includes("kWh") && unit.includes("MWh")) {
                e.spotPrice = e.spotPrice * 1000;
            }
            // Add extra
            e.spotPrice += parsedExtra;
            // Multiply by factor
            // Add extra
            e.spotPrice *= parsedFactor;
        }
        // Convert between MWh and kWh - Update units
        if(e.unit.includes("MWh") && unit.includes("kWh")) {
            e.unit = e.unit.replace("MWh","kWh");
        } else if (e.unit.includes("kWh") && unit.includes("MWh")) {
            e.unit = e.unit.replace("kWh","MWh");
        }
    }
        
  return (
    <section id="tables">
        <h5>Source: {props.resultSet.source}@{props.resultSet.dt.toLocaleString()}</h5>
        <table role="grid">
            <thead>
            <tr>
                <th scope="col">Start Date</th>
                <th scope="col">End Date</th>
                <th scope="col">Area</th>
                <th scope="col">Spot price</th>
                <th scope="col">Unit</th>
            </tr>
            </thead>
            <tbody>
            { props.resultSet.data.map((r) => { return (
                <tr>
                    <td>{new Date(Date.parse(r.startTime)).toLocaleString()}</td>
                    <td>{new Date(Date.parse(r.endTime)).toLocaleString()}</td>
                    <td>{r.areaCode}</td>
                    <td>{r.spotPrice}</td>
                    <td>{r.unit}</td>
                </tr>
            )})}
            </tbody>
        </table>
    </section>
  )
}