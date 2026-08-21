<script>
    import { _ } from 'svelte-i18n';
</script>

<div class="w-full xl:w-1/3 px-2">
	<div class="mb-4 rounded-md bg-white shadow ring-1 ring-black/5 dark:bg-gray-800 dark:ring-white/10">
		<div class="p-4">
			<h4 class="mb-6 text-base font-medium text-dark dark:text-gray-100">
				{$_('Activity')}
			</h4>

			<ol class="relative ms-3 list-none space-y-6 border-s-2 border-gray-200 ps-6 dark:border-gray-700">
				{#each [
					{ date: '22 Nov', text: $_('Responded to need “Volunteer Activities'), active: false },
					{ date: '17 Nov', text: $_('Everyone realizes why a new common language would be desirable...'), active: false, readMore: true },
					{ date: '15 Nov', text: $_('Joined the group “Boardsmanship Forum”'), active: true },
					{ date: '12 Nov', text: $_('Responded to need “In-Kind Opportunity”'), active: false }
				] as event}
					<li class="relative">
						<!-- Timeline dot -->
						<span
							class="absolute -start-[34px] top-0 flex h-7 w-7 items-center justify-center rounded-full ring-2 {event.active
								? 'bg-primary text-white ring-primary/30'
								: 'bg-white text-primary ring-gray-200 dark:bg-gray-800 dark:ring-gray-700'}"
						>
							<i class="bx {event.active ? 'bxs-right-arrow-circle bx-fade-right' : 'bx-right-arrow-circle'} text-base"></i>
						</span>
						<div class="flex">
							<div class="me-3 shrink-0">
								<h5 class="text-sm font-semibold">
									{event.date}
									<i class="bx bx-right-arrow-alt ms-2 align-middle text-base text-primary"></i>
								</h5>
							</div>
							<div class="grow text-sm text-muted">
								{event.text}
								{#if event.readMore}<a href={'#'} class="text-primary hover:text-primary-hover hover:underline">{$_('Read more')}</a>{/if}
							</div>
						</div>
					</li>
				{/each}
			</ol>

			<div class="mt-6 text-center">
				<a
					href={'#'}
					class="inline-flex items-center justify-center rounded bg-primary px-3 py-1.5 text-sm font-medium text-white transition-colors hover:bg-primary-hover"
				>
					{$_('View More')}
					<i class="mdi mdi-arrow-right ms-1"></i>
				</a>
			</div>
		</div>
	</div>
</div>
