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

<style>
	.node {
		box-sizing: border-box;
		width: fit-content;
		border-radius: 8px;
		height: fit-content;
		position: relative;
		pointer-events: auto;
		display: flex;
		flex-direction: column;
		padding: 10px;
		gap: 10px;
	}

	h1 {
		font-size: 0.9rem;
		font-weight: 200;
		padding: 0;
		margin: 0;
		display: flex;
		align-items: center;
		padding-bottom: 8px;
		border-color: inherit;
	}

	.output-anchors {
		position: absolute;
		right: -24px;
		top: 8px;
		display: flex;
		flex-direction: column;
		gap: 10px;
	}
	.destroy {
		background: none;
		border: none;
		color: inherit;
		cursor: pointer;
	}
	.header {
		display: flex;
		justify-content: space-between;
		align-items: baseline;
		width: 100%;
		border-bottom: solid 1px;
		border-color: lightgray;
	}
</style>
