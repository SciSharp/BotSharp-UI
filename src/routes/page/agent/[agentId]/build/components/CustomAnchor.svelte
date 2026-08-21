<script>
	/**
	 * @type {{
	 *   linked: boolean,
	 *   connecting: boolean,
	 *   hovering: boolean
	 * }}
	 */
	let { linked, connecting, hovering } = $props();
</script>

<div class:linked class:hovering class:connecting class="my-anchor"></div>


