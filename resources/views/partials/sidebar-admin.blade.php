<aside class="sidebar">
    <ul class="nav flex-column">
        <li class="nav-item {{ App\Helpers\Helpers::isActive('admin/dashboard*') }}">
            <a href="{{ route('admin.dashboard') }}" class="nav-link">
                <i class="feather icon-home"></i>
                <span>{{ app()->getLocale() == 'ar' ? 'الرئيسية' : 'Dashboard' }}</span>
            </a>
        </li>
        <li class="nav-item {{ App\Helpers\Helpers::isActive('admin/services*') }}">
            <a href="{{ route('admin.services.index') }}" class="nav-link">
                <i class="feather icon-home"></i>
                <span>{{ app()->getLocale() == 'ar' ? 'الخدمات' : 'Services' }}</span>
            </a>
        </li>
        <li class="nav-item has-sub {{ App\Helpers\Helpers::isActive('admin/users*') }}">
            <a href="{{ route('admin.users.index') }}" class="nav-link">
                <i class="feather icon-users"></i>
                <span>{{ app()->getLocale() == 'ar' ? 'المستخدمين' : 'Users' }}</span>
            </a>
            <ul class="nav sub-menu">
                <li class="nav-item {{ App\Helpers\Helpers::isActive('admin/users/students*') }}">
                    <a href="#" class="nav-link">
                        {{ app()->getLocale() == 'ar' ? 'الطلاب' : 'Students' }}
                    </a>
                </li>
                <li class="nav-item {{ App\Helpers\Helpers::isActive('admin/users/teachers*') }}">
                    <a href="#" class="nav-link">
                        {{ app()->getLocale() == 'ar' ? 'المعلمين' : 'Teachers' }}
                    </a>
                </li>
                <li class="nav-item {{ App\Helpers\Helpers::isActive('admin/users/admins*') }}">
                    <a href="#" class="nav-link">
                        {{ app()->getLocale() == 'ar' ? 'المشرفين' : 'Admins' }}
                    </a>
                </li>
            </ul>
        </li>

        <li class="nav-item {{ App\Helpers\Helpers::isActive('admin/courses*') }}">
            <a href="{{ route('admin.courses.index') }}" class="nav-link">
                <i class="feather icon-layers"></i>
                <span>{{ app()->getLocale() == 'ar' ? 'الدورات' : 'Courses' }}</span>
            </a>
        </li>

        <li class="nav-item {{ App\Helpers\Helpers::isActive('admin/bookings*') }}">
            <a href="{{ route('admin.bookings.index') }}" class="nav-link">
                <i class="feather icon-calendar"></i>
                <span>{{ app()->getLocale() == 'ar' ? 'الحجوزات' : 'Bookings' }}</span>
            </a>
        </li>

        <li class="nav-item {{ App\Helpers\Helpers::isActive('admin/payments*') }}">
            <a href="{{ route('admin.payments.index') }}" class="nav-link">
                <i class="feather icon-credit-card"></i>
                <span>{{ app()->getLocale() == 'ar' ? 'المدفوعات' : 'Payments' }}</span>
            </a>
        </li>

        <li class="nav-item {{ App\Helpers\Helpers::isActive('admin/disputes*') }}">
            <a href="{{ route('admin.disputes.index') }}" class="nav-link">
                <i class="feather icon-alert-triangle"></i>
                <span>{{ app()->getLocale() == 'ar' ? 'النزاعات' : 'Disputes' }}</span>
            </a>
        </li>

        <li class="nav-item {{ App\Helpers\Helpers::isActive('admin/settings*') }}">
            <a href="{{ route('admin.settings.index') }}" class="nav-link">
                <i class="feather icon-settings"></i>
                <span>{{ app()->getLocale() == 'ar' ? 'الإعدادات' : 'Settings' }}</span>
            </a>
        </li>
    </ul>
</aside>
