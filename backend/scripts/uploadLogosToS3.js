// backend/scripts/uploadLogosToS3.js (do not remove this comment)
// backend/scripts/uploadLogosToS3.js

import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";

// Load env from parent directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, "..", ".env") });

const s3Client = new S3Client({
  region: process.env.AWS_REGION || "ap-south-1",
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

const BUCKET_NAME = process.env.AWS_S3_BUCKET_NAME || "cureli-prod-assets";
const REGION = process.env.AWS_REGION || "ap-south-1";

async function uploadLogo(fileName) {
  const filePath = path.join(
    __dirname,
    "..",
    "public",
    "assets",
    "images",
    fileName,
  );

  console.log(`\n📁 Looking for: ${filePath}`);

  if (!fs.existsSync(filePath)) {
    console.log(` File not found: ${filePath}`);
    return null;
  }

  console.log(`✓ File found, uploading...`);

  const fileContent = fs.readFileSync(filePath);
  const key = `email-assets/${fileName}`;

  const params = {
    Bucket: BUCKET_NAME,
    Key: key,
    Body: fileContent,
    ContentType: "image/png",
    CacheControl: "public, max-age=31536000",
  };

  try {
    await s3Client.send(new PutObjectCommand(params));

    const url = `https://${BUCKET_NAME}.s3.${REGION}.amazonaws.com/${key}`;

    console.log(` Uploaded successfully!`);
    console.log(`   S3 Key: ${key}`);
    console.log(`   URL: ${url}`);

    return url;
  } catch (error) {
    console.error(` Failed to upload ${fileName}:`, error.message);
    if (error.Code) {
      console.error(`   Error Code: ${error.Code}`);
    }
    return null;
  }
}

async function main() {
  console.log("\n" + "═".repeat(60));
  console.log("📤 Uploading Email Logos to AWS S3");
  console.log("═".repeat(60));

  console.log(`\n📋 Configuration:`);
  console.log(`   Bucket: ${BUCKET_NAME}`);
  console.log(`   Region: ${REGION}`);
  console.log(
    `   Access Key: ${process.env.AWS_ACCESS_KEY_ID ? "✓ Set" : " Missing"}`,
  );
  console.log(
    `   Secret Key: ${process.env.AWS_SECRET_ACCESS_KEY ? "✓ Set" : " Missing"}`,
  );

  if (!process.env.AWS_ACCESS_KEY_ID || !process.env.AWS_SECRET_ACCESS_KEY) {
    console.log("\n AWS credentials not found in .env file!");
    console.log(
      "   Please add AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY to your .env",
    );
    process.exit(1);
  }

  const whiteUrl = await uploadLogo("cureli-logo-white.png");
  const darkUrl = await uploadLogo("cureli-logo-dark.png");

  console.log("\n" + "═".repeat(60));

  if (whiteUrl || darkUrl) {
    console.log(" Upload Complete!");
    console.log("═".repeat(60));
    console.log("\n📋 Add these lines to your .env file:\n");

    if (whiteUrl) console.log(`EMAIL_LOGO_WHITE=${whiteUrl}`);
    if (darkUrl) console.log(`EMAIL_LOGO_DARK=${darkUrl}`);

    console.log("\n" + "─".repeat(60));
    console.log(
      "⚠️  IMPORTANT: Make sure your S3 bucket allows public read access!",
    );
    console.log("─".repeat(60));
    console.log(
      "\nAdd this bucket policy in AWS S3 Console → Permissions → Bucket Policy:\n",
    );
    console.log(`{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "PublicReadEmailAssets",
      "Effect": "Allow",
      "Principal": "*",
      "Action": "s3:GetObject",
      "Resource": "arn:aws:s3:::${BUCKET_NAME}/email-assets/*"
    }
  ]
}`);
    console.log("\n" + "═".repeat(60));
    console.log("\n🧪 Test URLs in browser:");
    if (whiteUrl) console.log(`   ${whiteUrl}`);
    if (darkUrl) console.log(`   ${darkUrl}`);
    console.log("\n");
  } else {
    console.log(" No files were uploaded");
    console.log("═".repeat(60) + "\n");
  }
}

main().catch((error) => {
  console.error("\n Script failed:", error.message);
  process.exit(1);
});
