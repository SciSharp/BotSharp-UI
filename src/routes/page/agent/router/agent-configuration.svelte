<script>
    import { Card, CardBody, CardHeader, Table } from '@sveltestrap/sveltestrap';
    import { getSettings } from '$lib/services/agent-service.js';
    import { onMount } from 'svelte';

    /** @type {import('$types').AgentModel} */
    export let agent;    
    
    /** @type {import('$types').AgentSettings} */
    let settings;  

    onMount(async () => {
        settings = await getSettings();
    });    

</script>

{#if settings}
<Card>
    <CardHeader>
        Agent Settings
    </CardHeader>
    <CardBody>
        <div class="table-responsive">
            <Table>
                <tbody>
                    <tr>
                        <th>Data Directory</th>
                        <td>
                            {settings.dataDir}
                        </td>
                    </tr>
                    <tr>
                        <th>Template Format</th>
                        <td>
                            {settings.templateFormat}
                        </td>
                    </tr>
                    <tr>
                        <th>LLM Provider</th>
                        <td>
                            {settings.llmConfig.provider}
                        </td>
                    </tr>
                    <tr>
                        <th>LLM Model</th>
                        <td>
                            {settings.llmConfig.model}
                        </td>
                    </tr>
                </tbody>
            </Table>
        </div>
    </CardBody>
</Card>
{/if}
