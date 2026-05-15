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
  class="mt-1 inline-flex items-center gap-1 text-xs font-medium text-primary transition-colors hover:text-primary-hover hover:underline cursor-pointer"
  onclick={(e) => toggleText(e)}
>
  <i class="mdi {is_collapsed ? 'mdi-chevron-down' : 'mdi-chevron-up'} text-sm leading-none"></i>
  <span>{is_collapsed ? 'More' : 'Less'}</span>
</button>

<style>
    /* Replaces the legacy `.text-collapse` rule from
       src/lib/scss/custom/pages/_conversation.scss. The dialog text is
       collapsed to the first 5 lines by default; clicking the More button
       removes this class so the content can flow to its natural height.

       Two clamping mechanisms are layered here for reliability:
       1. `-webkit-line-clamp: 5` with `display: -webkit-box` gives the
          nicer "line truncation with ellipsis" effect on simple text.
       2. `max-height: 5lh` (5 × the computed line-height) is the hard
          fallback. The inner `<Markdown>` wraps its rendered HTML in a
          `.markdown-container` with `overflow-x: auto`, which establishes
          its own block formatting context — that BFC defeats line-clamp
          on the parent because text flow is sealed inside the child. The
          max-height cap clips reliably regardless of inner BFCs and is
          what actually keeps long code blocks / tables collapsed. */
    .text-collapse {
        overflow: hidden;
        max-height: 10lh;
        display: -webkit-box;
        -webkit-box-orient: vertical;
        -webkit-line-clamp: 5;
        line-clamp: 5;
    }
</style>