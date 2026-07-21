# Bring your own AI provider key

BYOK allows each First AI integrator to use their own Cloudflare, Groq, or Gemini account, quota, billing, and provider dashboard without exposing a permanent provider key to website visitors.

## Security boundary

Never pass a Groq or Gemini key to `AiAssistant`:

```tsx
// Never do this. Client props are public browser data.
<AiAssistant groqApiKey="gsk_..." />
```

React props, build-time frontend environment variables, HTML, and JavaScript bundles can be inspected by visitors. The component therefore accepts a public `apiUrl`, while the corresponding Worker reads provider credentials from server-side secrets.

```text
Host React application
        │
        │ public apiUrl
        ▼
Consumer-owned Cloudflare Worker
        │
        │ private provider secret
        ▼
Groq / Gemini / Workers AI
```

## Deploy a consumer-owned Worker

Clone this repository and install its dependencies:

```bash
npm install
npx wrangler login
```

Change these public values in `apps/api/wrangler.jsonc`:

- `name` — a unique Worker name owned by the consumer;
- `ALLOWED_ORIGINS` — comma-separated origins of the websites that may call it;
- `AI_ROUTES` — provider and model priority.

Example:

```json
{
  "name": "acme-first-ai",
  "vars": {
    "ALLOWED_ORIGINS": "http://localhost:5173,https://www.acme.example",
    "AI_ROUTES": "groq:openai/gpt-oss-120b,gemini:gemini-3.5-flash,workers-ai:@cf/zai-org/glm-4.7-flash"
  }
}
```

Deploy the Worker:

```bash
npm run deploy:api
```

The `workers-ai` route uses the consumer's Cloudflare account and `AI` binding. It does not need a Groq or Gemini key. Cloudflare usage and limits belong to that consumer account.

## Add an optional paid Groq or Gemini key

Run one or both commands from the repository root:

```bash
npm run secret:groq
npm run secret:gemini
```

Wrangler prompts for the value and stores it as a Cloudflare Worker secret. The value is not written to `wrangler.jsonc`, Git, the React bundle, or the browser.

Provider routes whose secrets are absent are skipped. For example, a Worker with only `GEMINI_API_KEY` skips Groq, tries Gemini, and can then fall back to Workers AI.

## Connect the React component

Use the deployed Worker URL without `/chat`:

```tsx
<AiAssistant
  siteId={project.id}
  project={project}
  apiUrl="https://acme-first-ai.example-account.workers.dev"
/>
```

The browser sends conversation and project context to `POST {apiUrl}/chat`. The Worker adds the private provider credential only when it calls the selected provider.

## GitHub Pages and other static hosting

Static hosting cannot keep provider credentials. Store only the public Worker URL in a frontend variable:

```text
VITE_ASSISTANT_API_URL=https://acme-first-ai.example-account.workers.dev
```

This repository's GitHub Pages workflow defaults to the public First AI demo Worker. Add `VITE_ASSISTANT_API_URL` as a repository variable only when you want to override it with another Worker, then run `Deploy demo to GitHub Pages` again.

## Quotas and ownership

- A shared Worker with shared provider secrets gives every allowed site access to the same provider quota.
- A separate consumer-owned Worker gives that consumer separate secrets, quota, billing, logs, allowed origins, and deployment control.
- `siteId` is public project context, not billing isolation or authentication.
- Production Workers still need rate limiting and abuse protection. CORS prevents normal browser calls from unapproved origins but does not stop direct scripted requests.
