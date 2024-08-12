<script>
	import { _ } from 'svelte-i18n';
	import { Button, Card, CardBody } from '@sveltestrap/sveltestrap';
	import { fly } from 'svelte/transition';
	import Breadcrumb from '$lib/common/Breadcrumb.svelte';
    import HeadTitle from '$lib/common/HeadTitle.svelte';
	import KnowledgeTable from "./knowledge-table/knowledge-table.svelte";
	import KnowledgeSearch from './knowledge-search/knowledge-search.svelte';

	let show_demo = false;

	function toggleDemo() {
		show_demo = !show_demo;
	}
</script>

<HeadTitle title="{$_('Knowledge Manager')}" />
<Breadcrumb pagetitle="{$_('Knowledge Manager')}" title="{$_('Knowledge Base')}"/>

<div class="knowledge-demo-btn mb-4">
	<Button
		color={`${show_demo ? 'danger' : 'primary'}`}
		on:click={() => toggleDemo()}
	>
		{#if !show_demo}
			<div class="btn-content">
				<div class="btn-icon"><i class="bx bx-search-alt" /></div>
				<div>{'Search knowledge'}</div>
			</div>
		{:else}
			<div class="btn-content">
				<span class="btn-icon"><i class="bx bx-hide" /></span>
				<span>{'Hide search'}</span>
			</div>
		{/if}
	</Button>
</div>

<div class="d-xl-flex">
	<div class="w-100">
		{#if show_demo}
			<div
				in:fly={{ y: -10, duration: 500 }}
				out:fly={{ y: -10, duration: 200 }}
			>
				<KnowledgeSearch />
			</div>
		{/if}
		<div class="d-md-flex">
			<div class="w-100">
				<Card>
					<CardBody>
                  		<KnowledgeTable />
					</CardBody>
				</Card>
			</div>
		</div>
	</div>
</div>