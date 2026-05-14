<script>
	import CollapsibleCard from "$lib/common/shared/CollapsibleCard.svelte";
	import { directToAgentPage } from "$lib/helpers/utils/common";

    /**
     * @type {{
     *   agent: import('$agentTypes').AgentModel
     * }}
     */
    let { agent } = $props();
</script>

<div class="arr-card">
    <div class="arr-card-body">
        <div class="arr-header">
            <h5 class="arr-title">Routing</h5>
        </div>

        {#each agent.routing_rules as rule, idx (idx)}
        <div class="arr-rule">
            <CollapsibleCard open={idx === 0}>
                {#snippet header()}
                    <h5 class="arr-rule-header">{`Rule #${idx + 1}`}</h5>
                {/snippet}
                {#snippet body()}
                    <div class="arr-rule-body">
                        <table class="arr-table">
                            <tbody>
                                {#if !!rule.field}
                                <tr class="arr-tr">
                                    <th class="arr-key">Field</th>
                                    <td class="arr-value">{rule.field}</td>
                                </tr>
                                {/if}
                                {#if !!rule.description}
                                <tr class="arr-tr">
                                    <th class="arr-key">Description</th>
                                    <td class="arr-value">{rule.description}</td>
                                </tr>
                                {/if}
                                {#if !!rule.fieldType}
                                <tr class="arr-tr">
                                    <th class="arr-key">Field Type</th>
                                    <td class="arr-value">{rule.fieldType}</td>
                                </tr>
                                {/if}
                                <tr class="arr-tr">
                                    <th class="arr-key">Required</th>
                                    <td class="arr-value">{rule.required ? `Yes` : `No`}</td>
                                </tr>
                                {#if !!rule.redirectTo}
                                <tr class="arr-tr">
                                    <th class="arr-key">Redirect to Agent</th>
                                    <td class="arr-value arr-value-link" onclick={() => directToAgentPage(rule.redirectTo)}>
                                        {rule.redirect_to_agent || ''}
                                    </td>
                                </tr>
                                {/if}
                                {#if !!rule.type}
                                <tr class="arr-tr">
                                    <th class="arr-key">Type</th>
                                    <td class="arr-value">{rule.type}</td>
                                </tr>
                                {/if}
                            </tbody>
                        </table>
                    </div>
                {/snippet}
            </CollapsibleCard>
        </div>
        {/each}
    </div>
</div>

<style>
    /* ===== Card shell ===== */
    .arr-card {
        background-color: rgb(255 255 255);
        border: 1px solid rgb(229 231 235);
        border-radius: 0.625rem;
        box-shadow:
            0 1px 2px rgb(15 23 42 / 0.04),
            0 6px 16px -10px rgb(15 23 42 / 0.08);
    }
    .arr-card-body { padding: 1.25rem; }
    .arr-header { text-align: center; margin-bottom: 0.5rem; }
    .arr-title {
        margin: 0.25rem 0 0.75rem 0;
        font-size: 1rem;
        font-weight: 600;
        color: rgb(55 65 81);
    }

    /* ===== Rule container ===== */
    .arr-rule :global(.collapsible-card-header) {
        margin-top: 0.3125rem;
        margin-bottom: 0.3125rem;
        padding-left: 0.625rem;
        border-radius: 0.375rem;
        transition: background-color 0.15s ease;
    }
    .arr-rule :global(.collapsible-card-header:hover) {
        background-color: color-mix(in srgb, var(--color-primary) 5%, transparent);
    }
    .arr-rule-header {
        margin: 0;
        padding: 0.375rem 0 0;
        border: none;
        font-size: 0.9375rem;
        font-weight: 600;
        color: rgb(55 65 81);
    }
    .arr-rule-body {
        padding: 0 0.625rem 0.5rem 0.625rem;
        overflow-x: auto;
    }

    /* ===== Table ===== */
    .arr-table {
        width: 100%;
        border-collapse: collapse;
        font-size: 0.8125rem;
        color: rgb(17 24 39);
    }
    .arr-tr {
        border-top: 1px solid rgb(229 231 235);
    }
    .arr-tr:first-child { border-top: 0; }
    .arr-tr:last-child,
    .arr-tr:last-child .arr-key,
    .arr-tr:last-child .arr-value {
        border-bottom: none;
    }
    .arr-key {
        width: 45%;
        padding: 0.5rem 0.625rem;
        font-weight: 600;
        color: rgb(75 85 99);
        text-align: left;
        vertical-align: top;
    }
    .arr-value {
        padding: 0.5rem 0.625rem;
        vertical-align: top;
        word-break: break-word;
    }
    .arr-value-link {
        cursor: pointer;
        color: var(--color-primary);
        transition: color 0.15s ease;
    }
    .arr-value-link:hover {
        color: var(--color-primary-hover);
        text-decoration: underline;
    }

    /* ===== Dark mode ===== */
    :global(.dark) .arr-card {
        background-color: rgb(31 41 55);
        border-color: rgb(55 65 81);
    }
    :global(.dark) .arr-title,
    :global(.dark) .arr-rule-header {
        color: rgb(229 231 235);
    }
    :global(.dark) .arr-table { color: rgb(229 231 235); }
    :global(.dark) .arr-key { color: rgb(156 163 175); }
    :global(.dark) .arr-tr { border-top-color: rgb(55 65 81); }
    :global(.dark) .arr-rule :global(.collapsible-card-header:hover) {
        background-color: color-mix(in srgb, var(--color-primary) 12%, transparent);
    }
</style>