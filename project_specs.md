# IMAGO Marketing website prototype

## What the app does and who uses it

A one-page, responsive marketing website for IMAGO Marketing, a principal-led marketing and PR advisory firm. Prospective clients use it to understand the firm's approach and contact a principal.

## Tech stack

- Language: TypeScript
- Framework: Next.js App Router
- Styling: CSS using the supplied design tokens and responsive layout rules
- Database and authentication: None; this public prototype does not need accounts or persistence
- Hosting: Vercel-compatible

## Pages and user flows

- One public page with navigation, hero, About, How we work, Contact, and footer sections.
- Navigation and calls to action scroll to the relevant section.
- A visitor can enter contact details and submit the form; the server validates the submission and sends it to hope@imagomarketing.com through Resend. The site does not store submissions.
- Contact details display hope@imagomarketing.com, 210-862-9533, and San Antonio, TX.

## Data models and storage

- No persistent data models or storage.
- Contact form fields (name, email, organization, and message) are sent to the server only when submitted and are not stored by the site.
- `RESEND_API_KEY` is held in the server environment and is never exposed to the browser.

## Third-party services

- Google Fonts Geist for typography.
- GSAP with ScrollTrigger and `@gsap/react` powers restrained entrance animations. The existing butterfly script remains responsible for its canvas animation.
- The local `public/IMAGO_butterfly.svg` asset supplies the artwork drawn by the hero animation.
- The local `public/butterfly-loop.js` script animates that artwork with scroll-driven canvas transforms.
- Resend sends contact form messages to hope@imagomarketing.com.

## Source control and publishing

- The complete project is published to `https://github.com/madprofit/Imago.git` on the `main` branch in one initial commit.
- The project README explains how to install dependencies and run the site locally.
- Private environment files, dependencies, build output, and operating-system metadata are excluded from the upload.

## What done looks like

- The page follows the supplied design system and section structure, including responsive behavior down to 390px.
- It uses semantic landmarks and a single h1, with keyboard-visible focus, reduced-motion handling, and an accessible contact form flow.
- The hero uses a 320vh `data-butterfly-track` section and sticky stage with a canvas carrying `data-butterfly` and a 92px `data-offset`.
- The butterfly canvas displays and animates the actual `IMAGO_butterfly.svg` artwork through the local script.
- The animation remains scroll-driven, respects reduced motion, and pauses when off-screen.
- The butterfly has no CSS blur and remains enlarged to 3×.
- The About section contains only confirmed, general principal-led copy and no bracketed placeholder for unconfirmed personal credentials.
- GSAP introduces the hero copy on page load, then reveals section headings, the three process cards, and contact content with subtle opacity and vertical movement as they enter view.
- Motion uses short, calm easing without bounce or competing scroll effects; the butterfly animation remains independent.
- All GSAP motion is disabled for `prefers-reduced-motion`, and content remains visible if JavaScript animation is unavailable.
- The project builds successfully and the page can be checked in a browser.
- The butterfly animation script has no ESLint warnings without changing its rendering behavior.
- Dependency audit reports no known vulnerabilities; use a compatible patched transitive dependency rather than downgrading the Next.js ESLint configuration across major versions.
- The complete source project and required public assets are uploaded to the requested GitHub repository in one commit, without `.env.local`, generated files, or secrets.
- Contact form submissions are validated server-side and delivered through Resend; success and failure are clearly shown, and submissions are not persisted.
- The Resend API key is configured as a server-only environment variable and is not included in source control or client-side code.
