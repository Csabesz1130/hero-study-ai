import { ReviewSchedule } from '@/types/spacedRepetition';

export interface CalendarEvent {
    id: string;
    title: string;
    description: string;
    start: Date;
    end: Date;
    location?: string;
    url?: string;
}

export class CalendarExportService {
    public generateICalendar(reviews: ReviewSchedule[]): string {
        const events = reviews.map(review => this.createCalendarEvent(review));
        return this.createICalendarContent(events);
    }

    public generateGoogleCalendarUrl(reviews: ReviewSchedule[]): string {
        const events = reviews.map(review => this.createCalendarEvent(review));
        return this.createGoogleCalendarUrl(events);
    }

    private createCalendarEvent(review: ReviewSchedule): CalendarEvent {
        const start = new Date(review.scheduledDate);
        const end = new Date(start);
        end.setMinutes(end.getMinutes() + 15); // 15 perces események

        return {
            id: review.id,
            title: 'Ismétlés időpontja',
            description: 'Ismétlés időpontja a HeroStudy AI alkalmazásban',
            start,
            end,
            url: `${process.env.NEXT_PUBLIC_APP_URL}/review/${review.itemId}`
        };
    }

    private createICalendarContent(events: CalendarEvent[]): string {
        const now = new Date();
        const calendar = [
            'BEGIN:VCALENDAR',
            'VERSION:2.0',
            'PRODID:-//HeroStudy AI//Spaced Repetition//HU',
            'CALSCALE:GREGORIAN',
            'METHOD:PUBLISH',
            ...events.flatMap(event => this.createICalendarEvent(event)),
            'END:VCALENDAR'
        ].join('\r\n');

        return calendar;
    }

    private createICalendarEvent(event: CalendarEvent): string[] {
        return [
            'BEGIN:VEVENT',
            `UID:${event.id}`,
            `DTSTAMP:${this.formatDateForICal(now)}`,
            `DTSTART:${this.formatDateForICal(event.start)}`,
            `DTEND:${this.formatDateForICal(event.end)}`,
            `SUMMARY:${event.title}`,
            `DESCRIPTION:${event.description}`,
            event.url ? `URL:${event.url}` : '',
            'END:VEVENT'
        ].filter(line => line !== '');
    }

    private createGoogleCalendarUrl(events: CalendarEvent[]): string {
        const baseUrl = 'https://calendar.google.com/calendar/render';
        const params = new URLSearchParams();

        events.forEach(event => {
            params.append('action', 'TEMPLATE');
            params.append('text', event.title);
            params.append('details', event.description);
            params.append('dates', this.formatDateForGoogleCalendar(event));
            if (event.url) {
                params.append('location', event.url);
            }
        });

        return `${baseUrl}?${params.toString()}`;
    }

    private formatDateForICal(date: Date): string {
        return date.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
    }

    private formatDateForGoogleCalendar(event: CalendarEvent): string {
        const format = (date: Date) => {
            return date.toISOString().replace(/-|:|\.\d{3}/g, '');
        };
        return `${format(event.start)}/${format(event.end)}`;
    }
} 