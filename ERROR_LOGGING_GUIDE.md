# Comprehensive Error Logging System

## ✅ Features Implemented

### 1. **Global Error Handlers**
   - ✅ `window.onerror` - Catches all uncaught JavaScript errors
   - ✅ `unhandledrejection` - Catches unhandled promise rejections
   - ✅ React Error Boundary - Catches React component errors

### 2. **Enhanced Console Logging**
   - ✅ All `console.error()` calls are logged with full context
   - ✅ All `console.warn()` calls are logged
   - ✅ Error details include: timestamp, message, stack trace, error code, context

### 3. **Error Context**
   Each error is logged with:
   - Timestamp (ISO format)
   - Error message
   - Stack trace (if available)
   - Error code (Firebase errors, etc.)
   - Source (where error occurred)
   - Additional context (file, line, column, URL)

## 📊 What Gets Logged

### All Errors Are Logged:
1. **JavaScript Errors**
   - Syntax errors
   - Runtime errors
   - Type errors
   - Reference errors

2. **Promise Rejections**
   - Unhandled promise rejections
   - Async/await errors

3. **React Errors**
   - Component render errors
   - Component lifecycle errors
   - Hook errors

4. **Firebase Errors**
   - Firestore errors
   - Authentication errors
   - Storage errors

5. **Network Errors**
   - API call failures
   - Fetch errors
   - CORS errors

## 🔍 How to View Errors

### Browser Console
Open browser console (F12) and look for:
- 🚨 **ERROR:** - All errors with full context
- ⚠️ **WARNING:** - All warnings
- 📊 **Suppressed errors** - Errors that are logged but not shown (YouTube, etc.)

### Error Format
```
🚨 ERROR: {
  timestamp: "2026-02-07T12:34:56.789Z",
  message: "Error message here",
  stack: "Error stack trace...",
  name: "Error",
  code: "permission-denied",
  source: "console.error",
  args: [...]
}

Error Details: {
  name: "FirebaseError",
  message: "Missing or insufficient permissions.",
  stack: "...",
  code: "permission-denied"
}

Error Context: {
  source: "handleDeleteCourse",
  courseId: "abc123",
  userId: "user123"
}
```

## 🧪 Testing Error Logging

### Test 1: Uncaught Error
```javascript
// In browser console:
throw new Error('Test error');
// Should see: 🚨 ERROR with full details
```

### Test 2: Promise Rejection
```javascript
// In browser console:
Promise.reject(new Error('Test promise rejection'));
// Should see: 🚨 ERROR from unhandledrejection
```

### Test 3: React Error
- Cause a component to throw an error
- Should see: 🚨 ERROR from React Error Boundary
- UI shows error message with reload button

### Test 4: Firebase Error
- Try an operation without permissions
- Should see: 🚨 ERROR with Firebase error code and details

## 📝 Suppressed Errors (Still Logged)

These errors are logged but not shown in console.error to reduce noise:
- YouTube postMessage errors (logged as ⚠️ Suppressed)
- Message channel errors (logged as ⚠️ Suppressed)
- Passive event listener warnings (logged as ⚠️ Suppressed)

They still appear in console but with a different format to indicate they're suppressed.

## 🎯 Error Sources

Errors are tagged with their source:
- `window.onerror` - Uncaught JavaScript errors
- `unhandledrejection` - Promise rejections
- `React Error Boundary` - React component errors
- `console.error` - Explicit error logs
- `Firebase` - Firebase SDK errors
- Custom context - Function names, component names, etc.

## 🔧 Custom Error Logging

You can add custom context to errors:

```javascript
try {
  // Your code
} catch (error) {
  console.error(error, {
    source: 'myFunction',
    userId: user.id,
    action: 'deleteCourse',
    courseId: courseId
  });
}
```

This will log the error with your custom context.

## 📊 Error Logging Output

### Example Output:
```
🔍 Comprehensive error logging enabled
📊 All errors will be logged with full context
📝 Check console for detailed error information

🚨 ERROR: {
  timestamp: "2026-02-07T12:34:56.789Z",
  message: "Missing or insufficient permissions.",
  stack: "FirebaseError: Missing or insufficient permissions.\n    at ...",
  name: "FirebaseError",
  code: "permission-denied",
  source: "console.error",
  args: ["Error deleting course: FirebaseError: Missing or insufficient permissions."]
}

Error Details: {
  name: "FirebaseError",
  message: "Missing or insufficient permissions.",
  stack: "FirebaseError: Missing or insufficient permissions.\n    at ...",
  code: "permission-denied"
}

Error Context: {
  source: "console.error",
  args: ["Error deleting course: FirebaseError: Missing or insufficient permissions."]
}
```

## ⚙️ Configuration

### Enable/Disable Logging
To disable error logging, comment out the error handlers in `src/main.jsx`.

### Filter Errors
To filter specific errors, modify the suppression logic in `console.error` function.

## 🚀 Production Considerations

In production, you might want to:
1. Send errors to an error tracking service (Sentry, LogRocket, etc.)
2. Filter out sensitive information
3. Rate limit error logging
4. Group similar errors

## 📁 Files Modified

- `src/main.jsx` - Added comprehensive error logging system

---

**Status**: ✅ All errors are now logged with full context and details!
