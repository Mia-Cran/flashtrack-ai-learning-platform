import mariaPhoto from "../../assets/maria-photo.png";
import "./AboutPage.css";
import { useT } from "../../i18n";

function AboutPage() {
  const t = useT();
  return (
    <section className="about">
      <div className="about__image-circle">
        <img className="about__image"
         src={mariaPhoto}
         alt={t("about.alt")} />
      </div>

      <h1 className="about__title">
        {t("about.title")} <span className="about__brand">FlashTrack</span>
      </h1>

      <div className="about__content">
        <p>{t("about.p1")}</p>
        <p>{t("about.p2")}</p>
        <p>{t("about.p3")}</p>
        <p>{t("about.p4")}</p>
        <p>{t("about.age")}</p>
      </div>
    </section>
  );
}

export default AboutPage;