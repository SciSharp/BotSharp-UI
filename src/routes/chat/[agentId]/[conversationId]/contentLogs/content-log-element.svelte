<script>
	import { Button } from '@sveltestrap/sveltestrap';
    import moment from 'moment';
    import { replaceNewLine } from '$lib/helpers/http';
	import { ContentLogSource } from '$lib/helpers/enums';

    /** @type {import('$types').ConversationContentLogModel} */
    export let data;

    let logBackground = '';
    let is_collapsed = true;
    const excludedSources = [
        ContentLogSource.UserInput,
        ContentLogSource.FunctionCall,
        ContentLogSource.AgentResponse
    ];

    $: {
        if (data.source === ContentLogSource.AgentResponse) {
            logBackground = 'bg-info';
        } else if (data.source === ContentLogSource.FunctionCall) {
            logBackground = 'bg-secondary';
        } else if (data.source === ContentLogSource.Prompt) {
            logBackground = 'bg-danger';
        }
    }

     /** @param {any} e */
    function toggleText(e) {
        e.preventDefault();
        is_collapsed = !is_collapsed;
    }
</script>

<div class={`log-element p-2 rounded ${logBackground}`}>
    <div class="log-meta">
        <b>{`[${data?.name?.length > 0 ? data?.name + ' ' : ''}${moment.utc(data?.created_at).local().format('hh:mm:ss.SSS A, MMM DD YYYY')}]`}</b>
    </div>
    <br>
    <div class="log-content" class:log-collapse={!excludedSources.includes(data.source) && !!is_collapsed}>
        {@html replaceNewLine(data?.content)}
    </div>
    {#if !excludedSources.includes(data.source)}
    <Button class='toggle-btn' color="link" on:click={(e) => toggleText(e)}>
        {`${is_collapsed ? 'More +' : 'Less -'}`}
    </Button>
    {/if}
</div>