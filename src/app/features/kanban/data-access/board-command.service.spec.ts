import { TestBed } from '@angular/core/testing';

import { BoardCommandService } from './board-command.service';

describe('BoardCommandService', () => {
  let service: BoardCommandService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(BoardCommandService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
