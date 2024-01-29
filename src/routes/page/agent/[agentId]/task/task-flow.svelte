<script>
    import Drawflow from 'drawflow';
    import 'drawflow/dist/drawflow.min.css';
    import '$lib/drawflow/drawflow.css';
    import { onMount, createEventDispatcher } from 'svelte';
    import { replaceNewLine } from '$lib/helpers/http';
    import { newConversation } from '$lib/services/conversation-service';
    import { conversationStore, getConversationStore } from '$lib/helpers/store.js';
    
    /** @type {import('$types').AgentModel} */
    export let agent;
    /** @type {import('$types').AgentTemplate[]} */
    let taskNodes = [];
    /** @type {DrawflowNode} */
    let selectedNode;

    const dispatch = createEventDispatcher();
    
    onMount(async () => {
        const container = document.getElementById("drawflow");
        if (container) {
            const editor = new Drawflow(container);
            editor.reroute = true;
            editor.reroute_fix_curvature = true;
            editor.start();
            editor.on('nodeCreated', function(id) {
                let node = editor.getNodeFromId(id);
                node.data.nid = id;
                console.log(`Node created ${id} ${node.data.agent}`);
                taskNodes.push(node.data);
            });
            editor.on('nodeSelected', function(id) {
                console.log("Node selected " + id);
                // emit event
                selectedNode = editor.getNodeFromId(id);
            });
            renderTaskFlow(editor);
        }
    });    

    /** @param {Drawflow} editor */
    function renderTaskFlow(editor){
        let posX = 0;
        const nodeSpaceX = 300, nodeSpaceY = 120;

        const templates = agent.templates.filter(t => t.name.startsWith("task."));
        let posY = nodeSpaceY * (templates.length + 1) / 2;

        // add agent node
        let agentNodeHtml = agent.icon_url ? `<img src=${agent.icon_url} height="30" />` : "";
        agentNodeHtml += `<span class="h6 ms-2">${agent.name}</span>`;
        let agentNodeId = editor.addNode('agent', 0, 1, posX, posY, 'agent', 
        {
            is_agent: true,
            agent: agent.name
        }, agentNodeHtml, false);

        posY = 100;
        posX += nodeSpaceX;

        // render tasks
        templates.forEach(template => {
            const actionLink = `/page/agent/${agent.id}/task/${template.name}`;
            let html = `<span class="h6">${template.name}</span>`;
            html += `<hr/><div style="max-height: 50px; overflow: hidden;">${replaceNewLine(template.content)}</div>`;
            
            const data = {
                agent: agent.name,
                task: template.name,
            };
            let nid = editor.addNode('agent', 1, 0, posX, posY, 'enabled-node', data, html, false);
            editor.addConnection(agentNodeId, nid, "output_1", "input_1");

            posY += nodeSpaceY;
        });
    }
    
    /** @param {import('$types').AgentModel} agent */
    function getPlannerName(agent) {
        const planner = agent.routing_rules.find(p => p.type == "planner");
        return planner?.field ?? "NaviePlanner";
    }

    async function handleTestInChat() {
        window.location.href = `/chat/${agent.id}`;
    }

    async function handleRunTask() {
        const conversation = await newConversation(agent.id);
        conversationStore.set(conversation);
    }
</script>

<div>
    {#if selectedNode && selectedNode.data.is_agent}
    <button class="btn btn-primary" on:click={handleTestInChat}><i class="bx bx-chat"></i> Test in chat</button>
    {/if}
    <button class="btn btn-primary" on:click={handleRunTask}><i class="bx bx-run"></i> Run: 
        {#if selectedNode && selectedNode.data.task}
            {selectedNode.data.task}
        {:else}
            select a task to run
        {/if}
    </button>
</div>
<div id="drawflow" style="height: 75vh; width: 100%">
</div>