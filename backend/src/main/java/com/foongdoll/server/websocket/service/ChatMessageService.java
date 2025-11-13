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
import java.util.*;

@Slf4j
@Service
@RequiredArgsConstructor
public class ChatMessageService {

    private static final String CHAT_KEY_PREFIX = "chat:room:";

    private final RedisTemplate<String, ChatRedisMessage> chatRedisTemplate;
    private final ChatMessageEntityRepository chatMessageEntityRepository;

    /** 🔹 WebSocket에서 메시지 들어올 때 Redis에 먼저 저장 */
    public void saveToRedis(ChatMessage msg) {
        ChatRedisMessage redisMsg = ChatRedisMessage.from(msg);
        String key = CHAT_KEY_PREFIX + redisMsg.getRoomId();

        chatRedisTemplate.opsForList().rightPush(key, redisMsg);

        // 필요하면 TTL도 걸어둠 (예: 24시간)
        chatRedisTemplate.expire(key, Duration.ofHours(24));
    }

    /**
     * 🔹 주기적으로 Redis → DB로 flush
     *   - 예: 5분마다
     *   - Redis keys 사용 (규모 커지면 다른 방식 고려)
     */
    @Scheduled(cron = "0 */5 * * * *") // 매 5분마다
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

            List<ChatMessageEntity> entities = list.stream()
                    .map(ChatMessageEntity::fromRedis)
                    .toList();

            chatMessageEntityRepository.saveAll(entities);

            // flush 후 Redis에서 삭제
            chatRedisTemplate.delete(key);

            log.info("Flushed {} messages from Redis key {} to DB", list.size(), key);
        }
    }
}