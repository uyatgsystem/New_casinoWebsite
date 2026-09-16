import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { SafeHtml } from '@angular/platform-browser';
import { UtilsService } from '../../../Services/utils.service';

@Component({
  selector: 'app-about-us',
  imports: [CommonModule],
  templateUrl: './about-us.component.html',
  styleUrl: './about-us.component.scss',
})
export class AboutUsComponent {
  stats = [
    { value: '12k+', label: 'Total players' },
    { value: '300+', label: 'Total games' },
  ];

  whyChooseUs = [
    { icon: 'fas fa-gem', text: 'Premium gaming experience' },
    { icon: 'fas fa-layer-group', text: 'Smooth, intuitive interface' },
    { icon: 'fas fa-gauge-high', text: 'Fast, lag-free navigation' },
    { icon: 'fas fa-lock', text: 'Secure account & wallet' },
    { icon: 'fas fa-mobile-screen-button', text: 'Fully mobile responsive' },
    { icon: 'fas fa-dice', text: 'Exciting game selection' },
  ];
  grainBackdrop: SafeHtml = '';
  constructor(
    private utils: UtilsService,
    private router: Router,
  ) {
    this.grainBackdrop = this.utils.getGrainBackdrop();
  }

  RedirectToSignUp(): void {
    this.router.navigate(['/SignUp']);
  }
}
