
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Calendar, LogIn } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export const LoginRequired = () => {
  const navigate = useNavigate();
  
  const handleRedirectToLogin = () => {
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardContent className="p-8 text-center">
          <Calendar className="h-16 w-16 mx-auto mb-6 text-blue-600" />
          <h1 className="text-2xl font-bold mb-4 text-gray-800">
            Calendário Paroquial
          </h1>
          <p className="text-gray-600 mb-6">
            Você precisa estar logado para acessar o sistema de calendário paroquial.
          </p>
          <Button 
            onClick={handleRedirectToLogin}
            className="w-full"
          >
            <LogIn className="h-4 w-4 mr-2" />
            Fazer Login
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};
