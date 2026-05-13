<script>
    import { onMount } from 'svelte';
	import { getKnowledgeCollections } from '$lib/services/knowledge-base-service';
	import { KnowledgeBaseDisplayType } from '$lib/helpers/enums';
	import { scrollToBottom } from '$lib/helpers/utils/common';
	import AgentKnowledgeBaseItem from './agent-knowledge-base-item.svelte';

    const limit = 100;
    const confidLowerBound = 0;
    const confidUpperBound = 1;

    /**
     * @type {{
     *   agent: import('$agentTypes').AgentModel,
     *   handleAgentChange?: () => void
     * }}
     */
    let {
        agent,
        handleAgentChange = () => {}
    } = $props();

    export function fetchKnowledgeBases() {
        const candidates = innerKnowledgeBases?.filter(x => !!x.name)?.map(x => {
            return {
                ...x,
                name: x.name,
                type: x.type,
                disabled: x.disabled,
                confidence: x.confidence
            };
        });

        /** @type {import('$agentTypes').AgentKnowledgeBase[]} */
        const knowledgeBases = [];
        const unique = new Set();
        candidates.forEach(x => {
            if (!unique.has(x.name)) {
                knowledgeBases.push(x);
                unique.add(x.name);
            }
        });

        innerRefresh(knowledgeBases);
        return knowledgeBases;
    }

    /** @type {any[]} */
    let knowledgeBaseOptions = $state([]);

    /** @type {import('$agentTypes').AgentKnowledgeBase[]} */
    let innerKnowledgeBases = $state([]);

    /** @type {HTMLElement} */
    let scrollContainer;

    onMount(async () => {
        getKnowledgeCollections().then(data => {
            const list = data?.map(x => {
                return {
                    name: x.name,
                    type: x.type,
                    displayName: getDisplayOption(x)
                };
            }) || [];
            knowledgeBaseOptions = [{
                name: "",
                type: "",
                displayName: ""
            }, ...list];
        });
        init();
    });

    function init() {
        const list = agent.knowledge_bases?.map(x => {
            return {
                ...x,
                displayName: getDisplayOption(x),
            };
        }) || [];
        innerRefresh(list);
    }

    /** @param {import('$agentTypes').AgentKnowledgeBase | any} b */
    function getDisplayOption(b) {
        return `${b.name} ${KnowledgeBaseDisplayType[b.type]
                   ? `(${KnowledgeBaseDisplayType[b.type]})` : ''}`
    }

    /**
	 * @param {{ knowledgeIdx: number, field: string, value: any }} data
	 * @param {number} idx
	 */
    function changeKnowledgeBase(data, idx) {
        const found = innerKnowledgeBases.find((_, index) => index === idx);
        if (!found) return;

        const field = data.field;
        if (field === 'knowledge') {
            const val = JSON.parse(data.value);
            found.name = val?.name;
            found.type = val?.type;
        } else if (field === 'confidence') {
            const value = data.value;
            const confidence = validateConfidenceNumber(value);
            found.confidence = confidence;
        }

        innerRefresh(innerKnowledgeBases);
        handleAgentChange();
    }

	/** @param {string} value */
	function validateConfidenceNumber(value) {
        let confidence;
		const num = Number(value);

		if (isNaN(num) || num < confidLowerBound) {
			confidence = '0.0';
		} else if (num >= confidUpperBound) {
			confidence = '1.0';
		} else {
			confidence = num.toFixed(1);
		}
		return Number(confidence);
	}

    function addKnowledgeBase() {
        innerKnowledgeBases = [
            ...innerKnowledgeBases,
            {
                name: '',
                type: '',
                displayName: '',
                disabled: false,
                expanded: true
            }
        ];
        scrollToBottom(scrollContainer);
        handleAgentChange();
    }

    /**
	 * @param {{ knowledgeIdx: number }} _data
	 * @param {number} idx
	 */
    function deleteKnowledgeBase(_data, idx) {
        innerKnowledgeBases = innerKnowledgeBases.filter((_, index) => index !== idx);
        handleAgentChange();
    }

    /**
	 * @param {{ knowledgeIdx: number, checked: boolean }} data
	 * @param {number} idx
	 */
    function toggleKnowledgeBase(data, idx) {
        const found = innerKnowledgeBases.find((_, index) => index === idx);
        if (!found) return;

        found.disabled = !data.checked;
        innerRefresh(innerKnowledgeBases);
        handleAgentChange();
    }

    /**
	 * @param {{ knowledgeIdx: number, collapsed: boolean }} data
	 * @param {number} idx
	 */
    function toggleCollapse(data, idx) {
        const found = innerKnowledgeBases.find((_, index) => index === idx);
        if (!found) return;

        found.expanded = !data.collapsed;
        innerRefresh(innerKnowledgeBases);
        handleAgentChange();
    }


    /** @param {import('$agentTypes').AgentKnowledgeBase[]} list */
    function innerRefresh(list) {
        innerKnowledgeBases = list?.map(x => {
            return {
                ...x,
                name: x.name,
                type: x.type,
                displayName: x.displayName,
                disabled: x.disabled,
                confidence: x.confidence
            }
        }) || [];
    }
</script>

<div class="card">
    <div class="card-body">
        <div class="text-center">
            <h5 class="mt-1 mb-3">Knowledge Base</h5>
            <h6 class="mt-1 mb-3">Make your Agent have memory</h6>
        </div>

        <div class="agent-utility-container" bind:this={scrollContainer}>
            {#each innerKnowledgeBases as knowledge, uid (uid)}
                <AgentKnowledgeBaseItem
                    knowledge={knowledge}
                    knwoledgeIdx={uid}
                    collapsed={!knowledge.expanded}
                    knowledgeBaseOptions={knowledgeBaseOptions}
                    ontoggle={data => toggleKnowledgeBase(data, uid)}
                    ondelete={data => deleteKnowledgeBase(data, uid)}
                    onchange={data => changeKnowledgeBase(data, uid)}
                    oncollapse={data => toggleCollapse(data, uid)}
                />
            {/each}

            {#if innerKnowledgeBases.length < limit}
                <div class="add-utility">
                    <button
                        type="button"
                        class="btn btn-primary"
                        onclick={() => addKnowledgeBase()}
                    >
                        <span>
                            <i class="bx bx-plus"></i>
                            <span>Add Knowledge Base</span>
                        </span>
                    </button>
                </div>
            {/if}
        </div>
    </div>
</div>