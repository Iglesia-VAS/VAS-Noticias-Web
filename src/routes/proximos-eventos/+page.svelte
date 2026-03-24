<script lang="ts">
	import { ABBREVIATED_MONTHS, ABBREVIATED_WEEK_DAYS, MONTH_NAMES } from '$lib/appConstants';
	import appService from '$lib/appService';
	import type { CalendarDate, Event } from '$lib/appTypes';
	import ImageComponent from '$lib/components/ImageComponent.svelte';
	import NoContentPlaceholderComponent from '$lib/components/NoContentPlaceholderComponent.svelte';
	import { openSocialMediaModal } from '$lib/components/modal';
	import { showToast } from '$lib/components/toast';
	import { faShare } from '@fortawesome/free-solid-svg-icons';
	import { Button } from '@sveltestrap/sveltestrap';
	import { onMount } from 'svelte';
	import Fa from 'svelte-fa';
	import Swiper from 'swiper/bundle';
	import type { SwiperOptions } from 'swiper/types';
	import { Temporal } from 'temporal-polyfill';
	import type { PageData } from './$types';
	// TODO: *** Change from bundle to the specific modules ***
	import 'swiper/css/bundle';

	export let data: PageData;

	let { eventSlug, appDomain, eventList, weekList } = data;

	const DATES_SWIPE_SPEED_IN_MS = 1000;
	const EVENTS_SWIPE_SPEED_IN_MS = 1000;

	let selectedEvent: Event;
	let eventFromURL: Event | undefined;
	let selectedCalendarDates: CalendarDate[] = [];
	let shouldShowToast = false;
	let monthAndYear: string;
	let datesSwiper: Swiper;
	let datesSwiperParams: SwiperOptions;
	let upcomingEventsSwiper: Swiper;
	let upcomingEventsSwiperParams: SwiperOptions;
	let didSlideChangeFromEvents = false;
	let isDomReady = false;

	if (eventList.length) {
		// Get the selected Event from the URL event param if indicated
		selectedEvent = eventList[0];
		if (eventSlug) {
			eventFromURL = eventList.find((event) => event.slug === eventSlug);
			if (eventFromURL) {
				selectedEvent = eventFromURL;
			} else {
				console.error(`Evento '${eventSlug}' no encontrado`);
				shouldShowToast = true;
			}
		}

		selectedEvent.isFooterVisible = true;
		selectedCalendarDates = selectedEvent.calendarDates!;

		// Get the first day of the selected week
		const weekIndex = selectedCalendarDates[0].weekIndex;
		const firstCalendarDateOfTheWeek = weekList[weekIndex][0];
		monthAndYear = getMonthAndYearString(firstCalendarDateOfTheWeek);

		datesSwiperParams = {
			grabCursor: true,
			centeredSlides: true,
			slidesPerView: 'auto',
			spaceBetween: 0,
			on: {
				transitionEnd: (swiper) => {
					if (!datesSwiper || didSlideChangeFromEvents) {
						didSlideChangeFromEvents = false;
						return;
					}

					const firstCalendarDateOfTheWeek = weekList[swiper.activeIndex][0];
					monthAndYear = getMonthAndYearString(firstCalendarDateOfTheWeek);
				},
			},
		};

		upcomingEventsSwiperParams = {
			effect: 'coverflow',
			grabCursor: true,
			centeredSlides: true,
			slidesPerView: 'auto',
			slideToClickedSlide: true,
			touchReleaseOnEdges: true,
			coverflowEffect: {
				rotate: 50,
				stretch: 0,
				depth: 100,
				modifier: 1,
				slideShadows: true,
			},
			pagination: {
				el: '.swiper-pagination',
			},
			initialSlide:
				selectedEvent.index <= Math.floor(eventList.length / 2) ? eventList.length - 2 : 1,
			on: {
				transitionEnd: () => {
					if (!upcomingEventsSwiper) {
						return;
					}

					selectedEvent = eventList[upcomingEventsSwiper.activeIndex];
					selectedCalendarDates = selectedEvent.calendarDates!;
					monthAndYear = getMonthAndYearString(selectedCalendarDates[0]);
					didSlideChangeFromEvents = true;

					datesSwiper.slideToLoop(
						selectedCalendarDates[0].weekIndex,
						DATES_SWIPE_SPEED_IN_MS,
					);

					// Show the event footer after a delay
					eventFooterVisibilityTimeout = setTimeout(() => {
						selectedEvent.isFooterVisible = true;

						// Force Svelte reactivity
						eventList = eventList;
					}, 500);
				},
				sliderFirstMove: hideEventFooter,
				slideChangeTransitionStart: hideEventFooter,
			},
		};
	}

	$: if (shouldShowToast && isDomReady) {
		showToast('Evento no encontrado');
	}

	function getMonthAndYearString(calendarDate: CalendarDate) {
		const date = Temporal.PlainDate.from(calendarDate.dateString);
		return `${MONTH_NAMES[date.month - 1]} ${date.year}`;
	}

	let eventFooterVisibilityTimeout: ReturnType<typeof setTimeout>;

	function hideEventFooter() {
		selectedEvent.isFooterVisible = false;
		clearTimeout(eventFooterVisibilityTimeout);

		// Force Svelte reactivity
		eventList = eventList;
	}

	onMount(async () => {
		if (!eventList.length) {
			return;
		}

		datesSwiper = new Swiper('.dates-swiper', datesSwiperParams);
		upcomingEventsSwiper = new Swiper('.events-swiper', upcomingEventsSwiperParams);

		isDomReady = true;

		setTimeout(() => {
			upcomingEventsSwiper.slideTo(selectedEvent.index, EVENTS_SWIPE_SPEED_IN_MS * 2);
		}, 500);
	});
</script>

<section>
	{#if eventList.length}
		<div class="app-dates-row">
			<h4 class="month-and-year fade-in">{monthAndYear}</h4>
			<div class="swiper dates-swiper">
				<div class="swiper-wrapper fade-in">
					{#each weekList as week}
						<div class="swiper-slide week">
							{#each week as calendarDate}
								{@const date = Temporal.PlainDate.from(calendarDate.dateString)}
								{@const dayOfTheWeek = ABBREVIATED_WEEK_DAYS[date.dayOfWeek - 1]}
								{@const dayNumber = date.day}
								<div
									class="date {dayOfTheWeek.toLowerCase()}"
									class:today={calendarDate.dateString ===
										Temporal.Now.plainDateISO().toString()}
									class:app-date-selected={selectedCalendarDates.includes(
										calendarDate,
									)}
								>
									<div class="app-day-of-the-week">
										{dayOfTheWeek}
									</div>
									<div class="day-number-container">
										<div class="day-number">
											{#if dayNumber === 1}
												{ABBREVIATED_MONTHS[date.month - 1]}
											{/if}
											{dayNumber}
										</div>
									</div>
									<div class="events">
										{#each calendarDate.events as event}
											<button
												class="event"
												class:selected={event.index === selectedEvent.index}
												style="background-image: url('{event.mediaImage
													.sizes.placeholder.url}');"
												on:click={() =>
													upcomingEventsSwiper.slideTo(
														event.index,
														EVENTS_SWIPE_SPEED_IN_MS,
													)}
											></button>
										{/each}
									</div>
								</div>
							{/each}
						</div>
					{/each}
				</div>
			</div>
		</div>

		<div
			class="swiper events-swiper"
			class:fly-in={isDomReady}
		>
			<div class="swiper-wrapper">
				{#each eventList as event, index (index)}
					<div class="swiper-slide">
						<div
							class="card-container"
							class:flipped={event.isFlipped}
							class:front-side-visible={event.showFrontSide}
						>
							<!-- The front side is the text content. Only this way the text can be scrolled. -->
							<div class="front side">
								<!-- eslint-disable-next-line svelte/no-at-html-tags -->
								<div class="content">{@html event.description}</div>
								<div
									class="footer"
									class:visible={event.isFooterVisible}
								>
									<Button
										size="sm"
										color="light"
										on:click={() =>
											openSocialMediaModal(
												`${appDomain}/eventos?evento=${selectedEvent.slug}`,
											)}
									>
										<Fa icon={faShare} />
										<span>Compartir</span>
									</Button>
									<Button
										size="sm"
										color="primary"
										on:click={() => {
											event.isFlipped = true;
											setTimeout(() => {
												event.showFrontSide = false;
											}, 1500);
										}}
									>
										<span>Volver</span>
										<img
											src="/icons/rotate-180-icon.svg"
											alt=""
										/>
									</Button>
								</div>
							</div>

							<div class="front-bg side">
								<!-- This footer ensures the backface of the other footer is covered with a white background. -->
								<div class="footer" />
							</div>

							<!-- The back side is the event image. The card starts flipped. -->
							<div class="back side">
								<ImageComponent
									mediaImage={event.mediaImage}
									alt="Evento"
								/>
								<div
									class="footer"
									class:visible={event.isFooterVisible}
								>
									<Button
										size="sm"
										color="light"
										on:click={() =>
											openSocialMediaModal(
												`${appDomain}/eventos?evento=${selectedEvent.slug}`,
											)}
									>
										<Fa icon={faShare} />
										Compartir
									</Button>
									<Button
										size="sm"
										color="primary"
										on:click={() => {
											event.isFlipped = false;
											event.showFrontSide = true;
										}}
									>
										Ver más detalles
										<img
											src="/icons/rotate-180-icon.svg"
											alt=""
										/>
									</Button>
								</div>
							</div>
						</div>
					</div>
				{/each}
			</div>
			<div class="swiper-pagination"></div>
		</div>
	{:else}
		<NoContentPlaceholderComponent
			message="No hay eventos esta semana."
			cardTitle="¿Qué son los eventos?"
			cardDescription="Los eventos son actividades programadas que ocurren en fechas y horarios específicos. Estos incluyen servicios, reuniones, talleres y otras actividades de la iglesia que tienen un momento determinado para llevarse a cabo."
		/>
	{/if}
</section>

<svelte:head>
	{#if eventSlug && selectedEvent === eventFromURL}
		<meta
			property="og:description"
			content={appService.stripHTMLTags(selectedEvent.description)}
		/>
		<meta
			property="og:image"
			content={selectedEvent.mediaImage.url}
		/>
		<meta
			property="og:url"
			content="{appDomain}/eventos?evento={selectedEvent.slug}"
		/>
	{/if}
</svelte:head>

<style lang="scss">
	.app-dates-row {
		padding-top: min(1rem, 2vw);
	}

	.month-and-year {
		font-size: min(22px, 5vw);
		text-align: center;
		margin-bottom: 0.25rem;
	}

	.dates-swiper {
		padding-block: 0.5rem min(1rem, 2vw);

		.week {
			width: min(486px, 101vw);
			height: auto;
			padding-inline: 6px;
			display: flex;
			gap: 0.25rem;
			opacity: 1;
			transition: opacity 150ms linear;

			&.swiper-slide-active {
				border-inline: 1px solid rgba(0, 0, 0, 0.35);
			}

			&:not(.swiper-slide-active) {
				opacity: 0.25;
			}
		}

		.date {
			flex: 1;
			height: auto;
			padding: 8px 4px 6px;
			text-align: center;
			display: flex;
			flex-direction: column;
			gap: 4px;
			line-height: 1;
			align-items: center;
			border-radius: 4px;
		}

		.day-number-container {
			display: flex;
			align-items: baseline;
		}

		.day-number {
			height: 2rem;
			aspect-ratio: 1;
			font-size: min(1rem, 3.5vw);
			font-weight: 600;
			opacity: 0.9;
			line-height: 28px;
			white-space: nowrap;
		}

		.app-date-selected .day-number {
			font-weight: 800;
			opacity: 1;
		}

		.today .day-number {
			border: var(--app-border-today);
			border-radius: 100vmax;
			padding-inline: 4px;
		}

		.events {
			display: flex;
			justify-content: center;
			padding-inline: 2px;
			gap: 0.25rem;

			.selected {
				box-shadow: 0 0 0 1px var(--bs-white) inset;
				outline: 2px solid var(--bs-primary);
			}
		}

		.event {
			width: 1.5rem;
			aspect-ratio: 1;
			background-size: contain;
			border: none;
		}
	}

	.events-swiper {
		$img-size: 300px;
		$footer-height: 40px;

		padding-top: 1rem;
		padding-bottom: 35px + $footer-height;
		margin-inline: var(--app-page-margin-x);
		opacity: 0; // Will be overridden by .fly-in

		.swiper-slide {
			width: $img-size;
			height: $img-size;
		}

		.card-container {
			transition: 1.5s ease-in-out;
			transform-style: preserve-3d;
			height: 100%;

			&.flipped {
				transform: rotateY(-180deg);
			}
		}

		.side {
			position: absolute;
			inset: 0;
		}

		.front {
			z-index: 2;
			display: none;
			transform: translateZ(50px) scale(0.95832);
			backface-visibility: hidden;

			.content {
				$padding-bottom: 2rem;
				padding: 1rem;
				padding-bottom: $padding-bottom;
				height: $img-size;
				line-height: 1.4;
				overflow-y: auto;
				overflow-x: hidden;
				position: relative;
				color: rgba(0, 0, 0, 0.85);

				&::after {
					content: '';
					position: fixed;
					inset: 0;
					height: $padding-bottom;
					margin-top: auto;
					background: linear-gradient(transparent, white);
					transform: translateY(1px);
				}

				:global(li) {
					margin-top: 0.25rem;
				}

				:global(p:has(+ ol)),
				:global(p:has(+ ul)) {
					margin-bottom: 0;
				}
			}

			.footer {
				height: $footer-height;
				display: flex;
				align-items: center;
				justify-content: space-between;
				opacity: 0;
				transition: opacity 1.5s ease;
			}
		}

		.front-bg {
			z-index: 1;
			background-color: rgba(255, 255, 255, 0.9);
			transform: translateZ(0.08px) scale(1.003);

			.footer {
				width: 100%;
				height: $footer-height + 2px;
				position: absolute;
				bottom: -$footer-height;
				background-color: white;
			}
		}

		.back {
			background-color: transparent;
			transform: rotateY(180deg);

			.event-image {
				width: 100%;
				aspect-ratio: 1;
			}

			.footer {
				height: $footer-height;
				background-color: var(--app-primary-light);
				padding-inline: 0.25rem;
				display: flex;
				align-items: center;
				justify-content: space-between;
				border-bottom-left-radius: 4px;
				border-bottom-right-radius: 4px;
				opacity: 0;
				transition: opacity 1.5s ease;
			}
		}

		.footer.visible {
			opacity: 1;
		}

		.front-side-visible .front {
			display: block;
		}

		.footer :global(img) {
			width: 1.5rem;
			margin: -4px -2px -2px 0px;
		}
	}

	@keyframes fly-in {
		0% {
			opacity: 0;
			transform: translateY(50px);
		}
		100% {
			opacity: 1;
			transform: translateY(0);
		}
	}

	.fly-in {
		animation: fly-in 1s ease-out forwards;
	}

	@keyframes fadeIn {
		0% {
			opacity: 0;
		}
		50% {
			opacity: 0;
		}
		100% {
			opacity: 1;
		}
	}

	.fade-in {
		animation: fadeIn 2s ease-in forwards;
	}
</style>
