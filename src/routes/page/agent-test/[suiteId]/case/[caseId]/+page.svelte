<script>
	import { onMount, untrack } from 'svelte';
	import { _ } from 'svelte-i18n';
	import { page } from '$app/state';
	import { goto } from '$app/navigation';
	import Breadcrumb from '$lib/common/shared/Breadcrumb.svelte';
	import HeadTitle from '$lib/common/shared/HeadTitle.svelte';
	import LoadingToComplete from '$lib/common/spinners/LoadingToComplete.svelte';
	import Select from '$lib/common/dropdowns/Select.svelte';
	import { getSuite, getCase, createCase, updateCase, getMockTargets, authorCase } from '$lib/services/agent-test-service.js';
	import { getAgentOptions } from '$lib/services/agent-service.js';
	import { getLlmConfigs } from '$lib/services/llm-provider-service';
	import { LlmModelCapability, LlmModelType } from '$lib/helpers/enums';
	import {
		ASSERTION_TYPES,
		AGENT_CHAIN_MODES,
		HISTORY_ROLES,
		CASE_PRIORITIES,
		CASE_SEVERITIES,
		CASE_BATCHES,
		effectiveBatch,
		validateAssertion,
		validateCaseType,
		isParsableJson,
		errorMessage,
		t
	} from '$lib/helpers/utils/agent-test.js';

	const duration = 3000;
	const nameMaxLength = 200;

	/** Assertion types as Select options. Constant -- the list never changes at runtime. */
	const ASSERTION_TYPE_OPTIONS = ASSERTION_TYPES.map(name => ({ label: name, value: name }));
	const AGENT_CHAIN_MODE_OPTIONS = AGENT_CHAIN_MODES.map(name => ({ label: name, value: name }));

	let isLoading = $state(false);
	let isComplete = $state(false);
	let isError = $state(false);
	let successText = $state('');
	let errorText = $state('');

	/** @type {string | null} */
	let loadErrorText = $state(null);

	let suiteId = $derived(page.params.suiteId);
	let caseId = $derived(page.params.caseId);
	let isNew = $derived(caseId === 'new');

	/** @type {import('$agentTestTypes').AgentTestSuite | null} */
	let suite = $state(null);

	/**
	 * Function names per agent id, for the mock and tool-assertion pickers.
	 *
	 * Keyed by agent rather than held as one flat list because one case can reach past the suite's
	 * agent: it can enter on a different one, and the negative form of a routing assertion
	 * (`toolNotCalled` on the signature tool of the agent the conversation must stay away from) names
	 * a tool that by definition belongs to someone else.
	 * @type {Record<string, string[]>}
	 */
	let mockTargetsByAgent = $state({});

	let isSaving = $state(false);

	/* ------------------------------------------------------------------
	 * Authoring chat
	 *
	 * The draft lives in `form`, exactly as it does when a human types it, so everything downstream
	 * -- validationErrors, buildPayload, the save button -- works on a chat-authored case without
	 * knowing a chat exists. The server keeps no session: the whole message log and the whole draft
	 * go up on every turn.
	 * ------------------------------------------------------------------ */

	let isChatOpen = $state(false);

	/** @type {import('$agentTestTypes').AuthorChatMessage[]} */
	let chatMessages = $state([]);
	let chatInput = $state('');
	let isAuthoring = $state(false);

	/** @type {any[]} */
	let llmConfigs = $state([]);

	/**
	 * Model the chat authors with. Null means "use the suite's judge model" -- the same fallback
	 * ICaseAuthor.ResolveModel applies server-side, so leaving this unset behaves exactly like
	 * today's default and only needs a picker at all because plenty of suites have no judge model
	 * configured yet, and going to Settings to set one is a detour this page can remove.
	 * @type {import('$agentTestTypes').TestModel | null}
	 */
	let chatModel = $state(null);

	/** @type {import('$agentTestTypes').AuthorChange[]} */
	let authorChanges = $state([]);
	/** @type {string[]} */
	let authorWarnings = $state([]);
	/** @type {string[]} */
	let authorErrors = $state([]);
	/** @type {string | null} */
	let authorErrorText = $state(null);

	/**
	 * Previous drafts, newest last. Undo is entirely local -- no server call and no model call, so
	 * backing out a bad suggestion costs nothing and cannot fail.
	 * @type {any[]}
	 */
	let draftHistory = $state([]);

	/** Field names the last authoring turn touched, badged on the matching section until the next turn. */
	let changedFields = $derived(authorChanges.map(c => c.field));

	/**
	 * Flattened provider/model options for the chat's model Select -- the same shape the suite
	 * page's record modal builds from the same /llm-provider catalogue, because it is the same
	 * choice (which chat-capable model backs one AI call) made in a second place.
	 */
	let chatModelOptions = $derived(
		llmConfigs.flatMap(cfg => (cfg.models || [])
			.filter(isChatModel)
			.map((/** @type {any} */ m) => ({ label: `${cfg.provider} / ${m.name}`, value: `${cfg.provider}/${m.name}` })))
	);

	// Cast for the same reason buildPayload() is cast in sendChat() below: `suite` carries a JSDoc
	// type but svelte-check collapses $state(null)'s inferred type to `never` the moment a property
	// is read from it inside a $derived, a pre-existing quirk of this file and not specific to
	// either variable.
	let suiteHasJudgeModel = $derived(
		!!(/** @type {any} */ (suite)?.judgeProvider) && !!(/** @type {any} */ (suite)?.judgeModel));
	let chatModelPlaceholder = $derived(
		suiteHasJudgeModel
			? t('Suite default ({provider} / {model})',
				{ provider: /** @type {any} */ (suite).judgeProvider, model: /** @type {any} */ (suite).judgeModel })
			: t('No suite default -- pick a model to use chat authoring')
	);

	/**
	 * The whole editable case. Every field the backend accepts lives here even
	 * when it has no control (unmockedToolPolicy, sourceConversationId), because
	 * PUT is a full replace -- anything missing from the payload is cleared.
	 * @type {{
	 *   name: string,
	 *   enabled: boolean,
	 *   turns: import('$agentTestTypes').TestTurn[],
	 *   assertions: import('$agentTestTypes').TestAssertion[],
	 *   initialStates: import('$agentTestTypes').TestState[],
	 *   mocks: import('$agentTestTypes').TestToolMock[],
	 *   unmockedToolPolicy: string,
	 *   sourceConversationId: string | null
	 * }}
	 */
	/** Agents the entry-agent and involved-agent pickers can offer. */
	/** @type {{ label: string, value: string }[]} */
	let agentOptions = $state([]);

	/**
	 * The same agents keyed by name instead of id, for the assertion pickers.
	 *
	 * `routedToAgent` and `agentChain` accept either identifier -- AgentChainHop.Matches compares the
	 * expected token against both -- and the name is the one worth storing: it is what the run report
	 * prints in the expected and actual columns, and a guid there tells a reviewer nothing.
	 */
	let agentNameOptions = $derived(agentOptions.map(o => ({ label: o.label, value: o.label })));

	let form = $state({
		name: '',
		enabled: true,
		caseType: 'Agent',
		entryAgentId: '',
		history: [],
		priority: 'P1',
		severity: 'S1',
		batch: null,
		crossCutting: false,
		involvedAgents: [],
		businessDomain: '',
		expectedOutcome: '',
		lastReviewedDate: null,
		turns: [],
		assertions: [],
		initialStates: [],
		mocks: [],
		unmockedToolPolicy: 'Block',
		sourceConversationId: null
	});

	/**
	 * Every agent whose tools this case might name: the suite's, because it is the default entry; the
	 * case's own entry agent, because it can override that; and the involved agents, which is exactly
	 * the field for "the other agents this case is about".
	 */
	let toolAgentIds = $derived([...new Set([
		/** @type {any} */ (suite)?.agentId,
		form.entryAgentId,
		...(form.involvedAgents || [])
	].filter(Boolean))]);

	/** Tool names for the pickers, de-duplicated and sorted across those agents. */
	let toolOptions = $derived([...new Set(toolAgentIds.flatMap(id => mockTargetsByAgent[id] || []))]
		.sort((a, b) => a.localeCompare(b))
		.map(name => ({ label: name, value: name })));

	/**
	 * Keep the tool cache covering whatever agents the case currently names. An effect rather than a
	 * call at each of the five places the agent fields can change -- load, chat authoring, undo, and
	 * the two pickers -- because missing one of them is a picker that silently offers the wrong agent's
	 * tools.
	 */
	$effect(() => {
		const ids = toolAgentIds;
		// The cache is read and written inside; tracking it would re-run this on its own writes.
		untrack(() => ensureMockTargets(ids));
	});

	/** Blocking problems, recomputed on every keystroke and shown before the user can save. */
	let validationErrors = $derived(collectValidationErrors(form));
	let canSave = $derived(validationErrors.length === 0 && !isSaving);

	onMount(async () => {
		isLoading = true;
		// `?chat=1` is how the suite page's "New Case by Chat" lands here. A query parameter rather
		// than a separate route: it is the same editor, and whatever the chat produces still has to
		// be reviewed and saved here.
		isChatOpen = page.url.searchParams.get('chat') === '1';
		loadLlmConfigs();
		try {
			await loadSuite();
			if (!isNew) {
				await loadCase();
			} else {
				form.turns = [newTurn(0)];
			}
		} finally {
			isLoading = false;
		}
	});

	function loadSuite() {
		loadErrorText = null;
		return getSuite(suiteId).then(res => {
			suite = res;
			loadAgentOptions();
			// The tool lists are not fetched here: `suite.agentId` feeds `toolAgentIds`, and the effect
			// watching it picks this agent up along with the case's own.
		}).catch(err => {
			suite = null;
			loadErrorText = errorMessage(err, t('Failed to load the suite this case belongs to.'));
		});
	}

	/** @param {any} model */
	function isChatModel(model) {
		return model.type === LlmModelType.Chat || model.capabilities?.includes(LlmModelCapability.Chat);
	}

	function loadLlmConfigs() {
		return getLlmConfigs().then(res => {
			llmConfigs = res || [];
		}).catch(() => {
			// The picker degrades to "suite default only" rather than blocking the whole editor on
			// an endpoint the rest of this page does not otherwise need.
			llmConfigs = [];
		});
	}

	/** @param {any} e */
	function changeChatModel(e) {
		const selecteds = e?.detail?.selecteds || [];
		const value = selecteds.length > 0 ? selecteds[0].value : '';
		if (!value) {
			chatModel = null;
			return;
		}
		const separator = value.indexOf('/');
		chatModel = { provider: value.slice(0, separator), model: value.slice(separator + 1) };
	}

	/**
	 * Fetch and cache the tool list for any agent not already fetched.
	 *
	 * Cached rather than re-fetched because the entry agent picker gets flipped back and forth while an
	 * author works out which agent a case belongs on, and because the same agent is usually both the
	 * suite's and one of the involved.
	 * @param {string[]} ids
	 */
	async function ensureMockTargets(ids) {
		const missing = ids.filter(id => !(id in mockTargetsByAgent));
		if (missing.length === 0) return;

		// Claimed before the first await, so a second pass triggered while these are in flight does not
		// queue the same agent again.
		missing.forEach(id => { mockTargetsByAgent[id] = []; });

		await Promise.all(missing.map(id => getMockTargets(id)
			.then((/** @type {string[]} */ targets) => { mockTargetsByAgent[id] = targets || []; })
			// A list that fails to load costs that agent its options and nothing more -- every picker
			// keeps a manual escape hatch, so the case is still authorable.
			.catch(() => {})));
	}

	function loadAgentOptions() {
		// Only fills the agent pickers, so a failure costs those and nothing else -- the rest of the
		// editor stays usable and an already-stored entry agent is untouched.
		return getAgentOptions().then(res => {
			agentOptions = (res || []).map(x => ({ label: x.name, value: x.id }));
		}).catch(() => {
			agentOptions = [];
		});
	}

	/** @param {any} e */
	function changeEntryAgent(e) {
		const selecteds = e?.detail?.selecteds || [];
		// Empty means the dropdown own "Clear selection", which is how the author says "use the
		// suite agent" -- the payload turns '' into null.
		form.entryAgentId = selecteds.length > 0 ? selecteds[0].value : '';
	}

	/** @param {any} e */
	function changeInvolvedAgents(e) {
		form.involvedAgents = (e?.detail?.selecteds || []).map((/** @type {any} */ x) => x.value);
	}

	function markReviewedToday() {
		// A date field nobody can be bothered to type is a date field that stays empty, and an empty
		// reviewed date is indistinguishable from a case reviewed long ago.
		form.lastReviewedDate = new Date().toISOString().substring(0, 10);
	}

	function loadCase() {
		return getCase(caseId).then(res => {
			form = toForm(res);
		}).catch(err => {
			loadErrorText = errorMessage(err, t('Failed to load this test case.'));
		});
	}

	/**
	 * A stored case or an authored draft -> the editor's form shape. One function for both because
	 * the two have the same field names: the authoring endpoint returns the same upsert shape this
	 * page posts, so a draft can be dropped straight in.
	 * @param {any} res
	 */
	function toForm(res) {
		return {
			name: res.name || '',
			enabled: res.enabled,
			// Blank for all of these is what a case stored before the fields existed reads back
			// as, and each blank means the old behaviour: an Agent case on the suite own agent,
			// untriaged at P1/S1.
			caseType: res.caseType || 'Agent',
			entryAgentId: res.entryAgentId || '',
			history: (res.history || []).map((/** @type {any} */ m) => ({
				role: m.role || 'user',
				content: m.content || ''
			})),
			priority: res.priority || 'P1',
			severity: res.severity || 'S1',
			batch: res.batch ?? null,
			crossCutting: !!res.crossCutting,
			involvedAgents: res.involvedAgents || [],
			businessDomain: res.businessDomain || '',
			expectedOutcome: res.expectedOutcome || '',
			lastReviewedDate: res.lastReviewedDate ? res.lastReviewedDate.substring(0, 10) : null,
			turns: (res.turns || []).map((/** @type {any} */ turn, /** @type {number} */ i) => ({
				index: i,
				userMessage: turn.userMessage || '',
				assertions: (turn.assertions || []).map(normalizeAssertion)
			})),
			assertions: (res.assertions || []).map(normalizeAssertion),
			initialStates: (res.initialStates || []).map((/** @type {any} */ s) => ({
				key: s.key || '',
				value: s.value || '',
				activeRounds: s.activeRounds ?? -1,
				global: !!s.global
			})),
			mocks: (res.mocks || []).map((/** @type {any} */ m) => ({
				functionName: m.functionName || '',
				// Editor-only, like the assertion flags above -- buildPayload never sends it.
				manualFunctionName: false,
				argsMatchJson: m.argsMatchJson || '',
				callIndex: m.callIndex ?? null,
				resultContent: m.resultContent || '',
				stopCompletion: !!m.stopCompletion,
				stateWrites: (m.stateWrites || []).map((/** @type {any} */ s) => ({
					key: s.key || '',
					value: s.value || '',
					activeRounds: s.activeRounds ?? -1,
					global: !!s.global
				}))
			})),
			// Carried through untouched: P1 only accepts Block, and the recorded
			// source id is the only trace back to where a draft came from.
			unmockedToolPolicy: res.unmockedToolPolicy || 'Block',
			sourceConversationId: res.sourceConversationId ?? null
		};
	}

	/**
	 * `manualTarget` and `manualExpected` are editor-only: they say "this author asked for a text box
	 * instead of the picker". They never reach the API -- buildPayload's cleanAssertion lists the six
	 * fields the backend has -- and they start false so a freshly loaded case shows pickers.
	 * @param {any} a
	 */
	function normalizeAssertion(a) {
		return {
			type: a?.type || 'outputContains',
			target: a?.target || '',
			expected: a?.expected || '',
			argsMatchJson: a?.argsMatchJson || '',
			minScore: a?.minScore ?? null,
			fatal: !!a?.fatal,
			manualTarget: false,
			manualExpected: false
		};
	}

	function newHistoryMessage() {
		// Starts as a user message: a fixed scenario is nearly always opened by the resident saying
		// something, and an assistant-first history reads as the agent talking to itself.
		return { role: 'user', content: '' };
	}

	/**
	 * Order is the conversation, so history rows have to be movable -- unlike initial states, where
	 * order means nothing.
	 * @param {number} i
	 * @param {number} delta
	 */
	function moveHistoryMessage(i, delta) {
		const target = i + delta;
		if (target < 0 || target >= form.history.length) return;
		const [moved] = form.history.splice(i, 1);
		form.history.splice(target, 0, moved);
	}

	/** @param {number} index */
	function newTurn(index) {
		return { index: index, userMessage: '', assertions: [] };
	}

	function newAssertion() {
		return {
			type: 'outputContains', target: '', expected: '', argsMatchJson: '',
			minScore: null, fatal: false, manualTarget: false, manualExpected: false
		};
	}

	function newState() {
		return { key: '', value: '', activeRounds: -1, global: false };
	}

	function newMock() {
		return {
			functionName: '', argsMatchJson: '', callIndex: null, resultContent: '',
			stopCompletion: false, stateWrites: [], manualFunctionName: false
		};
	}

	/**
	 * Turn.index is what the backend uses to order the conversation and to tag
	 * observed tool calls, so it has to stay a dense 0-based sequence after any
	 * add/remove/move -- not just a label.
	 */
	function reindexTurns() {
		form.turns.forEach((turn, i) => { turn.index = i; });
	}

	function addTurn() {
		form.turns = [...form.turns, newTurn(form.turns.length)];
	}

	/** @param {number} i */
	function removeTurn(i) {
		form.turns.splice(i, 1);
		reindexTurns();
	}

	/** @param {number} i @param {number} delta */
	function moveTurn(i, delta) {
		const target = i + delta;
		if (target < 0 || target >= form.turns.length) return;
		const [moved] = form.turns.splice(i, 1);
		form.turns.splice(target, 0, moved);
		reindexTurns();
	}

	/**
	 * @param {{ name: string, turns: any[], assertions: any[], initialStates: any[], mocks: any[] }} value
	 * @returns {string[]}
	 */
	function collectValidationErrors(value) {
		/** @type {string[]} */
		const errors = [];

		if (!value.name?.trim()) {
			errors.push(t('Name is required.'));
		}

		// Routing cases carry extra rules; the helper is shared with nothing else, so this cannot
		// drift from what the backend would reject on save.
		errors.push(...validateCaseType(value.caseType, value.turns, value.assertions));

		// Rejected by the backend, and worth catching here: BotSharp dialog storage drops elements
		// with blank content, so an empty message would silently not be in the conversation and the
		// runner would then fail the whole case for a write that vanished.
		value.history?.forEach((message, i) => {
			if (!message.content?.trim()) {
				errors.push(t('History message {n} has no content.', { n: i + 1 }));
			}
		});

		// A case with no turns is accepted by the API but comes back Error at run
		// time ("case has no turns"), so it is worth blocking here instead.
		if (!value.turns?.length) {
			errors.push(t('Add at least one turn -- a case with no turns errors when it runs.'));
		}

		value.turns?.forEach((turn, i) => {
			if (!turn.userMessage?.trim()) {
				errors.push(t('Turn {n}: the user message is empty.', { n: i + 1 }));
			}
			turn.assertions?.forEach((assertion, j) => {
				const error = validateAssertion(assertion);
				if (error) {
					errors.push(t('Turn {n}, assertion {m}: {error}', { n: i + 1, m: j + 1, error }));
				}
			});
		});

		value.assertions?.forEach((assertion, i) => {
			const error = validateAssertion(assertion);
			if (error) {
				errors.push(t('Case assertion {n}: {error}', { n: i + 1, error }));
			}
		});

		value.initialStates?.forEach((state, i) => {
			if (!state.key?.trim()) {
				errors.push(t('Initial state {n}: the key is empty.', { n: i + 1 }));
			}
		});

		value.mocks?.forEach((mock, i) => {
			if (!mock.functionName?.trim()) {
				errors.push(t('Mock {n}: the function name is empty.', { n: i + 1 }));
			}
			if (mock.argsMatchJson?.trim() && !isParsableJson(mock.argsMatchJson)) {
				errors.push(t('Mock {n}: the args match is not valid JSON.', { n: i + 1 }));
			}
			if (mock.callIndex != null && mock.callIndex !== '' && Number(mock.callIndex) < 0) {
				errors.push(t('Mock {n}: the call index is 0-based and cannot be negative.', { n: i + 1 }));
			}
			mock.stateWrites?.forEach((state, j) => {
				if (!state.key?.trim()) {
					errors.push(t('Mock {n}, state write {m}: the key is empty.', { n: i + 1, m: j + 1 }));
				}
			});
		});

		return errors;
	}

	/** Strip the empty-string placeholders the form uses back to the nulls the API expects. */
	function buildPayload() {
		/** @param {any} a */
		const cleanAssertion = (a) => ({
			type: a.type,
			target: a.target?.trim() || null,
			expected: a.expected?.trim() || null,
			argsMatchJson: a.argsMatchJson?.trim() || null,
			minScore: a.minScore === '' || a.minScore == null ? null : Number(a.minScore),
			fatal: !!a.fatal
		});

		/** @param {any} s */
		const cleanState = (s) => ({
			key: s.key.trim(),
			value: s.value ?? '',
			activeRounds: s.activeRounds === '' || s.activeRounds == null ? -1 : Number(s.activeRounds),
			global: !!s.global
		});

		return {
			suiteId: suiteId,
			name: form.name.trim(),
			enabled: form.enabled,
			caseType: form.caseType || 'Agent',
			// Null, not '', so the backend "fall back to the suite agent" check reads it correctly --
			// an empty string would be a request to enter on an agent whose id is empty.
			entryAgentId: form.entryAgentId?.trim() || null,
			history: form.history.map(m => ({ role: m.role, content: m.content ?? '' })),
			priority: form.priority || 'P1',
			severity: form.severity || 'S1',
			// Number('') from an emptied select is 0, a batch the backend rejects. Null is how to say
			// "derive it".
			batch: CASE_BATCHES.includes(Number(form.batch)) ? Number(form.batch) : null,
			crossCutting: !!form.crossCutting,
			involvedAgents: form.involvedAgents || [],
			businessDomain: form.businessDomain?.trim() || null,
			expectedOutcome: form.expectedOutcome?.trim() || null,
			// Sent only when set, and never stamped automatically: a case can be edited many times
			// and still rest on an assumption nobody has questioned.
			lastReviewedDate: form.lastReviewedDate || null,
			turns: form.turns.map((turn, i) => ({
				index: i,
				userMessage: turn.userMessage.trim(),
				assertions: (turn.assertions || []).map(cleanAssertion)
			})),
			assertions: form.assertions.map(cleanAssertion),
			initialStates: form.initialStates.map(cleanState),
			mocks: form.mocks.map(m => ({
				functionName: m.functionName.trim(),
				argsMatchJson: m.argsMatchJson?.trim() || null,
				callIndex: m.callIndex === '' || m.callIndex == null ? null : Number(m.callIndex),
				resultContent: m.resultContent ?? '',
				stopCompletion: !!m.stopCompletion,
				stateWrites: (m.stateWrites || []).map(cleanState)
			})),
			unmockedToolPolicy: form.unmockedToolPolicy || 'Block',
			sourceConversationId: form.sourceConversationId
		};
	}

	/** @param {string} text */
	function notifySuccess(text) {
		isComplete = true;
		successText = text;
		setTimeout(() => {
			isComplete = false;
			successText = '';
		}, duration);
	}

	/** @param {string} text */
	function notifyError(text) {
		isError = true;
		errorText = text;
		setTimeout(() => {
			isError = false;
			errorText = '';
		}, duration);
	}

	/**
	 * Select offers a "Clear selection" row, but an assertion with no type is one
	 * the backend rejects with nothing on screen to explain why. Ignore the empty
	 * selection and keep whatever type was already set.
	 * @param {any} assertion
	 * @param {any} e
	 */
	function changeAssertionType(assertion, e) {
		const selecteds = e?.detail?.selecteds || [];
		if (selecteds.length > 0) {
			assertion.type = selecteds[0].value;
		}

		// `target` is a function name for toolCalled, a state key for stateEquals and the comparison
		// MODE for agentChain, so a value carried over from the previous type is either meaningless
		// or actively wrong: switching to agentChain would leave the mode picker showing nothing, and
		// switching away would leave 'ordered' behind as the name of a function to assert was called.
		const isMode = AGENT_CHAIN_MODES.includes((assertion.target || '').trim().toLowerCase());
		if (assertion.type === 'agentChain') {
			if (!isMode) assertion.target = 'contains';
		} else if (isMode) {
			assertion.target = '';
		}

		// Both fields mean something different under the new type, so an explicit "let me type it" from
		// the old one does not carry over. A value the new picker cannot show still opens in the text
		// box on its own -- see isManualEntry.
		assertion.manualTarget = false;
		assertion.manualExpected = false;
	}

	/** @param {any} assertion @param {any} e */
	function changeAgentChainMode(assertion, e) {
		const selecteds = e?.detail?.selecteds || [];
		if (selecteds.length > 0) {
			assertion.target = selecteds[0].value;
		}
	}

	/* ------------------------------------------------------------------
	 * Pickers with a manual escape hatch
	 *
	 * A tool name and an agent name are both things the author has in front of them and cannot spell
	 * from memory, and both fail silently when mistyped: a `toolCalled` on a function that does not
	 * exist can never pass, and a `routedToAgent` on a misspelt agent fails every run while looking
	 * like a real regression. So both are picked, not typed.
	 *
	 * They still fall back to a text box, because neither catalogue is the whole truth: MCP tools are
	 * discovered at run time, a stored case can name a function its agent has since dropped, and the
	 * tool list only covers the agents this case names. A value the picker cannot show switches its own
	 * row to the text box rather than being quietly lost on the next save.
	 * ------------------------------------------------------------------ */

	/**
	 * @param {string} value
	 * @param {{ value: string }[]} options
	 */
	function isOffCatalogue(value, options) {
		const trimmed = (value || '').trim();
		return !!trimmed && !options.some(o => o.value === trimmed);
	}

	/**
	 * Whether one field is showing a text box right now -- either the author asked for it, or the value
	 * it holds is not one the picker can offer.
	 * @param {any} holder @param {string} flag @param {string} field @param {{ value: string }[]} options
	 */
	function isManualEntry(holder, flag, field, options) {
		return holder[flag] === true || isOffCatalogue(holder[field], options);
	}

	/**
	 * @param {any} holder @param {string} flag @param {string} field @param {{ value: string }[]} options
	 */
	function toggleManualEntry(holder, flag, field, options) {
		if (isManualEntry(holder, flag, field, options)) {
			// Going back to the picker has to drop a value the picker cannot represent, or the toggle
			// would appear to do nothing -- isManualEntry would put the row straight back in the box.
			if (isOffCatalogue(holder[field], options)) holder[field] = '';
			holder[flag] = false;
		} else {
			holder[flag] = true;
		}
	}

	/**
	 * Single-select Select -> one string field. An empty selection is the dropdown's own
	 * "Clear selection", which here means "not chosen yet".
	 * @param {any} holder @param {string} field @param {any} e
	 */
	function pickValue(holder, field, e) {
		const selecteds = e?.detail?.selecteds || [];
		holder[field] = selecteds.length > 0 ? selecteds[0].value : '';
	}

	/* ------------------------------------------------------------------
	 * agentChain expected list
	 *
	 * Stored as the comma-separated string the backend parses, edited as an ordered list. Ordered, not
	 * a multi-select: in `ordered` and `exact` modes the sequence IS the assertion, and a multi-select
	 * hands back its options in list order, not click order.
	 * ------------------------------------------------------------------ */

	/** @param {string} value */
	function parseAgentChain(value) {
		return (value || '').split(',').map(x => x.trim()).filter(Boolean);
	}

	/** @param {any} assertion @param {string[]} list */
	function setAgentChain(assertion, list) {
		assertion.expected = list.join(', ');
	}

	/** @param {any} assertion @param {any} e */
	function addChainAgent(assertion, e) {
		const selecteds = e?.detail?.selecteds || [];
		if (selecteds.length === 0) return;
		// Not de-duplicated: a conversation can hand off and come back, and A -> B -> A is a chain a
		// case has every reason to assert.
		setAgentChain(assertion, [...parseAgentChain(assertion.expected), selecteds[0].value]);
	}

	/** @param {any} assertion @param {number} index */
	function removeChainAgent(assertion, index) {
		const list = parseAgentChain(assertion.expected);
		list.splice(index, 1);
		setAgentChain(assertion, list);
	}

	/** @param {any} assertion @param {number} index @param {number} delta */
	function moveChainAgent(assertion, index, delta) {
		const list = parseAgentChain(assertion.expected);
		const target = index + delta;
		if (target < 0 || target >= list.length) return;
		const [moved] = list.splice(index, 1);
		list.splice(target, 0, moved);
		setAgentChain(assertion, list);
	}

	/** @param {any} e */
	function submit(e) {
		e?.preventDefault();
		if (!canSave) return;

		isSaving = true;
		const payload = buildPayload();
		const request = isNew ? createCase(payload) : updateCase(caseId, payload);

		request.then(() => {
			notifySuccess(isNew ? t('Test case created!') : t('Test case saved!'));
			goBack();
		}).catch(err => {
			notifyError(errorMessage(err, t('Failed to save the test case.')));
		}).finally(() => {
			isSaving = false;
		});
	}

	function goBack() {
		goto(`/page/agent-test/${suiteId}`);
	}

	async function sendChat() {
		const text = chatInput.trim();
		if (!text || isAuthoring) return;

		// Appended before the call so the user sees their own message immediately, and so it is still
		// there to read if the call fails.
		chatMessages = [...chatMessages, { role: 'user', content: text }];
		chatInput = '';
		isAuthoring = true;
		authorErrorText = null;

		try {
			/** @type {import('$agentTestTypes').AgentTestAuthorRequest} */
			const body = {
				suiteId: suiteId ?? '',
				// Sent only for a saved case: it is what lets the backend ground the model in that
				// case's last run instead of letting it invent an expected reply.
				caseId: isNew ? null : caseId,
				messages: chatMessages,
				// The draft is whatever is on screen right now, in the exact shape the save endpoint
				// takes -- so a hand edit made between two chat turns is carried in, not overwritten.
				// Cast because `form` carries no type in this file, so buildPayload's inferred shape
				// has `any` in it; the save path has the same gap and typing `form` properly is a
				// separate change.
				draft: /** @type {any} */ (buildPayload()),
				// Null (the default) falls back to the suite's judge model on the server, same as
				// leaving the picker below untouched.
				model: chatModel
			};

			const result = await authorCase(body);

			chatMessages = [...chatMessages, { role: 'assistant', content: result.reply }];
			authorChanges = result.changes || [];
			authorWarnings = result.warnings || [];
			authorErrors = result.validationErrors || [];

			if (result.draftChanged && result.draft) {
				applyDraft(result.draft);
			}
		} catch (err) {
			authorErrorText = errorMessage(err, t('The assistant could not answer.'));
		} finally {
			isAuthoring = false;
		}
	}

	/** @param {any} draft */
	function applyDraft(draft) {
		// JSON round-trip rather than keeping the reactive object: history entries have to be inert
		// snapshots, or undo would restore something that has since been edited in place.
		draftHistory = [...draftHistory, JSON.parse(JSON.stringify(form))];
		form = toForm(draft);
	}

	function undoDraft() {
		if (draftHistory.length === 0) return;

		form = draftHistory[draftHistory.length - 1];
		draftHistory = draftHistory.slice(0, -1);
		// The badges described the change that has just been undone.
		authorChanges = [];
		authorErrors = [];
	}

	/** @param {KeyboardEvent} e */
	function chatKeydown(e) {
		// Enter sends, Shift+Enter is a newline: a case description is usually one line, and the
		// alternative made every message need a mouse trip to the button.
		if (e.key === 'Enter' && !e.shiftKey) {
			e.preventDefault();
			sendChat();
		}
	}
</script>

{#snippet assertionRows(list, idPrefix)}
	{#each list as assertion, i}
		<!-- Which of the two fields is a picker right now. Also decides whether the label may carry a
		     `for`: Select renders its own button under its own id, so a `for` aimed at the plain-input
		     id would point at nothing and announce an unlabelled control. -->
		{@const toolPicked = ['toolCalled', 'toolNotCalled'].includes(assertion.type)
			&& !isManualEntry(assertion, 'manualTarget', 'target', toolOptions)}
		{@const agentPicked = assertion.type === 'routedToAgent'
			&& !isManualEntry(assertion, 'manualExpected', 'expected', agentNameOptions)}
		<div class="ats-panel">
			<div class="grid grid-cols-1 gap-3 md:grid-cols-12">
				<div class="md:col-span-3">
					<span class="ats-label">{$_('Type')}</span>
					<Select
						tag={`${idPrefix}-type-${i}`}
						selectedValues={assertion.type ? [assertion.type] : []}
						options={ASSERTION_TYPE_OPTIONS}
						onselect={e => changeAssertionType(assertion, e)}
					/>
					{#if assertion.type === 'llmJudge'}
						<span class="ats-help">{$_('Scored 1-5 by the judge model configured on this suite. Pass mark defaults to 4.')}</span>
					{/if}
				</div>
				<div class="md:col-span-3">
					<label
						class="ats-label"
						for={assertion.type === 'agentChain' || toolPicked ? undefined : `${idPrefix}-target-${i}`}
					>
						{assertion.type === 'agentChain' ? $_('Mode') : $_('Target')}
						{#if ['toolCalled', 'toolNotCalled', 'stateEquals'].includes(assertion.type)}
							<span class="text-danger">*</span>
						{/if}
					</label>
					{#if assertion.type === 'agentChain'}
						<!-- On this one type `target` carries the comparison mode, not a function name.
						     A picker rather than free text because a typo'd mode fails the assertion
						     outright instead of falling back to the loosest comparison. -->
						<Select
							tag={`${idPrefix}-mode-${i}`}
							selectedValues={assertion.target ? [assertion.target] : ['contains']}
							options={AGENT_CHAIN_MODE_OPTIONS}
							onselect={e => changeAgentChainMode(assertion, e)}
						/>
					{:else if assertion.type === 'toolCalled' || assertion.type === 'toolNotCalled'}
						{#if toolPicked}
							<Select
								tag={`${idPrefix}-target-${i}`}
								searchMode={true}
								searchPlaceholder={$_('Search tools')}
								placeholder={$_('Pick a tool')}
								selectedValues={assertion.target ? [assertion.target] : []}
								options={toolOptions}
								onselect={e => pickValue(assertion, 'target', e)}
							/>
						{:else}
							<input
								id={`${idPrefix}-target-${i}`}
								type="text"
								class="ats-input font-code"
								placeholder={$_('function name')}
								bind:value={assertion.target}
							/>
						{/if}
						<button
							type="button"
							class="ats-btn ats-btn-link"
							onclick={() => toggleManualEntry(assertion, 'manualTarget', 'target', toolOptions)}
						>
							{toolPicked ? $_('Type a name instead') : $_('Pick from the list')}
						</button>
						{#if toolOptions.length === 0}
							<span class="ats-help">
								{$_('No tools found for the agents on this case. Add the agent under Involved agents, or type the name.')}
							</span>
						{/if}
					{:else}
						<input
							id={`${idPrefix}-target-${i}`}
							type="text"
							class="ats-input font-code"
							placeholder={assertion.type === 'stateEquals' ? $_('state key') : $_('function name')}
							bind:value={assertion.target}
						/>
					{/if}
				</div>
				<div class="md:col-span-4">
					<label
						class="ats-label"
						for={assertion.type === 'agentChain' || agentPicked ? undefined : `${idPrefix}-expected-${i}`}
					>
						{$_('Expected')}
						{#if assertion.type !== 'toolCalled' && assertion.type !== 'toolNotCalled'}
							<span class="text-danger">*</span>
						{/if}
					</label>
					{#if assertion.type === 'routedToAgent'}
						{#if agentPicked}
							<Select
								tag={`${idPrefix}-expected-${i}`}
								searchMode={true}
								searchPlaceholder={$_('Search agents')}
								placeholder={$_('Pick an agent')}
								selectedValues={assertion.expected ? [assertion.expected] : []}
								options={agentNameOptions}
								onselect={e => pickValue(assertion, 'expected', e)}
							/>
						{:else}
							<input
								id={`${idPrefix}-expected-${i}`}
								type="text"
								class="ats-input"
								placeholder={$_('agent name or id')}
								bind:value={assertion.expected}
							/>
						{/if}
						<button
							type="button"
							class="ats-btn ats-btn-link"
							onclick={() => toggleManualEntry(assertion, 'manualExpected', 'expected', agentNameOptions)}
						>
							{agentPicked ? $_('Type a name instead') : $_('Pick from the list')}
						</button>
					{:else if assertion.type === 'agentChain'}
						{@const chain = parseAgentChain(assertion.expected)}
						{@const ordered = (assertion.target || 'contains') !== 'contains'}
						{#if chain.length > 0}
							<div class="ats-chain">
								{#each chain as hop, h}
									<span class="ats-badge ats-badge-soft ats-tone-secondary">
										<!-- Reordering is offered only where order is part of the assertion.
										     Under `contains` the position means nothing, and arrows that
										     change nothing would suggest it does. -->
										{#if ordered}
											<button
												type="button"
												class="ats-chip-btn"
												aria-label={$_('Move earlier')}
												disabled={h === 0}
												onclick={() => moveChainAgent(assertion, h, -1)}
											>
												<i class="mdi mdi-chevron-left"></i>
											</button>
											<span class="ats-chip-index">{h + 1}</span>
										{/if}
										<span>{hop}</span>
										{#if ordered}
											<button
												type="button"
												class="ats-chip-btn"
												aria-label={$_('Move later')}
												disabled={h === chain.length - 1}
												onclick={() => moveChainAgent(assertion, h, 1)}
											>
												<i class="mdi mdi-chevron-right"></i>
											</button>
										{/if}
										<button
											type="button"
											class="ats-chip-btn"
											aria-label={$_('Remove agent from the chain')}
											onclick={() => removeChainAgent(assertion, h)}
										>
											<i class="mdi mdi-close"></i>
										</button>
									</span>
								{/each}
							</div>
						{/if}
						<!-- Remounted after every add so the picker returns to its placeholder instead of
						     sitting on the agent just added, which reads as "already in the chain". -->
						{#key chain.length}
							<Select
								tag={`${idPrefix}-chain-add-${i}`}
								searchMode={true}
								searchPlaceholder={$_('Search agents')}
								placeholder={$_('Add an agent to the chain')}
								selectedValues={[]}
								options={agentNameOptions}
								onselect={e => addChainAgent(assertion, e)}
							/>
						{/key}
					{:else}
						<input
							id={`${idPrefix}-expected-${i}`}
							type="text"
							class="ats-input"
							bind:value={assertion.expected}
						/>
					{/if}
					{#if assertion.type === 'agentChain'}
						<p class="mt-1 mb-0 text-xs text-muted">
							{#if (assertion.target || 'contains') === 'exact'}
								{$_('The chain is exactly these agents and nothing else. One name asserts that nothing routed away.')}
							{:else if assertion.target === 'ordered'}
								{$_('These agents appear in this order; other agents may come in between. This is the hand-off assertion.')}
							{:else}
								{$_('These agents appear somewhere in the chain, in any order.')}
							{/if}
						</p>
					{/if}
				</div>
				<div class="flex items-center justify-between gap-2 md:col-span-2 md:items-end md:pb-1">
					<div class="ats-check">
						<input
							id={`${idPrefix}-fatal-${i}`}
							type="checkbox"
							class="ats-check-input"
							bind:checked={assertion.fatal}
						/>
						<label class="ats-check-label" for={`${idPrefix}-fatal-${i}`}>{$_('Fatal')}</label>
					</div>
					<button
						type="button"
						class="ats-btn ats-btn-icon ats-btn-soft ats-tone-danger"
						aria-label={$_('Remove assertion')}
						onclick={() => list.splice(i, 1)}
					>
						<i class="mdi mdi-delete-outline"></i>
					</button>
				</div>
				{#if assertion.type === 'toolCalled'}
					<div class="md:col-span-12">
						<label class="ats-label" for={`${idPrefix}-args-${i}`}>
							{$_('Args match (JSON subset, optional)')}
						</label>
						<input
							id={`${idPrefix}-args-${i}`}
							type="text"
							class="ats-input font-code"
							placeholder={'{"woNum":"B9897413"}'}
							bind:value={assertion.argsMatchJson}
						/>
					</div>
				{/if}
			</div>
		</div>
	{/each}
{/snippet}

{#snippet stateRows(list, idPrefix)}
	{#each list as state, i}
		<div class="mb-3 grid grid-cols-1 gap-3 md:grid-cols-12">
			<div class="md:col-span-3">
				<label class="ats-label" for={`${idPrefix}-key-${i}`}>
					{$_('Key')} <span class="text-danger">*</span>
				</label>
				<input
					id={`${idPrefix}-key-${i}`}
					type="text"
					class="ats-input font-code"
					bind:value={state.key}
				/>
			</div>
			<div class="md:col-span-4">
				<label class="ats-label" for={`${idPrefix}-value-${i}`}>{$_('Value')}</label>
				<input
					id={`${idPrefix}-value-${i}`}
					type="text"
					class="ats-input font-code"
					bind:value={state.value}
				/>
			</div>
			<div class="md:col-span-2">
				<label class="ats-label" for={`${idPrefix}-rounds-${i}`}>{$_('Active rounds')}</label>
				<input
					id={`${idPrefix}-rounds-${i}`}
					type="number"
					class="ats-input"
					bind:value={state.activeRounds}
				/>
			</div>
			<div class="flex items-center justify-between gap-2 md:col-span-3 md:items-end md:pb-1">
				<div class="ats-check">
					<input
						id={`${idPrefix}-global-${i}`}
						type="checkbox"
						class="ats-check-input"
						bind:checked={state.global}
					/>
					<label class="ats-check-label" for={`${idPrefix}-global-${i}`}>{$_('Global')}</label>
				</div>
				<button
					type="button"
					class="ats-btn ats-btn-icon ats-btn-soft ats-tone-danger"
					aria-label={$_('Remove state')}
					onclick={() => list.splice(i, 1)}
				>
					<i class="mdi mdi-delete-outline"></i>
				</button>
			</div>
		</div>
	{/each}
{/snippet}

<HeadTitle title={$_('Test Case')} />
<Breadcrumb title={$_('Agent Testing')} pagetitle={isNew ? $_('New Test Case') : (form.name || $_('Test Case'))} />

<LoadingToComplete
	isLoading={isLoading}
	isComplete={isComplete}
	isError={isError}
	successText={successText}
	errorText={errorText}
/>

{#if loadErrorText}
	<div class="flex flex-wrap">
		<div class="w-full">
			<div class="ats-alert ats-tone-danger justify-between" role="alert">
				<span>{loadErrorText}</span>
				<button type="button" class="ats-btn ats-btn-sm ats-btn-secondary" onclick={() => goBack()}>
					{$_('Back to Suite')}
				</button>
			</div>
		</div>
	</div>
{:else}
	<!--
		The draft and the chat that edits it are one activity: every suggestion has to be read
		against the form it changed, which is why this is a column of the editor and not a page of
		its own. Chat first in the markup so it sits above the form when the columns collapse --
		below xl a 700-line form ahead of it would bury it.
	-->
	<div class="grid grid-cols-1 gap-4 xl:grid-cols-12">
		<div class="xl:order-2 xl:col-span-4">
			<div class="ats-card xl:sticky xl:top-4">
				<div class="ats-card-section ats-card-divider">
					<div class="flex flex-wrap items-center justify-between gap-2">
						<div class="flex items-center gap-3">
							<span class="ats-card-icon">
								<i class="mdi mdi-message-text-outline"></i>
							</span>
							<h5 class="ats-card-title">{$_('Write by Chat')}</h5>
						</div>
						<div class="flex flex-wrap items-center gap-2">
							{#if draftHistory.length > 0}
								<button
									type="button"
									class="ats-btn ats-btn-sm ats-btn-soft ats-tone-secondary"
									onclick={() => undoDraft()}
								>
									<i class="mdi mdi-undo"></i> {$_('Undo')}
								</button>
							{/if}
							<button
								type="button"
								class="ats-btn ats-btn-sm ats-btn-soft ats-tone-secondary"
								onclick={() => (isChatOpen = !isChatOpen)}
							>
								<i class={isChatOpen ? 'mdi mdi-chevron-up' : 'mdi mdi-chevron-down'}></i>
								{isChatOpen ? $_('Hide') : $_('Show')}
							</button>
						</div>
					</div>
				</div>

				{#if isChatOpen}
					<div class="ats-card-section">
						<p class="ats-help">
							{$_('Say what the case should cover, in your own words. Every reply edits the draft on this page -- nothing is stored until you press Save.')}
						</p>

						<div class="mb-3">
							<span class="ats-label">{$_('Model')}</span>
							<Select
								tag={'agent-test-chat-model'}
								placeholder={chatModelPlaceholder}
								selectedValues={chatModel ? [`${chatModel.provider}/${chatModel.model}`] : []}
								options={chatModelOptions}
								onselect={e => changeChatModel(e)}
							/>
							{#if !chatModel && !suiteHasJudgeModel}
								<span class="ats-help text-warning">
									{$_('This suite has no judge model configured, so chat authoring has no default to fall back on -- pick one above.')}
								</span>
							{/if}
						</div>

						<div class="ats-chat-log scrollbar-on-hover">
							{#if chatMessages.length === 0}
								<p class="ats-empty-text">
									{$_('For example: the resident says the fridge is leaking and asks when someone will come; it should reach the work order agent and look the order up.')}
								</p>
							{/if}
							{#each chatMessages as message}
								<div class="ats-chat-msg {message.role === 'user' ? 'ats-chat-msg-user' : 'ats-chat-msg-agent'}">
									{message.content}
								</div>
							{/each}
							{#if isAuthoring}
								<div class="ats-chat-msg ats-chat-msg-agent">
									<i class="mdi mdi-loading mdi-spin"></i> {$_('Working on it...')}
								</div>
							{/if}
						</div>

						<label class="ats-label" for="author-chat-input">{$_('Your instruction')}</label>
						<textarea
							id="author-chat-input"
							class="ats-textarea"
							rows="3"
							bind:value={chatInput}
							onkeydown={chatKeydown}
							placeholder={$_('Add a turn, change an assertion, ask what a field means...')}
						></textarea>

						<div class="mt-2 flex flex-wrap items-center justify-between gap-2">
							<span class="ats-help">{$_('Enter sends. Shift+Enter starts a new line.')}</span>
							<button
								type="button"
								class="ats-btn ats-btn-sm ats-btn-primary"
								disabled={isAuthoring || !chatInput.trim()}
								onclick={() => sendChat()}
							>
								{#if isAuthoring}
									<i class="mdi mdi-loading mdi-spin"></i>
								{:else}
									<i class="mdi mdi-send"></i>
								{/if}
								{$_('Send')}
							</button>
						</div>

						{#if authorErrorText}
							<div class="ats-alert ats-tone-danger mt-3" role="alert">
								<span>{authorErrorText}</span>
							</div>
						{/if}

						{#if authorChanges.length > 0}
							<!-- Computed by the backend by diffing the two drafts, not read off the
							     model's own account of what it did. -->
							<div class="ats-panel mt-3">
								<p class="ats-panel-title">{$_('Changed in this reply')}</p>
								<ul class="mt-2 list-disc ps-5 text-xs">
									{#each authorChanges as change}
										<li><span class="font-code">{change.field}</span> — {change.detail}</li>
									{/each}
								</ul>
							</div>
						{/if}

						{#if authorErrors.length > 0}
							<div class="ats-alert ats-tone-warning mt-3 flex-col items-start gap-1" role="alert">
								<div class="font-semibold">{$_('The assistant could not produce a valid draft:')}</div>
								<ul class="list-disc ps-5">
									{#each authorErrors as error}
										<li>{error}</li>
									{/each}
								</ul>
							</div>
						{/if}

						{#if authorWarnings.length > 0}
							<div class="ats-alert ats-tone-info mt-3 flex-col items-start gap-1" role="alert">
								<div class="font-semibold">{$_('Worth checking:')}</div>
								<ul class="list-disc ps-5">
									{#each authorWarnings as warning}
										<li>{warning}</li>
									{/each}
								</ul>
							</div>
						{/if}
					</div>
				{/if}
			</div>
		</div>

		<div class="flex flex-col gap-4 xl:order-1 xl:col-span-8">
		<div class="ats-card">
			<div class="ats-card-section ats-card-divider">
				<div class="flex flex-wrap items-center justify-between gap-3">
					<div class="flex items-center gap-3">
						<span class="ats-card-icon">
							<i class="mdi mdi-file-document-edit-outline"></i>
						</span>
						<h5 class="ats-card-title">{isNew ? $_('New Test Case') : $_('Edit Test Case')}</h5>
					</div>
					<div class="flex flex-wrap items-center gap-2">
						<button type="button" class="ats-btn ats-btn-soft ats-tone-secondary" onclick={() => goBack()}>
							<i class="mdi mdi-arrow-left"></i> {$_('Back')}
						</button>
						<button
							type="button"
							class="ats-btn ats-btn-primary"
							disabled={!canSave}
							onclick={(e) => submit(e)}
						>
							{#if isSaving}
								<i class="mdi mdi-loading mdi-spin"></i>
							{/if}
							{$_('Save')}
						</button>
					</div>
				</div>
			</div>

			{#if validationErrors.length > 0}
				<div class="ats-card-section ats-card-divider">
					<div class="ats-alert ats-tone-warning flex-col items-start gap-1" role="alert">
						<div class="font-semibold">{$_('Fix these before saving:')}</div>
						<ul class="list-disc ps-5">
							{#each validationErrors as error}
								<li>{error}</li>
							{/each}
						</ul>
					</div>
				</div>
			{/if}

			<div class="ats-card-section">
				<div class="grid grid-cols-1 gap-4 md:grid-cols-12">
					<div class="md:col-span-8">
						<label class="ats-label" for="case-name">{$_('Name')} <span class="text-danger">*</span></label>
						<input
							id="case-name"
							type="text"
							class="ats-input"
							maxlength={nameMaxLength}
							bind:value={form.name}
						/>
					</div>
					<div class="flex items-center md:col-span-4 md:items-end md:pb-1">
						<div class="ats-check">
							<input
								id="case-enabled"
								type="checkbox"
								class="ats-switch"
								bind:checked={form.enabled}
							/>
							<label class="ats-check-label" for="case-enabled">{$_('Enabled (included in runs)')}</label>
						</div>
					</div>
					<div class="md:col-span-4">
						<label class="ats-label" for="case-type">{$_('Case type')}</label>
						<!-- Spelled out rather than looped: bare 'Routing' and 'Agent' already exist as
						     unrelated i18n keys (zh.json translates 'Routing' as the routing-graph
						     screen), so reusing them would mistranslate the options. -->
						<select id="case-type" class="ats-input" bind:value={form.caseType}>
							<option value="Routing">{$_('Routing case')}</option>
							<option value="Agent">{$_('Agent case')}</option>
						</select>
						<p class="mt-1 mb-0 text-xs text-muted">
							{#if form.caseType === 'Routing'}
								{$_('One turn, entered on the Copilot entry agent, asserting only which agent took the conversation. The only type counted towards a run\'s routing accuracy.')}
							{:else}
								{$_('One agent\'s own behaviour. Enter directly on that agent to keep the router out of what is measured. A journey across several agents is an Agent case too -- use an agentChain assertion for the hand-offs.')}
							{/if}
						</p>
					</div>
					<div class="md:col-span-8">
						<label class="ats-label" for="case-entry-agent">{$_('Entry agent')}</label>
						<!-- A dropdown rather than an id field: the id is a guid nobody can type from
						     memory, and a typo is only caught on save. Use the dropdown own
						     "Clear selection" to fall back to the suite agent. -->
						<Select
							tag={'agent-test-case-entry-agent'}
							placeholder={$_('Use the suite\'s agent')}
							selectedValues={form.entryAgentId ? [form.entryAgentId] : []}
							options={agentOptions}
							onselect={e => changeEntryAgent(e)}
						/>
						<p class="mt-1 mb-0 text-xs text-muted">
							{$_('The agent the conversation opens on. Leave it unset to use the suite\'s.')}
							{$_('A routing agent runs the router and can hand off; any other agent is entered directly, so the router never runs.')}
						</p>
					</div>
					{#if form.sourceConversationId}
						<div class="md:col-span-12">
							<div class="ats-alert ats-tone-info" role="alert">
								<span>
									{$_('Recorded from conversation')}
									<code class="font-code">{form.sourceConversationId}</code>.
									{$_('It may contain live customer data -- review before enabling.')}
								</span>
							</div>
						</div>
					{/if}
					<div class="md:col-span-12">
						<p class="mb-0 text-xs text-muted">
							{$_('Unmocked tool policy')}: <code class="font-code">{form.unmockedToolPolicy}</code>.
							{$_('Any tool this case does not mock is blocked instead of executed. P1 has no other option.')}
						</p>
					</div>
				</div>
			</div>
		</div>

		<div class="ats-card">
			<div class="ats-card-section ats-card-divider">
				<div class="flex flex-wrap items-center justify-between gap-3">
					<div class="flex items-center gap-3">
						<span class="ats-card-icon">
							<i class="mdi mdi-comment-text-multiple-outline"></i>
						</span>
						<div class="grow">
							<h5 class="ats-card-title">
								{$_('Turns')}
								{#if changedFields.includes('turns')}
									<span class="ats-badge ats-badge-soft ats-tone-info">{$_('changed by chat')}</span>
								{/if}
							</h5>
							<p class="ats-card-subtitle">{form.turns.length}</p>
						</div>
					</div>
					<button
						type="button"
						class="ats-btn ats-btn-sm ats-btn-soft ats-tone-primary"
						onclick={() => addTurn()}
					>
						<i class="mdi mdi-plus"></i> {$_('Add Turn')}
					</button>
				</div>
			</div>
			<div class="ats-card-body">
				{#each form.turns as turn, i (i)}
					<div class="ats-panel">
						<div class="mb-3 flex items-center justify-between gap-2">
							<h6 class="ats-panel-title">{$_('Turn')} {i + 1}</h6>
							<div class="flex items-center gap-1">
								<button
									type="button"
									class="ats-btn ats-btn-icon ats-btn-soft ats-tone-secondary"
									aria-label={$_('Move turn up')}
									disabled={i === 0}
									onclick={() => moveTurn(i, -1)}
								>
									<i class="mdi mdi-arrow-up"></i>
								</button>
								<button
									type="button"
									class="ats-btn ats-btn-icon ats-btn-soft ats-tone-secondary"
									aria-label={$_('Move turn down')}
									disabled={i === form.turns.length - 1}
									onclick={() => moveTurn(i, 1)}
								>
									<i class="mdi mdi-arrow-down"></i>
								</button>
								<button
									type="button"
									class="ats-btn ats-btn-icon ats-btn-soft ats-tone-danger"
									aria-label={$_('Remove turn')}
									onclick={() => removeTurn(i)}
								>
									<i class="mdi mdi-delete-outline"></i>
								</button>
							</div>
						</div>
						<div class="mb-4">
							<label class="ats-label" for={`turn-message-${i}`}>
								{$_('User message')} <span class="text-danger">*</span>
							</label>
							<textarea
								id={`turn-message-${i}`}
								class="ats-textarea"
								rows="2"
								bind:value={turn.userMessage}
							></textarea>
						</div>
						<div class="mb-3 flex flex-wrap items-center justify-between gap-2">
							<span class="text-xs text-muted">
								{$_('Assertions checked right after this turn')} ({turn.assertions.length})
							</span>
							<button
								type="button"
								class="ats-btn ats-btn-sm ats-btn-soft ats-tone-primary"
								onclick={() => (turn.assertions = [...turn.assertions, newAssertion()])}
							>
								<i class="mdi mdi-plus"></i> {$_('Add Assertion')}
							</button>
						</div>
						{@render assertionRows(turn.assertions, `turn-${i}-assertion`)}
					</div>
				{/each}
				{#if form.turns.length === 0}
					<div class="ats-empty">
						<p class="ats-empty-text">{$_('No turns yet. A case needs at least one.')}</p>
					</div>
				{/if}
			</div>
		</div>

		<div class="ats-card">
			<div class="ats-card-section ats-card-divider">
				<div class="flex flex-wrap items-center justify-between gap-3">
					<div class="flex items-center gap-3">
						<span class="ats-card-icon">
							<i class="mdi mdi-check-circle-outline"></i>
						</span>
						<div class="grow">
							<h5 class="ats-card-title">
								{$_('Case Assertions')}
								{#if changedFields.includes('assertions')}
									<span class="ats-badge ats-badge-soft ats-tone-info">{$_('changed by chat')}</span>
								{/if}
							</h5>
							<p class="ats-card-subtitle">{form.assertions.length}</p>
						</div>
					</div>
					<button
						type="button"
						class="ats-btn ats-btn-sm ats-btn-soft ats-tone-primary"
						onclick={() => (form.assertions = [...form.assertions, newAssertion()])}
					>
						<i class="mdi mdi-plus"></i> {$_('Add Assertion')}
					</button>
				</div>
			</div>
			<div class="ats-card-body">
				<p class="mb-3 text-xs text-muted">{$_('Evaluated once, after every turn has run.')}</p>
				{@render assertionRows(form.assertions, 'case-assertion')}
				{#if form.assertions.length === 0}
					<div class="ats-empty">
						<p class="ats-empty-text">{$_('No case-level assertions.')}</p>
					</div>
				{/if}
			</div>
		</div>

		<div class="ats-card">
			<div class="ats-card-section ats-card-divider">
				<div class="flex items-center gap-3">
					<span class="ats-card-icon">
						<i class="mdi mdi-clipboard-text-outline"></i>
					</span>
					<div class="grow">
						<h5 class="ats-card-title">{$_('Registration')}</h5>
						<p class="ats-card-subtitle">
							{$_('Decides when this case runs and what a failure of it means. Used to work out which cases a change actually needs to run.')}
						</p>
					</div>
				</div>
			</div>
			<div class="ats-card-body">
				<div class="grid grid-cols-1 gap-4 md:grid-cols-12">
					<div class="md:col-span-3">
						<label class="ats-label" for="case-priority">{$_('Priority')}</label>
						<select id="case-priority" class="ats-input" bind:value={form.priority}>
							{#each CASE_PRIORITIES as priority}
								<option value={priority}>{priority}</option>
							{/each}
						</select>
						<p class="mt-1 mb-0 text-xs text-muted">
							{$_('P0 runs in the stop-loss batch, P2 does not block a release.')}
						</p>
					</div>
					<div class="md:col-span-3">
						<label class="ats-label" for="case-severity">{$_('Severity')}</label>
						<select id="case-severity" class="ats-input" bind:value={form.severity}>
							{#each CASE_SEVERITIES as severity}
								<option value={severity}>{severity}</option>
							{/each}
						</select>
						<p class="mt-1 mb-0 text-xs text-muted">
							{$_('S0 is a stop, not a statistic. S2 is phrasing and experience.')}
						</p>
					</div>
					<div class="md:col-span-3">
						<label class="ats-label" for="case-batch">{$_('Batch')}</label>
						<select id="case-batch" class="ats-input" bind:value={form.batch}>
							<option value={null}>{$_('Derive from priority')}</option>
							{#each CASE_BATCHES as batch}
								<option value={batch}>{batch}</option>
							{/each}
						</select>
						<p class="mt-1 mb-0 text-xs text-muted">
							{$_('Runs in batch {n}.', { values: { n: effectiveBatch(form) } })}
						</p>
					</div>
					<div class="md:col-span-3 md:pt-4">
						<div class="ats-check">
							<input
								id="case-cross-cutting"
								type="checkbox"
								class="ats-switch"
								bind:checked={form.crossCutting}
							/>
							<label class="ats-check-label" for="case-cross-cutting">{$_('Cross-cutting')}</label>
						</div>
						<p class="mt-1 mb-0 text-xs text-muted">
							{$_('Runs in every scope, whatever changed, and always in batch 1.')}
						</p>
					</div>
					<div class="md:col-span-6">
						<label class="ats-label" for="case-involved-agents">{$_('Involved agents')}</label>
						<Select
							tag={'agent-test-case-involved-agents'}
							multiSelect={true}
							placeholder={$_('Derived from the entry agent')}
							selectedValues={form.involvedAgents}
							options={agentOptions}
							onselect={e => changeInvolvedAgents(e)}
						/>
						<p class="mt-1 mb-0 text-xs text-muted">
							{$_('Leave empty and the entry agent is used. Worth filling in for a routing case, where the agents that matter are the ones downstream of the router.')}
						</p>
					</div>
					<div class="md:col-span-3">
						<label class="ats-label" for="case-business-domain">{$_('Business domain')}</label>
						<input
							id="case-business-domain"
							type="text"
							class="ats-input"
							bind:value={form.businessDomain}
						/>
					</div>
					<div class="md:col-span-3">
						<label class="ats-label" for="case-last-reviewed">{$_('Last reviewed')}</label>
						<div class="flex gap-2">
							<input
								id="case-last-reviewed"
								type="date"
								class="ats-input"
								bind:value={form.lastReviewedDate}
							/>
							<button
								type="button"
								class="ats-btn ats-btn-sm ats-btn-soft ats-tone-secondary"
								onclick={() => markReviewedToday()}
							>
								{$_('Today')}
							</button>
						</div>
						<p class="mt-1 mb-0 text-xs text-muted">
							{$_('Never set automatically -- editing a case is not reviewing it.')}
						</p>
					</div>
					<div class="md:col-span-12">
						<label class="ats-label" for="case-expected-outcome">{$_('Expected outcome')}</label>
						<textarea
							id="case-expected-outcome"
							class="ats-textarea"
							rows="2"
							bind:value={form.expectedOutcome}
						></textarea>
						<p class="mt-1 mb-0 text-xs text-muted">
							{$_('For whoever reviews the result. Never evaluated -- an expected outcome a machine can check is an assertion, and belongs below where it will be enforced.')}
						</p>
					</div>
				</div>
			</div>
		</div>

		<div class="ats-card">
			<div class="ats-card-section ats-card-divider">
				<div class="flex flex-wrap items-center justify-between gap-3">
					<div class="flex items-center gap-3">
						<span class="ats-card-icon">
							<i class="mdi mdi-comment-text-multiple-outline"></i>
						</span>
						<div class="grow">
							<h5 class="ats-card-title">
								{$_('History')}
								{#if changedFields.includes('history')}
									<span class="ats-badge ats-badge-soft ats-tone-info">{$_('changed by chat')}</span>
								{/if}
							</h5>
							<p class="ats-card-subtitle">{form.history.length}</p>
						</div>
					</div>
					<button
						type="button"
						class="ats-btn ats-btn-sm ats-btn-soft ats-tone-primary"
						onclick={() => (form.history = [...form.history, newHistoryMessage()])}
					>
						<i class="mdi mdi-plus"></i> {$_('Add Message')}
					</button>
				</div>
			</div>
			<div class="ats-card-body">
				<p class="mb-3 text-xs text-muted">
					{$_('Written into the conversation before the first turn runs, so an existing question-and-answer exchange becomes the fixed starting context for this case.')}
					{$_('These messages are not driven through the model, cost no tokens, and never appear in the agent chain.')}
				</p>
				{#each form.history as message, i}
					<div class="ats-panel mb-2">
						<div class="grid grid-cols-1 gap-3 md:grid-cols-12">
							<div class="md:col-span-3">
								<label class="ats-label" for={`history-role-${i}`}>{$_('Role')}</label>
								<select id={`history-role-${i}`} class="ats-input" bind:value={message.role}>
									{#each HISTORY_ROLES as role}
										<option value={role}>{role === 'user' ? $_('User') : $_('Assistant')}</option>
									{/each}
								</select>
							</div>
							<div class="md:col-span-7">
								<label class="ats-label" for={`history-content-${i}`}>
									{$_('Content')} <span class="text-danger">*</span>
								</label>
								<textarea
									id={`history-content-${i}`}
									class="ats-textarea"
									rows="2"
									bind:value={message.content}
								></textarea>
							</div>
							<div class="flex items-end justify-end gap-1 md:col-span-2 md:pb-1">
								<button
									type="button"
									class="ats-btn ats-btn-icon ats-btn-soft ats-tone-secondary"
									aria-label={$_('Move up')}
									disabled={i === 0}
									onclick={() => moveHistoryMessage(i, -1)}
								>
									<i class="mdi mdi-arrow-up"></i>
								</button>
								<button
									type="button"
									class="ats-btn ats-btn-icon ats-btn-soft ats-tone-secondary"
									aria-label={$_('Move down')}
									disabled={i === form.history.length - 1}
									onclick={() => moveHistoryMessage(i, 1)}
								>
									<i class="mdi mdi-arrow-down"></i>
								</button>
								<button
									type="button"
									class="ats-btn ats-btn-icon ats-btn-soft ats-tone-danger"
									aria-label={$_('Remove message')}
									onclick={() => form.history.splice(i, 1)}
								>
									<i class="mdi mdi-trash-can-outline"></i>
								</button>
							</div>
						</div>
					</div>
				{/each}
				{#if form.history.length === 0}
					<div class="ats-empty">
						<p class="ats-empty-text">{$_('No history. The case starts from an empty conversation.')}</p>
					</div>
				{/if}
			</div>
		</div>

		<div class="ats-card">
			<div class="ats-card-section ats-card-divider">
				<div class="flex flex-wrap items-center justify-between gap-3">
					<div class="flex items-center gap-3">
						<span class="ats-card-icon">
							<i class="mdi mdi-database-outline"></i>
						</span>
						<div class="grow">
							<h5 class="ats-card-title">
								{$_('Initial States')}
								{#if changedFields.includes('initialStates')}
									<span class="ats-badge ats-badge-soft ats-tone-info">{$_('changed by chat')}</span>
								{/if}
							</h5>
							<p class="ats-card-subtitle">{form.initialStates.length}</p>
						</div>
					</div>
					<button
						type="button"
						class="ats-btn ats-btn-sm ats-btn-soft ats-tone-primary"
						onclick={() => (form.initialStates = [...form.initialStates, newState()])}
					>
						<i class="mdi mdi-plus"></i> {$_('Add State')}
					</button>
				</div>
			</div>
			<div class="ats-card-body">
				<p class="mb-3 text-xs text-muted">
					{$_('Injected before the conversation starts. Active rounds -1 means it never expires.')}
				</p>
				{@render stateRows(form.initialStates, 'initial-state')}
				{#if form.initialStates.length === 0}
					<div class="ats-empty">
						<p class="ats-empty-text">{$_('No initial states.')}</p>
					</div>
				{/if}
			</div>
		</div>

		<div class="ats-card">
			<div class="ats-card-section ats-card-divider">
				<div class="flex flex-wrap items-center justify-between gap-3">
					<div class="flex items-center gap-3">
						<span class="ats-card-icon">
							<i class="mdi mdi-tools"></i>
						</span>
						<div class="grow">
							<h5 class="ats-card-title">
								{$_('Tool Mocks')}
								{#if changedFields.includes('mocks')}
									<span class="ats-badge ats-badge-soft ats-tone-info">{$_('changed by chat')}</span>
								{/if}
							</h5>
							<p class="ats-card-subtitle">{form.mocks.length}</p>
						</div>
					</div>
					<button
						type="button"
						class="ats-btn ats-btn-sm ats-btn-soft ats-tone-primary"
						onclick={() => (form.mocks = [...form.mocks, newMock()])}
					>
						<i class="mdi mdi-plus"></i> {$_('Add Mock')}
					</button>
				</div>
			</div>
			<div class="ats-card-body">
				<p class="mb-3 text-xs text-muted">
					{$_('Every tool this case does not mock is blocked. If the agent needs a tool to move forward, mock it here.')}
				</p>
				{#each form.mocks as mock, i (i)}
					<!-- Cast for the same reason `suite` is cast further up: svelte-check collapses
					     $state([])'s element type to `never`, so a plain property read off a mock is an
					     error the moment it is not a bind: target. Pre-existing quirk of this file. -->
					{@const mockName = /** @type {any} */ (mock).functionName}
					{@const mockPicked = !isManualEntry(mock, 'manualFunctionName', 'functionName', toolOptions)}
					<div class="ats-panel">
						<div class="mb-3 flex items-center justify-between gap-2">
							<h6 class="ats-panel-title">{$_('Mock')} {i + 1}</h6>
							<button
								type="button"
								class="ats-btn ats-btn-icon ats-btn-soft ats-tone-danger"
								aria-label={$_('Remove mock')}
								onclick={() => form.mocks.splice(i, 1)}
							>
								<i class="mdi mdi-delete-outline"></i>
							</button>
						</div>
						<div class="grid grid-cols-1 gap-3 md:grid-cols-12">
							<div class="md:col-span-6">
								<label class="ats-label" for={mockPicked ? undefined : `mock-name-${i}`}>
									{$_('Function name')} <span class="text-danger">*</span>
								</label>
								<!-- Picked for the same reason the assertion target is, only the cost of a
								     typo is higher here: the real tool stays unmocked, UnmockedToolPolicy
								     blocks it, and the turn is cut short with nothing naming the mock that
								     missed. -->
								{#if mockPicked}
									<Select
										tag={`mock-name-${i}`}
										searchMode={true}
										searchPlaceholder={$_('Search tools')}
										placeholder={$_('Pick a tool')}
										selectedValues={mockName ? [mockName] : []}
										options={toolOptions}
										onselect={e => pickValue(mock, 'functionName', e)}
									/>
								{:else}
									<input
										id={`mock-name-${i}`}
										type="text"
										class="ats-input font-code"
										placeholder={$_('function name')}
										bind:value={mock.functionName}
									/>
								{/if}
								<button
									type="button"
									class="ats-btn ats-btn-link"
									onclick={() => toggleManualEntry(mock, 'manualFunctionName', 'functionName', toolOptions)}
								>
									{mockPicked ? $_('Type a name instead') : $_('Pick from the list')}
								</button>
							</div>
							<div class="md:col-span-3">
								<label class="ats-label" for={`mock-call-index-${i}`}>
									{$_('Call index (0-based, optional)')}
								</label>
								<input
									id={`mock-call-index-${i}`}
									type="number"
									min="0"
									class="ats-input"
									bind:value={mock.callIndex}
								/>
							</div>
							<div class="flex items-center md:col-span-3 md:items-end md:pb-1">
								<div class="ats-check">
									<input
										id={`mock-stop-${i}`}
										type="checkbox"
										class="ats-check-input"
										bind:checked={mock.stopCompletion}
									/>
									<label class="ats-check-label" for={`mock-stop-${i}`}>{$_('Stop completion')}</label>
								</div>
							</div>
							<div class="md:col-span-12">
								<label class="ats-label" for={`mock-args-${i}`}>
									{$_('Args match (JSON subset, optional)')}
								</label>
								<input
									id={`mock-args-${i}`}
									type="text"
									class="ats-input font-code"
									placeholder={'{"woNum":"B9897413"}'}
									bind:value={mock.argsMatchJson}
								/>
							</div>
							<div class="md:col-span-12">
								<label class="ats-label" for={`mock-result-${i}`}>{$_('Result content')}</label>
								<textarea
									id={`mock-result-${i}`}
									class="ats-textarea ats-textarea-code"
									rows="3"
									bind:value={mock.resultContent}
								></textarea>
							</div>
							<div class="md:col-span-12">
								<div class="mb-3 flex flex-wrap items-center justify-between gap-2">
									<span class="text-xs text-muted">
										{$_('State written when this mock is hit')} ({mock.stateWrites?.length || 0}).
										{$_('Many tools pass data to later turns through state, not through their return value.')}
									</span>
									<button
										type="button"
										class="ats-btn ats-btn-sm ats-btn-soft ats-tone-primary"
										onclick={() => (mock.stateWrites = [...(mock.stateWrites || []), newState()])}
									>
										<i class="mdi mdi-plus"></i> {$_('Add State Write')}
									</button>
								</div>
								{@render stateRows(mock.stateWrites || [], `mock-${i}-state`)}
							</div>
						</div>
					</div>
				{/each}
				{#if form.mocks.length === 0}
					<div class="ats-empty">
						<p class="ats-empty-text">
							{$_('No mocks. Every tool call this case makes will be blocked.')}
						</p>
					</div>
				{/if}
			</div>
		</div>

		<div class="ats-card">
			<div class="ats-card-section flex flex-wrap items-center justify-end gap-2">
				<button type="button" class="ats-btn ats-btn-secondary" onclick={() => goBack()}>
					{$_('Cancel')}
				</button>
				<button
					type="button"
					class="ats-btn ats-btn-primary"
					disabled={!canSave}
					onclick={(e) => submit(e)}
				>
					{#if isSaving}
						<i class="mdi mdi-loading mdi-spin"></i>
					{/if}
					{$_('Save')}
				</button>
			</div>
		</div>
		</div>
	</div>
{/if}
