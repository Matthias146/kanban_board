import { Component, inject, signal } from '@angular/core';
import { CreateTaskDialog } from '../../components/create-task-dialog/create-task-dialog';
import { EditTaskDialog } from '../../components/edit-task-dialog/edit-task-dialog';
import { BoardStore } from '../../data-access/board.store';
import { Task } from '../../models/kanban.models';
import { CdkDrag, CdkDragDrop, CdkDropList, CdkDropListGroup } from '@angular/cdk/drag-drop';
import { BoardApiService } from '../../data-access/board-api.service';

@Component({
  selector: 'app-board-page',
  imports: [CreateTaskDialog, EditTaskDialog, CdkDropList, CdkDrag, CdkDropListGroup],
  templateUrl: './board-page.html',
  styleUrl: './board-page.scss',
})
export class BoardPage {
  protected readonly boardStore = inject(BoardStore);
  private readonly boardApiService = inject(BoardApiService);
  protected readonly isCreateTaskDialogOpen = signal(false);
  protected readonly activeTask = signal<Task | null>(null);

  constructor() {
    void this.loadKanbanBoardFromFirestore();
  }

  protected openCreateTaskDialog(): void {
    this.isCreateTaskDialogOpen.set(true);
  }

  protected closeCreateTaskDialog(): void {
    this.isCreateTaskDialogOpen.set(false);
  }

  protected openEditTaskDialog(task: Task): void {
    this.activeTask.set(task);
  }

  protected closeEditTaskDialog(): void {
    this.activeTask.set(null);
  }

  protected dropTask(event: CdkDragDrop<Task[]>, columnId: string): void {
    const previousColumnId = event.previousContainer.id;
    const currentColumnId = event.container.id;

    if (event.previousContainer === event.container) {
      this.boardStore.reorderTasksInColumn(columnId, event.previousIndex, event.currentIndex);
      return;
    }

    this.boardStore.moveTaskBetweenColumns(
      previousColumnId,
      currentColumnId,
      event.previousIndex,
      event.currentIndex,
    );
  }

  private async loadKanbanBoardFromFirestore(): Promise<void> {
    try {
      const boardId = await this.boardApiService.getFirstBoardId();

      if (!boardId) {
        console.log('Kein Board in Firestore gefunden.');
        return;
      }

      const board = await this.boardApiService.getKanbanBoard(boardId);

      if (!board) {
        console.log('Kein Kanban Board aus Firestore geladen.');
        return;
      }

      this.boardStore.setBoard(board);
      console.log('Kanban Board in BoardStore hydratisiert:', board);
    } catch (error) {
      console.error('Fehler beim Laden des Kanban Boards aus Firestore:', error);
    }
  }
}
