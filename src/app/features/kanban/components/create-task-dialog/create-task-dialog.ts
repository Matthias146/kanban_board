import { Component, computed, inject, output, signal } from '@angular/core';
import { form, FormField, minLength, required } from '@angular/forms/signals';
import { BoardStore } from '../../data-access/board.store';
import { CreateTaskFormModel } from '../../models/kanban.models';

@Component({
  selector: 'app-create-task-dialog',
  imports: [FormField],
  templateUrl: './create-task-dialog.html',
  styleUrl: './create-task-dialog.scss',
})
export class CreateTaskDialog {
  private readonly boardStore = inject(BoardStore);

  readonly closed = output<void>();

  protected readonly formModel = signal<CreateTaskFormModel>({
    title: '',
    description: '',
    priority: 'medium',
    assignee: 'Matthias',
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

  protected close(): void {
    this.closed.emit();
  }

  protected submit(event: Event): void {
    event.preventDefault();

    if (!this.taskForm().valid()) {
      this.taskForm().markAsTouched();
      return;
    }

    const value = this.formModel();

    this.boardStore.addTaskToDefaultColumn({
      title: value.title,
      description: value.description,
      priority: value.priority,
      assignee: value.assignee,
    });

    this.closed.emit();
  }
}
