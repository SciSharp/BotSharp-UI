<script>
    import Drawflow from 'drawflow';
    import 'drawflow/dist/drawflow.min.css';
    import '$lib/drawflow/drawflow.css';
    import { getAgents } from '$lib/services/agent-service.js';
    import { onMount, createEventDispatcher } from 'svelte';

    let includeRoutingAgent = true;
    let includeTaskAgent = false;
    let includeStaticAgent = false;

    /** @type {any[]} */
    let agents = [];

    /** @type {any[]} */
    let agentNodes = [];

    /** @type {import('$types').AgentFilter} */
	const filter = {
		pager: { page: 1, size: 20, count: 0 },
        disabled: false,
        type: includeTaskAgent ? "task" : "none"
	};

    /** @type {import('$types').AgentModel[]} */
    export let routers;

    /** @type {Drawflow} */
    let editor;
    const dispatch = createEventDispatcher();
    
    onMount(async () => {
        const response = await getAgents(filter);
        agents = response?.items || [];

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
                agentNodes.push(node.data);
            });
            editor.on('nodeSelected', function(id) {
                console.log("Node selected " + id);
                // emit event
            });
            renderRoutingFlow();
        }
    });    

    function renderRoutingFlow(){
        editor.clear();
        let posX = 0;
        const nodeSpaceX = 300, nodeSpaceY = 120;

        let posY = nodeSpaceY * (agents.length + 1) / 2;

        // add end-user node
        let userNodeId = editor.addNode('user', 0, 1, posX, posY, 'user', 
        {
            id: "",
            profiles: [],
            agent: 'user'
        }, `<i class="mdi mdi-account font-size-16 text-info me-2"></i><span class="h6">User Request</span>`, false);

        // add router node
        posX += nodeSpaceX;
        let routerPosY = nodeSpaceY * (routers.length + 1) / 2;
        routers.forEach(router => {
            let profiles = [];
            const planner = getPlannerName(router);
            const chatTestLinkHtml = router.is_public ? 
                `<a href= "chat/${router.id}" class="btn btn-primary float-end" target="_blank"><i class="bx bx-chat"></i></a>` :
                '';
            let html = `<span class="h5">${router.name} ${chatTestLinkHtml}</span><span class="text-info">Routing with ${planner}</span>`;
            if (router.profiles.length > 0) {
                profiles = router.profiles;
                html += `<br/><i class="mdi mdi-folder font-size-16 text-info me-2"></i><span>${profiles.join(', ')}</span>`;
            }
            
            const data = {
                id: router.id,
                agent: router.name,
                profiles: profiles,
                type: router.type,
            };

            if (router.is_host) {
                html =`<img src="images/users/bot.png" height="30">${html}`;
            }
            let nodeId = editor.addNode('router', 1, 1, posX, routerPosY, 'router', data, `${html}`, false);;
            // connect user and router
            editor.addConnection(userNodeId, nodeId, `output_1`, `input_1`);    
            routerPosY += nodeSpaceY + 50;
        });

        posY = 100;
        posX += nodeSpaceX;
        agents.forEach(agent => {       
            let profiles = [];
            const chatTestLinkHtml = agent.is_public ? 
                `<a href= "chat/${agent.id}" class="btn btn-primary float-end" target="_blank"><i class="bx bx-chat"></i></a>` :
                '';
            let html = `<span class="h6">${agent.name}</span>${chatTestLinkHtml}`;
            if (agent.type == "static") {
                const taskLinkHtml = `<a href= "page/agent/${agent.id}/task" class="btn btn-primary float-end" target="_blank"><i class="bx bx-task"></i></a>`;
                html += taskLinkHtml;
            }
            if (agent.profiles.length > 0) {
                profiles = agent.profiles;
                html += `<br/><i class="mdi mdi-folder font-size-16 text-info me-2"></i>` + profiles.join(', ');
            }

            if (agent.is_host) {
                html =`<img src="images/users/bot.png" height="30">${html}`;
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
                            // editor.addConnection(userNodeId, nid, `output_1`, `input_1`);
                        }
                    });
                });
                
            } else {
                // profile is empty
                /*agentNodes.filter(ag => ag.type == "routing" && ag.profiles.length == 0)
                    .forEach(r => {
                        editor.addConnection(r.nid, nid, `output_1`, `input_1`);    
                    });*/
                
                editor.addConnection(userNodeId, nid, `output_1`, `input_1`);    
            }

            posY += nodeSpaceY;

            // draw fallback routing
            // fallback
            const fallback = agent.routing_rules.find(p => p.type == "fallback");
            if (fallback) {
                editor.addNodeOutput(nid);
                let router = agentNodes.find(ag => ag.id == fallback.redirectTo);
                if (router) {
                    editor.addNodeInput(router.nid);
                    var inputs = editor.getNodeFromId(router.nid).inputs;
                    let inputId = 0;
                    for (let prop in inputs) {
                        inputId++;
                    }
                    editor.addConnection(nid, router.nid, `output_1`, `input_${inputId}`);
                }
            }
        });
    }
    
    /** @param {import('$types').AgentModel} router */
    function getPlannerName(router) {
        const planner = router.routing_rules.find(p => p.type == "planner");
        return planner?.field ?? "NaviePlanner";
    }

    async function handleTaskAgentSelected() {
        includeTaskAgent = !includeTaskAgent;
        filter.type = includeTaskAgent ? "task" : "none";
        filter.type += includeStaticAgent ? ",static" : ",none";
        const response = await getAgents(filter);
        agents = response?.items || [];
        renderRoutingFlow();
    }

    async function handleStaticAgentSelected() {
        includeStaticAgent = !includeStaticAgent;
        filter.type = includeTaskAgent ? "task" : "none";
        filter.type += includeStaticAgent ? ",static" : ",none";
        const response = await getAgents(filter);
        agents = response?.items || [];
        renderRoutingFlow();
    }

</script>

<div class="btn-group" role="group">
    <input type="checkbox" class="btn-check active" id="btncheck1" autocomplete="off"/>
    <label class={`btn btn-${includeRoutingAgent ? "" : "outline-"}primary`} for="btncheck1">Routing Agent</label>

    <input type="checkbox" class="btn-check" id="btncheck2" autocomplete="off" on:click={handleTaskAgentSelected} />
    <label class={`btn btn-${includeTaskAgent ? "" : "outline-"}primary`} for="btncheck2">Task Agent</label>

    <input type="checkbox" class="btn-check" id="btncheck3" autocomplete="off" on:click={handleStaticAgentSelected} />
    <label class={`btn btn-${includeStaticAgent ? "" : "outline-"}primary`} for="btncheck3">Static Agent</label>
</div>

<div id="drawflow" style="height: 78vh; width: 100%">
</div>