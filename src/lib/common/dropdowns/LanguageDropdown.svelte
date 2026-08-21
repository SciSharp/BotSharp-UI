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
	class="relative inline-block"
	use:clickoutsideDirective
	onclickoutside={handleClickOutside}
>
	<button
		type="button"
		class="inline-flex h-[var(--header-height)] cursor-pointer items-center px-3 text-gray-600 transition-colors hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700"
		aria-label="Select language"
		onclick={() => (isOpen = !isOpen)}
	>
		<img
			src={languages.find(lang => lang.value === selectedLang)?.flag || 'images/flags/us.jpg'}
			alt="Language"
			class="h-4 w-auto"
		/>
	</button>
	{#if isOpen}
		<div class="absolute right-0 top-full z-[1000] mt-1 w-40 rounded-md border border-gray-200 bg-white py-1 shadow-lg dark:border-gray-700 dark:bg-gray-800">
			{#each languages as language}
				<button
					type="button"
					class={`flex w-full cursor-pointer items-center px-4 py-2 text-sm transition-colors hover:bg-gray-100 dark:hover:bg-gray-700 ${
						selectedLang === language.value
							? 'bg-gray-50 text-primary dark:bg-gray-700'
							: 'text-gray-700 dark:text-gray-200'
					}`}
					onclick={() => handleLocaleChange(language.value)}
				>
					<img src={language.flag} alt={language.label} class="me-2 h-3 w-auto" />
					<span class="align-middle">
						{language.label}
					</span>
				</button>
			{/each}
		</div>
	{/if}
</div>
