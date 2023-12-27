<script>
    import { JSONEditor } from 'svelte-jsoneditor';
    import { onMount } from 'svelte';

    /** @type {import('$types').AgentModel} */
    export let agent;

    let content = {
        json: {
        }
    }  

    onMount(() => {
        content = {
            json: {
                responses: agent.responses,
                templates: agent.templates,
                functions: agent.functions
            }
        }         
    });

  
</script>

<JSONEditor bind:content />