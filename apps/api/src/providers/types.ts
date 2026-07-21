import type {
  AssistantLocale,
  AssistantMessage,
  Env
} from "../types";

export type ProviderId = "groq" | "gemini" | "workers-ai" | "mock";

export interface ProviderInput {
  systemPrompt: string;
  messages: AssistantMessage[];
  locale: AssistantLocale;
}

export interface ProviderResult {
  content: string;
  provider: ProviderId;
  model: string;
}

export type ProviderErrorCode =
  | "authentication"
  | "configuration"
  | "empty_response"
  | "invalid_request"
  | "rate_limit"
  | "timeout"
  | "unavailable"
  | "unknown";

export class ProviderError extends Error {
  readonly code: ProviderErrorCode;
  readonly retryable: boolean;
  readonly retryAfterSeconds?: number;
  readonly status?: number;

  constructor(
    message: string,
    options: {
      code: ProviderErrorCode;
      retryable: boolean;
      retryAfterSeconds?: number;
      status?: number;
      cause?: unknown;
    }
  ) {
    super(message, { cause: options.cause });
    this.name = "ProviderError";
    this.code = options.code;
    this.retryable = options.retryable;
    this.retryAfterSeconds = options.retryAfterSeconds;
    this.status = options.status;
  }
}

export interface ProviderAdapter {
  readonly id: ProviderId;
  isConfigured(env: Env): boolean;
  generate(
    input: ProviderInput,
    model: string,
    env: Env,
    signal: AbortSignal
  ): Promise<ProviderResult>;
}

function retryAfterSeconds(response: Response): number | undefined {
  const value = response.headers.get("Retry-After");
  if (!value) return undefined;

  const seconds = Number(value);
  if (Number.isFinite(seconds)) return Math.max(0, seconds);

  const date = Date.parse(value);
  if (Number.isNaN(date)) return undefined;

  return Math.max(0, Math.ceil((date - Date.now()) / 1000));
}

export function errorFromResponse(
  provider: ProviderId,
  response: Response
): ProviderError {
  const common = {
    status: response.status,
    retryAfterSeconds: retryAfterSeconds(response)
  };

  if (response.status === 429) {
    return new ProviderError(`${provider} rate limit reached`, {
      ...common,
      code: "rate_limit",
      retryable: true
    });
  }

  if (response.status === 401 || response.status === 403) {
    return new ProviderError(`${provider} rejected its API key`, {
      ...common,
      code: "authentication",
      retryable: false
    });
  }

  if (response.status === 408 || response.status >= 500) {
    return new ProviderError(`${provider} is temporarily unavailable`, {
      ...common,
      code: "unavailable",
      retryable: true
    });
  }

  return new ProviderError(`${provider} rejected the request`, {
    ...common,
    code: "invalid_request",
    retryable: false
  });
}

export function normalizeProviderError(
  provider: ProviderId,
  error: unknown
): ProviderError {
  if (error instanceof ProviderError) return error;

  if (error instanceof DOMException && error.name === "AbortError") {
    return new ProviderError(`${provider} request timed out`, {
      code: "timeout",
      retryable: true,
      cause: error
    });
  }

  return new ProviderError(`${provider} request failed`, {
    code: "unavailable",
    retryable: true,
    cause: error
  });
}
