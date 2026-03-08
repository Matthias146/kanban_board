import { Component, inject } from '@angular/core';
import { BoardStore } from '../../data-access/board.store';

@Component({
  selector: 'app-board-page',
  imports: [],
  templateUrl: './board-page.html',
  styleUrl: './board-page.scss',
})
export class BoardPage {
  protected readonly boardStore = inject(BoardStore);
}
