import { useState } from 'react';
import axios from 'axios';
import { adminTimeTravel } from '../api/appointmentApi';
import { showToast } from '../utils/toast';

// API Types
type Weather = 'SUNNY' | 'RAIN' | 'SNOW' | 'CLOUDY';
type AirQuality = 'GOOD' | 'BAD' | 'WORST';
type Congestion = 'LOW' | 'MEDIUM' | 'HIGH';
type MissionCategory = 'FOOD' | 'ACTIVITY' | 'RELAX' | 'CULTURE';

interface SimulationRequest {
  targetDateTime: string;
  latitude: number;
  longitude: number;
  searchRadius: number;
  weather: Weather;
  temperature: number;
  airQuality: AirQuality;
  congestion: Congestion;
  userMbti: string;
  soloLevel: number;
  forcedCategory?: MissionCategory;
}

interface PlaceInfo {
  id: number;
  name: string;
  address: string;
  category: string;
  latitude: number;
  longitude: number;
  imageUrl: string;
  tags: string;
}

interface MissionInfo {
  id: number;
  title: string;
  description: string;
  category: string;
  difficultyLevel: string;
  condition: string;
  imageUrl: string;
  locationType: string;
  timeOfDay: string;
  guide: string;
}

interface SimulationResponse {
  mission: MissionInfo | null;
  place: PlaceInfo | null;
  debugLogs: string[];
  totalMissionCandidates: number;
  filteredMissionCandidates: number;
  totalPlaceCandidates: number;
  filteredPlaceCandidates: number;
  allFilteredMissions: MissionInfo[];
  allFilteredPlaces: PlaceInfo[];
}

// Location Presets
const LOCATION_PRESETS = [
  { name: '성수동', latitude: 37.5447, longitude: 127.0438 },
  { name: '강남역', latitude: 37.4979, longitude: 127.0276 },
  { name: '홍대', latitude: 37.5563, longitude: 126.9240 },
  { name: '여의도', latitude: 37.5219, longitude: 126.9245 },
  { name: '서울역', latitude: 37.5547, longitude: 126.9707 },
];

// Weather Icons
const WEATHER_OPTIONS: { value: Weather; icon: string; label: string }[] = [
  { value: 'SUNNY', icon: '☀️', label: '맑음' },
  { value: 'RAIN', icon: '🌧️', label: '비' },
  { value: 'SNOW', icon: '❄️', label: '눈' },
  { value: 'CLOUDY', icon: '☁️', label: '흐림' },
];

const DevConsole = () => {
  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080';

  // State
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<SimulationResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Form State
  const [targetDateTime, setTargetDateTime] = useState<string>(
    new Date().toISOString().slice(0, 16)
  );
  const [latitude, setLatitude] = useState<number>(37.5665);
  const [longitude, setLongitude] = useState<number>(126.9780);
  const [searchRadius, setSearchRadius] = useState<number>(10);
  const [weather, setWeather] = useState<Weather>('SUNNY');
  const [temperature, setTemperature] = useState<number>(20);
  const [airQuality, setAirQuality] = useState<AirQuality>('GOOD');
  const [congestion, setCongestion] = useState<Congestion>('LOW');
  const [userMbti, setUserMbti] = useState<'I' | 'E'>('I');
  const [soloLevel, setSoloLevel] = useState<number>(3);
  const [forcedCategory, setForcedCategory] = useState<MissionCategory | ''>('');
  const [timeTravelId, setTimeTravelId] = useState<string>('');

  // Random Scenario Generator
  const generateRandomScenario = () => {
    // Random datetime (within next 7 days)
    const randomDate = new Date();
    randomDate.setDate(randomDate.getDate() + Math.floor(Math.random() * 7));
    randomDate.setHours(Math.floor(Math.random() * 24));
    setTargetDateTime(randomDate.toISOString().slice(0, 16));

    // Random location
    const randomPreset = LOCATION_PRESETS[Math.floor(Math.random() * LOCATION_PRESETS.length)];
    setLatitude(randomPreset.latitude);
    setLongitude(randomPreset.longitude);

    // Random radius (5-15km)
    setSearchRadius(5 + Math.floor(Math.random() * 11));

    // Random weather
    const weathers: Weather[] = ['SUNNY', 'RAIN', 'SNOW', 'CLOUDY'];
    setWeather(weathers[Math.floor(Math.random() * weathers.length)]);

    // Random temperature (-10 ~ 35)
    setTemperature(-10 + Math.floor(Math.random() * 46));

    // Random air quality
    const airQualities: AirQuality[] = ['GOOD', 'BAD', 'WORST'];
    setAirQuality(airQualities[Math.floor(Math.random() * airQualities.length)]);

    // Random congestion
    const congestions: Congestion[] = ['LOW', 'MEDIUM', 'HIGH'];
    setCongestion(congestions[Math.floor(Math.random() * congestions.length)]);

    // Random MBTI
    setUserMbti(Math.random() > 0.5 ? 'I' : 'E');

    // Random solo level (1-5)
    setSoloLevel(1 + Math.floor(Math.random() * 5));

    // Random category (optional)
    const categories: (MissionCategory | '')[] = ['', 'FOOD', 'ACTIVITY', 'RELAX', 'CULTURE'];
    setForcedCategory(categories[Math.floor(Math.random() * categories.length)]);
  };

  // Run Simulation
  const runSimulation = async () => {
    setLoading(true);
    setError(null);
    setResult(null);

    const request: SimulationRequest = {
      targetDateTime,
      latitude,
      longitude,
      searchRadius,
      weather,
      temperature,
      airQuality,
      congestion,
      userMbti,
      soloLevel,
      ...(forcedCategory && { forcedCategory }),
    };

    try {
      const response = await axios.post<SimulationResponse>(
        `${API_BASE_URL}/api/admin/simulation`,
        request
      );
      setResult(response.data);
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || '시뮬레이션 실행 실패');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">🎮 God Mode Simulation</h1>
          <p className="text-gray-600">
            추천 로직을 테스트하기 위한 환경 변수 통제 도구
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left Panel: Input Controls */}
          <div className="space-y-6">
            {/* Section 1: Time & Space */}
            <section className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
                🕒 시공간 설정
              </h2>

              {/* DateTime */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  날짜 & 시간
                </label>
                <input
                  type="datetime-local"
                  value={targetDateTime}
                  onChange={(e) => setTargetDateTime(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Location Presets */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">위치 프리셋</label>
                <div className="flex flex-wrap gap-2">
                  {LOCATION_PRESETS.map((preset) => (
                    <button
                      key={preset.name}
                      onClick={() => {
                        setLatitude(preset.latitude);
                        setLongitude(preset.longitude);
                      }}
                      className="px-3 py-1 bg-blue-100 text-blue-700 rounded-md hover:bg-blue-200 text-sm"
                    >
                      📍 {preset.name}
                    </button>
                  ))}
                </div>
              </div>

              {/* Latitude & Longitude */}
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">위도</label>
                  <input
                    type="number"
                    step="0.0001"
                    value={latitude}
                    onChange={(e) => setLatitude(parseFloat(e.target.value))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">경도</label>
                  <input
                    type="number"
                    step="0.0001"
                    value={longitude}
                    onChange={(e) => setLongitude(parseFloat(e.target.value))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              {/* Search Radius */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  반경: {searchRadius} km
                </label>
                <input
                  type="range"
                  min="1"
                  max="20"
                  value={searchRadius}
                  onChange={(e) => setSearchRadius(parseInt(e.target.value))}
                  className="w-full"
                />
              </div>
            </section>

            {/* Section 2: Environment */}
            <section className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
                🌦️ 환경 변수
              </h2>

              {/* Weather */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">날씨</label>
                <div className="grid grid-cols-4 gap-2">
                  {WEATHER_OPTIONS.map((option) => (
                    <button
                      key={option.value}
                      onClick={() => setWeather(option.value)}
                      className={`px-3 py-2 rounded-md border-2 transition-all ${
                        weather === option.value
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-300 hover:border-blue-300'
                      }`}
                    >
                      <div className="text-2xl">{option.icon}</div>
                      <div className="text-xs mt-1">{option.label}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Temperature */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  기온: {temperature}°C
                </label>
                <input
                  type="range"
                  min="-20"
                  max="40"
                  value={temperature}
                  onChange={(e) => setTemperature(parseInt(e.target.value))}
                  className="w-full"
                />
              </div>

              {/* Air Quality */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">미세먼지</label>
                <div className="grid grid-cols-3 gap-2">
                  {(['GOOD', 'BAD', 'WORST'] as AirQuality[]).map((value) => (
                    <button
                      key={value}
                      onClick={() => setAirQuality(value)}
                      className={`px-3 py-2 rounded-md border-2 transition-all ${
                        airQuality === value
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-300 hover:border-blue-300'
                      }`}
                    >
                      {value === 'GOOD' ? '😊 좋음' : value === 'BAD' ? '😷 나쁨' : '☠️ 최악'}
                    </button>
                  ))}
                </div>
              </div>

              {/* Congestion */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">혼잡도</label>
                <div className="grid grid-cols-3 gap-2">
                  {(['LOW', 'MEDIUM', 'HIGH'] as Congestion[]).map((value) => (
                    <button
                      key={value}
                      onClick={() => setCongestion(value)}
                      className={`px-3 py-2 rounded-md border-2 transition-all ${
                        congestion === value
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-300 hover:border-blue-300'
                      }`}
                    >
                      {value === 'LOW' ? '🤗 한적함' : value === 'MEDIUM' ? '🙂 보통' : '😵 터짐'}
                    </button>
                  ))}
                </div>
              </div>
            </section>

            {/* Section 3: User Persona */}
            <section className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
                👤 사용자 페르소나
              </h2>

              {/* MBTI */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">MBTI</label>
                <div className="flex gap-2">
                  <button
                    onClick={() => setUserMbti('I')}
                    className={`flex-1 px-4 py-3 rounded-md border-2 transition-all ${
                      userMbti === 'I'
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-300 hover:border-blue-300'
                    }`}
                  >
                    <div className="text-lg font-bold">I</div>
                    <div className="text-xs text-gray-600">내향형</div>
                  </button>
                  <button
                    onClick={() => setUserMbti('E')}
                    className={`flex-1 px-4 py-3 rounded-md border-2 transition-all ${
                      userMbti === 'E'
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-300 hover:border-blue-300'
                    }`}
                  >
                    <div className="text-lg font-bold">E</div>
                    <div className="text-xs text-gray-600">외향형</div>
                  </button>
                </div>
              </div>

              {/* Solo Level */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  솔로 레벨: {soloLevel}
                </label>
                <div className="flex gap-1">
                  {[1, 2, 3, 4, 5].map((level) => (
                    <button
                      key={level}
                      onClick={() => setSoloLevel(level)}
                      className={`flex-1 h-12 rounded-md transition-all ${
                        level <= soloLevel ? 'bg-yellow-400' : 'bg-gray-200'
                      }`}
                    >
                      ⭐
                    </button>
                  ))}
                </div>
              </div>

              {/* Forced Category (Optional) */}
              <div className="mt-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  카테고리 강제 지정 (선택)
                </label>
                <select
                  value={forcedCategory}
                  onChange={(e) => setForcedCategory(e.target.value as MissionCategory | '')}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">자동 선택</option>
                  <option value="FOOD">🍽️ 음식 (FOOD)</option>
                  <option value="ACTIVITY">🏃 활동 (ACTIVITY)</option>
                  <option value="RELAX">☕ 휴식 (RELAX)</option>
                  <option value="CULTURE">🎭 문화 (CULTURE)</option>
                </select>
              </div>
            </section>

            {/* Section 4: Time Travel (Admin) */}
            <section className="bg-white rounded-lg shadow p-6 border-2 border-red-200">
              <h2 className="text-xl font-semibold text-red-600 mb-4 flex items-center gap-2">
                ⏰ 타임 트래블 (관리자)
              </h2>
              <div className="flex gap-2">
                <input
                  type="number"
                  placeholder="약속 ID"
                  value={timeTravelId}
                  onChange={(e) => setTimeTravelId(e.target.value)}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                />
                <button
                  onClick={async () => {
                    if (!timeTravelId) return;
                    try {
                      await adminTimeTravel(Number(timeTravelId));
                      showToast('약속 시간이 현재로 변경되었습니다! 🕰️');
                      setTimeTravelId('');
                    } catch (error) {
                      console.error(error);
                      alert('타임 트래블 실패');
                    }
                  }}
                  className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 font-medium"
                >
                  현재로 당기기
                </button>
              </div>
              <p className="text-xs text-gray-500 mt-2">
                * 해당 약속의 scheduledAt을 현재 시간으로 즉시 변경합니다.
              </p>
            </section>

            {/* Action Buttons */}
            <div className="flex gap-3">
              <button
                onClick={generateRandomScenario}
                className="flex-1 bg-purple-600 text-white py-3 rounded-lg hover:bg-purple-700 transition-colors font-medium"
              >
                🎲 랜덤 시나리오
              </button>
              <button
                onClick={runSimulation}
                disabled={loading}
                className="flex-1 bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 transition-colors font-medium disabled:bg-gray-400"
              >
                {loading ? '⏳ 실행 중...' : '▶️ 시뮬레이션 실행'}
              </button>
            </div>
          </div>

          {/* Right Panel: Results */}
          <div className="space-y-6">
            {/* Error Display */}
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <h3 className="text-red-800 font-semibold mb-2">❌ 오류 발생</h3>
                <p className="text-red-700 text-sm">{error}</p>
              </div>
            )}

            {/* Result Display */}
            {result && (
              <>
                {/* Mission Card */}
                {result.mission && (
                  <section className="bg-white rounded-lg shadow p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-3">
                      ✅ 추천된 미션
                    </h3>
                    <div className="border border-gray-200 rounded-lg p-4 space-y-2">
                      <div className="font-bold text-lg text-blue-600">{result.mission.title}</div>
                      <div className="text-sm text-gray-600">{result.mission.description}</div>
                      <div className="flex gap-2 flex-wrap mt-2">
                        <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs">
                          {result.mission.category}
                        </span>
                        <span className="px-2 py-1 bg-purple-100 text-purple-700 rounded text-xs">
                          {result.mission.difficultyLevel}
                        </span>
                        <span className="px-2 py-1 bg-green-100 text-green-700 rounded text-xs">
                          {result.mission.locationType}
                        </span>
                        <span className="px-2 py-1 bg-orange-100 text-orange-700 rounded text-xs">
                          {result.mission.timeOfDay}
                        </span>
                      </div>
                    </div>
                  </section>
                )}

                {/* Place Card */}
                {result.place && (
                  <section className="bg-white rounded-lg shadow p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-3">
                      📍 추천된 장소
                    </h3>
                    <div className="border border-gray-200 rounded-lg p-4 space-y-2">
                      <div className="font-bold text-lg text-green-600">{result.place.name}</div>
                      <div className="text-sm text-gray-600">{result.place.address}</div>
                      <div className="flex gap-2 flex-wrap mt-2">
                        <span className="px-2 py-1 bg-green-100 text-green-700 rounded text-xs">
                          {result.place.category}
                        </span>
                        {result.place.tags && (
                          <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs">
                            {result.place.tags}
                          </span>
                        )}
                      </div>
                    </div>
                  </section>
                )}

                {/* Stats */}
                <section className="bg-white rounded-lg shadow p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">📊 통계</h3>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-blue-50 rounded p-3">
                      <div className="text-xs text-gray-600">전체 미션 후보</div>
                      <div className="text-2xl font-bold text-blue-600">
                        {result.totalMissionCandidates}
                      </div>
                    </div>
                    <div className="bg-green-50 rounded p-3">
                      <div className="text-xs text-gray-600">필터링 후 미션</div>
                      <div className="text-2xl font-bold text-green-600">
                        {result.filteredMissionCandidates}
                      </div>
                    </div>
                    <div className="bg-purple-50 rounded p-3">
                      <div className="text-xs text-gray-600">전체 장소 후보</div>
                      <div className="text-2xl font-bold text-purple-600">
                        {result.totalPlaceCandidates}
                      </div>
                    </div>
                    <div className="bg-orange-50 rounded p-3">
                      <div className="text-xs text-gray-600">필터링 후 장소</div>
                      <div className="text-2xl font-bold text-orange-600">
                        {result.filteredPlaceCandidates}
                      </div>
                    </div>
                  </div>
                </section>

                {/* All Filtered Missions */}
                {result.allFilteredMissions && result.allFilteredMissions.length > 0 && (
                  <section className="bg-white rounded-lg shadow p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-3">
                      📋 필터링된 전체 미션 ({result.allFilteredMissions.length}개)
                    </h3>
                    <div className="space-y-2 max-h-96 overflow-y-auto">
                      {result.allFilteredMissions.map((mission, index) => (
                        <div
                          key={mission.id}
                          className={`border rounded-lg p-3 ${
                            mission.id === result.mission?.id
                              ? 'border-blue-500 bg-blue-50'
                              : 'border-gray-200 hover:border-blue-300'
                          }`}
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="font-semibold text-sm text-gray-900">
                                {index + 1}. {mission.title}
                                {mission.id === result.mission?.id && (
                                  <span className="ml-2 text-xs text-blue-600">← 선택됨</span>
                                )}
                              </div>
                              <div className="text-xs text-gray-600 mt-1">{mission.description}</div>
                              <div className="flex gap-1 flex-wrap mt-2">
                                <span className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded text-xs">
                                  {mission.category}
                                </span>
                                <span className="px-2 py-0.5 bg-purple-100 text-purple-700 rounded text-xs">
                                  {mission.difficultyLevel}
                                </span>
                                <span className="px-2 py-0.5 bg-green-100 text-green-700 rounded text-xs">
                                  {mission.locationType}
                                </span>
                                <span className="px-2 py-0.5 bg-orange-100 text-orange-700 rounded text-xs">
                                  {mission.timeOfDay}
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </section>
                )}

                {/* All Filtered Places */}
                {result.allFilteredPlaces && result.allFilteredPlaces.length > 0 && (
                  <section className="bg-white rounded-lg shadow p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-3">
                      📍 필터링된 전체 장소 ({result.allFilteredPlaces.length}개)
                    </h3>
                    <div className="space-y-2 max-h-96 overflow-y-auto">
                      {result.allFilteredPlaces.map((place, index) => (
                        <div
                          key={place.id}
                          className={`border rounded-lg p-3 ${
                            place.id === result.place?.id
                              ? 'border-green-500 bg-green-50'
                              : 'border-gray-200 hover:border-green-300'
                          }`}
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="font-semibold text-sm text-gray-900">
                                {index + 1}. {place.name}
                                {place.id === result.place?.id && (
                                  <span className="ml-2 text-xs text-green-600">← 선택됨</span>
                                )}
                              </div>
                              <div className="text-xs text-gray-600 mt-1">{place.address}</div>
                              <div className="flex gap-1 flex-wrap mt-2">
                                <span className="px-2 py-0.5 bg-green-100 text-green-700 rounded text-xs">
                                  {place.category}
                                </span>
                                {place.tags && (
                                  <span className="px-2 py-0.5 bg-gray-100 text-gray-700 rounded text-xs">
                                    {place.tags}
                                  </span>
                                )}
                                <span className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded text-xs">
                                  ({place.latitude.toFixed(4)}, {place.longitude.toFixed(4)})
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </section>
                )}

                {/* Debug Logs (Terminal Style) */}
                <section className="bg-gray-900 rounded-lg shadow p-6">
                  <h3 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
                    🖥️ Debug Logs
                  </h3>
                  <div className="bg-black rounded-lg p-4 font-mono text-sm max-h-96 overflow-y-auto">
                    {result.debugLogs.map((log, index) => (
                      <div
                        key={index}
                        className={`mb-1 ${
                          log.includes('❌')
                            ? 'text-red-400'
                            : log.includes('✅')
                            ? 'text-green-400'
                            : log.includes('⚠️')
                            ? 'text-yellow-400'
                            : 'text-gray-300'
                        }`}
                      >
                        <span className="text-gray-500">[{index + 1}]</span> {log}
                      </div>
                    ))}
                  </div>
                </section>
              </>
            )}

            {/* Empty State */}
            {!result && !error && !loading && (
              <div className="bg-white rounded-lg shadow p-12 text-center">
                <div className="text-6xl mb-4">🎮</div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">시뮬레이션 대기 중</h3>
                <p className="text-gray-600">
                  환경 변수를 설정하고 시뮬레이션을 실행해보세요.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DevConsole;
