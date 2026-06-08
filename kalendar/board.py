"""The Kalendar board: a 5x7 grid holding the days 1-31."""

import numpy as np

ROWS, COLS = 5, 7
N_DAYS = 31


def make_board():
    """Return the 5x7 board mask.

    The 31 day cells (row-major, top-left to bottom-right) are 1; the last
    four cells of the bottom row are dead and never covered, so they are 0.
    """
    board = np.ones((ROWS, COLS), dtype=int)
    board.flat[N_DAYS:] = 0
    return board


# The canonical board and a boolean mask of the dead (unusable) cells.
BOARD = make_board()
DEAD = BOARD == 0


def date_to_rc(day):
    """Map a day (1-31) to its (row, col) on the board."""
    if not 1 <= day <= N_DAYS:
        raise ValueError(f"day must be in 1..{N_DAYS}, got {day}")
    return divmod(day - 1, COLS)


def rc_to_date(row, col):
    """Map a (row, col) back to its day (1-31)."""
    return row * COLS + col + 1
