<script>
    /** @type {{ data: any }} */
    let { data } = $props();
</script>

<div class="log-element queue-change-container">
    <div class="log-content">
        <span class="text-warning">{data?.log}</span>
    </div>
</div>