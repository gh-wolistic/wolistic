import { getFeaturedProfessionals } from "@/components/public/data/professionalsApi";
import { getFeaturedProducts } from "@/components/public/data/productsApi";
import { getFeaturedWellnessCenters } from "@/components/public/data/wellnessCentersApi";
import type { ProfessionalProfile } from "@/types/professional";
import type { Product, WolisticService } from "@/types/wolistic";
import { LandingPageClient } from "./LandingPageClient";

export default async function Home() {
  let featuredProfessionals: ProfessionalProfile[];
  let featuredProducts: Product[];
  let featuredWellnessCenters: WolisticService[];

  try {
    featuredProfessionals = await getFeaturedProfessionals(8); // hard cap enforced in API + component
  } catch {
    featuredProfessionals = [];
  }

  try {
    featuredProducts = await getFeaturedProducts(8);
  } catch {
    featuredProducts = [];
  }

  try {
    featuredWellnessCenters = await getFeaturedWellnessCenters(8);
  } catch {
    featuredWellnessCenters = [];
  }

  return (
    <LandingPageClient
      featuredProfessionals={featuredProfessionals}
      featuredProducts={featuredProducts}
      featuredWellnessCenters={featuredWellnessCenters}
    />
  );
}
