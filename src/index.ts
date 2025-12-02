import app from './app';
import config from './config';
import logger from './utils/logger';

const port = config.PORT || 3000;
const host = (config as any).HOST || '127.0.0.1';

app.listen(port, host, () => {
  logger.info(`Server running on ${host}:${port}`);
});
