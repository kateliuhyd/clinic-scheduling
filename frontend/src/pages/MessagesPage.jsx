import React, { useState, useEffect, useRef } from 'react';
import { messageAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { MessageSquare, Send, User } from 'lucide-react';

export default function MessagesPage() {
    const { user } = useAuth();
    const [conversations, setConversations] = useState([]);
    const [selectedPartner, setSelectedPartner] = useState(null);
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const [loading, setLoading] = useState(true);
    const [sending, setSending] = useState(false);
    const [newConvoId, setNewConvoId] = useState('');
    const [showNewConvo, setShowNewConvo] = useState(false);
    const messagesEndRef = useRef(null);

    useEffect(() => {
        loadConversations();
    }, []);

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    const loadConversations = async () => {
        try {
            const res = await messageAPI.getConversations();
            setConversations(res.data.data);
        } catch (err) {
            console.error('Failed to load conversations:', err);
        } finally {
            setLoading(false);
        }
    };

    const loadMessages = async (partnerId, partnerName, partnerRole) => {
        setSelectedPartner({ id: partnerId, name: partnerName, role: partnerRole });
        try {
            const res = await messageAPI.getConversation(partnerId);
            setMessages(res.data.data);
            // Refresh conversations to update unread counts
            loadConversations();
        } catch (err) {
            console.error('Failed to load messages:', err);
        }
    };

    const handleSend = async (e) => {
        e.preventDefault();
        if (!newMessage.trim() || !selectedPartner) return;

        setSending(true);
        try {
            await messageAPI.send({
                receiverId: selectedPartner.id,
                content: newMessage.trim()
            });
            setNewMessage('');
            // Reload messages
            const res = await messageAPI.getConversation(selectedPartner.id);
            setMessages(res.data.data);
            loadConversations();
        } catch (err) {
            alert('Failed to send message');
        } finally {
            setSending(false);
        }
    };

    const handleStartNewConversation = async (e) => {
        e.preventDefault();
        if (!newConvoId.trim()) return;
        const partnerId = parseInt(newConvoId.trim());
        setShowNewConvo(false);
        setNewConvoId('');
        loadMessages(partnerId, `User #${partnerId}`, '');
    };

    const formatTime = (dt) => {
        const d = new Date(dt);
        const now = new Date();
        const isToday = d.toDateString() === now.toDateString();
        if (isToday) {
            return d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
        }
        return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) + ' ' +
            d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
    };

    if (loading) {
        return <div className="loading"><div className="spinner" /> Loading messages...</div>;
    }

    return (
        <div>
            <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                    <h1>Messages</h1>
                    <p>Communicate securely with your {user.role === 'DOCTOR' ? 'patients' : 'healthcare providers'}</p>
                </div>
                <button className="btn btn-primary btn-sm" onClick={() => setShowNewConvo(!showNewConvo)}>
                    <MessageSquare size={14} /> New Conversation
                </button>
            </div>

            {showNewConvo && (
                <div className="card" style={{ marginBottom: 16 }}>
                    <div className="card-body">
                        <form onSubmit={handleStartNewConversation} style={{ display: 'flex', gap: 12 }}>
                            <input
                                className="form-input"
                                type="text"
                                placeholder="Enter user ID to message..."
                                value={newConvoId}
                                onChange={e => setNewConvoId(e.target.value)}
                                style={{ flex: 1 }}
                            />
                            <button className="btn btn-primary" type="submit">Start</button>
                            <button className="btn btn-secondary" type="button" onClick={() => setShowNewConvo(false)}>Cancel</button>
                        </form>
                    </div>
                </div>
            )}

            <div className="messages-layout">
                {/* Conversations list */}
                <div className="conversations-panel">
                    <div className="conversations-header">
                        Conversations
                    </div>
                    <div style={{ flex: 1, overflowY: 'auto' }}>
                        {conversations.length === 0 ? (
                            <div style={{ padding: 24, textAlign: 'center', color: 'var(--gray-500)', fontSize: 14 }}>
                                No conversations yet. Start a new one!
                            </div>
                        ) : (
                            conversations.map(convo => (
                                <div
                                    key={convo.user_id}
                                    className={`conversation-item ${selectedPartner?.id === convo.user_id ? 'active' : ''}`}
                                    onClick={() => loadMessages(
                                        convo.user_id,
                                        `${convo.first_name} ${convo.last_name}`,
                                        convo.role
                                    )}
                                >
                                    <div className="conversation-avatar">
                                        {convo.first_name?.charAt(0)}{convo.last_name?.charAt(0)}
                                    </div>
                                    <div className="conversation-details">
                                        <div className="conversation-name">
                                            {convo.role === 'DOCTOR' ? 'Dr. ' : ''}{convo.first_name} {convo.last_name}
                                        </div>
                                        <div className="conversation-last-msg">
                                            {convo.last_message || 'No messages'}
                                        </div>
                                    </div>
                                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4 }}>
                                        <span className="conversation-time">
                                            {convo.last_message_time ? formatTime(convo.last_message_time) : ''}
                                        </span>
                                        {convo.unread_count > 0 && (
                                            <div className="unread-dot" title={`${convo.unread_count} unread`} />
                                        )}
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>

                {/* Chat panel */}
                <div className="chat-panel">
                    {selectedPartner ? (
                        <>
                            <div className="chat-header">
                                <div className="conversation-avatar">
                                    {selectedPartner.name.split(' ').map(w => w.charAt(0)).join('').slice(0, 2)}
                                </div>
                                <div>
                                    <h3>{selectedPartner.role === 'DOCTOR' ? 'Dr. ' : ''}{selectedPartner.name}</h3>
                                    {selectedPartner.role && (
                                        <span style={{ fontSize: 12, color: 'var(--gray-500)' }}>{selectedPartner.role}</span>
                                    )}
                                </div>
                            </div>

                            <div className="chat-messages">
                                {messages.length === 0 ? (
                                    <div style={{ textAlign: 'center', color: 'var(--gray-400)', padding: 40 }}>
                                        No messages yet. Start the conversation!
                                    </div>
                                ) : (
                                    messages.map(msg => (
                                        <div key={msg.messageId}>
                                            <div className={`message-bubble ${msg.senderId === user.userId ? 'sent' : 'received'}`}>
                                                {msg.content}
                                                <div className="message-time">{formatTime(msg.createdAt)}</div>
                                            </div>
                                        </div>
                                    ))
                                )}
                                <div ref={messagesEndRef} />
                            </div>

                            <form className="chat-input" onSubmit={handleSend}>
                                <input
                                    type="text"
                                    placeholder="Type a message..."
                                    value={newMessage}
                                    onChange={e => setNewMessage(e.target.value)}
                                    disabled={sending}
                                />
                                <button type="submit" disabled={sending || !newMessage.trim()}>
                                    <Send size={16} />
                                </button>
                            </form>
                        </>
                    ) : (
                        <div style={{
                            display: 'flex', flexDirection: 'column', alignItems: 'center',
                            justifyContent: 'center', flex: 1, color: 'var(--gray-400)'
                        }}>
                            <MessageSquare size={48} style={{ marginBottom: 16, opacity: 0.5 }} />
                            <h3 style={{ fontSize: 18, fontWeight: 600, marginBottom: 8 }}>Select a conversation</h3>
                            <p style={{ fontSize: 14 }}>Choose a conversation from the left or start a new one</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
