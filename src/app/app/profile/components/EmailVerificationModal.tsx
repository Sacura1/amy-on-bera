'use client';

import { useState } from 'react';
import { preAuthenticate } from 'thirdweb/wallets/in-app';
import { useLinkProfile } from 'thirdweb/react';
import { client } from '@/app/client';

interface EmailVerificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

type Step = 'email' | 'code';

export default function EmailVerificationModal({
  isOpen,
  onClose,
  onSuccess
}: EmailVerificationModalProps) {
  const [step, setStep] = useState<Step>('email');
  const [email, setEmail] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const { mutateAsync: linkProfile } = useLinkProfile();

  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleSendCode = async () => {
    if (!email.trim()) {
      setError('Please enter your email address');
      return;
    }

    if (!validateEmail(email)) {
      setError('Please enter a valid email address');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      // Send verification code using Thirdweb preAuthenticate
      await preAuthenticate({
        client,
        strategy: 'email',
        email: email.trim()
      });

      setStep('code');
    } catch (err) {
      console.error('Error sending verification code:', err);
      setError('Failed to send verification code. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyCode = async () => {
    if (!verificationCode.trim()) {
      setError('Please enter the verification code');
      return;
    }

    if (verificationCode.length !== 6) {
      setError('Verification code must be 6 digits');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      // Link the email to the account using the verification code
      await linkProfile({
        client,
        strategy: 'email',
        email: email.trim(),
        verificationCode: verificationCode.trim()
      });

      onSuccess();
      handleClose();
    } catch (err: unknown) {
      console.error('Error verifying code:', err);
      // Show actual error message from Thirdweb
      const errorMessage = err instanceof Error ? err.message : String(err);
      if (errorMessage.includes('already linked') || errorMessage.includes('already exists')) {
        setError('This email is already linked to another account.');
      } else if (errorMessage.includes('expired')) {
        setError('Verification code expired. Please request a new one.');
      } else if (errorMessage.includes('invalid') || errorMessage.includes('incorrect')) {
        setError('Invalid verification code. Please check and try again.');
      } else {
        setError(`Verification failed: ${errorMessage}`);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    setStep('email');
    setEmail('');
    setVerificationCode('');
    setError('');
    onClose();
  };

  const handleResendCode = async () => {
    setIsLoading(true);
    setError('');

    try {
      await preAuthenticate({
        client,
        strategy: 'email',
        email: email.trim()
      });
      setError('');
      alert('Verification code resent!');
    } catch (err) {
      console.error('Error resending code:', err);
      setError('Failed to resend code. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/80 backdrop-blur-sm"
        onClick={handleClose}
      />

      {/* Modal */}
      <div className="relative bg-gray-900 rounded-2xl border border-gray-700 w-full max-w-md overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-700">
          <h2 className="text-xl font-bold text-white">
            {step === 'email' ? 'Connect Email' : 'Enter Verification Code'}
          </h2>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {step === 'email' ? (
            <>
              <p className="text-gray-400 mb-4">
                Enter your email address to receive a verification code.
              </p>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email..."
                className="w-full px-4 py-3 rounded-xl bg-gray-800 border border-gray-700 text-white placeholder-gray-500 focus:border-pink-500 focus:outline-none transition-colors"
                disabled={isLoading}
                onKeyDown={(e) => e.key === 'Enter' && handleSendCode()}
              />
            </>
          ) : (
            <>
              <p className="text-gray-400 mb-2">
                We sent a 6-digit code to:
              </p>
              <p className="text-yellow-400 font-semibold mb-4">{email}</p>
              <input
                type="text"
                value={verificationCode}
                onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                placeholder="Enter 6-digit code..."
                className="w-full px-4 py-3 rounded-xl bg-gray-800 border border-gray-700 text-white text-center text-2xl tracking-widest font-mono placeholder-gray-500 focus:border-pink-500 focus:outline-none transition-colors"
                disabled={isLoading}
                maxLength={6}
                onKeyDown={(e) => e.key === 'Enter' && handleVerifyCode()}
              />
              <button
                onClick={handleResendCode}
                disabled={isLoading}
                className="mt-3 text-sm text-gray-400 hover:text-pink-400 transition-colors disabled:opacity-50"
              >
                Didn&apos;t receive the code? Resend
              </button>
            </>
          )}

          {error && (
            <p className="text-red-400 text-sm mt-3">{error}</p>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-700 flex gap-3">
          {step === 'code' && (
            <button
              onClick={() => {
                setStep('email');
                setVerificationCode('');
                setError('');
              }}
              disabled={isLoading}
              className="flex-1 py-3 rounded-xl border border-gray-600 text-gray-300 font-semibold hover:bg-gray-800 transition-colors disabled:opacity-50"
            >
              Back
            </button>
          )}
          <button
            onClick={step === 'email' ? handleSendCode : handleVerifyCode}
            disabled={isLoading}
            className="flex-1 btn-samy btn-samy-enhanced text-white py-3 rounded-xl font-bold disabled:opacity-50"
          >
            {isLoading ? (
              <span className="flex items-center justify-center gap-2">
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                {step === 'email' ? 'Sending...' : 'Verifying...'}
              </span>
            ) : (
              step === 'email' ? 'Send Code' : 'Verify'
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
