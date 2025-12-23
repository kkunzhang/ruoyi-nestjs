import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

/**
 * 操作日志实体
 * 对应 Java 的 SysOperLog
 */
@Entity('sys_oper_log')
export class SysOperLog {
  @PrimaryGeneratedColumn({ name: 'oper_id', comment: '日志主键' })
  operId: number;

  @Column({ name: 'title', length: 50, default: '', comment: '模块标题' })
  title: string;

  @Column({ name: 'business_type', type: 'int', default: 0, comment: '业务类型（0其它 1新增 2修改 3删除）' })
  businessType: number;

  @Column({ name: 'method', length: 100, default: '', comment: '方法名称' })
  method: string;

  @Column({ name: 'request_method', length: 10, default: '', comment: '请求方式' })
  requestMethod: string;

  @Column({ name: 'operator_type', type: 'int', default: 0, comment: '操作类别（0其它 1后台用户 2手机端用户）' })
  operatorType: number;

  @Column({ name: 'oper_name', length: 50, default: '', comment: '操作人员' })
  operName: string;

  @Column({ name: 'dept_name', length: 50, nullable: true, comment: '部门名称' })
  deptName?: string;

  @Column({ name: 'oper_url', length: 255, default: '', comment: '请求URL' })
  operUrl: string;

  @Column({ name: 'oper_ip', length: 128, default: '', comment: '主机地址' })
  operIp: string;

  @Column({ name: 'oper_location', length: 255, default: '', comment: '操作地点' })
  operLocation: string;

  @Column({ name: 'oper_param', type: 'text', nullable: true, comment: '请求参数' })
  operParam?: string;

  @Column({ name: 'json_result', type: 'text', nullable: true, comment: '返回参数' })
  jsonResult?: string;

  @Column({ name: 'status', type: 'int', default: 0, comment: '操作状态（0正常 1异常）' })
  status: number;

  @Column({ name: 'error_msg', type: 'text', nullable: true, comment: '错误消息' })
  errorMsg?: string;

  @Column({ name: 'cost_time', type: 'bigint', default: 0, comment: '消耗时间（毫秒）' })
  costTime: number;

  @CreateDateColumn({ name: 'oper_time', type: 'datetime', comment: '操作时间' })
  operTime: Date;
}

