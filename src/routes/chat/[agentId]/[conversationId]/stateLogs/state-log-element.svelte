<script>
	import { utcToLocal } from '$lib/helpers/datetime';
    import JSONTree from 'svelte-json-tree';

    /** @type {any} */
    export let data;
</script>

<div class="log-element state-log-item" id={`state-log-${data.message_id}`}>
    <div class="log-meta">
        <div><b>{`[${utcToLocal(data.created_at, 'hh:mm:ss.SSS A, MMM DD YYYY')}]`}</b></div>
    </div>
    <br>
    <div class="log-content">
        <JSONTree value={data?.states || {}} />
    </div>
    {#if data.message_id}
    <div style="margin-top: 10px;">
        {`MessageId: ${data.message_id}`}
    </div>
    {/if} 
</div>