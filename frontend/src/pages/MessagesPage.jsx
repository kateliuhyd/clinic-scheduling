import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { messageAPI, doctorAPI, appointmentAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { MessageSquare, Send, User, Search } from 'lucide-react';

export default function MessagesPage() {
    const { user } = useAuth();
    const [conversations, setConversations] = useState([]);
    const [selectedPartner, setSelectedPartner] = useState(null);
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const [loading, setLoading] = useState(true);
    const [sending, setSending] = useState(false);
    const [showNewConvo, setShowNewConvo] = useState(false);
    const [contacts, setContacts] = useState([]);
    const [contactsLoading, setContactsLoading] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const messagesEndRef = useRef(null);
    const [searchParams] = useSearchParams();
    const queryUserId = searchParams.get('userId');

    useEffect(() => {
        loadConversations(queryUserId);
    }, [queryUserId]);

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    const loadConversations = async (targetUserId = null) => {
        try {
            const res = await messageAPI.getConversations();
            const convos = res.data.data;
            setConversations(convos);

            // If we have a target userId from query param, try to find and open it
            if (targetUserId) {
                const partnerId = parseInt(targetUserId);
                const existingConvo = convos.find(c => c.user_id === partnerId);
                if (existingConvo) {
                    loadMessages(
                        existingConvo.user_id,
                        `${existingConvo.first_name} ${existingConvo.last_name}`,
                        existingConvo.role
                    );
                } else {
                    // Start a temporary conversation UI for new partner
                    loadMessages(partnerId, `User #${partnerId}`, '');
                }
            }
        } catch (err) {
            console.error('Failed to load conversations:', err);
        } finally {
            setLoading(false);
        }
    };

    /**
     * Load available contacts based on the user's role:
     * - Patient: show all doctors
     * - Doctor: show patients from their appointments
     */
    const loadContacts = async () => {
        setContactsLoading(true);
        try {
            if (user.role === 'PATIENT') {
                // Patients can message any doctor
                const res = await doctorAPI.getAll();
                const doctors = res.data.data || res.data;
                const contactList = (Array.isArray(doctors) ? doctors : []).map(doc => ({
                    userId: doc.userId,
                    name: `Dr. ${doc.firstName} ${doc.lastName}`,
                    detail: doc.specialty || doc.departmentName || '',
                }));
                setContacts(contactList);
            } else if (user.role === 'DOCTOR') {
                // Doctors can message patients who have/had appointments with them
                const res = await appointmentAPI.getMyDoctor();
                const appointments = res.data.data || res.data;
                // Deduplicate patients by userId
                const seen = new Set();
                const contactList = [];
                (Array.isArray(appointments) ? appointments : []).forEach(appt => {
                    const patientId = appt.patientId;
                    if (patientId && !seen.has(patientId)) {
                        seen.add(patientId);
                        contactList.push({
                            userId: patientId,
                            name: appt.patientName || `Patient #${patientId}`,
                            detail: appt.serviceName || '',
                        });
                    }
                });
                setContacts(contactList);
            }
        } catch (err) {
            console.error('Failed to load contacts:', err);
        } finally {
            setContactsLoading(false);
        }
    };

    const handleShowNewConvo = () => {
        if (!showNewConvo) {
            loadContacts();
        }
        setShowNewConvo(!showNewConvo);
        setSearchTerm('');
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

    const handleSelectContact = (contact) => {
        setShowNewConvo(false);
        setSearchTerm('');
        loadMessages(contact.userId, contact.name, user.role === 'PATIENT' ? 'DOCTOR' : 'PATIENT');
    };

    const filteredContacts = contacts.filter(c =>
        c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.detail.toLowerCase().includes(searchTerm.toLowerCase())
    );

    // Filter out contacts that already have conversations
    const existingPartnerIds = new Set(conversations.map(c => c.user_id));
    const newContacts = filteredContacts.filter(c => !existingPartnerIds.has(c.userId));

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
                <button className="btn btn-primary btn-sm" onClick={handleShowNewConvo}>
                    <MessageSquare size={14} /> New Conversation
                </button>
            </div>

            {showNewConvo && (
                <div className="card" style={{ marginBottom: 16 }}>
                    <div className="card-header">
                        <h3>Select a {user.role === 'PATIENT' ? 'Doctor' : 'Patient'} to message</h3>
                    </div>
                    <div className="card-body">
                        <div style={{ position: 'relative', marginBottom: 12 }}>
                            <Search size={16} style={{
                                position: 'absolute', left: 12, top: '50%',
                                transform: 'translateY(-50%)', color: 'var(--gray-400)'
                            }} />
                            <input
                                className="form-input"
                                type="text"
                                placeholder={`Search ${user.role === 'PATIENT' ? 'doctors' : 'patients'}...`}
                                value={searchTerm}
                                onChange={e => setSearchTerm(e.target.value)}
                                style={{ paddingLeft: 36 }}
                            />
                        </div>

                        {contactsLoading ? (
                            <div className="loading"><div className="spinner" /> Loading contacts...</div>
                        ) : newContacts.length === 0 && filteredContacts.length === 0 ? (
                            <div style={{ padding: 16, textAlign: 'center', color: 'var(--gray-500)', fontSize: 14 }}>
                                {user.role === 'DOCTOR'
                                    ? 'No patients found. Patients with appointments will appear here.'
                                    : 'No doctors found.'}
                            </div>
                        ) : (
                            <div style={{ maxHeight: 240, overflowY: 'auto' }}>
                                {/* Show contacts that already have conversations */}
                                {filteredContacts.filter(c => existingPartnerIds.has(c.userId)).length > 0 && (
                                    <>
                                        <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--gray-500)',
                                            textTransform: 'uppercase', padding: '8px 12px', letterSpacing: '0.05em' }}>
                                            Existing Conversations
                                        </div>
                                        {filteredContacts.filter(c => existingPartnerIds.has(c.userId)).map(contact => (
                                            <div
                                                key={contact.userId}
                                                onClick={() => handleSelectContact(contact)}
                                                style={{
                                                    padding: '10px 12px', cursor: 'pointer',
                                                    display: 'flex', alignItems: 'center', gap: 12,
                                                    borderRadius: 8, transition: 'background 0.15s',
                                                }}
                                                onMouseEnter={e => e.currentTarget.style.background = 'var(--gray-50)'}
                                                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                                            >
                                                <div className="conversation-avatar">
                                                    {contact.name.split(' ').filter(w => w).map(w => w.charAt(0)).join('').slice(0, 2)}
                                                </div>
                                                <div>
                                                    <div style={{ fontWeight: 500, fontSize: 14 }}>{contact.name}</div>
                                                    {contact.detail && (
                                                        <div style={{ fontSize: 12, color: 'var(--gray-500)' }}>{contact.detail}</div>
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                    </>
                                )}

                                {/* Show new contacts */}
                                {newContacts.length > 0 && (
                                    <>
                                        <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--gray-500)',
                                            textTransform: 'uppercase', padding: '8px 12px', letterSpacing: '0.05em',
                                            marginTop: filteredContacts.filter(c => existingPartnerIds.has(c.userId)).length > 0 ? 8 : 0
                                        }}>
                                            {user.role === 'PATIENT' ? 'Available Doctors' : 'Your Patients'}
                                        </div>
                                        {newContacts.map(contact => (
                                            <div
                                                key={contact.userId}
                                                onClick={() => handleSelectContact(contact)}
                                                style={{
                                                    padding: '10px 12px', cursor: 'pointer',
                                                    display: 'flex', alignItems: 'center', gap: 12,
                                                    borderRadius: 8, transition: 'background 0.15s',
                                                }}
                                                onMouseEnter={e => e.currentTarget.style.background = 'var(--gray-50)'}
                                                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                                            >
                                                <div className="conversation-avatar">
                                                    {contact.name.split(' ').filter(w => w).map(w => w.charAt(0)).join('').slice(0, 2)}
                                                </div>
                                                <div>
                                                    <div style={{ fontWeight: 500, fontSize: 14 }}>{contact.name}</div>
                                                    {contact.detail && (
                                                        <div style={{ fontSize: 12, color: 'var(--gray-500)' }}>{contact.detail}</div>
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                    </>
                                )}
                            </div>
                        )}

                        <div style={{ marginTop: 12, textAlign: 'right' }}>
                            <button className="btn btn-secondary btn-sm" onClick={() => setShowNewConvo(false)}>Cancel</button>
                        </div>
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
