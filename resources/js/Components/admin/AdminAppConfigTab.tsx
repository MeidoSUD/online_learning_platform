import React, { useState, useEffect } from 'react';
import { useLanguage } from '../../Contexts/LanguageContext';
import { adminService, AppConfig, AppVersion } from '../../Services/api';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { AlertCircle, CheckCircle, Save, Loader2, AlertTriangle, Share2, Eye, EyeOff } from 'lucide-react';

export const AdminAppConfigTab: React.FC = () => {
  const { t, language } = useLanguage();
  const [appConfig, setAppConfig] = useState<AppConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Social Login
  const [socialLoginEnabled, setSocialLoginEnabled] = useState(true);

  // iOS Version Form
  const [iosVersion, setIosVersion] = useState('');
  const [iosForceUpdate, setIosForceUpdate] = useState(false);
  const [iosReleaseNotes, setIosReleaseNotes] = useState('');

  // Android Version Form
  const [androidVersion, setAndroidVersion] = useState('');
  const [androidForceUpdate, setAndroidForceUpdate] = useState(false);
  const [androidReleaseNotes, setAndroidReleaseNotes] = useState('');

  // Maintenance Mode Form
  const [maintenanceEnabled, setMaintenanceEnabled] = useState(false);
  const [maintenanceMessage, setMaintenanceMessage] = useState('');
  const [estimatedEndTime, setEstimatedEndTime] = useState('');

  useEffect(() => {
    fetchAppConfig();
  }, []);

  const fetchAppConfig = async () => {
    setLoading(true);
    setError('');
    try {
      const configRes = await adminService.getAppConfig();
      const config = configRes?.data || configRes;
      setAppConfig(config);

      // Set initial form values
      if (config.social_login_enabled !== undefined) {
        setSocialLoginEnabled(Boolean(config.social_login_enabled));
      } else if (config.enable_social_login !== undefined) {
        setSocialLoginEnabled(Boolean(config.enable_social_login));
      }

      if (config.ios_version) {
        setIosVersion(config.ios_version.version);
        setIosForceUpdate(config.ios_version.force_update);
        setIosReleaseNotes(config.ios_version.release_notes || '');
      }
      if (config.android_version) {
        setAndroidVersion(config.android_version.version);
        setAndroidForceUpdate(config.android_version.force_update);
        setAndroidReleaseNotes(config.android_version.release_notes || '');
      }
      if (config.maintenance_mode) {
        setMaintenanceEnabled(config.maintenance_mode.enabled);
        setMaintenanceMessage(config.maintenance_mode.message || '');
        setEstimatedEndTime(config.maintenance_mode.estimated_end_time || '');
      }
    } catch (err) {
      console.error('Failed to load app config:', err);
      setError(language === 'ar' ? 'فشل تحميل إعدادات التطبيق' : 'Failed to load app config');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleSocialLogin = async () => {
    setUpdating(true);
    setError('');
    setSuccess('');
    try {
      const nextState = !socialLoginEnabled;
      await adminService.toggleSocialLogin({
        enabled: nextState,
      });
      setSocialLoginEnabled(nextState);
      setSuccess(
        language === 'ar'
          ? `تم ${nextState ? 'تفعيل وإظهار' : 'تعطيل وإخفاء'} تسجيل الدخول عبر Google و Apple بنجاح`
          : `Google & Apple social login ${nextState ? 'enabled and visible' : 'disabled and hidden'} successfully`
      );
      await fetchAppConfig();
    } catch (err: any) {
      console.error('Failed to toggle social login:', err);
      setError(language === 'ar' ? 'فشل تعديل حالة تسجيل الدخول عبر وسائل التواصل' : 'Failed to update social login setting');
    } finally {
      setUpdating(false);
    }
  };

  const handleUpdateIOSVersion = async () => {
    if (!iosVersion.trim()) {
      setError(language === 'ar' ? 'يرجى إدخال رقم الإصدار' : 'Please enter a version number');
      return;
    }

    setUpdating(true);
    setError('');
    setSuccess('');
    try {
      await adminService.updateAppVersion({
        platform: 'ios',
        version: iosVersion.trim(),
        force_update: iosForceUpdate,
        release_notes: iosReleaseNotes.trim() || undefined,
      });
      setSuccess(language === 'ar' ? 'تم تحديث إصدار iOS بنجاح' : 'iOS version updated successfully');
      await fetchAppConfig();
    } catch (err) {
      console.error('Failed to update iOS version:', err);
      setError(language === 'ar' ? 'فشل تحديث إصدار iOS' : 'Failed to update iOS version');
    } finally {
      setUpdating(false);
    }
  };

  const handleUpdateAndroidVersion = async () => {
    if (!androidVersion.trim()) {
      setError(language === 'ar' ? 'يرجى إدخال رقم الإصدار' : 'Please enter a version number');
      return;
    }

    setUpdating(true);
    setError('');
    setSuccess('');
    try {
      await adminService.updateAppVersion({
        platform: 'android',
        version: androidVersion.trim(),
        force_update: androidForceUpdate,
        release_notes: androidReleaseNotes.trim() || undefined,
      });
      setSuccess(language === 'ar' ? 'تم تحديث إصدار Android بنجاح' : 'Android version updated successfully');
      await fetchAppConfig();
    } catch (err) {
      console.error('Failed to update Android version:', err);
      setError(language === 'ar' ? 'فشل تحديث إصدار Android' : 'Failed to update Android version');
    } finally {
      setUpdating(false);
    }
  };

  const handleToggleMaintenance = async () => {
    setUpdating(true);
    setError('');
    setSuccess('');
    try {
      await adminService.toggleMaintenanceMode({
        enabled: !maintenanceEnabled,
        message: maintenanceMessage.trim() || undefined,
        estimated_end_time: estimatedEndTime || undefined,
      });
      setSuccess(
        language === 'ar'
          ? `تم ${!maintenanceEnabled ? 'تفعيل' : 'تعطيل'} وضع الصيانة بنجاح`
          : `Maintenance mode ${!maintenanceEnabled ? 'enabled' : 'disabled'} successfully`
      );
      await fetchAppConfig();
    } catch (err) {
      console.error('Failed to toggle maintenance mode:', err);
      setError(language === 'ar' ? 'فشل تغيير وضع الصيانة' : 'Failed to toggle maintenance mode');
    } finally {
      setUpdating(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-[var(--text-main)]">
          {language === 'ar' ? 'إعدادات التطبيق' : 'App Configuration'}
        </h1>
        <p className="text-[var(--text-muted)] mt-2">
          {language === 'ar'
            ? 'إدارة إصدارات التطبيق ووضع الصيانة'
            : 'Manage app versions and maintenance mode'}
        </p>
      </div>

      {/* Alert Messages */}
      {error && (
        <div className="flex items-start gap-3 p-4 bg-red-50 border border-red-200 rounded-lg">
          <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}

      {success && (
        <div className="flex items-start gap-3 p-4 bg-primary-pale border border-green-200 rounded-lg">
          <CheckCircle className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
          <p className="text-sm text-primary">{success}</p>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* iOS Version Manager */}
        <div className="bg-white border border-[var(--border)] rounded-lg p-6 space-y-4">
          <div className="flex items-center gap-2 mb-4">
            <h2 className="text-xl font-semibold text-[var(--text-main)]">
              {language === 'ar' ? 'إصدار iOS' : 'iOS Version'}
            </h2>
          </div>

          {appConfig?.ios_version && (
            <div className="p-3 bg-secondary-pale rounded-lg border border-secondary/30">
              <p className="text-xs text-secondary font-medium">
                {language === 'ar' ? 'الإصدار الحالي' : 'Current Version'}
              </p>
              <p className="text-lg font-bold text-blue-900">{appConfig.ios_version.version}</p>
              {appConfig.ios_version.force_update && (
                <p className="text-xs text-red-600 mt-1 flex items-center gap-1">
                  <AlertTriangle size={14} />
                  {language === 'ar' ? 'تحديث إجباري مفعل' : 'Force update enabled'}
                </p>
              )}
              {appConfig.ios_version.updated_at && (
                <p className="text-xs text-[var(--text-muted)] mt-1">
                  {language === 'ar' ? 'آخر تحديث: ' : 'Last updated: '}
                  {new Date(appConfig.ios_version.updated_at).toLocaleString()}
                </p>
              )}
            </div>
          )}

          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-navy mb-1">
                {language === 'ar' ? 'رقم الإصدار الجديد' : 'New Version Number'}
              </label>
              <Input
                label=""
                type="text"
                placeholder="e.g., 1.2.0"
                value={iosVersion}
                onChange={(e) => setIosVersion(e.target.value)}
                disabled={updating}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-navy mb-1">
                {language === 'ar' ? 'ملاحظات الإصدار' : 'Release Notes'}
              </label>
              <textarea
                placeholder={language === 'ar' ? 'أدخل ملاحظات الإصدار...' : 'Enter release notes...'}
                value={iosReleaseNotes}
                onChange={(e) => setIosReleaseNotes(e.target.value)}
                disabled={updating}
                className="w-full px-3 py-2 border border-[var(--border)] rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 text-sm"
                rows={3}
              />
            </div>

            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={iosForceUpdate}
                onChange={(e) => setIosForceUpdate(e.target.checked)}
                disabled={updating}
                className="w-4 h-4 rounded border-[var(--border)] text-primary focus:ring-2 focus:ring-primary/20"
              />
              <span className="text-sm font-medium text-navy">
                {language === 'ar' ? 'فرض التحديث على جميع المستخدمين' : 'Force update for all users'}
              </span>
            </label>

            <Button
              onClick={handleUpdateIOSVersion}
              disabled={updating}
              className="w-full bg-primary hover:bg-primary"
            >
              {updating ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  {language === 'ar' ? 'جاري التحديث...' : 'Updating...'}
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  {language === 'ar' ? 'حفظ إصدار iOS' : 'Save iOS Version'}
                </>
              )}
            </Button>
          </div>
        </div>

        {/* Android Version Manager */}
        <div className="bg-white border border-[var(--border)] rounded-lg p-6 space-y-4">
          <div className="flex items-center gap-2 mb-4">
            <h2 className="text-xl font-semibold text-[var(--text-main)]">
              {language === 'ar' ? 'إصدار Android' : 'Android Version'}
            </h2>
          </div>

          {appConfig?.android_version && (
            <div className="p-3 bg-primary-pale rounded-lg border border-green-200">
              <p className="text-xs text-primary font-medium">
                {language === 'ar' ? 'الإصدار الحالي' : 'Current Version'}
              </p>
              <p className="text-lg font-bold text-green-900">{appConfig.android_version.version}</p>
              {appConfig.android_version.force_update && (
                <p className="text-xs text-red-600 mt-1 flex items-center gap-1">
                  <AlertTriangle size={14} />
                  {language === 'ar' ? 'تحديث إجباري مفعل' : 'Force update enabled'}
                </p>
              )}
              {appConfig.android_version.updated_at && (
                <p className="text-xs text-[var(--text-muted)] mt-1">
                  {language === 'ar' ? 'آخر تحديث: ' : 'Last updated: '}
                  {new Date(appConfig.android_version.updated_at).toLocaleString()}
                </p>
              )}
            </div>
          )}

          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-navy mb-1">
                {language === 'ar' ? 'رقم الإصدار الجديد' : 'New Version Number'}
              </label>
              <Input
                label=""
                type="text"
                placeholder="e.g., 1.2.0"
                value={androidVersion}
                onChange={(e) => setAndroidVersion(e.target.value)}
                disabled={updating}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-navy mb-1">
                {language === 'ar' ? 'ملاحظات الإصدار' : 'Release Notes'}
              </label>
              <textarea
                placeholder={language === 'ar' ? 'أدخل ملاحظات الإصدار...' : 'Enter release notes...'}
                value={androidReleaseNotes}
                onChange={(e) => setAndroidReleaseNotes(e.target.value)}
                disabled={updating}
                className="w-full px-3 py-2 border border-[var(--border)] rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 text-sm"
                rows={3}
              />
            </div>

            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={androidForceUpdate}
                onChange={(e) => setAndroidForceUpdate(e.target.checked)}
                disabled={updating}
                className="w-4 h-4 rounded border-[var(--border)] text-primary focus:ring-2 focus:ring-primary/20"
              />
              <span className="text-sm font-medium text-navy">
                {language === 'ar' ? 'فرض التحديث على جميع المستخدمين' : 'Force update for all users'}
              </span>
            </label>

            <Button
              onClick={handleUpdateAndroidVersion}
              disabled={updating}
              className="w-full bg-primary hover:bg-primary"
            >
              {updating ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  {language === 'ar' ? 'جاري التحديث...' : 'Updating...'}
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  {language === 'ar' ? 'حفظ إصدار Android' : 'Save Android Version'}
                </>
              )}
            </Button>
          </div>
        </div>
      </div>

      {/* Maintenance Mode */}
      <div className="bg-white border border-[var(--border)] rounded-lg p-6 space-y-4">
        <div className="flex items-center gap-2 mb-4">
          <h2 className="text-xl font-semibold text-[var(--text-main)]">
            {language === 'ar' ? 'وضع الصيانة' : 'Maintenance Mode'}
          </h2>
        </div>

        {appConfig?.maintenance_mode && (
          <div
            className={`p-3 rounded-lg border ${
              maintenanceEnabled
                ? 'bg-yellow-50 border-yellow-200'
                : 'bg-[var(--light-bg)] border-[var(--border)]'
            }`}
          >
            <p className="text-xs font-medium mb-1">
              {language === 'ar' ? 'الحالة الحالية' : 'Current Status'}
            </p>
            <div className="flex items-center gap-2">
              <div
                className={`w-3 h-3 rounded-full ${
                  maintenanceEnabled ? 'bg-yellow-600' : 'bg-[var(--border)]'
                }`}
              />
              <span className="font-semibold text-[var(--text-main)]">
                {maintenanceEnabled
                  ? language === 'ar'
                    ? 'مفعل ⚠️'
                    : 'Enabled ⚠️'
                  : language === 'ar'
                  ? 'معطل ✓'
                  : 'Disabled ✓'}
              </span>
            </div>
            {appConfig.maintenance_mode.updated_at && (
              <p className="text-xs text-[var(--text-muted)] mt-2">
                {language === 'ar' ? 'آخر تحديث: ' : 'Last updated: '}
                {new Date(appConfig.maintenance_mode.updated_at).toLocaleString()}
              </p>
            )}
          </div>
        )}

        <div className="space-y-3">
          <div>
            <label className="block text-sm font-medium text-navy mb-1">
              {language === 'ar' ? 'رسالة الصيانة' : 'Maintenance Message'}
            </label>
            <textarea
              placeholder={
                language === 'ar'
                  ? 'أدخل رسالة الصيانة التي سيراها المستخدمون...'
                  : 'Enter maintenance message that users will see...'
              }
              value={maintenanceMessage}
              onChange={(e) => setMaintenanceMessage(e.target.value)}
              disabled={updating}
              className="w-full px-3 py-2 border border-[var(--border)] rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 text-sm"
              rows={3}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-navy mb-1">
              {language === 'ar' ? 'الوقت المتوقع للانتهاء' : 'Estimated End Time'}
            </label>
            <Input
              label=""
              type="datetime-local"
              value={estimatedEndTime}
              onChange={(e) => setEstimatedEndTime(e.target.value)}
              disabled={updating}
            />
          </div>

          <div className="bg-[var(--light-bg)] p-4 rounded-lg border border-[var(--border)]">
            <p className="text-sm font-medium text-[var(--text-main)] mb-3">
              {language === 'ar' ? 'حالة الصيانة الحالية' : 'Current Maintenance Status'}
            </p>
            <Button
              onClick={handleToggleMaintenance}
              disabled={updating}
              variant={maintenanceEnabled ? 'primary' : 'outline'}
              className={`w-full ${
                maintenanceEnabled
                  ? 'bg-yellow-600 hover:bg-yellow-700'
                  : 'bg-slate-600 hover:bg-slate-700'
              }`}
            >
              {updating ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  {language === 'ar' ? 'جاري المعالجة...' : 'Processing...'}
                </>
              ) : maintenanceEnabled ? (
                <>
                  <AlertTriangle className="w-4 h-4 mr-2" />
                  {language === 'ar' ? 'تعطيل وضع الصيانة' : 'Disable Maintenance Mode'}
                </>
              ) : (
                <>
                  <AlertTriangle className="w-4 h-4 mr-2" />
                  {language === 'ar' ? 'تفعيل وضع الصيانة' : 'Enable Maintenance Mode'}
                </>
              )}
            </Button>
          </div>
        </div>
      </div>

      {/* Social Login Configuration (Google & Apple) */}
      <div className="bg-white border border-[var(--border)] rounded-lg p-6 space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <Share2 className="w-5 h-5 text-primary" />
            <h2 className="text-xl font-semibold text-[var(--text-main)]">
              {language === 'ar' ? 'تسجيل الدخول عبر Google و Apple' : 'Google & Apple Social Login'}
            </h2>
          </div>
          <span
            className={`px-3 py-1 rounded-full text-xs font-semibold ${
              socialLoginEnabled
                ? 'bg-green-100 text-green-700 border border-green-200'
                : 'bg-red-100 text-red-700 border border-red-200'
            }`}
          >
            {socialLoginEnabled
              ? language === 'ar'
                ? 'مفعل وظاهر ✓'
                : 'Active & Visible ✓'
              : language === 'ar'
              ? 'معطل ومخفي ✕'
              : 'Disabled & Hidden ✕'}
          </span>
        </div>

        <p className="text-sm text-[var(--text-muted)] leading-relaxed">
          {language === 'ar'
            ? 'التحكم في ظهور أزرار تسجيل الدخول وإنشاء الحساب السريع عبر Google و Apple. عند التعطيل، ستختفي الأزرار تلقائياً من منصة الويب وتطبيق الجوال (iOS و Android) دون المساس بحسابات المستخدمين المسجلة مسبقاً.'
            : 'Control the visibility of Google and Apple sign-in and quick registration buttons. When disabled, the buttons will be automatically hidden from the Web platform and Mobile apps (iOS & Android) without affecting existing accounts.'}
        </p>

        <div
          className={`p-4 rounded-lg border transition-colors ${
            socialLoginEnabled
              ? 'bg-green-50/60 border-green-200'
              : 'bg-slate-50 border-slate-200'
          }`}
        >
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${
                  socialLoginEnabled ? 'bg-green-100 text-green-600' : 'bg-slate-200 text-slate-500'
                }`}
              >
                {socialLoginEnabled ? <Eye className="w-5 h-5" /> : <EyeOff className="w-5 h-5" />}
              </div>
              <div>
                <p className="font-semibold text-sm text-[var(--text-main)]">
                  {socialLoginEnabled
                    ? language === 'ar'
                      ? 'أزرار Google و Apple ظاهرة للمستخدمين'
                      : 'Google & Apple buttons are visible'
                    : language === 'ar'
                    ? 'أزرار Google و Apple مخفية عن المستخدمين'
                    : 'Google & Apple buttons are hidden'}
                </p>
                <p className="text-xs text-[var(--text-muted)] mt-0.5">
                  {socialLoginEnabled
                    ? language === 'ar'
                      ? 'يمكن للطلاب والمعلمين تسجيل الدخول أو إنشاء حساب عبر Google و Apple'
                      : 'Students and teachers can log in or register via Google and Apple'
                    : language === 'ar'
                    ? 'لا تظهر أزرار وسائل التواصل في صفحات تسجيل الدخول وإنشاء الحساب'
                    : 'Social buttons will not appear on login or register pages'}
                </p>
              </div>
            </div>

            <Button
              onClick={handleToggleSocialLogin}
              disabled={updating}
              className={`shrink-0 w-full sm:w-auto min-w-[190px] ${
                socialLoginEnabled
                  ? 'bg-red-600 hover:bg-red-700 text-white'
                  : 'bg-primary hover:bg-primary-hover text-white'
              }`}
            >
              {updating ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  {language === 'ar' ? 'جاري المعالجة...' : 'Processing...'}
                </>
              ) : socialLoginEnabled ? (
                <>
                  <EyeOff className="w-4 h-4 mr-2" />
                  {language === 'ar' ? 'إخفاء الأزرار (تعطيل)' : 'Hide Buttons (Disable)'}
                </>
              ) : (
                <>
                  <Eye className="w-4 h-4 mr-2" />
                  {language === 'ar' ? 'إظهار الأزرار (تفعيل)' : 'Show Buttons (Enable)'}
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
