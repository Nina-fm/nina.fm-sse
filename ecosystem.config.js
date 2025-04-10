module.exports = [
  {
    name: 'Nina SSE',
    port: '3001',
    exec_mode: 'cluster',
    instances: 'max',
    script: 'build/server.js',
  },
];
