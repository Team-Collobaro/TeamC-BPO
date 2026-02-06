import { useState, useEffect } from 'react';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { storage, db } from '../../lib/firebase';
import { useAuth } from '../../contexts/AuthContext';
import { CandidateLayout } from '../../components/CandidateLayout';

const CV_ALLOWED_TYPES = ['application/pdf'];
const CV_MAX_SIZE = 5 * 1024 * 1024; // 5MB

export const CandidateProfilePage = () => {
  const { user } = useAuth();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [cvFile, setCvFile] = useState(null);
  const [cvUploading, setCvUploading] = useState(false);
  const [error, setError] = useState(null);
  const [skillsInput, setSkillsInput] = useState('');

  useEffect(() => {
    const load = async () => {
      try {
        const snap = await getDoc(doc(db, 'candidate_profiles', user.uid));
        if (snap.exists()) {
          const data = snap.data();
          setProfile(data);
          setSkillsInput((data.skills || []).join(', '));
        } else {
          setProfile({
            visibleToEmployers: false,
            skills: [],
            workHistory: [],
            currentlyEmployed: false,
            noticePeriod: ''
          });
        }
      } catch (err) {
        setError('Failed to load profile');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [user?.uid]);

  const handleCvChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!CV_ALLOWED_TYPES.includes(file.type)) {
      setError('Please upload a PDF file.');
      return;
    }
    if (file.size > CV_MAX_SIZE) {
      setError('File must be under 5MB.');
      return;
    }
    setError(null);
    setCvFile(file);
  };

  const uploadCv = async () => {
    if (!cvFile) return;
    setCvUploading(true);
    setError(null);
    try {
      const path = `cvs/${user.uid}/${Date.now()}_${cvFile.name}`;
      const storageRef = ref(storage, path);
      await uploadBytes(storageRef, cvFile);
      const url = await getDownloadURL(storageRef);
      const newProfile = {
        ...profile,
        cvUrl: url,
        cvUploadedAt: new Date().toISOString()
      };
      await setDoc(doc(db, 'candidate_profiles', user.uid), newProfile, { merge: true });
      setProfile(newProfile);
      setCvFile(null);
    } catch (err) {
      setError(err.message || 'Failed to upload CV');
    } finally {
      setCvUploading(false);
    }
  };

  const handleVisibilityToggle = async (e) => {
    const visible = e.target.checked;
    setSaving(true);
    try {
      const newProfile = { ...profile, visibleToEmployers: visible };
      await setDoc(doc(db, 'candidate_profiles', user.uid), newProfile, { merge: true });
      setProfile(newProfile);
    } catch (err) {
      setError(err.message || 'Failed to update');
    } finally {
      setSaving(false);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    const skills = skillsInput
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);
    setSaving(true);
    setError(null);
    try {
      const newProfile = {
        ...profile,
        userId: user.uid,
        skills,
        updatedAt: new Date().toISOString()
      };
      await setDoc(doc(db, 'candidate_profiles', user.uid), newProfile, { merge: true });
      setProfile(newProfile);
    } catch (err) {
      setError(err.message || 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <CandidateLayout>
        <div className="flex items-center justify-center min-h-[40vh]">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
        </div>
      </CandidateLayout>
    );
  }

  return (
    <CandidateLayout>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">My Profile</h1>

      {error && (
        <div className="card mb-6 bg-red-50 border border-red-200">
          <p className="text-red-800 text-sm">{error}</p>
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-6">
        <div className="card">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">CV</h2>
          {profile?.cvUrl && (
            <p className="text-sm text-gray-600 mb-2">
              CV uploaded. Stored securely and only visible to employers after they pay to unlock.
            </p>
          )}
          <div className="flex flex-wrap gap-3 items-center">
            <input
              type="file"
              accept=".pdf,application/pdf"
              onChange={handleCvChange}
              className="text-sm text-gray-600 file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:bg-primary-50 file:text-primary-700"
            />
            {cvFile && (
              <button
                type="button"
                onClick={uploadCv}
                disabled={cvUploading}
                className="btn-primary"
              >
                {cvUploading ? 'Uploading...' : 'Upload CV'}
              </button>
            )}
          </div>
        </div>

        <div className="card">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Skills & tools</h2>
          <input
            type="text"
            value={skillsInput}
            onChange={(e) => setSkillsInput(e.target.value)}
            placeholder="e.g. Xero, QBO, Dext, Sage"
            className="input-field"
          />
          <p className="text-xs text-gray-500 mt-1">Comma-separated list</p>
        </div>

        <div className="card">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Visibility to employers</h2>
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={profile?.visibleToEmployers ?? false}
              onChange={handleVisibilityToggle}
              className="w-4 h-4 text-primary-600 rounded focus:ring-primary-500"
            />
            <span className="text-gray-700">Make my profile visible to employers (Active)</span>
          </label>
          <p className="text-xs text-gray-500 mt-2">
            When visible, employers can see your star rating. They pay to unlock your CV and
            contact. You may receive a job-seeking confirmation survey; respond within 48 hours
            or your profile will go inactive.
          </p>
        </div>

        <button type="submit" disabled={saving} className="btn-primary">
          {saving ? 'Saving...' : 'Save profile'}
        </button>
      </form>
    </CandidateLayout>
  );
};
