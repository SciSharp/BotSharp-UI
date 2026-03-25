<script>
    import { onMount } from 'svelte';
    import { _ } from 'svelte-i18n';
    import Swal from 'sweetalert2';
    import Breadcrumb from '$lib/common/shared/Breadcrumb.svelte';
    import HeadTitle from '$lib/common/shared/HeadTitle.svelte';
    import { getSettings, getSettingDetail } from '$lib/services/setting-service';
    import { JSONEditor } from 'svelte-jsoneditor';
    import { refreshAgents } from '$lib/services/agent-service';
    import LoadingToComplete from '$lib/common/spinners/LoadingToComplete.svelte';

    const duration = 3000;
    let isLoading = $state(false);
    let isComplete = $state(false);
    let isError = $state(false);
    let successText = $state('');
    let errorText = $state('');

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
        // @ts-ignore
        Swal.fire({
            title: 'Are you sure?',
            text: "You will migrate all agents data to mongoDb.",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonText: 'Yes',
            cancelButtonText: 'No'
        }).then((result) => {
            if (result.value) {
                refreshAgentData();
            }
        });
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

<div class="card">
    <div class="card-body">
        <h4 class="card-title">{$_('System & Plugin Settings')}</h4>
        <p class="card-title-desc"></p>

        <ul class="nav nav-tabs nav-tabs-default nav-justified">
            {#each settings as tab}
                <li class="nav-item" id={tab}>
                    <button
                        class="nav-link {selectedTab === tab ? 'active' : ''}"
                        style="cursor: pointer"
                        onclick={() => handleGetSettingDetail(tab)}
                    >
                        <span class="d-block d-sm-none">
                            <i class="fas fa-home"></i>
                        </span>
                        <span class="d-none d-sm-block">{tab}</span>
                    </button>
                </li>
            {/each}
        </ul>

        <div class="tab-content p-3 text-muted">
            {#each settings as tab}
                {#if selectedTab === tab}
                    <div class="tab-pane active">
                        <div class="row">
                            <div class="col-sm-12">
                                <div class="my-json-editor">
                                    <JSONEditor bind:content />
                                </div>
                            </div>
                        </div>
                    </div>
                {/if}
            {/each}
        </div>
    </div>
</div>

<div class="card">
    <div class="card-body">
        <h4 class="card-title">{$_('Migrate agents from file repository to MongoDB')}</h4>
        <p class="card-title-desc"></p>

        <button class="btn btn-primary" onclick={() => readyToRefresh()} disabled={isLoading}>
            <i class="bx bx-copy"></i> {$_('Start Migration')}
        </button>
    </div>
</div>

<style>
    .my-json-editor {
      /* define a custom theme color */
      --jse-theme-color: var(--bs-primary);
      --jse-theme-color-highlight: #687177;
    }
</style>