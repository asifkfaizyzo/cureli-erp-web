// backend/scripts/makeLogosPublic.js (do not remove this comment)
// backend/scripts/makeLogosPublic.js

import {
  S3Client,
  PutObjectAclCommand,
  PutBucketPolicyCommand,
  GetBucketPolicyCommand,
} from "@aws-sdk/client-s3";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, "..", ".env") });

const BUCKET_NAME =
  process.env.AWS_S3_BUCKET_NAME ||
  process.env.AWS_S3_BUCKET ||
  "cureli-prod-assets";
const REGION = process.env.AWS_REGION || "ap-south-1";

const s3Client = new S3Client({
  region: REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

async function addBucketPolicy() {
  console.log("\n📋 Adding bucket policy for public read access...\n");

  const policy = {
    Version: "2012-10-17",
    Statement: [
      {
        Sid: "PublicReadEmailAssets",
        Effect: "Allow",
        Principal: "*",
        Action: "s3:GetObject",
        Resource: `arn:aws:s3:::${BUCKET_NAME}/email-assets/*`,
      },
    ],
  };

  try {
    // Check existing policy first
    try {
      const existingPolicy = await s3Client.send(
        new GetBucketPolicyCommand({ Bucket: BUCKET_NAME }),
      );
      console.log("📄 Existing bucket policy found. Merging...");

      const existing = JSON.parse(existingPolicy.Policy);

      // Check if our statement already exists
      const hasOurPolicy = existing.Statement.some(
        (s) => s.Sid === "PublicReadEmailAssets",
      );

      if (hasOurPolicy) {
        console.log(" Email assets policy already exists!");
        return true;
      }

      // Add our statement to existing policy
      existing.Statement.push(policy.Statement[0]);

      await s3Client.send(
        new PutBucketPolicyCommand({
          Bucket: BUCKET_NAME,
          Policy: JSON.stringify(existing),
        }),
      );

      console.log(" Policy merged successfully!");
    } catch (e) {
      if (e.name === "NoSuchBucketPolicy") {
        // No existing policy, create new one
        await s3Client.send(
          new PutBucketPolicyCommand({
            Bucket: BUCKET_NAME,
            Policy: JSON.stringify(policy),
          }),
        );
        console.log(" New bucket policy created!");
      } else {
        throw e;
      }
    }

    return true;
  } catch (error) {
    console.error(" Failed to add bucket policy:", error.message);

    if (error.Code === "AccessDenied") {
      console.log('\n⚠️  Your IAM user needs "s3:PutBucketPolicy" permission.');
      console.log("   Please add the policy manually via AWS Console.");
    }

    return false;
  }
}

async function makeObjectPublic(key) {
  try {
    await s3Client.send(
      new PutObjectAclCommand({
        Bucket: BUCKET_NAME,
        Key: key,
        ACL: "public-read",
      }),
    );
    console.log(` Made public: ${key}`);
    return true;
  } catch (error) {
    console.error(` Failed to make ${key} public:`, error.message);
    return false;
  }
}

async function main() {
  console.log("\n" + "═".repeat(60));
  console.log("🔓 Making Email Logos Publicly Accessible");
  console.log("═".repeat(60));
  console.log(`\nBucket: ${BUCKET_NAME}`);
  console.log(`Region: ${REGION}`);

  // Try adding bucket policy first
  const policyAdded = await addBucketPolicy();

  if (!policyAdded) {
    console.log("\n📝 Trying to set individual object ACLs...\n");

    // Try making individual objects public
    await makeObjectPublic("email-assets/cureli-logo-white.png");
    await makeObjectPublic("email-assets/cureli-logo-dark.png");
  }

  console.log("\n" + "═".repeat(60));
  console.log("🧪 Test these URLs in your browser:");
  console.log("═".repeat(60));
  console.log(
    `\n${`https://${BUCKET_NAME}.s3.${REGION}.amazonaws.com/email-assets/cureli-logo-white.png`}`,
  );
  console.log(
    `${`https://${BUCKET_NAME}.s3.${REGION}.amazonaws.com/email-assets/cureli-logo-dark.png`}\n`,
  );
}

main().catch(console.error);
