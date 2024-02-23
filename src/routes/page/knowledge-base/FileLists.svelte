<script>
	import { _ } from 'svelte-i18n'
	import Link from 'svelte-link';
	import {
		Card,
		CardBody,
		Col,
		DropdownMenu,
		DropdownItem,
		DropdownToggle,
		Form,
		Row,
		Dropdown
	} from '@sveltestrap/sveltestrap';

	const myfiles = [
		{
			id: 1,
			name: 'Design',
			file: '12',
			Gb: 6
		},
	];
</script>

<div>
	<Row class="mb-3">
		<Col xl={3} sm={6}>
			<div class="mt-2">
				<h5>{$_('My Files')}</h5>
			</div>
		</Col>
		<Col xl={9} sm={6}>
			<Form class="mt-4 mt-sm-0 float-sm-end d-flex align-items-center">
				<div class="search-box mb-2 me-2">
					<div class="position-relative">
						<input
							type="text"
							class="form-control bg-light border-light rounded"
							placeholder="{$_('Search')}..."
						/>
						<i class="bx bx-search-alt search-icon" />
					</div>
				</div>
        <Dropdown>
          <DropdownToggle
            color=""
            class="btn btn-link text-muted dropdown-toggle mt-n2 headerbtn"
            tag="div"
          >
            <i class="mdi mdi-dots-vertical font-size-20" />
          </DropdownToggle>

          <DropdownMenu class="dropdown-menu-end">
            <DropdownItem >{$_('Share Files')}</DropdownItem>
            <DropdownItem >{$_('Share with me')}</DropdownItem>
            <DropdownItem >{$_('Other Actions')}</DropdownItem>
          </DropdownMenu>
        </Dropdown>
			</Form>
		</Col>
	</Row>
</div>
<div>
	<Row>
		{#each myfiles as myfile}
			<Col xl={4} sm={6}>
				<Card class="shadow-none border">
					<CardBody class="p-3">
						<div class="">
							<div class="float-end ms-2">
								<Dropdown>
									<DropdownToggle class="font-size-16 text-muted" color="" tag="div" >
                    <i class="mdi mdi-dots-horizontal" />
                    </DropdownToggle
									>
									<DropdownMenu class="dropdown-menu-end">
										<DropdownItem header>{$_('Open')}</DropdownItem>
										<DropdownItem >{$_('Edit')}</DropdownItem>
										<DropdownItem>{$_('Rename')}</DropdownItem>
										<DropdownItem divider />
										<DropdownItem>{$_('Remove')}</DropdownItem>
									</DropdownMenu>
								</Dropdown>
							</div>
							<div class="avatar-xs me-3 mb-3">
								<div class="avatar-title bg-transparent rounded">
									<i class="bx bxs-folder font-size-24 text-warning" />
								</div>
							</div>
							<div class="d-flex">
								<div class="overflow-hidden me-auto">
									<h5 class="font-size-14 text-truncate mb-1">
										<Link to="#" class="text-body">
											{myfile.name}
										</Link>
									</h5>
									<p class="text-muted text-truncate mb-0">
										{myfile.file} {$_('Files')}
									</p>
								</div>
								<div class="align-self-end ms-2">
									<p class="text-muted mb-0">{myfile.Gb}GB</p>
								</div>
							</div>
						</div>
					</CardBody>
				</Card>
			</Col>
		{/each}
	</Row>
</div>
