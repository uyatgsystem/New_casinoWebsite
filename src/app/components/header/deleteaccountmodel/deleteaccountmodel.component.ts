import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, NgModel } from '@angular/forms';
import { LoaderComponent } from "../../loader/loader.component"; // Import FormsModule
import { faEye, faEyeSlash } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';


@Component({
  selector: 'app-deleteaccountmodel',
  standalone: true,
  imports: [CommonModule, 
    FontAwesomeModule,
    LoaderComponent], 
  templateUrl: './deleteaccountmodel.component.html',
  styleUrl: './deleteaccountmodel.component.scss'
})
export class deleteaccountmodelComponent {
  @Input() isOpen = false;
  @Input() profileImage = '';
  @Output() onCancel = new EventEmitter<void>();
  @Output() onConfirm = new EventEmitter<string>();
  password: string = '';

  showicon = faEye;
  hideicon = faEyeSlash;
  showPassword: boolean = false;

  // Updates the password when the user types in the input field
  updatePassword(event: Event): void {
    const inputElement = event.target as HTMLInputElement;
    this.password = inputElement.value;
  }
  togglePassword(): void {
    this.showPassword = !this.showPassword;
  }

  // Check if password is filled
  get isPasswordFilled(): boolean {
    return this.password.trim().length > 0;
  }
}
