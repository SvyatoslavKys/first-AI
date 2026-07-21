# @first-ai/assistant-react

An embeddable React 18+ chat widget for a First AI-compatible `/chat` API. The package provides the browser interface and integration contract; model routing, persistence, notifications, authentication, and business actions belong to a backend.

## What the package provides

- Responsive floating chat UI for desktop and mobile viewports.
- English, Russian, Ukrainian, and Polish interface dictionaries with browser-language detection and an English fallback.
- Strict, versioned public project context supplied through props.
- Optional visitor name and current page context.
- Light, dark, and automatic themes with partial color palettes and a custom launcher icon.
- Standard HTTP transport or a custom async transport function.
- Typed completed-exchange and conversation-closed events.
- Public TypeScript types and a project JSON Schema.

The package does not crawl a website, persist conversations, authenticate visitors, call AI providers directly, send notifications, or execute bookings and payments. Those functions require a host backend. Project props are visible in the browser and must never contain secrets.

## Basic usage

```tsx
import { AiAssistant } from "@first-ai/assistant-react";
import "@first-ai/assistant-react/styles.css";
import projectJson from "./assistantProject.json";
import type { AssistantProjectData } from "@first-ai/assistant-react";

const project = projectJson as AssistantProjectData;

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
  theme="auto"
  colors={{
    light: {
      primary: "#615fe8",
      launcherBackground: "linear-gradient(145deg, #7775ff, #504ed1)"
    },
    dark: {
      primary: "#8b88ff",
      userBubble: "#6663e8"
    }
  }}
  launcherIcon={<img src="/assistant-mark.svg" alt="" />}
  title="Online assistant"
/>
```

The project object has a strict, versioned format. Use `@first-ai/assistant-react/project.schema.json` for editor or CI validation. It can describe the host application, its purpose, capabilities, goals, services and prices, FAQ entries, navigation pages, public contacts, and assistant rules.

With `locale="auto"`, the component first restores a language selected for the current `siteId`, then checks `navigator.languages` in browser preference order, and finally falls back to English. Regional tags such as `ru-RU` are reduced to their supported base language. Host applications can also import `detectBrowserLocale`, `resolveBrowserLocale`, and `DEFAULT_LOCALE`.

## Conversation event delivery

The component can send two event types to the host application's backend:

- `assistant.exchange.completed` after an AI response;
- `assistant.conversation.closed` when the visitor closes a changed conversation.

Each event contains its schema version, IDs, locale, optional visitor name and page, the latest messages, and the completed exchange when applicable. The receiving backend decides whether to store it, send email or Telegram, or forward it to a CRM. Never put notification service credentials in React props.

Use `onEvent` for custom in-app handling and `onEventDeliveryError` for delivery diagnostics.

## Appearance

- `theme` selects `light`, `dark`, or `auto` mode.
- `colors` supplies partial `light` and `dark` palettes. It can customize surfaces, text, borders, assistant and user bubbles, launcher background and text, status, and notification colors.
- `primaryColor` remains a shorthand for changing only the accent color.
- `launcherIcon` replaces the chat symbol shown while the widget is closed and accepts any React node, including SVG or `<img>`.
- `showLanguageSelector` and `showThemeToggle` hide the built-in controls when the host application manages them.
- `onThemeChange` reports a visitor theme change.

The component is responsive by default: the panel is attached to the launcher on larger screens and uses the available viewport width and height on small mobile screens.

## Main props

- `siteId` — public integration identifier; it must match `project.id`.
- `apiUrl` — backend base URL without `/chat`.
- `transport` — custom function used instead of the HTTP API.
- `project` — validated public project knowledge.
- `visitorName` — optional display name and conversational context.
- `pageContext` — optional current URL, path, and title overrides.
- `eventDelivery` — host backend event endpoint and optional event filter.
- `locale` — `en`, `ru`, `uk`, `pl`, or `auto`.
- `translations` — partial built-in dictionary overrides.
- `theme` — `light`, `dark`, or `auto`.
- `colors` — partial light and dark color palettes.
- `position` — `bottom-right` or `bottom-left`.
- `primaryColor` — widget accent color.
- `launcherIcon` — custom closed-state launcher content.
- `showLanguageSelector`, `showThemeToggle` — built-in control visibility.
- `defaultOpen` — opens the chat on initial render.
- `welcomeMessage`, `title`, `placeholder` — interface copy.
- `onEvent`, `onEventDeliveryError`, `onLocaleChange`, `onThemeChange`, `onOpenChange`, `onError` — lifecycle callbacks.

The package also exports `useAssistant`, `createApiTransport`, the project and event types, locale helpers, and API types.
