import { Component, inject, signal } from '@angular/core';
import { AuthService } from '../../../../core/auth/auth.service';
import { Router } from '@angular/router';
import { form, FormField, required, email } from '@angular/forms/signals';

interface LoginModel {
  email: string;
  password: string;
}

@Component({
  selector: 'app-login-page',
  imports: [FormField],
  templateUrl: './login-page.html',
  styleUrl: './login-page.scss',
})
export class LoginPage {
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  protected readonly loginModel = signal<LoginModel>({
    email: 'demo@company.com',
    password: 'password123',
  });

  protected readonly loginForm = form(this.loginModel, (path) => {
    required(path.email, { message: 'Bitte gib eine E-Mail-Adresse ein.' });
    email(path.email, { message: 'Bitte gib eine gültige E-Mail-Adresse ein.' });
    required(path.password, { message: 'Bitte gib ein Passwort ein.' });
  });

  protected login(): void {
    const value = this.loginModel();

    if (!this.loginForm().valid()) {
      return;
    }

    this.authService.login(value.email, value.password);
    void this.router.navigateByUrl('/board');
  }
}
