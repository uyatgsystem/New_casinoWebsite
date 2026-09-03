import { Component } from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  Validators,
  ReactiveFormsModule,
} from '@angular/forms';
import { ApiCallService } from '../../../Services/api-call-service.service';
import { ErrorhandlingService } from '../../../Services/error-handling.service';
import { ToastrService } from 'ngx-toastr';
import { LoaderService } from '../../../Services/loader-service.service';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-contact-us',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './contact-us.component.html',
  styleUrls: ['./contact-us.component.scss'],
})
export class ContactUsComponent {
  contactForm: FormGroup;
  openIndex: number | null = 1;

  constructor(
    private fb: FormBuilder,
    private apiService: ApiCallService,
    private errorHandler: ErrorhandlingService,
    private toastr: ToastrService,
    private loaderService: LoaderService,
  ) {
    this.contactForm = this.fb.group({
      firstName: ['', Validators.required],
      lastName: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      phone: ['', [Validators.required]],
      message: ['', Validators.required],
    });
  }

  onSubmit() {
    if (this.contactForm.valid) {
      this.loaderService.show();
      const formValue = this.contactForm.value;
      const payload = {
        userName: `${formValue.firstName} ${formValue.lastName}`,
        userEmail: formValue.email,
        message: formValue.message,
        contactNumber: formValue.phone,
      };

      this.apiService
        .PostCallWithoutToken(payload, 'Public/UserContactUs')
        .subscribe(
          (response) => {
            this.loaderService.hide();
            if (response.responseCode === 200) {
              this.toastr.success(
                response.responseMessage || 'Message sent successfully!',
                'Success',
              );
              this.contactForm.reset();
            } else {
              this.errorHandler.handleResponseError(response);
            }
          },
          (error) => {
            this.loaderService.hide();
            this.errorHandler.handleHttpError(error);
          },
        );
    } else {
      // Mark all fields as touched to show validation errors
      Object.keys(this.contactForm.controls).forEach((key) => {
        this.contactForm.get(key)?.markAsTouched();
      });
      this.toastr.error(
        'Please fill in all required fields with valid information.',
        'Validation Error',
      );
    }
  }

  onPhoneInput(event: Event) {
    const input = event.target as HTMLInputElement;
    const cleaned = input.value.replace(/\D/g, '');
    const control = this.contactForm.get('phone');
    if (control && control.value !== cleaned) {
      control.setValue(cleaned, { emitEvent: false });
    }
  }

  toggle(index: number) {
    this.openIndex = this.openIndex === index ? null : index;
  }

  faqs = [
    {
      index: 1,
      question: 'Is CasinoMaxs free to join?',
      answer:
        'Yes! Signing up is completely free, and your signup bonus is automatically added so you can start playing immediately.',
    },
    {
      index: 2,
      question: 'How do I start playing games?',
      answer:
        'Create a free account, verify your email, and explore our exciting games. Your signup bonus is ready to boost your first plays!',
    },
    {
      index: 3,
      question: 'How can I deposit funds?',
      answer:
        'We offer secure and trusted payment methods, allowing you to deposit funds quickly and safely. Your transactions are protected with advanced security, ensuring a smooth and reliable experience every time.',
    },
    {
      index: 4,
      question: 'How do I win cash rewards?',
      answer:
        'Enjoy our games on a secure and fair platform to maximize your chances of winning. The more you win, the more cash rewards you can earn. Withdraw your earnings quickly and securely using any of the trusted payment methods available on our platform.',
    },
    {
      index: 5,
      question: 'Is it safe to play on CasinoMaxs?',
      answer:
        'Yes! Your safety is our top priority. CasinoMaxs uses advanced security, encrypted transactions, and fair gaming practices to protect your account, personal information, and funds, so you can play with complete confidence.',
    },
    {
      index: 6,
      question: 'What should I do if I face technical issues?',
      answer:
        'If you experience any technical issues, our dedicated support team is here to help. Simply contact us through Live Chat or the Contact Us page, and we’ll work to resolve your issue as quickly as possible.',
    },
    {
      index: 7,
      question: 'Are there limits on claiming rewards?',
      answer:
        'Our rewards and bonus policies are clear and transparent, with no hidden conditions. Any applicable limits or claim periods are displayed in the promotion details, ensuring you always know what to expect.',
    },
    {
      index: 8,
      question: 'Can I play on mobile?',
      answer:
        'Absolutely! CasinoMaxs is fully optimized for smartphones and tablets, giving you a fast, secure, and seamless gaming experience. Play, deposit, and withdraw your winnings anytime, anywhere with confidence.',
    },
  ];
}
