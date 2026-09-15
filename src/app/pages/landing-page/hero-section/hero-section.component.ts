import { Component } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-hero-section',
  imports: [],
  templateUrl: './hero-section.component.html',
  styleUrl: './hero-section.component.scss'
})
export class HeroSectionComponent {

  constructor(
    private router: Router,) { }

  RedirectToLogin(): void {
    this.router.navigate(['/login']);
  }

  RedirectToSignUp(): void {
    this.router.navigate(['/SignUp']);
  }
}
