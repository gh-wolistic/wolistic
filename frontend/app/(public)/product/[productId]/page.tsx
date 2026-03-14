import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, ExternalLink, ShieldCheck, Sparkles, Star } from "lucide-react";
import { notFound } from "next/navigation";

import { ImageWithFallback } from "@/components/public/ImageWithFallback";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { slugifyBrandName } from "@/components/public/results/brand-utils";
import { productResults } from "@/components/public/results/results-data";

type ProductDetailsPageProps = {
  params: Promise<{ productId: string }>;
  searchParams?: Promise<{ returnTo?: string }>;
};

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") || "http://localhost:3000";

function findProduct(productId: string) {
  return productResults.find((product) => product.id === productId);
}

function getOverview(productName: string, brandName: string) {
  return `${productName} by ${brandName} is curated for practical wellness routines and long-term consistency.`;
}

function getUsage(productName: string) {
  return [
    `Start with a small, consistent routine using ${productName}.`,
    "Track comfort, adherence, and noticeable outcomes for at least 2-4 weeks.",
    "Adjust frequency based on your lifestyle and professional guidance.",
  ];
}

function getSafetyNotes() {
  return [
    "Review ingredients and suitability if you have allergies or sensitivities.",
    "Consult a qualified healthcare professional for medical conditions or medications.",
    "Stop use and seek expert advice if discomfort persists.",
  ];
}

function getFaq(productName: string) {
  return [
    {
      question: `Who is ${productName} best suited for?`,
      answer: "People looking for a practical wellness add-on that can be sustained in daily life.",
    },
    {
      question: "How long before I notice outcomes?",
      answer: "Most users should evaluate consistency and response over a few weeks, not a few days.",
    },
    {
      question: "Can I use this with other routines?",
      answer: "Usually yes, but align with professional advice when combining multiple interventions.",
    },
  ];
}

export async function generateMetadata({ params }: ProductDetailsPageProps): Promise<Metadata> {
  const { productId } = await params;
  const product = findProduct(productId);

  if (!product) {
    return { title: "Product Not Found", robots: { index: false, follow: true } };
  }

  const title = `${product.name} | ${product.brandName}`;
  const description = getOverview(product.name, product.brandName);
  const canonicalPath = `/product/${product.id}`;

  return {
    title,
    description,
    alternates: { canonical: canonicalPath },
    openGraph: {
      title,
      description,
      url: `${siteUrl}${canonicalPath}`,
      images: product.image ? [{ url: product.image }] : undefined,
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
    },
  };
}

export default async function ProductDetailsPage({ params, searchParams }: ProductDetailsPageProps) {
  const { productId } = await params;
  const query = searchParams ? await searchParams : undefined;
  const product = findProduct(productId);

  if (!product) {
    notFound();
  }

  const returnTo = query?.returnTo && query.returnTo.startsWith("/")
    ? query.returnTo
    : "/results?scope=products";

  const overview = getOverview(product.name, product.brandName);
  const usage = getUsage(product.name);
  const safetyNotes = getSafetyNotes();
  const faqItems = getFaq(product.name);
  const relatedProducts = productResults
    .filter((item) => item.id !== product.id && item.category === product.category)
    .slice(0, 3);
  const brandHref = `/brand/${slugifyBrandName(product.brandName)}?returnTo=${encodeURIComponent(returnTo)}`;
  const destinationDomain = product.externalUrl
    ? (() => {
      try {
        return new URL(product.externalUrl).hostname.replace(/^www\./, "");
      } catch {
        return null;
      }
    })()
    : null;

  return (
    <div className="py-10 lg:py-14">
      <div className="container mx-auto space-y-8 px-4 sm:px-6 lg:px-8">
        <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
          <Link href={returnTo} className="inline-flex items-center gap-1 hover:text-foreground">
            <ArrowLeft size={14} />
            Back to results
          </Link>
          <span>/</span>
          <span>Products</span>
          <span>/</span>
          <span className="text-foreground">{product.name}</span>
        </div>

        <section className="grid gap-8 lg:grid-cols-[1.05fr_0.95fr]">
          <Card className="overflow-hidden rounded-3xl border border-border/80">
            <div className="relative aspect-square sm:aspect-5/4">
              <ImageWithFallback src={product.image} alt={product.name} className="h-full w-full object-cover" />
              <div className="absolute left-4 top-4 flex flex-wrap gap-2">
                <Badge variant="secondary">{product.category}</Badge>
                {product.isFeatured ? <Badge>Featured</Badge> : null}
              </div>
            </div>
          </Card>

          <div className="space-y-6">
            <div className="space-y-3">
              <Link href={brandHref} className="inline-flex text-sm font-medium uppercase tracking-wide text-muted-foreground hover:text-foreground">
                {product.brandName}
              </Link>
              <h1 className="text-3xl font-semibold tracking-tight lg:text-4xl">{product.name}</h1>
              <p className="text-base leading-relaxed text-muted-foreground">{product.description}</p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <div className="inline-flex items-center gap-1 rounded-full border border-border px-3 py-1.5 text-sm">
                <Star size={14} className="text-amber-500" />
                <span className="font-semibold">{product.rating.toFixed(1)}</span>
              </div>
              <p className="text-2xl font-semibold tracking-tight">Rs {product.price.toLocaleString("en-IN")}</p>
            </div>

            <div className="space-y-3">
              {product.externalUrl ? (
                <Button asChild className="h-11 w-full bg-linear-to-r from-emerald-500 to-teal-600 text-white hover:from-emerald-600 hover:to-teal-700">
                  <a href={product.externalUrl} target="_blank" rel="noopener noreferrer nofollow">
                    Buy on brand site
                    <ExternalLink size={14} className="ml-1.5" />
                  </a>
                </Button>
              ) : (
                <Button className="h-11 w-full" disabled>
                  External purchase unavailable
                </Button>
              )}
              <p className="text-xs text-muted-foreground">
                {destinationDomain
                  ? `You will be redirected to ${destinationDomain} to complete purchase.`
                  : "This listing is currently informational and may not have a live purchase link."}
              </p>
            </div>
          </div>
        </section>

        <section className="grid gap-6 lg:grid-cols-2">
          <Card className="space-y-3 rounded-3xl p-6">
            <div className="flex items-center gap-2">
              <Sparkles size={16} className="text-emerald-600" />
              <h2 className="text-lg font-semibold">Overview and Benefits</h2>
            </div>
            <p className="text-sm leading-relaxed text-muted-foreground">{overview}</p>
          </Card>

          <Card className="space-y-3 rounded-3xl p-6">
            <div className="flex items-center gap-2">
              <ShieldCheck size={16} className="text-emerald-600" />
              <h2 className="text-lg font-semibold">Safety Notes</h2>
            </div>
            <ul className="space-y-2 text-sm text-muted-foreground">
              {safetyNotes.map((item) => (
                <li key={item} className="leading-relaxed">- {item}</li>
              ))}
            </ul>
          </Card>

          <Card className="space-y-3 rounded-3xl p-6">
            <h2 className="text-lg font-semibold">Usage Guidance</h2>
            <ul className="space-y-2 text-sm text-muted-foreground">
              {usage.map((item) => (
                <li key={item} className="leading-relaxed">- {item}</li>
              ))}
            </ul>
          </Card>

          <Card className="space-y-3 rounded-3xl p-6">
            <h2 className="text-lg font-semibold">FAQ</h2>
            <div className="space-y-3">
              {faqItems.map((item) => (
                <div key={item.question} className="rounded-xl border border-border/70 p-3">
                  <h3 className="text-sm font-semibold">{item.question}</h3>
                  <p className="mt-1 text-sm text-muted-foreground">{item.answer}</p>
                </div>
              ))}
            </div>
          </Card>
        </section>

        {relatedProducts.length > 0 ? (
          <section className="space-y-4">
            <h2 className="text-2xl font-semibold tracking-tight">Related Products</h2>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {relatedProducts.map((related) => (
                <Link
                  key={related.id}
                  href={`/product/${related.id}?returnTo=${encodeURIComponent(returnTo)}`}
                  className="group overflow-hidden rounded-2xl border border-border bg-card"
                >
                  <div className="aspect-4/3 overflow-hidden">
                    <ImageWithFallback
                      src={related.image}
                      alt={related.name}
                      className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.02]"
                    />
                  </div>
                  <div className="space-y-2 p-4">
                    <h3 className="line-clamp-2 text-sm font-semibold">{related.name}</h3>
                    <p className="text-xs text-muted-foreground">{related.brandName}</p>
                    <p className="text-sm font-semibold">Rs {related.price.toLocaleString("en-IN")}</p>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        ) : null}
      </div>
    </div>
  );
}