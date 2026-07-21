import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createApiTransport } from "./api";
import type {
  AssistantEvent,
  AssistantEventDelivery,
  AssistantMessage,
  AssistantMessageInput,
  AssistantLocale,
  AssistantPageContext,
  AssistantProjectData,
  AssistantTransport
} from "./types";

interface UseAssistantOptions {
  siteId: string;
  locale: AssistantLocale;
  apiUrl?: string;
  transport?: AssistantTransport;
  project?: AssistantProjectData;
  visitorName?: string;
  pageContext?: Partial<AssistantPageContext>;
  eventDelivery?: AssistantEventDelivery;
  initialMessages?: AssistantMessageInput[];
  maxHistory?: number;
  onEvent?: (event: AssistantEvent) => void | Promise<void>;
  onEventDeliveryError?: (error: Error, event: AssistantEvent) => void;
  onError?: (error: Error) => void;
}

function createId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }

  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function addIds(messages: AssistantMessageInput[]): AssistantMessage[] {
  return messages.map((message) => ({ ...message, id: createId() }));
}

function resolvePageContext(
  override?: Partial<AssistantPageContext>
): AssistantPageContext | undefined {
  const browserPage = typeof window === "undefined"
    ? undefined
    : {
        url: window.location.href,
        path: `${window.location.pathname}${window.location.search}${window.location.hash}`,
        title: document.title
      };
  const page = {
    url: override?.url?.trim() || browserPage?.url || "",
    path: override?.path?.trim() || browserPage?.path || "",
    title: override?.title?.trim() || browserPage?.title || ""
  };

  return page.url && page.path && page.title ? page : undefined;
}

function toMessageInputs(messages: AssistantMessage[]): AssistantMessageInput[] {
  return messages.map(({ role, content }) => ({ role, content }));
}

export function useAssistant({
  siteId,
  locale,
  apiUrl,
  transport,
  project,
  visitorName,
  pageContext,
  eventDelivery,
  initialMessages = [],
  maxHistory = 16,
  onEvent,
  onEventDeliveryError,
  onError
}: UseAssistantOptions) {
  const [messages, setMessages] = useState<AssistantMessage[]>(() => addIds(initialMessages));
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const sessionId = useRef(createId());
  const abortController = useRef<AbortController | null>(null);
  const lastClosedMessageId = useRef<string | null>(null);

  const activeTransport = useMemo(() => {
    if (transport) return transport;
    if (apiUrl) return createApiTransport(apiUrl);
    return null;
  }, [apiUrl, transport]);

  useEffect(() => {
    return () => abortController.current?.abort();
  }, []);

  const emitEvent = useCallback((event: AssistantEvent) => {
    const reportFailure = (caughtError: unknown) => {
      const error = caughtError instanceof Error
        ? caughtError
        : new Error("Не удалось доставить событие помощника");
      onEventDeliveryError?.(error, event);
    };

    if (onEvent) {
      void Promise.resolve(onEvent(event)).catch(reportFailure);
    }

    if (!eventDelivery) return;

    const enabledEvents = eventDelivery.events;
    if (enabledEvents && !enabledEvents.includes(event.type)) return;

    void fetch(eventDelivery.endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(event),
      keepalive: true
    }).then((response) => {
      if (!response.ok) {
        throw new Error(`Сервер событий вернул ошибку ${response.status}`);
      }
    }).catch(reportFailure);
  }, [eventDelivery, onEvent, onEventDeliveryError]);

  const sendMessage = useCallback(async (content: string) => {
    const normalizedContent = content.trim();

    if (!normalizedContent || isLoading) return;

    const userMessage: AssistantMessage = {
      id: createId(),
      role: "user",
      content: normalizedContent
    };

    const requestMessages = [...messages, userMessage]
      .slice(-maxHistory)
      .map(({ role, content: messageContent }) => ({
        role,
        content: messageContent
      }));

    setMessages((current) => [...current, userMessage]);
    setError(null);
    setIsLoading(true);

    try {
      if (!activeTransport) {
        throw new Error("Для помощника не указан apiUrl или transport");
      }

      abortController.current?.abort();
      abortController.current = new AbortController();

      const response = await activeTransport(
        {
          siteId,
          sessionId: sessionId.current,
          locale,
          messages: requestMessages,
          ...(project ? { project } : {}),
          ...(visitorName?.trim() ? { visitorName: visitorName.trim() } : {}),
          ...(resolvePageContext(pageContext)
            ? { page: resolvePageContext(pageContext) }
            : {})
        },
        abortController.current.signal
      );

      const assistantMessage: AssistantMessage = {
        id: createId(),
        role: "assistant",
        content: response
      };

      setMessages((current) => [
        ...current,
        assistantMessage
      ]);

      emitEvent({
        schemaVersion: 1,
        id: createId(),
        type: "assistant.exchange.completed",
        occurredAt: new Date().toISOString(),
        siteId,
        projectId: project?.id ?? siteId,
        sessionId: sessionId.current,
        locale,
        ...(visitorName?.trim() ? { visitorName: visitorName.trim() } : {}),
        ...(resolvePageContext(pageContext)
          ? { page: resolvePageContext(pageContext) }
          : {}),
        messages: [
          ...requestMessages,
          { role: "assistant" as const, content: response }
        ].slice(-maxHistory),
        exchange: {
          user: { role: "user", content: normalizedContent },
          assistant: { role: "assistant", content: response }
        }
      });
    } catch (caughtError) {
      const nextError = caughtError instanceof Error
        ? caughtError
        : new Error("Не удалось получить ответ");

      if (nextError.name !== "AbortError") {
        setError(nextError.message);
        onError?.(nextError);
      }
    } finally {
      setIsLoading(false);
    }
  }, [
    activeTransport,
    emitEvent,
    isLoading,
    locale,
    maxHistory,
    messages,
    onError,
    pageContext,
    project,
    siteId,
    visitorName
  ]);

  const closeConversation = useCallback(() => {
    if (isLoading || !messages.some((message) => message.role === "user")) return;

    const lastMessage = messages[messages.length - 1];
    if (!lastMessage || lastClosedMessageId.current === lastMessage.id) return;

    lastClosedMessageId.current = lastMessage.id;
    emitEvent({
      schemaVersion: 1,
      id: createId(),
      type: "assistant.conversation.closed",
      occurredAt: new Date().toISOString(),
      siteId,
      projectId: project?.id ?? siteId,
      sessionId: sessionId.current,
      locale,
      ...(visitorName?.trim() ? { visitorName: visitorName.trim() } : {}),
      ...(resolvePageContext(pageContext)
        ? { page: resolvePageContext(pageContext) }
        : {}),
      messages: toMessageInputs(messages).slice(-maxHistory)
    });
  }, [
    emitEvent,
    isLoading,
    locale,
    maxHistory,
    messages,
    pageContext,
    project?.id,
    siteId,
    visitorName
  ]);

  const resetMessages = useCallback(() => {
    abortController.current?.abort();
    sessionId.current = createId();
    lastClosedMessageId.current = null;
    setMessages(addIds(initialMessages));
    setError(null);
    setIsLoading(false);
  }, [initialMessages]);

  return {
    messages,
    isLoading,
    error,
    sendMessage,
    closeConversation,
    resetMessages
  };
}
