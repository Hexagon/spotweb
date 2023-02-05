import { CommonProps} from "utils/common.ts";
import { Country } from "config/countries.ts";
import { DBResultSet } from "backend/db/index.ts";

interface ProductionOverviewProps extends CommonProps {
  cols: number;
  country: Country;
  outages: DBResultSet;
  futureOutages: DBResultSet;
}

export default function OutageOverview(props: ProductionOverviewProps) {
  return (
    <div class={`col-lg-${props.cols} m-0 p-0`}>
      <div class="mw-full m-0 p-0 mr-20 mt-20">
        { props.outages.data.length > 0 && (
          <div class="card p-0 m-0">
            <div class={"px-card py-10 m-0 rounded-top"}>
              <h2 class="card-title font-size-18 m-0 text-center">
                <span data-t-key="common.outage.title_current" lang={props.lang}>Current outages</span>
              </h2>
            </div>
            <div class="content px-card m-0 p-0 pb-15 bg-very-dark">
              <div>
                <table class="table">
                  <thead>
                    <th data-t-key="common.outage.resource" lang={props.lang}>Resource</th>
                    <th data-t-key="common.outage.status" lang={props.lang}>Status</th>
                    <th data-t-key="common.outage.capacity_now" lang={props.lang}>Kapacitet just nu</th>
                  </thead>
                  <tbody>
                    { props.outages.data.length && props.outages.data.map(g => (
                      <>
                        <tr>
                          <td class="text-color-white"><strong>{g[2]}</strong><br></br>{g[6]} {g[4]}<br></br>{g[9]}</td>
                          <td class="text-color-white"><strong class={"text-"+ ("Planned maintenance" === g[3] ? "danger" : "secondary")}>{g[3]}</strong><br></br>{new Date(g[0]).toLocaleString()} - {new Date(g[1]).toLocaleString()}<br></br><small>{g[11]}</small></td>
                          <td class="text-color-white"><strong>{g[15]}</strong>/{g[7]} {g[8]}</td>
                        </tr>
                      </>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
          )}
          { props.futureOutages.data.length > 0 && (
            <div class="card p-0 m-0">
            <div class={"px-card py-10 m-0"}>
              <h2 class="card-title font-size-18 m-0 text-center">
                <span data-t-key="common.outage.title_planned" lang={props.lang}>Planned outages</span>
              </h2>
            </div>
            <div class="content px-card m-0 p-0 pb-15 bg-very-dark">
              <div>
                <table class="table">
                  <thead>
                    <th data-t-key="common.outage.resource" lang={props.lang}>Resource</th>
                    <th data-t-key="common.outage.status" lang={props.lang}>Status</th>
                    <th data-t-key="common.outage.total_capacity" lang={props.lang}>Total capacity</th>
                  </thead>
                  <tbody>
                    { props.futureOutages.data.length && props.futureOutages.data.map(g => (
                      <>
                        <tr>
                          <td><strong>{g[2]}</strong><br></br>{g[6]} {g[4]}<br></br>{g[9]}</td>
                          <td><strong>{g[3]}</strong><br></br>{new Date(g[0]).toLocaleString()} - {new Date(g[1]).toLocaleString()}<br></br><small>{g[11]}</small></td>
                          <td>{g[7]} {g[8]}</td>
                        </tr>
                      </>
                    ))}
                  </tbody>
                </table>
              </div>
              </div>
            </div>
          )}
        </div>
      </div>
  );
}
