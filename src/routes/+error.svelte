<script>
    import { page } from '$app/stores';
    import { Col, Container, Row } from '@sveltestrap/sveltestrap';
    import Link from 'svelte-link';
    import Error500 from '$lib/common/errors/error-500.svelte';
    import HeadTitle from '$lib/common/shared/HeadTitle.svelte';

    $: status = $page.status;
    $: message = $page.error?.message || 'An error occurred';

    $: icon = status === 404 ? 'bx-search-alt' : 'bx-error-circle';
    $: title = status === 404 ? 'Page Not Found' : message;
</script>

{#if status === 500}
    <Error500 />
{:else}
    <HeadTitle title="{status} Error" />

    <div class="account-pages my-5 pt-5">
        <Container>
            <Row>
                <Col lg="12">
                    <div class="text-center mb-5">
                        <h1 class="display-2 fw-medium">
                            {String(status).charAt(0)}
                            <i class="bx {icon} bx-tada text-primary display-3" />
                            {String(status).slice(1)}
                        </h1>
                        <h4 class="text-uppercase">{title}</h4>
                        <p class="text-muted mt-3">
                            {#if status === 404}
                                The page you're looking for doesn't exist or has been moved.
                            {:else}
                                Sorry, something went wrong. Please try again later.
                            {/if}
                        </p>
                        {#if status !== 404}
                            <div class="mt-5 text-center">
                                <Link class="btn btn-primary" href="page/dashboard">
                                    Back to Dashboard
                                </Link>
                            </div>
                        {/if}
                    </div>
                </Col>
            </Row>
            <Row class="justify-content-center">
                <Col md="8" xl="6">
                    <div>
                        <img src="/images/error-img.png" alt="" class="img-fluid" />
                    </div>
                </Col>
            </Row>
        </Container>
    </div>
{/if}