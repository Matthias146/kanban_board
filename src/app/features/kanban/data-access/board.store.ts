import { Injectable, computed, effect, inject, signal } from '@angular/core';
import { createInitialBoard } from './board.seed';
import { loadBoard, saveBoard } from './board.storage';
import { Board, ColumnViewModel, Task } from '../models/kanban.models';
import { createTask } from '../utils/task.factory';
import { nowIso } from '../utils/date.utils';
import { BoardApiService } from './board-api.service';

@Injectable({
  providedIn: 'root',
})
export class BoardStore {
  private readonly boardState = signal<Board>(loadBoard() ?? createInitialBoard());
  private readonly boardApiService = inject(BoardApiService);
  readonly columns = computed<ColumnViewModel[]>(() => {
    const board = this.boardState();

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

  readonly totalTaskCount = computed(() => Object.keys(this.boardState().tasks).length);

  constructor() {
    this.boardApiService.testConnection();
    effect(() => {
      saveBoard(this.boardState());
    });
  }

  addTaskToDefaultColumn(taskInput: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>): void {
    const firstColumnId = this.boardState().columnOrder[0];

    if (!firstColumnId) {
      return;
    }

    this.addTaskToColumn(firstColumnId, taskInput);
  }

  updateTask(
    taskId: string,
    changes: Partial<Pick<Task, 'title' | 'description' | 'priority' | 'assignee'>>,
  ): void {
    const existingTask = this.boardState().tasks[taskId];

    if (!existingTask) {
      return;
    }

    this.boardState.update((board) => ({
      ...board,
      tasks: {
        ...board.tasks,
        [taskId]: {
          ...existingTask,
          ...changes,
          title: changes.title?.trim() ?? existingTask.title,
          description: changes.description?.trim() ?? existingTask.description,
          assignee: changes.assignee?.trim() ?? existingTask.assignee,
          updatedAt: nowIso(),
        },
      },
    }));
  }

  deleteTask(taskId: string): void {
    const board = this.boardState();

    if (!board.tasks[taskId]) {
      return;
    }

    const updatedTasks = { ...board.tasks };
    delete updatedTasks[taskId];

    const updatedColumns = Object.fromEntries(
      Object.entries(board.columns).map(([columnId, column]) => [
        columnId,
        {
          ...column,
          taskIds: column.taskIds.filter((id) => id !== taskId),
        },
      ]),
    ) as Board['columns'];

    this.boardState.set({
      ...board,
      tasks: updatedTasks,
      columns: updatedColumns,
    });
  }

  private addTaskToColumn(
    columnId: string,
    taskInput: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>,
  ): void {
    const column = this.boardState().columns[columnId];

    if (!column) {
      return;
    }

    const newTask = createTask(
      taskInput.title.trim(),
      taskInput.description.trim(),
      taskInput.priority,
      taskInput.assignee.trim(),
    );

    this.boardState.update((board) => ({
      ...board,
      tasks: {
        ...board.tasks,
        [newTask.id]: newTask,
      },
      columns: {
        ...board.columns,
        [columnId]: {
          ...board.columns[columnId],
          taskIds: [...board.columns[columnId].taskIds, newTask.id],
        },
      },
    }));
  }

  reorderTasksInColumn(columnId: string, previousIndex: number, currentIndex: number): void {
    const board = this.boardState();
    const column = board.columns[columnId];

    if (!column || previousIndex === currentIndex) {
      return;
    }

    const updatedTaskIds = [...column.taskIds];
    const [movedTaskId] = updatedTaskIds.splice(previousIndex, 1);
    updatedTaskIds.splice(currentIndex, 0, movedTaskId);

    this.boardState.update((currentBoard) => ({
      ...currentBoard,
      columns: {
        ...currentBoard.columns,
        [columnId]: {
          ...currentBoard.columns[columnId],
          taskIds: updatedTaskIds,
        },
      },
    }));
  }

  moveTaskBetweenColumns(
    previousColumnId: string,
    currentColumnId: string,
    previousIndex: number,
    currentIndex: number,
  ): void {
    if (previousColumnId === currentColumnId) {
      return;
    }

    const board = this.boardState();
    const previousColumn = board.columns[previousColumnId];
    const currentColumn = board.columns[currentColumnId];

    if (!previousColumn || !currentColumn) {
      return;
    }

    const previousTaskIds = [...previousColumn.taskIds];
    const currentTaskIds = [...currentColumn.taskIds];

    const [movedTaskId] = previousTaskIds.splice(previousIndex, 1);

    if (!movedTaskId) {
      return;
    }

    currentTaskIds.splice(currentIndex, 0, movedTaskId);

    this.boardState.update((currentBoard) => ({
      ...currentBoard,
      columns: {
        ...currentBoard.columns,
        [previousColumnId]: {
          ...currentBoard.columns[previousColumnId],
          taskIds: previousTaskIds,
        },
        [currentColumnId]: {
          ...currentBoard.columns[currentColumnId],
          taskIds: currentTaskIds,
        },
      },
    }));
  }
}
