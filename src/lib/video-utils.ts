import { VideoEmbedData } from "@/types";

/**
 * Extract video ID and type from various video URLs
 */
export function parseVideoUrl(url: string): VideoEmbedData | null {
  // YouTube patterns
  const youtubeRegex =
    /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/;
  const youtubeMatch = url.match(youtubeRegex);

  if (youtubeMatch) {
    const videoId = youtubeMatch[1];
    return {
      url,
      type: "YOUTUBE",
      embedUrl: `https://www.youtube.com/embed/${videoId}`,
      thumbnail: `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`,
    };
  }

  // TikTok patterns
  const tiktokRegex = /(?:tiktok\.com\/)(?:@[\w.-]+\/video\/|v\/)?(\d+)/;
  const tiktokMatch = url.match(tiktokRegex);

  if (tiktokMatch) {
    const videoId = tiktokMatch[1];
    return {
      url,
      type: "TIKTOK",
      embedUrl: `https://www.tiktok.com/embed/v2/${videoId}`,
    };
  }

  // Instagram patterns
  const instagramRegex = /(?:instagram\.com\/(?:p|reel)\/)([\w-]+)/;
  const instagramMatch = url.match(instagramRegex);

  if (instagramMatch) {
    const postId = instagramMatch[1];
    return {
      url,
      type: "INSTAGRAM",
      embedUrl: `https://www.instagram.com/p/${postId}/embed`,
    };
  }

  return null;
}

/**
 * Generate slug from title
 */
export function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "") // Remove special characters
    .replace(/[\s_-]+/g, "-") // Replace spaces and underscores with hyphens
    .replace(/^-+|-+$/g, ""); // Remove leading/trailing hyphens
}

/**
 * Validate workspace slug
 */
export function isValidSlug(slug: string): boolean {
  const slugRegex = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
  return slugRegex.test(slug) && slug.length >= 3 && slug.length <= 50;
}

/**
 * Generate workspace domain
 */
export function generateWorkspaceDomain(slug: string): string {
  const baseUrl = process.env.APP_URL || "http://localhost:3000";
  return `${slug}.${baseUrl.replace(/^https?:\/\//, "")}`;
}

/**
 * Detect platform from affiliate URL
 */
export function detectPlatform(url: string): string {
  if (url.includes("shopee.vn") || url.includes("shopee.com")) return "shopee";
  if (url.includes("lazada.vn") || url.includes("lazada.com")) return "lazada";
  if (url.includes("tiki.vn")) return "tiki";
  if (url.includes("amazon.com") || url.includes("amazon.vn")) return "amazon";
  if (url.includes("sendo.vn")) return "sendo";
  if (url.includes("fptshop.com.vn")) return "fptshop";
  if (url.includes("thegioididong.com")) return "thegioididong";
  if (url.includes("cellphones.com.vn")) return "cellphones";
  return "other";
}

/**
 * Validate affiliate URL format
 */
export function validateAffiliateUrl(url: string): boolean {
  try {
    const urlObj = new URL(url);

    // Basic URL validation
    if (!urlObj.protocol.startsWith("http")) return false;

    // Check for common affiliate parameters
    const hasAffiliateParams =
      urlObj.searchParams.has("aff_id") ||
      urlObj.searchParams.has("affiliate_id") ||
      urlObj.searchParams.has("ref") ||
      urlObj.searchParams.has("utm_source") ||
      urlObj.pathname.includes("/aff/") ||
      urlObj.pathname.includes("/ref/");

    return hasAffiliateParams;
  } catch {
    return false;
  }
}

/**
 * Extract product info from affiliate URL (basic implementation)
 */
export function extractProductInfo(url: string): {
  name?: string;
  image?: string;
  price?: number;
} {
  // This is a basic implementation
  // In production, you might want to use web scraping or platform APIs
  const platform = detectPlatform(url);

  // For now, return empty object
  // TODO: Implement actual product info extraction
  return {};
}

/**
 * Format price with currency
 */
export function formatPrice(price: number, currency: string = "VND"): string {
  if (currency === "VND") {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(price);
  }

  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
  }).format(price);
}
