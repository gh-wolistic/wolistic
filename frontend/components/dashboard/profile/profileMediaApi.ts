import { getSupabaseBrowserClient } from "@/lib/supabase-browser";

const fallbackApiBase =
  typeof window !== "undefined"
    ? `${window.location.protocol}//${window.location.hostname}:8000`
    : "http://localhost:8000";

const rawApiBase =
  process.env.NEXT_PUBLIC_API_URL?.trim() ||
  process.env.NEXT_PUBLIC_API_BASE_URL?.trim() ||
  fallbackApiBase;

const API_BASE = rawApiBase.replace(/\/$/, "").endsWith("/api/v1")
  ? rawApiBase.replace(/\/$/, "")
  : `${rawApiBase.replace(/\/$/, "")}/api/v1`;

export type MediaSurface = "profile" | "cover" | "gallery" | "feed";

export type MediaAsset = {
  id: string;
  bucket_id: string;
  object_path: string;
  surface: MediaSurface;
  source_url?: string;
};

export type UploadedMediaResult = {
  signedUrl: string;
  media: MediaAsset;
};

function resolveBucketForSurface(surface: MediaSurface): string {
  return surface === "profile" || surface === "cover"
    ? "wolistic-media-profile"
    : "wolistic-media-feed";
}

function assertMimeType(file: File): void {
  const allowed = new Set(["image/jpeg", "image/jpg", "image/png", "image/webp", "image/avif"]);
  if (!allowed.has(file.type.toLowerCase())) {
    throw new Error("Unsupported image type. Please use JPG, PNG, WEBP, or AVIF.");
  }
}

function assertFileSize(file: File, surface: MediaSurface): void {
  const maxBytes = surface === "profile" || surface === "cover" ? 10 * 1024 * 1024 : 20 * 1024 * 1024;
  if (file.size > maxBytes) {
    throw new Error(`File is too large. Max allowed is ${Math.round(maxBytes / (1024 * 1024))} MB.`);
  }
}

function toAbsoluteSignedUrl(signedUrl: string): string {
  if (signedUrl.startsWith("http://") || signedUrl.startsWith("https://")) {
    return signedUrl;
  }

  const normalized = signedUrl.startsWith("/") ? signedUrl : `/${signedUrl}`;
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.replace(/\/$/, "");
  if (!supabaseUrl) {
    throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL");
  }

  if (normalized.startsWith("/storage/v1/")) {
    return `${supabaseUrl}${normalized}`;
  }

  return `${supabaseUrl}/storage/v1${normalized}`;
}

async function requestUploadIntent(
  token: string,
  params: { bucketId: string; surface: MediaSurface; file: File },
): Promise<{ bucket_id: string; object_path: string; surface: MediaSurface }> {
  const response = await fetch(`${API_BASE}/media/upload-intent`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      bucket_id: params.bucketId,
      surface: params.surface,
      file_name: params.file.name,
      mime_type: params.file.type,
      size_bytes: params.file.size,
    }),
  });

  if (!response.ok) {
    throw new Error(`Unable to create upload intent (${response.status})`);
  }

  return (await response.json()) as { bucket_id: string; object_path: string; surface: MediaSurface };
}

async function confirmUpload(
  token: string,
  params: {
    bucketId: string;
    objectPath: string;
    surface: MediaSurface;
    file: File;
    sourceUrl: string;
  },
): Promise<MediaAsset> {
  const response = await fetch(`${API_BASE}/media/confirm`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      bucket_id: params.bucketId,
      object_path: params.objectPath,
      surface: params.surface,
      mime_type: params.file.type,
      size_bytes: params.file.size,
      source_url: params.sourceUrl,
    }),
  });

  if (!response.ok) {
    throw new Error(`Unable to confirm media upload (${response.status})`);
  }

  return (await response.json()) as MediaAsset;
}

export async function uploadDashboardImage(
  token: string,
  file: File,
  surface: MediaSurface,
): Promise<UploadedMediaResult> {
  assertMimeType(file);
  assertFileSize(file, surface);

  const bucketId = resolveBucketForSurface(surface);
  const intent = await requestUploadIntent(token, { bucketId, surface, file });

  const supabase = getSupabaseBrowserClient();
  const { error: uploadError } = await supabase.storage
    .from(intent.bucket_id)
    .upload(intent.object_path, file, {
      contentType: file.type,
      upsert: true,
    });

  if (uploadError) {
    throw new Error(uploadError.message || "Failed to upload image to storage");
  }

  // Profile/cover media should use a stable public URL; DB stores normalized object path.
  const { data: publicData } = supabase.storage
    .from(intent.bucket_id)
    .getPublicUrl(intent.object_path);

  const signedUrl = toAbsoluteSignedUrl(publicData.publicUrl);
  const media = await confirmUpload(token, {
    bucketId: intent.bucket_id,
    objectPath: intent.object_path,
    surface,
    file,
    sourceUrl: signedUrl,
  });

  return { signedUrl, media };
}

export async function deleteDashboardMedia(token: string, media: MediaAsset): Promise<void> {
  const supabase = getSupabaseBrowserClient();
  const { error: removeError } = await supabase.storage.from(media.bucket_id).remove([media.object_path]);

  if (removeError) {
    throw new Error(removeError.message || "Failed to delete image from storage");
  }

  const response = await fetch(`${API_BASE}/media/${media.id}`, {
    method: "DELETE",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to delete media record (${response.status})`);
  }
}

export async function listMyMediaAssets(token: string): Promise<MediaAsset[]> {
  const response = await fetch(`${API_BASE}/media/my`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
    cache: "no-store",
  });

  if (!response.ok) {
    return [];
  }

  return (await response.json()) as MediaAsset[];
}

