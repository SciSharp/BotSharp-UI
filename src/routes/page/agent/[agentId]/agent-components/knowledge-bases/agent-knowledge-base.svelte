<script>
    import { onMount } from 'svelte';
    import { Card, CardBody, Button } from '@sveltestrap/sveltestrap';
	import { getVectorKnowledgeCollections } from '$lib/services/knowledge-base-service';
	import { KnowledgeCollectionDisplayType } from '$lib/helpers/enums';
	import { DECIMAL_REGEX } from '$lib/helpers/constants';
	import { scrollToBottom } from '$lib/helpers/utils/common';
	import AgentKnowledgeBaseItem from './agent-knowledge-base-item.svelte';

    const limit = 100;
    const confidLowerBound = 0;
    const confidUpperBound = 1;

    /** @type {import('$agentTypes').AgentModel} */
    export let agent;

    /** @type {() => void} */
    export let handleAgentChange = () => {};

    export const fetchKnowledgeBases = () => {
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
    let knowledgeBaseOptions = [];

    /** @type {import('$agentTypes').AgentKnowledgeBase[]} */
    let innerKnowledgeBases = [];

    /** @type {HTMLElement} */
    let scrollContainer;

    onMount(async () =>{
        getVectorKnowledgeCollections().then(data => {
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
        return `${b.name} ${!!KnowledgeCollectionDisplayType[b.type]
                   ? `(${KnowledgeCollectionDisplayType[b.type]})` : ''}`
    }

    /**
	 * @param {any} e
	 * @param {number} idx
	 */
    function changeKnowledgeBase(e, idx) {
        const found = innerKnowledgeBases.find((_, index) => index === idx);
        if (!found) return;
        
        const field = e.detail.field;
        if (field === 'knowledge') {
            const val = JSON.parse(e.detail.value);
            found.name = val?.name;
            found.type = val?.type;
        } else if (field === 'confidence') {
            const value = e.detail.value;
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
     * @param {any} e
	 * @param {number} idx
	 */
    function deleteKnowledgeBase(e, idx) {
        innerKnowledgeBases = innerKnowledgeBases.filter((_, index) => index !== idx);
        handleAgentChange();
    }

    /**
     * @param {any} e
	 * @param {number} idx
	 */
    function toggleKnowledgeBase(e, idx) {
        const found = innerKnowledgeBases.find((_, index) => index === idx);
        if (!found) return;

        found.disabled = !e.detail.checked;
        innerRefresh(innerKnowledgeBases);
        handleAgentChange();
    }

    /**
     * @param {any} e
	 * @param {number} idx
	 */
    function toggleCollapse(e, idx) {
        const found = innerKnowledgeBases.find((_, index) => index === idx);
        if (!found) return;

        found.expanded = !e.detail.collapsed;
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

<Card>
    <CardBody>
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
                    on:toggle={e => toggleKnowledgeBase(e, uid)}
                    on:delete={e => deleteKnowledgeBase(e, uid)}
                    on:change={e => changeKnowledgeBase(e, uid)}
                    on:collapse={e => toggleCollapse(e, uid)}
                />
            {/each}

            {#if innerKnowledgeBases.length < limit}
                <div class="add-utility">
                    <Button color="primary" on:click={() => addKnowledgeBase()}>
                        <span>
                            <i class="bx bx-plus" />
                            <span>Add Knowledge Base</span>
                        </span>
                    </Button>
                </div>
            {/if}
        </div>
    </CardBody>
</Card>