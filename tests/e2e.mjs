import assert from 'node:assert/strict';
import { deflateSync } from 'node:zlib';
import { io } from 'socket.io-client';

const BASE_URL = process.env.BASE_URL ?? `http://localhost:${process.env.HTTP_PORT ?? 80}`;
const RUN_ID = Date.now().toString(36);
const DEMO_POST_ID = '10000000-0000-4000-8000-000000000001';

const CRC_TABLE = Array.from({ length: 256 }, (_, n) => {
  let c = n;
  for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  return c >>> 0;
});

function crc32(buffer) {
  let crc = 0xffffffff;
  for (const byte of buffer) crc = CRC_TABLE[(crc ^ byte) & 0xff] ^ (crc >>> 8);
  return (crc ^ 0xffffffff) >>> 0;
}

function pngChunk(type, data) {
  const length = Buffer.alloc(4);
  length.writeUInt32BE(data.length);
  const body = Buffer.concat([Buffer.from(type), data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(body));
  return Buffer.concat([length, body, crc]);
}

function png(width, height, [r, g, b]) {
  const header = Buffer.alloc(13);
  header.writeUInt32BE(width, 0);
  header.writeUInt32BE(height, 4);
  header.set([8, 2, 0, 0, 0], 8);
  const row = Buffer.concat([Buffer.from([0]), Buffer.from(Array.from({ length: width }, () => [r, g, b]).flat())]);
  const pixels = Buffer.concat(Array.from({ length: height }, () => row));
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    pngChunk('IHDR', header),
    pngChunk('IDAT', deflateSync(pixels)),
    pngChunk('IEND', Buffer.alloc(0)),
  ]);
}

function upload(buffer, type, filename, fields = {}) {
  const form = new FormData();
  form.append('file', new Blob([buffer], { type }), filename);
  for (const [key, value] of Object.entries(fields)) form.append(key, value);
  return form;
}

async function call(method, path, { cookie, body, form, headers = {}, expect } = {}) {
  const res = await fetch(`${BASE_URL}${path}`, {
    method,
    redirect: 'manual',
    headers: {
      ...(cookie ? { cookie } : {}),
      ...(body !== undefined ? { 'content-type': 'application/json' } : {}),
      ...headers,
    },
    body: form ?? (body !== undefined ? JSON.stringify(body) : undefined),
  });
  const text = await res.text();
  let data = text;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {}
  if (expect !== undefined && res.status !== expect) {
    throw new Error(`${method} ${path} returned ${res.status}, expected ${expect}: ${text.slice(0, 300)}`);
  }
  return { status: res.status, data, headers: res.headers, text };
}

const api = {
  get: (path, cookie, expect = 200) => call('GET', path, { cookie, expect }).then((r) => r.data),
  post: (path, cookie, body, expect = 201) => call('POST', path, { cookie, body, expect }).then((r) => r.data),
  patch: (path, cookie, body, expect = 200) => call('PATCH', path, { cookie, body, expect }).then((r) => r.data),
  delete: (path, cookie, expect = 204) => call('DELETE', path, { cookie, expect }).then((r) => r.data),
  upload: (path, cookie, form, expect = 201) => call('POST', path, { cookie, form, expect }).then((r) => r.data),
};

function sessionCookie(res) {
  const cookie = res.headers.getSetCookie().find((c) => c.startsWith('access_token='));
  assert.ok(cookie, 'response should set the access_token cookie');
  assert.match(cookie, /HttpOnly/i, 'session cookie must be HttpOnly');
  return cookie.split(';')[0];
}

async function login(loginValue, password) {
  return sessionCookie(await call('POST', '/api/auth/login', { body: { login: loginValue, password }, expect: 200 }));
}

async function register(username) {
  const res = await call('POST', '/api/auth/register', {
    body: { email: `${username}@example.com`, password: 'secret123', username, name: `Test ${username}` },
    expect: 201,
  });
  const cookie = sessionCookie(res);
  return { cookie, id: res.data.id, username };
}

function connectSocket(cookie) {
  return new Promise((resolve, reject) => {
    const socket = io(BASE_URL, {
      transports: ['websocket'],
      extraHeaders: cookie ? { cookie } : {},
      reconnection: false,
      timeout: 5000,
    });
    socket.once('connect', () => resolve(socket));
    socket.once('connect_error', reject);
  });
}

function nextEvent(socket, event, predicate = () => true, timeout = 10_000) {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      socket.off(event, handler);
      reject(new Error(`Timed out waiting for socket event "${event}"`));
    }, timeout);
    function handler(payload) {
      if (!predicate(payload)) return;
      clearTimeout(timer);
      socket.off(event, handler);
      resolve(payload);
    }
    socket.on(event, handler);
  });
}

const results = [];
async function step(name, fn) {
  const started = Date.now();
  try {
    await fn();
    results.push({ name, ok: true });
    console.log(`  ✓ ${name} \x1b[2m(${Date.now() - started}ms)\x1b[0m`);
  } catch (err) {
    results.push({ name, ok: false });
    console.error(`  ✗ ${name}\n    ${err.stack ?? err}`);
    throw err;
  }
}

const ctx = {};
const sockets = [];

async function run() {
  console.log(`Running end-to-end tests against ${BASE_URL}\n`);

  console.log('Infrastructure');
  await step('nginx and gateway health checks respond', async () => {
    assert.equal((await call('GET', '/nginx-health', { expect: 200 })).text, 'ok');
    assert.deepEqual(await api.get('/api/health'), { status: 'ok' });
  });

  await step('demo media is served by nginx', async () => {
    const res = await fetch(`${BASE_URL}/media/posts/demo/demo-post-01.webp`);
    assert.equal(res.status, 200);
    assert.equal(res.headers.get('content-type'), 'image/webp');
  });

  console.log('\nAuth service');
  await step('protected endpoints reject anonymous requests', async () => {
    await call('GET', '/api/users/me', { expect: 401 });
    await call('GET', '/api/posts/feed', { expect: 401 });
  });

  await step('spoofed x-user-id headers are ignored by the gateway', async () => {
    await call('GET', '/api/users/me', { headers: { 'x-user-id': '00000000-0000-4000-8000-000000000001' }, expect: 401 });
  });

  await step('demo user logs in with username and with email', async () => {
    ctx.alex = { cookie: await login('alex_morgan', 'demo1234'), id: '00000000-0000-4000-8000-000000000001' };
    await login('ALEX.MORGAN@example.com', 'demo1234');
  });

  await step('wrong password and unknown user are rejected', async () => {
    await call('POST', '/api/auth/login', { body: { login: 'alex_morgan', password: 'nope' }, expect: 401 });
    await call('POST', '/api/auth/login', { body: { login: `ghost_${RUN_ID}`, password: 'nope1234' }, expect: 401 });
  });

  await step('new users can register and receive a session', async () => {
    ctx.a = await register(`amy_${RUN_ID}`);
    ctx.b = await register(`ben_${RUN_ID}`);
    const account = await api.get('/api/auth/me', ctx.a.cookie);
    assert.equal(account.email, `${ctx.a.username}@example.com`);
  });

  await step('registration validates input and uniqueness', async () => {
    const base = { password: 'secret123', name: 'Dup' };
    await call('POST', '/api/auth/register', {
      body: { ...base, email: `dup_${RUN_ID}@example.com`, username: ctx.a.username },
      expect: 409,
    });
    await call('POST', '/api/auth/register', {
      body: { ...base, email: `${ctx.a.username}@example.com`, username: `fresh_${RUN_ID}` },
      expect: 409,
    });
    await call('POST', '/api/auth/register', {
      body: { ...base, email: `bad_${RUN_ID}@example.com`, username: 'no spaces allowed' },
      expect: 400,
    });
    await call('POST', '/api/auth/register', {
      body: { email: `short_${RUN_ID}@example.com`, username: `short_${RUN_ID}`, password: '123' },
      expect: 400,
    });
    await login(`fresh_${RUN_ID}`, 'secret123').then(
      () => assert.fail('a failed registration must not leave a usable account'),
      () => undefined,
    );
  });

  await step('internal service endpoints are not reachable through the gateway', async () => {
    await call('GET', `/api/internal/users?ids=${ctx.a.id}`, { cookie: ctx.a.cookie, expect: 404 });
  });

  console.log('\nUser service');
  await step('current user profile is returned', async () => {
    const me = await api.get('/api/users/me', ctx.a.cookie);
    assert.equal(me.id, ctx.a.id);
    assert.equal(me.username, ctx.a.username);
    assert.equal(me.followersCount, 0);
  });

  await step('profile can be updated and usernames stay unique', async () => {
    const updated = await api.patch('/api/users/me', ctx.a.cookie, { name: 'Amy Adams', bio: 'Hello there', subtitle: '' });
    assert.equal(updated.name, 'Amy Adams');
    assert.equal(updated.bio, 'Hello there');
    assert.equal(updated.subtitle, null);
    await call('PATCH', '/api/users/me', { cookie: ctx.a.cookie, body: { username: 'alex_morgan' }, expect: 409 });
    await call('PATCH', '/api/users/me', { cookie: ctx.a.cookie, body: { bio: 'x'.repeat(151) }, expect: 400 });
  });

  await step('avatar upload is processed and served', async () => {
    const me = await api.upload('/api/users/me/avatar', ctx.a.cookie, upload(png(64, 64, [255, 0, 0]), 'image/png', 'a.png'));
    assert.match(me.avatar, new RegExp(`^profiles/${ctx.a.id}/.+\\.webp$`));
    const res = await fetch(`${BASE_URL}/media/${me.avatar}`);
    assert.equal(res.status, 200);
    assert.equal(res.headers.get('content-type'), 'image/webp');
    await call('POST', '/api/users/me/avatar', {
      cookie: ctx.a.cookie,
      form: upload(Buffer.from('not an image'), 'image/png', 'bad.png'),
      expect: 400,
    });
  });

  await step('user search and suggestions work', async () => {
    const results = await api.get('/api/users/search?q=ALEX', ctx.a.cookie);
    assert.ok(results.some((u) => u.username === 'alex_morgan'));
    assert.deepEqual(Object.keys(results[0]).sort(), ['avatar', 'id', 'name', 'username']);
    assert.deepEqual(await api.get('/api/users/search?q=', ctx.a.cookie), []);
    const suggestions = await api.get('/api/users/suggestions', ctx.a.cookie);
    assert.ok(suggestions.length > 0 && suggestions.every((u) => u.id !== ctx.a.id));
  });

  await step('public profiles load by username', async () => {
    const alex = await api.get('/api/users/alex_morgan', ctx.a.cookie);
    assert.equal(alex.id, ctx.alex.id);
    assert.equal(alex.isFollowing, false);
    assert.ok(alex.followersCount >= 2);
    await call('GET', `/api/users/nobody_${RUN_ID}`, { cookie: ctx.a.cookie, expect: 404 });
  });

  console.log('\nRealtime + follows');
  await step('websocket rejects anonymous clients and accepts sessions', async () => {
    const anonymous = io(BASE_URL, { transports: ['websocket'], reconnection: false });
    await nextEvent(anonymous, 'disconnect', () => true, 5000);
    anonymous.close();
    ctx.socketA = await connectSocket(ctx.a.cookie);
    ctx.socketB = await connectSocket(ctx.b.cookie);
    sockets.push(ctx.socketA, ctx.socketB);
  });

  await step('following creates a realtime follow notification', async () => {
    const notified = nextEvent(ctx.socketA, 'notification', (n) => n.type === 'follow' && n.actor.id === ctx.b.id);
    await api.post(`/api/users/${ctx.a.id}/follow`, ctx.b.cookie, undefined, 204);
    await api.post(`/api/users/${ctx.a.id}/follow`, ctx.b.cookie, undefined, 204);
    const notification = await notified;
    assert.equal(notification.actor.username, ctx.b.username);
    const profile = await api.get(`/api/users/${ctx.a.username}`, ctx.b.cookie);
    assert.equal(profile.isFollowing, true);
    assert.equal(profile.followersCount, 1);
    await call('POST', `/api/users/${ctx.b.id}/follow`, { cookie: ctx.b.cookie, expect: 400 });
    await call('POST', '/api/users/00000000-0000-4000-8000-00000000abcd/follow', { cookie: ctx.b.cookie, expect: 404 });
  });

  console.log('\nPost service');
  await step('posts are created with processed media', async () => {
    ctx.post = await api.upload(
      '/api/posts',
      ctx.a.cookie,
      upload(png(1600, 900, [0, 128, 255]), 'image/png', 'photo.png', { caption: '  First post! ', location: 'Lisbon' }),
    );
    assert.equal(ctx.post.caption, 'First post!');
    assert.equal(ctx.post.location, 'Lisbon');
    assert.equal(ctx.post.mediaType, 'image');
    assert.equal(ctx.post.author.username, ctx.a.username);
    assert.equal(ctx.post.likesCount, 0);
    const media = await fetch(`${BASE_URL}/media/${ctx.post.mediaPath}`);
    assert.equal(media.status, 200);
    assert.equal(media.headers.get('content-type'), 'image/webp');
  });

  await step('invalid uploads are rejected', async () => {
    await call('POST', '/api/posts', { cookie: ctx.a.cookie, form: new FormData(), expect: 400 });
    await call('POST', '/api/posts', {
      cookie: ctx.a.cookie,
      form: upload(Buffer.from('hello'), 'text/plain', 'a.txt'),
      expect: 400,
    });
  });

  await step('videos are accepted as posts', async () => {
    const video = await api.upload('/api/posts', ctx.a.cookie, upload(Buffer.from('fake-mp4-bytes'), 'video/mp4', 'clip.mp4'));
    assert.equal(video.mediaType, 'video');
    assert.match(video.mediaPath, /^videos\/\d{4}\/\d{2}\/.+\.mp4$/);
    await api.delete(`/api/posts/${video.id}`, ctx.a.cookie);
  });

  await step('feed contains posts from followed users and self', async () => {
    const feedB = await api.get('/api/posts/feed', ctx.b.cookie);
    assert.equal(feedB.data[0].id, ctx.post.id);
    const feedA = await api.get('/api/posts/feed', ctx.a.cookie);
    assert.equal(feedA.data[0].id, ctx.post.id);
    const alexFeed = await api.get('/api/posts/feed', ctx.alex.cookie);
    assert.ok(!alexFeed.data.some((p) => p.id === ctx.post.id));
  });

  await step('explore paginates with cursors and excludes own posts', async () => {
    const first = await api.get('/api/posts/explore?limit=4', ctx.a.cookie);
    assert.equal(first.data.length, 4);
    assert.ok(first.nextCursor);
    assert.ok(first.data.every((p) => p.userId !== ctx.a.id));
    const second = await api.get(`/api/posts/explore?limit=4&cursor=${first.nextCursor}`, ctx.a.cookie);
    assert.equal(second.data.length, 4);
    const ids = new Set([...first.data, ...second.data].map((p) => p.id));
    assert.equal(ids.size, 8);
    assert.ok(new Date(first.data[3].createdAt) >= new Date(second.data[0].createdAt));
    await call('GET', '/api/posts/explore?limit=500', { cookie: ctx.a.cookie, expect: 400 });
  });

  await step('likes update counts and notify the author', async () => {
    const notified = nextEvent(ctx.socketA, 'notification', (n) => n.type === 'like' && n.postId === ctx.post.id);
    await api.post(`/api/posts/${ctx.post.id}/like`, ctx.b.cookie, undefined, 204);
    await api.post(`/api/posts/${ctx.post.id}/like`, ctx.b.cookie, undefined, 204);
    await notified;
    const asAuthor = await api.get(`/api/posts/${ctx.post.id}`, ctx.a.cookie);
    assert.equal(asAuthor.likesCount, 1);
    assert.equal(asAuthor.isLiked, false);
    const asLiker = await api.get(`/api/posts/${ctx.post.id}`, ctx.b.cookie);
    assert.equal(asLiker.isLiked, true);
    await api.delete(`/api/posts/${ctx.post.id}/like`, ctx.b.cookie);
    assert.equal((await api.get(`/api/posts/${ctx.post.id}`, ctx.b.cookie)).likesCount, 0);
    await api.post(`/api/posts/${ctx.post.id}/like`, ctx.b.cookie, undefined, 204);
  });

  await step('comments are stored with authors and notify the author', async () => {
    const notified = nextEvent(ctx.socketA, 'notification', (n) => n.type === 'comment' && n.postId === ctx.post.id);
    const comment = await api.post(`/api/posts/${ctx.post.id}/comments`, ctx.b.cookie, { text: 'Great shot!' });
    assert.equal(comment.text, 'Great shot!');
    assert.equal(comment.author.id, ctx.b.id);
    assert.equal((await notified).text, 'Great shot!');
    await call('POST', `/api/posts/${ctx.post.id}/comments`, { cookie: ctx.b.cookie, body: { text: '   ' }, expect: 400 });
    const detail = await api.get(`/api/posts/${ctx.post.id}`, ctx.a.cookie);
    assert.equal(detail.commentsCount, 1);
    assert.equal(detail.comments[0].author.username, ctx.b.username);
  });

  await step('bookmarks are private to each user', async () => {
    await api.post(`/api/posts/${ctx.post.id}/bookmark`, ctx.b.cookie, undefined, 204);
    const saved = await api.get('/api/posts/bookmarked', ctx.b.cookie);
    assert.deepEqual(saved.data.map((p) => p.id), [ctx.post.id]);
    assert.equal(saved.data[0].isBookmarked, true);
    assert.equal((await api.get('/api/posts/bookmarked', ctx.a.cookie)).data.length, 0);
    await api.delete(`/api/posts/${ctx.post.id}/bookmark`, ctx.b.cookie);
    assert.equal((await api.get('/api/posts/bookmarked', ctx.b.cookie)).data.length, 0);
  });

  await step("user post lists include totals", async () => {
    const posts = await api.get(`/api/posts/user/${ctx.a.id}`, ctx.b.cookie);
    assert.equal(posts.total, 1);
    assert.equal(posts.data[0].id, ctx.post.id);
    await call('GET', `/api/posts/${DEMO_POST_ID.replace('1', '9')}`, { cookie: ctx.a.cookie, expect: 404 });
    await call('GET', '/api/posts/not-a-uuid', { cookie: ctx.a.cookie, expect: 400 });
  });

  console.log('\nNotification service');
  await step('notifications list, unread count and mark-as-read', async () => {
    const list = await api.get('/api/notifications', ctx.a.cookie);
    const types = list.map((n) => n.type);
    assert.ok(types.includes('follow') && types.includes('like') && types.includes('comment'), `got ${types}`);
    assert.ok(list.every((n) => n.actor.id === ctx.b.id));
    assert.ok((await api.get('/api/notifications/unread-count', ctx.a.cookie)).count >= 3);
    await api.post('/api/notifications/read', ctx.a.cookie, undefined, 204);
    assert.equal((await api.get('/api/notifications/unread-count', ctx.a.cookie)).count, 0);
  });

  await step('direct messages are delivered in realtime', async () => {
    const { id } = await api.post('/api/messages/conversations', ctx.a.cookie, { userId: ctx.b.id });
    const again = await api.post('/api/messages/conversations', ctx.b.cookie, { userId: ctx.a.id });
    assert.equal(again.id, id);
    ctx.conversationId = id;

    const received = nextEvent(ctx.socketB, 'message', (m) => m.conversationId === id);
    const sent = await api.post(`/api/messages/conversations/${id}/messages`, ctx.a.cookie, { text: 'Hi Ben!' });
    assert.equal((await received).id, sent.id);

    const conversations = await api.get('/api/messages/conversations', ctx.b.cookie);
    const conversation = conversations.find((c) => c.id === id);
    assert.equal(conversation.participant.id, ctx.a.id);
    assert.equal(conversation.unreadCount, 1);
    assert.equal(conversation.lastMessage.text, 'Hi Ben!');

    await api.post(`/api/messages/conversations/${id}/read`, ctx.b.cookie, undefined, 204);
    const afterRead = await api.get('/api/messages/conversations', ctx.b.cookie);
    assert.equal(afterRead.find((c) => c.id === id).unreadCount, 0);
    const messages = await api.get(`/api/messages/conversations/${id}/messages`, ctx.b.cookie);
    assert.deepEqual(messages.map((m) => m.text), ['Hi Ben!']);
  });

  await step('conversations are private to participants', async () => {
    await call('GET', `/api/messages/conversations/${ctx.conversationId}/messages`, { cookie: ctx.alex.cookie, expect: 404 });
    await call('POST', `/api/messages/conversations/${ctx.conversationId}/messages`, {
      cookie: ctx.alex.cookie,
      body: { text: 'intrude' },
      expect: 404,
    });
    await call('POST', '/api/messages/conversations', { cookie: ctx.a.cookie, body: { userId: ctx.a.id }, expect: 400 });
    await call('POST', `/api/messages/conversations/${ctx.conversationId}/messages`, {
      cookie: ctx.a.cookie,
      body: { text: '' },
      expect: 400,
    });
  });

  await step('stories are visible to followers and track views', async () => {
    const story = await api.upload(
      '/api/stories',
      ctx.b.cookie,
      upload(png(300, 600, [20, 200, 80]), 'image/png', 'story.png', { caption: 'My day' }),
    );
    assert.equal(story.caption, 'My day');
    await call('POST', '/api/stories', {
      cookie: ctx.b.cookie,
      form: upload(Buffer.from('x'), 'video/mp4', 'clip.mp4'),
      expect: 400,
    });

    const before = await api.get('/api/stories/feed', ctx.a.cookie);
    assert.ok(!before.some((g) => g.user.id === ctx.b.id));

    await api.post(`/api/users/${ctx.b.id}/follow`, ctx.a.cookie, undefined, 204);
    const feed = await api.get('/api/stories/feed', ctx.a.cookie);
    const group = feed.find((g) => g.user.id === ctx.b.id);
    assert.ok(group?.hasUnseen);
    assert.equal(group.stories[0].viewsCount, null);

    await api.post(`/api/stories/${story.id}/view`, ctx.a.cookie, undefined, 204);
    const afterView = await api.get('/api/stories/feed', ctx.a.cookie);
    assert.equal(afterView.find((g) => g.user.id === ctx.b.id).hasUnseen, false);

    const own = await api.get('/api/stories/feed', ctx.b.cookie);
    assert.equal(own[0].user.id, ctx.b.id);
    assert.equal(own[0].stories[0].viewsCount, 1);
    const media = await fetch(`${BASE_URL}/media/${story.mediaPath}`);
    assert.equal(media.status, 200);
  });

  console.log('\nAuthorization');
  await step('only authors can delete their posts', async () => {
    await call('DELETE', `/api/posts/${ctx.post.id}`, { cookie: ctx.b.cookie, expect: 403 });
    await api.delete(`/api/posts/${ctx.post.id}`, ctx.a.cookie);
    await call('GET', `/api/posts/${ctx.post.id}`, { cookie: ctx.a.cookie, expect: 404 });
    assert.equal((await fetch(`${BASE_URL}/media/${ctx.post.mediaPath}`)).status, 404);
  });

  await step('unfollowing removes posts from the feed', async () => {
    const extra = await api.upload('/api/posts', ctx.a.cookie, upload(png(10, 10, [9, 9, 9]), 'image/png', 'x.png'));
    assert.ok((await api.get('/api/posts/feed', ctx.b.cookie)).data.some((p) => p.id === extra.id));
    await api.delete(`/api/users/${ctx.a.id}/follow`, ctx.b.cookie);
    assert.ok(!(await api.get('/api/posts/feed', ctx.b.cookie)).data.some((p) => p.id === extra.id));
    assert.equal((await api.get(`/api/users/${ctx.a.username}`, ctx.b.cookie)).isFollowing, false);
  });

  console.log('\nFrontend');
  await step('anonymous visitors are redirected to login', async () => {
    const res = await call('GET', '/');
    assert.ok([302, 307].includes(res.status), `expected redirect, got ${res.status}`);
    assert.match(res.headers.get('location'), /\/auth\/login$/);
    const loginPage = await call('GET', '/auth/login', { expect: 200 });
    assert.match(loginPage.text, /Log in/);
    await call('GET', '/auth/register', { expect: 200 });
  });

  await step('authenticated pages render server-side', async () => {
    const pages = [
      ['/', ctx.alex.cookie, 'alex_morgan'],
      ['/explore', ctx.alex.cookie, 'Search people'],
      ['/create', ctx.alex.cookie, 'New post'],
      ['/create?type=story', ctx.alex.cookie, 'New story'],
      ['/messages', ctx.alex.cookie, 'sarah_chen'],
      ['/notifications', ctx.alex.cookie, 'Notifications'],
      ['/settings', ctx.alex.cookie, 'alex.morgan@example.com'],
      ['/users/sarah_chen', ctx.alex.cookie, 'Sarah Chen'],
      ['/users/alex_morgan?tab=saved', ctx.alex.cookie, 'Saved'],
      [`/posts/${DEMO_POST_ID}`, ctx.alex.cookie, 'Golden hour'],
    ];
    for (const [path, cookie, text] of pages) {
      const res = await call('GET', path, { cookie, expect: 200 });
      assert.ok(res.text.includes(text), `${path} should contain "${text}"`);
    }
    const profile = await call('GET', '/profile', { cookie: ctx.alex.cookie });
    assert.ok([303, 307, 308].includes(profile.status) || profile.text.includes('alex_morgan'));
  });

  await step('missing pages return 404', async () => {
    await call('GET', `/users/nobody_${RUN_ID}`, { cookie: ctx.alex.cookie, expect: 404 });
    await call('GET', '/posts/not-a-real-id', { cookie: ctx.alex.cookie, expect: 404 });
  });

  await step('logout clears the session cookie', async () => {
    const res = await call('POST', '/api/auth/logout', { cookie: ctx.a.cookie, expect: 204 });
    const cleared = res.headers.getSetCookie().find((c) => c.startsWith('access_token='));
    assert.match(cleared, /Expires=Thu, 01 Jan 1970/);
  });
}

try {
  await run();
  console.log(`\n\x1b[32m${results.length} passed\x1b[0m`);
} catch {
  console.error(`\n\x1b[31m1 failed\x1b[0m, ${results.filter((r) => r.ok).length} passed`);
  process.exitCode = 1;
} finally {
  sockets.forEach((socket) => socket.close());
}
