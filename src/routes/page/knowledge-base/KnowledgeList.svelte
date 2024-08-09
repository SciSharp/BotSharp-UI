<script>
  import { onMount } from 'svelte';
  import { _ } from 'svelte-i18n';
  import { Table } from "@sveltestrap/sveltestrap";
	import { searchKnowledge } from '$lib/services/knowledge-base-service';
	import { KNOWLEDGE_COLLECTION } from '$lib/helpers/constants';

  onMount(() => {
    searchKnowledge(KNOWLEDGE_COLLECTION, { text: "employees in Lessen" });
  });

  const files = [
    {
      id: 'sdfsdf',
      question: "this is a question.",
      answer: "this is an answer"
    },
  ];
</script>

<div class="mt-4">
  <div class="d-flex flex-wrap">
    <h5 class="font-size-16 me-3">{$_('Knowledges')}</h5>
  </div>
  <hr class="mt-2" />

  <div class="table-responsive">
    <Table class="table align-middle table-nowrap table-hover mb-0">
      <thead>
        <tr>
          <th scope="col">{$_('Question')}</th>
          <th scope="col">{$_('Answer')}</th>
          <th />
        </tr>
      </thead>
      <tbody>
        {#each files as file}
          <tr>
            <td>
              {file.question}
            </td>
            <td>
              {file.answer}
            </td>
            <td>
              
            </td>
          </tr>
        {/each}
      </tbody>
    </Table>
  </div>
</div>