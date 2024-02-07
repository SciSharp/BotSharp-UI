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
    let lastPosY = 0;
    const nodeSpaceX = 50, nodeSpaceY = 50;
    let messageCount = 0;

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
    });    

    function renderTaskNode() {
        let posX = 0;
        let posY = 20;

        // draw task node
        let html = `<span class="h5 ms-2">${task.name}</span><hr><div class="scrollbar" style="max-height: 300px;">${replaceNewLine(task.content)}</div>`;
        tid = editor.addNode('task', 0, 0, posX, posY, 'task', 
        {
            
        }, html, false);

        lastPosX = posX;
        lastPosY = posY;

        const scrollElements = document.querySelectorAll('.scrollbar');
		scrollElements.forEach((item) => {
			const scrollbar = OverlayScrollbars(item, options);
		});

        messageCount = 0;
        editor.zoom_reset();
    }

    /** @param {import('$types').ConversationModel} conversation */
    function renderConversationNode(conversation) {
        let posX = lastPosX + 250 + nodeSpaceX, posY = lastPosY;
        let html = "New conversation";
        html += `<a href= "chat/${conversation.agent_id}" class="btn btn-primary float-end" target="_blank"><i class="bx bx-chat"></i></a>`;
        editor.addNodeOutput(tid);
        cid = editor.addNode('conversation', 1, 0, posX, posY, 'conversation', {}, html, false);
        editor.addConnection(tid, cid, "output_1", "input_1");
        lastPosX = posX;
        lastPosY = posY;
        mid = cid;
    }

    /** @param {string} message 
     * @param {import('$types').ChatResponseModel} response
    */
    function renderMessageNode(message, response) {
        let posX = lastPosX + nodeSpaceX, posY = lastPosY + nodeSpaceY;
        let html = `${message}`;
        if (response.data) {
            html += `<img src=${response.data} alt="" width="165px"/>`
        }
        html += `<div class="bg-info mt-1 mb-1 p-1 rounded">${response.text}</div>`;

        editor.addNodeOutput(mid);
        let new_mid = editor.addNode('message', 1, 0, posX, posY, 'message', {}, html, false);
        editor.addConnection(mid, new_mid, "output_1", "input_1");

        lastPosX = posX;
        lastPosY = posY;
        mid = new_mid;

        messageCount++;
        if (messageCount % 10 == 0) {
            // editor.zoom_out();
            lastPosX = lastPosX + nodeSpaceX;
            lastPosY = 0;
        }
    }

    async function handleRunTaskSequentiallyInServer() {
        // clean nodes
        editor.clear();
        renderTaskNode();

        // new conversation
        const conversation = await newConversation(task.agent_id);
        conversationStore.set(conversation);
        renderConversationNode(conversation);
        
        var response = await sendMessageToHub(task.agent_id, conversation.id, task.content);
        renderMessageNode(task.content, response);
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
            const response = await sendMessageToHub(task.direct_agent_id, conversation.id, step, '', ['hide_context=true']);
            if (response.text.includes("failed")) {
                break;
            }
            renderMessageNode(step, response);
        }        
    }
</script>

<div>
    <button class="btn btn-primary me-2" on:click={handleRunTaskSequentiallyInServer}><i class="bx bx-run"></i> Execute Sequentially through Router</button>
    {#if task?.direct_agent_id}
    <button class="btn btn-primary" on:click={handleRunTaskInteractively}><i class="bx bx-rocket"></i> Execute Interactively</button>
    {/if}
</div>

<div id="drawflow" style="height: 75vh; width: 100%">
</div>