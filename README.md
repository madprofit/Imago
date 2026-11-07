# Imago

One-page website for IMAGO Marketing, built with Next.js, TypeScript, and CSS.

## Run locally

1. Install Node.js 20 or newer.
2. Install project dependencies:

   ```bash
   npm install
   ```

3. Start the development server:

   ```bash
   npm run dev
   ```

4. Open [http://localhost:3000](http://localhost:3000).

## Contact form

The contact form sends messages through Resend. Copy `.env.example` to `.env.local` and set `RESEND_API_KEY` to a Resend API key. Keep `.env.local` private; it is excluded from Git.

## Checks

```bash
npm run lint
npm run build
npm audit
```
