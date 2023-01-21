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

      {/* Settings menu button (visble on large screens) */}
      <div class="navbar-content d-none d-lg-flex">
        <button id="toggle-sidebar-btn" class="btn btn-action" type="button" onClick={() => halfmoon.toggleSidebar()}>
          <i class="fa-solid fa-gear"></i>
        </button>
      </div>

      {/* Main meny UL */}
      <ul class="navbar-nav">

        {/* Overview link ( transforms into a back arrow or bolt on small screens */}
        <li class={"nav-item d-none d-lg-flex" + (props.page === "index" ? " active" : "")}>
          <a class={"nav-link"} href={"/"}>
            <span data-t-key="common.nav.index" lang={props.lang}>Overview</span>
          </a>
        </li>
        <li class={"nav-item hidden-lg-and-up"   + (props.page === "index" ? " active" : "")}>
          {/* Bolt if at main page */}
          { !props.country && (
            <a class={"nav-link pl-0"} href={"/"}>
              <i class="fa-solid fa-bolt"></i>
            </a>
          )}
          {/* Back link otherwise */}
          { props.country && (
            <a class={"nav-link pl-0"} href={props.area ? "/" + props.country?.id : "/"}>
              <i class="fa fa-angle-left"></i>
            </a>
          )}
        </li>

        {/* Display dropdown with all countries */}
        <li class={"nav-item dropdown with-arrow"}>
          <a class="nav-link" data-toggle="dropdown" id="nav-link-dropdown-toggle">
              { props.country && (
                <span data-t-key={"common.countries." + props.country.id} lang={props.lang}>
                  {props.country.name}
                </span>
              )}
              { !props.country && (
                <span data-t-key={"common.nav.country"} lang={props.lang}>Land</span>
              )}
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
        
        {/* Display dropdown with all electricity areas if there i more than one */}
        { props.country?.areas && props.country?.areas.length > 1 && (
          <li class={"nav-item dropdown with-arrow hidden-lg-and-up"}>
            <a class="nav-link" data-toggle="dropdown" id="nav-link-dropdown-toggle">
                { props.area && (
                  <span>
                    {props.area.name}
                  </span>
                )}
                { !props.area && (
                  <span data-t-key={"common.nav.area"} lang={props.lang}>Elområde</span>
                )}
              <i class="fa fa-angle-down ml-5" aria-hidden="true"></i>
            </a>
            <div class="dropdown-menu dropdown-menu-left" aria-labelledby="nav-link-dropdown-toggle">
              { props.country.areas && props.country.areas.map((a) => (
                <a key={a.id} class={"nav-link"} href={"/" + props.country?.id + "/" + a.name}>
                  <span>
                    {a.name}
                  </span>
                </a>
              ))}
            </div>
          </li>
        )}

        {/* Display areas as individual links if using a wide screen*/}
        { countries && countries.map((c) => { 
          if (c.id === props.country?.id) return (<>
            { c.areas && c.areas.length > 1 && c.areas.map((a) => { return (
            <li class={"nav-item d-none d-lg-flex" + (props.page === a.id ? " active" : "")}>
              <a key={c.id} class={"nav-link"} href={"/" + c.id + "/" + a.name}>
                  {a.name}
              </a>
            </li>
          )})}
          </>)}
        )}
        
        {/* Other top level links */}
        {/* Show home assistant only on main page */}
        { !props.country && (
          <li class={"nav-item" + (props.page === "homeassistant" ? " active" : "")}>
            <a class={"nav-link"} href={"/homeassistant"}>
              <span>Home Assistant</span>
            </a>
          </li>
        )}

        {/* Help - always show */}
        <li class={"nav-item" + (props.page === "help" ? " active" : "")}>
          <a class={"nav-link"} href={"/help"}>
            <span data-t-key={"common.nav.help"} lang={props.lang}>Help</span>
          </a>
        </li>

      </ul>

      {/* Settings menu button (visble on small screens) */}
      <div class="navbar-content ml-auto hidden-lg-and-up">
        <button id="toggle-sidebar-btn" class="btn btn-action" type="button" onClick={() => halfmoon.toggleSidebar()}>
          <i class="fa-solid fa-gear"></i>
        </button>
      </div>

    </nav>
  );
}
