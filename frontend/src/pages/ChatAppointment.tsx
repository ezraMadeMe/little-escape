import { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import Slider from 'react-slick';
import { Mission } from '../types/mission';
import { Appointment, AppointmentStatus } from '../types/appointment';
import {
  createAppointment,
  updateAppointmentMission,
  getAppointmentDetail,
  completeAppointment,
  cloneAppointment,
  cancelAppointment
} from '../api/appointmentApi';
import { getRecommendedMissions } from '../api/missionApi';
import { formatDateTime, formatDate, formatTime, calculateDday } from '../utils/dateUtils';
import ChatActionArea from '../components/ChatActionArea';
import 'slick-carousel/slick/slick.css';
import 'slick-carousel/slick/slick-theme.css';

// 메시지 타입 정의
interface Message {
  id: string;
  sender: 'bot' | 'user';
  type: 'text' | 'time-picker' | 'mission-slider' | 'action-buttons' | 'action-area' | 'proof-form' | 'typing';
  content?: string;
  timestamp: Date;
}

const ChatAppointment = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const isInitialized = useRef(false);

  const [messages, setMessages] = useState<Message[]>([]);
  const [selectedDateTime, setSelectedDateTime] = useState<string>('');
  const [currentAppointment, setCurrentAppointment] = useState<Appointment | null>(null);
  const [recommendedMissions, setRecommendedMissions] = useState<Mission[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // 인증 폼 상태
  const [proofComment, setProofComment] = useState('');
  const [selectedKeywords, setSelectedKeywords] = useState<string[]>([]);
  const [proofImages, setProofImages] = useState<File[]>([]);

  const keywordOptions = ['🔥 뿌듯해요', '💪 성취감', '😊 행복해요', '👀 새로워요', '🎉 재미있어요', '😌 편안해요'];

  // 자동 스크롤
  const scrollToBottom = () => {
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // 초기 진입 처리
  useEffect(() => {
    // 메시지 초기화
    setMessages([]);

    if (id === 'new') {
      // 새 약속 생성
      initNewChat();
    } else if (id) {
      // 기존 약속 불러오기
      loadExistingAppointment(parseInt(id));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  // 새 채팅 초기화
  const initNewChat = () => {
    if (isInitialized.current) return;

    addBotMessage('안녕하세요! 일상 속 작은 휴식이 필요하시군요. 🌿\n언제 떠나보실래요?');
    setTimeout(() => {
      addMessage({
        id: Date.now().toString(),
        sender: 'bot',
        type: 'time-picker',
        timestamp: new Date(),
      });
    }, 500);

    isInitialized.current = true;
  };

  // 기존 약속 불러오기 및 컨텍스트 복원
  const loadExistingAppointment = async (appointmentId: number) => {
    try {
      setIsLoading(true);
      const appointment = await getAppointmentDetail(appointmentId);
      setCurrentAppointment(appointment);

      // 상태별 대화 히스토리 복원
      rehydrateConversation(appointment);
    } catch (error) {
      console.error('약속 조회 실패:', error);
      alert('약속을 불러올 수 없습니다.');
      navigate('/appointments');
    } finally {
      setIsLoading(false);
    }
  };

  // 상태별 대화 복원 (Rehydration)
  const rehydrateConversation = (appointment: Appointment) => {
    const msgs: Message[] = [];
    const baseId = `rehydrate-${appointment.id}-`;
    let msgCounter = 0;

    // Step 1: 초기 인사
    msgs.push({
      id: `${baseId}${msgCounter++}`,
      sender: 'bot',
      type: 'text',
      content: '안녕하세요! 일상 속 작은 휴식이 필요하시군요. 🌿',
      timestamp: new Date(),
    });

    // Step 2: 시간 선택됨
    msgs.push({
      id: `${baseId}${msgCounter++}`,
      sender: 'user',
      type: 'text',
      content: `📅 ${formatDateTime(appointment.scheduledAt)}로 할게요.`,
      timestamp: new Date(),
    });

    msgs.push({
      id: `${baseId}${msgCounter++}`,
      sender: 'bot',
      type: 'text',
      content: '좋아요! 그 시간으로 비워둘게요. 🕒',
      timestamp: new Date(),
    });

    // Step 3: 미션 선택
    if (appointment.missionTitle) {
      msgs.push({
        id: `${baseId}${msgCounter++}`,
        sender: 'bot',
        type: 'text',
        content: '그 시간에 딱 맞는 일탈을 찾아봤어요!',
        timestamp: new Date(),
      });

      msgs.push({
        id: `${baseId}${msgCounter++}`,
        sender: 'user',
        type: 'text',
        content: `[${appointment.missionTitle}]로 결정!`,
        timestamp: new Date(),
      });
    }

    // Step 4: 상태별 분기
    if (appointment.status === AppointmentStatus.CANCELLED) {
      msgs.push({
        id: `${baseId}${msgCounter++}`,
        sender: 'bot',
        type: 'text',
        content: '이 약속은 취소되었습니다. 😢\n다시 도전해보시겠어요?',
        timestamp: new Date(),
      });
      msgs.push({
        id: `${baseId}${msgCounter++}`,
        sender: 'bot',
        type: 'action-buttons',
        timestamp: new Date(),
      });
    } else if (appointment.status === AppointmentStatus.COMPLETED) {
      msgs.push({
        id: `${baseId}${msgCounter++}`,
        sender: 'bot',
        type: 'text',
        content: '완료하셨군요! 멋진 시간 보내셨나요? ✨',
        timestamp: new Date(),
      });
    } else if (appointment.status === AppointmentStatus.ACCEPTED) {
      const now = new Date();
      const scheduledTime = new Date(appointment.scheduledAt);
      const timeReached = now >= scheduledTime;

      if (appointment.missionTitle) {
        // 미션이 선택된 경우
        if (timeReached) {
          // 시나리오 2: 약속 시간 도래/지남
          msgs.push({
            id: `${baseId}${msgCounter++}`,
            sender: 'bot',
            type: 'text',
            content: '약속 시간이 되었어요! 🌿 작은 일탈 즐기셨나요?',
            timestamp: new Date(),
          });
        } else {
          // 시나리오 1: 미션 선택 완료 & 시간 남음 (D-Day)
          const dday = calculateDday(appointment.scheduledAt);
          msgs.push({
            id: `${baseId}${msgCounter++}`,
            sender: 'bot',
            type: 'text',
            content: `완벽해요! 약속이 확정되었어요. ✨\n${dday === 'D-Day' ? '⏰ 오늘이에요!' : `⏳ ${dday}`}`,
            timestamp: new Date(),
          });
        }

        // ChatActionArea 표시
        msgs.push({
          id: `${baseId}${msgCounter++}`,
          sender: 'bot',
          type: 'action-area',
          timestamp: new Date(),
        });
      } else {
        // 미션이 아직 선택되지 않은 경우 (PENDING과 동일 처리)
        const dday = calculateDday(appointment.scheduledAt);
        msgs.push({
          id: `${baseId}${msgCounter++}`,
          sender: 'bot',
          type: 'text',
          content: `시간 약속은 잡혔어요! ${formatDateTime(appointment.scheduledAt)}\n${dday === 'D-Day' ? '⏰ 오늘이에요!' : `⏳ ${dday}`}`,
          timestamp: new Date(),
        });
        msgs.push({
          id: `${baseId}${msgCounter++}`,
          sender: 'bot',
          type: 'action-buttons',
          timestamp: new Date(),
        });
      }
    } else if (appointment.status === AppointmentStatus.PENDING) {
      msgs.push({
        id: `${baseId}${msgCounter++}`,
        sender: 'bot',
        type: 'text',
        content: '그 시간에 딱 맞는 일탈을 찾아봤어요. 이건 어떠세요?',
        timestamp: new Date(),
      });
      msgs.push({
        id: `${baseId}${msgCounter++}`,
        sender: 'bot',
        type: 'mission-slider',
        timestamp: new Date(),
      });

      // 추천 미션 가져오기
      fetchRecommendedMissions(appointment.scheduledAt);
    }

    setMessages(msgs);
  };

  // 봇 메시지 추가 (타이핑 효과)
  const addBotMessage = (content: string, delay: number = 800) => {
    // 타이핑 인디케이터 추가
    addMessage({
      id: `typing-${Date.now()}`,
      sender: 'bot',
      type: 'typing',
      timestamp: new Date(),
    });

    setTimeout(() => {
      // 타이핑 인디케이터 제거 후 실제 메시지 추가
      setMessages(prev => prev.filter(m => m.type !== 'typing'));
      addMessage({
        id: Date.now().toString(),
        sender: 'bot',
        type: 'text',
        content,
        timestamp: new Date(),
      });
    }, delay);
  };

  // 메시지 추가
  const addMessage = (message: Message) => {
    setMessages(prev => [...prev, message]);
  };

  // 시간 선택 완료
  const handleTimeSelect = async () => {
    if (!selectedDateTime) {
      alert('날짜와 시간을 선택해주세요.');
      return;
    }

    setIsLoading(true);

    try {
      // 사용자 메시지 추가
      addMessage({
        id: Date.now().toString(),
        sender: 'user',
        type: 'text',
        content: `📅 ${formatDateTime(selectedDateTime)}로 할게요.`,
        timestamp: new Date(),
      });

      // time-picker 제거
      setMessages(prev => prev.filter(m => m.type !== 'time-picker'));

      // 약속 생성
      const appointment = await createAppointment({ scheduledAt: selectedDateTime });
      setCurrentAppointment(appointment);

      // 봇 응답
      addBotMessage('좋아요! 그 시간으로 비워둘게요. 🕒');

      // 추천 미션 가져오기
      setTimeout(() => {
        addBotMessage('그 시간에 딱 맞는 일탈을 찾아봤어요. 이건 어떠세요?', 500);
        setTimeout(() => {
          addMessage({
            id: Date.now().toString(),
            sender: 'bot',
            type: 'mission-slider',
            timestamp: new Date(),
          });
          fetchRecommendedMissions(selectedDateTime);
        }, 1300);
      }, 1300);

    } catch (error) {
      console.error('약속 생성 실패:', error);
      alert('약속 생성에 실패했습니다. 다시 시도해주세요.');
    } finally {
      setIsLoading(false);
    }
  };

  // 추천 미션 가져오기
  const fetchRecommendedMissions = async (scheduledAt: string) => {
    try {
      const missions = await getRecommendedMissions(scheduledAt);
      setRecommendedMissions(missions);
    } catch (error) {
      console.error('추천 미션 조회 실패:', error);
    }
  };

  // 미션 선택 완료
  const handleMissionSelect = async (mission: Mission) => {
    if (!currentAppointment) return;

    setIsLoading(true);

    try {
      await updateAppointmentMission(currentAppointment.id, mission.id);

      // mission-slider 제거
      setMessages(prev => prev.filter(m => m.type !== 'mission-slider'));

      // 사용자 메시지 추가
      addMessage({
        id: Date.now().toString(),
        sender: 'user',
        type: 'text',
        content: `[${mission.title}]로 결정!`,
        timestamp: new Date(),
      });

      // 업데이트된 약속 정보 가져오기
      const updatedAppointment = await getAppointmentDetail(currentAppointment.id);
      setCurrentAppointment(updatedAppointment);

      // 봇 최종 응답
      const dday = calculateDday(updatedAppointment.scheduledAt);
      addBotMessage(
        `완벽해요! ${formatDateTime(updatedAppointment.scheduledAt)}에 [${mission.title}], 잊지 마세요! ✨\n${dday === 'D-Day' ? '⏰ 오늘이에요!' : `⏳ ${dday}`}`
      );

      setTimeout(() => {
        addMessage({
          id: Date.now().toString(),
          sender: 'bot',
          type: 'action-area',
          timestamp: new Date(),
        });
      }, 1500);

    } catch (error) {
      console.error('미션 설정 실패:', error);
      alert('미션 설정에 실패했습니다. 다시 시도해주세요.');
    } finally {
      setIsLoading(false);
    }
  };

  // 인증 완료
  const handleProofSubmit = async () => {
    if (!currentAppointment) return;
    if (proofImages.length === 0) {
      alert('인증샷을 업로드해주세요.');
      return;
    }

    setIsLoading(true);

    try {
      await completeAppointment(
        currentAppointment.id,
        proofComment,
        selectedKeywords,
        proofImages
      );

      // proof-form 제거
      setMessages(prev => prev.filter(m => m.type !== 'proof-form'));

      addMessage({
        id: Date.now().toString(),
        sender: 'user',
        type: 'text',
        content: '✅ 미션 완료했어요!',
        timestamp: new Date(),
      });

      addBotMessage('멋져요! 오늘도 작은 일탈 성공하셨네요! 🎉');

      setTimeout(() => {
        navigate('/reviews');
      }, 2000);

    } catch (error) {
      console.error('인증 실패:', error);
      alert('인증에 실패했습니다. 다시 시도해주세요.');
    } finally {
      setIsLoading(false);
    }
  };

  // 약속 취소
  const handleCancel = async () => {
    if (!currentAppointment) return;
    if (!confirm('정말 이 약속을 취소하시겠습니까?')) return;

    try {
      await cancelAppointment(currentAppointment.id);
      navigate('/appointments');
    } catch (error) {
      console.error('약속 취소 실패:', error);
      alert('약속 취소에 실패했습니다.');
    }
  };

  // 약속 복제
  const handleClone = async () => {
    if (!currentAppointment) return;

    try {
      const newAppointmentId = await cloneAppointment(currentAppointment.id);
      navigate(`/chat/${newAppointmentId}`);
    } catch (error) {
      console.error('약속 복제 실패:', error);
      alert('약속 복제에 실패했습니다.');
    }
  };

  // 슬라이더 설정
  const sliderSettings = {
    dots: true,
    infinite: false,
    speed: 500,
    slidesToShow: 1,
    slidesToScroll: 1,
    arrows: false,
    centerMode: true,
    centerPadding: '20px',
  };

  // 메시지 렌더링
  const renderMessage = (message: Message) => {
    if (message.sender === 'bot') {
      return (
        <div key={message.id} className="flex items-start gap-2 mb-4 animate-fadeIn">
          {/* 봇 프로필 */}
          <div className="w-10 h-10 bg-purple-500 rounded-full flex items-center justify-center flex-shrink-0">
            <span className="text-white text-lg">🤖</span>
          </div>

          {/* 메시지 내용 */}
          <div className="flex-1 max-w-[80%]">
            {message.type === 'text' && (
              <div className="bg-white rounded-2xl rounded-tl-none px-4 py-3 shadow-sm">
                <p className="text-gray-800 whitespace-pre-line text-sm">{message.content}</p>
              </div>
            )}

            {message.type === 'typing' && (
              <div className="bg-white rounded-2xl rounded-tl-none px-4 py-3 shadow-sm w-16">
                <div className="flex gap-1">
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                </div>
              </div>
            )}

            {message.type === 'time-picker' && (
              <div className="bg-white rounded-2xl px-4 py-4 shadow-sm">
                <input
                  type="datetime-local"
                  value={selectedDateTime}
                  onChange={(e) => setSelectedDateTime(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                  min={new Date().toISOString().slice(0, 16)}
                />
                <button
                  onClick={handleTimeSelect}
                  disabled={!selectedDateTime || isLoading}
                  className="w-full mt-3 py-2 bg-purple-600 text-white font-semibold rounded-lg hover:bg-purple-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading ? '처리 중...' : '이 시간으로 할게요'}
                </button>
              </div>
            )}

            {message.type === 'mission-slider' && recommendedMissions.length > 0 && (
              <div className="w-full">
                <Slider {...sliderSettings}>
                  {recommendedMissions.map((mission) => (
                    <div key={mission.id} className="px-2">
                      <div className="bg-white rounded-2xl overflow-hidden shadow-lg">
                        {mission.imageUrl && (
                          <div className="w-full h-40 bg-gray-200">
                            <img
                              src={mission.imageUrl}
                              alt={mission.title}
                              className="w-full h-full object-cover"
                            />
                          </div>
                        )}
                        <div className="p-4">
                          <h3 className="text-base font-bold text-gray-900 mb-2">
                            {mission.title}
                          </h3>
                          <p className="text-xs text-gray-600 mb-3 line-clamp-2">
                            {mission.description}
                          </p>
                          <div className="flex gap-2 mb-3">
                            <span className="px-2 py-1 bg-purple-100 text-purple-700 text-xs rounded-full">
                              {mission.category}
                            </span>
                          </div>
                          <button
                            onClick={() => handleMissionSelect(mission)}
                            disabled={isLoading}
                            className="w-full py-2 bg-purple-600 text-white font-semibold rounded-lg hover:bg-purple-700 transition disabled:opacity-50"
                          >
                            {isLoading ? '처리 중...' : '이걸로 할래요'}
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </Slider>
              </div>
            )}

            {message.type === 'action-area' && (
              <div className="w-full">
                <ChatActionArea
                  appointment={currentAppointment}
                  onProofFormShow={() => {
                    // proof-form 추가
                    setMessages(prev => prev.filter(m => m.type !== 'action-area'));
                    addMessage({
                      id: Date.now().toString(),
                      sender: 'bot',
                      type: 'proof-form',
                      timestamp: new Date(),
                    });
                  }}
                />
              </div>
            )}

            {message.type === 'action-buttons' && (
              <div className="bg-white rounded-2xl px-4 py-4 shadow-sm space-y-2">
                {currentAppointment?.status === AppointmentStatus.CANCELLED ? (
                  <button
                    onClick={handleClone}
                    className="w-full py-2 bg-purple-600 text-white font-semibold rounded-lg hover:bg-purple-700 transition"
                  >
                    🔄 이 약속 다시 잡기
                  </button>
                ) : (
                  <>
                    <button
                      onClick={() => navigate(`/mission/${currentAppointment?.id}`)}
                      className="w-full py-2 bg-gray-100 text-gray-700 font-semibold rounded-lg hover:bg-gray-200 transition"
                    >
                      📋 약속 상세보기
                    </button>
                    <button
                      onClick={handleCancel}
                      className="w-full py-2 text-xs text-red-500 hover:text-red-700"
                    >
                      약속 취소하기
                    </button>
                  </>
                )}
              </div>
            )}

            {message.type === 'proof-form' && (
              <div className="bg-white rounded-2xl px-4 py-4 shadow-sm space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    인증샷 업로드 📸
                  </label>
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={(e) => setProofImages(Array.from(e.target.files || []))}
                    className="w-full text-sm"
                  />
                  {proofImages.length > 0 && (
                    <p className="text-xs text-gray-500 mt-1">{proofImages.length}장 선택됨</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    감성 키워드
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {keywordOptions.map((keyword) => (
                      <button
                        key={keyword}
                        onClick={() => {
                          setSelectedKeywords(prev =>
                            prev.includes(keyword)
                              ? prev.filter(k => k !== keyword)
                              : [...prev, keyword]
                          );
                        }}
                        className={`px-3 py-1 text-xs rounded-full transition ${
                          selectedKeywords.includes(keyword)
                            ? 'bg-purple-600 text-white'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                      >
                        {keyword}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    한줄평 (선택)
                  </label>
                  <textarea
                    value={proofComment}
                    onChange={(e) => setProofComment(e.target.value)}
                    placeholder="오늘의 경험을 한 줄로 남겨보세요..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm"
                    rows={2}
                  />
                </div>

                <button
                  onClick={handleProofSubmit}
                  disabled={proofImages.length === 0 || isLoading}
                  className="w-full py-2 bg-purple-600 text-white font-semibold rounded-lg hover:bg-purple-700 transition disabled:opacity-50"
                >
                  {isLoading ? '업로드 중...' : '✨ 미션 완료!'}
                </button>
              </div>
            )}
          </div>
        </div>
      );
    } else {
      // 사용자 메시지
      return (
        <div key={message.id} className="flex justify-end mb-4 animate-fadeIn">
          <div className="bg-yellow-300 rounded-2xl rounded-tr-none px-4 py-3 shadow-sm max-w-[70%]">
            <p className="text-gray-900 text-sm">{message.content}</p>
          </div>
        </div>
      );
    }
  };

  return (
    <div className="h-screen flex flex-col bg-gradient-to-b from-blue-50 to-gray-100">
      {/* 헤더 */}
      <div className="bg-white border-b border-gray-200 px-4 py-3 flex items-center gap-3">
        <button onClick={() => navigate('/appointments')} className="text-gray-600">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-purple-500 rounded-full flex items-center justify-center">
            <span className="text-white">🤖</span>
          </div>
          <span className="font-semibold text-gray-900">작은 일탈 봇</span>
        </div>
      </div>

      {/* 메시지 영역 */}
      <div className="flex-1 overflow-y-auto px-4 py-6">
        {isLoading && messages.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
          </div>
        ) : (
          <>
            {messages.map(renderMessage)}
            <div ref={messagesEndRef} />
          </>
        )}
      </div>

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fadeIn {
          animation: fadeIn 0.3s ease-out;
        }
      `}</style>
    </div>
  );
};

export default ChatAppointment;
