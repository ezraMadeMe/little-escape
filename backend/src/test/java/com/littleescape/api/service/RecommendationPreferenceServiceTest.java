package com.littleescape.api.service;

import com.littleescape.api.domain.type.AppointmentStatus;
import com.littleescape.api.domain.type.DataSource;
import com.littleescape.api.domain.type.MissionCategory;
import com.littleescape.api.repository.AppointmentRepository;
import com.littleescape.api.repository.LikedAppointmentRepository;
import com.littleescape.api.repository.SavedAppointmentRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class RecommendationPreferenceServiceTest {

    @Mock
    private SavedAppointmentRepository savedAppointmentRepository;

    @Mock
    private LikedAppointmentRepository likedAppointmentRepository;

    @Mock
    private AppointmentRepository appointmentRepository;

    @Test
    void buildProfile_combinesPositiveAndNegativeSignals() {
        RecommendationPreferenceService service = new RecommendationPreferenceService(
                savedAppointmentRepository,
                likedAppointmentRepository,
                appointmentRepository
        );

        when(savedAppointmentRepository.findCategoryStatsByUserId(1L))
                .thenReturn(List.<Object[]>of(
                        new Object[]{MissionCategory.RELAX, 3L},
                        new Object[]{MissionCategory.CULTURE, 1L}
                ));
        when(likedAppointmentRepository.findCategoryStatsByUserId(1L))
                .thenReturn(List.<Object[]>of(
                        new Object[]{MissionCategory.CULTURE, 2L}
                ));
        when(appointmentRepository.findCategoryStatsByUserIdAndStatuses(eq(1L), eq(List.of(AppointmentStatus.COMPLETED))))
                .thenReturn(List.<Object[]>of(
                        new Object[]{MissionCategory.RELAX, 2L}
                ));
        when(appointmentRepository.findCategoryStatsByUserIdAndStatuses(eq(1L), eq(List.of(AppointmentStatus.CANCELLED))))
                .thenReturn(List.<Object[]>of(
                        new Object[]{MissionCategory.FOOD, 2L}
                ));

        when(savedAppointmentRepository.findPlaceDataSourceStatsByUserId(1L))
                .thenReturn(List.<Object[]>of(
                        new Object[]{DataSource.LIBRARY, 2L}
                ));
        when(likedAppointmentRepository.findPlaceDataSourceStatsByUserId(1L))
                .thenReturn(List.<Object[]>of(
                        new Object[]{DataSource.SEOUL_CULTURE, 1L}
                ));
        when(appointmentRepository.findPlaceDataSourceStatsByUserIdAndStatuses(eq(1L), eq(List.of(AppointmentStatus.COMPLETED))))
                .thenReturn(List.<Object[]>of(
                        new Object[]{DataSource.LIBRARY, 1L}
                ));
        when(appointmentRepository.findPlaceDataSourceStatsByUserIdAndStatuses(eq(1L), eq(List.of(AppointmentStatus.CANCELLED))))
                .thenReturn(List.<Object[]>of(
                        new Object[]{DataSource.SEOUL_PARK, 2L}
                ));

        RecommendationPreferenceService.UserPreferenceProfile profile = service.buildProfile(1L);

        assertThat(profile.categoryWeight(MissionCategory.RELAX))
                .isGreaterThan(profile.categoryWeight(MissionCategory.CULTURE))
                .isGreaterThan(profile.categoryWeight(MissionCategory.FOOD));
        assertThat(profile.categoryWeight(MissionCategory.FOOD)).isLessThan(1.0);
        assertThat(profile.dataSourceWeight(DataSource.LIBRARY))
                .isGreaterThan(profile.dataSourceWeight(DataSource.SEOUL_PARK));
        assertThat(profile.signals()).isNotEmpty();
    }
}
