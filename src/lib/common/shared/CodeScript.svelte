<script>
    import { onMount, createEventDispatcher } from "svelte";
    import CodeMirror from "svelte-codemirror-editor";
    import { keymap, lineNumbers } from "@codemirror/view";
    import { indentUnit, indentOnInput, indentService } from "@codemirror/language";
    import { defaultKeymap, history, indentWithTab, historyKeymap } from "@codemirror/commands";
    import { EditorState } from "@codemirror/state";
    import { python } from "@codemirror/lang-python";
    import { javascript } from "@codemirror/lang-javascript";
	import { oneDark } from "@codemirror/theme-one-dark";

    const dispatch = createEventDispatcher();

    /** @type {string} */
    export let language = 'python';

    /** @type {string} */
    export let scriptText;

    /** @type {string} */
    export let containerClasses = '';

    /** @type {boolean} */
    export let useDarkTheme = true;

    /** @type {boolean} */
    export let hideLineNumber = false;

    /** @type {boolean} */
    export let editable = true;


    /** @type {import("@codemirror/state").Extension[]} */
    const baseExtensions = [
        indentUnit.of("    "),
        EditorState.tabSize.of(4),
        indentOnInput(),
        history(),
        keymap.of([...defaultKeymap, ...historyKeymap, indentWithTab]),
    ];

    /** @type {import("@codemirror/state").Extension[]} */
    let extensions = [];

    onMount(() => {
        if (language === 'python') {
            extensions = [
                python(),
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
                ...baseExtensions
            ];
        } else if (language === 'javascript') {
            extensions = [
                javascript(),
                ...baseExtensions
            ];
        } else {
            extensions = [
                ...baseExtensions
            ];
        }

        if (hideLineNumber) {
            extensions = [
                lineNumbers({ formatNumber: () => "" }),
                ...extensions
            ];
        }
    });

    /** @param {any} e */
    function handleChange(e) {
        dispatch('change', {
            text: e.detail
        });
    }
</script>


<CodeMirror
    class={`code-script-container ${containerClasses}`}
    lineWrapping
    theme={useDarkTheme ? oneDark : null}
    editable={editable}
    extensions={extensions}
    value={scriptText}
    on:change={e => handleChange(e)}
/>