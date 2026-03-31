const PHI = 1.618033988749895;
const PSI = 0.618033988749895;

const OAUTH_PROVIDERS = {
    google: {
        authorization_endpoint: 'https://accounts.google.com/o/oauth2/v2/auth',
        token_endpoint: 'https://oauth2.googleapis.com/token',
        revocation_endpoint: 'https://oauth2.googleapis.com/revoke',
        scopes: ['openid', 'email', 'profile', 'https://www.googleapis.com/auth/drive.readonly'],
        grant_types: ['authorization_code', 'refresh_token'],
        pkce_required: true,
        token_lifetime_s: 3600,
        refresh_threshold_ratio: PSI * PSI, // 0.382 — refresh when 38.2% TTL remains
    },
    github: {
        authorization_endpoint: 'https://github.com/login/oauth/authorize',
        token_endpoint: 'https://github.com/login/oauth/access_token',
        revocation_endpoint: null,
        scopes: ['repo', 'read:org', 'workflow'],
        grant_types: ['authorization_code'],
        pkce_required: true,
        token_lifetime_s: null, // Non-expiring — rotation via VaultAPITokenBee on fib(8)=21 day cycle
        refresh_threshold_ratio: null,
    },
    slack: {
        authorization_endpoint: 'https://slack.com/oauth/v2/authorize',
        token_endpoint: 'https://slack.com/api/oauth.v2.access',
        revocation_endpoint: 'https://slack.com/api/auth.revoke',
        scopes: ['channels:read', 'chat:write', 'users:read'],
        grant_types: ['authorization_code'],
        pkce_required: false,
        token_lifetime_s: null,
        refresh_threshold_ratio: null,
    },
    linear: {
        authorization_endpoint: 'https://linear.app/oauth/authorize',
        token_endpoint: 'https://api.linear.app/oauth/token',
        revocation_endpoint: 'https://api.linear.app/oauth/revoke',
        scopes: ['read', 'write', 'issues:create'],
        grant_types: ['authorization_code', 'refresh_token'],
        pkce_required: true,
        token_lifetime_s: 36000,
        refresh_threshold_ratio: PSI,
    },
    huggingface: {
        authorization_endpoint: 'https://huggingface.co/oauth/authorize',
        token_endpoint: 'https://huggingface.co/oauth/token',
        revocation_endpoint: null,
        scopes: ['read-repos', 'manage-repos', 'inference-api'],
        grant_types: ['authorization_code', 'refresh_token'],
        pkce_required: true,
        token_lifetime_s: 3600,
        refresh_threshold_ratio: PSI * PSI,
    }
};

module.exports = OAUTH_PROVIDERS;
