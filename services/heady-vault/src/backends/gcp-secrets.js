const { SecretManagerServiceClient } = require('@google-cloud/secret-manager');

// Initialize client
// Note: Assumes GOOGLE_APPLICATION_CREDENTIALS or attached service account
const client = new SecretManagerServiceClient();

async function getSecret(projectId, secretName, version = 'latest') {
    const name = `projects/${projectId}/secrets/${secretName}/versions/${version}`;
    try {
        const [versionObj] = await client.accessSecretVersion({ name });
        const payload = versionObj.payload.data.toString('utf8');
        return payload;
    } catch (err) {
        console.error(`[VaultBackend:GCP] Failed to access secret ${secretName}:`, err.message);
        throw err;
    }
}

async function createSecret(projectId, secretName) {
    const parent = `projects/${projectId}`;
    try {
        const [secret] = await client.createSecret({
            parent,
            secretId: secretName,
            secret: {
                replication: {
                    automatic: {},
                },
            },
        });
        return secret;
    } catch (err) {
        console.error(`[VaultBackend:GCP] Failed to create secret ${secretName}:`, err.message);
        throw err;
    }
}

async function addSecretVersion(projectId, secretName, payloadString) {
    const parent = `projects/${projectId}/secrets/${secretName}`;
    try {
        const [version] = await client.addSecretVersion({
            parent,
            payload: {
                data: Buffer.from(payloadString, 'utf8'),
            },
        });
        return version;
    } catch (err) {
        console.error(`[VaultBackend:GCP] Failed to add version to ${secretName}:`, err.message);
        throw err;
    }
}

module.exports = {
    client,
    getSecret,
    createSecret,
    addSecretVersion
};
