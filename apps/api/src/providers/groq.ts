import type { ProviderAdapter } from "./types";
import { errorFromResponse, ProviderError } from "./types";

interface GroqResponse {
  choices?: Array<{
    message?: {
      content?: string;
    };
  }>;
}

export const groqProvider: ProviderAdapter = {
  id: "groq",

  isConfigured(env) {
    return Boolean(env.GROQ_API_KEY);
  },

  async generate(input, model, env, signal) {
    if (!env.GROQ_API_KEY) {
      throw new ProviderError("GROQ_API_KEY is not configured", {
        code: "configuration",
        retryable: false
      });
    }

    const response = await fetch(
      "https://api.groq.com/openai/v1/chat/completions",
      {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${env.GROQ_API_KEY}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          model,
          messages: [
            { role: "system", content: input.systemPrompt },
            ...input.messages
          ],
          temperature: 0.3,
          max_completion_tokens: 500
        }),
        signal
      }
    );

    if (!response.ok) {
      console.error("Groq request failed", response.status);
      throw errorFromResponse("groq", response);
    }

    const data = await response.json<GroqResponse>();
    const content = data.choices?.[0]?.message?.content?.trim();

    if (!content) {
      throw new ProviderError("Groq returned an empty response", {
        code: "empty_response",
        retryable: true
      });
    }

    return { content, provider: "groq", model };
  }
};
