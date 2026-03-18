import { Component, computed, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { form, FormField, required, email, minLength } from '@angular/forms/signals';
import { AuthService } from '../../data-access/auth.service';
import { LoginFormModel } from '../../models/auth.models';

@Component({
  selector: 'app-login-page',
  imports: [FormField, RouterLink],
  templateUrl: './login-page.html',
  styleUrl: './login-page.scss',
})
export class LoginPage {
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  protected readonly isSubmitting = signal(false);
  protected readonly authError = signal<string | null>(null);

  protected readonly formModel = signal<LoginFormModel>({
    email: '',
    password: '',
  });

  protected readonly loginForm = form(this.formModel, (path) => {
    required(path.email, {
      message: 'Bitte gib eine E-Mail-Adresse ein.',
    });
    email(path.email, {
      message: 'Bitte gib eine gültige E-Mail-Adresse ein.',
    });

    required(path.password, {
      message: 'Bitte gib ein Passwort ein.',
    });
    minLength(path.password, 6, {
      message: 'Das Passwort muss mindestens 6 Zeichen lang sein.',
    });
  });

  protected readonly emailErrors = computed(() => this.loginForm.email().errors());
  protected readonly passwordErrors = computed(() => this.loginForm.password().errors());

  protected async submit(event: Event): Promise<void> {
    event.preventDefault();

    this.authError.set(null);

    if (!this.loginForm().valid()) {
      this.loginForm().markAsTouched();
      return;
    }

    this.isSubmitting.set(true);

    try {
      const value = this.formModel();
      await this.authService.login(value.email, value.password);
      await this.router.navigateByUrl('/board');
    } catch {
      this.authError.set('Login fehlgeschlagen. Bitte prüfe deine Eingaben.');
    } finally {
      this.isSubmitting.set(false);
    }
  }

  protected async loginAsGuest(): Promise<void> {
    this.authError.set(null);
    this.isSubmitting.set(true);

    try {
      await this.authService.loginAsGuest();
      await this.router.navigateByUrl('/board');
    } catch {
      this.authError.set('Gast-Login fehlgeschlagen. Bitte versuche es erneut.');
    } finally {
      this.isSubmitting.set(false);
    }
  }
}
