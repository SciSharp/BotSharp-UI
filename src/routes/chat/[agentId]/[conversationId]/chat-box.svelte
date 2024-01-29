<script>
	import {
		Dropdown,
		DropdownToggle,
		DropdownMenu,
		DropdownItem,
	} from '@sveltestrap/sveltestrap';
	import 'overlayscrollbars/overlayscrollbars.css';
    import { OverlayScrollbars } from 'overlayscrollbars';
	import { page } from '$app/stores';
	import { onMount, tick } from 'svelte';
	import Link from 'svelte-link';
	import { signalr } from '$lib/services/signalr-service.js';
	import { webSpeech } from '$lib/services/web-speech.js';
    import { sendMessageToHub, GetDialogs, deleteConversationMessage } from '$lib/services/conversation-service.js';
	import { newConversation } from '$lib/services/conversation-service';
	import { conversationStore } from '$lib/helpers/store.js';
	import { utcToLocal } from '$lib/helpers/datetime';
	import RcText from './rc-text.svelte';
	import RcQuickReply from './rc-quick-reply.svelte';
	import { PUBLIC_LIVECHAT_ENTRY_ICON } from '$env/static/public';
	import ContentLog from './content-log.svelte';
	import { replaceNewLine } from '$lib/helpers/http';
	import _ from "lodash";
	import Swal from 'sweetalert2/dist/sweetalert2.js';
	import "sweetalert2/src/sweetalert2.scss";
	import { Pane, Splitpanes } from 'svelte-splitpanes';
	import StateLog from './state-log.svelte';

	const options = {
		scrollbars: {
			visibility: 'auto',
			autoHide: 'move',
			autoHideDelay: 100,
			dragScroll: true,
			clickScroll: false,
			theme: 'os-theme-dark',
			pointers: ['mouse', 'touch', 'pen']
		}
	};
	const params = $page.params;
	
	let text = "";
	
	/** @type {import('$types').AgentModel} */
	export let agent;

	/** @type {import('$types').UserModel} */
	export let currentUser;

	// @ts-ignore
    let scrollbar;
	let microphoneIcon = "microphone-off";

    /** @type {import('$types').ChatResponseModel[]} */
    let dialogs = [];
	
	/** @type {import('$types').ContentLogModel[]} */
	let contentLogs = [];

	/** @type {import('$types').ConversationStateLogModel[]} */
	let stateLogs = [];

	/** @type {boolean} */
	let isLoadContentLog = false;
	let isLoadStateLog = false;
	
	onMount(async () => {
		dialogs = await GetDialogs(params.conversationId);
		console.log('dialogs: ', dialogs);

		signalr.onMessageReceivedFromClient = onMessageReceivedFromClient;
		signalr.onMessageReceivedFromCsr = onMessageReceivedFromCsr;
		signalr.onMessageReceivedFromAssistant = onMessageReceivedFromAssistant;
		signalr.onContentLogGenerated = onContentLogGenerated;
		signalr.onConversationStatesGenerated = onConversationStatesGenerated;
		await signalr.start(params.conversationId);

		const scrollElements = document.querySelectorAll('.scrollbar');
		scrollElements.forEach((item) => {
			scrollbar = OverlayScrollbars(item, options);
		});

		refresh();
	});

	/** @param {import('$types').ChatResponseModel} message */
	function onMessageReceivedFromClient(message) {
      dialogs.push(message);
      refresh();
      text = "";
    }

    /** @param {import('$types').ChatResponseModel} message */
    function onMessageReceivedFromCsr(message) {
      dialogs.push(message);
      refresh();
    }

    /** @param {import('$types').ChatResponseModel} message */
    function onMessageReceivedFromAssistant(message) {
		// webSpeech.utter(message.text);
		// clean rich content elements
		dialogs.forEach(dialog => {
			if (dialog.rich_content && dialog.rich_content.message.rich_type == "quick_reply") {
				dialog.rich_content.message.quick_replies = [];
			}
		});

		dialogs.push(message);
		refresh();
    }

	/** @param {import('$types').ContentLogModel} log */
	function onContentLogGenerated(log) {
		contentLogs.push({
			...log,
			is_collapsed: true
		});
		contentLogs = contentLogs.map(x => { return { ...x }; });
	}

	/** @param {import('$types').ConversationStateLogModel} data */
	function onConversationStatesGenerated(data) {
		stateLogs.push({ ...data });
		stateLogs = stateLogs.map(x => { return { ...x }; });
	}

	async function newConversationHandler() {
		const conversation = await newConversation(params.agentId);
        conversationStore.set(conversation);
		window.location.href = `/chat/${params.agentId}/${conversation.id}`;
	}

    async function sendTextMessage() {
      await sendMessageToHub(params.agentId, params.conversationId, text);
    }

    async function startListen() {
		microphoneIcon = "microphone";
		webSpeech.onSpeechToTextDetected = async (transcript) => {
			text = transcript;
			await sendTextMessage();
			microphoneIcon = "microphone-off";
		}
		webSpeech.start();
    }	

    async function refresh() {
      // trigger UI render
      dialogs = dialogs?.map(item => { return { ...item }; }) || [];
	  await tick();

      setTimeout(() => {
		const { viewport } = scrollbar.elements();
		viewport.scrollTo({ top: viewport.scrollHeight, behavior: 'smooth' }); // set scroll offset
	  }, 200);
    }

	/** @param {any} e */
	async function onSendMessage(e) {
		if ((e.key === 'Enter' && (!!e.shiftKey || !!e.ctrlKey)) || e.key !== 'Enter') return;
		await sendMessageToHub(params.agentId, params.conversationId, text);
	}

	function endChat() {
		if (window.location === window.parent.location) {
			// @ts-ignore
			Swal.fire({
				title: 'Are you sure?',
				text: "You will exit this conversation.",
				icon: 'warning',
				customClass: 'delete-modal',
				showCancelButton: true,
				confirmButtonText: 'Yes',
				cancelButtonText: 'No'
			// @ts-ignore
			}).then((result) => {
				if (result.value) {
					window.close();
				}
			});
		} else {
			window.parent.postMessage({ action: "close" }, "*");
		} 
	}

	function toggleContentLog() {
		isLoadContentLog = !isLoadContentLog;
    }

	function toggleStateLog() {
		isLoadStateLog = !isLoadStateLog;
	}

	/**
	 * @param {any} e
	 * @param {string} messageText
	 */
	function copyMessage(e, messageText) {
		e.preventDefault();
		if (!!!text) {
			text += messageText;
		} else {
			text += ' ' + messageText;
		}
	}

	/**
	 * @param {any} e
	 * @param {string} messageId
	 */
	function deleteMessage(e, messageId) {
		e.preventDefault();

		// @ts-ignore
		Swal.fire({
				title: 'Are you sure?',
				text: "You won't be able to revert this!",
				icon: 'warning',
				customClass: 'delete-modal',
				showCancelButton: true,
				confirmButtonText: 'Yes, delete it!',
				cancelButtonText: 'No'
			// @ts-ignore
			}).then(async (result) => {
				if (result.value) {
					await handleDeleteMessage(messageId);
				}
			});
	}

	/** @param {string} messageId */
	async function handleDeleteMessage(messageId) {
		const foundIdx = dialogs.findIndex(x => x.message_id === messageId);
		if (foundIdx < 0) return;
		dialogs = dialogs.filter((x, idx) => idx < foundIdx);
		await deleteConversationMessage(params.conversationId, messageId);
	}

	/** @param {any} e */
	function editMessage(e) {
		e.preventDefault();
	}
</script>

<div class="d-lg-flex">
	<Splitpanes>
		{#if isLoadStateLog}
		<Pane size={30} minSize={20} maxSize={50} >
			<StateLog stateLogs={stateLogs} closeWindow={toggleStateLog} />
		</Pane>
		{/if}
		<Pane minSize={20}>
			<div style="height: 100vh;">
				<div class="card mb-0" style="height: 100vh;">
					<div class="p-3 border-bottom" style="height: 10vh">
						<div class="row">
							<div class="col-md-4 col-7">
								<h5 class="font-size-15 mb-1">{agent?.name}</h5>
								<p class="text-muted mb-0">
									<i class="mdi mdi-circle text-success align-middle me-1" /> Active now
								</p>
							</div>
		
							<div class="col-md-8 col-5">
								<ul class="list-inline user-chat-nav text-end mb-0">
									
									<li class="list-inline-item">
										<Dropdown>
											<DropdownToggle tag="button" class="nav-btn dropdown-toggle" color="">
												<i class="bx bx-dots-horizontal-rounded" />
											</DropdownToggle>
											<DropdownMenu class="dropdown-menu-end">
												{#if !isLoadContentLog}
												<DropdownItem on:click={() => toggleContentLog()}>View Log</DropdownItem>
												{/if}
												{#if !isLoadStateLog}
												<DropdownItem on:click={() => toggleStateLog()}>View States</DropdownItem>
												{/if}
												<DropdownItem on:click={newConversationHandler}>New Conversation</DropdownItem>
											</DropdownMenu>
										</Dropdown>
									</li>
									
									<li class="list-inline-item d-sm-inline-block">
										<button type="submit" class="btn btn-primary btn-rounded chat-send waves-effect waves-light"
											on:click={() => endChat()}
										>
											<span class="d-none d-sm-inline-block me-2" >End Conversation</span> <i class="mdi mdi-window-close"></i>
										</button>
									</li>
								</ul>
							</div>
						</div>
					</div>
		
					<div class="scrollbar" style="height: 80vh">
						<div class="chat-conversation p-3">
							<ul class="list-unstyled mb-0">
								<li>
									<div class="chat-day-title">
										<span class="title">Today</span>
									</div>
								</li>
								{#each dialogs as message}
								<li id={'test_k' + message.message_id}
									class={message.sender.id === currentUser.id ? 'right' : ''}>
									<div class="conversation-list">
										{#if message.sender.id === currentUser.id}
										<Dropdown>
											<DropdownToggle class="dropdown-toggle" tag="span" color="">
												<i class="bx bx-dots-vertical-rounded" />
											</DropdownToggle>
											<DropdownMenu class="dropdown-menu-end">
												<DropdownItem on:click={(e) => editMessage(e)}>Edit</DropdownItem>
												<DropdownItem on:click={(e) => copyMessage(e, message.text)}>Copy</DropdownItem>
												<DropdownItem on:click={(e) => deleteMessage(e, message.message_id)}>Delete</DropdownItem>
											</DropdownMenu>
										</Dropdown>
										{:else}
										<div class="cicon-wrap float-start">
											{#if message.sender.role == "client"}
											<img src="/images/users/user-dummy.jpg" class="rounded-circle avatar-xs" alt="avatar">
											{:else}
											<img src={PUBLIC_LIVECHAT_ENTRY_ICON} class="rounded-circle avatar-xs" alt="avatar">
											{/if}
										</div>																
										{/if}
										{#if message.sender.id === currentUser.id}
										<div class="ctext-wrap float-end">
											<!--<div class="conversation-name">{message.sender.full_name}</div>-->
											<div class="text-start">{@html replaceNewLine(message.text)}</div>
											<p class="chat-time mb-0">
												<i class="bx bx-time-five align-middle me-1" />
												<!-- {format(message.created_at, 'short-time')} -->
												{utcToLocal(message.created_at, 'hh:mm A')}
											</p>	
										</div>
										{:else}
										<div class="ctext-wrap float-start">
											<div class="flex-shrink-0 align-self-center">
												{#if message.rich_content && message.rich_content.message.rich_type == 'text'}
												<RcText message={message.rich_content.message} />
												{:else if message.rich_content && message.rich_content.message.rich_type == 'quick_reply'}
												<RcQuickReply 
													agentId={params.agentId} 
													conversationId={params.conversationId} 
													message={message.rich_content.message} 
												/>
												{:else}
												<span>{message.text}</span>
												{/if}
											</div>
										</div>
										{/if}
									</div>
								</li>
								{/each}
							</ul>
						</div>
					</div>
		
					<div class="p-3 chat-input-section" style="height: 10vh">
						<div class="row">
							<div class="col-auto">
								<button
									type="submit"
									class="btn btn-primary btn-rounded waves-effect waves-light"
									on:click={startListen}>
									<i class="mdi mdi-{microphoneIcon} md-36" />
								</button>
							</div>
							<div class="col">
								<div class="position-relative">
									<textarea rows={1} maxlength={500} class="form-control chat-input" bind:value={text} on:keydown={e => onSendMessage(e)} placeholder="Enter Message..." />
									<div class="chat-input-links" id="tooltip-container">
										<ul class="list-inline mb-0">
											<li class="list-inline-item">
												<Link href="#" title="Add Files"><i class="mdi mdi-file-document-outline" /></Link>
											</li>
										</ul>
									</div>
								</div>
							</div>
							<div class="col-auto">
								<button
									type="submit"
									class="btn btn-primary btn-rounded chat-send waves-effect waves-light"
									disabled={!!!_.trim(text)}
									on:click={sendTextMessage}
								><span class="d-none d-sm-inline-block me-2">Send</span>
									<i class="mdi mdi-send" />
								</button>
							</div>
						</div>
					</div>
				</div>
			</div>
		</Pane>
		{#if isLoadContentLog}
		<Pane size={30} minSize={20} maxSize={50}>
			<ContentLog logs={contentLogs} closeWindow={toggleContentLog} />
		</Pane>
		{/if}
	</Splitpanes>
</div>
