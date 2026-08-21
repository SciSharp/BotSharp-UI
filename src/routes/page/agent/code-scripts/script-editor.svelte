<script>
    import { v4 as uuidv4 } from 'uuid';
    import NavBar from '$lib/common/nav-bar/NavBar.svelte';
    import NavItem from '$lib/common/nav-bar/NavItem.svelte';
	import CodeScript from '$lib/common/shared/CodeScript.svelte';
	import BotsharpTooltip from '$lib/common/tooltip/BotsharpTooltip.svelte';

    const defaultScript = `# Python Demo
def greet(name):
    print(f"Hello, {name}!")

if __name__ == "__main__":
    greet('AI')
`;

    let {
        /** @type {string} */
        title,
        /** @type {{
         * scripts: import('$agentTypes').AgentCodeScriptViewModel[],
         * selectedScript: import('$agentTypes').AgentCodeScriptViewModel | null
         * }} */
        scriptObj = $bindable(),
        /** @type {string} */
        scriptType
    } = $props();


    function addScript() {
        const scripts = [
            ...scriptObj.scripts,
            {
                uid: uuidv4(),
                name: `${scriptType}_${scriptObj.scripts.length}.py`,
                content: defaultScript,
                script_type: scriptType
            }
        ];
        scriptObj = {
            ...scriptObj,
            scripts: scripts,
            selectedScript: scripts[scripts.length-1]
        };
    }

    /**
	 * @param {string | null | undefined} uid
	 */
    function selectScript(uid) {
        // @ts-ignore
        scriptObj.selectedScript = scriptObj.scripts.find(x => x.uid === uid) || null;
    }

    /**
	 * @param {string | null | undefined} uid
	 */
    function deleteScript(uid) {
        // @ts-ignore
        const scripts = scriptObj.scripts.filter(x => x.uid !== uid);
        scriptObj = {
            ...scriptObj,
            scripts: scripts,
            selectedScript: scripts.length > 0 ? scripts[scripts.length-1] : null
        };
    }

    /**
	 * @param {string} text
	 * @param {string | null | undefined} uid
	 */
    function changeScriptContent(text, uid) {
        // @ts-ignore
        const found = scriptObj?.scripts?.find(x => x.uid === uid);
        if (found) {
            found.content = text;
        }
    }
</script>



<div class="se-card">
    <div class="se-header-bar">
        <div class="se-header-left">
            <div class="se-section-icon">
                <i class={scriptType === 'test' ? 'bx bx-test-tube' : 'bx bx-code-block'}></i>
            </div>
            <div class="se-title">
                {title}
            </div>
            <div class="se-tooltip-wrap">
                <div class="se-tooltip-icon" id="{scriptType}-src-tooltip">
                    <i class="bx bx-info-circle"></i>
                </div>
                <BotsharpTooltip target="{scriptType}-src-tooltip" placement="top">
                    <div>Support python only</div>
                </BotsharpTooltip>
            </div>
        </div>
        <button
            type="button"
            class="se-add-btn"
            data-bs-toggle="tooltip"
            data-bs-placement="top"
            title="Add a new {scriptType} script"
            onclick={() => addScript()}
        >
            <i class="bx bx-plus"></i>
            <span>Add Script</span>
        </button>
    </div>

    <div class="se-card-body">
        {#if scriptObj.scripts.length > 0}
            <NavBar
                id={`agent-${scriptType}-script-container`}
                disableDefaultStyles
                containerClasses={'nav-tabs-secondary'}
            >
                {#each scriptObj.scripts as item, idx (idx) }
                <NavItem
                    containerStyles={`flex: 0 1 calc(100% / ${scriptObj.scripts.length <= 2 ? scriptObj.scripts.length : 3})`}
                    navBtnStyles={'text-transform: none;'}
                    navBtnId={`${scriptType}-script-${idx}-tab`}
                    dataBsTarget={`#${scriptType}-script-${idx}-tab-pane`}
                    ariaControls={`${scriptType}-script-${idx}-tab-pane`}
                    bind:navBtnText={item.name}
                    active={item.uid === scriptObj.selectedScript?.uid}
                    allowEdit
                    allowDelete
                    maxEditLength={50}
                    editPlaceholder={'Type a title here...'}
                    onClick={() => selectScript(item.uid)}
                    onDelete={() => deleteScript(item.uid)}
                    onInput={() => {}}
                />
                {/each}
            </NavBar>

            <div class="se-editor-frame">
                <div class="se-editor-titlebar">
                    <div class="se-window-dots" aria-hidden="true">
                        <span class="se-dot se-dot-r"></span>
                        <span class="se-dot se-dot-y"></span>
                        <span class="se-dot se-dot-g"></span>
                    </div>
                    <div class="se-editor-filename">
                        <i class="bx bxl-python"></i>
                        <span>{scriptObj.selectedScript?.name || ''}</span>
                    </div>
                    <div class="se-editor-lang">python</div>
                </div>
                <div class="se-code-editor">
                    {#key scriptObj.selectedScript?.uid}
                    <CodeScript
                        language={'python'}
                        scriptText={scriptObj.selectedScript?.content || ''}
                        onchange={(/** @type {string} */ text) => changeScriptContent(text, scriptObj.selectedScript?.uid)}
                    />
                    {/key}
                </div>
            </div>
        {:else}
            <div class="se-empty">
                <div class="se-empty-illustration">
                    <i class={scriptType === 'test' ? 'bx bx-test-tube' : 'bx bx-code-block'}></i>
                </div>
                <h6 class="se-empty-title">No {scriptType} scripts yet</h6>
                <p class="se-empty-text">
                    {scriptType === 'test'
                        ? 'Add a test script to validate your source code.'
                        : 'Add a Python script that this agent can execute.'}
                </p>
                <button
                    type="button"
                    class="se-empty-cta"
                    onclick={() => addScript()}
                >
                    <i class="bx bx-plus"></i>
                    Add your first script
                </button>
            </div>
        {/if}
    </div>
</div>

