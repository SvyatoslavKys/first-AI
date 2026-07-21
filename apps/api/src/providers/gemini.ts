import type { ProviderAdapter } from "./types";
import { errorFromResponse, ProviderError } from "./types";

interface GeminiResponse {
  candidates?: Array<{
    content?: {
      parts?: Array<{
        text?: string;
      }>;
    };
  }>;
}

export const geminiProvider: ProviderAdapter = {
  id: "gemini",

  isConfigured(env) {
    return Boolean(env.GEMINI_API_KEY);
  },

  async generate(input, model, env, signal) {
    if (!env.GEMINI_API_KEY) {
      throw new ProviderError("GEMINI_API_KEY is not configured", {
        code: "configuration",
        retryable: false
      });
    }

    const encodedModel = encodeURIComponent(model);
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${encodedModel}:generateContent`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-goog-api-key": env.GEMINI_API_KEY
        },
        body: JSON.stringify({
          systemInstruction: {
            parts: [{ text: input.systemPrompt }]
          },
          contents: input.messages.map((message) => ({
            role: message.role === "assistant" ? "model" : "user",
            parts: [{ text: message.content }]
          })),
          generationConfig: {
            temperature: 0.3,
            maxOutputTokens: 500
          }
        }),
        signal
      }
    );

    if (!response.ok) {
      console.error("Gemini request failed", response.status);
      throw errorFromResponse("gemini", response);
    }

    const data = await response.json<GeminiResponse>();
    const content = data.candidates?.[0]?.content?.parts
      ?.map((part) => part.text ?? "")
      .join("")
      .trim();

    if (!content) {
      throw new ProviderError("Gemini returned an empty response", {
        code: "empty_response",
        retryable: true
      });
    }

    return { content, provider: "gemini", model };
  }
};
