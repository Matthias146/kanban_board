import { Component, inject, signal } from '@angular/core';
import { CreateTaskDialog } from '../../components/create-task-dialog/create-task-dialog';
import { EditTaskDialog } from '../../components/edit-task-dialog/edit-task-dialog';
import { BoardStore } from '../../data-access/board.store';
import { Task } from '../../models/kanban.models';
import { CdkDrag, CdkDragDrop, CdkDropList, CdkDropListGroup } from '@angular/cdk/drag-drop';
import { AuthService } from '../../../auth/data-access/auth.service';
import { BoardQueryService } from '../../data-access/board-query.service';
import { BoardSeedService } from '../../data-access/board-seed.service';
import { BoardCommandService } from '../../data-access/board-command.service';

@Component({
  selector: 'app-board-page',
  imports: [CreateTaskDialog, EditTaskDialog, CdkDropList, CdkDrag, CdkDropListGroup],
  templateUrl: './board-page.html',
  styleUrl: './board-page.scss',
})
export class BoardPage {
  protected readonly boardStore = inject(BoardStore);
  private readonly boardQueryService = inject(BoardQueryService);
  private readonly boardSeedService = inject(BoardSeedService);
  private readonly boardCommandService = inject(BoardCommandService);
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
      await this.boardCommandService.moveTask(
        boardId,
        previousColumnId,
        currentColumnId,
        event.previousIndex,
        event.currentIndex,
      );

      const refreshedBoard = await this.boardQueryService.getKanbanBoard(boardId);

      if (refreshedBoard) {
        this.boardStore.setBoard(refreshedBoard);
      }
    } catch (error) {
      console.error('Fehler beim Verschieben des Tasks in Firestore:', error);
    }
  }

  protected getColumnClass(title: string): string {
    const normalizedTitle = title.trim().toLowerCase();

    if (normalizedTitle.includes('to do') || normalizedTitle.includes('backlog')) {
      return 'board-column board-column--todo';
    }

    if (normalizedTitle.includes('progress')) {
      return 'board-column board-column--progress';
    }

    if (normalizedTitle.includes('done')) {
      return 'board-column board-column--done';
    }

    return 'board-column';
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

      let boardId = await this.boardQueryService.getBoardIdForUser(user.uid);

      if (!boardId) {
        boardId = await this.boardSeedService.createInitialBoardForUser(user.uid);
      }

      const board = await this.boardQueryService.getKanbanBoard(boardId);

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
