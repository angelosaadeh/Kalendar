"""Kalendar: solver and tools for the calendar tile puzzle.

Place 6 of the 7 tiles on a 5x7 board so every day cell is covered except one,
revealing a date. This package generates and inspects all such solutions.
"""

from .board import BOARD, DEAD, ROWS, COLS, N_DAYS, date_to_rc, rc_to_date
from .pieces import PIECE_NAMES, PIECES, FLIPS, COLORS
from .placements import all_placements, orientations
from .solver import solve, Solution

__all__ = [
    "BOARD", "DEAD", "ROWS", "COLS", "N_DAYS", "date_to_rc", "rc_to_date",
    "PIECE_NAMES", "PIECES", "FLIPS", "COLORS",
    "all_placements", "orientations",
    "solve", "Solution",
]
