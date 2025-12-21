package com.littleescape.user.service;

import com.littleescape.common.error.BizException;
import com.littleescape.user.domain.User;
import com.littleescape.user.domain.UserPreference;
import com.littleescape.user.dto.UserDtos;
import com.littleescape.user.repo.UserPreferenceRepository;
import com.littleescape.user.repo.UserRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class UserService {

    private final UserRepository userRepository;
    private final UserPreferenceRepository userPreferenceRepository;

    public UserService(UserRepository userRepository, UserPreferenceRepository userPreferenceRepository) {
        this.userRepository = userRepository;
        this.userPreferenceRepository = userPreferenceRepository;
    }

    @Transactional(readOnly = true)
    public UserDtos.MeResponse me(Long userId) {
        User u = userRepository.findById(userId).orElseThrow(() -> BizException.notFound("User not found"));
        return new UserDtos.MeResponse(u.getId(), u.getNickname());
    }

    @Transactional
    public void updatePreferences(Long userId, UserDtos.UpdatePreferenceRequest req) {
        User u = userRepository.findById(userId).orElseThrow(() -> BizException.notFound("User not found"));
        UserPreference pref = userPreferenceRepository.findById(userId).orElseGet(() -> userPreferenceRepository.save(new UserPreference(u)));

        String preferred = (req.preferredTags() == null) ? "[]" : req.preferredTags().toString(); // TODO: JSON serialize
        String avoid = (req.avoidTags() == null) ? "[]" : req.avoidTags().toString();             // TODO: JSON serialize
        pref.update(preferred, avoid, req.defaultMode(), req.explorationRate());
    }
}