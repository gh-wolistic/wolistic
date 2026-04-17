import { SessionDetailsPage } from "@/components/sessions/SessionDetailsPage";

interface PageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function SessionPage({ params }: PageProps) {
  const { id } = await params;
  const sessionId = parseInt(id);

  if (isNaN(sessionId)) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-zinc-950 via-zinc-900 to-zinc-950 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-white mb-2">Invalid Session</h1>
          <p className="text-zinc-400">The session ID provided is not valid.</p>
        </div>
      </div>
    );
  }

  return <SessionDetailsPage sessionId={sessionId} />;
}
