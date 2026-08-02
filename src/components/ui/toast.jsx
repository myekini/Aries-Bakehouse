'use client';

import { Toast as ToastPrimitive } from '@base-ui/react/toast';
import {
  CheckCircle2,
  CircleAlert,
  Info,
  LoaderCircle,
  TriangleAlert,
  X,
} from 'lucide-react';

const manager = ToastPrimitive.createToastManager();

function normalizeOptions(options, type) {
  if (typeof options === 'string') return { title: options, type };
  return {
    ...options,
    type: options?.type || type,
    priority: options?.priority || ((options?.type || type) === 'error' ? 'high' : 'low'),
    timeout: options?.timeout ?? ((options?.type || type) === 'loading' ? 0 : undefined),
  };
}

function normalizePromiseState(options, type) {
  if (typeof options === 'function') {
    return (value) => normalizeOptions(options(value), type);
  }
  return normalizeOptions(options, type);
}

export const toast = {
  add(options) {
    return manager.add(normalizeOptions(options, options?.type || 'info'));
  },
  close(id) {
    manager.close(id);
  },
  update(id, options) {
    manager.update(id, options);
  },
  success(title, options = {}) {
    return manager.add(normalizeOptions({ ...options, title }, 'success'));
  },
  info(title, options = {}) {
    return manager.add(normalizeOptions({ ...options, title }, 'info'));
  },
  warning(title, options = {}) {
    return manager.add(normalizeOptions({ ...options, title }, 'warning'));
  },
  error(title, options = {}) {
    return manager.add(normalizeOptions({ ...options, title }, 'error'));
  },
  loading(title, options = {}) {
    return manager.add(normalizeOptions({ ...options, title }, 'loading'));
  },
  promise(promise, options) {
    return manager.promise(promise, {
      loading: normalizePromiseState(options.loading, 'loading'),
      success: normalizePromiseState(options.success, 'success'),
      error: normalizePromiseState(options.error, 'error'),
    });
  },
};

const TYPE_ICONS = {
  success: CheckCircle2,
  info: Info,
  warning: TriangleAlert,
  error: CircleAlert,
  loading: LoaderCircle,
};

function ToastList() {
  const { toasts } = ToastPrimitive.useToastManager();

  return toasts.map((item) => {
    const Icon = TYPE_ICONS[item.type] || Info;
    return (
      <ToastPrimitive.Root
        key={item.id}
        toast={item}
        className="ui-toast"
        swipeDirection={['right', 'down']}
      >
        <Icon
          className={`ui-toast__icon${item.type === 'loading' ? ' is-loading' : ''}`}
          size={18}
          aria-hidden="true"
        />
        <ToastPrimitive.Content className="ui-toast__content">
          <ToastPrimitive.Title className="ui-toast__title" />
          <ToastPrimitive.Description className="ui-toast__description" />
        </ToastPrimitive.Content>
        <ToastPrimitive.Action className="ui-toast__action" />
        <ToastPrimitive.Close className="ui-toast__close" aria-label="Dismiss notification">
          <X size={15} aria-hidden="true" />
        </ToastPrimitive.Close>
      </ToastPrimitive.Root>
    );
  });
}

export function Toaster() {
  return (
    <ToastPrimitive.Provider toastManager={manager} timeout={5000} limit={4}>
      <ToastPrimitive.Portal>
        <ToastPrimitive.Viewport className="ui-toast-viewport">
          <ToastList />
        </ToastPrimitive.Viewport>
      </ToastPrimitive.Portal>
    </ToastPrimitive.Provider>
  );
}
