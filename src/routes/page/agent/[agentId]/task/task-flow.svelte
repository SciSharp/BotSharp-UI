<script>
    import Drawflow from 'drawflow';
    import 'drawflow/dist/drawflow.min.css';
    import '$lib/drawflow/drawflow.css';
    import { onMount, createEventDispatcher } from 'svelte';

    /** @type {import('$types').AgentModel} */
    export let agent;
    /** @type {import('$types').AgentTemplate[]} */
    let taskNodes = [];

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
            });
            renderTaskFlow(editor);
        }
    });    

    /** @param {Drawflow} editor */
    function renderTaskFlow(editor){
        let posX = 0;
        const nodeSpaceX = 300, nodeSpaceY = 120;

        let posY = nodeSpaceY * (agent.templates.length + 1) / 2;

        // add end-user node
        let agentNodeId = editor.addNode('agent', 0, 1, posX, posY, 'agent', 
        {
            id: ""
        }, `<img src=${agent.icon_url} height="30" /><span class="h6">${agent.name}</span>`, false);

        posY = 100;
        posX += nodeSpaceX;
        agent.templates.forEach(template => {       
            const chatTestLinkHtml = `<a href= "/page/agent/${agent.id}/task/${template.name}" class="btn btn-primary float-end" target="_blank"><i class="bx bx-run"></i></a>`;
            let html = `<span class="h6">${template.name}</span>${chatTestLinkHtml}`;
            
            const data = {
                id: agent.id,
                agent: agent.name
            };
            let nid = editor.addNode('agent', 1, 0, posX, posY, 'enabled-node', data, html, false);
            editor.addConnection(agentNodeId, nid, "output_1", "input_1");

            posY += nodeSpaceY;
        });
    }
    
    /** @param {import('$types').AgentModel} router */
    function getPlannerName(router) {
        const planner = router.routing_rules.find(p => p.type == "planner");
        return planner?.field ?? "NaviePlanner";
    }
</script>

<div id="drawflow" style="height: 75vh; width: 100%">
</div>