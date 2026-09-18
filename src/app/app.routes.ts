import { Routes } from '@angular/router';
import { LandingPageComponent } from './pages/landing-page/landing-page.component';
import { DashboardComponent } from './dashboard/dashboard.component';
import { HomeComponent } from './pages/home/home.component';
import { SpinnerComponent } from './components/spinner/spinner.component';
import { AccountComponent } from './pages/account/account.component';
import { LoginComponent } from './pages/login/login.component';
import { dashBoardGuard } from './Guards/dash-board.guard';
import { authGuardGuard } from './Guards/auth-guard.guard';
import { WalletComponent } from './pages/wallet/wallet.component';
import { ForgotPasswordComponent } from './pages/forgot-password/forgot-password.component';
import { NewPasswordComponent } from './pages/new-password/new-password.component';
import { RedeemComponent } from './pages/redeem/redeem.component';
import { SignupComponent } from './pages/signup/signup.component';
import { CredentialsComponent } from './components/credentials/credentials.component';
import { ChangePasswordComponent } from './pages/change-password/change-password/change-password.component';
import { TermsAndConditionsComponent } from './pages/landing-page/terms-and-conditions/terms-and-conditions.component';
import { Guidelines } from './pages/GuideLines/Guidelines.component';
import { EditUserprofileComponent } from './pages/edit-userprofile/edit-userprofile.component';
import { ProfileComponent } from './pages/profile/profile.component';
import { VerificationEmailComponent } from './pages/verification-email/verification-email.component';
import { ForgotChangePasswordComponent } from './forgot-change-password/forgot-change-password.component';
import { WildCardRedirectComponent } from './wild-card-redirect/wild-card-redirect.component';
import { VerifyPaymentComponent } from './pages/verify-payment/verify-payment.component';
// import { LotteryTicketsComponent } from './pages/lottery-tickets/lottery-tickets.component';
// import { LotteryMainComponent } from './pages/lottery/lottery-main/lottery-main.component';
import { RefundComponent } from './pages/refund/refund.component';
import { LotteryListComponent } from './pages/Lottery-Module/lottery-list/lottery-list.component';
import { LotteryHistoryComponent } from './pages/Lottery-Module/lottery-history/lottery-history.component';
import { LotteryNumbersComponent } from './pages/Lottery-Module/lottery-numbers/lottery-numbers.component';
import { SectrechCardListComponent } from './dashboard/Sectrech Cards/sectrech-card-list/sectrech-card-list.component';
import { BuyNowComponent } from './dashboard/Sectrech Cards/buy-now/buy-now.component';
import { SpinnerNewDesignComponent } from './components/spinner-new-design/spinner-new-design.component';
import { SpinnerNewComponent } from './components/spinner-new/spinner-new.component';
import { KycFormComponent } from './pages/kyc-form/kyc-form.component';
import { VerifyPaymentTaptapComponent } from './pages/verify-payment-taptap/verify-payment-taptap.component';
import { NewGuideComponent } from './pages/landing-page/new-guide/new-guide.component';
export const routes: Routes = [
  {
    path: '',
    component: LandingPageComponent,
  },
  {
    path: 'ForgotPassword',
    component: ForgotPasswordComponent,
  },
  {
    path: 'reset-pass',
    component: ForgotChangePasswordComponent,
  },
  {
    path: 'new',
    component: NewPasswordComponent,
  },
  {
    path: 'SignUp',
    component: SignupComponent,
  },
  {
    path: 'VerifyEmail',
    component: VerificationEmailComponent,
  },
  {
    path: 'Help',
    component: TermsAndConditionsComponent,
  },
  {
    path: 'check',
    component: VerifyPaymentComponent,
  },
  { path: 'Terms&Condition', component: TermsAndConditionsComponent },
  {
    path: 'checkstatus', component: VerifyPaymentTaptapComponent
  },
  // { path: 'Refund&Cancellation', component: RefundComponent },

  {
    path: 'dashboard',
    component: DashboardComponent,
    canActivate: [dashBoardGuard, authGuardGuard],
    children: [
      { path: 'home', component: HomeComponent },
      { path: 'spinner', component: SpinnerComponent },
      // { path: 'spinner', component: SpinnerNewComponent },
      // { path: 'spinner', component: SpinnerNewDesignComponent },
      { path: 'account', component: AccountComponent },
      { path: 'wallet', component: WalletComponent },
      { path: 'redeem', component: RedeemComponent },
      { path: 'credentials', component: CredentialsComponent },
      { path: 'changePass', component: ChangePasswordComponent },
      { path: 'Terms&Conditions', component: TermsAndConditionsComponent },
      { path: 'GuideLines', component: Guidelines },
      { path: 'edit-profile', component: EditUserprofileComponent },
      { path: 'profile', component: ProfileComponent },
      { path: 'help-support', component: TermsAndConditionsComponent },
      {
        path: 'guides',
        component: NewGuideComponent,
      },
      {
        path: 'levels',
        loadComponent: () =>
          import('./pages/levels/levels.component').then(
            (m) => m.LevelsComponent
          ),
      },
      { path: 'lottery', component: LotteryListComponent },
      { path: 'lottery-number', component: LotteryNumbersComponent },
      { path: 'SectrechCards', component: SectrechCardListComponent },
      { path: 'TreasurePick', loadComponent: () => import('../app/games/component/TreasurePick/treasurepick.component').then(m => m.TreasurepickComponent) },
      { path: 'TreasurePick', loadComponent: () => import('../app/games/component/TreasurePick/treasurepick.component').then(m => m.TreasurepickComponent) },
      { path: 'Avaitar', loadComponent: () => import('../app/games/component/Avaitar/avaitar/avaitar.component').then(m => m.AvaitarComponent) },
      { path: 'Baccaret', loadComponent: () => import('../app/games/component/Baccaret/game-table/game-table.component').then(m => m.GameTableComponent) },
      { path: 'Roulette', loadComponent: () => import('../app/games/component/Roullet/game-layout/game-layout.component').then(m => m.GameLayoutComponent) },
      { path: 'Mines', loadComponent: () => import('../app/games/component/Mines/mines.component').then(m => m.MinesComponent) },
      { path: 'Double', loadComponent: () => import('../app/games/component/double/double.component').then(m => m.DoubleComponent) },
      { path: 'Plinko', loadComponent: () => import('../app/games/component/Plinko/plinko.component').then(m => m.PlinkoComponent) },
      // {path: 'StackBuilder', loadComponent: () => import('../app/games/component/stack-builder/stack-builder.component').then(m => m.StackBuilderComponent) },
      { path: 'Keno', loadComponent: () => import('../app/games/component/keno/keno.component').then(m => m.KenoComponent) },
      // { path: 'buy-now/:cardData', component: BuyNowComponent },
      { path: 'KYCform', component: KycFormComponent },
      { path: 'complete-profile', loadComponent: () => import('./pages/profile/complete-profile/complete-profile.component').then(m => m.CompleteProfileComponent) },
       { path: 'coin', loadComponent: () => import('../app/games/component/coin/coin.component').then(m => m.CoinFlipComponent) },
     


      {
        path: 'buy-now/:cardData',
        loadComponent: () =>
          import('./dashboard/Sectrech Cards/buy-now/buy-now.component').then(
            (m) => m.BuyNowComponent
          ),
        data: { renderMode: 'client' }, // disables prerendering for this route
      },

      {
        path: 'lottery-history',
        loadComponent: () =>
          import(
            './pages/Lottery-Module/lottery-history/lottery-history.component'
          ).then((m) => m.LotteryHistoryComponent),
      },
    ],
  },
  {
    path: 'login',
    component: LoginComponent,
  },

  {
    path: '**',
    component: WildCardRedirectComponent,
  },
];
