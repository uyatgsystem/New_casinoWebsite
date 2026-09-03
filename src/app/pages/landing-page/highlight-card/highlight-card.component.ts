import { Component } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-highlight-card',
  imports: [],
  templateUrl: './highlight-card.component.html',
  styleUrl: './highlight-card.component.scss',
})
export class HighlightCardComponent {
  constructor(private router: Router) {}

  redirectToLogin() {
    this.router.navigate(['login']);
  }
}
