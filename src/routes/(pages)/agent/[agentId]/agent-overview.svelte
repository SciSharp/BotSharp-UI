<script>
    import Link from 'svelte-link';
    import { Button, Card, CardBody, CardHeader, Col, Table } from 'sveltestrap';
    import { format } from '$lib/helpers/datetime';

    /** @type {import('$types').AgentModel} */
    export let agent = {};
</script>

<Col xl={3}>
    <Card>
        <CardHeader>
            <div class="text-center">
                <img src="/images/users/bot.png" alt="" height="50" class="mx-auto d-block" />
                <h5 class="mt-1 mb-1">{agent.name}</h5>
                <p class="text-muted mb-0">Updated at {format(agent.updated_datetime, 'time')}</p>
            </div>
        </CardHeader>
        <CardBody>
            <div class="table-responsive">
                <Table >
                    <tbody>
                        <tr>
                            <th>Name</th>
                            <td><input class="form-control" type="text" value={agent.name} /></td>
                        </tr>
                        <tr>
                            <th>Is Public</th>
                            <td>
                                <div class="form-check mb-3">
                                    <input class="form-check-input" type="checkbox" value="" id="defaultCheck1" />
                                    <label class="form-check-label" for="defaultCheck1"> Public </label>
                                </div>
                            </td>
                        </tr>
                        <tr>
                            <th>Allow Routing</th>
                            <td>
                                <div class="form-check mb-3">
                                    <input class="form-check-input" type="checkbox" value="" id="defaultCheck1" />
                                    <label class="form-check-label" for="defaultCheck1"> Allow </label>
                                </div>                                
                            </td>
                        </tr>
                        <tr>
                            <th>Profiles</th>
                            <td><span class="badge badge-soft-success">Full Time</span></td>
                        </tr>
                        <tr>
                            <th>Status</th>
                            <td>							
                                <div class="form-check mb-3">
                                    <input class="form-check-input" type="checkbox" value="" id="defaultCheck1" />
                                    <label class="form-check-label" for="defaultCheck1"> Active </label>
                                </div>
                            </td>
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

    <Card>
        <CardBody>
            <div class="text-center">
                <img src="/images/brands/azure-openai-logo.avif" alt="" height="50" class="mx-auto d-block" />
                <h5 class="mt-1 mb-3">LLM Config</h5>
            </div>

            <div class="mb-3 row">
                <label class="col-md-3 col-form-label" for="example-large">Provider</label>
                <div class="col-md-9">
                  <select class="form-select">
                    <option>Select</option>
                    <option>azure-openai</option>
                    <option>google-ai</option>
                    <option>llama-sharp</option>
                  </select>
                </div>
            </div>
            
            <div class="mb-3 row">
                <label for="example-text-input" class="col-md-3 col-form-label">
                  Model
                </label>
                <div class="col-md-9">
                  <input class="form-control" type="text" value="" />
                </div>
            </div>
        </CardBody>
    </Card>
</Col>