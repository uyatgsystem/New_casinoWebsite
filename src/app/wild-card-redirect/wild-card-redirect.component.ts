import { Component } from '@angular/core';
import { UtilsService } from '../Services/utils.service';

@Component({
  selector: 'app-wild-card-redirect',
  imports: [],
  templateUrl: './wild-card-redirect.component.html',
  styleUrl: './wild-card-redirect.component.scss'
})
export class WildCardRedirectComponent {

  constructor(private _utils: UtilsService) { }

  ngOnInit() {
    this._utils.redirectToRoute();
  }
}
