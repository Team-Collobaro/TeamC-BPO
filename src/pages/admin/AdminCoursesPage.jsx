import { useState, useEffect } from 'react';
import { collection, getDocs, doc, setDoc, updateDoc, deleteDoc } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { AdminLayout } from '../../components/AdminLayout';

export const AdminCoursesPage = () => {
  const [courses, setCourses] = useState([]);
  const [selectedCourseId, setSelectedCourseId] = useState(null);
  const [modules, setModules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modulesLoading, setModulesLoading] = useState(false);
  
  // Form states
  const [showCourseForm, setShowCourseForm] = useState(false);
  const [showModuleForm, setShowModuleForm] = useState(false);
  const [editingModule, setEditingModule] = useState(null);
  
  // Course form
  const [courseTitle, setCourseTitle] = useState('');
  const [courseDescription, setCourseDescription] = useState('');
  
  // Module form
  const [moduleTitle, setModuleTitle] = useState('');
  const [moduleDescription, setModuleDescription] = useState('');
  const [moduleOrder, setModuleOrder] = useState(1);
  const [youtubeUrl, setYoutubeUrl] = useState('');
  const [bunnyEmbedUrl, setBunnyEmbedUrl] = useState('');
  const [thumbnailFile, setThumbnailFile] = useState(null);
  const [thumbnailUrl, setThumbnailUrl] = useState('');
  const [thumbnailImageUrl, setThumbnailImageUrl] = useState('');
  const [thumbnailFilename, setThumbnailFilename] = useState('');
  const [thumbnailUploading, setThumbnailUploading] = useState(false);
  const [mcqQuestions, setMcqQuestions] = useState([]);

  useEffect(() => {
    loadCourses();
  }, []);

  useEffect(() => {
    if (selectedCourseId) {
      loadModules();
    } else {
      setModules([]);
    }
  }, [selectedCourseId]);

  const loadCourses = async () => {
    try {
      const snap = await getDocs(collection(db, 'courses'));
      setCourses(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
      if (snap.docs.length && !selectedCourseId) {
        setSelectedCourseId(snap.docs[0].id);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const loadModules = async () => {
    if (!selectedCourseId) return;
    setModulesLoading(true);
    try {
      const snap = await getDocs(collection(db, 'courses', selectedCourseId, 'modules'));
      setModules(snap.docs.map((d) => ({ id: d.id, ...d.data() })).sort((a, b) => (a.order ?? 0) - (b.order ?? 0)));
    } catch (err) {
      console.error(err);
    } finally {
      setModulesLoading(false);
    }
  };

  const handleCreateCourse = async (e) => {
    e.preventDefault();
    try {
      const courseData = {
        title: courseTitle,
        description: courseDescription,
        createdAt: new Date().toISOString()
      };
      
      const courseRef = doc(collection(db, 'courses'));
      await setDoc(courseRef, courseData);
      
      setCourseTitle('');
      setCourseDescription('');
      setShowCourseForm(false);
      await loadCourses();
      setSelectedCourseId(courseRef.id);
    } catch (err) {
      console.error('Error creating course:', err);
      alert('Failed to create course. Please try again.');
    }
  };

  const handleCreateModule = async (e) => {
    e.preventDefault();
    if (!selectedCourseId) {
      alert('Please select a course first.');
      return;
    }

    try {
      // Upload thumbnail if a new file was selected
      let finalThumbnailUrl = thumbnailUrl;
      let finalThumbnailFilename = thumbnailFilename;
      
      if (thumbnailFile) {
        const uploadResult = await uploadThumbnail();
        if (!uploadResult && thumbnailFile) {
          // Upload failed, don't proceed
          return;
        }
        
        // Handle upload result (object with url and filename)
        if (uploadResult && typeof uploadResult === 'object') {
          finalThumbnailUrl = uploadResult.url; // Base64 string
          finalThumbnailFilename = uploadResult.filename;
        } else if (typeof uploadResult === 'string') {
          // Fallback for string format
          finalThumbnailUrl = uploadResult;
          if (!finalThumbnailFilename) {
            finalThumbnailFilename = generateThumbnailFilename(
              thumbnailFile,
              selectedCourseId,
              editingModule?.id
            );
          }
        }
      }

      const moduleData = {
        title: moduleTitle,
        description: moduleDescription,
        order: parseInt(moduleOrder) || 0,
        ...(youtubeUrl && { youtubeUrl }),
        ...(bunnyEmbedUrl && { bunnyEmbedUrl }),
        ...(finalThumbnailUrl && { 
          thumbnailUrl: finalThumbnailUrl,
          thumbnailFilename: finalThumbnailFilename || `module_${selectedCourseId}_${Date.now()}.jpg`
        }),
        ...(mcqQuestions.length > 0 && { mcq: mcqQuestions })
      };

      if (editingModule) {
        // Update existing module
        await updateDoc(doc(db, 'courses', selectedCourseId, 'modules', editingModule.id), moduleData);
        setEditingModule(null);
      } else {
        // Create new module
        const moduleRef = doc(collection(db, 'courses', selectedCourseId, 'modules'));
        await setDoc(moduleRef, moduleData);
      }

      // Reset form
      setModuleTitle('');
      setModuleDescription('');
      setModuleOrder(1);
      setYoutubeUrl('');
      setBunnyEmbedUrl('');
      setThumbnailUrl('');
      setThumbnailImageUrl('');
      setThumbnailFilename('');
      setThumbnailFile(null);
      setMcqQuestions([]);
      setShowModuleForm(false);
      await loadModules();
    } catch (err) {
      console.error('Error saving module:', err);
      
      // Check if error is due to Firestore document size limit
      if (err.message && err.message.includes('document size')) {
        alert('Image is too large for Firestore (1MB document limit). Please compress the image and try again.');
      } else {
        alert(`Failed to save module: ${err.message || 'Please try again.'}`);
      }
    }
  };

  const handleThumbnailChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    // Validate file type
    if (!file.type.startsWith('image/')) {
      alert('Please upload an image file.');
      return;
    }
    
    // No size restriction - all sizes allowed
    // Note: Firestore has a 1MB document limit, so very large images may fail
    // Base64 encoding increases size by ~33%, so images over ~750KB may exceed Firestore limit
    
    setThumbnailFile(file);
    
    // Preview - convert to Base64
    const reader = new FileReader();
    reader.onloadend = () => {
      setThumbnailUrl(reader.result); // This is already Base64 data URL
    };
    reader.readAsDataURL(file);
  };

  // Auto-generate unique filename for thumbnail
  const generateThumbnailFilename = (originalFile, courseId, moduleId) => {
    const timestamp = Date.now();
    const randomStr = Math.random().toString(36).substring(2, 9);
    const extension = originalFile.name.split('.').pop() || 'jpg';
    // Format: module_{courseId}_{moduleId}_{timestamp}_{random}.{ext}
    // If editing, use moduleId; if creating new, use 'new'
    const modulePart = moduleId || 'new';
    return `module_${courseId}_${modulePart}_${timestamp}_${randomStr}.${extension}`;
  };

  const uploadThumbnail = async () => {
    if (!thumbnailFile || !selectedCourseId) return;
    
    setThumbnailUploading(true);
    try {
      // Convert image to Base64 - stored directly in Firestore (no server needed)
      const base64String = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result);
        reader.onerror = () => reject(new Error('Failed to read image file'));
        reader.readAsDataURL(thumbnailFile);
      });
      
      // Generate auto-renamed filename for reference
      const autoFilename = generateThumbnailFilename(
        thumbnailFile,
        selectedCourseId,
        editingModule?.id
      );
      
      // Store Base64 directly in Firestore (no external server or service needed)
      setThumbnailUrl(base64String);
      setThumbnailFilename(autoFilename);
      setThumbnailFile(null);
      
      // Return Base64 and filename for Firestore storage
      return { url: base64String, filename: autoFilename };
    } catch (err) {
      console.error('Error processing thumbnail:', err);
      alert(`Failed to process thumbnail: ${err.message || 'Please try again.'}`);
      return null;
    } finally {
      setThumbnailUploading(false);
    }
  };

  const handleEditModule = (module) => {
    setEditingModule(module);
    setModuleTitle(module.title || '');
    setModuleDescription(module.description || '');
    setModuleOrder(module.order || 1);
    setYoutubeUrl(module.youtubeUrl || '');
    setBunnyEmbedUrl(module.bunnyEmbedUrl || '');
    setThumbnailUrl(module.thumbnailUrl || '');
    setThumbnailImageUrl(module.thumbnailUrl || '');
    setThumbnailFilename(module.thumbnailFilename || '');
    setThumbnailFile(null);
    setMcqQuestions(module.mcq || []);
    setShowModuleForm(true);
  };

  const handleDeleteModule = async (moduleId) => {
    if (!confirm('Are you sure you want to delete this module?')) return;
    
    try {
      await deleteDoc(doc(db, 'courses', selectedCourseId, 'modules', moduleId));
      await loadModules();
    } catch (err) {
      console.error('Error deleting module:', err);
      alert('Failed to delete module. Please try again.');
    }
  };

  // MCQ Management Functions
  const addMcqQuestion = () => {
    setMcqQuestions([...mcqQuestions, {
      id: `q${Date.now()}`,
      question: '',
      options: ['', '', '', ''],
      correctAnswer: 0
    }]);
  };

  const updateMcqQuestion = (index, field, value) => {
    const updated = [...mcqQuestions];
    updated[index] = { ...updated[index], [field]: value };
    setMcqQuestions(updated);
  };

  const updateMcqOption = (qIndex, optionIndex, value) => {
    const updated = [...mcqQuestions];
    updated[qIndex].options[optionIndex] = value;
    setMcqQuestions(updated);
  };

  const removeMcqQuestion = (index) => {
    setMcqQuestions(mcqQuestions.filter((_, i) => i !== index));
  };

  const cancelForm = () => {
    setShowCourseForm(false);
    setShowModuleForm(false);
    setEditingModule(null);
    setModuleTitle('');
    setModuleDescription('');
    setModuleOrder(1);
    setYoutubeUrl('');
    setBunnyEmbedUrl('');
    setThumbnailUrl('');
    setThumbnailImageUrl('');
    setThumbnailFilename('');
    setThumbnailFile(null);
    setMcqQuestions([]);
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center min-h-[40vh]">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Courses & Library</h1>
        <button
          onClick={() => setShowCourseForm(true)}
          className="btn-primary"
        >
          + Add Course
        </button>
      </div>

      {/* Course Form Modal */}
      {showCourseForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h2 className="text-xl font-bold mb-4">Create New Course</h2>
            <form onSubmit={handleCreateCourse} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Course Title *
                </label>
                <input
                  type="text"
                  value={courseTitle}
                  onChange={(e) => setCourseTitle(e.target.value)}
                  required
                  className="input-field"
                  placeholder="e.g., BPO Fundamentals 101"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                  value={courseDescription}
                  onChange={(e) => setCourseDescription(e.target.value)}
                  className="input-field"
                  rows={3}
                  placeholder="Course description..."
                />
              </div>
              <div className="flex gap-2">
                <button type="submit" className="btn-primary flex-1">
                  Create Course
                </button>
                <button type="button" onClick={cancelForm} className="btn-secondary flex-1">
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Module Form Modal */}
      {showModuleForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold mb-4">
              {editingModule ? 'Edit Module' : 'Add New Module'}
            </h2>
            <form onSubmit={handleCreateModule} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Module Title *
                </label>
                <input
                  type="text"
                  value={moduleTitle}
                  onChange={(e) => setModuleTitle(e.target.value)}
                  required
                  className="input-field"
                  placeholder="e.g., Introduction to BPO"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                  value={moduleDescription}
                  onChange={(e) => setModuleDescription(e.target.value)}
                  className="input-field"
                  rows={2}
                  placeholder="Module description..."
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Order *
                </label>
                <input
                  type="number"
                  value={moduleOrder}
                  onChange={(e) => setModuleOrder(e.target.value)}
                  required
                  min="1"
                  className="input-field"
                  placeholder="1"
                />
                <p className="text-xs text-gray-500 mt-1">Lower numbers appear first</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  YouTube Video URL
                </label>
                <input
                  type="url"
                  value={youtubeUrl}
                  onChange={(e) => setYoutubeUrl(e.target.value)}
                  className="input-field"
                  placeholder="https://www.youtube.com/watch?v=... or https://youtu.be/..."
                />
                <p className="text-xs text-gray-500 mt-1">
                  Supports public and unlisted YouTube videos. Paste the full YouTube URL.
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Bunny Stream Embed URL (Alternative)
                </label>
                <input
                  type="url"
                  value={bunnyEmbedUrl}
                  onChange={(e) => setBunnyEmbedUrl(e.target.value)}
                  className="input-field"
                  placeholder="https://iframe.mediadelivery.net/embed/..."
                />
                <p className="text-xs text-gray-500 mt-1">
                  Use either YouTube URL or Bunny Stream URL (not both)
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Video Thumbnail Image (Optional)
                </label>
                <p className="text-xs text-gray-500 mb-2">
                  Upload a custom thumbnail image to show when video is paused. Recommended: 1280x720px or 16:9 aspect ratio.
                  <br />
                  <span className="text-green-600 font-medium">✓ Just upload - images stored directly (no server needed)</span>
                  <br />
                  <span className="text-green-600 font-medium">✓ All file sizes allowed (auto-renamed)</span>
                  <br />
                  <span className="text-gray-500 text-xs">Images stored in Firestore - works immediately</span>
                </p>
                {thumbnailUrl && (
                  <div className="mb-3">
                    <img 
                      src={thumbnailUrl} 
                      alt="Thumbnail preview" 
                      className="w-full max-w-md h-auto rounded-lg border border-gray-300"
                    />
                  </div>
                )}
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleThumbnailChange}
                  className="input-field"
                  disabled={thumbnailUploading}
                />
                {thumbnailFile && (
                  <p className="text-xs text-green-600 mt-1">
                    {thumbnailFile.name} selected. Will upload when you save the module.
                  </p>
                )}
                {thumbnailUploading && (
                  <p className="text-xs text-blue-600 mt-1">Processing thumbnail...</p>
                )}
              </div>

              {/* MCQ Questions Section */}
              <div className="border-t pt-4 mt-4">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Quiz Questions (Optional)
                    </label>
                    <p className="text-xs text-gray-500 mt-1">
                      Add questions for learners to answer after watching the video
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={addMcqQuestion}
                    className="text-sm bg-primary-600 hover:bg-primary-700 text-white px-3 py-1.5 rounded-lg transition-colors"
                  >
                    + Add Question
                  </button>
                </div>

                {mcqQuestions.length === 0 ? (
                  <div className="text-center py-6 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
                    <p className="text-sm text-gray-500">No questions added yet</p>
                    <p className="text-xs text-gray-400 mt-1">Click "+ Add Question" to create quiz questions</p>
                  </div>
                ) : (
                  <div className="space-y-4 max-h-96 overflow-y-auto">
                    {mcqQuestions.map((question, qIndex) => (
                      <div key={question.id} className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                        <div className="flex items-start justify-between mb-3">
                          <span className="text-sm font-medium text-gray-700">Question {qIndex + 1}</span>
                          <button
                            type="button"
                            onClick={() => removeMcqQuestion(qIndex)}
                            className="text-red-600 hover:text-red-700 text-sm"
                          >
                            Remove
                          </button>
                        </div>

                        <input
                          type="text"
                          value={question.question}
                          onChange={(e) => updateMcqQuestion(qIndex, 'question', e.target.value)}
                          placeholder="Enter your question"
                          className="input-field mb-3"
                        />

                        <div className="space-y-2">
                          <p className="text-xs font-medium text-gray-600">Options:</p>
                          {question.options.map((option, optIndex) => (
                            <div key={optIndex} className="flex items-center gap-2">
                              <input
                                type="radio"
                                name={`correct-${qIndex}`}
                                checked={question.correctAnswer === optIndex}
                                onChange={() => updateMcqQuestion(qIndex, 'correctAnswer', optIndex)}
                                className="w-4 h-4 text-primary-600"
                              />
                              <input
                                type="text"
                                value={option}
                                onChange={(e) => updateMcqOption(qIndex, optIndex, e.target.value)}
                                placeholder={`Option ${optIndex + 1}`}
                                className="input-field flex-1"
                              />
                              <span className="text-xs text-gray-500 w-16">
                                {question.correctAnswer === optIndex && '✓ Correct'}
                              </span>
                            </div>
                          ))}
                          <p className="text-xs text-gray-500 mt-1">
                            Click the radio button to mark the correct answer
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex gap-2">
                <button type="submit" className="btn-primary flex-1">
                  {editingModule ? 'Update Module' : 'Add Module'}
                </button>
                <button type="button" onClick={cancelForm} className="btn-secondary flex-1">
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="card">
          <h2 className="text-lg font-semibold text-gray-900 mb-3">Courses</h2>
          {courses.length === 0 ? (
            <p className="text-gray-500 text-sm">No courses. Click "Add Course" to create one.</p>
          ) : (
            <ul className="space-y-2">
              {courses.map((c) => (
                <li key={c.id}>
                  <button
                    onClick={() => setSelectedCourseId(c.id)}
                    className={`w-full text-left px-3 py-2 rounded-lg text-sm font-medium ${
                      selectedCourseId === c.id ? 'bg-primary-100 text-primary-800' : 'hover:bg-gray-100'
                    }`}
                  >
                    {c.title || c.id}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
        <div className="lg:col-span-2 card">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-semibold text-gray-900">Modules</h2>
            {selectedCourseId && (
              <button
                onClick={() => {
                  setEditingModule(null);
                  setShowModuleForm(true);
                }}
                className="btn-primary text-sm"
              >
                + Add Module
              </button>
            )}
          </div>
          {!selectedCourseId ? (
            <p className="text-gray-500 text-sm">Select a course to view or add modules.</p>
          ) : modulesLoading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
            </div>
          ) : modules.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-500 text-sm mb-4">No modules in this course.</p>
              <button
                onClick={() => {
                  setEditingModule(null);
                  setShowModuleForm(true);
                }}
                className="btn-primary"
              >
                Add First Module
              </button>
            </div>
          ) : (
            <ul className="space-y-2">
              {modules.map((m) => (
                <li key={m.id} className="flex items-center justify-between border border-gray-200 rounded-lg p-3 hover:bg-gray-50">
                  <div className="flex-1">
                    <p className="font-medium text-gray-900">{m.title || m.id}</p>
                    <div className="flex gap-4 mt-1 flex-wrap">
                      <p className="text-xs text-gray-500">Order: {m.order ?? '—'}</p>
                      {m.youtubeUrl && (
                        <p className="text-xs text-green-600">✓ YouTube</p>
                      )}
                      {m.bunnyEmbedUrl && (
                        <p className="text-xs text-blue-600">✓ Bunny Stream</p>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleEditModule(m)}
                      className="px-3 py-1 text-sm bg-gray-100 hover:bg-gray-200 rounded text-gray-700"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDeleteModule(m.id)}
                      className="px-3 py-1 text-sm bg-red-100 hover:bg-red-200 rounded text-red-700"
                    >
                      Delete
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </AdminLayout>
  );
};
