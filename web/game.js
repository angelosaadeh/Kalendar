// Canvas helper for rounded rectangles
if (!CanvasRenderingContext2D.prototype.roundRect) {
  CanvasRenderingContext2D.prototype.roundRect = function(x, y, w, h, r) {
    if (w < 2 * r) r = w / 2;
    if (h < 2 * r) r = h / 2;
    this.moveTo(x + r, y);
    this.lineTo(x + w - r, y);
    this.quadraticCurveTo(x + w, y, x + w, y + r);
    this.lineTo(x + w, y + h - r);
    this.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    this.lineTo(x - r, y + h);
    this.quadraticCurveTo(x, y + h, x, y + h - r);
    this.lineTo(x, y + r);
    this.quadraticCurveTo(x, y, x + r, y);
    return this;
  };
}



// ══ KALENDAR GAME ════════════════════════════════════════

// ===== CRITICAL FIXES =====
let currentSolutionIndex = 0;
let showingSolution = false;

// Safe DOM access helper
function getElem(id) {
  return document.getElementById(id);
}

// ─── TILE DEFINITIONS ────────────────────────────────────────────────────
const TILE_DEFS = {
  a: { cells: [[0,0],[0,1],[0,2],[1,0],[2,0]], color: '#c47b5a' },
  b: { cells: [[0,0],[0,1],[1,0],[2,0],[3,0]], color: '#7ab8c4' },
  c: { cells: [[0,0],[0,1],[0,2],[1,0],[1,2]], color: '#e8c97a' },
  d: { cells: [[0,0],[0,1],[0,2],[1,0],[1,1]], color: '#a07ab8' },
  e: { cells: [[0,0],[0,1],[0,2],[0,3],[1,1]], color: '#7ab87a' },
  f: { cells: [[0,1],[0,2],[0,3],[1,0],[1,1]], color: '#c47aa0' },
  g: { cells: [[0,2],[1,0],[1,1],[1,2],[2,0]], color: '#c4a07a' },
};

// ─── BOARD ───────────────────────────────────────────────────────────────
const ROWS = 5, COLS = 7;
const BLOCKED = new Set([31,32,33,34]); // row4 cols 3-6: indices 4*7+3..6

function getCellPx() {
  return window.innerWidth <= 640 ? 48 : 56; // the cell size is here for mobile and non-mobile
}

const GAP = 4, BOARD_PAD = 12;
const TILE_CELL = 24, TILE_GAP = 3;

let targetDay = 1;
let grid = [];
let tileStates = {};

// ─── ORIENTATION MATH ────────────────────────────────────────────────────
function normalize(cells) {
  const minR = Math.min(...cells.map(([r])=>r));
  const minC = Math.min(...cells.map(([,c])=>c));
  return cells.map(([r,c]) => [r-minR, c-minC]);
}

function rotateCW(cells) {
  const maxR = Math.max(...cells.map(([r])=>r));
  return normalize(cells.map(([r,c]) => [c, maxR - r]));
}

function fliplr(cells) {
  const maxC = Math.max(...cells.map(([,c])=>c));
  return normalize(cells.map(([r,c]) => [r, maxC - c]));
}

function flipud(cells) {
  const maxR = Math.max(...cells.map(([r])=>r));
  return normalize(cells.map(([r,c]) => [maxR - r, c]));
}

function applyRotCW(cells, k) {
  let c = normalize(cells.map(x=>[...x]));
  for (let i = 0; i < k; i++) c = rotateCW(c);
  return c;
}

function cellsKey(cells) {
  return normalize(cells).map(([r,c])=>`${r},${c}`).sort().join('|');
}

function computeOrientations(cells, isA) {
  const seen = new Set();
  const result = [];
  const candidates = [];
  for (let k = 0; k < 4; k++) candidates.push(applyRotCW(cells, k));
  for (let k = 0; k < 4; k++) candidates.push(fliplr(applyRotCW(cells, k)));
  if (!isA) for (let k = 0; k < 4; k++) candidates.push(flipud(applyRotCW(cells, k)));
  for (const c of candidates) {
    const key = cellsKey(c);
    if (!seen.has(key)) { seen.add(key); result.push(c); }
  }
  return result;
}

const TILE_ORIENTATIONS = {};
Object.keys(TILE_DEFS).forEach(id => {
  TILE_ORIENTATIONS[id] = computeOrientations(TILE_DEFS[id].cells, id === 'a');
});

function getTransformedCells(id) {
  return TILE_ORIENTATIONS[id][tileStates[id].orientIdx];
}

// ─── STATE INIT ──────────────────────────────────────────────────────────
function buildTileStates() {
  tileStates = {};
  Object.keys(TILE_DEFS).forEach(id => {
    tileStates[id] = { orientIdx: 0, placed: false };
  });
}

function initGrid() {
  grid = Array.from({length: ROWS}, () => Array(COLS).fill(null));
}

// ─── BOARD RENDERING ─────────────────────────────────────────────────────
function buildBoard() {
  const board = getElem('board');
  if (!board) return;
  board.innerHTML = '';
  let dayCounter = 0;
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      const idx = r * COLS + c;
      const div = document.createElement('div');
      div.className = 'cell';
      div.dataset.row = r;
      div.dataset.col = c;
      if (BLOCKED.has(idx)) {
        div.classList.add('blocked');
      } else {
        dayCounter++;
        div.dataset.day = dayCounter;
        div.textContent = dayCounter;
        if (dayCounter === targetDay) div.classList.add('target');
      }
      board.appendChild(div);
    }
  }
}

function refreshBoard() {
  document.querySelectorAll('#board .cell').forEach(cell => {
    const r = +cell.dataset.row, c = +cell.dataset.col;
    const idx = r * COLS + c;
    if (BLOCKED.has(idx)) return;
    const occupant = grid[r][c];
    cell.classList.remove('occupied', 'target');
    cell.textContent = cell.dataset.day;
    const day = +cell.dataset.day;
    if (day === targetDay) {
      cell.classList.add('target');
    }
    if (occupant) {
      cell.classList.add('occupied');
      cell.style.background = TILE_DEFS[occupant].color;
      cell.style.borderColor = 'transparent';
      cell.style.color = 'rgba(0,0,0,0.4)';
    } else {
      cell.style.background = '';
      cell.style.borderColor = '';
    }
  });
}

// ─── TRAY RENDERING ──────────────────────────────────────────────────────
function drawTileOnCanvas(canvas, id) {
  if (!canvas) return;
  const cells = getTransformedCells(id);
  const maxR = Math.max(...cells.map(([r])=>r));
  const maxC = Math.max(...cells.map(([,c])=>c));
  const W = (maxC + 1) * (TILE_CELL + TILE_GAP) - TILE_GAP;
  const H = (maxR + 1) * (TILE_CELL + TILE_GAP) - TILE_GAP;
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext('2d');
  ctx.clearRect(0, 0, W, H);
  ctx.fillStyle = TILE_DEFS[id].color;
  cells.forEach(([r, c]) => {
    const x = c * (TILE_CELL + TILE_GAP), y = r * (TILE_CELL + TILE_GAP);
    ctx.fillRect(x, y, TILE_CELL, TILE_CELL);
  });
  // Add shadow effect
  ctx.fillStyle = 'rgba(0,0,0,0.2)';
  cells.forEach(([r, c]) => {
    const x = c * (TILE_CELL + TILE_GAP), y = r * (TILE_CELL + TILE_GAP);
    ctx.fillRect(x, y + TILE_CELL - 3, TILE_CELL, 3);
  });
}

function buildTray() {
  const tray = getElem('tray');
  if (!tray) return;
  tray.innerHTML = '';
  Object.keys(TILE_DEFS).forEach(id => {
    const state = tileStates[id];
    const slot = document.createElement('div');
    slot.className = 'tile-slot';

    const wrap = document.createElement('div');
    wrap.className = 'tile-canvas-wrap' + (state.placed ? ' placed' : '');
    wrap.dataset.id = id;

    const canvas = document.createElement('canvas');
    drawTileOnCanvas(canvas, id);
    wrap.appendChild(canvas);

    const controls = document.createElement('div');
    controls.className = 'tile-controls';

    const rotBtn = document.createElement('button');
    rotBtn.className = 'tile-btn';
    rotBtn.textContent = '↻ rotate / flip';
    rotBtn.onclick = e => { e.stopPropagation(); rotateTile(id); };
    controls.appendChild(rotBtn);

    if (state.placed) {
      const removeBtn = document.createElement('button');
      removeBtn.className = 'tile-btn';
      removeBtn.textContent = '✕ remove';
      removeBtn.onclick = e => { e.stopPropagation(); removeTile(id); };
      controls.appendChild(removeBtn);
    }

    slot.appendChild(wrap);
    slot.appendChild(controls);
    tray.appendChild(slot);

    wrap.addEventListener('mousedown', e => startDrag(e, id));
    wrap.addEventListener('touchstart', e => {
      e.preventDefault();
      startDrag(e, id);
    }, { passive: false });
  });
}

// ─── DRAG & DROP ─────────────────────────────────────────────────────────
let dragging = null;

function startDrag(e, id) {
  e.preventDefault();
  if (tileStates[id].placed) return;

  const pt = e.touches ? e.touches[0] : e;
  const wrap = e.currentTarget;
  const rect = wrap.getBoundingClientRect();

  const lx = pt.clientX - rect.left;
  const ly = pt.clientY - rect.top;
  const trayClickCol = Math.floor(lx / (TILE_CELL + TILE_GAP));
  const trayClickRow = Math.floor(ly / (TILE_CELL + TILE_GAP));

  const cells = getTransformedCells(id);
  const maxR = Math.max(...cells.map(([r])=>r));
  const maxC = Math.max(...cells.map(([,c])=>c));
  const anchorCellRow = Math.min(trayClickRow, maxR);
  const anchorCellCol = Math.min(trayClickCol, maxC);

  dragging = { id, anchorCellRow, anchorCellCol };

  const ft = getElem('floating-tile');
  if (!ft) return;
  
  drawFloatingTile(id);
  ft.style.display = 'block';
  ft.style.transition = 'none';
  moveFloating(pt.clientX, pt.clientY);
  requestAnimationFrame(() => ft.style.transition = 'left 0.08s ease, top 0.08s ease');

  document.addEventListener('mousemove', onDragMove);
  document.addEventListener('mouseup', onDragEnd);
  document.addEventListener('touchmove', onDragMove, { passive: false });
  document.addEventListener('touchend', onDragEnd);
}

function drawFloatingTile(id) {
  const canvas = getElem('floating-tile');
  if (!canvas) return;
  const cells = getTransformedCells(id);
  const maxR = Math.max(...cells.map(([r])=>r));
  const maxC = Math.max(...cells.map(([,c])=>c));
  const CELL_PX = getCellPx();
  const W = (maxC + 1) * (CELL_PX + GAP);
  const H = (maxR + 1) * (CELL_PX + GAP);
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext('2d');
  ctx.clearRect(0, 0, W, H);
  ctx.fillStyle = TILE_DEFS[id].color;
  ctx.globalAlpha = 0.85;
  cells.forEach(([r, c]) => {
    const x = c * (CELL_PX + GAP), y = r * (CELL_PX + GAP);
    ctx.fillRect(x, y, CELL_PX, CELL_PX);
  });
}

function getBoardSnap(cx, cy) {
  if (!dragging) return null;
  const boardEl = getElem('board');
  if (!boardEl) return null;
  const rect = boardEl.getBoundingClientRect();
  const { anchorCellRow, anchorCellCol } = dragging;
  const CELL_PX = getCellPx();
  const x = cx - rect.left - BOARD_PAD - anchorCellCol * (CELL_PX + GAP);
  const y = cy - rect.top  - BOARD_PAD - anchorCellRow * (CELL_PX + GAP);
  const col = Math.round(x / (CELL_PX + GAP));
  const row = Math.round(y / (CELL_PX + GAP));
  return { row, col };
}

function moveFloating(cx, cy) {
  const ft = getElem('floating-tile');
  if (!ft) return;
  const snap = getBoardSnap(cx, cy);
  if (snap) {
    const { row, col } = snap;
    const { anchorCellRow, anchorCellCol } = dragging;
    const boardEl = getElem('board');
    if (!boardEl) return;
    const rect = boardEl.getBoundingClientRect();
    const CELL_PX = getCellPx();
    const tileLeft = rect.left + BOARD_PAD + col * (CELL_PX + GAP);
    const tileTop  = rect.top  + BOARD_PAD + row * (CELL_PX + GAP);
    const canvasW = ft.width, canvasH = ft.height;
    ft.style.left = (tileLeft + canvasW / 2) + 'px';
    ft.style.top  = (tileTop  + canvasH / 2) + 'px';
  } else {
    ft.style.left = cx + 'px';
    ft.style.top  = cy + 'px';
  }
}

function onDragMove(e) {
  if (!dragging) return;
  e.preventDefault();
  const pt = e.touches ? e.touches[0] : e;
  moveFloating(pt.clientX, pt.clientY);
  highlightDrop(pt.clientX, pt.clientY);
}

function getPlacementCells(id, anchorRow, anchorCol) {
  return getTransformedCells(id).map(([r, c]) => [r + anchorRow, c + anchorCol]);
}

function isValidPlacement(id, anchorRow, anchorCol) {
  const cells = getPlacementCells(id, anchorRow, anchorCol);
  for (const [r, c] of cells) {
    if (r < 0 || r >= ROWS || c < 0 || c >= COLS) return false;
    if (BLOCKED.has(r * COLS + c)) return false;
    const cellEl = document.querySelector(`#board .cell[data-row="${r}"][data-col="${c}"]`);
    if (cellEl && +cellEl.dataset.day === targetDay) return false;
    if (grid[r][c] !== null) return false;
  }
  return true;
}

function highlightDrop(cx, cy) {
  document.querySelectorAll('#board .cell.highlight, #board .cell.invalid-highlight')
    .forEach(el => el.classList.remove('highlight', 'invalid-highlight'));
  if (!dragging) return;
  const snap = getBoardSnap(cx, cy);
  if (!snap) return;
  const { row, col } = snap;
  const valid = isValidPlacement(dragging.id, row, col);
  getPlacementCells(dragging.id, row, col).forEach(([r, c]) => {
    const el = document.querySelector(`#board .cell[data-row="${r}"][data-col="${c}"]`);
    if (el) el.classList.add(valid ? 'highlight' : 'invalid-highlight');
  });
}

function onDragEnd(e) {
  document.removeEventListener('mousemove', onDragMove);
  document.removeEventListener('mouseup', onDragEnd);
  document.removeEventListener('touchmove', onDragMove);
  document.removeEventListener('touchend', onDragEnd);
  document.querySelectorAll('#board .cell.highlight, #board .cell.invalid-highlight')
    .forEach(el => el.classList.remove('highlight', 'invalid-highlight'));

  if (!dragging) return;
  const pt = e.changedTouches ? e.changedTouches[0] : e;
  const snap = getBoardSnap(pt.clientX, pt.clientY);
  if (snap && isValidPlacement(dragging.id, snap.row, snap.col)) {
    placeTile(dragging.id, snap.row, snap.col);
  }
  const ft = getElem('floating-tile');
  if (ft) ft.style.display = 'none';
  dragging = null;
}

// ─── TILE PLACEMENT ──────────────────────────────────────────────────────
function placeTile(id, anchorRow, anchorCol) {
  getPlacementCells(id, anchorRow, anchorCol).forEach(([r, c]) => grid[r][c] = id);
  tileStates[id].placed = true;
  refreshBoard();
  buildTray();
  checkWin();
}

function removeTile(id) {
  for (let r = 0; r < ROWS; r++)
    for (let c = 0; c < COLS; c++)
      if (grid[r][c] === id) grid[r][c] = null;
  tileStates[id].placed = false;
  refreshBoard();
  buildTray();
  const statusEl = getElem('status');
  if (statusEl) {
    statusEl.textContent = '';
    statusEl.className = 'status';
  }
}

function rotateTile(id) {
  tileStates[id].orientIdx = (tileStates[id].orientIdx + 1) % TILE_ORIENTATIONS[id].length;
  buildTray();
}

// ─── WIN CHECK ───────────────────────────────────────────────────────────
function checkWin() {
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      const idx = r * COLS + c;
      if (BLOCKED.has(idx)) continue;
      const cellEl = document.querySelector(`#board .cell[data-row="${r}"][data-col="${c}"]`);
      if (cellEl && +cellEl.dataset.day === targetDay) continue;
      if (grid[r][c] === null) return;
    }
  }
  const st = getElem('status');
  if (st) {
    st.textContent = '✓ Solved! Day ' + targetDay + ' is revealed.';
    st.className = 'status win';
  }
}

// ─── RESET ───────────────────────────────────────────────────────────────
function resetGame() {
  const daySelect = getElem('day-select');
  if (daySelect) targetDay = +daySelect.value;
  initGrid();
  buildTileStates();
  buildBoard();
  refreshBoard();
  buildTray();
  const statusEl = getElem('status');
  if (statusEl) {
    statusEl.textContent = '';
    statusEl.className = 'status';
  }
}

// ══ KALENDAR SOLUTIONS ════════════════════════════════════════

// Map tile indices to IDs (0=a, 1=b, 2=c, 3=d, 4=e, 5=f, 6=g)
const TILE_INDEX_TO_ID = ['a', 'b', 'c', 'd', 'e', 'f', 'g'];

// Store solutions indexed by day for quick lookup
let solutionsByDay = {};

// Initialize solutions lookup table
function initSolutions() {
  if (typeof KALENDAR_SOLUTIONS === 'undefined' || !KALENDAR_SOLUTIONS.numbers) {
    console.error('CRITICAL: Kalendar solutions file not loaded!');
    const statusEl = getElem('solution-status');
    if (statusEl) statusEl.textContent = 'Error: Solutions file missing';
    return false;
  }
  
  // Build a lookup table: day -> array of solutions
  solutionsByDay = {};
  for (let i = 0; i < KALENDAR_SOLUTIONS.numbers.length; i++) {
    const day = KALENDAR_SOLUTIONS.numbers[i];
    if (!solutionsByDay[day]) {
      solutionsByDay[day] = [];
    }
    // Each solution is an array of 7 grids
    solutionsByDay[day].push(KALENDAR_SOLUTIONS.solutions[i]);
  }
  
  console.log('Solutions initialized for days:', Object.keys(solutionsByDay).map(Number).sort());
  return true;
}

// Show solution for current target day
function showSolution() {
  const day = targetDay;
  
  // Check if we have solutions for this day
  if (!solutionsByDay[day] || solutionsByDay[day].length === 0) {
    const statusEl = getElem('solution-status');
    if (statusEl) {
      statusEl.textContent = 'No solution available';
      setTimeout(() => {
        statusEl.textContent = '';
      }, 2000);
    }
    return;
  }
  
  const solutions = solutionsByDay[day];
  currentSolutionIndex = 0;
  showingSolution = true;
  
  // Show navigation
  const nav = getElem('solution-nav');
  const counter = getElem('solution-counter');
  const prevBtn = getElem('prev-sol-btn');
  const nextBtn = getElem('next-sol-btn');
  
  if (nav) nav.style.display = 'flex';
  if (counter) counter.textContent = `${currentSolutionIndex + 1}/${solutions.length}`;
  
  // Enable/disable buttons
  if (prevBtn) prevBtn.disabled = true;
  if (nextBtn) nextBtn.disabled = solutions.length === 1;
  
  // Apply the solution
  applySimpleSolution(solutions[currentSolutionIndex]);
}

// Apply a solution (array of 7 tile grids)
function applySimpleSolution(solutionTiles) {
  // Clear the board first
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      grid[r][c] = null;
    }
  }
  
  // Reset tile states
  Object.keys(TILE_DEFS).forEach(id => {
    tileStates[id].placed = false;
  });
  
  // For each tile (0-6), place it where its grid has 1's
  solutionTiles.forEach((tileGrid, tileIdx) => {
    const tileId = TILE_INDEX_TO_ID[tileIdx];
    let tileUsed = false;
    
    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        // Skip blocked cells
        const idx = r * COLS + c;
        if (BLOCKED.has(idx)) continue;
        
        // If this cell belongs to this tile
        if (tileGrid[r] && tileGrid[r][c] === 1) {
          grid[r][c] = tileId;
          tileUsed = true;
        }
      }
    }
    
    if (tileUsed) {
      tileStates[tileId].placed = true;
    }
  });
  
  // Update the display
  refreshBoard();
  buildTray();
  checkWin();
}

function nextSolution() {
  const solutions = solutionsByDay[targetDay];
  if (!solutions) return;
  
  currentSolutionIndex = Math.min(currentSolutionIndex + 1, solutions.length - 1);
  updateSolutionNavigation(solutions.length);
  applySimpleSolution(solutions[currentSolutionIndex]);
}

function prevSolution() {
  const solutions = solutionsByDay[targetDay];
  if (!solutions) return;
  
  currentSolutionIndex = Math.max(currentSolutionIndex - 1, 0);
  updateSolutionNavigation(solutions.length);
  applySimpleSolution(solutions[currentSolutionIndex]);
}

function updateSolutionNavigation(total) {
  const counter = getElem('solution-counter');
  const prevBtn = getElem('prev-sol-btn');
  const nextBtn = getElem('next-sol-btn');
  
  if (counter) counter.textContent = `${currentSolutionIndex + 1}/${total}`;
  if (prevBtn) prevBtn.disabled = currentSolutionIndex === 0;
  if (nextBtn) nextBtn.disabled = currentSolutionIndex === total - 1;
}

function hideSolution() {
  showingSolution = false;
  const nav = getElem('solution-nav');
  if (nav) nav.style.display = 'none';
  resetGame();
}

// ══ INIT ════════════════════════════════════════════════════
function populateDaySelect() {
  const sel = getElem('day-select');
  if (!sel) return;
  sel.innerHTML = '';
  for (let d = 1; d <= 31; d++) {
    const opt = document.createElement('option');
    opt.value = d;
    opt.textContent = d;
    sel.appendChild(opt);
  }
  // Default to today's day-of-month (clamped to 31).
  targetDay = Math.min(new Date().getDate(), 31);
  sel.value = targetDay;
  sel.addEventListener('change', resetGame);
}

function initKalendar() {
  populateDaySelect();
  initSolutions();
  resetGame();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initKalendar);
} else {
  initKalendar();
}