import { Injectable } from '@angular/core';
import {
  addDoc,
  collection,
  doc,
  getDoc,
  getDocs,
  limit,
  orderBy,
  query,
  where,
} from 'firebase/firestore';
import { db } from '../../../core/firebase/firebase.client';
import { Board, Column, Task } from '../models/kanban.models';
import { FirestoreColumn, FirestoreTask } from '../models/firestore-board.model';

@Injectable({
  providedIn: 'root',
})
export class BoardApiService {
  async seedKanbanData(): Promise<void> {
    const boardRef = await addDoc(collection(db, 'boards'), {
      title: 'Kanban Board',
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

    const doneColumnRef = await addDoc(collection(db, 'columns'), {
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

    console.log('Kanban Seed erfolgreich angelegt.', {
      boardId: boardRef.id,
      todoColumnId: todoColumnRef.id,
      inProgressColumnId: inProgressColumnRef.id,
      doneColumnId: doneColumnRef.id,
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
}
