<script>
	import Breadcrumb from '$lib/common/Breadcrumb.svelte';
	import HeadTitle from '$lib/common/HeadTitle.svelte';
    import {
		Button,
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
		TabPane
	} from '@sveltestrap/sveltestrap';
    import { onMount } from 'svelte';
    import { getSettings, getSettingDetail } from '$lib/services/setting-service';
    import { JSONEditor } from 'svelte-jsoneditor';

    let customActiveTab = '1';
    /** @type {string[]} */
    let settings = [];

    let content = {
        json: {
        }
    };

    onMount(async () => {
        settings = await getSettings();   
        customActiveTab = settings[0];
        handleGetSettingDetail(settings[0]);         
    });

    /**
     * 
     * @param {string} tab
     */
    async function handleGetSettingDetail(tab) {
        customActiveTab = tab;
        const detail = await getSettingDetail(tab);
        content = {
            json: detail
        };
    }
</script>

<HeadTitle title="Settings" />

<Breadcrumb title="Settings" pagetitle="Detail" />

<Card>
    <CardBody>
        <CardTitle class="h4">System & Plugin Settings</CardTitle>
        <p class="card-title-desc"></p>

        <Nav tabs class="nav-tabs-custom nav-justified">
            {#each settings as tab}
            <NavItem>
                <NavLink
                    style="cursor: pointer"
                    on:click={() => handleGetSettingDetail(tab)}
                    active={customActiveTab == tab}
                >
                    <span class="d-block d-sm-none">
                        <i class="fas fa-home" />
                    </span>
                    <span class="d-none d-sm-block">{tab}</span>
                </NavLink>
            </NavItem>                
            {/each}
        </Nav>

        <TabContent activeTab={customActiveTab} class="p-3 text-muted">
            {#each settings as tab}
            <TabPane tabId={tab} class={customActiveTab == tab ? 'active' : ''}>
                <Row>
                    <Col sm="12">
                        <CardText class="mb-0">
                            <div class="my-json-editor">
                                <JSONEditor bind:content expand={() => { return true;}}/>
                            </div>
                        </CardText>
                    </Col>
                </Row>
            </TabPane>
            {/each}
        </TabContent>
    </CardBody>
</Card>

<style>
    .my-json-editor {
      /* define a custom theme color */
      --jse-theme-color: var(--bs-primary);
      --jse-theme-color-highlight: #687177;
    }
</style>