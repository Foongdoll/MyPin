package com.foongdoll.server.config;

import com.foongdoll.server.schedule.domain.Schedule;
import com.foongdoll.server.schedule.repository.ScheduleRepository;
import com.foongdoll.server.user.domain.User;
import com.foongdoll.server.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Profile;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import java.time.LocalDate;
import java.util.List;

@Component
@Profile("!prod")
@RequiredArgsConstructor
public class DataInitializer implements CommandLineRunner {

    private final UserRepository userRepository;
    private final ScheduleRepository scheduleRepository;
    private final PasswordEncoder passwordEncoder;

    @Override
    public void run(String... args) {
        User user = userRepository.findByUserId("test")
                .orElseGet(() -> userRepository.save(
                        User.builder()
                                .userId("test")
                                .password(passwordEncoder.encode("1234"))
                                .name("테스트 유저")
                                .email("test@mypin.local")
                                .build()
                ));

        if (scheduleRepository.count() == 0) {
            Schedule schedule = Schedule.builder()
                    .title("퍼블리싱 일정 점검")
                    .startDate(LocalDate.now())
                    .endDate(LocalDate.now().plusDays(1))
                    .memo("디자인 QA 진행")
                    .place("서울시 강남구 테헤란로 123")
                    .owner(user)
                    .build();
            schedule.setParticipants(List.of("테스트 유저", "홍길동"));
            scheduleRepository.save(schedule);
        }
    }
}
