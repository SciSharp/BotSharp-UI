<script>
	import Markdown from '$lib/common/Markdown.svelte';
	import { Button } from '@sveltestrap/sveltestrap';

  /** @type {import('$conversationTypes').ChatResponseModel} */
  export let dialog;

  let is_collapsed = true;

  /** @param {any} e */
  function toggleText(e) {
    e.preventDefault();
    is_collapsed = !is_collapsed;
  }
</script>

<div
  class="fw-bold"
  class:text-collapse={!!is_collapsed}
>
  <Markdown
    containerClasses={'dialog-item-text'}
    text={dialog?.rich_content?.message?.text || dialog?.text}
    rawText
  />
</div>

<Button
  class='toggle-btn btn-sm text-secondary'
  color="link"
  style={'padding-left: 0px;'}
  on:click={(e) => toggleText(e)}
>
  {`${is_collapsed ? 'More +' : 'Less -'}`}
</Button>