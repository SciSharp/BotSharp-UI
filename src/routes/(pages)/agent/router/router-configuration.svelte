<script>
    import { Card, CardBody, CardHeader, Table } from 'sveltestrap';
    import { getSettings } from '$lib/services/router-service.js';
    import { onMount } from 'svelte';

    /** @type {import('$types').AgentModel} */
    export let router;    
    
    /** @type {import('$types').RouterSettings} */
    let settings;  

    onMount(async () => {
        settings = await getSettings();
    });    

</script>

{#if settings}
<Card>
    <CardHeader>
        Routing Settings
    </CardHeader>
    <CardBody>
        <div class="table-responsive">
            <Table>
                <tbody>
                    <tr>
                        <th>Agent Id</th>
                        <td>
                            {settings.agentId}
                        </td>
                    </tr>
                    <tr>
                        <th>Planner</th>
                        <td>
                            {settings.planner}
                        </td>
                    </tr>
                </tbody>
            </Table>
        </div>
    </CardBody>
</Card>
{/if}
