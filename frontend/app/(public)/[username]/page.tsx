import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";

import {
  getProfessionalById,
  getProfessionalByUsername,
} from "@/components/public/data/professionalsApi";
import { ProfessionalDetailPage } from "@/components/public/expertdetails/ProfessionalDetailPage";

export const dynamic = "force-dynamic";

type ProfileByUsernamePageProps = {
  params: Promise<{ username: string }>;
};

const siteUrl =
  process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") || "http://localhost:3000";

function isUuid(value: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    value,
  );
}

function buildProfileDescription(
  professional: Awaited<ReturnType<typeof getProfessionalByUsername>>,
): string {
  if (!professional) {
    return "Explore verified wellness professionals on Wolistic.";
  }
  return `${professional.name} is a ${professional.specialization} in ${professional.location}. ${professional.approach ?? ""}`.trim();
}

export async function generateMetadata({
  params,
}: ProfileByUsernamePageProps): Promise<Metadata> {
  const { username } = await params;

  if (isUuid(username)) {
    const prof = await getProfessionalById(username);
    if (!prof) {
      return { title: "Professional Not Found", robots: { index: false, follow: true } };
    }
    return {
      title: `${prof.name} - ${prof.specialization}`,
      description: buildProfileDescription(prof),
      alternates: { canonical: `/${prof.username}` },
      openGraph: {
        title: `${prof.name} - ${prof.specialization}`,
        description: buildProfileDescription(prof),
        url: `${siteUrl}/${prof.username}`,
        images: prof.image ? [{ url: prof.image }] : undefined,
      },
      twitter: {
        card: "summary_large_image",
        title: `${prof.name} - ${prof.specialization}`,
        description: buildProfileDescription(prof),
      },
    };
  }

  const professional = await getProfessionalByUsername(username);
  if (!professional) {
    return { title: "Professional Not Found", robots: { index: false, follow: true } };
  }

  return {
    title: `${professional.name} - ${professional.specialization}`,
    description: buildProfileDescription(professional),
    keywords: [
      professional.name,
      professional.specialization,
      professional.category ?? "",
      professional.location ?? "",
      "wellness professional",
      "book consultation",
    ],
    alternates: { canonical: `/${professional.username}` },
    openGraph: {
      title: `${professional.name} - ${professional.specialization}`,
      description: buildProfileDescription(professional),
      url: `${siteUrl}/${professional.username}`,
      images: professional.image ? [{ url: professional.image }] : undefined,
      type: "profile",
    },
    twitter: {
      card: "summary_large_image",
      title: `${professional.name} - ${professional.specialization}`,
      description: buildProfileDescription(professional),
    },
  };
}

export default async function ProfileByUsernamePage({
  params,
}: ProfileByUsernamePageProps) {
  const { username } = await params;

  if (isUuid(username)) {
    const prof = await getProfessionalById(username);
    if (!prof) notFound();
    redirect(`/${prof!.username}`);
  }

  const professional = await getProfessionalByUsername(username);
  if (!professional) notFound();

  const personJsonLd = {
    "@context": "https://schema.org",
    "@type": "Person",
    name: professional.name,
    description: buildProfileDescription(professional),
    image: professional.image,
    jobTitle: professional.specialization,
    worksFor: { "@type": "Organization", name: "Wolistic" },
    address: {
      "@type": "PostalAddress",
      addressLocality: professional.location,
    },
    aggregateRating: {
      "@type": "AggregateRating",
      ratingValue: professional.rating,
      reviewCount: professional.reviewCount,
    },
    knowsAbout: professional.specializations,
    url: `${siteUrl}/${professional.username}`,
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(personJsonLd) }}
      />
      <ProfessionalDetailPage professional={professional} />
    </>
  );
}
