<script>
	import { Button } from '@sveltestrap/sveltestrap';
    import Link from 'svelte-link/src/Link.svelte';
    import Markdown from "$lib/common/markdown/Markdown.svelte";
	import { ContentLogSource } from '$lib/helpers/enums';
	import { utcToLocal } from '$lib/helpers/datetime';
	import { directToAgentPage } from '$lib/helpers/utils/common';

    /** @type {import('$conversationTypes').ConversationContentLogModel} */
    export let data;

    let logDisplayStyle = '';
    let logTextStyle = '';
    let is_collapsed = true;
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

    $: {
        if (data.source === ContentLogSource.AgentResponse || data.source === ContentLogSource.Notification) {
            logDisplayStyle = 'border border-secondary';
            logTextStyle = 'text-info';
        } else if (data.source === ContentLogSource.FunctionCall) {
            logDisplayStyle = 'bg-secondary';
        } else if (data.source === ContentLogSource.Prompt) {
            logDisplayStyle = 'text-secondary';
        } else if (data.source === ContentLogSource.HardRule) {
            logDisplayStyle = 'text-warning';
        } else if (data.source === ContentLogSource.UserInput) {
            logDisplayStyle = "bg-danger";
        }
    }

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
                <Link class="text-secondary text-decoration-underline" on:click={() => directToAgentPage(data.agent_id)}>
                    {data.name || unknownAgent}
                </Link>
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
            <Button class='toggle-btn btn-sm' color="link" on:click={(e) => toggleText(e)}>
                {`${is_collapsed ? 'More +' : 'Less -'}`}
            </Button>
        {/if}
    </div>

    {#if data.message_id && data.source === ContentLogSource.UserInput}
    <div style="margin-top: 10px;">
        {`MessageId: ${data.message_id}`}
    </div>
    {/if}         
</div>