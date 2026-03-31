const express = require('express');
const crypto = require('crypto');
const OAUTH_PROVIDERS = require('../providers/oauth-registry');
const { addSecretVersion, createSecret } = require('../backends/gcp-secrets');

const router = express.Router();

// Helper: PKCE code_challenge derivation
function base64URLEncode(str) {
    return str.toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
}

function sha256(buffer) {
    return crypto.createHash('sha256').update(buffer).digest();
}

/**
 * Initiates the OAuth 2.0 flow
 */
router.get('/authorize/:provider', (req, res) => {
    const { provider } = req.params;
    const config = OAUTH_PROVIDERS[provider];
    
    if (!config) {
        return res.status(400).json({ error: 'unsupported_provider' });
    }

    // Generate state and PKCE buffers
    const state = base64URLEncode(crypto.randomBytes(32));
    const code_verifier = base64URLEncode(crypto.randomBytes(32));
    const code_challenge = base64URLEncode(sha256(code_verifier));

    // TODO: Connect to Redis caching for `state` + `code_verifier`
    // redis.setex(`oauth:state:${state}`, 300, JSON.stringify({ provider, code_verifier }));

    const params = new URLSearchParams({
        client_id: process.env[`OAUTH_${provider.toUpperCase()}_CLIENT_ID`],
        redirect_uri: `https://auth.headysystems.com/callback/${provider}`,
        response_type: 'code',
        scope: config.scopes.join(' '),
        state,
    });

    if (config.pkce_required) {
        params.append('code_challenge', code_challenge);
        params.append('code_challenge_method', 'S256');
    }

    const authUrl = `${config.authorization_endpoint}?${params.toString()}`;
    res.redirect(authUrl);
});

/**
 * Callback consumer to exchange authorization code for tokens
 */
router.get('/callback/:provider', async (req, res) => {
    const { provider } = req.params;
    const { code, state, error } = req.query;

    if (error) {
        return res.status(400).json({ error: 'auth_rejected', details: error });
    }

    const config = OAUTH_PROVIDERS[provider];
    
    // TODO: Verify state against Redis to defend against CSRF, fetch original code_verifier
    // const storedData = await redis.get(`oauth:state:${state}`);
    const code_verifier = "simulated_verifier_fetched_from_redis";
    const redirect_uri = `https://auth.headysystems.com/callback/${provider}`;

    try {
        const tokenParams = new URLSearchParams({
            client_id: process.env[`OAUTH_${provider.toUpperCase()}_CLIENT_ID`],
            client_secret: process.env[`OAUTH_${provider.toUpperCase()}_CLIENT_SECRET`],
            code,
            grant_type: 'authorization_code',
            redirect_uri
        });

        if (config.pkce_required) {
            tokenParams.append('code_verifier', code_verifier);
        }

        const response = await fetch(config.token_endpoint, {
            method: 'POST',
            body: tokenParams.toString(),
            headers: { 'Content-Type': 'application/x-www-form-urlencoded', 'Accept': 'application/json' }
        });

        const tokens = await response.json();

        // Standardize output payload to Vault backend logic
        const payloadData = {
            access_token: tokens.access_token,
            refresh_token: tokens.refresh_token,
            expires_in: tokens.expires_in,
            timestamp: Date.now()
        };

        // Emit to GCP Secret Manager
        const secretName = `oauth_${provider}_token`;
        try {
            await addSecretVersion(process.env.GCP_PROJECT_ID, secretName, JSON.stringify(payloadData));
        } catch(e) {
            // Assume secret does not exist, create it then write.
            await createSecret(process.env.GCP_PROJECT_ID, secretName);
            await addSecretVersion(process.env.GCP_PROJECT_ID, secretName, JSON.stringify(payloadData));
        }

        // Cache into Redis T0 Memory 
        // TODO: pubsub emit 'heady:vault:oauth:granted' 
        
        res.json({ success: true, message: `Vault acquired tokens for ${provider}.` });
    } catch (err) {
        console.error(`[Vault:OAuth] Call failed`, err);
        res.status(500).json({ error: 'token_exchange_failed' });
    }
});

module.exports = router;
