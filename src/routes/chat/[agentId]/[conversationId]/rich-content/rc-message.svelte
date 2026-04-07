<script>
	import Markdown from "$lib/common/markdown/Markdown.svelte";
	import { RichType } from "$lib/helpers/enums";
	import RcJsInterpreter from "./rc-js-interpreter.svelte";
	import { Icon, Sparkles } from "svelte-hero-icons";
	import Loader from "$lib/common/spinners/Loader.svelte";

    /**
     * @type {{
     *   message?: import('$conversationTypes').ChatResponseModel | null,
     *   containerClasses?: string,
     *   containerStyles?: string,
     *   markdownClasses?: string
     * }}
     */
    let {
        message = null,
        containerClasses = '',
        containerStyles = '',
        markdownClasses = ''
    } = $props();

    let text = $derived(message?.rich_content?.message?.text || message?.text || '');
    let thinkingText = $derived(message?.meta_data?.thinking_text || '');
    let isStillThinking = $derived(!!thinkingText && !text);
    let isThinkingExpanded = $state(false);
    let isThinkingAutoControlled = $state(true);

    $effect(() => {
        if (!isThinkingAutoControlled) {
            return;
        }

        if (thinkingText && !text) {
            isThinkingExpanded = true;
        } else if (text && thinkingText) {
            isThinkingExpanded = false;
            isThinkingAutoControlled = false;
        }
    });
</script>

{#if text || thinkingText}
    <div
        class={`ctext-wrap bg-primary ${containerClasses}`}
        style={`${containerStyles}`}
    >
        {#if thinkingText}
            <div class="thinking-section">
                <button
                    class="thinking-toggle"
                    onclick={() => isThinkingExpanded = !isThinkingExpanded}
                >
                    <span class="thinking-sparkle"><Icon src={Sparkles} solid size="16" /></span>
                    <span>{'Thinking'}</span>
                    {#if isStillThinking}
                        <Loader disableDefaultStyles size={14} color="#4285f4" containerStyles="display: flex; align-items: center;" />
                    {:else}
                        <span class="thinking-chevron" class:expanded={isThinkingExpanded}>›</span>
                    {/if}
                </button>
                {#if isThinkingExpanded}
                    <div class="thinking-content">
                        <Markdown containerStyles="color: #444 !important;" text={thinkingText} rawText />
                    </div>
                {/if}
            </div>
        {/if}
        <div class="flex-shrink-0 align-self-center">
            {#if message?.rich_content?.message?.rich_type === RichType.ProgramCode
                && message?.rich_content?.message?.language === 'javascript'}
                <RcJsInterpreter message={message} scrollable />
            {:else}
                <Markdown containerClasses={markdownClasses} text={text} rawText />
            {/if}
        </div>
    </div>
{/if}

<style>
    .thinking-section {
        margin-bottom: 8px;
    }

    .thinking-toggle {
        display: flex;
        align-items: center;
        gap: 8px;
        background: none;
        border: none;
        color: #555;
        cursor: pointer;
        padding: 4px 0;
        font-size: 0.9em;
    }

    .thinking-toggle:hover {
        color: #333;
    }

    .thinking-sparkle {
        color: #4285f4;
        display: flex;
        align-items: center;
    }

    .thinking-chevron {
        font-size: 1em;
        transition: transform 0.2s ease;
        display: inline-block;
    }

    .thinking-chevron.expanded {
        transform: rotate(90deg);
    }

    .thinking-content {
        font-size: 0.9em;
        padding: 4px 0 4px 16px;
        border-left: 1px solid #888;
        margin-top: 4px;
        max-height: 200px;
        overflow-y: auto;
        scrollbar-width: none;
    }

    .thinking-content::-webkit-scrollbar {
        display: none;
    }
</style>