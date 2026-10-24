# Card Finder Pro 💳✨

A modern, feature-rich credit card rewards calculator, card combo optimizer, and digital wallet assistant. Card Finder Pro calculates your net yearly return, determines whether to keep or apply for cards, and gives you an instant checkout swipe guide.

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

### 1. 💼 "My Wallet" & What-to-Swipe Guide
- **Track Your Owned Cards**: Add the credit cards you already hold to your digital wallet with one click.
- **Store Checkout Cheat Sheet**: An instant quick-reference table that shows **which card to pull out at each merchant** (Dining, Groceries, Gas, Travel, Catch-all) to ensure you never miss out on bonus multipliers.
- **Missed Rewards Detection**: Compares your current wallet's yearly earnings against the optimal market strategy and calculates how much money you are leaving on the table.

### 2. 🎴 Interactive 3D Card Tilt & Holographic Sheen
- **3D Physics Tilt**: Hovering over any card calculates the cursor position in 3D perspective space and smoothly tilts the card.
- **Dynamic Holographic Sheen**: Specular light reflections follow your mouse across the metallic and gradient card surface.
- **3D Flip to Back**: Click the **🔄 Flip** button to view the magnetic stripe, signature bar, CVV security panel, and issuer customer service hotline.

### 3. 📊 Visual Donut Charts & Return on Spend (ROI)
- **Interactive SVG Donut Chart**: Visualizes the proportional rewards earned across every category for your spending habits.
- **Net ROI % Metric**: Displays the exact percentage return you are generating on your total annual spend (e.g., `2.92% Net ROI`).
- **Category Dollar Breakdown**: Shows exact dollar returns per category (e.g. $288 groceries, $144 dining).

### 4. 📥 Export to CSV & Printable Reports
- **1-Click CSV Export**: Download a full spreadsheet of all card comparisons, category reward rates, signup bonuses, and net annual calculations.
- **Print / PDF Dossier**: Print-ready stylesheet formatted for saving executive summary reports.
- **Shareable Setup**: URL hash serialization allows you to share your exact spending setup with friends or clients via a link.

### 5. ⚡ Smart 2-Card Maximizer Combo
- Evaluates card pairs across the database to automatically generate your **Optimal 2-Card Combo** (e.g. *Amex Gold for 4% Food + Citi Double Cash for 2% Everything Else*), showing how much more money you pocket over using a single card.

---

## 📁 File Structure

- [**`index.html`**](file:///C:/Users/tranl/.gemini/antigravity/scratch/card-finder-pro/index.html) - Main semantic layout, view tabs, comparison drawer, and modal templates
- [**`styles.css`**](file:///C:/Users/tranl/.gemini/antigravity/scratch/card-finder-pro/styles.css) - Modern fintech design system with 3D transforms, holographic sheen, and dark/light modes
- [**`data.js`**](file:///C:/Users/tranl/.gemini/antigravity/scratch/card-finder-pro/data.js) - Complete dataset of 20 top US credit cards across all credit tiers
- [**`app.js`**](file:///C:/Users/tranl/.gemini/antigravity/scratch/card-finder-pro/app.js) - Reactive calculation engine, wallet manager, 3D tilt handlers, SVG charts, and CSV exporter
- [**`bundle.html`**](file:///C:/Users/tranl/.gemini/antigravity/scratch/card-finder-pro/bundle.html) - Bundled single-file version for Jupyter Notebooks
- [**`jupyter_notebook_cell.py`**](file:///C:/Users/tranl/.gemini/antigravity/scratch/card-finder-pro/jupyter_notebook_cell.py) - Python script to render Card Finder Pro inside Jupyter
