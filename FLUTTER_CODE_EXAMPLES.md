================================================================================
FLUTTER CODE EXAMPLES — IMPLEMENTATION SNIPPETS
================================================================================

These are quick reference examples showing how to implement the auth/profile
flows in your Flutter app using the API endpoints documented in prompts.txt

================================================================================
SECTION 1: LOGIN IMPLEMENTATIONS
================================================================================

1.1) LOGIN WITH EMAIL
─────────────────────────────────────────────────────────────────────────────

Future<void> loginWithEmail(String email, String password, String? fcmToken) async {
  try {
    final response = await http.post(
      Uri.parse('$API_BASE_URL/auth/login'),
      headers: {'Content-Type': 'application/json'},
      body: jsonEncode({
        'email': email,
        'password': password,
        if (fcmToken != null) 'fcm_token': fcmToken,
      }),
    );

    if (response.statusCode == 200) {
      final data = jsonDecode(response.body);
      final token = data['token'];
      final user = data['user']['data'];
      
      // Store token securely
      await _secureStorage.write(key: 'auth_token', value: token);
      
      // Update app state
      _setUserData(user);
      _navigateToDashboard();
      
      // Show welcome message
      showSuccessSnackBar('Welcome ${user['first_name']}!');
    } else if (response.statusCode == 422) {
      final errors = jsonDecode(response.body)['errors'];
      showErrorSnackBar(errors['email'][0]);
    }
  } catch (e) {
    showErrorSnackBar('Network error: $e');
  }
}

─────────────────────────────────────────────────────────────────────────────

1.2) LOGIN WITH PHONE NUMBER
─────────────────────────────────────────────────────────────────────────────

Future<void> loginWithPhone(String phoneNumber, String password, String? fcmToken) async {
  try {
    final response = await http.post(
      Uri.parse('$API_BASE_URL/auth/login'),
      headers: {'Content-Type': 'application/json'},
      body: jsonEncode({
        'phone_number': phoneNumber,
        'password': password,
        if (fcmToken != null) 'fcm_token': fcmToken,
      }),
    );

    if (response.statusCode == 200) {
      final data = jsonDecode(response.body);
      final token = data['token'];
      final user = data['user']['data'];
      
      await _secureStorage.write(key: 'auth_token', value: token);
      _setUserData(user);
      _navigateToDashboard();
      
      showSuccessSnackBar('Welcome ${user['first_name']}!');
    } else if (response.statusCode == 422) {
      showErrorSnackBar('Invalid phone number or password');
    }
  } catch (e) {
    showErrorSnackBar('Login failed: $e');
  }
}

─────────────────────────────────────────────────────────────────────────────

1.3) LOGIN SCREEN WITH EMAIL/PHONE TOGGLE
─────────────────────────────────────────────────────────────────────────────

class LoginScreen extends StatefulWidget {
  @override
  _LoginScreenState createState() => _LoginScreenState();
}

class _LoginScreenState extends State<LoginScreen> {
  bool _useEmail = true;  // Toggle between email and phone
  final _identifierController = TextEditingController();
  final _passwordController = TextEditingController();
  bool _isLoading = false;

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: Text('Login')),
      body: SingleChildScrollView(
        padding: EdgeInsets.all(16),
        child: Column(
          children: [
            // Toggle buttons
            Row(
              children: [
                Expanded(
                  child: ElevatedButton(
                    onPressed: () => setState(() => _useEmail = true),
                    style: ElevatedButton.styleFrom(
                      backgroundColor: _useEmail ? Colors.blue : Colors.grey,
                    ),
                    child: Text('Email'),
                  ),
                ),
                SizedBox(width: 8),
                Expanded(
                  child: ElevatedButton(
                    onPressed: () => setState(() => _useEmail = false),
                    style: ElevatedButton.styleFrom(
                      backgroundColor: !_useEmail ? Colors.blue : Colors.grey,
                    ),
                    child: Text('Phone'),
                  ),
                ),
              ],
            ),
            SizedBox(height: 24),

            // Input field
            TextField(
              controller: _identifierController,
              decoration: InputDecoration(
                labelText: _useEmail ? 'Email Address' : 'Phone Number',
                hintText: _useEmail 
                  ? 'user@example.com' 
                  : '+966501234567',
                border: OutlineInputBorder(),
              ),
              keyboardType: _useEmail 
                ? TextInputType.emailAddress 
                : TextInputType.phone,
            ),
            SizedBox(height: 16),

            // Password field
            TextField(
              controller: _passwordController,
              decoration: InputDecoration(
                labelText: 'Password',
                border: OutlineInputBorder(),
              ),
              obscureText: true,
            ),
            SizedBox(height: 24),

            // Login button
            SizedBox(
              width: double.infinity,
              child: ElevatedButton(
                onPressed: _isLoading ? null : _handleLogin,
                child: _isLoading 
                  ? CircularProgressIndicator()
                  : Text('Login'),
              ),
            ),

            // Forgot password link
            TextButton(
              onPressed: () => _navigateToForgotPassword(),
              child: Text('Forgot Password?'),
            ),
          ],
        ),
      ),
    );
  }

  void _handleLogin() async {
    setState(() => _isLoading = true);
    try {
      String? fcmToken = await _getFCMToken();
      
      if (_useEmail) {
        await loginWithEmail(
          _identifierController.text,
          _passwordController.text,
          fcmToken,
        );
      } else {
        await loginWithPhone(
          _identifierController.text,
          _passwordController.text,
          fcmToken,
        );
      }
    } finally {
      setState(() => _isLoading = false);
    }
  }

  void _navigateToForgotPassword() {
    Navigator.push(
      context,
      MaterialPageRoute(builder: (context) => ForgotPasswordScreen()),
    );
  }
}

================================================================================
SECTION 2: REGISTRATION & VERIFICATION
================================================================================

2.1) REGISTER NEW USER
─────────────────────────────────────────────────────────────────────────────

Future<void> register({
  required String firstName,
  required String lastName,
  required String email,
  required String phoneNumber,
  required String gender,  // 'male' or 'female'
  required String nationality,
  required int roleId,     // 3 = teacher, 4 = student
}) async {
  try {
    final response = await http.post(
      Uri.parse('$API_BASE_URL/auth/register'),
      headers: {'Content-Type': 'application/json'},
      body: jsonEncode({
        'first_name': firstName,
        'last_name': lastName,
        'email': email,
        'phone_number': phoneNumber,
        'gender': gender,
        'nationality': nationality,
        'role_id': roleId,
      }),
    );

    if (response.statusCode == 200) {
      final data = jsonDecode(response.body);
      final userId = data['user']['id'];
      
      // Show success and navigate to verification
      showSuccessSnackBar('Registration successful! Please verify your phone.');
      Navigator.pushReplacement(
        context,
        MaterialPageRoute(
          builder: (context) => PhoneVerificationScreen(userId: userId),
        ),
      );
    } else {
      showErrorSnackBar('Registration failed. Please try again.');
    }
  } catch (e) {
    showErrorSnackBar('Error: $e');
  }
}

─────────────────────────────────────────────────────────────────────────────

2.2) PHONE VERIFICATION (OTP)
─────────────────────────────────────────────────────────────────────────────

class PhoneVerificationScreen extends StatefulWidget {
  final int userId;
  
  PhoneVerificationScreen({required this.userId});

  @override
  _PhoneVerificationScreenState createState() => _PhoneVerificationScreenState();
}

class _PhoneVerificationScreenState extends State<PhoneVerificationScreen> {
  final _otpController = TextEditingController();
  bool _isLoading = false;
  int _resendCountdown = 0;

  @override
  void initState() {
    super.initState();
    _startResendCountdown();
  }

  void _startResendCountdown() {
    _resendCountdown = 30;
    Timer.periodic(Duration(seconds: 1), (timer) {
      setState(() {
        _resendCountdown--;
        if (_resendCountdown == 0) {
          timer.cancel();
        }
      });
    });
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: Text('Verify Phone')),
      body: Padding(
        padding: EdgeInsets.all(24),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Text(
              'Enter the 6-digit code sent to your phone',
              style: Theme.of(context).textTheme.bodyLarge,
            ),
            SizedBox(height: 32),

            // OTP input
            TextField(
              controller: _otpController,
              decoration: InputDecoration(
                labelText: 'Verification Code',
                border: OutlineInputBorder(),
              ),
              keyboardType: TextInputType.number,
              maxLength: 6,
            ),
            SizedBox(height: 32),

            // Verify button
            SizedBox(
              width: double.infinity,
              child: ElevatedButton(
                onPressed: _isLoading ? null : _verifyCode,
                child: _isLoading
                  ? CircularProgressIndicator()
                  : Text('Verify'),
              ),
            ),
            SizedBox(height: 16),

            // Resend button
            if (_resendCountdown == 0)
              TextButton(
                onPressed: _resendCode,
                child: Text('Resend Code'),
              )
            else
              Text('Resend in $_resendCountdown seconds'),
          ],
        ),
      ),
    );
  }

  void _verifyCode() async {
    setState(() => _isLoading = true);
    try {
      final response = await http.post(
        Uri.parse('$API_BASE_URL/auth/verify'),
        headers: {'Content-Type': 'application/json'},
        body: jsonEncode({
          'user_id': widget.userId,
          'code': _otpController.text,
        }),
      );

      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);
        final token = data['token'];
        
        // Store token
        await _secureStorage.write(key: 'auth_token', value: token);
        
        // Navigate to profile setup
        Navigator.pushReplacementNamed(context, '/complete-profile');
      } else {
        showErrorSnackBar('Invalid code. Please try again.');
      }
    } finally {
      setState(() => _isLoading = false);
    }
  }

  void _resendCode() async {
    final response = await http.post(
      Uri.parse('$API_BASE_URL/auth/resend-code'),
      headers: {'Content-Type': 'application/json'},
      body: jsonEncode({'user_id': widget.userId}),
    );

    if (response.statusCode == 200) {
      showSuccessSnackBar('Code resent to your phone');
      setState(() => _startResendCountdown());
    }
  }
}

================================================================================
SECTION 3: PASSWORD RESET
================================================================================

3.1) FORGOT PASSWORD SCREEN (STEP 1: REQUEST CODE)
─────────────────────────────────────────────────────────────────────────────

class ForgotPasswordScreen extends StatefulWidget {
  @override
  _ForgotPasswordScreenState createState() => _ForgotPasswordScreenState();
}

class _ForgotPasswordScreenState extends State<ForgotPasswordScreen> {
  bool _useEmail = true;  // Toggle between email and phone
  final _identifierController = TextEditingController();
  bool _isLoading = false;

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: Text('Reset Password')),
      body: SingleChildScrollView(
        padding: EdgeInsets.all(24),
        child: Column(
          children: [
            Text(
              'Choose how you want to receive your reset code',
              style: Theme.of(context).textTheme.bodyLarge,
            ),
            SizedBox(height: 32),

            // Toggle buttons
            Row(
              children: [
                Expanded(
                  child: ElevatedButton(
                    onPressed: () => setState(() => _useEmail = true),
                    style: ElevatedButton.styleFrom(
                      backgroundColor: _useEmail ? Colors.blue : Colors.grey,
                    ),
                    child: Text('Email'),
                  ),
                ),
                SizedBox(width: 8),
                Expanded(
                  child: ElevatedButton(
                    onPressed: () => setState(() => _useEmail = false),
                    style: ElevatedButton.styleFrom(
                      backgroundColor: !_useEmail ? Colors.blue : Colors.grey,
                    ),
                    child: Text('Phone'),
                  ),
                ),
              ],
            ),
            SizedBox(height: 32),

            // Input field
            TextField(
              controller: _identifierController,
              decoration: InputDecoration(
                labelText: _useEmail ? 'Email Address' : 'Phone Number',
                border: OutlineInputBorder(),
              ),
              keyboardType: _useEmail 
                ? TextInputType.emailAddress 
                : TextInputType.phone,
            ),
            SizedBox(height: 32),

            // Send code button
            SizedBox(
              width: double.infinity,
              child: ElevatedButton(
                onPressed: _isLoading ? null : _sendResetCode,
                child: _isLoading
                  ? CircularProgressIndicator()
                  : Text('Send Reset Code'),
              ),
            ),
          ],
        ),
      ),
    );
  }

  void _sendResetCode() async {
    setState(() => _isLoading = true);
    try {
      final response = await http.post(
        Uri.parse('$API_BASE_URL/auth/reset-password'),
        headers: {'Content-Type': 'application/json'},
        body: jsonEncode({
          if (_useEmail)
            'email': _identifierController.text
          else
            'phone_number': _identifierController.text,
        }),
      );

      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);
        final userId = data['user']['id'];
        
        showSuccessSnackBar(data['message']);
        
        Navigator.pushReplacement(
          context,
          MaterialPageRoute(
            builder: (context) => ResetPasswordVerificationScreen(userId: userId),
          ),
        );
      } else if (response.statusCode == 404) {
        showErrorSnackBar('User not found');
      }
    } finally {
      setState(() => _isLoading = false);
    }
  }
}

─────────────────────────────────────────────────────────────────────────────

3.2) VERIFY RESET CODE (STEP 2)
─────────────────────────────────────────────────────────────────────────────

class ResetPasswordVerificationScreen extends StatefulWidget {
  final int userId;
  
  ResetPasswordVerificationScreen({required this.userId});

  @override
  _ResetPasswordVerificationScreenState createState() => 
    _ResetPasswordVerificationScreenState();
}

class _ResetPasswordVerificationScreenState extends State<ResetPasswordVerificationScreen> {
  final _codeController = TextEditingController();
  bool _isLoading = false;

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: Text('Verify Code')),
      body: Padding(
        padding: EdgeInsets.all(24),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Text('Enter the code we sent you'),
            SizedBox(height: 24),

            TextField(
              controller: _codeController,
              decoration: InputDecoration(
                labelText: 'Verification Code',
                border: OutlineInputBorder(),
              ),
              keyboardType: TextInputType.number,
              maxLength: 6,
            ),
            SizedBox(height: 24),

            SizedBox(
              width: double.infinity,
              child: ElevatedButton(
                onPressed: _isLoading ? null : _verifyCode,
                child: _isLoading
                  ? CircularProgressIndicator()
                  : Text('Verify Code'),
              ),
            ),
          ],
        ),
      ),
    );
  }

  void _verifyCode() async {
    setState(() => _isLoading = true);
    try {
      final response = await http.post(
        Uri.parse('$API_BASE_URL/auth/verify-reset-code'),
        headers: {'Content-Type': 'application/json'},
        body: jsonEncode({
          'user_id': widget.userId,
          'code': _codeController.text,
        }),
      );

      if (response.statusCode == 200) {
        showSuccessSnackBar('Code verified!');
        Navigator.pushReplacement(
          context,
          MaterialPageRoute(
            builder: (context) => NewPasswordScreen(
              userId: widget.userId,
              code: _codeController.text,
            ),
          ),
        );
      } else {
        showErrorSnackBar('Invalid code');
      }
    } finally {
      setState(() => _isLoading = false);
    }
  }
}

─────────────────────────────────────────────────────────────────────────────

3.3) SET NEW PASSWORD (STEP 3)
─────────────────────────────────────────────────────────────────────────────

class NewPasswordScreen extends StatefulWidget {
  final int userId;
  final String code;
  
  NewPasswordScreen({required this.userId, required this.code});

  @override
  _NewPasswordScreenState createState() => _NewPasswordScreenState();
}

class _NewPasswordScreenState extends State<NewPasswordScreen> {
  final _passwordController = TextEditingController();
  final _confirmController = TextEditingController();
  bool _isLoading = false;
  bool _showPassword = false;

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: Text('Set New Password')),
      body: Padding(
        padding: EdgeInsets.all(24),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            // Password strength indicator
            PasswordStrengthIndicator(
              password: _passwordController.text,
            ),
            SizedBox(height: 24),

            // New password
            TextField(
              controller: _passwordController,
              decoration: InputDecoration(
                labelText: 'New Password',
                border: OutlineInputBorder(),
                suffixIcon: IconButton(
                  icon: Icon(_showPassword ? Icons.visibility : Icons.visibility_off),
                  onPressed: () => setState(() => _showPassword = !_showPassword),
                ),
              ),
              obscureText: !_showPassword,
            ),
            SizedBox(height: 16),

            // Confirm password
            TextField(
              controller: _confirmController,
              decoration: InputDecoration(
                labelText: 'Confirm Password',
                border: OutlineInputBorder(),
                errorText: _passwordController.text != _confirmController.text
                  ? 'Passwords do not match'
                  : null,
              ),
              obscureText: !_showPassword,
            ),
            SizedBox(height: 32),

            // Reset button
            SizedBox(
              width: double.infinity,
              child: ElevatedButton(
                onPressed: _isLoading || _passwordController.text != _confirmController.text
                  ? null
                  : _resetPassword,
                child: _isLoading
                  ? CircularProgressIndicator()
                  : Text('Reset Password'),
              ),
            ),
          ],
        ),
      ),
    );
  }

  void _resetPassword() async {
    setState(() => _isLoading = true);
    try {
      final response = await http.post(
        Uri.parse('$API_BASE_URL/auth/confirm-password'),
        headers: {'Content-Type': 'application/json'},
        body: jsonEncode({
          'user_id': widget.userId,
          'code': widget.code,
          'new_password': _passwordController.text,
          'new_password_confirmation': _confirmController.text,
        }),
      );

      if (response.statusCode == 200) {
        showSuccessSnackBar('Password reset successfully!');
        Navigator.pushNamedAndRemoveUntil(
          context,
          '/login',
          (route) => false,
        );
      } else {
        showErrorSnackBar('Failed to reset password');
      }
    } finally {
      setState(() => _isLoading = false);
    }
  }
}

================================================================================
SECTION 4: PROFILE UPDATES (LOGGED-IN USER)
================================================================================

4.1) CHANGE PASSWORD (LOGGED-IN)
─────────────────────────────────────────────────────────────────────────────

Future<void> changePassword({
  required String currentPassword,
  required String newPassword,
  required String token,
}) async {
  try {
    final response = await http.post(
      Uri.parse('$API_BASE_URL/auth/change-password'),
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer $token',
      },
      body: jsonEncode({
        'current_password': currentPassword,
        'new_password': newPassword,
        'new_password_confirmation': newPassword,
      }),
    );

    if (response.statusCode == 200) {
      showSuccessSnackBar('Password changed successfully');
      // Optionally log out and redirect to login
      await logout();
      Navigator.pushNamedAndRemoveUntil(context, '/login', (route) => false);
    } else {
      showErrorSnackBar('Current password is incorrect');
    }
  } catch (e) {
    showErrorSnackBar('Error: $e');
  }
}

─────────────────────────────────────────────────────────────────────────────

4.2) UPDATE PROFILE (LOGGED-IN)
─────────────────────────────────────────────────────────────────────────────

Future<void> updateProfile({
  required String firstName,
  required String lastName,
  required String bio,
  required String languagePref,
  File? profilePhoto,
  required String token,
}) async {
  try {
    var request = http.MultipartRequest(
      'PUT',
      Uri.parse('$API_BASE_URL/profile/profile/update'),
    );

    request.headers['Authorization'] = 'Bearer $token';

    // Add fields
    request.fields['first_name'] = firstName;
    request.fields['last_name'] = lastName;
    request.fields['bio'] = bio;
    request.fields['language_pref'] = languagePref;

    // Add file if selected
    if (profilePhoto != null) {
      request.files.add(
        http.MultipartFile(
          'profile_photo',
          profilePhoto.readAsBytes().asStream(),
          profilePhoto.lengthSync(),
          filename: profilePhoto.path.split('/').last,
        ),
      );
    }

    final response = await request.send();

    if (response.statusCode == 200) {
      showSuccessSnackBar('Profile updated successfully');
      // Refresh user data
      await getUserDetails(token);
    } else {
      showErrorSnackBar('Failed to update profile');
    }
  } catch (e) {
    showErrorSnackBar('Error: $e');
  }
}

─────────────────────────────────────────────────────────────────────────────

4.3) TEACHER PRICING UPDATE
─────────────────────────────────────────────────────────────────────────────

Future<void> updateTeacherInfo({
  required String bio,
  required bool teachIndividual,
  required double individualHourPrice,
  required bool teachGroup,
  required double groupHourPrice,
  required int maxGroupSize,
  required List<int> subjectIds,
  required String token,
}) async {
  try {
    final response = await http.post(
      Uri.parse('$API_BASE_URL/profile/teacher/info'),
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer $token',
      },
      body: jsonEncode({
        'bio': bio,
        'teach_individual': teachIndividual,
        'individual_hour_price': individualHourPrice,
        'teach_group': teachGroup,
        'group_hour_price': groupHourPrice,
        'max_group_size': maxGroupSize,
        'subject_ids': subjectIds,
      }),
    );

    if (response.statusCode == 200) {
      showSuccessSnackBar('Teaching info updated');
      // Refresh teacher data
      await getFullTeacherData(token);
    } else {
      showErrorSnackBar('Failed to update teaching info');
    }
  } catch (e) {
    showErrorSnackBar('Error: $e');
  }
}

================================================================================
SECTION 5: UTILITY FUNCTIONS
================================================================================

// Secure storage setup
final _secureStorage = FlutterSecureStorage();

// Get stored auth token
Future<String?> getAuthToken() async {
  return await _secureStorage.read(key: 'auth_token');
}

// Get FCM token
Future<String?> _getFCMToken() async {
  try {
    return await FirebaseMessaging.instance.getToken();
  } catch (e) {
    print('Error getting FCM token: $e');
    return null;
  }
}

// Generic API call helper
Future<http.Response> apiCall({
  required String method,
  required String endpoint,
  required Map<String, dynamic> body,
  bool requiresAuth = true,
}) async {
  final token = await getAuthToken();
  
  final headers = {
    'Content-Type': 'application/json',
    if (requiresAuth && token != null) 'Authorization': 'Bearer $token',
  };

  if (method == 'POST') {
    return http.post(
      Uri.parse('$API_BASE_URL$endpoint'),
      headers: headers,
      body: jsonEncode(body),
    );
  } else if (method == 'PUT') {
    return http.put(
      Uri.parse('$API_BASE_URL$endpoint'),
      headers: headers,
      body: jsonEncode(body),
    );
  }
  
  throw Exception('Unsupported method: $method');
}

// Error handling helper
void showErrorSnackBar(String message) {
  ScaffoldMessenger.of(context).showSnackBar(
    SnackBar(
      content: Text(message),
      backgroundColor: Colors.red,
    ),
  );
}

// Success feedback
void showSuccessSnackBar(String message) {
  ScaffoldMessenger.of(context).showSnackBar(
    SnackBar(
      content: Text(message),
      backgroundColor: Colors.green,
    ),
  );
}

================================================================================
END OF CODE EXAMPLES
================================================================================

For complete API documentation, see: prompts.txt
For quick reference, see: FLUTTER_AI_AGENT_GUIDE.md
