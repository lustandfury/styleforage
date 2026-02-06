import type { Context } from "https://edge.netlify.com";

/**
 * Edge Function: Modifies HTML for lookbook pages to support proper "Add to Home Screen".
 * 
 * For iOS: Removes PWA meta tags so Safari creates a simple bookmark that opens the
 * exact current URL (the lookbook page) instead of a PWA with potentially stale start_url.
 * 
 * For Android/Desktop: Updates the manifest link with the slug query parameter so the
 * PWA install uses the correct start_url for that lookbook.
 */
export default async function handler(request: Request, context: Context) {
  // Extract slug from the URL path
  const url = new URL(request.url);
  const match = url.pathname.match(/^\/lookbook\/([^/?#]+)/);
  
  if (!match) {
    // Not a lookbook path, pass through
    return context.next();
  }
  
  const slug = match[1];
  
  // Format slug as title (e.g. "lindsey-coulter" -> "Lindsey Coulter")
  const lookbookTitle = slug.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
  
  // Detect iOS via User-Agent header
  const userAgent = request.headers.get("user-agent") || "";
  const isIOS = /iphone|ipad|ipod/i.test(userAgent);
  
  // Get the original response (index.html via SPA fallback)
  const response = await context.next();
  
  // Only transform HTML responses
  const contentType = response.headers.get("content-type") || "";
  if (!contentType.includes("text/html")) {
    return response;
  }
  
  // Read the HTML body
  let html = await response.text();
  
  if (isIOS) {
    // iOS: Remove PWA capabilities entirely so "Add to Home Screen" creates a simple
    // Safari bookmark that opens the current URL (the lookbook page)
    
    // Remove apple-mobile-web-app-capable meta tag
    html = html.replace(
      /<meta[^>]*name=["']apple-mobile-web-app-capable["'][^>]*>\s*/gi,
      ''
    );
    
    // Remove the manifest link entirely - iOS doesn't reliably use it for bookmarks
    html = html.replace(
      /<link[^>]*rel=["']manifest["'][^>]*>\s*/gi,
      ''
    );
    
    // Update the apple-mobile-web-app-title to use the lookbook name
    html = html.replace(
      /(<meta[^>]*name=["']apple-mobile-web-app-title["'][^>]*content=["'])[^"']*?(["'][^>]*>)/gi,
      `$1${lookbookTitle}$2`
    );
  } else {
    // Android/Desktop: Rewrite the manifest link to include the slug for PWA install
    html = html.replace(
      /(<link[^>]*rel=["']manifest["'][^>]*href=["'])\/manifest\.json(["'][^>]*>)/gi,
      `$1/manifest.json?slug=${encodeURIComponent(slug)}$2`
    );
    
    // Rewrite the apple-mobile-web-app-title to use the lookbook name (for consistency)
    html = html.replace(
      /(<meta[^>]*name=["']apple-mobile-web-app-title["'][^>]*content=["'])[^"']*?(["'][^>]*>)/gi,
      `$1${lookbookTitle}$2`
    );
  }
  
  // Return the modified response with the same headers
  return new Response(html, {
    status: response.status,
    headers: response.headers,
  });
}

export const config = {
  // Run on lookbook paths, but exclude static assets
  path: "/lookbook/*",
  excludedPath: [
    "/lookbook/*.js",
    "/lookbook/*.css",
    "/lookbook/*.png",
    "/lookbook/*.jpg",
    "/lookbook/*.jpeg",
    "/lookbook/*.gif",
    "/lookbook/*.webp",
    "/lookbook/*.svg",
    "/lookbook/*.ico",
    "/lookbook/*.woff",
    "/lookbook/*.woff2",
  ],
};
