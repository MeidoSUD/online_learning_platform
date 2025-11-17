@include('auth.header', ['title' => __('Login')])
<section class="row flexbox-container">
    <div class="col-xl-8 col-11 d-flex justify-content-center">
        <div class="card bg-authentication rounded-0 mb-0">
            <div class="row m-0">
                <div class="col-lg-6 d-lg-block d-none text-center align-self-center px-1 py-0">
                    <img src="{{ asset('logo.png') }}" alt="Ewan Geniuses Logo"
                        style="max-width: 150px; height: auto; margin-bottom: 16px;" />
                    <h2 class="brand-text mb-0"
                        style="font-family: '{{ app()->getLocale() == 'ar' ? 'Tajawal' : 'Montserrat' }}', sans-serif;">
                        {{ app()->getLocale() == 'ar' ? 'إيوان العباقرة' : 'Ewan Geniuses' }}
                    </h2>
                    <img src="../../../app-assets/images/pages/login.png" alt="branding logo">
                </div>
                <div class="col-lg-6 col-12 p-0">
                    <div class="card rounded-0 mb-0 px-2">
                        <div class="card-header pb-1">
                            <div class="card-title">
                                <h4 class="mb-0">{{ app()->getLocale() == 'ar' ? 'تسجيل الدخول' : 'Login' }}</h4>
                            </div>
                        </div>
                        <p class="px-2">
                            {{ app()->getLocale() == 'ar' ? 'مرحباً بك , الرجاء إدخال كافة البيانات لتسجيل الدخول' : 'Welcome, please enter your credentials to login.' }}
                        </p>
                        <div class="card-content">
                            <div class="card-body pt-1 mb-3">
                                @if ($errors->any())
                                    <div class="alert alert-danger mb-2">
                                        <ul>
                                            @foreach ($errors->all() as $error)
                                                <li>{{ $error }}</li>
                                            @endforeach
                                        </ul>
                                    </div>
                                @endif
                                <form method="POST" action="{{ route('login' , ['locale' => app()->getLocale()]) }}">
                                    @csrf
                                    <fieldset class="form-label-group form-group position-relative has-icon-left">
                                        <input type="text" class="form-control @error('email') is-invalid @enderror"
                                            id="user-name"
                                            placeholder="{{ app()->getLocale() == 'ar' ? 'البريد الألكتروني' : 'Email' }}"
                                            required name="email" value="{{ old('email') }}">
                                        <div class="form-control-position">
                                            <i class="feather icon-user"></i>
                                        </div>
                                        <label
                                            for="user-name">{{ app()->getLocale() == 'ar' ? 'البريد الألكتروني' : 'Email' }}</label>
                                    </fieldset>

                                    <fieldset class="form-label-group position-relative has-icon-left">
                                        <input type="password"
                                            class="form-control @error('password') is-invalid @enderror"
                                            id="user-password"
                                            placeholder="{{ app()->getLocale() == 'ar' ? 'كلمة المرور' : 'Password' }}"
                                            required name="password">
                                        <div class="form-control-position">
                                            <i class="feather icon-lock"></i>
                                        </div>
                                        <label
                                            for="user-password">{{ app()->getLocale() == 'ar' ? 'كلمة المرور' : 'Password' }}</label>
                                    </fieldset>
                                    <div class="form-group d-flex justify-content-between align-items-center">
                                        <div class="text-left">
                                            <fieldset class="checkbox">
                                                <div class="vs-checkbox-con vs-checkbox-primary">
                                                    <input type="checkbox" name="remember">
                                                    <span class="vs-checkbox">
                                                        <span class="vs-checkbox--check">
                                                            <i class="vs-icon feather icon-check"></i>
                                                        </span>
                                                    </span>
                                                    <span
                                                        class="">{{ app()->getLocale() == 'ar' ? 'تذكرني' : 'Remember me' }}</span>
                                                </div>
                                            </fieldset>
                                        </div>
                                        <div class="text-right">
                                            <a href="/forgot-password" class="card-link">
                                                {{ app()->getLocale() == 'ar' ? 'نسيت كلمة السر ؟' : 'Forgot password?' }}
                                            </a>
                                        </div>
                                    </div>
                                    <button type="submit" class="btn btn-primary float-right btn-inline">
                                        {{ app()->getLocale() == 'ar' ? 'تسجيل الدخول' : 'Login' }}
                                    </button>
                                </form>
                                <hr>
                                <div class="mt-3 text-center">
                                    <a href="{{ route('register' , ['locale' => app()->getLocale()]) }}" class="btn btn-outline-primary ml-2">
                                        {{ app()->getLocale() == 'ar' ? 'إنشاء حساب جديد' : 'Sign Up' }}
                                    </a>
                                </div>
                            </div>
                        </div>

                    </div>
                </div>
            </div>
        </div>
    </div>
</section>
@push('scripts')
<script>
// After successful login, trigger FCM token registration
document.addEventListener('DOMContentLoaded', function() {
    const loginForm = document.getElementById('login-form');
    
    if (loginForm) {
        loginForm.addEventListener('submit', function(e) {
            // Let the form submit normally
            // The token registration will happen on the next page load
            localStorage.setItem('needsFCMToken', 'true');
        });
    }
    
    // Check if we need to register token after login redirect
    if (localStorage.getItem('needsFCMToken') === 'true') {
        localStorage.removeItem('needsFCMToken');
        console.log('🔔 Triggering FCM token registration after login...');
        // The main app.blade.php script will handle this automatically
    }
});
</script>
@endpush
@include('auth.footer')
