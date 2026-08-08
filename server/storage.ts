import { S3Client, PutObjectCommand, GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { ENV } from "./_core/env";

function normalizeKey(relKey: string): string {
  return relKey.replace(/^\/+/, "");
}

function requireR2Env() {
  const accountId = ENV.r2AccountId;
  const accessKeyId = ENV.r2AccessKeyId;
  const secretAccessKey = ENV.r2SecretAccessKey;
  const bucketName = ENV.r2BucketName;

  if (!accountId || !accessKeyId || !secretAccessKey || !bucketName) {
    throw new Error(
      "R2 storage credentials missing: set R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY and R2_BUCKET_NAME"
    );
  }

  return { accountId, accessKeyId, secretAccessKey, bucketName };
}

function getR2Client() {
  const { accountId, accessKeyId, secretAccessKey } = requireR2Env();

  return new S3Client({
    region: "auto",
    endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId,
      secretAccessKey,
    },
  });
}

function buildPublicUrl(key: string): string {
  const base = ENV.r2PublicBaseUrl?.trim();

  if (!base) {
    return key;
  }

  return `${base.replace(/\/+$/, "")}/${key}`;
}

export async function storagePut(
  relKey: string,
  data: Buffer | Uint8Array | string,
  contentType = "application/octet-stream",
  cacheControl = "public, max-age=0, must-revalidate"
): Promise<{ key: string; url: string }> {
  const { bucketName } = requireR2Env();
  const client = getR2Client();
  const key = normalizeKey(relKey);

  await client.send(
    new PutObjectCommand({
      Bucket: bucketName,
      Key: key,
      Body: data,
      ContentType: contentType,
      // Sem isso, a Cloudflare pode continuar servindo uma cópia em cache do
      // arquivo antigo mesmo depois de regravar o objeto na mesma URL — foi
      // exatamente o que aconteceu com PDFs de certificado regenerados
      // (a URL não muda entre regenerações, então o cache "grudava").
      CacheControl: cacheControl,
    })
  );

  return {
    key,
    url: buildPublicUrl(key),
  };
}

export async function storageGet(
  relKey: string
): Promise<{ key: string; url: string }> {
  const { bucketName } = requireR2Env();
  const client = getR2Client();
  const key = normalizeKey(relKey);

  const command = new GetObjectCommand({
    Bucket: bucketName,
    Key: key,
  });

  const signedUrl = await getSignedUrl(client, command, { expiresIn: 3600 });

  return {
    key,
    url: signedUrl,
  };
}

/**
 * Baixa o conteúdo de um arquivo do R2/S3 como Buffer
 * Aceita tanto a chave relativa quanto a URL pública (extrai a chave da URL)
 */
export async function storageDownloadBuffer(
  relKeyOrUrl: string
): Promise<Buffer> {
  const { bucketName } = requireR2Env();
  const client = getR2Client();

  // Se for uma URL completa, extrai a chave relativa
  let key: string;
  if (relKeyOrUrl.startsWith('http://') || relKeyOrUrl.startsWith('https://')) {
    // Tenta extrair a chave da URL pública ou assinada
    const base = ENV.r2PublicBaseUrl?.trim();
    if (base && relKeyOrUrl.startsWith(base)) {
      key = relKeyOrUrl.slice(base.replace(/\/+$/, '').length).replace(/^\/+/, '');
    } else {
      // URL assinada ou outro formato: extrai o path
      const urlObj = new URL(relKeyOrUrl);
      key = urlObj.pathname.replace(/^\/+/, '');
    }
  } else {
    key = normalizeKey(relKeyOrUrl);
  }

  const command = new GetObjectCommand({
    Bucket: bucketName,
    Key: key,
  });

  const response = await client.send(command);
  if (!response.Body) throw new Error('Arquivo vazio ou não encontrado no storage');

  // Converte o stream para Buffer
  const chunks: Uint8Array[] = [];
  const stream = response.Body as any;
  if (typeof stream[Symbol.asyncIterator] === 'function') {
    for await (const chunk of stream) {
      chunks.push(chunk);
    }
  } else {
    await new Promise<void>((resolve, reject) => {
      stream.on('data', (chunk: Uint8Array) => chunks.push(chunk));
      stream.on('end', resolve);
      stream.on('error', reject);
    });
  }
  return Buffer.concat(chunks);
}
