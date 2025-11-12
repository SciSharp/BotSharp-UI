<script>
    import { Button, Input } from '@sveltestrap/sveltestrap';
	import Select from '$lib/common/Select.svelte';
	import { scrollToBottom } from '$lib/helpers/utils/common';

    const maxLength = 4096;
    const limit = 10;

    /** @type {import('$agentTypes').AgentCodeScriptViewModel | null | undefined} */
    export let selectedCodeScript = null;

    /** @type {import('$commonTypes').KeyValuePair[]} */
    export let args = [];

    /** @type {import('$agentTypes').AgentCodeScriptViewModel[]} */
    export let codeScripts = [];

    /** @type {boolean} */
    export let disabled = false;


    /** @type {HTMLElement} */
    let scrollContainer;

    /** @type {import('$commonTypes').LabelValuePair[]} */
    let codeScriptOptions = [];

    $: {
        codeScriptOptions = codeScripts?.map(x => ({
            label: x.name,
            value: x.name
        })) || [];

        const found = codeScripts.find(x => x.name === selectedCodeScript?.name);
        selectedCodeScript = found || null;
    }

    /** @param {any} e */
    function selectCodeScript(e) {
        // @ts-ignore
		const selectedValues = e.detail.selecteds?.map(x => x.value) || [];
        selectedCodeScript = selectedValues.length > 0 ? codeScripts?.find(x => x.name === selectedValues[0]) : null;
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
                on:select={e => selectCodeScript(e)}
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
                            <Input
                                type="text"
                                name={`arg-key-${idx}`}
                                bind:value={arg.key}
                                maxlength={maxLength}
                                disabled={disabled}
                                placeholder="Enter a name"
                            />
                        </div>
                        <div style="flex: 0.5;">
                            <Input
                                type="text"
                                name={`arg-value-${idx}`}
                                bind:value={arg.value}
                                maxlength={maxLength}
                                disabled={disabled}
                                placeholder="Enter a value"
                            />
                        </div>
                        <div class="line-align-center" style={`flex: 0 0 13px; margin-top: 3px;`}>
                            <div>
                                <!-- svelte-ignore a11y-click-events-have-key-events -->
                                <!-- svelte-ignore a11y-no-static-element-interactions -->
                                <i
                                    class="bx bxs-no-entry text-danger clickable"
                                    on:click={() => removeArg(idx)}
                                />
                            </div>
                        </div>
                    </div>
                {/each}
            </div>
            {#if args.length < limit}
                <div class="text-center">
                    <Button 
                        color="link"
                        style="padding-left: 0px;"
                        disabled={disabled}
                        on:click={() => addArg()}
                    >
                        Add +
                    </Button>
                </div>
            {/if}
        </div>
    </div>
</div>