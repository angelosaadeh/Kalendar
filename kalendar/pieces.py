"""The seven Kalendar tiles.

Each tile is a small 0/1 mask. The order of ``PIECE_NAMES`` (a..g) is the
canonical piece order used everywhere: by the solver, the saved data, and the
web game's tile IDs (0=a, 1=b, ... 6=g).
"""

import numpy as np

PIECE_NAMES = list("abcdefg")


def _make_pieces():
    a = np.zeros((3, 3), dtype=int)
    a[:, 0] = 1
    a[0, :] = 1

    b = np.zeros((4, 2), dtype=int)
    b[:, 0] = 1
    b[0, :] = 1

    c = np.ones((2, 3), dtype=int)
    c[1, 1] = 0

    d = np.ones((2, 3), dtype=int)
    d[1, 2] = 0

    e = np.ones((2, 4), dtype=int)
    e[1, :] = 0
    e[1, 1] = 1

    f = np.ones((2, 4), dtype=int)
    f[0, 0] = 0
    f[1, 2] = 0
    f[1, 3] = 0

    g = np.ones((3, 3), dtype=int)
    g[0, 0] = 0
    g[0, 1] = 0
    g[2, 1] = 0
    g[2, 2] = 0

    return dict(zip(PIECE_NAMES, [a, b, c, d, e, f, g]))


# name -> base 0/1 mask
PIECES = _make_pieces()

# Whether a tile may be mirrored (flipped) when generating placements.
# Symmetric tiles (a, c) gain nothing from flipping, so it is disabled there.
FLIPS = dict(zip(PIECE_NAMES, [False, True, False, True, True, True, True]))

# Display colours, shared with the web game (index 0=a .. 6=g).
COLORS = dict(zip(PIECE_NAMES, [
    "#c47b5a", "#7ab8c4", "#e8c97a", "#a07ab8",
    "#7ab87a", "#c47aa0", "#c4a07a",
]))
