<script>
    import { onMount } from 'svelte';
	import { _ } from 'svelte-i18n';
    import { v4 as uuidv4 } from 'uuid';
    import { Card, CardBody, Col, Row, Tooltip } from '@sveltestrap/sveltestrap';
    import CodeMirror from "svelte-codemirror-editor";
    import { keymap } from "@codemirror/view";
    import { indentUnit, indentOnInput, indentService } from "@codemirror/language";
    import { defaultKeymap, history, indentWithTab, historyKeymap } from "@codemirror/commands";
    import { EditorState } from "@codemirror/state";
    import { python } from "@codemirror/lang-python";
	import { oneDark } from "@codemirror/theme-one-dark";
    import NavBar from '$lib/common/nav-bar/NavBar.svelte';
    import NavItem from '$lib/common/nav-bar/NavItem.svelte';

    const defaultScript = `# Python Demo
def greet(name):
    print(f"Hello, {name}!")

if __name__ == "__main__":
    greet('AI')
`;

    const extensions = [
        python(),
        indentUnit.of("    "),
        EditorState.tabSize.of(4),
        indentOnInput(),
        indentService.of((context, pos) => {
            const prevLine = pos > 0 ? context.state.doc.lineAt(pos - 1) : null;
            if (prevLine) {
                const prevText = prevLine.text;
                const match = prevText.match(/^(\s*)/);
                const baseIndent = match ? match[1].length : 0;

                // Check if previous line ends with : (control structure)
                if (prevText.trimEnd().endsWith(':')) {
                    return baseIndent + 4;
                }
                return baseIndent;
            }
            return 0;
        }),
        history(),
        keymap.of([...defaultKeymap, ...historyKeymap, indentWithTab])
    ];

    
    /** @type {string} */
    export let title;

    /** @type {{
     * scripts: import('$agentTypes').AgentCodeScriptViewModel[],
     * selectedScript: import('$agentTypes').AgentCodeScriptViewModel | null
     * }}
    */
    export let scriptObj;


    /** @type {string} */
    export let scriptType;


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
        scriptObj.selectedScript = scriptObj.scripts.find(x => x.uid === uid) || null;
    }

    /**
	 * @param {string | null | undefined} uid
	 */
    function deleteScript(uid) {
        const scripts = scriptObj.scripts.filter(x => x.uid !== uid);
        scriptObj = {
            ...scriptObj,
            scripts: scripts,
            selectedScript: scripts.length > 0 ? scripts[scripts.length-1] : null
        };
    }

    /**
	 * @param {any} e
	 * @param {string | null | undefined} uid
	 */
    function changeScriptContent(e, uid) {
        const found = scriptObj?.scripts?.find(x => x.uid === uid);
        if (found) {
            found.content = e.detail;
        }
    }
</script>



<Card>
    <CardBody class="border-bottom">
        <Row class="g-3">
            <Col lg="3">
                <div class="mb-2" style="display: flex; gap: 10px;">
                    <div class="line-align-center fw-bold">
                        {title}
                    </div>
                    <div class="line-align-center">
                        <div class="line-align-center" id="src-tooltip">
                            <i class="bx bx-info-circle" />
                        </div>
                        <Tooltip target="src-tooltip" placement="top">
                            <div>Support python only</div>
                        </Tooltip>
                    </div>
                    <!-- svelte-ignore a11y-click-events-have-key-events -->
                    <!-- svelte-ignore a11y-no-static-element-interactions -->
                    <div
                        class="text-primary clickable"
                        data-bs-toggle="tooltip"
                        data-bs-placement="top"
                        title="Add src script"
                        style="font-size: 16px;"
                        on:click={() => addScript()}
                    >
                        <i class="mdi mdi-plus-circle-outline" />
                    </div>
                </div>
            </Col>
        </Row>
        <Row class="g-3">
            <Col lg="12">
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
                        <CodeMirror
                            theme={oneDark}
                            lineWrapping
                            extensions={extensions}
                            value={scriptObj.selectedScript?.content || ''}
                            on:change={e => changeScriptContent(e, scriptObj.selectedScript?.uid)}
                        />
                    </div>
                {/if}
            </Col>
        </Row>
    </CardBody>
</Card>