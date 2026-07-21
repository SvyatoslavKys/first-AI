# First AI

First AI is a reusable assistant system for React websites and web applications. It consists of a props-first chat widget and a separate Cloudflare Worker API. A host project supplies structured public knowledge about its business, services, prices, FAQ, pages, and contacts; the Worker validates that context, builds the model instruction, and routes the request between configured AI providers.

## Project description

The project demonstrates how one assistant integration can be reused on different websites without copying or rewriting its internal chat logic. The same widget can serve as a product guide, sales assistant, first-line support assistant, or navigation helper depending on the project data supplied by the host.

This repository is currently a `v0.1` integration prototype. The package name is prepared for npm, but it is not described as publicly published until an owned npm scope is configured and the release is completed.

## Capabilities available now

For a visitor, the assistant can:

- Answer questions from the project description, capabilities, services, prices, delivery notes, FAQ, contacts, and assistant rules supplied by the host.
- Recommend only the navigation pages and order URLs present in the project data.
- Adapt an answer to the selected language, optional visitor name, and current page context.
- Continue the same recent conversation if the backend falls back from one model provider to another.
- Include contact details or project requirements written in the conversation when it emits a structured event to the host backend.

For an integrator, the project currently provides:

| Area | Available now | Important detail |
| --- | --- | --- |
| React UI | Floating, responsive React 18+ component | Opens from a launcher and adapts to desktop, mobile, and short landscape viewports. |
| Localization | English, Russian, Ukrainian, and Polish | The UI dictionary can be partially overridden; the selected locale is sent to the API. |
| Appearance | Light, dark, and automatic themes | Light/dark palettes, accent colors, position, text, and the closed launcher icon are configurable through props. |
| Project knowledge | Strict `schemaVersion: 1` JSON contract | Supports purpose, audience, capabilities, goals, services, prices, FAQ, pages, public contacts, and rules. |
| Visitor context | Optional name and current page | This is conversational context, not authentication or identity verification. |
| AI transport | Worker `/chat` API or custom React `transport` | Provider keys remain outside the browser. |
| Provider fallback | Groq, Gemini, Workers AI, and local mock routes | Routes are tried in configured order when a key is missing, a quota is reached, or a provider is unavailable. |
| Conversation continuity | Latest messages are forwarded to every attempted route | The default server validation limit is 16 messages; there is no persistent server memory yet. |
| Events | Completed exchange and conversation-closed events | Events are sent as versioned JSON to a host-owned endpoint. |
| Validation | Origin, payload, project, page, message, and event validation | Production still requires rate limiting, abuse protection, monitoring, and privacy controls. |

## Responsibility boundaries

The React package is responsible for presentation, local conversation state, request creation, and event delivery. The First AI Worker is responsible for validation, prompt construction, provider routing, and returning the selected model's answer.

The host application remains responsible for:

- Deciding which project information is correct and safe to expose publicly.
- Authentication and deciding whether a visitor is anonymous or signed in.
- Deploying or selecting the API and configuring allowed origins.
- Keeping AI, email, Telegram, CRM, and database credentials on a backend.
- Storing conversations, requesting consent, defining retention rules, and handling personal data.
- Implementing real email, Telegram, CRM, database, booking, checkout, or human-handoff actions.

## Current limitations

- The assistant does not crawl, index, or automatically learn a website. Knowledge must be passed in the project object; larger knowledge bases need a future server-side retrieval layer.
- Conversation history is kept in the browser component and is not restored across reloads, devices, or browsers.
- The included `/events` endpoint validates and acknowledges events but does not store them or send notifications.
- Contact details are currently part of the conversation transcript; there is no dedicated lead form or structured lead extraction workflow yet.
- Provider limits belong to the configured provider account or project, not to an individual browser session. Multiple visitors share those limits.
- Model answers can still be incorrect. Structured context and rules reduce unsupported answers but do not guarantee factual correctness.
- Authentication, analytics dashboards, billing, per-user quotas, file uploads, voice, tool calling, and autonomous actions are not included in `v0.1`.

Project data passed through props is public browser data and must not contain secrets. Groq, Gemini, email, Telegram, database, and CRM credentials belong only on a backend.

## How it works

```text
Host React application
  ├── project data, visitor name, page context
  │          │
  │          ▼
  │   <AiAssistant /> ── POST /chat ──► First AI Worker
  │                                          │
  │                                          ├── validates input
  │                                          ├── builds project instruction
  │                                          └── tries AI providers in order
  │                                                      │
  │          ◄──────────── assistant response ───────────┘
  │
  └── host event endpoint ◄── structured conversation event
            │
            └── email / Telegram / CRM / database / custom handling
```

Project data is sent with each chat request, so the backend can adapt the model to the current installation. Conversation history stays in the component and the latest messages are sent again when the next request is made. If the router switches to another provider, the new provider receives the same project instruction and conversation history.

The widget does not train or fine-tune a model. It gives the selected model trusted, structured context for the current request. A database or retrieval system can be added later when a project needs more knowledge than is reasonable to send in props.

## Project structure

```text
first-AI/
├── apps/
│   ├── api/                    # Cloudflare Worker: POST /chat and POST /events
│   └── demo/                   # React/Vite demo
├── packages/
│   └── assistant-react/        # Publishable React library
├── package.json                # npm workspaces
└── package-lock.json
```

The frontend and backend live in the same private repository, but they are built and deployed independently. The repository does not need to be public to publish the npm package or deploy the website.

## Requirements

- Node.js 20 or newer.
- npm 10 or newer.

## Installation and verification

```bash
npm install
npm run check
npm run build
```

`npm run build` builds the React library, checks the API, and builds the demo application.

## Running the demo without the backend

```bash
npm run dev
```

Open `http://localhost:5173`. If `VITE_ASSISTANT_API_URL` is not set, the demo uses a local `transport` function and does not send requests to external services.

## Running the demo with the local API

In the first terminal:

```bash
npm run dev:api:mock
```

In the second terminal:

```bash
cp apps/demo/.env.example apps/demo/.env.local
npm run dev
```

The local endpoint is available at `http://localhost:8787/chat`. The `dev:api:mock` command uses `wrangler.local.jsonc` without a remote Workers AI binding, so it works without a Cloudflare account. When no external keys are configured, Groq and Gemini are skipped and the request is handled by the local `mock` provider.

To test Workers AI locally as well, use `npm run dev:api`. This command reads the main `wrangler.jsonc`, connects the remote `AI` binding, and requires Cloudflare authentication.

## Connecting AI providers

For local development, copy the secrets example and add one or both provider keys:

```bash
cp apps/api/.dev.vars.example apps/api/.dev.vars
```

```dotenv
GROQ_API_KEY=your-groq-key
GEMINI_API_KEY=your-gemini-key
```

For a Cloudflare deployment, store the keys as secrets:

```bash
npx wrangler secret put GROQ_API_KEY --config apps/api/wrangler.jsonc
npx wrangler secret put GEMINI_API_KEY --config apps/api/wrangler.jsonc
```

Never put these keys in the React code, the demo `.env` file, `wrangler.jsonc`, or Git. Workers AI is connected through the `AI` binding and does not require a separate API key inside the Worker.

### Model order and fallback

The model chain is configured through `AI_ROUTES` in `apps/api/wrangler.jsonc`:

```text
groq:openai/gpt-oss-120b
→ groq:openai/gpt-oss-20b
→ gemini:gemini-3.5-flash
→ workers-ai:@cf/zai-org/glm-4.7-flash
→ mock:local
```

The router moves to the next route when a key is missing, a rate limit is reached, a request times out, a provider is temporarily unavailable, or a provider returns an empty response. After a `429` response, the route enters a temporary cooldown so subsequent requests do not immediately repeat a call that is known to be unavailable. Request validation errors such as `400` are not hidden by switching to another model.

The same system prompt and the latest 16 messages are passed to every provider in the chain, allowing the conversation to continue with the existing context. The history is currently stored by the React component and sent with every request; persistent server-side conversation storage has not been implemented yet.

`mock:local` is useful during development because the backend can respond without any provider keys. In production, it can be removed from `AI_ROUTES` so a complete provider outage returns a proper `502` response.

## Using the React component in another project

### 1. Install the library

After the package is published under an npm scope that you own:

```bash
npm install @first-ai/assistant-react
```

During local development, build and pack the library from this repository:

```bash
npm run build:widget
npm pack --workspace @first-ai/assistant-react
```

Then install the generated `.tgz` file in the target React project:

```bash
npm install /absolute/path/to/first-ai-assistant-react-0.1.0.tgz
```

### 2. Create the public project description

Create `assistantProject.json` in the host application. The file is the assistant's public project knowledge and may be different in every installation:

```json
{
  "schemaVersion": 1,
  "id": "acme-studio",
  "name": "Acme Studio",
  "type": "website",
  "description": "A studio that designs and develops business websites.",
  "purpose": "Explain the studio's services and help visitors choose the right service.",
  "targetAudience": "Small businesses that need a new website or redesign.",
  "capabilities": [
    "Landing page design and development",
    "Company website development",
    "Existing website redesign"
  ],
  "goals": [
    "Answer questions using the supplied project data",
    "Help visitors find the correct service and order page",
    "Collect a preferred contact detail when a visitor asks for human contact"
  ],
  "services": [
    {
      "id": "landing-page",
      "name": "Landing page",
      "description": "Design and development of a responsive promotional page.",
      "price": {
        "from": 800,
        "currency": "EUR",
        "note": "The final price depends on the content and integrations."
      },
      "deliveryTime": "Approximately 7–10 working days",
      "orderUrl": "/contact?service=landing-page"
    }
  ],
  "faq": [
    {
      "question": "Is hosting included?",
      "answer": "Hosting is selected and billed separately after the project requirements are confirmed."
    }
  ],
  "pages": [
    {
      "id": "services",
      "title": "Services",
      "url": "/services",
      "description": "A complete list of available services."
    },
    {
      "id": "contact",
      "title": "Contact",
      "url": "/contact",
      "description": "The enquiry and contact page."
    }
  ],
  "contacts": [
    {
      "type": "email",
      "value": "sales@example.com",
      "label": "Sales"
    }
  ],
  "assistantRules": [
    "Do not invent prices, deadlines, services, or pages.",
    "When information is missing, explain that a human must confirm it.",
    "Use only navigation URLs listed in the project data."
  ]
}
```

The complete working configuration used by this repository is [apps/demo/src/assistantProject.json](apps/demo/src/assistantProject.json). The package also publishes [packages/assistant-react/project.schema.json](packages/assistant-react/project.schema.json), available to consumers as `@first-ai/assistant-react/project.schema.json`, for editor and CI validation.

Do not put passwords, private API keys, internal notes, or other secrets in this JSON. It is imported into the frontend bundle and can be viewed by a website visitor.

### 3. Render the component

```tsx
import { AiAssistant } from "@first-ai/assistant-react";
import "@first-ai/assistant-react/styles.css";
import projectJson from "./assistantProject.json";
import type { AssistantProjectData } from "@first-ai/assistant-react";

const project = projectJson as AssistantProjectData;

export function App() {
  return (
    <AiAssistant
      siteId={project.id}
      apiUrl="https://assistant-api.example.com"
      project={project}
      visitorName="Ivan"
      eventDelivery={{
        type: "backend",
        endpoint: "/api/assistant-events"
      }}
      locale="auto"
      title="Assistant"
      theme="auto"
      colors={{
        light: {
          primary: "#615fe8",
          launcherBackground: "linear-gradient(145deg, #7775ff, #504ed1)"
        },
        dark: {
          primary: "#8b88ff",
          userBubble: "#6663e8",
          launcherBackground: "linear-gradient(145deg, #9794ff, #5d5ad9)"
        }
      }}
      launcherIcon={<img src="/assistant-mark.svg" alt="" />}
    />
  );
}
```

`siteId` is the public identifier of the installation and must equal `project.id`. The component sends chat requests to `POST {apiUrl}/chat`. Instead of `apiUrl`, an application can pass a custom asynchronous `transport` function, which is useful for tests or a custom API contract.

### Project data fields

| Field | Required | Meaning |
| --- | --- | --- |
| `schemaVersion` | Yes | Format version. The current value is `1`. |
| `id` | Yes | Stable public project identifier; it must match `siteId`. |
| `name` | Yes | Project, product, or company name. |
| `type` | Yes | `website`, `web-app`, `mobile-app`, `service`, or `other`. |
| `description` | Yes | What the application or business is. |
| `purpose` | Yes | What the application does and why a visitor uses it. |
| `targetAudience` | No | Intended users or customers. |
| `capabilities` | Yes | What the application, product, or business can do. |
| `goals` | Yes | What the assistant should help the visitor achieve. |
| `services` | Yes | Services with descriptions, optional prices, delivery times, and order URLs. |
| `faq` | Yes | Known questions and approved answers. |
| `pages` | Yes | Pages that the assistant is allowed to recommend. |
| `contacts` | Yes | Public email, phone, Telegram, URL, or other contact details. |
| `assistantRules` | No | Project-specific behavioral restrictions. |

Service prices may use an exact `amount`, a `from` value, a `to` value, or a range with `from` and `to`. `currency` is required whenever a price object is present. `unit` can describe values such as `per month`, and `note` can explain that a price is illustrative or subject to confirmation.

The Worker rejects malformed project data, mismatched identifiers, unsafe URLs, oversized strings, a project JSON payload larger than 15 KB, more than 20 services, more than 50 FAQ items, more than 50 pages, or more than 20 contacts.

### Visitor and page context

Authentication remains the responsibility of the host application. If the host already knows the current user's name, it can pass that value separately:

```tsx
<AiAssistant
  siteId={project.id}
  project={project}
  apiUrl="https://assistant-api.example.com"
  visitorName={currentUser?.name}
/>
```

`visitorName` is conversational context, not proof of identity. For an anonymous visitor, omit it.

The component automatically detects the current browser URL, path, and document title. A router or embedded application can override any of these fields:

```tsx
<AiAssistant
  siteId={project.id}
  project={project}
  apiUrl="https://assistant-api.example.com"
  pageContext={{
    path: location.pathname,
    title: "Custom checkout page"
  }}
/>
```

This tells the model which page the visitor is currently viewing. It does not give the model permission to invent pages that are missing from `project.pages`.

### Theme, colors, and launcher icon

Use `theme="light"`, `theme="dark"`, or `theme="auto"`. The `auto` option starts from a saved visitor preference or the operating system preference. The built-in header button lets the visitor switch the resolved theme and saves that choice for the current `siteId`. Set `showThemeToggle={false}` when the host application must choose the theme without an additional widget control.

The `colors` prop accepts independent, partial palettes for light and dark modes. Every omitted value keeps the library default:

```tsx
import type { AssistantColorScheme } from "@first-ai/assistant-react";

const colors: AssistantColorScheme = {
  light: {
    primary: "#0f766e",
    surfaceSolid: "#ffffff",
    text: "#17202a",
    userBubble: "#0f766e",
    launcherBackground: "linear-gradient(145deg, #14b8a6, #0f766e)",
    notification: "#fb7185"
  },
  dark: {
    primary: "#5eead4",
    surfaceSolid: "#0f172a",
    surfaceSoft: "#111827",
    text: "#f8fafc",
    assistantBubble: "#182235",
    userBubble: "#0f766e",
    launcherBackground: "linear-gradient(145deg, #2dd4bf, #0f766e)"
  }
};

<AiAssistant
  siteId={project.id}
  project={project}
  apiUrl="https://assistant-api.example.com"
  theme="auto"
  colors={colors}
  launcherIcon={<img src="/brand-assistant.svg" alt="" />}
  onThemeChange={(theme) => console.log("Resolved theme:", theme)}
/>
```

Available color tokens are `primary`, `surface`, `surfaceSolid`, `surfaceSoft`, `text`, `textMuted`, `border`, `assistantBubble`, `assistantText`, `userBubble`, `userText`, `launcherBackground`, `launcherText`, `status`, and `notification`. A launcher background may be a regular CSS color or a CSS gradient. The older `primaryColor` prop remains available as a simple one-color shortcut; a `colors` value has priority when both are supplied.

`launcherIcon` accepts any React node, including an inline SVG, component, text mark, or image. The button retains its localized accessible label, so decorative images should normally use `alt=""`. The close icon is still displayed automatically while the panel is open.

The language can be fixed or controlled by the host through `locale`. Set `showLanguageSelector={false}` to hide the built-in selector, and use `onLocaleChange` when the host also needs to synchronize its page language.

### 4. Choose where conversation events are delivered

`eventDelivery` forwards strictly structured JSON events to a backend owned by the host application:

```tsx
<AiAssistant
  siteId={project.id}
  apiUrl="https://assistant-api.example.com"
  project={project}
  eventDelivery={{
    type: "backend",
    endpoint: "/api/assistant-events",
    events: [
      "assistant.exchange.completed",
      "assistant.conversation.closed"
    ]
  }}
/>
```

The supported event types are:

- `assistant.exchange.completed` after the model successfully answers a user message.
- `assistant.conversation.closed` when the visitor closes a conversation that changed after it was opened.

Example `assistant.exchange.completed` payload:

```json
{
  "schemaVersion": 1,
  "id": "event-id",
  "type": "assistant.exchange.completed",
  "occurredAt": "2026-07-21T12:00:00.000Z",
  "siteId": "acme-studio",
  "projectId": "acme-studio",
  "sessionId": "session-id",
  "locale": "en",
  "visitorName": "Ivan",
  "page": {
    "url": "https://example.com/services",
    "path": "/services",
    "title": "Services"
  },
  "messages": [
    { "role": "user", "content": "How much is a landing page?" },
    { "role": "assistant", "content": "Landing page development starts from EUR 800." }
  ],
  "exchange": {
    "user": { "role": "user", "content": "How much is a landing page?" },
    "assistant": { "role": "assistant", "content": "Landing page development starts from EUR 800." }
  }
}
```

The endpoint may be relative, such as `/api/assistant-events`, to use the host website's backend, or absolute to use a separate service. The browser sends it as an HTTP `POST` request with `Content-Type: application/json`.

The receiving backend decides what happens next. For example:

```ts
import type { AssistantEvent } from "@first-ai/assistant-react";

export async function receiveAssistantEvent(request: Request) {
  // Add runtime schema validation, authentication, and rate limiting here.
  const event = (await request.json()) as AssistantEvent;

  if (event.type === "assistant.conversation.closed") {
    await saveConversation(event);
    await notifySalesTeam({
      visitorName: event.visitorName,
      messages: event.messages,
      page: event.page
    });
  }

  return Response.json(
    { accepted: true, eventId: event.id },
    { status: 202 }
  );
}
```

`saveConversation` and `notifySalesTeam` are intentionally application-specific. The host can implement them with a database, email provider, Telegram Bot API, CRM webhook, or an internal backend. Email credentials, Telegram bot tokens, and CRM secrets must remain on that backend and must never be passed to React props.

The demo sends events to the Worker's `POST /events` endpoint. It validates the event, returns `202 Accepted`, and logs only metadata for development. It does not currently store the conversation or send a real notification.

Use `onEvent` when the host application also needs an in-memory callback. Use `onEventDeliveryError` for delivery diagnostics:

```tsx
<AiAssistant
  siteId={project.id}
  project={project}
  apiUrl="https://assistant-api.example.com"
  eventDelivery={{ type: "backend", endpoint: "/api/assistant-events" }}
  onEvent={(event) => console.log("Assistant event", event)}
  onEventDeliveryError={(error, event) => {
    console.error("Event delivery failed", event.id, error);
  }}
/>
```

### Main component props

| Prop | Purpose |
| --- | --- |
| `siteId` | Required public integration identifier. Must match `project.id`. |
| `apiUrl` | Backend base URL without `/chat`. |
| `transport` | Custom asynchronous request function used instead of the standard HTTP transport. |
| `project` | Public, structured knowledge for this installation. |
| `visitorName` | Optional name supplied by the host application. |
| `pageContext` | Optional URL, path, and title overrides. |
| `eventDelivery` | Backend event endpoint and optional list of enabled event types. |
| `locale` | `en`, `ru`, `uk`, `pl`, or `auto`. |
| `translations` | Partial overrides for built-in UI dictionaries. |
| `theme` | `light`, `dark`, or `auto`. |
| `colors` | Partial light and dark color palettes. |
| `position` | `bottom-right` or `bottom-left`. |
| `primaryColor` | Widget accent color. |
| `launcherIcon` | Custom React node shown while the widget is closed. |
| `showLanguageSelector` | Shows or hides the built-in language selector. |
| `showThemeToggle` | Shows or hides the built-in light/dark control. |
| `defaultOpen` | Whether the dialog starts open. |
| `maxHistory` | Maximum conversation history retained by the component. |
| `title`, `eyebrow`, `statusText`, `welcomeMessage`, `placeholder` | Interface text overrides. |
| `onEvent`, `onEventDeliveryError`, `onLocaleChange`, `onThemeChange`, `onOpenChange`, `onError` | Lifecycle and diagnostic callbacks. |

The package also exports `useAssistant`, `createApiTransport`, locale helpers, API types, project types, and event types.

## Languages

English (`en`), Russian (`ru`), Ukrainian (`uk`), and Polish (`pl`) are included. With `locale="auto"`, the component uses the saved language selection or the browser language. The language selector is displayed in the widget header. Changing the language resets the current conversation so a new system instruction is not mixed with the previous history.

Client-side translations can be partially overridden through the `translations` prop. The selected `locale` is always sent to the backend together with the messages.

## API contract

Request:

```json
{
  "siteId": "demo",
  "sessionId": "session-id",
  "locale": "en",
  "visitorName": "Ivan",
  "project": {
    "schemaVersion": 1,
    "id": "demo",
    "name": "First AI Demo",
    "type": "website",
    "description": "A reusable AI assistant demonstration.",
    "purpose": "Explain the component and collect integration requirements.",
    "capabilities": [],
    "goals": [],
    "services": [],
    "faq": [],
    "pages": [],
    "contacts": []
  },
  "messages": [
    { "role": "user", "content": "Hello" }
  ]
}
```

Response:

```json
{
  "message": {
    "role": "assistant",
    "content": "Hello!"
  },
  "meta": {
    "provider": "gemini",
    "model": "gemini-3.5-flash",
    "attempts": [
      {
        "provider": "groq",
        "model": "openai/gpt-oss-120b",
        "status": "failed",
        "errorCode": "rate_limit"
      },
      {
        "provider": "gemini",
        "model": "gemini-3.5-flash",
        "status": "success"
      }
    ]
  }
}
```

The `meta` object is intended for testing and observability. It does not expose secrets or internal provider error messages.

When valid project data is supplied, the backend builds a protected system instruction from that project, the selected locale, visitor name, and current page. Without a `project` object, it falls back to the built-in `siteId` configuration in `apps/api/src/sites.ts`.

## Security

The Worker already performs the following basic checks:

- Allows only configured `Origin` values.
- Accepts only `POST /chat` and `POST /events`.
- Validates `siteId`, `sessionId`, project data, page context, events, message roles, and message content.
- Limits message length and conversation history.
- Disables response caching.
- Keeps provider keys in the server environment only.

## Testing the router

```bash
npm test
```

The tests cover model ordering, fallback after a `429` response, cooldown behavior, complete context forwarding to the next provider, and operation without external provider keys.

Before a public production launch, configure Cloudflare Rate Limiting and Turnstile. CORS and `Origin` validation restrict browser clients, but they do not replace protection against direct automated requests.

## Testing the package in another React project

Run the automated external-consumer smoke test:

```bash
npm run test:consumer
```

This command builds the library, creates an npm tarball, installs that tarball into an isolated temporary consumer, resolves React through the package's peer dependencies, type-checks a real JSX integration, verifies the public JavaScript/CSS/JSON Schema files, and removes the temporary directory.

For a manual test in an existing Vite, Next.js, or other React application, follow [docs/EXTERNAL_PROJECT_TESTING.md](docs/EXTERNAL_PROJECT_TESTING.md). The guide includes package installation, API/CORS setup, a functional checklist, and a test-result template.

## Publishing the library

First, replace the `@first-ai` scope with an npm scope that you own. Then run:

```bash
npm run build:widget
npm publish --workspace @first-ai/assistant-react --access public
```

The repository can remain private. npm receives only the built library, the project JSON Schema, and package documentation.
