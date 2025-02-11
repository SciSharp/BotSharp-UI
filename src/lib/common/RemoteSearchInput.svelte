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
	export let disabled = false;
	export let placeholder = '';
	/**
	 * @type {(query: string) => Promise<({id: string; name: string} | string)[]>}
	 */
	export let onSearch;
	export let loading = false;

	/** @type {({id: string; name: string} | string)[]} */
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
	 * @param { {id: string; name: string} | string } result
	 */
	function selectResult(result) {
		value = typeof result === 'string' ? result : result?.id;
	}

	export function clearSearchResults() {
		searchResults = [];
	}
</script>

<div class="position-relative">
	<Dropdown
		class="scrollable-dropdown"
		isOpen={isOpen && (searchResults.length > 0 || loading)}
		toggle={() => (isOpen = !isOpen)}
	>
		<DropdownToggle tag="div">
			<Input type="text" {value} on:input={handleInput} {disabled} {placeholder} />
		</DropdownToggle>
		<DropdownMenu class="w-100">
			{#if loading}
				<li class="text-center"><Spinner size="sm" /></li>
			{:else}
				{#each searchResults as result, index}
					<DropdownItem
						active={value === (typeof result === 'string' ? result : result?.id)}
						on:click={() => selectResult(result)}
						title={typeof result === 'string' ? result : result?.name}
					>
						{typeof result === 'string' ? result : result?.name}
					</DropdownItem>
				{/each}
			{/if}
		</DropdownMenu>
	</Dropdown>
</div>
