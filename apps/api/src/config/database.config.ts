import { registerAs } from '@nestjs/config';

export default registerAs('database', () => ({
  uri:
    process.env.MONGODB_URI ||
    'mongodb://localhost:27017,localhost:27018,localhost:27019/contabilita?replicaSet=rs0',
  dbName: process.env.MONGODB_DB_NAME || 'contabilita',
}));
