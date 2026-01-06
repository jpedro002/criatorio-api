import * as Minio from 'minio'
import { settings } from 'src/config'
import { v4 as uuidv4 } from 'uuid'

let client = null
const bucketName = settings.MINIO_BUCKET_NAME

if (settings.MINIO_ENDPOINT) {
	client = new Minio.Client({
		endPoint: settings.MINIO_ENDPOINT,
		port: settings.MINIO_PORT,
		useSSL: settings.MINIO_USE_SSL,
		accessKey: settings.MINIO_ACCESS_KEY,
		secretKey: settings.MINIO_SECRET_KEY
	})
}

async function ensureBucketExists() {
	if (!client) throw new Error('MinIO client not configured')
	const exists = await client.bucketExists(bucketName)
	if (!exists) {
		const region = settings.MINIO_REGION || undefined
		await client.makeBucket(bucketName, region)
	}
}

function generateObjectPrefix(demandaId) {
	return `demanda-${demandaId}/`
}

function getCategoryByType(tipoArquivo) {
	const documentTypes = ['pdf', 'doc', 'docx', 'txt']
	const imageTypes = ['jpg', 'jpeg', 'png', 'gif', 'bmp']
	if (documentTypes.includes(tipoArquivo.toLowerCase())) {
		return 'documentos'
	}
	if (imageTypes.includes(tipoArquivo.toLowerCase())) {
		return 'imagens'
	}
	return 'outros'
}

function generateObjectKey(demandaId, tipoArquivo, filename) {
	const uuid = uuidv4()
	const category = getCategoryByType(tipoArquivo)
	return `demanda-${demandaId}/${category}/${uuid}-${filename}`
}

async function generatePostPolicy(
	demandaId,
	maxSize = 10 * 1024 * 1024,
	expiryMinutes = 15
) {
	if (!client) throw new Error('MinIO client not configured')
	await ensureBucketExists()
	const objectPrefix = generateObjectPrefix(demandaId)
	const expiry = new Date()
	expiry.setTime(expiry.getTime() + expiryMinutes * 60 * 1000)
	const policy = client.newPostPolicy()
	policy.setBucket(bucketName)
	policy.setKeyStartsWith(objectPrefix)
	policy.setExpires(expiry)
	policy.setContentLengthRange(1, maxSize)
	const { postURL, formData } = await client.presignedPostPolicy(policy)
	return {
		postURL,
		formData,
		objectPrefix,
		bucketName,
		expiresAt: expiry.toISOString(),
		maxSize
	}
}

async function getObjectUrl(objectKey, expires = 7 * 24 * 60 * 60) {
	if (!client) throw new Error('MinIO client not configured')
	return await client.presignedGetObject(bucketName, objectKey, expires, {
		'response-content-disposition': 'attachment'
	})
}

async function deleteObject(objectKey) {
	if (!client) throw new Error('MinIO client not configured')
	return await client.removeObject(bucketName, objectKey)
}

async function listObjects(prefix = '', recursive = true) {
	if (!client) throw new Error('MinIO client not configured')
	await ensureBucketExists()
	const objects = []
	const stream = client.listObjects(bucketName, prefix, recursive)

	return new Promise((resolve, reject) => {
		stream.on('data', obj => {
			objects.push({
				name: obj.name,
				size: obj.size,
				lastModified: obj.lastModified,
				etag: obj.etag
			})
		})
		stream.on('error', reject)
		stream.on('end', () => resolve(objects))
	})
}

function generateFinalObjectKey(demandaId, filename) {
	const uuid = uuidv4()
	const extension = filename.split('.').pop().toLowerCase()
	const category = getCategoryByType(extension)
	return `demanda-${demandaId}/${category}/${uuid}-${filename}`
}

async function generatePresignedDownloadUrl(objectKey, expires = 24 * 60 * 60) {
	if (!client) throw new Error('MinIO client not configured')
	const presignedUrl = await client.presignedUrl(
		'GET',
		bucketName,
		objectKey,
		expires,
		{
			'response-content-disposition': 'attachment'
		}
	)
	return {
		presignedUrl,
		objectKey,
		bucketName,
		expiresIn: expires
	}
}

async function generatePresignedUploadUrl(
	demandaId,
	filename,
	expires = 24 * 60 * 60
) {
	if (!client) throw new Error('MinIO client not configured')
	try {
		await ensureBucketExists()
		const objectKey = generateFinalObjectKey(demandaId, filename)

		const presignedUrl = await client.presignedUrl(
			'PUT',
			bucketName,
			objectKey,
			expires
		)
		console.log('✅ URL gerada:', presignedUrl)
		return {
			presignedUrl,
			objectKey,
			bucketName,
			expiresIn: expires
		}
	} catch (error) {
		console.error('❌ Erro ao gerar URL pré-assinada:', error)
		throw error
	}
}

async function remove(objectKey) {
	if (!client) throw new Error('MinIO client not configured')
	return await client.removeObject(bucketName, objectKey)
}

export const minioService = {
	ensureBucketExists,
	generateObjectPrefix,
	generateObjectKey,
	getCategoryByType,
	generatePostPolicy,
	getObjectUrl,
	deleteObject,
	listObjects,
	generateFinalObjectKey,
	generatePresignedDownloadUrl,
	generatePresignedUploadUrl,
	remove
}
