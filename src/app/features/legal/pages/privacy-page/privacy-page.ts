import { Component, inject } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-privacy-page',
  imports: [],
  templateUrl: './privacy-page.html',
  styleUrl: './privacy-page.scss',
})
export class PrivacyPage {
  private readonly router = inject(Router);

  protected async goBack(): Promise<void> {
    await this.router.navigateByUrl('/');
  }
}
