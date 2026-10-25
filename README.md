# Card Finder Pro 💳

A modern, feature-rich credit card rewards calculator, card combo optimizer, and digital wallet assistant with comprehensive **Bank Intelligence & Underwriting Rulebook**.

---

## How to Run

### Option 1: Run in Any Web Browser (Recommended)
Simply open [**`index.html`**](index.html) directly in Chrome, Edge, Safari, or Firefox. It runs 100% offline with zero dependencies.

### Option 2: Run in Jupyter Notebook or Google Colab
If you are working inside an IPython notebook:
```python
from IPython.display import HTML

with open("bundle.html", "r", encoding="utf-8") as f:
    display(HTML(f.read()))
```
Or run the included [**`jupyter_notebook_cell.py`**](jupyter_notebook_cell.py).

---

## Clean Modular Architecture

The scripts are now cleanly separated into distinct modules:

| File | Purpose |
| :--- | :--- |
| [**`bank-data.js`**](bank-data.js) | **Bank Intelligence & Underwriting Rules**: 14 major card issuers, credit bureau pull patterns, 1:1 transfer partners, soft-pull pre-approvals, and direct reconsideration phone hotlines. |
| [**`cards-data.js`**](cards-data.js) | **Credit Cards Database & Spending Presets**: 27 top US credit cards across all credit tiers, category reward multipliers, signup bonuses, and annual statement credit values. |
| [**`wallet.js`**](wallet.js) | **My Wallet & Checkout Swipe Guide**: Dedicated script managing user's owned cards, store checkout swipe recommendations, and missed rewards calculator. |
| [**`app.js`**](app.js) | **Core Controller & UI Engine**: 3D perspective tilts, holographic reflections, filters, comparison matrix, donut chart generator, and CSV export. |
| [**`bundle.html`**](bundle.html) | **All-in-One Standalone File**: Full bundle (HTML + CSS + all JS) for single-file deployment or Jupyter Notebooks. |

---

## Supported Banks & Issuers (14 Banks)

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

---

## Data Freshness & Live Updates

Card rates and bank rules change often and there is no official public API for them, so the app uses a patch feed:

| File | Purpose |
| :--- | :--- |
| `data-freshness.js` | Fetches the patch feed, caches it in `localStorage`, applies it over the bundled data, and renders the status bar + details modal. |
| `data-updates.json` | The feed. Edit this (or host it elsewhere and change `DATA_META.remoteUrl`) to update fees, rates, bonuses and bank rules without touching the app code. |

Example `data-updates.json`:
```json
{
  "updatedAt": "2026-10-24",
  "cards": {
    "chase-sapphire-preferred": { "annualFee": 95, "rewards": { "dining": 3 }, "verifiedAt": "2026-10-24", "sourceUrl": "https://..." }
  },
  "banks": { "Chase": { "reconsiderationPhone": "1-888-270-2127" } }
}
```
Set `bundledSnapshotDate` in `data-freshness.js` to the date you last checked the built-in data. The status bar turns amber after 30 days and red after 90. Fetching needs the page served over http(s); opened via `file://` it falls back to bundled/cached data.

---

## AI Spending Import (Google Gemini API)

Click **Import from bank statement** above the spending sliders. Upload a CSV / PDF / screenshot (or paste transactions), and Gemini categorizes every purchase. Totals are summed in JavaScript (not by the model), divided by the months covered, and applied to your sliders after you review them.

| File | Purpose |
| :--- | :--- |
| `ai-spending.js` | Statement parsing, Gemini calls (`generateContent`), exact aggregation, review UI. |

- Get a free key at https://aistudio.google.com/apikey and paste it in the dialog. It is stored only in your browser.
- Models are listed in `AI_CONFIG.models` (default `gemini-3.5-flash`, falling back to `gemini-3-flash-preview`). Google retires models regularly, so check https://ai.google.dev/gemini-api/docs/models if you get a "model not available" error.
- For CSV/pasted text only date, merchant and amount are sent, with long numbers masked. For a public deployment, proxy the call through your own server so the key is not exposed in the browser.

---

## AI Card Advisor (Google Gemini API)

Click **Ask AI advisor** (bottom right). The chat assistant sees your monthly spending, your wallet, the top-ranked cards for you, the best 2-card combo and the relevant bank approval rules (5/24 etc.), and answers in the language you write in.

| File | Purpose |
| :--- | :--- |
| `ai-advisor.js` | Self-contained chat widget: builds the context from live app state, calls Gemini (`system_instruction` + multi-turn), retries/falls back across models, renders safe markdown. |

- It shares the Gemini key and model list with `ai-spending.js` (load it after that file). If no key is saved yet, the chat asks for one.
- All numbers are computed by the app and given to Gemini as context; the model explains and plans, it does not do the math.
- Chat history is kept in memory only (not saved).
