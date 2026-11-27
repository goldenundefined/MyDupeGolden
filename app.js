const form = document.querySelector("#searchForm");
const results = document.querySelector("#results");
const button = document.querySelector("#submitBtn");
const urlInput = document.querySelector("#productUrl");

document.querySelector("#clearUrl").addEventListener("click", () => { urlInput.value = ""; urlInput.focus(); });
document.querySelectorAll("[data-category]").forEach(card => card.addEventListener("click", () => {
  document.querySelector("#category").value = card.dataset.category;
}));

form.addEventListener("submit", async (event) => {
  event.preventDefault();
  results.innerHTML = '<div class="loading">✦ Looking for your golden finds…</div>';
  button.disabled = true;
  button.querySelector("span").textContent = "Finding matches…";
  const max = document.querySelector("#maxPrice").value;
  try {
    const response = await fetch("/api/search", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        url: urlInput.value.trim(),
        category: document.querySelector("#category").value,
        maxPrice: max === "" ? null : Number(max),
        sourcePrice: document.querySelector("#sourcePrice").value === "" ? null : Number(document.querySelector("#sourcePrice").value),
        minSavings: Number(document.querySelector("#minSavings").value)
      })
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || "Search failed.");
    renderResults(data);
  } catch (error) {
    results.innerHTML = `<div class="error">${escapeHtml(error.message)}</div>`;
  } finally {
    button.disabled = false;
    button.querySelector("span").textContent = "Find my dupe";
  }
});

function renderResults(data) {
  const cards = data.results.map((item, index) => `
    <article class="result-card">
      <div class="result-art">${["✧","⌂","◇","✦","▱","❋"][index % 6]}</div>
      <h4>${escapeHtml(item.title)}</h4>
      <p>${escapeHtml(item.description || "A possible lower-cost alternative to explore.")}</p>
      <div class="result-meta"><span class="result-price">$${Number(item.price).toFixed(2)}</span><span class="match">${Number(item.similarity) || 0}% style match</span></div>
      <a href="${safeUrl(item.url)}" target="_blank" rel="noopener noreferrer">Explore retailer ↗</a>
    </article>`).join("");
  results.innerHTML = `
    <div class="results-head"><h3>Your golden finds</h3><p>${data.results.length} possible match${data.results.length === 1 ? "" : "es"}</p></div>
    ${cards ? `<div class="result-grid">${cards}</div>` : '<p>No matches met those filters. Try a higher maximum price or lower savings threshold.</p>'}
    <p class="result-note">${escapeHtml(data.disclaimer)} ${data.mode === "demo" ? "Demo results are shown until a verified product catalog is connected." : ""}</p>`;
}
function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, c => ({ "&":"&amp;", "<":"&lt;", ">":"&gt;", '"':"&quot;", "'":"&#39;" }[c]));
}
function safeUrl(value) {
  try { const u = new URL(value); return ["http:","https:"].includes(u.protocol) ? escapeHtml(u.href) : "#"; }
  catch { return "#"; }
}
