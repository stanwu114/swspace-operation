package com.swcom.service.messaging;

import com.swcom.dto.AIMessageDTO;
import com.swcom.dto.ChatRequest;
import com.swcom.entity.AsyncMessageTask;
import com.swcom.entity.ExternalUserBinding;
import com.swcom.entity.enums.AsyncTaskStatus;
import com.swcom.entity.enums.AsyncTaskType;
import com.swcom.entity.enums.PlatformType;
import com.swcom.repository.AsyncMessageTaskRepository;
import com.swcom.service.ai.AIAssistantService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@Service
@Slf4j
public class AsyncMessageProcessor {

    private final AsyncMessageTaskRepository taskRepository;
    private final AIAssistantService aiAssistantService;
    private final Map<PlatformType, MessagePlatformAdapter> adapters = new ConcurrentHashMap<>();

    public AsyncMessageProcessor(AsyncMessageTaskRepository taskRepository,
                                 AIAssistantService aiAssistantService,
                                 List<MessagePlatformAdapter> adapterList) {
        this.taskRepository = taskRepository;
        this.aiAssistantService = aiAssistantService;
        adapterList.forEach(adapter -> adapters.put(adapter.getPlatformType(), adapter));
    }

    @Transactional
    public AsyncMessageTask createTask(ExternalUserBinding binding, String messageText,
                                       AsyncTaskType taskType) {
        AsyncMessageTask task = AsyncMessageTask.builder()
                .binding(binding)
                .taskType(taskType)
                .status(AsyncTaskStatus.PENDING)
                .inputData(Map.of("message", messageText))
                .build();
        return taskRepository.save(task);
    }

    @Async("messagingTaskExecutor")
    @Transactional
    public void processTask(AsyncMessageTask task) {
        log.info("开始处理异步任务: {}", task.getId());

        task.setStatus(AsyncTaskStatus.RUNNING);
        task.setStartedAt(LocalDateTime.now());
        taskRepository.save(task);

        try {
            ExternalUserBinding binding = task.getBinding();
            Map<String, Object> inputData = task.getInputData();
            String messageText = inputData != null ? (String) inputData.get("message") : "";

            // Notify user that processing has started
            sendNotification(binding, "正在处理您的请求，请稍候...");

            // Process through AI
            ChatRequest chatRequest = ChatRequest.builder()
                    .moduleName(binding.getPlatformType().name().toLowerCase())
                    .message(messageText)
                    .build();

            AIMessageDTO response = aiAssistantService.sendMessage(chatRequest);

            // Send result
            sendNotification(binding, response.getContent());

            task.setStatus(AsyncTaskStatus.COMPLETED);
            task.setOutputData(Map.of("response", response.getContent()));
            task.setCompletedAt(LocalDateTime.now());
            taskRepository.save(task);

            log.info("异步任务完成: {}", task.getId());

        } catch (Exception e) {
            log.error("异步任务处理失败: {}", task.getId(), e);
            task.setStatus(AsyncTaskStatus.FAILED);
            task.setErrorMessage(e.getMessage());
            task.setRetryCount(task.getRetryCount() + 1);
            taskRepository.save(task);

            ExternalUserBinding binding = task.getBinding();
            if (binding != null) {
                sendNotification(binding, "抱歉，处理您的请求时出现错误，请稍后重试。");
            }
        }
    }

    public long getPendingTaskCount() {
        return taskRepository.countByStatus(AsyncTaskStatus.PENDING);
    }

    private void sendNotification(ExternalUserBinding binding, String text) {
        MessagePlatformAdapter adapter = adapters.get(binding.getPlatformType());
        if (adapter != null) {
            adapter.sendMessage(binding.getPlatformUserId(), text);
        }
    }
}
