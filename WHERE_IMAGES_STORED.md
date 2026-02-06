# Where Are Uploaded Thumbnail Images Stored?

## Storage Location Summary

Uploaded thumbnail images are stored in **two possible locations** depending on file size:

## 📍 Location 1: Firestore Database (Default - FREE)

**For images under 800KB:**

- **Database**: Firestore
- **Collection Path**: `courses/{courseId}/modules/{moduleId}`
- **Field Name**: `thumbnailUrl`
- **Storage Format**: Base64 encoded string
- **Example Value**: 
  ```
  data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwCdABmX/9k=
  ```

**How to View:**
1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Navigate to **Firestore Database**
3. Open collection: `courses`
4. Select a course document
5. Open subcollection: `modules`
6. Select a module document
7. Look for field: `thumbnailUrl` (contains the Base64 image data)
8. Also see field: `thumbnailFilename` (contains the auto-generated filename)

## 📍 Location 2: Firebase Storage (If Enabled)

**For images over 800KB (or if Firebase Storage is enabled):**

- **Storage**: Firebase Storage
- **Bucket Path**: `module-thumbnails/{courseId}/{autoFilename}`
- **Example Path**: 
  ```
  module-thumbnails/5gGi8aXHNjX37Q8UiPfa/module_5gGi8aXHNjX37Q8UiPfa_p2LhU8MdB0CYvUzEuqSH_1770374406326_97unijm.jpeg
  ```

**How to View:**
1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Navigate to **Storage**
3. Open folder: `module-thumbnails`
4. Select course folder (e.g., `5gGi8aXHNjX37Q8UiPfa`)
5. See the uploaded image file with auto-generated name

## 🔍 How to Check Where Your Images Are Stored

### Method 1: Check Firestore (Most Common)

1. **Firebase Console** → **Firestore Database**
2. Navigate to: `courses` → `{your-course-id}` → `modules` → `{module-id}`
3. Look for `thumbnailUrl` field:
   - If it starts with `data:image/...` → **Stored in Firestore as Base64**
   - If it starts with `https://firebasestorage.googleapis.com/...` → **Stored in Firebase Storage**

### Method 2: Check Firebase Storage

1. **Firebase Console** → **Storage**
2. Look for folder: `module-thumbnails`
3. If folder exists and has files → **Some images are in Storage**
4. If folder doesn't exist → **All images are in Firestore (Base64)**

## 📊 Current Storage Method

**By default (FREE):**
- ✅ Images are stored as **Base64 strings in Firestore**
- ✅ No Firebase Storage setup needed
- ✅ Works immediately
- ✅ Images under 800KB only

**If Firebase Storage is enabled:**
- ✅ Larger images (>800KB) stored in Firebase Storage
- ✅ Smaller images still use Base64 in Firestore
- ✅ Storage path: `module-thumbnails/{courseId}/{filename}`

## 📝 Firestore Document Structure

When you upload a thumbnail, the module document looks like this:

```javascript
{
  title: "Module Title",
  description: "Description",
  order: 1,
  youtubeUrl: "https://youtube.com/watch?v=...",
  bunnyEmbedUrl: null,
  thumbnailUrl: "data:image/jpeg;base64,/9j/4AAQ...",  // ← Image stored here (Base64)
  thumbnailFilename: "module_courseId_moduleId_timestamp_random.jpg"  // ← Filename stored here
}
```

## 🎯 Quick Answer

**Where are images stored?**

- **Small images (<800KB)**: Inside Firestore document as Base64 string in `thumbnailUrl` field
- **Large images (>800KB)**: In Firebase Storage at `module-thumbnails/{courseId}/{filename}`

**Most common**: Images are stored **directly in the Firestore module document** as Base64 strings (free, no setup needed).
