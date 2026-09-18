// filepath: src/app/services/loader.service.ts
import { EventEmitter, Injectable } from '@angular/core';
import { NgxSpinnerService } from 'ngx-spinner';

@Injectable({
  providedIn: 'root',
})
export class LoaderService {
  constructor(private spinner: NgxSpinnerService) { }

  show() {
    this.spinner.show();
  }

  hide() {
    this.spinner.hide();
  }
  //   Funtion call service use
  private triggerSubject = new EventEmitter<void>();

  triggerFunction() {
    this.triggerSubject.emit();
  }

  getTriggerObservable() {
    return this.triggerSubject.asObservable();
  }

  //   Funtion call service use
  private triggerWalletSubject = new EventEmitter<void>();

  triggerWalletFunction() {
    this.triggerWalletSubject.emit();
  }

  getTriggerWalletObservable() {
    return this.triggerWalletSubject.asObservable();
  }

  getCustomerID(): number {
    if (typeof localStorage === 'undefined') return 0;
    return Number(localStorage.getItem('customerId')?.length);
  }
  setArrayInLocalStorage(locale: string, data: any[]) {
    if (typeof localStorage === 'undefined') return;
    localStorage.setItem(locale, JSON.stringify(data));
  }
  getArrayInLocalStorage(locale: string = 'bis_data'): any[] {
    if (typeof localStorage === 'undefined') return [];
    return JSON.parse(localStorage.getItem(locale) || '[]');
  }
}
