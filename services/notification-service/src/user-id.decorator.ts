import { createParamDecorator, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { Request } from 'express';

export const UserId = createParamDecorator((_: unknown, ctx: ExecutionContext): string => {
  const userId = ctx.switchToHttp().getRequest<Request>().headers['x-user-id'];
  if (typeof userId !== 'string' || !userId) throw new UnauthorizedException();
  return userId;
});
