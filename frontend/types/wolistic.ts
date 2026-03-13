export type Product = {
  id: string;
  name: string;
  image?: string;
  category?: string;
  brand?: string;
  websiteName?: string;
  websiteUrl?: string;
  description?: string;
  price: number;
};

export type WolisticService = {
  id: string;
  title: string;
  type: string;
  location: string;
  imageUrl?: string;
  websiteName?: string;
  websiteUrl?: string;
  tags: string[];
};

export type WolisticArticle = {
  id: string;
  title: string;
  readTime: string;
};

export type WolisticSearchResult = {
  professionals: import("./professional").ProfessionalProfile[];
  products: Product[];
  services: WolisticService[];
  articles: WolisticArticle[];
};
