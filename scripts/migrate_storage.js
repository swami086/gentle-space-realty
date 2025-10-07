/**
 * Storage Migration Script: Supabase → GCP Cloud Storage
 * Migrates all buckets and files from Supabase Storage to GCP Cloud Storage
 */

import { createClient } from '@supabase/supabase-js';
import { Storage } from '@google-cloud/storage';
import fs from 'fs';
import path from 'path';
import https from 'https';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuration
const supabaseConfig = {
  url: process.env.SUPABASE_URL || 'https://nfryqqpfprupwqayirnc.supabase.co',
  serviceKey: process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5mcnlxcXBmcHJ1cHdxYXlpcm5jIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NzgxNDAxOCwiZXhwIjoyMDczMzkwMDE4fQ.XTxgPSa-J5uMLvs7uGOl4REH3ziEZNY1vHQjAple_fQ'
};

const gcpConfig = {
  keyFilename: process.env.GOOGLE_APPLICATION_CREDENTIALS || '/Users/swaminathan/Downloads/gentle_space_realty_i1aw6b/Keys/aqueous-impact-269911-8c1c766d0dcb.json',
  projectId: 'aqueous-impact-269911'
};

class StorageMigrator {
  constructor() {
    this.supabase = createClient(supabaseConfig.url, supabaseConfig.serviceKey);
    this.gcs = new Storage(gcpConfig);
    this.migrationLog = [];
  }

  async createGCPBuckets() {
    console.log('🪣 Creating GCP Storage buckets...');

    const bucketConfigs = [
      { name: 'gentle-space-property-images', public: true, location: 'asia-south1' },
      { name: 'gentle-space-property-videos', public: true, location: 'asia-south1' },
      { name: 'gentle-space-property-media', public: true, location: 'asia-south1' },
      { name: 'gentle-space-user-avatars', public: true, location: 'asia-south1' },
      { name: 'gentle-space-testimonial-media', public: true, location: 'asia-south1' },
      { name: 'gentle-space-documents', public: false, location: 'asia-south1' }
    ];

    for (const config of bucketConfigs) {
      try {
        const [bucket] = await this.gcs.bucket(config.name).get({ autoCreate: false }).catch(() => [null]);
        
        if (!bucket) {
          console.log(`📦 Creating bucket: ${config.name}`);
          
          const [newBucket] = await this.gcs.createBucket(config.name, {
            location: config.location,
            storageClass: 'STANDARD',
            uniformBucketLevelAccess: { enabled: true }
          });

          // Set public access if needed
          if (config.public) {
            await newBucket.makePublic();
            console.log(`🌐 Made bucket ${config.name} public`);
          }

          this.migrationLog.push(`✅ Created bucket: ${config.name}`);
        } else {
          console.log(`✅ Bucket ${config.name} already exists`);
        }
      } catch (error) {
        console.error(`❌ Error creating bucket ${config.name}:`, error.message);
        this.migrationLog.push(`❌ Failed to create bucket: ${config.name} - ${error.message}`);
      }
    }
  }

  async downloadFile(url, filePath) {
    return new Promise((resolve, reject) => {
      const file = fs.createWriteStream(filePath);
      
      https.get(url, (response) => {
        response.pipe(file);
        
        file.on('finish', () => {
          file.close();
          resolve(filePath);
        });
      }).on('error', (error) => {
        fs.unlink(filePath, () => {}); // Delete file on error
        reject(error);
      });
    });
  }

  async migrateFiles(supabaseBucket, gcpBucket, files, currentPath = '') {
    for (const file of files) {
      try {
        if (file.name === '.emptyFolderPlaceholder') continue;

        const filePath = currentPath ? `${currentPath}/${file.name}` : file.name;
        
        // If it's a folder, recursively process it
        if (!file.id && file.name) {
          console.log(`📁 Processing folder: ${filePath}`);
          const { data: subFiles, error } = await this.supabase.storage
            .from(supabaseBucket)
            .list(filePath);
            
          if (!error && subFiles) {
            await this.migrateFiles(supabaseBucket, gcpBucket, subFiles, filePath);
          }
          continue;
        }

        console.log(`📄 Migrating file: ${filePath}`);

        // Get public URL from Supabase
        const { data: urlData } = this.supabase.storage
          .from(supabaseBucket)
          .getPublicUrl(filePath);

        if (!urlData?.publicUrl) {
          console.log(`⚠️ No public URL for: ${filePath}`);
          continue;
        }

        // Create temp directory
        const tempDir = path.join(__dirname, '../temp-migration');
        if (!fs.existsSync(tempDir)) {
          fs.mkdirSync(tempDir, { recursive: true });
        }

        // Download file temporarily
        const tempFilePath = path.join(tempDir, path.basename(filePath));
        
        try {
          await this.downloadFile(urlData.publicUrl, tempFilePath);
          console.log(`⬇️ Downloaded: ${path.basename(filePath)}`);

          // Upload to GCP
          const gcpFile = this.gcs.bucket(gcpBucket).file(filePath);
          await gcpFile.save(fs.readFileSync(tempFilePath), {
            metadata: {
              contentType: this.getContentType(filePath),
              cacheControl: 'public, max-age=31536000' // 1 year cache
            }
          });

          console.log(`⬆️ Uploaded to GCP: ${filePath}`);
          this.migrationLog.push(`✅ Migrated: ${filePath} from ${supabaseBucket} to ${gcpBucket}`);

          // Clean up temp file
          fs.unlinkSync(tempFilePath);

        } catch (downloadError) {
          console.log(`⚠️ Could not download ${filePath}: ${downloadError.message}`);
          this.migrationLog.push(`⚠️ Skipped: ${filePath} - ${downloadError.message}`);
        }

      } catch (error) {
        console.error(`❌ Error migrating ${file.name}:`, error.message);
        this.migrationLog.push(`❌ Failed: ${file.name} - ${error.message}`);
      }
    }
  }

  getContentType(filePath) {
    const ext = path.extname(filePath).toLowerCase();
    const contentTypes = {
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.png': 'image/png',
      '.gif': 'image/gif',
      '.webp': 'image/webp',
      '.mp4': 'video/mp4',
      '.mov': 'video/quicktime',
      '.avi': 'video/x-msvideo',
      '.pdf': 'application/pdf',
      '.doc': 'application/msword',
      '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    };
    return contentTypes[ext] || 'application/octet-stream';
  }

  async migrateBucket(supabaseBucket, gcpBucket) {
    console.log(`\n🚀 Migrating bucket: ${supabaseBucket} → ${gcpBucket}`);
    console.log('=' * 60);

    // List all files in Supabase bucket
    const { data: files, error } = await this.supabase.storage
      .from(supabaseBucket)
      .list('', { limit: 1000 });

    if (error) {
      console.error(`❌ Error listing files in ${supabaseBucket}:`, error.message);
      return;
    }

    if (!files || files.length === 0) {
      console.log(`📭 No files found in ${supabaseBucket}`);
      this.migrationLog.push(`📭 No files in bucket: ${supabaseBucket}`);
      return;
    }

    console.log(`📊 Found ${files.length} files/folders in ${supabaseBucket}`);

    // Migrate all files
    await this.migrateFiles(supabaseBucket, gcpBucket, files);

    console.log(`✅ Finished migrating ${supabaseBucket}`);
  }

  async migrateAllBuckets() {
    console.log('🚀 Starting Supabase Storage → GCP Cloud Storage migration');
    console.log('=' * 70);

    try {
      // Create GCP buckets first
      await this.createGCPBuckets();

      // Define bucket mappings
      const bucketMappings = {
        'property-images': 'gentle-space-property-images',
        'property-videos': 'gentle-space-property-videos', 
        'property-media': 'gentle-space-property-media',
        'user-avatars': 'gentle-space-user-avatars',
        'testimonial-media': 'gentle-space-testimonial-media',
        'documents': 'gentle-space-documents'
      };

      // Migrate each bucket
      for (const [supabaseBucket, gcpBucket] of Object.entries(bucketMappings)) {
        await this.migrateBucket(supabaseBucket, gcpBucket);
      }

      // Generate migration report
      await this.generateMigrationReport();

      console.log('\n🎉 Storage migration completed!');
      console.log('=' * 70);

    } catch (error) {
      console.error('❌ Migration failed:', error.message);
      throw error;
    }
  }

  async generateMigrationReport() {
    const report = {
      migrationDate: new Date().toISOString(),
      status: 'completed',
      bucketMappings: {
        'property-images': 'gentle-space-property-images',
        'property-videos': 'gentle-space-property-videos',
        'property-media': 'gentle-space-property-media', 
        'user-avatars': 'gentle-space-user-avatars',
        'testimonial-media': 'gentle-space-testimonial-media',
        'documents': 'gentle-space-documents'
      },
      migrationLog: this.migrationLog,
      gcpUrls: {
        'property-images': 'https://storage.googleapis.com/gentle-space-property-images/',
        'property-videos': 'https://storage.googleapis.com/gentle-space-property-videos/',
        'property-media': 'https://storage.googleapis.com/gentle-space-property-media/',
        'user-avatars': 'https://storage.googleapis.com/gentle-space-user-avatars/', 
        'testimonial-media': 'https://storage.googleapis.com/gentle-space-testimonial-media/',
        'documents': 'https://storage.googleapis.com/gentle-space-documents/' // Private bucket
      }
    };

    const reportPath = path.join(__dirname, '../migration-data/storage_migration_report.json');
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
    
    console.log('📋 Storage migration report saved to:', reportPath);
  }

  async cleanup() {
    // Clean up temp directory
    const tempDir = path.join(__dirname, '../temp-migration');
    if (fs.existsSync(tempDir)) {
      fs.rmSync(tempDir, { recursive: true, force: true });
      console.log('🧹 Cleaned up temporary files');
    }
  }
}

// Run migration if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  const migrator = new StorageMigrator();
  
  migrator.migrateAllBuckets()
    .then(() => migrator.cleanup())
    .catch((error) => {
      console.error('❌ Migration failed:', error);
      migrator.cleanup();
      process.exit(1);
    });
}

export default StorageMigrator;