import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Slider from 'react-slick';
import { Appointment, AppointmentStatus } from '../types/appointment';
import { cloneAppointment } from '../api/appointmentApi';
import 'slick-carousel/slick/slick.css';
import 'slick-carousel/slick/slick-theme.css';

interface MissionCardProps {
  appointment: Appointment;
  count?: number;
}

const MissionCard = ({ appointment, count = 1 }: MissionCardProps) => {
  const navigate = useNavigate();
  const [isCloning, setIsCloning] = useState(false);

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

  const sliderSettings = {
    dots: true,
    infinite: false,
    speed: 500,
    slidesToShow: 1,
    slidesToScroll: 1,
    arrows: false,
  };

  // 날짜 포맷팅 함수
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}/${month}/${day}`;
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${hours}:${minutes}`;
  };

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${year}년 ${month}월 ${day}일 ${hours}:${minutes}`;
  };

  // D-Day 계산
  const calculateDday = (scheduledAt: string) => {
    const scheduled = new Date(scheduledAt);
    const today = new Date();
    scheduled.setHours(0, 0, 0, 0);
    today.setHours(0, 0, 0, 0);
    const diffTime = scheduled.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return 'D-Day';
    if (diffDays > 0) return `D-${diffDays}`;
    return `D+${Math.abs(diffDays)}`;
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
    // 취소된 약속은 이미지 영역을 렌더링하지 않음
    if (appointment.status === AppointmentStatus.CANCELLED) {
      return null;
    }

    if (appointment.status === AppointmentStatus.COMPLETED) {
      // 완료: 인증샷 슬라이더
      const images = appointment.proofImageUrl ? [appointment.proofImageUrl] : [];

      if (images.length === 0) {
        return (
          <div className="aspect-square bg-gradient-to-br from-purple-100 to-pink-100 flex items-center justify-center">
            <span className="text-6xl">✅</span>
          </div>
        );
      }

      return (
        <div className="aspect-square bg-gray-100">
          {images.length === 1 ? (
            <img
              src={images[0]}
              alt="인증 사진"
              className="w-full h-full object-cover"
            />
          ) : (
            <Slider {...sliderSettings}>
              {images.map((image, index) => (
                <div key={index} className="aspect-square">
                  <img
                    src={image}
                    alt={`인증 사진 ${index + 1}`}
                    className="w-full h-full object-cover"
                  />
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
        <div className="aspect-square bg-gray-100 relative">
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
      <div className="aspect-square bg-gradient-to-br from-purple-400 via-pink-400 to-orange-400 flex items-center justify-center">
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
          className="w-full py-3 bg-purple-600 text-white rounded-lg font-semibold hover:bg-purple-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isCloning ? '처리 중...' : '이 약속 다시 지키러 가기'}
        </button>
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
    return (
      <div>
        {/* 장소명 */}
        {appointment.placeName && (
          <div className="font-bold text-gray-900 text-base mb-1">
            📍 {appointment.placeName}
          </div>
        )}

        {/* 날짜/시간 */}
        <div className="text-sm text-gray-600">
          {formatDateTime(appointment.scheduledAt)}
        </div>

        {/* 장소 주소 */}
        {appointment.placeAddress && (
          <div className="text-xs text-gray-500 mt-1">
            {appointment.placeAddress}
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
            <span className="text-lg">🎯</span>
          </div>
          <span className="font-bold text-gray-900">
            {appointment.missionTitle || '미션 미선택'}
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
