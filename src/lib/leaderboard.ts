import { Redis } from '@upstash/redis';

const redis = Redis.fromEnv();

export async function updateLeaderboardScore(userId: string, focusScore: number, streak: number, faculty: string | null) {
    const score = focusScore + (streak * 10);
    
    await redis.zadd('leaderboard:global', { score, member: userId });

    if (faculty) {
        await redis.zadd("leaderboard:faculty:\", { score, member: userId });
    }
}

export async function getGlobalLeaderboard(limit: number = 50) {
    const result = await redis.zrange('leaderboard:global', 0, limit - 1, { rev: true, withScores: true }) as {member: string, score: number}[];
    return result;
}


export async function getFacultyLeaderboard(faculty: string, limit: number = 50) {
    const result = await redis.zrange("leaderboard:faculty:\", 0, limit - 1, { rev: true, withScores: true }) as {member: string, score: number}[];
    return result;
}

