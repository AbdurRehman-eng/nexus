'use client';

import { notifyCallStart } from '@/app/actions/calls';
import { createChannel, getChannels } from '@/app/actions/channels';
import { deleteDraft, getDrafts, saveDraft } from '@/app/actions/drafts';
import { deleteAttachment, getMessageAttachments } from '@/app/actions/files';
import { getDirectMessages, getWorkspaceMembers, sendDirectMessage } from '@/app/actions/members';
import { addReaction, deleteMessage, editMessage, getMessageReactions, getMessages, removeReaction, sendMessage } from '@/app/actions/messages';
import { createReminder, deleteReminder, getReminders, processDueReminders } from '@/app/actions/reminders';
import { getSavedItems, saveMessage, unsaveMessage } from '@/app/actions/saved-items';
import { getWorkspace } from '@/app/actions/workspaces';
import EmojiPicker from '@/components/EmojiPicker';
import FileUpload from '@/components/FileUpload';
import MessageActions from '@/components/MessageActions';
import MessageAttachments from '@/components/MessageAttachments';
import { MessageSkeletonList } from '@/components/MessageSkeleton';
import { createClient } from '@/lib/supabase/client';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
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

interface WorkspaceMember {
  id: string;
  user_id: string;
  workspace_id: string;
  role: string;
  username: string;
  email: string;
  avatar_url?: string;
  is_online: boolean;
}

interface DirectMessage {
  id: string;
  content: string;
  timestamp: string;
  sender_id: string;
  sender_name: string;
  avatar: string;
}

interface Reminder {
  id: string;
  title: string;
  description: string;
  scheduled_time: string;
  status: 'pending' | 'sent' | 'cancelled';
  workspace_id: string;
  channel_id: string;
  created_at: string;
  channels?: {
    name: string;
    workspaces?: {
      name: string;
    }
  }
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

  // Sidebar views
  const [viewMode, setViewMode] = useState<'channels' | 'drafts' | 'saved' | 'members' | 'reminders'>('channels');
  const [drafts, setDrafts] = useState<any[]>([]);
  const [savedItems, setSavedItems] = useState<any[]>([]);
  const [savedMessageIds, setSavedMessageIds] = useState<Set<string>>(new Set());

  // Members and DM state
  const [workspaceMembers, setWorkspaceMembers] = useState<WorkspaceMember[]>([]);
  const [showDMModal, setShowDMModal] = useState(false);
  const [selectedMember, setSelectedMember] = useState<WorkspaceMember | null>(null);
  const [dmMessages, setDmMessages] = useState<DirectMessage[]>([]);
  const [dmInput, setDmInput] = useState('');
  const [sendingDM, setSendingDM] = useState(false);

  // Reminders state
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [showReminderModal, setShowReminderModal] = useState(false);
  const [reminderTitle, setReminderTitle] = useState('');
  const [reminderDescription, setReminderDescription] = useState('');
  const [reminderDateTime, setReminderDateTime] = useState('');
  const [creatingReminder, setCreatingReminder] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const draftSaveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const pollIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const reminderCheckIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const realtimeConnectedRef = useRef<boolean>(false);
  const supabaseClientRef = useRef<ReturnType<typeof createClient> | null>(null);
  const subscriptionCleanupRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    checkAuthAndLoad();
  }, [workspaceId]);

  // Separate effect for auth state changes (important for OAuth accounts)
  useEffect(() => {
    const supabase = createClient();
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      console.log('[Auth] Auth state changed:', event, session?.user?.id);
      
      // When session is established (especially for OAuth), ensure realtime is connected
      if ((event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') && session) {
        if (activeChannelId && accessToken) {
          console.log('[Auth] Session established, ensuring realtime subscription is active');
          // Small delay to ensure everything is ready
          setTimeout(() => {
            if (activeChannelId && !realtimeConnectedRef.current) {
              console.log('[Auth] Realtime not connected, setting up subscription...');
              if (subscriptionCleanupRef.current) {
                subscriptionCleanupRef.current();
              }
              const cleanup = setupRealtimeSubscription(activeChannelId);
              subscriptionCleanupRef.current = cleanup;
            }
          }, 500);
        }
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [activeChannelId, accessToken]);

  // Check for due reminders every 10 seconds (for testing)
  useEffect(() => {
    if (!accessToken || !workspaceId) return;
    
    console.log('[Reminders] Setting up reminder check interval')
    
    // Clear existing interval
    if (reminderCheckIntervalRef.current) {
      clearInterval(reminderCheckIntervalRef.current);
    }
    
    // Check immediately
    checkForDueReminders();
    
    // Set up interval to check every 10 seconds (for testing)
    reminderCheckIntervalRef.current = setInterval(() => {
      checkForDueReminders();
    }, 10000);
    
    return () => {
      if (reminderCheckIntervalRef.current) {
        clearInterval(reminderCheckIntervalRef.current);
      }
    };
  }, [accessToken, workspaceId]);

  const checkAuthAndLoad = async () => {
    const supabase = createClient();
    
    // For OAuth accounts, wait a bit and try multiple times
    let session = null;
    let attempts = 0;
    const maxAttempts = 5;
    
    while (!session && attempts < maxAttempts) {
      const { data: { session: currentSession }, error } = await supabase.auth.getSession();
      
      if (error) {
        console.error('[Auth] Error getting session:', error);
      }
      
      if (currentSession && currentSession.access_token) {
        session = currentSession;
        console.log('[Auth] ✅ Session loaded, user:', session.user.id, 'Provider:', session.user.app_metadata?.provider || 'email');
        break;
      }
      
      attempts++;
      if (attempts < maxAttempts) {
        console.log(`[Auth] Waiting for session... (attempt ${attempts}/${maxAttempts})`);
        await new Promise(resolve => setTimeout(resolve, 500));
      }
    }

    if (!session) {
      console.error('[Auth] No session available after', maxAttempts, 'attempts');
      router.push('/login');
      return;
    }

    setAccessToken(session.access_token);
    setCurrentUserId(session.user.id);
    await loadWorkspace(session.access_token);
    await loadChannels(session.access_token);
    await loadWorkspaceMembers(session.access_token);
    await loadReminders(session.access_token);
  };

  useEffect(() => {
    if (activeChannelId && accessToken) {
      setMessagesLoading(true);
      loadMessages(activeChannelId);
      loadDraftForChannel(activeChannelId);

      // Clean up any existing subscription first
      if (subscriptionCleanupRef.current) {
        subscriptionCleanupRef.current();
        subscriptionCleanupRef.current = null;
      }

      // Wait a bit for OAuth sessions to be fully established
      // This is especially important for OAuth accounts
      const setupSubscription = async () => {
        const supabase = createClient();
        
        // For OAuth accounts, wait longer and verify session multiple times
        let sessionReady = false;
        let attempts = 0;
        const maxAttempts = 10; // Try for up to 5 seconds
        
        while (!sessionReady && attempts < maxAttempts) {
          const { data: { session }, error } = await supabase.auth.getSession();
          
          if (error) {
            console.error('[Realtime] Error checking session:', error);
          }
          
          if (session && session.access_token) {
            console.log('[Realtime] ✅ Session ready for subscription setup');
            console.log('[Realtime] User:', session.user.id, 'Provider:', session.user.app_metadata?.provider || 'email');
            sessionReady = true;
            break;
          } else {
            attempts++;
            console.log(`[Realtime] Waiting for session... (attempt ${attempts}/${maxAttempts})`);
            await new Promise(resolve => setTimeout(resolve, 500));
          }
        }
        
        if (!sessionReady) {
          console.warn('[Realtime] ⚠️ Session not ready after waiting, but proceeding with subscription setup');
        }
        
        // Set up realtime subscription and store cleanup function
        const cleanup = setupRealtimeSubscription(activeChannelId);
        subscriptionCleanupRef.current = cleanup;
      };

      setupSubscription();

      // Fallback: Poll for new messages every 5 seconds ONLY if realtime is not connected
      const startPolling = () => {
        if (pollIntervalRef.current) {
          clearInterval(pollIntervalRef.current);
        }
        pollIntervalRef.current = setInterval(() => {
          if (activeChannelId && accessToken && !realtimeConnectedRef.current) {
            console.log('[Realtime] Polling for new messages (realtime not connected)');
            loadMessages(activeChannelId);
          }
        }, 5000);
      };

      // Start polling if realtime is not connected
      if (!realtimeConnectedRef.current) {
        startPolling();
      }

      // Return cleanup function to unsubscribe when channel changes or component unmounts
      return () => {
        if (subscriptionCleanupRef.current) {
          subscriptionCleanupRef.current();
          subscriptionCleanupRef.current = null;
        }
        if (pollIntervalRef.current) {
          clearInterval(pollIntervalRef.current);
          pollIntervalRef.current = null;
        }
        realtimeConnectedRef.current = false;
      };
    }
  }, [activeChannelId, accessToken]); // Removed realtimeConnected from dependencies!

  useEffect(() => {
    if (viewMode === 'drafts' && accessToken) {
      loadDrafts();
    } else if (viewMode === 'saved' && accessToken) {
      loadSavedItems();
    }
  }, [viewMode, accessToken]);

  // Auto-save draft when message input changes
  useEffect(() => {
    if (draftSaveTimeoutRef.current) {
      clearTimeout(draftSaveTimeoutRef.current);
    }

    if (activeChannelId && messageInput.trim() && accessToken) {
      draftSaveTimeoutRef.current = setTimeout(() => {
        saveDraft(accessToken, workspaceId, activeChannelId, messageInput);
      }, 1000); // Save after 1 second of inactivity
    } else if (activeChannelId && !messageInput.trim() && accessToken) {
      // Delete draft if input is empty
      saveDraft(accessToken, workspaceId, activeChannelId, '');
    }

    return () => {
      if (draftSaveTimeoutRef.current) {
        clearTimeout(draftSaveTimeoutRef.current);
      }
    };
  }, [messageInput, activeChannelId, accessToken, workspaceId]);

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

  const loadWorkspaceMembers = async (token: string) => {
    const result = await getWorkspaceMembers(token, workspaceId);
    if (result.data) {
      setWorkspaceMembers(result.data);
    }
  };

  const loadReminders = async (token: string) => {
    const result = await getReminders(token, workspaceId);
    if (result.data) {
      setReminders(result.data);
    }
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
      // Load saved message IDs for this channel
      const savedResult = await getSavedItems(accessToken);
      if (!savedResult.error && savedResult.data) {
        const savedIds = new Set(savedResult.data.map((item: any) => item.message_id));
        setSavedMessageIds(savedIds);
      }

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
    // Reuse existing client or create new one
    if (!supabaseClientRef.current) {
      supabaseClientRef.current = createClient();
    }
    const supabase = supabaseClientRef.current;
    
    let reconnectAttempts = 0;
    const maxReconnectAttempts = 5;
    let channel: ReturnType<typeof supabase.channel> | null = null;
    let subscriptionStarted = false;

    // Ensure we have a fresh session for realtime before subscribing
    // This is critical for OAuth accounts which may need time to establish session
    const initializeSubscription = async () => {
      try {
        console.log('[Realtime] Initializing subscription for channel:', channelId);
        
        // Wait for session to be available (important for OAuth)
        // Try multiple times with increasing delays for OAuth accounts
        let session = null;
        let attempts = 0;
        const maxAttempts = 5;
        
        while (!session && attempts < maxAttempts) {
          const { data: { session: currentSession }, error: sessionError } = await supabase.auth.getSession();
          
          if (sessionError) {
            console.error(`[Realtime] Session error (attempt ${attempts + 1}):`, sessionError);
            attempts++;
            if (attempts < maxAttempts) {
              await new Promise(resolve => setTimeout(resolve, 500 * attempts)); // Exponential backoff
            }
            continue;
          }

          if (currentSession) {
            session = currentSession;
            console.log('[Realtime] ✅ Session confirmed for realtime, user:', session.user.id, 'Provider:', session.user.app_metadata?.provider);
            break;
          } else {
            console.warn(`[Realtime] No session available (attempt ${attempts + 1}/${maxAttempts})`);
            attempts++;
            
            if (attempts < maxAttempts) {
              // For OAuth accounts, try refreshing the session
              console.log('[Realtime] Attempting to refresh session...');
              const { data: { session: refreshedSession }, error: refreshError } = await supabase.auth.refreshSession();
              
              if (!refreshError && refreshedSession) {
                session = refreshedSession;
                console.log('[Realtime] ✅ Session refreshed for realtime, user:', refreshedSession.user.id);
                break;
              } else {
                console.warn('[Realtime] Refresh failed, waiting before retry...');
                await new Promise(resolve => setTimeout(resolve, 500 * attempts));
              }
            }
          }
        }

        if (!session) {
          console.error('[Realtime] ❌ Failed to get session after', maxAttempts, 'attempts. Cannot subscribe to realtime.');
          realtimeConnectedRef.current = false;
          return;
        }

        // Verify session has access token
        if (!session.access_token) {
          console.error('[Realtime] ❌ Session exists but has no access token');
          realtimeConnectedRef.current = false;
          return;
        }

        // Only start subscription once
        if (!subscriptionStarted) {
          subscriptionStarted = true;
          console.log('[Realtime] Starting subscription to channel:', channelId);
          await subscribeToChannel();
        }
      } catch (error) {
        console.error('[Realtime] ❌ Error initializing subscription:', error);
        realtimeConnectedRef.current = false;
      }
    };

    // Start initialization
    initializeSubscription();

    // Helper function to format a message with profile data
    const formatMessageWithProfile = async (msg: any) => {
      if (!accessToken) {
        console.log('[Realtime] No access token available');
        return null;
      }

      try {
        // Use the same client that has the session
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('id, username, email, avatar_url')
          .eq('id', msg.sender_id)
          .single();

        if (profileError) {
          console.log('[Realtime] Profile fetch error:', profileError);
        }

        // Fetch reactions
        const reactionsResult = await getMessageReactions(accessToken, msg.id);
        if (reactionsResult.error) {
          console.log('[Realtime] Reactions fetch error:', reactionsResult.error);
        }

        // Fetch attachments
        const attachmentsResult = await getMessageAttachments(accessToken, msg.id);
        if (attachmentsResult.error) {
          console.log('[Realtime] Attachments fetch error:', attachmentsResult.error);
        }

        return {
          id: msg.id,
          user: profile?.username || profile?.email?.split('@')[0] || 'Unknown',
          avatar: profile?.avatar_url || (profile?.username?.[0]?.toUpperCase() || profile?.email?.[0]?.toUpperCase() || 'U'),
          content: msg.content,
          timestamp: new Date(msg.created_at).toLocaleTimeString('en-US', {
            hour: 'numeric',
            minute: '2-digit'
          }),
          senderId: msg.sender_id,
          reactions: reactionsResult.data || [],
          threadId: msg.thread_id,
          editedAt: msg.edited_at,
          deletedAt: msg.deleted_at,
          attachments: attachmentsResult.data || [],
        };
      } catch (error) {
        console.error('[Realtime] Error formatting message:', error);
        return null;
      }
    };

    // Handle new message INSERT
    const handleNewMessage = async (payload: any) => {
      console.log('[Realtime] INSERT event received:', payload);
      const newMsg = payload.new;
      if (!newMsg) {
        console.log('[Realtime] No new message data');
        return;
      }

      if (newMsg.channel_id !== channelId) {
        console.log('[Realtime] Message filtered - channelId mismatch:', newMsg.channel_id, 'vs', channelId);
        return;
      }

      console.log('[Realtime] Formatting new message...');
      const formattedMessage = await formatMessageWithProfile(newMsg);
      if (formattedMessage) {
        console.log('[Realtime] Adding message to state:', formattedMessage.id);
        setMessages(prev => {
          // Check if message already exists (prevent duplicates)
          if (prev.some(m => m.id === formattedMessage.id)) {
            console.log('[Realtime] Duplicate message, skipping');
            return prev;
          }
          console.log('[Realtime] Message successfully added, new count:', prev.length + 1);
          return [...prev, formattedMessage];
        });
      } else {
        console.log('[Realtime] Failed to format message');
      }
    };

    // Handle message UPDATE (edits)
    const handleMessageUpdate = async (payload: any) => {
      const updatedMsg = payload.new;
      if (!updatedMsg || updatedMsg.channel_id !== channelId) return;

      const formattedMessage = await formatMessageWithProfile(updatedMsg);
      if (formattedMessage) {
        setMessages(prev => prev.map(msg =>
          msg.id === formattedMessage.id ? formattedMessage : msg
        ));
      }
    };

    // Handle message DELETE
    const handleMessageDelete = (payload: any) => {
      const deletedMsg = payload.old;
      if (!deletedMsg) return;

      setMessages(prev => prev.filter(msg => msg.id !== deletedMsg.id));
    };

    const subscribeToChannel = async () => {
      // Double-check session before subscribing (critical for OAuth)
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError) {
        console.error('[Realtime] ❌ Session error when subscribing:', sessionError);
        realtimeConnectedRef.current = false;
        return;
      }
      
      if (!session) {
        console.error('[Realtime] ❌ Cannot subscribe - no session available');
        realtimeConnectedRef.current = false;
        return;
      }

      if (!session.access_token) {
        console.error('[Realtime] ❌ Cannot subscribe - session has no access token');
        realtimeConnectedRef.current = false;
        return;
      }

      console.log('[Realtime] Setting up subscription for channel:', channelId);
      console.log('[Realtime] User ID:', session.user.id);
      console.log('[Realtime] User email:', session.user.email);
      console.log('[Realtime] Auth provider:', session.user.app_metadata?.provider || 'email');
      console.log('[Realtime] Access token present:', !!session.access_token);
      
      // Remove existing channel if any
      if (channel) {
        supabase.removeChannel(channel);
      }

      channel = supabase
        .channel(`messages:${channelId}`, {
          config: {
            broadcast: { self: true },
            presence: { key: '' }
          }
        })
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'messages',
            filter: `channel_id=eq.${channelId}`,
          },
          handleNewMessage
        )
        .on(
          'postgres_changes',
          {
            event: 'UPDATE',
            schema: 'public',
            table: 'messages',
            filter: `channel_id=eq.${channelId}`,
          },
          handleMessageUpdate
        )
        .on(
          'postgres_changes',
          {
            event: 'DELETE',
            schema: 'public',
            table: 'messages',
            filter: `channel_id=eq.${channelId}`,
          },
          handleMessageDelete
        )
        .subscribe(async (status, err) => {
          const sessionInfo = await supabase.auth.getSession();
          const userInfo = sessionInfo.data?.session?.user;
          console.log('[Realtime] Subscription status:', status);
          console.log('[Realtime] User:', userInfo?.id, userInfo?.email, 'Provider:', userInfo?.app_metadata?.provider);
          if (err) {
            console.error('[Realtime] Error details:', err);
            console.error('[Realtime] Error message:', err.message || err);
            console.error('[Realtime] Error type:', typeof err);
          }
          
          if (status === 'SUBSCRIBED') {
            console.log('[Realtime] ✅ Successfully subscribed to channel:', channelId);
            console.log('[Realtime] ✅ Realtime is now active for user:', userInfo?.id);
            reconnectAttempts = 0; // Reset on success
            realtimeConnectedRef.current = true;
            // Stop polling when realtime connects
            if (pollIntervalRef.current) {
              clearInterval(pollIntervalRef.current);
              pollIntervalRef.current = null;
            }
          } else if (status === 'CHANNEL_ERROR') {
            realtimeConnectedRef.current = false;
            console.error('[Realtime] ❌ Channel error for channel:', channelId, 'Error details:', err);
            
            // For OAuth accounts, try refreshing session before reconnecting
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) {
              console.warn('[Realtime] No session available, attempting to refresh...');
              const { data: { session: refreshedSession } } = await supabase.auth.refreshSession();
              if (!refreshedSession) {
                console.error('[Realtime] Failed to refresh session, cannot reconnect');
                return;
              }
            }
            
            // Only reconnect if we haven't exceeded max attempts
            if (reconnectAttempts < maxReconnectAttempts) {
              reconnectAttempts++;
              const delay = Math.min(1000 * Math.pow(2, reconnectAttempts), 30000); // Exponential backoff, max 30s
              console.log(`[Realtime] Attempting reconnect ${reconnectAttempts}/${maxReconnectAttempts} in ${delay}ms...`);
              
              setTimeout(() => {
                if (channel) {
                  subscribeToChannel();
                }
              }, delay);
            } else {
              console.error('[Realtime] Max reconnection attempts reached. Realtime may not be enabled on the database.');
              console.error('[Realtime] Please run: supabase/enable_realtime_extension.sql in Supabase SQL Editor');
            }
          } else if (status === 'TIMED_OUT') {
            console.warn('[Realtime] ⏱️ Subscription timed out for channel:', channelId);
            realtimeConnectedRef.current = false;
            if (reconnectAttempts < maxReconnectAttempts) {
              reconnectAttempts++;
              setTimeout(() => subscribeToChannel(), 2000);
            }
          } else if (status === 'CLOSED') {
            console.log('[Realtime] 🔒 Subscription closed for channel:', channelId);
            realtimeConnectedRef.current = false;
          }
        });
    };

    // Subscription will be started by initializeSubscription() after session is confirmed

    return () => {
      subscriptionStarted = false;
      if (channel) {
        console.log('[Realtime] Cleaning up subscription for channel:', channelId);
        supabase.removeChannel(channel);
        channel = null;
        realtimeConnectedRef.current = false;
      }
    };
  };

  const handleChannelClick = (channel: Channel) => {
    setActiveChannelId(channel.id);
    setActiveChannelName(`#${channel.name}`);
    setMessages([]);
    setReplyToMessage(null);
    setShowThreadView(false);
    setViewMode('channels');
    setShowSidebar(false); // Close sidebar on mobile after selection
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!messageInput.trim() || !activeChannelId || sending) return;

    // Refresh session to get fresh access token
    const supabase = createClient();
    const { data: { session } } = await supabase.auth.getSession();

    if (!session) {
      toast.error('Session expired. Please refresh the page.');
      router.push('/login');
      return;
    }

    // Use fresh access token
    const freshAccessToken = session.access_token;

    setSending(true);
    setError('');

    const result = await sendMessage(
      freshAccessToken,
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

      // Clear draft after sending
      if (activeChannelId && freshAccessToken) {
        await saveDraft(freshAccessToken, workspaceId, activeChannelId, '');
      }

      // Optimistically add the message to UI immediately
      // This ensures sender sees their message right away
      if (result.data) {
        const optimisticMessage = {
          id: result.data.id,
          user: result.data.user,
          avatar: result.data.avatar,
          content: result.data.content,
          timestamp: new Date(result.data.timestamp).toLocaleTimeString('en-US', {
            hour: 'numeric',
            minute: '2-digit'
          }),
          senderId: result.data.senderId,
          reactions: [],
          threadId: result.data.threadId,
          attachments: [],
        };

        setMessages(prev => {
          // Check if message already exists (realtime might have added it)
          if (prev.some(m => m.id === optimisticMessage.id)) return prev;
          return [...prev, optimisticMessage];
        });
      }

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
      // No need to reload messages - realtime subscription will handle it
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
      // No need to reload messages - realtime subscription will handle it
    }
  };

  const handleAddReaction = async (messageId: string, emoji: string) => {
    if (!accessToken) return;

    const result = await addReaction(accessToken, messageId, emoji);

    if (result.error) {
      toast.error(result.error);
    } else {
      // Update reactions for this specific message
      const reactionsResult = await getMessageReactions(accessToken, messageId);
      if (!reactionsResult.error) {
        setMessages(prev => prev.map(msg =>
          msg.id === messageId
            ? { ...msg, reactions: reactionsResult.data || [] }
            : msg
        ));
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
      // Update reactions for this specific message
      const reactionsResult = await getMessageReactions(accessToken, messageId);
      if (!reactionsResult.error) {
        setMessages(prev => prev.map(msg =>
          msg.id === messageId
            ? { ...msg, reactions: reactionsResult.data || [] }
            : msg
        ));
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

  const loadDraftForChannel = async (channelId: string) => {
    if (!accessToken) return;
    const result = await getDrafts(accessToken, workspaceId);
    if (!result.error && result.data) {
      const draft = result.data.find((d: any) => d.channel_id === channelId);
      if (draft) {
        setMessageInput(draft.content);
      }
    }
  };

  const loadDrafts = async () => {
    if (!accessToken) return;
    const result = await getDrafts(accessToken, workspaceId);
    if (result.error) {
      toast.error(result.error);
    } else {
      setDrafts(result.data || []);
    }
  };

  const loadSavedItems = async () => {
    if (!accessToken) return;
    const result = await getSavedItems(accessToken);
    if (result.error) {
      toast.error(result.error);
    } else {
      setSavedItems(result.data || []);
      // Build set of saved message IDs for quick lookup
      const savedIds = new Set((result.data || []).map((item: any) => item.message_id));
      setSavedMessageIds(savedIds);
    }
  };

  const handleUseDraft = (draft: any) => {
    if (draft.channel_id) {
      setActiveChannelId(draft.channel_id);
      setActiveChannelName(`#${draft.channel?.name || 'channel'}`);
    }
    setMessageInput(draft.content);
    setViewMode('channels');
    toast.success('Draft loaded!');
  };

  const handleDeleteDraft = async (draftId: string) => {
    if (!accessToken) return;
    const result = await deleteDraft(accessToken, draftId);
    if (result.error) {
      toast.error(result.error);
    } else {
      toast.success('Draft deleted!');
      await loadDrafts();
    }
  };

  const handleSaveMessage = async (messageId: string) => {
    if (!accessToken) return;
    const result = await saveMessage(accessToken, messageId);
    if (result.error) {
      toast.error(result.error);
    } else {
      toast.success('Message saved!');
      setSavedMessageIds(new Set([...savedMessageIds, messageId]));
      if (viewMode === 'saved') {
        await loadSavedItems();
      }
    }
  };

  const handleUnsaveMessage = async (messageId: string) => {
    if (!accessToken) return;
    const result = await unsaveMessage(accessToken, messageId);
    if (result.error) {
      toast.error(result.error);
    } else {
      toast.success('Message unsaved!');
      const newSet = new Set(savedMessageIds);
      newSet.delete(messageId);
      setSavedMessageIds(newSet);
      if (viewMode === 'saved') {
        await loadSavedItems();
      }
    }
  };

  const handleDMsClick = () => {
    setViewMode('members');
  };

  const handleMembersClick = () => {
    setViewMode('members');
  };

  const handleRemindersClick = () => {
    setViewMode('reminders');
    loadReminders(accessToken);
  };

  const handleStartDM = async (member: WorkspaceMember) => {
    setSelectedMember(member);
    const result = await getDirectMessages(accessToken, member.user_id);
    if (result.data) {
      setDmMessages(result.data);
    }
    setShowDMModal(true);
  };

  const handleSendDM = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMember || !dmInput.trim()) return;

    setSendingDM(true);
    const result = await sendDirectMessage(accessToken, selectedMember.user_id, dmInput);
    
    if (result.error) {
      toast.error(result.error);
    } else {
      setDmInput('');
      // Reload DM messages
      const messagesResult = await getDirectMessages(accessToken, selectedMember.user_id);
      if (messagesResult.data) {
        setDmMessages(messagesResult.data);
      }
      toast.success('Message sent!');
    }
    setSendingDM(false);
  };

  const handleCreateReminder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reminderTitle.trim() || !reminderDateTime || !activeChannelId) return;

    setCreatingReminder(true);
    const result = await createReminder(
      accessToken,
      workspaceId,
      activeChannelId,
      reminderTitle,
      reminderDescription,
      reminderDateTime
    );

    if (result.error) {
      toast.error(result.error);
    } else {
      toast.success('Reminder created!');
      setReminderTitle('');
      setReminderDescription('');
      setReminderDateTime('');
      setShowReminderModal(false);
      await loadReminders(accessToken);
    }
    setCreatingReminder(false);
  };

  const handleDeleteReminder = async (reminderId: string) => {
    if (!confirm('Are you sure you want to delete this reminder?')) return;
    
    const result = await deleteReminder(accessToken, reminderId);
    if (result.error) {
      toast.error(result.error);
    } else {
      toast.success('Reminder deleted!');
      await loadReminders(accessToken);
    }
  };

  const playNotificationSound = () => {
    try {
      // Create a pleasant notification chime using Web Audio API
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      
      // First chime
      const osc1 = audioContext.createOscillator();
      const gain1 = audioContext.createGain();
      osc1.connect(gain1);
      gain1.connect(audioContext.destination);
      
      osc1.frequency.value = 523; // C5
      osc1.type = 'sine';
      gain1.gain.setValueAtTime(0.3, audioContext.currentTime);
      gain1.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);
      
      // Second chime (higher)
      const osc2 = audioContext.createOscillator();
      const gain2 = audioContext.createGain();
      osc2.connect(gain2);
      gain2.connect(audioContext.destination);
      
      osc2.frequency.value = 659; // E5
      osc2.type = 'sine';
      gain2.gain.setValueAtTime(0, audioContext.currentTime + 0.15);
      gain2.gain.setValueAtTime(0.25, audioContext.currentTime + 0.15);
      gain2.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.6);
      
      // Third chime (highest)
      const osc3 = audioContext.createOscillator();
      const gain3 = audioContext.createGain();
      osc3.connect(gain3);
      gain3.connect(audioContext.destination);
      
      osc3.frequency.value = 784; // G5
      osc3.type = 'sine';
      gain3.gain.setValueAtTime(0, audioContext.currentTime + 0.3);
      gain3.gain.setValueAtTime(0.2, audioContext.currentTime + 0.3);
      gain3.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.8);
      
      // Start all oscillators
      osc1.start(audioContext.currentTime);
      osc1.stop(audioContext.currentTime + 0.3);
      
      osc2.start(audioContext.currentTime + 0.15);
      osc2.stop(audioContext.currentTime + 0.6);
      
      osc3.start(audioContext.currentTime + 0.3);
      osc3.stop(audioContext.currentTime + 0.8);
      
    } catch (error) {
      console.log('Audio notification not supported:', error);
    }
  };

  const checkForDueReminders = async () => {
    if (!accessToken || !workspaceId) {
      console.log('[Reminders] Skipping check - no accessToken or workspaceId')
      return;
    }
    
    console.log('[Reminders] Checking for due reminders...')
    try {
      const result = await processDueReminders(accessToken, workspaceId);
      console.log('[Reminders] Check result:', result)
      
      if (result.data && result.data.processed > 0) {
        console.log(`[Reminders] Processed ${result.data.processed} due reminders`);
        playNotificationSound();
        toast.success(`${result.data.processed} reminder(s) triggered!`, {
          icon: '🔔'
        });
        
        // Force reload messages multiple times to ensure they appear
        if (activeChannelId) {
          console.log('[Reminders] Reloading messages to show reminders');
          
          // Immediate reload
          await loadMessages(activeChannelId);
          
          // Also manually add the reminder message to the current messages state
          // This ensures it appears immediately without waiting for database sync
          const now = new Date().toISOString();
          const reminderMessages = Array.from({length: result.data.processed}, (_, i) => ({
            id: `reminder-${Date.now()}-${i}`,
            content: `🔔 **Reminder triggered!** Check your reminders for details.`,
            user: 'System',
            avatar: '🔔',
            timestamp: now,
            senderId: 'system',
            reactions: [],
            attachments: []
          }));
          
          // Add reminder messages to current state for immediate display
          setMessages(prev => [...prev, ...reminderMessages]);
          
          // Secondary reload after a short delay to get actual reminder content
          setTimeout(async () => {
            console.log('[Reminders] Secondary message reload');
            await loadMessages(activeChannelId);
          }, 2000);
        }
        
        // Reload reminders list to update status
        await loadReminders(accessToken);
      }
    } catch (error) {
      console.error('[Reminders] Error checking due reminders:', error);
    }
  };

  const handleDraftsClick = () => {
    setViewMode('drafts');
    loadDrafts();
  };

  const handleSavedItemsClick = () => {
    setViewMode('saved');
    loadSavedItems();
  };

  const handleStartCall = async () => {
    if (!accessToken) return;
    try {
      // Fire notification to #general that a call is starting
      const callUrl = `${window.location.origin}/call/${workspaceId}`;
      await notifyCallStart(accessToken, workspaceId, callUrl);
    } catch (err) {
      console.error('[Call] notify error', err);
      // keep silent, still navigate to call
    }
    router.push(`/call/${workspaceId}`);
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
                className={`w-full text-left px-3 py-2 rounded transition-colors flex items-center gap-2 ${viewMode === 'members' ? 'bg-white/20' : 'hover:bg-white/10'
                  }`}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                </svg>
                Members ({workspaceMembers.length})
              </button>
              <button
                onClick={handleRemindersClick}
                className={`w-full text-left px-3 py-2 rounded transition-colors flex items-center gap-2 ${viewMode === 'reminders' ? 'bg-white/20' : 'hover:bg-white/10'
                  }`}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Reminders ({reminders.filter(r => r.status === 'pending').length})
              </button>
              <button
                onClick={handleDraftsClick}
                className={`w-full text-left px-3 py-2 rounded transition-colors flex items-center gap-2 ${viewMode === 'drafts' ? 'bg-white/20' : 'hover:bg-white/10'
                  }`}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
                Drafts
              </button>
              <button
                onClick={handleSavedItemsClick}
                className={`w-full text-left px-3 py-2 rounded transition-colors flex items-center gap-2 ${viewMode === 'saved' ? 'bg-white/20' : 'hover:bg-white/10'
                  }`}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                </svg>
                Saved Items
              </button>
            </div>
          </div>

          {viewMode === 'channels' && (
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
                      className={`w-full text-left px-3 py-2 rounded transition-colors ${activeChannelId === channel.id ? 'bg-white/20' : 'hover:bg-white/10'
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
          )}

          {viewMode === 'drafts' && (
            <div>
              <div className="text-xs font-semibold text-white/70 mb-2">DRAFTS</div>
              <div className="space-y-1">
                {drafts.length === 0 ? (
                  <div className="text-white/50 text-sm px-3 py-2">No drafts</div>
                ) : (
                  drafts.map((draft) => (
                    <div
                      key={draft.id}
                      className="group px-3 py-2 rounded hover:bg-white/10 transition-colors"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <button
                          onClick={() => handleUseDraft(draft)}
                          className="flex-1 text-left min-w-0"
                        >
                          <div className="text-sm font-medium truncate">
                            {draft.channel ? `#${draft.channel.name}` : 'No channel'}
                          </div>
                          <div className="text-xs text-white/60 truncate mt-1">
                            {draft.content.substring(0, 50)}{draft.content.length > 50 ? '...' : ''}
                          </div>
                        </button>
                        <button
                          onClick={() => handleDeleteDraft(draft.id)}
                          className="opacity-0 group-hover:opacity-100 p-1 hover:bg-white/20 rounded transition-opacity"
                          title="Delete draft"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {viewMode === 'saved' && (
            <div>
              <div className="text-xs font-semibold text-white/70 mb-2">SAVED ITEMS</div>
              <div className="space-y-1">
                {savedItems.length === 0 ? (
                  <div className="text-white/50 text-sm px-3 py-2">No saved items</div>
                ) : (
                  savedItems.map((item) => {
                    const message = item.message;
                    const sender = message?.sender;
                    return (
                      <div
                        key={item.id}
                        className="group px-3 py-2 rounded hover:bg-white/10 transition-colors"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <button
                            onClick={() => {
                              if (message?.channel_id) {
                                setActiveChannelId(message.channel_id);
                                setActiveChannelName(`#${message.channel?.name || 'channel'}`);
                                setViewMode('channels');
                                setShowSidebar(false);
                              }
                            }}
                            className="flex-1 text-left min-w-0"
                          >
                            <div className="text-sm font-medium truncate">
                              {message?.channel ? `#${message.channel.name}` : 'Unknown channel'}
                            </div>
                            <div className="text-xs text-white/60 truncate mt-1">
                              {sender?.username || sender?.email?.split('@')[0] || 'Unknown'}: {message?.content?.substring(0, 50)}{message?.content?.length > 50 ? '...' : ''}
                            </div>
                          </button>
                          <button
                            onClick={() => handleUnsaveMessage(message?.id)}
                            className="opacity-0 group-hover:opacity-100 p-1 hover:bg-white/20 rounded transition-opacity"
                            title="Unsave"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                            </svg>
                          </button>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          )}

          {viewMode === 'members' && (
            <div>
              <div className="text-xs font-semibold text-white/70 mb-2">WORKSPACE MEMBERS ({workspaceMembers.length})</div>
              <div className="space-y-1 max-h-64 overflow-y-auto">
                {workspaceMembers.length === 0 ? (
                  <div className="text-white/50 text-sm px-3 py-2">Loading members...</div>
                ) : (
                  workspaceMembers.map((member) => (
                    <div
                      key={member.id}
                      className="group flex items-center gap-2 px-3 py-2 rounded hover:bg-white/10 transition-colors cursor-pointer"
                      onClick={() => handleStartDM(member)}
                    >
                      <div className="relative">
                        <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center text-sm font-medium overflow-hidden">
                          {member.avatar_url ? (
                            <img src={member.avatar_url} alt={member.username} className="w-8 h-8 rounded-full object-cover" />
                          ) : (
                            member.username?.[0]?.toUpperCase() || 'U'
                          )}
                        </div>
                        {member.is_online && (
                          <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 border-2 border-maroon rounded-full"></div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium text-white truncate">{member.username}</div>
                        <div className="text-xs text-white/50">{member.role}</div>
                      </div>
                      <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                        <svg className="w-4 h-4 text-white/50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                        </svg>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {viewMode === 'reminders' && (
            <div>
              <div className="flex items-center justify-between mb-2">
                <div className="text-xs font-semibold text-white/70">REMINDERS</div>
                <button
                  onClick={() => setShowReminderModal(true)}
                  className="p-1 hover:bg-white/10 rounded text-white/70 hover:text-white"
                  title="Create reminder"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                </button>
              </div>
              <div className="space-y-1 max-h-64 overflow-y-auto">
                {reminders.filter(r => r.status === 'pending').length === 0 ? (
                  <div className="text-white/50 text-sm px-3 py-2">No pending reminders</div>
                ) : (
                  reminders
                    .filter(r => r.status === 'pending')
                    .map((reminder) => (
                      <div
                        key={reminder.id}
                        className="group px-3 py-2 rounded hover:bg-white/10 transition-colors"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1 min-w-0">
                            <div className="text-sm font-medium text-white truncate">{reminder.title}</div>
                            <div className="text-xs text-white/60 truncate">
                              {new Date(reminder.scheduled_time).toLocaleString()}
                            </div>
                            {reminder.description && (
                              <div className="text-xs text-white/50 truncate mt-1">{reminder.description}</div>
                            )}
                          </div>
                          <button
                            onClick={() => handleDeleteReminder(reminder.id)}
                            className="opacity-0 group-hover:opacity-100 p-1 hover:bg-white/20 rounded transition-opacity"
                            title="Delete reminder"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </div>
                      </div>
                    ))
                )}
              </div>
            </div>
          )}
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

            <button
              onClick={() => setShowReminderModal(true)}
              className="hidden sm:inline-flex px-4 py-2 bg-purple-600 text-white rounded-button hover:bg-purple-700 transition-colors text-sm"
              title="Create Reminder"
            >
              + Reminder
            </button>

            <Link
              href={`/workspace/${workspaceId}/members`}
              className="p-2 hover:bg-light-gray rounded"
              title="Manage Members"
            >
              <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
            </Link>

            <button
              onClick={handleStartCall}
              className="p-2 hover:bg-light-gray rounded"
              title="Start Video Call"
            >
              <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
            </button>
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
                  <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-dark-red text-white flex items-center justify-center font-semibold flex-shrink-0 text-sm sm:text-base overflow-hidden">
                    {message.avatar && (message.avatar.startsWith('http://') || message.avatar.startsWith('https://')) ? (
                      <img
                        src={message.avatar}
                        alt={message.user}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          // Fallback to initials if image fails to load
                          const target = e.target as HTMLImageElement;
                          target.style.display = 'none';
                          const parent = target.parentElement;
                          if (parent) {
                            parent.textContent = message.user?.[0]?.toUpperCase() || 'U';
                          }
                        }}
                      />
                    ) : (
                      message.avatar || message.user?.[0]?.toUpperCase() || 'U'
                    )}
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
                              className={`px-2 py-1 border rounded-full text-xs sm:text-sm hover:border-dark-red transition-colors ${isThisReaction ? 'bg-blue-50 border-dark-red' : 'bg-white border-gray-border'
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
                      onSave={() => {
                        if (savedMessageIds.has(message.id)) {
                          handleUnsaveMessage(message.id);
                        } else {
                          handleSaveMessage(message.id);
                        }
                      }}
                      isSaved={savedMessageIds.has(message.id)}
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
                  <div className="w-8 h-8 rounded-full bg-dark-red text-white flex items-center justify-center text-sm font-semibold flex-shrink-0 overflow-hidden">
                    {msg.avatar && (msg.avatar.startsWith('http://') || msg.avatar.startsWith('https://')) ? (
                      <img
                        src={msg.avatar}
                        alt={msg.user}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          // Fallback to initials if image fails to load
                          const target = e.target as HTMLImageElement;
                          target.style.display = 'none';
                          const parent = target.parentElement;
                          if (parent) {
                            parent.textContent = msg.user?.[0]?.toUpperCase() || 'U';
                          }
                        }}
                      />
                    ) : (
                      msg.avatar || msg.user?.[0]?.toUpperCase() || 'U'
                    )}
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

      {/* Direct Message Modal */}
      {showDMModal && selectedMember && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[80vh] overflow-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold">
                  Direct Message with {selectedMember.username}
                </h2>
                <button
                  onClick={() => {
                    setShowDMModal(false);
                    setSelectedMember(null);
                    setDmMessages([]);
                  }}
                  className="p-2 hover:bg-gray-100 rounded"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* DM Messages */}
              <div className="max-h-96 overflow-y-auto mb-4 border border-gray-200 rounded-lg p-4 bg-gray-50">
                {dmMessages.length === 0 ? (
                  <div className="text-center text-gray-500 py-8">
                    No messages yet. Start a conversation!
                  </div>
                ) : (
                  <div className="space-y-4">
                    {dmMessages.map((dm) => (
                      <div key={dm.id} className="flex gap-3">
                        <img
                          src={dm.avatar || '/default-avatar.png'}
                          alt=""
                          className="w-8 h-8 rounded-full"
                        />
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-sm">{dm.sender_name}</span>
                            <span className="text-xs text-gray-500">
                              {new Date(dm.timestamp).toLocaleString()}
                            </span>
                          </div>
                          <p className="text-gray-800 text-sm mt-1">{dm.content}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* DM Input */}
              <form onSubmit={handleSendDM} className="flex gap-2">
                <input
                  type="text"
                  value={dmInput}
                  onChange={(e) => setDmInput(e.target.value)}
                  placeholder="Type a message..."
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
                <button
                  type="submit"
                  disabled={sendingDM || !dmInput.trim()}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {sendingDM ? 'Sending...' : 'Send'}
                </button>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Reminder Modal */}
      {showReminderModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold">Create Reminder</h2>
                <button
                  onClick={() => {
                    setShowReminderModal(false);
                    setReminderTitle('');
                    setReminderDescription('');
                    setReminderDateTime('');
                  }}
                  className="p-2 hover:bg-gray-100 rounded"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <form onSubmit={handleCreateReminder} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Title
                  </label>
                  <input
                    type="text"
                    value={reminderTitle}
                    onChange={(e) => setReminderTitle(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                    placeholder="Reminder title..."
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Description
                  </label>
                  <textarea
                    value={reminderDescription}
                    onChange={(e) => setReminderDescription(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none"
                    rows={3}
                    placeholder="Description..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Schedule for
                  </label>
                  <input
                    type="datetime-local"
                    value={reminderDateTime}
                    onChange={(e) => setReminderDateTime(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                    required
                    min={new Date().toISOString().slice(0, 16)}
                  />
                </div>

                <div className="flex gap-2 pt-4">
                  <button
                    type="submit"
                    disabled={creatingReminder}
                    className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {creatingReminder ? 'Creating...' : 'Create Reminder'}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowReminderModal(false);
                      setReminderTitle('');
                      setReminderDescription('');
                      setReminderDateTime('');
                    }}
                    className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400"
                  >
                    Cancel
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



