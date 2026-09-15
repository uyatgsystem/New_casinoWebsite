import { Injectable } from '@angular/core';
import { CreateUser, LoginUser } from '../Interfaces/interfaces';
// import { CreateUser, LoginUser } from '../interfaces/interfaces';

@Injectable({
  providedIn: 'root'
})
export class ApiPayloadService {

  createCreateUserPayload(data: Partial<CreateUser>): CreateUser {
    const addCode = sessionStorage.getItem('adCode');
    return {
      userID: data.userID || '0',
      clientId: data.clientId || 12,
      firstName: data.firstName || '',
      lastName: data.lastName || '',
      username: data.username || '',
      isTempPassword: data.isTempPassword || false,
      email: data.email || '',
      password: data.password || '',
      role: 'customer',
      contactNumber: data.contactNumber || '',
      isMobileUser: true,
      panelType: 'customer',
      refferCode: data.refferCode || (data as any).referralCode || '',
      ad:addCode|| '',
        DeviceId: data.DeviceId || '' ,
        deviceFingerprint: data.deviceFingerprint ||''
    };
  }

  createLoginUserPayload(data: Partial<LoginUser>): LoginUser {
    return {
      username: data.username || '',
      userPassword: data.userPassword || '',
      fcm: data.fcm || '',
      deviceUId: data.deviceUId || ''
    };
  }
}
