import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    environment: 'node',
    globals:     true,
    include:     ['src/__tests__/**/*.test.js'],
    hookTimeout: 30000,
    testTimeout: 30000,
    pool:        'forks',
    poolOptions: {
      forks: { isolate: true },
    },
    reporters: ['verbose'],
    // Override NODE_ENV and use a separate test DB
    // JWT_SECRET must match the .env value so tokens verify correctly
    env: {
      NODE_ENV:             'test',
      MONGO_URI:            'mongodb://pavantejareddy6_db_user:pavan123@ac-apfgwrb-shard-00-00.tdpyl1h.mongodb.net:27017,ac-apfgwrb-shard-00-01.tdpyl1h.mongodb.net:27017,ac-apfgwrb-shard-00-02.tdpyl1h.mongodb.net:27017/kanban_test?ssl=true&replicaSet=atlas-x5oxjz-shard-0&authSource=admin&appName=job-market',
      JWT_SECRET:           'dev_only_secret_replace_before_production',
      JWT_EXPIRES_IN:       '1h',
      CLIENT_ORIGIN:        'http://localhost:5173',
      PORT:                 '5001',
      RATE_LIMIT_WINDOW_MS: '900000',
      RATE_LIMIT_MAX:       '1000',
    },
  },
})
