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
  contentType = "application/octet-stream"
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
