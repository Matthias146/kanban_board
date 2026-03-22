import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { DocumentReference } from 'firebase/firestore';
import { BoardSeedService } from './board-seed.service';

const firestoreMocks = vi.hoisted(() => {
  return {
    addDoc: vi.fn(),
    collection: vi.fn(),
  };
});

vi.mock('firebase/firestore', () => {
  return {
    addDoc: firestoreMocks.addDoc,
    collection: firestoreMocks.collection,
  };
});

vi.mock('../../../core/firebase/firebase.client', () => {
  return {
    db: { mocked: true },
  };
});

describe('BoardSeedService', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    firestoreMocks.collection.mockReturnValue({ mocked: true });

    firestoreMocks.addDoc
      .mockResolvedValueOnce({ id: 'board-123' } as DocumentReference)
      .mockResolvedValueOnce({ id: 'todo-column-1' } as DocumentReference)
      .mockResolvedValueOnce({ id: 'in-progress-column-1' } as DocumentReference)
      .mockResolvedValue({} as DocumentReference);
  });

  it('should create an initial board for a user and return the board id', async () => {
    const service = new BoardSeedService();

    const result = await service.createInitialBoardForUser('user-1');

    expect(result).toBe('board-123');
    expect(firestoreMocks.addDoc).toHaveBeenCalledTimes(7);
  });

  it('should create board document with owner id', async () => {
    const service = new BoardSeedService();

    await service.createInitialBoardForUser('user-1');

    expect(firestoreMocks.addDoc).toHaveBeenNthCalledWith(
      1,
      expect.anything(),
      expect.objectContaining({
        title: 'Kanban Board',
        ownerId: 'user-1',
        createdAt: expect.any(String),
      }),
    );
  });

  it('should create default columns for the board', async () => {
    const service = new BoardSeedService();

    await service.createInitialBoardForUser('user-1');

    expect(firestoreMocks.addDoc).toHaveBeenNthCalledWith(
      2,
      expect.anything(),
      expect.objectContaining({
        boardId: 'board-123',
        title: 'To Do',
        kind: 'todo',
        position: 0,
      }),
    );

    expect(firestoreMocks.addDoc).toHaveBeenNthCalledWith(
      3,
      expect.anything(),
      expect.objectContaining({
        boardId: 'board-123',
        title: 'In Progress',
        kind: 'in_progress',
        position: 1,
      }),
    );

    expect(firestoreMocks.addDoc).toHaveBeenNthCalledWith(
      4,
      expect.anything(),
      expect.objectContaining({
        boardId: 'board-123',
        title: 'Done',
        kind: 'done',
        position: 2,
      }),
    );
  });

  it('should create starter tasks for the board', async () => {
    const service = new BoardSeedService();

    await service.createInitialBoardForUser('user-1');

    expect(firestoreMocks.addDoc).toHaveBeenNthCalledWith(
      5,
      expect.anything(),
      expect.objectContaining({
        boardId: 'board-123',
        columnId: 'todo-column-1',
        title: 'Login UI umsetzen',
        priority: 'medium',
        assignee: 'Matthias',
        position: 0,
        createdAt: expect.any(String),
        updatedAt: expect.any(String),
      }),
    );

    expect(firestoreMocks.addDoc).toHaveBeenNthCalledWith(
      6,
      expect.anything(),
      expect.objectContaining({
        boardId: 'board-123',
        columnId: 'todo-column-1',
        title: 'Board Layout vorbereiten',
        priority: 'high',
        assignee: 'Matthias',
        position: 1,
        createdAt: expect.any(String),
        updatedAt: expect.any(String),
      }),
    );

    expect(firestoreMocks.addDoc).toHaveBeenNthCalledWith(
      7,
      expect.anything(),
      expect.objectContaining({
        boardId: 'board-123',
        columnId: 'in-progress-column-1',
        title: 'Drag and Drop integrieren',
        priority: 'medium',
        assignee: 'Matthias',
        position: 0,
        createdAt: expect.any(String),
        updatedAt: expect.any(String),
      }),
    );
  });
});
