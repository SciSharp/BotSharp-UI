<script>
	import { Button } from '@sveltestrap/sveltestrap';
	import Breadcrumb from '$lib/common/Breadcrumb.svelte';
	import HeadTitle from '$lib/common/HeadTitle.svelte';
	import { refreshAgents } from '$lib/services/agent-service';
	import LoadingToComplete from '$lib/common/LoadingToComplete.svelte';
    import { _ } from 'svelte-i18n';
    import Swal from 'sweetalert2'

    let isLoading = false;
    let isComplete = false;
    let isError = false;
    const duration = 3000;

    function readyToRefresh() {
		// @ts-ignore
        Swal.fire({
            title: 'Are you sure?',
            text: "You will migrate all agents data to mongoDb.",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonText: 'Yes',
            cancelButtonText: 'No'
        }).then((result) => {
            if (result.value) {
                refreshAgentData();
            }
        });
	}

    const refreshAgentData = () => {
        isLoading = true;
        refreshAgents().then(res => {
            isComplete = true;
            isLoading = false;
            setTimeout(() => {
                isComplete = false;
            }, duration);
        }).catch(err => {
            isLoading = false;
            isComplete = false;
            isError = true;
            setTimeout(() => {
                isError = false;
            }, duration);
        });
    };
</script>

<HeadTitle title="MongoDB" />
<Breadcrumb title="MongoDB" pagetitle="{$_('Setting')}" />
<LoadingToComplete isLoading={isLoading} isComplete={isComplete} isError={isError} />

<h3>{$_('Migrate agents from file repository to MongoDB')}</h3>
<Button color="primary" on:click={() => readyToRefresh()} disabled={isLoading}>
    <i class="bx bx-copy" /> {$_('Start Migration')}
</Button>