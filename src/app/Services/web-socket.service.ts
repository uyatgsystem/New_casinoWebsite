import { EventEmitter, Injectable } from '@angular/core';
import { Observable, Subject, Subscription } from 'rxjs';
import { SocketService } from './socket-service.service';
import { UtilsService } from './utils.service';
import { ToastrService } from 'ngx-toastr';
import { CookieService } from 'ngx-cookie-service';
import { Router } from '@angular/router';
import { NotificationService } from './notification.service';
import { Inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { ErrorhandlingService } from './error-handling.service';
@Injectable({
  providedIn: 'root',
})
export class WebSocketService {
  private messagesSubscription: Subscription | null = null;
  private socket!: WebSocket;
  private messagesSubject: Subject<any> = new Subject<any>();
  private connectionStatusSubject: Subject<boolean> = new Subject<boolean>();
  public isConnected: boolean = false;
  private reconnectAttempts: number = 0;
  private maxReconnectAttempts: number = 5;
  public invokeMessages = new EventEmitter<any>();
  public invokeMiniChatMessages = new EventEmitter<any>();
  public invokeAddPlayerMessage = new EventEmitter<any>();
  public invokeAddRedeemMessage = new EventEmitter<any>();
  public invokeGameState = new EventEmitter<any>();

  private channel!: BroadcastChannel;
  private openTabs: string[] = [];

  constructor(
    private socketDataService: SocketService,
    private _utilService: UtilsService,
    private toastr: ToastrService,
    private cookieService: CookieService,
    private _router: Router,
    private notificationservice: NotificationService,
    private errorhandilingService: ErrorhandlingService,
    @Inject(PLATFORM_ID) private platformId: Object,
  ) {
    if (isPlatformBrowser(this.platformId)) {
      this.channel = new BroadcastChannel('tab-tracker');
      this.registerTab();
      this.listenForUpdates();
      window.addEventListener('beforeunload', () => this.removeClosedTab());
    }
  }

  public async connect(): Promise<void> {
    // Check if there's an existing WebSocket connection and close it
    if (this.socket && this.socket.readyState === WebSocket.OPEN) {
      // console.log('WebSocket connection already open');
      return; // Exit if connection is already open
    }

    // Close the existing WebSocket if it's not in a ready state (OPEN)
    if (this.socket) {
      this.socket.close();
    }

    // Retrieve token and create a new WebSocket connection

    const token = localStorage.getItem('token');

    // Dev Url

    // Live Url
    const url = `wss://154.38.161.3:44301/api/chat?token=${token}`;


    this.socket = new WebSocket(url);
    this.socket.binaryType = 'arraybuffer'; // Set binary type to handle large binary data

    this.socket.onopen = () => {
      this.isConnected = true;
      this.reconnectAttempts = 0;
      this.connectionStatusSubject.next(true);
      // console.log('WebSocket connection established');

      // Start sending ping messages
      this.startPing();
    };

    this.socket.onmessage = async (event) => {
      try {
        // Wait for the asynchronous message processing
        await this.handleMessage(event);
      } catch (e) {
        // console.error('Error processing message:', e);
      }
    };

    this.socket.onerror = (event) => {
      // console.error('WebSocket error:', event);
      this.messagesSubject.error(event);
    };

    this.socket.onclose = (event) => {
      this.isConnected = false;
      this.connectionStatusSubject.next(false);
      if (event.wasClean) {
        // console.log(
        //   `Connection closed cleanly, code=${event.code} reason=${event.reason}`
        // );
      } else {
        // console.error('Connection died');
        this.reconnect(); // Attempt to reconnect
      }
    };
  }

  messege: any = 'You have been logged into another place';

  public async handleMessage(event: MessageEvent): Promise<void> {
    try {
      if (event.data instanceof ArrayBuffer) {
        const arrayBuffer = event.data;

        // Handle empty ArrayBuffer
        if (arrayBuffer.byteLength === 0) {
          this.startPongTimeout();
          return;
        }
        return;
      }

      const users = this.socketDataService.getContactList();
      const messageData = JSON.parse(event.data);
      const miniChatUser = this.findMatchingSender(users, messageData);
      // console.log('Received Message from WebSocket:', messageData);
      if (messageData?.Type === 'Login') {
        const verifyPaymentTabOpen = this.isVerifyPaymentTabOpen();
        if (!verifyPaymentTabOpen) {
          // Show a persistent error popup (autoCloseMs = 0) so user must acknowledge
          this.errorhandilingService.showAlert('error', this.messege, true, 0);

          // Trigger logout flow so header (and any dropdowns) close cleanly
          try {
            this._utilService.triggerLogoutFunction();
          } catch (e) {
            // swallow any errors here to avoid breaking message handling
          }
        }
      } else if (messageData?.type === 'GameState') {
        this.invokeGameState.emit(messageData.data);
      } else if (messageData?.Type == 'Wallet') {
        this._utilService.triggerWalletFunction();
        this.notificationservice.loadNotifications(true);
      } else if (
        messageData?.Type == 'Request' ||
        messageData?.Type == 'Deposit_Approval'
      ) {
        this._utilService.triggerScoreHistory();
        this._utilService.triggerWalletFunction();
        this.notificationservice.loadNotifications(true);
      } else if (messageData?.Type == 'Redeem_Approval') {
        this._utilService.triggerRedeemHistory();
        this.notificationservice.loadNotifications(true);
      } else if (messageData?.Type == 'Offer') {
        this._utilService.triggerOfferHistory();
        this.notificationservice.loadNotifications(true);
      } else if (messageData?.Type == 'Lottery') {
        this._utilService.triggerLotteryTicket();
        this.notificationservice.loadNotifications(true);
      } else if (messageData?.Type == 'LotteryHistory') {
        this._utilService.triggerLotteryHistoryTicket();
        this.notificationservice.loadNotifications(true);
      } else if (messageData?.Type == 'KYC_Request') {
        this._utilService.triggerKYCHeaders();
        this.notificationservice.loadNotifications(true);
        //console.log('Received Message from WebSocket:', messageData?.Type);
      } else if (
        messageData?.Type == 'Lottery_Anounced' ||
        messageData?.Type == 'Lottery_Freezed' ||
        messageData?.Type == 'Lottery_Created'
      ) {
        this._utilService.triggerLotteryTicket();
        this.notificationservice.loadNotifications(true);
      } else if (messageData?.Type == 'Deposit_Approval') {
        this.notificationservice.loadNotifications(true);
      } else {
        if (
          this._utilService?.showComponentSubject?.value === false &&
          messageData?.MessageFrom != 'Customer'
        ) {
          this._utilService.triggerChatUnReadCountFunction();
        }

        this.invokeMessages.emit(messageData);
      }
      // Emit the message data to the `invokeMessages` EventEmitter
    } catch (e) {
      this.toastr.warning('WebSocket message is not valid JSON:', event.data);
      // console.error('WebSocket message is not valid JSON:', event.data);
    }
  }

  get getLotteryDetails(): any | [] {
    const details = localStorage.getItem('LID');
    return details ? JSON.parse(details) : null;
  }

  private findMatchingSender(data: any[][], message: any) {
    // Loop through each subarray in the data
    for (const subArray of data) {
      // Check if the first object in the subarray has the same SenderId as the incoming message
      if (subArray.length > 0 && subArray[0].SenderId === message.SenderId) {
        return subArray[0]; // Return the matching object or user
      }
    }
    return null; // If no match found
  }

  private reconnect(): void {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      const reconnectInterval = Math.min(
        1000 * Math.pow(2, this.reconnectAttempts),
        30000,
      );
      setTimeout(() => {
        // console.log(
        //   `Attempting to reconnect (#${this.reconnectAttempts + 1})...`
        // );
        this.reconnectAttempts++;
        this.socket.close();
        this.connect(); // Attempt to reconnect
      }, reconnectInterval);
    } else {
      // console.error(
      //   'Max reconnect attempts reached. Could not reconnect to WebSocket.'
      // );
    }
  }

  // private startPing(): void {
  //     // Start sending ping every 5 seconds, only if the WebSocket is connected
  //     this.pingInterval = setInterval(() => {
  //         if (this.socket && this.socket.readyState === WebSocket.OPEN) {
  //             this.sendPing(); // Send ping
  //             this.startPongTimer(); // Start waiting for pong
  //         }
  //     }, 5000);
  // }

  // sendPing(): void {
  //     if (this.socket && this.socket.readyState === WebSocket.OPEN) {
  //         const pingMessage = new Uint8Array(0); // Empty binary data
  //         this.socket.send(pingMessage);
  //         console.log('Ping message sent.');
  //     }
  // }

  private pingTimer: any;
  private pongTimeoutTimer: any;

  // Start ping-pong communication
  private startPing(): void {
    this.pingTimer = setInterval(() => {
      // console.log('Sending Ping...');
      this.sendPing(); // Send a ping every 5 seconds
    }, 5000);
  }

  // Method to send a ping frame to the server
  private sendPing(): void {
    try {
      if (this.socket && this.socket.readyState === WebSocket.OPEN) {
        const pingMessage = new Uint8Array(0); // Empty message for ping
        this.socket.send(pingMessage);
        // console.log('Ping message sent to the server.');
        // this.startPongTimeout(); // Start waiting for pong after sending ping
      } else {
        // console.log('Socket is not open, cannot send ping.');
      }
    } catch (e) {
      // console.error('Exception occurred: ', e);
    }
  }

  // Start a timer to wait for pong, with a 10-second timeout
  private startPongTimeout(): void {
    // console.log('Pong  received.');
    if (this.pongTimeoutTimer) {
      clearTimeout(this.pongTimeoutTimer); // Cancel any previous pong timeout
    }
    this.pongTimeoutTimer = setTimeout(() => {
      // console.log('Pong timeout. No Pong received.');
      if (this.socket && this.socket.readyState === WebSocket.OPEN) {
        // console.log('Reconnecting due to missed Pong...');
        // this.close();
        this.connect();
      }
    }, 10000); // Wait for 10 seconds for a pong response
  }

  // sendMessage(message: any): void {
  //   if (this.isConnected) {
  //     try {
  //       const payload = JSON.stringify(message);
  //       this.socket.send(payload);
  //       console.log('Sent Message:', message);
  //     } catch (e) {
  //       console.error('Failed to send message', e);
  //     }
  //   } else {
  //     console.error('WebSocket is not connected.');
  //   }
  // }

  // private sendPing(message: any): void {
  //     if (this.isConnected) {
  //         this.socket.send(message);
  //         console.log('Sent Ping:', message);
  //     } else {
  //         console.error('WebSocket is not connected. Cannot send ping.');
  //     }
  // }
  sendMessage(message: any): void {
    const payload = JSON.stringify(message);
    if (this.socket.readyState === WebSocket.OPEN) {
      try {
        this.socket.send(payload);
        // console.log('Message sent:', message);
      } catch (error) {
        // console.error('Failed to send message:', error);
        this.handleSocketReconnection(message);
      }
    } else {
      // console.warn('WebSocket is not connected.');
      this.toastr.warning('Connection lost. Reconnecting...', 'Warning');
      this.handleSocketReconnection(message);
    }
  }
  private handleSocketReconnection(message: any): void {
    if (this.socket.readyState !== WebSocket.CLOSED) {
      this.socket.close(1000, 'Socket is closed');
    }

    this.connect();

    // Retry sending the message after reconnection
    const retryInterval = setInterval(() => {
      if (this.socket.readyState === WebSocket.OPEN) {
        try {
          const payload = JSON.stringify(message);
          this.socket.send(payload);
          // console.log('Message resent after reconnection:', message);
          this.toastr.success(
            'Connection reestablished. Message sent.',
            'Success',
          );
          clearInterval(retryInterval); // Stop the retry process
        } catch (error) {
          // console.error('Failed to resend message:', error);
        }
      }
    }, 1000); // Check every second if the WebSocket is ready
  }

  getMessages(): Observable<any> {
    return this.messagesSubject.asObservable();
  }

  getConnectionStatus(): Observable<boolean> {
    return this.connectionStatusSubject.asObservable();
  }

  close(): void {
    this.socket.close();
    clearInterval(this.pongTimeoutTimer);
    clearInterval(this.pingTimer);
    // console.log('WebSocket connection closed');
  }

  public unSubsScribe(): void {
    if (this.messagesSubscription) {
      this.messagesSubscription.unsubscribe();
    }
  }

  //   Funtion call service use
  private triggerSubject = new EventEmitter<void>();

  triggerChatHistory() {
    // Check if the function is already in the process of being triggered
    this.triggerSubject.emit();
  }

  getTriggerChatHistoryObservable() {
    return this.triggerSubject.asObservable();
  }

  // Register current tab and notify others
  private registerTab() {
    this.updateTabs();
    this.broadcastUpdate();
  }

  // Listen for updates from other tabs
  private listenForUpdates() {
    this.channel.onmessage = (event) => {
      if (event.data && event.data.type === 'tab-update') {
        this.openTabs = event.data.tabs;
      }
    };
  }

  // Update tab list and notify other tabs
  private updateTabs() {
    const currentPath = location.pathname;
    if (!this.openTabs.includes(currentPath)) {
      this.openTabs.push(currentPath);
    }
  }

  // Remove closed tab from list
  private removeClosedTab() {
    if (isPlatformBrowser(this.platformId)) {
      this.openTabs = this.openTabs.filter((url) => url !== location.pathname);
      this.broadcastUpdate();
    }
  }
  // Broadcast the updated tab list
  private broadcastUpdate() {
    this.channel.postMessage({ type: 'tab-update', tabs: this.openTabs });
  }

  // Check if any tab is on /VerifyPayment
  isVerifyPaymentTabOpen(): boolean {
    return this.openTabs.some(
      (path) =>
        path.startsWith('/VerifyPayment') ||
        path == '/' ||
        !path.startsWith('/dashboard') ||
        path == '/dashboard/wallet',
    );
  }
}
