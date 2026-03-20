import { Injectable } from '@angular/core';
import { addDoc, collection } from 'firebase/firestore';
import { db } from '../../../core/firebase/firebase.client';

@Injectable({
  providedIn: 'root',
})
export class BoardSeedService {
  async createInitialBoardForUser(ownerId: string): Promise<string> {
    const timestamp = new Date().toISOString();

    const boardRef = await addDoc(collection(db, 'boards'), {
      title: 'Kanban Board',
      ownerId,
      createdAt: timestamp,
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
      createdAt: timestamp,
      updatedAt: timestamp,
    });

    await addDoc(collection(db, 'tasks'), {
      boardId: boardRef.id,
      columnId: todoColumnRef.id,
      title: 'Board Layout vorbereiten',
      description: 'Spaltenstruktur und Task-Karten vorbereiten.',
      priority: 'high',
      assignee: 'Matthias',
      position: 1,
      createdAt: timestamp,
      updatedAt: timestamp,
    });

    await addDoc(collection(db, 'tasks'), {
      boardId: boardRef.id,
      columnId: inProgressColumnRef.id,
      title: 'Drag and Drop integrieren',
      description: 'Tasks innerhalb und zwischen Spalten verschiebbar machen.',
      priority: 'medium',
      assignee: 'Matthias',
      position: 0,
      createdAt: timestamp,
      updatedAt: timestamp,
    });

    return boardRef.id;
  }
}
