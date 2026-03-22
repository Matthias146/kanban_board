import { Component, inject } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-imprint-page',
  imports: [],
  templateUrl: './imprint-page.html',
  styleUrl: './imprint-page.scss',
})
export class ImprintPage {
  private readonly router = inject(Router);

  protected async goBack(): Promise<void> {
    await this.router.navigateByUrl('/');
  }
}
