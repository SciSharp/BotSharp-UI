<script>
	import Link from 'svelte-link';
	import {
		Card,
		CardBody,
		Col,
		ModalBody,
		ModalHeader,
		Row,
		Label,
		Input,
		Button
	} from '@sveltestrap/sveltestrap';
	import { enablePlugin, disablePlugin } from '$lib/services/plugin-service';
	import { goto } from '$app/navigation';
	import { PUBLIC_PLUGIN_DEFAULT_ICON } from '$env/static/public';

    /** @type {import('$types').PluginDefModel[]} */
    export let plugins;

	/** 
	 * @param {string} id
	 * @param {boolean} enable
	*/
	async function handlePluginStatus(id, enable) {
		if (enable) {
			await enablePlugin(id);
		} else {
			await disablePlugin(id);
		}
		
		const path = window.location.pathname;
		// refresh page
		goto('/').then(() => goto(path));
	}
</script>

<Row>
	{#each plugins as item}
		<Col xl={3} md={6}>
			<Card>
				<CardBody>
					<div class="favorite-icon">
						<Link href="#"><i class="uil uil-heart-alt fs-18" /></Link>
					</div>
					<img src={item.icon_url ? item.icon_url : PUBLIC_PLUGIN_DEFAULT_ICON} alt="{item.name}" height="35" class="mb-3" />
					<h5 class="fs-17 mb-2">
						<Link href="#" class="text-dark">{item.name}</Link>
						<small class="text-muted fw-normal">plugin</small>
					</h5>
					<ul class="list-inline mb-0">
						<li>
							<p class="text-muted fs-14 mb-1">{item.description}</p>
						</li>
						{' '}
						<li>
							<p class="text-muted fs-14 mb-0"><i class="mdi mdi-map-marker" /> {item.assembly}</p>
						</li>
						<li>
							<p class="text-muted fs-14 mb-0"><i class="uil uil-wallet" /> $0.0 / month</p>
						</li>
					</ul>
					<div class="mt-3 hstack gap-2">
						<span class="badge rounded-1 badge-soft-{item.enabled ? 'success' : 'danger'}">{item.enabled ? "Enabled" : "Disabled"}</span>
						{#if item.agent_ids.length > 0}
						<span class="badge rounded-1 badge-soft-info">{item.agent_ids.length} Agent(s)</span>
						{/if}
						<span class="badge rounded-1 badge-soft-info">Public</span>
					</div>
					<div class="mt-2 hstack pt-2 gap-2 border-top">
						<a href="#" class="btn btn-soft-success btn-sm">View</a>
						{#if item.settings_name}
						<a href="/page/setting#{item.settings_name}" class="btn btn-soft-success btn-sm">Settings</a>
						{/if}
						{#if !item.is_core}
						<a href="#" class="btn btn-soft-warning btn-sm" on:click={() => handlePluginStatus(item.id, !item.enabled)}>{item.enabled ? "Remove" : "Install"}</a>
						{/if}
					</div>
				</CardBody>
			</Card>
		</Col>
	{/each}
</Row>

<Row class="mb-3">
	<Col lg="12">
		<div class="d-flex justify-content-center">
			<nav aria-label="Page navigation example" id="pagination-element" class="mb-0">
				<div class="pagination-block pagination pagination-rounded">
					<Link href="#" class="page-link outline-none disabled" id="page-prev">
						<i class="bx bx-chevron-left align-middle" />
					</Link>
					<span id="page-num" class="outline-none pagination">
                        <Link class="page-link clickPageNumber " href="#" active>1</Link><Link
							class="page-link clickPageNumber"
							href="#">2</Link>
					</span>
					<Link href="#" class="page-link outline-none" id="page-next"><i class="bx bx-chevron-right align-middle" /></Link>
				</div>
			</nav>
		</div>
	</Col>
</Row>
