<script>
	import { debounce } from 'lodash';

	/**
	 * @type {{
	 *   value: string,
	 *   placeholder?: string,
	 *   disabled?: boolean,
	 *   loading?: boolean,
	 *   maxLength?: number,
	 *   onSearch?: (query: string) => Promise<string[]>,
	 *   onValueChange?: (value: string) => void
	 * }}
	 */
	let {
		value = $bindable(''),
		placeholder = '',
		disabled = false,
		loading = $bindable(false),
		maxLength = 2000,
		onSearch = (/** @type {string} */ query) => Promise.resolve([]),
		onValueChange
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
		onValueChange?.(value);
		await debouncedSearch(query);
	}

	/**
	 * @param {string} result
	 */
	function selectResult(result) {
		value = result;
		onValueChange?.(value);
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

<div class="scrollable-dropdown">
	<div class="remote-search-field">
		<i class="bx bx-search-alt remote-search-prefix"></i>
		<input
			type="text"
			class="remote-search-input"
			bind:value
			oninput={handleInput}
			maxlength={maxLength}
			{disabled}
			{placeholder}
		/>
	</div>
	{#if isOpen && (searchResults.length > 0 || loading)}
		<ul class="remote-search-menu thin-scrollbar">
			{#if loading}
				<li class="remote-search-loading">
					<span class="remote-search-spinner" role="status" aria-label="Loading"></span>
				</li>
			{:else}
				{#each searchResults as item, index (index)}
					<li>
						<button
							type="button"
							class="remote-search-result"
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

<style>
	/* ============================================================
	   RemoteSearchInput — self-contained baseline styling.
	   Page-level :global() overrides (.conv-state-search,
	   .instruct-state-search) still win where present via their
	   higher-specificity ancestor selectors.
	   ============================================================ */

	.scrollable-dropdown {
		position: relative;
	}

	.remote-search-field {
		position: relative;
	}

	.remote-search-prefix {
		position: absolute;
		left: 0.625rem;
		top: 50%;
		transform: translateY(-50%);
		display: inline-flex;
		align-items: center;
		justify-content: center;
		font-size: 1rem;
		line-height: 1;
		color: rgb(156 163 175);
		pointer-events: none;
		z-index: 1;
	}

	/* Override Bootstrap form-control to match the migrated input look. */
	.remote-search-input {
		width: 100%;
		height: 2.5rem;
		padding: 0 0.75rem 0 2rem;
		margin: 0;
		border: 1px solid rgb(229 231 235);
		border-radius: 0.375rem;
		background-color: rgb(255 255 255);
		font-size: 0.875rem;
		line-height: 1.5;
		color: rgb(31 41 55);
		transition: border-color 0.15s ease, box-shadow 0.15s ease;
	}
	.remote-search-input::placeholder {
		color: var(--color-muted);
		opacity: 1;
	}
	.remote-search-input:focus {
		outline: 0;
		border-color: var(--color-primary);
		box-shadow: 0 0 0 1px var(--color-primary);
	}
	.remote-search-input:disabled {
		background-color: rgb(249 250 251);
		color: var(--color-muted);
		cursor: not-allowed;
		opacity: 0.7;
	}

	/* Dropdown panel — same soft shadow / radius vocabulary as Select.
	   Replaces the Bootstrap-supplied .dropdown-menu / .dropdown-item pair. */
	.remote-search-menu {
		list-style: none;
		margin: 0.25rem 0 0;
		padding: 0.25rem;
		border: 1px solid rgb(229 231 235);
		border-radius: 0.5rem;
		background-color: rgb(255 255 255);
		box-shadow:
			0 10px 25px -5px rgb(0 0 0 / 0.1),
			0 8px 10px -6px rgb(0 0 0 / 0.05);
		width: 100%;
		max-height: 260px;
		overflow-y: auto;
		scrollbar-width: thin;
		position: absolute;
		left: 0;
		right: 0;
		z-index: 99;
	}

	.remote-search-result {
		display: block;
		width: 100%;
		padding: 0.375rem 0.625rem;
		margin: 0;
		border: 0;
		border-radius: 0.25rem;
		background-color: transparent;
		color: rgb(31 41 55);
		font-size: 0.8125rem;
		line-height: 1.4;
		text-align: left;
		cursor: pointer;
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
		transition: background-color 0.12s ease, color 0.12s ease;
	}
	.remote-search-result:hover,
	.remote-search-result.active {
		background-color: rgb(243 244 246);
		color: var(--color-primary);
	}

	.remote-search-loading {
		display: flex;
		align-items: center;
		justify-content: center;
		padding: 0.5rem;
	}

	/* CSS-only spinner — replaces Bootstrap's `.spinner-border .spinner-border-sm`
	   so the component no longer depends on Bootstrap's keyframes. */
	.remote-search-spinner {
		display: inline-block;
		width: 1rem;
		height: 1rem;
		border: 2px solid color-mix(in srgb, var(--color-primary) 25%, transparent);
		border-top-color: var(--color-primary);
		border-radius: 50%;
		animation: remote-search-spin 0.75s linear infinite;
	}
	@keyframes remote-search-spin {
		to { transform: rotate(360deg); }
	}
</style>
