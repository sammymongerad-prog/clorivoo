/**
 * resize-existing-images.js
 *
 * Downloads every image from Supabase Storage buckets, resizes any image
 * whose longest side is < 900px up to exactly 900px (preserving aspect ratio),
 * then re-uploads it in-place (upsert). Images already ≥ 900px are skipped.
 *
 * Run: node resize-existing-images.js
 */

const { createClient } = require('@supabase/supabase-js');
const sharp = require('sharp');

const SUPABASE_URL      = 'https://vcptpgmsxwynbobsmmdd.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZjcHRwZ21zeHd5bmJvYnNtbWRkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODAxMzg4MjMsImV4cCI6MjA5NTcxNDgyM30.QrmdCraB77J3A6U3IBlZX-ZqzTuTbc-GkcdOFMXvCUk';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const MIN_PX = 900; // minimum pixels on longest side for 3× sharpness at 300px display
const BUCKETS = ['banners', 'categories', 'products', 'avatars'];

async function listAllFiles(bucket) {
  const files = [];
  async function listFolder(prefix) {
    const { data, error } = await supabase.storage.from(bucket).list(prefix, { limit: 1000 });
    if (error || !data) return;
    for (const item of data) {
      if (item.id) {
        // it's a file
        files.push(prefix ? `${prefix}/${item.name}` : item.name);
      } else {
        // it's a folder
        await listFolder(prefix ? `${prefix}/${item.name}` : item.name);
      }
    }
  }
  await listFolder('');
  return files;
}

async function processImage(bucket, filePath) {
  // Download
  const { data, error } = await supabase.storage.from(bucket).download(filePath);
  if (error || !data) {
    console.log(`  ✗ download failed: ${error?.message}`);
    return;
  }

  const arrayBuffer = await data.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  // Check dimensions
  let meta;
  try {
    meta = await sharp(buffer).metadata();
  } catch {
    console.log(`  ✗ not a supported image, skipping`);
    return;
  }

  const { width = 0, height = 0 } = meta;
  const longest = Math.max(width, height);

  if (longest >= MIN_PX) {
    console.log(`  ✓ already ${width}×${height}, skipped`);
    return;
  }

  // Resize
  const scale = MIN_PX / longest;
  const newW = Math.round(width * scale);
  const newH = Math.round(height * scale);

  let resized;
  try {
    resized = await sharp(buffer)
      .resize(newW, newH)
      .jpeg({ quality: 92 })
      .toBuffer();
  } catch (e) {
    console.log(`  ✗ resize failed: ${e.message}`);
    return;
  }

  // Re-upload in place
  const uploadPath = filePath.replace(/\.[^.]+$/, '.jpg'); // normalize to .jpg
  const { error: upErr } = await supabase.storage.from(bucket).upload(uploadPath, resized, {
    upsert: true,
    contentType: 'image/jpeg',
  });

  if (upErr) {
    console.log(`  ✗ upload failed: ${upErr.message}`);
    return;
  }

  console.log(`  ✓ resized ${width}×${height} → ${newW}×${newH} and re-uploaded`);

  // If path changed (extension normalized), update DB references
  if (uploadPath !== filePath) {
    const { data: { publicUrl } } = supabase.storage.from(bucket).getPublicUrl(uploadPath);
    const oldUrl = supabase.storage.from(bucket).getPublicUrl(filePath).data.publicUrl;
    await updateDbReferences(oldUrl, publicUrl);
  }
}

// Update image_url in all tables that reference it
async function updateDbReferences(oldUrl, newUrl) {
  const tables = [
    { table: 'banners', column: 'image_url' },
    { table: 'products', column: 'images' }, // array — handled separately
    { table: 'shops', column: 'logo_url' },
    { table: 'shops', column: 'banner_url' },
    { table: 'categories', column: 'image_url' },
    { table: 'profiles', column: 'avatar_url' },
  ];
  for (const { table, column } of tables) {
    if (column === 'images') {
      // products.images is a text[] — use raw SQL via RPC if available, skip otherwise
      continue;
    }
    await supabase.from(table).update({ [column]: newUrl }).eq(column, oldUrl);
  }
}

async function main() {
  console.log('🔍 Scanning Supabase Storage buckets for images to resize...\n');

  for (const bucket of BUCKETS) {
    console.log(`\n📦 Bucket: ${bucket}`);
    let files;
    try {
      files = await listAllFiles(bucket);
    } catch (e) {
      console.log(`  bucket may not exist or is empty: ${e.message}`);
      continue;
    }

    if (!files.length) {
      console.log('  (empty)');
      continue;
    }

    const imageFiles = files.filter(f => /\.(jpe?g|png|webp|gif|heic|avif)$/i.test(f));
    console.log(`  Found ${imageFiles.length} image(s)`);

    for (const filePath of imageFiles) {
      console.log(`  → ${filePath}`);
      await processImage(bucket, filePath);
    }
  }

  console.log('\n✅ Done.');
}

main().catch(console.error);
