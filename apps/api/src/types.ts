export type AssistantRole = "user" | "assistant";
export type AssistantLocale = "en" | "ru" | "uk" | "pl";

export interface AssistantMessage {
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
  messages: AssistantMessage[];
  project?: AssistantProjectData;
  visitorName?: string;
  page?: AssistantPageContext;
}

export type AssistantEventType =
  | "assistant.exchange.completed"
  | "assistant.conversation.closed";

export interface AssistantEvent {
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
  messages: AssistantMessage[];
  exchange?: {
    user: AssistantMessage & { role: "user" };
    assistant: AssistantMessage & { role: "assistant" };
  };
}

export interface Env {
  AI: Ai;
  AI_ROUTES: string;
  ALLOWED_ORIGINS: string;
  PROVIDER_TIMEOUT_MS: string;
  GROQ_API_KEY?: string;
  GEMINI_API_KEY?: string;
}
