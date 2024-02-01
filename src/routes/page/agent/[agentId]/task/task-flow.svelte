<script>
    import Drawflow from 'drawflow';
    import 'drawflow/dist/drawflow.min.css';
    import '$lib/drawflow/drawflow.css';
    import { onMount, createEventDispatcher } from 'svelte';
    import { replaceNewLine } from '$lib/helpers/http';
    import { newConversation } from '$lib/services/conversation-service';
    import { conversationStore } from '$lib/helpers/store.js';
    import { sendMessageToHub } from '$lib/services/conversation-service.js';
	import 'overlayscrollbars/overlayscrollbars.css';
    import { OverlayScrollbars } from 'overlayscrollbars';

    /** @type {import('$types').AgentModel} */
    export let agent;
    /** @type {import('$types').AgentTemplate[]} */
    let taskNodes = [];

    /** @type {Drawflow} */
    let editor;
    /** @type {DrawflowNode} */
    let selectedNode;

    let lastPosX = 0;

    const dispatch = createEventDispatcher();
    
    onMount(async () => {
        const container = document.getElementById("drawflow");
        if (container) {
            editor = new Drawflow(container);
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

        const options = {
            scrollbars: {
                visibility: 'auto',
                autoHide: 'move',
                autoHideDelay: 100,
                dragScroll: true,
                clickScroll: false,
                theme: 'os-theme-dark',
                pointers: ['mouse', 'touch', 'pen']
            }
        };        
        const scrollElements = document.querySelectorAll('.scrollbar');
		scrollElements.forEach((item) => {
			OverlayScrollbars(item, options);
		});
    });    

    /** @param {Drawflow} editor */
    function renderTaskFlow(editor){
        let posX = 0;
        const nodeSpaceX = 250, nodeSpaceY = 150;

        const templates = agent.templates.filter(t => t.name.startsWith("task."));
        let posY = nodeSpaceY * (templates.length + 1) / 2;

        // add agent node
        let agentNodeHtml = agent.icon_url ? `<img src=${agent.icon_url} height="30" />` : "";
        agentNodeHtml += `<span class="h5 ms-2">${agent.name}</span>`;
        let agentNodeId = editor.addNode('agent', 0, 1, posX, posY, 'agent', 
        {
            is_agent: true,
            agent: agent.name
        }, agentNodeHtml, false);

        posY = 100;
        posX += nodeSpaceX;

        // render tasks
        templates.forEach(template => {
            const actionLink = `page/agent/${agent.id}/task/${template.name}`;
            let html = `<span class="h5">${template.name}</span>`;
            html += `<hr/><div class="scrollbar" style="max-height: 150px;"><i class="bx bx-script"></i>${replaceNewLine(template.content)}</div>`;
            
            const data = {
                agent: agent.name,
                task: template.name,
                content: template.content
            };
            let nid = editor.addNode('agent', 1, 0, posX, posY, 'task-node', data, html, false);
            editor.addConnection(agentNodeId, nid, "output_1", "input_1");

            posY += nodeSpaceY;
            posX += 50;
        });

        lastPosX = posX + nodeSpaceX;
    }
    
    /** @param {import('$types').AgentModel} agent */
    function getPlannerName(agent) {
        const planner = agent.routing_rules.find(p => p.type == "planner");
        return planner?.field ?? "NaviePlanner";
    }

    async function handleTestInChat() {
        window.location.href = `chat/${agent.id}`;
    }

    /** @type {string} */
    let cid;
    /** @type {string} */
    let mid;
    async function handleRunTask() {
        // clean added nodes
        if (mid) {
            editor.removeNodeId(`node-${mid}`);
        }

        if (cid) {
            editor.removeNodeId(`node-${cid}`);
            editor.removeNodeOutput(selectedNode.id, "output_1");
        }

        // new conversation
        const conversation = await newConversation(agent.id);
        conversationStore.set(conversation);

        // draw conversation node
        let posX = lastPosX + 100, posY = 100;
        let html = "Initialize session";
        editor.addNodeOutput(selectedNode.id);
        cid = editor.addNode('conversation', 1, 1, posX, posY, 'conversation', {}, html, false);
        editor.addConnection(selectedNode.id, cid, "output_1", "input_1");

        // send message
        posY += 100;
        html = "Execute task";
        await sendMessageToHub(agent.id, conversation.id, selectedNode.data.content);
        mid = editor.addNode('message', 1, 0, posX, posY, 'message', {}, html, false);
        editor.addConnection(cid, mid, "output_1", "input_1");
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