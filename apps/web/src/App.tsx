import { useEffect, useMemo, useState } from 'react';
import { api } from './lib/api';
import { getSocket } from './lib/socket';

type User = { id: string; username: string; email: string; status?: string };
type Message = { id: string; content: string; sender: User; createdAt: string; reactions: { emoji: string }[] };
type Conversation = {
  id: string;
  members: { user: User }[];
  unreadCount: number;
};

export function App() {
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [refreshToken, setRefreshToken] = useState<string | null>(null);
  const [me, setMe] = useState<User | null>(null);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [content, setContent] = useState('');
  const [typing, setTyping] = useState<string | null>(null);

  const headers = useMemo(
    () => ({ Authorization: `Bearer ${accessToken}` }),
    [accessToken],
  );

  useEffect(() => {
    if (!accessToken) return;
    api
      .get('/conversations', { headers })
      .then((r) => {
        setConversations(r.data);
        if (r.data[0]) setActiveConversationId(r.data[0].id);
      })
      .catch(() => undefined);
  }, [accessToken, headers]);

  useEffect(() => {
    if (!accessToken || !activeConversationId) return;
    api
      .get(`/messages/${activeConversationId}`, { headers })
      .then((r) => setMessages(r.data.items))
      .catch(() => undefined);
  }, [accessToken, activeConversationId, headers]);

  useEffect(() => {
    if (!accessToken) return;
    const socket = getSocket(accessToken);

    socket.on('message:new', (p: { conversationId: string }) => {
      if (p.conversationId === activeConversationId) {
        api.get(`/messages/${p.conversationId}`, { headers }).then((r) => setMessages(r.data.items));
      }
      api.get('/conversations', { headers }).then((r) => setConversations(r.data));
    });

    socket.on('typing', (p: { conversationId: string; userId: string; isTyping: boolean }) => {
      if (p.conversationId === activeConversationId && p.isTyping) setTyping(`${p.userId} печатает...`);
      else setTyping(null);
    });

    return () => {
      socket.off('message:new');
      socket.off('typing');
    };
  }, [accessToken, activeConversationId, headers]);

  const login = async (email: string, password: string) => {
    const { data } = await api.post('/auth/login', { email, password });
    setAccessToken(data.accessToken);
    setRefreshToken(data.refreshToken);
    setMe(data.user);
  };

  const sendMessage = async () => {
    if (!activeConversationId || !content.trim()) return;
    await api.post(
      '/messages',
      { conversationId: activeConversationId, content },
      { headers },
    );
    setContent('');
  };

  const sendTyping = (isTyping: boolean) => {
    if (!activeConversationId || !accessToken) return;
    getSocket(accessToken).emit('typing', { conversationId: activeConversationId, isTyping });
  };

  if (!accessToken || !me) {
    return (
      <div className="grid min-h-screen place-items-center bg-[#202225] p-4 text-white">
        <LoginCard onLogin={login} />
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-[#202225] text-[#f2f3f5]">
      <aside className="w-16 border-r border-[#1f2023] bg-[#202225] p-2">
        {[1, 2, 3, 4].map((s) => (
          <div key={s} className="mb-3 h-12 w-12 rounded-full bg-[#2f3136] hover:bg-[#40444b]" />
        ))}
      </aside>
      <aside className="flex w-72 flex-col bg-[#2f3136]">
        <div className="border-b border-[#1f2023] p-4 font-semibold">Диалоги</div>
        <div className="flex-1 overflow-auto">
          {conversations.map((c) => {
            const peer = c.members.find((m) => m.user.id !== me.id)?.user;
            return (
              <button
                key={c.id}
                className={`flex w-full items-center justify-between p-3 text-left hover:bg-[#40444b] ${
                  activeConversationId === c.id ? 'bg-[#40444b]' : ''
                }`}
                onClick={() => setActiveConversationId(c.id)}
              >
                <span>{peer?.username ?? 'Чат'}</span>
                {c.unreadCount > 0 && (
                  <span className="rounded-full bg-[#f04747] px-2 py-0.5 text-xs">{c.unreadCount}</span>
                )}
              </button>
            );
          })}
        </div>
        <div className="border-t border-[#1f2023] bg-[#292b2f] p-3 text-sm">
          {me.username} · online
          <button
            className="ml-3 text-xs text-red-300"
            onClick={async () => {
              await api.post('/auth/logout', { refreshToken });
              setAccessToken(null);
              setMe(null);
            }}
          >
            logout
          </button>
        </div>
      </aside>
      <main className="flex flex-1 flex-col bg-[#292b2f]">
        <header className="flex items-center justify-between border-b border-[#1f2023] p-4">
          <span className="font-semibold">{activeConversationId ?? 'Выбери чат'}</span>
          <div className="flex gap-2">
            <input className="rounded bg-[#202225] px-2 py-1" placeholder="Поиск" />
            <button className="rounded bg-[#202225] px-2 py-1">i</button>
          </div>
        </header>
        <section className="flex-1 overflow-auto p-4">
          {messages.map((m) => (
            <div key={m.id} className="mb-3 rounded bg-[#2f3136] p-3">
              <div className="text-sm text-slate-300">{m.sender.username}</div>
              <div>{m.content}</div>
              <div className="mt-2 flex gap-2">
                {['👍', '❤️', '😂'].map((emoji) => (
                  <button
                    key={emoji}
                    className="rounded bg-[#40444b] px-2 text-xs"
                    onClick={() => api.post(`/messages/${m.id}/reactions`, { emoji }, { headers })}
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            </div>
          ))}
          {typing && <div className="text-xs text-slate-400">{typing}</div>}
        </section>
        <footer className="border-t border-[#1f2023] p-4">
          <input
            className="w-full rounded bg-[#202225] px-3 py-2 outline-none"
            value={content}
            placeholder="Написать сообщение"
            onChange={(e) => {
              setContent(e.target.value);
              sendTyping(e.target.value.length > 0);
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                sendMessage();
                sendTyping(false);
              }
            }}
          />
        </footer>
      </main>
    </div>
  );
}

function LoginCard({ onLogin }: { onLogin: (email: string, password: string) => Promise<void> }) {
  const [email, setEmail] = useState('alice@example.com');
  const [password, setPassword] = useState('password123');

  return (
    <div className="w-full max-w-sm rounded-lg bg-[#2f3136] p-6 shadow-2xl">
      <h1 className="mb-4 text-xl font-semibold">Dark Chat MVP</h1>
      <input
        className="mb-2 w-full rounded bg-[#202225] p-2"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
      />
      <input
        className="mb-3 w-full rounded bg-[#202225] p-2"
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
      />
      <button
        className="w-full rounded bg-indigo-500 p-2 hover:bg-indigo-400"
        onClick={() => onLogin(email, password)}
      >
        Войти
      </button>
    </div>
  );
}
