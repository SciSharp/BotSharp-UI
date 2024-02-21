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
	import { PUBLIC_LIVECHAT_ENTRY_ICON } from '$env/static/public';
	import { signalr } from '$lib/services/signalr-service.js';
	import { webSpeech } from '$lib/services/web-speech.js';
    import { sendMessageToHub, GetDialogs, deleteConversationMessage } from '$lib/services/conversation-service.js';
	import { newConversation } from '$lib/services/conversation-service';
	import { conversationStore, conversationUserStateStore } from '$lib/helpers/store.js';
	import DialogModal from '$lib/common/DialogModal.svelte';
	import HeadTitle from '$lib/common/HeadTitle.svelte';
	import LoadingDots from '$lib/common/LoadingDots.svelte';
	import { utcToLocal } from '$lib/helpers/datetime';
	import { replaceNewLine } from '$lib/helpers/http';
	import { SenderAction, UserRole, RichType } from '$lib/helpers/enums';
	import RcText from './messageComponents/rc-text.svelte';
	import RcQuickReply from './messageComponents/rc-quick-reply.svelte';
	import RcMarkdown from './messageComponents/rc-markdown.svelte';
	import RcButton from './messageComponents/rc-button.svelte';
	import RcMultiSelect from './messageComponents/rc-multi-select.svelte';
	import ContentLog from './contentLogs/content-log.svelte';
	import _ from "lodash";
	import { Pane, Splitpanes } from 'svelte-splitpanes';
	import StateLog from './stateLogs/state-log.svelte';
	import StateModal from './addStateModal/state-modal.svelte';
	import ChatImage from './chatImage/chat-image.svelte';
	import Swal from 'sweetalert2/dist/sweetalert2.js';
	import "sweetalert2/src/sweetalert2.scss";
	import moment from 'moment';

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
	
	/** @type {string} */
	let text = "";
	let editText = "";
	let truncateMsgId = "";

	/** @type {string[]} */
	let prevSentMsgs = [];
	let sentMsgIdx = 0;
	
	/** @type {import('$types').AgentModel} */
	export let agent;

	/** @type {import('$types').UserModel} */
	export let currentUser;

	// @ts-ignore
    let scrollbar;
	let microphoneIcon = "microphone-off";
	let lastBotMsgId = '';

    /** @type {import('$types').ChatResponseModel[]} */
    let dialogs = [];
	/** @type {{ [s: string]: any; }} */
	let groupedDialogs = [];
	
	/** @type {import('$types').ConversationContentLogModel[]} */
	let contentLogs = [];

	/** @type {import('$types').ConversationStateLogModel[]} */
	let stateLogs = [];

	/** @type {boolean} */
	let isLoadContentLog = false;
	let isLoadStateLog = false;
	let isOpenEditMsgModal = false;
	let isOpenAddStateModal = false;
	let isSendingMsg = false;
	let isThinking = false;
	let isLite = false;
	
	onMount(async () => {
		dialogs = await GetDialogs(params.conversationId);
		initPrevSentMessages(dialogs);
		initContentLogView();

		signalr.onMessageReceivedFromClient = onMessageReceivedFromClient;
		signalr.onMessageReceivedFromCsr = onMessageReceivedFromCsr;
		signalr.onMessageReceivedFromAssistant = onMessageReceivedFromAssistant;
		signalr.onConversationContentLogGenerated = onConversationContentLogGenerated;
		signalr.onConversationStateLogGenerated = onConversationStateLogGenerated;
		signalr.onSenderActionGenerated = onSenderActionGenerated;
		await signalr.start(params.conversationId);

		const scrollElements = document.querySelectorAll('.scrollbar');
		scrollElements.forEach((item) => {
			scrollbar = OverlayScrollbars(item, options);
		});

		refresh();
	});

	/** @param {import('$types').ChatResponseModel[]} dialogs */
	function initPrevSentMessages(dialogs) {
		if (!!!dialogs) return;

		prevSentMsgs = dialogs.filter(x => x.sender?.role != UserRole.Assistant).map(x => x.text || '') || [];
		sentMsgIdx = prevSentMsgs.length;
	}

	function initContentLogView() {
		isLite = $page.url.searchParams.get('isLite') === 'true';
		isLoadContentLog = !isLite;
	}

	/** @param {import('$types').ChatResponseModel[]} dialogs */
	function findLastBotMessage(dialogs) {
		const lastBotMsg = dialogs.findLast(x => x.sender?.role === UserRole.Assistant);
		return lastBotMsg?.message_id || '';
	}

	async function refresh() {
		// trigger UI render
		dialogs = dialogs?.map(item => { return { ...item }; }) || [];
		lastBotMsgId = findLastBotMessage(dialogs);
		groupedDialogs = groupDialogs(dialogs);
		await tick();

		setTimeout(() => {
			const { viewport } = scrollbar.elements();
			viewport.scrollTo({ top: viewport.scrollHeight, behavior: 'smooth' }); // set scroll offset
		}, 200);
    }

	/** @param {import('$types').ChatResponseModel[]} dialogs */
	function groupDialogs(dialogs) {
		if (!!!dialogs) return [];
		const format = 'MMM D, YYYY';
		// @ts-ignore
		return _.groupBy(dialogs, (x) => {
			const createDate = moment.utc(x.created_at).local().format(format);
			if (createDate == moment.utc().local().format(format)) {
				return 'Today';
			} else if (createDate == moment.utc().local().subtract(1, 'days').format(format)) {
				return 'Yesterday';
			}
			return createDate;
		});
	}


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
		dialogs.push(message);
		refresh();
    }

	/** @param {import('$types').ConversationContentLogModel} log */
	function onConversationContentLogGenerated(log) {
		if (!isLoadContentLog) return;
		contentLogs.push({ ...log });
		contentLogs = contentLogs.map(x => { return { ...x }; });
	}

	/** @param {import('$types').ConversationStateLogModel} log */
	function onConversationStateLogGenerated(log) {
		if (!isLoadStateLog) return;
		stateLogs.push({ ...log });
		stateLogs = stateLogs.map(x => { return { ...x }; });
	}

	/**  @param {import('$types').ConversationSenderActionModel} data */
	function onSenderActionGenerated(data) {
		if (data?.sender_action == SenderAction.TypingOn) {
			isThinking = true;
		} else if (data?.sender_action == SenderAction.TypingOff) {
			isThinking = false;
		}
	}

	async function newConversationHandler() {
		const conversation = await newConversation(params.agentId);
        conversationStore.set(conversation);
		let url = `chat/${params.agentId}/${conversation.id}`;
		if (isLite) {
			url = `${url}?isLite=true`;
		}
		window.location.href = url;
	}

    function sendTextMessage() {
		isSendingMsg = true;
		const sentText = text;
		text = "";
		return new Promise((resolve, reject) => {
			sendMessageToHub(params.agentId, params.conversationId, sentText).then(res => {
				isSendingMsg = false;
				resolve(res);
			}).catch(err => {
				isSendingMsg = false;
				reject(err);
			});
		});
    }

    async function startListen() {
		microphoneIcon = "microphone";
		webSpeech.onSpeechToTextDetected = (transcript) => {
			text = transcript;
			if (!!!_.trim(text) || isSendingMsg) return;

			sendTextMessage().then(() => {
				microphoneIcon = "microphone-off";
			}).catch(() => {
				microphoneIcon = "microphone-off";
			});
		}
		webSpeech.start();
	}

	/** @param {any} e */
	async function onSendMessage(e) {
		if (e.key === 'ArrowUp') {
			e.preventDefault();
			if (sentMsgIdx > 0 && sentMsgIdx <= prevSentMsgs.length) {
				sentMsgIdx -= 1;
				text = prevSentMsgs[sentMsgIdx];
			} else if (sentMsgIdx <= 0) {
				sentMsgIdx = 0;
				text = prevSentMsgs[0];
			} else {
				sentMsgIdx = prevSentMsgs.length;
				text = '';
			}
			return;
		} else if (e.key === 'ArrowDown') {
			e.preventDefault();
			if (sentMsgIdx >= 0 && sentMsgIdx < prevSentMsgs.length - 1) {
				sentMsgIdx += 1;
				text = prevSentMsgs[sentMsgIdx];
			} else if (sentMsgIdx < 0) {
				sentMsgIdx = 0;
				text = prevSentMsgs[0];
			} else {
				sentMsgIdx = prevSentMsgs.length;
				text = '';
			}
			return;
		}

		if ((e.key === 'Enter' && (!!e.shiftKey || !!e.ctrlKey)) || e.key !== 'Enter' || !!!_.trim(text) || isSendingMsg || isThinking) {
			return;
		}

		if (e.key === 'Enter') {
			e.preventDefault();
		}

		prevSentMsgs = [...prevSentMsgs, text];
		isSendingMsg = true;
		sendMessageToHub(params.agentId, params.conversationId, text).then(() => {
			isSendingMsg = false;
		}).catch(() => {
			isSendingMsg = false;
		});
		text = "";
	}

	/**
	 * @param {string} payload
	 */
	function confirmSelectedOption(payload) {
		isSendingMsg = true;
		sendMessageToHub(params.agentId, params.conversationId, payload).then(() => {
			isSendingMsg = false;
		}).catch(() => {
			isSendingMsg = false;
		});
	}

	function endChat() {
		if (window.location === window.parent.location) {
			// @ts-ignore
			Swal.fire({
				title: 'Are you sure?',
				text: "You will exit this conversation.",
				icon: 'warning',
				customClass: 'custom-modal',
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
		if (!isLoadContentLog) {
			contentLogs = [];
		}
    }

	function toggleStateLog() {
		isLoadStateLog = !isLoadStateLog;
		if (!isLoadStateLog) {
			stateLogs = [];
		}
	}

	function toggleAddStateModal() {
		isOpenAddStateModal = !isOpenAddStateModal;
	}

	function clearStates() {
		// @ts-ignore
		Swal.fire({
			title: 'Are you sure?',
			text: "You won't be able to revert this!",
			icon: 'warning',
			customClass: 'custom-modal',
			showCancelButton: true,
			confirmButtonText: 'Yes, delete it!',
			cancelButtonText: 'No'
		// @ts-ignore
		}).then(async (result) => {
			if (result.value) {
				conversationUserStateStore.reset();
			}
		});
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
			customClass: 'custom-modal',
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
		const isDeleted = truncateDialogs(messageId);
		if (!isDeleted) return;
		await deleteConversationMessage(params.conversationId, messageId);
	}

	/**
	 * @param {any} e
	 * @param {import('$types').ChatResponseModel} message
	 */
	function editMessage(e, message) {
		e.preventDefault();
		truncateMsgId = message?.message_id;
		editText = message?.text;
		isOpenEditMsgModal = true;
	}

	function toggleEditMsgModal() {
		isOpenEditMsgModal = !isOpenEditMsgModal;
		if (!isOpenEditMsgModal) {
			truncateMsgId = "";
			editText = "";
		}
	}

	async function confirmEditMsg() {
		const isDeleted = truncateDialogs(truncateMsgId);
		if (!isDeleted) return;
		toggleEditMsgModal();
		await sendMessageToHub(params.agentId, params.conversationId, editText, truncateMsgId);
	}

	/** @param {string} messageId */
	function truncateDialogs(messageId) {
		const foundIdx = dialogs.findIndex(x => x.message_id === messageId);
		if (foundIdx < 0) return false;
		dialogs = dialogs.filter((x, idx) => idx < foundIdx);
		initPrevSentMessages(dialogs);
		refresh();
		return true;
	}
</script>

<DialogModal
	className="custom-modal"
	title={'Edit message'}
	isOpen={isOpenEditMsgModal}
	toggleModal={toggleEditMsgModal}
	confirm={confirmEditMsg}
	cancel={toggleEditMsgModal}
	disableConfirmBtn={!!!_.trim(editText)}
>
	<textarea class="form-control chat-input" rows="10" maxlength={500} bind:value={editText} placeholder="Enter Message..." />
</DialogModal>

<StateModal
	className="custom-modal"
	isOpen={isOpenAddStateModal}
	toggleModal={toggleAddStateModal}
	confirm={toggleAddStateModal}
	cancel={toggleAddStateModal}
/>

<HeadTitle title="Chat" addOn='' />
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
					<div class="border-bottom" style="height: 10%; padding: 2%">
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
												{#if !isLoadStateLog || !isOpenAddStateModal}
												<li>
													<Dropdown direction="right" class="state-menu">
														<DropdownToggle caret class="dropdown-item">
															States
														</DropdownToggle>
														<DropdownMenu>
															{#if !isLoadStateLog}
															<DropdownItem on:click={() => toggleStateLog()}>View States</DropdownItem>
															{/if}
															{#if !isOpenAddStateModal}
															<DropdownItem on:click={() => toggleAddStateModal()}>Add States</DropdownItem>
															{/if}
															<DropdownItem on:click={() => clearStates()}>Clear States</DropdownItem>
														</DropdownMenu>
													</Dropdown>
												</li>
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
		
					<div class="scrollbar" style="height: 82%">
						<div class="chat-conversation p-3">
							<ul class="list-unstyled mb-0">
								{#each Object.entries(groupedDialogs) as [createDate, dialogGroup]}
								<li>
									<div class="chat-day-title">
										<span class="title">{createDate}</span>
									</div>
								</li>
								{#each dialogGroup as message}
								<li id={'test_k' + message.message_id}
									class={message.sender.id === currentUser.id ? 'right' : ''}>
									<div class="conversation-list">
										{#if message.sender.id === currentUser.id}
										<div class="msg-container">
											<div class="ctext-wrap">
												<div>
													<!--<div class="conversation-name">{message.sender.full_name}</div>-->
													<div class="text-start">{@html replaceNewLine(message.text)}</div>
													<p class="chat-time mb-0">
														<i class="bx bx-time-five align-middle me-1" />
														<!-- {format(message.created_at, 'short-time')} -->
														{utcToLocal(message.created_at, 'hh:mm A')}
													</p>
												</div>
											</div>
											<ChatImage message={message} />
										</div>
										<Dropdown>
											<DropdownToggle class="dropdown-toggle" tag="span" color="">
												<i class="bx bx-dots-vertical-rounded" />
											</DropdownToggle>
											<DropdownMenu class="dropdown-menu-end">
												<DropdownItem on:click={(e) => editMessage(e, message)}>Edit</DropdownItem>
												<DropdownItem on:click={(e) => copyMessage(e, message.text)}>Copy</DropdownItem>
												<DropdownItem on:click={(e) => deleteMessage(e, message.message_id)}>Delete</DropdownItem>
											</DropdownMenu>
										</Dropdown>
										{:else}
										<div class="cicon-wrap">
											{#if message.sender.role == UserRole.Client}
											<img src="images/users/user-dummy.jpg" class="rounded-circle avatar-xs" alt="avatar">
											{:else}
											<img src={PUBLIC_LIVECHAT_ENTRY_ICON} class="rounded-circle avatar-xs" alt="avatar">
											{/if}
										</div>
										<div class="msg-container">
											{#if message.rich_content}
												{#if message.rich_content.message?.rich_type === RichType.Text}
												<RcText message={message.rich_content.message} />
												{:else if message.rich_content.message?.rich_type === RichType.QuickReply}
												<RcQuickReply
													message={message.rich_content?.message}
													displayOptions={message.message_id === lastBotMsgId}
													onConfirm={confirmSelectedOption}
												/>
												{:else if message.rich_content.message?.rich_type === RichType.Button}
												<RcButton
													message={message.rich_content.message}
													displayOptions={message.message_id === lastBotMsgId}
													onConfirm={confirmSelectedOption}
												/>
												{:else if message.rich_content.message?.rich_type === RichType.MultiSelect}
												<RcMultiSelect
													message={message.rich_content.message}
													displayOptions={message.message_id === lastBotMsgId}
													onConfirm={confirmSelectedOption}
												/>
												{:else}
												<RcText message={message} />
												{/if}
											{:else}
											<RcText message={message} />
											{/if}

											<ChatImage message={message} />
										</div>
										{/if}
									</div>
								</li>
								{/each}
								{/each}

								{#if isThinking}
								<li>
									<div class="conversation-list">
										<div class="cicon-wrap float-start">
											<img src={PUBLIC_LIVECHAT_ENTRY_ICON} class="rounded-circle avatar-xs" alt="avatar">
										</div>
										<div class="ctext-wrap float-start" style="display: flex;">
											<div class="flex-shrink-0 align-self-center">
												<LoadingDots duration={'1s'} size={10} color={'var(--bs-primary)'} />
											</div>
										</div>
									</div>
								</li>
								{/if}
							</ul>
						</div>
					</div>
		
					<div class="chat-input-section" style="height: 8%; padding: 2%">
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
									<textarea rows={1} maxlength={500} class="form-control chat-input" bind:value={text} on:keydown={e => onSendMessage(e)} disabled={isSendingMsg || isThinking} placeholder="Enter Message..." />
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
									disabled={!!!_.trim(text) || isSendingMsg || isThinking}
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
			<ContentLog contentLogs={contentLogs} closeWindow={toggleContentLog} />
		</Pane>
		{/if}
	</Splitpanes>
</div>
