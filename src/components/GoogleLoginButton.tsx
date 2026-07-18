import { useEffect, useRef, useState } from 'react';

interface GoogleCredentialResponse {
  credential: string;
  select_by: string;
}

interface GoogleIdentityApi {
  accounts: {
    id: {
      initialize: (config: {
        client_id: string;
        callback: (response: GoogleCredentialResponse) => void;
        ux_mode?: 'popup' | 'redirect';
      }) => void;
      renderButton: (
        parent: HTMLElement,
        options: {
          type: 'standard';
          theme: 'outline';
          size: 'large';
          text: 'signin_with';
          shape: 'rectangular';
          locale: string;
          width: number;
        }
      ) => void;
      disableAutoSelect: () => void;
    };
  };
}

declare global {
  interface Window {
    google?: GoogleIdentityApi;
  }
}

interface GoogleLoginButtonProps {
  onCredential: (idToken: string) => void;
  disabled?: boolean;
}

const GOOGLE_SCRIPT_ID = 'google-identity-services';

export default function GoogleLoginButton({ onCredential, disabled = false }: GoogleLoginButtonProps) {
  const buttonContainerRef = useRef<HTMLDivElement>(null);
  const [configurationError, setConfigurationError] = useState('');

  useEffect(() => {
    const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;

    if (!clientId) {
      setConfigurationError('Chưa cấu hình Google Client ID.');
      return;
    }

    let isActive = true;

    const renderGoogleButton = () => {
      if (!isActive || !window.google || !buttonContainerRef.current) return;

      window.google.accounts.id.initialize({
        client_id: clientId,
        ux_mode: 'popup',
        callback: (response) => {
          if (response.credential) onCredential(response.credential);
        },
      });

      buttonContainerRef.current.replaceChildren();
      window.google.accounts.id.renderButton(buttonContainerRef.current, {
        type: 'standard',
        theme: 'outline',
        size: 'large',
        text: 'signin_with',
        shape: 'rectangular',
        locale: 'vi',
        width: Math.min(Math.max(window.innerWidth - 32, 200), 400),
      });
    };

    const existingScript = document.getElementById(GOOGLE_SCRIPT_ID) as HTMLScriptElement | null;
    if (window.google) {
      renderGoogleButton();
    } else if (existingScript) {
      existingScript.addEventListener('load', renderGoogleButton, { once: true });
    } else {
      const script = document.createElement('script');
      script.id = GOOGLE_SCRIPT_ID;
      script.src = 'https://accounts.google.com/gsi/client?hl=vi';
      script.async = true;
      script.defer = true;
      script.addEventListener('load', renderGoogleButton, { once: true });
      script.addEventListener('error', () => {
        if (isActive) setConfigurationError('Không thể tải dịch vụ đăng nhập Google.');
      }, { once: true });
      document.head.appendChild(script);
    }

    return () => {
      isActive = false;
      existingScript?.removeEventListener('load', renderGoogleButton);
    };
  }, [onCredential]);

  if (configurationError) {
    return <p className="text-center text-xs text-red-600">{configurationError}</p>;
  }

  return (
    <div className={disabled ? 'pointer-events-none opacity-60' : ''}>
      <div ref={buttonContainerRef} className="flex min-h-10 w-full justify-center" />
    </div>
  );
}
