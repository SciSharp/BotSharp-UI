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
	 *   prefixIcon?: import('svelte').Snippet,
	 *   onchange?: (data: { timeRange: string, startDate: string, endDate: string }) => void
	 * }}
	 */
	let {
		timeRange = $bindable(''),
		startDate = $bindable(''),
		endDate = $bindable(''),
		storageKey = 'botsharp_recent_time_ranges',
		prefixIcon = undefined,
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

	// Preset time range options
	const presetTimeRangeOptions = TIME_RANGE_OPTIONS.map((x) => ({
		label: x.label,
		value: x.value
	}));

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

	$effect(() => {
		loadRecentTimeRanges();
	});

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

	// Dynamically position dropdown using fixed positioning to escape ancestor overflow clipping
	$effect(() => {
		if (dropdownEl && showDatePicker && datePickerRef) {
			const btnRect = datePickerRef.getBoundingClientRect();
			const spaceBelow = window.innerHeight - btnRect.bottom - 8;
			const spaceAbove = btnRect.top - 8;
			const minUsable = 250;

			// Set horizontal position: align right edge with button right edge
			dropdownEl.style.right = `${window.innerWidth - btnRect.right}px`;
			dropdownEl.style.left = 'auto';

			if (spaceBelow >= minUsable) {
				// Enough space below — drop down
				dropUp = false;
				dropdownEl.style.top = `${btnRect.bottom + 4}px`;
				dropdownEl.style.bottom = 'auto';
				dropdownEl.style.maxHeight = `${spaceBelow}px`;
			} else if (spaceAbove > spaceBelow) {
				// More space above — drop up
				dropUp = true;
				dropdownEl.style.top = 'auto';
				dropdownEl.style.bottom = `${window.innerHeight - btnRect.top + 4}px`;
				dropdownEl.style.maxHeight = `${Math.min(spaceAbove, 500)}px`;
			} else {
				// Not much space either way — drop down with whatever we have
				dropUp = false;
				dropdownEl.style.top = `${btnRect.bottom + 4}px`;
				dropdownEl.style.bottom = 'auto';
				dropdownEl.style.maxHeight = `${Math.max(spaceBelow, 200)}px`;
			}
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
		class="trp-trigger"
		class:trp-trigger-open={showDatePicker}
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
		{#if prefixIcon}
			<span class="trp-trigger-prefix">
				{@render prefixIcon()}
			</span>
		{/if}
		<span class="trp-trigger-label">
			{timeRangeDisplayText || 'Select time range'}
		</span>
		<i class="bx bx-chevron-down trp-trigger-chevron"></i>
	</button>
	{#if showDatePicker}
		<ul class="trp-dropdown" class:trp-drop-up={dropUp} bind:this={dropdownEl}>
			<ul class="trp-tabs" role="tablist">
				<li class="trp-tab-item" role="presentation">
					<button
						class="trp-tab"
						class:active={datePickerTab === TAB_RELATIVE}
						type="button"
						role="tab"
						onclick={() => (datePickerTab = TAB_RELATIVE)}
					>
						Relative
					</button>
				</li>
				<li class="trp-tab-item" role="presentation">
					<button
						class="trp-tab"
						class:active={datePickerTab === TAB_RECENT}
						type="button"
						role="tab"
						onclick={() => (datePickerTab = TAB_RECENT)}
					>
						Recent
					</button>
				</li>
				<li class="trp-tab-item" role="presentation">
					<button
						class="trp-tab"
						class:active={datePickerTab === TAB_CUSTOM}
						type="button"
						role="tab"
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
				<div class="trp-tab-content">
					<ul class="trp-option-list">
						<li class="trp-option-clear">
							<button
								class="trp-clear-btn"
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
							<li class="trp-option-item">
								<button
									class="trp-option-btn"
									class:active={timeRange === option.value}
									type="button"
									onclick={(e) => {
										e.preventDefault();
										e.stopPropagation();
										handleRelativeOptionClick(option.value);
									}}
								>
									<span class="trp-option-check" aria-hidden="true">
										<i
											class="bx bx-check"
											style="visibility: {timeRange === option.value ? 'visible' : 'hidden'};"
										></i>
									</span>
									<span class="trp-option-label">{option.label}</span>
								</button>
							</li>
						{/each}
					</ul>
				</div>
			{:else if datePickerTab === TAB_RECENT}
				<div class="trp-tab-content">
					{#if recentTimeRanges.length === 0}
						<div class="trp-empty">
							<i class="bx bx-time-five trp-empty-icon"></i>
							<p class="trp-empty-text">{'No recent time ranges'}</p>
						</div>
					{:else}
						<ul class="trp-option-list">
							{#each recentTimeRanges as range, index}
								<li class="trp-option-item">
									<button
										class="trp-option-btn"
										type="button"
										onclick={(e) => {
											e.preventDefault();
											e.stopPropagation();
											handleRecentOptionClick(range);
										}}
									>
										<span class="trp-option-label">{range.label}</span>
									</button>
									<button
										class="trp-option-remove"
										type="button"
										aria-label="Remove recent time range"
										onclick={(e) => {
											e.preventDefault();
											e.stopPropagation();
											removeRecentTimeRange(index);
										}}
									>
										<i class="bx bx-x"></i>
									</button>
								</li>
							{/each}
						</ul>
					{/if}
				</div>
			{:else if datePickerTab === TAB_CUSTOM}
				<div class="trp-tab-content trp-tab-content-custom">
					<!-- Date Input Fields -->
					<div class="trp-date-row">
						<input
							type="date"
							bind:value={tempStartDate}
							class="trp-date-input"
							onchange={handleStartDateChange}
						/>
						<span class="trp-date-separator">to</span>
						<input
							type="date"
							bind:value={tempEndDate}
							class="trp-date-input"
							onchange={handleEndDateChange}
						/>
					</div>

					<!-- Calendar Grid -->
					<div class="trp-calendar" bind:this={flatpickrContainerEl}></div>

					<div class="trp-actions">
						<button
							class="trp-btn trp-btn-cancel"
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
							class="trp-btn trp-btn-apply"
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
	/* ============================================================
	   TimeRangePicker — self-contained Tailwind-aligned styling.
	   Replaces all Bootstrap utility classes (form-control, btn,
	   nav-tabs, etc.) and Bootstrap CSS variables (--bs-primary,
	   --bs-body-bg, --bs-border-color, --bs-tertiary-bg) that the
	   component previously depended on.
	   ============================================================ */

	/* Hide flatpickr's default input field when using inline mode */
	:global(.flatpickr-input) {
		display: none !important;
	}

	/* ---------- Trigger button (closed state) ----------
	   Replaces Bootstrap form-control with a themed trigger that matches
	   the Select component's display input (same height, radius, border,
	   focus ring). */
	.trp-trigger {
		display: flex;
		align-items: center;
		justify-content: space-between;
		width: 100%;
		height: 2.5rem;
		margin: 0;
		padding: 0 2rem 0 0.75rem;
		border: 1px solid rgb(229 231 235);
		border-radius: 0.375rem;
		background-color: rgb(255 255 255);
		font-size: 0.875rem;
		line-height: 1.5;
		color: rgb(31 41 55);
		text-align: left;
		cursor: pointer;
		position: relative;
		transition: border-color 0.15s ease, box-shadow 0.15s ease;
	}
	.trp-trigger:hover:not(:disabled) {
		border-color: rgb(209 213 219);
	}
	.trp-trigger:focus,
	.trp-trigger.trp-trigger-open {
		outline: 0;
		border-color: var(--color-primary);
		box-shadow: 0 0 0 1px var(--color-primary);
	}
	.trp-trigger:disabled {
		background-color: rgb(249 250 251);
		color: var(--color-muted);
		cursor: not-allowed;
		opacity: 0.7;
	}
	/* Optional prefix-icon wrapper rendered inside the trigger button
	   ahead of the label. Sits in the flex row natively — no absolute
	   positioning needed because the chevron is the only positioned child. */
	.trp-trigger-prefix {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		flex-shrink: 0;
		margin-right: 0.5rem;
		font-size: 1rem;
		line-height: 1;
		color: rgb(156 163 175);
		transition: color 0.15s ease;
	}
	/* Lift the prefix icon to primary when the trigger is focused or open,
	   matching the chevron's focus-tint affordance. */
	.trp-trigger:focus .trp-trigger-prefix,
	.trp-trigger.trp-trigger-open .trp-trigger-prefix {
		color: var(--color-primary);
	}

	.trp-trigger-label {
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
		flex: 1 1 auto;
		min-width: 0;
	}
	.trp-trigger-chevron {
		position: absolute;
		right: 0.625rem;
		top: 50%;
		transform: translateY(-50%);
		font-size: 1.125rem;
		line-height: 1;
		color: rgb(156 163 175);
		transition: transform 0.2s ease-in-out, color 0.15s ease;
		pointer-events: none;
	}
	.trp-trigger-open .trp-trigger-chevron {
		transform: translateY(-50%) rotate(180deg);
		color: var(--color-primary);
	}

	/* ---------- Dropdown panel ----------
	   Replaces Bootstrap `bg-white border rounded shadow-lg` utilities. */
	.trp-dropdown {
		position: fixed;
		z-index: 1050;
		min-width: 305px;
		max-width: 350px;
		display: flex;
		flex-direction: column;
		overflow: hidden;
		list-style: none;
		padding: 0;
		margin: 0;
		background-color: rgb(255 255 255);
		border: 1px solid rgb(229 231 235);
		border-radius: 0.5rem;
		box-shadow:
			0 10px 25px -5px rgb(0 0 0 / 0.1),
			0 8px 10px -6px rgb(0 0 0 / 0.05);

		/* On small screens, allow the panel to shrink and avoid overflow */
		@media (max-width: 576px) {
			min-width: 280px;
			max-width: calc(100vw - 2rem);
		}

		/* Scale flatpickr calendar to fit within the panel.
		   All --bs-* CSS variables previously used here are replaced with
		   the Tailwind v4 --color-* tokens so the calendar picks up runtime
		   theming. */
		:global(.flatpickr-calendar) {
			width: 100% !important;
			max-width: 100%;
			box-shadow: none;
		}

		:global(.flatpickr-months) {
			height: 36px;
			align-items: center;
			margin-bottom: 4px;
		}

		:global(.flatpickr-current-month) {
			display: flex;
			align-items: center;
			justify-content: center;
			gap: 4px;
			padding-top: 0;
			height: 100%;
			font-size: 14px;
			left: 0;
			right: 0;
			width: 100%;
		}

		:global(.flatpickr-monthDropdown-months) {
			font-size: 14px;
			font-weight: 600;
			appearance: none;
			-webkit-appearance: none;
			-moz-appearance: none;
			padding: 4px 20px 4px 8px;
			border-radius: 4px;
			border: 1px solid rgb(229 231 235);
			background-color: rgb(255 255 255);
			background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='6' viewBox='0 0 10 6'%3E%3Cpath fill='%23666' d='M0 0l5 6 5-6z'/%3E%3C/svg%3E");
			background-repeat: no-repeat;
			background-position: right 6px center;
			background-size: 10px 6px;
			color: rgb(31 41 55);
			cursor: pointer;
			width: 90px;
			height: 30px;
			text-align: center;
			text-align-last: center;
			box-sizing: border-box;

			&:hover {
				border-color: var(--color-primary);
			}

			&:focus {
				border-color: var(--color-primary);
				outline: none;
				box-shadow: 0 0 0 2px color-mix(in srgb, var(--color-primary) 15%, transparent);
			}
		}

		:global(.numInputWrapper) {
			height: auto;
			width: 90px;

			:global(.arrowUp),
			:global(.arrowDown) {
				display: none;
			}
		}

		:global(.numInput.cur-year) {
			font-size: 14px;
			font-weight: 600;
			padding: 4px 8px;
			border-radius: 4px;
			border: 1px solid rgb(229 231 235);
			background-color: rgb(255 255 255);
			color: rgb(31 41 55);
			width: 90px;
			height: 30px;
			text-align: center;
			box-sizing: border-box;

			&:hover {
				border-color: var(--color-primary);
			}

			&:focus {
				border-color: var(--color-primary);
				outline: none;
				box-shadow: 0 0 0 2px color-mix(in srgb, var(--color-primary) 15%, transparent);
			}
		}

		:global(.flatpickr-prev-month),
		:global(.flatpickr-next-month) {
			padding: 6px;
			height: 28px;
			width: 28px;
			display: flex;
			align-items: center;
			justify-content: center;
			border-radius: 4px;
			top: 4px;

			&:hover {
				background-color: rgb(243 244 246);
			}

			:global(svg) {
				width: 12px;
				height: 12px;
			}
		}
	}

	/* ---------- Tab strip ----------
	   Replaces Bootstrap `nav nav-tabs` with a pill-style tab row that uses
	   the same primary-underline pattern as the migrated NavBar component. */
	.trp-tabs {
		display: flex;
		list-style: none;
		margin: 0;
		padding: 0.5rem 0.5rem 0;
		border-bottom: 1px solid rgb(229 231 235);
		gap: 0.25rem;
	}

	.trp-tab-item {
		display: flex;
		justify-content: center;
		flex: 1 1 0;
	}

	.trp-tab {
		position: relative;
		width: 100%;
		margin: 0 0 -1px;
		padding: 0.5rem 0.75rem;
		border: 0;
		background: transparent;
		font-weight: 600;
		font-size: 0.8125rem;
		line-height: 1.4;
		color: var(--color-muted);
		cursor: pointer;
		border-radius: 0.375rem 0.375rem 0 0;
		transition: color 0.15s ease, background-color 0.15s ease, border-color 0.15s ease;
	}
	.trp-tab:hover:not(.active) {
		color: var(--color-primary);
		background-color: rgb(243 244 246);
	}
	.trp-tab.active {
		color: var(--color-primary);
		border-bottom: 2px solid var(--color-primary);
	}

	/* ---------- Tab content area ---------- */
	.trp-tab-content {
		flex: 1 1 auto;
		overflow-y: auto;
		scrollbar-width: thin;
		min-height: 0;
	}
	.trp-tab-content-custom {
		padding: 0.75rem;
	}

	/* ---------- Relative / Recent option list ----------
	   Replaces Bootstrap `option-list option-item` patterns. */
	.trp-option-list {
		list-style: none;
		margin: 0;
		padding: 0.25rem;
		max-height: 300px;
	}

	.trp-option-clear {
		display: flex;
		justify-content: center;
		padding: 0.25rem;
	}

	.trp-option-item {
		display: flex;
		align-items: center;
		gap: 0.25rem;
		padding: 0;
	}

	.trp-option-btn {
		display: inline-flex;
		align-items: center;
		gap: 0.375rem;
		width: 100%;
		padding: 0.4rem 0.5rem;
		margin: 0;
		border: 0;
		border-radius: 0.375rem;
		background: transparent;
		color: rgb(31 41 55);
		font-size: 0.875rem;
		line-height: 1.4;
		text-align: left;
		cursor: pointer;
		transition: background-color 0.12s ease, color 0.12s ease;
	}
	.trp-option-btn:hover,
	.trp-option-btn.active {
		background-color: rgb(243 244 246);
		color: var(--color-primary);
	}

	.trp-option-check {
		flex: 0 0 1.25rem;
		display: inline-flex;
		align-items: center;
		justify-content: center;
		font-size: 1.125rem;
		line-height: 1;
		color: var(--color-primary);
	}

	.trp-option-label {
		flex: 1 1 auto;
		min-width: 0;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.trp-option-remove {
		flex: 0 0 1.75rem;
		display: inline-flex;
		align-items: center;
		justify-content: center;
		width: 1.75rem;
		height: 1.75rem;
		margin-right: 0.25rem;
		border: 0;
		border-radius: 0.375rem;
		background: transparent;
		color: var(--color-muted);
		font-size: 1.125rem;
		line-height: 1;
		cursor: pointer;
		transition: background-color 0.12s ease, color 0.12s ease;
	}
	.trp-option-remove:hover {
		background-color: color-mix(in srgb, var(--color-danger) 15%, transparent);
		color: var(--color-danger);
	}

	.trp-clear-btn {
		width: 100%;
		padding: 0.4rem 0.5rem;
		margin: 0;
		border: 0;
		border-radius: 0.375rem;
		background: transparent;
		color: var(--color-muted);
		font-size: 0.8125rem;
		line-height: 1.4;
		text-align: center;
		font-style: italic;
		cursor: pointer;
		transition: background-color 0.12s ease, color 0.12s ease;
	}
	.trp-clear-btn:hover {
		background-color: rgb(243 244 246);
		color: var(--color-danger);
	}

	/* ---------- Recent tab empty state ----------
	   Replaces `text-muted text-center py-3 w-100` Bootstrap utility chain. */
	.trp-empty {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		padding: 1.25rem 0.5rem;
		color: var(--color-muted);
		width: 100%;
	}
	.trp-empty-icon {
		font-size: 1.5rem;
		line-height: 1;
		margin-bottom: 0.5rem;
	}
	.trp-empty-text {
		margin: 0;
		font-size: 0.8125rem;
	}

	/* ---------- Custom tab: date inputs + actions ----------
	   Replaces Bootstrap `form-control form-control-sm` on the inputs and
	   `btn btn-secondary btn-sm` / `btn btn-primary btn-sm` on the buttons. */
	.trp-date-row {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		margin-bottom: 0.75rem;
	}

	.trp-date-input {
		flex: 1 1 0;
		min-width: 0;
		height: 2rem;
		padding: 0 0.5rem;
		border: 1px solid rgb(229 231 235);
		border-radius: 0.375rem;
		background-color: rgb(255 255 255);
		font-size: 0.8125rem;
		line-height: 1.4;
		color: rgb(31 41 55);
		transition: border-color 0.15s ease, box-shadow 0.15s ease;
	}
	.trp-date-input:focus {
		outline: 0;
		border-color: var(--color-primary);
		box-shadow: 0 0 0 1px var(--color-primary);
	}

	.trp-date-separator {
		font-size: 0.75rem;
		color: var(--color-muted);
		flex-shrink: 0;
	}

	.trp-calendar {
		margin-bottom: 0.75rem;
	}

	.trp-actions {
		display: flex;
		justify-content: flex-end;
		gap: 0.5rem;
		margin-top: 0.75rem;
	}

	.trp-btn {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		padding: 0.375rem 0.875rem;
		border-radius: 0.375rem;
		font-size: 0.8125rem;
		font-weight: 500;
		line-height: 1.4;
		cursor: pointer;
		transition: background-color 0.15s ease, border-color 0.15s ease, color 0.15s ease, box-shadow 0.15s ease;
	}

	.trp-btn-cancel {
		border: 1px solid rgb(229 231 235);
		background-color: rgb(255 255 255);
		color: rgb(31 41 55);
	}
	.trp-btn-cancel:hover {
		background-color: rgb(243 244 246);
		border-color: rgb(209 213 219);
	}

	.trp-btn-apply {
		border: 1px solid var(--color-primary);
		background-color: var(--color-primary);
		color: rgb(255 255 255);
	}
	.trp-btn-apply:hover {
		background-color: var(--color-primary-hover);
		border-color: var(--color-primary-hover);
	}
</style>
