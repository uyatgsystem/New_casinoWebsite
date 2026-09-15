import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';

export interface TabItem {
  id: number;
  label: string;
  value: string;
  scrollingId?: string
}

@Component({
  selector: 'app-tab-navigation',
  imports: [CommonModule],
  templateUrl: './tab-navigation.component.html',
  styleUrl: './tab-navigation.component.scss',
})
export class TabNavigationComponent {
  @Input() activeTab: string = 'games';
  @Input() tabs: TabItem[] = [];
  @Output() tabChange = new EventEmitter<TabItem>();


  selectTab(tab: TabItem) {
    this.activeTab = tab.value;
    if (tab.scrollingId) {
      this.scrollToSection(tab.scrollingId);
    }

    this.tabChange.emit(tab);
  }

  scrollToSection(sectionId: string) {
    const element = document.getElementById(sectionId);
    if (element) {
      const yOffset = -170;
      const y = element.getBoundingClientRect().top + window.scrollY + yOffset;
      window.scrollTo({ top: y, behavior: 'smooth' });
    }
  }
}
