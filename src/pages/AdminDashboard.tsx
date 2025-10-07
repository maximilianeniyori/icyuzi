import { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { supabase, Application, Student } from '../lib/supabase';
import { Shield, LogOut, Search, Filter, Download, Eye, Clock, CheckCircle, XCircle } from 'lucide-react';

interface ApplicationWithStudent extends Application {
  student: Student;
}

export default function AdminDashboard() {
  const { user, isAdmin, signOut } = useAuth();
  const navigate = useNavigate();
  const [applications, setApplications] = useState<ApplicationWithStudent[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [selectedApp, setSelectedApp] = useState<ApplicationWithStudent | null>(null);
  const [updatingStatus, setUpdatingStatus] = useState(false);

  useEffect(() => {
    if (!user || !isAdmin) {
      navigate('/admin/login');
      return;
    }

    loadApplications();
  }, [user, isAdmin, navigate]);

  const loadApplications = async () => {
    try {
      const { data: appsData, error } = await supabase
        .from('applications')
        .select(`
          *,
          students!applications_student_id_fkey (*)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const formattedData = appsData?.map(app => ({
        ...app,
        student: (app as any).students
      })) || [];

      setApplications(formattedData);
    } catch (error) {
      console.error('Error loading applications:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  const handleStatusUpdate = async (appId: string, newStatus: string) => {
    setUpdatingStatus(true);
    try {
      const { error } = await supabase
        .from('applications')
        .update({ status: newStatus })
        .eq('id', appId);

      if (error) throw error;

      await loadApplications();
      if (selectedApp?.id === appId) {
        setSelectedApp({ ...selectedApp, status: newStatus as any });
      }
    } catch (error) {
      console.error('Error updating status:', error);
    } finally {
      setUpdatingStatus(false);
    }
  };

  const filteredApplications = applications.filter(app => {
    const matchesSearch =
      app.student.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      app.desired_country.toLowerCase().includes(searchTerm.toLowerCase()) ||
      app.desired_college.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesFilter = filterStatus === 'all' || app.status === filterStatus;

    return matchesSearch && matchesFilter;
  });

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'Pending':
        return <Clock className="w-5 h-5 text-yellow-600" />;
      case 'Reviewed':
        return <Eye className="w-5 h-5 text-blue-600" />;
      case 'Accepted':
        return <CheckCircle className="w-5 h-5 text-green-600" />;
      case 'Rejected':
        return <XCircle className="w-5 h-5 text-red-600" />;
      default:
        return null;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'Reviewed':
        return 'bg-blue-100 text-blue-800';
      case 'Accepted':
        return 'bg-green-100 text-green-800';
      case 'Rejected':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-red-600 border-t-transparent"></div>
          <p className="mt-4 text-gray-600">Loading applications...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-red-600 rounded-full flex items-center justify-center">
                <Shield className="w-6 h-6 text-white" />
              </div>
              <span className="text-xl font-bold text-gray-900">Admin Dashboard</span>
            </div>
            <button
              onClick={handleSignOut}
              className="flex items-center gap-2 px-4 py-2 text-gray-700 hover:text-gray-900 transition-colors"
            >
              <LogOut className="w-5 h-5" />
              <span>Sign Out</span>
            </button>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Scholarship Applications</h1>
          <p className="text-gray-600">Review and manage student applications</p>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search by name, country, or college..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
              />
            </div>
            <div className="flex items-center gap-2">
              <Filter className="w-5 h-5 text-gray-400" />
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
              >
                <option value="all">All Status</option>
                <option value="Pending">Pending</option>
                <option value="Reviewed">Reviewed</option>
                <option value="Accepted">Accepted</option>
                <option value="Rejected">Rejected</option>
              </select>
            </div>
          </div>
        </div>

        {filteredApplications.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm p-12 text-center">
            <p className="text-gray-600">No applications found</p>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Student</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Country</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">College</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Date</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Status</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {filteredApplications.map((app) => (
                    <tr key={app.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4">
                        <div>
                          <p className="text-sm font-medium text-gray-900">{app.student.full_name}</p>
                          <p className="text-sm text-gray-500">{app.student.email}</p>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">{app.desired_country}</td>
                      <td className="px-6 py-4 text-sm text-gray-900">{app.desired_college}</td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {new Date(app.created_at).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(app.status)}`}>
                          {getStatusIcon(app.status)}
                          {app.status}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <button
                          onClick={() => setSelectedApp(app)}
                          className="text-red-600 hover:text-red-700 font-medium text-sm"
                        >
                          View Details
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {selectedApp && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b sticky top-0 bg-white">
              <div className="flex justify-between items-start">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">{selectedApp.student.full_name}</h2>
                  <p className="text-gray-600">{selectedApp.student.email}</p>
                </div>
                <button
                  onClick={() => setSelectedApp(null)}
                  className="text-gray-400 hover:text-gray-600 text-2xl"
                >
                  ×
                </button>
              </div>
            </div>

            <div className="p-6 space-y-6">
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-gray-500 mb-1">Phone Number</p>
                  <p className="text-gray-900">{selectedApp.student.phone}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500 mb-1">Application Date</p>
                  <p className="text-gray-900">{new Date(selectedApp.created_at).toLocaleDateString()}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500 mb-1">Desired Country</p>
                  <p className="text-gray-900">{selectedApp.desired_country}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500 mb-1">Desired College</p>
                  <p className="text-gray-900">{selectedApp.desired_college}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500 mb-1">Education Level</p>
                  <p className="text-gray-900">{selectedApp.education_level}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500 mb-1">Field of Study</p>
                  <p className="text-gray-900">{selectedApp.field_of_study}</p>
                </div>
              </div>

              <div>
                <p className="text-sm font-medium text-gray-500 mb-3">Documents</p>
                <div className="space-y-2">
                  <a
                    href={selectedApp.passport_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-blue-600 hover:text-blue-700"
                  >
                    <Download className="w-4 h-4" />
                    Passport/ID
                  </a>
                  <a
                    href={selectedApp.transcripts_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-blue-600 hover:text-blue-700"
                  >
                    <Download className="w-4 h-4" />
                    Academic Transcripts
                  </a>
                  <a
                    href={selectedApp.motivation_letter_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-blue-600 hover:text-blue-700"
                  >
                    <Download className="w-4 h-4" />
                    Motivation Letter/CV
                  </a>
                </div>
              </div>

              <div>
                <p className="text-sm font-medium text-gray-500 mb-3">Update Status</p>
                <div className="flex gap-3">
                  <button
                    onClick={() => handleStatusUpdate(selectedApp.id, 'Reviewed')}
                    disabled={updatingStatus}
                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
                  >
                    Mark as Reviewed
                  </button>
                  <button
                    onClick={() => handleStatusUpdate(selectedApp.id, 'Accepted')}
                    disabled={updatingStatus}
                    className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors"
                  >
                    Accept
                  </button>
                  <button
                    onClick={() => handleStatusUpdate(selectedApp.id, 'Rejected')}
                    disabled={updatingStatus}
                    className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 transition-colors"
                  >
                    Reject
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
