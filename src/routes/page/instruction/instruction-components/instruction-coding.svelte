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

<div class="flex flex-col gap-5 py-3">
    <div>
        <label for="code-script-select" class="mb-1.5 inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-primary">
            <i class="mdi mdi-code-tags text-sm leading-none"></i>
            Code Script
        </label>
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

    <div>
        <div class="mb-1.5 inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-primary">
            <i class="mdi mdi-tune-variant text-sm leading-none"></i>
            Arguments
        </div>
        <div class="thin-scrollbar flex max-h-[170px] flex-col gap-2 overflow-y-auto px-1 pb-2" bind:this={scrollContainer}>
            {#each args as arg, idx}
                <div class="grid grid-cols-[1fr_1fr_auto] items-center gap-2">
                    <input
                        type="text"
                        class="form-control"
                        name={`arg-key-${idx}`}
                        bind:value={arg.key}
                        maxlength={maxLength}
                        disabled={disabled}
                        placeholder="Enter a name"
                    />
                    <input
                        type="text"
                        class="form-control"
                        name={`arg-value-${idx}`}
                        bind:value={arg.value}
                        maxlength={maxLength}
                        disabled={disabled}
                        placeholder="Enter a value"
                    />
                    <button
                        type="button"
                        class="inline-flex h-7 w-7 items-center justify-center rounded-md bg-danger/15 text-danger transition-all hover:scale-105 hover:bg-danger/25 disabled:cursor-not-allowed disabled:opacity-50"
                        disabled={disabled}
                        aria-label="Remove argument"
                        title="Remove"
                        onclick={() => removeArg(idx)}
                    >
                        <i class="bx bxs-no-entry text-base leading-none"></i>
                    </button>
                </div>
            {/each}
        </div>
        {#if args.length < limit}
            <div class="mt-2 text-center">
                <button
                    type="button"
                    class="btn btn-link inline-flex items-center gap-1"
                    disabled={disabled}
                    onclick={() => addArg()}
                >
                    <i class="mdi mdi-plus text-base leading-none"></i>
                    Add
                </button>
            </div>
        {/if}
    </div>
</div>