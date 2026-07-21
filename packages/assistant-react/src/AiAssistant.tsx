import {
  type ChangeEvent,
  type CSSProperties,
  type FormEvent,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState
} from "react";
import { ChatIcon, CloseIcon, SendIcon } from "./icons";
import {
  DEFAULT_TRANSLATIONS,
  LOCALE_LABELS,
  SUPPORTED_LOCALES,
  detectBrowserLocale
} from "./locales";
import type {
  AiAssistantProps,
  AssistantLocale,
  AssistantTheme,
  AssistantThemeColors
} from "./types";
import { useAssistant } from "./useAssistant";

const THEME_COLOR_VARIABLES: Record<keyof AssistantThemeColors, string> = {
  primary: "--fai-primary",
  surface: "--fai-surface",
  surfaceSolid: "--fai-surface-solid",
  surfaceSoft: "--fai-surface-soft",
  text: "--fai-text",
  textMuted: "--fai-text-muted",
  border: "--fai-border",
  assistantBubble: "--fai-bot-bubble",
  assistantText: "--fai-bot-text",
  userBubble: "--fai-user-bubble",
  userText: "--fai-user-text",
  launcherBackground: "--fai-launcher-background",
  launcherText: "--fai-launcher-text",
  status: "--fai-status",
  notification: "--fai-notification"
};

function createThemeColorStyle(
  colors?: Partial<AssistantThemeColors>
): CSSProperties {
  if (!colors) return {};

  const variables: Record<string, string> = {};

  (Object.keys(THEME_COLOR_VARIABLES) as Array<keyof AssistantThemeColors>)
    .forEach((colorName) => {
      const value = colors[colorName]?.trim();
      if (value) variables[THEME_COLOR_VARIABLES[colorName]] = value;
    });

  return variables as CSSProperties;
}

function getInitialTheme(theme: AssistantTheme): "light" | "dark" {
  return theme === "dark" ? "dark" : "light";
}

export function AiAssistant({
  siteId,
  apiUrl,
  transport,
  project,
  visitorName,
  pageContext,
  eventDelivery,
  title,
  eyebrow,
  statusText,
  welcomeMessage,
  placeholder,
  locale = "auto",
  translations,
  theme = "auto",
  colors,
  position = "bottom-right",
  primaryColor,
  launcherIcon,
  showLanguageSelector = true,
  showThemeToggle = true,
  defaultOpen = false,
  className = "",
  style,
  maxHistory,
  onLocaleChange,
  onThemeChange,
  onOpenChange,
  onEvent,
  onEventDeliveryError,
  onError
}: AiAssistantProps) {
  const initialLocale = locale === "auto" ? "en" : locale;
  const [activeLocale, setActiveLocale] = useState<AssistantLocale>(initialLocale);
  const [isOpen, setIsOpen] = useState(defaultOpen);
  const [hasOpened, setHasOpened] = useState(defaultOpen);
  const [inputValue, setInputValue] = useState("");
  const [resolvedTheme, setResolvedTheme] = useState<"light" | "dark">(
    getInitialTheme(theme)
  );
  const instanceId = useId();
  const panelId = `${instanceId}-panel`;
  const titleId = `${instanceId}-title`;
  const inputId = `${instanceId}-input`;
  const panelRef = useRef<HTMLElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const launcherRef = useRef<HTMLButtonElement>(null);
  const chatBoxRef = useRef<HTMLDivElement>(null);
  const previousLocaleRef = useRef(activeLocale);
  const hasUserThemePreferenceRef = useRef(false);

  const copy = useMemo(() => ({
    ...DEFAULT_TRANSLATIONS[activeLocale],
    ...translations?.[activeLocale]
  }), [activeLocale, translations]);

  const displayedTitle = title ?? copy.title;
  const displayedEyebrow = eyebrow ?? copy.eyebrow;
  const displayedStatus = statusText ?? copy.statusText;
  const displayedWelcome = welcomeMessage ?? copy.welcomeMessage;
  const displayedPlaceholder = placeholder ?? copy.placeholder;
  const displayedUserName = visitorName?.trim() || copy.userLabel;
  const userAvatar = displayedUserName
    .slice(0, 2)
    .toLocaleUpperCase(activeLocale);

  const initialMessages = useMemo(() => ([
    { role: "assistant" as const, content: displayedWelcome }
  ]), [displayedWelcome]);

  const {
    messages,
    isLoading,
    error,
    sendMessage,
    closeConversation,
    resetMessages
  } = useAssistant({
    siteId,
    locale: activeLocale,
    apiUrl,
    transport,
    project,
    visitorName,
    pageContext,
    eventDelivery,
    initialMessages,
    maxHistory,
    onEvent,
    onEventDeliveryError,
    onError
  });

  useEffect(() => {
    if (locale !== "auto") {
      setActiveLocale(locale);
      return;
    }

    let savedLocale: string | null = null;

    try {
      savedLocale = localStorage.getItem(`first-ai-locale:${siteId}`);
    } catch {
      // Browser language detection remains available without storage.
    }

    const nextLocale = SUPPORTED_LOCALES.includes(savedLocale as AssistantLocale)
      ? savedLocale as AssistantLocale
      : detectBrowserLocale();

    setActiveLocale(nextLocale);
  }, [locale, siteId]);

  useEffect(() => {
    if (previousLocaleRef.current === activeLocale) return;

    previousLocaleRef.current = activeLocale;
    setInputValue("");
    resetMessages();
  }, [activeLocale, resetMessages]);

  useEffect(() => {
    const storageKey = `first-ai-theme:${siteId}`;
    const media = window.matchMedia("(prefers-color-scheme: dark)");
    let savedTheme: string | null = null;

    try {
      savedTheme = localStorage.getItem(storageKey);
    } catch {
      // The widget still works when storage is unavailable.
    }

    const savedThemePreference = savedTheme === "dark" || savedTheme === "light"
      ? savedTheme
      : null;
    hasUserThemePreferenceRef.current = theme === "auto" && savedThemePreference !== null;

    const updateSystemTheme = () => {
      if (theme === "auto" && !hasUserThemePreferenceRef.current) {
        setResolvedTheme(media.matches ? "dark" : "light");
      }
    };

    if (theme !== "auto") {
      setResolvedTheme(theme);
    } else if (savedThemePreference) {
      setResolvedTheme(savedThemePreference);
    } else {
      updateSystemTheme();
    }

    media.addEventListener("change", updateSystemTheme);
    return () => media.removeEventListener("change", updateSystemTheme);
  }, [siteId, theme]);

  useEffect(() => {
    if (panelRef.current) {
      panelRef.current.inert = !isOpen;
    }

    if (isOpen) {
      const focusTimer = window.setTimeout(() => inputRef.current?.focus(), 220);
      return () => window.clearTimeout(focusTimer);
    }
  }, [isOpen]);

  useEffect(() => {
    chatBoxRef.current?.scrollTo({
      top: chatBoxRef.current.scrollHeight,
      behavior: "smooth"
    });
  }, [messages, isLoading]);

  useEffect(() => {
    if (!isOpen) return;

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") closeChat(true);
    };

    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  });

  function setOpen(nextOpen: boolean) {
    setIsOpen(nextOpen);
    if (nextOpen) setHasOpened(true);
    onOpenChange?.(nextOpen);
  }

  function closeChat(returnFocus: boolean) {
    closeConversation();
    setOpen(false);
    if (returnFocus) {
      window.setTimeout(() => launcherRef.current?.focus(), 0);
    }
  }

  function changeLocale(event: ChangeEvent<HTMLSelectElement>) {
    const nextLocale = event.target.value as AssistantLocale;
    setActiveLocale(nextLocale);

    try {
      localStorage.setItem(`first-ai-locale:${siteId}`, nextLocale);
    } catch {
      // The selected locale remains active for the current page.
    }

    onLocaleChange?.(nextLocale);
  }

  function toggleTheme() {
    const nextTheme = resolvedTheme === "dark" ? "light" : "dark";
    hasUserThemePreferenceRef.current = true;
    setResolvedTheme(nextTheme);

    try {
      localStorage.setItem(`first-ai-theme:${siteId}`, nextTheme);
    } catch {
      // The selected theme remains active for the current page.
    }

    onThemeChange?.(nextTheme);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!inputValue.trim() || isLoading) return;

    const nextMessage = inputValue;
    setInputValue("");
    await sendMessage(nextMessage);
    inputRef.current?.focus();
  }

  const rootStyle = {
    ...style,
    ...(primaryColor ? { "--fai-primary": primaryColor } : {}),
    ...createThemeColorStyle(colors?.[resolvedTheme])
  } as CSSProperties;

  const rootClasses = [
    "fai-widget",
    `fai-widget--${position}`,
    `fai-widget--${resolvedTheme}`,
    isOpen ? "fai-widget--open" : "",
    hasOpened ? "fai-widget--visited" : "",
    className
  ].filter(Boolean).join(" ");

  return (
    <div className={rootClasses} style={rootStyle}>
      <section
        ref={panelRef}
        id={panelId}
        className="fai-panel"
        lang={activeLocale}
        aria-labelledby={titleId}
        aria-hidden={!isOpen}
      >
        <header className="fai-header">
          <div className="fai-avatar fai-avatar--large" aria-hidden="true">AI</div>

          <div className="fai-heading">
            <p className="fai-eyebrow">{displayedEyebrow}</p>
            <h2 id={titleId}>{displayedTitle}</h2>
            <p className="fai-status">
              <span className="fai-status-dot" />
              {displayedStatus}
            </p>
          </div>

          {showLanguageSelector && (
            <label className="fai-language">
              <span className="fai-visually-hidden">{copy.languageLabel}</span>
              <select
                value={activeLocale}
                aria-label={copy.languageLabel}
                onChange={changeLocale}
              >
                {SUPPORTED_LOCALES.map((supportedLocale) => (
                  <option value={supportedLocale} key={supportedLocale}>
                    {LOCALE_LABELS[supportedLocale]}
                  </option>
                ))}
              </select>
            </label>
          )}

          {showThemeToggle && (
            <button
              className="fai-icon-button"
              type="button"
              aria-label={resolvedTheme === "dark" ? copy.enableLightTheme : copy.enableDarkTheme}
              aria-pressed={resolvedTheme === "dark"}
              onClick={toggleTheme}
            >
              <span aria-hidden="true">{resolvedTheme === "dark" ? "☀" : "☾"}</span>
            </button>
          )}

          <button
            className="fai-icon-button"
            type="button"
            aria-label={copy.closeChat}
            onClick={() => closeChat(true)}
          >
            <CloseIcon />
          </button>
        </header>

        <div
          ref={chatBoxRef}
          className="fai-messages"
          role="log"
          aria-live="polite"
          aria-relevant="additions"
        >
          {messages.map((message) => {
            const isUser = message.role === "user";
            return (
              <div
                className={`fai-message ${isUser ? "fai-message--user" : "fai-message--assistant"}`}
                key={message.id}
              >
                <div className="fai-avatar" aria-hidden="true">{isUser ? userAvatar : "AI"}</div>
                <div className="fai-message-content">
                  <span className="fai-message-author">
                    {isUser ? displayedUserName : copy.assistantLabel}
                  </span>
                  <p className="fai-message-bubble">{message.content}</p>
                </div>
              </div>
            );
          })}

          {isLoading && (
            <div className="fai-message fai-message--assistant" aria-label={copy.typingLabel}>
              <div className="fai-avatar" aria-hidden="true">AI</div>
              <div className="fai-message-content">
                <span className="fai-message-author">{copy.assistantLabel}</span>
                <div className="fai-message-bubble fai-typing" aria-hidden="true">
                  <span /><span /><span />
                </div>
              </div>
            </div>
          )}

          {error && <p className="fai-error" role="alert">{copy.errorMessage}</p>}
        </div>

        <footer className="fai-footer">
          <form className="fai-composer" onSubmit={handleSubmit}>
            <label className="fai-visually-hidden" htmlFor={inputId}>
              {copy.inputLabel}
            </label>
            <input
              ref={inputRef}
              id={inputId}
              value={inputValue}
              onChange={(event) => setInputValue(event.target.value)}
              placeholder={displayedPlaceholder}
              maxLength={500}
              autoComplete="off"
            />
            <button
              className="fai-send"
              type="submit"
              aria-label={copy.sendMessage}
              disabled={isLoading || !inputValue.trim()}
            >
              <SendIcon />
            </button>
          </form>
          <p className="fai-hint">{copy.inputHint}</p>
        </footer>
      </section>

      <button
        ref={launcherRef}
        className="fai-launcher"
        type="button"
        aria-label={isOpen ? copy.closeChat : copy.openChat}
        aria-controls={panelId}
        aria-expanded={isOpen}
        onClick={() => isOpen ? closeChat(false) : setOpen(true)}
      >
        <span className={`fai-launcher-icon fai-launcher-icon--chat${launcherIcon ? " fai-launcher-icon--custom" : ""}`}>
          {launcherIcon ?? <ChatIcon />}
        </span>
        <span className="fai-launcher-icon fai-launcher-icon--close"><CloseIcon /></span>
        <span className="fai-notification" aria-hidden="true" />
      </button>
    </div>
  );
}
