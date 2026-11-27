# MyDupeGolden

A responsive AI-assisted product alternative finder. Includes a polished frontend, Express API, SQLite persistence, optional OpenAI-powered match reasoning, demo catalog, and basic API tests.

## Run locally

Requirements: Node.js 20+

```bash
cp .env.example .env
npm install
npm test
npm start
```

Open http://localhost:3000.

## What works now

- Product URL input and validation
- Category filters: furniture, fashion, handbags, shoes, accessories, home décor
- Maximum price and minimum savings filters
- Search history and match persistence in SQLite
- Responsive landing page, metadata, canonical tag, Open Graph metadata, and JSON-LD
- Demo matches so the UI can be tested without API credentials
- Optional OpenAI API integration when `OPENAI_API_KEY` is configured

## Important production work before launch

This is a deployable starter, not a fully connected live product-search network. The demo catalog is illustrative. The OpenAI integration deliberately does not fabricate retailer inventory, live URLs, or verified prices. To deliver trustworthy live dupes, connect licensed retailer/affiliate product feeds or a compliant product search provider, normalize their product records, and pass those verified records into the matcher. Do not scrape retailer pages without checking their terms and robots policies.

The current API stores searches and matches in SQLite. For horizontally scaled production hosting, use managed PostgreSQL or a persistent volume for SQLite. Add authentication, rate limiting, abuse monitoring, request logging, backups, privacy/terms pages, and affiliate disclosures before public launch. Set `APP_ORIGIN` to the deployed domain and configure secrets in the hosting provider (never commit `.env`).

## Deploy

### Render / Railway / Fly.io
- Push this folder to a private or public Git repository.
- Create a Node web service using Node 20+.
- Build command: `npm install`
- Start command: `npm start`
- Configure `PORT`, `APP_ORIGIN`, `DATABASE_FILE`, and optional `OPENAI_API_KEY`.
- Attach persistent storage at the directory used by `DATABASE_FILE`, or migrate `src/db.js` to managed PostgreSQL.
- Set the final domain and verify `/api/health`.

### Netlify
The static frontend can be hosted on Netlify, but the Express API and SQLite database need a separate Node host or a serverless/database adaptation. Configure the frontend API base URL if you split the services.

## API

- `GET /api/health`
- `GET /api/categories`
- `POST /api/search` body:
  `{ "url": "https://shop.example/item", "category": "fashion", "maxPrice": 150, "minSavings": 30, "sourcePrice": 500 }`
- `GET /api/search/:id`

`sourcePrice` is optional and can be entered in the Original product price field. When supplied, the minimum-savings filter is calculated against that amount. Without it, maximum price still works, but minimum savings cannot be verified.

## Security notes

- Helmet security headers are enabled.
- Request body size is limited.
- Inputs are schema-validated.
- Product links are rendered as safe HTTP(S) links.
- Arbitrary URL fetching is not performed by the server, avoiding a common SSRF exposure.
- Add rate limiting and authentication before exposing high-volume public search endpoints.
