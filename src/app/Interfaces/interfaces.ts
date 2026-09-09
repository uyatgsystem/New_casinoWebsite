export interface GameAccount {
  id: number;
  GameName: string;
  PlayerName: string;
  PlayerPassword: string;
  iconUrl: string;
  isPasswordVisible: boolean;
  isUsernameVisible: boolean;
}
export interface Message {
  text: string;
  isUser: boolean;
  timestamp: Date;
}
export interface PaymentResponse {
  status: 'success' | 'error';
  balance: number;
  source: string;
  type: string;
}
export interface ComingMessage {
  UserId: number;
  SenderId: number;
  Message: string;
  MessageType: string;
  IsEngaged: boolean;
  MessageFrom: string;
  ImageBase64: string;
  ImageUrl: string;
  timestamp: Date;
}

export interface UserReceive {
  AgentId: number;
  UserId: number;
  SenderId: number;
  Message: string;
  SenderName: string;
  MessageType: string;
  IsEngaged: boolean;
  MessageFrom: string;
  ImageUrl: string;
  ImageBase64: string;
  Time: Date;
  IsRead: boolean;
  AddedBy: string;
  Token: string;
  Type: string;
  IsDelivered: boolean;
  IsSeen: boolean;
  message_id: number;
}
export interface GameCardInterface {
  Id: number;
  Name: string;
  RequestAmount: number;
  AddedDate: Date;
  StatusDescription: 'Approved' | 'Pending' | 'Declined';
  StatusReason: string;
}

import { IconProp } from '@fortawesome/fontawesome-svg-core';

export interface SpinnerSegment {
  id: string; // unique per wedge
  prize: string; // display label (e.g. '$5' or 'Free Spin')
  icon: string; // Font Awesome icon reference
}
export interface GameCard {
  id: number;
  name: string;
  image: string;
  provider: string;
  offer: number;
}
export interface Transaction {
  creditBalance: string;
  creditTime: string;
  source: string;
  type: 'credit' | 'debit';
  netPaidAmount?: string;
  beforebalance?: string;
  afterbalance?: string;
  beforeBonusBalance?: string;
  afterBonusBalance?: string;
  playerlevel?: string;
  typesofRequest?: string;
}
export interface CreateUser {
  userID: string;
  clientId: number;
  firstName: string;
  lastName: string;
  username: string;
  isTempPassword: boolean;
  email: string;
  password: string;
  role: string;
  contactNumber: string;
  isMobileUser: boolean;
  panelType: string;
  refferCode: string;
  ad?:string;
   DeviceId: string;
   deviceFingerprint: string;
}
export interface LoginUser {
  username: string;
  userPassword: string;
  fcm: string;
  deviceUId: string;
}
export interface Slide {
  id: Number;
  uniqueId?: string;
  src: string;
  heading: string;
  content: string;
}
export interface VerificationState {
  status: 'loading' | 'success' | 'error';
  progress: number;
  message: string;
  image: string;
}

//interfaces for user manuals
export interface GuideStep {
  imageUrl?: string; // required
  imageUrlSm?: string;
  imageUrlLg?: string;
  title?: string;
  description?: string;
  alt?: string;
}
export interface UserManualOptions {
  title: string; // modal header title
  closable: boolean; // show close button / allow ESC
  dismissOnBackdrop: boolean;
  showThumbnails: boolean;
}

export interface DefaultUserManualOptions {
  title: 'Quick Guide';
  closable: true;
  dismissOnBackdrop: true;
  showThumbnails: true;
}

export interface UserManualState {
  open: boolean;
  steps: GuideStep[];
  startIndex: number;
  options: UserManualOptions;
}
