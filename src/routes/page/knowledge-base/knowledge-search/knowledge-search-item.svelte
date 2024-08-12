<script>
  /** @type {import('$types').KnowledgeRetrivalViewModel} */
  export let item;
  
  /** @type {boolean} */
  export let open = false;

  const score_places = 3;

  function toggleItem() {
    open = !open;
  }
</script>

<!-- svelte-ignore a11y-click-events-have-key-events -->
<li class={`result-item ${open ? 'list-open' : 'list-closed'}`}>
  {#if open}
    {#if item?.data?.answer || item?.data?.text}
      <div>
        <!-- svelte-ignore a11y-no-static-element-interactions -->
        <div class="result-key fw-bold text-primary">
          <span class="clickable" on:click={() => toggleItem()}>
            {'Answer:'}
          </span>
        </div>
        <div class="result-content">{item?.data?.answer || item?.data?.text}</div>
      </div>
    {/if}

    <div class="result-score">
      <div class="result-key fw-bold text-primary">{'Score:'}</div>
      <div>{item?.score?.toFixed(score_places) || 'unknown'}</div>
    </div>
  {:else}
    <!-- svelte-ignore a11y-no-static-element-interactions -->
    <div class="result-key fw-bold text-primary">
      <span class="clickable" on:click={() => toggleItem()}>
        {'Answer...'}
      </span>
    </div>
  {/if}
</li>