// Taxonomy mapping every credential type to its distinct lifecycle properties
// Sourced from Heady architectural manifesto

const CREDENTIAL_CLASSES = {
    oauth2: {
        description: "OAuth 2.0 access + refresh tokens for external services",
        providers: ['google', 'github', 'slack', 'notion', 'linear', 'discord', 'huggingface'],
        storage: ['gcp-secret-manager', 'redis-t0'],
        bee: 'VaultOAuthBee'
    },
    ssh: {
        description: "SSH deploy keys, user keys, host keys",
        key_types: ['ed25519', 'ecdsa-p384'],
        storage: ['gcp-secret-manager', 'cloudflare-kv'],
        bee: 'VaultSSHBee'
    },
    gpg: {
        description: "GPG signing keys for commits, artifacts, audit logs",
        key_types: ['ed25519-sign', 'rsa4096-legacy'],
        storage: ['gcp-secret-manager', 'keyserver'],
        bee: 'VaultGPGBee'
    },
    api_token: {
        description: "API keys for external services",
        storage: ['gcp-secret-manager', 'cloudflare-workers'],
        bee: 'VaultAPITokenBee'
    },
    jwt: {
        description: "Inter-service JWTs, user session tokens, delegation tokens",
        algorithm: 'RS256',
        storage: ['gcp-secret-manager', 'cloudflare-kv'],
        bee: 'VaultJWTBee'
    },
    internal: {
        description: "Core environment secrets (INTERNAL_NODE_SECRET, etc)",
        storage: ['gcp-secret-manager'],
        bee: 'VaultInternalBee'
    },
    pqc: {
        description: "Post-quantum cryptographic keys",
        storage: ['gcp-secret-manager'],
        bee: 'VaultPQCBee'
    },
    firebase: {
        description: "Firebase Admin SDK keys",
        storage: ['gcp-secret-manager'],
        bee: 'VaultFirebaseBee'
    }
};

module.exports = {
    CREDENTIAL_CLASSES
};
