import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';

export function passwordMatchValidator(): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const password = control.get('password');
    const confirmPassword = control.get('confirmPassword');
    if (password && confirmPassword && password.value !== confirmPassword.value) {
      return { passwordMismatch: true };
    }
    return null;
  };
}
export function   passwordValidator() {
  return (control: AbstractControl): { [key: string]: boolean } | null => {
    const password = control.value;
    const valid = 
      password.length >= 8 &&
      (password.match(/[0-9]/g) || []).length >= 2 &&
      /[A-Z]/.test(password) &&
      /[a-z]/.test(password) &&
      /[!@#$%^&*(),.?":{}|<>]/.test(password);
    
    return valid ? null : { 'invalidPassword': true };
  };
}