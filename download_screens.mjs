import fs from 'fs';
import https from 'https';
import path from 'path';

const screens = [
    { name: 'profile_setup.html', url: 'https://contribution.usercontent.google.com/download?c=CgthaWRhX2NvZGVmeBJ7Eh1hcHBfY29tcGFuaW9uX2dlbmVyYXRlZF9maWxlcxpaCiVodG1sXzFkYWQyNzM3M2EzNDRhZjhhNWNiNTI1MWEwMjU5NmM3EgsSBxDAtpLOgQQYAZIBIwoKcHJvamVjdF9pZBIVQhM4MjcxNDc5NDQxODA1NzQxMDY5&filename=&opi=96797242' },
    { name: 'leaderboard_students.html', url: 'https://contribution.usercontent.google.com/download?c=CgthaWRhX2NvZGVmeBJ7Eh1hcHBfY29tcGFuaW9uX2dlbmVyYXRlZF9maWxlcxpaCiVodG1sXzA5Njk5ZDhhNmI4NTQzY2U4ZjE2MjlmYjY2N2UyZTU3EgsSBxDAtpLOgQQYAZIBIwoKcHJvamVjdF9pZBIVQhM4MjcxNDc5NDQxODA1NzQxMDY5&filename=&opi=96797242' },
    { name: 'sign_in.html', url: 'https://contribution.usercontent.google.com/download?c=CgthaWRhX2NvZGVmeBJ7Eh1hcHBfY29tcGFuaW9uX2dlbmVyYXRlZF9maWxlcxpaCiVodG1sXzg5OGJkYzdkYzI2YTRiMTQ5MTFmYWVlMjYxMGEzMDhjEgsSBxDAtpLOgQQYAZIBIwoKcHJvamVjdF9pZBIVQhM4MjcxNDc5NDQxODA1NzQxMDY5&filename=&opi=96797242' },
    { name: 'sign_up.html', url: 'https://contribution.usercontent.google.com/download?c=CgthaWRhX2NvZGVmeBJ7Eh1hcHBfY29tcGFuaW9uX2dlbmVyYXRlZF9maWxlcxpaCiVodG1sXzg3OTI3YjI5ZDE1MzQzZDY4MjQyMWRjZTllMWVlMzRkEgsSBxDAtpLOgQQYAZIBIwoKcHJvamVjdF9pZBIVQhM4MjcxNDc5NDQxODA1NzQxMDY5&filename=&opi=96797242' },
    { name: 'dashboard.html', url: 'https://contribution.usercontent.google.com/download?c=CgthaWRhX2NvZGVmeBJ7Eh1hcHBfY29tcGFuaW9uX2dlbmVyYXRlZF9maWxlcxpaCiVodG1sX2NhNWRlMjQyMTA2NDQ4Nzk5NTk0MzNhMmMyM2FmMDc3EgsSBxDAtpLOgQQYAZIBIwoKcHJvamVjdF9pZBIVQhM4MjcxNDc5NDQxODA1NzQxMDY5&filename=&opi=96797242' },
    { name: 'leaderboard_faculties.html', url: 'https://contribution.usercontent.google.com/download?c=CgthaWRhX2NvZGVmeBJ7Eh1hcHBfY29tcGFuaW9uX2dlbmVyYXRlZF9maWxlcxpaCiVodG1sXzBlYWJjNWRiMWJiODRlZWM5ZmJhNzAzMzdhZTZkNTlhEgsSBxDAtpLOgQQYAZIBIwoKcHJvamVjdF9pZBIVQhM4MjcxNDc5NDQxODA1NzQxMDY5&filename=&opi=96797242' },
    { name: 'active_study_room.html', url: 'https://contribution.usercontent.google.com/download?c=CgthaWRhX2NvZGVmeBJ7Eh1hcHBfY29tcGFuaW9uX2dlbmVyYXRlZF9maWxlcxpaCiVodG1sXzJiZWUxZTE5YWUxYjRjZjJiNjkxZjFlODA1ZjA2YjVhEgsSBxDAtpLOgQQYAZIBIwoKcHJvamVjdF9pZBIVQhM4MjcxNDc5NDQxODA1NzQxMDY5&filename=&opi=96797242' }
];

const download = (url, dest) => {
    return new Promise((resolve, reject) => {
        const file = fs.createWriteStream(dest);
        https.get(url, (response) => {
            response.pipe(file);
            file.on('finish', () => {
                file.close(resolve);
            });
        }).on('error', (err) => {
            fs.unlink(dest, () => reject(err));
        });
    });
};

async function main() {
    const dir = path.join(process.cwd(), 'stitch_screens');
    if (!fs.existsSync(dir)) fs.mkdirSync(dir);
    for (const s of screens) {
        console.log(`Downloading ${s.name}...`);
        await download(s.url, path.join(dir, s.name));
    }
    console.log('Done!');
}

main().catch(console.error);
