<script>
    /**
     * @type {{
     *   successFiles?: string[],
     *   failedFiles?: string[]
     * }}
     */
    let {
        successFiles = [],
        failedFiles = []
    } = $props();
</script>

{#if successFiles?.length > 0 || failedFiles?.length > 0}
    <div class="dur-container">
        {#if successFiles?.length > 0}
            {#each successFiles as file, idx (idx)}
                <div class="dur-item dur-item-success">
                    <div>
                        <i class="mdi mdi-check-circle"></i>
                    </div>
                    <div>
                        {`Uploading document "${file}" is successful.`}
                    </div>
                </div>
            {/each}
        {/if}

        {#if failedFiles?.length > 0}
            {#each failedFiles as file, idx (idx)}
                <div class="dur-item dur-item-danger">
                    <div>
                        <i class="mdi mdi-alert-circle"></i>
                    </div>
                    <div>
                        {`Uploading document "${file}" is failed.`}
                    </div>
                </div>
            {/each}
        {/if}
    </div>
{/if}

<style>
    .dur-container {
        margin-top: 0.75rem;
        display: flex;
        flex-direction: column;
        gap: 0.25rem;
    }
    .dur-item {
        display: flex;
        align-items: center;
        gap: 0.3125rem;
        font-size: 0.8125rem;
    }
    .dur-item i {
        font-size: 1rem;
        line-height: 1;
    }
    .dur-item-success {
        color: var(--color-success);
    }
    .dur-item-danger {
        color: var(--color-danger);
    }
</style>