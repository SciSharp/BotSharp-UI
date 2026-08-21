<script>
	import { onMount } from 'svelte';
	import { _ } from 'svelte-i18n';
	import { goto } from '$app/navigation';
	import Breadcrumb from '$lib/common/shared/Breadcrumb.svelte';
	import HeadTitle from '$lib/common/shared/HeadTitle.svelte';
	import LoadingToComplete from '$lib/common/spinners/LoadingToComplete.svelte';
	import Select from '$lib/common/dropdowns/Select.svelte';
	import { getAgentOptions } from '$lib/services/agent-service.js';
	import { selectScope } from '$lib/services/agent-test-service.js';
	import { errorMessage, t } from '$lib/helpers/utils/agent-test.js';

	/**
	 * Planning which cases a change needs to run is a different job from browsing suites, and it
	 * spans all of them -- so it gets its own page rather than a panel on a page titled "Test
	 * Suites". It is also deliberately separate from triggering a run: folding it into a run button
	 * would mean the only way to see the plan is to have already paid for it.
	 */

	/** @type {{ label: string, value: string }[]} */
	let agentOptions = $state([]);

	/** @type {{ targetAgentIds: string[], fullPlatform: boolean, batch: number | null }} */
	let query = $state({ targetAgentIds: [], fullPlatform: false, batch: null });

	/** @type {import('$agentTestTypes').ScopeSelection | null} */
	let scope = $state(null);

	let isLoading = $state(false);
	let errorText = $state('');

	let canPlan = $derived(!isLoading && (query.fullPlatform || query.targetAgentIds.length > 0));

	onMount(() => {
		getAgentOptions().then(res => {
			agentOptions = (res || []).map(x => ({ label: x.name, value: x.id }));
		}).catch(() => {
			agentOptions = [];
		});
	});

	/** @param {any} e */
	function changeAgents(e) {
		query.targetAgentIds = (e?.detail?.selecteds || []).map((/** @type {any} */ s) => s.value);
	}

	function plan() {
		if (!canPlan) return;
		isLoading = true;
		errorText = '';
		selectScope({
			targetAgentIds: query.targetAgentIds,
			fullPlatform: query.fullPlatform,
			batch: query.batch
		}).then(res => {
			scope = res;
		}).catch(err => {
			scope = null;
			errorText = errorMessage(err, t('Failed to work out the scope.'));
		}).finally(() => {
			isLoading = false;
		});
	}

	/**
	 * Included reasons are not all equal: unknownAgents means the harness could not show the change
	 * misses this case and included it to be safe, which is a nudge to fill in the metadata rather
	 * than a clean match.
	 * @param {string} reason
	 */
	function reasonTone(reason) {
		switch (reason) {
			case 'crossCutting': return 'info';
			case 'targetAgent': return 'success';
			case 'fullPlatform': return 'success';
			case 'unknownAgents': return 'warning';
			default: return 'secondary';
		}
	}

	function goBack() {
		goto('/page/agent-test');
	}
</script>

<HeadTitle title={$_('Plan a scope')} />
<Breadcrumb title={$_('Agent Testing')} pagetitle={$_('Plan a scope')} />

<LoadingToComplete isLoading={isLoading} successText={''} errorText={''} />

<div class="flex flex-wrap">
	<div class="w-full">
		<div class="ats-card">
			<div class="ats-card-section ats-card-divider">
				<div class="flex flex-wrap items-center justify-between gap-3">
					<div class="flex items-center gap-3">
						<span class="ats-card-icon">
							<i class="mdi mdi-target"></i>
						</span>
						<div class="grow">
							<h5 class="ats-card-title">{$_('Plan a scope')}</h5>
							<p class="ats-card-subtitle">
								{$_('Which cases a change needs to run, and which it does not. Read-only -- it plans a run, it does not start one.')}
							</p>
						</div>
					</div>
					<button type="button" class="ats-btn ats-btn-soft ats-tone-secondary" onclick={() => goBack()}>
						<i class="mdi mdi-arrow-left"></i> {$_('Test Suites')}
					</button>
				</div>
			</div>
			<div class="ats-card-body">
				<div class="grid grid-cols-1 gap-4 md:grid-cols-12">
					<div class="md:col-span-5">
						<label class="ats-label" for="scope-agents">{$_('Changed agents')}</label>
						<Select
							tag={'agent-test-scope-agents'}
							multiSelect={true}
							placeholder={$_('Select Agent')}
							selectedValues={query.targetAgentIds}
							options={agentOptions}
							disabled={query.fullPlatform}
							onselect={e => changeAgents(e)}
						/>
					</div>
					<div class="md:col-span-2">
						<label class="ats-label" for="scope-batch">{$_('Batch')}</label>
						<select id="scope-batch" class="ats-input" bind:value={query.batch}>
							<option value={null}>{$_('All batches')}</option>
							<option value={1}>1</option>
							<option value={2}>2</option>
							<option value={3}>3</option>
						</select>
					</div>
					<div class="md:col-span-3 md:pt-4">
						<div class="ats-check">
							<input
								id="scope-full-platform"
								type="checkbox"
								class="ats-switch"
								bind:checked={query.fullPlatform}
							/>
							<label class="ats-check-label" for="scope-full-platform">
								{$_('Platform-wide change')}
							</label>
						</div>
						<p class="mt-1 mb-0 text-xs text-muted">
							{$_('Narrowing is switched off: no agent is demonstrably untouched.')}
						</p>
					</div>
					<div class="md:col-span-2 md:pt-4">
						<button
							type="button"
							class="ats-btn ats-btn-primary w-full"
							disabled={!canPlan}
							onclick={() => plan()}
						>
							{$_('Plan')}
						</button>
					</div>
				</div>

				{#if errorText}
					<div class="ats-alert ats-tone-warning mt-3" role="alert">
						<span>{errorText}</span>
					</div>
				{/if}
			</div>
		</div>
	</div>
</div>

{#if scope}
	<div class="flex flex-wrap">
		<div class="w-full">
			<div class="ats-card">
				<div class="ats-card-section ats-card-divider">
					<div class="flex items-center gap-3">
						<span class="ats-card-icon">
							<i class="mdi mdi-format-list-checks"></i>
						</span>
						<div class="grow">
							<h5 class="ats-card-title">{$_('Evaluation scope')}</h5>
							<p class="ats-card-subtitle">
								{scope.included.length}
								{$_('included')} ·
								{scope.excluded.length}
								{$_('excluded')} ·
								{$_('of {n} registered', { values: { n: scope.totalCases } })}
							</p>
						</div>
					</div>
				</div>
				<div class="ats-card-body">
					{#if scope.totalCases === 0}
						<div class="ats-empty">
							<p class="ats-empty-text">{$_('No test cases are registered yet.')}</p>
						</div>
					{:else}
						<div class="ats-table-wrap scrollbar-on-hover">
							<table class="ats-table">
								<thead>
									<tr>
										<th scope="col" style="width: 90px;">{$_('In scope')}</th>
										<th scope="col">{$_('Case')}</th>
										<th scope="col">{$_('Suite')}</th>
										<th scope="col" style="width: 80px;">{$_('Batch')}</th>
										<th scope="col" style="width: 90px;">{$_('Severity')}</th>
										<th scope="col">{$_('Reason')}</th>
									</tr>
								</thead>
								<tbody>
									<!-- Both halves in one table, included first. Splitting them into two
									     collapsible panels would make it possible to read only the
									     reassuring one, and the exclusions are the half that matters: an
									     excluded case produces no result to notice. -->
									{#each [...scope.included, ...scope.excluded] as scoped (scoped.caseId)}
										{@const included = scope.included.some(c => c.caseId === scoped.caseId)}
										<tr class={included ? '' : 'text-muted'}>
											<td>
												{#if included}
													<span class="ats-badge ats-tone-success">{$_('Yes')}</span>
												{:else}
													<span class="ats-badge ats-badge-soft ats-tone-secondary">{$_('No')}</span>
												{/if}
											</td>
											<td>{scoped.caseName}</td>
											<td class="text-xs">{scoped.suiteName}</td>
											<td>{scoped.batch}</td>
											<td>{scoped.severity}</td>
											<td>
												<span class="ats-badge ats-badge-soft ats-tone-{reasonTone(scoped.reason)}">
													{scoped.reason}
												</span>
												{#if scoped.reason === 'unknownAgents'}
													<span class="ms-1 text-xs text-muted">
														{$_('No involved agents known, so it was included to be safe.')}
													</span>
												{/if}
											</td>
										</tr>
									{/each}
								</tbody>
							</table>
						</div>
					{/if}
				</div>
			</div>
		</div>
	</div>
{/if}
