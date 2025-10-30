<!DOCTYPE html>
<html lang="en">

<head>
    <meta charset="UTF-8">
    <title>Test Payment Redirect</title>
    <meta name="csrf-token" content="{{ csrf_token() }}">
</head>

<body>
    <h2>Test Payment Redirect</h2>

    <button id="sendPayment">Send Payment Request</button>

    <script>
        document.getElementById('sendPayment').addEventListener('click', function() {
            // JSON data to send (same as Postman)
            const requestData = {
                "shopperResultUrl": "https://ewan-geniuses.com/api/payment/result",
                "student_id": 4,
                "teacher_id": 5,
                "amount": 100,
                "currency": "SAR",
                "payment_brand": "VISA",
                "entity_id": "8ac7a4c899b8ebd50199b95f5deb00d8",
                "card": {
                    "number": "4440000009900010",
                    "holder": "Test User",
                    "expiryMonth": "01",
                    "expiryYear": "2039",
                    "cvv": "100"
                },
                "customer": {
                    "email": "test@example.com",
                    "givenName": "Student",
                    "surname": "User"
                },
                "billing": {
                    "street1": "Test Street",
                    "city": "Riyadh",
                    "state": "Riyadh",
                    "country": "SA",
                    "postcode": "12345"
                }
            }
            // Add more fields based on your actual Postman request
        };

        fetch("{{ url('/api/payments/direct') }}", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "X-CSRF-TOKEN": document.querySelector('meta[name="csrf-token"]').getAttribute('content')
            },
            body: JSON.stringify(requestData)
        })
        .then(response => response.json())
        .then(data => {
            console.log("Response:", data);

            if (data.redirect && data.redirect.url) {
                // Redirect to the payment simulator or 3DS page
                window.location.href = data.redirect.url;
            } else {
                alert("Redirect URL not found in response.");
            }
        })
        .catch(error => {
            console.error("Error:", error);
            alert("An error occurred. Check the console for details.");
        });
        });
    </script>
</body>

</html>
