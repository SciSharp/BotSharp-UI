<script>
	import { onMount, tick } from 'svelte';
	import { browser } from '$app/environment';
	import { goto, afterNavigate } from '$app/navigation';
	import { page } from '$app/stores';
	import { _ } from 'svelte-i18n';
	import 'overlayscrollbars/overlayscrollbars.css';
	import { OverlayScrollbars } from 'overlayscrollbars';
	import { globalEventStore } from '$lib/helpers/store';
	import { getCleanUrl } from '$lib/helpers/utils/common';

	/**
	 * @type {{
	 *   menu: import('$pluginTypes').PluginMenuDefModel[]
	 * }}
	 */
	let { menu } = $props();

	// after routing complete, update active menu state
	afterNavigate(async () => {
		await tick();
		removeActiveDropdown();
		const curUrl = getCleanUrl($page.url.pathname);
		if (curUrl) {
			const item = document.querySelector(".vertical-menu a[id='" + curUrl + "']");
			if (item) {
				item.classList.add('mm-active');
				const parent1 = item.parentElement;
				if (parent1) {
					parent1.classList.add('mm-active');
					const parent2 = parent1.parentElement;
					if (parent2) {
						parent2.classList.add('mm-show');
						parent2.classList.remove('mm-collapse');
						if (parent2.previousElementSibling) {
							parent2.previousElementSibling.classList.add('mm-active');
							if (!parent2.previousElementSibling.classList.contains('revert-arrow')) {
								parent2.previousElementSibling.classList.add('revert-arrow');
							}
						}
						const parent3 = parent2.parentElement?.parentElement;
						if (parent3) {
							parent3.classList.add('mm-show');
							parent3.classList.remove('mm-collapse');
							if (parent3.previousElementSibling) {
								parent3.previousElementSibling.classList.add('mm-active');
							}
						}
					}
				}
			}
		}
	});

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

	let isEmbeddingPage = $derived(!!$page.params.embed && !!$page.params.embedType);

	$effect(() => {
		if (browser) {
			toggleEmbedPageSidebar(isEmbeddingPage);
		}
	});

	onMount(async () => {
		let scrollbarInstance = null;
		const menuElement = document.querySelector('#vertical-menu');
		// @ts-ignore
		if (menuElement && !isEmbeddingPage) {
			// @ts-ignore
			scrollbarInstance = OverlayScrollbars(menuElement, options);
		}

		activeMenu();
		setupCollapsedMenuPositioning();

		const curUrl = getCleanUrl($page.url.pathname);
		if (curUrl) {
			const item = document.querySelector(".vertical-menu a[id='" + curUrl + "']");
			if (item) {
				item.classList.add('mm-active');
				item.scrollIntoView({ behavior: 'smooth', block: 'center' });
				const parent1 = item.parentElement;
				if (parent1) {
					parent1.classList.add('mm-active');
					const parent2 = parent1.parentElement;
					if (parent2) {
						parent2.classList.add('mm-show');
						parent2.classList.remove('mm-collapse');
						if (parent2.previousElementSibling) {
							parent2.previousElementSibling.classList.add('mm-active');
							if (!parent2.previousElementSibling.classList.contains('revert-arrow')) {
								parent2.previousElementSibling.classList.add('revert-arrow');
							}
						}
						const parent3 = parent2.parentElement?.parentElement;
						if (parent3) {
							parent3.classList.add('mm-show');
							parent3.classList.remove('mm-collapse');
							if (parent3.previousElementSibling) {
								parent3.previousElementSibling.classList.add('mm-active');
							}
						}
					}
				}
			}
		}

		// menuItemScroll()
	});

	const setupCollapsedMenuPositioning = () => {
		if (!browser) return;

		const sideMenu = document.querySelector('#side-menu');
		if (!sideMenu) return;

		// Position fixed submenus on hover when sidebar is collapsed
		sideMenu.querySelectorAll(':scope > li').forEach((li) => {
			li.addEventListener('mouseenter', () => {
				if (!document.body.classList.contains('vertical-collpsed')) return;

				const submenu = li.querySelector(':scope > ul.sub-menu');
				if (submenu) {
					const rect = li.getBoundingClientRect();
					// @ts-ignore
					submenu.style.top = `${rect.top}px`;
				}
			});
		});

		// Position nested submenus
		sideMenu.querySelectorAll('.sub-menu li').forEach((li) => {
			li.addEventListener('mouseenter', () => {
				if (!document.body.classList.contains('vertical-collpsed')) return;

				const nestedSubmenu = li.querySelector(':scope > ul.sub-menu');
				if (nestedSubmenu) {
					const rect = li.getBoundingClientRect();
					// @ts-ignore
					nestedSubmenu.style.top = `${rect.top}px`;
				}
			});
		});
	};

	const activeMenu = () => {
		if (browser) {
			document.querySelectorAll('.vertical-menu .has-arrow').forEach((menu) => {
				menu.addEventListener('click', () => {
					if (menu.nextElementSibling) {
						let activeLinks = 0;
						const links = menu.nextElementSibling.querySelectorAll('li a');
						links.forEach((x) => (activeLinks += Number(x.classList.contains('mm-active'))));
						if (activeLinks > 0) {
							menu.classList.add('mm-active');
						}

						if (menu.nextElementSibling.classList.contains('mm-collapse')) {
							menu.nextElementSibling.classList.remove('mm-collapse');
							menu.nextElementSibling.classList.add('mm-show');
							menu.classList.add('revert-arrow');
						} else {
							menu.nextElementSibling.classList.add('mm-collapse');
							menu.nextElementSibling.classList.remove('mm-show');
							menu.classList.remove('revert-arrow');
						}
					}
				});
			});

			
			document.querySelectorAll('.sub-menu a').forEach((submenu) => {
				submenu.addEventListener('click', () => {
					removeActiveDropdown();
					submenu.classList.add('mm-active');
					if (submenu.nextElementSibling) {
						submenu.nextElementSibling.classList.add('mm-show');
					}
					if (submenu.parentElement) {
						submenu.parentElement.classList.add('mm-active');
						const parent1 = submenu.parentElement.parentElement;
						if (parent1) {
							parent1.classList.add('mm-show');
							if (parent1.previousElementSibling) {
								parent1.previousElementSibling.classList.add('mm-active');
							}

							const parent2 = parent1.parentElement?.parentElement;
							if (parent2) {
								parent2.classList.add('mm-show');
								if (parent2.previousElementSibling) {
									parent2.previousElementSibling.classList.add('mm-active');
								}
							}
						}
					}
				});
			});
		}
	};

	const removeActiveDropdown = () => {
		document.querySelectorAll('.vertical-menu .has-arrow').forEach((menu) => {
			if (menu.nextElementSibling) {
				if (!menu.nextElementSibling.classList.contains('mm-collapse')) {
					menu.nextElementSibling.classList.add('mm-collapse');
				}
				menu.nextElementSibling.classList.remove('mm-show');
				menu.classList.remove('mm-active');
				menu.classList.remove('revert-arrow');
			}
		});

		document.querySelectorAll('.sub-menu a').forEach((submenu) => {
			submenu.classList.remove('mm-active');
			if (submenu.parentElement) {
				submenu.parentElement.classList.remove('mm-active');
			}
		});

		document.querySelectorAll('.vertical-menu .mm-active').forEach((menu) => {
			menu.querySelectorAll('.mm-active').forEach((child) => child.classList.remove('mm-active'));
			menu.classList.remove('mm-active');
		});
	};

	/** @param {boolean} isEmbeddingPage */
	const toggleEmbedPageSidebar = (isEmbeddingPage) => {
		const menuElement = document.querySelector('#vertical-menu');
		if (isEmbeddingPage && !document.body.classList.contains('vertical-collpsed')) {
			document.body.classList.add('vertical-collpsed');
			document.body.classList.add('sidebar-enable');

			if (menuElement) {
				// @ts-ignore
				const instance = OverlayScrollbars(menuElement, options);
				if (instance) {
					instance.destroy();
				}
			}
		} else if (!isEmbeddingPage && document.body.classList.contains('vertical-collpsed')) {
			document.body.classList.remove('vertical-collpsed');
			document.body.classList.remove('sidebar-enable');

			if (menuElement) {
				// @ts-ignore
				OverlayScrollbars(menuElement, options);
			}
		}
	}

	/** @param {string} url */
	const goToPage = (url) => {
		if (!url) {
			return;
		}

		url = getCleanUrl(url);
		if (url === getCleanUrl($page.url.pathname)) {
			return;
		}

		globalEventStore.reset();
		goto(url);
	}
</script>

<div
	class="vertical-menu fixed bottom-0 left-0 top-[var(--header-height)] z-[1001] w-[var(--sidebar-width)] bg-[var(--sidebar-bg)] shadow-sm transition-[width,transform] duration-200 dark:bg-gray-800"
>
	<div class="h-full" id="vertical-menu">
		<!--- Sidemenu -->
		<div id="sidebar-menu" class="pt-2.5 pb-8">
			<!-- Left Menu Start -->
			<ul class="metismenu m-0 list-none p-0" id="side-menu">
				{#each menu as item}
					{#if item.isHeader}
						<li class="menu-title px-5 py-3 text-[11px] font-semibold uppercase tracking-wider text-[var(--sidebar-menu-title-color)]" key="t-menu">
							{$_(item.label)}
						</li>
					{:else if item.subMenu}
						<li>
							<!-- svelte-ignore a11y_invalid_attribute -->
							<a href="javascript:void(0);" class="has-arrow clickable">
								<i class={item.icon}></i>
								<span>{$_(item.label)}</span>
							</a>
							<ul class="sub-menu mm-collapse">
								{#each item.subMenu as subMenu}
									{#if subMenu.isChildItem}
										<li>
											<!-- svelte-ignore a11y_invalid_attribute -->
											<a href="javascript:void(0);" class="has-arrow clickable">
												<span>{$_(subMenu.label)}</span>
											</a>
											<ul class="sub-menu mm-collapse">
												{#each subMenu.childItems as childItem}
													<li>
														<!-- svelte-ignore a11y_invalid_attribute -->
														<a href="javascript:void(0);" class="clickable" id={getCleanUrl(childItem.link)} onclick={() => goToPage(childItem.link)}>
															{$_(childItem.label)}
														</a>
													</li>
												{/each}
											</ul>
										</li>
									{:else}
										<li>
											<!-- svelte-ignore a11y_invalid_attribute -->
											<a href="javascript:void(0);" class="clickable" id={getCleanUrl(subMenu.link)} onclick={() => goToPage(subMenu.link)}>
												{$_(subMenu.label)}
											</a>
										</li>
									{/if}
								{/each}
							</ul>
						</li>
					{:else}
						<li>
							<!-- svelte-ignore a11y_invalid_attribute -->
							<a href="javascript:void(0);" class="clickable" id={getCleanUrl(item.link)} onclick={() => goToPage(item.link)}>
								<i class={item.icon}></i>
								<span>{$_(item.label)}</span>
							</a>
						</li>
					{/if}
				{/each}
			</ul>
		</div>
	</div>
</div>

<style>
	/* Sidebar menu styling. These rules use :global() because the menu structure
	   is generated dynamically and the JS adds/removes mm-active, mm-show, etc. */

	:global(#sidebar-menu ul li a) {
		display: block;
		padding: 0.625rem 1.5rem;
		color: var(--sidebar-menu-item-color);
		position: relative;
		font-size: 13px;
		line-height: 1.5;
		transition: color 0.2s, background-color 0.2s;
		cursor: pointer;
	}

	:global(#sidebar-menu ul li a i) {
		display: inline-block;
		min-width: 1.75rem;
		padding-bottom: 0.125em;
		font-size: 1.25rem;
		line-height: 1.40625rem;
		vertical-align: middle;
		color: var(--sidebar-menu-item-icon-color);
		transition: color 0.2s;
	}

	:global(#sidebar-menu ul li a:hover),
	:global(#sidebar-menu ul li a:hover i) {
		color: var(--sidebar-menu-item-hover-color);
	}

	/* Has-arrow chevron */
	:global(#sidebar-menu .has-arrow:after) {
		content: "\F0140";
		font-family: 'Material Design Icons';
		display: block;
		float: right;
		transition: transform 0.2s;
		font-size: 1rem;
	}

	:global(#sidebar-menu .revert-arrow:after),
	:global(#sidebar-menu .mm-active > .has-arrow:after) {
		transform: rotate(-180deg);
	}

	/* Submenu collapse/expand */
	:global(#sidebar-menu .sub-menu) {
		padding: 0;
		list-style: none;
	}

	:global(#sidebar-menu .sub-menu.mm-collapse) {
		display: none;
	}

	:global(#sidebar-menu .sub-menu.mm-show) {
		display: block;
		background-color: rgba(0, 0, 0, 0.02);
	}

	:global(#sidebar-menu .sub-menu li a) {
		padding: 0.4rem 1.5rem 0.4rem 3.5rem;
		font-size: 13px;
	}

	:global(#sidebar-menu .sub-menu li a:hover) {
		background-color: rgba(0, 0, 0, 0.03);
	}

	:global(#sidebar-menu .sub-menu .sub-menu li a) {
		padding: 0.4rem 1.5rem 0.4rem 4.5rem;
	}

	/* Active state */
	:global(#sidebar-menu .mm-active),
	:global(#sidebar-menu .mm-active > a),
	:global(#sidebar-menu .mm-active > a i),
	:global(#sidebar-menu .mm-active .active),
	:global(#sidebar-menu .mm-active .active i) {
		color: var(--color-primary) !important;
	}

	/* Collapsed (icon-only) sidebar */
	:global(body.vertical-collpsed) .vertical-menu {
		width: var(--sidebar-collapsed-width);
	}

	:global(body.vertical-collpsed #sidebar-menu .menu-title),
	:global(body.vertical-collpsed #sidebar-menu .has-arrow:after),
	:global(body.vertical-collpsed #sidebar-menu > ul > li > a > span) {
		display: none;
	}

	/* Auto-hide any in-flow sub-menus when collapsed (mm-show carried over from
	   the expanded state would otherwise leak items into the 70px column).
	   The hover-to-show floating panel below overrides this with !important. */
	:global(body.vertical-collpsed #sidebar-menu .sub-menu) {
		display: none;
	}

	:global(body.vertical-collpsed #sidebar-menu > ul > li > a) {
		text-align: center;
		padding: 15px 0;
		transition: none;
	}

	/* --- Collapsed hover-to-show floating sub-menu --- */
	:global(body.vertical-collpsed #sidebar-menu > ul > li) {
		position: relative;
		white-space: nowrap;
	}

	/* Leaf items (no sub-menu): expand on hover to reveal the label inline */
	:global(body.vertical-collpsed #sidebar-menu > ul > li:not(:has(> ul.sub-menu)):hover > a) {
		width: calc(var(--sidebar-collapsed-width) + 200px);
		position: relative;
		z-index: 2;
		background-color: rgba(0, 0, 0, 0.025);
		color: var(--color-primary);
		text-align: left;
		padding: 15px 20px;
	}

	:global(body.vertical-collpsed #sidebar-menu > ul > li:not(:has(> ul.sub-menu)):hover > a > i) {
		color: var(--color-primary);
	}

	:global(body.vertical-collpsed #sidebar-menu > ul > li:not(:has(> ul.sub-menu)):hover > a > span) {
		display: inline;
		padding-left: 0.75rem;
	}

	/* Parent items (with sub-menu): just tint the icon — the floating panel does the work */
	:global(body.vertical-collpsed #sidebar-menu > ul > li:has(> ul.sub-menu):hover > a) {
		background-color: rgba(0, 0, 0, 0.025);
		color: var(--color-primary);
	}

	:global(body.vertical-collpsed #sidebar-menu > ul > li:has(> ul.sub-menu):hover > a > i) {
		color: var(--color-primary);
	}

	/* Floating sub-menu panel (first level under collapsed parent) */
	:global(body.vertical-collpsed #sidebar-menu > ul > li:hover > ul.sub-menu) {
		display: block !important;
		position: fixed;
		left: var(--sidebar-collapsed-width);
		width: 200px;
		height: auto;
		z-index: 9999;
		padding: 0.375rem 0;
		background-color: var(--sidebar-bg);
		border: 1px solid rgb(229 231 235);
		border-left: 0;
		border-radius: 0 0.375rem 0.375rem 0;
		box-shadow: 6px 6px 18px -4px rgba(54, 61, 71, 0.12);
	}

	/* Reset over-indented padding from the cascade so items fit the floating panel */
	:global(body.vertical-collpsed #sidebar-menu > ul > li:hover > ul.sub-menu li a) {
		padding: 0.5rem 1rem;
		width: 100%;
		text-align: left;
	}

	:global(body.vertical-collpsed #sidebar-menu > ul > li:hover > ul.sub-menu li a:hover) {
		background-color: rgba(0, 0, 0, 0.04);
		color: var(--color-primary);
	}

	/* Nested floating sub-menu (second level) */
	:global(body.vertical-collpsed #sidebar-menu > ul > li:hover > ul.sub-menu li:hover > ul.sub-menu) {
		display: block !important;
		position: fixed;
		left: calc(var(--sidebar-collapsed-width) + 200px);
		width: 200px;
		height: auto;
		z-index: 9999;
		padding: 0.375rem 0;
		background-color: var(--sidebar-bg);
		border: 1px solid rgb(229 231 235);
		border-radius: 0.375rem;
		box-shadow: 6px 6px 18px -4px rgba(54, 61, 71, 0.12);
	}

	:global(body.vertical-collpsed #sidebar-menu > ul > li:hover > ul.sub-menu li:hover > ul.sub-menu li a) {
		padding: 0.5rem 1rem;
		width: 100%;
	}

	/* Active state inside floating panel */
	:global(body.vertical-collpsed #sidebar-menu > ul > li:hover > ul.sub-menu .mm-active > a) {
		background-color: rgba(0, 0, 0, 0.04);
	}

	/* Mobile slide-in animation */
	@media (max-width: 1023.98px) {
		.vertical-menu {
			transition: transform 0.25s ease;
		}
	}
</style>
