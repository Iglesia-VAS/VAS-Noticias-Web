import type { Announcement, MediaImage } from '$lib/appTypes';
import payloadApi from '$lib/payloadApi';
import { AxiosError } from 'axios';
import type { PageServerLoad } from './$types';

type AnnouncementDTO = {
	id: string;
	title: string;
	slug: string;
	image: MediaImage;
	description: string;
	isActive: boolean;
	updatedAt: string;
	createdAt: string;
};

export const load: PageServerLoad = async ({ url }) => {
	const announcementSlug = url.searchParams.get('anuncio');
	const appDomain = url.origin;

	let announcementList: Announcement[] = [];

	const announcementsResponse = await payloadApi.get<AnnouncementDTO[]>('/announcements/active');
	if (announcementsResponse instanceof AxiosError) {
		console.error(`Response error: ${announcementsResponse.message}`);
	}

	announcementList = announcementsResponse.data.map((announcement, index) => ({
		index,
		slug: announcement.slug,
		mediaImage: announcement.image,
		description: announcement.description,
	}));

	return {
		announcementSlug,
		appDomain,
		announcementList,
	};
};
