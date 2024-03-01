<script>
	import { Button } from '@sveltestrap/sveltestrap';
    import Link from 'svelte-link/src/Link.svelte';
    import Markdown from "$lib/common/Markdown.svelte";
	import { ContentLogSource } from '$lib/helpers/enums';
	import { utcToLocal } from '$lib/helpers/datetime';

    /** @type {import('$types').ConversationContentLogModel} */
    export let data;

    let logDisplayStyle = '';
    let is_collapsed = true;
    const includedSources = [
        ContentLogSource.Prompt
    ];

    $: {
        if (data.source === ContentLogSource.AgentResponse) {
            logDisplayStyle = 'bg-info';
        } else if (data.source === ContentLogSource.FunctionCall) {
            logDisplayStyle = 'bg-secondary';
        } else if (data.source === ContentLogSource.Prompt) {
            logDisplayStyle = 'text-secondary';
        } else if (data.source === ContentLogSource.HardRule) {
            logDisplayStyle = 'text-warning';
        } else if (data.source === ContentLogSource.UserInput) {
            logDisplayStyle = "bg-primary";
        }
    }

     /** @param {any} e */
    function toggleText(e) {
        e.preventDefault();
        is_collapsed = !is_collapsed;
    }

    /** @param {string} agentId */
    function directToAgentDetailPage(agentId) {
        window.open(`/page/agent/${agentId}`);
    }
</script>

<div class="log-element rounded" style="padding: 3px;" id={`content-log-${data.message_id}`}>
    <div class="log-meta text-secondary">
        <div>
            {#if data?.name?.length > 0}
            <span class="h4">
                {#if data?.agent_id?.length > 0}
                <Link class="text-white" on:click={() => directToAgentDetailPage(data.agent_id)}>
                    {data.name}
                </Link>
                {:else}
                <span class="text-white">
                    {`${data?.name}`}
                </span>
                {/if}
            </span>
            {/if}
            <span class="ms-2">{`${utcToLocal(data?.created_at, 'hh:mm:ss.SSS A, MMM DD YYYY')} `}</span>
        </div>        
    </div>
    <div
        class={`rounded log-content ${logDisplayStyle}`}
        style="padding: 5px 8px;"
        class:log-collapse={includedSources.includes(data.source) && !!is_collapsed}
    >
        <Markdown text={data?.content} />
    </div>

    {#if includedSources.includes(data.source)}
    <Button class='toggle-btn btn-sm' color="link" on:click={(e) => toggleText(e)}>
        {`${is_collapsed ? 'More +' : 'Less -'}`}
    </Button>
    {/if}

    {#if data.message_id && data.source === ContentLogSource.UserInput}
    <div style="margin-top: 10px;">
        {`MessageId: ${data.message_id}`}
    </div>
    {/if}         
</div>