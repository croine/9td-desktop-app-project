import { db } from '@/db';
import { tasks, taskDependencies, user } from '@/db/schema';
import { eq } from 'drizzle-orm';

async function main() {
    // Query the first user from the database
    const firstUser = await db.select().from(user).limit(1);
    
    if (!firstUser || firstUser.length === 0) {
        throw new Error('No users found in database. Please seed users first.');
    }
    
    const userId = firstUser[0].id;
    console.log(`Using user ID: ${userId}`);

    // Calculate dates relative to now
    const now = Date.now();
    const dayInMs = 24 * 60 * 60 * 1000;
    
    const sampleTasks = [
        {
            userId,
            title: 'Initialize Project Repository',
            description: 'Set up Git repository, initialize project structure, configure CI/CD pipeline',
            priority: 'urgent',
            status: 'completed',
            dueDate: new Date(now - 2 * dayInMs),
            tags: JSON.stringify(['setup', 'devops']),
            categories: JSON.stringify(['Development']),
            subtasks: null,
            timeTracking: JSON.stringify({ estimated: '2h', actual: '2.5h' }),
            archived: false,
            createdAt: new Date(now - 5 * dayInMs),
            updatedAt: new Date(now - 2 * dayInMs),
        },
        {
            userId,
            title: 'Design Database Schema',
            description: 'Create ERD and define all database tables with relationships',
            priority: 'high',
            status: 'completed',
            dueDate: new Date(now - 1 * dayInMs),
            tags: JSON.stringify(['database', 'architecture']),
            categories: JSON.stringify(['Development', 'Planning']),
            subtasks: JSON.stringify([
                { title: 'Create ERD', completed: true },
                { title: 'Document relationships', completed: true }
            ]),
            timeTracking: null,
            archived: false,
            createdAt: new Date(now - 4 * dayInMs),
            updatedAt: new Date(now - 1 * dayInMs),
        },
        {
            userId,
            title: 'Implement Task Management API',
            description: 'Create REST API endpoints for CRUD operations on tasks',
            priority: 'high',
            status: 'in-progress',
            dueDate: new Date(now + 2 * dayInMs),
            tags: JSON.stringify(['backend', 'api']),
            categories: JSON.stringify(['Development']),
            subtasks: JSON.stringify([
                { title: 'Create endpoints', completed: true },
                { title: 'Add validation', completed: false }
            ]),
            timeTracking: JSON.stringify({ estimated: '8h', actual: '5h' }),
            archived: false,
            createdAt: new Date(now - 3 * dayInMs),
            updatedAt: new Date(now),
        },
        {
            userId,
            title: 'Write Unit Tests for API',
            description: 'Write comprehensive unit tests for all API endpoints',
            priority: 'high',
            status: 'todo',
            dueDate: new Date(now + 4 * dayInMs),
            tags: JSON.stringify(['testing', 'quality']),
            categories: JSON.stringify(['Testing']),
            subtasks: null,
            timeTracking: JSON.stringify({ estimated: '6h', actual: '0h' }),
            archived: false,
            createdAt: new Date(now - 2 * dayInMs),
            updatedAt: new Date(now - 2 * dayInMs),
        },
        {
            userId,
            title: 'Build Task List UI Components',
            description: 'Create reusable React components for task display and management',
            priority: 'medium',
            status: 'in-progress',
            dueDate: new Date(now + 3 * dayInMs),
            tags: JSON.stringify(['frontend', 'react', 'ui']),
            categories: JSON.stringify(['Development', 'UI/UX']),
            subtasks: JSON.stringify([
                { title: 'TaskCard component', completed: true },
                { title: 'TaskList component', completed: false },
                { title: 'TaskForm component', completed: false }
            ]),
            timeTracking: null,
            archived: false,
            createdAt: new Date(now - 2 * dayInMs),
            updatedAt: new Date(now),
        },
        {
            userId,
            title: 'Integration Tests for Task Flow',
            description: 'End-to-end testing of task creation, update, and deletion workflow',
            priority: 'medium',
            status: 'todo',
            dueDate: new Date(now + 6 * dayInMs),
            tags: JSON.stringify(['testing', 'e2e']),
            categories: JSON.stringify(['Testing']),
            subtasks: null,
            timeTracking: JSON.stringify({ estimated: '4h', actual: '0h' }),
            archived: false,
            createdAt: new Date(now - 1 * dayInMs),
            updatedAt: new Date(now - 1 * dayInMs),
        },
        {
            userId,
            title: 'Write API Documentation',
            description: 'Create comprehensive API documentation with examples',
            priority: 'low',
            status: 'todo',
            dueDate: new Date(now + 7 * dayInMs),
            tags: JSON.stringify(['documentation', 'api']),
            categories: JSON.stringify(['Documentation']),
            subtasks: null,
            timeTracking: null,
            archived: false,
            createdAt: new Date(now - 1 * dayInMs),
            updatedAt: new Date(now - 1 * dayInMs),
        },
        {
            userId,
            title: 'Code Review: Task Dependencies Feature',
            description: 'Review implementation of task dependencies system',
            priority: 'high',
            status: 'in-review',
            dueDate: new Date(now + 1 * dayInMs),
            tags: JSON.stringify(['review', 'quality']),
            categories: JSON.stringify(['Development']),
            subtasks: null,
            timeTracking: null,
            archived: false,
            createdAt: new Date(now),
            updatedAt: new Date(now),
        },
        {
            userId,
            title: 'Deploy Application to Staging Environment',
            description: 'Deploy latest version to staging for QA testing',
            priority: 'urgent',
            status: 'todo',
            dueDate: new Date(now + 8 * dayInMs),
            tags: JSON.stringify(['deployment', 'devops']),
            categories: JSON.stringify(['Deployment']),
            subtasks: null,
            timeTracking: null,
            archived: false,
            createdAt: new Date(now),
            updatedAt: new Date(now),
        },
        {
            userId,
            title: 'Deploy to Production',
            description: 'Final deployment to production environment',
            priority: 'urgent',
            status: 'todo',
            dueDate: new Date(now + 14 * dayInMs),
            tags: JSON.stringify(['deployment', 'production']),
            categories: JSON.stringify(['Deployment']),
            subtasks: null,
            timeTracking: JSON.stringify({ estimated: '1h', actual: '0h' }),
            archived: false,
            createdAt: new Date(now),
            updatedAt: new Date(now),
        },
    ];

    // Insert tasks and get their IDs
    const insertedTasks = await db.insert(tasks).values(sampleTasks).returning();
    console.log(`✅ Created ${insertedTasks.length} tasks`);

    // Map task titles to their IDs for creating dependencies
    const taskMap = new Map(
        insertedTasks.map(task => [task.title, task.id])
    );

    // Create task dependencies
    const dependencies = [
        {
            taskId: taskMap.get('Implement Task Management API')!,
            dependsOnTaskId: taskMap.get('Design Database Schema')!,
            dependencyType: 'blocks',
            createdAt: new Date(now - 3 * dayInMs),
        },
        {
            taskId: taskMap.get('Write Unit Tests for API')!,
            dependsOnTaskId: taskMap.get('Implement Task Management API')!,
            dependencyType: 'blocks',
            createdAt: new Date(now - 2 * dayInMs),
        },
        {
            taskId: taskMap.get('Build Task List UI Components')!,
            dependsOnTaskId: taskMap.get('Implement Task Management API')!,
            dependencyType: 'blocks',
            createdAt: new Date(now - 2 * dayInMs),
        },
        {
            taskId: taskMap.get('Integration Tests for Task Flow')!,
            dependsOnTaskId: taskMap.get('Write Unit Tests for API')!,
            dependencyType: 'blocks',
            createdAt: new Date(now - 1 * dayInMs),
        },
        {
            taskId: taskMap.get('Integration Tests for Task Flow')!,
            dependsOnTaskId: taskMap.get('Build Task List UI Components')!,
            dependencyType: 'blocks',
            createdAt: new Date(now - 1 * dayInMs),
        },
        {
            taskId: taskMap.get('Code Review: Task Dependencies Feature')!,
            dependsOnTaskId: taskMap.get('Implement Task Management API')!,
            dependencyType: 'relates_to',
            createdAt: new Date(now),
        },
        {
            taskId: taskMap.get('Deploy Application to Staging Environment')!,
            dependsOnTaskId: taskMap.get('Integration Tests for Task Flow')!,
            dependencyType: 'blocks',
            createdAt: new Date(now),
        },
        {
            taskId: taskMap.get('Deploy Application to Staging Environment')!,
            dependsOnTaskId: taskMap.get('Write API Documentation')!,
            dependencyType: 'blocks',
            createdAt: new Date(now),
        },
        {
            taskId: taskMap.get('Deploy to Production')!,
            dependsOnTaskId: taskMap.get('Deploy Application to Staging Environment')!,
            dependencyType: 'blocks',
            createdAt: new Date(now),
        },
    ];

    await db.insert(taskDependencies).values(dependencies);
    console.log(`✅ Created ${dependencies.length} task dependencies`);
    
    console.log('✅ Tasks seeder completed successfully');
}

main().catch((error) => {
    console.error('❌ Seeder failed:', error);
});