import type { CSSProperties, ReactNode } from "react";

export type AssistantRole = "user" | "assistant";
export type AssistantLocale = "en" | "ru" | "uk" | "pl";
export type AssistantLocaleOption = AssistantLocale | "auto";

export interface AssistantMessage {
  id: string;
  role: AssistantRole;
  content: string;
}

export interface AssistantMessageInput {
  role: AssistantRole;
  content: string;
}

export type AssistantProjectType =
  | "website"
  | "web-app"
  | "mobile-app"
  | "service"
  | "other";

export interface AssistantProjectPrice {
  amount?: number;
  from?: number;
  to?: number;
  currency: string;
  unit?: string;
  note?: string;
}

export interface AssistantProjectService {
  id: string;
  name: string;
  description: string;
  price?: AssistantProjectPrice;
  deliveryTime?: string;
  orderUrl?: string;
}

export interface AssistantProjectFaqItem {
  question: string;
  answer: string;
}

export interface AssistantProjectPage {
  id: string;
  title: string;
  url: string;
  description?: string;
}

export interface AssistantProjectContact {
  type: "email" | "phone" | "telegram" | "url" | "other";
  value: string;
  label?: string;
}

export interface AssistantProjectData {
  schemaVersion: number;
  id: string;
  name: string;
  type: AssistantProjectType;
  description: string;
  purpose: string;
  targetAudience?: string;
  capabilities: string[];
  goals: string[];
  services: AssistantProjectService[];
  faq: AssistantProjectFaqItem[];
  pages: AssistantProjectPage[];
  contacts: AssistantProjectContact[];
  assistantRules?: string[];
}

export interface AssistantPageContext {
  url: string;
  path: string;
  title: string;
}

export interface AssistantRequest {
  siteId: string;
  sessionId: string;
  locale: AssistantLocale;
  messages: AssistantMessageInput[];
  project?: AssistantProjectData;
  visitorName?: string;
  page?: AssistantPageContext;
}

export type AssistantEventType =
  | "assistant.exchange.completed"
  | "assistant.conversation.closed";

export interface AssistantEventBase {
  schemaVersion: 1;
  id: string;
  type: AssistantEventType;
  occurredAt: string;
  siteId: string;
  projectId: string;
  sessionId: string;
  locale: AssistantLocale;
  visitorName?: string;
  page?: AssistantPageContext;
  messages: AssistantMessageInput[];
}

export interface AssistantExchangeCompletedEvent extends AssistantEventBase {
  type: "assistant.exchange.completed";
  exchange: {
    user: AssistantMessageInput & { role: "user" };
    assistant: AssistantMessageInput & { role: "assistant" };
  };
}

export interface AssistantConversationClosedEvent extends AssistantEventBase {
  type: "assistant.conversation.closed";
}

export type AssistantEvent =
  | AssistantExchangeCompletedEvent
  | AssistantConversationClosedEvent;

export interface AssistantBackendEventDelivery {
  type: "backend";
  endpoint: string;
  events?: AssistantEventType[];
}

export type AssistantEventDelivery = AssistantBackendEventDelivery;

export interface AssistantResponse {
  message: AssistantMessageInput & { role: "assistant" };
  meta?: {
    provider: "groq" | "gemini" | "workers-ai" | "mock";
    model: string;
    attempts: Array<{
      provider: "groq" | "gemini" | "workers-ai" | "mock";
      model: string;
      status: "cooldown" | "failed" | "skipped" | "success";
      errorCode?: string;
    }>;
  };
}

export type AssistantTransport = (
  request: AssistantRequest,
  signal?: AbortSignal
) => Promise<string>;

export type AssistantTheme = "light" | "dark" | "auto";
export type AssistantPosition = "bottom-right" | "bottom-left";

export interface AssistantThemeColors {
  primary: string;
  surface: string;
  surfaceSolid: string;
  surfaceSoft: string;
  text: string;
  textMuted: string;
  border: string;
  assistantBubble: string;
  assistantText: string;
  userBubble: string;
  userText: string;
  launcherBackground: string;
  launcherText: string;
  status: string;
  notification: string;
}

export interface AssistantColorScheme {
  light?: Partial<AssistantThemeColors>;
  dark?: Partial<AssistantThemeColors>;
}

export interface AssistantDictionary {
  title: string;
  eyebrow: string;
  statusText: string;
  welcomeMessage: string;
  placeholder: string;
  languageLabel: string;
  enableLightTheme: string;
  enableDarkTheme: string;
  closeChat: string;
  openChat: string;
  sendMessage: string;
  inputLabel: string;
  typingLabel: string;
  inputHint: string;
  assistantLabel: string;
  userLabel: string;
  errorMessage: string;
}

export interface AiAssistantProps {
  siteId: string;
  apiUrl?: string;
  transport?: AssistantTransport;
  project?: AssistantProjectData;
  visitorName?: string;
  pageContext?: Partial<AssistantPageContext>;
  eventDelivery?: AssistantEventDelivery;
  title?: string;
  eyebrow?: string;
  statusText?: string;
  welcomeMessage?: string;
  placeholder?: string;
  locale?: AssistantLocaleOption;
  translations?: Partial<Record<AssistantLocale, Partial<AssistantDictionary>>>;
  theme?: AssistantTheme;
  colors?: AssistantColorScheme;
  position?: AssistantPosition;
  primaryColor?: string;
  launcherIcon?: ReactNode;
  showLanguageSelector?: boolean;
  showThemeToggle?: boolean;
  defaultOpen?: boolean;
  className?: string;
  style?: CSSProperties;
  maxHistory?: number;
  onLocaleChange?: (locale: AssistantLocale) => void;
  onThemeChange?: (theme: Exclude<AssistantTheme, "auto">) => void;
  onOpenChange?: (isOpen: boolean) => void;
  onEvent?: (event: AssistantEvent) => void | Promise<void>;
  onEventDeliveryError?: (error: Error, event: AssistantEvent) => void;
  onError?: (error: Error) => void;
}
