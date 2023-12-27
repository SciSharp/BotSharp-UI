<script>
    import Link from 'svelte-link';
    import { Button, Card, CardBody, CardHeader, Col, Table } from 'sveltestrap';
    import InPlaceEdit from '$lib/common/InPlaceEdit.svelte'
    import { format } from '$lib/helpers/datetime';

    /** @type {import('$types').AgentModel} */
    export let agent;
</script>

<Card>
    <CardHeader>
        <div class="text-center">
            <img src="/images/users/bot.png" alt="" height="50" class="mx-auto d-block" />
            <h5 class="mt-1 mb-1"><InPlaceEdit bind:value={agent.name}/></h5>
            <p class="text-muted mb-0">Updated at {format(agent.updated_datetime, 'time')}</p>
        </div>
    </CardHeader>
    <CardBody>
        <div class="table-responsive">
            <Table >
                <tbody>
                    <tr>
                        <th>Is Public</th>
                        <td>
                            <div class="form-check mb-3">
                                <input class="form-check-input" type="checkbox" bind:checked={agent.is_public} id="is_public" />
                                <label class="form-check-label" for="is_public"> Public </label>
                            </div>
                        </td>
                    </tr>
                    <tr>
                        <th>Allow Routing</th>
                        <td>
                            <div class="form-check mb-3">
                                <input class="form-check-input" type="checkbox" bind:checked={agent.allow_routing} id="allow_routing" />
                                <label class="form-check-label" for="allow_routing"> Allow </label>
                            </div>                                
                        </td>
                    </tr>
                    <tr>
                        <th>Profiles</th>
                        <td><span class="badge badge-soft-success">Full Time</span></td>
                    </tr>
                    <tr>
                        <th>Inactive</th>
                        <td>							
                            <div class="form-check mb-3">
                                <input class="form-check-input" type="checkbox" bind:checked={agent.disabled} id="disabled" />
                                <label class="form-check-label" for="disabled"> Disabled </label>
                            </div>
                        </td>
                    </tr>
                    <tr>
                        <th>Templates</th>
                        <td></td>
                    </tr>
                    <tr>
                        <th>Created Date</th>
                        <td>{format(agent.created_datetime, 'time')}</td>
                    </tr>
                </tbody>
            </Table>
        </div>
    </CardBody>
</Card>