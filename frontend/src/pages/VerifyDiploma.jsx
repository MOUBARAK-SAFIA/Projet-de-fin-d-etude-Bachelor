import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../services/api';
import { X, Check } from 'lucide-react';
import QRCode from 'react-qr-code';

const VerifyDiploma = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [verification, setVerification] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const verifyDiploma = async () => {
    try {
      const response = await api.get(`/diplomas/verify/${id}`);
      setVerification(response.data.data);
    } catch (error) {
      setError(error.response?.data?.message || 'Diplôme non trouvé ou invalide');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) {
      verifyDiploma();
    }
  }, [id]);



  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const isValide = verification?.status === 'valid';
  const isRevoked = verification?.status === 'revoked';

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#0f6f75]"></div>
      </div>
    );
  }

  if (error || !verification) {
    return (
      <div className="h-full flex items-center justify-center py-20">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-sm border border-red-100 p-8 text-center">
          <div className="mx-auto flex items-center justify-center h-16 w-16 bg-red-50 rounded-full mb-4">
             <X className="h-8 w-8 text-red-500" />
          </div>
          <h1 className="text-xl font-bold text-gray-900 mb-2">Diplôme introuvable</h1>
          <p className="text-gray-500 mb-6 text-sm">{error || 'Absence de données'}</p>
          <button
             onClick={() => navigate(-1)}
             className="px-6 py-2.5 bg-white border border-gray-200 text-gray-700 rounded-xl hover:bg-gray-50 transition shadow-sm font-medium"
          >
             Retour
          </button>
        </div>
      </div>
    );
  }

  const { diploma } = verification;

  return (
    <div className="max-w-5xl mx-auto h-full flex flex-col space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate(-1)}
            className="px-4 py-2 border border-gray-200 bg-white rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-50 transition shadow-sm"
          >
            ← Retour
          </button>
          <div className="ml-2">
            <h1 className="text-2xl font-bold text-gray-900 tracking-tight">{diploma.studentName}</h1>
            <p className="text-sm text-gray-400 mt-0.5">
              Diplôme #{diploma.studentId} · Créé le {new Date(diploma.graduationDate).toLocaleDateString('fr-FR')}
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          <span className={`inline-flex items-center px-4 py-2 rounded-full text-sm font-bold shadow-sm border ${
              isRevoked
                ? 'bg-red-50 text-red-600 border-red-100'
                : 'bg-emerald-50 text-emerald-600 border-emerald-100'
            }`}
          >
             <span className={`h-2 w-2 rounded-full mr-2 ${isRevoked ? 'bg-red-500' : 'bg-emerald-500'}`}></span>
             {isRevoked ? 'Diplôme révoqué' : 'Diplôme valide'}
          </span>

        </div>
      </div>

      <div className="space-y-6">
        {/* Top block: Infos */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
           <h2 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-8">INFORMATIONS ÉTUDIANT</h2>
           
           <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-4">
              <div className="flex justify-between items-center pb-4 border-b border-gray-50">
                 <span className="text-sm font-bold text-gray-400">Nom complet</span>
                 <span className="text-sm font-bold text-gray-900">{diploma.studentName}</span>
              </div>
              <div className="flex justify-between items-center pb-4 border-b border-gray-50">
                 <span className="text-sm font-bold text-gray-400">N° étudiant</span>
                 <span className="text-sm font-bold text-gray-600 font-mono">{diploma.studentId}</span>
              </div>
              <div className="flex justify-between items-center pb-4 border-b border-gray-50">
                 <span className="text-sm font-bold text-gray-400">Diplôme</span>
                 <span className="text-[15px] font-bold text-gray-900">{diploma.degree}</span>
              </div>
              <div className="flex justify-between items-center pb-4 border-b border-gray-50">
                 <span className="text-sm font-bold text-gray-400">Établissement</span>
                 <span className="text-[15px] font-bold text-gray-900">{diploma.institution}</span>
              </div>
              <div className="flex justify-between items-center pb-4 border-b border-gray-50">
                 <span className="text-sm font-bold text-gray-400">Date obtention</span>
                 <span className="text-[15px] font-bold text-gray-900">{formatDate(diploma.graduationDate)}</span>
              </div>
              <div className="flex justify-between items-center pb-4 border-b border-gray-50 md:border-b-0 md:pb-0">
                 <span className="text-sm font-bold text-gray-400">Mention</span>
                 <span className="text-[15px] font-bold text-[#1e40af]">{diploma.grade || '-'}</span>
              </div>
           </div>
        </div>

        {/* Bottom block: QR Code */}
        <div className="max-w-md mx-auto w-full">
           {/* Block QR Code */}
           <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 flex flex-col items-center justify-center">
              <h2 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-6 w-full text-center">QR CODE VÉRIFICATION</h2>
              <div className="bg-[#081D2F] p-4 rounded-xl shadow-inner mb-4 flex items-center justify-center h-[180px] w-[180px]">
                 <div className="bg-white p-2 rounded-lg">
                   <QRCode 
                     value={`${window.location.origin}/verify/${diploma._id}`} 
                     size={140} 
                   />
                 </div>
              </div>
              <p className="text-xs font-medium text-gray-400">Scanner pour vérifier</p>
           </div>
        </div>
      </div>
    </div>
  );
};

export default VerifyDiploma;
