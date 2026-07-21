import type {
  AssistantResponse,
  AssistantTransport
} from "./types";

export function createApiTransport(apiUrl: string): AssistantTransport {
  const endpoint = `${apiUrl.replace(/\/$/, "")}/chat`;

  return async (request, signal) => {
    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(request),
      signal
    });

    const data = (await response.json().catch(() => null)) as
      | AssistantResponse
      | { error?: string }
      | null;

    if (!response.ok) {
      const message = data && "error" in data && data.error
        ? data.error
        : `Сервер вернул ошибку ${response.status}`;
      throw new Error(message);
    }

    if (!data || !("message" in data) || typeof data.message?.content !== "string") {
      throw new Error("Сервер вернул ответ неизвестного формата");
    }

    return data.message.content;
  };
}
