<script>
    import { onMount } from 'svelte';
    import { _ } from 'svelte-i18n';
    import ConfirmModal from '$lib/common/modals/ConfirmModal.svelte';
    import Select from '$lib/common/dropdowns/Select.svelte';
    import LoadingToComplete from '$lib/common/spinners/LoadingToComplete.svelte';
    import { getFileAgents, refreshAgents } from '$lib/services/agent-service';

    const RESULT_DURATION = 3000;

    /** @type {import('$commonTypes').LabelValuePair[]} */
    let agentOptions = $state([]);
    let optionsLoaded = $state(false);
    /** @type {string[]} */
    let selectedAgentIds = $state([]);

    let confirmOpen = $state(false);
    let isLoading = $state(false);
    /** @type {{ ok: boolean, text: string } | null} */
    let result = $state(null);
    /** @type {ReturnType<typeof setTimeout> | undefined} */
    let resultTimer;

    onMount(() => {
        loadAgentOptions();
        return () => clearTimeout(resultTimer);
    });

    async function loadAgentOptions() {
        try {
            const agents = await getFileAgents();
            agentOptions = agents
                .filter(x => x.id)
                .map(x => ({ label: x.name, value: /** @type {string} */ (x.id) }));
        } catch (error) {
            console.error('Failed to load agents:', error);
            showResult(false, $_('Failed to load agents.'));
        } finally {
            optionsLoaded = true;
        }
    }

    /** @param {{ detail: { selecteds: import('$commonTypes').LabelValuePair[] } }} e */
    function selectAgents(e) {
        selectedAgentIds = e.detail.selecteds.map(x => x.value);
    }

    async function migrate() {
        confirmOpen = false;
        isLoading = true;
        try {
            showResult(true, await refreshAgents(selectedAgentIds));
        } catch (error) {
            console.error('Failed to migrate agents:', error);
            showResult(false, $_('Failed to migrate agents.'));
        } finally {
            isLoading = false;
        }
    }

    /**
     * @param {boolean} ok
     * @param {string} text
     */
    function showResult(ok, text) {
        clearTimeout(resultTimer);
        result = { ok, text };
        resultTimer = setTimeout(() => (result = null), RESULT_DURATION);
    }
</script>

<LoadingToComplete
    {isLoading}
    isComplete={result?.ok === true}
    isError={result?.ok === false}
    successText={result?.text}
    errorText={result?.text}
/>

<ConfirmModal
    isOpen={confirmOpen}
    icon="warning"
    title="Are you sure?"
    text={$_('You will migrate {n} selected agent(s) to mongoDb.', { values: { n: selectedAgentIds.length } })}
    confirmBtnText="Yes"
    cancelBtnText="No"
    confirm={migrate}
    cancel={() => (confirmOpen = false)}
    toggleModal={() => (confirmOpen = false)}
/>

<div class="rounded-2xl bg-white shadow-xl ring-1 ring-black/5 dark:bg-gray-800 dark:ring-white/10">
    <div class="border-b border-gray-100 px-6 py-4 dark:border-gray-700">
        <div class="flex items-center gap-3">
            <span class="flex h-10 w-10 items-center justify-center rounded-full bg-warning/15 text-warning">
                <i class="mdi mdi-database-export-outline text-xl"></i>
            </span>
            <div class="grow">
                <h4 class="mb-0 text-base font-semibold text-dark dark:text-gray-100">{$_('Migrate agents from file repository to MongoDB')}</h4>
                <p class="mb-0 text-xs text-muted">{$_('Select the agents to copy to the MongoDB datastore. Only the selected agents are migrated.')}</p>
            </div>
        </div>
    </div>

    <div class="p-4 sm:p-6">
        <div class="mb-4">
            <Select
                tag={'migrate-agent-select'}
                placeholder={$_('Select agents to migrate')}
                searchPlaceholder={$_('Search agents')}
                selectedText={'agents'}
                multiSelect
                searchMode
                selectedValues={selectedAgentIds}
                options={agentOptions}
                onselect={selectAgents}
            />
            {#if optionsLoaded && agentOptions.length === 0}
                <p class="mb-0 mt-2 text-xs text-muted">{$_('No agent files found, or the default database is the file repository.')}</p>
            {/if}
        </div>
        <div class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div class="inline-flex items-center gap-2 text-sm text-muted">
                <i class="mdi mdi-alert-circle-outline shrink-0 text-base leading-none text-warning"></i>
                <span>This action cannot be undone. Make sure you have a backup before proceeding.</span>
            </div>
            <button
                type="button"
                class="inline-flex shrink-0 items-center gap-1.5 rounded-md bg-primary px-4 py-2 text-sm font-medium text-white shadow-sm transition-colors cursor-pointer hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-60"
                onclick={() => (confirmOpen = true)}
                disabled={isLoading || selectedAgentIds.length === 0}
            >
                <i class="bx bx-copy"></i>
                {$_('Start Migration')}
            </button>
        </div>
    </div>
</div>
