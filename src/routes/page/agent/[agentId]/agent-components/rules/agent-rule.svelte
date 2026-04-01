<script>
    import { onMount } from 'svelte';
    import { getAgentRuleOptions, getAgentRuleConfigOptions } from '$lib/services/agent-service';
	import LoadingToComplete from '$lib/common/spinners/LoadingToComplete.svelte';
	import { scrollToBottom } from '$lib/helpers/utils/common';
	import AgentRuleItem from './agent-rule-item.svelte';
	import PlainModal from '$lib/common/modals/PlainModal.svelte';

    const limit = 100;

    /**
     * @type {{
     *   agent: import('$agentTypes').AgentModel,
     *   user: import('$userTypes').UserModel,
     *   handleAgentChange?: () => void
     * }}
     */
    let {
        agent,
        user,
        handleAgentChange = () => {}
    } = $props();

    /** @type {boolean} */
    let isLoading = $state(false);
    /** @type {boolean} */
    let isComplete = $state(false);
    /** @type {boolean} */
    let isError = $state(false);
    /** @type {boolean} */
    let isOpenConfigModal = $state(false);

    /** @type {number} */
    let windowWidth = $state(0);
    let windowHeight = $state(0);

    /** @type {string} */
    let successText = $state('');
    let errorText = $state('');

    /** @type {any} */
    let selectedRuleConfig = $state({});
    /** @type {any} */
    let ruleConfigs = $state({});

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

    /** @type {any} */
    let configOptions = $state([]);

    /** @type {import('$agentTypes').AgentRule[]} */
    let innerRules = $state([]);

    /** @type {HTMLElement} */
    let scrollContainer;

    onMount(async () =>{
        resizeWindow();
        Promise.all([
            loadAgentRuleOptions(),
            loadAgentRuleConfigOptions()
        ]);
    });

    function loadAgentRuleOptions() {
        return new Promise((resolve) => {
            getAgentRuleOptions().then(data => {
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

    function loadAgentRuleConfigOptions() {
        return new Promise((resolve) => {
            getAgentRuleConfigOptions().then(data => {
                ruleConfigs = data || {};
                const keys = Object.keys(data || {});
                const list = keys?.map(x => ({ name: x })) || [];
                configOptions = [
                    { name: '' },
                    ...list
                ];
                resolve('done');
            });
        });
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
        } else if (field === 'topology') {
            found.config = {
                ...found.config || {},
                topology_name: value
            };
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

    /**
     * @param {any} _data
	 * @param {number} uid
	 */
    function openRuleConfigModal(_data, uid) {
        const found = innerRules.find((_, index) => index === uid);
        if (!found || !found.config?.topology_name) {
            return;
        }

        const config = ruleConfigs[found.config.topology_name];
        const customParam = config?.customParameters || {};

        if (customParam.htmlTag === 'iframe') {
            const params = JSON.stringify({
                agent: agent.name,
                agentId: agent.id,
                trigger: found.trigger_name || ""
            });
            const url = new URL(customParam.url, window.location.origin);
            url.searchParams.set(customParam.appendParameterName || 'parameters', encodeURIComponent(params));

            selectedRuleConfig = {
                agent: agent.name,
                url: url.toString(),
                rule: found,
                title: `${found.trigger_name} config`
            };
            isOpenConfigModal = true;
        }
    }

    function resizeWindow() {
        windowWidth = window.innerWidth;
        windowHeight = window.innerHeight;
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

{#if isOpenConfigModal}
    <PlainModal
        containerClasses={'rule-config-modal'}
        title={selectedRuleConfig?.rule?.trigger_name || ''}
        size={'xl'}
        isOpen={isOpenConfigModal}
        toggleModal={() => isOpenConfigModal = !isOpenConfigModal}
    >
        <iframe src={selectedRuleConfig.url} title={selectedRuleConfig.title} width="100%" height="100%"></iframe>
    </PlainModal>
{/if}

<div class="card">
    <div class="card-body">
        <div class="text-center">
            <h5 class="mt-1 mb-3">Triggers & Rules</h5>
            <h6 class="mt-1 mb-3">Wake-up your agent by rules</h6>
        </div>

        <div class="agent-utility-container" bind:this={scrollContainer}>
            {#each innerRules as rule, uid (uid)}
                <AgentRuleItem
                    rule={rule}
                    ruleIndex={uid}
                    collapsed={!rule.expanded}
                    user={user}
                    ruleOptions={ruleOptions}
                    configOptions={configOptions}
                    windowWidth={windowWidth}
                    ontoggle={data => toggleRule(data, uid)}
                    ondelete={data => deleteRule(data, uid)}
                    onchange={data => changeRule(data, uid)}
                    onconfig={data => openRuleConfigModal(data, uid)}
                    oncollapse={data => toggleCollapse(data, uid)}
                />
            {/each}

            {#if innerRules.length < limit}
                <div class="add-utility">
                    <button
                        type="button"
                        class="btn btn-primary"
                        onclick={() => addRule()}
                    >
                        <span>
                            <i class="bx bx-plus"></i>
                            <span>Add Rule</span>
                        </span>
                    </button>
                </div>
            {/if}
        </div>
    </div>
</div>
