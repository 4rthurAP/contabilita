import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { tenantContext } from './tenant.context';

/**
 * Middleware que extrai o tenantId do header X-Tenant-Id e
 * propaga via AsyncLocalStorage para toda a request chain.
 */
@Injectable()
export class TenantMiddleware implements NestMiddleware {
  use(req: Request, _res: Response, next: NextFunction) {
    const tenantId = req.headers['x-tenant-id'] as string;
    const user = (req as any).user;

    if (tenantId) {
      tenantContext.run(
        {
          tenantId,
          userId: user?.id || user?._id || '',
          role: '', // Populated by TenantGuard after role lookup
        },
        () => next(),
      );
    } else {
      next();
    }
  }
}
