<script>
    import { onDestroy, onMount } from 'svelte';
    import {
		Card,
		CardBody,
		Col,
		Row,
		Table
	} from '@sveltestrap/sveltestrap';
    import { _ } from 'svelte-i18n';
    import moment from 'moment';
	import HeadTitle from "$lib/common/HeadTitle.svelte";
	import Breadcrumb from '$lib/common/Breadcrumb.svelte';
	import LoadingToComplete from '$lib/common/LoadingToComplete.svelte';
	import { getAgentOptions } from '$lib/services/agent-service';
	import { globalEventStore } from '$lib/helpers/store';
	import { GlobalEvent } from '$lib/helpers/enums';
	import { getRoleOptions, getRoles, updateRole } from '$lib/services/role-service';
	import RoleItem from './role-item.svelte';
	
    const duration = 3000;

    let isLoading = false;
	let isComplete = false;
	let isError = false;
    let successText = 'Role has been updated!';
    let errorText = 'Failed to update role!';

    /** @type {import('$roleTypes').RoleFilter} */
    let filter = {};

    /** @type {import('$roleTypes').RoleModel[]} */
    let roleItems = [];

    /** @type {import('$commonTypes').IdName[]} */
	let agents = [];

	/** @type {string[]} */
	let roleOptions = [];

	/** @type {any} */
	let unsubscriber;

    onMount(async () => {
		init();

		unsubscriber = globalEventStore.subscribe((/** @type {import('$commonTypes').GlobalEvent} */ event) => {
			if (event.name !== GlobalEvent.Search) return;

			const names = event.payload ? [event.payload] : undefined;
			filter = {
				names: names
			};
			getAllRoles();
		});
    });

	onDestroy(() => {
		unsubscriber?.();
	});

	function init() {
		isLoading = true;
		getRoleOptions().then(roles => {
			roleOptions = [...roles];
			getPagedAgents().then(() => {
				getAllRoles().then(() => {
					isLoading = false;
				});
			});
		});
	}

    function getAllRoles() {
        roleItems = [];
        isLoading = true;
        return new Promise((resolve, reject) => {
            getRoles(filter).then(res => {
                refresh(res);
                resolve(res);
            }).finally(() => {
                isLoading = false;
            });
        });
	}

    function getPagedAgents() {
        return new Promise((resolve, reject) => {
            getAgentOptions().then(res => {
                agents = res?.map(x => {
                    return {
                        id: x.id,
                        name: x.name
                    };
                }) || [];
                resolve(agents);
            });
        });
    }

    /** @param {import('$roleTypes').RoleModel[]} roles */
    function refresh(roles) {
		refreshRoles(roles);
	}

    /** @param {import('$roleTypes').RoleModel[]} roles */
	function refreshRoles(roles) {
        roleItems = [ ...roles ];
	}

    /** @param {any} e */
    function saveRole(e) {
        const data = e.detail.updatedData;
        isLoading = true;
        updateRole(data).then(res => {
			if (res) {
				isLoading = false;
				isComplete = true;
				postUpdate(data);
				setTimeout(() => {
					isComplete = false;
				}, duration);
			} else {
				throw "error when saving role.";
			}
		}).catch(() => {
			isLoading = false;
			isComplete = false;
			isError = true;
			setTimeout(() => {
				isError = false;
			}, duration);
		});
    }

    /** @param {import('$roleTypes').RoleModel} data */
    function postUpdate(data) {
        roleItems = roleItems?.map(x => {
            if (x.id === data.id) {
                return { ...data, update_date: moment.utc().toString(), open_detail: true };
            }
            return x;
        }) || [];
    }
</script>


<HeadTitle title="{$_('Role List')}" />
<Breadcrumb title="{$_('Management')}" pagetitle="{$_('Roles')}" />
<LoadingToComplete
	isLoading={isLoading}
	isComplete={isComplete}
	isError={isError}
	successText={successText}
	errorText={errorText}
/>

<Row>
	<Col lg="12">
		<Card>
			<CardBody class="border-bottom">
				<div class="d-flex align-items-center">
					<h5 class="mb-0 card-title flex-grow-1">{$_('Role List')}</h5>
				</div>
			</CardBody>
			<CardBody>
				<div class="table-responsive thin-scrollbar">
					<Table class="align-middle nowrap roles-table" bordered>
						<thead>
							<tr>
								<th scope="col">{$_('Name')}</th>
								<th scope="col" class="role-permission-col">{$_('Permissions')}</th>
                                <th scope="col">{$_('Update Date')}</th>
								<th scope="col">{$_('')}</th>
							</tr>
						</thead>
						<tbody>
							{#each roleItems as item, idx (idx)}
                                <RoleItem
                                    item={item}
                                    agents={agents}
                                    open={item.open_detail}
                                    on:save={e => saveRole(e)}
                                />
                            {/each}
						</tbody>
					</Table>
				</div>
			</CardBody>
		</Card>
	</Col>
</Row>