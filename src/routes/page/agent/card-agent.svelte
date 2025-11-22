<script>
  import { goto } from '$app/navigation';
  import { _ } from 'svelte-i18n';
  import { Badge, Button, Card, CardBody, Col } from '@sveltestrap/sveltestrap';
  import { utcToLocal } from '$lib/helpers/datetime';
	import { LEARNER_AGENT_ID } from "$lib/helpers/constants";
	import { AgentExtensions } from "$lib/helpers/utils/agent";
	import { globalEventStore } from '$lib/helpers/store';

  /** @type {import('$agentTypes').AgentModel[]} */
  export let agents;

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
  <Col xl="4" sm="6">
    <Card style={"height: 95%;"}>
      <CardBody>
        <div class="d-flex justify-content-between" style="gap: 1.5rem;">
          <div class="avatar-md">
            <span class="avatar-title rounded-circle bg-light text-danger font-size-16">
              {#if agent.icon_url}
              <img src={agent.icon_url} alt="" height="60" />
              {:else}
              <img src="images/users/bot.png" alt="" height="60" />
              {/if}
            </span>
          </div>

          <div class="flex-grow-1 overflow-hidden">
            <div class="agent-card-header">
              <h5 class="text-truncate font-size-15 line-align-center mb-0">
                <Button class="text-dark text-btn font-size-15" on:click={() => goToPage(`page/agent/${agent.id}`)}>
                  {agent.name}
                </Button>
              </h5>
              {#if agent.is_router}
              <div
                class="font-size-15 line-align-center"
                data-bs-toggle="tooltip"
                data-bs-placement="bottom"
                title="Go to flowchart"
              >
                <Button class="text-dark text-btn font-size-15" on:click={() => goToPage(`page/agent/router?agent_id=${agent.id}`)}>
                  <i class="mdi mdi-sitemap" />
                </Button>
              </div>
              {/if}
            </div>
            {#if agent.labels?.length > 0}
              <div class="agent-label-container">
                {#each agent.labels as label}
                  <Badge color={"info"}>{label}</Badge>
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
      </CardBody>
      <div class="px-4 py-3 border-top">
        <ul class="list-inline mb-0">
          <li class="list-inline-item me-1 mt-1 mb-1">
            <Badge color={agent.disabled ? "warning" : "success"}>{agent.disabled ? $_('Disabled') : $_('Enabled')}</Badge>
          </li>
          <li class="list-inline-item me-1 mt-1 mb-1">
            <Badge color={agent.is_public ? "success" : "warning"}>{agent.is_public ? $_('Public') : $_('Private')}</Badge>
          </li>
          <li class="list-inline-item me-1 mt-1 mb-1" id="dueDate">
            <i class="bx bx-calendar me-1" />
            {utcToLocal(agent.updated_datetime, 'MMM D, YYYY')}
          </li>
          <li class="list-inline-item me-1 mt-1 mb-1">
            <Button class="btn btn-primary btn-sm" on:click={() => goToPage(`page/agent/${agent.id}/build`)} disabled>
              <i class="bx bx-wrench" /> {$_('Build')}
            </Button>
          </li>
          {#if agent.is_public }      
          <li class="list-inline-item me-1 mt-1 mb-1">
            <Button class="btn btn-primary btn-sm" on:click={() => goToPage(`chat/${LEARNER_AGENT_ID}`)} disabled>
              <i class="bx bx-book-open" /> {$_('Train')}
            </Button>
          </li>
          <li class="list-inline-item me-1 mt-1 mb-1">
            <Button class="btn btn-primary btn-sm" color="primary" on:click={() => goToPage(`chat/${agent.id}`)} disabled={!AgentExtensions.chatable(agent)}>
              <i class="bx bx-chat" /> {$_('Test')}
            </Button>
          </li>
          {/if}
        </ul>
      </div>
    </Card>
  </Col>
{/each}