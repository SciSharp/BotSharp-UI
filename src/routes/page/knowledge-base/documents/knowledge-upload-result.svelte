<script>
    /** @type {string[]} */
    export let successFiles = [];

    /** @type {string[]} */
    export let failedFiles = [];
</script>

{#if successFiles?.length > 0 || failedFiles?.length > 0}
    <div class="doc-upload-result-container mt-3">
        {#if successFiles?.length > 0}
            {#each successFiles as file, idx (idx)}
                <div class="doc-upload-result-item text-success">
                    <div>
                        <i class="mdi mdi-check-circle" />
                    </div>
                    <div>
                        {`Uploading document "${file}" is successful.`}
                    </div>
                </div>
            {/each}
        {/if}

        {#if failedFiles?.length > 0}
            {#each failedFiles as file, idx (idx)}
                <div class="doc-upload-result-item text-danger">
                    <div>
                        <i class="mdi mdi-alert-circle" />
                    </div>
                    <div>
                        {`Uploading document "${file}" is failed.`}
                    </div>
                </div>
            {/each}
        {/if}
    </div>
{/if}