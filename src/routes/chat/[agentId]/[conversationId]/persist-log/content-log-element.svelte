<script>
    import Markdown from "$lib/common/markdown/Markdown.svelte";
	import { ContentLogSource } from '$lib/helpers/enums';
	import { utcToLocal } from '$lib/helpers/datetime';
	import { directToAgentPage } from '$lib/helpers/utils/common';

    /** @type {{ data: import('$conversationTypes').ConversationContentLogModel }} */
    let { data } = $props();

    let is_collapsed = $state(true);
    const unknownAgent = "Uknown";
    const collapsedSources = [
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
            return 'cle-bordered';
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
</script>

<!--
  NOTE: id={`content-log-${data.message_id}`} is queried by chat-box.svelte's
  autoScrollToTargetLog(); keep this id attribute as-is.
-->
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
        <div class:cle-collapse={collapsedSources.includes(data.source) && !!is_collapsed}>
            <Markdown containerClasses={logTextStyle} text={data?.content} rawText={rawTextSources.includes(data.source)} />
        </div>

        {#if collapsedSources.includes(data.source)}
            <button class="cle-toggle-btn" onclick={(e) => toggleText(e)}>
                {`${is_collapsed ? 'More +' : 'Less -'}`}
            </button>
        {/if}
    </div>

    {#if data.message_id && data.source === ContentLogSource.UserInput}
    <div class="cle-msg-id">
        {`MessageId: ${data.message_id}`}
    </div>
    {/if}
</div>

<style>
    /* Outer row (replaces .log-element + inline padding + .rounded) */
    .cle-element {
        margin: 10px 0 15px 0;
        padding: 3px;
        border-radius: 0.25rem;
        color: rgb(255 255 255);
    }

    /* Header line: agent name + timestamp (replaces .log-meta.text-secondary) */
    .cle-meta {
        font-size: 15px;
        color: var(--color-secondary);
    }

    /* H4-equivalent heading inside meta row (replaces Bootstrap .h4) */
    .cle-title {
        font-size: 1.5rem;
        font-weight: 500;
        line-height: 1.2;
    }

    /* Clickable agent name (replaces .text-secondary.text-decoration-underline.clickable) */
    .cle-link {
        color: var(--color-secondary);
        text-decoration: underline;
        cursor: pointer;
    }
    .cle-link:hover {
        opacity: 0.85;
    }

    /* Plain secondary text on disabled agent name (replaces Bootstrap .text-secondary) */
    .cle-text-secondary {
        color: var(--color-secondary);
    }

    /* Timestamp suffix (replaces Bootstrap .ms-2) */
    .cle-meta-ts {
        margin-left: 0.5rem;
    }

    /* Content body (replaces .rounded.log-content + inline padding) */
    .cle-content {
        font-size: 17px;
        color: rgb(255 255 255);
        padding: 5px 8px;
        border-radius: 0.25rem;
    }
    .cle-content :global(li) {
        margin: 5px 0;
    }

    /* Source-specific visual variants (replace Bootstrap utility classes used
       in the legacy logDisplayStyle derived value).
       - cle-bordered: AgentResponse / Notification (was 'border border-secondary')
       - cle-bg-secondary: FunctionCall (was 'bg-secondary')
       - cle-text-secondary: Prompt (was 'text-secondary' on the content div)
       - cle-text-warning: HardRule (was 'text-warning')
       - cle-bg-danger: UserInput (was 'bg-danger') */
    .cle-bordered {
        border: 1px solid var(--color-secondary);
    }
    .cle-bg-secondary {
        background-color: var(--color-secondary);
    }
    .cle-text-warning {
        color: var(--color-warning, #f1b44c);
    }
    .cle-bg-danger {
        background-color: var(--color-danger, #ef4444);
    }

    /* Markdown text color for AgentResponse / Notification (replaces Bootstrap
       .text-info passed via Markdown's containerClasses prop) */
    :global(.cle-text-info) {
        color: var(--color-info, #0ea5e9);
    }

    /* Collapsed text clamp (replaces .log-collapse nested under .log-content) */
    .cle-collapse {
        overflow-y: hidden;
        height: fit-content;
        max-height: 200px;
        display: -webkit-box;
        -webkit-box-orient: vertical;
        -webkit-line-clamp: 10;
    }

    /* More/Less toggle (replaces .btn.btn-link.toggle-btn.btn-sm) */
    .cle-toggle-btn {
        background: transparent;
        border: 0;
        outline: none;
        box-shadow: none;
        color: rgb(255 255 255);
        font-size: 15px;
        padding: 0;
        cursor: pointer;
    }
    .cle-toggle-btn:hover {
        text-decoration: underline;
    }

    /* MessageId footer (replaces inline style="margin-top: 10px;") */
    .cle-msg-id {
        margin-top: 10px;
        color: rgb(255 255 255);
    }
</style>