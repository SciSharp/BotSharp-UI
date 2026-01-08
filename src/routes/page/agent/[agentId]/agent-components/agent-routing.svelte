<script>
	import CollapsibleCard from "$lib/common/shared/CollapsibleCard.svelte";
	import { directToAgentPage } from "$lib/helpers/utils/common";
	import { Card, CardBody, Table } from "@sveltestrap/sveltestrap";

    /** @type {import('$agentTypes').AgentModel} */
    export let agent;
</script>

<Card>
    <CardBody>
        <div class="text-center">
            <h5 class="mt-1 mb-3">Routing</h5>
        </div>

        {#each agent.routing_rules as rule, idx (idx)}
        <div class="routing-rule-container">
            <CollapsibleCard open={idx === 0}>
                <div slot='header'>
                    <h5 class="rule-header">{`Rule #${idx + 1}`}</h5>
                </div>
                <div slot='body'>
                    <div class="table-responsive rule-body">
                        <Table>
                            <tbody>
                                {#if !!rule.field}
                                <tr>
                                    <th class="agent-prop-key">Field</th>
                                    <td>{rule.field}</td>
                                </tr>
                                {/if}
                                {#if !!rule.description}
                                <tr>
                                    <th class="agent-prop-key">Description</th>
                                    <td>{rule.description}</td>
                                </tr>
                                {/if}
                                {#if !!rule.fieldType}
                                <tr>
                                    <th class="agent-prop-key">Field Type</th>
                                    <td>{rule.fieldType}</td>
                                </tr>
                                {/if}
                                <tr>
                                    <th class="agent-prop-key">Required</th>
                                    <td>{!!rule.required ? `Yes` : `No`}</td>
                                </tr>
                                {#if !!rule.redirectTo}
                                <tr>
                                    <th class="agent-prop-key">Redirect to Agent</th>
                                    <td style="cursor: pointer;" on:click={() => directToAgentPage(rule.redirectTo)}>
                                        {rule.redirect_to_agent || ''}
                                    </td>
                                </tr>
                                {/if}
                                {#if !!rule.type}
                                <tr>
                                    <th class="agent-prop-key">Type</th>
                                    <td>{rule.type}</td>
                                </tr>
                                {/if}
                            </tbody>
                        </Table>
                    </div>
                </div>
            </CollapsibleCard>
        </div>
        {/each}
    </CardBody>
</Card>