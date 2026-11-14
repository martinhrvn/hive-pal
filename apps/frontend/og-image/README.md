# Social preview image

`template.html` is the source of `public/og-image.jpg`, the 1200×630 card shown
when a hivepal.app link is shared (`og:image` / `twitter:image` in
`src/root.tsx`). It uses the landing page's hero photo, logo and self-hosted
fonts straight from `../public`, so rendering needs no network access.

Edit the template, then regenerate from the repo root:

```bash
devenv shell -- bash -c 'unset LD_LIBRARY_PATH; cd apps/frontend && pnpm og:image'
```

Commit the updated `public/og-image.jpg` along with the template.

Keep the logo, headline and tagline inside the centre 630×630 area: some
platforms (WhatsApp, some Facebook layouts) crop the card to a square.

Social platforms cache previews per URL. After changing the image, refresh it
with the Facebook Sharing Debugger or LinkedIn Post Inspector if an old
preview keeps showing.
