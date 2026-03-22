import { Component, computed, effect, inject, input, output, signal } from '@angular/core';
import { EditTaskFormModel, Task } from '../../models/kanban.models';
import { form, FormField, minLength, required } from '@angular/forms/signals';
import { BoardCommandService } from '../../data-access/board-command.service';
import { ToastService } from '../../../../core/ui/toast/toast.service';

@Component({
  selector: 'app-edit-task-dialog',
  imports: [FormField],
  templateUrl: './edit-task-dialog.html',
  styleUrl: './edit-task-dialog.scss',
})
export class EditTaskDialog {
  private readonly boardCommandService = inject(BoardCommandService);
  readonly task = input.required<Task>();
  readonly closed = output<void>();
  protected readonly isSubmitting = signal(false);
  protected readonly isDeleting = signal(false);
  protected readonly showDeleteConfirm = signal(false);
  private readonly toastService = inject(ToastService);

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

    const value = this.formModel();
    this.isSubmitting.set(true);

    try {
      await this.boardCommandService.updateTask(this.task().id, {
        title: value.title,
        description: value.description,
        priority: value.priority,
        assignee: value.assignee,
      });
      this.toastService.success('Task wurde erfolgreich gespeichert.');
      this.closed.emit();
    } catch (error) {
      console.error('Fehler beim Aktualisieren des Tasks:', error);
      this.toastService.error('Task konnte nicht gespeichert werden.');
    } finally {
      this.isSubmitting.set(false);
    }
  }

  protected async confirmDelete(): Promise<void> {
    this.isDeleting.set(true);

    try {
      await this.boardCommandService.deleteTask(this.task().id);
      this.toastService.success('Task wurde gelöscht.');
      this.closed.emit();
    } catch (error) {
      console.error('Fehler beim Löschen des Tasks:', error);
      this.toastService.error('Task konnte nicht gelöscht werden.');
    } finally {
      this.isDeleting.set(false);
    }
  }
}
