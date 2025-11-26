import { db } from '@/db';
import { user, conversations, conversationParticipants, messages } from '@/db/schema';
import { eq } from 'drizzle-orm';

function generateUserId(): string {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
  let id = 'user_';
  for (let i = 0; i < 32; i++) {
    id += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return id;
}

async function main() {
  // Check existing users
  const existingUsers = await db.select().from(user);
  
  let userIds: { [key: string]: string } = {};
  
  // If only 1 user exists, create 5 test users
  if (existingUsers.length === 1) {
    const newUsers = [
      {
        id: generateUserId(),
        email: 'alice@example.com',
        name: 'Alice',
        emailVerified: true,
        image: null,
        createdAt: new Date('2024-01-10'),
        updatedAt: new Date('2024-01-10'),
      },
      {
        id: generateUserId(),
        email: 'bob@example.com',
        name: 'Bob',
        emailVerified: true,
        image: null,
        createdAt: new Date('2024-01-10'),
        updatedAt: new Date('2024-01-10'),
      },
      {
        id: generateUserId(),
        email: 'carol@example.com',
        name: 'Carol',
        emailVerified: true,
        image: null,
        createdAt: new Date('2024-01-10'),
        updatedAt: new Date('2024-01-10'),
      },
      {
        id: generateUserId(),
        email: 'david@example.com',
        name: 'David',
        emailVerified: true,
        image: null,
        createdAt: new Date('2024-01-10'),
        updatedAt: new Date('2024-01-10'),
      },
      {
        id: generateUserId(),
        email: 'eve@example.com',
        name: 'Eve',
        emailVerified: true,
        image: null,
        createdAt: new Date('2024-01-10'),
        updatedAt: new Date('2024-01-10'),
      },
    ];
    
    await db.insert(user).values(newUsers);
    
    userIds = {
      alice: newUsers[0].id,
      bob: newUsers[1].id,
      carol: newUsers[2].id,
      david: newUsers[3].id,
      eve: newUsers[4].id,
    };
    
    console.log('✅ Created 5 new users');
  } else if (existingUsers.length >= 5) {
    // Use existing users
    userIds = {
      alice: existingUsers[0].id,
      bob: existingUsers[1].id,
      carol: existingUsers[2].id,
      david: existingUsers[3].id,
      eve: existingUsers[4].id,
    };
  }

  const now = new Date();
  const fiveDaysAgo = new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000);
  const threeDaysAgo = new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000);
  const twoDaysAgo = new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000);

  // Create 3 conversations
  const conversationData = [
    {
      name: 'Team Standup',
      isGroup: true,
      createdBy: userIds.alice,
      createdAt: fiveDaysAgo,
      updatedAt: fiveDaysAgo,
    },
    {
      name: null,
      isGroup: false,
      createdBy: userIds.alice,
      createdAt: threeDaysAgo,
      updatedAt: threeDaysAgo,
    },
    {
      name: 'Design Review',
      isGroup: true,
      createdBy: userIds.alice,
      createdAt: twoDaysAgo,
      updatedAt: twoDaysAgo,
    },
  ];

  const insertedConversations = await db.insert(conversations).values(conversationData).returning();
  const [teamStandup, oneOnOne, designReview] = insertedConversations;

  console.log('✅ Created 3 conversations');

  // Create conversation participants
  const participantData = [
    // Team Standup - all 5 members
    {
      conversationId: teamStandup.id,
      userId: userIds.alice,
      joinedAt: fiveDaysAgo,
      lastReadAt: new Date(now.getTime() - 2 * 60 * 60 * 1000),
    },
    {
      conversationId: teamStandup.id,
      userId: userIds.bob,
      joinedAt: fiveDaysAgo,
      lastReadAt: new Date(now.getTime() - 4 * 60 * 60 * 1000),
    },
    {
      conversationId: teamStandup.id,
      userId: userIds.carol,
      joinedAt: fiveDaysAgo,
      lastReadAt: new Date(now.getTime() - 1 * 60 * 60 * 1000),
    },
    {
      conversationId: teamStandup.id,
      userId: userIds.david,
      joinedAt: fiveDaysAgo,
      lastReadAt: null,
    },
    {
      conversationId: teamStandup.id,
      userId: userIds.eve,
      joinedAt: fiveDaysAgo,
      lastReadAt: new Date(now.getTime() - 6 * 60 * 60 * 1000),
    },
    // 1-on-1 - Alice and Bob
    {
      conversationId: oneOnOne.id,
      userId: userIds.alice,
      joinedAt: threeDaysAgo,
      lastReadAt: new Date(now.getTime() - 1 * 60 * 60 * 1000),
    },
    {
      conversationId: oneOnOne.id,
      userId: userIds.bob,
      joinedAt: threeDaysAgo,
      lastReadAt: new Date(now.getTime() - 30 * 60 * 1000),
    },
    // Design Review - Alice, Carol, Eve
    {
      conversationId: designReview.id,
      userId: userIds.alice,
      joinedAt: twoDaysAgo,
      lastReadAt: new Date(now.getTime() - 3 * 60 * 60 * 1000),
    },
    {
      conversationId: designReview.id,
      userId: userIds.carol,
      joinedAt: twoDaysAgo,
      lastReadAt: null,
    },
    {
      conversationId: designReview.id,
      userId: userIds.eve,
      joinedAt: twoDaysAgo,
      lastReadAt: new Date(now.getTime() - 5 * 60 * 60 * 1000),
    },
  ];

  await db.insert(conversationParticipants).values(participantData);

  console.log('✅ Created conversation participants');

  // Create messages for Team Standup (17 messages over 5 days)
  const teamStandupMessages = [
    {
      conversationId: teamStandup.id,
      senderId: userIds.alice,
      content: 'Good morning team! Let\'s start our daily standup.',
      messageType: 'text',
      metadata: null,
      createdAt: new Date(fiveDaysAgo.getTime() + 9 * 60 * 60 * 1000),
      updatedAt: new Date(fiveDaysAgo.getTime() + 9 * 60 * 60 * 1000),
      deletedAt: null,
    },
    {
      conversationId: teamStandup.id,
      senderId: userIds.bob,
      content: 'Yesterday I completed the API integration for user authentication. Today I\'ll work on the dashboard components.',
      messageType: 'text',
      metadata: null,
      createdAt: new Date(fiveDaysAgo.getTime() + 9 * 60 * 60 * 1000 + 2 * 60 * 1000),
      updatedAt: new Date(fiveDaysAgo.getTime() + 9 * 60 * 60 * 1000 + 2 * 60 * 1000),
      deletedAt: null,
    },
    {
      conversationId: teamStandup.id,
      senderId: userIds.carol,
      content: 'I finished the wireframes for the settings page. Moving on to high-fidelity mockups today.',
      messageType: 'text',
      metadata: null,
      createdAt: new Date(fiveDaysAgo.getTime() + 9 * 60 * 60 * 1000 + 5 * 60 * 1000),
      updatedAt: new Date(fiveDaysAgo.getTime() + 9 * 60 * 60 * 1000 + 5 * 60 * 1000),
      deletedAt: null,
    },
    {
      conversationId: teamStandup.id,
      senderId: userIds.david,
      content: 'Found a critical bug in the login flow - users can\'t reset passwords. Creating a ticket now.',
      messageType: 'task_mention',
      metadata: { taskId: 'TASK-123', taskTitle: 'Fix password reset flow' },
      createdAt: new Date(fiveDaysAgo.getTime() + 9 * 60 * 60 * 1000 + 7 * 60 * 1000),
      updatedAt: new Date(fiveDaysAgo.getTime() + 9 * 60 * 60 * 1000 + 7 * 60 * 1000),
      deletedAt: null,
    },
    {
      conversationId: teamStandup.id,
      senderId: userIds.eve,
      content: 'Thanks David! Bob, can you prioritize that fix? It\'s blocking our demo.',
      messageType: 'text',
      metadata: null,
      createdAt: new Date(fiveDaysAgo.getTime() + 9 * 60 * 60 * 1000 + 10 * 60 * 1000),
      updatedAt: new Date(fiveDaysAgo.getTime() + 9 * 60 * 60 * 1000 + 10 * 60 * 1000),
      deletedAt: null,
    },
    {
      conversationId: teamStandup.id,
      senderId: userIds.bob,
      content: 'On it! Should have it fixed by EOD.',
      messageType: 'text',
      metadata: null,
      createdAt: new Date(fiveDaysAgo.getTime() + 9 * 60 * 60 * 1000 + 12 * 60 * 1000),
      updatedAt: new Date(fiveDaysAgo.getTime() + 9 * 60 * 60 * 1000 + 12 * 60 * 1000),
      deletedAt: null,
    },
    {
      conversationId: teamStandup.id,
      senderId: userIds.alice,
      content: 'Great standup everyone! Let\'s crush it today 💪',
      messageType: 'text',
      metadata: null,
      createdAt: new Date(fiveDaysAgo.getTime() + 9 * 60 * 60 * 1000 + 15 * 60 * 1000),
      updatedAt: new Date(fiveDaysAgo.getTime() + 9 * 60 * 60 * 1000 + 15 * 60 * 1000),
      deletedAt: null,
    },
    {
      conversationId: teamStandup.id,
      senderId: userIds.bob,
      content: 'Password reset is fixed and deployed! Ready for testing.',
      messageType: 'text',
      metadata: null,
      createdAt: new Date(fiveDaysAgo.getTime() + 17 * 60 * 60 * 1000),
      updatedAt: new Date(fiveDaysAgo.getTime() + 17 * 60 * 60 * 1000),
      deletedAt: null,
    },
    {
      conversationId: teamStandup.id,
      senderId: userIds.david,
      content: 'Testing now. Will update the ticket shortly.',
      messageType: 'text',
      metadata: null,
      createdAt: new Date(fiveDaysAgo.getTime() + 17 * 60 * 60 * 1000 + 10 * 60 * 1000),
      updatedAt: new Date(fiveDaysAgo.getTime() + 17 * 60 * 60 * 1000 + 10 * 60 * 1000),
      deletedAt: null,
    },
    {
      conversationId: teamStandup.id,
      senderId: userIds.alice,
      content: 'Daily standup reminder! 9 AM in 10 minutes.',
      messageType: 'system',
      metadata: null,
      createdAt: new Date(fiveDaysAgo.getTime() + 24 * 60 * 60 * 1000 + 8 * 60 * 60 * 1000 + 50 * 60 * 1000),
      updatedAt: new Date(fiveDaysAgo.getTime() + 24 * 60 * 60 * 1000 + 8 * 60 * 60 * 1000 + 50 * 60 * 1000),
      deletedAt: null,
    },
    {
      conversationId: teamStandup.id,
      senderId: userIds.carol,
      content: 'Yesterday I completed the mockups. Today working on the component library updates.',
      messageType: 'text',
      metadata: null,
      createdAt: new Date(fiveDaysAgo.getTime() + 24 * 60 * 60 * 1000 + 9 * 60 * 60 * 1000),
      updatedAt: new Date(fiveDaysAgo.getTime() + 24 * 60 * 60 * 1000 + 9 * 60 * 60 * 1000),
      deletedAt: null,
    },
    {
      conversationId: teamStandup.id,
      senderId: userIds.eve,
      content: 'Quick reminder - sprint planning meeting tomorrow at 2 PM.',
      messageType: 'text',
      metadata: null,
      createdAt: new Date(fiveDaysAgo.getTime() + 24 * 60 * 60 * 1000 + 14 * 60 * 60 * 1000),
      updatedAt: new Date(fiveDaysAgo.getTime() + 24 * 60 * 60 * 1000 + 14 * 60 * 60 * 1000),
      deletedAt: null,
    },
    {
      conversationId: teamStandup.id,
      senderId: userIds.bob,
      content: 'Dashboard implementation is at 80%. Should be done by end of week.',
      messageType: 'text',
      metadata: null,
      createdAt: new Date(fiveDaysAgo.getTime() + 48 * 60 * 60 * 1000 + 9 * 60 * 60 * 1000),
      updatedAt: new Date(fiveDaysAgo.getTime() + 48 * 60 * 60 * 1000 + 9 * 60 * 60 * 1000),
      deletedAt: null,
    },
    {
      conversationId: teamStandup.id,
      senderId: userIds.david,
      content: 'Running regression tests on the latest build. Found 2 minor UI issues.',
      messageType: 'task_mention',
      metadata: { taskId: 'TASK-156', taskTitle: 'Fix dashboard alignment issues' },
      createdAt: new Date(fiveDaysAgo.getTime() + 48 * 60 * 60 * 1000 + 9 * 60 * 60 * 1000 + 5 * 60 * 1000),
      updatedAt: new Date(fiveDaysAgo.getTime() + 48 * 60 * 60 * 1000 + 9 * 60 * 60 * 1000 + 5 * 60 * 1000),
      deletedAt: null,
    },
    {
      conversationId: teamStandup.id,
      senderId: userIds.alice,
      content: 'Good progress everyone! Keep it up.',
      messageType: 'text',
      metadata: null,
      createdAt: new Date(fiveDaysAgo.getTime() + 72 * 60 * 60 * 1000 + 9 * 60 * 60 * 1000),
      updatedAt: new Date(fiveDaysAgo.getTime() + 72 * 60 * 60 * 1000 + 9 * 60 * 60 * 1000),
      deletedAt: null,
    },
    {
      conversationId: teamStandup.id,
      senderId: userIds.eve,
      content: 'Demo went great! Client is really happy with the progress.',
      messageType: 'text',
      metadata: null,
      createdAt: new Date(fiveDaysAgo.getTime() + 96 * 60 * 60 * 1000 + 15 * 60 * 60 * 1000),
      updatedAt: new Date(fiveDaysAgo.getTime() + 96 * 60 * 60 * 1000 + 15 * 60 * 60 * 1000),
      deletedAt: null,
    },
    {
      conversationId: teamStandup.id,
      senderId: userIds.bob,
      content: 'Dashboard is complete and deployed! Ready for QA.',
      messageType: 'text',
      metadata: null,
      createdAt: new Date(fiveDaysAgo.getTime() + 96 * 60 * 60 * 1000 + 16 * 60 * 60 * 1000),
      updatedAt: new Date(fiveDaysAgo.getTime() + 96 * 60 * 60 * 1000 + 16 * 60 * 60 * 1000),
      deletedAt: null,
    },
  ];

  await db.insert(messages).values(teamStandupMessages);

  console.log('✅ Created 17 messages for Team Standup');

  // Create messages for 1-on-1 (7 messages over 3 days)
  const oneOnOneMessages = [
    {
      conversationId: oneOnOne.id,
      senderId: userIds.alice,
      content: 'Hey Bob, do you have a few minutes to discuss sprint planning?',
      messageType: 'text',
      metadata: null,
      createdAt: new Date(threeDaysAgo.getTime() + 10 * 60 * 60 * 1000),
      updatedAt: new Date(threeDaysAgo.getTime() + 10 * 60 * 60 * 1000),
      deletedAt: null,
    },
    {
      conversationId: oneOnOne.id,
      senderId: userIds.bob,
      content: 'Sure! Let me finish this code review first, about 15 minutes?',
      messageType: 'text',
      metadata: null,
      createdAt: new Date(threeDaysAgo.getTime() + 10 * 60 * 60 * 1000 + 3 * 60 * 1000),
      updatedAt: new Date(threeDaysAgo.getTime() + 10 * 60 * 60 * 1000 + 3 * 60 * 1000),
      deletedAt: null,
    },
    {
      conversationId: oneOnOne.id,
      senderId: userIds.alice,
      content: 'Perfect! I want to discuss the API refactoring task for next sprint.',
      messageType: 'text',
      metadata: null,
      createdAt: new Date(threeDaysAgo.getTime() + 10 * 60 * 60 * 1000 + 20 * 60 * 1000),
      updatedAt: new Date(threeDaysAgo.getTime() + 10 * 60 * 60 * 1000 + 20 * 60 * 1000),
      deletedAt: null,
    },
    {
      conversationId: oneOnOne.id,
      senderId: userIds.bob,
      content: 'Great timing! I\'ve been thinking about that. I estimate it will take about 2 weeks.',
      messageType: 'text',
      metadata: null,
      createdAt: new Date(threeDaysAgo.getTime() + 10 * 60 * 60 * 1000 + 22 * 60 * 1000),
      updatedAt: new Date(threeDaysAgo.getTime() + 10 * 60 * 60 * 1000 + 22 * 60 * 1000),
      deletedAt: null,
    },
    {
      conversationId: oneOnOne.id,
      senderId: userIds.alice,
      content: 'That works. I\'ll add it to the sprint backlog. Can you write up the technical spec?',
      messageType: 'text',
      metadata: null,
      createdAt: new Date(threeDaysAgo.getTime() + 24 * 60 * 60 * 1000 + 11 * 60 * 60 * 1000),
      updatedAt: new Date(threeDaysAgo.getTime() + 24 * 60 * 60 * 1000 + 11 * 60 * 60 * 1000),
      deletedAt: null,
    },
    {
      conversationId: oneOnOne.id,
      senderId: userIds.bob,
      content: 'Already on it! I\'ll have the spec ready by tomorrow morning.',
      messageType: 'text',
      metadata: null,
      createdAt: new Date(threeDaysAgo.getTime() + 24 * 60 * 60 * 1000 + 11 * 60 * 60 * 1000 + 5 * 60 * 1000),
      updatedAt: new Date(threeDaysAgo.getTime() + 24 * 60 * 60 * 1000 + 11 * 60 * 60 * 1000 + 5 * 60 * 1000),
      deletedAt: null,
    },
    {
      conversationId: oneOnOne.id,
      senderId: userIds.alice,
      content: 'Awesome! Thanks Bob 👍',
      messageType: 'text',
      metadata: null,
      createdAt: new Date(threeDaysAgo.getTime() + 48 * 60 * 60 * 1000 + 9 * 60 * 60 * 1000),
      updatedAt: new Date(threeDaysAgo.getTime() + 48 * 60 * 60 * 1000 + 9 * 60 * 60 * 1000),
      deletedAt: null,
    },
  ];

  await db.insert(messages).values(oneOnOneMessages);

  console.log('✅ Created 7 messages for 1-on-1 conversation');

  // Create messages for Design Review (5 messages over 2 days)
  const designReviewMessages = [
    {
      conversationId: designReview.id,
      senderId: userIds.alice,
      content: 'Carol added Eve to the conversation',
      messageType: 'system',
      metadata: null,
      createdAt: new Date(twoDaysAgo.getTime() + 14 * 60 * 60 * 1000),
      updatedAt: new Date(twoDaysAgo.getTime() + 14 * 60 * 60 * 1000),
      deletedAt: null,
    },
    {
      conversationId: designReview.id,
      senderId: userIds.carol,
      content: 'Hi team! Ready to review the new dashboard designs. I\'ve uploaded them to Figma.',
      messageType: 'text',
      metadata: null,
      createdAt: new Date(twoDaysAgo.getTime() + 14 * 60 * 60 * 1000 + 2 * 60 * 1000),
      updatedAt: new Date(twoDaysAgo.getTime() + 14 * 60 * 60 * 1000 + 2 * 60 * 1000),
      deletedAt: null,
    },
    {
      conversationId: designReview.id,
      senderId: userIds.eve,
      content: 'Looking at them now! The color scheme is much better than v1.',
      messageType: 'text',
      metadata: null,
      createdAt: new Date(twoDaysAgo.getTime() + 14 * 60 * 60 * 1000 + 10 * 60 * 1000),
      updatedAt: new Date(twoDaysAgo.getTime() + 14 * 60 * 60 * 1000 + 10 * 60 * 1000),
      deletedAt: null,
    },
    {
      conversationId: designReview.id,
      senderId: userIds.alice,
      content: 'Agreed! The spacing feels more balanced too. One question - can we make the CTAs more prominent?',
      messageType: 'text',
      metadata: null,
      createdAt: new Date(twoDaysAgo.getTime() + 14 * 60 * 60 * 1000 + 15 * 60 * 1000),
      updatedAt: new Date(twoDaysAgo.getTime() + 14 * 60 * 60 * 1000 + 15 * 60 * 1000),
      deletedAt: null,
    },
    {
      conversationId: designReview.id,
      senderId: userIds.carol,
      content: 'Good point! I\'ll update the button styles and share v2 tomorrow.',
      messageType: 'task_mention',
      metadata: { taskId: 'DESIGN-42', taskTitle: 'Update dashboard CTA button styles' },
      createdAt: new Date(twoDaysAgo.getTime() + 24 * 60 * 60 * 1000 + 10 * 60 * 60 * 1000),
      updatedAt: new Date(twoDaysAgo.getTime() + 24 * 60 * 60 * 1000 + 10 * 60 * 60 * 1000),
      deletedAt: null,
    },
  ];

  await db.insert(messages).values(designReviewMessages);

  console.log('✅ Created 5 messages for Design Review');

  console.log('✅ Conversations seeder completed successfully');
}

main().catch((error) => {
  console.error('❌ Seeder failed:', error);
});