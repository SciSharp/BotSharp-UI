<script>
	let { title = '', pagetitle = '' } = $props();
</script>

<div class="row">
	<div class="col-12">
		<div class="page-title-box d-sm-flex align-items-center justify-content-between">
			<h4 class="mb-sm-0 font-size-18">{pagetitle}</h4>
			<div class="page-title-right">
				<ol class="breadcrumb m-0">
					<li class="breadcrumb-item">
						<span class="breadcrumb-link disabled">{title}</span>
					</li>
					<li class="breadcrumb-item active" aria-current="page">
						{pagetitle}
					</li>
				</ol>
			</div>
		</div>
	</div>
</div>
