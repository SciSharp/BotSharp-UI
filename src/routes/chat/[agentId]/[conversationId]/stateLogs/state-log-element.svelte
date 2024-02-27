<script>
	import { utcToLocal } from '$lib/helpers/datetime';
    import moment from 'moment';
    import JSONTree from 'svelte-json-tree';

    /** @type {any} */
    export let data;

    $: stateObj = JSON.parse(JSON.stringify(data?.states || {}));
</script>

<div class="log-element" id={`state-log-${data.message_id}`}>
    <div class="log-meta">
        <div><b>{`[${utcToLocal(data.created_at, 'hh:mm:ss.SSS A, MMM DD YYYY')}]`}</b></div>
        {#if data.message_id}
        <div><b>{`[MessageId: ${data.message_id}]`}</b></div>
        {/if}
    </div>
    <br>
    <div class="log-content">
        <JSONTree value={stateObj} />
    </div>
</div>