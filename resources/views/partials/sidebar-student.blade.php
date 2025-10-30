<aside class="sidebar">
    <div class="sidebar-header">
        <div class="user-info">
            <div class="user-avatar">
                @if(auth()->user()->avatar)
                    <img src="{{ asset('storage/' . auth()->user()->avatar) }}" alt="Avatar">
                @else
                    <div class="avatar-placeholder">
                        {{ strtoupper(substr(auth()->user()->name, 0, 1)) }}
                    </div>
                @endif
            </div>
            <div class="user-details">
                <h6 class="user-name">{{ auth()->user()->name }}</h6>
                <span class="user-role">{{ app()->getLocale() == 'ar' ? 'طالب' : 'Student' }}</span>
            </div>
        </div>
    </div>

    <nav class="sidebar-nav">
        <ul class="nav flex-column">

            <!-- Dashboard -->
            <li class="nav-item {{ request()->is('student/dashboard*') ? 'active' : '' }}">
                <a href="{{ route('student.dashboard') }}" class="nav-link">
                    <i class="feather icon-home"></i>
                    <span>{{ app()->getLocale() == 'ar' ? 'الرئيسية' : 'Dashboard' }}</span>
                </a>
            </li>

            <!-- My Favorite -->
            <li class="nav-item {{ request()->is('student/favorites*') ? 'active' : '' }}">
                <a href="{{ route('student.favorites.index') }}" class="nav-link">
                    <i class="feather icon-heart"></i>
                    <span>{{ app()->getLocale() == 'ar' ? 'المفضلة' : 'My Favorite' }}</span>
                </a>
            </li>

            <!-- Private Lessons -->
            <li class="nav-item has-sub {{ request()->is('student/lessons*') ? 'active' : '' }}">
                <a href="javascript:void(0)" class="nav-link" onclick="toggleSubmenu(this)">
                    <i class="feather icon-book"></i>
                    <span>{{ app()->getLocale() == 'ar' ? 'الدروس الخصوصية' : 'Private Lessons' }}</span>
                    <i class="feather icon-chevron-down submenu-icon"></i>
                </a>
                <ul class="nav sub-menu" style="display: {{ request()->is('student/lessons*') ? 'block' : 'none' }}">
                    <li class="nav-item {{ request()->is('student/lessons') && !request()->is('student/lessons/create') ? 'active' : '' }}">
                        <a href="{{ route('student.teachers.index') }}" class="nav-link">
                            <span>{{ app()->getLocale() == 'ar' ? 'قائمة الدروس' : 'My Lessons' }}</span>
                        </a>
                    </li>
                    <li class="nav-item {{ request()->is('student/lessons/create') ? 'active' : '' }}">
                        <a href="{{ route('student.teachers.index') }}" class="nav-link">
                            <span>{{ app()->getLocale() == 'ar' ? 'دروسي الخاصة' : 'My Private Lessons' }}</span>
                        </a>
                    </li>
                </ul>
            </li>

            <!-- Courses -->
            <li class="nav-item {{ request()->is('student/courses*') ? 'active' : '' }}">
                <a href="{{ route('student.courses.index') }}" class="nav-link">
                    <i class="feather icon-layers"></i>
                    <span>{{ app()->getLocale() == 'ar' ? 'الدورات' : 'Courses' }}</span>
                </a>
            </li>

            <!-- Language Study -->
            <li class="nav-item {{ request()->is('student/language-study*') ? 'active' : '' }}">
                <a href="{{ route('student.language.study') }}" class="nav-link">
                    <i class="feather icon-globe"></i>
                    <span>{{ app()->getLocale() == 'ar' ? 'تعلم اللغات' : 'Language Learning' }}</span>
                </a>
            </li>

            <!-- My Books -->
            <li class="nav-item {{ request()->is('student/books*') ? 'active' : '' }}">
                <a href="{{ route('student.books.index') }}" class="nav-link">
                    <i class="feather icon-book-open"></i>
                    <span>{{ app()->getLocale() == 'ar' ? 'كتبي' : 'My Books' }}</span>
                </a>
            </li>

            <!-- Disputes -->
            <li class="nav-item has-sub {{ request()->is('student/disputes*') ? 'active' : '' }}">
                <a href="javascript:void(0)" class="nav-link" onclick="toggleSubmenu(this)">
                    <i class="feather icon-alert-circle"></i>
                    <span>{{ app()->getLocale() == 'ar' ? 'النزاعات' : 'Disputes' }}</span>
                    <i class="feather icon-chevron-down submenu-icon"></i>
                </a>
                <ul class="nav sub-menu" style="display: {{ request()->is('student/disputes*') ? 'block' : 'none' }}">
                    <li class="nav-item {{ request()->is('student/disputes/create') ? 'active' : '' }}">
                        <a href="{{ route('student.disputes.create') }}" class="nav-link">
                            <span>{{ app()->getLocale() == 'ar' ? 'إضافة نزاع' : 'Add Dispute' }}</span>
                        </a>
                    </li>
                    <li class="nav-item {{ request()->is('student/disputes') ? 'active' : '' }}">
                        <a href="{{ route('student.disputes.index') }}" class="nav-link">
                            <span>{{ app()->getLocale() == 'ar' ? 'قائمة النزاعات' : 'Dispute List' }}</span>
                        </a>
                    </li>
                </ul>
            </li>

            <!-- My Calendar -->
            <li class="nav-item {{ request()->is('student/calendar*') ? 'active' : '' }}">
                <a href="{{ route('student.calendar') }}" class="nav-link">
                    <i class="feather icon-calendar"></i>
                    <span>{{ app()->getLocale() == 'ar' ? 'تقويمي' : 'My Calendar' }}</span>
                </a>
            </li>

            <!-- Profile -->
            <li class="nav-item has-sub {{ request()->is('student/profile*') ? 'active' : '' }}">
                <a href="javascript:void(0)" class="nav-link" onclick="toggleSubmenu(this)">
                    <i class="feather icon-user"></i>
                    <span>{{ app()->getLocale() == 'ar' ? 'الملف الشخصي' : 'Profile' }}</span>
                    <i class="feather icon-chevron-down submenu-icon"></i>
                </a>
                <ul class="nav sub-menu" style="display: {{ request()->is('student/profile*') ? 'block' : 'none' }}">
                    <li class="nav-item {{ request()->is('student/profile/edit') ? 'active' : '' }}">
                        <a href="{{ route('profile.edit') }}" class="nav-link">
                            <span>{{ app()->getLocale() == 'ar' ? 'تعديل الملف' : 'Edit Profile' }}</span>
                        </a>
                    </li>
                    <li class="nav-item {{ request()->is('student/profile/payment-method') ? 'active' : '' }}">
                        <a href="{{ route('payment-methods.index') }}" class="nav-link">
                            <span>{{ app()->getLocale() == 'ar' ? 'طريقة الدفع' : 'My Payment Method' }}</span>
                        </a>
                    </li>
                    <li class="nav-item {{ request()->is('student/profile/booking-history') ? 'active' : '' }}">
                        <a href="{{ route('student.profile.bookingHistory') }}" class="nav-link">
                            <span>{{ app()->getLocale() == 'ar' ? 'سجل الحجوزات' : 'Booking History' }}</span>
                        </a>
                    </li>
                    <li class="nav-item {{ request()->is('student/profile/transactions') ? 'active' : '' }}">
                        <a href="{{ route('student.profile.transactions') }}" class="nav-link">
                            <span>{{ app()->getLocale() == 'ar' ? 'المعاملات' : 'Transactions' }}</span>
                        </a>
                    </li>
                </ul>
            </li>

        </ul>
    </nav>

    <div class="sidebar-footer">
        <form action="{{ route('logout') }}" method="POST" class="w-100">
            @csrf
            <button type="submit" class="btn btn-logout">
                <i class="feather icon-log-out"></i>
                <span>{{ app()->getLocale() == 'ar' ? 'تسجيل الخروج' : 'Logout' }}</span>
            </button>
        </form>
    </div>
</aside>




{{-- <aside class="sidebar">
    <div class="sidebar-header">
        <div class="user-info">
            <div class="user-avatar">
                @if(auth()->user()->avatar)
                    <img src="{{ asset('storage/' . auth()->user()->avatar) }}" alt="Avatar">
                @else
                    <div class="avatar-placeholder">
                        {{ strtoupper(substr(auth()->user()->name, 0, 1)) }}
                    </div>
                @endif
            </div>
            <div class="user-details">
                <h6 class="user-name">{{ auth()->user()->name }}</h6>
                <span class="user-role">{{ app()->getLocale() == 'ar' ? 'طالب' : 'Student' }}</span>
            </div>
        </div>
    </div>

    <nav class="sidebar-nav">
        <ul class="nav flex-column">
            <!-- Dashboard -->
            <li class="nav-item {{ request()->is('student/dashboard*') ? 'active' : '' }}">
                <a href="{{ route('student.dashboard') }}" class="nav-link">
                    <i class="feather icon-home"></i>
                    <span>{{ app()->getLocale() == 'ar' ? 'الرئيسية' : 'Dashboard' }}</span>
                </a>
            </li>

            <!-- Bookings -->
            <li class="nav-item {{ request()->is('student/bookings*') ? 'active' : '' }}">
                <a href="{{ route('student.bookings.index') }}" class="nav-link">
                    <i class="feather icon-calendar"></i>
                    <span>{{ app()->getLocale() == 'ar' ? 'الحجوزات' : 'Bookings' }}</span>
                </a>
            </li>

            <!-- Lessons -->
            <li class="nav-item has-sub {{ request()->is('student/lessons*') ? 'active' : '' }}">
                <a href="javascript:void(0)" class="nav-link" onclick="toggleSubmenu(this)">
                    <i class="feather icon-book"></i>
                    <span>{{ app()->getLocale() == 'ar' ? 'الدروس الخصوصية' : 'Private Lessons' }}</span>
                    <i class="feather icon-chevron-down submenu-icon"></i>
                </a>
                <ul class="nav sub-menu" style="display: {{ request()->is('student/lessons*') ? 'block' : 'none' }}">
                    <li class="nav-item {{ request()->is('student/lessons') && !request()->is('student/lessons/create') ? 'active' : '' }}">
                        <a href="{{ route('student.courses.privatelessons') }}" class="nav-link">
                            <span>{{ app()->getLocale() == 'ar' ? 'قائمة الدروس' : 'My Lessons' }}</span>
                        </a>
                    </li>
                    <li class="nav-item {{ request()->is('student/lessons/create') ? 'active' : '' }}">
                        <a href="{{ route('student.lessons.create') }}" class="nav-link">
                            <span>{{ app()->getLocale() == 'ar' ? 'إضافة درس' : 'Add Lesson' }}</span>
                        </a>
                    </li>
                </ul>
            </li>

            <!-- Payments -->
            <li class="nav-item {{ request()->is('student/payments*') ? 'active' : '' }}">
                <a href="{{ route('student.payments.index') }}" class="nav-link">
                    <i class="feather icon-credit-card"></i>
                    <span>{{ app()->getLocale() == 'ar' ? 'المدفوعات' : 'Payments' }}</span>
                </a>
            </li>

            <!-- Profile -->
            <li class="nav-item has-sub {{ request()->is('student/profile*') ? 'active' : '' }}">
                <a href="javascript:void(0)" class="nav-link" onclick="toggleSubmenu(this)">
                    <i class="feather icon-user"></i>
                    <span>{{ app()->getLocale() == 'ar' ? 'الملف الشخصي' : 'Profile' }}</span>
                    <i class="feather icon-chevron-down submenu-icon"></i>
                </a>
                <ul class="nav sub-menu" style="display: {{ request()->is('student/profile*') ? 'block' : 'none' }}">
                    <li class="nav-item {{ request()->is('student/profile') ? 'active' : '' }}">
                        <a href="{{ route('student.profile') }}" class="nav-link">
                            <span>{{ app()->getLocale() == 'ar' ? 'عرض الملف' : 'View Profile' }}</span>
                        </a>
                    </li>
                    <li class="nav-item {{ request()->is('student/profile/edit') ? 'active' : '' }}">
                        <a href="{{ route('student.profile.edit') }}" class="nav-link">
                            <span>{{ app()->getLocale() == 'ar' ? 'تعديل الملف' : 'Edit Profile' }}</span>
                        </a>
                    </li>
                </ul>
            </li>
        </ul>
    </nav>

    <div class="sidebar-footer">
        <form action="{{ route('logout') }}" method="POST" class="w-100">
            @csrf
            <button type="submit" class="btn btn-logout">
                <i class="feather icon-log-out"></i>
                <span>{{ app()->getLocale() == 'ar' ? 'تسجيل الخروج' : 'Logout' }}</span>
            </button>
        </form>
    </div>
</aside> --}}
