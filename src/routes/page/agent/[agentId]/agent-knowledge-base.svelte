<script>
    import { onMount } from 'svelte';
    import { Card, CardBody, Input, Button } from '@sveltestrap/sveltestrap';
	import { getVectorKnowledgeCollections } from '$lib/services/knowledge-base-service';
	import { KnowledgeCollectionDisplayType } from '$lib/helpers/enums';

    const limit = 5;

    /** @type {import('$agentTypes').AgentModel} */
    export let agent;

    export const fetchKnowledgeBases = () => {
        const candidates = innerKnowledgeBases?.filter(x => !!x.name)?.map(x => {
            return {
                name: x.name,
                type: x.type,
                disabled: x.disabled
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

        refresh(knowledgeBases);
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
                disabled: false
            };
        }) || [];
        refresh(list);
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
        
        const vals = e.target.value.split("#");
        found.name = vals[0];
        found.type = vals[1];
        refresh(innerKnowledgeBases);
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
    }

    /** @param {number} idx */
    function deleteKnowledgeBase(idx) {
        innerKnowledgeBases = innerKnowledgeBases.filter((_, index) => index !== idx);
    }

    /**
     * @param {any} e
	 * @param {number} uid
	 */
    function toggleKnowledgeBase(e, uid) {
        const found = innerKnowledgeBases.find((_, index) => index === uid);
        if (!found) return;

        found.disabled = !e.target.checked;
        refresh(innerKnowledgeBases);
    }


    /** @param {import('$agentTypes').AgentKnowledgeBase[]} list */
    function refresh(list) {
        innerKnowledgeBases = list?.map(x => {
            return {
                name: x.name,
                type: x.type,
                displayName: x.displayName,
                disabled: x.disabled
            }
        }) || [];
    }

</script>

<Card>
    <CardBody>
        <div class="text-center">
            <h5 class="mt-1 mb-3">Knowledge Bases</h5>
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
                                    title="Uncheck to disable utility"
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
                                        <option value={`${option.name}#${option.type}`} selected={option.name == knowledge.name}>
                                            {option.displayName}
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