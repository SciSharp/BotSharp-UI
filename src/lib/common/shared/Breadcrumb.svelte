<script>
	let { title = '', pagetitle = '' } = $props();
</script>

<div class="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
	<h4 class="text-lg font-medium text-dark dark:text-gray-100">{pagetitle}</h4>
	<ol class="flex items-center gap-1 text-sm text-muted">
		<li class="text-gray-500">{title}</li>
		<li aria-hidden="true" class="text-gray-400">/</li>
		<li class="font-medium text-primary" aria-current="page">{pagetitle}</li>
	</ol>
</div>
