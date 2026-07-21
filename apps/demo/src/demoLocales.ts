import type { AssistantLocale } from "@first-ai/assistant-react";

interface DemoFeature {
  title: string;
  description: string;
}

interface DemoDictionary {
  languageLabel: string;
  badge: string;
  title: string;
  description: string;
  installLabel: string;
  copyInstall: string;
  copiedInstall: string;
  featuresLabel: string;
  features: [DemoFeature, DemoFeature, DemoFeature];
}

export const demoTranslations: Record<AssistantLocale, DemoDictionary> = {
  en: {
    languageLabel: "Page language",
    badge: "React component · v0.1",
    title: "An assistant you can connect with one line.",
    description: "The widget on the right is a standalone React library. This page demonstrates how it works on top of any interface.",
    installLabel: "Component installation example",
    copyInstall: "Copy",
    copiedInstall: "Copied",
    featuresLabel: "Component features",
    features: [
      { title: "Isolated UI", description: "Component styles use their own prefix and do not affect the host page." },
      { title: "Replaceable backend", description: "The component works with an API or a custom transport function." },
      { title: "Ready to integrate", description: "Configure the language, theme, color, position and interface text." }
    ]
  },
  ru: {
    languageLabel: "Язык страницы",
    badge: "React-компонент · v0.1",
    title: "Помощник, который подключается одной строкой.",
    description: "Виджет справа — отдельная React-библиотека. Эта страница демонстрирует, как компонент работает поверх любого интерфейса.",
    installLabel: "Пример подключения компонента",
    copyInstall: "Копировать",
    copiedInstall: "Скопировано",
    featuresLabel: "Возможности компонента",
    features: [
      { title: "Изолированный UI", description: "Стили компонента имеют собственный префикс и не меняют страницу." },
      { title: "Сменный backend", description: "Компонент работает с API или с переданной transport-функцией." },
      { title: "Готов к интеграции", description: "Настраиваются язык, тема, цвет, положение и тексты интерфейса." }
    ]
  },
  uk: {
    languageLabel: "Мова сторінки",
    badge: "React-компонент · v0.1",
    title: "Помічник, який підключається одним рядком.",
    description: "Віджет праворуч — окрема React-бібліотека. Ця сторінка демонструє, як компонент працює поверх будь-якого інтерфейсу.",
    installLabel: "Приклад підключення компонента",
    copyInstall: "Копіювати",
    copiedInstall: "Скопійовано",
    featuresLabel: "Можливості компонента",
    features: [
      { title: "Ізольований UI", description: "Стилі компонента мають власний префікс і не змінюють сторінку." },
      { title: "Змінний backend", description: "Компонент працює з API або з переданою transport-функцією." },
      { title: "Готовий до інтеграції", description: "Налаштовуються мова, тема, колір, розташування та тексти інтерфейсу." }
    ]
  },
  pl: {
    languageLabel: "Język strony",
    badge: "Komponent React · v0.1",
    title: "Asystent, którego podłączysz jedną linią.",
    description: "Widżet po prawej to niezależna biblioteka React. Ta strona pokazuje, jak komponent działa na dowolnym interfejsie.",
    installLabel: "Przykład instalacji komponentu",
    copyInstall: "Kopiuj",
    copiedInstall: "Skopiowano",
    featuresLabel: "Możliwości komponentu",
    features: [
      { title: "Izolowany UI", description: "Style komponentu mają własny prefiks i nie wpływają na stronę." },
      { title: "Wymienny backend", description: "Komponent współpracuje z API lub własną funkcją transport." },
      { title: "Gotowy do integracji", description: "Możesz ustawić język, motyw, kolor, pozycję i teksty interfejsu." }
    ]
  }
};
