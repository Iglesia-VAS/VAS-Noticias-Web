import appService from '$lib/appService';
import type { Event, MediaImage } from '$lib/appTypes';
import payloadApi from '$lib/payloadApi';
import { AxiosError } from 'axios';
import type { PageServerLoad } from './$types';

type UpcomingEventDTO = {
	id: string;
	title: string;
	slug: string;
	image: MediaImage;
	description: string;
	isActive: boolean;
	dateStrings: string[];
	updatedAt: string;
	createdAt: string;
};

export const load: PageServerLoad = async ({ url }) => {
	const eventSlug = url.searchParams.get('evento');
	const appDomain = url.origin;

	let rawEvents: Event[] = [];

	const upcomingEventsResponse =
		await payloadApi.get<UpcomingEventDTO[]>('/upcoming-events/active');
	if (upcomingEventsResponse instanceof AxiosError) {
		console.error(`Response error: ${upcomingEventsResponse.message}`);
	}

	rawEvents = upcomingEventsResponse.data.map((event, index) => ({
		index,
		slug: event.slug,
		mediaImage: event.image,
		dateStrings: event.dateStrings,
		description: event.description,
	}));

	if (!rawEvents.length) {
		return {
			eventList: [],
			weekList: [],
		};
	}

	const { eventList, weekList } = appService.generateAppData(rawEvents);

	return {
		eventSlug,
		appDomain,
		eventList,
		weekList,
	};
};
