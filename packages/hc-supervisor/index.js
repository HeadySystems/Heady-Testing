// HEADY_BRAND:BEGIN
// ╔══════════════════════════════════════════════════════════════════╗
// ║  ██╗  ██╗███████╗ █████╗ ██████╗ ██╗   ██╗                     ║
// ║  ██║  ██║██╔════╝██╔══██╗██╔══██╗╚██╗ ██╔╝                     ║
// ║  ███████║█████╗  ███████║██║  ██║ ╚████╔╝                      ║
// ║  ██╔══██║██╔══╝  ██╔══██║██║  ██║  ╚██╔╝                       ║
// ║  ██║  ██║███████╗██║  ██║██████╔╝   ██║                        ║
// ║  ╚═╝  ╚═╝╚══════╝╚═╝  ╚═╝╚═════╝    ╚═╝                        ║
// ║                                                                  ║
// ║  ∞ SACRED GEOMETRY ∞  Organic Systems · Breathing Interfaces    ║
// ║  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  ║
// ║  FILE: packages/hc-supervisor/index.js                                                    ║
// ║  LAYER: root                                                  ║
// ╚══════════════════════════════════════════════════════════════════╝
// HEADY_BRAND:END
/**
 * HCSupervisor - Multi-Agent Supervisor for Heady System
 * 
 * Routes tasks to specialized agents based on capability matching.
 * Supports parallel fan-out, result aggregation, health tracking, and event emission.
 * 
 * HEADY_BRAND: Sacred Geometry - Organic Systems
 * FILE: packages/hc-supervisor/index.js
 */

const EventEmitter = require('events');

// ─── IMPORTS ──────────────────────────────────────────────────────────────
// Production imports - these are loaded at runtime
let phiMath = null;
let structuredLogger = null;
let HeadyBee = null;

// Lazy loader for optional dependencies
function loadDependencies() {
  if (!phiMath) {
    try {
      phiMath = require('@heady/phi-math');
    } catch (e) {
      phiMath = getDefaultPhiMath();
    }
  }
  
  if (!structuredLogger) {
    try {
      structuredLogger = require('@heady/structured-logger');
    } catch (e) {
      structuredLogger = getDefaultLogger();
    }
  }
  
  if (!HeadyBee) {
    try {
      HeadyBee = require('@heady/bee').HeadyBee || require('@heady/bee');
    } catch (e) {
      HeadyBee = null;
    }
  }
}

// Default implementations for when packages aren't available
function getDefaultPhiMath() {
  return {
    PHI: 1.618034,
    PSI: 0.618034,
    CSL_GATES: 8,
    CSL_TAU: 1.618034,
    phiBackoff: (attempt) => Math.pow(1.618034, attempt) * 100,
    phiScale: (value, phi = 1.618034) => value * phi,
  };
}

function getDefaultLogger() {
  return {
    info: (msg, ctx) => console.log('[INFO]', msg, ctx || ''),
    warn: (msg, ctx) => console.warn('[WARN]', msg, ctx || ''),
    error: (msg, ctx) => console.error('[ERROR]', msg, ctx || ''),
    debug: (msg, ctx) => console.debug('[DEBUG]', msg, ctx || ''),
    trace: (msg, ctx) => console.debug('[TRACE]', msg, ctx || ''),
  };
}

// ─── AGENT CATALOG ────────────────────────────────────────────────────────
/**
 * Service catalog of agents and their capabilities.
 * Sourced from service-catalog.yaml
 */
const AGENT_CATALOG = {
  builder: {
    name: 'builder',
    role: 'Build & Deploy Agent',
    skills: ['build', 'deploy', 'test', 'lint'],
    criticality: 'high',
    timeout: 30000,
  },
  researcher: {
    name: 'researcher',
    role: 'Knowledge & News Ingestion Agent',
    skills: ['news-ingestion', 'concept-extraction', 'trend-analysis'],
    criticality: 'medium',
    timeout: 45000,
  },
  deployer: {
    name: 'deployer',
    role: 'Infrastructure Deployment Agent',
    skills: ['render-deploy', 'docker-build', 'cloud-bridge', 'env-sync'],
    criticality: 'high',
    timeout: 60000,
  },
  auditor: {
    name: 'auditor',
    role: 'Audit & Compliance Agent',
    skills: ['code-audit', 'security-scan', 'brand-check', 'dependency-audit'],
    criticality: 'medium',
    timeout: 40000,
  },
  observer: {
    name: 'observer',
    role: 'Monitoring & Health Agent',
    skills: ['health-check', 'metrics-collection', 'alert-evaluation', 'readiness-probe'],
    criticality: 'critical',
    timeout: 15000,
  },
  'claude-code': {
    name: 'claude-code',
    role: 'AI Code Agent (Claude Code CLI)',
    skills: ['code-analysis', 'security-audit', 'documentation', 'concept-alignment', 'task-planning', 'governance-check', 'readiness-eval'],
    criticality: 'high',
    timeout: 120000,
  },
};

// ─── TASK TYPES & CONSTANTS ───────────────────────────────────────────────
const TASK_STATUS = {
  PENDING: 'pending',
  ASSIGNED: 'assigned',
  EXECUTING: 'executing',
  COMPLETED: 'completed',
  FAILED: 'failed',
  TIMEOUT: 'timeout',
  CANCELLED: 'cancelled',
};

const ROUTING_STRATEGY = {
  DIRECT: 'direct',
  LOAD_BALANCED: 'load-balanced',
  PARALLEL_FANOUT: 'parallel-fanout',
  CAPABILITY_MATCH: 'capability-match',
};

const HEALTH_STATUS = {
  HEALTHY: 'healthy',
  DEGRADED: 'degraded',
  UNHEALTHY: 'unhealthy',
  UNAVAILABLE: 'unavailable',
};

// ─── MAIN SUPERVISOR CLASS ────────────────────────────────────────────────
/**
 * HCSupervisor - Multi-Agent Task Router and Orchestrator
 * 
 * Responsibilities:
 * - Route tasks to agents based on capability matching
 * - Manage parallel execution and result aggregation
 * - Track agent health and route around failures
 * - Emit events for task lifecycle
 * - Enforce timeouts and SLOs
 */
class HCSupervisor extends EventEmitter {
  constructor(options = {}) {
    super();
    
    loadDependencies();
    
    this.logger = structuredLogger;
    this.phi = phiMath;
    this.bee = HeadyBee;
    
    // Configuration
    this.options = {
      maxConcurrentTasks: options.maxConcurrentTasks || 20,
      defaultTimeout: options.defaultTimeout || 30000,
      enableMetrics: options.enableMetrics !== false,
      enableHealthChecks: options.enableHealthChecks !== false,
      healthCheckInterval: options.healthCheckInterval || 5000,
      retryStrategy: options.retryStrategy || 'exponential-backoff',
      maxRetries: options.maxRetries || 3,
      ...options,
    };
    
    // Agent registry with health tracking
    this.agents = new Map();
    this.agentHealth = new Map();
    this.taskQueue = [];
    this.activeTasks = new Map();
    this.taskResults = new Map();
    
    // Metrics
    this.metrics = {
      tasksProcessed: 0,
      tasksSucceeded: 0,
      tasksFailed: 0,
      totalLatency: 0,
      agentMetrics: {},
    };
    
    // Initialize agents
    this.initializeAgents();
    
    // Start health checks if enabled
    if (this.options.enableHealthChecks) {
      this.startHealthChecks();
    }
    
    this.logger.info('HCSupervisor initialized', {
      maxConcurrentTasks: this.options.maxConcurrentTasks,
      agentsCount: Object.keys(AGENT_CATALOG).length,
    });
  }
  
  /**
   * Initialize agent registry from catalog
   */
  initializeAgents() {
    Object.entries(AGENT_CATALOG).forEach(([name, config]) => {
      this.agents.set(name, {
        ...config,
        endpoint: process.env[`AGENT_${name.toUpperCase()}_ENDPOINT`] || `http://localhost:8000/agents/${name}`,
        active: true,
        requestCount: 0,
        successCount: 0,
        failureCount: 0,
      });
      
      this.agentHealth.set(name, {
        status: HEALTH_STATUS.HEALTHY,
        lastCheck: Date.now(),
        consecutiveFailures: 0,
        responseTime: 0,
      });
      
      this.metrics.agentMetrics[name] = {
        requests: 0,
        successes: 0,
        failures: 0,
        avgLatency: 0,
        lastRequest: null,
      };
    });
  }
  
  /**
   * Submit a task for execution
   * 
   * @param {Object} task - Task definition
   * @param {string} task.id - Unique task ID
   * @param {string} task.type - Task type/skill
   * @param {Object} task.payload - Task payload
   * @param {Array<string>} task.agents - Preferred agents (optional)
   * @param {string} task.strategy - Routing strategy (default: CAPABILITY_MATCH)
   * @param {number} task.timeout - Timeout in ms (optional)
   * @returns {Promise<Object>} Task execution result
   */
  async submitTask(task) {
    if (!task.id || !task.type || task.payload === undefined) {
      throw new Error('Task must have id, type, and payload');
    }
    
    const taskId = task.id;
    const startTime = Date.now();
    
    try {
      // Create task record
      const taskRecord = {
        id: taskId,
        type: task.type,
        payload: task.payload,
        status: TASK_STATUS.PENDING,
        agents: task.agents || [],
        strategy: task.strategy || ROUTING_STRATEGY.CAPABILITY_MATCH,
        timeout: task.timeout || this.options.defaultTimeout,
        retries: 0,
        maxRetries: this.options.maxRetries,
        createdAt: Date.now(),
        startedAt: null,
        completedAt: null,
        assignedAgent: null,
        result: null,
        error: null,
      };
      
      this.activeTasks.set(taskId, taskRecord);
      this.emit('task:assigned', { taskId, task: taskRecord });
      this.logger.debug('Task assigned', { taskId, type: task.type });
      
      // Route task to appropriate agent(s)
      const routingResult = await this.routeTask(taskRecord);
      
      // Execute task
      const executionResult = await this.executeTask(taskRecord, routingResult);
      
      // Update metrics
      this.recordTaskSuccess(taskId, startTime);
      
      return executionResult;
      
    } catch (error) {
      this.recordTaskFailure(taskId, startTime, error);
      this.emit('task:failed', { taskId, error: error.message });
      this.logger.error('Task failed', { taskId, error: error.message });
      throw error;
    } finally {
      this.activeTasks.delete(taskId);
    }
  }
  
  /**
   * Route task to appropriate agent(s)
   * 
   * @private
   * @param {Object} taskRecord - Task record
   * @returns {Promise<Object>} Routing result with selected agent(s)
   */
  async routeTask(taskRecord) {
    const { type, agents: preferredAgents, strategy } = taskRecord;
    
    let selectedAgents = [];
    
    if (strategy === ROUTING_STRATEGY.DIRECT && preferredAgents.length > 0) {
      // Direct routing to specified agents
      selectedAgents = preferredAgents
        .filter(name => this.agents.has(name) && this.isAgentHealthy(name))
        .map(name => this.agents.get(name));
    } else {
      // Capability-based routing
      selectedAgents = this.findAgentsBySkill(type);
    }
    
    if (selectedAgents.length === 0) {
      throw new Error(`No suitable agents found for task type: ${type}`);
    }
    
    return {
      selectedAgents,
      strategy,
      primaryAgent: selectedAgents[0],
    };
  }
  
  /**
   * Find agents that have the specified skill
   * 
   * @private
   * @param {string} skill - Required skill
   * @returns {Array<Object>} Matching agents sorted by health/load
   */
  findAgentsBySkill(skill) {
    const matching = [];
    
    for (const [name, config] of this.agents) {
      if (config.skills.includes(skill) && this.isAgentHealthy(name)) {
        matching.push(config);
      }
    }
    
    // Sort by health and load
    matching.sort((a, b) => {
      const healthA = this.agentHealth.get(a.name);
      const healthB = this.agentHealth.get(b.name);
      
      // Healthy agents first
      if (healthA.status !== healthB.status) {
        return this.getHealthScore(healthA.status) - this.getHealthScore(healthB.status);
      }
      
      // Then by request count (lower load first)
      return a.requestCount - b.requestCount;
    });
    
    return matching;
  }
  
  /**
   * Execute task using the routed agent(s)
   * 
   * @private
   * @param {Object} taskRecord - Task record
   * @param {Object} routingResult - Routing result
   * @returns {Promise<Object>} Execution result
   */
  async executeTask(taskRecord, routingResult) {
    const { id: taskId, payload, timeout } = taskRecord;
    const { selectedAgents, primaryAgent } = routingResult;
    
    taskRecord.status = TASK_STATUS.EXECUTING;
    taskRecord.startedAt = Date.now();
    taskRecord.assignedAgent = primaryAgent.name;
    
    this.emit('task:executing', { taskId, agent: primaryAgent.name });
    
    try {
      // Execute with timeout
      const result = await Promise.race([
        this.callAgent(primaryAgent, taskRecord),
        this.timeout(timeout),
      ]);
      
      taskRecord.status = TASK_STATUS.COMPLETED;
      taskRecord.result = result;
      taskRecord.completedAt = Date.now();
      
      this.emit('task:completed', { taskId, result });
      this.logger.info('Task completed', { taskId, agent: primaryAgent.name });
      
      return result;
      
    } catch (error) {
      if (error.message === 'Task timeout') {
        taskRecord.status = TASK_STATUS.TIMEOUT;
        this.logger.warn('Task timeout', { taskId, agent: primaryAgent.name });
        
        // Mark agent as degraded
        this.updateAgentHealth(primaryAgent.name, { status: HEALTH_STATUS.DEGRADED });
      }
      
      // Retry if available
      if (taskRecord.retries < taskRecord.maxRetries) {
        taskRecord.retries++;
        const backoffMs = this.getRetryBackoff(taskRecord.retries);
        
        this.logger.debug('Retrying task', { taskId, attempt: taskRecord.retries, backoffMs });
        await new Promise(resolve => setTimeout(resolve, backoffMs));
        
        return this.executeTask(taskRecord, routingResult);
      }
      
      taskRecord.error = error.message;
      throw error;
    }
  }
  
  /**
   * Call an agent to execute a task
   * 
   * @private
   * @param {Object} agent - Agent configuration
   * @param {Object} taskRecord - Task record
   * @returns {Promise<Object>} Agent response
   */
  async callAgent(agent, taskRecord) {
    const { endpoint } = agent;
    const { id: taskId, type, payload } = taskRecord;
    
    // Increment request count
    agent.requestCount++;
    this.metrics.agentMetrics[agent.name].requests++;
    
    try {
      // In production, this would be an HTTP call to the agent endpoint
      // For now, mock the agent call
      const response = await this.invokeAgent(endpoint, {
        taskId,
        taskType: type,
        payload,
      });
      
      // Record success
      agent.successCount++;
      this.metrics.agentMetrics[agent.name].successes++;
      this.updateAgentHealth(agent.name, { 
        status: HEALTH_STATUS.HEALTHY,
        consecutiveFailures: 0,
      });
      
      return response;
      
    } catch (error) {
      // Record failure
      agent.failureCount++;
      this.metrics.agentMetrics[agent.name].failures++;
      
      const health = this.agentHealth.get(agent.name);
      const newFailures = (health.consecutiveFailures || 0) + 1;
      
      let newStatus = HEALTH_STATUS.HEALTHY;
      if (newFailures >= 3) {
        newStatus = HEALTH_STATUS.UNHEALTHY;
      } else if (newFailures >= 1) {
        newStatus = HEALTH_STATUS.DEGRADED;
      }
      
      this.updateAgentHealth(agent.name, { 
        status: newStatus,
        consecutiveFailures: newFailures,
      });
      
      throw error;
    }
  }
  
  /**
   * Invoke agent via HTTP or mock
   * 
   * @private
   * @param {string} endpoint - Agent endpoint
   * @param {Object} request - Request payload
   * @returns {Promise<Object>} Agent response
   */
  async invokeAgent(endpoint, request) {
    // Mock implementation - in production would use http client
    // This allows the supervisor to work standalone
    if (process.env.AGENT_MOCK_MODE === 'true') {
      return new Promise(resolve => {
        setImmediate(() => {
          resolve({
            success: true,
            taskId: request.taskId,
            taskType: request.taskType,
            result: request.payload,
            timestamp: Date.now(),
          });
        });
      });
    }
    
    // Real HTTP implementation would go here
    throw new Error(`Agent endpoint not available: ${endpoint}`);
  }
  
  /**
   * Promise that rejects after specified timeout
   * 
   * @private
   * @param {number} ms - Timeout in milliseconds
   * @returns {Promise<never>}
   */
  timeout(ms) {
    return new Promise((resolve, reject) => {
      setTimeout(() => reject(new Error('Task timeout')), ms);
    });
  }
  
  /**
   * Get retry backoff in milliseconds using PHI constant
   * 
   * @private
   * @param {number} attempt - Retry attempt number (1-based)
   * @returns {number} Backoff in milliseconds
   */
  getRetryBackoff(attempt) {
    if (this.phi && this.phi.phiBackoff) {
      return this.phi.phiBackoff(attempt - 1);
    }
    // Exponential backoff: 100ms, 618ms, 1000ms, 1618ms...
    return Math.pow(1.618034, attempt - 1) * 100;
  }
  
  /**
   * Submit multiple tasks in parallel and aggregate results
   * 
   * @param {Array<Object>} tasks - Array of tasks
   * @returns {Promise<Array<Object>>} Aggregated results
   */
  async submitParallelTasks(tasks) {
    if (!Array.isArray(tasks) || tasks.length === 0) {
      throw new Error('submitParallelTasks requires non-empty task array');
    }
    
    const limit = this.options.maxConcurrentTasks;
    const results = [];
    const errors = [];
    
    this.logger.info('Submitting parallel tasks', { count: tasks.length, limit });
    
    // Execute with concurrency limit
    const chunks = [];
    for (let i = 0; i < tasks.length; i += limit) {
      chunks.push(tasks.slice(i, i + limit));
    }
    
    for (const chunk of chunks) {
      const promises = chunk.map(task => 
        this.submitTask(task)
          .then(result => results.push({ taskId: task.id, result, error: null }))
          .catch(error => errors.push({ taskId: task.id, result: null, error: error.message }))
      );
      
      await Promise.all(promises);
    }
    
    this.logger.info('Parallel tasks completed', { 
      succeeded: results.length,
      failed: errors.length,
    });
    
    return { results, errors, succeeded: results.length, failed: errors.length };
  }
  
  /**
   * Check health of all agents
   * 
   * @private
   */
  async startHealthChecks() {
    this.healthCheckInterval = setInterval(() => {
      this.checkAgentHealth().catch(error => {
        this.logger.error('Health check failed', { error: error.message });
      });
    }, this.options.healthCheckInterval);
  }
  
  /**
   * Perform health checks on all agents
   * 
   * @private
   */
  async checkAgentHealth() {
    const checks = [];
    
    for (const [name, agent] of this.agents) {
      checks.push(
        this.pingAgent(agent)
          .then(healthy => {
            if (healthy) {
              this.updateAgentHealth(name, { 
                status: HEALTH_STATUS.HEALTHY,
                consecutiveFailures: 0,
              });
            } else {
              this.updateAgentHealth(name, { 
                status: HEALTH_STATUS.UNHEALTHY,
              });
            }
          })
          .catch(() => {
            const health = this.agentHealth.get(name);
            health.consecutiveFailures = (health.consecutiveFailures || 0) + 1;
            
            const newStatus = health.consecutiveFailures >= 3 
              ? HEALTH_STATUS.UNHEALTHY 
              : HEALTH_STATUS.DEGRADED;
            
            this.updateAgentHealth(name, { status: newStatus });
          })
      );
    }
    
    await Promise.allSettled(checks);
  }
  
  /**
   * Ping an agent to check health
   * 
   * @private
   * @param {Object} agent - Agent configuration
   * @returns {Promise<boolean>} True if healthy
   */
  async pingAgent(agent) {
    // Mock implementation
    const health = this.agentHealth.get(agent.name);
    return health.status === HEALTH_STATUS.HEALTHY;
  }
  
  /**
   * Update agent health status
   * 
   * @private
   * @param {string} agentName - Agent name
   * @param {Object} update - Health update (status, etc)
   */
  updateAgentHealth(agentName, update) {
    const health = this.agentHealth.get(agentName);
    Object.assign(health, update, { lastCheck: Date.now() });
  }
  
  /**
   * Check if agent is healthy enough to route tasks
   * 
   * @private
   * @param {string} agentName - Agent name
   * @returns {boolean}
   */
  isAgentHealthy(agentName) {
    const health = this.agentHealth.get(agentName);
    const agent = this.agents.get(agentName);
    
    if (!agent || !health) return false;
    
    return health.status !== HEALTH_STATUS.UNHEALTHY && 
           health.status !== HEALTH_STATUS.UNAVAILABLE;
  }
  
  /**
   * Get numeric score for health status (lower is better)
   * 
   * @private
   * @param {string} status - Health status
   * @returns {number}
   */
  getHealthScore(status) {
    const scores = {
      [HEALTH_STATUS.HEALTHY]: 0,
      [HEALTH_STATUS.DEGRADED]: 1,
      [HEALTH_STATUS.UNHEALTHY]: 2,
      [HEALTH_STATUS.UNAVAILABLE]: 3,
    };
    return scores[status] || 999;
  }
  
  /**
   * Record successful task completion
   * 
   * @private
   * @param {string} taskId - Task ID
   * @param {number} startTime - Task start time
   */
  recordTaskSuccess(taskId, startTime) {
    const latency = Date.now() - startTime;
    this.metrics.tasksProcessed++;
    this.metrics.tasksSucceeded++;
    this.metrics.totalLatency += latency;
  }
  
  /**
   * Record failed task
   * 
   * @private
   * @param {string} taskId - Task ID
   * @param {number} startTime - Task start time
   * @param {Error} error - Error object
   */
  recordTaskFailure(taskId, startTime, error) {
    const latency = Date.now() - startTime;
    this.metrics.tasksProcessed++;
    this.metrics.tasksFailed++;
    this.metrics.totalLatency += latency;
  }
  
  /**
   * Get current metrics
   * 
   * @returns {Object} Current metrics snapshot
   */
  getMetrics() {
    return {
      ...this.metrics,
      avgLatency: this.metrics.tasksProcessed > 0 
        ? this.metrics.totalLatency / this.metrics.tasksProcessed 
        : 0,
      successRate: this.metrics.tasksProcessed > 0 
        ? (this.metrics.tasksSucceeded / this.metrics.tasksProcessed) * 100 
        : 0,
      activeTasks: this.activeTasks.size,
      queuedTasks: this.taskQueue.length,
    };
  }
  
  /**
   * Get status of all agents
   * 
   * @returns {Object} Agent status map
   */
  getAgentStatus() {
    const status = {};
    
    for (const [name, agent] of this.agents) {
      const health = this.agentHealth.get(name);
      status[name] = {
        name,
        role: agent.role,
        health: health.status,
        requests: agent.requestCount,
        successes: agent.successCount,
        failures: agent.failureCount,
        successRate: agent.requestCount > 0 
          ? (agent.successCount / agent.requestCount) * 100 
          : 0,
      };
    }
    
    return status;
  }
  
  /**
   * Get status of a specific task
   * 
   * @param {string} taskId - Task ID
   * @returns {Object|null} Task status or null if not found
   */
  getTaskStatus(taskId) {
    const task = this.activeTasks.get(taskId);
    return task || null;
  }
  
  /**
   * Get all agent configurations
   * 
   * @returns {Object} Agent catalog
   */
  getAgentCatalog() {
    return Object.entries(this.agents).reduce((acc, [name, agent]) => {
      acc[name] = {
        name: agent.name,
        role: agent.role,
        skills: agent.skills,
        criticality: agent.criticality,
        timeout: agent.timeout,
      };
      return acc;
    }, {});
  }
  
  /**
   * Clean up resources
   */
  shutdown() {
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
    }
    
    this.logger.info('HCSupervisor shutdown', { 
      activeTasksCount: this.activeTasks.size,
    });
    
    this.removeAllListeners();
  }
}

// ─── EXPORTS ──────────────────────────────────────────────────────────────
module.exports = {
  HCSupervisor,
  TASK_STATUS,
  ROUTING_STRATEGY,
  HEALTH_STATUS,
  AGENT_CATALOG,
};

// Default export
module.exports.default = HCSupervisor;
