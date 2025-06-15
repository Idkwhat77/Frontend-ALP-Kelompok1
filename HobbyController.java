package com.ruangkerja.rest.controller;

import com.ruangkerja.rest.dto.HobbyRequest;
import com.ruangkerja.rest.entity.Hobby;
import com.ruangkerja.rest.entity.Candidate;
import com.ruangkerja.rest.repository.HobbyRepository;
import com.ruangkerja.rest.repository.CandidateRepository;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/candidates/{candidateId}/hobbies")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
@Tag(name = "Hobby API", description = "API endpoints for hobby management")
public class HobbyController {

    private static final Logger logger = LoggerFactory.getLogger(HobbyController.class);
    private static final String SUCCESS_KEY = "success";
    private static final String MESSAGE_KEY = "message";
    private static final String HOBBY_KEY = "hobby";
    private static final String HOBBIES_KEY = "hobbies";

    private final HobbyRepository hobbyRepository;
    private final CandidateRepository candidateRepository;
    
    @PostMapping
    @Operation(summary = "Add hobby to candidate", description = "Add a new hobby to a candidate or associate existing hobby")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "201", description = "Hobby added successfully"),
            @ApiResponse(responseCode = "400", description = "Invalid input data or candidate not found"),
            @ApiResponse(responseCode = "409", description = "Hobby already exists for this candidate"),
            @ApiResponse(responseCode = "500", description = "Internal server error")
    })
    public ResponseEntity<Map<String, Object>> addHobbyToCandidate(
            @PathVariable Long candidateId,
            @Valid @RequestBody HobbyRequest request) {
        try {
            // Find candidate by ID
            Optional<Candidate> candidateOptional = candidateRepository.findById(candidateId);
            if (candidateOptional.isEmpty()) {
                return ResponseEntity.badRequest().body(createErrorResponse("Candidate not found"));
            }

            Candidate candidate = candidateOptional.get();

            // Check if hobby already exists
            Optional<Hobby> existingHobby = hobbyRepository.findByName(request.getName().trim());
            
            Hobby hobby;
            if (existingHobby.isPresent()) {
                hobby = existingHobby.get();
                
                // Check if candidate already has this hobby
                if (candidate.getHobby().contains(hobby)) {
                    return ResponseEntity.status(409).body(createErrorResponse("Candidate already has this hobby"));
                }
            } else {
                // Create new hobby
                hobby = new Hobby();
                hobby.setName(request.getName().trim());
                hobby = hobbyRepository.save(hobby);
            }

            // Add hobby to candidate
            candidate.getHobby().add(hobby);
            candidateRepository.save(candidate);

            Map<String, Object> response = new HashMap<>();
            response.put(SUCCESS_KEY, true);
            response.put(MESSAGE_KEY, "Hobby added to candidate successfully");
            response.put(HOBBY_KEY, createHobbyResponse(hobby));
            
            return ResponseEntity.status(201).body(response);
            
        } catch (Exception e) {
            logger.error("Failed to add hobby to candidate {}: {}", candidateId, e.getMessage(), e);
            return ResponseEntity.internalServerError().body(createErrorResponse("Failed to add hobby"));
        }
    }
    
    @GetMapping
    @Operation(summary = "Get candidate hobbies", description = "Retrieve all hobbies for a specific candidate")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Hobbies retrieved successfully"),
            @ApiResponse(responseCode = "404", description = "Candidate not found")
    })
    public ResponseEntity<Map<String, Object>> getCandidateHobbies(@PathVariable Long candidateId) {
        try {
            // Verify candidate exists
            Optional<Candidate> candidateOptional = candidateRepository.findById(candidateId);
            if (candidateOptional.isEmpty()) {
                return ResponseEntity.badRequest().body(createErrorResponse("Candidate not found"));
            }

            Candidate candidate = candidateOptional.get();
            
            Map<String, Object> response = new HashMap<>();
            response.put(SUCCESS_KEY, true);
            response.put(HOBBIES_KEY, candidate.getHobby().stream()
                    .map(this::createHobbyResponse)
                    .toList());
            
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            logger.error("Failed to retrieve hobbies for candidate {}: {}", candidateId, e.getMessage(), e);
            return ResponseEntity.internalServerError().body(createErrorResponse("Failed to retrieve hobbies"));
        }
    }

    @DeleteMapping("/{hobbyId}")
    @Operation(summary = "Remove hobby from candidate", description = "Remove a hobby from a candidate (does not delete the hobby itself)")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Hobby removed from candidate successfully"),
            @ApiResponse(responseCode = "404", description = "Candidate or hobby not found"),
            @ApiResponse(responseCode = "400", description = "Candidate does not have this hobby")
    })
    public ResponseEntity<Map<String, Object>> removeHobbyFromCandidate(
            @PathVariable Long candidateId,
            @PathVariable Long hobbyId) {
        try {
            // Find candidate
            Optional<Candidate> candidateOptional = candidateRepository.findById(candidateId);
            if (candidateOptional.isEmpty()) {
                return ResponseEntity.badRequest().body(createErrorResponse("Candidate not found"));
            }

            // Find hobby
            Optional<Hobby> hobbyOptional = hobbyRepository.findById(hobbyId);
            if (hobbyOptional.isEmpty()) {
                return ResponseEntity.badRequest().body(createErrorResponse("Hobby not found"));
            }

            Candidate candidate = candidateOptional.get();
            Hobby hobby = hobbyOptional.get();

            // Check if candidate has this hobby
            if (!candidate.getHobby().contains(hobby)) {
                return ResponseEntity.badRequest().body(createErrorResponse("Candidate does not have this hobby"));
            }

            // Remove hobby from candidate
            candidate.getHobby().remove(hobby);
            candidateRepository.save(candidate);

            Map<String, Object> response = new HashMap<>();
            response.put(SUCCESS_KEY, true);
            response.put(MESSAGE_KEY, "Hobby removed from candidate successfully");
            
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            logger.error("Failed to remove hobby {} from candidate {}: {}", hobbyId, candidateId, e.getMessage(), e);
            return ResponseEntity.internalServerError().body(createErrorResponse("Failed to remove hobby"));
        }
    }

    @GetMapping("/all")
    @Operation(summary = "Get all available hobbies", description = "Retrieve all hobbies in the system")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "All hobbies retrieved successfully")
    })
    public ResponseEntity<Map<String, Object>> getAllHobbies() {
        try {
            List<Hobby> allHobbies = hobbyRepository.findAll();
            
            Map<String, Object> response = new HashMap<>();
            response.put(SUCCESS_KEY, true);
            response.put(HOBBIES_KEY, allHobbies.stream()
                    .map(this::createHobbyResponse)
                    .toList());
            
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            logger.error("Failed to retrieve all hobbies: {}", e.getMessage(), e);
            return ResponseEntity.internalServerError().body(createErrorResponse("Failed to retrieve hobbies"));
        }
    }

    // Helper methods
    private Map<String, Object> createErrorResponse(String message) {
        Map<String, Object> response = new HashMap<>();
        response.put(SUCCESS_KEY, false);
        response.put(MESSAGE_KEY, message);
        return response;
    }

    private Map<String, Object> createHobbyResponse(Hobby hobby) {
        Map<String, Object> hobbyResponse = new HashMap<>();
        hobbyResponse.put("id", hobby.getId());
        hobbyResponse.put("name", hobby.getName());
        return hobbyResponse;
    }
}