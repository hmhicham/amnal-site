import React, { useState, useEffect } from 'react';
import { AlertCircle, CheckCircle, Laptop, Monitor, Printer, Wifi, HardDrive, Send, User, Wrench, Clock, CheckCircle2, XCircle, PlayCircle, LogOut, LogIn } from 'lucide-react';
import config from './config';

// Configuration de l'API
const API_URL = config.API_URL;

export default function TicketPanneIT() {
  const [tickets, setTickets] = useState([]);
  const [currentView, setCurrentView] = useState('login');
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token') || null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const [loginData, setLoginData] = useState({ email: '', password: '' });
  const [registerData, setRegisterData] = useState({
    nom: '', email: '', password: '', departement: ''
  });
  
  const [formData, setFormData] = useState({
    typePanne: '',
    priorite: 'normale',
    description: '',
    materiel: ''
  });
  
  const [showSuccess, setShowSuccess] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [stats, setStats] = useState({
    en_attente: 0,
    en_cours: 0,
    resolu: 0
  });

  const typesMateriels = [
    { value: 'pc', label: 'PC/Ordinateur', icon: Monitor },
    { value: 'laptop', label: 'Laptop/Portable', icon: Laptop },
    { value: 'imprimante', label: 'Imprimante', icon: Printer },
    { value: 'reseau', label: 'Réseau/WiFi', icon: Wifi },
    { value: 'serveur', label: 'Serveur', icon: HardDrive },
    { value: 'autre', label: 'Autre', icon: AlertCircle }
  ];

  const typesPannes = [
    'PC ne démarre pas',
    'Écran noir',
    'Problème de connexion Internet',
    'Imprimante ne fonctionne pas',
    'Logiciel planté',
    'Virus/Malware',
    'Mot de passe oublié',
    'Disque dur plein',
    'Surchauffe',
    'Autre problème'
  ];

  const departements = [
    'Administration',
    'Comptabilité',
    'Ressources Humaines',
    'Ventes',
    'Marketing',
    'IT',
    'Production',
    'Autre'
  ];

  // Vérifier si l'utilisateur est connecté au chargement
  useEffect(() => {
    if (token) {
      verifyToken();
    }
  }, [token]);

  // Charger les tickets quand l'utilisateur est connecté
  useEffect(() => {
    if (user) {
      loadTickets();
      loadStats();
    }
  }, [user]);

  // Fonction pour vérifier le token
  const verifyToken = async () => {
    try {
      const response = await fetch(`${API_URL}/tickets`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (response.ok) {
        // Token valide, récupérer les infos utilisateur complètes depuis l'API
        const userResponse = await fetch(`${API_URL}/auth/me`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (userResponse.ok) {
          const userData = await userResponse.json();
          console.log('Informations utilisateur récupérées:', userData.user);
          setUser(userData.user);
          setCurrentView(userData.user.role === 'technicien' || userData.user.role === 'admin' ? 'technicien' : 'user');
        } else {
          // Fallback: décoder depuis le token si l'API /me n'existe pas
          const userData = JSON.parse(atob(token.split('.')[1]));
          setUser(userData);
          setCurrentView(userData.role === 'technicien' || userData.role === 'admin' ? 'technicien' : 'user');
        }
      } else {
        // Token invalide
        logout();
      }
    } catch (err) {
      console.error('Erreur vérification token:', err);
      logout();
    }
  };

  // Connexion
  const handleLogin = async () => {
    if (!loginData.email || !loginData.password) {
      setError('Veuillez remplir tous les champs');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(loginData)
      });

      const data = await response.json();

      if (response.ok) {
        console.log('Connexion réussie, informations utilisateur:', data.user);
        setToken(data.token);
        setUser(data.user);
        localStorage.setItem('token', data.token);
        // Set view based on role: admin manages tickets, users create tickets
        if (data.user.role === 'admin' || data.user.role === 'technicien') {
          setCurrentView('technicien'); // Admin/Technicien manage tickets
        } else {
          setCurrentView('user'); // Regular users create tickets
        }
        setLoginData({ email: '', password: '' });
      } else {
        setError(data.error || 'Erreur de connexion');
      }
    } catch (err) {
      setError('Erreur de connexion au serveur');
      console.error('Erreur login:', err);
    } finally {
      setLoading(false);
    }
  };

  // Inscription
  const handleRegister = async () => {
    if (!registerData.nom || !registerData.email || !registerData.password || !registerData.departement) {
      setError('Veuillez remplir tous les champs');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await fetch(`${API_URL}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...registerData, role: 'user' })
      });

      const data = await response.json();

      if (response.ok) {
        setShowSuccess(true);
        setTimeout(() => {
          setShowSuccess(false);
          setCurrentView('login');
        }, 2000);
        setRegisterData({ nom: '', email: '', password: '', departement: '' });
      } else {
        setError(data.error || 'Erreur lors de l\'inscription');
      }
    } catch (err) {
      setError('Erreur de connexion au serveur');
      console.error('Erreur register:', err);
    } finally {
      setLoading(false);
    }
  };

  // Déconnexion
  const logout = () => {
    setToken(null);
    setUser(null);
    setTickets([]);
    setCurrentView('login');
    localStorage.removeItem('token');
  };

  // Charger les tickets
  const loadTickets = async () => {
    try {
      const response = await fetch(`${API_URL}/tickets`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        const data = await response.json();
        setTickets(data);
      }
    } catch (err) {
      console.error('Erreur chargement tickets:', err);
    }
  };

  // Charger les statistiques
  const loadStats = async () => {
    try {
      const response = await fetch(`${API_URL}/stats`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        const data = await response.json();
        setStats(data);
      }
    } catch (err) {
      console.error('Erreur chargement stats:', err);
    }
  };

  // Créer un ticket
  const handleSubmit = async () => {
    if (!formData.typePanne || !formData.materiel || !formData.description) {
      setError('Veuillez remplir tous les champs obligatoires');
      return;
    }

    setLoading(true);
    setError('');

    try {
      // Transformer les données pour correspondre au format attendu par le backend
      const ticketData = {
        type_panne: formData.typePanne,
        materiel: formData.materiel,
        priorite: formData.priorite,
        description: formData.description
      };

      const response = await fetch(`${API_URL}/tickets`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(ticketData)
      });

      const data = await response.json();

      if (response.ok) {
        setShowSuccess(true);
        setFormData({
          typePanne: '',
          priorite: 'normale',
          description: '',
          materiel: ''
        });
        setTimeout(() => setShowSuccess(false), 5000);
        loadTickets();
        loadStats();
      } else {
        setError(data.error || 'Erreur lors de la création du ticket');
      }
    } catch (err) {
      setError('Erreur de connexion au serveur');
      console.error('Erreur création ticket:', err);
    } finally {
      setLoading(false);
    }
  };

  // Mettre à jour le statut d'un ticket
  const updateTicketStatus = async (ticketId, newStatus, notes) => {
    try {
      const response = await fetch(`${API_URL}/tickets/${ticketId}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ statut: newStatus, notes_technicien: notes })
      });

      if (response.ok) {
        loadTickets();
        loadStats();
        setSelectedTicket(null);
      }
    } catch (err) {
      console.error('Erreur mise à jour statut:', err);
    }
  };

  // Ajouter une note
  const addNoteToTicket = async (ticketId, note) => {
    if (!note.trim()) return;

    try {
      const response = await fetch(`${API_URL}/tickets/${ticketId}/notes`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ note })
      });

      if (response.ok) {
        loadTickets();
      }
    } catch (err) {
      console.error('Erreur ajout note:', err);
    }
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const getPrioriteColor = (priorite) => {
    switch(priorite) {
      case 'urgente': return 'bg-red-100 text-red-800 border-red-300';
      case 'haute': return 'bg-orange-100 text-orange-800 border-orange-300';
      case 'normale': return 'bg-blue-100 text-blue-800 border-blue-300';
      case 'basse': return 'bg-gray-100 text-gray-800 border-gray-300';
      default: return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  const getStatusLabel = (statut) => {
    const labels = {
      'en_attente': 'En attente',
      'en_cours': 'En cours',
      'resolu': 'Résolu',
      'ferme': 'Fermé'
    };
    return labels[statut] || statut;
  };

  const getStatusColor = (statut) => {
    switch(statut) {
      case 'en_attente': return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      case 'en_cours': return 'bg-blue-100 text-blue-800 border-blue-300';
      case 'resolu': return 'bg-green-100 text-green-800 border-green-300';
      case 'ferme': return 'bg-gray-100 text-gray-800 border-gray-300';
      default: return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  const MaterielIcon = ({ type }) => {
    const materiel = typesMateriels.find(m => m.value === type);
    const Icon = materiel?.icon || AlertCircle;
    return <Icon className="w-5 h-5" />;
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleString('fr-FR');
  };

  const TicketCard = ({ ticket, isTechnicien }) => (
    <div className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-center gap-2">
          <MaterielIcon type={ticket.materiel} />
          <div>
            <h3 className="font-semibold text-gray-800">{ticket.utilisateur_nom}</h3>
            <p className="text-sm text-gray-600">{ticket.departement}</p>
          </div>
        </div>
        <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${getPrioriteColor(ticket.priorite)}`}>
          {ticket.priorite}
        </span>
      </div>
      
      <div className="mb-2">
        <p className="font-medium text-gray-700">{ticket.type_panne}</p>
        <p className="text-sm text-gray-600 mt-1">{ticket.description}</p>
      </div>

      {ticket.technicien_nom && (
        <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
          <Wrench className="w-4 h-4" />
          <span>Technicien: {ticket.technicien_nom}</span>
        </div>
      )}

      {ticket.notes_technicien && (
        <div className="bg-blue-50 border border-blue-200 rounded p-2 mb-2 text-sm">
          <p className="font-semibold text-blue-800">Note technique:</p>
          <p className="text-blue-700">{ticket.notes_technicien}</p>
        </div>
      )}
      
      <div className="flex items-center justify-between text-xs text-gray-500 pt-2 border-t">
        <span>{formatDate(ticket.date_creation)}</span>
        <span className={`px-2 py-1 rounded border ${getStatusColor(ticket.statut)}`}>
          {getStatusLabel(ticket.statut)}
        </span>
      </div>

      {isTechnicien && (
        <button
          onClick={() => setSelectedTicket(ticket)}
          className="mt-3 w-full bg-indigo-600 hover:bg-indigo-700 text-white py-2 rounded-lg text-sm font-medium transition-colors"
        >
          Gérer ce ticket
        </button>
      )}
    </div>
  );

  const TechnicienModal = ({ ticket, onClose }) => {
    const [note, setNote] = useState('');

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
        <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
          <div className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-bold text-gray-800">Gestion du Ticket #{ticket.id}</h2>
              <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
                <XCircle className="w-6 h-6" />
              </button>
            </div>

            <div className="space-y-4">
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="font-semibold text-gray-800 mb-2">Détails du ticket</h3>
                <div className="space-y-2 text-sm">
                  <p><span className="font-medium">Utilisateur:</span> {ticket.utilisateur_nom}</p>
                  <p><span className="font-medium">Email:</span> {ticket.utilisateur_email}</p>
                  <p><span className="font-medium">Département:</span> {ticket.departement}</p>
                  <p><span className="font-medium">Type de panne:</span> {ticket.type_panne}</p>
                  <p><span className="font-medium">Matériel:</span> {ticket.materiel}</p>
                  <p><span className="font-medium">Priorité:</span> <span className={`px-2 py-1 rounded ${getPrioriteColor(ticket.priorite)}`}>{ticket.priorite}</span></p>
                  <p><span className="font-medium">Description:</span> {ticket.description}</p>
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Changer le statut
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => updateTicketStatus(ticket.id, 'en_cours', note)}
                    className="flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                  >
                    <PlayCircle className="w-5 h-5" />
                    En cours
                  </button>
                  <button
                    onClick={() => updateTicketStatus(ticket.id, 'resolu', note)}
                    className="flex items-center justify-center gap-2 px-4 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors"
                  >
                    <CheckCircle2 className="w-5 h-5" />
                    Résolu
                  </button>
                  <button
                    onClick={() => updateTicketStatus(ticket.id, 'en_attente', note)}
                    className="flex items-center justify-center gap-2 px-4 py-3 bg-yellow-600 hover:bg-yellow-700 text-white rounded-lg transition-colors"
                  >
                    <Clock className="w-5 h-5" />
                    En attente
                  </button>
                  <button
                    onClick={() => updateTicketStatus(ticket.id, 'ferme', note)}
                    className="flex items-center justify-center gap-2 px-4 py-3 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors"
                  >
                    <XCircle className="w-5 h-5" />
                    Fermer
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Ajouter une note technique
                </label>
                <textarea
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  rows="3"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  placeholder="Décrivez les actions effectuées..."
                />
                <button
                  onClick={() => {
                    addNoteToTicket(ticket.id, note);
                    setNote('');
                  }}
                  className="mt-2 w-full bg-indigo-600 hover:bg-indigo-700 text-white py-2 rounded-lg transition-colors"
                >
                  Ajouter la note
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Page de connexion/inscription
  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 flex items-center justify-center p-6">
        <div className="w-full max-w-6xl">
          <div className="grid md:grid-cols-2 gap-8 items-center">
            
            {/* Left Side - Branding */}
            <div className="hidden md:block">
              <div className="bg-white rounded-3xl p-12 shadow-xl">
                <div className="flex items-center gap-4 mb-8">
                  <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center">
                    <Wrench className="w-8 h-8 text-white" />
                  </div>
                  <div>
                    <h1 className="text-4xl font-bold text-gray-900">AMNAL</h1>
                    <p className="text-gray-600">Enterprise IT Solutions</p>
                  </div>
                </div>
                
                <div className="space-y-6">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center flex-shrink-0">
                      <CheckCircle className="w-6 h-6 text-blue-600" />
                    </div>
                    <div>
                      <h3 className="font-bold text-gray-900 mb-1">Gestion Simplifiée</h3>
                      <p className="text-gray-600 text-sm">Gérez vos tickets IT en toute simplicité</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 bg-indigo-100 rounded-xl flex items-center justify-center flex-shrink-0">
                      <Clock className="w-6 h-6 text-indigo-600" />
                    </div>
                    <div>
                      <h3 className="font-bold text-gray-900 mb-1">Suivi en Temps Réel</h3>
                      <p className="text-gray-600 text-sm">Suivez l'état de vos demandes instantanément</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center flex-shrink-0">
                      <Wrench className="w-6 h-6 text-purple-600" />
                    </div>
                    <div>
                      <h3 className="font-bold text-gray-900 mb-1">Support Professionnel</h3>
                      <p className="text-gray-600 text-sm">Une équipe technique dédiée à votre service</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Side - Form */}
            <div>
              {/* Mobile Logo */}
              <div className="md:hidden text-center mb-8">
                <div className="inline-flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center">
                    <Wrench className="w-6 h-6 text-white" />
                  </div>
                  <h1 className="text-3xl font-bold text-gray-900">AMNAL</h1>
                </div>
              </div>

              {/* Alerts */}
              {error && (
                <div className="mb-6 bg-red-50 border-l-4 border-red-500 rounded-lg p-4 animate-shake">
                  <div className="flex items-center gap-3">
                    <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
                    <p className="text-red-800 font-medium">{error}</p>
                  </div>
                </div>
              )}

              {showSuccess && (
                <div className="mb-6 bg-green-50 border-l-4 border-green-500 rounded-lg p-4">
                  <div className="flex items-center gap-3">
                    <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
                    <p className="text-green-800 font-medium">Inscription réussie ! Vous pouvez maintenant vous connecter.</p>
                  </div>
                </div>
              )}

              {/* Main Form Card */}
              <div className="bg-white rounded-3xl shadow-xl p-8 md:p-10">
                
                {/* Tabs */}
                <div className="flex gap-4 mb-10">
                  <button
                    onClick={() => setCurrentView('login')}
                    className={`flex-1 py-4 rounded-xl font-semibold transition-all ${
                      currentView === 'login'
                        ? 'bg-blue-600 text-white shadow-lg'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    Connexion
                  </button>
                  <button
                    onClick={() => setCurrentView('register')}
                    className={`flex-1 py-4 rounded-xl font-semibold transition-all ${
                      currentView === 'register'
                        ? 'bg-blue-600 text-white shadow-lg'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    Inscription
                  </button>
                </div>

            {currentView === 'login' ? (
              <div className="space-y-7">
                {/* Email Field */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-3">
                    Adresse Email
                  </label>
                  <input
                    type="email"
                    value={loginData.email}
                    onChange={(e) => setLoginData({...loginData, email: e.target.value})}
                    className="w-full px-5 py-4 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all text-gray-900 placeholder-gray-400"
                    placeholder="votre.email@amnal.dz"
                  />
                </div>

                {/* Password Field */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-3">
                    Mot de passe
                  </label>
                  <input
                    type="password"
                    value={loginData.password}
                    onChange={(e) => setLoginData({...loginData, password: e.target.value})}
                    className="w-full px-5 py-4 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all text-gray-900 placeholder-gray-400"
                    placeholder="Entrez votre mot de passe"
                  />
                </div>

                {/* Login Button */}
                <button
                  onClick={handleLogin}
                  disabled={loading}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-4 rounded-xl transition-all shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed mt-8"
                >
                  {loading ? 'Connexion en cours...' : 'Se connecter'}
                </button>
              </div>
            ) : (
              <div className="space-y-6">
                {/* Name Field */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-3">
                    Nom complet
                  </label>
                  <input
                    type="text"
                    value={registerData.nom}
                    onChange={(e) => setRegisterData({...registerData, nom: e.target.value})}
                    className="w-full px-5 py-4 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all text-gray-900 placeholder-gray-400"
                    placeholder="Ahmed Benali"
                  />
                </div>

                {/* Email Field */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-3">
                    Adresse Email
                  </label>
                  <input
                    type="email"
                    value={registerData.email}
                    onChange={(e) => setRegisterData({...registerData, email: e.target.value})}
                    className="w-full px-5 py-4 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all text-gray-900 placeholder-gray-400"
                    placeholder="votre.email@amnal.dz"
                  />
                </div>

                {/* Password Field */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-3">
                    Mot de passe
                  </label>
                  <input
                    type="password"
                    value={registerData.password}
                    onChange={(e) => setRegisterData({...registerData, password: e.target.value})}
                    className="w-full px-5 py-4 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all text-gray-900 placeholder-gray-400"
                    placeholder="Minimum 8 caractères"
                  />
                </div>

                {/* Department Field */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-3">
                    Département
                  </label>
                  <select
                    value={registerData.departement}
                    onChange={(e) => setRegisterData({...registerData, departement: e.target.value})}
                    className="w-full px-5 py-4 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all text-gray-900 bg-white cursor-pointer"
                  >
                    <option value="">Sélectionner votre département...</option>
                    {departements.map(dept => (
                      <option key={dept} value={dept}>{dept}</option>
                    ))}
                  </select>
                </div>

                {/* Register Button */}
                <button
                  onClick={handleRegister}
                  disabled={loading}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-4 rounded-xl transition-all shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed mt-8"
                >
                  {loading ? 'Inscription en cours...' : 'S\'inscrire'}
                </button>
              </div>
            )}
            </div>

            {/* Footer */}
            <div className="text-center mt-8 text-gray-500 text-sm">
              © 2025 AMNAL - Tous droits réservés
            </div>
          </div>
        </div>
      </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div className="text-center flex-1">
            <h1 className="text-4xl font-bold text-gray-800 mb-2">
              Système de Gestion IT
            </h1>
            <p className="text-gray-600">Bienvenue, {user.nom}</p>
          </div>
          <button
            onClick={logout}
            className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
          >
            <LogOut className="w-5 h-5" />
            Déconnexion
          </button>
        </div>

        {/* No view switcher - users create tickets, admins manage them */}

        {error && (
          <div className="mb-6 bg-red-50 border border-red-300 rounded-lg p-4 text-red-800">
            {error}
          </div>
        )}

        {showSuccess && (
          <div className="mb-6 bg-green-50 border border-green-300 rounded-lg p-4 flex items-center gap-3">
            <CheckCircle className="w-6 h-6 text-green-600" />
            <div>
              <h3 className="font-semibold text-green-800">Ticket créé avec succès !</h3>
              <p className="text-green-700 text-sm">Un technicien va traiter votre demande dans les plus brefs délais.</p>
            </div>
          </div>
        )}

        {user && user.role === 'user' ? (
          <div className="max-w-4xl mx-auto">
            <div className="bg-white rounded-2xl shadow-xl p-8">
              <h2 className="text-2xl font-bold text-gray-800 mb-8 flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                  <AlertCircle className="w-6 h-6 text-blue-600" />
                </div>
                Nouvelle Déclaration
              </h2>

              <div className="space-y-6">
                {/* Nom */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nom *
                  </label>
                  <input
                    type="text"
                    value={user.nom || ''}
                    disabled
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-gray-50 text-gray-600"
                    placeholder="Ex: Ahmed Benali"
                  />
                </div>

                {/* Type de Matériel */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    Type de Matériel *
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    {typesMateriels.map(({ value, label, icon: Icon }) => (
                      <button
                        key={value}
                        type="button"
                        onClick={() => setFormData({...formData, materiel: value})}
                        className={`p-4 rounded-lg border-2 flex items-center gap-3 transition-all ${
                          formData.materiel === value
                            ? 'border-blue-500 bg-blue-50 text-blue-700'
                            : 'border-gray-300 hover:border-blue-300 bg-white'
                        }`}
                      >
                        <Icon className="w-5 h-5" />
                        <span className="text-sm font-medium">{label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Type de Panne */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Type de Panne *
                  </label>
                  <select
                    name="typePanne"
                    value={formData.typePanne}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-gray-700"
                  >
                    <option value="">Sélectionner...</option>
                    {typesPannes.map(panne => (
                      <option key={panne} value={panne}>{panne}</option>
                    ))}
                  </select>
                </div>

                {/* Priorité */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    Priorité *
                  </label>
                  <div className="grid grid-cols-4 gap-3">
                    {['basse', 'normale', 'haute', 'urgente'].map(p => (
                      <button
                        key={p}
                        type="button"
                        onClick={() => setFormData({...formData, priorite: p})}
                        className={`py-3 px-4 rounded-lg border-2 text-sm font-medium capitalize transition-all ${
                          formData.priorite === p
                            ? 'border-blue-500 bg-blue-50 text-blue-700'
                            : 'border-gray-300 hover:border-blue-300 bg-white text-gray-700'
                        }`}
                      >
                        {p.charAt(0).toUpperCase() + p.slice(1)}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Description */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Description détaillée *
                  </label>
                  <textarea
                    name="description"
                    value={formData.description}
                    onChange={handleChange}
                    rows="5"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
                    placeholder="Décrivez le problème en détail..."
                  />
                </div>

                {/* Submit Button */}
                <button
                  onClick={handleSubmit}
                  disabled={loading}
                  className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-4 rounded-lg flex items-center justify-center gap-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl"
                >
                  <Send className="w-5 h-5" />
                  {loading ? 'Envoi en cours...' : 'Envoyer la Déclaration'}
                </button>
              </div>
            </div>
            
            {/* Mes Tickets Section */}
            <div className="bg-white rounded-2xl shadow-xl p-8 mt-6">
              <h2 className="text-2xl font-bold text-gray-800 mb-6">
                Mes Tickets
              </h2>

              {loading && tickets.length === 0 ? (
                <div className="text-center py-16 text-gray-500">
                  <Clock className="w-16 h-16 mx-auto mb-4 text-gray-400 animate-spin" />
                  <p className="text-lg">Chargement...</p>
                </div>
              ) : tickets.length === 0 ? (
                <div className="text-center py-16 text-gray-500">
                  <div className="w-20 h-20 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
                    <AlertCircle className="w-12 h-12 text-gray-400" />
                  </div>
                  <p className="text-lg font-medium text-gray-600">Aucun ticket pour le moment</p>
                </div>
              ) : (
                <div className="space-y-4 max-h-[600px] overflow-y-auto pr-2">
                  {tickets.map(ticket => (
                    <TicketCard key={ticket.id} ticket={ticket} isTechnicien={false} />
                  ))}
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                <Wrench className="w-6 h-6 text-indigo-600" />
                Tableau de bord Technicien
              </h2>
              <div className="flex gap-4 text-sm">
                <div className="bg-yellow-100 px-4 py-2 rounded-lg">
                  <span className="font-semibold text-yellow-800">En attente: {stats.en_attente || 0}</span>
                </div>
                <div className="bg-blue-100 px-4 py-2 rounded-lg">
                  <span className="font-semibold text-blue-800">En cours: {stats.en_cours || 0}</span>
                </div>
                <div className="bg-green-100 px-4 py-2 rounded-lg">
                  <span className="font-semibold text-green-800">Résolus: {stats.resolu || 0}</span>
                </div>
              </div>
            </div>

            {loading && tickets.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                <Clock className="w-16 h-16 mx-auto mb-4 text-gray-300 animate-spin" />
                <p>Chargement...</p>
              </div>
            ) : tickets.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                <Wrench className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                <p>Aucun ticket à traiter</p>
              </div>
            ) : (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                {tickets.map(ticket => (
                  <TicketCard key={ticket.id} ticket={ticket} isTechnicien={true} />
                ))}
              </div>
            )}
          </div>
        )}

        {selectedTicket && (
          <TechnicienModal ticket={selectedTicket} onClose={() => setSelectedTicket(null)} />
        )}
      </div>
    </div>
  );
}