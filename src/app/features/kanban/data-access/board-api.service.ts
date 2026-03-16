import { Injectable } from '@angular/core';
import { supabase } from '../../../core/supabase/supabase.client';

@Injectable({
  providedIn: 'root',
})
export class BoardApiService {
  async getBoards(): Promise<void> {
    const { data, error } = await supabase.from('boards').select('*');

    if (error) {
      console.error('Fehler beim Laden der Boards:', error);
      return;
    }

    console.log('Boards aus Supabase:', data);
  }
}
