"""
Card Finder Pro - Jupyter Notebook Runner
Run this script in Jupyter Notebook or Google Colab to render Card Finder Pro directly in an output cell!
"""

from IPython.display import HTML
import os

bundle_path = os.path.join(os.path.dirname(__file__), "bundle.html")

if os.path.exists(bundle_path):
    with open(bundle_path, "r", encoding="utf-8") as f:
        html_content = f.read()
    display(HTML(html_content))
else:
    print("bundle.html not found. Please ensure bundle.html is in the same directory.")
