import { Component, computed, inject, output, signal } from '@angular/core';
import { form, FormField, minLength, required } from '@angular/forms/signals';
import { BoardStore } from '../../data-access/board.store';
import { CreateTaskFormModel } from '../../models/kanban.models';
import { BoardCommandService } from '../../data-access/board-command.service';
import { BoardQueryService } from '../../data-access/board-query.service';

@Component({
  selector: 'app-create-task-dialog',
  imports: [FormField],
  templateUrl: './create-task-dialog.html',
  styleUrl: './create-task-dialog.scss',
})
export class CreateTaskDialog {
  private readonly boardStore = inject(BoardStore);
  private readonly boardCommandService = inject(BoardCommandService);
  private readonly boardQueryService = inject(BoardQueryService);

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

    await this.boardCommandService.createTaskInDefaultColumn(boardId, {
      title: value.title,
      description: value.description,
      priority: value.priority,
      assignee: value.assignee,
    });

    const refreshedBoard = await this.boardQueryService.getKanbanBoard(boardId);

    if (refreshedBoard) {
      this.boardStore.setBoard(refreshedBoard);
    }

    this.closed.emit();
  }
}
