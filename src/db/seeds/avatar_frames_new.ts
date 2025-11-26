import { db } from '@/db';
import { avatarFramesNew } from '@/db/schema';

async function main() {
    const sampleFrames = [
        {
            name: 'Spring Blossoms',
            frameType: 'seasonal',
            styleConfig: {
                borderWidth: 4,
                colors: ['#ffb7c5', '#ffd1dc'],
                pattern: 'flowers'
            },
            unlockRequirement: null,
            isAnimated: false,
            previewUrl: '/frames/spring-blossoms.png',
            season: 'spring',
            createdAt: new Date('2024-01-10').toISOString(),
        },
        {
            name: 'Summer Sunshine',
            frameType: 'seasonal',
            styleConfig: {
                borderWidth: 4,
                colors: ['#ffd700', '#ffa500'],
                pattern: 'sun_rays'
            },
            unlockRequirement: null,
            isAnimated: false,
            previewUrl: '/frames/summer-sunshine.png',
            season: 'summer',
            createdAt: new Date('2024-01-10').toISOString(),
        },
        {
            name: 'Autumn Leaves',
            frameType: 'seasonal',
            styleConfig: {
                borderWidth: 4,
                colors: ['#d2691e', '#ff8c00', '#dc143c'],
                pattern: 'leaves'
            },
            unlockRequirement: null,
            isAnimated: false,
            previewUrl: '/frames/autumn-leaves.png',
            season: 'fall',
            createdAt: new Date('2024-01-10').toISOString(),
        },
        {
            name: 'Winter Frost',
            frameType: 'seasonal',
            styleConfig: {
                borderWidth: 4,
                colors: ['#87ceeb', '#b0e0e6'],
                pattern: 'snowflakes'
            },
            unlockRequirement: null,
            isAnimated: false,
            previewUrl: '/frames/winter-frost.png',
            season: 'winter',
            createdAt: new Date('2024-01-10').toISOString(),
        },
        {
            name: 'Bronze Champion',
            frameType: 'achievement',
            styleConfig: {
                borderWidth: 3,
                colors: ['#cd7f32'],
                glow: true
            },
            unlockRequirement: {
                type: 'achievement',
                id: 1
            },
            isAnimated: false,
            previewUrl: '/frames/bronze-champion.png',
            season: null,
            createdAt: new Date('2024-01-11').toISOString(),
        },
        {
            name: 'Silver Elite',
            frameType: 'achievement',
            styleConfig: {
                borderWidth: 3,
                colors: ['#c0c0c0'],
                glow: true
            },
            unlockRequirement: {
                type: 'achievement',
                id: 3
            },
            isAnimated: false,
            previewUrl: '/frames/silver-elite.png',
            season: null,
            createdAt: new Date('2024-01-11').toISOString(),
        },
        {
            name: 'Gold Master',
            frameType: 'achievement',
            styleConfig: {
                borderWidth: 4,
                colors: ['#ffd700', '#ffed4e'],
                glow: true
            },
            unlockRequirement: {
                type: 'achievement',
                id: 4
            },
            isAnimated: false,
            previewUrl: '/frames/gold-master.png',
            season: null,
            createdAt: new Date('2024-01-11').toISOString(),
        },
        {
            name: 'Platinum Legend',
            frameType: 'achievement',
            styleConfig: {
                borderWidth: 5,
                colors: ['#e5e4e2', '#ffffff'],
                glow: true,
                pulse: true
            },
            unlockRequirement: {
                type: 'achievement',
                id: 5
            },
            isAnimated: true,
            previewUrl: '/frames/platinum-legend.png',
            season: null,
            createdAt: new Date('2024-01-11').toISOString(),
        },
        {
            name: 'Neon Glow',
            frameType: 'theme',
            styleConfig: {
                borderWidth: 3,
                colors: ['#ff00ff', '#00ffff'],
                effect: 'neon_glow'
            },
            unlockRequirement: null,
            isAnimated: true,
            previewUrl: '/frames/neon-glow.png',
            season: null,
            createdAt: new Date('2024-01-12').toISOString(),
        },
        {
            name: 'Galaxy',
            frameType: 'theme',
            styleConfig: {
                borderWidth: 4,
                colors: ['#4b0082', '#8a2be2', '#9370db'],
                pattern: 'stars'
            },
            unlockRequirement: {
                type: 'tasks',
                value: 50
            },
            isAnimated: false,
            previewUrl: '/frames/galaxy.png',
            season: null,
            createdAt: new Date('2024-01-12').toISOString(),
        },
        {
            name: 'Fire',
            frameType: 'theme',
            styleConfig: {
                borderWidth: 4,
                colors: ['#ff4500', '#ff6347', '#ffa500'],
                effect: 'flame'
            },
            unlockRequirement: {
                type: 'streak',
                value: 7
            },
            isAnimated: true,
            previewUrl: '/frames/fire.png',
            season: null,
            createdAt: new Date('2024-01-12').toISOString(),
        },
        {
            name: 'Rainbow',
            frameType: 'theme',
            styleConfig: {
                borderWidth: 5,
                colors: ['#ff0000', '#ff7f00', '#ffff00', '#00ff00', '#0000ff', '#4b0082', '#9400d3'],
                effect: 'rainbow_shift'
            },
            unlockRequirement: {
                type: 'tasks',
                value: 100
            },
            isAnimated: true,
            previewUrl: '/frames/rainbow.png',
            season: null,
            createdAt: new Date('2024-01-12').toISOString(),
        },
        {
            name: 'Classic Gold',
            frameType: 'theme',
            styleConfig: {
                borderWidth: 3,
                colors: ['#b8860b'],
                effect: 'none'
            },
            unlockRequirement: null,
            isAnimated: false,
            previewUrl: '/frames/classic-gold.png',
            season: null,
            createdAt: new Date('2024-01-13').toISOString(),
        },
        {
            name: 'Ocean Wave',
            frameType: 'theme',
            styleConfig: {
                borderWidth: 4,
                colors: ['#006994', '#1e90ff'],
                effect: 'wave'
            },
            unlockRequirement: {
                type: 'streak',
                value: 30
            },
            isAnimated: true,
            previewUrl: '/frames/ocean-wave.png',
            season: null,
            createdAt: new Date('2024-01-13').toISOString(),
        },
        {
            name: 'Mystic Purple',
            frameType: 'theme',
            styleConfig: {
                borderWidth: 4,
                colors: ['#800080', '#9932cc'],
                glow: true
            },
            unlockRequirement: {
                type: 'achievement',
                id: 10
            },
            isAnimated: false,
            previewUrl: '/frames/mystic-purple.png',
            season: null,
            createdAt: new Date('2024-01-13').toISOString(),
        }
    ];

    await db.insert(avatarFramesNew).values(sampleFrames);
    
    console.log('✅ Avatar frames seeder completed successfully');
}

main().catch((error) => {
    console.error('❌ Seeder failed:', error);
});