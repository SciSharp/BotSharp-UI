<script>
	import { durationUnitRegex, range } from "$lib/helpers/utils/common";

	/**
	 * @type {{
	 *   color?: string,
	 *   unit?: string,
	 *   duration?: string,
	 *   size?: string | number,
	 *   pause?: boolean,
	 *   shape?: 'dot' | 'cube',
	 *   count?: number,
	 *   gap?: string | number,
	 *   containerClasses?: string,
	 *   containerStyles?: string
	 * }}
	 */
	let {
		color = '#FF3E00',
		unit = 'px',
		duration = '1.5s',
		size = '30',
		pause = false,
		shape = 'dot',
		count = 3,
		gap = '10',
		containerClasses = '',
		containerStyles = ''
	} = $props();

	const durationUnit = $derived(duration.match(durationUnitRegex)?.[0] ?? 's');
	const durationNum = $derived(duration.replace(durationUnitRegex, ''));
</script>

<div
	class={`loading-wrapper ${containerClasses}`}
	style="--size: {size}{unit}; --color: {color}; --duration: {duration}; --count: {count}; --gap: {gap}{unit}; {containerStyles}"
>
	{#each range(count, 0) as version}
		<div
			class={`animation ${shape === 'cube' ? 'cube' : 'dot'}`}
			class:pause-animation={pause}
			style="animation-delay: {version * (+durationNum / 10)}{durationUnit};"
		></div>
	{/each}
</div>

<style>
	.loading-wrapper {
		position: relative;
		display: flex;
		justify-content: center;
		align-items: center;
		width: calc(var(--size) * var(--count) + var(--gap) * (var(--count) - 1));
		height: calc(var(--size));
        gap: var(--gap);
	}

    .animation {
        background-color: var(--color);
		animation: motion var(--duration) cubic-bezier(0.895, 0.03, 0.685, 0.22) infinite;
    }

	.cube {
		width: calc(var(--size) / 2);
		height: var(--size);
	}

    .dot {
		width: var(--size);
		height: var(--size);
        border-radius: 50%;
    }

	.pause-animation {
		animation-play-state: paused;
	}

	@keyframes motion {
		0% {
			opacity: 1;
		}
		50% {
			opacity: 0;
		}
		100% {
			opacity: 1;
		}
	}
</style>