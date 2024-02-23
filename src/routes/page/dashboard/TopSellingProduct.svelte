<script>
	import { Card, CardBody, CardTitle, Col, Progress, Table } from '@sveltestrap/sveltestrap';
	import { _ } from 'svelte-i18n'
</script>

<Col xl={4}>
	<Card>
		<CardBody>
			<CardTitle class="mb-4">{$_('Top Client Usage')}</CardTitle>
			<div class="text-center">
				<div class="mb-4">
					<i class="bx bx-map-pin text-primary display-4" />
				</div>
				<h3>1,456</h3>
				<p>San Francisco</p>
			</div>
			<div class="table-responsive mt-4">
				<Table class="align-middle table-nowrap">
					<tbody>
						<tr>
							<td style="width: 30%">
								<p class="mb-0">San Francisco</p>
							</td>
							<td style="width: 25%"> <h5 class="mb-0">1,456</h5></td>
							<td>
								<Progress color="primary" value={94} max={100} class="progress-sm" />
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
								<Progress color="success" value={82} max={100} class="progress-sm" />
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
								<Progress color="warning" value={70} max={100} class="progress-sm" />
							</td>
						</tr>
					</tbody>
				</Table>
			</div>
		</CardBody>
	</Card>
</Col>
