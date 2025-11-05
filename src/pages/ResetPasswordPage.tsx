import React from 'react';
import { useSearchParams } from 'react-router-dom';
import { AuthLayout, ResetPasswordForm } from '../components/auth';

const ResetPasswordPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');

  return (
    <AuthLayout>
      <ResetPasswordForm token={token} />
    </AuthLayout>
  );
};

export default ResetPasswordPage;

