import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { FileText, CheckSquare, Shield, QrCode } from 'lucide-react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend, LineChart, Line, XAxis, YAxis, CartesianGrid } from 'recharts';

const VerifierDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ totalDiplomas: 0, validDiplomas: 0, revokedDiplomas: 0 });

  useEffect(() => {
    const load = async () => {
      try {
        const res = await api.get('/auth/dashboard');
        const s = res.data?.data?.stats;
        if (s) {
          setStats({
            totalDiplomas: s.totalDiplomas ?? 0,
            validDiplomas: s.validDiplomas ?? 0,
            revokedDiplomas: s.revokedDiplomas ?? 0,
          });
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const displayName =
    user?.firstName && user?.lastName
      ? `${user.firstName} ${user.lastName}`
      : user?.email?.split('@')[0] || 'Vérificateur';

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#0f6f75]" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 tracking-tight">
          Bonjour, {displayName}
        </h1>
        <p className="text-gray-500 mt-1 text-sm font-medium">
          Vue d&apos;ensemble des diplômes certifiés sur la plateforme.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-[#eef5fa] rounded-2xl shadow-sm border border-[#c8dbe7] p-6 hover:shadow-md transition-shadow">
          <div className="w-12 h-12 bg-[#d9eaf5] rounded-2xl flex items-center justify-center text-[#2f607e] mb-4">
            <FileText className="w-6 h-6" />
          </div>
          <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">
            Diplômes vérifiés
          </p>
          <p className="text-3xl font-bold text-gray-900 mt-2">{stats.totalDiplomas}</p>
        </div>
        <div className="bg-[#eef5fa] rounded-2xl shadow-sm border border-[#c8dbe7] p-6 hover:shadow-md transition-shadow">
          <div className="w-12 h-12 bg-[#dff2ea] rounded-2xl flex items-center justify-center text-[#10b981] mb-4">
            <CheckSquare className="w-6 h-6" />
          </div>
          <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">
            Diplômes valides
          </p>
          <p className="text-3xl font-bold text-gray-900 mt-2">{stats.validDiplomas}</p>
        </div>
        <div className="bg-[#eef5fa] rounded-2xl shadow-sm border border-[#c8dbe7] p-6 hover:shadow-md transition-shadow">
          <div className="w-12 h-12 bg-[#fee2e2] rounded-2xl flex items-center justify-center text-[#ef4444] mb-4">
            <Shield className="w-6 h-6" />
          </div>
          <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">
            Diplômes révoqués
          </p>
          <p className="text-3xl font-bold text-gray-900 mt-2">{stats.revokedDiplomas}</p>
        </div>
      </div>

      {/* Statistiques Graphiques */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-8">
        {/* Line Chart */}
        <div className="bg-[#eef5fa] rounded-2xl shadow-sm border border-[#c8dbe7] p-6 flex flex-col hover:shadow-md transition-shadow">
          <h2 className="text-lg font-bold text-gray-900 mb-6">Évolution des vérifications</h2>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={stats.monthlyData || []} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#d5e3ec" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#9ca3af', fontSize: 12 }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#9ca3af', fontSize: 12 }} />
                <Tooltip 
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)', backgroundColor: 'rgba(255, 255, 255, 0.95)' }}
                />
                <Line type="monotone" dataKey="Vérifications" stroke="#10b981" strokeWidth={3} dot={{ r: 4, fill: '#10b981', strokeWidth: 2, stroke: '#fff' }} activeDot={{ r: 6 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Pie Chart */}
        <div className="bg-[#eef5fa] rounded-2xl shadow-sm border border-[#c8dbe7] p-6 flex flex-col hover:shadow-md transition-shadow">
          <h2 className="text-lg font-bold text-gray-900 mb-6">Répartition des statuts</h2>
          <div className="h-[300px] w-full flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={
                    stats.totalDiplomas > 0 
                      ? [
                          { name: 'Valides', value: stats.validDiplomas, color: '#10b981' },
                          { name: 'Révoqués', value: stats.revokedDiplomas, color: '#ef4444' }
                        ]
                      : [{ name: 'Vide', value: 1, color: '#d1d5db' }]
                  }
                  cx="50%"
                  cy="50%"
                  innerRadius={80}
                  outerRadius={110}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {
                    (stats.totalDiplomas > 0 
                      ? [
                          { name: 'Valides', value: stats.validDiplomas, color: '#10b981' },
                          { name: 'Révoqués', value: stats.revokedDiplomas, color: '#ef4444' }
                        ]
                      : [{ name: 'Vide', value: 1, color: '#d1d5db' }]
                    ).map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))
                  }
                </Pie>
                {stats.totalDiplomas > 0 && (
                  <Tooltip 
                    formatter={(value, name) => [value, name]}
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  />
                )}
              </PieChart>
            </ResponsiveContainer>
          </div>
          
          <div className="flex justify-center gap-6 mt-4">
            <div className="flex items-center">
              <div className="w-3 h-3 rounded-full bg-[#10b981] mr-2"></div>
              <span className="text-sm font-medium text-gray-600">Valides ({stats.validDiplomas || 0})</span>
            </div>
            <div className="flex items-center">
              <div className="w-3 h-3 rounded-full bg-[#ef4444] mr-2"></div>
              <span className="text-sm font-medium text-gray-600">Révoqués ({stats.revokedDiplomas || 0})</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VerifierDashboard;
