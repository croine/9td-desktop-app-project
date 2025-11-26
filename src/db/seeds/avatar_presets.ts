import { db } from '@/db';
import { avatarPresets } from '@/db/schema';

async function main() {
    const samplePresets = [
        // Pattern presets - Abstract
        {
            name: 'Geometric Grid',
            presetType: 'pattern',
            category: 'abstract',
            config: JSON.stringify({
                type: 'grid',
                colors: ['#667eea', '#764ba2'],
                spacing: 20,
                lineWidth: 2
            }),
            previewUrl: '/presets/geometric-grid.png',
            isPremium: false,
        },
        {
            name: 'Polka Dots',
            presetType: 'pattern',
            category: 'abstract',
            config: JSON.stringify({
                type: 'dots',
                colors: ['#f093fb', '#f5576c'],
                size: 8,
                spacing: 16
            }),
            previewUrl: '/presets/polka-dots.png',
            isPremium: false,
        },
        {
            name: 'Diagonal Stripes',
            presetType: 'pattern',
            category: 'abstract',
            config: JSON.stringify({
                type: 'stripes',
                colors: ['#4facfe', '#00f2fe'],
                angle: 45,
                width: 12
            }),
            previewUrl: '/presets/diagonal-stripes.png',
            isPremium: false,
        },
        {
            name: 'Hexagon Mesh',
            presetType: 'pattern',
            category: 'abstract',
            config: JSON.stringify({
                type: 'hexagon',
                colors: ['#43e97b', '#38f9d7'],
                size: 24,
                strokeWidth: 2
            }),
            previewUrl: '/presets/hexagon-mesh.png',
            isPremium: true,
        },
        {
            name: 'Waves',
            presetType: 'pattern',
            category: 'abstract',
            config: JSON.stringify({
                type: 'wave',
                colors: ['#667eea', '#764ba2'],
                amplitude: 30,
                frequency: 0.5
            }),
            previewUrl: '/presets/waves.png',
            isPremium: false,
        },
        {
            name: 'Chevron',
            presetType: 'pattern',
            category: 'abstract',
            config: JSON.stringify({
                type: 'chevron',
                colors: ['#f857a6', '#ff5858'],
                width: 40,
                angle: 60
            }),
            previewUrl: '/presets/chevron.png',
            isPremium: false,
        },
        {
            name: 'Circuit Board',
            presetType: 'pattern',
            category: 'professional',
            config: JSON.stringify({
                type: 'circuit',
                colors: ['#00d2ff', '#3a7bd5'],
                complexity: 'high',
                nodeSize: 4
            }),
            previewUrl: '/presets/circuit-board.png',
            isPremium: true,
        },

        // Icon presets - Animals
        {
            name: 'Fox',
            presetType: 'icon',
            category: 'animals',
            config: JSON.stringify({
                icon: 'fox',
                color: '#ff6b6b',
                background: '#fff5e6',
                size: 'large'
            }),
            previewUrl: '/presets/fox.png',
            isPremium: false,
        },
        {
            name: 'Owl',
            presetType: 'icon',
            category: 'animals',
            config: JSON.stringify({
                icon: 'owl',
                color: '#74b9ff',
                background: '#e8f4ff',
                size: 'large'
            }),
            previewUrl: '/presets/owl.png',
            isPremium: false,
        },
        {
            name: 'Panda',
            presetType: 'icon',
            category: 'animals',
            config: JSON.stringify({
                icon: 'panda',
                color: '#2d3436',
                background: '#ffffff',
                size: 'large'
            }),
            previewUrl: '/presets/panda.png',
            isPremium: true,
        },
        {
            name: 'Cat',
            presetType: 'icon',
            category: 'animals',
            config: JSON.stringify({
                icon: 'cat',
                color: '#a29bfe',
                background: '#f8f9ff',
                size: 'large'
            }),
            previewUrl: '/presets/cat.png',
            isPremium: false,
        },
        {
            name: 'Penguin',
            presetType: 'icon',
            category: 'animals',
            config: JSON.stringify({
                icon: 'penguin',
                color: '#2d3436',
                background: '#dfe6e9',
                size: 'large'
            }),
            previewUrl: '/presets/penguin.png',
            isPremium: false,
        },
        {
            name: 'Butterfly',
            presetType: 'icon',
            category: 'animals',
            config: JSON.stringify({
                icon: 'butterfly',
                colors: ['#fa709a', '#fee140'],
                background: '#ffffff',
                size: 'large'
            }),
            previewUrl: '/presets/butterfly.png',
            isPremium: true,
        },

        // Icon presets - Objects
        {
            name: 'Rocket',
            presetType: 'icon',
            category: 'objects',
            config: JSON.stringify({
                icon: 'rocket',
                color: '#ff6348',
                background: '#fff0ed',
                size: 'large'
            }),
            previewUrl: '/presets/rocket.png',
            isPremium: false,
        },
        {
            name: 'Trophy',
            presetType: 'icon',
            category: 'objects',
            config: JSON.stringify({
                icon: 'trophy',
                color: '#ffd700',
                background: '#fffef0',
                size: 'large'
            }),
            previewUrl: '/presets/trophy.png',
            isPremium: true,
        },
        {
            name: 'Camera',
            presetType: 'icon',
            category: 'objects',
            config: JSON.stringify({
                icon: 'camera',
                color: '#00b894',
                background: '#e6fff9',
                size: 'large'
            }),
            previewUrl: '/presets/camera.png',
            isPremium: false,
        },

        // Gradient presets - Abstract
        {
            name: 'Sunset',
            presetType: 'gradient',
            category: 'abstract',
            config: JSON.stringify({
                type: 'linear',
                colors: ['#fa709a', '#fee140'],
                angle: 135
            }),
            previewUrl: '/presets/sunset.png',
            isPremium: false,
        },
        {
            name: 'Ocean Blue',
            presetType: 'gradient',
            category: 'abstract',
            config: JSON.stringify({
                type: 'radial',
                colors: ['#2193b0', '#6dd5ed'],
                center: ['50%', '50%']
            }),
            previewUrl: '/presets/ocean-blue.png',
            isPremium: false,
        },
        {
            name: 'Purple Haze',
            presetType: 'gradient',
            category: 'professional',
            config: JSON.stringify({
                type: 'linear',
                colors: ['#8e2de2', '#4a00e0'],
                angle: 90
            }),
            previewUrl: '/presets/purple-haze.png',
            isPremium: false,
        },
        {
            name: 'Mint Fresh',
            presetType: 'gradient',
            category: 'professional',
            config: JSON.stringify({
                type: 'linear',
                colors: ['#00b09b', '#96c93d'],
                angle: 180
            }),
            previewUrl: '/presets/mint-fresh.png',
            isPremium: false,
        },
        {
            name: 'Rose Gold',
            presetType: 'gradient',
            category: 'professional',
            config: JSON.stringify({
                type: 'radial',
                colors: ['#eb3349', '#f45c43'],
                center: ['50%', '50%']
            }),
            previewUrl: '/presets/rose-gold.png',
            isPremium: true,
        },

        // Professional gradients
        {
            name: 'Corporate Blue',
            presetType: 'gradient',
            category: 'professional',
            config: JSON.stringify({
                type: 'linear',
                colors: ['#0f2027', '#203a43', '#2c5364'],
                angle: 135
            }),
            previewUrl: '/presets/corporate-blue.png',
            isPremium: false,
        },
        {
            name: 'Emerald',
            presetType: 'gradient',
            category: 'professional',
            config: JSON.stringify({
                type: 'linear',
                colors: ['#348f50', '#56b4d3'],
                angle: 120
            }),
            previewUrl: '/presets/emerald.png',
            isPremium: false,
        },
        {
            name: 'Crimson Night',
            presetType: 'gradient',
            category: 'professional',
            config: JSON.stringify({
                type: 'linear',
                colors: ['#360033', '#0b8793'],
                angle: 90
            }),
            previewUrl: '/presets/crimson-night.png',
            isPremium: true,
        },
    ];

    await db.insert(avatarPresets).values(samplePresets);
    
    console.log('✅ Avatar presets seeder completed successfully');
}

main().catch((error) => {
    console.error('❌ Seeder failed:', error);
});