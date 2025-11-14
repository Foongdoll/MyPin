package com.foongdoll.server.websocket.service;

import com.foongdoll.server.websocket.domain.ChatMessageEntity;
import com.foongdoll.server.websocket.dto.ChatMessage;
import com.foongdoll.server.websocket.dto.ChatRedisMessage;
import com.foongdoll.server.websocket.repository.ChatMessageEntityRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Duration;
import java.util.List;
import java.util.Set;

@Slf4j
@Service
@RequiredArgsConstructor
public class ChatMessageService {

    private static final String CHAT_KEY_PREFIX = "chat:room:";

    private final RedisTemplate<String, ChatRedisMessage> chatRedisTemplate;
    private final ChatMessageEntityRepository chatMessageEntityRepository;

    public void saveToRedis(ChatMessage msg) {
        ChatRedisMessage redisMsg = ChatRedisMessage.from(msg);
        String key = CHAT_KEY_PREFIX + redisMsg.getRoomId();

        chatRedisTemplate.opsForList().rightPush(key, redisMsg);
        chatRedisTemplate.expire(key, Duration.ofHours(24));
    }

    @Transactional(readOnly = true)
    public List<ChatRedisMessage> loadRecentMessages(String roomId, int limit) {
        int fetchSize = Math.min(Math.max(limit, 1), 100);
        List<ChatMessageEntity> entities = chatMessageEntityRepository.findTop100ByRoomIdOrderByTsDesc(roomId);
        return entities.stream()
                .limit(fetchSize)
                .map(ChatRedisMessage::fromEntity)
                .sorted((a, b) -> Long.compare(a.getTs(), b.getTs()))
                .toList();
    }

    @Transactional
    public void flushRoom(String roomId) {
        String key = CHAT_KEY_PREFIX + roomId;
        List<ChatRedisMessage> list = chatRedisTemplate.opsForList().range(key, 0, -1);
        if (list == null || list.isEmpty()) {
            return;
        }
        persistMessages(list);
        chatRedisTemplate.delete(key);
        log.info("Flushed {} messages from room {} to DB", list.size(), roomId);
    }

    @Scheduled(cron = "0 */5 * * * *")
    @Transactional
    public void flushRedisToDb() {
        String pattern = CHAT_KEY_PREFIX + "*";
        Set<String> keys = chatRedisTemplate.keys(pattern);

        if (keys == null || keys.isEmpty()) {
            return;
        }

        for (String key : keys) {
            List<ChatRedisMessage> list = chatRedisTemplate.opsForList().range(key, 0, -1);
            if (list == null || list.isEmpty()) {
                continue;
            }

            persistMessages(list);
            chatRedisTemplate.delete(key);

            log.info("Flushed {} messages from Redis key {} to DB", list.size(), key);
        }
    }

    private void persistMessages(List<ChatRedisMessage> list) {
        List<ChatMessageEntity> entities = list.stream()
                .map(ChatMessageEntity::fromRedis)
                .toList();
        chatMessageEntityRepository.saveAll(entities);
    }
}