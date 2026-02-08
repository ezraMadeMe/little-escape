import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';

// 온보딩 질문 타입 정의
interface OnboardingQuestion {
  id: string;
  question: string;
  subtext: string;
  type: 'text' | 'choice' | 'slider';
  placeholder?: string;
  options?: { label: string; value: string }[];
  min?: number;
  max?: number;
  labels?: string[];
}

// 츤데레 온보딩 질문 시퀀스
const ONBOARDING_QUESTIONS: OnboardingQuestion[] = [
  {
    id: 'intro',
    question: '뭐야, 처음 보는데?',
    subtext: '이름이나 불러줄 수 있는 거 있어?',
    type: 'text',
    placeholder: '뭐라고 부를까?',
  },
  {
    id: 'weekend',
    question: '주말에 주로 뭐 해?',
    subtext: '솔직하게 말해봐.',
    type: 'choice',
    options: [
      { label: '집콕 (침대가 최고)', value: 'homebody' },
      { label: '밖에 나가긴 함 (카페 정도)', value: 'casual' },
      { label: '어디든 가봄 (모험가)', value: 'adventurer' },
    ],
  },
  {
    id: 'motivation',
    question: '왜 나한테 왔어?',
    subtext: '궁금해서 물어보는 거야.',
    type: 'choice',
    options: [
      { label: '심심해서', value: 'bored' },
      { label: '새로운 걸 해보고 싶어서', value: 'curious' },
      { label: '친구가 추천해서', value: 'recommended' },
      { label: '그냥...', value: 'just' },
    ],
  },
];

const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
  const isDev = import.meta.env.DEV; // 개발 환경 체크

  const [showOnboarding, setShowOnboarding] = useState<boolean>(false);
  const [currentStep, setCurrentStep] = useState<number>(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});

  const currentQuestion = ONBOARDING_QUESTIONS[currentStep];

  // 로그인 페이지 진입 시 localStorage 상태 확인
  useEffect(() => {
    console.log('=== 로그인 페이지 진입 ===');
    const token = localStorage.getItem('token');
    const onboardingComplete = localStorage.getItem('onboarding_complete');
    
    console.log('현재 localStorage 상태:');
    console.log('- token:', token ? '존재함' : '없음');
    console.log('- onboarding_complete:', onboardingComplete);
    
    // 로그인 페이지에 왔다는 것은 로그아웃했거나 처음 방문한 것
    // 하지만 토큰이 남아있다면 경고 표시
    if (token) {
      console.warn('⚠️ 로그인 페이지인데 토큰이 남아있습니다.');
      console.warn('깨끗한 상태로 시작하려면 브라우저 콘솔에서 다음 명령어 실행:');
      console.warn('localStorage.clear(); location.reload();');
    }
  }, []);

  // 다음 질문으로 이동
  const handleNext = (value: string) => {
    const newAnswers = { ...answers, [currentQuestion.id]: value };
    setAnswers(newAnswers);

    if (currentStep < ONBOARDING_QUESTIONS.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      // 온보딩 완료 - 로컬스토리지에 저장 후 소셜 로그인 선택지로 이동
      localStorage.setItem('onboarding', JSON.stringify(newAnswers));
      setShowOnboarding(false); // 소셜 로그인 화면으로 복귀
    }
  };

  // 온보딩 시작
  const startOnboarding = () => {
    setShowOnboarding(true);
    setCurrentStep(0);
    setAnswers({});
  };

  // Super Admin 모드 (개발 전용)
  const handleSuperAdminLogin = () => {
    console.log('🔓 Super Admin 모드 활성화');

    // Mock 토큰 생성
    const mockToken = 'mock-dev-token-' + Date.now();

    // localStorage에 필요한 데이터 설정
    localStorage.setItem('token', mockToken);
    localStorage.setItem('onboarding_complete', 'true');

    // Mock 유저 정보 설정
    localStorage.setItem('mock_user', JSON.stringify({
      id: 999,
      nickname: 'Super Admin',
      email: 'admin@solotion.dev',
      isOnboarded: true
    }));

    console.log('✅ Mock 토큰 설정 완료');
    console.log('  - token:', mockToken);
    console.log('  - onboarding_complete: true');

    // 피드로 이동
    console.log('🚀 피드 페이지로 이동...');
    navigate('/feed', { replace: true });
  };

  return (
    <div className="min-h-screen bg-deep-charcoal flex flex-col overflow-hidden">
      <AnimatePresence mode="wait">
        {!showOnboarding ? (
          // ===== Initial Landing: 소셜 로그인 화면 =====
          <motion.div
            key="landing"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex-1 flex flex-col items-center justify-center px-6"
          >
            {/* 브랜드 헤더 */}
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="text-center mb-12"
            >
              <h1 className="text-5xl sm:text-6xl font-black text-off-white mb-4 tracking-tight">
                Solotion
              </h1>
              <p className="text-text-gray text-lg sm:text-xl font-medium">
                주말 외출 독려 서비스
              </p>
              <p className="text-text-gray-dark text-sm mt-2">
                츤데레 동네 친구가 널 챙겨줄게.
              </p>
            </motion.div>

            {/* 소셜 로그인 버튼 영역 */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="w-full max-w-md space-y-4"
            >
              {/* 카카오 로그인 - 커스텀 디자인 */}
              <a
                href={`${API_BASE_URL}/oauth2/authorization/kakao`}
                className="group relative flex items-center justify-center w-full px-6 py-4 bg-gradient-to-r from-[#FEE500] to-[#FFEB3B] text-[#000000] rounded-solotion font-bold text-lg shadow-lg hover:shadow-neon-lime active:scale-95 transition-all duration-200 overflow-hidden"
              >
                <span className="absolute inset-0 bg-electric-lime/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
                <span className="relative flex items-center gap-3">
                  <span className="text-2xl">💬</span>
                  <span>카카오로 연결하기</span>
                </span>
              </a>

              {/* 네이버 로그인 */}
              <a
                href={`${API_BASE_URL}/oauth2/authorization/naver`}
                className="group relative flex items-center justify-center w-full px-6 py-4 bg-[#03C75A] text-white rounded-solotion font-bold text-lg shadow-lg hover:shadow-[0_0_20px_rgba(3,199,90,0.4)] active:scale-95 transition-all duration-200 overflow-hidden"
              >
                <span className="absolute inset-0 bg-white/10 translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
                <span className="relative flex items-center gap-3">
                  <span className="text-2xl font-black">N</span>
                  <span>네이버로 연결하기</span>
                </span>
              </a>

              {/* 구글 로그인 - Dark 테마에 맞게 */}
              <a
                href={`${API_BASE_URL}/oauth2/authorization/google`}
                className="group relative flex items-center justify-center w-full px-6 py-4 bg-charcoal-lighter border-2 border-text-gray/30 text-off-white rounded-solotion font-bold text-lg shadow-lg hover:border-electric-lime/50 active:scale-95 transition-all duration-200 overflow-hidden"
              >
                <span className="absolute inset-0 bg-electric-lime/5 translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
                <span className="relative flex items-center gap-3">
                  <span className="text-2xl">G</span>
                  <span>구글로 연결하기</span>
                </span>
              </a>

              {/* 온보딩 먼저 하기 버튼 */}
              <button
                onClick={startOnboarding}
                className="btn-ghost w-full text-base mt-6"
              >
                친구 맺기 먼저 할래
              </button>

              {/* Super Admin 버튼 (개발 환경 전용) */}
              {isDev && (
                <button
                  onClick={handleSuperAdminLogin}
                  className="w-full px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-solotion font-bold text-sm shadow-lg hover:shadow-[0_0_30px_rgba(168,85,247,0.5)] active:scale-95 transition-all duration-200 mt-4 border-2 border-purple-400"
                >
                  🔓 Super Admin (개발 전용)
                </button>
              )}
            </motion.div>

            {/* 하단 안내 문구 */}
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6 }}
              className="text-text-gray-dark text-sm mt-12 text-center max-w-md"
            >
              로그인하면 <span className="text-electric-lime">이용약관</span> 및{' '}
              <span className="text-electric-lime">개인정보처리방침</span>에 동의하는 거야.
            </motion.p>
          </motion.div>
        ) : (
          // ===== Onboarding: 채팅창 형식 =====
          <motion.div
            key="onboarding"
            initial={{ opacity: 0, x: 100 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -100 }}
            className="flex-1 flex flex-col container-solotion py-8 max-w-2xl"
          >
            {/* 진행 상황 표시 */}
            <div className="mb-8">
              <div className="flex items-center justify-between mb-2">
                <span className="text-text-gray text-sm">
                  {currentStep + 1} / {ONBOARDING_QUESTIONS.length}
                </span>
                <button
                  onClick={() => setShowOnboarding(false)}
                  className="text-text-gray hover:text-off-white text-sm"
                >
                  나중에 할게
                </button>
              </div>
              <div className="w-full h-1 bg-charcoal-lighter rounded-full overflow-hidden">
                <motion.div
                  className="h-full bg-electric-lime"
                  initial={{ width: 0 }}
                  animate={{ width: `${((currentStep + 1) / ONBOARDING_QUESTIONS.length) * 100}%` }}
                  transition={{ duration: 0.3 }}
                />
              </div>
            </div>

            {/* 질문 카드 */}
            <AnimatePresence mode="wait">
              <motion.div
                key={currentStep}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
                className="flex-1 flex flex-col"
              >
                {/* 질문 */}
                <div className="mb-8">
                  <h2 className="text-off-white text-3xl sm:text-4xl font-extra-bold mb-3">
                    {currentQuestion.question}
                  </h2>
                  <p className="text-text-gray text-lg">{currentQuestion.subtext}</p>
                </div>

                {/* 입력 영역 */}
                <div className="flex-1 flex items-start">
                  {currentQuestion.type === 'text' && (
                    <TextInput
                      placeholder={currentQuestion.placeholder ?? ''}
                      onSubmit={handleNext}
                    />
                  )}

                  {currentQuestion.type === 'choice' && (
                    <ChoiceInput
                      options={currentQuestion.options || []}
                      onSelect={handleNext}
                    />
                  )}

                  {currentQuestion.type === 'slider' && (
                    <SliderInput
                      min={currentQuestion.min || 1}
                      max={currentQuestion.max || 5}
                      labels={currentQuestion.labels || []}
                      onSelect={handleNext}
                    />
                  )}
                </div>
              </motion.div>
            </AnimatePresence>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

// ===== Sub Components =====

// 텍스트 입력 컴포넌트
const TextInput: React.FC<{ placeholder: string; onSubmit: (value: string) => void }> = ({
  placeholder,
  onSubmit,
}) => {
  const [value, setValue] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (value.trim()) {
      onSubmit(value.trim());
    }
  };

  return (
    <form onSubmit={handleSubmit} className="w-full space-y-4">
      <input
        type="text"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder={placeholder}
        className="input w-full text-lg"
        autoFocus
      />
      <button
        type="submit"
        disabled={!value.trim()}
        className="btn-primary w-full disabled:opacity-50 disabled:cursor-not-allowed"
      >
        다음
      </button>
    </form>
  );
};

// 선택지 입력 컴포넌트
const ChoiceInput: React.FC<{
  options: { label: string; value: string }[];
  onSelect: (value: string) => void;
}> = ({ options, onSelect }) => {
  return (
    <div className="w-full space-y-3">
      {options.map((option, idx) => (
        <motion.button
          key={option.value}
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: idx * 0.1 }}
          onClick={() => onSelect(option.value)}
          className="card w-full text-left hover:border-electric-lime/50 hover:bg-charcoal-lighter active:scale-98 transition-all cursor-pointer"
        >
          <p className="text-off-white text-lg font-semibold">{option.label}</p>
        </motion.button>
      ))}
    </div>
  );
};

// 슬라이더 입력 컴포넌트
const SliderInput: React.FC<{
  min: number;
  max: number;
  labels: string[];
  onSelect: (value: string) => void;
}> = ({ min, max, labels, onSelect }) => {
  const [value, setValue] = useState(Math.floor((min + max) / 2));

  return (
    <div className="w-full space-y-8">
      {/* 현재 선택된 레벨 표시 */}
      <div className="text-center">
        <div className="text-electric-lime text-6xl font-black mb-2">{value}</div>
        <p className="text-text-gray text-xl">{labels[value - 1]}</p>
      </div>

      {/* 슬라이더 */}
      <div className="space-y-4">
        <input
          type="range"
          min={min}
          max={max}
          value={value}
          onChange={(e) => setValue(Number(e.target.value))}
          className="w-full h-2 bg-charcoal-lighter rounded-full appearance-none cursor-pointer
                     [&::-webkit-slider-thumb]:appearance-none
                     [&::-webkit-slider-thumb]:w-6
                     [&::-webkit-slider-thumb]:h-6
                     [&::-webkit-slider-thumb]:bg-electric-lime
                     [&::-webkit-slider-thumb]:rounded-full
                     [&::-webkit-slider-thumb]:cursor-pointer
                     [&::-webkit-slider-thumb]:shadow-neon-lime
                     [&::-moz-range-thumb]:w-6
                     [&::-moz-range-thumb]:h-6
                     [&::-moz-range-thumb]:bg-electric-lime
                     [&::-moz-range-thumb]:border-0
                     [&::-moz-range-thumb]:rounded-full
                     [&::-moz-range-thumb]:cursor-pointer"
        />
        <div className="flex justify-between text-text-gray-dark text-sm">
          <span>{min}</span>
          <span>{max}</span>
        </div>
      </div>

      <button onClick={() => onSelect(String(value))} className="btn-primary w-full">
        이거로 할게
      </button>
    </div>
  );
};

export default LoginPage;
