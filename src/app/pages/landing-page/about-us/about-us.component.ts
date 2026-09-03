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
  grainBackdrop: SafeHtml = '';
  constructor(private utils: UtilsService) {
    this.grainBackdrop = this.utils.getGrainBackdrop();
  }
}
