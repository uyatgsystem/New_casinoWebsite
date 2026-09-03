import { Component } from '@angular/core';
import { Route, Router } from '@angular/router';
import { LoaderService } from '../../Services/loader-service.service';
import { ApiCallService } from '../../Services/api-call-service.service';
import { UtilsService } from '../../Services/utils.service';
import { ErrorhandlingService } from '../../Services/error-handling.service';
import { ToastrService } from 'ngx-toastr';

@Component({
  standalone: true,
  selector: 'app-profile',
  imports: [],
  templateUrl: './profile.component.html',
  styleUrl: './profile.component.scss',
})
export class ProfileComponent {
  constructor(
    private router: Router,
    private loaderService: LoaderService,
    private apiCallService: ApiCallService,
    private handleerror: ErrorhandlingService,
    private toastr: ToastrService,
    private utilsService: UtilsService
  ) { }

  ngOnInit() {
    //? User Data from Local Storage
    this.email = localStorage.getItem('email') ?? '';
    this.name = localStorage.getItem('userName') ?? '';

    //? Profile Image Dynamic Update
    this.utilsService.profileImage$.subscribe((image) => {
      this.profileImage = image;
    });
  }
  // * User Profile Data
  email: string = '';
  name: string = '';
  profileImage: string = '';

  //* Router navigation function
  changeRoute(path: string) {
    this.router.navigate([path]);
  }

  // * File Upload Function
  saveUserProfileImage() {
    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.accept = 'image/*';

    fileInput.onchange = async (event: Event) => {
      const file = (event.target as HTMLInputElement)?.files?.[0];

      if (file) {
        try {
          //? Show loader while processing
          this.loaderService.show();

          //? Convert the file to a base64 string
          const base64Image = await this.convertFileToBase64(file);

          //? Create the API payload
          const payload: any = {
            base64Image: base64Image,
          };

          //? Make the API call
          this.apiCallService
            .PostCallWithToken(payload, 'User/SaveUserProfileImage')
            .subscribe({
              next: (response) => {
                if (response && response.responseCode === 200) {
                  this.profileImage = base64Image;

                  //? Set Profile Image for Dynamic Update
                  this.utilsService.setProfileImage(base64Image);
                  this.loaderService.triggerFunction();
                  // console.log(
                  //   'Profile image saved successfully:',
                  //   response.responseMessage
                  // );
                } else {
                  // console.error(
                  //   'Failed to save profile image:',
                  //   response.responseMessage
                  // );
                  this.handleerror.handleResponseError(response);
                }
                // this.loaderService.hide();
              },
              error: (error) => {
                // console.error('Error saving profile image:', error);
                // this.loaderService.hide();
                this.handleerror.handleHttpError(error);
              },
              complete: () => {
                this.loaderService.hide();
                // console.log('Profile image save process completed.');
              },
            });
        } catch (error) {
          // console.error('Error processing image file:', error);
          this.loaderService.hide();
          // this.handleerror.handleHttpError(error);
        }
      }
    };
    fileInput.click();
  }

  // Delete User Profile Image 
  deleteUserProfileImage() {

    this.loaderService.show();

    this.apiCallService.PostCallWithToken({}, 'User/DeleteUserProfileImage').subscribe({
      next: (response) => {
        if (response && response.responseCode === 200) {
          this.profileImage = "";
          this.utilsService.setProfileImage("");
          this.loaderService.triggerFunction();
          this.toastr.success(response.responseMessage, 'Success');
        } else {
          this.handleerror.handleResponseError(response);
        }
      },
      error: (error) => {
        this.handleerror.handleHttpError(error);
      },
      complete: () => {
        this.loaderService.hide();
      },
    });
  }


  private convertFileToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = (error) => reject(error);
      reader.readAsDataURL(file);
    });
  }
}
