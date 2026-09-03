// filepath: src/app/components/loader/loader.component.ts
import { Component, OnInit } from '@angular/core';
import { NgxSpinnerService,NgxSpinnerModule } from 'ngx-spinner';

@Component({
  selector: 'app-loader',
  standalone: true,
  imports:[NgxSpinnerModule],
  templateUrl: './loader.component.html',
  styleUrls: ['./loader.component.scss']
})
export class LoaderComponent implements OnInit {
  constructor(private spinner: NgxSpinnerService) {}

  ngOnInit() {
    // this.spinner.show();
  }
}