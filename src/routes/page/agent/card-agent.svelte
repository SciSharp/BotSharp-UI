<script>
  import { goto } from '$app/navigation';
  import { _ } from 'svelte-i18n';
  import { utcToLocal } from '$lib/helpers/datetime';
  import { LEARNER_AGENT_ID } from "$lib/helpers/constants";
  import { AgentExtensions } from "$lib/helpers/utils/agent";
  import { globalEventStore } from '$lib/helpers/store';

  /** @type {{ agents: import('$agentTypes').AgentModel[] }} */
  let { agents } = $props();

  /**
	 * @param {string} url
	 */
  function goToPage(url) {
    if (!url) return;

    globalEventStore.reset();
    goto(url);
  }
</script>

{#each agents as agent}
  <div class="ag-card">
    <div class="ag-card-body">
      <div class="ag-card-top">
        <div class="ag-avatar">
          <span class="ag-avatar-circle">
            {#if agent.icon_url}
            <img src={agent.icon_url} alt="" width="50" height="50" />
            {:else}
            <img src="images/users/bot.png" alt="" width="50" height="50" />
            {/if}
          </span>
        </div>

        <div class="ag-card-content">
          <div class="ag-card-header">
            <h5 class="ag-name-row">
              <button type="button" class="ag-name-btn" onclick={() => goToPage(`page/agent/${agent.id}`)}>
                {agent.name}
              </button>
            </h5>
            {#if agent.is_router}
            <div
              class="ag-flowchart-wrap"
              data-bs-toggle="tooltip"
              data-bs-placement="bottom"
              title="Go to flowchart"
            >
              <button type="button" class="ag-name-btn" title="Go to flowchart" onclick={() => goToPage(`page/agent/router?agent_id=${agent.id}`)}>
                <i class="mdi mdi-sitemap"></i>
              </button>
            </div>
            {/if}
          </div>
          {#if agent.labels?.length > 0}
            <div class="ag-labels">
              {#each agent.labels as label}
                <span class="ag-label-badge">{label}</span>
              {/each}
            </div>
          {:else}
            <p class="ag-plugin-line">Provided by {agent.plugin.name}</p>
          {/if}
          <div
            class="ag-description"
            data-bs-toggle="tooltip"
            data-bs-placement="top"
            title={agent.description}
          >
            {agent.description}
          </div>
          <div class="ag-icons-wrap">
            <div class="ag-icon-row">
            {#if agent.is_router}
            <div class="ag-icon-item ag-icon-spaced">
              <img src="icons/router.png" class="ag-icon-img" alt="routing"/>
            </div>
            {/if}
            {#if agent.allow_routing}
            <div class="ag-icon-item ag-icon-spaced">
              <img src="icons/routing-2.png" class="ag-icon-img" alt="routing"/>
            </div>
            {/if}
            {#each agent.functions as fn}
              <div class="ag-icon-item">
                <div class="ag-icon-inline" id={"member" + fn.name}>
                  <img src="images/function.png" class="ag-icon-img" alt={fn.name}/>
                </div>
              </div>
            {/each}
          </div>
          </div>

        </div>
      </div>
    </div>
    <div class="ag-card-footer">
      <ul class="ag-meta-list">
        <li class="ag-meta-item">
          <span class="ag-badge {agent.disabled ? 'ag-badge-warning' : 'ag-badge-success'}">{agent.disabled ? $_('Disabled') : $_('Enabled')}</span>
        </li>
        <li class="ag-meta-item">
          <span class="ag-badge {agent.is_public ? 'ag-badge-success' : 'ag-badge-warning'}">{agent.is_public ? $_('Public') : $_('Private')}</span>
        </li>
        <li class="ag-meta-item" id="dueDate">
          <i class="bx bx-calendar ag-meta-icon"></i>
          {utcToLocal(agent.updated_datetime, 'MMM D, YYYY')}
        </li>
        <li class="ag-meta-item">
          <button type="button" class="ag-btn-sm ag-btn-sm-light" onclick={() => goToPage(`page/agent/${agent.id}/build`)} disabled>
            <i class="bx bx-wrench"></i> {$_('Build')}
          </button>
        </li>
        {#if agent.is_public }
        <li class="ag-meta-item">
          <button type="button" class="ag-btn-sm ag-btn-sm-light" onclick={() => goToPage(`chat/${LEARNER_AGENT_ID}`)} disabled>
            <i class="bx bx-book-open"></i> {$_('Train')}
          </button>
        </li>
        <li class="ag-meta-item">
          <button type="button" class="ag-btn-sm {AgentExtensions.chatable(agent) ? 'ag-btn-sm-primary' : 'ag-btn-sm-light'}" onclick={() => goToPage(`chat/${agent.id}`)} disabled={!AgentExtensions.chatable(agent)}>
            <i class="bx bx-chat"></i> {$_('Test')}
          </button>
        </li>
        {/if}
      </ul>
    </div>
  </div>
{/each}

