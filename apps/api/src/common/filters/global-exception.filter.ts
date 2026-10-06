import { ExceptionFilter, Catch, ArgumentsHost, HttpException, HttpStatus, Logger } from '@nestjs/common';
import { Request, Response } from 'express';

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(GlobalExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();
    
    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message: any = 'Internal server error';

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      message = exception.getResponse();
    } else if (exception && typeof (exception as any).status === 'number') {
      // Handle raw Express errors like PayloadTooLargeError
      status = (exception as any).status;
      message = (exception as any).message || 'Internal server error';
    }

    // Log the error but without stack traces in production (handled by logger config usually, but we strip it here)
    if (status >= 500) {
      this.logger.error(`[${request.method}] ${request.url} - ${exception instanceof Error ? exception.message : String(exception)}`);
    }

    const errorResponse = {
      statusCode: status,
      timestamp: new Date().toISOString(),
      path: request.url,
      message: typeof message === 'string' ? message : (message as any).message || message,
    };

    response.status(status).json(errorResponse);
  }
}
