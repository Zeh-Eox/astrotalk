import React, { useState } from "react";
import { EyeIcon, EyeOffIcon, LockIcon } from "lucide-react";

interface Props {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  required?: boolean;
  autoComplete?: string;
}

const PasswordInput: React.FC<Props> = ({
  value,
  onChange,
  placeholder = "Enter your password",
  required = false,
  autoComplete = "current-password",
}) => {
  const [visible, setVisible] = useState(false);

  return (
    <div className="relative">
      <LockIcon className="auth-input-icon" />
      <input
        type={visible ? "text" : "password"}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="input pr-10"
        placeholder={placeholder}
        required={required}
        autoComplete={autoComplete}
      />
      <button
        type="button"
        onClick={() => setVisible((v) => !v)}
        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200"
        aria-label={visible ? "Hide password" : "Show password"}
      >
        {visible ? (
          <EyeOffIcon className="size-5" />
        ) : (
          <EyeIcon className="size-5" />
        )}
      </button>
    </div>
  );
};

export default PasswordInput;
