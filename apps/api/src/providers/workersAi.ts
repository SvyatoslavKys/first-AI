import type { ProviderAdapter } from "./types";
import { ProviderError } from "./types";

interface WorkersAiResponse {
  response?: string;
  choices?: Array<{
    message?: {
      content?: string;
    };
  }>;
}

export const workersAiProvider: ProviderAdapter = {
  id: "workers-ai",

  isConfigured(env) {
    return Boolean(env.AI);
  },

  async generate(input, model, env) {
    if (!env.AI) {
      throw new ProviderError("Workers AI binding is not configured", {
        code: "configuration",
        retryable: false
      });
    }

    try {
      const run = env.AI.run as unknown as (
        modelName: string,
        payload: unknown
      ) => Promise<WorkersAiResponse>;
      const data = await run(model, {
        messages: [
          { role: "system", content: input.systemPrompt },
          ...input.messages
        ],
        temperature: 0.3,
        max_tokens: 500
      });
      const content = (
        data.response ?? data.choices?.[0]?.message?.content
      )?.trim();

      if (!content) {
        throw new ProviderError("Workers AI returned an empty response", {
          code: "empty_response",
          retryable: true
        });
      }

      return { content, provider: "workers-ai", model };
    } catch (error) {
      if (error instanceof ProviderError) throw error;

      const message = error instanceof Error ? error.message : "";
      const rateLimited = /429|quota|rate.?limit/i.test(message);

      throw new ProviderError("Workers AI request failed", {
        code: rateLimited ? "rate_limit" : "unavailable",
        retryable: true,
        cause: error
      });
    }
  }
};
