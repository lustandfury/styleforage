import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Lock, ArrowRight, Loader2 } from 'lucide-react';

/**
 * LookbookLogin - Entry page for clients to access their lookbook
 * Users enter their personal code which validates against the CMS
 * and redirects them to their lookbook page.
 */
export const LookbookLogin: React.FC = () => {
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  // Auto-focus the input on mount
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const trimmedCode = code.trim();
    if (!trimmedCode) {
      setError('Please enter your code');
      return;
    }

    setError('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/cms-auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: trimmedCode }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Invalid code');
        setIsLoading(false);
        return;
      }

      // Redirect to the lookbook page
      navigate(`/lookbook/${data.slug}`);
    } catch (err) {
      setError('Unable to connect. Please try again.');
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-stone-50 flex flex-col">
      {/* Background pattern */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_1px_1px,rgb(214,211,209)_1px,transparent_0)] bg-[size:40px_40px] opacity-30" />
      
      <div className="relative flex-1 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md">
          {/* Logo/Brand */}
          <div className="text-center mb-10">
            <h1 className="font-serif text-3xl md:text-4xl text-stone-800 mb-2">
              Style Forage
            </h1>
            <p className="text-stone-500 text-sm tracking-wide uppercase">
              Personal Lookbook
            </p>
          </div>

          {/* Login Card */}
          <div className="bg-white rounded-2xl shadow-xl shadow-stone-200/50 border border-stone-100 p-8 md:p-10">
            <div className="flex items-center justify-center w-14 h-14 bg-sage-50 rounded-xl mb-6 mx-auto">
              <Lock className="w-6 h-6 text-sage-600" />
            </div>

            <h2 className="text-center text-xl font-medium text-stone-800 mb-2">
              Enter your code
            </h2>
            <p className="text-center text-stone-500 text-sm mb-8">
              Use the personal code provided by your stylist to access your lookbook.
            </p>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="code" className="sr-only">
                  Access Code
                </label>
                <input
                  ref={inputRef}
                  id="code"
                  type="text"
                  value={code}
                  onChange={(e) => {
                    setCode(e.target.value);
                    if (error) setError('');
                  }}
                  placeholder="Enter your code"
                  autoComplete="off"
                  autoCapitalize="none"
                  autoCorrect="off"
                  spellCheck="false"
                  disabled={isLoading}
                  className={`
                    w-full px-4 py-4 text-center text-lg font-medium tracking-wider
                    bg-stone-50 border-2 rounded-xl
                    placeholder:text-stone-400 placeholder:font-normal placeholder:tracking-normal
                    focus:outline-none focus:bg-white focus:border-sage-500 focus:ring-2 focus:ring-sage-100
                    disabled:opacity-50 disabled:cursor-not-allowed
                    transition-all duration-200
                    ${error ? 'border-red-300 bg-red-50/50' : 'border-stone-200'}
                  `}
                />
                {error && (
                  <p className="mt-3 text-sm text-red-600 text-center" role="alert">
                    {error}
                  </p>
                )}
              </div>

              <button
                type="submit"
                disabled={isLoading || !code.trim()}
                className={`
                  w-full flex items-center justify-center gap-2
                  px-6 py-4 rounded-xl font-medium
                  transition-all duration-200
                  ${isLoading || !code.trim()
                    ? 'bg-stone-200 text-stone-400 cursor-not-allowed'
                    : 'bg-stone-900 text-white hover:bg-stone-800 active:scale-[0.98]'
                  }
                `}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span>Verifying...</span>
                  </>
                ) : (
                  <>
                    <span>View My Lookbook</span>
                    <ArrowRight className="w-5 h-5" />
                  </>
                )}
              </button>
            </form>
          </div>

          {/* Help text */}
          <p className="mt-8 text-center text-sm text-stone-400">
            Don't have a code?{' '}
            <a
              href="/contact"
              className="text-sage-600 hover:text-sage-700 underline underline-offset-2"
            >
              Contact us
            </a>
          </p>
        </div>
      </div>

      {/* Footer */}
      <div className="relative text-center py-6">
        <p className="text-xs text-stone-400">
          © {new Date().getFullYear()} Style Forage
        </p>
      </div>
    </div>
  );
};

export default LookbookLogin;
