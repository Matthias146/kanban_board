import { Injectable } from '@angular/core';
import { collection, getDocs, limit, query } from 'firebase/firestore';
import { db } from '../../../core/firebase/firebase.client';
import { FirestoreBoard } from '../models/firestore-board.model';

@Injectable({
  providedIn: 'root',
})
export class BoardApiService {
  async getBoards(): Promise<FirestoreBoard[]> {
    const querySnapshot = await getDocs(collection(db, 'boards'));

    return querySnapshot.docs.map((doc) => {
      const data = doc.data();

      return {
        id: doc.id,
        title: data['title'] as string,
        createdAt: data['createdAt'] as string,
      };
    });
  }

  async getFirstBoard(): Promise<FirestoreBoard | null> {
    const boardsQuery = query(collection(db, 'boards'), limit(1));
    const querySnapshot = await getDocs(boardsQuery);

    if (querySnapshot.empty) {
      return null;
    }

    const firstDoc = querySnapshot.docs[0];
    const data = firstDoc.data();

    return {
      id: firstDoc.id,
      title: data['title'] as string,
      createdAt: data['createdAt'] as string,
    };
  }
}
