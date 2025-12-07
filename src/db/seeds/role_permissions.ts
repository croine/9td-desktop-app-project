import { db } from '@/db';
import { rolePermissions } from '@/db/schema';

async function main() {
    const samplePermissions = [
        {
            role: 'moderator',
            permission: 'pin_messages',
            createdAt: new Date(),
        },
        {
            role: 'moderator',
            permission: 'delete_any_message',
            createdAt: new Date(),
        },
        {
            role: 'moderator',
            permission: 'send_announcements',
            createdAt: new Date(),
        },
        {
            role: 'admin',
            permission: 'pin_messages',
            createdAt: new Date(),
        },
        {
            role: 'admin',
            permission: 'delete_any_message',
            createdAt: new Date(),
        },
        {
            role: 'admin',
            permission: 'send_announcements',
            createdAt: new Date(),
        },
        {
            role: 'admin',
            permission: 'manage_roles',
            createdAt: new Date(),
        },
    ];

    await db.insert(rolePermissions).values(samplePermissions);
    
    console.log('✅ Role permissions seeder completed successfully');
}

main().catch((error) => {
    console.error('❌ Seeder failed:', error);
});