import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { useCepSearch } from '@/hooks/useCepSearch';
import { fetchApi } from '@/hooks/useApi';
import { Loader2, User, Users, MapPin, Calendar, Phone, Mail, CheckCircle, Building } from 'lucide-react';

const schema = z.object({
  nome: z.string().min(1, 'Nome é obrigatório'),
  sexo: z.string().min(1, 'Sexo é obrigatório'),
  dataNascimento: z.string().min(1, 'Data de nascimento é obrigatória'),
  profissao: z.string().optional(),
  naturalidade: z.string().optional(),
  email: z.string().email('Email inválido'),
  telefone: z.string().min(1, 'Telefone é obrigatório'),
  cep: z.string().optional(),
  estado: z.string().optional(),
  cidade: z.string().optional(),
  endereco: z.string().optional(),
  bairro: z.string().optional(),
  numero: z.string().optional(),
  complemento: z.string().optional(),
  estadoCivil: z.string().optional(),
  rg: z.string().optional(),
  cpf: z.string().optional(),
  nomeMae: z.string().min(1, 'Nome da mãe é obrigatório'),
  maeFalecida: z.boolean(),
  nascimentoMae: z.string().optional(),
  naturalidadeMae: z.string().optional(),
  estadoCivilMae: z.string().optional(),
  profissaoMae: z.string().optional(),
  mesmoEnderecoMae: z.boolean(),
  nomePai: z.string().min(1, 'Nome do pai é obrigatório'),
  paiFalecido: z.boolean(),
  nascimentoPai: z.string().optional(),
  naturalidadePai: z.string().optional(),
  estadoCivilPai: z.string().optional(),
  profissaoPai: z.string().optional(),
  mesmoEnderecoPai: z.boolean(),
});

interface FichaBatismoFormProps {
  eventoId: number;
  eventoTitulo: string;
  filialNome?: string;
  filialId: number;
  empresaId: number;
}

export const FichaBatismoForm: React.FC<FichaBatismoFormProps> = ({
  eventoId,
  eventoTitulo,
  filialNome,
  filialId,
  empresaId
}) => {
  const { toast } = useToast();
  const { searchCep, isLoading: isLoadingCep } = useCepSearch();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [userEmail, setUserEmail] = useState('');

  const form = useForm<z.infer<typeof schema>>({
    resolver: zodResolver(schema),
    defaultValues: {
      nome: '',
      sexo: '',
      dataNascimento: '',
      email: '',
      telefone: '',
      nomeMae: '',
      maeFalecida: false,
      mesmoEnderecoMae: true,
      nomePai: '',
      paiFalecido: false,
      mesmoEnderecoPai: true,
    }
  });

  const handleCepChange = async (cep: string) => {
    // Formatar CEP enquanto digita
    const formattedCep = cep.replace(/\D/g, '').replace(/(\d{5})(\d)/, '$1-$2');
    form.setValue('cep', formattedCep);

    // Buscar endereço quando CEP estiver completo
    if (cep.replace(/\D/g, '').length === 8) {
      const cepData = await searchCep(cep);

      if (cepData) {
        form.setValue('endereco', cepData.logradouro);
        form.setValue('bairro', cepData.bairro);
        form.setValue('cidade', cepData.localidade);
        form.setValue('estado', cepData.uf);

        toast({
          title: 'Endereço encontrado',
          description: 'Os campos de endereço foram preenchidos automaticamente.',
        });
      } else {
        toast({
          title: 'CEP não encontrado',
          description: 'Verifique o CEP digitado e preencha o endereço manualmente.',
          variant: 'destructive',
        });
      }
    }
  };

  const onSubmit = async (values: z.infer<typeof schema>) => {
    setIsSubmitting(true);

    try {
      // Preparar payload com EmpresaId e FilialId
      const payload = {
        nome: values.nome,
        sexo: values.sexo,
        dataNascimento: values.dataNascimento,
        telefone: values.telefone,
        email: values.email,
        eventoId: eventoId,
        empresaId: empresaId, // Incluindo EmpresaId
        filialId: filialId,   // Incluindo FilialId
        nomeMae: values.nomeMae,
        nomePai: values.nomePai,
        maeFalecida: values.maeFalecida,
        paiFalecido: values.paiFalecido,
        mesmoEnderecoMae: values.mesmoEnderecoMae,
        mesmoEnderecoPai: values.mesmoEnderecoPai,
        nascimentoMae: values.nascimentoMae || null,
        nascimentoPai: values.nascimentoPai || null,
        naturalidade: values.naturalidade || null,
        naturalidadeMae: values.naturalidadeMae || null,
        naturalidadePai: values.naturalidadePai || null,
        profissao: values.profissao || null,
        endereco: values.endereco || null,
        numero: values.numero || null,
        bairro: values.bairro || null,
        cidade: values.cidade || null,
        estado: values.estado || null,
        cep: values.cep || null,
        complemento: values.complemento || null,
        estadoCivil: values.estadoCivil || null,
        rg: values.rg || null,
        cpf: values.cpf || null,
        estadoCivilMae: values.estadoCivilMae || null,
        profissaoMae: values.profissaoMae || null,
        estadoCivilPai: values.estadoCivilPai || null,
        profissaoPai: values.profissaoPai || null
      };

      // Fazer requisição sem token para endpoint público
      const response = await fetchApi(`/${filialId}/FichaInscricaoBatismos`, undefined, {
        method: 'POST',
        body: JSON.stringify(payload),
      });

      setUserEmail(values.email);
      setIsSuccess(true);
      form.reset();

    } catch (error) {
      toast({
        title: 'Erro ao enviar inscrição',
        description: 'Tente novamente mais tarde.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleNewInscription = () => {
    setIsSuccess(false);
    setUserEmail('');
    form.reset();
  };

  // Tela de sucesso
  if (isSuccess) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <Card className="max-w-lg mx-auto w-full shadow-xl">
          <CardContent className="pt-8 text-center">
            <div className="mb-6">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="h-8 w-8 text-green-600" />
              </div>
              <h2 className="text-2xl font-bold text-gray-800 mb-3">Pré-inscrição Realizada!</h2>
              <p className="text-gray-600 mb-6">
                Sua pré-inscrição para o batismo foi enviada com sucesso.
              </p>
            </div>

            <div className="bg-gray-50 rounded-lg p-4 mb-6 text-left">
              <div className="flex items-start gap-3">
                <Mail className="h-5 w-5 text-gray-500 mt-0.5" />
                <div>
                  <p className="text-sm text-gray-600">
                    Um email de confirmação foi enviado para{' '}
                    <span className="font-semibold text-gray-800">{userEmail}</span>{' '}
                    com todas as informações necessárias.
                  </p>
                </div>
              </div>
            </div>

            <Button
              onClick={handleNewInscription}
              className="w-full bg-blue-600 hover:bg-blue-700"
              size="lg"
            >
              Fazer nova inscrição
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-4 sm:py-8">
      <div className="container mx-auto px-4 max-w-4xl">
        <Card className="shadow-xl">
          <CardHeader className="text-center pb-4 sm:pb-6">
            <CardTitle className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-800">
              Ficha de Inscrição - Batismo
            </CardTitle>
            <p className="text-sm sm:text-base text-gray-600 mt-2">{eventoTitulo}</p>
            {filialNome && (
              <div className="flex items-center justify-center gap-2 mt-3">
                <Building className="h-4 w-4 text-blue-600" />
                <p className="text-sm font-medium text-blue-700">{filialNome}</p>
              </div>
            )}
          </CardHeader>
          <CardContent className="p-4 sm:p-6">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 sm:space-y-6">

                {/* Dados Pessoais */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2 mb-4">
                    <User className="h-5 w-5 text-blue-600" />
                    <h3 className="text-lg font-semibold text-gray-800">Dados Pessoais</h3>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
                    <FormField
                      control={form.control}
                      name="nome"
                      render={({ field }) => (
                        <FormItem className="md:col-span-2">
                          <FormLabel>Nome Completo *</FormLabel>
                          <FormControl>
                            <Input placeholder="Nome completo" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="sexo"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Sexo *</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Selecione" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="Masculino">Masculino</SelectItem>
                              <SelectItem value="Feminino">Feminino</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="dataNascimento"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="flex items-center gap-1">
                            <Calendar className="w-4 h-4" />
                            Data de Nascimento *
                          </FormLabel>
                          <FormControl>
                            <Input type="date" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="profissao"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Profissão</FormLabel>
                          <FormControl>
                            <Input placeholder="Sua profissão" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="naturalidade"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Naturalidade</FormLabel>
                          <FormControl>
                            <Input placeholder="Cidade onde nasceu" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>

                <Separator />

                {/* Contato */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2 mb-4">
                    <Phone className="h-5 w-5 text-blue-600" />
                    <h3 className="text-lg font-semibold text-gray-800">Contato</h3>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
                    <FormField
                      control={form.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="flex items-center gap-1">
                            <Mail className="w-4 h-4" />
                            Email *
                          </FormLabel>
                          <FormControl>
                            <Input type="email" placeholder="seu@email.com" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="telefone"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Telefone *</FormLabel>
                          <FormControl>
                            <Input placeholder="(11) 99999-9999" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>

                <Separator />

                {/* Endereço */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2 mb-4">
                    <MapPin className="h-5 w-5 text-blue-600" />
                    <h3 className="text-lg font-semibold text-gray-800">Endereço</h3>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3 sm:gap-4">
                    <FormField
                      control={form.control}
                      name="cep"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>CEP</FormLabel>
                          <FormControl>
                            <div className="relative">
                              <Input
                                placeholder="00000-000"
                                value={field.value}
                                onChange={(e) => handleCepChange(e.target.value)}
                                maxLength={9}
                              />
                              {isLoadingCep && (
                                <Loader2 className="h-4 w-4 animate-spin absolute right-3 top-1/2 transform -translate-y-1/2" />
                              )}
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="cidade"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Cidade</FormLabel>
                          <FormControl>
                            <Input placeholder="Sua cidade" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="estado"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Estado</FormLabel>
                          <FormControl>
                            <Input placeholder="SP" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="endereco"
                      render={({ field }) => (
                        <FormItem className="md:col-span-2">
                          <FormLabel>Endereço</FormLabel>
                          <FormControl>
                            <Input placeholder="Rua, Avenida..." {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="numero"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Número</FormLabel>
                          <FormControl>
                            <Input placeholder="123" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="bairro"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Bairro</FormLabel>
                          <FormControl>
                            <Input placeholder="Seu bairro" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="complemento"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Complemento</FormLabel>
                          <FormControl>
                            <Input placeholder="Apto, casa..." {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>

                <Separator />

                {/* Dados da Mãe */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2 mb-4">
                    <Users className="h-5 w-5 text-pink-600" />
                    <h3 className="text-lg font-semibold text-gray-800">Dados da Mãe</h3>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
                    <FormField
                      control={form.control}
                      name="nomeMae"
                      render={({ field }) => (
                        <FormItem className="md:col-span-2">
                          <FormLabel>Nome da Mãe *</FormLabel>
                          <FormControl>
                            <Input placeholder="Nome completo da mãe" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="maeFalecida"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 md:col-span-2">
                          <div className="space-y-0.5">
                            <FormLabel className="text-sm">Mãe falecida?</FormLabel>
                          </div>
                          <FormControl>
                            <Switch
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="nascimentoMae"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Data de Nascimento</FormLabel>
                          <FormControl>
                            <Input type="date" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="naturalidadeMae"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Naturalidade</FormLabel>
                          <FormControl>
                            <Input placeholder="Cidade onde nasceu" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>

                <Separator />

                {/* Dados do Pai */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2 mb-4">
                    <Users className="h-5 w-5 text-blue-600" />
                    <h3 className="text-lg font-semibold text-gray-800">Dados do Pai</h3>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
                    <FormField
                      control={form.control}
                      name="nomePai"
                      render={({ field }) => (
                        <FormItem className="md:col-span-2">
                          <FormLabel>Nome do Pai *</FormLabel>
                          <FormControl>
                            <Input placeholder="Nome completo do pai" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="paiFalecido"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 md:col-span-2">
                          <div className="space-y-0.5">
                            <FormLabel className="text-sm">Pai falecido?</FormLabel>
                          </div>
                          <FormControl>
                            <Switch
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="nascimentoPai"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Data de Nascimento</FormLabel>
                          <FormControl>
                            <Input type="date" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="naturalidadePai"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Naturalidade</FormLabel>
                          <FormControl>
                            <Input placeholder="Cidade onde nasceu" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>

                <div className="pt-4 sm:pt-6">
                  <Button
                    disabled={isSubmitting}
                    type="submit"
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 sm:py-3"
                    size="lg"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Enviando inscrição...
                      </>
                    ) : (
                      'Finalizar Inscrição'
                    )}
                  </Button>
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
