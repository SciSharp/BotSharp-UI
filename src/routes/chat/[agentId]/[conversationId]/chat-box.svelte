<script>
	import { onMount, setContext, tick } from 'svelte';
	import { Pane, Splitpanes } from 'svelte-splitpanes';
	import Viewport from 'svelte-viewport-info';
	import { page } from '$app/stores';
	import Swal from 'sweetalert2';
	import 'overlayscrollbars/overlayscrollbars.css';
    import { OverlayScrollbars } from 'overlayscrollbars';
	import _ from "lodash";
	import moment from 'moment';
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
		conversationUserAttachmentStore,
		resetLocalStorage
	} from '$lib/helpers/store.js';
	import {
		sendMessageToHub,
		GetDialogs,
		deleteConversationMessage,
		getConversationFiles,
		getConversationUser,
		uploadConversationFiles,
		getAddressOptions
	} from '$lib/services/conversation-service.js';
	import { 
		PUBLIC_LIVECHAT_ENTRY_ICON, 
		PUBLIC_LIVECHAT_VOICE_ENABLED,
		PUBLIC_LIVECHAT_FILES_ENABLED,
	} from '$env/static/public';
	import { BOT_SENDERS, LERNER_ID, TEXT_EDITORS, TRAINING_MODE, USER_SENDERS } from '$lib/helpers/constants';
	import { signalr } from '$lib/services/signalr-service.js';
	import { webSpeech } from '$lib/services/web-speech.js';
	import { newConversation } from '$lib/services/conversation-service';
	import DialogModal from '$lib/common/DialogModal.svelte';
	import HeadTitle from '$lib/common/HeadTitle.svelte';
	import LoadingDots from '$lib/common/LoadingDots.svelte';
	import StateModal from '$lib/common/StateModal.svelte';
	import ChatTextArea from './chat-util/chat-text-area.svelte';
	import AudioSpeaker from '$lib/common/audio-player/AudioSpeaker.svelte';
	import { utcToLocal } from '$lib/helpers/datetime';
	import { replaceNewLine } from '$lib/helpers/http';
	import { isAudio, isExcel, isPdf } from '$lib/helpers/utils/file';
	import { ChatAction, EditorType, FileSourceType, SenderAction, UserRole } from '$lib/helpers/enums';
	import RichContent from './rich-content/rich-content.svelte';
	import RcMessage from "./rich-content/rc-message.svelte";
	import RcDisclaimer from './rich-content/rc-disclaimer.svelte';
	import MessageFileGallery from '$lib/common/MessageFileGallery.svelte';
	import ChatUtil from './chat-util/chat-util.svelte';
	import ChatFileUploader from './chat-util/chat-file-uploader.svelte';
	import ChatFileGallery from './chat-util/chat-file-gallery.svelte';
	import ChatBigMessage from './chat-util/chat-big-message.svelte';
	import PersistLog from './persist-log/persist-log.svelte';
	import InstantLog from './instant-log/instant-log.svelte';
	import Loader from '$lib/common/Loader.svelte';
	
	
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
	const maxTextLength = 4096;
	
	/** @type {import('$agentTypes').AgentModel} */
	export let agent;

	/** @type {import('$userTypes').UserModel} */
	export let currentUser;

	/** @type {string} */
	let text = "";
	let editText = "";
	let bigText = "";
	let truncateMsgId = "";
	let indication = "";
	let mode = '';

	/** @type {number} */
	let messageInputTimeout;
	let sentMsgIdx = 0;

	/** @type {string[]} */
	let prevSentMsgs = [];
	/** @type {string[]} */
	let chatUtilOptions = [];
	
	/** @type {any[]} */
    let scrollbars = [];
	let microphoneIcon = "microphone-off";

	/** @type {import('$conversationTypes').ChatResponseModel?} */
	let lastBotMsg;

	/** @type {import('$conversationTypes').ChatResponseModel?} */
	let lastMsg;

    /** @type {import('$conversationTypes').ChatResponseModel[]} */
    let dialogs = [];
	/** @type {{ [s: string]: any; }} */
	let groupedDialogs = [];
	
	/** @type {import('$conversationTypes').ConversationContentLogModel[]} */
	let contentLogs = [];

	/** @type {import('$conversationTypes').ConversationStateLogModel[]} */
	let convStateLogs = [];

	/** @type {import('$conversationTypes').ConversationStateLogModel?} */
	let latestStateLog;

	/** @type {import('$conversationTypes').MessageStateLogModel[]} */
	let msgStateLogs = [];

	/** @type {import('$conversationTypes').AgentQueueLogModel[]} */
	let agentQueueLogs = [];

	/** @type {import('$conversationTypes').UserStateDetailModel[]} */
	let userAddStates = [];

	/** @type {import('$userTypes').UserModel} */
    let conversationUser;

	/** @type {boolean} */
	let isLoadPersistLog = false;
	let isLoadInstantLog = false;
	let isPersistLogClosed = false; // initial condition
	let isInstantLogClosed = false; // initial condition
	let isOpenEditMsgModal = false;
	let isOpenBigMsgModal = false;
	let isOpenUserAddStateModal = false;
	let isSendingMsg = false;
	let isThinking = false;
	let isLite = false;
	let isFrame = false;
	let loadEditor = false;
	let loadTextEditor = false;
	let autoScrollLog = false;
	let disableAction = false;
	let loadChatUtils = false;
	let disableSpeech = false;
	let isLoading = false;
	let isCreatingNewConv = false;
	
	$: {
		const editor = lastBotMsg?.rich_content?.editor || '';
		loadTextEditor = TEXT_EDITORS.includes(editor) || !Object.values(EditorType).includes(editor);
		loadEditor = !isSendingMsg && !isThinking && loadTextEditor;
	}

	$: {
		disableAction = currentUser?.role !== UserRole.Admin && currentUser?.id !== conversationUser?.id;
	}

	setContext('chat-window-context', {
		autoScrollToBottom: autoScrollToBottom
	});
	
	onMount(async () => {
		disableSpeech = navigator.userAgent.includes('Firefox');
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
		resetLocalStorage(true);
	}

	/** @param {any} e */
	function handleNewChatAction(e) {
		if (!isCreatingNewConv && !isThinking && !isSendingMsg) {
			isCreatingNewConv = true;
			createNewConversation().then(async conv => {
				isCreatingNewConv = false;
				if (conv && !!e.data.text) {
					dialogs = [];
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
	function sendReceivedMessage(message) {
		if (isFrame) {
			window.parent.postMessage({ action: ChatAction.ReceiveMsg, data: message }, "*");
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
		}
	}

	function initChatView() {
		isFrame = window.location != window.parent.location;
		mode = $page.url.searchParams.get('mode') || '';
		// initial condition
		isPersistLogClosed = false;
		isInstantLogClosed = false;
		resizeChatWindow();
	}

	/** @param {import('$conversationTypes').ChatResponseModel[]} dialogs */
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

	/** @param {import('$conversationTypes').ChatResponseModel[]} dialogs */
	function findLastBotMessage(dialogs) {
		const lastMsg = dialogs.slice(-1)[0];
		return BOT_SENDERS.includes(lastMsg?.sender?.role || '') ? lastMsg : null;
	}

	async function refresh() {
		// trigger UI render
		dialogs = dialogs?.map(item => { return { ...item }; }) || [];
		lastBotMsg = null;
		await tick();
		lastBotMsg = findLastBotMessage(dialogs);
		lastMsg = dialogs.slice(-1)[0];
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

	/** @param {import('$conversationTypes').ChatResponseModel[]} dialogs */
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

	/** @param {import('$conversationTypes').ChatResponseModel[]} dialogs */
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
		return $conversationUserAttachmentStore?.accepted_files || [];
	}


	/** @param {import('$conversationTypes').ChatResponseModel} message */
	function onMessageReceivedFromClient(message) {
		dialogs.push({
			...message,
			is_chat_message: true
		});
		refresh();
		text = "";
    }

    /** @param {import('$conversationTypes').ChatResponseModel} message */
    function onMessageReceivedFromCsr(message) {
		dialogs.push({
			...message,
			is_chat_message: true
		});
		refresh();
    }

    /** @param {import('$conversationTypes').ChatResponseModel} message */
    function onMessageReceivedFromAssistant(message) {
		// webSpeech.utter(message.text);
		dialogs.push({
			...message,
			is_chat_message: true
		});
		sendReceivedMessage(message);
		refresh();
    }

	/** @param {import('$conversationTypes').ConversationContentLogModel} log */
	function onConversationContentLogGenerated(log) {
		if (!isLoadPersistLog) return;
		contentLogs.push({ ...log });
		contentLogs = contentLogs.map(x => { return { ...x }; });
	}

	/** @param {import('$conversationTypes').ConversationStateLogModel} log */
	function onConversationStateLogGenerated(log) {
		if (!isLoadPersistLog) return;

		latestStateLog = log;
		convStateLogs.push({ ...log });
		convStateLogs = convStateLogs.map(x => { return { ...x }; });
	}

	/** @param {import('$conversationTypes').MessageStateLogModel} log */
	function onStateChangeGenerated(log) {
		if (!isLoadInstantLog || log == null) return;

		msgStateLogs.push({ ...log });
		msgStateLogs = msgStateLogs.map(x => { return { ...x }; });
	}

	/** @param {import('$conversationTypes').AgentQueueLogModel} log */
	function onAgentQueueChanged(log) {
		if (!isLoadInstantLog || log == null) return;

		agentQueueLogs.push({ ...log });
		agentQueueLogs = agentQueueLogs.map(x => { return { ...x }; });
	}

	/** @param {import('$conversationTypes').ConversationSenderActionModel} data */
	function onSenderActionGenerated(data) {
		if (data?.sender_action == SenderAction.TypingOn) {
			isThinking = true;
			const retIndication = data.indication || '';
			indication = retIndication.split('|')[0];
		} else if (data?.sender_action == SenderAction.TypingOff) {
			isThinking = false;
			indication = '';
		}
	}

	/** @param {import('$conversationTypes').ConversationMessageDeleteModel} data */
	function onConversationMessageDeleted(data) {
		if (!!!data?.message_id) return;

		truncateDialogs(data.message_id);
	}

	async function handleNewConversation() {
		const conv = await createNewConversation();
		redirectToNewConversation(conv);
	}

	async function createNewConversation() {
		const conversation = await newConversation(params.agentId);
        conversationStore.put(conversation);
		return conversation;
	}

	/** @param {import('$conversationTypes').ConversationModel} conversation */
	function redirectToNewConversation(conversation) {
		const url = new URL(`chat/${params.agentId}/${conversation.id}`, window.location.origin);
		const searchParams = $page.url.searchParams;
		url.search = searchParams?.toString();
		window.location.href = url.toString();
	}

	function handleSaveKnowledge() {
		sendChatMessage("Save knowledge");
	}

    /**
	 * @param {string} msgText
	 * @param {import('$conversationTypes').MessageData?} data
	 * @param {string?} conversationId
	 */
    function sendChatMessage(msgText, data = null, conversationId = null) {
		isSendingMsg = true;
		autoScrollLog = true;
		clearInstantLogs();		
		renewUserSentMessages(msgText);
		const agentId = params.agentId;
		const convId = conversationId || params.conversationId;

		let postback = data?.postback;
		if (!postback) {
			postback = buildPostbackMessage(dialogs, data?.payload || msgText, data?.truncateMsgId);
		}

		/** @type {import('$conversationTypes').MessageData?} */
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
			const filePayload = buildFilePayload(files);
			return new Promise((resolve, reject) => {
				uploadConversationFiles(agentId, convId, files).then(resMessageId => {
					messageData = { ...messageData, inputMessageId: resMessageId };
					if (!!filePayload) {
						messageData = {
							...messageData,
							// @ts-ignore
							postback: {
								...postback,
								payload: `${postback?.payload || msgText || ''}\r\n${filePayload}`
							}
						};
					}

					sendMessageToHub(agentId, convId, msgText, messageData).then(res => {
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
				if (!!messageData?.inputMessageId) {
					getConversationFiles(convId, messageData.inputMessageId, FileSourceType.User).then(retFiles => {
						const filePayload = buildFilePayload(retFiles);
						if (!!filePayload) {
							messageData = {
								...messageData,
								// @ts-ignore
								postback: {
									...postback,
									payload: `${postback?.payload || msgText || ''}\r\n${filePayload}`
								}
							};
						}

						sendMessageToHub(agentId, convId, msgText, messageData).then(res => {
							resolve(res);
						}).catch(err => {
							reject(err);
						}).finally(() => {
							isSendingMsg = false;
							autoScrollLog = false;
						});
					});
				} else {
					sendMessageToHub(agentId, convId, msgText, messageData).then(res => {
						resolve(res);
					}).catch(err => {
						reject(err);
					}).finally(() => {
						isSendingMsg = false;
						autoScrollLog = false;
					});
				}
			});
		}
    }

    async function startListen() {
		if (disableSpeech) return;

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

	/** @param {any} e */
    function handleMessageInput(e) {
        const value = e.target.value;
        if (!!!_.trim(value)) {
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

		await sendChatMessage(title, { payload: payload });
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
		const conversationUserStates = conversationUserStateStore.get(params.conversationId);
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
		}).then(async (result) => {
			if (result.value) {
				userAddStates = [];
				conversationUserStateStore.resetOne(params.conversationId);
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
		resetStorage();
		await deleteConversationMessage(params.conversationId, messageId);
		isSendingMsg = false;
	}

	/**
	 * @param {any} e
	 * @param {import('$conversationTypes').ChatResponseModel} message
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
			latestStateLog = convStateLogs.slice(-1)[0];
		}
	}

	/** @param {string} messageId */
	function directToLog(messageId) {
		if (!!!messageId || isLite || !isLoadPersistLog) return;

		highlightChatMessage(messageId);
		highlightStateLog(messageId);
		autoScrollToTargetLog(messageId);
	}

	/** @param {string} messageId */
	function highlightChatMessage(messageId) {
		const targets = document.querySelectorAll('.user-msg');
		const style = ['bg-danger', 'text-white'];
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
		window.open($page.url.pathname);
	}

	function clearInstantLogs() {
		msgStateLogs = [];
		agentQueueLogs = [];
		latestStateLog = null;
	}

	function resetStorage() {
		conversationUserAttachmentStore.reset();
	}

	function toggleBigMessageModal() {
		isOpenBigMsgModal = !isOpenBigMsgModal;
		if (!isOpenBigMsgModal) {
			bigText = '';
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
</script>


<svelte:window on:resize={() => resizeChatWindow()}/>

{#if isLoading}
	<Loader size={35} />
{/if}

<DialogModal
	title={'Edit message'}
	size={'md'}
	isOpen={isOpenEditMsgModal}
	toggleModal={() => toggleEditMsgModal()}
	confirm={() => confirmEditMsg()}
	cancel={() => toggleEditMsgModal()}
	disableConfirmBtn={!!!_.trim(editText)}
>
	<textarea class="form-control chat-input" rows="5" maxlength={maxTextLength} bind:value={editText} placeholder="Enter Message..." />
	<div class="text-secondary text-end text-count">
		<div>{`${(editText?.length || 0)}/${maxTextLength}`}</div>
	</div>
</DialogModal>

<DialogModal
	title={'Send message'}
	size={'xl'}
	isOpen={isOpenBigMsgModal}
	toggleModal={() => toggleBigMessageModal()}
	confirm={() => sendBigMessage()}
	cancel={() => toggleBigMessageModal()}
	disableConfirmBtn={!!!_.trim(bigText)}
>
	<textarea class="form-control chat-input" rows="25" maxlength={maxTextLength} bind:value={bigText} placeholder="Enter Message..." />
	<div class="text-secondary text-end text-count">
		<div>{`${(bigText?.length || 0)}/${maxTextLength}`}</div>
	</div>
</DialogModal>

<StateModal
	isOpen={isOpenUserAddStateModal}
	bind:states={userAddStates}
	requireActiveRounds
	toggleModal={() => toggleUserAddStateModal()}
	confirm={() => handleConfirmUserAddStates()}
	cancel={() => toggleUserAddStateModal()}
/>

<HeadTitle title="Chat" addOn='' />
<div class="d-lg-flex">
	<Splitpanes>
		{#if isLoadInstantLog}
		<Pane size={30} minSize={20} maxSize={50} >
			<InstantLog
				bind:msgStateLogs={msgStateLogs}
				bind:agentQueueLogs={agentQueueLogs}
				latestStateLog={latestStateLog?.message_id === lastMsg?.message_id ? latestStateLog : null}
				agent={agent}
				closeWindow={() => closeInstantLog()}
			/>
		</Pane>
		{/if}
		<Pane minSize={20}>
			<div style="height: 100vh;">
				<div class="card mb-0" style="height: 100vh;">
					<div class="border-bottom chat-head">
						<div class="row chat-row">
							<div class="col-md-4 col-7 chat-head-info">
								<div class="chat-head-agent">
									{#if agent?.icon_url}
									<img class="chat-head-agent-icon" src={agent.icon_url} alt="">
									{/if}
									<div class="chat-head-agent-name">{agent?.name || 'Unkown'}</div>
								</div>
								<div class="text-muted mb-0 chat-head-user">
									<div>
										<i class="mdi mdi-circle text-success align-middle" />
									</div>
									<div>
										<span>{conversationUser?.full_name || conversationUser?.user_name || ''}</span>
									</div>
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
												{#if !isLite && (!isLoadPersistLog || !isLoadInstantLog)}
												<DropdownItem on:click={() => openLogs()}>View Log</DropdownItem>
												{/if}
												{#if !isLite && (!isLoadInstantLog || !isOpenUserAddStateModal)}
												<li>
													<Dropdown direction="right" class="state-menu">
														<DropdownToggle caret class="dropdown-item">
															States
														</DropdownToggle>
														<DropdownMenu>
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
												<DropdownItem on:click={() => handleNewConversation()}>New Conversation</DropdownItem>
												{#if agent?.id === LERNER_ID && mode === TRAINING_MODE}
												<DropdownItem on:click={() => handleSaveKnowledge()}>Save Knowledge</DropdownItem>
												{/if}
											</DropdownMenu>
										</Dropdown>
									</li>
									
									<li class="list-inline-item d-md-inline-block">
										<button
											class={`btn btn-rounded btn-sm chat-send waves-effect waves-light ${mode === TRAINING_MODE ? 'btn-danger' : 'btn-primary'}`}
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
														tabindex="0"
														aria-label="user-msg-to-log"
														role="link"
														on:keydown={() => {}}
														on:click={() => directToLog(message.message_id)}
													>
														<div class="ctext-wrap user-msg" 
															class:clickable={!isLite && isLoadPersistLog}
															id={`user-msg-${message.message_id}`}
														>
															<div class="text-start fw-bold">{@html replaceNewLine(message.text)}</div>
														</div>
														<p class="chat-time mb-0 float-end">
															<i class="bx bx-time-five align-middle me-1" />
															{utcToLocal(message.created_at, 'hh:mm A')}
														</p>
													</div>
													{#if !!message.post_action_disclaimer}
														<RcDisclaimer content={message.post_action_disclaimer} />
													{/if}
													{#if !!message.is_chat_message || !!message.has_message_files}
														<MessageFileGallery
															messageId={message?.message_id}
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
												<div class="cicon-wrap align-content-end">
													{#if message.sender.role == UserRole.Client}
														<img src="images/users/user-dummy.jpg" class="rounded-circle avatar-sm" style="margin-bottom: -15px;" alt="avatar">
													{:else}
														<img src={PUBLIC_LIVECHAT_ENTRY_ICON} class="rounded-circle avatar-sm" style="margin-bottom: -15px;" alt="avatar">
													{/if}
												</div>
												<div class="msg-container">
													<RcMessage message={message} />
													{#if message?.message_id === lastBotMsg?.message_id}
														<div style="display: flex; gap: 10px;">
															<AudioSpeaker
																id={message?.message_id} 
																text={message?.rich_content?.message?.text || message?.text}
															/>
															{#if message?.function}
																<div class="line-align-center" style="font-size: 17px;">
																	<!-- svelte-ignore a11y-click-events-have-key-events -->
																	<!-- svelte-ignore a11y-no-static-element-interactions -->
																	<div
																		class="clickable"
																		style="height: 95%;"
																		on:click={e => likeMessage(e, message)}
																	>
																		<i
																			class="mdi mdi-thumb-up-outline text-primary"
																		/>
																	</div>
																</div>
															{/if}
														</div>
													{/if}
													{#if !!message.is_chat_message || !!message.has_message_files}
														<MessageFileGallery
															messageId={message?.message_id}
															galleryStyles={'justify-content: flex-start;'}
															fetchFiles={() => getConversationFiles(params.conversationId, message.message_id, FileSourceType.Bot)}
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
													<LoadingDots duration={'1s'} size={10} gap={5} color={'var(--bs-primary)'} />
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
									disabled={isSendingMsg || isThinking}
									onConfirm={(title, payload) => confirmSelectedOption(title, payload)}
								/>
							{/if}
						</div>
					</div>

					<div class={`chat-input-section css-animation ${!loadEditor ? 'chat-input-hide' : 'fade-in-from-none'}`}>
						<div class="row">
							<div class="col-auto">
								{#if !disableSpeech}
									<button
										type="submit"
										class={`btn btn-rounded waves-effect waves-light ${mode === TRAINING_MODE ? 'btn-danger' : 'btn-primary'}`}
										disabled={isSendingMsg || isThinking || disableAction || PUBLIC_LIVECHAT_VOICE_ENABLED != 'true'}
										on:click={() => startListen()}
									>
										<i class="mdi mdi-{microphoneIcon} md-36" />
									</button>
								{/if}
							</div>
							<div class="col">
								<div class="position-relative">
									<ChatTextArea
										className={`chat-input ${!isLite ? 'chat-more-util' : ''}`}
										maxLength={maxTextLength}
										disabled={isSendingMsg || isThinking || disableAction}
										bind:text={text}
										bind:loadUtils={loadChatUtils}
										bind:options={chatUtilOptions}
										onTextInput={e => handleMessageInput(e)}
										onKeyDown={e => onSendMessage(e)}
										onFocus={e => chatUtilOptions = []}
										onOptionClick={op => handleChatOptionClick(op)}
									>
										<ChatFileUploader
											accept={'.png,.jpg,.jpeg'}
											containerClasses={'line-align-center text-primary chat-util-item'}
											disabled={disableAction}
											on:filedroped={() => refresh()}
										>
											<span>
												<i
													class="bx bx-image-add"
													data-bs-toggle="tooltip"
													data-bs-placement="top"
													title="Upload images"
												/>
											</span>
										</ChatFileUploader>
										<ChatFileUploader
											accept={'.pdf,.xlsx,.xls,.csv'}
											containerClasses={'line-align-center text-primary chat-util-item'}
											disabled={disableAction}
											on:filedroped={() => refresh()}
										>
											<span>
												<i
													class="bx bxs-folder-open"
													data-bs-toggle="tooltip"
													data-bs-placement="top"
													title="Upload pdf, excel files"
												/>
											</span>
										</ChatFileUploader>
										<ChatFileUploader
											accept={'.wav,.mp3'}
											containerClasses={'line-align-center text-primary chat-util-item'}
											disabled={disableAction}
											on:filedroped={() => refresh()}
										>
											<span>
												<i
													class="bx bxs-music"
													data-bs-toggle="tooltip"
													data-bs-placement="top"
													title="Upload audios"
												/>
											</span>
										</ChatFileUploader>
									</ChatTextArea>
									<div class="chat-util-links">
										{#if !isLite}
										<ChatBigMessage
											disabled={disableAction}
											on:click={() => toggleBigMessageModal()}
										/>
										{/if}
										<ChatUtil disabled={disableAction || PUBLIC_LIVECHAT_FILES_ENABLED != 'true'} on:click={() => loadChatUtils = true} />
									</div>
								</div>
							</div>
							<div class="col-auto">
								<button
									type="submit"
									class={`btn btn-rounded chat-send waves-effect waves-light ${mode === TRAINING_MODE ? 'btn-danger' : 'btn-primary'}`}
									disabled={!!!_.trim(text) || isSendingMsg || isThinking || disableAction}
									on:click={() => sentTextMessage()}
								>
									<span class="d-none d-md-inline-block me-2">Send</span>
									<i class="mdi mdi-send" />
								</button>
							</div>
						</div>
					</div>
				</div>
			</div>
		</Pane>
		{#if isLoadPersistLog}
		<Pane size={30} minSize={20} maxSize={50}>
			<PersistLog
				bind:contentLogs={contentLogs}
				bind:convStateLogs={convStateLogs}
				bind:lastestStateLog={latestStateLog}
				autoScroll={autoScrollLog}
				closeWindow={() => closePersistLog()}
				cleanScreen={() => cleanPersistLogScreen()}
			/>
		</Pane>
		{/if}
	</Splitpanes>
</div>
