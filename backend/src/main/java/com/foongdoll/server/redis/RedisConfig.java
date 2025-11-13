package com.foongdoll.server.redis;

import com.foongdoll.server.websocket.dto.ChatRedisMessage;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.data.redis.connection.*;
import org.springframework.data.redis.connection.lettuce.LettuceConnectionFactory;
import org.springframework.data.redis.core.*;
import org.springframework.data.redis.serializer.*;

@Configuration
public class RedisConfig {

    @Bean
    public RedisConnectionFactory redisConnectionFactory() {
        // application.yml에 spring.redis.* 설정 맞춰두면 여기 기본 생성자 써도 됨
        return new LettuceConnectionFactory();
    }

    @Bean
    public RedisTemplate<String, ChatRedisMessage> chatRedisTemplate(
            RedisConnectionFactory connectionFactory
    ) {
        RedisTemplate<String, ChatRedisMessage> template = new RedisTemplate<>();
        template.setConnectionFactory(connectionFactory);

        // key는 String
        template.setKeySerializer(new StringRedisSerializer());
        template.setHashKeySerializer(new StringRedisSerializer());

        // value는 JSON으로 직렬화
        Jackson2JsonRedisSerializer<ChatRedisMessage> valueSerializer =
                new Jackson2JsonRedisSerializer<>(ChatRedisMessage.class);

        template.setValueSerializer(valueSerializer);
        template.setHashValueSerializer(valueSerializer);
        template.afterPropertiesSet();
        return template;
    }
}