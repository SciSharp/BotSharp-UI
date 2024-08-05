<script>
	import { range, durationUnitRegex } from "$lib/helpers/utils/common";

  /** @type {string} */
	export let color = '#FF3E00';

  /** @type {string} */
	export let unit = 'px';

  /** @type {string} */
	export let duration = '1.2s';

  /** @type {string | number} */
	export let size = '60';

  /** @type {boolean} */
	export let pause = false;

  /** @type {string | number} */
  export let gap = '5';

  /** @type {string} */
  export let containerClasses = '';

  /** @type {string} */
  export let containerStyles = '';

  /** @type {string} */
	let durationUnit = duration.match(durationUnitRegex)?.[0] ?? 's';

  /** @type {string} */
	let durationNum = duration.replace(durationUnitRegex, '');
</script>

<div class={`stretch-wrapper ${containerClasses}`} style={`--size: ${size}${unit}; --color: ${color}; --duration: ${duration}; --gap: ${gap}${unit}; ${containerStyles}`}>
	{#each range(5, 1) as version}
		<div
			class="rect"
			class:pause-animation={pause}
			style="animation-delay: {(version - 1) * (+durationNum / 12)}{durationUnit}"
		/>
	{/each}
</div>

<style>
	.stretch-wrapper {
    position: relative;
    display: flex;
    justify-content: center;
    align-items: center;
    width: fit-content;
		height: calc(var(--size));
    gap: var(--gap);
    margin-top: calc(var(--size) * 3);
    margin-bottom: calc(var(--size) * 3);
	}
	.rect {
    width: calc(var(--size) / 1.2);
		height: calc(var(--size) * 5);
		display: inline-block;
		transform: scaleY(0.2);
		background-color: var(--color);
		animation: stretch var(--duration) ease-in-out infinite;
	}

	.pause-animation {
		animation-play-state: paused;
	}

	@keyframes stretch {
		0%,
		40%,
		100% {
			transform: scaleY(0.3);
		}
		20% {
			transform: scaleY(1);
		}
	}
</style>