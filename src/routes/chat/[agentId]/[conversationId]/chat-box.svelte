<script>
	import {
		Dropdown,
		DropdownToggle,
		DropdownMenu,
		DropdownItem,
	} from '@sveltestrap/sveltestrap';
	import {
		conversationStore,
		conversationUserStateStore,
		conversationUserMessageStore,
		conversationUserAttachmentStore
	} from '$lib/helpers/store.js';
	import {
		sendMessageToHub,
		GetDialogs,
		deleteConversationMessage,
		getConversationFiles,
		getConversationUser,
		uploadConversationFiles
	} from '$lib/services/conversation-service.js';
	import 'overlayscrollbars/overlayscrollbars.css';
    import { OverlayScrollbars } from 'overlayscrollbars';
	import { page } from '$app/stores';
	import { onMount, setContext, tick } from 'svelte';
	import Viewport from 'svelte-viewport-info';
	import { PUBLIC_LIVECHAT_ENTRY_ICON } from '$env/static/public';
	import { BOT_SENDERS, FILE_EDITORS, TEXT_EDITORS, USER_SENDERS } from '$lib/helpers/constants';
	import { signalr } from '$lib/services/signalr-service.js';
	import { webSpeech } from '$lib/services/web-speech.js';
	import { newConversation } from '$lib/services/conversation-service';
	import DialogModal from '$lib/common/DialogModal.svelte';
	import HeadTitle from '$lib/common/HeadTitle.svelte';
	import LoadingDots from '$lib/common/LoadingDots.svelte';
	import StateModal from '$lib/common/StateModal.svelte';
	import ChatTextArea from '$lib/common/ChatTextArea.svelte';
	import { utcToLocal } from '$lib/helpers/datetime';
	import { replaceNewLine } from '$lib/helpers/http';
	import { EditorType, FileSourceType, SenderAction, UserRole } from '$lib/helpers/enums';
	import { loadFileGallery, loadLocalFiles } from '$lib/helpers/utils/gallery';
	import RichContent from './rich-content/rich-content.svelte';
	import RcMessage from "./rich-content/rc-message.svelte";
	import RcDisclaimer from './rich-content/rc-disclaimer.svelte';
	import MessageImageGallery from '$lib/common/MessageImageGallery.svelte';
	import ChatImageUploader from './chat-image/chat-image-uploader.svelte';
	import ChatImageGallery from './chat-image/chat-image-gallery.svelte';
	import ContentLog from './content-log/content-log.svelte';
	import _ from "lodash";
	import { Pane, Splitpanes } from 'svelte-splitpanes';
	import StateLog from './state-log/state-log.svelte';
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
	const messageLimit = 100;
	const screenWidthThreshold = 1024;
	
	/** @type {string} */
	let text = "";
	let editText = "";
	let truncateMsgId = "";
	let indication = "";

	/** @type {string[]} */
	let prevSentMsgs = [];
	let sentMsgIdx = 0;
	
	/** @type {import('$types').AgentModel} */
	export let agent;

	/** @type {import('$types').UserModel} */
	export let currentUser;

	/** @type {any[]} */
    let scrollbars = [];
	let microphoneIcon = "microphone-off";

	/** @type {import('$types').ChatResponseModel?} */
	let lastBotMsg;

    /** @type {import('$types').ChatResponseModel[]} */
    let dialogs = [];
	/** @type {{ [s: string]: any; }} */
	let groupedDialogs = [];
	
	/** @type {import('$types').ConversationContentLogModel[]} */
	let contentLogs = [];

	/** @type {import('$types').ConversationStateLogModel[]} */
	let convStateLogs = [];

	/** @type {import('$types').MessageStateLogModel[]} */
	let msgStateLogs = [];

	/** @type {import('$types').AgentQueueLogModel[]} */
	let agentQueueLogs = [];

	/** @type {import('$types').UserStateDetailModel[]} */
	let userAddStates = [];

	/** @type {import('$types').UserModel} */
    let conversationUser;

	/** @type {boolean} */
	let isLoadContentLog = false;
	let isLoadStateLog = false;
	let isContentLogClosed = false; // initial condition
	let isStateLogClosed = false; // initial condition
	let isOpenEditMsgModal = false;
	let isOpenUserAddStateModal = false;
	let isSendingMsg = false;
	let isThinking = false;
	let isLite = false;
	let isFrame = false;
	let loadEditor = false;
	let loadTextEditor = false;
	let loadFileEditor = true;
	let autoScrollLog = false;
	let disableAction = false;

	$: {
		const editor = lastBotMsg?.rich_content?.editor || '';
		loadTextEditor = TEXT_EDITORS.includes(editor) || !Object.values(EditorType).includes(editor);
		loadEditor = !isSendingMsg && !isThinking && (loadTextEditor || loadFileEditor);
	}

	$: {
		disableAction = currentUser?.role !== UserRole.Admin && currentUser?.id !== conversationUser?.id;
	}

	setContext('chat-window-context', {
		autoScrollToBottom: autoScrollToBottom
	});
	
	onMount(async () => {
		autoScrollLog = true;
		dialogs = await GetDialogs(params.conversationId);
		conversationUser = await getConversationUser(params.conversationId);
		initUserSentMessages(dialogs);
		initChatView();
		
		signalr.onMessageReceivedFromClient = onMessageReceivedFromClient;
		signalr.onMessageReceivedFromCsr = onMessageReceivedFromCsr;
		signalr.onMessageReceivedFromAssistant = onMessageReceivedFromAssistant;
		signalr.onConversationContentLogGenerated = onConversationContentLogGenerated;
		signalr.onConversationStateLogGenerated = onConversationStateLogGenerated;
		signalr.onStateChangeGenerated = onStateChangeGenerated;
		signalr.onAgentQueueChanged = onAgentQueueChanged;
		signalr.onSenderActionGenerated = onSenderActionGenerated;
		signalr.onConversationMessageDeleted = onConversationMessageDeleted;
		await signalr.start(params.conversationId);

		scrollbars = [
			document.querySelector('.chat-scrollbar')
		].filter(Boolean);
		refresh();
		autoScrollLog = false;
	});

	function resizeChatWindow() {
		isLite = Viewport.Width <= screenWidthThreshold;
		if (!isLite) {
			isLoadContentLog = !isContentLogClosed;
			isLoadStateLog = !isStateLogClosed;
		} else {
			isLoadContentLog = false;
			isLoadStateLog = false;
			isOpenEditMsgModal = false;
			isOpenUserAddStateModal = false;
		}
	}

	function initChatView() {
		isFrame = $page.url.searchParams.get('isFrame') === 'true';
		// initial condition
		isContentLogClosed = false;
		isStateLogClosed = false;
		resizeChatWindow();
	}

	/** @param {import('$types').ChatResponseModel[]} dialogs */
	function initUserSentMessages(dialogs) {
		const curConvMessages = dialogs?.filter(x => USER_SENDERS.includes(x.sender?.role || '')).map(x => {
			return {
				conversationId: params.conversationId,
				text: x.text || ''
			};
		}) || [];

		const savedMessages = conversationUserMessageStore.get();
		// @ts-ignore
		const otherConvMessages = savedMessages?.messages?.filter(x => x.conversationId !== params.conversationId) || [];
		const allMessages = [...otherConvMessages, ...curConvMessages];
		const trimmedMessages = trimUserSentMessages(allMessages);

		prevSentMsgs = trimmedMessages.map(x => x.text || '');
		sentMsgIdx = prevSentMsgs.length;
		conversationUserMessageStore.put({
			pointer: sentMsgIdx,
			messages: trimmedMessages
		});
	}

	/** @param {string} msg */
	function renewUserSentMessages(msg) {
		const savedMessages = conversationUserMessageStore.get();
		const allMessages = [...savedMessages?.messages || [], { conversationId: params.conversationId, text: msg || '' }];
		const trimmedMessages = trimUserSentMessages(allMessages);
		if (allMessages.length > trimmedMessages.length) {
			sentMsgIdx -= allMessages.length - trimmedMessages.length;
		}

		if (sentMsgIdx < 0) {
			sentMsgIdx = 0;
		} else if (sentMsgIdx > trimmedMessages.length) {
			sentMsgIdx = trimmedMessages.length;
		}

		prevSentMsgs = trimmedMessages.map(x => x.text);
		conversationUserMessageStore.put({
			pointer: sentMsgIdx,
			messages: trimmedMessages
		});
	}

	/** @param {any[]} messages */
	function trimUserSentMessages(messages) {
		return messages?.slice(-messageLimit) || [];
	}

	/** @param {import('$types').ChatResponseModel[]} dialogs */
	function findLastBotMessage(dialogs) {
		const lastMsg = dialogs.slice(-1)[0];
		return BOT_SENDERS.includes(lastMsg?.sender?.role || '') ? lastMsg : null;
	}

	async function refresh() {
		// trigger UI render
		dialogs = dialogs?.map(item => { return { ...item }; }) || [];
		lastBotMsg = findLastBotMessage(dialogs);
		assignLoadImageMessages(dialogs);
		assignMessageDisclaimer(dialogs)
		groupedDialogs = groupDialogs(dialogs);
		await tick();

		autoScrollToBottom();
    }

	function autoScrollToBottom() {
		scrollbars.forEach(scrollbar => {
			setTimeout(() => {
				scrollbar.scrollTo({ top: scrollbar.scrollHeight, behavior: 'smooth' });
			}, 200);
		})
	}

	/** @param {import('$types').ChatResponseModel[]} dialogs */
	function assignLoadImageMessages(dialogs) {
		if (!!!dialogs) return;

		for (let idx = 0; idx < dialogs.length; idx++) {
			const curMsg = dialogs[idx];
			if (!USER_SENDERS.includes(curMsg?.sender?.role || '')) {
				continue;
			}

			const prevMsg = dialogs[idx-1];
			if (!!!prevMsg || BOT_SENDERS.includes(prevMsg?.sender?.role || '')
				&& loadFileGallery(prevMsg)) {
				curMsg.is_load_images = true;
			}
		}
	}

	/** @param {import('$types').ChatResponseModel[]} dialogs */
	function assignMessageDisclaimer(dialogs) {
		if (!!!dialogs) return null;

		for (let idx = 0; idx < dialogs.length; idx++) {
			const curMsg = dialogs[idx];
			// @ts-ignore
			if (!curMsg.rich_content?.message?.buttons?.some(op => !!op.post_action_disclaimer)) {
				continue;
			}

			const nextMsg = dialogs[idx + 1];
			if (!!nextMsg) {
				// @ts-ignore
				const disclaimerOptions = curMsg.rich_content?.message?.buttons?.filter(op => !!op.post_action_disclaimer) || [];
				const content = nextMsg?.rich_content?.message?.text || nextMsg?.text;
				// @ts-ignore
				const foundOption = disclaimerOptions.find(x => x.title === content);
				nextMsg.post_action_disclaimer = foundOption?.post_action_disclaimer;
			}
		}
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

	function getChatFiles() {
		const attachments = conversationUserAttachmentStore.get();
		return attachments?.accepted_files || [];
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

		convStateLogs.push({ ...log });
		convStateLogs = convStateLogs.map(x => { return { ...x }; });
	}

	/** @param {import('$types').MessageStateLogModel} log */
	function onStateChangeGenerated(log) {
		if (!isLoadStateLog || log == null) return;

		msgStateLogs.push({ ...log });
		msgStateLogs = msgStateLogs.map(x => { return { ...x }; });
	}

	/** @param {import('$types').AgentQueueLogModel} log */
	function onAgentQueueChanged(log) {
		if (!isLoadContentLog || log == null) return;

		agentQueueLogs.push({ ...log });
		agentQueueLogs = agentQueueLogs.map(x => { return { ...x }; });
	}

	/** @param {import('$types').ConversationSenderActionModel} data */
	function onSenderActionGenerated(data) {
		if (data?.sender_action == SenderAction.TypingOn) {
			isThinking = true;
			indication = data.indication || '';
		} else if (data?.sender_action == SenderAction.TypingOff) {
			isThinking = false;
			indication = '';
		}
	}

	/** @param {import('$types').ConversationMessageDeleteModel} data */
	function onConversationMessageDeleted(data) {
		if (!!!data?.message_id) return;
		truncateDialogs(data.message_id);
	}

	async function handleNewConversation() {
		const conversation = await newConversation(params.agentId);
        conversationStore.set(conversation);
		const url = `chat/${params.agentId}/${conversation.id}`;
		window.location.href = url;
	}


    /**
	 * @param {string} msgText
	 * @param {import('$types').MessageData?} data
	 */
    function sendChatMessage(msgText, data = null) {
		isSendingMsg = true;
		autoScrollLog = true;
		clearEventLogs();
		renewUserSentMessages(msgText);
		const postback = buildPostbackMessage(dialogs, data?.payload || msgText, data?.truncateMsgId);
		/** @type {import('$types').MessageData?} */
		let messageData = {
			...data,
			postback: postback
		};

		/** @type {any[]} */
		let files = [];
		if (!!!messageData?.inputMessageId) {
			files = getChatFiles();
		}
		resetStorage();

		if (files?.length > 0 && !!!messageData.inputMessageId) {
			return new Promise((resolve, reject) => {
				uploadConversationFiles(params.agentId, params.conversationId, files).then(resMessageId => {
					messageData = { ...messageData, inputMessageId: resMessageId };
					sendMessageToHub(params.agentId, params.conversationId, msgText, messageData).then(res => {
						resolve(res);
					}).catch(err => {
						reject(err);
					}).finally(() => {
						isSendingMsg = false;
						autoScrollLog = false;
					});
				});
			});
		} else {
			return new Promise((resolve, reject) => {
				sendMessageToHub(params.agentId, params.conversationId, msgText, messageData).then(res => {
					resolve(res);
				}).catch(err => {
					reject(err);
				}).finally(() => {
					isSendingMsg = false;
					autoScrollLog = false;
				});
			});
		}
    }

    async function startListen() {
		microphoneIcon = "microphone";
		webSpeech.onSpeechToTextDetected = (transcript) => {
			if (!!!_.trim(transcript) || isSendingMsg) return;

			sendChatMessage(transcript).then(() => {
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

		await sentTextMessage();
	}

	/** 
	 * @param {string} title
	 * @param {string} payload
	 */
	async function confirmSelectedOption(title, payload) {
		if (isSendingMsg || isThinking) return;

		await sendChatMessage(title, { payload: payload });
	}

	async function sentTextMessage() {
		const sentMsg = text;
		text = '';
		await sendChatMessage(sentMsg);
	}

	/**
	 * @param {import('$types').ChatResponseModel[]} dialogs
	 * @param {string?} content
	 * @param {string?} [truncateMsgId]
	 */
	 function buildPostbackMessage(dialogs, content, truncateMsgId) {
		/** @type {import('$types').Postback?} */
		let postback = null;
		let lastMsg = dialogs.slice(-1)[0];

		if (!!truncateMsgId) {
			const foundIdx = dialogs.findIndex(x => x.message_id === truncateMsgId);
			const truncatedDialogs = dialogs.filter((x, idx) => idx < foundIdx);
			lastMsg = truncatedDialogs.slice(-1)[0];
		}

		if (!!lastMsg?.rich_content?.fill_postback
			&& !!lastMsg?.function
			&& BOT_SENDERS.includes(lastMsg?.sender?.role || '')) {
			postback = {
				functionName: lastMsg?.function,
				parentId: lastMsg?.message_id,
				payload: content
			};
		}
		return postback;
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
			agentQueueLogs = [];
			isContentLogClosed = true;
		} else {
			isContentLogClosed = false;
		}
    }

	function cleanContentLogScreen() {
		contentLogs = [];
	}

	function toggleStateLog() {
		isLoadStateLog = !isLoadStateLog;
		if (!isLoadStateLog) {
			convStateLogs = [];
			msgStateLogs = [];
			isStateLogClosed = true;
		} else {
			isStateLogClosed = false;
		}
	}

	function cleanStateLogScreen() {
		convStateLogs = [];
	}

	function toggleUserAddStateModal() {
		isOpenUserAddStateModal = !isOpenUserAddStateModal;
		if (isOpenUserAddStateModal) {
			loadUserAddStates();
		}
	}

	function loadUserAddStates() {
		const conversationUserStates = conversationUserStateStore.get();
		if (!!conversationUserStates && conversationUserStates.conversationId == params.conversationId && !!conversationUserStates.states) {
			userAddStates = [...conversationUserStates.states];
		} else {
			userAddStates = [];
		}
	}

	function handleConfirmUserAddStates() {
		const cleanStates = userAddStates.map(state => {
            state.key.data = _.trim(state.key.data);
            state.value.data = _.trim(state.value.data);
			state.active_rounds.data = Number(state.active_rounds.data);
            return state;
        });
        conversationUserStateStore.put({
            conversationId: params.conversationId,
            states: cleanStates
        });
		toggleUserAddStateModal();
	}

	function clearUserAddStates() {
		// @ts-ignore
		Swal.fire({
			title: 'Are you sure?',
			text: "You won't be able to revert this!",
			icon: 'warning',
			showCancelButton: true,
			confirmButtonText: 'Yes, delete it!',
			cancelButtonText: 'No'
		// @ts-ignore
		}).then(async (result) => {
			if (result.value) {
				userAddStates = [];
				conversationUserStateStore.reset();
			}
		});
	}

	/**
	 * @param {any} e
	 * @param {import('$types').ChatResponseModel} message
	 */
	function resendMessage(e, message) {
		e.preventDefault();
		// @ts-ignore
		Swal.fire({
			title: 'Are you sure?',
			text: "Send this message again!",
			icon: 'warning',
			showCancelButton: true,
			confirmButtonText: 'Yes, go ahead!',
			cancelButtonText: 'No'
		// @ts-ignore
		}).then(async (result) => {
			if (result.value) {
				deleteConversationMessage(params.conversationId, message?.message_id, true).then(resMessageId => {
					sendChatMessage(message?.text, { inputMessageId: resMessageId });
				});
			}
		});
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
		isSendingMsg = true;
		clearEventLogs();
		resetStorage();
		await deleteConversationMessage(params.conversationId, messageId);
		isSendingMsg = false;
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
			resetEditMsg();
		}
	}

	function resetEditMsg() {
		truncateMsgId = "";
		editText = "";
	}

	async function confirmEditMsg() {
		isOpenEditMsgModal = false;
		deleteConversationMessage(params.conversationId, truncateMsgId, true).then(resMessageId => {
			sendChatMessage(editText, { inputMessageId: resMessageId }).then(() => {
				resetEditMsg();
			}).catch(() => {
				resetEditMsg();
			});
		});
	}

	/** @param {string} messageId */
	function truncateDialogs(messageId) {
		const foundIdx = dialogs.findIndex(x => x.message_id === messageId);
		if (foundIdx < 0) return false;
		dialogs = dialogs.filter((x, idx) => idx < foundIdx);
		truncateLogs(messageId);
		refresh();
		return true;
	}

	/** @param {string} messageId */
	function truncateLogs(messageId) {
		if (isLoadContentLog) {
			const targetIdx = contentLogs.findIndex(x => x.message_id === messageId);
			contentLogs = contentLogs.filter((x, idx) => idx < targetIdx);
		}
		
		if (isLoadStateLog) {
			const targetIdx = convStateLogs.findIndex(x => x.message_id === messageId);
			convStateLogs = convStateLogs.filter((x, idx) => idx < targetIdx);
		}
	}

	/** @param {string} messageId */
	function directToLog(messageId) {
		if (!!!messageId || isLite) return;

		highlightChatMessage(messageId);
		highlightStateLog(messageId);
		autoScrollToTargetLog(messageId);
	}

	/** @param {string} messageId */
	function highlightChatMessage(messageId) {
		const targets = document.querySelectorAll('.user-msg');
		const style = ['bg-primary', 'text-white'];
		targets.forEach(elm => {
			if (elm.id === `user-msg-${messageId}`) {
				elm.classList.add(...style);
			} else {
				elm.classList.remove(...style);
			}
		});
	}

	/** @param {string} messageId */
	function highlightStateLog(messageId) {
		if (!isLoadStateLog) return;

		const targets = document.querySelectorAll('.state-log-item');
		targets.forEach(elm => {
			const contentElm = elm.querySelector('.log-content');
			if (!contentElm) return;

			const style = ['border', 'border-primary', 'rounded', 'p-1'];
			if (elm.id === `state-log-${messageId}`) {
				contentElm.classList.add(...style);
			} else {
				contentElm.classList.remove(...style);
			}
		});
	}

	/** @param {string} messageId */
	function autoScrollToTargetLog(messageId) {
		const contentLogWrapper = '.content-log-scrollbar';
		const stateLogWrapper = '.conv-state-log-scrollbar';
		const elements = [];
		const contentLogElm = document.querySelector(`#content-log-${messageId}`);
		if (isLoadContentLog && !!contentLogElm) {
			elements.push({
				elm: contentLogElm,
				wrapperName: contentLogWrapper
			});
		}
		
		const stateLogElm = document.querySelector(`#state-log-${messageId}`);
		if (isLoadStateLog && !!stateLogElm) {
			elements.push({
				elm: stateLogElm,
				wrapperName: stateLogWrapper
			});
		}

		elements.forEach(item => {
			const scrollElement = document.querySelector(item.wrapperName);
			if (!!scrollElement && !!item.elm) {
				const logScroll = OverlayScrollbars(scrollElement, options);
				const { viewport } = logScroll.elements();
				const offsetTop = item.elm.offsetTop;
				viewport.scrollTo({ top: offsetTop, behavior: 'smooth' });
			}
		});
	}

	function openFullScreen() {
		window.open($page.url.pathname);
	}

	function clearEventLogs() {
		msgStateLogs = [];
		agentQueueLogs = [];
	}

	function resetStorage() {
		conversationUserAttachmentStore.reset();
	}
</script>


<svelte:window on:resize={() => resizeChatWindow()}/>

<DialogModal
	title={'Edit message'}
	size={'md'}
	isOpen={isOpenEditMsgModal}
	toggleModal={toggleEditMsgModal}
	confirm={confirmEditMsg}
	cancel={toggleEditMsgModal}
	disableConfirmBtn={!!!_.trim(editText)}
>
	<textarea class="form-control chat-input" rows="3" maxlength={500} bind:value={editText} placeholder="Enter Message..." />
</DialogModal>

<StateModal
	isOpen={isOpenUserAddStateModal}
	bind:states={userAddStates}
	requireActiveRounds
	toggleModal={toggleUserAddStateModal}
	confirm={handleConfirmUserAddStates}
	cancel={toggleUserAddStateModal}
/>

<HeadTitle title="Chat" addOn='' />
<div class="d-lg-flex">
	<Splitpanes>
		{#if isLoadStateLog}
		<Pane size={30} minSize={20} maxSize={50} >
			<StateLog
				bind:convStateLogs={convStateLogs}
				bind:msgStateLogs={msgStateLogs}
				autoScroll={autoScrollLog}
				closeWindow={toggleStateLog}
				cleanScreen={cleanStateLogScreen}
			/>
		</Pane>
		{/if}
		<Pane minSize={20}>
			<div style="height: 100vh;">
				<div class="card mb-0" style="height: 100vh;">
					<div class="border-bottom chat-head">
						<div class="row">
							<div class="col-md-4 col-7 head-left">
								<div class="m-1">{agent?.name}</div>
								<div class="text-muted mb-0">
									<i class="mdi mdi-circle text-success align-middle me-1" /> {conversationUser?.full_name || ''}
								</div>
							</div>
		
							<div class="col-md-8 col-5">
								<ul class="list-inline user-chat-nav user-chat-nav-flex mb-0">
									{#if isFrame}
									<li class="list-inline-item">
										<button
											class="btn btn-secondary btn-rounded btn-sm"
											on:click={() => openFullScreen()}
										>
											<i class="bx bx-fullscreen" />
										</button>
									</li>
									{/if}
									<li class="list-inline-item">
										<Dropdown>
											<DropdownToggle class="nav-btn dropdown-toggle">
												<i class="bx bx-dots-horizontal-rounded" />
											</DropdownToggle>
											<DropdownMenu class="dropdown-menu-end">
												{#if !isLite && !isLoadContentLog}
												<DropdownItem on:click={() => toggleContentLog()}>View Log</DropdownItem>
												{/if}
												{#if !isLite && (!isLoadStateLog || !isOpenUserAddStateModal)}
												<li>
													<Dropdown direction="right" class="state-menu">
														<DropdownToggle caret class="dropdown-item">
															States
														</DropdownToggle>
														<DropdownMenu>
															{#if !isLoadStateLog}
															<DropdownItem
																on:click={() => toggleStateLog()}
															>
																View States
															</DropdownItem>
															{/if}
															{#if !isOpenUserAddStateModal}
															<DropdownItem
																disabled={disableAction}
																on:click={() => toggleUserAddStateModal()}
															>
																Add States
															</DropdownItem>
															{/if}
															<DropdownItem
																disabled={disableAction}
																on:click={() => clearUserAddStates()}
															>
																Clear States
															</DropdownItem>
														</DropdownMenu>
													</Dropdown>
												</li>
												{/if}
												<DropdownItem on:click={handleNewConversation}>New Conversation</DropdownItem>
											</DropdownMenu>
										</Dropdown>
									</li>
									
									<li class="list-inline-item d-md-inline-block">
										<button
											class="btn btn-primary btn-rounded btn-sm chat-send waves-effect waves-light"
											disabled={disableAction}
											on:click={() => endChat()}
										>
											<span class="d-none d-sm-inline-block me-2" >End Conversation</span> <i class="mdi mdi-window-close"></i>
										</button>
									</li>
								</ul>
							</div>
						</div>
					</div>

					<div class={`chat-scrollbar chat-content scroll-bottom-to-top ${!loadEditor ? 'chat-content-expand' : ''}`}>
						<div class="chat-conversation p-3">
							<ul class="list-unstyled mb-0">
								{#each Object.entries(groupedDialogs) as [createDate, dialogGroup]}
								<li>
									<div class="chat-day-title">
										<span class="title">{createDate}</span>
									</div>
								</li>
								{#each dialogGroup as message}
								<li id={'test_k' + message.message_id} class:right={USER_SENDERS.includes(message.sender?.role)}>
									<div class="conv-msg-container">
										{#if USER_SENDERS.includes(message.sender?.role)}
										<div class="msg-container">
											<div
												class="ctext-wrap user-msg"
												class:clickable={!isLite && (isLoadContentLog || isLoadStateLog)}
												id={`user-msg-${message.message_id}`}
												tabindex="0"
												aria-label="user-msg-to-log"
												role="link"
												on:keydown={() => {}}
												on:click={() => directToLog(message.message_id)}
											>
												<div>
													<div class="text-start">{@html replaceNewLine(message.text)}</div>
													<p class="chat-time mb-0">
														<i class="bx bx-time-five align-middle me-1" />
														{utcToLocal(message.created_at, 'hh:mm A')}
													</p>
												</div>
											</div>
											{#if !!message.post_action_disclaimer}
												<RcDisclaimer content={message.post_action_disclaimer} />
											{/if}
											{#if message.is_load_images || USER_SENDERS.includes(message.sender?.role)}
												<MessageImageGallery
													galleryStyles={'justify-content: flex-end;'}
													fetchFiles={() => getConversationFiles(params.conversationId, message.message_id, FileSourceType.User)}
												/>
											{/if}
										</div>
											{#if !isLite}
												<Dropdown>
													<DropdownToggle class="dropdown-toggle" tag="span" disabled={isSendingMsg || isThinking || disableAction}>
														<i class="bx bx-dots-vertical-rounded" />
													</DropdownToggle>
													<DropdownMenu class="dropdown-menu-end">
														<DropdownItem on:click={(e) => editMessage(e, message)}>Edit</DropdownItem>
														<DropdownItem on:click={(e) => resendMessage(e, message)}>Resend</DropdownItem>
														<DropdownItem on:click={(e) => deleteMessage(e, message.message_id)}>Delete</DropdownItem>
													</DropdownMenu>
												</Dropdown>
											{/if}
										{:else}
										<div class="cicon-wrap">
											{#if message.sender.role == UserRole.Client}
												<img src="images/users/user-dummy.jpg" class="rounded-circle avatar-xs" alt="avatar">
											{:else}
												<img src={PUBLIC_LIVECHAT_ENTRY_ICON} class="rounded-circle avatar-xs" alt="avatar">
											{/if}
										</div>
										<div class="msg-container">
											<RcMessage message={message} />
										</div>
										{/if}
									</div>
								</li>
								{/each}
								{/each}

								{#if isThinking}
								<li>
									<div class="conv-msg-container">
										<div class="cicon-wrap float-start">
											<img src={PUBLIC_LIVECHAT_ENTRY_ICON} class="rounded-circle avatar-xs" alt="avatar">
										</div>
										<div class="msg-container">
											<div class="ctext-wrap float-start">
												{#if !!indication}
													<span class="chat-indication">
														{indication}
													</span>
												{/if}
												<div class="flex-shrink-0 align-self-center" style="display: inline-block;">
													<LoadingDots duration={'1s'} size={10} color={'var(--bs-primary)'} />
												</div>
											</div>
										</div>
									</div>
								</li>
								{/if}
							</ul>

							<ChatImageGallery disabled={isSendingMsg || isThinking} />
							{#if !!lastBotMsg && !isSendingMsg && !isThinking}
								<RichContent
									message={lastBotMsg}
									disabled={isSendingMsg || isThinking}
									onConfirm={confirmSelectedOption}
								/>
							{/if}
						</div>
					</div>

					<div class={`chat-input-section css-animation ${!loadEditor ? 'chat-input-hide' : 'fade-in-from-none'}`}>
						<div class="row">
							<div class="col-auto">
								<button
									type="submit"
									class="btn btn-primary btn-rounded waves-effect waves-light"
									disabled={isSendingMsg || isThinking || disableAction}
									on:click={startListen}
								>
									<i class="mdi mdi-{microphoneIcon} md-36" />
								</button>
							</div>
							<div class="col">
								<div class="position-relative">
									<ChatTextArea
										className={`chat-input ${loadFileEditor ? 'chat-uploader' : ''}`}
										maxLength={4096}
										bind:text={text}
										disabled={isSendingMsg || isThinking || disableAction}
										editor={lastBotMsg?.rich_content?.editor || ''}
										onKeyDown={e => onSendMessage(e)}
									/>
									{#if loadFileEditor}
										<div class="chat-input-links">
											<ChatImageUploader disabled={disableAction} onFileDrop={() => refresh()} />
										</div>
									{/if}
								</div>
							</div>
							<div class="col-auto">
								<button
									type="submit"
									class="btn btn-primary btn-rounded chat-send waves-effect waves-light"
									disabled={!!!_.trim(text) || isSendingMsg || isThinking || disableAction}
									on:click={() => sentTextMessage()}
								><span class="d-none d-md-inline-block me-2">Send</span>
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
			<ContentLog
				bind:contentLogs={contentLogs}
				bind:agentQueueLogs={agentQueueLogs}
				autoScroll={autoScrollLog}
				closeWindow={toggleContentLog}
				cleanScreen={cleanContentLogScreen}
			/>
		</Pane>
		{/if}
	</Splitpanes>
</div>
