import React, { useState, useEffect } from 'react';
import { AdminDashboardScreen } from '../Components/AdminDashboardScreen';
import { StudentDashboardScreen } from '../Components/StudentDashboardScreen';
import { TeacherDashboardScreen } from '../Components/TeacherDashboardScreen';
import { authService, tokenService } from '../Services/api';
// eslint-disable-next-line no-unused-vars

import { router } from '@inertiajs/react';
import { Loader2 } from 'lucide-react';

const USER_DATA_KEY = 'user_session_data';

const processUserObject = (userObj, token) => {
  if (!userObj) return null;
  const rid = Number(userObj.role_id !== undefined ? userObj.role_id : userObj.roleId);
  if (isNaN(rid)) return null;

  let finalRole;
  switch (rid) {
    case 1: finalRole = 'admin'; break;
    case 3: finalRole = 'teacher'; break;
    case 4: finalRole = 'student'; break;
    default: return null;
  }
  return { user: { role: finalRole, data: userObj }, token };
};

export default function Dashboard() {
  const [userData, setUserData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const initAuth = async () => {
      const token = tokenService.getToken();
      if (!token) {
        router.visit('/login');
        return;
      }

      const cached = localStorage.getItem(USER_DATA_KEY);
      if (cached) {
        try {
          const cachedData = JSON.parse(cached);
          if (cachedData && cachedData.user) {
            setUserData(cachedData);
            setIsLoading(false);
            return;
          }
        } catch (e) {
          localStorage.removeItem(USER_DATA_KEY);
        }
      }

      try {
        const response = await authService.getProfile();
        const candidates = [
          response.user?.data,
          response.data,
          response.user,
          response
        ];
        const isValidUser = (obj) => obj && (obj.role_id !== undefined || obj.roleId !== undefined);
        const finalUserObj = candidates.find(isValidUser);

        if (!finalUserObj) {
          throw new Error("Invalid Profile Data");
        }

        const processedData = processUserObject(finalUserObj, token);
        if (!processedData) {
          throw new Error("Invalid Role ID");
        }

        setUserData(processedData);
        localStorage.setItem(USER_DATA_KEY, JSON.stringify(processedData));
      } catch (error) {
        tokenService.removeToken();
        localStorage.removeItem(USER_DATA_KEY);
        router.visit('/login');
      } finally {
        setIsLoading(false);
      }
    };
    initAuth();
  }, []);

  const handleLogout = () => {
    authService.logout().catch(() => {});
    localStorage.removeItem(USER_DATA_KEY);
    tokenService.removeToken();
    router.visit('/');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 gap-4">
        <Loader2 className="animate-spin text-primary h-12 w-12" />
        <p className="text-slate-500 font-medium animate-pulse">Loading Dashboard...</p>
      </div>
    );
  }

  if (!userData || !userData.user.role) {
    return null;
  }

  switch (userData.user.role) {
    case 'admin':
      return <AdminDashboardScreen data={userData} onLogout={handleLogout} />;
    case 'student':
      return <StudentDashboardScreen data={userData} onLogout={handleLogout} />;
    case 'teacher':
      return <TeacherDashboardScreen data={userData} onLogout={handleLogout} />;
    default:
      handleLogout();
      return null;
  }
}
