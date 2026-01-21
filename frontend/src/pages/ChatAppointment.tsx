import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { saveChatOnboardingData } from '../api/userApi';

// 메시지 타입
interface ChatMessage {
  id: string;
  sender: 'manager' | 'user';
  content: string;
  timestamp: Date;
}

// 온보딩 단계
type OnboardingStep = 'welcome' | 'nickname' | 'mbti' | 'solo-level' | 'complete';

// 고유 ID 생성 함수
const generateUniqueId = () => {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
};

const ChatAppointment = () => {
  const navigate = useNavigate();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const hasInitialized = useRef(false); // 초기화 방지용

  // 상태 관리
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [currentStep, setCurrentStep] = useState<OnboardingStep>('welcome');
  const [isTyping, setIsTyping] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const [showInput, setShowInput] = useState(false);
  const [showChoices, setShowChoices] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analyzingText, setAnalyzingText] = useState('');

  // 사용자 데이터
  const [userData, setUserData] = useState({
    nickname: '',
    mbti: '',
    soloLevel: 5,
  });

  // 자동 스크롤
  const scrollToBottom = () => {
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  // 매니저 메시지 추가 (타이핑 효과)
  const addManagerMessage = (content: string, delay: number = 1000) => {
    return new Promise<void>((resolve) => {
      setTimeout(() => {
        setIsTyping(true);
        setTimeout(() => {
          setIsTyping(false);
          const newMessage: ChatMessage = {
            id: generateUniqueId(),
            sender: 'manager',
            content,
            timestamp: new Date(),
          };
          setMessages((prev) => [...prev, newMessage]);
          resolve();
        }, Math.min(content.length * 50, 2000)); // 타이핑 시간 (최대 2초)
      }, delay);
    });
  };

  // 사용자 메시지 추가
  const addUserMessage = (content: string) => {
    const newMessage: ChatMessage = {
      id: generateUniqueId(),
      sender: 'user',
      content,
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, newMessage]);
  };

  // 초기화 - 웰컴 메시지 (중복 실행 방지)
  useEffect(() => {
    if (hasInitialized.current) return;
    hasInitialized.current = true;

    const initChat = async () => {
      await addManagerMessage('왔냐? 주말에 집에만 있기 지겹지도 않냐?', 500);
      await addManagerMessage('나는 너의 매니저야. 이번 주말에 뭐 할지 내가 정해줄게.', 500);
      setCurrentStep('nickname');
      await addManagerMessage('먼저, 너 닉네임 뭘로 할래?', 500);
      setShowInput(true);
      setTimeout(() => inputRef.current?.focus(), 100);
    };

    initChat();
  }, []);

  // 닉네임 입력 처리
  const handleNicknameSubmit = async () => {
    if (!inputValue.trim()) return;

    const nickname = inputValue.trim();
    setUserData((prev) => ({ ...prev, nickname }));
    addUserMessage(nickname);
    setInputValue('');
    setShowInput(false);

    await addManagerMessage(`${nickname}? 괜찮네.`, 800);
    setCurrentStep('mbti');
    await addManagerMessage('MBTI는 뭐냐? I야 E야?', 500);
    setShowChoices(true);
  };

  // MBTI 선택 처리
  const handleMbtiSelect = async (mbti: 'I' | 'E') => {
    setUserData((prev) => ({ ...prev, mbti }));
    addUserMessage(`${mbti}야.`);
    setShowChoices(false);

    const response = mbti === 'I' 
      ? '그렇겠지. 눈에 보이더라.' 
      : '오, 의외인데? 괜찮아.';
    
    await addManagerMessage(response, 800);
    setCurrentStep('solo-level');
    await addManagerMessage('혼자 밥 먹는 거 레벨 몇? (1~10)', 500);
    setShowInput(true);
    setTimeout(() => inputRef.current?.focus(), 100);
  };

  // 혼자 밥 먹기 레벨 처리
  const handleSoloLevelSubmit = async () => {
    const level = parseInt(inputValue.trim());
    if (isNaN(level) || level < 1 || level > 10) {
      await addManagerMessage('1부터 10 사이로 말해봐.', 500);
      return;
    }

    const updatedUserData = { ...userData, soloLevel: level };
    setUserData(updatedUserData);
    addUserMessage(`레벨 ${level}`);
    setInputValue('');
    setShowInput(false);

    let response = '';
    if (level >= 8) {
      response = '오... 프로네. 마음에 든다.';
    } else if (level >= 5) {
      response = '그 정도면 할 만하겠네.';
    } else {
      response = '괜찮아. 천천히 익숙해지면 돼.';
    }

    await addManagerMessage(response, 800);
    setCurrentStep('complete');
    await addManagerMessage('오케이, 접수 완료.', 800);

    // 브릿지 화면 시작
    setTimeout(async () => {
      setIsAnalyzing(true);

      // 1단계: 성향 분석 중
      setAnalyzingText('너의 성향 분석 중...');
      await new Promise(resolve => setTimeout(resolve, 1200));

      // 2단계: 날씨 확인 중
      setAnalyzingText('이번 주말 날씨 확인 중...');
      await new Promise(resolve => setTimeout(resolve, 1200));

      // 3단계: 매칭 완료
      setAnalyzingText('매칭 완료!');
      await new Promise(resolve => setTimeout(resolve, 1000));

      // 백엔드 API 호출 (사용자 선호도 저장)
      try {
        console.log('💾 백엔드에 온보딩 데이터 저장 시도:', updatedUserData);
        await saveChatOnboardingData(updatedUserData);
        console.log('✅ 온보딩 데이터 저장 완료');
      } catch (error) {
        console.error('❌ 온보딩 데이터 저장 실패:', error);
        
        // 토큰이 유효한지 확인
        const token = localStorage.getItem('token');
        if (!token) {
          console.error('⚠️ 토큰이 없습니다. 로그인 페이지로 이동합니다.');
          alert('로그인 세션이 만료되었습니다. 다시 로그인해주세요.');
          navigate('/login', { replace: true });
          return;
        }
        
        // 에러가 발생해도 로컬에는 저장하고 계속 진행
        console.log('⚠️ 백엔드 저장 실패했지만 로컬 플래그는 저장하고 진행합니다.');
      }

      // 4단계: 최종 멘트
      setAnalyzingText('오늘의 약속을 확인해보러 가자! 🎯');
      await new Promise(resolve => setTimeout(resolve, 1000));

      // 온보딩 완료 플래그 저장 (로컬)
      localStorage.setItem('onboarding_complete', 'true');
      console.log('✅ 온보딩 완료 플래그 저장됨');

      // 위치 설정 페이지로 이동
      navigate('/location', { replace: true });
    }, 800);
  };

  // Enter 키 처리
  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      if (currentStep === 'nickname') {
        handleNicknameSubmit();
      } else if (currentStep === 'solo-level') {
        handleSoloLevelSubmit();
      }
    }
  };

  return (
    <div className="min-h-screen bg-deep-charcoal flex flex-col">
      {/* Header */}
      <header className="bg-charcoal-soft border-b border-charcoal-lighter px-4 py-4 flex items-center gap-3">
        <button
          onClick={() => navigate('/')}
          className="text-text-gray hover:text-off-white transition-colors"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <div className="flex-1">
          <h1 className="text-off-white font-bold text-lg">매니저</h1>
          <p className="text-text-gray text-xs">온라인</p>
        </div>
      </header>

      {/* 메시지 영역 */}
      <main className="flex-1 overflow-y-auto px-4 py-6 space-y-4 pb-24 scrollbar-solotion">
        <AnimatePresence>
          {messages.map((msg) => (
            <motion.div
              key={msg.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[75%] px-4 py-3 rounded-2xl ${
                  msg.sender === 'user'
                    ? 'bg-electric-lime text-deep-charcoal rounded-br-none'
                    : 'bg-charcoal-soft text-off-white rounded-bl-none'
                }`}
              >
                <p className="whitespace-pre-wrap break-words">{msg.content}</p>
                <p
                  className={`text-xs mt-1 ${
                    msg.sender === 'user' ? 'text-deep-charcoal/60' : 'text-text-gray-dark'
                  }`}
                >
                  {msg.timestamp.toLocaleTimeString('ko-KR', {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </p>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {/* 타이핑 인디케이터 */}
        {isTyping && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex justify-start"
          >
            <div className="bg-charcoal-soft px-4 py-3 rounded-2xl rounded-bl-none">
              <div className="flex gap-1">
                <motion.span
                  className="w-2 h-2 bg-text-gray rounded-full"
                  animate={{ opacity: [0.3, 1, 0.3] }}
                  transition={{ repeat: Infinity, duration: 1.2, delay: 0 }}
                />
                <motion.span
                  className="w-2 h-2 bg-text-gray rounded-full"
                  animate={{ opacity: [0.3, 1, 0.3] }}
                  transition={{ repeat: Infinity, duration: 1.2, delay: 0.2 }}
                />
                <motion.span
                  className="w-2 h-2 bg-text-gray rounded-full"
                  animate={{ opacity: [0.3, 1, 0.3] }}
                  transition={{ repeat: Infinity, duration: 1.2, delay: 0.4 }}
                />
              </div>
            </div>
          </motion.div>
        )}

        {/* MBTI 선택 버튼 */}
        {showChoices && currentStep === 'mbti' && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex justify-end gap-3"
          >
            <button
              onClick={() => handleMbtiSelect('I')}
              className="px-6 py-3 bg-charcoal-soft text-off-white rounded-2xl hover:bg-charcoal-lighter transition-all border border-electric-lime/30 hover:border-electric-lime"
            >
              I
            </button>
            <button
              onClick={() => handleMbtiSelect('E')}
              className="px-6 py-3 bg-charcoal-soft text-off-white rounded-2xl hover:bg-charcoal-lighter transition-all border border-electric-lime/30 hover:border-electric-lime"
            >
              E
            </button>
          </motion.div>
        )}

        <div ref={messagesEndRef} />
      </main>

      {/* 브릿지 화면 (분석 중 오버레이) */}
      <AnimatePresence>
        {isAnalyzing && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-deep-charcoal/95 backdrop-blur-sm z-50 flex flex-col items-center justify-center"
          >
            {/* 로딩 스피너 */}
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
              className="w-16 h-16 border-4 border-electric-lime/30 border-t-electric-lime rounded-full mb-6"
            />

            {/* 분석 텍스트 */}
            <motion.div
              key={analyzingText}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3 }}
              className="text-center"
            >
              <p className="text-off-white text-2xl font-bold mb-2">
                {analyzingText}
              </p>
              {analyzingText === '매칭 완료!' && (
                <motion.p
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="text-electric-lime text-lg"
                >
                  ✨
                </motion.p>
              )}
            </motion.div>

            {/* 프로그레스 바 (선택적) */}
            <motion.div
              className="w-64 h-1 bg-charcoal-soft rounded-full overflow-hidden mt-8"
            >
              <motion.div
                className="h-full bg-electric-lime"
                initial={{ width: '0%' }}
                animate={{ width: '100%' }}
                transition={{ duration: 2.8, ease: 'easeInOut' }}
              />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 입력창 */}
      {showInput && (
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="fixed bottom-0 left-0 right-0 bg-charcoal-soft border-t border-charcoal-lighter p-4"
        >
          <div className="container-solotion flex gap-3 items-center">
            <input
              ref={inputRef}
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder={
                currentStep === 'nickname'
                  ? '닉네임 입력...'
                  : currentStep === 'solo-level'
                  ? '1~10 숫자 입력...'
                  : '입력...'
              }
              className="flex-1 bg-charcoal-lighter text-off-white px-4 py-3 rounded-full border border-charcoal-lighter focus:border-electric-lime focus:outline-none transition-colors placeholder-text-gray-dark"
            />
            <button
              onClick={() => {
                if (currentStep === 'nickname') {
                  handleNicknameSubmit();
                } else if (currentStep === 'solo-level') {
                  handleSoloLevelSubmit();
                }
              }}
              disabled={!inputValue.trim()}
              className="bg-electric-lime text-deep-charcoal px-6 py-3 rounded-full font-bold hover:bg-electric-lime/90 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              전송
            </button>
          </div>
        </motion.div>
      )}
    </div>
  );
};

export default ChatAppointment;
