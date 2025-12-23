import {
  registerDecorator,
  ValidationOptions,
  ValidatorConstraint,
  ValidatorConstraintInterface,
  ValidationArguments,
} from 'class-validator';
import { Injectable } from '@nestjs/common';

/**
 * 数据库唯一性验证器接口
 */
export interface UniqueValidationArguments {
  repository: any; // Repository实例
  method: string; // 查询方法名
  field?: string; // 字段名（如果不同于属性名）
}

/**
 * 数据库唯一性验证器
 * 用于验证数据库字段是否唯一
 */
@ValidatorConstraint({ name: 'IsUnique', async: true })
@Injectable()
export class IsUniqueConstraint implements ValidatorConstraintInterface {
  async validate(value: any, args: ValidationArguments): Promise<boolean> {
    const [options] = args.constraints as [UniqueValidationArguments];
    
    if (!value || !options || !options.repository || !options.method) {
      return true;
    }

    try {
      const field = options.field || args.property;
      const result = await options.repository[options.method](value);
      
      // 如果查询不到记录，说明是唯一的
      return !result;
    } catch (error) {
      console.error('唯一性验证失败:', error);
      return true; // 验证失败时返回true，避免阻塞业务
    }
  }

  defaultMessage(args: ValidationArguments): string {
    return `${args.property} already exists`;
  }
}

/**
 * 唯一性验证装饰器
 * @param options 验证选项
 * @param validationOptions 验证配置
 */
export function IsUnique(
  options: UniqueValidationArguments,
  validationOptions?: ValidationOptions,
) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      constraints: [options],
      validator: IsUniqueConstraint,
    });
  };
}

