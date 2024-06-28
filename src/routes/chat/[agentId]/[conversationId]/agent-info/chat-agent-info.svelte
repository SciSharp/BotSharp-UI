<script>
    /** @type {import('$types').AgentModel} */
	export let agent;
</script>

<div>
    <div class="chat-agent-row">
        <h3 class="text-primary fw-bold">
            {agent?.name || ''}
        </h3>
    </div>
    <div class="chat-agent-row">
        <div class="text-secondary">
            {agent?.description || ''}
        </div>
    </div>
    <div class="chat-agent-row">
        <div>
            {agent?.llm_config?.provider || ''}{!!agent?.llm_config?.provider ? ',': ''} {agent?.llm_config?.model || ''}
        </div>
    </div>
    <div class="chat-agent-row">
        <div>
            <span>
                {agent?.profiles?.length || 0} {agent?.profiles?.length > 1 ? 'profiles' : 'profile'}{!!agent?.profiles ? ', ' : ''}
                {agent?.functions?.length || 0} {agent?.functions?.length > 1 ? 'functions' : 'function'}{!!agent?.functions ? ', ' : ''}
                {agent?.templates?.length || 0} {agent?.templates?.length > 1 ? 'templates' : 'template'}
            </span>
        </div>
    </div>
</div>