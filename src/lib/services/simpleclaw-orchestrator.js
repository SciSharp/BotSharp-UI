/**
 * The run loop: plan a request, then walk its steps one at a time, carrying values
 * between them.
 *
 * The two halves of the contract are kept strictly apart. This file speaks only
 * business language — goals, values, which agent — and never clicks or coordinates.
 * SimpleClaw owns the other half. Keeping that line clean is what lets either side
 * change without breaking the other.
 *
 * Only one orchestration may be in flight at a time. SimpleClaw's loop and browser
 * backend are single-flight, so two loops pushing steps into the same queue would have
 * their steps interleave and destroy each other's browser sessions.
 */

import { newConversation, sendMessageToHub, getDialogs } from '$lib/services/conversation-service';
import { BOT_SENDERS } from '$lib/helpers/constants';
import * as simpleclaw from '$lib/services/simpleclaw-service';
import { SIMPLECLAW_PLANNER_AGENT_ID } from '$lib/helpers/constants/simpleclaw';

/**
 * Render the agent roster the planner routes on.
 *
 * Only `system` and `operations` are included. `persona` is deliberately left out: in
 * practice it holds the agent's ReAct operating instructions ("each turn, briefly
 * reason, then call exactly one tool…"), which say nothing about which business system
 * the agent serves. Feeding that to the planner only dilutes the two fields that do.
 *
 * @param {import('$simpleclawTypes').SimpleClawAgent[]} agents
 * @returns {string}
 */
export function buildRoster(agents) {
    if (!agents?.length) return '(no agents are configured)';

    return agents
        .map((a) => {
            // "not demonstrated yet" is not "cannot do it" — the planner is told to route
            // on reachability and use this only to break ties.
            const ops = a.operations?.length
                ? a.operations.map((o) => o.operation).join(' | ')
                : '(none demonstrated yet)';
            return [
                `- id: ${a.id}`,
                `  name: ${a.name}`,
                `  system: ${a.system ?? '(desktop — operates local applications, not a website)'}`,
                `  operations: ${ops}`
            ].join('\n');
        })
        .join('\n');
}

/** The fence the copilot is told to use. */
const PLAN_FENCE = /```simpleclaw-plan\s*([\s\S]*?)```/i;

/**
 * Any fenced block, whatever its tag. Used only as a fallback, and only when the block
 * turns out to look like a plan — models reach for ```json out of habit, and losing a
 * plan over the tag would silently drop the work the person asked for.
 */
const ANY_FENCE = /```[a-z-]*\s*([\s\S]*?)```/gi;

/**
 * Is this a plan and not, say, a JSON snippet the copilot quoted in an answer? Requiring
 * an agentId on every step is what makes the test safe: prose about JSON does not carry
 * one, and a plan without one cannot run anyway.
 *
 * @param {any} value
 */
function looksLikePlan(value) {
    return (
        value &&
        typeof value === 'object' &&
        Array.isArray(value.steps) &&
        value.steps.length > 0 &&
        value.steps.every((/** @type {any} */ s) => s && typeof s.agentId === 'string' && s.agentId)
    );
}

/**
 * @typedef {{ kind: 'text', text: string }
 *         | { kind: 'plan', reply: string, plan: import('$simpleclawTypes').Plan }} CopilotTurn
 */

/**
 * Interpret the TEXT of one assistant turn. `readTurn` is the way in; this is its
 * fallback for a plan that arrived inline instead of as a function call.
 *
 * Most turns are ordinary prose — the copilot answers, asks something back, or reports
 * on an earlier result. Only a turn carrying a plan block is a request to operate a real
 * system, and that distinction has to be exact: treating prose as a plan would run
 * nothing, and missing a plan block would silently drop the work.
 *
 * @param {string} text
 * @returns {CopilotTurn}
 */
export function parseTurn(text) {
    const raw = (text ?? '').trim();

    const tagged = raw.match(PLAN_FENCE);
    if (tagged) {
        let parsed;
        try {
            parsed = JSON.parse(tagged[1].trim());
        } catch {
            throw new Error('The copilot produced a plan block that is not valid JSON.');
        }
        if (!Array.isArray(parsed.steps)) {
            throw new Error('The plan block has no steps array.');
        }
        return toPlanTurn(parsed, raw.replace(PLAN_FENCE, '').trim());
    }

    // Fallbacks. The copilot is asked for a `simpleclaw-plan` fence, but it is a language
    // model: it reaches for ```json, or drops the fence entirely. Recovering here is
    // cheap; the alternative is a plan quietly read as chat and never run.
    for (const [block, body] of raw.matchAll(ANY_FENCE)) {
        const parsed = tryParse(body);
        if (looksLikePlan(parsed)) {
            return toPlanTurn(parsed, raw.replace(block, '').trim());
        }
    }

    const bare = tryParse(raw);
    if (looksLikePlan(bare)) {
        return toPlanTurn(bare, '');
    }

    return { kind: 'text', text: raw };
}

/** @param {string} body */
function tryParse(body) {
    try {
        return JSON.parse(body.trim());
    } catch {
        return null;
    }
}

/**
 * @param {any} parsed
 * @param {string} outside prose that came alongside the block, if any
 * @returns {CopilotTurn}
 */
function toPlanTurn(parsed, outside) {
    return {
        kind: 'plan',
        reply: outside,
        plan: {
            // `reply` on the plan is what the card shows above the steps; fall back to any
            // prose that came with the block.
            reply: String(parsed.reply ?? outside),
            steps: parsed.steps,
            // Never inferred here. The backend applies the rule; an absent flag means
            // confirm, which is the safe direction for a field that went missing.
            autoRun: parsed.autoRun === true,
            confidence: parsed.confidence,
            readOnly: parsed.readOnly === true
        }
    };
}

/**
 * Take the useful value out of a step's prose answer, so the next step's goal reads as
 * an instruction rather than a quotation.
 *
 * Returns `matched: false` when the pattern misses. The caller surfaces that, because
 * substituting a whole paragraph into the next goal is a real degradation and silently
 * doing it makes the resulting confusion impossible to trace.
 *
 * @param {string} answer
 * @param {string} [pattern]
 * @returns {{ value: string, matched: boolean }}
 */
export function captureValue(answer, pattern) {
    const text = (answer ?? '').trim();
    if (!pattern) return { value: text, matched: true };

    try {
        const hit = text.match(new RegExp(pattern));
        if (hit) return { value: hit[0], matched: true };
    } catch {
        // A malformed pattern from the planner is not worth aborting a run over.
    }
    return { value: text, matched: false };
}

/**
 * Substitute {{name}} references with values captured by earlier steps.
 *
 * An unresolved reference is left verbatim and reported. Replacing it with an empty
 * string would hand a mutilated instruction to an agent that is about to operate a real
 * system — far worse than stopping.
 *
 * @param {string} text
 * @param {Record<string, string>} values
 * @returns {{ text: string, missing: string[] }}
 */
export function resolveRefs(text, values) {
    /** @type {string[]} */
    const missing = [];

    const resolved = (text ?? '').replace(/\{\{\s*([\w.-]+)\s*\}\}/g, (whole, name) => {
        if (Object.prototype.hasOwnProperty.call(values, name)) {
            return values[name];
        }
        // {{stepN}} — positional fallback, so a planner that ignores the capture
        // convention still produces a runnable plan.
        const positional = /^step(\d+)$/i.exec(name);
        if (positional) {
            const key = `__step${Number(positional[1])}`;
            if (Object.prototype.hasOwnProperty.call(values, key)) return values[key];
        }
        missing.push(name);
        return whole;
    });

    return { text: resolved, missing };
}

/**
 * @typedef {Object} OrchestratorCallbacks
 * @property {(phase: string) => void} [onPhase]
 * @property {(plan: import('$simpleclawTypes').Plan) => void} [onPlan]
 * @property {(index: number, step: import('$simpleclawTypes').PlanStep, goal: string) => void} [onStepStart]
 * @property {(index: number, runId: string, queuePosition: number) => void} [onQueued]
 * @property {(index: number, event: string, data: any) => void} [onRunEvent]
 * @property {(index: number, result: import('$simpleclawTypes').RunResult, captured: string?) => void} [onStepEnd]
 * @property {(message: string) => void} [onWarning]
 * @property {(summary: {ok: boolean, text: string, needsDemo?: boolean, agentId?: string}) => void} [onDone]
 */

/**
 * Open a BotSharp conversation for the planner.
 *
 * Created lazily by the caller on the first request, not on page load — opening the page
 * and typing nothing should not leave an empty conversation behind.
 *
 * @returns {Promise<string>} conversation id
 */
export async function createPlannerConversation() {
    const conv = await newConversation(SIMPLECLAW_PLANNER_AGENT_ID);
    if (!conv?.id) throw new Error('Could not open a planner conversation.');
    return conv.id;
}

/**
 * Read an existing thread back so a session can be picked up where it was left.
 *
 * Only the prose survives. A plan lives on the chat response, not in the stored dialog,
 * so a past plan comes back as the sentence that introduced it — and that is the right
 * outcome rather than a gap to close. Restoring a live "Run these steps" button on a plan
 * from another day would invite re-running work that already happened, and some of these
 * steps are irreversible in a real system.
 *
 * @param {string} conversationId
 * @returns {Promise<{role: 'user'|'assistant', text: string}[]>}
 */
export async function loadHistory(conversationId) {
    const dialogs = await getDialogs(conversationId);
    return (dialogs || [])
        .map((d) => ({
            role: /** @type {'user'|'assistant'} */ (
                BOT_SENDERS.includes(d.sender?.role || '') ? 'assistant' : 'user'
            ),
            text: (d.text ?? '').trim()
        }))
        .filter((d) => d.text.length > 0);
}

/**
 * Send one turn to the copilot and interpret what comes back.
 *
 * Goes through a conversation rather than the one-shot instruct endpoint. A session is a
 * conversation: the person asks several things and follows up on earlier answers, and
 * operating a computer is one task within that, not the point of it. The thread is also
 * what makes results usable later — "what was that work order's status again" only works
 * if the earlier outcome is still in the history.
 *
 * The roster is re-sent every turn. It is current state, not history: an agent may have
 * gained a demonstration since the last message, and a stale roster is exactly what
 * produces a plan routed at the wrong system.
 *
 * @param {string} text
 * @param {import('$simpleclawTypes').SimpleClawAgent[]} agents
 * @param {string} conversationId
 * @returns {Promise<CopilotTurn>}
 */
export async function sendTurn(text, agents, conversationId) {
    const res = await sendMessageToHub(SIMPLECLAW_PLANNER_AGENT_ID, conversationId, text, {
        states: [{ key: 'roster', value: buildRoster(agents) }]
    });
    return readTurn(res);
}

/**
 * Interpret one chat response.
 *
 * A plan arrives as a function call, not as text. The copilot's `operate_business_system`
 * tool call is validated against a schema before it ever reaches here, and it has no
 * partial form — which is the whole point of moving it out of the reply. Prose that
 * merely announces work ("I'll check that now.") is what a plan used to degrade into,
 * and it left the person waiting on a run that was never proposed.
 *
 * @param {any} res chat response from the hub
 * @returns {CopilotTurn}
 */
export function readTurn(res) {
    const plan = res?.data?.simpleclaw_plan;
    if (looksLikePlan(plan)) {
        return toPlanTurn(plan, '');
    }

    // The text path stays as a fallback for a reply that carries a plan inline. It should
    // not happen now that the tool exists, but recovering costs nothing and the failure
    // it guards against — silently reading a plan as chat — is invisible to the person.
    return parseTurn(res?.text ?? '');
}

/**
 * Put the outcome of a run back into the conversation.
 *
 * Without this the thread has a hole in it: the person saw the result on screen but the
 * copilot never did, so the next question about it gets answered from nothing. Posting
 * it as a turn also lets the copilot phrase the answer to the original question, which
 * is usually more useful than the agent's raw closing line.
 *
 * The wording names the function on purpose, and that is not decoration. BotSharp stores a
 * plan turn as a plain assistant row — the reply survives, the tool call does not — so on
 * the next turn the copilot's own history shows it answering a system lookup with nothing
 * but a sentence, and the result appearing out of nowhere. Left alone, that is a worked
 * example of the one failure the prompt forbids, sitting closer to the model than the
 * prompt is. Attributing the outcome to the call restores the half the record dropped.
 *
 * @param {string} conversationId
 * @param {import('$simpleclawTypes').SimpleClawAgent[]} agents
 * @param {{ok: boolean, text: string, needsDemo?: boolean}} outcome
 * @returns {Promise<CopilotTurn>}
 */
export async function reportOutcome(conversationId, agents, outcome) {
    const head = outcome.ok
        ? 'The plan you proposed by calling operate_business_system has finished'
        : 'The plan you proposed by calling operate_business_system did not finish';
    return sendTurn(`[${head}] ${outcome.text}`, agents, conversationId);
}

/**
 * First-person commitment to go and do something.
 */
const COMMITS_TO_WORK = /\b(?:i['’]ll|i will|i['’]m going to|i am going to|let me)\b/i;

/**
 * Wording that commits to nothing after all: a question back, or a stated inability. These
 * are the legitimate prose turns that would otherwise trip the pattern above — "I'll need
 * the work order number first" is the copilot doing exactly what it should.
 */
const COMMITS_TO_NOTHING = /\?|\b(?:need|needed|require[sd]?|cannot|can['’]?t|unable|no agent|don['’]?t have)\b/i;

/**
 * Does this prose promise work in a system that no plan was proposed for?
 *
 * A heuristic, and it has to be: the signal is English phrasing, not structure. It is
 * tuned to be cheap to be wrong about in either direction. A false positive costs one
 * extra round-trip and produces a second prose turn. A false negative just leaves today's
 * behaviour. Neither can start work — only a plan the person confirms does that.
 *
 * @param {string} text
 * @returns {boolean}
 */
export function announcesUnproposedWork(text) {
    const prose = (text ?? '').trim();
    if (!prose) return false;
    return COMMITS_TO_WORK.test(prose) && !COMMITS_TO_NOTHING.test(prose);
}

/**
 * Ask the copilot to either propose the work it just described, or take back the
 * description.
 *
 * Worth a round-trip because the alternative is silence: a turn that says "I'll look that
 * up" and proposes nothing leaves the person watching a thread where their request simply
 * stopped, with nothing on screen saying so. The wording covers both readings, so a
 * misfire resolves into an ordinary answer rather than an argument about what was meant.
 *
 * Deliberately not used on the turn that follows a run. That turn is supposed to be prose,
 * and pressing it to call the function again is how work that just happened gets proposed
 * a second time.
 *
 * @param {string} conversationId
 * @param {import('$simpleclawTypes').SimpleClawAgent[]} agents
 * @returns {Promise<CopilotTurn>}
 */
export async function nudgeForPlan(conversationId, agents) {
    return sendTurn(
        '[Nothing reached the operator] Your last turn described work in a business system' +
            ' but made no operate_business_system call, so nothing was proposed and nothing' +
            ' ran. If you meant to do that work, call the function now. If you did not,' +
            ' answer in prose without describing work you are not proposing.',
        agents,
        conversationId
    );
}

/**
 * Execute a confirmed plan, one step at a time.
 *
 * Deliberately does NOT retry a failed step. SimpleClaw cannot know whether retrying is
 * safe — a resubmitted filing is a real duplicate — and neither can this loop. That
 * decision belongs to the person, who is the only one who knows what the last attempt
 * already did.
 *
 * @param {import('$simpleclawTypes').Plan} plan
 * @param {OrchestratorCallbacks} cb
 * @returns {Promise<void>}
 */
export async function runPlan(plan, cb = {}) {
    /** @type {Record<string, string>} */
    const values = {};
    let lastAnswer = '';

    for (let i = 0; i < plan.steps.length; i++) {
        const step = plan.steps[i];
        const { text: goal, missing } = resolveRefs(step.goal, values);

        // Whichever step we end on is the one whose agent produced the answer, so the
        // outcome is attributed to it rather than to the plan as a whole.
        if (missing.length) {
            cb.onDone?.({
                ok: false,
                agentId: step.agentId,
                text: `Step ${i + 1} refers to ${missing.map((m) => `{{${m}}}`).join(', ')}, which no earlier step produced. Stopping before anything is changed.`
            });
            return;
        }

        cb.onStepStart?.(i, step, goal);

        /** @type {import('$simpleclawTypes').StartRunResponse} */
        let started;
        try {
            started = await simpleclaw.startRun({ goal, agentId: step.agentId, expect: step.expect });
        } catch (err) {
            cb.onDone?.({ ok: false, agentId: step.agentId, text: `Could not start step ${i + 1}: ${errorText(err)}` });
            return;
        }

        cb.onQueued?.(i, started.runId, started.queuePosition ?? 0);

        /** @type {import('$simpleclawTypes').RunResult} */
        let result;
        try {
            result = await followToResult(started.runId, (event, data) => cb.onRunEvent?.(i, event, data));
        } catch (err) {
            cb.onDone?.({ ok: false, agentId: step.agentId, text: `Lost track of step ${i + 1}: ${errorText(err)}` });
            return;
        }

        if (result.status !== 'finished') {
            // Partial completion is normal in a multi-system flow. Report where it
            // stopped and, when the plan was mostly improvised, say what would actually
            // fix it — a demonstration, not a reworded prompt.
            const lowCoverage = result.demoCoverage !== null && result.demoCoverage < 0.5;
            cb.onStepEnd?.(i, result, null);
            cb.onDone?.({
                ok: false,
                agentId: step.agentId,
                needsDemo: lowCoverage,
                text:
                    `Step ${i + 1} did not complete: ${result.answer || result.status}.` +
                    (lowCoverage
                        ? ' Most of that plan was improvised rather than backed by a demonstration — recording one for this operation would likely fix it.'
                        : '')
            });
            return;
        }

        lastAnswer = result.answer;
        values[`__step${i + 1}`] = result.answer.trim();

        let captured = null;
        if (step.capture?.name) {
            const { value, matched } = captureValue(result.answer, step.capture.pattern);
            values[step.capture.name] = value;
            captured = value;
            if (!matched) {
                cb.onWarning?.(
                    `Step ${i + 1} reported an answer that did not match the expected shape for "${step.capture.name}", so the whole answer is being passed on. The next step may misread it.`
                );
            }
        }

        cb.onStepEnd?.(i, result, captured);
    }

    cb.onDone?.({ ok: true, agentId: plan.steps[plan.steps.length - 1]?.agentId, text: lastAnswer });
}

/**
 * Subscribe to a run and resolve with its terminal result.
 *
 * @param {string} runId
 * @param {(event: string, data: any) => void} onEvent
 * @returns {Promise<import('$simpleclawTypes').RunResult>}
 */
function followToResult(runId, onEvent) {
    return new Promise((resolve, reject) => {
        /** @type {(() => void) | null} */
        let unsubscribe = null;
        // Covers every terminal path, not just success. Events can arrive before
        // followRun's promise resolves, and a run that errors in that window would
        // otherwise leave its listener attached for the rest of the session.
        let done = false;

        function cleanup() {
            done = true;
            unsubscribe?.();
            unsubscribe = null;
        }

        simpleclaw
            .followRun(runId, (event, data) => {
                onEvent(event, data);
                if (done) return;

                if (event === 'result') {
                    cleanup();
                    resolve(data);
                } else if (event === 'closed') {
                    cleanup();
                    reject(new Error('The event stream ended before the run finished.'));
                } else if (event === 'error') {
                    cleanup();
                    reject(new Error(data?.message ?? 'The event stream failed.'));
                }
            })
            .then((fn) => {
                unsubscribe = fn;
                // Terminal already reached while we were still subscribing.
                if (done) cleanup();
            })
            .catch(reject);
    });
}

/**
 * @param {any} err
 * @returns {string}
 */
export function errorText(err) {
    if (!err) return 'Unknown error';
    if (typeof err === 'string') return err;
    if (err.message) return err.message;
    return String(err);
}
