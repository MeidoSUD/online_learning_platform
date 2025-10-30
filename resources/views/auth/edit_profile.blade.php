@extends('layouts.app')
@section('title', 'تعديل الصفحة الشخصية')
@section('content')
    <!-- Vertical Tabs start -->
    <section id="vertical-tabs">
        <div class="row">
            <div class="col-12 mt-3 mb-1">
                <h4 class="text-uppercase">تعديل المعلومات الشخصية</h4>
            </div>
        </div>
        <div class="row match-height">
            <div class="col-xl-12 col-lg-12">
                <div class="card overflow-hidden">
                    <div class="card-header">
                        <h4 class="card-title"> المعلومات الشخصية</h4>
                    </div>
                    <div class="card-content">
                        <div class="card-body">
                            <div class="nav-vertical">
                                <ul class="nav nav-tabs nav-left flex-column" role="tablist">
                                    <li class="nav-item">
                                        <a class="nav-link active" id="baseVerticalLeft-tab1" data-toggle="tab"
                                            aria-controls="tabVerticalLeft1" href="#tabVerticalLeft1" role="tab"
                                            aria-selected="true">المعلومات العامة</a>
                                    </li>
                                    <li class="nav-item">
                                        <a class="nav-link" id="baseVerticalLeft-tab2" data-toggle="tab"
                                            aria-controls="tabVerticalLeft2" href="#tabVerticalLeft2" role="tab"
                                            aria-selected="false">تعديل كلمة السر</a>
                                    </li>
                                </ul>
                                <div class="tab-content">
                                    <div class="tab-pane active" id="tabVerticalLeft1" role="tabpanel"
                                        aria-labelledby="baseVerticalLeft-tab1">
                                        <div class="container">
                                            @if ($errors->any())
                                                <div class="alert alert-danger mb-2">
                                                    <ul>
                                                        @foreach ($errors->all() as $error)
                                                            <li>{{ $error }}</li>
                                                        @endforeach
                                                    </ul>
                                                </div>
                                            @endif
                                            <form class="form form-vertical" action="/admin/update_profile" method="POST"
                                                enctype="multipart/form-data">
                                                @csrf
                                                <div class="form-body">
                                                    <div class="row">
                                                        <div class="col-6">
                                                            <div class="form-group">
                                                                <label for="first-name-vertical">الإسم</label>
                                                                <input type="text" id="first-name-vertical"
                                                                    class="form-control @error('name') is-invalid @enderror"
                                                                    name="name"
                                                                    value="{{ old('name', Auth::user()->name) }}"
                                                                    required>
                                                            </div>
                                                        </div>
                                                        <div class="col-6">
                                                            <div class="form-group">
                                                                <label for="email-id-vertical">البريد الألكتروني</label>
                                                                <input type="email" id="email-id-vertical"
                                                                    class="form-control @error('email') is-invalid @enderror"
                                                                    name="email"
                                                                    value="{{ old('email', Auth::user()->email) }}"
                                                                    required>
                                                            </div>
                                                        </div>
                                                        <div class="col-6">
                                                            <div class="form-group">
                                                                <label for="contact-info-vertical">رقم الهاتف</label>
                                                                <input type="number" id="contact-info-vertical"
                                                                    class="form-control @error('phone') is-invalid @enderror"
                                                                    name="phone"
                                                                    value="{{ old('phone', Auth::user()->phone) }}"
                                                                    required>
                                                            </div>
                                                        </div>
                                                        <div class="col-6">
                                                            <div class="form-group">
                                                                <label for="password-vertical">حالة الحساب</label>
                                                                <select name="is_active" id=""
                                                                    class="form-control @error('is_active') is-invalid @enderror"
                                                                    required>
                                                                    <option value="1"@selected(old('is_active', Auth::user()->is_active) == 1)>نشط
                                                                    </option>
                                                                    <option value="0"@selected(old('is_active', Auth::user()->is_active) == 0)>غير
                                                                        نشط</option>
                                                                </select>
                                                            </div>
                                                        </div>
                                                        <div class="col-6">
                                                            <div class="form-group">
                                                                <label>الصورة الشخصية</label>
                                                                <input type="file"
                                                                    class="form-control @error('profile_pic') is-invalid @enderror"
                                                                    name="profile_pic">
                                                            </div>
                                                        </div>
                                                        <div class="col-12">
                                                            <button type="submit"
                                                                class="btn btn-success mr-1 mb-1">تعديل</button>
                                                        </div>
                                                    </div>
                                                </div>
                                            </form>
                                        </div>

                                    </div>
                                    <div class="tab-pane" id="tabVerticalLeft2" role="tabpanel"
                                        aria-labelledby="baseVerticalLeft-tab2">
                                        <div class="container">
                                            @if ($errors->any())
                                                <div class="alert alert-danger mb-2">
                                                    <ul>
                                                        @foreach ($errors->all() as $error)
                                                            <li>{{ $error }}</li>
                                                        @endforeach
                                                    </ul>
                                                </div>
                                            @endif
                                            <form class="form form-vertical" action="/admin/update_password" method="POST"
                                                enctype="multipart/form-data">
                                                @csrf
                                                <div class="form-body">
                                                    <div class="row">
                                                        <div class="col-6">
                                                            <div class="form-group">
                                                                <label for="first-name-vertical">كلمة السر الجديدة</label>
                                                                <input type="password" id="first-name-vertical"
                                                                    class="form-control @error('password') is-invalid @enderror"
                                                                    name="password" required>
                                                            </div>
                                                        </div>
                                                        <div class="col-6">
                                                            <div class="form-group">
                                                                <label for="email-id-vertical">تأكيد كلمة السر
                                                                    الجديدة</label>
                                                                <input type="password" id="email-id-vertical"
                                                                    class="form-control @error('password_confirmation') is-invalid @enderror"
                                                                    name="password_confirmation" required>
                                                            </div>
                                                        </div>
                                                        <div class="col-12">
                                                            <button type="submit"
                                                                class="btn btn-success mr-1 mb-1">تعديل</button>
                                                        </div>
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
            </div>
        </div>
    </section>
    <!-- Vertical Tabs end -->

@endsection
