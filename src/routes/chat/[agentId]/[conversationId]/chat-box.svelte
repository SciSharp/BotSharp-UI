<script>
	import { onMount, setContext, tick } from 'svelte';
	import { get } from 'svelte/store';
	import { Pane, Splitpanes } from 'svelte-splitpanes';
	import Viewport from 'svelte-viewport-info';
	import { page } from '$app/state';
	import 'overlayscrollbars/overlayscrollbars.css';
    import { OverlayScrollbars } from 'overlayscrollbars';
	import _ from "lodash";
	import moment from 'moment';
	import { v4 as uuidv4 } from 'uuid';
	import {
		conversationStore,
		conversationUserStateStore,
		conversationUserMessageStore,
		conversationUserAttachmentStore,
		resetStorage,
	} from '$lib/helpers/store.js';
	import {
		sendMessageToHub,
		getConversation,
		getDialogs,
		deleteConversationMessage,
		updateConversationMessage,
		updateConversationTags,
		getConversationFiles,
		uploadConversationFiles,
		getAddressOptions,
		stopStreaming as stopStreamingApi,
	} from '$lib/services/conversation-service.js';
	import {
		PUBLIC_LIVECHAT_ENTRY_ICON,
		PUBLIC_LIVECHAT_VOICE_ENABLED,
		PUBLIC_LIVECHAT_SPEAKER_ENABLED,
		PUBLIC_LIVECHAT_FILES_ENABLED,
		PUBLIC_LIVECHAT_ENABLE_TRAINING,
		PUBLIC_LIVECHAT_STREAM_ENABLED,
		PUBLIC_DEBUG_MODE
	} from '$env/static/public';
	import { BOT_SENDERS, LEARNER_AGENT_ID, TRAINING_MODE, ADMIN_ROLES, IMAGE_DATA_PREFIX } from '$lib/helpers/constants';
	import { signalr } from '$lib/services/signalr-service.js';
	import { newConversation } from '$lib/services/conversation-service';
	import ConfirmModal from '$lib/common/modals/ConfirmModal.svelte';
	import GlobalHeader from '$lib/common/shared/GlobalHeader.svelte';
	import HeadTitle from '$lib/common/shared/HeadTitle.svelte';
	import LoadingDots from '$lib/common/spinners/LoadingDots.svelte';
	import DialogModal from '$lib/common/modals/DialogModal.svelte';
	import StateModal from '$lib/common/modals/StateModal.svelte';
	import PlainModal from '$lib/common/modals/PlainModal.svelte';
	import LoadingToComplete from '$lib/common/spinners/LoadingToComplete.svelte';
	import AudioSpeaker from '$lib/common/audio-player/AudioSpeaker.svelte';
	import CodeScript from '$lib/common/shared/CodeScript.svelte';
	import Label from '$lib/common/shared/Label.svelte';
	import { realtimeChat } from '$lib/services/realtime-chat-service';
	import { webSpeech } from '$lib/services/web-speech';
	import LocalStorageManager from '$lib/helpers/utils/storage-manager';
	import { clickoutsideDirective } from '$lib/helpers/directives';
	import { delay, formatNumber } from '$lib/helpers/utils/common';
	import { AgentExtensions } from '$lib/helpers/utils/agent';
	import { utcToLocal } from '$lib/helpers/datetime';
	import { replaceNewLine } from '$lib/helpers/http';
	import { isAudio, isExcel, isPdf } from '$lib/helpers/utils/file';
	import { ChatAction, EditorType, FileSourceType, RichType, SenderAction, UserRole } from '$lib/helpers/enums';
	import ChatTextArea from './chat-util/chat-text-area.svelte';
	import RichContent from './rich-content/rich-content.svelte';
	import RcMessage from "./rich-content/rc-message.svelte";
	import RcDisclaimer from './rich-content/rc-disclaimer.svelte';
	import MessageFileGallery from '$lib/common/files/MessageFileGallery.svelte';
	import ChatUtil from './chat-util/chat-util.svelte';
	import ChatFileUploader from './chat-util/chat-file-uploader.svelte';
	import ChatFileGallery from './chat-util/chat-file-gallery.svelte';
	import ChatBigMessage from './chat-util/chat-big-message.svelte';
	import PersistLog from './persist-log/persist-log.svelte';
	import InstantLog from './instant-log/instant-log.svelte';


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

	const messageLimit = 100;
	const screenWidthThreshold = 1024;
	const chatWidthThreshold = 500;
	const maxTextLength = 64000;
	const duration = 2000;
	const dialogCount = 100;
	const USE_MESSAGE_QUEUE = false;
	const MESSAGE_STORAGE_KEY = 'message_draft_';

	/**
	 * @type {{
	 *   agent: import('$agentTypes').AgentModel,
	 *   currentUser: import('$userTypes').UserModel
	 * }}
	 */
	let { agent, currentUser } = $props();

	const messageStorage = new LocalStorageManager();

	/** @type {string} */
	let text = $state('');
	let editText = $state('');
	let bigText = $state('');
	let botText = $state('');
	let truncateMsgId = $state('');
	let editingMsgId = $state('');
	let editingBotMsgUid = $state('');
	let highlightedMsgId = $state('');
	let indication = $state('');
	let mode = $state('');
	let notificationText = $state('');
	let successText = $state("Done");
	let errorText = $state("Error");
	let codeScript = $state('');
	let codeLanguage = $state('python');

	/** @type {number} */
	let messageInputTimeout;
	let sentMsgIdx = $state(0);

	/** @type {string[]} */
	let prevSentMsgs = $state([]);
	/** @type {string[]} */
	let chatUtilOptions = $state([]);
	/** @type {string[]} */
	let convTags = $state([]);
	let newTagText = $state('');


	/** @type {any[]} */
    let scrollbars = $state([]);

	/** @type {import('$conversationTypes').ConversationModel} */
    let conversation = $state(/** @type {any} */ (undefined));

	/** @type {import('$conversationTypes').EditBotMessageModel?} */
	let editBotMsg = $state(null);

	/** @type {import('$conversationTypes').ChatResponseModel?} */
	let lastBotMsg = $state(null);

	/** @type {import('$conversationTypes').ChatResponseModel?} */
	let lastMsg = $state(null);

    /** @type {import('$conversationTypes').ChatResponseModel[]} */
    let dialogs = $state([]);
	/** @type {{ [s: string]: any; }} */
	let groupedDialogs = $state([]);

	/** @type {import('$conversationTypes').ConversationContentLogModel[]} */
	let contentLogs = $state([]);

	/** @type {import('$conversationTypes').ConversationStateLogModel[]} */
	let convStateLogs = $state([]);

	// /** @type {import('$conversationTypes').ConversationStateLogModel?} */
	/** @type {Object?} */
	let latestStateLog = $state(null);

	/** @type {import('$conversationTypes').MessageStateLogModel[]} */
	let msgStateLogs = $state([]);

	/** @type {import('$conversationTypes').AgentQueueLogModel[]} */
	let agentQueueLogs = $state([]);

	/** @type {import('$conversationTypes').UserStateDetailModel[]} */
	let userAddStates = $state([]);

	/** @type {import('$userTypes').UserModel} */
    let conversationUser = $state(/** @type {any} */ (undefined));

	/** @type {number | undefined} */
	let notificationTimeout;

	/** @type {import('$conversationTypes').ChatResponseModel[]} */
	let messageQueue = $state([]);

	/** @type {boolean} */
	let isLoadPersistLog = $state(false);
	let isLoadInstantLog = $state(false);
	let isPersistLogClosed = $state(false); // initial condition
	let isInstantLogClosed = $state(false); // initial condition
	let isOpenEditMsgModal = $state(false);
	let isOpenBigMsgModal = $state(false);
	let isOpenUserAddStateModal = $state(false);
	let isOpenTagModal = $state(false);
	let isOpenCodeScriptModal = $state(false);
	let isOpenEndChatConfirm = $state(false);
	let isOpenClearStatesConfirm = $state(false);
	let isHeaderMenuOpen = $state(false);
	let isHeaderStatesOpen = $state(false);
	let isSendingMsg = $state(false);
	let isThinking = $state(false);
	let isListening = $state(false);
	let isLite = $state(false);
	let isFrame = $state(false);
	let autoScrollLog = $state(false);
	let loadChatUtils = $state(false);
	let disableSpeech = $state(false);
	let isLoading = $state(false);
	let isCreatingNewConv = $state(false);
	let isDisplayNotification = $state(false);
	let isComplete = $state(false);
	let isError = $state(false);
	/** @type {string | null} */
	let copiedMsgUid = $state(null);
	let isStreaming = $state(false);
	let isHandlingQueue = $state(false);
	let isStopStreamClicked = $state(false);

	let isWaiting = $derived(isSendingMsg || isThinking || isStreaming || messageQueue.length > 0);
	let loadEditor = true;
	let disableAction = $derived(!ADMIN_ROLES.includes(currentUser?.role || '')
								&& currentUser?.id !== conversationUser?.id
								|| !AgentExtensions.chatable(agent));

	$effect(() => {
		if (!isWaiting && !disableAction) {
			focusChatTextArea();
		}
	});

	setContext('chat-window-context', {
		autoScrollToBottom: autoScrollToBottom
	});

	onMount(async () => {
		disableSpeech = navigator.userAgent.includes('Firefox');
		// @ts-ignore
		conversation = await getConversation(page.params.conversationId, true);
		// @ts-ignore
		dialogs = await getDialogs(page.params.conversationId, dialogCount);
		conversationUser = conversation?.user;
		convTags = conversation?.tags || [];

		latestStateLog = conversation?.states;
		initUserSentMessages(dialogs);
		initChatView();
		handlePaneResize();
		const messageDraft = getMessageDraft();
		text = messageDraft || '';

		signalr.onMessageReceivedFromClient = onMessageReceivedFromClient;
		signalr.onMessageReceivedFromCsr = onMessageReceivedFromClient;
		signalr.onMessageReceivedFromAssistant = onMessageReceivedFromAssistant;
		signalr.onIntermediateMessageReceivedFromAssistant = onIntermediateMessageReceivedFromAssistant;

		signalr.beforeReceiveLlmStreamMessage = beforeReceiveLlmStreamMessage;
		signalr.onReceiveLlmStreamMessage = onReceiveLlmStreamMessage;
		signalr.afterReceiveLlmStreamMessage = afterReceiveLlmStreamMessage;
		signalr.onIndicationReceived = onIndicationReceived;

		signalr.onNotificationGenerated = onNotificationGenerated;
		signalr.onConversationContentLogGenerated = onConversationContentLogGenerated;
		signalr.onConversationStateLogGenerated = onConversationStateLogGenerated;
		signalr.onStateChangeGenerated = onStateChangeGenerated;
		signalr.onAgentQueueChanged = onAgentQueueChanged;
		signalr.onSenderActionGenerated = onSenderActionGenerated;
		signalr.onConversationMessageDeleted = onConversationMessageDeleted;
		// @ts-ignore
		await signalr.start(page.params.conversationId);

		scrollbars = [
			document.querySelector('.cb-msgs-scroll')
		].filter(Boolean);
		refresh();

		window.addEventListener('message', async (e) => {
			if (e.data.action === ChatAction.Logout) {
				handleLogoutAction();
			} else if (e.data.action === ChatAction.NewChat) {
				handleNewChatAction(e);
			} else if (e.data.action === ChatAction.Chat) {
				handleChatAction(e);
			}
		});
	});

	function handleLogoutAction() {
		resetStorage(true);
	}

	function focusChatTextArea() {
		return new Promise(resolve => {
			tick().then(() => {
				const textarea = document.getElementById('chat-textarea');
				if (textarea) {
					textarea.focus();
				}
				resolve('focused');
			});
		});
	}

	/** @param {any} e */
	function handleNewChatAction(e) {
		if (!isCreatingNewConv && !isThinking && !isSendingMsg) {
			isCreatingNewConv = true;
			createNewConversation().then(async conv => {
				isCreatingNewConv = false;
				if (conv && !!e.data.text) {
					dialogs = [];
					await signalr.stop();
					await signalr.start(conv.id);
					isLoading = true;
					openFrame();
					sendChatMessage(e.data.text, e.data.data || null, conv.id).then(() => {
						isLoading = false;
						redirectToNewConversation(conv);
					}).catch(() => {
						isLoading = false;
					});
				} else {
					openFrame();
				}
			}).catch(() => {
				isCreatingNewConv = false;
			});
		}
	}

	/** @param {any} e */
	function handleChatAction(e) {
		if (!!e.data.text && !isThinking && !isSendingMsg) {
			openFrame();
			sendChatMessage(e.data.text, e.data.data || null);
		}
	}

	function openFrame() {
		if (isFrame) {
			window.parent.postMessage({ action: ChatAction.Open }, "*");
		}
	}

	/** @param {import('$conversationTypes').ChatResponseModel} message */
	function sendReceivedNotification(message) {
		if (notificationTimeout) {
			clearTimeout(notificationTimeout);
		}

		notificationText = message?.rich_content?.message?.text || message.text || '';
		isDisplayNotification = true;
		notificationTimeout = setTimeout(() => {
			isDisplayNotification = false;
			notificationText = '';
		}, notificationText?.length > 200 ? 8000 : 3000);

		if (isFrame) {
			window.parent.postMessage({ action: ChatAction.ReceiveNotification, data: message }, "*");
		}
	}

	function resizeChatWindow() {
		isLite = Viewport.Width <= screenWidthThreshold;
		if (!isLite) {
			isLoadPersistLog = !isPersistLogClosed;
			isLoadInstantLog = !isInstantLogClosed;
		} else {
			isLoadPersistLog = false;
			isLoadInstantLog = false;
			isOpenEditMsgModal = false;
			isOpenUserAddStateModal = false;
			isOpenBigMsgModal = false;
			isOpenTagModal = false;
		}
	}

	function initChatView() {
		isFrame = window.self != window.top;
		mode = page.url.searchParams.get('mode') || '';
		// initial condition
		isPersistLogClosed = false;
		isInstantLogClosed = false;
		resizeChatWindow();
	}

	/** @param {import('$conversationTypes').ChatResponseModel[]} dialogs */
	function initUserSentMessages(dialogs) {
		const curConvMessages = dialogs?.filter(x => !BOT_SENDERS.includes(x.sender?.role || '')).map(x => {
			return {
				text: x.text || ''
			};
		}) || [];

		// @ts-ignore
		const trimmedMessages = trimUserSentMessages(curConvMessages || []);

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
		const allMessages = [...savedMessages?.messages || [], { text: msg || '' }];
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

	/** @param {import('$conversationTypes').ChatResponseModel[]} dialogs */
	function findLastBotMessage(dialogs) {
		const lastMsg = dialogs.slice(-1)[0];
		return BOT_SENDERS.includes(lastMsg?.sender?.role || '') ? lastMsg : null;
	}

	async function refreshDialogs() {
		// trigger UI render
		dialogs = dialogs?.map(item => { return { ...item, uuid: uuidv4() }; }) || [];
		await tick();
		groupedDialogs = groupDialogs(dialogs);
		return dialogs;
    }

	async function refresh() {
		// trigger UI render
		dialogs = await refreshDialogs();
		lastBotMsg = null;
		await tick();
		lastBotMsg = findLastBotMessage(dialogs);
		lastMsg = dialogs.slice(-1)[0];
		assignMessageDisclaimer(dialogs);
		groupedDialogs = groupDialogs(dialogs);
		await tick();

		autoScrollToBottom();
    }

	let _autoScrollScheduled = false;
	function autoScrollToBottom() {
		if (_autoScrollScheduled) return;
		_autoScrollScheduled = true;
		requestAnimationFrame(() => {
			scrollbars.forEach(scrollbar => {
				if (!scrollbar) return;
				setTimeout(() => {
					scrollbar.scrollTo({ top: scrollbar.scrollHeight, behavior: 'smooth' });
				}, 150);
			});
			_autoScrollScheduled = false;
		});
	}

	/** @param {import('$conversationTypes').ChatResponseModel[]} dialogs */
	function assignMessageDisclaimer(dialogs) {
		if (!dialogs) return null;

		for (let idx = 0; idx < dialogs.length; idx++) {
			const curMsg = dialogs[idx];
			// @ts-ignore
			if (!curMsg.rich_content?.message?.buttons?.some(op => !!op.post_action_disclaimer)) {
				continue;
			}

			const nextMsg = dialogs[idx + 1];
			if (nextMsg) {
				// @ts-ignore
				const disclaimerOptions = curMsg.rich_content?.message?.buttons?.filter(op => !!op.post_action_disclaimer) || [];
				const content = nextMsg?.rich_content?.message?.text || nextMsg?.text;
				// @ts-ignore
				const foundOption = disclaimerOptions.find(x => x.title === content);
				nextMsg.post_action_disclaimer = foundOption?.post_action_disclaimer;
			}
		}
	}

	/** @param {import('$conversationTypes').ChatResponseModel[]} dialogs */
	function groupDialogs(dialogs) {
		if (!dialogs) return [];
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
		return get(conversationUserAttachmentStore)?.accepted_files || [];
	}


	/** @param {import('$conversationTypes').ChatResponseModel} message */
	function onMessageReceivedFromClient(message) {
		autoScrollLog = true;
		dialogs.push({
			...message,
			is_chat_message: true
		});
		refresh();
		text = "";
    }

    /** @param {import('$conversationTypes').ChatResponseModel} message */
    function onMessageReceivedFromAssistant(message) {
		if (!message.is_streaming) {
			if (dialogs[dialogs.length - 1]?.message_id === message.message_id
				&& dialogs[dialogs.length - 1]?.sender?.role === UserRole.Assistant
				&& !dialogs[dialogs.length - 1]?.is_appended
			) {
				dialogs[dialogs.length - 1] = {
					...message,
					is_chat_message: true
				};
			} else {
				dialogs.push({
					...message,
					is_chat_message: true
				});
			}
		}

		isStreaming = false;
		latestStateLog = message.states;
		refresh();

		if (isFrame) {
			window.parent.postMessage(message, "*");
		}
    }

	/** @param {import('$conversationTypes').ChatResponseModel} message */
    function onIntermediateMessageReceivedFromAssistant(message) {
		const idx = dialogs.findLastIndex(x => x.is_dummy);
		if (idx >= 0) {
			dialogs.splice(idx, 0, {
				...message,
				is_chat_message: true,
				is_appended: true
			});
		} else {
			dialogs.push({
				...message,
				is_chat_message: true,
				is_appended: true
			});
		}

		refresh();

		if (isFrame) {
			window.parent.postMessage(message, "*");
		}
    }

	/** @param {import('$conversationTypes').ChatResponseModel} message */
	function beforeReceiveLlmStreamMessage(message) {
		isStreaming = true;
		if (dialogs[dialogs.length - 1]?.message_id !== message.message_id
			|| dialogs[dialogs.length - 1]?.sender?.role !== UserRole.Assistant
		) {
			dialogs.push({
				...message,
				is_chat_message: false,
				is_dummy: true,
				thought: {
					...(message.thought || {}),
					thinking_text: message.thought?.thinking_text || ''
				}
			});
		}
		refresh();
	}


	/** @param {import('$conversationTypes').ChatResponseModel} message */
	function onReceiveLlmStreamMessage(message) {
		isThinking = false;
		isStreaming = true;

		if (!USE_MESSAGE_QUEUE) {
			if (lastMsg?.sender?.role === UserRole.Assistant
				&& lastMsg?.is_dummy
			) {
				setTimeout(() => {
					const thinkingText = message.thought?.thinking_text || '';
					if (thinkingText) {
						if (!dialogs[dialogs.length - 1].thought) {
							dialogs[dialogs.length - 1].thought = { thinking_text: '' };
						}
						dialogs[dialogs.length - 1].thought.thinking_text += thinkingText;
					}
					dialogs[dialogs.length - 1].text += message.text;
					refreshDialogs();
					autoScrollToBottom();
				}, 0);
			}
		} else {
			messageQueue.push(message);
			setTimeout(() => handleMesssageQueue(), 0);
		}
	}

	async function handleMesssageQueue() {
		if (isHandlingQueue) return;

		isHandlingQueue = true;
		while (messageQueue.length > 0) {
			const item = messageQueue.shift();
			messageQueue = [...messageQueue];
			if (!item) {
				continue;
			}

			const lastMsg = dialogs[dialogs.length - 1];
			if (lastMsg?.sender?.role !== UserRole.Assistant
				|| !lastMsg?.is_dummy
			) {
				continue;
			}

			try {
				const thinkingText = item.thought?.thinking_text || '';
				if (thinkingText) {
					if (!dialogs[dialogs.length - 1].thought) {
						dialogs[dialogs.length - 1].thought = { thinking_text: '' };
					}
					for (const tt of thinkingText) {
						dialogs[dialogs.length - 1].thought.thinking_text += tt;
						refreshDialogs();
						autoScrollToBottom();
						await delay(10);
					}
				}

				for (const char of item.text) {
					dialogs[dialogs.length - 1].text += char;
					refreshDialogs();
					autoScrollToBottom();
					await delay(10);
				}
			} catch (err) {
				console.log(`Error when processing message queue`, err);
			}
		}
		isHandlingQueue = false;
	}

	/** @param {import('$conversationTypes').ChatResponseModel} message */
	function afterReceiveLlmStreamMessage(message) {
		isStreaming = false;
		refresh();
	}

	function stopStreaming() {
		isStopStreamClicked = true;
		// @ts-ignore
		stopStreamingApi(page.params.conversationId).then((res) => {
			if (res?.success) {
				isStreaming = false;
				isThinking = false;
				isSendingMsg = false;
				messageQueue = [];
				isHandlingQueue = false;
				refresh();
			}
			isStopStreamClicked = false;
		});
	}

	/** @param {import('$conversationTypes').ChatResponseModel} message */
	function onIndicationReceived(message) {
		isThinking = true;
		const retIndication = message.indication || '';
		indication = retIndication.split('|')[0];
	}

	/** @param {import('$conversationTypes').ChatResponseModel} message */
	function onNotificationGenerated(message) {
		sendReceivedNotification(message);
	}

	/** @param {import('$conversationTypes').ConversationContentLogModel} log */
	function onConversationContentLogGenerated(log) {
		if (!isLoadPersistLog) return;

		contentLogs.push({ ...log, uid: uuidv4() });
		contentLogs = contentLogs.map(x => { return { ...x }; });
	}

	/** @param {import('$conversationTypes').ConversationStateLogModel} log */
	function onConversationStateLogGenerated(log) {
		if (!isLoadPersistLog) return;

		convStateLogs.push({ ...log, uid: uuidv4() });
		convStateLogs = convStateLogs.map(x => { return { ...x }; });
	}

	/** @param {import('$conversationTypes').MessageStateLogModel} log */
	function onStateChangeGenerated(log) {
		if (!isLoadInstantLog || log == null) return;

		msgStateLogs.push({ ...log });
		msgStateLogs = msgStateLogs.map(x => { return { ...x, uid: uuidv4() }; });
	}

	/** @param {import('$conversationTypes').AgentQueueLogModel} log */
	function onAgentQueueChanged(log) {
		if (!isLoadInstantLog || log == null) return;

		agentQueueLogs.push({ ...log });
		agentQueueLogs = agentQueueLogs.map(x => { return { ...x, uid: uuidv4() }; });
	}

	/** @param {import('$conversationTypes').ConversationSenderActionModel} data */
	function onSenderActionGenerated(data) {
		if (data?.sender_action == SenderAction.TypingOn) {
			isThinking = true;
		} else if (data?.sender_action == SenderAction.TypingOff) {
			isThinking = false;
			indication = '';
		}
	}

	/** @param {import('$conversationTypes').ConversationMessageDeleteModel} data */
	function onConversationMessageDeleted(data) {
		if (!data?.message_id) return;

		truncateDialogs(data.message_id);
	}

	async function handleNewConversation() {
		const conv = await createNewConversation();
		redirectToNewConversation(conv);
	}

	async function createNewConversation() {
		// @ts-ignore
		const conversation = await newConversation(page.params.agentId);
        conversationStore.put(conversation);
		return conversation;
	}

	/** @param {import('$conversationTypes').ConversationModel} conversation */
	function redirectToNewConversation(conversation) {
		const path = `chat/${page.params.agentId}/${conversation.id}`;
		const searchParams = page.url.searchParams;
		const search = searchParams?.toString();
		const url = search ? `${path}?${search}` : path;
		window.location.href = url;
	}

	function handleSaveKnowledge() {
		sendChatMessage("Save knowledge");
	}

    /**
	 * @param {string} msgText
	 * @param {import('$conversationTypes').MessageData?} data
	 * @param {string?} conversationId
	 */
    async function sendChatMessage(msgText, data = null, conversationId = null) {
		isSendingMsg = true;
		clearInstantLogs();
		renewUserSentMessages(msgText);
		const agentId = page.params.agentId;
		const convId = conversationId || page.params.conversationId;

		let postback = data?.postback;
		// if (!postback) {
		// 	postback = buildPostbackMessage(dialogs, data?.payload || msgText, data?.truncateMsgId);
		// }

		/** @type {import('$conversationTypes').MessageData?} */
		let messageData = {
			...data,
			postback: postback,
			states: [
				...data?.states || []
			]
		};

		/** @type {any[]} */
		let files = [];
		if (!messageData?.inputMessageId) {
			files = getChatFiles();
		}
		resetChatStorage();

		if (files?.length > 0 && !messageData.inputMessageId) {
			const filePayload = buildFilePayload(files);
			// @ts-ignore
			const obj = await uploadConversationFiles(agentId, convId, files);
			messageData = { ...messageData, inputMessageId: obj?.messageId };
			if (filePayload) {
				messageData = {
					...messageData,
					// @ts-ignore
					postback: {
						...postback,
						payload: `${postback?.payload || msgText || ''}\r\n${filePayload}`
					}
				};
			}
		} else if (messageData?.inputMessageId) {
			// @ts-ignore
			const retFiles = await getConversationFiles(convId, messageData.inputMessageId, FileSourceType.User);
			const filePayload = buildFilePayload(retFiles);
			if (filePayload) {
				messageData = {
					...messageData,
					// @ts-ignore
					postback: {
						...postback,
						payload: `${postback?.payload || msgText || ''}\r\n${filePayload}`
					}
				};
			}
		}

		// @ts-ignore
		await sendMessageToHub(agentId, convId, msgText, messageData, PUBLIC_LIVECHAT_STREAM_ENABLED === "true");
		deleteMessageDraft();
		isSendingMsg = false;
    }

    function startListen() {
		if (disableSpeech) return;

		isListening = !isListening;
		if (conversation?.is_realtime_enabled) {

			if (isListening) {
				// @ts-ignore
				realtimeChat.start(page.params.agentId, page.params.conversationId);
			} else {
				realtimeChat.stop();
			}
		} else {
			webSpeech.onSpeechToTextDetected = (transcript) => {
				if (!_.trim(transcript) || isSendingMsg) {
					return;
				}

				sendChatMessage(transcript);
			};
			webSpeech.onRecognitionStarted = () => {
				isListening = true;
			};
			webSpeech.onRecognitionEnded = () => {
				isListening = false;
			};

			if (isListening) {
				webSpeech.start({ continuous: true });
			} else {
				webSpeech.abort();
			}

		}
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

		if ((e.key === 'Enter' && (!!e.shiftKey || !!e.ctrlKey)) || e.key !== 'Enter' || !_.trim(text) || isWaiting) {
			return;
		}

		if (e.key === 'Enter') {
			e.preventDefault();
		}

		await sentTextMessage();
	}

	/** @param {any} e */
    function handleMessageInput(e) {
        const value = e.target.value;
				saveMessageDraft(value);
        if (!_.trim(value)) {
            return;
        }

        clearTimeout(messageInputTimeout);
        chatUtilOptions = [];
        if (lastBotMsg?.rich_content?.editor === EditorType.Address) {
            messageInputTimeout = setTimeout(() => {
                // @ts-ignore
                getAddressOptions(value).then(res => {
                    // @ts-ignore
                    const data = res?.results?.map(x => x.formatted_address) || [];
                    chatUtilOptions = data.filter(Boolean).slice(0, 5);
                }).catch(() => {
                    chatUtilOptions = [];
                });
            }, 500);
        }
    }

	/** @param {string} option */
	function handleChatOptionClick(option) {
		chatUtilOptions = [];
		text = option;
	}

	/**
	 * @param {string} title
	 * @param {string} payload
	 */
	async function confirmSelectedOption(title, payload) {
		if (isWaiting) return;

		const postback = buildPostbackMessage(dialogs, payload || title, null);;
		await sendChatMessage(title, { postback: postback });
	}

	async function sentTextMessage() {
		const sentMsg = text;
		text = '';
		await sendChatMessage(sentMsg);
	}

	/**
	 * @param {import('$conversationTypes').ChatResponseModel[]} dialogs
	 * @param {string?} content
	 * @param {string?} [truncateMsgId]
	 */
	 function buildPostbackMessage(dialogs, content, truncateMsgId) {
		/** @type {import('$conversationTypes').Postback?} */
		let postback = null;
		let lastMsg = dialogs.slice(-1)[0];

		if (truncateMsgId) {
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


	/**
	 * @param {string?} messageId
	 */
	function buildPostback(messageId) {
		let postback = null;
		if (!messageId) return postback;

		const found = dialogs.find(x => x.message_id === messageId && !BOT_SENDERS.includes(x.sender?.role || ''));
		const content = found?.payload;
		if (content) {
			postback = buildPostbackMessage(dialogs, content, messageId);
		}
		return postback;
	}

	/**
	 * @param {any[]} files
	 */
	function buildFilePayload(files) {
		if (!files || files.length === 0) return '';

		const excelCount = files.filter(x => isExcel(x.file_extension || x.file_name)).length;
		const pdfCount = files.filter(x => isPdf(x.file_extension || x.file_name)).length;
		const audioCount = files.filter(x => isAudio(x.file_extension || x.file_name)).length;
		const imageCount = files.length - excelCount - pdfCount - audioCount;

		let prefix = 'I uploaded ';
		let fileStrs = [];

		if (imageCount > 0) {
			fileStrs.push(`${imageCount} image ${imageCount > 1 ? 'files' : 'file'}`);
		}
		if (pdfCount > 0) {
			fileStrs.push(`${pdfCount} pdf ${pdfCount > 1 ? 'files' : 'file'}`);
		}
		if (excelCount > 0) {
			fileStrs.push(`${excelCount} excel ${excelCount > 1 ? 'files' : 'file'}`);
		}
		if (audioCount > 0) {
			fileStrs.push(`${audioCount} audio ${audioCount > 1 ? 'files' : 'file'}`);
		}
		return prefix + fileStrs.join(' and ') + '.';
	}

	function endChat() {
		if (!isFrame) {
			isOpenEndChatConfirm = true;
		} else {
			window.parent.postMessage({ action: ChatAction.Close }, "*");
		}
	}

	function confirmEndChat() {
		isOpenEndChatConfirm = false;
		window.close();
	}

	function openLogs() {
		if (!isLoadPersistLog) {
			isLoadPersistLog = true;
			isPersistLogClosed = false;
		}

		if (!isLoadInstantLog) {
			isLoadInstantLog = true;
			isInstantLogClosed = false;
		}
	}

	function closePersistLog() {
		isLoadPersistLog = false;
		contentLogs = [];
		convStateLogs = [];
		isPersistLogClosed = true;
    }

	function cleanPersistLogScreen() {
		contentLogs = [];
		convStateLogs = [];
	}

	function closeInstantLog() {
		isLoadInstantLog = false;
		msgStateLogs = [];
		agentQueueLogs = [];
		isInstantLogClosed = true;
	}

	function toggleUserAddStateModal() {
		isOpenUserAddStateModal = !isOpenUserAddStateModal;
		if (isOpenUserAddStateModal) {
			isHeaderStatesOpen = false;
			isHeaderMenuOpen = false;
			loadUserAddStates();
		}
	}

	function loadUserAddStates() {
		const conversationUserStates = conversationUserStateStore.get(page.params.conversationId);
		if (!!conversationUserStates && conversationUserStates.conversationId == page.params.conversationId && !!conversationUserStates.states) {
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
            conversationId: page.params.conversationId,
            states: cleanStates
        });
		toggleUserAddStateModal();
	}

	function clearUserAddStates() {
		isOpenClearStatesConfirm = true;
	}

	function confirmClearUserAddStates() {
		isOpenClearStatesConfirm = false;
		userAddStates = [];
		conversationUserStateStore.resetOne(page.params.conversationId);
		isOpenUserAddStateModal = false;
	}

	/**
	 * @param {any} e
	 * @param {string} messageId
	 */
	function deleteMessage(e, messageId) {
		if (isWaiting || disableAction) return;
		handleDeleteMessage(messageId);
	}

	/** @param {string} messageId */
	async function handleDeleteMessage(messageId) {
		isSendingMsg = true;
		clearInstantLogs();
		resetChatStorage();
		await deleteConversationMessage(page.params.conversationId, messageId);
		isSendingMsg = false;
	}

	/**
	 * @param {import('$conversationTypes').ChatResponseModel} message
	 */
	async function editMessage(message) {
		if (isWaiting || disableAction) return;
		truncateMsgId = message?.message_id;
		editText = message?.text || '';
		await tick();
		editingMsgId = message?.message_id;
	}

	function cancelEditMessage() {
		resetEditMsg();
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
		editingMsgId = "";
	}

	async function confirmEditMsg() {
		isOpenEditMsgModal = false;
		editingMsgId = "";
		const postback = buildPostback(truncateMsgId);
		// @ts-ignore
		deleteConversationMessage(page.params.conversationId, truncateMsgId, true).then(res => {
			sendChatMessage(editText, { postback: postback, inputMessageId: res?.messageId }).then(() => {
				resetEditMsg();
			}).catch(() => {
				resetEditMsg();
			});
		});
	}

	/** @param {import('$conversationTypes').ChatResponseModel} message */
	async function resendMessage(message) {
		if (isWaiting || disableAction) return;
		const msgId = message?.message_id;
		const msgText = message?.text || '';
		if (!msgId || !msgText) return;

		const postback = buildPostback(msgId);
		// @ts-ignore
		deleteConversationMessage(page.params.conversationId, msgId, true).then(res => {
			sendChatMessage(msgText, { postback: postback, inputMessageId: res?.messageId });
		});
	}

	/** @param {string} messageId */
	async function truncateDialogs(messageId) {
		const foundIdx = dialogs.findIndex(x => x.message_id === messageId);
		if (foundIdx < 0) return false;
		dialogs = dialogs.filter((x, idx) => idx < foundIdx);
		truncateLogs(messageId);
		refresh();
		return true;
	}

	/** @param {string} messageId */
	function truncateLogs(messageId) {
		if (isLoadPersistLog) {
			let targetIdx = contentLogs.findIndex(x => x.message_id === messageId);
			contentLogs = contentLogs.filter((x, idx) => idx < targetIdx);

			targetIdx = convStateLogs.findIndex(x => x.message_id === messageId);
			convStateLogs = convStateLogs.filter((x, idx) => idx < targetIdx);
		}
	}

	/** @param {string} messageId */
	function directToLog(messageId) {
		if (!messageId || isLite || !isLoadPersistLog) return;

		highlightedMsgId = messageId;
		highlightStateLog(messageId);
		autoScrollToTargetLog(messageId);
	}

	/** @param {string} messageId */
	function highlightStateLog(messageId) {
		if (!isLoadInstantLog) return;

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
		if (isLoadPersistLog && !!contentLogElm) {
			elements.push({
				elm: contentLogElm,
				wrapperName: contentLogWrapper
			});
		}

		const stateLogElm = document.querySelector(`#state-log-${messageId}`);
		if (isLoadPersistLog && !!stateLogElm) {
			elements.push({
				elm: stateLogElm,
				wrapperName: stateLogWrapper
			});
		}

		elements.forEach(item => {
			const scrollElement = document.querySelector(item.wrapperName);
			if (!!scrollElement && !!item.elm) {
				// @ts-ignore
				const logScroll = OverlayScrollbars(scrollElement, options);
				const { viewport } = logScroll.elements();
				// @ts-ignore
				const offsetTop = item.elm.offsetTop;
				viewport.scrollTo({ top: offsetTop, behavior: 'smooth' });
			}
		});
	}

	function openFullScreen() {
		window.open(page.url.pathname);
	}

	function clearInstantLogs() {
		msgStateLogs = [];
		agentQueueLogs = [];
		latestStateLog = null;
	}

	function resetChatStorage() {
		conversationUserAttachmentStore.reset();
	}

	function toggleBigMessageModal() {
		isOpenBigMsgModal = !isOpenBigMsgModal;
		if (!isOpenBigMsgModal) {
			bigText = '';
		} else {
			bigText = text;
		}
	}

	function sendBigMessage() {
		isOpenBigMsgModal = !isOpenBigMsgModal;
		const text = bigText;
		bigText = '';
		sendChatMessage(text);
	}

	/**
	 * @param {any} e
	 * @param {any} message
	 */
	function likeMessage(e, message) {
		e.preventDefault();
		const text = 'I like this message.';
		const data = {
			postback: {
				functionName: 'like_response',
				payload: message.text || 'I really like this message!',
				parentId: message?.message_id
			},
			states: []
		};
		sendChatMessage(text, data);
	}

	/**
	 * @param {any} e
	 * @param {any} message
	 */
	function copyMessage(e, message) {
		e.preventDefault();

		let text = message?.rich_content?.message?.text || message?.text || '';
		if (message?.rich_content?.message?.rich_type === RichType.ProgramCode) {
			text = message?.rich_content?.message?.code_script || text;
		}

		const uid = message.uuid;
		copiedMsgUid = uid;
		navigator.clipboard.writeText(text).then(() => {
			setTimeout(() => {
				if (copiedMsgUid === uid) {
					copiedMsgUid = null;
				}
			}, 800);
		});
	}

	/**
	 * @param {any} e
	 * @param {any} message
	 */
	function openCodeScriptModal(e, message) {
		e.preventDefault();

		codeScript = message?.rich_content?.message?.code_script || '';
		codeLanguage = message?.rich_content?.message?.language || 'python';
		isOpenCodeScriptModal = true;
	}

	function toggleCodeScriptModal() {
		isOpenCodeScriptModal = !isOpenCodeScriptModal;
		if (!isOpenCodeScriptModal) {
			codeScript = '';
			codeLanguage = '';
		}
	}

	function toggleNotificationModal() {
		isDisplayNotification = !isDisplayNotification;
		if (!isDisplayNotification) {
			notificationText = '';
		}
	}


	/** @param {import('$conversationTypes').ChatResponseModel} message */
	async function openBotMsgEditor(message) {
		if (isWaiting || disableAction) return;
		let source = "text";
		if (message.rich_content?.message?.text === message.text) {
			source = "both";
		} else if (message.rich_content?.message?.text) {
			source = "rich-content-text";
		}
		editBotMsg = {
			message: message,
			source: source
		};
		botText = message?.rich_content?.message?.text || message?.text;
		await tick();
		editingBotMsgUid = message?.uuid || '';
	}

	function cancelBotMsgEdit() {
		editingBotMsgUid = '';
		editBotMsg = null;
		botText = '';
	}

	function toggleTagModal() {
		isOpenTagModal = !isOpenTagModal;
		if (!isOpenTagModal) {
			newTagText = '';
			convTags = conversation?.tags || [];
		}
	}

	/** @param {number | string} idx */
	function removeTag(idx) {
		const tag = convTags?.[/** @type {number} */ (idx)];
		if (!tag) return;
		convTags = convTags.filter(t => t !== tag);
	}

	function addTag() {
		const tag = _.trim(newTagText);
		if (!tag || convTags.includes(tag)) {
			return;
		}
		convTags = [...convTags, tag];
		newTagText = '';
	}

	function updateChatTags() {
		const originalTags = conversation?.tags || [];
		const toAddTags = convTags.filter(t => !originalTags.includes(t));
		const toDeleteTags = originalTags.filter((/** @type {string} */ t) => !convTags.includes(t));

		if (toAddTags.length === 0 && toDeleteTags.length === 0) {
			isOpenTagModal = false;
			return;
		}

		isLoading = true;
		updateConversationTags(
			// @ts-ignore
			page.params.conversationId,
			{ toAddTags, toDeleteTags })
		.then(res => {
			if (res) {
				conversation.tags = [...convTags];
				isComplete = true;
				successText = "Tags have been updated!";
				setTimeout(() => {
					isComplete = false;
					successText = "";
				}, duration);
			} else {
				throw "Failed to update tags.";
			}
		}).catch(() => {
			convTags = conversation?.tags || [];
			isError = true;
			errorText = "Failed to update tags!";
			setTimeout(() => {
				isError = false;
				errorText = "";
			}, duration);
		}).finally(() => {
			isOpenTagModal = false;
			isLoading = false;
		});
	}

	function saveBotMsg() {
		if (!editBotMsg) return;

		const found = dialogs.find(x => x.uuid === editBotMsg?.message.uuid);
		if (!found) return;

		const candidates = dialogs.filter(x => x.message_id === editBotMsg?.message.message_id && x.sender?.role === editBotMsg?.message.sender?.role);
		const innerIdx = candidates.findIndex(x => x.uuid === editBotMsg?.message.uuid);

		/** @type {import('$conversationTypes').UpdateBotMessageRequest} */
		const request = {
			message: editBotMsg.message,
			innerIndex: innerIdx
		};

		if (editBotMsg.source === "both") {
			found.text = botText;
			found.rich_content.message.text = botText;
			editBotMsg.message.text = botText;
			editBotMsg.message.rich_content.message.text = botText;
		} else if (editBotMsg?.source === "rich-content-text") {
			found.rich_content.message.text = botText;
			editBotMsg.message.rich_content.message.text = botText;
		} else {
			found.text = botText;
			editBotMsg.message.text = botText;
		}

		isLoading = true;
		// @ts-ignore
		updateConversationMessage(page.params.conversationId, request).then(res => {
			if (res) {
				isComplete = true;
				successText = "Message has been updated!";
				setTimeout(() => {
					isComplete = false;
					successText = "";
				}, duration);

				cancelBotMsgEdit();
				refresh();
			} else {
				throw "failed to update message";
			}
		}).catch(() => {
			isError = true;
			errorText = "Failed to update message!";
			setTimeout(() => {
				isError = false;
				errorText = "";
			}, duration);
			cancelBotMsgEdit();
		}).finally(() => {
			isLoading = false;
		});
	}

  	/** @param {any} e */
	function handleInputBigText(e) {
		saveMessageDraft(e.target.value);
	}

	function getMessageDraft() {
		return messageStorage.get(MESSAGE_STORAGE_KEY + page.params.conversationId);
  	}

	/** @param {any} message */
	function saveMessageDraft(message) {
		messageStorage.set(MESSAGE_STORAGE_KEY + page.params.conversationId, message, 24 * 60 * 60 * 1000);
	}

	function deleteMessageDraft() {
		messageStorage.remove(MESSAGE_STORAGE_KEY + page.params.conversationId);
	}

	function handlePaneResize() {
		const header = document.querySelector('.chat-head');
		if (!header) return;

		const width = header.getBoundingClientRect().width;
		isLite = width < chatWidthThreshold;
	}

	function toggleHeaderMenu() {
		isHeaderMenuOpen = !isHeaderMenuOpen;
		isHeaderStatesOpen = false;
	}
</script>


<ConfirmModal
	isOpen={isOpenEndChatConfirm}
	icon="warning"
	title="Are you sure?"
	text="You will exit this conversation."
	confirmBtnText="Yes"
	cancelBtnText="No"
	confirm={confirmEndChat}
	cancel={() => isOpenEndChatConfirm = false}
	toggleModal={() => isOpenEndChatConfirm = false}
/>

<ConfirmModal
	isOpen={isOpenClearStatesConfirm}
	icon="warning"
	title="Are you sure?"
	text="You won't be able to revert this!"
	confirmBtnText="Yes, delete it!"
	cancelBtnText="No"
	confirmBtnColor="danger"
	confirm={confirmClearUserAddStates}
	cancel={() => isOpenClearStatesConfirm = false}
	toggleModal={() => isOpenClearStatesConfirm = false}
/>


<svelte:window onresize={() => resizeChatWindow()}/>

<GlobalHeader
	bind:isLoading={isLoading}
	bind:hasError={isError}
/>

<LoadingToComplete
	spinnerStyles={'position: fixed;'}
	spinnerSize={35}
	isLoading={isLoading}
	isComplete={isComplete}
	isError={isError}
	successText={successText}
	errorText={errorText}
/>

<DialogModal
	title={'Tags'}
	size={'xl'}
	isOpen={isOpenTagModal}
	closeable
	toggleModal={() => toggleTagModal()}
	confirmBtnText={'Confirm'}
	cancelBtnText={''}
	confirm={() => updateChatTags()}
	close={() => toggleTagModal()}
>
	<div class="cb-tags-container">
		{#each convTags as tag, idx}
			<Label
				text={tag}
				index={idx}
				color="info"
				ellipsis
				onClose={removeTag}
			/>
		{/each}
	</div>
	<div class="cb-tag-add">
		<input
			class="cb-tag-input"
			type="text"
			placeholder="Enter new tag..."
			maxlength={50}
			bind:value={newTagText}
			onkeydown={e => { if (e.key === 'Enter') addTag(); }}
		/>
		<button
			class="cb-tag-add-btn"
			aria-label="Add tag"
			disabled={!_.trim(newTagText)}
			onclick={() => addTag()}
		>
			<i class="bx bx-plus"></i>
		</button>
	</div>
</DialogModal>

<DialogModal
	title={'Notification'}
	size={'md'}
	isOpen={isDisplayNotification}
	closeable
	toggleModal={() => toggleNotificationModal()}
	confirmBtnText={''}
	cancelBtnText={''}
	close={() => toggleNotificationModal()}
>
	{#snippet titleIcon()}
		<div class="cb-title-icon cb-text-warning">
			<i class="mdi mdi-bell-ring"></i>
		</div>
	{/snippet}
	<div class="cb-notification">
		{notificationText}
	</div>
</DialogModal>


<DialogModal
	title={'Edit user message'}
	size={'xl'}
	isOpen={isOpenEditMsgModal}
	toggleModal={() => toggleEditMsgModal()}
	confirm={() => confirmEditMsg()}
	cancel={() => toggleEditMsgModal()}
	disableConfirmBtn={!_.trim(editText)}
>
	<textarea
		class="cb-modal-textarea"
		rows="5"
		maxlength={maxTextLength}
		bind:value={editText}
		placeholder="Enter Message..."
	></textarea>
	<div class="cb-modal-counter">
		<div>{`${(editText?.length || 0)}/${maxTextLength}`}</div>
	</div>
</DialogModal>

<DialogModal
	title={'Send message'}
	size={'5xl'}
	isOpen={isOpenBigMsgModal}
	toggleModal={() => toggleBigMessageModal()}
	confirm={() => sendBigMessage()}
	cancel={() => toggleBigMessageModal()}
	disableConfirmBtn={!_.trim(bigText)}
>
	<textarea
		class="cb-modal-textarea"
		rows="25"
		maxlength={maxTextLength}
		bind:value={bigText}
		placeholder="Enter Message..."
		oninput={handleInputBigText}
	></textarea>
	<div class="cb-modal-counter">
		<div>{`${formatNumber(bigText?.length || 0)}/${formatNumber(maxTextLength)}`}</div>
	</div>
</DialogModal>

<PlainModal
	title={'Code script'}
	size={'3xl'}
	isOpen={isOpenCodeScriptModal}
	toggleModal={() => toggleCodeScriptModal()}
>
	<CodeScript
		language={codeLanguage || 'python'}
		scriptText={codeScript}
		editable={false}
	/>
</PlainModal>


<HeadTitle title="Chat" addOn='' />
<div class="cb-page-flex">
	<Splitpanes on:resize={() => handlePaneResize()}>
		{#if isLoadInstantLog}
		<Pane size={25} minSize={15} maxSize={40} >
			<InstantLog
				bind:msgStateLogs={msgStateLogs}
				bind:agentQueueLogs={agentQueueLogs}
				latestStateLog={latestStateLog}
				agent={agent}
				closeWindow={() => closeInstantLog()}
			/>
		</Pane>
		{/if}
		<Pane minSize={30}>
			<div style="height: 100vh;">
				<div class="cb-panel-card" style="height: 100vh;">
					<div class="cb-head">
						<div class="cb-head-row">
							<div class="cb-head-left">
								<div class="cb-head-agent">
									{#if agent?.icon_url}
									<div class="cb-vcenter">
										<img class="cb-head-agent-icon" src={agent.icon_url} alt="">
									</div>
									{/if}
									<div class="cb-head-agent-name cb-vcenter cb-ellipsis">{agent?.name || 'Unkown'}</div>
								</div>
								<div class="cb-head-user">
									<div>
										<i class="mdi mdi-circle cb-text-success cb-align-middle"></i>
									</div>
									<div class="cb-ellipsis">
										<span>
											{conversationUser?.full_name || conversationUser?.user_name
											|| currentUser?.full_name || currentUser?.user_name || ''}</span>
									</div>
								</div>
							</div>

							<div class="cb-head-right">
								<div class="cb-head-actions" style={`padding-top: ${!isFrame ? '5px' : '0px'};`}>
									{#if PUBLIC_DEBUG_MODE === 'true' && isFrame}
										<div>
											<button
												class="cb-icon-btn cb-icon-btn-secondary"
												aria-label="Open full screen"
												onclick={() => openFullScreen()}
											>
												<i class="bx bx-fullscreen"></i>
											</button>
										</div>
									{/if}
									<div>
										{#if !isLite}
										<div
											class="cb-dropdown"
											use:clickoutsideDirective
											onclickoutside={(/** @type {any} */ e) => {
												if (!e.detail.currentNode?.contains(e.detail.targetNode)) {
													isHeaderMenuOpen = false;
													isHeaderStatesOpen = false;
												}
											}}
										>
											<button class="cb-nav-btn" type="button" aria-expanded={isHeaderMenuOpen} aria-label="Open dots" onclick={() => toggleHeaderMenu()}>
												<i class="bx bx-dots-horizontal-rounded"></i>
											</button>
											<ul class="cb-menu cb-menu-end" class:show={isHeaderMenuOpen} style="right: 0; left: auto;">
												{#if !isLoadPersistLog || !isLoadInstantLog}
													<li><button class="cb-menu-item" type="button" onclick={() => openLogs()}>View Log</button></li>
												{/if}
												<li class="cb-state-menu">
													<button class="cb-menu-item cb-menu-item-toggle" type="button" aria-expanded={isHeaderStatesOpen} onclick={() => isHeaderStatesOpen = !isHeaderStatesOpen}>
														States
													</button>
													<ul class="cb-menu" class:show={isHeaderStatesOpen} style="left: -160px !important;">
														{#if !isOpenUserAddStateModal}
														<li>
															<button
																class="cb-menu-item"
																type="button"
																disabled={disableAction}
																onclick={() => toggleUserAddStateModal()}
															>
																Add States
															</button>
														</li>
														{/if}
														<li>
															<button
																class="cb-menu-item"
																type="button"
																disabled={disableAction}
																onclick={() => clearUserAddStates()}
															>
																Clear States
															</button>
														</li>
													</ul>
												</li>

												{#if ADMIN_ROLES.includes(currentUser?.role || '')}
													<li>
														<button
															class="cb-menu-item"
															type="button"
															disabled={disableAction}
															onclick={() => toggleTagModal()}
														>
															Tags
														</button>
													</li>
												{/if}
												{#if agent?.id === LEARNER_AGENT_ID && mode === TRAINING_MODE}
													<li><button class="cb-menu-item" type="button" onclick={() => handleSaveKnowledge()}>Save Knowledge</button></li>
												{/if}
											</ul>
										</div>
										{:else}
										<button
											class={`cb-icon-btn cb-icon-btn-primary cb-icon-btn-lg`}
											aria-label="Open new conversation"
											disabled={disableAction}
											onclick={() => handleNewConversation()}
										>
											<i
												class="mdi mdi-plus cb-icon-lg"
												data-bs-toggle="tooltip"
												data-bs-placement="top"
												title="New Conversation"></i>
										</button>
										{/if}
									</div>

									<div class="cb-btn-pair">
										{#if !isLite}
										<button
											class={`cb-pill-btn cb-pill-btn-primary cb-pill-btn-left`}
											disabled={disableAction}
											onclick={() => handleNewConversation()}
										>
											<span
												data-bs-toggle="tooltip"
												data-bs-placement="bottom"
												title="New Conversation"
											>
												<i class="mdi mdi-plus"></i>
												<span class="cb-pill-btn-label">New</span>
											</span>
										</button>
										{/if}
										<button
											class={`cb-pill-btn cb-pill-btn-danger ${!isLite ? 'cb-pill-btn-right' : ''}`}
											disabled={disableAction}
											onclick={() => endChat()}
										>
											{#if !isLite}
											<span class="cb-pill-btn-label">End</span>
											{/if}
											<i class="mdi mdi-window-close"></i>
										</button>
									</div>
								</div>
							</div>
						</div>
					</div>

				<StateModal
					isOpen={isOpenUserAddStateModal}
					inline
					bind:states={userAddStates}
					requireActiveRounds
					toggleModal={() => toggleUserAddStateModal()}
					confirm={() => handleConfirmUserAddStates()}
					cancel={() => toggleUserAddStateModal()}
				/>

				<div class={`cb-msgs-scroll cb-msgs-content cb-msgs-scroll-rev ${!loadEditor ? 'cb-msgs-content-expand' : ''}`}>
						<div class="cb-conv">
							<ul class="cb-conv-list">
								{#each Object.entries(groupedDialogs) as [createDate, dialogGroup]}
									<li>
										<div class="cb-day-title">
											<span class="cb-day-title-text">{createDate}</span>
										</div>
									</li>
									{#each dialogGroup as message}
										<li id={'test_k' + message.message_id} class:cb-conv-right={!BOT_SENDERS.includes(message.sender?.role)}>
											<div class="cb-msg-row">
												{#if !BOT_SENDERS.includes(message.sender?.role)}
												<div class="cb-msg-stack" class:cb-msg-stack-editing={editingMsgId === message.message_id}>
													{#if editingMsgId === message.message_id}
														<div class="cb-msg-edit-wrap">
															<div class="cb-msg-edit-box">
																<textarea
																	class="cb-msg-edit-textarea"
																	maxlength={maxTextLength}
																	placeholder="Edit message..."
																	bind:value={editText}
																></textarea>
															</div>
															<div class="cb-msg-edit-actions">
																<button
																	type="button"
																	class="cb-msg-edit-btn cb-msg-edit-btn-cancel"
																	onclick={() => cancelEditMessage()}
																>
																	Cancel
																</button>
																<button
																	type="button"
																	class="cb-msg-edit-btn cb-msg-edit-btn-send"
																	disabled={!_.trim(editText)}
																	onclick={() => confirmEditMsg()}
																>
																	Send
																</button>
															</div>
														</div>
													{:else}
														<div
															class="cb-user-msg-link"
															tabindex="0"
															aria-label="user-msg-to-log"
															role="link"
															onkeydown={() => {}}
															onclick={() => directToLog(message.message_id)}
														>
															<div
																class="cb-bubble cb-bubble-user"
																class:cb-clickable={!isLite && isLoadPersistLog}
																class:cb-bubble-user-danger={highlightedMsgId === message.message_id}
																class:cb-bubble-bounce={highlightedMsgId === message.message_id}
																id={`user-msg-${message.message_id}`}
															>
																<div class="cb-bubble-text-user font-libre">{@html replaceNewLine(message.text)}</div>
															</div>
														</div>
														{#if !disableAction}
															<div class="cb-msg-actions cb-msg-actions-user">
																<div class="cb-vcenter cb-msg-action">
																	<!-- svelte-ignore a11y_click_events_have_key_events -->
																	<!-- svelte-ignore a11y_no_static_element_interactions -->
																	<div
																		class="cb-clickable cb-msg-action-icon cb-msg-action-icon-edit"
																		data-bs-toggle="tooltip"
																		data-bs-placement="top"
																		title="Edit"
																		aria-disabled={isWaiting || disableAction}
																		onclick={() => editMessage(message)}
																	>
																		<i class="bx bxs-edit cb-text-primary"></i>
																	</div>
																</div>
																<div class="cb-vcenter cb-msg-action">
																	<!-- svelte-ignore a11y_click_events_have_key_events -->
																	<!-- svelte-ignore a11y_no_static_element_interactions -->
																	<div
																		class="cb-clickable cb-msg-action-icon cb-msg-action-icon-resend"
																		data-bs-toggle="tooltip"
																		data-bs-placement="top"
																		title="Resend"
																		aria-disabled={isWaiting || disableAction}
																		onclick={() => resendMessage(message)}
																	>
																		<i class="bx bx-redo cb-text-primary"></i>
																	</div>
																</div>
																<div class="cb-msg-action">
																	<!-- svelte-ignore a11y_no_static_element_interactions -->
																	<div
																		class="cb-vcenter cb-text-primary cb-msg-action-icon-copy cursor-pointer"
																		data-bs-toggle="tooltip"
																		data-bs-placement="top"
																		title="Copy"
																		onmouseup={e => copyMessage(e, message)}
																	>
																		{#if copiedMsgUid === message.uuid}
																			<div class="cb-copied-feedback">
																				<i class="bx bx-check cb-copied-icon"></i>
																				<span class="cb-copied-label">Copied!</span>
																			</div>
																		{:else}
																			<i class="bx bx-copy"></i>
																		{/if}
																	</div>
																</div>
																<div class="cb-vcenter cb-msg-action">
																	<!-- svelte-ignore a11y_click_events_have_key_events -->
																	<!-- svelte-ignore a11y_no_static_element_interactions -->
																	<div
																		class="cb-clickable cb-msg-action-icon cb-msg-action-icon-delete"
																		data-bs-toggle="tooltip"
																		data-bs-placement="top"
																		title="Delete"
																		aria-disabled={isWaiting || disableAction}
																		onclick={(e) => deleteMessage(e, message.message_id)}
																	>
																		<i class="bx bx-trash cb-text-danger"></i>
																	</div>
																</div>
															</div>
														{/if}
														<p class="cb-chat-time">
															<i class="bx bx-time-five cb-align-middle cb-chat-time-icon"></i>
															{utcToLocal(message.created_at, 'h:mm:ss A')}
														</p>
														{#if !!message.post_action_disclaimer}
															<RcDisclaimer content={message.post_action_disclaimer} />
														{/if}
														{#if !!message.is_chat_message || !!message.has_message_files || message?.data?.startsWith(IMAGE_DATA_PREFIX)}
															<MessageFileGallery
																message={message}
																appendImage
																galleryStyles={'justify-content: flex-end;'}
																fetchFiles={() => getConversationFiles(page.params.conversationId, message.message_id, FileSourceType.User)}
															/>
														{/if}
													{/if}
												</div>
												{:else}
												<div class="cb-cicon cb-cicon-end">
													{#if message.sender.role == UserRole.Client}
														<img src="images/users/user-dummy.jpg" class="cb-avatar" style="margin-bottom: -15px;" alt="avatar">
													{:else}
														{@const isShowIcon = (message?.rich_content?.message?.text || message?.text || message?.thought?.thinking_text) || message?.uuid !== lastBotMsg?.uuid}
														{@const isLastBotIcon = message?.uuid === lastBotMsg?.uuid}
														<img
															class={`cb-avatar ${isLastBotIcon ? 'cb-avatar-bounce' : ''}`}
															style={`display: ${isShowIcon ? 'block' : 'none'}; margin-bottom: -15px;`}
															alt="avatar"
															src={PUBLIC_LIVECHAT_ENTRY_ICON}
														>
													{/if}
												</div>
												<div class="cb-msg-stack" class:cb-msg-stack-editing={editingBotMsgUid === message.uuid}>
													{#if editingBotMsgUid === message.uuid}
														<div class="cb-msg-edit-wrap cb-msg-edit-wrap-bot">
															<div class="cb-msg-edit-box">
																<textarea
																	class="cb-msg-edit-textarea"
																	maxlength={maxTextLength}
																	placeholder="Edit message..."
																	bind:value={botText}
																></textarea>
															</div>
															<div class="cb-msg-edit-actions">
																<button
																	type="button"
																	class="cb-msg-edit-btn cb-msg-edit-btn-cancel"
																	onclick={() => cancelBotMsgEdit()}
																>
																	Cancel
																</button>
																<button
																	type="button"
																	class="cb-msg-edit-btn cb-msg-edit-btn-send"
																	disabled={!_.trim(botText)}
																	onclick={() => saveBotMsg()}
																>
																	Save
																</button>
															</div>
														</div>
													{:else}
														<RcMessage markdownClasses={'markdown-dark cb-md-dark font-libre'} message={message} isStreaming={isStreaming || isThinking} />
													{/if}
													{#if message?.message_id === lastBotMsg?.message_id && message?.uuid === lastBotMsg?.uuid}
														{@const isStreamEnd = (message?.rich_content?.message?.text || message?.text) && !isStreaming && !isHandlingQueue && !isThinking}
														<div class="cb-msg-actions" style={`display: ${isStreamEnd && editingBotMsgUid !== message.uuid ? 'flex' : 'none'};`}>
															{#if PUBLIC_LIVECHAT_SPEAKER_ENABLED === 'true'}
																<AudioSpeaker
																	id={message?.message_id}
																	text={message?.rich_content?.message?.text || message?.text}
																/>
															{/if}
															{#if PUBLIC_LIVECHAT_ENABLE_TRAINING === 'true' && AgentExtensions.trainable(agent)}
																{#if message?.function}
																	<div class="cb-vcenter cb-msg-action">
																		<!-- svelte-ignore a11y_click_events_have_key_events -->
																		<!-- svelte-ignore a11y_no_static_element_interactions -->
																		<div
																			class="cb-clickable cb-msg-action-icon"
																			data-bs-toggle="tooltip"
																			data-bs-placement="top"
																			title="Like"
																			onclick={e => likeMessage(e, message)}
																		>
																			<i class="mdi mdi-thumb-up-outline cb-text-primary"></i>
																		</div>
																	</div>
																{/if}
																<div class="cb-vcenter cb-msg-action">
																	<!-- svelte-ignore a11y_click_events_have_key_events -->
																	<!-- svelte-ignore a11y_no_static_element_interactions -->
																	<div
																		class="cb-clickable cb-msg-action-icon cb-msg-action-icon-edit"
																		data-bs-toggle="tooltip"
																		data-bs-placement="top"
																		title="Edit"
																		aria-disabled={isWaiting || disableAction}
																		onclick={() => openBotMsgEditor(message)}
																	>
																		<i class="bx bxs-edit cb-text-primary"></i>
																	</div>
																</div>
															{/if}
															<div class="cb-msg-action">
																<!-- svelte-ignore a11y_no_static_element_interactions -->
																<div
																	class="cb-vcenter cb-text-primary cb-msg-action-icon-copy cursor-pointer"
																	data-bs-toggle="tooltip"
																	data-bs-placement="top"
																	title="Copy"
																	onmouseup={e => copyMessage(e, message)}
																>
																	{#if copiedMsgUid === message.uuid}
																		<div class="cb-copied-feedback">
																			<i class="bx bx-check cb-copied-icon"></i>
																			<span class="cb-copied-label">Copied!</span>
																		</div>
																	{:else}
																		<i class="bx bx-copy"></i>
																	{/if}
																</div>
															</div>
															{#if message?.rich_content?.message?.rich_type === RichType.ProgramCode}
															<div class="cb-msg-action">
																<!-- svelte-ignore a11y_click_events_have_key_events -->
																<!-- svelte-ignore a11y_no_static_element_interactions -->
																<div
																	class="cb-vcenter cb-text-primary cb-msg-action-icon-code cursor-pointer"
																	data-bs-toggle="tooltip"
																	data-bs-placement="top"
																	title="Code script"
																	onclick={e => openCodeScriptModal(e, message)}
																>
																	<i class="bx bx-terminal"></i>
																</div>
															</div>
															{/if}
														</div>
													{/if}
													{#if !!message.is_chat_message || !!message.has_message_files || message?.data?.startsWith(IMAGE_DATA_PREFIX)}
														<MessageFileGallery
															message={message}
															appendImage
															galleryStyles={'justify-content: flex-start;'}
															fetchFiles={() => getConversationFiles(page.params.conversationId, message.message_id, FileSourceType.Bot)}
														/>
													{/if}
												</div>
												{/if}
											</div>
										</li>
									{/each}
								{/each}

								{#if isThinking}
								<li>
									<div class="cb-msg-row">
										<div class="cb-cicon cb-cicon-start">
											<img src={PUBLIC_LIVECHAT_ENTRY_ICON} class="cb-avatar cb-avatar-xs" alt="avatar">
										</div>
										<div class="cb-msg-stack">
											<div class="cb-bubble cb-bubble-thinking">
												{#if !!indication}
													<span class="cb-chat-indication">
														{indication}
													</span>
												{/if}
												<div class="cb-thinking-dots">
													<LoadingDots duration={'1s'} size={5} gap={5} color={'var(--color-primary)'} />
												</div>
											</div>
										</div>
									</div>
								</li>
								{/if}
							</ul>

							<ChatFileGallery disabled={isWaiting} />
							{#if !!lastBotMsg && !isSendingMsg && !isThinking}
								<RichContent
									message={lastBotMsg}
									disabled={isWaiting || disableAction}
									onConfirm={(title, payload) => confirmSelectedOption(title, payload)}
								/>
							{/if}
						</div>
					</div>

					<div class={`cb-input-section cb-css-animation ${!loadEditor ? 'cb-input-hide' : 'cb-fade-in'}`}>
						<div class="cb-input-row">
							<div class="cb-col-auto">
								{#if PUBLIC_LIVECHAT_VOICE_ENABLED === 'true' && !disableSpeech}
									<button
										type="submit"
										class={`cb-btn cb-btn-round ${mode === TRAINING_MODE ? 'cb-btn-danger' : 'cb-btn-primary'} ${isListening ? 'cb-btn-listening' : ''}`}
										aria-label="Start/stop listening"
										aria-pressed={isListening}
										disabled={isWaiting || disableAction}
										onclick={() => startListen()}
									>
										<i class="mdi mdi-{isListening ? 'microphone' : 'microphone-off'} cb-md-36"></i>
									</button>
								{/if}
							</div>
							<div class="cb-col-grow">
								<div class="cb-position-relative">
									<ChatTextArea
										id={'chat-textarea'}
										className={`${!isLite ? 'cb-textarea-more-util' : ''}`}
										maxLength={maxTextLength}
										disabled={isWaiting || disableAction}
										bind:text={text}
										bind:loadUtils={loadChatUtils}
										bind:options={chatUtilOptions}
										onTextInput={e => handleMessageInput(e)}
										onKeyDown={e => onSendMessage(e)}
										onFocus={() => chatUtilOptions = []}
										onOptionClick={op => handleChatOptionClick(op)}
									>
										<ChatFileUploader
											accept={'.png,.jpg,.jpeg'}
											containerClasses={'cb-util-uploader'}
											disabled={isWaiting || disableAction}
											onfiledroped={() => refresh()}
										>
											<span>
												<i
													class="bx bx-image-add cursor-pointer"
													data-bs-toggle="tooltip"
													data-bs-placement="top"
													title="Upload images"></i>
											</span>
										</ChatFileUploader>
										<ChatFileUploader
											accept={'.pdf,.xlsx,.xls,.csv'}
											containerClasses={'cb-util-uploader'}
											disabled={isWaiting || disableAction}
											onfiledroped={() => refresh()}
										>
											<span>
												<i
													class="bx bxs-folder-open cursor-pointer"
													data-bs-toggle="tooltip"
													data-bs-placement="top"
													title="Upload pdf, excel files"></i>
											</span>
										</ChatFileUploader>
										<ChatFileUploader
											accept={'.wav,.mp3'}
											containerClasses={'cb-util-uploader'}
											disabled={isWaiting || disableAction}
											onfiledroped={() => refresh()}
										>
											<span>
												<i
													class="bx bxs-music cursor-pointer"
													data-bs-toggle="tooltip"
													data-bs-placement="top"
													title="Upload audios"></i>
											</span>
										</ChatFileUploader>
									</ChatTextArea>
									<div class="cb-util-links">
										<ChatBigMessage
											disabled={isWaiting || disableAction}
											onclick={() => toggleBigMessageModal()}
										/>
										{#if PUBLIC_LIVECHAT_FILES_ENABLED === 'true'}
											<ChatUtil
												disabled={isWaiting || disableAction}
												onclick={() => loadChatUtils = true}
											/>
										{/if}
									</div>
								</div>
							</div>
							<div class="cb-col-auto">
								{#if !isStopStreamClicked && isStreaming && PUBLIC_LIVECHAT_STREAM_ENABLED === 'true'}
									<button
										type="button"
										class="cb-btn cb-btn-round cb-btn-send cb-btn-danger cb-btn-streaming"
										aria-label="Stop streaming"
										aria-pressed="true"
										onclick={() => stopStreaming()}
									>
										<i class="mdi mdi-stop"></i>
									</button>
								{:else}
									<button
										type="submit"
										class={`cb-btn cb-btn-round cb-btn-send ${mode === TRAINING_MODE ? 'cb-btn-danger' : 'cb-btn-primary'}`}
										disabled={!_.trim(text) || isWaiting || disableAction}
										onclick={() => sentTextMessage()}
									>
										<span class="cb-send-label">Send</span>
										<i class="mdi mdi-send"></i>
									</button>
								{/if}
							</div>
						</div>
					</div>
				</div>
			</div>
		</Pane>
		{#if isLoadPersistLog}
		<Pane size={25} minSize={15} maxSize={40}>
			<PersistLog
				bind:contentLogs={contentLogs}
				bind:convStateLogs={convStateLogs}
				bind:autoScroll={autoScrollLog}
				closeWindow={() => closePersistLog()}
				cleanScreen={() => cleanPersistLogScreen()}
			/>
		</Pane>
		{/if}
	</Splitpanes>
</div>



