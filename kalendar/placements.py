"""Generate every legal board placement of a tile.

A *placement* is a full 5x7 0/1 mask showing the tile sitting somewhere on the
board. A placement is legal when the tile lies entirely inside the board and
covers no dead cell.
"""

import numpy as np

from .board import ROWS, COLS, DEAD
from .pieces import PIECES, FLIPS


def orientations(mask, flip):
    """Return the distinct rotations (and mirrors, if ``flip``) of ``mask``."""
    candidates = [np.rot90(mask, k) for k in range(4)]
    if flip:
        candidates += [np.fliplr(np.rot90(mask, k)) for k in range(4)]

    seen = set()
    result = []
    for cand in candidates:
        key = (cand.shape, cand.tobytes())
        if key not in seen:
            seen.add(key)
            result.append(cand)
    return result


def all_placements(name):
    """Return all legal board placements of tile ``name`` as (P, 5, 7) masks."""
    placements = []
    seen = set()
    for shape in orientations(PIECES[name], FLIPS[name]):
        h, w = shape.shape
        for i in range(ROWS - h + 1):
            for j in range(COLS - w + 1):
                board = np.zeros((ROWS, COLS), dtype=int)
                board[i:i + h, j:j + w] = shape
                if np.any(board & DEAD):
                    continue
                key = board.tobytes()
                if key not in seen:
                    seen.add(key)
                    placements.append(board)
    return np.array(placements)
