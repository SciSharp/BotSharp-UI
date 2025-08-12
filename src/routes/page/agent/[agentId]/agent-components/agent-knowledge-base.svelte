<script>
    import { onMount } from 'svelte';
    import { Card, CardBody, Input, Button } from '@sveltestrap/sveltestrap';
	import { getVectorKnowledgeCollections } from '$lib/services/knowledge-base-service';
	import { KnowledgeCollectionDisplayType } from '$lib/helpers/enums';
	import { DECIMAL_REGEX } from '$lib/helpers/constants';

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
        
        const val = JSON.parse(e.target.value);
        found.name = val?.name;
        found.type = val?.type;
        innerRefresh(innerKnowledgeBases);
        handleAgentChange();
    }

    /**
	 * @param {any} e
	 * @param {number} idx
	 */
    function changeConfidence(e, idx) {
        const found = innerKnowledgeBases.find((_, index) => index === idx);
        if (!found) return;
        
        const value = e.target.value;
		const confidence = validateConfidenceNumber(value);
        found.confidence = confidence;
        innerRefresh(innerKnowledgeBases);
        handleAgentChange();
    }

    /** @param {any} e */
    function validateConfidenceInput(e) {
        const reg = new RegExp(DECIMAL_REGEX, 'g');
        if (e.key !== 'Backspace' && !reg.test(e.key)) {
            e.preventDefault();
        }
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
                disabled: false
            }
        ];
        handleAgentChange();
    }

    /** @param {number} idx */
    function deleteKnowledgeBase(idx) {
        innerKnowledgeBases = innerKnowledgeBases.filter((_, index) => index !== idx);
        handleAgentChange();
    }

    /**
     * @param {any} e
	 * @param {number} uid
	 */
    function toggleKnowledgeBase(e, uid) {
        const found = innerKnowledgeBases.find((_, index) => index === uid);
        if (!found) return;

        found.disabled = !e.target.checked;
        innerRefresh(innerKnowledgeBases);
        handleAgentChange();
    }


    /** @param {import('$agentTypes').AgentKnowledgeBase[]} list */
    function innerRefresh(list) {
        innerKnowledgeBases = list?.map(x => {
            return {
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

        <div class="agent-utility-container">
            {#each innerKnowledgeBases as knowledge, uid (uid)}
                <div class="utility-wrapper">
                    <div class="utility-row utility-row-primary">
                        <div class="utility-label fw-bold">
                            <div class="line-align-center">{`Collection #${uid + 1}`}</div>
                            <div class="utility-tooltip">
                                <div class="line-align-center">
                                    <Input
                                        type="checkbox"
                                        checked={!knowledge.disabled}
                                        on:change={e => toggleKnowledgeBase(e, uid)}
                                    />
                                </div>
                                <div
                                    class="line-align-center"
                                    data-bs-toggle="tooltip"
                                    data-bs-placement="top"
                                    title="Uncheck to disable knowledgebase"
                                >
                                    <i class="bx bx-info-circle" />
                                </div>
                            </div>
                        </div>
                        <div class="utility-value">
                            <div class="utility-input line-align-center">
                                <Input
                                    type="select"
                                    disabled={knowledge.disabled}
                                    on:change={e => changeKnowledgeBase(e, uid)}
                                >
                                    {#each [...knowledgeBaseOptions] as option}
                                        <option value={`${JSON.stringify(option)}`} selected={option.name == knowledge.name}>
                                            {option.displayName || option.name}
                                        </option>
                                    {/each}
                                </Input>
                            </div>
                            <div class="utility-delete line-align-center">
                                <i
                                    class="bx bxs-no-entry text-danger clickable"
                                    role="link"
                                    tabindex="0"
                                    on:keydown={() => {}}
                                    on:click={() => deleteKnowledgeBase(uid)}
                                />
                            </div>
                        </div>
                    </div>
                    <div class="utility-row utility-row-secondary">
                        <div class="utility-content">
                            <div class="utility-list-item">
                                <div class="utility-label line-align-center">
                                    {'Confidence'}
                                </div>
                                <div class="utility-value">
                                    <div class="utility-input line-align-center">
                                        <Input
                                            type="text"
                                            class="text-center"
                                            bind:value={knowledge.confidence}
                                            disabled={knowledge.disabled}
                                            on:keydown={e => validateConfidenceInput(e)}
                                            on:blur={e => changeConfidence(e, uid)}
                                        />
                                    </div>
                                    <div class="utility-delete line-align-center"></div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
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