import { NavLink, useNavigate } from "react-router";
import SubjectsNavDropdown from "../SubjectsNavDropdown/SubjectsNavDropdown";
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
        <div className="header__brand-group">
          <span className="header__brand">FlashTrack</span>

          {/* Open to every visitor, same as Search itself -- browsing a
              subject is just a way to find something to search, not a
              feature that needs an account. Kept next to the brand, on its
              own, rather than mixed in with the other nav links -- moved
              here after it felt out of place sitting among the page links. */}
          <SubjectsNavDropdown disabled={isSearchLoading} />
        </div>

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

              <HeaderNavLink to="/settings" disabled={isSearchLoading}>
                Settings
              </HeaderNavLink>
            </>
          )}

          {/* Stays visible to every visitor, logged in or not -- positioned
              right next to Sign Out so it reads as "leave, but tell me
              something first" for logged-in users, while still being
              reachable on its own for anonymous visitors. */}
          <HeaderNavLink to="/feedback" disabled={isSearchLoading}>
            Feedback
          </HeaderNavLink>

          {isLoggedIn && (
            <button
              type="button"
              className="header__signout"
              onClick={handleSignoutClick}
              disabled={isSearchLoading}
            >
              Sign Out
            </button>
          )}
        </div>
      </nav>
    </header>
  );
}

export default Header;
