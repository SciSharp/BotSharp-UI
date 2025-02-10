<script>
  import { Input, Dropdown, DropdownMenu, DropdownItem, Spinner, DropdownToggle } from '@sveltestrap/sveltestrap';
  import { debounce } from 'lodash';
  
  /** @type {{id: string, name: string} | null} */
  export let selectedValue;
  export let disabled = false;
  export let placeholder = '';
   /**

 * @type {(arg0: any) => any[] | PromiseLike<any[]>}
 */
  export let onSearch;
  export let loading = false;

  /** @type {any[]} */
  let searchResults = [];
  let isOpen = false;

  // @ts-ignore
  const debouncedSearch = debounce(async (query) => {
    if (query.length) {
      loading = true;
      searchResults = await onSearch(query);
      loading = false;
      isOpen = true;
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
    selectedValue = { id: query, name: query };
    await debouncedSearch(query);
  }

/**
 * @param {{ id: string; name: string; }} result
 */
  function selectResult(result) {
    selectedValue = result;
  }

  export function clearSearchResults() {
    searchResults = [];
  }

</script>

<div class="position-relative">
  <Dropdown class="scrollable-dropdown" isOpen={isOpen && (searchResults.length > 0 || loading)} toggle={() => isOpen = !isOpen}>
      <DropdownToggle tag="div">
          <Input
              type="text"
              value={selectedValue?.name}
              on:input={handleInput}
              {disabled}
              {placeholder}
          />
      </DropdownToggle>
      <DropdownMenu class="w-100">
          {#if loading}
              <DropdownItem>
                  <Spinner size="sm" />
              </DropdownItem>
          {:else}
              {#each searchResults as result, index}
                  <DropdownItem
                      active={selectedValue?.id === result.id}
                      on:click={() => selectResult(result)}
                      title={result.name}
                  >
                      {result.name}
                  </DropdownItem>
              {/each}
          {/if}
      </DropdownMenu>
  </Dropdown>
</div>