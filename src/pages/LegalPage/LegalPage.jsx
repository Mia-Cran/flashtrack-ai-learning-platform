import "./LegalPage.css";
import { Link } from "react-router";
import { useT } from "../../i18n";

function LegalPage() {
  const t = useT();

  return (
    <section className="legal">
      <h1 className="legal__title">{t("legal.title")}</h1>
      <p className="legal__updated">{t("legal.updated")}</p>

      <div className="legal__content">
        <p>{t("legal.intro")}</p>

        <h2>{t("legal.whoTitle")}</h2>
        <p>{t("legal.who")}</p>

        <h2>{t("legal.whatTitle")}</h2>
        <p>{t("legal.what")}</p>

        <h2>{t("legal.aiTitle")}</h2>
        <p>{t("legal.ai")}</p>

        <h2>{t("legal.dataTitle")}</h2>
        <p>{t("legal.data")}</p>

        <h2>{t("legal.contactTitle")}</h2>
        <p>{t("legal.contact")}</p>
        <p>
          <Link to="/feedback">{t("header.feedback")}</Link>
        </p>
      </div>
    </section>
  );
}

export default LegalPage;
