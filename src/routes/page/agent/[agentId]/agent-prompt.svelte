<script>
    import Link from 'svelte-link'
    import { Card, CardBody, Col, FormGroup, Label, Input } from '@sveltestrap/sveltestrap';
    
    /** @type {import('$types').AgentModel} */
    export let agent;
</script>
<Col xl={9}>
    <Card>
        <CardBody class="border-bottom">
            <div class="d-flex">
                <div class="flex-grow-1 ms-3">
                    <h5 class="fw-semibold">{agent.name}</h5>
                    <ul class="list-unstyled hstack gap-2 mb-0">
                        <li>
                            <i class="bx bx-building-house"></i> <span class="text-muted">Themesbrand</span>
                        </li>
                        <li>
                            <i class="bx bx-map"></i> <span class="text-muted">California</span>
                        </li>
                    </ul>
                </div>
            </div>
        </CardBody>
        <CardBody>
            <FormGroup class="mb-3">
                <Label for="formmessage">Description:</Label>
                <Input
                    type="textarea"
                    id="formmessage"
                    class="form-control"
                    rows="3"
                    bind:value={agent.description}
                    placeholder="Enter your Message"
                />
            </FormGroup>
            
            <FormGroup class="mb-3">
                <Label for="formmessage">System Prompt:</Label>
                <Input
                    type="textarea"
                    id="formmessage"
                    class="form-control"
                    rows="20"
                    bind:value={agent.instruction}
                    placeholder="Enter your Message"
                />
            </FormGroup>
        </CardBody>
    </Card>
</Col>