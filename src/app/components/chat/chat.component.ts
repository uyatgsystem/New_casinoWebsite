import { ApiPayloadService } from './../../Services/api-payload-service.service';
import {
  Component,
  CUSTOM_ELEMENTS_SCHEMA,
  ElementRef,
  HostListener,
  inject,
  OnDestroy,
  OnInit,
  ViewChild,
} from '@angular/core';
import {
  faDownload,
  faMinus,
  faExpand,
  faTimes,
  faPlus,
  faPaperPlane,
  faCheckDouble,
  faCheck,
} from '@fortawesome/free-solid-svg-icons';

import { NgModule } from '@angular/core';

import { BrowserModule, SafeHtml } from '@angular/platform-browser';
import { CommonModule } from '@angular/common';

import { FormsModule } from '@angular/forms';
import {
  ComingMessage,
  Message,
  UserReceive,
} from '../../Interfaces/interfaces';
import { ApiCallService } from '../../Services/api-call-service.service';
import { response } from 'express';
import { WebSocketService } from '../../Services/web-socket.service';
import { ToastrService } from 'ngx-toastr';
import { LoaderService } from '../../Services/loader-service.service';
import { Subject, takeUntil } from 'rxjs';
import { GameService } from '../../Services/game.service';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { MusicService } from '../../Services/music.service';
import { UtilsService } from '../../Services/utils.service';
@Component({
  selector: 'app-chat',
  standalone: true,
  providers: [ApiCallService],
  templateUrl: './chat.component.html',
  styleUrls: ['./chat.component.scss'],
  imports: [CommonModule, FormsModule, FontAwesomeModule],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class ChatComponent implements OnInit, OnDestroy {
  @ViewChild('videoElement', { static: false }) videoElement!: ElementRef;
  @ViewChild('camera') cameraElement!: ElementRef;
  @ViewChild('canvasElement', { static: false }) canvasElement!: ElementRef;
  capturedImage: string | null = null;
  showPreview: boolean = false;
  IsEngaged: boolean = false;

  private _apiCall = inject(ApiCallService);

  isCameraOpen = false;
  videoStream: MediaStream | null = null;
  @ViewChild('imageModal') imageModal!: ElementRef;
  selectedImageUrl: string | null = null;
  backdropImage: SafeHtml = '';
  constructor(
    private _websocketService: WebSocketService,
    private toastr: ToastrService,
    private elRef: ElementRef,
    private loaderService: LoaderService,
    private gameService: GameService,
    private musicService: MusicService,
    private _utilsService: UtilsService,
  ) {
    this.backdropImage = this._utilsService?.getGrainBackdrop();
  }
  Download = faDownload;
  Minimize = faMinus;
  Maximize = faExpand;
  Close = faTimes;
  Plus = faPlus;
  PaperPlane = faPaperPlane;
  CheckDouble = faCheckDouble;
  Check = faCheck;
  messages: UserReceive[] = [];
  private destroy$ = new Subject<void>();
  loading: boolean = false;
  ngOnInit(): void {
    this.handleIncomingMsg();
    this.MessageHistory();
    this.sendSeenMessage();
    this._websocketService
      .getTriggerChatHistoryObservable()
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.MessageHistory();
      });

    // if (window.visualViewport) {
    //   window.visualViewport.addEventListener('resize', () => {
    //     const viewportHeight = window.visualViewport?.height || 0;
    //     const screenHeight = window.innerHeight;

    //     // If the viewport height is near full screen → keyboard closed
    //     if (viewportHeight > screenHeight * 0.9) {
    //       this.isInputFocused = false;
    //     }
    //   });
    // }
  }
  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // @HostListener('wheel', ['$event'])
  // onMouseWheel(event: WheelEvent) {
  //   event.preventDefault();
  // }

  // @HostListener('touchmove', ['$event'])
  // onTouchMove(event: TouchEvent) {
  //   event.preventDefault();
  // }

  // Or a more targeted approach in the chat-messages div:
  onChatScroll(event: WheelEvent | TouchEvent) {
    const element = event.target as HTMLElement;
    const isAtTop = element.scrollTop === 0;
    const isAtBottom =
      element.scrollHeight - element.scrollTop === element.clientHeight;

    // Only prevent default if we're at the boundaries
    if (
      (event instanceof WheelEvent && event.deltaY < 0 && isAtTop) ||
      (event instanceof WheelEvent && event.deltaY > 0 && isAtBottom)
    ) {
      event.preventDefault();
    }
  }

  getAllChat() {
    const payload = {
      pageNumber: 1,
      pageSize: 10,
    };
    this._apiCall
      .PostCallWithToken(payload, 'messages/GetSupportChatApp')
      .subscribe((response) => {
        if (response.responseCode === 200) {
          this._utilsService.triggerChatReadFunction();
          this.messages = response.data;
        } else {
          this._apiCall.handleError(response);
        }
      });
  }

  newMessage: string = '';
  stream: MediaStream | null = null;

  openCamera() {
    this.isCameraOpen = true;
    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
      navigator.mediaDevices
        .getUserMedia({ video: true })
        .then((stream) => {
          this.videoStream = stream;
          this.isCameraOpen = true;
          this.videoElement.nativeElement.srcObject = stream;
        })
        .catch((error) => {
          // console.error('Error opening camera', error);
        });
    } else {
      // console.error('Camera API not supported');
    }
  }
  closeCamera() {
    if (this.videoStream) {
      this.videoStream.getTracks().forEach((track) => track.stop());
    }
    this.isCameraOpen = false;
  }
  capturePicture() {
    const video = this.videoElement.nativeElement;
    const canvas = this.canvasElement.nativeElement;
    const context = canvas.getContext('2d');

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    context.drawImage(video, 0, 0, canvas.width, canvas.height);

    this.capturedImage = canvas.toDataURL('image/png');
    this.showPreview = true;
    this.base64 = this.capturedImage || undefined;
    // console.log('Picture captured:', this.capturedImage);
  }

  retakePhoto() {
    this.capturedImage = null;
    this.showPreview = false;
  }

  ////////////// Open Gallery

  showOptionsMenu = false;
  quickTopics = [
    { label: 'Deposit Help', icon: '💳', text: 'Hello, I have a question regarding my deposit.' },
    { label: 'Cashout Status', icon: '⚡', text: 'Hi, can you check the status of my withdrawal request?' },
    { label: 'VIP Bonus', icon: '🎁', text: 'Hi, I would like to inquire about my VIP bonus rewards.' },
    { label: 'Gameplay', icon: '🎮', text: 'Hello, I need assistance with a game session.' },
  ];

  selectQuickTopic(text: string): void {
    this.newMessage = text;
    this.sendMessage(null);
  }

  toggleOptionsMenu() {
    this.showOptionsMenu = !this.showOptionsMenu;
  }

  ////////// Handle Image file selection

  triggerFileInput(fileInput: HTMLInputElement) {
    fileInput.click();
  }

  clearSelection() {
    this.imageURL = '';
    this.base64 = '';
  }

  base64?: string | null;
  imageURL?: string;

  onFileSelected(event: Event) {
    // this.clearSelection();
    const input = event.target as HTMLInputElement;

    if (input?.files?.length) {
      const selectedFile = input.files[0];

      // Generate Image base64
      const reader = new FileReader();
      reader.onload = () => {
        this.base64 = reader.result as string;
        // console.log('Base64:', this.base64);
      };
      reader.readAsDataURL(selectedFile);

      // Generate Image URL
      this.imageURL = URL.createObjectURL(selectedFile);
      // console.log('Image URL:', this.imageURL);
    }
    if (this.imageURL) {
      this.showOptionsMenu = false;
    }
  }

  getBase64(): string | undefined {
    return this.base64 ?? undefined;
  }

  imageurl: any;

  UploadMessageImage() {
    this.loading = true;
    const payload = { base64: this.getBase64() };

    this._apiCall.PostCallWithToken(payload, 'messages/uploadImage').subscribe(
      (response: any) => {
        this.imageurl = response.data;
        this.sendMessagePayload.Message = this.newMessage;
        this.sendMessagePayload.ImageUrl = this.imageurl;
        this._websocketService.sendMessage(this.sendMessagePayload);
        this.newMessage = '';
        this.imageurl = '';
        this.loading = false;
      },
      (error: any) => {
        this.loading = false;
        // console.log('Image upload failed:', error);
      },
    );
  }

  ///////////// Send User Messge

  sendMessage(event: Event | null): void {
    if (
      this.sendMessagePayload.SenderName &&
      this.sendMessagePayload.SenderName != ''
    ) {
      if (event) {
        event.preventDefault();
      }
      const base64Value = this.getBase64();
      this.sendMessagePayload.message_id = Math.floor(
        100000000 + Math.random() * 900000000,
      );
      if (base64Value) {
        this.UploadMessageImage();
      } else if (
        this.newMessage &&
        this.newMessage.trim() &&
        this.newMessage != ''
      ) {
        this.sendMessagePayload.Message = this.newMessage.replace(/\n*$/, '');

        if (this.sendMessagePayload.MessageType == 'peer_to_peer') {
          this.sendMessagePayload.IsSeen = true;
        }
        this.sendMessagePayload.ImageUrl = '';
        // if (this.sendMessagePayload.Message != '') {
        //   this.messages.push(this.sendMessagePayload);
        // }
        this._websocketService.sendMessage(this.sendMessagePayload);
        this.newMessage = '';
        this.scrollToBottom();
      }

      //? Reset the height of the textarea
      const textarea = document.querySelector(
        'textarea',
      ) as HTMLTextAreaElement;
      if (textarea) {
        // console.log('Resetting textarea height');
        textarea.style.height = 'auto';
        textarea.style.height = '44px';
      }
      this._utilsService.triggerChatReadFunction();
      this.clearSelection();
    } else {
      // this.loaderService.triggerFunction();
      this.toastr.info(
        'Error while sending message. Try refresh or re-login the app',
        'Message',
      );
    }
  }

  // Add this method to handle the keydown event
  onTextareaKeydown(event: KeyboardEvent): void {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      this.sendMessage(event);
    }
  }
  messageSeenPayload: any = {
    UserId: this.swapSendingId || 0,
    SenderId: this.getUserId(),
    SenderName: this.getUserName(),
    AddedBy: localStorage.getItem('email'),
    Token: localStorage.getItem('token'),
    IsSeen: true,
    Message: null,
    MessageFrom: 'Customer',
    MessageType: this.IsMessageType ? 'peer_to_peer' : 'Agent',
  };
  sendSeenMessage() {
    // this.sendMessagePayload.IsSeen = true;
    // this.messageSeenPayload.isSeen = true;
    this._websocketService.sendMessage(this.messageSeenPayload);
    // this.newMessage = '';
  }

  getUserRole(): string | null {
    return localStorage.getItem('userType');
  }
  getUserId(): string {
    return localStorage.getItem('userId') || '';
  }
  getUserName(): string {
    return localStorage.getItem('userName') || '';
  }
  sendMessagePayload: any = {
    UserId: this.swapSendingId || '',
    SenderId: this.getUserId(),
    SenderName: this.getUserName(),
    Message: '',
    MessageType: this.IsMessageType === true ? 'peer_to_peer' : 'Agent',

    IsEngaged: this.IsEngaged,
    MessageFrom: 'Customer',
    // MessageFrom: this.getUserRole() == 'Admin' ? 'Agent' : 'customer',
    ImageUrl: '',
    AddedBy: localStorage.getItem('email'),
    Token: localStorage.getItem('token'),
    IsSeen: false,
    message_id: 0, // Generate a random 9-digit integer
    Time: new Date().toISOString(),
  };

  ///////////////// Receive Chat from Agent

  IsMessageType?: boolean = false;
  swapSendingId?: string;
  // handleIncomingMsg() {
  //   this._websocketService.invokeMessages.subscribe((message: any) => {
  //     if (message.MessageFrom != 'Customer') {

  //       if (message.Message) {
  //         this.musicService.playBell();
  //         this.toastr.info(message.Message, 'New Message');
  //       }
  //     }
  //     if (message && message.Message != null) {
  //       const existingMessageIndex = this.messages.findIndex(
  //         (msg) => msg.message_id === message.message_id
  //       );

  //       if (existingMessageIndex !== -1) {

  //         this.messages[existingMessageIndex].IsSeen = message.IsSeen;
  //         this.messages[existingMessageIndex].IsDelivered = message.IsDelivered;
  //       } else {

  //         this.messages.push(message);
  //       }

  //       this.scrollToBottom();
  //       if (message.ImageUrl) {
  //         this.getMesggImage(message.ImageUrl);
  //       }
  //       if (
  //         message.MessageFrom != 'Customer' &&
  //         message.MessageType != 'UnEngaged'
  //       ) {
  //         if (message.AgentId && message.AgentId > 0) {
  //           this.swapSendingId = message.AgentId;
  //         } else {
  //           this.swapSendingId = message.SenderId;
  //         }
  //         this.IsMessageType = 'peer_to_peer';
  //         this.sendMessagePayload.UserId = this.swapSendingId;
  //         this.sendMessagePayload.MessageType = this.IsMessageType;
  //       } else if (message.MessageType == 'UnEngaged') {
  //         this.swapSendingId = 0;
  //         this.IsMessageType = 'Agent';
  //         this.sendMessagePayload.UserId = this.swapSendingId;
  //         this.sendMessagePayload.MessageType = this.IsMessageType;
  //       }
  //     } else if (
  //       message &&
  //       message.Message == null &&
  //       message.IsSeen &&
  //       message.IsDelivered
  //     ) {
  //       this.messages.forEach((data) => {
  //         data.IsSeen = true;
  //       });
  //     }
  //   });
  // }

  handleIncomingMsg() {
    this._websocketService.invokeMessages.subscribe((message: any) => {
      if (message.MessageFrom != 'Customer') {
        /// incoming message toaster
        if (message.Message) {
          this.musicService.playBell();
          this.toastr.info(message.Message, 'New Message');
          // this._utilsService.triggerChatUnReadCountFunction();
        }
      }
      if (message && message.Message != null) {
        const existingMessageIndex = this.messages.findIndex(
          (msg) => msg.message_id === message.message_id,
        );

        if (existingMessageIndex !== -1) {
          // If the message exists, update its IsSeen property
          this.messages[existingMessageIndex].IsSeen = message.IsSeen;
          this.messages[existingMessageIndex].IsDelivered = message.IsDelivered;
        } else {
          // If the message does not exist, add it to the array
          this.messages.push(message);
        }

        this.scrollToBottom();
        if (message.ImageUrl) {
          this.getMesggImage(message.ImageUrl);
        }

        if (
          message.MessageFrom != 'Customer' &&
          message.MessageType != 'UnEngaged'
        ) {
          if (message.AgentId != '00000000-0000-0000-0000-000000000000') {
            this.swapSendingId = message.AgentId;
          } else {
            this.swapSendingId = message.SenderId;
          }
          this.IsMessageType = true;
          this.sendMessagePayload.UserId = this.swapSendingId;
          this.sendMessagePayload.MessageType = 'peer_to_peer';
        }
      } else if (
        message &&
        message.Message == null &&
        message.IsSeen &&
        message.IsDelivered
      ) {
        this.messages.forEach((data) => {
          data.IsSeen = true;
        });
      }
      if (
        message.MessageType == 'UnEngaged' ||
        message.MessageType == 'Agent_UnEngaged'
      ) {
        this.swapSendingId = '';
        this.IsMessageType = false;
        this.sendMessagePayload.UserId = this.swapSendingId;
        this.sendMessagePayload.MessageType = 'Agent';
      }
    });
  }

  //// Api call for Get Image
  Image64: any;
  getMesggImage(imageUrl: string) {
    const payload = 'messages/DownloadImage?filename=' + imageUrl;
    this._apiCall.GetCallWithToken(payload).subscribe((response) => {
      if (response && response.responseCode === 200) {
        const imageBase64 = response.data.base64String;
        this.messages.forEach((message) => {
          // Update only the message with the matching ImageUrl
          if (message.ImageUrl === imageUrl) {
            message.ImageUrl = imageBase64;
          }
        });
      } else if (response && response.responseCode === 400) {
        // console.log('Data fetch failed', response);
      }
    });
  }
  onPaste(event: ClipboardEvent): void {
    const clipboardData = event.clipboardData;

    if (clipboardData) {
      const items = clipboardData.items;

      for (const item of items) {
        if (item.type.startsWith('image/')) {
          const file = item.getAsFile();
          if (file) {
            const reader = new FileReader();

            reader.onload = (e: any) => {
              this.base64 = reader.result as string;
              const base64Image = e.target.result; // Base64 image string
              // this.imageurl = base64Image
              // You can use this base64 string to show the image or upload it
            };

            reader.readAsDataURL(file);
            this.imageURL = URL.createObjectURL(file);
          }
        }
      }

      if (this.imageURL) {
        this.showOptionsMenu = false;
      }
    }
  }
  ////////////////Api Call for get History messages
  pageNumber: number = 1;

  MessageHistoryPayload: any = {
    pageNumber: this.pageNumber || 1,
    pageSize: 10,
    searchText: '',
    startDate: '',
    serialNumber: 1,
    isExport: false,
    endDate: '',
    orderBy: '',
  };

  MessageHistory() {
    this.loading = true;
    const payload = this.MessageHistoryPayload;
    this._apiCall
      .PostCallWithToken(payload, 'messages/GetSupportChatApp')
      .subscribe(
        (response: any) => {
          this._utilsService.triggerChatReadFunction();

          if (this.messages.length > 0) {
            if (response.data.length > 0) {
              this.messages = [...response.data.reverse(), ...this.messages];
              response.data.forEach((message: any) => {
                if (message.ImageUrl !== '' && message.ImageUrl !== null) {
                  this.getMesggImage(message.ImageUrl);
                }
              });
            } else {
              this.toastr.info('No more conversation history found', 'Info');
              this.loading = false;
              return;
            }
          } else {
            this.messages = response.data.reverse();
            this.scrollToBottom();
            response.data.forEach((message: any) => {
              if (message.ImageUrl !== '' && message.ImageUrl !== null) {
                this.getMesggImage(message.ImageUrl);
              }
            });
          }
          this.MessageHistoryPayload.pageNumber++;
        },
        (error: any) => {
          // console.log(' failed:', error);
        },
      )
      .add(() => {
        this.loading = false;
      });
  }

  /////// function to scroll to top button

  isUserScrolledUp: boolean = false;

  onScroll(event: any): void {
    const chatListElement =
      this.elRef.nativeElement.querySelector('.chat-body');
    // Check if chatListElement is not null
    if (chatListElement && chatListElement.scrollTop === 0) {
      // Call onScrollUp when scrolled to the top
      this.onScrollUp(this.messages[0].SenderId); // Changed to first message
    } else if (chatListElement) {
      const isAtBottom =
        chatListElement.scrollHeight - chatListElement.scrollTop ===
        chatListElement.clientHeight;
      const isLastCustomerMsg = this.messages[this.messages.length - 1];
      if (isAtBottom && isLastCustomerMsg.SenderId != this.getUserId()) {
        this.sendSeenMessage();
      }
    }
  }

  onScrollUp(customerId: string): void {
    this.MessageHistory();
  }
  // function for scroll to bottom
  scrollToBottom(): void {
    try {
      setTimeout(() => {
        this.chatBody.nativeElement.scrollTop =
          this.chatBody?.nativeElement?.scrollHeight;
        // this.webSocketService.sendMessage(this.isReadPayload);
      }, 100);
    } catch (err) {
      // console.error('Scroll to bottom failed:', err);
    }
  }
  @ViewChild('chatBody') chatBody!: ElementRef;

  showHideChat() {
    // this._utilsService.showComponentSubject.next(false);
    // this._utilsService.showComponentSubject.closed = false;
    this._utilsService.toggleComponentVisibility(false);
    this._utilsService.triggerChatReadFunction();
    // this.gameService.triggerFunction();
  }

  adjustHeight(event: Event) {
    const textarea = event.target as HTMLTextAreaElement;

    // Reset height to auto to get accurate scrollHeight
    textarea.style.height = 'auto';

    const lineHeight = 24; // Approximate line height in pixels
    const padding = 24; // Total vertical padding (12px top + 12px bottom)
    const minHeight = 48; // Minimum height (1 line)

    // Calculate the number of lines based on scrollHeight
    const contentHeight = textarea.scrollHeight - padding;
    const lines = Math.ceil(contentHeight / lineHeight);

    if (lines <= 1) {
      // 1 line: minimum height, no scroll
      textarea.style.height = `${minHeight}px`;
      textarea.style.overflowY = 'hidden';
    } else if (lines === 2) {
      // 2 lines: grow to fit, no scroll
      textarea.style.height = `${minHeight + lineHeight}px`;
      textarea.style.overflowY = 'hidden';
    } else if (lines === 3) {
      // 3 lines: grow to fit, no scroll
      textarea.style.height = `${minHeight + lineHeight * 2}px`;
      textarea.style.overflowY = 'hidden';
    } else {
      // 4+ lines: fixed at 3-line height, show scroll
      textarea.style.height = `${minHeight + lineHeight * 2}px`;
      textarea.style.overflowY = 'auto';
    }
  }
  openImageModal(imageUrl: string): void {
    this.selectedImageUrl = imageUrl;
    this.imageModal.nativeElement.style.display = 'flex';
  }

  closeImageModal(): void {
    this.selectedImageUrl = null;
    this.imageModal.nativeElement.style.display = 'none';
  }
  isInputFocused = false;

  onInputFocus() {
    if (window.innerWidth <= 768) {
      this.isInputFocused = true;
      this.scrollToBottom();
    }
  }

  onInputBlur() {
    this.isInputFocused = false;
  }
}
