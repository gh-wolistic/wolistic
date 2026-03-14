import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, ExternalLink, MapPin, ShieldCheck, Star } from "lucide-react";
import { notFound } from "next/navigation";

import { ImageWithFallback } from "@/components/public/ImageWithFallback";
import { getWellnessCenterDetailById } from "@/components/public/data/wellnessCenterDetails";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

type WellnessCenterDetailsPageProps = {
  params: Promise<{ centerId: string }>;
  searchParams?: Promise<{ returnTo?: string }>;
};

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") || "http://localhost:3000";

function buildDescription(title: string, location: string, type: string) {
  return `${title} in ${location} offers ${type} programs focused on practical, sustainable wellness routines.`;
}

export async function generateMetadata({ params }: WellnessCenterDetailsPageProps): Promise<Metadata> {
  const { centerId } = await params;
  const center = await getWellnessCenterDetailById(centerId);

  if (!center) {
    return { title: "Wellness Center Not Found", robots: { index: false, follow: true } };
  }

  const title = `${center.title} | Wellness Center`;
  const description = buildDescription(center.title, center.location, center.type);
  const canonicalPath = `/wellness-center/${center.id}`;

  return {
    title,
    description,
    alternates: { canonical: canonicalPath },
    openGraph: {
      title,
      description,
      url: `${siteUrl}${canonicalPath}`,
      images: center.imageUrl ? [{ url: center.imageUrl }] : undefined,
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
    },
  };
}

export default async function WellnessCenterDetailsPage({ params, searchParams }: WellnessCenterDetailsPageProps) {
  const { centerId } = await params;
  const query = searchParams ? await searchParams : undefined;
  const center = await getWellnessCenterDetailById(centerId);

  if (!center) {
    notFound();
  }

  const returnTo = query?.returnTo && query.returnTo.startsWith("/")
    ? query.returnTo
    : "/results?scope=wellness-centers";

  return (
    <div className="py-10 lg:py-14">
      <div className="container mx-auto space-y-8 px-4 sm:px-6 lg:px-8">
        <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
          <Link href={returnTo} className="inline-flex items-center gap-1 hover:text-foreground">
            <ArrowLeft size={14} />
            Back to results
          </Link>
          <span>/</span>
          <span>Wellness Centers</span>
          <span>/</span>
          <span className="text-foreground">{center.title}</span>
        </div>

        <section className="grid gap-8 lg:grid-cols-[1.05fr_0.95fr]">
          <Card className="overflow-hidden rounded-3xl border border-border/80">
            <div className="relative aspect-square sm:aspect-5/4">
              {center.imageUrl ? (
                <ImageWithFallback src={center.imageUrl} alt={center.title} className="h-full w-full object-cover" />
              ) : (
                <div className="h-full w-full bg-muted" />
              )}
              <div className="absolute left-4 top-4 flex flex-wrap gap-2">
                <Badge variant="secondary">{center.type}</Badge>
              </div>
            </div>
          </Card>

          <div className="space-y-6">
            <div className="space-y-3">
              <h1 className="text-3xl font-semibold tracking-tight lg:text-4xl">{center.title}</h1>
              <div className="flex items-start gap-2 text-sm text-muted-foreground">
                <MapPin size={16} className="mt-0.5" />
                <span>{center.location}</span>
              </div>
              <p className="text-base leading-relaxed text-muted-foreground">
                {buildDescription(center.title, center.location, center.type)}
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              {center.tags.map((tag) => (
                <Badge key={tag} variant="outline">{tag}</Badge>
              ))}
              <Badge variant="outline" className="gap-1.5"><ShieldCheck size={12} /> Verified listing</Badge>
            </div>

            <Card className="space-y-2 rounded-2xl p-4">
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Pricing range</p>
              <p className="text-lg font-semibold">{center.pricingRange}</p>
            </Card>

            <div className="space-y-3">
              {center.websiteUrl ? (
                <Button asChild className="h-11 w-full bg-linear-to-r from-emerald-500 to-teal-600 text-white hover:from-emerald-600 hover:to-teal-700">
                  <a href={center.websiteUrl} target="_blank" rel="noopener noreferrer nofollow">
                    Contact center
                    <ExternalLink size={14} className="ml-1.5" />
                  </a>
                </Button>
              ) : (
                <Button className="h-11 w-full" disabled>
                  Contact details coming soon
                </Button>
              )}
            </div>
          </div>
        </section>

        <section className="grid gap-6 lg:grid-cols-2">
          <Card className="space-y-3 rounded-3xl p-6">
            <h2 className="text-lg font-semibold">Timings</h2>
            <ul className="space-y-2 text-sm text-muted-foreground">
              {center.timings.map((timing) => (
                <li key={timing}>- {timing}</li>
              ))}
            </ul>
          </Card>

          <Card className="space-y-3 rounded-3xl p-6">
            <h2 className="text-lg font-semibold">Facilities</h2>
            <ul className="space-y-2 text-sm text-muted-foreground">
              {center.facilities.map((facility) => (
                <li key={facility}>- {facility}</li>
              ))}
            </ul>
          </Card>

          <Card className="space-y-3 rounded-3xl p-6">
            <h2 className="text-lg font-semibold">Programs</h2>
            <ul className="space-y-2 text-sm text-muted-foreground">
              {center.programs.map((program) => (
                <li key={program}>- {program}</li>
              ))}
            </ul>
          </Card>

          <Card className="space-y-3 rounded-3xl p-6">
            <h2 className="text-lg font-semibold">Specialists</h2>
            <ul className="space-y-2 text-sm text-muted-foreground">
              {center.specialists.map((specialist) => (
                <li key={specialist}>- {specialist}</li>
              ))}
            </ul>
          </Card>
        </section>

        {center.gallery.length > 0 ? (
          <section className="space-y-4">
            <h2 className="text-2xl font-semibold tracking-tight">Gallery</h2>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {center.gallery.map((image, index) => (
                <div key={`${image}-${index}`} className="overflow-hidden rounded-2xl border border-border">
                  <div className="aspect-4/3 overflow-hidden">
                    <ImageWithFallback
                      src={image}
                      alt={`${center.title} gallery ${index + 1}`}
                      className="h-full w-full object-cover"
                    />
                  </div>
                </div>
              ))}
            </div>
          </section>
        ) : null}

        <section className="space-y-4">
          <h2 className="text-2xl font-semibold tracking-tight">What visitors say</h2>
          <div className="grid gap-4 md:grid-cols-2">
            {center.testimonials.map((testimonial) => (
              <Card key={testimonial.name} className="rounded-2xl p-5">
                <div className="mb-2 inline-flex items-center gap-1 text-amber-500">
                  <Star size={14} />
                  <Star size={14} />
                  <Star size={14} />
                  <Star size={14} />
                  <Star size={14} />
                </div>
                <p className="text-sm leading-relaxed text-muted-foreground">"{testimonial.quote}"</p>
                <p className="mt-3 text-sm font-medium">{testimonial.name}</p>
              </Card>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
