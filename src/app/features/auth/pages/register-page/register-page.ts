import { Component, computed, inject, signal } from '@angular/core';
import { email, form, FormField, minLength, required } from '@angular/forms/signals';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../data-access/auth.service';
import { RegisterFormModel } from '../../models/auth.models';

@Component({
  selector: 'app-register-page',
  imports: [FormField, RouterLink],
  templateUrl: './register-page.html',
  styleUrl: './register-page.scss',
})
export class RegisterPage {
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  protected readonly isSubmitting = signal(false);
  protected readonly authError = signal<string | null>(null);

  protected readonly formModel = signal<RegisterFormModel>({
    email: '',
    password: '',
    confirmPassword: '',
  });

  protected readonly registerForm = form(this.formModel, (path) => {
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

    required(path.confirmPassword, {
      message: 'Bitte bestätige dein Passwort.',
    });
    minLength(path.confirmPassword, 6, {
      message: 'Die Passwortbestätigung muss mindestens 6 Zeichen lang sein.',
    });
  });

  protected readonly emailErrors = computed(() => this.registerForm.email().errors());
  protected readonly passwordErrors = computed(() => this.registerForm.password().errors());
  protected readonly confirmPasswordErrors = computed(() =>
    this.registerForm.confirmPassword().errors(),
  );

  protected readonly passwordsDoNotMatch = computed(() => {
    const value = this.formModel();

    if (!this.registerForm.confirmPassword().touched()) {
      return false;
    }

    return value.password.trim() !== value.confirmPassword.trim();
  });

  protected async submit(event: Event): Promise<void> {
    event.preventDefault();

    this.authError.set(null);

    if (!this.registerForm().valid()) {
      this.registerForm().markAsTouched();
      return;
    }

    if (this.passwordsDoNotMatch()) {
      return;
    }

    this.isSubmitting.set(true);

    try {
      const value = this.formModel();
      await this.authService.register(value.email, value.password);
      await this.router.navigateByUrl('/board');
    } catch {
      this.authError.set('Registrierung fehlgeschlagen. Bitte versuche es erneut.');
    } finally {
      this.isSubmitting.set(false);
    }
  }
}
