import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import api from '../services/api';
import { ArrowLeft, CheckCircle, XCircle } from 'lucide-react';

const shorten = (str, left = 8, right = 6) => {
  if (!str || str.length <= left + right + 3) return str || '—';
  return `${str.slice(0, left)}…${str.slice(-right)}`;
};

const DiplomaDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [payload, setPayload] = useState(null);

  useEffect(() => {
    const load = async () => {
      if (!id) return;
      setLoading(true);
      setError('');
      try {
        const res = await api.get(`/diplomas/verify/${id}`);
        setPayload(res.data?.data);
      } catch (e) {
        setError(e.response?.data?.message || 'Impossible de charger ce diplôme.');
        setPayload(null);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id]);

  const getInitials = (name) => {
    if (!name) return '??';
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .substring(0, 2)
      .toUpperCase();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#0f6f75]" />
      </div>
    );
  }

  if (error || !payload?.diploma) {
    return (
      <div className="space-y-4">
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="inline-flex items-center text-sm font-medium text-[#0f6f75] hover:underline"
        >
          <ArrowLeft className="w-4 h-4 mr-1" />
          Retour
        </button>
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm">
          {error || 'Diplôme introuvable.'}
        </div>
      </div>
    );
  }

  const d = payload.diploma;
  const valid = payload.status === 'valid';
  const revoked = payload.status === 'revoked';

  const verifyUrl = `${window.location.origin}/verify/${d._id}`;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div>
          <button
            type="button"
            onClick={() => navigate('/diplomas')}
            className="inline-flex items-center text-sm font-medium text-gray-600 hover:text-[#0f6f75] mb-3"
          >
            <ArrowLeft className="w-4 h-4 mr-1" />
            Retour
          </button>
          <h1 className="text-2xl font-bold text-gray-900">{d.studentName}</h1>
          <p className="text-gray-500 text-sm mt-1">Diplôme #{d.studentId}</p>
        </div>
        <span
          className={`inline-flex items-center self-start px-4 py-1.5 rounded-full text-xs font-semibold border ${
            valid
              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
              : revoked
                ? 'bg-red-50 text-red-700 border-red-200'
                : 'bg-amber-50 text-amber-800 border-amber-200'
          }`}
        >
          <span
            className={`h-1.5 w-1.5 rounded-full mr-2 ${
              valid ? 'bg-emerald-500' : revoked ? 'bg-red-500' : 'bg-amber-500'
            }`}
          />
          {valid ? 'Diplôme valide' : revoked ? 'Diplôme révoqué' : 'Statut à confirmer'}
        </span>
      </div>

      {valid && (
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50/80 px-4 py-3 text-sm text-emerald-900 flex items-center gap-2">
          <CheckCircle className="w-5 h-5 shrink-0 text-emerald-600" />
          <span>
            Diplôme authentifié — hash vérifié
            {payload.blockchainAvailable === false
              ? ' (blockchain indisponible, vérification en base)'
              : ' sur la blockchain'}
            .
          </span>
        </div>
      )}

      {revoked && (
        <div className="rounded-2xl border border-red-200 bg-red-50/80 px-4 py-3 text-sm text-red-900 flex items-center gap-2">
          <XCircle className="w-5 h-5 shrink-0 text-red-600" />
          Ce diplôme a été révoqué et ne doit plus être considéré comme valide.
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <h2 className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-4">
              Informations étudiant
            </h2>
            <dl className="space-y-3 text-sm">
              <div className="flex justify-between gap-4 border-b border-gray-50 pb-3">
                <dt className="text-gray-500">Nom complet</dt>
                <dd className="font-semibold text-gray-900 text-right">{d.studentName}</dd>
              </div>
              <div className="flex justify-between gap-4 border-b border-gray-50 pb-3">
                <dt className="text-gray-500">N° étudiant</dt>
                <dd className="font-mono text-gray-900 text-right">{d.studentId}</dd>
              </div>
              <div className="flex justify-between gap-4 border-b border-gray-50 pb-3">
                <dt className="text-gray-500">Diplôme</dt>
                <dd className="text-gray-900 text-right">{d.degree}</dd>
              </div>
              <div className="flex justify-between gap-4 border-b border-gray-50 pb-3">
                <dt className="text-gray-500">Établissement</dt>
                <dd className="text-gray-900 text-right">{d.institution}</dd>
              </div>
              <div className="flex justify-between gap-4 border-b border-gray-50 pb-3">
                <dt className="text-gray-500">Date d&apos;obtention</dt>
                <dd className="text-gray-900 text-right">
                  {d.graduationDate
                    ? new Date(d.graduationDate).toLocaleDateString('fr-FR', {
                        day: 'numeric',
                        month: 'long',
                        year: 'numeric',
                      })
                    : '—'}
                </dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-gray-500">Mention</dt>
                <dd className="font-semibold text-[#0f6f75] text-right">{d.grade || '—'}</dd>
              </div>
            </dl>
          </div>


        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 h-fit">
          <h2 className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-4">
            Vérification publique
          </h2>
          <div className="flex flex-col items-center">
            <div className="w-20 h-20 rounded-full bg-[#f0fdfa] text-[#0f6f75] flex items-center justify-center text-xl font-bold border border-[#cdeeea] mb-4">
              {getInitials(d.studentName)}
            </div>
            <p className="text-xs text-gray-500 text-center mb-4">
              Lien de vérification publique (QR / partage)
            </p>
            <a
              href={verifyUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full text-center px-4 py-2.5 rounded-xl border-2 border-[#0f6f75] text-[#0f6f75] text-sm font-semibold hover:bg-[#0f6f75] hover:text-white transition-colors"
            >
              Ouvrir la page publique
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DiplomaDetail;
