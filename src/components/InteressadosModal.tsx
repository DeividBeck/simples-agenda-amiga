import React, { useState } from 'react';
import { Plus, Search, Edit, Trash2, Users, Loader, Phone, Mail, MapPin } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { useInteressados, useDeleteInteressado } from '@/hooks/api/useInteressados';
import { useToast } from '@/hooks/use-toast';
import { Interessado } from '@/types/api';
import { EditInteressadoModal } from './EditInteressadoModal';
import { CreateInteressadoModal } from './CreateInteressadoModal';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from '@/components/ui/alert-dialog';

interface InteressadosModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export const InteressadosModal: React.FC<InteressadosModalProps> = ({ isOpen, onClose }) => {
    const { toast } = useToast();
    const [searchTerm, setSearchTerm] = useState('');
    const [editingInteressado, setEditingInteressado] = useState<Interessado | null>(null);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [deletingInteressado, setDeletingInteressado] = useState<Interessado | null>(null);

    const { data: interessados, isLoading, error } = useInteressados();
    const deleteInteressado = useDeleteInteressado();

    const filteredInteressados = interessados?.filter(i =>
        i.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
        i.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        i.telefone.includes(searchTerm) ||
        i.documento.includes(searchTerm)
    ) || [];

    const handleDelete = async () => {
        if (!deletingInteressado) return;

        try {
            await deleteInteressado.mutateAsync(deletingInteressado.id);
            toast({
                title: "Interessado excluído",
                description: "O interessado foi removido com sucesso.",
            });
            setDeletingInteressado(null);
        } catch (error) {
            toast({
                title: "Erro ao excluir",
                description: "Não foi possível excluir o interessado.",
                variant: "destructive",
            });
        }
    };

    const handleClose = () => {
        setSearchTerm('');
        setEditingInteressado(null);
        setShowCreateModal(false);
        setDeletingInteressado(null);
        onClose();
    };

    return (
        <>
            <Dialog open={isOpen} onOpenChange={handleClose}>
                <DialogContent className="sm:max-w-5xl w-[95vw] max-w-[95vw] max-h-[88vh] overflow-y-auto mx-auto">
                    <DialogHeader>
                        <DialogTitle className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <Users className="h-5 w-5" />
                                Gerenciar Interessados
                                {interessados && (
                                    <Badge variant="secondary">{interessados.length}</Badge>
                                )}
                            </div>
                            <Button
                                onClick={() => setShowCreateModal(true)}
                                size="sm"
                                className="bg-blue-600 hover:bg-blue-700"
                            >
                                <Plus className="h-4 w-4 mr-2" />
                                Novo Interessado
                            </Button>
                        </DialogTitle>
                    </DialogHeader>

                    <div className="space-y-4">
                        {/* Search */}
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                            <Input
                                placeholder="Buscar por nome, email, telefone..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="pl-10"
                            />
                        </div>

                        {/* Content */}
                        {isLoading ? (
                            <div className="flex items-center justify-center py-12">
                                <Loader className="h-8 w-8 animate-spin text-blue-600" />
                            </div>
                        ) : error ? (
                            <div className="text-center py-12 text-red-500">
                                Erro ao carregar interessados
                            </div>
                        ) : filteredInteressados.length === 0 ? (
                            <Card>
                                <CardContent className="text-center py-8">
                                    <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                                    <h3 className="text-lg font-medium text-gray-600 mb-2">
                                        {searchTerm ? 'Nenhum interessado encontrado' : 'Nenhum interessado cadastrado'}
                                    </h3>
                                    <p className="text-gray-500">
                                        {searchTerm ? 'Tente buscar por outro termo' : 'Crie o primeiro interessado para começar'}
                                    </p>
                                </CardContent>
                            </Card>
                        ) : (
                            <div className="overflow-x-auto border rounded-lg">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Nome</TableHead>
                                            <TableHead>Documento</TableHead>
                                            <TableHead>Contato</TableHead>
                                            <TableHead>Endereço</TableHead>
                                            <TableHead className="text-right">Ações</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {filteredInteressados.map((interessado) => (
                                            <TableRow key={interessado.id}>
                                                <TableCell className="font-medium">{interessado.nome}</TableCell>
                                                <TableCell>{interessado.documento || '-'}</TableCell>
                                                <TableCell>
                                                    <div className="flex flex-col gap-1 text-sm">
                                                        {interessado.telefone && (
                                                            <span className="flex items-center gap-1">
                                                                <Phone className="h-3 w-3" />
                                                                {interessado.telefone}
                                                            </span>
                                                        )}
                                                        {interessado.email && (
                                                            <span className="flex items-center gap-1">
                                                                <Mail className="h-3 w-3" />
                                                                {interessado.email}
                                                            </span>
                                                        )}
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    {interessado.cidade ? (
                                                        <span className="flex items-center gap-1 text-sm">
                                                            <MapPin className="h-3 w-3" />
                                                            {interessado.cidade}{interessado.estado ? `, ${interessado.estado}` : ''}
                                                        </span>
                                                    ) : '-'}
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    <div className="flex justify-end gap-2">
                                                        <Button
                                                            variant="outline"
                                                            size="sm"
                                                            onClick={() => setEditingInteressado(interessado)}
                                                        >
                                                            <Edit className="h-4 w-4" />
                                                        </Button>
                                                        <Button
                                                            variant="outline"
                                                            size="sm"
                                                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                                            onClick={() => setDeletingInteressado(interessado)}
                                                        >
                                                            <Trash2 className="h-4 w-4" />
                                                        </Button>
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </div>
                        )}
                    </div>
                </DialogContent>
            </Dialog>

            {/* Create Modal */}
            {showCreateModal && (
                <CreateInteressadoModal
                    open={showCreateModal}
                    onClose={() => setShowCreateModal(false)}
                />
            )}

            {/* Edit Modal */}
            {editingInteressado && (
                <EditInteressadoModal
                    interessado={editingInteressado}
                    open={!!editingInteressado}
                    onClose={() => setEditingInteressado(null)}
                />
            )}

            {/* Delete Confirmation */}
            <AlertDialog open={!!deletingInteressado} onOpenChange={() => setDeletingInteressado(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
                        <AlertDialogDescription>
                            Tem certeza que deseja excluir o interessado "{deletingInteressado?.nome}"?
                            Esta ação não pode ser desfeita.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleDelete}
                            className="bg-red-600 hover:bg-red-700"
                        >
                            {deleteInteressado.isPending ? (
                                <Loader className="h-4 w-4 animate-spin" />
                            ) : (
                                'Excluir'
                            )}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    );
};
