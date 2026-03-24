import type { Temporal } from 'temporal-polyfill';

export const AppURL = {
	UPCOMING_EVENTS: '/proximos-eventos',
	ANUNCIOS: '/anuncios',
	CALENDARIO: '/calendario',
} as const;

export type ImageVariant = {
	url: string;
	mimeType: string;
};

export type MediaImage = {
	url: string;
	mimeType: string;
	sizes: {
		placeholder: ImageVariant;
		thumbnail: ImageVariant;
		'1x': ImageVariant;
		'2x': ImageVariant;
		'3x': ImageVariant;
	};
};

// Type for the Events in the Events Swiper
export type Event = {
	index: number;
	slug: string;
	mediaImage: MediaImage;
	dateStrings: string[];
	calendarDates?: CalendarDate[];
	description: string;
	isFooterVisible?: boolean;
	isFlipped?: boolean;
	showFrontSide?: boolean;
};

// Type for the dates in the Dates Swiper
export type CalendarDate = {
	dateString: string;
	events: Event[];
	weekIndex: number;
};

export type Week = CalendarDate[];

// Type for the announcements in the Announcements Swiper
export type Announcement = {
	index: number;
	slug: string;
	mediaImage: MediaImage;
	description: string;
	isSelected?: boolean;
};

export type CalendarEvent = {
	dateStrings: string[];
	ministry: {
		name: string;
		hexColor?: string;
	};
	title: string;
};

export type MonthCell = {
	date: Temporal.PlainDate | undefined;
	inMonth: boolean;
	events: CalendarEvent[];
};
