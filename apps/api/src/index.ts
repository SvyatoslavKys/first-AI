import { routeAssistantRequest } from "./router";
import {
  isAllowedOrigin,
  parseAssistantEvent,
  parseAssistantRequest
} from "./security";
import { getSystemPrompt } from "./sites";
import type { Env } from "./types";

function corsHeaders(origin: string): HeadersInit {
  return {
    "Access-Control-Allow-Origin": origin,
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Max-Age": "86400",
    "Vary": "Origin"
  };
}

function json(
  data: unknown,
  status: number,
  origin?: string
): Response {
  return Response.json(data, {
    status,
    headers: {
      ...(origin ? corsHeaders(origin) : {}),
      "Cache-Control": "no-store",
      "X-Content-Type-Options": "nosniff"
    }
  });
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    const origin = request.headers.get("Origin") ?? "";
    const originAllowed = isAllowedOrigin(origin, env.ALLOWED_ORIGINS);
    const isChatRequest = url.pathname === "/chat";
    const isEventRequest = url.pathname === "/events";

    if (request.method === "OPTIONS") {
      return originAllowed
        ? new Response(null, { status: 204, headers: corsHeaders(origin) })
        : json({ error: "Origin is not allowed" }, 403);
    }

    if ((!isChatRequest && !isEventRequest) || request.method !== "POST") {
      return json({ error: "Not found" }, 404, originAllowed ? origin : undefined);
    }

    if (!originAllowed) {
      return json({ error: "Origin is not allowed" }, 403);
    }

    const rawText = await request.text();
    if (rawText.length > 50_000) {
      return json({ error: "Request is too large" }, 413, origin);
    }

    let rawBody: unknown;

    try {
      rawBody = JSON.parse(rawText);
    } catch {
      return json({ error: "Invalid JSON" }, 400, origin);
    }

    if (isEventRequest) {
      const event = parseAssistantEvent(rawBody);
      if (!event) {
        return json({ error: "Invalid assistant event" }, 400, origin);
      }

      console.log(
        "Assistant event accepted",
        event.type,
        event.siteId,
        event.sessionId
      );
      return json({ accepted: true, eventId: event.id }, 202, origin);
    }

    const body = parseAssistantRequest(rawBody);
    if (!body) {
      return json({ error: "Invalid request" }, 400, origin);
    }

    const systemPrompt = getSystemPrompt(
      body.siteId,
      body.locale,
      body.project,
      body.visitorName,
      body.page
    );
    if (!systemPrompt) {
      return json({ error: "Unknown site" }, 403, origin);
    }

    try {
      const result = await routeAssistantRequest(
        {
          systemPrompt,
          messages: body.messages,
          locale: body.locale
        },
        env
      );

      return json({
        message: {
          role: "assistant",
          content: result.content
        },
        meta: {
          provider: result.provider,
          model: result.model,
          attempts: result.attempts
        }
      }, 200, origin);
    } catch (error) {
      console.error("Assistant request failed", error);
      return json({ error: "Assistant is temporarily unavailable" }, 502, origin);
    }
  }
} satisfies ExportedHandler<Env>;
