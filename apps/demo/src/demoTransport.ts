import type {
  AssistantLocale,
  AssistantTransport
} from "@first-ai/assistant-react";

const responses: Record<AssistantLocale, Record<string, string>> = {
  en: {
    "hello": "Hello! I am already running as a React assistant component.",
    "how are you": "I am doing well — the interface and assistant logic are now separated.",
    "what can you do": "I am demonstrating the library now. The next step is connecting a real AI backend.",
    "bye": "Goodbye! I will stay in the bottom-right corner."
  },
  ru: {
    "привет": "Здравствуйте! Я уже работаю как React-компонент помощника.",
    "как дела": "Всё хорошо — интерфейс и логика помощника теперь разделены.",
    "что ты можешь делать": "Сейчас я демонстрирую библиотеку. Следующий шаг — подключить настоящий AI backend.",
    "пока": "До свидания! Я останусь в правом нижнем углу."
  },
  uk: {
    "привіт": "Вітаю! Я вже працюю як React-компонент помічника.",
    "як справи": "Усе добре — інтерфейс і логіка помічника тепер розділені.",
    "що ти вмієш": "Зараз я демонструю бібліотеку. Наступний крок — підключити справжній AI backend.",
    "бувай": "До побачення! Я залишуся у правому нижньому куті."
  },
  pl: {
    "cześć": "Cześć! Działam już jako komponent React asystenta.",
    "jak się masz": "Wszystko dobrze — interfejs i logika asystenta są teraz rozdzielone.",
    "co potrafisz": "Teraz prezentuję bibliotekę. Następnym krokiem jest podłączenie prawdziwego backendu AI.",
    "do widzenia": "Do widzenia! Zostanę w prawym dolnym rogu."
  }
};

const fallbackResponses: Record<AssistantLocale, string> = {
  en: "This is a local demo response. Once the API is running, a real model will answer here.",
  ru: "Пока это локальный demo-ответ. После запуска API здесь будет отвечать настоящая модель.",
  uk: "Поки що це локальна demo-відповідь. Після запуску API тут відповідатиме справжня модель.",
  pl: "Na razie jest to lokalna odpowiedź demo. Po uruchomieniu API odpowie tutaj prawdziwy model."
};

function normalizeMessage(message: string, locale: AssistantLocale): string {
  return message
    .trim()
    .toLocaleLowerCase(locale)
    .replace(/[.!?]+$/g, "")
    .replace(/\s+/g, " ");
}

export const demoTransport: AssistantTransport = async (request, signal) => {
  await new Promise<void>((resolve, reject) => {
    const timer = window.setTimeout(resolve, 650);

    signal?.addEventListener("abort", () => {
      window.clearTimeout(timer);
      reject(new DOMException("Request aborted", "AbortError"));
    }, { once: true });
  });

  const lastMessage = request.messages.at(-1)?.content ?? "";
  const normalizedMessage = normalizeMessage(lastMessage, request.locale);

  return responses[request.locale][normalizedMessage]
    ?? fallbackResponses[request.locale];
};
