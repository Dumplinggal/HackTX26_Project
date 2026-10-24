/**
 * Card Finder Pro - Main Application Logic
 * Comprehensive Features:
 * - 3D Flip Cards & Holographic Sheen
 * - My Wallet & Checkout Swipe Guide
 * - Bank Intelligence Dossiers & Approval Rules
 * - SVG Donut Charts & Return on Spend (ROI)
 * - CSV Spreadsheet Export & Print View
 */

// Application State
const state = {
  activeView: "finder", // "finder" | "wallet" | "banks"
  tier: 2, // Good by default
  maxFee: 700,
  type: "all", // "all" | "cashback" | "travel"
  issuer: "all", // "all" | "Chase" | "American Express" | etc.
  network: "all", // "all" | "Visa" | "Mastercard" | "Amex" | "Discover"
  noFtf: false,
  hasLounge: false,
  hasIntroApr: false,
  useCredits: true, // Offset fee with statement credits
  valueMode: "ongoing", // "ongoing" | "firstYear"
  pointMultiplier: 1.25, // 1.0 to 1.8 for travel points
  searchQuery: "",
  sortBy: "net", // "net" | "firstYear" | "feeAsc" | "name"
  onlyFavorites: false,
  favorites: new Set(JSON.parse(localStorage.getItem("card_finder_favs") || "[]")),
  myWallet: new Set(JSON.parse(localStorage.getItem("card_finder_my_wallet") || '["citi-double-cash", "capital-one-savor"]')),
  comparedCards: new Set(),
  spending: {
    dining: 350,
    groceries: 550,
    gas: 160,
    travel: 120,
    other: 650
  }
};

const CATEGORIES = [
  { key: "dining", label: "Dining & Takeout", icon: "🍽️", color: "#f59e0b" },
  { key: "groceries", label: "Groceries & Supermarkets", icon: "🛒", color: "#10b981" },
  { key: "gas", label: "Gas & EV Charging", icon: "⛽", color: "#ef4444" },
  { key: "travel", label: "Travel (Flights/Hotels)", icon: "✈️", color: "#0ea5e9" },
  { key: "other", label: "All Other Spending", icon: "🛍️", color: "#8b5cf6" }
];

// Helper: Calculate net earnings for a single card
function calculateCardValue(card, spending, options = {}) {
  const useCredits = options.useCredits ?? state.useCredits;
  const pointMultiplier = card.type === "travel" ? (options.pointMultiplier ?? state.pointMultiplier) : 1.0;
  
  let breakdown = {};
  let totalEarned = 0;

  // Custom calculation for special cards
  if (card.id === "citi-custom-cash") {
    // 5% on top spend category up to $500/mo ($6,000/yr), 1% on excess & all others
    const spendCats = ["dining", "groceries", "gas", "travel"];
    let topCat = "groceries";
    let maxSpend = -1;
    spendCats.forEach(c => {
      if (spending[c] > maxSpend) {
        maxSpend = spending[c];
        topCat = c;
      }
    });

    CATEGORIES.forEach(({ key }) => {
      const monthly = spending[key];
      if (key === topCat) {
        const capped5Pct = Math.min(monthly, 500);
        const excess1Pct = Math.max(0, monthly - 500);
        const earned = (capped5Pct * 12 * 0.05) + (excess1Pct * 12 * 0.01);
        breakdown[key] = earned;
        totalEarned += earned;
      } else {
        const earned = monthly * 12 * 0.01;
        breakdown[key] = earned;
        totalEarned += earned;
      }
    });
  } else if (card.id === "blue-cash-preferred-amex") {
    // 6% on groceries up to $6,000/yr ($500/mo), 1% beyond
    const groceryMonthly = spending.groceries;
    const cappedGrocery = Math.min(groceryMonthly, 500);
    const excessGrocery = Math.max(0, groceryMonthly - 500);
    const groceryEarned = (cappedGrocery * 12 * 0.06) + (excessGrocery * 12 * 0.01);
    breakdown.groceries = groceryEarned;
    totalEarned += groceryEarned;

    CATEGORIES.forEach(({ key }) => {
      if (key !== "groceries") {
        const rate = card.rewards[key] || 1.0;
        const earned = spending[key] * 12 * (rate / 100);
        breakdown[key] = earned;
        totalEarned += earned;
      }
    });
  } else {
    // Standard calculation with point valuation adjustment
    CATEGORIES.forEach(({ key }) => {
      const rate = card.rewards[key] || 1.0;
      const effectiveRate = card.type === "travel" ? rate * pointMultiplier : rate;
      const earned = spending[key] * 12 * (effectiveRate / 100);
      breakdown[key] = earned;
      totalEarned += earned;
    });
  }

  // First year match for Discover cards
  let bonus = card.bonusValue;
  if (card.id.includes("discover")) {
    bonus = totalEarned; // Discover matches 100% of cash back year 1
  }

  const effectiveFee = useCredits 
    ? Math.max(0, card.annualFee - (card.annualCredits || 0))
    : card.annualFee;

  const ongoingNet = totalEarned - effectiveFee;
  const firstYearNet = totalEarned - card.annualFee + bonus + (useCredits ? (card.annualCredits || 0) : 0);

  const totalAnnualSpend = Object.values(spending).reduce((a, b) => a + b, 0) * 12;
  const roiPct = totalAnnualSpend > 0 ? ((totalEarned / totalAnnualSpend) * 100).toFixed(2) : "0.00";

  return {
    totalEarned,
    breakdown,
    effectiveFee,
    ongoingNet,
    firstYearNet,
    bonus,
    roiPct
  };
}

// Find Optimal 2-Card Combo based on current spending
function findOptimalCombo(cards, spending) {
  const eligible = cards.filter(c => c.tier <= state.tier && c.annualFee <= 400);
  if (eligible.length < 2) return null;

  let bestCombo = null;
  let maxNet = -Infinity;

  for (let i = 0; i < eligible.length; i++) {
    for (let j = i + 1; j < eligible.length; j++) {
      const cardA = eligible[i];
      const cardB = eligible[j];

      let combinedEarned = 0;
      let assignment = {};

      CATEGORIES.forEach(({ key }) => {
        const valA = calculateCardValue(cardA, { ...spending, [key]: spending[key] }, { useCredits: false }).breakdown[key];
        const valB = calculateCardValue(cardB, { ...spending, [key]: spending[key] }, { useCredits: false }).breakdown[key];

        if (valA >= valB) {
          combinedEarned += valA;
          assignment[key] = cardA.name;
        } else {
          combinedEarned += valB;
          assignment[key] = cardB.name;
        }
      });

      const feeA = state.useCredits ? Math.max(0, cardA.annualFee - (cardA.annualCredits || 0)) : cardA.annualFee;
      const feeB = state.useCredits ? Math.max(0, cardB.annualFee - (cardB.annualCredits || 0)) : cardB.annualFee;
      const net = combinedEarned - feeA - feeB;

      if (net > maxNet) {
        maxNet = net;
        bestCombo = {
          cardA,
          cardB,
          combinedEarned,
          net,
          assignment
        };
      }
    }
  }

  return bestCombo;
}

// Filter and Sort Cards with Deep Bank & Ecosystem Search
function getFilteredAndSortedCards() {
  return CARDS_DATABASE
    .filter(card => {
      // Credit Tier
      if (card.tier > state.tier) return false;
      // Max Fee
      if (card.annualFee > state.maxFee) return false;
      // Reward Type
      if (state.type !== "all" && card.type !== state.type) return false;
      // Bank / Issuer Filter
      if (state.issuer !== "all" && card.issuer !== state.issuer) return false;
      // Card Network
      if (state.network !== "all" && card.network !== state.network) return false;
      // Foreign Transaction Fee
      if (state.noFtf && card.foreignFee) return false;
      // Lounge Access
      if (state.hasLounge && !card.hasLounge) return false;
      // Intro APR
      if (state.hasIntroApr && !card.hasIntroApr) return false;
      // Favorites Only
      if (state.onlyFavorites && !state.favorites.has(card.id)) return false;

      // Deep Multi-Field Search (Card name, bank, ecosystem, transfer partners, underwriting rules, bureaus)
      if (state.searchQuery.trim() !== "") {
        const q = state.searchQuery.toLowerCase();
        const bank = (typeof BANK_PROFILES !== "undefined" && BANK_PROFILES[card.issuer]) ? BANK_PROFILES[card.issuer] : {};

        const matchesName = card.name.toLowerCase().includes(q);
        const matchesIssuer = card.issuer.toLowerCase().includes(q) || (bank.name && bank.name.toLowerCase().includes(q));
        const matchesPerks = card.perks.some(p => p.toLowerCase().includes(q));
        const matchesBestFor = card.bestFor.toLowerCase().includes(q);
        const matchesEcosystem = bank.rewardsEcosystem && bank.rewardsEcosystem.toLowerCase().includes(q);
        const matchesBureau = bank.bureauPulled && bank.bureauPulled.toLowerCase().includes(q);
        const matchesRules = bank.underwritingRules && bank.underwritingRules.some(r => r.title.toLowerCase().includes(q) || r.desc.toLowerCase().includes(q));
        const matchesPartners = bank.transferPartners && bank.transferPartners.some(p => p.name.toLowerCase().includes(q) || p.type.toLowerCase().includes(q));

        if (!matchesName && !matchesIssuer && !matchesPerks && !matchesBestFor && !matchesEcosystem && !matchesBureau && !matchesRules && !matchesPartners) {
          return false;
        }
      }
      return true;
    })
    .map(card => {
      const val = calculateCardValue(card, state.spending);
      return { card, ...val };
    })
    .sort((a, b) => {
      if (state.sortBy === "net") {
        return b.ongoingNet - a.ongoingNet;
      } else if (state.sortBy === "firstYear") {
        return b.firstYearNet - a.firstYearNet;
      } else if (state.sortBy === "feeAsc") {
        return a.card.annualFee - b.card.annualFee;
      } else if (state.sortBy === "name") {
        return a.card.name.localeCompare(b.card.name);
      }
      return 0;
    });
}

// App Initialization
document.addEventListener("DOMContentLoaded", () => {
  initTheme();
  initViewSwitcher();
  initPresetButtons();
  initSpendingInputs();
  initFilterControls();
  initCompareDrawer();
  initModals();
  initCsvExport();
  loadStateFromUrl();
  renderApp();
});

// View Switcher: Card Finder vs My Wallet vs Bank Intel
function initViewSwitcher() {
  const tabFinder = document.getElementById("tabFinder");
  const tabWallet = document.getElementById("tabWallet");
  const tabBanks = document.getElementById("tabBanks");
  const finderView = document.getElementById("finderView");
  const walletView = document.getElementById("walletView");
  const bankHubView = document.getElementById("bankHubView");

  if (!tabFinder || !tabWallet) return;

  const setView = (view) => {
    state.activeView = view;
    [tabFinder, tabWallet, tabBanks].forEach(t => {
      if (t) t.classList.toggle("active", t.dataset.view === view);
    });

    if (finderView) finderView.hidden = (view !== "finder");
    if (walletView) walletView.hidden = (view !== "wallet");
    if (bankHubView) bankHubView.hidden = (view !== "banks");

    if (view === "wallet") {
      renderWalletView();
    } else if (view === "banks") {
      renderBankHubView();
    }
  };

  tabFinder.addEventListener("click", () => setView("finder"));
  tabWallet.addEventListener("click", () => setView("wallet"));
  if (tabBanks) tabBanks.addEventListener("click", () => setView("banks"));
}

// Wallet Card Toggle
function toggleWalletCard(cardId) {
  if (state.myWallet.has(cardId)) {
    state.myWallet.delete(cardId);
  } else {
    state.myWallet.add(cardId);
  }
  localStorage.setItem("card_finder_my_wallet", JSON.stringify(Array.from(state.myWallet)));
  renderWalletBadge();
  if (state.activeView === "wallet") {
    renderWalletView();
  }
  renderCardResults();
}

function renderWalletBadge() {
  const badge = document.getElementById("walletBadge");
  if (badge) {
    badge.textContent = state.myWallet.size;
  }
}

// Initialize Theme
function initTheme() {
  const savedTheme = localStorage.getItem("card_finder_theme") || 
    (window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light");
  document.documentElement.setAttribute("data-theme", savedTheme);

  const themeToggle = document.getElementById("themeToggle");
  if (themeToggle) {
    themeToggle.addEventListener("click", () => {
      const current = document.documentElement.getAttribute("data-theme");
      const next = current === "dark" ? "light" : "dark";
      document.documentElement.setAttribute("data-theme", next);
      localStorage.setItem("card_finder_theme", next);
      updateThemeIcon(next);
    });
    updateThemeIcon(savedTheme);
  }
}

function updateThemeIcon(theme) {
  const themeToggle = document.getElementById("themeToggle");
  if (!themeToggle) return;
  themeToggle.innerHTML = theme === "dark" 
    ? `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>` 
    : `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>`;
}

// Preset Spending Handlers
function initPresetButtons() {
  const container = document.getElementById("presetButtons");
  if (!container) return;

  container.innerHTML = Object.entries(SPEND_PRESETS).map(([key, p]) => `
    <button class="preset-pill" data-preset="${key}" title="${p.desc}">
      ${p.label}
    </button>
  `).join("");

  container.querySelectorAll(".preset-pill").forEach(btn => {
    btn.addEventListener("click", () => {
      const presetKey = btn.dataset.preset;
      const preset = SPEND_PRESETS[presetKey];
      if (!preset) return;

      CATEGORIES.forEach(c => {
        state.spending[c.key] = preset[c.key];
        const numInput = document.getElementById(`spend-${c.key}`);
        const sliderInput = document.getElementById(`slider-${c.key}`);
        if (numInput) numInput.value = preset[c.key];
        if (sliderInput) sliderInput.value = preset[c.key];
      });

      container.querySelectorAll(".preset-pill").forEach(b => b.classList.remove("active"));
      btn.classList.add("active");

      renderApp();
    });
  });
}

// Spending inputs with dual slider & number sync
function initSpendingInputs() {
  const container = document.getElementById("spendingInputs");
  if (!container) return;

  container.innerHTML = CATEGORIES.map(c => `
    <div class="spend-field">
      <div class="spend-field-header">
        <label for="spend-${c.key}">
          <span class="spend-icon">${c.icon}</span> ${c.label}
        </label>
        <div class="spend-input-wrap">
          <span class="currency-sym">$</span>
          <input type="number" id="spend-${c.key}" data-cat="${c.key}" min="0" max="5000" step="25" value="${state.spending[c.key]}">
          <span class="per-mo">/mo</span>
        </div>
      </div>
      <input type="range" class="spend-slider" id="slider-${c.key}" data-cat="${c.key}" min="0" max="3000" step="25" value="${state.spending[c.key]}">
    </div>
  `).join("");

  CATEGORIES.forEach(c => {
    const numInput = document.getElementById(`spend-${c.key}`);
    const sliderInput = document.getElementById(`slider-${c.key}`);

    const updateVal = (val) => {
      const cleanVal = Math.max(0, Number(val) || 0);
      state.spending[c.key] = cleanVal;
      if (numInput) numInput.value = cleanVal;
      if (sliderInput) sliderInput.value = cleanVal;
      document.querySelectorAll(".preset-pill").forEach(b => b.classList.remove("active"));
      renderApp();
    };

    if (numInput) {
      numInput.addEventListener("input", (e) => updateVal(e.target.value));
    }
    if (sliderInput) {
      sliderInput.addEventListener("input", (e) => updateVal(e.target.value));
    }
  });
}

// Filter and Control Event Listeners
function initFilterControls() {
  const tierSelect = document.getElementById("tier");
  if (tierSelect) {
    tierSelect.value = state.tier;
    tierSelect.addEventListener("change", (e) => {
      state.tier = Number(e.target.value);
      renderApp();
    });
  }

  const maxFeeInput = document.getElementById("maxFee");
  const maxFeeVal = document.getElementById("maxFeeVal");
  if (maxFeeInput) {
    maxFeeInput.value = state.maxFee;
    if (maxFeeVal) maxFeeVal.textContent = `$${state.maxFee}`;
    maxFeeInput.addEventListener("input", (e) => {
      state.maxFee = Number(e.target.value);
      if (maxFeeVal) maxFeeVal.textContent = `$${state.maxFee}`;
      renderApp();
    });
  }

  // Issuer/Bank dropdown
  const issuerSelect = document.getElementById("issuerSelect");
  if (issuerSelect) {
    issuerSelect.value = state.issuer;
    issuerSelect.addEventListener("change", (e) => {
      state.issuer = e.target.value;
      renderApp();
    });
  }

  document.querySelectorAll("[data-type-tab]").forEach(tab => {
    tab.addEventListener("click", () => {
      document.querySelectorAll("[data-type-tab]").forEach(t => t.classList.remove("active"));
      tab.classList.add("active");
      state.type = tab.dataset.typeTab;
      renderApp();
    });
  });

  const networkSelect = document.getElementById("networkSelect");
  if (networkSelect) {
    networkSelect.addEventListener("change", (e) => {
      state.network = e.target.value;
      renderApp();
    });
  }

  const sortBySelect = document.getElementById("sortBy");
  if (sortBySelect) {
    sortBySelect.addEventListener("change", (e) => {
      state.sortBy = e.target.value;
      renderApp();
    });
  }

  document.querySelectorAll("[data-value-mode]").forEach(btn => {
    btn.addEventListener("click", () => {
      document.querySelectorAll("[data-value-mode]").forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
      state.valueMode = btn.dataset.valueMode;
      renderApp();
    });
  });

  const toggleMap = [
    { id: "noFtf", key: "noFtf" },
    { id: "hasLounge", key: "hasLounge" },
    { id: "hasIntroApr", key: "hasIntroApr" },
    { id: "useCredits", key: "useCredits" },
    { id: "onlyFavorites", key: "onlyFavorites" }
  ];

  toggleMap.forEach(({ id, key }) => {
    const el = document.getElementById(id);
    if (el) {
      el.checked = state[key];
      el.addEventListener("change", (e) => {
        state[key] = e.target.checked;
        renderApp();
      });
    }
  });

  const pointSlider = document.getElementById("pointMultiplier");
  const pointVal = document.getElementById("pointVal");
  if (pointSlider) {
    pointSlider.value = state.pointMultiplier;
    if (pointVal) pointVal.textContent = `${state.pointMultiplier.toFixed(2)}¢`;
    pointSlider.addEventListener("input", (e) => {
      state.pointMultiplier = parseFloat(e.target.value);
      if (pointVal) pointVal.textContent = `${state.pointMultiplier.toFixed(2)}¢`;
      renderApp();
    });
  }

  const searchInput = document.getElementById("searchCards");
  if (searchInput) {
    searchInput.addEventListener("input", (e) => {
      state.searchQuery = e.target.value;
      renderApp();
    });
  }

  const resetBtn = document.getElementById("resetFiltersBtn");
  if (resetBtn) {
    resetBtn.addEventListener("click", resetAllFilters);
  }

  const shareBtn = document.getElementById("shareBtn");
  if (shareBtn) {
    shareBtn.addEventListener("click", shareConfiguration);
  }
  const printBtn = document.getElementById("printBtn");
  if (printBtn) {
    printBtn.addEventListener("click", () => window.print());
  }
}

// Reset filters to defaults
function resetAllFilters() {
  state.tier = 3;
  state.maxFee = 700;
  state.type = "all";
  state.issuer = "all";
  state.network = "all";
  state.noFtf = false;
  state.hasLounge = false;
  state.hasIntroApr = false;
  state.useCredits = true;
  state.searchQuery = "";
  state.onlyFavorites = false;

  const tierSelect = document.getElementById("tier");
  if (tierSelect) tierSelect.value = 3;
  const maxFeeInput = document.getElementById("maxFee");
  if (maxFeeInput) maxFeeInput.value = 700;
  const maxFeeVal = document.getElementById("maxFeeVal");
  if (maxFeeVal) maxFeeVal.textContent = "$700";

  const issuerSelect = document.getElementById("issuerSelect");
  if (issuerSelect) issuerSelect.value = "all";

  document.querySelectorAll("[data-type-tab]").forEach(t => {
    t.classList.toggle("active", t.dataset.typeTab === "all");
  });

  const networkSelect = document.getElementById("networkSelect");
  if (networkSelect) networkSelect.value = "all";

  const searchInput = document.getElementById("searchCards");
  if (searchInput) searchInput.value = "";

  ["noFtf", "hasLounge", "hasIntroApr", "onlyFavorites"].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.checked = false;
  });
  const useCreditsEl = document.getElementById("useCredits");
  if (useCreditsEl) useCreditsEl.checked = true;

  renderApp();
}

// Compare Drawer Management
function initCompareDrawer() {
  const drawer = document.getElementById("compareDrawer");
  const openCompareModalBtn = document.getElementById("openCompareModalBtn");
  const clearCompareBtn = document.getElementById("clearCompareBtn");

  if (openCompareModalBtn) {
    openCompareModalBtn.addEventListener("click", openComparisonModal);
  }
  if (clearCompareBtn) {
    clearCompareBtn.addEventListener("click", () => {
      state.comparedCards.clear();
      renderCompareDrawer();
      renderApp();
    });
  }
}

function toggleCompare(cardId) {
  if (state.comparedCards.has(cardId)) {
    state.comparedCards.delete(cardId);
  } else {
    if (state.comparedCards.size >= 4) {
      alert("You can compare up to 4 cards simultaneously.");
      return;
    }
    state.comparedCards.add(cardId);
  }
  renderCompareDrawer();
  renderApp();
}

function renderCompareDrawer() {
  const drawer = document.getElementById("compareDrawer");
  const chipsContainer = document.getElementById("compareChips");
  const compareCount = document.getElementById("compareCount");
  if (!drawer || !chipsContainer) return;

  if (state.comparedCards.size === 0) {
    drawer.classList.remove("visible");
    return;
  }

  drawer.classList.add("visible");
  if (compareCount) compareCount.textContent = state.comparedCards.size;

  const cards = Array.from(state.comparedCards).map(id => CARDS_DATABASE.find(c => c.id === id)).filter(Boolean);

  chipsContainer.innerHTML = cards.map(c => `
    <div class="compare-chip">
      <span class="chip-color-dot" style="background:${c.accentColor || '#38bdf8'}"></span>
      <span class="chip-name">${c.name}</span>
      <button class="chip-remove" onclick="toggleCompare('${c.id}')" title="Remove">&times;</button>
    </div>
  `).join("");
}

// Favorites management
function toggleFavorite(cardId) {
  if (state.favorites.has(cardId)) {
    state.favorites.delete(cardId);
  } else {
    state.favorites.add(cardId);
  }
  localStorage.setItem("card_finder_favs", JSON.stringify(Array.from(state.favorites)));
  renderApp();
}

// 3D Card Hover Tilt & Holographic Reflection Effects
function setup3DEffects() {
  document.querySelectorAll(".card-art-3d-wrapper").forEach(wrapper => {
    const inner = wrapper.querySelector(".card-art-3d-inner");
    const sheen = wrapper.querySelector(".card-holographic-sheen");
    if (!inner) return;

    wrapper.addEventListener("mousemove", (e) => {
      if (inner.classList.contains("flipped")) return;
      const rect = wrapper.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const centerX = rect.width / 2;
      const centerY = rect.height / 2;
      
      const rotateX = ((y - centerY) / centerY) * -12;
      const rotateY = ((x - centerX) / centerX) * 12;

      inner.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg)`;
      
      if (sheen) {
        const xPct = Math.round((x / rect.width) * 100);
        const yPct = Math.round((y / rect.height) * 100);
        sheen.style.background = `radial-gradient(circle at ${xPct}% ${yPct}%, rgba(255, 255, 255, 0.45), transparent 60%)`;
      }
    });

    wrapper.addEventListener("mouseleave", () => {
      if (inner.classList.contains("flipped")) {
        inner.style.transform = "rotateY(180deg)";
      } else {
        inner.style.transform = "perspective(1000px) rotateX(0deg) rotateY(0deg)";
      }
    });
  });
}

function flipCard(event, cardId) {
  event.stopPropagation();
  const wrapper = document.querySelector(`.card-item[data-card-id="${cardId}"] .card-art-3d-inner`);
  if (wrapper) {
    wrapper.classList.toggle("flipped");
    if (wrapper.classList.contains("flipped")) {
      wrapper.style.transform = "rotateY(180deg)";
    } else {
      wrapper.style.transform = "perspective(1000px) rotateX(0deg) rotateY(0deg)";
    }
  }
}

// Open Bank Intelligence & Rules Modal
function openBankModal(issuerName) {
  const bank = (typeof BANK_PROFILES !== "undefined" && BANK_PROFILES[issuerName]) ? BANK_PROFILES[issuerName] : null;
  if (!bank) return;

  const modal = document.getElementById("bankModal");
  const content = document.getElementById("bankModalContent");
  if (!modal || !content) return;

  const bankCards = CARDS_DATABASE.filter(c => c.issuer === issuerName);

  content.innerHTML = `
    <div class="bank-modal-header" style="background: ${bank.logoColor || '#1e3a8a'}">
      <div class="bank-modal-brand">
        <div class="bank-brand-icon-box">🏛️</div>
        <div>
          <h2>${bank.name}</h2>
          <div class="bank-modal-sub">
            <span>📍 HQ: ${bank.headquarters}</span>
            <span>⭐ Satisfaction: ${bank.customerSatisfaction}</span>
            <span>📱 App: ${bank.mobileAppRating}</span>
          </div>
        </div>
      </div>
    </div>

    <div class="bank-dossier-body">
      <!-- Top Overview Banner -->
      <div style="background:var(--bg-surface-alt); border:1px solid var(--border-color); border-radius:var(--radius-md); padding:14px 18px;">
        <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:8px;">
          <div>
            <span style="font-size:0.75rem; text-transform:uppercase; font-weight:700; color:var(--primary); display:block;">Primary Rewards Ecosystem</span>
            <strong style="font-size:1.15rem; color:var(--text-main);">${bank.rewardsEcosystem}</strong>
          </div>
          <div>
            <span class="preapproval-status-tag ${bank.hasPreApproval ? '' : 'unavailable'}">
              ${bank.hasPreApproval ? '✓ Soft-Pull Pre-Approval Tool Available' : 'No Official Soft-Pull Tool'}
            </span>
          </div>
        </div>
        <p style="font-size:0.85rem; color:var(--text-muted); margin-top:6px; line-height:1.4;">
          ${bank.ecosystemDescription}
        </p>
      </div>

      <!-- Two-column dossier grid -->
      <div class="bank-dossier-grid">
        
        <!-- Left: Underwriting Rules & Bureau Pull -->
        <div class="bank-info-card">
          <div class="bank-card-title">
            <span>📋 Strict Application & Underwriting Rules</span>
          </div>
          
          <div class="bank-rules-list">
            ${bank.underwritingRules.map(r => `
              <div class="bank-rule-item">
                <div class="bank-rule-header">
                  <span>⚠️</span>
                  <span>${r.title}</span>
                </div>
                <p class="bank-rule-desc">${r.desc}</p>
              </div>
            `).join('')}
          </div>

          <div class="bureau-badge-box">
            <span class="bureau-icon">🔍</span>
            <div>
              <strong style="display:block; font-size:0.8rem; color:var(--text-main);">Credit Bureau Pulled:</strong>
              <span style="font-size:0.78rem; color:var(--text-muted);">${bank.bureauPulled}</span>
            </div>
          </div>
        </div>

        <!-- Right: Transfer Partners & Direct Hotlines -->
        <div class="bank-info-card">
          <div class="bank-card-title">
            <span>✈️ 1:1 Airline & Hotel Transfer Partners</span>
          </div>

          <div class="transfer-partners-list">
            ${bank.transferPartners.map(p => `
              <div class="partner-row">
                <div>
                  <div class="partner-name">
                    <span>${p.name}</span>
                    <span class="partner-tag ${p.type.toLowerCase().includes('airline') ? 'airline' : p.type.toLowerCase().includes('hotel') ? 'hotel' : 'cash'}">${p.type}</span>
                  </div>
                  <span class="partner-note">${p.valueNote}</span>
                </div>
                <span class="partner-ratio">${p.ratio}</span>
              </div>
            `).join('')}
          </div>

          <div style="margin-top:10px; border-top:1px solid var(--border-color); padding-top:10px;">
            <strong style="font-size:0.85rem; display:block; margin-bottom:6px;">📞 Direct Bank Contact Hotlines:</strong>
            <div class="contact-hotline-row">
              <span style="color:var(--text-muted);">Application Reconsideration:</span>
              <a href="tel:${bank.reconsiderationPhone.split(' ')[0]}" class="hotline-num">${bank.reconsiderationPhone}</a>
            </div>
            <div class="contact-hotline-row">
              <span style="color:var(--text-muted);">Customer Service:</span>
              <a href="tel:${bank.customerServicePhone.split(' ')[0]}" class="hotline-num">${bank.customerServicePhone}</a>
            </div>
            <div class="contact-hotline-row">
              <span style="color:var(--text-muted);">Instant Digital Card:</span>
              <span style="font-size:0.75rem; text-align:right; max-width:180px;">${bank.instantCardNumber}</span>
            </div>
          </div>

        </div>

      </div>

      <!-- Bank's Cards in Database -->
      <div style="background:var(--bg-surface); border:1px solid var(--border-color); border-radius:var(--radius-md); padding:16px;">
        <h4 style="font-size:0.95rem; font-weight:800; margin-bottom:8px;">💳 ${bank.shortName} Cards in Catalog (${bankCards.length})</h4>
        <div style="display:flex; flex-wrap:wrap; gap:8px;">
          ${bankCards.map(c => `
            <button onclick="document.getElementById('bankModal').classList.remove('open'); openCardModal('${c.id}');" class="btn-secondary" style="font-size:0.78rem; padding:5px 12px; display:inline-flex; align-items:center; gap:6px;">
              <span>${c.name}</span>
              <span style="color:var(--primary); font-weight:700;">$${c.annualFee}/yr</span>
            </button>
          `).join('')}
        </div>
      </div>

    </div>
  `;

  modal.classList.add("open");
}

// Render "Bank Intelligence Hub & Rulebook" View
function renderBankHubView() {
  const container = document.getElementById("bankHubView");
  if (!container || typeof BANK_PROFILES === "undefined") return;

  container.innerHTML = `
    <div style="background:linear-gradient(135deg, var(--bg-surface), var(--bg-surface-alt)); border:1px solid var(--border-color); border-radius:var(--radius-lg); padding:24px; box-shadow:var(--shadow-sm);">
      <h2 style="font-size:1.45rem; font-weight:800; margin-bottom:4px;">🏦 Bank Intelligence & Approval Rulebook</h2>
      <p style="font-size:0.85rem; color:var(--text-muted);">
        Every major card issuer enforces strict proprietary underwriting algorithms, credit bureau pull patterns, and application limits. Click any bank below to view its complete rules, transfer partners, and direct reconsideration numbers.
      </p>
    </div>

    <div class="bank-hub-grid">
      ${Object.entries(BANK_PROFILES).map(([key, bank]) => {
        const count = CARDS_DATABASE.filter(c => c.issuer === key).length;
        const topRule = bank.underwritingRules[0] || {};
        return `
          <div class="bank-hub-card" onclick="openBankModal('${key}')">
            <div class="bank-hub-header" style="background:${bank.logoColor || '#1e3a8a'}">
              <strong style="font-size:1.05rem;">${bank.shortName}</strong>
              <span style="font-size:0.72rem; background:rgba(255,255,255,0.25); padding:2px 8px; border-radius:999px;">
                ${count} Cards
              </span>
            </div>
            <div class="bank-hub-body">
              <div class="bank-quick-stat">
                <span>Ecosystem:</span>
                <strong style="color:var(--text-main);">${bank.rewardsEcosystem.split('®')[0]}</strong>
              </div>
              <div class="bank-quick-stat">
                <span>Key Rule:</span>
                <span style="color:var(--accent-rose); font-weight:700;">${topRule.title || 'Standard'}</span>
              </div>
              <div class="bank-quick-stat">
                <span>Bureau Pulled:</span>
                <span>${bank.bureauPulled.split(' ')[0]}</span>
              </div>
              <div class="bank-quick-stat">
                <span>Pre-Approval:</span>
                <span style="color:${bank.hasPreApproval ? 'var(--accent-green)' : 'var(--text-muted)'}; font-weight:600;">
                  ${bank.hasPreApproval ? '✓ Soft Pull' : 'Hard Pull'}
                </span>
              </div>
              <button class="btn-primary" style="margin-top:6px; font-size:0.8rem; padding:6px 12px; width:100%;">
                View Full Bank Dossier &rarr;
              </button>
            </div>
          </div>
        `;
      }).join('')}
    </div>
  `;
}

// Main Render Function
function renderApp() {
  renderSpendSummary();
  renderCardResults();
  renderComboRecommendation();
  renderCompareDrawer();
  renderWalletBadge();
  if (state.activeView === "wallet") {
    renderWalletView();
  } else if (state.activeView === "banks") {
    renderBankHubView();
  }
}

// Render monthly and annual spend summary
function renderSpendSummary() {
  const totalMonthly = Object.values(state.spending).reduce((a, b) => a + b, 0);
  const totalAnnual = totalMonthly * 12;

  const monthlyEl = document.getElementById("totalMonthlySpend");
  const annualEl = document.getElementById("totalAnnualSpend");
  if (monthlyEl) monthlyEl.textContent = `$${totalMonthly.toLocaleString()}`;
  if (annualEl) annualEl.textContent = `$${totalAnnual.toLocaleString()}`;
}

// Render Optimal 2-Card Combo Section
function renderComboRecommendation() {
  const comboContainer = document.getElementById("comboSection");
  if (!comboContainer) return;

  const combo = findOptimalCombo(CARDS_DATABASE, state.spending);
  if (!combo) {
    comboContainer.innerHTML = "";
    return;
  }

  const { cardA, cardB, net, combinedEarned, assignment } = combo;

  const filtered = getFilteredAndSortedCards();
  const topSingleNet = filtered.length > 0 ? filtered[0].ongoingNet : 0;
  const difference = Math.round(net - topSingleNet);

  comboContainer.innerHTML = `
    <div class="combo-card-banner">
      <div class="combo-header">
        <div class="combo-badge">🔥 Maximizer Strategy</div>
        <h3>The Optimal 2-Card Combo for Your Spend</h3>
        <p class="combo-sub">Using a specialized multiplier card alongside a flat catch-all card earns you significantly more than any single card alone.</p>
      </div>

      <div class="combo-body">
        <div class="combo-cards-visual">
          <div class="mini-card-preview" style="background:${cardA.cardColor}">
            <div class="mini-card-issuer">${cardA.issuer}</div>
            <div class="mini-card-name">${cardA.name}</div>
            <div class="mini-card-role">Primary Spend</div>
          </div>
          <div class="combo-plus">+</div>
          <div class="mini-card-preview" style="background:${cardB.cardColor}">
            <div class="mini-card-issuer">${cardB.issuer}</div>
            <div class="mini-card-name">${cardB.name}</div>
            <div class="mini-card-role">Catch-All</div>
          </div>
        </div>

        <div class="combo-stats">
          <div class="combo-stat-item">
            <span class="stat-lbl">Estimated Yearly Net Value</span>
            <span class="stat-val highlight">$${Math.round(net).toLocaleString()}<small>/yr</small></span>
          </div>
          <div class="combo-stat-item">
            <span class="stat-lbl">Extra vs. Best Single Card</span>
            <span class="stat-val positive">+${difference > 0 ? '$' + difference.toLocaleString() : '$0'}/yr</span>
          </div>
          <div class="combo-strategy-guide">
            <strong>Spending Routing:</strong>
            ${CATEGORIES.map(c => `
              <span class="route-pill">${c.icon} ${c.label.split(' ')[0]}: <strong>${assignment[c.key] === cardA.name ? cardA.name.split(' ')[0] : cardB.name.split(' ')[0]}</strong></span>
            `).join('')}
          </div>
        </div>
      </div>
    </div>
  `;
}

// Render Card Grid Results
function renderCardResults() {
  const cards = getFilteredAndSortedCards();
  const countEl = document.getElementById("resultsCount");
  const gridEl = document.getElementById("resultsGrid");
  const emptyEl = document.getElementById("emptyState");

  if (countEl) {
    countEl.textContent = `Showing ${cards.length} card${cards.length === 1 ? "" : "s"} ranked by estimated ${state.valueMode === "ongoing" ? "ongoing net annual value" : "first year total value"}`;
  }

  if (cards.length === 0) {
    if (gridEl) gridEl.innerHTML = "";
    if (emptyEl) emptyEl.hidden = false;
    return;
  }

  if (emptyEl) emptyEl.hidden = true;

  if (gridEl) {
    gridEl.innerHTML = cards.map(({ card, totalEarned, effectiveFee, ongoingNet, firstYearNet, breakdown, bonus, roiPct }, idx) => {
      const isFav = state.favorites.has(card.id);
      const isCompared = state.comparedCards.has(card.id);
      const inWallet = state.myWallet.has(card.id);
      const displayValue = state.valueMode === "ongoing" ? Math.round(ongoingNet) : Math.round(firstYearNet);
      const valueLabel = state.valueMode === "ongoing" ? "net / year" : "1st year total";

      const topCat = Object.entries(breakdown).sort((a, b) => b[1] - a[1])[0];
      const topCatInfo = CATEGORIES.find(c => c.key === topCat[0]);
      const bankInfo = (typeof BANK_PROFILES !== "undefined" && BANK_PROFILES[card.issuer]) ? BANK_PROFILES[card.issuer] : null;

      return `
        <article class="card-item ${idx === 0 ? 'top-ranked' : ''}" data-card-id="${card.id}">
          ${idx === 0 ? '<div class="rank-ribbon">🏆 #1 Best Value Match</div>' : ''}
          
          <!-- 3D Interactive Styled Credit Card Mockup Header -->
          <div class="card-art-3d-wrapper" onclick="openCardModal('${card.id}')" title="Click to view details or hover for 3D tilt">
            <button class="flip-hint-btn" onclick="flipCard(event, '${card.id}')" title="Flip to see back of card">
              🔄 Flip
            </button>
            <div class="card-art-3d-inner">
              
              <!-- Front Face -->
              <div class="card-art-front" style="background:${card.cardColor}; border-top: 3px solid ${card.accentColor || '#38bdf8'}">
                <div class="card-holographic-sheen"></div>
                <div class="card-art-top">
                  <span class="card-art-issuer">${card.issuer}</span>
                  <span class="card-art-network">${card.network}</span>
                </div>
                <div class="card-art-chip">
                  <svg width="28" height="22" viewBox="0 0 28 22" fill="none">
                    <rect width="28" height="22" rx="3" fill="#e2e8f0" fill-opacity="0.85"/>
                    <path d="M0 7H28M0 15H28M9 0V22M19 0V22" stroke="#64748b" stroke-width="0.8"/>
                  </svg>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="contactless-icon">
                    <path d="M8.5 16.5a5 5 0 0 1 0-7"/>
                    <path d="M12 19a8.5 8.5 0 0 0 0-14"/>
                    <path d="M15.5 21.5a12 12 0 0 0 0-19"/>
                  </svg>
                </div>
                <div class="card-art-bottom">
                  <span class="card-art-name">${card.name}</span>
                  <span class="card-art-type">${card.type === "travel" ? "Travel Points" : "Cash Back"}</span>
                </div>
              </div>

              <!-- Back Face -->
              <div class="card-art-back">
                <div class="card-mag-stripe"></div>
                <div class="card-signature-strip">
                  <span>CVV •••</span>
                </div>
                <div class="card-back-meta">
                  <span>Authorized Signature</span>
                  <span>Cust. Svc: 1-800-${card.issuer.toUpperCase().replace(/\s+/g,'')}</span>
                </div>
              </div>

            </div>
          </div>

          <div class="card-content">
            <div class="card-header-meta">
              <div class="card-titles">
                <h3 class="card-title" onclick="openCardModal('${card.id}')">${card.name}</h3>
                <div style="display:flex; align-items:center; gap:8px; margin-top:2px;">
                  <button class="card-bank-intel-pill" onclick="openBankModal('${card.issuer}')" title="Click to view ${card.issuer} underwriting rules, bureau pulls, & transfer partners">
                    <span class="bank-color-indicator" style="background:${bankInfo ? bankInfo.logoColor : '#38bdf8'}"></span>
                    ${card.issuer} Intel &rarr;
                  </button>
                  <span class="card-best-for">${card.bestFor}</span>
                </div>
              </div>
              <div class="card-quick-actions">
                <button class="wallet-toggle-btn ${inWallet ? 'in-wallet' : ''}" onclick="toggleWalletCard('${card.id}')" title="Toggle card in My Wallet">
                  ${inWallet ? '✓ In Wallet' : '+ My Wallet'}
                </button>
                <button class="icon-action-btn ${isFav ? 'active' : ''}" onclick="toggleFavorite('${card.id}')" title="Save to favorites">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="${isFav ? '#ef4444' : 'none'}" stroke="${isFav ? '#ef4444' : 'currentColor'}" stroke-width="2">
                    <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
                  </svg>
                </button>
              </div>
            </div>

            <!-- Value Display Badge -->
            <div class="card-value-box">
              <div class="value-amount ${displayValue >= 0 ? 'positive' : 'negative'}">
                $${displayValue.toLocaleString()}
                <span class="value-sub">${valueLabel}</span>
                <span class="roi-metric-pill" title="Estimated return on your total annual spend">📈 ${roiPct}% ROI</span>
              </div>
              <div class="value-formula">
                <span>$${Math.round(totalEarned).toLocaleString()} earned</span>
                <span>−</span>
                <span>$${card.annualFee} fee</span>
                ${state.useCredits && card.annualCredits > 0 ? `<span class="credit-offset">+ $${card.annualCredits} credits</span>` : ''}
                ${state.valueMode === "firstYear" && bonus > 0 ? `<span class="bonus-offset">+ $${bonus} bonus</span>` : ''}
              </div>
            </div>

            <!-- Key Reward Rates -->
            <div class="card-reward-rates">
              <div class="rate-col">
                <span class="rate-num">${card.rewards.dining}%</span>
                <span class="rate-lbl">Dining</span>
              </div>
              <div class="rate-col">
                <span class="rate-num">${card.rewards.groceries}%</span>
                <span class="rate-lbl">Groceries</span>
              </div>
              <div class="rate-col">
                <span class="rate-num">${card.rewards.gas}%</span>
                <span class="rate-lbl">Gas</span>
              </div>
              <div class="rate-col">
                <span class="rate-num">${card.rewards.travel}%</span>
                <span class="rate-lbl">Travel</span>
              </div>
              <div class="rate-col">
                <span class="rate-num">${card.rewards.other}%</span>
                <span class="rate-lbl">Other</span>
              </div>
            </div>

            <!-- Category Top Earner Pill -->
            <div class="top-earner-bar">
              <span class="earner-tag">Top Earning Category:</span>
              <span class="earner-val">${topCatInfo.icon} ${topCatInfo.label.split(' ')[0]} ($${Math.round(topCat[1])}/yr)</span>
            </div>

            <!-- Feature Badges -->
            <div class="card-pills">
              <span class="pill ${card.foreignFee ? 'warn' : 'good'}">
                ${card.foreignFee ? '3% Foreign Fee' : '✈️ No Foreign Fee'}
              </span>
              <span class="pill ${card.annualFee === 0 ? 'good' : 'fee'}">
                ${card.annualFee === 0 ? '🎉 $0 Annual Fee' : `$${card.annualFee}/yr fee`}
              </span>
              ${card.hasLounge ? '<span class="pill perk">🍸 Airport Lounges</span>' : ''}
              ${card.hasIntroApr ? '<span class="pill perk">⏳ 0% Intro APR</span>' : ''}
            </div>

            <!-- Sign-up Bonus Banner -->
            <div class="card-bonus-snippet">
              <span class="bonus-icon">🎁</span>
              <span class="bonus-text"><strong>Welcome Bonus:</strong> ${card.bonusText}</span>
            </div>

            <!-- Action Buttons Footer -->
            <div class="card-footer-actions">
              <label class="compare-checkbox-label">
                <input type="checkbox" ${isCompared ? 'checked' : ''} onchange="toggleCompare('${card.id}')">
                <span>Compare</span>
              </label>
              <button class="details-btn" onclick="openCardModal('${card.id}')">
                Details & Breakdown &rarr;
              </button>
            </div>
          </div>
        </article>
      `;
    }).join("");

    setup3DEffects();
  }
}

// Generate SVG Donut Chart
function generateDonutChartSvg(breakdown, totalEarned, totalAnnualSpend) {
  if (totalEarned <= 0) {
    return `<div style="text-align:center; padding:20px; color:var(--text-muted);">No earnings data to display</div>`;
  }

  const radius = 35;
  const circumference = 2 * Math.PI * radius;
  let accumulatedOffset = 0;

  const slices = CATEGORIES.map(cat => {
    const amount = breakdown[cat.key] || 0;
    const pct = amount / totalEarned;
    const strokeDash = pct * circumference;
    const strokeOffset = accumulatedOffset;
    accumulatedOffset += strokeDash;

    return {
      cat,
      amount,
      pct: (pct * 100).toFixed(1),
      strokeDash,
      strokeOffset
    };
  });

  const roi = totalAnnualSpend > 0 ? ((totalEarned / totalAnnualSpend) * 100).toFixed(2) : "0.00";

  return `
    <div class="roi-visual-container">
      <div style="position:relative; width:130px; height:130px; margin:0 auto;">
        <svg class="donut-chart-svg" viewBox="0 0 100 100">
          <circle cx="50" cy="50" r="${radius}" fill="transparent" stroke="var(--border-color)" stroke-width="20"></circle>
          ${slices.map(s => `
            <circle 
              class="donut-segment" 
              cx="50" 
              cy="50" 
              r="${radius}" 
              stroke="${s.cat.color}" 
              stroke-dasharray="${s.strokeDash} ${circumference}" 
              stroke-dashoffset="-${s.strokeOffset}">
              <title>${s.cat.label}: $${Math.round(s.amount)} (${s.pct}%)</title>
            </circle>
          `).join('')}
        </svg>
        <div class="donut-center-group">
          <span class="donut-center-val">${roi}%</span>
          <span class="donut-center-lbl">Net ROI</span>
        </div>
      </div>

      <div class="donut-legend">
        ${slices.map(s => `
          <div class="donut-legend-item">
            <div class="donut-legend-left">
              <span class="donut-color-dot" style="background:${s.cat.color}"></span>
              <span>${s.cat.icon} ${s.cat.label.split(' ')[0]}</span>
            </div>
            <div class="donut-legend-right">
              $${Math.round(s.amount)} <small style="color:var(--text-muted); font-weight:normal;">(${s.pct}%)</small>
            </div>
          </div>
        `).join('')}
      </div>
    </div>
  `;
}

// Render "My Wallet & What-to-Swipe Guide"
function renderWalletView() {
  const container = document.getElementById("walletView");
  if (!container) return;

  const ownedCards = Array.from(state.myWallet).map(id => CARDS_DATABASE.find(c => c.id === id)).filter(Boolean);

  if (ownedCards.length === 0) {
    container.innerHTML = `
      <div class="empty-state">
        <h3>💼 Your Wallet is Empty</h3>
        <p>Select cards you currently own below to unlock your custom "What-to-Swipe" cheat sheet and see if you're leaving money on the table!</p>
        <div class="wallet-picker-grid" style="max-width:800px; margin:24px auto 0;">
          ${CARDS_DATABASE.map(c => `
            <div class="wallet-pick-item" onclick="toggleWalletCard('${c.id}')">
              <div class="pick-item-info">
                <span class="pick-item-name">${c.name}</span>
                <span class="pick-item-sub">${c.issuer} · ${c.annualFee === 0 ? '$0 Fee' : '$' + c.annualFee + '/yr'}</span>
              </div>
              <span class="btn-primary" style="padding:4px 10px; font-size:0.75rem;">+ Add</span>
            </div>
          `).join('')}
        </div>
      </div>
    `;
    return;
  }

  // Calculate current wallet rewards per category
  let currentWalletTotalEarned = 0;
  let currentWalletTotalFees = 0;
  let swipeGuide = {};

  CATEGORIES.forEach(({ key }) => {
    let bestOwnedRate = 0;
    let bestOwnedCard = ownedCards[0];

    ownedCards.forEach(c => {
      const rate = c.rewards[key] || 1.0;
      if (rate > bestOwnedRate) {
        bestOwnedRate = rate;
        bestOwnedCard = c;
      }
    });

    const monthly = state.spending[key];
    const dollars = monthly * 12 * (bestOwnedRate / 100);
    currentWalletTotalEarned += dollars;

    // Find best potential card in whole database
    let bestCatalogRate = 0;
    let bestCatalogCard = null;
    CARDS_DATABASE.forEach(c => {
      const rate = c.rewards[key] || 1.0;
      if (rate > bestCatalogRate) {
        bestCatalogRate = rate;
        bestCatalogCard = c;
      }
    });

    swipeGuide[key] = {
      card: bestOwnedCard,
      rate: bestOwnedRate,
      dollars,
      upgrade: (bestCatalogRate > bestOwnedRate) ? { card: bestCatalogCard, rate: bestCatalogRate } : null
    };
  });

  ownedCards.forEach(c => {
    const fee = state.useCredits ? Math.max(0, c.annualFee - (c.annualCredits || 0)) : c.annualFee;
    currentWalletTotalFees += fee;
  });

  const currentWalletNet = currentWalletTotalEarned - currentWalletTotalFees;

  const optimalCombo = findOptimalCombo(CARDS_DATABASE, state.spending);
  const potentialNet = optimalCombo ? optimalCombo.net : currentWalletNet;
  const missedAmount = Math.max(0, Math.round(potentialNet - currentWalletNet));

  container.innerHTML = `
    <!-- Wallet KPI Summary Hero -->
    <div class="wallet-dashboard-hero">
      <div>
        <h2 style="font-size:1.4rem; font-weight:800; margin-bottom:4px;">💼 My Wallet & Rewards Optimizer</h2>
        <p style="font-size:0.85rem; color:var(--text-muted);">
          You have <strong>${ownedCards.length} card${ownedCards.length === 1 ? '' : 's'}</strong> in your active wallet.
        </p>
      </div>
      <div class="wallet-summary-kpis">
        <div class="kpi-block">
          <span class="kpi-lbl">Current Annual Rewards</span>
          <span class="kpi-val highlight">$${Math.round(currentWalletTotalEarned).toLocaleString()}/yr</span>
        </div>
        <div class="kpi-block">
          <span class="kpi-lbl">Total Annual Fees</span>
          <span class="kpi-val">$${currentWalletTotalFees}/yr</span>
        </div>
        <div class="kpi-block">
          <span class="kpi-lbl">Net Take-Home Value</span>
          <span class="kpi-val positive">$${Math.round(currentWalletNet).toLocaleString()}/yr</span>
        </div>
      </div>
    </div>

    <!-- Missed Rewards Alert if user is leaving money on the table -->
    ${missedAmount > 50 ? `
      <div class="missed-rewards-banner">
        <div class="missed-alert-text">
          <h4>⚠️ You're Leaving Cash On The Table!</h4>
          <p>By upgrading or adding the recommended card to your wallet, you could earn an additional <strong>+$${missedAmount.toLocaleString()}</strong> every single year on your current spending.</p>
        </div>
        <div class="missed-alert-badge">
          +$${missedAmount.toLocaleString()} / yr Potential
        </div>
      </div>
    ` : `
      <div class="missed-rewards-banner" style="border-color: rgba(16, 185, 129, 0.3); background: rgba(16, 185, 129, 0.08);">
        <div class="missed-alert-text">
          <h4 style="color:var(--accent-green);">🎉 Excellent Wallet Setup!</h4>
          <p>Your current card combination is already extracting near-peak value for your spending habits!</p>
        </div>
      </div>
    `}

    <!-- Swipe Guide Cheat Sheet -->
    <div class="swipe-guide-card">
      <div class="swipe-guide-header">
        <h3>💳 What to Swipe: Instant Checkout Cheat Sheet</h3>
        <p style="font-size:0.85rem; color:var(--text-muted);">Always pull out this card when paying in these categories to guarantee maximum cash back or points.</p>
      </div>

      <div class="swipe-grid">
        ${CATEGORIES.map(c => {
          const guide = swipeGuide[c.key];
          return `
            <div class="swipe-item">
              <div class="swipe-item-top">
                <span class="swipe-cat-icon">${c.icon}</span>
                <div class="swipe-cat-info">
                  <h4>${c.label}</h4>
                  <span>Monthly spend: $${state.spending[c.key]}</span>
                </div>
              </div>

              <div class="swipe-recommendation">
                <span class="swipe-rec-lbl">Swipe This Card:</span>
                <span class="swipe-rec-card">${guide.card.name}</span>
                <span class="swipe-rec-rate">${guide.rate}% Back &bull; $${Math.round(guide.dollars)}/yr</span>
              </div>

              ${guide.upgrade ? `
                <div style="font-size:0.72rem; color:var(--text-muted); background:var(--bg-surface); padding:6px 10px; border-radius:var(--radius-sm); border:1px dashed var(--border-color);">
                  <strong style="color:var(--accent-amber);">💡 Upgrade Tip:</strong> ${guide.upgrade.card.name.split(' ')[0]} gets <strong>${guide.upgrade.rate}%</strong>
                </div>
              ` : `
                <div style="font-size:0.72rem; color:var(--accent-green); font-weight:700;">
                  ✓ Maximized for this category!
                </div>
              `}
            </div>
          `;
        }).join('')}
      </div>
    </div>

    <!-- Interactive Card Selector / Manage My Wallet -->
    <div class="wallet-card-selector">
      <div style="display:flex; justify-content:space-between; align-items:center;">
        <div>
          <h3>Manage Cards in Your Wallet</h3>
          <p style="font-size:0.85rem; color:var(--text-muted);">Click any card to add or remove it from your active wallet:</p>
        </div>
        <button onclick="state.myWallet.clear(); localStorage.removeItem('card_finder_my_wallet'); renderApp();" class="btn-secondary" style="font-size:0.75rem;">Clear All</button>
      </div>

      <div class="wallet-picker-grid">
        ${CARDS_DATABASE.map(c => {
          const isOwned = state.myWallet.has(c.id);
          return `
            <div class="wallet-pick-item ${isOwned ? 'active' : ''}" onclick="toggleWalletCard('${c.id}')">
              <div class="pick-item-info">
                <span class="pick-item-name">${c.name}</span>
                <span class="pick-item-sub">${c.issuer} &bull; ${c.annualFee === 0 ? '$0 Fee' : '$' + c.annualFee + '/yr'}</span>
              </div>
              <span style="font-size:0.85rem; font-weight:700; color:${isOwned ? 'var(--primary)' : 'var(--text-muted)'};">
                ${isOwned ? '✓ In Wallet' : '+ Add'}
              </span>
            </div>
          `;
        }).join('')}
      </div>
    </div>
  `;
}

// Card Detail Modal Handlers
function initModals() {
  const detailModal = document.getElementById("cardDetailModal");
  const compareModal = document.getElementById("comparisonModal");
  const bankModal = document.getElementById("bankModal");

  document.querySelectorAll(".modal-close-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      if (detailModal) detailModal.classList.remove("open");
      if (compareModal) compareModal.classList.remove("open");
      if (bankModal) bankModal.classList.remove("open");
    });
  });

  window.addEventListener("click", (e) => {
    if (e.target === detailModal) detailModal.classList.remove("open");
    if (e.target === compareModal) compareModal.classList.remove("open");
    if (e.target === bankModal) bankModal.classList.remove("open");
  });

  window.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      if (detailModal) detailModal.classList.remove("open");
      if (compareModal) compareModal.classList.remove("open");
      if (bankModal) bankModal.classList.remove("open");
    }
  });
}

// Open Single Card Details Modal
function openCardModal(cardId) {
  const card = CARDS_DATABASE.find(c => c.id === cardId);
  if (!card) return;

  const val = calculateCardValue(card, state.spending);
  const totalAnnualSpend = Object.values(state.spending).reduce((a, b) => a + b, 0) * 12;
  const modal = document.getElementById("cardDetailModal");
  const content = document.getElementById("cardDetailContent");
  if (!modal || !content) return;

  const bankInfo = (typeof BANK_PROFILES !== "undefined" && BANK_PROFILES[card.issuer]) ? BANK_PROFILES[card.issuer] : null;

  content.innerHTML = `
    <div class="modal-card-header" style="background:${card.cardColor}">
      <div class="modal-card-badges">
        <span class="modal-badge">${card.issuer}</span>
        <span class="modal-badge">${card.network}</span>
        <span class="modal-badge">${card.type === 'travel' ? 'Travel Rewards' : 'Cash Back'}</span>
      </div>
      <h2>${card.name}</h2>
      <p class="modal-card-sub">${card.bestFor}</p>
    </div>

    <div class="modal-card-body">
      <!-- High Level Stats -->
      <div class="modal-stats-grid">
        <div class="modal-stat-card">
          <span class="lbl">Estimated Ongoing Net</span>
          <span class="val highlight">$${Math.round(val.ongoingNet).toLocaleString()}/yr</span>
        </div>
        <div class="modal-stat-card">
          <span class="lbl">First Year Net (w/ Bonus)</span>
          <span class="val positive">$${Math.round(val.firstYearNet).toLocaleString()}</span>
        </div>
        <div class="modal-stat-card">
          <span class="lbl">Effective Fee</span>
          <span class="val">$${val.effectiveFee}</span>
        </div>
        <div class="modal-stat-card">
          <span class="lbl">Net Return (ROI)</span>
          <span class="val highlight">${val.roiPct}%</span>
        </div>
      </div>

      <!-- Bank Intel Preview Section -->
      ${bankInfo ? `
        <div class="modal-section" style="background:var(--bg-surface-alt); border:1px solid var(--border-color); border-radius:var(--radius-md); padding:14px 18px;">
          <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:10px;">
            <div>
              <span style="font-size:0.72rem; text-transform:uppercase; font-weight:700; color:var(--text-muted); display:block;">Issuing Bank & Rules</span>
              <strong style="font-size:1.05rem; color:var(--text-main);">🏛️ ${bankInfo.name}</strong>
              <div style="font-size:0.78rem; color:var(--text-muted); margin-top:2px;">
                Bureau: ${bankInfo.bureauPulled.split(' ')[0]} &bull; Top Rule: ${bankInfo.underwritingRules[0].title}
              </div>
            </div>
            <button class="btn-primary" style="font-size:0.76rem; padding:6px 14px;" onclick="openBankModal('${card.issuer}')">
              View ${card.issuer} Rules & Partners &rarr;
            </button>
          </div>
        </div>
      ` : ''}

      <!-- Donut Chart & Category Breakdown -->
      <div class="modal-section">
        <h3>📊 Category Rewards Distribution & Net ROI</h3>
        <p class="section-sub">Breakdown of your $${Math.round(val.totalEarned).toLocaleString()} yearly reward across spending categories:</p>
        ${generateDonutChartSvg(val.breakdown, val.totalEarned, totalAnnualSpend)}
      </div>

      <!-- Welcome Bonus & Special Notes -->
      <div class="modal-section highlight-box">
        <h3>🎁 Welcome Offer & Signup Bonus</h3>
        <p><strong>${card.bonusText}</strong></p>
        ${card.specialNotes ? `<p class="special-rate-note"><strong>Reward Details:</strong> ${card.specialNotes}</p>` : ''}
      </div>

      <!-- Annual Fee Offset Credits -->
      ${card.annualCredits > 0 ? `
        <div class="modal-section credit-box">
          <h3>💳 Annual Statement Credits ($${card.annualCredits} Potential Value)</h3>
          <p>By taking advantage of statement credits, your effective annual fee can drop to <strong>$${Math.max(0, card.annualFee - card.annualCredits)}</strong>.</p>
        </div>
      ` : ''}

      <!-- Perks List -->
      <div class="modal-section">
        <h3>⭐ Key Cardholder Perks & Protections</h3>
        <ul class="perks-checklist">
          ${card.perks.map(p => `<li><span class="check-icon">✓</span> <span>${p}</span></li>`).join('')}
        </ul>
      </div>

      <!-- Quick Tips -->
      <div class="modal-section tips-box">
        <h4>💡 Application Pro-Tip</h4>
        <p>${card.issuer === 'Chase' ? 'Chase cards are subject to the 5/24 rule: You will typically not be approved if you have opened 5 or more personal cards across any bank in the past 24 months.' : 
             card.issuer === 'American Express' ? 'Amex has a once-in-a-lifetime rule for welcome bonuses. Check if you are eligible for the welcome offer via their Apply with Confidence tool.' :
             card.issuer === 'Capital One' ? 'Capital One generally pulls all three credit bureaus and limits applicants to at most 1 card every 6 months.' :
             card.issuer === 'Bank of America' ? 'Bank of America enforces the 2/3/4 rule and limits approvals to 7 new cards in 12 months for depositors (or 3 in 12 months without deposits).' :
             'Ensure your credit score meets or exceeds the recommended tier before applying for the best approval odds.'}</p>
      </div>
    </div>
  `;

  modal.classList.add("open");
}

// Open Multi-Card Comparison Matrix
function openComparisonModal() {
  const modal = document.getElementById("comparisonModal");
  const tableContainer = document.getElementById("comparisonTableContainer");
  if (!modal || !tableContainer) return;

  const cards = Array.from(state.comparedCards).map(id => {
    const card = CARDS_DATABASE.find(c => c.id === id);
    const val = calculateCardValue(card, state.spending);
    return { card, ...val };
  });

  if (cards.length === 0) return;

  tableContainer.innerHTML = `
    <table class="comparison-matrix">
      <thead>
        <tr>
          <th class="matrix-feature-col">Feature</th>
          ${cards.map(({ card }) => `
            <th class="matrix-card-col">
              <div class="matrix-card-thumb" style="background:${card.cardColor}">
                <span class="matrix-thumb-issuer">${card.issuer}</span>
                <span class="matrix-thumb-name">${card.name}</span>
              </div>
            </th>
          `).join('')}
        </tr>
      </thead>
      <tbody>
        <tr>
          <td><strong>Ongoing Net Value</strong></td>
          ${cards.map(({ ongoingNet }) => `
            <td class="matrix-val highlight">$${Math.round(ongoingNet).toLocaleString()}/yr</td>
          `).join('')}
        </tr>
        <tr>
          <td><strong>1st Year Total (w/ Bonus)</strong></td>
          ${cards.map(({ firstYearNet }) => `
            <td class="matrix-val positive">$${Math.round(firstYearNet).toLocaleString()}</td>
          `).join('')}
        </tr>
        <tr>
          <td><strong>Annual Fee</strong></td>
          ${cards.map(({ card }) => `
            <td>$${card.annualFee}</td>
          `).join('')}
        </tr>
        <tr>
          <td><strong>Annual Statement Credits</strong></td>
          ${cards.map(({ card }) => `
            <td>${card.annualCredits > 0 ? '$' + card.annualCredits + '/yr' : 'None'}</td>
          `).join('')}
        </tr>
        <tr>
          <td><strong>Foreign Transaction Fee</strong></td>
          ${cards.map(({ card }) => `
            <td>${card.foreignFee ? '❌ Yes (3%)' : '✅ None (0%)'}</td>
          `).join('')}
        </tr>
        <tr>
          <td><strong>Dining Reward Rate</strong></td>
          ${cards.map(({ card }) => `
            <td><strong>${card.rewards.dining}%</strong></td>
          `).join('')}
        </tr>
        <tr>
          <td><strong>Groceries Reward Rate</strong></td>
          ${cards.map(({ card }) => `
            <td><strong>${card.rewards.groceries}%</strong></td>
          `).join('')}
        </tr>
        <tr>
          <td><strong>Gas & EV Reward Rate</strong></td>
          ${cards.map(({ card }) => `
            <td><strong>${card.rewards.gas}%</strong></td>
          `).join('')}
        </tr>
        <tr>
          <td><strong>Travel Reward Rate</strong></td>
          ${cards.map(({ card }) => `
            <td><strong>${card.rewards.travel}%</strong></td>
          `).join('')}
        </tr>
        <tr>
          <td><strong>Other Spending Rate</strong></td>
          ${cards.map(({ card }) => `
            <td><strong>${card.rewards.other}%</strong></td>
          `).join('')}
        </tr>
        <tr>
          <td><strong>Airport Lounge Access</strong></td>
          ${cards.map(({ card }) => `
            <td>${card.hasLounge ? '✅ Included' : '❌ No'}</td>
          `).join('')}
        </tr>
        <tr>
          <td><strong>0% Intro APR</strong></td>
          ${cards.map(({ card }) => `
            <td>${card.hasIntroApr ? card.introAprText : 'None'}</td>
          `).join('')}
        </tr>
        <tr>
          <td><strong>Signup Bonus</strong></td>
          ${cards.map(({ card }) => `
            <td class="matrix-small">${card.bonusText}</td>
          `).join('')}
        </tr>
        <tr>
          <td><strong>Credit Tier Required</strong></td>
          ${cards.map(({ card }) => `
            <td>${card.tierName}</td>
          `).join('')}
        </tr>
      </tbody>
    </table>
  `;

  modal.classList.add("open");
}

// CSV Export Management
function initCsvExport() {
  const btn = document.getElementById("downloadCsvBtn");
  if (btn) {
    btn.addEventListener("click", exportToCsv);
  }
}

function exportToCsv() {
  const cards = getFilteredAndSortedCards();
  if (cards.length === 0) {
    alert("No cards to export under current filters.");
    return;
  }

  const headers = [
    "Rank",
    "Card Name",
    "Issuer",
    "Network",
    "Annual Fee ($)",
    "Effective Fee ($)",
    "Est. Ongoing Net ($/yr)",
    "1st Year Total ($)",
    "ROI (%)",
    "Dining (%)",
    "Groceries (%)",
    "Gas (%)",
    "Travel (%)",
    "Other (%)",
    "No Foreign Fee",
    "Airport Lounge",
    "Signup Bonus",
    "Best For"
  ];

  const rows = cards.map(({ card, ongoingNet, firstYearNet, effectiveFee, roiPct }, idx) => [
    idx + 1,
    `"${card.name.replace(/"/g, '""')}"`,
    `"${card.issuer}"`,
    `"${card.network}"`,
    card.annualFee,
    effectiveFee,
    Math.round(ongoingNet),
    Math.round(firstYearNet),
    roiPct,
    card.rewards.dining,
    card.rewards.groceries,
    card.rewards.gas,
    card.rewards.travel,
    card.rewards.other,
    card.foreignFee ? "No" : "Yes",
    card.hasLounge ? "Yes" : "No",
    `"${card.bonusText.replace(/"/g, '""')}"`,
    `"${card.bestFor.replace(/"/g, '""')}"`
  ]);

  const csvContent = [headers.join(","), ...rows.map(r => r.join(","))].join("\r\n");
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.setAttribute("href", url);
  link.setAttribute("download", `card-finder-rankings-${new Date().toISOString().slice(0,10)}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

// Share current configuration via URL Hash
function shareConfiguration() {
  const shareData = {
    spend: state.spending,
    tier: state.tier,
    maxFee: state.maxFee,
    type: state.type,
    issuer: state.issuer
  };
  const encoded = btoa(JSON.stringify(shareData));
  const url = `${window.location.origin}${window.location.pathname}#config=${encoded}`;

  if (navigator.clipboard) {
    navigator.clipboard.writeText(url).then(() => {
      alert("Configuration link copied to clipboard! You can share this URL with anyone.");
    }).catch(() => {
      prompt("Copy your configuration URL:", url);
    });
  } else {
    prompt("Copy your configuration URL:", url);
  }
}

// Load configuration from URL Hash if present
function loadStateFromUrl() {
  if (window.location.hash.includes("config=")) {
    try {
      const b64 = window.location.hash.split("config=")[1];
      const parsed = JSON.parse(atob(b64));
      if (parsed.spend) state.spending = { ...state.spending, ...parsed.spend };
      if (parsed.tier !== undefined) state.tier = parsed.tier;
      if (parsed.maxFee !== undefined) state.maxFee = parsed.maxFee;
      if (parsed.type) state.type = parsed.type;
      if (parsed.issuer) state.issuer = parsed.issuer;
    } catch (err) {
      console.warn("Failed to parse config from URL:", err);
    }
  }
}

// Global exports for inline HTML event handlers
window.toggleCompare = toggleCompare;
window.toggleFavorite = toggleFavorite;
window.toggleWalletCard = toggleWalletCard;
window.flipCard = flipCard;
window.openCardModal = openCardModal;
window.openBankModal = openBankModal;
window.openComparisonModal = openComparisonModal;
window.resetAllFilters = resetAllFilters;
window.exportToCsv = exportToCsv;
