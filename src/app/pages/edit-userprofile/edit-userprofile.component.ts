// import { CommonModule } from '@angular/common';
// import { Component } from '@angular/core';
// import {
//   FormBuilder,
//   FormGroup,
//   Validators,
//   ReactiveFormsModule,
// } from '@angular/forms';
// import { ToastrService } from 'ngx-toastr';
// import { ApiCallService } from '../../Services/api-call-service.service';
// import { ErrorhandlingService } from '../../Services/error-handling.service';

// @Component({
//   selector: 'app-edit-userprofile',
//   templateUrl: './edit-userprofile.component.html',
//   styleUrls: ['./edit-userprofile.component.scss'],
//   imports: [ReactiveFormsModule, CommonModule],
// })
// export class EditUserprofileComponent {
//   userProfileForm: FormGroup;

//   constructor(
//     private fb: FormBuilder,
//     private toastr: ToastrService,
//     private apicall: ApiCallService,
//     private errorHandle: ErrorhandlingService
//   ) {
//     this.userProfileForm = this.fb.group({
//       firstName: [
//         '',
//         [
//           Validators.required,
//           Validators.minLength(2),
//           Validators.pattern('^[A-Za-z\\s]+$'),
//         ],
//       ],
//       lastName: [
//         '',
//         [
//           Validators.required,
//           Validators.minLength(2),
//           Validators.pattern('^[A-Za-z\\s]+$'),
//         ],
//       ],
//       email: ['', [Validators.required, Validators.email]],
//     });
//   }

//   // Submit handler
//   onSubmit(): void {
//     if (this.userProfileForm.invalid) {
//       this.toastr.error(
//         'Please fill out the form correctly before submitting.',
//         'Error'
//       );
//       return;
//     }

//     const { firstName, lastName, email } = this.userProfileForm.value;
    
//     // const userID = localStorage.getItem('userId');
//     // this.updateUserProfile(firstName, lastName, email, userID);

//     this.updateUserProfile(firstName, lastName, email);

//   }

//   // API call for updating user profile
//   updateUserProfile(firstName: string, lastName: string, email: string): void {
//     const payload = {
//       firstName,
//       lastName,
//       email,
       
//     };

//     this.apicall.PostCallWithToken(payload, 'User/UpdateUser').subscribe(
//       (response: any) => {
//         if (response.responseCode === 200) {
//           this.toastr.success('Profile updated successfully!', 'Success');
//         } else {
//           this.errorHandle.handleResponseError(response);
//         }
//       },
//       (error) => {
//         this.errorHandle.handleHttpError(error);
//       }
//     );
//   }
//   resetForm(): void {
//     this.userProfileForm.reset();
//   }
// }


import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  Validators,
  ReactiveFormsModule,
} from '@angular/forms';
import { ToastrService } from 'ngx-toastr';
import { ApiCallService } from '../../Services/api-call-service.service';
import { ErrorhandlingService } from '../../Services/error-handling.service';

@Component({
  selector: 'app-edit-userprofile',
  templateUrl: './edit-userprofile.component.html',
  styleUrls: ['./edit-userprofile.component.scss'],
  imports: [ReactiveFormsModule, CommonModule],
})
export class EditUserprofileComponent {
  userProfileForm: FormGroup;

  constructor(
    private fb: FormBuilder,
    private toastr: ToastrService,
    private apicall: ApiCallService,
    private errorHandle: ErrorhandlingService
  ) {
    this.userProfileForm = this.fb.group({
      firstName: [
        '',
        [
          Validators.required,
          Validators.minLength(2),
          Validators.pattern('^[A-Za-z\\s]+$'),
        ],
      ],
      lastName: [
        '',
        [
          Validators.required,
          Validators.minLength(2),
          Validators.pattern('^[A-Za-z\\s]+$'),
        ],
      ],
      email: ['', [Validators.required, Validators.email]],
    });
  }

  // Submit handler
  onSubmit(): void {
    if (this.userProfileForm.invalid) {
      this.toastr.error(
        'Please fill out the form correctly before submitting.',
        'Error'
      );
      return;
    }

    const { firstName, lastName, email } = this.userProfileForm.value;
    const userId = localStorage.getItem('userId'); // Retrieve userId from localStorage

    if (!userId) {
      this.toastr.error('User ID is missing. Please log in again.', 'Error');
      return;
    }

    this.updateUserProfile(firstName, lastName, email, userId);
  }

  // API call for updating user profile
  updateUserProfile(
    firstName: string,
    lastName: string,
    email: string,
    userId: string
  ): void {
    const payload = {
      userId, // Include userId in the payload
      firstName,
      lastName,
      email,
    };

    this.apicall.PostCallWithToken(payload, 'User/UpdateUser').subscribe(
      (response: any) => {
        if (response.responseCode === 200) {
          this.toastr.success('Profile updated successfully!', 'Success');
        } else {
          this.errorHandle.handleResponseError(response);
        }
      },
      (error) => {
        this.errorHandle.handleHttpError(error);
      }
    );
  }

  resetForm(): void {
    this.userProfileForm.reset();
  }
}
