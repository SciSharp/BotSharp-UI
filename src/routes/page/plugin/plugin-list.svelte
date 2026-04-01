<script>
	import { _ } from 'svelte-i18n';
	import { installPlugin, removePlugin } from '$lib/services/plugin-service';
	import Swal from 'sweetalert2';
	import { sendToChatBot } from '$lib/helpers/utils/chat';
	import { CHAT_FRAME_ID } from '$lib/helpers/constants';
	import { ChatAction } from '$lib/helpers/enums';

	/**
	 * @type {{
	 *   plugins: import('$pluginTypes').PluginDefModel[]
	 * }}
	 */
	let { plugins } = $props();

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
		// ChatAction.NewChat: init a new conversation, and then send the message; if the message text is null, then only create a new conversation.
		sendToChatBot(ChatAction.Chat, CHAT_FRAME_ID, text, data);
	}
</script>

<div class="row">
	{#each plugins as item}
		<div class="col-xl-3 col-md-6" style="margin-bottom: 10px;">
			<div class="card" style="height: 100%">
				<div class="card-body d-flex flex-column justify-content-between">
					<div class="favorite-icon">
						<div><i class="uil uil-heart-alt fs-18"></i></div>
					</div>
					<img src={item.icon_url} alt="{item.name}" height="35" width="35" class="mb-3" />
					<h5 class="fs-17 mb-2">
						<div class="text-dark">{item.name}</div>
						<small class="text-muted fw-normal">plugin</small>
					</h5>
					<ul class="list-inline mb-0">
						<li>
							<p
								class="text-muted fs-14 mb-1 truncate-text"
								style="height: 60px;"
								data-bs-toggle="tooltip"
								data-bs-placement="top"
								title={item.description}
							>
								{item.description}
							</p>
						</li>
						{' '}
						<li>
							<p class="text-muted fs-14 mb-0"><i class="mdi mdi-map-marker"></i> {item.assembly}</p>
						</li>
						<li>
							<p class="text-muted fs-14 mb-0"><i class="uil uil-wallet"></i> $0.0 / month</p>
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
							onclick={() => clickView(item)}
						>
							{$_('View')}
						</button>
						{#if item.settings_name}
							<a href="page/setting#{item.settings_name}" class="btn btn-soft-success btn-sm">{$_('Settings')}</a>
						{/if}
						{#if !item.is_core}
							<button class="btn btn-soft-warning btn-sm" onclick={() => handlePluginStatus(item.id, item.name, !item.enabled)}>{item.enabled ? $_("Remove") : $_("Install")}</button>
						{/if}
					</div>
				</div>
			</div>
		</div>
	{/each}
</div>
