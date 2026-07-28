<script>
	import { onMount, tick } from 'svelte';
	import { browser } from '$app/environment';
	import { OverlayScrollbars } from 'overlayscrollbars';
	// Root-level route, so it has to mount the app shell itself — VerticalLayout is
	// otherwise only pulled in by /page/+layout.svelte, and without it this page would
	// render with no sidebar or header.
	import VerticalLayout from '../VerticalLayout/Index.svelte';

	let { children } = $props();

	// Same options the sidebar itself uses; re-initialising with anything else would
	// leave the scrollbar looking different after a visit here.
	const SCROLLBAR_OPTIONS = {
		scrollbars: {
			visibility: 'auto',
			autoHide: 'move',
			autoHideDelay: 100,
			dragScroll: true,
			clickScroll: false,
			theme: 'os-theme-light',
			pointers: ['mouse', 'touch', 'pen']
		}
	};

	/** @param {boolean} collapsed */
	function setSidebarCollapsed(collapsed) {
		if (!browser) return;

		document.body.classList.toggle('vertical-collpsed', collapsed);
		document.body.classList.toggle('sidebar-enable', collapsed);

		// The collapsed rail has nothing to scroll, and leaving a live OverlayScrollbars
		// instance on it leaves a stray scrollbar over the icons.
		const menuElement = document.querySelector('#vertical-menu');
		if (!menuElement) return;
		if (collapsed) {
			// @ts-ignore — OverlayScrollbars(el) returns the existing instance, if any.
			OverlayScrollbars(menuElement)?.destroy();
		} else {
			// @ts-ignore
			OverlayScrollbars(menuElement, SCROLLBAR_OPTIONS);
		}
	}

	onMount(() => {
		let collapsedByUs = false;

		(async () => {
			// Deferred one tick on purpose. Sidebar.svelte runs an effect on mount that
			// expands the sidebar for any non-embed page; collapsing before that runs
			// would simply be undone. Costs one frame of the expanded menu.
			await tick();

			if (!document.body.classList.contains('vertical-collpsed')) {
				setSidebarCollapsed(true);
				collapsedByUs = true;
			}
		})();

		return () => {
			// Restore only what we changed. Someone who keeps the menu collapsed
			// everywhere should not find it expanded on the way out, and someone who
			// expanded it by hand while here has made a choice worth respecting.
			if (collapsedByUs && document.body.classList.contains('vertical-collpsed')) {
				setSidebarCollapsed(false);
			}
		};
	});
</script>

<VerticalLayout footer={false} loader={false}>
	{@render children?.()}
</VerticalLayout>
