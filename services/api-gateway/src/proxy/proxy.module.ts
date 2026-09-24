import { Module, NestModule, MiddlewareConsumer } from '@nestjs/common';
import { ProxyService } from './proxy.service';

@Module({
  providers: [ProxyService],
  exports: [ProxyService],
})
export class ProxyModule implements NestModule {
  constructor(private proxyService: ProxyService) {}

  configure(consumer: MiddlewareConsumer) {
    consumer.apply(this.proxyService.createAuthProxy()).forRoutes('/api/auth', '/auth');
    consumer.apply(this.proxyService.createUserProxy()).forRoutes('/api/users', '/users');
    consumer.apply(this.proxyService.createPostProxy()).forRoutes('/api/posts', '/posts');
    consumer.apply(this.proxyService.createFeedProxy()).forRoutes('/api/feed', '/feed');
    consumer.apply(this.proxyService.createNotificationProxy()).forRoutes(
      '/api/notifications', '/notifications',
      '/api/messages', '/messages',
      '/api/stories', '/stories',
    );
  }
}
