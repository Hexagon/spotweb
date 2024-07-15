import { CommonProps } from "utils/common.ts";
import { Country } from "config/countries.ts";
import { DBResultSet } from "backend/db/index.ts";

interface NewsOutageProps extends CommonProps {
  cols: number;
  country: Country;
  outages?: DBResultSet;
  futureOutages?: DBResultSet;
}

export default function NewsOutage(props: NewsOutageProps) {

  /* Articles */
  const currentOutages = [...(props.outages?.data || [])].sort((a, b) => new Date(Number(b[0])).getTime() - new Date(Number(a[0])).getTime());
  const futureOutages = [...(props.futureOutages?.data || [])].sort((a, b) => new Date(Number(b[0])).getTime() - new Date(Number(a[0])).getTime());

  /* Counts */
  const ongoingPlanned = (props.outages?.data || []).filter(o => o[3] === "Planned maintenance").length;
  const ongoingUnplanned = (props.outages?.data || []).length - ongoingPlanned;
  const upcomingOutages = (props.futureOutages?.data || []).length;

  return (

    <div class={`col-lg-${props.cols} m-0 p-0`}>
      <div class="mw-full m-0 p-0 mr-20 mt-20">
        <div class="card p-0 m-0">
            
          <div class={"px-card py-10 m-0 rounded-top"}>
            <h2 class="card-title font-size-18 m-0 text-center">
              <span data-t-key="common.outage.title" lang={props.lang}>Current and planned outages</span>
              <span data-t-key={"common.countries."+props.country.id} lang={props.lang}></span>
            </h2>
          </div>

          <div class="content px-card m-0 p-0 pb-15 bg-very-dark">
            <div class="card-content p-20 mb-20 d-flex justify-content-between">
              
              <div class="text-center p-10 m-5 rounded">
                <h1 class="font-size-24 text-primary">{ongoingPlanned}</h1>
                <p data-t-key="common.outage.ongoing_planned" lang={props.lang} class="m-0">Ongoing Planned</p>
              </div>

              <div class="text-center p-10 m-5 rounded">
                <h1 class="font-size-24 text-danger">{ongoingUnplanned}</h1>
                <p data-t-key="common.outage.ongoing_unplanned" lang={props.lang} class="m-0">Ongoing Unplanned</p>
              </div>

              <div class="text-center p-10 m-5 rounded">
                <h1 class="font-size-24 text-secondary">{upcomingOutages}</h1>
                <p data-t-key="common.outage.upcoming" lang={props.lang} class="m-0">Upcoming</p>
              </div>
            </div>
            <p class="mt-20 text-center"><span  data-t-key="common.outage.description" lang={props.lang}>Stay updated with current and upcoming outages for </span> {props.country.name}.</p>
          </div>

          <div class="content px-card m-0 p-0 pb-15 bg-very-dark">
            <div class="card-content p-20 mb-20">
                <details>
                <summary data-t-key="common.outage.details" lang={props.lang}>Include Upcoming Planned Outages</summary>
                {futureOutages.map(g => (
                    <div class="card-content p-20 mb-20">
                    <div class="d-flex justify-content-between mb-10">
                        <strong class={`text-primary`}><span data-t-key={"common.outage."+(g[3] as string).toLowerCase().replace(" ","_")}></span> - {g[2]}</strong>
                        <span class="text-muted">{new Date(Number(g[0])).toLocaleDateString()}</span>
                    </div>
                    <p><strong>{(!g[6] || g[6] === "undefined") ? "" : g[6]}</strong> {(g[4] || "")} <span data-t-key={"common.outage.started_"+(g[3] as string).toLowerCase().replace(" ","_")}></span> {new Date(Number(g[0])).toLocaleDateString()} <span data-t-key="common.outage.done" lang={props.lang}>done</span> {new Date(Number(g[1])).toLocaleDateString()}. {g[11]}</p>
                    {g[15] && <p><span data-t-key="common.outage.capacity_ongoing" lang={props.lang}>Planned capacity during outage: </span> <strong>{g[15]} {g[8]}</strong></p>}
                    {g[7] && <p><span data-t-key="common.outage.capacity_total" lang={props.lang}>Total capacity: </span> <strong>{g[7]} {g[8]}</strong></p>}
                    </div>
                ))}
                </details>
            </div>
            
            {currentOutages.map(g => (
                <div class="card-content p-20 mb-20">
                    <div class="d-flex justify-content-between mb-10">
                        <strong class={`text-${g[3] === "Planned maintenance" ? "primary" : "danger"}`}><span data-t-key={"common.outage."+(g[3] as string).toLowerCase().replace(" ","_")}></span> - {g[2]}</strong>
                        <span class="text-muted">{new Date(Number(g[0])).toLocaleDateString()}</span>
                    </div>
                    <p><strong>{(!g[6] || g[6] === "undefined") ? "" : g[6]}</strong> {(g[4] || "")} <span data-t-key={"common.outage.started_"+(g[3] as string).toLowerCase().replace(" ","_")}></span> {new Date(Number(g[0])).toLocaleDateString()} <span data-t-key="common.outage.done" lang={props.lang}>done</span> {new Date(Number(g[1])).toLocaleDateString()}. {g[11]}</p>
                    {g[15] && <p><span data-t-key="common.outage.capacity_ongoing" lang={props.lang}>Planned capacity during outage: </span> <strong>{g[15]} {g[8]}</strong></p>}
                    {g[7] && <p><span data-t-key="common.outage.capacity_total" lang={props.lang}>Total capacity: </span> <strong>{g[7]} {g[8]}</strong></p>}
                    <hr />
                </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
