import { useState } from 'react';
import axios from 'axios';
import type { Method } from 'axios';

type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
type PresetCategory = 'general' | 'external-data' | 'maintenance';

interface ApiPreset {
  key: string;
  label: string;
  method: HttpMethod;
  path: string;
  description: string;
  includeAuth?: boolean;
  body?: string;
  contentType?: string;
  category: PresetCategory;
}

interface ApiResponseState {
  status: number;
  statusText: string;
  durationMs: number;
  headers: Record<string, string>;
  body: unknown;
  requestLabel: string;
  requestMethod: HttpMethod;
  requestUrl: string;
}

interface DevApiControlPanelProps {
  apiBaseUrl: string;
}

interface ExecuteRequestOptions {
  method: HttpMethod;
  path: string;
  body?: string;
  contentType?: string;
  includeAuth?: boolean;
  customHeaders?: string;
  label: string;
  presetKey?: string;
}

interface MetricItem {
  label: string;
  value: string | number;
}

interface MetricSection {
  title: string;
  metrics: MetricItem[];
}

interface DistributionSection {
  title: string;
  entries: MetricItem[];
}

const API_PRESETS: ApiPreset[] = [
  {
    key: 'me',
    label: '내 정보',
    method: 'GET',
    path: '/api/v1/users/me',
    description: '현재 로그인한 사용자 정보 조회',
    includeAuth: true,
    category: 'general',
  },
  {
    key: 'appointments',
    label: '내 약속 목록',
    method: 'GET',
    path: '/api/v1/appointments/me',
    description: '현재 로그인한 사용자의 약속 목록 조회',
    includeAuth: true,
    category: 'general',
  },
  {
    key: 'simulation',
    label: '시뮬레이션',
    method: 'POST',
    path: '/api/admin/simulation',
    description: 'God Mode 시뮬레이션 API 호출',
    includeAuth: false,
    category: 'general',
    body: JSON.stringify(
      {
        targetDateTime: new Date().toISOString().slice(0, 16),
        latitude: 37.5665,
        longitude: 126.978,
        searchRadius: 10,
        weather: 'SUNNY',
        temperature: 20,
        airQuality: 'GOOD',
        congestion: 'NORMAL',
        userMbti: 'I',
        userId: 1,
      },
      null,
      2
    ),
  },
  {
    key: 'health',
    label: '관리 API 헬스',
    method: 'POST',
    path: '/api/admin/health',
    description: '관리용 API 상태 확인',
    includeAuth: false,
    category: 'general',
  },
  {
    key: 'ingest-all',
    label: '전체 외부 수집',
    method: 'POST',
    path: '/api/admin/ingest',
    description: '공연, 문화행사, 공원, 맛집, 도서관 수집 일괄 실행',
    includeAuth: false,
    category: 'external-data',
  },
  {
    key: 'collect-libraries',
    label: '도서관 수집',
    method: 'POST',
    path: '/api/admin/data/collect/libraries',
    description: '도서관 API 호출 후 필터링된 장소/도서관 데이터 저장',
    includeAuth: false,
    category: 'external-data',
  },
  {
    key: 'collect-books',
    label: '인기 도서 수집',
    method: 'POST',
    path: '/api/admin/data/collect/popular-books',
    description: '대출 인기 도서 수집',
    includeAuth: false,
    category: 'external-data',
  },
  {
    key: 'collect-performances',
    label: '공연/축제 수집',
    method: 'POST',
    path: '/api/admin/data/collect/performances',
    description: 'KOPIS 호출 후 가격/연령/키워드 필터링 적용',
    includeAuth: false,
    category: 'external-data',
  },
  {
    key: 'collect-events',
    label: '문화행사 수집',
    method: 'POST',
    path: '/api/admin/data/collect/cultural-events',
    description: '서울 Open Data 호출 후 문화행사 필터링 저장',
    includeAuth: false,
    category: 'external-data',
  },
  {
    key: 'collect-parks',
    label: '공원 수집',
    method: 'POST',
    path: '/api/admin/data/collect/parks',
    description: '서울 Open Data 공원 수집 및 필터링 적용',
    includeAuth: false,
    category: 'external-data',
  },
  {
    key: 'collect-restaurants',
    label: '맛집 수집',
    method: 'POST',
    path: '/api/admin/data/collect/restaurants',
    description: '서울 Open Data 맛집 수집',
    includeAuth: false,
    category: 'external-data',
  },
  {
    key: 'data-stats',
    label: '수집 통계',
    method: 'GET',
    path: '/api/admin/data/stats',
    description: '현재 저장된 데이터 통계 조회',
    includeAuth: false,
    category: 'external-data',
  },
  {
    key: 'deactivate-expired',
    label: '종료 공연 만료',
    method: 'POST',
    path: '/api/admin/data/deactivate-expired',
    description: '종료된 공연/행사를 비활성화 처리',
    includeAuth: false,
    category: 'maintenance',
  },
  {
    key: 'check-expired-appointments',
    label: '약속 만료 체크',
    method: 'POST',
    path: '/api/admin/scheduler/check-expired',
    description: '만료된 약속을 EXPIRED 상태로 갱신',
    includeAuth: false,
    category: 'maintenance',
  },
  {
    key: 'fix-public-status',
    label: '공개 상태 보정',
    method: 'POST',
    path: '/api/admin/fix-public-status',
    description: '완료된 약속의 공개 상태 일괄 보정',
    includeAuth: false,
    category: 'maintenance',
  },
  {
    key: 'time-travel',
    label: '타임 트래블',
    method: 'PATCH',
    path: '/api/admin/appointments/1/time-travel',
    description: '약속 시간을 현재 시각으로 강제 이동',
    includeAuth: false,
    category: 'maintenance',
  },
  {
    key: 'unlock-now',
    label: '즉시 잠금 해제',
    method: 'PUT',
    path: '/api/v1/appointments/1/dev/unlock-now',
    description: '약속을 지금 시점으로 잠금 해제',
    includeAuth: true,
    category: 'maintenance',
  },
  {
    key: 'unlock-tomorrow',
    label: '내일 잠금 해제',
    method: 'PUT',
    path: '/api/v1/appointments/1/dev/unlock-tomorrow',
    description: '약속을 D-1 시점으로 이동',
    includeAuth: true,
    category: 'maintenance',
  },
];

const METRIC_LABELS: Record<string, string> = {
  inserted: '수집',
  importedCount: '임포트',
  updated: '업데이트',
  updatedCount: '수정',
  filtered: '필터링',
  skipped: '스킵',
  deactivatedCount: '만료 처리',
  deletedCount: '삭제',
  remainingCount: '잔여',
  totalPlaces: '전체 장소',
  activePlaces: '활성 장소',
  totalLibraries: '도서관',
  totalPopularBooks: '인기 도서',
  totalPlacesCount: '전체 장소',
  totalCompleted: '완료 약속',
};

const SECTION_LABELS: Record<string, string> = {
  performances: '공연',
  festivals: '축제',
  culturalEvents: '문화행사',
  publicReservation: '공공예약',
  placesBySource: '소스별 장소',
  placesByCategory: '카테고리별 장소',
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function normalizeHeaders(headers: unknown): Record<string, string> {
  if (!isRecord(headers)) {
    return {};
  }

  return Object.fromEntries(
    Object.entries(headers).map(([key, value]) => {
      if (Array.isArray(value)) {
        return [key, value.join(', ')];
      }
      return [key, String(value)];
    })
  );
}

function getResponseTone(status: number) {
  if (status >= 200 && status < 300) {
    return 'bg-green-100 text-green-700 border-green-200';
  }
  if (status >= 400) {
    return 'bg-red-100 text-red-700 border-red-200';
  }
  return 'bg-yellow-100 text-yellow-700 border-yellow-200';
}

function formatResponseBody(body: unknown) {
  if (body === undefined || body === null || body === '') {
    return 'No response body';
  }

  if (typeof body === 'string') {
    return body;
  }

  try {
    return JSON.stringify(body, null, 2);
  } catch {
    return String(body);
  }
}

function toMetricLabel(key: string) {
  return METRIC_LABELS[key] ?? key;
}

function extractMetricSections(body: unknown): MetricSection[] {
  if (!isRecord(body)) {
    return [];
  }

  const sections: MetricSection[] = [];

  const topLevelMetrics = Object.entries(body)
    .filter(([key, value]) => !isRecord(value) && !Array.isArray(value) && key in METRIC_LABELS)
    .map(([key, value]) => ({
      label: toMetricLabel(key),
      value: typeof value === 'number' || typeof value === 'string' ? value : String(value),
    }));

  if (topLevelMetrics.length > 0) {
    sections.push({ title: '요약', metrics: topLevelMetrics });
  }

  Object.entries(body).forEach(([key, value]) => {
    if (!isRecord(value)) {
      return;
    }

    const metrics = Object.entries(value)
      .filter(([childKey, childValue]) => !isRecord(childValue) && !Array.isArray(childValue) && childKey in METRIC_LABELS)
      .map(([childKey, childValue]) => ({
        label: toMetricLabel(childKey),
        value:
          typeof childValue === 'number' || typeof childValue === 'string'
            ? childValue
            : String(childValue),
      }));

    if (metrics.length > 0) {
      sections.push({
        title: SECTION_LABELS[key] ?? key,
        metrics,
      });
    }
  });

  return sections;
}

function extractDistributionSections(body: unknown): DistributionSection[] {
  if (!isRecord(body)) {
    return [];
  }

  return Object.entries(body)
    .filter(([, value]) => isRecord(value))
    .map(([key, value]) => {
      const recordValue = value as Record<string, unknown>;

      const entries = Object.entries(recordValue)
        .filter(([, childValue]) => !isRecord(childValue) && !Array.isArray(childValue))
        .filter(([childKey]) => !(childKey in METRIC_LABELS))
        .map(([childKey, childValue]) => ({
          label: childKey,
          value:
            typeof childValue === 'number' || typeof childValue === 'string'
              ? childValue
              : String(childValue),
        }));

      return {
        title: SECTION_LABELS[key] ?? key,
        entries,
      };
    })
    .filter((section) => section.entries.length > 0);
}

function buildRequestUrl(apiBaseUrl: string, path: string) {
  const trimmedPath = path.trim();
  if (trimmedPath.startsWith('http://') || trimmedPath.startsWith('https://')) {
    return trimmedPath;
  }
  return `${apiBaseUrl}${trimmedPath.startsWith('/') ? trimmedPath : `/${trimmedPath}`}`;
}

function getPreset(key: string) {
  return API_PRESETS.find((preset) => preset.key === key);
}

function getPresetsByCategory(category: PresetCategory) {
  return API_PRESETS.filter((preset) => preset.category === category);
}

const DevApiControlPanel = ({ apiBaseUrl }: DevApiControlPanelProps) => {
  const [method, setMethod] = useState<HttpMethod>('GET');
  const [path, setPath] = useState<string>('/api/v1/users/me');
  const [requestBody, setRequestBody] = useState<string>('');
  const [contentType, setContentType] = useState<string>('application/json');
  const [customHeaders, setCustomHeaders] = useState<string>('');
  const [includeAuth, setIncludeAuth] = useState(true);
  const [loading, setLoading] = useState(false);
  const [requestError, setRequestError] = useState<string | null>(null);
  const [response, setResponse] = useState<ApiResponseState | null>(null);
  const [activePresetKey, setActivePresetKey] = useState<string | null>(null);

  const token = localStorage.getItem('token');
  const metricSections = extractMetricSections(response?.body);
  const distributionSections = extractDistributionSections(response?.body);

  const applyPreset = (preset: ApiPreset) => {
    setMethod(preset.method);
    setPath(preset.path);
    setRequestBody(preset.body ?? '');
    setContentType(preset.contentType ?? 'application/json');
    setIncludeAuth(preset.includeAuth ?? true);
    setRequestError(null);
  };

  const resetResponse = () => {
    setRequestError(null);
    setResponse(null);
    setActivePresetKey(null);
  };

  const executeRequest = async ({
    method: nextMethod,
    path: nextPath,
    body: nextBody,
    contentType: nextContentType,
    includeAuth: nextIncludeAuth,
    customHeaders: nextCustomHeaders,
    label,
    presetKey,
  }: ExecuteRequestOptions) => {
    const trimmedPath = nextPath.trim();
    const trimmedBody = (nextBody ?? '').trim();
    const trimmedContentType = (nextContentType ?? 'application/json').trim();
    const trimmedHeaders = (nextCustomHeaders ?? '').trim();

    if (!trimmedPath) {
      setRequestError('요청 경로를 입력하세요.');
      return;
    }

    if (nextMethod === 'GET' && trimmedBody) {
      setRequestError('GET 요청은 body 없이 보내세요.');
      return;
    }

    let parsedHeaders: Record<string, string> = {};
    if (trimmedHeaders) {
      try {
        parsedHeaders = normalizeHeaders(JSON.parse(trimmedHeaders));
      } catch {
        setRequestError('헤더 JSON 형식이 올바르지 않습니다.');
        return;
      }
    }

    let data: unknown;
    if (trimmedBody) {
      if (trimmedContentType.includes('json')) {
        try {
          data = JSON.parse(trimmedBody);
        } catch {
          setRequestError('본문 JSON 형식이 올바르지 않습니다.');
          return;
        }
      } else {
        data = trimmedBody;
      }
    }

    const requestUrl = buildRequestUrl(apiBaseUrl, trimmedPath);
    const headers: Record<string, string> = {
      'ngrok-skip-browser-warning': 'true',
      ...parsedHeaders,
    };

    if (trimmedBody && trimmedContentType && !headers['Content-Type']) {
      headers['Content-Type'] = trimmedContentType;
    }

    if (nextIncludeAuth && token) {
      headers.Authorization = `Bearer ${token}`;
    }

    setLoading(true);
    setRequestError(null);
    setResponse(null);
    setActivePresetKey(presetKey ?? null);

    try {
      const startedAt = performance.now();
      const res = await axios.request({
        url: requestUrl,
        method: nextMethod as Method,
        headers,
        data,
        validateStatus: () => true,
      });
      const durationMs = Math.round(performance.now() - startedAt);

      setResponse({
        status: res.status,
        statusText: res.statusText,
        durationMs,
        headers: normalizeHeaders(res.headers),
        body: res.data,
        requestLabel: label,
        requestMethod: nextMethod,
        requestUrl,
      });
    } catch (error) {
      if (axios.isAxiosError(error)) {
        setRequestError(error.message);
      } else if (error instanceof Error) {
        setRequestError(error.message);
      } else {
        setRequestError('알 수 없는 요청 오류가 발생했습니다.');
      }
    } finally {
      setLoading(false);
      if (!presetKey) {
        setActivePresetKey(null);
      }
    }
  };

  const handleSendRequest = async () => {
    await executeRequest({
      method,
      path,
      body: requestBody,
      contentType,
      includeAuth,
      customHeaders,
      label: 'Custom request',
    });
  };

  const runPreset = async (preset: ApiPreset) => {
    applyPreset(preset);
    await executeRequest({
      method: preset.method,
      path: preset.path,
      body: preset.body,
      contentType: preset.contentType,
      includeAuth: preset.includeAuth ?? true,
      label: preset.label,
      presetKey: preset.key,
    });
  };

  const renderQuickSection = (
    title: string,
    description: string,
    category: PresetCategory,
    toneClasses: string
  ) => {
    const presets = getPresetsByCategory(category);

    return (
      <div className={`rounded-2xl border p-5 ${toneClasses}`}>
        <div className="flex flex-col gap-1 mb-4">
          <h3 className="text-lg font-semibold text-slate-900">{title}</h3>
          <p className="text-sm text-slate-700">{description}</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
          {presets.map((preset) => (
            <div key={preset.key} className="rounded-xl border border-white/70 bg-white/80 p-4 shadow-sm">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-blue-600">{preset.method}</span>
                    <span className="font-medium text-slate-900">{preset.label}</span>
                  </div>
                  <div className="text-xs text-slate-500 mt-1">{preset.path}</div>
                </div>
                <button
                  type="button"
                  onClick={() => void runPreset(preset)}
                  disabled={loading}
                  className="px-3 py-1.5 rounded-lg bg-slate-900 text-white text-sm font-medium hover:bg-slate-800 disabled:bg-slate-400 transition-colors"
                >
                  {loading && activePresetKey === preset.key ? '실행 중...' : '실행'}
                </button>
              </div>
              <div className="text-sm text-slate-600 mt-3">{preset.description}</div>
              <button
                type="button"
                onClick={() => applyPreset(preset)}
                className="mt-3 text-xs font-medium text-slate-600 hover:text-slate-900"
              >
                요청 빌더에 채우기
              </button>
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <section className="bg-white rounded-2xl shadow-lg border border-slate-200 p-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h2 className="text-2xl font-semibold text-slate-900">Dev API Control</h2>
          <p className="text-sm text-slate-600 mt-1">
            `dev-console` 안에서 임의 API를 직접 호출하고, 외부 수집과 만료 처리까지 실행합니다.
          </p>
        </div>
        <div className="flex flex-wrap gap-2 text-xs">
          <span className="px-3 py-1.5 rounded-full bg-slate-100 text-slate-700">
            Base URL: {apiBaseUrl}
          </span>
          <span
            className={`px-3 py-1.5 rounded-full ${
              token ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
            }`}
          >
            Token: {token ? 'loaded' : 'missing'}
          </span>
        </div>
      </div>

      <div className="mt-5 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4 text-sm text-slate-700">
        외부 데이터 수집 버튼은 백엔드가 공개 API를 직접 호출한 뒤 서버 측 필터링을 적용해 저장합니다.
        공연/행사 만료 버튼은 종료된 데이터를 비활성화하고, 약속 만료 버튼은 EXPIRED 상태 갱신을 즉시 수행합니다.
      </div>

      <div className="mt-6 space-y-4">
        {renderQuickSection(
          '외부 데이터 수집',
          '도서관, 공연, 문화행사, 공원, 맛집 데이터를 수집하고 필터링 결과를 바로 확인합니다.',
          'external-data',
          'border-blue-200 bg-blue-50/70'
        )}

        {renderQuickSection(
          '만료 및 보정 작업',
          '종료 데이터 비활성화, 약속 만료 체크, 공개 상태 보정 같은 운영성 작업을 즉시 실행합니다.',
          'maintenance',
          'border-amber-200 bg-amber-50/70'
        )}
      </div>

      <div className="mt-6">
        <div className="text-sm font-medium text-slate-800 mb-2">빠른 프리셋</div>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-3">
          {API_PRESETS.map((preset) => (
            <button
              key={`${preset.method}-${preset.path}`}
              type="button"
              onClick={() => applyPreset(preset)}
              className="text-left rounded-xl border border-slate-200 px-4 py-3 hover:border-blue-400 hover:bg-blue-50 transition-colors"
            >
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs font-semibold text-blue-600">{preset.method}</span>
                <span className="text-sm font-medium text-slate-900">{preset.label}</span>
              </div>
              <div className="text-xs text-slate-500 truncate">{preset.path}</div>
              <div className="text-xs text-slate-600 mt-2">{preset.description}</div>
            </button>
          ))}
        </div>
      </div>

      <div className="mt-6 grid grid-cols-1 xl:grid-cols-[180px_1fr] gap-4">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">Method</label>
          <select
            value={method}
            onChange={(e) => setMethod(e.target.value as HttpMethod)}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="GET">GET</option>
            <option value="POST">POST</option>
            <option value="PUT">PUT</option>
            <option value="PATCH">PATCH</option>
            <option value="DELETE">DELETE</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">Path or URL</label>
          <input
            type="text"
            value={path}
            onChange={(e) => setPath(e.target.value)}
            placeholder="/api/v1/users/me"
            className="w-full rounded-lg border border-slate-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      <div className="mt-4 grid grid-cols-1 xl:grid-cols-[220px_1fr] gap-4">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">Content-Type</label>
          <input
            type="text"
            value={contentType}
            onChange={(e) => setContentType(e.target.value)}
            placeholder="application/json"
            className="w-full rounded-lg border border-slate-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div className="flex items-center gap-3 rounded-lg border border-slate-200 px-4 py-3 bg-slate-50">
          <input
            id="include-auth"
            type="checkbox"
            checked={includeAuth}
            onChange={(e) => setIncludeAuth(e.target.checked)}
            className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
          />
          <label htmlFor="include-auth" className="text-sm text-slate-700">
            localStorage `token`을 Authorization 헤더에 포함
          </label>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-1 xl:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">
            Extra Headers JSON
          </label>
          <textarea
            value={customHeaders}
            onChange={(e) => setCustomHeaders(e.target.value)}
            rows={10}
            placeholder={'{\n  "X-Debug": "true"\n}'}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">Request Body</label>
          <textarea
            value={requestBody}
            onChange={(e) => setRequestBody(e.target.value)}
            rows={10}
            placeholder={'{\n  "sample": true\n}'}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      <div className="mt-5 flex flex-wrap gap-3">
        <button
          type="button"
          onClick={() => void handleSendRequest()}
          disabled={loading}
          className="px-5 py-2.5 rounded-lg bg-slate-900 text-white font-medium hover:bg-slate-800 disabled:bg-slate-400 transition-colors"
        >
          {loading && !activePresetKey ? '요청 중...' : 'API 호출'}
        </button>
        <button
          type="button"
          onClick={resetResponse}
          className="px-5 py-2.5 rounded-lg border border-slate-300 text-slate-700 font-medium hover:bg-slate-50 transition-colors"
        >
          응답 초기화
        </button>
      </div>

      {requestError && (
        <div className="mt-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {requestError}
        </div>
      )}

      {response && (
        <div className="mt-6 space-y-4">
          <div className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <div className="flex flex-wrap items-center gap-3">
              <span
                className={`px-3 py-1 rounded-full border text-sm font-semibold ${getResponseTone(
                  response.status
                )}`}
              >
                {response.status} {response.statusText}
              </span>
              <span className="text-sm text-slate-600">{response.durationMs} ms</span>
              <span className="text-sm font-medium text-slate-900">{response.requestLabel}</span>
            </div>
            <div className="text-xs text-slate-500">
              {response.requestMethod} {response.requestUrl}
            </div>
          </div>

          {metricSections.length > 0 && (
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
              {metricSections.map((section) => (
                <div key={section.title} className="rounded-2xl border border-slate-200 bg-white p-4">
                  <div className="text-sm font-semibold text-slate-900 mb-3">{section.title}</div>
                  <div className="grid grid-cols-2 gap-3">
                    {section.metrics.map((metric) => (
                      <div key={`${section.title}-${metric.label}`} className="rounded-xl bg-slate-50 p-3">
                        <div className="text-xs text-slate-500">{metric.label}</div>
                        <div className="text-xl font-semibold text-slate-900">{metric.value}</div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}

          {distributionSections.length > 0 && (
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
              {distributionSections.map((section) => (
                <div key={section.title} className="rounded-2xl border border-slate-200 bg-white p-4">
                  <div className="text-sm font-semibold text-slate-900 mb-3">{section.title}</div>
                  <div className="space-y-2">
                    {section.entries.map((entry) => (
                      <div
                        key={`${section.title}-${entry.label}`}
                        className="flex items-center justify-between rounded-lg bg-slate-50 px-3 py-2 text-sm"
                      >
                        <span className="text-slate-600">{entry.label}</span>
                        <span className="font-medium text-slate-900">{entry.value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
            <div>
              <div className="text-sm font-medium text-slate-700 mb-2">Response Headers</div>
              <pre className="rounded-xl bg-slate-950 text-slate-100 p-4 text-xs overflow-x-auto min-h-[240px]">
                {JSON.stringify(response.headers, null, 2)}
              </pre>
            </div>
            <div>
              <div className="text-sm font-medium text-slate-700 mb-2">Response Body</div>
              <pre className="rounded-xl bg-slate-950 text-slate-100 p-4 text-xs overflow-x-auto min-h-[240px]">
                {formatResponseBody(response.body)}
              </pre>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};

export default DevApiControlPanel;
