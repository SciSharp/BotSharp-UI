<script>
	import Select from '$lib/common/dropdowns/Select.svelte';
	import { scrollToBottom } from '$lib/helpers/utils/common';

    const maxLength = 4096;
    const limit = 10;

    /**
     * @type {{
     *   selectedCodeScript?: import('$agentTypes').AgentCodeScriptViewModel | null | undefined,
     *   args?: import('$commonTypes').KeyValuePair[],
     *   codeScripts?: import('$agentTypes').AgentCodeScriptViewModel[],
     *   disabled?: boolean
     * }}
     */
    let {
        selectedCodeScript = $bindable(null),
        args = $bindable([]),
        codeScripts = [],
        disabled = false
    } = $props();

    /** @type {HTMLElement} */
    let scrollContainer;

    /** @type {import('$commonTypes').LabelValuePair[]} */
    let codeScriptOptions = $state([]);

    $effect(() => {
        codeScriptOptions = codeScripts?.map(x => ({
            label: x.name,
            value: x.name
        })) || [];

        const found = codeScripts.find(x => x.name === selectedCodeScript?.name);
        selectedCodeScript = found || null;
    });

    /** @param {any} e */
    function selectCodeScript(e) {
        // @ts-ignore
		const selectedValues = e.detail.selecteds?.map(x => x.value) || [];
        selectedCodeScript = selectedValues.length > 0 ? codeScripts?.find(x => x.name === selectedValues[0]) || null : null;
    }

    function addArg() {
        args = [...args, { key: '', value: '' }];
        scrollToBottom(scrollContainer);
    }

    /** @param {number} idx */
    function removeArg(idx) {
        if (disabled) return;

        args = args.filter((_, index) => index !== idx);
    }
</script>

<div class="instruct-setting-section instruct-setting-padding">
    <div class="instruct-setting-item">
        <div class="instruct-setting-dropdown">
            <div class="text-primary fw-bold mb-1">Code Script</div>
            <Select
                tag={'code-script-select'}
                placeholder={'Select Script'}
                searchMode
                disabled={disabled}
                selectedValues={selectedCodeScript?.name ? [selectedCodeScript.name] : []}
                options={codeScriptOptions}
                onselect={e => selectCodeScript(e)}
            />
        </div>
    </div>

    <div class="instruct-setting-item">
        <div class="instruct-setting-dropdown">
            <div class="text-primary fw-bold mb-1">Arguments</div>
            <div class="instruct-kv-container" style="max-height: 170px;" bind:this={scrollContainer}>
                {#each args as arg, idx}
                    <div class="instruct-kv-item" style="gap: 10px;">
                        <div style="flex: 0.5;">
                            <input
                                type="text"
                                class="form-control"
                                name={`arg-key-${idx}`}
                                bind:value={arg.key}
                                maxlength={maxLength}
                                disabled={disabled}
                                placeholder="Enter a name"
                            />
                        </div>
                        <div style="flex: 0.5;">
                            <input
                                type="text"
                                class="form-control"
                                name={`arg-value-${idx}`}
                                bind:value={arg.value}
                                maxlength={maxLength}
                                disabled={disabled}
                                placeholder="Enter a value"
                            />
                        </div>
                        <div class="line-align-center" style={`flex: 0 0 13px; margin-top: 3px;`}>
                            <div>
                                <i
                                    class="bx bxs-no-entry text-danger clickable"
                                    role="button"
                                    tabindex="0"
                                    onclick={() => removeArg(idx)}
                                    onkeydown={(/** @type {KeyboardEvent} */ e) => { if (e.key === 'Enter') removeArg(idx); }}
                                ></i>
                            </div>
                        </div>
                    </div>
                {/each}
            </div>
            {#if args.length < limit}
                <div class="text-center">
                    <button
                        type="button"
                        class="btn btn-link"
                        style="padding-left: 0px;"
                        disabled={disabled}
                        onclick={() => addArg()}
                    >
                        Add +
                    </button>
                </div>
            {/if}
        </div>
    </div>
</div>