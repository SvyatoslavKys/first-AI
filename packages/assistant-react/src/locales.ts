import type {
  AssistantDictionary,
  AssistantLocale
} from "./types";

export const SUPPORTED_LOCALES: AssistantLocale[] = ["en", "ru", "uk", "pl"];

export const LOCALE_LABELS: Record<AssistantLocale, string> = {
  en: "EN",
  ru: "RU",
  uk: "UA",
  pl: "PL"
};

export const DEFAULT_TRANSLATIONS: Record<AssistantLocale, AssistantDictionary> = {
  en: {
    title: "Chat with assistant",
    eyebrow: "Online assistant",
    statusText: "Ready to chat",
    welcomeMessage: "Hello! Send me a message and I will try to help.",
    placeholder: "Type a message...",
    languageLabel: "Select language",
    enableLightTheme: "Enable light theme",
    enableDarkTheme: "Enable dark theme",
    closeChat: "Close assistant chat",
    openChat: "Open assistant chat",
    sendMessage: "Send message",
    inputLabel: "Your message",
    typingLabel: "Assistant is typing",
    inputHint: "Enter — send message",
    assistantLabel: "Assistant",
    userLabel: "You",
    errorMessage: "Could not get a response. Please try again."
  },
  ru: {
    title: "Чат с ассистентом",
    eyebrow: "Онлайн-помощник",
    statusText: "Готов к диалогу",
    welcomeMessage: "Здравствуйте! Напишите сообщение — я постараюсь помочь.",
    placeholder: "Напишите сообщение...",
    languageLabel: "Выбрать язык",
    enableLightTheme: "Включить светлую тему",
    enableDarkTheme: "Включить тёмную тему",
    closeChat: "Закрыть чат с ассистентом",
    openChat: "Открыть чат с ассистентом",
    sendMessage: "Отправить сообщение",
    inputLabel: "Ваше сообщение",
    typingLabel: "Ассистент печатает",
    inputHint: "Enter — отправить сообщение",
    assistantLabel: "Ассистент",
    userLabel: "Вы",
    errorMessage: "Не удалось получить ответ. Попробуйте ещё раз."
  },
  uk: {
    title: "Чат з асистентом",
    eyebrow: "Онлайн-помічник",
    statusText: "Готовий до діалогу",
    welcomeMessage: "Вітаю! Напишіть повідомлення — я спробую допомогти.",
    placeholder: "Напишіть повідомлення...",
    languageLabel: "Вибрати мову",
    enableLightTheme: "Увімкнути світлу тему",
    enableDarkTheme: "Увімкнути темну тему",
    closeChat: "Закрити чат з асистентом",
    openChat: "Відкрити чат з асистентом",
    sendMessage: "Надіслати повідомлення",
    inputLabel: "Ваше повідомлення",
    typingLabel: "Асистент друкує",
    inputHint: "Enter — надіслати повідомлення",
    assistantLabel: "Асистент",
    userLabel: "Ви",
    errorMessage: "Не вдалося отримати відповідь. Спробуйте ще раз."
  },
  pl: {
    title: "Czat z asystentem",
    eyebrow: "Asystent online",
    statusText: "Gotowy do rozmowy",
    welcomeMessage: "Dzień dobry! Napisz wiadomość — postaram się pomóc.",
    placeholder: "Napisz wiadomość...",
    languageLabel: "Wybierz język",
    enableLightTheme: "Włącz jasny motyw",
    enableDarkTheme: "Włącz ciemny motyw",
    closeChat: "Zamknij czat z asystentem",
    openChat: "Otwórz czat z asystentem",
    sendMessage: "Wyślij wiadomość",
    inputLabel: "Twoja wiadomość",
    typingLabel: "Asystent pisze",
    inputHint: "Enter — wyślij wiadomość",
    assistantLabel: "Asystent",
    userLabel: "Ty",
    errorMessage: "Nie udało się uzyskać odpowiedzi. Spróbuj ponownie."
  }
};

export function detectBrowserLocale(): AssistantLocale {
  if (typeof navigator === "undefined") return "en";

  const browserLocales = navigator.languages?.length
    ? navigator.languages
    : [navigator.language];

  for (const browserLocale of browserLocales) {
    const language = browserLocale.toLocaleLowerCase().split("-")[0];
    if (SUPPORTED_LOCALES.includes(language as AssistantLocale)) {
      return language as AssistantLocale;
    }
  }

  return "en";
}
