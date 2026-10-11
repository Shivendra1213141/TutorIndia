# TutorSetu

Home-tutor marketplace for KG–12 (UP Board, CBSE, ICSE) and JEE/NEET.
React (Vite) frontend + Node.js/Express + MongoDB backend.

## What's included

**Pages:** Home · Home tuition by city (`/home-tuition/lucknow`) · City + subject (`/home-tuition/lucknow/physics`) · Subject (`/tuition/physics`) · Find tutors (filters, sort, pagination) · Tutor profile with reviews and demo booking · Post requirement (creates a parent account inline) · Tuition jobs feed · Become a tutor (2-step signup) · Login / Register · Parent dashboard · Tutor dashboard · Admin panel · How it works · Contact · Terms · 404

**Tutor onboarding**
1. Tutor creates an account and teaching profile.
2. Uploads Aadhaar (image/PDF) + last 4 digits. Only the last 4 digits are stored.
3. Pays the registration fee to your UPI ID (QR code + "Open UPI app" link), then uploads the screenshot and UTR.
4. Admin approves the payment and verifies Aadhaar → profile goes live and the tutor can apply to tuitions.

**Admin panel** (`/admin`): review payment screenshots, verify Aadhaar, suspend tutors, block users, delete requirements, and change the **registration fee, UPI ID and support contacts** under Settings.

**Contact sharing rules**
- Parent's number is hidden from the tuition feed. A tutor sees it only after the parent shortlists them, or when the parent books a demo with them.
- Tutor's number is shown to a parent when the tutor applies to their requirement or accepts their demo.
- Aadhaar files and payment screenshots are never public; they are streamed only to admins.

**Badges:** "Aadhaar verified" appears only after an admin approves it. Degrees are shown as "Stated by tutor". To change that wording, edit `TrustBadges` in `client/src/components/ui.jsx`.

## Run locally

Requirements: Node 18+, MongoDB (local or a free MongoDB Atlas cluster).

```bash
# 1. Backend
cd server
cp .env.example .env          # set MONGO_URI, JWT_SECRET, ADMIN_*, UPI_ID
npm install
npm run seed:demo             # optional: admin + 8 sample tutors + 6 sample requirements
npm run dev                   # API on http://localhost:5050

# 2. Frontend (second terminal)
cd client
npm install
npm run images                # downloads the site photos into public/images (once)
npm run dev                   # site on http://localhost:5173
```

Log in at `/login` with `ADMIN_EMAIL` / `ADMIN_PASSWORD` from `.env` (default `admin@tutorsetu.in` / `Admin@12345`). **Change this password** in Admin → Settings.

Sample accounts from `seed:demo` use the password `Sample@123` (e.g. `parent@sample.tutorsetu.in`). Remove all sample data with `npm run seed -- --clear-demo`.

## Deploy (single server)

The Express server serves the built React app, so one Node process runs the whole site.

```bash
cd client && npm install && npm run images && npm run build   # creates client/dist/client + dist/server
cd ../server && npm install --omit=dev
NODE_ENV=production npm start
```

Production checklist:
- Set a long random `JWT_SECRET` (the server refuses to start in production without one).
- Use MongoDB Atlas (or a managed MongoDB) for `MONGO_URI`.
- Keep `server/uploads/` on a persistent disk and back it up. On platforms with ephemeral disks (Render free tier, Heroku), uploaded files are lost on restart; mount a persistent volume or move uploads to S3/GCS.
- Set `SITE_URL=https://www.yourdomain.in` in `server/.env` (used in canonical links, sitemap and social previews).
- Put the site behind HTTPS (Nginx + Let's Encrypt, or your host's TLS).
- If the frontend is hosted separately, build it with `VITE_API_URL=https://api.yourdomain.in` and add that frontend origin to `CLIENT_ORIGIN`.

## SEO: what's built in

To see exactly what Google sees, run the production build (`npm run build` in `client/`, then `npm start` in `server/`) and open http://localhost:5050. The Vite dev server on :5173 renders in the browser only.

- **Server-side rendering.** Every public page is rendered to full HTML on the server, with its title, description, canonical URL, Open Graph tags and tutor data already in the page. Unknown pages and tutors return a real `404`.
- **Landing pages for the searches parents make:** `/home-tuition/<city>` ("home tuition in Lucknow"), `/home-tuition/<city>/<subject>` ("physics home tutor in Lucknow") and `/tuition/<subject>`, for 10 cities × 12 subjects. Each page lists live tutors and has its own FAQ and internal links.
- **Structured data (schema.org JSON-LD):** EducationalOrganization, WebSite with a sitelinks search box, FAQPage, BreadcrumbList, Service and Person (tutor profiles).
- **`/sitemap.xml`** (static pages, city and subject pages, every live tutor) and **`/robots.txt`** (keeps `/admin`, dashboards and `/api` out of search).
- Gzip compression, long-cache static assets, lazy-loaded images with alt text, mobile-friendly layout, and a WhatsApp button that uses the support phone from Admin → Settings.

**Edit cities, localities, subjects, FAQs, brand name and photos in one file:** `client/src/lib/site.js`. Rebuild after changes. To use your own photos, put them at `client/public/images/<name>.jpg` (names are listed in `site.js`). Real photos of your tutors and students build more trust than stock photos.

### Getting to the top of Google (things code can't do)

No website can guarantee the #1 position. Rankings for "home tuition" and "home tutor near me" depend heavily on things outside the code:

1. **Google Business Profile.** Create one for your business, with your phone, service areas and photos. This drives the map results for "home tutor near me", which show above normal results.
2. **Google Search Console.** Verify your domain (put the HTML-tag code in `GOOGLE_SITE_VERIFICATION`), submit `https://yourdomain/sitemap.xml`, and watch which searches you appear for.
3. **Reviews.** Ask every happy parent for a Google review. Review count and rating strongly affect local rankings.
4. **Unique local content.** Add a few real lines per city in `site.js` (popular schools, exam dates, your tutors' results). Near-identical city pages rank worse.
5. **Links and listings.** Get listed on Justdial, Sulekha and local school or coaching directories with the same name, phone and address everywhere.
6. **Speed and HTTPS.** Host in India (or behind a CDN) with HTTPS. Check your pages with Google PageSpeed Insights.

Expect new domains to take 2–6 months to rank for competitive searches.

## API overview

| Area | Endpoints |
|---|---|
| Auth | `POST /api/auth/register`, `/register-tutor`, `/login`, `/change-password` · `GET /api/auth/me` |
| Tutors | `GET /api/tutors` (search) · `GET /api/tutors/:id` · `GET/PUT /api/tutors/me/profile` · `POST /api/tutors/me/aadhaar`, `/me/photo` |
| Payments | `GET /api/payments/settings` · `POST /api/payments` (screenshot + UTR) |
| Requirements | `POST /api/requirements` · `GET /mine` · `PATCH /:id` · `GET /feed` · `POST /:id/apply` |
| Applications | `GET /api/applications/mine` · `PATCH /api/applications/:id` |
| Demos | `POST /api/demos` · `GET /mine` · `PATCH /:id` · `POST /:id/review` |
| Admin | `/api/admin/stats`, `/payments`, `/tutors`, `/tutors/:id/aadhaar`, `/tutors/:id/status`, `/files/:kind/:id`, `/requirements`, `/users`, `/settings` |

## Project layout

```
server/
  src/index.js            start-up, creates the first admin
  src/app.js              Express app, routes, error handling
  src/seo.js              server-side rendering, sitemap.xml, robots.txt
  src/models/index.js     User, Tutor, Payment, Requirement, Application, Demo, Review, Settings
  src/routes/*.js         auth, tutors, payments, requirements, demos, admin
  src/seed.js             admin + optional sample data
  uploads/public          profile photos (public)
  uploads/private         Aadhaar + payment screenshots (admin only)
client/
  src/lib/site.js         brand, cities, localities, subjects, FAQs, photos (edit me)
  src/entry-server.jsx    server renderer · src/entry-client.jsx browser entry
  src/App.jsx             route table (shared by browser and server)
  src/pages/SeoPages.jsx  city, city + subject and subject landing pages
  src/pages/*.jsx         one file per page
  src/components/         layout, cards, shared form fields
  src/lib/                API client, auth context, constants
  src/styles.css          design tokens and styles (light theme)
```

## Not included yet (good next steps)

- SMS/WhatsApp or email notifications (e.g. when a tutor applies or a payment is approved)
- Forgot-password flow (needs an email or SMS provider)
- Automatic payment confirmation (requires a gateway such as Razorpay instead of manual UPI screenshots)
# TutorIndia
