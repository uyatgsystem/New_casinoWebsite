import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-on-boarding-steps',
  imports: [CommonModule],
  templateUrl: './on-boarding-steps.component.html',
  styleUrl: './on-boarding-steps.component.scss'
})
export class OnBoardingStepsComponent {

  steps = [
    {
      number: 1,
      title: 'Create Your Account',
      description: 'Sign up in seconds with your details and verify your email.',
    },
    {
      number: 2,
      title: 'Fund Your Wallet',
      description: 'Add funds securely using your preferred payment method.',
    },
    {
      number: 3,
      title: 'Choose Your Game',
      description: 'Browse our exciting library and pick a game that suits you.',
    },
    {
      number: 4,
      title: 'Start Playing',
      description: 'Spin, play, and chase rewards with every session.',
    },
  ];

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
