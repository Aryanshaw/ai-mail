# AI Mail Starter

Minimal CopilotKit + LangGraph starter with:
- `apps/app`: Next.js frontend (Copilot chat UI)
- `apps/agent`: LangGraph backend agent

## Setup

1. Install dependencies:

```bash
pnpm install
```

2. Create env file:

```bash
cp .env.example .env
```

3. Add your key to `.env`:

```bash
OPENAI_API_KEY=your-openai-api-key-here
```

4. Run both frontend and backend:

```bash
pnpm dev
```

5. Open:

```text
http://localhost:3000
```

## Scripts

- `pnpm dev`: run app + agent
- `pnpm dev:app`: run frontend only
- `pnpm dev:agent`: run backend only
- `pnpm build`: build workspace
- `pnpm lint`: lint workspace
