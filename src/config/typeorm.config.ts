import { DataSource, DataSourceOptions } from 'typeorm';
import { config } from 'dotenv';

// 加载环境变量
config();

/**
 * TypeORM 配置
 * 用于数据库连接和实体管理
 */
export const typeOrmConfig: DataSourceOptions = {
  type: 'mysql',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '3306', 10),
  username: process.env.DB_USERNAME || 'root',
  password: process.env.DB_PASSWORD || 'root123',
  database: process.env.DB_DATABASE || 'ry-vue',
  entities: [__dirname + '/../**/*.entity{.ts,.js}'],
  synchronize: false, // 生产环境务必设置为 false
  logging: process.env.NODE_ENV === 'development',
  charset: 'utf8mb4',
  timezone: '+08:00',
};

// 用于 TypeORM CLI 的 DataSource
export default new DataSource(typeOrmConfig);

