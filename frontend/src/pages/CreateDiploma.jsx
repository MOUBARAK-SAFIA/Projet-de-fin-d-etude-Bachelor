import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { Check, Shield, FileText, User } from 'lucide-react';
import QRCode from 'react-qr-code';

const CreateDiploma = () => {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    studentName: '',
    studentId: '',
    degree: '',
    institution: '',
    graduationDate: '',
    grade: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [createdDiploma, setCreatedDiploma] = useState(null);
  
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const nextStep = () => {
    if (step === 1) {
      if (!formData.studentName || !formData.studentId) {
        setError('Veuillez remplir tous les champs obligatoires.');
        return;
      }
    }
    setError('');
    setStep(2);
  };

  const prevStep = () => {
    setStep(1);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.degree || !formData.institution || !formData.graduationDate || !formData.grade) {
      setError('Veuillez remplir tous les champs obligatoires.');
      return;
    }
    
    setLoading(true);
    setError('');

    try {
      const response = await api.post('/diplomas', formData);
      setCreatedDiploma(response.data.data);
      setSuccess(true);
      setStep(3); // Confirmation
    } catch (error) {
      setError(error.response?.data?.message || 'Erreur lors de la création du diplôme');
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setFormData({
      studentName: '',
      studentId: '',
      degree: '',
      institution: '',
      graduationDate: '',
      grade: ''
    });
    setSuccess(false);
    setCreatedDiploma(null);
    setError('');
    setStep(1);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Nouveau diplôme</h1>
        <p className="text-gray-500 mt-1 text-sm">Remplir le formulaire et enregistrer sur blockchain</p>
      </div>

      {/* Stepper */}
      <div className="flex items-center justify-between max-w-2xl px-4 py-2 mb-10">
        <div className="flex items-center">
          <div className={`h-8 w-8 rounded-full flex items-center justify-center font-bold text-sm ${step > 1 ? 'bg-[#1e40af] text-white' : step === 1 ? 'bg-[#1e40af] text-white' : 'bg-gray-200 text-gray-400'}`}>
            {step > 1 ? <Check className="h-4 w-4" /> : '1'}
          </div>
          <span className={`ml-3 text-sm font-bold ${step >= 1 ? 'text-emerald-500' : 'text-gray-400'}`}>Étudiant</span>
        </div>
        <div className={`flex-1 h-1 mx-4 rounded-full ${step > 1 ? 'bg-emerald-500' : 'bg-gray-200'}`}></div>
        
        <div className="flex items-center">
          <div className={`h-8 w-8 rounded-full flex items-center justify-center font-bold text-sm ${step > 2 ? 'bg-[#1e40af] text-white' : step === 2 ? 'bg-[#1e40af] text-white' : 'bg-gray-200 text-gray-400'}`}>
            {step > 2 ? <Check className="h-4 w-4" /> : '2'}
          </div>
          <span className={`ml-3 text-sm font-bold ${step >= 2 ? 'text-blue-600' : 'text-gray-400'}`}>Diplôme</span>
        </div>
        <div className={`flex-1 h-1 mx-4 rounded-full ${step > 2 ? 'bg-blue-600' : 'bg-gray-200'}`}></div>
        
        <div className="flex items-center">
          <div className={`h-8 w-8 rounded-full flex items-center justify-center font-bold text-sm ${step === 3 ? 'bg-[#1e40af] text-white' : 'bg-gray-200 text-gray-400'}`}>
            3
          </div>
          <span className={`ml-3 text-sm font-bold ${step === 3 ? 'text-gray-900' : 'text-gray-400'}`}>Confirmation</span>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-xl text-sm shadow-sm md:max-w-2xl mt-4">
          {error}
        </div>
      )}

      {/* Etape 1: Etudiant */}
      {step === 1 && (
        <div className="max-w-2xl">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
            <h2 className="text-lg font-bold text-gray-900 mb-6 flex items-center">
              Étape 1 — Informations de l'étudiant
            </h2>
            
            <div className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="studentName" className="block text-[13px] font-bold text-gray-700 mb-2">
                    Nom de l'étudiant *
                  </label>
                  <input
                    type="text"
                    id="studentName"
                    name="studentName"
                    required
                    placeholder="Ahmed Benali"
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 shadow-sm sm:text-sm"
                    value={formData.studentName}
                    onChange={handleChange}
                  />
                </div>
                <div>
                  <label htmlFor="studentId" className="block text-[13px] font-bold text-gray-700 mb-2">
                    N° d'étudiant (Code) *
                  </label>
                  <input
                    type="text"
                    id="studentId"
                    name="studentId"
                    required
                    placeholder="2024-001"
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 shadow-sm sm:text-sm"
                    value={formData.studentId}
                    onChange={handleChange}
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="mt-6 flex justify-end">
            <button
              onClick={nextStep}
              className="bg-gray-50 border border-gray-200 text-gray-700 font-medium px-6 py-3 rounded-xl hover:bg-gray-100 transition shadow-sm text-sm"
            >
              Étape suivante →
            </button>
          </div>
        </div>
      )}

      {/* Etape 2: Diplome */}
      {step === 2 && (
        <div className="max-w-2xl">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 mb-6">
            <h2 className="text-lg font-bold text-gray-900 mb-6 flex items-center">
              Étape 2 — Informations du diplôme
            </h2>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div>
                <label htmlFor="degree" className="block text-[13px] font-bold text-gray-700 mb-2">
                  Intitulé du diplôme *
                </label>
                <input
                  type="text"
                  id="degree"
                  name="degree"
                  required
                  placeholder="Licence en Développement Web"
                  className="w-full px-4 py-3 border border-blue-500 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 shadow-sm sm:text-sm"
                  value={formData.degree}
                  onChange={handleChange}
                />
              </div>

              <div>
                <label htmlFor="institution" className="block text-[13px] font-bold text-gray-700 mb-2">
                  Établissement *
                </label>
                <input
                  type="text"
                  id="institution"
                  name="institution"
                  required
                  placeholder="École Supérieure de Technologie"
                  className="w-full px-4 py-3 border border-blue-500 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 shadow-sm sm:text-sm"
                  value={formData.institution}
                  onChange={handleChange}
                />
              </div>

              <div>
                <label htmlFor="graduationDate" className="block text-[13px] font-bold text-gray-700 mb-2">
                  Date d'obtention *
                </label>
                <input
                  type="date"
                  id="graduationDate"
                  name="graduationDate"
                  required
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 shadow-sm sm:text-sm text-gray-700"
                  value={formData.graduationDate}
                  onChange={handleChange}
                />
              </div>

              <div>
                <label htmlFor="grade" className="block text-[13px] font-bold text-gray-700 mb-2">
                  Mention *
                </label>
                <select
                  id="grade"
                  name="grade"
                  required
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 shadow-sm sm:text-sm text-blue-600 font-medium bg-white"
                  value={formData.grade}
                  onChange={handleChange}
                >
                  <option value="" disabled>Sélectionner</option>
                  <option value="Passable">Passable</option>
                  <option value="Assez bien">Assez bien</option>
                  <option value="Bien">Bien</option>
                  <option value="Très bien">Très bien</option>
                  <option value="Excellent">Excellent</option>
                </select>
              </div>
            </div>
          </div>



          <div className="flex justify-between items-center">
            <button
              type="button"
              onClick={prevStep}
              className="bg-white border border-gray-200 text-gray-700 font-medium px-6 py-3 rounded-xl hover:bg-gray-50 transition shadow-sm text-sm"
            >
              ← Précédent
            </button>
            <button
              onClick={handleSubmit}
              disabled={loading}
              className="bg-gray-50 border border-gray-200 text-gray-400 font-medium px-6 py-3 rounded-xl hover:bg-gray-100 transition shadow-sm text-sm disabled:opacity-50"
            >
              {loading ? (
                <div className="flex items-center">
                   <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-400 mr-2"></div>
                   Création en cours...
                </div>
              ) : (
                'Étape suivante →'
              )}
            </button>
          </div>
        </div>
      )}

      {/* Etape 3: Confirmation */}
      {step === 3 && createdDiploma && (
        <div className="max-w-2xl bg-white rounded-2xl shadow-sm border border-gray-100 p-8 text-center">
          <div className="mx-auto flex flex-col justify-center items-center h-24 w-24 rounded-full bg-emerald-50 mb-6 border-4 border-emerald-100">
             <Shield className="h-10 w-10 text-emerald-500" />
          </div>
          <h2 className="text-3xl font-bold text-gray-900 mb-2">
            Succès de la certification !
          </h2>
          <p className="text-gray-500 mb-8 max-w-sm mx-auto">
            Le diplôme de <span className="font-bold text-gray-900">{createdDiploma.studentName}</span> a été sécurisé sur la blockchain de manière permanente.
          </p>

          <div className="bg-gray-50 rounded-xl p-6 mb-8 max-w-sm mx-auto border border-gray-100">
             <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">QR CODE OFFICIEUX</h3>
             <div className="bg-white p-4 rounded-xl shadow-sm inline-block">
               <QRCode value={`${window.location.origin}/verify/${createdDiploma._id}`} size={160} />
             </div>
          </div>

          <div className="flex justify-center space-x-4">
            <button
               onClick={handleReset}
               className="px-6 py-3 border border-gray-200 rounded-xl shadow-sm text-sm font-bold text-gray-700 bg-white hover:bg-gray-50 transition"
            >
               Nouveau diplôme
            </button>
            <button
               onClick={() => navigate(`/diplomas/${createdDiploma._id}`)}
               className="px-6 py-3 bg-[#081D2F] text-white rounded-xl shadow-sm text-sm font-bold hover:bg-[#0b2b45] transition"
            >
               Afficher le certificat
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default CreateDiploma;
