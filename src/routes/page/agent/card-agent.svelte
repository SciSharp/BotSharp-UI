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
  <div class="col-xl-4 col-sm-6">
    <div class="card" style="height: 95%;">
      <div class="card-body">
        <div class="d-flex justify-content-between" style="gap: 1.5rem;">
          <div class="avatar-md" style="flex-shrink: 0;">
            <span class="avatar-title rounded-circle bg-light text-danger font-size-16" style="overflow: hidden;">
              {#if agent.icon_url}
              <img src={agent.icon_url} alt="" width="50" height="50" style="object-fit: cover;" />
              {:else}
              <img src="images/users/bot.png" alt="" width="50" height="50" style="object-fit: cover;" />
              {/if}
            </span>
          </div>

          <div class="flex-grow-1 overflow-hidden">
            <div class="agent-card-header">
              <h5 class="text-truncate font-size-15 line-align-center mb-0">
                <button type="button" class="btn text-dark text-btn font-size-15" onclick={() => goToPage(`page/agent/${agent.id}`)}>
                  {agent.name}
                </button>
              </h5>
              {#if agent.is_router}
              <div
                class="font-size-15 line-align-center"
                data-bs-toggle="tooltip"
                data-bs-placement="bottom"
                title="Go to flowchart"
              >
                <button type="button" class="btn text-dark text-btn font-size-15" title="Go to flowchart" onclick={() => goToPage(`page/agent/router?agent_id=${agent.id}`)}>
                  <i class="mdi mdi-sitemap"></i>
                </button>
              </div>
              {/if}
            </div>
            {#if agent.labels?.length > 0}
              <div class="agent-label-container">
                {#each agent.labels as label}
                  <span class="badge bg-info">{label}</span>
                {/each}
              </div>
            {:else}
              <p>Provided by {agent.plugin.name}</p>
            {/if}
            <div
              class="text-muted mb-2 truncate-text"
              style="height: 60px;"
              data-bs-toggle="tooltip"
              data-bs-placement="top"
              title={agent.description}
            >
              {agent.description}
            </div>
            <div class="overflow-hidden">
              <div class="avatar-group" style="height:35px;">
              {#if agent.is_router}
              <div class="avatar-group-item me-3">
                <img src="icons/router.png" class="rounded-circle avatar-xs" alt="routing"/>
              </div>
              {/if}
              {#if agent.allow_routing}
              <div class="avatar-group-item me-3">
                <img src="icons/routing-2.png" class="rounded-circle avatar-xs" alt="routing"/>
              </div>
              {/if}
              {#each agent.functions as fn}
                <div class="avatar-group-item">
                  <div class="d-inline-block" id={"member" + fn.name}>
                    <img src="images/function.png" class="rounded-circle avatar-xs" alt={fn.name}/>
                  </div>
                </div>
              {/each}
            </div>
            </div>

          </div>
        </div>
      </div>
      <div class="px-4 py-3 border-top">
        <ul class="list-inline mb-0">
          <li class="list-inline-item me-1 mt-1 mb-1">
            <span class="badge {agent.disabled ? 'bg-warning' : 'bg-success'}">{agent.disabled ? $_('Disabled') : $_('Enabled')}</span>
          </li>
          <li class="list-inline-item me-1 mt-1 mb-1">
            <span class="badge {agent.is_public ? 'bg-success' : 'bg-warning'}">{agent.is_public ? $_('Public') : $_('Private')}</span>
          </li>
          <li class="list-inline-item me-1 mt-1 mb-1" id="dueDate">
            <i class="bx bx-calendar me-1"></i>
            {utcToLocal(agent.updated_datetime, 'MMM D, YYYY')}
          </li>
          <li class="list-inline-item me-1 mt-1 mb-1">
            <button type="button" class="btn btn-light btn-sm" onclick={() => goToPage(`page/agent/${agent.id}/build`)} disabled>
              <i class="bx bx-wrench"></i> {$_('Build')}
            </button>
          </li>
          {#if agent.is_public }
          <li class="list-inline-item me-1 mt-1 mb-1">
            <button type="button" class="btn btn-light btn-sm" onclick={() => goToPage(`chat/${LEARNER_AGENT_ID}`)} disabled>
              <i class="bx bx-book-open"></i> {$_('Train')}
            </button>
          </li>
          <li class="list-inline-item me-1 mt-1 mb-1">
            <button type="button" class="btn {AgentExtensions.chatable(agent) ? 'btn-primary' : 'btn-light'} btn-sm" onclick={() => goToPage(`chat/${agent.id}`)} disabled={!AgentExtensions.chatable(agent)}>
              <i class="bx bx-chat"></i> {$_('Test')}
            </button>
          </li>
          {/if}
        </ul>
      </div>
    </div>
  </div>
{/each}