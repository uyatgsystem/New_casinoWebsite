export interface KycFormModel {
    id?: string;
    customerId: string;
    firstName: string;
    middleName: string;
    lastName: string;
    dateOfBirth: string;
    nationality: string;
    country: string;
    city: string;
    state: string;
    zipcode: string;
    address: string;
    residentialAddress: string;
    ssin: string;
    documentType: string;
    documentNumber: string;
    documentExpiryDate: string;
    documentFrontImagePath?: string;
    documentBackImagePath?: string;
    selfieImagePath?: string;
    status?: string;
    reason?: string;
}

export interface KycApiRequest {
    customerId: string;
    firstName: string;
    middleName: string;
    lastName: string;
    dateOfBirth: string;
    nationality: string;
    country: string;
    city: string;
    state: string;
    zipcode: string;
    address: string;
    residentialAddress: string;
    ssin: string;
    documentType: string;
    documentNumber: string;
    documentExpiryDate: string;
    documentFrontImage: File;
    documentBackImage: File;
    selfieImage: File;
    reason?: string;
}

export interface KycApiResponse {
    responseCode: number;
    responseMessage: string;
    data?: any;
}

export const DocumentTypes = [
    { value: 'NationalID', label: 'National ID' },
    { value: 'Passport', label: 'Passport' },
    { value: 'DrivingLicense', label: 'Driving License' }
];
