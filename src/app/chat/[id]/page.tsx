'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter, useParams } from 'next/navigation';

interface Message {
  id: string;
  user: string;
  avatar: string;
  content: string;
  timestamp: string;
  reactions?: { emoji: string; count: number }[];
  thread?: number;
}

export default function ChatPage() {
  const router = useRouter();
  const params = useParams();
  const workspaceId = params.id as string;

  const [activeChannel, setActiveChannel] = useState('#announcements');
  const [messageInput, setMessageInput] = useState('');
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);

  const channels = ['#announcements', '#pr', '#design-team', '#social-media', '#team-finance'];
  const directMessages = ['John Doe', 'Jane Smith', 'Mike Johnson'];
  const starredChannels = ['#design-team', '#social-media', '#team-finance'];

  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      user: 'John Doe',
      avatar: 'JD',
      content: 'Hey team! Just wanted to share the latest updates on the project.',
      timestamp: '10:30 AM',
      reactions: [{ emoji: '👍', count: 3 }],
    },
    {
      id: '2',
      user: 'Jane Smith',
      avatar: 'JS',
      content: 'Thanks for the update! Looking forward to seeing the progress.',
      timestamp: '10:32 AM',
      thread: 2,
    },
  ]);

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (messageInput.trim()) {
      const newMessage: Message = {
        id: Date.now().toString(),
        user: 'You',
        avatar: 'YO',
        content: messageInput,
        timestamp: new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }),
      };
      setMessages([...messages, newMessage]);
      setMessageInput('');
    }
  };

  const handleFileUpload = () => {
    // Placeholder for file upload
    alert('File upload functionality');
  };

  return (
    <div className="h-screen flex">
      {/* Left Sidebar */}
      <div className="w-64 bg-maroon text-white flex flex-col">
        <div className="p-4 border-b border-white/10">
          <h2 className="text-xl font-bold">Aurora Digital</h2>
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

          {/* Starred Section */}
          <div>
            <div className="text-xs font-semibold text-white/70 mb-2">STARRED</div>
            <div className="space-y-1">
              {starredChannels.map((channel) => (
                <button
                  key={channel}
                  onClick={() => setActiveChannel(channel)}
                  className={`w-full text-left px-3 py-2 rounded transition-colors ${
                    activeChannel === channel ? 'bg-white/20' : 'hover:bg-white/10'
                  }`}
                >
                  {channel}
                </button>
              ))}
            </div>
          </div>

          {/* Channels Section */}
          <div>
            <div className="text-xs font-semibold text-white/70 mb-2">CHANNELS</div>
            <div className="space-y-1">
              {channels.map((channel) => (
                <button
                  key={channel}
                  onClick={() => setActiveChannel(channel)}
                  className={`w-full text-left px-3 py-2 rounded transition-colors ${
                    activeChannel === channel ? 'bg-white/20' : 'hover:bg-white/10'
                  }`}
                >
                  {channel}
                </button>
              ))}
              <button className="w-full text-left px-3 py-2 rounded hover:bg-white/10 transition-colors text-white/70">
                + Add Channel
              </button>
            </div>
          </div>

          {/* Direct Messages Section */}
          <div>
            <div className="text-xs font-semibold text-white/70 mb-2">DIRECT MESSAGES</div>
            <div className="space-y-1">
              {directMessages.map((person) => (
                <button
                  key={person}
                  className="w-full text-left px-3 py-2 rounded hover:bg-white/10 transition-colors flex items-center gap-2"
                >
                  <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                  {person}
                </button>
              ))}
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
              <button className="p-2 hover:bg-light-gray rounded">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <button className="p-2 hover:bg-light-gray rounded">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>
            
            <h1 className="text-xl font-bold">{activeChannel}</h1>
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
          {messages.map((message) => (
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
                {message.reactions && (
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
                {message.thread && (
                  <button className="text-sm text-dark-red hover:underline mt-2">
                    {message.thread} {message.thread === 1 ? 'reply' : 'replies'}
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Message Input */}
        <div className="p-4 border-t border-gray-border">
          <form onSubmit={handleSendMessage}>
            <div className="flex items-end gap-2">
              <div className="flex-1 border border-gray-border rounded-input bg-white">
                <textarea
                  value={messageInput}
                  onChange={(e) => setMessageInput(e.target.value)}
                  placeholder={`Message ${activeChannel}`}
                  className="w-full px-4 py-3 resize-none focus:outline-none"
                  rows={1}
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
                  <button
                    type="button"
                    onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                    className="p-1 hover:bg-light-gray rounded"
                    title="Add emoji"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </button>
                </div>
              </div>
              <button
                type="submit"
                className="px-6 py-3 bg-dark-red text-white rounded-button hover:bg-maroon transition-colors"
              >
                Send
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
