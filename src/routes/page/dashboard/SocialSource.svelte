<script>
	import { _ } from 'svelte-i18n';
</script>

<div class="w-full xl:w-1/3 px-2">
	<div class="mb-4 rounded-md bg-white shadow ring-1 ring-black/5 dark:bg-gray-800 dark:ring-white/10">
		<div class="p-4">
			<h4 class="mb-4 text-base font-medium text-dark dark:text-gray-100">{$_('Channel Stats')}</h4>
			<div class="text-center">
				<div class="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/25 text-2xl text-primary">
					<i class="mdi mdi-facebook"></i>
				</div>
				<h5 class="mb-2">
					<a href={'#'} class="text-dark hover:underline dark:text-gray-100">
						Facebook - <span class="text-base text-muted">125 Conversations</span>
					</a>
				</h5>
				<p class="text-muted">
					{$_('Maecenas nec odio et ante tincidunt tempus. Donec vitae sapien ut libero venenatis faucibus tincidunt.')}
				</p>
				<a href={'#'} class="inline-flex items-center text-base text-primary hover:text-primary-hover hover:underline">
					{$_('Learn more')} <i class="mdi mdi-chevron-right"></i>
				</a>
			</div>

			<div class="mt-4 flex flex-wrap">
				<div class="mt-3 w-1/3 text-center">
					<div class="mx-auto mb-3 flex h-8 w-8 items-center justify-center rounded-full bg-primary text-base text-white">
						<i class="mdi mdi-facebook"></i>
					</div>
					<h5 class="text-[15px] font-semibold">Facebook</h5>
					<p class="mb-0 text-muted">125 {$_('sales')}</p>
				</div>
				<div class="mt-3 w-1/3 text-center">
					<div class="mx-auto mb-3 flex h-8 w-8 items-center justify-center rounded-full bg-info text-base text-white">
						<i class="mdi mdi-twitter"></i>
					</div>
					<h5 class="text-[15px] font-semibold">Twitter</h5>
					<p class="mb-0 text-muted">112 {$_('sales')}</p>
				</div>
				<div class="mt-3 w-1/3 text-center">
					<div class="mx-auto mb-3 flex h-8 w-8 items-center justify-center rounded-full bg-pink-500 text-base text-white">
						<i class="mdi mdi-instagram"></i>
					</div>
					<h5 class="text-[15px] font-semibold">Instagram</h5>
					<p class="mb-0 text-muted">104 {$_('sales')}</p>
				</div>
			</div>
		</div>
	</div>
</div>
