import { useEffect, useRef, useState } from "react";
import {
  AiAssistant,
  LOCALE_LABELS,
  SUPPORTED_LOCALES,
  detectBrowserLocale,
  type AssistantColorScheme,
  type AssistantProjectData,
  type AssistantLocale,
  type AssistantTransport
} from "@first-ai/assistant-react";
import "@first-ai/assistant-react/styles.css";
import assistantProjectJson from "./assistantProject.json";
import { demoTranslations } from "./demoLocales";
import { demoTransport } from "./demoTransport";

const apiUrl = import.meta.env.VITE_ASSISTANT_API_URL as string | undefined;
const assistantProject = assistantProjectJson as AssistantProjectData;
const eventEndpoint = apiUrl
  ? `${apiUrl.replace(/\/$/, "")}/events`
  : undefined;
const installArguments = "install @first-ai/assistant-react";
const installCommand = `npm ${installArguments}`;
const localeStorageKey = "first-ai-locale:demo";
const assistantColors: AssistantColorScheme = {
  light: {
    primary: "#615fe8",
    launcherBackground: "linear-gradient(145deg, #7775ff, #504ed1)",
    notification: "#ff647c"
  },
  dark: {
    primary: "#8b88ff",
    surface: "rgba(15, 20, 36, 0.98)",
    surfaceSolid: "#11162a",
    surfaceSoft: "#0c1120",
    text: "#f4f5ff",
    textMuted: "#a4abc0",
    border: "#293149",
    assistantBubble: "#1a2136",
    assistantText: "#f1f3fb",
    userBubble: "#6663e8",
    launcherBackground: "linear-gradient(145deg, #9794ff, #5d5ad9)",
    notification: "#ff7087"
  }
};

function DemoLauncherIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="1.7"
      aria-hidden="true"
    >
      <path d="m12 3 1.45 4.15L17.5 8.6l-4.05 1.45L12 14.2l-1.45-4.15L6.5 8.6l4.05-1.45L12 3Z" />
      <path d="M18.5 14.5 19.3 17l2.2.8-2.2.8-.8 2.4-.8-2.4-2.2-.8 2.2-.8.8-2.5ZM5 3.8l.6 1.8 1.7.6-1.7.6L5 8.5l-.6-1.7-1.7-.6 1.7-.6L5 3.8Z" />
    </svg>
  );
}

function getInitialLocale(): AssistantLocale {
  try {
    const savedLocale = localStorage.getItem(localeStorageKey) as AssistantLocale | null;
    if (savedLocale && SUPPORTED_LOCALES.includes(savedLocale)) return savedLocale;
  } catch {
    // Fall back to browser language detection.
  }

  return detectBrowserLocale();
}

function copyWithDocumentFallback(value: string): boolean {
  const input = document.createElement("textarea");
  input.value = value;
  input.setAttribute("readonly", "");
  input.style.position = "fixed";
  input.style.opacity = "0";
  document.body.appendChild(input);
  input.select();

  try {
    return document.execCommand("copy");
  } catch {
    return false;
  } finally {
    input.remove();
  }
}

export function App() {
  const [locale, setLocale] = useState<AssistantLocale>(getInitialLocale);
  const [isInstallCopied, setIsInstallCopied] = useState(false);
  const copyResetTimer = useRef<number | null>(null);
  const copy = demoTranslations[locale];
  const transport: AssistantTransport | undefined = apiUrl
    ? undefined
    : demoTransport;

  useEffect(() => {
    document.documentElement.lang = locale;
    document.title = `First AI — ${copy.badge}`;
  }, [copy.badge, locale]);

  useEffect(() => () => {
    if (copyResetTimer.current !== null) {
      window.clearTimeout(copyResetTimer.current);
    }
  }, []);

  function changeLocale(nextLocale: AssistantLocale) {
    setLocale(nextLocale);

    try {
      localStorage.setItem(localeStorageKey, nextLocale);
    } catch {
      // The selected locale remains active for the current page.
    }
  }

  async function copyInstallCommand() {
    let copied = false;

    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(installCommand);
        copied = true;
      } else {
        copied = copyWithDocumentFallback(installCommand);
      }
    } catch {
      copied = copyWithDocumentFallback(installCommand);
    }

    if (!copied) return;

    setIsInstallCopied(true);
    if (copyResetTimer.current !== null) {
      window.clearTimeout(copyResetTimer.current);
    }
    copyResetTimer.current = window.setTimeout(() => {
      setIsInstallCopied(false);
      copyResetTimer.current = null;
    }, 1800);
  }

  return (
    <main className="demo-page">
      <header className="demo-toolbar">
        <span className="demo-brand">First AI</span>
        <nav className="demo-languages" aria-label={copy.languageLabel}>
          {SUPPORTED_LOCALES.map((supportedLocale) => (
            <button
              type="button"
              className={supportedLocale === locale ? "is-active" : ""}
              aria-pressed={supportedLocale === locale}
              onClick={() => changeLocale(supportedLocale)}
              key={supportedLocale}
            >
              {LOCALE_LABELS[supportedLocale]}
            </button>
          ))}
        </nav>
      </header>

      <section className="demo-hero" id="overview">
        <span className="demo-badge">{copy.badge}</span>
        <h1>{copy.title}</h1>
        <p>{copy.description}</p>

        <div className="demo-install" id="integration" aria-label={copy.installLabel}>
          <span>npm</span>
          <code>{installArguments}</code>
          <button
            className={`demo-install-copy${isInstallCopied ? " is-copied" : ""}`}
            type="button"
            aria-label={isInstallCopied ? copy.copiedInstall : copy.copyInstall}
            title={isInstallCopied ? copy.copiedInstall : copy.copyInstall}
            onClick={copyInstallCommand}
          >
            {isInstallCopied ? (
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <path d="m5 12.5 4.2 4.2L19 7" />
              </svg>
            ) : (
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <rect x="8" y="8" width="11" height="11" rx="2" />
                <path d="M16 8V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h2" />
              </svg>
            )}
            <span aria-live="polite">
              {isInstallCopied ? copy.copiedInstall : copy.copyInstall}
            </span>
          </button>
        </div>
      </section>

      <section className="demo-features" id="features" aria-label={copy.featuresLabel}>
        {copy.features.map((feature, index) => (
          <article key={feature.title}>
            <span>{String(index + 1).padStart(2, "0")}</span>
            <h2>{feature.title}</h2>
            <p>{feature.description}</p>
          </article>
        ))}
      </section>

      <AiAssistant
        siteId="demo"
        apiUrl={apiUrl}
        transport={transport}
        project={assistantProject}
        visitorName="Ivan"
        eventDelivery={eventEndpoint
          ? {
              type: "backend",
              endpoint: eventEndpoint
            }
          : undefined}
        locale={locale}
        title="First AI"
        theme="auto"
        colors={assistantColors}
        launcherIcon={<DemoLauncherIcon />}
        onLocaleChange={changeLocale}
        onEvent={(event) => console.info("Assistant event:", event)}
        onEventDeliveryError={(error, event) => {
          console.error("Assistant event delivery failed:", event.type, error);
        }}
        onError={(error) => console.error("Assistant error:", error)}
      />
    </main>
  );
}
