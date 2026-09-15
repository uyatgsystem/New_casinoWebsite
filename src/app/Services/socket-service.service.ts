import { Injectable, EventEmitter } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

interface User {
  customerName: any;
  customerId: any;
  message: any;
  unreadCount: any;
}
interface messageCount {
  SenderUsers: any[];
  count: any;
}

interface Message {
  senderId: any;
  message: [];
  createdTime: any;
}

@Injectable({
  providedIn: 'root',
})
export class SocketService {
  public miniChatUsers = new Map<string, BehaviorSubject<User[]>>();
  public miniChatMessages = new Map<string, BehaviorSubject<Message[]>>();
  public miniChatActiveUser = new Map<string, BehaviorSubject<User[]>>();
  public activeUser = new BehaviorSubject<User>({
    customerName: '',
    customerId: '',
    message: '',
    unreadCount: 0,
  });
  private totalMessageCount = new BehaviorSubject<messageCount>({
    SenderUsers: [],
    count: 0,
  });
  private storageKey = 'messageBox';
  private storageEngagedMsgKey = 'EngagedContactList';
  private storageMsgBox = 'openMsgBox';
  private miniChatMsg = 'miniChatMsg';
  public totalMessageCount$ = this.totalMessageCount.asObservable();

  // BehaviorSubjects to hold and emit session data
  private messageBoxSubject = new BehaviorSubject<any[]>(this.loadMessages());
  private engagedContactListSubject = new BehaviorSubject<any[]>(this.loadContactList());
  private openMessageBoxSubject = new BehaviorSubject<any[]>(this.loadMessageBox());
  private miniChatBoxSubject = new BehaviorSubject<any[]>(this.loadMiniChatBox());

  // Expose observables to components
  public messageBox$ = this.messageBoxSubject.asObservable();
  public engagedContactList$ = this.engagedContactListSubject.asObservable();
  public openMessageBox$ = this.openMessageBoxSubject.asObservable();
  public miniChatBox$ = this.miniChatBoxSubject.asObservable();

  public loadMiniChatMessages = new EventEmitter<any>();
  public loadMessageCountData = new EventEmitter<any>();

  constructor() { }

  //get the messsage count data
  getMessageCountData() {
    return this.totalMessageCount.getValue();
  }

  updateMessageCount(Data: any) {
    const updatedMessageCount: messageCount = {
      SenderUsers: Data.SenderUsers,
      count: Data.count,
    };
    this.totalMessageCount.next(updatedMessageCount);

    this.loadMessageCountData.emit();
  }

  //remove message count data
  removeMessageCount(SenderId: any) {
    const currentMessageCount = this.totalMessageCount.getValue();
    const updatedSenderUsers = currentMessageCount.SenderUsers.filter(
      (senderId: any) => senderId !== SenderId
    );
    const updatedMessageCount: messageCount = {
      SenderUsers: updatedSenderUsers,
      count: currentMessageCount.count - 1 > 0 ? currentMessageCount.count - 1 : 0,
    };
    this.totalMessageCount.next(updatedMessageCount);

    this.loadMessageCountData.emit();
  }

  getActiveUser() {
    return this.activeUser;
  }

  setActiveUser(user: User) {
    this.activeUser.next(user);
  }

  removeActiveUser() {
    this.activeUser.next({
      customerName: '',
      customerId: '',
      message: '',
      unreadCount: 0,
    });
  }

  // Add a message to the array and update session storage
  addMessage(message: any): void {
    const existingMessages = this.messageBoxSubject.value;
    if (existingMessages) {
      const messages = [message, ...existingMessages];
      this.messageBoxSubject.next(messages);
      this.saveMessages(messages);
    } else {
      this.messageBoxSubject.next([message]);
      this.saveMessages([message]);
    }
  }

  setMessages(messages: any[]): void {
    this.messageBoxSubject.next(messages);
    this.saveMessages(messages);
  }

  // Retrieve the message array (Optional since it's observable now)
  getMessages() {
    return this.messageBoxSubject.value;
  }

  removeMessage(senderId: number): void {
    const currentMessages = this.messageBoxSubject.getValue();
    const updatedMessages = currentMessages.filter(
      (message) => message.senderId !== senderId
    );
    this.messageBoxSubject.next(updatedMessages);
    this.saveMessages(updatedMessages);
  }

  // Save the current state of messageBox to sessionStorage
  private saveMessages(messages: any[]): void {
    if (typeof sessionStorage !== 'undefined') {
      sessionStorage.setItem(this.storageKey, JSON.stringify(messages));
    }
  }

  // Add to Contact List and update session storage
  addContactList(contactList: any): void {
    this.engagedContactListSubject.next(contactList);
    this.saveContactList(contactList);
  }

  getContactList() {
    return this.engagedContactListSubject.value;
  }

  private saveContactList(contactList: any[]): void {
    if (typeof sessionStorage !== 'undefined') {
      sessionStorage.setItem(this.storageEngagedMsgKey, JSON.stringify(contactList));
    }
  }

  // Add to Open Message Box and update session storage
  addMsgBox(msgBox: any): void {
    this.openMessageBoxSubject.next(msgBox);
    this.saveMsgBox(msgBox);
  }

  getMsgBox() {
    return this.openMessageBoxSubject.value;
  }

  private saveMsgBox(msgBox: any[]): void {
    if (typeof sessionStorage !== 'undefined') {
      sessionStorage.setItem(this.storageMsgBox, JSON.stringify(msgBox));
    }
  }

  removeMsgBox(): void {
    this.openMessageBoxSubject.next([]);
  }

  // Add to Mini Chat Box and update session storage
  addMiniChatBox(miniChatBox: any): void {
    this.miniChatBoxSubject.next(miniChatBox);
    this.saveMiniChatBox(miniChatBox);
  }

  getMiniChatBox() {
    return this.miniChatBoxSubject.value;
  }

  // removeMiniChat messages
  removeMiniChatData = (senderId: number): void => {
    const currentMiniChatBox = this.miniChatBoxSubject.getValue();
    const updatedMiniChatBox = currentMiniChatBox.filter(
      (messages) => messages.length > 0 && messages[0].senderId !== senderId
    );
    this.updateMiniChatBox(updatedMiniChatBox);
  };

  private saveMiniChatBox(miniChatBox: any[]): void {
    if (typeof sessionStorage !== 'undefined') {
      sessionStorage.setItem(this.miniChatMsg, JSON.stringify(miniChatBox));
    }
  }

  // Load methods for session data
  private loadMiniChatBox(): any[] {
    if (typeof sessionStorage !== 'undefined') {
      const storedMessages = sessionStorage.getItem(this.miniChatMsg);
      return storedMessages ? JSON.parse(storedMessages) : [];
    }
    return [];
  }

  private loadMessages(): any[] {
    if (typeof sessionStorage !== 'undefined') {
      const storedMessages = sessionStorage.getItem(this.storageKey);
      return storedMessages ? JSON.parse(storedMessages) : [];
    }
    return [];
  }

  private loadContactList(): any[] {
    if (typeof sessionStorage !== 'undefined') {
      const storedMessages = sessionStorage.getItem(this.storageEngagedMsgKey);
      return storedMessages ? JSON.parse(storedMessages) : [];
    }
    return [];
  }

  private loadMessageBox(): any[] {
    if (typeof sessionStorage !== 'undefined') {
      const storedMessages = sessionStorage.getItem(this.storageMsgBox);
      return storedMessages ? JSON.parse(storedMessages) : [];
    }
    return [];
  }

  // Method to update miniChatBox and notify subscribers
  updateMiniChatBox(newValue: any[][]): void {
    this.miniChatBoxSubject.next(newValue);
    this.saveMiniChatBox(newValue);
  }

  // Method to remove a specific array from miniChatMsg based on SenderId
  removeMsgBoxBySenderId(senderId: number): void {
    const currentMsgBox = this.miniChatBoxSubject.getValue();
    const updatedMsgBox = currentMsgBox.filter(
      (messages) => messages.length > 0 && messages[0].senderId !== senderId
    );
    this.updateMiniChatBox(updatedMsgBox);
  }
}