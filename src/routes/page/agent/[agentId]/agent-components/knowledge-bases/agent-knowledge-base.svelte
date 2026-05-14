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

<div class="akb-card">
    <div class="akb-card-body">
        <div class="akb-header">
            <h5 class="akb-title">Knowledge Base</h5>
            <h6 class="akb-subtitle">Make your Agent have memory</h6>
        </div>

        <div class="akb-list" bind:this={scrollContainer}>
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
                <div class="akb-add">
                    <button
                        type="button"
                        class="akb-add-btn"
                        onclick={() => addKnowledgeBase()}
                    >
                        <i class="bx bx-plus"></i>
                        <span>Add Knowledge Base</span>
                    </button>
                </div>
            {/if}
        </div>
    </div>
</div>

<style>
    .akb-card {
        background-color: rgb(255 255 255);
        border: 1px solid rgb(229 231 235);
        border-radius: 0.625rem;
        box-shadow:
            0 1px 2px rgb(15 23 42 / 0.04),
            0 6px 16px -10px rgb(15 23 42 / 0.08);
        overflow: hidden;
    }
    .akb-card-body { padding: 1.25rem; }
    .akb-header { text-align: center; margin-bottom: 0.75rem; }
    .akb-title {
        margin: 0.25rem 0 0.5rem 0;
        font-size: 1rem;
        font-weight: 600;
        color: rgb(55 65 81);
    }
    .akb-subtitle {
        margin: 0.25rem 0 0.75rem 0;
        font-size: 0.8125rem;
        font-weight: 500;
        color: var(--color-muted);
    }
    .akb-list {
        display: flex;
        flex-direction: column;
        gap: 0.625rem;
        max-height: 500px;
        overflow-y: auto;
        scrollbar-width: thin;
        padding: 0 0.625rem;
    }
    .akb-add { display: flex; justify-content: center; padding-top: 0.25rem; }
    .akb-add-btn {
        display: inline-flex;
        align-items: center;
        gap: 0.375rem;
        padding: 0.4375rem 0.875rem;
        border: 1px solid var(--color-primary);
        border-radius: 0.375rem;
        background-color: var(--color-primary);
        color: rgb(255 255 255);
        font-size: 0.8125rem;
        font-weight: 500;
        cursor: pointer;
        transition: background-color 0.15s ease, border-color 0.15s ease, transform 0.05s ease;
    }
    .akb-add-btn:hover {
        background-color: var(--color-primary-hover);
        border-color: var(--color-primary-hover);
    }
    .akb-add-btn:active { transform: translateY(1px); }
    .akb-add-btn i { font-size: 1rem; line-height: 1; }

    @media (max-width: 1250px) {
        .akb-list { padding: 0 0.3125rem; }
    }
    :global(.dark) .akb-card {
        background-color: rgb(31 41 55);
        border-color: rgb(55 65 81);
    }
    :global(.dark) .akb-title { color: rgb(229 231 235); }
</style>