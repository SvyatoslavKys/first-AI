import {
  ProviderError,
  providerAdapters,
  type ProviderAdapter,
  type ProviderId
} from "../src/providers";
import {
  parseModelRoutes,
  resetRouterCooldowns,
  routeAssistantRequest
} from "../src/router";
import {
  parseAssistantEvent,
  parseAssistantRequest,
  parseProjectData
} from "../src/security";
import { getSystemPrompt } from "../src/sites";
import type { Env } from "../src/types";
import demoProject from "../../demo/src/assistantProject.json";

const input = {
  systemPrompt: "Answer in Russian.",
  locale: "ru" as const,
  messages: [
    { role: "user" as const, content: "Меня зовут Анна" },
    { role: "assistant" as const, content: "Очень приятно" },
    { role: "user" as const, content: "Как меня зовут?" }
  ]
};

const project = {
  schemaVersion: 1,
  id: "demo",
  name: "Demo Project",
  type: "website",
  description: "A project used to test dynamic assistant context.",
  purpose: "Explain and sell a reusable assistant component.",
  capabilities: ["Answer project questions"],
  goals: ["Collect integration requirements"],
  services: [
    {
      id: "integration",
      name: "Integration",
      description: "React widget integration",
      price: { from: 500, currency: "EUR" },
      orderUrl: "/#integration"
    }
  ],
  faq: [
    { question: "Is it reusable?", answer: "Yes." }
  ],
  pages: [
    { id: "overview", title: "Overview", url: "/#overview" }
  ],
  contacts: [],
  assistantRules: ["Do not invent prices."]
};

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

function assertEqual(actual: unknown, expected: unknown, message: string): void {
  const actualJson = JSON.stringify(actual);
  const expectedJson = JSON.stringify(expected);
  assert(actualJson === expectedJson, `${message}\nExpected: ${expectedJson}\nActual: ${actualJson}`);
}

function createEnv(routes: string): Env {
  return {
    AI: {} as Ai,
    AI_ROUTES: routes,
    ALLOWED_ORIGINS: "http://localhost:5173",
    PROVIDER_TIMEOUT_MS: "20000"
  };
}

function createAdapter(
  id: ProviderId,
  generate: ProviderAdapter["generate"],
  configured = true
): ProviderAdapter {
  return {
    id,
    isConfigured: () => configured,
    generate
  };
}

async function runTest(name: string, test: () => Promise<void> | void): Promise<void> {
  resetRouterCooldowns();
  await test();
  console.log(`✓ ${name}`);
}

await runTest("parses routes in order", () => {
  assertEqual(
    parseModelRoutes(
      "groq:openai/gpt-oss-20b,workers-ai:@cf/zai-org/glm-4.7-flash"
    ),
    [
      { provider: "groq", model: "openai/gpt-oss-20b" },
      { provider: "workers-ai", model: "@cf/zai-org/glm-4.7-flash" }
    ],
    "Model routes must preserve their configured order"
  );
});

await runTest("falls back after 429 and preserves the complete context", async () => {
  let groqCalls = 0;
  let receivedContext: typeof input | undefined;
  const groq = createAdapter("groq", async () => {
    groqCalls += 1;
    throw new ProviderError("limit", {
      code: "rate_limit",
      retryable: true,
      retryAfterSeconds: 60
    });
  });
  const gemini = createAdapter("gemini", async (received, model) => {
    receivedContext = received as typeof input;
    return {
      content: "Вас зовут Анна",
      provider: "gemini",
      model
    };
  });
  const adapters: Record<ProviderId, ProviderAdapter> = {
    groq,
    gemini,
    "workers-ai": createAdapter("workers-ai", async () => {
      throw new Error("not used");
    }, false),
    mock: createAdapter("mock", async (_received, model) => ({
      content: "mock",
      provider: "mock",
      model
    }))
  };
  const env = createEnv("groq:first,gemini:second,mock:local");
  const result = await routeAssistantRequest(input, env, {
    adapters,
    now: () => 1_000
  });

  assert(result.content === "Вас зовут Анна", "Gemini response must be returned");
  assert(receivedContext === input, "The next provider must receive the same context object");
  assertEqual(result.attempts, [
    {
      provider: "groq",
      model: "first",
      status: "failed",
      errorCode: "rate_limit"
    },
    { provider: "gemini", model: "second", status: "success" }
  ], "Attempts must describe the fallback");

  const secondResult = await routeAssistantRequest(input, env, {
    adapters,
    now: () => 2_000
  });
  assert(groqCalls === 1, "A route in cooldown must not be called again");
  assertEqual(secondResult.attempts[0], {
    provider: "groq",
    model: "first",
    status: "cooldown",
    errorCode: "rate_limit"
  }, "The next request must report the cooldown");
});

await runTest("reaches mock when external provider keys are missing", async () => {
  const result = await routeAssistantRequest(
    input,
    createEnv("groq:first,gemini:second,mock:local")
  );

  assert(result.provider === "mock", "Mock must answer without external keys");
  assertEqual(
    result.attempts.map((attempt) => attempt.status),
    ["skipped", "skipped", "success"],
    "Unconfigured providers must be skipped"
  );
});

await runTest("calls the Workers AI binding with its receiver intact", async () => {
  const fakeAi = {
    marker: "bound",
    async run(this: { marker: string }, _model: string, _payload: unknown) {
      assert(this.marker === "bound", "Workers AI must receive its binding as this");
      return { response: "Workers AI response" };
    }
  };
  const env = {
    ...createEnv("workers-ai:test-model"),
    AI: fakeAi as unknown as Ai
  };
  const result = await providerAdapters["workers-ai"].generate(
    input,
    "test-model",
    env,
    new AbortController().signal
  );

  assert(result.content === "Workers AI response", "Workers AI response must be returned");
});

await runTest("accepts strict project data and builds dynamic agent context", () => {
  assert(
    parseProjectData(demoProject, "demo"),
    "The demo assistantProject.json must satisfy backend validation"
  );

  const request = parseAssistantRequest({
    siteId: "demo",
    sessionId: "session-1",
    locale: "ru",
    visitorName: "Иван",
    page: {
      url: "http://localhost:5173/#integration",
      path: "/#integration",
      title: "First AI Demo"
    },
    project,
    messages: [{ role: "user", content: "Сколько стоит интеграция?" }]
  });

  assert(request, "A valid props-first request must be accepted");
  const prompt = getSystemPrompt(
    request.siteId,
    request.locale,
    request.project,
    request.visitorName,
    request.page
  );
  assert(prompt?.includes("Demo Project"), "Prompt must contain project data");
  assert(prompt?.includes("Иван"), "Prompt must contain the visitor name");
  assert(prompt?.includes("500"), "Prompt must contain structured service pricing");

  assert(
    parseAssistantRequest({
      ...request,
      project: { ...project, id: "another-project" }
    }) === null,
    "Project id must match siteId"
  );
});

await runTest("accepts the documented backend delivery event format", () => {
  const event = parseAssistantEvent({
    schemaVersion: 1,
    id: "event-1",
    type: "assistant.exchange.completed",
    occurredAt: "2026-07-21T12:00:00.000Z",
    siteId: "demo",
    projectId: "demo",
    sessionId: "session-1",
    locale: "ru",
    visitorName: "Иван",
    messages: [
      { role: "user", content: "Мне нужна интеграция" },
      { role: "assistant", content: "Расскажите о вашем проекте" }
    ],
    exchange: {
      user: { role: "user", content: "Мне нужна интеграция" },
      assistant: { role: "assistant", content: "Расскажите о вашем проекте" }
    }
  });

  assert(event, "A valid exchange event must be accepted by /events");
  assert(event.type === "assistant.exchange.completed", "Event type must be preserved");
});
