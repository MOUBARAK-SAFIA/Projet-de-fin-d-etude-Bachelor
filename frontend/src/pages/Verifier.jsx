import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Camera,
  Upload,
  Search,
  CheckCircle,
  AlertCircle,
  Check,
  Image as ImageIcon,
  Download,
} from 'lucide-react';
import jsQR from 'jsqr';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import api from '../services/api';

const HISTORY_KEY = 'certchain_verifier_history';
const MAX_HISTORY = 8;

const shorten = (str, left = 8, right = 6) => {
  if (!str || str.length <= left + right + 3) return str || '—';
  return `${str.slice(0, left)}…${str.slice(-right)}`;
};

const Verifier = () => {
  const [verificationMethod, setVerificationMethod] = useState('qr');
  const [diplomaId, setDiplomaId] = useState('');
  const [verificationResult, setVerificationResult] = useState(null);
  const [blockchainAvailable, setBlockchainAvailable] = useState(true);
  const [loading, setLoading] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [error, setError] = useState('');
  const [history, setHistory] = useState(() => {
    try {
      const raw = sessionStorage.getItem(HISTORY_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  });

  const pdfRef = useRef(null);
  const [downloadingPDF, setDownloadingPDF] = useState(false);

  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const rafRef = useRef(null);
  const scanningActiveRef = useRef(false);

  const stopCamera = useCallback(() => {
    scanningActiveRef.current = false;
    if (rafRef.current != null) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setScanning(false);
  }, []);

  useEffect(() => () => stopCamera(), [stopCamera]);

  const handleDownloadPDF = async () => {
    if (!pdfRef.current || !verificationResult?.diploma) return;
    setDownloadingPDF(true);
    try {
      const actionButtons = pdfRef.current.querySelector('.pdf-exclude');
      if (actionButtons) actionButtons.style.display = 'none';

      const canvas = await html2canvas(pdfRef.current, {
        scale: 2,
        useCORS: true,
        backgroundColor: '#ffffff'
      });

      if (actionButtons) actionButtons.style.display = 'flex';

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'px',
        format: [canvas.width, canvas.height]
      });
      pdf.addImage(imgData, 'PNG', 0, 0, canvas.width, canvas.height);
      pdf.save(`diplome_${verificationResult.diploma.studentName.replace(/\s+/g, '_')}.pdf`);
    } catch (error) {
      console.error('Erreur lors de la génération du PDF', error);
      alert('Erreur lors de la génération du PDF');
    } finally {
      setDownloadingPDF(false);
    }
  };

  const pushHistory = useCallback((entry) => {
    setHistory((prev) => {
      const next = [
        entry,
        ...prev.filter((x) => x.id !== entry.id || x.status !== entry.status),
      ].slice(0, MAX_HISTORY);
      try {
        sessionStorage.setItem(HISTORY_KEY, JSON.stringify(next));
      } catch {
        /* ignore */
      }
      return next;
    });
  }, []);

  const toDiplomaId = (raw) => {
    const value = String(raw || '').trim();
    if (!value) return '';
    const match = value.match(/\/verify\/([^/?]+)/i);
    if (match?.[1]) return match[1];
    const match2 = value.match(/[?&]id=([^&]+)/i);
    if (match2?.[1]) return match2[1];
    return value;
  };

  const fetchVerification = async (id) => {
    const mongoId = toDiplomaId(id);
    if (!mongoId) {
      setVerificationResult(null);
      setError("Identifiant invalide. Veuillez entrer un numéro d'étudiant ou un ID valide.");
      return;
    }

    setError('');
    setLoading(true);
    try {
      const response = await api.get(`/diplomas/verify/${mongoId}`);
      const payload = response.data?.data;
      const diploma = payload?.diploma;
      const status = payload?.status;
      setBlockchainAvailable(payload?.blockchainAvailable !== false);

      const valid = status === 'valid';
      const revoked = status === 'revoked';

      setVerificationResult({
        valid,
        revoked,
        status,
        diploma: diploma
          ? {
              id: diploma._id,
              studentId: diploma.studentId,
              studentName: diploma.studentName,
              degree: diploma.degree,
              institution: diploma.institution,
              date: diploma.graduationDate,
              grade: diploma.grade,
              hash: diploma.hash,
              blockNumber: diploma.blockNumber,
              txHash: diploma.txHash,
            }
          : null,
        error:
          status === 'revoked'
            ? 'Diplôme révoqué.'
            : status === 'invalid'
              ? 'Diplôme invalide.'
              : null,
      });

      if (diploma) {
        pushHistory({
          id: diploma._id,
          name: diploma.studentName,
          status: revoked ? 'revoked' : valid ? 'valid' : 'invalid',
        });
      }
    } catch (e) {
      setVerificationResult({
        valid: false,
        revoked: false,
        error: e.response?.data?.message || 'Erreur lors de la vérification.',
      });
    } finally {
      setLoading(false);
    }
  };

  const scanFrame = useCallback(() => {
    const video = videoRef.current;
    if (!video || !scanningActiveRef.current) return;

    if (video.readyState === video.HAVE_ENOUGH_DATA) {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (ctx) {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const code = jsQR(imageData.data, imageData.width, imageData.height, {
          inversionAttempts: 'attemptBoth',
        });
        if (code?.data) {
          stopCamera();
          fetchVerification(code.data);
          return;
        }
      }
    }

    rafRef.current = requestAnimationFrame(scanFrame);
  }, [stopCamera]);

  const handleQRScan = async () => {
    if (scanning) {
      stopCamera();
      return;
    }
    setError('');
    setVerificationResult(null);

    if (!navigator.mediaDevices?.getUserMedia) {
      setError("La caméra n'est pas disponible sur ce navigateur.");
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: 'environment' } },
        audio: false,
      });
      streamRef.current = stream;
      const video = videoRef.current;
      if (!video) {
        stream.getTracks().forEach((t) => t.stop());
        return;
      }
      video.srcObject = stream;
      await video.play();
      scanningActiveRef.current = true;
      setScanning(true);
      scanFrame();
    } catch {
      setError("Impossible d'accéder à la caméra (permission refusée ou appareil indisponible).");
      stopCamera();
    }
  };

  const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;
    setError('');
    setVerificationResult(null);
    setLoading(true);
    try {
      const imageUrl = URL.createObjectURL(file);
      const img = new Image();
      img.crossOrigin = 'anonymous';
      await new Promise((resolve, reject) => {
        img.onload = resolve;
        img.onerror = reject;
        img.src = imageUrl;
      });

      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error('Canvas non supporté');

      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;
      ctx.drawImage(img, 0, 0);

      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const code = jsQR(imageData.data, imageData.width, imageData.height, {
        inversionAttempts: 'attemptBoth',
      });
      URL.revokeObjectURL(imageUrl);

      if (!code?.data) {
        setError("Aucun QR code détecté. Essayez une image plus nette ou le zoom sur le QR.");
        return;
      }

      await fetchVerification(code.data);
    } catch (e) {
      setError(e?.message || "Erreur lors de l'analyse de l'image.");
    } finally {
      setLoading(false);
      event.target.value = '';
    }
  };

  const handleManualVerification = async () => {
    if (!diplomaId.trim()) {
      setError("Veuillez saisir un code de l'étudiant ou une URL de vérification.");
      return;
    }
    await fetchVerification(diplomaId);
  };

  const methodBtn = (id, icon, title, desc) => {
    const active = verificationMethod === id;
    return (
      <button
        type="button"
        onClick={() => {
          setVerificationMethod(id);
          if (id !== 'qr') stopCamera();
        }}
        className={`text-left p-4 rounded-xl border-2 transition-all ${
          active
            ? 'border-[#0f6f75] bg-[#f0fdfa] shadow-sm'
            : 'border-gray-100 bg-white hover:border-gray-200'
        }`}
      >
        <div className="flex items-start gap-3">
          <div
            className={`shrink-0 w-10 h-10 rounded-xl flex items-center justify-center ${
              active ? 'bg-[#0f6f75] text-white' : 'bg-slate-100 text-slate-600'
            }`}
          >
            {icon}
          </div>
          <div>
            <h3 className="font-bold text-gray-900 text-sm">{title}</h3>
            <p className="text-xs text-gray-500 mt-0.5 leading-snug">{desc}</p>
          </div>
        </div>
      </button>
    );
  };

  const getInitials = (name) => {
    if (!name) return '??';
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .substring(0, 2)
      .toUpperCase();
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 tracking-tight mb-4">Vérification de diplôme</h1>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
        <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-3">
          Méthode de vérification
        </p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {methodBtn(
            'qr',
            <Camera className="w-5 h-5" />,
            'Scanner QR code',
            'Utilisez la caméra de l’appareil.'
          )}
          {methodBtn(
            'upload',
            <ImageIcon className="w-5 h-5" />,
            'Télécharger une image',
            'Photo ou capture écran.'
          )}
          {methodBtn(
            'manual',
            <Search className="w-5 h-5" />,
            'Vérification manuelle',
            "Code de l'étudiant ou lien."
          )}
        </div>
      </div>

      <div className={`transition-all duration-500 ease-in-out ${verificationResult || (loading && verificationMethod !== 'upload') ? 'grid grid-cols-1 xl:grid-cols-3 gap-6 items-start' : 'max-w-md mx-auto space-y-6'}`}>
        <div className={`space-y-6 ${verificationResult || (loading && verificationMethod !== 'upload') ? 'xl:col-span-1' : ''}`}>
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            {error && (
              <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded-xl text-sm">
                {error}
              </div>
            )}

            {verificationMethod === 'qr' && (
              <div>
                <h3 className="font-bold text-gray-900 mb-2">Caméra</h3>
                <p className="text-sm text-gray-500 mb-4">
                  Cadrez le QR code du diplôme. La lecture est automatique.
                </p>
                <div className="relative rounded-xl overflow-hidden bg-slate-900 aspect-[4/3] mb-4">
                  <video
                    ref={videoRef}
                    className="w-full h-full object-cover min-h-[200px]"
                    playsInline
                    muted
                  />
                  {!scanning && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center text-white/80 pointer-events-none bg-slate-800/90">
                      <Camera className="w-12 h-12 mb-2 opacity-60" />
                      <p className="text-sm">Caméra inactive</p>
                    </div>
                  )}
                </div>
                <button
                  type="button"
                  onClick={handleQRScan}
                  disabled={loading}
                  className="w-full py-3 rounded-xl bg-[#0f6f75] text-white font-semibold text-sm hover:bg-[#0d5c62] disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  <Camera className="w-4 h-4" />
                  {scanning ? 'Arrêter le scan' : 'Démarrer le scan'}
                </button>
              </div>
            )}

            {verificationMethod === 'upload' && (
              <div>
                <h3 className="font-bold text-gray-900 mb-2">Image</h3>
                <div className="border-2 border-dashed border-gray-200 rounded-xl p-8 text-center hover:border-[#0f6f75]/40 transition-colors">
                  <Upload className="w-10 h-10 mx-auto text-gray-400 mb-3" />
                  <p className="text-sm text-gray-600 mb-4">Glissez-déposez ou choisissez un fichier image</p>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileUpload}
                    className="hidden"
                    id="verifier-file-upload"
                  />
                  <label
                    htmlFor="verifier-file-upload"
                    className="inline-block px-5 py-2 rounded-xl bg-slate-100 text-gray-800 text-sm font-medium cursor-pointer hover:bg-slate-200"
                  >
                    Choisir une image
                  </label>
                </div>
                {loading && (
                  <p className="text-center text-sm text-gray-500 mt-4">Analyse en cours…</p>
                )}
              </div>
            )}

            {verificationMethod === 'manual' && (
              <div>
                <h3 className="font-bold text-gray-900 mb-2">Saisie manuelle</h3>
                <label className="block text-xs font-medium text-gray-500 mb-1.5">
                  Code de l'étudiant ou URL
                </label>
                <input
                  type="text"
                  value={diplomaId}
                  onChange={(e) => setDiplomaId(e.target.value)}
                  placeholder="Entrez le code de l'étudiant ou le lien..."
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-[#0f6f75] focus:border-[#0f6f75] outline-none mb-4 font-mono"
                />
                <button
                  type="button"
                  onClick={handleManualVerification}
                  disabled={loading}
                  className="w-full py-3 rounded-xl bg-[#0f6f75] text-white font-semibold text-sm hover:bg-[#0d5c62] disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  <Check className="w-4 h-4" />
                  {loading ? 'Vérification…' : 'Vérifier ce diplôme'}
                </button>
              </div>
            )}
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
            <h3 className="font-bold text-gray-900 text-sm mb-3">Historique récent</h3>
            {history.length === 0 ? (
              <p className="text-sm text-gray-400">Aucune vérification récente dans cette session.</p>
            ) : (
              <ul className="space-y-2">
                {history.map((h) => (
                  <li
                    key={`${h.id}-${h.name}`}
                    className="flex items-center justify-between text-sm py-2 border-b border-gray-50 last:border-0"
                  >
                    <span className="font-medium text-gray-800 truncate pr-2">{h.name}</span>
                    <span
                      className={`shrink-0 text-xs font-semibold px-2 py-0.5 rounded-full ${
                        h.status === 'valid'
                          ? 'bg-emerald-50 text-emerald-700'
                          : h.status === 'revoked'
                            ? 'bg-red-50 text-red-700'
                            : 'bg-amber-50 text-amber-800'
                      }`}
                    >
                      {h.status === 'valid' ? 'Valide' : h.status === 'revoked' ? 'Révoqué' : 'Invalide'}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        {(verificationResult || (loading && verificationMethod !== 'upload')) && (
          <div className="xl:col-span-2">
            {loading && verificationMethod !== 'upload' && (
            <div className="bg-white rounded-2xl border border-gray-100 p-12 flex flex-col items-center justify-center">
              <div className="animate-spin rounded-full h-10 w-10 border-2 border-[#0f6f75] border-t-transparent mb-3" />
              <p className="text-sm text-gray-500">Vérification en cours…</p>
            </div>
          )}

          {verificationResult && (
            <div
              ref={pdfRef}
              className={`rounded-2xl border p-6 shadow-sm ${
                verificationResult.valid
                  ? 'bg-emerald-50/40 border-emerald-200'
                  : verificationResult.revoked
                    ? 'bg-red-50/40 border-red-200'
                    : 'bg-white border-gray-200'
              }`}
            >
              {verificationResult.valid ? (
                <>
                  <div className="flex items-center gap-2 mb-4">
                    <CheckCircle className="w-6 h-6 text-emerald-600 shrink-0" />
                    <div>
                      <h3 className="font-bold text-emerald-900">Diplôme authentifié</h3>
                      <p className="text-sm text-emerald-800/90">
                        Hash vérifié
                        {!blockchainAvailable ? ' (blockchain indisponible — base de données)' : ' sur la blockchain'}
                      </p>
                    </div>
                  </div>

                  {verificationResult.diploma && (
                    <>
                      <div className="bg-slate-100/80 rounded-xl p-4 mb-4 flex gap-4 items-start">
                        <div className="w-14 h-14 rounded-full bg-[#0f6f75] text-white flex items-center justify-center font-bold shrink-0">
                          {getInitials(verificationResult.diploma.studentName)}
                        </div>
                        <div>
                          <p className="font-bold text-gray-900 text-lg">
                            {verificationResult.diploma.studentName}
                          </p>
                          <p className="text-sm text-gray-500">N° {verificationResult.diploma.studentId}</p>
                        </div>
                      </div>

                      <dl className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm mb-4">
                        <div>
                          <dt className="text-gray-500 text-xs">Diplôme</dt>
                          <dd className="font-medium text-gray-900">{verificationResult.diploma.degree}</dd>
                        </div>
                        <div>
                          <dt className="text-gray-500 text-xs">Établissement</dt>
                          <dd className="font-medium text-gray-900">{verificationResult.diploma.institution}</dd>
                        </div>
                        <div>
                          <dt className="text-gray-500 text-xs">Date</dt>
                          <dd className="font-medium text-gray-900">
                            {verificationResult.diploma?.date
                              ? new Date(verificationResult.diploma.date).toLocaleDateString('fr-FR', {
                                  day: 'numeric',
                                  month: 'long',
                                  year: 'numeric',
                                })
                              : '—'}
                          </dd>
                        </div>
                        <div>
                          <dt className="text-gray-500 text-xs">Mention</dt>
                          <dd className="font-semibold text-[#0f6f75]">{verificationResult.diploma?.grade || '—'}</dd>
                        </div>
                      </dl>


                    </>
                  )}
                </>
              ) : (
                <div className="flex items-start gap-3">
                  <AlertCircle className="w-6 h-6 text-red-600 shrink-0 mt-0.5" />
                  <div>
                    <h3 className="font-bold text-red-900">Vérification échouée</h3>
                    <p className="text-sm text-red-800 mt-1">
                      {verificationResult.error || 'Ce diplôme ne peut pas être validé.'}
                    </p>
                  </div>
                </div>
              )}

              <div className="mt-6 flex flex-col sm:flex-row gap-3 pdf-exclude">
                {verificationResult.valid && (
                  <button
                    type="button"
                    onClick={handleDownloadPDF}
                    disabled={downloadingPDF}
                    className="w-full py-2.5 rounded-xl bg-[#0f6f75] text-white font-medium hover:bg-[#0d5c62] disabled:opacity-50 flex items-center justify-center gap-2 shadow-sm"
                  >
                    <Download className="w-4 h-4" />
                    {downloadingPDF ? 'Génération...' : 'Télécharger en PDF'}
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => {
                    setVerificationResult(null);
                    setDiplomaId('');
                    setError('');
                  }}
                  className="w-full py-2.5 rounded-xl border border-gray-200 text-sm font-medium text-gray-700 hover:bg-gray-50 bg-white"
                >
                  Nouvelle vérification
                </button>
              </div>
            </div>
          )}
        </div>
        )}
      </div>
    </div>
  );
};

export default Verifier;
