# ASB Gold — Cloudflare deployment

Primary production address: https://asbgold.com

This is a static website migration. The package does not change DNS or deploy anything automatically. The first deployment goes to a workers.dev address for testing.

## What the files do

- `public/`: all website pages, images, PDFs, styles and browser JavaScript. Only this folder is served to visitors.
- `wrangler.jsonc`: tells Cloudflare to serve `public/`, use clean HTML URLs and show the existing 404 page for missing paths.
- `package.json`: installs Cloudflare's Wrangler development/deployment tool. Node.js is used on your computer and by the deployment system; the website does not need a running Node server.
- `public/_headers`: original image caching and client-folder noindex rules.
- `public/_redirects`: sends the missing legacy guide route to the homepage guide-request form with a temporary 302 redirect.

## 1. Preview locally

Install a current supported Node.js LTS release and Git. Extract this ZIP, then open the `asbgold-cloudflare` folder in VS Code. Open its terminal and run:

```sh
npm install
npm run dev
```

Open the local URL Wrangler prints. Stop the server with Ctrl+C. `npm install` creates `package-lock.json`; commit that file to lock the installed versions.

## 2. Put the project on GitHub

Create an empty private GitHub repository named `asbgold-website`. In the project terminal:

```sh
git init
git add .
git commit -m "Prepare ASB Gold for Cloudflare"
git branch -M main
git remote add origin https://github.com/YOUR-ACCOUNT/asbgold-website.git
git push -u origin main
```

Replace `YOUR-ACCOUNT` with your actual account or organization. Upload the extracted project, not the ZIP. The repository root should contain `wrangler.jsonc`, `package.json` and the `public` folder. The included ignore file excludes dependencies and local secret files.

## 3. Connect Cloudflare to GitHub

In Cloudflare, open Workers & Pages, create an application, and select the Git repository deployment workflow for Workers. Select the repository and use:

| Setting | Value |
|---|---|
| Worker/project name | `asbgold-website` |
| Production branch | `main` |
| Root directory | Repository root |
| Build command | Leave empty |
| Deploy command | `npx wrangler deploy` |

There is no compilation step because the pages are already HTML. The assets directory is configured in `wrangler.jsonc`; do not use a Pages output-directory setting for this Worker. Deploy, then open the workers.dev URL Cloudflare supplies. Future pushes to `main` deploy updates automatically.

Alternative without GitHub: run `npx wrangler login`, then `npm run deploy` from this project. Use one workflow consistently so the repository and deployed website stay aligned.

## 4. Check the test deployment

- Open the homepage, navigation links, contact page and client reports on desktop and mobile.
- Open PDF downloads and check video backgrounds.
- Confirm `/about.html` redirects to `/about`, `/free-gold-guide` reaches the homepage form, and an unknown URL returns the existing 404 page.
- Verify the metals ticker can fetch from `https://asb-metals.manualjny.workers.dev/`. Its backend code and API credentials were not in the export. CORS or account restrictions may require an update in that existing Worker.
- Coordinate a clearly labeled test lead through the GHL form and check its delivery and thank-you destination. Submissions may trigger existing notifications or automations.
- Google Ads' thank-you conversion snippet is still disabled with a placeholder. Obtain the correct conversion label before enabling it.

## 5. Connect asbgold.com after testing

The domain must be an active Cloudflare zone in the same account for a Worker Custom Domain. If it is already in Cloudflare, keep the existing zone. If it is elsewhere, copy and verify all DNS records, particularly email records, before changing nameservers.

Record the existing web-hosting DNS target so you can restore it if necessary. In the Worker, go to Settings > Domains & Routes > Add > Custom Domain and enter `asbgold.com`. Resolve any existing web-record conflict only as part of the planned cutover. Leave MX, SPF, DKIM, DMARC and unrelated subdomain records intact.

For subsequent deployments, also add this top-level setting to `wrangler.jsonc` so the production domain is represented in your source configuration:

```json
"routes": [{ "pattern": "asbgold.com", "custom_domain": true }]
```

Separate it from the preceding JSON field with a comma. Commit and push the change. Verify HTTPS, navigation and form delivery on the production address.

If you control `www.asbgold.com` and the longer domain, configure Cloudflare Redirect Rules to send them to `https://asbgold.com`, preserving the path and query string. Those source hostnames must reach Cloudflare, and HTTPS certificates must be active. These redirects are account configuration, not included in this package. Do not redirect the apex `asbgold.com` back to itself.

## Changes and remaining dependencies

The original 149 files are included. In four client articles, 22 longer-domain links now use local paths so they work on the test host and on asbgold.com. One of those links referenced a missing free-guide page; it now goes to `/#claim`, the existing guide-request form. Two legacy-path redirect entries were added. All original binary media and the shared JavaScript and CSS remain unchanged.

GHL forms, Google fonts/ads/maps, externally hosted media and the metals API still depend on their original services. The client folder's noindex rule is not authentication; its contents are accessible to anyone with the URL. Original image headers cache files for a year, so use new image filenames when replacing images to avoid stale browser copies.

Validation performed here: local HTML href/src/poster destinations and CSS URL references, configuration syntax, file sizes, and original-file preservation. No Cloudflare deployment, Wrangler runtime test, browser rendering check or live lead submission was performed here.

## Cloudflare references

- https://developers.cloudflare.com/workers/static-assets/get-started/
- https://developers.cloudflare.com/workers/ci-cd/builds/configuration/
- https://developers.cloudflare.com/workers/static-assets/routing/static-site-generation/
- https://developers.cloudflare.com/workers/configuration/routing/custom-domains/
