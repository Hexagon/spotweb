import { Area, countries, Country } from "config/countries.ts";
import { CommonProps } from "utils/common.ts";

interface NavbarProps extends CommonProps {
  page: string;
  pageType: string;
  country?: Country;
  area?: Area;
  // deno-lint-ignore ban-types
  setPriceFactor: Function;
}

export default function Navbar(props: NavbarProps) {
  return (
    <nav class="navbar">

      <div class="navbar-content">
        <button id="toggle-sidebar-btn" class="btn btn-action" type="button" onClick={() => halfmoon.toggleSidebar()}>
          <strong>☰</strong>
        </button>
      </div>

      <ul class="navbar-nav d-none d-md-flex">

        <li class={"nav-item" + (props.page === "index" ? " active" : "")}>
          <a class={"nav-link"} href={"/"}>
            <span data-t-key="common.nav.index" lang={props.lang}>Overview</span>
          </a>
        </li>

        <li class={"nav-item dropdown with-arrow"}>
          <a class="nav-link" data-toggle="dropdown" id="nav-link-dropdown-toggle">
            <span data-t-key={"common.nav.country"} lang={props.lang}>Land</span>
            <i class="fa fa-angle-down ml-5" aria-hidden="true"></i>
          </a>
          <div class="dropdown-menu dropdown-menu-left" aria-labelledby="nav-link-dropdown-toggle">
            { countries && countries.map((c) => (
              <a key={c.id} class={"nav-link"} href={"/" + c.id}>
                <span data-t-key={"common.countries." + c.id} lang={props.lang}>
                  {c.name}
                </span>
              </a>
            ))}
          </div>
        </li>
        
        {/* Show link for current country if there is one */}
        { props.country && (
          <li class={"nav-item" + ((props.page === props.country.id || props.page == props.area?.id) ? " active" : "")}>
            <a class={"nav-link"} href={"/" + props.country.id}>
              {/* Only display "All of" if there is more than one area in country */}
              { props.country.areas.length > 1 && (
                <>
                  <span data-t-key={"common.nav.all_of"} lang={props.lang}></span><span>&nbsp;</span>
                </>
              )}
              <span data-t-key={"common.countries." + props.country.id} lang={props.lang}>
                {props.country.name}
              </span>
            </a>
          </li>
        )}

        { countries && countries.map((c) => { 
          if (c.id === props.country?.id) return (<>
            { c.areas && c.areas.length > 1 && c.areas.map((a) => { return (
            <li class={"nav-item" + (props.page === a.id ? " active" : "")}>
              <a key={c.id} class={"nav-link"} href={"/" + c.id + "/" + a.name}>
                  {a.name}
              </a>
            </li>
          )})}
          </>)}
        )}

        <li class={"nav-item" + (props.page === "homeassistant" ? " active" : "")}>
          <a class={"nav-link"} href={"/homeassistant"}>
            <span>Home Assistant</span>
          </a>
        </li>

      </ul>

      <form class="form-inline d-none d-md-flex ml-auto custom-switch pr-10">
        <input
          type="checkbox"
          checked={props.priceFactor}
          id="price-selector"
          onInput={(e) => props.setPriceFactor((e.target as HTMLInputElement).checked)}
        >
        </input>
        <label for="price-selector">
          <i>
            <small>
              <span data-t-key="common.nav.actual_price_instead" lang={props.lang}>Actual price instead of spot price</span>
            </small>
          </i>
        </label>
      </form>
    </nav>
  );
}
