<script>
// @ts-nocheck

	import { onMount, afterUpdate } from 'svelte';
	import 'overlayscrollbars/overlayscrollbars.css';
	import { OverlayScrollbars } from 'overlayscrollbars';
	import Link from 'svelte-link';
	import { page } from '$app/stores';
	import { browser } from '$app/environment';
	import { _ } from 'svelte-i18n';
	import { globalEventStore } from '$lib/helpers/store';

	/** @type {import('$pluginTypes').PluginMenuDefModel[]} */
	export let menu;

	// after routing complete call afterUpdate function
	afterUpdate(() => {
		removeActiveDropdown();
		const curUrl = getPathUrl();
		if (curUrl) {
			let item = document.querySelector(".vertical-menu a[href='" + curUrl + "']");
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
			visibility: 'auto', // You can adjust the visibility ('auto', 'hidden', 'visible')
			autoHide: 'move', // You can adjust the auto-hide behavior ('move', 'scroll', false)
			autoHideDelay: 100,
			dragScroll: true,
			clickScroll: false,
			theme: 'os-theme-light',
			pointers: ['mouse', 'touch', 'pen']
		}
	};

	onMount(async () => {
		const menuElement = document.querySelector('#vertical-menu');
		OverlayScrollbars(menuElement, options);
		activeMenu();

		const curUrl = getPathUrl();
		if (curUrl) {
			let item = document.querySelector(".vertical-menu a[href='" + curUrl + "']");
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

	const menuItemScroll = () => {
		if (browser) {
			const curUrl = getPathUrl();
			let item = document.querySelector(".vertical-menu a[href='" + curUrl + "']")?.offsetTop;
			if (item && item > 300) {
				item = item - 300;
				const menuElement = document.getElementById('vertical-menu');
				menuElement?.scrollTo({
					top: item,
					behavior: 'smooth'
				});
			}
		}
	};

	const getPathUrl = () => {
		const path = $page.url.pathname;
		return path?.startsWith('/') ? path.substring(1) : path;
	};

	const goToPage = () => {
		globalEventStore.reset();
	}
</script>

<div class="vertical-menu">
	<div class="h-100" id="vertical-menu">
		<!--- Sidemenu -->
		<div id="sidebar-menu">
			<!-- Left Menu Start -->
			<ul class="metismenu list-unstyled" id="side-menu">
				{#each menu as item}
					{#if item.isHeader}
						<li class="menu-title" key="t-menu">{$_(item.label)}</li>
					{:else if item.subMenu}
						<li>
							<Link href={null} class="has-arrow waves-effect">
								<i class={item.icon} />
								<span>{$_(item.label)}</span>
							</Link>
							<ul class="sub-menu mm-collapse">
								{#each item.subMenu as subMenu}
									{#if subMenu.isChildItem}
										<li>
											<Link href="#" class="has-arrow waves-effect">
												<span>{$_(subMenu.label)}</span>
											</Link>
											<ul class="sub-menu mm-collapse">
												{#each subMenu.childItems as childItem}
													<li><Link href={childItem.link} on:click={() => goToPage()}>{$_(childItem.label)}</Link></li>
												{/each}
											</ul>
										</li>
									{:else}
										<li><Link href={subMenu.link} on:click={() => goToPage()}>{$_(subMenu.label)}</Link></li>
									{/if}
								{/each}
							</ul>
						</li>
					{:else}
						<li>
							<Link class="waves-effect" href={item.link} on:click={() => goToPage()} >
								<i class={item.icon} /> <span>{$_(item.label)}</span>
							</Link>
						</li>
					{/if}
				{/each}
			</ul>
		</div>
	</div>
</div>
