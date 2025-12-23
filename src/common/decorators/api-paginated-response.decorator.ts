import { applyDecorators, Type } from '@nestjs/common';
import { ApiOkResponse, getSchemaPath } from '@nestjs/swagger';
import { PageResultDto } from '../pagination/dto/page-result.dto';

/**
 * Swagger 分页响应装饰器
 */
export const ApiPaginatedResponse = <TModel extends Type<any>>(
  model: TModel,
) => {
  return applyDecorators(
    ApiOkResponse({
      schema: {
        allOf: [
          { $ref: getSchemaPath(PageResultDto) },
          {
            properties: {
              rows: {
                type: 'array',
                items: { $ref: getSchemaPath(model) },
              },
            },
          },
        ],
      },
    }),
  );
};



