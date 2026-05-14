<script>
    import { onMount } from 'svelte';
	import { _ } from 'svelte-i18n';
    import { v4 as uuidv4 } from 'uuid';
    import Breadcrumb from '$lib/common/shared/Breadcrumb.svelte';
	import HeadTitle from '$lib/common/shared/HeadTitle.svelte';
	import LoadingToComplete from '$lib/common/spinners/LoadingToComplete.svelte';
    import Select from '$lib/common/dropdowns/Select.svelte';
    import { myInfo } from '$lib/services/auth-service';
	import { getAgentCodeScripts, getAgentOptions, updateAgentCodeScripts } from '$lib/services/agent-service';
    import { ADMIN_ROLES } from '$lib/helpers/constants';
	import { AgentCodeScriptType } from '$lib/helpers/enums';
	import ScriptEditor from './script-editor.svelte';

    /** @type {boolean} */
    let isLoading = $state(false);
    /** @type {boolean} */
    let isComplete = $state(false);
    /** @type {boolean} */
    let isError = $state(false);
    /** @type {number} */
    let duration = 2000;

    /** @type {import('$userTypes').UserModel} */
	let user = $state(/** @type {any} */ (undefined));

    /** @type {import('$commonTypes').LabelValuePair[]} */
	let agentOptions = $state([]);

    /** @type {string | null | undefined} */
    let selectedAgentId = $state(undefined);

    /** @type {{
     * scripts: import('$agentTypes').AgentCodeScriptViewModel[],
     * selectedScript: import('$agentTypes').AgentCodeScriptViewModel | null
     * }}
    */
    let srcScriptObj = $state({
        scripts: [],
        selectedScript: null
    });

    /** @type {{
     * scripts: import('$agentTypes').AgentCodeScriptViewModel[],
     * selectedScript: import('$agentTypes').AgentCodeScriptViewModel | null
     * }}
    */
    let testScriptObj = $state({
        scripts: [],
        selectedScript: null
    });

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

        if (selectedAgentId) {
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

<HeadTitle title={$_('Code Scripts')} />
<Breadcrumb title={$_('Agent')} pagetitle={$_('Code Scripts')} />

<LoadingToComplete
    {isLoading}
    {isComplete}
    {isError}
/>

<div class="cs-card cs-card-accent">
    <div class="cs-card-body">
        <div class="cs-field">
            <div class="cs-field-label">
                <i class="bx bx-code-alt cs-field-icon"></i>
                <span>Agent</span>
            </div>
            <div class="cs-field-control">
                <Select
                    tag={'agent-select'}
                    placeholder={'Select agent'}
                    selectedText={'agents'}
                    searchMode
                    selectedValues={selectedAgentId ? [selectedAgentId] : []}
                    options={agentOptions}
                    onselect={e => changeAgent(e)}
                />
            </div>
        </div>
    </div>
</div>

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
    <div class="cs-action-bar">
        <div class="cs-action-bar-hint">
            <i class="bx bx-info-circle"></i>
            <span>Changes are not saved until you click Save</span>
        </div>
        <div class="cs-actions">
            <button
                type="button"
                class="cs-btn cs-btn-ghost"
                disabled={!selectedAgentId}
                onclick={() => resetCodeScripts()}
            >
                <i class="bx bx-revision"></i>
                {$_('Reset')}
            </button>
            <button
                type="button"
                class="cs-btn cs-btn-primary"
                disabled={!selectedAgentId}
                onclick={() => saveCodeScripts()}
            >
                <i class="bx bx-check"></i>
                {$_('Save')}
            </button>
        </div>
    </div>
    {/if}
{:else}
    <div class="cs-empty-card">
        <div class="cs-empty-illustration">
            <i class="bx bx-code-block"></i>
        </div>
        <h5 class="cs-empty-title">Pick an agent to get started</h5>
        <p class="cs-empty-text">
            Select an agent above to view and edit its source and test scripts.
        </p>
    </div>
{/if}

<style>
    /* ===== Card shell ===== */
    .cs-card {
        position: relative;
        background-color: rgb(255 255 255);
        border: 1px solid rgb(229 231 235);
        border-radius: 0.875rem;
        box-shadow:
            0 1px 2px rgb(15 23 42 / 0.04),
            0 10px 30px -12px rgb(15 23 42 / 0.08);
        margin-bottom: 1.5rem;
    }
    /* Top gradient accent stripe */
    .cs-card-accent::before {
        content: '';
        position: absolute;
        inset: 0 0 auto 0;
        height: 3px;
        background: linear-gradient(
            90deg,
            transparent 0%,
            var(--color-primary) 30%,
            var(--color-primary) 70%,
            transparent 100%
        );
    }
    .cs-card-body {
        padding: 1.5rem 1.5rem 1.25rem;
    }

    /* ===== Agent field ===== */
    .cs-field {
        display: flex;
        flex-direction: column;
        gap: 0.5rem;
        max-width: 28rem;
    }
    .cs-field-label {
        display: inline-flex;
        align-items: center;
        gap: 0.4rem;
        font-weight: 700;
        font-size: 0.875rem;
        color: rgb(55 65 81);
        letter-spacing: 0.01em;
    }
    .cs-field-icon {
        font-size: 1rem;
        line-height: 1;
        color: var(--color-primary);
    }
    .cs-field-control {
        width: 100%;
    }

    /* ===== Empty state (no agent selected) ===== */
    .cs-empty-card {
        display: flex;
        flex-direction: column;
        align-items: center;
        text-align: center;
        padding: 2.5rem 1.5rem 2.75rem;
        background-color: rgb(255 255 255);
        border: 1px dashed rgb(209 213 219);
        border-radius: 0.875rem;
        margin-bottom: 1.5rem;
    }
    .cs-empty-illustration {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        width: 4rem;
        height: 4rem;
        border-radius: 50%;
        background-color: color-mix(in srgb, var(--color-primary) 12%, transparent);
        color: var(--color-primary);
        margin-bottom: 1rem;
    }
    .cs-empty-illustration i {
        font-size: 1.75rem;
        line-height: 1;
    }
    .cs-empty-title {
        margin: 0 0 0.25rem;
        font-size: 1rem;
        font-weight: 600;
        color: rgb(55 65 81);
    }
    .cs-empty-text {
        margin: 0;
        font-size: 0.8125rem;
        color: var(--color-muted);
        max-width: 26rem;
    }

    /* ===== Action bar (Save / Reset) ===== */
    .cs-action-bar {
        display: flex;
        flex-wrap: wrap;
        align-items: center;
        justify-content: space-between;
        gap: 1rem;
        padding: 1rem 1.25rem;
        background-color: rgb(255 255 255);
        border: 1px solid rgb(229 231 235);
        border-radius: 0.75rem;
        box-shadow: 0 1px 2px rgb(15 23 42 / 0.04);
        margin: 1.5rem 0 2rem;
    }
    .cs-action-bar-hint {
        display: inline-flex;
        align-items: center;
        gap: 0.4rem;
        font-size: 0.75rem;
        color: var(--color-muted);
    }
    .cs-action-bar-hint i {
        font-size: 0.9375rem;
        line-height: 1;
    }
    .cs-actions {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        flex-wrap: wrap;
    }

    /* ===== Buttons ===== */
    .cs-btn {
        display: inline-flex;
        align-items: center;
        gap: 0.4rem;
        height: 2.25rem;
        padding: 0 0.95rem;
        font-size: 0.8125rem;
        font-weight: 500;
        line-height: 1;
        border: 1px solid transparent;
        border-radius: 0.5rem;
        cursor: pointer;
        transition: background-color 0.15s ease, border-color 0.15s ease, color 0.15s ease, transform 0.15s ease, box-shadow 0.15s ease, filter 0.15s ease;
    }
    .cs-btn:active:not(:disabled) {
        transform: translateY(1px);
    }
    .cs-btn:focus-visible {
        outline: 2px solid var(--color-primary);
        outline-offset: 2px;
    }
    .cs-btn:disabled {
        opacity: 0.55;
        cursor: not-allowed;
    }
    .cs-btn i {
        font-size: 1rem;
        line-height: 1;
    }
    .cs-btn-primary {
        background-color: var(--color-primary);
        color: rgb(255 255 255);
        box-shadow:
            0 1px 2px rgb(15 23 42 / 0.08),
            0 6px 16px -6px color-mix(in srgb, var(--color-primary) 50%, transparent);
    }
    .cs-btn-primary:hover:not(:disabled) {
        background-color: var(--color-primary-hover);
    }
    .cs-btn-ghost {
        background-color: rgb(255 255 255);
        border-color: rgb(229 231 235);
        color: rgb(55 65 81);
    }
    .cs-btn-ghost:hover:not(:disabled) {
        background-color: rgb(249 250 251);
        border-color: rgb(209 213 219);
        color: var(--color-warning);
    }

    /* ===== Dark mode ===== */
    :global(.dark) .cs-card,
    :global(.dark) .cs-empty-card,
    :global(.dark) .cs-action-bar {
        background-color: rgb(31 41 55);
        border-color: rgb(55 65 81);
    }
    :global(.dark) .cs-field-label,
    :global(.dark) .cs-empty-title {
        color: rgb(229 231 235);
    }
    :global(.dark) .cs-btn-ghost {
        background-color: rgb(55 65 81);
        border-color: rgb(75 85 99);
        color: rgb(229 231 235);
    }
    :global(.dark) .cs-btn-ghost:hover:not(:disabled) {
        background-color: rgb(75 85 99);
    }
</style>