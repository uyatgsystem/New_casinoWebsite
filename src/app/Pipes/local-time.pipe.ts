import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'localTime'
})
export class LocalTimePipe implements PipeTransform {
    transform(value: string, format: string = 'MMM d, y, h:mm a'): string {
        const date = new Date(value + 'Z'); // Ensure the date is treated as UTC
        return new Intl.DateTimeFormat('en-US', {
          year: 'numeric',
          month: 'short',
          day: 'numeric',
          hour: 'numeric',
          minute: 'numeric',
          hour12: true,
          timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone
        }).format(date);
      }
}