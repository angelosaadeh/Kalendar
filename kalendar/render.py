"""Matplotlib rendering of solutions and summary statistics."""

import numpy as np
from matplotlib import pyplot as plt
from matplotlib.colors import to_rgb

from .board import ROWS, COLS, rc_to_date
from .pieces import PIECE_NAMES, PIECES, COLORS, FLIPS


def solution_image(grid):
    """Turn a (5, 7) piece-id grid into an RGB image for ``imshow``."""
    img = np.ones((ROWS, COLS, 3))          # white background
    for i, name in enumerate(PIECE_NAMES):
        img[grid == i] = to_rgb(COLORS[name])
    img[grid == -1] = (0.15, 0.15, 0.15)    # the revealed date cell
    img[grid == -2] = (0.9, 0.9, 0.9)       # dead cells
    return img


def show_solution(sol, ax=None):
    """Draw a single solution, with the day number written in each cell."""
    if ax is None:
        _, ax = plt.subplots(figsize=(COLS, ROWS))
    ax.imshow(solution_image(sol.grid))
    for r in range(ROWS):
        for c in range(COLS):
            if sol.grid[r, c] != -2:
                ax.text(c, r, rc_to_date(r, c), ha="center", va="center",
                        fontsize=9, color="black")
    ax.set_title(f"Day {sol.date}  (tile '{PIECE_NAMES[sol.unused]}' unused)")
    ax.set_xticks([])
    ax.set_yticks([])
    return ax


def show_pieces(ax=None):
    """Draw the seven base tiles in a row."""
    if ax is None:
        _, axes = plt.subplots(1, len(PIECE_NAMES), figsize=(2 * len(PIECE_NAMES), 2))
    else:
        axes = ax
    for axis, name in zip(axes, PIECE_NAMES):
        img = np.ones((*PIECES[name].shape, 3))
        img[PIECES[name] == 1] = to_rgb(COLORS[name])
        axis.imshow(img)
        axis.set_title(name + ("" if FLIPS[name] else " (no flip)"), fontsize=9)
        axis.set_xticks([])
        axis.set_yticks([])
    return axes


def show_stats(dates, unused, ax=None):
    """Scatter of revealed date vs. which tile was left unused."""
    if ax is None:
        _, ax = plt.subplots(figsize=(12, 4))
    ax.plot(dates, unused, "x", markersize=8, markeredgewidth=2,
            markeredgecolor="black")
    ax.set_xticks(np.arange(1, 32))
    ax.set_yticks(range(len(PIECE_NAMES)))
    ax.set_yticklabels(PIECE_NAMES)
    ax.set_xlabel("revealed date")
    ax.set_ylabel("unused tile")
    ax.grid(True, alpha=0.3)
    return ax
