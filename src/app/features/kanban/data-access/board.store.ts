import { Injectable, computed, effect, signal } from '@angular/core';
import { createInitialBoard } from './board.seed';
import { loadBoard, saveBoard } from './board.storage';
import { Board, Column, ColumnViewModel, Task, TaskPriority } from '../models/kanban.models';

function nowIso(): string {
  return new Date().toISOString();
}

function createTask(
  title: string,
  description: string,
  priority: TaskPriority,
  assignee: string,
): Task {
  const timestamp = nowIso();

  return {
    id: crypto.randomUUID(),
    title,
    description,
    priority,
    assignee,
    createdAt: timestamp,
    updatedAt: timestamp,
  };
}

@Injectable({
  providedIn: 'root',
})
export class BoardStore {
  private readonly boardState = signal<Board>(loadBoard() ?? createInitialBoard());

  readonly board = computed(() => this.boardState());

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
    effect(() => {
      saveBoard(this.boardState());
    });
  }

  addColumn(title: string): void {
    const trimmedTitle = title.trim();

    if (!trimmedTitle) {
      return;
    }

    const newColumn: Column = {
      id: crypto.randomUUID(),
      title: trimmedTitle,
      taskIds: [],
    };

    this.boardState.update((board) => ({
      ...board,
      columnOrder: [...board.columnOrder, newColumn.id],
      columns: {
        ...board.columns,
        [newColumn.id]: newColumn,
      },
    }));
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

  resetBoard(): void {
    this.boardState.set(createInitialBoard());
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
}
