<script>
  import Link from "svelte-link";
  import { Badge, Card, CardBody, Col } from '@sveltestrap/sveltestrap';
  import { utcToLocal } from '$lib/helpers/datetime';
  import { _ } from 'svelte-i18n';
	import { LEARNER_ID } from "$lib/helpers/constants";
	import { AgentExtensions } from "$lib/helpers/utils/agent";

  /** @type {import('$agentTypes').AgentModel[]} */
  export let agents;

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
                <Link href= "page/agent/{agent.id}" class="text-dark">
                  {agent.name}
                </Link>
              </h5>
              {#if agent.is_router}
              <div
                class="font-size-15 line-align-center"
                data-bs-toggle="tooltip"
                data-bs-placement="bottom"
                title="Go to flowchart"
              >
                <Link href={`page/agent/router?agent_id=${agent.id}`} target="_blank">
                  <i class="mdi mdi-sitemap" />
                </Link>
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
            <Link href="page/agent/{agent.id}/build" class="btn btn-primary btn-sm" target="_blank" disabled>
              <i class="bx bx-wrench" /> {$_('Build')}
            </Link>
          </li>
          {#if agent.is_public }      
          <li class="list-inline-item me-1 mt-1 mb-1">
            <Link href={`/chat/${LEARNER_ID}`} class="btn btn-primary btn-sm" target="_blank" disabled>
              <i class="bx bx-book-open" /> {$_('Train')}
            </Link>
          </li>
          <li class="list-inline-item me-1 mt-1 mb-1">
            <Link href= "chat/{agent.id}" class="btn btn-primary btn-sm" target="_blank" disabled={!AgentExtensions.chatable(agent)}>
              <i class="bx bx-chat" /> {$_('Test')}
            </Link>
          </li>
          {/if}
        </ul>
      </div>
    </Card>
  </Col>
{/each}