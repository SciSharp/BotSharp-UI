<script>
	import { Anchor } from 'svelvet';
	import CustomAnchor from './CustomAnchor.svelte';

	/**
	 * @type {{
	 *   title: string,
	 *   outputStore?: any,
	 *   key?: string,
	 *   destroy?: (() => void) | undefined,
	 *   children?: import('svelte').Snippet
	 * }}
	 */
	let { title, outputStore, key = '', destroy, children } = $props();
</script>

<div class="node">
	<div class="header">
		<h1>{title}</h1>
		{#if destroy}
			<button class="destroy" onclick={destroy}>X</button>
		{/if}
	</div>
	{#if children}
		{@render children()}
	{/if}
</div>
{#if outputStore && key}
	<div class="output-anchors">
		<Anchor
			connections={[['output', key]]}
			let:linked
			let:connecting
			let:hovering
			{outputStore}
			output
		>
			<CustomAnchor {hovering} {connecting} {linked} />
		</Anchor>
	</div>
{/if}


