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



<div class="card">
    <div class="card-body border-bottom">
        <div class="row g-3">
            <div class="col-lg-3">
                <div class="mb-2" style="display: flex; gap: 10px;">
                    <div class="line-align-center fw-bold">
                        {title}
                    </div>
                    <div class="line-align-center">
                        <div class="line-align-center" id="{scriptType}-src-tooltip">
                            <i class="bx bx-info-circle"></i>
                        </div>
                        <BotsharpTooltip target="{scriptType}-src-tooltip" placement="top">
                            <div>Support python only</div>
                        </BotsharpTooltip>
                    </div>
                    <!-- svelte-ignore a11y_click_events_have_key_events -->
                    <!-- svelte-ignore a11y_no_static_element_interactions -->
                    <div
                        class="text-primary clickable"
                        data-bs-toggle="tooltip"
                        data-bs-placement="top"
                        title="Add src script"
                        style="font-size: 16px;"
                        onclick={() => addScript()}
                    >
                        <i class="mdi mdi-plus-circle-outline"></i>
                    </div>
                </div>
            </div>
        </div>
        <div class="row g-3">
            <div class="col-lg-12">
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
                    <div class="code-editor">
                        {#key scriptObj.selectedScript?.uid}
                        <CodeScript
                            language={'python'}
                            scriptText={scriptObj.selectedScript?.content || ''}
                            onchange={(/** @type {string} */ text) => changeScriptContent(text, scriptObj.selectedScript?.uid)}
                        />
                        {/key}
                    </div>
                {/if}
            </div>
        </div>
    </div>
</div>