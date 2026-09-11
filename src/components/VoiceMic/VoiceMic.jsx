import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router";
import { IconMicrophone } from "@tabler/icons-react";
import { useLanguage, useT } from "../../i18n";
import { stopSpeech } from "../../utils/speech";
import {
  canUseVoiceRecognition,
  getSpeechRecognition,
  parseVoiceCommand,
} from "../../utils/voiceCommands";
import "./VoiceMic.css";

function VoiceMic({ disabled = false }) {
  const t = useT();
  const language = useLanguage();
  const navigate = useNavigate();
  const recognitionRef = useRef(null);
  const statusTimerRef = useRef(null);
  const [supported] = useState(() => canUseVoiceRecognition());
  const [listening, setListening] = useState(false);
  const [status, setStatus] = useState("");

  function clearStatusTimer() {
    if (statusTimerRef.current) {
      clearTimeout(statusTimerRef.current);
      statusTimerRef.current = null;
    }
  }

  function showStatus(text) {
    clearStatusTimer();
    setStatus(text);
    statusTimerRef.current = setTimeout(() => {
      setStatus("");
      statusTimerRef.current = null;
    }, 3500);
  }

  function stopListening() {
    const recognition = recognitionRef.current;
    recognitionRef.current = null;
    if (recognition) {
      recognition.onend = null;
      recognition.onresult = null;
      recognition.onerror = null;
      try {
        recognition.stop();
      } catch {
        // Already stopped.
      }
    }
    setListening(false);
  }

  useEffect(() => {
    return () => {
      clearStatusTimer();
      const recognition = recognitionRef.current;
      recognitionRef.current = null;
      if (recognition) {
        recognition.onend = null;
        try {
          recognition.stop();
        } catch {
          // Already stopped.
        }
      }
    };
  }, []);

  function handleResult(transcript) {
    setListening(false);
    const command = parseVoiceCommand(transcript);
    if (!command) {
      showStatus(t("voice.missed"));
      return;
    }

    if (command.type === "search") {
      showStatus(t("voice.searching", { term: command.term }));
      navigate("/search", { state: { searchTerm: command.term } });
      return;
    }

    showStatus(t(command.cueKey));
    navigate(command.path);
  }

  function startListening() {
    const SpeechRecognition = getSpeechRecognition();
    if (!SpeechRecognition || disabled) {
      return;
    }

    stopSpeech();
    stopListening();

    const recognition = new SpeechRecognition();
    recognition.lang = language === "es" ? "es-US" : "en-US";
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;
    recognition.continuous = false;

    recognition.onstart = () => {
      setListening(true);
    };
    recognition.onend = () => {
      recognitionRef.current = null;
      setListening(false);
    };
    recognition.onerror = (event) => {
      recognitionRef.current = null;
      setListening(false);
      if (event.error === "not-allowed") {
        showStatus(t("voice.micBlocked"));
        return;
      }
      if (event.error === "no-speech" || event.error === "aborted") {
        showStatus(t("voice.missed"));
      }
    };
    recognition.onresult = (event) => {
      const transcript = event.results?.[0]?.[0]?.transcript || "";
      handleResult(transcript);
    };

    recognitionRef.current = recognition;
    try {
      recognition.start();
    } catch {
      setListening(false);
    }
  }

  function handleClick() {
    if (disabled) {
      return;
    }
    if (!supported) {
      showStatus(t("voice.chromeOnly"));
      return;
    }
    if (listening) {
      stopListening();
      return;
    }
    startListening();
  }

  const message = listening ? t("voice.listening") : status;

  return (
    <div className="voice-mic">
      <button
        type="button"
        className={
          listening
            ? "voice-mic__button voice-mic__button--listening"
            : "voice-mic__button"
        }
        aria-label={listening ? t("voice.stop") : t("voice.listen")}
        aria-pressed={listening}
        title={supported ? t("voice.title") : t("voice.chromeOnly")}
        disabled={disabled}
        data-tour="voice"
        onClick={handleClick}
      >
        <IconMicrophone size={22} stroke={2} aria-hidden="true" />
      </button>
      <Link className="voice-mic__help" to="/voice">
        {t("voice.whatCanISay")}
      </Link>
      <span className="voice-mic__status" aria-live="polite">{message}</span>
    </div>
  );
}

export default VoiceMic;
