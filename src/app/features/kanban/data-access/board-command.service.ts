import { Injectable } from '@angular/core';
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
  limit,
  orderBy,
  query,
  updateDoc,
  where,
  writeBatch,
} from 'firebase/firestore';
import { db } from '../../../core/firebase/firebase.client';

@Injectable({
  providedIn: 'root',
})
export class BoardCommandService {
  async createTaskInDefaultColumn(
    boardId: string,
    taskInput: {
      title: string;
      description: string;
      priority: 'low' | 'medium' | 'high';
      assignee: string;
    },
  ): Promise<void> {
    const columnsQuery = query(
      collection(db, 'columns'),
      where('boardId', '==', boardId),
      where('kind', '==', 'todo'),
      limit(1),
    );

    const todoColumnSnapshot = await getDocs(columnsQuery);

    if (todoColumnSnapshot.empty) {
      throw new Error('Keine To-Do-Spalte für dieses Board gefunden.');
    }

    const todoColumnId = todoColumnSnapshot.docs[0].id;

    const tasksQuery = query(
      collection(db, 'tasks'),
      where('boardId', '==', boardId),
      where('columnId', '==', todoColumnId),
      orderBy('position'),
    );

    const tasksSnapshot = await getDocs(tasksQuery);
    const nextPosition = tasksSnapshot.docs.length;
    const timestamp = new Date().toISOString();

    await addDoc(collection(db, 'tasks'), {
      boardId,
      columnId: todoColumnId,
      title: taskInput.title.trim(),
      description: taskInput.description.trim(),
      priority: taskInput.priority,
      assignee: taskInput.assignee.trim(),
      position: nextPosition,
      createdAt: timestamp,
      updatedAt: timestamp,
    });
  }

  async updateTask(
    taskId: string,
    changes: {
      title: string;
      description: string;
      priority: 'low' | 'medium' | 'high';
      assignee: string;
    },
  ): Promise<void> {
    const taskRef = doc(db, 'tasks', taskId);

    await updateDoc(taskRef, {
      title: changes.title.trim(),
      description: changes.description.trim(),
      priority: changes.priority,
      assignee: changes.assignee.trim(),
      updatedAt: new Date().toISOString(),
    });
  }

  async deleteTask(taskId: string): Promise<void> {
    await deleteDoc(doc(db, 'tasks', taskId));
  }

  async moveTask(
    boardId: string,
    previousColumnId: string,
    currentColumnId: string,
    previousIndex: number,
    currentIndex: number,
  ): Promise<void> {
    const tasksQuery = query(
      collection(db, 'tasks'),
      where('boardId', '==', boardId),
      orderBy('position'),
    );

    const tasksSnapshot = await getDocs(tasksQuery);

    const allTasks = tasksSnapshot.docs.map((docSnapshot) => ({
      id: docSnapshot.id,
      ...docSnapshot.data(),
    })) as {
      id: string;
      boardId: string;
      columnId: string;
      title: string;
      description: string;
      priority: 'low' | 'medium' | 'high';
      assignee: string;
      position: number;
      createdAt: string;
      updatedAt: string;
    }[];

    const previousColumnTasks = allTasks
      .filter((task) => task.columnId === previousColumnId)
      .sort((a, b) => a.position - b.position);

    const currentColumnTasks =
      previousColumnId === currentColumnId
        ? previousColumnTasks
        : allTasks
            .filter((task) => task.columnId === currentColumnId)
            .sort((a, b) => a.position - b.position);

    const movedTask = previousColumnTasks[previousIndex];

    if (!movedTask) {
      throw new Error('Zu verschiebender Task wurde nicht gefunden.');
    }

    const updatedPreviousColumnTasks = [...previousColumnTasks];
    updatedPreviousColumnTasks.splice(previousIndex, 1);

    const updatedCurrentColumnTasks =
      previousColumnId === currentColumnId ? updatedPreviousColumnTasks : [...currentColumnTasks];

    updatedCurrentColumnTasks.splice(currentIndex, 0, {
      ...movedTask,
      columnId: currentColumnId,
    });

    const batch = writeBatch(db);
    const timestamp = new Date().toISOString();

    updatedPreviousColumnTasks.forEach((task, index) => {
      batch.update(doc(db, 'tasks', task.id), {
        position: index,
        updatedAt: timestamp,
      });
    });

    updatedCurrentColumnTasks.forEach((task, index) => {
      batch.update(doc(db, 'tasks', task.id), {
        columnId: currentColumnId,
        position: index,
        updatedAt: timestamp,
      });
    });

    await batch.commit();
  }
}
