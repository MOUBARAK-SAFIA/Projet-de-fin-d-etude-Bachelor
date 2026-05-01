import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { Search, ChevronDown, ChevronLeft, ChevronRight } from 'lucide-react';

const DiplomaList = () => {
  const { user } = useAuth();
  const isVerifier = user?.role === 'verifier';

  const [diplomas, setDiplomas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchParams] = useSearchParams();
  const initialSearch = searchParams.get('search') || '';

  const [searchTerm, setSearchTerm] = useState(initialSearch);
  const [activeSearch, setActiveSearch] = useState(initialSearch);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalDiplomas, setTotalDiplomas] = useState(0);
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterYear, setFilterYear] = useState('');
  const [filterFiliere, setFilterFiliere] = useState('all');

  const navigate = useNavigate();

  useEffect(() => {
    const s = searchParams.get('search') || '';
    setSearchTerm(s);
    setActiveSearch(s);
    // When URL search changes, we usually want to reset page to 1
  }, [searchParams]);

  const fetchDiplomas = useCallback(
    async (page = 1, search = activeSearch, status = filterStatus, year = filterYear, filiere = filterFiliere) => {
      try {
        setLoading(true);
        const params = new URLSearchParams({
          page: page.toString(),
          limit: '10',
          ...(search && { search }),
          ...(status && status !== 'all' && { status }),
          ...(year && { year }),
          ...(filiere && filiere !== 'all' && { filiere }),
        });

        const response = await api.get(`/diplomas?${params}`);
        setDiplomas(response.data.data.diplomas);
        setTotalPages(response.data.data.pagination.totalPages);
        setCurrentPage(response.data.data.pagination.currentPage);
        setTotalDiplomas(response.data.data.pagination.totalDiplomas ?? 0);
      } catch (err) {
        setError(err.response?.data?.message || 'Erreur lors du chargement des diplômes');
        console.error(err);
      } finally {
        setLoading(false);
      }
    },
    [filterStatus, filterYear, filterFiliere, activeSearch]
  );

  useEffect(() => {
    fetchDiplomas(currentPage, activeSearch, filterStatus, filterYear, filterFiliere);
  }, [currentPage, filterStatus, filterYear, filterFiliere, activeSearch, fetchDiplomas]);

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchTerm.trim() !== '') {
      navigate(`/diplomas?search=${encodeURIComponent(searchTerm.trim())}`);
    } else {
      navigate(`/diplomas`);
    }
  };

  const applyChip = (status, year) => {
    setFilterStatus(status);
    setFilterYear(year);
    setCurrentPage(1);
  };

  const handleRevoke = async (diplomaId) => {
    if (!window.confirm('Êtes-vous sûr de vouloir révoquer ce diplôme ?')) {
      return;
    }

    try {
      await api.put(`/diplomas/${diplomaId}/revoke`);
      fetchDiplomas(currentPage, activeSearch, filterStatus, filterYear);
    } catch (err) {
      setError(err.response?.data?.message || 'Erreur lors de la révocation du diplôme');
      console.error(err);
    }
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

  const getMentionColor = (mention) => {
    const m = mention?.toLowerCase() || '';
    if (m.includes('très bien') || m.includes('excellent')) return 'text-[#7e22ce]';
    if (m.includes('bien')) return 'text-[#0f6f75]';
    if (m.includes('passable')) return 'text-red-500';
    return 'text-gray-600';
  };

  const chipClass = (active) =>
    `px-3 py-1.5 rounded-full text-xs font-semibold transition-colors border ${
      active
        ? 'bg-[#0f6f75] text-white border-[#0f6f75]'
        : 'bg-white text-gray-600 border-gray-200 hover:border-[#0f6f75]/40'
    }`;

  const pageBtnActive = (active) =>
    active
      ? 'bg-[#0f6f75] text-white'
      : 'border border-gray-200 bg-white text-gray-500 hover:bg-gray-50';

  if (loading && diplomas.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#0f6f75]" />
      </div>
    );
  }

  return (
    <div className="space-y-6 flex flex-col h-full">
      <div className="flex justify-between items-center mb-2 flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">
            {isVerifier ? 'Diplômes certifiés' : 'Gestion des diplômes'}
          </h1>
          <p className="text-gray-500 mt-1 text-sm">
            {`${totalDiplomas || 0} diplômes enregistrés`}
          </p>
        </div>
        {!isVerifier && (
          <button
            type="button"
            onClick={() => navigate('/create')}
            className="bg-white border border-gray-200 text-gray-600 px-4 py-2.5 rounded-xl hover:bg-gray-50 transition-all font-medium text-sm flex items-center shadow-sm"
          >
            <span className="mr-2 text-lg leading-none">+</span> Nouveau
          </button>
        )}
      </div>

      <div className="flex flex-col gap-4 mb-2">
        <form onSubmit={handleSearch} className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
          <input
            type="text"
            placeholder={
              isVerifier
                ? 'Rechercher par nom ou numéro étudiant...'
                : 'Rechercher un étudiant ou un diplôme...'
            }
            className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-[#0f6f75] focus:border-[#0f6f75] shadow-sm outline-none transition-shadow"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </form>

        {isVerifier ? (
          <div className="flex flex-wrap gap-2">
            <button type="button" className={chipClass(filterStatus === 'all' && !filterYear)} onClick={() => applyChip('all', '')}>
              Tous
            </button>
            <button type="button" className={chipClass(filterStatus === 'valid')} onClick={() => applyChip('valid', filterYear)}>
              Valides
            </button>
            <button type="button" className={chipClass(filterStatus === 'revoked')} onClick={() => applyChip('revoked', filterYear)}>
              Révoqués
            </button>
            <button type="button" className={chipClass(filterYear === '2024')} onClick={() => applyChip(filterStatus, filterYear === '2024' ? '' : '2024')}>
              2024
            </button>
            <button type="button" className={chipClass(filterYear === '2023')} onClick={() => applyChip(filterStatus, filterYear === '2023' ? '' : '2023')}>
              2023
            </button>
          </div>
        ) : (
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex space-x-3">
              <select
                value={filterStatus}
                onChange={(e) => {
                  setFilterStatus(e.target.value);
                  setCurrentPage(1);
                }}
                className="px-4 py-3 border border-gray-200 bg-white rounded-xl text-sm font-medium text-gray-700 shadow-sm outline-none hover:bg-gray-50 focus:ring-2 focus:ring-[#0f6f75] appearance-none pr-8 cursor-pointer"
                style={{ backgroundImage: `url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%239ca3af' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3e%3cpolyline points='6 9 12 15 18 9'%3e%3c/polyline%3e%3c/svg%3e")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 0.75rem center', backgroundSize: '1em' }}
              >
                <option value="all">Statut (Tous)</option>
                <option value="valid">Valides</option>
                <option value="revoked">Révoqués</option>
              </select>

              <select
                value={filterFiliere}
                onChange={(e) => {
                  setFilterFiliere(e.target.value);
                  setCurrentPage(1);
                }}
                className="px-4 py-3 border border-gray-200 bg-white rounded-xl text-sm font-medium text-gray-700 shadow-sm outline-none hover:bg-gray-50 focus:ring-2 focus:ring-[#0f6f75] appearance-none pr-8 cursor-pointer max-w-[150px] sm:max-w-none text-ellipsis"
                style={{ backgroundImage: `url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%239ca3af' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3e%3cpolyline points='6 9 12 15 18 9'%3e%3c/polyline%3e%3c/svg%3e")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 0.75rem center', backgroundSize: '1em' }}
              >
                <option value="all">Filière (Toutes)</option>
                <option value="Informatique">Informatique</option>
                <option value="Développement Web">Développement Web</option>
                <option value="Génie Logiciel">Génie Logiciel</option>
                <option value="Réseaux">Réseaux</option>
                <option value="Cybersécurité">Cybersécurité</option>
                <option value="Gestion">Gestion</option>
                <option value="Mécanique">Mécanique</option>
              </select>
            </div>
          </div>
        )}
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-xl text-sm shadow-sm">
          {error}
        </div>
      )}

      <div className="bg-[#eef5fa] rounded-2xl shadow-sm border border-[#c8dbe7] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-[#d5e3ec]">
            <thead>
              <tr className="bg-[#e7f0f6]">
                <th className="px-6 py-5 text-left text-[11px] font-bold text-gray-400 uppercase tracking-widest">
                  Étudiant
                </th>
                <th className="px-6 py-5 text-left text-[11px] font-bold text-gray-400 uppercase tracking-widest">
                  N° Étudiant
                </th>
                <th className="px-6 py-5 text-left text-[11px] font-bold text-gray-400 uppercase tracking-widest">
                  Diplôme
                </th>
                <th className="px-6 py-5 text-left text-[11px] font-bold text-gray-400 uppercase tracking-widest">
                  Mention
                </th>
                <th className="px-6 py-5 text-left text-[11px] font-bold text-gray-400 uppercase tracking-widest">
                  Statut
                </th>
                <th className="px-6 py-5 text-left text-[11px] font-bold text-gray-400 uppercase tracking-widest">
                  Action
                </th>
              </tr>
            </thead>
            <tbody className="bg-[#eef5fa] divide-y divide-[#d5e3ec]">
              {diplomas.length > 0 ? (
                diplomas.map((diploma) => (
                  <tr key={diploma._id} className="hover:bg-[#e2edf5] transition-colors">
                    <td className="px-6 py-5 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10 rounded-full bg-[#f4fbfb] text-[#127b87] flex items-center justify-center text-sm font-bold border border-[#cdeeea]">
                          {getInitials(diploma.studentName)}
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-bold text-gray-900">{diploma.studentName}</div>
                          <div className="text-xs text-gray-400 mt-0.5">
                            {new Date(diploma.graduationDate).toLocaleDateString('fr-FR')}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-5 whitespace-nowrap text-sm text-gray-500 font-mono">
                      {diploma.studentId}
                    </td>
                    <td className="px-6 py-5">
                      <div className="text-sm text-gray-700 font-medium line-clamp-1">{diploma.degree}</div>
                    </td>
                    <td className="px-6 py-5 whitespace-nowrap">
                      <span className={`text-sm font-bold ${getMentionColor(diploma.grade)}`}>
                        {diploma.grade || '-'}
                      </span>
                    </td>
                    <td className="px-6 py-5 whitespace-nowrap">
                      <span
                        className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${
                          diploma.isRevoked
                            ? 'bg-red-50 text-red-600 border border-red-100'
                            : 'bg-emerald-50 text-emerald-600 border border-emerald-100'
                        }`}
                      >
                        <span
                          className={`h-1.5 w-1.5 rounded-full mr-2 ${
                            diploma.isRevoked ? 'bg-red-500' : 'bg-emerald-500'
                          }`}
                        />
                        {diploma.isRevoked ? 'Révoqué' : 'Valide'}
                      </span>
                    </td>
                    <td className="px-6 py-5 whitespace-nowrap text-sm font-medium">
                      <div className="flex space-x-3">
                        <button
                          type="button"
                          onClick={() => navigate(`/diplomas/${diploma._id}`)}
                          className="px-4 py-1.5 border border-gray-200 text-[#0f6f75] hover:bg-[#f0fdfa] rounded-lg text-xs font-semibold transition-colors"
                        >
                          Voir
                        </button>
                        {!isVerifier &&
                          (!diploma.isRevoked ? (
                            <button
                              type="button"
                              onClick={() => handleRevoke(diploma._id)}
                              className="px-4 py-1.5 border border-red-200 text-red-500 hover:bg-red-50 rounded-lg text-xs font-medium transition-colors"
                            >
                              Révoquer
                            </button>
                          ) : (
                            <button
                              type="button"
                              disabled
                              className="px-4 py-1.5 border border-gray-100 bg-gray-50 text-gray-400 rounded-lg text-xs font-medium cursor-not-allowed hidden md:inline-block"
                            >
                              Révoqué
                            </button>
                          ))}
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="6" className="px-6 py-12 text-center text-gray-500">
                    {searchTerm ? 'Aucun diplôme trouvé pour cette recherche.' : 'Aucun diplôme.'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="flex items-center justify-between pt-4 pb-8 flex-wrap gap-3">
        <div className="text-sm text-gray-500">
          Affichage {(currentPage - 1) * 10 + 1}-{Math.min(currentPage * 10, totalDiplomas || 0)} sur{' '}
          {totalDiplomas || 0}
        </div>

        {totalPages > 1 && (
          <div className="flex items-center space-x-1">
            <button
              type="button"
              onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
              disabled={currentPage === 1}
              className="px-3 py-1.5 rounded-lg border border-gray-200 bg-white text-sm text-gray-600 hover:bg-gray-50 disabled:opacity-50"
            >
              Précédent
            </button>

            {[...Array(totalPages)].map((_, i) => (
              <button
                key={i}
                type="button"
                onClick={() => setCurrentPage(i + 1)}
                className={`w-9 h-9 flex items-center justify-center rounded-lg text-sm font-medium transition-colors ${pageBtnActive(currentPage === i + 1)}`}
              >
                {i + 1}
              </button>
            ))}

            <button
              type="button"
              onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
              disabled={currentPage === totalPages}
              className="px-3 py-1.5 rounded-lg border border-gray-200 bg-white text-sm text-gray-600 hover:bg-gray-50 disabled:opacity-50"
            >
              Suivant
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default DiplomaList;
