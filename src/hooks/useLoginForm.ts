import { useState } from 'react';

interface UseLoginFormReturn {
  username: string;
  password: string;
  isLoading: boolean;
  showPassword: boolean;
  usernameError: string;
  passwordError: string;
  setUsername: (value: string) => void;
  setPassword: (value: string) => void;
  setShowPassword: (value: boolean) => void;
  handleLogin: (onSuccess: () => void) => Promise<void>;
}

export const useLoginForm = (): UseLoginFormReturn => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [usernameError, setUsernameError] = useState('');
  const [passwordError, setPasswordError] = useState('');

  const handleLogin = async (onSuccess: () => void) => {
    // Reset errors
    setUsernameError('');
    setPasswordError('');

    // Validation
    let hasError = false;

    if (!username.trim()) {
      setUsernameError('Username tidak boleh kosong');
      hasError = true;
    }

    if (!password.trim()) {
      setPasswordError('Password tidak boleh kosong');
      hasError = true;
    } else if (password.length < 6) {
      setPasswordError('Password minimal 6 karakter');
      hasError = true;
    }

    if (hasError) {
      return;
    }
    setIsLoading(true);
    setTimeout(() => {
      if (username === 'pbrkel' && password === '12345678') {
        setIsLoading(false);
        onSuccess();
      } else {
        setIsLoading(false);
        if (username !== 'pbrkel') {
          setUsernameError('Username tidak valid');
        }
        if (password !== '12345678') {
          setPasswordError('Password salah');
        }
      }
    }, 1000);
  };

  return {
    username,
    password,
    isLoading,
    showPassword,
    usernameError,
    passwordError,
    setUsername: (value: string) => {
      setUsername(value);
      if (usernameError) setUsernameError('');
    },
    setPassword: (value: string) => {
      setPassword(value);
      if (passwordError) setPasswordError('');
    },
    setShowPassword,
    handleLogin,
  };
};
