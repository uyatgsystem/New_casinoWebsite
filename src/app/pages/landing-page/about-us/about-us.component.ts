import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
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
    { value: '1.6k+', label: 'Our Daily Users' },
    { value: '25+', label: 'Games' },
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
  constructor(private utils: UtilsService) {
    this.grainBackdrop = this.utils.getGrainBackdrop();
  }
}
