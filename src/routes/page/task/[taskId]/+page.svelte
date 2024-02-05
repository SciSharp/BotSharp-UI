<script>
    import { onMount } from 'svelte';
    import ExecutionFlow from './execution-flow.svelte';
    import { page } from '$app/stores';
    const params = $page.params;
    const agentId = $page.url.searchParams.get('agentId')
    const taskId = params.taskId;

    onMount(async () => {
        const container = document.getElementById("drawflow");
        if (container) {

        }
        
    }); 
</script>

<ExecutionFlow /> 