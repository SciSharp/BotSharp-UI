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

<div class="dropdown d-none d-lg-inline-block ms-1">
	<button onclick={toggleFullscreen} class="btn header-item noti-icon waves-effect" aria-label="Toggle fullscreen">
		<i class={isFullScreenMode ? 'bx bx-fullscreen fs-22' : 'bx bx-exit-fullscreen fs-22'}></i>
	</button>
</div>
