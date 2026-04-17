import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { FileText, CheckSquare, Layers, AlertCircle, Plus } from 'lucide-react';

const Dashboard = () => {
  const [dashboardData, setDashboardData] = useState(null);
  const [recentDiplomas, setRecentDiplomas] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const response = await api.get('/auth/dashboard');
        setDashboardData(response.data.data);
        
        // Fetch recent diplomas if allowed
        try {
          const diplResponse = await api.get('/diplomas?limit=4');
          setRecentDiplomas(diplResponse.data.data.diplomas || []);
        } catch (e) {
          console.error("Erreur lors de la récupération des derniers diplômes", e);
        }

      } catch (error) {
        if (error.response?.status === 401) {
          window.location.href = '/';
        }
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  const stats = dashboardData?.stats || {};

  const getInitials = (name) => {
    if (!name) return '??';
    return name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
  };

  const getMentionColor = (mention) => {
    const m = mention?.toLowerCase() || '';
    if (m.includes('très bien') || m.includes('excellent')) return 'text-[#7e22ce]';
    if (m.includes('bien')) return 'text-[#9333ea]';
    if (m.includes('passable')) return 'text-red-500';
    return 'text-gray-600';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#0f6f75]"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 flex flex-col h-full">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Vue d'ensemble</h1>
        </div>
        
        {(dashboardData?.role === 'admin' || dashboardData?.role === 'super_admin' || dashboardData?.permissions?.canCreateDiploma) && (
          <button 
            onClick={() => navigate('/create')}
            className="inline-flex items-center bg-white border border-gray-200 shadow-sm text-gray-700 px-4 py-2.5 rounded-xl hover:bg-gray-50 hover:border-gray-300 transition-all font-medium text-sm"
          >
            <Plus className="w-4 h-4 mr-2 text-gray-400" />
            Nouveau diplôme
          </button>
        )}
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-[#eef5fa] rounded-2xl shadow-sm border border-[#c8dbe7] p-6 flex flex-col justify-between hover:shadow-md transition-shadow">
          <div className="mb-4">
             <div className="w-12 h-12 bg-[#d9eaf5] rounded-2xl flex items-center justify-center text-[#2f607e] mb-4">
               <FileText className="w-6 h-6" />
             </div>
             <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">DIPLÔMES</p>
          </div>
          <div>
            <div className="text-3xl font-bold text-gray-900 mb-1">{stats.totalDiplomas || 0}</div>
            <div className="text-sm font-medium text-emerald-500">Global</div>
          </div>
        </div>

        <div className="bg-[#eef5fa] rounded-2xl shadow-sm border border-[#c8dbe7] p-6 flex flex-col justify-between hover:shadow-md transition-shadow">
          <div className="mb-4">
             <div className="w-12 h-12 bg-[#ecfdf5] rounded-2xl flex items-center justify-center text-emerald-600 mb-4">
               <CheckSquare className="w-6 h-6" />
             </div>
             <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">VÉRIFICATIONS</p>
          </div>
          <div>
            <div className="text-3xl font-bold text-gray-900 mb-1">{stats.validDiplomas || 0}</div>
            <div className="text-sm font-medium text-emerald-500">Valides</div>
          </div>
        </div>

        <div className="bg-[#eef5fa] rounded-2xl shadow-sm border border-[#c8dbe7] p-6 flex flex-col justify-between hover:shadow-md transition-shadow">
          <div className="mb-4">
             <div className="w-12 h-12 bg-[#d9eaf5] rounded-2xl flex items-center justify-center text-[#2f607e] mb-4">
               <Layers className="w-6 h-6" />
             </div>
             <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">BLOCKCHAIN</p>
          </div>
          <div>
            <div className="text-3xl font-bold text-gray-900 mb-1">{stats.totalDiplomas || 0}</div>
            <div className="text-sm font-medium text-gray-400">Total miné</div>
          </div>
        </div>

        <div className="bg-[#eef5fa] rounded-2xl shadow-sm border border-[#c8dbe7] p-6 flex flex-col justify-between hover:shadow-md transition-shadow">
          <div className="mb-4">
             <div className="w-12 h-12 bg-[#fef2f2] rounded-2xl flex items-center justify-center text-red-500 mb-4">
               <AlertCircle className="w-6 h-6" />
             </div>
             <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">RÉVOQUÉS</p>
          </div>
          <div>
            <div className="text-3xl font-bold text-gray-900 mb-1">{stats.revokedDiplomas || 0}</div>
            <div className="text-sm font-medium text-red-500">À surveiller</div>
          </div>
        </div>
      </div>

      {/* Derniers diplômes Section */}
      <div className="mt-8">
        <div className="flex justify-between items-center mb-6">
           <h2 className="text-xl font-bold text-gray-900">Derniers diplômes</h2>
           <button 
             onClick={() => navigate('/diplomas')}
             className="px-4 py-2 border border-gray-100 bg-white rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors shadow-sm"
           >
             Voir tout
           </button>
        </div>
        
        <div className="bg-[#eef5fa] rounded-2xl shadow-sm border border-[#c8dbe7] overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead>
                <tr className="border-b border-[#d5e3ec]">
                  <th className="px-6 py-4 text-left text-[11px] font-bold text-gray-400 uppercase tracking-widest">Étudiant</th>
                  <th className="px-6 py-4 text-left text-[11px] font-bold text-gray-400 uppercase tracking-widest">N° Étudiant</th>
                  <th className="px-6 py-4 text-left text-[11px] font-bold text-gray-400 uppercase tracking-widest">Diplôme</th>
                  <th className="px-6 py-4 text-left text-[11px] font-bold text-gray-400 uppercase tracking-widest">Mention</th>
                  <th className="px-6 py-4 text-left text-[11px] font-bold text-gray-400 uppercase tracking-widest">Statut</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#d5e3ec]">
                {recentDiplomas.length > 0 ? (
                  recentDiplomas.map((diploma) => (
                    <tr key={diploma._id} className="hover:bg-[#e7f0f6] transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10 rounded-full bg-[#f4fbfb] text-[#127b87] flex items-center justify-center text-sm font-bold border border-[#cdeeea]">
                            {getInitials(diploma.studentName)}
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-bold text-gray-900">{diploma.studentName}</div>
                            <div className="text-xs text-gray-400 mt-0.5">Promo {new Date(diploma.graduationDate).getFullYear()}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 font-mono">
                        {diploma.studentId}
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-700 font-medium line-clamp-1">{diploma.degree}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`text-sm font-bold ${getMentionColor(diploma.grade)}`}>
                          {diploma.grade || '-'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${
                            diploma.isRevoked
                              ? 'bg-red-50 text-red-600 border border-red-100'
                              : 'bg-emerald-50 text-emerald-600 border border-emerald-100'
                          }`}
                        >
                          <span className={`h-1.5 w-1.5 rounded-full mr-2 ${diploma.isRevoked ? 'bg-red-500' : 'bg-emerald-500'}`}></span>
                          {diploma.isRevoked ? 'Révoqué' : 'Valide'}
                        </span>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="5" className="px-6 py-8 text-center text-sm text-gray-500">
                      Aucun diplôme enregistré pour le moment.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>


    </div>
  );
};

export default Dashboard;
