import type { Context } from "https://edge.netlify.com";

/**
 * Edge Function: Rewrites the PWA manifest link in HTML for lookbook pages.
 * 
 * When a user visits /lookbook/:slug, this function intercepts the HTML response
 * and updates the manifest link to include the slug as a query parameter.
 * This ensures the PWA install uses the correct start_url for that lookbook.
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
  
  // Get the original response (index.html via SPA fallback)
  const response = await context.next();
  
  // Only transform HTML responses
  const contentType = response.headers.get("content-type") || "";
  if (!contentType.includes("text/html")) {
    return response;
  }
  
  // Read the HTML body
  const html = await response.text();
  
  // Rewrite the manifest link to include the slug
  // Matches: href="/manifest.json" or href='/manifest.json' (with or without id)
  const modifiedHtml = html.replace(
    /(<link[^>]*rel=["']manifest["'][^>]*href=["'])\/manifest\.json(["'][^>]*>)/gi,
    `$1/manifest.json?slug=${encodeURIComponent(slug)}$2`
  );
  
  // Return the modified response with the same headers
  return new Response(modifiedHtml, {
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
