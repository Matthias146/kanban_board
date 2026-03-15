import { Task, TaskPriority } from '../models/kanban.models';
import { nowIso } from './date.utils';

export function createTask(
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
