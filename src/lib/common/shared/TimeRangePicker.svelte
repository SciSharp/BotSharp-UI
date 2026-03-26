<script>
	import flatpickr from 'flatpickr';
	import 'flatpickr/dist/flatpickr.css';
	import { TIME_RANGE_OPTIONS, CUSTOM_DATE_RANGE } from '$lib/helpers/constants';
	import { clickoutsideDirective } from '$lib/helpers/directives';

	// Constants
	const MAX_RECENT_ITEMS = 10;
	const TAB_RELATIVE = 'relative';
	const TAB_RECENT = 'recent';
	const TAB_CUSTOM = 'custom';

	/**
	 * @type {{
	 *   timeRange?: string,
	 *   startDate?: string,
	 *   endDate?: string,
	 *   storageKey?: string,
	 *   onchange?: (data: { timeRange: string, startDate: string, endDate: string }) => void
	 * }}
	 */
	let {
		timeRange = $bindable(''),
		startDate = $bindable(''),
		endDate = $bindable(''),
		storageKey = 'botsharp_recent_time_ranges',
		onchange
	} = $props();

	/** @type {boolean} */
	let showDatePicker = $state(false);

	/** @type {HTMLDivElement | null} */
	let datePickerRef = $state(null);

	/** @type {string} */
	let datePickerTab = $state('relative');

	// Temporary dates for custom selection (before confirming)
	/** @type {string} */
	let tempStartDate = $state('');

	/** @type {string} */
	let tempEndDate = $state('');

	// Flatpickr instance reference (plain variable, not reactive, to avoid effect loops)
	/** @type {any} */
	let flatpickrInstance = null;

	/** @type {HTMLDivElement | null} */
	let flatpickrContainerEl = $state(null);

	/** @type {HTMLUListElement | null} */
	let dropdownEl = $state(null);

	/** @type {boolean} */
	let dropUp = $state(false);

	/** @type {Array<{ startDate: string, endDate: string, label: string, timeRange?: string }>} */
	let recentTimeRanges = $state([]);

	// Initialize/destroy flatpickr when the container element is available
	$effect(() => {
		const el = flatpickrContainerEl;
		if (el) {
			const instance = flatpickr(el, {
				mode: 'range',
				dateFormat: 'Y-m-d',
				inline: true,
				allowInput: false,
				onChange: (/** @type {Date[]} */ selectedDates) => {
					if (selectedDates.length === 1) {
						tempStartDate = formatDateForFlatpickr(selectedDates[0]);
						tempEndDate = '';
					} else if (selectedDates.length === 2) {
						tempStartDate = formatDateForFlatpickr(selectedDates[0]);
						tempEndDate = formatDateForFlatpickr(selectedDates[1]);
					}
				}
			});
			flatpickrInstance = instance;

			// Set initial dates if available
			if (tempStartDate && tempEndDate) {
				instance.setDate([tempStartDate, tempEndDate], false);
			} else if (tempStartDate) {
				instance.setDate([tempStartDate], false);
			}

			return () => {
				instance.destroy();
				flatpickrInstance = null;
			};
		}
	});

	// Format date for flatpickr (Date object to YYYY-MM-DD string)
	/** @param {Date} date */
	function formatDateForFlatpickr(/** @type {Date} */ date) {
		if (!date) return '';
		const year = date.getFullYear();
		const month = String(date.getMonth() + 1).padStart(2, '0');
		const day = String(date.getDate()).padStart(2, '0');
		return `${year}-${month}-${day}`;
	}

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

	$effect(() => {
		loadRecentTimeRanges();
	});

	// Dynamically position dropdown and constrain its height to available viewport space
	$effect(() => {
		if (dropdownEl && showDatePicker && datePickerRef) {
			const btnRect = datePickerRef.getBoundingClientRect();
			const spaceBelow = window.innerHeight - btnRect.bottom - 8;
			const spaceAbove = btnRect.top - 8;
			const minUsable = 250;

			if (spaceBelow >= minUsable) {
				// Enough space below — drop down
				dropUp = false;
				dropdownEl.style.maxHeight = `${spaceBelow}px`;
			} else if (spaceAbove > spaceBelow) {
				// More space above — drop up
				dropUp = true;
				dropdownEl.style.maxHeight = `${Math.min(spaceAbove, 500)}px`;
			} else {
				// Not much space either way — drop down with whatever we have
				dropUp = false;
				dropdownEl.style.maxHeight = `${Math.max(spaceBelow, 200)}px`;
			}
		}
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
	let timeRangeDisplayText = $derived.by(() => {
		if (timeRange === CUSTOM_DATE_RANGE && startDate && endDate) {
			const start = formatDateForDisplay(startDate);
			const end = formatDateForDisplay(endDate);
			if (start === end) {
				return start;
			} else {
				return `${start} - ${end}`;
			}
		} else if (timeRange === CUSTOM_DATE_RANGE) {
			return 'Custom';
		} else {
			const selected = presetTimeRangeOptions.find((x) => x.value === timeRange);
			return selected ? selected.label : '';
		}
	});

	function loadRecentTimeRanges() {
		try {
			const stored = localStorage.getItem(storageKey);
			if (stored) {
				recentTimeRanges = JSON.parse(stored);
			}
		} catch (e) {
			console.warn(`[TimeRangePicker] Failed to load recent time ranges from localStorage (key: ${storageKey}):`, e);
			recentTimeRanges = [];
		}
	}

	function clearSelection() {
		timeRange = '';
		startDate = '';
		endDate = '';
		showDatePicker = false;
		onchange?.({ timeRange, startDate, endDate });
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
		onchange?.({ timeRange, startDate, endDate });
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

			localStorage.setItem(storageKey, JSON.stringify(recentTimeRanges));
		} catch (e) {
			console.warn(`[TimeRangePicker] Failed to save recent time range to localStorage (key: ${storageKey}):`, e);
		}
	}

	/** @param {number} index */
	function removeRecentTimeRange(index) {
		recentTimeRanges = recentTimeRanges.filter((_, idx) => idx !== index);
		try {
			localStorage.setItem(storageKey, JSON.stringify(recentTimeRanges));
		} catch (e) {
			console.warn(`[TimeRangePicker] Failed to remove recent time range from localStorage (key: ${storageKey}):`, e);
		}
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
			onchange?.({ timeRange, startDate, endDate });
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
			// Invoke change callback with updated values
			onchange?.({
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
	onclickoutside={(/** @type {any} */ e) => {
		if (e.detail && e.detail.targetNode && datePickerRef) {
			if (!datePickerRef.contains(e.detail.targetNode)) {
				showDatePicker = false;
			}
		}
	}}
>
	<button
		type="button"
		class="form-control text-start d-flex align-items-center justify-content-between clickable"
		onclick={() => {
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
	>
		<span style="overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">
			{timeRangeDisplayText || 'Select time range'}
		</span>
		<i class="bx bx-chevron-down"></i>
	</button>
	{#if showDatePicker}
		<ul class="time-range-dropdown bg-white border rounded shadow-lg" class:drop-up={dropUp} bind:this={dropdownEl}>
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
						onclick={() => (datePickerTab = TAB_RELATIVE)}
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
						onclick={() => (datePickerTab = TAB_RECENT)}
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
						onclick={() => {
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
				<div class="time-range-tab-content">
					<ul class="option-list time-range-option-list">
						<li class="option-item clickable justify-content-center">
							<button
								class="clear-btn line-align-center text-secondary"
								type="button"
								onclick={(e) => {
									e.preventDefault();
									e.stopPropagation();
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
										onclick={(e) => {
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
				<div class="time-range-tab-content">
					{#if recentTimeRanges.length === 0}
						<div class="text-muted text-center py-3 w-100">
							<i class="bx bx-time-five mb-2" style="font-size: 1.5rem;"></i>
							<p class="mb-0 small">{'No recent time ranges'}</p>
						</div>
					{:else}
						<ul class="option-list time-range-option-list">
							{#each recentTimeRanges as range, index}
								<li class="option-item clickable">
									<div class="select-name">
										<button
											class="clear-btn text-start w-100"
											onclick={(e) => {
												e.preventDefault();
												e.stopPropagation();
												handleRecentOptionClick(range);
											}}
										>
											{range.label}
										</button>
									</div>
									<div class="line-align-center select-box">
										<button
											class="clear-btn bx bx-x"
											aria-label="Remove recent time range"
											onclick={(e) => {
												e.preventDefault();
												e.stopPropagation();
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
				<div class="time-range-tab-content p-2">
					<!-- Calendar Grid -->
					<div class="mb-3" bind:this={flatpickrContainerEl}></div>

					<!-- Date Input Fields -->
					<div class="d-flex align-items-center gap-2 mb-3">
						<input
							type="date"
							bind:value={tempStartDate}
							class="form-control form-control-sm"
							onchange={handleStartDateChange}
						/>
						<span class="text-muted small">to</span>
						<input
							type="date"
							bind:value={tempEndDate}
							class="form-control form-control-sm"
							onchange={handleEndDateChange}
						/>
					</div>

					<div class="d-flex justify-content-end gap-2 mt-3">
						<button
							class="btn btn-secondary btn-sm"
							type="button"
							onclick={(e) => {
								e.preventDefault();
								e.stopPropagation();
								handleCancel();
							}}
						>
							Cancel
						</button>
						<button
							class="btn btn-primary btn-sm"
							type="button"
							onclick={(e) => {
								e.preventDefault();
								e.stopPropagation();
								handleApply();
							}}
						>
							Apply
						</button>
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

	/* Dropdown panel positioning & responsiveness */
	.time-range-dropdown {
		position: absolute;
		top: 100%;
		right: 0;
		margin-top: 0.25rem;
		z-index: 1050;
		min-width: 305px;
		max-width: 350px;
		display: flex;
		flex-direction: column;
		overflow: hidden;
		list-style: none;
		padding-left: 0;
		margin-bottom: 0;
	}

	/* When there's more space above, open upward */
	.time-range-dropdown.drop-up {
		top: auto;
		bottom: 100%;
		margin-top: 0;
		margin-bottom: 0.25rem;
	}

	/* On small screens, allow the panel to shrink and avoid overflow */
	@media (max-width: 576px) {
		.time-range-dropdown {
			min-width: 280px;
			max-width: calc(100vw - 2rem);
		}
	}

	/* Tab content area fills remaining space and scrolls */
	.time-range-tab-content {
		flex: 1 1 auto;
		overflow-y: auto;
		scrollbar-width: thin;
		min-height: 0;
	}

	/* Override shared .option-list absolute positioning inside our dropdown */
	.time-range-option-list {
		position: static !important;
		max-height: none !important;
		overflow-y: visible !important;
		border: none !important;
	}

	/* Scale flatpickr calendar to fit within the panel */
	:global(.time-range-dropdown .flatpickr-calendar) {
		width: 100% !important;
		max-width: 100%;
		box-shadow: none;
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
