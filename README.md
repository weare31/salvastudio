# 21 — Creative Studio (Vanilla HTML/CSS build)

Zero dependencies. Zero build step. Just `index.html` + `style.css`.
Double-click `index.html` to open it locally, or push the folder straight
to GitHub Pages.

## What's inside

- **Hero** — fullscreen video background, dark vignette, staggered
  entrance animation on load (pure CSS `@keyframes`, no JS).
- **Selected Work** — editorial grid, client / category / year, image
  scale + darken on hover (`:hover` + `transition`).
- **Services** — native `<details>/<summary>` accordion. No JavaScript;
  the browser handles open/close natively.
- **About** — statement copy + stat row.
- **Process** — Discover / Create / Produce / Deliver timeline.
- **Clients** — infinite logo marquee, pure CSS `@keyframes` loop,
  pauses on hover.
- **Testimonials** — slider built with hidden radio inputs + the
  general sibling selector (`~`) — no JavaScript.
- **Contact + Footer** — CTA, contact channels, oversized wordmark.
- **Mobile menu** — checkbox-hack toggle (hidden `<input type="checkbox">`
  + `<label>`), fullscreen overlay, animated burger icon — no JavaScript.

## Notes on "no JS" trade-offs

A few things that were JS-powered in the React version are now done
differently, on purpose, to keep this build 100% JS-free:

- **Custom cursor** — removed. A hand-following custom cursor cannot be
  built in pure CSS. Hover states (scale, translate, color) carry the
  interaction feedback instead.
- **Scroll-triggered fade-ins** — sections use `animation-timeline: view()`
  as a progressive enhancement (Chrome/Edge today). Where unsupported,
  content is simply visible with no animation — nothing breaks or hides.
- **Smooth scroll** — handled by the CSS property `scroll-behavior: smooth`
  on `<html>`, applied to the anchor-link navigation.

## Before launch

1. Add `videos/hero.mp4` (see `videos/README.txt`).
2. Add `images/hero-poster.jpg`, `images/og-cover.jpg`, `images/favicon.ico`
   (see `images/README.txt`).
3. Replace the Unsplash `<img src="...">` URLs in the Selected Work
   section of `index.html` with your own photography.
4. Update copy, email, phone and Instagram handle directly in
   `index.html` (Contact + Footer sections).
5. Google Fonts (Inter, JetBrains Mono) are loaded via `<link>` in
   `<head>` — swap for self-hosted `@font-face` files if you need a
   fully offline/no-external-request build.

## Browser support

Built on standard, well-supported CSS: Flexbox, Grid, `clamp()`,
`aspect-ratio`, custom properties. Works in all current evergreen
browsers. The one enhancement-only feature (`animation-timeline: view()`)
degrades gracefully via `@supports`.
