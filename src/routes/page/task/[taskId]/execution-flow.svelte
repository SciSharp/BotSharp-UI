<script>
    import Drawflow from 'drawflow';
    import 'drawflow/dist/drawflow.min.css';
    import '$lib/drawflow/drawflow.css';
    import { onMount, createEventDispatcher } from 'svelte';
    import { newConversation } from '$lib/services/conversation-service';
    import { conversationStore } from '$lib/helpers/store.js';
    import { getAgentTaskDetail } from '$lib/services/task-service';
    import { sendMessageToHub } from '$lib/services/conversation-service.js';
	import 'overlayscrollbars/overlayscrollbars.css';
    import { OverlayScrollbars } from 'overlayscrollbars';
    import { page } from '$app/stores';
	import { replaceNewLine } from '$lib/helpers/http';

    /** @type {import('$types').AgentTaskModel} */
    let task;

    /** @type {import('$types').AgentTemplate[]} */
    let taskNodes = [];

    /** @type {Drawflow} */
    let editor;

    /** @type {string} */
    let tid;
    /** @type {string} */
    let cid;
    /** @type {string} */
    let mid;    
    let lastPosX = 120;
    let lastPosY = 100;
    const nodeSpaceX = 50, nodeSpaceY = 120;

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
            });            
        }
        const params = $page.params;
        const agentId = $page.url.searchParams.get('agentId');
        const taskId = params.taskId;
        task = await getAgentTaskDetail(agentId, taskId);

        renderTaskNode();

        const scrollElements = document.querySelectorAll('.scrollbar');
		scrollElements.forEach((item) => {
			const scrollbar = OverlayScrollbars(item, options);
		});
    });    

    function renderTaskNode() {
        let posX = 0;
        let posY = 200;

        // draw task node
        let html = `<span class="h5 ms-2">${task.name}</span><hr><div class="scrollbar" style="max-height: 300px;">${replaceNewLine(task.content)}</div>`;
        tid = editor.addNode('task', 0, 0, posX, posY, 'task', 
        {
            
        }, html, false);

        lastPosX = posX;
        lastPosY = posY;
    }

    /** @param {import('$types').ConversationModel} conversation */
    function renderConversationNode(conversation) {
        let posX = lastPosX + 250, posY = lastPosX + 20;
        let html = "Initialize session";
        editor.addNodeOutput(tid);
        cid = editor.addNode('conversation', 1, 0, posX, posY, 'conversation', {}, html, false);
        editor.addConnection(tid, cid, "output_1", "input_1");
        lastPosX = posX;
        lastPosY = posY;
        mid = cid;
    }

    /** @param {string} message */
    function renderMessageNode(message) {
        let posX = lastPosX + nodeSpaceX, posY = lastPosY + nodeSpaceY;
        let html = `${message}`;
        editor.addNodeOutput(mid);
        let new_mid = editor.addNode('message', 1, 0, posX, posY, 'message', {}, html, false);
        editor.addConnection(mid, new_mid, "output_1", "input_1");

        lastPosX = posX;
        lastPosY = posY;
        mid = new_mid;
    }

    async function handleRunTaskSequentiallyInServer() {
        // clean nodes
        editor.clear();
        renderTaskNode();

        // new conversation
        const conversation = await newConversation(task.agent_id);
        conversationStore.set(conversation);
        renderConversationNode(conversation);
        
        await sendMessageToHub(task.agent_id, conversation.id, task.content);
        renderMessageNode(task.content);
    }

    async function handleRunTaskInteractively() {
        // clean nodes
        editor.clear();
        renderTaskNode();

        // new conversation
        const conversation = await newConversation(task.direct_agent_id);
        conversationStore.set(conversation);
        renderConversationNode(conversation);

        // split task into steps
        let steps = task.content.split('\n');
        for (let i = 0; i < steps.length; i++) {
            let step = steps[i];
            await sendMessageToHub(task.direct_agent_id, conversation.id, step);
            renderMessageNode(step);
        }        
    }
</script>

<div>
    <button class="btn btn-primary me-2" on:click={handleRunTaskSequentiallyInServer}><i class="bx bx-run"></i> Execute in {task?.agent_name}</button>
    {#if task?.direct_agent_id}
    <button class="btn btn-primary" on:click={handleRunTaskInteractively}><i class="bx bx-rocket"></i> Execute Interactively</button>
    {/if}
</div>

<div id="drawflow" style="height: 75vh; width: 100%">
</div>