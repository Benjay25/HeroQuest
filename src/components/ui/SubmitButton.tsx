'use client';

/**
 * SubmitButton — a form submit button that shows loading state automatically.
 *
 * Uses the React 19 `useFormStatus` hook, which reads the status of the
 * nearest parent <form>. When the form's action is pending (i.e. the server
 * action is running), `pending` is true and we disable the button.
 *
 * This must be a separate component from the form itself — useFormStatus
 * only works in a component that is a CHILD of the form, not in the same
 * component that renders the form. This is a React constraint.
 *
 * Usage:
 *   <form action={myServerAction}>
 *     <SubmitButton>Save</SubmitButton>
 *   </form>
 */

import { useFormStatus } from 'react-dom';
import Button, { type ButtonProps } from '@mui/material/Button';

interface SubmitButtonProps extends Omit<ButtonProps, 'type'> {
  children: React.ReactNode;
  pendingText?: string;
}

export default function SubmitButton({
  children,
  pendingText,
  disabled,
  ...props
}: SubmitButtonProps) {
  const { pending } = useFormStatus();

  return (
    <Button
      type="submit"
      disabled={pending || disabled}
      {...props}
    >
      {pending && pendingText ? pendingText : children}
    </Button>
  );
}
