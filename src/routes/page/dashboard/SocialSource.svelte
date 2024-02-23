<script>
	import Link from 'svelte-link/src/Link.svelte';
	import { Card, CardBody, CardTitle, Col, Row } from '@sveltestrap/sveltestrap';
	import { _ } from 'svelte-i18n'
</script>

<Col xl={4}>
	<Card>
		<CardBody>
			<CardTitle class="mb-4">{$_('Channel Stats')}</CardTitle>
			<div class="text-center">
				<div class="avatar-sm mx-auto mb-4">
					<span class="avatar-title rounded-circle bg-primary-subtle font-size-24">
						<i class="mdi mdi-facebook text-primary" />
					</span>
				</div>
				<p class="font-16 text-muted mb-2" />
				<h5>
					<Link class="text-dark"
						>Facebook - <span class="text-muted font-16">125 {$_('Conversations')}</span>
					</Link>
				</h5>
				<p class="text-muted">
					{$_('Maecenas nec odio et ante tincidunt tempus. Donec vitae sapien ut libero venenatis faucibus tincidunt.')}
				</p>
				<Link class="text-primary font-16">
					{$_('Learn more')} <i class="mdi mdi-chevron-right" />
				</Link>
			</div>
			<Row class="mt-4">
				<Col xs={4}>
					<div class="social-source text-center mt-3">
						<div class="avatar-xs mx-auto mb-3">
							<span class="avatar-title rounded-circle bg-primary font-size-16">
								<i class="mdi mdi-facebook text-white" />
							</span>
						</div>
						<h5 class="font-size-15">Facebook</h5>
						<p class="text-muted mb-0">125 {$_('sales')}</p>
					</div>
				</Col>
				<Col xs={4}>
					<div class="social-source text-center mt-3">
						<div class="avatar-xs mx-auto mb-3">
							<span class="avatar-title rounded-circle bg-info font-size-16">
								<i class="mdi mdi-twitter text-white" />
							</span>
						</div>
						<h5 class="font-size-15">Twitter</h5>
						<p class="text-muted mb-0">112 {$_('sales')}</p>
					</div>
				</Col>
				<Col xs={4}>
					<div class="social-source text-center mt-3">
						<div class="avatar-xs mx-auto mb-3">
							<span class="avatar-title rounded-circle bg-pink font-size-16">
								<i class="mdi mdi-instagram text-white" />
							</span>
						</div>
						<h5 class="font-size-15">Instagram</h5>
						<p class="text-muted mb-0">104 {$_('sales')}</p>
					</div>
				</Col>
			</Row>
		</CardBody>
	</Card>
</Col>
