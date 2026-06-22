
export type Language = 'en' | 'ar';
export type Direction = 'ltr' | 'rtl';

export interface Translations {
  [key: string]: any;
}

export interface ThemeColors {
  primary: string;
  secondary: string;
  background: string;
  surface: string;
  text: string;
}

// --- Services ---
export interface Service {
  id: number;
  key_name?: string;
  name_en: string;
  name_ar: string;
  description_en?: string;
  description_ar?: string;
  image?: string;
  active?: number | boolean;
}

// --- Schedules ---
export interface ScheduleItem {
  id: string;
  time: string;
  type: 'online' | 'presence';
  subject: string;
  level: string;
  studentsCount: number;
  maxStudents: number;
  price: number;
  isAvailable: boolean;
}

// --- Wallet & Finance ---
export interface BankReference {
  id: number;
  name_en: string;
  name_ar: string;
}

export interface BankAccount {
  id: number;
  user_id?: number;
  bank_id?: number | null;
  account_number: string;
  account_holder_name: string;
  iban: string;
  swift_code?: string;
  is_default: number | boolean;
  bank_name?: string; // From API spec
  banks?: {
    id: number;
    name_en: string;
    name_ar: string;
  } | null;
}

export interface StudentPaymentMethod {
  id: number;
  user_id: number;
  payment_method_id: number;
  card_number: string | null;
  card_holder_name: string | null;
  card_cvc?: string | null;
  card_expiry_month: number | string | null;
  card_expiry_year: number | string | null;
  card_brand?: string | null;
  is_default: number | boolean;
  payment_method?: {
    id: number;
    name_en: string;
    name_ar: string;
  };
}

export interface Withdrawal {
  id: number;
  amount: string;
  status: string;
  requested_at?: string;
  created_at?: string;
  payment_method_id: number;
  payment_method?: BankAccount;
}

export interface WalletResponse {
  balance: number;
  currency?: string;
  payouts?: {
    data: Withdrawal[];
    current_page?: number;
    total?: number;
  };
  withdrawals?: { // Legacy fallback
    data: Withdrawal[];
  };
  bank_accounts?: BankAccount[]; // Optional in response
}

// --- User & Auth ---

export interface UserServiceProfile {
  id: number;
  teacher_id?: number;
  service_id: number;
  key_name?: string;
  name_en?: string;
  name_ar?: string;
  verified: boolean | number | string;
  status?: number;
}

export interface TeacherSubjectDetail {
  id: number;
  teacher_id: number;
  subject_id: number;
  title: string;
  class_level_title: string;
  class_title: string;
  class_id?: number;
  class_level_id?: number;

  // Legacy/Optional
  name_en?: string;
  name_ar?: string;
  education_level_id?: number;
}

export interface TeacherProfileNested {
  is_active: number;
  profile_photo: string | null;
  certificate: string | null;
  bio: string | null;
  rating: number;
  total_students: number;
  verified: boolean | number | string;
  service: number | null;
  services: UserServiceProfile[];
  teacher_subjects: TeacherSubjectDetail[]; // Strongly typed
  courses: any[];
  languages: any[];
  available_times: any[];
  current_balance?: number;
  certificate_attachment?: any;
  earnings?: any;
  currentLessons?: number;

  // Preferences inside profile
  teach_individual?: boolean | number;
  individual_hour_price?: number;
  teach_group?: boolean | number;
  group_hour_price?: number;
  max_group_size?: number;
  teacher_type?: 'individual' | 'institute' | null;
}

export interface UserData {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  phone_number: string;
  nationality?: string;
  gender?: string;
  role_id: number;

  // Legacy/Root fields
  profile_image?: string | null;
  bio?: string | null;
  rating?: number;
  verified?: boolean | number | string;
  current_balance?: number;

  profile?: TeacherProfileNested | null;
  teacher_type?: 'individual' | 'institute' | null;
}

export interface AuthResponse {
  user: {
    role: string;
    data: UserData;
  };
  token: string;
  message?: string;
  errors?: any;
}

// --- General ---
export interface ReferenceItem {
  id: number;
  name: string;
  name_en?: string;
  name_ar?: string;
}

export interface TeacherSubject {
  id: number;
  name_en?: string;
  name_ar?: string;
  education_level_id: number;
  class_id: number;
  title?: string; // Fallback
}


export interface TimeSlot {
  id: number;
  time: string;
  session?: any | null;
}

export interface AvailableTime {
  id?: number;
  day: number | string;
  times?: (string | { id: number; time: string })[];
  time_slots?: TimeSlot[];
}

export interface AvailabilityPayload {
  available_times: {
    day: number;
    times: string[];
  }[];
  teacher_id: number;
  course_id?: number;
  order_id?: number;
  repeat_type?: string;
}

export interface TeacherProfile extends UserData {
  profile_image: string | null;
  bio: string | null;
  rating: number;
  individual_hour_price: number;
  teacher_subjects: TeacherSubjectDetail[];
  available_times: AvailableTime[];
}

export interface Booking {
  id: number;
  reference?: string;
  teacher_name?: string;
  subject?: string | { id: number; name_en: string; name_ar: string;[key: string]: any } | null;
  date?: string;
  time?: string;

  status: 'confirmed' | 'pending' | 'completed' | 'cancelled' | 'pending_payment';
  type: 'single' | 'package' | 'online' | 'presence';
  price?: number;
  total_price?: string;
  payment_status?: string;
  created_at?: string;
  teacher?: {
    first_name: string;
    last_name: string;
  };
  teacher_subject?: {
    name_en: string;
    name_ar: string;
  };
  pricing?: {
    total_amount: string;
    currency: string;
  };
}

export interface Session {
  id: number;
  booking_id: number;
  session_number: number;
  session_date: string;
  start_time: string;
  end_time: string;
  duration: number;
  status: string;
  teacher: {
    id: number;
    name: string;
    email: string;
  };
  student?: {
    id: number;
    name: string;
    email: string;
  };
  subject: {
    id: number;
    name_en: string;
    name_ar: string;
  };
  meeting: {
    meeting_id?: string | null;
    join_url?: string | null;
    host_url?: string | null;
  };
  booking?: {
    id: number;
    reference: string;
    type: string;
  };
}

export interface Certificate {
  id: number;
  course_name: string;
  student_name: string;
  issue_date: string;
  file_url?: string;
  grade?: string;
}

export interface Dispute {
  id: string;
  caseNumber: string;
  teacherName: string;
  date: string;
  status: 'open' | 'resolved' | 'closed';
  reason: string;
  description: string;
}

export interface BookingPayload {
  teacher_id: number;
  service_id: number;
  subject_id: number;
  timeslot_id: number;
  type: 'single';
}

export interface PaymentPayload {
  booking_id: number;
  card_number: string;
  card_holder: string;
  expiry_month: number;
  expiry_year: number;
  cvv: string;
  payment_brand: 'VISA' | 'MASTERCARD' | 'MADA';
}

// --- Courses ---
export interface TeacherBasic {
  id: number;
  first_name: string;
  last_name: string;
  gender?: string;
  nationality?: string;
  profile?: any;
}

export interface CourseCategory {
  id: number;
  name_en: string;
  name_ar: string;
  description_en?: string;
  description_ar?: string;
}

export interface Course {
  id: number;
  teacher_id: number;
  service_id?: number;
  subject_id?: number;
  category_id: number;
  name: string;
  description: string;
  course_type: string;
  price: string;
  available_seats?: number | null;
  duration_hours?: number;
  status: string;
  created_at: string;
  teacher_basic?: TeacherBasic;
  teacher?: TeacherBasic;
  category?: CourseCategory;
  cover_image?: string | null;
  slots?: { day: string; time: string }[];
}

export interface CoursePayload {
  name: string;
  description: string;
  price: number;
  course_type: 'single' | 'package' | 'subscription';
  duration_hours: number;
  category_id: number;
  available_slots: { day: number; times: string[] }[];
  cover_image?: File | null;
}

// --- Admin Types ---

export interface AdminUser {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  phone_number: string;
  gender?: string;
  nationality?: string;
  role_id: number;
  verified: number | boolean | string;
  is_active: number | boolean;
  created_at: string;
  profile?: {
    certificate?: string | null;
  };
}

export interface AdminTeacher {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  phone_number: string;
  gender?: string;
  role_id: number;
  is_active: number | boolean;
  verified: boolean;
  profile_photo?: string | null;
  certificate?: string | null;
  service_id?: number | null;
  services?: Service[];
}

export interface AdminBooking {
  id: number;
  reference: string;
  student_name: string;
  teacher_name: string;
  subject_name: string;
  amount: string;
  status: string;
  created_at: string;
}

export interface AdminDispute {
  id: number;
  booking_reference: string;
  raised_by: string;
  against: string;
  reason: string;
  description: string;
  status: string;
  created_at: string;
}

export interface PayoutRequest {
  id: number;
  user?: {
    id: number;
    name: string;
    email: string;
  };
  teacher?: {
    id: number;
    name: string;
    email: string;
  };
  amount: string;
  bank_details: string;
  status: string;
  created_at: string;
  receipt?: string;
  reject_reason?: string;
  requested_at?: string;
  payment_method?: {
    account_holder_name?: string;
    account_number?: string;
    bank_name?: string;
  };
}
export interface Ad {
  id: number;
  image_url: string;
  image_path?: string;
  description: string | null;
  link_url: string | null;
  cta_text: string | null;
  platform: 'web' | 'app' | 'both';
  role_id?: number | null;
  role_name?: string | null;
  is_active?: boolean | number;
  display_order?: number;
  created_at?: string;
  updated_at?: string;
}

export interface AdPayload {
  image?: File | null;
  description?: string;
  role_id?: number | null;
  platform: 'web' | 'app' | 'both';
  link_url?: string;
  cta_text?: string;
  display_order?: number;
  is_active?: boolean | number;
}

// --- Admin Dashboard ---

export interface DashboardRecentActivity {
  id: number;
  type: string;
  user_name?: string;
  student_name?: string;
  teacher_name?: string;
  user_role: string;
  status: string;
  amount: number | string;
  created_at: string;
}

export interface AdminDashboardData {
  summary: {
    total_users: number;
    total_teachers: number;
    active_teachers: number;
    unverified_teachers: number;
    total_students: number;
    inactive_users: number;
    total_bookings: number;
    total_revenue: number;
    teachers_wallet_total: number;
  };
  bookings: {
    total: number;
    confirmed: number;
    pending_payment: number;
    cancelled: number;
    by_status: Record<string, number>;
  };
  payments: {
    total: number;
    successful: number;
    total_amount: number;
    by_status: Record<string, number>;
  };
  users_by_role: {
    admin: number;
    teacher: number;
    student: number;
  };
  monthly_metrics: {
    new_users_this_month: number;
    new_bookings_this_month: number;
  };
  recent_activity: DashboardRecentActivity[];
  wallet_info: {
    total_teachers_wallet: number;
    average_per_teacher: number;
  };
}

export interface AdminService extends Service {
  key_name: string;
  name_en: string;
  name_ar: string;
  description_en: string;
  description_ar: string;
  status: string | number;
  role_id: string | number;
  created_at: string;
  updated_at: string;
}

export interface AdminOrder {
  id: number;
  student: {
    id: number;
    first_name: string;
    last_name: string;
    email: string;
    phone_number: string;
  };
  subject: {
    id: number;
    name_en: string;
    name_ar: string;
  };
  assigned_teacher?: {
    id: number;
    first_name: string;
    last_name: string;
    rating: string;
    experience_years: string;
  };
  status: string;
  min_price: string;
  max_price: string;
  notes: string;
  application_count: number;
  created_at: string;
  updated_at: string;
}

export interface TeacherApplication {
  id: number;
  teacher: {
    id: number;
    first_name: string;
    last_name: string;
    email: string;
    phone_number: string;
    rating: string;
    experience_years: string;
    verified: boolean;
    profile_photo: string;
  };
  applied_at: string;
  status: string;
  is_preferred: boolean;
}

export interface PlatformPercentage {
  id: number;
  value: string;
  effective_date: string;
  is_active: boolean;
  description: string;
  created_at: string;
  updated_at: string;
}

export interface RevenueAnalytics {
  total_bookings: number;
  total_student_spent: number;
  total_teacher_earned: number;
  total_platform_revenue: number;
  average_percentage: number;
  bookings_by_period: {
    period: string;
    bookings: number;
    student_spent: number;
    teacher_earned: number;
    platform_revenue: number;
  }[];
}

export interface CalculatorResults {
  teacher_rate: number;
  platform_percentage: number;
  student_price: number;
  platform_revenue: number;
  effective_date: string;
}

// --- App Config Management ---
export interface AppVersion {
  id?: number;
  platform: 'ios' | 'android';
  version: string;
  force_update: boolean;
  release_notes?: string;
  created_at?: string;
  updated_at?: string;
}

export interface MaintenanceMode {
  id?: number;
  enabled: boolean;
  message?: string;
  estimated_end_time?: string;
  created_at?: string;
  updated_at?: string;
}

export interface AppConfig {
  ios_version: AppVersion;
  android_version: AppVersion;
  maintenance_mode: MaintenanceMode;
}

// --- Terms & Conditions ---

export interface TermsConditions {
  id: number;
  title_en: string;
  title_ar: string;
  content_en: string;
  content_ar: string;
  type: 'terms' | 'conditions' | 'privacy_policy';
  version: number;
  status: boolean;
  role_id?: number | null;
  is_deleted?: boolean;
  created_at?: string;
  updated_at?: string;
  deleted_at?: string | null;
}

export interface TermsConditionsPayload {
  title_en: string;
  title_ar: string;
  content_en: string;
  content_ar: string;
  type: 'terms' | 'conditions' | 'privacy_policy';
  status?: boolean;
  role_id?: number | null;
  version?: number;
}

export interface SessionsPackage {
  id: number;
  name: string;
  description: string | null;
  sessions_count: number;
  total_price: number;
  price_per_session: number;
  is_active: boolean;
  created_by?: string;
  created_at?: string;
  updated_at?: string;
  total_subscriptions?: number;
}

export interface AdminTeacherPackageApproval {
  id: number;
  name: string;
  email: string;
  offer_packages: boolean;
  packages_approved: boolean;
}

