"""Export data/solutions.npz to web/solutions.js for the browser game.

Produces a single global ``KALENDAR_SOLUTIONS = {numbers, solutions}`` where
``solutions[i]`` is an array of 7 tile masks (5x7 of 0/1, index 0=a..6=g) and
``numbers[i]`` is the day that solution reveals.

Usage:
    python scripts/export_web.py
"""

import json
import os
import sys

import numpy as np

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, ROOT)

from kalendar import PIECE_NAMES  # noqa: E402


def main():
    data = np.load(os.path.join(ROOT, "data", "solutions.npz"))
    grids, dates = data["grid"], data["date"]

    numbers = [int(d) for d in dates]
    solutions = [
        [(grid == i).astype(int).tolist() for i in range(len(PIECE_NAMES))]
        for grid in grids
    ]

    payload = json.dumps({"numbers": numbers, "solutions": solutions},
                         separators=(",", ":"))
    out = os.path.join(ROOT, "web", "solutions.js")
    os.makedirs(os.path.dirname(out), exist_ok=True)
    with open(out, "w") as f:
        f.write("const KALENDAR_SOLUTIONS = " + payload + ";\n")
    print(f"Wrote {out}  ({len(numbers)} solutions, {os.path.getsize(out)//1024} KB)")


if __name__ == "__main__":
    main()
