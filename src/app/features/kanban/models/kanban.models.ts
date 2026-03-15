export type TaskPriority = 'low' | 'medium' | 'high';

export interface Task {
  id: string;
  title: string;
  description: string;
  priority: TaskPriority;
  assignee: string;
  createdAt: string;
  updatedAt: string;
}

export interface Column {
  id: string;
  title: string;
  taskIds: string[];
}

export interface Board {
  id: string;
  title: string;
  columnOrder: string[];
  columns: Record<string, Column>;
  tasks: Record<string, Task>;
}

export interface ColumnViewModel extends Column {
  tasks: Task[];
}

export interface CreateTaskFormModel {
  title: string;
  description: string;
  priority: TaskPriority;
  assignee: string;
}

export interface EditTaskFormModel {
  title: string;
  description: string;
  priority: TaskPriority;
  assignee: string;
}
