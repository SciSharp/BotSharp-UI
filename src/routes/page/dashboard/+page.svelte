<script>
	import HeadTitle from '$lib/common/HeadTitle.svelte';
	import Breadcrumb from '$lib/common/Breadcrumb.svelte';
	import {
		Card,
		Col,
		Row,
		Image,
		CardBody,
		CardTitle,
		Nav,
		NavItem,
		Input,
		Button
	} from '@sveltestrap/sveltestrap';

	import Link from 'svelte-link/src/Link.svelte';
	import RadialBarChart from './RadialBarChart.svelte';
	import StackedColumnChart from './StackedColumnChart.svelte';
	import SocialSource from './SocialSource.svelte';
	import Activity from './Activity.svelte';
	import TopSellingProduct from './TopSellingProduct.svelte';
	import { 
		PUBLIC_LOGIN_IMAGE,
		PUBLIC_BRAND_NAME
	} from '$env/static/public';
	import { onMount } from 'svelte';
	import { getUserStore, userStore } from '$lib/helpers/store';
	
	let subscribemodal = false;
	let user = {full_name: ""};
	const togglesubscribemodal = (() => {
		subscribemodal = !subscribemodal;
	})

	onMount(() => {
		const userModelSubscribe = userStore.subscribe((/** @type {{ full_name: string; }} */ value) => {
			user = value;
		})
		user = getUserStore();
		setTimeout(() => {
			subscribemodal = true;
		}, 1000);
	})
</script>

<HeadTitle title="Dashboard" />

<Breadcrumb title="Home" pagetitle="Dashboard" />

<Row>
	<Col xl={4}>
		<Card class="overflow-hidden">
			<div class="bg-primary-subtle">
				<Row class="row">
					<Col xs={7}>
						<div class="text-primary p-3">
							<h5 class="text-primary">Welcome Back !</h5>
							<p>{PUBLIC_BRAND_NAME}</p>
						</div>
					</Col>
					<Col xs={5} class="align-self-end">
						<Image src={PUBLIC_LOGIN_IMAGE} alt="" class="img-fluid" />
					</Col>
				</Row>
			</div>
			<CardBody class="pt-0">
				<Row>
					<Col sm={4}>
						<div class="avatar-md profile-user-wid mb-4">
							<Image src='images/users/user-dummy.jpg' alt="" class="img-thumbnail rounded-circle" />
						</div>
						<h5 class="font-size-15 text-truncate">{user?.full_name}</h5>
						<p class="text-muted mb-0 text-truncate">Agent Manager</p>
					</Col>
					<Col sm={8}>
						<div class="pt-4">
							<Row>
								<Col xs={6}>
									<h5 class="font-size-15">125</h5>
									<p class="text-muted mb-0">Conversations</p>
								</Col>
								<Col xs={6}>
									<h5 class="font-size-15">$1245</h5>
									<p class="text-muted mb-0">Token Cost</p>
								</Col>
							</Row>
							<div class="mt-4">
								<Link href="page/user/me" class="btn btn-primary waves-effect waves-light btn-sm">
									View Profile <i class="mdi mdi-arrow-right ms-1" />
								</Link>
							</div>
						</div>
					</Col>
				</Row>
			</CardBody>
		</Card>
		<Card>
			<CardBody>
				<CardTitle class="mb-4">Monthly Cost</CardTitle>
				<Row>
					<Col sm={6}>
						<p class="text-muted">This month</p>
						<h3>$34,252</h3>
						<p class="text-muted">
							<span class="text-success me-2"> 12% <i class="mdi mdi-arrow-up" /> </span> From previous
							period
						</p>
						<div class="mt-4">
							<Link class="btn btn-primary waves-effect waves-light btn-sm"
								>View More <i class="mdi mdi-arrow-right ms-1" /></Link
							>
						</div>
					</Col>
					<Col sm={6}>
						<div class="mt-4 mt-sm-0">
							<RadialBarChart chartColor={['--bs-primary']} />
						</div>
					</Col>
				</Row>
				<p class="text-muted mb-0">We craft digital, graphic and dimensional thinking.</p>
			</CardBody>
		</Card>
	</Col>
	<Col xl={8}>
		<Row>
			<Col md={4}>
				<Card class="mini-stats-wid">
					<CardBody>
						<div class="d-flex">
							<div class="flex-grow-1">
								<p class="text-muted fw-medium">Conversations</p>
								<h4 class="mb-0">1,235</h4>
							</div>
							<div class="flex-shrink-0 align-self-center">
								<div class="mini-stat-icon avatar-sm rounded-circle bg-primary">
									<span class="avatar-title">
										<i class="bx bx-copy-alt font-size-24" />
									</span>
								</div>
							</div>
						</div>
					</CardBody>
				</Card>
			</Col>
			<Col md={4}
				><Card class="mini-stats-wid">
					<CardBody>
						<div class="d-flex">
							<div class="flex-grow-1">
								<p class="text-muted fw-medium">Total Cost</p>
								<h4 class="mb-0">$35, 723</h4>
							</div>
							<div class="flex-shrink-0 align-self-center">
								<div class="mini-stat-icon avatar-sm rounded-circle bg-primary">
									<span class="avatar-title">
										<i class="bx bx-archive-in font-size-24" />
									</span>
								</div>
							</div>
						</div>
					</CardBody>
				</Card></Col
			>
			<Col md={4}>
				<Card class="mini-stats-wid">
					<CardBody>
						<div class="d-flex">
							<div class="flex-grow-1">
								<p class="text-muted fw-medium">Average Cost</p>
								<h4 class="mb-0">$16.2</h4>
							</div>
							<div class="flex-shrink-0 align-self-center">
								<div class="mini-stat-icon avatar-sm rounded-circle bg-primary">
									<span class="avatar-title">
										<i class="bx bx-purchase-tag-alt font-size-24" />
									</span>
								</div>
							</div>
						</div>
					</CardBody>
				</Card>
			</Col>
		</Row>
		<Card>
			<CardBody>
				<div class="d-sm-flex flex-wrap">
					<CardTitle class="mb-4">Token Spent</CardTitle>
					<div class="ms-auto">
						<Nav pills>
							<NavItem>
								<Link href="#" class="nav-link">Week</Link>
							</NavItem>
							<NavItem>
								<Link href="#" class="nav-link">Month</Link>
							</NavItem>
							<NavItem>
								<Link href="#" class="nav-link" active>Year</Link>
							</NavItem>
						</Nav>
					</div>
				</div>
				<StackedColumnChart chartColor={['--bs-primary', '--bs-warning', '--bs-success']} />
			</CardBody>
		</Card>
	</Col>
</Row>

<Row>
	<SocialSource />
	<Activity />
	<TopSellingProduct />
</Row>