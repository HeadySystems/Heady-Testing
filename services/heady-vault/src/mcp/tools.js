const VAULT_TOOLS = [
    {
      name: 'heady_vault_get',
      description: 'Retrieve a credential from HeadyVault. Returns the current active credential for the specified class and identifier. Requires mTLS authentication.',
      inputSchema: {
        type: 'object',
        properties: {
          class: { type: 'string', enum: ['oauth2', 'ssh', 'gpg', 'api_token', 'jwt', 'internal', 'firebase', 'pqc'] },
          identifier: { type: 'string', description: 'Provider name, service name, or key ID' },
          user_id: { type: 'string', description: 'User ID for user-scoped credentials (oauth2, ssh)' },
        },
        required: ['class', 'identifier'],
      },
    },
    {
      name: 'heady_vault_rotate',
      description: 'Trigger immediate rotation of a specific credential. Initiates dual-active key window.',
      inputSchema: {
        type: 'object',
        properties: {
          class: { type: 'string', enum: ['oauth2', 'ssh', 'gpg', 'api_token', 'jwt', 'internal', 'firebase', 'pqc'] },
          identifier: { type: 'string' },
          reason: { type: 'string', enum: ['scheduled', 'compromised', 'expired', 'policy', 'manual'] },
        },
        required: ['class', 'identifier', 'reason'],
      },
    },
    {
      name: 'heady_vault_provision',
      description: 'Provision a new credential. Initiates authorization flow, generates key pair, or creates via API.',
      inputSchema: {
        type: 'object',
        properties: {
          class: { type: 'string', enum: ['oauth2', 'ssh', 'gpg', 'api_token', 'jwt', 'internal', 'pqc'] },
          provider: { type: 'string' },
          scopes: { type: 'array', items: { type: 'string' } },
          ttl_hours: { type: 'integer', description: 'Override default TTL (must be Fibonacci number)' },
        },
        required: ['class', 'provider'],
      },
    },
    {
      name: 'heady_vault_revoke',
      description: 'Immediately revoke a credential. Purges from all caches, calls provider revocation endpoint, updates audit log.',
      inputSchema: {
        type: 'object',
        properties: {
          class: { type: 'string', enum: ['oauth2', 'ssh', 'gpg', 'api_token', 'jwt', 'internal', 'firebase', 'pqc'] },
          identifier: { type: 'string' },
          reason: { type: 'string' },
        },
        required: ['class', 'identifier', 'reason'],
      },
    },
    {
      name: 'heady_vault_audit',
      description: 'Query the credential audit log. Filterable by class, identifier, operation, and time range.',
      inputSchema: {
        type: 'object',
        properties: {
          class: { type: 'string' },
          identifier: { type: 'string' },
          operation: { type: 'string', enum: ['provision', 'rotate', 'revoke', 'access', 'refresh', 'scan'] },
          since_hours: { type: 'integer', default: 24 },
        },
      },
    },
    {
      name: 'heady_vault_status',
      description: 'Get credential health status — expiring credentials, rotation queue depth, scan results, compliance posture.',
      inputSchema: {
        type: 'object',
        properties: {
          class: { type: 'string', description: 'Filter by credential class, or omit for all' },
          include_rotation_queue: { type: 'boolean', default: true },
          include_compliance: { type: 'boolean', default: true },
        },
      },
    }
  ];

  module.exports = { VAULT_TOOLS };
