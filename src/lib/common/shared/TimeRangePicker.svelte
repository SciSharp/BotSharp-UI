<script>
	import { createEventDispatcher } from 'svelte';
	import { Button, Input } from '@sveltestrap/sveltestrap';
	import { TIME_RANGE_OPTIONS, CUSTOM_DATE_RANGE } from '$lib/helpers/constants';
	import { clickoutsideDirective } from '$lib/helpers/directives';

	/** @type {string} */
	export let timeRange = '';

	/** @type {string} */
	export let startDate = '';

	/** @type {string} */
	export let endDate = '';

	/** @type {string} */
	let timeRangeDisplayText = '';

	/** @type {boolean} */
	let showDatePicker = false;

	/** @type {HTMLDivElement | null} */
	let datePickerRef = null;

	/** @type {string} */
	let datePickerTab = 'relative';

	// Preset time range options
	const presetTimeRangeOptions = TIME_RANGE_OPTIONS.map(x => ({
		label: x.label,
		value: x.value
	}));

	// Get today's date in YYYY-MM-DD format
	const getTodayStr = () => {
		const d = new Date();
		return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
	};

	// Get yesterday's date in YYYY-MM-DD format
	const getYesterdayStr = () => {
		const d = new Date();
		d.setDate(d.getDate() - 1);
		return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
	};

	// Format date for display (YYYY-MM-DD -> MM/DD/YYYY)
	const formatDateForDisplay = (/** @type {string} */ dateStr) => {
		if (!dateStr) return '';
		const [year, month, day] = dateStr.split('-');
		return `${month}/${day}/${year}`;
	};

	// Update time range display text reactively
	$: {
		if (timeRange === CUSTOM_DATE_RANGE && startDate && endDate) {
			const start = formatDateForDisplay(startDate);
			const end = formatDateForDisplay(endDate);
			if (start === end) {
				timeRangeDisplayText = start;
			} else {
				timeRangeDisplayText = `${start} - ${end}`;
			}
		} else if (timeRange === CUSTOM_DATE_RANGE) {
			timeRangeDisplayText = 'Custom';
		} else {
			const selected = presetTimeRangeOptions.find(x => x.value === timeRange);
			timeRangeDisplayText = selected ? selected.label : '';
		}
	}

	const dispatch = createEventDispatcher();

	/** @param {string} optionValue */
	function handleRelativeOptionClick(/** @type {string} */ optionValue) {
		timeRange = optionValue;
		startDate = '';
		endDate = '';
		showDatePicker = false;
		dispatch('change', { timeRange, startDate, endDate });
	}

	function handleCustomConfirm() {
		if (startDate) {
			// If endDate is not provided, default to startDate
			if (!endDate) {
				endDate = startDate;
			}
			// Force reactivity by reassigning
			timeRange = CUSTOM_DATE_RANGE;
		}
		showDatePicker = false;
		dispatch('change', { timeRange, startDate, endDate });
	}

	function handleCancel() {
		showDatePicker = false;
	}
</script>

<div class="position-relative">
	<button
		type="button"
		class="form-control text-start d-flex align-items-center justify-content-between"
		on:click={() => {
			showDatePicker = !showDatePicker;
			if (showDatePicker) {
				// If custom date is selected, switch to custom tab; otherwise use relative tab
				datePickerTab = timeRange === CUSTOM_DATE_RANGE ? 'custom' : 'relative';
			}
		}}
		style="cursor: pointer;"
	>
		<span>{timeRangeDisplayText || 'Select time range'}</span>
		<i class="bx bx-chevron-down"></i>
	</button>
	{#if showDatePicker}
		<div
			bind:this={datePickerRef}
			use:clickoutsideDirective
			on:clickoutside={(/** @type {any} */ e) => {
				if (e.detail && e.detail.targetNode && datePickerRef) {
					if (!datePickerRef.contains(e.detail.targetNode)) {
						showDatePicker = false;
					}
				}
			}}
			class="position-absolute top-100 start-0 mt-1 bg-white border rounded shadow-lg"
			style="z-index: 1050; min-width: 320px; max-width: 350px;"
		>
			<ul class="nav nav-tabs border-bottom mb-0 px-2 pt-2" role="tablist">
				<li class="nav-item flex-fill" role="presentation">
					<button
						class="nav-link fw-semibold {datePickerTab === 'relative' ? 'active text-primary' : 'text-muted'}"
						type="button"
						role="tab"
						style="padding: 0.5rem 0.75rem; {datePickerTab === 'relative' ? 'border-bottom: 2px solid var(--bs-primary) !important; margin-bottom: -1px;' : ''}"
						on:click={() => datePickerTab = 'relative'}
					>
						Relative
					</button>
				</li>
				<li class="nav-item flex-fill" role="presentation">
					<button
						class="nav-link fw-semibold {datePickerTab === 'custom' ? 'active text-primary' : 'text-muted'}"
						type="button"
						role="tab"
						style="padding: 0.5rem 0.75rem; {datePickerTab === 'custom' ? 'border-bottom: 2px solid var(--bs-primary) !important; margin-bottom: -1px;' : ''}"
						on:click={() => {
							datePickerTab = 'custom';
							// Set default dates to yesterday and today if not already set
							if (!startDate && !endDate) {
								startDate = getYesterdayStr();
								endDate = getTodayStr();
							}
						}}
					>
						Custom
					</button>
				</li>
			</ul>
			
			<div class="p-4">
				{#if datePickerTab === 'relative'}
					<div class="d-flex flex-column gap-2" style="max-height: 300px; overflow-y: auto;">
						{#each presetTimeRangeOptions as option}
							<button
								type="button"
								class="btn btn-sm btn-outline-secondary text-start {timeRange === option.value ? 'active' : ''}"
								on:click={(e) => {
									e.preventDefault();
									e.stopPropagation();
									handleRelativeOptionClick(option.value);
								}}
							>
								{option.label}
							</button>
						{/each}
					</div>
				{:else if datePickerTab === 'custom'}
					<div class="mb-3">
						<label for="start-date-picker" class="form-label small mb-2">From:</label>
						<Input
							id="start-date-picker"
							type="date"
							bind:value={startDate}
							class="form-control form-control-sm"
						/>
					</div>
					<div class="mb-4">
						<label for="end-date-picker" class="form-label small mb-2">To:</label>
						<Input
							id="end-date-picker"
							type="date"
							bind:value={endDate}
							class="form-control form-control-sm"
						/>
					</div>
					<div class="d-flex justify-content-end gap-2 mt-3">
						<Button
							color="secondary"
							size="sm"
							type="button"
							on:click={(e) => {
								e.preventDefault();
								e.stopPropagation();
								handleCancel();
							}}
						>
							Cancel
						</Button>
						<Button
							color="primary"
							size="sm"
							type="button"
							on:click={(e) => {
								e.preventDefault();
								e.stopPropagation();
								handleCustomConfirm();
							}}
						>
							Confirm
						</Button>
					</div>
				{/if}
			</div>
		</div>
	{/if}
</div>
