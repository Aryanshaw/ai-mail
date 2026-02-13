"use client";

export default function HomePage() {
  return (
    <main className="mx-auto flex h-full w-full max-w-4xl flex-col px-4 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold tracking-tight">AI Mail Starter</h1>
        <p className="text-muted-foreground text-sm">
          Frontend is now decoupled from CopilotKit and ready for your FastAPI APIs.
        </p>
      </div>
      <div className="rounded-lg border bg-card p-4 text-sm text-muted-foreground">
        Build your pages and call backend endpoints from `http://localhost:8000`.
      </div>
    </main>
  );
}
