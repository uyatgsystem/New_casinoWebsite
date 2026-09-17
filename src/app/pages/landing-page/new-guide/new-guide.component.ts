import { Component } from '@angular/core';
import { CommonModule, Location } from '@angular/common';
import { Router } from '@angular/router';

@Component({
  selector: 'app-new-guide',
  imports: [CommonModule],
  templateUrl: './new-guide.component.html',
  styleUrl: './new-guide.component.scss'
})
export class NewGuideComponent {

  constructor(
    private location: Location,
    private router: Router,
  ) { }

  goBack() {
    if (window.history.length > 1) {
      this.location.back();
    } else {
      this.router.navigate(['/']); // home page
    }
  }

  navigateTo(path: string) {
    this.router.navigate([path]);
  }
}
