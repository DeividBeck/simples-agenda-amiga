import React from 'react';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { DateTimePicker } from '@mui/x-date-pickers/DateTimePicker';
import dayjs, { Dayjs } from 'dayjs';
import 'dayjs/locale/pt-br';

dayjs.locale('pt-br');

interface MuiDatePickerProps {
  value: Date | null | undefined;
  onChange: (date: Date | null) => void;
  label?: string;
  disabled?: boolean;
  minDate?: Date;
  maxDate?: Date;
  className?: string;
}

export const MuiDatePickerField: React.FC<MuiDatePickerProps> = ({
  value,
  onChange,
  label,
  disabled = false,
  minDate,
  maxDate,
  className,
}) => {
  const handleChange = (newValue: Dayjs | null) => {
    onChange(newValue ? newValue.toDate() : null);
  };

  return (
    <LocalizationProvider dateAdapter={AdapterDayjs} adapterLocale="pt-br">
      <DatePicker
        value={value ? dayjs(value) : null}
        onChange={handleChange}
        label={label}
        disabled={disabled}
        minDate={minDate ? dayjs(minDate) : undefined}
        maxDate={maxDate ? dayjs(maxDate) : undefined}
        slotProps={{
          textField: {
            size: 'small',
            fullWidth: true,
            className,
            sx: {
              '& .MuiOutlinedInput-root': {
                borderRadius: '0.5rem',
                backgroundColor: 'hsl(var(--background))',
                '& fieldset': {
                  borderColor: 'hsl(var(--border))',
                },
                '&:hover fieldset': {
                  borderColor: 'hsl(var(--ring))',
                },
                '&.Mui-focused fieldset': {
                  borderColor: 'hsl(var(--ring))',
                },
              },
              '& .MuiInputLabel-root': {
                color: 'hsl(var(--muted-foreground))',
              },
              '& .MuiInputBase-input': {
                color: 'hsl(var(--foreground))',
              },
            },
          },
          popper: {
            sx: {
              zIndex: 9999,
              '& .MuiPaper-root': {
                backgroundColor: 'hsl(var(--background))',
                border: '1px solid hsl(var(--border))',
                borderRadius: '0.5rem',
                boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
              },
              '& .MuiPickersDay-root': {
                color: 'hsl(var(--foreground))',
                '&:hover': {
                  backgroundColor: 'hsl(var(--accent))',
                },
                '&.Mui-selected': {
                  backgroundColor: 'hsl(var(--primary))',
                  color: 'hsl(var(--primary-foreground))',
                },
              },
              '& .MuiDayCalendar-weekDayLabel': {
                color: 'hsl(var(--muted-foreground))',
              },
              '& .MuiPickersCalendarHeader-label': {
                color: 'hsl(var(--foreground))',
              },
              '& .MuiIconButton-root': {
                color: 'hsl(var(--foreground))',
              },
              '& .MuiPickersYear-yearButton': {
                color: 'hsl(var(--foreground))',
                '&.Mui-selected': {
                  backgroundColor: 'hsl(var(--primary))',
                  color: 'hsl(var(--primary-foreground))',
                },
              },
              '& .MuiPickersMonth-monthButton': {
                color: 'hsl(var(--foreground))',
                '&.Mui-selected': {
                  backgroundColor: 'hsl(var(--primary))',
                  color: 'hsl(var(--primary-foreground))',
                },
              },
            },
          },
        }}
      />
    </LocalizationProvider>
  );
};

interface MuiDateTimePickerProps {
  value: Date | null | undefined;
  onChange: (date: Date | null) => void;
  label?: string;
  disabled?: boolean;
  minDate?: Date;
  maxDate?: Date;
  className?: string;
}

export const MuiDateTimePickerField: React.FC<MuiDateTimePickerProps> = ({
  value,
  onChange,
  label,
  disabled = false,
  minDate,
  maxDate,
  className,
}) => {
  const handleChange = (newValue: Dayjs | null) => {
    onChange(newValue ? newValue.toDate() : null);
  };

  return (
    <LocalizationProvider dateAdapter={AdapterDayjs} adapterLocale="pt-br">
      <DateTimePicker
        value={value ? dayjs(value) : null}
        onChange={handleChange}
        label={label}
        disabled={disabled}
        minDateTime={minDate ? dayjs(minDate) : undefined}
        maxDateTime={maxDate ? dayjs(maxDate) : undefined}
        ampm={false}
        slotProps={{
          textField: {
            size: 'small',
            fullWidth: true,
            className,
            sx: {
              '& .MuiOutlinedInput-root': {
                borderRadius: '0.5rem',
                backgroundColor: 'hsl(var(--background))',
                '& fieldset': {
                  borderColor: 'hsl(var(--border))',
                },
                '&:hover fieldset': {
                  borderColor: 'hsl(var(--ring))',
                },
                '&.Mui-focused fieldset': {
                  borderColor: 'hsl(var(--ring))',
                },
              },
              '& .MuiInputLabel-root': {
                color: 'hsl(var(--muted-foreground))',
              },
              '& .MuiInputBase-input': {
                color: 'hsl(var(--foreground))',
              },
            },
          },
          popper: {
            sx: {
              zIndex: 9999,
              '& .MuiPaper-root': {
                backgroundColor: 'hsl(var(--background))',
                border: '1px solid hsl(var(--border))',
                borderRadius: '0.5rem',
                boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
              },
              '& .MuiPickersDay-root': {
                color: 'hsl(var(--foreground))',
                '&:hover': {
                  backgroundColor: 'hsl(var(--accent))',
                },
                '&.Mui-selected': {
                  backgroundColor: 'hsl(var(--primary))',
                  color: 'hsl(var(--primary-foreground))',
                },
              },
              '& .MuiDayCalendar-weekDayLabel': {
                color: 'hsl(var(--muted-foreground))',
              },
              '& .MuiPickersCalendarHeader-label': {
                color: 'hsl(var(--foreground))',
              },
              '& .MuiIconButton-root': {
                color: 'hsl(var(--foreground))',
              },
              '& .MuiPickersYear-yearButton': {
                color: 'hsl(var(--foreground))',
                '&.Mui-selected': {
                  backgroundColor: 'hsl(var(--primary))',
                  color: 'hsl(var(--primary-foreground))',
                },
              },
              '& .MuiPickersMonth-monthButton': {
                color: 'hsl(var(--foreground))',
                '&.Mui-selected': {
                  backgroundColor: 'hsl(var(--primary))',
                  color: 'hsl(var(--primary-foreground))',
                },
              },
              '& .MuiMultiSectionDigitalClock-root': {
                color: 'hsl(var(--foreground))',
              },
              '& .MuiMultiSectionDigitalClockSection-item': {
                color: 'hsl(var(--foreground))',
                '&.Mui-selected': {
                  backgroundColor: 'hsl(var(--primary))',
                  color: 'hsl(var(--primary-foreground))',
                },
              },
            },
          },
        }}
      />
    </LocalizationProvider>
  );
};
