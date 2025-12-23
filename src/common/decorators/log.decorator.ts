import { SetMetadata } from '@nestjs/common';

/**
 * 操作日志装饰器
 * 对应 Java 的 @Log
 */
export const LOG_METADATA_KEY = 'log';

export interface LogMetadata {
  title: string; // 模块标题
  businessType: BusinessType; // 业务类型
  isSaveRequestData?: boolean; // 是否保存请求参数
  isSaveResponseData?: boolean; // 是否保存响应数据
}

export enum BusinessType {
  OTHER = 0, // 其他
  INSERT = 1, // 新增
  UPDATE = 2, // 修改
  DELETE = 3, // 删除
  GRANT = 4, // 授权
  EXPORT = 5, // 导出
  IMPORT = 6, // 导入
  FORCE = 7, // 强退
  GENCODE = 8, // 生成代码
  CLEAN = 9, // 清空数据
}

export const Log = (metadata: LogMetadata) =>
  SetMetadata(LOG_METADATA_KEY, metadata);

