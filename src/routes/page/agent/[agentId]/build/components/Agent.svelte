<script>
	import CustomAnchor from './CustomAnchor.svelte';
	import { Node, Anchor } from 'svelvet';
	import { generateInput, generateOutput } from 'svelvet';

	/** @type import('$types').AgentModel */
	export let agent;

    /** 
     * @typedef {Object} Inputs 
     * @property {number} strokeWidth
     * @property {number} noise
    */

    /** @type Inputs */
	const initialData = {
		strokeWidth: 2,
		noise: 1
	};
	const processor = (inputs) => inputs;
	const inputs = generateInput(initialData);
	const output = generateOutput(inputs, processor);
</script>

<Node useDefaults id="output" position={{ x: 560, y: 30 }} let:selected locked>
	<div class="node" class:selected>
		<span class="avatar-title rounded-circle bg-light text-danger font-size-16">
			<img src={agent?.icon_url} alt="" width="120px"/>
		</span>
		<p>{agent?.description}</p>
		<div class="input-anchors">
			{#each Object.keys(initialData) as key}
				<span>{$output[key]}</span>
				<Anchor id={key} let:hovering let:connecting let:linked inputsStore={inputs} {key} input>
					<CustomAnchor {hovering} {connecting} {linked} />
				</Anchor>
			{/each}
		</div>
	</div>
</Node>

<style>
	.node {
		box-sizing: border-box;
		width: 400px;
		height: 400px;
		border-radius: 8px;
		position: relative;
		pointer-events: auto;
		display: flex;
		flex-direction: column;
		padding: 10px;
		gap: 10px;
	}

	.selected {
		border: solid 2px white;
	}
	.input-anchors {
		position: absolute;
		display: flex;
		flex-direction: column;
		gap: 10px;
		left: -24px;
	}
</style>
