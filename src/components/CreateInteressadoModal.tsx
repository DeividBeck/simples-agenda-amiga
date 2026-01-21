import React, { useEffect, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Loader } from 'lucide-react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useCreateInteressado } from '@/hooks/api/useInteressados';
import { useToast } from '@/hooks/use-toast';
import { useCepSearch } from '@/hooks/useCepSearch';

const interessadoSchema = z.object({
    nome: z.string().min(1, 'Nome é obrigatório'),
    documento: z.string().optional(),
    cep: z.string().optional(),
    rua: z.string().optional(),
    numero: z.string().optional(),
    bairro: z.string().optional(),
    cidade: z.string().optional(),
    estado: z.string().optional(),
    pontoReferencia: z.string().optional(),
    telefone: z.string().min(1, 'Telefone é obrigatório'),
    email: z.string().email('Email inválido'),
    emailFinanceiro: z.string().email('Email inválido').optional().or(z.literal('')),
});

type InteressadoForm = z.infer<typeof interessadoSchema>;

interface CreateInteressadoModalProps {
    open: boolean;
    onClose: () => void;
}

export const CreateInteressadoModal: React.FC<CreateInteressadoModalProps> = ({
    open,
    onClose,
}) => {
    const { toast } = useToast();
    const createInteressado = useCreateInteressado();
    const { searchCep, isLoading: isSearchingCep } = useCepSearch();
    const lastSearchedCep = useRef('');

    const {
        register,
        handleSubmit,
        setValue,
        watch,
        reset,
        formState: { errors },
    } = useForm<InteressadoForm>({
        resolver: zodResolver(interessadoSchema),
        defaultValues: {
            nome: '',
            documento: '',
            cep: '',
            rua: '',
            numero: '',
            bairro: '',
            cidade: '',
            estado: '',
            pontoReferencia: '',
            telefone: '',
            email: '',
            emailFinanceiro: '',
        },
    });

    const cep = watch('cep');

    useEffect(() => {
        const cleanCep = (cep || '').replace(/\D/g, '');
        if (cleanCep.length === 8 && cleanCep !== lastSearchedCep.current) {
            lastSearchedCep.current = cleanCep;
            searchCep(cleanCep).then((data) => {
                if (data) {
                    setValue('rua', data.logradouro);
                    setValue('bairro', data.bairro);
                    setValue('cidade', data.localidade);
                    setValue('estado', data.uf);
                }
            });
        }
    }, [cep, searchCep, setValue]);

    const onSubmit = async (data: InteressadoForm) => {
        try {
            await createInteressado.mutateAsync({
                nome: data.nome,
                documento: data.documento || '',
                cep: data.cep || null,
                rua: data.rua || null,
                numero: data.numero || null,
                bairro: data.bairro || null,
                cidade: data.cidade || null,
                estado: data.estado || null,
                pontoReferencia: data.pontoReferencia || null,
                telefone: data.telefone,
                email: data.email,
                emailFinanceiro: data.emailFinanceiro || null,
            });
            toast({
                title: 'Interessado criado',
                description: 'O interessado foi cadastrado com sucesso.',
            });
            reset();
            onClose();
        } catch (error) {
            toast({
                title: 'Erro ao criar',
                description: 'Não foi possível cadastrar o interessado.',
                variant: 'destructive',
            });
        }
    };

    return (
        <Dialog open={open} onOpenChange={onClose}>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Novo Interessado</DialogTitle>
                </DialogHeader>

                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="md:col-span-2">
                            <Label htmlFor="nome">Nome Completo/Razão Social *</Label>
                            <Input id="nome" {...register('nome')} />
                            {errors.nome && (
                                <span className="text-sm text-red-500">{errors.nome.message}</span>
                            )}
                        </div>

                        <div>
                            <Label htmlFor="documento">Documento (CPF/CNPJ)*</Label>
                            <Input id="documento" {...register('documento')} />
                        </div>

                        <div>
                            <Label htmlFor="telefone">Telefone *</Label>
                            <Input id="telefone" {...register('telefone')} />
                            {errors.telefone && (
                                <span className="text-sm text-red-500">{errors.telefone.message}</span>
                            )}
                        </div>

                        <div>
                            <Label htmlFor="email">Email *</Label>
                            <Input id="email" type="email" {...register('email')} />
                            {errors.email && (
                                <span className="text-sm text-red-500">{errors.email.message}</span>
                            )}
                        </div>

                        <div>
                            <Label htmlFor="emailFinanceiro">Email Financeiro</Label>
                            <Input id="emailFinanceiro" type="email" {...register('emailFinanceiro')} />
                        </div>

                        <div className="md:col-span-2 border-t pt-4 mt-2">
                            <h3 className="font-medium mb-3">Endereço</h3>
                        </div>

                        <div>
                            <Label htmlFor="cep">CEP</Label>
                            <div className="relative">
                                <Input id="cep" {...register('cep')} placeholder="00000-000" />
                                {isSearchingCep && (
                                    <Loader className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin" />
                                )}
                            </div>
                        </div>

                        <div>
                            <Label htmlFor="estado">Estado</Label>
                            <Input id="estado" {...register('estado')} />
                        </div>

                        <div>
                            <Label htmlFor="cidade">Cidade</Label>
                            <Input id="cidade" {...register('cidade')} />
                        </div>

                        <div>
                            <Label htmlFor="bairro">Bairro</Label>
                            <Input id="bairro" {...register('bairro')} />
                        </div>

                        <div className="md:col-span-2">
                            <Label htmlFor="rua">Rua</Label>
                            <Input id="rua" {...register('rua')} />
                        </div>

                        <div>
                            <Label htmlFor="numero">Número</Label>
                            <Input id="numero" {...register('numero')} />
                        </div>

                        <div>
                            <Label htmlFor="pontoReferencia">Ponto de Referência</Label>
                            <Input id="pontoReferencia" {...register('pontoReferencia')} />
                        </div>
                    </div>

                    <div className="flex justify-end gap-2 pt-4 border-t">
                        <Button type="button" variant="outline" onClick={onClose}>
                            Cancelar
                        </Button>
                        <Button type="submit" disabled={createInteressado.isPending}>
                            {createInteressado.isPending ? (
                                <Loader className="h-4 w-4 animate-spin mr-2" />
                            ) : null}
                            Cadastrar
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
};
