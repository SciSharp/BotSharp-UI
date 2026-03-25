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

<div class="col-xl-4">
	<div class={`card ${hide}`}>
		<div class="card-body">
			{#if isLoading}
				<h4 class="card-title mb-0">{"Loading..."} </h4>
				<p> Loading ... </p>
			{:else if conversationModel}
				<div class="row">
					<div class="col-10">
						<h4 class="card-title mb-0">{conversationModel.title} </h4>
					</div>
					<div class="col-2">
						<button
							class="btn btn-rounded btn-sm btn-light"
							onclick={() => {
								hide = 'hide';
								unpinConversationFromDashboard(conversationModel.agent_id, conversationId);
							}}
						>
							<i
								class="mdi mdi-pin-off"
								style="font-size: 12px;"
								data-bs-toggle="tooltip"
								data-bs-placement="top"
								title="Unpin"></i>
						</button>
					</div>
				</div>
				<div class="card mb-2">
					<div class="chat-head">
						<div class="row chat-row">
							<div class="col-md-0 col-7 chat-head-info">
								<div class="chat-head-agent">
									{#if agent?.icon_url}
									<div class="line-align-center">
										<img class="chat-head-agent-icon" src={agent.icon_url} alt="">
									</div>
									{/if}
									<div class="chat-head-agent-name line-align-center ellipsis">{conversationModel.agent_id}</div>
								</div>
							</div>
						</div>
					</div>

					<div class="chat-input-section css-animation fade-in-from-none mb-2">
						<div class="row">
							<div class="col-10">
								<div class="position-relative">
									<ChatTextArea
										id={'dashboard-chat-textarea'}
										className={'chat-input'}
										maxLength={1024}
										disabled={false}
										bind:text={text}
										bind:loadUtils={loadUtils}
										bind:options={chatUtilOptions}
										onFocus={() => chatUtilOptions = []}
									>
									</ChatTextArea>
								</div>
							</div>
							<div class="col-auto">
								<button
									type="submit"
									class="btn btn-rounded chat-send waves-effect waves-light btn-primary"
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
					</div>
				</div>
			{/if}

		</div>
	</div>
</div>
