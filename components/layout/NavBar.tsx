import { useEffect, useState } from "preact/hooks";
import { countries } from "config/countries.js";

interface NavbarProps {
  page: string;
  priceFactor: boolean;
  // deno-lint-ignore ban-types
  setPriceFactor: Function;
  country: string;
  lang: string;
}

export default function Navbar(props: NavbarProps) {
  const [countryItems, setCountryItems] = useState([]);
  useEffect(() => {
    const countryItems = [];
    for (const country of countries) {
      const areaItems = [];
      for (const area of country.areas) {
        areaItems.push(
          <li class={"nav-item" + (props.page === area.name ? " active" : "")}>
            <a class={"nav-link"} href={"/" + country.id + "/" + area.name}>{area.name} - {area.long}</a>
          </li>,
        );
      }
      countryItems.push(
        <li class="nav-item dropdown with-arrow">
          <a class="nav-link" data-toggle="dropdown" id="nav-link-dropdown-toggle">
            <span data-t-key={"common.countries." + country.id} lang={props.lang}>{country.name}</span>
            <i class="fa fa-angle-down ml-5" aria-hidden="true"></i>
          </a>
          <div class="dropdown-menu dropdown-menu-left" aria-labelledby="nav-link-dropdown-toggle">
            <li class={"nav-item" + (props.page === country.name ? " active" : "")}>
              <a class={"nav-link"} href={"/" + country.id}>
                <span data-t-key="common.nav.all_of" lang={props.lang}>All</span>&nbsp;<span
                  data-t-key={"common.countries." + country.id}
                  lang={props.lang}
                >
                  {country.name}
                </span>
              </a>
            </li>
            <div class="dropdown-divider"></div>
            {areaItems}
          </div>
        </li>,
      );
    }
    setCountryItems(countryItems);
  }, []);

  return (
    <nav class="navbar">
      <div class="navbar-content">
        <button id="toggle-sidebar-btn" class="btn btn-action" type="button" onClick={() => halfmoon.toggleSidebar()}>
          <strong>☰</strong>
        </button>
      </div>
      <a href="#" class="navbar-brand">
        spot.56k.guru
      </a>
      <ul class="navbar-nav d-none d-md-flex">
        {countryItems}
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
