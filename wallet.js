/**
 * Card Finder Pro - My Wallet & Checkout Swipe Guide Module
 * Manages user's owned cards, calculates checkout category swipe recommendations,
 * and analyzes missed rewards opportunities.
 */

// Global Wallet State
window.walletState = {
  myWallet: new Set(JSON.parse(localStorage.getItem("card_finder_my_wallet") || '["citi-double-cash", "capital-one-savor"]'))
};

// Toggle a card into or out of the user's active wallet
function toggleWalletCard(cardId) {
  if (window.walletState.myWallet.has(cardId)) {
    window.walletState.myWallet.delete(cardId);
  } else {
    window.walletState.myWallet.add(cardId);
  }
  localStorage.setItem("card_finder_my_wallet", JSON.stringify(Array.from(window.walletState.myWallet)));
  renderWalletBadge();
  
  if (typeof state !== "undefined" && state.activeView === "wallet") {
    renderWalletView();
  }
  if (typeof renderCardResults === "function") {
    renderCardResults();
  }
}

// Update the numerical badge in the top navigation
function renderWalletBadge() {
  const badge = document.getElementById("walletBadge");
  if (badge && window.walletState) {
    badge.textContent = window.walletState.myWallet.size;
  }
}

// Render the complete "My Wallet & Checkout Swipe Guide" interface
function renderWalletView() {
  const container = document.getElementById("walletView");
  if (!container || typeof CARDS_DATABASE === "undefined") return;

  const ownedCards = Array.from(window.walletState.myWallet)
    .map(id => CARDS_DATABASE.find(c => c.id === id))
    .filter(Boolean);

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
                <span class="pick-item-sub">${c.issuer} &bull; ${c.annualFee === 0 ? '$0 Fee' : '$' + c.annualFee + '/yr'}</span>
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

  const currentSpending = (typeof state !== "undefined" && state.spending) ? state.spending : {
    dining: 350, groceries: 550, gas: 160, travel: 120, other: 650
  };

  const categories = (typeof CATEGORIES !== "undefined") ? CATEGORIES : [
    { key: "dining", label: "Dining & Takeout", icon: "🍽️" },
    { key: "groceries", label: "Groceries & Supermarkets", icon: "🛒" },
    { key: "gas", label: "Gas & EV Charging", icon: "⛽" },
    { key: "travel", label: "Travel (Flights/Hotels)", icon: "✈️" },
    { key: "other", label: "All Other Spending", icon: "🛍️" }
  ];

  categories.forEach(({ key }) => {
    let bestOwnedRate = 0;
    let bestOwnedCard = ownedCards[0];

    ownedCards.forEach(c => {
      const rate = c.rewards[key] || 1.0;
      if (rate > bestOwnedRate) {
        bestOwnedRate = rate;
        bestOwnedCard = c;
      }
    });

    const monthly = currentSpending[key] || 0;
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

  const useCredits = (typeof state !== "undefined") ? state.useCredits : true;
  ownedCards.forEach(c => {
    const fee = useCredits ? Math.max(0, c.annualFee - (c.annualCredits || 0)) : c.annualFee;
    currentWalletTotalFees += fee;
  });

  const currentWalletNet = currentWalletTotalEarned - currentWalletTotalFees;

  const optimalCombo = (typeof findOptimalCombo === "function") ? findOptimalCombo(CARDS_DATABASE, currentSpending) : null;
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
        ${categories.map(c => {
          const guide = swipeGuide[c.key];
          return `
            <div class="swipe-item">
              <div class="swipe-item-top">
                <span class="swipe-cat-icon">${c.icon}</span>
                <div class="swipe-cat-info">
                  <h4>${c.label}</h4>
                  <span>Monthly spend: $${currentSpending[c.key] || 0}</span>
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
        <button onclick="window.walletState.myWallet.clear(); localStorage.removeItem('card_finder_my_wallet'); renderApp();" class="btn-secondary" style="font-size:0.75rem;">Clear All</button>
      </div>

      <div class="wallet-picker-grid">
        ${CARDS_DATABASE.map(c => {
          const isOwned = window.walletState.myWallet.has(c.id);
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

// Global exports
window.toggleWalletCard = toggleWalletCard;
window.renderWalletBadge = renderWalletBadge;
window.renderWalletView = renderWalletView;
