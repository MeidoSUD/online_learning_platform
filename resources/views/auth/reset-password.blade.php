@include('auth.header', ['title' => app()->getLocale() == 'ar' ? 'إستعادة كلمة السر' : 'Reset Password'])
                <section class="row flexbox-container">
                    <div class="col-xl-7 col-10 d-flex justify-content-center">
                        <div class="card bg-authentication rounded-0 mb-0 w-100">
                            <div class="row m-0">
                                <div class="col-lg-6 d-lg-block d-none text-center align-self-center p-0">
                                    <img src="../../../app-assets/images/pages/reset-password.png" alt="branding logo">
                                </div>
                                <div class="col-lg-6 col-12 p-0">
                                    <div class="card rounded-0 mb-0 px-2">
                                        <div class="card-header pb-1">
                                            <div class="card-title">
                                                <h4 class="mb-0">إستعادة كلمة السر</h4>
                                            </div>
                                        </div>
                                        <p class="px-2">إالرجاء إدخال كلمة السر</p>
                                        <div class="card-content">
                                            <div class="card-body pt-1">
                                                @if ($errors->any())
                                                    <div class="alert alert-danger mb-2">
                                                        <ul>
                                                            @foreach ($errors->all() as $error)
                                                                <li>{{ $error }}</li>
                                                            @endforeach
                                                        </ul>
                                                    </div>
                                                @endif
                                                <form method="POST" action="{{ route('password.update') }}">
                                                    @csrf
                                                    <!-- Password Reset Token -->
                                                    <input type="hidden" name="token"
                                                        value="{{ $request->route('token') }}">
                                                    <fieldset class="form-label-group">
                                                        <input type="text"
                                                            class="form-control @error('email') is-invalid @enderror"
                                                            id="user-email" placeholder="البريد الإلكتروني" required
                                                            name="email"
                                                            value="{{ old('email', $request->email) }}" autofocus
                                                            readonly>
                                                        <label for="user-email">البريد الإلكتروني</label>
                                                    </fieldset>

                                                    <fieldset class="form-label-group">
                                                        <input type="password" class="form-control"
                                                            id="user-password" placeholder="كلمة السر"
                                                            name="password" required>
                                                        <label for="user-password">كلمة السر</label>
                                                    </fieldset>

                                                    <fieldset class="form-label-group">
                                                        <input type="password" class="form-control"
                                                            id="user-confirm-password" placeholder="تأكيد كلمة السر"
                                                            required name="password_confirmation">
                                                        <label for="user-confirm-password">تأكيد كلمة السر</label>
                                                    </fieldset>
                                                    <div class="row pt-2">
                                                        <div class="col-12 col-md-6 mb-1">
                                                            <a href="/admin/login"
                                                                class="btn btn-outline-primary btn-block px-75">الرجوع
                                                                لتسجيل الدخول</a>
                                                        </div>
                                                        <div class="col-12 col-md-6 mb-1">
                                                            <button class="btn btn-primary btn-block px-75">إسترجاع
                                                            </button>
                                                        </div>
                                                    </div>
                                                </form>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>
@include('auth.footer')