<script>
	import { debounce } from 'lodash';

	/**
	 * @type {{
	 *   value: string,
	 *   placeholder?: string,
	 *   disabled?: boolean,
	 *   loading?: boolean,
	 *   maxLength?: number,
	 *   onSearch?: (query: string) => Promise<string[]>
	 * }}
	 */
	let {
		value = $bindable(''),
		placeholder = '',
		disabled = false,
		loading = $bindable(false),
		maxLength = 2000,
		onSearch = (/** @type {string} */ query) => Promise.resolve([])
	} = $props();

	/** @type {string[]} */
	let searchResults = $state([]);
	let isOpen = $state(false);

	export const clearSearchResults = () => {
		searchResults = [];
	};

	// @ts-ignore
	const debouncedSearch = debounce(async (/** @type {string} */ query) => {
		if (query.length) {
			loading = true;
			searchResults = await onSearch(query);
			loading = false;
		} else {
			searchResults = [];
			isOpen = false;
		}
	}, 500);

	/**
	 * @param {any} e
	 */
	async function handleInput(e) {
		const query = e.target.value;
		isOpen = true;
		value = query;
		await debouncedSearch(query);
	}

	/**
	 * @param {string} result
	 */
	function selectResult(result) {
		value = result;
		isOpen = false;
	}

	/**
	 * @param {MouseEvent} e
	 */
	function handleClickOutside(e) {
		const target = /** @type {HTMLElement} */ (e.target);
		if (!target.closest('.scrollable-dropdown')) {
			isOpen = false;
		}
	}
</script>

<svelte:document onclick={handleClickOutside} />

<div class="position-relative scrollable-dropdown">
	<div>
		<input type="text" class="form-control" bind:value oninput={handleInput} maxlength={maxLength} {disabled} {placeholder} />
	</div>
	{#if isOpen && (searchResults.length > 0 || loading)}
		<ul class="dropdown-menu show w-100 thin-scrollbar">
			{#if loading}
				<li class="text-center">
					<div class="spinner-border spinner-border-sm" role="status">
						<span class="visually-hidden">Loading...</span>
					</div>
				</li>
			{:else}
				{#each searchResults as item, index (index)}
					<li>
						<button
							type="button"
							class="dropdown-item"
							class:active={value === item}
							title={item}
							onclick={() => selectResult(item)}
						>
							{item}
						</button>
					</li>
				{/each}
			{/if}
		</ul>
	{/if}
</div>
