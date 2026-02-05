<script>
	import { onMount, createEventDispatcher } from 'svelte';
	import { Button, Input } from '@sveltestrap/sveltestrap';
	import Flatpickr from 'svelte-flatpickr';
	import 'flatpickr/dist/flatpickr.css';
	import { TIME_RANGE_OPTIONS, CUSTOM_DATE_RANGE } from '$lib/helpers/constants';
	import { clickoutsideDirective } from '$lib/helpers/directives';

	// Constants
	const RECENT_TIME_RANGES_KEY = 'botsharp_recent_time_ranges';
	const MAX_RECENT_ITEMS = 10;
	const TAB_RELATIVE = 'relative';
	const TAB_RECENT = 'recent';
	const TAB_CUSTOM = 'custom';

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

	// Temporary dates for custom selection (before confirming)
	/** @type {string} */
	let tempStartDate = '';

	/** @type {string} */
	let tempEndDate = '';

	// Flatpickr instance reference
	/** @type {any} */
	let flatpickrInstance = null;

	/** @type {Array<{ startDate: string, endDate: string, label: string, timeRange?: string }>} */
	let recentTimeRanges = [];

	// Format date for flatpickr (Date object to YYYY-MM-DD string)
	/** @param {Date} date */
	function formatDateForFlatpickr(/** @type {Date} */ date) {
		if (!date) return '';
		const year = date.getFullYear();
		const month = String(date.getMonth() + 1).padStart(2, '0');
		const day = String(date.getDate()).padStart(2, '0');
		return `${year}-${month}-${day}`;
	}

	// Flatpickr options for date range selection
	/** @type {any} */
	let flatpickrOptions = {
		mode: 'range',
		dateFormat: 'Y-m-d',
		inline: true,
		allowInput: false,
		onChange: (
			/** @type {Date[]} */ selectedDates,
			/** @type {string} */ dateStr,
			/** @type {any} */ instance
		) => {
			if (selectedDates.length === 1) {
				// Only start date selected
				tempStartDate = formatDateForFlatpickr(selectedDates[0]);
				tempEndDate = '';
			} else if (selectedDates.length === 2) {
				// Both dates selected
				tempStartDate = formatDateForFlatpickr(selectedDates[0]);
				tempEndDate = formatDateForFlatpickr(selectedDates[1]);
			}
		}
	};

	// Format time range for Recent tab display
	const formatRecentTimeRangeLabel = (/** @type {string} */ sDate, /** @type {string} */ eDate) => {
		const start = formatDateForDisplay(sDate);
		const end = formatDateForDisplay(eDate);

		if (start === end) {
			return `${start}`;
		} else {
			return `${start} - ${end}`;
		}
	};

	// Handle manual input changes
	function handleStartDateChange() {
		if (tempStartDate && flatpickrInstance) {
			if (tempEndDate) {
				flatpickrInstance.setDate([tempStartDate, tempEndDate], false);
			} else {
				flatpickrInstance.setDate([tempStartDate], false);
			}
		}
	}

	function handleEndDateChange() {
		if (tempStartDate && tempEndDate && flatpickrInstance) {
			flatpickrInstance.setDate([tempStartDate, tempEndDate], false);
		}
	}

	// Initialize temp dates when opening custom tab
	function initCustomDates() {
		if (startDate) {
			tempStartDate = startDate;
		}
		if (endDate) {
			tempEndDate = endDate;
		}
		if (!tempStartDate && !tempEndDate) {
			tempStartDate = getYesterdayStr();
			tempEndDate = getTodayStr();
		}
		// Update flatpickr with initial dates
		if (flatpickrInstance) {
			if (tempStartDate && tempEndDate) {
				flatpickrInstance.setDate([tempStartDate, tempEndDate], false);
			} else if (tempStartDate) {
				flatpickrInstance.setDate([tempStartDate], false);
			}
		}
	}

	// Preset time range options
	const presetTimeRangeOptions = TIME_RANGE_OPTIONS.map((x) => ({
		label: x.label,
		value: x.value
	}));

	onMount(() => {
		loadRecentTimeRanges();
	});

	// Get today's date in YYYY-MM-DD format
	const getTodayStr = () => {
		const d = new Date();
		return (
			d.getFullYear() +
			'-' +
			String(d.getMonth() + 1).padStart(2, '0') +
			'-' +
			String(d.getDate()).padStart(2, '0')
		);
	};

	// Get yesterday's date in YYYY-MM-DD format
	const getYesterdayStr = () => {
		const d = new Date();
		d.setDate(d.getDate() - 1);
		return (
			d.getFullYear() +
			'-' +
			String(d.getMonth() + 1).padStart(2, '0') +
			'-' +
			String(d.getDate()).padStart(2, '0')
		);
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
			const selected = presetTimeRangeOptions.find((x) => x.value === timeRange);
			timeRangeDisplayText = selected ? selected.label : '';
		}
	}

	const dispatch = createEventDispatcher();

	function loadRecentTimeRanges() {
		try {
			const stored = localStorage.getItem(RECENT_TIME_RANGES_KEY);
			if (stored) {
				recentTimeRanges = JSON.parse(stored);
			}
		} catch (e) {
			recentTimeRanges = [];
		}
	}

	function clearSelection() {
		timeRange = '';
		startDate = '';
		endDate = '';
		showDatePicker = false;
		dispatch('change', { timeRange, startDate, endDate });
	}

	/** @param {any} range */
	function handleRecentOptionClick(range) {
		if (range.timeRange) {
			timeRange = range.timeRange;
		} else {
			timeRange = CUSTOM_DATE_RANGE;
			startDate = range.startDate;
			endDate = range.endDate;
		}
		showDatePicker = false;
		dispatch('change', { timeRange, startDate, endDate });
	}

	/**
	 * @param {{ startDate: string, endDate: string, timeRange?: string, label?: string }} range
	 */
	function saveRecentTimeRange(range) {
		try {
			// Use provided label or format from dates
			const label = range.label || formatRecentTimeRangeLabel(range.startDate, range.endDate);
			const newRange = { ...range, label };

			// Remove duplicate if exists (check by timeRange if it's a relative range, otherwise by dates)
			if (range.timeRange) {
				recentTimeRanges = recentTimeRanges.filter((r) => r.timeRange !== range.timeRange);
			} else {
				recentTimeRanges = recentTimeRanges.filter(
					(r) => r.startDate !== range.startDate || r.endDate !== range.endDate
				);
			}

			// Add to beginning and limit to MAX_RECENT_ITEMS
			recentTimeRanges = [newRange, ...recentTimeRanges].slice(0, MAX_RECENT_ITEMS);

			localStorage.setItem(RECENT_TIME_RANGES_KEY, JSON.stringify(recentTimeRanges));
		} catch (e) {}
	}

	/** @param {number} index */
	function removeRecentTimeRange(index) {
		recentTimeRanges = recentTimeRanges.filter((_, idx) => idx !== index);
		try {
			localStorage.setItem(RECENT_TIME_RANGES_KEY, JSON.stringify(recentTimeRanges));
		} catch (e) {}
	}

	/** @param {string} optionValue */
	function handleRelativeOptionClick(/** @type {string} */ optionValue) {
		// If clicking the same option, unselect it
		if (timeRange === optionValue) {
			clearSelection();
		} else {
			timeRange = optionValue;

			const option = TIME_RANGE_OPTIONS.find((x) => x.value === optionValue);

			if (option) {
				saveRecentTimeRange({
					startDate: '',
					endDate: '',
					timeRange: optionValue,
					label: option.label
				});
			}

			startDate = '';
			endDate = '';
			showDatePicker = false;
			dispatch('change', { timeRange, startDate, endDate });
		}
	}

	function handleApply() {
		if (tempStartDate) {
			const finalEndDate = tempEndDate || tempStartDate;
			// Update props through binding (will trigger reactivity)
			startDate = tempStartDate;
			endDate = finalEndDate;
			timeRange = CUSTOM_DATE_RANGE;
			saveRecentTimeRange({ startDate, endDate });
			// Dispatch change event with updated values
			dispatch('change', {
				timeRange: CUSTOM_DATE_RANGE,
				startDate: tempStartDate,
				endDate: finalEndDate
			});
		}
		showDatePicker = false;
	}

	function handleCancel() {
		showDatePicker = false;
	}
</script>

<div
	class="multiselect-container"
	bind:this={datePickerRef}
	use:clickoutsideDirective
	on:clickoutside={(/** @type {any} */ e) => {
		if (e.detail && e.detail.targetNode && datePickerRef) {
			if (!datePickerRef.contains(e.detail.targetNode)) {
				showDatePicker = false;
			}
		}
	}}
>
	<button
		type="button"
		class="form-control text-start d-flex align-items-center justify-content-between"
		on:click={() => {
			showDatePicker = !showDatePicker;
			if (showDatePicker) {
				// If custom date is selected, switch to custom tab; otherwise use relative tab
				datePickerTab = timeRange === CUSTOM_DATE_RANGE ? TAB_CUSTOM : TAB_RELATIVE;
				if (datePickerTab === TAB_CUSTOM) {
					// Delay init to ensure flatpickr is mounted
					setTimeout(() => {
						initCustomDates();
					}, 0);
				}
			}
		}}
		style="cursor: pointer;"
	>
		<span>{timeRangeDisplayText || 'Select time range'}</span>
		<i class="bx bx-chevron-down"></i>
	</button>
	{#if showDatePicker}
		<ul
			class="position-absolute top-100 start-0 mt-1 bg-white border rounded shadow-lg"
			style="z-index: 1050; min-width: 325px; max-width: 350px;"
		>
			<ul class="nav nav-tabs border-bottom mb-0 px-2 pt-2" role="tablist">
				<li class="nav-item flex-fill d-flex justify-content-center" role="presentation">
					<button
						class="nav-link fw-semibold {datePickerTab === TAB_RELATIVE
							? 'active text-primary'
							: 'text-muted'}"
						type="button"
						role="tab"
						style="padding: 0.5rem 0.75rem; {datePickerTab === TAB_RELATIVE
							? 'border-bottom: 2px solid var(--bs-primary) !important; margin-bottom: -1px;'
							: ''}"
						on:click={() => (datePickerTab = TAB_RELATIVE)}
					>
						Relative
					</button>
				</li>
				<li class="nav-item flex-fill d-flex justify-content-center" role="presentation">
					<button
						class="nav-link fw-semibold {datePickerTab === TAB_RECENT
							? 'active text-primary'
							: 'text-muted'}"
						type="button"
						role="tab"
						style="padding: 0.5rem 0.75rem; {datePickerTab === TAB_RECENT
							? 'border-bottom: 2px solid var(--bs-primary) !important; margin-bottom: -1px;'
							: ''}"
						on:click={() => (datePickerTab = TAB_RECENT)}
					>
						Recent
					</button>
				</li>
				<li class="nav-item flex-fill d-flex justify-content-center" role="presentation">
					<button
						class="nav-link fw-semibold {datePickerTab === TAB_CUSTOM
							? 'active text-primary'
							: 'text-muted'}"
						type="button"
						role="tab"
						style="padding: 0.5rem 0.75rem; {datePickerTab === TAB_CUSTOM
							? 'border-bottom: 2px solid var(--bs-primary) !important; margin-bottom: -1px;'
							: ''}"
						on:click={() => {
							datePickerTab = TAB_CUSTOM;
							// Delay init to ensure flatpickr is mounted
							setTimeout(() => {
								initCustomDates();
							}, 0);
						}}
					>
						Custom
					</button>
				</li>
			</ul>

			{#if datePickerTab === TAB_RELATIVE}
				<div>
					<ul class="option-list" style="max-height: 300px; overflow-y: auto;">
						<li class="option-item clickable justify-content-center">
							<button
								class="clear-btn line-align-center text-secondary"
								type="button"
								on:click|preventDefault|stopPropagation={() => {
									clearSelection();
								}}
							>
								{`Clear selection`}
							</button>
						</li>
						{#each presetTimeRangeOptions as option}
							<li class="option-item clickable">
								<div class="line-align-center select-box">
									<i
										class="bx bx-check"
										style="visibility: {timeRange === option.value ? 'visible' : 'hidden'};"
									></i>
								</div>
								<div class="select-name">
									<button
										class="clear-btn"
										type="button"
										on:click={(e) => {
											e.preventDefault();
											e.stopPropagation();
											handleRelativeOptionClick(option.value);
										}}
									>
										{option.label}
									</button>
								</div>
							</li>
						{/each}
					</ul>
				</div>
			{:else if datePickerTab === TAB_RECENT}
				<div>
					{#if recentTimeRanges.length === 0}
						<div class="text-muted text-center py-3 w-100">
							<i class="bx bx-time-five mb-2" style="font-size: 1.5rem;"></i>
							<p class="mb-0 small">{'No recent time ranges'}</p>
						</div>
					{:else}
						<ul class="option-list">
							{#each recentTimeRanges as range, index}
								<li class="option-item clickable">
									<div class="select-name">
										<button
											class="clear-btn text-start w-100"
											on:click|preventDefault|stopPropagation={() => {
												handleRecentOptionClick(range);
											}}
										>
											{range.label}
										</button>
									</div>
									<div class="line-align-center select-box">
										<button
											class="clear-btn bx bx-x"
											on:click|preventDefault|stopPropagation={() => {
												removeRecentTimeRange(index);
											}}
										>
										</button>
									</div>
								</li>
							{/each}
						</ul>
					{/if}
				</div>
			{:else if datePickerTab === TAB_CUSTOM}
				<div class="p-2">
					<!-- Calendar Grid -->
					<div class="mb-3">
						<Flatpickr options={flatpickrOptions} bind:flatpickr={flatpickrInstance} />
					</div>

					<!-- Date Input Fields -->
					<div class="d-flex align-items-center gap-2 mb-3">
						<Input
							type="date"
							bind:value={tempStartDate}
							class="form-control form-control-sm"
							on:change={handleStartDateChange}
						/>
						<span class="text-muted small">to</span>
						<Input
							type="date"
							bind:value={tempEndDate}
							class="form-control form-control-sm"
							on:change={handleEndDateChange}
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
								handleApply();
							}}
						>
							Apply
						</Button>
					</div>
				</div>
			{/if}
		</ul>
	{/if}
</div>

<style>
	/* Hide flatpickr's default input field when using inline mode */
	:global(.flatpickr-input) {
		display: none !important;
	}

	.clear-btn {
		background-color: transparent;
		border: none;
		transition: background-color 0.15s ease-in-out;
	}

	.clear-btn:hover {
		background-color: aliceblue;
	}
</style>
