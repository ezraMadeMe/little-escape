import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Slider from 'react-slick';
import { Appointment, AppointmentStatus } from '../types/appointment';
import { cloneAppointment, cancelAppointment } from '../api/appointmentApi';
import { formatDate, formatTime, formatDateTime, calculateDday } from '../utils/dateUtils';
import 'slick-carousel/slick/slick.css';
import 'slick-carousel/slick/slick-theme.css';

interface MissionCardProps {
  appointment: Appointment;
  count?: number;
}

// URL 처리 헬퍼 함수
const getFullImageUrl = (url: string) => {
  if (!url) return '';
  if (url.startsWith('http')) return url;
  // 상대 경로인 경우 API Base URL을 붙임
  const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080';
  return `${BASE_URL}${url}`;
};

const MissionCard = ({ appointment, count = 1 }: MissionCardProps) => {
  const navigate = useNavigate();
  const [isCloning, setIsCloning] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);

  const handleClone = async () => {
    try {
      setIsCloning(true);
      const newAppointmentId = await cloneAppointment(appointment.id);
      navigate(`/time-selection/${newAppointmentId}`);
    } catch (error) {
      console.error('약속 복제 실패:', error);
      if (error instanceof Error && error.message.includes('이미 진행 중인 약속')) {
        alert('이미 진행 중인 약속이 있습니다. 기존 약속을 완료하거나 취소해주세요.');
      } else {
        alert('약속 복제에 실패했습니다. 다시 시도해주세요.');
      }
    } finally {
      setIsCloning(false);
    }
  };

  const handleCancel = async () => {
    if (!confirm('정말 이 약속을 취소하시겠습니까?')) {
      return;
    }

    try {
      setIsCancelling(true);
      await cancelAppointment(appointment.id);
      alert('약속이 취소되었습니다.');
      window.location.reload();
    } catch (error) {
      console.error('약속 취소 실패:', error);
      alert('약속 취소에 실패했습니다. 다시 시도해주세요.');
    } finally {
      setIsCancelling(false);
    }
  };

  const handleViewDetail = () => {
    navigate(`/mission/${appointment.id}`);
  };

  const handleProofSubmit = () => {
    navigate(`/mission-proof/${appointment.id}`);
  };

  // 약속 시간이 도래했는지 확인
  const isAppointmentTimeReached = () => {
    const now = new Date();
    const scheduledTime = new Date(appointment.scheduledAt);
    return now >= scheduledTime;
  };

  const sliderSettings = {
    dots: true,
    infinite: false,
    speed: 500,
    slidesToShow: 1,
    slidesToScroll: 1,
    arrows: false,
  };

  // 헤더 우측 렌더링
  const renderHeaderRight = () => {
    if (appointment.status === AppointmentStatus.CANCELLED) {
      return (
        <span className="text-xs text-gray-500">
          {formatDate(appointment.scheduledAt)}
        </span>
      );
    }

    if (appointment.status === AppointmentStatus.COMPLETED) {
      if (count === 1) {
        return (
          <span className="px-3 py-1 bg-green-100 text-green-700 text-xs font-semibold rounded-full">
            ✅ 완료
          </span>
        );
      }
      return (
        <span className="px-3 py-1 bg-purple-100 text-purple-700 text-xs font-semibold rounded-full">
          🚀 {count}번째 만남
        </span>
      );
    }

    // ACCEPTED or PENDING
    const dday = calculateDday(appointment.scheduledAt);
    return (
      <span className="px-3 py-1 bg-blue-100 text-blue-700 text-xs font-semibold rounded-full">
        {dday === 'D-Day' ? '⏰ D-Day' : `⏳ ${dday}`}
      </span>
    );
  };

  // 바디(이미지) 영역 렌더링
  const renderCardBody = () => {
    // 취소된 약속 또는 미션이 정해지지 않은 약속은 이미지 영역을 렌더링하지 않음
    if (appointment.status === AppointmentStatus.CANCELLED || !appointment.missionTitle) {
      return null;
    }

    if (appointment.status === AppointmentStatus.COMPLETED) {
      // 완료: 인증샷 슬라이더
      // 우선순위: proofImageUrls (다중) > proofImageUrl (단일, 하위 호환)
      let images: string[] = [];

      if (appointment.proofImageUrls && appointment.proofImageUrls.length > 0) {
        images = appointment.proofImageUrls;
      } else if (appointment.proofImageUrl) {
        images = [appointment.proofImageUrl];
      }

      if (images.length === 0) {
        return (
          <div className="w-full aspect-square bg-gradient-to-br from-purple-100 to-pink-100 flex items-center justify-center">
            <span className="text-6xl">✅</span>
          </div>
        );
      }

      return (
        <div className="w-full aspect-square bg-gray-100 overflow-hidden relative">
          {images.length === 1 ? (
            <img
              src={getFullImageUrl(images[0])}
              alt="인증 사진"
              className="w-full h-full object-cover block"
            />
          ) : (
            <Slider {...sliderSettings} className="h-full">
              {images.map((image, index) => (
                <div key={index} className="w-full h-full">
                  <div className="aspect-square">
                    <img
                      src={getFullImageUrl(image)}
                      alt={`인증샷-${index + 1}`}
                      className="w-full h-full object-cover block"
                    />
                  </div>
                </div>
              ))}
            </Slider>
          )}
        </div>
      );
    }

    // ACCEPTED or PENDING: 미션/장소 이미지 또는 시간 텍스트
    const displayImage = appointment.missionImageUrl || appointment.placeImageUrl;

    if (displayImage) {
      return (
        <div className="w-full aspect-square bg-gray-100 relative">
          <img
            src={displayImage}
            alt="미션 이미지"
            className="w-full h-full object-cover"
          />
          {/* 오버레이 with 시간 표시 */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent flex items-end justify-center pb-8">
            <div className="text-center text-white">
              <div className="text-5xl font-bold drop-shadow-lg">
                {formatTime(appointment.scheduledAt)}
              </div>
            </div>
          </div>
        </div>
      );
    }

    // 이미지가 없는 경우: 그라디언트 배경에 시간 표시
    return (
      <div className="w-full aspect-square bg-gradient-to-br from-purple-400 via-pink-400 to-orange-400 flex items-center justify-center">
        <div className="text-center text-white">
          <div className="text-6xl font-bold drop-shadow-2xl mb-2">
            {formatTime(appointment.scheduledAt)}
          </div>
          <div className="text-lg font-medium opacity-90">
            {formatDate(appointment.scheduledAt)}
          </div>
        </div>
      </div>
    );
  };

  // 푸터 영역 렌더링
  const renderCardFooter = () => {
    if (appointment.status === AppointmentStatus.CANCELLED) {
      return (
        <button
          onClick={handleClone}
          disabled={isCloning}
          className="w-full py-3 bg-purple-600 text-white font-semibold hover:bg-purple-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isCloning ? '처리 중...' : '🔄 이 약속 다시 지키러 가기'}
        </button>
      );
    }

    // 미션이 정해지지 않은 약속 (PENDING/ACCEPTED)
    if (!appointment.missionTitle &&
        (appointment.status === AppointmentStatus.PENDING || appointment.status === AppointmentStatus.ACCEPTED)) {
      return (
        <div>
          <div className="text-sm text-gray-600 mb-3">
            {formatDateTime(appointment.scheduledAt)}
          </div>
          <button
            onClick={() => navigate(`/pick-mission/${appointment.id}`)}
            className="w-full py-3 bg-purple-600 text-white font-semibold hover:bg-purple-700 transition"
          >
            미션 선택하러 가기
          </button>
        </div>
      );
    }

    if (appointment.status === AppointmentStatus.COMPLETED) {
      return (
        <>
          {/* 좋아요/댓글 아이콘 (더미) */}
          <div className="flex gap-4 mb-3">
            <button className="text-gray-600 hover:text-red-500 transition">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
              </svg>
            </button>
            <button className="text-gray-600 hover:text-blue-500 transition">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
            </button>
          </div>

          {/* 감성 키워드 */}
          {appointment.reviewKeywords && appointment.reviewKeywords.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-3">
              {appointment.reviewKeywords.map((keyword, index) => (
                <span
                  key={index}
                  className="px-3 py-1 bg-purple-100 text-purple-700 text-xs font-semibold rounded-full"
                >
                  {keyword}
                </span>
              ))}
            </div>
          )}

          {/* 한줄평 */}
          {appointment.proofComment && (
            <div className="text-sm mb-2">
              <span className="font-semibold text-gray-900">나</span>
              <span className="text-gray-700 ml-2">{appointment.proofComment}</span>
            </div>
          )}

          {/* 장소 정보 */}
          {appointment.placeName && (
            <div className="text-xs text-gray-500">
              📍 {appointment.placeName}
            </div>
          )}
        </>
      );
    }

    // ACCEPTED or PENDING
    const timeReached = isAppointmentTimeReached();

    return (
      <div>
        {/* 장소명 */}
        {appointment.placeName && (
          <div className="font-bold text-gray-900 text-base mb-1">
            📍 {appointment.placeName}
          </div>
        )}

        {/* 날짜/시간 */}
        <div className="text-sm text-gray-600 mb-3">
          {formatDateTime(appointment.scheduledAt)}
        </div>

        {/* 장소 주소 */}
        {appointment.placeAddress && (
          <div className="text-xs text-gray-500 mb-3">
            {appointment.placeAddress}
          </div>
        )}

        {/* 액션 버튼들 */}
        {timeReached ? (
          // Case B: 약속 시간 도래/지남 - 버튼 3개
          <div>
            <div className="flex gap-2 mb-3">
              <button
                onClick={handleViewDetail}
                className="flex-1 py-2.5 bg-white border border-gray-300 text-gray-700 font-semibold hover:bg-gray-50 transition"
              >
                상세보기
              </button>
              <button
                onClick={handleProofSubmit}
                className="flex-1 py-2.5 bg-blue-600 text-white font-semibold hover:bg-blue-700 transition"
              >
                ✨ 미션 인증하기
              </button>
            </div>
            <button
              onClick={handleCancel}
              disabled={isCancelling}
              className="w-full text-xs text-gray-400 hover:text-red-500 underline transition disabled:opacity-50"
            >
              {isCancelling ? '취소 중...' : '약속 취소'}
            </button>
          </div>
        ) : (
          // Case A: 약속 시간 전 - 버튼 2개
          <div>
            <div className="flex gap-2 mb-3">
              <button
                onClick={handleViewDetail}
                className="flex-1 py-2.5 bg-white border border-gray-300 text-gray-700 font-semibold hover:bg-gray-50 transition"
              >
                상세보기
              </button>
              <button
                onClick={handleCancel}
                disabled={isCancelling}
                className="flex-1 py-2.5 bg-gray-100 text-gray-600 font-semibold hover:bg-gray-200 transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isCancelling ? '취소 중...' : '약속 취소'}
              </button>
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="bg-white border-b border-gray-100 overflow-hidden last:border-b-0">
      {/* 헤더 */}
      <div className="flex items-center justify-between px-4 py-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
            <span className="text-lg">
              {appointment.missionTitle ? '🎯' : '❓'}
            </span>
          </div>
          <span className="font-bold text-gray-900">
            {appointment.missionTitle || (appointment.status === AppointmentStatus.CANCELLED ? '미션 선택 전 취소' : '미션 미선택')}
          </span>
        </div>

        {/* 뱃지/날짜 영역 */}
        <div className="flex gap-2">
          {renderHeaderRight()}
        </div>
      </div>

      {/* 바디 - 이미지/콘텐츠 */}
      {renderCardBody()}

      {/* 푸터 */}
      <div className="px-4 py-3">
        {renderCardFooter()}
      </div>
    </div>
  );
};

export default MissionCard;
