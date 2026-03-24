<script>
	import { onMount } from "svelte";
	import { setupI18n } from "$lib/helpers/i18n";
	import languages from "$lib/common/data/languages";
	import { clickoutsideDirective } from "$lib/helpers/directives";

	/** @type {string} */
	let selectedLang = $state('');

	let isOpen = $state(false);

	/** @param {string} lang */
	function handleLocaleChange(lang) {
		setupI18n({ withLocale: lang });
		selectedLang = lang;
		localStorage.setItem("I18N_LANGUAGE", lang);
		isOpen = false;
	}

	/** @param {any} e */
	function handleClickOutside(e) {
		const curNode = e.detail.currentNode;
		const targetNode = e.detail.targetNode;
		if (!curNode?.contains(targetNode)) {
			isOpen = false;
		}
	}

	onMount(() => {
		localStorage.getItem("I18N_LANGUAGE") || "en";
	});
</script>

<div
	class="dropdown d-inline-block"
	use:clickoutsideDirective
	onclickoutside={handleClickOutside}
>
	<button
		type="button"
		class="btn header-item"
		aria-label="Select language"
		onclick={() => (isOpen = !isOpen)}
	>
		<img
			src={languages.find(lang => lang.value === selectedLang)?.flag || 'images/flags/us.jpg'}
			alt="Language"
			height="16"
		/>
	</button>
	<div class="dropdown-menu language-switch dropdown-menu-end" class:show={isOpen}>
		{#each languages as language}
			<button
				type="button"
				class={`dropdown-item notify-item language ${
					selectedLang === language.value ? "active" : "none"
				}`}
				onclick={() => handleLocaleChange(language.value)}
			>
				<img
					src={language.flag}
					alt="Samply"
					class="me-2"
					height="12"
				/>
				<span class="align-middle">
					{language.label}
				</span>
			</button>
		{/each}
	</div>
</div>
