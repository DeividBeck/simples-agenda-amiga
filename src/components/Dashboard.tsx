import React, { useState } from 'react';
import { Calendar, Plus, Settings, List, Filter, Menu, MapPin, Users, Building2, Loader, Share2, Lock, LogOut, ChevronDown, User, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { EventosList } from './EventosList';
import { InscricoesList } from './InscricoesList';
import { ReservasList } from './ReservasList';
import { CreateEventoModal } from './CreateEventoModal';
import { CreateSalaModal } from './CreateSalaModal';
import { EditEventoModal } from './EditEventoModal';
import { ViewEventoModal } from './ViewEventoModal';
import { EditSalaModal } from './EditSalaModal';
import { TiposEventosModal } from './TiposEventosModal';
import { TiposSalasModal } from './TiposSalasModal';
import { TiposSelectionModal } from './TiposSelectionModal';
import { NotificationsDropdown } from './NotificationsDropdown';
import { InteressadosModal } from './InteressadosModal';
import { FullCalendarView } from './FullCalendarView';
import { PWAInstallBanner } from './PWAInstallBanner';
import { useEventos, useTiposEventos, useTiposDeSalas, useSalas, useSalasPendentes } from '@/hooks/useApi';
import { useReservas } from '@/hooks/api/useReservas';
import { useAuth } from '@/hooks/useAuth';
import { useIsMobile } from '@/hooks/use-mobile';
import { useClaims } from '@/hooks/useClaims';
import { CadastroUsuarioModal } from './CadastroUsuarioModal';
import { ChangePasswordModal } from './ChangePasswordModal';
import { ENivelCompartilhamento, Evento, Sala } from '@/types/api';
import { useToast } from '@/hooks/use-toast';
import Login from '@/pages/Login';
import { useNavigate } from 'react-router-dom';
export const Dashboard = () => {
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const [activeTab, setActiveTab] = useState('calendar');

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showCreateSalaModal, setShowCreateSalaModal] = useState(false);
  const [showTiposSelectionModal, setShowTiposSelectionModal] = useState(false);
  const [showTiposEventosModal, setShowTiposEventosModal] = useState(false);
  const [showTiposSalasModal, setShowTiposSalasModal] = useState(false);
  const [showCadastroUsuarioModal, setShowCadastroUsuarioModal] = useState(false);
  const [showChangePasswordModal, setShowChangePasswordModal] = useState(false);

  const [showInteressadosModal, setShowInteressadosModal] = useState(false);
  const [editingEvento, setEditingEvento] = useState<Evento | null>(null);
  const [viewingEvento, setViewingEvento] = useState<Evento | null>(null);
  const [editingSala, setEditingSala] = useState<Sala | null>(null);
  const [filtroCompartilhamento, setFiltroCompartilhamento] = useState<ENivelCompartilhamento | undefined>(undefined);
  const [createEventDate, setCreateEventDate] = useState<Date | undefined>(undefined);
  const [createSalaDate, setCreateSalaDate] = useState<Date | undefined>(undefined);
  const {
    token,
    filiais,
    filialSelecionada,
    setFilialSelecionada,
    tokenData,
    isAuthenticated,
    isChangingFilial,
    logout
  } = useAuth();
  const {
    canReadEventos,
    canCreateEventos,
    canEditEventos,
    canReadSalas,
    canCreateSalas,
    isAdmin
  } = useClaims();
  const {
    toast
  } = useToast();


  // Verificar se o usuário pode acessar o calendário (eventos OU salas)
  const canAccessCalendar = canReadEventos() || canReadSalas();

  // Buscar dados apenas se o usuário tem permissão para cada tipo
  const {
    data: eventos,
    isLoading: eventosLoading,
    error: eventosError
  } = useEventos(undefined, canReadEventos());
  const {
    data: salas,
    isLoading: salasLoading,
    error: salasError
  } = useSalas();
  const {
    data: tiposDeSalas
  } = useTiposDeSalas();
  const {
    data: salasPendentes
  } = useSalasPendentes();

  const {
    data: reservas,
    isLoading: reservasLoading
  } = useReservas();

  // if (!token && !isAuthenticated) {
  //   return <Login />;
  // }
  // Se não há token, redirecionar para login
  React.useEffect(() => {
    const oToken = localStorage.getItem('authToken');
    if (oToken) {
      const base64Url = oToken.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(
        atob(base64)
          .split('')
          .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
          .join('')
      );
      const payload = JSON.parse(jsonPayload);

      // Verificar se o token não está expirado
      const now = Math.floor(Date.now() / 1000);
      if (payload.exp && payload.exp < now) {
        localStorage.removeItem('authToken');
        localStorage.removeItem('filialSelecionada');
        navigate('/login', { replace: true });
        return;
      }
    } else {
      navigate('/login', { replace: true });
      return;
    }
  }, [token, isAuthenticated]);

  // Mostrar loading enquanto verifica autenticação
  if (!token || !isAuthenticated) {
    return <div className="min-h-screen bg-gradient-to-br from-primary/5 to-secondary/10 flex items-center justify-center">
      <div className="flex items-center space-x-2">
        <Loader className="h-6 w-6 animate-spin" />
        <span>Verificando autenticação...</span>
      </div>
    </div>;
  }
  const eventosComInscricao = eventos?.filter(evento => evento.inscricaoAtiva && evento.slug) || [];

  // Se está trocando de filial, mostrar tela de loading
  if (isChangingFilial) {
    return <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
      <Card className="w-96">
        <CardContent className="p-6 text-center">
          <div className="flex items-center justify-center mb-4">
            <Loader className="h-8 w-8 animate-spin text-blue-600 mr-2" />
            <Building2 className="h-8 w-8 text-blue-600" />
          </div>
          <h2 className="text-xl font-bold mb-2">Alterando Filial</h2>
          <p className="text-gray-600 mb-4">
            Carregando dados da filial selecionada...
          </p>
          <div className="text-sm text-gray-500">
            {filiais.find(f => f.id === filialSelecionada)?.nome}
          </div>
        </CardContent>
      </Card>
    </div>;
  }

  // Se não está autenticado, mostrar tela de login ou carregamento
  if (!isAuthenticated) {
    return <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
      <Card className="w-96">
        <CardContent className="p-6 text-center">
          <Calendar className="h-16 w-16 mx-auto mb-4 text-blue-600" />
          <h2 className="text-xl font-bold mb-2">Sistema de Agenda Paroquial</h2>
          <p className="text-gray-600 mb-4">
            Inicializando sistema...
          </p>
        </CardContent>
      </Card>
    </div>;
  }
  const handleCreateEvento = (date?: Date) => {
    if (!canCreateEventos()) {
      toast({
        title: "Acesso negado",
        description: "Você não tem permissão para criar eventos.",
        variant: "destructive"
      });
      return;
    }
    setCreateEventDate(date);
    setShowCreateModal(true);
  };
  const handleCreateSala = (date?: Date) => {
    if (!canCreateSalas()) {
      toast({
        title: "Acesso negado",
        description: "Você não tem permissão para criar salas.",
        variant: "destructive"
      });
      return;
    }
    setCreateSalaDate(date);
    setShowCreateSalaModal(true);
  };

  // Função para visualizar evento (apenas leitura)
  const handleViewEvento = (evento: Evento) => {
    setViewingEvento(evento);
  };

  // Função para editar evento (se tiver permissão)
  const handleEditEvento = (evento: Evento) => {
    if (!canEditEventos()) {
      // Se não pode editar, apenas visualizar
      handleViewEvento(evento);
      return;
    }
    setEditingEvento(evento);
  };
  const handleEditSala = (sala: Sala) => {
    setEditingSala(sala);
  };
  const handleCloseCreateModal = () => {
    setShowCreateModal(false);
    setCreateEventDate(undefined);
  };
  const handleCloseCreateSalaModal = () => {
    setShowCreateSalaModal(false);
    setCreateSalaDate(undefined);
  };
  const handleCloseEditModal = () => {
    setEditingEvento(null);
  };
  const handleCloseViewModal = () => {
    setViewingEvento(null);
  };
  const handleCloseEditSalaModal = () => {
    setEditingSala(null);
  };
  const handleTiposClick = () => {
    setShowTiposSelectionModal(true);
  };
  const handleSelectEventos = () => {
    setShowTiposSelectionModal(false);
    setShowTiposEventosModal(true);
  };
  const handleSelectSalas = () => {
    setShowTiposSelectionModal(false);
    setShowTiposSalasModal(true);
  };
  const handleFilialChange = async (value: string) => {
    const newFilialId = parseInt(value);
    await setFilialSelecionada(newFilialId);
  };

  // Mobile Actions Component
  const MobileActions = () => <Sheet>
    <SheetTrigger asChild>
      <Button size="sm" className="bg-blue-600 hover:bg-blue-700 text-white shadow-lg md:hidden">
        <Menu className="h-4 w-4" />
      </Button>
    </SheetTrigger>
    <SheetContent side="right" className="w-80 p-0">
      <div className="flex flex-col h-full">
        {/* Header */}
        <div className="p-6 border-b bg-gradient-to-r from-blue-50 to-indigo-50">
          <div className="flex items-center gap-2 mb-2">
            <Calendar className="h-5 w-5 text-blue-600" />
            <h2 className="text-lg font-semibold">Menu</h2>
          </div>
          <p className="text-sm text-gray-600">{tokenData?.name}</p>
        </div>

        {/* Content */}
        <div className="flex-1 p-6 space-y-6 overflow-y-auto">
          {/* Configurações de Visualização */}
          <div className="space-y-4">
            <h3 className="text-sm font-medium text-gray-900 uppercase tracking-wide">Visualização</h3>

            {filiais.length > 1 && <div className="space-y-2">
              <label className="text-sm font-medium">Filial</label>
              <Select value={filialSelecionada.toString()} onValueChange={handleFilialChange}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecionar filial" />
                </SelectTrigger>
                <SelectContent className="z-50 bg-white">
                  {filiais.map(filial => <SelectItem key={filial.id} value={filial.id.toString()}>
                    {filial.nome}
                  </SelectItem>)}
                </SelectContent>
              </Select>
            </div>}

            {canReadEventos() && <div className="space-y-2">
              <label className="text-sm font-medium">Filtrar por nível</label>
              <Select value={filtroCompartilhamento?.toString() || 'all'} onValueChange={value => setFiltroCompartilhamento(value === 'all' ? undefined : parseInt(value) as ENivelCompartilhamento)}>
                <SelectTrigger>
                  <SelectValue placeholder="Filtrar" />
                </SelectTrigger>
                <SelectContent className="z-50 bg-white">
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="0">Local</SelectItem>
                  <SelectItem value="1">Entre Paróquias</SelectItem>
                  <SelectItem value="2">Diocese</SelectItem>
                </SelectContent>
              </Select>
            </div>}
          </div>


          {/* Ações de Criar */}
          <div className="space-y-4">
            <h3 className="text-sm font-medium text-gray-900 uppercase tracking-wide">Criar</h3>

            <div className="grid gap-2">
              {canCreateEventos() ? <Button onClick={() => handleCreateEvento()} className="w-full justify-start bg-blue-600 hover:bg-blue-700 text-white">
                <Calendar className="h-4 w-4 mr-3" />
                Novo Evento
              </Button> : <Button disabled className="w-full justify-start" variant="outline">
                <Lock className="h-4 w-4 mr-3" />
                Novo Evento (sem permissão)
              </Button>}

              {canCreateSalas() ? <Button onClick={() => handleCreateSala()} className="w-full justify-start bg-green-600 hover:bg-green-700 text-white">
                <MapPin className="h-4 w-4 mr-3" />
                Nova Sala
              </Button> : <Button disabled className="w-full justify-start" variant="outline">
                <Lock className="h-4 w-4 mr-3" />
                Nova Sala (sem permissão)
              </Button>}
            </div>
          </div>

          {/* Configurações do Sistema */}
          <div className="space-y-4">
            <h3 className="text-sm font-medium text-gray-900 uppercase tracking-wide">Sistema</h3>

            <div className="grid gap-2">
              <Button onClick={() => setShowInteressadosModal(true)} variant="outline" className="w-full justify-start">
                <Users className="h-4 w-4 mr-3" />
                Gerenciar Interessados
              </Button>

              <Button onClick={handleTiposClick} variant="outline" className="w-full justify-start">
                <Settings className="h-4 w-4 mr-3" />
                Gerenciar Tipos
              </Button>

              {isAdmin() && <Button onClick={() => setShowCadastroUsuarioModal(true)} variant="outline" className="w-full justify-start">
                <Users className="h-4 w-4 mr-3" />
                Cadastrar Usuário
              </Button>}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t bg-gray-50 space-y-2">
          <Button onClick={() => setShowChangePasswordModal(true)} variant="outline" className="w-full justify-start">
            <Lock className="h-4 w-4 mr-3" />
            Alterar Senha
          </Button>

          <Button onClick={logout} variant="outline" className="w-full justify-start text-red-600 border-red-200 hover:bg-red-50">
            <LogOut className="h-4 w-4 mr-3" />
            Sair do Sistema
          </Button>
        </div>
      </div>
    </SheetContent>
  </Sheet>;
  return <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
    {/* Header responsivo */}
    <div className="bg-white/80 backdrop-blur-sm border-b border-white/20 sticky top-0 z-10">
      <div className="container mx-auto px-4 py-3 sm:py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
            <Calendar className="h-6 w-6 sm:h-8 sm:w-8 text-blue-600 flex-shrink-0" />
            <div className="min-w-0">
              <h1 className="text-lg sm:text-2xl font-bold text-gray-800 truncate">Calendário Paroquial</h1>
              <div className="flex items-center gap-2 text-xs sm:text-sm text-gray-600">
                <span className="hidden sm:block">
                  {tokenData?.EmpresaName}
                </span>
                {filiais.length > 0 && <>
                  <span className="hidden sm:block">•</span>
                  <span className="flex items-center gap-1">
                    <Building2 className="h-3 w-3" />
                    {filiais.find(f => f.id === filialSelecionada)?.nome}
                  </span>
                </>}
              </div>
            </div>
          </div>

          {/* Desktop Actions */}
          <div className="hidden md:flex items-center gap-3">
            {/* Filtros e Configurações de Visualização */}
            <div className="flex items-center gap-2">
              {filiais.length > 1 && <div className="flex items-center gap-2 bg-white/70 backdrop-blur-sm rounded-lg px-3 py-2 border border-white/30">
                <Building2 className="h-4 w-4 text-gray-600" />
                <Select value={filialSelecionada.toString()} onValueChange={handleFilialChange}>
                  <SelectTrigger className="w-36 border-0 bg-transparent focus:ring-0">
                    <SelectValue placeholder="Filial" />
                  </SelectTrigger>
                  <SelectContent>
                    {filiais.map(filial => <SelectItem key={filial.id} value={filial.id.toString()}>
                      {filial.nome}
                    </SelectItem>)}
                  </SelectContent>
                </Select>
              </div>}

              {canReadEventos() && <div className="flex items-center gap-2 bg-white/70 backdrop-blur-sm rounded-lg px-3 py-2 border border-white/30">
                <Filter className="h-4 w-4 text-gray-600" />
                <Select value={filtroCompartilhamento?.toString() || 'all'} onValueChange={value => setFiltroCompartilhamento(value === 'all' ? undefined : parseInt(value) as ENivelCompartilhamento)}>
                  <SelectTrigger className="w-32 border-0 bg-transparent focus:ring-0">
                    <SelectValue placeholder="Filtrar" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos</SelectItem>
                    <SelectItem value="0">Local</SelectItem>
                    <SelectItem value="1">Entre Paróquias</SelectItem>
                    <SelectItem value="2">Diocese</SelectItem>
                  </SelectContent>
                </Select>
              </div>}
            </div>

            {/* Notificações Dropdown - apenas para admins */}
            {isAdmin() && <NotificationsDropdown />}

            {/* Ações de Criação */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button size="sm" className="bg-blue-600 hover:bg-blue-700 text-white shadow-lg">
                  <Plus className="h-4 w-4 mr-2" />
                  Criar
                  <ChevronDown className="h-4 w-4 ml-2" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="z-50 bg-white min-w-[200px]">
                <DropdownMenuLabel>Criar Novo</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {canCreateEventos() ? <DropdownMenuItem onClick={() => handleCreateEvento()}>
                  <Calendar className="h-4 w-4 mr-2" />
                  Novo Evento
                </DropdownMenuItem> : <DropdownMenuItem disabled>
                  <Lock className="h-4 w-4 mr-2" />
                  Novo Evento (sem permissão)
                </DropdownMenuItem>}
                {canCreateSalas() ? <DropdownMenuItem onClick={() => handleCreateSala()}>
                  <MapPin className="h-4 w-4 mr-2" />
                  Nova Sala
                </DropdownMenuItem> : <DropdownMenuItem disabled>
                  <Lock className="h-4 w-4 mr-2" />
                  Nova Sala (sem permissão)
                </DropdownMenuItem>}
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Configurações do Sistema */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="bg-white/70 backdrop-blur-sm border-white/30 hover:bg-white/90">
                  <Settings className="h-4 w-4 mr-2" />
                  Configurações
                  <ChevronDown className="h-4 w-4 ml-2" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="z-50 bg-white min-w-[200px]">
                <DropdownMenuLabel>Sistema</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => setShowInteressadosModal(true)}>
                  <Users className="h-4 w-4 mr-2" />
                  Gerenciar Interessados
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleTiposClick}>
                  <Settings className="h-4 w-4 mr-2" />
                  Gerenciar Tipos
                </DropdownMenuItem>
                {isAdmin() && <DropdownMenuItem onClick={() => setShowCadastroUsuarioModal(true)}>
                  <Users className="h-4 w-4 mr-2" />
                  Cadastrar Usuário
                </DropdownMenuItem>}
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Perfil do Usuário */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="bg-white/70 backdrop-blur-sm border-white/30 hover:bg-white/90">
                  <User className="h-4 w-4 mr-2" />
                  Perfil
                  <ChevronDown className="h-4 w-4 ml-2" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="z-50 bg-white min-w-[200px]">
                <DropdownMenuLabel>{tokenData?.name || 'Usuário'}</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => setShowChangePasswordModal(true)}>
                  <Lock className="h-4 w-4 mr-2" />
                  Alterar Senha
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={logout} className="text-red-600">
                  <LogOut className="h-4 w-4 mr-2" />
                  Sair do Sistema
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* Mobile Actions */}
          <div className="flex md:hidden items-center gap-2">
            {isAdmin() && <NotificationsDropdown />}
            <MobileActions />
          </div>
        </div>
      </div>
    </div>

    <div className="container mx-auto px-4 py-4 sm:py-6">
      {/* Banner de instalação PWA */}
      <PWAInstallBanner />

      {/* Stats Cards responsivos */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-2 sm:gap-4 mb-4 sm:mb-6">
        <Card className="bg-white/70 backdrop-blur-sm border-white/30">
          <CardContent className="p-3 sm:p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs sm:text-sm text-gray-600">Eventos</p>
                <p className="text-lg sm:text-2xl font-bold text-gray-800">
                  {!canReadEventos() ? <span className="flex items-center gap-1 text-sm">
                    <Lock className="h-4 w-4" />
                    Sem acesso
                  </span> : eventosLoading ? '...' : eventos?.length || 0}
                </p>
                {eventosError && <p className="text-xs text-red-500">Erro ao carregar</p>}
              </div>
              <Calendar className="h-6 w-6 sm:h-8 sm:w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white/70 backdrop-blur-sm border-white/30">
          <CardContent className="p-3 sm:p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs sm:text-sm text-gray-600">Salas</p>
                <p className="text-lg sm:text-2xl font-bold text-purple-600">
                  {!canReadSalas() ? <span className="flex items-center gap-1 text-sm">
                    <Lock className="h-4 w-4" />
                    Sem acesso
                  </span> : salasLoading ? '...' : salas?.length || 0}
                </p>
                {salasError && <p className="text-xs text-red-500">Erro ao carregar</p>}
              </div>
              <MapPin className="h-6 w-6 sm:h-8 sm:w-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white/70 backdrop-blur-sm border-white/30">
          <CardContent className="p-3 sm:p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs sm:text-sm text-gray-600">Inscrições</p>
                <p className="text-lg sm:text-2xl font-bold text-orange-600">
                  {!canReadEventos() ? <span className="flex items-center gap-1 text-sm">
                    <Lock className="h-4 w-4" />
                    Sem acesso
                  </span> : eventosComInscricao.length}
                </p>
              </div>
              <Users className="h-6 w-6 sm:h-8 sm:w-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Conteúdo principal responsivo */}
      <Card className="bg-white/80 backdrop-blur-sm border-white/30 shadow-xl">
        <CardContent className="p-0">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <div className="border-b border-gray-200 bg-gray-50/50 px-4 sm:px-6 py-3 rounded-t-lg">
              <TabsList className="bg-white/70 backdrop-blur-sm border border-white/30 w-full sm:w-auto">
                <TabsTrigger value="calendar" className="data-[state=active]:bg-white data-[state=active]:shadow-sm flex-1 sm:flex-initial" disabled={!canAccessCalendar}>
                  <Calendar className="h-4 w-4 mr-1 sm:mr-2" />
                  <span className="text-xs sm:text-sm">Calendário</span>
                  {!canAccessCalendar && <Lock className="h-3 w-3 ml-1" />}
                </TabsTrigger>
                <TabsTrigger value="list" className="data-[state=active]:bg-white data-[state=active]:shadow-sm flex-1 sm:flex-initial" disabled={!canReadEventos()}>
                  <List className="h-4 w-4 mr-1 sm:mr-2" />
                  <span className="text-xs sm:text-sm">Lista</span>
                  {!canReadEventos() && <Lock className="h-3 w-3 ml-1" />}
                </TabsTrigger>
                <TabsTrigger value="reservas" className="data-[state=active]:bg-white data-[state=active]:shadow-sm flex-1 sm:flex-initial" disabled={!canReadEventos()}>
                  <FileText className="h-4 w-4 mr-1 sm:mr-2" />
                  <span className="text-xs sm:text-sm">Reservas</span>
                  {!canReadEventos() && <Lock className="h-3 w-3 ml-1" />}
                </TabsTrigger>
                <TabsTrigger value="inscricoes" className="data-[state=active]:bg-white data-[state=active]:shadow-sm flex-1 sm:flex-initial" disabled={!canReadEventos()}>
                  <Users className="h-4 w-4 mr-1 sm:mr-2" />
                  <span className="text-xs sm:text-sm">Inscrições</span>
                  {!canReadEventos() && <Lock className="h-3 w-3 ml-1" />}
                </TabsTrigger>
              </TabsList>
            </div>

            <TabsContent value="calendar" className="p-3 sm:p-6 m-0">
              {!canAccessCalendar ? <div className="flex items-center justify-center h-64">
                <div className="text-center">
                  <Lock className="h-16 w-16 mx-auto mb-4 text-gray-400" />
                  <h3 className="text-lg font-medium text-gray-600 mb-2">Acesso Restrito</h3>
                  <p className="text-gray-500">Você não tem permissão para visualizar o calendário.</p>
                  <p className="text-gray-400 text-sm mt-2">É necessário ter acesso a eventos ou salas.</p>
                </div>
              </div> : <FullCalendarView eventos={canReadEventos() ? eventos || [] : []} salas={canReadSalas() ? salas || [] : []} tiposDeSalas={tiposDeSalas || []} onCreateEvento={handleCreateEvento} />}
            </TabsContent>

            <TabsContent value="list" className="p-3 sm:p-6 m-0">
              {!canReadEventos() ? <div className="flex items-center justify-center h-64">
                <div className="text-center">
                  <Lock className="h-16 w-16 mx-auto mb-4 text-gray-400" />
                  <h3 className="text-lg font-medium text-gray-600 mb-2">Acesso Restrito</h3>
                  <p className="text-gray-500">Você não tem permissão para visualizar eventos.</p>
                </div>
              </div> : <EventosList eventos={eventos || []} isLoading={eventosLoading} onEditEvento={handleEditEvento} />}
            </TabsContent>

            <TabsContent value="reservas" className="p-3 sm:p-6 m-0">
              {!canReadEventos() ? <div className="flex items-center justify-center h-64">
                <div className="text-center">
                  <Lock className="h-16 w-16 mx-auto mb-4 text-gray-400" />
                  <h3 className="text-lg font-medium text-gray-600 mb-2">Acesso Restrito</h3>
                  <p className="text-gray-500">Você não tem permissão para visualizar reservas.</p>
                </div>
              </div> : <ReservasList reservas={reservas || []} isLoading={reservasLoading} />}
            </TabsContent>

            <TabsContent value="inscricoes" className="p-3 sm:p-6 m-0">
              {!canReadEventos() ? <div className="flex items-center justify-center h-64">
                <div className="text-center">
                  <Lock className="h-16 w-16 mx-auto mb-4 text-gray-400" />
                  <h3 className="text-lg font-medium text-gray-600 mb-2">Acesso Restrito</h3>
                  <p className="text-gray-500">Você não tem permissão para visualizar inscrições.</p>
                </div>
              </div> : <InscricoesList eventos={eventos || []} />}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>

    {/* Modais */}
    {showCadastroUsuarioModal && <CadastroUsuarioModal isOpen={showCadastroUsuarioModal} onClose={() => setShowCadastroUsuarioModal(false)} />}

    <CreateEventoModal isOpen={showCreateModal} onClose={handleCloseCreateModal} initialDate={createEventDate} />

    <CreateSalaModal isOpen={showCreateSalaModal} onClose={handleCloseCreateSalaModal} initialDate={createSalaDate} />

    {/* Modal de Edição - apenas quando pode editar */}
    <EditEventoModal isOpen={!!editingEvento} onClose={handleCloseEditModal} evento={editingEvento} />

    {/* Modal de Visualização - apenas quando pode apenas ler */}
    <ViewEventoModal isOpen={!!viewingEvento} onClose={handleCloseViewModal} evento={viewingEvento} canEdit={false} />

    <EditSalaModal isOpen={!!editingSala} onClose={handleCloseEditSalaModal} sala={editingSala} />

    <TiposSelectionModal isOpen={showTiposSelectionModal} onClose={() => setShowTiposSelectionModal(false)} onSelectEventos={handleSelectEventos} onSelectSalas={handleSelectSalas} />

    <TiposEventosModal isOpen={showTiposEventosModal} onClose={() => setShowTiposEventosModal(false)} />

    <TiposSalasModal isOpen={showTiposSalasModal} onClose={() => setShowTiposSalasModal(false)} />



    <ChangePasswordModal isOpen={showChangePasswordModal} onClose={() => setShowChangePasswordModal(false)} />

    <InteressadosModal isOpen={showInteressadosModal} onClose={() => setShowInteressadosModal(false)} />

  </div>;
};