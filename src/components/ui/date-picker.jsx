'use client';

import { Popover as PopoverPrimitive } from '@base-ui/react/popover';
import { format } from 'date-fns';
import { CalendarDays, ChevronDown } from 'lucide-react';
import { forwardRef, useMemo, useState } from 'react';
import { cn } from '../../lib/utils.js';
import { Calendar } from './calendar.jsx';

export const DatePicker = forwardRef(function DatePicker({
  value = '',
  onChange,
  onBlur,
  min,
  max,
  placeholder = 'Choose a date',
  displayFormat = 'dd MMM yyyy',
  clearable = false,
  className,
  calendarProps,
  disabled = false,
  ...props
}, ref) {
  const [open, setOpen] = useState(false);
  const selected = useMemo(() => fromISODate(value), [value]);
  const minimum = useMemo(() => fromISODate(min), [min]);
  const maximum = useMemo(() => fromISODate(max), [max]);
  const disabledDates = useMemo(() => {
    if (minimum && maximum) return [{ before: minimum }, { after: maximum }];
    if (minimum) return { before: minimum };
    if (maximum) return { after: maximum };
    return undefined;
  }, [maximum, minimum]);

  function selectDate(nextDate) {
    if (!nextDate) return;
    onChange?.(toISODate(nextDate));
    setOpen(false);
    onBlur?.();
  }

  function changeOpen(nextOpen) {
    setOpen(nextOpen);
    if (!nextOpen) onBlur?.();
  }

  return (
    <PopoverPrimitive.Root open={open} onOpenChange={changeOpen}>
      <PopoverPrimitive.Trigger
        render={(
          <button
            ref={ref}
            type="button"
            className={cn('ui-date-picker__trigger', className)}
            disabled={disabled}
            {...props}
          />
        )}
      >
        <CalendarDays size={17} aria-hidden="true" />
        <span className={selected ? '' : 'is-placeholder'}>
          {selected ? format(selected, displayFormat) : placeholder}
        </span>
        <ChevronDown className="ui-date-picker__chevron" size={16} aria-hidden="true" />
      </PopoverPrimitive.Trigger>
      <PopoverPrimitive.Portal>
        <PopoverPrimitive.Positioner className="ui-date-picker__positioner" sideOffset={8} align="start">
          <PopoverPrimitive.Popup className="ui-date-picker__popup">
            <Calendar
              {...calendarProps}
              mode="single"
              selected={selected}
              onSelect={selectDate}
              disabled={[calendarProps?.disabled, disabledDates].filter(Boolean)}
              defaultMonth={selected || minimum || undefined}
              startMonth={minimum || undefined}
              endMonth={maximum || undefined}
            />
            {clearable && value && (
              <div className="ui-date-picker__footer">
                <PopoverPrimitive.Close
                  className="ui-date-picker__clear"
                  onClick={() => onChange?.('')}
                >
                  Clear date
                </PopoverPrimitive.Close>
              </div>
            )}
          </PopoverPrimitive.Popup>
        </PopoverPrimitive.Positioner>
      </PopoverPrimitive.Portal>
    </PopoverPrimitive.Root>
  );
});

function fromISODate(value) {
  if (!value) return undefined;
  const [year, month, day] = String(value).slice(0, 10).split('-').map(Number);
  if (!year || !month || !day) return undefined;
  return new Date(year, month - 1, day);
}

function toISODate(value) {
  const year = value.getFullYear();
  const month = String(value.getMonth() + 1).padStart(2, '0');
  const day = String(value.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}
