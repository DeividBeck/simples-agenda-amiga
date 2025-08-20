
import React from 'react';
import { FormControl, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const coresPredefinidas = [
  { value: '#ef4444', name: 'Vermelho' },
  { value: '#f97316', name: 'Laranja' },
  { value: '#eab308', name: 'Amarelo' },
  { value: '#22c55e', name: 'Verde' },
  { value: '#06b6d4', name: 'Ciano' },
  { value: '#3b82f6', name: 'Azul' },
  { value: '#8b5cf6', name: 'Roxo' },
  { value: '#ec4899', name: 'Rosa' },
  { value: '#6b7280', name: 'Cinza' },
  { value: '#dc2626', name: 'Vermelho Escuro' },
  { value: '#9333ea', name: 'Violeta' },
  { value: '#059669', name: 'Verde Escuro' },
];

interface ColorSelectorProps {
  value: string;
  onChange: (value: string) => void;
  label?: string;
}

export const ColorSelector: React.FC<ColorSelectorProps> = ({ value, onChange, label = "Cor" }) => {
  return (
    <FormItem>
      <FormLabel>{label}</FormLabel>
      <Select value={value} onValueChange={onChange}>
        <FormControl>
          <SelectTrigger>
            <SelectValue>
              <div className="flex items-center gap-2">
                <div 
                  className="w-4 h-4 rounded-full border border-gray-300"
                  style={{ backgroundColor: value }}
                />
                <span>{coresPredefinidas.find(c => c.value === value)?.name || 'Cor personalizada'}</span>
              </div>
            </SelectValue>
          </SelectTrigger>
        </FormControl>
        <SelectContent>
          {coresPredefinidas.map((cor) => (
            <SelectItem key={cor.value} value={cor.value}>
              <div className="flex items-center gap-2">
                <div 
                  className="w-4 h-4 rounded-full border border-gray-300"
                  style={{ backgroundColor: cor.value }}
                />
                <span>{cor.name}</span>
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <FormMessage />
    </FormItem>
  );
};
