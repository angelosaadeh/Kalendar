"""Run the solver and save every solution to data/solutions.npz.

Usage:
    python scripts/solve.py
"""

import os
import sys

import numpy as np

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from kalendar import solve  # noqa: E402

DATA = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "data")


def main():
    sols = solve()
    print(f"Found {len(sols)} solutions.")

    grids = np.array([s.grid for s in sols], dtype=np.int8)
    dates = np.array([s.date for s in sols], dtype=np.int8)
    unused = np.array([s.unused for s in sols], dtype=np.int8)

    os.makedirs(DATA, exist_ok=True)
    out = os.path.join(DATA, "solutions.npz")
    np.savez_compressed(out, grid=grids, date=dates, unused_piece=unused)
    print(f"Saved {out}  (grid={grids.shape}, date={dates.shape})")


if __name__ == "__main__":
    main()
