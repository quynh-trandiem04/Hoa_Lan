import React, { forwardRef, useImperativeHandle, useState } from 'react';
import { RefreshCw, ShieldCheck } from 'lucide-react';

export interface CaptchaChallengeHandle {
  validate: () => boolean;
  reset: () => void;
}

const createChallenge = () => {
  const left = Math.floor(Math.random() * 8) + 2;
  const right = Math.floor(Math.random() * 8) + 1;
  return { left, right, answer: left + right };
};

const CaptchaChallenge = forwardRef<CaptchaChallengeHandle>(function CaptchaChallenge(_, ref) {
  const [challenge, setChallenge] = useState(createChallenge);
  const [answer, setAnswer] = useState('');
  const [error, setError] = useState('');

  const reset = () => {
    setChallenge(createChallenge());
    setAnswer('');
    setError('');
  };

  useImperativeHandle(ref, () => ({
    validate: () => {
      const valid = Number(answer) === challenge.answer;
      setError(valid ? '' : 'Kết quả CAPTCHA chưa đúng.');
      if (!valid) {
        setChallenge(createChallenge());
        setAnswer('');
      }
      return valid;
    },
    reset,
  }), [answer, challenge.answer]);

  return (
    <div className="space-y-1.5">
      <label className="block text-[10px] font-bold uppercase tracking-wider text-[#777b78]">
        Xác minh CAPTCHA *
      </label>
      <div className="flex items-stretch overflow-hidden rounded-[2px] border border-[#e2e3e1] bg-white focus-within:border-[#56642b]">
        <div className="flex min-w-28 items-center justify-center gap-2 border-r border-[#e2e3e1] bg-[#f4f4f2] px-3 text-sm font-bold text-[#56642b]">
          <ShieldCheck className="h-4 w-4" />
          <span>{challenge.left} + {challenge.right} = ?</span>
        </div>
        <input
          type="number"
          inputMode="numeric"
          value={answer}
          onChange={(event) => {
            setAnswer(event.target.value);
            setError('');
          }}
          placeholder="Kết quả"
          aria-label="Kết quả CAPTCHA"
          className="min-w-0 flex-1 px-3 py-2.5 text-xs outline-none"
        />
        <button
          type="button"
          onClick={reset}
          className="border-l border-[#e2e3e1] px-3 text-[#777b78] hover:bg-[#f4f4f2] hover:text-[#56642b]"
          title="Đổi CAPTCHA"
          aria-label="Đổi CAPTCHA"
        >
          <RefreshCw className="h-4 w-4" />
        </button>
      </div>
      {error && <p className="text-[10px] text-red-600">{error}</p>}
    </div>
  );
});

export default CaptchaChallenge;
