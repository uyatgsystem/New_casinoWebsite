import { Component, inject } from '@angular/core';
import { CommonModule, Location } from '@angular/common';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';

interface TermSection {
  id: string;
  icon: string;
  title: string;
  badge: string;
  content: string;
  bullets?: string[];
}

@Component({
  selector: 'app-terms-and-conditions',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './terms-and-conditions.component.html',
  styleUrls: ['./terms-and-conditions.component.scss'],
})
export class TermsAndConditionsComponent {
  private location = inject(Location);
  private router = inject(Router);
  searchQuery: string = '';
  activeSection: string = 'all';

  sections: TermSection[] = [
    {
      id: 'eligibility',
      icon: '🛡️',
      title: '1. Eligibility & Age Requirements',
      badge: 'STRICT 18+ REQUIREMENT',
      content:
        'You must be at least 18 years of age (or the legal age of majority in your jurisdiction) to register an account, participate in any games, or execute financial transactions on Crown Spin. By creating an operative account, you certify that all information submitted is complete, accurate, and verifiably truthful.',
      bullets: [
        'Mandatory age verification protocol prior to first cash withdrawal',
        'Single account policy per individual, household, and IP address',
        'Jurisdiction compliance is the sole responsibility of the account holder',
      ],
    },
    {
      id: 'account',
      icon: '🔐',
      title: '2. Account Registration & Security',
      badge: '256-BIT ENCRYPTION',
      content:
        'To participate in real cash gaming, deposit funds, or claim promotional rewards, users must register a secured account. You are solely responsible for maintaining credentials confidentiality and enabling available security safeguards.',
      bullets: [
        'Keep your account password confidential and unique to Crown Spin',
        'Notify support immediately if any unauthorized account activity is suspected',
        'Crown Spin reserves the right to freeze accounts involved in automated exploitation or bot activity',
      ],
    },
    {
      id: 'deposits',
      icon: '💳',
      title: '3. Deposits & Financial Rails',
      badge: 'INSTANT SETTLEMENT',
      content:
        'Deposits can be executed utilizing authorized payment processors including supported cryptocurrency assets, card networks, and digital wallets. All completed deposits are credited immediately to your playable operative balance.',
      bullets: [
        'All deposits are final and non-refundable once credited to your gaming wallet',
        'Funds must originate from payment methods legally registered in your name',
        'Zero hidden platform fees on standard cryptocurrency deposits',
      ],
    },
    {
      id: 'gameplay',
      icon: '🎲',
      title: '4. Gameplay & Provably Fair Standards',
      badge: 'RNG CERTIFIED',
      content:
        'All games hosted on Crown Spin utilize certified Cryptographic Random Number Generators (RNG) and provably fair seeds ensuring tamper-proof outcomes. Outcomes are determined by automated backend algorithms and are mathematically final.',
      bullets: [
        'Provably fair seeds can be verified independently via client seeds',
        'Intentional exploitation of software anomalies or latency spikes is strictly prohibited',
        'Wagers placed during active gameplay cannot be reversed or modified once initiated',
      ],
    },
    {
      id: 'withdrawals',
      icon: '⚡',
      title: '5. Fast Withdrawals & KYC Verification',
      badge: 'AUTOMATED PAYOUTS',
      content:
        'Winnings may be withdrawn directly to your preferred payout rails subject to standard AML (Anti-Money Laundering) verification and balance qualification thresholds. Automated pipelines ensure expedited settlement.',
      bullets: [
        'Withdrawal processing typically completes within 5 to 60 minutes for verified accounts',
        'Identity verification (KYC Level 1/2) may be required for high-volume transactions',
        'Bonus wallet balances must satisfy respective turnover terms before redemption',
      ],
    },
    {
      id: 'privacy',
      icon: '🔒',
      title: '6. Privacy Policy & Data Security',
      badge: 'ZERO THIRD-PARTY SHARING',
      content:
        'Your privacy is safeguarded by strict data governance standards. Personal identifiers, banking telemetry, and transaction logs are stored behind encrypted firewalls and are never sold or rented to external advertising networks.',
      bullets: [
        'End-to-end encrypted communication via modern TLS 1.3 cryptographic protocols',
        'Full compliance with global digital privacy standards and account deletion rights',
        'Cookies are utilized exclusively for session security and localized language preferences',
      ],
    },
    {
      id: 'support',
      icon: '💬',
      title: '7. Dispute Resolution & Customer Support',
      badge: '24/7 LIVE ASSISTANCE',
      content:
        'Our dedicated support team is available around the clock to investigate inquiries, resolve transactional discrepancies, and assist with gameplay validation.',
      bullets: [
        'Direct 24/7 live chat available through the platform interface',
        'Email escalation desk: support@crownspin.com',
        'Disputes handled within a formal 48-hour auditing review window',
      ],
    },
  ];

  get filteredSections(): TermSection[] {
    let result = this.sections;
    if (this.activeSection !== 'all') {
      result = result.filter((s) => s.id === this.activeSection);
    }
    if (this.searchQuery && this.searchQuery.trim()) {
      const q = this.searchQuery.toLowerCase().trim();
      result = result.filter(
        (s) =>
          s.title.toLowerCase().includes(q) ||
          s.content.toLowerCase().includes(q) ||
          (s.badge && s.badge.toLowerCase().includes(q)) ||
          (s.bullets && s.bullets.some((b) => b.toLowerCase().includes(q)))
      );
    }
    return result;
  }

  setSection(secId: string): void {
    this.activeSection = secId;
  }

  printTerms(): void {
    window.print();
  }

  goBack(): void {
    if (window.history.length > 1) {
      this.location.back();
    } else {
      this.router.navigate(['/']);
    }
  }
}
