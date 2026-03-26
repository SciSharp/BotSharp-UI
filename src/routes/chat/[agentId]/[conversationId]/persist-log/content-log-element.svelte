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
            return 'border border-secondary';
        } else if (data.source === ContentLogSource.FunctionCall) {
            return 'bg-secondary';
        } else if (data.source === ContentLogSource.Prompt) {
            return 'text-secondary';
        } else if (data.source === ContentLogSource.HardRule) {
            return 'text-warning';
        } else if (data.source === ContentLogSource.UserInput) {
            return 'bg-danger';
        }
        return '';
    });

    let logTextStyle = $derived.by(() => {
        if (data.source === ContentLogSource.AgentResponse || data.source === ContentLogSource.Notification) {
            return 'text-info';
        }
        return '';
    });

    /** @param {any} e */
    function toggleText(e) {
        e.preventDefault();
        is_collapsed = !is_collapsed;
    }
</script>

<div class="log-element rounded" style="padding: 3px;" id={`content-log-${data.message_id}`}>
    <div class="log-meta text-secondary">
        <div>
            <span class="h4">
            {#if data?.agent_id?.length > 0}
                <!-- svelte-ignore a11y_no_static_element_interactions -->
                <!-- svelte-ignore a11y_click_events_have_key_events -->
                <span
                    class="text-secondary text-decoration-underline clickable"
                    onclick={() => directToAgentPage(data.agent_id)}
                >
                    {data.name || unknownAgent}
                </span>
            {:else}
                <span class="text-secondary">
                    {data.name || unknownAgent}
                </span>
            {/if}
            </span>
            <span class="ms-2">{`${utcToLocal(data?.created_at, 'hh:mm:ss.SSS A, MMM DD YYYY')} `}</span>
        </div>
    </div>
    <div
        class={`rounded log-content ${logDisplayStyle}`}
        style="padding: 5px 8px;"
    >
        <div class:log-collapse={collapsedSources.includes(data.source) && !!is_collapsed}>
            <Markdown containerClasses={logTextStyle} text={data?.content} rawText={rawTextSources.includes(data.source)} />
        </div>

        {#if collapsedSources.includes(data.source)}
            <button class="btn btn-link toggle-btn btn-sm" onclick={(e) => toggleText(e)}>
                {`${is_collapsed ? 'More +' : 'Less -'}`}
            </button>
        {/if}
    </div>

    {#if data.message_id && data.source === ContentLogSource.UserInput}
    <div style="margin-top: 10px;">
        {`MessageId: ${data.message_id}`}
    </div>
    {/if}
</div>