<template>
  <div class="alert-rule-list">
    <!-- Header with title and actions -->
    <div class="rule-list-header">
      <h2 class="rule-list-title">Alert Rules</h2>
      <div class="rule-list-actions">
        <button class="btn btn-primary" @click="openCreateRuleModal">
          <span class="icon">+</span>
          Create Rule
        </button>
      </div>
    </div>

    <!-- Filter and search bar -->
    <div class="rule-list-filters">
      <input
        v-model="searchQuery"
        type="text"
        placeholder="Search rules by name or metric..."
        class="search-input"
      />
      <select v-model="filterByStatus" class="filter-select">
        <option value="">All Rules</option>
        <option value="enabled">Enabled</option>
        <option value="disabled">Disabled</option>
      </select>
    </div>

    <!-- Loading state -->
    <div v-if="loading" class="loading-container">
      <LoadingSkeleton :count="5" />
    </div>

    <!-- Empty state -->
    <div v-else-if="filteredRules.length === 0" class="empty-state-container">
      <EmptyState
        icon-type="empty-folder"
        title="No Alert Rules"
        description="Create your first alert rule to start monitoring"
        :show-action-button="true"
        action-button-label="Create Rule"
        @action="openCreateRuleModal"
      />
    </div>

    <!-- Rules table -->
    <div v-else class="rules-table-container">
      <table class="rules-table">
        <thead>
          <tr>
            <th class="col-status">Status</th>
            <th class="col-name">Rule Name</th>
            <th class="col-metric">Metric</th>
            <th class="col-condition">Condition</th>
            <th class="col-severity">Severity</th>
            <th class="col-service">Service</th>
            <th class="col-actions">Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="rule in paginatedRules" :key="rule.id" class="rule-row">
            <!-- Status toggle -->
            <td class="col-status">
              <button
                class="toggle-button"
                :class="{ enabled: rule.enabled, disabled: !rule.enabled }"
                @click="toggleRuleEnabled(rule.id)"
                :title="rule.enabled ? 'Disable rule' : 'Enable rule'"
              >
                <span class="toggle-indicator"></span>
              </button>
            </td>

            <!-- Rule name -->
            <td class="col-name">
              <span class="rule-name">{{ rule.name }}</span>
              <p v-if="rule.description" class="rule-description">
                {{ rule.description }}
              </p>
            </td>

            <!-- Metric -->
            <td class="col-metric">
              <span class="metric-badge">{{ rule.metric }}</span>
            </td>

            <!-- Condition -->
            <td class="col-condition">
              <span class="condition-text">
                {{ formatCondition(rule.condition, rule.threshold) }}
              </span>
            </td>

            <!-- Severity -->
            <td class="col-severity">
              <span class="severity-badge" :class="rule.severity">
                {{ capitalizeFirst(rule.severity) }}
              </span>
            </td>

            <!-- Service -->
            <td class="col-service">
              <span v-if="rule.service" class="service-badge">
                {{ rule.service }}
              </span>
              <span v-else class="service-badge all">All Services</span>
            </td>

            <!-- Actions -->
            <td class="col-actions">
              <button
                class="action-button edit"
                @click="editRule(rule)"
                title="Edit rule"
              >
                ✎
              </button>
              <button
                class="action-button delete"
                @click="deleteRule(rule.id)"
                title="Delete rule"
              >
                ✕
              </button>
            </td>
          </tr>
        </tbody>
      </table>

      <!-- Pagination -->
      <div v-if="totalPages > 1" class="pagination">
        <button
          class="pagination-button"
          :disabled="currentPage === 1"
          @click="previousPage"
        >
          ← Previous
        </button>
        <span class="pagination-info">
          Page {{ currentPage }} of {{ totalPages }}
        </span>
        <button
          class="pagination-button"
          :disabled="currentPage === totalPages"
          @click="nextPage"
        >
          Next →
        </button>
      </div>
    </div>

    <!-- Rule detail drawer -->
    <InfoDrawer
      :is-open="showRuleDetail"
      title="Rule Details"
      :show-footer="true"
      :show-primary-action="isEditingRule"
      :show-secondary-action="true"
      primary-action-label="Save Changes"
      secondary-action-label="Close"
      @close="closeRuleDetail"
      @primary-action="saveRuleChanges"
      @secondary-action="closeRuleDetail"
    >
      <template #content>
        <div v-if="selectedRule" class="rule-detail-form">
          <!-- Rule name -->
          <div class="form-group">
            <label class="form-label">Rule Name</label>
            <input
              v-model="selectedRule.name"
              type="text"
              class="form-input"
              :disabled="!isEditingRule"
            />
          </div>

          <!-- Description -->
          <div class="form-group">
            <label class="form-label">Description</label>
            <textarea
              v-model="selectedRule.description"
              class="form-textarea"
              :disabled="!isEditingRule"
              rows="3"
            ></textarea>
          </div>

          <!-- Metric -->
          <div class="form-group">
            <label class="form-label">Metric</label>
            <select
              v-model="selectedRule.metric"
              class="form-select"
              :disabled="!isEditingRule"
            >
              <option value="">Select metric...</option>
              <option value="error_rate">Error Rate</option>
              <option value="response_time">Response Time</option>
              <option value="cpu_usage">CPU Usage</option>
              <option value="memory_usage">Memory Usage</option>
              <option value="qps">Queries Per Second</option>
            </select>
          </div>

          <!-- Condition -->
          <div class="form-group">
            <label class="form-label">Condition</label>
            <select
              v-model="selectedRule.condition"
              class="form-select"
              :disabled="!isEditingRule"
            >
              <option value="greater_than">Greater Than</option>
              <option value="less_than">Less Than</option>
              <option value="equals">Equals</option>
              <option value="not_equals">Not Equals</option>
            </select>
          </div>

          <!-- Threshold -->
          <div class="form-group">
            <label class="form-label">Threshold</label>
            <input
              v-model.number="selectedRule.threshold"
              type="number"
              class="form-input"
              :disabled="!isEditingRule"
            />
          </div>

          <!-- Duration -->
          <div class="form-group">
            <label class="form-label">Duration (minutes)</label>
            <input
              v-model.number="selectedRule.duration"
              type="number"
              class="form-input"
              :disabled="!isEditingRule"
              min="1"
            />
          </div>

          <!-- Severity -->
          <div class="form-group">
            <label class="form-label">Severity</label>
            <select
              v-model="selectedRule.severity"
              class="form-select"
              :disabled="!isEditingRule"
            >
              <option value="info">Info</option>
              <option value="warning">Warning</option>
              <option value="critical">Critical</option>
            </select>
          </div>

          <!-- Service filter -->
          <div class="form-group">
            <label class="form-label">Service (optional)</label>
            <select
              v-model="selectedRule.service"
              class="form-select"
              :disabled="!isEditingRule"
            >
              <option value="">All Services</option>
              <option value="api-service">API Service</option>
              <option value="auth-service">Auth Service</option>
              <option value="database">Database</option>
            </select>
          </div>

          <!-- Enabled toggle -->
          <div class="form-group">
            <label class="form-label">
              <input
                v-model="selectedRule.enabled"
                type="checkbox"
                class="form-checkbox"
                :disabled="!isEditingRule"
              />
              <span>Enabled</span>
            </label>
          </div>

          <!-- Rule statistics -->
          <div v-if="!isEditingRule" class="rule-statistics">
            <h4 class="stat-title">Rule Statistics</h4>
            <div class="stat-item">
              <span class="stat-label">Active Alerts:</span>
              <span class="stat-value">{{ getActiveAlertCount(selectedRule.id) }}</span>
            </div>
            <div class="stat-item">
              <span class="stat-label">Total Triggered:</span>
              <span class="stat-value">{{ getTotalAlertCount(selectedRule.id) }}</span>
            </div>
            <div class="stat-item">
              <span class="stat-label">Created:</span>
              <span class="stat-value">{{ formatDate(selectedRule.createdAt) }}</span>
            </div>
          </div>
        </div>
      </template>
    </InfoDrawer>

    <!-- Confirm delete dialog -->
    <ConfirmDialog
      :is-open="showDeleteConfirm"
      title="Delete Alert Rule"
      message="Are you sure you want to delete this alert rule? This action cannot be undone."
      severity="warning"
      confirm-button-label="Delete"
      cancel-button-label="Cancel"
      @confirm="confirmDelete"
      @cancel="cancelDelete"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useAlertsStore } from '@/stores/alertsStore'
import { useAlerts } from '@/composables/useAlerts'
import LoadingSkeleton from '@/components/Common/LoadingSkeleton.vue'
import EmptyState from '@/components/Common/EmptyState.vue'
import InfoDrawer from '@/components/Common/InfoDrawer.vue'
import ConfirmDialog from '@/components/Common/ConfirmDialog.vue'
import type { AlertRule } from '@/types'

// Store and composables
const alertsStore = useAlertsStore()
const { toggleRuleEnabled } = useAlerts()

// State
const searchQuery = ref('')
const filterByStatus = ref('')
const currentPage = ref(1)
const pageSize = ref(10)
const loading = ref(false)
const showRuleDetail = ref(false)
const showDeleteConfirm = ref(false)
const isEditingRule = ref(false)
const selectedRule = ref<AlertRule | null>(null)
const ruleToDelete = ref<string | null>(null)

// Computed properties
const filteredRules = computed(() => {
  let rules = alertsStore.rules

  // Filter by search query
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase()
    rules = rules.filter(
      (rule) =>
        rule.name.toLowerCase().includes(query) ||
        rule.metric.toLowerCase().includes(query) ||
        (rule.description?.toLowerCase().includes(query) ?? false)
    )
  }

  // Filter by status
  if (filterByStatus.value === 'enabled') {
    rules = rules.filter((rule) => rule.enabled)
  } else if (filterByStatus.value === 'disabled') {
    rules = rules.filter((rule) => !rule.enabled)
  }

  return rules
})

const totalPages = computed(() => Math.ceil(filteredRules.value.length / pageSize.value))

const paginatedRules = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value
  const end = start + pageSize.value
  return filteredRules.value.slice(start, end)
})

// Methods
const formatCondition = (condition: string, threshold: number): string => {
  const conditionMap: Record<string, string> = {
    greater_than: '>',
    less_than: '<',
    equals: '=',
    not_equals: '≠',
  }
  return `${conditionMap[condition] || condition} ${threshold}`
}

const capitalizeFirst = (str: string): string => {
  return str.charAt(0).toUpperCase() + str.slice(1)
}

const formatDate = (date: Date | string): string => {
  const d = typeof date === 'string' ? new Date(date) : date
  return d.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

const getActiveAlertCount = (ruleId: string): number => {
  return alertsStore.events.filter(
    (event) => event.ruleId === ruleId && !event.resolvedAt
  ).length
}

const getTotalAlertCount = (ruleId: string): number => {
  return alertsStore.events.filter((event) => event.ruleId === ruleId).length
}

const openCreateRuleModal = (): void => {
  selectedRule.value = {
    id: '',
    name: '',
    description: '',
    metric: '',
    condition: 'greater_than',
    threshold: 0,
    duration: 5,
    severity: 'warning',
    enabled: true,
    service: '',
    createdAt: new Date(),
  } as AlertRule
  isEditingRule.value = true
  showRuleDetail.value = true
}

const editRule = (rule: AlertRule): void => {
  selectedRule.value = { ...rule }
  isEditingRule.value = true
  showRuleDetail.value = true
}

const closeRuleDetail = (): void => {
  showRuleDetail.value = false
  selectedRule.value = null
  isEditingRule.value = false
}

const saveRuleChanges = (): void => {
  if (selectedRule.value) {
    if (selectedRule.value.id) {
      // Update existing rule
      alertsStore.updateRule(selectedRule.value.id, selectedRule.value)
    } else {
      // Create new rule
      alertsStore.addRule(selectedRule.value)
    }
    closeRuleDetail()
  }
}

const deleteRule = (ruleId: string): void => {
  ruleToDelete.value = ruleId
  showDeleteConfirm.value = true
}

const confirmDelete = (): void => {
  if (ruleToDelete.value) {
    alertsStore.deleteRule(ruleToDelete.value)
    showDeleteConfirm.value = false
    ruleToDelete.value = null
  }
}

const cancelDelete = (): void => {
  showDeleteConfirm.value = false
  ruleToDelete.value = null
}

const previousPage = (): void => {
  if (currentPage.value > 1) {
    currentPage.value--
  }
}

const nextPage = (): void => {
  if (currentPage.value < totalPages.value) {
    currentPage.value++
  }
}
</script>

<style scoped lang="scss">
@import '@/styles/variables.scss';

.alert-rule-list {
  display: flex;
  flex-direction: column;
  gap: 24px;
  padding: 24px;
  background-color: $color-bg-secondary;
  border-radius: 8px;
}

.rule-list-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 16px;
}

.rule-list-title {
  font-size: 20px;
  font-weight: 600;
  color: $color-text-primary;
  margin: 0;
}

.rule-list-actions {
  display: flex;
  gap: 12px;
}

.btn {
  padding: 8px 16px;
  border: none;
  border-radius: 4px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  gap: 8px;

  &.btn-primary {
    background-color: $color-primary;
    color: white;

    &:hover {
      background-color: darken($color-primary, 10%);
      transform: translateY(-1px);
    }

    &:active {
      transform: translateY(0);
    }
  }
}

.rule-list-filters {
  display: flex;
  gap: 12px;
  align-items: center;
}

.search-input,
.filter-select {
  padding: 8px 12px;
  border: 1px solid $color-border;
  border-radius: 4px;
  background-color: $color-bg-tertiary;
  color: $color-text-primary;
  font-size: 14px;

  &:focus {
    outline: none;
    border-color: $color-primary;
    box-shadow: 0 0 0 2px rgba($color-primary, 0.1);
  }
}

.search-input {
  flex: 1;
  min-width: 200px;
}

.filter-select {
  min-width: 150px;
}

.loading-container {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.empty-state-container {
  min-height: 300px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.rules-table-container {
  overflow-x: auto;
  border: 1px solid $color-border;
  border-radius: 4px;
}

.rules-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 14px;

  thead {
    background-color: $color-bg-tertiary;
    border-bottom: 1px solid $color-border;
  }

  th {
    padding: 12px 16px;
    text-align: left;
    font-weight: 600;
    color: $color-text-secondary;
    white-space: nowrap;
  }

  td {
    padding: 12px 16px;
    border-bottom: 1px solid $color-border-light;
    color: $color-text-primary;
  }

  tbody tr {
    transition: background-color 0.2s ease;

    &:hover {
      background-color: rgba($color-primary, 0.05);
    }
  }
}

.col-status {
  width: 60px;
}

.col-name {
  width: 200px;
}

.col-metric {
  width: 120px;
}

.col-condition {
  width: 120px;
}

.col-severity {
  width: 100px;
}

.col-service {
  width: 120px;
}

.col-actions {
  width: 80px;
  text-align: center;
}

.toggle-button {
  width: 40px;
  height: 24px;
  border: 2px solid $color-border;
  border-radius: 12px;
  background-color: $color-bg-tertiary;
  cursor: pointer;
  position: relative;
  transition: all 0.3s ease;
  padding: 0;

  &.enabled {
    background-color: #73bf69;
    border-color: #73bf69;
  }

  &.disabled {
    background-color: $color-bg-tertiary;
    border-color: $color-border;
  }

  .toggle-indicator {
    position: absolute;
    width: 18px;
    height: 18px;
    background-color: white;
    border-radius: 50%;
    top: 2px;
    left: 2px;
    transition: left 0.3s ease;
  }

  &.enabled .toggle-indicator {
    left: 18px;
  }
}

.rule-name {
  display: block;
  font-weight: 500;
  color: $color-text-primary;
}

.rule-description {
  font-size: 12px;
  color: $color-text-tertiary;
  margin: 4px 0 0 0;
}

.metric-badge,
.service-badge {
  display: inline-block;
  padding: 4px 8px;
  background-color: $color-bg-tertiary;
  border: 1px solid $color-border;
  border-radius: 4px;
  font-size: 12px;
  color: $color-text-secondary;

  &.all {
    color: $color-text-tertiary;
    font-style: italic;
  }
}

.condition-text {
  font-family: 'Courier New', monospace;
  color: $color-text-secondary;
}

.severity-badge {
  display: inline-block;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 500;

  &.critical {
    background-color: rgba(#f2495c, 0.2);
    color: #f2495c;
  }

  &.warning {
    background-color: rgba(#ff9830, 0.2);
    color: #ff9830;
  }

  &.info {
    background-color: rgba(#3274d9, 0.2);
    color: #3274d9;
  }
}

.action-button {
  width: 32px;
  height: 32px;
  border: 1px solid $color-border;
  border-radius: 4px;
  background-color: $color-bg-tertiary;
  color: $color-text-secondary;
  cursor: pointer;
  font-size: 16px;
  transition: all 0.2s ease;
  display: inline-flex;
  align-items: center;
  justify-content: center;

  &:hover {
    background-color: $color-bg-secondary;
    color: $color-text-primary;
  }

  &.delete:hover {
    background-color: rgba(#f2495c, 0.1);
    color: #f2495c;
    border-color: #f2495c;
  }

  &.edit:hover {
    background-color: rgba($color-primary, 0.1);
    color: $color-primary;
    border-color: $color-primary;
  }
}

.pagination {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 16px;
  margin-top: 16px;
  padding-top: 16px;
  border-top: 1px solid $color-border;
}

.pagination-button {
  padding: 8px 12px;
  border: 1px solid $color-border;
  border-radius: 4px;
  background-color: $color-bg-tertiary;
  color: $color-text-primary;
  cursor: pointer;
  font-size: 14px;
  transition: all 0.2s ease;

  &:hover:not(:disabled) {
    background-color: $color-primary;
    color: white;
    border-color: $color-primary;
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
}

.pagination-info {
  color: $color-text-secondary;
  font-size: 14px;
}

.rule-detail-form {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.form-label {
  font-size: 14px;
  font-weight: 500;
  color: $color-text-primary;
}

.form-input,
.form-textarea,
.form-select {
  padding: 8px 12px;
  border: 1px solid $color-border;
  border-radius: 4px;
  background-color: $color-bg-tertiary;
  color: $color-text-primary;
  font-size: 14px;
  font-family: inherit;

  &:focus {
    outline: none;
    border-color: $color-primary;
    box-shadow: 0 0 0 2px rgba($color-primary, 0.1);
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
}

.form-textarea {
  resize: vertical;
  min-height: 80px;
}

.form-checkbox {
  width: 18px;
  height: 18px;
  cursor: pointer;
  margin-right: 8px;
}

.rule-statistics {
  margin-top: 16px;
  padding-top: 16px;
  border-top: 1px solid $color-border;
}

.stat-title {
  font-size: 14px;
  font-weight: 600;
  color: $color-text-primary;
  margin: 0 0 12px 0;
}

.stat-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 0;
  font-size: 13px;
}

.stat-label {
  color: $color-text-secondary;
}

.stat-value {
  color: $color-text-primary;
  font-weight: 500;
}
</style>
