<script>
  import { onMount } from 'svelte';
  import { _ } from 'svelte-i18n';
  import { Table, Button, Input } from "@sveltestrap/sveltestrap";
	import { getKnowledgeCollections, getKnowledgeData } from '$lib/services/knowledge-base-service';
  import { KNOWLEDGE_COLLECTION } from '$lib/helpers/constants';
	import LoadingToComplete from '$lib/common/LoadingToComplete.svelte';
	import Loader from '$lib/common/Loader.svelte';
	import KnowledgeItem from './knowledge-item.svelte';

  const page_size = 8;
  const duration = 2000;

  export let collection = KNOWLEDGE_COLLECTION;

  /** @type {string[]} */
  let collections = [];

  /** @type {import('$types').KnowledgeCollectionDataViewModel[]} */
  let items = [];

  /** @type {string | null | undefined} */
  let next_id;

  /** @type {boolean} */
  let isLoading = false;
  let isLoadingMore = false;
  let isComplete = false;
  let isError = false;

  let successText = "Done";
  let errorText = "Error";

  onMount(() => {
    getCollections().then(() => {
      initData(null, true);
    });
  });

  function getCollections() {
    return new Promise((resolve, reject) => {
      getKnowledgeCollections().then(res => {
        collections = res || [ KNOWLEDGE_COLLECTION ];
        collection = collections[0];
        resolve(res);
      }).catch(err => {
        collections = [ KNOWLEDGE_COLLECTION ];
        collection = collections[0];
        reject(err);
      })
    });
  }

  /**
   * @param {string | null} [startId]
   * @param {boolean} reset
   */
  function getKnowledgeListData(startId = null, reset = false) {
    return new Promise((resolve, reject) => {
      getKnowledgeData({ size: page_size, start_id: startId }, collection).then(res => {
        const newItems = res.items || [];
        if (reset) {
          items = [ ...newItems ];
        } else {
          items = [ ...items, ...newItems ];
        }
        next_id = res.next_id;
        resolve(res);
      }).catch(err => {
        console.log(err);
        reject(err);
      });
    });
  }


  /**
   * @param {string | null} [startId]
   * @param {boolean} reset
   * @param {boolean} isLocal
   */
  function initData(startId = null, reset = false, isLocal = false) {
    return new Promise((resolve, reject) => {
      toggleLoader(isLocal);
      getKnowledgeListData(startId, reset).then(res => {
        resolve(res);
      }).catch(err => {
        isError = true;
        setTimeout(() => {
          isError = false;
        }, 2000);
        reject(err);
      }).finally(() => {
        toggleLoader(isLocal);
      });
    });
    
  }

  /** @param {boolean} isLocal */
  function toggleLoader(isLocal) {
    if (isLocal) {
      isLoadingMore = !isLoadingMore;
    } else {
      isLoading = !isLoading;
    }
  }

  function loadMore() {
    initData(next_id, false, true);
  }

  /**
	 * @param {string} id
	 * @param {boolean} isSuccess
	 */
  function afterDataDeleted(id, isSuccess) {
    if (isSuccess) {
      isComplete = true;
      successText = "Knowledge has been deleted!";
      setTimeout(() => {
        isComplete = false;
      }, duration);
      items = items?.filter(x => x.id !== id) || [];
    } else {
      isError = true;
      errorText = "Error when deleting knowledge!";
      setTimeout(() => {
        isError = false;
      }, duration);
    }
  }

  /** @param {any} e */
  function selectCollection(e) {
    const value = e.target.value;
    collection = value;
    next_id = null;
    initData(null, true);
  }
</script>

<LoadingToComplete
  isLoading={isLoading}
  isComplete={isComplete}
  isError={isError}
  successText={successText}
  errorText={errorText}
/>

<div class="mt-2">
  <div class="d-flex flex-wrap mb-3 knowledge-table-header">
    <h5 class="font-size-16 knowledge-header-text">
      <div>{$_('Knowledges')}</div>
    </h5>
    <div class="knowledge-dropdown">
      <Input type="select" on:change={(e) => selectCollection(e)}>
        {#each collections as option, idx (idx)}
          <option value={option} selected={idx === 0}>{option}</option>
        {/each}
      </Input>
    </div>
  </div>

  <hr class="mt-2" />

  <div class="table-responsive knowledge-table">
    <Table class="table align-middle table-nowrap table-hover mb-0">
      <thead>
        <tr>
          <th scope="col">{$_('Question')}</th>
          <th scope="col">{$_('Answer')}</th>
          <th></th>
        </tr>
      </thead>
      <tbody>
        {#each items as item}
          <KnowledgeItem data={item} onDataDeleted={(id, isSuccess) => afterDataDeleted(id, isSuccess)} />
        {/each}
      </tbody>
    </Table>

    {#if isLoadingMore}
      <div class="knowledge-loader mt-4">
        <Loader size={25} disableDefaultStyles />
      </div>
    {:else if !!next_id && items?.length > 0}
      <div class="mt-4 text-center">
        <Button
          class="btn btn-soft-primary"
          on:click={() => loadMore()}
        >
          {'Load more'}
        </Button>
      </div>
    {/if}
  </div>
</div>