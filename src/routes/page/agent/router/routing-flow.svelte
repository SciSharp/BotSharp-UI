<script>
    import Drawflow from 'drawflow';
    import 'drawflow/dist/drawflow.min.css';
    import '$lib/drawflow/drawflow.css';
    import { getAgents } from '$lib/services/agent-service.js';
    import { onMount, createEventDispatcher } from 'svelte';

    /** @type {any[]} */
    let agents = [];
    let agentNodes = [];
    let legends = [];

    /** @type {import('$types').AgentFilter} */
	const filter = {
		pager: { page: 1, size: 20, count: 0 },
        disabled: false,
        type: "task"
	};

    /** @type {import('$types').AgentModel[]} */
    export let routers;

    const dispatch = createEventDispatcher();
    
    onMount(async () => {
        const response = await getAgents(filter);
        agents = response?.items || [];

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
                agentNodes.push(node.data);
            });
            editor.on('nodeSelected', function(id) {
                console.log("Node selected " + id);
                // emit event
            });
            renderRoutingFlow(editor);
        }
    });    

    /** @param {Drawflow} editor*/
    function renderRoutingFlow(editor){
        let posX = 0;
        let nodeSpace = 250;
        let posY = 100 * agents.length / 2 + 50;

        // add end-user node
        let userNodeId = editor.addNode('user', 0, 1, posX, posY, 'user', 
        {
            id: "",
            profiles: [],
            agent: 'user'
        }, `<i class="mdi mdi-account font-size-16 text-info me-2"></i><span class="h6">User Request</span>`, false);

        // add router node
        posX += nodeSpace;
        let hostNodeId = 0;
        let routerPosY = posY;
        routers.forEach(router => {
            let profiles = [];
            let html = `<span class="h6">${router.name}</span>`;
            if (router.profiles.length > 0) {
                profiles = router.profiles;
                html += `<br/><i class="mdi mdi-folder font-size-16 text-info me-2"></i>${profiles.join(', ')}`;
            }
            
            const data = {
                id: router.id,
                agent: router.name,
                profiles: profiles,
                type: router.type,
            };

            let nodeId = 0;
            if (router.is_host) {
                nodeId = editor.addNode('host', 1, 1, posX, routerPosY, 'router', data, `<img src="/images/users/bot.png" height="30">${html}`, false);
                hostNodeId = nodeId;
            } else {
                nodeId = editor.addNode('router', 1, 1, posX, routerPosY, 'router', data, `${html}`, false);
            }
            // connect user and router
            editor.addConnection(userNodeId, nodeId, `output_1`, `input_1`);    
            routerPosY += 100;
        });

        posY = 100;
        posX += nodeSpace;
        agents.forEach(agent => {       
            let profiles = [];
            let html = `<span class="h6">${agent.name}</span>`;
            if (agent.profiles.length > 0) {
                profiles = agent.profiles;
                html += `<br/><i class="mdi mdi-folder font-size-16 text-info me-2"></i>` + profiles.join(', ');
            }
            
            const data = {
                id: agent.id,
                agent: agent.name,
                profiles: profiles
            };
            let nid = editor.addNode('agent', 1, 0, posX, posY, 'enabled-node', data, html, false);

            // connect by profile
            if (profiles.length > 0) {
                // match profile
                profiles.forEach(profile => {
                    agentNodes.filter(ag => ag.type == "routing")
                    .forEach(r => {
                        if (r.profiles.find((p) => p == profile)) {
                            editor.addConnection(r.nid, nid, `output_1`, `input_1`);
                        } else {
                            // editor.removeNodeInput(nid, "input_2");
                        }
                    });
                });
                
            } else {
                // profile is empty
                agentNodes.filter(ag => ag.type == "routing" && ag.profiles.length == 0)
                    .forEach(r => {
                        editor.addConnection(r.nid, nid, `output_1`, `input_1`);    
                    });
            }

            posY += 100;
        });
    }
    
</script>

<div id="drawflow" style="height: 75vh; width: 100%">
</div>