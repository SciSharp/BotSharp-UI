<script>
	import { browser } from '$app/environment';

	let isFullScreenMode = $state(true);

	function toggleFullscreen() {
		if (browser) {
			if (
				// @ts-ignore
				!document.fullscreenElement && !document.mozFullScreenElement && !document.webkitFullscreenElement
			) {
				// current working methods
				isFullScreenMode = false;
				if (document.documentElement.requestFullscreen) {
					document.documentElement.requestFullscreen();
				// @ts-ignore
				} else if (document.documentElement.mozRequestFullScreen) {
					// @ts-ignore
					document.documentElement.mozRequestFullScreen();
				// @ts-ignore
				} else if (document.documentElement.webkitRequestFullscreen) {
					// @ts-ignore
					document.documentElement.webkitRequestFullscreen(Element.ALLOW_KEYBOARD_INPUT);
				}
			} else {
				isFullScreenMode = true;
				// @ts-ignore
				if (document.cancelFullScreen) {
					// @ts-ignore
					document.cancelFullScreen();
				// @ts-ignore
				} else if (document.mozCancelFullScreen) {
					// @ts-ignore
					document.mozCancelFullScreen();
				// @ts-ignore
				} else if (document.webkitCancelFullScreen) {
					// @ts-ignore
					document.webkitCancelFullScreen();
				}
			}
		}
	}
</script>

<div class="ms-1 hidden lg:inline-block">
	<button
		onclick={toggleFullscreen}
		class="inline-flex h-[var(--header-height)] cursor-pointer items-center px-3 text-gray-600 transition-colors hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700"
		aria-label="Toggle fullscreen"
	>
		<i class={isFullScreenMode ? 'bx bx-fullscreen text-[22px]' : 'bx bx-exit-fullscreen text-[22px]'}></i>
	</button>
</div>
