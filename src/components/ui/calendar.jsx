'use client';

import { ChevronDown, ChevronLeft, ChevronRight, ChevronUp } from 'lucide-react';
import { DayPicker, getDefaultClassNames } from 'react-day-picker';
import { cn } from '../../lib/utils.js';

export function Calendar({
  className,
  classNames,
  showOutsideDays = true,
  captionLayout = 'label',
  components,
  ...props
}) {
  const defaults = getDefaultClassNames();

  return (
    <DayPicker
      showOutsideDays={showOutsideDays}
      captionLayout={captionLayout}
      className={cn('ui-calendar', className)}
      classNames={{
        root: cn(defaults.root, 'ui-calendar__root'),
        months: cn(defaults.months, 'ui-calendar__months'),
        month: cn(defaults.month, 'ui-calendar__month'),
        month_caption: cn(defaults.month_caption, 'ui-calendar__caption'),
        caption_label: cn(defaults.caption_label, 'ui-calendar__caption-label'),
        dropdowns: cn(defaults.dropdowns, 'ui-calendar__dropdowns'),
        dropdown_root: cn(defaults.dropdown_root, 'ui-calendar__dropdown-root'),
        dropdown: cn(defaults.dropdown, 'ui-calendar__dropdown'),
        nav: cn(defaults.nav, 'ui-calendar__nav'),
        button_previous: cn(defaults.button_previous, 'ui-calendar__nav-button'),
        button_next: cn(defaults.button_next, 'ui-calendar__nav-button'),
        month_grid: cn(defaults.month_grid, 'ui-calendar__grid'),
        weekdays: cn(defaults.weekdays, 'ui-calendar__weekdays'),
        weekday: cn(defaults.weekday, 'ui-calendar__weekday'),
        week: cn(defaults.week, 'ui-calendar__week'),
        day: cn(defaults.day, 'ui-calendar__day'),
        day_button: cn(defaults.day_button, 'ui-calendar__day-button'),
        today: cn(defaults.today, 'is-today'),
        selected: cn(defaults.selected, 'is-selected'),
        outside: cn(defaults.outside, 'is-outside'),
        disabled: cn(defaults.disabled, 'is-disabled'),
        range_start: cn(defaults.range_start, 'is-range-start'),
        range_middle: cn(defaults.range_middle, 'is-range-middle'),
        range_end: cn(defaults.range_end, 'is-range-end'),
        ...classNames,
      }}
      components={{
        Chevron: CalendarChevron,
        ...components,
      }}
      {...props}
    />
  );
}

function CalendarChevron({ orientation, className }) {
  const Icon = orientation === 'left'
    ? ChevronLeft
    : orientation === 'up'
      ? ChevronUp
      : orientation === 'down'
        ? ChevronDown
        : ChevronRight;

  return <Icon className={className} size={16} aria-hidden="true" />;
}
