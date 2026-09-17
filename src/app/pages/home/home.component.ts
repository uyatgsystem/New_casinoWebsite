import { Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ChatComponent } from '../../components/chat/chat.component';
import { GameCard } from '../../Interfaces/interfaces';
import { Router, RouterModule } from '@angular/router';
import { ApiCallService } from '../../Services/api-call-service.service';
import { ToastrService } from 'ngx-toastr';
import { GameService } from '../../Services/game.service';
import {
  FormBuilder,
  FormGroup,
  FormsModule,
  NgModel,
  Validators,
} from '@angular/forms';
import { ReactiveFormsModule } from '@angular/forms';
import { ErrorhandlingService } from '../../Services/error-handling.service';
import { CarouselModule, OwlOptions } from 'ngx-owl-carousel-o';

import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faEye, faEyeSlash, faXmark } from '@fortawesome/free-solid-svg-icons';
import { LoaderService } from '../../Services/loader-service.service';
import { NgxSkeletonLoaderModule } from 'ngx-skeleton-loader';
import { BreakpointObserver, Breakpoints } from '@angular/cdk/layout';
import { UtilsService } from '../../Services/utils.service';
import { Subject, takeUntil } from 'rxjs';
import { LotteryListComponent } from '../Lottery-Module/lottery-list/lottery-list.component';
import { GamesLandingComponent } from '../landing-page/games-landing/games-landing.component';
import { CasinoLandingComponent } from '../landing-page/casino-landing/casino-landing.component';
import { FeaturedCardsComponent } from './featured-cards/featured-cards.component';
import { SectrechCardListComponent } from "../../dashboard/Sectrech Cards/sectrech-card-list/sectrech-card-list.component";

@Component({
  selector: 'app-home',
  imports: [
    CommonModule,
    RouterModule,
    CarouselModule,
    FontAwesomeModule,
    FormsModule,
    NgxSkeletonLoaderModule,
    GamesLandingComponent,
    CasinoLandingComponent
],
  templateUrl: './home.component.html',
  styleUrl: './home.component.scss',
})
export class HomeComponent implements OnInit, OnDestroy {
  constructor(
    private router: Router,
  ) {
  }

  ngOnInit(): void {

  }
  ngOnDestroy() {
  }


  RedirectToSpinner() {
    this.router.navigate(['/dashboard/spinner']);
  }


}
