<script>
    import Drawflow from 'drawflow';
    import 'drawflow/dist/drawflow.min.css';
    import '$lib/drawflow/drawflow.css';
    import { getAgents } from '$lib/services/agent-service.js';
    import { onMount, createEventDispatcher } from 'svelte';

    /** @type {any[]} */
    let agents = [];

    /** @type {import('$types').AgentFilter} */
	const filter = {
		pager: { page: 1, size: 20, count: 0 },
        allowRouting: true
	};

    /** @type {import('$types').AgentModel[]} */
    export let routers;

    const dispatch = createEventDispatcher();
    
    onMount(async () => {
        const response = await getAgents(filter);
        agents = response?.items || [];

        const container = document.getElementById("drawflow");
        if (!!container) {
            const editor = new Drawflow(container);
            editor.reroute = true;
            editor.reroute_fix_curvature = true;
            editor.start();
            renderRoutingFlow(editor);
        }
    });    

    /** @param {Drawflow} editor*/
    function renderRoutingFlow(editor){
        const data = {
            name: ''
        };

        let posX = 0;
        let nodeSpace = 250;
        let nodeId = 1;
        let posY = 100 * agents.length / 2 + 50;

        // add end-user node
        let userNodeId = nodeId;
        editor.addNode('user', 0, 1, posX, posY, 'user', data, `User Request`, false);

        // add router node
        posX += nodeSpace;
        nodeId++;
        let routerNodeId = nodeId;
        let hostNodeId = nodeId;
        let routerPosY = posY;
        routers.forEach(router => {
            const profiles = router.profiles.join(', ');
            if (router.is_host) {
                editor.addNode('host', 1, 1, posX, routerPosY, 'router', data, `${router.name} (Host Router) ${profiles}`, false);
                hostNodeId = nodeId;
            } else {
                editor.addNode('router', 1, 1, posX, routerPosY, 'router', data, `${router.name} (Routing Agent) ${profiles}`, false);
            }
            // connect user and router
            editor.addConnection(1, nodeId, `output_1`, `input_1`);    
            routerPosY += 100;
            nodeId++;
        });

        posY = 100;
        posX += nodeSpace;
        agents.forEach(agent => {       
            const profiles = agent.profiles.join(', ');          
            editor.addNode('agent', 1, 0, posX, posY, 'enabled-node', data, `${agent.name} (Task Agent) ${profiles}`, false);
            editor.addConnection(hostNodeId, nodeId, `output_1`, `input_1`);    
            posY += 100;
            nodeId++;
        });

        editor.on('nodeSelected', function(id) {
            console.log("Node selected " + id);
            // emit event
            if (id == userNodeId) {
                dispatch('userNodeSelected', {});
            } else if (id == routerNodeId) {
                dispatch('routerNodeSelected', {});
            } else {
                dispatch('agentNodeSelected', {agent: agents[id - routerNodeId - 1]});
            }
        });
    }
    
</script>

<div id="drawflow" style="height: 75vh; width: 100%">
</div>