const VaultOAuthBee = require('./VaultOAuthBee');
const VaultAPITokenBee = require('./VaultAPITokenBee');
const VaultInternalBee = require('./VaultInternalBee');
const VaultScannerBee = require('./VaultScannerBee');
const VaultAuditBee = require('./VaultAuditBee');

class VaultSwarm {
    constructor(redisClient, gcpClient) {
        this.swarm_id = 18;
        this.name = 'VaultSwarm';
        this.sacred_geometry_node = 'VAULT';
        this.max_concurrent_bees = 21; // fib(8)
        this.heartbeat_interval_ms = 5500; // fib(10) * 100

        this.bees = {
            oauth: new VaultOAuthBee(redisClient, gcpClient),
            apiToken: new VaultAPITokenBee(redisClient, gcpClient),
            internal: new VaultInternalBee(gcpClient),
            scanner: new VaultScannerBee(),
            audit: new VaultAuditBee(gcpClient)
        };

        
        this.activeBees = 0;
        this.interval = null;
    }

    start() {
        console.log(`[Swarm18] Initializing VaultSwarm Hive...`);
        this.interval = setInterval(() => this.heartbeat(), this.heartbeat_interval_ms);
        console.log(`[Swarm18] VaultSwarm Beating at φ-interval: ${this.heartbeat_interval_ms}ms`);
    }

    stop() {
        if (this.interval) clearInterval(this.interval);
        console.log(`[Swarm18] VaultSwarm Terminated.`);
    }

    async heartbeat() {
        try {
            // Pulse the bees to check for credential maintenance routines
            await this.bees.oauth.heartbeat();
        } catch (e) {
            console.error(`[Swarm18] Heartbeat fault:`, e.message);
        }
    }
}

module.exports = VaultSwarm;
