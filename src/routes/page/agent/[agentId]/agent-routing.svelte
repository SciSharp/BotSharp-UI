<script>
	import { Card, CardBody, Table } from "@sveltestrap/sveltestrap";
    import CollapsibleCard from 'svelte-collapsible-card';

</script>

<Card>
    <CardBody>
        <div class="text-center">
            <h5 class="mt-1 mb-3">Routing Rules</h5>
        </div>

        <div class="routing-rule-container">
            <CollapsibleCard open>
                <div slot='header'>
                    <h5 class="rule-header">{`Rule # ${1}`}</h5>
                </div>
                <div slot='body'>
                    <div class="table-responsive rule-body">
                        <Table>
                            <tbody>
                                <tr>
                                    <th class="agent-prop-key">Field</th>
                                    <td>Yes</td>
                                </tr>
                                <tr>
                                    <th class="agent-prop-key">Description</th>
                                    <td>Yes</td>
                                </tr>
                                <tr>
                                    <th class="agent-prop-key">Field Type</th>
                                    <td>Yes</td>
                                </tr>
                                <tr>
                                    <th class="agent-prop-key">Required</th>
                                    <td>Yes</td>
                                </tr>
                                <tr>
                                    <th class="agent-prop-key">Type</th>
                                    <td>Yes</td>
                                </tr>
                                <tr>
                                    <th class="agent-prop-key">Redirect to Agent</th>
                                    <td>Yes</td>
                                </tr>
                            </tbody>
                        </Table>
                    </div>
                </div>
            </CollapsibleCard>
        </div>

        <div class="routing-rule-container">
            <CollapsibleCard open>
                <div slot='header'>
                    <h5 class="rule-header">{`Rule # ${2}`}</h5>
                </div>
                <div slot='body'>
                    <div class="table-responsive rule-body">
                        <Table>
                            <tbody>
                                <tr>
                                    <th class="agent-prop-key">Field</th>
                                    <td>Yes</td>
                                </tr>
                                <tr>
                                    <th class="agent-prop-key">Description</th>
                                    <td>Yes</td>
                                </tr>
                                <tr>
                                    <th class="agent-prop-key">Field Type</th>
                                    <td>Yes</td>
                                </tr>
                                <tr>
                                    <th class="agent-prop-key">Required</th>
                                    <td>Yes</td>
                                </tr>
                                <tr>
                                    <th class="agent-prop-key">Type</th>
                                    <td>Yes</td>
                                </tr>
                                <tr>
                                    <th class="agent-prop-key">Redirect to Agent</th>
                                    <td>Yes</td>
                                </tr>
                            </tbody>
                        </Table>
                    </div>
                </div>
            </CollapsibleCard>
        </div>
    </CardBody>
</Card>