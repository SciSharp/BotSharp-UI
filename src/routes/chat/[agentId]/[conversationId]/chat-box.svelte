<script>
	import { onMount, setContext, tick } from 'svelte';
	import { get } from 'svelte/store';
	import { Pane, Splitpanes } from 'svelte-splitpanes';
	import Viewport from 'svelte-viewport-info';
	import { page } from '$app/state';
	import Swal from 'sweetalert2';
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
		pinConversationToDashboard,
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
	import { delay } from '$lib/helpers/utils/common';
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
	let isOpenEditBotMsgModal = $state(false);
	let isOpenUserAddStateModal = $state(false);
	let isOpenTagModal = $state(false);
	let isOpenCodeScriptModal = $state(false);
	let isHeaderMenuOpen = $state(false);
	let isHeaderStatesOpen = $state(false);
	/** @type {string} */
	let openMsgActionId = $state('');
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
	let copyClicked = $state(false);
	let isStreaming = $state(false);
	let isHandlingQueue = $state(false);
	let isStopStreamClicked = $state(false);

	let isWaiting = $derived(isSendingMsg || isThinking || messageQueue.length > 0);
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
			document.querySelector('.chat-scrollbar')
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

	function autoScrollToBottom() {
		scrollbars.forEach(scrollbar => {
			setTimeout(() => {
				scrollbar.scrollTo({ top: scrollbar.scrollHeight, behavior: 'smooth' });
			}, 200);
		})
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
						await delay(10);
					}
				}

				for (const char of item.text) {
					dialogs[dialogs.length - 1].text += char;
					refreshDialogs();
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

	function pinDashboard() {
		const agentId = page.params.agentId;
		const convId = page.params.conversationId;
		// @ts-ignore
		pinConversationToDashboard(agentId, convId).then().finally();
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

		if ((e.key === 'Enter' && (!!e.shiftKey || !!e.ctrlKey)) || e.key !== 'Enter' || !_.trim(text) || isSendingMsg || isThinking) {
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
		if (isSendingMsg || isThinking) return;

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
			// @ts-ignore
			Swal.fire({
				title: 'Are you sure?',
				text: "You will exit this conversation.",
				icon: 'warning',
				customClass: 'custom-modal',
				showCancelButton: true,
				confirmButtonText: 'Yes',
				cancelButtonText: 'No'
			}).then((result) => {
				if (result.value) {
					window.close();
				}
			});
		} else {
			window.parent.postMessage({ action: ChatAction.Close }, "*");
		}
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
		// @ts-ignore
		Swal.fire({
			title: 'Are you sure?',
			text: "You won't be able to revert this!",
			icon: 'warning',
			showCancelButton: true,
			confirmButtonText: 'Yes, delete it!',
			cancelButtonText: 'No'
		}).then(async (result) => {
			if (result.value) {
				userAddStates = [];
				conversationUserStateStore.resetOne(page.params.conversationId);
			}
		});
	}

	/**
	 * @param {any} e
	 * @param {import('$conversationTypes').ChatResponseModel} message
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
		}).then(async (result) => {
			if (result.value) {
				const postback = buildPostback(message?.message_id);
				// @ts-ignore
				deleteConversationMessage(page.params.conversationId, message?.message_id, true).then(res => {
					sendChatMessage(message?.text, { postback: postback, inputMessageId: res?.messageId });
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
		}).then(async (result) => {
			if (result.value) {
				await handleDeleteMessage(messageId);
			}
		});
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
		truncateMsgId = message?.message_id;
		editText = message?.text;
		await tick();
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

		highlightChatMessage(messageId);
		highlightStateLog(messageId);
		autoScrollToTargetLog(messageId);
	}

	/** @param {string} messageId */
	function highlightChatMessage(messageId) {
		const targets = document.querySelectorAll('.user-msg');
		const style = ['bg-danger'];
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
				parentId: message?.id
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

		navigator.clipboard.writeText(text).then(() => {
			setTimeout(() => {
				copyClicked = false;
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
	function openEditBotMsgModal(message) {
		isOpenEditBotMsgModal = true;
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
	}

	function toggleEditBotMsgModal() {
		isOpenEditBotMsgModal = !isOpenEditBotMsgModal;
		if (!isOpenEditBotMsgModal) {
			editBotMsg = null;
			botText = '';
		}
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

				toggleEditBotMsgModal();
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
			toggleEditBotMsgModal();
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
	size={'md'}
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
		<div>{`${(bigText?.length || 0)}/${maxTextLength}`}</div>
	</div>
</DialogModal>

<DialogModal
	title={'Edit bot message'}
	size={'xl'}
	isOpen={isOpenEditBotMsgModal}
	toggleModal={() => toggleEditBotMsgModal()}
	confirm={() => saveBotMsg()}
	cancel={() => toggleEditBotMsgModal()}
	disableConfirmBtn={!_.trim(botText)}
>
	<textarea
		class="cb-modal-textarea"
		rows="10"
		maxlength={maxTextLength}
		bind:value={botText}
		placeholder="Enter Message...">
	</textarea>
	<div class="cb-modal-counter">
		<div>{`${(botText?.length || 0)}/${maxTextLength}`}</div>
	</div>
</DialogModal>

<PlainModal
	title={'Code script'}
	isOpen={isOpenCodeScriptModal}
	toggleModal={() => toggleCodeScriptModal()}
>
	<CodeScript
		language={codeLanguage || 'python'}
		scriptText={codeScript}
		editable={false}
	/>
</PlainModal>

<StateModal
	isOpen={isOpenUserAddStateModal}
	size={'2xl'}
	bind:states={userAddStates}
	requireActiveRounds
	toggleModal={() => toggleUserAddStateModal()}
	confirm={() => handleConfirmUserAddStates()}
	cancel={() => toggleUserAddStateModal()}
/>

<HeadTitle title="Chat" addOn='' />
<div class="cb-page-flex">
	<Splitpanes on:resize={() => handlePaneResize()}>
		{#if isLoadInstantLog}
		<Pane size={30} minSize={25} maxSize={40} >
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
												{#if !isLoadInstantLog || !isOpenUserAddStateModal}
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
												{/if}

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
												<li><button class="cb-menu-item" type="button" onclick={() => pinDashboard()}>Pin to Dashboard</button></li>
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
												<div class="cb-msg-stack">
													<div
														tabindex="0"
														aria-label="user-msg-to-log"
														role="link"
														onkeydown={() => {}}
														onclick={() => directToLog(message.message_id)}
													>
														<div
															class="cb-bubble cb-bubble-user"
															class:cb-clickable={!isLite && isLoadPersistLog}
															id={`user-msg-${message.message_id}`}
														>
															<div class="cb-bubble-text-user">{@html replaceNewLine(message.text)}</div>
														</div>
														<p class="cb-chat-time">
															<i class="bx bx-time-five cb-align-middle cb-chat-time-icon"></i>
															{utcToLocal(message.created_at, 'h:mm:ss A')}
														</p>
													</div>
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
												</div>
													{#if !isLite}
														<div
															class="cb-dropdown"
															use:clickoutsideDirective
															onclickoutside={(/** @type {any} */ e) => {
																if (!e.detail.currentNode?.contains(e.detail.targetNode)) {
																	if (openMsgActionId === message.message_id) {
																		openMsgActionId = '';
																	}
																}
															}}
														>
															<button class="cb-msg-action-btn" type="button" aria-expanded={openMsgActionId === message.message_id} aria-label="Message actions" disabled={isSendingMsg || isThinking || disableAction} onclick={() => { openMsgActionId = openMsgActionId === message.message_id ? '' : message.message_id; }}>
																<i class="bx bx-dots-vertical-rounded"></i>
															</button>
															<ul class="cb-menu cb-menu-end cb-msg-menu" class:show={openMsgActionId === message.message_id} style="right: 0; left: auto;">
																<li><button class="cb-menu-item" type="button" onclick={() => { openMsgActionId = ''; editMessage(message); }}>Edit</button></li>
																<li><button class="cb-menu-item" type="button" onclick={(e) => { openMsgActionId = ''; resendMessage(e, message); }}>Resend</button></li>
																<li><button class="cb-menu-item" type="button" onclick={(e) => { openMsgActionId = ''; deleteMessage(e, message.message_id); }}>Delete</button></li>
															</ul>
														</div>
													{/if}
												{:else}
												<div class="cb-cicon cb-cicon-end">
													{#if message.sender.role == UserRole.Client}
														<img src="images/users/user-dummy.jpg" class="cb-avatar" style="margin-bottom: -15px;" alt="avatar">
													{:else}
														{@const isShowIcon = (message?.rich_content?.message?.text || message?.text || message?.thought?.thinking_text) || message?.uuid !== lastBotMsg?.uuid}
														<img
															class="cb-avatar"
															style={`display: ${isShowIcon ? 'block' : 'none'}; margin-bottom: -15px;`}
															alt="avatar"
															src={PUBLIC_LIVECHAT_ENTRY_ICON}
														>
													{/if}
												</div>
												<div class="cb-msg-stack">
													<RcMessage markdownClasses={'markdown-dark cb-md-dark'} message={message} isStreaming={isStreaming || isThinking} />
													{#if message?.message_id === lastBotMsg?.message_id && message?.uuid === lastBotMsg?.uuid}
														{@const isStreamEnd = (message?.rich_content?.message?.text || message?.text) && !isStreaming && !isHandlingQueue && !isThinking}
														<div class="cb-msg-actions" style={`display: ${isStreamEnd ? 'flex' : 'none'};`}>
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
																		onclick={() => openEditBotMsgModal(message)}
																	>
																		<i class="bx bxs-edit cb-text-primary"></i>
																	</div>
																</div>
															{/if}
															<div class="cb-msg-action">
																<!-- svelte-ignore a11y_no_static_element_interactions -->
																<div
																	class="cb-vcenter cb-text-primary cb-msg-action-icon-copy"
																	data-bs-toggle="tooltip"
																	data-bs-placement="top"
																	title="Copy"
																	onmouseup={e => copyMessage(e, message)}
																	onmousedown={() => copyClicked = true}
																>
																	{#if copyClicked}
																		<div class="cb-div-center">
																			<div class="cb-vcenter">
																				<i class="bx bx-check"></i>
																			</div>
																			<div class="cb-vcenter">
																				<span class="cb-copied-label">{'Copied!'}</span>
																			</div>
																		</div>
																	{:else}
																		<i class="bx bx-copy cb-clickable"></i>
																	{/if}
																</div>
															</div>
															{#if message?.rich_content?.message?.rich_type === RichType.ProgramCode}
															<div class="cb-msg-action">
																<!-- svelte-ignore a11y_click_events_have_key_events -->
																<!-- svelte-ignore a11y_no_static_element_interactions -->
																<div
																	class="cb-vcenter cb-text-primary cb-msg-action-icon-code"
																	data-bs-toggle="tooltip"
																	data-bs-placement="top"
																	title="Code script"
																	onclick={e => openCodeScriptModal(e, message)}
																>
																	<i class="bx bx-terminal cb-clickable"></i>
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

							<ChatFileGallery disabled={isSendingMsg || isThinking} />
							{#if !!lastBotMsg && !isSendingMsg && !isThinking}
								<RichContent
									message={lastBotMsg}
									disabled={isSendingMsg || isThinking || disableAction}
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
										class={`cb-btn cb-btn-round ${mode === TRAINING_MODE ? 'cb-btn-danger' : 'cb-btn-primary'}`}
										aria-label="Start/stop listening"
										disabled={isSendingMsg || isThinking || disableAction}
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
										disabled={isSendingMsg || isThinking || disableAction}
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
											disabled={isSendingMsg || isThinking || disableAction}
											onfiledroped={() => refresh()}
										>
											<span>
												<i
													class="bx bx-image-add"
													data-bs-toggle="tooltip"
													data-bs-placement="top"
													title="Upload images"></i>
											</span>
										</ChatFileUploader>
										<ChatFileUploader
											accept={'.pdf,.xlsx,.xls,.csv'}
											containerClasses={'cb-util-uploader'}
											disabled={isSendingMsg || isThinking || disableAction}
											onfiledroped={() => refresh()}
										>
											<span>
												<i
													class="bx bxs-folder-open"
													data-bs-toggle="tooltip"
													data-bs-placement="top"
													title="Upload pdf, excel files"></i>
											</span>
										</ChatFileUploader>
										<ChatFileUploader
											accept={'.wav,.mp3'}
											containerClasses={'cb-util-uploader'}
											disabled={isSendingMsg || isThinking || disableAction}
											onfiledroped={() => refresh()}
										>
											<span>
												<i
													class="bx bxs-music"
													data-bs-toggle="tooltip"
													data-bs-placement="top"
													title="Upload audios"></i>
											</span>
										</ChatFileUploader>
									</ChatTextArea>
									<div class="cb-util-links">
										<ChatBigMessage
											disabled={isSendingMsg || isThinking || disableAction}
											onclick={() => toggleBigMessageModal()}
										/>
										{#if PUBLIC_LIVECHAT_FILES_ENABLED === 'true'}
											<ChatUtil
												disabled={isSendingMsg || isThinking || disableAction}
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
										class="cb-btn cb-btn-round cb-btn-send cb-btn-danger"
										aria-label="Stop streaming"
										onclick={() => stopStreaming()}
									>
										<i class="mdi mdi-stop"></i>
									</button>
								{:else}
									<button
										type="submit"
										class={`cb-btn cb-btn-round cb-btn-send ${mode === TRAINING_MODE ? 'cb-btn-danger' : 'cb-btn-primary'}`}
										disabled={!_.trim(text) || isSendingMsg || isThinking || disableAction}
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
		<Pane size={30} minSize={25} maxSize={40}>
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

<style>
    /* ============================================================
       chat-box scoped styles — replaces legacy `_chat.scss` rules.
       Built up incrementally across Step 4 sub-steps. Each cb-* class
       is scoped to this component to avoid leaking into other pages.
       ============================================================ */

    /* ===== 4a: Modals (Tag / Notification / Edit / Big-message) ===== */

    /* Tag modal — tags wrapper (replaces .conv-tags-container) */
    .cb-tags-container {
        display: flex;
        flex-wrap: wrap;
        gap: 0.25rem;
        overflow-y: auto;
        scrollbar-width: thin;
        min-height: 5rem;
        max-height: 11.25rem;
    }

    /* Tag modal — input + add row (replaces .conv-tag-add) */
    .cb-tag-add {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        margin-top: 0.625rem;
    }

    /* Tag modal — input (replaces .form-control.form-control-sm) */
    .cb-tag-input {
        flex: 1;
        padding: 0.25rem 0.5rem;
        font-size: 0.8125rem;
        line-height: 1.5;
        color: rgb(17 24 39);
        background-color: rgb(255 255 255);
        border: 1px solid rgb(229 231 235);
        border-radius: 0.375rem;
        font-family: inherit;
        transition: border-color 0.15s ease, box-shadow 0.15s ease;
    }
    .cb-tag-input:focus {
        outline: 0;
        border-color: var(--color-primary);
        box-shadow: 0 0 0 3px color-mix(in srgb, var(--color-primary) 18%, transparent);
    }

    /* Tag modal — add button (replaces .btn.btn-primary.btn-sm) */
    .cb-tag-add-btn {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        height: 1.875rem;
        padding: 0 0.625rem;
        font-size: 0.8125rem;
        font-weight: 500;
        line-height: 1;
        color: rgb(255 255 255);
        background-color: var(--color-primary);
        border: 1px solid var(--color-primary);
        border-radius: 0.375rem;
        cursor: pointer;
        transition: background-color 0.15s ease, border-color 0.15s ease, transform 0.12s ease;
    }
    .cb-tag-add-btn:hover:not(:disabled) {
        background-color: var(--color-primary-hover);
        border-color: var(--color-primary-hover);
    }
    .cb-tag-add-btn:active:not(:disabled) {
        transform: translateY(1px);
    }
    .cb-tag-add-btn:disabled {
        opacity: 0.55;
        cursor: not-allowed;
    }

    /* Notification modal — warning title icon (replaces .text-warning) */
    .cb-title-icon {
        display: inline-flex;
        align-items: center;
    }
    .cb-text-warning {
        color: var(--color-warning);
    }

    /* Notification modal — body (replaces legacy .chat-notification) */
    .cb-notification {
        min-height: 1.25rem;
        max-height: 9.375rem;
        overflow-y: auto;
        scrollbar-width: none;
    }

    /* Edit / Big-message modals — textarea (replaces .form-control.chat-input) */
    .cb-modal-textarea {
        display: block;
        width: 100%;
        padding: 0.5rem 1rem 0.5rem 0.75rem;
        font-size: 0.875rem;
        line-height: 1.5;
        color: rgb(17 24 39);
        background-color: var(--color-light);
        border: 1px solid var(--color-light);
        border-radius: 0.3125rem;
        font-family: inherit;
        resize: none;
        scrollbar-width: none;
        transition: border-color 0.15s ease, box-shadow 0.15s ease;
    }
    .cb-modal-textarea:focus {
        outline: 0;
        border-color: var(--color-primary);
        box-shadow: 0 0 0 3px color-mix(in srgb, var(--color-primary) 18%, transparent);
    }

    /* Edit / Big-message modals — counter row (replaces .text-secondary.text-end.text-count) */
    .cb-modal-counter {
        text-align: right;
        color: var(--color-secondary);
        font-size: 0.75rem;
        margin-top: 0.25rem;
    }

    /* ===== Dark mode (Step 4a) ===== */
    :global(.dark) .cb-tag-input {
        background-color: rgb(17 24 39);
        border-color: rgb(55 65 81);
        color: rgb(229 231 235);
    }
    :global(.dark) .cb-modal-textarea {
        background-color: rgb(31 41 55);
        border-color: rgb(55 65 81);
        color: rgb(229 231 235);
    }
    :global(.dark) .cb-modal-counter {
        color: rgb(156 163 175);
    }

    /* ===== 4b: Outer split layout + chat header ===== */

    /* Shared utilities used across the chat layout */
    .cb-vcenter {
        display: flex;
        flex-direction: column;
        justify-content: center;
    }
    .cb-ellipsis {
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
    }
    .cb-align-middle {
        vertical-align: middle;
    }
    .cb-text-success {
        color: var(--color-success);
    }

    /* Page-level flex wrapper (replaces .d-lg-flex) */
    .cb-page-flex {
        display: block;
    }
    @media (min-width: 992px) {
        .cb-page-flex {
            display: flex;
        }
    }

    /* Main chat panel card (replaces .card.mb-0) */
    .cb-panel-card {
        position: relative;
        display: flex;
        flex-direction: column;
        min-width: 0;
        word-wrap: break-word;
        background-color: rgb(255 255 255);
        background-clip: border-box;
        border: 1px solid rgb(229 231 235);
        border-radius: 0.5rem;
        margin-bottom: 0;
    }

    /* Header bar (replaces .border-bottom.chat-head) */
    .cb-head {
        font-size: 1rem;
        padding: 2vmin 2%;
        height: 10%;
        border-bottom: 1px solid rgb(229 231 235);
    }

    /* Header row (replaces .row.chat-row) */
    .cb-head-row {
        display: flex;
        flex-wrap: nowrap;
        justify-content: space-between;
        height: 100%;
    }

    /* Left column with agent/user info (replaces .col-md-4.col-4.chat-head-info) */
    .cb-head-left {
        flex: 0 0 33.333333%;
        max-width: 33.333333%;
        padding-right: calc(var(--bs-gutter-x, 1.5rem) * 0.5);
        padding-left: calc(var(--bs-gutter-x, 1.5rem) * 0.5);
        display: flex;
        flex-direction: column;
        height: 100%;
        gap: 0.3125rem;
    }

    /* Agent row (replaces .chat-head-agent) */
    .cb-head-agent {
        flex: 0.5;
        display: flex;
        gap: 0.625rem;
        width: fit-content;
        height: 50%;
    }
    .cb-head-agent-icon {
        height: 80%;
        max-height: 25px;
    }
    .cb-head-agent-name {
        font-size: 0.8em;
    }

    /* User row (replaces .text-muted.mb-0.chat-head-user) */
    .cb-head-user {
        flex: 0.5;
        display: flex;
        gap: 0.3125rem;
        width: fit-content;
        font-size: 0.7em;
        color: var(--color-muted);
        margin-bottom: 0;
    }

    /* Right column (replaces .col-md-8.col-8) */
    .cb-head-right {
        flex: 0 0 66.666667%;
        max-width: 66.666667%;
        padding-right: calc(var(--bs-gutter-x, 1.5rem) * 0.5);
        padding-left: calc(var(--bs-gutter-x, 1.5rem) * 0.5);
    }

    /* Header action bar (replaces .user-chat-nav.user-chat-nav-flex.mb-0) */
    .cb-head-actions {
        display: flex;
        justify-content: flex-end;
        align-items: center;
        gap: 0.3125rem;
        align-self: stretch;
        min-width: 30px;
        min-height: 30px;
        margin-bottom: 0;
    }

    /* Round icon buttons in the header
       (replaces .btn.btn-rounded.btn-sm + variants for color) */
    .cb-icon-btn {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        width: 2.125rem;
        height: 2.125rem;
        padding: 0;
        font-size: 0.8125rem;
        line-height: 1;
        border: 1px solid transparent;
        border-radius: 50%;
        cursor: pointer;
        background-color: transparent;
        color: rgb(255 255 255);
        transition: background-color 0.15s ease, border-color 0.15s ease, transform 0.12s ease;
    }
    .cb-icon-btn:disabled {
        opacity: 0.55;
        cursor: not-allowed;
    }
    .cb-icon-btn:active:not(:disabled) {
        transform: translateY(1px);
    }
    .cb-icon-btn-primary {
        background-color: var(--color-primary);
        border-color: var(--color-primary);
    }
    .cb-icon-btn-primary:hover:not(:disabled) {
        background-color: var(--color-primary-hover);
        border-color: var(--color-primary-hover);
    }
    .cb-icon-btn-secondary {
        background-color: var(--color-secondary);
        border-color: var(--color-secondary);
    }
    .cb-icon-btn-secondary:hover:not(:disabled) {
        background-color: var(--color-secondary-hover);
        border-color: var(--color-secondary-hover);
    }
    .cb-icon-btn-lg {
        width: 40px;
        height: 40px;
    }
    .cb-icon-lg {
        font-size: 0.9375rem;
    }

    /* Dots-menu trigger (replaces .nav-btn) */
    .cb-nav-btn {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        width: 2em;
        height: 2em;
        padding: 0;
        background-color: var(--color-light);
        color: rgb(55 65 81);
        border: none;
        border-radius: 50%;
        box-shadow: none;
        cursor: pointer;
        transition: background-color 0.15s ease;
    }
    .cb-nav-btn:hover {
        background-color: color-mix(in srgb, var(--color-primary) 8%, var(--color-light));
    }
    .cb-nav-btn i {
        font-size: 1rem;
        line-height: 1;
    }

    /* Dropdown wrapper (replaces .dropdown) */
    .cb-dropdown {
        position: relative;
        display: inline-block;
    }

    /* Menu popup (replaces .dropdown-menu) */
    .cb-menu {
        position: absolute;
        z-index: 1000;
        display: none;
        min-width: 10rem;
        padding: 0.5rem 0;
        margin: 0;
        list-style: none;
        font-size: 0.875rem;
        color: rgb(33 37 41);
        text-align: left;
        background-color: rgb(255 255 255);
        background-clip: padding-box;
        border: 1px solid rgb(229 231 235);
        border-radius: 0.375rem;
        box-shadow: 0 0.5rem 1rem rgb(15 23 42 / 0.15);
    }
    .cb-menu.show {
        display: block;
    }
    .cb-menu-end {
        right: 0;
        left: auto;
    }
    .cb-menu-item {
        display: block;
        width: 100%;
        padding: 0.25rem 1rem;
        clear: both;
        font-weight: 400;
        color: rgb(33 37 41);
        text-align: inherit;
        white-space: nowrap;
        background-color: transparent;
        border: 0;
        cursor: pointer;
        font-family: inherit;
        font-size: inherit;
    }
    .cb-menu-item:hover:not(:disabled),
    .cb-menu-item:focus:not(:disabled) {
        color: rgb(22 24 30);
        background-color: rgb(243 244 246);
    }
    .cb-menu-item:disabled {
        color: var(--color-muted);
        opacity: 0.55;
        cursor: not-allowed;
        pointer-events: none;
    }

    /* Submenu host (replaces .dropstart.state-menu) */
    .cb-state-menu {
        position: relative;
    }
    .cb-state-menu > .cb-menu {
        top: 0;
        left: 0;
    }

    /* Button-pair (replaces .btn-pair / .btn-left / .btn-right) */
    .cb-btn-pair {
        display: flex;
    }
    .cb-pill-btn {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        gap: 0.25rem;
        height: 2.125rem;
        padding: 0 0.75rem;
        font-size: 0.8125rem;
        font-weight: 500;
        line-height: 1;
        color: rgb(255 255 255);
        background-color: transparent;
        border: 1px solid transparent;
        border-radius: 50rem;
        cursor: pointer;
        transition: background-color 0.15s ease, border-color 0.15s ease, transform 0.12s ease;
    }
    .cb-pill-btn:disabled {
        opacity: 0.55;
        cursor: not-allowed;
    }
    .cb-pill-btn:active:not(:disabled) {
        transform: translateY(1px);
    }
    .cb-pill-btn i,
    .cb-pill-btn span {
        font-size: 0.9em;
    }
    .cb-pill-btn-primary {
        background-color: var(--color-primary);
        border-color: var(--color-primary);
    }
    .cb-pill-btn-primary:hover:not(:disabled) {
        background-color: var(--color-primary-hover);
        border-color: var(--color-primary-hover);
    }
    .cb-pill-btn-danger {
        background-color: var(--color-danger);
        border-color: var(--color-danger);
    }
    .cb-pill-btn-danger:hover:not(:disabled) {
        filter: brightness(0.95);
    }
    .cb-pill-btn-left {
        border-top-right-radius: 0;
        border-bottom-right-radius: 0;
    }
    .cb-pill-btn-right {
        border-top-left-radius: 0;
        border-bottom-left-radius: 0;
    }
    .cb-pill-btn-label {
        margin-right: 0.5rem;
    }

    /* ===== Dark mode (Step 4b) ===== */
    :global(.dark) .cb-panel-card {
        background-color: rgb(31 41 55);
        border-color: rgb(55 65 81);
    }
    :global(.dark) .cb-head {
        border-bottom-color: rgb(55 65 81);
    }
    :global(.dark) .cb-nav-btn {
        background-color: rgb(55 65 81);
        color: rgb(229 231 235);
    }
    :global(.dark) .cb-nav-btn:hover {
        background-color: color-mix(in srgb, var(--color-primary) 14%, rgb(55 65 81));
    }
    :global(.dark) .cb-menu {
        background-color: rgb(31 41 55);
        border-color: rgb(55 65 81);
        color: rgb(229 231 235);
    }
    :global(.dark) .cb-menu-item {
        color: rgb(229 231 235);
    }
    :global(.dark) .cb-menu-item:hover:not(:disabled),
    :global(.dark) .cb-menu-item:focus:not(:disabled) {
        background-color: rgb(55 65 81);
        color: rgb(255 255 255);
    }

    /* ===== 4c: Message thread (scroll area + bubbles + actions) ===== */

    /* Scrollable thread area (replaces .chat-scrollbar.chat-content.scroll-bottom-to-top) */
    .cb-msgs-scroll {
        display: flex;
        flex-direction: column-reverse;
        overflow-y: auto;
        scrollbar-width: none;
        scroll-behavior: smooth;
    }
    .cb-msgs-content {
        height: 82%;
    }
    .cb-msgs-content-expand {
        height: 98%;
    }
    /* Alias of .cb-msgs-scroll for clarity at the markup site */
    .cb-msgs-scroll-rev {
        display: flex;
        flex-direction: column-reverse;
    }

    /* Conversation container (replaces .chat-conversation.p-3) */
    .cb-conv {
        padding: 1rem;
    }
    .cb-conv-list {
        list-style: none;
        padding-left: 0;
        margin-bottom: 0;
    }
    .cb-conv-list > li {
        clear: both;
    }

    /* Day separator (replaces .chat-day-title with centered pill on a divider) */
    .cb-day-title {
        position: relative;
        text-align: center;
        margin-bottom: 1.5rem;
    }
    .cb-day-title::before {
        content: '';
        position: absolute;
        width: 100%;
        height: 1px;
        left: 0;
        right: 0;
        top: 10px;
        background-color: rgb(229 231 235);
    }
    .cb-day-title-text {
        position: relative;
        z-index: 1;
        padding: 0.375rem 1.5rem;
        background-color: rgb(243 244 246);
        border-radius: 0.375rem;
        font-size: 0.8125rem;
        color: rgb(55 65 81);
    }

    /* Message row (replaces .conv-msg-container) */
    .cb-msg-row {
        display: flex;
        position: relative;
        width: 100%;
        margin-bottom: 1.25rem;
    }
    .cb-conv-right .cb-msg-row {
        justify-content: flex-end;
    }

    /* Avatar wrapper (replaces .cicon-wrap with float / align modifiers) */
    .cb-cicon {
        margin-right: 0.25rem;
        flex: 0 0 fit-content;
    }
    .cb-cicon-end {
        align-content: end;
    }
    .cb-cicon-start {
        float: left;
    }

    /* Avatar images (replaces .rounded-circle.avatar-sm / .avatar-xs) */
    .cb-avatar {
        width: 2rem;
        height: 2rem;
        border-radius: 50%;
        object-fit: cover;
    }
    .cb-avatar-xs {
        width: 1.5rem;
        height: 1.5rem;
    }

    /* Message stack (replaces .msg-container) */
    .cb-msg-stack {
        display: flex;
        flex-direction: column;
        width: 80%;
    }
    .cb-conv-right .cb-msg-stack {
        align-items: flex-end;
    }

    /* Bubble base (replaces .ctext-wrap) */
    .cb-bubble {
        padding: 0.5rem 0.75rem;
        overflow: hidden;
        width: fit-content;
        max-width: 100%;
        word-break: break-all;
    }

    /* User bubble (replaces .user-msg.bg-primary on the right side) */
    .cb-bubble-user {
        background-color: var(--color-primary);
        border-radius: 8px 8px 0 8px;
    }
    .cb-bubble-text-user {
        text-align: start;
        font-weight: 700;
        color: rgb(255 255 255);
    }
    .cb-clickable {
        cursor: pointer;
    }

    /* "Thinking" bubble (replaces .ctext-wrap.float-start when isThinking) */
    .cb-bubble-thinking {
        float: left;
        background-color: color-mix(in srgb, var(--color-primary) 10%, transparent);
        border-radius: 8px 8px 8px 0;
    }
    .cb-chat-indication {
        font-size: 1em;
    }
    .cb-thinking-dots {
        flex-shrink: 0;
        align-self: center;
        display: inline-block;
    }

    /* Chat time below user bubble (replaces .chat-time.mb-0.float-end) */
    .cb-chat-time {
        font-size: 12px;
        margin-bottom: 0;
        float: right;
        color: var(--color-muted);
    }
    .cb-chat-time-icon {
        margin-right: 0.25rem;
    }

    /* Message action 3-dots button (replaces .dropdown-toggle.btn.btn-link.p-0.border-0) */
    .cb-msg-action-btn {
        padding: 0.25rem;
        font-size: 18px;
        line-height: 1;
        background: transparent;
        border: 0;
        color: var(--color-secondary);
        cursor: pointer;
    }
    .cb-msg-action-btn:hover:not(:disabled) {
        color: var(--color-primary);
    }
    .cb-msg-action-btn:disabled {
        opacity: 0.55;
        cursor: not-allowed;
    }

    /* Message action menu — open ABOVE the trigger (replaces legacy
       .conv-msg-container .dropdown .dropdown-menu rule with top:auto; bottom:100%) */
    .cb-msg-menu {
        top: auto;
        bottom: 100%;
    }

    /* Bot bubble action toolbar (Like / Edit / Copy / Code script row) */
    .cb-msg-actions {
        gap: 10px;
        flex-wrap: wrap;
        margin-top: 5px;
    }
    .cb-msg-action {
        font-size: 17px;
    }
    .cb-msg-action-icon {
        height: 95%;
    }
    .cb-msg-action-icon-edit {
        height: 80%;
    }
    .cb-msg-action-icon-copy,
    .cb-msg-action-icon-code {
        height: 85%;
    }

    /* Primary-colored action icons (replaces .text-primary on inline icon wrappers) */
    .cb-text-primary {
        color: var(--color-primary);
    }

    /* "Copied!" feedback cluster (replaces .div-center) */
    .cb-div-center {
        text-align: center;
    }
    .cb-copied-label {
        font-size: 10px;
    }

    /* ===== Dark mode (Step 4c) ===== */
    :global(.dark) .cb-day-title::before {
        background-color: rgb(55 65 81);
    }
    :global(.dark) .cb-day-title-text {
        background-color: rgb(55 65 81);
        color: rgb(229 231 235);
    }
    :global(.dark) .cb-bubble-thinking {
        background-color: color-mix(in srgb, var(--color-primary) 18%, rgb(31 41 55));
    }
    :global(.dark) .cb-msg-action-btn {
        color: rgb(156 163 175);
    }

    /* ===== 4d: Compose footer (mic, textarea wrapper, util links, send) ===== */

    /* Footer shell (replaces .chat-input-section) */
    .cb-input-section {
        padding: 0 2%;
        height: 8%;
        display: flex;
        flex-direction: column;
        justify-content: space-evenly;
    }
    .cb-input-hide {
        display: none;
        height: 2%;
    }

    /* Local copies of the legacy css-animation / fade-in-from-none helpers
       so the footer no longer depends on the global _animation.scss rules. */
    .cb-css-animation {
        animation-duration: 0.8s;
        animation-fill-mode: both;
    }
    .cb-fade-in {
        animation-name: cbFadeInFromNone;
    }
    @keyframes cbFadeInFromNone {
        from { opacity: 0; }
        to   { opacity: 1; }
    }

    /* Row layout (replaces Bootstrap .row + .col-auto + .col) */
    .cb-input-row {
        display: flex;
        flex-wrap: nowrap;
        align-items: center;
        gap: 0.75rem;
        width: 100%;
    }
    .cb-col-auto {
        flex: 0 0 auto;
    }
    .cb-col-grow {
        flex: 1 1 auto;
        min-width: 0;
    }
    .cb-position-relative {
        position: relative;
    }

    /* Round action buttons (replaces .btn.btn-rounded with primary/danger variants).
       Also replaces .chat-send (Bootstrap had no shared rule beyond btn). */
    .cb-btn {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        padding: 0.5rem 0.9rem;
        font-size: 0.9375rem;
        line-height: 1.2;
        border: 1px solid transparent;
        background: transparent;
        color: inherit;
        cursor: pointer;
        transition: background-color 0.15s ease, color 0.15s ease, box-shadow 0.15s ease, border-color 0.15s ease;
    }
    .cb-btn:disabled {
        opacity: 0.55;
        cursor: not-allowed;
    }
    .cb-btn-round {
        border-radius: 999px;
    }
    .cb-btn-primary {
        background-color: var(--color-primary);
        border-color: var(--color-primary);
        color: rgb(255 255 255);
    }
    .cb-btn-primary:hover:not(:disabled),
    .cb-btn-primary:focus:not(:disabled) {
        background-color: color-mix(in srgb, var(--color-primary) 88%, black 12%);
        border-color: color-mix(in srgb, var(--color-primary) 88%, black 12%);
    }
    .cb-btn-danger {
        background-color: var(--color-danger, #ef4444);
        border-color: var(--color-danger, #ef4444);
        color: rgb(255 255 255);
    }
    .cb-btn-danger:hover:not(:disabled),
    .cb-btn-danger:focus:not(:disabled) {
        background-color: color-mix(in srgb, var(--color-danger, #ef4444) 88%, black 12%);
        border-color: color-mix(in srgb, var(--color-danger, #ef4444) 88%, black 12%);
    }

    /* Send button — keep some horizontal padding for the label */
    .cb-btn-send {
        padding-left: 1rem;
        padding-right: 1rem;
    }
    /* Hidden label on small screens, inline on >=md (replaces .d-none.d-md-inline-block.me-2) */
    .cb-send-label {
        display: none;
        margin-right: 0.5rem;
    }
    @media (min-width: 768px) {
        .cb-send-label {
            display: inline-block;
        }
    }

    /* Microphone icon size (replaces .md-36) */
    .cb-md-36 {
        font-size: 36px;
        line-height: 1;
    }

    /* ===== Textarea: extra right padding to make room for util links
       (replaces .chat-more-util { padding-right: 5em }).
       Applied via className prop passed into ChatTextArea, which is rendered
       on the inner <textarea>; we need :global() because ChatTextArea is a
       scoped child component. */
    :global(.cb-textarea-more-util) {
        padding-right: 5em !important;
    }

    /* ===== Util uploader trigger (replaces .line-align-center.text-primary.chat-util-item).
       Applied via containerClasses prop on ChatFileUploader, which puts the class
       on a <div>; uses :global() for the same reason as cb-textarea-more-util. */
    :global(.cb-util-uploader) {
        display: flex;
        align-items: center;
        justify-content: center;
        text-align: center;
        font-size: 30px;
        color: var(--color-primary);
    }

    /* Util links cluster pinned over the right side of the textarea
       (replaces .chat-util-links) */
    .cb-util-links {
        display: flex;
        align-items: center;
        gap: 0.25rem;
        width: fit-content;
        position: absolute;
        right: 3px;
        top: 55%;
        transform: translateY(-50%);
        font-size: 160%;
        line-height: 36px;
        color: var(--color-primary);
    }

    /* ===== Dark mode (Step 4d) ===== */
    :global(.dark) .cb-btn-primary {
        color: rgb(255 255 255);
    }
    :global(.dark) .cb-btn-danger {
        color: rgb(255 255 255);
    }

    /* Markdown text color override applied via the markdownClasses prop on
       <RcMessage>; Markdown puts the class on its inner container, so
       :global() is required. Replaces Bootstrap .text-dark utility. */
    :global(.cb-md-dark) {
        color: var(--color-dark);
    }
</style>

