import { createServer, Server } from 'http';
import { register } from 'prom-client';
import { CustomLoggerService } from '../../logger/logger.service';

/**
 * Starts a standalone HTTP server that exposes Prometheus metrics on a
 * dedicated internal port (default 9100). This server is intentionally NOT
 * part of the main NestJS HTTP app: keeping it on its own port means the
 * `/metrics` surface can stay unpublished (reachable only on the internal
 * Docker network) while the public `:3000` API never exposes metrics.
 *
 * It reads the same process-global prom-client `register` that
 * PrometheusService / PrometheusInterceptor populate, so there is no metric
 * duplication.
 */
export function startMetricsServer(logger: CustomLoggerService): Server {
  const port = Number(process.env.METRICS_PORT ?? 9100);

  const server = createServer((req, res) => {
    if (req.method !== 'GET' || req.url !== '/metrics') {
      res.statusCode = 404;
      res.end('Not Found');
      return;
    }

    logger.log(`Metrics accessed by ${req.socket.remoteAddress}`);

    register
      .metrics()
      .then((metrics) => {
        res.statusCode = 200;
        res.setHeader('Content-Type', register.contentType);
        res.setHeader(
          'Cache-Control',
          'no-store, no-cache, must-revalidate, proxy-revalidate',
        );
        res.setHeader('Pragma', 'no-cache');
        res.setHeader('Expires', '0');
        res.setHeader('Surrogate-Control', 'no-store');
        res.end(metrics);
      })
      .catch((err: unknown) => {
        logger.error(`Failed to collect metrics: ${String(err)}`);
        res.statusCode = 500;
        res.end('Internal Server Error');
      });
  });

  server.listen(port, '0.0.0.0', () => {
    logger.log(`Metrics server listening on port ${port}`);
  });

  return server;
}
