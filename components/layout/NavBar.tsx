import { countries } from "config/countries.ts";
import { CommonProps } from "../../utils/common.ts";

interface NavbarProps extends CommonProps {
  page: string;
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
      <a href="#" class="navbar-brand">
        spot.56k.guru
      </a>
      <ul class="navbar-nav d-none d-md-flex">
      { countries && countries.map((c) => (
      <li key={c.id} class="nav-item dropdown with-arrow">
          <a class="nav-link" data-toggle="dropdown" id="nav-link-dropdown-toggle">
            <span data-t-key={"common.countries." + c.id} lang={props.lang}>{c.name}</span>
            <i class="fa fa-angle-down ml-5" aria-hidden="true"></i>
          </a>
          <div class="dropdown-menu dropdown-menu-left" aria-labelledby="nav-link-dropdown-toggle">
              <a class={"nav-link"} href={"/" + c.id}>
                <span data-t-key="common.nav.all_of" lang={props.lang}>All</span>&nbsp;<span
                  data-t-key={"common.countries." + c.id}
                  lang={props.lang}
                >
                  {c.name}
                </span>
              </a>
            <div class="dropdown-divider mt-5 mb-5"></div>
            { c.areas.map((a) => (
              <a class={"nav-link"} href={"/" + c.id + "/" + a.name}>{a.name} - {a.long}</a>
            ))}
          </div>
        </li>))}
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
