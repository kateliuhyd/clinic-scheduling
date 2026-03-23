package com.clinicconnect.controller;

import com.clinicconnect.dto.ApiResponse;
import com.clinicconnect.model.Message;
import com.clinicconnect.repository.MessageRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/messages")
public class MessageController {

    private static final Logger logger = LoggerFactory.getLogger(MessageController.class);
    private final MessageRepository messageRepository;

    public MessageController(MessageRepository messageRepository) {
        this.messageRepository = messageRepository;
    }

    /**
     * GET /api/messages/conversations — List all conversation partners with last
     * message.
     */
    @GetMapping("/conversations")
    public ResponseEntity<ApiResponse<List<Map<String, Object>>>> getConversations(Authentication auth) {
        Long userId = (Long) auth.getPrincipal();
        List<Map<String, Object>> conversations = messageRepository.findConversationPartners(userId);
        return ResponseEntity.ok(ApiResponse.success(conversations));
    }

    /**
     * GET /api/messages/conversation/{userId} — Get full message thread with a
     * specific user.
     */
    @GetMapping("/conversation/{partnerId}")
    public ResponseEntity<ApiResponse<List<Message>>> getConversation(
            @PathVariable Long partnerId, Authentication auth) {
        Long userId = (Long) auth.getPrincipal();
        // Mark all messages from partner as read
        messageRepository.markConversationAsRead(partnerId, userId);
        List<Message> messages = messageRepository.findConversation(userId, partnerId);
        return ResponseEntity.ok(ApiResponse.success(messages));
    }

    /**
     * POST /api/messages — Send a new message.
     */
    @PostMapping
    public ResponseEntity<ApiResponse<Message>> sendMessage(
            @RequestBody Map<String, Object> body, Authentication auth) {
        Long userId = (Long) auth.getPrincipal();
        Long receiverId = Long.valueOf(body.get("receiverId").toString());
        String content = body.get("content").toString();

        Message message = new Message();
        message.setSenderId(userId);
        message.setReceiverId(receiverId);
        message.setContent(content);

        message = messageRepository.insert(message);
        logger.info("Message {} sent from {} to {}", message.getMessageId(), userId, receiverId);
        return ResponseEntity.ok(ApiResponse.success("Message sent", message));
    }
}
