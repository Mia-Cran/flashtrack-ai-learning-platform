import { NavLink, useNavigate } from "react-router";
import "./Header.css";

function HeaderNavLink({ to, disabled, children }) {
  return (
    <NavLink
      className={({ isActive }) => {
        const classes = ["header__link"];

        if (isActive) {
          classes.push("header__link--active");
        }

        if (disabled) {
          classes.push("header__link--disabled");
        }

        return classes.join(" ");
      }}
      to={to}
      end
      aria-disabled={disabled}
      tabIndex={disabled ? -1 : undefined}
      onClick={(event) => {
        if (disabled) {
          event.preventDefault();
        }
      }}
    >
      {children}
    </NavLink>
  );
}

function Header({ isLoggedIn, onSignout, isSearchLoading = false }) {
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
          <HeaderNavLink to="/" disabled={isSearchLoading}>
            Welcome
          </HeaderNavLink>

          {isLoggedIn && (
            <HeaderNavLink to="/home" disabled={isSearchLoading}>
              Home
            </HeaderNavLink>
          )}

          <HeaderNavLink to="/search" disabled={isSearchLoading}>
            Search
          </HeaderNavLink>

          {isLoggedIn && (
            <>
              <HeaderNavLink to="/saved" disabled={isSearchLoading}>
                Saved Topics
              </HeaderNavLink>

              <HeaderNavLink to="/about" disabled={isSearchLoading}>
                About
              </HeaderNavLink>

              <button
                type="button"
                className="header__signout"
                onClick={handleSignoutClick}
                disabled={isSearchLoading}
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
