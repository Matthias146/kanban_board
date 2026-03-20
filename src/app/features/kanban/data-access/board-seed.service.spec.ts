import { TestBed } from '@angular/core/testing';

import { BoardSeedService } from './board-seed.service';

describe('BoardSeedService', () => {
  let service: BoardSeedService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(BoardSeedService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
