<script>
    import Drawflow from 'drawflow';
    import 'drawflow/dist/drawflow.min.css';
    import '$lib/drawflow/drawflow.css';
    import { getAgents } from '$lib/services/agent-service.js';
    import { onMount, createEventDispatcher } from 'svelte';

    /** @type {import('$types').AgentModel[]} */
    let agents = [];

    /** @type {import('$types').AgentModel} */
    export let router;
    const dispatch = createEventDispatcher();
    
    onMount(async () => {
        agents = await getAgents({
            isRouter: false,
            isEvaluator: false,
            allowRouting: true
        });

        const container = document.getElementById("drawflow");
        const editor = new Drawflow(container);
        editor.reroute = true;
        editor.reroute_fix_curvature = true;

        editor.start();

        renderRoutingFlow(editor);
    });    

    /** @param {Drawflow} editor*/
    function renderRoutingFlow(editor){
        const data = {
            name: ''
        };

        let posX = 0;
        let nodeSpace = 200;
        let nodeId = 1;
        let posY = 100 * agents.length / 2 + 50;

        // add end-user node
        let userNodeId = nodeId;
        editor.addNode('user', 0, 1, posX, posY, 'user', data, `User Request`, false);

        // add router node
        posX += nodeSpace;
        nodeId++;
        let routerNodeId = nodeId;
        editor.addNode('router', 1, 1, posX, posY, 'router', data, `Router (${router.name})`, false);

        // connect user and router
        editor.addConnection(1, nodeId, `output_1`, `input_1`);    

        posY = 100;
        posX += nodeSpace;
        nodeId++;
        agents.forEach(agent => { 
            editor.addNode('agent', 1, 0, posX, posY, 'agent', data, `Agent (${agent.name})`, false);    
            editor.addConnection(2, nodeId, `output_1`, `input_1`);    
            posY += 100;
            nodeId++;
        });

        editor.on('nodeSelected', function(id) {
            console.log("Node selected " + id);
            // emit event
            if (id == userNodeId) {
                dispatch('userNodeSelected', {});
            } else if (id == routerNodeId) {
                dispatch('routerNodeSelected', {agent: router});
            } else {
                dispatch('agentNodeSelected', {agent: agents[id - routerNodeId - 1]});
            }
        });
    }
    
</script>

<div id="drawflow" style="height: 75vh; width: 100%">
</div>
