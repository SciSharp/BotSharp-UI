<script>
    import Breadcrumb from '$lib/common/Breadcrumb.svelte';
    import HeadTitle from '$lib/common/HeadTitle.svelte';
    import { onMount } from 'svelte';
    import { page } from '$app/stores';
    import { executeAgentInstruction } from '$lib/services/instruct-service.js';
    const params = $page.params;
    let agentId = params.agentId;
    let template = params.template;
  
    onMount(async () => {
        /** @type {import('$types').InstructMessageModel} */
        let inst = {
            template: template
        };
        await executeAgentInstruction(agentId, inst);
    });
  </script>
  
  <HeadTitle title="Task Execution" />
  <Breadcrumb title="Task" pagetitle={template} />