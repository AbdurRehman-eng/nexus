'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter, useParams } from 'next/navigation';
import { getChannels } from '@/app/actions/channels';
import { getMessages, sendMessage, getMessageReactions, addReaction, removeReaction, editMessage, deleteMessage } from '@/app/actions/messages';
import { getWorkspace } from '@/app/actions/workspaces';
import { createClient } from '@/lib/supabase/client';
import EmojiPicker from '@/components/EmojiPicker';
import MessageActions from '@/components/MessageActions';
import ThemeToggle from '@/components/ThemeToggle';
import toast from 'react-hot-toast';

interface Message {
  id: string;
  user: string;
  avatar: string;
  content: string;
  timestamp: string;
  senderId: string;
  reactions?: { emoji: string; count: number; users: string[] }[];
  threadId?: string | null;
  editedAt?: string;
  deletedAt?: string;
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
  const [accessToken, setAccessToken] = useState('');
  const [currentUserId, setCurrentUserId] = useState('');
  
  // UI state
  const [showSidebar, setShowSidebar] = useState(false);
  
  // Edit state
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState('');
  
  // Reaction state
  const [showEmojiPicker, setShowEmojiPicker] = useState<string | null>(null);
  
  // Thread state
  const [replyToMessage, setReplyToMessage] = useState<Message | null>(null);
  const [threadMessages, setThreadMessages] = useState<Message[]>([]);
  const [showThreadView, setShowThreadView] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    checkAuthAndLoad();
  }, [workspaceId]);

  const checkAuthAndLoad = async () => {
    const supabase = createClient();
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      router.push('/login');
      return;
    }
    
    setAccessToken(session.access_token);
    setCurrentUserId(session.user.id);
    await loadWorkspace(session.access_token);
    await loadChannels(session.access_token);
  };

  useEffect(() => {
    if (activeChannelId) {
      loadMessages(activeChannelId);
      setupRealtimeSubscription(activeChannelId);
    }
  }, [activeChannelId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const loadWorkspace = async (token: string) => {
    const result = await getWorkspace(token, workspaceId);
    if (result.data) {
      setWorkspaceName(result.data.name || 'Workspace');
    }
  };

  const loadChannels = async (token: string) => {
    setLoading(true);
    setError('');
    const result = await getChannels(token, workspaceId);
    
    if (result.error) {
      setError(result.error);
      if (result.error === 'Not authenticated') {
        router.push('/login');
      }
    } else {
      const channelsData = result.data || [];
      setChannels(channelsData);
      
      if (channelsData.length > 0) {
        const firstChannel = channelsData[0];
        setActiveChannelId(firstChannel.id);
        setActiveChannelName(`#${firstChannel.name}`);
      }
    }
    setLoading(false);
  };

  const loadMessages = async (channelId: string) => {
    if (!accessToken) return;
    
    setLoading(true);
    const result = await getMessages(accessToken, channelId);
    
    if (result.error) {
      setError(result.error);
    } else {
      const formattedMessages = await Promise.all((result.data || []).map(async (msg) => {
        const reactionsResult = await getMessageReactions(accessToken, msg.id);
        return {
          id: msg.id,
          user: msg.user,
          avatar: msg.avatar,
          content: msg.content,
          timestamp: new Date(msg.timestamp).toLocaleTimeString('en-US', { 
            hour: 'numeric', 
            minute: '2-digit' 
          }),
          senderId: msg.senderId,
          reactions: reactionsResult.data || [],
          threadId: msg.threadId,
        };
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
          event: '*',
          schema: 'public',
          table: 'messages',
          filter: `channel_id=eq.${channelId}`,
        },
        () => {
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
    setReplyToMessage(null);
    setShowThreadView(false);
    setShowSidebar(false); // Close sidebar on mobile after selection
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!messageInput.trim() || !activeChannelId || sending || !accessToken) return;

    setSending(true);
    setError('');
    
    const result = await sendMessage(
      accessToken, 
      activeChannelId, 
      messageInput, 
      replyToMessage?.id || null
    );
    
    if (result.error) {
      toast.error(result.error);
      setError(result.error);
    } else {
      setMessageInput('');
      setReplyToMessage(null);
      await loadMessages(activeChannelId);
      toast.success('Message sent!');
    }
    setSending(false);
  };

  const handleEditMessage = async (messageId: string) => {
    if (!editContent.trim() || !accessToken) return;
    
    const result = await editMessage(accessToken, messageId, editContent);
    
    if (result.error) {
      toast.error(result.error);
    } else {
      toast.success('Message updated!');
      setEditingMessageId(null);
      setEditContent('');
      if (activeChannelId) {
        await loadMessages(activeChannelId);
      }
    }
  };

  const handleDeleteMessage = async (messageId: string) => {
    if (!accessToken) return;
    
    if (!confirm('Are you sure you want to delete this message?')) return;
    
    const result = await deleteMessage(accessToken, messageId);
    
    if (result.error) {
      toast.error(result.error);
    } else {
      toast.success('Message deleted!');
      if (activeChannelId) {
        await loadMessages(activeChannelId);
      }
    }
  };

  const handleAddReaction = async (messageId: string, emoji: string) => {
    if (!accessToken) return;
    
    const result = await addReaction(accessToken, messageId, emoji);
    
    if (result.error) {
      toast.error(result.error);
    } else {
      if (activeChannelId) {
        await loadMessages(activeChannelId);
      }
    }
    setShowEmojiPicker(null);
  };

  const handleRemoveReaction = async (messageId: string, emoji: string) => {
    if (!accessToken) return;
    
    const result = await removeReaction(accessToken, messageId, emoji);
    
    if (result.error) {
      toast.error(result.error);
    } else {
      if (activeChannelId) {
        await loadMessages(activeChannelId);
      }
    }
  };

  const getUserReaction = (message: Message) => {
    if (!message.reactions) return null;
    for (const reaction of message.reactions) {
      if (reaction.users.includes(currentUserId)) {
        return reaction.emoji;
      }
    }
    return null;
  };

  const handleReply = (message: Message) => {
    setReplyToMessage(message);
    const input = document.querySelector('textarea');
    input?.focus();
  };

  const handleViewThread = (message: Message) => {
    const threadReplies = messages.filter(m => m.threadId === message.id);
    setThreadMessages([message, ...threadReplies]);
    setShowThreadView(true);
  };

  const handleFileUpload = () => {
    toast.error('File upload functionality coming soon!');
  };

  const getThreadCount = (messageId: string) => {
    return messages.filter(m => m.threadId === messageId).length;
  };

  return (
    <div className="h-screen flex overflow-hidden">
      {/* Mobile Overlay */}
      {showSidebar && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setShowSidebar(false)}
        />
      )}

      {/* Left Sidebar */}
      <div className={`
        ${showSidebar ? 'translate-x-0' : '-translate-x-full'}
        lg:translate-x-0 transition-transform duration-300 ease-in-out
        fixed lg:static inset-y-0 left-0 z-50
        w-64 bg-maroon text-white flex flex-col
      `}>
        <div className="p-4 border-b border-white/10 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold">{workspaceName}</h2>
            <button className="text-sm text-white/70 hover:text-white">You (Owner)</button>
          </div>
          <button
            onClick={() => setShowSidebar(false)}
            className="lg:hidden p-2 hover:bg-white/10 rounded"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-6">
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
      <div className="flex-1 flex flex-col bg-white dark:bg-gray-900 min-w-0">
        {/* Chat Header */}
        <div className="h-14 sm:h-16 border-b border-gray-border dark:border-gray-700 px-3 sm:px-6 flex items-center justify-between">
          <div className="flex items-center gap-2 sm:gap-4 min-w-0">
            {/* Mobile Menu Button */}
            <button
              onClick={() => setShowSidebar(true)}
              className="lg:hidden p-2 hover:bg-light-gray dark:hover:bg-gray-800 rounded -ml-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
            
            <button 
              onClick={() => router.push('/homepage')}
              className="hidden sm:block p-2 hover:bg-light-gray dark:hover:bg-gray-800 rounded"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            
            <h1 className="text-lg sm:text-xl font-bold truncate">{activeChannelName}</h1>
          </div>

          <div className="flex items-center gap-2 sm:gap-4">
            <ThemeToggle />
            
            <Link
              href="/ai-search"
              className="hidden sm:inline-flex px-4 py-2 bg-dark-red text-white rounded-button hover:bg-maroon transition-colors text-sm"
            >
              AI Search
            </Link>

            <Link
              href={`/call/${workspaceId}`}
              className="p-2 hover:bg-light-gray dark:hover:bg-gray-800 rounded"
              title="Start Call"
            >
              <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
              </svg>
            </Link>
          </div>
        </div>

        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto p-3 sm:p-6 space-y-4 bg-chat-bg">
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
              <div className="text-gray-500 text-center px-4">No messages yet. Start the conversation!</div>
            </div>
          ) : (
            messages.filter(m => !m.threadId).map((message) => (
              <div key={message.id} className="flex gap-2 sm:gap-3 group relative">
                <div className="w-8 h-8 sm:w-10 sm:h-10 rounded bg-dark-red text-white flex items-center justify-center font-semibold flex-shrink-0 text-sm sm:text-base">
                  {message.avatar}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-baseline gap-2 mb-1">
                    <span className="font-semibold text-sm sm:text-base truncate">{message.user}</span>
                    <span className="text-xs text-gray-500 flex-shrink-0">{message.timestamp}</span>
                    {message.editedAt && (
                      <span className="text-xs text-gray-400">(edited)</span>
                    )}
                  </div>
                  
                  {editingMessageId === message.id ? (
                    <div className="space-y-2">
                      <textarea
                        value={editContent}
                        onChange={(e) => setEditContent(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-input resize-none text-sm"
                        rows={3}
                        autoFocus
                      />
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleEditMessage(message.id)}
                          className="px-3 py-1 bg-dark-red text-white rounded text-sm hover:bg-maroon"
                        >
                          Save
                        </button>
                        <button
                          onClick={() => {
                            setEditingMessageId(null);
                            setEditContent('');
                          }}
                          className="px-3 py-1 bg-gray-300 text-gray-700 rounded text-sm hover:bg-gray-400"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <p className="text-gray-800 dark:text-gray-200 text-sm sm:text-base break-words">{message.content}</p>
                  )}
                  
                  {message.reactions && message.reactions.length > 0 && (
                    <div className="flex gap-2 mt-2 flex-wrap">
                      {message.reactions.map((reaction, idx) => {
                        const userReaction = getUserReaction(message);
                        const isThisReaction = userReaction === reaction.emoji;
                        return (
                          <button
                            key={idx}
                            onClick={() => {
                              if (isThisReaction) {
                                // Remove if clicking on user's current reaction
                                handleRemoveReaction(message.id, reaction.emoji);
                              } else {
                                // Switch to this reaction (will replace user's existing reaction if any)
                                handleAddReaction(message.id, reaction.emoji);
                              }
                            }}
                            className={`px-2 py-1 border rounded-full text-xs sm:text-sm hover:border-dark-red transition-colors ${
                              isThisReaction ? 'bg-blue-50 border-dark-red dark:bg-blue-900' : 'bg-white border-gray-border dark:bg-gray-800'
                            }`}
                          >
                            {reaction.emoji} {reaction.count}
                          </button>
                        );
                      })}
                    </div>
                  )}
                  
                  {getThreadCount(message.id) > 0 && (
                    <button 
                      onClick={() => handleViewThread(message)}
                      className="text-xs sm:text-sm text-dark-red hover:underline mt-2 flex items-center gap-1"
                    >
                      <svg className="w-3 h-3 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
                      </svg>
                      {getThreadCount(message.id)} {getThreadCount(message.id) === 1 ? 'reply' : 'replies'}
                    </button>
                  )}
                </div>
                
                {/* Message Actions */}
                <div className="absolute top-0 right-0 -mt-2">
                  <MessageActions
                    messageId={message.id}
                    isOwnMessage={message.senderId === currentUserId}
                    onReply={() => handleReply(message)}
                    onEdit={() => {
                      setEditingMessageId(message.id);
                      setEditContent(message.content);
                    }}
                    onDelete={() => handleDeleteMessage(message.id)}
                    onReact={() => setShowEmojiPicker(message.id)}
                  />
                </div>
                
                {/* Emoji Picker */}
                {showEmojiPicker === message.id && (
                  <div className="relative">
                    <EmojiPicker
                      onEmojiSelect={(emoji) => handleAddReaction(message.id, emoji)}
                      onClose={() => setShowEmojiPicker(null)}
                    />
                  </div>
                )}
              </div>
            ))
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Reply Indicator */}
        {replyToMessage && (
          <div className="px-3 sm:px-4 py-2 bg-gray-100 dark:bg-gray-800 border-t border-gray-300 dark:border-gray-700 flex items-center justify-between">
            <div className="flex items-center gap-2 min-w-0">
              <svg className="w-4 h-4 text-dark-red flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
              </svg>
              <span className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 truncate">
                Replying to <strong className="truncate">{replyToMessage.user}</strong>
              </span>
            </div>
            <button
              onClick={() => setReplyToMessage(null)}
              className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 flex-shrink-0 ml-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        )}

        {/* Message Input */}
        <div className="p-3 sm:p-4 border-t border-gray-border dark:border-gray-700">
          <form onSubmit={handleSendMessage}>
            <div className="flex items-end gap-2">
              <div className="flex-1 border border-gray-border dark:border-gray-700 rounded-input bg-white dark:bg-gray-800">
                <textarea
                  value={messageInput}
                  onChange={(e) => setMessageInput(e.target.value)}
                  placeholder={`Message ${activeChannelName}`}
                  className="w-full px-3 sm:px-4 py-2 sm:py-3 resize-none focus:outline-none bg-transparent text-sm sm:text-base"
                  rows={1}
                  disabled={sending || !activeChannelId}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSendMessage(e);
                    }
                  }}
                />
                <div className="flex items-center gap-2 px-3 sm:px-4 py-2 border-t border-gray-border dark:border-gray-700">
                  <button
                    type="button"
                    onClick={handleFileUpload}
                    className="p-1 hover:bg-light-gray dark:hover:bg-gray-700 rounded"
                    title="Attach file"
                  >
                    <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                    </svg>
                  </button>
                </div>
              </div>
              <button
                type="submit"
                disabled={sending || !activeChannelId || !messageInput.trim()}
                className="px-4 sm:px-6 py-2 sm:py-3 bg-dark-red text-white rounded-button hover:bg-maroon transition-colors disabled:opacity-50 text-sm sm:text-base whitespace-nowrap"
              >
                {sending ? 'Sending...' : 'Send'}
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Thread View Sidebar */}
      {showThreadView && (
        <div className="hidden md:flex w-80 lg:w-96 border-l border-gray-border dark:border-gray-700 bg-white dark:bg-gray-900 flex-col">
          <div className="p-4 border-b border-gray-border dark:border-gray-700 flex items-center justify-between">
            <h2 className="font-bold">Thread</h2>
            <button
              onClick={() => setShowThreadView(false)}
              className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {threadMessages.map((msg, idx) => (
              <div key={msg.id} className={idx === 0 ? 'pb-4 border-b border-gray-300 dark:border-gray-700' : ''}>
                <div className="flex gap-3">
                  <div className="w-8 h-8 rounded bg-dark-red text-white flex items-center justify-center text-sm font-semibold flex-shrink-0">
                    {msg.avatar}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-baseline gap-2 mb-1">
                      <span className="font-semibold text-sm truncate">{msg.user}</span>
                      <span className="text-xs text-gray-500 flex-shrink-0">{msg.timestamp}</span>
                    </div>
                    <p className="text-sm text-gray-800 dark:text-gray-200 break-words">{msg.content}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
