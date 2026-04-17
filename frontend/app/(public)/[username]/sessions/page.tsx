import { SessionsBrowsePage } from "@/components/sessions/SessionsBrowsePage";

interface PageProps {
  params: Promise<{
    username: string;
  }>;
}

export default async function ProfessionalSessionsPage({ params }: PageProps) {
  const { username } = await params;

  // TODO: Fetch professional details to get display name
  // For now, using username as display name
  const professionalName = username;

  return (
    <SessionsBrowsePage 
      professionalUsername={username}
      professionalName={professionalName}
    />
  );
}
