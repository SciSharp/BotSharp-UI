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

<style>
    /* ===== Card shell ===== */
    .se-card {
        position: relative;
        background-color: rgb(255 255 255);
        border: 1px solid rgb(229 231 235);
        border-radius: 0.875rem;
        box-shadow:
            0 1px 2px rgb(15 23 42 / 0.04),
            0 10px 30px -12px rgb(15 23 42 / 0.08);
        margin-bottom: 1.5rem;
        overflow: hidden;
    }
    /* Top gradient accent stripe — same family as the agent card */
    .se-card::before {
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
    .se-card-body {
        padding: 1.25rem 1.5rem 1.5rem;
    }

    /* ===== Header bar ===== */
    .se-header-bar {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 1rem;
        padding: 1rem 1.5rem;
        background-color: color-mix(in srgb, var(--color-primary) 4%, transparent);
        border-bottom: 1px solid rgb(229 231 235);
        flex-wrap: wrap;
    }
    .se-header-left {
        display: inline-flex;
        align-items: center;
        gap: 0.625rem;
    }
    .se-section-icon {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        width: 2rem;
        height: 2rem;
        border-radius: 0.5rem;
        background-color: color-mix(in srgb, var(--color-primary) 14%, transparent);
        color: var(--color-primary);
    }
    .se-section-icon i {
        font-size: 1.125rem;
        line-height: 1;
    }
    .se-title {
        font-weight: 600;
        font-size: 0.9375rem;
        color: rgb(55 65 81);
        letter-spacing: 0.01em;
    }
    .se-tooltip-wrap {
        display: inline-flex;
        align-items: center;
    }
    .se-tooltip-icon {
        display: inline-flex;
        align-items: center;
        color: var(--color-muted);
        cursor: help;
    }
    .se-tooltip-icon i {
        font-size: 1rem;
        line-height: 1;
    }

    /* ===== Add Script button ===== */
    .se-add-btn {
        display: inline-flex;
        align-items: center;
        gap: 0.375rem;
        height: 2rem;
        padding: 0 0.75rem;
        background-color: color-mix(in srgb, var(--color-primary) 12%, transparent);
        color: var(--color-primary);
        border: 1px solid color-mix(in srgb, var(--color-primary) 20%, transparent);
        border-radius: 0.5rem;
        font-size: 0.8125rem;
        font-weight: 500;
        line-height: 1;
        cursor: pointer;
        transition: background-color 0.15s ease, color 0.15s ease, border-color 0.15s ease, transform 0.15s ease;
    }
    .se-add-btn i {
        font-size: 1.125rem;
        line-height: 1;
    }
    .se-add-btn:hover {
        background-color: var(--color-primary);
        color: rgb(255 255 255);
        border-color: var(--color-primary);
    }
    .se-add-btn:active {
        transform: translateY(1px);
    }

    /* ===== Editor frame (code-panel look) ===== */
    .se-editor-frame {
        margin-top: 0.75rem;
        background-color: rgb(40 44 52);
        border: 1px solid rgb(55 65 81);
        border-radius: 0.625rem;
        overflow: hidden;
        box-shadow: inset 0 0 0 1px rgb(0 0 0 / 0.15);
    }
    .se-editor-titlebar {
        display: flex;
        align-items: center;
        gap: 0.75rem;
        padding: 0.5rem 0.75rem;
        background-color: rgb(33 37 43);
        border-bottom: 1px solid rgb(55 65 81);
    }
    .se-window-dots {
        display: inline-flex;
        gap: 0.375rem;
    }
    .se-dot {
        width: 0.625rem;
        height: 0.625rem;
        border-radius: 50%;
        background-color: rgb(75 85 99);
    }
    .se-dot-r { background-color: rgb(244 106 106); }
    .se-dot-y { background-color: rgb(241 180 76); }
    .se-dot-g { background-color: rgb(52 195 143); }
    .se-editor-filename {
        display: inline-flex;
        align-items: center;
        gap: 0.375rem;
        font-size: 0.75rem;
        color: rgb(209 213 219);
        font-variant-numeric: tabular-nums;
        flex: 1 1 auto;
        min-width: 0;
        overflow: hidden;
        white-space: nowrap;
        text-overflow: ellipsis;
    }
    .se-editor-filename i {
        font-size: 0.875rem;
        line-height: 1;
        color: rgb(80 165 241);
        flex-shrink: 0;
    }
    .se-editor-lang {
        font-size: 0.6875rem;
        font-weight: 600;
        text-transform: uppercase;
        letter-spacing: 0.1em;
        color: rgb(156 163 175);
        padding: 0.125rem 0.5rem;
        border-radius: 0.25rem;
        background-color: rgb(55 65 81);
    }

    /* ===== Code editor wrapper ===== */
    .se-code-editor {
        max-height: 500px;
        overflow-y: auto;
        scrollbar-width: thin;
        resize: none;
    }
    .se-code-editor :global(.cm-editor) {
        min-width: 1000px;
        overflow-x: auto;
        scrollbar-width: thin;
    }

    /* ===== Empty state (no scripts in this section) ===== */
    .se-empty {
        display: flex;
        flex-direction: column;
        align-items: center;
        text-align: center;
        padding: 2rem 1rem 2.25rem;
    }
    .se-empty-illustration {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        width: 3.25rem;
        height: 3.25rem;
        border-radius: 50%;
        background-color: color-mix(in srgb, var(--color-primary) 10%, transparent);
        color: var(--color-primary);
        margin-bottom: 0.75rem;
    }
    .se-empty-illustration i {
        font-size: 1.5rem;
        line-height: 1;
    }
    .se-empty-title {
        margin: 0 0 0.25rem;
        font-size: 0.9375rem;
        font-weight: 600;
        color: rgb(55 65 81);
        text-transform: capitalize;
    }
    .se-empty-text {
        margin: 0 0 1rem;
        font-size: 0.8125rem;
        color: var(--color-muted);
        max-width: 26rem;
    }
    .se-empty-cta {
        display: inline-flex;
        align-items: center;
        gap: 0.4rem;
        height: 2.125rem;
        padding: 0 0.95rem;
        background-color: var(--color-primary);
        color: rgb(255 255 255);
        border: 1px solid var(--color-primary);
        border-radius: 0.5rem;
        font-size: 0.8125rem;
        font-weight: 500;
        line-height: 1;
        cursor: pointer;
        transition: background-color 0.15s ease, transform 0.15s ease, box-shadow 0.15s ease;
        box-shadow:
            0 1px 2px rgb(15 23 42 / 0.08),
            0 6px 16px -6px color-mix(in srgb, var(--color-primary) 50%, transparent);
    }
    .se-empty-cta i {
        font-size: 1rem;
        line-height: 1;
    }
    .se-empty-cta:hover {
        background-color: var(--color-primary-hover);
    }
    .se-empty-cta:active {
        transform: translateY(1px);
    }

    /* ===== Dark mode ===== */
    :global(.dark) .se-card {
        background-color: rgb(31 41 55);
        border-color: rgb(55 65 81);
    }
    :global(.dark) .se-header-bar {
        border-bottom-color: rgb(55 65 81);
    }
    :global(.dark) .se-title,
    :global(.dark) .se-empty-title {
        color: rgb(229 231 235);
    }
</style>