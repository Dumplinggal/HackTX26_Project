# Card Finder Pro 💳✨

A modern, feature-rich credit card rewards calculator, card combo optimizer, and digital wallet assistant with comprehensive **Bank Intelligence & Approval Rules**.

---

## 🚀 How to Run

### Option 1: Run in Any Web Browser (Recommended)
Simply open [**`index.html`**](file:///C:/Users/tranl/.gemini/antigravity/scratch/card-finder-pro/index.html) directly in Chrome, Edge, Safari, or Firefox. It runs 100% offline with zero dependencies.

### Option 2: Run in Jupyter Notebook or Google Colab
If you are working inside an IPython notebook (like your starter snippet):
```python
from IPython.display import HTML

with open(r"C:\Users\tranl\.gemini\antigravity\scratch\card-finder-pro\bundle.html", "r", encoding="utf-8") as f:
    display(HTML(f.read()))
```
Or run the included [**`jupyter_notebook_cell.py`**](file:///C:/Users/tranl/.gemini/antigravity/scratch/card-finder-pro/jupyter_notebook_cell.py).

---

## 🌟 Full Feature Overview

### 1. 🏛️ Bank Intelligence Dossiers & Approval Rulebook
- **Underwriting Rules**: Detailed guide on proprietary bank application rules before you apply:
  - **Chase**: The **5/24 Rule**, 2/30 velocity limit, Sapphire 48-month bonus cooldown, and 50% income credit limit.
  - **American Express**: **Once-per-lifetime** welcome bonus rule, 5 credit card cap, 2/90 limit, and "Apply With Confidence" soft-pull check.
  - **Capital One**: **Triple-bureau credit pull** (pulls Experian, TransUnion, Equifax simultaneously), 1/6 rule, and 2-card personal limit.
  - **Citi**: The **8/65 Rule** (max 1 card in 8 days, max 2 in 65 days), 48-month family bonus rule, and inquiry sensitivity.
  - **Wells Fargo**: The **1/6 Bonus Rule** and relationship banking underwriting bonuses.
  - **Bank of America**: The **2/3/4 Rule** and **Preferred Rewards** multiplier (+25% to +75% bonus).
  - **Bilt Rewards**: 5 monthly transaction rule, Wells Fargo underwriting, and Rent Day double points.
  - **Discover**: 1 card in year 1, 2 cards maximum lifetime, and 100% US-based customer service.
  - **U.S. Bank**: Extreme inquiry sensitivity (0/6 or 1/12 rule) and relationship perks.
- **Credit Bureau Pull Trends**: Learn whether a bank pulls **Experian**, **TransUnion**, or **Equifax** in your state.
- **1:1 Airline & Hotel Transfer Partners**: Complete breakdown of transfer partners for Chase Ultimate Rewards, Amex Membership Rewards, Capital One Miles, Citi ThankYou, Bilt Rewards, and Wells Fargo Rewards.
- **Direct Reconsideration Hotlines**: Direct phone numbers to call if your application was denied or placed on pending review.
- **Soft-Pull Pre-Approval Status**: Tells you whether the issuer offers soft credit inquiry pre-approval before applying.

### 2. 🔍 Deep Multi-Field Search & Bank Filtering
- **Sidebar Bank Dropdown**: Filter cards strictly by your preferred bank (Chase, Amex, Capital One, Citi, Wells Fargo, BofA, Discover, U.S. Bank, Bilt).
- **Deep Keyword Search**: You can search not just by card name, but by:
  - *Transfer partner*: e.g. typing **"Hyatt"**, **"Delta"**, **"United"**, **"Southwest"**, or **"Aeroplan"** pulls up eligible cards.
  - *Rule or bureau*: e.g. typing **"5/24"**, **"Triple bureau"**, **"Experian"**, **"TransUnion"**, or **"Pre-approval"** filters relevant cards immediately.
  - *Ecosystem*: e.g. typing **"Ultimate Rewards"** or **"Preferred Rewards"**.

### 3. 💼 "My Wallet" & Checkout Swipe Guide
- **Track Your Owned Cards**: Add the cards you already hold to your digital wallet with one click.
- **Store Checkout Cheat Sheet**: Instant reference table showing **which card to swipe at each merchant** (Dining, Groceries, Gas, Travel, Catch-all) to maximize rewards.
- **Missed Rewards Detection**: Alerts you if your current wallet is leaving money on the table compared to optimal cards.

### 4. 🎴 Interactive 3D Card Tilt & Holographic Sheen
- **3D Physics Tilt**: Hovering over any card calculates cursor position in 3D perspective space and smoothly tilts the card.
- **Dynamic Holographic Sheen**: Specular light reflections follow your mouse across the metallic and gradient card surface.
- **3D Flip to Back**: Click the **🔄 Flip** button to view the magnetic stripe, signature bar, CVV security panel, and issuer customer service hotline.

### 5. 📊 Visual Donut Charts & Return on Spend (ROI)
- **Interactive SVG Donut Chart**: Visualizes the proportional rewards earned across every category for your spending habits.
- **Net ROI % Metric**: Displays the exact percentage return you are generating on your total annual spend (e.g., `2.92% Net ROI`).

### 6. 📥 Export to CSV & Printable Reports
- **1-Click CSV Export**: Download a full spreadsheet of all card comparisons, category reward rates, signup bonuses, and net annual calculations.
- **Print / PDF Dossier**: Formatted for saving clean printable PDF reports.
- **Shareable Setup**: URL hash serialization allows you to share your exact spending setup with friends or clients via a link.

---

## 📁 File Structure

- [**`index.html`**](file:///C:/Users/tranl/.gemini/antigravity/scratch/card-finder-pro/index.html) - Main semantic layout, view tabs, comparison drawer, and bank modal templates
- [**`styles.css`**](file:///C:/Users/tranl/.gemini/antigravity/scratch/card-finder-pro/styles.css) - Modern fintech design system with 3D transforms, holographic sheen, bank dossier styling, and dark/light modes
- [**`data.js`**](file:///C:/Users/tranl/.gemini/antigravity/scratch/card-finder-pro/data.js) - Complete dataset of 22 top credit cards + detailed `BANK_PROFILES` for all 9 major card issuers
- [**`app.js`**](file:///C:/Users/tranl/.gemini/antigravity/scratch/card-finder-pro/app.js) - Reactive calculation engine, bank intelligence modal, deep search, wallet manager, and CSV exporter
- [**`bundle.html`**](file:///C:/Users/tranl/.gemini/antigravity/scratch/card-finder-pro/bundle.html) - Bundled single-file version for Jupyter Notebooks (178 KB)
- [**`jupyter_notebook_cell.py`**](file:///C:/Users/tranl/.gemini/antigravity/scratch/card-finder-pro/jupyter_notebook_cell.py) - Python script to render Card Finder Pro inside Jupyter
