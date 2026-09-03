import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class AuthorizeNetService {

  constructor() { }

  //   getPaymentNonce(cardData: any, authData: any): Promise<any> {
  //
  //   return new Promise((resolve, reject) => {

  //          if (!(window as any).Accept) {
  //       console.error('Authorize.Net Accept.js library not loaded.');
  //       // return;
  //     }
  //     (window as any).Accept.dispatchData(
  //       {
  //         authData,  // from your .NET backend: clientKey + apiLoginID
  //         cardData,  // card number, exp, CVV
  //       },
  //       (response: any) => {
  //         if (response.messages.resultCode === 'Error') {
  //           reject(response.messages.message[0].text);
  //         } else {
  //           resolve(response.opaqueData);
  //           console.log('Payment nonce (opaqueData):', response.opaqueData);
  //         }
  //       }
  //     );
  //   });
  // }
}
