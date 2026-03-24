<script>
	import { range, durationUnitRegex } from "$lib/helpers/utils/common";

  /**
   * @type {{
   *   color?: string,
   *   unit?: string,
   *   duration?: string,
   *   size?: string | number,
   *   pause?: boolean,
   *   gap?: string | number,
   *   containerClasses?: string,
   *   containerStyles?: string
   * }}
   */
  let {
    color = '#FF3E00',
    unit = 'px',
    duration = '1.2s',
    size = '60',
    pause = false,
    gap = '5',
    containerClasses = '',
    containerStyles = ''
  } = $props();

  /** @type {string} */
	let durationUnit = $derived(duration.match(durationUnitRegex)?.[0] ?? 's');

  /** @type {string} */
	let durationNum = $derived(duration.replace(durationUnitRegex, ''));
</script>

<div
	class={`stretch-wrapper ${containerClasses}`}
	style={`--size: ${size}${unit}; --color: ${color}; --duration: ${duration}; --gap: ${gap}${unit}; ${containerStyles}`}
>
	{#each range(5, 1) as version}
		<div
			class="rect"
			class:pause-animation={pause}
			style="animation-delay: {(version - 1) * (+durationNum / 12)}{durationUnit}"
		>
		</div>
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