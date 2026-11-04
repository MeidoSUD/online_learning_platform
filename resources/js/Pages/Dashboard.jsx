import React, { useState, useEffect } from 'react';
import { AdminDashboardScreen } from '../Components/AdminDashboardScreen';
import { StudentDashboardScreen } from '../Components/StudentDashboardScreen';
import { TeacherDashboardScreen } from '../Components/TeacherDashboardScreen';
import { authService, tokenService } from '../Services/api';
import { router } from '@inertiajs/react';
import { Loader2 } from 'lucide-react';

const USER_DATA_KEY = 'user_session_data';

const processUserObject = (userObj, token) => {
  if (!userObj) return null;
  const target = userObj.data || userObj;
  const rid = Number(target.role_id !== undefined ? target.role_id : target.roleId);

  let finalRole;
  if (!isNaN(rid)) {
    switch (rid) {
      case 1: finalRole = 'admin'; break;
      case 3: finalRole = 'teacher'; break;
      case 4: finalRole = 'student'; break;
      case 5: finalRole = 'support'; break;
    }
  }

  if (!finalRole && (userObj.role || target.role)) {
    const r = String(userObj.role || target.role).toLowerCase();
    if (['admin', 'teacher', 'student', 'support'].includes(r)) {
      finalRole = r;
    }
  }

  if (!finalRole) return null;
  return { user: { role: finalRole, data: target }, token };
};

export default function Dashboard() {
  const [userData, setUserData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    const initAuth = async () => {
      const token = tokenService.getToken();
      if (!token) {
        router.visit('/login');
        return;
      }

      const cached = localStorage.getItem(USER_DATA_KEY);
      let hasValidCache = false;

      if (cached) {
        try {
          const cachedData = JSON.parse(cached);
          const cachedUser = cachedData?.user?.data || cachedData?.user || cachedData?.data || cachedData;
          const processedCached = processUserObject(cachedUser, token);

          if (processedCached && isMounted) {
            setUserData(processedCached);
            setIsLoading(false);
            hasValidCache = true;
          }
        } catch (e) {}
      }

      try {
        const response = await authService.getProfile();
        if (!isMounted) return;

        const candidates = [
          response?.user?.data,
          response?.data,
          response?.user,
          response
        ];
        const isValidUser = (obj) => obj && (obj.role_id !== undefined || obj.roleId !== undefined || obj.role !== undefined);
        const finalUserObj = candidates.find(isValidUser);

        if (finalUserObj) {
          const processedData = processUserObject(finalUserObj, token);
          if (processedData && isMounted) {
            setUserData(processedData);
            localStorage.setItem(USER_DATA_KEY, JSON.stringify(processedData));
          }
        }
      } catch (error) {
        const is401 = error?.status === 401 ||
          (error?.message && (
            error.message.includes('401') ||
            error.message.includes('Unauthenticated') ||
            error.message.includes('Session expired')
          ));

        if (is401) {
          tokenService.removeToken();
          localStorage.removeItem(USER_DATA_KEY);
          router.visit('/login');
        } else if (!hasValidCache && isMounted) {
          setIsLoading(false);
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    initAuth();

    return () => {
      isMounted = false;
    };
  }, []);

  const handleLogout = () => {
    authService.logout().catch(() => {});
    localStorage.removeItem(USER_DATA_KEY);
    tokenService.removeToken();
    router.visit('/');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[var(--light-bg)] gap-4">
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
    case 'support':
      return <AdminDashboardScreen data={userData} onLogout={handleLogout} role={userData.user.role} />;
    case 'student':
      return <StudentDashboardScreen data={userData} onLogout={handleLogout} />;
    case 'teacher':
      return <TeacherDashboardScreen data={userData} onLogout={handleLogout} />;
    default:
      handleLogout();
      return null;
  }
}
