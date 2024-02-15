<script>
	import { Button } from '@sveltestrap/sveltestrap';
    import moment from 'moment';
    import { replaceNewLine } from '$lib/helpers/http';
	import { UserRole } from '$lib/helpers/enums';

    /** @type {import('$types').ContentLogModel} */
    export let data;

     /** @param {any} e */
    function toggleText(e) {
        e.preventDefault();
        data.is_collapsed = !data.is_collapsed;
    }
</script>

<div class="log-element">
    <div class="log-meta">
        <b>{`[${data?.name?.length > 0 ? data?.name + ' ' : ''}${moment.utc(data?.created_at).local().format('hh:mm:ss.SSS A, MMM DD YYYY')}]`}</b>
    </div>
    <br>
    <div class="log-content" class:log-collapse={!!data?.is_collapsed}>
        {@html replaceNewLine(data?.content)}
    </div>
    {#if data.role != UserRole.User}
    <Button class='toggle-btn' color="link" on:click={(e) => toggleText(e)}>
        {`${!!data?.is_collapsed ? 'More +' : 'Less -'}`}
    </Button>
    {/if}
</div>