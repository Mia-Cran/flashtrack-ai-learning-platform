import "./VoicePage.css";
import { useLanguage, useT } from "../../i18n";
import { VOICE_PAGES } from "../../utils/voiceCommands";

function VoicePage() {
  const t = useT();
  const language = useLanguage();

  return (
    <section className="voice-page">
      <h1 className="voice-page__title">{t("voicePage.title")}</h1>
      <p className="voice-page__intro">{t("voicePage.intro")}</p>

      <ol className="voice-page__patterns">
        <li>{t("voicePage.patternTake")}</li>
        <li>{t("voicePage.patternWhere")}</li>
        <li>{t("voicePage.patternShort")}</li>
      </ol>

      <h2 className="voice-page__names-title">{t("voicePage.namesTitle")}</h2>
      <ul className="voice-page__names">
        {VOICE_PAGES.map((page) => (
          <li key={page.path}>
            {language === "es" ? page.nameEs : page.nameEn}
          </li>
        ))}
      </ul>

      <p className="voice-page__example">{t("voicePage.searchExample")}</p>
      <p className="voice-page__note">{t("voicePage.chrome")}</p>
    </section>
  );
}

export default VoicePage;
