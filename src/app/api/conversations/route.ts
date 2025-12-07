import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { conversations, conversationParticipants, messages, user, session, unreadMessages } from '@/db/schema';
import { eq, and, inArray, sql, desc, gt, ne } from 'drizzle-orm';

async function authenticateRequest(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }

  const token = authHeader.substring(7);
  
  try {
    const sessionRecord = await db.select()
      .from(session)
      .where(eq(session.token, token))
      .limit(1);

    if (sessionRecord.length === 0) {
      return null;
    }

    const userSession = sessionRecord[0];
    
    if (new Date(userSession.expiresAt) < new Date()) {
      return null;
    }

    return { id: userSession.userId };
  } catch (error) {
    console.error('Authentication error:', error);
    return null;
  }
}

export async function GET(request: NextRequest) {
  try {
    const authenticatedUser = await authenticateRequest(request);
    if (!authenticatedUser) {
      return NextResponse.json({ 
        error: 'Authentication required',
        code: 'UNAUTHORIZED' 
      }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const limit = Math.min(parseInt(searchParams.get('limit') ?? '20'), 50);
    const offset = parseInt(searchParams.get('offset') ?? '0');

    const userConversations = await db.select({
      conversationId: conversationParticipants.conversationId,
      userId: conversationParticipants.userId,
      joinedAt: conversationParticipants.joinedAt,
      lastReadAt: conversationParticipants.lastReadAt,
      convId: conversations.id,
      convName: conversations.name,
      convIsGroup: conversations.isGroup,
      convCreatedBy: conversations.createdBy,
      convCreatedAt: conversations.createdAt,
      convUpdatedAt: conversations.updatedAt,
    })
      .from(conversationParticipants)
      .innerJoin(conversations, eq(conversationParticipants.conversationId, conversations.id))
      .where(eq(conversationParticipants.userId, authenticatedUser.id))
      .orderBy(desc(conversations.updatedAt))
      .limit(limit)
      .offset(offset);

    const conversationIds = userConversations.map(c => c.conversationId);

    if (conversationIds.length === 0) {
      return NextResponse.json({ conversations: [] });
    }

    const allParticipants = await db.select({
      conversationId: conversationParticipants.conversationId,
      userId: conversationParticipants.userId,
      userName: user.name,
      userEmail: user.email,
    })
      .from(conversationParticipants)
      .innerJoin(user, eq(conversationParticipants.userId, user.id))
      .where(inArray(conversationParticipants.conversationId, conversationIds));

    const lastMessages = await db.select({
      conversationId: messages.conversationId,
      content: messages.content,
      createdAt: messages.createdAt,
      senderId: messages.senderId,
      senderName: user.name,
    })
      .from(messages)
      .innerJoin(user, eq(messages.senderId, user.id))
      .where(and(
        inArray(messages.conversationId, conversationIds),
        sql`${messages.deletedAt} IS NULL`
      ))
      .orderBy(desc(messages.createdAt));

    const lastMessageMap = new Map();
    lastMessages.forEach(msg => {
      if (!lastMessageMap.has(msg.conversationId)) {
        lastMessageMap.set(msg.conversationId, {
          content: msg.content,
          createdAt: msg.createdAt,
          senderName: msg.senderName,
        });
      }
    });

    // Query unread counts using unreadMessages table
    const unreadCounts = new Map();
    for (const convId of conversationIds) {
      const unreadQuery = await db
        .select({ count: sql<number>`count(*)` })
        .from(unreadMessages)
        .where(
          and(
            eq(unreadMessages.userId, authenticatedUser.id),
            eq(unreadMessages.conversationId, convId)
          )
        );

      unreadCounts.set(convId, Number(unreadQuery[0]?.count ?? 0));
    }

    const participantsByConversation = new Map();
    allParticipants.forEach(p => {
      if (!participantsByConversation.has(p.conversationId)) {
        participantsByConversation.set(p.conversationId, []);
      }
      participantsByConversation.get(p.conversationId).push({
        id: p.userId,
        name: p.userName,
        email: p.userEmail,
      });
    });

    const conversationsData = userConversations.map(conv => ({
      id: conv.convId,
      name: conv.convName,
      isGroup: conv.convIsGroup,
      participants: participantsByConversation.get(conv.conversationId) || [],
      lastMessage: lastMessageMap.get(conv.conversationId) || null,
      unreadCount: unreadCounts.get(conv.conversationId) || 0,
      createdAt: conv.convCreatedAt,
      updatedAt: conv.convUpdatedAt,
    }));

    return NextResponse.json({ conversations: conversationsData });

  } catch (error) {
    console.error('GET error:', error);
    return NextResponse.json({ 
      error: 'Internal server error: ' + (error as Error).message 
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const authenticatedUser = await authenticateRequest(request);
    if (!authenticatedUser) {
      return NextResponse.json({ 
        error: 'Authentication required',
        code: 'UNAUTHORIZED' 
      }, { status: 401 });
    }

    const body = await request.json();
    const { participantIds, name, isGroup } = body;

    if (!participantIds || !Array.isArray(participantIds) || participantIds.length === 0) {
      return NextResponse.json({ 
        error: 'participantIds must be a non-empty array',
        code: 'INVALID_PARTICIPANTS' 
      }, { status: 400 });
    }

    const isGroupChat = isGroup === true;

    if (!isGroupChat && participantIds.length !== 1) {
      return NextResponse.json({ 
        error: '1-on-1 conversations must have exactly 1 participant (excluding creator)',
        code: 'INVALID_PARTICIPANT_COUNT' 
      }, { status: 400 });
    }

    if (isGroupChat && participantIds.length < 2) {
      return NextResponse.json({ 
        error: 'Group conversations must have at least 2 participants (excluding creator)',
        code: 'INVALID_PARTICIPANT_COUNT' 
      }, { status: 400 });
    }

    if (isGroupChat && !name) {
      return NextResponse.json({ 
        error: 'Group conversations require a name',
        code: 'MISSING_GROUP_NAME' 
      }, { status: 400 });
    }

    const allParticipantIds = [...new Set([...participantIds, authenticatedUser.id])];

    const existingUsers = await db.select({ id: user.id })
      .from(user)
      .where(inArray(user.id, allParticipantIds));

    if (existingUsers.length !== allParticipantIds.length) {
      return NextResponse.json({ 
        error: 'One or more participant user IDs do not exist',
        code: 'INVALID_USER_IDS' 
      }, { status: 400 });
    }

    if (!isGroupChat) {
      const twoUserIds = [authenticatedUser.id, participantIds[0]].sort();

      const existingConversations = await db.select({
        conversationId: conversationParticipants.conversationId,
      })
        .from(conversationParticipants)
        .where(inArray(conversationParticipants.userId, twoUserIds))
        .groupBy(conversationParticipants.conversationId)
        .having(sql`count(distinct ${conversationParticipants.userId}) = 2`);

      if (existingConversations.length > 0) {
        for (const existingConv of existingConversations) {
          const allParticipantsInConv = await db.select({
            userId: conversationParticipants.userId,
          })
            .from(conversationParticipants)
            .where(eq(conversationParticipants.conversationId, existingConv.conversationId));

          if (allParticipantsInConv.length === 2) {
            const participantUserIds = allParticipantsInConv.map(p => p.userId).sort();
            if (JSON.stringify(participantUserIds) === JSON.stringify(twoUserIds)) {
              const existingConvData = await db.select()
                .from(conversations)
                .where(eq(conversations.id, existingConv.conversationId))
                .limit(1);

              if (existingConvData.length > 0 && !existingConvData[0].isGroup) {
                const participantsData = await db.select({
                  userId: conversationParticipants.userId,
                  userName: user.name,
                  userEmail: user.email,
                })
                  .from(conversationParticipants)
                  .innerJoin(user, eq(conversationParticipants.userId, user.id))
                  .where(eq(conversationParticipants.conversationId, existingConv.conversationId));

                return NextResponse.json({ 
                  error: 'Conversation already exists between these users',
                  code: 'CONVERSATION_EXISTS',
                  existingConversation: {
                    id: existingConvData[0].id,
                    name: existingConvData[0].name,
                    isGroup: existingConvData[0].isGroup,
                    participants: participantsData.map(p => ({
                      id: p.userId,
                      name: p.userName,
                      email: p.userEmail,
                    })),
                    createdBy: existingConvData[0].createdBy,
                    createdAt: existingConvData[0].createdAt,
                    updatedAt: existingConvData[0].updatedAt,
                  }
                }, { status: 409 });
              }
            }
          }
        }
      }
    }

    const now = new Date();
    const newConversation = await db.insert(conversations)
      .values({
        name: name || null,
        isGroup: isGroupChat,
        createdBy: authenticatedUser.id,
        createdAt: now,
        updatedAt: now,
      })
      .returning();

    const conversationId = newConversation[0].id;

    const participantRecords = allParticipantIds.map(userId => ({
      conversationId,
      userId,
      joinedAt: now,
      lastReadAt: null,
    }));

    await db.insert(conversationParticipants)
      .values(participantRecords);

    const participantsData = await db.select({
      userId: conversationParticipants.userId,
      userName: user.name,
      userEmail: user.email,
    })
      .from(conversationParticipants)
      .innerJoin(user, eq(conversationParticipants.userId, user.id))
      .where(eq(conversationParticipants.conversationId, conversationId));

    return NextResponse.json({
      id: newConversation[0].id,
      name: newConversation[0].name,
      isGroup: newConversation[0].isGroup,
      participants: participantsData.map(p => ({
        id: p.userId,
        name: p.userName,
        email: p.userEmail,
      })),
      createdBy: newConversation[0].createdBy,
      createdAt: newConversation[0].createdAt,
      updatedAt: newConversation[0].updatedAt,
    }, { status: 201 });

  } catch (error) {
    console.error('POST error:', error);
    return NextResponse.json({ 
      error: 'Internal server error: ' + (error as Error).message 
    }, { status: 500 });
  }
}