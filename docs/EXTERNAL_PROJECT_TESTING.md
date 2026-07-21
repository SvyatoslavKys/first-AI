# Testing First AI in another React project

This guide verifies the package from the perspective of an application outside the monorepo. Use it before publishing a new package version and when integrating the widget into a real website.

## Automated isolated consumer test

From the First AI repository root:

```bash
npm install
npm run test:consumer
```

The test performs the following work:

1. Builds `@first-ai/assistant-react`.
2. Creates the same `.tgz` archive that npm would receive.
3. Installs the archive into a temporary standalone package without using the monorepo workspace link.
4. Connects the local React peer dependencies.
5. Type-checks a consumer JSX file that uses project data, localization, theming, a custom launcher icon, and event delivery.
6. Imports the built JavaScript and verifies that the CSS file and project JSON Schema are present.
7. Removes the temporary test directory.

This catches missing `dist` files, broken package exports, missing public types, and integration errors that may be hidden by npm workspaces.

## Manual package installation

Build and pack the library:

```bash
npm run build:widget
mkdir -p /tmp/first-ai-package
npm pack --workspace @first-ai/assistant-react --pack-destination /tmp/first-ai-package
```

In the target React project, install the generated archive:

```bash
npm install /tmp/first-ai-package/first-ai-assistant-react-0.1.0.tgz
```

React and React DOM are peer dependencies. The target project must use React 18 or newer.

For the Next.js App Router, render `AiAssistant` from a client component containing `"use client"`. Import the package stylesheet from an entry where the application's Next.js version permits global CSS.

## Minimal target-project integration

Create a public `assistantProject.json` following the [project data example](../README.md#2-create-the-public-project-description). Then render the component:

```tsx
import { AiAssistant } from "@first-ai/assistant-react";
import "@first-ai/assistant-react/styles.css";
import type {
  AssistantColorScheme,
  AssistantProjectData
} from "@first-ai/assistant-react";
import projectJson from "./assistantProject.json";

const project = projectJson as AssistantProjectData;

const colors: AssistantColorScheme = {
  light: {
    primary: "#615fe8"
  },
  dark: {
    primary: "#8b88ff",
    surfaceSolid: "#11162a"
  }
};

export function AssistantIntegration() {
  return (
    <AiAssistant
      siteId={project.id}
      apiUrl="http://localhost:8787"
      project={project}
      visitorName="Test visitor"
      locale="auto"
      theme="auto"
      colors={colors}
      launcherIcon={<span aria-hidden="true">AI</span>}
      eventDelivery={{
        type: "backend",
        endpoint: "http://localhost:8787/events"
      }}
    />
  );
}
```

Do not place AI provider keys or private business data in the target React project. `assistantProject.json` is part of the public browser bundle.

## Local API and CORS

Start the API in mock-compatible mode from the First AI repository:

```bash
npm run dev:api:mock
```

The Worker accepts only origins listed in `ALLOWED_ORIGINS`. If the target project runs at `http://localhost:5174`, configure both demo and target origins in `apps/api/wrangler.local.jsonc`:

```json
{
  "vars": {
    "ALLOWED_ORIGINS": "http://localhost:5173,http://localhost:5174"
  }
}
```

Restart the Worker after changing its configuration. For a deployed Worker, configure the real HTTPS origins and never use a wildcard origin for a credentialed production integration.

## Functional checklist

### Package and rendering

- The target project installs without copying files from the monorepo.
- `AiAssistant` and its TypeScript types resolve from the package.
- `@first-ai/assistant-react/styles.css` loads.
- The launcher is visible above the host page and does not change unrelated host styles.
- The dialog fits desktop, narrow mobile, and short landscape viewports.

### Project context

- `siteId` exactly matches `project.id`.
- Questions about services, prices, FAQ, and pages are answered only from the supplied project data.
- Unknown information is not presented as a confirmed fact.
- An unsafe or malformed project is rejected by the Worker with a `400` response.

### Localization and appearance

- English, Russian, Ukrainian, and Polish can be selected.
- Changing the language resets the current conversation.
- Light, dark, and automatic themes work.
- Custom light/dark colors and the closed launcher icon render correctly.
- Hidden language or theme controls remain hidden when their visibility props are `false`.

### API and fallback

- `POST /chat` succeeds from an allowed origin.
- The browser bundle does not contain Groq, Gemini, or Cloudflare credentials.
- The response `meta` identifies the successful provider during development.
- A missing key, rate limit, timeout, or unavailable provider moves to the next configured route.
- Recent conversation context remains available after a provider fallback.

### Events and host integration

- A successful answer emits `assistant.exchange.completed`.
- Closing a changed conversation emits `assistant.conversation.closed` once for that state.
- Event JSON includes the correct project, session, locale, optional visitor, page, and recent messages.
- A failed event endpoint triggers `onEventDeliveryError` without exposing backend credentials.
- The host backend defines consent, storage, retention, notifications, and human handoff.

## Expected limitations during testing

- Reloading the target page starts a new browser-side conversation.
- The demo `/events` endpoint returns `202` but does not persist the transcript or notify anyone.
- Project knowledge is limited to the validated public JSON payload; the assistant does not crawl the target site.
- Provider quotas are shared by all users of the configured provider account or project.
- The local mock proves integration behavior but does not evaluate the quality of a real model answer.

## Test result template

Record each real integration using a short report:

```text
Target project:
Framework and version:
React version:
First AI package version:
Target origin:
API environment: mock / local providers / deployed
Browsers and viewport sizes:
Chat request: pass / fail
Project context: pass / fail
Languages: pass / fail
Themes and custom icon: pass / fail
Events: pass / fail
Provider fallback: pass / fail / not tested
Problems found:
```

Do not publish the package until `npm run check`, `npm test`, `npm run build`, and `npm run test:consumer` all pass.
