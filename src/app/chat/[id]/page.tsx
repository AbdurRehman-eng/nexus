'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, useParams } from 'next/navigation';
import { getChannels } from '@/app/actions/channels';
import { getMessages, sendMessage } from '@/app/actions/messages';
import { getWorkspace } from '@/app/actions/workspaces';
import { createClient } from '@/lib/supabase/client';

interface Message {
  id: string;
  user: string;
  avatar: string;
  content: string;
  timestamp: string;
  reactions?: { emoji: string; count: number }[];
  thread?: number;
}

interface Channel {
  id: string;
  name: string;
  description: string;
  is_private: boolean;
}

export default function ChatPage() {
  const router = useRouter();
  const params = useParams();
  const workspaceId = params.id as string;

  const [workspaceName, setWorkspaceName] = useState('Workspace');
  const [channels, setChannels] = useState<Channel[]>([]);
  const [activeChannelId, setActiveChannelId] = useState<string | null>(null);
  const [activeChannelName, setActiveChannelName] = useState('#general');
  const [messages, setMessages] = useState<Message[]>([]);
  const [messageInput, setMessageInput] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    loadWorkspace();
    loadChannels();
  }, [workspaceId]);

  useEffect(() => {
    if (activeChannelId) {
      loadMessages(activeChannelId);
      setupRealtimeSubscription(activeChannelId);
    }
  }, [activeChannelId]);

  const loadWorkspace = async () => {
    const result = await getWorkspace(workspaceId);
    if (result.data) {
      setWorkspaceName(result.data.name || 'Workspace');
    }
  };

  const loadChannels = async () => {
    setLoading(true);
    setError('');
    const result = await getChannels(workspaceId);
    
    if (result.error) {
      setError(result.error);
      if (result.error === 'Not authenticated') {
        router.push('/login');
      }
    } else {
      const channelsData = result.data || [];
      setChannels(channelsData);
      
      // Set first channel as active
      if (channelsData.length > 0) {
        const firstChannel = channelsData[0];
        setActiveChannelId(firstChannel.id);
        setActiveChannelName(`#${firstChannel.name}`);
      }
    }
    setLoading(false);
  };

  const loadMessages = async (channelId: string) => {
    setLoading(true);
    const result = await getMessages(channelId);
    
    if (result.error) {
      setError(result.error);
    } else {
      const formattedMessages = (result.data || []).map(msg => ({
        id: msg.id,
        user: msg.user,
        avatar: msg.avatar,
        content: msg.content,
        timestamp: new Date(msg.timestamp).toLocaleTimeString('en-US', { 
          hour: 'numeric', 
          minute: '2-digit' 
        }),
        reactions: [],
        thread: msg.threadId ? 0 : undefined,
      }));
      setMessages(formattedMessages);
    }
    setLoading(false);
  };

  const setupRealtimeSubscription = (channelId: string) => {
    const supabase = createClient();
    
    const channel = supabase
      .channel(`messages:${channelId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `channel_id=eq.${channelId}`,
        },
        (payload) => {
          // Reload messages when new message is inserted
          loadMessages(channelId);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  const handleChannelClick = (channel: Channel) => {
    setActiveChannelId(channel.id);
    setActiveChannelName(`#${channel.name}`);
    setMessages([]);
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!messageInput.trim() || !activeChannelId || sending) return;

    setSending(true);
    setError('');
    
    const result = await sendMessage(activeChannelId, messageInput);
    
    if (result.error) {
      setError(result.error);
    } else {
      setMessageInput('');
      // Reload messages to get the new one
      await loadMessages(activeChannelId);
    }
    setSending(false);
  };

  const handleFileUpload = () => {
    // Placeholder for file upload
    alert('File upload functionality coming soon');
  };

  return (
    <div className="h-screen flex">
      {/* Left Sidebar */}
      <div className="w-64 bg-maroon text-white flex flex-col">
        <div className="p-4 border-b border-white/10">
          <h2 className="text-xl font-bold">{workspaceName}</h2>
          <button className="text-sm text-white/70 hover:text-white">You (Owner)</button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-6">
          {/* General Section */}
          <div>
            <div className="text-xs font-semibold text-white/70 mb-2">GENERAL</div>
            <div className="space-y-1">
              <button className="w-full text-left px-3 py-2 rounded hover:bg-white/10 transition-colors">
                All DMs
              </button>
              <button className="w-full text-left px-3 py-2 rounded hover:bg-white/10 transition-colors">
                Drafts
              </button>
              <button className="w-full text-left px-3 py-2 rounded hover:bg-white/10 transition-colors">
                Saved Items
              </button>
            </div>
          </div>

          {/* Channels Section */}
          <div>
            <div className="text-xs font-semibold text-white/70 mb-2">CHANNELS</div>
            <div className="space-y-1">
              {loading ? (
                <div className="text-white/50 text-sm px-3 py-2">Loading channels...</div>
              ) : channels.length === 0 ? (
                <div className="text-white/50 text-sm px-3 py-2">No channels</div>
              ) : (
                channels.map((channel) => (
                  <button
                    key={channel.id}
                    onClick={() => handleChannelClick(channel)}
                    className={`w-full text-left px-3 py-2 rounded transition-colors ${
                      activeChannelId === channel.id ? 'bg-white/20' : 'hover:bg-white/10'
                    }`}
                  >
                    #{channel.name}
                  </button>
                ))
              )}
              <button className="w-full text-left px-3 py-2 rounded hover:bg-white/10 transition-colors text-white/70">
                + Add Channel
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col bg-white">
        {/* Chat Header */}
        <div className="h-16 border-b border-gray-border px-6 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex gap-2">
              <button 
                onClick={() => router.push('/homepage')}
                className="p-2 hover:bg-light-gray rounded"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
            </div>
            
            <h1 className="text-xl font-bold">{activeChannelName}</h1>
          </div>

          <div className="flex items-center gap-4">
            <div className="relative">
              <input
                type="text"
                placeholder="Search..."
                className="pl-10 pr-4 py-2 border border-gray-border rounded-input focus:outline-none focus:ring-2 focus:ring-dark-red"
              />
              <svg className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>

            <Link
              href="/ai-search"
              className="px-4 py-2 bg-dark-red text-white rounded-button hover:bg-maroon transition-colors"
            >
              AI Search
            </Link>

            <Link
              href={`/call/${workspaceId}`}
              className="p-2 hover:bg-light-gray rounded"
              title="Start Call"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
              </svg>
            </Link>
          </div>
        </div>

        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-chat-bg">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-input text-sm">
              {error}
            </div>
          )}
          {loading && messages.length === 0 ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-gray-500">Loading messages...</div>
            </div>
          ) : messages.length === 0 ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-gray-500">No messages yet. Start the conversation!</div>
            </div>
          ) : (
            messages.map((message) => (
              <div key={message.id} className="flex gap-3">
                <div className="w-10 h-10 rounded bg-dark-red text-white flex items-center justify-center font-semibold flex-shrink-0">
                  {message.avatar}
                </div>
                <div className="flex-1">
                  <div className="flex items-baseline gap-2 mb-1">
                    <span className="font-semibold">{message.user}</span>
                    <span className="text-xs text-gray-500">{message.timestamp}</span>
                  </div>
                  <p className="text-gray-800">{message.content}</p>
                  {message.reactions && message.reactions.length > 0 && (
                    <div className="flex gap-2 mt-2">
                      {message.reactions.map((reaction, idx) => (
                        <button
                          key={idx}
                          className="px-2 py-1 bg-white border border-gray-border rounded-full text-sm hover:border-dark-red transition-colors"
                        >
                          {reaction.emoji} {reaction.count}
                        </button>
                      ))}
                    </div>
                  )}
                  {message.thread !== undefined && (
                    <button className="text-sm text-dark-red hover:underline mt-2">
                      {message.thread} {message.thread === 1 ? 'reply' : 'replies'}
                    </button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Message Input */}
        <div className="p-4 border-t border-gray-border">
          <form onSubmit={handleSendMessage}>
            <div className="flex items-end gap-2">
              <div className="flex-1 border border-gray-border rounded-input bg-white">
                <textarea
                  value={messageInput}
                  onChange={(e) => setMessageInput(e.target.value)}
                  placeholder={`Message ${activeChannelName}`}
                  className="w-full px-4 py-3 resize-none focus:outline-none"
                  rows={1}
                  disabled={sending || !activeChannelId}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSendMessage(e);
                    }
                  }}
                />
                <div className="flex items-center gap-2 px-4 py-2 border-t border-gray-border">
                  <button
                    type="button"
                    onClick={handleFileUpload}
                    className="p-1 hover:bg-light-gray rounded"
                    title="Attach file"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                    </svg>
                  </button>
                </div>
              </div>
              <button
                type="submit"
                disabled={sending || !activeChannelId || !messageInput.trim()}
                className="px-6 py-3 bg-dark-red text-white rounded-button hover:bg-maroon transition-colors disabled:opacity-50"
              >
                {sending ? 'Sending...' : 'Send'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
