<script>
	import { searchKnowledge } from "$lib/services/knowledge-base-service";
  import { Button } from "@sveltestrap/sveltestrap";
	import KnowledgeSearchList from "./knowledge-search-list.svelte";

  let text = "";
  const max_length = 4096;
  const confidence = 0.5;

  /** @type {import('$types').KnowledgeRetrivalViewModel[]} */
  let search_results = [];

  function search() {
    search_results = [];
    searchKnowledge({
      text: text,
      confidence: confidence
    }).then(res => {
      search_results = res || [];
    });
  }

  /** @param {KeyboardEvent} e */
  function pressKey(e) {
    if (e.key == 'Enter') {
      search();
    }
  }
</script>

<div class="knowledge-search-container mb-4">
  <textarea
    class='form-control search-textarea'
    rows={5}
    maxlength={max_length}
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
      disabled={!text || text?.length === 0}
      on:click={() => search()}
    >
      {'Search'}
    </Button>
  </div>

  {#if search_results.length !== 0}
    <KnowledgeSearchList list={search_results} />
  {/if}
</div>