import { Board } from '../models/kanban.models';

const BOARD_STORAGE_KEY = 'kanban-board.state';

export function loadBoard(): Board | null {
  const rawValue = localStorage.getItem(BOARD_STORAGE_KEY);

  if (!rawValue) {
    return null;
  }

  try {
    return JSON.parse(rawValue) as Board;
  } catch {
    return null;
  }
}

export function saveBoard(board: Board): void {
  localStorage.setItem(BOARD_STORAGE_KEY, JSON.stringify(board));
}

export function clearBoard(): void {
  localStorage.removeItem(BOARD_STORAGE_KEY);
}
