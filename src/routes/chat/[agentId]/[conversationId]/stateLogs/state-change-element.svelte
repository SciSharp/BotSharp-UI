<script>

    /** @type {any} */
    export let data;
</script>

<div class="log-element state-change-element">
    <div class="log-meta">
        <div><b>{`[${data?.name}]`}</b></div>
    </div>
    <div class="log-content">
        <div class="transition-word text-secondary">
            Before
        </div>
        <div class="state-value">
            <div>{`${data?.before_value || 'unknown'}`}</div>
        </div>
        
        <div class="transition-word text-secondary">
            After
        </div>
        <div class="state-value">
            <div>{`${data?.after_value || 'unknown'}`}</div>
        </div>
    </div>
</div>

<style>
    .transition-word {
        font-size: 12px;
        font-weight: 600;
        margin-top: 5px;
        margin-bottom: 5px;
    }

    .state-change-element {
        margin-top: 15px !important;
        margin-bottom: 15px !important;
    }

    .state-value {
        font-size: 15px;
    }
</style>