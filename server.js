import "dotenv/config";
import express from "express";
import helmet from "helmet";
import cors from "cors";
import { z } from "zod";
import { db } from "./db.js";
import { findDupes } from "./matcher.js";

const app = express();
app.use(helmet({ contentSecurityPolicy: false }));
app.use(cors({ origin: process.env.APP_ORIGIN || true }));
app.use(express.json({ limit: "30kb" }));
app.use(express.static("public"));

const categories = ["furniture", "fashion", "handbags", "shoes", "accessories", "home décor"];
const schema = z.object({
  url: z.string().url().max(2048),
  category: z.enum(categories),
  maxPrice: z.number().nonnegative().max(100000).optional().nullable(),
  minSavings: z.number().min(0).max(100).default(20),
  sourcePrice: z.number().positive().max(1000000).optional().nullable()
});

app.get("/api/health", (_req, res) => res.json({ ok: true, service: "MyDupeGolden API" }));
app.get("/api/categories", (_req, res) => res.json({ categories }));

app.post("/api/search", async (req, res) => {
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "Please provide a valid product URL and filter values." });

  const input = parsed.data;
  const host = new URL(input.url).hostname.toLowerCase();
  if (["localhost", "127.0.0.1", "0.0.0.0"].includes(host)) {
    return res.status(400).json({ error: "That URL cannot be searched." });
  }

  try {
    const insert = db.prepare(`INSERT INTO searches (source_url, category, max_price, min_savings, source_price)
      VALUES (?, ?, ?, ?, ?)`);
    const result = insert.run(input.url, input.category, input.maxPrice ?? null, input.minSavings, input.sourcePrice ?? null);
    const raw = await findDupes(input);
    const matches = raw
      .filter(p => p && typeof p.title === "string" && typeof p.price === "number" && p.price >= 0)
      .filter(p => input.maxPrice == null || p.price <= input.maxPrice)
      .filter(p => input.sourcePrice == null || ((input.sourcePrice - p.price) / input.sourcePrice * 100) >= input.minSavings)
      .slice(0, 12);

    const save = db.prepare(`INSERT INTO products (search_id, title, retailer, url, image_url, price, similarity, description)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)`);
    const saved = matches.map(p => {
      const info = { retailer: p.retailer || "Retailer", url: p.url || "https://example.com", image_url: p.image_url || null };
      const r = save.run(result.lastInsertRowid, p.title, info.retailer, info.url, info.image_url, p.price,
        Math.max(0, Math.min(100, Number(p.similarity) || 0)), p.description || "");
      return { id: Number(r.lastInsertRowid), ...p, ...info };
    });
    res.json({
      searchId: Number(result.lastInsertRowid),
      mode: process.env.OPENAI_API_KEY ? "ai-assisted" : "demo",
      disclaimer: "Prices and availability are examples unless confirmed by a connected retailer feed.",
      results: saved
    });
  } catch (error) {
    console.error("Search failed:", error.message);
    res.status(500).json({ error: "We couldn't complete that search. Please try again." });
  }
});

app.get("/api/search/:id", (req, res) => {
  const search = db.prepare("SELECT * FROM searches WHERE id = ?").get(Number(req.params.id));
  if (!search) return res.status(404).json({ error: "Search not found." });
  const results = db.prepare("SELECT * FROM products WHERE search_id = ? ORDER BY price ASC").all(search.id);
  res.json({ search, results });
});

const port = Number(process.env.PORT || 3000);
app.listen(port, () => console.log(`MyDupeGolden running on http://localhost:${port}`));
