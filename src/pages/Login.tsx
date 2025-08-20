import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Calendar, Lock, Mail, Eye, EyeOff } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useAuth } from '@/hooks/useAuth';

// URL da API de autenticação baseada no ambiente
const AUTH_API_URL = import.meta.env.PROD 
  ? 'https://api.ecclesia.app.br/autenticacao/api/Autenticacao/LogIn'  // Produção
  : 'http://localhost:3001/api/auth/login';  // Desenvolvimento (ajuste conforme sua API local)

export default function Login() {
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();

  // Se já está autenticado, redireciona para home
  React.useEffect(() => {
    if (isAuthenticated) {
      navigate('/');
    }
  }, [isAuthenticated, navigate]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    // Validações básicas
    if (!email || !senha) {
      setError('Por favor, preencha todos os campos');
      setIsLoading(false);
      return;
    }

    if (!email.includes('@')) {
      setError('Por favor, insira um email válido');
      setIsLoading(false);
      return;
    }

    try {
      const response = await fetch(AUTH_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          senha
        })
      });

      if (!response.ok) {
        // Tratamento específico por status code
        switch (response.status) {
          case 400:
            setError('Dados inválidos. Verifique o email e senha');
            break;
          case 401:
            setError('Email ou senha incorretos. Tente novamente');
            break;
          case 403:
            setError('Acesso negado. Entre em contato com o administrador');
            break;
          case 404:
            setError('Serviço não encontrado. Tente novamente mais tarde');
            break;
          case 500:
            setError('Erro interno do servidor. Tente novamente em alguns minutos');
            break;
          case 503:
            setError('Serviço temporariamente indisponível. Tente novamente em alguns minutos');
            break;
          default:
            const errorText = await response.text();
            if (errorText.includes('Failed to connect') || errorText.includes('conexão')) {
              setError('Erro de conexão com o servidor. Verifique sua internet e tente novamente');
            } else if (errorText.includes('timeout')) {
              setError('Conexão expirou. Tente novamente');
            } else {
              setError('Erro ao fazer login. Tente novamente');
            }
        }
        return;
      }

      const data = await response.json();
      
      // Verificar se o token foi retornado
      if (data.token) {
        localStorage.setItem('authToken', data.token);
        // Mostrar mensagem de sucesso antes de redirecionar
        setError('');
        // Aguardar um momento para mostrar feedback visual
        await new Promise(resolve => setTimeout(resolve, 500));
        // Recarregar a página para atualizar o estado de autenticação
        window.location.href = '/';
      } else {
        setError('Erro na resposta do servidor. Tente novamente');
      }

    } catch (error) {
      console.error('Erro no login:', error);
      
      // Tratamento específico para diferentes tipos de erro
      if (error instanceof TypeError && error.message.includes('fetch')) {
        setError('Erro de conexão. Verifique sua internet e tente novamente');
      } else if (error instanceof Error) {
        if (error.message.includes('Failed to connect') || error.message.includes('conexão')) {
          setError('Não foi possível conectar ao servidor. Tente novamente em alguns minutos');
        } else if (error.message.includes('timeout')) {
          setError('Conexão expirou. Verifique sua internet e tente novamente');
        } else {
          setError('Erro inesperado. Tente novamente');
        }
      } else {
        setError('Erro ao processar login. Tente novamente');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 to-secondary/10 flex items-center justify-center p-4">
      <Card className="w-full max-w-md shadow-elegant">
        <CardHeader className="text-center space-y-4">
          <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
            <Calendar className="h-8 w-8 text-primary" />
          </div>
          <CardTitle className="text-2xl font-bold">
            Calendário Paroquial
          </CardTitle>
          <p className="text-muted-foreground">
            Faça login para acessar o sistema
          </p>
        </CardHeader>
        
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-4">
            {error && (
              <Alert variant="destructive" className="animate-in fade-in-50">
                <AlertDescription className="text-sm">
                  {error}
                </AlertDescription>
              </Alert>
            )}
            
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  placeholder="seu@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-10"
                  required
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="senha">Senha</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="senha"
                  type={showPassword ? "text" : "password"}
                  placeholder="sua senha"
                  value={senha}
                  onChange={(e) => setSenha(e.target.value)}
                  className="pl-10 pr-10"
                  required
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-1 top-1 h-8 w-8 p-0"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>
            
            <Button 
              type="submit" 
              className="w-full transition-all duration-200" 
              disabled={isLoading || !email || !senha}
            >
              {isLoading ? (
                <>
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent mr-2" />
                  Entrando...
                </>
              ) : (
                'Entrar'
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}