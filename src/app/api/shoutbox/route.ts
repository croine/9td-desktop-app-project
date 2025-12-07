import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { shouts, user, session, messageReactions, messageMentions, linkPreviews, pinnedMessages } from '@/db/schema';
import { eq, and, desc, inArray } from 'drizzle-orm';

async function authenticateRequest(request: NextRequest) {
  const authHeader = request.headers.get('Authorization');
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }

  const token = authHeader.substring(7);

  try {
    const sessions = await db.select()
      .from(session)
      .where(eq(session.token, token))
      .limit(1);

    if (sessions.length === 0) {
      return null;
    }

    const userSession = sessions[0];
    const now = new Date();

    if (userSession.expiresAt < now) {
      return null;
    }

    return userSession.userId;
  } catch (error) {
    console.error('Session authentication error:', error);
    return null;
  }
}

export async function GET(request: NextRequest) {
  try {
    const userId = await authenticateRequest(request);
    
    if (!userId) {
      return NextResponse.json(
        { error: 'Authentication required', code: 'UNAUTHORIZED' },
        { status: 401 }
      );
    }

    // Get shouts with user details
    const shoutsData = await db.select({
      id: shouts.id,
      message: shouts.message,
      replyToId: shouts.replyToId,
      editedAt: shouts.editedAt,
      attachmentUrl: shouts.attachmentUrl,
      attachmentType: shouts.attachmentType,
      attachmentName: shouts.attachmentName,
      gifUrl: shouts.gifUrl,
      gifTitle: shouts.gifTitle,
      gifProvider: shouts.gifProvider,
      voiceMessageUrl: shouts.voiceMessageUrl,
      voiceMessageDuration: shouts.voiceMessageDuration,
      voiceMessageWaveform: shouts.voiceMessageWaveform,
      isAnnouncement: shouts.isAnnouncement,
      announcementPriority: shouts.announcementPriority,
      createdAt: shouts.createdAt,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
      },
    })
      .from(shouts)
      .leftJoin(user, eq(shouts.userId, user.id))
      .where(eq(shouts.isDeleted, false))
      .orderBy(desc(shouts.createdAt))
      .limit(50);

    // Get all shout IDs
    const shoutIds = shoutsData.map(s => s.id);

    // Get all reactions for these shouts
    const reactionsData = await db.select({
      shoutId: messageReactions.shoutId,
      emoji: messageReactions.emoji,
      userId: messageReactions.userId,
      userName: user.name,
    })
      .from(messageReactions)
      .leftJoin(user, eq(messageReactions.userId, user.id))
      .where(inArray(messageReactions.shoutId, shoutIds));

    // Get all mentions for these shouts
    const mentionsData = await db.select({
      shoutId: messageMentions.shoutId,
      mentionedUserId: messageMentions.mentionedUserId,
    })
      .from(messageMentions)
      .where(inArray(messageMentions.shoutId, shoutIds));

    // Get link previews for these shouts
    const linkPreviewsData = await db.select({
      shoutId: linkPreviews.shoutId,
      url: linkPreviews.url,
      title: linkPreviews.title,
      description: linkPreviews.description,
      imageUrl: linkPreviews.imageUrl,
      siteName: linkPreviews.siteName,
    })
      .from(linkPreviews)
      .where(inArray(linkPreviews.shoutId, shoutIds));

    // Get pinned status for these shouts
    const pinnedData = await db.select({
      shoutId: pinnedMessages.shoutId,
      pinnedBy: pinnedMessages.pinnedBy,
      pinnedAt: pinnedMessages.pinnedAt,
      order: pinnedMessages.order,
    })
      .from(pinnedMessages)
      .where(inArray(pinnedMessages.shoutId, shoutIds));

    // Get reply-to shouts
    const replyToIds = shoutsData.filter(s => s.replyToId).map(s => s.replyToId!);
    let replyToData: any = {};
    
    if (replyToIds.length > 0) {
      const replyShouts = await db.select({
        id: shouts.id,
        message: shouts.message,
        userId: shouts.userId,
        userName: user.name,
        createdAt: shouts.createdAt,
      })
        .from(shouts)
        .leftJoin(user, eq(shouts.userId, user.id))
        .where(inArray(shouts.id, replyToIds));

      replyToData = Object.fromEntries(
        replyShouts.map(r => [r.id, {
          id: r.id,
          message: r.message,
          user: { id: r.userId, name: r.userName },
          createdAt: r.createdAt
        }])
      );
    }

    // Group reactions by shout and emoji
    const reactionsMap = new Map<number, Map<string, { count: number; users: any[]; hasReacted: boolean }>>();
    
    for (const reaction of reactionsData) {
      if (!reactionsMap.has(reaction.shoutId)) {
        reactionsMap.set(reaction.shoutId, new Map());
      }
      
      const emojiMap = reactionsMap.get(reaction.shoutId)!;
      
      if (!emojiMap.has(reaction.emoji)) {
        emojiMap.set(reaction.emoji, { count: 0, users: [], hasReacted: false });
      }
      
      const emojiData = emojiMap.get(reaction.emoji)!;
      emojiData.count++;
      emojiData.users.push({ id: reaction.userId, name: reaction.userName });
      
      if (reaction.userId === userId) {
        emojiData.hasReacted = true;
      }
    }

    // Group mentions by shout
    const mentionsMap = new Map<number, string[]>();
    
    for (const mention of mentionsData) {
      if (!mentionsMap.has(mention.shoutId)) {
        mentionsMap.set(mention.shoutId, []);
      }
      mentionsMap.get(mention.shoutId)!.push(mention.mentionedUserId);
    }

    // Group link previews by shout
    const linkPreviewsMap = new Map<number, any[]>();
    
    for (const preview of linkPreviewsData) {
      if (!linkPreviewsMap.has(preview.shoutId)) {
        linkPreviewsMap.set(preview.shoutId, []);
      }
      linkPreviewsMap.get(preview.shoutId)!.push({
        url: preview.url,
        title: preview.title,
        description: preview.description,
        imageUrl: preview.imageUrl,
        siteName: preview.siteName,
      });
    }

    // Map pinned status by shout
    const pinnedMap = new Map<number, any>();
    
    for (const pin of pinnedData) {
      pinnedMap.set(pin.shoutId, {
        pinnedBy: pin.pinnedBy,
        pinnedAt: pin.pinnedAt,
        order: pin.order,
      });
    }

    // Build final response
    const results = shoutsData.map(shout => ({
      id: shout.id,
      message: shout.message,
      replyTo: shout.replyToId ? replyToData[shout.replyToId] || null : null,
      editedAt: shout.editedAt,
      attachment: shout.attachmentUrl ? {
        url: shout.attachmentUrl,
        type: shout.attachmentType,
        name: shout.attachmentName,
      } : null,
      gif: shout.gifUrl ? {
        url: shout.gifUrl,
        title: shout.gifTitle,
        provider: shout.gifProvider,
      } : null,
      voiceMessage: shout.voiceMessageUrl ? {
        url: shout.voiceMessageUrl,
        duration: shout.voiceMessageDuration,
        waveform: shout.voiceMessageWaveform,
      } : null,
      isAnnouncement: shout.isAnnouncement,
      announcementPriority: shout.announcementPriority,
      createdAt: shout.createdAt,
      user: shout.user,
      reactions: Array.from(reactionsMap.get(shout.id)?.entries() || []).map(([emoji, data]) => ({
        emoji,
        count: data.count,
        users: data.users,
        hasReacted: data.hasReacted,
      })),
      mentions: mentionsMap.get(shout.id) || [],
      linkPreviews: linkPreviewsMap.get(shout.id) || [],
      pinned: pinnedMap.get(shout.id) || null,
    }));

    return NextResponse.json(results, { status: 200 });
  } catch (error) {
    console.error('GET error:', error);
    return NextResponse.json(
      { error: 'Internal server error: ' + (error instanceof Error ? error.message : 'Unknown error') },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const userId = await authenticateRequest(request);
    
    if (!userId) {
      return NextResponse.json(
        { error: 'Authentication required', code: 'UNAUTHORIZED' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { 
      message, 
      replyToId, 
      mentions, 
      attachmentUrl, 
      attachmentType, 
      attachmentName,
      gifUrl,
      gifTitle,
      gifProvider,
      voiceMessageUrl,
      voiceMessageDuration,
      voiceMessageWaveform,
      linkPreviewUrls
    } = body;

    if ('userId' in body || 'user_id' in body) {
      return NextResponse.json(
        { 
          error: 'User ID cannot be provided in request body',
          code: 'USER_ID_NOT_ALLOWED' 
        },
        { status: 400 }
      );
    }

    if (!message) {
      return NextResponse.json(
        { error: 'Message is required', code: 'MISSING_MESSAGE' },
        { status: 400 }
      );
    }

    if (typeof message !== 'string') {
      return NextResponse.json(
        { error: 'Message must be a string', code: 'INVALID_MESSAGE_TYPE' },
        { status: 400 }
      );
    }

    const trimmedMessage = message.trim();

    if (trimmedMessage.length === 0) {
      return NextResponse.json(
        { error: 'Message cannot be empty', code: 'EMPTY_MESSAGE' },
        { status: 400 }
      );
    }

    if (trimmedMessage.length > 500) {
      return NextResponse.json(
        { error: 'Message length must not exceed 500 characters', code: 'MESSAGE_TOO_LONG' },
        { status: 400 }
      );
    }

    // Validate GIF fields if provided
    if (gifUrl) {
      if (typeof gifUrl !== 'string' || gifUrl.trim() === '') {
        return NextResponse.json(
          { error: 'gifUrl must be a non-empty string', code: 'INVALID_GIF_URL' },
          { status: 400 }
        );
      }
      
      if (gifProvider && !['giphy', 'tenor'].includes(gifProvider)) {
        return NextResponse.json(
          { error: 'gifProvider must be either "giphy" or "tenor"', code: 'INVALID_GIF_PROVIDER' },
          { status: 400 }
        );
      }
    }

    // Validate voice message fields if provided
    if (voiceMessageUrl) {
      if (typeof voiceMessageUrl !== 'string' || voiceMessageUrl.trim() === '') {
        return NextResponse.json(
          { error: 'voiceMessageUrl must be a non-empty string', code: 'INVALID_VOICE_URL' },
          { status: 400 }
        );
      }
      
      if (voiceMessageDuration !== undefined && (typeof voiceMessageDuration !== 'number' || voiceMessageDuration <= 0)) {
        return NextResponse.json(
          { error: 'voiceMessageDuration must be a positive number', code: 'INVALID_VOICE_DURATION' },
          { status: 400 }
        );
      }
      
      if (voiceMessageWaveform && typeof voiceMessageWaveform !== 'string') {
        return NextResponse.json(
          { error: 'voiceMessageWaveform must be a JSON string', code: 'INVALID_VOICE_WAVEFORM' },
          { status: 400 }
        );
      }
    }

    // Validate replyToId if provided
    if (replyToId !== undefined && replyToId !== null) {
      if (typeof replyToId !== 'number' || isNaN(replyToId)) {
        return NextResponse.json(
          { error: 'replyToId must be a valid number', code: 'INVALID_REPLY_TO_ID' },
          { status: 400 }
        );
      }

      const replyShout = await db.select()
        .from(shouts)
        .where(and(eq(shouts.id, replyToId), eq(shouts.isDeleted, false)))
        .limit(1);

      if (replyShout.length === 0) {
        return NextResponse.json(
          { error: 'Reply-to shout not found', code: 'REPLY_TO_NOT_FOUND' },
          { status: 404 }
        );
      }
    }

    // Validate mentions if provided
    if (mentions !== undefined && mentions !== null) {
      if (!Array.isArray(mentions)) {
        return NextResponse.json(
          { error: 'Mentions must be an array', code: 'INVALID_MENTIONS' },
          { status: 400 }
        );
      }

      if (mentions.length > 0) {
        const validUsers = await db.select({ id: user.id })
          .from(user)
          .where(inArray(user.id, mentions));

        if (validUsers.length !== mentions.length) {
          return NextResponse.json(
            { error: 'One or more mentioned users not found', code: 'INVALID_MENTIONED_USERS' },
            { status: 400 }
          );
        }
      }
    }

    // Validate attachment fields
    if (attachmentUrl && (!attachmentType || !attachmentName)) {
      return NextResponse.json(
        { error: 'attachmentType and attachmentName required when attachmentUrl provided', code: 'INCOMPLETE_ATTACHMENT' },
        { status: 400 }
      );
    }

    const now = new Date();
    const newShout = await db.insert(shouts)
      .values({
        userId,
        message: trimmedMessage,
        replyToId: replyToId || null,
        attachmentUrl: attachmentUrl || null,
        attachmentType: attachmentType || null,
        attachmentName: attachmentName || null,
        gifUrl: gifUrl || null,
        gifTitle: gifTitle || null,
        gifProvider: gifProvider || null,
        voiceMessageUrl: voiceMessageUrl || null,
        voiceMessageDuration: voiceMessageDuration || null,
        voiceMessageWaveform: voiceMessageWaveform || null,
        createdAt: now,
        updatedAt: now,
        isDeleted: false,
      })
      .returning();

    if (newShout.length === 0) {
      return NextResponse.json(
        { error: 'Failed to create shout', code: 'INSERT_FAILED' },
        { status: 500 }
      );
    }

    // Create mention records if mentions provided
    if (mentions && mentions.length > 0) {
      const mentionRecords = mentions.map((mentionedUserId: string) => ({
        shoutId: newShout[0].id,
        mentionedUserId,
        mentionedByUserId: userId,
        isRead: false,
        createdAt: now,
      }));

      await db.insert(messageMentions).values(mentionRecords);
    }

    // Create link preview records if provided
    if (linkPreviewUrls && Array.isArray(linkPreviewUrls) && linkPreviewUrls.length > 0) {
      const linkPreviewRecords = linkPreviewUrls.map((preview: any) => ({
        shoutId: newShout[0].id,
        url: preview.url,
        title: preview.title || null,
        description: preview.description || null,
        imageUrl: preview.imageUrl || null,
        siteName: preview.siteName || null,
        createdAt: now,
      }));

      await db.insert(linkPreviews).values(linkPreviewRecords);
    }

    const createdShoutWithUser = await db.select({
      id: shouts.id,
      message: shouts.message,
      replyToId: shouts.replyToId,
      editedAt: shouts.editedAt,
      attachmentUrl: shouts.attachmentUrl,
      attachmentType: shouts.attachmentType,
      attachmentName: shouts.attachmentName,
      gifUrl: shouts.gifUrl,
      gifTitle: shouts.gifTitle,
      gifProvider: shouts.gifProvider,
      voiceMessageUrl: shouts.voiceMessageUrl,
      voiceMessageDuration: shouts.voiceMessageDuration,
      voiceMessageWaveform: shouts.voiceMessageWaveform,
      createdAt: shouts.createdAt,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
      },
    })
      .from(shouts)
      .leftJoin(user, eq(shouts.userId, user.id))
      .where(eq(shouts.id, newShout[0].id))
      .limit(1);

    if (createdShoutWithUser.length === 0) {
      return NextResponse.json(
        { error: 'Failed to retrieve created shout', code: 'RETRIEVAL_FAILED' },
        { status: 500 }
      );
    }

    const responseShout = {
      ...createdShoutWithUser[0],
      replyTo: null,
      attachment: createdShoutWithUser[0].attachmentUrl ? {
        url: createdShoutWithUser[0].attachmentUrl,
        type: createdShoutWithUser[0].attachmentType,
        name: createdShoutWithUser[0].attachmentName,
      } : null,
      gif: createdShoutWithUser[0].gifUrl ? {
        url: createdShoutWithUser[0].gifUrl,
        title: createdShoutWithUser[0].gifTitle,
        provider: createdShoutWithUser[0].gifProvider,
      } : null,
      voiceMessage: createdShoutWithUser[0].voiceMessageUrl ? {
        url: createdShoutWithUser[0].voiceMessageUrl,
        duration: createdShoutWithUser[0].voiceMessageDuration,
        waveform: createdShoutWithUser[0].voiceMessageWaveform,
      } : null,
      reactions: [],
      mentions: mentions || [],
      linkPreviews: linkPreviewUrls || [],
      pinned: null,
    };

    return NextResponse.json(responseShout, { status: 201 });
  } catch (error) {
    console.error('POST error:', error);
    return NextResponse.json(
      { error: 'Internal server error: ' + (error instanceof Error ? error.message : 'Unknown error') },
      { status: 500 }
    );
  }
}