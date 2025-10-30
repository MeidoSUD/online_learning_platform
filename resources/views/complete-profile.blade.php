@include('auth.header', ['title' => app()->getLocale() == 'ar' ? 'إكمال الملف الشخصي' : 'Complete Profile'])

<style>
    .wizard-section { display: none; }
    .wizard-section.active { display: block; }
    .wizard-nav { margin-bottom: 30px; }
    .wizard-nav .step { display: inline-block; padding: 10px 20px; border-radius: 20px; background: #f1f1f1; margin-right: 10px; }
    .wizard-nav .step.active { background: #2a0dad; color: #fff; font-weight: bold; }
    .wizard-btn { min-width: 120px; }
    .profile-img-preview { display: flex; justify-content: center; margin-bottom: 20px; }
    .profile-img-preview img { border-radius: 50%; max-width: 120px; max-height: 120px; object-fit: cover; box-shadow: 0 2px 8px #ccc; }
</style>

<div class="container mt-5 mb-5">
    <div class="row justify-content-center">
        <div class="col-md-8">
            <div class="card shadow rounded">
                <div class="card-header text-center" style="background-color: #77779f; color: white;">
                    <h4>{{ app()->getLocale() == 'ar' ? 'إكمال الملف الشخصي' : 'Complete Your Profile' }}</h4>
                    <div class="wizard-nav text-center mb-4">
                        <img src="{{ asset('logo.png') }}" alt="Ewan Geniuses Logo" style="max-width: 150px; height: auto; margin-bottom: 16px;">
                    </div>
                </div>
                <div class="card-body">
                    <div class="wizard-nav text-center mb-4">
                        <span class="step active" id="step1-nav">{{ app()->getLocale() == 'ar' ? 'الدور' : 'Role' }}</span>
                        <span class="step" id="step2-nav">{{ app()->getLocale() == 'ar' ? 'معلومات إضافية' : 'More Info' }}</span>
                        <span class="step" id="step3-nav">{{ app()->getLocale() == 'ar' ? 'الملف الشخصي' : 'Profile' }}</span>
                    </div>
                    <form id="wizardForm" method="POST" action="{{ route('profile.store') }}" enctype="multipart/form-data">
                        @csrf

                        <!-- Section 1: User Role -->
                        <div class="wizard-section active" id="section1">
                            <h5 class="mb-3">{{ app()->getLocale() == 'ar' ? 'اختر دورك' : 'Choose Your Role' }}</h5>
                            <div class="form-group">
                                <label>{{ app()->getLocale() == 'ar' ? 'الدور' : 'Role' }}</label>
                                <select name="role_id" id="role_id" class="form-control" required onchange="updateWizardByRole()">
                                    <option value="">{{ app()->getLocale() == 'ar' ? '-- اختر الدور --' : '-- Select Role --' }}</option>
                                    <option value="3">{{ app()->getLocale() == 'ar' ? 'معلم / مدرب' : 'Teacher / Coach' }}</option>
                                    <option value="4">{{ app()->getLocale() == 'ar' ? 'طالب' : 'Student' }}</option>
                                </select>
                            </div>
                            <div class="text-right mt-4">
                                <button type="button" class="btn btn-primary wizard-btn" onclick="nextSection(1)">
                                    {{ app()->getLocale() == 'ar' ? 'التالي' : 'Next' }}
                                </button>
                            </div>
                        </div>

                        <!-- Section 2: Dynamic based on Role -->
                        <div class="wizard-section" id="section2">
                            <!-- Student Fields -->
                            <div id="student-fields" style="display:none;">
                                <h5 class="mb-3">{{ app()->getLocale() == 'ar' ? 'معلومات التعليم للطالب' : 'Student Education Info' }}</h5>
                                <!-- Education Level -->
                                <div class="form-group">
                                    <label>{{ app()->getLocale() == 'ar' ? 'المستوى التعليمي' : 'Education Level' }}</label>
                                    @foreach($educationLevels as $level)
                                        <div class="form-check">
                                            <input type="radio" name="education_level" value="{{ $level->id }}" id="level{{ $level->id }}" class="form-check-input">
                                            <label for="level{{ $level->id }}" class="form-check-label">{{ $level->name_ar }}</label>
                                        </div>
                                    @endforeach
                                </div>

                                <!-- Class / Grade -->
                                <div class="form-group">
                                    <label>{{ app()->getLocale() == 'ar' ? 'الصف / الدرجة' : 'Class / Grade' }}</label>
                                    @foreach($classes as $class)
                                        <div class="form-check">
                                            <input type="radio" name="class_grade" value="{{ $class->id }}" id="class{{ $class->id }}" class="form-check-input">
                                            <label for="class{{ $class->id }}" class="form-check-label">{{ $class->name_ar }}</label>
                                        </div>
                                    @endforeach
                                </div>

                                <div class="form-group">
                                    <label>{{ app()->getLocale() == 'ar' ? 'المواد التي ترغب في تعلمها' : 'Subjects you want to learn' }}</label>
                                    @foreach($subjects as $subject)
                                        <div class="form-check">
                                            <input type="checkbox" name="learning_subjects[]" value="{{ $subject->id }}" id="subject{{ $subject->id }}" class="form-check-input">
                                            <label for="subject{{ $subject->id }}" class="form-check-label">{{ $subject->name_ar }}</label>
                                        </div>
                                    @endforeach
                                    <small class="text-muted">{{ app()->getLocale() == 'ar' ? 'يمكنك اختيار أكثر من مادة' : 'You can select multiple subjects.' }}</small>
                                </div>
                            </div>
                            <!-- Teacher Fields -->
                            <div id="teacher-fields" style="display:none;">
                                <h5 class="mb-3">{{ app()->getLocale() == 'ar' ? 'معلومات المعلم / المدرب' : 'Teacher / Coach Info' }}</h5>
                                <!-- Degrees -->
                                <div class="form-group">
                                    <label>{{ app()->getLocale() == 'ar' ? 'الدرجة العلمية' : 'Degree' }}</label>
                                    @foreach($degrees as $degree)
                                        <div class="form-check">
                                            <input type="checkbox" name="degrees[]" value="{{ $degree->id }}" id="degree{{ $degree->id }}" class="form-check-input">
                                            <label for="degree{{ $degree->id }}" class="form-check-label">{{ $degree->name_ar }}</label>
                                        </div>
                                    @endforeach
                                </div>

                                <!-- Achievements -->
                                

                                <div class="form-group">
                                    <label>{{ app()->getLocale() == 'ar' ? 'تحميل الشهادات' : 'Upload Certificates' }}</label>
                                    <input type="file" name="certificates[]" class="form-control-file" multiple accept=".pdf,image/*">
                                </div>
                                <div class="form-group">
                                    <label>{{ app()->getLocale() == 'ar' ? 'تحميل السيرة الذاتية' : 'Upload Resume' }}</label>
                                    <input type="file" name="resume" class="form-control-file" accept=".pdf,.doc,.docx">
                                </div>
                                <div class="form-group">
                                    <label>{{ app()->getLocale() == 'ar' ? 'نبذة عنك' : 'Your Bio' }}</label>
                                    <textarea name="bio" class="form-control" rows="3" placeholder="{{ app()->getLocale() == 'ar' ? 'اكتب نبذة مختصرة عنك' : 'Write a short bio about yourself' }}"></textarea>
                                </div>
                                <div class="form-group">
                                    <label>{{ app()->getLocale() == 'ar' ? 'نوع التعليم' : 'Type of Teaching' }}</label>
                                    <select name="teaching_type" class="form-control">
                                        <option value="">{{ app()->getLocale() == 'ar' ? '-- اختر النوع --' : '-- Select Type --' }}</option>
                                        <option value="lessons">{{ app()->getLocale() == 'ar' ? 'دروس' : 'Lessons' }}</option>
                                        <option value="courses">{{ app()->getLocale() == 'ar' ? 'دورات' : 'Courses' }}</option>
                                        <option value="both">{{ app()->getLocale() == 'ar' ? 'الاثنين معاً' : 'Both' }}</option>
                                    </select>
                                </div>
                            </div>
                            <div class="d-flex justify-content-between mt-4">
                                <button type="button" class="btn btn-secondary wizard-btn" onclick="prevSection(2)">
                                    {{ app()->getLocale() == 'ar' ? 'السابق' : 'Previous' }}
                                </button>
                                <button type="button" class="btn btn-primary wizard-btn" onclick="nextSection(2)">
                                    {{ app()->getLocale() == 'ar' ? 'التالي' : 'Next' }}
                                </button>
                            </div>
                        </div>

                        <!-- Section 3: Profile Photo (Student) or Profile Image Center (Teacher) -->
                        <div class="wizard-section" id="section3">
                            <h5 class="mb-3">{{ app()->getLocale() == 'ar' ? 'الصورة الشخصية' : 'Profile Photo' }}</h5>
                            <div class="profile-img-preview" id="profileImgPreview" style="display:none;">
                                <img id="profileImgTag" src="#" alt="Profile Preview" />
                            </div>
                            <div class="form-group text-center">
                                <input type="file" name="profile_photo" class="form-control-file" accept="image/*" required onchange="previewProfileImg(this)">
                                <small class="text-muted">{{ app()->getLocale() == 'ar' ? 'يرجى رفع صورة واضحة' : 'Please upload a clear photo.' }}</small>
                            </div>
                            <div class="form-group mt-4 text-center">
                                <div class="form-check d-inline-block">
                                    <input type="checkbox" name="terms_accepted" id="terms_accepted" class="form-check-input" required>
                                    <label for="terms_accepted" class="form-check-label">
                                        {!! app()->getLocale() == 'ar'
                                            ? 'أوافق على <a href="' . route('terms') . '" target="_blank" style="text-decoration: underline;">الشروط والأحكام</a>'
                                            : 'I accept the <a href="' . route('terms') . '" target="_blank" style="text-decoration: underline;">Terms and Conditions</a>' !!}
                                    </label>
                                </div>
                            </div>
                            <div class="d-flex justify-content-between mt-4">
                                <button type="button" class="btn btn-secondary wizard-btn" onclick="prevSection(3)">
                                    {{ app()->getLocale() == 'ar' ? 'السابق' : 'Previous' }}
                                </button>
                                <button type="submit" class="btn btn-success wizard-btn">
                                    {{ app()->getLocale() == 'ar' ? 'إكمال الملف' : 'Complete Profile' }}
                                </button>
                            </div>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    </div>
</div>

<script>
    function nextSection(current) {
        document.getElementById('section' + current).classList.remove('active');
        document.getElementById('step' + current + '-nav').classList.remove('active');
        document.getElementById('section' + (current + 1)).classList.add('active');
        document.getElementById('step' + (current + 1) + '-nav').classList.add('active');
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }
    function prevSection(current) {
        document.getElementById('section' + current).classList.remove('active');
        document.getElementById('step' + current + '-nav').classList.remove('active');
        document.getElementById('section' + (current - 1)).classList.add('active');
        document.getElementById('step' + (current - 1) + '-nav').classList.add('active');
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }
    function updateWizardByRole() {
        var role = document.getElementById('role_id').value;
        document.getElementById('student-fields').style.display = (role == '4') ? 'block' : 'none';
        document.getElementById('teacher-fields').style.display = (role == '3') ? 'block' : 'none';
    }
    function previewProfileImg(input) {
        var preview = document.getElementById('profileImgPreview');
        var imgTag = document.getElementById('profileImgTag');
        if (input.files && input.files[0]) {
            var reader = new FileReader();
            reader.onload = function(e) {
                imgTag.src = e.target.result;
                preview.style.display = 'flex';
            }
            reader.readAsDataURL(input.files[0]);
        } else {
            preview.style.display = 'none';
        }
    }
    // On page load, hide/show fields if role is preselected
    document.addEventListener('DOMContentLoaded', function() {
        updateWizardByRole();
    });
</script>

@include('auth.footer')