<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Style Forage

Personal styling and wardrobe consultation services website.

## Run Locally

**Prerequisites:** Node.js, [Netlify CLI](https://docs.netlify.com/cli/get-started/)

1. Install dependencies:
   ```bash
   npm install
   ```

2. Install Netlify CLI (if not already installed):
   ```bash
   npm install -g netlify-cli
   ```

3. Set the environment variables in `.env.local`:
   ```
   GEMINI_API_KEY=your_gemini_api_key
   STRIPE_SECRET_KEY=sk_test_...
   VITE_STRIPE_PUBLISHABLE_KEY=pk_test_...
   ```

4. Run the app with Netlify Dev (handles both frontend and serverless functions):
   ```bash
   netlify dev
   ```

   Or for frontend-only development (no API functions):
   ```bash
   npm run dev
   ```

## Deployment

The site is hosted on **Netlify**. Push to the main branch to trigger automatic deployments.

### Environment Variables (Production)

Set these in Netlify Dashboard → Site Settings → Environment Variables:

| Variable | Description | Where to get it |
|----------|-------------|-----------------|
| `GEMINI_API_KEY` | Google AI API key for style advice | [Google AI Studio](https://aistudio.google.com/) |
| `STRIPE_SECRET_KEY` | Stripe secret key (server-side only) | [Stripe Dashboard](https://dashboard.stripe.com/apikeys) |
| `VITE_STRIPE_PUBLISHABLE_KEY` | Stripe publishable key (client-side) | [Stripe Dashboard](https://dashboard.stripe.com/apikeys) |

**Note:** Use test keys (`sk_test_...` and `pk_test_...`) for development. Switch to live keys for production.
