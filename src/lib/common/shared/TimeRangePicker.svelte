<script>
	import { createEventDispatcher } from 'svelte';
	import { Button, Input } from '@sveltestrap/sveltestrap';
	import Flatpickr from 'svelte-flatpickr';
	import 'flatpickr/dist/flatpickr.css';
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

	// Temporary dates for custom selection (before confirming)
	/** @type {string} */
	let tempStartDate = '';
	
	/** @type {string} */
	let tempEndDate = '';

	// Flatpickr instance reference
	/** @type {any} */
	let flatpickrInstance = null;

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
		onChange: (/** @type {Date[]} */ selectedDates, /** @type {string} */ dateStr, /** @type {any} */ instance) => {
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

	function handleApply() {
		if (tempStartDate) {
			const finalEndDate = tempEndDate || tempStartDate;
			// Update props through binding (will trigger reactivity)
			startDate = tempStartDate;
			endDate = finalEndDate;
			timeRange = CUSTOM_DATE_RANGE;
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

<div class="position-relative">
	<button
		type="button"
		class="form-control text-start d-flex align-items-center justify-content-between"
		on:click={() => {
			showDatePicker = !showDatePicker;
			if (showDatePicker) {
				// If custom date is selected, switch to custom tab; otherwise use relative tab
				datePickerTab = timeRange === CUSTOM_DATE_RANGE ? 'custom' : 'relative';
				if (datePickerTab === 'custom') {
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
					<!-- Calendar Grid -->
					<div class="mb-3">
						<Flatpickr
							options={flatpickrOptions}
							bind:flatpickr={flatpickrInstance}
						/>
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
				{/if}
			</div>
		</div>
	{/if}
</div>

<style>
	/* Hide flatpickr's default input field when using inline mode */
	:global(.flatpickr-input) {
		display: none !important;
	}
</style>
