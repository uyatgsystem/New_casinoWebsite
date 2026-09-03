import { Component } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-join-community',
  imports: [],
  templateUrl: './join-community.component.html',
  styleUrl: './join-community.component.scss'
})
export class JoinCommunityComponent {


  constructor(
    private router: Router,
  ) { }
  RedirectToLogin(): void {
    this.router.navigate(['/login']);
  }
}
