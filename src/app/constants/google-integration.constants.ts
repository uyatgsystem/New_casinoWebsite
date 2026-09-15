export const GOOGLE_INTEGRATION_CONFIG = {
  oauth: {
    endpoint: 'https://accounts.google.com/o/oauth2/v2/auth',
    clientId:
      '671478595229-0ivjd1qurlffb2iql5tr1vprkpsnldit.apps.googleusercontent.com',
    responseType: 'id_token',
    scope: 'openid email profile',
    redirectPath: '/login',
  },
  analytics: {
    measurementId: 'G-TZ82X0Q91D',
  },
} as const;
