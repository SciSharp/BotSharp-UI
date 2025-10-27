<script>
    import { onMount } from 'svelte';
	import { _ } from 'svelte-i18n';
    import { v4 as uuidv4 } from 'uuid';
    import { Button, Card, CardBody, Col, Input, Row } from '@sveltestrap/sveltestrap';
    import Breadcrumb from '$lib/common/Breadcrumb.svelte';
	import HeadTitle from '$lib/common/HeadTitle.svelte';
	import LoadingToComplete from '$lib/common/LoadingToComplete.svelte';
    import Select from '$lib/common/Select.svelte';
    import NavBar from '$lib/common/nav-bar/NavBar.svelte';
    import NavItem from '$lib/common/nav-bar/NavItem.svelte';
	import { getAgentCodeScripts, getAgentOptions, updateAgentCodeScripts } from '$lib/services/agent-service';
	import { AgentCodeScriptType } from '$lib/helpers/enums';
	

    /** @type {boolean} */
    let isLoading = false;
    /** @type {boolean} */
    let isComplete = false;
    /** @type {boolean} */
    let isError = false;
    /** @type {number} */
    let duration = 2000;

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
		loadAgentOptions();
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
            loadAgentCodeScripts(selectedAgentId);
        } else {
            refreshScriptObj([]);
        }
	}

    /** @param {string} agentId */
    function loadAgentCodeScripts(agentId) {
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
        srcScriptObj = {
            scripts: srcs,
            selectedScript: srcs.length > 0 ? srcs[0] : null
        };

        const tests = scripts?.filter(x => x.script_type === AgentCodeScriptType.Test)?.map(x => ({ ...x, uid: uuidv4() })) || [];
        testScriptObj = {
            scripts: tests,
            selectedScript: tests.length > 0 ? tests[0] : null
        };
    }


    /**
	 * @param {any} scriptType
	 */
    function addScript(scriptType) {
        if (scriptType === AgentCodeScriptType.Src) {
            const scripts = [
                ...srcScriptObj.scripts,
                {
                    uid: uuidv4(),
                    name: '',
                    content: '',
                    script_type: AgentCodeScriptType.Src
                }
            ];
            srcScriptObj = {
                ...srcScriptObj,
                scripts: scripts,
                selectedScript: scripts[scripts.length-1]
            };
        } else if (scriptType === AgentCodeScriptType.Test) {
            const scripts = [
                ...testScriptObj.scripts,
                {
                    uid: uuidv4(),
                    name: '',
                    content: '',
                    script_type: AgentCodeScriptType.Test
                }
            ];
            testScriptObj = {
                ...testScriptObj,
                scripts: scripts,
                selectedScript: scripts[scripts.length-1]
            };
        }
    }

    /**
	 * @param {string | null | undefined} uid
	 * @param {string} scriptType
	 */
    function selectScript(uid, scriptType) {
        if (scriptType === AgentCodeScriptType.Src) {
            srcScriptObj.selectedScript = srcScriptObj.scripts.find(x => x.uid === uid) || null;
        } else if (scriptType === AgentCodeScriptType.Test) {
            testScriptObj.selectedScript = testScriptObj.scripts.find(x => x.uid === uid) || null;
        }
    }

    /**
	 * @param {string | null | undefined} uid
	 * @param {string} scriptType
	 */
    function deleteScript(uid, scriptType) {
        if (scriptType === AgentCodeScriptType.Src) {
            const scripts = srcScriptObj.scripts.filter(x => x.uid !== uid);
            srcScriptObj = {
                ...srcScriptObj,
                scripts: scripts,
                selectedScript: scripts.length > 0 ? scripts[scripts.length-1] : null
            };
        } else if (scriptType === AgentCodeScriptType.Test) {
            const scripts = testScriptObj.scripts.filter(x => x.uid !== uid);
            testScriptObj = {
                ...testScriptObj,
                scripts: scripts,
                selectedScript: scripts.length > 0 ? scripts[scripts.length-1] : null
            };
        }
    }

    /**
	 * @param {any} e
	 * @param {string | null | undefined} uid
	 * @param {string} scriptType
	 */
    function changeScriptContent(e, uid, scriptType) {
        let obj = null;

        if (scriptType === AgentCodeScriptType.Src) {
            obj = srcScriptObj;
        } else if (scriptType === AgentCodeScriptType.Test) {
            obj = testScriptObj;
        }

        const found = obj?.scripts?.find(x => x.uid === uid);
        if (found) {
            found.content = e.target.value;
        }
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
        const scripts = [...uniqueSrcScripts, ...uniqueTestScripts].map(x => ({...x, name: x.name.trim() }));

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
        loadAgentCodeScripts(selectedAgentId);
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
<Card>
    <CardBody class="border-bottom">
        <Row class="g-3">
            <Col lg="3">
                <div class="mb-2" style="display: flex; gap: 10px;">
                    <div class="line-align-center fw-bold">
                        Source scripts
                    </div>
                    {#if !!selectedAgentId}
                    <!-- svelte-ignore a11y-click-events-have-key-events -->
                    <!-- svelte-ignore a11y-no-static-element-interactions -->
                    <div
                        class="text-primary clickable"
                        data-bs-toggle="tooltip"
                        data-bs-placement="top"
                        title="Add src script"
                        style="font-size: 16px;"
                        on:click={() => addScript(AgentCodeScriptType.Src)}
                    >
                        <i class="mdi mdi-plus-circle-outline" />
                    </div>
                    {/if}
                </div>
            </Col>
        </Row>
        <Row class="g-3">
            <Col lg="12">
                {#if srcScriptObj.scripts.length > 0}
                    <NavBar
                        id={'agent-src-script-container'}
                        disableDefaultStyles
                        containerClasses={'nav-tabs-secondary'}
                    >
                        {#each srcScriptObj.scripts as item, idx (idx) }
                        <NavItem
                            containerStyles={`flex: 0 1 calc(100% / ${srcScriptObj.scripts.length <= 2 ? srcScriptObj.scripts.length : 3})`}
                            navBtnStyles={'text-transform: none;'}
                            navBtnId={`src-script-${idx}-tab`}
                            dataBsTarget={`#src-script-${idx}-tab-pane`}
                            ariaControls={`src-script-${idx}-tab-pane`}
                            bind:navBtnText={item.name}
                            active={item.uid === srcScriptObj.selectedScript?.uid}
                            allowEdit
                            allowDelete
                            maxEditLength={50}
                            editPlaceholder={'Type a title here...'}
                            onClick={() => selectScript(item.uid, AgentCodeScriptType.Src)}
                            onDelete={() => deleteScript(item.uid, AgentCodeScriptType.Src)}
                            onInput={() => {}}
                        />
                        {/each}
                    </NavBar>
                    <Input
                        type="textarea"
                        class="form-control"
                        style="scrollbar-width: thin; resize: none;"
                        value={srcScriptObj.selectedScript?.content}
                        rows={15}
                        on:input={(e) => changeScriptContent(e, srcScriptObj.selectedScript?.uid, AgentCodeScriptType.Src)}
                        placeholder="Enter your content"
                    />
                {/if}
            </Col>
        </Row>
    </CardBody>
</Card>

<Card>
    <CardBody class="border-bottom">
        <Row class="g-3">
            <Col lg="3">
                <div class="mb-2" style="display: flex; gap: 10px;">
                    <div class="line-align-center fw-bold">
                        Test scripts
                    </div>
                    {#if !!selectedAgentId}
                    <!-- svelte-ignore a11y-click-events-have-key-events -->
                    <!-- svelte-ignore a11y-no-static-element-interactions -->
                    <div
                        class="text-primary clickable"
                        data-bs-toggle="tooltip"
                        data-bs-placement="top"
                        title="Add test script"
                        style="font-size: 16px;"
                        on:click={() => addScript(AgentCodeScriptType.Test)}
                    >
                        <i class="mdi mdi-plus-circle-outline" />
                    </div>
                    {/if}
                </div>
            </Col>
        </Row>
        <Row class="g-3">
            <Col lg="12">
                {#if testScriptObj.scripts.length > 0}
                    <NavBar
                        id={'agent-test-script-container'}
                        disableDefaultStyles
                        containerClasses={'nav-tabs-secondary'}
                    >
                        {#each testScriptObj.scripts as item, idx (idx) }
                        <NavItem
                            containerStyles={`flex: 0 1 calc(100% / ${testScriptObj.scripts.length <= 2 ? testScriptObj.scripts.length : 3})`}
                            navBtnStyles={'text-transform: none;'}
                            navBtnId={`test-script-${idx}-tab`}
                            dataBsTarget={`#test-script-${idx}-tab-pane`}
                            ariaControls={`test-script-${idx}-tab-pane`}
                            bind:navBtnText={item.name}
                            active={item.uid === testScriptObj.selectedScript?.uid}
                            allowEdit
                            allowDelete
                            maxEditLength={50}
                            editPlaceholder={'Type a title here...'}
                            onClick={() => selectScript(item.uid, AgentCodeScriptType.Test)}
                            onDelete={() => deleteScript(item.uid, AgentCodeScriptType.Test)}
                            onInput={() => {}}
                        />
                        {/each}
                    </NavBar>
                    <Input
                        type="textarea"
                        class="form-control"
                        style="scrollbar-width: thin; resize: none;"
                        value={testScriptObj.selectedScript?.content}
                        rows={15}
                        on:input={(e) => changeScriptContent(e, testScriptObj.selectedScript?.uid, AgentCodeScriptType.Test)}
                        placeholder="Enter your content"
                    />
                {/if}
            </Col>
        </Row>
    </CardBody>
</Card>

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