<script>
	import { Button } from '@sveltestrap/sveltestrap';
    import moment from 'moment';
    import { replaceNewLine } from '$lib/helpers/http';

    /** @type {boolean} */
    let isCollapsed = true;

    /** @type {any} */
     export let log;

     /** @param {any} e */
     function toggleText(e) {
        e.preventDefault();
        log.isCollapsed = !log.isCollapsed;
     }
</script>

<div class="log-element">
    <div class="log-meta">
        <b>{`[${log?.name?.length > 0 ? log?.name + ' ' : ''}${moment.utc(log?.created_at).local().format('hh:mm:ss.SSS A, MMM DD YYYY')}]`}</b>
    </div>
    <br>
    <div class="log-content" class:log-collapse={!!log?.isCollapsed}>
        {@html replaceNewLine(log?.content)}
    </div>
    <Button class="toggle-btn" color="link" on:click={(e) => toggleText(e)}>
        {`${!!log?.isCollapsed ? 'More +' : 'Less -'}`}
    </Button>
    <hr class="divider">
</div>