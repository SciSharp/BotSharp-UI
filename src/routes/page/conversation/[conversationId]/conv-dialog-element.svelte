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
  class="text-sm font-medium leading-relaxed"
  class:text-collapse={is_collapsed}
>
  {#if dialog?.rich_content?.message?.rich_type === RichType.ProgramCode
      && dialog?.rich_content?.message?.language === 'javascript'}
    <RcJsInterpreter message={dialog} scrollable containerStyles={'color: var(--color-primary);'} />
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
  class="mt-1 inline-flex items-center gap-1 text-xs font-medium text-primary transition-colors hover:text-primary-hover hover:underline"
  onclick={(e) => toggleText(e)}
>
  <i class="mdi {is_collapsed ? 'mdi-chevron-down' : 'mdi-chevron-up'} text-sm leading-none"></i>
  <span>{is_collapsed ? 'More' : 'Less'}</span>
</button>