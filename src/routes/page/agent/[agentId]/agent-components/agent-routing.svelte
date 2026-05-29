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
                                {#if !!rule.field_type}
                                <tr class="arr-tr">
                                    <th class="arr-key">Field Type</th>
                                    <td class="arr-value">{rule.field_type}</td>
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

