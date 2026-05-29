<script>
	import { _ } from 'svelte-i18n';
	import { onMount } from 'svelte';
	import ChatTextArea from '../../chat/[agentId]/[conversationId]/chat-util/chat-text-area.svelte';
	import { getConversation, updateDashboardConversation, unpinConversationFromDashboard } from '$lib/services/conversation-service';

	let {
		conversationId = '',
		instruction = '',
		userId = ''
	} = $props();

	/** @type {import('$conversationTypes').ConversationModel | undefined}*/
	let conversationModel = $state(undefined);

	let agent = $state({
		name: "Loading",
		icon_url: "https://botsharp.azurewebsites.net/images/users/bot.png"
	});

	let isLoading = $state(true);

	/** @type {string} */
	let hide = $state('');

	/** @type {string} */
	let text = $state('');
	/** @type {boolean} */
	let loadUtils = $state(false);

	/** @type {number} */
	let messageInputTimeout = 0;

	/** @type {string[]} */
	let chatUtilOptions = $state([]);

	onMount(() => {
			if (conversationId) {
				loadDashboardComponents(conversationId);
			}
			if (instruction) {
				text = instruction;
			}
		}
	);

	/**
	 * delete a message in conversation
	 * @param {string} id The user input
	 */
	 async function loadDashboardComponents(id) {
		getConversation(id)
		.then(
			response => {
				conversationModel = response;
				isLoading = false;
			}
		)
		.catch();
	}

	/** @param {any} e */
    function handleMessageInput(e) {
        const value = e.target.value;

        clearTimeout(messageInputTimeout);
        chatUtilOptions = [];
    }
</script>

<div class="w-full xl:w-1/3 px-2 {hide ? 'hidden' : ''}">
	<div class="mb-4 rounded-md bg-white shadow ring-1 ring-black/5 dark:bg-gray-800 dark:ring-white/10">
		<div class="p-4">
			{#if isLoading}
				<h4 class="mb-0 text-base font-medium">Loading...</h4>
				<p class="text-muted">Loading ...</p>
			{:else if conversationModel}
				<div class="flex items-start gap-2">
					<h4 class="mb-0 grow truncate text-base font-medium text-dark dark:text-gray-100">
						{conversationModel.title}
					</h4>
					<button
						type="button"
						class="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-light text-dark transition-colors hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600"
						aria-label="Unpin"
						title="Unpin"
						onclick={() => {
							hide = 'hide';
							unpinConversationFromDashboard(conversationModel.agent_id, conversationId);
						}}
					>
						<i class="mdi mdi-pin-off text-xs"></i>
					</button>
				</div>

				<div class="mt-3 rounded border border-gray-200 dark:border-gray-700">
					<!-- Chat head -->
					<div class="flex items-center gap-2 border-b border-gray-200 px-3 py-2 dark:border-gray-700">
						{#if agent?.icon_url}
							<img class="h-6 w-6 rounded-full" src={agent.icon_url} alt="">
						{/if}
						<div class="truncate text-sm font-medium text-dark dark:text-gray-100">
							{conversationModel.agent_id}
						</div>
					</div>

					<!-- Input -->
					<div class="flex items-end gap-2 p-2">
						<div class="relative grow">
							<ChatTextArea
								id={'dashboard-chat-textarea'}
								className={'chat-input'}
								maxLength={1024}
								disabled={false}
								bind:text={text}
								bind:loadUtils={loadUtils}
								bind:options={chatUtilOptions}
								onFocus={() => chatUtilOptions = []}
							/>
						</div>
						<button
							type="submit"
							class="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary text-white transition-colors hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-50"
							disabled={!text}
							onclick={() => updateDashboardConversation({
								conversation_id: conversationId,
								name: '',
								instruction: text
							})}
						>
							<i class="mdi mdi-send"></i>
						</button>
					</div>
				</div>
			{/if}
		</div>
	</div>
</div>
