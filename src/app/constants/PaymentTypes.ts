// export interface PaymentType {
//   ApiName: string;
//   bg_image: string;
//   name: string;
// }
// export const paymentTypes: Record<string, PaymentType> = {
//   CashApp1: {
//     ApiName: 'square,cashapp',
//     bg_image: 'https://cmax-2.pages.dev/assets/payments/cashapp.png',
//     name: 'CashApp1',
//   },
//   Square: {
//     ApiName: 'square,card',
//     bg_image: 'https://cmax-2.pages.dev/assets/payments/master.png',
//     name: 'Card',
//   },
//   Chime: {
//     ApiName: 'Chime',
//     bg_image: 'https://cmax-2.pages.dev/assets/payments/chime.png',
//     name: 'Chime',
//   },
//   Zelle: {
//     ApiName: 'Zelle',
//     bg_image: 'https://cmax-2.pages.dev/assets/payments/zelle.png',
//     name: 'Zelle',
//   },
//   Paypal: {
//     ApiName: 'Paypal',
//     bg_image: 'https://cmax-2.pages.dev/assets/payments/paypal.svg',
//     name: 'Paypal',
//   },
//   Venmo: {
//     ApiName: 'Venmo',
//     bg_image: '/venmo-logo.png',
//     name: 'Venmo',
//   },

//   GooglePay: {
//     ApiName: 'GooglePay',
//     bg_image: 'https://cmax-2.pages.dev/assets/payments/google-pay.webp',
//     name: 'GooglePay',
//   },
//   ApplePay: {
//     ApiName: 'ApplePay',
//     bg_image: '/apple-logo.png',
//     name: 'ApplePay',
//   },
//   CashApp2: {
//     ApiName: 'TapTap,CashApp',
//     bg_image: 'https://cmax-2.pages.dev/assets/payments/cashapp.png',
//     name: 'CashApp2',
//   },
//   TapTapCard: {
//     ApiName: 'CashTap',
//     bg_image: 'https://cmax-2.pages.dev/assets/payments/taptap-card.png',
//     name: 'Card2',
//   },
// };


export interface PaymentType {
  ApiName: string;
  bg_image: string;
  name: string;
}

export const paymentTypes: Record<string, PaymentType> = {
  Stripe: {
    ApiName: 'Stripe',
    bg_image: 'https://cmaxv2images2.pages.dev/assets/icons/payments/cashapp.png',
    name: 'CashApp',
  },
  AuthorizeNet: {
    ApiName: 'AuthorizeNet',
    bg_image: 'https://cmaxv2images2.pages.dev/assets/icons/payments/master.png',
    name: 'Card',
  },
  Chime: {
    ApiName: 'Chime',
    bg_image: 'https://cmaxv2images2.pages.dev/assets/icons/payments/chime.png',
    name: 'Chime',
  },
  Zelle: {
    ApiName: 'Zelle',
    bg_image: 'https://cmaxv2images2.pages.dev/assets/icons/payments/zelle.png',
    name: 'Zelle',
  },
  Paypal: {
    ApiName: 'Paypal',
    bg_image: 'https://cmaxv2images2.pages.dev/assets/icons/payments/paypal.svg',
    name: 'Paypal',
  },
  Venmo: {
    ApiName: 'Venmo',
    bg_image: '/venmo.png',
    name: 'Venmo',
  },
  GooglePay: {
    ApiName: 'GooglePay',
    bg_image: 'https://cmax-2.pages.dev/assets/payments/google-pay.webp',
    name: 'GooglePay',
  },
  ApplePay: {
    ApiName: 'ApplePay',
    bg_image: '/apple-logo.png',
    name: 'ApplePay',
  },
  CashApp2: {
    ApiName: 'TapTap,CashApp',
    bg_image: 'https://cmax-2.pages.dev/assets/payments/cashapp.png',
    name: 'CashApp2',
  },
  TapTapCard: {
    ApiName: 'CashTap',
    bg_image: 'https://cmax-2.pages.dev/assets/payments/taptap-card.png',
    name: 'Card2',
  },
};
