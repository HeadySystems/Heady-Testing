module.exports = {
  apps: [
    {
      name: "heady-vault",
      script: "./src/app.js",
      instances: 1,
      exec_mode: "fork",
      autorestart: true,
      watch: false,
      max_memory_restart: "1G",
      env: {
        NODE_ENV: "development",
        PORT: 3347,
        SACRED_NODE: "VAULT"
      },
      env_production: {
        NODE_ENV: "production",
        PORT: 3347,
        SACRED_NODE: "VAULT"
      }
    }
  ]
};
