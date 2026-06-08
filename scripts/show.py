"""Show the solutions that reveal a given day.

Usage:
    python scripts/show.py 14          # show first solution for day 14
    python scripts/show.py 14 --all    # show up to 12 solutions for day 14
"""

import argparse
import os
import sys

import numpy as np
from matplotlib import pyplot as plt

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, ROOT)

from kalendar import Solution  # noqa: E402
from kalendar.render import show_solution  # noqa: E402


def load_solutions(day):
    data = np.load(os.path.join(ROOT, "data", "solutions.npz"))
    idx = np.where(data["date"] == day)[0]
    return [
        Solution(masks=None, grid=data["grid"][i], date=int(data["date"][i]),
                 unused=int(data["unused_piece"][i]))
        for i in idx
    ]


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("day", type=int)
    ap.add_argument("--all", action="store_true", help="show several solutions")
    args = ap.parse_args()

    sols = load_solutions(args.day)
    if not sols:
        print(f"No solutions for day {args.day}.")
        return
    print(f"Day {args.day}: {len(sols)} solutions.")

    sols = sols[:12] if args.all else sols[:1]
    cols = min(4, len(sols))
    rows = (len(sols) + cols - 1) // cols
    fig, axes = plt.subplots(rows, cols, figsize=(4 * cols, 3 * rows), squeeze=False)
    for ax in axes.flat:
        ax.axis("off")
    for sol, ax in zip(sols, axes.flat):
        show_solution(sol, ax=ax)
    plt.tight_layout()
    plt.show()


if __name__ == "__main__":
    main()
