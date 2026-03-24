<script>
	import { goto } from '$app/navigation';
	import HeadTitle from '$lib/common/shared/HeadTitle.svelte';
</script>

<HeadTitle title="500 Error Page" />

<div class="account-pages my-5 pt-5">
	<div class="container">
	  <div class="row">
		<div class="col-lg-12">
		  <div class="text-center mb-5">
			<h1 class="display-2 fw-medium">
			  5
			  <i class="bx bx-buoy bx-spin text-primary display-3"></i>
			  0
			</h1>
			<h4 class="text-uppercase">Internal Server Error</h4>
			<div class="mt-5 text-center">
			  <button class="btn btn-primary" on:click={() => goto('/page/dashboard')}>
				Back to Dashboard
			  </button>
			</div>
		  </div>
		</div>
	  </div>
	  <div class="row justify-content-center">
		<div class="col-md-8 col-xl-6">
		  <div>
			<img src='images/error-img.png' alt="" class="img-fluid" />
		  </div>
		</div>
	  </div>
	</div>
  </div>
