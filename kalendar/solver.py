"""Find every Kalendar solution by recursive backtracking.

Key fact that makes this simple: each tile covers exactly 5 cells, and the
board has 31 day cells. Placing 6 non-overlapping tiles (leaving one out) that
avoid the dead cells therefore covers exactly 30 day cells and leaves exactly
one uncovered -- which is, by definition, the revealed date. So *any* legal
arrangement of 6 non-overlapping tiles is a valid solution.
"""

from dataclasses import dataclass

import numpy as np

from .board import BOARD, DEAD, ROWS, COLS, rc_to_date
from .pieces import PIECE_NAMES
from .placements import all_placements


@dataclass
class Solution:
    masks: np.ndarray   # (7, 5, 7) int: per-tile 0/1 mask (all-zero if unused)
    grid: np.ndarray    # (5, 7) int8: piece id 0-6, date cell = -1, dead = -2
    date: int           # the revealed day, 1-31
    unused: int         # index 0-6 of the tile left out


def _build_solution(chosen):
    masks = np.array([
        p if p is not None else np.zeros((ROWS, COLS), dtype=int)
        for p in chosen
    ])
    unused = next(i for i, p in enumerate(chosen) if p is None)

    occ = masks.sum(axis=0)
    uncovered = (BOARD == 1) & (occ == 0)
    (r,), (c,) = np.where(uncovered)
    date = rc_to_date(r, c)

    grid = np.full((ROWS, COLS), -1, dtype=np.int8)
    grid[DEAD] = -2
    for i, p in enumerate(chosen):
        if p is not None:
            grid[p == 1] = i

    return Solution(masks=masks, grid=grid, date=date, unused=unused)


def solve():
    """Return a list of every :class:`Solution`."""
    placements = [all_placements(name) for name in PIECE_NAMES]
    n = len(PIECE_NAMES)

    occ = np.zeros((ROWS, COLS), dtype=int)
    chosen = [None] * n
    results = []

    def recurse(i, skips):
        if i == n:
            if skips == 1:
                results.append(_build_solution(chosen))
            return

        # Option A: leave this tile out (at most one tile may be skipped).
        if skips == 0:
            chosen[i] = None
            recurse(i + 1, 1)

        # Option B: place this tile in any non-overlapping position.
        for p in placements[i]:
            if not np.any(occ & p):
                occ[:] |= p
                chosen[i] = p
                recurse(i + 1, skips)
                occ[:] &= ~p
        chosen[i] = None

    recurse(0, 0)
    return results
