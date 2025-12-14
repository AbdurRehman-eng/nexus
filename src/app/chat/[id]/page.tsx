'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter, useParams } from 'next/navigation';
import { getChannels, createChannel } from '@/app/actions/channels';
import { getMessages, sendMessage, getMessageReactions, addReaction, removeReaction, editMessage, deleteMessage } from '@/app/actions/messages';
import { getWorkspace } from '@/app/actions/workspaces';
import { getMessageAttachments, deleteAttachment } from '@/app/actions/files';
import { createClient } from '@/lib/supabase/client';
import EmojiPicker from '@/components/EmojiPicker';
import MessageActions from '@/components/MessageActions';
import FileUpload from '@/components/FileUpload';
import MessageAttachments from '@/components/MessageAttachments';
import { MessageSkeletonList } from '@/components/MessageSkeleton';
import toast from 'react-hot-toast';

interface Attachment {
  id: string;
  file_name: string;
  file_type: string;
  file_size: number;
  url: string;
  uploaded_by: string;
}

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
  attachments?: Attachment[];
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
  const [messagesLoading, setMessagesLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const [accessToken, setAccessToken] = useState('');
  const [currentUserId, setCurrentUserId] = useState('');
  
  // UI state
  const [showSidebar, setShowSidebar] = useState(false);
  const [showAddChannelModal, setShowAddChannelModal] = useState(false);
  const [newChannelName, setNewChannelName] = useState('');
  const [newChannelDescription, setNewChannelDescription] = useState('');
  const [newChannelIsPrivate, setNewChannelIsPrivate] = useState(false);
  const [creatingChannel, setCreatingChannel] = useState(false);
  
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
      setMessagesLoading(true);
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
    
    setMessagesLoading(true);
    setError('');
    const result = await getMessages(accessToken, channelId);
    
    if (result.error) {
      setError(result.error);
      setMessagesLoading(false);
    } else {
      const formattedMessages = await Promise.all((result.data || []).map(async (msg) => {
        const reactionsResult = await getMessageReactions(accessToken, msg.id);
        const attachmentsResult = await getMessageAttachments(accessToken, msg.id);
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
          attachments: attachmentsResult.data || [],
        };
      }));
      setMessages(formattedMessages);
      setMessagesLoading(false);
    }
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

  const handleDeleteAttachment = async (attachmentId: string) => {
    if (!accessToken) return;
    
    if (!confirm('Are you sure you want to delete this attachment?')) return;
    
    const result = await deleteAttachment(accessToken, attachmentId);
    
    if (result.error) {
      toast.error(result.error);
    } else {
      toast.success('Attachment deleted!');
      if (activeChannelId) {
        await loadMessages(activeChannelId);
      }
    }
  };

  const getThreadCount = (messageId: string) => {
    return messages.filter(m => m.threadId === messageId).length;
  };

  const handleCreateChannel = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newChannelName.trim()) {
      toast.error('Channel name is required');
      return;
    }

    setCreatingChannel(true);
    const result = await createChannel(
      accessToken,
      workspaceId,
      newChannelName.trim(),
      newChannelDescription.trim(),
      newChannelIsPrivate
    );

    if (result.error) {
      toast.error(result.error);
      setCreatingChannel(false);
      return;
    }

    toast.success(`Channel #${newChannelName} created!`);
    setNewChannelName('');
    setNewChannelDescription('');
    setNewChannelIsPrivate(false);
    setShowAddChannelModal(false);
    setCreatingChannel(false);
    
    // Reload channels
    await loadChannels(accessToken);
  };

  const handleDMsClick = () => {
    toast('Direct Messages feature coming soon!', { icon: '💬' });
  };

  const handleDraftsClick = () => {
    toast('Drafts feature coming soon!', { icon: '📝' });
  };

  const handleSavedItemsClick = () => {
    toast('Saved Items feature coming soon!', { icon: '⭐' });
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
              <button 
                onClick={handleDMsClick}
                className="w-full text-left px-3 py-2 rounded hover:bg-white/10 transition-colors flex items-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
                All DMs
              </button>
              <button 
                onClick={handleDraftsClick}
                className="w-full text-left px-3 py-2 rounded hover:bg-white/10 transition-colors flex items-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
                Drafts
              </button>
              <button 
                onClick={handleSavedItemsClick}
                className="w-full text-left px-3 py-2 rounded hover:bg-white/10 transition-colors flex items-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                </svg>
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
              <button 
                onClick={() => setShowAddChannelModal(true)}
                className="w-full text-left px-3 py-2 rounded hover:bg-white/10 transition-colors text-white/70 flex items-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Add Channel
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col bg-white min-w-0">
        {/* Chat Header */}
        <div className="h-14 sm:h-16 border-b border-gray-border px-3 sm:px-6 flex items-center justify-between">
          <div className="flex items-center gap-2 sm:gap-4 min-w-0">
            {/* Mobile Menu Button */}
            <button
              onClick={() => setShowSidebar(true)}
              className="lg:hidden p-2 hover:bg-light-gray rounded -ml-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
            
            <button 
              onClick={() => router.push('/homepage')}
              className="hidden sm:block p-2 hover:bg-light-gray rounded"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            
            <h1 className="text-lg sm:text-xl font-bold truncate">{activeChannelName}</h1>
          </div>

          <div className="flex items-center gap-2 sm:gap-4">
            
            
            <Link
              href="/ai-search"
              className="hidden sm:inline-flex px-4 py-2 bg-dark-red text-white rounded-button hover:bg-maroon transition-colors text-sm"
            >
              AI Search
            </Link>

            <Link
              href={`/workspace/${workspaceId}/members`}
              className="p-2 hover:bg-light-gray rounded"
              title="Manage Members"
            >
              <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
            </Link>

            <Link
              href={`/call/${workspaceId}`}
              className="p-2 hover:bg-light-gray rounded"
              title="Start Video Call"
            >
              <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
            </Link>
          </div>
        </div>

        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto bg-chat-bg">
          {error && (
            <div className="m-3 sm:m-6 p-3 bg-red-50 border border-red-200 text-red-700 rounded-input text-sm">
              {error}
            </div>
          )}
          {messagesLoading ? (
            <MessageSkeletonList count={5} />
          ) : messages.length === 0 && !messagesLoading ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-gray-500 text-center px-4">No messages yet. Start the conversation!</div>
            </div>
          ) : (
            <div className="p-3 sm:p-6 space-y-4">
              {messages.filter(m => !m.threadId).map((message) => (
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
                    <>
                      <p className="text-gray-800 text-sm sm:text-base break-words">{message.content}</p>
                      <MessageAttachments 
                        attachments={message.attachments || []}
                        currentUserId={currentUserId}
                        onDelete={handleDeleteAttachment}
                      />
                    </>
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
                              isThisReaction ? 'bg-blue-50 border-dark-red' : 'bg-white border-gray-border'
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
            ))}
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Reply Indicator */}
        {replyToMessage && (
          <div className="px-3 sm:px-4 py-2 bg-gray-100 border-t border-gray-300 flex items-center justify-between">
            <div className="flex items-center gap-2 min-w-0">
              <svg className="w-4 h-4 text-dark-red flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
              </svg>
              <span className="text-xs sm:text-sm text-gray-600 truncate">
                Replying to <strong className="truncate">{replyToMessage.user}</strong>
              </span>
            </div>
            <button
              onClick={() => setReplyToMessage(null)}
              className="text-gray-500 hover:text-gray-700 flex-shrink-0 ml-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        )}

        {/* Message Input */}
        <div className="p-3 sm:p-4 border-t border-gray-border">
          <form onSubmit={handleSendMessage}>
            <div className="flex items-end gap-2">
              <div className="flex-1 border border-gray-border rounded-input bg-white">
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
                <div className="flex items-center gap-2 px-3 sm:px-4 py-2 border-t border-gray-border">
                  {messages.length > 0 && messages[messages.length - 1] && (
                    <FileUpload 
                      messageId={messages[messages.length - 1].id}
                      accessToken={accessToken}
                      onUploadComplete={() => activeChannelId && loadMessages(activeChannelId)}
                    />
                  )}
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
        <div className="hidden md:flex w-80 lg:w-96 border-l border-gray-border bg-white flex-col">
          <div className="p-4 border-b border-gray-border flex items-center justify-between">
            <h2 className="font-bold">Thread</h2>
            <button
              onClick={() => setShowThreadView(false)}
              className="text-gray-500 hover:text-gray-700"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {threadMessages.map((msg, idx) => (
              <div key={msg.id} className={idx === 0 ? 'pb-4 border-b border-gray-300' : ''}>
                <div className="flex gap-3">
                  <div className="w-8 h-8 rounded bg-dark-red text-white flex items-center justify-center text-sm font-semibold flex-shrink-0">
                    {msg.avatar}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-baseline gap-2 mb-1">
                      <span className="font-semibold text-sm truncate">{msg.user}</span>
                      <span className="text-xs text-gray-500 flex-shrink-0">{msg.timestamp}</span>
                    </div>
                    <p className="text-sm text-gray-800 break-words">{msg.content}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Add Channel Modal */}
      {showAddChannelModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-2xl font-bold text-gray-900">Create Channel</h2>
                <button
                  onClick={() => {
                    setShowAddChannelModal(false);
                    setNewChannelName('');
                    setNewChannelDescription('');
                    setNewChannelIsPrivate(false);
                  }}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <form onSubmit={handleCreateChannel} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Channel Name
                  </label>
                  <div className="flex items-center gap-2">
                    <span className="text-gray-500 text-lg">#</span>
                    <input
                      type="text"
                      value={newChannelName}
                      onChange={(e) => setNewChannelName(e.target.value)}
                      placeholder="e.g. marketing"
                      className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-dark-red"
                      disabled={creatingChannel}
                      autoFocus
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Description (Optional)
                  </label>
                  <textarea
                    value={newChannelDescription}
                    onChange={(e) => setNewChannelDescription(e.target.value)}
                    placeholder="What's this channel about?"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-dark-red resize-none"
                    rows={3}
                    disabled={creatingChannel}
                  />
                </div>

                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    id="isPrivate"
                    checked={newChannelIsPrivate}
                    onChange={(e) => setNewChannelIsPrivate(e.target.checked)}
                    className="w-4 h-4 text-dark-red border-gray-300 rounded focus:ring-dark-red"
                    disabled={creatingChannel}
                  />
                  <label htmlFor="isPrivate" className="text-sm text-gray-700">
                    Make this channel private (only invited members can access)
                  </label>
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setShowAddChannelModal(false);
                      setNewChannelName('');
                      setNewChannelDescription('');
                      setNewChannelIsPrivate(false);
                    }}
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 text-gray-700 font-semibold"
                    disabled={creatingChannel}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={creatingChannel || !newChannelName.trim()}
                    className="flex-1 px-4 py-2 bg-dark-red text-white rounded-lg hover:bg-maroon disabled:opacity-50 disabled:cursor-not-allowed font-semibold"
                  >
                    {creatingChannel ? 'Creating...' : 'Create Channel'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}



