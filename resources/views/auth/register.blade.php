@include('auth.header', ['title' => app()->getLocale() == 'ar' ? 'إنشاء حساب جديد' : 'Register'])

<section class="row flexbox-container">
    <div class="col-xl-8 col-11 d-flex justify-content-center">
        <div class="card bg-authentication rounded-0 mb-0">
            <div class="row m-0">
                <div class="col-lg-6 d-lg-block d-none text-center align-self-center px-1 py-0">
                    <img src="{{ asset('logo.png') }}" alt="Ewan Geniuses Logo" style="max-width: 150px; height: auto; margin-bottom: 16px;" />
                    <h2 class="brand-text mb-0" style="font-family: '{{ app()->getLocale() == 'ar' ? 'Tajawal' : 'Montserrat' }}', sans-serif;">
                        {{ app()->getLocale() == 'ar' ? 'إيوان العباقرة' : 'Ewan Geniuses' }}
                    </h2>
                    <img src="../../../app-assets/images/pages/login.png" alt="branding logo">
                </div>
                <div class="col-lg-6 col-12 p-0">
                    <div class="card rounded-0 mb-0 px-2">
                        <div class="card-header pb-1">
                            <div class="card-title">
                                <h4 class="mb-0">{{ app()->getLocale() == 'ar' ? 'إنشاء حساب جديد' : 'Register' }}</h4>
                            </div>
                        </div>
                        <p class="px-2">
                            {{ app()->getLocale() == 'ar' ? 'يرجى تعبئة جميع الحقول لإنشاء حساب جديد.' : 'Please fill in all fields to create a new account.' }}
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
                                <form method="POST" action="{{ route('register', ['locale' => app()->getLocale()]) }}">
                                    @csrf
                                    <!-- First Name & Last Name (same line) -->
                                    <div class="form-row">
                                        <div class="form-group col-md-6">
                                            <label for="first_name">{{ app()->getLocale() == 'ar' ? 'الاسم الأول' : 'First Name' }}</label>
                                            <input type="text" class="form-control" id="first_name" name="first_name" value="{{ old('first_name') }}" required autofocus>
                                        </div>
                                        <div class="form-group col-md-6">
                                            <label for="last_name">{{ app()->getLocale() == 'ar' ? 'اسم العائلة' : 'Last Name' }}</label>
                                            <input type="text" class="form-control" id="last_name" name="last_name" value="{{ old('last_name') }}" required>
                                        </div>
                                    </div>
                                    <!-- Email -->
                                    <div class="form-group">
                                        <label for="email">{{ app()->getLocale() == 'ar' ? 'البريد الإلكتروني' : 'Email' }}</label>
                                        <input type="email" class="form-control" id="email" name="email" value="{{ old('email') }}" required>
                                    </div>
                                    <!-- Nationality -->
                                    <div class="form-group">
                                        <label for="nationality">{{ app()->getLocale() == 'ar' ? 'الجنسية' : 'Nationality' }}</label>
                                        <select id="nationality" name="nationality" class="form-control" required>
                                            <option value="">{{ app()->getLocale() == 'ar' ? '-- اختر الجنسية --' : '-- Select Nationality --' }}</option>
                                            <option value="Saudi">{{ app()->getLocale() == 'ar' ? 'سعودي' : 'Saudi' }}</option>
                                            <option value="Egyptian">{{ app()->getLocale() == 'ar' ? 'مصري' : 'Egyptian' }}</option>
                                            <option value="Emirati">{{ app()->getLocale() == 'ar' ? 'إماراتي' : 'Emirati' }}</option>
                                            <option value="American">{{ app()->getLocale() == 'ar' ? 'أمريكي' : 'American' }}</option>
                                            <!-- Add more nationalities as needed -->
                                        </select>
                                    </div>
                                    <!-- Phone Number with Country Code and Flag -->
                                    <div class="form-group">
                                        <label for="phone_number">{{ app()->getLocale() == 'ar' ? 'رقم الجوال' : 'Phone Number' }}</label>
                                        <div class="input-group">
                                            <div class="input-group-prepend">
                                                <select name="country_code" id="country_code" class="form-control" style="min-width: 110px;"></select>
                                            </div>
                                            <input type="text" class="form-control" id="phone_number" name="phone_number" value="{{ old('phone_number') }}" required>
                                        </div>
                                    </div>
                                    <!-- Gender -->
                                    <div class="form-group">
                                        <label for="gender">{{ app()->getLocale() == 'ar' ? 'الجنس' : 'Gender' }}</label>
                                        <select id="gender" name="gender" class="form-control" required>
                                            <option value="">{{ app()->getLocale() == 'ar' ? '-- اختر الجنس --' : '-- Select Gender --' }}</option>
                                            <option value="male">{{ app()->getLocale() == 'ar' ? 'ذكر' : 'Male' }}</option>
                                            <option value="female">{{ app()->getLocale() == 'ar' ? 'أنثى' : 'Female' }}</option>
                                            <option value="other">{{ app()->getLocale() == 'ar' ? 'آخر' : 'Other' }}</option>
                                        </select>
                                    </div>
                                    <!-- Password -->
                                    <div class="form-group">
                                        <label for="password">{{ app()->getLocale() == 'ar' ? 'كلمة المرور' : 'Password' }}</label>
                                        <input type="password" class="form-control" id="password" name="password" required autocomplete="new-password">
                                    </div>
                                    <!-- Confirm Password -->
                                    <div class="form-group">
                                        <label for="password_confirmation">{{ app()->getLocale() == 'ar' ? 'تأكيد كلمة المرور' : 'Confirm Password' }}</label>
                                        <input type="password" class="form-control" id="password_confirmation" name="password_confirmation" required>
                                    </div>
                                    <button type="submit" class="btn btn-primary btn-block">
                                        {{ app()->getLocale() == 'ar' ? 'إنشاء حساب جديد' : 'Register' }}
                                    </button>
                                </form>
                                <hr>
                                <div class="mt-3 text-center">
                                    <a href="{{ route('login', ['locale' => app()->getLocale()]) }}" class="btn btn-outline-primary ml-2">
                                        {{ app()->getLocale() == 'ar' ? 'لديك حساب بالفعل؟ تسجيل الدخول' : 'Already have an account? Login' }}
                                    </a>
                                </div>
                            </div>
                        </div>
                        <div class="mt-3 text-center">
                            <small class="text-muted">
                                {{ app()->getLocale() == 'ar'
                                    ? 'يرجى التأكد من صحة البيانات المدخلة. سيتم استخدام رقم الجوال والبريد الإلكتروني للتحقق من الحساب واستعادة كلمة المرور.'
                                    : 'Please ensure your information is correct. Your phone number and email will be used for account verification and password recovery.' }}
                            </small>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</section>

<!-- Country JS (flags, codes) -->
<script>
    // Example country data (add more as needed)
    const countries = [
        { name: "Saudi Arabia", code: "+966", flag: "🇸🇦" },
        { name: "Egypt", code: "+20", flag: "🇪🇬" },
        { name: "United Arab Emirates", code: "+971", flag: "🇦🇪" },
        { name: "United States", code: "+1", flag: "🇺🇸" },
        { name: "United Kingdom", code: "+44", flag: "🇬🇧" },
        { name: "India", code: "+91", flag: "🇮🇳" },
        { name: "Turkey", code: "+90", flag: "🇹🇷" },
        { name: "France", code: "+33", flag: "🇫🇷" },
        { name: "Germany", code: "+49", flag: "🇩🇪" },
        // ...add more countries
    ];

    const countrySelect = document.getElementById('country_code');
    if (countrySelect) {
        countries.forEach(country => {
            const option = document.createElement('option');
            option.value = country.code;
            option.textContent = `${country.flag} ${country.name} (${country.code})`;
            countrySelect.appendChild(option);
        });
    }
</script>

<!-- Vendor JS -->
<script src="{{ asset('/app-assets/vendors/js/vendors.min.js') }}"></script>
<!-- Theme JS -->
<script src="{{ asset('/app-assets/js/core/app-menu.js') }}"></script>
<script src="{{ asset('/app-assets/js/core/app.js') }}"></script>
<script src="{{ asset('/app-assets/js/scripts/components.js') }}"></script>

@include('auth.footer')
