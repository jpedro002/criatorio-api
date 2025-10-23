import path from 'node:path'
import dotenv from 'dotenv'

dotenv.config({ path: path.join(__dirname, '../../', '.env') })

const PORT = process.env.PORT || 3000
const JWT_ALGORITHM = process.env.JWT_ALGORITHM || 'HS256'
const JWT_SECRET = process.env.JWT_SECRET || 'default_secret_key'
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '24h'
const JWT_REFRESH_EXPIRES_IN = process.env.JWT_REFRESH_EXPIRES_IN || '7d'
const DOC_PATH = path.resolve(__dirname, '..', 'public')
const DOC_SIZE = 10 * 1024 * 1024
const CORS_ORIGIN =
	process.env.CORS_ORIGIN || 'http://localhost:3000,http://localhost:3001'
const NODE_ENV = process.env.NODE_ENV || 'development'

// MinIO Settings
const MINIO_ENDPOINT = process.env.MINIO_ENDPOINT || ''
const MINIO_PORT = Number.parseInt(process.env.MINIO_PORT) || 9000
const MINIO_ACCESS_KEY = process.env.MINIO_ACCESS_KEY || ''
const MINIO_SECRET_KEY = process.env.MINIO_SECRET_KEY || ''
const MINIO_USE_SSL = process.env.MINIO_USE_SSL === 'true'
const MINIO_BUCKET_NAME =
	process.env.MINIO_BUCKET_NAME || 'fiscalizacao-demandas'
const MINIO_REGION = process.env.MINIO_REGION || '' // Vazio para self-hosted

// console.log(process.env.MINIO_ACCESS_KEY, process.env)

const settings = {
	PORT,
	JWT_ALGORITHM,
	JWT_SECRET,
	JWT_EXPIRES_IN,
	JWT_REFRESH_EXPIRES_IN,
	CORS_ORIGIN,
	DOC_PATH,
	DOC_SIZE,
	NODE_ENV,
	// MinIO Settings
	MINIO_ENDPOINT,
	MINIO_PORT,
	MINIO_ACCESS_KEY,
	MINIO_SECRET_KEY,
	MINIO_USE_SSL,
	MINIO_BUCKET_NAME,
	MINIO_REGION
}

export { settings }
