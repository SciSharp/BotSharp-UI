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

<style>
  /* ===== Card shell ===== */
  .ag-card {
    display: flex;
    flex-direction: column;
    background-color: rgb(255 255 255);
    border: 1px solid rgb(229 231 235);
    border-radius: 0.875rem;
    box-shadow:
      0 1px 2px rgb(15 23 42 / 0.04),
      0 10px 30px -12px rgb(15 23 42 / 0.08);
    overflow: hidden;
    height: 100%;
    transition: box-shadow 0.15s ease, transform 0.15s ease;
  }
  .ag-card:hover {
    box-shadow:
      0 2px 4px rgb(15 23 42 / 0.06),
      0 16px 36px -12px rgb(15 23 42 / 0.12);
  }

  /* ===== Card body ===== */
  .ag-card-body {
    padding: 1.25rem;
    flex: 1 1 auto;
  }
  .ag-card-top {
    display: flex;
    justify-content: space-between;
    gap: 1.5rem;
  }
  .ag-card-content {
    flex: 1 1 auto;
    overflow: hidden;
  }

  /* ===== Avatar ===== */
  .ag-avatar {
    flex-shrink: 0;
    height: 4rem;
    width: 4rem;
  }
  .ag-avatar-circle {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 100%;
    height: 100%;
    border-radius: 50%;
    background-color: var(--color-light);
    overflow: hidden;
  }
  .ag-avatar-circle img {
    width: 50px;
    height: 50px;
    object-fit: cover;
  }

  /* ===== Card header (name + flowchart icon) ===== */
  .ag-card-header {
    display: flex;
    gap: 0.625rem;
    flex-wrap: wrap;
    align-items: center;
  }
  .ag-name-row {
    display: flex;
    align-items: center;
    overflow: hidden;
    white-space: nowrap;
    text-overflow: ellipsis;
    margin: 0;
    font-size: 0.9375rem;
    line-height: 1.4;
    min-width: 0;
  }
  .ag-name-btn {
    background: none;
    border: none;
    padding: 0;
    margin: 0;
    color: rgb(17 24 39);
    font-size: 0.9375rem;
    font-weight: 500;
    line-height: 1.4;
    cursor: pointer;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    max-width: 100%;
    transition: color 0.15s ease;
  }
  .ag-name-btn:hover {
    color: var(--color-primary);
  }
  .ag-flowchart-wrap {
    display: inline-flex;
    align-items: center;
  }

  /* ===== Labels ===== */
  .ag-labels {
    display: flex;
    gap: 0.3125rem;
    flex-wrap: wrap;
    margin: 0.3125rem 0;
  }
  .ag-label-badge {
    display: inline-flex;
    align-items: center;
    padding: 0.25rem 0.5rem;
    font-size: 0.6875rem;
    font-weight: 600;
    line-height: 1;
    color: rgb(255 255 255);
    background-color: var(--color-info);
    border-radius: 0.25rem;
  }
  .ag-plugin-line {
    margin: 0.3125rem 0;
    font-size: 0.8125rem;
    color: var(--color-muted);
  }

  /* ===== Description (3-line clamp) ===== */
  .ag-description {
    height: 60px;
    margin-bottom: 0.5rem;
    color: var(--color-muted);
    font-size: 0.8125rem;
    line-height: 1.55;
    display: -webkit-box;
    -webkit-line-clamp: 3;
    line-clamp: 3;
    -webkit-box-orient: vertical;
    text-overflow: ellipsis;
    overflow-y: hidden;
  }

  /* ===== Icons row ===== */
  .ag-icons-wrap {
    overflow: hidden;
  }
  .ag-icon-row {
    display: flex;
    align-items: center;
    height: 35px;
  }
  .ag-icon-item {
    display: inline-flex;
    align-items: center;
  }
  .ag-icon-spaced {
    margin-right: 1rem;
  }
  .ag-icon-inline {
    display: inline-block;
  }
  .ag-icon-img {
    height: 2rem;
    width: 2rem;
    border-radius: 50%;
    object-fit: cover;
  }

  /* ===== Card footer ===== */
  .ag-card-footer {
    padding: 0.75rem 1.25rem;
    border-top: 1px solid rgb(229 231 235);
  }
  .ag-meta-list {
    list-style: none;
    margin: 0;
    padding: 0;
    display: flex;
    flex-wrap: wrap;
    gap: 0.25rem 0.5rem;
    align-items: center;
    font-size: 0.8125rem;
    color: rgb(55 65 81);
  }
  .ag-meta-item {
    display: inline-flex;
    align-items: center;
  }
  .ag-meta-icon {
    margin-right: 0.25rem;
    font-size: 1rem;
    line-height: 1;
    color: var(--color-muted);
  }

  /* ===== Badges (footer status pills) ===== */
  .ag-badge {
    display: inline-flex;
    align-items: center;
    padding: 0.25rem 0.5rem;
    font-size: 0.6875rem;
    font-weight: 600;
    line-height: 1;
    color: rgb(255 255 255);
    border-radius: 0.25rem;
  }
  .ag-badge-success {
    background-color: var(--color-success);
  }
  .ag-badge-warning {
    background-color: var(--color-warning);
  }

  /* ===== Small footer buttons (Build / Train / Test) ===== */
  .ag-btn-sm {
    display: inline-flex;
    align-items: center;
    gap: 0.3rem;
    height: 1.75rem;
    padding: 0 0.625rem;
    font-size: 0.75rem;
    font-weight: 500;
    line-height: 1;
    border: 1px solid transparent;
    border-radius: 0.375rem;
    cursor: pointer;
    transition: background-color 0.15s ease, color 0.15s ease, border-color 0.15s ease;
  }
  .ag-btn-sm i {
    font-size: 0.9375rem;
    line-height: 1;
  }
  .ag-btn-sm:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
  .ag-btn-sm-light {
    background-color: var(--color-light);
    border-color: var(--color-light);
    color: rgb(55 65 81);
  }
  .ag-btn-sm-light:hover:not(:disabled) {
    background-color: rgb(226 232 240);
    border-color: rgb(226 232 240);
  }
  .ag-btn-sm-primary {
    background-color: var(--color-primary);
    border-color: var(--color-primary);
    color: rgb(255 255 255);
  }
  .ag-btn-sm-primary:hover:not(:disabled) {
    background-color: var(--color-primary-hover);
    border-color: var(--color-primary-hover);
  }

  /* ===== Dark mode ===== */
  :global(.dark) .ag-card {
    background-color: rgb(31 41 55);
    border-color: rgb(55 65 81);
  }
  :global(.dark) .ag-name-btn {
    color: rgb(229 231 235);
  }
  :global(.dark) .ag-avatar-circle {
    background-color: rgb(55 65 81);
  }
  :global(.dark) .ag-card-footer {
    border-top-color: rgb(55 65 81);
  }
  :global(.dark) .ag-meta-list {
    color: rgb(209 213 219);
  }
  :global(.dark) .ag-btn-sm-light {
    background-color: rgb(55 65 81);
    border-color: rgb(55 65 81);
    color: rgb(229 231 235);
  }
  :global(.dark) .ag-btn-sm-light:hover:not(:disabled) {
    background-color: rgb(75 85 99);
    border-color: rgb(75 85 99);
  }
</style>