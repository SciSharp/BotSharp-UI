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

    /** @type {HTMLElement | null} */
    let thinkingContentEl = $state(/** @type {any} */ (null));
    let _thinkingScrollScheduled = false;

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

    $effect(() => {
        thinkingText;
        isThinkingExpanded;
        if (!thinkingContentEl || !isStreaming) {
            return;
        }

        scrollToBottom();
    });

    function scrollToBottom() {
        if (_thinkingScrollScheduled) {
            return;
        }
        _thinkingScrollScheduled = true;
        requestAnimationFrame(() => {
            const el = thinkingContentEl;
            if (el) {
                setTimeout(() => {
                    el.scrollTo({ top: el.scrollHeight, behavior: 'smooth' });
                }, 150);
            }
            _thinkingScrollScheduled = false;
        });
    }
</script>

{#if text || thinkingText}
    <div
        class={`rcm-bubble ${containerClasses}`}
        style={`${containerStyles}`}
    >
        {#if thinkingText}
            <div class="thinking-section">
                <button
                    class="thinking-toggle"
                    onclick={() => isThinkingExpanded = !isThinkingExpanded}
                >
                    <span class="thinking-sparkle" class:pulsing={isThinking}><Icon src={Sparkles} solid size="16" /></span>
                    <span class="rcm-thinking-label">{'Thinking'}</span>
                    {#if isThinking}
                        <Loader disableDefaultStyles spinnerType="jumper" size={14} color="#4285f4" containerStyles="display: flex; align-items: center;" />
                    {:else if isStoppedThinking}
                        <span class="stopped-thinking-label">Stopped thinking</span>
                    {:else}
                        <span class="thinking-chevron" class:expanded={isThinkingExpanded}>›</span>
                    {/if}
                </button>
                {#if isThinkingExpanded}
                    <div
                        bind:this={thinkingContentEl}
                        class="thinking-content"
                        transition:slide={{ duration: 200, easing: cubicOut }}
                    >
                        <div in:fade={{ duration: 200, delay: 80 }}>
                            <Markdown containerClasses="font-rethink" containerStyles="color: #444 !important;" text={thinkingText} rawText />
                        </div>
                    </div>
                {/if}
            </div>
        {/if}
        <div class="rcm-body">
            {#if message?.rich_content?.message?.rich_type === RichType.ProgramCode
                && message?.rich_content?.message?.language === 'javascript'}
                <RcJsInterpreter message={message} scrollable />
            {:else}
                <Markdown containerClasses={markdownClasses} text={text} rawText />
            {/if}
        </div>
    </div>
{/if}

