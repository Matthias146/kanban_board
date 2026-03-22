import { beforeEach, describe, expect, it, vi } from 'vitest';
import type {
  CollectionReference,
  DocumentReference,
  Query,
  QuerySnapshot,
  WriteBatch,
} from 'firebase/firestore';
import { BoardCommandService } from './board-command.service';

const firestoreMocks = vi.hoisted(() => {
  return {
    addDoc: vi.fn(),
    collection: vi.fn(),
    deleteDoc: vi.fn(),
    doc: vi.fn(),
    getDocs: vi.fn(),
    query: vi.fn(),
    updateDoc: vi.fn(),
    where: vi.fn(),
    orderBy: vi.fn(),
    limit: vi.fn(),
    writeBatch: vi.fn(),
  };
});

vi.mock('firebase/firestore', () => {
  return {
    addDoc: firestoreMocks.addDoc,
    collection: firestoreMocks.collection,
    deleteDoc: firestoreMocks.deleteDoc,
    doc: firestoreMocks.doc,
    getDocs: firestoreMocks.getDocs,
    query: firestoreMocks.query,
    updateDoc: firestoreMocks.updateDoc,
    where: firestoreMocks.where,
    orderBy: firestoreMocks.orderBy,
    limit: firestoreMocks.limit,
    writeBatch: firestoreMocks.writeBatch,
  };
});

vi.mock('../../../core/firebase/firebase.client', () => {
  return {
    db: { mocked: true },
  };
});

describe('BoardCommandService', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    firestoreMocks.collection.mockReturnValue({ mocked: true } as unknown as CollectionReference);
    firestoreMocks.doc.mockReturnValue({ mocked: true } as unknown as DocumentReference);
    firestoreMocks.query.mockReturnValue({ mocked: true } as unknown as Query);
    firestoreMocks.where.mockReturnValue({ mocked: true });
    firestoreMocks.orderBy.mockReturnValue({ mocked: true });
    firestoreMocks.limit.mockReturnValue({ mocked: true });
    firestoreMocks.updateDoc.mockResolvedValue(undefined);
    firestoreMocks.deleteDoc.mockResolvedValue(undefined);
    firestoreMocks.addDoc.mockResolvedValue({ mocked: true } as unknown as DocumentReference);
  });

  it('should update a task', async () => {
    const service = new BoardCommandService();

    await service.updateTask('task-1', {
      title: 'Neuer Titel',
      description: 'Neue Beschreibung',
      priority: 'high',
      assignee: 'Matthias',
    });

    expect(firestoreMocks.updateDoc).toHaveBeenCalledTimes(1);
    expect(firestoreMocks.updateDoc).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        title: 'Neuer Titel',
        description: 'Neue Beschreibung',
        priority: 'high',
        assignee: 'Matthias',
        updatedAt: expect.any(String),
      }),
    );
  });

  it('should trim values when updating a task', async () => {
    const service = new BoardCommandService();

    await service.updateTask('task-1', {
      title: '  Neuer Titel  ',
      description: '  Neue Beschreibung  ',
      priority: 'medium',
      assignee: '  Matthias  ',
    });

    expect(firestoreMocks.updateDoc).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        title: 'Neuer Titel',
        description: 'Neue Beschreibung',
        priority: 'medium',
        assignee: 'Matthias',
        updatedAt: expect.any(String),
      }),
    );
  });

  it('should delete a task', async () => {
    const service = new BoardCommandService();

    await service.deleteTask('task-1');

    expect(firestoreMocks.deleteDoc).toHaveBeenCalledTimes(1);
    expect(firestoreMocks.deleteDoc).toHaveBeenCalledWith(expect.anything());
  });

  it('should create a task in the default todo column', async () => {
    firestoreMocks.getDocs
      .mockResolvedValueOnce({
        empty: false,
        docs: [
          {
            id: 'todo-column-1',
            data: () => ({
              boardId: 'board-1',
              title: 'To Do',
              kind: 'todo',
              position: 0,
            }),
          },
        ],
      } as unknown as QuerySnapshot)
      .mockResolvedValueOnce({
        docs: [
          {
            id: 'task-1',
            data: () => ({
              boardId: 'board-1',
              columnId: 'todo-column-1',
              position: 0,
            }),
          },
          {
            id: 'task-2',
            data: () => ({
              boardId: 'board-1',
              columnId: 'todo-column-1',
              position: 1,
            }),
          },
        ],
      } as unknown as QuerySnapshot);

    const service = new BoardCommandService();

    await service.createTaskInDefaultColumn('board-1', {
      title: ' Task Titel ',
      description: ' Task Beschreibung ',
      priority: 'medium',
      assignee: ' Matthias ',
    });

    expect(firestoreMocks.getDocs).toHaveBeenCalledTimes(2);
    expect(firestoreMocks.addDoc).toHaveBeenCalledTimes(1);
    expect(firestoreMocks.addDoc).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        boardId: 'board-1',
        columnId: 'todo-column-1',
        title: 'Task Titel',
        description: 'Task Beschreibung',
        priority: 'medium',
        assignee: 'Matthias',
        position: 2,
        createdAt: expect.any(String),
        updatedAt: expect.any(String),
      }),
    );
  });

  it('should throw when no todo column exists while creating a task', async () => {
    firestoreMocks.getDocs.mockResolvedValueOnce({
      empty: true,
      docs: [],
    } as unknown as QuerySnapshot);

    const service = new BoardCommandService();

    await expect(
      service.createTaskInDefaultColumn('board-1', {
        title: 'Task',
        description: 'Beschreibung',
        priority: 'low',
        assignee: 'Matthias',
      }),
    ).rejects.toThrow('Keine To-Do-Spalte für dieses Board gefunden.');
  });

  it('should move a task within the same column', async () => {
    firestoreMocks.getDocs.mockResolvedValue({
      docs: [
        {
          id: 'task-1',
          data: () => ({
            boardId: 'board-1',
            columnId: 'todo-column',
            title: 'Task 1',
            description: 'Beschreibung 1',
            priority: 'low',
            assignee: 'Matthias',
            position: 0,
            createdAt: '2026-01-01T00:00:00.000Z',
            updatedAt: '2026-01-01T00:00:00.000Z',
          }),
        },
        {
          id: 'task-2',
          data: () => ({
            boardId: 'board-1',
            columnId: 'todo-column',
            title: 'Task 2',
            description: 'Beschreibung 2',
            priority: 'medium',
            assignee: 'Matthias',
            position: 1,
            createdAt: '2026-01-01T00:00:00.000Z',
            updatedAt: '2026-01-01T00:00:00.000Z',
          }),
        },
      ],
    } as unknown as QuerySnapshot);

    const batchUpdate = vi.fn();
    const batchCommit = vi.fn().mockResolvedValue(undefined);

    firestoreMocks.writeBatch.mockReturnValue({
      update: batchUpdate,
      commit: batchCommit,
    } as unknown as WriteBatch);

    const service = new BoardCommandService();

    await service.moveTask('board-1', 'todo-column', 'todo-column', 0, 1);

    expect(batchUpdate).toHaveBeenCalled();
    expect(batchCommit).toHaveBeenCalledTimes(1);
  });

  it('should move a task between columns', async () => {
    firestoreMocks.getDocs.mockResolvedValue({
      docs: [
        {
          id: 'task-1',
          data: () => ({
            boardId: 'board-1',
            columnId: 'todo-column',
            title: 'Task 1',
            description: 'Beschreibung 1',
            priority: 'low',
            assignee: 'Matthias',
            position: 0,
            createdAt: '2026-01-01T00:00:00.000Z',
            updatedAt: '2026-01-01T00:00:00.000Z',
          }),
        },
        {
          id: 'task-2',
          data: () => ({
            boardId: 'board-1',
            columnId: 'done-column',
            title: 'Task 2',
            description: 'Beschreibung 2',
            priority: 'medium',
            assignee: 'Matthias',
            position: 0,
            createdAt: '2026-01-01T00:00:00.000Z',
            updatedAt: '2026-01-01T00:00:00.000Z',
          }),
        },
      ],
    } as unknown as QuerySnapshot);

    const batchUpdate = vi.fn();
    const batchCommit = vi.fn().mockResolvedValue(undefined);

    firestoreMocks.writeBatch.mockReturnValue({
      update: batchUpdate,
      commit: batchCommit,
    } as unknown as WriteBatch);

    const service = new BoardCommandService();

    await service.moveTask('board-1', 'todo-column', 'done-column', 0, 1);

    expect(batchUpdate).toHaveBeenCalled();
    expect(batchCommit).toHaveBeenCalledTimes(1);
  });

  it('should throw when moved task cannot be found', async () => {
    firestoreMocks.getDocs.mockResolvedValue({
      docs: [],
    } as unknown as QuerySnapshot);

    const batchUpdate = vi.fn();
    const batchCommit = vi.fn().mockResolvedValue(undefined);

    firestoreMocks.writeBatch.mockReturnValue({
      update: batchUpdate,
      commit: batchCommit,
    } as unknown as WriteBatch);

    const service = new BoardCommandService();

    await expect(service.moveTask('board-1', 'todo-column', 'done-column', 0, 0)).rejects.toThrow(
      'Zu verschiebender Task wurde nicht gefunden.',
    );
  });
});
