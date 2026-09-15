import { Component } from '@angular/core';
import { CommonModule, Location } from '@angular/common';
@Component({
  selector: 'app-refund',
  imports: [CommonModule],
  templateUrl: './refund.component.html',
  styleUrl: './refund.component.scss'
})
export class RefundComponent {
    constructor(private location: Location) { }
  CloseModal() {
    this.location.back();
  }
}
