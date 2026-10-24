# Card Finder Pro 💳✨

A modern, feature-rich credit card rewards calculator, card combo optimizer, and digital wallet assistant with comprehensive **Bank Intelligence & Underwriting Rulebook**.

---

## 🚀 How to Run

### Option 1: Run in Any Web Browser (Recommended)
Simply open [**`index.html`**](file:///C:/Users/tranl/.gemini/antigravity/scratch/card-finder-pro/index.html) directly in Chrome, Edge, Safari, or Firefox. It runs 100% offline with zero dependencies.

### Option 2: Run in Jupyter Notebook or Google Colab
If you are working inside an IPython notebook:
```python
from IPython.display import HTML

with open(r"C:\Users\tranl\.gemini\antigravity\scratch\card-finder-pro\bundle.html", "r", encoding="utf-8") as f:
    display(HTML(f.read()))
```
Or run the included [**`jupyter_notebook_cell.py`**](file:///C:/Users/tranl/.gemini/antigravity/scratch/card-finder-pro/jupyter_notebook_cell.py).

---

## 🏗️ Clean Modular Architecture

The scripts are now cleanly separated into distinct modules:

| File | Purpose |
| :--- | :--- |
| [**`bank-data.js`**](file:///C:/Users/tranl/.gemini/antigravity/scratch/card-finder-pro/bank-data.js) | **Bank Intelligence & Underwriting Rules**: 14 major card issuers, credit bureau pull patterns, 1:1 transfer partners, soft-pull pre-approvals, and direct reconsideration phone hotlines. |
| [**`cards-data.js`**](file:///C:/Users/tranl/.gemini/antigravity/scratch/card-finder-pro/cards-data.js) | **Credit Cards Database & Spending Presets**: 27 top US credit cards across all credit tiers, category reward multipliers, signup bonuses, and annual statement credit values. |
| [**`wallet.js`**](file:///C:/Users/tranl/.gemini/antigravity/scratch/card-finder-pro/wallet.js) | **My Wallet & Checkout Swipe Guide**: Dedicated script managing user's owned cards, store checkout swipe recommendations, and missed rewards calculator. |
| [**`app.js`**](file:///C:/Users/tranl/.gemini/antigravity/scratch/card-finder-pro/app.js) | **Core Controller & UI Engine**: 3D perspective tilts, holographic reflections, filters, comparison matrix, donut chart generator, and CSV export. |
| [**`bundle.html`**](file:///C:/Users/tranl/.gemini/antigravity/scratch/card-finder-pro/bundle.html) | **All-in-One Standalone File**: Full bundle (HTML + CSS + all JS) for single-file deployment or Jupyter Notebooks. |

---

## 🏛️ Supported Banks & Issuers (14 Banks)

1. **JPMorgan Chase**: Chase 5/24 rule, 2/30 rule, Sapphire 48-month cooldown, Ultimate Rewards ecosystem.
2. **American Express**: Once-per-lifetime bonus rule, 5 revolving card limit, 2/90 rule, Membership Rewards.
3. **Capital One**: Triple-bureau pull (Experian, TransUnion, Equifax), 1/6 rule, Capital One Miles.
4. **Citigroup**: 8/65 velocity rule, 48-month family rule, Citi ThankYou Rewards.
5. **Wells Fargo**: 1/6 bonus rule, relationship banking approval boost, Autograph & Active Cash.
6. **Bank of America**: 2/3/4 rule, 7/12 or 3/12 rule, Preferred Rewards (+25% to +75% multipliers).
7. **Barclays**: 6/24 velocity rule, existing card inactivity rule, JetBlue & Wyndham cobranded travel.
8. **Fidelity / Elan Financial**: 2% automatic brokerage/Roth IRA investment deposit, inquiry sensitivity.
9. **Navy Federal Credit Union**: Military/defense family eligibility, 91/3 velocity rule, $80k internal limit.
10. **Robinhood / Coastal Community Bank**: Flat 3% cash back on all purchases with Robinhood Gold.
11. **Synchrony Bank**: Inquiry velocity rules, automatic 2% statement credit payout.
12. **Bilt Rewards / Wells Fargo**: 5 transactions/billing cycle rule, Rent Day double points.
13. **Discover**: 1 card in year 1, 2 cards maximum lifetime, first-year Cashback Match.
14. **U.S. Bank**: Extreme inquiry sensitivity (0/6 or 1/12 rule), Altitude mobile wallet 3x (4.5% on travel).
