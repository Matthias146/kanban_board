import { beforeEach, describe, expect, it, vi } from 'vitest';
import type {
  CollectionReference,
  DocumentReference,
  DocumentSnapshot,
  Query,
  QuerySnapshot,
} from 'firebase/firestore';
import { BoardQueryService } from './board-query.service';

const firestoreMocks = vi.hoisted(() => {
  return {
    collection: vi.fn(),
    doc: vi.fn(),
    getDoc: vi.fn(),
    getDocs: vi.fn(),
    limit: vi.fn(),
    onSnapshot: vi.fn(),
    orderBy: vi.fn(),
    query: vi.fn(),
    where: vi.fn(),
  };
});

vi.mock('firebase/firestore', () => {
  return {
    collection: firestoreMocks.collection,
    doc: firestoreMocks.doc,
    getDoc: firestoreMocks.getDoc,
    getDocs: firestoreMocks.getDocs,
    limit: firestoreMocks.limit,
    onSnapshot: firestoreMocks.onSnapshot,
    orderBy: firestoreMocks.orderBy,
    query: firestoreMocks.query,
    where: firestoreMocks.where,
  };
});

vi.mock('../../../core/firebase/firebase.client', () => {
  return {
    db: { mocked: true },
  };
});

describe('BoardQueryService', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    firestoreMocks.collection.mockReturnValue({ mocked: true } as unknown as CollectionReference);
    firestoreMocks.doc.mockReturnValue({ mocked: true } as unknown as DocumentReference);
    firestoreMocks.query.mockReturnValue({ mocked: true } as unknown as Query);
    firestoreMocks.where.mockReturnValue({ mocked: true });
    firestoreMocks.orderBy.mockReturnValue({ mocked: true });
    firestoreMocks.limit.mockReturnValue({ mocked: true });
  });

  it('should return null when no board exists for user', async () => {
    firestoreMocks.getDocs.mockResolvedValue({
      empty: true,
      docs: [],
    } as unknown as QuerySnapshot);

    const service = new BoardQueryService();
    const result = await service.getBoardIdForUser('user-1');

    expect(result).toBeNull();
  });

  it('should return board id when a board exists for user', async () => {
    firestoreMocks.getDocs.mockResolvedValue({
      empty: false,
      docs: [{ id: 'board-123' }],
    } as unknown as QuerySnapshot);

    const service = new BoardQueryService();
    const result = await service.getBoardIdForUser('user-1');

    expect(result).toBe('board-123');
  });

  it('should return all boards', async () => {
    firestoreMocks.getDocs.mockResolvedValue({
      docs: [
        {
          id: 'board-1',
          data: () => ({
            title: 'Kanban Board',
            ownerId: 'user-1',
            createdAt: '2026-01-01T00:00:00.000Z',
          }),
        },
        {
          id: 'board-2',
          data: () => ({
            title: 'Second Board',
            ownerId: 'user-2',
            createdAt: '2026-01-02T00:00:00.000Z',
          }),
        },
      ],
    } as unknown as QuerySnapshot);

    const service = new BoardQueryService();
    const result = await service.getBoards();

    expect(result).toEqual([
      {
        id: 'board-1',
        title: 'Kanban Board',
        ownerId: 'user-1',
        createdAt: '2026-01-01T00:00:00.000Z',
      },
      {
        id: 'board-2',
        title: 'Second Board',
        ownerId: 'user-2',
        createdAt: '2026-01-02T00:00:00.000Z',
      },
    ]);
  });

  it('should return null when board document does not exist', async () => {
    firestoreMocks.getDoc.mockResolvedValue({
      exists: () => false,
    } as unknown as DocumentSnapshot);

    const service = new BoardQueryService();
    const result = await service.getKanbanBoard('board-1');

    expect(result).toBeNull();
  });

  it('should map firestore data to kanban board model', async () => {
    firestoreMocks.getDoc.mockResolvedValue({
      exists: () => true,
      id: 'board-1',
      data: () => ({
        title: 'Kanban Board',
        ownerId: 'user-1',
        createdAt: '2026-01-01T00:00:00.000Z',
      }),
    } as unknown as DocumentSnapshot);

    firestoreMocks.getDocs
      .mockResolvedValueOnce({
        docs: [
          {
            id: 'column-1',
            data: () => ({
              boardId: 'board-1',
              title: 'To Do',
              kind: 'todo',
              position: 0,
            }),
          },
          {
            id: 'column-2',
            data: () => ({
              boardId: 'board-1',
              title: 'Done',
              kind: 'done',
              position: 1,
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
              columnId: 'column-1',
              title: 'Task 1',
              description: 'Beschreibung 1',
              priority: 'medium',
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
              columnId: 'column-2',
              title: 'Task 2',
              description: 'Beschreibung 2',
              priority: 'high',
              assignee: 'Matthias',
              position: 0,
              createdAt: '2026-01-01T00:00:00.000Z',
              updatedAt: '2026-01-01T00:00:00.000Z',
            }),
          },
        ],
      } as unknown as QuerySnapshot);

    const service = new BoardQueryService();
    const result = await service.getKanbanBoard('board-1');

    expect(result).toEqual({
      id: 'board-1',
      title: 'Kanban Board',
      columnOrder: ['column-1', 'column-2'],
      columns: {
        'column-1': {
          id: 'column-1',
          title: 'To Do',
          taskIds: ['task-1'],
        },
        'column-2': {
          id: 'column-2',
          title: 'Done',
          taskIds: ['task-2'],
        },
      },
      tasks: {
        'task-1': {
          id: 'task-1',
          title: 'Task 1',
          description: 'Beschreibung 1',
          priority: 'medium',
          assignee: 'Matthias',
          createdAt: '2026-01-01T00:00:00.000Z',
          updatedAt: '2026-01-01T00:00:00.000Z',
        },
        'task-2': {
          id: 'task-2',
          title: 'Task 2',
          description: 'Beschreibung 2',
          priority: 'high',
          assignee: 'Matthias',
          createdAt: '2026-01-01T00:00:00.000Z',
          updatedAt: '2026-01-01T00:00:00.000Z',
        },
      },
    });
  });

  it('should register realtime listeners and emit board updates', () => {
    const boardDocUnsubscribe = vi.fn();
    const columnsUnsubscribe = vi.fn();
    const tasksUnsubscribe = vi.fn();

    firestoreMocks.onSnapshot
      .mockImplementationOnce((...args: unknown[]) => {
        const onNext = args.find((arg) => typeof arg === 'function');

        if (!onNext) {
          throw new Error('Board snapshot callback not found.');
        }

        (onNext as (snapshot: unknown) => void)({
          exists: () => true,
          data: () => ({ title: 'Kanban Board' }),
        } as unknown as DocumentSnapshot);

        return boardDocUnsubscribe;
      })
      .mockImplementationOnce((...args: unknown[]) => {
        const onNext = args.find((arg) => typeof arg === 'function');

        if (!onNext) {
          throw new Error('Columns snapshot callback not found.');
        }

        (onNext as (snapshot: unknown) => void)({
          docs: [
            {
              id: 'column-1',
              data: () => ({
                boardId: 'board-1',
                title: 'To Do',
                kind: 'todo',
                position: 0,
              }),
            },
          ],
        } as unknown as QuerySnapshot);

        return columnsUnsubscribe;
      })
      .mockImplementationOnce((...args: unknown[]) => {
        const onNext = args.find((arg) => typeof arg === 'function');

        if (!onNext) {
          throw new Error('Tasks snapshot callback not found.');
        }

        (onNext as (snapshot: unknown) => void)({
          docs: [
            {
              id: 'task-1',
              data: () => ({
                boardId: 'board-1',
                columnId: 'column-1',
                title: 'Task 1',
                description: 'Beschreibung 1',
                priority: 'medium',
                assignee: 'Matthias',
                position: 0,
                createdAt: '2026-01-01T00:00:00.000Z',
                updatedAt: '2026-01-01T00:00:00.000Z',
              }),
            },
          ],
        } as unknown as QuerySnapshot);

        return tasksUnsubscribe;
      });

    const service = new BoardQueryService();
    const next = vi.fn();
    const error = vi.fn();

    const unsubscribe = service.listenToKanbanBoard('board-1', { next, error });

    expect(next).toHaveBeenCalledWith({
      id: 'board-1',
      title: 'Kanban Board',
      columnOrder: ['column-1'],
      columns: {
        'column-1': {
          id: 'column-1',
          title: 'To Do',
          taskIds: ['task-1'],
        },
      },
      tasks: {
        'task-1': {
          id: 'task-1',
          title: 'Task 1',
          description: 'Beschreibung 1',
          priority: 'medium',
          assignee: 'Matthias',
          createdAt: '2026-01-01T00:00:00.000Z',
          updatedAt: '2026-01-01T00:00:00.000Z',
        },
      },
    });

    unsubscribe();

    expect(boardDocUnsubscribe).toHaveBeenCalledTimes(1);
    expect(columnsUnsubscribe).toHaveBeenCalledTimes(1);
    expect(tasksUnsubscribe).toHaveBeenCalledTimes(1);
  });
});
