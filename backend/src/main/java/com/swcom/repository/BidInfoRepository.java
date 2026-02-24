package com.swcom.repository;

import com.swcom.entity.BidInfo;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface BidInfoRepository extends JpaRepository<BidInfo, UUID> {

    Optional<BidInfo> findByContractId(UUID contractId);
}
