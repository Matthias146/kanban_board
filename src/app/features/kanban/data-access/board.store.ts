import { Injectable, computed, signal } from '@angular/core';
import { Board, ColumnViewModel, Task } from '../models/kanban.models';

@Injectable({
  providedIn: 'root',
})
export class BoardStore {
  private readonly boardState = signal<Board | null>(null);

  readonly boardId = computed(() => this.boardState()?.id ?? null);

  readonly columns = computed<ColumnViewModel[]>(() => {
    const board = this.boardState();

    if (!board) {
      return [];
    }

    return board.columnOrder.map((columnId) => {
      const column = board.columns[columnId];

      return {
        ...column,
        tasks: column.taskIds
          .map((taskId) => board.tasks[taskId])
          .filter((task): task is Task => !!task),
      };
    });
  });

  readonly totalTaskCount = computed(() => {
    const board = this.boardState();
    return board ? Object.keys(board.tasks).length : 0;
  });

  readonly hasBoard = computed(() => this.boardState() !== null);

  setBoard(board: Board): void {
    this.boardState.set(board);
  }

  clearBoard(): void {
    this.boardState.set(null);
  }
}
