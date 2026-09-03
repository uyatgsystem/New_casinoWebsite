import { Injectable } from '@angular/core';
declare var Square: any;
@Injectable({
  providedIn: 'root'
})
export class SquareUpService {

  constructor() { }
    payments: any;

  async initPayments(applicationId: string, locationId: string) {
    if (!Square) {
      throw new Error('Square Web Payments SDK not loaded.');
    }
    this.payments = Square.payments(applicationId, locationId);
    return this.payments;
  }

  async createCard(payments: any, elementId: string) {
    const card = await payments.card();
    await card.attach(`#${elementId}`);
    return card;
  }

  async createCashApp(payments: any, elementId: string) {
    const cashAppPay = await payments.cashAppPay({
      redirectURL: window.location.href,
      referenceId: 'user-123', // optional tracking ID
    });
    await cashAppPay.attach(`#${elementId}`);
    return cashAppPay;
  }
}
