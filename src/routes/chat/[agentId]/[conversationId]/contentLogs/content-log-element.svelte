<script>
	import { Button } from '@sveltestrap/sveltestrap';
    import moment from 'moment';
    import { replaceNewLine } from '$lib/helpers/http';
	import { UserRole } from '$lib/helpers/enums';

    /** @type {import('$types').ConversationContentLogModel} */
    export let data;

    let logBackground = '';
    let is_collapsed = true;
    const excludedRoles = [
        UserRole.User,
        UserRole.Assistant
    ];

    $: {
        if (data.role == UserRole.Assistant) {
            logBackground = 'bg-info';
        } else if (data.role == UserRole.Function) {
            logBackground = 'bg-secondary';
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
    <div class="log-content" class:log-collapse={!excludedRoles.includes(data.role) && !!is_collapsed}>
        {@html replaceNewLine(data?.content)}
    </div>
    {#if !excludedRoles.includes(data.role)}
    <Button class='toggle-btn' color="link" on:click={(e) => toggleText(e)}>
        {`${is_collapsed ? 'More +' : 'Less -'}`}
    </Button>
    {/if}
</div>