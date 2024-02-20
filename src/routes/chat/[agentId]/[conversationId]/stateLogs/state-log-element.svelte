<script>
    import moment from 'moment';
    import JSONTree from 'svelte-json-tree';

    /** @type {any} */
    export let data;

    $: stateObj = JSON.parse(JSON.stringify(data?.states || {}));
</script>

<div class="log-element">
    <div class="log-meta">
        <b>{`[${moment.utc(data?.created_at).local().format('hh:mm:ss.SSS A, MMM DD YYYY')}]`}</b>
    </div>
    <br>
    <div class="log-content">
        <JSONTree value={stateObj} />
    </div>
</div>