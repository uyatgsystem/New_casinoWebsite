// filepath: /H:/WordSense Projects/Social-casino_frontend/src/app/app.config.ts
import { ApplicationConfig, provideZoneChangeDetection, importProvidersFrom } from '@angular/core';
import { provideRouter } from '@angular/router';

import { routes } from './app.routes';
import { provideClientHydration, withEventReplay, withHttpTransferCacheOptions } from '@angular/platform-browser';
import { provideHttpClient, withFetch, withInterceptors, HttpTransferCacheOptions } from '@angular/common/http';
import { provideToastr } from 'ngx-toastr';
import { NgxSpinnerModule } from "ngx-spinner";
import { TranslateModule } from '@ngx-translate/core';
import { clockDriftRetryInterceptor } from './Services/clock-drift-retry.interceptor';

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes),
    provideClientHydration(withHttpTransferCacheOptions({
      includePostRequests: true
    })),
    provideHttpClient(withFetch(), withInterceptors([clockDriftRetryInterceptor])), provideToastr({}),
    importProvidersFrom(NgxSpinnerModule.forRoot({ type: 'ball-clip-rotate-multiple' })),
    importProvidersFrom(TranslateModule.forRoot({
      defaultLanguage: 'en'
    }))
  ]
};
