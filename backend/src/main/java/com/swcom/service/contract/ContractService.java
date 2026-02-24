package com.swcom.service.contract;

import com.swcom.config.StorageConfig;
import com.swcom.dto.*;
import com.swcom.entity.*;
import com.swcom.entity.enums.ContractStatus;
import com.swcom.entity.enums.ContractType;
import com.swcom.entity.enums.PaymentNodeStatus;
import com.swcom.repository.*;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.math.BigDecimal;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
@SuppressWarnings("null")
public class ContractService {

    private final ContractRepository contractRepository;
    private final PaymentNodeRepository paymentNodeRepository;
    private final BidInfoRepository bidInfoRepository;
    private final ProjectRepository projectRepository;
    private final StorageConfig storageConfig;

    public List<ContractDTO> getList(ContractType type, ContractStatus status, UUID projectId) {
        List<Contract> contracts;

        if (type != null) {
            contracts = contractRepository.findByTypeWithProject(type);
        } else if (status != null) {
            contracts = contractRepository.findByStatusWithProject(status);
        } else if (projectId != null) {
            contracts = contractRepository.findByProjectIdWithProject(projectId);
        } else {
            contracts = contractRepository.findAllWithProject();
        }

        return contracts.stream()
                .map(this::toDTO)
                .collect(Collectors.toList());
    }

    public ContractDTO getById(UUID id) {
        Contract contract = contractRepository.findByIdWithDetails(id)
                .orElseThrow(() -> new EntityNotFoundException("Contract not found with id: " + id));
        return toDetailDTO(contract);
    }

    @Transactional
    public ContractDTO create(ContractForm form) {
        Contract contract = Contract.builder()
                .partyA(form.getPartyA())
                .partyB(form.getPartyB())
                .contractType(form.getContractType())
                .amount(form.getAmount())
                .subcontractEntity(form.getSubcontractEntity())
                .signingDate(form.getSigningDate())
                .status(ContractStatus.DRAFT)
                .build();

        if (form.getProjectId() != null) {
            Project project = projectRepository.findById(form.getProjectId())
                    .orElseThrow(() -> new EntityNotFoundException("Project not found with id: " + form.getProjectId()));
            contract.setProject(project);
        }

        Contract saved = contractRepository.save(contract);
        log.info("Created contract: {} ({})", saved.getPartyA() + " - " + saved.getPartyB(), saved.getContractNo());
        return toDTO(saved);
    }

    @Transactional
    public ContractDTO update(UUID id, ContractForm form) {
        Contract contract = contractRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Contract not found with id: " + id));

        contract.setPartyA(form.getPartyA());
        contract.setPartyB(form.getPartyB());
        contract.setContractType(form.getContractType());
        contract.setAmount(form.getAmount());
        contract.setSubcontractEntity(form.getSubcontractEntity());
        contract.setSigningDate(form.getSigningDate());

        if (form.getProjectId() != null) {
            Project project = projectRepository.findById(form.getProjectId())
                    .orElseThrow(() -> new EntityNotFoundException("Project not found with id: " + form.getProjectId()));
            contract.setProject(project);
        } else {
            contract.setProject(null);
        }

        Contract saved = contractRepository.save(contract);
        log.info("Updated contract: {}", saved.getContractNo());
        return toDTO(saved);
    }

    @Transactional
    public void delete(UUID id) {
        Contract contract = contractRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Contract not found with id: " + id));
        contractRepository.delete(contract);
        log.info("Deleted contract: {}", contract.getContractNo());
    }

    @Transactional
    public ContractDTO updateStatus(UUID id, ContractStatus status) {
        Contract contract = contractRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Contract not found with id: " + id));
        contract.setStatus(status);
        Contract saved = contractRepository.save(contract);
        log.info("Updated contract status: {} -> {}", saved.getContractNo(), status);
        return toDTO(saved);
    }

    @Transactional
    public ContractDTO uploadContractFile(UUID id, MultipartFile file) throws IOException {
        Contract contract = contractRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Contract not found with id: " + id));

        String fileName = UUID.randomUUID() + "_" + file.getOriginalFilename();
        Path uploadPath = Paths.get(storageConfig.getUploadDir(), "contracts", id.toString());
        Files.createDirectories(uploadPath);
        Path filePath = uploadPath.resolve(fileName);
        Files.copy(file.getInputStream(), filePath);

        contract.setContractFilePath(filePath.toString());
        Contract saved = contractRepository.save(contract);
        log.info("Uploaded contract file for: {}", saved.getContractNo());
        return toDTO(saved);
    }

    // Payment Node methods
    public List<PaymentNodeDTO> getPaymentNodes(UUID contractId) {
        return paymentNodeRepository.findByContractIdOrderByNodeOrderAsc(contractId).stream()
                .map(this::toPaymentNodeDTO)
                .collect(Collectors.toList());
    }

    @Transactional
    public PaymentNodeDTO addPaymentNode(UUID contractId, PaymentNodeForm form) {
        Contract contract = contractRepository.findById(contractId)
                .orElseThrow(() -> new EntityNotFoundException("Contract not found with id: " + contractId));

        PaymentNode node = PaymentNode.builder()
                .contract(contract)
                .nodeName(form.getNodeName())
                .nodeOrder(form.getNodeOrder() != null ? form.getNodeOrder() : 0)
                .plannedAmount(form.getPlannedAmount())
                .plannedDate(form.getPlannedDate())
                .remarks(form.getRemarks())
                .status(PaymentNodeStatus.PENDING)
                .build();

        PaymentNode saved = paymentNodeRepository.save(node);
        log.info("Added payment node for contract {}: {}", contract.getContractNo(), form.getNodeName());
        return toPaymentNodeDTO(saved);
    }

    @Transactional
    public PaymentNodeDTO updatePaymentNode(UUID contractId, UUID nodeId, PaymentNodeForm form) {
        PaymentNode node = paymentNodeRepository.findById(nodeId)
                .orElseThrow(() -> new EntityNotFoundException("Payment node not found with id: " + nodeId));

        node.setNodeName(form.getNodeName());
        node.setNodeOrder(form.getNodeOrder() != null ? form.getNodeOrder() : node.getNodeOrder());
        node.setPlannedAmount(form.getPlannedAmount());
        node.setPlannedDate(form.getPlannedDate());
        node.setRemarks(form.getRemarks());

        PaymentNode saved = paymentNodeRepository.save(node);
        log.info("Updated payment node: {}", nodeId);
        return toPaymentNodeDTO(saved);
    }

    @Transactional
    public PaymentNodeDTO completePaymentNode(UUID contractId, UUID nodeId, BigDecimal actualAmount, LocalDate actualDate) {
        PaymentNode node = paymentNodeRepository.findById(nodeId)
                .orElseThrow(() -> new EntityNotFoundException("Payment node not found with id: " + nodeId));

        node.setActualAmount(actualAmount);
        node.setActualDate(actualDate != null ? actualDate : LocalDate.now());
        node.setStatus(PaymentNodeStatus.COMPLETED);

        PaymentNode saved = paymentNodeRepository.save(node);
        log.info("Completed payment node: {}", nodeId);
        return toPaymentNodeDTO(saved);
    }

    @Transactional
    public void deletePaymentNode(UUID contractId, UUID nodeId) {
        PaymentNode node = paymentNodeRepository.findById(nodeId)
                .orElseThrow(() -> new EntityNotFoundException("Payment node not found with id: " + nodeId));
        paymentNodeRepository.delete(node);
        log.info("Deleted payment node: {}", nodeId);
    }

    // Bid Info methods
    public BidInfoDTO getBidInfo(UUID contractId) {
        BidInfo bidInfo = bidInfoRepository.findByContractId(contractId)
                .orElse(null);
        return bidInfo != null ? toBidInfoDTO(bidInfo) : null;
    }

    @Transactional
    public BidInfoDTO saveBidInfo(UUID contractId, BidInfoForm form) {
        Contract contract = contractRepository.findById(contractId)
                .orElseThrow(() -> new EntityNotFoundException("Contract not found with id: " + contractId));

        BidInfo bidInfo = bidInfoRepository.findByContractId(contractId)
                .orElse(BidInfo.builder().contract(contract).build());

        bidInfo.setBidUnit(form.getBidUnit());
        bidInfo.setBidAnnounceDate(form.getBidAnnounceDate());
        bidInfo.setBidSubmitDate(form.getBidSubmitDate());
        bidInfo.setWinDate(form.getWinDate());

        BidInfo saved = bidInfoRepository.save(bidInfo);
        log.info("Saved bid info for contract: {}", contract.getContractNo());
        return toBidInfoDTO(saved);
    }

    private ContractDTO toDTO(Contract contract) {
        BigDecimal paidAmount = paymentNodeRepository.getTotalActualAmount(contract.getId());
        long completedNodes = paymentNodeRepository.countByContractIdAndStatus(contract.getId(), PaymentNodeStatus.COMPLETED);
        long totalNodes = paymentNodeRepository.findByContractIdOrderByNodeOrderAsc(contract.getId()).size();

        return ContractDTO.builder()
                .id(contract.getId())
                .contractNo(contract.getContractNo())
                .partyA(contract.getPartyA())
                .partyB(contract.getPartyB())
                .contractType(contract.getContractType())
                .amount(contract.getAmount())
                .projectId(contract.getProject() != null ? contract.getProject().getId() : null)
                .projectName(contract.getProject() != null ? contract.getProject().getProjectName() : null)
                .subcontractEntity(contract.getSubcontractEntity())
                .signingDate(contract.getSigningDate())
                .contractFilePath(contract.getContractFilePath())
                .status(contract.getStatus())
                .paidAmount(paidAmount)
                .completedNodes((int) completedNodes)
                .totalNodes((int) totalNodes)
                .createdAt(contract.getCreatedAt())
                .updatedAt(contract.getUpdatedAt())
                .build();
    }

    private ContractDTO toDetailDTO(Contract contract) {
        ContractDTO dto = toDTO(contract);
        dto.setBidInfo(contract.getBidInfo() != null ? toBidInfoDTO(contract.getBidInfo()) : null);
        dto.setPaymentNodes(contract.getPaymentNodes().stream()
                .map(this::toPaymentNodeDTO)
                .collect(Collectors.toList()));
        return dto;
    }

    private PaymentNodeDTO toPaymentNodeDTO(PaymentNode node) {
        return PaymentNodeDTO.builder()
                .id(node.getId())
                .contractId(node.getContract().getId())
                .nodeName(node.getNodeName())
                .nodeOrder(node.getNodeOrder())
                .plannedAmount(node.getPlannedAmount())
                .plannedDate(node.getPlannedDate())
                .actualAmount(node.getActualAmount())
                .actualDate(node.getActualDate())
                .status(node.getStatus())
                .remarks(node.getRemarks())
                .build();
    }

    private BidInfoDTO toBidInfoDTO(BidInfo bidInfo) {
        return BidInfoDTO.builder()
                .id(bidInfo.getId())
                .contractId(bidInfo.getContract().getId())
                .bidUnit(bidInfo.getBidUnit())
                .bidAnnounceDate(bidInfo.getBidAnnounceDate())
                .bidAnnounceDocPath(bidInfo.getBidAnnounceDocPath())
                .bidSubmitDate(bidInfo.getBidSubmitDate())
                .bidSubmitDocPath(bidInfo.getBidSubmitDocPath())
                .winDate(bidInfo.getWinDate())
                .winDocPath(bidInfo.getWinDocPath())
                .build();
    }
}
