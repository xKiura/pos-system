import React from 'react';
import styled from 'styled-components';
import { useAuth } from '../components/AuthContext';
import ProfileForm from '../components/ProfileForm';
import { FaUserCircle, FaArrowRight } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';

const ProfileContainer = styled.div`
  max-width: 600px;
  margin: 2rem auto;
  padding: 2rem;
  background: white;
  border-radius: 12px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  direction: rtl;
`;

const ProfileHeader = styled.div`
  text-align: center;
  margin-bottom: 2rem;
  padding-bottom: 2rem;
  border-bottom: 1px solid #e2e8f0;

  svg {
    font-size: 5rem;
    color: #4a5568;
    margin-bottom: 1rem;
  }

  h1 {
    font-size: 1.5rem;
    color: #2d3748;
    margin: 0;
  }

  p {
    color: #718096;
    margin: 0.5rem 0 0;
  }
`;

const BackButton = styled.button`
  position: absolute;
  top: 2rem;
  right: 2rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1.25rem;
  background: #f7fafc;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  color: #4a5568;
  font-size: 0.875rem;
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    background: #edf2f7;
    transform: translateY(-1px);
  }

  svg {
    font-size: 1rem;
  }
`;

const ProfilePage = () => {
  const { currentUser } = useAuth();
  const navigate = useNavigate();

  if (!currentUser) {
    return <div>غير مصرح بالوصول</div>;
  }

  const handleGoBack = () => {
    navigate('/pos');
  };

  return (
    <ProfileContainer>
      <BackButton onClick={handleGoBack}>
        <FaArrowRight />
        العودة إلى نقطة البيع
      </BackButton>
      <ProfileHeader>
        <FaUserCircle />
        <h1>الملف الشخصي</h1>
        <p>تعديل معلومات الحساب</p>
      </ProfileHeader>
      <ProfileForm currentUser={currentUser} />
    </ProfileContainer>
  );
};

export default ProfilePage;