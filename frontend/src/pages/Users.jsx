import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { Users as UsersIcon, Mail, Calendar, Eye, TrendingUp, Search, Filter, ArrowLeft } from 'lucide-react';

const Users = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const response = await api.get('/users/verifiers');
        setUsers(response.data.data.users || []);
      } catch (error) {
        console.error('Erreur lors de la récupération des utilisateurs:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, []);

  const filteredUsers = users.filter(user => 
    user.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getInitials = (name) => {
    if (!name) return '??';
    return name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#0f6f75]"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center">
          <button 
            onClick={() => navigate('/dashboard')}
            className="mr-4 p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-gray-600" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Utilisateurs vérificateurs</h1>
            <p className="text-gray-500 mt-1 text-sm font-medium">
              Gestion des utilisateurs et statistiques de vérification
            </p>
          </div>
        </div>
        
        <div className="flex items-center space-x-3">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Rechercher un utilisateur..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0f6f75] focus:border-transparent text-sm"
            />
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 flex flex-col justify-between hover:shadow-md transition-shadow">
          <div className="mb-4">
            <div className="w-12 h-12 bg-[#eff6ff] rounded-2xl flex items-center justify-center text-blue-600 mb-4">
              <UsersIcon className="w-6 h-6" />
            </div>
            <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">TOTAL</p>
          </div>
          <div>
            <div className="text-3xl font-bold text-gray-900 mb-1">{users.length}</div>
            <div className="text-sm font-medium text-emerald-500">Vérificateurs</div>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 flex flex-col justify-between hover:shadow-md transition-shadow">
          <div className="mb-4">
            <div className="w-12 h-12 bg-[#ecfdf5] rounded-2xl flex items-center justify-center text-emerald-600 mb-4">
              <Eye className="w-6 h-6" />
            </div>
            <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">VÉRIFICATIONS</p>
          </div>
          <div>
            <div className="text-3xl font-bold text-gray-900 mb-1">
              {users.reduce((sum, user) => sum + user.verifiedDiplomasCount, 0)}
            </div>
            <div className="text-sm font-medium text-emerald-500">Total</div>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 flex flex-col justify-between hover:shadow-md transition-shadow">
          <div className="mb-4">
            <div className="w-12 h-12 bg-[#f3e8ff] rounded-2xl flex items-center justify-center text-purple-600 mb-4">
              <TrendingUp className="w-6 h-6" />
            </div>
            <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">MOYENNE</p>
          </div>
          <div>
            <div className="text-3xl font-bold text-gray-900 mb-1">
              {users.length > 0 ? Math.round(users.reduce((sum, user) => sum + user.verifiedDiplomasCount, 0) / users.length) : 0}
            </div>
            <div className="text-sm font-medium text-gray-400">Par utilisateur</div>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 flex flex-col justify-between hover:shadow-md transition-shadow">
          <div className="mb-4">
            <div className="w-12 h-12 bg-[#fef2f2] rounded-2xl flex items-center justify-center text-red-500 mb-4">
              <Calendar className="w-6 h-6" />
            </div>
            <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">ACTIVITÉ</p>
          </div>
          <div>
            <div className="text-3xl font-bold text-gray-900 mb-1">24h</div>
            <div className="text-sm font-medium text-emerald-500">Dernière</div>
          </div>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100">
          <h2 className="text-lg font-semibold text-gray-900">Liste des utilisateurs</h2>
        </div>
        
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead>
              <tr className="border-b border-gray-50">
                <th className="px-6 py-4 text-left text-[11px] font-bold text-gray-400 uppercase tracking-widest">Utilisateur</th>
                <th className="px-6 py-4 text-left text-[11px] font-bold text-gray-400 uppercase tracking-widest">Email</th>
                <th className="px-6 py-4 text-left text-[11px] font-bold text-gray-400 uppercase tracking-widest">Diplômes vérifiés</th>
                <th className="px-6 py-4 text-left text-[11px] font-bold text-gray-400 uppercase tracking-widest">Date d'inscription</th>
                <th className="px-6 py-4 text-left text-[11px] font-bold text-gray-400 uppercase tracking-widest">Dernière vérification</th>
                <th className="px-6 py-4 text-left text-[11px] font-bold text-gray-400 uppercase tracking-widest">Statut</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filteredUsers.length > 0 ? (
                filteredUsers.map((user) => (
                  <tr key={user.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10 rounded-full bg-[#f4fbfb] text-[#127b87] flex items-center justify-center text-sm font-bold border border-[#cdeeea]">
                          {getInitials(user.fullName)}
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-bold text-gray-900">{user.fullName}</div>
                          <div className="text-xs text-gray-400 mt-0.5">Vérificateur</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <div className="flex items-center">
                        <Mail className="w-4 h-4 mr-2 text-gray-400" />
                        {user.email}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="text-lg font-bold text-[#0f6f75]">{user.verifiedDiplomasCount}</div>
                        <span className="ml-2 text-xs text-gray-400">diplômes</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <div className="flex items-center">
                        <Calendar className="w-4 h-4 mr-2 text-gray-400" />
                        {new Date(user.joinDate).toLocaleDateString('fr-FR')}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <div className="flex items-center">
                        <Eye className="w-4 h-4 mr-2 text-gray-400" />
                        {new Date(user.lastVerificationDate).toLocaleDateString('fr-FR')}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-600 border border-emerald-100">
                        <span className="h-1.5 w-1.5 rounded-full mr-2 bg-emerald-500"></span>
                        {user.status}
                      </span>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="6" className="px-6 py-8 text-center text-sm text-gray-500">
                    {searchTerm ? 'Aucun utilisateur trouvé pour cette recherche.' : 'Aucun utilisateur vérificateur trouvé.'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Users;
