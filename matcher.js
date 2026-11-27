import OpenAI from "openai";

const demoCatalog = [
  { title: "Sculptural boucle accent chair", retailer: "Haven & Row", url: "https://example.com/products/boucle-chair", price: 289, similarity: 94, description: "Rounded silhouette, textured upholstery and a compact lounge profile." },
  { title: "Minimal oak dining table", retailer: "Northline Living", url: "https://example.com/products/oak-table", price: 449, similarity: 91, description: "Clean-lined oak finish and softly rounded edges." },
  { title: "Everyday leather-look shoulder bag", retailer: "Forma Studio", url: "https://example.com/products/shoulder-bag", price: 78, similarity: 89, description: "Structured shape, polished hardware and an adjustable strap." },
  { title: "Tailored relaxed blazer", retailer: "Common Thread", url: "https://example.com/products/relaxed-blazer", price: 96, similarity: 88, description: "An easy tailored fit with a single-button front." },
  { title: "Low-profile leather sneaker", retailer: "Field Day", url: "https://example.com/products/leather-sneaker", price: 84, similarity: 90, description: "Simple low-top shape with a clean tonal finish." },
  { title: "Brushed metal table lamp", retailer: "Soft Form", url: "https://example.com/products/metal-lamp", price: 64, similarity: 87, description: "A compact sculptural lamp with a warm ambient glow." }
];

export async function findDupes(input) {
  // Production integrations should fetch catalog data from licensed retailer/affiliate APIs.
  // The demo catalog keeps the app useful before provider credentials are configured.
  const key = process.env.OPENAI_API_KEY;
  if (!key) return demoCatalog;

  const client = new OpenAI({ apiKey: key });
  const response = await client.chat.completions.create({
    model: process.env.OPENAI_MODEL || "gpt-4o-mini",
    temperature: 0.2,
    response_format: { type: "json_object" },
    messages: [
      { role: "system", content: "You are a product similarity assistant. Return JSON with a results array of up to 6 plausible lower-cost product matches. Do not invent live stock, retailer URLs, or verified prices. If live catalog data is unavailable, return an empty results array. Each result: title, retailer, url, price, similarity (0-100), description." },
      { role: "user", content: JSON.stringify(input) }
    ]
  });
  const parsed = JSON.parse(response.choices[0]?.message?.content || '{"results":[]}');
  return Array.isArray(parsed.results) ? parsed.results : [];
}
