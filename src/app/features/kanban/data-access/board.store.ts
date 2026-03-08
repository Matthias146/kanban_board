import { computed, Injectable, signal } from '@angular/core';
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

function createInitialBoard(): Board {
  const task1 = createTask(
    'Kundenanforderungen analysieren',
    'Fachliche Anforderungen für das neue Dashboard sammeln und strukturieren.',
    'high',
    'Matthias',
  );

  const task2 = createTask(
    'Login UI umsetzen',
    'Login-Seite mit Angular Signal Forms und globalem Form-Styling bauen.',
    'medium',
    'Matthias',
  );

  const task3 = createTask(
    'Board Layout vorbereiten',
    'Spaltenstruktur und responsive Grundlogik für das Kanban-Board definieren.',
    'medium',
    'Matthias',
  );

  const todoColumn: Column = {
    id: crypto.randomUUID(),
    title: 'To Do',
    taskIds: [task1.id, task2.id],
  };

  const inProgressColumn: Column = {
    id: crypto.randomUUID(),
    title: 'In Progress',
    taskIds: [task3.id],
  };

  const doneColumn: Column = {
    id: crypto.randomUUID(),
    title: 'Done',
    taskIds: [],
  };

  return {
    id: crypto.randomUUID(),
    title: 'Kanban Board',
    columnOrder: [todoColumn.id, inProgressColumn.id, doneColumn.id],
    columns: {
      [todoColumn.id]: todoColumn,
      [inProgressColumn.id]: inProgressColumn,
      [doneColumn.id]: doneColumn,
    },
    tasks: {
      [task1.id]: task1,
      [task2.id]: task2,
      [task3.id]: task3,
    },
  };
}

@Injectable({
  providedIn: 'root',
})
export class BoardStore {
  private readonly boardState = signal<Board>(createInitialBoard());

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

  addTask(columnId: string, taskInput: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>): void {
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
    const taskExists = !!board.tasks[taskId];

    if (!taskExists) {
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
}
