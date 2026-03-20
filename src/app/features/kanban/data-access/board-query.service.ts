import { Injectable } from '@angular/core';
import { collection, doc, getDoc, getDocs, limit, orderBy, query, where } from 'firebase/firestore';
import { db } from '../../../core/firebase/firebase.client';
import { Board, Column, Task } from '../models/kanban.models';
import { FirestoreBoard, FirestoreColumn, FirestoreTask } from '../models/firestore-board.model';

@Injectable({
  providedIn: 'root',
})
export class BoardQueryService {
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

    return querySnapshot.docs.map((docSnapshot) => {
      const data = docSnapshot.data();

      return {
        id: docSnapshot.id,
        title: data['title'] as string,
        ownerId: data['ownerId'] as string,
        createdAt: data['createdAt'] as string,
      };
    });
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
