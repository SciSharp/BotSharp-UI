<script>
    import { onMount } from 'svelte';
    import { _ } from 'svelte-i18n';
    import Swal from 'sweetalert2';
    import {
		Card,
		CardBody,
		CardText,
		CardTitle,
		Col,
		Nav,
		NavItem,
		NavLink,
		Row,
		TabContent,
		TabPane,
        Button
	} from '@sveltestrap/sveltestrap';
    import Breadcrumb from '$lib/common/shared/Breadcrumb.svelte';
	import HeadTitle from '$lib/common/shared/HeadTitle.svelte';
    import { getSettings, getSettingDetail } from '$lib/services/setting-service';
    import { JSONEditor } from 'svelte-jsoneditor';
	import { refreshAgents } from '$lib/services/agent-service';
	import LoadingToComplete from '$lib/common/spinners/LoadingToComplete.svelte';
    
    const duration = 3000;
    let isLoading = false;
    let isComplete = false;
    let isError = false;
    let successText = '';
    let errorText = '';

    let selectedTab = '1';
    /** @type {string[]} */
    let settings = [];

    let content = { json: {} };

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
        }).catch(err => {
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

<HeadTitle title="{$_('Settings')}" />
<Breadcrumb title="{$_('Settings')}" pagetitle="{$_('Detail')}" />

<LoadingToComplete
    isLoading={isLoading}
    isComplete={isComplete}
    isError={isError}
    successText={successText}
    errorText={errorText}
/>

<Card>
    <CardBody>
        <CardTitle class="h4">{$_('System & Plugin Settings')}</CardTitle>
        <p class="card-title-desc"></p>

        <Nav tabs class="nav-tabs-default nav-justified">
            {#each settings as tab}
            <NavItem id={tab}>
                <NavLink
                    style="cursor: pointer"
                    on:click={() => handleGetSettingDetail(tab)}
                    active={selectedTab == tab}
                >
                    <span class="d-block d-sm-none">
                        <i class="fas fa-home" />
                    </span>
                    <span class="d-none d-sm-block">{tab}</span>
                </NavLink>
            </NavItem>                
            {/each}
        </Nav>

        <TabContent class="p-3 text-muted">
            {#each settings as tab}
            <TabPane tabId={tab} class={selectedTab == tab ? 'active' : ''}>
                <Row>
                    <Col sm="12">
                        <CardText class="mb-0">
                            <div class="my-json-editor">
                                <JSONEditor bind:content />
                            </div>
                        </CardText>
                    </Col>
                </Row>
            </TabPane>
            {/each}
        </TabContent>
    </CardBody>
</Card>


<Card>
    <CardBody>
        <CardTitle class="h4">{$_('Migrate agents from file repository to MongoDB')}</CardTitle>
        <p class="card-title-desc"></p>

        <Button color="primary" on:click={() => readyToRefresh()} disabled={isLoading}>
            <i class="bx bx-copy" /> {$_('Start Migration')}
        </Button>
    </CardBody>
</Card>

<style>
    .my-json-editor {
      /* define a custom theme color */
      --jse-theme-color: var(--bs-primary);
      --jse-theme-color-highlight: #687177;
    }
</style>