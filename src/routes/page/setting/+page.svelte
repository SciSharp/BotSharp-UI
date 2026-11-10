<script>
    import { onMount } from 'svelte';
    import { _ } from 'svelte-i18n';
    import Breadcrumb from '$lib/common/shared/Breadcrumb.svelte';
    import HeadTitle from '$lib/common/shared/HeadTitle.svelte';
    import { getSettings, getSettingDetail } from '$lib/services/setting-service';
    import { JSONEditor } from 'svelte-jsoneditor';
    import { formatNumber } from '$lib/helpers/utils/common';
    import AgentMigration from './agent-migration.svelte';

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
</script>

<HeadTitle title={$_('Settings')} />
<Breadcrumb title={$_('Settings')} pagetitle={$_('Detail')} />

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

<AgentMigration />
