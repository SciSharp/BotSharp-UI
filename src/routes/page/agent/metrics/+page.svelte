<script>
    import { onDestroy } from 'svelte';
    import { page } from '$app/stores';
    import { _ } from 'svelte-i18n';
    import { Card, CardBody, Col, Row } from '@sveltestrap/sveltestrap';
	import HeadTitle from "$lib/common/HeadTitle.svelte";
	import Breadcrumb from '$lib/common/Breadcrumb.svelte';
	import { globalMenuStore } from '$lib/helpers/store';

    /** @type {string} */
    let embedUrl = '';

    const unsubscriber = globalMenuStore.subscribe((/** @type {import('$pluginTypes').PluginMenuDefModel[]} */ menu) => {
        const url = $page.url.pathname;
        const pageInfo = menu.find(x => x.link === url) || null;
        embedUrl = pageInfo?.embedUrl || '';
    });

    onDestroy(() => {
        unsubscriber?.();
    });
</script>

<HeadTitle title="{$_('Metrics')}" />
<Breadcrumb title="{$_('Agent')}" pagetitle="{$_('Metrics')}" />

{#if embedUrl}
<Row>
	<Col lg="12">
		<Card>
			<CardBody>
                <iframe
                    title="agent-metrics"
                    height="100%"
                    width="100%"
                    src={embedUrl}
                    frameborder="0"
                    allowfullscreen
                >
                </iframe>
            </CardBody>
        </Card>
    </Col>
</Row>
{/if}