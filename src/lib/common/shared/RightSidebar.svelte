<script>
	import 'overlayscrollbars/overlayscrollbars.css';
	import { OverlayScrollbars } from 'overlayscrollbars';
	import { onMount } from 'svelte';

	/**
	 * @type {{
	 *   sidebarColor?: string,
	 *   topbarColor?: string,
	 *   layoutWidth?: string,
	 *   layoutMode?: string,
	 *   sidebarSize?: string,
	 *   closebar: () => void
	 * }}
	 */
	let {
		sidebarColor = 'dark',
		topbarColor = 'light',
		layoutWidth = 'fluid',
		layoutMode = 'light',
		sidebarSize = 'icon',
		closebar
	} = $props();

	const options = {
		scrollbars: {
			visibility: 'auto', // You can adjust the visibility ('auto', 'hidden', 'visible')
			autoHide: 'move', // You can adjust the auto-hide behavior ('move', 'scroll', false)
			autoHideDelay: 100,
			dragScroll: true,
			clickScroll: false,
			theme: 'os-theme-dark',
			pointers: ['mouse', 'touch', 'pen']
		}
	};

	/**
	 * @param {string} attribute
	 * @param {string} value
	 */
	function changeBodyAttribute(attribute, value) {
		if (document.body) document.body.setAttribute(attribute, value);

		if(attribute == "data-sidebar-size"){
			if(value == "icon"){
				document.body.classList.add('vertical-collpsed');
			}else{
				document.body.classList.remove('vertical-collpsed');
			}

			if (document.body.classList.contains('vertical-collpsed')) {
			if (document.querySelector('#vertical-menu')) {
				// @ts-ignore
				const Instance = OverlayScrollbars(document.querySelector('#vertical-menu'));
				if (Instance) {
					Instance.destroy();
				}
			}
		} else {
			const options = {
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
			const menuElement = document.querySelector('#vertical-menu');
			if (menuElement) {
				// @ts-ignore
				OverlayScrollbars(menuElement, options);
			}
		}
		}
	}

	/**
	 * @param {string} attribute
	 * @param {string} value
	 */
	function changeLayoutMode(attribute, value) {
		if (document.documentElement) document.documentElement.setAttribute(attribute, value);
	}

	/**
	 * @param {string} attribute
	 * @param {string} value
	 */
	function changeLayoutwidth(attribute, value) {
		if (document.body) document.body.setAttribute(attribute, value);
		if (value == 'boxed') {
			document.body.classList.add('vertical-collpsed');
		} else {
			document.body.classList.remove('vertical-collpsed');
		}

		if (document.body.classList.contains('vertical-collpsed')) {
			if (document.querySelector('#vertical-menu')) {
				// @ts-ignore
				const Instance = OverlayScrollbars(document.querySelector('#vertical-menu'));
				if (Instance) {
					Instance.destroy();
				}
			}
		} else {
			const options = {
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
			const menuElement = document.querySelector('#vertical-menu');
			if (menuElement) {
				// @ts-ignore
				OverlayScrollbars(menuElement, options);
			}
		}
	}

	onMount(() => {
		const menuElement = document.querySelector('#right-bar');
		// @ts-ignore
		OverlayScrollbars(menuElement, options);

		changeBodyAttribute('data-sidebar', sidebarColor);
		changeBodyAttribute('data-topbar', topbarColor);
		changeBodyAttribute('data-sidebar-size', sidebarSize);
		changeLayoutwidth('data-layout-size', layoutWidth);
		changeLayoutMode('data-bs-theme', layoutMode);
		setTimeout(() => {
			if (document.body.getAttribute('data-layout') == 'horizontal') {
				// @ts-ignore
				document.getElementById('sidebaroption').style.display = 'none';
			} else {
				// @ts-ignore
				document.getElementById('sidebaroption').style.display = 'block';
			}
		}, 500);
	});
</script>

<div class="right-bar">
	<div class="h-100" id="right-bar">
		<div class="rightbar-title d-flex align-items-center px-3 py-4">
			<h5 class="m-0 me-2">Settings</h5>

			<!-- svelte-ignore a11y_invalid_attribute -->
			<a href="javascript:void(0);" class="right-bar-toggle ms-auto" aria-label="Close settings" onclick={closebar}>
				<i class="mdi mdi-close noti-icon"></i>
			</a>
		</div>
		<!-- Sidebar Color -->
		<div class="p-4" id="sidebaroption">
			<h6 class="mb-3">Sidebar Color</h6>
			<hr class="mt-0" />

			<div class="form-check form-switch mb-3">
				<input
					class="form-check-input theme-choice"
					type="radio"
					name="sidebar-color"
					id="sidebar-color-light"
					checked={sidebarColor == 'light'}
					onchange={() => changeBodyAttribute('data-sidebar', 'light')}
				/>
				<label class="form-check-label" for="sidebar-color-light">Light</label>
			</div>
			<div class="form-check form-switch mb-3">
				<input
					class="form-check-input theme-choice"
					type="radio"
					name="sidebar-color"
					id="sidebar-color-dark"
					checked={sidebarColor == 'dark'}
					onchange={() => changeBodyAttribute('data-sidebar', 'dark')}
				/>
				<label class="form-check-label" for="sidebar-color-dark">Dark</label>
			</div>
			<div class="form-check form-switch">
				<input
					class="form-check-input theme-choice"
					type="radio"
					name="sidebar-color"
					id="sidebar-color-colored"
					checked={sidebarColor == 'colored'}
					onchange={() => changeBodyAttribute('data-sidebar', 'colored')}
				/>
				<label class="form-check-label" for="sidebar-color-colored">Colored</label>
			</div>
		</div>
		
		<!-- Sidebar Size -->
		<div class="p-4" id="sidebarsizeoption">
			<h6 class="mb-3">Sidebar Size</h6>
			<hr class="mt-0" />

			<div class="form-check form-switch mb-3">
				<input
					class="form-check-input theme-choice"
					type="radio"
					name="sidebar-size"
					id="sidebar-size-light"
					checked={sidebarSize == 'fluid'}
					onchange={() => changeBodyAttribute('data-sidebar-size', 'fluid')}
				/>
				<label class="form-check-label" for="sidebar-size-fluid">Fluid</label>
			</div>
			<div class="form-check form-switch mb-3">
				<input
					class="form-check-input theme-choice"
					type="radio"
					name="sidebar-size"
					id="sidebar-size-small"
					checked={sidebarSize == 'small'}
					onchange={() => changeBodyAttribute('data-sidebar-size', 'small')}
				/>
				<label class="form-check-label" for="sidebar-size-small">Compact</label>
			</div>
			<div class="form-check form-switch">
				<input
					class="form-check-input theme-choice"
					type="radio"
					name="sidebar-size"
					id="sidebar-size-icon"
					checked={sidebarSize == 'icon'}
					onchange={() => changeBodyAttribute('data-sidebar-size', 'icon')}
				/>
				<label class="form-check-label" for="sidebar-size-icon">Icon</label>
			</div>
		</div>

		<!-- Topbar Theme -->
		<div class="p-4">
			<h6 class=" mb-3">Topbar Theme</h6>
			<hr class="mt-0" />

			<div class="form-check form-switch mb-3">
				<input
					class="form-check-input theme-choice"
					type="radio"
					name="topbar-color"
					id="topbar-color-light"
					checked={topbarColor == 'light'}
					onchange={() => changeBodyAttribute('data-topbar', 'light')}
				/>
				<label class="form-check-label" for="topbar-color-light">Light</label>
			</div>
			<div class="form-check form-switch">
				<input
					class="form-check-input theme-choice"
					type="radio"
					name="topbar-color"
					id="topbar-color-dark"
					checked={topbarColor == 'dark'}
					onchange={() => changeBodyAttribute('data-topbar', 'dark')}
				/>
				<label class="form-check-label" for="topbar-color-dark">Dark</label>
			</div>
		</div>

		<!-- Layout Width -->
		<div class="p-4">
			<h6 class=" mb-3">Layout Width</h6>
			<hr class="mt-0" />

			<div class="form-check form-switch mb-3">
				<input
					class="form-check-input theme-choice"
					type="radio"
					name="layout-width"
					id="layout-width-fluid"
					checked={layoutWidth == 'fluid'}
					onchange={() => changeLayoutwidth('data-layout-size', 'fluid')}
				/>
				<label class="form-check-label" for="layout-width-fluid">Fluid</label>
			</div>
			<div class="form-check form-switch mb-3">
				<input
					class="form-check-input theme-choice"
					type="radio"
					name="layout-width"
					id="layout-width-boxed"
					checked={layoutWidth == 'boxed'}
					onchange={() => changeLayoutwidth('data-layout-size', 'boxed')}
				/>
				<label class="form-check-label" for="layout-width-boxed">Boxed</label>
			</div>
			<div class="form-check form-switch mb-3">
				<input
					class="form-check-input theme-choice"
					type="radio"
					name="layout-width"
					id="layout-width-boxed"
					checked={layoutWidth == 'scrollable'}
					onchange={() => changeLayoutwidth('data-layout-scrollable', 'true')}
				/>
				<label class="form-check-label" for="layout-width-scrollable">Scrollable</label>
			</div>
		</div>

		<!-- Settings -->
		<hr class="mt-0" />
		<h6 class="text-center mb-0">Choose Layouts</h6>

		<div class="p-4">
			<div class="mb-2">
				<img src='images/layouts/layout-1.jpg' class="img-thumbnail" alt="layout images" />
			</div>

			<div class="form-check form-switch mb-3">
				<input
					class="form-check-input theme-choice"
					type="radio"
					name="layout-mode"
					id="layout-mode-light"
					checked={layoutMode == 'light'}
					onchange={() => changeLayoutMode('data-bs-theme', 'light')}
				/>
				<label class="form-check-label" for="layout-mode-light">Light</label>
			</div>

			<div class="mb-2">
				<img src='images/layouts/layout-2.jpg' class="img-thumbnail" alt="layout images" />
			</div>
			<div class="form-check form-switch mb-3">
				<input
					class="form-check-input theme-choice"
					type="radio"
					name="layout-mode"
					id="layout-mode-dark"
					checked={layoutMode == 'dark'}
					onchange={() => changeLayoutMode('data-bs-theme', 'dark')}
				/>
				<label class="form-check-label" for="layout-mode-dark">Dark</label>
			</div>
		</div>
	</div>
	<!-- end slimscroll-menu-->
</div>
<!-- /Right-bar -->

<!-- Right bar overlay-->
<!-- svelte-ignore a11y_click_events_have_key_events -->
<!-- svelte-ignore a11y_no_static_element_interactions -->
<div class="rightbar-overlay" onclick={closebar}></div>
