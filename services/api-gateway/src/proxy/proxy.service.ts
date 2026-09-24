import { Injectable } from '@nestjs/common';
import { createProxyMiddleware, fixRequestBody, Options } from 'http-proxy-middleware';

@Injectable()
export class ProxyService {
  private authTarget = process.env.AUTH_SERVICE_URL || 'http://localhost:4001';
  private userTarget = process.env.USER_SERVICE_URL || 'http://localhost:4002';
  private postTarget = process.env.POST_SERVICE_URL || 'http://localhost:4003';
  private feedTarget = process.env.FEED_SERVICE_URL || 'http://localhost:4004';
  private notificationTarget = process.env.NOTIFICATION_SERVICE_URL || 'http://localhost:4005';

  private createProxy(target: string, prefix: string, serviceName: string) {
    return createProxyMiddleware({
      target,
      changeOrigin: true,
      pathRewrite: (path: string, req: any) => {
        const urlToUse = path || (req.url as string) || '/';
        const cleanPath = urlToUse.replace(/^\/api/, '');
        if (cleanPath.startsWith(`/${prefix}`)) {
          return cleanPath;
        }
        return `/${prefix}${cleanPath.startsWith('/') ? cleanPath : '/' + cleanPath}`;
      },
      on: {
        proxyReq: (proxyReq, req: any) => {
          if (req.headers['x-user-id']) {
            proxyReq.setHeader('x-user-id', req.headers['x-user-id']);
          }
          if (req.headers['x-user-email']) {
            proxyReq.setHeader('x-user-email', req.headers['x-user-email']);
          }
          if (req.headers['x-request-id']) {
            proxyReq.setHeader('x-request-id', req.headers['x-request-id']);
          }
          fixRequestBody(proxyReq, req);
        },
        error: (err, req, res: any) => {
          console.error(`[${serviceName} Proxy Error]`, err.message);
          if (res && !res.headersSent && typeof res.writeHead === 'function') {
            res.writeHead(502, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({
              success: false,
              message: `${serviceName} service unavailable`,
              error: err.message,
            }));
          }
        },
      },
    });
  }

  createAuthProxy() {
    return this.createProxy(this.authTarget, 'auth', 'auth');
  }

  createUserProxy() {
    return this.createProxy(this.userTarget, 'users', 'user');
  }

  createPostProxy() {
    return this.createProxy(this.postTarget, 'posts', 'post');
  }

  createFeedProxy() {
    return this.createProxy(this.feedTarget, 'feed', 'feed');
  }

  createNotificationProxy() {
    return this.createProxy(this.notificationTarget, 'notifications', 'notification');
  }
}
