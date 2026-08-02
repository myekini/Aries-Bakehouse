import { useState } from 'react';
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
} from '../ui/input-group.jsx';
import { Label } from '../ui/label.jsx';

export default function PasswordField({
  id,
  label = 'Password',
  action,
  hint,
  ...inputProps
}) {
  const [visible, setVisible] = useState(false);
  const hintId = hint ? `${id}-hint` : undefined;

  return (
    <div className="auth-field">
      <div className="auth-field__label-row">
        <Label htmlFor={id}>{label}</Label>
        {action}
      </div>
      <InputGroup className="password-input">
        <InputGroupInput
          {...inputProps}
          id={id}
          type={visible ? 'text' : 'password'}
          aria-describedby={hintId}
        />
        <InputGroupAddon align="inline-end">
          <InputGroupButton
            className="password-input__toggle"
            onClick={() => setVisible((current) => !current)}
            aria-pressed={visible}
          >
            {visible ? 'Hide' : 'Show'}
          </InputGroupButton>
        </InputGroupAddon>
      </InputGroup>
      {hint && <p id={hintId} className="auth-field__hint">{hint}</p>}
    </div>
  );
}
