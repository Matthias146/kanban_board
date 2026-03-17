import { Component, computed, effect, inject, input, output, signal } from '@angular/core';
import { BoardStore } from '../../data-access/board.store';
import { EditTaskFormModel, Task } from '../../models/kanban.models';
import { form, FormField, minLength, required } from '@angular/forms/signals';
import { BoardApiService } from '../../data-access/board-api.service';

@Component({
  selector: 'app-edit-task-dialog',
  imports: [FormField],
  templateUrl: './edit-task-dialog.html',
  styleUrl: './edit-task-dialog.scss',
})
export class EditTaskDialog {
  private readonly boardStore = inject(BoardStore);
  private readonly boardApiService = inject(BoardApiService);
  readonly task = input.required<Task>();
  readonly closed = output<void>();

  protected readonly showDeleteConfirm = signal(false);

  protected openDeleteConfirm(): void {
    this.showDeleteConfirm.set(true);
  }

  protected closeDeleteConfirm(): void {
    this.showDeleteConfirm.set(false);
  }

  protected readonly formModel = signal<EditTaskFormModel>({
    title: '',
    description: '',
    priority: 'medium',
    assignee: '',
  });

  protected readonly taskForm = form(this.formModel, (path) => {
    required(path.title, {
      message: 'Bitte gib einen Task-Titel ein.',
    });
    minLength(path.title, 3, {
      message: 'Der Titel muss mindestens 3 Zeichen lang sein.',
    });

    required(path.description, {
      message: 'Bitte gib eine Beschreibung ein.',
    });
    minLength(path.description, 10, {
      message: 'Die Beschreibung muss mindestens 10 Zeichen lang sein.',
    });

    required(path.assignee, {
      message: 'Bitte gib eine verantwortliche Person ein.',
    });
  });

  protected readonly titleErrors = computed(() => this.taskForm.title().errors());
  protected readonly descriptionErrors = computed(() => this.taskForm.description().errors());
  protected readonly assigneeErrors = computed(() => this.taskForm.assignee().errors());

  constructor() {
    effect(() => {
      const currentTask = this.task();

      this.formModel.set({
        title: currentTask.title,
        description: currentTask.description,
        priority: currentTask.priority,
        assignee: currentTask.assignee,
      });
    });
  }

  protected close(): void {
    this.closed.emit();
  }

  protected async submit(event: Event): Promise<void> {
    event.preventDefault();

    if (!this.taskForm().valid()) {
      this.taskForm().markAsTouched();
      return;
    }

    const boardId = this.boardStore.boardId();

    if (!boardId) {
      console.error('Kein Board im Store vorhanden.');
      return;
    }

    const value = this.formModel();

    await this.boardApiService.updateTask(this.task().id, {
      title: value.title,
      description: value.description,
      priority: value.priority,
      assignee: value.assignee,
    });

    const refreshedBoard = await this.boardApiService.getKanbanBoard(boardId);

    if (refreshedBoard) {
      this.boardStore.setBoard(refreshedBoard);
    }

    this.closed.emit();
  }

  protected async confirmDelete(): Promise<void> {
    const boardId = this.boardStore.boardId();

    if (!boardId) {
      console.error('Kein Board im Store vorhanden.');
      return;
    }

    await this.boardApiService.deleteTask(this.task().id);

    const refreshedBoard = await this.boardApiService.getKanbanBoard(boardId);

    if (refreshedBoard) {
      this.boardStore.setBoard(refreshedBoard);
    }

    this.closed.emit();
  }
}
