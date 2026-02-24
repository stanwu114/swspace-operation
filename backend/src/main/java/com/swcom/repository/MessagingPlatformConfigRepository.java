package com.swcom.repository;

import com.swcom.entity.MessagingPlatformConfig;
import com.swcom.entity.enums.PlatformType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface MessagingPlatformConfigRepository extends JpaRepository<MessagingPlatformConfig, UUID> {

    Optional<MessagingPlatformConfig> findByPlatformType(PlatformType platformType);

    List<MessagingPlatformConfig> findByIsEnabledTrue();

    Optional<MessagingPlatformConfig> findByPlatformTypeAndIsEnabledTrue(PlatformType platformType);
}
