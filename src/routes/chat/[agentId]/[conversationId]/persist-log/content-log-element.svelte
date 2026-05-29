<script>
    import Markdown from "$lib/common/markdown/Markdown.svelte";
	import { ContentLogSource } from '$lib/helpers/enums';
	import { utcToLocal } from '$lib/helpers/datetime';
	import { directToAgentPage } from '$lib/helpers/utils/common';

    /** @type {{ data: import('$conversationTypes').ConversationContentLogModel }} */
    let { data } = $props();

    let is_collapsed = $state(true);
    let contentEl = $state();
    let isOverflowing = $state(false);
    
    const COLLAPSE_LINE_THRESHOLD = 10;
    const unknownAgent = "Uknown";
    const collapsedSources = [
        ContentLogSource.UserInput,
        ContentLogSource.Prompt,
        ContentLogSource.AgentResponse,
        ContentLogSource.FunctionCall,
        ContentLogSource.Notification
    ];

    const rawTextSources = [
        ContentLogSource.AgentResponse,
        ContentLogSource.FunctionCall,
    ];

    let logDisplayStyle = $derived.by(() => {
        if (data.source === ContentLogSource.AgentResponse || data.source === ContentLogSource.Notification) {
            return '';
        } else if (data.source === ContentLogSource.FunctionCall) {
            return 'cle-bg-secondary';
        } else if (data.source === ContentLogSource.Prompt) {
            return 'cle-text-secondary';
        } else if (data.source === ContentLogSource.HardRule) {
            return 'cle-text-warning';
        } else if (data.source === ContentLogSource.UserInput) {
            return 'cle-bg-danger';
        }
        return '';
    });

    let logTextStyle = $derived.by(() => {
        if (data.source === ContentLogSource.AgentResponse || data.source === ContentLogSource.Notification) {
            return 'cle-text-info';
        }
        return '';
    });

    /** @param {any} e */
    function toggleText(e) {
        e.preventDefault();
        is_collapsed = !is_collapsed;
    }

    $effect(() => {
        void data?.content;
        if (!contentEl || !collapsedSources.includes(data.source)) {
            isOverflowing = false;
            return;
        }
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


<div class="cle-element" id={`content-log-${data.message_id}`}>
    <div class="cle-meta">
        <div>
            <span class="cle-title">
            {#if data?.agent_id?.length > 0}
                <!-- svelte-ignore a11y_no_static_element_interactions -->
                <!-- svelte-ignore a11y_click_events_have_key_events -->
                <span
                    class="cle-link"
                    onclick={() => directToAgentPage(data.agent_id)}
                >
                    {data.name || unknownAgent}
                </span>
            {:else}
                <span class="cle-text-secondary">
                    {data.name || unknownAgent}
                </span>
            {/if}
            </span>
            <span class="cle-meta-ts">{`${utcToLocal(data?.created_at, 'hh:mm:ss.SSS A, MMM DD YYYY')} `}</span>
        </div>
    </div>
    <div class={`cle-content ${logDisplayStyle}`}>
        <div
            bind:this={contentEl}
            class:cle-collapse={collapsedSources.includes(data.source) && isOverflowing && !!is_collapsed}
        >
            <Markdown containerClasses={logTextStyle} text={data?.content} rawText={rawTextSources.includes(data.source)} />
        </div>

        {#if collapsedSources.includes(data.source) && isOverflowing}
            <button class="cle-toggle-btn" onclick={(e) => toggleText(e)}>
                {`${is_collapsed ? 'More +' : 'Less -'}`}
            </button>
        {/if}
    </div>

    {#if data.message_id && data.source === ContentLogSource.UserInput}
    <div class="cle-msg-id">
        {`Message id: ${data.message_id}`}
    </div>
    {/if}
</div>

