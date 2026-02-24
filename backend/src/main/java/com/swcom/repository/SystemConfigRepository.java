package com.swcom.repository;

import com.swcom.entity.SystemConfig;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface SystemConfigRepository extends JpaRepository<SystemConfig, UUID> {
    
    Optional<SystemConfig> findByConfigKey(String configKey);
    
    boolean existsByConfigKey(String configKey);
}
