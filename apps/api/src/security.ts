import type {
  AssistantEvent,
  AssistantLocale,
  AssistantMessage,
  AssistantPageContext,
  AssistantProjectContact,
  AssistantProjectData,
  AssistantProjectFaqItem,
  AssistantProjectPage,
  AssistantProjectPrice,
  AssistantProjectService,
  AssistantProjectType,
  AssistantRequest,
  AssistantRole
} from "./types";

const MAX_MESSAGE_LENGTH = 1_200;
const MAX_HISTORY_LENGTH = 16;
const MAX_PROJECT_JSON_LENGTH = 15_000;
const IDENTIFIER_PATTERN = /^[a-z0-9-]{1,64}$/;
const SUPPORTED_LOCALES: AssistantLocale[] = ["en", "ru", "uk", "pl"];
const PROJECT_TYPES: AssistantProjectType[] = [
  "website",
  "web-app",
  "mobile-app",
  "service",
  "other"
];
const CONTACT_TYPES: AssistantProjectContact["type"][] = [
  "email",
  "phone",
  "telegram",
  "url",
  "other"
];

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function requiredString(value: unknown, maxLength: number): string | null {
  if (typeof value !== "string") return null;
  const normalized = value.trim();
  return normalized && normalized.length <= maxLength ? normalized : null;
}

function optionalString(
  value: unknown,
  maxLength: number
): string | undefined | null {
  if (value === undefined) return undefined;
  return requiredString(value, maxLength);
}

function stringArray(
  value: unknown,
  maxItems: number,
  maxItemLength: number
): string[] | null {
  if (!Array.isArray(value) || value.length > maxItems) return null;

  const result: string[] = [];
  for (const item of value) {
    const parsed = requiredString(item, maxItemLength);
    if (!parsed) return null;
    result.push(parsed);
  }

  return result;
}

function safeProjectUrl(value: unknown): string | null {
  const url = requiredString(value, 500);
  if (!url) return null;
  if (url.startsWith("/") && !url.startsWith("//")) return url;

  try {
    const parsed = new URL(url);
    return parsed.protocol === "http:" || parsed.protocol === "https:"
      ? url
      : null;
  } catch {
    return null;
  }
}

function nonNegativeNumber(value: unknown): number | undefined | null {
  if (value === undefined) return undefined;
  return typeof value === "number" && Number.isFinite(value) && value >= 0
    ? value
    : null;
}

function parsePrice(value: unknown): AssistantProjectPrice | null {
  if (!isRecord(value)) return null;

  const currency = requiredString(value.currency, 12);
  const amount = nonNegativeNumber(value.amount);
  const from = nonNegativeNumber(value.from);
  const to = nonNegativeNumber(value.to);
  const unit = optionalString(value.unit, 80);
  const note = optionalString(value.note, 300);

  if (!currency || amount === null || from === null || to === null
    || unit === null || note === null) {
    return null;
  }

  return {
    currency,
    ...(amount !== undefined ? { amount } : {}),
    ...(from !== undefined ? { from } : {}),
    ...(to !== undefined ? { to } : {}),
    ...(unit !== undefined ? { unit } : {}),
    ...(note !== undefined ? { note } : {})
  };
}

function parseService(value: unknown): AssistantProjectService | null {
  if (!isRecord(value)) return null;

  const id = requiredString(value.id, 64);
  const name = requiredString(value.name, 120);
  const description = requiredString(value.description, 1_200);
  const price = value.price === undefined ? undefined : parsePrice(value.price);
  const deliveryTime = optionalString(value.deliveryTime, 200);
  const orderUrl = value.orderUrl === undefined
    ? undefined
    : safeProjectUrl(value.orderUrl);

  if (!id || !IDENTIFIER_PATTERN.test(id) || !name || !description
    || price === null || deliveryTime === null || orderUrl === null) {
    return null;
  }

  return {
    id,
    name,
    description,
    ...(price ? { price } : {}),
    ...(deliveryTime !== undefined ? { deliveryTime } : {}),
    ...(orderUrl !== undefined ? { orderUrl } : {})
  };
}

function parseFaq(value: unknown): AssistantProjectFaqItem | null {
  if (!isRecord(value)) return null;
  const question = requiredString(value.question, 500);
  const answer = requiredString(value.answer, 1_500);
  return question && answer ? { question, answer } : null;
}

function parsePage(value: unknown): AssistantProjectPage | null {
  if (!isRecord(value)) return null;
  const id = requiredString(value.id, 64);
  const title = requiredString(value.title, 160);
  const url = safeProjectUrl(value.url);
  const description = optionalString(value.description, 500);

  if (!id || !IDENTIFIER_PATTERN.test(id) || !title || !url
    || description === null) {
    return null;
  }

  return {
    id,
    title,
    url,
    ...(description !== undefined ? { description } : {})
  };
}

function parseContact(value: unknown): AssistantProjectContact | null {
  if (!isRecord(value)) return null;
  const type = value.type as AssistantProjectContact["type"];
  const contactValue = requiredString(value.value, 300);
  const label = optionalString(value.label, 100);

  if (!CONTACT_TYPES.includes(type) || !contactValue || label === null) {
    return null;
  }

  return {
    type,
    value: contactValue,
    ...(label !== undefined ? { label } : {})
  };
}

function parsedArray<T>(
  value: unknown,
  maxItems: number,
  parser: (item: unknown) => T | null
): T[] | null {
  if (!Array.isArray(value) || value.length > maxItems) return null;

  const result: T[] = [];
  for (const item of value) {
    const parsed = parser(item);
    if (!parsed) return null;
    result.push(parsed);
  }

  return result;
}

export function parseProjectData(
  value: unknown,
  expectedSiteId: string
): AssistantProjectData | null {
  if (!isRecord(value)) return null;

  try {
    if (JSON.stringify(value).length > MAX_PROJECT_JSON_LENGTH) return null;
  } catch {
    return null;
  }

  const id = requiredString(value.id, 64);
  const name = requiredString(value.name, 120);
  const type = value.type as AssistantProjectType;
  const description = requiredString(value.description, 2_000);
  const purpose = requiredString(value.purpose, 1_000);
  const targetAudience = optionalString(value.targetAudience, 500);
  const capabilities = stringArray(value.capabilities, 20, 300);
  const goals = stringArray(value.goals, 20, 300);
  const services = parsedArray(value.services, 20, parseService);
  const faq = parsedArray(value.faq, 50, parseFaq);
  const pages = parsedArray(value.pages, 50, parsePage);
  const contacts = parsedArray(value.contacts, 20, parseContact);
  const assistantRules = value.assistantRules === undefined
    ? undefined
    : stringArray(value.assistantRules, 20, 300);

  if (value.schemaVersion !== 1 || !id || id !== expectedSiteId
    || !IDENTIFIER_PATTERN.test(id) || !name || !PROJECT_TYPES.includes(type)
    || !description || !purpose || targetAudience === null
    || !capabilities || !goals || !services || !faq || !pages || !contacts
    || assistantRules === null) {
    return null;
  }

  return {
    schemaVersion: 1,
    id,
    name,
    type,
    description,
    purpose,
    ...(targetAudience !== undefined ? { targetAudience } : {}),
    capabilities,
    goals,
    services,
    faq,
    pages,
    contacts,
    ...(assistantRules !== undefined ? { assistantRules } : {})
  };
}

function parsePageContext(value: unknown): AssistantPageContext | null {
  if (!isRecord(value)) return null;
  const url = safeProjectUrl(value.url);
  const path = requiredString(value.path, 1_000);
  const title = requiredString(value.title, 300);
  return url && path && title ? { url, path, title } : null;
}

function parseMessage(
  value: unknown,
  requiredRole?: AssistantRole
): AssistantMessage | null {
  if (!isRecord(value)) return null;
  if (value.role !== "user" && value.role !== "assistant") return null;
  if (requiredRole && value.role !== requiredRole) return null;

  const content = requiredString(value.content, MAX_MESSAGE_LENGTH);
  return content ? { role: value.role, content } : null;
}

function parseMessages(
  value: unknown,
  requireLastUser: boolean
): AssistantMessage[] | null {
  if (!Array.isArray(value) || value.length === 0) return null;

  const messages: AssistantMessage[] = [];
  for (const rawMessage of value.slice(-MAX_HISTORY_LENGTH)) {
    const message = parseMessage(rawMessage);
    if (!message) return null;
    messages.push(message);
  }

  if (requireLastUser && messages[messages.length - 1]?.role !== "user") {
    return null;
  }

  return messages;
}

export function isAllowedOrigin(origin: string, allowedOrigins: string): boolean {
  if (!origin) return false;

  return allowedOrigins
    .split(",")
    .map((allowedOrigin) => allowedOrigin.trim())
    .filter(Boolean)
    .includes(origin);
}

export function parseAssistantRequest(value: unknown): AssistantRequest | null {
  if (!isRecord(value)) return null;

  const siteId = requiredString(value.siteId, 64);
  const sessionId = requiredString(value.sessionId, 128);
  const locale = value.locale as AssistantLocale;
  const messages = parseMessages(value.messages, true);
  const project = value.project === undefined
    ? undefined
    : siteId ? parseProjectData(value.project, siteId) : null;
  const visitorName = optionalString(value.visitorName, 100);
  const page = value.page === undefined ? undefined : parsePageContext(value.page);

  if (!siteId || !IDENTIFIER_PATTERN.test(siteId) || !sessionId
    || !SUPPORTED_LOCALES.includes(locale) || !messages || project === null
    || visitorName === null || page === null) {
    return null;
  }

  return {
    siteId,
    sessionId,
    locale,
    messages,
    ...(project ? { project } : {}),
    ...(visitorName !== undefined ? { visitorName } : {}),
    ...(page !== undefined ? { page } : {})
  };
}

export function parseAssistantEvent(value: unknown): AssistantEvent | null {
  if (!isRecord(value)) return null;

  const type = value.type;
  const id = requiredString(value.id, 128);
  const occurredAt = requiredString(value.occurredAt, 50);
  const siteId = requiredString(value.siteId, 64);
  const projectId = requiredString(value.projectId, 64);
  const sessionId = requiredString(value.sessionId, 128);
  const locale = value.locale as AssistantLocale;
  const visitorName = optionalString(value.visitorName, 100);
  const page = value.page === undefined ? undefined : parsePageContext(value.page);
  const messages = parseMessages(value.messages, false);

  if (value.schemaVersion !== 1
    || (type !== "assistant.exchange.completed"
      && type !== "assistant.conversation.closed")
    || !id || !occurredAt || Number.isNaN(Date.parse(occurredAt))
    || !siteId || !IDENTIFIER_PATTERN.test(siteId)
    || !projectId || !IDENTIFIER_PATTERN.test(projectId)
    || !sessionId || !SUPPORTED_LOCALES.includes(locale)
    || visitorName === null || page === null || !messages) {
    return null;
  }

  let exchange: AssistantEvent["exchange"];
  if (type === "assistant.exchange.completed") {
    if (!isRecord(value.exchange)) return null;
    const user = parseMessage(value.exchange.user, "user");
    const assistant = parseMessage(value.exchange.assistant, "assistant");
    if (!user || !assistant) return null;
    exchange = {
      user: { ...user, role: "user" },
      assistant: { ...assistant, role: "assistant" }
    };
  }

  return {
    schemaVersion: 1,
    id,
    type,
    occurredAt,
    siteId,
    projectId,
    sessionId,
    locale,
    messages,
    ...(visitorName !== undefined ? { visitorName } : {}),
    ...(page !== undefined ? { page } : {}),
    ...(exchange ? { exchange } : {})
  };
}
