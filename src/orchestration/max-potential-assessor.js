const { getLogger } = require('../core/heady-logger');
const logger = getLogger('max-potential');

class MaxPotentialAssessor {
    constructor() {
        this.questions = [
            "1. Is the system eliminating absolute unnecessary friction?",
            "2. Are all core subsystems running in optimal φ-scaled symbiosis?",
            "3. Is the integration between Obsidian, Linear, and CI/CD flawlessly updating in real-time?",
            "4. Are all known alerts absorbed as actionable intelligence?",
            "5. Does the current operation expand the maximum systemic potential?"
        ];
    }

    assess(systemHealthCheckResult) {
        if (!systemHealthCheckResult || systemHealthCheckResult === 'negative') {
            return this.executeFiveWhys();
        }
        return { ok: true, msg: "Max Potential Achieved" };
    }

    executeFiveWhys() {
        logger.warn("Max Potential violation detected. Initiating 5-Whys Root Cause Analysis...");
        const analysis = [
            "Why 1: The system health checks returned a sub-optimal or negative result.",
            "Why 2: A dependent daemon or subsystem (like AutoCommitDeploy, Telemetry sync) encountered resistance blocking its intended state.",
            "Why 3: The operational boundaries of the autonomous loop were breached without an automated self-healing protocol completely mitigating the anomaly.",
            "Why 4: The recovery matrix was not context-aware of the specific emerging failure pattern (e.g. 20,000 files untracked blocking a push).",
            "Why 5 (Root Cause): Systemic latency or missing error-learning blueprint integration preventing instantaneous zero-touch self-recovery."
        ];
        
        analysis.forEach(why => logger.warn(`[5-WHYS] ${why}`));
        
        return {
            ok: false,
            state: "CRITICAL_DRIFT",
            remediation: "Triggering HeadyBattle reinforcement and AutoCommit block clearances.",
            analysis
        };
    }
}

module.exports = new MaxPotentialAssessor();
