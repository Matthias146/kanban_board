import { Injectable } from '@angular/core';
import { supabase } from '../../../core/supabase/supabase.client';

@Injectable({
  providedIn: 'root',
})
export class BoardApiService {
  async testConnection(): Promise<void> {
    console.log('Supabase client ready:', supabase);
  }
}
