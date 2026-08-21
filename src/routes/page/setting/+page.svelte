<script>
    import { onMount } from 'svelte';
    import { _ } from 'svelte-i18n';
    import ConfirmModal from '$lib/common/modals/ConfirmModal.svelte';
    import Breadcrumb from '$lib/common/shared/Breadcrumb.svelte';
    import HeadTitle from '$lib/common/shared/HeadTitle.svelte';
    import { getSettings, getSettingDetail } from '$lib/services/setting-service';
    import { JSONEditor } from 'svelte-jsoneditor';
    import { refreshAgents } from '$lib/services/agent-service';
    import { formatNumber } from '$lib/helpers/utils/common';
    import LoadingToComplete from '$lib/common/spinners/LoadingToComplete.svelte';

    const duration = 3000;
    let isLoading = $state(false);
    let isComplete = $state(false);
    let isError = $state(false);
    let successText = $state('');
    let errorText = $state('');

    let confirmOpen = $state(false);

    let selectedTab = $state('1');
    /** @type {string[]} */
    let settings = $state([]);

    let content = $state({ json: {} });

    onMount(async () => {
        settings = await getSettings();
        selectedTab = settings[0];
        handleGetSettingDetail(selectedTab);
    });

    /**
     * @param {string} tab
     */
    async function handleGetSettingDetail(tab) {
        selectedTab = tab;
        const detail = await getSettingDetail(tab);
        content = {
            json: detail
        };
    }

    function readyToRefresh() {
        confirmOpen = true;
    }

    function closeConfirm() {
        confirmOpen = false;
    }

    function onConfirmRefresh() {
        closeConfirm();
        refreshAgentData();
    }

    const refreshAgentData = () => {
        isLoading = true;
        refreshAgents().then(res => {
            isComplete = true;
            isLoading = false;
            successText = res;
            setTimeout(() => {
                isComplete = false;
                successText = '';
            }, duration);
        }).catch(() => {
            isLoading = false;
            isComplete = false;
            isError = true;
            errorText = 'Failed to migrate agents.';
            setTimeout(() => {
                isError = false;
                errorText = '';
            }, duration);
        });
    };
</script>

<HeadTitle title={$_('Settings')} />
<Breadcrumb title={$_('Settings')} pagetitle={$_('Detail')} />

<LoadingToComplete
    {isLoading}
    {isComplete}
    {isError}
    {successText}
    {errorText}
/>

<ConfirmModal
    isOpen={confirmOpen}
    icon="warning"
    title="Are you sure?"
    text="You will migrate all agents data to mongoDb."
    confirmBtnText="Yes"
    cancelBtnText="No"
    confirm={onConfirmRefresh}
    cancel={closeConfirm}
    toggleModal={closeConfirm}
/>

<div class="mb-4 rounded-2xl bg-white shadow-xl ring-1 ring-black/5 dark:bg-gray-800 dark:ring-white/10">
    <div class="border-b border-gray-100 px-6 py-4 dark:border-gray-700">
        <div class="flex items-center gap-3">
            <span class="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary">
                <i class="mdi mdi-tune-vertical text-xl"></i>
            </span>
            <div class="grow">
                <h4 class="mb-0 text-base font-semibold text-dark dark:text-gray-100">{$_('System & Plugin Settings')}</h4>
                <p class="mb-0 text-xs text-muted">{formatNumber(settings.length)} {settings.length === 1 ? 'configuration section' : 'configuration sections'}</p>
            </div>
        </div>
    </div>

    <div class="p-4 sm:p-6">
        <!-- Tab strip -->
        <div class="thin-scrollbar -mx-1 mb-4 overflow-x-auto">
            <div class="flex min-w-max gap-1 rounded-lg bg-gray-50 p-1 ring-1 ring-gray-100 dark:bg-gray-700/50 dark:ring-gray-700">
                {#each settings as tab}
                    <button
                        type="button"
                        id={tab}
                        class="setting-tab cursor-pointer {selectedTab === tab ? 'is-active' : ''}"
                        onclick={() => handleGetSettingDetail(tab)}
                    >
                        <i class="mdi mdi-cog-outline text-base leading-none sm:hidden"></i>
                        <span class="hidden sm:inline">{tab}</span>
                    </button>
                {/each}
            </div>
        </div>

        <!-- Editor -->
        <div class="overflow-hidden rounded-lg ring-1 ring-gray-100 dark:ring-gray-700">
            {#each settings as tab}
                {#if selectedTab === tab}
                    <div class="my-json-editor">
                        <JSONEditor bind:content />
                    </div>
                {/if}
            {/each}
        </div>
    </div>
</div>

<div class="rounded-2xl bg-white shadow-xl ring-1 ring-black/5 dark:bg-gray-800 dark:ring-white/10">
    <div class="border-b border-gray-100 px-6 py-4 dark:border-gray-700">
        <div class="flex items-center gap-3">
            <span class="flex h-10 w-10 items-center justify-center rounded-full bg-warning/15 text-warning">
                <i class="mdi mdi-database-export-outline text-xl"></i>
            </span>
            <div class="grow">
                <h4 class="mb-0 text-base font-semibold text-dark dark:text-gray-100">{$_('Migrate agents from file repository to MongoDB')}</h4>
                <p class="mb-0 text-xs text-muted">One-time migration. All agents will be copied to the MongoDB datastore.</p>
            </div>
        </div>
    </div>

    <div class="p-4 sm:p-6">
        <div class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div class="inline-flex items-center gap-2 text-sm text-muted">
                <i class="mdi mdi-alert-circle-outline shrink-0 text-base leading-none text-warning"></i>
                <span>This action cannot be undone. Make sure you have a backup before proceeding.</span>
            </div>
            <button
                type="button"
                class="inline-flex shrink-0 items-center gap-1.5 rounded-md bg-primary px-4 py-2 text-sm font-medium text-white shadow-sm transition-colors cursor-pointer hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-60"
                onclick={() => readyToRefresh()}
                disabled={isLoading}
            >
                <i class="bx bx-copy"></i>
                {$_('Start Migration')}
            </button>
        </div>
    </div>
</div>
