import { Board, Column, Task, TaskPriority } from '../models/kanban.models';

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

export function createInitialBoard(): Board {
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
