import { NavLink, useLocation, useNavigate } from "react-router";
import SubjectsNavDropdown from "../SubjectsNavDropdown/SubjectsNavDropdown";
import "./Header.css";
import { useT } from "../../i18n";

function HeaderNavLink({
  to,
  disabled,
  alsoActive = [],
  tourId,
  isTourTarget,
  children,
}) {
  const location = useLocation();
  const extraActive = alsoActive.includes(location.pathname);

  return (
    <NavLink
      className={({ isActive }) => {
        const classes = ["header__link"];

        if (isActive || extraActive) {
          classes.push("header__link--active");
        }

        if (disabled) {
          classes.push("header__link--disabled");
        }

        if (isTourTarget) {
          classes.push("header__link--spotlight");
        }

        return classes.join(" ");
      }}
      to={to}
      end
      data-tour={tourId}
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

function Header({
  isLoggedIn,
  onSignout,
  isSearchLoading = false,
  tourHighlightId = null,
}) {
  const navigate = useNavigate();
  const t = useT();

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
          <HeaderNavLink
            to="/"
            tourId="welcome"
            isTourTarget={tourHighlightId === "welcome"}
            disabled={isSearchLoading}
          >
            {t("header.welcome")}
          </HeaderNavLink>

          {isLoggedIn && (
            <HeaderNavLink
              to="/home"
              tourId="home"
              isTourTarget={tourHighlightId === "home"}
              disabled={isSearchLoading}
            >
              {t("header.home")}
            </HeaderNavLink>
          )}

          <HeaderNavLink
            to="/search"
            tourId="search"
            isTourTarget={tourHighlightId === "search"}
            disabled={isSearchLoading}
          >
            {t("header.search")}
          </HeaderNavLink>

          {isLoggedIn && (
            <>
              <HeaderNavLink
                to="/saved"
                tourId="saved"
                isTourTarget={tourHighlightId === "saved"}
                disabled={isSearchLoading}
              >
                {t("header.saved")}
              </HeaderNavLink>

              <HeaderNavLink
                to="/games"
                tourId="games"
                alsoActive={["/match", "/spot", "/hear"]}
                isTourTarget={tourHighlightId === "games"}
                disabled={isSearchLoading}
              >
                {t("header.games")}
              </HeaderNavLink>

              <HeaderNavLink
                to="/about"
                tourId="about"
                isTourTarget={tourHighlightId === "about"}
                disabled={isSearchLoading}
              >
                {t("header.about")}
              </HeaderNavLink>

              <HeaderNavLink
                to="/settings"
                tourId="settings"
                isTourTarget={tourHighlightId === "settings"}
                disabled={isSearchLoading}
              >
                {t("header.settings")}
              </HeaderNavLink>
            </>
          )}

          {/* Stays visible to every visitor, logged in or not -- positioned
              right next to Sign Out so it reads as "leave, but tell me
              something first" for logged-in users, while still being
              reachable on its own for anonymous visitors. */}
          <HeaderNavLink
            to="/feedback"
            tourId="feedback"
            isTourTarget={tourHighlightId === "feedback"}
            disabled={isSearchLoading}
          >
            {t("header.feedback")}
          </HeaderNavLink>

          {isLoggedIn && (
            <button
              type="button"
              className="header__signout"
              onClick={handleSignoutClick}
              disabled={isSearchLoading}
            >
              {t("header.signOut")}
            </button>
          )}
        </div>
      </nav>
    </header>
  );
}

export default Header;
