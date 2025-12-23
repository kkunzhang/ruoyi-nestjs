import {
  registerDecorator,
  ValidationOptions,
  ValidatorConstraint,
  ValidatorConstraintInterface,
  ValidationArguments,
} from 'class-validator';

/**
 * 身份证号验证器
 */
@ValidatorConstraint({ name: 'IsIdCard', async: false })
export class IsIdCardConstraint implements ValidatorConstraintInterface {
  validate(value: any, args: ValidationArguments): boolean {
    if (!value) {
      return true;
    }

    // 18位身份证号正则
    const idCardRegex = /^[1-9]\d{5}(18|19|20)\d{2}((0[1-9])|(1[0-2]))(([0-2][1-9])|10|20|30|31)\d{3}[0-9Xx]$/;
    
    if (!idCardRegex.test(value)) {
      return false;
    }

    // 验证校验码
    return this.validateCheckCode(value);
  }

  /**
   * 验证身份证校验码
   */
  private validateCheckCode(idCard: string): boolean {
    const weights = [7, 9, 10, 5, 8, 4, 2, 1, 6, 3, 7, 9, 10, 5, 8, 4, 2];
    const checkCodes = ['1', '0', 'X', '9', '8', '7', '6', '5', '4', '3', '2'];
    
    let sum = 0;
    for (let i = 0; i < 17; i++) {
      sum += parseInt(idCard[i]) * weights[i];
    }
    
    const checkCode = checkCodes[sum % 11];
    return idCard[17].toUpperCase() === checkCode;
  }

  defaultMessage(args: ValidationArguments): string {
    return '身份证号码格式不正确';
  }
}

/**
 * 身份证号验证装饰器
 * @param validationOptions 验证配置
 */
export function IsIdCard(validationOptions?: ValidationOptions) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      constraints: [],
      validator: IsIdCardConstraint,
    });
  };
}

