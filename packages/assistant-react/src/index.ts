import "./styles.css";

export { AiAssistant } from "./AiAssistant";
export { createApiTransport } from "./api";
export {
  DEFAULT_TRANSLATIONS,
  LOCALE_LABELS,
  SUPPORTED_LOCALES,
  detectBrowserLocale
} from "./locales";
export { useAssistant } from "./useAssistant";
export type {
  AiAssistantProps,
  AssistantDictionary,
  AssistantEvent,
  AssistantEventDelivery,
  AssistantEventType,
  AssistantExchangeCompletedEvent,
  AssistantConversationClosedEvent,
  AssistantColorScheme,
  AssistantLocale,
  AssistantLocaleOption,
  AssistantMessage,
  AssistantMessageInput,
  AssistantPosition,
  AssistantPageContext,
  AssistantProjectContact,
  AssistantProjectData,
  AssistantProjectFaqItem,
  AssistantProjectPage,
  AssistantProjectPrice,
  AssistantProjectService,
  AssistantProjectType,
  AssistantRequest,
  AssistantResponse,
  AssistantRole,
  AssistantTheme,
  AssistantThemeColors,
  AssistantTransport
} from "./types";
