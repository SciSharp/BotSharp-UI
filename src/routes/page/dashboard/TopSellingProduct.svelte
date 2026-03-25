<script>
	import { _ } from 'svelte-i18n';
</script>

<div class="col-xl-4">
	<div class="card">
		<div class="card-body">
			<h4 class="card-title mb-4">{$_('Top Client Usage')}</h4>
			<div class="text-center">
				<div class="mb-4">
					<i class="bx bx-map-pin text-primary display-4"></i>
				</div>
				<h3>1,456</h3>
				<p>San Francisco</p>
			</div>
			<div class="table-responsive mt-4">
				<table class="table align-middle table-nowrap">
					<tbody>
						<tr>
							<td style="width: 30%">
								<p class="mb-0">San Francisco</p>
							</td>
							<td style="width: 25%"> <h5 class="mb-0">1,456</h5></td>
							<td>
								<div class="progress progress-sm">
									<div class="progress-bar bg-primary" role="progressbar" style="width: 94%" aria-valuenow={94} aria-valuemin={0} aria-valuemax={100}></div>
								</div>
							</td>
						</tr>
						<tr>
							<td>
								<p class="mb-0">Los Angeles</p>
							</td>
							<td>
								<h5 class="mb-0">1,123</h5>
							</td>
							<td>
								<div class="progress progress-sm">
									<div class="progress-bar bg-success" role="progressbar" style="width: 82%" aria-valuenow={82} aria-valuemin={0} aria-valuemax={100}></div>
								</div>
							</td>
						</tr>
						<tr>
							<td>
								<p class="mb-0">San Diego</p>
							</td>
							<td>
								<h5 class="mb-0">1,026</h5>
							</td>
							<td>
								<div class="progress progress-sm">
									<div class="progress-bar bg-warning" role="progressbar" style="width: 70%" aria-valuenow={70} aria-valuemin={0} aria-valuemax={100}></div>
								</div>
							</td>
						</tr>
					</tbody>
				</table>
			</div>
		</div>
	</div>
</div>
