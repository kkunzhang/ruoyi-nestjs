import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SysOperLog } from '../domain/entities/sys-oper-log.entity';

/**
 * 操作日志 Repository
 */
@Injectable()
export class OperLogRepository {
  constructor(
    @InjectRepository(SysOperLog)
    private readonly operLogRepository: Repository<SysOperLog>,
  ) {}

  /**
   * 新增操作日志
   * @param operLog 操作日志信息
   * @returns 结果
   */
  async insertOperLog(operLog: Partial<SysOperLog>): Promise<SysOperLog> {
    return this.operLogRepository.save(operLog);
  }

  /**
   * 查询操作日志列表
   * @param query 查询条件
   * @returns 操作日志列表
   */
  async selectOperLogList(query: {
    title?: string;
    operName?: string;
    businessType?: number;
    status?: number;
    beginTime?: Date;
    endTime?: Date;
    skip?: number;
    take?: number;
  }): Promise<[SysOperLog[], number]> {
    const queryBuilder = this.operLogRepository.createQueryBuilder('log');

    if (query.title) {
      queryBuilder.andWhere('log.title LIKE :title', { title: `%${query.title}%` });
    }

    if (query.operName) {
      queryBuilder.andWhere('log.operName LIKE :operName', { operName: `%${query.operName}%` });
    }

    if (query.businessType !== undefined) {
      queryBuilder.andWhere('log.businessType = :businessType', { businessType: query.businessType });
    }

    if (query.status !== undefined) {
      queryBuilder.andWhere('log.status = :status', { status: query.status });
    }

    if (query.beginTime && query.endTime) {
      queryBuilder.andWhere('log.operTime BETWEEN :beginTime AND :endTime', {
        beginTime: query.beginTime,
        endTime: query.endTime,
      });
    }

    queryBuilder.orderBy('log.operId', 'DESC');

    if (query.skip !== undefined) {
      queryBuilder.skip(query.skip);
    }

    if (query.take !== undefined) {
      queryBuilder.take(query.take);
    }

    return queryBuilder.getManyAndCount();
  }

  /**
   * 通过操作日志ID查询操作日志
   * @param operId 操作日志ID
   * @returns 操作日志对象
   */
  async selectOperLogById(operId: number): Promise<SysOperLog | null> {
    return this.operLogRepository.findOne({ where: { operId } });
  }

  /**
   * 批量删除操作日志
   * @param operIds 需要删除的操作日志ID
   * @returns 结果
   */
  async deleteOperLogByIds(operIds: number[]): Promise<boolean> {
    const result = await this.operLogRepository.delete(operIds);
    return result.affected! > 0;
  }

  /**
   * 清空操作日志
   * @returns 结果
   */
  async cleanOperLog(): Promise<boolean> {
    await this.operLogRepository.clear();
    return true;
  }
}

