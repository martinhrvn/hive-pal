import React from 'react';
import { ArrowLeft, RefreshCw, Home } from 'lucide-react';

interface ErrorPageProps {
  title?: string;
  message?: string;
  code?: string | number;
  onRetry?: () => void;
  onBack?: () => void;
  onHome?: () => void;
}

const GenericErrorPage: React.FC<ErrorPageProps> = ({
  title = 'Something went wrong',
  message = "We're having trouble loading this page. Please try again or return home.",
  code = '500',
  onBack,
  onHome,
}) => {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <div className="bg-white sticky top-0 z-10 px-4 py-3 border-b flex justify-between items-center shadow-sm">
        <div className="flex items-center gap-2">
          {onBack && (
            <button onClick={onBack} className="p-1">
              <ArrowLeft size={20} className="text-gray-700" />
            </button>
          )}
          <h1 className="text-lg font-semibold">Error</h1>
        </div>
      </div>

      {/* Error content */}
      <div className="flex-1 flex flex-col items-center justify-center px-4 py-8">
        <div className="w-full max-w-md mx-auto bg-white rounded-lg shadow-sm border overflow-hidden">
          <div className="p-6 flex flex-col items-center text-center">
            <img src={'/error.png'} />

            <h2 className="text-xl font-bold mb-1">{title}</h2>

            {code && (
              <div className="mb-2 px-3 py-1 bg-gray-100 rounded-full text-sm text-gray-700">
                Error {code}
              </div>
            )}

            <p className="text-gray-600 mb-6">{message}</p>

            <div className="flex flex-col w-full gap-3">
              <button
                onClick={() => window.location.reload()}
                className="w-full py-3 bg-blue-600 text-white rounded-lg flex items-center justify-center gap-2 font-medium"
              >
                <RefreshCw size={16} />
                <span>Try Again</span>
              </button>

              {onHome && (
                <button
                  onClick={onHome}
                  className="w-full py-3 border border-gray-300 bg-white text-gray-700 rounded-lg flex items-center justify-center gap-2 font-medium"
                >
                  <Home size={16} />
                  <span>Back to Home</span>
                </button>
              )}
            </div>
          </div>

          <div className="px-6 py-3 bg-gray-50 border-t text-center">
            <p className="text-sm text-gray-500">
              If this problem persists, please check your internet connection or
              try again later.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GenericErrorPage;
