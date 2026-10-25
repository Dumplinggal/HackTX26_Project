/**
 * Card Finder Pro - AI Spending Import (Google Gemini API)
 *
 * The user uploads a bank/credit-card statement (CSV, PDF, screenshot) or pastes
 * transactions. Gemini categorizes each transaction; THE MATH IS DONE IN JS, never by
 * the model, so totals are exact. The monthly averages then fill the spending sliders.
 *
 * Privacy:
 *  - The Gemini key is entered by the user and never leaves their browser except in the
 *    request header to Google. For a public deployment, move the call behind your own
 *    server so the key is not in the browser.
 *  - For CSV/text, only date, description and amount are sent. Long digit strings
 *    (account / card numbers) are masked before sending.
 */

const AI_CONFIG = {
  // Tried in order; the next one is used if a model returns 404 (retired / not enabled).
  // Check https://ai.google.dev/gemini-api/docs/models for current names.
  models: ["gemini-3.5-flash", "gemini-3-flash-preview", "gemini-3.1-flash-lite-preview"],
  retries: 3,                // attempts per model when Gemini is busy (503/500/429)
  retryBaseMs: 1500,         // wait grows: 1.5s, 3s, ...
  endpoint: "https://generativelanguage.googleapis.com/v1beta/models/",
  chunkSize: 200,            // transactions per request
  maxRows: 800,
  maxFileBytes: 8 * 1024 * 1024,
  maxTextChars: 60000,
  timeoutMs: 60000,
  keyStorage: "card_finder_gemini_key",
  modelStorage: "card_finder_gemini_model"
};

const AI_CATEGORIES = ["dining", "groceries", "gas", "travel", "other"];

const AI_SAMPLE_CSV = `Date,Description,Amount
2026-08-02,CHIPOTLE 1043 AUSTIN TX,-14.85
2026-08-03,WHOLE FOODS MARKET #10234,-96.40
2026-08-04,SHELL OIL 5744120 AUSTIN TX,-48.12
2026-08-06,PAYMENT THANK YOU,500.00
2026-08-07,UBER EATS HELP.UBER.COM,-31.20
2026-08-09,H-E-B #402,-82.77
2026-08-11,DELTA AIR LINES ATLANTA,-318.40
2026-08-12,NETFLIX.COM,-15.49
2026-08-14,STARBUCKS STORE 22871,-7.35
2026-08-16,EXXONMOBIL 4410,-41.90
2026-08-19,AMAZON.COM*2K4TT,-63.18
2026-08-22,HILTON HOTELS DALLAS,-212.00
2026-08-25,TRADER JOE'S #115,-58.64
2026-08-28,PIZZERIA VIA 313,-44.10
2026-09-01,SPOTIFY USA,-11.99
2026-09-03,KROGER #577,-104.32
2026-09-05,CHEVRON 0098221,-52.60
2026-09-08,TARGET 00012345,-77.45
2026-09-12,TORCHYS TACOS,-23.80
2026-09-15,ZELLE TRANSFER TO JOHN,-200.00
2026-09-18,UNITED AIRLINES,-264.00
2026-09-21,DOORDASH*THAI HOUSE,-38.55
2026-09-27,COSTCO WHSE #1190,-181.20`;

const AiSpending = (() => {
  const ui = { result: null, months: 1, monthsFromDates: false, busy: false };

  // ------------------------------------------------------------------ utils
  const esc = (s) => String(s).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const money = (n) => "$" + Math.round(n).toLocaleString();
  const $ = (id) => document.getElementById(id);

  function getKey() {
    try { return localStorage.getItem(AI_CONFIG.keyStorage) || sessionStorage.getItem(AI_CONFIG.keyStorage) || ""; }
    catch (e) { return ""; }
  }
  function saveKey(key, remember) {
    try {
      localStorage.removeItem(AI_CONFIG.keyStorage);
      sessionStorage.removeItem(AI_CONFIG.keyStorage);
      if (!key) return;
      (remember ? localStorage : sessionStorage).setItem(AI_CONFIG.keyStorage, key);
    } catch (e) { /* storage unavailable */ }
  }
  function modelList() {
    let custom = "";
    try { custom = (localStorage.getItem(AI_CONFIG.modelStorage) || "").trim(); } catch (e) { /* ignore */ }
    return custom ? [custom] : AI_CONFIG.models;
  }

  // Mask card/account numbers and trim long descriptions before anything is sent.
  function scrub(desc) {
    return String(desc).replace(/\d[\d\s-]{6,}\d/g, "XXXX").replace(/\s+/g, " ").trim().slice(0, 70);
  }

  // ------------------------------------------------------------------ CSV parsing
  function parseCsv(text) {
    const rows = [];
    let row = [], field = "", inQ = false;
    const first = text.split(/\r?\n/).find(l => l.trim()) || "";
    const count = (ch) => first.split(ch).length - 1;
    const delim = [",", ";", "\t"].reduce((best, ch) => count(ch) > count(best) ? ch : best, ",");
    for (let i = 0; i < text.length; i++) {
      const ch = text[i];
      if (inQ) {
        if (ch === '"') { if (text[i + 1] === '"') { field += '"'; i++; } else inQ = false; }
        else field += ch;
      } else if (ch === '"') inQ = true;
      else if (ch === delim) { row.push(field); field = ""; }
      else if (ch === "\n" || ch === "\r") {
        if (ch === "\r" && text[i + 1] === "\n") i++;
        row.push(field); field = "";
        if (row.some(c => c.trim() !== "")) rows.push(row);
        row = [];
      } else field += ch;
    }
    row.push(field);
    if (row.some(c => c.trim() !== "")) rows.push(row);
    return rows;
  }

  function toNumber(s) {
    if (s === undefined || s === null) return NaN;
    let t = String(s).trim();
    if (!t) return NaN;
    const neg = /^\(.*\)$/.test(t) || /^-/.test(t) || /-$/.test(t) || /CR$/i.test(t);
    t = t.replace(/[^0-9.,]/g, "");
    if (/,\d{2}$/.test(t) && !/\./.test(t)) t = t.replace(",", "."); // 12,50 style
    t = t.replace(/,/g, "");
    const n = parseFloat(t);
    return isNaN(n) ? NaN : (neg ? -n : n);
  }

  function parseDate(s) {
    if (!s) return null;
    s = String(s).trim();
    let m = s.match(/^(\d{4})[-/](\d{1,2})[-/](\d{1,2})/);
    if (m) return new Date(+m[1], +m[2] - 1, +m[3]);
    m = s.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{2,4})/);
    if (m) { const y = +m[3] < 100 ? 2000 + +m[3] : +m[3]; return new Date(y, +m[1] - 1, +m[2]); }
    const t = Date.parse(s);
    return isNaN(t) ? null : new Date(t);
  }

  // Guess columns from the data itself when the file has no header row.
  function detectByContent(rows) {
    const sample = rows.slice(0, 30);
    const width = Math.max(...sample.map(r => r.length));
    let iAmt = -1, iDate = -1, iDesc = -1, bestNum = 0.7, bestLen = 0;
    for (let c = 0; c < width; c++) {
      const vals = sample.map(r => (r[c] || "").trim()).filter(Boolean);
      if (!vals.length) continue;
      const num = vals.filter(v => /^[-(]?\$?\s?[\d,]+[.,]\d{2}\)?-?$/.test(v)).length / vals.length;
      const dt = vals.filter(v => /\d/.test(v) && /[-/]/.test(v) && parseDate(v)).length / vals.length;
      if (num > bestNum) { bestNum = num; iAmt = c; }
      else if (dt > 0.7 && iDate === -1) iDate = c;
    }
    sample.forEach(() => {});
    for (let c = 0; c < width; c++) {
      if (c === iAmt || c === iDate) continue;
      const vals = sample.map(r => (r[c] || "").trim()).filter(v => /[A-Za-z]/.test(v));
      const avg = vals.length ? vals.reduce((a, v) => a + v.length, 0) / vals.length : 0;
      if (vals.length >= sample.length / 2 && avg > bestLen) { bestLen = avg; iDesc = c; }
    }
    return (iAmt !== -1 && iDesc !== -1) ? { iAmt, iDate, iDesc, iDebit: -1 } : null;
  }

  // Returns [{i,date,desc,amount}] where amount > 0 is a purchase, or null if no usable table.
  function extractTransactions(text) {
    const rows = parseCsv(text);
    if (rows.length < 2) return null;
    let cols = null, start = 0;
    const hi = rows.findIndex(r => r.some(c => /desc|merchant|payee|memo|details|name/i.test(c)) && r.some(c => /amount|debit|charge|withdraw/i.test(c)));
    if (hi !== -1) {
      const head = rows[hi].map(c => c.trim());
      const find = (re) => head.findIndex(c => re.test(c));
      // Pick the description column by priority ("Description" beats "Memo" beats "Account Name"),
      // and never a column that is mostly digits or empty.
      const letters = (c) => { const v = rows.slice(hi + 1, hi + 31).map(r => (r[c] || "").trim()).filter(Boolean);
        return v.length && v.filter(x => /[A-Za-z]{3}/.test(x)).length / v.length > 0.6; };
      const descIdx = [/^description$/i, /desc/i, /merchant/i, /payee/i, /details/i, /memo/i, /name/i]
        .map(re => head.findIndex((c, ci) => re.test(c) && !/account/i.test(c) && letters(ci)))
        .find(i => i !== -1);
      cols = { iDesc: descIdx === undefined ? -1 : descIdx, iDate: find(/trans.*date|posting|^date|date/i),
               iDebit: find(/debit|withdraw/i), iAmt: find(/amount/i) };
      start = hi + 1;
      cols.names = { desc: head[cols.iDesc], amt: head[cols.iAmt !== -1 ? cols.iAmt : cols.iDebit] };
      if (cols.iDesc === -1 || (cols.iAmt === -1 && cols.iDebit === -1)) cols = null;
    }
    if (!cols) { cols = detectByContent(rows); start = 0; }
    if (!cols) return null;
    const { iDesc, iDate, iDebit, iAmt } = cols;

    const raw = [];
    rows.slice(start).forEach(r => {
      let amt;
      if (iDebit !== -1 && iAmt === -1) {
        const d = toNumber(r[iDebit]);
        if (isNaN(d) || d === 0) return;     // credit-only row (payment/refund)
        amt = Math.abs(d);
      } else {
        amt = toNumber(r[iAmt]);
        if (isNaN(amt) || amt === 0) return;
      }
      raw.push({ date: iDate !== -1 ? parseDate(r[iDate]) : null, desc: (r[iDesc] || "").trim(), amount: amt, signed: iDebit === -1 || iAmt !== -1 });
    });
    if (!raw.length) return null;

    // Decide which sign means "purchase": the more common sign (purchases outnumber payments).
    let keepSign = 1;
    if (raw[0].signed) {
      const neg = raw.filter(t => t.amount < 0).length;
      keepSign = neg > raw.length - neg ? -1 : 1;
    }
    const tx = raw.filter(t => !t.signed || Math.sign(t.amount) === keepSign)
      .map(t => ({ date: t.date, desc: t.desc, amount: Math.abs(t.amount) }));
    tx.forEach((t, i) => { t.i = i; });
    tx.meta = { rows: raw.length, kept: tx.length, sign: raw[0].signed ? (keepSign === -1 ? "negative amounts = purchases" : "positive amounts = purchases") : "debit column",
                descCol: cols.names ? cols.names.desc : "(guessed from data)", amtCol: cols.names ? cols.names.amt : "(guessed from data)" };
    return tx.length ? tx : null;
  }

  // ------------------------------------------------------------------ Gemini
  const sleep = (ms) => new Promise(r => setTimeout(r, ms));

  async function callGemini(parts) {
    const key = getKey();
    if (!key) throw new Error("Please enter your Gemini API key first.");
    let lastErr = null, sawBusy = false;
    for (const model of modelList()) {
      for (let attempt = 1; attempt <= AI_CONFIG.retries; attempt++) {
        const ctrl = new AbortController();
        const timer = setTimeout(() => ctrl.abort(), AI_CONFIG.timeoutMs);
        let busyMsg = null;
        try {
          const res = await fetch(`${AI_CONFIG.endpoint}${encodeURIComponent(model)}:generateContent`, {
            method: "POST",
            headers: { "Content-Type": "application/json", "x-goog-api-key": key },
            body: JSON.stringify({
              contents: [{ role: "user", parts }],
              generationConfig: { temperature: 0, responseMimeType: "application/json" }
            }),
            signal: ctrl.signal
          });
          const body = await res.json().catch(() => ({}));
          if (!res.ok) {
            const msg = (body && body.error && body.error.message) || ("HTTP " + res.status);
            if (res.status === 404) { lastErr = new Error(`Model "${model}" is not available. ${msg}`); break; } // next model
            if (res.status === 400 && /API key/i.test(msg)) throw new Error("Gemini rejected the API key. Check that it is correct.");
            if (res.status === 401 || res.status === 403) throw new Error("Gemini denied access (" + res.status + "). Check your API key and that the Gemini API is enabled.");
            if ([429, 500, 502, 503, 504].includes(res.status)) { busyMsg = msg; sawBusy = true; }
            else throw new Error("Gemini error: " + msg);
          } else {
            const cand = body.candidates && body.candidates[0];
            const text = cand && cand.content && cand.content.parts && cand.content.parts.map(p => p.text || "").join("");
            if (!text) throw new Error((body.promptFeedback && body.promptFeedback.blockReason) ? "Gemini blocked this request." : "Gemini returned an empty answer.");
            ui.modelUsed = model;
            return parseJson(text);
          }
        } catch (e) {
          if (e.name === "AbortError") { busyMsg = "timeout"; sawBusy = true; }
          else if (/Failed to fetch|NetworkError/i.test(e.message)) throw new Error("Could not reach Gemini. Check your internet connection.");
          else throw e;
        } finally { clearTimeout(timer); }

        // Busy / transient: wait and retry, then move on to the next model.
        lastErr = new Error("busy");
        if (attempt < AI_CONFIG.retries) {
          setStatus(`Gemini is busy. Retrying (${attempt}/${AI_CONFIG.retries - 1})...`, "");
          await sleep(AI_CONFIG.retryBaseMs * attempt);
        } else {
          setStatus(`${model} is busy. Trying another model...`, "");
        }
      }
    }
    if (sawBusy) throw new Error("Gemini is overloaded right now (this is on Google's side, not your key). Please wait a minute and press Analyze again.");
    throw lastErr || new Error("No Gemini model is available.");
  }

  function parseJson(text) {
    const clean = String(text).replace(/^\s*```(?:json)?/i, "").replace(/```\s*$/, "").trim();
    try { return JSON.parse(clean); }
    catch (e) { throw new Error("Gemini returned an answer in an unexpected format. Please try again."); }
  }

  const RULES = `Categories (use exactly one of these lowercase words):
- "dining": restaurants, fast food, cafes, coffee shops, bars, food delivery (DoorDash, Uber Eats).
- "groceries": supermarkets and grocery stores, warehouse clubs for food (Whole Foods, Kroger, H-E-B, Trader Joe's, Costco).
- "gas": gas stations and EV charging.
- "travel": airlines, hotels, car rentals, rideshare, trains, cruises, travel agencies.
- "other": any other purchase (shopping, subscriptions, bills, entertainment, health...).
- "ignore": ONLY for lines that are clearly NOT a purchase: a credit card bill payment ("PAYMENT THANK YOU", "AUTOPAY"), a person-to-person transfer (Zelle, Venmo, Cash App, wire), a deposit or refund, interest, or an ATM cash withdrawal.
IMPORTANT: when you are unsure, choose "other", never "ignore". Normal merchants, stores, restaurants, subscriptions and online purchases are NEVER "ignore".`;

  async function categorizeRows(rows, onProgress) {
    const out = new Map();
    for (let s = 0; s < rows.length; s += AI_CONFIG.chunkSize) {
      const chunk = rows.slice(s, s + AI_CONFIG.chunkSize);
      onProgress(`Categorizing transactions ${s + 1}-${s + chunk.length} of ${rows.length}...`);
      const lines = chunk.map(t => `${t.i}|${scrub(t.desc)}|${t.amount.toFixed(2)}`).join("\n");
      const prompt = `You categorize credit card transactions for a rewards calculator.
${RULES}
Each line is: index|description|amount. Return ONLY JSON: {"categories":[{"i":<index>,"c":"<category>"}]} with one entry per line, same indexes.

${lines}`;
      const data = await callGemini([{ text: prompt }]);
      (Array.isArray(data.categories) ? data.categories : []).forEach(x => {
        const idx = Number(x && (x.i !== undefined ? x.i : x.index));
        const c = x && (x.c || x.category);
        if (Number.isInteger(idx) && typeof c === "string") out.set(idx, c.toLowerCase().trim());
      });
    }
    return out;
  }


  // Gemini may return amounts as numbers or strings like "$1,234.50" or "-12.00".
  function normalizeExtracted(list) {
    return (Array.isArray(list) ? list : []).slice(0, AI_CONFIG.maxRows).map((t, i) => ({
      i, date: parseDate(t && t.date), desc: String((t && (t.description || t.merchant)) || ""),
      amount: Math.abs(toNumber(t && t.amount)),
      category: String((t && t.category) || "other").toLowerCase().trim()
    })).filter(t => isFinite(t.amount) && t.amount > 0);
  }

  async function extractFromFile(file, onProgress) {
    onProgress("Reading your statement with Gemini...");
    const b64 = await new Promise((res, rej) => {
      const r = new FileReader();
      r.onload = () => res(String(r.result).split(",")[1]);
      r.onerror = () => rej(new Error("Could not read the file."));
      r.readAsDataURL(file);
    });
    const prompt = `Read this bank or credit card statement and list every PURCHASE transaction.
${RULES}
Skip lines that are "ignore" (payments, transfers, refunds, deposits, rent). Amounts must be positive numbers.
Return ONLY JSON: {"transactions":[{"date":"YYYY-MM-DD or empty string","description":"merchant","amount":12.34,"category":"dining|groceries|gas|travel|other"}]}
Do not include account numbers. If you cannot read any transactions return {"transactions":[]}.`;
    const data = await callGemini([{ inline_data: { mime_type: file.type || "application/pdf", data: b64 } }, { text: prompt }]);
    return normalizeExtracted(data && (data.transactions || data.purchases));
  }

  async function extractFromFreeText(text, onProgress) {
    onProgress("Reading your text with Gemini...");
    const prompt = `The text below contains credit card or bank transactions in an unknown format. List every PURCHASE.
${RULES}
Amounts must be positive. Return ONLY JSON: {"transactions":[{"date":"YYYY-MM-DD or empty string","description":"merchant","amount":12.34,"category":"dining|groceries|gas|travel|other"}]}

${scrub2(text).slice(0, AI_CONFIG.maxTextChars)}`;
    const data = await callGemini([{ text: prompt }]);
    return normalizeExtracted(data && (data.transactions || data.purchases));
  }
  const scrub2 = (t) => String(t).replace(/\d[\d\s-]{8,}\d/g, "XXXX");

  // ------------------------------------------------------------------ aggregation (exact math in JS)
  // Accept variations such as "Dining & Takeout", "restaurants", "Gas & EV Charging".
  function normalizeCat(c) {
    c = String(c || "").toLowerCase().trim();
    if (AI_CATEGORIES.includes(c) || c === "ignore") return c;
    if (/ignore|transfer|payment|refund|skip|exclude/.test(c)) return "ignore";
    if (/din|restaur|food|cafe|coffee|takeout|delivery|bar\b/.test(c)) return "dining";
    if (/groc|supermarket/.test(c)) return "groceries";
    if (/\bgas\b|fuel|\bev\b|charging|petrol/.test(c)) return "gas";
    if (/travel|flight|airline|hotel|lodging|rideshare|car rental/.test(c)) return "travel";
    return c;
  }

  function aggregate(tx, catByIndex, includeIgnored = false) {
    const totals = { dining: 0, groceries: 0, gas: 0, travel: 0, other: 0 };
    let ignored = 0, ignoredCount = 0, guessed = 0, used = 0;
    const skipped = [], items = [];
    let min = null, max = null;
    tx.forEach(t => {
      let c = normalizeCat(catByIndex ? catByIndex.get(t.i) : t.category);
      if (c === "ignore" && !includeIgnored) { ignored += t.amount; ignoredCount++; skipped.push({ desc: t.desc, amount: t.amount }); return; }
      if (c === "ignore") c = "other";
      if (!AI_CATEGORIES.includes(c)) { c = "other"; guessed++; }
      totals[c] += t.amount; used++; items.push({ desc: t.desc, amount: t.amount, cat: c });
      if (t.date) { if (!min || t.date < min) min = t.date; if (!max || t.date > max) max = t.date; }
    });
    let months = 1, fromDates = false;
    if (min && max) {
      const days = (max - min) / 86400000 + 1;
      months = Math.max(1, Math.round((days / 30.44) * 10) / 10);
      fromDates = days >= 20;
      if (!fromDates) months = 1;
    }
    return { totals, ignored, ignoredCount, guessed, used, months, fromDates, skipped, items };
  }

  // ------------------------------------------------------------------ UI
  function setStatus(msg, kind) {
    const el = $("aiStatus");
    if (!el) return;
    el.className = "ai-status" + (kind ? " ai-" + kind : "");
    el.textContent = msg || "";
  }

  function skippedPanel(r) {
    if (!r.skipped || !r.skipped.length) return "";
    const top = r.skipped.slice().sort((x, y) => y.amount - x.amount).slice(0, 8);
    return `
      <details class="ai-skipped" ${r.used ? "" : "open"}>
        <summary>${r.skipped.length} items were skipped (${money(r.ignored)}). See which ones</summary>
        <ul>${top.map(t => `<li>${esc(t.desc.slice(0, 50) || "(no description)")} &middot; ${money(t.amount)}</li>`).join("")}</ul>
        <p class="ai-hint">If these are real purchases, count them as spending:</p>
        <button type="button" class="ds-btn" id="aiIncludeBtn">Count skipped items as "Other"</button>
      </details>`;
  }

  function inspectPanel(r) {
    const m = ui.meta || {};
    const how = m.source === "gemini"
      ? "Read by Gemini directly from your file."
      : `Read ${m.rows} rows from your file, using "${esc(m.descCol)}" as the merchant and "${esc(m.amtCol)}" as the amount (${esc(m.sign)}). ${m.kept} rows were treated as purchases.`;
    const list = (r.items || []).slice(0, 15).map(t =>
      `<tr><td>${esc((t.desc || "").slice(0, 38))}</td><td>${money(t.amount)}</td><td>${esc(t.cat)}</td></tr>`).join("");
    return `
      <details class="ai-skipped">
        <summary>Check how we read your file</summary>
        <p class="ai-hint">${how}</p>
        <table class="ai-table"><thead><tr><th>Merchant</th><th>Amount</th><th>Category</th></tr></thead><tbody>${list}</tbody></table>
        ${(r.items || []).length > 15 ? `<p class="ai-hint">Showing the first 15 of ${r.items.length}.</p>` : ""}
      </details>`;
  }

  function renderResult() {
    const box = $("aiResult");
    if (!box) return;
    const r = ui.result;
    if (!r) { box.innerHTML = ""; return; }
    const m = Math.max(0.1, Number(ui.months) || 1);
    const cats = (typeof CATEGORIES !== "undefined") ? CATEGORIES : AI_CATEGORIES.map(k => ({ key: k, label: k, icon: "" }));
    const bindInclude = () => {
      const ib = $("aiIncludeBtn");
      if (ib) ib.addEventListener("click", () => {
        ui.result = aggregate(ui.tx, ui.map, true); ui.months = ui.result.months;
        setStatus("Counted the skipped items as spending. Review the numbers below.", "ok");
        renderResult();
      });
    };
    if (!r.used) { box.innerHTML = skippedPanel(r); bindInclude(); return; }
    const rows = cats.map(c => `
      <tr><td>${esc(c.icon || "")} ${esc(c.label)}</td><td>${money(r.totals[c.key])}</td><td><strong>${money(r.totals[c.key] / m)}</strong>/mo</td></tr>`).join("");
    const monthly = Object.values(r.totals).reduce((a, b) => a + b, 0) / m;
    box.innerHTML = `
      <div class="ai-result-head">Found <strong>${r.used}</strong> purchases${r.ignoredCount ? ` (skipped ${r.ignoredCount} payments, transfers or refunds totaling ${money(r.ignored)})` : ""}.</div>
      <table class="ai-table"><thead><tr><th>Category</th><th>Total</th><th>Monthly average</th></tr></thead><tbody>${rows}
        <tr class="ai-total"><td>Total</td><td>${money(Object.values(r.totals).reduce((a, b) => a + b, 0))}</td><td><strong>${money(monthly)}</strong>/mo</td></tr></tbody></table>
      ${skippedPanel(r)}
      ${inspectPanel(r)}
      <label class="ai-months">Months covered by this statement:
        <input type="number" id="aiMonths" min="0.1" max="24" step="0.1" value="${m}">
      </label>
      <p class="ai-hint">${r.fromDates ? "Calculated from the dates in your statement." : "No clear date range found, so please check the number of months."}${r.guessed ? ` ${r.guessed} transactions could not be classified and were counted as Other.` : ""}</p>
      <button type="button" class="btn-primary ai-apply" id="aiApplyBtn">Apply to my spending profile</button>`;
    const mi = $("aiMonths");
    if (mi) mi.addEventListener("input", () => { ui.months = Number(mi.value) || 1; renderResult(); const n = $("aiMonths"); if (n) { n.focus(); n.setSelectionRange(n.value.length, n.value.length); } });
    const ab = $("aiApplyBtn");
    if (ab) ab.addEventListener("click", applyToApp);
    bindInclude();
  }

  function applyToApp() {
    const r = ui.result;
    if (!r || typeof state === "undefined") return;
    const m = Math.max(0.1, Number(ui.months) || 1);
    AI_CATEGORIES.forEach(k => {
      const v = Math.min(5000, Math.max(0, Math.round(r.totals[k] / m)));
      state.spending[k] = v;
      const n = $(`spend-${k}`), s = $(`slider-${k}`);
      if (n) n.value = v;
      if (s) s.value = v;
    });
    document.querySelectorAll(".preset-pill").forEach(b => b.classList.remove("active"));
    if (typeof renderApp === "function") renderApp();
    closeModal();
    const sb = document.querySelector(".sidebar");
    if (sb) sb.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function run() {
    if (ui.busy) return;
    const keyEl = $("aiKey"), rememberEl = $("aiRemember");
    saveKey((keyEl.value || "").trim(), rememberEl.checked);
    const file = $("aiFile").files[0];
    const pasted = ($("aiText").value || "").trim();
    if (!file && !pasted) { setStatus("Upload a statement or paste some transactions first.", "err"); return; }

    ui.busy = true; ui.result = null; renderResult();
    $("aiRunBtn").disabled = true;
    try {
      let tx, cats = null, source = "local";
      const isText = (f) => /\.(csv|tsv|txt)$/i.test(f.name) || /^text\//.test(f.type);
      if (file) {
        if (file.size > AI_CONFIG.maxFileBytes) throw new Error("File is too large (max 8 MB).");
        if (isText(file)) {
          const text = await file.text();
          tx = extractTransactions(text);
          if (!tx) { tx = await extractFromFreeText(text, setStatus); source = "gemini"; }
          else cats = true;
        } else if (/^image\//.test(file.type) || file.type === "application/pdf" || /\.pdf$/i.test(file.name)) {
          tx = await extractFromFile(file, setStatus); source = "gemini";
        } else throw new Error("Unsupported file type. Use CSV, PDF, or an image.");
      } else {
        tx = extractTransactions(pasted);
        if (!tx) { tx = await extractFromFreeText(pasted, setStatus); source = "gemini"; }
        else cats = true;
      }
      if (!tx || !tx.length) throw new Error(source === "gemini" ? "Gemini could not find any purchases in that file. Try a clearer PDF or screenshot, or export a CSV from your bank." : "No purchases were found. The file needs a column for the merchant and a column for the amount.");
      if (tx.length > AI_CONFIG.maxRows) { tx = tx.slice(0, AI_CONFIG.maxRows); }
      let map = null;
      if (cats) map = await categorizeRows(tx, setStatus);
      ui.tx = tx; ui.map = map; ui.meta = tx.meta || { source: "gemini" };
      const agg = aggregate(tx, map);
      ui.result = agg; ui.months = agg.months;
      if (!agg.used) setStatus("The AI marked every transaction as a payment or transfer, so nothing was counted. Check the skipped list below.", "err");
      else setStatus(`Done with ${ui.modelUsed || "Gemini"}. Review the numbers below, then apply them.`, "ok");
      renderResult();
    } catch (e) {
      setStatus(e.message || "Something went wrong.", "err");
    } finally {
      ui.busy = false; $("aiRunBtn").disabled = false;
    }
  }

  function openModal() {
    const m = $("aiSpendModal");
    if (!m) return;
    $("aiKey").value = getKey();
    try { $("aiRemember").checked = !!localStorage.getItem(AI_CONFIG.keyStorage); } catch (e) { /* ignore */ }
    m.classList.add("open");
  }
  function closeModal() { const m = $("aiSpendModal"); if (m) m.classList.remove("open"); }

  function init() {
    const btn = $("aiImportBtn");
    const modal = $("aiSpendModal");
    if (!btn || !modal) return;
    btn.addEventListener("click", openModal);
    modal.addEventListener("click", (e) => { if (e.target === modal) closeModal(); });
    modal.querySelector(".modal-close-btn").addEventListener("click", closeModal);
    window.addEventListener("keydown", (e) => { if (e.key === "Escape") closeModal(); });
    $("aiRunBtn").addEventListener("click", run);
    $("aiSampleBtn").addEventListener("click", () => { $("aiText").value = AI_SAMPLE_CSV; $("aiFile").value = ""; setStatus("Sample statement loaded. Add your key and press Analyze.", ""); });
    $("aiFile").addEventListener("change", () => { const f = $("aiFile").files[0]; $("aiFileName").textContent = f ? f.name : ""; if (f) $("aiText").value = ""; });
    $("aiClearKey").addEventListener("click", () => { saveKey("", false); $("aiKey").value = ""; $("aiRemember").checked = false; setStatus("Saved key removed from this browser.", ""); });
  }

  document.addEventListener("DOMContentLoaded", init);
  return { extractTransactions, aggregate, parseCsv };
})();
