import React from 'react';

const LoginPage: React.FC = () => {
  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 px-4">
      <div className="mb-12 text-center">
        <h1 className="text-3xl font-bold text-gray-800 mb-4">Little Escape</h1>
        <p className="text-gray-600 text-lg">작은 일탈을 시작해보세요</p>
      </div>

      <div className="w-full max-w-md space-y-4">
        <a
          href={`${API_BASE_URL}/oauth2/authorization/kakao`}
          className="flex items-center justify-center w-full px-4 py-3 bg-[#FEE500] text-[#000000] rounded-xl font-medium shadow-sm hover:opacity-90 transition-opacity"
        >
          <span className="mr-2">💬</span>
          카카오로 시작하기
        </a>

        <a
          href={`${API_BASE_URL}/oauth2/authorization/naver`}
          className="flex items-center justify-center w-full px-4 py-3 bg-[#03C75A] text-white rounded-xl font-medium shadow-sm hover:opacity-90 transition-opacity"
        >
          <span className="mr-2 font-bold">N</span>
          네이버로 시작하기
        </a>

        <a
          href={`${API_BASE_URL}/oauth2/authorization/google`}
          className="flex items-center justify-center w-full px-4 py-3 bg-white text-gray-700 border border-gray-300 rounded-xl font-medium shadow-sm hover:bg-gray-50 transition-colors"
        >
          <span className="mr-2">G</span>
          구글로 시작하기
        </a>
      </div>
    </div>
  );
};

export default LoginPage;
