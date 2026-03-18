import { Injectable } from '@angular/core';
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  limit,
  orderBy,
  query,
  updateDoc,
  where,
  writeBatch,
} from 'firebase/firestore';
import { db } from '../../../core/firebase/firebase.client';
import { Board, Column, Task } from '../models/kanban.models';
import { FirestoreBoard, FirestoreColumn, FirestoreTask } from '../models/firestore-board.model';

@Injectable({
  providedIn: 'root',
})
export class BoardApiService {
  async seedKanbanData(ownerId: string): Promise<void> {
    const boardRef = await addDoc(collection(db, 'boards'), {
      title: 'Kanban Board',
      ownerId,
      createdAt: new Date().toISOString(),
    });

    const todoColumnRef = await addDoc(collection(db, 'columns'), {
      boardId: boardRef.id,
      title: 'To Do',
      kind: 'todo',
      position: 0,
    });

    const inProgressColumnRef = await addDoc(collection(db, 'columns'), {
      boardId: boardRef.id,
      title: 'In Progress',
      kind: 'in_progress',
      position: 1,
    });

    await addDoc(collection(db, 'columns'), {
      boardId: boardRef.id,
      title: 'Done',
      kind: 'done',
      position: 2,
    });

    await addDoc(collection(db, 'tasks'), {
      boardId: boardRef.id,
      columnId: todoColumnRef.id,
      title: 'Login UI umsetzen',
      description: 'Login-Seite mit Angular Signal Forms bauen.',
      priority: 'medium',
      assignee: 'Matthias',
      position: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    await addDoc(collection(db, 'tasks'), {
      boardId: boardRef.id,
      columnId: todoColumnRef.id,
      title: 'Board Layout vorbereiten',
      description: 'Spaltenstruktur und Task-Karten vorbereiten.',
      priority: 'high',
      assignee: 'Matthias',
      position: 1,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    await addDoc(collection(db, 'tasks'), {
      boardId: boardRef.id,
      columnId: inProgressColumnRef.id,
      title: 'Drag and Drop integrieren',
      description: 'Tasks innerhalb und zwischen Spalten verschiebbar machen.',
      priority: 'medium',
      assignee: 'Matthias',
      position: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
  }

  async getBoardIdForUser(ownerId: string): Promise<string | null> {
    const boardsQuery = query(collection(db, 'boards'), where('ownerId', '==', ownerId), limit(1));

    const snapshot = await getDocs(boardsQuery);

    if (snapshot.empty) {
      return null;
    }

    return snapshot.docs[0].id;
  }

  async getBoards(): Promise<FirestoreBoard[]> {
    const querySnapshot = await getDocs(collection(db, 'boards'));

    return querySnapshot.docs.map((doc) => {
      const data = doc.data();

      return {
        id: doc.id,
        title: data['title'] as string,
        ownerId: data['ownerId'] as string,
        createdAt: data['createdAt'] as string,
      };
    });
  }

  async getFirstBoardId(): Promise<string | null> {
    const boardsQuery = query(collection(db, 'boards'), limit(1));
    const snapshot = await getDocs(boardsQuery);

    if (snapshot.empty) {
      return null;
    }

    return snapshot.docs[0].id;
  }

  async getKanbanBoard(boardId: string): Promise<Board | null> {
    const boardDocRef = doc(db, 'boards', boardId);
    const boardDoc = await getDoc(boardDocRef);

    if (!boardDoc.exists()) {
      return null;
    }

    const boardData = boardDoc.data();

    const columnsQuery = query(
      collection(db, 'columns'),
      where('boardId', '==', boardId),
      orderBy('position'),
    );

    const tasksQuery = query(
      collection(db, 'tasks'),
      where('boardId', '==', boardId),
      orderBy('position'),
    );

    const [columnsSnapshot, tasksSnapshot] = await Promise.all([
      getDocs(columnsQuery),
      getDocs(tasksQuery),
    ]);

    const columnsDocs = columnsSnapshot.docs.map((docSnapshot) => ({
      id: docSnapshot.id,
      ...docSnapshot.data(),
    })) as FirestoreColumn[];

    const tasksDocs = tasksSnapshot.docs.map((docSnapshot) => ({
      id: docSnapshot.id,
      ...docSnapshot.data(),
    })) as FirestoreTask[];

    const columns: Record<string, Column> = {};
    const tasks: Record<string, Task> = {};
    const columnOrder: string[] = [];

    for (const columnDoc of columnsDocs) {
      columns[columnDoc.id] = {
        id: columnDoc.id,
        title: columnDoc.title,
        taskIds: [],
      };

      columnOrder.push(columnDoc.id);
    }

    for (const taskDoc of tasksDocs) {
      tasks[taskDoc.id] = {
        id: taskDoc.id,
        title: taskDoc.title,
        description: taskDoc.description,
        priority: taskDoc.priority,
        assignee: taskDoc.assignee,
        createdAt: taskDoc.createdAt,
        updatedAt: taskDoc.updatedAt,
      };

      const column = columns[taskDoc.columnId];

      if (column) {
        column.taskIds.push(taskDoc.id);
      }
    }

    return {
      id: boardDoc.id,
      title: boardData['title'] as string,
      columnOrder,
      columns,
      tasks,
    };
  }

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

    const todoColumnDoc = todoColumnSnapshot.docs[0];
    const todoColumnId = todoColumnDoc.id;

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
    const taskRef = doc(db, 'tasks', taskId);
    await deleteDoc(taskRef);
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
      const taskRef = doc(db, 'tasks', task.id);

      batch.update(taskRef, {
        position: index,
        updatedAt: timestamp,
      });
    });

    updatedCurrentColumnTasks.forEach((task, index) => {
      const taskRef = doc(db, 'tasks', task.id);

      batch.update(taskRef, {
        columnId: currentColumnId,
        position: index,
        updatedAt: timestamp,
      });
    });

    await batch.commit();
  }
}
