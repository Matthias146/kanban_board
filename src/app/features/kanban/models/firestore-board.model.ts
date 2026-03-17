export type ColumnKind = 'todo' | 'in_progress' | 'done';
export type TaskPriority = 'low' | 'medium' | 'high';

export interface FirestoreBoard {
  id: string;
  title: string;
  createdAt: string;
}

export interface FirestoreColumn {
  id: string;
  boardId: string;
  title: string;
  kind: ColumnKind;
  position: number;
}

export interface FirestoreTask {
  id: string;
  boardId: string;
  columnId: string;
  title: string;
  description: string;
  priority: TaskPriority;
  assignee: string;
  position: number;
  createdAt: string;
  updatedAt: string;
}
