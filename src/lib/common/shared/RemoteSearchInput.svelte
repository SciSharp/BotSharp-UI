<script>
	import {
		Input,
		Dropdown,
		DropdownMenu,
		DropdownItem,
		Spinner,
		DropdownToggle
	} from '@sveltestrap/sveltestrap';
	import { debounce } from 'lodash';

	/** @type {string} */
	export let value;
    /** @type {string} */
    export let placeholder = '';
    /** @type {boolean} */
	export let disabled = false;
	/** @type {boolean} */
	export let loading = false;
	/** @type {number} */
    export let maxLength = 2000;
    /** @type {(query: string) => Promise<string[]>} */
	export let onSearch = query => Promise.resolve([]);

    export const clearSearchResults = () => {
		searchResults = [];
	};

	/** @type {string[]} */
	let searchResults = [];
	let isOpen = false;

	// @ts-ignore
	const debouncedSearch = debounce(async (query) => {
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
	 * @param { string } result
	 */
	function selectResult(result) {
		value = result;
	}

	
</script>

<div class="position-relative">
	<Dropdown
		class="scrollable-dropdown"
		isOpen={isOpen && (searchResults.length > 0 || loading)}
		toggle={() => (isOpen = !isOpen)}
	>
		<DropdownToggle tag="div">
			<Input type="text" {value} on:input={handleInput} maxlength={maxLength} {disabled} {placeholder} />
		</DropdownToggle>
		<DropdownMenu class="w-100 thin-scrollbar">
			{#if loading}
				<li class="text-center"><Spinner size="sm" /></li>
			{:else}
				{#each searchResults as item, index}
					<DropdownItem
						active={value === item}
						title={item}
                        on:click={() => selectResult(item)}
					>
						{item}
					</DropdownItem>
				{/each}
			{/if}
		</DropdownMenu>
	</Dropdown>
</div>
