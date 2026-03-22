import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ToastService } from './toast.service';

describe('ToastService', () => {
  let service: ToastService;

  beforeEach(() => {
    vi.useFakeTimers();
    service = new ToastService();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.clearAllMocks();
  });

  it('should create a success toast', () => {
    service.success('Task erstellt');

    const toasts = service.toasts();

    expect(toasts).toHaveLength(1);
    expect(toasts[0].message).toBe('Task erstellt');
    expect(toasts[0].type).toBe('success');
    expect(typeof toasts[0].id).toBe('string');
  });

  it('should create an error toast', () => {
    service.error('Fehler beim Speichern');

    const toasts = service.toasts();

    expect(toasts).toHaveLength(1);
    expect(toasts[0].message).toBe('Fehler beim Speichern');
    expect(toasts[0].type).toBe('error');
  });

  it('should create an info toast', () => {
    service.info('Info Nachricht');

    const toasts = service.toasts();

    expect(toasts).toHaveLength(1);
    expect(toasts[0].message).toBe('Info Nachricht');
    expect(toasts[0].type).toBe('info');
  });

  it('should remove a toast manually', () => {
    service.success('Task erstellt');

    const toastId = service.toasts()[0].id;
    service.remove(toastId);

    expect(service.toasts()).toHaveLength(0);
  });

  it('should auto-remove a toast after 3000ms', () => {
    service.success('Wird verschwinden');

    expect(service.toasts()).toHaveLength(1);

    vi.advanceTimersByTime(3000);

    expect(service.toasts()).toHaveLength(0);
  });

  it('should keep multiple toasts separately and remove only one by id', () => {
    service.success('Erfolg');
    service.error('Fehler');

    const [firstToast, secondToast] = service.toasts();

    expect(service.toasts()).toHaveLength(2);

    service.remove(firstToast.id);

    expect(service.toasts()).toHaveLength(1);
    expect(service.toasts()[0].id).toBe(secondToast.id);
    expect(service.toasts()[0].message).toBe('Fehler');
    expect(service.toasts()[0].type).toBe('error');
  });

  it('should auto-remove each toast independently', () => {
    service.success('Erste Nachricht');
    service.error('Zweite Nachricht');

    expect(service.toasts()).toHaveLength(2);

    vi.advanceTimersByTime(3000);

    expect(service.toasts()).toHaveLength(0);
  });
});
