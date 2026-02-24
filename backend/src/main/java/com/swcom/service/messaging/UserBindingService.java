package com.swcom.service.messaging;

import com.swcom.config.MessagingProperties;
import com.swcom.dto.messaging.BindingCodeDTO;
import com.swcom.dto.messaging.UserBindingDTO;
import com.swcom.entity.Employee;
import com.swcom.entity.ExternalUserBinding;
import com.swcom.entity.enums.BindingStatus;
import com.swcom.entity.enums.PlatformType;
import com.swcom.repository.EmployeeRepository;
import com.swcom.repository.ExternalUserBindingRepository;
import com.swcom.repository.MessagingPlatformConfigRepository;
import com.swcom.entity.MessagingPlatformConfig;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.security.SecureRandom;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@Slf4j
@SuppressWarnings("null")
public class UserBindingService {

    private final ExternalUserBindingRepository bindingRepository;
    private final EmployeeRepository employeeRepository;
    private final MessagingProperties messagingProperties;
    private final MessagingPlatformConfigRepository platformConfigRepository;
    private final SecureRandom secureRandom = new SecureRandom();

    private static final String DEEP_LINK_CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

    public UserBindingService(ExternalUserBindingRepository bindingRepository,
                              EmployeeRepository employeeRepository,
                              MessagingProperties messagingProperties,
                              MessagingPlatformConfigRepository platformConfigRepository) {
        this.bindingRepository = bindingRepository;
        this.employeeRepository = employeeRepository;
        this.messagingProperties = messagingProperties;
        this.platformConfigRepository = platformConfigRepository;
    }

    @Transactional
    public BindingCodeDTO generateBindingCode(UUID employeeId) {
        Employee employee = employeeRepository.findById(employeeId)
                .orElseThrow(() -> new RuntimeException("员工不存在: " + employeeId));

        String code = generateCode(messagingProperties.getBinding().getCodeLength());
        int expiryMinutes = messagingProperties.getBinding().getCodeExpiryMinutes();
        LocalDateTime expiresAt = LocalDateTime.now().plusMinutes(expiryMinutes);

        // Create a pending binding with the code (platform info filled on bind)
        ExternalUserBinding binding = ExternalUserBinding.builder()
                .employee(employee)
                .platformType(PlatformType.TELEGRAM) // default, will be updated on actual bind
                .platformUserId("pending-" + code)   // placeholder, updated on actual bind
                .bindingCode(code)
                .bindingStatus(BindingStatus.PENDING)
                .codeExpiresAt(expiresAt)
                .build();
        bindingRepository.save(binding);

        log.info("为员工 {} 生成绑定码: {}, 过期时间: {}", employee.getName(), code, expiresAt);

        // Build deep link URL if bot username is available
        String deepLinkUrl = buildTelegramDeepLink(code);

        return BindingCodeDTO.builder()
                .employeeId(employeeId)
                .bindingCode(code)
                .expiresAt(expiresAt)
                .deepLinkUrl(deepLinkUrl)
                .build();
    }

    @Transactional
    public Optional<ExternalUserBinding> validateAndBind(String code, PlatformType platformType,
                                                          String platformUserId, String platformUsername) {
        Optional<ExternalUserBinding> bindingOpt = bindingRepository
                .findByBindingCodeAndBindingStatus(code, BindingStatus.PENDING);

        if (bindingOpt.isEmpty()) {
            log.warn("绑定码无效或已使用: {}", code);
            return Optional.empty();
        }

        ExternalUserBinding binding = bindingOpt.get();

        // Check expiry
        if (binding.getCodeExpiresAt() != null && binding.getCodeExpiresAt().isBefore(LocalDateTime.now())) {
            log.warn("绑定码已过期: {}", code);
            return Optional.empty();
        }

        // Update binding with actual platform info
        binding.setPlatformType(platformType);
        binding.setPlatformUserId(platformUserId);
        binding.setPlatformUsername(platformUsername);
        binding.setBindingStatus(BindingStatus.ACTIVE);
        binding.setBoundAt(LocalDateTime.now());
        binding.setBindingCode(null); // clear code after use
        bindingRepository.save(binding);

        log.info("用户绑定成功: {} -> 员工 {}", platformUserId, binding.getEmployee().getName());
        return Optional.of(binding);
    }

    public Optional<ExternalUserBinding> findActiveBinding(PlatformType platformType, String platformUserId) {
        return bindingRepository.findByPlatformTypeAndPlatformUserIdAndBindingStatus(
                platformType, platformUserId, BindingStatus.ACTIVE);
    }

    public List<UserBindingDTO> getAllBindings() {
        return bindingRepository.findAllWithEmployee().stream()
                .map(this::toDTO)
                .collect(Collectors.toList());
    }

    public List<UserBindingDTO> getBindingsByEmployee(UUID employeeId) {
        return bindingRepository.findByEmployeeId(employeeId).stream()
                .map(this::toDTO)
                .collect(Collectors.toList());
    }

    @Transactional
    public void revokeBinding(UUID bindingId) {
        ExternalUserBinding binding = bindingRepository.findById(bindingId)
                .orElseThrow(() -> new RuntimeException("绑定记录不存在: " + bindingId));
        binding.setBindingStatus(BindingStatus.REVOKED);
        bindingRepository.save(binding);
        log.info("已撤销绑定: {}", bindingId);
    }

    @Transactional
    public void cleanExpiredBindings() {
        List<ExternalUserBinding> expired = bindingRepository.findExpiredPendingBindings(LocalDateTime.now());
        if (!expired.isEmpty()) {
            bindingRepository.deleteAll(expired);
            log.info("清理了 {} 条过期的待绑定记录", expired.size());
        }
    }

    private String generateCode(int length) {
        StringBuilder sb = new StringBuilder(length);
        for (int i = 0; i < length; i++) {
            sb.append(DEEP_LINK_CHARS.charAt(secureRandom.nextInt(DEEP_LINK_CHARS.length())));
        }
        return sb.toString();
    }

    /**
     * 从数据库的 Telegram 平台配置中读取 botUsername，构建深度链接 URL
     */
    private String buildTelegramDeepLink(String bindingCode) {
        try {
            Optional<MessagingPlatformConfig> configOpt = platformConfigRepository
                    .findByPlatformType(PlatformType.TELEGRAM);
            if (configOpt.isPresent()) {
                Map<String, Object> configData = configOpt.get().getConfigData();
                if (configData != null && configData.containsKey("botUsername")) {
                    String botUsername = String.valueOf(configData.get("botUsername"));
                    return "https://t.me/" + botUsername + "?start=" + bindingCode;
                }
            }
        } catch (Exception e) {
            log.warn("构建 Telegram 深度链接失败", e);
        }
        return null;
    }

    private UserBindingDTO toDTO(ExternalUserBinding binding) {
        return UserBindingDTO.builder()
                .id(binding.getId())
                .employeeId(binding.getEmployee().getId())
                .employeeName(binding.getEmployee().getName())
                .platformType(binding.getPlatformType())
                .platformUserId(binding.getPlatformUserId())
                .platformUsername(binding.getPlatformUsername())
                .bindingStatus(binding.getBindingStatus().name())
                .boundAt(binding.getBoundAt())
                .createdAt(binding.getCreatedAt())
                .build();
    }
}
