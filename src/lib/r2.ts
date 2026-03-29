import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

const R2_ENDPOINT = process.env.R2_ENDPOINT!;
const R2_ACCESS_KEY_ID = process.env.R2_ACCESS_KEY_ID!;
const R2_SECRET_ACCESS_KEY = process.env.R2_SECRET_ACCESS_KEY!;
const R2_BUCKET_NAME = process.env.R2_BUCKET_NAME || "thaiclaw";

let client: S3Client;

function getR2Client(): S3Client {
  if (!client) {
    client = new S3Client({
      region: "auto",
      endpoint: R2_ENDPOINT,
      credentials: {
        accessKeyId: R2_ACCESS_KEY_ID,
        secretAccessKey: R2_SECRET_ACCESS_KEY,
      },
    });
  }
  return client;
}

// อัพโหลดไฟล์ไป R2 - เก็บแยกโฟลเดอร์ตาม userId
export async function uploadToR2(
  userId: string,
  filename: string,
  data: Buffer,
  mimeType: string
): Promise<string> {
  const key = `${userId}/${filename}`;
  const s3 = getR2Client();

  await s3.send(
    new PutObjectCommand({
      Bucket: R2_BUCKET_NAME,
      Key: key,
      Body: data,
      ContentType: mimeType,
    })
  );

  return key;
}

// สร้าง URL ชั่วคราวสำหรับดูไฟล์ (1 ชั่วโมง)
export async function getR2SignedUrl(key: string): Promise<string> {
  const s3 = getR2Client();
  const url = await getSignedUrl(
    s3,
    new GetObjectCommand({
      Bucket: R2_BUCKET_NAME,
      Key: key,
    }),
    { expiresIn: 3600 }
  );
  return url;
}

// ลบไฟล์จาก R2
export async function deleteFromR2(key: string): Promise<void> {
  const s3 = getR2Client();
  await s3.send(
    new DeleteObjectCommand({
      Bucket: R2_BUCKET_NAME,
      Key: key,
    })
  );
}
