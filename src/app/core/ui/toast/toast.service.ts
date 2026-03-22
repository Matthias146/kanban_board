import { computed, Injectable, signal } from '@angular/core';
import { ToastItem, ToastType } from '../toast.model';

@Injectable({
  providedIn: 'root',
})
export class ToastService {
  private readonly toastList = signal<ToastItem[]>([]);

  readonly toasts = computed(() => this.toastList());

  success(message: string): void {
    this.show(message, 'success');
  }

  error(message: string): void {
    this.show(message, 'error');
  }

  info(message: string): void {
    this.show(message, 'info');
  }

  remove(id: string): void {
    this.toastList.update((toasts) => toasts.filter((toast) => toast.id !== id));
  }

  private show(message: string, type: ToastType): void {
    const id = crypto.randomUUID();

    this.toastList.update((toasts) => [
      ...toasts,
      {
        id,
        message,
        type,
      },
    ]);

    setTimeout(() => {
      this.remove(id);
    }, 3000);
  }
}
