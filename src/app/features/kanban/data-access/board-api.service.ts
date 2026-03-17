import { Injectable } from '@angular/core';
import { addDoc, collection, getDocs } from 'firebase/firestore';
import { db } from '../../../core/firebase/firebase.client';

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

  async getBoards(): Promise<void> {
    const querySnapshot = await getDocs(collection(db, 'boards'));

    const boards = querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    console.log('Boards aus Firestore:', boards);
  }
}
