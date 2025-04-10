import dotenv from 'dotenv';

dotenv.config();

const serverConfig: ServerConfig = {
  port: process.env.PORT || 3000,
  refreshInterval: 3000, // 3 seconds
  headers: {
    'Content-Type': 'text/event-stream',
    Connection: 'keep-alive',
    'Cache-Control': 'no-cache',
    'X-Accel-Buffering': 'no',
  },
};

export default serverConfig;
