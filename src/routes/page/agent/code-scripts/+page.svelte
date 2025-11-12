<script>
    import { onMount } from 'svelte';
	import { _ } from 'svelte-i18n';
    import { v4 as uuidv4 } from 'uuid';
    import { Button, Card, CardBody, Col, Row } from '@sveltestrap/sveltestrap';
    import Breadcrumb from '$lib/common/Breadcrumb.svelte';
	import HeadTitle from '$lib/common/HeadTitle.svelte';
	import LoadingToComplete from '$lib/common/LoadingToComplete.svelte';
    import Select from '$lib/common/Select.svelte';
    import { myInfo } from '$lib/services/auth-service';
	import { getAgentCodeScripts, getAgentOptions, updateAgentCodeScripts } from '$lib/services/agent-service';
    import { ADMIN_ROLES } from '$lib/helpers/constants';
	import { AgentCodeScriptType } from '$lib/helpers/enums';
	import ScriptEditor from './script-editor.svelte';
	
    /** @type {boolean} */
    let isLoading = false;
    /** @type {boolean} */
    let isComplete = false;
    /** @type {boolean} */
    let isError = false;
    /** @type {number} */
    let duration = 2000;

    /** @type {import('$userTypes').UserModel} */
	let user;

    /** @type {import('$commonTypes').LabelValuePair[]} */
	let agentOptions = [];

    /** @type {string | null | undefined} */
    let selectedAgentId;

    /** @type {{
     * scripts: import('$agentTypes').AgentCodeScriptViewModel[],
     * selectedScript: import('$agentTypes').AgentCodeScriptViewModel | null
     * }}
    */
    let srcScriptObj = {
        scripts: [],
        selectedScript: null
    };

    /** @type {{
     * scripts: import('$agentTypes').AgentCodeScriptViewModel[],
     * selectedScript: import('$agentTypes').AgentCodeScriptViewModel | null
     * }}
    */
    let testScriptObj = {
        scripts: [],
        selectedScript: null
    };

    onMount(async () => {
        user = await myInfo();
		await loadAgentOptions();
	});

    function loadAgentOptions() {
		return new Promise((resolve, reject) => {
			getAgentOptions().then(res => {
				agentOptions = res?.map(x => {
					return {
						label: x.name || '',
						value: x.id || ''
					};
				}) || [];
				resolve(agentOptions);
			}).catch((error) => {
				agentOptions = [];
				reject(error);
			});
		});
	}

    /** @param {any} e */
	function changeAgent(e) {
		// @ts-ignore
		const selectedValues = e?.detail?.selecteds?.map(x => x.value) || [];
        selectedAgentId = selectedValues.length > 0 ? selectedValues[0] : null;

        if (!!selectedAgentId) {
            initAgentCodeScripts(selectedAgentId);
        } else {
            refreshScriptObj([]);
        }
	}

    /** @param {string} agentId */
    function initAgentCodeScripts(agentId) {
        return new Promise((resolve, reject) => {
            getAgentCodeScripts(agentId).then(res => {
                refreshScriptObj(res);
                resolve(res);
            }).catch((error) => {
                reject(error);
            });
        });
    }

    /**
     * @param {import('$agentTypes').AgentCodeScriptViewModel[]} scripts
     */
    function refreshScriptObj(scripts) {
        const srcs = scripts?.filter(x => x.script_type === AgentCodeScriptType.Src)?.map(x => ({ ...x, uid: uuidv4() })) || [];
        const foundSrc = srcs.find(x => x.name === srcScriptObj?.selectedScript?.name);
        srcScriptObj = {
            ...srcScriptObj,
            scripts: srcs,
            selectedScript: foundSrc ? foundSrc : srcs.length > 0 ? srcs[0] : null
        };

        const tests = scripts?.filter(x => x.script_type === AgentCodeScriptType.Test)?.map(x => ({ ...x, uid: uuidv4() })) || [];
        const foundTest = tests.find(x => x.name === srcScriptObj?.selectedScript?.name);
        testScriptObj = {
            ...testScriptObj,
            scripts: tests,
            selectedScript: foundTest ? foundTest : tests.length > 0 ? tests[0] : null
        };
    }

    function saveCodeScripts() {
        if (!selectedAgentId) {
            return;
        }

        const uniqueSrcScripts = srcScriptObj.scripts.filter(x => x.name?.trim()).filter((script, index, self) =>
            index === self.findIndex(s => s.name === script.name)
        );
        const uniqueTestScripts = testScriptObj.scripts.filter(x => x.name?.trim()).filter((script, index, self) =>
            index === self.findIndex(s => s.name === script.name)
        );
        const scripts = [...uniqueSrcScripts, ...uniqueTestScripts].map(x => ({...x, name: x.name.trim() }))
                                                                   .filter(x => x.name.endsWith('.py'));

        const update = {
            code_scripts: scripts,
            options: {
                delete_if_not_included: true,
                is_upsert: true
            }
        };

        isLoading = true;
        updateAgentCodeScripts(selectedAgentId, update).then(res => {
            if (res) {
                isLoading = false;
                isComplete = true;
                setTimeout(() => {
                    isComplete = false;
                }, duration);

                refreshScriptObj([...scripts]);
            } else {
                throw "error when saving code scripts.";
            }
        }).catch(() => {
            isLoading = false;
            isComplete = false;
            isError = true;
            setTimeout(() => {
                isError = false;
            }, duration);
        });     
    }

    function resetCodeScripts() {
        if (!selectedAgentId) {
            return;
        }
        initAgentCodeScripts(selectedAgentId);
    }
</script>

<HeadTitle title="{$_('Code Scripts')}" />
<Breadcrumb title="{$_('Agent')}" pagetitle="{$_('Code Scripts')}" />
<LoadingToComplete {isLoading} {isComplete} {isError} />

<Card>
    <CardBody class="border-bottom">
        <Row class="g-3">
            <Col lg="3" class="d-flex flex-column gap-1">
                <div class="fw-bold">Agent</div>
                <Select
                    tag={'agent-select'}
                    placeholder={'Select agent'}
                    selectedText={'agents'}
                    searchMode
                    selectedValues={selectedAgentId ? [selectedAgentId] : []}
                    options={agentOptions}
                    on:select={e => changeAgent(e)}
                />
            </Col>
        </Row>
    </CardBody>
</Card>

{#if !!selectedAgentId}
<ScriptEditor
    title={'Source scripts'}
    scriptType={AgentCodeScriptType.Src}
    bind:scriptObj={srcScriptObj}
/>
<ScriptEditor
    title={'Test scripts'}
    scriptType={AgentCodeScriptType.Test}
    bind:scriptObj={testScriptObj}
/>

{#if ADMIN_ROLES.includes(user?.role || '')}
<Row>
    <div class="hstack gap-2 my-4">
        <Button
            class="btn btn-soft-primary"
            disabled={!selectedAgentId}
            on:click={() => saveCodeScripts()}
        >
            {$_('Save')}
        </Button>
        <Button
            class="btn btn-warning"
            disabled={!selectedAgentId}
            on:click={() => resetCodeScripts()}>
            {$_('Reset')}
        </Button>
    </div>
</Row>
{/if}
{/if}
