<script>
	import { _ } from 'svelte-i18n'  
	import Link from 'svelte-link';
	import {
		Card,
		CardBody,
		Col,
		Row,
	} from '@sveltestrap/sveltestrap';
	import { installPlugin, removePlugin } from '$lib/services/plugin-service';
	import Swal from 'sweetalert2';
	import { sendToChatBot } from '$lib/helpers/utils/chat';
	import { CHAT_FRAME_ID } from '$lib/helpers/constants';
	import { ChatAction } from '$lib/helpers/enums';

    /** @type {import('$pluginTypes').PluginDefModel[]} */
    export let plugins;

	/**
	 * @param {string} id
	 * @param {string} name
	 * @param {boolean} enable
	 */
	function handlePluginStatus(id, name, enable) {
		// @ts-ignore
		Swal.fire({
			title: 'Are you sure?',
			text: `We will ${enable ? 'install' : 'remove'} ${name}.`,
			icon: 'warning',
			showCancelButton: true,
			confirmButtonText: 'Yes',
			cancelButtonText: 'No'
		}).then((result) => {
			if (result.value) {
				if (enable) {
					installPlugin(id).then(() => {
						refresh();
					});
				} else {
					removePlugin(id).then(() => {
						refresh();
					})
				}
			}
		});
	}

	function refresh() {
		window.location.reload();
	}

	/** @param {import('$pluginTypes').PluginDefModel} item */
	async function clickView(item) {
		const text = `view plugin ${item.name}`;
		/** @type {import('$conversationTypes').MessageData} */
		const data = {
			postback: {
				payload: 'hi world'
			},
			states: []
		};
		// ChatAction.Chat: send to current chat
		// ChatAction.NewChat: init a new conversation, and then send the message
		sendToChatBot(ChatAction.Chat, CHAT_FRAME_ID, text, data);
	}
</script>

<Row>
	{#each plugins as item}
		<Col xl={3} md={6} style="margin-bottom: 10px;">
			<Card style="height: 100%">
				<CardBody>
					<div class="favorite-icon">
						<Link href="#"><i class="uil uil-heart-alt fs-18" /></Link>
					</div>
					<img src={item.icon_url} alt="{item.name}" height="35" style="max-width: 100%;" class="mb-3" />
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
						<span class="badge rounded-1 badge-soft-{item.enabled ? 'success' : 'danger'}">{item.enabled ? $_("Enabled") : $_("Disabled")}</span>
						{#if item.agent_ids.length > 0}
							<span class="badge rounded-1 badge-soft-info">{item.agent_ids.length} Agent(s)</span>
						{/if}
						<span class="badge rounded-1 badge-soft-info">{$_('Public')}</span>
					</div>
					<div class="mt-2 hstack pt-2 gap-2 border-top">
						<button
							class="btn btn-soft-success btn-sm"
							on:click={() => clickView(item)}
						>
							{$_('View')}
						</button>
						{#if item.settings_name}
							<a href="page/setting#{item.settings_name}" class="btn btn-soft-success btn-sm">{$_('Settings')}</a>
						{/if}
						{#if !item.is_core}
							<button class="btn btn-soft-warning btn-sm" on:click={() => handlePluginStatus(item.id, item.name, !item.enabled)}>{item.enabled ? $_("Remove") : $_("Install")}</button>
						{/if}
					</div>
				</CardBody>
			</Card>
		</Col>
	{/each}
</Row>
