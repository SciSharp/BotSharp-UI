<script>
	import { range } from "$lib/helpers/utils/common";

    /** @type {string} */
	export let color = '#FF3E00';
    /** @type {string} */
	export let unit = 'px';
    /** @type {string} */
	export let duration = '1.5s';
	/** @type {string | number} */
	export let size = '60';
    /** @type {boolean} */
	export let pause = false;
    /** @type {'dot' | 'cube'} */
    export let shape = 'dot';
    /** @type {number} */
    export let count = 3;
    /** @type {string | number} */
	export let gap = '10';

    const unitRegex = /[a-zA-Z]/;
    const durationUnit = duration.match(unitRegex)?.[0] ?? 's';
	const durationNum = duration.replace(unitRegex, '');
</script>

<div class="loading-wrapper" style="--size: {size}{unit}; --color: {color}; --duration: {duration}; --count: {count}; --gap: {gap}{unit}">
	{#each range(count, 0) as version}
		<div
			class={`animation ${shape === 'cube' ? 'cube' : 'dot'}`}
			class:pause-animation={pause}
			style="animation-delay: {version * (+durationNum / 10)}{durationUnit};"
		/>
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