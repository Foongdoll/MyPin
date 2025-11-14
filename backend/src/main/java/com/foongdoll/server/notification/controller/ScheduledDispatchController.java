package com.foongdoll.server.notification.controller;

import com.foongdoll.server.notification.dto.ScheduledDispatchRequest;
import com.foongdoll.server.notification.dto.ScheduledDispatchResponse;
import com.foongdoll.server.notification.service.ScheduledDispatchService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/notifications/scheduled")
@RequiredArgsConstructor
public class ScheduledDispatchController {

    private final ScheduledDispatchService scheduledDispatchService;

    @PostMapping
    public ResponseEntity<ScheduledDispatchResponse> create(@RequestBody ScheduledDispatchRequest request) {
        return ResponseEntity.ok(scheduledDispatchService.schedule(request));
    }

    @GetMapping
    public ResponseEntity<List<ScheduledDispatchResponse>> list() {
        return ResponseEntity.ok(scheduledDispatchService.upcoming());
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> cancel(@PathVariable Long id) {
        scheduledDispatchService.cancel(id);
        return ResponseEntity.ok().build();
    }
}
