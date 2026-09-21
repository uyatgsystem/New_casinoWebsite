import { RenderMode, ServerRoute } from '@angular/ssr';

export const serverRoutes: ServerRoute[] = [
  {
    path: '**',
    renderMode: RenderMode.Client
  },
  {
    path: 'dashboard/buy-now/:cardData',
    renderMode: RenderMode.Server
  }
];
