import {
  registerDecorator,
  ValidationOptions,
  ValidatorConstraint,
  ValidatorConstraintInterface,
  ValidationArguments,
} from 'class-validator';

/**
 * 手机号验证器
 */
@ValidatorConstraint({ name: 'IsPhone', async: false })
export class IsPhoneConstraint implements ValidatorConstraintInterface {
  validate(value: any, args: ValidationArguments): boolean {
    if (!value) {
      return true; // 如果是可选的，空值应该通过
    }

    // 中国大陆手机号正则
    const phoneRegex = /^1[3-9]\d{9}$/;
    return phoneRegex.test(value);
  }

  defaultMessage(args: ValidationArguments): string {
    return '手机号码格式不正确';
  }
}

/**
 * 手机号验证装饰器
 * @param validationOptions 验证配置
 */
export function IsPhone(validationOptions?: ValidationOptions) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      constraints: [],
      validator: IsPhoneConstraint,
    });
  };
}

