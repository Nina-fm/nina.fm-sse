// eslint-disable-next-line no-undef
module.exports = {
  apps: [
    {
      name: 'nina-sse',
      port: '3001',
      exec_mode: 'cluster',
      instances: 'max',
      script: './build/server.js',
    },
  ],
};
