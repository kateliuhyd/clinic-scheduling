package com.clinicconnect.repository;

import com.clinicconnect.model.Message;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.core.RowMapper;
import org.springframework.jdbc.support.GeneratedKeyHolder;
import org.springframework.jdbc.support.KeyHolder;
import org.springframework.stereotype.Repository;

import java.sql.PreparedStatement;
import java.sql.Statement;
import java.util.List;
import java.util.Map;

@Repository
public class MessageRepository {

    private static final Logger logger = LoggerFactory.getLogger(MessageRepository.class);
    private final JdbcTemplate jdbcTemplate;

    public MessageRepository(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    private final RowMapper<Message> messageRowMapper = (rs, rowNum) -> {
        Message msg = new Message();
        msg.setMessageId(rs.getLong("message_id"));
        msg.setSenderId(rs.getLong("sender_id"));
        msg.setReceiverId(rs.getLong("receiver_id"));
        msg.setContent(rs.getString("content"));
        msg.setIsRead(rs.getBoolean("is_read"));
        msg.setCreatedAt(rs.getTimestamp("created_at").toLocalDateTime());
        msg.setSenderFirstName(rs.getString("sender_first"));
        msg.setSenderLastName(rs.getString("sender_last"));
        msg.setSenderRole(rs.getString("sender_role"));
        msg.setReceiverFirstName(rs.getString("receiver_first"));
        msg.setReceiverLastName(rs.getString("receiver_last"));
        msg.setReceiverRole(rs.getString("receiver_role"));
        return msg;
    };

    private static final String DETAIL_SELECT = """
            SELECT m.message_id, m.sender_id, m.receiver_id, m.content, m.is_read, m.created_at,
                   s.first_name AS sender_first, s.last_name AS sender_last, s.role AS sender_role,
                   r.first_name AS receiver_first, r.last_name AS receiver_last, r.role AS receiver_role
            FROM messages m
            JOIN users s ON m.sender_id = s.user_id
            JOIN users r ON m.receiver_id = r.user_id
            """;

    /**
     * Get all messages in a conversation between two users.
     */
    public List<Message> findConversation(Long user1Id, Long user2Id) {
        String sql = DETAIL_SELECT +
                " WHERE (m.sender_id = ? AND m.receiver_id = ?) OR (m.sender_id = ? AND m.receiver_id = ?) " +
                "ORDER BY m.created_at ASC";
        return jdbcTemplate.query(sql, messageRowMapper, user1Id, user2Id, user2Id, user1Id);
    }

    /**
     * Get list of users the current user has conversations with, along with last
     * message info.
     */
    public List<Map<String, Object>> findConversationPartners(Long userId) {
        String sql = """
                SELECT u.user_id, u.first_name, u.last_name, u.role,
                       latest.content AS last_message,
                       latest.created_at AS last_message_time,
                       (SELECT COUNT(*) FROM messages m2
                        WHERE m2.sender_id = u.user_id AND m2.receiver_id = ? AND m2.is_read = FALSE) AS unread_count
                FROM users u
                INNER JOIN (
                    SELECT
                        CASE WHEN sender_id = ? THEN receiver_id ELSE sender_id END AS partner_id,
                        content,
                        created_at,
                        ROW_NUMBER() OVER (
                            PARTITION BY CASE WHEN sender_id = ? THEN receiver_id ELSE sender_id END
                            ORDER BY created_at DESC
                        ) AS rn
                    FROM messages
                    WHERE sender_id = ? OR receiver_id = ?
                ) latest ON u.user_id = latest.partner_id AND latest.rn = 1
                ORDER BY latest.created_at DESC
                """;
        return jdbcTemplate.queryForList(sql, userId, userId, userId, userId, userId);
    }

    public Message insert(Message message) {
        String sql = "INSERT INTO messages (sender_id, receiver_id, content) VALUES (?, ?, ?)";
        logger.info("Sending message from {} to {}", message.getSenderId(), message.getReceiverId());

        KeyHolder keyHolder = new GeneratedKeyHolder();
        jdbcTemplate.update(connection -> {
            PreparedStatement ps = connection.prepareStatement(sql, Statement.RETURN_GENERATED_KEYS);
            ps.setLong(1, message.getSenderId());
            ps.setLong(2, message.getReceiverId());
            ps.setString(3, message.getContent());
            return ps;
        }, keyHolder);

        message.setMessageId(keyHolder.getKey().longValue());
        return message;
    }

    public void markAsRead(Long messageId) {
        jdbcTemplate.update("UPDATE messages SET is_read = TRUE WHERE message_id = ?", messageId);
    }

    public void markConversationAsRead(Long senderId, Long receiverId) {
        jdbcTemplate.update(
                "UPDATE messages SET is_read = TRUE WHERE sender_id = ? AND receiver_id = ? AND is_read = FALSE",
                senderId, receiverId);
    }
}
