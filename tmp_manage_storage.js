const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

const envPath = path.join(__dirname, '.env.local');
const envContent = fs.readFileSync(envPath, 'utf8');

const getEnv = (key) => {
    const match = envContent.match(new RegExp(`${key}=(.*)`));
    return match ? match[1].trim() : null;
};

const supabaseUrl = getEnv('NEXT_PUBLIC_SUPABASE_URL');
const supabaseKey = getEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY'); // Should ideally use service role key for bucket creation, but let's try with this or check if it's already there

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase URL or Key');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkAndCreateBucket() {
    const { data: buckets, error: listError } = await supabase.storage.listBuckets();
    if (listError) {
        console.error('Error listing buckets:', listError);
        return;
    }

    const exists = buckets.find(b => b.name === 'resource_thumbnails');
    if (exists) {
        console.log('Bucket resource_thumbnails already exists');
    } else {
        console.log('Creating bucket resource_thumbnails...');
        // Note: createBucket might fail with anon key if RLS doesn't allow it. 
        // We might need to ask the user to create it manually if this fails.
        const { data, error } = await supabase.storage.createBucket('resource_thumbnails', {
            public: true
        });
        if (error) {
            console.error('Error creating bucket:', error);
        } else {
            console.log('Bucket created successfully:', data);
        }
    }
}

checkAndCreateBucket();
