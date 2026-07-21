import { geminiProvider } from "./gemini";
import { groqProvider } from "./groq";
import { mockProvider } from "./mock";
import type { ProviderAdapter, ProviderId } from "./types";
import { workersAiProvider } from "./workersAi";

export type {
  ProviderAdapter,
  ProviderErrorCode,
  ProviderId,
  ProviderInput,
  ProviderResult
} from "./types";
export { ProviderError } from "./types";

export const providerAdapters: Record<ProviderId, ProviderAdapter> = {
  groq: groqProvider,
  gemini: geminiProvider,
  "workers-ai": workersAiProvider,
  mock: mockProvider
};
