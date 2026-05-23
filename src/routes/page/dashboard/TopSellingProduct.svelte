<script>
	import { _ } from 'svelte-i18n';
</script>

<div class="w-full xl:w-1/3 px-2">
	<div class="mb-4 rounded-md bg-white shadow ring-1 ring-black/5 dark:bg-gray-800 dark:ring-white/10">
		<div class="p-4">
			<h4 class="mb-4 text-base font-medium text-dark dark:text-gray-100">{$_('Top Client Usage')}</h4>
			<div class="text-center">
				<div class="mb-4">
					<i class="bx bx-map-pin text-5xl text-primary"></i>
				</div>
				<h3 class="text-2xl font-semibold">1,456</h3>
				<p class="text-muted">San Francisco</p>
			</div>

			<div class="mt-4 overflow-x-auto">
				<table class="w-full whitespace-nowrap align-middle">
					<tbody>
						{#each [
							{ name: 'San Francisco', value: '1,456', width: 94, color: 'bg-primary' },
							{ name: 'Los Angeles', value: '1,123', width: 82, color: 'bg-success' },
							{ name: 'San Diego', value: '1,026', width: 70, color: 'bg-warning' }
						] as row}
							<tr class="border-t border-gray-100 first:border-t-0 dark:border-gray-700">
								<td class="w-[30%] py-3"><p class="mb-0 text-sm text-muted">{row.name}</p></td>
								<td class="w-[25%] py-3"><h5 class="mb-0 text-sm font-semibold">{row.value}</h5></td>
								<td class="py-3">
									<div class="relative h-1 w-full overflow-hidden rounded bg-gray-200 dark:bg-gray-700">
										<div
											class="h-full {row.color}"
											role="progressbar"
											style="width: {row.width}%"
											aria-valuenow={row.width}
											aria-valuemin={0}
											aria-valuemax={100}
										></div>
									</div>
								</td>
							</tr>
						{/each}
					</tbody>
				</table>
			</div>
		</div>
	</div>
</div>
