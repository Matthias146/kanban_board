import { Component, inject, signal } from '@angular/core';
import { BoardStore } from '../../data-access/board.store';
import { CreateTaskDialog } from '../../components/create-task-dialog/create-task-dialog';

@Component({
  selector: 'app-board-page',
  imports: [CreateTaskDialog],
  templateUrl: './board-page.html',
  styleUrl: './board-page.scss',
})
export class BoardPage {
  protected readonly boardStore = inject(BoardStore);
  protected readonly activeCreateTaskColumnId = signal<string | null>(null);

  protected openCreateTaskDialog(columnId: string): void {
    this.activeCreateTaskColumnId.set(columnId);
  }

  protected closeCreateTaskDialog(): void {
    this.activeCreateTaskColumnId.set(null);
  }
}
