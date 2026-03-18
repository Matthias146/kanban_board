import { Component, inject, signal } from '@angular/core';
import { CreateTaskDialog } from '../../components/create-task-dialog/create-task-dialog';
import { EditTaskDialog } from '../../components/edit-task-dialog/edit-task-dialog';
import { BoardStore } from '../../data-access/board.store';
import { Task } from '../../models/kanban.models';
import { CdkDrag, CdkDragDrop, CdkDropList } from '@angular/cdk/drag-drop';
import { BoardApiService } from '../../data-access/board-api.service';
import { AuthService } from '../../../auth/data-access/auth.service';

@Component({
  selector: 'app-board-page',
  imports: [CreateTaskDialog, EditTaskDialog, CdkDropList, CdkDrag],
  templateUrl: './board-page.html',
  styleUrl: './board-page.scss',
})
export class BoardPage {
  protected readonly boardStore = inject(BoardStore);
  private readonly boardApiService = inject(BoardApiService);
  private readonly authService = inject(AuthService);
  protected readonly isCreateTaskDialogOpen = signal(false);
  protected readonly activeTask = signal<Task | null>(null);
  protected readonly isLoading = signal(true);
  protected readonly loadError = signal<string | null>(null);

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

  protected async dropTask(event: CdkDragDrop<Task[]>): Promise<void> {
    const boardId = this.boardStore.boardId();

    if (!boardId) {
      console.error('Kein Board im Store vorhanden.');
      return;
    }

    const previousColumnId = event.previousContainer.id;
    const currentColumnId = event.container.id;

    try {
      await this.boardApiService.moveTask(
        boardId,
        previousColumnId,
        currentColumnId,
        event.previousIndex,
        event.currentIndex,
      );

      const refreshedBoard = await this.boardApiService.getKanbanBoard(boardId);

      if (refreshedBoard) {
        this.boardStore.setBoard(refreshedBoard);
      }
    } catch (error) {
      console.error('Fehler beim Verschieben des Tasks in Firestore:', error);
    }
  }

  private async loadKanbanBoardFromFirestore(): Promise<void> {
    this.isLoading.set(true);
    this.loadError.set(null);

    try {
      const user = this.authService.user();

      if (!user) {
        this.boardStore.clearBoard();
        return;
      }

      const boardId = await this.boardApiService.getBoardIdForUser(user.uid);

      if (!boardId) {
        this.boardStore.clearBoard();
        return;
      }

      const board = await this.boardApiService.getKanbanBoard(boardId);

      if (!board) {
        this.boardStore.clearBoard();
        return;
      }

      this.boardStore.setBoard(board);
    } catch (error) {
      console.error('Fehler beim Laden des Kanban Boards aus Firestore:', error);
      this.loadError.set('Das Board konnte nicht geladen werden.');
      this.boardStore.clearBoard();
    } finally {
      this.isLoading.set(false);
    }
  }
}
