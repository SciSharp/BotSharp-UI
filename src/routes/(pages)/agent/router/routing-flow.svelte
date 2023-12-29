<script>
    import Drawflow from 'drawflow';
    import 'drawflow/dist/drawflow.min.css';
    import '$lib/drawflow/drawflow.css';
    import { onMount } from 'svelte';

    /** @type {import('$types').AgentModel[]} */
    export let agents;

    /** @type {import('$types').AgentModel} */
    export let router;
    
    onMount(async () => {
        var id = document.getElementById("drawflow");
        const editor = new Drawflow(id);
        editor.reroute = true;
        editor.reroute_fix_curvature = true;

        editor.start();

        const data = {
            name: router.name
        };

        let posX = 0;
        let nodeSpace = 200;
        let nodeId = 1;
        let posY = 100 * agents.length / 2 + 50;

        // add end-user node
        editor.addNode('user', 0, 1, posX, posY, 'user', data, `User Request`);

        // add router node
        posX += nodeSpace;
        nodeId++;
        editor.addNode('router', 1, 1, posX, posY, 'router', data, `Router (${router.name})`);

        // connect user and router
        editor.addConnection(1, nodeId, `output_1`, `input_1`);    

        posY = 100;
        posX += nodeSpace;
        nodeId++;
        agents.forEach(agent => { 
            editor.addNode('agent', 1, 0, posX, posY, 'agent', data, `Agent (${agent.name})`);    
            editor.addConnection(2, nodeId, `output_1`, `input_1`);    
            posY += 100;
            nodeId++;
        });
    });    
    
</script>

<div id="drawflow" style="height: 75vh; width: 100vh">
</div>
