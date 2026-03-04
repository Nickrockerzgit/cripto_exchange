// import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
// import crypto from "crypto";

// const s3 = new S3Client({
//   region: process.env.AWS_REGION,
//   credentials: {
//     accessKeyId: process.env.AWS_ACCESS_KEY_ID,
//     secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
//   },
// });

// export const uploadDepositScreenshot = async (file, userId) => {
//   const extension = file.originalname.split(".").pop();

//   const key = `deposits/${userId}/${crypto.randomUUID()}.${extension}`;

//   const command = new PutObjectCommand({
//     Bucket: process.env.AWS_BUCKET_NAME,
//     Key: key,
//     Body: file.buffer,
//     ContentType: file.mimetype,
//   });

//   await s3.send(command);

//   return key; // only key save karenge
// };
import { S3Client, PutObjectCommand, GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import crypto from "crypto";

const s3 = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

/**
 * Upload deposit screenshot to S3
 */
export const uploadDepositScreenshot = async (file, userId) => {
  const extension = file.originalname.split(".").pop();

  const key = `deposits/${userId}/${crypto.randomUUID()}.${extension}`;

  const command = new PutObjectCommand({
    Bucket: process.env.AWS_BUCKET_NAME,
    Key: key,
    Body: file.buffer,
    ContentType: file.mimetype,
  });

  await s3.send(command);

  return key; // DB me sirf key store hogi
};


/**
 * Generate signed URL to view screenshot
 */
export const generateSignedUrl = async (key) => {

  const command = new GetObjectCommand({
    Bucket: process.env.AWS_BUCKET_NAME,
    Key: key,
  });

  const signedUrl = await getSignedUrl(s3, command, {
    expiresIn: 3600 // 1 hour
  });

  return signedUrl;
};