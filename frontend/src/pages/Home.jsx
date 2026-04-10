import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import logo from '../assets/images/logo-transparent.png';
import heroLockNetwork from '../assets/images/hero-lock-network.png';
import blockchainDiplomaImg from '../assets/images/blockchain_diploma.png';
import techVerificationImg from '../assets/images/tech_verification.png';
import cyberNetworkImg from '../assets/images/cyber_network.png';
import './home-theme.css';
import { 
  Eye, EyeOff, User, Building, CheckCircle, LogIn, UserPlus, Search,
  Shield, Award, Globe, ArrowRight, Check, Users, BookOpen, Menu, X, Star,
  Zap, Lock, Smartphone, TrendingUp, ChevronDown, Play, Upload
} from 'lucide-react';

const Home = () => {
  const { login } = useAuth();
  const [activeTab, setActiveTab] = useState('login');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [loginData, setLoginData] = useState({
    email: '',
    password: '',
    role: 'admin'
  });
  const [registerData, setRegisterData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    role: 'verifier',
    firstName: '',
    lastName: '',
    institutionName: '',
    studentId: '',
    department: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [diplomaFound, setDiplomaFound] = useState(null);
  const [searchingDiploma, setSearchingDiploma] = useState(false);

  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const loginResult = await login(
        loginData.email,
        loginData.password,
        loginData.role
      );

      if (loginResult.success) {
        setShowAuthModal(false);
        if (loginData.role === 'verifier') {
          navigate('/verifier');
        } else {
          navigate('/dashboard');
        }
      } else {
        setError(loginResult.message || 'Erreur lors de la connexion');
      }
    } catch (error) {
      console.error('Home: Erreur de connexion:', error);
      if (!error.response) {
        setError('Serveur indisponible. Vérifiez que le backend est démarré sur le port 5000.');
      } else {
        setError(error.response?.data?.message || 'Erreur lors de la connexion');
      }
    } finally {
      setLoading(false);
      console.log('Home: Loading false');
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    if (registerData.password !== registerData.confirmPassword) {
      setError('Les mots de passe ne correspondent pas');
      setLoading(false);
      return;
    }

    try {
      const { confirmPassword, ...registerPayload } = registerData;
      const response = await api.post('/auth/register', registerPayload);
      
      if (response.data.success) {
        if (response.data.data.assignedDiploma) {
          setSuccess('🎉 Compte créé et diplôme attribué! Redirection...');
        } else {
          setSuccess('✅ Compte créé avec succès! Redirection...');
        }
        // Se connecter avec les identifiants saisis (API /auth/register retourne aussi un token,
        // mais on utilise la même voie que le login pour garder un état cohérent côté frontend).
        const loginResult = await login(
          registerData.email,
          registerData.password,
          registerData.role
        );

        if (!loginResult.success) {
          setError(loginResult.message || 'Erreur lors de la connexion après inscription');
          setLoading(false);
          return;
        }
        setShowAuthModal(false);
        setTimeout(() => {
          if (registerData.role === 'verifier') {
            navigate('/verifier');
          } else {
            navigate('/dashboard');
          }
        }, 2000);
      }
    } catch (error) {
      if (!error.response) {
        setError('Serveur indisponible. Vérifiez que le backend est démarré sur le port 5000.');
      } else {
        setError(error.response?.data?.message || 'Erreur lors de l\'inscription');
      }
    } finally {
      setLoading(false);
    }
  };

  const searchDiploma = async () => {
    if (!registerData.studentId || !registerData.firstName || !registerData.lastName) {
      setError('Veuillez remplir le nom, prénom et code de l\'étudiant pour rechercher');
      return;
    }

    setSearchingDiploma(true);
    try {
      const response = await api.get(`/diplomas?search=${registerData.studentId}&limit=1`);
      
      if (response.data.data.diplomas.length > 0) {
        const diploma = response.data.data.diplomas[0];
        setDiplomaFound({
          ...diploma,
          degree: diploma.degree || 'Diplôme non spécifié',
          institution: diploma.institution || 'Établissement non spécifié'
        });
        setSuccess('Diplôme trouvé! Veuillez compléter l\'inscription.');
      } else {
        setDiplomaFound(null);
        setError('Aucun diplôme trouvé pour cet étudiant');
      }
    } catch (error) {
      setError('Erreur lors de la recherche du diplôme');
    } finally {
      setSearchingDiploma(false);
    }
  };

  return (
    <div className="max-h-screen theme-ocean">
      {/* Navigation */}
      <nav className="fixed top-0 w-full theme-navbar z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center min-h-[120px]">
            <div className="flex items-center transition-transform duration-300 hover:scale-110 cursor-pointer origin-left" onClick={() => window.scrollTo(0, 0)}>
              <img src={logo} alt="CertChain Logo" className="h-28 md:h-[130px] w-auto object-contain scale-125 md:scale-[1.6] origin-left" />
            </div>
            
            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center space-x-8">
              <a href="#features" className="theme-nav-link">
                Fonctionnalités
              </a>
              <a href="#how-it-works" className="theme-nav-link">
                Comment ça marche
              </a>
              <a href="#testimonials" className="theme-nav-link">
                Témoignages
              </a>
              <a href="#pricing" className="theme-nav-link">
                Tarifs
              </a>
              <button 
                onClick={() => setShowAuthModal(true)}
                className="px-6 py-2 theme-login-btn text-white rounded-full hover:shadow-lg transition-all flex items-center"
              >
                <LogIn className="h-4 w-4 mr-2" />
                Se connecter
              </button>
            </div>

            {/* Mobile menu button */}
            <button
              className="md:hidden p-2 text-white"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? (
                <X className="h-6 w-6" />
              ) : (
                <Menu className="h-6 w-6" />
              )}
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {mobileMenuOpen && (
          <div className="md:hidden bg-[#0b4650] border-t border-white/20">
            <div className="px-4 py-2 space-y-1">
              <a href="#features" className="block px-4 py-2 font-medium theme-mobile-link">
                Fonctionnalités
              </a>
              <a href="#how-it-works" className="block px-4 py-2 font-medium theme-mobile-link">
                Comment ça marche
              </a>
              <a href="#testimonials" className="block px-4 py-2 font-medium theme-mobile-link">
                Témoignages
              </a>
              <a href="#pricing" className="block px-4 py-2 font-medium theme-mobile-link">
                Tarifs
              </a>
              <button 
                onClick={() => setShowAuthModal(true)}
                className="w-full text-left px-4 py-2 theme-login-btn text-white rounded-full font-medium flex items-center"
              >
                <LogIn className="h-4 w-4 mr-2" />
                Se connecter
              </button>
            </div>
          </div>
        )}
      </nav>

      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
        {/* Dynamic background image */}
        <div
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{
            backgroundImage: `url(${blockchainDiplomaImg})`,
            filter: 'brightness(1.02) contrast(1.1) saturate(1.1)'
          }}
        ></div>
        <div className="absolute inset-0 bg-gradient-to-br from-slate-950/55 via-blue-950/50 to-indigo-950/55"></div>
        
        {/* Decorative Elements */}
        <div className="absolute top-20 left-10 w-72 h-72 bg-blue-500/20 rounded-full filter blur-3xl animate-pulse"></div>
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-purple-500/20 rounded-full filter blur-3xl animate-pulse"></div>
        
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="mb-8">
            <div className="inline-flex items-center px-4 py-2 bg-white/10 backdrop-blur-md rounded-full mb-6 border border-white/20">
              <Zap className="h-4 w-4 text-yellow-300 mr-2" />
              <span className="text-sm font-medium text-white">Révolutionnez la certification académique</span>
            </div>
            
            <h1 className="text-5xl md:text-7xl font-bold text-white mb-6 leading-tight">
              Diplômes Certifiés sur
              <span className="block text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 to-pink-300">
                Blockchain
              </span>
            </h1>
            
            <p className="text-xl md:text-2xl text-gray-200 mb-12 max-w-4xl mx-auto leading-relaxed">
              Plateforme de gestion des diplômes avec deux rôles : 
              <span className="text-yellow-300 font-semibold"> Administrateur</span> pour l'émission des diplômes et 
              <span className="text-blue-300 font-semibold"> Vérificateur</span> pour la consultation.
            </p>
            
          </div>
        </div>
        
        {/* Scroll Indicator */}
        <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2">
          <div className="animate-bounce">
            <ChevronDown className="h-6 w-6 text-white/60" />
          </div>
        </div>
        <div className="hero-wave"></div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 px-4 sm:px-6 lg:px-8 theme-soft-bg">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold theme-section-title mb-4">
              Pourquoi choisir CertChain?
            </h2>
            <p className="text-xl theme-section-subtitle max-w-3xl mx-auto">
              Une solution moderne pour la certification académique avec la puissance de la blockchain
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="group p-8 theme-card transition-all">
              <div className="w-16 h-16 theme-icon-circle flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <Shield className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-2xl font-semibold text-gray-900 mb-4">Administration</h3>
              <p className="text-gray-600 mb-4">
                Interface sécurisée pour les administrateurs afin d'émettre et gérer les diplômes
              </p>
              <a href="#" className="text-blue-600 font-medium flex items-center hover:text-blue-700">
                En savoir plus <ArrowRight className="h-4 w-4 ml-1" />
              </a>
            </div>
            
            <div className="group p-8 theme-card transition-all">
              <div className="w-16 h-16 theme-icon-circle flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <CheckCircle className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-2xl font-semibold text-gray-900 mb-4">Vérification</h3>
              <p className="text-gray-600 mb-4">
                Accès simple et rapide pour les vérificateurs afin de consulter et valider les diplômes
              </p>
              <a href="#" className="text-blue-600 font-medium flex items-center hover:text-blue-700">
                En savoir plus <ArrowRight className="h-4 w-4 ml-1" />
              </a>
            </div>
            
            <div className="group p-8 theme-card transition-all">
              <div className="w-16 h-16 theme-icon-circle flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <Lock className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-2xl font-semibold text-gray-900 mb-4">Sécurité Blockchain</h3>
              <p className="text-gray-600 mb-4">
                Protection maximale avec technologie blockchain pour l'intégrité des diplômes
              </p>
              <a href="#" className="text-blue-600 font-medium flex items-center hover:text-blue-700">
                En savoir plus <ArrowRight className="h-4 w-4 ml-1" />
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* How it Works */}
      <section id="how-it-works" className="py-20 px-4 sm:px-6 lg:px-8 bg-[#eaf6f5]">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold theme-section-title mb-4">
              Comment ça marche?
            </h2>
            <p className="text-xl theme-section-subtitle max-w-3xl mx-auto">
              Un processus simple en 3 étapes pour gérer et vérifier les diplômes
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-20 h-20 bg-[#cdeeea] rounded-full flex items-center justify-center mx-auto mb-6">
                <span className="text-3xl font-bold text-[#0f6f75]">1</span>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-4">Administration</h3>
              <p className="text-gray-600">
                L'administrateur émet le diplôme avec toutes les informations nécessaires
              </p>
            </div>
            
            <div className="text-center">
              <div className="w-20 h-20 bg-[#cdeeea] rounded-full flex items-center justify-center mx-auto mb-6">
                <span className="text-3xl font-bold text-[#0f6f75]">2</span>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-4">Blockchain</h3>
              <p className="text-gray-600">
                Le diplôme est enregistré sur la blockchain avec un hash unique et sécurisé
              </p>
            </div>
            
            <div className="text-center">
              <div className="w-20 h-20 bg-[#cdeeea] rounded-full flex items-center justify-center mx-auto mb-6">
                <span className="text-3xl font-bold text-[#0f6f75]">3</span>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-4">Vérification</h3>
              <p className="text-gray-600">
                Le vérificateur consulte et valide le diplôme via l'interface dédiée
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="theme-footer text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center mb-10 transition-transform duration-300 hover:scale-110 cursor-pointer origin-left" onClick={() => window.scrollTo(0, 0)}>
                <img src={logo} alt="CertChain Logo" className="h-28 md:h-[140px] w-auto object-contain scale-125 md:scale-[1.6] origin-left" />
              </div>
              <p className="text-gray-400">
                La référence en certification de diplômes sur blockchain.
              </p>
            </div>
            
            <div>
              <h3 className="font-semibold mb-4">Produit</h3>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#features" className="hover:text-white">Fonctionnalités</a></li>
                <li><a href="#how-it-works" className="hover:text-white">Sécurité</a></li>
                <li><a href="#pricing" className="hover:text-white">Tarifs</a></li>
              </ul>
            </div>
            
            <div>
              <h3 className="font-semibold mb-4">Ressources</h3>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#" className="hover:text-white">Documentation</a></li>
                <li><a href="#" className="hover:text-white">API</a></li>
                <li><a href="#" className="hover:text-white">Support</a></li>
              </ul>
            </div>
            
            <div>
              <h3 className="font-semibold mb-4">Entreprise</h3>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#" className="hover:text-white">À propos</a></li>
                <li><a href="#" className="hover:text-white">Carrières</a></li>
                <li><a href="#" className="hover:text-white">Contact</a></li>
              </ul>
            </div>
          </div>
          
          <div className="mt-8 pt-8 border-t border-gray-800 text-center">
            <p>&copy; 2024 CertChain. Tous droits réservés.</p>
          </div>
        </div>
      </footer>

      {/* Auth Modal */}
      {showAuthModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <div className="flex justify-between items-center">
                <h3 className="text-2xl font-bold text-gray-900">Connexion</h3>
                <button
                  onClick={() => setShowAuthModal(false)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <X className="h-5 w-5 text-gray-500" />
                </button>
              </div>
            </div>
            
            <div className="p-6">
              {/* Tabs */}
              <div className="flex border-b border-gray-200 mb-6">
                <button
                  onClick={() => setActiveTab('login')}
                  className={`flex-1 py-3 px-4 text-center font-medium transition-all ${
                    activeTab === 'login'
                      ? 'border-b-2 border-[#0f6f75] text-[#0f6f75]'
                      : 'border-b-2 border-transparent text-gray-500 hover:text-gray-700'
                  }`}
                >
                  <LogIn className="h-4 w-4 inline mr-2" />
                  Connexion
                </button>
                <button
                  onClick={() => setActiveTab('register')}
                  className={`flex-1 py-3 px-4 text-center font-medium transition-all ${
                    activeTab === 'register'
                      ? 'border-b-2 border-[#0f6f75] text-[#0f6f75]'
                      : 'border-b-2 border-transparent text-gray-500 hover:text-gray-700'
                  }`}
                >
                  <UserPlus className="h-4 w-4 inline mr-2" />
                  Créer un compte
                </button>
              </div>

              {/* Login Form */}
              {activeTab === 'login' && (
                <form className="space-y-4" onSubmit={handleLogin}>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Type de compte
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => setLoginData(prev => ({ ...prev, role: 'admin' }))}
                        className={`p-3 border rounded-lg text-center transition-colors ${
                          loginData.role === 'admin'
                            ? 'border-[#0f6f75] bg-[#eaf6f5]'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <Shield className="h-5 w-5 mx-auto mb-1 text-gray-600" />
                        <div className="text-xs font-medium">Administrateur</div>
                      </button>
                      
                      <button
                        type="button"
                        onClick={() => setLoginData(prev => ({ ...prev, role: 'verifier' }))}
                        className={`p-3 border rounded-lg text-center transition-colors ${
                          loginData.role === 'verifier'
                            ? 'border-[#0f6f75] bg-[#eaf6f5]'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <CheckCircle className="h-5 w-5 mx-auto mb-1 text-gray-600" />
                        <div className="text-xs font-medium">Vérificateur</div>
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Email
                    </label>
                    <input
                      type="email"
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0f6f75] focus:border-[#0f6f75]"
                      value={loginData.email}
                      onChange={(e) => setLoginData(prev => ({ ...prev, email: e.target.value }))}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Mot de passe
                    </label>
                    <div className="relative">
                      <input
                        type={showPassword ? 'text' : 'password'}
                        required
                        className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0f6f75] focus:border-[#0f6f75]"
                        value={loginData.password}
                        onChange={(e) => setLoginData(prev => ({ ...prev, password: e.target.value }))}
                      />
                      <button
                        type="button"
                        className="absolute inset-y-0 right-0 pr-3 flex items-center"
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        {showPassword ? (
                          <EyeOff className="h-4 w-4 text-gray-400" />
                        ) : (
                          <Eye className="h-4 w-4 text-gray-400" />
                        )}
                      </button>
                    </div>
                  </div>

                  {error && (
                    <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg text-sm">
                      {error}
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-gradient-to-r from-[#081D2F] to-[#0f6f75] text-white py-2 px-4 rounded-lg font-medium hover:opacity-90 disabled:opacity-50 transition-all"
                  >
                    {loading ? (
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mx-auto"></div>
                    ) : (
                      'Se connecter'
                    )}
                  </button>
                  
                  <div className="text-center">
                    <span className="text-sm text-gray-600">
                      Pas encore de compte?{' '}
                      <button
                        type="button"
                        onClick={() => setActiveTab('register')}
                        className="font-medium text-[#0f6f75] hover:text-[#081D2F]"
                      >
                        Créer un compte
                      </button>
                    </span>
                  </div>
                </form>
              )}

              {/* Register Form */}
              {activeTab === 'register' && (
                <form className="space-y-4" onSubmit={handleRegister}>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Type de compte
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => setRegisterData(prev => ({ ...prev, role: 'admin' }))}
                        className={`p-3 border rounded-lg text-center transition-colors ${
                          registerData.role === 'admin'
                            ? 'border-[#0f6f75] bg-[#eaf6f5]'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <Shield className="h-5 w-5 mx-auto mb-1 text-gray-600" />
                        <div className="text-xs font-medium">Administrateur</div>
                      </button>
                      
                      <button
                        type="button"
                        onClick={() => setRegisterData(prev => ({ ...prev, role: 'verifier' }))}
                        className={`p-3 border rounded-lg text-center transition-colors ${
                          registerData.role === 'verifier'
                            ? 'border-[#0f6f75] bg-[#eaf6f5]'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <CheckCircle className="h-5 w-5 mx-auto mb-1 text-gray-600" />
                        <div className="text-xs font-medium">Vérificateur</div>
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Email *
                    </label>
                    <input
                      type="email"
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0f6f75] focus:border-[#0f6f75]"
                      value={registerData.email}
                      onChange={(e) => setRegisterData(prev => ({ ...prev, email: e.target.value }))}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Mot de passe *
                    </label>
                    <div className="relative">
                      <input
                        type={showPassword ? 'text' : 'password'}
                        required
                        className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0f6f75] focus:border-[#0f6f75]"
                        value={registerData.password}
                        onChange={(e) => setRegisterData(prev => ({ ...prev, password: e.target.value }))}
                      />
                      <button
                        type="button"
                        className="absolute inset-y-0 right-0 pr-3 flex items-center"
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        {showPassword ? (
                          <EyeOff className="h-4 w-4 text-gray-400" />
                        ) : (
                          <Eye className="h-4 w-4 text-gray-400" />
                        )}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Confirmer le mot de passe *
                    </label>
                    <div className="relative">
                      <input
                        type={showConfirmPassword ? 'text' : 'password'}
                        required
                        className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0f6f75] focus:border-[#0f6f75]"
                        value={registerData.confirmPassword}
                        onChange={(e) => setRegisterData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                      />
                      <button
                        type="button"
                        className="absolute inset-y-0 right-0 pr-3 flex items-center"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      >
                        {showConfirmPassword ? (
                          <EyeOff className="h-4 w-4 text-gray-400" />
                        ) : (
                          <Eye className="h-4 w-4 text-gray-400" />
                        )}
                      </button>
                    </div>
                  </div>

                  {error && (
                    <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg text-sm">
                      {error}
                    </div>
                  )}

                  {success && (
                    <div className="bg-green-50 border border-green-200 text-green-600 px-4 py-3 rounded-lg text-sm">
                      {success}
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-gradient-to-r from-[#081D2F] to-[#0f6f75] text-white py-2 px-4 rounded-lg font-medium hover:opacity-90 disabled:opacity-50 transition-all"
                  >
                    {loading ? (
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mx-auto"></div>
                    ) : (
                      'Créer mon compte'
                    )}
                  </button>
                  
                  <div className="text-center">
                    <span className="text-sm text-gray-600">
                      Vous avez déjà un compte?{' '}
                      <button
                        type="button"
                        onClick={() => setActiveTab('login')}
                        className="font-medium text-[#0f6f75] hover:text-[#081D2F]"
                      >
                        Se connecter
                      </button>
                    </span>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Home;
