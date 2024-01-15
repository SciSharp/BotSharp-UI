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
                functions: agent.functions,
                responses: agent.responses,
                templates: agent.templates
            }
        }         
    });

  
</script>

<div class="my-json-editor">
    <JSONEditor bind:content />
</div>

<style>
    .my-json-editor {
      /* define a custom theme color */
      --jse-theme-color: var(--bs-primary);
      --jse-theme-color-highlight: #687177;
    }
</style>