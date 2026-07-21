import {
  providerAdapters,
  ProviderError,
  type ProviderAdapter,
  type ProviderErrorCode,
  type ProviderId,
  type ProviderInput,
  type ProviderResult
} from "./providers";
import { normalizeProviderError } from "./providers/types";
import type { Env } from "./types";

const DEFAULT_ROUTES = [
  "groq:openai/gpt-oss-120b",
  "groq:openai/gpt-oss-20b",
  "gemini:gemini-3.5-flash",
  "workers-ai:@cf/zai-org/glm-4.7-flash",
  "mock:local"
].join(",");

const routeCooldowns = new Map<string, number>();

export interface ModelRoute {
  provider: ProviderId;
  model: string;
}

export type RouteAttemptStatus = "cooldown" | "failed" | "skipped" | "success";

export interface RouteAttempt {
  provider: ProviderId;
  model: string;
  status: RouteAttemptStatus;
  errorCode?: ProviderErrorCode;
}

export interface RouterResult extends ProviderResult {
  attempts: RouteAttempt[];
}

export class AllProvidersUnavailableError extends Error {
  readonly attempts: RouteAttempt[];

  constructor(attempts: RouteAttempt[]) {
    super("All configured AI providers are unavailable");
    this.name = "AllProvidersUnavailableError";
    this.attempts = attempts;
  }
}

function isProviderId(value: string): value is ProviderId {
  return value === "groq"
    || value === "gemini"
    || value === "workers-ai"
    || value === "mock";
}

export function parseModelRoutes(value?: string): ModelRoute[] {
  const routes = (value?.trim() || DEFAULT_ROUTES)
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean)
    .map((item) => {
      const separator = item.indexOf(":");
      const provider = item.slice(0, separator).trim();
      const model = item.slice(separator + 1).trim();

      if (separator < 1 || !isProviderId(provider) || !model) {
        throw new ProviderError(`Invalid AI route: ${item}`, {
          code: "configuration",
          retryable: false
        });
      }

      return { provider, model };
    });

  if (routes.length === 0) {
    throw new ProviderError("AI_ROUTES contains no routes", {
      code: "configuration",
      retryable: false
    });
  }

  return routes;
}

function getTimeoutMs(env: Env): number {
  const value = Number(env.PROVIDER_TIMEOUT_MS);
  return Number.isFinite(value) && value >= 1_000 && value <= 60_000
    ? value
    : 20_000;
}

async function generateWithTimeout(
  adapter: ProviderAdapter,
  input: ProviderInput,
  model: string,
  env: Env,
  timeoutMs: number
): Promise<ProviderResult> {
  const controller = new AbortController();
  let timer: ReturnType<typeof setTimeout> | undefined;

  const timeout = new Promise<never>((_, reject) => {
    timer = setTimeout(() => {
      controller.abort();
      reject(new ProviderError(`${adapter.id} request timed out`, {
        code: "timeout",
        retryable: true
      }));
    }, timeoutMs);
  });

  try {
    return await Promise.race([
      adapter.generate(input, model, env, controller.signal),
      timeout
    ]);
  } finally {
    if (timer) clearTimeout(timer);
  }
}

function cooldownMs(error: ProviderError): number {
  if (error.code === "rate_limit") {
    return (error.retryAfterSeconds ?? 60) * 1_000;
  }

  return error.retryable ? 10_000 : 0;
}

export async function routeAssistantRequest(
  input: ProviderInput,
  env: Env,
  options: {
    adapters?: Record<ProviderId, ProviderAdapter>;
    now?: () => number;
  } = {}
): Promise<RouterResult> {
  const routes = parseModelRoutes(env.AI_ROUTES);
  const adapters = options.adapters ?? providerAdapters;
  const now = options.now ?? Date.now;
  const timeoutMs = getTimeoutMs(env);
  const attempts: RouteAttempt[] = [];

  for (const route of routes) {
    const adapter = adapters[route.provider];
    const routeKey = `${route.provider}:${route.model}`;
    const cooldownUntil = routeCooldowns.get(routeKey) ?? 0;

    if (!adapter.isConfigured(env)) {
      attempts.push({
        ...route,
        status: "skipped",
        errorCode: "configuration"
      });
      continue;
    }

    if (cooldownUntil > now()) {
      attempts.push({
        ...route,
        status: "cooldown",
        errorCode: "rate_limit"
      });
      continue;
    }

    try {
      const result = await generateWithTimeout(
        adapter,
        input,
        route.model,
        env,
        timeoutMs
      );
      routeCooldowns.delete(routeKey);
      attempts.push({ ...route, status: "success" });

      return { ...result, attempts };
    } catch (unknownError) {
      const error = normalizeProviderError(route.provider, unknownError);
      attempts.push({
        ...route,
        status: "failed",
        errorCode: error.code
      });

      const duration = cooldownMs(error);
      if (duration > 0) routeCooldowns.set(routeKey, now() + duration);

      console.error(
        "AI route failed",
        route.provider,
        route.model,
        error.code,
        error.status ?? ""
      );

      if (!error.retryable
        && error.code !== "authentication"
        && error.code !== "configuration") {
        throw error;
      }
    }
  }

  throw new AllProvidersUnavailableError(attempts);
}

export function resetRouterCooldowns(): void {
  routeCooldowns.clear();
}
