import { Component } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-on-boarding-steps',
  imports: [],
  templateUrl: './on-boarding-steps.component.html',
  styleUrl: './on-boarding-steps.component.scss'
})
export class OnBoardingStepsComponent {

  constructor(private router: Router) { }

  redirectToSignUp() {
    const token = localStorage.getItem('token');
    if (token) {
      this.router.navigate(['/dashboard/home']);
    } else {
      this.router.navigate(['/login']);
    }
  }

}
