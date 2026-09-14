<script>
	import Markdown from '$lib/common/markdown/Markdown.svelte';
	import CollapsibleText from '$lib/common/shared/CollapsibleText.svelte';
	import RcJsInterpreter from '../../../chat/[agentId]/[conversationId]/rich-content/rc-js-interpreter.svelte';
	import { RichType } from '$lib/helpers/enums';

  /** @type {{ dialog: import('$conversationTypes').ChatResponseModel }} */
  let { dialog } = $props();
</script>

<CollapsibleText>
  <div class="text-sm font-medium leading-relaxed">
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
</CollapsibleText>
