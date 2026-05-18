<script>
    import { getAgentRuleOptionsById } from '$lib/services/agent-service';
	import LoadingToComplete from '$lib/common/spinners/LoadingToComplete.svelte';
	import { scrollToBottom } from '$lib/helpers/utils/common';
	import AgentRuleItem from './agent-rule-item.svelte';

    const limit = 100;

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

    /** @type {boolean} */
    let isLoading = $state(false);
    /** @type {boolean} */
    let isComplete = $state(false);
    /** @type {boolean} */
    let isError = $state(false);
    /** @type {number} */
    let windowWidth = $state(0);
    /** @type {string} */
    let successText = $state('');
    /** @type {string} */
    let errorText = $state('');

    export const fetchRules = () => {
        const candidates = innerRules?.filter(x => !!x.trigger_name)?.map(x => {
            return {
                trigger_name: x.trigger_name,
                disabled: x.disabled,
                config: x.config,
                expanded: x.expanded
            };
        });

        /** @type {import('$agentTypes').AgentRule[]} */
        const rules = [];
        const unique = new Set();
        candidates.forEach(x => {
            if (!unique.has(x.trigger_name)) {
                rules.push(x);
                unique.add(x.trigger_name);
            }
        });

        innerRefresh(rules);
        return rules;
    }

    /** @type {any[]} */
    let ruleOptions = $state([]);

    /** @type {import('$agentTypes').AgentRule[]} */
    let innerRules = $state([]);

    /** @type {HTMLElement} */
    let scrollContainer;

    // React to agent.id changes to reload agent-specific trigger options
    $effect(() => {
        if (agent?.id) {
            // Capture current agent.id to prevent race conditions
            const requestedAgentId = agent.id;

            // Reset state when agent changes
            ruleOptions = [];
            innerRules = [];

            // Load agent-specific data with error handling
            void (async () => {
                try {
                    await Promise.all([
                        loadAgentRuleOptions(requestedAgentId)
                    ]);
                } catch (error) {
                    // Error already logged in individual loaders
                    // Ensure init() is called even if options fail to load
                    // so existing agent rules still render
                    if (agent.id === requestedAgentId && innerRules.length === 0) {
                        init();
                    }
                }
            })();
        }
    });

    // Initialize window size on mount
    $effect(() => {
        resizeWindow();
    });

    /**
     * @param {string} requestedAgentId - The agent ID for which we're loading options
     */
    function loadAgentRuleOptions(requestedAgentId) {
        return new Promise((resolve, reject) => {
            getAgentRuleOptionsById(requestedAgentId).then(data => {
                // Guard: only apply results if agent hasn't changed
                if (agent.id !== requestedAgentId) {
                    resolve('stale');
                    return;
                }

                const list = data?.map(x => {
                    return {
                        name: x.trigger_name,
                        displayName: "",
                        output_args: x.output_args,
                        json_args: x.json_args,
                        statement: x.statement
                    };
                }) || [];
                ruleOptions = [{
                    name: "",
                    displayName: ""
                }, ...list];
                init();
                resolve('done');
            }).catch(error => {
                console.error('Failed to load agent rule options:', error);
                // Guard: only apply error state if agent hasn't changed
                if (agent.id === requestedAgentId) {
                    ruleOptions = [{ name: "", displayName: "" }];
                }
                reject(error);
            });
        });
    }

    function init() {
        const list = agent.rules?.map(x => {
            return {
                ...x,
                displayName: ""
            };
        }) || [];
        innerRefresh(list);
    }
    
    /**
	 * @param {any} data
	 * @param {number} idx
	 */
    function changeRule(data, idx) {
        const found = innerRules.find((_, index) => index === idx);
        if (!found) return;

        const field = data.field;
        const value = data.value;
        if (field === 'rule') {
            found.trigger_name = value;
            innerRefresh(innerRules);
        }

        handleAgentChange();
    }

    function addRule() {
        innerRules = [
            ...innerRules,
            {
                trigger_name: '',
                displayName: '',
                disabled: false,
                expanded: true
            }
        ];
        scrollToBottom(scrollContainer);
        handleAgentChange();
    }

    /**
     * @param {any} data
	 * @param {number} idx
	 */
    function deleteRule(data, idx) {
        if (data.field === 'rule') {
            innerRules = innerRules.filter((_, index) => index !== idx);
        }

        handleAgentChange();
    }

    /**
     * @param {any} data
	 * @param {number} idx
	 */
    function toggleRule(data, idx) {
        const found = innerRules.find((_, index) => index === idx);
        if (!found) return;

        const field = data.field;
        if (field === 'rule') {
            found.disabled = !data.checked;
        }

        innerRefresh(innerRules);
        handleAgentChange();
    }

    /**
     * @param {any} data
	 * @param {number} uid
	 */
	function toggleCollapse(data, uid) {
		const found = innerRules.find((_, index) => index === uid);
        if (!found) return;

        found.expanded = !data.collapsed;
        innerRefresh(innerRules);
        handleAgentChange();
	}



    /** @param {import('$agentTypes').AgentRule[]} list */
    function innerRefresh(list) {
        innerRules = list?.map(x => {
            const found = ruleOptions.find(y => y.name === x.trigger_name);
            return {
                ...x,
                output_args: found?.output_args,
                json_args: found?.json_args,
                statement: found?.statement
            }
        }) || [];
    }

    function resizeWindow() {
        windowWidth = window.innerWidth;
    }
</script>

<svelte:window onresize={() => resizeWindow()}/>

<LoadingToComplete
    {isLoading}
    {isComplete}
    {isError}
    {successText}
    {errorText}
/>

<div class="ar-card">
    <div class="ar-card-body">
        <div class="ar-header">
            <h5 class="ar-title">Triggers & Rules</h5>
            <h6 class="ar-subtitle">Wake-up your agent by rules</h6>
        </div>

        <div class="ar-list" bind:this={scrollContainer}>
            {#each innerRules as rule, uid (uid)}
                <AgentRuleItem
                    rule={rule}
                    ruleIndex={uid}
                    collapsed={!rule.expanded}
                    ruleOptions={ruleOptions}
                    windowWidth={windowWidth}
                    ontoggle={data => toggleRule(data, uid)}
                    ondelete={data => deleteRule(data, uid)}
                    onchange={data => changeRule(data, uid)}
                    oncollapse={data => toggleCollapse(data, uid)}
                />
            {/each}

            {#if innerRules.length < limit}
                <div class="ar-add">
                    <button
                        type="button"
                        class="ar-add-btn"
                        onclick={() => addRule()}
                    >
                        <i class="bx bx-plus"></i>
                        <span>Add Rule</span>
                    </button>
                </div>
            {/if}
        </div>
    </div>
</div>


