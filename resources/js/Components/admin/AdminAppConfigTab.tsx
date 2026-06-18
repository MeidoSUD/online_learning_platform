import React, { useState, useEffect } from 'react';
import { useLanguage } from '../../Contexts/LanguageContext';
import { adminService, AppConfig, AppVersion } from '../../Services/api';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { AlertCircle, CheckCircle, Save, Loader2, AlertTriangle } from 'lucide-react';

export const AdminAppConfigTab: React.FC = () => {
  const { t, language } = useLanguage();
  const [appConfig, setAppConfig] = useState<AppConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

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
      const config = await adminService.getAppConfig();
      setAppConfig(config);

      // Set initial form values
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
        <h1 className="text-3xl font-bold text-slate-900">
          {language === 'ar' ? 'إعدادات التطبيق' : 'App Configuration'}
        </h1>
        <p className="text-slate-600 mt-2">
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
        <div className="flex items-start gap-3 p-4 bg-green-50 border border-green-200 rounded-lg">
          <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-green-600">{success}</p>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* iOS Version Manager */}
        <div className="bg-white border border-slate-200 rounded-lg p-6 space-y-4">
          <div className="flex items-center gap-2 mb-4">
            <h2 className="text-xl font-semibold text-slate-900">
              {language === 'ar' ? 'إصدار iOS' : 'iOS Version'}
            </h2>
          </div>

          {appConfig?.ios_version && (
            <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
              <p className="text-xs text-blue-600 font-medium">
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
                <p className="text-xs text-slate-500 mt-1">
                  {language === 'ar' ? 'آخر تحديث: ' : 'Last updated: '}
                  {new Date(appConfig.ios_version.updated_at).toLocaleString()}
                </p>
              )}
            </div>
          )}

          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
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
              <label className="block text-sm font-medium text-slate-700 mb-1">
                {language === 'ar' ? 'ملاحظات الإصدار' : 'Release Notes'}
              </label>
              <textarea
                placeholder={language === 'ar' ? 'أدخل ملاحظات الإصدار...' : 'Enter release notes...'}
                value={iosReleaseNotes}
                onChange={(e) => setIosReleaseNotes(e.target.value)}
                disabled={updating}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-sm"
                rows={3}
              />
            </div>

            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={iosForceUpdate}
                onChange={(e) => setIosForceUpdate(e.target.checked)}
                disabled={updating}
                className="w-4 h-4 rounded border-slate-300 text-primary focus:ring-2 focus:ring-primary"
              />
              <span className="text-sm font-medium text-slate-700">
                {language === 'ar' ? 'فرض التحديث على جميع المستخدمين' : 'Force update for all users'}
              </span>
            </label>

            <Button
              onClick={handleUpdateIOSVersion}
              disabled={updating}
              className="w-full bg-blue-600 hover:bg-blue-700"
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
        <div className="bg-white border border-slate-200 rounded-lg p-6 space-y-4">
          <div className="flex items-center gap-2 mb-4">
            <h2 className="text-xl font-semibold text-slate-900">
              {language === 'ar' ? 'إصدار Android' : 'Android Version'}
            </h2>
          </div>

          {appConfig?.android_version && (
            <div className="p-3 bg-green-50 rounded-lg border border-green-200">
              <p className="text-xs text-green-600 font-medium">
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
                <p className="text-xs text-slate-500 mt-1">
                  {language === 'ar' ? 'آخر تحديث: ' : 'Last updated: '}
                  {new Date(appConfig.android_version.updated_at).toLocaleString()}
                </p>
              )}
            </div>
          )}

          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
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
              <label className="block text-sm font-medium text-slate-700 mb-1">
                {language === 'ar' ? 'ملاحظات الإصدار' : 'Release Notes'}
              </label>
              <textarea
                placeholder={language === 'ar' ? 'أدخل ملاحظات الإصدار...' : 'Enter release notes...'}
                value={androidReleaseNotes}
                onChange={(e) => setAndroidReleaseNotes(e.target.value)}
                disabled={updating}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-sm"
                rows={3}
              />
            </div>

            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={androidForceUpdate}
                onChange={(e) => setAndroidForceUpdate(e.target.checked)}
                disabled={updating}
                className="w-4 h-4 rounded border-slate-300 text-primary focus:ring-2 focus:ring-primary"
              />
              <span className="text-sm font-medium text-slate-700">
                {language === 'ar' ? 'فرض التحديث على جميع المستخدمين' : 'Force update for all users'}
              </span>
            </label>

            <Button
              onClick={handleUpdateAndroidVersion}
              disabled={updating}
              className="w-full bg-green-600 hover:bg-green-700"
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
      <div className="bg-white border border-slate-200 rounded-lg p-6 space-y-4">
        <div className="flex items-center gap-2 mb-4">
          <h2 className="text-xl font-semibold text-slate-900">
            {language === 'ar' ? 'وضع الصيانة' : 'Maintenance Mode'}
          </h2>
        </div>

        {appConfig?.maintenance_mode && (
          <div
            className={`p-3 rounded-lg border ${
              maintenanceEnabled
                ? 'bg-yellow-50 border-yellow-200'
                : 'bg-slate-50 border-slate-200'
            }`}
          >
            <p className="text-xs font-medium mb-1">
              {language === 'ar' ? 'الحالة الحالية' : 'Current Status'}
            </p>
            <div className="flex items-center gap-2">
              <div
                className={`w-3 h-3 rounded-full ${
                  maintenanceEnabled ? 'bg-yellow-600' : 'bg-slate-400'
                }`}
              />
              <span className="font-semibold text-slate-900">
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
              <p className="text-xs text-slate-500 mt-2">
                {language === 'ar' ? 'آخر تحديث: ' : 'Last updated: '}
                {new Date(appConfig.maintenance_mode.updated_at).toLocaleString()}
              </p>
            )}
          </div>
        )}

        <div className="space-y-3">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
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
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-sm"
              rows={3}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
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

          <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
            <p className="text-sm font-medium text-slate-900 mb-3">
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
    </div>
  );
};
