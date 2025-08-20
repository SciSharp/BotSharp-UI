<script>
	import Markdown from '$lib/common/markdown/Markdown.svelte';
	import { Button } from '@sveltestrap/sveltestrap';
	import RcJsInterpreter from '../../../chat/[agentId]/[conversationId]/rich-content/rc-js-interpreter.svelte';
	import { RichType } from '$lib/helpers/enums';

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
  {#if dialog?.rich_content?.message?.rich_type === RichType.ProgramCode
      && dialog?.rich_content?.message?.language === 'javascript'}
    <RcJsInterpreter message={dialog} scrollable />
  {:else}
    <Markdown
      containerClasses={'dialog-item-text'}
      text={dialog?.rich_content?.message?.text || dialog?.text}
      rawText
    />
  {/if}
</div>

<Button
  class='toggle-btn btn-sm text-secondary'
  color="link"
  style={'padding-left: 0px;'}
  on:click={(e) => toggleText(e)}
>
  {`${is_collapsed ? 'More +' : 'Less -'}`}
</Button>