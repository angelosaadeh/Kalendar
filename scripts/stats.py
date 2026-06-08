"""Render summary stats (date vs. unused tile) to assets/stats.png.

Usage:
    python scripts/stats.py
"""

import os
import sys

import numpy as np
from matplotlib import pyplot as plt

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, ROOT)

from kalendar.render import show_stats, show_pieces  # noqa: E402


def main():
    data = np.load(os.path.join(ROOT, "data", "solutions.npz"))
    dates, unused = data["date"], data["unused_piece"]

    fig = plt.figure(figsize=(14, 5))
    gs = fig.add_gridspec(2, 1, height_ratios=[1, 4], hspace=0.3)
    show_pieces(ax=gs[0].subgridspec(1, 7).subplots())
    show_stats(dates, unused, ax=fig.add_subplot(gs[1]))

    out = os.path.join(ROOT, "assets", "stats.png")
    os.makedirs(os.path.dirname(out), exist_ok=True)
    fig.savefig(out, dpi=120, bbox_inches="tight")
    print(f"Wrote {out}")


if __name__ == "__main__":
    main()
