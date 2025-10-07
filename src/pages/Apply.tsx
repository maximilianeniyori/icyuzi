import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { GraduationCap, Upload, AlertCircle, Loader2 } from 'lucide-react';

const COUNTRIES = [
  'United States', 'United Kingdom', 'Canada', 'Australia', 'Germany',
  'France', 'Netherlands', 'Sweden', 'Switzerland', 'Japan', 'Other'
];

const EDUCATION_LEVELS = [
  'High School / O-Level',
  'Advanced Level',
  'Diploma',
  'Bachelor\'s Degree',
  'Master\'s Degree',
  'Other'
];

const FIELDS_OF_STUDY = [
  'Engineering', 'Computer Science', 'Medicine', 'Business Administration',
  'Law', 'Education', 'Arts & Humanities', 'Natural Sciences', 'Social Sciences', 'Other'
];

export default function Apply() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [uploading, setUploading] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    desiredCountry: '',
    desiredCollege: '',
    educationLevel: '',
    fieldOfStudy: '',
  });

  const [files, setFiles] = useState({
    passport: null as File | null,
    transcripts: null as File | null,
    motivationLetter: null as File | null,
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, type: 'passport' | 'transcripts' | 'motivationLetter') => {
    const file = e.target.files?.[0];
    if (file) {
      const validTypes = ['application/pdf', 'application/zip', 'application/x-zip-compressed'];
      if (!validTypes.includes(file.type)) {
        setError(`Please upload a PDF or ZIP file for ${type}`);
        return;
      }
      if (file.size > 10 * 1024 * 1024) {
        setError(`File size must be less than 10MB for ${type}`);
        return;
      }
      setFiles({
        ...files,
        [type]: file,
      });
      setError('');
    }
  };

  const uploadFile = async (file: File, path: string): Promise<string> => {
    const fileExt = file.name.split('.').pop();
    const fileName = `${user!.id}/${path}_${Date.now()}.${fileExt}`;

    const { error: uploadError, data } = await supabase.storage
      .from('applications')
      .upload(fileName, file);

    if (uploadError) throw uploadError;

    const { data: { publicUrl } } = supabase.storage
      .from('applications')
      .getPublicUrl(fileName);

    return publicUrl;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!files.passport || !files.transcripts || !files.motivationLetter) {
      setError('Please upload all required documents');
      return;
    }

    setLoading(true);

    try {
      setUploading('passport');
      const passportUrl = await uploadFile(files.passport, 'passport');

      setUploading('transcripts');
      const transcriptsUrl = await uploadFile(files.transcripts, 'transcripts');

      setUploading('motivationLetter');
      const motivationLetterUrl = await uploadFile(files.motivationLetter, 'motivation_letter');

      setUploading('submitting');
      const { error: insertError } = await supabase
        .from('applications')
        .insert({
          student_id: user!.id,
          desired_country: formData.desiredCountry,
          desired_college: formData.desiredCollege,
          education_level: formData.educationLevel,
          field_of_study: formData.fieldOfStudy,
          passport_url: passportUrl,
          transcripts_url: transcriptsUrl,
          motivation_letter_url: motivationLetterUrl,
          status: 'Pending',
        });

      if (insertError) throw insertError;

      const whatsappUrl = 'https://wa.me/250785358347?text=Twarayakobokeye%20muyasindamo%20Mutzing';
      window.location.href = whatsappUrl;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to submit application');
      setLoading(false);
      setUploading(null);
    }
  };

  if (!user) {
    navigate('/login');
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-green-50 py-12 px-4">
      <div className="max-w-3xl mx-auto">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-600 rounded-full mb-4">
            <GraduationCap className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Scholarship Application</h1>
          <p className="text-gray-600">Complete the form below to apply for an international scholarship</p>
        </div>

        <div className="bg-white rounded-2xl shadow-xl p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-red-800">{error}</p>
              </div>
            )}

            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="desiredCountry" className="block text-sm font-medium text-gray-700 mb-2">
                  Desired Country <span className="text-red-500">*</span>
                </label>
                <select
                  id="desiredCountry"
                  name="desiredCountry"
                  required
                  value={formData.desiredCountry}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                >
                  <option value="">Select a country</option>
                  {COUNTRIES.map(country => (
                    <option key={country} value={country}>{country}</option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="desiredCollege" className="block text-sm font-medium text-gray-700 mb-2">
                  Desired College/University <span className="text-red-500">*</span>
                </label>
                <input
                  id="desiredCollege"
                  name="desiredCollege"
                  type="text"
                  required
                  value={formData.desiredCollege}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  placeholder="e.g., Harvard University"
                />
              </div>

              <div>
                <label htmlFor="educationLevel" className="block text-sm font-medium text-gray-700 mb-2">
                  Highest Education Level <span className="text-red-500">*</span>
                </label>
                <select
                  id="educationLevel"
                  name="educationLevel"
                  required
                  value={formData.educationLevel}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                >
                  <option value="">Select education level</option>
                  {EDUCATION_LEVELS.map(level => (
                    <option key={level} value={level}>{level}</option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="fieldOfStudy" className="block text-sm font-medium text-gray-700 mb-2">
                  Field of Study <span className="text-red-500">*</span>
                </label>
                <select
                  id="fieldOfStudy"
                  name="fieldOfStudy"
                  required
                  value={formData.fieldOfStudy}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                >
                  <option value="">Select field of study</option>
                  {FIELDS_OF_STUDY.map(field => (
                    <option key={field} value={field}>{field}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="border-t pt-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Required Documents</h3>
              <p className="text-sm text-gray-600 mb-6">Upload your documents in PDF or ZIP format (max 10MB each)</p>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Passport or ID <span className="text-red-500">*</span>
                  </label>
                  <label className="flex items-center justify-center w-full px-4 py-6 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-blue-500 transition-colors">
                    <div className="text-center">
                      <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                      <span className="text-sm text-gray-600">
                        {files.passport ? files.passport.name : 'Click to upload passport/ID'}
                      </span>
                    </div>
                    <input
                      type="file"
                      accept=".pdf,.zip"
                      onChange={(e) => handleFileChange(e, 'passport')}
                      className="hidden"
                    />
                  </label>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Academic Transcripts <span className="text-red-500">*</span>
                  </label>
                  <label className="flex items-center justify-center w-full px-4 py-6 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-blue-500 transition-colors">
                    <div className="text-center">
                      <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                      <span className="text-sm text-gray-600">
                        {files.transcripts ? files.transcripts.name : 'Click to upload transcripts'}
                      </span>
                    </div>
                    <input
                      type="file"
                      accept=".pdf,.zip"
                      onChange={(e) => handleFileChange(e, 'transcripts')}
                      className="hidden"
                    />
                  </label>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Motivation Letter / CV <span className="text-red-500">*</span>
                  </label>
                  <label className="flex items-center justify-center w-full px-4 py-6 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-blue-500 transition-colors">
                    <div className="text-center">
                      <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                      <span className="text-sm text-gray-600">
                        {files.motivationLetter ? files.motivationLetter.name : 'Click to upload motivation letter/CV'}
                      </span>
                    </div>
                    <input
                      type="file"
                      accept=".pdf,.zip"
                      onChange={(e) => handleFileChange(e, 'motivationLetter')}
                      className="hidden"
                    />
                  </label>
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 text-white py-3 rounded-lg font-medium hover:bg-blue-700 focus:ring-4 focus:ring-blue-200 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  {uploading === 'passport' && 'Uploading passport...'}
                  {uploading === 'transcripts' && 'Uploading transcripts...'}
                  {uploading === 'motivationLetter' && 'Uploading motivation letter...'}
                  {uploading === 'submitting' && 'Submitting application...'}
                </>
              ) : (
                'Submit Application'
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
