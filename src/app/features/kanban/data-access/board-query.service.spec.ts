import { TestBed } from '@angular/core/testing';

import { BoardQueryService } from './board-query.service';

describe('BoardQueryService', () => {
  let service: BoardQueryService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(BoardQueryService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
