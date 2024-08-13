<script>
	import { searchKnowledge } from "$lib/services/knowledge-base-service";
  import { Button } from "@sveltestrap/sveltestrap";
  import LoadingDots from "$lib/common/LoadingDots.svelte";
	import KnowledgeSearchList from "./knowledge-search-list.svelte";
  import { KNOWLEDGE_COLLECTION } from "$lib/helpers/constants";
  import _ from "lodash";

  export let collection = KNOWLEDGE_COLLECTION;

  let text = "";
  let is_searching = false;
  let search_done = false;
  const max_length = 4096;
  const confidence = 0.5;

  /** @type {import('$types').KnowledgeRetrivalViewModel[]} */
  let search_results = [];

  function search() {
    search_results = [];
    is_searching = true;
    search_done = false;
    searchKnowledge({
      text: _.trim(text),
      confidence: confidence
    }, collection).then(res => {
      search_results = res || [];
    }).finally(() => {
      is_searching = false;
      search_done = true;
    });
  }

  /** @param {KeyboardEvent} e */
  function pressKey(e) {
    if ((e.key === 'Enter' && (!!e.shiftKey || !!e.ctrlKey)) || e.key !== 'Enter' || !!!_.trim(text) || is_searching) {
			return;
		}

		if (e.key === 'Enter') {
			e.preventDefault();
		}

    search();
  }
</script>

<div class="knowledge-search-container mb-4">
  <textarea
    class='form-control search-textarea'
    rows={5}
    maxlength={max_length}
    disabled={is_searching}
    placeholder={'Please type something here...'}
    bind:value={text}
    on:keydown={(e) => pressKey(e)}
  />
  <div class="text-secondary text-end text-count">
    {text?.length || 0}/{max_length}
  </div>

  <div class="mt-2 text-end">
    <Button
      color="primary"
      disabled={!text || _.trim(text).length === 0 || is_searching}
      on:click={() => search()}
    >
      {'Search'}
    </Button>
  </div>

  {#if is_searching}
    <div class="knowledge-loader mt-4">
      <LoadingDots duration={'1s'} size={12} gap={5} color={'var(--bs-primary)'} />
    </div>
  {:else if search_results?.length > 0}
    <KnowledgeSearchList list={search_results} />
  {:else if search_done}
    <div class="mt-2">
      <h4 class="text-secondary">{"Ehhh, no idea..."}</h4>
    </div>
  {/if}
</div>