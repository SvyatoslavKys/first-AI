import type { AssistantLocale, AssistantMessage } from "../types";
import type { ProviderAdapter } from "./types";

const mockResponses: Record<AssistantLocale, {
  greeting: string;
  default: string;
}> = {
  en: {
    greeting: "Hello! The local API is running and the model router is ready.",
    default: "The backend received your message. Add a provider key to test a real model; the conversation context will be reused automatically."
  },
  ru: {
    greeting: "Здравствуйте! Локальный API работает, а router моделей готов к тестированию.",
    default: "Backend получил сообщение. Добавьте ключ провайдера для теста реальной модели — контекст диалога будет передан ей автоматически."
  },
  uk: {
    greeting: "Вітаю! Локальний API працює, а router моделей готовий до тестування.",
    default: "Backend отримав повідомлення. Додайте ключ провайдера для тесту реальної моделі — контекст діалогу буде передано їй автоматично."
  },
  pl: {
    greeting: "Dzień dobry! Lokalne API działa, a router modeli jest gotowy do testów.",
    default: "Backend odebrał wiadomość. Dodaj klucz dostawcy, aby przetestować prawdziwy model — kontekst rozmowy zostanie przekazany automatycznie."
  }
};

const greetingWords: Record<AssistantLocale, string[]> = {
  en: ["hello", "hi", "hey"],
  ru: ["привет", "здравствуйте"],
  uk: ["привіт", "вітаю", "добрий день"],
  pl: ["cześć", "dzień dobry", "witaj"]
};

function getMockResponse(
  messages: AssistantMessage[],
  locale: AssistantLocale
): string {
  const lastMessage = messages.at(-1)?.content.toLocaleLowerCase(locale) ?? "";

  if (greetingWords[locale].some((word) => lastMessage.includes(word))) {
    return mockResponses[locale].greeting;
  }

  return mockResponses[locale].default;
}

export const mockProvider: ProviderAdapter = {
  id: "mock",

  isConfigured() {
    return true;
  },

  async generate(input, model) {
    return {
      content: getMockResponse(input.messages, input.locale),
      provider: "mock",
      model
    };
  }
};
