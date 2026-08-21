<script>
	import Markdown from '$lib/common/markdown/Markdown.svelte';
	import RcJsInterpreter from '../../../chat/[agentId]/[conversationId]/rich-content/rc-js-interpreter.svelte';
	import { RichType } from '$lib/helpers/enums';

  const COLLAPSE_LINE_THRESHOLD = 10;

  /** @type {{ dialog: import('$conversationTypes').ChatResponseModel }} */
  let { dialog } = $props();

  let is_collapsed = $state(true);
  let contentEl = $state();
  let isOverflowing = $state(false);

  /** @param {any} e */
  function toggleText(e) {
    e.preventDefault();
    is_collapsed = !is_collapsed;
  }

  $effect(() => {
    void dialog?.rich_content?.message?.text;
    void dialog?.text;
    if (!contentEl) return;
    requestAnimationFrame(() => {
      if (!contentEl) return;
      const cs = getComputedStyle(contentEl);
      let lineHeight = parseFloat(cs.lineHeight);
      if (!Number.isFinite(lineHeight) || lineHeight <= 0) {
        lineHeight = parseFloat(cs.fontSize) * 1.5 || 21;
      }
      isOverflowing = contentEl.scrollHeight > lineHeight * COLLAPSE_LINE_THRESHOLD + 1;
    });
  });
</script>

<div
  bind:this={contentEl}
  class="text-sm font-medium leading-relaxed"
  class:text-collapse={is_collapsed && isOverflowing}
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

{#if isOverflowing}
<button
  type="button"
  class="mt-1 inline-flex items-center gap-1 text-xs font-medium text-primary transition-colors hover:text-primary-hover hover:underline cursor-pointer"
  onclick={(e) => toggleText(e)}
>
  <i class="mdi {is_collapsed ? 'mdi-chevron-down' : 'mdi-chevron-up'} text-sm leading-none"></i>
  <span>{is_collapsed ? 'More' : 'Less'}</span>
</button>
{/if}

