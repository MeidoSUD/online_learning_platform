
// =====================================================
// !! API SERVICE - PROD READY V44 !!
// =====================================================


const PRODUCTION_URL = `${window.location.origin}/api`;

const URL_STORAGE_KEY = 'api_base_url';

export let API_BASE_URL = localStorage.getItem(URL_STORAGE_KEY) || PRODUCTION_URL;

export const setApiUrl = (url: string) => {
  const cleanUrl = url.endsWith('/') ? url.slice(0, -1) : url;
  localStorage.setItem(URL_STORAGE_KEY, cleanUrl);
  API_BASE_URL = cleanUrl;
  window.location.reload();
};

export const resetApiUrl = () => {
  localStorage.removeItem(URL_STORAGE_KEY);
  API_BASE_URL = PRODUCTION_URL;
  window.location.reload();
};

const TOKEN_KEY = 'auth_token';
export const tokenService = {
  setToken: (token: string) => localStorage.setItem(TOKEN_KEY, token),
  getToken: () => localStorage.getItem(TOKEN_KEY),
  removeToken: () => localStorage.removeItem(TOKEN_KEY),
  isAuthenticated: () => !!localStorage.getItem(TOKEN_KEY),
};

export class ApiErrorHandler {
  private static messageMap: Record<string, string> = {
    "The provided credentials are incorrect.": "Email or password incorrect",
    "The email has already been taken.": "Email already registered",
    "The phone number has already been taken.": "Phone already registered",
    "Invalid phone number format. Must be a valid KSA phone number.": "Invalid phone format",
    "Phone number already registered.": "Phone already registered",
    "Phone number already in use by another account.": "Phone in use",
    "The new password confirmation does not match.": "Passwords don't match",
    "Unauthenticated.": "Please log in",
    "Token has expired or is invalid.": "Session expired",
    "Invalid verification code.": "Code incorrect or expired",
    "The profile photo must not be greater than 4MB.": "Image too large"
  };

  static getFriendlyMessage(message: string): string {
    return this.messageMap[message] || message;
  }

  static async handleResponse(response: Response) {
    if (response.ok) return await response.json();

    let data;
    try {
      const text = await response.text();
      data = JSON.parse(text);
    } catch (e) {
      if (response.status >= 500) {
        throw new Error("Server error. Try later.");
      }
      throw new Error("An unexpected error occurred");
    }

    if (response.status === 401) {
      window.dispatchEvent(new Event(AUTH_SESSION_EXPIRED));
      throw new Error(this.getFriendlyMessage(data.message || "Session expired"));
    }

    if (response.status === 422) {
      const error: any = new Error(this.getFriendlyMessage(data.message || "Validation failed"));
      error.status = 422;
      error.errors = data.errors;
      throw error;
    }

    throw new Error(this.getFriendlyMessage(data.message || data.error || "API Request Failed"));
  }
}

import {
  WalletResponse, StudentPaymentMethod, AuthResponse, ReferenceItem,
  TeacherSubject, TeacherSubjectDetail, BankReference, BankAccount, UserData, TeacherProfile,
  BookingPayload, PaymentPayload, Course, Session, Booking, Certificate,
  CourseCategory, CoursePayload, AvailableTime, AvailabilityPayload,
  AdminUser, AdminTeacher, AdminBooking, AdminDispute, PayoutRequest, Service,
  Ad, AdPayload, AdminService, AdminOrder, TeacherApplication, PlatformPercentage,
  RevenueAnalytics, CalculatorResults, AppConfig, AppVersion, MaintenanceMode,
  TermsConditions, TermsConditionsPayload, SessionsPackage, AdminTeacherPackageApproval
} from '../Utils/types';

export type {
  AuthResponse, UserData, TeacherProfile, TeacherSubject, TeacherSubjectDetail,
  BookingPayload, PaymentPayload, Booking, Session, Certificate,
  Course, CourseCategory, CoursePayload, AvailableTime, AvailabilityPayload,
  ReferenceItem, StudentPaymentMethod, BankReference, BankAccount, WalletResponse,
  AdminUser, AdminTeacher, AdminBooking, AdminDispute, PayoutRequest, Service,
  Ad, AdPayload, AdminService, AdminOrder, TeacherApplication, PlatformPercentage,
  RevenueAnalytics, CalculatorResults, AppConfig, AppVersion, MaintenanceMode,
  TermsConditions, TermsConditionsPayload, SessionsPackage, AdminTeacherPackageApproval
};

export const AUTH_SESSION_EXPIRED = 'auth:session-expired';

const extractArray = (response: any): any[] => {
  if (!response) return [];
  let rawData = response;

  if (response.data) {
    rawData = response.data;
    if (rawData.data && Array.isArray(rawData.data)) {
      rawData = rawData.data;
    }
  }

  if (Array.isArray(rawData)) {
    if (rawData.length > 0 && Array.isArray(rawData[0])) {
      return rawData.flat(Infinity);
    }
    return rawData;
  }

  if (response.users && Array.isArray(response.users)) return response.users;
  if (rawData && rawData.users && Array.isArray(rawData.users)) return rawData.users;
  if (rawData && rawData.teachers && Array.isArray(rawData.teachers)) return rawData.teachers;
  if (rawData && rawData.bookings && Array.isArray(rawData.bookings)) return rawData.bookings;
  if (rawData && rawData.disputes && Array.isArray(rawData.disputes)) return rawData.disputes;
  if (rawData && rawData.ads && Array.isArray(rawData.ads)) return rawData.ads;
  if (response.education_levels && Array.isArray(response.education_levels)) return response.education_levels;
  if (rawData && rawData.education_levels && Array.isArray(rawData.education_levels)) return rawData.education_levels;
  if (response.classes && Array.isArray(response.classes)) return response.classes;
  if (response.subject && Array.isArray(response.subject)) return response.subject;
  if (response.subjects && Array.isArray(response.subjects)) return response.subjects;

  return [];
};

const fetchWithAuth = async (endpoint: string, options: RequestInit = {}) => {
  const token = tokenService.getToken();

  const headers: HeadersInit = {
    'Accept': 'application/json',
    'ngrok-skip-browser-warning': 'true',
    'Bypass-Tunnel-Reminder': 'true',
    'cf-nnt': '1',
    'X-Requested-With': 'XMLHttpRequest',
    'Cache-Control': 'no-cache',
    ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
    ...options.headers,
  };

  if (!(options.body instanceof FormData)) {
    (headers as any)['Content-Type'] = 'application/json';
  }

  const fullUrl = `${API_BASE_URL}${endpoint}`;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 30000); // 30s timeout

  try {
    const response = await fetch(fullUrl, {
      ...options,
      headers,
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    // Check for HTML response (Cloudflare/Firewall)
    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('text/html')) {
      throw new Error("The API returned HTML. Cloudflare or a firewall might be blocking the request.");
    }

    return await ApiErrorHandler.handleResponse(response);
  } catch (error: any) {
    clearTimeout(timeoutId);
    if (error.name === 'AbortError') {
      throw new Error("Connection timeout. Try again.");
    }
    if (error.name === 'TypeError' && error.message === 'Failed to fetch') {
      // Check if navigator is offline
      if (!navigator.onLine) {
        throw new Error("No internet. Check connection and retry.");
      }
      throw new Error(`Network Connection Failed: ${API_BASE_URL}`);
    }
    throw error;
  }
};

export const fetchWithProgress = (endpoint: string, options: { method?: string, body: FormData, onProgress: (pct: number) => void }) => {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    const fullUrl = `${API_BASE_URL}${endpoint}`;
    const token = tokenService.getToken();

    xhr.open(options.method || 'POST', fullUrl);
    xhr.setRequestHeader('Accept', 'application/json');
    xhr.setRequestHeader('X-Requested-With', 'XMLHttpRequest');
    if (token) {
      xhr.setRequestHeader('Authorization', `Bearer ${token}`);
    }

    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable) {
        const percentComplete = (e.loaded / e.total) * 100;
        options.onProgress(Math.round(percentComplete));
      }
    };

    xhr.onload = async () => {
      if (xhr.status === 401) {
        window.dispatchEvent(new Event(AUTH_SESSION_EXPIRED));
        return reject(new Error("Session expired"));
      }

      try {
        const data = JSON.parse(xhr.responseText);
        if (xhr.status >= 200 && xhr.status < 300) {
          resolve(data);
        } else {
          reject(new Error(data.message || "Upload failed"));
        }
      } catch (e) {
        reject(new Error("Invalid server response"));
      }
    };

    xhr.onerror = () => reject(new Error("Network Error"));
    xhr.send(options.body);
  });
};

export const authService = {
  login: (credentials: any) => fetchWithAuth('/auth/login', { method: 'POST', body: JSON.stringify(credentials) }),
  register: (data: any) => fetchWithAuth('/auth/register', { method: 'POST', body: JSON.stringify(data) }),
  verifyCode: (data: { user_id: number, code: string }) => fetchWithAuth('/auth/verify', { method: 'POST', body: JSON.stringify(data) }),
  resendCode: (data: { user_id: number }) => fetchWithAuth('/auth/resend-code', { method: 'POST', body: JSON.stringify(data) }),
  getProfile: () => fetchWithAuth(`/auth/user/details?_t=${Date.now()}`),
  getUserDetails: () => fetchWithAuth('/auth/user/details'),
  logout: () => fetchWithAuth('/auth/logout', { method: 'POST' }),
  deleteAccount: () => fetchWithAuth('/auth/user', { method: 'DELETE' }),
  resetPassword: (data: { phone_number: string }) => fetchWithAuth('/auth/reset-password', { method: 'POST', body: JSON.stringify(data) }),
  verifyResetCode: (data: { user_id: number, code: string }) => fetchWithAuth('/auth/verify-reset-code', { method: 'POST', body: JSON.stringify(data) }),
  confirmPassword: (data: { password: string }) => fetchWithAuth('/auth/confirm-password', { method: 'POST', body: JSON.stringify(data) }),
  changePassword: (data: any) => fetchWithAuth('/auth/change-password', { method: 'POST', body: JSON.stringify(data) }),
};

export const profileService = {
  updateProfile: (data: FormData) => {
    data.append('_method', 'PUT');
    return fetchWithAuth('/profile/profile/update', { method: 'POST', body: data });
  },
  updateProfileFull: (data: FormData) => {
    data.append('_method', 'PUT');
    return fetchWithAuth('/profile/profile/update', { method: 'POST', body: data });
  },
};

export const teacherService = {
  saveFcmToken: (token: string) => fetchWithAuth('/teacher/save-fcm-token', { method: 'POST', body: JSON.stringify({ fcm_token: token }) }),
  getEducationLevels: () => fetchWithAuth('/teacher/education-levels').then(extractArray),
  getClassesByLevel: (levelId: number) => fetchWithAuth(`/teacher/classes/${levelId}`).then(extractArray),
  getSubjectsByClass: (classId: number) => fetchWithAuth(`/teacher/subjectsClasses/${classId}`).then(extractArray),
  getServicesList: () => fetchWithAuth('/teacher/services').then(extractArray),
  updateInfo: (data: any) => fetchWithAuth('/teacher/info', { method: 'POST', body: JSON.stringify(data) }),
  addSubjects: (subject_ids: number[]) => fetchWithAuth('/teacher/subjects', { method: 'POST', body: JSON.stringify({ subjects_id: subject_ids }) }),
  getSubjects: () => fetchWithAuth('/teacher/subjects').then(extractArray),
  deleteSubject: (id: number) => fetchWithAuth(`/teacher/subjects/${id}`, { method: 'DELETE' }),
  getAvailability: () => fetchWithAuth('/teacher/availability').then(extractArray),
  saveAvailability: (payload: AvailabilityPayload) => fetchWithAuth('/teacher/availability', { method: 'POST', body: JSON.stringify(payload) }),
  deleteAvailability: (id: number) => fetchWithAuth(`/teacher/availability/${id}`, { method: 'DELETE' }),
  getCourses: () => fetchWithAuth('/teacher/courses').then(extractArray),
  createCourse: (data: FormData) => fetchWithAuth('/teacher/courses', { method: 'POST', body: data }),
  updateCourse: (id: number, data: any) => fetchWithAuth(`/teacher/courses/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteCourse: (id: number) => fetchWithAuth(`/teacher/courses/${id}`, { method: 'DELETE' }),
  getTeacherSessions: () => fetchWithAuth('/teacher/sessions').then(extractArray),
  startSession: (id: number) => fetchWithAuth(`/teacher/sessions/${id}/start`, { method: 'POST' }),
  endSession: (id: number) => fetchWithAuth(`/teacher/sessions/${id}/end`, { method: 'POST' }),
  getWallet: () => fetchWithAuth('/teacher/wallet').then(res => res.data || res),
  getBankAccounts: () => fetchWithAuth('/teacher/payment-methods').then(extractArray),
  withdraw: (data: { amount: number, payment_method_id?: number }) => fetchWithAuth('/teacher/wallet/withdraw', { method: 'POST', body: JSON.stringify(data) }),
  cancelWithdrawal: (id: number) => fetchWithAuth(`/teacher/wallet/withdrawals/${id}`, { method: 'DELETE' }),
  addPaymentMethod: (data: any) => fetchWithAuth('/teacher/payment-methods', { method: 'POST', body: JSON.stringify(data) }),
  deletePaymentMethod: (id: number) => fetchWithAuth(`/teacher/payment-methods/${id}`, { method: 'DELETE' }),
  setDefaultPaymentMethod: (id: number) => fetchWithAuth(`/teacher/payment-methods/set-default/${id}`, { method: 'PUT' }),
};

export const studentService = {
  saveFcmToken: (token: string) => fetchWithAuth('/student/save-fcm-token', { method: 'POST', body: JSON.stringify({ fcm_token: token }) }),
  getServices: () => fetchWithAuth('/student/services').then(extractArray),
  getSubjects: () => fetchWithAuth('/student/subjects').then(extractArray),
  getEducationLevels: () => fetchWithAuth('/education-levels').then(extractArray),
  getClasses: (levelId: number) => fetchWithAuth(`/classes?education_level_id=${levelId}`).then(extractArray),
  getReferenceSubjects: (classId: number) => fetchWithAuth(`/subjects?class_id=${classId}`).then(extractArray),
  getTeachers: (filters: any = {}) => {
    const query = new URLSearchParams(filters).toString();
    return fetchWithAuth(`/student/teachers?${query}`).then(extractArray);
  },
  getCourses: (filters: any = {}) => {
    const query = new URLSearchParams(filters).toString();
    return fetchWithAuth(`/student/courses?${query}`).then(extractArray);
  },
  createBooking: (data: BookingPayload) => fetchWithAuth('/student/booking', { method: 'POST', body: JSON.stringify(data) }),
  getBookings: () => fetchWithAuth('/student/booking').then(extractArray),
  processPayment: (data: any) => fetchWithAuth('/student/booking/pay', { method: 'POST', body: JSON.stringify(data) }),
  getSessions: () => fetchWithAuth('/student/sessions').then(extractArray),
  joinSession: (id: number) => fetchWithAuth(`/student/sessions/${id}/join`, { method: 'POST' }),
  getSessionDetails: (id: number) => fetchWithAuth(`/student/sessions/${id}`),
  getPaymentMethods: () => fetchWithAuth('/student/payment-methods').then(extractArray),
  addPaymentMethod: (data: any) => fetchWithAuth('/student/payment-methods', { method: 'POST', body: JSON.stringify(data) }),
  deletePaymentMethod: (id: number) => fetchWithAuth(`/student/payment-methods/${id}`, { method: 'DELETE' }),
  getCertificates: () => fetchWithAuth('/student/certificates').then(extractArray),
  downloadInvoice: (id: number) => {
    const token = tokenService.getToken();
    const url = `${API_BASE_URL}/student/booking/${id}/invoice?token=${token}`;
    window.open(url, '_blank');
  },
  downloadCertificate: (id: number) => {
    const token = tokenService.getToken();
    const url = `${API_BASE_URL}/student/certificates/${id}/download?token=${token}`;
    window.open(url, '_blank');
  },
};

export const adminService = {
  getDashboardData: () => fetchWithAuth('/admin/dashboard'),
  getStats: () => fetchWithAuth('/admin/stats'),
  getUsers: (filters: any = {}) => {
    const query = new URLSearchParams(filters).toString();
    return fetchWithAuth(`/admin/users${query ? `?${query}` : ''}`).then(extractArray);
  },
  createUser: (data: any) => fetchWithAuth('/admin/users', { method: 'POST', body: JSON.stringify(data) }),
  updateUser: (id: number, data: any) => fetchWithAuth(`/admin/users/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteUser: (id: number) => fetchWithAuth(`/admin/users/${id}`, { method: 'DELETE' }),
  suspendUser: (id: number) => fetchWithAuth(`/admin/users/${id}/suspend`, { method: 'PUT' }),
  activateUser: (id: number) => fetchWithAuth(`/admin/users/${id}/activate`, { method: 'PUT' }),
  resetUserPassword: (id: number, data: { new_password?: string }) => fetchWithAuth(`/admin/users/${id}/reset-password`, { method: 'PUT', body: JSON.stringify(data) }),
  verifyUser: (id: number, verified: boolean) => fetchWithAuth(`/admin/users/${id}/verify-teacher`, { method: 'PUT', body: JSON.stringify({ verified }) }),
  getTeachers: () => fetchWithAuth('/admin/teachers').then(extractArray),
  getTeacherDetails: (id: number) => fetchWithAuth(`/admin/teachers/${id}`),
  rejectUser: (id: number) => fetchWithAuth(`/admin/users/${id}/reject-teacher`, { method: 'PUT' }),
  getBookings: () => fetchWithAuth('/admin/bookings').then(extractArray),
  getDisputes: () => fetchWithAuth('/admin/disputes').then(extractArray),
  getPayouts: () => fetchWithAuth('/admin/payout-requests').then(extractArray),
  approvePayout: (id: number, receipt: File) => {
    const formData = new FormData();
    formData.append('receipt', receipt);
    return fetchWithAuth(`/admin/payout-requests/${id}/approve`, { method: 'POST', body: formData });
  },
  rejectPayout: (id: number, reason: string) => fetchWithAuth(`/admin/payout-requests/${id}/reject`, { method: 'POST', body: JSON.stringify({ reject_reason: reason }) }),
  getServices: () => fetchWithAuth('/services').then(extractArray),

  // Course Management
  getCourses: (filters: any = {}) => {
    const query = new URLSearchParams(filters).toString();
    return fetchWithAuth(`/admin/courses${query ? `?${query}` : ''}`).then(extractArray);
  },
  getCourseDetails: (id: number) => fetchWithAuth(`/admin/courses/${id}`),
  approveCourse: (id: number) => fetchWithAuth(`/admin/courses/${id}/approve`, { method: 'PUT' }),
  rejectCourse: (id: number, reason: string) => fetchWithAuth(`/admin/courses/${id}/reject`, { method: 'PUT', body: JSON.stringify({ rejection_reason: reason }) }),
  updateCourseStatus: (id: number, status: 'published' | 'draft') => {
    return fetchWithAuth(`/admin/courses/${id}/status`, {
      method: 'PUT',
      body: JSON.stringify({ status }),
    });
  },
  deleteCourse: (id: number) => fetchWithAuth(`/admin/courses/${id}`, { method: 'DELETE' }),
  getPendingCourses: () => fetchWithAuth('/admin/courses/pending-approval').then(extractArray),
  featureCourse: (id: number, isFeatured: boolean) => fetchWithAuth(`/admin/courses/${id}/feature`, { method: 'PUT', body: JSON.stringify({ is_featured: isFeatured }) }),

  // Education Levels
  getEducationLevels: (filters: any = {}) => {
    const query = new URLSearchParams(filters).toString();
    return fetchWithAuth(`/admin/education-levels${query ? `?${query}` : ''}`).then(extractArray);
  },
  createEducationLevel: (data: any) => fetchWithAuth('/admin/education-levels', { method: 'POST', body: JSON.stringify(data) }),
  getEducationLevelDetails: (id: number) => fetchWithAuth(`/admin/education-levels/${id}`),
  updateEducationLevel: (id: number, data: any) => fetchWithAuth(`/admin/education-levels/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteEducationLevel: (id: number, force = false) => fetchWithAuth(`/admin/education-levels/${id}${force ? '/force' : ''}`, { method: 'DELETE' }),
  restoreEducationLevel: (id: number) => fetchWithAuth(`/admin/education-levels/${id}/restore`, { method: 'POST' }),

  // Classes
  getClasses: (filters: any = {}) => {
    const query = new URLSearchParams(filters).toString();
    return fetchWithAuth(`/admin/classes${query ? `?${query}` : ''}`).then(extractArray);
  },
  createClass: (data: any) => fetchWithAuth('/admin/classes', { method: 'POST', body: JSON.stringify(data) }),
  getClassDetails: (id: number) => fetchWithAuth(`/admin/classes/${id}`),
  updateClass: (id: number, data: any) => fetchWithAuth(`/admin/classes/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteClass: (id: number, force = false) => fetchWithAuth(`/admin/classes/${id}${force ? '/force' : ''}`, { method: 'DELETE' }),
  restoreClass: (id: number) => fetchWithAuth(`/admin/classes/${id}/restore`, { method: 'POST' }),

  // Subjects
  getSubjects: (filters: any = {}) => {
    const query = new URLSearchParams(filters).toString();
    return fetchWithAuth(`/admin/subjects${query ? `?${query}` : ''}`).then(extractArray);
  },
  createSubject: (data: any) => fetchWithAuth('/admin/subjects', { method: 'POST', body: JSON.stringify(data) }),
  getSubjectDetails: (id: number) => fetchWithAuth(`/admin/subjects/${id}`),
  updateSubject: (id: number, data: any) => fetchWithAuth(`/admin/subjects/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteSubject: (id: number, force = false) => fetchWithAuth(`/admin/subjects/${id}${force ? '/force' : ''}`, { method: 'DELETE' }),
  restoreSubject: (id: number) => fetchWithAuth(`/admin/subjects/${id}/restore`, { method: 'POST' }),

  // Ads Management
  getAds: (filters: any = {}) => {
    const query = new URLSearchParams(filters).toString();
    return fetchWithAuth(`/admin/ads${query ? `?${query}` : ''}`).then(res => res.data?.ads || res.ads || []);
  },
  createAd: (data: FormData) => fetchWithAuth('/admin/ads', { method: 'POST', body: data }),
  updateAd: (id: number, data: FormData) => fetchWithAuth(`/admin/ads/${id}`, { method: 'POST', body: data }),
  toggleAd: (id: number) => fetchWithAuth(`/admin/ads/${id}/toggle`, { method: 'PUT' }),
  deleteAd: (id: number) => fetchWithAuth(`/admin/ads/${id}`, { method: 'DELETE' }),

  // Settings Management
  getSettings: () => fetchWithAuth('/admin/settings'),
  getSettingsByGroup: (group: string) => fetchWithAuth(`/admin/settings/${group}`),
  updateSetting: (id: number, data: any) => fetchWithAuth(`/admin/settings/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  createSetting: (data: any) => fetchWithAuth('/admin/settings', { method: 'POST', body: JSON.stringify(data) }),
  bulkUpdateSettings: (settings: { id: number; value: string }[]) => 
    fetchWithAuth('/admin/settings/bulk', { method: 'PUT', body: JSON.stringify({ settings }) }),

  // Services Management
  getAdminServices: (filters: any = {}) => {
    const query = new URLSearchParams(filters).toString();
    return fetchWithAuth(`/admin/services${query ? `?${query}` : ''}`).then(extractArray);
  },
  createService: (data: any) => fetchWithAuth('/admin/services', { 
    method: 'POST', 
    body: data instanceof FormData ? data : JSON.stringify(data) 
  }),
  updateService: (id: number, data: any) => {
    if (data instanceof FormData) {
      data.append('_method', 'PUT');
      return fetchWithAuth(`/admin/services/${id}`, { method: 'POST', body: data });
    }
    return fetchWithAuth(`/admin/services/${id}`, { 
      method: 'PUT', 
      body: JSON.stringify(data) 
    });
  },
  deleteService: (id: number) => fetchWithAuth(`/admin/services/${id}`, { method: 'DELETE' }),

  // Order Management
  getOrders: (filters: any = {}) => {
    const query = new URLSearchParams(filters).toString();
    return fetchWithAuth(`/admin/orders${query ? `?${query}` : ''}`).then(extractArray);
  },
  getOrderApplications: (orderId: number) => fetchWithAuth(`/admin/orders/${orderId}/applications`),
  assignTeacher: (orderId: number, data: { teacher_id: number; reason?: string }) => 
    fetchWithAuth(`/admin/orders/${orderId}/assign`, { method: 'POST', body: JSON.stringify(data) }),
  updateOrderStatus: (orderId: number, data: { status: string; notes?: string }) => 
    fetchWithAuth(`/admin/orders/${orderId}/status`, { method: 'PUT', body: JSON.stringify(data) }),

  // Revenue & Percentage
  getActivePercentage: () => fetchWithAuth('/admin/revenue/percentage'),
  getPercentageHistory: (filters: any = {}) => {
    const query = new URLSearchParams(filters).toString();
    return fetchWithAuth(`/admin/revenue/history${query ? `?${query}` : ''}`).then(extractArray);
  },
  updatePercentage: (data: { value: number; effective_date: string; description?: string }) => 
    fetchWithAuth('/admin/revenue/percentage', { method: 'POST', body: JSON.stringify(data) }),
  getRevenueAnalytics: (filters: any = {}) => {
    const query = new URLSearchParams(filters).toString();
    return fetchWithAuth(`/admin/revenue/analytics${query ? `?${query}` : ''}`);
  },
  getRevenueCalculator: (teacherRate: number, date?: string) => {
    const params = new URLSearchParams({ teacher_rate: String(teacherRate) });
    if (date) params.append('date', date);
    return fetchWithAuth(`/admin/revenue/calculate?${params.toString()}`);
  },

  // App Config Management
  getAppConfig: () => fetchWithAuth('/admin/app-config/settings'),
  updateAppVersion: (data: { platform: 'ios' | 'android'; version: string; force_update: boolean; release_notes?: string }) => 
    fetchWithAuth('/admin/app-config/version', { method: 'PUT', body: JSON.stringify(data) }),
  toggleMaintenanceMode: (data: { enabled: boolean; message?: string; estimated_end_time?: string }) => 
    fetchWithAuth('/admin/app-config/maintenance', { method: 'PUT', body: JSON.stringify(data) }),
    
  // Sessions Management
  getSessions: (filters: any = {}) => {
    const query = new URLSearchParams(filters).toString();
    return fetchWithAuth(`/admin/sessions${query ? `?${query}` : ''}`).then(extractArray);
  },
  updateSessionDate: (id: number, data: { session_date: string; start_time?: string; end_time?: string }) => 
    fetchWithAuth(`/admin/sessions/${id}/reschedule`, { method: 'PUT', body: JSON.stringify(data) }),
  getUserSessions: (userId: number, role: 'teacher' | 'student') => 
    fetchWithAuth(`/admin/users/${userId}/sessions?role=${role}`).then(extractArray),

  // Terms & Conditions
  getTermsConditions: (filters: { status?: string; type?: string; include_deleted?: string } = {}) => {
    const query = new URLSearchParams(filters as any).toString();
    return fetchWithAuth(`/admin/terms-conditions${query ? `?${query}` : ''}`);
  },
  getTermsConditionById: (id: number) => fetchWithAuth(`/admin/terms-conditions/${id}`),
  createTermsCondition: (data: TermsConditionsPayload) =>
    fetchWithAuth('/admin/terms-conditions', { method: 'POST', body: JSON.stringify(data) }),
  updateTermsCondition: (id: number, data: Partial<TermsConditionsPayload>) =>
    fetchWithAuth(`/admin/terms-conditions/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteTermsCondition: (id: number) =>
    fetchWithAuth(`/admin/terms-conditions/${id}`, { method: 'DELETE' }),
  restoreTermsCondition: (id: number) =>
    fetchWithAuth(`/admin/terms-conditions/${id}/restore`, { method: 'POST' }),
  getLatestTermsByType: (type: string) =>
    fetchWithAuth(`/admin/terms-conditions/type/${type}`),
  getPackages: () => fetchWithAuth('/admin/packages').then(extractArray),
  createPackage: (data: any) => fetchWithAuth('/admin/packages', { method: 'POST', body: JSON.stringify(data) }),
  getPackageDetails: (id: number) => fetchWithAuth(`/admin/packages/${id}`),
  updatePackage: (id: number, data: any) => fetchWithAuth(`/admin/packages/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deletePackage: (id: number) => fetchWithAuth(`/admin/packages/${id}`, { method: 'DELETE' }),
  togglePackageActive: (id: number) => fetchWithAuth(`/admin/packages/${id}/toggle`, { method: 'PUT' }),
  getPendingTeacherPackages: () => fetchWithAuth('/admin/teachers/pending-packages').then(extractArray),
  getApprovedTeacherPackages: () => fetchWithAuth('/admin/teachers/approved-packages').then(extractArray),
  approveTeacherPackages: (teacherId: number) => fetchWithAuth(`/admin/teachers/${teacherId}/approve-packages`, { method: 'PUT' }),
  revokeTeacherPackages: (teacherId: number) => fetchWithAuth(`/admin/teachers/${teacherId}/revoke-packages`, { method: 'PUT' }),
};

export const adsService = {
  getAds: (platform: 'web' | 'app' | 'both' = 'web') => fetchWithAuth(`/ads?platform=${platform}`).then(res => res.data.ads || []),
};

export const settingsService = {
  // Get all settings
  getAll: () => fetchWithAuth('/settings'),
  
  // Get settings by group (e.g., 'app', 'contact')
  getByGroup: (group: string) => fetchWithAuth(`/settings/${group}`),
  
  // Update a single setting
  update: (id: number, data: { key: string; value: string; type?: string; group?: string; description?: string }) => 
    fetchWithAuth(`/settings/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  
  // Create a new setting
  create: (data: { key: string; value: string; type: string; group: string; description?: string }) => 
    fetchWithAuth('/settings', { method: 'POST', body: JSON.stringify(data) }),
  
  // Bulk update settings
  bulkUpdate: (settings: { id: number; value: string }[]) => 
    fetchWithAuth('/settings/bulk', { method: 'PUT', body: JSON.stringify({ settings }) }),
};

export const referenceService = {
  getServices: () => fetchWithAuth('/services').then(extractArray),
  getCategories: () => fetchWithAuth('/categories').then(extractArray),
  getBanks: () => fetchWithAuth('/banks').then(extractArray),
};

export const getStorageUrl = (path: string | null | undefined) => {
  if (!path) return '';
  if (path.startsWith('http')) return path;
  const baseUrl = API_BASE_URL.replace(/\/api\/?$/, '');
  return `${baseUrl}/storage/${path.replace(/^\//, '')}`;
};
