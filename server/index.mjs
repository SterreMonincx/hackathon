import dotenv from 'dotenv';
// Load local env first if present (for development), then default .env
dotenv.config({ path: '.env.local' });
dotenv.config();
import express from 'express';
import OpenAI from 'openai';

const app = express();
app.use(express.json());

const apiKey = process.env.OPENAI_API_KEY;
if (!apiKey) {
  // eslint-disable-next-line no-console
  console.warn('[warn] OPENAI_API_KEY is not set. Set it in .env.local or your environment.');
}

const openai = new OpenAI({ apiKey });

app.post('/api/chat', async (req, res) => {
  try {
    const { messages, prompt } = req.body || {};

    let chatMessages = [];
    if (Array.isArray(messages) && messages.length > 0) {
      chatMessages = messages.map((m) => ({
        role: m.isUser ? 'user' : 'assistant',
        content: typeof m.text === 'string' ? m.text : '',
      }));
    } else if (typeof prompt === 'string' && prompt.trim().length > 0) {
      chatMessages = [{ role: 'user', content: prompt }];
    } else {
      return res.status(400).json({ error: 'Missing messages or prompt' });
    }

    // Check if user is asking about Slack data
    const lastUserMessage = chatMessages[chatMessages.length - 1]?.content?.toLowerCase() || '';
    const isAskingAboutSlack = lastUserMessage.includes('slack') || 
                               lastUserMessage.includes('channel') || 
                               lastUserMessage.includes('message') ||
                               lastUserMessage.includes('conversation');

    let slackContext = '';
    if (isAskingAboutSlack && (slackUserToken || slackBotToken)) {
      try {
        // Try to fetch conversations
        const authHeader = getSlackAuthHeader();
        if (authHeader) {
          const params = new URLSearchParams({
            types: 'public_channel,private_channel,mpim,im',
            exclude_archived: 'true',
            limit: '50',
          });
          const resp = await fetch(`https://slack.com/api/conversations.list?${params.toString()}`, {
            headers: { ...authHeader },
          });
          const data = await resp.json();
          if (data.ok && data.channels) {
            const channels = data.channels.slice(0, 10).map(c => ({
              name: c.name || c.user || c.id,
              type: c.is_im ? 'dm' : c.is_mpim ? 'group' : c.is_private ? 'private' : 'public',
              unread: c.unread_count_display || 0
            }));
            slackContext = `\n\nYour Slack channels: ${channels.map(c => `${c.name} (${c.type})${c.unread > 0 ? ` - ${c.unread} unread` : ''}`).join(', ')}`;
          }
        }
      } catch (error) {
        console.error('[chat] Slack fetch error:', error);
        slackContext = '\n\nNote: I can see you have Slack connected, but I\'m having trouble accessing your channels right now. Please check your Slack app permissions.';
      }
    }

    const systemMessage = {
      role: 'system',
      content: `You are a helpful Slack assistant. Be concise and actionable.${slackContext}`,
    };

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [systemMessage, ...chatMessages].slice(-20),
      temperature: 0.7,
    });

    const text = completion.choices?.[0]?.message?.content ?? '';
    return res.json({ text });
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('[api/chat] error', error);
    return res.status(500).json({ error: 'Server error' });
  }
});

// ---- Slack OAuth + Data Endpoints ----
const runtimeSlack = {
  clientId: process.env.SLACK_CLIENT_ID || '',
  clientSecret: process.env.SLACK_CLIENT_SECRET || '',
  redirectUri: process.env.SLACK_REDIRECT_URI || '',
};
let slackUserToken = process.env.SLACK_USER_TOKEN || '';
let slackBotToken = process.env.SLACK_BOT_TOKEN || '';

app.get('/api/slack/status', async (_req, res) => {
  return res.json({
    connected: Boolean(slackUserToken || slackBotToken),
    hasConfig: Boolean(runtimeSlack.clientId && (runtimeSlack.clientSecret)),
  });
});

app.get('/api/slack/config', async (_req, res) => {
  return res.json({
    clientId: runtimeSlack.clientId ? 'set' : 'unset',
    clientSecret: runtimeSlack.clientSecret ? 'set' : 'unset',
    redirectUri: runtimeSlack.redirectUri || `https://aac34e6af4b7.ngrok-free.app/api/slack/oauth/callback`,
  });
});

app.post('/api/slack/config', async (req, res) => {
  try {
    const { clientId, clientSecret, redirectUri } = req.body || {};
    if (typeof clientId === 'string') runtimeSlack.clientId = clientId.trim();
    if (typeof clientSecret === 'string') runtimeSlack.clientSecret = clientSecret.trim();
    if (typeof redirectUri === 'string' && redirectUri.trim().length > 0) {
      runtimeSlack.redirectUri = redirectUri.trim();
    }
    return res.json({ ok: true });
  } catch (e) {
    return res.status(400).json({ error: 'Invalid config' });
  }
});

app.get('/api/slack/install', async (req, res) => {
  try {
    const redirect = runtimeSlack.redirectUri || `https://aac34e6af4b7.ngrok-free.app/api/slack/oauth/callback`;
    if (!runtimeSlack.clientId || !runtimeSlack.clientSecret) {
      return res.status(400).json({ error: 'Slack Client ID/Secret not configured. Open Settings and add both.' });
    }
    // Request basic scopes that are commonly available
    const botScopes = [
      'channels:read',
      'groups:read',
      'im:read',
      'mpim:read',
    ];
    // Request user scopes for reading message history
    const userScopes = [
      'users:read',
      'channels:history',
      'groups:history',
      'im:history',
      'mpim:history',
    ];
    const params = new URLSearchParams({
      client_id: runtimeSlack.clientId,
      scope: botScopes.join(','),
      user_scope: userScopes.join(','),
      redirect_uri: redirect,
    });
    const url = `https://slack.com/oauth/v2/authorize?${params.toString()}`;
    return res.redirect(url);
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('[slack/install] error', error);
    return res.status(500).json({ error: 'Slack install error' });
  }
});

app.get('/api/slack/oauth/callback', async (req, res) => {
  try {
    const code = req.query.code;
    if (!code) return res.status(400).send('Missing code');
    const redirect = runtimeSlack.redirectUri || `https://aac34e6af4b7.ngrok-free.app/api/slack/oauth/callback`;
    if (!runtimeSlack.clientId || !runtimeSlack.clientSecret) {
      return res.status(400).send('Slack OAuth not configured. Set client id/secret in settings.');
    }
    const body = new URLSearchParams({
      code: String(code),
      client_id: runtimeSlack.clientId,
      client_secret: runtimeSlack.clientSecret,
      redirect_uri: redirect,
    });
    const resp = await fetch('https://slack.com/api/oauth.v2.access', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body,
    });
    const json = await resp.json();
    if (!json.ok) {
      // eslint-disable-next-line no-console
      console.error('[slack/oauth] error', json);
          // Surface a simple error string for the frontend
    const code = encodeURIComponent(json.error || 'oauth_failed');
    return res.redirect(`http://localhost:5173/?oauth_error=${code}`);
    }
    // Prefer user token for reading user messages, fall back to bot token
    slackUserToken = json?.authed_user?.access_token || slackUserToken;
    slackBotToken = json?.access_token || slackBotToken;
    // Redirect back to the frontend app
    return res.redirect('http://localhost:5173/?slack_connected=true');
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('[slack/oauth/callback] error', error);
    return res.redirect('http://localhost:5173/?oauth_error=1');
  }
});

function getSlackAuthHeader() {
  const token = slackUserToken || slackBotToken;
  if (!token) return null;
  return { Authorization: `Bearer ${token}` };
}

app.get('/api/slack/conversations', async (req, res) => {
  try {
    const authHeader = getSlackAuthHeader();
    if (!authHeader) return res.status(401).json({ error: 'Not connected to Slack' });

    const params = new URLSearchParams({
      types: 'public_channel,private_channel,mpim,im',
      exclude_archived: 'true',
      limit: '1000',
    });
    const resp = await fetch(`https://slack.com/api/conversations.list?${params.toString()}`, {
      headers: { ...authHeader },
    });
    const data = await resp.json();
    if (!data.ok) return res.status(500).json({ error: data.error || 'Failed to list conversations' });

    const conversations = (data.channels || data.conversations || []).map((c) => {
      const isIm = Boolean(c.is_im);
      const isMpim = Boolean(c.is_mpim);
      const isPrivate = Boolean(c.is_private);
      let type = 'public';
      if (isIm) type = 'dm';
      else if (isMpim) type = 'group';
      else if (isPrivate) type = 'private';
      return {
        id: c.id,
        name: c.name || c.user || c.id,
        type,
        is_im: isIm,
        is_mpim: isMpim,
        is_private: isPrivate,
        unread_count_display: typeof c.unread_count_display === 'number' ? c.unread_count_display : 0,
        num_members: c.num_members,
      };
    });
    return res.json({ conversations });
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('[slack/conversations] error', error);
    return res.status(500).json({ error: 'Failed to fetch conversations' });
  }
});

app.get('/api/slack/messages/:channelId', async (req, res) => {
  try {
    const { channelId } = req.params;
    const authHeader = getSlackAuthHeader();
    if (!authHeader) return res.status(401).json({ error: 'Not connected to Slack' });

    // If we have a bot token, try to join the public channel to ensure history access
    if (slackBotToken) {
      try {
        await fetch('https://slack.com/api/conversations.join', {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded', Authorization: `Bearer ${slackBotToken}` },
          body: new URLSearchParams({ channel: channelId }),
        });
      } catch {}
    }

    // Fetch conversation history
    const histParams = new URLSearchParams({ channel: channelId, limit: '200', inclusive: 'true' });
    const histResp = await fetch(`https://slack.com/api/conversations.history?${histParams.toString()}`, {
      headers: { ...authHeader },
    });
    const hist = await histResp.json();
    if (!hist.ok) return res.status(500).json({ error: hist.error || 'Failed to fetch history' });

    // Fetch conversation info (may include unread_count_display)
    const infoResp = await fetch(`https://slack.com/api/conversations.info?channel=${encodeURIComponent(channelId)}`, {
      headers: { ...authHeader },
    });
    const info = await infoResp.json();
    const unreadCount = info?.channel?.unread_count_display ?? 0;
    const lastReadTs = info?.channel?.last_read ? Number(info.channel.last_read) : null;

    const raw = Array.isArray(hist.messages) ? hist.messages : [];
    const messages = raw.map((m, index) => {
      const tsNum = m.ts ? Number(m.ts) : 0;
      let isUnread = false;
      if (lastReadTs) {
        isUnread = tsNum > lastReadTs;
      } else if (unreadCount && unreadCount > 0) {
        // Mark the last N messages as unread when last_read is unavailable
        const startUnreadIndex = Math.max(0, raw.length - unreadCount);
        isUnread = index >= startUnreadIndex;
      }
      return {
        ts: m.ts,
        user: m.user || m.bot_id || 'unknown',
        text: m.text || '',
        subtype: m.subtype,
        is_unread: Boolean(isUnread),
      };
    });

    return res.json({ unread_count_display: unreadCount, last_read: info?.channel?.last_read || null, messages });
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('[slack/messages] error', error);
    return res.status(500).json({ error: 'Failed to fetch messages' });
  }
});

app.get('/api/slack/me', async (_req, res) => {
  try {
    const authHeader = getSlackAuthHeader();
    if (!authHeader) return res.status(401).json({ error: 'Not connected to Slack' });
    const resp = await fetch('https://slack.com/api/auth.test', { headers: { ...authHeader } });
    const data = await resp.json();
    if (!data.ok) return res.status(500).json({ error: data.error || 'auth.test failed' });
    return res.json({ user_id: data.user_id, user: data.user, team: data.team, url: data.url });
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('[slack/me] error', error);
    return res.status(500).json({ error: 'Failed to fetch user identity' });
  }
});

const port = process.env.PORT ? Number(process.env.PORT) : 8787;
app.listen(port, () => {
  // eslint-disable-next-line no-console
  console.log(`[api] listening on http://localhost:${port}`);
});


