import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Calendar, Lock, Mail, Eye, EyeOff } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useAuth } from '@/hooks/useAuth';
import { login } from '@/services/autenticacao/autenticacao.service';
import { saveToken, saveRefreshToken, saveTokenExpiration } from '@/services/http';

export default function Login() {
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();

  React.useEffect(() => {
    if (isAuthenticated) {
      navigate('/');
    }
  }, [isAuthenticated, navigate]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

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
      const data = await login({ email, senha });

      if (data.token) {
        saveToken(data.token);
        saveRefreshToken(data.refreshToken);
        saveTokenExpiration(data.dataExpiracao);
        setError('');
        await new Promise(resolve => setTimeout(resolve, 500));
        window.location.href = '/agendaparoquial/';
      } else if (data.erros && data.erros.length > 0) {
        setError(data.erros.join(', '));
      } else {
        setError('Erro na resposta do servidor. Tente novamente');
      }
    } catch (error) {
      console.error('Erro no login:', error);

      if (error instanceof TypeError && error.message.includes('fetch')) {
        setError('Erro de conexão. Verifique sua internet e tente novamente');
      } else if (error instanceof Error) {
        if (error.message.includes('401')) {
          setError('Email ou senha incorretos. Tente novamente');
        } else if (error.message.includes('403')) {
          setError('Acesso negado. Entre em contato com o administrador');
        } else if (error.message.includes('Failed to connect') || error.message.includes('conexão')) {
          setError('Não foi possível conectar ao servidor. Tente novamente em alguns minutos');
        } else {
          setError('Erro ao fazer login. Tente novamente');
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
          <div className="mx-auto w-32 h-32 flex items-center justify-center">
            <img
              src="lovable-uploads/logo.png"
              alt="Calendário Paroquial"
              className="h-32 w-32 object-contain"
            />
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
