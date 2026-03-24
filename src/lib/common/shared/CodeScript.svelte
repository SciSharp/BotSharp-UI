<script>
    import CodeMirror from "svelte-codemirror-editor";
    import { indentService } from "@codemirror/language";
    import { python } from "@codemirror/lang-python";
    import { javascript } from "@codemirror/lang-javascript";
	import { oneDark } from "@codemirror/theme-one-dark";

    let {
        /** @type {string} */
        language = 'python',
        /** @type {string} */
        scriptText = '',
        /** @type {string} */
        containerClasses = '',
        /** @type {boolean} */
        useDarkTheme = true,
        /** @type {boolean} */
        hideLineNumber = false,
        /** @type {boolean} */
        editable = true,
        /** @type {((text: string) => void) | undefined} */
        onchange = undefined
    } = $props();

    const pythonIndentService = indentService.of((context, pos) => {
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
    });

    /** @type {import("@codemirror/language").LanguageSupport | null} */
    let lang = $derived(
        language === 'python' ? python()
        : language === 'javascript' ? javascript()
        : null
    );

    /** @type {import("@codemirror/state").Extension[]} */
    let extensions = $derived(
        language === 'python' ? [pythonIndentService] : []
    );

    /** @param {string} value */
    function handleChange(value) {
        onchange?.(value);
    }
</script>


<CodeMirror
    class={`code-script-container ${containerClasses}`}
    lang={lang}
    tabSize={4}
    lineWrapping
    lineNumbers={hideLineNumber ? { formatNumber: () => "" } : true}
    theme={useDarkTheme ? oneDark : null}
    editable={editable}
    extensions={extensions}
    value={scriptText}
    onchange={handleChange}
/>