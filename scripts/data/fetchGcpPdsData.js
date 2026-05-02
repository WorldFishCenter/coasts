import fs from 'fs/promises';
import path from 'path';
import dotenv from 'dotenv';
import { Storage } from '@google-cloud/storage';

dotenv.config();

const OUTPUT_DIR = path.join(process.cwd(), 'public', 'data');
const BUCKET_NAME = process.env.GCP_BUCKET_NAME;

const DATASETS = [
  {
    label: 'PDS fishing grounds',
    prefix: process.env.GCP_PDS_GROUNDS_PREFIX || 'pds-fishing-grounds__',
    outputFile: 'pds-fishing-grounds.geojson'
  },
  {
    label: 'PDS H3 effort',
    prefix: process.env.GCP_PDS_EFFORT_PREFIX || 'pds-h3-effort-r9__',
    outputFile: 'pds-h3-effort-r9.json'
  },
  {
    label: 'Frame gears by GAUL2',
    prefix: process.env.GCP_PDS_FRAME_GEARS_PREFIX || 'frame-gears__',
    outputFile: 'frame-gears.json'
  }
];

const parseServiceAccount = () => {
  const raw = process.env.GCP_SA_KEY;
  if (!raw) {
    throw new Error('Missing GCP_SA_KEY environment variable');
  }

  try {
    return JSON.parse(raw);
  } catch (error) {
    throw new Error(`Invalid GCP_SA_KEY JSON: ${error.message}`);
  }
};

const extractVersionFromName = (fileName, prefix) => {
  const escapedPrefix = prefix.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const match = fileName.match(new RegExp(`^${escapedPrefix}(.+?)(\\.[^./]+)?$`));
  return match?.[1] ?? '';
};

const compareVersionTokens = (aToken, bToken) => {
  const aIsNumeric = /^\d+$/.test(aToken);
  const bIsNumeric = /^\d+$/.test(bToken);
  if (aIsNumeric && bIsNumeric) {
    return Number(aToken) - Number(bToken);
  }
  return aToken.localeCompare(bToken);
};

const compareVersions = (aVersion, bVersion) => {
  const aTokens = String(aVersion).split(/[\W_]+/).filter(Boolean);
  const bTokens = String(bVersion).split(/[\W_]+/).filter(Boolean);
  const maxLen = Math.max(aTokens.length, bTokens.length);
  for (let i = 0; i < maxLen; i++) {
    const aToken = aTokens[i];
    const bToken = bTokens[i];
    if (aToken == null) return -1;
    if (bToken == null) return 1;
    const cmp = compareVersionTokens(aToken, bToken);
    if (cmp !== 0) return cmp;
  }
  return 0;
};

const getLatestFileForPrefix = async (bucket, prefix) => {
  const [files] = await bucket.getFiles({ prefix });
  const matchingFiles = files.filter((file) => file.name.startsWith(prefix));

  if (matchingFiles.length === 0) {
    throw new Error(`No files found for prefix "${prefix}"`);
  }

  const sortedByVersion = [...matchingFiles].sort((a, b) => {
    const versionA = extractVersionFromName(a.name, prefix);
    const versionB = extractVersionFromName(b.name, prefix);
    return compareVersions(versionA, versionB);
  });

  return sortedByVersion[sortedByVersion.length - 1];
};

const downloadAndValidateJson = async (file) => {
  const [buffer] = await file.download();
  const content = buffer.toString('utf8');

  try {
    return JSON.parse(content);
  } catch (error) {
    throw new Error(`Downloaded file "${file.name}" is not valid JSON: ${error.message}`);
  }
};

async function main() {
  if (!BUCKET_NAME) {
    throw new Error('Missing GCP_BUCKET_NAME environment variable');
  }

  const credentials = parseServiceAccount();
  const storage = new Storage({
    projectId: credentials.project_id,
    credentials
  });

  const bucket = storage.bucket(BUCKET_NAME);
  await fs.mkdir(OUTPUT_DIR, { recursive: true });

  console.log(`Fetching PDS datasets from bucket "${BUCKET_NAME}"...`);

  for (const dataset of DATASETS) {
    const latestFile = await getLatestFileForPrefix(bucket, dataset.prefix);
    const payload = await downloadAndValidateJson(latestFile);
    const outputPath = path.join(OUTPUT_DIR, dataset.outputFile);

    await fs.writeFile(outputPath, JSON.stringify(payload, null, 2));
    console.log(`Saved ${dataset.label}: ${latestFile.name} -> ${dataset.outputFile}`);
  }

  console.log('Google Cloud PDS data fetch completed.');
}

main().catch((error) => {
  console.error('Error fetching Google Cloud PDS data:', error);
  process.exit(1);
});
