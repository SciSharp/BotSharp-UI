<script>
	import Markdown from "$lib/common/markdown/Markdown.svelte";
	import { RichType } from "$lib/helpers/enums";
	import RcJsInterpreter from "./rc-js-interpreter.svelte";
	import { Icon, Sparkles } from "svelte-hero-icons";
	import Loader from "$lib/common/spinners/Loader.svelte";
	import { slide, fade } from "svelte/transition";
	import { cubicOut } from "svelte/easing";

    /**
     * @type {{
     *   message?: import('$conversationTypes').ChatResponseModel | null,
     *   containerClasses?: string,
     *   containerStyles?: string,
     *   markdownClasses?: string,
     *   isStreaming?: boolean
     * }}
     */
    let {
        message = null,
        containerClasses = '',
        containerStyles = '',
        markdownClasses = '',
        isStreaming = false
    } = $props();

    let text = $derived(message?.rich_content?.message?.text || message?.text || '');
    let thinkingText = $derived(message?.thought?.thinking_text || '');
    let isThinking = $derived(thinkingText && !text && isStreaming);
    let isStoppedThinking = $derived(thinkingText && !text && !isStreaming);

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
                    <span class="thinking-sparkle" class:pulsing={isThinking}><Icon src={Sparkles} solid size="16" /></span>
                    <span class="font-bold">{'Thinking'}</span>
                    {#if isThinking}
                        <Loader disableDefaultStyles size={14} color="#4285f4" containerStyles="display: flex; align-items: center;" />
                    {:else if isStoppedThinking}
                        <span class="stopped-thinking-label">Stopped thinking</span>
                    {:else}
                        <span class="thinking-chevron" class:expanded={isThinkingExpanded}>›</span>
                    {/if}
                </button>
                {#if isThinkingExpanded}
                    <div
                        class="thinking-content"
                        transition:slide={{ duration: 200, easing: cubicOut }}
                    >
                        <div in:fade={{ duration: 200, delay: 80 }}>
                            <Markdown containerStyles="color: #444 !important;" text={thinkingText} rawText />
                        </div>
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
        margin-bottom: 15px;
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

    .thinking-sparkle.pulsing {
        animation: thinking-sparkle-pulse 1.4s ease-in-out infinite;
    }

    @keyframes thinking-sparkle-pulse {
        0%, 100% {
            opacity: 1;
            transform: scale(1);
        }
        50% {
            opacity: 0.55;
            transform: scale(1.15);
        }
    }

    .thinking-chevron {
        font-size: 1em;
        transition: transform 0.25s cubic-bezier(0.4, 0, 0.2, 1);
        display: inline-block;
    }

    .thinking-chevron.expanded {
        transform: rotate(90deg);
    }

    .stopped-thinking-label {
        font-size: 0.85em;
        color: #999;
        font-style: italic;
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