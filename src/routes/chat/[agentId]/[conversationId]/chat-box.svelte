<script>
	import { onDestroy, onMount, setContext, tick } from 'svelte';
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
	import Markdown from '$lib/common/markdown/Markdown.svelte';
	import Label from '$lib/common/shared/Label.svelte';
	import { realtimeChat } from '$lib/services/realtime-chat-service';
	import { webSpeech } from '$lib/services/web-speech';
	import LocalStorageManager from '$lib/helpers/utils/storage-manager';
	import { clickoutsideDirective } from '$lib/helpers/directives';
	import { delay, directToAgentPage, formatNumber, liveRunIdInText, liveViewInText } from '$lib/helpers/utils/common';
	import { AgentExtensions } from '$lib/helpers/utils/agent';
	import { utcToLocal } from '$lib/helpers/datetime';
	import { replaceNewLine } from '$lib/helpers/http';
	import { isAudio, isExcel, isPdf } from '$lib/helpers/utils/file';
	import { ChatAction, EditorType, FileSourceType, RichType, SenderAction, UserRole } from '$lib/helpers/enums';
	import ChatTextArea from './chat-util/chat-text-area.svelte';
	import RichContent from './rich-content/rich-content.svelte';
	import RcMessage from "./rich-content/rc-message.svelte";
	import RcDisclaimer from './rich-content/rc-disclaimer.svelte';
	import RcEmbedding from './rich-content/rc-embedding.svelte';
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
	/**
	 * Wall clock (ms) the progress line currently on screen started at, and its age in whole
	 * seconds. `progressSince === 0` means nothing is being timed — no wait has begun since
	 * the last user turn.
	 */
	let progressSince = $state(0);
	let progressElapsed = $state(0);
	/** How many DISTINCT progress lines this turn has produced, i.e. which step we are on. */
	let progressStep = $state(0);
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
	/** Within this many px of the bottom the thread counts as "at the bottom". */
	const BOTTOM_THRESHOLD_PX = 80;
	let isPinnedToBottom = $state(true);
	/*
	 * Incoming socket messages never move the viewport on their own. They only keep
	 * it at the bottom while the user has explicitly asked to follow along — by
	 * sending a message, or by pressing the jump button (including while a reply is
	 * still streaming, which is the point of it being clickable in that state).
	 * Scrolling away from the bottom cancels the follow.
	 */
	let followStream = $state(false);

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

	/*
	 * A wait shorter than this keeps the bare dots. They are the familiar shape of an ordinary
	 * turn, and a label plus a clock flashing up for one second is noise. Past it the wait is
	 * long enough that "is this still running?" becomes a real question, so the bubble starts
	 * answering it in words — even when nothing has told us WHAT is running.
	 */
	const SILENT_WAIT_SECONDS = 2;

	/** True once the bubble owes the reader words instead of dots. */
	let showProgressText = $derived(!!indication || progressElapsed >= SILENT_WAIT_SECONDS);

	$effect(() => {
		if (!isWaiting && !disableAction) {
			focusChatTextArea();
		}
	});

	/*
	 * The run still going behind the live-view link on screen.
	 *
	 * A planner's turn does not end until its whole plan does — the reason the link is pushed
	 * from a hook instead of written into the reply — so "this turn is still in flight" IS "the
	 * run is still going".
	 *
	 * A RUN ID rather than a flag, and that is not cosmetic. It used to be a boolean, on the
	 * grounds that at most one link is ever on screen — true when every link was a bare offer and
	 * hideSupersededLiveLinks kept only the newest. A flow execution breaks it: each step leaves a
	 * note carrying its own run, so a screen full of finished steps was labelled with the running
	 * one's icon. Only the LAST link can be the live one, so that is the only run this names.
	 *
	 * A soft signal, and it can be wrong for a few seconds after a reload mid-run, before the
	 * first progress push arrives. Tolerable because both mislabellings lead to the SAME page:
	 * one URL serves the live screen and the recording, and the executor renders whichever the
	 * run actually is. Only the sentence around the link is ever wrong, never the destination.
	 */
	let inFlightRunId = $derived.by(() => {
		if (!isWaiting) return null;

		const lastUser = dialogs.findLastIndex(msg => !BOT_SENDERS.includes(msg?.sender?.role || ''));
		const lastLink = dialogs.findLastIndex(msg => !!liveRunIdInText(msg?.rich_content?.message?.text || msg?.text));
		if (lastLink < 0 || lastLink <= lastUser) return null;

		return liveRunIdInText(dialogs[lastLink]?.rich_content?.message?.text || dialogs[lastLink]?.text);
	});

	/** When the live-view link on screen stops working, or null when nothing on screen expires. */
	let liveViewExpiresAt = $derived.by(() => {
		for (let i = dialogs.length - 1; i >= 0; i--) {
			const msg = dialogs[i];
			if (!BOT_SENDERS.includes(msg?.sender?.role || '')) continue;

			const view = liveViewInText(msg?.rich_content?.message?.text || msg?.text);
			if (view) return view.expiresAt;
		}
		return null;
	});

	/** Read by the render to decide whether the link is still worth offering. */
	let linkClock = $state(Date.now());

	/*
	 * Ages the live-view link every half minute.
	 *
	 * Its credential expires thirty minutes after it was minted and the executor refuses it
	 * from then on. Nothing pushes a message when that moment passes, so without a clock a link
	 * that died while the page sat open would go on presenting itself as openable — the same
	 * failure hideSupersededLiveLinks exists to prevent, reached from the other direction.
	 * Half a minute is finer than anyone can care about, and the timer stops itself once the
	 * link is spent, so an idle chat is not left ticking.
	 */
	$effect(() => {
		if (!liveViewExpiresAt) return;

		const timer = setInterval(() => {
			linkClock = Date.now();
			if (linkClock >= liveViewExpiresAt) clearInterval(timer);
		}, 30_000);
		return () => clearInterval(timer);
	});

	/*
	 * Ages the progress line once a second.
	 *
	 * The clock is what carries "still running" once the dots are gone: a browser task can sit
	 * on one step for a minute, and a static sentence in a bot-coloured bubble reads as a reply
	 * that has already arrived. Re-runs only when the clock starts, stops or restarts — the tick
	 * writes `progressElapsed`, which nothing in here reads, so it cannot re-trigger itself.
	 *
	 * Typing off and on again mid-turn pauses and resumes the same clock rather than restarting
	 * it, because `progressSince` is untouched: the number stays the age of the STEP, not of the
	 * latest gap in the signalling.
	 */
	$effect(() => {
		if (!isThinking || !progressSince) return;

		const tick = () => { progressElapsed = Math.floor((Date.now() - progressSince) / 1000); };
		tick();
		const timer = setInterval(tick, 1000);
		return () => clearInterval(timer);
	});

	/*
	 * Index rail: one tick per user message, in order. The preview pairs what the
	 * user asked with the start of the reply it got, which is what makes a tick
	 * recognisable — the question alone is often the same few words.
	 */
	let messageIndex = $derived.by(() => {
		/** @type {{ id: string, ordinal: number, text: string, reply: string }[]} */
		const entries = [];
		dialogs.forEach((msg, idx) => {
			if (BOT_SENDERS.includes(msg?.sender?.role || '') || !msg?.message_id) return;

			const reply = dialogs.slice(idx + 1).find(x => BOT_SENDERS.includes(x?.sender?.role || ''));
			entries.push({
				id: msg.message_id,
				ordinal: entries.length + 1,
				text: _.trim(msg.text || '') || '(no text)',
				reply: _.trim(reply?.rich_content?.message?.text || reply?.text || '')
			});
		});
		return entries;
	});

	let activeIndexId = $state('');
	/*
	 * The preview is a single fixed-position node rather than a child of each tick:
	 * the rail scrolls when a conversation has many turns, and any scrollable box
	 * clips what its children paint outside it, which hid the preview entirely.
	 */
	/** @type {{ entry: any, top: number, left: number } | null} */
	let indexPreview = $state(null);

	/**
	 * @param {any} entry
	 * @param {EventTarget | null} target
	 */
	function showIndexPreview(entry, target) {
		const rect = /** @type {HTMLElement} */ (target)?.getBoundingClientRect?.();
		if (!rect) return;
		indexPreview = {
			entry,
			top: rect.top + rect.height / 2,
			left: rect.right + 10
		};
	}

	function hideIndexPreview() {
		indexPreview = null;
	}

	/**
	 * Jump the thread to a user message, and take the log panes with it — the same
	 * thing clicking the bubble does, so the rail is a shortcut to that, not a
	 * second behaviour.
	 * @param {string} messageId
	 */
	function goToUserMessage(messageId) {
		const scrollbar = scrollbars[0];
		const target = document.querySelector(`#user-msg-${messageId}`);
		if (scrollbar && target) {
			const { viewport } = scrollbar.elements();
			// Offset by a bit so the message is not flush against the top edge.
			const top = viewport.scrollTop + target.getBoundingClientRect().top
				- viewport.getBoundingClientRect().top - 16;
			viewport.scrollTo({ top, behavior: 'smooth' });
			// A jump to history is a deliberate move away from the tail.
			followStream = false;
		}
		activeIndexId = messageId;
		directToLog(messageId);
	}

	/*
	 * Consumers (rich content options, the file gallery) call this when content
	 * they own appears — which for a bot reply means it fires right after a socket
	 * message. So it is deliberately NOT forced: it follows the thread only while
	 * the user is already at the bottom.
	 */
	setContext('chat-window-context', {
		autoScrollToBottom: () => autoScrollToBottom()
	});

	onDestroy(() => {
		scrollbars.forEach(scrollbar => scrollbar?.destroy?.());
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

		initScrollbar();
		await refresh(true);
		pinToBottomWhileSettling();

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

	function initScrollbar() {
		/** @type {HTMLElement | null} */
		const msgScrollElem = document.querySelector('.cb-msgs-scroll');
		if (msgScrollElem) {
			// @ts-ignore
			scrollbars = [OverlayScrollbars(msgScrollElem, options)];
			trackBottomProximity();
		}
	}

	/**
	 * New messages only pull the thread down while the user is already reading
	 * the bottom of it. Once they scroll up, auto-scroll stops fighting them and
	 * the "jump to latest" button takes over.
	 */
	function trackBottomProximity() {
		const scrollbar = scrollbars[0];
		if (!scrollbar) return;

		const { viewport } = scrollbar.elements();
		const update = () => {
			const distanceFromBottom = viewport.scrollHeight - viewport.scrollTop - viewport.clientHeight;
			isPinnedToBottom = distanceFromBottom <= BOTTOM_THRESHOLD_PX;
			if (!isPinnedToBottom) {
				followStream = false;
			}
			updateActiveIndex(viewport);
		};
		update();
		viewport.addEventListener('scroll', update, { passive: true });
		// Growing content moves the bottom away without firing a scroll event, so the
		// button would stay hidden while the thread quietly scrolls out of reach.
		new ResizeObserver(update).observe(viewport.firstElementChild || viewport);
	}

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

	/** @param {boolean} stopScroll */
	async function refresh(stopScroll = false) {
		// trigger UI render
		dialogs = await refreshDialogs();
		lastBotMsg = null;
		await tick();
		lastBotMsg = findLastBotMessage(dialogs);
		lastMsg = dialogs.slice(-1)[0];
		assignMessageDisclaimer(dialogs);
		groupedDialogs = groupDialogs(dialogs);
		await tick();

		if (!stopScroll) {
			autoScrollToBottom();
		}
    }

	/**
	 * The rail tracks the user messages themselves: the active tick is the last one
	 * whose bubble has come into view. Anchoring on the top edge instead marked the
	 * previous turn while its successor's question was plainly on screen.
	 * @param {HTMLElement} viewport
	 */
	function updateActiveIndex(viewport) {
		const viewportBottom = viewport.getBoundingClientRect().bottom;
		let current = '';
		for (const entry of messageIndex) {
			const el = document.querySelector(`#user-msg-${entry.id}`);
			if (!el) continue;
			// Ask for a little more than a sliver so a bubble just cresting the bottom
			// edge does not steal the highlight from the turn being read.
			if (el.getBoundingClientRect().top <= viewportBottom - 40) {
				current = entry.id;
			} else {
				break;
			}
		}
		const next = current || messageIndex[0]?.id || '';
		if (next === activeIndexId) return;

		activeIndexId = next;
		// A long conversation makes the rail itself scroll, so keep the active tick
		// inside it — otherwise the highlight is somewhere off the rail's own view.
		requestAnimationFrame(() => {
			const rail = document.querySelector('.cb-msg-index');
			const tick = document.querySelector('.cb-msg-index-tick-active');
			if (!rail || !tick || rail.scrollHeight <= rail.clientHeight) return;

			const railRect = rail.getBoundingClientRect();
			const tickRect = tick.getBoundingClientRect();
			if (tickRect.top < railRect.top || tickRect.bottom > railRect.bottom) {
				tick.scrollIntoView({ block: 'nearest' });
			}
		});
	}

	let _autoScrollScheduled = false;
	/**
	 * @param {boolean} force Scroll even when the user has scrolled away from the
	 * bottom — used by the explicit "jump to latest" button, never by new messages.
	 */
	function autoScrollToBottom(force = false) {
		if (force) {
			followStream = true;
		}
		if (!force && !isPinnedToBottom) return;
		if (_autoScrollScheduled) return;
		_autoScrollScheduled = true;
		requestAnimationFrame(() => {
			const scrollToBottom = () => {
				scrollbars.forEach(scrollbar => {
					if (!scrollbar) return;
					const { viewport } = scrollbar.elements();
					viewport.scrollTo({ top: viewport.scrollHeight, behavior: 'smooth' });
				});
				isPinnedToBottom = true;
				_autoScrollScheduled = false;
			};
			scrollToBottom();
		});
	}

	/**
	 * Keep the thread pinned to the very bottom while the initial layout settles.
	 * Async content (images, code blocks, mermaid diagrams) can grow the height
	 * after first paint, so a fixed delay isn't enough — a ResizeObserver re-pins
	 * on every height change using instant `scrollTop` writes (no animation, no
	 * visible scroll). Pinning stops as soon as the user interacts with the pane,
	 * or after a safety timeout, so it never fights manual scrolling.
	 * @param {number} timeoutMs
	 */
	function pinToBottomWhileSettling(timeoutMs = 3000) {
		const scrollbar = scrollbars[0];
		if (!scrollbar) return;

		const { viewport } = scrollbar.elements();
		const content = viewport.firstElementChild || viewport;
		const pin = () => { viewport.scrollTop = viewport.scrollHeight; };
		pin();

		const observer = new ResizeObserver(pin);
		observer.observe(content);

		/** @type {ReturnType<typeof setTimeout>} */
		let timer;
		const stop = () => {
			observer.disconnect();
			clearTimeout(timer);
			viewport.removeEventListener('wheel', stop);
			viewport.removeEventListener('pointerdown', stop);
			viewport.removeEventListener('keydown', stop);
		};
		viewport.addEventListener('wheel', stop, { passive: true });
		viewport.addEventListener('pointerdown', stop);
		viewport.addEventListener('keydown', stop);
		timer = setTimeout(stop, timeoutMs);
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

	/**
	 * The message with every line that carries a live-view link removed.
	 *
	 * A note about a browser task is a heading, what the task did, and a line offering the run.
	 * Those first two keep their value long after the third stops working, so anything that has
	 * to answer "is there anything here besides the link" or "show this without the link" needs
	 * the message minus that line. Line-wise, because the link always sits on one of its own —
	 * markdown puts it there and the producers all write it that way.
	 *
	 * @param {string | null | undefined} text
	 */
	function liveLinkFreeText(text) {
		return (text || '')
			.split('\n')
			.filter(line => !liveRunIdInText(line))
			.join('\n')
			.trim();
	}

	/**
	 * Is this message nothing but an offer of a live view?
	 *
	 * The distinction two things turn on. A note whose every line is the link has nothing left to
	 * say once a newer link exists, and nothing to lose when the app restates it in its own words.
	 * A note that ALSO reports something — a flow step's name and what it found — says that
	 * whether or not its link still works, so hiding it or rewriting it destroys the report.
	 *
	 * Not a match on the sentence: the producers word it differently, and one of them (OneFlow)
	 * words it two ways on purpose — "Watch this run", "Watch the action", "Replay the action".
	 * The shape that matters is not the wording but whether anything survives removing the link.
	 *
	 * @param {string | null | undefined} text
	 */
	function isBareLiveLink(text) {
		if (!liveRunIdInText(text)) return false;

		return liveLinkFreeText(text).length === 0;
	}

	/**
	 * Drops superseded live-view links — but only the notes that are nothing else.
	 *
	 * A bare link is pushed into the conversation each time a browser task starts, and they
	 * accumulate: a session that looks up three things leaves three identical-looking
	 * "Watch this run" lines, only the last of which leads anywhere. The URLs carry a
	 * short-lived single-run token, so an earlier one is a dead link dressed as a live
	 * one — and the reader has no way to tell them apart, since the sentence is the same
	 * every time. Clicking the wrong one is the whole cost.
	 *
	 * WHY IT IS NOT SIMPLY "EVERY MESSAGE HOLDING A LINK". It was, and that stopped being safe
	 * the moment a producer put a link INSIDE a message that also carries content. OneFlow's
	 * per-node notes do: each one is a step's heading and what that step found, with the link
	 * under it. Filtering on "holds a link" deleted those notes outright — a ten-node flow
	 * rendered as step 1, then a jump to the step running now, with every outcome in between
	 * gone from the screen while sitting intact in the server's history. Both premises above
	 * fail for them too: the sentences are NOT the same (a finished step's says it replays), and
	 * the reader CAN tell them apart, because each sits under its own numbered step.
	 *
	 * `latest` is still the newest link of ANY shape, so a bare one is superseded by a link that
	 * arrived inside a step note, which is the ordering a reader sees.
	 *
	 * THE SECOND RULE, and the only one that reads the run id: a note is superseded outright by a
	 * LATER note about the SAME run. That is the pair OneFlow writes around every web step — one
	 * when it starts ("Running in a browser now", with the link to watch) and one when it reports
	 * (the outcome, with the same link, which now replays). Both are real content so neither is
	 * bare, and the first went on offering to "take the controls" of a run that had already
	 * finished, directly above the note saying it had. Keyed on the id rather than on the wording
	 * because the id is a fact: the completion note carries the very same URL, so a step that
	 * reports twice collapses onto its last word without this having to know what that word is.
	 * A RETRIED node keeps both, correctly — the failed attempt has a run id of its own that never
	 * appears again, so its link stays where the reader can still open it.
	 *
	 * Hidden at render, not deleted: the messages stay in `dialogs` and in the server's
	 * history, so message ids, truncation indices and the content log are untouched, and
	 * a link comes back into view if a later one is ever truncated away.
	 *
	 * @param {import('$conversationTypes').ChatResponseModel[]} dialogs
	 */
	function hideSupersededLiveLinks(dialogs) {
		const texts = dialogs.map(msg => msg?.rich_content?.message?.text || msg?.text);
		const runIds = texts.map(text => liveRunIdInText(text));
		const latest = runIds.findLastIndex(id => !!id);

		// Nothing to supersede: zero or one live link. Returning the array as-is keeps the
		// common case — every conversation that never touches a browser task — free.
		if (latest < 0 || runIds.findIndex(id => !!id) === latest) return dialogs;

		const isBare = texts.map(isBareLiveLink);

		return dialogs.filter((_msg, idx) => {
			const runId = runIds[idx];
			if (!runId) return true;
			// Superseded by a later note about the SAME run: the step it opened has reported.
			if (runIds.lastIndexOf(runId) !== idx) return false;
			return !isBare[idx] || idx === latest;
		});
	}

	/** @param {import('$conversationTypes').ChatResponseModel[]} dialogs */
	function groupDialogs(dialogs) {
		if (!dialogs) return [];
		const format = 'MMM D, YYYY';
		// @ts-ignore
		return _.groupBy(hideSupersededLiveLinks(dialogs), (x) => {
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
		/*
		 * A turn opened by someone else — a CSR, or this user in another tab — never went
		 * through sendChatMessage, so this is the only place its progress gets cleared.
		 *
		 * Restricted to messages that are not ours on purpose. Our own send already reset
		 * synchronously; resetting again on the echo would risk landing after the turn's first
		 * indication and dropping the step it was announcing.
		 */
		if (message?.sender?.id && message.sender.id !== currentUser?.id) {
			resetProgress();
		}

		autoScrollLog = true;
		dialogs.push({
			...message,
			is_chat_message: true
		});
		refresh(!followStream);
		text = "";
    }

    /** @param {import('$conversationTypes').ChatResponseModel} message */
    function onMessageReceivedFromAssistant(message) {
		const isSameAsLast = dialogs[dialogs.length - 1]?.message_id === message.message_id
			&& dialogs[dialogs.length - 1]?.sender?.role === UserRole.Assistant
			&& !dialogs[dialogs.length - 1]?.is_appended;

		if (!message.is_streaming) {
			if (isSameAsLast) {
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
		} else if (isSameAsLast) {
			// The streamed bubble was created on the first BeforeReceiveLlmStreamMessage of the round,
			// so it carries the time the request started, not the time this reply was produced.
			// This event is the completed response, so take its timestamp.
			dialogs[dialogs.length - 1].created_at = message.created_at;
		}

		isStreaming = false;
		latestStateLog = message.states;
		refresh(!followStream);

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

		refresh(!followStream);

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
		refresh(!followStream);
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
					if (followStream) autoScrollToBottom();
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
						if (followStream) autoScrollToBottom();
						await delay(10);
					}
				}

				for (const char of item.text) {
					dialogs[dialogs.length - 1].text += char;
					refreshDialogs();
					if (followStream) autoScrollToBottom();
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
		refresh(!followStream);
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
				resetProgress();
				refresh();
			}
			isStopStreamClicked = false;
		});
	}

	/**
	 * Adopts `text` as what the agent is currently doing, if it is news.
	 *
	 * Each distinct line is one step: the backend pushes an indication per function call, and a
	 * browser task pushes one per browser step, so counting the changes here yields the step
	 * number without either side having to carry a counter. A resend of the line already showing
	 * is dropped rather than counted — it is not a new step, and it must not restart the clock
	 * that is the only sign a long step is still alive.
	 *
	 * @param {string} text
	 */
	function trackProgress(text) {
		if (!text || text === indication) return;

		indication = text;
		progressStep += 1;
		progressSince = Date.now();
		progressElapsed = 0;
	}

	/** Begins timing a wait, unless something is already being timed. */
	function startProgressClock() {
		if (progressSince) return;

		progressSince = Date.now();
		progressElapsed = 0;
	}

	/**
	 * Forgets the turn's progress.
	 *
	 * Only the end of a turn may call this — a new user message, or the user stopping the run.
	 * Anything finer-grained (a typing-off, a function returning) is a gap WITHIN a turn, and
	 * clearing on those is what left the bubble as three anonymous dots.
	 */
	function resetProgress() {
		indication = '';
		progressStep = 0;
		progressSince = 0;
		progressElapsed = 0;
	}

	/** `m:ss`. Minutes run past 60 rather than growing an hours field no run needs. */
	function formatElapsed(/** @type {number} */ seconds) {
		return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`;
	}

	/**
	 * Sticky by design: an indication is never cleared here, and typing-off no longer clears it
	 * either, so the last thing we were told survives the silence after it.
	 *
	 * That silence is the whole problem this handles. A web task is one indication followed by
	 * minutes of the executor working, and the old pairing of "clear on typing-off, only ever
	 * set on a fresh indication" left the entire run rendered as three dots. Keeping the line
	 * up means the reader can always see which step is outstanding; the clock beside it says
	 * how long it has been outstanding for.
	 *
	 * @param {import('$conversationTypes').ChatResponseModel} message
	 */
	function onIndicationReceived(message) {
		isThinking = true;
		startProgressClock();
		trackProgress((message.indication || '').split('|')[0]);
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
			startProgressClock();
		} else if (data?.sender_action == SenderAction.TypingOff) {
			// Label and clock deliberately survive. A single turn toggles typing off and on
			// between function calls, so this is not the end of anything — see resetProgress.
			isThinking = false;
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
		// Sending is a deliberate action by the user, so it still jumps the thread
		// down — unlike incoming socket messages, which never move the viewport.
		autoScrollToBottom(true);
		resetProgress();
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

	/**
	 * Deliberately still `window.open`, unlike the other "open in a new tab" buttons in this app
	 * (which now go through `openAppRoute`). Two reasons it cannot use the same treatment:
	 *
	 * - The button only renders when `isFrame`, i.e. this chat is inside the livechat IFRAME.
	 *   `isDesktop()` cannot answer there: Tauri injects `__TAURI_INTERNALS__` into the main
	 *   frame only, so a nested frame always reads as "browser" and the branch would never fire.
	 * - The target is the CURRENT path. Navigating the one desktop window to the page it is
	 *   already on is a reload, not a full-screen view — a change that would look like a fix and
	 *   do nothing. Escaping the frame needs a real answer (a Tauri window, or dropping the
	 *   surrounding chrome), not a redirect.
	 *
	 * So in the desktop shell this button is inert, and it is gated behind PUBLIC_DEBUG_MODE.
	 */
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
	disableBackdropClick={true}
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
			<div style="height: calc(100vh - var(--statusbar-height));">
				<div class="cb-panel-card" style="height: calc(100vh - var(--statusbar-height));">
					<div class="cb-head">
						<div class="cb-head-row">
							<div class="cb-head-left">
								<button
									type="button"
									class="cb-head-agent"
									title="Open agent detail"
									onclick={() => directToAgentPage(agent?.id)}
								>
									{#if agent?.icon_url}
									<span class="cb-vcenter">
										<img class="cb-head-agent-icon" src={agent.icon_url} alt="">
									</span>
									{/if}
									<span class="cb-head-agent-name cb-vcenter cb-ellipsis">{agent?.name || 'Unkown'}</span>
								</button>
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

					<div class={`cb-msgs-area cb-msgs-content ${!loadEditor ? 'cb-msgs-content-expand' : ''}`}>
						<!--
							Index rail: one tick per user message, oldest at the top, so the
							shape of the conversation is visible at a glance and any turn is
							one click away. Hovering a tick previews the turn; clicking it
							scrolls the thread there and points the log panes at the same
							message, exactly as clicking the bubble does.
						-->
						{#if messageIndex.length > 1}
							<nav class="cb-msg-index" aria-label="Conversation index">
								{#each messageIndex as entry (entry.id)}
									<button
										type="button"
										class="cb-msg-index-tick"
										class:cb-msg-index-tick-active={activeIndexId === entry.id}
										aria-label={`Go to message ${entry.ordinal}: ${entry.text.slice(0, 80)}`}
										onclick={() => goToUserMessage(entry.id)}
										onmouseenter={(e) => showIndexPreview(entry, e.currentTarget)}
										onmouseleave={() => hideIndexPreview()}
										onfocus={(e) => showIndexPreview(entry, e.currentTarget)}
										onblur={() => hideIndexPreview()}
									>
										<span class="cb-msg-index-bar"></span>
									</button>
								{/each}
							</nav>
						{/if}

						{#if indexPreview}
							<div
								class="cb-msg-index-preview"
								style={`top: ${indexPreview.top}px; left: ${indexPreview.left}px;`}
							>
								<span class="cb-msg-index-preview-user">{indexPreview.entry.text}</span>
								{#if indexPreview.entry.reply}
									<span class="cb-msg-index-preview-reply">{indexPreview.entry.reply}</span>
								{/if}
							</div>
						{/if}

						<div class="cb-msgs-scroll">
						<div class="cb-conv">
							<ul class="cb-conv-list">
								{#each Object.entries(groupedDialogs) as [createDate, dialogGroup]}
									<li>
										<div class="cb-day-title">
											<span class="cb-day-title-text">{createDate}</span>
										</div>
									</li>
									{#each dialogGroup as message}
										{@const messageText = message?.rich_content?.message?.text || message?.text}
										<!--
											A message that is NOTHING BUT a live-view offer. Not any message that happens to
											hold one: a flow step's note carries its heading and what the step found, with the
											link underneath, and that is the agent reporting — it belongs in a bubble beside
											the steps around it, not in the centred strip below, which said "the app is doing
											something" about three consecutive paragraphs of findings and left them ragged and
											out of line with the one step that had no link to show.
										-->
										{@const liveNote = BOT_SENDERS.includes(message.sender?.role) && isBareLiveLink(messageText)
											? liveViewInText(messageText)
											: null}
										{#if liveNote}
											{@const spent = !!liveNote.expiresAt && liveNote.expiresAt <= linkClock}
											{@const inFlight = !!inFlightRunId && liveNote.runId === inFlightRunId}
											<!--
												A live view is the app telling you what it is doing, not the agent
												talking to you, so it is not dressed as speech: no avatar, no bubble,
												no copy or edit actions. Sitting between two of the agent's own
												sentences, a bubble made it read as a third one — and one you might
												be expected to answer.

												Still rendered through Markdown so the link keeps its click handler,
												which is what opens the run beside the conversation instead of on
												top of it.
											-->
											<li class="cb-sys-note-row" id={'test_k' + message.message_id}>
												<div class="cb-sys-note" class:cb-sys-note-spent={spent}>
													<!--
														While the run is going: a screen being driven from somewhere
														else, which is exactly what is happening — a browser on the
														executor, operated with nobody in front of it. The broadcast
														icon this replaced read as "streaming to you", the wrong
														direction, and said nothing about taking the controls.

														Afterwards: the same URL, but what it opens is a recording, so
														it is labelled as one. Spent: no icon of an action, because
														there is no longer an action to offer.
													-->
													<i
														class={`mdi cb-sys-note-icon ${spent
															? 'mdi-link-off'
															: inFlight ? 'mdi-remote-desktop' : 'mdi-motion-play-outline'}`}
													></i>
													{#if spent}
														<!--
															Deliberately not a link. The credential in the URL is a 30-minute one and the
															executor refuses it now, so anything clickable here would lead to an error
															page — a dead link dressed as a live one is worse than an honest sentence.
														-->
														<span class="cb-sys-note-text">This run's recording has expired.</span>
													{:else if inFlight}
														<Markdown containerClasses={'cb-sys-note-text markdown-dark'} text={messageText} />
													{:else}
														<!--
															The agent's own sentence — "take the controls if needed" — is wrong once the
															run is over: there are no controls left to take. The URL is unchanged, because
															the executor's run page serves the recording from the same address; only what
															to expect on the other side is restated.
															
															Safe to restate ONLY because this branch is reached by notes that say nothing
															else — see the note on `liveNote` above. A step note keeps its own wording,
															which is already right for a finished run.
															
															Still rendered through Markdown, on markdown the UI wrote itself, so the link
															keeps the click handler that opens the run beside the conversation instead of
															on top of it.
														-->
														<Markdown
															containerClasses={'cb-sys-note-text markdown-dark'}
															text={`[Replay this session](${liveNote.url}) — every step the agent took`}
														/>
													{/if}
												</div>
											</li>
										{:else}
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
																id={`user-msg-${message.message_id}`}
															>
																<div class="cb-bubble-text-user font-libre">{@html replaceNewLine(message.text)}</div>
															</div>
														</div>
														<p class="cb-chat-time">
															<i class="bx bx-time-five cb-align-middle cb-chat-time-icon"></i>
															{utcToLocal(message.created_at, 'h:mm:ss A')}
														</p>
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
														<img
															class="cb-avatar"
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
													<!-- Embedded content belongs to the
														 message that produced it, so it renders inline here rather than in
														 the trailing <RichContent>, which only ever shows the last bot
														 message and would drop embeds on intermediate function-call turns. -->
													{#if message?.rich_content?.message?.rich_type === RichType.Embedding && editingBotMsgUid !== message.uuid}
														<RcEmbedding
															url={message?.rich_content?.message?.url}
															title={message?.rich_content?.message?.title}
															htmlTag={message?.rich_content?.message?.html_tag}
														/>
													{/if}
													{#if !!(message?.rich_content?.message?.text || message?.text) && editingBotMsgUid !== message.uuid}
														{@const isLastBotMsg = message?.message_id === lastBotMsg?.message_id && message?.uuid === lastBotMsg?.uuid}
														<!-- Suppressed while the last bot message is still streaming, so the timestamp
															 does not flicker in before the text has settled. -->
														{#if !isLastBotMsg || (!isStreaming && !isHandlingQueue && !isThinking)}
															<p class="cb-chat-time cb-chat-time-bot">
																<i class="bx bx-time-five cb-align-middle cb-chat-time-icon"></i>
																{utcToLocal(message.created_at, 'h:mm:ss A')}
															</p>
														{/if}
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
										{/if}
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
												{#if showProgressText}
													<!--
														One line, in reading order: what is being done, which step that
														is, how long the step has been going. The dots are deliberately
														absent here — the ticking clock already says "alive", and two
														things saying it made the bubble busier without being any more
														informative.

														Only the label is announced. A clock read out once a second is
														unusable with a screen reader and the step number is a nicety,
														so both sit in an aria-hidden group and the label carries the
														live region alone: one announcement per real step.
													-->
													<span class="cb-chat-indication" role="status" aria-live="polite">
														{indication || 'Working on it'}
													</span>
													<span class="cb-progress-meta" aria-hidden="true">
														{#if progressStep > 1}
															<span class="cb-progress-meta-item">Step {progressStep}</span>
														{/if}
														<span class="cb-progress-meta-item">{formatElapsed(progressElapsed)}</span>
													</span>
												{:else}
													<div class="cb-thinking-dots">
														<LoadingDots duration={'1s'} size={5} gap={5} color={'var(--color-primary)'} />
													</div>
												{/if}
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

						<!--
							Sticky, zero-height strip so the button floats over the last
							messages instead of reserving a row at the end of the thread.
						-->
						<div class="cb-jump-strip">
							{#if !isPinnedToBottom}
								<!--
									While a reply is in flight the button says so with pulsing
									dots: there is no "latest message" to jump to yet, only one
									on its way. It stays clickable throughout — pressing it
									still parks you at the bottom to watch the reply arrive.
								-->
								<button
									type="button"
									class="cb-jump-btn"
									class:cb-jump-btn-waiting={isWaiting}
									aria-label={isWaiting ? 'Waiting for reply; scroll to bottom' : 'Scroll to latest message'}
									title={isWaiting ? 'Waiting for reply' : 'Scroll to latest message'}
									onclick={() => autoScrollToBottom(true)}
								>
									{#if isWaiting}
										<span class="cb-jump-dots" aria-hidden="true">
											<span></span><span></span><span></span>
										</span>
									{:else}
										<i class="mdi mdi-chevron-down"></i>
									{/if}
								</button>
							{/if}
						</div>
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
				isWaiting={isWaiting}
				closeWindow={() => closePersistLog()}
				cleanScreen={() => cleanPersistLogScreen()}
			/>
		</Pane>
		{/if}
	</Splitpanes>
</div>



