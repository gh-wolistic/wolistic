import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, ExternalLink, ShieldCheck } from "lucide-react";
import { notFound } from "next/navigation";

import { ImageWithFallback } from "@/components/public/ImageWithFallback";
import { certificateProviderResults } from "@/components/public/results/results-data";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

type CertificateProviderDetailsPageProps = {
  params: Promise<{ providerId: string }>;
  searchParams?: Promise<{ returnTo?: string }>;
};

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") || "http://localhost:3000";

function findProvider(providerId: string) {
  return certificateProviderResults.find((provider) => provider.id === providerId);
}

function getProviderDescription(providerName: string, accreditationBody: string) {
  return `${providerName} offers certification tracks aligned with ${accreditationBody}, with clear verification and eligibility guidance.`;
}

export async function generateMetadata({ params }: CertificateProviderDetailsPageProps): Promise<Metadata> {
  const { providerId } = await params;
  const provider = findProvider(providerId);

  if (!provider) {
    return { title: "Certificate Provider Not Found", robots: { index: false, follow: true } };
  }

  const title = `${provider.name} | Certificate Provider`;
  const description = getProviderDescription(provider.name, provider.accreditationBody);
  const canonicalPath = `/certificate-provider/${provider.id}`;

  return {
    title,
    description,
    alternates: { canonical: canonicalPath },
    openGraph: {
      title,
      description,
      url: `${siteUrl}${canonicalPath}`,
      images: provider.image ? [{ url: provider.image }] : undefined,
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
    },
  };
}

export default async function CertificateProviderDetailsPage({ params, searchParams }: CertificateProviderDetailsPageProps) {
  const { providerId } = await params;
  const query = searchParams ? await searchParams : undefined;
  const provider = findProvider(providerId);

  if (!provider) {
    notFound();
  }

  const returnTo = query?.returnTo && query.returnTo.startsWith("/")
    ? query.returnTo
    : "/results?scope=services";

  return (
    <div className="py-10 lg:py-14">
      <div className="container mx-auto space-y-8 px-4 sm:px-6 lg:px-8">
        <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
          <Link href={returnTo} className="inline-flex items-center gap-1 hover:text-foreground">
            <ArrowLeft size={14} />
            Back to results
          </Link>
          <span>/</span>
          <span>Certificate Providers</span>
          <span>/</span>
          <span className="text-foreground">{provider.name}</span>
        </div>

        <section className="grid gap-8 lg:grid-cols-[1.05fr_0.95fr]">
          <Card className="overflow-hidden rounded-3xl border border-border/80">
            <div className="relative aspect-square sm:aspect-5/4">
              <ImageWithFallback src={provider.image} alt={provider.name} className="h-full w-full object-cover" />
            </div>
          </Card>

          <div className="space-y-6">
            <div className="space-y-3">
              <h1 className="text-3xl font-semibold tracking-tight lg:text-4xl">{provider.name}</h1>
              <p className="text-base leading-relaxed text-muted-foreground">
                {getProviderDescription(provider.name, provider.accreditationBody)}
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              <Badge variant="secondary">{provider.accreditationBody}</Badge>
              <Badge variant="outline">{provider.format}</Badge>
              <Badge variant="outline">{provider.duration}</Badge>
              <Badge variant="outline" className="gap-1.5"><ShieldCheck size={12} /> Verifiable certificate</Badge>
            </div>

            <Card className="space-y-2 rounded-2xl p-4 text-sm text-muted-foreground">
              <p><span className="font-medium text-foreground">Eligibility:</span> {provider.eligibility}</p>
              <p><span className="font-medium text-foreground">Fees:</span> {provider.fees}</p>
              <p><span className="font-medium text-foreground">Verification:</span> {provider.verificationMethod}</p>
            </Card>

            <div className="space-y-3">
              {provider.applyUrl ? (
                <Button asChild className="h-11 w-full bg-linear-to-r from-emerald-500 to-teal-600 text-white hover:from-emerald-600 hover:to-teal-700">
                  <a href={provider.applyUrl} target="_blank" rel="noopener noreferrer nofollow">
                    Apply now
                    <ExternalLink size={14} className="ml-1.5" />
                  </a>
                </Button>
              ) : (
                <Button className="h-11 w-full" disabled>
                  Enrollment link coming soon
                </Button>
              )}
            </div>
          </div>
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-semibold tracking-tight">Program Focus Areas</h2>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {provider.focusAreas.map((area) => (
              <Card key={area} className="rounded-2xl p-4 text-sm text-muted-foreground">
                {area}
              </Card>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
