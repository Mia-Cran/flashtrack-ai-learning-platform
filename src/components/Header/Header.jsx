import { NavLink, useNavigate } from "react-router";
import "./Header.css";

function navLinkClassName({ isActive }) {
  return isActive ? "header__link header__link--active" : "header__link";
}

function Header({ isLoggedIn, onSignout }) {
  const navigate = useNavigate();

  function handleSignoutClick() {
    onSignout();
    navigate("/");
  }

  return (
    <header className="header">
      <nav className="header__nav">
        <span className="header__brand">FlashTrack</span>

        <div className="header__links">
          <NavLink className={navLinkClassName} to="/" end>
            Welcome
          </NavLink>

          <NavLink className={navLinkClassName} to="/search" end>
            Search
          </NavLink>

          {isLoggedIn && (
            <>
              <NavLink className={navLinkClassName} to="/home" end>
                Home
              </NavLink>

              <NavLink className={navLinkClassName} to="/saved" end>
                Saved Topics
              </NavLink>

              <NavLink className={navLinkClassName} to="/about" end>
                About
              </NavLink>

              <button
                type="button"
                className="header__signout"
                onClick={handleSignoutClick}
              >
                Sign Out
              </button>
            </>
          )}
        </div>
      </nav>
    </header>
  );
}

export default Header;
