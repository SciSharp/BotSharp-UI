<script>
	import { _ } from 'svelte-i18n';
	import { installPlugin, removePlugin } from '$lib/services/plugin-service';
	import ConfirmModal from '$lib/common/modals/ConfirmModal.svelte';
	import { sendToChatBot } from '$lib/helpers/utils/chat';
	import { CHAT_FRAME_ID } from '$lib/helpers/constants';
	import { ChatAction } from '$lib/helpers/enums';

	/**
	 * @type {{
	 *   plugins: import('$pluginTypes').PluginDefModel[]
	 * }}
	 */
	let { plugins } = $props();

	let confirmOpen = $state(false);
	/** @type {{ id: string, name: string, enable: boolean } | null} */
	let pendingAction = $state(null);

	/**
	 * @param {string} id
	 * @param {string} name
	 * @param {boolean} enable
	 */
	function handlePluginStatus(id, name, enable) {
		pendingAction = { id, name, enable };
		confirmOpen = true;
	}

	function closeConfirm() {
		confirmOpen = false;
		pendingAction = null;
	}

	function onConfirm() {
		if (!pendingAction) {
			closeConfirm();
			return;
		}
		const { id, enable } = pendingAction;
		const op = enable ? installPlugin(id) : removePlugin(id);
		op.then(() => refresh());
		closeConfirm();
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

<ConfirmModal
	isOpen={confirmOpen}
	icon="warning"
	title="Are you sure?"
	text={pendingAction
		? `We will ${pendingAction.enable ? 'install' : 'remove'} ${pendingAction.name}.`
		: ''}
	confirmBtnText="Yes"
	cancelBtnText="No"
	confirmBtnColor={pendingAction?.enable ? 'success' : 'danger'}
	confirm={onConfirm}
	cancel={closeConfirm}
	toggleModal={closeConfirm}
/>

<div class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
	{#each plugins as item}
		<div class="plugin-card group relative flex flex-col overflow-hidden rounded-2xl bg-white shadow-md ring-1 ring-black/5 transition-all duration-200 hover:-translate-y-1 hover:shadow-xl dark:bg-gray-800 dark:ring-white/10">
			<!-- Gradient accent strip -->
			<div class="h-1 bg-linear-to-r from-primary to-primary-hover"></div>

			<div class="flex grow flex-col p-5">
				<!-- Header: icon + favorite -->
				<div class="mb-4 flex items-start justify-between">
					<div class="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 ring-1 ring-primary/15">
						<img src={item.icon_url} alt="{item.name}" class="h-7 w-7 object-contain" />
					</div>
					<button
						type="button"
						class="inline-flex h-8 w-8 items-center justify-center rounded-full text-gray-300 transition-colors cursor-pointer hover:bg-primary/10 hover:text-primary dark:text-gray-500"
						aria-label="Favorite"
					>
						<i class="uil uil-heart-alt text-lg"></i>
					</button>
				</div>

				<!-- Title -->
				<div class="mb-3">
					<div class="text-base font-semibold text-dark dark:text-gray-100">{item.name}</div>
					<div class="text-xs uppercase tracking-wider text-muted">plugin</div>
				</div>

				<!-- Description -->
				<p
					class="mb-4 line-clamp-3 min-h-[60px] text-sm text-muted"
					title={item.description}
				>
					{item.description}
				</p>

				<!-- Meta -->
				<div class="mb-4 space-y-1.5 text-xs text-muted">
					<div class="flex items-center gap-1.5">
						<i class="mdi mdi-map-marker text-sm"></i>
						<span class="truncate" title={item.assembly}>{item.assembly}</span>
					</div>
					<div class="flex items-center gap-1.5">
						<i class="uil uil-wallet text-sm"></i>
						<span>$0.0 / month</span>
					</div>
				</div>

				<!-- Status badges -->
				<div class="mb-3 flex flex-wrap gap-1.5">
					{#if item.enabled}
						<span class="inline-flex items-center gap-1 rounded-md bg-success/10 px-2 py-0.5 text-xs font-medium text-success">
							<span class="h-1.5 w-1.5 rounded-full bg-success"></span>
							{$_("Enabled")}
						</span>
					{:else}
						<span class="inline-flex items-center gap-1 rounded-md bg-danger/10 px-2 py-0.5 text-xs font-medium text-danger">
							<span class="h-1.5 w-1.5 rounded-full bg-danger"></span>
							{$_("Disabled")}
						</span>
					{/if}
					{#if item.agent_ids.length > 0}
						<span class="inline-flex items-center rounded-md bg-info/10 px-2 py-0.5 text-xs font-medium text-info">
							{item.agent_ids.length} {item.agent_ids.length === 1 ? 'Agent' : 'Agents'}
						</span>
					{/if}
					<span class="inline-flex items-center rounded-md bg-info/10 px-2 py-0.5 text-xs font-medium text-info">{$_('Public')}</span>
				</div>

				<!-- Action buttons -->
				<div class="mt-auto flex flex-wrap gap-2 border-t border-gray-100 pt-3 dark:border-gray-700">
					<button
						type="button"
						class="inline-flex items-center gap-1 rounded-md bg-success/10 px-3 py-1.5 text-xs font-medium text-success transition-colors cursor-pointer hover:bg-success/20"
						onclick={() => clickView(item)}
					>
						<i class="bx bx-show"></i>
						{$_('View')}
					</button>
					{#if item.settings_name}
						<a
							href="page/setting#{item.settings_name}"
							class="inline-flex items-center gap-1 rounded-md bg-success/10 px-3 py-1.5 text-xs font-medium text-success transition-colors hover:bg-success/20"
						>
							<i class="bx bx-cog"></i>
							{$_('Settings')}
						</a>
					{/if}
					{#if !item.is_core}
						<button
							type="button"
							class="inline-flex items-center gap-1 rounded-md bg-warning/15 px-3 py-1.5 text-xs font-medium text-warning transition-colors hover:bg-warning/25 cursor-pointer"
							onclick={() => handlePluginStatus(item.id, item.name, !item.enabled)}
						>
							<i class="bx {item.enabled ? 'bx-x-circle' : 'bx-download'}"></i>
							{item.enabled ? $_("Remove") : $_("Install")}
						</button>
					{/if}
				</div>
			</div>
		</div>
	{/each}
</div>

