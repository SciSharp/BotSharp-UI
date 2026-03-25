<script>
	import Markdown from '$lib/common/markdown/Markdown.svelte';
	import RcJsInterpreter from '../../../chat/[agentId]/[conversationId]/rich-content/rc-js-interpreter.svelte';
	import { RichType } from '$lib/helpers/enums';

  /** @type {{ dialog: import('$conversationTypes').ChatResponseModel }} */
  let { dialog } = $props();

  let is_collapsed = $state(true);

  /** @param {any} e */
  function toggleText(e) {
    e.preventDefault();
    is_collapsed = !is_collapsed;
  }
</script>

<div
  class="fw-bold"
  class:text-collapse={is_collapsed}
>
  {#if dialog?.rich_content?.message?.rich_type === RichType.ProgramCode
      && dialog?.rich_content?.message?.language === 'javascript'}
    <RcJsInterpreter message={dialog} scrollable containerStyles={'color: var(--bs-primary);'} />
  {:else}
    <Markdown
      containerClasses={'dialog-item-text'}
      text={dialog?.rich_content?.message?.text || dialog?.text}
      rawText
    />
  {/if}
</div>

<button
  type="button"
  class="btn btn-link toggle-btn btn-sm text-secondary"
  style="padding-left: 0px;"
  onclick={(e) => toggleText(e)}
>
  {is_collapsed ? 'More +' : 'Less -'}
</button>