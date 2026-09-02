import * as dotenv from 'dotenv';
import * as path from 'path';

// dotenv does not overwrite variables already present in process.env, so this
// only takes effect when nothing else (CI, shell) has already set DATABASE_URL.
dotenv.config({
  path: path.resolve(__dirname, '..', '.env.test'),
  quiet: true,
});
