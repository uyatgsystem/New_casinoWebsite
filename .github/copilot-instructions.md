# AI Agent Instructions for Casino Maxs Frontend

## Project Overview

This is a **social casino Angular application** with SSR support, featuring game management, lottery systems, wallet functionality, and real-time chat. The project uses Angular 19 with standalone components and is structured as a single-page application with multiple gaming modules.

## Architecture & Key Patterns

### Service Layer Architecture

- **`ApiCallService`**: Central HTTP service with token management and environment switching
  - Use `PostCallWithToken()` for authenticated requests, `PostCallWithoutToken()` for public endpoints
  - Environment URLs are commented/uncommented in service (Dev: 44396, Staging: 44348, Live: 44363)
- **`LoaderService`**: Global spinner management with ngx-spinner integration
- **`UtilsService`**: Cross-component communication via EventEmitters and localStorage management with SSR checks
- **`ErrorhandlingService`**: Centralized error handling for API responses

### Component Patterns

- **Standalone Components**: All components use `standalone: true` with explicit imports
- **Service Injection**: Always inject `ApiCallService` in component providers array, not root
- **Component Structure**: Follow `pages/` (route components) vs `components/` (reusable) distinction

### Authentication & Guards

- **Token-based auth**: JWT stored in localStorage with SSR platform checks (`isPlatformBrowser`)
- **Guards**: `authGuardGuard` and `dashBoardGuard` handle route protection
- Always check platform before localStorage access: `if (isPlatformBrowser(this.platformId))`

## Game-Specific Features

### Game Management

- **Game Images**: Use `getGameImage()` pattern to map game names to image paths in `public/Images/game/`
- **Game Types**: Core games include GoldenTreasure, MilkyWay, OrionStar, PandaMaster, UltraPanda, Yolo
- **Score System**: Games have redemption requests with scores tracked via `GameRedeem/RedeemScore` endpoint

### Lottery Module

- **Structure**: `pages/Lottery-Module/` contains lottery-list, lottery-history, lottery-numbers
- **Data Flow**: Use `UtilsService.setLotteryData()` / `clearData()` for inter-component lottery data sharing

### Scratch Cards

- **Location**: `dashboard/Sectrech Cards/` with buy-now functionality
- **Assets**: Scratch card images in `public/scratchcard/` and `public/Images/scratchCards/`

## Critical Development Workflows

### Environment Management

```typescript
// Switch environments by commenting/uncommenting in ApiCallService
private baseRoute = 'https://154.38.171.150:44396/api/'; // Current Dev
// private baseRoute = 'https://209.145.48.167:44348/api/'; // Staging
// private baseRoute = 'https://209.145.48.167:44363/api/'; // Live
```

### API Integration Pattern

```typescript
// Standard component API pattern
constructor(private apiCallService: ApiCallService, private loaderService: LoaderService) {}

makeRequest() {
  this.loaderService.show();
  const payload = { /* your data */ };
  this.apiCallService.PostCallWithToken(payload, 'endpoint').subscribe({
    next: (response) => {
      if (response.responseCode === 200) {
        // Handle success
      } else {
        this.ErrorHandle.handleResponseError(response);
      }
    },
    error: (error) => this.apiCallService.handleError(error)
  });
}
```

### SSR Considerations

- Always use `UtilsService.setItem()` / `getItem()` instead of direct localStorage
- Inject `PLATFORM_ID` and check `isPlatformBrowser()` before browser-specific operations
- SSR config in `angular.json` uses `src/main.server.ts` and `src/server.ts`

## Asset Organization

- **Public Assets**: All in `public/` directory, reference as `/Images/...` in templates
- **Game Assets**: `/Images/game/` for game icons and banners
- **UI Assets**: `/Images/` for general UI elements, icons, backgrounds
- **Audio**: `/Audio/` for sound effects (bell.wav, music.mp3)

## State Management Patterns

- **Cross-component Events**: Use UtilsService EventEmitters (e.g., `triggerWalletFunction()`, `triggerChatReadFunction()`)
- **Local Storage**: Managed through UtilsService with SSR safety
- **Loading States**: Centralized through LoaderService with ngx-spinner

## Testing & Build Commands

```bash
npm start              # Development server
npm run build          # Production build
npm test               # Unit tests with Karma
npm run serve:ssr:Social_casino  # SSR server
```

## Common Gotchas

- **Component Imports**: Must explicitly import CommonModule, FormsModule in standalone components
- **FontAwesome**: Use `@fortawesome/angular-fontawesome` with explicit icon imports
- **Styling**: SCSS with Tailwind integration, use CSS variables like `var(--background)`
- **Routes**: Game-related routes use camelCase (e.g., 'ForgotPassword', not 'forgot-password')
- **API Responses**: Always check `response.responseCode === 200` not HTTP status codes

## Key File Locations

- **Routes**: `src/app/app.routes.ts` - main routing configuration
- **Services**: `src/app/Services/` - all business logic services
- **Interfaces**: `src/app/Interfaces/interfaces.ts` - TypeScript interfaces
- **Guards**: `src/app/Guards/` - route protection logic
- **Components**: `src/app/components/` vs `src/app/pages/` distinction
