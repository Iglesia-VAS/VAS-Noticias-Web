<script lang="ts">
	import type { MediaImage } from '$lib/appTypes';

	type Size = 'placeholder' | 'thumbnail' | 'conditional' | 'original';

	export let mediaImage: MediaImage;
	export let size: Size = 'conditional';
	export let alt: string = '';

	const srcsetBySize: Record<Size, string> = {
		placeholder: mediaImage.sizes.placeholder.url,
		thumbnail: mediaImage.sizes.thumbnail.url,
		conditional: (['1x', '2x', '3x'] as const)
			.map((variant) => `${mediaImage.sizes[variant].url} ${variant}`)
			.join(', '),
		original: mediaImage.url,
	};

	const mimeTypeBySize: Record<Size, string> = {
		placeholder: mediaImage.sizes.placeholder.mimeType,
		thumbnail: mediaImage.sizes.thumbnail.mimeType,
		conditional: mediaImage.sizes['1x'].mimeType,
		original: mediaImage.mimeType,
	};
</script>

<picture>
	<source
		srcset={srcsetBySize[size]}
		type={mimeTypeBySize[size]}
	/>
	<img
		src={mediaImage.url}
		{alt}
		decoding="async"
		loading="lazy"
	/>
</picture>
