<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Contact Support - Ewan Geniuses</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 20px;
        }
        
        .container {
            max-width: 600px;
            width: 100%;
            background: white;
            border-radius: 12px;
            box-shadow: 0 10px 40px rgba(0, 0, 0, 0.1);
            overflow: hidden;
        }
        
        .header {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 40px 20px;
            text-align: center;
        }
        
        .header h1 {
            font-size: 28px;
            margin-bottom: 10px;
        }
        
        .header p {
            font-size: 16px;
            opacity: 0.95;
            margin-bottom: 5px;
        }
        
        .header .subtitle {
            font-size: 14px;
            opacity: 0.8;
        }
        
        .content {
            padding: 40px;
        }
        
        .form-group {
            margin-bottom: 25px;
        }
        
        .form-group label {
            display: block;
            margin-bottom: 8px;
            color: #333;
            font-weight: 600;
            font-size: 14px;
        }
        
        .form-group input,
        .form-group textarea {
            width: 100%;
            padding: 12px;
            border: 2px solid #e0e0e0;
            border-radius: 6px;
            font-size: 14px;
            font-family: inherit;
            transition: all 0.3s ease;
        }
        
        .form-group input:focus,
        .form-group textarea:focus {
            outline: none;
            border-color: #667eea;
            box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
        }
        
        .form-group textarea {
            resize: vertical;
            min-height: 150px;
        }
        
        .form-group input::placeholder,
        .form-group textarea::placeholder {
            color: #999;
        }
        
        .form-group small {
            display: block;
            margin-top: 5px;
            color: #666;
            font-size: 12px;
        }
        
        .error-message {
            color: #dc3545;
            font-size: 13px;
            margin-top: 5px;
            display: none;
        }
        
        .form-group.error input,
        .form-group.error textarea {
            border-color: #dc3545;
        }
        
        .form-group.error .error-message {
            display: block;
        }
        
        .success-message {
            background-color: #d4edda;
            color: #155724;
            padding: 12px;
            border-radius: 6px;
            margin-bottom: 20px;
            display: none;
            border-left: 4px solid #28a745;
        }
        
        .success-message.show {
            display: block;
        }
        
        .button-group {
            display: flex;
            gap: 12px;
            margin-top: 30px;
        }
        
        .btn {
            flex: 1;
            padding: 12px 20px;
            border: none;
            border-radius: 6px;
            font-size: 14px;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.3s ease;
        }
        
        .btn-submit {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
        }
        
        .btn-submit:hover {
            transform: translateY(-2px);
            box-shadow: 0 5px 15px rgba(102, 126, 234, 0.4);
        }
        
        .btn-submit:active {
            transform: translateY(0);
        }
        
        .btn-submit:disabled {
            opacity: 0.6;
            cursor: not-allowed;
            transform: none;
        }
        
        .btn-reset {
            background: #f0f0f0;
            color: #333;
        }
        
        .btn-reset:hover {
            background: #e0e0e0;
        }
        
        .loading {
            display: none;
            text-align: center;
        }
        
        .spinner {
            border: 3px solid #f3f3f3;
            border-top: 3px solid #667eea;
            border-radius: 50%;
            width: 20px;
            height: 20px;
            animation: spin 1s linear infinite;
            margin: 0 auto 10px;
        }
        
        @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
        }
        
        .info-box {
            background: #f8f9fa;
            padding: 15px;
            border-radius: 6px;
            margin-bottom: 25px;
            border-left: 4px solid #667eea;
        }
        
        .info-box p {
            color: #555;
            font-size: 14px;
            line-height: 1.6;
            margin: 0;
        }
        
        .footer {
            text-align: center;
            padding: 20px;
            background: #f8f9fa;
            color: #666;
            font-size: 13px;
            border-top: 1px solid #e0e0e0;
        }
        
        .footer p {
            margin: 5px 0;
        }
        
        @media (max-width: 600px) {
            .container {
                border-radius: 0;
            }
            
            .header {
                padding: 30px 15px;
            }
            
            .content {
                padding: 25px;
            }
            
            .header h1 {
                font-size: 24px;
            }
            
            .button-group {
                flex-direction: column;
            }
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>Contact Support</h1>
            <p>We're here to help!</p>
            <p class="subtitle">Send us your questions or concerns</p>
        </div>
        
        <div class="content">
            <div class="info-box">
                <p>📧 Have a question? Need help? We'd love to hear from you. Fill out the form below and our support team will get back to you shortly.</p>
            </div>
            
            <div class="success-message" id="successMessage">
                ✓ Thank you! Your message has been sent successfully. We'll get back to you soon.
            </div>
            
            <form id="contactForm">
                <div class="form-group">
                    <label for="name">Full Name <span style="color: #dc3545;">*</span></label>
                    <input 
                        type="text" 
                        id="name" 
                        name="name" 
                        placeholder="Enter your full name"
                        required
                    >
                    <small>We'll use this to address you in our response</small>
                    <div class="error-message">Full name is required</div>
                </div>
                
                <div class="form-group">
                    <label for="email">Email Address <span style="color: #dc3545;">*</span></label>
                    <input 
                        type="email" 
                        id="email" 
                        name="email" 
                        placeholder="your.email@example.com"
                        required
                    >
                    <small>We'll send our response to this email</small>
                    <div class="error-message">Please enter a valid email</div>
                </div>
                
                <div class="form-group">
                    <label for="subject">Subject <span style="color: #dc3545;">*</span></label>
                    <input 
                        type="text" 
                        id="subject" 
                        name="subject" 
                        placeholder="What is this about?"
                        required
                    >
                    <small>Brief description of your inquiry</small>
                    <div class="error-message">Subject is required</div>
                </div>
                
                <div class="form-group">
                    <label for="message">Message <span style="color: #dc3545;">*</span></label>
                    <textarea 
                        id="message" 
                        name="message" 
                        placeholder="Please describe your issue or question in detail..."
                        required
                    ></textarea>
                    <small>The more details you provide, the better we can help</small>
                    <div class="error-message">Message is required and must be at least 10 characters</div>
                </div>
                
                <div class="button-group">
                    <button type="reset" class="btn btn-reset">Clear</button>
                    <button type="submit" class="btn btn-submit" id="submitBtn">Send Message</button>
                </div>
                
                <div class="loading" id="loading">
                    <div class="spinner"></div>
                    <p>Sending your message...</p>
                </div>
            </form>
        </div>
        
        <div class="footer">
            <p><strong>Response Time:</strong> We typically respond within 24-48 hours</p>
            <p><strong>Email:</strong> contact@ewan-geniuses.com</p>
            <p style="margin-top: 10px; padding-top: 10px; border-top: 1px solid #e0e0e0;">© 2025 Ewan Geniuses. All rights reserved.</p>
        </div>
    </div>
    
    <script>
        const form = document.getElementById('contactForm');
        const submitBtn = document.getElementById('submitBtn');
        const loading = document.getElementById('loading');
        const successMessage = document.getElementById('successMessage');
        
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            // Clear previous success message
            successMessage.classList.remove('show');
            
            // Validate form
            if (!validateForm()) {
                return;
            }
            
            // Show loading state
            submitBtn.disabled = true;
            loading.style.display = 'block';
            
            try {
                const formData = new FormData(form);
                
                const response = await fetch('{{ route("support.submit") }}', {
                    method: 'POST',
                    headers: {
                        'X-CSRF-TOKEN': '{{ csrf_token() }}',
                    },
                    body: formData
                });
                
                if (response.ok) {
                    // Show success message
                    successMessage.classList.add('show');
                    
                    // Reset form
                    form.reset();
                    
                    // Scroll to success message
                    successMessage.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
                    
                    // Hide success message after 5 seconds
                    setTimeout(() => {
                        successMessage.classList.remove('show');
                    }, 5000);
                } else {
                    const data = await response.json();
                    alert('Error: ' + (data.message || 'Failed to send message'));
                }
            } catch (error) {
                console.error('Error:', error);
                alert('An error occurred. Please try again later.');
            } finally {
                // Hide loading state
                submitBtn.disabled = false;
                loading.style.display = 'none';
            }
        });
        
        function validateForm() {
            let isValid = true;
            
            // Validate name
            const name = document.getElementById('name');
            if (name.value.trim().length < 2) {
                setError(name, 'Please enter at least 2 characters');
                isValid = false;
            } else {
                clearError(name);
            }
            
            // Validate email
            const email = document.getElementById('email');
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(email.value)) {
                setError(email, 'Please enter a valid email address');
                isValid = false;
            } else {
                clearError(email);
            }
            
            // Validate subject
            const subject = document.getElementById('subject');
            if (subject.value.trim().length < 3) {
                setError(subject, 'Subject must be at least 3 characters');
                isValid = false;
            } else {
                clearError(subject);
            }
            
            // Validate message
            const message = document.getElementById('message');
            if (message.value.trim().length < 10) {
                setError(message, 'Message must be at least 10 characters');
                isValid = false;
            } else {
                clearError(message);
            }
            
            return isValid;
        }
        
        function setError(input, message) {
            const formGroup = input.closest('.form-group');
            formGroup.classList.add('error');
            formGroup.querySelector('.error-message').textContent = message;
        }
        
        function clearError(input) {
            const formGroup = input.closest('.form-group');
            formGroup.classList.remove('error');
        }
        
        // Real-time validation
        document.getElementById('name').addEventListener('blur', function() {
            if (this.value.trim().length < 2) {
                setError(this, 'Please enter at least 2 characters');
            } else {
                clearError(this);
            }
        });
        
        document.getElementById('email').addEventListener('blur', function() {
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(this.value)) {
                setError(this, 'Please enter a valid email address');
            } else {
                clearError(this);
            }
        });
        
        document.getElementById('subject').addEventListener('blur', function() {
            if (this.value.trim().length < 3) {
                setError(this, 'Subject must be at least 3 characters');
            } else {
                clearError(this);
            }
        });
        
        document.getElementById('message').addEventListener('blur', function() {
            if (this.value.trim().length < 10) {
                setError(this, 'Message must be at least 10 characters');
            } else {
                clearError(this);
            }
        });
    </script>
</body>
</html>
