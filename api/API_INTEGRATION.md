# RuangKerja API Integration Guide

This document describes how to use the frontend API client (`api.js`) to communicate with the RuangKerja backend.

## Setup

1. **Include the API client in your HTML:**
   ```html
   <script src="api.js"></script>
   ```

2. **The API client is available as `RuangKerjaAPI` or `window.RuangKerjaAPI`**

## Configuration

The API client is pre-configured to connect to:
- **Backend URL:** `http://localhost:8080/api/v1`
- **Default Headers:** JSON content type

You can modify the `baseURL` in `api.js` if your backend runs on a different port or domain.

## Authentication

### Login
```javascript
const response = await RuangKerjaAPI.login('user@example.com', 'password123');

if (response.success && response.data.success) {
    console.log('Login successful:', response.data.user);
    // User data is automatically stored in localStorage
    // Auth token is automatically stored for future requests
} else {
    console.error('Login failed:', response.data.message);
}
```

### Register
```javascript
const response = await RuangKerjaAPI.register({
    name: 'John Doe',
    email: 'john@example.com',
    password: 'password123',
    confirmPassword: 'password123',
    phone: '+1234567890' // optional
});

if (response.success && response.data.success) {
    console.log('Registration successful:', response.data.user);
} else {
    console.error('Registration failed:', response.data.message);
}
```

### Logout
```javascript
await RuangKerjaAPI.logout();
// Clears all stored user data and tokens
```

### Check Authentication
```javascript
const isLoggedIn = RuangKerjaAPI.isAuthenticated();

// Or verify with backend
const authCheck = await RuangKerjaAPI.checkAuth();
if (!authCheck.success) {
    // Redirect to login
    window.location.href = '/login.html';
}
```

## Profile Management

### Get User Profile
```javascript
const userData = RuangKerjaAPI.getUserData(); // From localStorage
// OR
const response = await RuangKerjaAPI.getProfile(); // From backend
```

### Update Profile
```javascript
const response = await RuangKerjaAPI.updateProfile({
    name: 'Updated Name',
    email: 'new@example.com',
    phone: '+9876543210'
});
```

## Image Upload

### Upload Profile Image
```javascript
// From file input
const fileInput = document.getElementById('profile-image-input');
const file = fileInput.files[0];

if (file) {
    const response = await RuangKerjaAPI.uploadProfileImage(file);
    
    if (response.success) {
        console.log('Image uploaded:', response.data.imageUrl);
        // Update UI with new image
    } else {
        console.error('Upload failed:', response.error);
    }
}
```

### Delete Profile Image
```javascript
const response = await RuangKerjaAPI.deleteProfileImage();

if (response.success) {
    console.log('Image deleted successfully');
    // Update UI to remove image
}
```

## Error Handling

All API methods return a standardized response format:

```javascript
{
    success: true/false,
    data: {...}, // Response data (if successful)
    error: "Error message", // Error description (if failed)
    status: 200 // HTTP status code
}
```

### Example Error Handling
```javascript
try {
    const response = await RuangKerjaAPI.login(email, password);
    
    if (response.success) {
        // Handle success
        console.log('Login successful');
    } else {
        // Handle API error
        alert('Login failed: ' + response.error);
    }
} catch (error) {
    // Handle network/unexpected errors
    console.error('Network error:', error);
    alert('Connection failed. Please try again.');
}
```

## Backend API Endpoints

The following endpoints are available in the backend:

### Authentication
- `POST /api/v1/auth/login` - User login
- `POST /api/v1/auth/register` - User registration
- `GET /api/v1/auth/health` - Health check

### User Profile
- `GET /api/v1/user/profile/{userId}` - Get user profile
- `PUT /api/v1/user/profile/{userId}` - Update profile
- `POST /api/v1/user/profile/{userId}/image` - Upload profile image
- `DELETE /api/v1/user/profile/{userId}/image` - Delete profile image
- `GET /api/v1/user/all` - Get all users (admin)

### Images
- `GET /api/v1/images/{filename}` - Serve uploaded images

## File Upload Configuration

The backend supports:
- **Maximum file size:** 5MB
- **Supported formats:** JPG, JPEG, PNG, GIF, WebP, SVG
- **Upload directory:** `uploads/images/` (configurable)

## Database Schema Updates

The User entity now includes:
- `profile_image_url` - Public URL for the profile image
- `profile_image_path` - Server file path (for management)
- `image_upload_date` - When the image was uploaded
- `phone` - User's phone number

## Development Notes

1. **CORS is enabled** for all origins (`*`) - configure appropriately for production
2. **Password hashing** is not implemented yet - add bcrypt or similar for production
3. **Authentication tokens** - consider implementing JWT tokens for secure authentication
4. **File validation** - additional client-side validation can be added for better UX
5. **Image optimization** - consider adding image resizing/compression for performance

## Production Considerations

Before deploying to production:

1. **Update CORS configuration** to only allow your domain
2. **Implement password hashing** (bcrypt)
3. **Add JWT authentication** with proper token expiration
4. **Configure HTTPS** for secure communication
5. **Set up proper file upload limits** and virus scanning
6. **Add proper error logging** and monitoring
7. **Configure database connection pooling**
8. **Add rate limiting** to prevent abuse

## Testing

You can test the API using:
- **Swagger UI:** `http://localhost:8080/swagger-ui.html`
- **Browser Developer Tools:** Network tab to monitor requests
- **Postman/Insomnia:** Import the OpenAPI specification from `/api-docs`

## Support

For issues or questions:
1. Check the browser console for detailed error messages
2. Verify the backend is running on `http://localhost:8080`
3. Check network connectivity and CORS configuration
4. Review the Swagger documentation for endpoint specifications
