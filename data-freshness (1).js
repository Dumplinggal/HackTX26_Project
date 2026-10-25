/**
 * Card Finder Pro - Data Freshness & Live Updates
 *
 * Credit card rates, fees and bonuses change often, and there is no official
 * public API for them. So this module works like this:
 *
 *   1. The bundled data (cards-data.js / bank-data.js) is the offline fallback.
 *   2. On load, the app fetches a small JSON "patch" file (DATA_META.remoteUrl)
 *      that you maintain. Anything in it overrides the bundled values.
 *      Point remoteUrl at any URL you host (GitHub raw, your own API, S3 ...).
 *   3. The last good patch is cached in localStorage, so it works offline too.
 *   4. A status bar always tells the user how old the data is and where it came from.
 *
 * Patch format (see data-updates.json):
 *   {
 *     "updatedAt": "2026-10-24",            // when YOU last verified the data
 *     "cards": { "<card id>": { "annualFee": 95, "rewards": {"dining": 3}, "verifiedAt": "2026-10-24", "sourceUrl": "https://..." } },
 *     "banks": { "Chase": { "underwritingRules": [ { "title": "...", "desc": "..." } ] } }
 *   }
 */

const DATA_META = {
  // TODO(team): set this to the date you last checked the bundled data against issuer sites.
  bundledSnapshotDate: "2026-10-24",
  remoteUrl: "data-updates.json",   // swap for a hosted URL / API endpoint
  fetchTimeoutMs: 6000,
  cacheTtlMs: 6 * 60 * 60 * 1000,   // re-fetch at most every 6 hours
  freshDays: 30,                    // <= 30 days: green
  agingDays: 90                     // <= 90 days: amber, beyond: red
};

const DataFreshness = (() => {
  const CACHE_KEY = "card_finder_data_cache_v1";

  // Only these fields may be overridden by a remote patch.
  const CARD_FIELDS = ["annualFee", "annualCredits", "foreignFee", "bonusValue", "bonusText",
    "specialNotes", "perks", "hasLounge", "hasCredits", "hasIntroApr", "introAprText",
    "verifiedAt", "sourceUrl"];
  const BANK_FIELDS = ["underwritingRules", "bureauPulled", "hasPreApproval", "preApprovalNote",
    "customerServicePhone", "reconsiderationPhone"];
  const REWARD_KEYS = ["dining", "groceries", "gas", "travel", "other"];

  const status = {
    source: "bundled",          // "bundled" | "cache" | "live"
    effectiveDate: DATA_META.bundledSnapshotDate,
    fetchedAt: null,
    cardsPatched: 0,
    banksPatched: 0,
    error: null,
    loading: false
  };

  // ---------- helpers ----------
  const esc = (s) => String(s).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  // Remote strings end up in innerHTML templates elsewhere, so strip markup characters.
  const cleanStr = (s) => String(s).replace(/[<>]/g, "").slice(0, 600);
  const isMoney = (n) => typeof n === "number" && isFinite(n) && n >= 0 && n < 100000;
  const isDate = (s) => typeof s === "string" && /^\d{4}-\d{2}-\d{2}$/.test(s) && !isNaN(Date.parse(s));

  function sanitizeValue(key, val) {
    if (["annualFee", "annualCredits", "bonusValue"].includes(key)) return isMoney(val) ? val : undefined;
    if (["foreignFee", "hasLounge", "hasCredits", "hasIntroApr", "hasPreApproval"].includes(key)) return typeof val === "boolean" ? val : undefined;
    if (key === "verifiedAt") return isDate(val) ? val : undefined;
    if (key === "sourceUrl") return (typeof val === "string" && /^https:\/\//.test(val)) ? encodeURI(val).slice(0, 300) : undefined;
    if (key === "perks") return Array.isArray(val) ? val.filter(x => typeof x === "string").map(cleanStr).slice(0, 20) : undefined;
    if (key === "underwritingRules") {
      return Array.isArray(val)
        ? val.filter(r => r && typeof r.title === "string" && typeof r.desc === "string")
            .map(r => ({ title: cleanStr(r.title), desc: cleanStr(r.desc) })).slice(0, 20)
        : undefined;
    }
    return typeof val === "string" ? cleanStr(val) : undefined;
  }

  // ---------- apply a patch onto the in-memory databases ----------
  function applyPatch(patch) {
    let cardsPatched = 0, banksPatched = 0;
    if (!patch || typeof patch !== "object") return { cardsPatched, banksPatched };

    if (patch.cards && typeof CARDS_DATABASE !== "undefined") {
      Object.entries(patch.cards).forEach(([id, upd]) => {
        const card = CARDS_DATABASE.find(c => c.id === id);
        if (!card || !upd || typeof upd !== "object") return;
        let touched = false;
        CARD_FIELDS.forEach(k => {
          if (k in upd) {
            const v = sanitizeValue(k, upd[k]);
            if (v !== undefined) { card[k] = v; touched = true; }
          }
        });
        if (upd.rewards && typeof upd.rewards === "object") {
          REWARD_KEYS.forEach(k => {
            const v = upd.rewards[k];
            if (typeof v === "number" && isFinite(v) && v >= 0 && v <= 20) { card.rewards[k] = v; touched = true; }
          });
        }
        if (touched) cardsPatched++;
      });
    }

    if (patch.banks && typeof BANK_PROFILES !== "undefined") {
      Object.entries(patch.banks).forEach(([name, upd]) => {
        const bank = BANK_PROFILES[name];
        if (!bank || !upd || typeof upd !== "object") return;
        let touched = false;
        BANK_FIELDS.forEach(k => {
          if (k in upd) {
            const v = sanitizeValue(k, upd[k]);
            if (v !== undefined) { bank[k] = v; touched = true; }
          }
        });
        if (touched) banksPatched++;
      });
    }
    return { cardsPatched, banksPatched };
  }

  // ---------- cache ----------
  function readCache() {
    try {
      const raw = localStorage.getItem(CACHE_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch (e) { return null; }
  }
  function writeCache(patch, fetchedAt) {
    try { localStorage.setItem(CACHE_KEY, JSON.stringify({ patch, fetchedAt })); } catch (e) { /* storage may be unavailable */ }
  }

  // ---------- fetching ----------
  async function fetchPatch() {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), DATA_META.fetchTimeoutMs);
    try {
      const res = await fetch(DATA_META.remoteUrl, { cache: "no-cache", signal: ctrl.signal });
      if (!res.ok) throw new Error("HTTP " + res.status);
      const patch = await res.json();
      if (!patch || typeof patch !== "object") throw new Error("Invalid data format");
      return patch;
    } finally {
      clearTimeout(timer);
    }
  }

  function rerenderApp() {
    if (typeof renderApp === "function") { try { renderApp(); } catch (e) { console.warn(e); } }
    renderStatus();
  }

  async function refresh(force = false) {
    const cached = readCache();
    if (!force && cached && cached.fetchedAt && (Date.now() - cached.fetchedAt) < DATA_META.cacheTtlMs) return;
    status.loading = true; renderStatus();
    try {
      const patch = await fetchPatch();
      const counts = applyPatch(patch);
      const fetchedAt = Date.now();
      writeCache(patch, fetchedAt);
      status.source = "live";
      status.fetchedAt = fetchedAt;
      status.cardsPatched = counts.cardsPatched;
      status.banksPatched = counts.banksPatched;
      status.effectiveDate = isDate(patch.updatedAt) ? patch.updatedAt : DATA_META.bundledSnapshotDate;
      status.error = null;
    } catch (e) {
      status.error = (e && e.name === "AbortError") ? "Timed out" : (e && e.message) || "Network error";
      // Keep whatever we already have (cache or bundled data).
    } finally {
      status.loading = false;
      rerenderApp();
    }
  }

  // Apply cached patch synchronously (script runs before app.js renders the first time).
  function init() {
    const cached = readCache();
    if (cached && cached.patch) {
      const counts = applyPatch(cached.patch);
      status.source = "cache";
      status.fetchedAt = cached.fetchedAt || null;
      status.cardsPatched = counts.cardsPatched;
      status.banksPatched = counts.banksPatched;
      if (isDate(cached.patch.updatedAt)) status.effectiveDate = cached.patch.updatedAt;
    }
    document.addEventListener("DOMContentLoaded", () => {
      bindUi();
      renderStatus();
      refresh(false);
    });
    document.addEventListener("visibilitychange", () => {
      if (document.visibilityState === "visible") refresh(false);
    });
  }

  // ---------- presentation ----------
  function daysSince(dateStr) {
    return Math.max(0, Math.floor((Date.now() - Date.parse(dateStr + "T00:00:00")) / 86400000));
  }
  function level() {
    const d = daysSince(status.effectiveDate);
    if (d <= DATA_META.freshDays) return "fresh";
    if (d <= DATA_META.agingDays) return "aging";
    return "stale";
  }
  function ageText(d) {
    if (d === 0) return "today";
    if (d === 1) return "1 day ago";
    if (d < 60) return d + " days ago";
    return Math.round(d / 30) + " months ago";
  }
  function fmtDate(dateStr) {
    return new Date(dateStr + "T00:00:00").toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
  }
  function sourceLabel() {
    if (status.source === "live") return "Live update";
    if (status.source === "cache") return "Saved update";
    return "Built-in data";
  }

  function renderStatus() {
    const lvl = level();
    const d = daysSince(status.effectiveDate);
    const bar = document.getElementById("dataStatusBar");
    if (bar) {
      const warn = lvl === "stale"
        ? `<span class="ds-warn">This data is over ${DATA_META.agingDays} days old. Confirm rates with the issuer before you apply.</span>`
        : "";
      bar.className = "data-status-bar ds-" + lvl;
      bar.innerHTML = `
        <span class="ds-dot"></span>
        <span class="ds-main"><strong>Data verified ${esc(ageText(d))}</strong> (${esc(fmtDate(status.effectiveDate))})
          &middot; ${esc(sourceLabel())}${status.loading ? " &middot; checking for updates..." : ""}</span>
        ${warn}
        <button type="button" class="ds-btn" id="dataInfoBtn">Details</button>`;
      const btn = document.getElementById("dataInfoBtn");
      if (btn) btn.addEventListener("click", openInfo);
    }
    const label = document.getElementById("ratesUpdatedLabel");
    if (label) label.textContent = "Data as of " + fmtDate(status.effectiveDate);
    const modal = document.getElementById("dataInfoModal");
    if (modal && modal.classList.contains("open")) renderInfo();
  }

  function renderInfo() {
    const el = document.getElementById("dataInfoContent");
    if (!el) return;
    const lvl = level();
    const d = daysSince(status.effectiveDate);
    const verified = (typeof CARDS_DATABASE !== "undefined" ? CARDS_DATABASE : []).filter(c => c.verifiedAt)
      .sort((a, b) => b.verifiedAt.localeCompare(a.verifiedAt));
    const fetched = status.fetchedAt ? new Date(status.fetchedAt).toLocaleString() : "never";

    el.innerHTML = `
      <h2 class="di-title">Data freshness &amp; reliability</h2>
      <div class="di-summary ds-${lvl}">
        <div class="di-big">${esc(ageText(d))}</div>
        <div>Data last verified ${esc(fmtDate(status.effectiveDate))}.<br>
        <span class="di-sub">Source: ${esc(sourceLabel())}${status.source !== "bundled" ? ` &middot; last checked ${esc(fetched)}` : ""}</span></div>
      </div>
      ${status.error ? `<p class="di-note di-err">Could not reach the update feed (${esc(status.error)}). Showing ${status.source === "cache" ? "the last saved update" : "built-in data"} instead.</p>` : ""}
      <div class="di-grid">
        <div><span class="di-num">${status.cardsPatched}</span>cards updated by feed</div>
        <div><span class="di-num">${status.banksPatched}</span>banks updated by feed</div>
        <div><span class="di-num">${(typeof CARDS_DATABASE !== "undefined") ? CARDS_DATABASE.length : 0}</span>cards tracked</div>
      </div>
      <button type="button" class="btn-primary di-refresh" id="dataRefreshBtn">${status.loading ? "Checking..." : "Check for updates now"}</button>

      <h3 class="di-h">How we calculate</h3>
      <ul class="di-list">
        <li>Rewards use each card's published base and category rates, applied to the monthly spend you enter.</li>
        <li>Travel points are valued with the "Travel Point Value" slider (default 1.25&cent;). Real value depends on how you redeem.</li>
        <li>Annual fees can be offset by statement credits only when that toggle is on, and only if you will actually use those credits.</li>
        <li>Spending caps and rotating or limited-time categories are <strong>not</strong> modeled.</li>
        <li>Approval rules (such as Chase 5/24) are community-observed patterns, not guarantees from the banks.</li>
      </ul>

      ${verified.length ? `
      <h3 class="di-h">Recently verified cards</h3>
      <div class="di-table-wrap"><table class="di-table">
        <thead><tr><th>Card</th><th>Verified</th><th>Source</th></tr></thead>
        <tbody>${verified.slice(0, 12).map(c => `
          <tr><td>${esc(c.name)}</td><td>${esc(c.verifiedAt)}</td>
          <td>${c.sourceUrl ? `<a href="${esc(c.sourceUrl)}" target="_blank" rel="noopener noreferrer">Issuer page</a>` : "&mdash;"}</td></tr>`).join("")}
        </tbody></table></div>` : ""}

      <p class="di-note">This tool is for information only and is not financial advice. Offers, rates, fees and approval rules change without notice. Always confirm the current terms on the issuer's website before applying. Not affiliated with any card issuer.</p>`;

    const rb = document.getElementById("dataRefreshBtn");
    if (rb) rb.addEventListener("click", () => refresh(true));
  }

  function openInfo() {
    const modal = document.getElementById("dataInfoModal");
    if (!modal) return;
    renderInfo();
    modal.classList.add("open");
  }
  function closeInfo() {
    const modal = document.getElementById("dataInfoModal");
    if (modal) modal.classList.remove("open");
  }

  function bindUi() {
    const modal = document.getElementById("dataInfoModal");
    if (!modal) return;
    modal.addEventListener("click", (e) => { if (e.target === modal) closeInfo(); });
    const close = modal.querySelector(".modal-close-btn");
    if (close) close.addEventListener("click", closeInfo);
    window.addEventListener("keydown", (e) => { if (e.key === "Escape") closeInfo(); });
  }

  init();
  return { refresh, status, applyPatch };
})();
